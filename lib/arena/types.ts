/**
 * Types de la couche UI publique de L'ARÈNE.
 *
 * Ils sont volontairement découplés du schéma Supabase : chaque composant reçoit
 * ses données par props, sous ces formes-là. Le branchement du Sprint suivant
 * consistera à écrire des fonctions de mapping depuis les vues SQL existantes
 * (`arena_live_group_standings`, `arena_knockout_bracket`, …) vers ces types,
 * sans toucher aux composants.
 */

export type TeamSummary = {
  id: string;
  name: string;
  /** Position affichée sous le nom, ex. « #1 POULE A ». Absente avant le tirage. */
  seedLabel?: string | null;
  /** Réservé aux visuels officiels SportVision. Aucun visuel inventé d'ici là. */
  crestUrl?: string | null;
};

export type ArenaEventSummary = {
  name: string;
  /** Date lisible telle qu'affichée, ex. « Dimanche 30 août 2026 ». */
  dateLabel: string;
  venueName: string;
  city: string;
};

export type LiveMatch = {
  id: string;
  home: TeamSummary;
  away: TeamSummary;
  homeScore: number;
  awayScore: number;
  /** Ex. « 2ème mi-temps ». */
  periodLabel: string;
  /** Chronomètre déjà formaté par la source, ex. « 12:47 ». */
  clockLabel: string;
  venueName: string;
  href: string;
};

export type ScheduledMatch = {
  id: string;
  /** Heure locale déjà formatée, ex. « 16:40 ». */
  timeLabel: string;
  home: TeamSummary;
  away: TeamSummary;
  /** Une seule aire de jeu pour cette édition — voir `courtLabel` dans demo-data. */
  courtLabel: string;
  groupLabel?: string | null;
  href: string;
};

export type GroupSummary = {
  id: string;
  /** Lettre seule : « A », « B »… Le mot « POULE » est ajouté par la carte. */
  letter: string;
  teamCount: number;
  href: string;
};

export type MatchStatus = "scheduled" | "live" | "finished";

/** Rencontre du calendrier, avec son état et son score s'il existe. */
export type FixtureMatch = ScheduledMatch & {
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
};

export type GroupStandingRow = {
  teamId: string;
  teamName: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** Dans la zone qualificative de sa poule. */
  qualified: boolean;
};

export type GroupStandings = {
  groupId: string;
  letter: string;
  rows: GroupStandingRow[];
};

export type StatLeader = {
  id: string;
  /** Ex. « Meilleur buteur ». */
  title: string;
  value: number;
  /** Unité au pluriel, ex. « buts ». */
  unit: string;
  /** Renseigné une fois les données réelles disponibles ; jamais inventé. */
  playerName?: string | null;
  teamName?: string | null;
  href: string;
};

/**
 * Un côté de confrontation du tableau final.
 * `label` est l'origine abstraite (« 1er poule A », « Vainqueur quart 1 ») ;
 * `teamName` ne se remplit qu'une fois le qualifié connu.
 */
export type BracketSlot = {
  label: string;
  teamName?: string | null;
};

export type BracketPairing = {
  id: string;
  /** Étiquette courte du match, ex. « Quart 1 ». */
  code: string;
  home: BracketSlot;
  away: BracketSlot;
};

export type BracketRound = {
  id: string;
  name: string;
  pairings: BracketPairing[];
};
