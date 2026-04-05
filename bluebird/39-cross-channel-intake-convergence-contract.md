# Cross-Channel Intake Convergence Contract

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Cross-Channel Intake Convergence Contract`.

Map this domain to the repo’s promise that web, NHS App jump-off, and telephony or IVR all converge into one governed intake and triage pipeline using `SubmissionEnvelope`, normalization, safety screening, and one canonical request model. Your mission is to fully resolve this failure class. Identify and eliminate every place where channel-specific flows fork the intake contract, create divergent semantics, or bypass canonical normalization and safety.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the intake, identity, and telephony phases before making changes.
- Trace every entry path from channel-specific capture into envelope creation, evidence readiness, submit promotion, normalization, duplicate handling, and safety screening.
- Compare channel-specific evidence, identity confidence, contact provenance, and recovery behavior.
- Inspect whether all channels produce one compatible intake contract before the canonical request is created.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find where web, embedded, secure-link continuation, support capture, or telephony create divergent intake state or payload semantics.
- Detect channel-specific shortcuts that bypass canonical normalization, dedupe, or safety.
- Surface where route, session, or grant posture differs enough to change business meaning rather than just presentation.
- Examine whether receipts, ETAs, and patient-facing status remain consistent regardless of intake channel.
- Identify whether partial channel capability or degraded transport creates explicit fallback or silently weaker guarantees.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not force channels to be identical if their evidence quality differs.
- Prefer one canonical intake contract with explicit channel-specific evidence and capability ceilings.
- If channels currently converge too late, redesign promotion and normalization boundaries so shared logic begins sooner.
- Ensure channel differences are modeled explicitly, not hidden in ad hoc controller behavior.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Cross-Channel Intake Convergence Contract` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
