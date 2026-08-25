/**
 * Règlement sportif de L'ARÈNE — SOURCE DE VÉRITÉ UNIQUE.
 *
 * Tout ce qui relève du règlement vit ici : effectifs, durées, règles
 * signatures, départage, discipline, récompenses. Les autres modules le lisent,
 * jamais l'inverse — ce fichier n'importe rien du reste du domaine, ce qui
 * garantit l'absence de dépendance circulaire et en fait le point d'entrée
 * naturel pour l'espace inscription (PR #5) comme pour l'interface live.
 *
 * RÈGLE : aucune valeur du règlement ne doit être recopiée dans un composant.
 * Un chiffre qui change ici change partout.
 */

// ---------------------------------------------------------------------------
// Effectifs
// ---------------------------------------------------------------------------

/**
 * Composition d'une équipe.
 *
 * Ces bornes ont leur équivalent en base : `arena_events.min_players_per_team`
 * et `max_players_per_team`. Le branchement se fera par mapping, sans changer
 * de schéma.
 */
export const SQUAD_RULES = {
  /** Minimum de joueurs inscrits pour qu'une équipe soit valide. */
  minPlayers: 7,
  /** Maximum de joueurs inscrits. */
  maxPlayers: 9,
  /** Joueurs de champ sur le terrain. */
  fieldPlayers: 5,
  /** Gardiens sur le terrain. */
  goalkeepers: 1,
  /** Remplacements volants, en jeu, sans limite de nombre. */
  rollingSubstitutions: true,
} as const;

/** 6 joueurs sur le terrain : 5 de champ + 1 gardien. */
export const PLAYERS_ON_PITCH =
  SQUAD_RULES.fieldPlayers + SQUAD_RULES.goalkeepers;

/** « 6 contre 6 ». */
export const MATCH_FORMAT_LABEL = `${PLAYERS_ON_PITCH} contre ${PLAYERS_ON_PITCH}`;

/** Nombre de remplaçants selon l'effectif inscrit : 1 au minimum, 3 au maximum. */
export const MIN_SUBSTITUTES = SQUAD_RULES.minPlayers - PLAYERS_ON_PITCH;
export const MAX_SUBSTITUTES = SQUAD_RULES.maxPlayers - PLAYERS_ON_PITCH;

/** « 7 à 9 joueurs ». */
export const SQUAD_SIZE_LABEL = `${SQUAD_RULES.minPlayers} à ${SQUAD_RULES.maxPlayers} joueurs`;

/** « 1 à 3 remplaçants ». */
export const SUBSTITUTES_LABEL = `${MIN_SUBSTITUTES} à ${MAX_SUBSTITUTES} remplaçants`;

/**
 * Moment où l'effectif d'une équipe cesse d'être modifiable.
 *
 * Aucun joueur ne peut être ajouté ni retiré après le coup d'envoi du premier
 * match de l'équipe. Côté données, ce verrou se déduit du `started_at` du
 * premier match de l'équipe ; il n'existe pas encore de colonne dédiée
 * (voir le compte rendu de PR).
 */
export const SQUAD_LOCK_LABEL =
  "Effectif verrouillé au coup d’envoi du premier match";

export type SquadSizeIssue = "too_few" | "too_many";

export type SquadSizeCheck = {
  valid: boolean;
  issue: SquadSizeIssue | null;
  /** Message prêt à afficher, au singulier ou au pluriel selon l'écart. */
  message: string;
};

/**
 * Valide un effectif.
 *
 * Écrit ici plutôt que dans un formulaire : l'espace inscription (PR #5), la
 * feuille de match et tout contrôle ultérieur doivent répondre exactement la
 * même chose sur le même nombre de joueurs.
 */
export function checkSquadSize(playerCount: number): SquadSizeCheck {
  if (playerCount < SQUAD_RULES.minPlayers) {
    const missing = SQUAD_RULES.minPlayers - playerCount;
    return {
      valid: false,
      issue: "too_few",
      message: `Il manque ${missing} joueur${missing > 1 ? "s" : ""} : une équipe compte ${SQUAD_SIZE_LABEL}.`,
    };
  }

  if (playerCount > SQUAD_RULES.maxPlayers) {
    const excess = playerCount - SQUAD_RULES.maxPlayers;
    return {
      valid: false,
      issue: "too_many",
      message: `${excess} joueur${excess > 1 ? "s" : ""} de trop : une équipe compte ${SQUAD_SIZE_LABEL}.`,
    };
  }

  return { valid: true, issue: null, message: `Effectif valide (${SQUAD_SIZE_LABEL}).` };
}

// ---------------------------------------------------------------------------
// Durées de jeu
// ---------------------------------------------------------------------------

