/**
 * Informations pratiques de L'ARÈNE — source unique de la page `/infos`.
 *
 * RÈGLE CENTRALE : une information non arrêtée vaut `null`, jamais une valeur
 * inventée. L'interface filtre les `null` — elle n'affiche jamais « undefined »,
 * ni un horaire, une adresse, une règle ou un produit qui n'existe pas encore.
 *
 * Le jour où une donnée est connue, il suffit de la renseigner ici : la page
 * l'affichera sans modification de composant.
 *
 * ⚠️ Aucune lecture Supabase à ce stade. Plusieurs de ces champs ont déjà leur
 * équivalent en base (`arena_events.venue_name`, `venue_address`, `doors_open_at`,
 * `first_match_at`, `player_fee_cents`, `minimum_age`…) : le branchement se fera
 * par mapping vers ces mêmes types.
 */

import { COURT_LABEL, demoEvent } from "@/lib/arena/demo-data";
import {
  AWARD_RULES,
  AWARD_STATS_METHOD,
  AWARD_VOTE_METHOD,
  PUBLIC_VOTE_CATEGORIES,
  SQUAD_SIZE_LABEL,
} from "@/lib/arena/rules";
import {
  activeScenario,
  getMatchesByPhase,
  type TournamentScenario,
} from "@/lib/arena/tournament-scenarios";

/** Un moment de la journée. `time` reste `null` tant que l'heure n'est pas arrêtée. */
export type ScheduleSlot = {
  id: string;
  label: string;
  /** Heure déjà formatée, ex. « 08:30 ». `null` = pas encore arrêtée. */
  time: string | null;
  /**
   * Ce qu'on affiche à la place de l'heure tant qu'elle n'existe pas.
   * Permet de dire « à l'issue des poules » plutôt qu'un vague « à confirmer ».
   * Absent ⇒ « À confirmer ».
   */
  pendingNote?: string | null;
  /** Repris dans la carte « Date & horaires » en plus de la timeline. */
  keyMilestone?: boolean;
  description?: string | null;
};

/** Clé d'icône d'une règle pratique, résolue par `PracticalRules`. */
export type PracticalRuleIcon =
  | "shoes"
  | "locker"
  | "clock"
  | "respect"
  | "bag";

/**
 * Règle pratique, découpée en lignes courtes plutôt qu'en un pavé de texte :
 * c'est ce qui la rend lisible d'un coup d'œil sur un téléphone.
 * `lines === null` ⇒ règle non arrêtée, la carte n'est pas affichée.
 */
export type PracticalRule = {
  id: string;
  label: string;
  icon: PracticalRuleIcon;
  lines: string[] | null;
};

export type AwardCategory = {
  id: string;
  label: string;
  /** Soumis au vote du public, avant la finale. */
  publicVote: boolean;
  /** Comment le lauréat est désigné. Vient du règlement. */
  method: string;
  /** Finalistes présélectionnés. `null` quand la récompense vient des stats. */
  shortlistSize: number | null;
};

export type WhatsappContact = {
  /** Affichage français, ex. « 06 95 82 02 61 ». */
  display: string;
  /** Format international sans signe ni espace, pour wa.me. */
  international: string;
};

export type ArenaInfo = {
  dateLabel: string;
  /** Le tournoi se joue sur une seule journée. */
  singleDay: boolean;
  venueName: string;
  /** Ligne de voie, ex. « 3 rue … ». Correspond à `arena_events.venue_address`. */
  address: string | null;
  postalCode: string | null;
  city: string | null;
  /** Sert à préciser la recherche d'itinéraire, pas affiché. */
  country: string | null;
  /** URL d'itinéraire officielle. `null` ⇒ repli, voir `getDirectionsUrl()`. */
  mapsUrl: string | null;
  whatsappNumbers: WhatsappContact[];
  instagramHandle: string | null;
  registration: {
    ageCategory: string;
    playerFeeCents: number;
    currency: string;
    squadSizeNote: string;
    limitedPlaces: boolean;
    /** Parcours d'inscription en ligne. `null` ⇒ renvoi vers WhatsApp. */
    url: string | null;
  };
  /** Une seule aire de jeu. Il n'existe pas de « Terrain 2 ». */
  courtLabel: string;
  courtCount: number;
  food: {
    available: boolean;
    summary: string;
    /** Catégories détaillées (boissons, repas, snacks) — vides tant qu'aucune carte n'existe. */
    categories: { id: string; label: string }[];
  };
  media: {
    photos: boolean;
    videos: boolean;
    partner: string | null;
    /** Diffusion en direct non confirmée ⇒ `null`, rien n'est affiché. */
    livestreamUrl: string | null;
  };
  schedule: ScheduleSlot[];
  practicalRules: PracticalRule[];
  awards: AwardCategory[];
};

