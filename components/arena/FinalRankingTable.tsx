import type { FinalRanking } from "@/lib/arena/final-ranking";
import { participantName } from "@/lib/arena/types";

/**
 * Classement final, dérivé des résultats.
 *
 * Une place dont le match décisif n'est pas joué reste **ouverte** : elle
 * affiche ce qui la déterminera — « Vainqueur de la finale », « Perdant du
 * match places 9e / 10e » — plutôt qu'un blanc ou une équipe supposée.
 *
 * Le podium est mis en avant ; le reste suit la même trame que le classement
 * de poule, sans style nouveau.
 */
export function FinalRankingTable({ ranking }: { ranking: FinalRanking }) {
  return (
    <div className="overflow-hidden rounded-xl border border-arena-line bg-arena-surface/80">
      <ol>
        {ranking.rows.map((row) => {
          const resolved = row.participant !== null;
          const podium = row.place <= 3;

          return (
            <li
              key={row.place}
              className="flex min-h-[52px] items-center gap-3 border-b border-arena-line/60 px-3 py-2.5 last:border-b-0"
            >
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded font-display text-sm leading-none ${
                  podium
                    ? "bg-arena-gold text-arena-black"
                    : "border border-arena-line text-arena-muted"
                }`}
              >
                {row.place}
              </span>

              <span className="min-w-0 flex-1">
                {resolved ? (
                  <span className="block truncate font-display text-base uppercase text-arena-white sm:text-lg">
                    {participantName(row.participant!)}
                  </span>
                ) : (
                  <span className="block truncate text-xs font-semibold uppercase tracking-[0.08em] text-arena-muted">
                    {row.pendingLabel}
                  </span>
                )}
              </span>

              {!resolved && (
                <span className="shrink-0 rounded border border-arena-line px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-arena-muted">
                  À jouer
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <p className="border-t border-arena-line px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-arena-muted">
        {ranking.resolvedCount} place{ranking.resolvedCount > 1 ? "s" : ""}{" "}
        attribuée{ranking.resolvedCount > 1 ? "s" : ""} sur {ranking.rows.length}
      </p>
    </div>
  );
}
