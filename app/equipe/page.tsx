import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InfoCard, InfoRow } from "@/components/arena/InfoCard";
import { CalendarIcon, GroupsIcon, InfoIcon } from "@/components/arena/icons";
import {
  PaymentProgress,
  TeamStatusPills,
  type TeamStatus,
} from "@/components/arena/TeamStatusPills";
import { arenaInfo, formatFee, getDirectionsUrl } from "@/lib/arena/info-data";
import { getTeamOverview, ROSTER_MAX, ROSTER_MIN } from "@/lib/arena/registration";
import { getTeamSession } from "@/lib/arena/team-session";

export const metadata: Metadata = { title: "Mon équipe — L’ARÈNE" };
export const dynamic = "force-dynamic";

/**
 * L'espace du capitaine.
 *
 * Il ne doit pas avoir à parcourir le site public pour retrouver l'essentiel :
 * son effectif, ses paiements, sa convocation. Tout tient sur un écran de
 * téléphone, du plus urgent au plus lointain.
 */
export default async function Page() {
  const session = await getTeamSession();
  if (!session) redirect("/equipe/lien-invalide");

  const team = await getTeamOverview(session.teamId);
  if (!team) redirect("/equipe/lien-invalide");

  const playerCount = team.players.length;
  const feeLabel = formatFee(team.feeCents, team.currency);

  const statuses: TeamStatus[] = [
    {
      label: "Inscription",
      value: playerCount >= ROSTER_MIN ? "Validée" : "En cours",
      tone: playerCount >= ROSTER_MIN ? "done" : "progress",
    },
    {
      label: "Effectif",
      value: `${playerCount} / ${ROSTER_MAX}`,
      tone: playerCount >= ROSTER_MIN ? "done" : "progress",
    },
    {
      label: "Paiements",
      value: `${team.paidCount} / ${playerCount}`,
      tone:
        playerCount > 0 && team.paidCount === playerCount ? "done" : "progress",
    },
    {
      label: "Tournoi",
      value: team.checkedIn ? "Présente" : "En attente",
      tone: team.checkedIn ? "done" : "waiting",
    },
  ];

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-arena-gold">
            Mon équipe
          </p>
          <h1 className="mt-1.5 break-words font-display text-4xl uppercase leading-none text-arena-white sm:text-5xl">
            {team.name}
          </h1>
          {team.city && (
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-arena-muted">
              {team.city}
            </p>
          )}
        </header>

        <TeamStatusPills statuses={statuses} />

        {team.rosterLocked && (
          <p className="rounded-md border border-arena-gold/40 bg-arena-gold/[0.07] px-3.5 py-3 text-sm leading-relaxed text-arena-white">
            Votre effectif est verrouillé : le tournoi a commencé pour votre
            équipe. Adressez-vous à l’organisation pour toute correction.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard icon={GroupsIcon} title="Effectif">
            <ul className="space-y-2">
              {team.players.map((player, index) => (
                <li
                  key={player.id}
                  className="flex min-h-[44px] items-center gap-3 rounded-lg border border-arena-line bg-arena-black/50 px-3 py-2"
                >
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-arena-line font-display text-xs leading-none text-arena-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-[0.04em] text-arena-white">
                    {player.firstName} {player.lastName}
                  </span>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                      player.paid
                        ? "border-arena-gold/45 text-arena-gold"
                        : "border-arena-line text-arena-muted"
                    }`}
                  >
                    {player.paid ? "Payé" : "À régler"}
                  </span>
                </li>
              ))}
            </ul>

            {!team.rosterLocked && (
              <Link
                href="/inscription/effectif"
                className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-md border border-arena-line px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-arena-white transition-colors hover:border-arena-gold/60 hover:text-arena-gold"
              >
                Modifier mon effectif
              </Link>
            )}
          </InfoCard>

          <div className="space-y-4">
            <InfoCard icon={InfoIcon} title="Paiements">
              <PaymentProgress
                paidCount={team.paidCount}
                totalCount={playerCount}
                feeLabel={feeLabel}
              />
              <p className="mt-4 text-xs leading-relaxed text-arena-muted">
                Chaque joueur règle son inscription individuellement : virement,
                carte via HelloAsso, ou espèces à l’accueil le jour du tournoi.
                L’organisation valide chaque règlement.
              </p>
            </InfoCard>

            <InfoCard icon={CalendarIcon} title="Convocation">
              <dl>
                <InfoRow label="Date" value={arenaInfo.dateLabel} />
                <InfoRow label="Lieu" value={arenaInfo.venueName} />
                <InfoRow label="Capitaine" value={team.captainName} />
              </dl>
              <div className="mt-4 grid gap-2">
                <a
                  href={getDirectionsUrl(arenaInfo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] items-center justify-center rounded-md border border-arena-line px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-arena-white transition-colors hover:border-arena-gold/60 hover:text-arena-gold"
                >
                  Itinéraire
                  <span className="sr-only"> (nouvelle fenêtre)</span>
                </a>
                <Link
                  href="/infos"
                  className="flex min-h-[48px] items-center justify-center rounded-md border border-arena-line px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-arena-white transition-colors hover:border-arena-gold/60 hover:text-arena-gold"
                >
                  Règlement & infos pratiques
                </Link>
              </div>
            </InfoCard>
          </div>
        </div>

        <InfoCard icon={CalendarIcon} title="Mes matchs">
          <p className="text-sm leading-relaxed text-arena-muted">
            Votre calendrier apparaîtra ici dès le tirage au sort effectué. En
            attendant, le format complet de la journée est sur la page Infos.
          </p>
          <Link
            href="/matchs"
            className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-md border border-arena-line px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-arena-white transition-colors hover:border-arena-gold/60 hover:text-arena-gold"
          >
            Voir le calendrier du tournoi
          </Link>
        </InfoCard>
      </div>
    </main>
  );
}
