"use client";

import type {
  ProjectFormState,
  ProjectFormValues,
  ProjectMediaFormValues,
} from "@/app/admin/projects/actions";
import { MarkdownField } from "@/components/admin/markdown-editor";
import { ProjectMediaEditor } from "@/components/admin/project-media-editor";
import {
  FieldErrors,
  checkboxInputClassName,
  controlClassName,
  invalidControlClassName,
} from "@/components/admin/form-primitives";
import { useActionState, useMemo, useState } from "react";

type TechnologyOption = {
  id: string;
  name: string;
};

type ProjectDefaults = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  responsibilities: string[];
  featured: boolean;
  status: string;
  visibility: string;
  publishedAt: string | null;
  technologies: TechnologyOption[];
  media?: ProjectMediaFormValues[];
};

type ProjectFormProps = {
  action: (
    state: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  technologyOptions: TechnologyOption[];
  project?: ProjectDefaults;
};

const initialState: ProjectFormState = {
  success: true,
  fieldErrors: {},
};

const emptyValues: ProjectFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  description: "",
  responsibilities: "",
  status: "draft",
  visibility: "PUBLIC",
  featured: false,
  publishedAt: "",
  technologyIds: [],
  media: [],
};

const checkboxBaseClassName =
  "flex items-center gap-3 rounded-xl border bg-slate-950";
const checkboxClassName = `${checkboxBaseClassName} border-slate-700`;
const invalidCheckboxClassName = `${checkboxBaseClassName} border-red-500/70`;

/** The values the form starts from: the edited project, or nothing at all. */
function toInitialValues(project?: ProjectDefaults): ProjectFormValues {
  if (!project) {
    return emptyValues;
  }

  return {
    title: project.title,
    slug: project.slug,
    excerpt: project.excerpt ?? "",
    description: project.description ?? "",
    responsibilities: project.responsibilities.join("\n"),
    status: project.status,
    visibility: project.visibility,
    featured: project.featured,
    publishedAt: project.publishedAt ? project.publishedAt.slice(0, 10) : "",
    technologyIds: project.technologies.map((technology) => technology.id),
    media: project.media ?? [],
  };
}

