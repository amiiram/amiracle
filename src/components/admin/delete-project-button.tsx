"use client";

type DeleteProjectButtonProps = {
  projectId: string;
  action: (formData: FormData) => Promise<void>;
};

export function DeleteProjectButton({
  projectId,
  action,
}: DeleteProjectButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm("Delete this project? This action cannot be undone.")
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        className="w-full rounded-full border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
      >
        Delete
      </button>
    </form>
  );
}
