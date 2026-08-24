import {
  ColumnSeparator,
  FinaleCard,
  PairingCard,
  RoundTransition,
} from "@/components/arena/BracketPieces";
import { SectionHeading } from "@/components/arena/SectionHeading";
import type { BracketRound } from "@/lib/arena/types";

/**
 * Aperçu du tableau final — « le chemin des survivants ».
 *
 * La composition est entièrement dérivée des tours reçus : deux poules donnent
 * demi-finales + finale, quatre poules donnent quarts + demies + finale. Aucun
 * test sur le nombre d'équipes n'existe ici.
 *
 * Mobile  : tours empilés, mais les confrontations d'un même tour se placent sur
 *           deux colonnes — le tableau à 4 poules tient ainsi en 4 rangées au
 *           lieu de 7. Aucun défilement latéral.
 * Desktop : une colonne par tour, séparées par un filet doré.
 *
 * Tant qu'aucun qualifié n'est connu, chaque place affiche son origine
 * abstraite, comme la vue `arena_knockout_bracket` côté base.
 */
export function BracketPreview({
  rounds,
  eventDateLabel,
}: {
  rounds: BracketRound[];
  eventDateLabel: string;
}) {
  return (
    <section aria-labelledby="bracket-title">
      <SectionHeading
        id="bracket-title"
        title="Chemin des survivants"
        actionLabel="Voir le tableau complet"
        actionHref="/tableau"
      />
      <div className="arena-grain relative overflow-hidden rounded-xl border border-arena-line bg-arena-surface/80 p-4 sm:p-5 lg:p-6">
        <BracketRoundsLayout rounds={rounds} eventDateLabel={eventDateLabel} />
      </div>
    </section>
  );
}

/**
 * Mise en page des tours, partagée avec la page Tableau.
 * Le nombre de colonnes desktop suit le nombre de tours du format.
 */
export function BracketRoundsLayout({
  rounds,
  eventDateLabel,
}: {
  rounds: BracketRound[];
  eventDateLabel: string;
}) {
  const columns = rounds.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

  return (
    <ol className={`grid gap-0 lg:gap-0 ${columns}`}>
      {rounds.map((round, index) => {
        const isFinale = round.id === "final";
        // Une seule confrontation occupe toute la largeur ; au-delà, deux
        // colonnes sur mobile pour contenir la hauteur.
        const pairingGrid =
          round.pairings.length > 1 ? "grid-cols-2" : "grid-cols-1";

        return (
          <li
            key={round.id}
            className="relative min-w-0 lg:px-6 lg:first:pl-0 lg:last:pr-0"
          >
            {index > 0 && (
              <>
                <ColumnSeparator />
                <RoundTransition />
              </>
            )}

            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold">
              {round.name}
            </h3>

            <ul
              className={`grid gap-3 ${pairingGrid} lg:h-[calc(100%-2rem)] lg:grid-cols-1 lg:content-around`}
            >
              {round.pairings.map((pairing) => (
                <li key={pairing.id} className="min-w-0">
                  {isFinale ? (
                    <FinaleCard
                      pairing={pairing}
                      eventDateLabel={eventDateLabel}
                    />
                  ) : (
                    <PairingCard pairing={pairing} />
                  )}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
