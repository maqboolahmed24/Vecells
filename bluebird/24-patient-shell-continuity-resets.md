# Patient Shell Continuity Resets

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Patient Shell Continuity Resets`.

Map this domain to `PersistentShell`, `PatientShellConsistencyProjection`, `PatientNavUrgencyDigest`, `PatientNavReturnContract`, request-shell reuse, same-shell recovery, and any equivalent continuity layer across home, requests, booking, messaging, records, pharmacy, and recovery flows. Your mission is to fully resolve this failure class. Identify and eliminate every place where the patient experience hard-resets, loses anchor state, forks context, or presents adjacent states as unrelated pages instead of one continuous lineage-aware shell.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the full patient route model before making changes., including home, requests list, request detail, booking, callback, records, messaging, consent, and recovery paths.
- Trace `entityContinuityKey`, selected anchors, return bundles, and recovery continuation tokens across route transitions, refreshes, deep links, and re-auth flows.
- Inspect how pending, stale, blocked, and read-only states are rendered without breaking shell continuity.
- Compare embedded, mobile, and standalone behavior where relevant.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find all route transitions that destroy shell continuity for the same governing request or adjacent child state.
- Detect detached success pages, generic expired-link pages, hard reloads, or history-stack churn standing in for same-shell progression.
- Surface places where the shell appears calm and fresh while `PatientShellConsistencyProjection` or continuity evidence is stale or blocked.
- Examine whether record-origin follow-up, booking return, message return, and recovery flows preserve the correct return bundle and anchor.
- Identify whether continuity resets happen because of routing, projection fragmentation, release freeze posture, or poor object-boundary design.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not patch this with more breadcrumbs.
- Prefer one governing continuity model, one shared shell, and explicit in-place recovery states.
- If route families are too detached from domain object lineage, redesign the adjacency and return contracts.
- Ensure continuity is enforced by domain and route contracts, not left to browser history behavior.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Patient Shell Continuity Resets` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
