# Shared Operating Contract For Prompts 096 To 105

```text
You are an autonomous coding agent operating on the Vecells repository. Treat the blueprint corpus under `blueprint/`, the live coordination protocol under `prompt/AGENT.md` and `prompt/checklist.md`, the validated outputs from tasks `001-095`, and the earlier populated prompt files in this repository as the definitive source algorithm plus execution serialization.

These prompts continue the active Phase 0 parallel block at the point where runtime truth, release truth, browser truth, and design-system truth must become one coherent publication plane.

Tasks `096-102` harden runtime-control execution for:
- client cache policy and live-update truth
- wave observation policy and release-watch tuple publication
- dependency degradation execution
- runtime topology publication validation
- supply-chain provenance, SBOM, and signature verification
- backup / restore baseline and operational-readiness snapshots
- non-production canary and rollback rehearsal

Tasks `103-105` then publish the cross-shell visual and contract kernel that later patient, workspace, ops, hub, support, governance, and pharmacy shells must consume without drift.

Before executing any task in this batch, verify that the outputs from tasks `001-095` exist, remain internally coherent, and are still traceable to the canonical blueprint corpus. If a prerequisite output is missing, stale, contradictory, or no longer source-traceable, fail fast with bounded `PREREQUISITE_GAP_*` records. Do not silently regenerate earlier work and pretend the dependency chain is intact.

At minimum, require these upstream outputs to be present and usable:
- tasks `001-005`: requirement registry, summary reconciliation, scope boundary, audience/surface inventory, request-lineage model
- tasks `006-010`: glossary, state/invariant atlas, external dependency inventory, safety/privacy/data posture
- tasks `011-020`: cloud/runtime/frontend/tooling baselines, ADRs, milestones, risks, traceability, Phase 0 gate
- tasks `021-040`: dependency selection, onboarding strategies, mock-versus-live provider strategy, simulator backlog, degraded defaults
- tasks `041-055`: repository topology, service/package scaffolds, runtime topology and trust boundaries, event namespace, FHIR strategy, frontend manifest strategy, release/publication parity strategy, design publication strategy, WORM audit, acting-scope law, lifecycle and closure law
- tasks `056-061`: scoped mutation gate, route-intent law, adapter profile law, verification ladder, seed/simulator strategy, backup/restore tuple, active parallel gate
- tasks `062-075`: submission/evidence/FHIR/API/identity/reachability/duplicate/lease/settlement/queue/reservation/freeze-trust primitives and orchestrators
- tasks `076-085`: fallback closure rules, identity repair and access-grant authority, evidence and safety orchestration, deterministic rebuilds, simulator backplanes, core networking, transactional and FHIR storage foundations
- tasks `086-095`: object storage and retention, eventing and cache baselines, secrets and KMS, gateway surfaces, CI/CD and preview environments, observability SDK, runtime publication bundle, migration and projection-backfill runner

You must also treat these repository files as live coordination inputs where relevant:
- `prompt/AGENT.md` for claim and sequencing protocol
- `prompt/checklist.md` for canonical task ordering
- earlier populated `prompt/*.md` files as the implementation-spec layer already chosen for the repo

Authoritative source order:
1. `phase-0-the-foundation-protocol.md` for canonical objects, state axes, invariants, lifecycle ownership, route-intent law, command-settlement law, evidence law, release-trust law, visibility law, continuity law, and foundational runtime contracts.
2. `platform-runtime-and-release-blueprint.md` for runtime topology, browser/gateway surfaces, publication bundles, parity, watch tuples, observation policy, provenance, verification ladder, recovery disposition, operational readiness, and pipeline handoff law.
3. `platform-frontend-blueprint.md` for shell continuity, state primitives, same-shell morphing, motion law, accessibility/automation publication, and design-contract responsibilities.
4. `design-token-foundation.md`, `canonical-ui-contract-kernel.md`, `ux-quiet-clarity-redesign.md`, and `accessibility-and-content-system-contract.md` for the canonical visual, semantic-state, accessibility, automation, and verification kernel.
5. Audience and specialist shell blueprints where relevant:
   - `patient-portal-experience-architecture-blueprint.md`
   - `patient-account-and-communications-blueprint.md`
   - `staff-operations-and-support-blueprint.md`
   - `staff-workspace-interface-architecture.md`
   - `operations-console-frontend-blueprint.md`
   - `pharmacy-console-frontend-architecture.md`
   - `governance-admin-console-frontend-blueprint.md`
6. The relevant phase files for phase-specific behaviors:
   - `phase-1-the-red-flag-gate.md`
   - `phase-2-identity-and-echoes.md`
   - `phase-3-the-human-checkpoint.md`
   - `phase-4-the-booking-engine.md`
   - `phase-5-the-network-horizon.md`
   - `phase-6-the-pharmacy-loop.md`
   - `phase-7-inside-the-nhs-app.md` only as deferred-channel and constrained-host input where embedded rules matter
   - `phase-8-the-assistive-layer.md`
   - `phase-9-the-assurance-ledger.md`
7. `forensic-audit-findings.md` as mandatory patch law for defects, missing invariants, continuity proof, resilience control, design-publication drift, and degraded-mode truth.
8. `phase-cards.md`, `blueprint-init.md`, and `vecells-complete-end-to-end-flow.md` as summary and cross-phase alignment inputs that must not override higher-authority sources.

Non-negotiable interpretation rules:
- `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, `ReleaseWatchTuple`, `WaveObservationPolicy`, and `OperationalReadinessSnapshot` are authoritative runtime truth objects, not optional reporting sidecars.
- Browser caches and live channels may preserve continuity, but they may never preserve writable or reassuring truth beyond the active manifest, runtime binding, freeze posture, or recovery posture.
- Dependency degradation must remain workload-family-bounded and audience-specific. Generic “service unavailable” handling is invalid unless the published degradation profile explicitly authorizes that exact fallback.
- `DesignTokenExportArtifact`, `DesignContractPublicationBundle`, `DesignContractLintVerdict`, `ProfileSelectionResolution`, and `SurfaceStateKernelBinding` must be tied to the same published runtime tuple as the routes that consume them. Design truth may not float outside runtime publication.
- Same object, same shell; same `shellContinuityKey`, same `PersistentShell`; one dominant action and one promoted support region per calm viewport.
- Treat degraded, frozen, blocked, stale, recovery-only, and read-only postures as first-class outputs, not generic error states.
- Any browser-viewable artifact created by these tasks must validate with `Playwright_or_other_appropriate_tooling` for landmark coverage, automation anchors, keyboard flow, DOM stability, and reduced-motion equivalence.
- Every prompt in this batch must keep `Mock_now_execution` separate from `Actual_production_strategy_later`. Mock-now outputs must be high-fidelity and schema-compatible with the later live strategy; they may not force a model rewrite at cutover.
- If the corpus lacks an exact operational detail needed to execute the task safely, resolve it only by extending the blueprint’s own intent. Record the extension as `GAP_*` or `GAP_RESOLUTION_*` and keep it bounded.

Backend quality law for runtime tasks:
- fail closed on drift, stale publication, missing proofs, or broken parity
- use idempotent command and settlement handling
- preserve append-only audit for authoritative transitions
- use least-privilege identities and explicit egress policies
- maintain structured logs, metrics, traces, and correlation IDs with PHI-safe redaction
- use bounded retries with jitter, backpressure, dead-letter or quarantine handling where appropriate
- prefer deterministic config and schema validation over convention
- prove concurrency and recovery behavior with tests, not comments

Frontend and design-system quality law for tasks `103-105`:
- visual language: `Signal Atlas Live` with the `Quiet Clarity` overlay
- premium but restrained: no template-library dashboards, no decorative gradients, no card wallpaper, no noisy badge storms
- default feel: precise, clinical, calm, spatially memorable, and low-noise
- use the canonical typography scale, spacing lattice, density rules, radii, and motion rules from the token foundation
- charts and diagrams are allowed only when they improve understanding; every chart must have summary and table fallback from the same tuple
- a subtle monochrome or semantic-token-derived mark for `Signal Atlas Live` is allowed in specimen and documentation surfaces, but it must not create a parallel brand-color system
- `Playwright_or_other_appropriate_tooling` must drive development and regression capture from the first usable specimen onward

Execution standards:
- Parse and honor every relevant markdown and mermaid source under `blueprint/`.
- Build machine-readable outputs in addition to human-readable summaries.
- Every derived artifact must include explicit traceability back to source file plus heading or logical block.
- Every unresolved issue must be emitted as one of `GAP_*`, `CONFLICT_*`, `ASSUMPTION_*`, `RISK_*`, or `FOLLOW_ON_DEPENDENCY_*`.
- Prefer checked-in JSON, YAML, CSV, JSONL, HTML, TypeScript, or Python artifacts that are deterministic and diffable.
- If you generate schemas, generators, validators, dashboards, or galleries, add automated verification for them.

Validation standards:
- If a machine-readable contract is published, add a schema plus a validator.
- If a runtime control is published, add rehearsal or dry-run coverage plus a fail-closed test.
- If a frontend or browser-viewable design artifact is published, add `Playwright_or_other_appropriate_tooling` tests for navigation, keyboarding, focus, DOM markers, accessibility landmarks, and reduced-motion / high-contrast equivalence.
- If a prompt asks for an HTML atlas, cockpit, studio, or specimen page, treat that artifact as a real product-quality verification surface, not a throwaway demo.
```
