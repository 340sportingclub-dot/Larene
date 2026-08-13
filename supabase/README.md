# Supabase — L’ARÈNE

L’ARÈNE partage l’instance Supabase du projet **340-hub** avec d’autres modules.
Ce dossier contient les migrations SQL de L’ARÈNE et la documentation du modèle.

> **Statut** : la migration `20260813120000_arena_database_foundation.sql` est
> présente dans le dépôt mais **n’a pas encore été appliquée à 340-hub**. Elle
> doit être relue puis appliquée manuellement (voir « Appliquer la migration »).

---

## 1. Isolation `arena_*`

- Tous les objets de L’ARÈNE — tables, vues, fonctions, index, contraintes,
  policies, triggers — portent le préfixe `arena_`.
- Aucune table, vue ou fonction hors `arena_*` n’est créée, modifiée, renommée
  ou supprimée. En particulier `recruitment_leads` n’est jamais référencée.
- Aucun type `ENUM` n’est créé : un ENUM est global au schéma (risque de
  collision dans une base partagée) et son évolution est plus contraignante.
  Les statuts sont des colonnes `text` protégées par des `CHECK` nommés.
- La migration ne contient aucun `DROP TABLE` ni `DROP COLUMN`.

---

## 2. Tables créées

| Table | Rôle | PII |
| --- | --- | --- |
| `arena_events` | une édition du tournoi + tous ses paramètres de format | non |
| `arena_teams` | équipes inscrites | **oui** (capitaine) |
| `arena_players` | joueurs d’une équipe | **oui** |
| `arena_player_invites` | liens individuels de contribution (SMS) | **oui** |
| `arena_player_payments` | contribution individuelle par joueur | **oui** (indirecte) |
| `arena_meal_orders` | précommande repas au niveau équipe | non, mais fermée |
| `arena_meal_order_items` | lignes de précommande | non, mais fermée |
| `arena_groups` | poules | non |
| `arena_group_teams` | composition des poules | non |
| `arena_matches` | rencontres (poules + phases finales) | non |
| `arena_match_events` | journal d’événements du match | non |

### Relations

```
arena_events
 ├─ arena_teams ──┬─ arena_players ──┬─ arena_player_invites
 │                │                  └─ arena_player_payments
 │                └─ arena_meal_orders ── arena_meal_order_items
 ├─ arena_groups ── arena_group_teams ── arena_teams
 └─ arena_matches ── arena_match_events
```

`ON DELETE` :

- tout ce qui pend sous un événement est en `CASCADE` (équipes, poules, matchs,
  et par transitivité joueurs, invitations, paiements, repas, événements de match) ;
- `arena_matches.home_team_id / away_team_id / winner_team_id` sont en
  `NO ACTION` (et non `RESTRICT`) : c’est ce qui permet de supprimer un
  événement entier en une requête tout en empêchant la suppression isolée d’une
  équipe qui a déjà joué ;
- `arena_match_events.team_id / player_id` sont en `SET NULL` : l’historique du
  match survit à la suppression d’un joueur.

### Paramétrage

Rien n’est codé en dur dans le moteur. Les valeurs suivantes appartiennent à
`arena_events` : `max_teams`, `min_players_per_team`, `max_players_per_team`,
`player_fee_cents`, `currency`, `court_count`, `minimum_age`, `doors_open_at`,
`first_match_at`, `expected_end_at`. Le nombre de poules et de qualifiés découle
des données (`arena_groups`, `arena_matches`), pas d’une constante.

---

## 3. Statuts

