import Link from "next/link";

import { ArrowRightIcon } from "@/components/arena/icons";

/**
 * Page de rubrique encore à construire.
 *
 * Ces écrans existent uniquement pour que la navigation publique — header et
 * barre basse — ne renvoie jamais une 404. Ils n'affichent aucune donnée et
 * n'inventent aucun contenu : le titre de la rubrique, une phrase d'attente,
 * un retour à l'accueil.
 */
export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="arena-spotlight arena-grain flex min-h-[70vh] items-center px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-arena-gold">
          Bientôt
        </p>
        <h1 className="mt-3 text-[clamp(2rem,8vw,3.5rem)] uppercase leading-[0.95] text-arena-white">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-arena-muted sm:text-base">
          {description}
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-arena-gold px-6 text-sm font-bold uppercase tracking-[0.14em] text-arena-gold transition-colors hover:bg-arena-gold/10"
        >
          Retour à l’accueil
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
