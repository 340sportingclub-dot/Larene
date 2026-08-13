# L’ARÈNE

Application web **mobile-first** de gestion et d’animation d’un tournoi de football en salle.

> État actuel : **initialisation technique uniquement**.
> Aucune fonctionnalité métier n’est encore développée.

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
lib/          client Supabase, types, utilitaires
public/       assets statiques
supabase/     migrations SQL (à venir)
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
npm run lint    # ESLint
npm run build   # build de production
npm run start   # serveur de production
```

## Variables d’environnement

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase `340-hub` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (anon) du projet Supabase |

Le modèle se trouve dans [`.env.example`](./.env.example).
Le fichier `.env.local` est ignoré par Git et ne doit jamais être committé.

Le client Supabase (`lib/supabase.ts`) tolère l’absence de ces variables :
`getSupabaseClient()` renvoie `null` tant que la configuration est incomplète,
ce qui permet de builder l’application sans credentials.

## Isolation des données (`arena_*`)

L’ARÈNE partage l’instance Supabase du projet **340-hub** avec d’autres modules.
Ses données doivent rester **strictement isolées** :

- toutes les tables métier de L’ARÈNE sont préfixées `arena_`
  (ex. `arena_events`, `arena_teams`, `arena_players`, `arena_matches`) ;
- aucune écriture ni lecture sur les tables des autres modules ;
- RLS activé sur chaque table `arena_*`.

Aucune table n’est créée à ce stade.

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
2. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   dans **Settings → Environment Variables** (Production, Preview, Development).
3. Build : `npm run build` — Output : géré automatiquement par Vercel.

Aucune configuration supplémentaire n’est requise.
