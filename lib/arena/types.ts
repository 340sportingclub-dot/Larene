/**
 * Types de la couche UI publique de L'ARÈNE.
 *
 * Ils sont volontairement découplés du schéma Supabase : chaque composant reçoit
 * ses données par props, sous ces formes-là. Le branchement du Sprint suivant
 * consistera à écrire des fonctions de mapping depuis les vues SQL existantes
 * (`arena_live_group_standings`, `arena_knockout_bracket`, …) vers ces types,
 * sans toucher aux composants.
 */

import type { MatchPhase } from "@/lib/arena/tournament-scenarios";

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

/**
 * Un côté de rencontre.
 *
 * `label` est toujours renseigné — « A1 », « 1er poule A », « Vainqueur demie 1 ».
 * `team` ne l'est qu'une fois l'équipe réellement connue : avant le tirage, ou
 * avant la fin des poules, le calendrier reste donc parfaitement lisible.
 */
export type MatchParticipant = {
  team: TeamSummary | null;
  label: string;
};

/** Nom à afficher pour un côté de rencontre. */
export function participantName(participant: MatchParticipant): string {
  return participant.team?.name ?? participant.label;
}

export type MatchStatus = "scheduled" | "live" | "finished";

/** Rencontre du calendrier officiel. */
export type FixtureMatch = {
  id: string;
  /** Code stable du calendrier : G1…, CL1…, SF1, TP, FINAL. */
  code: string;
  /** Heure de coup d'envoi, ex. « 09:00 ». */
  timeLabel: string;
  courtLabel: string;
  /** Temps de jeu effectif, ex. « 10 min », « 2 × 7 min ». */
  durationLabel: string;
  phase: MatchPhase;
  phaseLabel: string;
  groupLabel?: string | null;
  /** Enjeu d'un match de classement, ex. « Places 9e / 10e ». */
  stakeLabel?: string | null;
  home: MatchParticipant;
  away: MatchParticipant;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  href: string;
};

export type GroupSummary = {
  id: string;
  /** Lettre seule : « A », « B ». Le mot « POULE » est ajouté par la carte. */
  letter: string;
  teamCount: number;
  href: string;
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

/** Miroir de `arena_match_events.event_type`, limité à ce qui s'affiche en direct. */
export type LiveMatchEventType =
  | "goal"
  | "penalty_goal"
  | "own_goal"
  | "yellow_card"
  | "red_card"
  | "two_minute";

export type LiveMatchEvent = {
  id: string;
  /** Minute déjà formatée par la source, ex. « 17' ». */
  minuteLabel: string;
  type: LiveMatchEventType;
  teamId: string;
  teamName: string;
  /** Libellé public de l'action, ex. « But ». */
  label: string;
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
  courtLabel: string;
  /** Contexte de la rencontre, ex. « Demie 1 ». */
  stageLabel: string;
  /** Journal du match, du plus récent au plus ancien. */
  events: LiveMatchEvent[];
  href: string;
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
 * `label` est l'origine abstraite (« 1er poule A », « Vainqueur demie 1 ») ;
 * `teamName` ne se remplit qu'une fois le qualifié connu.
 */
export type BracketSlot = {
  label: string;
  teamName?: string | null;
};

export type BracketPairing = {
  id: string;
  /** Étiquette courte du match, ex. « Demie 1 ». */
  code: string;
  home: BracketSlot;
  away: BracketSlot;
  /** Heure de coup d'envoi, si le calendrier la fixe. */
  timeLabel?: string | null;
  durationLabel?: string | null;
};

export type BracketRound = {
  id: string;
  name: string;
  pairings: BracketPairing[];
};
