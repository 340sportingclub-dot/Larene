import { GroupCard } from "@/components/arena/GroupCard";
import { SectionHeading } from "@/components/arena/SectionHeading";
import type { GroupSummary } from "@/lib/arena/types";

/**
 * Les poules.
 *
 * La grille suit le nombre de poules réellement présentes dans le format —
 * jamais de carte vide, jamais de poule fantôme :
 *   2 poules → deux grandes cartes pleine largeur sur mobile, côte à côte ensuite ;
 *   4 poules → grille 2×2 sur mobile, quatre colonnes à partir de la tablette.
 *
 * `auto-fit` n'est pas utilisé : la grille doit rester régulière dans les deux
 * cas, y compris avec des effectifs de poule inégaux.
 */
export function GroupsSection({ groups }: { groups: GroupSummary[] }) {
  const compact = groups.length <= 2;

  return (
    <section aria-labelledby="groups-title">
      <SectionHeading
        id="groups-title"
        title="Les poules"
        actionLabel="Voir tous les groupes"
        actionHref="/groupes"
      />
      <ul
        className={`grid gap-3 sm:gap-4 ${
          compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-4"
        }`}
      >
        {groups.map((group) => (
          <li key={group.id} className="min-w-0">
            <GroupCard group={group} featured={compact} />
          </li>
        ))}
      </ul>
    </section>
  );
}
