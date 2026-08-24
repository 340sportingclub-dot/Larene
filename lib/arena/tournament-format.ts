/**
 * Format du tournoi — SOURCE DE VÉRITÉ UNIQUE.
 *
 * Toute la structure de L'ARÈNE se dérive du seul nombre d'équipes : nombre de
 * poules, répartition, qualifiés, présence de quarts, composition du tableau.
 * Aucun composant, aucune page ne doit contenir de test sur `teamCount` ni de
 * bracket écrit à la main : tout passe par `getTournamentFormat()`.
 *
 * RÈGLE OFFICIELLE
 *   ≥ 13 équipes : 4 poules, 2 qualifiés par poule → 8 qualifiés → quarts,
 *                  demi-finales, finale.
 *   ≤ 12 équipes : 2 poules, 2 qualifiés par poule → 4 qualifiés → demi-finales
 *                  directes, finale. Pas de quarts.
 *
 * Le règlement ne nomme que deux cas, 16 équipes et « 12 ou moins ». La zone
 * 13-15 n'est pas spécifiée : elle est rattachée ici à la branche 4 poules,
 * la plus proche du cas 16, et les poules y sont simplement inégales
 * (13 équipes → 4 / 3 / 3 / 3). À trancher si ce cas devient réel.
 */

export type GroupId = "A" | "B" | "C" | "D";

export type KnockoutRoundId = "quarter_final" | "semi_final" | "final";

/** Origine abstraite d'un côté de confrontation, avant tout tirage. */
export type BracketSlotSource =
  | { kind: "group_position"; groupId: GroupId; position: number }
  | { kind: "match_winner"; matchCode: string };

export type BracketMatchSpec = {
  /** Code stable, aligné sur `arena_matches.bracket_code` : QF1, SF1, FINAL. */
  code: string;
  roundId: KnockoutRoundId;
  /** Libellé public court, ex. « Quart 1 ». */
  label: string;
  home: BracketSlotSource;
  away: BracketSlotSource;
};

export type KnockoutRoundSpec = {
  id: KnockoutRoundId;
  /** Libellé public du tour, ex. « Quarts ». */
  name: string;
  matches: BracketMatchSpec[];
};

export type GroupSpec = {
  id: GroupId;
  /** Lettre affichée. Identique à `id`, exposée pour ne pas coupler l'UI à la clé. */
  letter: string;
  teamCount: number;
};

export type TournamentFormat = {
  teamCount: number;
  groupCount: number;
  groups: GroupSpec[];
  groupIds: GroupId[];
  /** Effectifs par poule, index-alignés sur `groupIds`. Peuvent être inégaux. */
  teamsPerGroup: number[];
  qualifiersPerGroup: number;
  qualifierCount: number;
  hasQuarterFinals: boolean;
  knockoutRounds: KnockoutRoundSpec[];
  /** Toutes les confrontations du tableau, à plat, dans l'ordre de jeu. */
  bracketMatches: BracketMatchSpec[];
};

const ALL_GROUP_IDS: GroupId[] = ["A", "B", "C", "D"];

/** Seuil de bascule 2 poules → 4 poules. */
const FOUR_GROUP_THRESHOLD = 13;

/** Effectif minimum exploitable : 2 poules de 2, soit un tableau à 4 qualifiés. */
const MIN_TEAM_COUNT = 4;

export const QUALIFIERS_PER_GROUP = 2;

/**
 * Répartit `teamCount` équipes sur `groupCount` poules aussi également que
 * possible, les poules les plus fournies en premier (13 → 4/3/3/3).
 */
