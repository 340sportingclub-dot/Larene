import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import {
  getStaffRole,
  isStaffRoleId,
  roleHasPermission,
  STAFF_ROLES,
  type StaffPermission,
  type StaffRole,
  type StaffRoleId,
} from "@/lib/arena/staff";

/**
 * Session staff d'Arena Control — SERVEUR UNIQUEMENT.
 *
 * Un code partagé par FONCTION, pas par personne : c'est le choix assumé pour
 * cette édition. Les codes vivent en variables d'environnement, jamais en base
 * et jamais dans le dépôt.
 *
 * Le cookie ne contient que l'identifiant du rôle, signé en HMAC-SHA256 avec un
 * secret serveur. Sans cette signature, n'importe qui pourrait se déclarer
 * `direction` en éditant un cookie. La signature est vérifiée à temps constant.
 */

const COOKIE_NAME = "arena_staff";
/** Une journée de tournoi tient largement dans douze heures. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getSigningSecret(): string | null {
  return process.env.ARENA_STAFF_SESSION_SECRET ?? null;
}

/** `true` si au moins un code de rôle et le secret de signature sont fournis. */
export function isStaffAuthConfigured(): boolean {
  if (!getSigningSecret()) return false;
  return STAFF_ROLES.some((role) => Boolean(process.env[role.codeEnvVar]));
}

/** Les rôles réellement utilisables : ceux dont le code est renseigné. */
export function getAvailableRoles(): StaffRole[] {
  return STAFF_ROLES.filter((role) => Boolean(process.env[role.codeEnvVar]));
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signaturesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

function codesMatch(submitted: string, expected: string): boolean {
  const bufA = Buffer.from(submitted);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

export type StaffLoginResult =
  | { ok: true; role: StaffRole }
  | { ok: false; message: string };

/**
 * Échange un code contre une session.
 *
 * Le code n'indique pas le rôle : on essaie tous les rôles configurés. Un
 * organisateur n'a donc qu'une chose à retenir — son code — et pas un couple
 * rôle + code.
 */
export async function openStaffSession(
  submittedCode: string,
): Promise<StaffLoginResult> {
  const secret = getSigningSecret();

  if (!secret) {
    return {
      ok: false,
      message:
        "Arena Control n’est pas configuré sur cet environnement. Contactez la direction.",
    };
  }

  const code = submittedCode.trim();
  if (!code) {
    return { ok: false, message: "Entrez votre code d’accès." };
  }

  const matched = getAvailableRoles().find((role) =>
    codesMatch(code, process.env[role.codeEnvVar] ?? ""),
  );

  if (!matched) {
    return { ok: false, message: "Code inconnu. Vérifiez auprès de la direction." };
  }

  const store = await cookies();
  store.set(COOKIE_NAME, `${matched.id}.${sign(matched.id, secret)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { ok: true, role: matched };
}

/** Rôle de la session courante, ou `null` si le cookie manque ou est falsifié. */
export async function getStaffRoleFromSession(): Promise<StaffRole | null> {
  const secret = getSigningSecret();
  if (!secret) return null;

  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return null;

  const roleId = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);

  if (!isStaffRoleId(roleId)) return null;
  if (!signaturesMatch(signature, sign(roleId, secret))) return null;

  return getStaffRole(roleId as StaffRoleId);
}

export async function clearStaffSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Garde de page : retourne le rôle s'il porte la permission, `null` sinon.
 * L'appelant décide quoi faire — rediriger vers la connexion, ou afficher un
 * refus explicite.
 */
export async function requirePermission(
  permission: StaffPermission,
): Promise<StaffRole | null> {
  const role = await getStaffRoleFromSession();
  return roleHasPermission(role, permission) ? role : null;
}
