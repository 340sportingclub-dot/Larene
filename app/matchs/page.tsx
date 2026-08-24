import type { Metadata } from "next";
import Link from "next/link";

import { FixtureRow } from "@/components/arena/FixtureRow";
import { PageHero } from "@/components/arena/PageHero";
import {
  COURT_LABEL,
  demoClassificationFixtures,
  demoFormat,
  demoGroupFixtures,
  demoKnockoutFixtures,
  demoLiveMatch,
} from "@/lib/arena/demo-data";
import { hasGroup } from "@/lib/arena/tournament-format";
import type { FixtureMatch } from "@/lib/arena/types";

export const metadata: Metadata = { title: "Matchs — L’ARÈNE" };

/**
 * Page Matchs — le calendrier officiel du scénario retenu.
 *
 * Aucune heure n'est saisie ici : tout vient de `tournament-scenarios`. Le
 * filtre par poule est construit à partir des poules réellement présentes, et
 * une poule demandée dans l'URL mais absente du format est ignorée.
 *
 * Les sections « classement » et « phases finales » n'apparaissent que si le
 * scénario les contient — le format à 10 équipes est le seul à comporter des
 * matchs de classement.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ poule?: string }>;
}) {
  const { poule } = await searchParams;
  const requested = (poule ?? "").toUpperCase();
  const activeGroupId = hasGroup(demoFormat, requested) ? requested : null;

  const groupFixtures = activeGroupId
    ? demoGroupFixtures.filter((f) => f.groupLabel === `Poule ${activeGroupId}`)
    : demoGroupFixtures;

  // Un filtre de poule ne s'applique pas aux matchs de classement ni au tableau :
  // ces rencontres opposent les deux poules.
  const showCrossGroupSections = activeGroupId === null;

  return (
    <main>
      <PageHero
        title="Matchs"
        subtitle="Le calendrier officiel du tournoi"
        meta={[
          `${demoFormat.teamCount} équipes`,
          `${demoGroupFixtures.length} matchs de poules`,
          `${demoFormat.guaranteedMatchesPerTeam} matchs garantis par équipe`,
          COURT_LABEL,
        ]}
      />

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <nav aria-label="Filtrer par poule">
          <ul className="flex flex-wrap gap-2">
            <li>
              <FilterChip href="/matchs" active={activeGroupId === null}>
                Tout le calendrier
              </FilterChip>
            </li>
            {demoFormat.groups.map((group) => (
              <li key={group.id}>
                <FilterChip
                  href={`/matchs?poule=${group.id}`}
                  active={activeGroupId === group.id}
                >
                  Poule {group.letter}
                </FilterChip>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="live-title">
          <h2
            id="live-title"
            className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold"
          >
            <span
              aria-hidden="true"
              className="arena-pulse block h-2 w-2 rounded-full bg-arena-ember"
            />
            Match en cours
          </h2>
          <Link
            href={demoLiveMatch.href}
            className="flex min-h-[64px] items-center gap-3 rounded-lg border border-arena-gold/45 bg-arena-black/60 p-3 transition-colors hover:border-arena-gold"
          >
            <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <span className="truncate text-right font-display text-base uppercase text-arena-white sm:text-lg">
                {demoLiveMatch.home.name}
              </span>
              <span className="font-display text-xl leading-none text-arena-white tabular-nums">
                {demoLiveMatch.homeScore} - {demoLiveMatch.awayScore}
              </span>
              <span className="truncate font-display text-base uppercase text-arena-white sm:text-lg">
                {demoLiveMatch.away.name}
              </span>
            </span>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-arena-gold tabular-nums">
              {demoLiveMatch.clockLabel}
            </span>
          </Link>
        </section>

        <FixtureList
          id="group-title"
          title={
            activeGroupId
              ? `Poules — poule ${activeGroupId}`
              : `Phase de poules${demoFormat.groupLegs === 2 ? " — aller-retour" : ""}`
          }
          fixtures={groupFixtures}
          emptyLabel="Aucun match de poule pour ce filtre."
        />

        {showCrossGroupSections && demoClassificationFixtures.length > 0 && (
          <FixtureList
            id="classification-title"
            title="Matchs de classement"
            description="Chaque équipe non qualifiée dispute un match de classement : il fait partie intégrante du format."
            fixtures={demoClassificationFixtures}
            emptyLabel="Aucun match de classement dans ce format."
          />
        )}

        {showCrossGroupSections && (
          <FixtureList
            id="knockout-title"
            title="Phases finales"
            description="Les équipes seront connues à l’issue des poules."
            fixtures={demoKnockoutFixtures}
            emptyLabel="Aucune phase finale programmée."
          />
        )}

        <p className="text-xs leading-relaxed text-arena-muted">
          Calendrier officiel du scénario à {demoFormat.teamCount} équipes.
          Les résultats affichés sont des données de démonstration ; ils seront
          branchés sur la base au prochain sprint.
        </p>
      </div>
    </main>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-[44px] items-center rounded-full border px-4 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
        active
          ? "border-arena-gold bg-arena-gold/10 text-arena-gold"
          : "border-arena-line text-arena-muted hover:border-arena-gold/60 hover:text-arena-gold"
      }`}
    >
      {children}
    </Link>
  );
}

function FixtureList({
  id,
  title,
  description,
  fixtures,
  emptyLabel,
}: {
  id: string;
  title: string;
  description?: string;
  fixtures: FixtureMatch[];
  emptyLabel: string;
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 text-xs leading-relaxed text-arena-muted">
          {description}
        </p>
      )}
      {fixtures.length === 0 ? (
        <p className="mt-3 rounded-lg border border-arena-line bg-arena-surface/70 p-4 text-sm text-arena-muted">
          {emptyLabel}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {fixtures.map((fixture) => (
            <li key={fixture.id}>
              <FixtureRow fixture={fixture} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
