/**
 * Calendriers officiels de L'ARÈNE 2026 — SOURCE DE VÉRITÉ UNIQUE.
 *
 * Trois scénarios sont actifs pour cette édition : 8, 10 et 12 équipes. Le
 * format à 4 poules n'existe plus. Le scénario actif est déterminé à un seul
 * endroit, par `resolveScenarioTeamCount()`, à partir du nombre d'équipes
 * réellement engagées — `DEMO_TEAM_COUNT` n'en est que le repli de démonstration.
 *
 * RÈGLES COMMUNES
 *   · un seul terrain ;
 *   · match de poule : 10 min de jeu effectif, créneau de 12 min
 *     (10 de jeu + 2 de rotation) ;
 *   · demi-finale et petite finale : 10 min ;
 *   · finale : 2 × 7 min ;
 *   · aucune prolongation hors finale — égalité en phase éliminatoire =
 *     tirs au but directs ;
 *   · concours de penalties et votes du public avant la finale.
 *
 * DEUX SÉMANTIQUES À NE JAMAIS CONFONDRE
 *   · en poules, « A1 » désigne la **position de tirage** dans la poule A
 *     (`arena_group_teams.draw_position`) ;
 *   · en phase finale, « A1 » désigne le **1er au classement** de la poule A.
 *   Deux types de référence distincts les représentent : `draw_position` et
 *   `group_rank`.
 */

import {
  AWARD_VOTE_METHOD,
  FINAL_DURATION_LABEL,
  GROUP_DURATION_LABEL,
  KNOCKOUT_DURATION_LABEL,
  PUBLIC_VOTE_CATEGORIES,
} from "@/lib/arena/rules";

/**
 * Les trois scénarios actifs ne comptent que deux poules. Le type l'impose :
 * une poule C ou D n'est plus représentable.
 */
export type GroupId = "A" | "B";

export type ScenarioTeamCount = 8 | 10 | 12;

/**
 * Nombre d'équipes utilisé **en démonstration** (Preview).
 *
 * ⚠️ Ce n'est PAS une règle métier. À terme, le scénario actif se déduira du
 * nombre d'équipes réellement inscrites, via `resolveScenarioTeamCount()` :
 * cette constante ne sera plus que la valeur de repli quand la configuration
 * de l'événement n'est pas encore connue.
 *
 * Aucun composant ne doit la lire : tous passent par `activeScenario` ou
 * `getTournamentFormat()`.
 */
export const DEMO_TEAM_COUNT: ScenarioTeamCount = 12;

/**
 * Détermine le scénario à appliquer à partir du nombre d'équipes engagées.
 *
 * 8 → scénario 8, 10 → scénario 10, 12 → scénario 12. Toute autre valeur, ou
 * une configuration encore inconnue, retombe sur la valeur de démonstration :
 * l'interface reste affichable, et le jour où `arena_events` porte le nombre
 * définitif, il suffit de le passer ici.
 */
export function resolveScenarioTeamCount(
  configuredTeamCount?: number | null,
): ScenarioTeamCount {
  if (configuredTeamCount != null && isActiveTeamCount(configuredTeamCount)) {
    return configuredTeamCount;
  }
  return DEMO_TEAM_COUNT;
}

// ---------------------------------------------------------------------------
// Références de participants
// ---------------------------------------------------------------------------

export type MatchSlotRef =
  /** Position issue du tirage au sort, ex. « A1 » = 1re équipe tirée en poule A. */
  | { kind: "draw_position"; groupId: GroupId; position: number }
  /** Rang au classement de la poule, ex. « 1er poule A ». */
  | { kind: "group_rank"; groupId: GroupId; rank: number }
  | { kind: "match_winner"; matchCode: string }
  | { kind: "match_loser"; matchCode: string };

export type MatchPhase =
  | "group"
  | "classification"
  | "semi_final"
  | "third_place"
  | "final";

export type ScheduledMatchSpec = {
  /** Code stable : G1…, CL1…, SF1, SF2, TP, FINAL. */
  code: string;
  phase: MatchPhase;
  /** Heure de coup d'envoi, ex. « 09:00 ». */
  timeLabel: string;
  groupId?: GroupId;
  home: MatchSlotRef;
  away: MatchSlotRef;
  /** Temps de jeu effectif, ex. « 10 min » ou « 2 × 7 min ». */
  durationLabel: string;
  /** Enjeu d'un match de classement, ex. « Places 9e / 10e ». */
  stakeLabel?: string;
  /**
   * Places du classement final que ce match départage : `[vainqueur, perdant]`.
   * Renseigné, il fait entrer le match dans le calcul du classement final.
   */
  places?: [number, number];
};

