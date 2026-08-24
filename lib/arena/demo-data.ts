/**
 * Données de démonstration de l'interface publique.
 *
 * ⚠️ TEMPORAIRE — aucun appel Supabase n'est effectué. Tout est regroupé ici
 * pour qu'un seul fichier soit à remplacer au Sprint suivant.
 *
 * Le calendrier n'est PAS inventé ici : il vient des calendriers officiels de
 * `lib/arena/tournament-scenarios.ts`. Ce fichier ne fait que simuler le
 * **tirage au sort** — quelle équipe occupe la position A1, A2… — et des
 * résultats de démonstration. Changer `SELECTED_TEAM_COUNT` dans les scénarios
 * reconfigure l'ensemble du site.
 *
 * Les noms d'équipes reprennent ceux des maquettes. Aucun nom de joueur, aucune
 * photo, aucune statistique individuelle nominative n'est inventé.
 */

import {
  getTournamentFormat,
  type TournamentFormat,
} from "@/lib/arena/tournament-format";
import {
  activeScenario,
  describeMatchSlot,
  getMatchesByPhase,
  PHASE_LABELS,
  type GroupId,
  type MatchSlotRef,
} from "@/lib/arena/tournament-scenarios";
import type {
  ArenaEventSummary,
  BracketRound,
  FixtureMatch,
  GroupStandings,
  GroupSummary,
  LiveMatch,
  LiveMatchEvent,
  MatchParticipant,
  StatLeader,
  TeamSummary,
} from "@/lib/arena/types";

/** Le format dérivé du scénario retenu, consommé par toutes les pages. */
export const demoFormat: TournamentFormat = getTournamentFormat();

/** Une seule aire de jeu pour cette édition. Ne jamais afficher « Terrain 2 ». */
export const COURT_LABEL = "Terrain 1";

export const demoEvent: ArenaEventSummary = {
  name: "L’ARÈNE",
  dateLabel: "Dimanche 30 août 2026",
  venueName: "Gymnase de Villeneuve-la-Guyard",
  city: "Villeneuve-la-Guyard",
};

/** Réservoir de noms, suffisant pour le plus grand scénario (12 équipes). */
const TEAM_NAMES = [
  "Titans", "Lions", "Falcons", "Raiders", "Wolves", "Panthers",
  "Pirates", "Cobras", "Vipers", "Ninjas", "Sharks", "Rebels",
];

/**
 * Tirage au sort simulé : quelle équipe occupe la position 1, 2… de chaque
 * poule. C'est la seule chose que ce fichier décide ; le calendrier, lui, est
 * officiel.
 */
const demoDraw = new Map<GroupId, TeamSummary[]>();
{
  let cursor = 0;
  demoFormat.groups.forEach((group) => {
    const teams: TeamSummary[] = [];
    for (let i = 0; i < group.teamCount; i += 1) {
      const name = TEAM_NAMES[cursor % TEAM_NAMES.length];
      cursor += 1;
      teams.push({ id: name.toLowerCase(), name });
    }
    demoDraw.set(group.id, teams);
  });
}

/** Équipe occupant une position de tirage, si le tirage est fait. */
function teamAtDrawPosition(groupId: GroupId, position: number) {
  return demoDraw.get(groupId)?.[position - 1] ?? null;
}

/**
 * Traduit une origine en participant affichable.
 * Seules les positions de tirage sont résolues : un rang de poule ou un
 * vainqueur de demi-finale reste un libellé tant que le résultat n'existe pas.
 */
function toParticipant(ref: MatchSlotRef): MatchParticipant {
  const label = describeMatchSlot(ref);
  if (ref.kind === "draw_position") {
    return { team: teamAtDrawPosition(ref.groupId, ref.position), label };
  }
  return { team: null, label };
}

// ---------------------------------------------------------------------------
// Poules
// ---------------------------------------------------------------------------

export const demoGroups: GroupSummary[] = demoFormat.groups.map((group) => ({
  id: group.id,
  letter: group.letter,
  teamCount: group.teamCount,
  href: `/groupes?poule=${group.id}`,
}));

