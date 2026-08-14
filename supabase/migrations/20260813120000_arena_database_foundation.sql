-- =============================================================================
-- L'ARÈNE — Database foundation
-- =============================================================================
-- Cette migration crée le noyau du modèle de données de L'ARÈNE dans le projet
-- Supabase partagé "340-hub".
--
-- ISOLATION : tous les objets créés ici sont préfixés `arena_`. Cette migration
-- ne modifie, ne renomme et ne supprime AUCUN objet existant hors `arena_*`
-- (notamment `recruitment_leads`, qui n'est pas référencé).
--
-- CONVENTIONS :
--   * pas de type ENUM : les valeurs de statut sont des `text` + CHECK nommés.
--     Un ENUM est global au schéma (risque de collision dans une base partagée)
--     et son évolution est plus contraignante qu'un CHECK.
--   * clés primaires UUID via `gen_random_uuid()` (pgcrypto est fourni par
--     Supabase, aucune extension supplémentaire n'est requise).
--   * horodatages en `timestamptz`, `updated_at` maintenu par trigger.
-- =============================================================================


-- =============================================================================
-- 1. Fonctions utilitaires
-- =============================================================================

-- Trigger générique `updated_at`, partagé par toutes les tables arena_*.
create or replace function public.arena_set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.arena_set_updated_at() is
  'L''ARÈNE — met à jour updated_at à chaque UPDATE. Unique fonction partagée par toutes les tables arena_*.';

-- Barème disciplinaire utilisé comme 5e critère de départage.
-- Pour modifier le barème, remplacer le corps de cette fonction : les deux
-- classements (officiel et live) l'utilisent, aucune donnée n'est à recalculer.
create or replace function public.arena_discipline_weight(p_event_type text)
returns integer
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select case p_event_type
    when 'yellow_card' then 1
    when 'two_minute'  then 2
    when 'red_card'    then 3
    else 0
  end;
$$;

comment on function public.arena_discipline_weight(text) is
  'L''ARÈNE — points de pénalité par type d''événement (yellow_card=1, two_minute=2, red_card=3). Moins de points = meilleur classement.';


-- =============================================================================
-- 2. arena_events — une édition de L'ARÈNE
-- =============================================================================

create table if not exists public.arena_events (
  id                    uuid primary key default gen_random_uuid(),

  name                  text        not null,
  edition_name          text,
  event_date            date        not null,
  venue_name            text        not null,
  venue_address         text,
  city                  text,

  doors_open_at         timestamptz,
  first_match_at        timestamptz,
  expected_end_at       timestamptz,

  minimum_age           smallint    not null default 16,

  max_teams             smallint,
  min_players_per_team  smallint    not null,
  max_players_per_team  smallint    not null,

  player_fee_cents      integer     not null,
  currency              text        not null default 'EUR',

  court_count           smallint    not null default 1,

  registration_status   text        not null default 'closed',
  event_status          text        not null default 'draft',

  groups_published      boolean     not null default false,
  knockout_published    boolean     not null default false,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint arena_events_name_not_blank
    check (btrim(name) <> ''),
  constraint arena_events_registration_status_check
    check (registration_status in ('closed', 'open', 'paused', 'full')),
  constraint arena_events_event_status_check
    check (event_status in ('draft', 'registration', 'draw', 'live', 'completed', 'cancelled')),
  constraint arena_events_minimum_age_check
    check (minimum_age >= 0),
  constraint arena_events_max_teams_check
    check (max_teams is null or max_teams > 0),
  constraint arena_events_players_per_team_check
    check (min_players_per_team > 0 and max_players_per_team >= min_players_per_team),
  constraint arena_events_player_fee_check
    check (player_fee_cents >= 0),
  constraint arena_events_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint arena_events_court_count_check
    check (court_count > 0),
  constraint arena_events_schedule_check
    check (
      (doors_open_at is null or first_match_at is null or doors_open_at <= first_match_at)
      and (first_match_at is null or expected_end_at is null or first_match_at <= expected_end_at)
    )
);

comment on table public.arena_events is
  'L''ARÈNE — une édition du tournoi. Tous les paramètres de format (effectifs, tarif, terrains) vivent ici : rien n''est codé en dur dans le moteur.';

create index if not exists arena_events_event_date_idx
  on public.arena_events (event_date desc);
create index if not exists arena_events_event_status_idx
  on public.arena_events (event_status);


-- =============================================================================
-- 3. arena_teams — équipes inscrites
-- =============================================================================

create table if not exists public.arena_teams (
  id                     uuid primary key default gen_random_uuid(),
  event_id               uuid not null
    references public.arena_events (id) on delete cascade,

  name                   text        not null,
  city                   text,

  primary_color          text,
  secondary_color        text,
  logo_url               text,

  -- PII : jamais exposé publiquement (cf. vue arena_public_teams).
  captain_first_name     text        not null,
  captain_last_name      text        not null,
  captain_phone          text        not null,
  captain_email          text,

  status                 text        not null default 'draft',

  reservation_expires_at timestamptz,
  confirmed_at           timestamptz,

  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint arena_teams_name_not_blank
    check (btrim(name) <> ''),
  constraint arena_teams_status_check
    check (status in ('draft', 'pending', 'confirmed', 'waitlist', 'withdrawn', 'disqualified')),
  constraint arena_teams_primary_color_check
    check (primary_color is null or primary_color ~* '^#[0-9a-f]{6}$'),
  constraint arena_teams_secondary_color_check
    check (secondary_color is null or secondary_color ~* '^#[0-9a-f]{6}$'),

  -- Support des clés étrangères composites : garantit qu'une équipe référencée
  -- ailleurs appartient bien à l'événement déclaré.
  constraint arena_teams_id_event_id_key unique (id, event_id)
);

comment on table public.arena_teams is
  'L''ARÈNE — équipes. Contient des PII (capitaine) : lecture publique interdite, passer par public.arena_public_teams.';

create index if not exists arena_teams_event_id_idx
  on public.arena_teams (event_id);
create index if not exists arena_teams_event_status_idx
  on public.arena_teams (event_id, status);

-- Unicité du nom d'équipe, insensible à la casse, au sein d'un événement.
create unique index if not exists arena_teams_event_lower_name_key
  on public.arena_teams (event_id, lower(name));


-- =============================================================================
-- 4. arena_players — joueurs d'une équipe
-- =============================================================================

create table if not exists public.arena_players (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null
    references public.arena_teams (id) on delete cascade,

  first_name    text        not null,
  last_name     text        not null,
  date_of_birth date,

  -- PII : jamais exposé publiquement.
  phone         text        not null,
  email         text,

  shirt_number  smallint,

  role          text        not null default 'player',
  status        text        not null default 'invited',

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint arena_players_role_check
    check (role in ('player', 'goalkeeper')),
  constraint arena_players_status_check
    check (status in ('invited', 'pending', 'confirmed', 'withdrawn', 'disqualified')),
  constraint arena_players_shirt_number_check
    check (shirt_number is null or shirt_number between 1 and 99)
);

comment on table public.arena_players is
  'L''ARÈNE — joueurs. Contient des PII (téléphone, email, date de naissance) : aucune lecture publique.';

create index if not exists arena_players_team_id_idx
  on public.arena_players (team_id);
create index if not exists arena_players_phone_idx
  on public.arena_players (phone);

-- Un numéro de maillot est unique dans une équipe, lorsqu'il est renseigné.
create unique index if not exists arena_players_team_shirt_number_key
  on public.arena_players (team_id, shirt_number)
  where shirt_number is not null;


-- =============================================================================
-- 5. arena_player_invites — liens individuels (SMS) de contribution
-- =============================================================================

create table if not exists public.arena_player_invites (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid not null
    references public.arena_players (id) on delete cascade,

  phone        text        not null,

  -- Empreinte du token uniquement (ex. sha256 hex calculé côté serveur).
  -- Le token brut n'est JAMAIS stocké : il n'existe que dans le lien envoyé.
  token_hash   text        not null,

  status       text        not null default 'pending',

  expires_at   timestamptz,
  sent_at      timestamptz,
  opened_at    timestamptz,
  completed_at timestamptz,

  send_count   integer     not null default 0,
  last_sent_at timestamptz,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint arena_player_invites_status_check
    check (status in ('pending', 'sent', 'opened', 'completed', 'expired', 'cancelled')),
  constraint arena_player_invites_send_count_check
    check (send_count >= 0),
  constraint arena_player_invites_token_hash_not_blank
    check (btrim(token_hash) <> ''),
  constraint arena_player_invites_token_hash_key
    unique (token_hash)
);

comment on column public.arena_player_invites.token_hash is
  'Empreinte du token d''invitation. Le token brut ne doit jamais être stocké ni journalisé.';

create index if not exists arena_player_invites_player_id_idx
  on public.arena_player_invites (player_id);
create index if not exists arena_player_invites_status_expires_idx
  on public.arena_player_invites (status, expires_at);


-- =============================================================================
-- 6. arena_player_payments — contribution individuelle
-- =============================================================================

create table if not exists public.arena_player_payments (
  id                  uuid primary key default gen_random_uuid(),
  player_id           uuid not null
    references public.arena_players (id) on delete cascade,

  amount_cents        integer     not null,
  currency            text        not null default 'EUR',

  status              text        not null default 'pending',

  -- Identifiants opaques du prestataire. AUCUN secret/clé d'API ici.
  payment_provider    text,
  provider_payment_id text,
  checkout_reference  text,

  paid_at             timestamptz,
  refunded_at         timestamptz,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint arena_player_payments_status_check
    check (status in ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled')),
  constraint arena_player_payments_amount_check
    check (amount_cents >= 0),
  constraint arena_player_payments_currency_check
    check (currency ~ '^[A-Z]{3}$')
);

comment on table public.arena_player_payments is
  'L''ARÈNE — contributions individuelles. Ne contient que des identifiants opaques du prestataire, jamais de secret.';

create index if not exists arena_player_payments_player_id_idx
  on public.arena_player_payments (player_id);
create index if not exists arena_player_payments_status_idx
  on public.arena_player_payments (status);

-- Idempotence des webhooks prestataire.
create unique index if not exists arena_player_payments_provider_payment_key
  on public.arena_player_payments (payment_provider, provider_payment_id)
  where provider_payment_id is not null;


-- =============================================================================
-- 7. arena_meal_orders — précommandes repas (niveau équipe)
-- =============================================================================

create table if not exists public.arena_meal_orders (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null
    references public.arena_teams (id) on delete cascade,

  status         text        not null default 'draft',

  total_cents    integer     not null default 0,
  currency       text        not null default 'EUR',

  payment_status text        not null default 'unpaid',

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint arena_meal_orders_status_check
    check (status in ('draft', 'submitted', 'paid', 'cancelled', 'fulfilled')),
  constraint arena_meal_orders_payment_status_check
    check (payment_status in ('unpaid', 'pending', 'paid', 'refunded')),
  constraint arena_meal_orders_total_check
    check (total_cents >= 0),
  constraint arena_meal_orders_currency_check
    check (currency ~ '^[A-Z]{3}$')
);

create index if not exists arena_meal_orders_team_id_idx
  on public.arena_meal_orders (team_id);


-- =============================================================================
-- 8. arena_meal_order_items — lignes de précommande
-- =============================================================================

create table if not exists public.arena_meal_order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null
    references public.arena_meal_orders (id) on delete cascade,

  product_name     text        not null,
  quantity         integer     not null,
  unit_price_cents integer     not null,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint arena_meal_order_items_product_name_not_blank
    check (btrim(product_name) <> ''),
  constraint arena_meal_order_items_quantity_check
    check (quantity > 0),
  constraint arena_meal_order_items_unit_price_check
    check (unit_price_cents >= 0)
);

comment on table public.arena_meal_order_items is
  'L''ARÈNE — lignes de précommande. Le catalogue est porté par product_name : aucune colonne par type de produit.';

create index if not exists arena_meal_order_items_order_id_idx
  on public.arena_meal_order_items (order_id);


-- =============================================================================
-- 9. arena_groups — poules
-- =============================================================================

create table if not exists public.arena_groups (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null
    references public.arena_events (id) on delete cascade,

  name          text        not null,
  display_order smallint    not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint arena_groups_name_not_blank
    check (btrim(name) <> ''),
  constraint arena_groups_display_order_check
    check (display_order >= 0),

  constraint arena_groups_id_event_id_key unique (id, event_id)
);

create index if not exists arena_groups_event_id_idx
  on public.arena_groups (event_id, display_order);

create unique index if not exists arena_groups_event_lower_name_key
  on public.arena_groups (event_id, lower(name));


-- =============================================================================
-- 10. arena_group_teams — composition des poules
-- =============================================================================
-- `event_id` est dénormalisé volontairement : associé aux clés étrangères
-- composites ci-dessous, il garantit sans trigger que
--   (a) la poule et l'équipe appartiennent au MÊME événement,
--   (b) une équipe n'appartient qu'à UNE seule poule par événement.

create table if not exists public.arena_group_teams (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null,
  group_id      uuid not null,
  team_id       uuid not null,

  draw_position smallint,

  created_at    timestamptz not null default now(),

  constraint arena_group_teams_group_fk
    foreign key (group_id, event_id)
    references public.arena_groups (id, event_id) on delete cascade,
  constraint arena_group_teams_team_fk
    foreign key (team_id, event_id)
    references public.arena_teams (id, event_id) on delete cascade,

  constraint arena_group_teams_draw_position_check
    check (draw_position is null or draw_position > 0),

  -- Une équipe apparaît au plus une fois dans une poule …
  constraint arena_group_teams_group_team_key unique (group_id, team_id),
  -- … et au plus une fois dans tout l'événement (une seule poule par équipe).
  constraint arena_group_teams_event_team_key unique (event_id, team_id)
);

create index if not exists arena_group_teams_team_id_idx
  on public.arena_group_teams (team_id);

create unique index if not exists arena_group_teams_group_draw_position_key
  on public.arena_group_teams (group_id, draw_position)
  where draw_position is not null;


-- =============================================================================
-- 11. arena_matches — rencontres
-- =============================================================================

create table if not exists public.arena_matches (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null
    references public.arena_events (id) on delete cascade,
  group_id              uuid,

  match_number          integer     not null,
  phase                 text        not null,
  court_number          smallint    not null default 1,

  -- Étiquette stable du match dans le tableau final : 'QF1', 'SF1', 'FINAL',
  -- 'THIRD_PLACE'. NULL en phase de poules.
  bracket_code          text,

  -- NULL autorisé en phase finale : un match du tableau peut exister avant que
  -- les qualifiés soient connus, ses deux côtés étant alors décrits par
  -- arena_knockout_slots (A1, B2, vainqueur de QF1, …).
  -- En phase de poules, les deux équipes sont obligatoires (CHECK plus bas).
  home_team_id          uuid,
  away_team_id          uuid,

  scheduled_at          timestamptz,
  started_at            timestamptz,
  ended_at              timestamptz,

  status                text        not null default 'scheduled',

  home_score            smallint    not null default 0,
  away_score            smallint    not null default 0,

  -- Prolongation (2 x 4 min en finale). Non renseignée = pas de prolongation.
  home_extra_time_score smallint,
  away_extra_time_score smallint,

  winner_team_id        uuid,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Les FK composites imposent que poule, équipes et vainqueur appartiennent
  -- au même événement. `on delete no action` (et non `restrict`) est requis
  -- pour que la suppression en cascade d'un événement reste possible.
  constraint arena_matches_group_fk
    foreign key (group_id, event_id)
    references public.arena_groups (id, event_id) on delete cascade,
  constraint arena_matches_home_team_fk
    foreign key (home_team_id, event_id)
    references public.arena_teams (id, event_id) on delete no action,
  constraint arena_matches_away_team_fk
    foreign key (away_team_id, event_id)
    references public.arena_teams (id, event_id) on delete no action,
  constraint arena_matches_winner_team_fk
    foreign key (winner_team_id, event_id)
    references public.arena_teams (id, event_id) on delete no action,

  constraint arena_matches_event_match_number_key
    unique (event_id, match_number),
  -- Support des clés étrangères composites de arena_knockout_slots.
  constraint arena_matches_id_event_id_key
    unique (id, event_id),

  constraint arena_matches_match_number_check
    check (match_number > 0),
  constraint arena_matches_phase_check
    check (phase in ('group', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final')),
  constraint arena_matches_status_check
    check (status in ('scheduled', 'ready', 'live', 'finished', 'cancelled')),
  constraint arena_matches_court_number_check
    check (court_number > 0),
  -- Une rencontre de poule oppose toujours deux équipes connues ; seul le
  -- tableau final admet des côtés encore vides.
  constraint arena_matches_group_teams_known_check
    check (
      phase <> 'group'
      or (home_team_id is not null and away_team_id is not null)
    ),
  constraint arena_matches_distinct_teams_check
    check (
      home_team_id is null
      or away_team_id is null
      or home_team_id <> away_team_id
    ),
  constraint arena_matches_bracket_code_check
    check (bracket_code is null or bracket_code ~ '^[A-Z][A-Z0-9_]{1,19}$'),
  constraint arena_matches_group_bracket_code_check
    check (phase <> 'group' or bracket_code is null),
  constraint arena_matches_scores_check
    check (home_score >= 0 and away_score >= 0),
  constraint arena_matches_extra_time_scores_check
    check (
      (home_extra_time_score is null and away_extra_time_score is null)
      or (
        home_extra_time_score >= 0
        and away_extra_time_score >= 0
        and phase <> 'group'
      )
    ),
  -- Une rencontre de poule est rattachée à une poule ; une rencontre de phase
  -- finale ne l'est pas.
  constraint arena_matches_group_phase_check
    check (
      (phase = 'group' and group_id is not null)
      or (phase <> 'group' and group_id is null)
    ),
  constraint arena_matches_winner_check
    check (
      winner_team_id is null
      or (
        home_team_id is not null
        and away_team_id is not null
        and winner_team_id in (home_team_id, away_team_id)
      )
    ),
  constraint arena_matches_timeline_check
    check (started_at is null or ended_at is null or started_at <= ended_at)
);

comment on table public.arena_matches is
  'L''ARÈNE — rencontres. Les scores de cette table font FOI pour les classements ; arena_match_events est un journal statistique.';
comment on column public.arena_matches.home_extra_time_score is
  'Score de prolongation (2 x 4 min, finale). Le score du temps réglementaire reste dans home_score/away_score.';
comment on column public.arena_matches.bracket_code is
  'Étiquette stable dans le tableau final (QF1, QF2, QF3, QF4, SF1, SF2, FINAL, THIRD_PLACE). NULL en phase de poules.';
comment on column public.arena_matches.home_team_id is
  'NULL tant que le qualifié n''est pas connu (tableau final pré-créé). Obligatoire en phase de poules.';

create index if not exists arena_matches_event_id_idx
  on public.arena_matches (event_id);
create index if not exists arena_matches_group_id_idx
  on public.arena_matches (group_id);
create index if not exists arena_matches_status_idx
  on public.arena_matches (status);
create index if not exists arena_matches_scheduled_at_idx
  on public.arena_matches (scheduled_at);
create index if not exists arena_matches_home_team_id_idx
  on public.arena_matches (home_team_id);
create index if not exists arena_matches_away_team_id_idx
  on public.arena_matches (away_team_id);
-- Chemin d'accès du moteur de classement (poule + statut).
create index if not exists arena_matches_group_status_idx
  on public.arena_matches (group_id, status)
  where group_id is not null;
-- Étiquette du tableau final, unique par événement lorsqu'elle est renseignée.
create unique index if not exists arena_matches_event_bracket_code_key
  on public.arena_matches (event_id, bracket_code)
  where bracket_code is not null;


-- =============================================================================
-- 12. arena_match_events — journal d'événements (table de marque, speaker)
-- =============================================================================

create table if not exists public.arena_match_events (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid not null
    references public.arena_matches (id) on delete cascade,

  team_id         uuid references public.arena_teams (id) on delete set null,
  player_id       uuid references public.arena_players (id) on delete set null,

  event_type      text        not null,

  period          smallint,
  minute          smallint,
  second          smallint,

  -- Ordre fiable des événements au sein d'un match (croissant, sans trou requis).
  sequence_number integer     not null,

  metadata        jsonb       not null default '{}'::jsonb,

  created_at      timestamptz not null default now(),

  constraint arena_match_events_type_check
    check (event_type in (
      'goal', 'own_goal', 'yellow_card', 'red_card', 'two_minute',
      'assist', 'penalty_goal', 'penalty_missed', 'score_correction'
    )),
  constraint arena_match_events_period_check
    check (period is null or period > 0),
  constraint arena_match_events_minute_check
    check (minute is null or minute >= 0),
  constraint arena_match_events_second_check
    check (second is null or second between 0 and 59),
  constraint arena_match_events_sequence_number_check
    check (sequence_number > 0),
  constraint arena_match_events_match_sequence_key
    unique (match_id, sequence_number)
);

comment on table public.arena_match_events is
  'L''ARÈNE — journal d''événements du match. Source des statistiques et du calcul disciplinaire ; ne détermine pas le score officiel.';

-- (match_id) est déjà couvert par l'index unique (match_id, sequence_number).
create index if not exists arena_match_events_player_id_idx
  on public.arena_match_events (player_id);
create index if not exists arena_match_events_team_id_idx
  on public.arena_match_events (team_id);
create index if not exists arena_match_events_event_type_idx
  on public.arena_match_events (event_type);


-- =============================================================================
-- 13. arena_knockout_slots — description abstraite du tableau final
-- =============================================================================
-- Chaque côté (home / away) d'un match de phase finale est décrit par une
-- ORIGINE, indépendamment de toute équipe réelle :
--
--   * `group_position` : « 1er du groupe A » = (source_group_id, source_position)
--   * `match_winner`   : « vainqueur de QF1 » = (source_match_id)
--   * `match_loser`    : « perdant de SF1 »   = (source_match_id), pour la
--                        petite finale
--
-- Le tableau complet (QF1 = A1 vs B2, …) est donc représentable et affichable
-- AVANT le tirage au sort. Les équipes réelles n'arrivent dans
-- arena_matches.home_team_id / away_team_id qu'à la validation humaine des
-- qualifiés ; d'ici là ces colonnes restent NULL et seule la projection
-- (§ 16) donne des noms d'équipes.
--
-- Aucune donnée n'est dupliquée : les libellés (« A1 », « Vainqueur QF1 ») sont
-- dérivés à la lecture, jamais stockés.
--
-- INVARIANT non exprimable en SQL sans trigger : un match de poule ne doit pas
-- avoir de slots. Les fonctions et vues du § 16 ignorent `phase = 'group'`, et
-- arena_create_knockout_bracket() n'en crée que pour les phases finales.

create table if not exists public.arena_knockout_slots (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid        not null,
  match_id        uuid        not null,

  side            text        not null,

  source_type     text        not null,
  source_group_id uuid,
  source_position smallint,
  source_match_id uuid,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- FK composites : le match, la poule source et le match source appartiennent
  -- nécessairement au même événement que le slot.
  constraint arena_knockout_slots_match_fk
    foreign key (match_id, event_id)
    references public.arena_matches (id, event_id) on delete cascade,
  constraint arena_knockout_slots_source_group_fk
    foreign key (source_group_id, event_id)
    references public.arena_groups (id, event_id) on delete cascade,
  constraint arena_knockout_slots_source_match_fk
    foreign key (source_match_id, event_id)
    references public.arena_matches (id, event_id) on delete cascade,

  constraint arena_knockout_slots_match_side_key
    unique (match_id, side),

  constraint arena_knockout_slots_side_check
    check (side in ('home', 'away')),
  constraint arena_knockout_slots_source_type_check
    check (source_type in ('group_position', 'match_winner', 'match_loser')),
  -- Une origine renseigne exactement les colonnes qui la concernent.
  constraint arena_knockout_slots_source_shape_check
    check (
      (
        source_type = 'group_position'
        and source_group_id is not null
        and source_position is not null
        and source_match_id is null
      )
      or (
        source_type in ('match_winner', 'match_loser')
        and source_match_id is not null
        and source_group_id is null
        and source_position is null
      )
    ),
  constraint arena_knockout_slots_source_position_check
    check (source_position is null or source_position > 0),
  constraint arena_knockout_slots_no_self_reference_check
    check (source_match_id is null or source_match_id <> match_id)
);

comment on table public.arena_knockout_slots is
  'L''ARÈNE — origine abstraite de chaque côté d''un match de phase finale (A1, B2, vainqueur QF1). Permet de pré-créer le tableau avant de connaître les qualifiés.';

create index if not exists arena_knockout_slots_match_id_idx
  on public.arena_knockout_slots (match_id);
create index if not exists arena_knockout_slots_event_id_idx
  on public.arena_knockout_slots (event_id);
create index if not exists arena_knockout_slots_source_group_idx
  on public.arena_knockout_slots (source_group_id, source_position)
  where source_group_id is not null;
create index if not exists arena_knockout_slots_source_match_idx
  on public.arena_knockout_slots (source_match_id)
  where source_match_id is not null;


-- =============================================================================
-- 14. Triggers updated_at
-- =============================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'arena_events',
    'arena_teams',
    'arena_players',
    'arena_player_invites',
    'arena_player_payments',
    'arena_meal_orders',
    'arena_meal_order_items',
    'arena_groups',
    'arena_matches',
    'arena_knockout_slots'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || t || '_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.arena_set_updated_at()',
      'set_' || t || '_updated_at', t
    );
  end loop;
end;
$$;


-- =============================================================================
-- 15. MOTEUR DE CLASSEMENT
-- =============================================================================
-- Une seule implémentation, paramétrée par `p_include_live`, alimente les deux
-- classements. Ils partagent donc EXACTEMENT la même hiérarchie de départage :
--
--   1. points            (victoire 3, nul 1, défaite 0)
--   2. différence de buts
--   3. confrontation directe
--   4. buts marqués
--   5. discipline (points de pénalité croissants)
--   6. nom d'équipe puis id — départage final purement déterministe
--
-- CONFRONTATION DIRECTE — stratégie retenue (mini-championnat sur groupe d'ex æquo)
--   a. les équipes sont regroupées par (points, différence de buts) ;
--   b. si un groupe contient au moins 2 équipes, on recalcule pour chacune un
--      mini-classement limité aux rencontres jouées CONTRE les autres équipes
--      de ce groupe : head_to_head_points, puis _goal_difference, puis _goals_for ;
--   c. ces trois colonnes s'intercalent dans le tri entre la différence de buts
--      et les buts marqués.
--   Cas non séparés (ex. rencontre directe pas encore jouée) : les colonnes
--   valent 0 pour toutes les équipes concernées et le tri passe naturellement
--   au critère suivant. L'approche est en une passe, sans récursion ni boucle.
--
-- MATCHS PRIS EN COMPTE
--   * classement officiel : uniquement status = 'finished' ;
--   * classement live      : 'finished' + 'live', un match live étant compté
--     provisoirement comme s'il se terminait au score courant.
--   Seule la phase de poules est classée (phase = 'group').
-- =============================================================================

create or replace function public.arena_group_standings_core(p_include_live boolean default false)
returns table (
  event_id                     uuid,
  group_id                     uuid,
  group_name                   text,
  group_display_order          smallint,
  team_id                      uuid,
  team_name                    text,
  played                       integer,
  wins                         integer,
  draws                        integer,
  losses                       integer,
  goals_for                    integer,
  goals_against                integer,
  goal_difference              integer,
  points                       integer,
  discipline_points            integer,
  head_to_head_points          integer,
  head_to_head_goal_difference integer,
  head_to_head_goals_for       integer,
  rank                         integer,
  is_live                      boolean,
  live_match_id                uuid
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with src as (
    select m.id, m.event_id, m.group_id, m.home_team_id, m.away_team_id,
           m.home_score, m.away_score, m.status
    from public.arena_matches m
    where m.phase = 'group'
      and m.group_id is not null
      and (m.status = 'finished' or (p_include_live and m.status = 'live'))
  ),
  -- Une ligne par équipe et par match (point de vue de chaque équipe).
  sides as (
    select s.id as match_id, s.group_id,
           s.home_team_id as team_id, s.away_team_id as opponent_id,
           s.home_score as gf, s.away_score as ga, s.status
    from src s
    union all
    select s.id, s.group_id,
           s.away_team_id, s.home_team_id,
           s.away_score, s.home_score, s.status
    from src s
  ),
  -- Toutes les équipes de chaque poule, y compris celles n'ayant pas encore joué.
  members as (
    select g.event_id, g.id as group_id, g.name as group_name,
           g.display_order as group_display_order,
           gt.team_id, t.name as team_name
    from public.arena_groups g
    join public.arena_group_teams gt on gt.group_id = g.id
    join public.arena_teams t on t.id = gt.team_id
  ),
  base as (
    select m.event_id, m.group_id, m.group_name, m.group_display_order,
           m.team_id, m.team_name,
           count(sd.match_id)::integer                                 as played,
           (count(*) filter (where sd.gf > sd.ga))::integer             as wins,
           (count(*) filter (where sd.gf = sd.ga))::integer             as draws,
           (count(*) filter (where sd.gf < sd.ga))::integer             as losses,
           coalesce(sum(sd.gf), 0)::integer                             as goals_for,
           coalesce(sum(sd.ga), 0)::integer                             as goals_against,
           coalesce(sum(sd.gf - sd.ga), 0)::integer                     as goal_difference,
           (count(*) filter (where sd.gf > sd.ga) * 3
            + count(*) filter (where sd.gf = sd.ga))::integer           as points,
           coalesce(bool_or(sd.status = 'live'), false)                 as is_live,
           (array_agg(sd.match_id) filter (where sd.status = 'live'))[1] as live_match_id
    from members m
    left join sides sd
      on sd.team_id = m.team_id
     and sd.group_id = m.group_id
    group by m.event_id, m.group_id, m.group_name, m.group_display_order,
             m.team_id, m.team_name
  ),
  discipline as (
    select sd.team_id, sd.group_id,
           coalesce(sum(public.arena_discipline_weight(me.event_type)), 0)::integer
             as discipline_points
    from sides sd
    join public.arena_match_events me
      on me.match_id = sd.match_id
     and me.team_id = sd.team_id
    group by sd.team_id, sd.group_id
  ),
  -- Groupes d'équipes à départager : même total de points ET même différence de buts.
  tie_groups as (
    select b.group_id, b.points, b.goal_difference,
           array_agg(b.team_id) as team_ids
    from base b
    group by b.group_id, b.points, b.goal_difference
    having count(*) > 1
  ),
  head_to_head as (
    select b.team_id, b.group_id,
           coalesce(sum(case
             when sd.gf > sd.ga then 3
             when sd.gf = sd.ga then 1
             else 0
           end), 0)::integer          as head_to_head_points,
           coalesce(sum(sd.gf - sd.ga), 0)::integer as head_to_head_goal_difference,
           coalesce(sum(sd.gf), 0)::integer         as head_to_head_goals_for
    from base b
    join tie_groups tg
      on tg.group_id = b.group_id
     and tg.points = b.points
     and tg.goal_difference = b.goal_difference
    join sides sd
      on sd.team_id = b.team_id
     and sd.group_id = b.group_id
     and sd.opponent_id = any (tg.team_ids)
    group by b.team_id, b.group_id
  )
  select
    b.event_id,
    b.group_id,
    b.group_name,
    b.group_display_order,
    b.team_id,
    b.team_name,
    b.played,
    b.wins,
    b.draws,
    b.losses,
    b.goals_for,
    b.goals_against,
    b.goal_difference,
    b.points,
    coalesce(d.discipline_points, 0)              as discipline_points,
    coalesce(h.head_to_head_points, 0)            as head_to_head_points,
    coalesce(h.head_to_head_goal_difference, 0)   as head_to_head_goal_difference,
    coalesce(h.head_to_head_goals_for, 0)         as head_to_head_goals_for,
    (row_number() over (
      partition by b.group_id
      order by b.points desc,
               b.goal_difference desc,
               coalesce(h.head_to_head_points, 0) desc,
               coalesce(h.head_to_head_goal_difference, 0) desc,
               coalesce(h.head_to_head_goals_for, 0) desc,
               b.goals_for desc,
               coalesce(d.discipline_points, 0) asc,
               b.team_name asc,
               b.team_id asc
    ))::integer                                   as rank,
    b.is_live,
    b.live_match_id
  from base b
  left join discipline d on d.team_id = b.team_id and d.group_id = b.group_id
  left join head_to_head h on h.team_id = b.team_id and h.group_id = b.group_id
$$;

comment on function public.arena_group_standings_core(boolean) is
  'L''ARÈNE — moteur de classement des poules. p_include_live = false : classement officiel (matchs finished). true : classement provisoire (finished + live). SECURITY DEFINER : n''expose aucune PII.';


-- -----------------------------------------------------------------------------
-- 15a. Classement OFFICIEL — matchs terminés uniquement
-- -----------------------------------------------------------------------------

create or replace view public.arena_group_standings as
select
  event_id,
  group_id,
  group_name,
  group_display_order,
  team_id,
  team_name,
  played,
  wins,
  draws,
  losses,
  goals_for,
  goals_against,
  goal_difference,
  points,
  discipline_points,
  head_to_head_points,
  head_to_head_goal_difference,
  head_to_head_goals_for,
  rank
from public.arena_group_standings_core(false);

comment on view public.arena_group_standings is
  'L''ARÈNE — CLASSEMENT OFFICIEL. N''intègre que les matchs status = finished. À ne jamais mélanger avec arena_live_group_standings.';


-- -----------------------------------------------------------------------------
-- 15b. Classement LIVE — matchs terminés + matchs en cours
-- -----------------------------------------------------------------------------

create or replace view public.arena_live_group_standings as
select
  event_id,
  group_id,
  group_name,
  group_display_order,
  team_id,
  team_name,
  played,
  wins,
  draws,
  losses,
  goals_for,
  goals_against,
  goal_difference,
  points,
  discipline_points,
  head_to_head_points,
  head_to_head_goal_difference,
  head_to_head_goals_for,
  rank,
  is_live,
  live_match_id
from public.arena_group_standings_core(true);

comment on view public.arena_live_group_standings is
  'L''ARÈNE — CLASSEMENT PROVISOIRE EN DIRECT. Un match live est compté comme s''il se terminait au score courant. is_live indique une équipe actuellement en jeu.';


-- =============================================================================
-- 16. MOTEUR DE TABLEAU FINAL
-- =============================================================================
-- FORMATS SUPPORTÉS
--   * 12 équipes : 4 poules de 3
--   * 16 équipes : 4 poules de 4
--   Dans les deux cas la qualification est identique — LES 2 PREMIERS DE CHAQUE
--   POULE, soit 8 qualifiés, sans repêchage de meilleur troisième. Le tableau
--   démarre donc en quarts de finale et la matrice ci-dessous vaut pour les
--   deux formats. Le nombre d'équipes par poule n'intervient nulle part.
--
-- MATRICE DES QUARTS (V1, déterministe)
--   QF1 = A1 vs B2      SF1 = vainqueur QF1 vs vainqueur QF2
--   QF2 = C1 vs D2      SF2 = vainqueur QF3 vs vainqueur QF4
--   QF3 = B1 vs A2      FINAL = vainqueur SF1 vs vainqueur SF2
--   QF4 = D1 vs C2      THIRD_PLACE = perdant SF1 vs perdant SF2
--   A/B/C/D désignent les poules triées par (display_order, name).
--
-- TROIS LECTURES, À NE JAMAIS CONFONDRE
--   1. arena_knockout_bracket          — tableau OFFICIEL : uniquement ce qui
--      est réellement enregistré dans arena_matches. Avant validation, les
--      équipes sont NULL et seuls les libellés (A1, B2, …) sont affichables.
--   2. arena_live_knockout_projection  — PROJECTION LIVE : les slots de poule
--      sont résolus depuis arena_live_group_standings. Non définitif.
--   3. arena_knockout_qualifiers       — résolution depuis le classement
--      OFFICIEL. C'est la source de vérité du futur bouton « VALIDER LES
--      QUALIFIÉS », qui recopiera ces équipes dans arena_matches.
--
-- Le tableau officiel n'est JAMAIS figé automatiquement : rien dans cette
-- migration n'écrit dans arena_matches. Le passage projection -> officiel est
-- une action humaine explicite, côté serveur.

-- Libellé abstrait d'un slot. Fonction unique pour que « A1 » ou
-- « Vainqueur QF1 » ne soient formatés qu'à un seul endroit.
create or replace function public.arena_knockout_slot_label(
  p_source_type          text,
  p_group_name           text,
  p_source_position      smallint,
  p_source_bracket_code  text
)
returns text
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select case p_source_type
    when 'group_position' then p_group_name || p_source_position::text
    when 'match_winner'   then 'Vainqueur ' || p_source_bracket_code
    when 'match_loser'    then 'Perdant ' || p_source_bracket_code
  end;
$$;

comment on function public.arena_knockout_slot_label(text, text, smallint, text) is
  'L''ARÈNE — libellé abstrait d''un slot de tableau final (A1, B2, Vainqueur QF1, Perdant SF2).';


-- -----------------------------------------------------------------------------
-- 16a. Résolution des slots
-- -----------------------------------------------------------------------------
-- Un slot `group_position` se résout par le classement (live ou officiel selon
-- p_include_live). Un slot `match_winner` / `match_loser` ne se résout QUE si le
-- match source est terminé et son vainqueur désigné : on ne devine jamais l'issue
-- d'un match en cours, la demi-finale reste donc « Vainqueur QF1 » jusqu'au
-- coup de sifflet final du quart. Aucune récursion n'est nécessaire.

create or replace function public.arena_knockout_projection_core(p_include_live boolean default false)
returns table (
  event_id              uuid,
  match_id              uuid,
  bracket_code          text,
  phase                 text,
  match_number          integer,
  court_number          smallint,
  scheduled_at          timestamptz,
  status                text,
  home_slot_label       text,
  home_team_id          uuid,
  home_team_name        text,
  home_is_projected     boolean,
  away_slot_label       text,
  away_team_id          uuid,
  away_team_name        text,
  away_is_projected     boolean,
  home_score            smallint,
  away_score            smallint,
  home_extra_time_score smallint,
  away_extra_time_score smallint,
  winner_team_id        uuid,
  is_fully_resolved     boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with standings as (
    select s.group_id, s.team_id, s.rank
    from public.arena_group_standings_core(p_include_live) s
  ),
  resolved as (
    select
      sl.match_id,
      sl.side,
      public.arena_knockout_slot_label(
        sl.source_type, g.name, sl.source_position, src.bracket_code
      ) as slot_label,
      -- Le libellé (« Vainqueur QF1 ») existe toujours ; seule la résolution en
      -- équipe réelle attend que le match source soit terminé.
      case
        when sl.source_type = 'group_position' then st.team_id
        when src.status <> 'finished' or src.winner_team_id is null then null
        when sl.source_type = 'match_winner' then src.winner_team_id
        when src.winner_team_id = src.home_team_id then src.away_team_id
        else src.home_team_id
      end as projected_team_id
    from public.arena_knockout_slots sl
    left join public.arena_groups g
      on g.id = sl.source_group_id
    left join public.arena_matches src
      on src.id = sl.source_match_id
    left join standings st
      on st.group_id = sl.source_group_id
     and st.rank = sl.source_position
  )
  select
    m.event_id,
    m.id                                              as match_id,
    m.bracket_code,
    m.phase,
    m.match_number,
    m.court_number,
    m.scheduled_at,
    m.status,
    h.slot_label                                      as home_slot_label,
    coalesce(m.home_team_id, h.projected_team_id)     as home_team_id,
    coalesce(ht.name, hp.name)                        as home_team_name,
    (m.home_team_id is null and h.projected_team_id is not null) as home_is_projected,
    a.slot_label                                      as away_slot_label,
    coalesce(m.away_team_id, a.projected_team_id)     as away_team_id,
    coalesce(awt.name, ap.name)                        as away_team_name,
    (m.away_team_id is null and a.projected_team_id is not null) as away_is_projected,
    m.home_score,
    m.away_score,
    m.home_extra_time_score,
    m.away_extra_time_score,
    m.winner_team_id,
    (
      coalesce(m.home_team_id, h.projected_team_id) is not null
      and coalesce(m.away_team_id, a.projected_team_id) is not null
    )                                                 as is_fully_resolved
  from public.arena_matches m
  left join resolved h on h.match_id = m.id and h.side = 'home'
  left join resolved a on a.match_id = m.id and a.side = 'away'
  left join public.arena_teams ht on ht.id = m.home_team_id
  left join public.arena_teams awt on awt.id = m.away_team_id
  left join public.arena_teams hp on hp.id = h.projected_team_id
  left join public.arena_teams ap on ap.id = a.projected_team_id
  where m.phase <> 'group'
$$;

comment on function public.arena_knockout_projection_core(boolean) is
  'L''ARÈNE — moteur de tableau final. Résout les slots depuis le classement live (true) ou officiel (false). SECURITY DEFINER : n''expose que des noms d''équipes, aucune PII.';


-- -----------------------------------------------------------------------------
-- 16b. Tableau OFFICIEL — aucune projection
-- -----------------------------------------------------------------------------
-- Ce que le tableau contient réellement. Avant la validation humaine des
-- qualifiés, home_team_id / away_team_id sont NULL et l'affichage se fait sur
-- les seuls libellés (« QF1 — A1 vs B2 »).

create or replace view public.arena_knockout_bracket as
select
  m.event_id,
  m.id                                       as match_id,
  m.bracket_code,
  m.phase,
  m.match_number,
  m.court_number,
  m.scheduled_at,
  m.status,
  public.arena_knockout_slot_label(hs.source_type, hg.name, hs.source_position, hsrc.bracket_code)
                                             as home_slot_label,
  m.home_team_id,
  ht.name                                    as home_team_name,
  public.arena_knockout_slot_label(aws.source_type, ag.name, aws.source_position, asrc.bracket_code)
                                             as away_slot_label,
  m.away_team_id,
  awt.name                                   as away_team_name,
  m.home_score,
  m.away_score,
  m.home_extra_time_score,
  m.away_extra_time_score,
  m.winner_team_id,
  (m.home_team_id is not null and m.away_team_id is not null) as is_fully_resolved,
  e.knockout_published
from public.arena_matches m
join public.arena_events e on e.id = m.event_id
left join public.arena_knockout_slots hs on hs.match_id = m.id and hs.side = 'home'
left join public.arena_groups hg on hg.id = hs.source_group_id
left join public.arena_matches hsrc on hsrc.id = hs.source_match_id
left join public.arena_knockout_slots aws on aws.match_id = m.id and aws.side = 'away'
left join public.arena_groups ag on ag.id = aws.source_group_id
left join public.arena_matches asrc on asrc.id = aws.source_match_id
left join public.arena_teams ht on ht.id = m.home_team_id
left join public.arena_teams awt on awt.id = m.away_team_id
where m.phase <> 'group';

comment on view public.arena_knockout_bracket is
  'L''ARÈNE — TABLEAU OFFICIEL. Ne montre que les équipes réellement enregistrées ; NULL tant que les qualifiés ne sont pas validés. Ne jamais mélanger avec arena_live_knockout_projection.';


-- -----------------------------------------------------------------------------
-- 16c. PROJECTION LIVE — non définitive
-- -----------------------------------------------------------------------------
-- Pendant les poules, chaque slot A1/A2/B1/… est résolu depuis le classement
-- LIVE. Un but qui fait passer une équipe de A2 à A1 la déplace immédiatement
-- dans l'autre quart ; l'égalisation la ramène. L'affichage doit être accompagné
-- de la mention « PROJECTION LIVE — NON DÉFINITIVE » dès que home_is_projected
-- ou away_is_projected vaut true.

create or replace view public.arena_live_knockout_projection as
select *
from public.arena_knockout_projection_core(true);

comment on view public.arena_live_knockout_projection is
  'L''ARÈNE — TABLEAU FINAL, PROJECTION LIVE. Slots résolus depuis arena_live_group_standings. home_is_projected/away_is_projected = true signifie NON DÉFINITIF.';


-- -----------------------------------------------------------------------------
-- 16d. Qualifiés officiels — source du bouton « VALIDER LES QUALIFIÉS »
-- -----------------------------------------------------------------------------
-- Même moteur, mais alimenté par le classement OFFICIEL (matchs terminés).
-- C'est ce que la validation humaine recopiera dans arena_matches :
--
--   update public.arena_matches m
--      set home_team_id = q.home_team_id,
--          away_team_id = q.away_team_id
--     from public.arena_knockout_qualifiers q
--    where q.match_id = m.id
--      and q.event_id = <event>
--      and q.is_fully_resolved;
--
-- Cette écriture reste volontairement hors migration : elle n'a de sens qu'une
-- fois toutes les rencontres de poules terminées, et c'est un humain qui en
-- décide. `knockout_published` peut alors être activé sur l'événement.

create or replace view public.arena_knockout_qualifiers as
select *
from public.arena_knockout_projection_core(false);

comment on view public.arena_knockout_qualifiers is
  'L''ARÈNE — qualifiés d''après le CLASSEMENT OFFICIEL. Prévisualisation et source d''écriture du bouton « VALIDER LES QUALIFIÉS ». N''écrit rien par elle-même.';


-- -----------------------------------------------------------------------------
-- 16e. Génération du tableau
-- -----------------------------------------------------------------------------
-- Crée les 8 matchs de phase finale et leurs 16 slots, sans aucune équipe.
-- Unique source de vérité de la matrice : le frontend n'a rien à recoder.
-- Idempotente : ne fait rien si un match de phase finale existe déjà.
-- À appeler APRÈS avoir généré le calendrier des poules : les match_number du
-- tableau sont attribués à la suite du plus grand numéro existant.
-- Fonction d'écriture -> SECURITY INVOKER, EXECUTE révoqué au public (§ 19).

create or replace function public.arena_create_knockout_bracket(p_event_id uuid)
returns integer
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  v_groups  uuid[];
  v_qf      uuid[] := array[]::uuid[];
  v_sf      uuid[] := array[]::uuid[];
  v_final   uuid;
  v_third   uuid;
  v_number  integer;
  v_match   uuid;
  i         integer;
begin
  if not exists (select 1 from public.arena_events where id = p_event_id) then
    raise exception 'arena_create_knockout_bracket: événement % introuvable', p_event_id;
  end if;

  if exists (
    select 1 from public.arena_matches
    where event_id = p_event_id and phase <> 'group'
  ) then
    return 0;
  end if;

  select array_agg(id order by display_order, name)
    into v_groups
    from public.arena_groups
   where event_id = p_event_id;

  if coalesce(array_length(v_groups, 1), 0) <> 4 then
    raise exception
      'arena_create_knockout_bracket: 4 poules attendues pour l''événement %, % trouvée(s)',
      p_event_id, coalesce(array_length(v_groups, 1), 0);
  end if;

  select coalesce(max(match_number), 0)
    into v_number
    from public.arena_matches
   where event_id = p_event_id;

  for i in 1..4 loop
    v_number := v_number + 1;
    insert into public.arena_matches (event_id, match_number, phase, bracket_code)
    values (p_event_id, v_number, 'quarter_final', 'QF' || i)
    returning id into v_match;
    v_qf := v_qf || v_match;
  end loop;

  -- QF1 = A1 vs B2, QF2 = C1 vs D2, QF3 = B1 vs A2, QF4 = D1 vs C2
  insert into public.arena_knockout_slots
    (event_id, match_id, side, source_type, source_group_id, source_position)
  values
    (p_event_id, v_qf[1], 'home', 'group_position', v_groups[1], 1),
    (p_event_id, v_qf[1], 'away', 'group_position', v_groups[2], 2),
    (p_event_id, v_qf[2], 'home', 'group_position', v_groups[3], 1),
    (p_event_id, v_qf[2], 'away', 'group_position', v_groups[4], 2),
    (p_event_id, v_qf[3], 'home', 'group_position', v_groups[2], 1),
    (p_event_id, v_qf[3], 'away', 'group_position', v_groups[1], 2),
    (p_event_id, v_qf[4], 'home', 'group_position', v_groups[4], 1),
    (p_event_id, v_qf[4], 'away', 'group_position', v_groups[3], 2);

  for i in 1..2 loop
    v_number := v_number + 1;
    insert into public.arena_matches (event_id, match_number, phase, bracket_code)
    values (p_event_id, v_number, 'semi_final', 'SF' || i)
    returning id into v_match;
    v_sf := v_sf || v_match;
  end loop;

  -- SF1 = vainqueurs QF1/QF2, SF2 = vainqueurs QF3/QF4
  insert into public.arena_knockout_slots
    (event_id, match_id, side, source_type, source_match_id)
  values
    (p_event_id, v_sf[1], 'home', 'match_winner', v_qf[1]),
    (p_event_id, v_sf[1], 'away', 'match_winner', v_qf[2]),
    (p_event_id, v_sf[2], 'home', 'match_winner', v_qf[3]),
    (p_event_id, v_sf[2], 'away', 'match_winner', v_qf[4]);

  v_number := v_number + 1;
  insert into public.arena_matches (event_id, match_number, phase, bracket_code)
  values (p_event_id, v_number, 'third_place', 'THIRD_PLACE')
  returning id into v_third;

  v_number := v_number + 1;
  insert into public.arena_matches (event_id, match_number, phase, bracket_code)
  values (p_event_id, v_number, 'final', 'FINAL')
  returning id into v_final;

  insert into public.arena_knockout_slots
    (event_id, match_id, side, source_type, source_match_id)
  values
    (p_event_id, v_third, 'home', 'match_loser',  v_sf[1]),
    (p_event_id, v_third, 'away', 'match_loser',  v_sf[2]),
    (p_event_id, v_final, 'home', 'match_winner', v_sf[1]),
    (p_event_id, v_final, 'away', 'match_winner', v_sf[2]);

  return 8;
end;
$$;

comment on function public.arena_create_knockout_bracket(uuid) is
  'L''ARÈNE — crée les 8 matchs de phase finale et leurs slots (QF1=A1vsB2, QF2=C1vsD2, QF3=B1vsA2, QF4=D1vsC2), sans équipes. Exige 4 poules. Idempotente. Réservée au service_role.';


-- =============================================================================
-- 17. Surface publique sans PII
-- =============================================================================
-- arena_teams porte les coordonnées du capitaine : la table reste fermée et le
-- public passe par cette projection. La vue s'appuie volontairement sur les
-- droits de son propriétaire (pas de `security_invoker`) : c'est ce qui permet
-- le filtrage par colonne, impossible avec RLS seul.

create or replace view public.arena_public_teams as
select
  t.id,
  t.event_id,
  t.name,
  t.city,
  t.primary_color,
  t.secondary_color,
  t.logo_url,
  t.status,
  t.created_at
from public.arena_teams t;

comment on view public.arena_public_teams is
  'L''ARÈNE — projection publique de arena_teams, sans aucune PII (ni captain_phone, ni captain_email, ni identité du capitaine).';


-- =============================================================================
-- 18. RLS — deny by default, lectures publiques sûres uniquement
-- =============================================================================
-- Aucune policy INSERT/UPDATE/DELETE n'est créée : toute écriture passe par le
-- service_role (côté serveur) tant que l'authentification staff n'existe pas.

alter table public.arena_events            enable row level security;
alter table public.arena_teams             enable row level security;
alter table public.arena_players           enable row level security;
alter table public.arena_player_invites    enable row level security;
alter table public.arena_player_payments   enable row level security;
alter table public.arena_meal_orders       enable row level security;
alter table public.arena_meal_order_items  enable row level security;
alter table public.arena_groups            enable row level security;
alter table public.arena_group_teams       enable row level security;
alter table public.arena_matches           enable row level security;
alter table public.arena_match_events      enable row level security;
alter table public.arena_knockout_slots    enable row level security;

-- Tables sans aucune donnée personnelle : lecture publique explicite.
-- arena_matches et arena_match_events doivent en outre rester lisibles par
-- `anon` pour que Supabase Realtime puisse diffuser leurs changements.
drop policy if exists arena_events_public_read on public.arena_events;
create policy arena_events_public_read
  on public.arena_events for select to anon, authenticated using (true);

drop policy if exists arena_groups_public_read on public.arena_groups;
create policy arena_groups_public_read
  on public.arena_groups for select to anon, authenticated using (true);

drop policy if exists arena_group_teams_public_read on public.arena_group_teams;
create policy arena_group_teams_public_read
  on public.arena_group_teams for select to anon, authenticated using (true);

drop policy if exists arena_matches_public_read on public.arena_matches;
create policy arena_matches_public_read
  on public.arena_matches for select to anon, authenticated using (true);

drop policy if exists arena_match_events_public_read on public.arena_match_events;
create policy arena_match_events_public_read
  on public.arena_match_events for select to anon, authenticated using (true);

-- Structure pure du tableau final (origines abstraites), aucune donnée personnelle.
drop policy if exists arena_knockout_slots_public_read on public.arena_knockout_slots;
create policy arena_knockout_slots_public_read
  on public.arena_knockout_slots for select to anon, authenticated using (true);

-- arena_teams, arena_players, arena_player_invites, arena_player_payments,
-- arena_meal_orders, arena_meal_order_items : AUCUNE policy.
-- RLS actif + zéro policy = refus total pour anon et authenticated.


-- =============================================================================
-- 19. Privilèges
-- =============================================================================

revoke all on table
  public.arena_events,
  public.arena_teams,
  public.arena_players,
  public.arena_player_invites,
  public.arena_player_payments,
  public.arena_meal_orders,
  public.arena_meal_order_items,
  public.arena_groups,
  public.arena_group_teams,
  public.arena_matches,
  public.arena_match_events,
  public.arena_knockout_slots
from anon, authenticated;

grant select on table
  public.arena_events,
  public.arena_groups,
  public.arena_group_teams,
  public.arena_matches,
  public.arena_match_events,
  public.arena_knockout_slots
to anon, authenticated;

-- Les VUES doivent être révoquées avec la même rigueur que les tables.
-- Supabase pose `alter default privileges ... grant all on tables`, et une vue
-- est une « table » à ce titre : sans cette révocation, anon hérite de
-- INSERT/UPDATE/DELETE sur arena_public_teams. Or cette vue est
-- auto-modifiable (projection simple d'une seule table) et s'exécute avec les
-- droits de son propriétaire : elle deviendrait un chemin d'écriture direct
-- dans arena_teams, contournant intégralement RLS.
revoke all on table
  public.arena_public_teams,
  public.arena_group_standings,
  public.arena_live_group_standings,
  public.arena_knockout_bracket,
  public.arena_live_knockout_projection,
  public.arena_knockout_qualifiers
from anon, authenticated;

grant select on table
  public.arena_public_teams,
  public.arena_group_standings,
  public.arena_live_group_standings,
  public.arena_knockout_bracket,
  public.arena_live_knockout_projection,
  public.arena_knockout_qualifiers
to anon, authenticated;

grant execute on function public.arena_group_standings_core(boolean) to anon, authenticated;
grant execute on function public.arena_discipline_weight(text) to anon, authenticated;
grant execute on function public.arena_knockout_projection_core(boolean) to anon, authenticated;
grant execute on function public.arena_knockout_slot_label(text, text, smallint, text) to anon, authenticated;

-- Fonction d'ÉCRITURE : réservée au service_role. `public` inclut anon et
-- authenticated, d'où la révocation explicite — sans quoi le GRANT EXECUTE
-- implicite de PostgreSQL la rendrait appelable par n'importe qui.
revoke all on function public.arena_create_knockout_bracket(uuid)
  from public, anon, authenticated;

-- Révoquer à PUBLIC retire aussi l'accès de service_role : il faut donc le lui
-- re-accorder explicitement. Ne pas compter sur les default privileges de
-- Supabase — ils ne s'appliquent qu'aux objets créés par le rôle pour lequel
-- ils ont été définis, et cette fonction serait alors inappelable.
grant execute on function public.arena_create_knockout_bracket(uuid) to service_role;


-- =============================================================================
-- 20. Realtime
-- =============================================================================
-- Le frontend s'abonne à arena_matches (score/statut) et arena_match_events
-- (statistiques). Les classements sont des vues calculées : PostgreSQL ne
-- réplique pas les vues, le client doit re-interroger
-- arena_live_group_standings à chaque notification — et, dans le même
-- rafraîchissement, arena_live_knockout_projection, dont les slots A1/B2
-- dépendent directement du classement live.
--
-- arena_knockout_slots n'est PAS répliquée : la structure du tableau est fixée
-- une fois pour toutes avant le tournoi. C'est arena_matches qui porte tous les
-- changements ultérieurs, y compris la validation des qualifiés.
--
-- Ajout idempotent, et sans échec si la publication n'existe pas encore sur
-- l'instance : dans ce cas l'activation se fait manuellement depuis le
-- dashboard Supabase (Database > Replication), cf. supabase/README.md.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'arena_matches'
    ) then
      alter publication supabase_realtime add table public.arena_matches;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'arena_match_events'
    ) then
      alter publication supabase_realtime add table public.arena_match_events;
    end if;
  end if;
end;
$$;

-- REPLICA IDENTITY FULL sur arena_matches : le payload Realtime d'un UPDATE
-- contient alors l'ancienne ligne, ce qui permet au frontend de savoir si le
-- score ou le statut a changé sans requête supplémentaire.
alter table public.arena_matches replica identity full;
