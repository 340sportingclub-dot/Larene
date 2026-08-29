import "server-only";

import {
  checkRegistrationGate,
  LIVE_EVENT_STATUSES,
  OCCUPYING_TEAM_STATUSES,
  type RegistrationGate,
} from "@/lib/arena/event-state";
import { checkSquadSize, SQUAD_RULES, SQUAD_SIZE_LABEL } from "@/lib/arena/rules";
import { getAdminClient, requireAdminClient } from "@/lib/supabase-admin";
import type { ArenaPaymentProvider } from "@/lib/database.types";

/**
 * Écritures du parcours d'inscription — SERVEUR UNIQUEMENT.
 *
 * Toutes les règles d'effectif viennent de `lib/arena/rules.ts` : ce module ne
 * redéfinit ni les bornes 7–9, ni le verrou, ni le tarif. Il les applique.
 *
 * Chaque fonction suppose que l'appelant a déjà vérifié la session — session
 * capitaine pour son équipe, session staff pour les opérations. Le client
 * `service_role` ne connaît aucune limite.
 */

// ---------------------------------------------------------------------------
// Validation des saisies
// ---------------------------------------------------------------------------

export type FieldErrors = Record<string, string>;

/** Réduit un numéro à ses chiffres, en conservant un éventuel préfixe +33. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim().replace(/[\s.\-()]/g, "");
  if (trimmed.startsWith("+33")) return `0${trimmed.slice(3)}`;
  if (trimmed.startsWith("0033")) return `0${trimmed.slice(4)}`;
  return trimmed;
}

/** Numéro français à 10 chiffres commençant par 0. */
export function isValidPhone(raw: string): boolean {
  return /^0[1-9]\d{8}$/.test(normalizePhone(raw));
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
}

