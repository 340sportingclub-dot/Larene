import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegistrationSteps } from "@/components/arena/RegistrationSteps";
import { TeamPassCard } from "@/components/arena/TeamPassCard";
import { arenaInfo } from "@/lib/arena/info-data";
import { getTeamOverview } from "@/lib/arena/registration";
import { getTeamSession } from "@/lib/arena/team-session";

export const metadata: Metadata = { title: "Équipe enregistrée — L’ARÈNE" };
export const dynamic = "force-dynamic";

/**
 * Fin du parcours.
 *
 * Pas un « formulaire envoyé avec succès » : une convocation nominative, et une
 * porte vers l'espace équipe. Le capitaine repart avec quelque chose à montrer.
 */
export default async function Page() {
  const session = await getTeamSession();
  if (!session) redirect("/inscription");

  const team = await getTeamOverview(session.teamId);
  if (!team) redirect("/inscription");

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-md">
        <RegistrationSteps current={3} />

        <p className="mt-7 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-arena-gold">
          Équipe enregistrée
        </p>

        <div className="mt-4">
          <TeamPassCard
            teamName={team.name}
            city={team.city}
            captainName={team.captainName}
            playerCount={team.players.length}
            paidCount={team.paidCount}
            statusLabel="Inscrite"
            eventDateLabel={arenaInfo.dateLabel}
            venueName={arenaInfo.venueName}
          />
        </div>

        <Link
          href="/equipe"
          className="mt-7 flex min-h-[56px] w-full items-center justify-center rounded-md border border-arena-gold bg-arena-gold px-5 font-display text-lg uppercase tracking-[0.04em] text-arena-black transition-colors hover:bg-arena-gold-light"
        >
          Accéder à mon espace équipe
        </Link>

        <div className="mt-6 rounded-lg border border-arena-line bg-arena-surface/70 p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-arena-gold">
            La suite
          </h2>
          <ul className="mt-3 space-y-2">
            {[
              "Chaque joueur règle ses 15 € : virement, carte via HelloAsso, ou espèces à l’accueil.",
              "Votre effectif reste modifiable jusqu’au coup d’envoi de votre premier match.",
              "Gardez ce lien : c’est votre accès à l’espace équipe.",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-arena-gold-dark"
                />
                <span className="text-[13px] leading-relaxed text-arena-white/85">
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
