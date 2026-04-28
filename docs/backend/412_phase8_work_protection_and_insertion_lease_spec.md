# 412 Phase 8 Work Protection And Insertion Leases

## Scope

Task 412 builds the backend lease layer that keeps assistive insert and regenerate posture tied to live workspace truth. It prevents assistive text from landing in a stale review version, stale selected anchor, stale insertion slot, stale publication tuple, or trust-downgraded session.

The package is not an editor helper and not a UI renderer. Browser-local insert legality is forbidden; browser-local insert legality is forbidden as a runtime rule. Later UI work consumes the server records and may only narrow presentation.

## Runtime Package

Package: `@vecells/domain-assistive-work-protection`

Source root: `packages/domains/assistive_work_protection/src`

Factory: `createAssistiveWorkProtectionPlane`

Services:

- `AssistiveSessionService`
- `AssistiveSessionFenceValidator`
- `AssistiveDraftInsertionPointService`
- `AssistiveDraftPatchLeaseIssuer`
- `AssistiveDraftPatchLeaseValidator`
- `AssistiveWorkProtectionLeaseService`
- `AssistiveDeferredDeltaBuffer`
- `AssistiveQuietReturnTargetResolver`

## Persisted Objects

- `AssistiveSession`: server truth for one active assistive session, bound to task ref, context snapshot, review version, decision epoch, policy bundle, lineage fence, entity continuity key, selected anchor, surface binding, publication refs, trust-envelope ref, workspace trust refs, review-action lease, and a hashed session fence token.
- `AssistiveDraftInsertionPoint`: explicit insertion target bound to task, surface, content class, selected anchor, review version, decision epoch, lineage fence, slot hash, slot state, and quiet-return target.
- `AssistiveDraftPatchLease`: short-lived lease for one artifact section and one insertion point. It repeats selected anchor, review version, decision epoch, lineage fence, review-action lease, content class, slot hash, issued time, expiry, and invalidation state.
- `AssistiveWorkProtectionLease`: active protection while the clinician is composing, comparing, confirming, or reading a highlighted delta. It binds the workspace focus protection lease, artifact, selected anchor, protected region, quiet return target, optional insertion point, and buffered delta refs.
- `AssistiveDeferredDelta`: buffered disruptive update or blocking bypass bound to the active work-protection lease.
- `AssistiveQuietReturnTarget`: same-shell return target preserving selected anchor, protected region, prior quiet region, primary reading target, and route.
- `AssistiveWorkProtectionAuditRecord`: PHI-safe service audit with refs, reason codes, and outcomes.

## Session Fence Validation

`AssistiveSessionFenceValidator` revalidates:

- session fence token hash
- review version
- decision epoch
- policy bundle
- lineage fence
- selected anchor
- surface publication
- runtime publication bundle and state
- review-action lease
- workspace trust envelope
- current assistive trust envelope
- trust-envelope actionability
- live TTL and grace TTL

Drift produces exact reasons such as `review_version_drift_regenerate_required`, `selected_anchor_drift_regenerate_required`, `publication_drift_regenerate_required`, and `trust_envelope_actionability_required`. Insert posture becomes `regenerate_required` or `blocked`.

## Insertion And Patch Lease Rules

Insertion points are not inferred from DOM focus or optimistic browser state. Each point has a typed `contentClass` and `slotHash`. The bounded classes are `note_section`, `message_body`, `endpoint_reasoning`, and `question_set`; a patch lease for one class cannot be cross-used for another class.

`AssistiveDraftPatchLeaseIssuer` issues only from a live session and live insertion point. `AssistiveDraftPatchLeaseValidator` invalidates immediately on review-version, decision-epoch, lineage, selected-anchor, review-action-lease, slot-hash, or expiry drift.

## Work Protection And Buffering

`AssistiveWorkProtectionLeaseService` mirrors workspace focus-protection law for assistive insert and review surfaces. While the lease is active, `AssistiveDeferredDeltaBuffer` buffers disruptive updates with `work_protection_buffers_disruptive_delta`. High or critical blocker severity can bypass as blocking truth, but it still cannot clear the protected region or quiet-return target.

`AssistiveQuietReturnTargetResolver` preserves the same selected anchor, protected region, prior quiet region, primary reading target, and route so recovery returns to the same shell.

## Consumer Contract

Later UI tasks must query:

- current assistive session state
- live insertion points
- draft patch lease state
- active work-protection lease state
- buffered deltas
- quiet-return target
- blocking reason refs and governed recovery posture

The browser may not recompute insert legality, widen actionability, or retarget stale slots.

## Verification

Primary verification commands:

```bash
pnpm --filter @vecells/domain-assistive-work-protection typecheck
pnpm exec vitest run tests/unit/412_session_fence_and_slot_validation.spec.ts tests/integration/412_patch_lease_and_work_protection_buffering.spec.ts tests/integration/412_stale_anchor_publication_and_review_version_invalidation.spec.ts
pnpm validate:412-phase8-work-protection-insertion-leases
```
