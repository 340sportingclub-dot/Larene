import Link from "next/link";

import { ArrowRightIcon } from "@/components/arena/icons";

/**
 * Titre de section + lien de rebond, motif répété sur toute l'accueil.
 *
 * Sur mobile le lien passe sous le titre : le tronquer sur une seule ligne
 * rendrait certains libellés illisibles.
 */
export function SectionHeading({
  title,
  actionLabel,
  actionHref,
  id,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  id?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 sm:mb-5">
      <h2
        id={id}
        className="font-display text-2xl uppercase tracking-[0.01em] text-arena-white sm:text-3xl lg:text-4xl"
      >
        {title}
      </h2>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          /* py-3.5 sans marge négative : la zone tactile atteint 44 px sans
             décaler la ligne de base, alignée sur le titre. */
          className="group inline-flex items-center gap-2 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-arena-gold transition-colors hover:text-arena-gold-light sm:text-xs"
        >
          {actionLabel}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
