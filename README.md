# Swarms Cloud

**Build, deploy, and scale multi-agent systems for any application.**

Swarms Cloud is the operator console for the Swarms API - an enterprise-grade
control plane for designing, executing, and observing single agents, reasoning
agents, and multi-agent swarms across 17+ orchestration architectures. It pairs
a production-ready Rust agent runtime on the back end with a fast, themeable
Next.js front end on the desk.

---


Swarms Cloud is the official browser-based console for the Swarms API. It
provides a single workspace for the full multi-agent lifecycle - agent
authoring, model selection, swarm composition, execution, telemetry,
rate-limit and credit monitoring, and cost forecasting.

The application is a Next.js 15 App Router project running on React 19 and
TypeScript 5.7, styled with TailwindCSS 3.4 and a semantic, token-driven
design system that supports light and dark themes out of the box.

## Capabilities

**Multi-agent orchestration**

- Author and persist agent configurations against the Swarms API
- Browse all 17+ supported swarm architectures from `/v1/swarms/available`
  (Hierarchical, Sequential, Concurrent, Mixture of Agents, Council as a
  Judge, Debate with Judge, Multi-Agent Router, Auto Swarm Builder, Heavy
  Swarm, Batched Grid Workflow, and more)
- Browse the live model catalog from `/v1/models/available` across GPT,
  Claude, Gemini, Llama, and other supported providers

**Operations and observability**

- Real-time rate-limit, tier, and limit-configuration dashboard
- API request log explorer backed by `/v1/swarm/logs` with search, pagination,
  and per-request input/output/usage breakdown
- Credit balance breakdown (paid, free, referral) with low-balance warnings

**Cost intelligence**

- Token-based pricing calculator covering unified pricing, agent cost, image,
  MCP, Exa search, web-scraper add-ons, the night-time discount, and Frenzy
  Mode

**UX**

- Command-palette nav search (Cmd+K / Ctrl+K) across every page
- Themeable: light, dark, and system, persisted client-side
- Fully responsive, with safe-area-aware layouts for notched devices

## Architecture

```
Browser  ──►  Next.js App Router (React 19, RSC + Client Components)
              │
              ├── /app/api/*          Server routes (Node runtime)
              │     ├── credits       24 h TTL, per-key in-memory cache
              │     ├── logs          30 s TTL, per-key in-memory cache
              │     ├── models        10 h TTL, per-key in-memory cache
              │     ├── swarms        10 h TTL, per-key in-memory cache
              │     ├── rate-limits   no cache
              │     └── agents/list   on-demand
              │
              └── lib/api/swarms-client.ts
                      │
                      ▼
              Swarms API (https://api.swarms.world)
              x-api-key header authentication
```

Every API route reads the Swarms API key from either the incoming
`x-api-key` header (when the user has provided one in Settings) or
`process.env.SWARMS_API_KEY` as a fallback. The key never reaches the
browser; the client speaks only to the Next.js routes.

State is managed with Zustand stores:

- `lib/store/ui-store.ts` - UI state, toasts, API key, theme
- `lib/store/agent-store.ts` - local agent metadata and execution history

## Prerequisites

- Node.js 18.18 or newer
- pnpm 9.x (the project pins `pnpm@9.12.2` via the `packageManager` field)
- A Swarms API key from
  [swarms.world/platform/api-keys](https://swarms.world/platform/api-keys)

## Installation

```bash
git clone <repository-url>
cd orchestrate
pnpm install
```

## Environment

Create `.env` at the project root and populate the variables you need.
None are strictly required at boot - the app will prompt for an API key on
first load if `SWARMS_API_KEY` is unset - but production deployments should
configure all of the relevant ones.

```dotenv
# Required at runtime if you want a default key (otherwise the user supplies it)
SWARMS_API_KEY=sk-...

# Override the Swarms API host (default: https://api.swarms.world)
SWARMS_API_BASE_URL=https://api.swarms.world

# Used for absolute canonical URLs in metadata, OpenGraph, Twitter, and sitemap
NEXT_PUBLIC_SITE_URL=https://cloud.swarms.ai

# Optional: Vercel sets this automatically; used as a fallback for canonical URLs
# NEXT_PUBLIC_VERCEL_URL is read automatically when present
```

The application reads `NEXT_PUBLIC_SITE_URL` first, falls back to
`NEXT_PUBLIC_VERCEL_URL`, and finally defaults to `https://swarms.ai` for SEO
metadata.

## Running locally

```bash
pnpm dev
```

The dev server boots on [http://localhost:3000](http://localhost:3000).

If `SWARMS_API_KEY` is unset, the `ApiKeyGate` component prompts for a key on
first load and persists it to local storage. The key is sent on every request
to `/api/*` via the `x-api-key` header.


## API integration

`lib/api/swarms-client.ts` exposes a typed `SwarmsAPIClient` with one method
per endpoint:

```ts
const client = new SwarmsAPIClient(apiKey);
await client.executeAgent(config, task, options);
await client.executeBatch(requests);
await client.listAgentConfigs();
await client.getRateLimits();
await client.getCredits();
await client.getAvailableModels();
await client.getAvailableSwarmTypes();
await client.getSwarmLogs();
await client.checkHealth();
```

All methods normalize errors through a shared `parseError` / `toAPIError`
pipeline that surfaces friendly messages for 401, 403, and 429 responses.

Reference documentation:
[docs.swarms.ai](https://docs.swarms.ai).


## Scripts

```bash
pnpm dev          # Start the Next.js dev server
pnpm build        # Production build
pnpm start        # Run the production server (after build)
pnpm lint         # Run ESLint
pnpm type-check   # Run tsc --noEmit
```

## Production builds

```bash
pnpm build
pnpm start
```

The build emits a mix of statically prerendered routes (dashboard, agents,
models, swarms, pricing, history, settings, workbench) and dynamic routes
(`/playground`, all `/api/*`). Static assets and the build output live in
`.next/`.

## Troubleshooting

**`MODULE_NOT_FOUND` or `ENOENT` on chunk files in dev**

The dev server is reading stale `.next` artifacts left over from a previous
`pnpm build`. Stop `pnpm dev`, then:

```bash
rm -rf .next node_modules/.cache
pnpm dev
```

**`401 / 403` responses from `/api/*`**

The Swarms API key is missing, invalid, or lacks permission. Confirm
`SWARMS_API_KEY` in `.env` or update the key from Settings.

**Credits or models look stale**

Both endpoints cache aggressively (24 h and 10 h respectively). Click the
Refresh button on the page - the UI calls the route with `?refresh=1`, which
bypasses the cache.

**Build fails with `useSearchParams() should be wrapped in a suspense
boundary`**

The route reads `useSearchParams` at module scope. Either wrap the consumer
in `<Suspense>` or add `export const dynamic = 'force-dynamic'` to the
route's `layout.tsx` (as `/playground/layout.tsx` does).

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE) for
the full text.

The Swarms API, brand, and trademarks are owned by The Swarm Corporation. Use
of the Swarms API is governed by [swarms.world](https://swarms.world)'s terms
of service.
