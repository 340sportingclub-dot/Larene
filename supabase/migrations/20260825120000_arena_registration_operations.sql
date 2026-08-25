-- =============================================================================
-- L'ARÈNE — inscription des équipes et opérations du jour J
-- =============================================================================
-- Migration ADDITIVE. Elle ne supprime, ne renomme et ne redéfinit aucun objet
-- existant :
--   * une table nouvelle : arena_team_access_tokens ;
--   * des colonnes nouvelles sur arena_teams et arena_players ;
--   * une contrainte CHECK nouvelle, posée NOT VALID, sur une colonne texte
--     jusqu'ici libre (arena_player_payments.payment_provider).
--
-- Elle NE TOUCHE PAS :
--   * aux fonctions de classement ni de tableau final ;
--   * aux vues publiques ;
--   * aux policies existantes ;
--   * à arena_matches_phase_check (la phase `classification` relève de l'étape
--     suivante, et exige de corriger d'abord les filtres `phase <> 'group'` —
--     voir supabase/README.md § 14.2).
--
-- Elle est idempotente : `if not exists` partout, contraintes recréées par
-- `drop constraint if exists` puis `add constraint`.
--
-- Aucun secret ne figure ici. Les codes d'accès du staff vivent exclusivement
-- en variables d'environnement côté serveur, jamais en base.
-- =============================================================================


-- =============================================================================
-- 1. Accès du capitaine à son espace équipe
-- =============================================================================
-- arena_player_invites porte déjà le patron « jeton à usage privé » mais son
-- player_id est NOT NULL : il ne peut pas représenter un accès d'ÉQUIPE. Plutôt
-- que d'assouplir une contrainte existante, on ajoute une table dédiée qui suit
-- exactement les mêmes principes :
--
--   * seul le HACHAGE du jeton est stocké (SHA-256, calculé côté serveur).
--     Le jeton en clair n'existe que dans le lien envoyé au capitaine et ne doit
--     JAMAIS être écrit en base ni journalisé ;
--   * un jeton est révocable (revoked_at) et expirable (expires_at) ;
--   * l'usage est tracé pour permettre de repérer un partage anormal.

-- ⚠️ CETTE SECTION EST AUTO-RÉPARANTE, ET CE N'EST PAS DE LA PRÉCAUTION
-- GRATUITE : une table `arena_team_access_tokens` partielle a été trouvée en
-- production le 25/08/2026, sans `label`, `use_count` ni `updated_at`. Un simple
-- `create table if not exists` n'aurait rien fait et aurait laissé le schéma
-- incompatible avec le code, sans le moindre message d'erreur.
--
-- La table est donc créée si elle manque, PUIS chaque colonne, contrainte et
-- index est ajouté séparément. Le résultat est le même quel que soit l'état de
-- départ : table absente, partielle ou déjà complète.

create table if not exists public.arena_team_access_tokens (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null
    references public.arena_teams (id) on delete cascade,

  -- SHA-256 du jeton, en hexadécimal minuscule (64 caractères).
  token_hash text        not null,

  created_at timestamptz not null default now()
);

-- Colonnes — ajoutées une à une pour rattraper une table préexistante.
alter table public.arena_team_access_tokens
  -- Étiquette libre : « capitaine », « co-capitaine »… Aucune donnée personnelle.
  add column if not exists label        text,
  add column if not exists expires_at   timestamptz,
  add column if not exists revoked_at   timestamptz,
  add column if not exists last_used_at timestamptz,
  add column if not exists use_count    integer     not null default 0,
  add column if not exists updated_at   timestamptz not null default now();

-- Contraintes — idem : recréées explicitement, jamais supposées présentes.
alter table public.arena_team_access_tokens
  drop constraint if exists arena_team_access_tokens_token_hash_key;
alter table public.arena_team_access_tokens
  add constraint arena_team_access_tokens_token_hash_key unique (token_hash);

alter table public.arena_team_access_tokens
  drop constraint if exists arena_team_access_tokens_token_hash_shape_check;
alter table public.arena_team_access_tokens
  add constraint arena_team_access_tokens_token_hash_shape_check
    check (token_hash ~ '^[0-9a-f]{64}$');

alter table public.arena_team_access_tokens
  drop constraint if exists arena_team_access_tokens_use_count_check;
alter table public.arena_team_access_tokens
  add constraint arena_team_access_tokens_use_count_check
    check (use_count >= 0);

comment on table public.arena_team_access_tokens is
  'L''ARÈNE — accès privé du capitaine à son espace équipe. Seul le hachage SHA-256 du jeton est stocké ; le jeton en clair ne vit que dans le lien transmis.';
comment on column public.arena_team_access_tokens.token_hash is
  'SHA-256 hexadécimal du jeton. Le jeton en clair ne doit jamais être stocké ni journalisé.';

create index if not exists arena_team_access_tokens_team_id_idx
  on public.arena_team_access_tokens (team_id);

