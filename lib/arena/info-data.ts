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

/** Un moment de la journée. `time` reste `null` tant que l'heure n'est pas arrêtée. */
export type ScheduleSlot = {
  id: string;
  label: string;
  /** Heure déjà formatée, ex. « 08:30 ». `null` = à confirmer. */
  time: string | null;
  /** Repris dans la carte « Date & horaires » en plus de la timeline. */
  keyMilestone?: boolean;
  description?: string | null;
};

/** Règle pratique. `value === null` ⇒ la ligne n'est pas affichée du tout. */
export type PracticalRule = {
  id: string;
  label: string;
  value: string | null;
};

export type AwardCategory = {
  id: string;
  label: string;
  /** Décerné par vote du public avant la finale. */
  publicVote: boolean;
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
  /** Adresse postale exacte — inconnue à ce jour, donc `null`. */
  address: string | null;
  city: string | null;
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

export const arenaInfo: ArenaInfo = {
  dateLabel: demoEvent.dateLabel,
  singleDay: true,

  venueName: demoEvent.venueName,
  // Aucune adresse postale exacte n'est connue : ne rien inventer.
  address: null,
  city: demoEvent.city,
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
    squadSizeNote: "Effectif variable selon les inscriptions",
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
   * Déroulé de la journée. Tous les horaires restent à confirmer : la timeline
   * affiche l'ordre des moments, jamais une heure inventée.
   */
  schedule: [
    { id: "doors", label: "Ouverture du gymnase", time: null, keyMilestone: true },
    { id: "welcome", label: "Accueil des équipes", time: null, keyMilestone: true },
    { id: "first-match", label: "Premier match", time: null, keyMilestone: true },
    { id: "group-stage", label: "Phase de poules", time: null },
    { id: "break", label: "Pause", time: null },
    { id: "knockout", label: "Phases finales", time: null, keyMilestone: true },
    { id: "penalty", label: "Concours de penalties", time: null },
    {
      id: "vote",
      label: "Votes MVP & meilleur gardien",
      time: null,
      description: "Fenêtre de vote du public, avant la finale",
    },
    { id: "final", label: "Finale", time: null, keyMilestone: true },
  ],

  /**
   * Règles pratiques. Aucune n'est arrêtée à ce jour : toutes valent `null`,
   * la section entière reste donc masquée. Renseigner une valeur suffit à la
   * faire apparaître.
   */
  practicalRules: [
    { id: "shoes", label: "Chaussures", value: null },
    { id: "changing-rooms", label: "Vestiaires", value: null },
    { id: "arrival", label: "Heure d’arrivée", value: null },
    { id: "conduct", label: "Comportement", value: null },
    { id: "equipment", label: "Matériel personnel", value: null },
  ],

  awards: [
    { id: "buteur", label: "Meilleur buteur", publicVote: false },
    { id: "passeur", label: "Meilleur passeur", publicVote: false },
    { id: "mvp", label: "MVP du tournoi", publicVote: true },
    { id: "gardien", label: "Meilleur gardien", publicVote: true },
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
  (rule): rule is PracticalRule & { value: string } => rule.value !== null,
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
 * Lien d'itinéraire.
 *
 * Tant qu'aucune URL officielle n'est fournie, on retombe sur une **recherche**
 * Maps construite depuis le nom du lieu et la ville — les deux sont des données
 * réelles. Aucune adresse n'est inventée : c'est une requête, pas une position.
 */
export function getDirectionsUrl(info: ArenaInfo): string {
  if (info.mapsUrl) return info.mapsUrl;
  const query = [info.venueName, info.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getWhatsappUrl(contact: WhatsappContact): string {
  return `https://wa.me/${contact.international}`;
}

export function getInstagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle}`;
}
