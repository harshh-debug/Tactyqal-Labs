# Tactyqal Labs · hire-a-thon concept

| Entry | Local demo | Public demo |
| --- | --- | --- |
| **Task 1 — eight-week product studio** | [Homepage](http://localhost:3000) | Pending Vercel project access |
| **Task 2 — publication and editorial studio** | [Fieldnotes](http://localhost:3001/blog) · [Editor login](http://localhost:3001/studio/login) | Pending Neon, Render and Vercel access |

**GitHub:** remote setup pending; the supplied `.git` directory has no usable metadata and is mounted read-only in this session. **Recording:** pending the live editorial verification. These are submission concepts, not the official Tactyqal website.

## Start locally

Requires Node **24** (`.nvmrc` records 24.13.0), pnpm **11.25.0**, and PostgreSQL **17**. Docker Compose is provided. The canonical briefs are in **[docs/content/](docs/content/)**.

```sh
corepack enable
pnpm install --frozen-lockfile
cp apps/homepage/.env.example apps/homepage/.env.local
cp apps/blog-web/.env.example apps/blog-web/.env.local
cp apps/blog-api/.env.example apps/blog-api/.env
```

Set a demo-only email and a password of at least 12 characters and at most 72 UTF-8 bytes in the API `.env`. Keep it private. Then:

```sh
docker compose up -d postgres
pnpm --filter @tactyqal/contracts build
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open ports **3000** (homepage), **3001** (blog), and **4000** (API). The API loads its own `.env`; Next loads each frontend's `.env.local`. Migration and seeding are deliberate commands, separate from app startup. Seeds preserve existing records and editor passwords; avoid reseeding after review has begun if you want deleted fixture posts to stay deleted.

Task 1 works independently, including with the database and API stopped:

```sh
pnpm dev:homepage
```

For separate terminals, use `pnpm dev:api` and `pnpm dev:blog`. The root `dev` script builds contracts before starting all watchers. Without `BLOG_WEB_URL`, homepage blog links deliberately use the existing public Tactyqal blog; resource cards always use curated external references and never fetch blog data.

## Architecture

```text
apps/homepage       Next.js App Router, typed local content; no API dependency
apps/blog-web       Next.js public SSR pages + same-origin editorial Server Actions
apps/blog-api       Express 5: authorization, validation, transactions, PostgreSQL
packages/contracts Zod request validation and shared API types
packages/design-tokens Shared CSS color variables consumed by both frontends
docs/content       The three supplied briefs
```

The browser submits to Next.js. Next keeps an opaque session in a host-only HttpOnly cookie and forwards it as Bearer authorization to Express. Express checks hashed, expiring PostgreSQL sessions on every protected operation. Passwords use bcrypt with cost 12. There is no browser credential CORS path, public signup, or client-visible API token.

Public and editorial data requests explicitly use `no-store`. Public links make full navigations, and successful editorial mutations revalidate the affected routes and refresh the studio. This favors immediate publication visibility over caching. An upstream outage shows a retryable error; it is not treated as an absent article.

**Article HTTP status:** `/blog/[slug]` resolves its article in blocking metadata and the page before streaming. `htmlLimitedBots: /.*/` applies blocking metadata to ordinary browsers too. The archive's loading boundary is inside its own route group; no article ancestor has a loading/Suspense boundary. Missing and unpublished API records map to `notFound()`. The browser smoke asserts actual HTTP **404**, including after unpublishing and deletion.

Slugs are unique across drafts and published posts. Draft slugs can change until first publication; that first publication permanently locks the URL. Unpublishing clears the current publication date; republishing assigns a new one while preserving the first publication date. SQL constraints and transactions support these rules.

The editor provides explicit save, publish, unpublish, and confirmed delete actions. Markdown preview disables raw HTML, unsafe URL schemes, and remote images. Covers come from the repository. Published content is original synthetic material; no WordPress articles were imported.

See [API contract](docs/openapi.json), [deployment](docs/DEPLOYMENT.md), [verification evidence](docs/qa/README.md), and [asset credits](docs/ASSET-CREDITS.md).

## Checks

```sh
pnpm --filter @tactyqal/contracts build
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The integration suite requires a **separate test database**; it never falls back to `DATABASE_URL`. It creates a random schema in that database and drops only that schema afterward. Test database names must contain a separate `test` segment, such as `tactyqal_test`. Use a direct connection rather than a transaction-pooled connection for these schema-isolated tests.

```sh
docker compose --profile test up -d postgres-test
# Create apps/blog-api/.env.test containing:
# TEST_DATABASE_URL=postgresql://tactyqal:local-development-only@localhost:5433/tactyqal_test
pnpm test:integration
```

Integration scenarios cover authorization, session expiry/revocation, field validation, private drafts, literal search, pagination, slug collisions/races, slug locking, persistence through a separate connection, publish/unpublish/republish, atomic failed saves, deletion, and seed safety.

The browser smoke needs all three apps running, a seeded database, and private demo credentials in its process environment:

```sh
pnpm exec playwright install chromium
# Export DEMO_EDITOR_EMAIL and DEMO_EDITOR_PASSWORD privately.
pnpm test:browser
```

Run `node scripts/start-and-smoke.mjs` after a production build to start owned production servers against `TEST_DATABASE_URL`, migrate/seed that isolated database, and execute the same smoke. This helper is intended for CI or a disposable local test database. GitHub Actions supplies PostgreSQL and runs the complete pipeline.

## Reviewer walkthrough

1. Homepage: program audience and outcome, project examples, eight-week milestones, mobile layout, and consultation handoff.
2. Fieldnotes: topic filter, search URL, long article, author/date and contents links.
3. Sign in with privately shared demo access. Create a fresh disposable draft, reload it, edit, publish, inspect signed out, unpublish, and delete.
4. Show migrations, API contract, verification results, and both HTTPS URLs. The suggested three-minute recording outline is in the deployment brief.

## Current verification and access limits

Production builds, lint, typechecks and five contract tests pass. Homepage production HTML has been visually reviewed at desktop and mobile sizes; screenshots and the precise scope of that review are documented in `docs/qa/README.md`.

This execution environment blocks external package downloads, listening ports and Docker access. Dependencies were recovered from existing local caches. The isolated Compose test connection is configured in an ignored `apps/blog-api/.env.test`, but `docker compose --profile test up -d postgres-test` was denied access to `/var/run/docker.sock`; no test database was created. The integration suite was attempted and its setup failed with `connect EPERM 127.0.0.1:5433`. API integration, real HTTP 404 checks and the complete browser editorial loop remain **pending**, not passed. Provider deployments, actual demo URLs, GitHub publication and recording also remain pending access.

Material departures from the briefs: the API currently uses parameterized `pg` queries and checked-in SQL migrations instead of Drizzle; bcrypt replaces the planned Argon2id choice; locally licensed Manrope substitutes for unavailable Instrument Sans. Bricolage Grotesque, the specified palette, program/content boundaries, app separation and deployment topology are preserved. See [implementation notes](docs/IMPLEMENTATION-NOTES.md).
