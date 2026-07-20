# Tests

Playwright-driven test suite for Swarms Cloud. Lives outside `app/` so it
never ships in a production bundle.

```
tests/
├── global-setup.ts  Loads .env into process.env
├── e2e/             Browser flows - drives Chromium as a real user
├── api/             HTTP tests against the Next.js /api/* routes
└── README.md
```

## Quick start

```bash
# One-time browser install
pnpm exec playwright install chromium --with-deps

# Run everything (boots `pnpm dev` automatically and reuses an existing
# dev server if one is already on :3000)
pnpm test

# Buckets
pnpm test:e2e         # only browser flows
pnpm test:api         # only HTTP tests

# Tools
pnpm test:ui          # Playwright UI mode - pick and replay tests
pnpm test:report      # open the last HTML report
```

## Environment

`tests/global-setup.ts` parses `.env` and seeds `process.env` before
any worker starts. Real shell env wins; `.env` fills in the gaps. Empty
values are treated as "not set" so a placeholder `SWARMS_API_KEY=""`
doesn't shadow a real shell value. The loader prints a one-line summary
at startup:

```
[playwright] env loaded - .env: 4, SWARMS_API_KEY: present
```

The two API suites that talk to the live Swarms API
(`tests/api/cache-headers.spec.ts` and `tests/api/integration.spec.ts`)
**skip automatically** when `SWARMS_API_KEY` is missing. This keeps the
suite from burning credits or failing for contributors without a key.

## Running against a production build

```bash
PLAYWRIGHT_USE_BUILD=1 pnpm test
```

This runs `next build && next start` instead of `next dev`. Two practical
differences:

- **Cache headers test** is stricter - it asserts the second consecutive
  request to a cached endpoint returns `X-Cache: HIT`. In `next dev`,
  HMR can re-evaluate route modules between requests and drop the
  in-memory cache, so dev-mode runs only verify that the header is
  emitted at all.
- More representative of what Vercel deploys.

## Running against an existing server

If you already have a server running (e.g. you ran `pnpm dev` in another
terminal), skip the auto-launched `webServer` block:

```bash
PLAYWRIGHT_NO_SERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test
```

## Running one file

```bash
pnpm exec playwright test tests/e2e/navigation.spec.ts
pnpm exec playwright test tests/api/auth.spec.ts
```

Add `--headed` to watch tests run in a visible browser, `--debug` to
step through with the Playwright Inspector, or `--workers=1` to disable
parallelism while debugging.

## Conventions

- **`e2e/`** describes *user* actions ("opens command palette", "filters
  the apps directory") and asserts on what the user sees, not on
  implementation details. Helpers in `e2e/_helpers.ts` seed the Zustand
  store so the API-key gate doesn't block navigation tests.
- **`api/`** uses Playwright's `request` fixture to hit `/api/*` routes
  directly. No browser, much faster. Split into:
  - `auth.spec.ts` - every protected route 401s without `x-api-key`.
  - `validation.spec.ts` - POST routes 400 on malformed input, never
    reaching upstream.
  - `cache-headers.spec.ts` - `X-Cache`, `X-Cache-Expires-In`, and
    `?refresh=1` behavior. Requires a key, runs serially.
  - `integration.spec.ts` - live happy paths for read-only endpoints.
    Requires a key. Intentionally skips paid POST endpoints.

## Artifacts

`playwright-report/` (HTML report) and `test-results/` (traces,
screenshots, videos) are git-ignored. Open the HTML report after a
failure:

```bash
pnpm test:report
```

## Troubleshooting

**`ERR_CONNECTION_REFUSED` on every navigation test.** Your `pnpm dev`
server died - usually after a Ctrl-C of an earlier test run leaked a
half-killed process. Stop any orphan processes and re-run:

```bash
pkill -f 'next-server\|next dev' ; pnpm test
```

**Cache tests fail with "Received: MISS" in dev.** Expected. See
*Running against a production build* above.

**Integration tests all skip.** The env loader didn't find a
non-empty `SWARMS_API_KEY` in `.env`. Check the
`[playwright] env loaded …` line at the top of the run output - it
reports presence without leaking the value.
