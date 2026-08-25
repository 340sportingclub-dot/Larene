/**
 * Les quatre états d'une équipe, tels que le capitaine doit les lire en une
 * seconde : inscription, effectif, paiements, tournoi.
 *
 * La forme encode l'état autant que le texte — un état satisfait est bordé d'or,
 * un état incomplet reste sur la ligne grise. Aucune couleur nouvelle : la DA
 * n'a ni vert ni rouge de validation, et le braise reste réservé au direct.
 */
export type TeamStatusTone = "done" | "progress" | "waiting";

export type TeamStatus = {
  label: string;
  value: string;
  tone: TeamStatusTone;
};

export function TeamStatusPills({ statuses }: { statuses: TeamStatus[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {statuses.map((status) => (
        <li
          key={status.label}
          className={`min-w-0 rounded-lg border px-3 py-2.5 ${
            status.tone === "done"
              ? "border-arena-gold/45 bg-arena-gold/[0.07]"
              : "border-arena-line bg-arena-black/50"
          }`}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-arena-muted">
            {status.label}
          </p>
          <p
            className={`mt-1 break-words font-display text-lg uppercase leading-none ${
              status.tone === "waiting" ? "text-arena-muted" : "text-arena-white"
            }`}
          >
            {status.value}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Barre de progression des paiements : « 6 / 8 joueurs réglés ». */
export function PaymentProgress({
  paidCount,
  totalCount,
  feeLabel,
}: {
  paidCount: number;
  totalCount: number;
  feeLabel: string;
}) {
  const ratio = totalCount > 0 ? paidCount / totalCount : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-2xl uppercase leading-none text-arena-white">
          {paidCount} / {totalCount}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-arena-muted">
          {feeLabel} par joueur
        </p>
      </div>

      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-arena-line"
        role="progressbar"
        aria-valuenow={paidCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${paidCount} joueurs réglés sur ${totalCount}`}
      >
        <div
          className="h-full rounded-full bg-arena-gold transition-[width]"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-arena-muted">
        {paidCount === totalCount && totalCount > 0
          ? "Tous vos joueurs sont à jour."
          : `${totalCount - paidCount} joueur${totalCount - paidCount > 1 ? "s" : ""} reste${totalCount - paidCount > 1 ? "nt" : ""} à régler.`}
      </p>
    </div>
  );
}
