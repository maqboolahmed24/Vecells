# Shared Operating Contract For Prompts 076 To 085

```text
You are an autonomous coding agent operating on the Vecells repository. Treat the blueprint corpus under `blueprint/`, the live coordination protocol under `prompt/AGENT.md` and `prompt/checklist.md`, the validated outputs from tasks `001-075`, and the earlier populated prompt files in this repository as the definitive source algorithm plus execution serialization.

These prompts continue the active Phase 0 parallel block. Tasks `076-082` extend the canonical backend-control and service layer. Task `083` builds the high-fidelity simulator backplanes that let the MVP move before live provider onboarding. Tasks `084-085` start the runtime provisioning subtrack for network and data foundations. Before executing any task in this batch, verify that the outputs from tasks `001-075` exist, remain internally coherent, and are still traceable to the canonical blueprint corpus.

At minimum, require these upstream outputs to be present and usable:

- tasks `001-005`: requirement registry, summary reconciliation, scope boundary, audience/surface inventory, request-lineage model
- tasks `006-010`: glossary, state and invariant atlas, dependency inventory, safety/privacy/data posture
- tasks `011-020`: cloud-region and tenancy choices, monorepo/runtime/frontend/tooling baselines, ADRs, merge-gates, risk/watchlists, traceability, Phase 0 entry gate
- tasks `021-040`: external dependency inventory, provider scorecards, sandbox strategy, mock-vs-live onboarding plans, simulator backlog, degraded-mode defaults
- tasks `041-055`: repository topology, scaffold, runtime topology, trust boundaries, event namespace, FHIR strategy, frontend manifest strategy, release/publication parity strategy, design publication, WORM audit, acting-scope tuple law, lifecycle-coordinator and closure-blocker law
- tasks `056-061`: scoped mutation gate, route-intent binding law, adapter profile and degradation law, verification ladder, simulator strategy, backup/restore tuple, parallel-foundation gate
- tasks `062-075`: canonical envelope/request/evidence/FHIR/API models plus promotion, idempotency, identity, reachability, duplicate, lease, settlement, queue, reservation, confirmation, and freeze-trust primitives

If a prerequisite output is missing, stale, contradictory, or no longer source-traceable, fail fast with bounded `PREREQUISITE_GAP_*` records. Do not silently regenerate earlier work and pretend the dependency chain is intact.

You must also treat these repository files as live coordination inputs where relevant:
- `prompt/AGENT.md` for claim and sequencing protocol
- `prompt/checklist.md` for canonical task ordering
- earlier populated `prompt/*.md` files as the implementation-spec layer already chosen for the repo

Authoritative source order:
1. `phase-0-the-foundation-protocol.md` for canonical objects, state axes, invariants, lifecycle ownership, route-intent law, settlement law, release-trust law, resilience law, and foundational runtime contracts.
2. The relevant phase files for phase-specific behavior:
   - `phase-1-the-red-flag-gate.md`
   - `phase-2-identity-and-echoes.md`
   - `phase-3-the-human-checkpoint.md`
   - `phase-4-the-booking-engine.md`
   - `phase-5-the-network-horizon.md`
   - `phase-6-the-pharmacy-loop.md`
   - `phase-7-inside-the-nhs-app.md` only as deferred-channel input when embedded continuity or bridge floors matter
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

For tasks `076-077`:
- `Request.workflowState` remains milestone-only. Repair, duplicate review, fallback review, confirmation ambiguity, and reachability trouble must live in blocker or gate refs, not as overloaded workflow statuses.
- `Request.workflowState = closed` is legal only after `LifecycleCoordinator` persists `RequestClosureRecord(decision = close)` and the coordinator-materialized blocker sets are empty.
- `FallbackReviewCase` preserves accepted user progress in the same lineage. It is not a detached ticket or a hidden staff-only side path.

For task `078`:
- `AccessGrantService` is the only authority allowed to issue, redeem, rotate, revoke, or supersede patient-facing grants.
- `AccessGrantScopeEnvelope` must bind every redeemable grant to the current governing object, route family, runtime tuple, and grant family semantics.
- Exact replay returns the existing `AccessGrantRedemptionRecord` or `AccessGrantSupersessionRecord`; it must not mint a second side effect.

For task `079`:
- `EvidenceAssimilationCoordinator` is the sole post-submit evidence ingress gateway.
- `SafetyOrchestrator` is the sole owner of canonical evidence classification, safety preemption, urgent-diversion issuance, and incremental re-safety.
- Domain-local workflows may not advance, clear risk, or imply calm truth while assimilation or safety settlement is pending or blocked.

For task `080`:
- `IdentityRepairOrchestrator` attaches repair freezes, branch dispositions, and release settlements; it must not rewrite workflow milestones into ad hoc repair states.
- `ReachabilityGovernor` is the only authority that can settle current contact-route health and dependency posture.
- Transport acceptance, mutable profile rows, or local notes may inform reachability, but they may not replace canonical reachability truth.

For task `081`:
- `ReservationAuthority` is the only serializer over `canonicalReservationKey` and the only authority allowed to grant patient- or staff-visible exclusivity.
- `QueueRankingCoordinator` fixes one committed queue order from one fact cut before any reviewer-specific assignment heuristics or workbench conveniences apply.

For task `082`:
- Projection rebuild must replay immutable canonical events. It may not infer authoritative truth from projections, dashboard memory, or adapter-local logs.
- `EventApplier` must be deterministic, idempotent, contract-version-aware, and restart-safe.
- Audience freshness and writability may not be implied while rebuild or compatibility posture is degraded.

For task `083`:
- Simulators are first-class infrastructure for the MVP. They must preserve the same object shapes, digests, replay classes, failure semantics, ambiguity states, and callback timing classes expected from live providers.
- Mock services may simplify acquisition and secrets, but they may not simplify control semantics.
- Live-provider cutover must be an adapter swap and configuration exercise, not a model rewrite.

For tasks `084-085`:
- Runtime topology, trust zones, service identities, store refs, tenant transfer rules, and egress allowlists must publish as machine-readable contracts, not as diagram folklore.
- `public_edge`, `shell_delivery`, `command`, `projection`, `integration`, `data`, and `assurance_security` workload families must remain distinct even when deployment units share runtime hosts.
- Transactional domain storage and FHIR representation storage must remain separate truth layers even when the implementation technology is related.

Mock-now vs actual-later law:
- Every prompt in this batch contains both `Mock_now_execution` and `Actual_production_strategy_later` sections. Honor both.
- `Mock_now_execution` must deliver high-fidelity simulator-backed, synthetic, or sandbox-safe components that preserve the same contracts the live system will require.
- `Actual_production_strategy_later` must not rewrite core aggregates, service contracts, trust tuples, or patient/staff continuity semantics. Live onboarding swaps providers, credentials, deployment hardening, or operational evidence only through the published seams.
- If a live provider, managed cloud feature, or production governance input is unavailable, build the bounded mock path now and emit explicit cutover checklists later. Do not leave TODO-only placeholders.

Parallel-execution discipline:
- This batch still sits inside the active Phase 0 parallel block. Do not depend on unpublished sibling-track internals.
- If a sibling seam is required but not yet materialized, create the smallest bounded shared contract stub in the correct shared package, record `PARALLEL_INTERFACE_GAP_*`, and continue without violating ownership.
- Keep implementation aligned with the earlier aggregate and contract packages produced in tasks `062-075`.
- Runtime provisioning prompts may reference later runtime tasks, but they must not pull forward object storage, event-bus, or secrets ownership that the roadmap reserved for tasks `086+`; instead publish extension points and explicit `FOLLOW_ON_DEPENDENCY_*` notes.

Non-negotiable interpretation rules:
- Do not invent behavior that contradicts the corpus.
- Do not flatten orthogonal state axes, replay classes, confirmation ambiguity, degraded trust, route freeze posture, or recovery posture into convenience status prose.
- Do not let child domains write canonical closure or cross-domain milestone truth directly; they emit milestones, blockers, and settlement evidence for coordinator consumption.
- Do not let auth success, grant possession, session presence, or provider send acceptance stand in for patient binding, permission, reachability, reservation truth, referral truth, or authoritative settlement.
- Do not let projection rebuild, migration, or simulator logic become a backdoor mutator of canonical domain state.
- Do not let default-open egress, shared browser-to-adapter paths, or public data-plane reachability creep into the topology.
- Do not let FHIR resources replace governing aggregate lifecycle, blocker, or continuity truth.
- Do not ask follow-up questions. Record grounded defaults as `ASSUMPTION_*` and continue.

Expected output classes:
- real backend code, migrations, repositories, evaluators, workers, validators, and tests
- human-readable architecture docs plus machine-readable manifests / matrices / schemas / fixtures in JSON / CSV / YAML / JSONL
- deterministic validator scripts and replay / concurrency harnesses
- browser-viewable internal labs / atlases / studios / cockpits where a prompt calls for them
- infrastructure-as-code, environment manifests, and sandbox-safe emulation where the prompt is runtime-focused

Machine-readable issue taxonomy:
- `PREREQUISITE_GAP_*` for missing or stale upstream dependencies
- `PARALLEL_INTERFACE_GAP_*` for missing shared seams required by the parallel block
- `FOLLOW_ON_DEPENDENCY_*` for intentionally deferred runtime or provider dependencies reserved to later roadmap tasks
- `GAP_*` for missing source detail that must be bounded or resolved
- `CONFLICT_*` for incompatible source statements
- `ASSUMPTION_*` for grounded defaults
- `RISK_*` for downstream hazards
- `DRIFT_*` for tuple, replay, trust, topology, or recovery mismatches
- `BLOCKER_*` for conditions that must halt further implementation or publication

Validation law:
- Every new artifact must carry explicit source traceability back to source file plus heading or logical block.
- Every HTML atlas or control console must be validated with `Playwright_or_other_appropriate_tooling` for navigation, accessibility landmarks, reduced-motion handling, stable `data-testid` anchors, and DOM stability.
- Every persistence or runtime change must have deterministic tests for replay, concurrency, and restart safety where relevant.
- Every machine-readable manifest must have a validator script that can fail CI on structural drift.
```
