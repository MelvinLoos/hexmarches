# Phase 4: The Spec Kit

## 4.1 The Constitution
1. **The TDD Mandate:** Absolutely no implementation logic may be written without a corresponding, failing test written first.
2. **Clean Architecture Enforcement:** The `src/core/domain` layer must remain 100% free of Nuxt, Vue, and Supabase dependencies. 
3. **Offline-First Resilience:** All state mutations targeting the backend must route through the IndexedDB Outbox adapter using a Last-Write-Wins (LWW) client-timestamp reconciliation strategy.
4. **Throttle by Default:** All VTT Payload broadcasts must be debounced/throttled in the Application Layer[cite: 1].
5. **No Hallucinated Packages:** Agents must only install dependencies explicitly listed in the Phase 2 Package Manifest.

## 4.2 The Product Spec (User Flows)
* **Flow 1: Campaign Wiki Editing:** The GM authors a wiki node using `md-editor-v3`[cite: 1]. The system saves it, and the Presentation Layer uses `@nuxtjs/mdc` to parse the AST and hydrate custom Vue components (e.g., `<MonsterStatBlock>`)[cite: 1].
* **Flow 2: VTT Canvas Synchronization:** The GM pans the map or updates Fog-of-War[cite: 1]. The Application layer throttles input, constructs a JSON VTT Payload, and broadcasts it via Supabase Realtime[cite: 1]. Player screens reactively update `vue-konva` Canvas layers[cite: 1].
* **Flow 3: Session Logging & Progression:** The GM submits a session log. The Domain Layer evaluates Character state against Milestone Tiering rules[cite: 1]. State is committed to Supabase, and a webhook is securely dispatched via Nuxt API to Discord[cite: 1].

## 4.3 GitHub Issues Matrix
* **Issue #1:** Repository Scaffold & TDD Infrastructure (`infrastructure`, `chore`)
* **Issue #2:** Domain Layer - Milestone & Progression Rules (`domain`, `tdd`)
* **Issue #3:** Domain Layer - VTT Payload & Hex Math Definitions (`domain`, `tdd`)
* **Issue #4:** Infrastructure - Supabase Adapters & Auth (`infrastructure`, `backend`)
* **Issue #5:** Application - Offline LWW Outbox Queue (`application`, `offline`)
* **Issue #6:** Presentation - Wiki MDC Components (`presentation`, `frontend`)
* **Issue #7:** Presentation - Real-time VTT Canvas (`presentation`, `frontend`)