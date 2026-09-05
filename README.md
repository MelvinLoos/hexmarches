# HexMarches

**Nuxt 3 + Supabase** Virtual Tabletop and Campaign Manager — built with Spec-Driven Development, strict TDD, and Clean Architecture.

[![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00DC82?logo=nuxt.js)](https://nuxt.com)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)](https://supabase.com)
[![Tests](https://img.shields.io/badge/tests-96%20passed-success)](https://github.com/MelvinLoos/hexmarches/actions)

---

## Quick Start

```bash
# Clone and install
git clone git@github.com:MelvinLoos/hexmarches.git
cd hexmarches
npm install

# Copy environment template and fill in your Supabase credentials
cp .env.example .env

# Run tests (96/96 should pass)
npm test

# Start development server
npm run dev
```

## Environment Setup

Copy `.env.example` to `.env` and configure your Supabase project:

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
│   │   ├── milestones.ts    # Tier 1-3 progression, Character entity
│   │   └── vtt.ts           # Hex math (axial q,r), VTT payload types
│   └── application/
│       └── outbox.ts        # LWW offline queue (IndexedDB outbox)
├── infrastructure/
│   └── supabase/
│       ├── adapter.ts       # Thin Supabase client wrapper
│       └── auth.ts          # Auth composable (login/logout/session)
└── presentation/
    ├── components/           # Vue SFCs (WikiNodeView, MonsterStatBlock, VttCanvas)
    └── types/
        └── wiki.ts           # Campaign Wiki node types (ltree paths)

tests/
├── unit/                     # Domain + Application tests (Vitest)
├── integration/              # Infrastructure tests (mocked Supabase)
└── components/               # Vue component tests (@vue/test-utils)
```

### Design Principles

- **Clean Architecture** — Domain layer has zero framework imports. Business rules live in pure TypeScript only.
- **TDD** — Every feature starts with a failing test. `npm test` must pass before commits.
- **Offline-First** — All mutations route through an IndexedDB outbox with Last-Write-Wins timestamp reconciliation.
- **Throttled VTT sync** — Canvas transforms are throttled at the application layer before broadcasting via Supabase Realtime.

## Features

| Context | Description |
|---|---|
| **Campaign Wiki** | Markdown editing with `md-editor-v3`, AST hydration via `@nuxtjs/mdc`, custom Vue components |
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
| `npm run test:watch` | Watch mode |
| `npm run test:unit` | Domain + Application tests only |
| `npm run test:integration` | Infrastructure tests (mocked Supabase) |
| `npm run test:components` | Vue component tests (jsdom) |

## Tech Stack

**Core:** Nuxt 3, Vue 3, Supabase, `@nuxtjs/supabase`  
**Content:** `@nuxtjs/mdc`, `md-editor-v3`  
**VTT:** `konva`, `vue-konva`, `honeycomb-grid`  
**Offline:** `idb`, `@vite-pwa/nuxt`  
**Testing:** `vitest`, `@vue/test-utils`, `@nuxt/test-utils`, `msw`

## License

MIT