import { GroupCard } from "@/components/arena/GroupCard";
import { SectionHeading } from "@/components/arena/SectionHeading";
import type { GroupSummary } from "@/lib/arena/types";

/**
 * Les poules.
 *
 * Grille 2 colonnes sur mobile — quatre cartes minuscules côte à côte seraient
 * illisibles à 390 px — puis 3 ou 4 colonnes selon la place. `auto-fit` n'est
 * pas utilisé : le nombre de poules peut valoir 3 comme 4, et la grille doit
 * rester régulière dans les deux cas.
 */
export function GroupsSection({ groups }: { groups: GroupSummary[] }) {
  return (
    <section aria-labelledby="groups-title">
      <SectionHeading
        id="groups-title"
        title="Les poules"
        actionLabel="Voir tous les groupes"
        actionHref="/groupes"
      />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {groups.map((group) => (
          <li key={group.id} className="min-w-0">
            <GroupCard group={group} />
          </li>
        ))}
      </ul>
    </section>
  );
}
