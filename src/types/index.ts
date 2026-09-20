import type {
  Locale,
  ProjectStatus,
  ProjectVisibility as PrismaProjectVisibility,
  ThemeMode,
} from "@prisma/client";

/** Lifecycle status of CMS-managed content. Mirrors the Prisma `ProjectStatus` enum. */
export type EntityStatus = ProjectStatus;

/** Supported public locales. Mirrors the Prisma `Locale` enum. */
export type SiteLocale = Locale;

/** Site-wide theme preference. Mirrors the Prisma `ThemeMode` enum. */
export type SiteThemeMode = ThemeMode;

/** Public reachability of a project. Mirrors the Prisma `ProjectVisibility` enum. */
export type ProjectVisibility = PrismaProjectVisibility;
