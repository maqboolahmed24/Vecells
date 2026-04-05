# Structured Assistive Feedback Capture Loop

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Structured Assistive Feedback Capture Loop`.

Map this domain to `AssistiveSession`, `AssistiveArtifactActionRecord`, `OverrideRecord`, `FeedbackEligibilityFlag`, `HumanApprovalGateAssessment`, `FinalHumanArtifact`, `UITelemetryDisclosureFence`, and any accept, edit, reject, regenerate, dismiss, abstain, or stale-recovery action taken against assistive output. Your mission is to fully resolve this failure class. Identify and eliminate every place where human review signals are missing, ambiguous, unsafe to train on, or disconnected from authoritative workflow settlement and audit evidence.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the assistive session, workspace integration, approval-gate, override, training-eligibility, and UI telemetry rules before making changes.
- Distinguish visible action capture, material override capture, final human artifact truth, approval-gate settlement, and feedback eligibility for training or adjudication.
- Trace a suggestion from surfaced artifact through edit, approval, workflow settlement, later supersession, incident linkage, and eventual feedback disposition.
- Inspect how selected anchor, review version, artifact hash, lease validity, and continuity posture stay aligned across action capture and adjudication.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find visible assistive actions that fail to persist one authoritative `AssistiveArtifactActionRecord`, or that record multiple conflicting truths for a single human gesture.
- Detect `OverrideRecord` capture that is too weak, too late, or too generic to distinguish cosmetic edits from material disagreement, policy exception, or trust recovery.
- Surface feedback pipelines that mark outputs trainable before the final human artifact settles, before incident linkage clears, or while adjudication is still required.
- Examine whether reason capture is progressive but deterministic, with required codes for materially different edits, rejections, low-confidence acceptances, and policy exceptions.
- Identify telemetry paths that leak PHI-bearing prompt fragments, hidden evidence spans, or route params while recording assistive usage.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat feedback capture as an analytics add-on after the real workflow is complete.
- Prefer one end-to-end feedback contract that binds visible action, human override, approval gate, final artifact, and training eligibility to the same settled truth.
- If action capture and adjudication currently live in disconnected systems, redesign them around one causal chain with explicit exclusion and supersession states.
- Ensure every trainable label is provenance-backed, settlement-backed, and contestable in post-incident review.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Structured Assistive Feedback Capture Loop` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