export function ProjectForm({
  action,
  technologyOptions,
  project,
}: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  // Submitted values win, so a failed submission never wipes the form.
  const initialValues = useMemo(() => toInitialValues(project), [project]);
  const values = state.values ?? initialValues;

  // Media lives in editor state so reordering is instant. The render-phase
  // adjustment below adopts the rows the server validated whenever a failed
  // submission returns them, exactly like the keyed inputs above.
  const [media, setMedia] = useState<ProjectMediaFormValues[]>(
    () => state.values?.media ?? initialValues.media,
  );
  const [syncedMedia, setSyncedMedia] = useState<ProjectMediaFormValues[]>(
    () => state.values?.media ?? initialValues.media,
  );

  const submittedMedia = state.values?.media ?? initialValues.media;

  if (submittedMedia !== syncedMedia) {
    setSyncedMedia(submittedMedia);
    setMedia(submittedMedia);
  }

  const hasError = (field: string) => (fieldErrors[field] ?? []).length > 0;
  const errorId = (field: string) => `${field}-error`;
  const describedBy = (field: string) =>
    hasError(field) ? errorId(field) : undefined;
  const controlClass = (field: string) =>
    hasError(field) ? invalidControlClassName : controlClassName;
  const checkboxClass = (field: string) =>
    hasError(field) ? invalidCheckboxClassName : checkboxClassName;
  const invalid = (field: string) => hasError(field) || undefined;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-1">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-200"
          >
            Title
          </label>
          <input
            key={`title-${values.title}`}
            id="title"
            name="title"
            defaultValue={values.title}
            aria-invalid={invalid("title")}
            aria-describedby={describedBy("title")}
            className={controlClass("title")}
            placeholder="Project title"
          />
          <FieldErrors id={errorId("title")} messages={fieldErrors.title} />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-slate-200"
          >
            Slug
          </label>
          <input
            key={`slug-${values.slug}`}
            id="slug"
            name="slug"
            defaultValue={values.slug}
            aria-invalid={invalid("slug")}
            aria-describedby={describedBy("slug")}
            className={controlClass("slug")}
            placeholder="video-platform"
          />
          <FieldErrors id={errorId("slug")} messages={fieldErrors.slug} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="excerpt"
            className="block text-sm font-medium text-slate-200"
          >
            Excerpt
          </label>
          <input
            key={`excerpt-${values.excerpt}`}
            id="excerpt"
            name="excerpt"
            defaultValue={values.excerpt}
            aria-invalid={invalid("excerpt")}
            aria-describedby={describedBy("excerpt")}
            className={controlClass("excerpt")}
            placeholder="Short public summary"
          />
          <FieldErrors id={errorId("excerpt")} messages={fieldErrors.excerpt} />
        </div>

        <div className="space-y-2 md:col-span-2">
          {/* Long-form copy: edited as Markdown and rendered by the site. */}
          <MarkdownField
            id="description"
            name="description"
            label="Description"
            defaultValue={values.description}
            projectSlug={values.slug}
            projectMedia={values.media}
            fieldErrors={fieldErrors}
            placeholder="Detailed project narrative"
          />
        </div>

        <div className="md:col-span-2">
          <ProjectMediaEditor
            media={media}
            onChange={setMedia}
            fieldErrors={fieldErrors}
            slugHint={values.slug}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label
            htmlFor="responsibilities"
            className="block text-sm font-medium text-slate-200"
          >
            Responsibilities
          </label>
          <textarea
            key={`responsibilities-${values.responsibilities}`}
            id="responsibilities"
            name="responsibilities"
            defaultValue={values.responsibilities}
            rows={6}
            aria-invalid={invalid("responsibilities")}
            aria-describedby={describedBy("responsibilities")}
            className={controlClass("responsibilities")}
            placeholder="One responsibility per line"
          />
          <FieldErrors
            id={errorId("responsibilities")}
            messages={fieldErrors.responsibilities}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-slate-200"
          >
            Status
          </label>
          {/* Keyed so a failed submission re-applies the submitted status. */}
          <select
            key={`status-${values.status}`}
            id="status"
            name="status"
            defaultValue={values.status}
            aria-invalid={invalid("status")}
            aria-describedby={describedBy("status")}
            className={controlClass("status")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <FieldErrors id={errorId("status")} messages={fieldErrors.status} />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label
            htmlFor="visibility"
            className="block text-sm font-medium text-slate-200"
          >
            Visibility
          </label>
          {/* Keyed so a failed submission re-applies the submitted visibility. */}
          <select
            key={`visibility-${values.visibility}`}
            id="visibility"
            name="visibility"
            defaultValue={values.visibility}
            aria-invalid={invalid("visibility")}
            aria-describedby={describedBy("visibility")}
            className={controlClass("visibility")}
          >
            <option value="PUBLIC">Public</option>
            <option value="UNLISTED">Unlisted</option>
            <option value="PRIVATE">Private</option>
          </select>
          <FieldErrors
            id={errorId("visibility")}
            messages={fieldErrors.visibility}
          />
        </div>

        <div className="space-y-2 md:col-span-1">
          <label
            htmlFor="publishedAt"
            className="block text-sm font-medium text-slate-200"
          >
            Published date
          </label>
          <input
            key={`publishedAt-${values.publishedAt}`}
            id="publishedAt"
            name="publishedAt"
            type="date"
            defaultValue={values.publishedAt}
            aria-invalid={invalid("publishedAt")}
            aria-describedby={describedBy("publishedAt")}
            className={controlClass("publishedAt")}
          />
          <FieldErrors
            id={errorId("publishedAt")}
            messages={fieldErrors.publishedAt}
          />
        </div>

        <div className="space-y-2 md:col-span-1 pt-8">
          <div className="flex items-center justify-start">
            <label className={checkboxClass("featured")}>
              <input
                key={`featured-${values.featured}`}
                type="checkbox"
                name="featured"
                defaultChecked={values.featured}
                aria-invalid={invalid("featured")}
                aria-describedby={describedBy("featured")}
                className={checkboxInputClassName}
              />
              Featured project
            </label>
          </div>
          <FieldErrors
            id={errorId("featured")}
            messages={fieldErrors.featured}
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-200">Technologies</p>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {technologyOptions.map((technology) => (
              <label
                key={technology.id}
                className={`${checkboxClass("technologyIds")} px-3 py-2 text-sm text-slate-200`}
              >
                <input
                  key={`${technology.id}-${values.technologyIds.includes(technology.id)}`}
                  type="checkbox"
                  name="technologyIds"
                  value={technology.id}
                  defaultChecked={values.technologyIds.includes(technology.id)}
                  aria-invalid={invalid("technologyIds")}
                  aria-describedby={describedBy("technologyIds")}
                  className={checkboxInputClassName}
                />
                {technology.name}
              </label>
            ))}
          </div>

          <FieldErrors
            id={errorId("technologyIds")}
            messages={fieldErrors.technologyIds}
          />
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

      {/* The media editor state travels with the form as a JSON payload. */}
      <input type="hidden" name="mediaJson" value={JSON.stringify(media)} />

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : project ? "Save changes" : "Create project"}
        </button>
      </div>
    </form>
  );
}
