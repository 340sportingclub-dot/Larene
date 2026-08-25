import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Client Supabase de L'ARÈNE.
 *
 * Utilise exclusivement les variables publiques :
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * La clé `service_role` ne doit JAMAIS être utilisée ici ni exposée côté client.
 *
 * L'ARÈNE partage l'instance Supabase "340-hub" avec d'autres modules :
 * toutes ses tables sont préfixées `arena_` et son isolation est garantie
 * par les policies RLS côté base.
 */

/**
 * Supabase a changé de génération de clés publiques : la clé « anon » (JWT
 * `eyJ…`) est remplacée par une clé « publishable » (`sb_publishable_…`).
 * Les deux noms sont acceptés, sans quoi un projet migré vers le format récent
 * se retrouve avec un client `null` alors que sa clé est bien configurée.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type ArenaSupabaseClient = SupabaseClient<Database>;

/** `true` lorsque les variables d'environnement Supabase sont présentes. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: ArenaSupabaseClient | null = null;

/**
 * Retourne le client Supabase, ou `null` tant que les variables
 * d'environnement ne sont pas renseignées (phase d'initialisation,
 * build sans secrets, preview non configurée).
 */
export function getSupabaseClient(): ArenaSupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  client ??= createClient<Database>(supabaseUrl, supabaseAnonKey);

  return client;
}

/**
 * Comme `getSupabaseClient`, mais lève une erreur explicite si la
 * configuration est absente. À utiliser dans le code métier qui ne peut
 * pas fonctionner sans Supabase.
 */
export function requireSupabaseClient(): ArenaSupabaseClient {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      "Supabase n'est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (voir .env.example).",
    );
  }

  return supabase;
}
