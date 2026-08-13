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

  home_team_id          uuid        not null,
  away_team_id          uuid        not null,

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

  constraint arena_matches_match_number_check
    check (match_number > 0),
  constraint arena_matches_phase_check
    check (phase in ('group', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final')),
  constraint arena_matches_status_check
    check (status in ('scheduled', 'ready', 'live', 'finished', 'cancelled')),
  constraint arena_matches_court_number_check
    check (court_number > 0),
  constraint arena_matches_distinct_teams_check
    check (home_team_id <> away_team_id),
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
    check (winner_team_id is null or winner_team_id in (home_team_id, away_team_id)),
  constraint arena_matches_timeline_check
    check (started_at is null or ended_at is null or started_at <= ended_at)
);

comment on table public.arena_matches is
  'L''ARÈNE — rencontres. Les scores de cette table font FOI pour les classements ; arena_match_events est un journal statistique.';
comment on column public.arena_matches.home_extra_time_score is
  'Score de prolongation (2 x 4 min, finale). Le score du temps réglementaire reste dans home_score/away_score.';

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
-- 13. Triggers updated_at
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
    'arena_matches'
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
-- 14. MOTEUR DE CLASSEMENT
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
-- 14a. Classement OFFICIEL — matchs terminés uniquement
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
-- 14b. Classement LIVE — matchs terminés + matchs en cours
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
-- 15. Surface publique sans PII
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
-- 16. RLS — deny by default, lectures publiques sûres uniquement
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

-- arena_teams, arena_players, arena_player_invites, arena_player_payments,
-- arena_meal_orders, arena_meal_order_items : AUCUNE policy.
-- RLS actif + zéro policy = refus total pour anon et authenticated.


-- =============================================================================
-- 17. Privilèges
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
  public.arena_match_events
from anon, authenticated;

grant select on table
  public.arena_events,
  public.arena_groups,
  public.arena_group_teams,
  public.arena_matches,
  public.arena_match_events
to anon, authenticated;

grant select on table
  public.arena_public_teams,
  public.arena_group_standings,
  public.arena_live_group_standings
to anon, authenticated;

grant execute on function public.arena_group_standings_core(boolean) to anon, authenticated;
grant execute on function public.arena_discipline_weight(text) to anon, authenticated;


-- =============================================================================
-- 18. Realtime
-- =============================================================================
-- Le frontend s'abonne à arena_matches (score/statut) et arena_match_events
-- (statistiques). Les classements sont des vues calculées : PostgreSQL ne
-- réplique pas les vues, le client doit re-interroger
-- arena_live_group_standings à chaque notification.
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
