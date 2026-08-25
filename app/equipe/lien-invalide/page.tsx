import type { Metadata } from "next";
import Link from "next/link";

import { arenaInfo, getWhatsappUrl } from "@/lib/arena/info-data";

export const metadata: Metadata = { title: "Lien expiré — L’ARÈNE" };

/**
 * Lien d'accès invalide, révoqué ou expiré.
 *
 * On ne dit pas laquelle des trois raisons s'applique : cette page répond aussi
 * à qui essaierait des jetons au hasard. Elle donne en revanche une sortie
 * immédiate à un vrai capitaine.
 */
export default function Page() {
  const contact = arenaInfo.whatsappNumbers[0];

  return (
    <main className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-md text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-arena-gold">
          Accès équipe
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase leading-none text-arena-white sm:text-4xl">
          Ce lien ne fonctionne plus
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-arena-muted">
          Il a peut-être été remplacé par un lien plus récent. Vérifiez la
          dernière conversation reçue de l’organisation, ou demandez-nous un
          nouvel accès — nous vous le renvoyons tout de suite.
        </p>

        <div className="mt-8 grid gap-2">
          {contact && (
            <a
              href={getWhatsappUrl(contact)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[56px] items-center justify-center rounded-md border border-arena-gold bg-arena-gold px-5 font-display text-lg uppercase tracking-[0.04em] text-arena-black transition-colors hover:bg-arena-gold-light"
            >
              Demander un nouveau lien
              <span className="sr-only"> (nouvelle fenêtre)</span>
            </a>
          )}
          <Link
            href="/inscription"
            className="flex min-h-[52px] items-center justify-center rounded-md border border-arena-line px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-arena-white transition-colors hover:border-arena-gold/60 hover:text-arena-gold"
          >
            Inscrire une nouvelle équipe
          </Link>
        </div>
      </div>
    </main>
  );
}