export const GROUP_PLAY_MINUTES = 10;
export const KNOCKOUT_PLAY_MINUTES = 10;
export const FINAL_HALF_MINUTES = 7;

export const GROUP_DURATION_LABEL = `${GROUP_PLAY_MINUTES} min`;
export const KNOCKOUT_DURATION_LABEL = `${KNOCKOUT_PLAY_MINUTES} min`;
export const FINAL_DURATION_LABEL = `2 × ${FINAL_HALF_MINUTES} min`;

// ---------------------------------------------------------------------------
// Règles signatures
// ---------------------------------------------------------------------------

/** Fautes cumulées : compteur par équipe, remis à zéro à chaque match. */
export const FOUL_RULES = {
  /** Rang de faute qui fait passer l'équipe en état d'alerte. */
  alertAtFoul: 3,
  /** Première faute sanctionnée d'un penalty ; toutes les suivantes aussi. */
  penaltyFromFoul: 4,
  /** Le compteur repart de zéro au début de chaque match. */
  resetEachMatch: true,
} as const;

/** Power Play : conséquence d'un carton rouge. */
export const POWER_PLAY_RULES = {
  /** Durée maximale de l'infériorité numérique. */
  durationMinutes: 2,
  /** Un but encaissé met fin au Power Play avant son terme. */
  endsOnGoalConceded: true,
  /** Le joueur exclu ne revient jamais dans le match. */
  excludedPlayerReturns: false,
  /** Nombre de rouges dans le tournoi déclenchant une suspension. */
  redCardsBeforeSuspension: 2,
  /** Durée de la suspension, en matchs. */
  suspensionMatches: 2,
} as const;

/** Challenge vidéo : capital par équipe, conservé tant qu'il est gagné. */
export const CHALLENGE_RULES = {
  /** Capital de départ, par équipe et pour tout le tournoi. */
  perTeam: 3,
  /** Challenge gagné : conservé. Challenge perdu : consommé. */
  keptWhenWon: true,
} as const;

/** Situations sur lesquelles un challenge est recevable. */
export const CHALLENGE_REVIEWABLE_SITUATIONS = [
  "un but accordé ou refusé",
  "un ballon sorti avant un but",
  "l’identité du joueur sanctionné",
  "une décision entraînant directement un penalty",
  "une décision entraînant directement un carton rouge",
];

/** Final Minute : les dernières secondes se jouent chronomètre arrêté. */
export const FINAL_MINUTE_RULES = {
  seconds: 60,
  /** Le chronomètre est arrêté à chaque interruption de jeu. */
  effectiveTime: true,
} as const;

/** Remises en jeu : 5 secondes maximum. */
export const RESTART_RULES = {
  seconds: 5,
  /** Les touches sont jouées au pied. */
  throwInWithFeet: true,
} as const;

/** Situations soumises au délai de 5 secondes. */
export const RESTART_SITUATIONS = [
  "la touche",
  "le corner",
  "le coup franc",
  "la relance du gardien",
];

export type SignatureRuleIcon =
  | "six"
  | "foul"
  | "powerplay"
  | "challenge"
  | "final-minute"
  | "stopwatch";

/**
 * Règle signature, telle qu'elle est présentée au public.
 *
 * `badge` est l'accroche — c'est elle qu'on lit en premier sur un téléphone.
 * `highlights` tient en trois lignes courtes : l'essentiel, sans le règlement.
 * `details` n'est déplié que par qui le demande.
 */
export type SignatureRule = {
  id: string;
  /** Accroche courte, ex. « 4E FAUTE = PENALTY ». */
  badge: string;
  /** Une phrase qui dit ce que la règle change dans le jeu. */
  tagline: string;
  /** Trois lignes maximum : ce qu'il faut retenir. */
  highlights: string[];
  /** Le détail du règlement, replié par défaut. */
  details: string[];
  /** Énumération complémentaire du détail, quand la règle liste des cas. */
  detailList?: { intro: string; items: string[] };
  icon: SignatureRuleIcon;
  /** Met en avant la règle la plus emblématique du tournoi. */
  signature?: boolean;
};

