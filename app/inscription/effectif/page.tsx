import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SquadEditor } from "@/app/inscription/effectif/SquadEditor";
import { RegistrationSteps } from "@/components/arena/RegistrationSteps";
import {
  getTeamOverview,
  ROSTER_MAX,
  ROSTER_MIN,
} from "@/lib/arena/registration";
import { SQUAD_SIZE_LABEL } from "@/lib/arena/rules";
import { getTeamSession } from "@/lib/arena/team-session";

export const metadata: Metadata = { title: "Mon effectif — L’ARÈNE" };
export const dynamic = "force-dynamic";

/**
 * Étape 3 — l'effectif.
 *
 * La session a été ouverte à la création de l'équipe : le capitaine qui revient
 * plus tard retrouve ses joueurs déjà saisis, sans avoir à se reconnecter.
 */
export default async function Page() {
  const session = await getTeamSession();
  if (!session) redirect("/inscription/equipe");

  const team = await getTeamOverview(session.teamId);
  if (!team) redirect("/inscription/equipe");

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <RegistrationSteps current={2} />

        <h1 className="mt-6 font-display text-3xl uppercase leading-none text-arena-white sm:text-4xl">
          Votre effectif
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-arena-muted">
          {team.name} · {SQUAD_SIZE_LABEL}. Le téléphone de chaque joueur sert à
          lui transmettre son inscription à régler.
        </p>

        <div className="mt-7">
          <SquadEditor
            minPlayers={ROSTER_MIN}
            maxPlayers={ROSTER_MAX}
            squadLabel={SQUAD_SIZE_LABEL}
            existing={team.players.map((player) => ({
              firstName: player.firstName,
              lastName: player.lastName,
              dateOfBirth: player.dateOfBirth ?? "",
              phone: player.phone,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
