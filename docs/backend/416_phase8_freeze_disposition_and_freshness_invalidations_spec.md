# Phase 8 Freeze Disposition And Freshness Invalidations

Task `par_416` adds the backend law that freezes or downgrades assistive behavior in place when trust, policy, publication, session, anchor, decision, insertion, incident, or final-artifact context drifts.

## Owned Services

- `AssistiveReleaseFreezeRecordService` opens, maintains, and releases current `AssistiveReleaseFreezeRecord` truth for a watch tuple, route family, cohort, publication tuple, and trigger.
- `AssistiveFreezeDispositionResolver` resolves exact blueprint fallback modes: `shadow_only`, `read_only_provenance`, `placeholder_only`, and `assistive_hidden`.
- `AssistivePolicyFreshnessValidator` compares session, prompt, approval-gate, threshold, watch tuple, release candidate, and route-family policy refs against the active bundle.
- `AssistivePublicationFreshnessValidator` compares route contract, surface publication, and runtime publication refs against the current surface binding.
- `AssistiveSessionInvalidationService` invalidates sessions, feedback chains, draft patch leases, and work-protection leases when decision, anchor, insertion, trust, policy, publication, incident, or final-artifact truth drifts.
- `AssistiveRecoveryDispositionBinder` binds freeze disposition to one route-specific `ReleaseRecoveryDisposition` and keeps recovery in the same shell family.
- `AssistiveActionabilityFreezeGuard` blocks stale accept, insert, regenerate, export, and completion-adjacent actions while preserving read-only provenance where policy allows.
- `AssistiveSessionReclearanceService` requires explicit session refresh, regeneration, or operator unfreeze before actionability can return.

## Freeze Truth

`AssistiveReleaseFreezeRecord` is current operational truth, not a command log. It binds capability code, release candidate, rollout slice, rollout verdict, route family, audience tier, release cohort, watch tuple, policy bundle, surface route contract, surface publication, runtime publication bundle, release recovery disposition, rollout rung at freeze, trigger, fallback mode, and current freeze state.

## Freshness

Policy freshness fails closed if the session, prompt, approval gate, or threshold set points to a different active policy bundle. Publication freshness fails closed if route contract, surface publication, or runtime publication no longer match the surface binding or have stale, missing, withdrawn, or blocked posture.

## Recovery

Freeze disposition preserves visible text and provenance only when the mode permits it. `read_only_provenance` can retain artifacts and provenance footers, but accept, insert, export, and completion-adjacent controls remain suppressed. `placeholder_only` and `assistive_hidden` suppress richer interaction.

Recovery must bind the route family to a `ReleaseRecoveryDisposition` and same shell family. The system may show one dominant recovery action, but it may not route the reviewer to a generic error screen or silently reactivate old controls.

## Reclearance

Once a stale session, insertion target, or freeze is cleared, old patch leases cannot be reused. Actionability requires fresh policy, publication, and trust refs plus either a refreshed session or regenerated replacement patch leases.

## PHI Boundary

Freeze records store structured refs, state tokens, blocker codes, timestamps, and recovery posture. They do not store draft text, prompt fragments, transcripts, or patient context.
