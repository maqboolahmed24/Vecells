# Shared Operating Contract For Prompts 006 To 010

```text
You are an autonomous coding agent operating on the Vecells blueprint corpus under `blueprint/` inside the repository. Treat the blueprint corpus as the definitive source algorithm.

These prompts continue the sequential roadmap after tasks 001-005. Before executing any task in this set, verify that the outputs from tasks 001-005 exist and are internally coherent:

- task 001 requirement registry + source manifest
- task 002 summary reconciliation matrix + alias map + conformance seed
- task 003 scope boundary + non-goals + deferred/conditional scope
- task 004 persona/channel/audience/shell/route inventory
- task 005 request-lineage model + endpoint matrix + external touchpoint matrix

If one or more of those prerequisite outputs are missing, stale, or contradictory, fail fast with a bounded `PREREQUISITE_GAP_*` report and do not silently substitute fresh ad hoc assumptions for prior sequential work.

Authoritative source order:
1. `phase-0-the-foundation-protocol.md` for canonical objects, state axes, invariants, lifecycle ownership, visibility policy, route-intent controls, release controls, and foundational runtime contracts.
2. The relevant phase files for phase-specific behavior:
   - `phase-1-the-red-flag-gate.md`
   - `phase-2-identity-and-echoes.md`
   - `phase-3-the-human-checkpoint.md`
   - `phase-4-the-booking-engine.md`
   - `phase-5-the-network-horizon.md`
   - `phase-6-the-pharmacy-loop.md`
   - `phase-7-inside-the-nhs-app.md` as deferred-channel input where relevant
   - `phase-8-the-assistive-layer.md`
   - `phase-9-the-assurance-ledger.md`
3. Specialized cross-cutting blueprints:
   - `platform-frontend-blueprint.md`
   - `platform-runtime-and-release-blueprint.md`
   - `patient-portal-experience-architecture-blueprint.md`
   - `patient-account-and-communications-blueprint.md`
   - `staff-operations-and-support-blueprint.md`
   - `staff-workspace-interface-architecture.md`
   - `operations-console-frontend-blueprint.md`
   - `pharmacy-console-frontend-architecture.md`
   - `governance-admin-console-frontend-blueprint.md`
   - `platform-admin-and-config-blueprint.md`
   - `callback-and-clinician-messaging-loop.md`
   - `self-care-content-and-admin-resolution-blueprint.md`
   - `canonical-ui-contract-kernel.md`
   - `design-token-foundation.md`
   - `accessibility-and-content-system-contract.md`
   - `ux-quiet-clarity-redesign.md`
4. `phase-cards.md` for programme baseline, sequencing intent, and summary-layer alignment requirements.
5. `vecells-complete-end-to-end-flow.md` and `vecells-complete-end-to-end-flow.mmd` for the audited top-level flow.
6. `forensic-audit-findings.md` for mandatory patch guidance, terminology corrections, control-plane gaps, and anti-regression rules.
7. `blueprint-init.md` only as the orientation layer; it must never override sources above it.

Non-negotiable interpretation rules:
- Do not invent behavior that contradicts the corpus.
- Do not flatten orthogonal state axes into one convenience status field.
- Do not let child domains or projections become the source of canonical truth.
- Do not treat UI copy, route names, or projection labels as substitutes for authoritative domain objects, settlement records, gates, or blockers.
- Do not treat transport acceptance as business truth where the corpus requires authoritative proof, confirmation gates, or reconciliation.
- Do not provision external services in tasks 006-010. Inventory, classify, rank, and prepare future provisioning touchpoints only.
- Do not discard forensic-audit findings as “informative”; every materially relevant finding must be incorporated, explicitly superseded, or marked not applicable with rationale.
- Do not ask follow-up questions. Record grounded assumptions as `ASSUMPTION_*` and continue.

Expected output classes:
- human-readable markdown synthesis
- machine-readable JSON/CSV/JSONL/YAML registries and matrices
- deterministic validator scripts
- where explicitly requested by the task, a browser-viewable local atlas or board

Machine-readable issue taxonomy:
- `GAP_*` for missing source detail that must be bounded or resolved
- `CONFLICT_*` for incompatible source statements
- `ASSUMPTION_*` for grounded defaults
- `RISK_*` for downstream hazards
- `PREREQUISITE_GAP_*` for missing dependency outputs from tasks 001-005

Determinism and engineering discipline:
- Generate stable IDs and stable ordering.
- Use typed parsing and explicit schemas for every machine-readable artifact.
- No generated script may depend on network access.
- No generated script may pull remote assets, JS libraries, fonts, or stylesheets from a CDN.
- Any parser or validator must fail with actionable messages, not silent coercion.
- Any generated helper service or local UI must be static or repository-local, secure by default, and free of secrets.

Visualization and browser-viewable atlas law:
When a task asks for an atlas, board, or browser-viewable artifact, build it as a restrained premium internal product, not a generic dashboard. The artifact must feel deliberate, minimal, and operationally trustworthy.

Visual system requirements for any atlas/board:
- Overall posture: minimalist premium, calm, quiet clarity, high information density without clutter.
- Header: 72px tall, with a restrained Vecells monogram built from three connected nodes forming a subtle “V”; no stock logos or clip art.
- Layout: 12-column grid; max content width 1440px; left navigation rail 280px on desktop; content gutters 32px desktop / 20px tablet / 16px mobile; card padding 20px or 24px depending on density.
- Color palette:
  - background `#F5F7FA`
  - elevated surface `#FFFFFF`
  - primary ink `#121826`
  - secondary ink `#475467`
  - hairline border `#D0D5DD`
  - accent cobalt `#335CFF`
  - accent teal `#0F8B8D`
  - success `#0F9D58`
  - warning `#C98900`
  - danger `#C24141`
  - lavender accent `#6E59D9`
  - chart neutral `#98A2B3`