/** Âge révolu à une date donnée. */
export function ageAt(birthDate: string, reference: Date): number {
  const birth = new Date(birthDate);
  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function isValidDate(raw: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const date = new Date(raw);
  return !Number.isNaN(date.getTime()) && date.getFullYear() >= 1900;
}

// ---------------------------------------------------------------------------
// L'événement en cours
// ---------------------------------------------------------------------------

export type ActiveEvent = {
  id: string;
  name: string;
  eventDate: string;
  registrationStatus: string;
  eventStatus: string;
  playerFeeCents: number;
  currency: string;
  minimumAge: number;
  minPlayers: number;
  maxPlayers: number;
  maxTeams: number | null;
};

/** Colonnes lues par `getActiveEvent()`. */
export const ACTIVE_EVENT_COLUMNS =
  "id, name, event_date, registration_status, event_status, player_fee_cents, currency, minimum_age, min_players_per_team, max_players_per_team, max_teams";

/**
 * L'édition en cours.
 *
 * ON NE CHERCHE PLUS PAR LA DATE, ET C'EST DÉLIBÉRÉ. Le critère précédent —
 * « la première édition dont `event_date` est à venir » — fait disparaître
 * l'édition du site le lendemain de sa date. Pour un tournoi REPORTÉ, dont la
 * date annoncée est passée sans qu'il ait eu lieu, cela vidait d'un coup la
 * page d'inscription, l'espace capitaine et le tarif affiché : le parcours
 * entier retombait sur « Bientôt en ligne » sans qu'aucune donnée ait changé.
 *
 * Le critère juste est le STATUT : on retient l'édition encore vivante — ni
 * terminée ni annulée — la plus récente. Une édition reportée le reste, une
 * édition close disparaît, et l'édition suivante prend la main dès qu'elle est
 * créée avec une date postérieure.
 *
 * LIMITE CONNUE — À RENFORCER AVANT DE GÉRER PLUSIEURS ÉDITIONS
 * « La plus récente parmi les vivantes » est exact tant qu'il n'y a qu'une
 * édition vivante à la fois, ce qui est le cas aujourd'hui. Le jour où deux
 * coexistent, ce critère devient ambigu — et il choisit mal dans au moins un
 * cas prévisible : une édition `draft` préparée pour l'an prochain porte une
 * date postérieure à l'édition ouverte aux inscriptions, et lui prendrait la
 * main.
 *
 * Ce qu'il faudra alors : une notion explicite d'édition COURANTE, portée par
 * la donnée et non déduite d'un tri — un drapeau unique, ou une sélection par
 * `event_status` ordonné du plus engagé au moins engagé. C'est un choix de
 * modèle, pas un ajustement de requête, et il se fait avec le cas d'usage réel
 * sous les yeux.
 */
export async function getActiveEvent(): Promise<ActiveEvent | null> {
  // Pas de configuration serveur = pas d'édition connue. Les pages doivent
  // afficher un état clair, pas une erreur 500.
  const admin = getAdminClient();
  if (!admin) {
    // Ne jamais échouer en silence : sans cette trace, une variable
    // d'environnement absente est indiscernable d'une base vide.
    console.error(
      "[arena] getActiveEvent : client service_role indisponible — NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante côté serveur.",
    );
    return null;
  }

  const { data, error } = await admin
    .from("arena_events")
    .select(ACTIVE_EVENT_COLUMNS)
    .in("event_status", [...LIVE_EVENT_STATUSES])
    .order("event_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Le code et le message PostgREST ne contiennent aucun secret, et ils
    // disent exactement ce qui bloque : privilège, colonne, clé invalide.
    console.error(
      `[arena] getActiveEvent : requête refusée — code=${error.code} message=${error.message} details=${error.details ?? "—"} hint=${error.hint ?? "—"}`,
    );
    return null;
  }

  if (!data) {
    console.error(
      "[arena] getActiveEvent : aucune édition vivante — aucune ligne arena_events dont event_status soit draft, registration, draw ou live.",
    );
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    eventDate: data.event_date,
    registrationStatus: data.registration_status,
    eventStatus: data.event_status,
    playerFeeCents: data.player_fee_cents,
    currency: data.currency,
    minimumAge: data.minimum_age,
    minPlayers: data.min_players_per_team,
    maxPlayers: data.max_players_per_team,
    maxTeams: data.max_teams,
  };
}

/**
 * Nombre d'équipes occupant une place dans l'édition.
 *
 * Retourne `null` si le comptage échoue : l'appelant doit alors s'abstenir de
 * conclure. Un comptage raté n'est pas « zéro équipe », et ne doit pas non plus
 * se transformer en « tournoi complet ».
 */
export async function countOccupyingTeams(
  eventId: string,
): Promise<number | null> {
  const admin = getAdminClient();
  if (!admin) return null;

  const { count, error } = await admin
    .from("arena_teams")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .in("status", [...OCCUPYING_TEAM_STATUSES]);

  if (error) {
    console.error(
      `[arena] countOccupyingTeams : comptage refusé — code=${error.code} message=${error.message}`,
    );
    return null;
  }

  return count ?? null;
}

/**
 * L'état d'ouverture des inscriptions, tel qu'il fait foi.
 *
 * Une page peut l'appeler pour décider quoi afficher, mais c'est bien le
 * serveur qui doit l'appeler AVANT d'écrire : `createTeam()` le refait de son
 * côté, sans faire confiance à ce qui a été affiché.
 */
export async function getRegistrationGate(
  event: ActiveEvent,
): Promise<RegistrationGate> {
  const teamCount =
    event.maxTeams === null ? null : await countOccupyingTeams(event.id);

  return checkRegistrationGate({
    eventDate: event.eventDate,
    eventStatus: event.eventStatus,
    registrationStatus: event.registrationStatus,
    maxTeams: event.maxTeams,
    teamCount,
  });
}

// ---------------------------------------------------------------------------
// Création de l'équipe
// ---------------------------------------------------------------------------

export type CaptainInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  teamName: string;
  city: string;
};

export function validateCaptainInput(input: CaptainInput): FieldErrors {
  const errors: FieldErrors = {};

  if (input.firstName.trim().length < 2) {
    errors.firstName = "Indiquez le prénom du capitaine.";
  }
  if (input.lastName.trim().length < 2) {
    errors.lastName = "Indiquez le nom du capitaine.";
  }
  if (!isValidPhone(input.phone)) {
    errors.phone = "Numéro invalide. Attendu : 10 chiffres, par exemple 06 12 34 56 78.";
  }
  if (input.email.trim() && !isValidEmail(input.email)) {
    errors.email = "Adresse e-mail invalide.";
  }
  if (input.teamName.trim().length < 2) {
    errors.teamName = "Donnez un nom à votre équipe.";
  }
  if (input.teamName.trim().length > 40) {
    errors.teamName = "Nom trop long : 40 caractères au maximum.";
  }
  if (input.city.trim().length < 2) {
    errors.city = "Indiquez votre ville.";
  }

  return errors;
}

export type CreateTeamResult =
  | { ok: true; teamId: string }
  | { ok: false; errors: FieldErrors; message?: string };