| Colonne | Valeurs |
| --- | --- |
| `arena_events.registration_status` | `closed`, `open`, `paused`, `full` |
| `arena_events.event_status` | `draft`, `registration`, `draw`, `live`, `completed`, `cancelled` |
| `arena_teams.status` | `draft`, `pending`, `confirmed`, `waitlist`, `withdrawn`, `disqualified` |
| `arena_players.role` | `player`, `goalkeeper` |
| `arena_players.status` | `invited`, `pending`, `confirmed`, `withdrawn`, `disqualified` |
| `arena_player_invites.status` | `pending`, `sent`, `opened`, `completed`, `expired`, `cancelled` |
| `arena_player_payments.status` | `pending`, `processing`, `paid`, `failed`, `refunded`, `cancelled` |
| `arena_meal_orders.status` | `draft`, `submitted`, `paid`, `cancelled`, `fulfilled` |
| `arena_meal_orders.payment_status` | `unpaid`, `pending`, `paid`, `refunded` |
| `arena_matches.phase` | `group`, `round_of_16`, `quarter_final`, `semi_final`, `third_place`, `final` |
| `arena_matches.status` | `scheduled`, `ready`, `live`, `finished`, `cancelled` |
| `arena_match_events.event_type` | `goal`, `own_goal`, `yellow_card`, `red_card`, `two_minute`, `assist`, `penalty_goal`, `penalty_missed`, `score_correction` |

---

## 4. Contraintes structurantes

- **Nom d’équipe unique par événement**, insensible à la casse
  (index unique sur `(event_id, lower(name))`). Idem pour les poules.
- **Une équipe n’appartient qu’à une seule poule par événement.**
  `arena_group_teams` porte une colonne `event_id` dénormalisée, associée à deux
  clés étrangères composites vers `arena_groups (id, event_id)` et
  `arena_teams (id, event_id)`. Deux contraintes d’unicité en découlent :
  `(group_id, team_id)` et `(event_id, team_id)`. Cette stratégie garantit sans
  aucun trigger que la poule et l’équipe appartiennent au même événement **et**
  qu’une équipe n’est tirée qu’une fois. Même mécanisme sur `arena_matches`
  pour la poule, les deux équipes et le vainqueur.
- **Numéro de maillot** entre 1 et 99, unique dans l’équipe lorsqu’il est
  renseigné (index unique partiel `WHERE shirt_number IS NOT NULL`).
- **Match** : `home_team_id <> away_team_id`, scores ≥ 0, `court_number` > 0,
  `winner_team_id` obligatoirement l’une des deux équipes, `started_at <= ended_at`,
  `(event_id, match_number)` unique.
- **Poule vs phase finale** : un match `phase = 'group'` a forcément un
  `group_id`, un match de phase finale n’en a jamais.
- **Prolongation** : `home_extra_time_score` / `away_extra_time_score` sont soit
  toutes deux nulles, soit toutes deux renseignées, et interdites en phase de
  poules. Le format 2 × 4 min de la finale est donc représentable dès maintenant ;
  le chronomètre lui-même reste à construire côté application.
- **Journal de match** : `(match_id, sequence_number)` unique — l’ordre des
  événements est fiable même si plusieurs saisies arrivent dans la même seconde.
- **`updated_at`** : une seule fonction `arena_set_updated_at()` et un trigger
  par table concernée (9 tables). Aucune duplication.

### Limite connue

`arena_matches.home_team_id` et `away_team_id` sont `NOT NULL` : un tableau de
phase finale ne peut pas être pré-créé avec des emplacements vides. Les matchs à
élimination directe se créent une fois les qualifiés connus. Rendre ces colonnes
nullables demandera une migration ultérieure si un bracket prévisionnel devient
nécessaire.

---

## 5. RLS et privilèges

RLS est activé sur **les 11 tables**. Le principe est **deny by default** :

| Tables | anon / authenticated |
| --- | --- |
| `arena_events`, `arena_groups`, `arena_group_teams`, `arena_matches`, `arena_match_events` | `SELECT` autorisé (policy explicite) — aucune donnée personnelle |
| `arena_teams`, `arena_players`, `arena_player_invites`, `arena_player_payments`, `arena_meal_orders`, `arena_meal_order_items` | **aucun accès** — RLS actif, zéro policy, privilèges révoqués |

