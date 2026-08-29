# L’ARÈNE

Application web **mobile-first** de gestion et d’animation d’un tournoi de football en salle.

> **État actuel.** L’inscription des équipes et l’espace capitaine sont
> fonctionnels et adossés à Supabase. Les pages publiques — accueil, groupes,
> matchs, direct, tableau final — tournent encore sur les données de
> démonstration de [`lib/arena/demo-data.ts`](./lib/arena/demo-data.ts).
> Arena Control (l’espace staff) existe en bibliothèque
> (`lib/arena/staff.ts`, `lib/arena/staff-session.ts`) mais n’a pas encore
> d’écran : aucune route `/control/*`.
>
> L’édition 2026 est **reportée**, à une date non encore fixée. Le tournoi
> reste actif ; voir [« Tournoi reporté »](#tournoi-reporté) plus bas.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- TypeScript
- Tailwind CSS 4
- ESLint (`eslint-config-next`)
- [@supabase/supabase-js](https://supabase.com/docs/reference/javascript)
- npm
- Déploiement Vercel

## Structure

```
app/          routes et layouts (App Router)
components/   composants React partagés
lib/          client Supabase, règles métier, sessions, types
public/       assets statiques
supabase/     migrations SQL appliquées et documentation du modèle
```

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

L’application démarre sur http://localhost:3000.

Autres commandes :

```bash
npm run lint       # ESLint
npm run typecheck  # types Next 16 générés, puis tsc --noEmit
npm run build      # build de production
npm run start      # serveur de production
```

> `npm run typecheck` lance `next typegen` avant `tsc`. Next 16 génère les
> types de routes (`PageProps`, `LayoutProps`) dans `.next/types` : `tsc` seul
> échoue sur un dépôt fraîchement cloné, alors que le code est correct.

Ces trois commandes sont rejouées à chaque *pull request* par
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

## Variables d’environnement

| Variable | Portée | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | publique | URL du projet Supabase `340-hub` |
| `SUPABASE_SERVICE_ROLE_KEY` | **serveur** | Seul chemin d’accès aux données. Jamais de préfixe `NEXT_PUBLIC_`. |
| `ARENA_STAFF_SESSION_SECRET` | **serveur** | Signe le cookie staff d’Arena Control |
| `ARENA_STAFF_CODE_*` | **serveur** | Un code par fonction opérationnelle |

Le modèle complet, commenté, se trouve dans [`.env.example`](./.env.example).
Le fichier `.env.local` est ignoré par Git et ne doit jamais être committé.

Les deux clients tolèrent l’absence de configuration — ils renvoient `null`
plutôt que d’échouer — ce qui permet de builder l’application sans credentials,
en CI comme en preview.

### Aucun accès Supabase depuis le navigateur

Toutes les lectures et écritures passent par
[`lib/supabase-admin.ts`](./lib/supabase-admin.ts), côté serveur, en
`service_role`, après contrôle de session. Le navigateur n’a aucun droit
direct sur la base, pas même en lecture.

Un client `anon` a existé (`lib/supabase.ts`) : il n’était importé nulle part
et laissait croire à une lecture navigateur qui n’existe pas. Il a été retiré.
Il redeviendra nécessaire le jour où les pages publiques s’abonneront à
Supabase Realtime — la stratégie est décrite au § 10 de
[`supabase/README.md`](./supabase/README.md) — et sera réintroduit à ce
moment-là, avec l’usage qui le justifie.

## Isolation des données (`arena_*`)

L’ARÈNE partage l’instance Supabase du projet **340-hub** avec d’autres modules.
Ses données doivent rester **strictement isolées** :

- toutes les tables métier de L’ARÈNE sont préfixées `arena_`
  (ex. `arena_events`, `arena_teams`, `arena_players`, `arena_matches`) ;
- aucune écriture ni lecture sur les tables des autres modules ;
- RLS activé sur chaque table `arena_*`.

## Base de données

Le modèle de données vit dans [`supabase/`](./supabase/) :

- `supabase/migrations/` — migrations SQL versionnées ;
- [`supabase/README.md`](./supabase/README.md) — documentation complète du
  modèle : tables, relations, statuts, RLS, PII, moteur de classement
  (officiel et LIVE), règles de départage, discipline, tableau à élimination
  directe (projection live et tableau officiel), stratégie Realtime, et
  procédures d’application de migration / régénération des types.

> **État** : les trois migrations du dépôt sont **appliquées** sur l’instance
> 340-hub. L’état constaté en base — tables, vues, privilèges, refus — leur
> correspond exactement. Aucune ne doit être rejouée.

Les types TypeScript de `lib/database.types.ts` sont **écrits à la main** et
décrivent ces trois migrations. Ils ne couvrent que `arena_*` : le projet
Supabase héberge aussi `hub_*` et `academy_*`, qui appartiennent au dépôt
[`340-hub`](https://github.com/340sportingclub-dot/340-hub) et n’ont pas à
apparaître ici.

## Dette connue

| Sujet | Détail |
| --- | --- |
| Édition courante | `getActiveEvent()` retient l'édition vivante à la date la plus récente. Exact avec une seule édition ; **à renforcer avant d'en gérer plusieurs**. Une édition `draft` préparée pour l'année suivante prendrait la main sur l'édition ouverte aux inscriptions. Voir le commentaire de la fonction. |
| Plafond d'équipes | `max_teams` est vérifié par comptage puis insertion : deux inscriptions simultanées sur la dernière place peuvent toutes deux passer. Une garantie stricte demande une contrainte en base. |
| Pages publiques | Accueil, groupes, matchs, direct et tableau final tournent sur `lib/arena/demo-data.ts` et affichent une date en dur. Elles ne reflètent pas encore l'état réel de l'édition. |
| Arena Control | Rôles, permissions et session existent en bibliothèque ; aucune route `/control/*` n'est écrite. |

## Tournoi reporté

L’édition en cours est reportée à une date non encore fixée. Cet état
s’exprime **sans aucune migration**, avec les colonnes existantes :

| Ce qu’on veut dire | Comment on l’écrit |
| --- | --- |
| Le tournoi reste actif | `event_status` reste `registration` — surtout pas `cancelled` |
| Les inscriptions sont suspendues | `registration_status = 'paused'` |
| La date est à confirmer | déduit : date annoncée passée, **ou** inscriptions en pause |
| La nouvelle date est connue | saisir `event_date`, repasser `registration_status` à `'open'` |

La dérivation vit dans [`lib/arena/event-state.ts`](./lib/arena/event-state.ts),
seule source de vérité. Elle sert à la fois à l’affichage et au refus
d’écriture : la page d’inscription et la Server Action posent la même question
à la même fonction.

**Aucune fausse date n’est saisie.** Tant que la date est à confirmer,
l’application affiche « Nouvelle date prochainement » au lieu de `event_date`.

## Sécurité — règle absolue

Le dépôt est **public**. Aucun secret ne doit apparaître dans Git :

- pas de mot de passe, token, clé API réelle ;
- pas de clé Supabase `service_role` — jamais côté client, jamais dans le dépôt ;
- pas de secret Stripe, SMS ou autre fournisseur ;
- pas de contenu de `.env.local`.

Seuls les **noms** de variables figurent dans `.env.example`.
Les valeurs réelles vivent dans `.env.local` en local et dans les
*Environment Variables* du projet Vercel en déploiement.

## Déploiement Vercel

1. Importer le dépôt dans Vercel (framework détecté : Next.js).
2. Renseigner les variables du tableau ci-dessus dans
   **Settings → Environment Variables** (Production, Preview, Development).
   `SUPABASE_SERVICE_ROLE_KEY` est indispensable : sans elle, l’inscription et
   l’espace capitaine restent inertes — l’application se construit et s’affiche,
   mais n’atteint jamais la base.
3. Build : `npm run build` — Output : géré automatiquement par Vercel.

Aucune configuration supplémentaire n’est requise.
