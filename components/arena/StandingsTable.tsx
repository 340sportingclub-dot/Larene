import type { GroupStandings } from "@/lib/arena/types";

/**
 * Classement d'une poule.
 *
 * Sur mobile, seules les colonnes qui comptent vraiment restent visibles —
 * matchs joués, différence, points. Victoires / nuls / défaites / buts
 * apparaissent à partir de `sm`. Aucune colonne n'est tronquée : elles sont
 * masquées franchement, et l'information reste lisible à 390 px.
 *
 * Le trait de qualification est posé d'après `qualifiersPerGroup` du format :
 * il suit donc automatiquement une éventuelle évolution du règlement.
 */
export function StandingsTable({
  standings,
  qualifiersPerGroup,
}: {
  standings: GroupStandings;
  qualifiersPerGroup: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-arena-line bg-arena-surface/80">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Classement de la poule {standings.letter}
        </caption>
        <thead>
          <tr className="border-b border-arena-line text-[10px] font-bold uppercase tracking-[0.12em] text-arena-muted">
            <th scope="col" className="w-9 px-2 py-3 text-center font-bold">
              <span className="sr-only">Rang</span>#
            </th>
            <th scope="col" className="px-1 py-3 font-bold">
              Équipe
            </th>
            <th scope="col" className="w-9 px-1 py-3 text-center font-bold">
              MJ
            </th>
            <th scope="col" className="hidden w-9 px-1 py-3 text-center font-bold sm:table-cell">
              V
            </th>
            <th scope="col" className="hidden w-9 px-1 py-3 text-center font-bold sm:table-cell">
              N
            </th>
            <th scope="col" className="hidden w-9 px-1 py-3 text-center font-bold sm:table-cell">
              D
            </th>
            <th scope="col" className="hidden w-10 px-1 py-3 text-center font-bold md:table-cell">
              BP
            </th>
            <th scope="col" className="hidden w-10 px-1 py-3 text-center font-bold md:table-cell">
              BC
            </th>
            <th scope="col" className="w-11 px-1 py-3 text-center font-bold">
              Diff
            </th>
            <th scope="col" className="w-12 px-2 py-3 text-center font-bold text-arena-gold">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.rows.map((row, index) => {
            const lastQualified = index === qualifiersPerGroup - 1;
            const showCut =
              lastQualified && index < standings.rows.length - 1;

            return (
              <tr
                key={row.teamId}
                className={`border-b border-arena-line/60 last:border-b-0 ${
                  showCut ? "border-b-arena-gold/45" : ""
                }`}
              >
                <td className="px-2 py-3 text-center">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded font-display text-sm leading-none ${
                      row.qualified
                        ? "bg-arena-gold text-arena-black"
                        : "border border-arena-line text-arena-muted"
                    }`}
                  >
                    {row.rank}
                  </span>
                </td>
                <td className="px-1 py-3">
                  <span className="block truncate font-display text-base uppercase text-arena-white sm:text-lg">
                    {row.teamName}
                  </span>
                </td>
                <td className="px-1 py-3 text-center text-sm text-arena-muted tabular-nums">
                  {row.played}
                </td>
                <td className="hidden px-1 py-3 text-center text-sm text-arena-muted tabular-nums sm:table-cell">
                  {row.wins}
                </td>
                <td className="hidden px-1 py-3 text-center text-sm text-arena-muted tabular-nums sm:table-cell">
                  {row.draws}
                </td>
                <td className="hidden px-1 py-3 text-center text-sm text-arena-muted tabular-nums sm:table-cell">
                  {row.losses}
                </td>
                <td className="hidden px-1 py-3 text-center text-sm text-arena-muted tabular-nums md:table-cell">
                  {row.goalsFor}
                </td>
                <td className="hidden px-1 py-3 text-center text-sm text-arena-muted tabular-nums md:table-cell">
                  {row.goalsAgainst}
                </td>
                <td className="px-1 py-3 text-center text-sm text-arena-white tabular-nums">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="px-2 py-3 text-center font-display text-lg leading-none text-arena-gold tabular-nums">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="border-t border-arena-line px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-arena-muted">
        <span
          aria-hidden="true"
          className="mr-2 inline-block h-2 w-2 rounded-[2px] bg-arena-gold align-middle"
        />
        Les {qualifiersPerGroup} premiers se qualifient
      </p>
    </div>
  );
}
