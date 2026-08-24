import type { Metadata } from "next";

import { BracketRoundsLayout } from "@/components/arena/BracketPreview";
import { PairingCard } from "@/components/arena/BracketPieces";
import { PageHero } from "@/components/arena/PageHero";
import {
  demoBracket,
  demoClassificationFixtures,
  demoEvent,
  demoFormat,
  demoThirdPlace,
} from "@/lib/arena/demo-data";
import { participantName } from "@/lib/arena/types";

export const metadata: Metadata = { title: "Le tableau — L’ARÈNE" };

/**
 * Page Tableau.
 *
 * Le tableau n'est écrit nulle part : il vient du scénario retenu, exactement
 * comme l'aperçu de l'accueil. Les deux ne peuvent donc pas diverger.
 *
 * La petite finale est présentée à part : elle décide des 3e et 4e places, elle
 * n'appartient pas à la progression vers le titre.
 */
export default function Page() {
  return (
    <main>
      <PageHero
        title="Le tableau"
        subtitle="Le chemin des survivants"
        meta={[
          `${demoFormat.teamCount} équipes`,
          `${demoFormat.groupCount} poules`,
          `${demoFormat.qualifierCount} qualifiés`,
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <p className="max-w-2xl text-sm leading-relaxed text-arena-muted">
          Les {demoFormat.qualifiersPerGroup} premiers de chaque poule se
          qualifient, soit {demoFormat.qualifierCount} équipes en demi-finales
          croisées. En cas d’égalité en phase éliminatoire, les tirs au but sont
          directs — il n’y a pas de prolongation. Tant que les qualifiés ne sont
          pas connus, chaque place affiche son origine.
        </p>

        <div className="arena-grain relative overflow-hidden rounded-xl border border-arena-line bg-arena-surface/80 p-4 sm:p-5 lg:p-6">
          <BracketRoundsLayout
            rounds={demoBracket}
            eventDateLabel={demoEvent.dateLabel}
          />
        </div>

        {demoThirdPlace && (
          <section aria-labelledby="third-place-title">
            <h2
              id="third-place-title"
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold"
            >
              Petite finale
            </h2>
            <div className="max-w-sm">
              <PairingCard pairing={demoThirdPlace} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-arena-muted">
              Décide des 3e et 4e places, {demoThirdPlace.durationLabel} de jeu.
            </p>
          </section>
        )}

        {demoClassificationFixtures.length > 0 && (
          <section aria-labelledby="classification-title">
            <h2
              id="classification-title"
              className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold"
            >
              Matchs de classement
            </h2>
            <p className="mb-3 text-xs leading-relaxed text-arena-muted">
              Les équipes non qualifiées disputent un match de classement : le
              classement final est ainsi établi de la 1re à la{" "}
              {demoFormat.teamCount}e place.
            </p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {demoClassificationFixtures.map((fixture) => (
                <li
                  key={fixture.id}
                  className="rounded-lg border border-arena-line bg-arena-black/60 p-3"
                >
                  <p className="flex items-baseline justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-arena-muted">
                    <span className="truncate">{fixture.stakeLabel}</span>
                    <span className="shrink-0 text-arena-gold tabular-nums">
                      {fixture.timeLabel}
                    </span>
                  </p>
                  <p className="mt-1.5 truncate text-xs font-semibold uppercase tracking-[0.08em] text-arena-muted">
                    {participantName(fixture.home)}
                  </p>
                  <div aria-hidden="true" className="my-1.5 h-px bg-arena-line/70" />
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-arena-muted">
                    {participantName(fixture.away)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
