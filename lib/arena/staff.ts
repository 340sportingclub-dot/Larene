/**
 * Rôles opérationnels d'Arena Control — SOURCE DE VÉRITÉ UNIQUE.
 *
 * Cette édition ne crée pas de comptes nominatifs : chaque FONCTION dispose d'un
 * code partagé, et chaque fonction voit et modifie uniquement ce dont elle a
 * besoin. Un code compromis se change en une variable d'environnement, sans
 * migration ni redéploiement de schéma.
 *
 * AJOUTER UN RÔLE PLUS TARD
 * Une seule entrée dans `STAFF_ROLES` suffit : la liste des permissions, l'écran
 * de connexion, les gardes de route et la navigation d'Arena Control en sont
 * tous dérivés. Aucun composant n'énumère les rôles à la main.
 *
 * Ce module ne contient AUCUN secret : il décrit les rôles et leurs droits, pas
 * les codes. Les codes vivent uniquement côté serveur (`staff-session.ts`).
 */

/**
 * Permissions élémentaires.
 *
 * Elles décrivent des CAPACITÉS, pas des écrans : un même écran peut en exiger
 * plusieurs, et un rôle peut recevoir une capacité sans qu'un écran ne l'expose
 * encore. C'est ce qui permet d'ajouter des fonctions sans redistribuer les
 * droits.
 */
export type StaffPermission =
  /** Voir la liste des équipes, leurs effectifs et leurs coordonnées. */
  | "teams:read"
  /** Corriger une équipe ou un effectif à la place du capitaine. */
  | "teams:write"
  /** Voir l'état des paiements, joueur par joueur. */
  | "payments:read"
  /** Constater un règlement : montant, moyen, date. */
  | "payments:write"
  /** Voir l'état de présence des équipes et des joueurs. */
  | "checkin:read"
  /** Pointer une équipe ou un joueur le jour J. */
  | "checkin:write"
  /** Consulter le calendrier, les feuilles de match et les compositions. */
  | "matches:read"
  /** Saisir scores, chronomètre et déroulé : la table de marque. */
  | "matches:write"
  /** Saisir cartons, fautes cumulées, Power Play, challenges vidéo. */
  | "discipline:write"
  /** Voir et servir les commandes de buvette. */
  | "concessions:read"
  | "concessions:write"
  /** Verrouiller un effectif, révoquer un accès, tout ce qui est irréversible. */
  | "operations:admin";

export type StaffRoleId =
  | "direction"
  | "score_table"
  | "welcome_desk"
  | "referee"
  | "concessions";

export type StaffRole = {
  id: StaffRoleId;
  /** Nom affiché sur l'écran de connexion et dans l'en-tête d'Arena Control. */
  label: string;
  /** Une phrase : à quoi sert ce rôle le jour du tournoi. */
  description: string;
  permissions: StaffPermission[];
  /** Nom de la variable d'environnement portant le code de cette fonction. */
  codeEnvVar: string;
  /** Écran d'accueil du rôle après connexion. */
  landingPath: string;
};

/**
 * Les cinq fonctions de cette édition.
 *
 * `direction` reçoit explicitement toutes les permissions plutôt qu'un
 * traitement spécial dans le code : un rôle « qui a tout » reste un rôle
 * ordinaire, et la vérification de droit n'a jamais de cas particulier.
 */
export const STAFF_ROLES: StaffRole[] = [
  {
    id: "direction",
    label: "Direction",
    description: "Accès complet à Arena Control.",
    codeEnvVar: "ARENA_STAFF_CODE_DIRECTION",
    landingPath: "/control",
    permissions: [
      "teams:read",
      "teams:write",
      "payments:read",
      "payments:write",
      "checkin:read",
      "checkin:write",
      "matches:read",
      "matches:write",
      "discipline:write",
      "concessions:read",
      "concessions:write",
      "operations:admin",
    ],
  },
  {
    id: "welcome_desk",
    label: "Accueil & inscriptions",
    description:
      "Équipes, effectifs, paiements et pointage des présences à l’accueil.",
    codeEnvVar: "ARENA_STAFF_CODE_ACCUEIL",
    landingPath: "/control/equipes",
    permissions: [
      "teams:read",
      "teams:write",
      "payments:read",
      "payments:write",
      "checkin:read",
      "checkin:write",
    ],
  },
  {
    id: "score_table",
    label: "Table de marque",
    description:
      "Scores, chronomètre, fautes cumulées, cartons, Power Play et challenges vidéo.",
    codeEnvVar: "ARENA_STAFF_CODE_TABLE",
    landingPath: "/control/matchs",
    permissions: [
      "teams:read",
      "matches:read",
      "matches:write",
      "discipline:write",
      "checkin:read",
    ],
  },
  {
    id: "referee",
    label: "Arbitre & délégué terrain",
    description:
      "Feuille de match, effectifs éligibles, sanctions et fautes du terrain.",
    codeEnvVar: "ARENA_STAFF_CODE_ARBITRE",
    landingPath: "/control/matchs",
    permissions: [
      "teams:read",
      "matches:read",
      "discipline:write",
      "checkin:read",
    ],
  },
  {
    id: "concessions",
    label: "Buvette",
    description: "Commandes de buvette et restauration.",
    codeEnvVar: "ARENA_STAFF_CODE_BUVETTE",
    landingPath: "/control/buvette",
    permissions: ["concessions:read", "concessions:write"],
  },
];

const ROLES_BY_ID = new Map(STAFF_ROLES.map((role) => [role.id, role]));

export function getStaffRole(id: StaffRoleId): StaffRole {
  const role = ROLES_BY_ID.get(id);
  if (!role) throw new Error(`Rôle staff inconnu : ${id}`);
  return role;
}

export function isStaffRoleId(value: string): value is StaffRoleId {
  return ROLES_BY_ID.has(value as StaffRoleId);
}

/** `true` si le rôle porte la permission demandée. */
export function roleHasPermission(
  role: StaffRole | null,
  permission: StaffPermission,
): boolean {
  return role?.permissions.includes(permission) ?? false;
}

/** `true` si le rôle porte AU MOINS une des permissions demandées. */
export function roleHasAnyPermission(
  role: StaffRole | null,
  permissions: StaffPermission[],
): boolean {
  return permissions.some((permission) => roleHasPermission(role, permission));
}

/**
 * Rubriques d'Arena Control, filtrées par ce que le rôle peut réellement faire.
 * La navigation est donc une conséquence des permissions, jamais une liste
 * parallèle qu'il faudrait maintenir en écho.
 */
export type ControlSection = {
  href: string;
  label: string;
  /** Le rôle voit la rubrique s'il porte au moins une de ces permissions. */
  requires: StaffPermission[];
};

export const CONTROL_SECTIONS: ControlSection[] = [
  { href: "/control", label: "Tableau de bord", requires: ["teams:read", "concessions:read"] },
  { href: "/control/equipes", label: "Équipes", requires: ["teams:read"] },
  { href: "/control/paiements", label: "Paiements", requires: ["payments:read"] },
  { href: "/control/checkin", label: "Check-in", requires: ["checkin:read"] },
  { href: "/control/matchs", label: "Matchs", requires: ["matches:read"] },
  { href: "/control/buvette", label: "Buvette", requires: ["concessions:read"] },
];

export function getVisibleSections(role: StaffRole | null): ControlSection[] {
  return CONTROL_SECTIONS.filter((section) =>
    roleHasAnyPermission(role, section.requires),
  );
}