function splitTeams(teamCount: number, groupCount: number): number[] {
  const base = Math.floor(teamCount / groupCount);
  const remainder = teamCount % groupCount;
  return Array.from(
    { length: groupCount },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

function groupSlot(groupId: GroupId, position: number): BracketSlotSource {
  return { kind: "group_position", groupId, position };
}

function winnerSlot(matchCode: string): BracketSlotSource {
  return { kind: "match_winner", matchCode };
}

/**
 * Tableau à 8 qualifiés. La matrice est celle du règlement, et celle de
 * `arena_create_knockout_bracket()` côté base : les deux ne doivent jamais
 * diverger.
 */
function buildEightTeamBracket(): KnockoutRoundSpec[] {
  return [
    {
      id: "quarter_final",
      name: "Quarts",
      matches: [
        { code: "QF1", roundId: "quarter_final", label: "Quart 1", home: groupSlot("A", 1), away: groupSlot("B", 2) },
        { code: "QF2", roundId: "quarter_final", label: "Quart 2", home: groupSlot("C", 1), away: groupSlot("D", 2) },
        { code: "QF3", roundId: "quarter_final", label: "Quart 3", home: groupSlot("B", 1), away: groupSlot("A", 2) },
        { code: "QF4", roundId: "quarter_final", label: "Quart 4", home: groupSlot("D", 1), away: groupSlot("C", 2) },
      ],
    },
    {
      id: "semi_final",
      name: "Demi-finales",
      matches: [
        { code: "SF1", roundId: "semi_final", label: "Demie 1", home: winnerSlot("QF1"), away: winnerSlot("QF2") },
        { code: "SF2", roundId: "semi_final", label: "Demie 2", home: winnerSlot("QF3"), away: winnerSlot("QF4") },
      ],
    },
    {
      id: "final",
      name: "La finale",
      matches: [
        { code: "FINAL", roundId: "final", label: "Finale", home: winnerSlot("SF1"), away: winnerSlot("SF2") },
      ],
    },
  ];
}

/** Tableau à 4 qualifiés : demi-finales croisées directes, puis finale. */
function buildFourTeamBracket(): KnockoutRoundSpec[] {
  return [
    {
      id: "semi_final",
      name: "Demi-finales",
      matches: [
        { code: "SF1", roundId: "semi_final", label: "Demie 1", home: groupSlot("A", 1), away: groupSlot("B", 2) },
        { code: "SF2", roundId: "semi_final", label: "Demie 2", home: groupSlot("B", 1), away: groupSlot("A", 2) },
      ],
    },
    {
      id: "final",
      name: "La finale",
      matches: [
        { code: "FINAL", roundId: "final", label: "Finale", home: winnerSlot("SF1"), away: winnerSlot("SF2") },
      ],
    },
  ];
}

/**
 * Décrit intégralement le tournoi à partir du nombre d'équipes engagées.
 * Fonction pure : même entrée, même sortie, aucun effet de bord.
 */
export function getTournamentFormat(teamCount: number): TournamentFormat {
  const safeTeamCount = Math.max(MIN_TEAM_COUNT, Math.floor(teamCount));
  const groupCount = safeTeamCount >= FOUR_GROUP_THRESHOLD ? 4 : 2;
  const groupIds = ALL_GROUP_IDS.slice(0, groupCount);
  const teamsPerGroup = splitTeams(safeTeamCount, groupCount);
  const hasQuarterFinals = groupCount === 4;
  const knockoutRounds = hasQuarterFinals
    ? buildEightTeamBracket()
    : buildFourTeamBracket();

  return {
    teamCount: safeTeamCount,
    groupCount,
    groupIds,
    groups: groupIds.map((id, index) => ({
      id,
      letter: id,
      teamCount: teamsPerGroup[index],
    })),
    teamsPerGroup,
    qualifiersPerGroup: QUALIFIERS_PER_GROUP,
    qualifierCount: groupCount * QUALIFIERS_PER_GROUP,
    hasQuarterFinals,
    knockoutRounds,
    bracketMatches: knockoutRounds.flatMap((round) => round.matches),
  };
}

const ORDINALS: Record<number, string> = { 1: "1er", 2: "2ème", 3: "3ème", 4: "4ème" };

/**
 * Libellé public d'une origine de slot : « 1er poule A », « Vainqueur quart 1 ».
 * Formaté à un seul endroit pour que l'aperçu de l'accueil et la page Tableau
 * ne puissent pas se contredire.
 */
export function describeSlotSource(
  source: BracketSlotSource,
  format: TournamentFormat,
): string {
  if (source.kind === "group_position") {
    const ordinal = ORDINALS[source.position] ?? `${source.position}ème`;
    return `${ordinal} poule ${source.groupId}`;
  }
  const match = format.bracketMatches.find((m) => m.code === source.matchCode);
  return `Vainqueur ${(match?.label ?? source.matchCode).toLowerCase()}`;
}

/**
 * Nombre de rencontres de poules qu'implique le format : mini-championnat dans
 * chaque poule, soit n(n-1)/2 par poule.
 *
 * C'est le volume que le calendrier définitif devra couvrir une fois les
 * inscriptions closes — 8 équipes en donnent 12, 10 en donnent 20, 12 en
 * donnent 30. Calculé ici pour que la page Infos et le générateur de calendrier
 * ne puissent pas annoncer deux chiffres différents.
 */
export function getGroupMatchCount(format: TournamentFormat): number {
  return format.teamsPerGroup.reduce(
    (total, size) => total + (size * (size - 1)) / 2,
    0,
  );
}

/** `true` si la poule existe dans ce format. Garde-fou contre une poule fantôme. */
export function hasGroup(format: TournamentFormat, groupId: string): boolean {
  return format.groupIds.includes(groupId as GroupId);
}
