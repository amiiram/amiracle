# Amiracle

Amiracle is a Next.js portfolio with a PostgreSQL database and a protected
admin area for managing site settings, social links, technologies, projects,
and experience.

## Requirements

- Node.js 20 or newer
- PostgreSQL

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and configure the required values:
   - `DATABASE_URL`: PostgreSQL runtime connection string.
   - `DATABASE_URL_UNPOOLED`: direct PostgreSQL connection string for Prisma
     migrations. For local PostgreSQL, this can be the same as `DATABASE_URL`.
   - `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`: initial admin account;
     use a unique password of at least 16 characters.
   - `ADMIN_SESSION_SECRET`: a cryptographically random secret of at least 32
     characters. `NEXTAUTH_SECRET` is accepted as a fallback.
   - `NEXT_PUBLIC_SITE_URL`: optional canonical site URL. Use HTTPS for a
     production host; localhost is allowed for local development/builds.
3. Generate the Prisma client with `npm run db:generate`.
4. Apply the committed migrations and create the initial admin with
   `npm run db:setup`.
5. Start the site with `npm run dev`.

The seed command creates an admin account only when its email is not already
present. It does not update existing user credentials or modify portfolio
content. Configure seed values before running it. Never use example credentials
for a public deployment.

## Production

For Neon, create a production database and copy both connection strings from
the Neon dashboard's **Connect** dialog:

- Set `DATABASE_URL` to the pooled connection string for the app runtime. The
  hostname should include `-pooler`.
- Set `DATABASE_URL_UNPOOLED` to the direct, non-pooled connection string.
  Prisma uses it for schema and migration operations.

Add both database variables, along with `ADMIN_EMAIL`, `ADMIN_USERNAME`,
`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and `NEXT_PUBLIC_SITE_URL`, to the
hosting provider's production environment. Keep both database URLs secret and
do not commit them to the repository.

Use a new, empty Neon database or branch for the first deployment: the
committed migrations create the schema and are not a baseline for an existing
database. Before directing production traffic to the deployment, run
`npm run db:migrate` with `DATABASE_URL_UNPOOLED` configured for that database.
Run `npm run db:seed` once with the initial admin credentials configured; the
seed is repeatable and does not reset the database.

Run `npm run build` to create a production build and `npm run start` to serve
it. Do not use `npm run db:push` for production; use the checked-in migration
history.

## Content management

Use `/admin` to manage projects, experience, technologies, site settings, and
visible social links (including adding the first link). Only published
projects with `PUBLIC` visibility appear on the public pages. Experience
records are managed at `/admin/experience`, listed at `/experience`, and have
individual `/experience/<slug>` pages. Experience records have no publication
or visibility flag, so every saved experience is public. Their descriptions
are Markdown rendered as escaped React elements; raw HTML is not executed.
Technologies reuse the existing Technology records. Related project previews
and links include only projects with `published` status and `PUBLIC` visibility;
unlisted, private, draft, and archived projects remain hidden. Education is
read from its Prisma model but has no admin editor. No sample profile,
experience, project claims, or external profile links are preloaded by the
application.

The experience-details migration adds a unique slug and backfills existing
records from their role and company with a stable ID suffix. It also adds
optional many-to-many links to existing projects and technologies without
changing or deleting those records.

Project media must be committed below `public/media/` and referenced by its
application-relative URL (for example `/media/projects/example/cover.webp`).
Do not select sample/placeholder files as portfolio work.

## Validation

- `npm run lint`
- `npx tsc --noEmit`
- `npx prisma validate`
- `npm test`
- `npm run build`
