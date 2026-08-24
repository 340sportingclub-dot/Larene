import { BracketPreview } from "@/components/arena/BracketPreview";
import { GroupsSection } from "@/components/arena/GroupsSection";
import { LiveHero } from "@/components/arena/LiveHero";
import { NextMatch } from "@/components/arena/NextMatch";
import { StatsPreview } from "@/components/arena/StatsPreview";
import {
  demoBracket,
  demoEvent,
  demoFollowingMatch,
  demoGroups,
  demoLiveMatch,
  demoNextMatch,
  demoStatLeaders,
} from "@/lib/arena/demo-data";

/**
 * Accueil public de L'ARÈNE.
 *
 * Cette page ne fait qu'assembler des sections et leur passer des données.
 * Toute la structure — nombre de poules, présence de quarts, composition du
 * tableau — vient du format central via `lib/arena/demo-data.ts`. Aucun test
 * sur le nombre d'équipes ici.
 */
export default function Home() {
  return (
    <main>
      <LiveHero match={demoLiveMatch} />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:space-y-12 sm:px-6 sm:py-10 lg:space-y-16 lg:px-8 lg:py-14">
        {demoNextMatch && (
          <NextMatch match={demoNextMatch} following={demoFollowingMatch} />
        )}
        <GroupsSection groups={demoGroups} />
        <StatsPreview leaders={demoStatLeaders} />
        <BracketPreview
          rounds={demoBracket}
          eventDateLabel={demoEvent.dateLabel}
        />
      </div>
    </main>
  );
}
