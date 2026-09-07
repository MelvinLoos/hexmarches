# HexMarches

**Nuxt 3 + Supabase** Virtual Tabletop and Campaign Manager — built with Spec-Driven Development, strict TDD, and Clean Architecture.

[![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)](https://supabase.com)
[![Tests](https://img.shields.io/badge/tests-258%20passed-success)](https://github.com/MelvinLoos/hexmarches/actions)

---

## Quick Start

```bash
# Prerequisites: Docker, Node.js 20+, npm

# Clone and install
git clone git@github.com:MelvinLoos/hexmarches.git
cd hexmarches
npm install

# Copy environment template (defaults to local Supabase)
cp .env.example .env

# Start local Supabase (requires Docker running)
npx supabase start

# Run full verification suite (258 unit/integration + 7 E2E)
npm run verify

# Start development server
npm run dev
```

## Environment Setup

### Local Development (Docker + Supabase CLI)

The project ships with a fully containerized local Supabase stack via `npx supabase start`.
This provisions PostgreSQL, REST API, Auth, and Storage on `http://127.0.0.1:54321`.

```bash
npx supabase start        # Start all services
npx supabase status       # View connection URLs and API keys
npx supabase db reset     # Re-run all migrations + seed data
npx supabase stop         # Stop containers
```

`.env.example` is pre-configured for local development. The actual keys are
auto-generated on first `supabase start` — run `npx supabase status` to find them.

### Production / Cloud Supabase

Copy `.env.example` to `.env` and configure your remote Supabase project:

```bash
cp .env.example .env
```

| Variable | Description | Where to find it |
|---|---|---|
| `SUPABASE_URL` | Your project API URL | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_KEY` | Anon/public API key | Supabase Dashboard → Settings → API → `anon public` |
| `SUPABASE_SERVICE_KEY` | Service role key (server-only) | Supabase Dashboard → Settings → API → `service_role` |

> The `@nuxtjs/supabase` module reads these directly. Never commit `.env` — it's gitignored.

## Architecture

```
src/
├── core/
│   ├── domain/              # Pure TypeScript — business rules, zero deps
│   │   ├── wiki-node.ts     # WikiNode entity, ltree validation, WikiNodeType enum
│   │   ├── wiki-repository.ts   # Repository interface (port)
│   │   ├── asset-repository.ts  # Asset storage interface (port)
│   │   ├── milestones.ts    # Tier 1-3 progression, Character entity
│   │   └── vtt.ts           # Hex math (axial q,r), VTT payload types
│   └── application/
│       ├── wiki-service.ts  # CRUD orchestration, path generation
│       ├── asset-service.ts # Upload orchestration
│       └── outbox.ts        # LWW offline queue (IndexedDB outbox)
├── infrastructure/
│   └── supabase/
│       ├── adapter.ts       # Thin Supabase client wrapper
│       ├── auth.ts          # Auth composable (login/logout/session)
│       ├── wiki-repository.ts   # Supabase adapter: ltree, FTS, CRUD
│       └── storage-repository.ts# Supabase adapter: wiki-assets bucket
├── presentation/
│   ├── components/           # Vue SFCs (WikiNodeView, MonsterStatBlock, VttCanvas)
│   ├── markdown/
│   │   └── remark-wikilinks.ts  # [[Wiki-Link]] remark plugin
│   └── types/
│       └── wiki.ts           # Campaign Wiki node types (ltree paths)

tests/
├── unit/domain/              # Pure TypeScript — ltree, milestones, wiki-node
├── unit/application/         # Service-level tests (outbox, wiki-service)
├── unit/markdown/            # remark-wikilinks plugin tests
├── integration/              # Real Supabase + mocked client tests
├── components/               # Vue component tests (@vue/test-utils)
└── e2e/                      # Playwright browser tests
```

### Design Principles

- **Clean Architecture** — Domain layer has zero framework imports. Business rules live in pure TypeScript only.
- **TDD** — Every feature starts with a failing test. `npm test` must pass before commits.
- **Offline-First** — All mutations route through an IndexedDB outbox with Last-Write-Wins timestamp reconciliation.
- **Throttled VTT sync** — Canvas transforms are throttled at the application layer before broadcasting via Supabase Realtime.

## Infrastructure as Code

All database schema, RLS policies, and storage buckets are defined as
deterministic SQL migrations in `supabase/migrations/`.

| Migration | Purpose |
|---|---|
| `init_wiki` | Enable `ltree`, create `wiki_nodes` table, GIST+GIN indexes, FTS `search_wiki` RPC |
| `wiki_metadata_and_storage` | Add `entity_type` + `cover_image_url`, create `wiki-assets` bucket with RLS |
| `wiki_descendants_rpc` | `get_wiki_descendants` RPC for ltree `<@` queries |

`supabase/seed.sql` hydrates the database with 8 deterministic wiki nodes
(Campaign Root, Locations, Factions, NPCs, Dark Forest, The Harpers, etc.)
on every `db reset` — ensuring tests always run against known data.

## Features

| Context | Description |
|---|---|
| **Campaign Wiki** | Markdown editing with `md-editor-v3`, AST hydration via `@nuxtjs/mdc`, custom Vue components |
| **Hierarchical Wiki** | ltree path hierarchy, `[[Wiki-Link]]` resolution, descendant queries |
| **Full-Text Search** | PostgreSQL `tsvector` with ranked results and highlighted headlines |
| **Entity Types** | Six canonical types: GENERAL, LOCATION, NPC, FACTION, ITEM, QUEST |
| **Asset Storage** | Supabase Storage bucket (`wiki-assets`) with public-read RLS |
| **GM Toolkit** | `::gm-secret` blocks, cover image dropzone, entity type selector |
| **Real-Time VTT** | Hex grid rendering with `vue-konva` + `honeycomb-grid`, throttled Realtime sync |
| **Progression** | Milestone Tiering (T1: 0-3, T2: 4-9, T3: 10+) with pure domain logic |
| **Offline Queue** | IndexedDB LWW outbox — mutations survive network loss and reconcile on reconnect |
| **Auth** | Supabase Auth via `@nuxtjs/supabase` module |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Nuxt dev server |
| `npm run build` | Production build |
| `npm test` | Run all tests (Vitest) |
| `npm run verify` | Full pipeline: type-gen, all tests, production build |
| `npm run verify:e2e` | Playwright E2E tests only |
| `npm run test:watch` | Watch mode |
| `npm run test:unit` | Domain + Application tests only |
| `npm run test:integration` | Infrastructure tests (real Supabase) |
| `npm run test:components` | Vue component tests (jsdom) |
| `npx supabase start` | Start local Dockerized Supabase |
| `npx supabase db reset` | Re-apply all migrations + seed data |

## Tech Stack

**Core:** Nuxt 3, Vue 3, Supabase, `@nuxtjs/supabase`  
**Content:** `@nuxtjs/mdc`, `md-editor-v3`  
**VTT:** `konva`, `vue-konva`, `honeycomb-grid`  
**Offline:** `idb`, `@vite-pwa/nuxt`  
**Testing:** `vitest`, `@vue/test-utils`, `@nuxt/test-utils`, `@playwright/test`  
**Infrastructure:** `Docker`, `supabase` (CLI)

## License

MIT