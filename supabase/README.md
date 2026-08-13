# Supabase — L’ARÈNE

Ce dossier accueillera les migrations SQL de L’ARÈNE (`supabase/migrations/`).

**Aucune table n’est créée à ce stade.**

## Règles d’isolation

L’ARÈNE partage l’instance Supabase du projet **340-hub** avec d’autres modules.
Ses données doivent rester strictement isolées :

- toutes les tables de L’ARÈNE sont préfixées `arena_`
  (ex. `arena_events`, `arena_teams`, `arena_players`, `arena_matches`) ;
- aucune modification ne doit toucher les tables des autres modules ;
- le RLS (Row Level Security) doit être activé sur chaque table `arena_*`.

## Secrets

Aucun secret (clé `service_role`, mot de passe base, token) ne doit apparaître
dans ce dossier ni ailleurs dans le dépôt.
