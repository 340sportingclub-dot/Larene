import type { FieldErrors } from "@/lib/arena/registration";

/**
 * États initiaux des formulaires d'inscription.
 *
 * Ils vivent ici, et pas dans `actions.ts` : un module « use server » ne peut
 * exporter que des fonctions asynchrones. Une constante exportée depuis un tel
 * module est transformée en référence serveur et arrive `undefined` côté client
 * — le formulaire plante alors au premier rendu.
 */

export type TeamFormState = {
  errors: FieldErrors;
  message: string | null;
  values: Record<string, string>;
};

export const emptyTeamFormState: TeamFormState = {
  errors: {},
  message: null,
  values: {},
};

export type RosterFormState = {
  errors: Record<number, FieldErrors>;
  message: string | null;
};

export const emptyRosterFormState: RosterFormState = {
  errors: {},
  message: null,
};
