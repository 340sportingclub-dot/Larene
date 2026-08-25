import { ArenaMonogram } from "@/components/arena/ArenaLogo";

/**
 * La convocation numérique d'une équipe.
 *
 * Le pendant de l'invitation de l'étape 1 : même vocabulaire de billet, mais
 * rempli. C'est ce que le capitaine montrera à ses joueurs — donc son équipe et
 * son état d'inscription doivent se lire d'un coup d'œil, sans faire défiler.
 */
export function TeamPassCard({
  teamName,
  city,
  captainName,
  playerCount,
  paidCount,
  statusLabel,
  eventDateLabel,
  venueName,
}: {
  teamName: string;
  city: string | null;
  captainName: string;
  playerCount: number;
  paidCount: number;
  statusLabel: string;
  eventDateLabel: string;
  venueName: string;
}) {
  return (
    <article className="relative mx-auto w-full max-w-md">
      <span
        aria-hidden="true"
        className="absolute -left-2.5 top-[58%] z-10 h-5 w-5 -translate-y-1/2 rounded-full bg-arena-black"
      />
      <span
        aria-hidden="true"
        className="absolute -right-2.5 top-[58%] z-10 h-5 w-5 -translate-y-1/2 rounded-full bg-arena-black"
      />

      <div className="arena-grain arena-spotlight relative overflow-hidden rounded-2xl border border-arena-gold-dark/70">
        <div aria-hidden="true" className="h-px bg-arena-gold-dark/80" />
        <div aria-hidden="true" className="mt-[3px] h-px bg-arena-gold-dark/40" />

        <div className="px-6 pb-7 pt-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <ArenaMonogram className="h-9 w-9" />
            <span className="shrink-0 rounded border border-arena-gold/40 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-arena-gold">
              {statusLabel}
            </span>
          </div>

          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-arena-muted">
            Votre place dans L’ARÈNE
          </p>
          {/* Un nom d'équipe long doit passer à la ligne, jamais être coupé. */}
          <h1 className="mt-1.5 break-words font-display text-4xl uppercase leading-none text-arena-white sm:text-5xl">
            {teamName}
          </h1>
          {city && (
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-arena-muted">
              {city}
            </p>
          )}

          <div aria-hidden="true" className="arena-rule my-5" />

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Cell label="Capitaine" value={captainName} />
            <Cell label="Effectif" value={`${playerCount} joueurs`} />
            <Cell label="Paiements" value={`${paidCount} / ${playerCount} réglés`} />
            <Cell label="Date" value={eventDateLabel} />
            <Cell label="Lieu" value={venueName} span />
          </dl>
        </div>
      </div>
    </article>
  );
}

function Cell({
  label,
  value,
  span = false,
}: {
  label: string;
  value: string;
  span?: boolean;
}) {
  return (
    <div className={`min-w-0 ${span ? "col-span-2" : ""}`}>
      <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-arena-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold uppercase tracking-[0.03em] text-arena-white">
        {value}
      </dd>
    </div>
  );
}