/**
 * Classements simulés, déterministes : la n-ième équipe d'une poule gagne un
 * match de moins que la précédente. Suffisant pour valider l'affichage, y
 * compris la zone de qualification, sans prétendre à un vrai déroulé sportif.
 */
export const demoStandings: GroupStandings[] = demoFormat.groups.map((group) => {
  const teams = demoDraw.get(group.id) ?? [];
  const played = Math.max(0, (teams.length - 1) * demoFormat.groupLegs);

  return {
    groupId: group.id,
    letter: group.letter,
    rows: teams.map((team, index) => {
      const wins = Math.max(0, played - index);
      const draws = index === 1 && teams.length >= 3 ? 1 : 0;
      const losses = Math.max(0, played - wins - draws);
      const goalsFor = 4 + wins * 2;
      const goalsAgainst = 2 + losses * 2;

      return {
        teamId: team.id,
        teamName: team.name,
        rank: index + 1,
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: wins * 3 + draws,
        qualified: index < demoFormat.qualifiersPerGroup,
      };
    }),
  };
});

// ---------------------------------------------------------------------------
// Calendrier officiel
// ---------------------------------------------------------------------------

/** Nombre de rencontres de poules déjà jouées dans le scénario de démonstration. */
const FINISHED_COUNT = 5;

/**
 * Le calendrier affiché EST le calendrier officiel du scénario : heures,
 * affiches et enjeux viennent de `tournament-scenarios`. Seuls les résultats
 * sont simulés.
 */
export const demoFixtures: FixtureMatch[] = activeScenario.matches.map(
  (match, index) => {
    const finished = match.phase === "group" && index < FINISHED_COUNT;
    return {
      id: match.code,
      code: match.code,
      timeLabel: match.timeLabel,
      courtLabel: COURT_LABEL,
      durationLabel: match.durationLabel,
      phase: match.phase,
      phaseLabel: PHASE_LABELS[match.phase],
      groupLabel: match.groupId ? `Poule ${match.groupId}` : null,
      stakeLabel: match.stakeLabel ?? null,
      home: toParticipant(match.home),
      away: toParticipant(match.away),
      status: finished ? "finished" : "scheduled",
      homeScore: finished ? (index * 3) % 5 : null,
      awayScore: finished ? (index * 2) % 4 : null,
      href: "/matchs",
    };
  },
);

export const demoUpcomingFixtures = demoFixtures.filter(
  (fixture) => fixture.status === "scheduled",
);

export const demoFinishedFixtures = demoFixtures.filter(
  (fixture) => fixture.status === "finished",
);

/** Rencontres de poules du calendrier officiel. */
export const demoGroupFixtures = demoFixtures.filter(
  (fixture) => fixture.phase === "group",
);

/** Matchs de classement — scénario 10 uniquement, tableau vide sinon. */
export const demoClassificationFixtures = demoFixtures.filter(
  (fixture) => fixture.phase === "classification",
);

/** Demi-finales, petite finale et finale. */
export const demoKnockoutFixtures = demoFixtures.filter((fixture) =>
  ["semi_final", "third_place", "final"].includes(fixture.phase),
);

/** Les deux prochaines affiches viennent du calendrier : elles existent toujours. */
export const demoNextMatch = demoUpcomingFixtures[0] ?? null;
export const demoFollowingMatch = demoUpcomingFixtures[1] ?? null;

// ---------------------------------------------------------------------------
// Match en direct
// ---------------------------------------------------------------------------

/** « 1er poule A » → « #1 Poule A », le format court des pastilles du hero. */
function seedBadge(ref: MatchSlotRef): string | null {
  if (ref.kind !== "group_rank") return null;
  return `#${ref.rank} Poule ${ref.groupId}`;
}

/**
 * Le match en direct de la démonstration est la première affiche du tableau :
 * ses pastilles décrivent des positions réellement issues du format.
 */
const openingBracketMatch = demoFormat.bracketMatches[0];
const liveHome = teamAtDrawPosition(demoFormat.groupIds[0], 1);
const liveAway = teamAtDrawPosition(demoFormat.groupIds[1], 2);

const liveHomeTeam = {
  id: liveHome?.id ?? "home",
  name: liveHome?.name ?? "Équipe A",
  seedLabel: seedBadge(openingBracketMatch.home),
};

