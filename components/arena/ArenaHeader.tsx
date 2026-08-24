"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

import { ArenaWordmark } from "@/components/arena/ArenaLogo";
import { CloseIcon, MenuIcon, NavIcon } from "@/components/arena/icons";
import {
  infoNavItem,
  isNavItemActive,
  primaryNav,
} from "@/lib/arena/navigation";

/**
 * En-tête public.
 *
 * Mobile  : barre compacte — monogramme + nom, pastille LIVE, menu. La
 *           navigation principale vit dans la barre basse, elle n'est pas
 *           compressée ici.
 * Desktop : verrouillage complet avec baseline, navigation horizontale,
 *           bouton LIVE et menu.
 */
export function ArenaHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Le menu ne doit jamais survivre à un changement de page. L'état est ajusté
  // pendant le rendu — et non dans un effet, qui provoquerait un rendu en
  // cascade et un panneau brièvement visible sur la nouvelle page.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  const menuItems = [...primaryNav, infoNavItem];

  return (
    <header className="sticky top-0 z-50 border-b border-arena-line/70 bg-arena-black/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 lg:h-20 lg:gap-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-[44px] shrink-0 items-center rounded-sm"
          aria-label="L’Arène — retour à l’accueil"
        >
          <span className="lg:hidden">
            <ArenaWordmark compact />
          </span>
          <span className="hidden lg:inline-flex">
            <ArenaWordmark />
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {primaryNav.map((item) => {
              const active = isNavItemActive(item.href, pathname);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex min-h-[44px] items-center text-sm font-semibold uppercase tracking-[0.14em] transition-colors ${
                      active
                        ? "text-arena-gold"
                        : "text-arena-white/80 hover:text-arena-gold-light"
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-0.5 left-0 h-0.5 w-full bg-arena-gold"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:gap-3">
          <Link
            href="/live"
            aria-label="Suivre le match en direct"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-arena-gold/55 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-arena-gold transition-colors hover:border-arena-gold hover:bg-arena-gold/10 lg:px-5 lg:text-xs"
          >
            <span
              aria-hidden="true"
              className="arena-pulse block h-2 w-2 rounded-full bg-arena-ember"
            />
            Live
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-arena-line text-arena-white transition-colors hover:border-arena-gold/60 hover:text-arena-gold"
          >
            {menuOpen ? (
              <CloseIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          {/* Clic hors du panneau : le bouton reste la commande accessible. */}
          <div
            className="fixed inset-0 top-14 z-40 bg-arena-black/70 lg:top-20"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            id={menuId}
            className="absolute inset-x-0 top-full z-50 border-b border-arena-line bg-arena-surface shadow-2xl shadow-black/60"
          >
            <nav aria-label="Menu" className="mx-auto max-w-7xl px-4 py-2 lg:px-8">
              <ul>
                {menuItems.map((item) => {
                  const active = isNavItemActive(item.href, pathname);
                  return (
                    <li key={item.href} className="border-b border-arena-line/60 last:border-b-0">
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-[52px] items-center gap-3 px-1 text-sm font-semibold uppercase tracking-[0.14em] transition-colors ${
                          active
                            ? "text-arena-gold"
                            : "text-arena-white/85 hover:text-arena-gold-light"
                        }`}
                      >
                        <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
