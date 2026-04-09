# Shared Operating Contract For Prompts 086 To 095

```text
You are an autonomous coding agent operating on the Vecells repository. Treat the blueprint corpus under `blueprint/`, the live coordination protocol under `prompt/AGENT.md` and `prompt/checklist.md`, the validated outputs from tasks `001-085`, and the earlier populated prompt files in this repository as the definitive source algorithm plus execution serialization.

These prompts continue the active Phase 0 runtime-parallel block. Tasks `086-095` complete the core runtime substrate that later frontend, release, verification, and operational-control tracks depend on. Before executing any task in this batch, verify that the outputs from tasks `001-085` exist, remain internally coherent, and are still traceable to the canonical blueprint corpus.

At minimum, require these upstream outputs to be present and usable:

- tasks `001-005`: requirement registry, summary reconciliation, scope boundary, audience/surface inventory, request-lineage model
- tasks `006-010`: glossary, state/invariant atlas, external dependency inventory, safety/privacy/data posture
- tasks `011-020`: cloud-region, monorepo/runtime/frontend/tooling baselines, ADRs, merge gates, risk/watchlists, traceability, Phase 0 entry gate
- tasks `021-040`: dependency selection, onboarding strategy, mock-vs-live provider strategy, simulator backlog, degraded-mode defaults
- tasks `041-055`: repository topology, service and package scaffolds, runtime topology, trust boundaries, event namespace, FHIR strategy, frontend manifest strategy, release/publication parity strategy, design publication, WORM audit, acting-scope tuple law, lifecycle-coordinator and closure-blocker law
- tasks `056-061`: scoped mutation gate, route-intent law, adapter profile law, verification ladder, seed/simulator strategy, backup/restore tuple, and the open-parallel gate
- tasks `062-075`: canonical submission/evidence/FHIR/API/identity/reachability/duplicate/lease/settlement/queue/reservation/freeze-trust primitives and services
- tasks `076-085`: fallback closure rules, access-grant authority, evidence and safety orchestration, identity repair, reservation authority, deterministic rebuilds, simulator backplanes, core networking, and data-plane storage foundations

If a prerequisite output is missing, stale, contradictory, or no longer source-traceable, fail fast with bounded `PREREQUISITE_GAP_*` records. Do not silently regenerate earlier work and pretend the dependency chain is intact.

You must also treat these repository files as live coordination inputs where relevant:
- `prompt/AGENT.md` for claim and sequencing protocol
- `prompt/checklist.md` for canonical task ordering
- earlier populated `prompt/*.md` files as the implementation-spec layer already chosen for the repo

Authoritative source order:
1. `phase-0-the-foundation-protocol.md` for canonical objects, state axes, invariants, lifecycle ownership, route-intent law, command-settlement law, release-trust law, evidence law, observability law, and foundational runtime contracts.
2. The relevant phase files for phase-specific behavior:
   - `phase-1-the-red-flag-gate.md`
   - `phase-2-identity-and-echoes.md`
   - `phase-3-the-human-checkpoint.md`
   - `phase-4-the-booking-engine.md`
   - `phase-5-the-network-horizon.md`
   - `phase-6-the-pharmacy-loop.md`
   - `phase-7-inside-the-nhs-app.md` only as deferred-channel input when embedded constraints or bridge floors matter
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

For task `086`:
- Binary evidence, derivatives, and presentation-safe artifacts remain immutable and content-traceable. Object storage is a governed artifact plane, not an ad hoc file dump.
- Quarantine, trusted evidence, derived packages, redacted outputs, and temporary outbound-export classes must remain explicitly separated in storage class, retention posture, and access policy.
- Bucket names, object keys, signed URLs, CDN paths, or object metadata must never become the source of truth for visibility, writability, or release safety; authoritative state still lives in canonical aggregates, evidence records, and artifact contracts.

For task `087`:
- The canonical event namespace and contract catalogue from Phase 0 are authoritative. Runtime queue names, broker topics, and subscription groups may derive from that catalogue, but they may not invent parallel event names or side-channel semantics.
- Outbox and inbox durability must preserve idempotency, ordering guarantees where declared, callback correlation, and exact settlement traceability.
- Gateways, browsers, and projection-only helpers may not publish directly to the event spine outside declared service seams.

For task `088`:
- Cache and live-update transport are continuity infrastructure, not business truth.
- Transport health, websocket presence, SSE connection state, or warm cache entries may not imply writable posture, fresh truth, or calm success.
- This task provisions the substrate only. Route-family-specific `ClientCachePolicy`, `LiveUpdateChannelContract`, downgrade semantics, and recovery posture remain owned by task `096` and later publication work unless a bounded shared seam is strictly necessary.

For task `089`:
- Secrets must never appear in source, build output, browser payloads, client logs, traces, screenshots, or long-lived CI variables.
- Keys, secret classes, envelope-encryption refs, rotation windows, and break-glass reads must publish as machine-readable control artifacts.
- The mock-now path may emulate secret backends, but the retrieval and rotation seams must remain identical to the live path.

For task `090`:
- One `GatewayBffSurface` is the only browser-addressable compute boundary for one audience family or one explicitly declared combined audience surface.
- No generic mega-BFF may silently read raw data planes, call partner adapters directly, or expose undeclared mutations.
- Audience-specific gateway surfaces must remain bound to exact route families, tenant isolation modes, trust boundaries, frontend contract manifests, release freeze posture, and assurance trust posture.

For task `091`:
- Build provenance is authoritative only while verification state remains `verified`; quarantined, revoked, or drifted provenance must block runtime consumption.
- CI/CD is part of the runtime control plane. Pipelines, signatures, SBOMs, attestation chains, and verification gates must publish machine-readable records, not dashboard folklore.
- This task may provision release gates and provenance enforcement, but live-wave observation and watch-tuple widening logic remain owned by task `097`.

For task `092`:
- Preview environments are governed, synthetic, and ephemeral. They are not shadow production and may not quietly accumulate PHI or manual drift.
- Preview resets must restore exact seeded tuples, publication state, and runtime contracts rather than merely truncating a few tables.
- Preview availability does not replace release evidence, backup evidence, or canary evidence from later tasks.

For task `093`:
- `edgeCorrelationId` is minted once at the edge and carried through browser, gateway, command handler, event bus, worker, projection, UI visibility receipt, and audit.
- Telemetry must remain PHI-safe, redaction-aware, and replayable for continuity, restore, and stale-posture analysis.
- Browser-side observability must bind to the same authoritative continuity, route-intent, and settlement chain rather than inventing local causal shortcuts.

For task `094`:
- `RuntimePublicationBundle` and `ReleasePublicationParityRecord` are the only machine-readable runtime publication authority. Route compilation, deployment success, or green dashboards are insufficient.
- Topology, gateway surfaces, manifests, projection contracts, mutation contracts, live-channel contracts, cache policies, design bundles, provenance verdicts, and recovery dispositions must publish together.
- This task may implement publication-bundle and parity generation, but watch-tuple observation and live-wave actioning remain owned by task `097`.

For task `095`:
- Schema migration and projection backfill must follow expand-migrate-contract discipline and must publish machine-readable plans, bindings, observation windows, and readiness verdicts.
- Projection backfill may rebuild read models, but it may never become authoritative business truth.
- Migration runners, backfill runners, and readiness verifiers must remain deterministic, restart-safe, idempotent, and auditable.

Mock-now vs actual-later law:
- Every prompt in this batch contains both `Mock_now_execution` and `Actual_production_strategy_later` sections. Honor both.
- `Mock_now_execution` must deliver high-fidelity local, CI, or sandbox-safe infrastructure that preserves the same contracts, manifests, identifiers, degradation classes, and trust semantics the live system will require.
- `Actual_production_strategy_later` must not rewrite aggregate law, route authority, publication tuples, trust boundaries, or continuity semantics. Live cutover changes providers, managed services, credentials, scale posture, and operational evidence only through the seams already published now.
- If a managed cloud feature or production governance input is unavailable, build the bounded mock path now and emit explicit cutover checklists later. Do not leave TODO-only placeholders.

Parallel-execution discipline:
- This batch still sits inside the active Phase 0 parallel block. Do not depend on unpublished sibling-track internals.
- If a sibling seam is required but not yet materialized, create the smallest bounded shared contract stub in the correct shared package, record `PARALLEL_INTERFACE_GAP_*`, and continue without violating ownership.
- Keep implementation aligned with the earlier package, service, contract, and runtime manifests produced in tasks `041-085`.
- Do not steal ownership from tasks `096-102`:
  - task `088` may provision cache and transport substrate, but route-specific cache policies, live-channel contracts, and downgrade semantics remain a later task unless a strict shared seam is needed
  - task `091` may provision release gates and provenance verification, but watch-tuple policy and live-wave action pipelines remain a later task
  - task `092` may provision preview environments and reset control, but backup/restore snapshot baselines and rollback harness depth remain later tasks
  - task `094` may build publication bundles and parity records, but live-wave observation remains a later task
  - task `095` may build migration/backfill runners and example plans, but future release-specific migration decisions still belong to release verification work

Non-negotiable interpretation rules:
- Do not invent behavior that contradicts the blueprint corpus.
- Do not silently merge conflicting terminology, state models, or ownership rules.
- Preserve the orthogonality of `submissionEnvelopeState`, `workflowState`, `safetyState`, and `identityState`.
- Preserve the rule that child domains emit facts, milestones, blockers, and evidence, but only `LifecycleCoordinator` derives canonical `Request` milestone change and closure.
- Treat web, NHS App jump-off or embedded, phone/IVR, secure-link continuation, and support-assisted capture as variants of one governed lineage.
- Treat supplier-specific behavior as adapter-bound capability, never as core business logic.
- Treat degraded, fallback, repair, quarantine, and ambiguity states as first-class runtime outputs, not leftovers.
- Treat the forensic audit as mandatory patch guidance; any relevant finding must be incorporated or explicitly marked not applicable with rationale.
- Treat machine-readable manifests, hashes, bundle refs, and tuples as authoritative runtime evidence. Diagrams, wiki pages, and dashboard screenshots are helpful only when generated from those authorities.
- Any browser-viewable artifact, atlas, or internal console created in this batch must be minimalist premium, deeply information-dense, accessible, keyboard-usable, and driven with `Playwright_or_other_appropriate_tooling` from the start.

Execution standards:
- Parse and honor the relevant markdown and mermaid blueprint sources before coding.
- Produce machine-readable outputs in addition to human-readable summaries.
- Every derived artifact must include explicit traceability back to source file plus heading or logical block.
- Every unresolved issue must be emitted as one of:
  - `GAP_*` for missing algorithm detail that must be resolved now,
  - `CONFLICT_*` for incompatible source statements,
  - `ASSUMPTION_*` for grounded default decisions,
  - `RISK_*` for downstream implementation hazards,
  - `FOLLOW_ON_DEPENDENCY_*` for roadmap-owned future work.
- Where a gap can be safely resolved by applying the blueprint’s own architectural intent, resolve it and document the resolution.
- Where a gap cannot be safely resolved without contradicting the corpus, leave it explicit and bounded.
- Prefer checked-in JSON, CSV, YAML, or JSONL for manifests, matrices, and machine-readable contracts.
- Generated outputs must be deterministic; re-running a task should not scramble identifiers, ordering, or hashes except where true content changes.

Validation expectations:
- Add lightweight scripts where needed to parse, normalize, and verify outputs.
- Any HTML atlas or internal browser-viewable artifact must be validated with `Playwright_or_other_appropriate_tooling` for navigation, accessibility landmarks, keyboard use, responsive stability, and DOM-state determinism.
- Infrastructure or backend provisioning work must include smoke tests proving fail-closed posture when required contracts, secrets, trust boundaries, manifests, or provenance are missing, stale, drifted, or quarantined.
```