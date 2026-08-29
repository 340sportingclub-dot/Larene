/**
 * État métier d'une édition de L'ARÈNE — SOURCE DE VÉRITÉ UNIQUE.
 *
 * Ce module est volontairement PUR : aucune requête, aucun accès au réseau,
 * aucune dépendance à Next. Il ne fait que dériver, à partir des colonnes déjà
 * présentes dans `arena_events`, les deux seules questions que le reste du code
 * se pose :
 *
 *   1. la date du tournoi est-elle connue et à venir ?   → `deriveScheduleState()`
 *   2. peut-on accepter une inscription maintenant ?      → `checkRegistrationGate()`
 *
 * POURQUOI CES DEUX AXES SONT SÉPARÉS
 * Un tournoi reporté reste un tournoi actif : sa date est à confirmer, mais
 * l'édition n'est ni terminée ni annulée. Inversement, les inscriptions peuvent
 * être fermées alors que la date est parfaitement connue. Confondre les deux
 * oblige à mentir sur l'un pour dire la vérité sur l'autre.
 *
 * AUCUNE MIGRATION N'EST NÉCESSAIRE
 * Les deux états s'expriment entièrement avec le schéma existant :
 *   * `registration_status` accepte déjà 'closed' | 'open' | 'paused' | 'full' ;
 *   * `event_status` accepte déjà 'draft' | 'registration' | 'draw' | 'live'
 *     | 'completed' | 'cancelled'.
 * Voir `arena_events_registration_status_check` et
 * `arena_events_event_status_check` dans la migration foundation.
 */

/** Valeurs autorisées par `arena_events_registration_status_check`. */
export const REGISTRATION_STATUSES = [
  "closed",
  "open",
  "paused",
  "full",
] as const;
export type ArenaRegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

/** Valeurs autorisées par `arena_events_event_status_check`. */
export const EVENT_STATUSES = [
  "draft",
  "registration",
  "draw",
  "live",
  "completed",
  "cancelled",
] as const;
export type ArenaEventStatus = (typeof EVENT_STATUSES)[number];

/**
 * Les statuts d'une édition encore « vivante ».
 *
 * C'est cette liste — et non la date — qui détermine quelle édition le site
 * doit afficher. Une édition reportée garde une date passée : la chercher par
 * sa date la ferait disparaître le lendemain de la date annulée.
 */
export const LIVE_EVENT_STATUSES: readonly ArenaEventStatus[] = [
  "draft",
  "registration",
  "draw",
  "live",
];

/**
 * Statuts d'équipe qui occupent une place dans le tournoi.
 *
 * `waitlist` est par définition au-delà du plafond ; `withdrawn` et
 * `disqualified` libèrent leur place.
 */
export const OCCUPYING_TEAM_STATUSES = ["draft", "pending", "confirmed"] as const;

/** Date du jour au format `YYYY-MM-DD`, comparable à `arena_events.event_date`. */
export function todayIsoDate(reference: Date = new Date()): string {
  // `event_date` est un DATE PostgreSQL sans fuseau. On compare donc deux
  // chaînes de même nature. L'écart UTC/Paris peut décaler la bascule de
  // quelques heures le jour même : sans conséquence ici, où la question posée
  // est « la date est-elle passée », pas « à quelle heure ».
  return reference.toISOString().slice(0, 10);
}

/**
 * État de la date du tournoi.
 *
 *   scheduled     — date connue et à venir : on peut l'afficher.
 *   date_pending  — l'édition est active mais sa date annoncée est passée sans
 *                   avoir eu lieu : elle est REPORTÉE, date à confirmer.
 *   finished      — l'édition a eu lieu.
 *   cancelled     — l'édition est annulée (à ne pas confondre avec un report).
 */
export type ArenaScheduleState =
  | "scheduled"
  | "date_pending"
  | "finished"
  | "cancelled";

export type ScheduleInput = {
  eventDate: string;
  eventStatus: string;
  registrationStatus: string;
};

