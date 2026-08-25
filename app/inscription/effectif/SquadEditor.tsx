"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { saveRosterAction } from "@/app/inscription/actions";
import { emptyRosterFormState } from "@/app/inscription/form-state";
import { FormAlert, FormField, SubmitButton } from "@/components/arena/FormField";
import { TrashIcon } from "@/components/arena/icons";

export type ExistingPlayer = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
};

/**
 * Étape 3 — l'effectif.
 *
 * Une carte par joueur, numérotée. On ouvre sur le minimum réglementaire déjà
 * en place : le capitaine remplit, il n'a pas à comprendre d'abord combien de
 * lignes créer. « + Ajouter un joueur » disparaît une fois le maximum atteint,
 * plutôt que d'être présent et refusé.
 *
 * Le retrait n'est proposé qu'au-delà du minimum : on ne montre jamais un
 * bouton qui violerait le règlement.
 *
 * Les bornes viennent du serveur, qui les tient de `lib/arena/rules.ts`. Ce
 * composant n'en connaît aucune.
 */
export function SquadEditor({
  minPlayers,
  maxPlayers,
  squadLabel,
  existing,
}: {
  minPlayers: number;
  maxPlayers: number;
  squadLabel: string;
  existing: ExistingPlayer[];
}) {
  const [state, formAction] = useActionState(
    saveRosterAction,
    emptyRosterFormState,
  );

  const initial =
    existing.length > 0 ? existing : Array.from({ length: minPlayers }, blank);
  const [players, setPlayers] = useState<ExistingPlayer[]>(initial);

  const addPlayer = () => {
    setPlayers((current) =>
      current.length < maxPlayers ? [...current, blank()] : current,
    );
  };

  const removePlayer = (index: number) => {
    setPlayers((current) =>
      current.length > minPlayers
        ? current.filter((_, position) => position !== index)
        : current,
    );
  };

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && <FormAlert message={state.message} />}

      <p
        className="text-sm leading-relaxed text-arena-muted"
        aria-live="polite"
      >
        <span className="font-semibold text-arena-white">
          {players.length} joueur{players.length > 1 ? "s" : ""}
        </span>{" "}
        sur les {squadLabel} autorisés.
      </p>

      <ul className="space-y-3">
        {players.map((player, index) => {
          const rowErrors = state.errors[index] ?? {};
          const removable = players.length > minPlayers;

          return (
            <li
              key={index}
              className="rounded-xl border border-arena-line bg-arena-surface/70 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-lg uppercase leading-none text-arena-gold">
                  Joueur {String(index + 1).padStart(2, "0")}
                </h2>

                {removable && (
                  <button
                    type="button"
                    onClick={() => removePlayer(index)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-arena-line px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-arena-muted transition-colors hover:border-arena-ember hover:text-arena-ember"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Retirer
                    <span className="sr-only"> le joueur {index + 1}</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    name={`players[${index}].firstName`}
                    label="Prénom"
                    defaultValue={player.firstName}
                    error={rowErrors.firstName}
                  />
                  <FormField
                    name={`players[${index}].lastName`}
                    label="Nom"
                    defaultValue={player.lastName}
                    error={rowErrors.lastName}
                  />
                </div>

                <FormField
                  name={`players[${index}].dateOfBirth`}
                  label="Date de naissance"
                  type="date"
                  defaultValue={player.dateOfBirth}
                  error={rowErrors.dateOfBirth}
                />

                <FormField
                  name={`players[${index}].phone`}
                  label="Téléphone"
                  type="tel"
                  inputMode="tel"
                  placeholder="06 12 34 56 78"
                  defaultValue={player.phone}
                  error={rowErrors.phone}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {players.length < maxPlayers && (
        <button
          type="button"
          onClick={addPlayer}
          className="flex min-h-[52px] w-full items-center justify-center rounded-md border border-dashed border-arena-gold-dark px-4 text-xs font-bold uppercase tracking-[0.14em] text-arena-gold transition-colors hover:border-arena-gold hover:bg-arena-gold/5"
        >
          + Ajouter un joueur
        </button>
      )}

      <div aria-hidden="true" className="arena-rule !my-6" />

      <Submit />
    </form>
  );
}

function blank(): ExistingPlayer {
  return { firstName: "", lastName: "", dateOfBirth: "", phone: "" };
}

function Submit() {
  const { pending } = useFormStatus();
  return <SubmitButton pending={pending}>Valider mon effectif</SubmitButton>;
}
