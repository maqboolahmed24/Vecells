# Operations-to-Governance Control Handoff

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Operations-to-Governance Control Handoff`.

Map this domain to `OpsReturnToken`, `OpsInterventionSettlement`, governance handoff routes, `GovernanceScopeToken`, `GovernanceReturnIntentToken`, runtime publication parity, rollout freeze posture, and the split between live operational diagnosis and governed mutation or approval work. Your mission is to fully resolve this failure class. Identify and eliminate every place where the repository’s control-room and governance shells stop behaving like one governed handoff seam and instead drift into duplicate authority, stale return context, or inconsistent action posture.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the operations console, governance shell, and runtime-release control plane before making changes.
- Distinguish operational diagnosis, advisory intervention, governed mutation, approval, promotion, rollback, and watch-mode stabilization.
- Trace how an operator moves from anomaly detection to governance handoff and back to the board.
- Inspect how scope, board state, publication parity, recovery disposition, and action settlement survive that handoff.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find places where operations surfaces can perform governance-grade mutation without entering the governance shell.
- Detect stale or under-scoped `OpsReturnToken` and `GovernanceReturnIntentToken` flows that restore the wrong board, scope, or approval context.
- Surface where runtime guardrail, channel-freeze, or publication-parity truth can disagree between operations and governance views.
- Examine whether `handoff_required`, `blocked_guardrail`, and live read-only diagnostic posture are explicit and authoritative enough.
- Identify whether governance evidence pivots preserve scope, baseline, watch tuple, and return safety without ambient browser-history assumptions.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not merge operations and governance into one generic admin surface.
- Prefer a hard boundary between diagnosis and governed control, with typed handoff and return contracts.
- If operations can still mutate by side door, redesign the seam so governance owns package-bound action and approval.
- Ensure the return path restores the nearest valid context when tokens, scope, or runtime posture drift.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Operations-to-Governance Control Handoff` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
