"use server";

import { redirect } from "next/navigation";

import type {
  RosterFormState,
  TeamFormState,
} from "@/app/inscription/form-state";
import {
  createTeam,
  ROSTER_MAX,
  saveRoster,
  type PlayerInput,
} from "@/lib/arena/registration";
import { getTeamSession, issueTeamToken, openTeamSession } from "@/lib/arena/team-session";
import { isAdminConfigured } from "@/lib/supabase-admin";

/**
 * Actions du parcours d'inscription.
 *
 * Toutes les écritures passent ici : le navigateur n'obtient jamais de droit
 * direct sur `arena_teams` ni `arena_players`.
 *
 * Le capitaine est authentifié dès la création de son équipe — un jeton est
 * émis et le cookie posé immédiatement. Sa progression est donc sauvegardée :
 * s'il ferme l'onglet au milieu de la saisie de l'effectif, il retrouve son
 * équipe en revenant.
 */

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createTeamAction(
  _previous: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const values = {
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    teamName: text(formData, "teamName"),
    city: text(formData, "city"),
  };

  if (!isAdminConfigured) {
    return {
      errors: {},
      message:
        "Les inscriptions en ligne ne sont pas encore ouvertes. Écrivez-nous sur WhatsApp, nous réservons votre place.",
      values,
    };
  }

  const result = await createTeam(values);

  if (!result.ok) {
    return {
      errors: result.errors,
      message: result.message ?? null,
      values,
    };
  }

  // Le capitaine devient immédiatement propriétaire de son espace : le jeton
  // est émis et le cookie posé avant même la saisie de l'effectif.
  const token = await issueTeamToken(result.teamId);
  await openTeamSession(token);

  redirect("/inscription/effectif");
}

export async function saveRosterAction(
  _previous: RosterFormState,
  formData: FormData,
): Promise<RosterFormState> {
  const session = await getTeamSession();

  if (!session) {
    return {
      errors: {},
      message:
        "Votre session a expiré. Rouvrez le lien reçu, ou recommencez l’inscription.",
    };
  }

  const players: PlayerInput[] = [];

  for (let index = 0; index < ROSTER_MAX; index += 1) {
    const firstName = text(formData, `players[${index}].firstName`);
    const lastName = text(formData, `players[${index}].lastName`);
    const dateOfBirth = text(formData, `players[${index}].dateOfBirth`);
    const phone = text(formData, `players[${index}].phone`);

    // Une ligne entièrement vide n'a pas été remplie : on l'ignore plutôt que
    // de reprocher au capitaine un joueur qu'il n'a pas voulu ajouter.
    if (!firstName && !lastName && !dateOfBirth && !phone) continue;

    players.push({ firstName, lastName, dateOfBirth, phone });
  }

  const result = await saveRoster(session.teamId, players);

  if (!result.ok) {
    return { errors: result.errors, message: result.message };
  }

  redirect("/inscription/confirmation");
}
