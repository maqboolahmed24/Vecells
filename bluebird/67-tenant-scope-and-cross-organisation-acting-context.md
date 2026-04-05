# Tenant Scope and Cross-Organisation Acting Context

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Tenant Scope and Cross-Organisation Acting Context`.

Map this domain to `GovernanceScopeToken`, `ConfigWorkspaceContext`, `StaffIdentityContext`, `ActingContext`, RBAC plus ABAC policy, purpose-of-use, break-glass, organisation switching, multi-tenant and platform scope, and cross-organisation coordination visibility. Your mission is to fully resolve this failure class. Identify and eliminate every place where tenant, organisation, environment, acting role, or purpose context can drift across review, approval, or live case work.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the governance, access administration, tenant config, and hub acting-context sections before making changes.
- Distinguish tenant scope, organisation scope, environment scope, policy plane, acting role, purpose-of-use, elevation state, and break-glass posture.
- Trace how scope and acting context are established, displayed, propagated to commands, and revalidated under drift.
- Inspect both governance mutation flows and live cross-organisation operational workflows.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find places where tenant or organisation scope is visible but not tokenized or version-bound.
- Detect commands or approvals that rely on raw role names or ambient session context instead of explicit acting context plus visibility contract.
- Surface stale organisation-switch, stale elevation, stale purpose-of-use, or stale scope-token hazards that could leave writable posture live.
- Examine whether multi-tenant and platform-level blast radius is explicit enough in governance and release flows.
- Identify where cross-organisation visibility may widen beyond minimum necessary because scope and acting context are not bound to the same consistency envelope.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not flatten all context into one role string or one tenant selector.
- Prefer explicit scope and acting-context tokens that bind tenant, organisation, environment, policy plane, purpose-of-use, and elevation to the current work object.
- If governance and live operational context use incompatible models, redesign them around shared context primitives with domain-specific projections.
- Ensure context drift freezes mutation in place and requires revalidation rather than silently reinterpreting authority.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Tenant Scope and Cross-Organisation Acting Context` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
