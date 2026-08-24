/**
 * Données de démonstration de l'interface publique.
 *
 * ⚠️ TEMPORAIRE — aucun appel Supabase n'est effectué. Tout est regroupé ici
 * pour qu'un seul fichier soit à remplacer au Sprint suivant.
 *
 * Point essentiel : **rien n'est écrit en dur sur la structure du tournoi**.
 * Poules, effectifs, calendrier, classements et tableau sont tous dérivés de
 * `getTournamentFormat(DEMO_TEAM_COUNT)`. Changer la seule constante
 * `DEMO_TEAM_COUNT` reconfigure l'ensemble du site.
 *
 * Les noms d'équipes reprennent ceux des maquettes. Aucun nom de joueur, aucune
 * photo, aucune statistique individuelle nominative n'est inventé.
 */

import {
  describeSlotSource,
  getTournamentFormat,
  type BracketSlotSource,
  type TournamentFormat,
} from "@/lib/arena/tournament-format";
import type {
  ArenaEventSummary,
  BracketRound,
  FixtureMatch,
  GroupStandings,
  GroupSummary,
  LiveMatch,
  StatLeader,
  TeamSummary,
} from "@/lib/arena/types";

/**
 * SEULE constante à modifier pour tester un autre format.
 * Valeurs de référence : 8, 10, 12 (2 poules) · 16 (4 poules).
 */
export const DEMO_TEAM_COUNT = 16;

/** Le format dérivé, consommé par toutes les pages. */
export const demoFormat: TournamentFormat = getTournamentFormat(DEMO_TEAM_COUNT);

/** Une seule aire de jeu pour cette édition. Ne jamais afficher « Terrain 2 ». */
export const COURT_LABEL = "Terrain 1";

export const demoEvent: ArenaEventSummary = {
  name: "L’ARÈNE",
  dateLabel: "Dimanche 30 août 2026",
  venueName: "Gymnase de Villeneuve-la-Guyard",
  city: "Villeneuve-la-Guyard",
};

/**
 * Réservoir de noms, ordonné pour que la répartition séquentielle en poules
 * reproduise les maquettes dans le format à 16 équipes.
 */
const TEAM_NAMES = [
  "Titans", "Lions", "Falcons", "Raiders",
  "Wolves", "Panthers", "Spartans", "Hunters",
  "Pirates", "Cobras", "Vipers", "Ninjas",
  "Sharks", "Rebels", "Kings", "Bandits",
];

function teamId(name: string): string {
  return name.toLowerCase();
}

/** Répartit le réservoir de noms sur les poules du format, dans l'ordre. */
function buildRoster(format: TournamentFormat): Map<string, TeamSummary[]> {
  const byGroup = new Map<string, TeamSummary[]>();
  let cursor = 0;

  format.groups.forEach((group) => {
    const teams: TeamSummary[] = [];
    for (let i = 0; i < group.teamCount; i += 1) {
      const name = TEAM_NAMES[cursor % TEAM_NAMES.length];
      cursor += 1;
      teams.push({ id: teamId(name), name });
    }
    byGroup.set(group.id, teams);
  });

  return byGroup;
}

const demoRoster = buildRoster(demoFormat);

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
  const teams = demoRoster.get(group.id) ?? [];
  const played = Math.max(0, teams.length - 1);

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
// Calendrier
// ---------------------------------------------------------------------------

const FIRST_KICKOFF_MINUTES = 9 * 60;
const MATCH_INTERVAL_MINUTES = 50;
/** Nombre de rencontres déjà jouées dans le scénario de démonstration. */
const FINISHED_COUNT = 5;

function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Calendrier de poules : mini-championnat dans chaque poule, puis entrelacement
 * des poules pour que l'unique terrain alterne les affiches.
 */
