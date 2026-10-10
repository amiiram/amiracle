import { Locale, ThemeMode } from "@prisma/client";

import {
  createSocialLinkAction,
  updateSiteSettingsAction,
  updateSocialLinkAction,
} from "@/app/admin/settings/actions";
import { CreateSocialLinkForm } from "@/components/admin/create-social-link-form";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { SocialLinkForm } from "@/components/admin/social-link-form";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { SITE_SETTINGS_ID } from "@/lib/validations/site";

const statusMessages: Record<string, string> = {
  saved: "Settings saved.",
  "link-saved": "Social link saved.",
};

const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "French",
  de: "German",
  es: "Spanish",
};

const themeModeLabels: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const localeOptions = Object.values(Locale).map((value) => ({
  value,
  label: localeLabels[value],
}));

const themeModeOptions = Object.values(ThemeMode).map((value) => ({
  value,
  label: themeModeLabels[value],
}));

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await requireAdminSession();

  const [params, settings, socialLinks] = await Promise.all([
    searchParams,
    // Singleton: every read targets the `site_settings` row.
    prisma.siteSettings.findUnique({ where: { id: SITE_SETTINGS_ID } }),
    prisma.socialLink.findMany({ orderBy: { platform: "asc" } }),
  ]);

  const status = readSearchParam(params.status);
  const statusMessage = status ? statusMessages[status] : undefined;

  return (
    <main className="space-y-6">
      {statusMessage ? (
        <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {statusMessage}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Settings
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Site settings
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          The site keeps a single settings record, so saving here always updates
          that record.
        </p>

        <div className="mt-6">
          <SiteSettingsForm
            action={updateSiteSettingsAction}
            settings={{
              siteName: settings?.siteName ?? "",
              tagline: settings?.tagline ?? "",
              description: settings?.description ?? "",
              email: settings?.email ?? "",
              defaultLocale: settings?.defaultLocale ?? Locale.en,
              themeMode: settings?.themeMode ?? ThemeMode.system,
              aboutMarkdown: settings?.aboutMarkdown ?? "",
            }}
            localeOptions={localeOptions}
            themeModeOptions={themeModeOptions}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Social
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Social links</h2>
        <p className="mt-2 text-sm text-slate-400">
          Social links are stored as their own records, so they are managed
          separately from the site settings above. The platform of an existing
          link is fixed; its URL, label, and visibility can be edited.
        </p>

        <div className="mt-6 space-y-4">
          <CreateSocialLinkForm action={createSocialLinkAction} />

          {socialLinks.map((link) => (
            <SocialLinkForm
              key={link.id}
              action={updateSocialLinkAction}
              link={{
                id: link.id,
                platform: link.platform,
                url: link.url,
                label: link.label ?? "",
                isVisible: link.isVisible,
              }}
            />
          ))}

          {socialLinks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center text-slate-400">
              No social links found.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
