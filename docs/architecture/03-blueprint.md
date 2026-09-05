# Phase 3: Technical Blueprint (Clean Architecture)

## 3.1 Clean Architecture Layers
1. **Domain Layer (Entities & Rules):** Pure TypeScript. Contains Milestone Tiering calculation logic and Hex Grid coordinate boundaries[cite: 1]. 100% test coverage required before Nuxt integration.
2. **Application Layer (Use Cases):** Orchestrates domain rules (e.g., `UpdateCharacterMilestones`, `BroadcastVttTransform`).
3. **Infrastructure Layer (Adapters):** Nuxt Server API routes, Supabase Client SDK, IndexedDB wrappers, `@nuxtjs/mdc` custom parsers[cite: 1]. Handles database mutations and WebSocket channels[cite: 1].
4. **Presentation Layer (UI/Vue):** Nuxt 3 pages, `md-editor-v3` integration, and `vue-konva` rendering[cite: 1].

## 3.2 Offline Sync Architecture: LWW CRDT
The IndexedDB Outbox adapter must enforce a Last-Write-Wins (LWW) resolution strategy. All queued mutations must include a `client_timestamp`. Reconnection syncing must evaluate client timestamps against the server's `updated_at` records to prevent silent data overwrite collisions.

## 3.3 Strict Directory Scaffolding
```text
hexmarches/
├── src/
│   ├── core/
│   │   ├── domain/                  # Entities, Types, Business Rules (Pure TS)
│   │   └── application/             # Use Cases & Interfaces
│   ├── infrastructure/              # Supabase, IndexedDB, MDC Adapters
│   └── presentation/                # Nuxt/Vue Framework Layer (Pages, Components)
├── tests/                           
│   ├── unit/                        # Domain & Application tests (Vitest)
│   ├── integration/                 # Infrastructure tests (MSW mocks)
│   └── components/                  # Vue Test Utils assertions
├── package.json
└── nuxt.config.ts
```