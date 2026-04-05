# Self-Care vs Admin-Resolution Boundary Object

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Self-Care vs Admin-Resolution Boundary Object`.

Map this domain to `SelfCareBoundaryDecision`, `SelfCareExperienceProjection`, `AdminResolutionExperienceProjection`, patient and staff self-care advice, bounded operational follow-up, and the admin-only guardrails around clinically meaningful changes. Your mission is to fully resolve this failure class. Identify and eliminate every place where informational self-care content and administrative resolution work are still separated only by UI wording or route labels instead of an explicit governing boundary object.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the self-care and admin-resolution blueprint plus related patient and workspace shell contracts before making changes.
- Distinguish advice content, operational follow-up, clinically meaningful re-entry, and admin-only bounded action.
- Trace how a case moves from self-care eligibility into admin-resolution or back into clinician-governed work when evidence changes.
- Inspect how the boundary decision binds routes, mutating actions, and continuity or recovery posture.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find flows where self-care content can drift into operational resolution without an explicit boundary decision.
- Detect admin-resolution paths that continue after new symptoms, material evidence, or re-safety requirements should reopen boundary review.
- Surface where patient and staff surfaces use the same words but not the same governing boundary object or settlement posture.
- Examine whether admin-only actions, clinically governed flows, and informational advice are cleanly separated in mutation gates and route contracts.
- Identify places where self-care or admin-resolution routes can appear writable under stale shell, publication, or embedded-channel posture.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not rely on content tone alone to separate advice from operational work.
- Prefer one first-class boundary decision that governs whether the experience remains self-care, enters admin-resolution, or must reopen clinical review.
- If admin-resolution currently smuggles in clinical meaning, redesign the boundary so operational action stays bounded and reclassifies aggressively when evidence changes.
- Ensure patient and staff surfaces remain continuity-safe and settle through authoritative records, not analytics-only side effects.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Self-Care vs Admin-Resolution Boundary Object` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
