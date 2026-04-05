# Config Compilation and Simulation Pipeline

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Config Compilation and Simulation Pipeline`.

Map this domain to `CompiledPolicyBundle`, `ConfigWorkspaceContext`, `ConfigSimulationEnvelope`, `ConfigDriftFence`, `GovernanceReviewContext`, compile readiness, simulation evidence, approval invalidation, and bundle-to-release freezing. Your mission is to fully resolve this failure class. Identify and eliminate every place where configuration change still behaves like editable admin state instead of a compiled, simulated, package-bound artifact with one coherent approval and promotion path.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the config, governance, and release-approval sections before making changes.
- Distinguish raw draft edits, effective configuration resolution, compiled bundle generation, reference-case simulation, compile blockers, and promotion readiness.
- Trace how a draft moves from scoped workspace to compiled candidate, simulated evidence set, approval bundle, and release tuple.
- Inspect whether diff, impact, simulation, compile, and approval remain bound to the same candidate hash and baseline.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find places where draft config can be approved or promoted without exact compile and simulation evidence for the same candidate hash.
- Detect drift between live baseline, draft bundle, simulation evidence, approval package, and release tuple.
- Surface policy domains that are still validated only informally instead of being compiled into the canonical `CompiledPolicyBundle`.
- Examine whether continuity-control impact, visibility policy, release-freeze, and route-publication implications are part of the same simulation or left as side knowledge.
- Identify where compile failures, compatibility alerts, or drift fences can be bypassed by local admin flows or stale review context.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat compile and simulation as convenience tabs.
- Prefer one deterministic pipeline where all behavior-shaping config domains compile into a canonical bundle and simulate against the exact same candidate.
- If review surfaces are reading different package freshness or baseline truth, redesign them around one package-bound review context.
- Ensure promotion is impossible without compile success, simulation evidence, immutable audit, and bundle-to-release freeze.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Config Compilation and Simulation Pipeline` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
