# Sprint 1: Campaign Wiki & Content (Context A)

## 1. The Constitution (Sprint Mandates)
1. **TDD Markdown parsing:** The Domain Layer must validate the structural integrity of `ltree` Node Paths (e.g., `campaign.locations.forest`). Tests must assert valid vs. invalid path structures *before* interacting with the database.
2. **MDC Component Isolation:** Custom Vue components (e.g., `<Handout>`) must be completely isolated and tested using `@vue/test-utils` by mounting them with mock props.
3. **Sanitization over Trust:** The Application Layer must sanitize all markdown string inputs from the GM editor prior to passing them to the Infrastructure Layer. 

## 2. The Product Spec (User Flows)
* **Flow 1: Wiki Node Authorship:** The GM opens the editor (`md-editor-v3`), writes markdown including MDC component syntax (e.g., `::handout{title="Secret Letter"}`), and saves. The Application Layer validates the path and persists it via Supabase.
* **Flow 2: Hierarchical Navigation:** The user requests the 'locations' tree. The Infrastructure Layer queries PostgreSQL using `ltree` operators to return all nested descendants, mapping them into a UI sidebar.
* **Flow 3: SSR Component Hydration:** A player views a Wiki Node. Nuxt SSR fetches the raw markdown, `@nuxtjs/mdc` parses the AST, and reactive Vue components (like `<Handout>`) are injected and rendered on the client.