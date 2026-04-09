# Shared Operating Contract For Prompts 056 To 065

```text
You are an autonomous coding agent operating on the Vecells repository. Treat the blueprint corpus under `blueprint/`, the live coordination protocol under `prompt/AGENT.md` and `prompt/checklist.md`, the validated outputs from tasks `001-055`, and the already-populated prompt files in this repository as the definitive source algorithm plus execution serialization.

These prompts continue the sequential roadmap after tasks `001-055`. Before executing any task in this batch, verify that the outputs from tasks `001-055` exist, remain internally coherent, and are still traceable to the canonical blueprint corpus. At minimum, require these upstream outputs to be present and usable:

- tasks `001-005`: requirement registry, reconciliation, scope boundary, audience/surface inventory, request-lineage model
- tasks `006-010`: domain glossary, state/invariant atlas, external dependency inventory, safety/privacy/data posture
- tasks `011-015`: cloud, monorepo, backend, frontend, observability/security/release baselines
- tasks `016-020`: ADRs, programme gates, risk/watchlists, traceability, Phase 0 entry gate
- tasks `021-040`: external inventory, provider scorecards, sandbox/secrets strategy, mock-vs-live onboarding plans, simulator backlog, degraded-mode defaults
- tasks `041-045`: repository topology, monorepo scaffold, canonical service scaffold, package scaffold, engineering standards
- tasks `046-055`: runtime topology, trust boundaries, event namespace, FHIR contract strategy, frontend manifest strategy, release/publication parity, design-contract publication, WORM audit, acting-scope tuple law, lifecycle coordinator / closure-blocker law

If a prerequisite output is missing, stale, contradictory, or no longer source-traceable, fail fast with bounded `PREREQUISITE_GAP_*` records. Do not silently regenerate earlier work and pretend the dependency chain is intact.

You must also treat these repository files as live coordination inputs where relevant:
- `prompt/AGENT.md` for claim and sequencing protocol
- `prompt/checklist.md` for canonical task ordering
- earlier populated `prompt/*.md` files as the implementation-spec layer already chosen for the repo

Authoritative source order:
1. `phase-0-the-foundation-protocol.md` for canonical objects, state axes, invariants, lifecycle ownership, route-intent law, settlement law, adapter replay law, resilience law, and foundational runtime contracts.
2. The relevant phase files for phase-specific behavior:
   - `phase-1-the-red-flag-gate.md`
   - `phase-2-identity-and-echoes.md`
   - `phase-3-the-human-checkpoint.md`
   - `phase-4-the-booking-engine.md`
   - `phase-5-the-network-horizon.md`
   - `phase-6-the-pharmacy-loop.md`
   - `phase-7-inside-the-nhs-app.md` only as deferred-channel input when channel posture or bridge floors matter
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
   - `design-token-foundation.md`
   - `canonical-ui-contract-kernel.md`
   - `accessibility-and-content-system-contract.md`
   - `ux-quiet-clarity-redesign.md`
4. `phase-cards.md` for programme baseline, sequencing intent, and phase-card hardening notes.
5. `vecells-complete-end-to-end-flow.md` and `vecells-complete-end-to-end-flow.mmd` for the audited top-level flow.
6. `forensic-audit-findings.md` for mandatory patch guidance, anti-regression rules, and missing-control closures.
7. `blueprint-init.md` only as the orientation layer; it must never override higher-order sources.

Batch-specific execution law:

For tasks `056-057`:
- Route authority, action scope, command settlement, adapter replay, callback ordering, and degradation posture are foundation law, not route-local convenience.
- Every post-submit mutation must pass one exact `RouteIntentBinding` plus one exact `ScopedMutationGate` decision path and must emit one immutable `CommandActionRecord` plus one authoritative `CommandSettlementRecord`.
- Every external dependency boundary must publish one `AdapterContractProfile` and one bounded `DependencyDegradationProfile` before any worker or shell is allowed to infer capability or success.

For tasks `058-060`:
- Verification, ring promotion, seed data, simulators, backup, restore, and recovery posture are first-class runtime contracts, not later QA or ops add-ons.
- Use simulator-first execution for provider-like dependencies in Phase 0. Until live onboarding is explicitly completed in later tasks, local high-fidelity simulators are the only legal test backends for NHS login, GP integration, MESH, telephony, notifications, and similar boundaries.
- Recovery authority must remain tuple-bound to publication parity, watch tuples, runbooks, backup manifests, and synthetic recovery proof.

For task `061`:
- Opening the parallel foundation block is an evidence-driven gate, not a narrative milestone.
- The gate must prove which parallel tracks are actually safe to start, what shared package seams they must use, and which interface stubs are required so parallel execution does not fork truth.
- No track may be marked eligible if it would need to bypass unresolved seq-task law or infer missing shared contracts from sibling implementation details.

For tasks `062-065`:
- Implement real code and tests, not prose-only architecture.
- These tasks run in parallel and must therefore depend only on published sequential outputs plus shared package seams frozen before the parallel gate. Do not depend on unpublished sibling-track internals.
- If a sibling-track seam is required but not yet materialized, create the smallest bounded shared contract stub in the correct shared package, record `PARALLEL_INTERFACE_GAP_*`, and proceed without violating ownership.
- Simulator-backed adapters are allowed; live provider credentials, live webhooks, and live tenant-side effects are forbidden in this batch.

Non-negotiable interpretation rules:
- Do not invent behavior that contradicts the corpus.
- Do not flatten orthogonal state axes, blocker facts, replay classes, confirmation ambiguity, degraded trust, or recovery posture into convenience status prose.
- Do not let drafts, partial telephony capture, or pre-submit continuation fragments escape `SubmissionEnvelope` into `Request`.
- Do not let FHIR resources become hidden lifecycle owners. Domain aggregates remain authoritative; FHIR is representation, interchange, callback-correlation, or audit-companion output only.
- Do not let transport success, queue dequeue, webhook arrival, or provider acknowledgement become business truth when the corpus requires authoritative settlement or proof.
- Do not let adapters, simulators, or workers invent their own idempotency, callback-ordering, or degradation rules outside published profiles.
- Do not let live provider onboarding block Phase 0 implementation. Use simulator-first seams and explicit live-cutover strategy where relevant.
- Do not ask follow-up questions. Record grounded defaults as `ASSUMPTION_*` and continue.

Expected output classes:
- human-readable architecture, mutation, adapter, verification, simulator, resilience, gate, and backend implementation docs
- machine-readable registries / manifests / matrices / schemas / fixtures in JSON / CSV / YAML / JSONL
- deterministic validators
- browser-viewable internal labs / studios / cockpits where a task calls for them
- concrete code, schemas, tests, fixtures, and shared-package exports for backend implementation tracks

Machine-readable issue taxonomy:
- `PREREQUISITE_GAP_*` for missing or stale upstream dependencies
- `PARALLEL_INTERFACE_GAP_*` for missing shared seams required by the parallel block
- `GAP_*` for missing source detail that must be bounded or resolved
- `CONFLICT_*` for incompatible source statements
- `ASSUMPTION_*` for grounded defaults
- `RISK_*` for downstream hazards
- `DRIFT_*` for tuple, parity, simulation, or recovery mismatches
- `BLOCKER_*` for fail-closed publication, mutation, promotion, or recovery conditions

Validation expectations:
- Every generated contract row must cite its governing source file plus heading or logical block.
- Every machine-readable artifact must have deterministic ordering and stable identifiers.
- Every HTML lab or studio must read generated data artifacts, expose stable `data-testid` markers, honor reduced motion, and include non-visual parity for any chart or diagram.
- Every validator must fail when a contract that should be unique resolves to multiple owners, when a writable surface lacks one required tuple member, or when a simulator or recovery artifact drifts from its governing contract tuple.
- If a task generates a browser-facing internal artifact, use `Playwright_or_other_appropriate_tooling` to verify navigation, filter stability, responsive layout, reduced motion, and accessibility landmarks.

Execution discipline:
- Prefer checked-in source-controlled outputs over screenshots or prose-only explanation.
- Where the corpus leaves a gap but the architectural intent is clear, resolve it explicitly and document the resolution.
- Where the corpus leaves a gap that cannot be safely resolved without contradicting the source, leave it explicit and bounded rather than guessing.
- Make all labs, studios, and cockpits feel like premium internal Vecells instruments: quiet, exact, minimal, and clearly part of one governed system.
```
