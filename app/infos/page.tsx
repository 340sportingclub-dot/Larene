import type { Metadata } from "next";

import { DaySchedule } from "@/components/arena/DaySchedule";
import {
  InfoAction,
  InfoCard,
  InfoRow,
  ToBeConfirmed,
} from "@/components/arena/InfoCard";
import { PageHero } from "@/components/arena/PageHero";
import { PracticalRules } from "@/components/arena/PracticalRules";
import {
  CalendarIcon,
  CameraIcon,
  ChatIcon,
  CourtIcon,
  DrinkIcon,
  InfoIcon,
  InstagramIcon,
  PinIcon,
  TicketIcon,
  TrophyIcon,
} from "@/components/arena/icons";
import { demoFormat, demoKnockoutFixtures } from "@/lib/arena/demo-data";
import { getGroupMatchCount } from "@/lib/arena/tournament-format";
import {
  arenaInfo,
  definedPracticalRules,
  formatFee,
  getDirectionsUrl,
  getInstagramUrl,
  getPostalLine,
  getWhatsappUrl,
  hasAnyScheduleTime,
  keyMilestones,
  publicVoteAwards,
} from "@/lib/arena/info-data";

export const metadata: Metadata = {
  title: "Infos pratiques — L’ARÈNE",
  description:
    "Lieu, horaires, contact, inscription, restauration et programme de L’ARÈNE.",
};

/**
 * Page INFOS PRATIQUES.
 *
 * Objectif : lieu, horaires et contact atteignables en quelques secondes, donc
 * placés en tête. Tout le contenu vient de `lib/arena/info-data.ts` — rien
 * n'est écrit en dur ici, et le format de la compétition vient du moteur
 * `tournament-format`, jamais d'une description recopiée.
 *
 * Toute donnée absente est filtrée : aucune adresse, aucun horaire, aucune
 * règle et aucun produit n'est inventé.
 */
