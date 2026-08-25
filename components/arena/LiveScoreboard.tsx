import {
  BallIcon,
  CardIcon,
  PinIcon,
  TwoMinuteIcon,
} from "@/components/arena/icons";
import type { LiveMatch, LiveMatchEvent } from "@/lib/arena/types";

/**
 * Tableau de marque du match en cours, en plein écran.
 *
 * Contrairement au bloc d'accueil, ce composant ne renvoie nulle part ailleurs :
 * l'écran ne porte que la rencontre en cours. Même vocabulaire visuel que le
 * hero — halo, grain, chiffres condensés — sans style nouveau.
 */
export function LiveScoreboard({ match }: { match: LiveMatch }) {
  return (
    <section
      aria-labelledby="live-title"
      className="arena-spotlight arena-grain relative overflow-hidden border-b border-arena-line/70"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(169,121,43,0.16),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-8 text-center sm:px-6 sm:pb-14 sm:pt-12">
        <p className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-arena-gold sm:text-xs">
          <span
            aria-hidden="true"
            className="arena-pulse block h-2 w-2 rounded-full bg-arena-ember"
          />
          En direct
        </p>

        <h1
          id="live-title"
          className="mt-3 text-[clamp(1.75rem,7vw,3.5rem)] uppercase leading-[0.95] text-arena-white"
        >
          {match.home.name} <span className="text-arena-gold">vs</span>{" "}
          {match.away.name}
        </h1>

        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-arena-muted">
          {match.stageLabel} · {match.courtLabel}
        </p>

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

const eventIcons = {
  goal: BallIcon,
  penalty_goal: BallIcon,
  own_goal: BallIcon,
  yellow_card: CardIcon,
  red_card: CardIcon,
  two_minute: TwoMinuteIcon,
} as const;

/** Couleur de l'icône : or pour un but, ambre pour un carton, braise pour un rouge. */
const eventTones: Record<LiveMatchEvent["type"], string> = {
  goal: "text-arena-gold",
  penalty_goal: "text-arena-gold",
  own_goal: "text-arena-muted",
  yellow_card: "text-arena-gold-light",
  red_card: "text-arena-ember",
  two_minute: "text-arena-muted",
};

/**
 * Journal du match, du plus récent au plus ancien.
 * Reflet direct de `arena_match_events` : minute, type, équipe.
 */
export function LiveTimeline({ events }: { events: LiveMatchEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-arena-line bg-arena-surface/70 p-4 text-sm text-arena-muted">
        Aucune action enregistrée pour l’instant.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {events.map((event) => {
        const Icon = eventIcons[event.type];
        return (
          <li
            key={event.id}
            className="flex min-h-[52px] items-center gap-3 rounded-lg border border-arena-line bg-arena-surface/70 px-3 py-2.5"
          >
            <span className="w-10 shrink-0 font-display text-lg leading-none text-arena-white tabular-nums">
              {event.minuteLabel}
            </span>
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-arena-line ${eventTones[event.type]}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold uppercase tracking-[0.12em] text-arena-white">
                {event.label}
              </span>
              <span className="block truncate text-[11px] font-medium uppercase tracking-[0.1em] text-arena-muted">
                {event.teamName}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
