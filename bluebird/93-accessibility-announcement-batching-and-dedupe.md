# Accessibility Announcement Batching and Dedupe

Use this prompt to direct an autonomous AI agent:

## Prompt
You are a principal systems architect and autonomous remediation agent responsible for fully resolving `Accessibility Announcement Batching and Dedupe`.

Map this domain to `AssistiveAnnouncementContract`, `AccessibleSurfaceContract`, `FreshnessAccessibilityContract`, `FocusTransitionContract`, `FormErrorSummaryContract`, `TimeoutRecoveryContract`, `announcementPriority`, `StatusAcknowledgementScope`, and `UIEventEmissionCheckpoint`. Your mission is to fully resolve this failure class. Identify and eliminate every place where screen-reader announcements still spam, repeat, escalate with the wrong urgency, or drift out of causal order instead of delivering one calm, meaningful announcement stream per active surface.

Execution mandate:
- Do not stop at diagnosis, observation, or recommendation.
- Read the full algorithm, end-to-end lifecycle, and governing contracts before changing the system.
- Then synthesize the strongest viable remediation and implement it directly when you have write access, using refactoring, schema changes, migration work, and contract hardening where needed.
- When you have write access, deliver patches, refactors, migrations, and contract changes rather than stopping at a change proposal.
- Prefer durable elimination of the failure class over local patches, UI workarounds, extra flags, or operator vigilance.
- Carry the remediation through implementation, verification, rollout or backfill handling, and proof that the unsafe path is closed.

Work method:
- Read the accessibility, freshness, focus, buffered-update, and UI-event emission rules before making changes.
- Distinguish heading and state summary announcement, routine polite status, assertive blocker or recovery messaging, local acknowledgement, and authoritative settlement or invalidation messaging.
- Trace how shell changes, region changes, save state, queue or live updates, timeout warnings, form errors, and recovery transitions publish announcements.
- Inspect how batching windows, dedupe windows, focus impact, and causal sequencing behave across restore, replay, buffering, and reconnect paths.
- Move from diagnosis into implementation as soon as the governing model is clear; do not leave the task as analysis-only commentary.

Required remediation work:
- Convert the discovered failure modes into a concrete target design and implement that design across the affected layers.
- Remove or refactor the unsafe paths so the system no longer depends on operator vigilance, local convention, or lucky sequencing.
- For each unsafe condition, carry the fix through the owning algorithm, contracts, storage, integrations, and user-facing state until the failure is removed or explicitly governed.
- Find surfaces that announce local acknowledgement, transport acceptance, and authoritative settlement with equal weight or duplicate wording.
- Detect repeated announcements caused by routine refreshes, autosave, low-risk list churn, or batch-flush behavior that should have been coalesced or suppressed.
- Surface places where focus transitions and announcements disagree about the current dominant action, recovery path, or selected anchor.
- Examine whether stale, degraded, blocked, and read-only states are announced as actionability changes rather than cosmetic freshness cues.
- Identify replayed, deduplicated, or buffered events that can still sound like fresh user-driven activity because announcement ordering is not tied to the emission checkpoint or continuity frame.

Implementation posture:
- Choose the remediation that definitively closes the failure class, even if that requires non-trivial refactoring.
- Implement the end-state architecture and algorithm, not just the analysis of it.
- Prefer deleting, consolidating, or hardening weak paths over documenting them or layering more conditional logic on top.
- Do not treat this as an ARIA label cleanup pass.
- Prefer one bounded announcement system where urgency, batching, dedupe, and focus impact all resolve from typed surface contracts and causal state.
- If surfaces currently fire announcements from local components without shell-level arbitration, redesign them around one announcement contract per meaningful state transition.
- Ensure assistive users hear the same operational meaning as full-visual users without toast spam or duplicate chrome narration.

Produce:
1. A concise description of the current failure mode, its blast radius, and the target end-state.
2. The exact algorithmic, architectural, schema, contract, runtime, and interface changes required to eliminate the issue.
3. The concrete code, migration, configuration, and data-shape changes you will apply, or an exact executable patch plan if the environment is truly read-only.
4. The invariants, state-transition rules, guardrails, and recovery semantics enforced by the new design.
5. The verification suite needed to prove the remediation, including unit, integration, contract, replay, recovery, concurrency, and end-to-end coverage as applicable.
6. The rollout, backfill, reindex, compatibility, and operational validation plan required to land the fix safely.
7. Residual risks only if they remain after implementation, plus the exact evidence required to close them.

Optimize for definitive elimination of `Accessibility Announcement Batching and Dedupe` through coherent algorithmic and architectural remediation, with durable invariants, safe rollout, and proof-backed correctness. The task is not complete at diagnosis; finish only when the strongest viable remediation is implemented and proven, or reduced to an exact executable change set for a truly read-only environment.
