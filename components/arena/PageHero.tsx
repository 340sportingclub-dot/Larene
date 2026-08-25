/**
 * En-tête de page de rubrique. Reprend le halo et le grain de l'accueil, sans
 * introduire de style nouveau.
 */
export function PageHero({
  label,
  title,
  subtitle,
  meta,
}: {
  /** Sur-titre court, même traitement que le « EN DIRECT » de l'accueil. */
  label?: string;
  title: string;
  subtitle?: string;
  /** Petits repères factuels, ex. « 4 poules · 8 qualifiés ». */
  meta?: string[];
}) {
  return (
    <section className="arena-spotlight arena-grain relative overflow-hidden border-b border-arena-line/70">
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {label && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-arena-gold sm:text-xs">
            {label}
          </p>
        )}
        <h1 className="text-[clamp(2rem,8vw,4rem)] uppercase leading-[0.95] text-arena-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-arena-gold sm:text-sm">
            {subtitle}
          </p>
        )}
        {meta && meta.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-2 gap-y-2">
            {meta.map((item) => (
              <li
                key={item}
                className="rounded border border-arena-gold/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-arena-muted sm:text-[11px]"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
