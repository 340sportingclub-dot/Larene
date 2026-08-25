import Link from "next/link";

import { PinIcon, PlayIcon } from "@/components/arena/icons";
import type { LiveMatch } from "@/lib/arena/types";

/**
 * Bloc d'ouverture : le match en cours.
 *
 * Zone la plus importante de l'accueil, donc composée pour le téléphone
 * d'abord : tout le contenu tient dans la largeur d'un iPhone sans troncature
 * ni défilement latéral. Les tailles typographiques sont fluides (`clamp`), le
 * même composant tient donc de 320 px à 1440 px sans variante de mise en page.
 *
 * Aucune photo n'est utilisée : la lumière de gymnase est entièrement en CSS,
 * en attendant les visuels officiels.
 */
export function LiveHero({ match }: { match: LiveMatch }) {
  return (
    <section
      aria-labelledby="live-hero-title"
      className="arena-spotlight arena-grain relative overflow-hidden border-b border-arena-line/70"
    >
      {/* Reflet du sol, sous les projecteurs. Purement décoratif. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(169,121,43,0.16),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-8 text-center sm:px-6 sm:pb-14 sm:pt-12 lg:pb-20 lg:pt-16">
        <p className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-arena-gold sm:text-xs">
          <span
            aria-hidden="true"
            className="arena-pulse block h-2 w-2 rounded-full bg-arena-ember"
          />
          En direct
        </p>

        <h1
          id="live-hero-title"
          className="mt-3 text-[clamp(2rem,8.5vw,5rem)] uppercase leading-[0.95] text-arena-white"
        >
          Ça joue maintenant
        </h1>

        {/* Colonne | score | colonne : la structure ne change pas d'un
            viewport à l'autre, seules les tailles varient. */}
        <div className="mt-7 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:mt-9 sm:gap-5">
          <TeamColumn name={match.home.name} seedLabel={match.home.seedLabel} />

          <p className="font-display text-[clamp(3.25rem,17vw,8.5rem)] leading-none tracking-[-0.02em] text-arena-white tabular-nums">
            <span className="sr-only">Score : </span>
            {match.homeScore}
            <span className="mx-1 text-arena-gold sm:mx-3">-</span>
            {match.awayScore}
          </p>

          <TeamColumn name={match.away.name} seedLabel={match.away.seedLabel} />
        </div>

        {/* Chronomètre */}
        <div className="mx-auto mt-7 inline-flex flex-col items-center rounded-lg border border-arena-gold/35 bg-arena-black/55 px-6 py-3 sm:mt-9 sm:px-9 sm:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-arena-muted sm:text-xs">
            {match.periodLabel}
          </p>
          <p
            className="font-display text-3xl leading-none text-arena-gold tabular-nums sm:text-4xl"
            aria-label={`Temps de jeu : ${match.clockLabel}`}
          >
            {match.clockLabel}
          </p>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-arena-muted sm:text-xs">
          <PinIcon className="h-4 w-4 shrink-0 text-arena-gold-dark" />
          {match.venueName}
        </p>

        <Link
          href={match.href}
          className="mt-7 inline-flex min-h-[52px] w-full max-w-sm items-center justify-center gap-3 rounded-md border border-arena-gold bg-arena-gold/10 px-6 text-sm font-bold uppercase tracking-[0.14em] text-arena-gold-light transition-colors hover:bg-arena-gold/20 sm:mt-8 sm:w-auto"
        >
          <PlayIcon className="h-4 w-4" />
          Voir le match en direct
        </Link>
      </div>
    </section>
  );
}

function TeamColumn({
  name,
  seedLabel,
}: {
  name: string;
  seedLabel?: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="font-display text-[clamp(1.15rem,5.2vw,2.75rem)] uppercase leading-tight text-arena-white break-words hyphens-auto">
        {name}
      </p>
      {seedLabel && (
        <p className="mt-2 inline-block max-w-full truncate rounded border border-arena-gold/30 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-arena-gold sm:text-[11px]">
          {seedLabel}
        </p>
      )}
    </div>
  );
}
