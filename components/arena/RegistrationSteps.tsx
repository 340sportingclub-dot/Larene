/**
 * Progression du parcours d'inscription.
 *
 * Trois pas, toujours visibles : on sait où on en est et combien il reste.
 * C'est ce qui empêche l'abandon au milieu d'un formulaire sur téléphone.
 */
const STEPS = ["Équipe", "Effectif", "C’est fait"];

export function RegistrationSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Progression de l’inscription">
      <ol className="flex items-center gap-2">
        {STEPS.map((label, index) => {
          const position = index + 1;
          const done = position < current;
          const active = position === current;

          return (
            <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span
                aria-hidden="true"
                className={`h-1 rounded-full ${
                  done || active ? "bg-arena-gold" : "bg-arena-line"
                }`}
              />
              <span
                className={`truncate text-[10px] font-bold uppercase tracking-[0.14em] ${
                  active
                    ? "text-arena-gold"
                    : done
                      ? "text-arena-muted"
                      : "text-arena-muted/60"
                }`}
              >
                {label}
                {active && <span className="sr-only"> (étape en cours)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
