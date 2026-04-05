# Deterministic Patient Home Spotlighting

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Deterministic Patient Home Spotlighting`.

Map this domain to `PatientHomeProjection`, `PatientPortalNavigationProjection`, `PatientSpotlightDecisionProjection`, `PatientNavUrgencyDigest`, `PatientNavReturnContract`, `PatientExperienceContinuityEvidenceProjection(controlCode = patient_nav)`, and quiet-home posture. Your mission is to fully resolve this failure class. Identify and eliminate every place where patient home spotlight selection can oscillate, overreact to fresh projections, or imply a live next action that the current settlement, trust, or continuity posture no longer supports.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the patient home, portal navigation, and patient-nav continuity sections before making changes.
- Distinguish spotlight ranking, spotlight hysteresis, current capability lease, trust or release posture, and same-shell recovery posture.
- Trace how requests, appointments, records, messages, repair paths, and quiet-home state compete for spotlight selection.
- Inspect how spotlight cards preserve place, return posture, and bounded recovery when the governing entity drifts.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find spotlight selection logic that is non-deterministic, score-only, or overly sensitive to local freshness churn.
- Detect cases where spotlight CTA choice is picked independently from the spotlight entity’s live capability lease.
- Surface where degraded assurance slices, release freeze, channel freeze, or continuity drift can leave a spotlight card looking live.
- Examine whether blocked callback, consent, repair, or message dependencies are promoted correctly into the home shell.
- Identify whether quiet-home state is genuinely governed or is filled with generic dashboard or marketing placeholders when no entity outranks the quiet threshold.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not turn home into a rotating dashboard.
- Prefer a deterministic spotlight decision with explicit lexicographic ranking, bounded hysteresis, and one live action derived from the chosen entity.
- If spotlight truth currently competes with card-local heuristics, redesign it around authoritative digests and continuity-backed downgrade behavior.
- Ensure the spotlight stays pinned and degrades in place when actionability changes rather than vanishing or switching to a fresh optimistic entity.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Deterministic Patient Home Spotlighting` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