/**
 * Dérive l'état de la date.
 *
 * `date_pending` se déduit de deux signaux, sans colonne supplémentaire :
 *
 *   * la date annoncée est passée alors que l'édition est encore active —
 *     c'est le cas d'un report constaté ; l'état se répare tout seul le jour où
 *     une nouvelle date future est saisie ;
 *   * OU les inscriptions sont en pause avant même la date annoncée — c'est le
 *     cas d'un report décidé à l'avance, comme aujourd'hui.
 *
 * LIMITE ASSUMÉE, ET DOCUMENTÉE
 * Le second signal fait porter deux sens à `registration_status = 'paused'` :
 * « intake suspendu » et « date à reconfirmer ». Tant qu'une pause n'est
 * décidée que pour un report, les deux coïncident. Pour les découpler
 * durablement il faudrait une colonne dédiée — c'est une migration, donc hors
 * de cette phase ; voir la recommandation HUB-02 § « tournoi reporté ».
 */
export function deriveScheduleState(
  event: ScheduleInput,
  today: string = todayIsoDate(),
): ArenaScheduleState {
  if (event.eventStatus === "cancelled") return "cancelled";
  if (event.eventStatus === "completed") return "finished";

  if (event.eventDate < today) return "date_pending";
  if (event.registrationStatus === "paused") return "date_pending";

  return "scheduled";
}

/** `true` quand la date affichable n'est pas fiable et ne doit pas être montrée. */
export function isDatePending(
  event: ScheduleInput,
  today: string = todayIsoDate(),
): boolean {
  return deriveScheduleState(event, today) === "date_pending";
}

// ---------------------------------------------------------------------------
// Ouverture des inscriptions
// ---------------------------------------------------------------------------

export type RegistrationRefusal =
  | "event_not_open"
  | "registration_closed"
  | "registration_paused"
  | "registration_full"
  | "capacity_reached";

export type RegistrationGate =
  | { open: true }
  | { open: false; reason: RegistrationRefusal; message: string };

export type RegistrationGateInput = ScheduleInput & {
  maxTeams: number | null;
  /** Équipes occupant déjà une place. `null` si le compte n'a pas pu être fait. */
  teamCount: number | null;
};

/**
 * Décide si une inscription peut être acceptée MAINTENANT.
 *
 * Cette fonction est la garde métier ; elle doit être appelée côté serveur
 * avant toute écriture, et pas seulement pour décider ce qu'affiche une page.
 * Un contrôle d'interface ne ferme rien : une Server Action est un point
 * d'appel réel, atteignable sans passer par l'écran qui la précède.
 *
 * Les messages sont destinés au capitaine : ils disent ce qui se passe et quoi
 * faire, jamais pourquoi techniquement.
 */
export function checkRegistrationGate(
  event: RegistrationGateInput,
): RegistrationGate {
  if (event.eventStatus === "cancelled") {
    return {
      open: false,
      reason: "event_not_open",
      message: "Cette édition est annulée. Les inscriptions sont closes.",
    };
  }

  if (event.eventStatus === "completed") {
    return {
      open: false,
      reason: "event_not_open",
      message: "Cette édition est terminée. Les inscriptions sont closes.",
    };
  }

  if (event.eventStatus === "draft") {
    return {
      open: false,
      reason: "event_not_open",
      message:
        "Les inscriptions ne sont pas encore ouvertes. Écrivez-nous sur WhatsApp, nous vous préviendrons dès l’ouverture.",
    };
  }

  switch (event.registrationStatus) {
    case "open":
      break;
    case "paused":
      return {
        open: false,
        reason: "registration_paused",
        message:
          "Les inscriptions sont momentanément en pause, le temps de confirmer la nouvelle date du tournoi. Écrivez-nous sur WhatsApp : nous vous préviendrons dès leur réouverture.",
      };
    case "full":
      return {
        open: false,
        reason: "registration_full",
        message:
          "Le tournoi est complet. Écrivez-nous sur WhatsApp pour être placé sur la liste d’attente.",
      };
    default:
      return {
        open: false,
        reason: "registration_closed",
        message:
          "Les inscriptions sont fermées. Écrivez-nous sur WhatsApp, nous vous dirons si une place se libère.",
      };
  }

  // Le plafond n'est vérifié que s'il est défini ET que le compte a abouti.
  // Un comptage en échec ne doit pas fermer les inscriptions en silence : il
  // remonte ailleurs, il ne se déguise pas ici en « tournoi complet ».
  if (event.maxTeams !== null && event.teamCount !== null) {
    if (event.teamCount >= event.maxTeams) {
      return {
        open: false,
        reason: "capacity_reached",
        message:
          "Le tournoi affiche complet. Écrivez-nous sur WhatsApp pour être placé sur la liste d’attente.",
      };
    }
  }

  return { open: true };
}
