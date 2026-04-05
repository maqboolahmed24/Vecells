# Release Tuple and Wave Guardrail Model

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Release Tuple and Wave Guardrail Model`.

Map this domain to `ReleaseCandidate`, `ReleaseApprovalFreeze`, `PromotionIntentEnvelope`, `WaveEligibilitySnapshot`, `WaveGuardrailSnapshot`, `WaveControlFence`, `WaveActionRecord`, `WaveActionSettlement`, `ReleasePublicationParityRecord`, `watchTupleHash`, and post-promotion observation windows. Your mission is to fully resolve this failure class. Identify and eliminate every place where the release tuple and staged-wave controls are still treated as loosely related records instead of one causal, guardrail-driven rollout model.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the release, runtime publication, governance watch, and operations guardrail sections before making changes.
- Distinguish approved tuple freeze, publication parity, rollout eligibility, live guardrail evaluation, observation windows, and wave-action causality.
- Trace how a release moves from approved tuple to canary, widening, pause, rollback, kill-switch, and stabilization.
- Inspect whether the same tuple, watch, and guardrail facts are visible to governance, operations, and shell consumers.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find places where wave actions operate against inferred or moving eligibility, publication, or guardrail state.
- Detect where approved tuple members, runtime publication, continuity evidence, or recovery dispositions can drift independently after approval.
- Surface cases where `applied`, `stabilized`, or safe widening can be implied before publication parity and live convergence are exact.
- Examine whether rollback, rollforward, pause, resume, and kill-switch share one causal lineage or remain disconnected operator events.
- Identify whether emergency exceptions, channel freezes, and degraded assurance slices constrain waves as first-class inputs or only as dashboard commentary.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat rollout waves as simple feature-flag cohorts.
- Prefer one frozen release tuple, one frozen eligibility snapshot per wave step, and one guardrail model that can halt or reverse rollout when live truth drifts.
- If wave actions are currently decoupled from tuple parity and observation evidence, redesign them around authoritative settlements and causal supersession.
- Ensure governance approval, operations control, and runtime publication all reference the same machine-readable tuple and watch state.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Release Tuple and Wave Guardrail Model` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