export const SIGNATURE_RULES: SignatureRule[] = [
  {
    id: "six-a-side",
    badge: MATCH_FORMAT_LABEL.toUpperCase(),
    tagline: "Cinq joueurs de champ et un gardien, en permanence.",
    highlights: [
      `${SQUAD_RULES.fieldPlayers} joueurs de champ + ${SQUAD_RULES.goalkeepers} gardien`,
      "Remplacements volants et illimités",
      `${SQUAD_SIZE_LABEL} par équipe`,
    ],
    details: [
      "Les remplacements se font en jeu, sans arrêter la rencontre, et sans limite de nombre.",
      "Si une équipe marque alors qu’elle est irrégulièrement en surnombre, le but est refusé.",
      `${SQUAD_LOCK_LABEL} : aucun joueur ne peut être ajouté ensuite.`,
    ],
    icon: "six",
  },
  {
    id: "cumulative-fouls",
    badge: `${FOUL_RULES.penaltyFromFoul}E FAUTE = PENALTY`,
    tagline: "Chaque faute compte. La quatrième se paie cash.",
    highlights: [
      "Un compteur par équipe, remis à zéro à chaque match",
      `${FOUL_RULES.alertAtFoul} fautes → état d’alerte`,
      `${FOUL_RULES.penaltyFromFoul}e faute → penalty`,
    ],
    details: [
      "Chaque équipe possède son propre compteur de fautes, remis à zéro au début de chaque match.",
      `À la ${FOUL_RULES.alertAtFoul}e faute, l’équipe passe en état d’alerte.`,
      `À partir de la ${FOUL_RULES.penaltyFromFoul}e faute, chaque nouvelle faute donne un penalty à l’adversaire.`,
    ],
    icon: "foul",
  },
  {
    id: "power-play",
    badge: "POWER PLAY",
    tagline: `Un rouge, et l’équipe joue en infériorité pendant ${POWER_PLAY_RULES.durationMinutes} minutes.`,
    highlights: [
      "Joueur exclu définitivement du match",
      `${POWER_PLAY_RULES.durationMinutes} minutes maximum en infériorité`,
      "Un but encaissé libère la place",
    ],
    details: [
      "Le carton rouge exclut définitivement le joueur : il ne revient jamais dans le match.",
      `Son équipe évolue en infériorité numérique pendant ${POWER_PLAY_RULES.durationMinutes} minutes au maximum.`,
      "Si l’adversaire marque pendant cette période, le Power Play prend fin : l’équipe sanctionnée retrouve son nombre normal de joueurs avec un autre joueur.",
      `Un joueur recevant ${POWER_PLAY_RULES.redCardsBeforeSuspension} cartons rouges pendant le tournoi est suspendu ${POWER_PLAY_RULES.suspensionMatches} matchs.`,
    ],
    icon: "powerplay",
  },
  {
    id: "video-challenge",
    badge: `${CHALLENGE_RULES.perTeam} CHALLENGES`,
    tagline: "Trois demandes de vidéo par équipe. Gagnée, elle est conservée.",
    highlights: [
      `${CHALLENGE_RULES.perTeam} challenges au début du tournoi`,
      "Challenge gagné → conservé",
      "Challenge perdu → consommé",
    ],
    details: [
      "Après review, la décision devient définitive.",
      "Si les images ne permettent pas de trancher, la décision initiale reste valable.",
    ],
    detailList: {
      intro:
        "Utilisable uniquement sur une situation déterminante et raisonnablement vérifiable par la vidéo disponible :",
      items: CHALLENGE_REVIEWABLE_SITUATIONS,
    },
    icon: "challenge",
  },
  {
    id: "final-minute",
    badge: "FINAL MINUTE",
    tagline: `Les ${FINAL_MINUTE_RULES.seconds} dernières secondes se jouent en temps effectif.`,
    highlights: [
      "Chronomètre arrêté à chaque interruption",
      "Aucune perte de temps possible",
      "Le match se joue jusqu’au bout",
    ],
    details: [
      `Les ${FINAL_MINUTE_RULES.seconds} dernières secondes du match sont jouées en temps effectif.`,
      "Le chronomètre est arrêté lors des interruptions et repart à la reprise du jeu.",
    ],
    icon: "final-minute",
    signature: true,
  },
  {
    id: "five-seconds",
    badge: `${RESTART_RULES.seconds} SECONDES`,
    tagline: "Cinq secondes pour remettre le ballon en jeu. Pas une de plus.",
    highlights: [
      "Touche, corner, coup franc, relance",
      "Dépassement → possession à l’adversaire",
      "Touches jouées au pied",
    ],
    details: [
      "Le gardien ne peut pas prendre à la main une passe volontaire au pied d’un coéquipier.",
    ],
    detailList: {
      intro: `Le délai de ${RESTART_RULES.seconds} secondes s’applique à :`,
      items: RESTART_SITUATIONS,
    },
    icon: "stopwatch",
  },
];

// ---------------------------------------------------------------------------
// Classement et départage
// ---------------------------------------------------------------------------

export const POINTS_RULES = { win: 3, draw: 1, loss: 0 } as const;