-- Un seul jeton actif par équipe : émettre un nouveau lien invalide le précédent.
create unique index if not exists arena_team_access_tokens_active_team_key
  on public.arena_team_access_tokens (team_id)
  where revoked_at is null;

drop trigger if exists arena_team_access_tokens_set_updated_at
  on public.arena_team_access_tokens;
create trigger arena_team_access_tokens_set_updated_at
  before update on public.arena_team_access_tokens
  for each row execute function public.arena_set_updated_at();


-- =============================================================================
-- 2. Verrou d'effectif et présence de l'équipe
-- =============================================================================
-- Le règlement fige l'effectif au coup d'envoi du premier match de l'équipe.
-- Jusqu'ici ce verrou n'était que déductible du `started_at` de ce match : rien
-- ne l'opposait à une écriture. Il devient un état explicite et persistant.

alter table public.arena_teams
  add column if not exists roster_locked_at timestamptz;

alter table public.arena_teams
  add column if not exists checked_in_at timestamptz;

comment on column public.arena_teams.roster_locked_at is
  'Instant de verrouillage de l''effectif (coup d''envoi du premier match). NULL = effectif encore modifiable par le capitaine.';
comment on column public.arena_teams.checked_in_at is
  'Instant du check-in de l''équipe à l''accueil, le jour du tournoi. NULL = équipe pas encore pointée.';

-- Les équipes restant à pointer le matin du tournoi.
create index if not exists arena_teams_checked_in_idx
  on public.arena_teams (event_id)
  where checked_in_at is null;


-- =============================================================================
-- 3. Présence des joueurs
-- =============================================================================
-- La présence est un axe DISTINCT du statut d'inscription : un joueur
-- `confirmed` peut très bien être absent le jour J. On ne détourne donc pas
-- arena_players.status, on ajoute une colonne dédiée.

alter table public.arena_players
  add column if not exists attendance text not null default 'unknown';

alter table public.arena_players
  add column if not exists checked_in_at timestamptz;

alter table public.arena_players
  drop constraint if exists arena_players_attendance_check;
alter table public.arena_players
  add constraint arena_players_attendance_check
    check (attendance in ('unknown', 'present', 'absent'));

comment on column public.arena_players.attendance is
  'Présence constatée le jour du tournoi : unknown (à vérifier), present, absent. Indépendant de `status`, qui porte l''inscription.';
comment on column public.arena_players.checked_in_at is
  'Instant du pointage du joueur. NULL tant qu''il n''a pas été pointé.';

create index if not exists arena_players_attendance_idx
  on public.arena_players (team_id, attendance);


-- =============================================================================
-- 4. Moyens de paiement
-- =============================================================================
-- Le modèle « 15 € par joueur » existe déjà : arena_player_payments porte un
-- paiement par joueur, avec son montant et son statut. Il ne manquait que la
-- convention sur le moyen employé.
--
-- Trois moyens sont acceptés pour cette édition :
--   * bank_transfer — virement, avant le tournoi ;
--   * helloasso     — carte bancaire via HelloAsso, avant le tournoi ;
--   * cash          — espèces, à l'accueil le jour J.
--
-- La contrainte est posée NOT VALID : elle s'applique à toute écriture nouvelle
-- sans re-valider d'éventuelles lignes déjà présentes, ce qui rend la migration
-- sûre quel que soit l'état de la base. La validation pourra être faite plus
-- tard par `alter table … validate constraint …`.

alter table public.arena_player_payments
  drop constraint if exists arena_player_payments_provider_check;
alter table public.arena_player_payments
  add constraint arena_player_payments_provider_check
    check (
      payment_provider is null
      or payment_provider in ('cash', 'bank_transfer', 'helloasso')
    )
    not valid;

comment on column public.arena_player_payments.payment_provider is
  'Moyen de paiement : cash, bank_transfer ou helloasso. NULL tant qu''aucun règlement n''est constaté.';

-- Suivi « 6 / 8 joueurs réglés » : on interroge les paiements d'une équipe.
create index if not exists arena_player_payments_status_paid_idx
  on public.arena_player_payments (player_id, status);


-- =============================================================================
-- 5. RLS et privilèges
-- =============================================================================
-- arena_team_access_tokens contient des secrets d'accès. Elle suit le régime le
-- plus strict du schéma : RLS actif, AUCUNE policy, privilèges révoqués. Ni
-- `anon` ni `authenticated` ne peuvent la lire — seul le code serveur, en
-- service_role, y accède.
--
-- Les colonnes ajoutées à arena_teams et arena_players n'ouvrent aucun accès :
-- ces deux tables sont déjà en refus total et le restent. La vue publique
-- arena_public_teams énumère ses colonnes une à une : elle n'expose donc
-- automatiquement ni roster_locked_at ni checked_in_at.

alter table public.arena_team_access_tokens enable row level security;

revoke all on table public.arena_team_access_tokens from anon, authenticated;

-- Rappel de la règle apprise lors du hotfix de sécurité : Supabase pose
-- `alter default privileges … grant all on tables`, un REVOKE explicite est donc
-- indispensable et ne peut pas être considéré comme acquis.
