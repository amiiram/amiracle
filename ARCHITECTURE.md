# Amiracle Architecture

## 1. Overall architecture

This project is structured as a Next.js App Router application with a clear separation between the public portfolio experience and the future admin/CMS. The public surface is intentionally lightweight and server-first, while admin and data management responsibilities remain isolated so they can evolve without affecting public performance.

The current foundation is designed to support a future platform with:

- public content pages for portfolio, projects, and about information
- a custom admin application for content management
- database-backed persistence with Prisma + PostgreSQL
- server-side validation for CMS and mutation inputs
- an HMAC-signed session-cookie admin boundary (`AdminUser` model + login throttle)
- deployment on a Node host with Neon PostgreSQL and environment-based configuration

## 2. Folder responsibilities

- `src/app`: route boundaries and application entry points.
  - public pages (`/`, `/about`, `/contact`, `/projects/[slug]`, `/experience`, `/experience/[slug]`) with shared root layout, plus `sitemap.ts`, `robots.ts`, and generated OG images.
  - `admin`: authenticated CMS area — `/admin/login` plus the `(dashboard)` group (`/admin`, `/admin/projects`, `/admin/experience`, `/admin/technologies`, `/admin/settings`).
  - `api`: reserved for genuine HTTP endpoints only when necessary (currently `api/admin/media` for admin media uploads).
- `src/components`: reusable UI building blocks.
  - `admin`: CMS forms and primitives (`form-primitives`, `site-settings-form`, `social-link-form`, `delete-social-link-button`, `create-social-link-form`).
  - root: public chrome (`site-header`, `site-navigation`, `site-footer`, `theme-toggle`, `portfolio-motion`, `social-links`, `section-heading`, `not-found-terminal`).
- `src/lib`: application infrastructure.
  - `db`: Prisma access and database configuration.
  - `auth`: session-cookie authentication (`HMAC-SHA256` tokens in `index.ts`), `PBKDF2` password helpers (`password.mjs`), and the in-memory login throttle (`login-throttle.ts`).
  - `admin`: shared server-action helpers (`revalidate.ts` cache invalidation).
  - `media`: media URL validation (`media-url.ts`) and public media listing (`public-media.ts`).
  - `validations`: domain-specific Zod validation schemas (`site.ts`, `content.ts`, `form-state.ts`).
  - `env.ts`: environment parsing and safe access layers.
  - `portfolio-data.ts` + `portfolio-cache.ts`: cached public reads behind the shared `public-portfolio-data` tag.
  - `seo.ts`: per-page metadata builder, OG locale mapping, JSON-LD helpers.
  - `project-visibility.mjs`, `markdown.tsx`: visibility checks and Markdown rendering.
- `src/hooks`: client-side hooks only when needed.

This structure keeps responsibilities explicit without over-engineering the project.

## 3. Server vs Client Component rules

The default rule is: use Server Components unless browser interactivity, DOM access, or client-only APIs are required.

Use Server Components for:

- portfolio pages and content rendering
- database reads and server-side logic
- metadata generation
- data-fetching flows that belong on the server

Use Client Components only for:

- GSAP animation logic
- browser-only interactions
- client-side form handling or interactive UI widgets
- client-side state that cannot be handled by URL, server state, or forms

Avoid turning the app into a mostly-client application. The public portfolio should remain fast, simple, and resilient.

## 4. Database access strategy

Prisma is configured as the database access layer, with a single central client in `src/lib/db/prisma.ts`. All database access should flow through this client rather than being instantiated in multiple places.

The implemented schema is the baseline portfolio content schema. It contains exactly these models:

- `SiteSettings` - the application-enforced singleton row for site-wide configuration
- `SocialLink` - public social/profile links
- `Project` - portfolio projects, with `ProjectStatus` and `ProjectVisibility`
- `ProjectMedia` - ordered media references for a project
- `Technology` - reusable technology tags, related to projects through Prisma's implicit many-to-many join table `_ProjectToTechnology`
- `Experience`, `Education`, `Certification` - background and credentials

Notable schema details:

- The live tables are the eight models above plus Prisma's implicit `_ProjectToTechnology` join table.
- Date-only values (`Experience.startDate`/`endDate`, `Education.startDate`/`endDate`, `Certification.obtainedAt`/`expiresAt`) use PostgreSQL `DATE` columns through `DateTime @db.Date`.
- Long-form narratives are stored as Markdown text: `SiteSettings.aboutMarkdown`, `Project.description`, `Experience.description`, `Education.description`. `Project.responsibilities` is an ordered text array.
- `ProjectMedia` stores absolute URL references only; no binary media is stored in PostgreSQL.
- Schema changes are applied through versioned migrations in `prisma/migrations` (baseline: `20260917164548_init_portfolio_schema`), not through `db push`.

The schema deliberately contains no authentication, messaging/chat, blog, analytics, or notification models. Those features will need their own models and migration when they are actually implemented, so nothing in the schema claims to support them today.

### Project visibility contract

`Project.visibility` is part of the public read contract and must be applied by every public query path:

