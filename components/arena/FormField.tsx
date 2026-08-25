/**
 * Champ de formulaire de L'ARÈNE.
 *
 * Un capitaine de 16 ans remplit ça sur son téléphone, depuis une story. Donc :
 * étiquette lisible, champ haut de 52 px, clavier adapté au type de saisie, et
 * une erreur qui dit ce qui ne va pas — jamais « champ invalide ».
 *
 * L'erreur est liée au champ par `aria-describedby` et signalée par
 * `aria-invalid` : elle est annoncée, pas seulement colorée.
 */
export function FormField({
  name,
  label,
  error,
  hint,
  defaultValue,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  required = false,
  maxLength,
  max,
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  defaultValue?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  max?: string;
}) {
  const id = `field-${name.replace(/[^a-zA-Z0-9]/g, "-")}`;
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-arena-muted"
      >
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        max={max}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`h-[52px] w-full rounded-md border bg-arena-black/60 px-3.5 text-base text-arena-white placeholder:text-arena-muted/60 focus:outline-none ${
          error
            ? "border-arena-ember"
            : "border-arena-line focus:border-arena-gold/70"
        }`}
      />

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-arena-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-arena-ember">
          {error}
        </p>
      )}
    </div>
  );
}

/** Bandeau d'erreur générale, au-dessus du formulaire. */
export function FormAlert({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-arena-ember bg-arena-ember/10 px-3.5 py-3 text-sm leading-relaxed text-arena-white"
    >
      {message}
    </p>
  );
}

/** Bouton principal d'un formulaire : haut, large, sans ambiguïté. */
export function SubmitButton({
  children,
  pending = false,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-[56px] w-full items-center justify-center rounded-md border border-arena-gold bg-arena-gold px-5 font-display text-lg uppercase tracking-[0.04em] text-arena-black transition-colors hover:bg-arena-gold-light disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enregistrement…" : children}
    </button>
  );
}
