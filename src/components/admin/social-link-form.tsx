"use client";

import { useActionState } from "react";

import type {
  SocialLinkFormState,
  SocialLinkFormValues,
} from "@/app/admin/settings/actions";
import {
  FieldErrors,
  checkboxClassName,
  checkboxInputClassName,
  controlClassName,
  invalidCheckboxClassName,
  invalidControlClassName,
} from "@/components/admin/form-primitives";

type SocialLinkFormProps = {
  action: (
    state: SocialLinkFormState,
    formData: FormData,
  ) => Promise<SocialLinkFormState>;
  link: {
    id: string;
    platform: string;
    url: string;
    label: string;
    isVisible: boolean;
  };
};

const initialState: SocialLinkFormState = { success: true, fieldErrors: {} };

export function SocialLinkForm({ action, link }: SocialLinkFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  // Submitted values win, so a rejected submission never wipes the fields.
  const values: SocialLinkFormValues = state.values ?? {
    linkId: link.id,
    url: link.url,
    label: link.label,
    isVisible: link.isVisible,
  };

  const idPrefix = `social-link-${link.id}`;
  const errorId = (field: string) => `${idPrefix}-${field}-error`;
  const hasError = (field: string) => (fieldErrors[field] ?? []).length > 0;
  const describedBy = (field: string) =>
    hasError(field) ? errorId(field) : undefined;
  const controlClass = (field: string) =>
    hasError(field) ? invalidControlClassName : controlClassName;
  const invalid = (field: string) => hasError(field) || undefined;

  return (
    // Native validation is disabled so the server-side schema stays the single
    // source of truth.
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
      noValidate
    >
      <input type="hidden" name="linkId" value={link.id} />

      <div>
        <p className="text-sm font-medium text-white">
          {values.label || link.platform}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
          {link.platform}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor={`${idPrefix}-url`}
            className="block text-sm font-medium text-slate-200"
          >
            URL
          </label>
          <input
            id={`${idPrefix}-url`}
            name="url"
            type="url"
            defaultValue={values.url}
            aria-invalid={invalid("url")}
            aria-describedby={describedBy("url")}
            className={controlClass("url")}
            placeholder="https://example.com"
          />
          <FieldErrors id={errorId("url")} messages={fieldErrors.url} />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label
            htmlFor={`${idPrefix}-label`}
            className="block text-sm font-medium text-slate-200"
          >
            Label
          </label>
          <input
            id={`${idPrefix}-label`}
            name="label"
            defaultValue={values.label}
            aria-invalid={invalid("label")}
            aria-describedby={describedBy("label")}
            className={controlClass("label")}
            placeholder="GitHub"
          />
          <FieldErrors id={errorId("label")} messages={fieldErrors.label} />
        </div>
      </div>

      <label
        className={
          hasError("isVisible") ? invalidCheckboxClassName : checkboxClassName
        }
      >
        <input
          type="checkbox"
          name="isVisible"
          defaultChecked={values.isVisible}
          aria-invalid={invalid("isVisible")}
          aria-describedby={describedBy("isVisible")}
          className={checkboxInputClassName}
        />
        Visible on the site
      </label>

      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save link"}
        </button>
      </div>
    </form>
  );
}
