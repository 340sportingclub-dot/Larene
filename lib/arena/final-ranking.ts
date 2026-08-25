/**
 * Classement final — donnée **dérivée des résultats**, jamais saisie.
 *
 * Chaque place du classement est décidée par un match précis, déclaré dans le
 * scénario via `places: [vainqueur, perdant]` :
 *
 *   Finale        → 1re / 2e
 *   Petite finale → 3e / 4e
 *   A3 vs B3      → 5e / 6e   ┐
 *   A4 vs B4      → 7e / 8e   ├ scénario 10 uniquement
 *   A5 vs B5      → 9e / 10e  ┘
 *
 * Tant que le match décisif n'est pas terminé, la place reste **non résolue** :
 * elle affiche ce qui la déterminera, jamais une équipe supposée. Le scénario 10
 * couvre ainsi les 10 places ; les scénarios 8 et 12 n'en départagent que 4 par
 * un match, le reste relevant du classement de poules.
 */

import {
  describeMatchCode,
  getRankingMatches,
  type ScheduledMatchSpec,
  type TournamentScenario,
} from "@/lib/arena/tournament-scenarios";
import type { MatchParticipant } from "@/lib/arena/types";

export type FinalRankingRow = {
  place: number;
  /** Renseigné dès que le match décisif est terminé. */
  participant: MatchParticipant | null;
  /** Ce qui déterminera la place, ex. « Vainqueur de la petite finale ». */
  pendingLabel: string;
  /** Code du match décisif, pour remonter au calendrier. */
  matchCode: string;
};

export type FinalRanking = {
  rows: FinalRankingRow[];
  /** `true` si toutes les places du tournoi sont départagées par un match. */
  coversAllTeams: boolean;
  /** Nombre de places déjà résolues. */
  resolvedCount: number;
};

/**
 * Issue d'un match décisif.
 * `null` — ou absent — signifie « pas encore joué » : la place reste ouverte.
 */
export type MatchOutcome = {
  winner: MatchParticipant;
  loser: MatchParticipant;
} | null;

/** Comment nommer une place tant qu'elle n'est pas attribuée. */
function pendingLabelFor(match: ScheduledMatchSpec, isWinner: boolean): string {
  const name = describeMatchCode(match.code);
  if (match.code === "FINAL") {
    return isWinner ? "Vainqueur de la finale" : "Finaliste";
  }
  if (match.code === "TP") {
    return isWinner ? "Vainqueur de la petite finale" : "Perdant de la petite finale";
  }
  const stake = match.stakeLabel ? ` ${match.stakeLabel.toLowerCase()}` : "";
  return `${isWinner ? "Vainqueur" : "Perdant"} du match${stake || ` ${name}`}`;
}

/**
 * Construit le classement final à partir des résultats connus.
 *
 * `getOutcome` rend l'issue d'un match décisif, ou `null` s'il n'est pas encore
 * joué. Cette indirection est volontaire : elle permettra de brancher les vrais
 * résultats Supabase sans toucher à cette logique.
 */
export function buildFinalRanking(
  scenario: TournamentScenario,
  getOutcome: (match: ScheduledMatchSpec) => MatchOutcome,
): FinalRanking {
  const rows: FinalRankingRow[] = [];

  getRankingMatches(scenario).forEach((match) => {
    const [winnerPlace, loserPlace] = match.places!;
    const outcome = getOutcome(match);

    rows.push({
      place: winnerPlace,
      participant: outcome?.winner ?? null,
      pendingLabel: pendingLabelFor(match, true),
      matchCode: match.code,
    });
    rows.push({
      place: loserPlace,
      participant: outcome?.loser ?? null,
      pendingLabel: pendingLabelFor(match, false),
      matchCode: match.code,
    });
  });

  rows.sort((a, b) => a.place - b.place);

  return {
    rows,
    coversAllTeams: rows.length === scenario.teamCount,
    resolvedCount: rows.filter((row) => row.participant !== null).length,
  };
}
