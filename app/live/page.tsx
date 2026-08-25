import type { Metadata } from "next";

import { LiveScoreboard, LiveTimeline } from "@/components/arena/LiveScoreboard";
import { demoLiveMatch } from "@/lib/arena/demo-data";

export const metadata: Metadata = {
  title: "En direct — L’ARÈNE",
  description: "Le match en cours de L’ARÈNE, score et actions en direct.",
};

/**
 * Écran LIVE.
 *
 * Volontairement mono-sujet : il ne porte QUE la rencontre en cours — score,
 * chronomètre, lieu, journal des actions. Aucune poule, aucun classement,
 * aucun tableau, aucun autre match. Tout ce qui détournerait l'attention du
 * direct appartient aux autres rubriques.
 *
 * L'en-tête et la barre basse restent en place : l'écran est une page du site,
 * pas un affichage plein écran de gymnase. Cette dernière variante, si elle est
 * souhaitée, sera une route distincte sans navigation.
 */
export default function Page() {
  return (
    <main>
      <LiveScoreboard match={demoLiveMatch} />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-arena-gold">
          Déroulé du match
        </h2>

        <LiveTimeline events={demoLiveMatch.events} />

        <p className="text-xs leading-relaxed text-arena-muted">
          Données de démonstration. Le score, le chronomètre et les actions
          seront mis à jour en temps réel depuis la table de marque au prochain
          sprint.
        </p>
      </div>
    </main>
  );
}
