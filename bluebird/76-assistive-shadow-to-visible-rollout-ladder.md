# Assistive Shadow-to-Visible Rollout Ladder

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Assistive Shadow-to-Visible Rollout Ladder`.

Map this domain to `AssistiveCapabilityManifest`, `AssistiveCapabilityWatchTuple`, `AssistiveCapabilityTrustProjection`, `AssistiveReleaseCandidate`, `AssistiveReleaseFreezeRecord`, `AssistiveFreezeDisposition`, `AudienceSurfaceRouteContract`, `RuntimePublicationBundle`, and any capability posture that can be `shadow_only`, `visible`, `observe_only`, `blocked`, `quarantined`, `frozen`, or degraded in place. Your mission is to fully resolve this failure class. Identify and eliminate every place where assistive capabilities move from shadow to visible without a governed ladder, or remain visibly actionable after trust, publication, policy, or runtime conditions say they should degrade or freeze.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the assistive rollout, trust, freeze, publication, and visible-slice rules before making changes.
- Distinguish shadow comparison, visible suggestion, insert eligibility, approval eligibility, publication eligibility, and freeze or recovery disposition.
- Trace how a capability pins `watchTupleHash`, route contract, publication state, runtime bundle, calibration bundle, threshold set, and cohort slice at every rollout stage.
- Inspect how incidents, threshold breaches, trust degradation, policy drift, and runtime withdrawal alter the visible posture without changing the underlying workspace route family.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find capabilities that still depend on local feature flags or UI toggles instead of the governed watch-tuple and trust-projection chain.
- Detect visible assistive surfaces that stay writable after trust degrades, runtime publication drifts, rollout freezes, or required bundles no longer match the active slice.
- Surface rollout paths that skip shadow evidence, omit slice-specific pinning, or promote visibility without proving the required release cohort and threshold posture.
- Examine whether degradation outcomes are truthful and bounded, such as `shadow_only`, read-only provenance, placeholder-only, or fully hidden assistive chrome, rather than stale visible actions.
- Identify differences between route families, tenants, or cohorts that can cause one capability to look visible or trusted on one surface while the same watch tuple would be blocked elsewhere.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat rollout as ordinary feature-flag enablement.
- Prefer a typed rollout ladder where shadow, visible, insert, and commit posture are each governed by pinned trust, publication, and policy evidence.
- If visible behavior is currently inferred from client state or scattered thresholds, redesign it around one canonical watch tuple and trust projection.
- Ensure degradation happens in place with explicit freeze reasons and governed fallback modes, not by leaving stale actions exposed or silently removing capability chrome.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Assistive Shadow-to-Visible Rollout Ladder` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
