import Link from "next/link";

import { ArenaMonogram } from "@/components/arena/ArenaLogo";

/**
 * La convocation — première étape du parcours d'inscription.
 *
 * L'idée du flyer : ce n'est pas un formulaire posé sur une page, c'est une
 * convocation qu'on reçoit. Le vocabulaire visuel reste celui du site — noir,
 * or, grain, filets dorés — mais la carte emprunte au billet : double filet,
 * encoches latérales, mentions en petites capitales espacées.
 *
 * Aucune couleur, aucune typographie nouvelle.
 */
export function InvitationCard({
  eventName,
  dateLabel,
  venueName,
  city,
  feeLabel,
  squadLabel,
  ctaHref,
  ctaLabel,
  note,
}: {
  eventName: string;
  dateLabel: string;
  venueName: string;
  city: string;
  feeLabel: string;
  squadLabel: string;
  ctaHref: string;
  ctaLabel: string;
  note?: string;
}) {
  return (
    <article className="relative mx-auto w-full max-w-md">
      {/* Encoches du billet : deux disques de la couleur du fond, posés sur
          les bords. Purement décoratifs. */}
      <span
        aria-hidden="true"
        className="absolute -left-2.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 rounded-full bg-arena-black"
      />
      <span
        aria-hidden="true"
        className="absolute -right-2.5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 rounded-full bg-arena-black"
      />

      <div className="arena-grain arena-spotlight relative overflow-hidden rounded-2xl border border-arena-gold-dark/70">
        {/* Double filet supérieur — la signature du billet. */}
        <div aria-hidden="true" className="h-px bg-arena-gold-dark/80" />
        <div aria-hidden="true" className="mt-[3px] h-px bg-arena-gold-dark/40" />

        <div className="px-6 pb-7 pt-6 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <ArenaMonogram className="h-9 w-9" />
            <p className="text-right text-[9px] font-bold uppercase leading-relaxed tracking-[0.22em] text-arena-gold">
              Convocation
              <span className="block text-arena-muted">Édition 2026</span>
            </p>
          </div>

          <div aria-hidden="true" className="arena-rule my-5" />

          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-arena-muted">
            Vous êtes attendu à
          </p>
          <h1 className="mt-1.5 font-display text-4xl uppercase leading-none text-arena-white sm:text-5xl">
            {eventName}
          </h1>

          <dl className="mt-6 space-y-0">
            <Line label="Date" value={dateLabel} />
            <Line label="Lieu" value={venueName} />
            <Line label="Ville" value={city} />
            <Line label="Effectif" value={squadLabel} />
            <Line label="Engagement" value={feeLabel} />
          </dl>

          <div aria-hidden="true" className="arena-rule my-6" />

          <Link
            href={ctaHref}
            className="flex min-h-[56px] w-full items-center justify-center rounded-md border border-arena-gold bg-arena-gold px-5 text-center font-display text-lg uppercase tracking-[0.04em] text-arena-black transition-colors hover:bg-arena-gold-light"
          >
            {ctaLabel}
          </Link>

          {note && (
            <p className="mt-3 text-center text-xs leading-relaxed text-arena-muted">
              {note}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-arena-line/60 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-arena-muted">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm font-semibold uppercase tracking-[0.04em] text-arena-white">
        {value}
      </dd>
    </div>
  );
}
