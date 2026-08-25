import { NextResponse } from "next/server";

import { ACTIVE_EVENT_COLUMNS } from "@/lib/arena/registration";
import { getAdminClient, isAdminConfigured } from "@/lib/supabase-admin";

/**
 * ⚠️ DIAGNOSTIC TEMPORAIRE — À SUPPRIMER UNE FOIS LA CAUSE IDENTIFIÉE.
 *
 * Les logs runtime de la production ne sont pas accessibles depuis les outils
 * dont nous disposons. Cette route remonte donc dans la réponse HTTP ce que
 * `console.error` aurait écrit dans les logs.
 *
 * CE QU'ELLE N'EXPOSE JAMAIS
 * Aucune valeur de variable d'environnement, aucune clé, même tronquée au-delà
 * d'un marqueur de format de 3 caractères. Les NOMS de variables figurent déjà
 * dans `.env.example`, qui est public : les révéler n'apprend rien. La longueur
 * et le format d'une clé ne permettent pas de la reconstituer, mais suffisent à
 * distinguer une variable absente d'une variable mal collée.
 *
 * C'est précisément ce dont on a besoin ici : savoir POURQUOI l'édition n'est
 * pas détectée, sans rien divulguer.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Décrit une variable sans jamais révéler sa valeur. */
function describeSecret(name: string) {
  const raw = process.env[name];

  if (raw === undefined) return { name, present: false, reason: "absente" };
  if (raw === "") return { name, present: false, reason: "présente mais vide" };

  const trimmed = raw.trim();

  return {
    name,
    present: true,
    length: raw.length,
    // Distingue une clé Supabase récente (sb_…) d'un JWT hérité (eyJ…).
    format: raw.slice(0, 3),
    // Cause classique d'un copier-coller : espace ou saut de ligne aux bords.
    hasSurroundingWhitespace: trimmed.length !== raw.length,
    looksLikeSupabaseKey: raw.startsWith("sb_") || raw.startsWith("eyJ"),
  };
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Les NOMS présents dans l'environnement : c'est ce qui révèle une faute de
  // frappe dans le nom d'une variable, cause invisible autrement.
  const relatedNames = Object.keys(process.env)
    .filter((key) => /^(SUPABASE|NEXT_PUBLIC_SUPABASE|ARENA)/.test(key))
    .sort();

  const report: Record<string, unknown> = {
    note: "Diagnostic temporaire. Aucune valeur de clé n’est exposée.",
    horodatage: new Date().toISOString(),
    environnement: {
      NODE_ENV: process.env.NODE_ENV ?? null,
      VERCEL_ENV: process.env.VERCEL_ENV ?? null,
      // L'hôte du projet, pas la clé : permet de vérifier qu'on parle bien à la
      // bonne instance Supabase.
      supabaseHost: url ? new URL(url).host : null,
    },
    variablesPresentes: relatedNames,
    urlSupabase: describeSecret("NEXT_PUBLIC_SUPABASE_URL"),
    cleServiceRole: describeSecret("SUPABASE_SERVICE_ROLE_KEY"),
    secretStaff: describeSecret("ARENA_STAFF_SESSION_SECRET"),
    isAdminConfigured,
  };

  const admin = getAdminClient();

  if (!admin) {
    report.conclusion =
      "Client service_role indisponible : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY n’est pas lue à l’exécution. Comparez « variablesPresentes » avec le nom attendu.";
    return NextResponse.json(report, { status: 200 });
  }

  // La requête exacte de getActiveEvent(), erreur comprise.
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await admin
    .from("arena_events")
    .select(ACTIVE_EVENT_COLUMNS)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  report.requete = {
    table: "arena_events",
    colonnes: ACTIVE_EVENT_COLUMNS,
    filtre: `event_date >= ${today}`,
    dateServeur: today,
  };

  if (error) {
    report.erreur = {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    };
    report.conclusion =
      error.code === "42501"
        ? "Privilège refusé : la clé fournie n’a pas les droits service_role. C’est probablement une clé anon/publishable, ou une clé d’un autre projet."
        : error.code === "PGRST301" || error.code === "42P01"
          ? "La clé est rejetée ou la table est introuvable : vérifiez que la clé appartient bien à ce projet Supabase."
          : "La requête a été refusée. Voir le code et le message ci-dessus.";
    return NextResponse.json(report, { status: 200 });
  }

  if (!data) {
    report.conclusion = `Aucune ligne dans arena_events avec event_date >= ${today}. La connexion fonctionne : c’est la donnée qui manque, ou la date de l’événement est passée.`;
    return NextResponse.json(report, { status: 200 });
  }

  report.evenementTrouve = data;
  report.conclusion =
    "L’édition est correctement détectée. Si /inscription affiche encore « Bientôt en ligne », c’est un déploiement antérieur qui est servi.";

  return NextResponse.json(report, { status: 200 });
}
