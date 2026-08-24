import type { SVGProps } from "react";

import type { NavItem } from "@/lib/arena/navigation";

/**
 * Jeu d'icônes minimal, tracé à la main en SVG.
 * Aucune librairie, aucun emoji : trait fin et régulier, cohérent avec les
 * cadres dorés de la direction artistique.
 *
 * Les icônes sont décoratives par défaut (`aria-hidden`) : le libellé textuel
 * qui les accompagne porte toujours le sens.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.75 20v-5.5h4.5V20" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3.5V6.5M16 3.5V6.5" />
      <path d="M7.5 13h3M13.5 13h3M7.5 16.75h3M13.5 16.75h3" />
    </Icon>
  );
}

export function GroupsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6" />
      <path d="M17.2 14.9c2 .7 3.3 2.4 3.3 4.6" />
    </Icon>
  );
}

export function StatsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20.5V13M10 20.5V6.5M16 20.5v-5M22 20.5h-20" />
      <path d="M4 13v7.5M10 6.5v14M16 15.5v5" />
    </Icon>
  );
}

export function BracketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 5.5h5v4h-5zM3.5 14.5h5v4h-5zM15.5 10h5v4h-5z" />
      <path d="M8.5 7.5h3v9h-3M11.5 12h4" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.75h.01" strokeWidth={2.2} />
    </Icon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5.5 18.5 12 8 18.5z" fill="currentColor" strokeWidth={1.2} />
    </Icon>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s6.5-5.4 6.5-10a6.5 6.5 0 1 0-13 0c0 4.6 6.5 10 6.5 10z" />
      <circle cx="12" cy="11" r="2.4" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function BallIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m12 7.5 3.4 2.5-1.3 4h-4.2l-1.3-4z" />
      <path d="M12 3.5v4M4.4 9.6 8.6 10M19.6 9.6 15.4 10M7.2 19.4 9.9 16M16.8 19.4 14.1 16" />
    </Icon>
  );
}

export function BootIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h3.6l1.6 4.2 5.3 1.4a5 5 0 0 1 3.9 4.9v1.5H4z" />
      <path d="M4 15.5h14.2M7.5 18.5v2M11.5 18.5v2M15.5 18.5v2" />
    </Icon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z" />
      <path d="M7.5 5.5H5a2.5 2.5 0 0 0 2.5 4M16.5 5.5H19a2.5 2.5 0 0 1-2.5 4" />
      <path d="M12 13.5V17M9 20.5h6M9.75 17h4.5v3.5h-4.5z" />
    </Icon>
  );
}

/** Contact par messagerie. Bulle générique, pas un logo de marque. */
export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 11.5c0 4-3.8 7.2-8.5 7.2a9.8 9.8 0 0 1-2.7-.37L4.5 20l1.2-3.6a6.8 6.8 0 0 1-2.2-4.9c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2z" />
    </Icon>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M16.9 7.1h.01" strokeWidth={2.2} />
    </Icon>
  );
}

export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5V6.5h17v2a2.5 2.5 0 0 0 0 7v2h-17v-2a2.5 2.5 0 0 0 0-7z" />
      <path d="M13.5 6.5v11" strokeDasharray="2 2.5" />
    </Icon>
  );
}

export function DrinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 4.5h11l-1.3 13a2 2 0 0 1-2 1.8h-4.4a2 2 0 0 1-2-1.8z" />
      <path d="M6.9 9.5h10.2" />
    </Icon>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5h3.2l1.5-2.2h7.6l1.5 2.2h3.2v10h-17z" />
      <circle cx="12" cy="13" r="3.4" />
    </Icon>
  );
}

/** Aire de jeu vue du dessus — un seul terrain. */
export function CourtIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="M12 5.5v13" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M3 9.5h2.5v5H3M21 9.5h-2.5v5H21" />
    </Icon>
  );
}

/** Carton d'avertissement / d'exclusion. La couleur vient de la classe reçue. */
export function CardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="3.5" width="10" height="14" rx="1.5" fill="currentColor" strokeWidth={1.2} />
    </Icon>
  );
}

/** Sanction temporaire de 2 minutes. */
export function TwoMinuteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.75a2.5 2.5 0 1 1 5 0c0 2.25-5 3-5 5.5h5" />
    </Icon>
  );
}

const navIcons = {
  home: HomeIcon,
  calendar: CalendarIcon,
  groups: GroupsIcon,
  stats: StatsIcon,
  bracket: BracketIcon,
  info: InfoIcon,
} as const;

/** Résout la clé d'icône d'un `NavItem` en composant. */
export function NavIcon({
  name,
  ...props
}: IconProps & { name: NavItem["icon"] }) {
  const Component = navIcons[name];
  return <Component {...props} />;
}
