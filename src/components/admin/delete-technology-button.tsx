"use client";

import { useActionState } from "react";

import type { TechnologyFormState } from "@/app/admin/technologies/actions";

type DeleteTechnologyButtonProps = {
  technologyId: string;
  technologyName: string;
  action: (
    state: TechnologyFormState,
    formData: FormData,
  ) => Promise<TechnologyFormState>;
};

const initialState: TechnologyFormState = { success: true, fieldErrors: {} };

export function DeleteTechnologyButton({
  technologyId,
  technologyName,
  action,
}: DeleteTechnologyButtonProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete "${technologyName}"? This action cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="technologyId" value={technologyId} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>

      {state.message ? (
        <p role="alert" className="text-sm text-red-300">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
