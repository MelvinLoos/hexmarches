# Phase 1: Domain & Requirements

## 1.1 Ubiquitous Language
Agents must use these exact terms in all interfaces, variables, and test suites:
* **Campaign Wiki Node:** A hierarchical data structure containing markdown content, capable of rendering Vue components[cite: 1].
* **Hex Grid Mathematics:** The headless coordinate system used to track token positions and Fog-of-War states (`q, r` coordinates)[cite: 1].
* **Milestone Tiering:** The specific domain rules dictating character advancement (Tier 1: 0-3 milestones, Tier 2: 4-9 milestones, Tier 3: 10+ milestones)[cite: 1].
* **VTT Payload:** The strict JSON structure broadcasted via WebSockets to synchronize canvas state[cite: 1].

## 1.2 Bounded Contexts (Agentic Workflow Boundaries)
* **Context A: Lore & Content (Wiki)**
  * *Responsibility:* Markdown parsing, hierarchical `ltree` navigation, Full-Text Search[cite: 1].
  * *Testing Boundary:* AI agents will mock PostgreSQL `ltree` responses and assert AST (Abstract Syntax Tree) output from `@nuxtjs/mdc`[cite: 1].
* **Context B: Real-Time Tabletop (VTT)**
  * *Responsibility:* WebSocket payloads, Canvas rendering, Headless Hex calculations[cite: 1].
  * *Testing Boundary:* Agents must write TDD suites asserting state mutations on incoming/outgoing throttled JSON payloads[cite: 1], heavily mocking the Supabase Realtime channel.
* **Context C: Logistics & Progression**
  * *Responsibility:* Session RSVPs, Character creation, Domain rule evaluation for Tier progression[cite: 1].
  * *Testing Boundary:* Strict unit tests asserting Tier calculation functions *before* integrating with backend services.
* **Context D: The AI 'Ruler' Gateway**
  * *Status:* DEFERRED to future milestone.