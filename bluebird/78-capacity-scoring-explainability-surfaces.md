# Capacity Scoring Explainability Surfaces

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Capacity Scoring Explainability Surfaces`.

Map this domain to `RankPlan`, `SlotSetSnapshot`, `OfferSession`, `NormalizedSlot.rankFeatures`, `scoreExplanation`, `CrossSiteDecisionPlan`, `NetworkSlotCandidate`, `robustFit`, `uncertaintyRadius`, frontier membership, `rankPlanVersionRef`, and any patient, staff, support, or operations surface that explains why one capacity option is ordered above another. Your mission is to fully resolve this failure class. Identify and eliminate every place where ranking proof, explanation grammar, and audience-safe disclosure drift apart, leaving recommendation behavior opaque, unstable, or misleading.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the booking ranking, hub ranking, normalized feature, tie-break, and explanation rules before making changes.
- Distinguish the internal ranking proof, stable ordering proof, structured explanation payload, patient-safe reason language, and staff or ops diagnostic detail.
- Trace how feature values, frontier membership, uncertainty posture, and tie-break keys are computed, persisted, reused, and rendered across self-service, staff, support, and audit paths.
- Inspect where ranking is re-scored in the UI, summarized differently by audience, or detached from the persisted plan version.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find surfaces where the rendered explanation does not match the persisted rank proof, normalized features, or stable tie-break ordering.
- Detect hidden client-side rescoring, pagination drift, or filter-driven reordering that changes visible recommendation order without updating the underlying explanation chain.
- Surface places where patient-visible guidance shows opaque numeric scores, false precision, or implicit auto-selection instead of plain-language advisory reasons.
- Examine whether staff, support, and operations users can recover the exact `scoreExplanation`, frontier membership, and uncertainty posture that produced the observed ordering.
- Identify where local booking and hub coordination explainability diverge even though they rely on related capacity-ranking concepts and should remain causally coherent.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat explainability as tooltip copy layered onto a black-box scorer.
- Prefer one persisted ranking proof that drives pagination, display order, and every audience-specific explanation surface.
- If explanation payloads are currently rendered text only, redesign them as structured reason codes and normalized feature values that can be safely transformed per audience tier.
- Ensure patient surfaces guide choice without funneling, while staff and ops surfaces preserve enough rank proof for replay, support, and audit.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Capacity Scoring Explainability Surfaces` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
