"use client";

/**
 * Field primitives shared by the admin forms. The class names mirror the
 * verified project form so every admin form keeps the same visual language.
 */
const controlBaseClassName =
  "w-full rounded-xl border bg-slate-950 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none";

export const controlClassName = `${controlBaseClassName} border-slate-700 focus:border-slate-400`;
export const invalidControlClassName = `${controlBaseClassName} border-red-500/70 focus:border-red-400`;

const checkboxBaseClassName =
  "flex items-center gap-3 rounded-xl border bg-slate-950";

export const checkboxClassName = `${checkboxBaseClassName} border-slate-700 px-3 py-2.5 text-slate-100`;
export const invalidCheckboxClassName = `${checkboxBaseClassName} border-red-500/70 px-3 py-2.5 text-slate-100`;

export const checkboxInputClassName =
  "h-4 w-4 rounded border-slate-600 bg-slate-900 text-white";

export const fieldErrorClassName = "text-sm text-red-300";

/** Renders the messages a server action returned for a single field. */
export function FieldErrors({
  id,
  messages,
}: {
  id: string;
  messages?: string[];
}) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div id={id} className="space-y-1">
      {messages.map((message, index) => (
        <p key={`${id}-${index}`} className={fieldErrorClassName}>
          {message}
        </p>
      ))}
    </div>
  );
}