/**
 * Compose le programme de la journée à partir du calendrier officiel.
 *
 * Deux sources se rejoignent : les moments hors rencontre du scénario
 * (ouverture, concours de penalties, cérémonie) et les jalons déduits des
 * matchs eux-mêmes (début du tournoi, demi-finales, finale). Rien n'est écrit
 * en dur — un changement de scénario suffit à tout décaler.
 *
 * `/infos` donne la forme de la journée ; le détail match par match est sur
 * la page Matchs.
 */
function buildDayProgramme(scenario: TournamentScenario): ScheduleSlot[] {
  const groups = getMatchesByPhase(scenario, "group");
  const classification = getMatchesByPhase(scenario, "classification");
  const semiFinals = getMatchesByPhase(scenario, "semi_final");
  const thirdPlace = getMatchesByPhase(scenario, "third_place")[0];
  const final = getMatchesByPhase(scenario, "final")[0];

  const slots: ScheduleSlot[] = scenario.dayEvents.map((event) => ({
    id: event.id,
    label: event.label,
    time: event.timeLabel,
    pendingNote: event.timeLabel ? null : (event.note ?? "À confirmer"),
    description: [
      event.endTimeLabel ? `Jusqu’à ${event.endTimeLabel}` : null,
      event.timeLabel ? (event.note ?? null) : null,
    ]
      .filter(Boolean)
      .join(" · ") || null,
  }));

  if (groups.length > 0) {
    slots.push({
      id: "tournament-start",
      label: "Début du tournoi",
      time: groups[0].timeLabel,
      keyMilestone: true,
      description: `${groups.length} matchs de poules · ${
        scenario.groupLegs === 2 ? "aller-retour" : "aller simple"
      }`,
    });
  }

  if (classification.length > 0) {
    slots.push({
      id: "classification",
      label: "Matchs de classement",
      time: classification[0].timeLabel,
      description: `${classification.length} matchs · places 5e à ${scenario.teamCount}e`,
    });
  }

  if (semiFinals.length > 0) {
    slots.push({
      id: "semi-finals",
      label: "Demi-finales",
      time: semiFinals[0].timeLabel,
      keyMilestone: true,
      description:
        semiFinals.length > 1
          ? `Seconde demi-finale à ${semiFinals[1].timeLabel}`
          : null,
    });
  }

  if (thirdPlace) {
    slots.push({
      id: "third-place",
      label: "Petite finale",
      time: thirdPlace.timeLabel,
      description: thirdPlace.stakeLabel ?? null,
    });
  }

  if (final) {
    slots.push({
      id: "final",
      label: "Finale",
      time: final.timeLabel,
      keyMilestone: true,
      description: final.durationLabel,
    });
  }

  // Les moments sans heure arrêtée ouvrent la journée ; le reste suit l'horloge.
  return slots.sort((a, b) => {
    if (a.time === null) return -1;
    if (b.time === null) return 1;
    return a.time.localeCompare(b.time);
  });
}

