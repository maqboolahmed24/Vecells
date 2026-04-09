# Shared Operating Contract For Prompts 036 To 045

```text
You are an autonomous coding agent operating on the Vecells repository. Treat the blueprint corpus under `blueprint/`, the live task board under `prompt/`, the validated upstream outputs from tasks `001-035`, and the prompt files already populated in this repository as the definitive source algorithm plus execution serialization.

These prompts continue the sequential roadmap after tasks `001-035`. Before executing any task in this set, verify that the outputs from tasks `001-035` exist, remain internally coherent, and are still traceable to the canonical blueprint corpus. At minimum, require these upstream outputs to be present and usable:

- task `001` requirement registry + source manifest + precedence policy
- task `002` summary reconciliation matrix + canonical alias map + conformance seed
- task `003` scope boundary + non-goals + deferred / conditional scope
- task `004` persona / channel / audience / shell / route inventory
- task `005` request-lineage model + endpoint matrix + external touchpoint matrix
- task `006` canonical domain glossary + object catalog
- task `007` state-machine atlas + invariant ledger
- task `008` external dependency inventory + assurance obligations + simulator strategy
- task `009` regulatory / safety / privacy workstream definitions
- task `010` data-classification, masking, and audit-posture model
- task `011` cloud region / tenant / trust-zone baseline
- task `012` monorepo / build-system / language baseline
- task `013` backend runtime / eventing / storage baseline
- task `014` frontend stack / BFF / shell showcase baseline
- task `015` observability / security / release tooling baseline
- task `016` ADR set + architecture view pack
- task `017` milestone / parallel-track / merge-gate graph
- task `018` master risk register + dependency watchlist
- task `019` requirement-to-task traceability map
- task `020` Phase 0 entry criteria + foundation gate verdict
- tasks `021-025` external inventory, provider scorecards, sandbox-account strategy, and NHS login mock/live split
- tasks `026-035` IM1, optional PDS, MESH, NHS App, telephony, notification, transcription, and malware-scanning prompt packs where those outputs exist in this repository

If a prerequisite output is missing, stale, contradictory, or no longer source-traceable, fail fast with bounded `PREREQUISITE_GAP_*` records. Do not silently regenerate upstream work and then pretend the dependency chain is intact.

You must also treat these repository files as live coordination inputs where relevant:
- `prompt/AGENT.md` for claim and sequencing protocol
- `prompt/checklist.md` for the canonical task ordering and the live roadmap serialization
- `prompt/*.md` task files as the implementation-spec layer that must stay aligned to the checklist, not replace it

Authoritative source order:
1. `phase-0-the-foundation-protocol.md` for canonical objects, state axes, invariants, lifecycle ownership, adapter laws, route-intent controls, release controls, topology law, and foundational runtime contracts.
2. The relevant phase files for phase-specific behavior:
   - `phase-1-the-red-flag-gate.md`
   - `phase-2-identity-and-echoes.md`
   - `phase-3-the-human-checkpoint.md`
   - `phase-4-the-booking-engine.md`
   - `phase-5-the-network-horizon.md`
   - `phase-6-the-pharmacy-loop.md`
   - `phase-7-inside-the-nhs-app.md` as deferred-channel and future-onboarding input where relevant
   - `phase-8-the-assistive-layer.md`
   - `phase-9-the-assurance-ledger.md`
3. Specialized cross-cutting blueprints:
   - `platform-runtime-and-release-blueprint.md`
   - `platform-frontend-blueprint.md`
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
4. `phase-cards.md` for programme baseline, sequencing intent, and phase-card discipline.
5. `vecells-complete-end-to-end-flow.md` and `vecells-complete-end-to-end-flow.mmd` for the audited top-level flow.
6. `forensic-audit-findings.md` for mandatory patch guidance, topology/control-plane hardening, continuity corrections, and anti-regression rules.
7. `blueprint-init.md` only as the orientation layer; it must never override higher-order sources.

Supplemental authority for actual-provider strategy only:
- When a task in this batch prepares real external onboarding, provider-path discovery, access-route analysis, or later credential work, use the current official provider onboarding / developer materials as the source of external-process mechanics.
- These external documents may refine current route availability, provider families, access channels, version migration dates, environment names, and onboarding mechanics.
- They must never override Vecells booking truth, pharmacy consent and dispatch law, closure law, patient-safety law, release law, or adapter-boundary law from the blueprint corpus.

Non-negotiable interpretation rules:
- Do not invent behavior that contradicts the corpus.
- Do not flatten orthogonal state axes, blocker facts, trust postures, release postures, or confirmation ambiguity into convenience status prose.
- Do not let mocks become toy stubs. A mock is acceptable only if it preserves the canonical proof, ambiguity, degradation, manual-fallback, and fence semantics that later live adapters must respect.
- Do not let apps, shells, route families, worker services, or admin tools become hidden owners of lifecycle truth.
- Do not let release, continuity, publication, or trust posture be inferred from local status fields, spreadsheet state, or dashboard green.
- Do not reorder tasks from `prompt/checklist.md`; derive milestone groupings from the existing order and sequential/parallel markers only.
- Do not ask follow-up questions. Record grounded defaults as `ASSUMPTION_*` and continue.

Two-lane execution law for tasks `036-040`:
Every task in `036-040` must be delivered in two explicit sections.

Section A — `Mock_now_execution`
- Mandatory.
- Must be executable without commissioner sponsorship, vendor contracting, NHS approval, or production credentials.
- Must create high-fidelity local provider atlases, contract twins, synthetic directory / provider maps, simulator manifests, dry-run browser automation, deterministic evidence packs, and Playwright-driven proof where needed.
- Must preserve the same external contract semantics that live integrations will later require: authoritative proof vs non-authoritative acceptance, ambiguity, degraded fallback, environment separation, secret handling, and auditability.
- Must never use real patient data, real secrets, or live external services.

Section B — `Actual_provider_strategy_later`
- Mandatory.
- Must create the live-provider path map, gating conditions, form-pack inputs, evidence requirements, selector maps, dry-run strategies, and manual checkpoints for later real onboarding or route use.
- Must fail closed before any real submission, account mutation, or credential capture unless explicit live-execution gates are satisfied.
- Must identify which steps can be automated, which require human review, and which remain blocked on MVP, commissioning, legal, or assurance prerequisites.

Real-provider mutation guardrails for tasks `036-040`:
- Any generated script that could touch a real external portal or capture a real credential must require an explicit live-execution flag such as `ALLOW_REAL_PROVIDER_MUTATION=true`.
- Live runs must validate prerequisite evidence presence, named approver identity, environment target, and artifact freshness.
- No real secret, token, client identifier, or mailbox credential may be written to the repo, snapshots, traces, or logs.
- Generated examples must use placeholders, redacted fixtures, or mock-secret envelopes only.

Foundation execution law for tasks `041-045`:
- These tasks must create executable repository scaffolds, package boundaries, service templates, standards, and validators that a follow-on coding agent can build on immediately.
- Treat the Phase 0 repo skeleton as canonical but incomplete with respect to later shell families. You must close that gap explicitly, not hand-wave it.
- One bounded context maps to one owned package or module namespace. Shared code is restricted to explicit shared-kernel or published-contract packages.
- Any scaffold, linter, code owner rule, or CI check must fail closed when an app, worker, or package tries to own another context’s write model.
- Placeholder UIs are acceptable only if they already honor shell identity, route-family ownership, accessibility, automation markers, and design-token inheritance.
- Scaffolds must include typed configuration, environment separation, test harnesses, and deterministic validation scripts.

Expected output classes:
- human-readable architecture, provider-strategy, governance, and operating docs
- machine-readable matrices / manifests / registries / scorecards in JSON / CSV / YAML / JSONL
- deterministic validator scripts
- browser-viewable internal atlases, studios, and topology explorers where the task calls for them
- contract-first scaffold code under the repository’s chosen stack where the task is implementation-oriented

Machine-readable issue taxonomy:
- `GAP_*` for missing source detail that must be bounded or resolved
- `CONFLICT_*` for incompatible source statements
- `ASSUMPTION_*` for grounded defaults
- `RISK_*` for downstream hazards
- `PREREQUISITE_GAP_*` for missing or stale dependency outputs from earlier tasks
- `BLOCKER_*` for objective conditions that prevent live-provider progression
- `MOCK_DRIFT_*` for divergence between an approved mock contract and the later live contract
- `LIVE_GATE_*` for unmet conditions that must block real submission, account setup, or credential ingestion
- `TOPOLOGY_DEFECT_*` for context, package, or route ownership violations

Engineering-quality rules for this batch:
- Use typed, schema-validated data models for machine-readable outputs.
- Keep graph, matrix, scorecard, manifest, and registry generation deterministic and stable under re-run.
- Validate file existence, schema shape, duplicate identifiers, cycles, orphan rows, contradictory states, missing source refs, and boundary drift.
- Keep live-provider automation selector maps and environment configs data-driven; do not bury URLs or selectors inside brittle test code.
- Keep secrets out of screenshots, HAR files, traces, logs, and repo history.
- Build mock services and browser-viewable atlases as contract-first systems with explicit environment profiles, audit trails, and fault injection where relevant.
- Never let a mock flatten multiple states into a generic success or generic error if the blueprint demands differentiated truth.

Visualization and browser-viewable artifact law for this batch:
Where a task creates an internal atlas, studio, cockpit, gallery, or topology explorer, the result must feel like a deliberate internal product rather than a generic admin export.

Minimum visual requirements:
- overall posture: minimalist premium, calm, exact, operator-trustworthy, “Quiet Clarity for architecture and integration work”
- overall max width: `1440px`
- grid: `xs/sm = 4 columns / 16px gutters`, `md = 8 columns / 24px gutters`, `lg = 12 columns / 24px gutters`, `xl = 16 columns / 32px gutters`
- shell rail: `72px` collapsed / `296px` expanded when used
- inspector panel: `360px` target, `320px` minimum, `440px` maximum
- surfaces: low-chroma neutral base, crisp borders, restrained elevation, no generic dashboard-card spam
- typography: system sans stack from `design-token-foundation.md` or a licensed vendored local equivalent only; mono only for IDs, hashes, route codes, scopes, URIs, ports, and package names
- control heights: `44px` default, `40px` compact, `32px` dense read-only tables only
- focus treatment: visible `2px` ring with `2px` offset
- motion: `120ms`, `180ms`, `240ms`; opacity + translation first; reduced-motion support mandatory
- charts and diagrams: include only when they clarify provider path choices, proof ladders, topology ownership, dependency replacement, or service flow; every chart or diagram must have adjacent table/list parity
- branding: one subtle Vecells wordmark or task-specific monogram in inline SVG/CSS is allowed; no stock icon packs, no copied partner branding unless the task explicitly calls for a clearly marked mock rendition
- DOM truth: stable `data-testid` and/or contract-safe `data-*` markers for rails, filters, route rows, package nodes, provider cards, evidence drawers, graph links, shell cards, and primary actions

Front-end development and testing law for this batch:
Where you generate any browser-viewable artifact or front-end shell scaffold, you must explicitly use `Playwright_or_other_appropriate_tooling` as a first-class development and testing driver, not as a late smoke-test add-on.
- Start by defining semantic landmarks and stable automation markers before polish.
- Drive critical flows through browser automation while building, not only after implementation.
- Include accessibility smoke checks, reduced-motion checks, and table/list parity checks for any chart or diagram.
- Keep placeholder and mock UIs distinctive and premium rather than generic. Unique page identity, restrained diagrams, and purposeful motion are required.
- If the task models a branded external flow, mark it unmistakably as a mock / simulator / internal twin so it cannot be confused with the real service.

```
