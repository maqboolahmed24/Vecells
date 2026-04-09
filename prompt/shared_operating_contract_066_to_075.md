# Shared Operating Contract For Prompts 066 To 075

```text
You are an autonomous coding agent operating on the Vecells repository. Treat the blueprint corpus under `blueprint/`, the live coordination protocol under `prompt/AGENT.md` and `prompt/checklist.md`, the validated outputs from tasks `001-065`, and the earlier populated prompt files in this repository as the definitive source algorithm plus execution serialization.

These prompts continue the current contiguous Phase 0 parallel backend-control block after tasks `062-065`. Before executing any task in this batch, verify that the outputs from tasks `001-065` exist, remain internally coherent, and are still traceable to the canonical blueprint corpus. At minimum, require these upstream outputs to be present and usable:

- tasks `001-005`: requirement registry, reconciliation, scope boundary, audience/surface inventory, request-lineage model
- tasks `006-010`: glossary, state/invariant atlas, external dependency inventory, safety/privacy/data posture
- tasks `011-015`: cloud, monorepo, backend, frontend, observability/security/release baselines
- tasks `016-020`: ADRs, programme gates, risk/watchlists, traceability, Phase 0 entry gate
- tasks `021-040`: external inventory, provider scorecards, mock-vs-live onboarding plans, simulator backlog, degraded-mode defaults
- tasks `041-055`: repository topology, scaffold, runtime topology, trust boundaries, event namespace, FHIR strategy, frontend manifest strategy, release/publication parity, design publication, WORM audit, acting-scope tuple law, lifecycle coordinator law
- tasks `056-061`: scoped-mutation and route-intent law, adapter profile and degradation law, verification ladder, simulator strategy, recovery tuple, parallel-foundation gate
- tasks `062-065`: canonical aggregates, evidence snapshot pipeline, FHIR mapping compiler, and browser-facing API-contract registry

If a prerequisite output is missing, stale, contradictory, or no longer source-traceable, fail fast with bounded `PREREQUISITE_GAP_*` records. Do not silently regenerate earlier work and pretend the dependency chain is intact.

You must also treat these repository files as live coordination inputs where relevant:
- `prompt/AGENT.md` for claim and sequencing protocol
- `prompt/checklist.md` for canonical task ordering
- earlier populated `prompt/*.md` files as the implementation-spec layer already chosen for the repo

Authoritative source order:
1. `phase-0-the-foundation-protocol.md` for canonical objects, state axes, invariants, lifecycle ownership, route-intent law, settlement law, adapter replay law, release-trust law, and foundational runtime contracts.
2. The relevant phase files for phase-specific behavior:
   - `phase-1-the-red-flag-gate.md`
   - `phase-2-identity-and-echoes.md`
   - `phase-3-the-human-checkpoint.md`
   - `phase-4-the-booking-engine.md`
   - `phase-5-the-network-horizon.md`
   - `phase-6-the-pharmacy-loop.md`
   - `phase-7-inside-the-nhs-app.md` only as deferred-channel input when embedded freeze posture or bridge floors matter
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

For task `066`:
- `SubmissionPromotionRecord` is the only legal durable bridge from `SubmissionEnvelope` to canonical `Request`.
- Exactly one governed promotion may exist for an envelope lineage; duplicate submit, auth-return replay, telephony continuation, or delayed client retries must return the existing promotion result rather than minting a second `Request`.
- Draft resume grants and draft leases must be superseded in the same authoritative transaction as promotion.

For task `067`:
- `IdempotencyRecord` owns replay recognition; `DuplicateCluster` owns duplicate review; they are separate authorities and must not be collapsed.
- Exact replay, semantic replay, collision review, and distinct commands must be persisted deterministically from canonical hashes and scope fingerprints.
- Callback or webhook ingestion must use the same replay law; transport success or identifier reuse may not silently create a second effect.

For tasks `068-070`:
- Identity, access, contact-route, reachability, and duplicate-review authorities are append-only and versioned.
- `IdentityBinding` alone owns bound `patientRef`; `AccessGrant` alone owns grant scope and replay-safe redemption; `ReachabilityAssessmentRecord` alone owns current dependency posture; `DuplicateResolutionDecision` alone owns attach or separate decisions.
- Session state, cached profile rows, support tooling, transport acks, or pairwise similarity scores may inform these authorities, but they may not replace them.

For tasks `071-075`:
- Lease, fence, action, settlement, queue-ranking, reservation, confirmation, freeze, and trust primitives are shared control-plane law for every later phase, not local implementation details.
- These primitives must be monotone, compare-and-set safe, projector-consumable, and replay-verifiable.
- Where raw tuples are insufficient for safe live authority, publish the higher-order verdict object as well; downstream consumers may not reconstruct truth from fragments once that verdict exists.

Mock-now vs actual-later law:
- Every prompt in this batch contains both `Mock_now_execution` and `Actual_production_strategy_later` sections. Honor both.
- `Mock_now_execution` must deliver high-fidelity simulator-backed or synthetic evidence sources that preserve the same object shapes, hashes, timestamps, replay classes, ambiguity states, and failure semantics expected from eventual production integrations.
- `Actual_production_strategy_later` must never rewrite core models. When live onboarding arrives, swap providers, credentials, and operational evidence only through the already-published contracts, adapters, and validators.
- If a live provider, governance tuple, or channel-specific runtime artifact is unavailable, build the simulator path now and emit an explicit cutover checklist later. Do not leave implicit TODO-only placeholders.

Parallel-execution discipline:
- These tasks run in the active Phase 0 parallel block. Do not depend on unpublished sibling-track internals.
- If a sibling seam is required but not yet materialized, create the smallest bounded shared contract stub in the correct shared package, record `PARALLEL_INTERFACE_GAP_*`, and continue without violating ownership.
- Keep implementation aligned with the earlier aggregate and contract packages produced in tasks `062-065`.

Non-negotiable interpretation rules:
- Do not invent behavior that contradicts the corpus.
- Do not flatten orthogonal state axes, replay classes, confirmation ambiguity, degraded trust, route freeze posture, or recovery posture into convenience status prose.
- Do not let `SubmissionEnvelope` or draft-state artifacts escape into `Request` truth except through one immutable `SubmissionPromotionRecord`.
- Do not let `patientRef` be written directly by auth callbacks, sessions, support tools, or imports; it remains derived from the latest settled `IdentityBinding`.
- Do not let send success, transport ack, or outbound enqueue stand in for reachability, booking truth, referral truth, or authoritative settlement.
- Do not let `soft_selected` imply exclusivity, or `pending_confirmation` imply final booked or referred reassurance.
- Do not let duplicate clustering or pairwise evidence imply attach or merge without `DuplicateResolutionDecision`.
- Do not let stale owner writes, stale lineage epochs, or stale route-intent tuples degrade silently; they must fail closed to recovery or re-acquire posture.
- Do not let raw `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, or `AssuranceSliceTrustRecord` fragments reopen writability once `ReleaseTrustFreezeVerdict` exists; the verdict wins.
- Do not ask follow-up questions. Record grounded defaults as `ASSUMPTION_*` and continue.

Expected output classes:
- real backend code, migrations, repositories, value objects, calculators, validators, and tests
- human-readable architecture docs plus machine-readable manifests / matrices / schemas / fixtures in JSON / CSV / YAML / JSONL
- deterministic validators and replay / concurrency harnesses
- browser-viewable internal labs / atlases / studios / cockpits where a prompt calls for them

Machine-readable issue taxonomy:
- `PREREQUISITE_GAP_*` for missing or stale upstream dependencies
- `PARALLEL_INTERFACE_GAP_*` for missing shared seams required by the parallel block
- `GAP_*` for missing source detail that must be bounded or resolved
- `CONFLICT_*` for incompatible source statements
- `ASSUMPTION_*` for grounded defaults
- `RISK_*` for downstream hazards
- `DRIFT_*` for tuple, replay, trust, or recovery mismatches
- `BLOCKER_*` for fail-closed publication, mutation, promotion, replay, or recovery conditions

Validation expectations:
- Every generated contract row must cite its governing source file plus heading or logical block.
- Every machine-readable artifact must have deterministic ordering and stable identifiers.
- Every explorer, atlas, studio, or cockpit must read generated data artifacts, expose stable `data-testid` markers, honor reduced motion, and include adjacent textual parity for every chart or diagram.
- Every validator must fail when a required object chain is missing, when a monotone supersession or revision chain is broken, or when a simulator drifts from the governing contract tuple.
- If a task generates a browser-facing internal artifact, use `Playwright_or_other_appropriate_tooling` to verify navigation, filtering, responsive layout, reduced motion, and accessibility landmarks.

Execution discipline:
- Prefer checked-in source-controlled outputs over screenshots or prose-only explanation.
- Where the corpus leaves a gap but the architectural intent is clear, resolve it explicitly and document the resolution.
- Where the corpus leaves a gap that cannot be safely resolved without contradicting the source, leave it explicit and bounded rather than guessing.
- Make all labs, atlases, studios, and cockpits feel like premium internal Vecells instruments: quiet, exact, minimal, and clearly part of one governed system.
```
