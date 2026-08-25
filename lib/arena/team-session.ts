import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { getAdminClient, requireAdminClient } from "@/lib/supabase-admin";

/**
 * Accès du capitaine à son espace équipe — SERVEUR UNIQUEMENT.
 *
 * PRINCIPE
 * Le capitaine reçoit un lien privé contenant un jeton de 32 octets. Le serveur
 * en compare l'empreinte SHA-256 à celle stockée, puis dépose un cookie
 * httpOnly : le jeton quitte alors l'URL et ne circule plus dans l'historique du
 * navigateur, ni dans les en-têtes `Referer` vers l'extérieur.
 *
 * Le jeton en clair n'existe qu'à deux instants : à sa création, où il est
 * retourné une seule fois pour être transmis, et dans le lien lui-même. Il n'est
 * jamais écrit en base, jamais journalisé.
 *
 * CE QUE ÇA PROTÈGE, ET CE QUE ÇA NE PROTÈGE PAS
 * Un lien transmis est un accès transmis : c'est l'essence du procédé, et il
 * n'est pas question de prétendre le contraire. Ce qui l'encadre : entropie de
 * 32 octets, empreinte seule en base, portée limitée à une équipe, révocation et
 * expiration possibles, usage compté. Aucune donnée bancaire ne vit dans cet
 * espace.
 */

const COOKIE_NAME = "arena_team";
/** Le lien reste valable jusqu'à la fin du tournoi, pas au-delà. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type TeamSession = {
  teamId: string;
  tokenId: string;
};

/** SHA-256 hexadécimal minuscule — la forme imposée par la contrainte SQL. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Jeton de 32 octets en base64url : court à lire, impossible à deviner. */
function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Comparaison à temps constant de deux empreintes.
 *
 * La recherche se fait par index sur `token_hash`, donc l'égalité est déjà
 * établie par la base ; cette vérification supplémentaire protège le jour où la
 * lecture se ferait autrement, et coûte quelques microsecondes.
 */
function hashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Émet un nouveau lien d'accès pour une équipe et **révoque le précédent**.
 *
 * Retourne le jeton en clair — c'est la seule occasion de le lire. L'appelant
 * doit le transmettre immédiatement et ne pas le conserver.
 */
export async function issueTeamToken(
  teamId: string,
  label = "capitaine",
): Promise<string> {
  const admin = requireAdminClient();

  // Un seul jeton actif par équipe : l'index unique partiel l'impose côté base,
  // on révoque donc explicitement avant d'insérer.
  await admin
    .from("arena_team_access_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("team_id", teamId)
    .is("revoked_at", null);

  const token = generateToken();

  const { error } = await admin.from("arena_team_access_tokens").insert({
    team_id: teamId,
    token_hash: hashToken(token),
    label,
  });

  if (error) {
    throw new Error(`Impossible d'émettre le lien d'accès : ${error.message}`);
  }

  return token;
}

/**
 * Vérifie un jeton et ouvre la session.
 *
 * Retourne `null` si le jeton est inconnu, révoqué ou expiré — sans distinguer
 * les trois cas, pour ne rien apprendre à qui essaie des jetons au hasard.
 */
export async function openTeamSession(
  token: string,
): Promise<TeamSession | null> {
  if (!token) return null;

  // Environnement non configuré (build sans secrets, Preview incomplète) :
  // aucune session ne peut exister, mais rien ne doit planter.
  const admin = getAdminClient();
  if (!admin) return null;

  const tokenHash = hashToken(token);

  const { data, error } = await admin
    .from("arena_team_access_tokens")
    .select("id, team_id, token_hash, expires_at, revoked_at, use_count")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return null;
  if (!hashesMatch(data.token_hash, tokenHash)) return null;
  if (data.revoked_at) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  // Trace d'usage : permet de repérer un lien qui circule anormalement.
  await admin
    .from("arena_team_access_tokens")
    .update({ last_used_at: new Date().toISOString(), use_count: data.use_count + 1 })
    .eq("id", data.id);

  const session: TeamSession = { teamId: data.team_id, tokenId: data.id };
  await writeSessionCookie(session);
  return session;
}

async function writeSessionCookie(session: TeamSession): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, `${session.teamId}:${session.tokenId}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Session courante, relue depuis le cookie.
 *
 * Le cookie ne fait pas foi à lui seul : le jeton qui l'a produit est revérifié
 * en base à chaque appel. Révoquer un lien coupe donc l'accès immédiatement,
 * sans attendre l'expiration du cookie.
 */
export async function getTeamSession(): Promise<TeamSession | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [teamId, tokenId] = raw.split(":");
  if (!teamId || !tokenId) return null;

  const admin = getAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("arena_team_access_tokens")
    .select("id, team_id, expires_at, revoked_at")
    .eq("id", tokenId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.team_id !== teamId) return null;
  if (data.revoked_at) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return { teamId: data.team_id, tokenId: data.id };
}

export async function clearTeamSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Chemin du lien privé, à transmettre au capitaine. */
export function buildTeamAccessPath(token: string): string {
  return `/equipe/acces/${encodeURIComponent(token)}`;
}
