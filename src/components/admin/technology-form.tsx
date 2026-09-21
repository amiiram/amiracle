"use client";

import Link from "next/link";
import { useActionState } from "react";

import type {
  TechnologyFormState,
  TechnologyFormValues,
} from "@/app/admin/technologies/actions";
import {
  FieldErrors,
  controlClassName,
  invalidControlClassName,
} from "@/components/admin/form-primitives";

type TechnologyFormProps = {
  action: (
    state: TechnologyFormState,
    formData: FormData,
  ) => Promise<TechnologyFormState>;
  technology?: { id: string; name: string; slug: string };
  cancelHref?: string;
};

const initialState: TechnologyFormState = { success: true, fieldErrors: {} };

const emptyValues: TechnologyFormValues = { name: "", slug: "" };

export function TechnologyForm({
  action,
  technology,
  cancelHref,
}: TechnologyFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  // Submitted values win, so a rejected submission never wipes the fields.
  const values =
    state.values ??
    (technology
      ? { name: technology.name, slug: technology.slug }
      : emptyValues);

  // The create form and an edit form can be rendered together, so field ids are
  // namespaced per instance.
  const idPrefix = technology
    ? `technology-${technology.id}`
    : "technology-new";
  const errorId = (field: string) => `${idPrefix}-${field}-error`;
  const hasError = (field: string) => (fieldErrors[field] ?? []).length > 0;
  const describedBy = (field: string) =>
    hasError(field) ? errorId(field) : undefined;
  const controlClass = (field: string) =>
    hasError(field) ? invalidControlClassName : controlClassName;

  return (
    <form action={formAction} className="space-y-4">
      {technology ? (
        <input type="hidden" name="technologyId" value={technology.id} />
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-name`}
            className="block text-sm font-medium text-slate-200"
          >
            Name
          </label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            defaultValue={values.name}
            aria-invalid={hasError("name") || undefined}
            aria-describedby={describedBy("name")}
            className={controlClass("name")}
            placeholder="React"
          />
          <FieldErrors id={errorId("name")} messages={fieldErrors.name} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-slug`}
            className="block text-sm font-medium text-slate-200"
          >
            Slug
          </label>
          <input
            id={`${idPrefix}-slug`}
            name="slug"
            defaultValue={values.slug}
            aria-invalid={hasError("slug") || undefined}
            aria-describedby={describedBy("slug")}
            className={controlClass("slug")}
            placeholder="react"
          />
          <FieldErrors id={errorId("slug")} messages={fieldErrors.slug} />
        </div>
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Cancel
          </Link>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Saving..."
            : technology
              ? "Save technology"
              : "Create technology"}
        </button>
      </div>
    </form>
  );
}
