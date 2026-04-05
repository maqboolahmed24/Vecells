# Same-Shell Recovery for Expired or Stale Patient Actions

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Same-Shell Recovery for Expired or Stale Patient Actions`.

Map this domain to `PatientSecureLinkSessionProjection`, `PatientActionSettlementProjection`, `AccessGrant`, `RouteIntentBinding`, `RecoveryContinuationToken`, `PatientRequestReturnBundle`, `CommandSettlementRecord(result = stale_recoverable | expired | blocked_policy | denied_scope)`, and any secure-link, authenticated, embedded, or child-route action that can expire or drift. Your mission is to fully resolve this failure class. Identify and eliminate every place where expired, superseded, or stale patient actions still collapse into broken redirects, blank failures, or subject-confusing re-entry instead of bounded same-shell recovery.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the secure-link, patient-action settlement, patient-nav recovery, and canonical stale-action rules before making changes.
- Distinguish local acknowledgement, authoritative settlement, recovery eligibility, non-sensitive preserved context, and final reassurance.
- Trace how stale session, stale binding, stale lineage, expired grant, consent expiry, step-up requirement, and disputed downstream confirmation are surfaced.
- Inspect how the shell preserves anchors, summaries, return bundles, and continuation tokens while stripping unsafe actionability.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find patient flows that hard-fail to generic home, generic success, or 404 when lineage-safe recovery still exists.
- Detect where expired or stale actions can reopen old composers, old CTAs, or mismatched subjects.
- Surface cases where secure-link, portal, and embedded entry paths implement different stale-action semantics for the same underlying action.
- Examine whether blocked reasons, safest next steps, and pending or review context are explicit enough without leaking PHI beyond the current audience tier.
- Identify whether recovery completion re-enters the typed routing and causal-read path before final reassurance resumes.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat stale or expired posture as an exception page problem.
- Prefer same-shell recovery that keeps the last safe summary, selected anchor, and bounded next step visible while live mutation remains frozen.
- If recovery currently depends on route resets or entry-channel-specific behavior, redesign it around typed settlement and continuation contracts.
- Ensure local acknowledgement, authoritative settlement, and recovery posture remain visibly distinct until truth converges.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Same-Shell Recovery for Expired or Stale Patient Actions` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
