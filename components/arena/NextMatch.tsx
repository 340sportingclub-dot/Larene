import Link from "next/link";

import { ClockIcon } from "@/components/arena/icons";
import { participantName, type FixtureMatch } from "@/lib/arena/types";

/**
 * Bandeau « prochain match », avec un aperçu du suivant.
 *
 * Mobile  : deux blocs empilés, séparés par un filet doré.
 * Desktop : trois colonnes — heure, affiche, « ensuite » — comme la maquette.
 *
 * Le tournoi ne compte qu'une seule aire de jeu : le libellé vient de
 * `COURT_LABEL`, il n'existe pas de « Terrain 2 ».
 */
export function NextMatch({
  match,
  following,
}: {
  match: FixtureMatch;
  following?: FixtureMatch | null;
}) {
  return (
    <section
      aria-labelledby="next-match-title"
      className="rounded-xl border border-arena-line bg-arena-surface/80"
    >
      <div className="p-4 sm:p-5 lg:flex lg:items-center lg:gap-8 lg:p-6">
        <div className="lg:flex lg:flex-1 lg:items-center lg:gap-8">
          <div className="lg:shrink-0">
            <h2
              id="next-match-title"
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold"
            >
              Prochain match
            </h2>
            <p className="mt-2 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 shrink-0 text-arena-gold-dark" />
              <span className="font-display text-2xl leading-none text-arena-white tabular-nums sm:text-3xl">
                {match.timeLabel}
              </span>
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-arena-muted">
              {match.courtLabel}
              {match.groupLabel ? ` · ${match.groupLabel}` : ""}
            </p>
          </div>

          <div
            aria-hidden="true"
            className="arena-rule my-4 lg:my-0 lg:hidden"
          />

          <Link
            href={match.href}
            className="group grid min-h-[44px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 lg:flex-1"
          >
            <span className="truncate text-right font-display text-lg uppercase text-arena-white transition-colors group-hover:text-arena-gold-light sm:text-xl lg:text-2xl">
              {participantName(match.home)}
            </span>
            <span className="font-display text-base italic text-arena-gold sm:text-lg lg:text-xl">
              VS
            </span>
            <span className="truncate font-display text-lg uppercase text-arena-white transition-colors group-hover:text-arena-gold-light sm:text-xl lg:text-2xl">
              {participantName(match.away)}
            </span>
          </Link>
        </div>

        {following && (
          <>
            <div
              aria-hidden="true"
              className="arena-rule my-4 lg:hidden"
            />
            <div
              aria-hidden="true"
              className="hidden lg:block lg:h-14 lg:w-px lg:shrink-0 lg:bg-arena-line"
            />
            <div className="lg:shrink-0 lg:text-right">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-arena-muted">
                Ensuite
              </h3>
              <p className="mt-1.5 flex items-baseline gap-2 lg:justify-end">
                <span className="font-display text-xl leading-none text-arena-white tabular-nums">
                  {following.timeLabel}
                </span>
                <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.1em] text-arena-muted">
                  {participantName(following.home)}{" "}
                  <span className="text-arena-gold-dark">vs</span>{" "}
                  {participantName(following.away)}
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
