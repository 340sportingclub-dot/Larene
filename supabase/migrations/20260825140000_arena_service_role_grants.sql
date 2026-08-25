-- =============================================================================
-- L'ARÈNE — privilèges explicites pour service_role
-- =============================================================================
-- CE QUI S'EST PASSÉ
-- La migration `foundation` et le `security_hotfix` révoquent puis accordent des
-- privilèges à `anon` et `authenticated`. Elles n'accordent RIEN à
-- `service_role` : elles s'en remettaient implicitement aux `default privileges`
-- posés par Supabase.
--
-- Ces privilèges par défaut ne s'appliquent qu'aux objets créés par le rôle pour
-- lequel ils ont été définis. Sur cette instance, ils n'ont pas couvert les
-- tables `arena_*` : `service_role` s'est retrouvé sans le moindre privilège,
-- et toute lecture serveur échouait avec
--
--     42501  permission denied for table arena_events
--
-- Le README (§ 5) énonçait déjà cette règle à propos des fonctions — « les
-- default privileges de Supabase ne peuvent pas être considérés comme acquis ».
-- Elle n'avait pas été appliquée aux tables. Cette migration corrige cet oubli.
--
-- CE QUE CETTE MIGRATION NE FAIT PAS
-- Elle n'accorde STRICTEMENT RIEN à `anon` ni à `authenticated`, et ne touche à
-- aucune policy. Les six tables porteuses de données personnelles restent en
-- refus total pour le public. `service_role` est le rôle de service, réservé au
-- code serveur : sa clé n'est jamais exposée au navigateur.
--
-- Migration additive et idempotente : `GRANT` est répétable sans effet de bord.
-- =============================================================================


-- =============================================================================
-- 1. Accès au schéma
-- =============================================================================

grant usage on schema public to service_role;


-- =============================================================================
-- 2. Tables — lecture et écriture complètes
-- =============================================================================
-- `service_role` est le rôle par lequel passe tout le code serveur : inscription,
-- espace capitaine, Arena Control, table de marque. Il lui faut le DML complet.
-- Les tables sont énumérées une à une : aucune table d'un autre module de
-- l'instance partagée « 340-hub » ne doit être touchée.

grant select, insert, update, delete on table
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
  public.arena_knockout_slots,
  public.arena_team_access_tokens
to service_role;


-- =============================================================================
-- 3. Vues — lecture
-- =============================================================================
-- Les vues de projection s'exécutent avec les droits de leur propriétaire ;
-- `service_role` a néanmoins besoin du privilège de lecture sur la vue elle-même.

grant select on table
  public.arena_public_teams,
  public.arena_group_standings,
  public.arena_live_group_standings,
  public.arena_knockout_bracket,
  public.arena_live_knockout_projection,
  public.arena_knockout_qualifiers
to service_role;


-- =============================================================================
-- 4. Fonctions
-- =============================================================================
-- Les fonctions de lecture avaient été accordées à `anon` et `authenticated`
-- seulement. `arena_create_knockout_bracket` avait bien reçu son GRANT explicite
-- lors du hotfix : il est répété ici pour que ce fichier décrive à lui seul
-- l'état attendu des privilèges de `service_role`.

grant execute on function public.arena_group_standings_core(boolean)       to service_role;
grant execute on function public.arena_knockout_projection_core(boolean)   to service_role;
grant execute on function public.arena_discipline_weight(text)             to service_role;
grant execute on function public.arena_knockout_slot_label(text, text, smallint, text) to service_role;
grant execute on function public.arena_create_knockout_bracket(uuid)       to service_role;


-- =============================================================================
-- 5. Objets futurs
-- =============================================================================
-- Pour qu'une table `arena_*` créée plus tard n'ait pas à refaire ce diagnostic.
-- Ne concerne que les objets créés par le rôle courant, et n'accorde rien à
-- `anon` ni `authenticated`.

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
  grant execute on functions to service_role;
