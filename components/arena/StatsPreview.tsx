import Link from "next/link";

import { BallIcon, BootIcon } from "@/components/arena/icons";
import { SectionHeading } from "@/components/arena/SectionHeading";
import type { StatLeader } from "@/lib/arena/types";

/**
 * Aperçu des statistiques du tournoi.
 *
 * L'accueil ne montre que le meilleur buteur et le meilleur passeur. Meilleur
 * gardien et MVP relèvent de la future page de vote et n'apparaissent pas ici.
 *
 * Tant que les données réelles ne sont pas branchées, seuls le total et son
 * unité sont affichés : aucun nom de joueur n'est inventé. `playerName` est
 * néanmoins pris en charge, pour que le branchement n'exige aucun changement.
 */
const statIcons = {
  buteur: BallIcon,
  passeur: BootIcon,
} as const;

export function StatsPreview({ leaders }: { leaders: StatLeader[] }) {
  return (
    <section aria-labelledby="stats-title">
      <SectionHeading
        id="stats-title"
        title="Stats du tournoi"
        actionLabel="Voir toutes les stats"
        actionHref="/stats"
      />
      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {leaders.map((leader) => (
          <li key={leader.id} className="min-w-0">
            <StatCard leader={leader} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatCard({ leader }: { leader: StatLeader }) {
  const Icon = statIcons[leader.id as keyof typeof statIcons] ?? BallIcon;

  return (
    <Link
      href={leader.href}
      className="group arena-grain relative flex items-center gap-4 overflow-hidden rounded-xl border border-arena-line bg-arena-surface p-4 transition-colors hover:border-arena-gold/60 sm:flex-col sm:gap-3 sm:p-6 sm:text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(80%_100%_at_50%_0%,rgba(169,121,43,0.14),transparent_72%)]"
      />

      <span className="relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-arena-gold/40 text-arena-gold sm:h-14 sm:w-14">
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
      </span>

      <div className="relative min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-arena-gold sm:text-[11px]">
          {leader.title}
        </p>
        <p className="mt-1 flex items-baseline gap-2 sm:mt-2 sm:justify-center sm:flex-col sm:gap-0">
          <span className="font-display text-4xl leading-none text-arena-white tabular-nums sm:text-6xl">
            {leader.value}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-arena-muted sm:mt-2">
            {leader.unit}
          </span>
        </p>
        {leader.playerName && (
          <p className="mt-1.5 truncate text-xs font-semibold uppercase tracking-[0.1em] text-arena-white/85">
            {leader.playerName}
            {leader.teamName && (
              <span className="text-arena-muted"> · {leader.teamName}</span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
