"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavIcon } from "@/components/arena/icons";
import { isNavItemActive, mobileNav } from "@/lib/arena/navigation";

/**
 * Barre de navigation basse, mobile et tablette uniquement.
 *
 * Six rubriques, cibles tactiles de 56 px de haut, retrait automatique sous
 * l'encoche inférieure des iPhone via `safe-area-inset-bottom`. Le décalage du
 * contenu est géré par le layout, jamais par une marge posée à la main.
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-arena-line bg-arena-surface/98 backdrop-blur-[2px] lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {mobileNav.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-0.5 py-2 transition-colors ${
                  active ? "text-arena-gold" : "text-arena-muted"
                }`}
              >
                <NavIcon name={item.icon} className="h-[22px] w-[22px]" />
                <span className="w-full truncate text-center text-[10px] font-semibold uppercase tracking-[0.08em]">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