- `PUBLIC` - publicly reachable and included in listings, search, sitemap, and feeds.
- `UNLISTED` - publicly reachable by direct URL only, excluded from every enumeration, and served with `noindex`.
- `PRIVATE` - never publicly reachable; public detail routes must return not found.

Public detail queries require `status = published` and `visibility IN (PUBLIC, UNLISTED)`. Public listing, search, sitemap, feed, and related-project queries require `status = published AND visibility = PUBLIC`.

### Content invariants enforced in the application

- `Experience.isCurrent = true` requires `endDate = null`.
- `Experience` and `Education` require `endDate >= startDate` when an end date is present.
- `Certification` requires `expiresAt >= obtainedAt` when both are present.
- A `published` project always carries `publishedAt`; it is stamped when the project is published.
- `Project.slug` is normalized to lowercase kebab-case.
- Date-only fields are handled in UTC.
- The `SiteSettings` singleton always uses the id `site_settings`.

Database credentials are not exposed to the client. The application reads values from environment variables and should not connect to the database from browser code.

## 5. Authentication boundary

`src/lib/auth` implements the admin boundary with HMAC-SHA256 signed session
cookies (`amiracle_admin_session`, 12-hour TTL, `httpOnly` + `sameSite: lax`,
`secure` in production). Passwords are `PBKDF2-SHA256` hashes (210k
iterations) verified in constant time, with a dummy-hash burn on unknown
emails so response timing does not reveal whether an account exists. Login
attempts are throttled in memory per email+IP (5 failures per 15-minute
window); the throttle is per-instance and documents an external store
(Upstash Redis or similar) as the upgrade path for multi-instance deploys.

The single required credential is the seeded `AdminUser` row (created by
`prisma/seed.mjs` only when its email is absent; it never overwrites or
resets). Guards live server-side:

- `requireAdminSession()` runs in the `(dashboard)` layout and at the top of
  every admin server action.
- `getCurrentAdminUser()` is `cache()`-memoized per render pass so the layout
  plus each page/action share one admin-row query.
- already-authenticated visitors to `/admin/login` are redirected to `/admin`.

This keeps the security model straightforward and easy to extend if additional admin accounts are added later.

## 6. CMS boundary

The CMS lives in the same Next.js application under `src/app/admin` (no
separate service). It hosts:

- authenticated dashboard pages
- portfolio content management (projects, experience, technologies)
- project CRUD flows (including media ordering and publish toggles)
- site settings and social links (create/update/delete)

The custom CMS should remain a direct extension of the same app, not a disconnected system.

## 7. Animation strategy

GSAP is expected later for hero entrances, scroll-triggered reveals, project motion, and brief micro-interactions. The animation logic is intentionally isolated so it does not mingle with business logic or the data layer.

The recommended future structure is to place GSAP helpers and custom hooks under `src/animations` and keep them inside client-side components only when browser rendering demands it.

This preserves a clear separation between content/data logic and timing-driven visual behavior.

## 8. Environment variables

The app uses a dedicated `.env.example` file with placeholders only. Sensitive values should never be committed to the repository.

Expected variable names include:

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXTAUTH_SECRET` (reserved for the future auth work)
- `NEXTAUTH_URL` (reserved for the future auth work)
- `NODE_ENV`

This keeps the environment setup predictable for local development and Vercel deployment.

## 9. Deployment assumptions

Deployment is expected to target Vercel, with PostgreSQL served through a managed provider such as Supabase. The app should be configured for a production-ready setup with environment variables injected at runtime and a single Prisma client used in the server environment. Schema changes are applied with `prisma migrate deploy` as part of the deployment flow.

The architecture does not assume a large-scale system or microservice topology. It is intentionally designed for a single Next.js app with a clean internal boundary between public, admin, and data layers.

## 10. Git workflow

This project uses GitHub Flow rather than full GitFlow. The repository is intentionally small, the team is small, and the product is a single app with fast iteration cycles.

Rules for this repository:

- Default branch: `main`.
- Create a short-lived feature branch for each task: `feature/<short-description>`.
- Keep `main` production-ready and merge through a pull request after validation.
- Use `hotfix/<short-description>` only for urgent production fixes.
- Keep commits small and descriptive; do not mix unrelated changes in one commit.
- Run lint/build validation before merging to `main`.
- Prefer the simplest branch model that supports the actual project size and team structure.

This is the standard workflow for a solo or small-team portfolio codebase and avoids unnecessary release-branch management. Future AI agents working in this repo should follow GitHub Flow and avoid creating long-lived `develop` or release branches unless the project grows materially.

## Key architectural decisions

- Server-first architecture with minimal client JavaScript in the public site.
- Single database layer through Prisma rather than repeated ad hoc DB calls.
- App Router structure with route groups for public and admin concerns.
- Domain-based validation using Zod, aligned with the Prisma schema and the invariants above.
- Versioned Prisma migrations as the source of truth for the database schema.
- A `SiteSettings` singleton enforced by application convention.
- Explicit project visibility semantics that every public query must apply.
- Deliberate omission of authentication, chat, blog, analytics, and binary media models.
- Deliberate omission of unnecessary abstractions and libraries.
- Clear separation of responsibilities to support future features without a large rebuild.
