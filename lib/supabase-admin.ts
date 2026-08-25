import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Client Supabase `service_role` — SERVEUR UNIQUEMENT.
 *
 * `import "server-only"` fait échouer la compilation si ce module est importé,
 * même indirectement, depuis un composant client. C'est la garde principale ;
 * la seconde est le nom de la variable d'environnement, volontairement dépourvu
 * du préfixe `NEXT_PUBLIC_` : elle n'existe donc jamais dans un bundle
 * navigateur.
 *
 * POURQUOI CE CLIENT EXISTE
 * Les six tables porteuses de données personnelles — `arena_teams`,
 * `arena_players`, `arena_player_invites`, `arena_player_payments`,
 * `arena_team_access_tokens`, `arena_meal_orders` — sont en refus total :
 * RLS active, aucune policy, privilèges révoqués. Rien ne les lit ni ne les
 * écrit hors de ce client, exécuté côté serveur, après contrôle de session.
 *
 * ⚠️ Toute fonction qui utilise ce client DOIT avoir vérifié au préalable
 * l'identité de l'appelant : session capitaine (portée à une seule équipe) ou
 * session staff (portée à un rôle). Ce client ne connaît aucune limite.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type ArenaAdminClient = SupabaseClient<Database>;

/** `true` lorsque l'écriture serveur est configurée. */
export const isAdminConfigured = Boolean(supabaseUrl && serviceRoleKey);

let client: ArenaAdminClient | null = null;

/**
 * Retourne le client `service_role`, ou `null` tant que la configuration est
 * absente — build sans secrets, Preview non configurée.
 *
 * Préférer `requireAdminClient()` dans le code métier : il échoue clairement au
 * lieu de laisser une écriture silencieusement disparaître.
 */
export function getAdminClient(): ArenaAdminClient | null {
  if (!supabaseUrl || !serviceRoleKey) return null;

  client ??= createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

export function requireAdminClient(): ArenaAdminClient {
  const admin = getAdminClient();

  if (!admin) {
    throw new Error(
      "Supabase n'est pas configuré côté serveur : renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (voir .env.example).",
    );
  }

  return admin;
}