- **Aucune policy `INSERT` / `UPDATE` / `DELETE` n’existe.** Toute écriture passe
  aujourd’hui par le `service_role`, donc exclusivement par du code serveur.
  La clé `service_role` ne doit jamais être exposée côté client.
- Les privilèges de table sont révoqués puis re-accordés explicitement : la
  protection ne repose pas uniquement sur RLS.

### Policies à ajouter avec l’authentification staff

Les rôles prévus sont `admin`, `competition`, `score_table`, `speaker`. Ils
n’existent pas encore et sortent du périmètre de cette migration. À prévoir :

| Rôle | Besoin |
| --- | --- |
| `admin` | lecture/écriture sur tout le périmètre `arena_*` |
| `competition` | écriture sur `arena_groups`, `arena_group_teams`, `arena_matches` |
| `score_table` | écriture sur `arena_matches` (score, statut) et `arena_match_events` |
| `speaker` | lecture seule étendue, y compris les compositions d’équipe |

Elles s’ajouteront sous la forme `CREATE POLICY … TO authenticated USING (<rôle staff>)`
une fois la table des membres du staff créée.

---

## 6. PII — ce qui ne doit jamais devenir public

`captain_phone`, `captain_email`, `captain_first_name`, `captain_last_name`,
`arena_players.phone`, `arena_players.email`, `arena_players.date_of_birth`,
`arena_player_invites.token_hash`, et tous les identifiants de paiement.

**Stratégie retenue : vue de projection.** RLS filtre des lignes, pas des
colonnes ; ouvrir `arena_teams` en lecture publique exposerait donc les
coordonnées du capitaine. La table reste entièrement fermée et le public passe
par :

```sql
public.arena_public_teams  -- id, event_id, name, city, couleurs, logo_url, status, created_at
```

Cette vue s’appuie volontairement sur les droits de son propriétaire
(pas de `security_invoker`) : c’est ce qui lui permet de lire une table dont
l’accès direct est révoqué. Le linter Supabase la signalera comme
« security definer view » — c’est **intentionnel et sûr** ici, la vue ne
sélectionnant aucune colonne sensible.

`arena_matches` et `arena_match_events` ne contiennent aucune PII (uniquement des
UUID, scores et horodatages) et sont donc directement lisibles — ce qui est
également nécessaire au fonctionnement de Realtime (§ 9).

**Tokens d’invitation** : seul `token_hash` est stocké. Le token brut n’existe
que dans le lien envoyé par SMS et ne doit jamais être écrit en base ni
journalisé. Le hachage (ex. SHA-256) se calcule côté serveur.

---

## 7. Classement officiel et classement LIVE

Une **seule** implémentation alimente les deux classements :

```sql
public.arena_group_standings_core(p_include_live boolean)
```

| Objet | Matchs pris en compte |
| --- | --- |
| `arena_group_standings` (vue) | `status = 'finished'` **uniquement** |
| `arena_live_group_standings` (vue) | `status IN ('finished', 'live')` |

Un match `live` est compté provisoirement **comme s’il se terminait au score
courant**. Exemple validé en test : une équipe à 4 points qui mène son match
affiche 7 points en LIVE ; si elle se fait égaliser, elle repasse à 5. Le
classement officiel, lui, reste à 4 tant que le match n’est pas `finished`.

Seule la phase de poules est classée (`phase = 'group'`). Les équipes d’une
poule qui n’ont pas encore joué apparaissent avec des zéros.

**Ne jamais mélanger les deux résultats.** Le frontend affiche soit
« CLASSEMENT OFFICIEL », soit « CLASSEMENT PROVISOIRE — EN DIRECT ».

### Colonnes exposées

`event_id`, `group_id`, `group_name`, `group_display_order`, `team_id`,
`team_name`, `played`, `wins`, `draws`, `losses`, `goals_for`, `goals_against`,
`goal_difference`, `points`, `discipline_points`, `head_to_head_points`,
`head_to_head_goal_difference`, `head_to_head_goals_for`, `rank`.

