import {
  CardIcon,
  ChevronDownIcon,
  HourglassIcon,
  SquadIcon,
  StopwatchIcon,
  TwoMinuteIcon,
  VideoReviewIcon,
  WhistleIcon,
} from "@/components/arena/icons";
import type { SignatureRule, SignatureRuleIcon } from "@/lib/arena/rules";

/**
 * Les règles signatures de L'ARÈNE.
 *
 * Sur un téléphone, l'essentiel doit se lire sans effort : une accroche en
 * grand, une phrase, trois lignes courtes. Le règlement complet existe mais
 * reste replié — la page d'infos n'est pas un document juridique.
 *
 * Aucun style nouveau : mêmes bordures, même or, même trame que les autres
 * cartes de la page. Seule l'accroche est composée en `font-display`, comme
 * les titres de l'accueil.
 */
const ruleIcons: Record<SignatureRuleIcon, typeof CardIcon> = {
  six: SquadIcon,
  foul: WhistleIcon,
  powerplay: TwoMinuteIcon,
  challenge: VideoReviewIcon,
  "final-minute": HourglassIcon,
  stopwatch: StopwatchIcon,
};

export function SignatureRules({ rules }: { rules: SignatureRule[] }) {
  return (
    <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rules.map((rule) => {
        const Icon = ruleIcons[rule.icon];

        return (
          <li key={rule.id} className="min-w-0">
            <article className="arena-grain relative flex h-full flex-col overflow-hidden rounded-xl border border-arena-line bg-arena-surface/80 p-4">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(169,121,43,0.12),transparent_75%)]"
              />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-arena-gold/35 text-arena-gold">
                    <Icon className="h-5 w-5" />
                  </span>
                  {rule.signature && (
                    <span className="shrink-0 rounded border border-arena-gold/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-arena-gold">
                      Signature L’ARÈNE
                    </span>
                  )}
                </div>

                {/* L'accroche peut passer à la ligne : on ne la tronque jamais. */}
                <h3 className="mt-3 font-display text-xl uppercase leading-none tracking-[0.01em] text-arena-white sm:text-2xl">
                  {rule.badge}
                </h3>

                <p className="mt-2 text-[13px] leading-relaxed text-arena-muted">
                  {rule.tagline}
                </p>

                <ul className="mt-3 space-y-1.5">
                  {rule.highlights.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-arena-gold-dark"
                      />
                      <span className="text-[13px] leading-relaxed text-arena-white/85">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>

                <details className="group mt-auto pt-3">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 border-t border-arena-line/60 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-arena-gold [&::-webkit-details-marker]:hidden">
                    Le détail
                    <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>

                  <div className="space-y-2 pt-2">
                    {rule.details.map((line) => (
                      <p
                        key={line}
                        className="text-[13px] leading-relaxed text-arena-white/75"
                      >
                        {line}
                      </p>
                    ))}

                    {rule.detailList && (
                      <>
                        <p className="text-[13px] leading-relaxed text-arena-white/75">
                          {rule.detailList.intro}
                        </p>
                        <ul className="space-y-1.5">
                          {rule.detailList.items.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span
                                aria-hidden="true"
                                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-arena-gold-dark"
                              />
                              <span className="text-[13px] leading-relaxed text-arena-white/75">
                                {item}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </details>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
