# Canonical Event Taxonomy Completeness

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Canonical Event Taxonomy Completeness`.

Map this domain to the repo’s canonical event namespaces such as `request.*`, `intake.*`, `identity.*`, `telephony.*`, `safety.*`, `triage.*`, `booking.*`, `hub.*`, `pharmacy.*`, `patient.*`, `communication.*`, `assistive.*`, `analytics.*`, and `audit.*`. Your mission is to fully resolve this failure class. Identify and eliminate event blind spots, inconsistent naming, duplicate taxonomies, missing lifecycle transitions, and places where critical behavior occurs without a canonical event.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the event catalogues in the blueprints before making changes.
- Map important domain transitions, control-plane changes, recovery states, and continuity evidence sources to the events that should represent them.
- Inspect whether external adapter signals are normalized into the canonical taxonomy or left as parallel namespaces.
- Compare event needs for projections, analytics, assurance, audit, and replay.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find domain transitions that lack canonical events.
- Detect duplicate or conflicting namespaces that would fragment downstream consumers.
- Surface events that exist but are too weak to support replay, audit, or operational diagnosis.
- Examine whether event payloads carry the right identifiers, causal context, and privacy posture.
- Identify whether continuity evidence, degraded receipts, quarantine, repair, confirmation gates, and closure-blocker changes are represented explicitly enough.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not add events indiscriminately; design the taxonomy.
- Prefer a clear canonical namespace set, stable semantics, and well-defined event purposes.
- If some current flows use legacy or adapter-local events, normalize them before they reach projections and assurance consumers.
- Ensure events can support replay and diagnosis without leaking raw sensitive data.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Canonical Event Taxonomy Completeness` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
