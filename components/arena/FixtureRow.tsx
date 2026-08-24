import Link from "next/link";

import { participantName, type FixtureMatch } from "@/lib/arena/types";

/**
 * Une ligne du calendrier officiel.
 *
 * Mobile  : deux niveaux — repères (heure, terrain, poule ou enjeu) puis l'affiche.
 * Desktop : une seule ligne.
 *
 * Un côté dont l'équipe n'est pas encore connue affiche son origine — « A1 »
 * avant le tirage, « 1er poule A » ou « Vainqueur demie 1 » avant le résultat.
 * La ligne reste donc lisible à tout moment de la journée.
 */
export function FixtureRow({ fixture }: { fixture: FixtureMatch }) {
  const finished = fixture.status === "finished";
  const homeName = participantName(fixture.home);
  const awayName = participantName(fixture.away);
  const context = fixture.groupLabel ?? fixture.stakeLabel;

  return (
    <Link
      href={fixture.href}
      className="group flex min-h-[56px] flex-col gap-2 rounded-lg border border-arena-line bg-arena-surface/70 p-3 transition-colors hover:border-arena-gold/60 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="font-display text-lg leading-none text-arena-white tabular-nums">
          {fixture.timeLabel}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-arena-muted">
          {fixture.courtLabel}
        </span>
        {context && (
          <span className="rounded border border-arena-gold/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-arena-gold">
            {context}
          </span>
        )}
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <span className="truncate text-right font-display text-base uppercase text-arena-white sm:text-lg">
          {homeName}
        </span>
        {finished ? (
          <span className="rounded bg-arena-black/70 px-2 py-0.5 font-display text-base leading-none text-arena-gold tabular-nums sm:text-lg">
            {fixture.homeScore} - {fixture.awayScore}
          </span>
        ) : (
          <span className="font-display text-sm italic text-arena-gold">VS</span>
        )}
        <span className="truncate font-display text-base uppercase text-arena-white sm:text-lg">
          {awayName}
        </span>
      </div>

      <span
        className={`shrink-0 self-start rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] sm:self-auto ${
          finished
            ? "border-arena-line text-arena-muted"
            : "border-arena-gold/45 text-arena-gold"
        }`}
      >
        {finished ? "Terminé" : fixture.durationLabel}
      </span>
    </Link>
  );
}
