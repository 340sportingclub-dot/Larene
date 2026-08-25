import {
  BagIcon,
  ClockIcon,
  LockerIcon,
  ShieldCheckIcon,
  ShoeIcon,
} from "@/components/arena/icons";
import type { PracticalRule, PracticalRuleIcon } from "@/lib/arena/info-data";

/**
 * Règles pratiques, en blocs plutôt qu'en pavé de texte.
 *
 * Chaque règle est une carte autonome — icône, titre, lignes courtes — pour
 * qu'un joueur retrouve « chaussures » ou « heure d'arrivée » d'un coup d'œil
 * sur son téléphone, sans lire le reste. Une colonne sur mobile, deux à partir
 * de la tablette, trois sur grand écran.
 *
 * Même vocabulaire visuel que les cartes existantes : bordure fine, fond
 * `arena-black/50`, titre en or espacé. Aucun style nouveau.
 */
const ruleIcons: Record<PracticalRuleIcon, typeof ClockIcon> = {
  shoes: ShoeIcon,
  locker: LockerIcon,
  clock: ClockIcon,
  respect: ShieldCheckIcon,
  bag: BagIcon,
};

export function PracticalRules({
  rules,
}: {
  rules: (PracticalRule & { lines: string[] })[];
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {rules.map((rule) => {
        const Icon = ruleIcons[rule.icon];
        return (
          <li key={rule.id} className="min-w-0">
            <div className="h-full rounded-lg border border-arena-line bg-arena-black/50 p-3.5">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-arena-gold">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-arena-gold/35">
                  <Icon className="h-4 w-4" />
                </span>
                {rule.label}
              </h3>

              <ul className="mt-3 space-y-2">
                {rule.lines.map((line) => (
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
            </div>
          </li>
        );
      })}
    </ul>
  );
}