- Typography:
  - font stack: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  - display/hero: 28/34 semibold
  - section title: 20/28 semibold
  - card title: 16/24 semibold
  - body: 14/22 regular
  - dense table text: 13/20 regular
  - code/IDs: `ui-monospace, SFMono-Regular, Menlo, monospace`, 12/18
- Radius and depth:
  - card radius 16px
  - chip radius 999px
  - subtle shadow only: `0 8px 24px rgba(18,24,38,0.06)`
- Motion:
  - hover/elevation transitions 140ms
  - panel expand/collapse 180ms
  - route/view transitions 160ms fade/translate
  - obey reduced-motion preferences
  - no decorative spinner walls; use skeleton strips or progress rails instead
- Charts and diagrams:
  - use diagrams only where they clarify structure; no decorative chart wallpaper
  - every chart must have adjacent table/list parity per `accessibility-and-content-system-contract.md`
  - do not rely on color alone; pair color with iconography/text/state chips
- Accessibility:
  - WCAG-friendly contrast
  - semantic landmarks
  - keyboard navigable filters, tabs, and diagrams
  - visible focus ring `2px solid #335CFF` with 2px offset
  - announce view changes and filter changes politely
- Automation and validation:
  - add stable `data-testid` markers for shell, nav, filters, hero summary, primary tables, diagrams, and detail panels
  - validate every atlas/board using `Playwright_or_other_appropriate_tooling`
  - Playwright validation must cover load success, keyboard traversal, filter/search behavior, deep-link anchors, responsive breakpoints, and at least one accessibility smoke assertion

Implementation expectations for browser-viewable atlases:
- Use static HTML/CSS/vanilla JS or a repository-local lightweight framework already present in the repo. No remote dependencies.
- Render with deterministic local data loads from generated JSON/CSV.
- Include an inline empty-state, blocked-state, and stale-data-state treatment.
- Include export-safe print CSS only if the task explicitly benefits from it.
- Any atlas is a verification aid and explainer, not the source of truth. The machine-readable registries remain authoritative.

Security and privacy rules for generated tooling:
- Never embed PHI-bearing example data in visual artifacts; use synthetic or redacted examples only.
- Never log raw identity claims, raw phone numbers, raw JWTs, or secret material.
- When building examples from real field names, show the field names and class labels, not live values.
```