La vue LIVE ajoute `is_live` (l’équipe dispute un match en cours) et
`live_match_id`.

`rank` est une position stricte de 1 à N, sans ex æquo : le tri se termine par
`team_name` puis `team_id`, ce qui rend l’ordre totalement déterministe et donc
stable entre deux rafraîchissements — indispensable pour l’animation.

---

## 8. Départage

Les deux classements utilisent **exactement** la même hiérarchie :

1. `points` (victoire 3, nul 1, défaite 0)
2. `goal_difference`
3. **confrontation directe**
4. `goals_for`
5. **discipline** (croissant)
6. `team_name` puis `team_id` — départage final purement déterministe

### Confrontation directe — stratégie retenue

Mini-championnat sur groupe d’ex æquo, en une seule passe SQL :

1. les équipes sont regroupées par `(points, goal_difference)` ;
2. tout groupe contenant au moins 2 équipes déclenche le calcul : pour chaque
   équipe concernée, on recalcule points, différence de buts et buts marqués en
   ne gardant **que les rencontres jouées contre les autres équipes du groupe** ;
3. ces trois valeurs (`head_to_head_points`, `head_to_head_goal_difference`,
   `head_to_head_goals_for`) s’intercalent dans le tri entre `goal_difference`
   et `goals_for`.

Cas particuliers :

- **rencontre directe pas encore jouée** → les colonnes valent 0 pour toutes les
  équipes concernées, le tri passe naturellement au critère suivant ;
- **triangulaire parfaite** (A bat B, B bat C, C bat A) → le mini-championnat ne
  sépare pas, le tri descend jusqu’à la discipline. Comportement vérifié en test.

Ce choix est volontairement **non récursif** : pas de recalcul en boucle après
élimination d’une équipe. C’est fiable, lisible et déterministe, au prix d’une
fidélité imparfaite aux règlements qui rejouent le mini-classement après chaque
séparation. Le critère n’est jamais supprimé, et les colonnes `head_to_head_*`
sont exposées pour qu’un arbitrage humain reste possible.

### Discipline

Calculée **exclusivement** depuis `arena_match_events` — aucune colonne
modifiable à la main n’existe dans `arena_teams`. Seuls les événements des
matchs comptés dans le classement concerné sont pris en compte.

Barème V1, porté par la fonction `public.arena_discipline_weight(text)` :

| Événement | Points |
| --- | --- |
| `yellow_card` | 1 |
| `two_minute` | 2 |
| `red_card` | 3 |
| autres | 0 |

**Moins de points = meilleur classement.** Pour changer le barème, remplacer le
corps de cette seule fonction : les deux classements suivent immédiatement,
aucune donnée n’est à recalculer.

---

## 9. Realtime

### Tables à observer

| Table | Événements | Pourquoi |
| --- | --- | --- |
| `arena_matches` | `UPDATE`, `INSERT` | `home_score`, `away_score` et `status` déterminent entièrement le classement LIVE |
| `arena_match_events` | `INSERT` | statistiques du speaker, et points de discipline (5ᵉ critère de départage) |

Les deux tables sont ajoutées à la publication `supabase_realtime` par la
migration, de façon idempotente et sans échec si la publication n’existe pas
encore sur l’instance. Dans ce cas, activer la réplication manuellement :
**Dashboard Supabase → Database → Replication → `supabase_realtime`**, puis
cocher `arena_matches` et `arena_match_events`.

`arena_matches` est passée en `REPLICA IDENTITY FULL` : le payload d’un `UPDATE`
contient alors l’ancienne ligne, ce qui permet au client de savoir si le score
ou le statut a réellement changé sans requête supplémentaire.

Realtime respecte RLS : `anon` doit pouvoir lire ces tables pour recevoir les
messages, ce que garantissent les policies `arena_matches_public_read` et
`arena_match_events_public_read`.