/** Moment de la journée qui n'est pas une rencontre. */
export type DayEventSpec = {
  id: string;
  label: string;
  /** `null` si l'heure n'est pas arrêtée (ouverture du gymnase). */
  timeLabel: string | null;
  /** Fin du créneau, pour les moments qui en occupent un. */
  endTimeLabel?: string;
  note?: string;
};

export type TournamentScenario = {
  teamCount: ScenarioTeamCount;
  groupCount: number;
  teamsPerGroup: number;
  /** 1 = aller simple, 2 = aller-retour. */
  groupLegs: 1 | 2;
  qualifiersPerGroup: number;
  guaranteedMatchesPerTeam: number;
  guaranteedPlayMinutes: number;
  hasClassificationMatches: boolean;
  matches: ScheduledMatchSpec[];
  dayEvents: DayEventSpec[];
};

// ---------------------------------------------------------------------------
// Grille horaire des poules
// ---------------------------------------------------------------------------

const FIRST_KICKOFF = "09:00";
/**
 * Pas de la grille horaire : 10 min de jeu + 2 min de rotation.
 * Les durées de jeu elles-mêmes appartiennent au règlement (`lib/arena/rules`).
 */
export const GROUP_SLOT_MINUTES = 12;

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Heure du n-ième créneau, à partir de 09:00 et par pas de 12 min. */
function slotTime(index: number): string {
  return toLabel(toMinutes(FIRST_KICKOFF) + index * GROUP_SLOT_MINUTES);
}

// ---------------------------------------------------------------------------
// Rotations de poule, validées
// ---------------------------------------------------------------------------
/**
 * Ordre des rencontres au sein d'une poule, en positions de tirage.
 * Ces rotations sont celles des calendriers de référence : elles répartissent
 * le repos entre deux matchs d'une même équipe. Elles ne sont pas recalculées.
 */
const GROUP_ROTATIONS: Record<number, [number, number][]> = {
  // Poule de 4 — aller (le retour est dérivé en inversant chaque affiche).
  4: [
    [1, 2], [3, 4],
    [1, 3], [2, 4],
    [1, 4], [2, 3],
  ],
  // Poule de 5 — aller simple.
  5: [
    [2, 5], [3, 4],
    [1, 5], [2, 3],
    [1, 4], [5, 3],
    [1, 3], [4, 2],
    [1, 2], [4, 5],
  ],
  // Poule de 6 — aller simple.
  6: [
    [1, 6], [2, 5], [3, 4],
    [1, 5], [6, 4], [2, 3],
    [1, 4], [5, 3], [6, 2],
    [1, 3], [4, 2], [5, 6],
    [1, 2], [3, 6], [4, 5],
  ],
};

/** Affiches d'une poule, retour inclus si `legs === 2` (réception inversée). */
function groupPairings(size: number, legs: 1 | 2): [number, number][] {
  const first = GROUP_ROTATIONS[size];
  if (!first) {
    throw new Error(`Aucune rotation validée pour une poule de ${size}`);
  }
  if (legs === 1) return first;
  return [...first, ...first.map(([h, a]) => [a, h] as [number, number])];
}

const GROUP_IDS: GroupId[] = ["A", "B"];

/**
 * Moment officiel de la journée, entre les demi-finales et la petite finale.
 * Défini ici une seule fois : les trois scénarios n'en changent que l'horaire.
 * Les catégories et la méthode de vote viennent du règlement.
 */
