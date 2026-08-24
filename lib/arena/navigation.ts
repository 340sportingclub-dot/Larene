/**
 * Source unique de la navigation publique.
 * Le header (desktop) et la barre basse (mobile) la consomment tous les deux,
 * pour qu'un ajout de rubrique n'ait à se faire qu'ici.
 */

export type NavItem = {
  href: string;
  label: string;
  /** Clé d'icône, résolue par `components/arena/icons.tsx`. */
  icon: "home" | "calendar" | "groups" | "stats" | "bracket" | "info";
};

/** Rubriques du header desktop. « Infos » y vit dans le menu, pas dans la barre. */
export const primaryNav: NavItem[] = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/matchs", label: "Matchs", icon: "calendar" },
  { href: "/groupes", label: "Groupes", icon: "groups" },
  { href: "/stats", label: "Stats", icon: "stats" },
  { href: "/tableau", label: "Tableau", icon: "bracket" },
];

export const infoNavItem: NavItem = {
  href: "/infos",
  label: "Infos",
  icon: "info",
};

/** Barre basse mobile : les 5 rubriques principales + Infos. */
export const mobileNav: NavItem[] = [...primaryNav, infoNavItem];

/**
 * `true` si `href` correspond à la route courante.
 * L'accueil ne doit être actif que sur une correspondance exacte.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