function buildFixtures(format: TournamentFormat): FixtureMatch[] {
  const perGroup = format.groups.map((group) => {
    const teams = demoRoster.get(group.id) ?? [];
    const pairs: { home: TeamSummary; away: TeamSummary; groupId: string }[] = [];
    for (let i = 0; i < teams.length; i += 1) {
      for (let j = i + 1; j < teams.length; j += 1) {
        pairs.push({ home: teams[i], away: teams[j], groupId: group.id });
      }
    }
    return pairs;
  });

  const interleaved: { home: TeamSummary; away: TeamSummary; groupId: string }[] = [];
  const longest = Math.max(0, ...perGroup.map((pairs) => pairs.length));
  for (let round = 0; round < longest; round += 1) {
    perGroup.forEach((pairs) => {
      if (pairs[round]) interleaved.push(pairs[round]);
    });
  }

  return interleaved.map((pair, index) => {
    const finished = index < FINISHED_COUNT;
    return {
      id: `fixture-${index + 1}`,
      timeLabel: formatTime(FIRST_KICKOFF_MINUTES + index * MATCH_INTERVAL_MINUTES),
      home: pair.home,
      away: pair.away,
      courtLabel: COURT_LABEL,
      groupLabel: `Poule ${pair.groupId}`,
      href: "/matchs",
      status: finished ? "finished" : "scheduled",
      homeScore: finished ? (index * 3) % 5 : null,
      awayScore: finished ? (index * 2) % 4 : null,
    };
  });
}

export const demoFixtures: FixtureMatch[] = buildFixtures(demoFormat);

export const demoUpcomingFixtures = demoFixtures.filter(
  (fixture) => fixture.status === "scheduled",
);

export const demoFinishedFixtures = demoFixtures.filter(
  (fixture) => fixture.status === "finished",
);

/** Les deux prochaines affiches proviennent du calendrier : leur poule existe toujours. */
export const demoNextMatch = demoUpcomingFixtures[0] ?? null;
export const demoFollowingMatch = demoUpcomingFixtures[1] ?? null;

// ---------------------------------------------------------------------------
// Match en direct
// ---------------------------------------------------------------------------

/** « 1er poule A » → « #1 Poule A », le format court des pastilles du hero. */
function seedBadge(source: BracketSlotSource): string | null {
  if (source.kind !== "group_position") return null;
  return `#${source.position} Poule ${source.groupId}`;
}

/**
 * Le match en direct de la démonstration est la première affiche du tableau :
 * ses pastilles décrivent donc des positions réellement issues du format
 * (« #1 Poule A » vs « #2 Poule B » dans les deux cas de figure).
 */
const openingBracketMatch = demoFormat.bracketMatches[0];
const liveHome = demoRoster.get(demoFormat.groupIds[0])?.[0];
const liveAway = demoRoster.get(demoFormat.groupIds[1])?.[1];

export const demoLiveMatch: LiveMatch = {
  id: "demo-live",
  home: {
    id: liveHome?.id ?? "home",
    name: liveHome?.name ?? "Équipe A",
    seedLabel: seedBadge(openingBracketMatch.home),
  },
  away: {
    id: liveAway?.id ?? "away",
    name: liveAway?.name ?? "Équipe B",
    seedLabel: seedBadge(openingBracketMatch.away),
  },
  homeScore: 3,
  awayScore: 2,
  periodLabel: "2ème mi-temps",
  clockLabel: "12:47",
  venueName: demoEvent.venueName,
  href: "/matchs",
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
 * n'est écrite ici : tout vient de `demoFormat.knockoutRounds`, donc le tableau
 * suit automatiquement le nombre de poules.
 */
export function buildBracketRounds(format: TournamentFormat): BracketRound[] {
  return format.knockoutRounds.map((round) => ({
    id: round.id,
    name: round.name,
    pairings: round.matches.map((match) => ({
      id: match.code,
      code: match.label,
      home: { label: describeSlotSource(match.home, format) },
      away: { label: describeSlotSource(match.away, format) },
    })),
  }));
}

export const demoBracket: BracketRound[] = buildBracketRounds(demoFormat);
