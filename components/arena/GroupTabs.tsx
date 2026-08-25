import Link from "next/link";

import type { GroupSummary } from "@/lib/arena/types";

/**
 * Onglets de sélection de poule.
 *
 * Les onglets viennent des poules réellement présentes dans le format : il ne
 * peut donc jamais y avoir d'onglet inutilisable. La sélection passe par
 * l'URL (`?poule=A`), ce qui garde la page entièrement en rendu serveur et rend
 * chaque poule partageable par lien.
 */
export function GroupTabs({
  groups,
  activeGroupId,
  basePath,
}: {
  groups: GroupSummary[];
  activeGroupId: string;
  basePath: string;
}) {
  return (
    <nav aria-label="Choix de la poule">
      <ul
        className={`grid gap-2 sm:gap-3 ${
          groups.length <= 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
        }`}
      >
        {groups.map((group) => {
          const active = group.id === activeGroupId;
          return (
            <li key={group.id} className="min-w-0">
              <Link
                href={`${basePath}?poule=${group.id}`}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] items-center gap-3 rounded-lg border px-3 transition-colors ${
                  active
                    ? "border-arena-gold bg-arena-gold/10"
                    : "border-arena-line bg-arena-surface hover:border-arena-gold/60"
                }`}
              >
                <span
                  className={`font-display text-2xl leading-none ${
                    active ? "text-arena-gold" : "text-arena-white"
                  }`}
                >
                  {group.letter}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block truncate text-[11px] font-bold uppercase tracking-[0.14em] ${
                      active ? "text-arena-gold" : "text-arena-white"
                    }`}
                  >
                    Poule {group.letter}
                  </span>
                  <span className="block truncate text-[10px] font-medium uppercase tracking-[0.1em] text-arena-muted">
                    {group.teamCount} équipes
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
