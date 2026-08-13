/**
 * Types de la base de données Supabase partagée ("340-hub").
 *
 * L'ARÈNE n'utilise que les tables préfixées `arena_`.
 * Aucune table n'est encore créée : ce fichier sera régénéré via
 * `supabase gen types typescript` dès l'arrivée des premières migrations.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
