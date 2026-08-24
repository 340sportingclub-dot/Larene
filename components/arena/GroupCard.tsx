import Link from "next/link";

import { ArrowRightIcon, GroupsIcon } from "@/components/arena/icons";
import type { GroupSummary } from "@/lib/arena/types";

/**
 * Carte de poule. La lettre porte toute la charge visuelle, comme sur la
 * maquette. La carte entière est cliquable — un seul lien, pas de lien imbriqué.
 *
 * `featured` est utilisé quand le format ne compte que deux poules : les cartes
 * occupent alors toute la largeur sur mobile et la lettre est agrandie en
 * conséquence. Mêmes couleurs, mêmes bordures, mêmes espacements.
 */
export function GroupCard({
  group,
  featured = false,
}: {
  group: GroupSummary;
  featured?: boolean;
}) {
  return (
    <Link
      href={group.href}
      aria-label={`Poule ${group.letter} — voir le classement`}
      className={`group arena-grain relative flex flex-col items-center justify-between overflow-hidden rounded-xl border border-arena-line bg-arena-surface p-4 text-center transition-colors hover:border-arena-gold/60 sm:p-5 ${
        featured ? "min-h-[200px]" : "min-h-[168px] sm:min-h-[200px]"
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(169,121,43,0.2),transparent_75%)]"
      />

      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-arena-gold">
          Poule
        </p>
        <p
          className={`font-display leading-none text-arena-white ${
            featured ? "text-7xl sm:text-8xl" : "text-6xl sm:text-7xl"
          }`}
        >
          {group.letter}
        </p>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-arena-muted">
          <GroupsIcon className="h-3.5 w-3.5 shrink-0" />
          {group.teamCount} équipes
        </p>
      </div>

      <span className="relative mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded border border-arena-gold/45 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-arena-gold transition-colors group-hover:bg-arena-gold/10 sm:text-[11px]">
        Voir classement
        <ArrowRightIcon className="h-3.5 w-3.5 shrink-0" />
      </span>
    </Link>
  );
}