export async function createTeam(
  input: CaptainInput,
): Promise<CreateTeamResult> {
  const errors = validateCaptainInput(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const event = await getActiveEvent();
  if (!event) {
    return {
      ok: false,
      errors: {},
      message: "Aucune édition n’est ouverte à l’inscription pour le moment.",
    };
  }

  // GARDE MÉTIER — elle est ici, pas dans la page.
  //
  // `/inscription` n'affiche le formulaire que si les inscriptions sont
  // ouvertes, mais cette action reste appelable directement : une Server Action
  // est un point d'entrée HTTP à part entière. Sans cette revérification,
  // passer `registration_status` à 'paused' ou 'closed' fermerait l'écran sans
  // fermer l'écriture, et `max_teams` ne serait jamais opposé à personne.
  const gate = await getRegistrationGate(event);
  if (!gate.open) {
    return { ok: false, errors: {}, message: gate.message };
  }

  const admin = requireAdminClient();

  const { data, error } = await admin
    .from("arena_teams")
    .insert({
      event_id: event.id,
      name: input.teamName.trim(),
      city: input.city.trim(),
      captain_first_name: input.firstName.trim(),
      captain_last_name: input.lastName.trim(),
      captain_phone: normalizePhone(input.phone),
      captain_email: input.email.trim() || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    // Index unique sur (event_id, lower(name)) : le message doit être utile,
    // pas technique.
    if (error.code === "23505") {
      return {
        ok: false,
        errors: { teamName: "Ce nom d’équipe est déjà pris. Choisissez-en un autre." },
      };
    }
    return {
      ok: false,
      errors: {},
      message: "L’inscription n’a pas pu être enregistrée. Réessayez dans un instant.",
    };
  }

  return { ok: true, teamId: data.id };
}

// ---------------------------------------------------------------------------
// Effectif
// ---------------------------------------------------------------------------

export type PlayerInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
};

export type RosterValidation = {
  errors: Record<number, FieldErrors>;
  message: string | null;
};

/**
 * Valide un effectif complet.
 *
 * Le nombre de joueurs passe par `checkSquadSize()` : la borne 7–9 n'est écrite
 * qu'à un seul endroit du projet.
 */
export function validateRoster(
  players: PlayerInput[],
  event: Pick<ActiveEvent, "minimumAge" | "eventDate">,
): RosterValidation {
  const errors: Record<number, FieldErrors> = {};
  const eventDate = new Date(event.eventDate);
  const seenPhones = new Map<string, number>();

  players.forEach((player, index) => {
    const rowErrors: FieldErrors = {};

    if (player.firstName.trim().length < 2) {
      rowErrors.firstName = "Prénom manquant.";
    }
    if (player.lastName.trim().length < 2) {
      rowErrors.lastName = "Nom manquant.";
    }

    if (!isValidDate(player.dateOfBirth)) {
      rowErrors.dateOfBirth = "Date de naissance manquante ou invalide.";
    } else if (ageAt(player.dateOfBirth, eventDate) < event.minimumAge) {
      rowErrors.dateOfBirth = `Le tournoi est réservé aux ${event.minimumAge} ans et plus le jour de la compétition.`;
    }

    if (!isValidPhone(player.phone)) {
      rowErrors.phone = "Numéro invalide. Attendu : 10 chiffres.";
    } else {
      // Le téléphone sert à transmettre le paiement individuel : deux joueurs
      // ne peuvent pas partager le même numéro.
      const normalized = normalizePhone(player.phone);
      const firstIndex = seenPhones.get(normalized);
      if (firstIndex !== undefined) {
        rowErrors.phone = `Ce numéro est déjà utilisé par le joueur ${firstIndex + 1}.`;
      } else {
        seenPhones.set(normalized, index);
      }
    }

    if (Object.keys(rowErrors).length > 0) errors[index] = rowErrors;
  });

  const squad = checkSquadSize(players.length);

  return {
    errors,
    message: squad.valid
      ? Object.keys(errors).length > 0
        ? "Certains joueurs sont incomplets. Corrigez les champs signalés."
        : null
      : squad.message,
  };
}

export type SaveRosterResult =
  | { ok: true; playerCount: number }
  | { ok: false; errors: Record<number, FieldErrors>; message: string };

/**
 * Remplace l'effectif d'une équipe.
 *
 * Refuse toute écriture si l'effectif est verrouillé : le verrou est un état
 * persistant, pas une simple indication visuelle.
 */
export async function saveRoster(
  teamId: string,
  players: PlayerInput[],
): Promise<SaveRosterResult> {
  const admin = requireAdminClient();

  const { data: team, error: teamError } = await admin
    .from("arena_teams")
    .select("id, event_id, roster_locked_at")
    .eq("id", teamId)
    .maybeSingle();

  if (teamError || !team) {
    return { ok: false, errors: {}, message: "Équipe introuvable." };
  }

  if (team.roster_locked_at) {
    return {
      ok: false,
      errors: {},
      message:
        "Votre effectif est verrouillé depuis le coup d’envoi de votre premier match. Adressez-vous à l’organisation.",
    };
  }

  const event = await getActiveEvent();
  if (!event) {
    return { ok: false, errors: {}, message: "Édition introuvable." };
  }

  const validation = validateRoster(players, event);
  if (validation.message || Object.keys(validation.errors).length > 0) {
    return {
      ok: false,
      errors: validation.errors,
      message: validation.message ?? "Corrigez les champs signalés.",
    };
  }

  // Remplacement intégral : plus simple et plus sûr qu'une réconciliation
  // ligne à ligne tant qu'aucun événement de match n'est rattaché aux joueurs.
  // Le verrou ci-dessus garantit qu'aucun match n'a commencé.
  const { error: deleteError } = await admin
    .from("arena_players")
    .delete()
    .eq("team_id", teamId);

  if (deleteError) {
    return { ok: false, errors: {}, message: "Mise à jour impossible. Réessayez." };
  }

  const { data: inserted, error: insertError } = await admin
    .from("arena_players")
    .insert(
      players.map((player) => ({
        team_id: teamId,
        first_name: player.firstName.trim(),
        last_name: player.lastName.trim(),
        date_of_birth: player.dateOfBirth,
        phone: normalizePhone(player.phone),
        status: "confirmed" as const,
      })),
    )
    .select("id");

  if (insertError || !inserted) {
    return { ok: false, errors: {}, message: "Enregistrement impossible. Réessayez." };
  }

  // Un paiement en attente par joueur : c'est ce qui rend « 6 / 8 réglés »
  // lisible dès l'inscription, sans traitement différé.
  await admin.from("arena_player_payments").insert(
    inserted.map((player) => ({
      player_id: player.id,
      amount_cents: event.playerFeeCents,
      currency: event.currency,
      status: "pending" as const,
    })),
  );

  await admin
    .from("arena_teams")
    .update({ status: "pending", confirmed_at: new Date().toISOString() })
    .eq("id", teamId);

  return { ok: true, playerCount: inserted.length };
}

// ---------------------------------------------------------------------------
// Lecture — vue d'ensemble d'une équipe
// ---------------------------------------------------------------------------

export type TeamPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  phone: string;
  attendance: "unknown" | "present" | "absent";
  paid: boolean;
  amountCents: number | null;
  provider: ArenaPaymentProvider | null;
};

