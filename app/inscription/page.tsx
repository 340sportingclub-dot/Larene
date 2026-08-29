import type { Metadata } from "next";

import { InvitationCard } from "@/components/arena/InvitationCard";
import {
  arenaInfo,
  formatFee,
  getPostalLine,
  getWhatsappUrl,
} from "@/lib/arena/info-data";
import { isDatePending } from "@/lib/arena/event-state";
import { getActiveEvent, getRegistrationGate } from "@/lib/arena/registration";
import { SQUAD_SIZE_LABEL } from "@/lib/arena/rules";
import { isAdminConfigured } from "@/lib/supabase-admin";

// La date n'est pas écrite ici : elle change, et une métadonnée périmée se
// retrouve dans les aperçus de partage longtemps après la correction.
export const metadata: Metadata = {
  title: "Inscrire mon équipe — L’ARÈNE",
  description:
    "Votre convocation pour L’ARÈNE, au gymnase de Villeneuve-la-Guyard.",
};

/** Ce qu'on affiche à la place d'une date qui n'est pas encore fixée. */
const DATE_PENDING_LABEL = "Nouvelle date prochainement";

/** Le parcours dépend de l'état réel des inscriptions : rien n'est mis en cache. */
export const dynamic = "force-dynamic";

/**
 * Étape 1 du parcours — la convocation.
 *
 * On ne pose pas un formulaire sur une page : on remet une convocation. Le
 * capitaine décide d'entrer, puis saisit. Le formulaire vient après.
 */
export default async function Page() {
  const event = isAdminConfigured ? await getActiveEvent() : null;

  // L'ouverture est décidée par la même garde que celle qui protège l'écriture,
  // et non par une relecture indépendante de `registration_status` : deux
  // lectures divergentes finiraient par se contredire.
  const gate = event ? await getRegistrationGate(event) : null;
  const datePending = event ? isDatePending(event) : false;

  // Tant que le service n'est pas relié à sa base, on ne promet pas un parcours
  // qui échouerait au premier clic : on renvoie vers un contact humain.
  if (!event) {
    return (
      <Notice
        title="Bientôt en ligne"
        body="Le formulaire d’inscription ouvre très prochainement. En attendant, écrivez-nous sur WhatsApp : nous réservons votre place immédiatement."
      />
    );
  }

  // Inscriptions fermées, en pause ou complètes : on le dit tout de suite, au
  // lieu de laisser le capitaine remplir un formulaire qui sera refusé au bout.
  // Le message vient de la garde elle-même : un seul texte pour l'écran et pour
  // le refus serveur.
  if (gate && !gate.open) {
    return (
      <Notice
        title={datePending ? "L’ARÈNE est reportée" : "Inscriptions fermées"}
        lead={datePending ? DATE_PENDING_LABEL : undefined}
        body={gate.message}
      />
    );
  }

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-md">
        <InvitationCard
          eventName="L’ARÈNE"
          dateLabel={datePending ? DATE_PENDING_LABEL : arenaInfo.dateLabel}
          venueName={arenaInfo.venueName}
          city={getPostalLine(arenaInfo) ?? arenaInfo.city ?? ""}
          squadLabel={SQUAD_SIZE_LABEL}
          feeLabel={`${formatFee(
            event?.playerFeeCents ?? arenaInfo.registration.playerFeeCents,
            event?.currency ?? arenaInfo.registration.currency,
          )} par joueur`}
          ctaHref="/inscription/equipe"
          ctaLabel="Inscrire mon équipe"
          note="Places limitées. Deux minutes suffisent."
        />

        <div className="mx-auto mt-8 max-w-md space-y-3">
          <Step
            index={1}
            label="Votre équipe"
            detail="Capitaine, nom d’équipe, ville."
          />
          <Step
            index={2}
            label="Votre effectif"
            detail={`${SQUAD_SIZE_LABEL}. Prénom, nom, date de naissance, téléphone.`}
          />
          <Step
            index={3}
            label="Votre espace"
            detail="Un lien privé pour suivre paiements, convocation et matchs."
          />
        </div>

        <p className="mx-auto mt-8 max-w-md text-center text-xs leading-relaxed text-arena-muted">
          Une question ? Écrivez-nous sur WhatsApp au{" "}
          {arenaInfo.whatsappNumbers[0]?.display}.
        </p>
      </div>
    </main>
  );
}

/**
 * Écran d'arrêt du parcours : le formulaire n'est pas proposé, et une sortie
 * humaine l'est. Utilisé aussi bien quand aucune édition n'est trouvée que
 * quand les inscriptions sont fermées, en pause ou complètes.
 */
function Notice({
  title,
  lead,
  body,
}: {
  title: string;
  lead?: string;
  body: string;
}) {
  const contact = arenaInfo.whatsappNumbers[0];

  return (
    <main className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-md text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-arena-gold">
          Inscriptions
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-arena-white sm:text-4xl">
          {title}
        </h1>

        {lead && (
          <p className="mt-3 font-display text-lg uppercase tracking-[0.04em] text-arena-gold">
            {lead}
          </p>
        )}

        <p className="mt-4 text-sm leading-relaxed text-arena-muted">{body}</p>

        {contact && (
          <a
            href={getWhatsappUrl(contact)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex min-h-[56px] items-center justify-center rounded-md border border-arena-gold bg-arena-gold px-5 font-display text-lg uppercase tracking-[0.04em] text-arena-black transition-colors hover:bg-arena-gold-light"
          >
            Nous écrire sur WhatsApp
            <span className="sr-only"> (nouvelle fenêtre)</span>
          </a>
        )}
      </div>
    </main>
  );
}

function Step({
  index,
  label,
  detail,
}: {
  index: number;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-arena-line bg-arena-surface/70 px-3.5 py-3">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-arena-gold/35 font-display text-sm leading-none text-arena-gold">
        {index}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-[0.14em] text-arena-white">
          {label}
        </span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-arena-muted">
          {detail}
        </span>
      </span>
    </div>
  );
}
