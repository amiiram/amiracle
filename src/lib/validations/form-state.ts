import type { ZodError } from "zod";

/**
 * The state contract shared by the admin form actions. It matches the shape the
 * verified project form already uses: a failure carries the submitted values
 * plus field-level messages, while success is signalled by a redirect.
 */
export type FormState<TValues> = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: TValues;
};

export const FORM_VALIDATION_MESSAGE = "Please fix the highlighted fields.";

/**
 * Maps the issues produced by a domain Zod schema onto the form fields that
 * caused them, keyed by the field `name` the form submits.
 */
export function toFieldErrors(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const [field] = issue.path;

    if (typeof field !== "string") {
      continue;
    }

    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
  }

  return fieldErrors;
}

/** Reads a text field, treating anything that is not a string as empty. */
export function readFieldText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

/** Reads a checkbox field: checked boxes submit the literal `"on"`. */
export function readCheckbox(formData: FormData, field: string) {
  return formData.get(field) === "on";
}

/**
 * Reads a multi-value field (checkbox group), dropping non-string entries.
 * Single checkboxes must use {@link readCheckbox} instead.
 */
export function readIdList(formData: FormData, field: string): string[] {
  return formData.getAll(field).flatMap((value) => {
    if (typeof value !== "string") {
      return [];
    }

    const trimmed = value.trim();

    return trimmed ? [trimmed] : [];
  });
}
