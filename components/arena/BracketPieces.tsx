import { TrophyIcon } from "@/components/arena/icons";
import type { BracketPairing, BracketSlot } from "@/lib/arena/types";

/**
 * Briques d'affichage du tableau final, partagées par l'aperçu de l'accueil et
 * par la page Tableau. Aucune confrontation n'est écrite ici : ces composants
 * ne font que rendre ce que le format leur donne.
 */

export function SlotRow({ slot }: { slot: BracketSlot }) {
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

export function PairingCard({ pairing }: { pairing: BracketPairing }) {
  return (
    <div className="h-full rounded-lg border border-arena-line bg-arena-black/60 p-2.5">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-arena-muted">
        {pairing.code}
      </p>
      <SlotRow slot={pairing.home} />
      <div aria-hidden="true" className="my-1.5 h-px bg-arena-line/70" />
      <SlotRow slot={pairing.away} />
    </div>
  );
}

export function FinaleCard({
  pairing,
  eventDateLabel,
}: {
  pairing: BracketPairing;
  eventDateLabel: string;
}) {
  return (
    <div className="relative h-full overflow-hidden rounded-lg border border-arena-gold/45 bg-arena-black/70 p-4 text-center">
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
          Qui sera le dernier <span className="text-arena-gold">survivant</span> ?
        </p>
      </div>
    </div>
  );
}

/** Filet vertical + chevron entre deux colonnes de tours. Desktop, décoratif. */
export function ColumnSeparator() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 hidden w-px lg:block"
    >
      <span className="block h-full w-px bg-[linear-gradient(180deg,transparent,rgba(213,165,72,0.35),transparent)]" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-arena-gold-dark">
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 2 5 4-5 4" />
        </svg>
      </span>
    </span>
  );
}

/** Transition entre deux tours empilés. Mobile uniquement, décoratif. */
export function RoundTransition() {
  return (
    <span
      aria-hidden="true"
      className="mx-auto my-3 flex h-5 w-5 items-center justify-center text-arena-gold-dark lg:hidden"
    >
      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 4 4 5 4-5" />
      </svg>
    </span>
  );
}
