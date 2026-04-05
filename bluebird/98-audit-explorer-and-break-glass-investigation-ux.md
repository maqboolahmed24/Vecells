# Audit Explorer and Break-Glass Investigation UX

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Audit Explorer and Break-Glass Investigation UX`.

Map this domain to `AuditQuerySession`, `AccessEventIndex`, `BreakGlassReviewRecord`, `SupportReplaySession`, `SupportReplayRestoreSettlement`, `DataSubjectTrace`, `ArtifactPresentationContract`, `OutboundNavigationGrant`, and the shared `OperationsConsoleShell` return semantics. Your mission is to fully resolve this failure class. Identify and eliminate every place where immutable audit, break-glass review, and support replay remain technically present but operationally unusable, over-scoped, or unsafe to exit back into live work.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the audit explorer, break-glass, support replay, artifact-handoff, and operations-shell return rules before making changes.
- Distinguish audit search truth, deterministic timeline reconstruction, break-glass review state, replay-safe read-only posture, and replay exit into live support work.
- Trace how operators search, reconstruct, diff, export, and pivot from audit into replay, support, governance, or evidence surfaces.
- Inspect how masking policy, route scope, timeline hash, reconstruction input hash, and safe return tokens constrain what may be seen or exported.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find audit and replay flows that still rely on raw logs, detached exports, or client-side joins of operational truth rather than governed projections and timeline hashes.
- Detect break-glass review queues or detail flows that do not surface reason adequacy, follow-up burden, visibility widening, or expiry posture clearly enough for governance review.
- Surface replay sessions that can reopen live support controls without current settlement, masking, continuity evidence, and restore eligibility all validating together.
- Examine whether investigation-bundle export, replay evidence export, and preserved artifact views stay summary-first and return-safe instead of detaching the operator into opaque export paths.
- Identify cases where cross-shell pivots into audit, assurance, or support lose the original diagnostic question, mask scope, or selected anchor.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat audit as a read-only log browser.
- Prefer one investigation UX where search, timeline reconstruction, break-glass review, replay-safe context, and export all resolve the same scope, masking, and continuity fence.
- If support replay and audit explorer currently diverge in reconstruction logic, redesign them around one deterministic timeline and one governed replay-exit contract.
- Ensure break-glass review and replay remain auditable and calm without sacrificing the ability to answer exact operational questions quickly.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Audit Explorer and Break-Glass Investigation UX` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