### Ce que le frontend doit faire

Un classement est une **vue calculée** : PostgreSQL ne réplique pas les vues.
Le client ne reçoit donc jamais « le classement a changé », il reçoit « ce match
a changé » et doit recharger :

```
changement sur arena_matches (score ou status)
        └─> refetch de arena_live_group_standings pour l'event concerné
changement sur arena_match_events
        └─> refetch des statistiques ; refetch du classement si l'événement
            est disciplinaire (yellow_card, two_minute, red_card)
```

Recommandations : un seul canal par événement, et un léger *debounce*
(~200–300 ms) pour absorber les rafales de la table de marque. Ne pas tenter de
recalculer le classement côté client : la hiérarchie de départage doit rester
définie à un seul endroit, en SQL.

### Contrat de données pour l’animation (frontend, plus tard)

La base **ne stocke pas** `previousRank`. Le client conserve le classement
précédent en mémoire et compare :

| Comparaison | Interprétation |
| --- | --- |
| `currentRank < previousRank` | montée |
| `currentRank > previousRank` | descente |
| égalité | aucun mouvement |

`team_id` est la clé stable d’identification des lignes entre deux
rafraîchissements. L’animation elle-même (transition douce, sans rechargement de
page) appartient entièrement au frontend et ne fait pas partie de cette
migration.

---

## 10. Appliquer la migration

**La migration n’a pas été appliquée à 340-hub.** Elle doit d’abord être relue.

Elle a en revanche été exécutée et testée sur une instance PostgreSQL 16 jetable
reproduisant les rôles Supabase (`anon`, `authenticated`, `service_role`) : la
migration passe, est ré-exécutable sans erreur, et les classements, contraintes,
policies et cascades ont été vérifiés.

### Option A — Supabase CLI (recommandée)

```bash
npx supabase link --project-ref <ref-du-projet-340-hub>
npx supabase db push
```

`db push` n’applique que les migrations absentes de l’historique distant.
Vérifier au préalable avec `npx supabase migration list`.

### Option B — SQL Editor

Copier le contenu de `supabase/migrations/20260813120000_arena_database_foundation.sql`
dans le SQL Editor du dashboard, puis exécuter. Le fichier est conçu pour être
rejouable sans effet de bord.

### Après application

1. vérifier que les 11 tables `arena_*` ont bien RLS actif ;
2. vérifier la publication Realtime (§ 9) ;
3. régénérer les types TypeScript (§ 11).

---

## 11. Régénérer `lib/database.types.ts`

⚠️ Le fichier `lib/database.types.ts` actuel est **écrit à la main**. Il décrit la
migration telle qu’elle sera appliquée, mais **n’a pas été généré depuis
l’instance distante** — celle-ci ne contient pas encore ces tables.

Une fois la migration appliquée :

```bash
npx supabase gen types typescript \
  --project-id <ref-du-projet-340-hub> \
  --schema public \
  > lib/database.types.ts
```

Le fichier généré décrira **toutes** les tables de 340-hub, y compris celles des
autres modules. Deux options :

- le conserver tel quel (le typage reste correct, L’ARÈNE n’utilise que les
  tables `arena_*`) ;
- ou en extraire les seules entrées `arena_*` pour préserver l’isolation
  documentaire.

Dans les deux cas, réintroduire les unions de statuts et les alias exportés
(`ArenaStandingsRow`, `ArenaRow`, …), que le générateur ne produit pas : les
vues et fonctions sont typées, mais sans unions littérales pour les colonnes
`text` protégées par `CHECK`.

---

## 12. Sécurité

Aucun secret ne figure dans ce dossier : ni clé `service_role`, ni mot de passe
base, ni identifiant de prestataire de paiement. `arena_player_payments` ne
stocke que des identifiants opaques renvoyés par le prestataire.

Le dépôt est public — cette règle est absolue.
