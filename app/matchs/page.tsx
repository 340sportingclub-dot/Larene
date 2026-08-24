import type { Metadata } from "next";
import Link from "next/link";

import { FixtureRow } from "@/components/arena/FixtureRow";
import { PageHero } from "@/components/arena/PageHero";
import {
  COURT_LABEL,
  demoFinishedFixtures,
  demoFormat,
  demoLiveMatch,
  demoUpcomingFixtures,
} from "@/lib/arena/demo-data";
import { hasGroup } from "@/lib/arena/tournament-format";

export const metadata: Metadata = { title: "Matchs — L’ARÈNE" };

/**
 * Page Matchs.
 *
 * Le filtre par poule est construit à partir de `demoFormat.groupIds` : il ne
 * propose que des poules qui existent. Une poule demandée dans l'URL mais
 * absente du format est ignorée et la liste complète s'affiche.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ poule?: string }>;
}) {
  const { poule } = await searchParams;
  const requested = (poule ?? "").toUpperCase();
  const activeGroupId = hasGroup(demoFormat, requested) ? requested : null;

  const matchesGroup = (groupLabel?: string | null) =>
    !activeGroupId || groupLabel === `Poule ${activeGroupId}`;

  const upcoming = demoUpcomingFixtures.filter((f) => matchesGroup(f.groupLabel));
  const finished = demoFinishedFixtures.filter((f) => matchesGroup(f.groupLabel));

  return (
    <main>
      <PageHero
        title="Matchs"
        subtitle="Tous les matchs du tournoi"
        meta={[
          `${demoFormat.teamCount} équipes`,
          `${demoUpcomingFixtures.length + demoFinishedFixtures.length} matchs de poules`,
          COURT_LABEL,
        ]}
      />

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Filtre par poule — uniquement les poules du format. */}
        <nav aria-label="Filtrer par poule">
          <ul className="flex flex-wrap gap-2">
            <li>
              <FilterChip href="/matchs" active={activeGroupId === null}>
                Toutes
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
          id="upcoming-title"
          title="À venir"
          fixtures={upcoming}
          emptyLabel="Aucun match à venir pour cette poule."
        />

        <FixtureList
          id="finished-title"
          title="Terminés"
          fixtures={finished}
          emptyLabel="Aucun match terminé pour cette poule."
        />

        <p className="text-xs leading-relaxed text-arena-muted">
          Calendrier de démonstration, généré depuis le format du tournoi. Les
          horaires et résultats réels seront branchés sur la base au prochain
          sprint.
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
  fixtures,
  emptyLabel,
}: {
  id: string;
  title: string;
  fixtures: React.ComponentProps<typeof FixtureRow>["fixture"][];
  emptyLabel: string;
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold"
      >
        {title}
      </h2>
      {fixtures.length === 0 ? (
        <p className="rounded-lg border border-arena-line bg-arena-surface/70 p-4 text-sm text-arena-muted">
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
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
