-- =============================================================================
-- L'ARÈNE — Security hotfix
-- =============================================================================
-- Migration ADDITIVE, corrective, appliquée APRÈS
-- `20260813120000_arena_database_foundation.sql`.
--
-- La foundation n'est PAS réécrite : elle est déjà appliquée, son contenu reste
-- l'historique fidèle de ce qui a été posé en base. Ce fichier n'ajuste que des
-- privilèges.
--
-- Aucune table, colonne, contrainte, policy, vue ou fonction n'est créée,
-- modifiée ou supprimée. Aucune donnée n'est touchée. Aucun objet hors `arena_*`
-- n'est référencé (`recruitment_leads` en particulier).
--
-- Ré-exécutable sans effet de bord : les REVOKE/GRANT sont idempotents.
--
-- DÉPENDANCE : les objets visés doivent exister. Si la foundation n'a pas été
-- appliquée, cette migration échoue bruyamment — c'est voulu : mieux vaut une
-- erreur explicite qu'un correctif de sécurité silencieusement ignoré.
-- =============================================================================


-- =============================================================================
-- 1. Fermeture du chemin d'écriture public sur les vues
-- =============================================================================
-- FAILLE CORRIGÉE (vérifiée et reproduite avant correctif) :
--
--   La foundation révoquait les privilèges sur les 12 tables de base, mais se
--   contentait d'un `GRANT SELECT` sur les vues, sans révocation préalable.
--   Or Supabase pose `alter default privileges ... grant all on tables`, et une
--   vue est une « table » à ce titre : `anon` et `authenticated` héritaient donc
--   d'INSERT / UPDATE / DELETE sur les vues à leur création.
--
--   `arena_public_teams` est une projection simple d'une seule table : elle est
--   donc AUTO-MODIFIABLE au sens PostgreSQL. Et comme toute vue sans
--   `security_invoker`, elle s'exécute avec les droits de son propriétaire.
--   La combinaison ouvrait un chemin d'écriture direct dans `arena_teams` —
--   table porteuse des coordonnées des capitaines — en contournant
--   intégralement RLS. Un visiteur non authentifié pouvait renommer les équipes,
--   les passer en `disqualified`, ou les supprimer.
--
--   Les cinq autres vues sont bâties sur des fonctions et ne sont pas
--   auto-modifiables : elles n'étaient pas exploitables. Elles portaient tout de
--   même des privilèges d'écriture superflus, révoqués ici par principe — et
--   pour qu'une simplification future de l'une d'elles ne rouvre pas la brèche.
--
-- RÈGLE À TENIR : toute nouvelle vue publique fait REVOKE ALL puis GRANT SELECT.

revoke all on table
  public.arena_public_teams,
  public.arena_group_standings,
  public.arena_live_group_standings,
  public.arena_knockout_bracket,
  public.arena_live_knockout_projection,
  public.arena_knockout_qualifiers
from anon, authenticated;

-- `REVOKE ALL` retire aussi le SELECT : on le re-accorde explicitement.
-- Les classements et le tableau final doivent rester lisibles publiquement.
grant select on table
  public.arena_public_teams,
  public.arena_group_standings,
  public.arena_live_group_standings,
  public.arena_knockout_bracket,
  public.arena_live_knockout_projection,
  public.arena_knockout_qualifiers
to anon, authenticated;


-- =============================================================================
-- 2. Accès explicite de service_role à la génération du tableau
-- =============================================================================
-- La foundation révoque l'EXECUTE de `arena_create_knockout_bracket()` à
-- `public` — ce qui est correct, c'est la seule fonction d'écriture et elle ne
-- doit pas être appelable côté client. Mais `public` englobe TOUS les rôles,
-- `service_role` compris, dont le privilège ne venait que de ce GRANT implicite.
--
-- Sur 340-hub, les default privileges Supabase sur les FONCTIONS lui rendent
-- l'accès, ce qui a masqué le problème. Cette garantie est implicite et
-- fragile : elle ne s'applique qu'aux objets créés par le rôle pour lequel ces
-- default privileges ont été définis. Hors de ce cas, la fonction devient
-- inappelable par quiconque hors son propriétaire.
--
-- On rend donc l'intention explicite et indépendante de la configuration de
-- l'instance. Le REVOKE est répété pour que l'état visé soit lisible d'un bloc.

revoke all on function public.arena_create_knockout_bracket(uuid)
  from public, anon, authenticated;

grant execute on function public.arena_create_knockout_bracket(uuid)
  to service_role;


-- =============================================================================
-- 3. État visé après application
-- =============================================================================
--   anon / authenticated : SELECT, et rien d'autre, sur toutes les tables et
--                          vues `arena_*` qui leur sont ouvertes.
--                          Aucun accès aux tables porteuses de PII.
--                          Aucun EXECUTE sur la fonction d'écriture.
--   service_role         : inchangé côté tables ; EXECUTE explicite sur
--                          `arena_create_knockout_bracket()`.
-- =============================================================================