export const arenaInfo: ArenaInfo = {
  dateLabel: demoEvent.dateLabel,
  singleDay: true,

  venueName: demoEvent.venueName,
  address: "3 rue Antoine de Saint-Exupéry",
  postalCode: "89340",
  city: demoEvent.city,
  country: "France",
  mapsUrl: null,

  whatsappNumbers: [
    { display: "06 95 82 02 61", international: "33695820261" },
    { display: "06 51 06 78 07", international: "33651067807" },
  ],
  instagramHandle: "larene_340",

  registration: {
    ageCategory: "+16 ans",
    playerFeeCents: 1500,
    currency: "EUR",
    // Effectif réglementaire : la valeur vient du règlement, jamais recopiée.
    squadSizeNote: SQUAD_SIZE_LABEL,
    limitedPlaces: true,
    // Parcours d'inscription en ligne pas encore ouvert : pas de faux bouton.
    url: null,
  },

  courtLabel: COURT_LABEL,
  courtCount: 1,

  food: {
    available: true,
    summary: "Buvette et restauration sur place pendant toute la journée",
    // Aucune carte arrêtée : aucun produit ni prix ne doit être inventé.
    categories: [],
  },

  media: {
    photos: true,
    videos: true,
    partner: "SportVision",
    // Diffusion en direct non confirmée.
    livestreamUrl: null,
  },

  /**
   * Déroulé de la journée, entièrement dérivé du calendrier officiel du
   * scénario retenu. Aucun horaire n'est saisi ici : changer de scénario
   * change le programme.
   */
  schedule: buildDayProgramme(activeScenario),

  /**
   * Règles pratiques officielles. Une règle dont `lines` vaut `null` n'est pas
   * affichée ; si toutes le sont, la section entière disparaît.
   */
  practicalRules: [
    {
      id: "shoes",
      label: "Chaussures",
      icon: "shoes",
      lines: [
        "Chaussures de salle propres obligatoires.",
        "Crampons interdits, y compris crampons moulés et chaussures utilisées à l’extérieur.",
      ],
    },
    {
      id: "changing-rooms",
      label: "Vestiaires",
      icon: "locker",
      lines: [
        "Des vestiaires seront mis à disposition des équipes.",
        "Les effets personnels restent sous la responsabilité de chaque participant.",
        "Les équipes devront libérer et laisser leur vestiaire propre après utilisation.",
      ],
    },
    {
      id: "arrival",
      label: "Heure d’arrivée",
      icon: "clock",
      lines: [
        "Chaque équipe doit être présente 30 minutes avant son premier match.",
        "Le capitaine doit se présenter à l’accueil dès l’arrivée de son équipe pour effectuer le check-in.",
      ],
    },
    {
      id: "conduct",
      label: "Comportement",
      icon: "respect",
      lines: [
        "Respect obligatoire des arbitres, adversaires, organisateurs, bénévoles, installations et spectateurs.",
        "Tout comportement violent, menaçant ou gravement antisportif pourra entraîner l’exclusion immédiate d’un joueur ou d’une équipe du tournoi.",
      ],
    },
    {
      id: "equipment",
      label: "Matériel",
      icon: "bag",
      lines: [
        "Les équipes viennent avec leur propre tenue de match.",
        "Les chasubles et ballons nécessaires à l’organisation des rencontres sont fournis par l’organisation.",
        "Prévoir une gourde individuelle.",
      ],
    },
  ],

  /**
   * Récompenses officielles. Buteur et passeur sortent des statistiques ; les
   * deux autres passent par une shortlist et un vote mixte jury / public,
   * défini une seule fois dans le règlement.
   */
  awards: [
    {
      id: "buteur",
      label: "Meilleur buteur",
      publicVote: false,
      method: AWARD_STATS_METHOD,
      shortlistSize: null,
    },
    {
      id: "passeur",
      label: "Meilleur passeur",
      publicVote: false,
      method: AWARD_STATS_METHOD,
      shortlistSize: null,
    },
    {
      id: "mvp",
      label: PUBLIC_VOTE_CATEGORIES[0],
      publicVote: true,
      method: AWARD_VOTE_METHOD,
      shortlistSize: AWARD_RULES.shortlistSize,
    },
    {
      id: "gardien",
      label: PUBLIC_VOTE_CATEGORIES[1],
      publicVote: true,
      method: AWARD_VOTE_METHOD,
      shortlistSize: AWARD_RULES.shortlistSize,
    },
  ],
};

// ---------------------------------------------------------------------------
// Dérivés — un seul endroit où ces règles d'affichage sont écrites
// ---------------------------------------------------------------------------

/** Moments repris dans la carte « Date & horaires ». */
export const keyMilestones = arenaInfo.schedule.filter(
  (slot) => slot.keyMilestone,
);

/**
 * `true` dès qu'un seul horaire est arrêté.
 *
 * Tant que c'est `false`, la carte « Date & horaires » n'énumère pas ses jalons :
 * ils seraient tous « à confirmer » et feraient doublon avec le programme, qui
 * porte déjà la séquence complète de la journée. Le premier horaire renseigné
 * fait apparaître la liste, sans toucher au composant.
 */
export const hasAnyScheduleTime = arenaInfo.schedule.some(
  (slot) => slot.time !== null,
);

/** Règles réellement définies. Vide ⇒ la section « À savoir » ne s'affiche pas. */
export const definedPracticalRules = arenaInfo.practicalRules.filter(
  (rule): rule is PracticalRule & { lines: string[] } =>
    rule.lines !== null && rule.lines.length > 0,
);

/** Catégories décernées par vote du public. */
export const publicVoteAwards = arenaInfo.awards.filter(
  (award) => award.publicVote,
);

/** « 15 € ». Le tarif vit en centimes, comme `arena_events.player_fee_cents`. */
export function formatFee(cents: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * Ligne « code postal + ville », au format postal français.
 * Retombe sur la seule ville si le code postal manque ; `null` si rien n'est connu.
 */
export function getPostalLine(info: ArenaInfo): string | null {
  const line = [info.postalCode, info.city].filter(Boolean).join(" ");
  return line || null;
}

/**
 * Lien d'itinéraire.
 *
 * Tant qu'aucune URL officielle n'est fournie, on construit une recherche Maps
 * à partir de l'adresse réelle — voie, code postal, ville, pays — précédée du
 * nom du gymnase pour que le résultat pointe sur l'équipement lui-même.
 * Chaque segment absent est simplement omis.
 */
export function getDirectionsUrl(info: ArenaInfo): string {
  if (info.mapsUrl) return info.mapsUrl;
  const query = [
    info.venueName,
    info.address,
    getPostalLine(info),
    info.country,
  ]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getWhatsappUrl(contact: WhatsappContact): string {
  return `https://wa.me/${contact.international}`;
}

export function getInstagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle}`;
}
