/**
 * Monogramme « A » de L'ARÈNE — tracé géométrique, dégradé bronze → or clair,
 * étoile centrale. Purement vectoriel : aucun asset, net à toutes les tailles.
 */
export function ArenaMonogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="arena-monogram" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#f0d191" />
          <stop offset="45%" stopColor="#d5a548" />
          <stop offset="100%" stopColor="#8f6220" />
        </linearGradient>
      </defs>
      {/* Jambages du A */}
      <path
        d="M20 2.5 38 37.5h-8.8L20 19.2 10.8 37.5H2z"
        fill="url(#arena-monogram)"
      />
      {/* Barre transversale */}
      <path d="M13.6 27.4h12.8l2.1 4.1H11.5z" fill="url(#arena-monogram)" />
      {/* Étoile de l'arène */}
      <path
        d="M20 12.6l1.55 3.6 3.6 1.55-3.6 1.55L20 22.9l-1.55-3.6-3.6-1.55 3.6-1.55z"
        fill="#050505"
      />
    </svg>
  );
}

/**
 * Verrouillage logo + nom + baseline.
 * `compact` supprime la baseline pour le header mobile.
 */
export function ArenaWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <ArenaMonogram className={compact ? "h-8 w-8" : "h-10 w-10"} />
      <span className="flex flex-col justify-center leading-none">
        <span
          className={`font-display uppercase tracking-[0.02em] text-arena-white ${
            compact ? "text-xl" : "text-2xl"
          }`}
        >
          L’Arène
        </span>
        {!compact && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-arena-muted">
            Tournoi de foot en salle
          </span>
        )}
      </span>
    </span>
  );
}
