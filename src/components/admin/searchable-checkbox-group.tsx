"use client";

import { useState } from "react";

import { controlClassName } from "@/components/admin/form-primitives";

export type CheckboxOption = {
  id: string;
  label: string;
  searchText?: string;
};

export function SearchableCheckboxGroup({
  id,
  name,
  label,
  options,
  selectedIds,
  errorId,
  errors,
}: {
  id: string;
  name: string;
  label: string;
  options: CheckboxOption[];
  selectedIds: string[];
  errorId: string;
  errors?: string[];
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matchingOptions = options.filter((option) =>
    `${option.label} ${option.searchText ?? ""}`
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-slate-200">{label}</legend>

      <label
        htmlFor={`${id}-search`}
        className="block text-xs font-medium text-slate-400"
      >
        Search {label.toLocaleLowerCase()}
      </label>
      <input
        id={`${id}-search`}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        className={controlClassName}
        aria-label={`Search ${label.toLocaleLowerCase()}`}
      />

      {options.length > 0 ? (
        <div
          className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-3 sm:grid-cols-2"
          aria-describedby={errors?.length ? errorId : undefined}
        >
          {options.map((option) => (
            <label
              key={option.id}
              hidden={!matchingOptions.some((match) => match.id === option.id)}
              className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-200"
            >
              <input
                key={`${option.id}-${selectedIds.includes(option.id)}`}
                type="checkbox"
                name={name}
                value={option.id}
                defaultChecked={selectedIds.includes(option.id)}
                aria-invalid={errors?.length ? true : undefined}
                aria-describedby={errors?.length ? errorId : undefined}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-900 text-white"
              />
              <span className="min-w-0 break-words">{option.label}</span>
            </label>
          ))}
          {matchingOptions.length === 0 ? (
            <p className="text-sm text-slate-500">
              No matches. Try a different search.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
          No options are available yet. This selection can stay empty.
        </p>
      )}

      {errors?.map((error, index) => (
        <p
          key={`${errorId}-${index}`}
          id={index === 0 ? errorId : undefined}
          className="text-sm text-red-300"
        >
          {error}
        </p>
      ))}
    </fieldset>
  );
}
