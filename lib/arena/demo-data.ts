/**
 * Données de démonstration de l'accueil public.
 *
 * ⚠️ TEMPORAIRE — aucun appel Supabase n'est effectué dans cette V1.
 * Tout est regroupé ici pour qu'un seul fichier soit à remplacer au Sprint
 * suivant : les composants ne connaissent que les types de `lib/arena/types.ts`.
 *
 * Les noms d'équipes reprennent ceux des maquettes. Aucun nom de joueur, aucune
 * photo, aucune statistique individuelle nominative n'est inventé.
 */

import type {
  ArenaEventSummary,
  BracketRound,
  GroupSummary,
  LiveMatch,
  ScheduledMatch,
  StatLeader,
} from "@/lib/arena/types";

/** Une seule aire de jeu pour cette édition. Ne jamais afficher « Terrain 2 ». */
export const COURT_LABEL = "Terrain 1";

export const demoEvent: ArenaEventSummary = {
  name: "L’ARÈNE",
  dateLabel: "Dimanche 30 août 2026",
  venueName: "Gymnase de Villeneuve-la-Guyard",
  city: "Villeneuve-la-Guyard",
};

export const demoLiveMatch: LiveMatch = {
  id: "demo-live",
  home: { id: "titans", name: "Titans", seedLabel: "#1 Poule A" },
  away: { id: "lions", name: "Lions", seedLabel: "#2 Poule B" },
  homeScore: 3,
  awayScore: 2,
  periodLabel: "2ème mi-temps",
  clockLabel: "12:47",
  venueName: demoEvent.venueName,
  href: "/matchs",
};

export const demoNextMatch: ScheduledMatch = {
  id: "demo-next",
  timeLabel: "16:40",
  home: { id: "pirates", name: "Pirates" },
  away: { id: "cobras", name: "Cobras" },
  courtLabel: COURT_LABEL,
  groupLabel: "Poule C",
  href: "/matchs",
};

export const demoFollowingMatch: ScheduledMatch = {
  id: "demo-following",
  timeLabel: "18:20",
  home: { id: "wolves", name: "Wolves" },
  away: { id: "panthers", name: "Panthers" },
  courtLabel: COURT_LABEL,
  groupLabel: "Poule B",
  href: "/matchs",
};

/**
 * Le format retenu compte 4 poules, mais la grille supporte aussi 3 poules :
  * retirer simplement une entrée de ce tableau.
 */
export const demoGroups: GroupSummary[] = [
  { id: "a", letter: "A", teamCount: 4, href: "/groupes" },
  { id: "b", letter: "B", teamCount: 4, href: "/groupes" },
  { id: "c", letter: "C", teamCount: 4, href: "/groupes" },
  { id: "d", letter: "D", teamCount: 4, href: "/groupes" },
];

/**
 * Seuls le meilleur buteur et le meilleur passeur figurent sur l'accueil.
 * Meilleur gardien et MVP relèveront de la future page de vote.
 */
export const demoStatLeaders: StatLeader[] = [
  {
    id: "buteur",
    title: "Meilleur buteur",
    value: 12,
    unit: "buts",
    href: "/stats/buteurs",
  },
  {
    id: "passeur",
    title: "Meilleur passeur",
    value: 8,
    unit: "passes décisives",
    href: "/stats/passeurs",
  },
];

/**
 * Aperçu du tableau final, aligné sur le format réel : les 2 premiers de chaque
 * poule se qualifient, soit 8 équipes, donc une entrée en quarts.
 * La matrice reprend celle de `arena_create_knockout_bracket()`.
 * La petite finale existe mais n'apparaît pas dans cet aperçu compact.
 */
export const demoBracket: BracketRound[] = [
  {
    id: "quarts",
    name: "Quarts",
    pairings: [
      {
        id: "qf1",
        code: "Quart 1",
        home: { label: "1er poule A" },
        away: { label: "2ème poule B" },
      },
      {
        id: "qf2",
        code: "Quart 2",
        home: { label: "1er poule C" },
        away: { label: "2ème poule D" },
      },
      {
        id: "qf3",
        code: "Quart 3",
        home: { label: "1er poule B" },
        away: { label: "2ème poule A" },
      },
      {
        id: "qf4",
        code: "Quart 4",
        home: { label: "1er poule D" },
        away: { label: "2ème poule C" },
      },
    ],
  },
  {
    id: "demies",
    name: "Demi-finales",
    pairings: [
      {
        id: "sf1",
        code: "Demie 1",
        home: { label: "Vainqueur quart 1" },
        away: { label: "Vainqueur quart 2" },
      },
      {
        id: "sf2",
        code: "Demie 2",
        home: { label: "Vainqueur quart 3" },
        away: { label: "Vainqueur quart 4" },
      },
    ],
  },
  {
    id: "finale",
    name: "La finale",
    pairings: [
      {
        id: "final",
        code: "Finale",
        home: { label: "Vainqueur demie 1" },
        away: { label: "Vainqueur demie 2" },
      },
    ],
  },
];
