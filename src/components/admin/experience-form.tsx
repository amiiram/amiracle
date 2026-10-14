"use client";

import Link from "next/link";
import { useActionState } from "react";

import type {
  ExperienceFormState,
  ExperienceFormValues,
} from "@/app/admin/experience/actions";
import { MarkdownField } from "@/components/admin/markdown-editor";
import {
  SearchableCheckboxGroup,
  type CheckboxOption,
} from "@/components/admin/searchable-checkbox-group";
import {
  FieldErrors,
  controlClassName,
  invalidControlClassName,
} from "@/components/admin/form-primitives";

type ExperienceFormProps = {
  action: (
    state: ExperienceFormState,
    formData: FormData,
  ) => Promise<ExperienceFormState>;
  experience?: ExperienceFormValues & { id: string };
  projectOptions: CheckboxOption[];
  technologyOptions: CheckboxOption[];
  cancelHref?: string;
};

const initialState: ExperienceFormState = { success: true, fieldErrors: {} };

const emptyValues: ExperienceFormValues = {
  slug: "",
  company: "",
  role: "",
  location: "",
  summary: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
  projectIds: [],
  technologyIds: [],
};

export function ExperienceForm({
  action,
  experience,
  projectOptions,
  technologyOptions,
  cancelHref,
}: ExperienceFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  const values =
    state.values ??
    (experience
      ? {
          slug: experience.slug,
          company: experience.company,
          role: experience.role,
          location: experience.location,
          summary: experience.summary,
          startDate: experience.startDate,
          endDate: experience.endDate,
          isCurrent: experience.isCurrent,
          description: experience.description,
          projectIds: experience.projectIds,
          technologyIds: experience.technologyIds,
        }
      : emptyValues);
  const idPrefix = experience
    ? `experience-${experience.id}`
    : "experience-new";
  const errorId = (field: string) => `${idPrefix}-${field}-error`;
  const hasError = (field: string) => (fieldErrors[field] ?? []).length > 0;
  const describedBy = (field: string) =>
    hasError(field) ? errorId(field) : undefined;
  const controlClass = (field: string) =>
    hasError(field) ? invalidControlClassName : controlClassName;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-slug`}
            className="block text-sm font-medium text-slate-200"
          >
            Public slug
          </label>
          <input
            id={`${idPrefix}-slug`}
            name="slug"
            required
            maxLength={120}
            defaultValue={values.slug}
            aria-invalid={hasError("slug") || undefined}
            aria-describedby={describedBy("slug")}
            className={controlClass("slug")}
            placeholder="frontend-developer-company"
          />
          <FieldErrors id={errorId("slug")} messages={fieldErrors.slug} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-role`}
            className="block text-sm font-medium text-slate-200"
          >
            Role
          </label>
          <input
            id={`${idPrefix}-role`}
            name="role"
            required
            maxLength={160}
            defaultValue={values.role}
            aria-invalid={hasError("role") || undefined}
            aria-describedby={describedBy("role")}
            className={controlClass("role")}
            placeholder="Frontend developer"
          />
          <FieldErrors id={errorId("role")} messages={fieldErrors.role} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-company`}
            className="block text-sm font-medium text-slate-200"
          >
            Company
          </label>
          <input
            id={`${idPrefix}-company`}
            name="company"
            required
            maxLength={160}
            defaultValue={values.company}
            aria-invalid={hasError("company") || undefined}
            aria-describedby={describedBy("company")}
            className={controlClass("company")}
            placeholder="Company name"
          />
          <FieldErrors id={errorId("company")} messages={fieldErrors.company} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-location`}
            className="block text-sm font-medium text-slate-200"
          >
            Location <span className="text-slate-500">(optional)</span>
          </label>
          <input
            id={`${idPrefix}-location`}
            name="location"
            maxLength={120}
            defaultValue={values.location}
            aria-invalid={hasError("location") || undefined}
            aria-describedby={describedBy("location")}
            className={controlClass("location")}
            placeholder="City, country or remote"
          />
          <FieldErrors id={errorId("location")} messages={fieldErrors.location} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-startDate`}
            className="block text-sm font-medium text-slate-200"
          >
            Start date
          </label>
          <input
            id={`${idPrefix}-startDate`}
            name="startDate"
            type="date"
            required
            defaultValue={values.startDate}
            aria-invalid={hasError("startDate") || undefined}
            aria-describedby={describedBy("startDate")}
            className={controlClass("startDate")}
          />
          <FieldErrors
            id={errorId("startDate")}
            messages={fieldErrors.startDate}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-endDate`}
            className="block text-sm font-medium text-slate-200"
          >
            End date <span className="text-slate-500">(optional)</span>
          </label>
          <input
            id={`${idPrefix}-endDate`}
            name="endDate"
            type="date"
            defaultValue={values.endDate}
            aria-invalid={hasError("endDate") || undefined}
            aria-describedby={describedBy("endDate")}
            className={controlClass("endDate")}
          />
          <FieldErrors id={errorId("endDate")} messages={fieldErrors.endDate} />
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-slate-200">
            Employment status
          </span>
          <label
            htmlFor={`${idPrefix}-isCurrent`}
            className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"
          >
            <input
              id={`${idPrefix}-isCurrent`}
              name="isCurrent"
              type="checkbox"
              defaultChecked={values.isCurrent}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-white"
            />
            This is my current role
          </label>
          <p className="text-xs text-slate-500">
            For a current role, leave the end date empty.
          </p>
          <FieldErrors
            id={errorId("isCurrent")}
            messages={fieldErrors.isCurrent}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`${idPrefix}-summary`}
          className="block text-sm font-medium text-slate-200"
        >
          Short summary <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}-summary`}
          name="summary"
          rows={2}
          maxLength={280}
          defaultValue={values.summary}
          aria-invalid={hasError("summary") || undefined}
          aria-describedby={describedBy("summary")}
          className={controlClass("summary")}
          placeholder="A concise, factual summary of this role."
        />
        <FieldErrors id={errorId("summary")} messages={fieldErrors.summary} />
      </div>

      <MarkdownField
        id={`${idPrefix}-description`}
        name="description"
        label="Main description (Markdown)"
        defaultValue={values.description}
        placeholder="Describe verified work and responsibilities in Markdown."
        mediaPickerMode="details"
        lineBreaks
        headingOffset={1}
        fieldErrors={fieldErrors}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SearchableCheckboxGroup
          key={`projects-${values.projectIds.join(",")}`}
          id={`${idPrefix}-projects`}
          name="projectIds"
          label="Related projects"
          options={projectOptions}
          selectedIds={values.projectIds}
          errorId={errorId("projectIds")}
          errors={fieldErrors.projectIds}
        />
        <SearchableCheckboxGroup
          key={`technologies-${values.technologyIds.join(",")}`}
          id={`${idPrefix}-technologies`}
          name="technologyIds"
          label="Technologies and skills"
          options={technologyOptions}
          selectedIds={values.technologyIds}
          errorId={errorId("technologyIds")}
          errors={fieldErrors.technologyIds}
        />
        <FieldErrors
          id={errorId("description")}
          messages={fieldErrors.description}
        />
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
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
            : experience
              ? "Save experience"
              : "Add experience"}
        </button>
      </div>
    </form>
  );
}
