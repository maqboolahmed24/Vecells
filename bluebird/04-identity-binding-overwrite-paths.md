# IdentityBinding Overwrite Paths

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `IdentityBinding Overwrite Paths`.

Map `IdentityBinding` to the system's patient-binding record, subject-link authority, user-to-record binding object, verified identity association, or equivalent domain object. Your mission is to fully resolve this failure class. Identify and eliminate every place where authentication, demographic matching, phone verification, support intervention, session recovery, or downstream side effects can overwrite subject binding directly instead of flowing through a controlled identity-binding model.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full identity lifecycle from anonymous entry through match, claim, correction, revocation, and recovery.
- Distinguish authentication from authorization, matching from claiming, and contact-route proof from patient ownership.
- Inspect session logic, secure links, support tools, imports, backfills, and adapter callbacks for direct writes to bound subject fields.
- Trace how identity state reaches UI surfaces, permissions, projections, and audit.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find all direct writes to canonical subject or patient references that bypass the binding authority.
- Detect places where a low-confidence match becomes effective truth without an explicit binding decision.
- Surface any path where session or route recovery can resurrect a stale binding.
- Examine how identity versioning interacts with grants, leases, snapshots, and downstream cases.
- Identify whether wrong-patient suspicion, partial-match states, and post-claim corrections are first-class or improvised.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not paper over the issue with more null checks.
- Prefer one authoritative identity-binding workflow with explicit states, versions, correction holds, and supersession rules.
- If multiple services can currently rewrite identity, redesign ownership and write authority.
- Ensure projections and UI affordances derive from binding truth, not from ambient session assumptions.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `IdentityBinding Overwrite Paths` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