function penaltyEvent(
  timeLabel: string,
  endTimeLabel: string,
  extra?: string,
): DayEventSpec {
  return {
    id: "penalty",
    label: "Concours de penalties & votes du public",
    timeLabel,
    endTimeLabel,
    note: [
      `Votes : ${PUBLIC_VOTE_CATEGORIES.join(" et ")}`,
      AWARD_VOTE_METHOD,
      extra,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

/**
 * Calendrier de poules : les poules alternent créneau après créneau, l'unique
 * terrain enchaînant A, B, A, B…
 */
function buildGroupMatches(size: number, legs: 1 | 2): ScheduledMatchSpec[] {
  const pairings = groupPairings(size, legs);
  const matches: ScheduledMatchSpec[] = [];

  pairings.forEach(([home, away], round) => {
    GROUP_IDS.forEach((groupId, groupIndex) => {
      const index = round * GROUP_IDS.length + groupIndex;
      matches.push({
        code: `G${index + 1}`,
        phase: "group",
        timeLabel: slotTime(index),
        groupId,
        home: { kind: "draw_position", groupId, position: home },
        away: { kind: "draw_position", groupId, position: away },
        durationLabel: GROUP_DURATION_LABEL,
      });
    });
  });

  return matches;
}

/** Demi-finales croisées, petite finale, finale — identiques aux trois scénarios. */
function buildKnockoutMatches(times: {
  semiFinal1: string;
  semiFinal2: string;
  thirdPlace: string;
  final: string;
}): ScheduledMatchSpec[] {
  return [
    {
      code: "SF1",
      phase: "semi_final",
      timeLabel: times.semiFinal1,
      home: { kind: "group_rank", groupId: "A", rank: 1 },
      away: { kind: "group_rank", groupId: "B", rank: 2 },
      durationLabel: KNOCKOUT_DURATION_LABEL,
    },
    {
      code: "SF2",
      phase: "semi_final",
      timeLabel: times.semiFinal2,
      home: { kind: "group_rank", groupId: "B", rank: 1 },
      away: { kind: "group_rank", groupId: "A", rank: 2 },
      durationLabel: KNOCKOUT_DURATION_LABEL,
    },
    {
      code: "TP",
      phase: "third_place",
      timeLabel: times.thirdPlace,
      home: { kind: "match_loser", matchCode: "SF1" },
      away: { kind: "match_loser", matchCode: "SF2" },
      durationLabel: KNOCKOUT_DURATION_LABEL,
      stakeLabel: "Places 3e / 4e",
      places: [3, 4],
    },
    {
      code: "FINAL",
      phase: "final",
      timeLabel: times.final,
      home: { kind: "match_winner", matchCode: "SF1" },
      away: { kind: "match_winner", matchCode: "SF2" },
      durationLabel: FINAL_DURATION_LABEL,
      stakeLabel: "Places 1re / 2e",
      places: [1, 2],
    },
  ];
}

// ---------------------------------------------------------------------------
// Les trois scénarios
// ---------------------------------------------------------------------------

const scenario8: TournamentScenario = {
  teamCount: 8,
  groupCount: 2,
  teamsPerGroup: 4,
  groupLegs: 2,
  qualifiersPerGroup: 2,
  guaranteedMatchesPerTeam: 6,
  guaranteedPlayMinutes: 60,
  hasClassificationMatches: false,
  matches: [
    ...buildGroupMatches(4, 2),
    ...buildKnockoutMatches({
      semiFinal1: "14:15",
      semiFinal2: "14:30",
      thirdPlace: "15:45",
      final: "16:20",
    }),
  ],
  dayEvents: [
    { id: "doors", label: "Ouverture & accueil des équipes", timeLabel: null, note: "À confirmer" },
    { id: "groups-end", label: "Fin des poules", timeLabel: "13:48" },
    penaltyEvent("14:45", "15:45", "Buvette et animation"),
    { id: "final-presentation", label: "Présentation de la finale", timeLabel: "16:15" },
    { id: "sport-end", label: "Fin sportive", timeLabel: "16:40", note: "Horaire approximatif" },
    { id: "ceremony", label: "Remise des récompenses & photos", timeLabel: "16:45", endTimeLabel: "17:15" },
  ],
};

const scenario10: TournamentScenario = {
  teamCount: 10,
  groupCount: 2,
  teamsPerGroup: 5,
  groupLegs: 1,
  qualifiersPerGroup: 2,
  guaranteedMatchesPerTeam: 5,
  guaranteedPlayMinutes: 50,
  hasClassificationMatches: true,
  matches: [
    ...buildGroupMatches(5, 1),
    // Matchs de classement : ils font partie intégrante du format, chaque
    // équipe éliminée en poules dispute un 5e match.
    {
      code: "CL1",
      phase: "classification",
      timeLabel: "13:00",
      home: { kind: "group_rank", groupId: "A", rank: 5 },
      away: { kind: "group_rank", groupId: "B", rank: 5 },
      durationLabel: KNOCKOUT_DURATION_LABEL,
      stakeLabel: "Places 9e / 10e",
      places: [9, 10],
    },
    {
      code: "CL2",
      phase: "classification",
      timeLabel: "13:12",
      home: { kind: "group_rank", groupId: "A", rank: 4 },
      away: { kind: "group_rank", groupId: "B", rank: 4 },
      durationLabel: KNOCKOUT_DURATION_LABEL,
      stakeLabel: "Places 7e / 8e",
      places: [7, 8],
    },
    {
      code: "CL3",
      phase: "classification",
      timeLabel: "13:24",
      home: { kind: "group_rank", groupId: "A", rank: 3 },
      away: { kind: "group_rank", groupId: "B", rank: 3 },
      durationLabel: KNOCKOUT_DURATION_LABEL,
      stakeLabel: "Places 5e / 6e",
      places: [5, 6],
    },
    ...buildKnockoutMatches({
      semiFinal1: "13:45",
      semiFinal2: "14:00",
      thirdPlace: "15:30",
      final: "16:10",
    }),
  ],
  dayEvents: [
    { id: "doors", label: "Ouverture & accueil des équipes", timeLabel: null, note: "À confirmer" },
    { id: "groups-end", label: "Fin des poules", timeLabel: "13:00" },
    penaltyEvent("14:15", "15:15", "Restauration et animation"),
    { id: "final-presentation", label: "Présentation de la finale", timeLabel: "16:00" },
    { id: "sport-end", label: "Fin sportive", timeLabel: "16:30", note: "Horaire approximatif" },
    { id: "ceremony", label: "Cérémonie", timeLabel: "16:35", endTimeLabel: "17:00" },
  ],
};

const scenario12: TournamentScenario = {
  teamCount: 12,
  groupCount: 2,
  teamsPerGroup: 6,
  groupLegs: 1,
  qualifiersPerGroup: 2,
  guaranteedMatchesPerTeam: 5,
  guaranteedPlayMinutes: 50,
  hasClassificationMatches: false,
  matches: [
    ...buildGroupMatches(6, 1),
    ...buildKnockoutMatches({
      semiFinal1: "15:30",
      semiFinal2: "15:45",
      thirdPlace: "16:45",
      final: "17:15",
    }),
  ],
  dayEvents: [
    { id: "doors", label: "Ouverture & accueil des équipes", timeLabel: null, note: "À confirmer" },
    { id: "groups-end", label: "Fin des poules", timeLabel: "15:00" },
    { id: "validation", label: "Validation des classements & récupération", timeLabel: "15:00", endTimeLabel: "15:30" },
    penaltyEvent("16:00", "16:45"),
    { id: "final-presentation", label: "Présentation de la finale", timeLabel: "17:05" },
    { id: "sport-end", label: "Fin sportive", timeLabel: "17:31", note: "Horaire approximatif" },
    { id: "ceremony", label: "Remise des récompenses & photos", timeLabel: "17:35", endTimeLabel: "18:00" },
  ],
};

const SCENARIOS: Record<ScenarioTeamCount, TournamentScenario> = {
  8: scenario8,
  10: scenario10,
  12: scenario12,
};

export const ACTIVE_TEAM_COUNTS: ScenarioTeamCount[] = [8, 10, 12];

export function isActiveTeamCount(value: number): value is ScenarioTeamCount {
  return (ACTIVE_TEAM_COUNTS as number[]).includes(value);
}

export function getScenario(
  teamCount: ScenarioTeamCount = resolveScenarioTeamCount(),
): TournamentScenario {
  return SCENARIOS[teamCount];
}

/** Le scénario de l'édition en cours. */
export const activeScenario = getScenario(resolveScenarioTeamCount());

// ---------------------------------------------------------------------------
// Sélecteurs
// ---------------------------------------------------------------------------

export function getMatchesByPhase(
  scenario: TournamentScenario,
  phase: MatchPhase,
): ScheduledMatchSpec[] {
  return scenario.matches.filter((match) => match.phase === phase);
}

export function getGroupMatches(
  scenario: TournamentScenario,
  groupId?: GroupId,
): ScheduledMatchSpec[] {
  return scenario.matches.filter(
    (match) =>
      match.phase === "group" && (!groupId || match.groupId === groupId),
  );
}

/**
 * Matchs qui départagent une place au classement final, triés par place.
 * Vide si le format n'en comporte aucun.
 */
export function getRankingMatches(
  scenario: TournamentScenario,
): ScheduledMatchSpec[] {
  return scenario.matches
    .filter((match) => match.places !== undefined)
    .sort((a, b) => a.places![0] - b.places![0]);
}

/**
 * Libellé public d'une référence de participant.
 * Formaté à un seul endroit pour que calendrier, tableau et accueil ne puissent
 * pas se contredire.
 */
export function describeMatchSlot(ref: MatchSlotRef): string {
  switch (ref.kind) {
    case "draw_position":
      return `${ref.groupId}${ref.position}`;
    case "group_rank":
      return `${ref.rank === 1 ? "1er" : `${ref.rank}ème`} poule ${ref.groupId}`;
    case "match_winner":
      return `Vainqueur ${describeMatchCode(ref.matchCode)}`;
    case "match_loser":
      return `Perdant ${describeMatchCode(ref.matchCode)}`;
  }
}

/** « SF1 » → « demi-finale 1 ». */
export function describeMatchCode(code: string): string {
  // Forme courte : « Vainqueur demi-finale 1 » ne tient pas à 390 px.
  if (code === "SF1") return "demie 1";
  if (code === "SF2") return "demie 2";
  if (code === "TP") return "petite finale";
  if (code === "FINAL") return "finale";
  return code;
}

export const PHASE_LABELS: Record<MatchPhase, string> = {
  group: "Poules",
  classification: "Classement",
  semi_final: "Demi-finales",
  third_place: "Petite finale",
  final: "Finale",
};
