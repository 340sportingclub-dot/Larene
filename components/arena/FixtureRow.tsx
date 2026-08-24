import Link from "next/link";

import type { FixtureMatch } from "@/lib/arena/types";

/**
 * Une ligne de calendrier.
 *
 * Mobile  : deux niveaux — repères (heure, terrain, poule) puis l'affiche.
 * Desktop : une seule ligne, comme la maquette.
 *
 * Le badge de poule vient du calendrier, lui-même produit à partir du format :
 * il ne peut donc jamais désigner une poule inexistante.
 */
export function FixtureRow({ fixture }: { fixture: FixtureMatch }) {
  const finished = fixture.status === "finished";

  return (
    <Link
      href={fixture.href}
      className="group flex min-h-[56px] flex-col gap-2 rounded-lg border border-arena-line bg-arena-surface/70 p-3 transition-colors hover:border-arena-gold/60 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-display text-lg leading-none text-arena-white tabular-nums">
          {fixture.timeLabel}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-arena-muted">
          {fixture.courtLabel}
        </span>
        {fixture.groupLabel && (
          <span className="rounded border border-arena-gold/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-arena-gold">
            {fixture.groupLabel}
          </span>
        )}
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <span className="truncate text-right font-display text-base uppercase text-arena-white sm:text-lg">
          {fixture.home.name}
        </span>
        {finished ? (
          <span className="rounded bg-arena-black/70 px-2 py-0.5 font-display text-base leading-none text-arena-gold tabular-nums sm:text-lg">
            {fixture.homeScore} - {fixture.awayScore}
          </span>
        ) : (
          <span className="font-display text-sm italic text-arena-gold">VS</span>
        )}
        <span className="truncate font-display text-base uppercase text-arena-white sm:text-lg">
          {fixture.away.name}
        </span>
      </div>

      <span
        className={`shrink-0 self-start rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] sm:self-auto ${
          finished
            ? "border-arena-line text-arena-muted"
            : "border-arena-gold/45 text-arena-gold"
        }`}
      >
        {finished ? "Terminé" : "À venir"}
      </span>
    </Link>
  );
}
