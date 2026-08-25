"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { FormAlert, FormField, SubmitButton } from "@/components/arena/FormField";
import { createTeamAction } from "@/app/inscription/actions";
import { emptyTeamFormState } from "@/app/inscription/form-state";

/**
 * Étape 2 — capitaine et équipe.
 *
 * Six champs, dont un seul facultatif. Les valeurs saisies sont renvoyées avec
 * les erreurs : personne ne retape son numéro parce qu'un autre champ était
 * mal rempli.
 */
export function TeamForm() {
  const [state, formAction] = useActionState(createTeamAction, emptyTeamFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && <FormAlert message={state.message} />}

      <fieldset className="space-y-4 border-0 p-0">
        <legend className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold">
          Le capitaine
        </legend>

        <FormField
          name="firstName"
          label="Prénom"
          autoComplete="given-name"
          defaultValue={state.values.firstName}
          error={state.errors.firstName}
          required
        />
        <FormField
          name="lastName"
          label="Nom"
          autoComplete="family-name"
          defaultValue={state.values.lastName}
          error={state.errors.lastName}
          required
        />
        <FormField
          name="phone"
          label="Téléphone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          defaultValue={state.values.phone}
          error={state.errors.phone}
          hint="C’est par là que nous vous enverrons le lien de votre espace."
          required
        />
        <FormField
          name="email"
          label="E-mail (facultatif)"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state.values.email}
          error={state.errors.email}
        />
      </fieldset>

      <div aria-hidden="true" className="arena-rule" />

      <fieldset className="space-y-4 border-0 p-0">
        <legend className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold">
          L’équipe
        </legend>

        <FormField
          name="teamName"
          label="Nom de l’équipe"
          placeholder="TITANS"
          maxLength={40}
          defaultValue={state.values.teamName}
          error={state.errors.teamName}
          required
        />
        <FormField
          name="city"
          label="Ville"
          autoComplete="address-level2"
          defaultValue={state.values.city}
          error={state.errors.city}
          required
        />
      </fieldset>

      <Submit />

      <p className="text-center text-xs leading-relaxed text-arena-muted">
        Vous ajouterez vos joueurs juste après.
      </p>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>Créer mon équipe</SubmitButton>;
}
