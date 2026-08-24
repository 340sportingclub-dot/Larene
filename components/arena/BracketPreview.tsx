import { SectionHeading } from "@/components/arena/SectionHeading";
import { TrophyIcon } from "@/components/arena/icons";
import type { BracketPairing, BracketRound, BracketSlot } from "@/lib/arena/types";

/**
 * Aperçu du tableau final — « le chemin des survivants ».
 *
 * Le format réel qualifie les 2 premiers de chaque poule, soit 8 équipes :
 * l'aperçu part donc des quarts. La petite finale existe au tournoi mais
 * n'apparaît pas ici, l'aperçu devant rester lisible d'un coup d'œil.
 *
 * Mobile  : les tours sont empilés verticalement. Aucun défilement latéral —
 *           un tableau horizontal serait illisible à 390 px.
 * Desktop : trois colonnes séparées par un filet doré, dans l'esprit de la
 *           maquette.
 *
 * Tant qu'aucun qualifié n'est connu, chaque place affiche son origine
 * abstraite (« 1er poule A », « Vainqueur quart 1 »), exactement comme la vue
 * `arena_knockout_bracket` côté base.
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
        <ol className="grid gap-6 lg:grid-cols-3 lg:gap-0">
          {rounds.map((round, index) => (
            <li key={round.id} className="relative min-w-0 lg:px-6 lg:first:pl-0 lg:last:pr-0">
              {index > 0 && <ColumnSeparator />}

              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold">
                {round.name}
              </h3>

              <ul className="flex flex-col gap-3 lg:h-[calc(100%-2rem)] lg:justify-around">
                {round.pairings.map((pairing) => (
                  <li key={pairing.id} className="min-w-0">
                    {round.id === "finale" ? (
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
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Filet vertical + chevron, entre deux colonnes de tours. Décoratif. */
function ColumnSeparator() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 hidden w-px lg:block"
    >
      <span className="block h-full w-px bg-[linear-gradient(180deg,transparent,rgba(213,165,72,0.35),transparent)]" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-arena-gold-dark">
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m4 2 5 4-5 4" />
        </svg>
      </span>
    </span>
  );
}

function PairingCard({ pairing }: { pairing: BracketPairing }) {
  return (
    <div className="rounded-lg border border-arena-line bg-arena-black/60 p-2.5">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-arena-muted">
        {pairing.code}
      </p>
      <SlotRow slot={pairing.home} />
      <div aria-hidden="true" className="my-1.5 h-px bg-arena-line/70" />
      <SlotRow slot={pairing.away} />
    </div>
  );
}

function SlotRow({ slot }: { slot: BracketSlot }) {
  const resolved = Boolean(slot.teamName);
  return (
    <p
      className={`truncate text-xs font-semibold uppercase tracking-[0.08em] ${
        resolved ? "text-arena-white" : "text-arena-muted"
      }`}
    >
      {slot.teamName ?? slot.label}
    </p>
  );
}

function FinaleCard({
  pairing,
  eventDateLabel,
}: {
  pairing: BracketPairing;
  eventDateLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-arena-gold/45 bg-arena-black/70 p-4 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_100%_at_50%_0%,rgba(169,121,43,0.22),transparent_75%)]"
      />
      <div className="relative">
        <TrophyIcon className="mx-auto h-7 w-7 text-arena-gold" />

        <div className="mt-3 space-y-1.5">
          <SlotRow slot={pairing.home} />
          <p className="font-display text-xs italic text-arena-gold">VS</p>
          <SlotRow slot={pairing.away} />
        </div>

        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-arena-muted">
          {eventDateLabel}
        </p>
        <p className="mt-1 font-display text-lg uppercase leading-tight text-arena-white">
          Qui sera le dernier{" "}
          <span className="text-arena-gold">survivant</span> ?
        </p>
      </div>
    </div>
  );
}