export default function Page() {
  const { registration, food, media } = arenaInfo;
  const fee = formatFee(registration.playerFeeCents, registration.currency);
  const postalLine = getPostalLine(arenaInfo);
  const groupMatchCount = getGroupMatchCount(demoFormat);

  return (
    <main>
      <PageHero
        label="Le jour J"
        title="Infos pratiques"
        subtitle="Tout ce qu’il faut savoir avant d’entrer dans l’arène"
      />

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:space-y-5 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* --- Les trois blocs prioritaires ------------------------------- */}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
          <InfoCard icon={PinIcon} title="Lieu">
            <p className="font-display text-xl uppercase leading-tight text-arena-white sm:text-2xl">
              {arenaInfo.venueName}
            </p>
            {/* Adresse au format postal français. Chaque ligne absente est omise. */}
            <address className="mt-2 not-italic">
              {arenaInfo.address && (
                <p className="text-sm leading-snug text-arena-white/85">
                  {arenaInfo.address}
                </p>
              )}
              {postalLine && (
                <p className="text-sm leading-snug text-arena-white/85">
                  {postalLine}
                </p>
              )}
            </address>
            <div className="mt-auto pt-4">
              <InfoAction href={getDirectionsUrl(arenaInfo)} external>
                Ouvrir l’itinéraire
              </InfoAction>
            </div>
          </InfoCard>

          <InfoCard icon={CalendarIcon} title="Date & horaires">
            <p className="font-display text-xl uppercase leading-tight text-arena-white sm:text-2xl">
              {arenaInfo.dateLabel}
            </p>
            {arenaInfo.singleDay && (
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-arena-muted">
                Tournoi sur une seule journée
              </p>
            )}
            {hasAnyScheduleTime ? (
              <dl className="mt-3">
                {keyMilestones.map((slot) => (
                  <InfoRow
                    key={slot.id}
                    label={slot.label}
                    value={slot.time ?? <ToBeConfirmed />}
                  />
                ))}
              </dl>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-arena-muted">
                  Les horaires précis ne sont pas encore arrêtés. Le déroulé de
                  la journée est détaillé plus bas.
                </p>
                <div className="mt-auto pt-4">
                  <InfoAction href="#programme" variant="secondary">
                    Voir le programme
                  </InfoAction>
                </div>
              </>
            )}
          </InfoCard>

          <InfoCard icon={ChatIcon} title="Contact">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-arena-white">
              WhatsApp uniquement
            </p>
            <p className="mt-1 text-xs leading-relaxed text-arena-muted">
              Une question sur l’inscription ou la journée ? Écrivez-nous.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {arenaInfo.whatsappNumbers.map((contact) => (
                <InfoAction
                  key={contact.international}
                  href={getWhatsappUrl(contact)}
                  icon={ChatIcon}
                  external
                >
                  {contact.display}
                </InfoAction>
              ))}
              {arenaInfo.instagramHandle && (
                <InfoAction
                  href={getInstagramUrl(arenaInfo.instagramHandle)}
                  icon={InstagramIcon}
                  variant="secondary"
                  external
                >
                  @{arenaInfo.instagramHandle}
                </InfoAction>
              )}
            </div>
          </InfoCard>
        </div>

        {/* --- Inscription ------------------------------------------------ */}
        <InfoCard icon={TicketIcon} title="Inscription des joueurs">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <dl>
              <InfoRow label="Catégorie" value={registration.ageCategory} />
              <InfoRow label="Tarif" value={`${fee} par joueur`} />
              <InfoRow label="Effectif" value={registration.squadSizeNote} />
              {registration.limitedPlaces && (
                <InfoRow label="Places" value="Limitées" />
              )}
            </dl>

            <div className="sm:w-64">
              {registration.url ? (
                <InfoAction href={registration.url} external>
                  S’inscrire
                </InfoAction>
              ) : (
                <p className="rounded-md border border-arena-gold/35 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-arena-gold">
                  Inscriptions en cours — contact WhatsApp
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-arena-muted">
            La place d’une équipe est validée une fois l’inscription finalisée.
          </p>
        </InfoCard>

        {/* --- Format + terrain unique ------------------------------------ */}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <InfoCard icon={TrophyIcon} title="Format de la compétition">
            {/* Décrit par le moteur de format : jamais recopié à la main. */}
            <p className="font-display text-2xl uppercase leading-tight text-arena-white sm:text-3xl">
              {demoFormat.groupCount} poules
            </p>
            <p className="mt-2 text-sm leading-relaxed text-arena-white/85">
              Les {demoFormat.qualifiersPerGroup} premiers de chaque poule se
              qualifient, soit {demoFormat.qualifierCount} équipes.
            </p>
            <ul className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
              {demoFormat.knockoutRounds.map((round, index) => (
                <li key={round.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <span aria-hidden="true" className="text-arena-gold-dark">
                      →
                    </span>
                  )}
                  <span className="rounded border border-arena-gold/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-arena-gold sm:text-[11px]">
                    {round.name}
                  </span>
                </li>
              ))}
            </ul>
          </InfoCard>

          <InfoCard icon={CourtIcon} title="Aire de jeu">
            <p className="font-display text-2xl uppercase leading-tight text-arena-white sm:text-3xl">
              {arenaInfo.courtCount} seul terrain
            </p>
            <p className="mt-2 text-sm leading-relaxed text-arena-muted">
              Tous les matchs se jouent sur le même terrain, les uns après les
              autres.
            </p>
          </InfoCard>
        </div>

        {/* --- Buvette + média -------------------------------------------- */}
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          {food.available && (
            <InfoCard icon={DrinkIcon} title="Buvette & restauration">
              <p className="text-sm leading-relaxed text-arena-white/85">
                {food.summary}
              </p>
              {/* Aucune carte arrêtée : aucun produit ni prix affiché. */}
              {food.categories.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {food.categories.map((category) => (
                    <li
                      key={category.id}
                      className="rounded border border-arena-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-arena-muted"
                    >
                      {category.label}
                    </li>
                  ))}
                </ul>
              )}
            </InfoCard>
          )}

          {(media.photos || media.videos) && (
            <InfoCard icon={CameraIcon} title="Tournoi filmé">
              <p className="font-display text-xl uppercase leading-tight text-arena-white sm:text-2xl">
                {media.photos && media.videos
                  ? "Photos + vidéos toute la journée"
                  : media.videos
                    ? "Vidéos toute la journée"
                    : "Photos toute la journée"}
              </p>
              {media.partner && (
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-arena-muted">
                  Couverture {media.partner}
                </p>
              )}
              {/* Aucune diffusion en direct annoncée tant qu'elle n'est pas confirmée. */}
              {media.livestreamUrl && (
                <div className="mt-4">
                  <InfoAction href={media.livestreamUrl} external>
                    Voir la diffusion
                  </InfoAction>
                </div>
              )}
            </InfoCard>
          )}
        </div>

        {/* --- À savoir : masqué tant qu'aucune règle n'est arrêtée -------- */}
        {definedPracticalRules.length > 0 && (
          <InfoCard icon={InfoIcon} title="À savoir">
            <PracticalRules rules={definedPracticalRules} />
          </InfoCard>
        )}

        {/* --- Programme --------------------------------------------------- */}
        <div id="programme" className="scroll-mt-20">
        <InfoCard icon={CalendarIcon} title="Programme">
          <p className="mb-3 text-xs leading-relaxed text-arena-muted">
            Déroulé de la journée pour le format à {demoFormat.teamCount}{" "}
            équipes. Le calendrier définitif sera confirmé après la clôture des
            inscriptions ; le détail match par match est sur la page Matchs.
          </p>

          {/* Volume dérivé du format retenu, jamais saisi à la main. */}
          <p className="mb-4 flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-arena-muted">
            <span>{demoFormat.teamCount} équipes</span>
            <span aria-hidden="true">·</span>
            <span>{demoFormat.groupCount} poules</span>
            <span aria-hidden="true">·</span>
            <span>{groupMatchCount} matchs de poules</span>
            <span aria-hidden="true">·</span>
            <span>{demoKnockoutFixtures.length} matchs de phase finale</span>
          </p>

          <DaySchedule slots={arenaInfo.schedule} />
        </InfoCard>
        </div>

        {/* --- Récompenses -------------------------------------------------- */}
        <InfoCard icon={TrophyIcon} title="Récompenses">
          <ul className="grid gap-2 sm:grid-cols-2">
            {arenaInfo.awards.map((award) => (
              <li
                key={award.id}
                className="flex min-h-[44px] items-center gap-3 rounded-lg border border-arena-line bg-arena-black/50 px-3 py-2"
              >
                <TrophyIcon className="h-4 w-4 shrink-0 text-arena-gold-dark" />
                <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.1em] text-arena-white">
                  {award.label}
                </span>
                {award.publicVote && (
                  <span className="shrink-0 rounded border border-arena-gold/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-arena-gold">
                    Vote
                  </span>
                )}
              </li>
            ))}
          </ul>

          {publicVoteAwards.length > 0 && (
            <p className="mt-4 text-xs leading-relaxed text-arena-muted">
              {publicVoteAwards.map((award) => award.label).join(" et ")} :
              vote du public avant la finale.
            </p>
          )}
        </InfoCard>
      </div>
    </main>
  );
}
