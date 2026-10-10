"use client";

import { useActionState } from "react";

import type {
  NewSocialLinkFormState,
  NewSocialLinkFormValues,
} from "@/app/admin/settings/actions";
import {
  FieldErrors,
  checkboxClassName,
  checkboxInputClassName,
  controlClassName,
} from "@/components/admin/form-primitives";

const initialState: NewSocialLinkFormState = {
  success: true,
  fieldErrors: {},
};

export function CreateSocialLinkForm({
  action,
}: {
  action: (
    state: NewSocialLinkFormState,
    formData: FormData,
  ) => Promise<NewSocialLinkFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const values: NewSocialLinkFormValues = state.values ?? {
    platform: "",
    url: "",
    label: "",
    isVisible: true,
  };
  const errors = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
      noValidate
    >
      <h3 className="text-sm font-medium text-white">Add a social link</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            ["platform", "Platform", "GitHub"],
            ["url", "URL", "https://example.com"],
            ["label", "Link label", "Profile"],
          ] as const
        ).map(([name, label, placeholder]) => (
          <div key={name} className="space-y-2">
            <label
              htmlFor={`new-social-${name}`}
              className="block text-sm font-medium text-slate-200"
            >
              {label}
            </label>
            <input
              id={`new-social-${name}`}
              name={name}
              type={name === "url" ? "url" : "text"}
              defaultValue={values[name]}
              placeholder={placeholder}
              aria-invalid={Boolean(errors[name]?.length)}
              aria-describedby={
                errors[name]?.length ? `new-social-${name}-error` : undefined
              }
              className={controlClassName}
            />
            <FieldErrors
              id={`new-social-${name}-error`}
              messages={errors[name]}
            />
          </div>
        ))}
      </div>
      <label className={checkboxClassName}>
        <input
          type="checkbox"
          name="isVisible"
          defaultChecked={values.isVisible}
          className={checkboxInputClassName}
        />
        Visible on the site
      </label>
      {state.message ? (
        <p role="alert" className="text-sm text-red-300">
          {state.message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : "Add link"}
        </button>
      </div>
    </form>
  );
}