/**
 * Hiérarchie de départage des poules — SOURCE DE VÉRITÉ.
 *
 * ⚠️ LE SQL EN PRODUCTION NE SUIT PAS ENCORE CET ORDRE.
 * `arena_group_standings` (migration foundation) applique différence de buts →
 * **confrontation directe** → buts marqués → discipline. L'ordre ci-dessous est
 * celui du règlement validé : la confrontation directe vient APRÈS les buts
 * marqués, et les tirs au but ferment la marche.
 *
 * Décision produit actée : c'est le SQL qui doit être réaligné sur ce fichier,
 * jamais l'inverse. Le réalignement appartient à la PR opérationnelle
 * (voir `supabase/README.md`, section 14.1) — celle-ci ne touche à aucune
 * fonction ni vue.
 */
export const TIEBREAK_ORDER = [
  "Différence de buts",
  "Buts marqués",
  "Confrontation directe",
];

/** Ultime recours, si les critères précédents laissent les équipes à égalité. */
export const TIEBREAK_LAST_RESORT =
  "Tirs au but si un départage reste absolument nécessaire";

/** Retard au-delà duquel l'équipe est déclarée forfait. */
export const FORFEIT_RULES = {
  lateAfterMinutes: 5,
  scoreFor: 5,
  scoreAgainst: 0,
} as const;

export const FORFEIT_SCORE_LABEL = `${FORFEIT_RULES.scoreFor}–${FORFEIT_RULES.scoreAgainst}`;

// ---------------------------------------------------------------------------
// Le reste du règlement
// ---------------------------------------------------------------------------

export type RuleGroupIcon = "clock" | "trophy" | "shoes" | "respect" | "whistle";

export type RuleGroup = {
  id: string;
  label: string;
  icon: RuleGroupIcon;
  items: string[];
};

/**
 * Règles qui n'ont pas besoin d'une carte à elles mais qui doivent être
 * accessibles. Présentées repliées : la page reste une page d'infos, pas un
 * règlement juridique.
 */
export const ADDITIONAL_RULES: RuleGroup[] = [
  {
    id: "durations",
    label: "Durées",
    icon: "clock",
    items: [
      `Match de poule et match à élimination directe : ${GROUP_DURATION_LABEL}`,
      `Finale : ${FINAL_DURATION_LABEL}`,
      "Égalité sur un match nécessitant un vainqueur : tirs au but directs, aucune prolongation",
    ],
  },
  {
    id: "standings",
    label: "Classement des poules",
    icon: "trophy",
    items: [
      `Victoire ${POINTS_RULES.win} points, nul ${POINTS_RULES.draw} point, défaite ${POINTS_RULES.loss}`,
      `Départage, dans l’ordre : ${TIEBREAK_ORDER.join(", ").toLowerCase()}`,
      TIEBREAK_LAST_RESORT,
    ],
  },
  {
    id: "forfeit",
    label: "Retard & forfait",
    icon: "clock",
    items: [
      `Une équipe qui se présente avec plus de ${FORFEIT_RULES.lateAfterMinutes} minutes de retard est déclarée forfait.`,
      `Le match est alors perdu ${FORFEIT_SCORE_LABEL}.`,
    ],
  },
  {
    id: "equipment",
    label: "Équipement",
    icon: "shoes",
    items: [
      "Chaussures de salle propres obligatoires, crampons interdits",
      "Protège-tibias non obligatoires",
      "Tout bijou présentant un risque doit être retiré à la demande de l’arbitre",
    ],
  },
  {
    id: "discipline",
    label: "Discipline",
    icon: "respect",
    items: [
      "Bagarre individuelle : exclusion du joueur du tournoi",
      "Bagarre générale impliquant les deux équipes : les deux équipes peuvent être exclues",
      `${POWER_PLAY_RULES.redCardsBeforeSuspension} cartons rouges dans le tournoi : ${POWER_PLAY_RULES.suspensionMatches} matchs de suspension`,
    ],
  },
  {
    id: "refereeing",
    label: "Arbitrage",
    icon: "whistle",
    items: [
      "L’autorité de l’arbitre est définitive, hors procédure de Challenge Vidéo",
    ],
  },
];

// ---------------------------------------------------------------------------
// Récompenses
// ---------------------------------------------------------------------------

export const AWARD_RULES = {
  /** Finalistes présélectionnés pour chaque récompense soumise au vote. */
  shortlistSize: 3,
  /** Répartition du résultat, en pourcentage. */
  juryShare: 50,
  publicShare: 50,
} as const;

/** Méthode d'attribution des récompenses décernées aux statistiques. */
export const AWARD_STATS_METHOD = "Statistiques officielles";

/** Méthode d'attribution des récompenses soumises au vote. */
export const AWARD_VOTE_METHOD = `${AWARD_RULES.shortlistSize} finalistes · ${AWARD_RULES.juryShare} % jury L’ARÈNE / ${AWARD_RULES.publicShare} % vote du public`;

/** Catégories soumises au vote du public, avant la finale. */
export const PUBLIC_VOTE_CATEGORIES = [
  "Meilleur joueur du tournoi",
  "Meilleur gardien",
];
