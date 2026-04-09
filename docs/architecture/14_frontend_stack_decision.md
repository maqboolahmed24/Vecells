# 14 Frontend Stack Decision

        Vecells should run in the browser as a client-first React and TypeScript shell runtime built by Vite, with typed route modules and generated contract clients. This keeps same-shell continuity, route morphing, and marker determinism explicit instead of hiding them behind server-owned routing or framework-owned data handlers.

        ## Chosen Baseline

        - Option id: `OPT_REACT_TS_VITE_TANSTACK`
        - Runtime shape: `client_first_shell_runtime`
        - Why it won: Chosen because a client-first React runtime keeps shell reuse explicit, leaves gateway surfaces published rather than framework-hidden, and matches the TypeScript plus Nx baseline from seq_012 without introducing server-owned BFF shortcuts.

        ## Scorecard

        | Option | Continuity | Gateway boundary | Typed contracts | Playwright | Deterministic markers | Total | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| React + TypeScript + Vite + typed client router | 5 | 5 | 5 | 5 | 5 | 45 | chosen |
| React + TypeScript + Next.js App Router | 3 | 1 | 4 | 4 | 3 | 31 | rejected |
| React + TypeScript + Remix or equivalent data-router framework | 4 | 2 | 4 | 5 | 4 | 37 | rejected |

        ## Decision Law

        - React and TypeScript stay browser-first so `PersistentShell`, `SelectedAnchor`, `DecisionDock`, and route-runtime markers live in one deterministic client tree.
        - Vite keeps shell delivery simple and static while published `GatewayBffSurface` rows remain the only browser-callable compute boundary.
        - Typed query, mutation, and live-channel clients come only from generated manifest-bound packages, never from handwritten route-local fetch wrappers.
        - Same-shell route morphing is mandatory. Adjacent request, workspace, operations, and governance states patch in place and never rely on full-page reloads.
        - Playwright markers are treated as part of the design contract, not as an afterthought or a test-only overlay.

        ## Rejected Alternatives

        - `OPT_REACT_TS_NEXT_APP_ROUTER`: Rejected because App Router defaults encourage hidden server actions, route handlers, and framework-owned data boundaries that would blur GatewayBffSurface and FrontendContractManifest authority.
- `OPT_REACT_TS_REMIX`: Rejected because loader and action routing still invite route-local read and mutation logic when Vecells requires every browser authority surface to stay in the published manifest.

        ## Traceability

        - phase-0-the-foundation-protocol.md#0.2 Continuity key and shell law; platform-frontend-blueprint.md#2.15B DesignContractRegistry; platform-frontend-blueprint.md#3. Non-negotiable invariants; platform-frontend-blueprint.md#7.8 Verification and Playwright contract; design-token-foundation.md#Breakpoints and layout lattice; design-token-foundation.md#Typography
