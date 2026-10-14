"use client";

type DeleteSocialLinkButtonProps = {
  linkId: string;
  platform: string;
  action: (formData: FormData) => Promise<void>;
};

/**
 * Standalone delete form for a social link, with a native confirm guard.
 * Kept separate from `SocialLinkForm` so the update form's `useActionState`
 * never shares state with the destructive action.
 */
export function DeleteSocialLinkButton({
  linkId,
  platform,
  action,
}: DeleteSocialLinkButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete the "${platform}" social link? This action cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="linkId" value={linkId} />
      <button
        type="submit"
        className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:bg-red-500/20"
      >
        Delete
      </button>
    </form>
  );
}
