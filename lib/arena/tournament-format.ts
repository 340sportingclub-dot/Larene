/**
 * Format du tournoi — vue dérivée du scénario retenu.
 *
 * La structure ne se déduit plus d'un nombre d'équipes quelconque : elle vient
 * des calendriers officiels de `lib/arena/tournament-scenarios.ts`, seuls
 * scénarios actifs de l'édition (8, 10, 12 équipes). Ce module ne fait que
 * présenter ce scénario sous la forme attendue par l'interface.
 *
 * Le format à 4 poules et les quarts de finale n'existent plus pour cette
 * édition : `GroupId` ne peut plus valoir que « A » ou « B ».
 */

import {
  activeScenario,
  describeMatchSlot,
  getMatchesByPhase,
  getScenario,
  type GroupId,
  type MatchSlotRef,
  type ScenarioTeamCount,
  type ScheduledMatchSpec,
  type TournamentScenario,
} from "@/lib/arena/tournament-scenarios";

export type { GroupId };

export type KnockoutRoundId = "semi_final" | "final";

/** Une confrontation du tableau, telle que l'affiche l'interface. */
export type BracketMatchSpec = {
  /** Code stable, aligné sur `arena_matches.bracket_code`. */
  code: string;
  roundId: KnockoutRoundId | "third_place";
  /** Libellé public court, ex. « Demie 1 ». */
  label: string;
  home: MatchSlotRef;
  away: MatchSlotRef;
  timeLabel: string;
  durationLabel: string;
};

export type KnockoutRoundSpec = {
  id: KnockoutRoundId;
  name: string;
  matches: BracketMatchSpec[];
};

export type GroupSpec = {
  id: GroupId;
  letter: string;
  teamCount: number;
};

export type TournamentFormat = {
  teamCount: number;
  groupCount: number;
  groups: GroupSpec[];
  groupIds: GroupId[];
  teamsPerGroup: number[];
  /** 1 = aller simple, 2 = aller-retour. */
  groupLegs: 1 | 2;
  qualifiersPerGroup: number;
  qualifierCount: number;
  guaranteedMatchesPerTeam: number;
  guaranteedPlayMinutes: number;
  hasClassificationMatches: boolean;
  /** Toujours `false` pour cette édition : le tableau démarre en demi-finales. */
  hasQuarterFinals: boolean;
  knockoutRounds: KnockoutRoundSpec[];
  /** Petite finale, hors progression du tableau. */
  thirdPlaceMatch: BracketMatchSpec | null;
  /** Demi-finales et finale, à plat. La petite finale n'y figure pas. */
  bracketMatches: BracketMatchSpec[];
  scenario: TournamentScenario;
};

const MATCH_LABELS: Record<string, string> = {
  SF1: "Demie 1",
  SF2: "Demie 2",
  TP: "Petite finale",
  FINAL: "Finale",
};

function toBracketMatch(
  match: ScheduledMatchSpec,
  roundId: BracketMatchSpec["roundId"],
): BracketMatchSpec {
  return {
    code: match.code,
    roundId,
    label: MATCH_LABELS[match.code] ?? match.code,
    home: match.home,
    away: match.away,
    timeLabel: match.timeLabel,
    durationLabel: match.durationLabel,
  };
}

/**
 * Décrit le tournoi à partir du scénario retenu.
 * Sans argument, renvoie le format de l'édition en cours.
 */
export function getTournamentFormat(
  teamCount?: ScenarioTeamCount,
): TournamentFormat {
  const scenario = teamCount ? getScenario(teamCount) : activeScenario;

  const semiFinals = getMatchesByPhase(scenario, "semi_final").map((m) =>
    toBracketMatch(m, "semi_final"),
  );
  const finals = getMatchesByPhase(scenario, "final").map((m) =>
    toBracketMatch(m, "final"),
  );
  const thirdPlace = getMatchesByPhase(scenario, "third_place").map((m) =>
    toBracketMatch(m, "third_place"),
  );

  const groupIds: GroupId[] = ["A", "B"].slice(
    0,
    scenario.groupCount,
  ) as GroupId[];

  return {
    teamCount: scenario.teamCount,
    groupCount: scenario.groupCount,
    groupIds,
    groups: groupIds.map((id) => ({
      id,
      letter: id,
      teamCount: scenario.teamsPerGroup,
    })),
    teamsPerGroup: groupIds.map(() => scenario.teamsPerGroup),
    groupLegs: scenario.groupLegs,
    qualifiersPerGroup: scenario.qualifiersPerGroup,
    qualifierCount: scenario.groupCount * scenario.qualifiersPerGroup,
    guaranteedMatchesPerTeam: scenario.guaranteedMatchesPerTeam,
    guaranteedPlayMinutes: scenario.guaranteedPlayMinutes,
    hasClassificationMatches: scenario.hasClassificationMatches,
    hasQuarterFinals: false,
    knockoutRounds: [
      { id: "semi_final", name: "Demi-finales", matches: semiFinals },
      { id: "final", name: "La finale", matches: finals },
    ],
    thirdPlaceMatch: thirdPlace[0] ?? null,
    bracketMatches: [...semiFinals, ...finals],
    scenario,
  };
}

/**
 * Libellé public d'une origine de participant.
 * Délègue au formateur unique des scénarios.
 */
export function describeSlotSource(source: MatchSlotRef): string {
  return describeMatchSlot(source);
}

/** Nombre de rencontres de poules du scénario. */
export function getGroupMatchCount(format: TournamentFormat): number {
  return getMatchesByPhase(format.scenario, "group").length;
}

/** Nombre de matchs de classement (scénario 10 uniquement). */
export function getClassificationMatchCount(format: TournamentFormat): number {
  return getMatchesByPhase(format.scenario, "classification").length;
}

/** `true` si la poule existe dans ce format. Garde-fou contre une poule fantôme. */
export function hasGroup(format: TournamentFormat, groupId: string): boolean {
  return (format.groupIds as string[]).includes(groupId);
}