export type TeamOverview = {
  id: string;
  name: string;
  city: string | null;
  status: string;
  captainName: string;
  captainPhone: string;
  rosterLocked: boolean;
  checkedIn: boolean;
  players: TeamPlayer[];
  paidCount: number;
  feeCents: number;
  currency: string;
};

export async function getTeamOverview(
  teamId: string,
): Promise<TeamOverview | null> {
  const admin = getAdminClient();
  if (!admin) return null;

  const { data: team, error } = await admin
    .from("arena_teams")
    .select(
      "id, name, city, status, captain_first_name, captain_last_name, captain_phone, roster_locked_at, checked_in_at",
    )
    .eq("id", teamId)
    .maybeSingle();

  if (error || !team) return null;

  const { data: players } = await admin
    .from("arena_players")
    .select(
      "id, first_name, last_name, date_of_birth, phone, attendance, arena_player_payments(status, amount_cents, payment_provider)",
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  const event = await getActiveEvent();

  const rows: TeamPlayer[] = (players ?? []).map((player) => {
    const payments = (player.arena_player_payments ?? []) as {
      status: string;
      amount_cents: number;
      payment_provider: ArenaPaymentProvider | null;
    }[];
    const settled = payments.find((payment) => payment.status === "paid");

    return {
      id: player.id,
      firstName: player.first_name,
      lastName: player.last_name,
      dateOfBirth: player.date_of_birth,
      phone: player.phone,
      attendance: player.attendance,
      paid: Boolean(settled),
      amountCents: settled?.amount_cents ?? payments[0]?.amount_cents ?? null,
      provider: settled?.payment_provider ?? null,
    };
  });

  return {
    id: team.id,
    name: team.name,
    city: team.city,
    status: team.status,
    captainName: `${team.captain_first_name} ${team.captain_last_name}`,
    captainPhone: team.captain_phone,
    rosterLocked: Boolean(team.roster_locked_at),
    checkedIn: Boolean(team.checked_in_at),
    players: rows,
    paidCount: rows.filter((player) => player.paid).length,
    feeCents: event?.playerFeeCents ?? 0,
    currency: event?.currency ?? "EUR",
  };
}

/** « 7 à 9 joueurs » — repris du règlement, jamais réécrit. */
export const ROSTER_HINT = SQUAD_SIZE_LABEL;
export const ROSTER_MIN = SQUAD_RULES.minPlayers;
export const ROSTER_MAX = SQUAD_RULES.maxPlayers;
