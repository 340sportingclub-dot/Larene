import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";

import { ArrowRightIcon } from "@/components/arena/icons";

/**
 * Carte d'information pratique.
 *
 * Reprend exactement le vocabulaire des cartes existantes — bordure fine,
 * surface `arena-surface`, grain, titre en or espacé. Aucun style nouveau :
 * seul l'agencement interne change d'une carte à l'autre.
 *
 * Chaque carte est autonome et porte un `h2` : la page reste plate et
 * parcourable au lecteur d'écran comme à l'œil.
 */
export function InfoCard({
  icon: Icon,
  title,
  children,
  className = "",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`arena-grain relative flex h-full flex-col overflow-hidden rounded-xl border border-arena-line bg-arena-surface/80 p-4 sm:p-5 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(169,121,43,0.12),transparent_75%)]"
      />
      <div className="relative flex h-full flex-col">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold">
          <Icon className="h-4 w-4 shrink-0" />
          {title}
        </h2>
        <div className="mt-3 flex flex-1 flex-col">{children}</div>
      </div>
    </section>
  );
}

/**
 * Bouton d'action d'une carte.
 * Hauteur minimale 48 px : confortable au pouce sur un téléphone.
 * `external` ouvre un nouvel onglet et le signale aux lecteurs d'écran.
 */
export function InfoAction({
  href,
  children,
  icon: Icon,
  external = false,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  external?: boolean;
  variant?: "primary" | "secondary";
}) {
  const className = `inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md border px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors sm:text-xs ${
    variant === "primary"
      ? "border-arena-gold bg-arena-gold/10 text-arena-gold-light hover:bg-arena-gold/20"
      : "border-arena-line text-arena-white hover:border-arena-gold/60 hover:text-arena-gold"
  }`;

  const content = (
    <>
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="truncate">{children}</span>
      {external && <span className="sr-only">(nouvelle fenêtre)</span>}
      {!external && !Icon && <ArrowRightIcon className="h-4 w-4 shrink-0" />}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

/** Ligne « intitulé → valeur » d'une carte. */
export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-arena-line/60 py-2 last:border-b-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-arena-muted">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm font-semibold uppercase tracking-[0.04em] text-arena-white">
        {value}
      </dd>
    </div>
  );
}

/** Valeur non arrêtée. Jamais vide, jamais « undefined ». */
export function ToBeConfirmed() {
  return (
    <span className="text-arena-muted">À confirmer</span>
  );
}
