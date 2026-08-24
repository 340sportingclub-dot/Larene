import type { Metadata } from "next";

import { GroupTabs } from "@/components/arena/GroupTabs";
import { PageHero } from "@/components/arena/PageHero";
import { StandingsTable } from "@/components/arena/StandingsTable";
import {
  demoFormat,
  demoGroups,
  demoStandings,
} from "@/lib/arena/demo-data";
import { hasGroup } from "@/lib/arena/tournament-format";

export const metadata: Metadata = { title: "Les groupes — L’ARÈNE" };

/**
 * Page Groupes.
 *
 * Les onglets sont produits à partir des poules du format : deux poules en
 * donnent deux, quatre en donnent quatre, et une poule demandée dans l'URL mais
 * inexistante retombe sur la première — aucun onglet ni classement fantôme.
 *
 * La sélection passe par l'URL, la page reste donc entièrement rendue côté
 * serveur et chaque poule est partageable par lien.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ poule?: string }>;
}) {
  const { poule } = await searchParams;
  const requested = (poule ?? "").toUpperCase();
  const activeGroupId = hasGroup(demoFormat, requested)
    ? requested
    : demoFormat.groupIds[0];

  const standings = demoStandings.find(
    (group) => group.groupId === activeGroupId,
  );

  return (
    <main>
      <PageHero
        title="Les groupes"
        subtitle="La route vers les phases finales commence ici"
        meta={[
          `${demoFormat.groupCount} poules`,
          `${demoFormat.teamCount} équipes`,
          `${demoFormat.qualifiersPerGroup} qualifiés par poule`,
        ]}
      />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <GroupTabs
          groups={demoGroups}
          activeGroupId={activeGroupId}
          basePath="/groupes"
        />

        {standings && (
          <section aria-label={`Classement de la poule ${standings.letter}`}>
            <h2 className="mb-3 font-display text-2xl uppercase text-arena-white sm:text-3xl">
              Poule {standings.letter}
            </h2>
            <StandingsTable
              standings={standings}
              qualifiersPerGroup={demoFormat.qualifiersPerGroup}
            />
          </section>
        )}

        <p className="text-xs leading-relaxed text-arena-muted">
          Classements de démonstration. Le classement officiel et le classement
          provisoire en direct seront branchés sur la base au prochain sprint.
        </p>
      </div>
    </main>
  );
}
