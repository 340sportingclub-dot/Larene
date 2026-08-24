import type { ScheduleSlot } from "@/lib/arena/info-data";

/**
 * Programme de la journée, en timeline verticale.
 *
 * Pensée pour le téléphone : une colonne, un filet doré continu, une pastille
 * par moment. L'ordre des moments est l'information principale — l'heure ne
 * s'affiche que si elle existe réellement dans les données. Un moment sans
 * horaire reste donc parfaitement lisible, il porte simplement « à confirmer ».
 */
export function DaySchedule({ slots }: { slots: ScheduleSlot[] }) {
  return (
    <ol className="relative">
      {slots.map((slot, index) => {
        const last = index === slots.length - 1;
        return (
          <li key={slot.id} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Filet vertical reliant les pastilles. */}
            {!last && (
              <span
                aria-hidden="true"
                className="absolute left-[7px] top-4 h-full w-px bg-arena-line"
              />
            )}

            <span
              aria-hidden="true"
              className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 ${
                slot.keyMilestone
                  ? "border-arena-gold bg-arena-gold/25"
                  : "border-arena-line bg-arena-black"
              }`}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p
                  className={`font-display text-base uppercase leading-tight ${
                    slot.keyMilestone ? "text-arena-white" : "text-arena-white/85"
                  }`}
                >
                  {slot.label}
                </p>
                {/* Une heure réelle tient à droite ; une mention de
                    disponibilité est trop longue pour y rester lisible à
                    390 px, elle passe donc sous l'intitulé. */}
                {slot.time && (
                  <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-arena-gold tabular-nums">
                    {slot.time}
                  </p>
                )}
              </div>

              {!slot.time && (
                <p className="mt-0.5 text-xs leading-relaxed text-arena-muted">
                  {slot.pendingNote ?? "À confirmer"}
                </p>
              )}

              {slot.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-arena-muted">
                  {slot.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
