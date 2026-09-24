"use client";

import { useActionState } from "react";

import type {
  SiteSettingsFormState,
  SiteSettingsFormValues,
} from "@/app/admin/settings/actions";
import { MarkdownField } from "@/components/admin/markdown-editor";
import {
  FieldErrors,
  controlClassName,
  invalidControlClassName,
} from "@/components/admin/form-primitives";

type SelectOption = {
  value: string;
  label: string;
};

type SiteSettingsFormProps = {
  action: (
    state: SiteSettingsFormState,
    formData: FormData,
  ) => Promise<SiteSettingsFormState>;
  settings: SiteSettingsFormValues;
  localeOptions: SelectOption[];
  themeModeOptions: SelectOption[];
};

const initialState: SiteSettingsFormState = { success: true, fieldErrors: {} };

export function SiteSettingsForm({
  action,
  settings,
  localeOptions,
  themeModeOptions,
}: SiteSettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  // Submitted values win, so a rejected submission never wipes the form.
  const values = state.values ?? settings;

  const hasError = (field: string) => (fieldErrors[field] ?? []).length > 0;
  const errorId = (field: string) => `settings-${field}-error`;
  const describedBy = (field: string) =>
    hasError(field) ? errorId(field) : undefined;
  const controlClass = (field: string) =>
    hasError(field) ? invalidControlClassName : controlClassName;
  const invalid = (field: string) => hasError(field) || undefined;

  return (
    // Native validation is disabled so the server-side schema stays the single
    // source of truth, matching the admin login form.
    <form action={formAction} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500">
          General
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="settings-siteName"
              className="block text-sm font-medium text-slate-200"
            >
              Site name
            </label>
            <input
              id="settings-siteName"
              name="siteName"
              defaultValue={values.siteName}
              aria-invalid={invalid("siteName")}
              aria-describedby={describedBy("siteName")}
              className={controlClass("siteName")}
              placeholder="amiracle"
            />
            <FieldErrors
              id={errorId("siteName")}
              messages={fieldErrors.siteName}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="settings-tagline"
              className="block text-sm font-medium text-slate-200"
            >
              Tagline
            </label>
            <input
              id="settings-tagline"
              name="tagline"
              defaultValue={values.tagline}
              aria-invalid={invalid("tagline")}
              aria-describedby={describedBy("tagline")}
              className={controlClass("tagline")}
              placeholder="I build things for the web."
            />
            <FieldErrors
              id={errorId("tagline")}
              messages={fieldErrors.tagline}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="settings-description"
              className="block text-sm font-medium text-slate-200"
            >
              Description
            </label>
            <textarea
              id="settings-description"
              name="description"
              defaultValue={values.description}
              rows={3}
              aria-invalid={invalid("description")}
              aria-describedby={describedBy("description")}
              className={controlClass("description")}
              placeholder="Short description used across the site."
            />
            <FieldErrors
              id={errorId("description")}
              messages={fieldErrors.description}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-800 pt-6">
        <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Contact
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="settings-email"
              className="block text-sm font-medium text-slate-200"
            >
              Contact email
            </label>
            <input
              id="settings-email"
              name="email"
              type="email"
              defaultValue={values.email}
              aria-invalid={invalid("email")}
              aria-describedby={describedBy("email")}
              className={controlClass("email")}
              placeholder="hello@amiracle.dev"
            />
            <FieldErrors id={errorId("email")} messages={fieldErrors.email} />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-800 pt-6">
        <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Display &amp; locale
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="settings-defaultLocale"
              className="block text-sm font-medium text-slate-200"
            >
              Default locale
            </label>
            {/* Keyed by value: React does not refresh a select's default option
                when only `defaultValue` changes, so without the key a rejected
                submission would snap back to the server-rendered value. */}
            <select
              key={`settings-defaultLocale-${values.defaultLocale}`}
              id="settings-defaultLocale"
              name="defaultLocale"
              defaultValue={values.defaultLocale}
              aria-invalid={invalid("defaultLocale")}
              aria-describedby={describedBy("defaultLocale")}
              className={controlClass("defaultLocale")}
            >
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldErrors
              id={errorId("defaultLocale")}
              messages={fieldErrors.defaultLocale}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="settings-themeMode"
              className="block text-sm font-medium text-slate-200"
            >
              Theme mode
            </label>
            <select
              key={`settings-themeMode-${values.themeMode}`}
              id="settings-themeMode"
              name="themeMode"
              defaultValue={values.themeMode}
              aria-invalid={invalid("themeMode")}
              aria-describedby={describedBy("themeMode")}
              className={controlClass("themeMode")}
            >
              {themeModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldErrors
              id={errorId("themeMode")}
              messages={fieldErrors.themeMode}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-800 pt-6">
        <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500">
          About page
        </h3>

        <div className="space-y-2">
          <MarkdownField
            id="settings-aboutMarkdown"
            name="aboutMarkdown"
            label="About (Markdown)"
            defaultValue={values.aboutMarkdown}
            fieldErrors={fieldErrors}
            placeholder="## About"
          />
        </div>
      </section>

      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
