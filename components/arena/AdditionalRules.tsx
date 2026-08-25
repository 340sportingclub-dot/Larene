import {
  ChevronDownIcon,
  ClockIcon,
  ShieldCheckIcon,
  ShoeIcon,
  TrophyIcon,
  WhistleIcon,
} from "@/components/arena/icons";
import type { RuleGroup, RuleGroupIcon } from "@/lib/arena/rules";

/**
 * Le reste du règlement.
 *
 * Ces règles doivent être accessibles sans encombrer la page : chaque groupe
 * est un bloc dépliable, fermé par défaut. Un joueur qui cherche « crampons »
 * ou « forfait » ouvre le bon bloc ; les autres ne voient qu'une liste courte.
 */
const groupIcons: Record<RuleGroupIcon, typeof ClockIcon> = {
  clock: ClockIcon,
  trophy: TrophyIcon,
  shoes: ShoeIcon,
  respect: ShieldCheckIcon,
  whistle: WhistleIcon,
};

export function AdditionalRules({ groups }: { groups: RuleGroup[] }) {
  return (
    <ul className="space-y-2">
      {groups.map((group) => {
        const Icon = groupIcons[group.icon];

        return (
          <li key={group.id}>
            <details className="group rounded-lg border border-arena-line bg-arena-black/50">
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-arena-white [&::-webkit-details-marker]:hidden">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-arena-gold/35 text-arena-gold">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">{group.label}</span>
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-arena-gold transition-transform group-open:rotate-180" />
              </summary>

              <ul className="space-y-2 border-t border-arena-line/60 px-3 py-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-arena-gold-dark"
                    />
                    <span className="text-[13px] leading-relaxed text-arena-white/85">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
