import type { Metadata } from "next";

import { BracketRoundsLayout } from "@/components/arena/BracketPreview";
import { PageHero } from "@/components/arena/PageHero";
import { demoBracket, demoEvent, demoFormat } from "@/lib/arena/demo-data";

export const metadata: Metadata = { title: "Le tableau — L’ARÈNE" };

/**
 * Page Tableau.
 *
 * Le tableau n'est écrit nulle part : il est produit par `buildBracketRounds()`
 * à partir de `demoFormat.knockoutRounds`, exactement comme l'aperçu de
 * l'accueil. Les deux ne peuvent donc pas diverger, et le passage de 4 poules à
 * 2 poules retire les quarts des deux d'un coup.
 */
export default function Page() {
  const meta = [
    `${demoFormat.teamCount} équipes`,
    `${demoFormat.groupCount} poules`,
    `${demoFormat.qualifiersPerGroup} qualifiés par poule`,
    `${demoFormat.qualifierCount} qualifiés`,
  ];

  return (
    <main>
      <PageHero
        title="Le tableau"
        subtitle="Le chemin des survivants"
        meta={meta}
      />

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <p className="max-w-2xl text-sm leading-relaxed text-arena-muted">
          {demoFormat.hasQuarterFinals
            ? "Les deux premiers de chaque poule se qualifient. Huit équipes entrent en quarts de finale, puis demi-finales et finale."
            : "Les deux premiers de chaque poule se qualifient. Quatre équipes entrent directement en demi-finales, puis finale."}{" "}
          Tant que les qualifiés ne sont pas validés, chaque place affiche son
          origine.
        </p>

        <div className="arena-grain relative overflow-hidden rounded-xl border border-arena-line bg-arena-surface/80 p-4 sm:p-5 lg:p-6">
          <BracketRoundsLayout
            rounds={demoBracket}
            eventDateLabel={demoEvent.dateLabel}
          />
        </div>

        <p className="text-xs leading-relaxed text-arena-muted">
          La petite finale fait partie du format du tournoi mais n’apparaît pas
          dans ce tableau : elle sera ajoutée avec le branchement des données
          réelles.
        </p>
      </div>
    </main>
  );
}