const liveAwayTeam = {
  id: liveAway?.id ?? "away",
  name: liveAway?.name ?? "Équipe B",
  seedLabel: seedBadge(openingBracketMatch.away),
};

/**
 * Journal du match en cours, du plus récent au plus ancien.
 * Correspond terme à terme à `arena_match_events` : minute, type, équipe.
 * Le total des buts est cohérent avec le score affiché (3 - 2).
 */
const liveEvents: LiveMatchEvent[] = [
  { id: "e6", minuteLabel: "24'", type: "goal", teamId: liveHomeTeam.id, teamName: liveHomeTeam.name, label: "But" },
  { id: "e5", minuteLabel: "21'", type: "goal", teamId: liveAwayTeam.id, teamName: liveAwayTeam.name, label: "But" },
  { id: "e4", minuteLabel: "18'", type: "yellow_card", teamId: liveAwayTeam.id, teamName: liveAwayTeam.name, label: "Carton jaune" },
  { id: "e3", minuteLabel: "14'", type: "penalty_goal", teamId: liveHomeTeam.id, teamName: liveHomeTeam.name, label: "But sur penalty" },
  { id: "e2", minuteLabel: "9'", type: "goal", teamId: liveAwayTeam.id, teamName: liveAwayTeam.name, label: "But" },
  { id: "e1", minuteLabel: "4'", type: "goal", teamId: liveHomeTeam.id, teamName: liveHomeTeam.name, label: "But" },
];

export const demoLiveMatch: LiveMatch = {
  id: "demo-live",
  home: liveHomeTeam,
  away: liveAwayTeam,
  homeScore: 3,
  awayScore: 2,
  periodLabel: "2ème mi-temps",
  clockLabel: "12:47",
  venueName: demoEvent.venueName,
  courtLabel: COURT_LABEL,
  stageLabel: openingBracketMatch.label,
  events: liveEvents,
  href: "/live",
};

// ---------------------------------------------------------------------------
// Statistiques
// ---------------------------------------------------------------------------

/**
 * Seuls le meilleur buteur et le meilleur passeur figurent sur l'accueil.
 * Meilleur gardien et MVP relèveront de la future page de vote.
 */
export const demoStatLeaders: StatLeader[] = [
  { id: "buteur", title: "Meilleur buteur", value: 12, unit: "buts", href: "/stats/buteurs" },
  { id: "passeur", title: "Meilleur passeur", value: 8, unit: "passes décisives", href: "/stats/passeurs" },
];

// ---------------------------------------------------------------------------
// Tableau final
// ---------------------------------------------------------------------------

/**
 * Traduit les tours du format en structure d'affichage. Aucune confrontation
 * n'est écrite ici : tout vient du scénario, donc le tableau suit
 * automatiquement le format retenu.
 */
export function buildBracketRounds(format: TournamentFormat): BracketRound[] {
  return format.knockoutRounds.map((round) => ({
    id: round.id,
    name: round.name,
    pairings: round.matches.map((match) => ({
      id: match.code,
      code: match.label,
      home: { label: describeMatchSlot(match.home) },
      away: { label: describeMatchSlot(match.away) },
      timeLabel: match.timeLabel,
      durationLabel: match.durationLabel,
    })),
  }));
}

export const demoBracket: BracketRound[] = buildBracketRounds(demoFormat);

/** Petite finale, présentée à part du tableau de progression. */
export const demoThirdPlace = demoFormat.thirdPlaceMatch
  ? {
      id: demoFormat.thirdPlaceMatch.code,
      code: demoFormat.thirdPlaceMatch.label,
      home: { label: describeMatchSlot(demoFormat.thirdPlaceMatch.home) },
      away: { label: describeMatchSlot(demoFormat.thirdPlaceMatch.away) },
      timeLabel: demoFormat.thirdPlaceMatch.timeLabel,
      durationLabel: demoFormat.thirdPlaceMatch.durationLabel,
    }
  : null;

/** Nombre de rencontres de poules du scénario, pour les résumés. */
export const demoGroupMatchCount = getMatchesByPhase(
  activeScenario,
  "group",
).length;
