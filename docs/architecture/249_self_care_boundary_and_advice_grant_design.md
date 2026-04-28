# 249 Self-Care Boundary And Advice Grant Design

## Summary

`SelfCareBoundaryDecision` is the sole classifier for whether the current Phase 3 tuple is informational self-care, bounded admin-resolution, or clinician-governed review.

`AdviceEligibilityGrant` is a narrow tuple-bound authority. It carries the current evidence snapshot, decision epoch, lineage fence, route family, audience tier, subject binding version, session epoch, assurance slices, and publication tuple.

This task keeps boundary decision and grant separate from render settlement. A live grant proves only that later advice render may be attempted on the current tuple. It does not prove that advice was rendered, approved, or shown.

## Boundary Law

Every live boundary decision binds to:

- the current evidence snapshot
- the current unsuperseded `DecisionEpoch`
- the current route-intent binding
- the current selected anchor
- the current lineage fence epoch
- the compiled policy bundle

The executable tuple uses six fields:

- `decisionState`
- `clinicalMeaningState`
- `operationalFollowUpScope`
- `adminMutationAuthorityState`
- `reopenState`
- `boundaryState`

The kernel enforces the legal tuples directly:

- `decisionState = self_care` is legal only on the informational self-serve tuple
- `decisionState = admin_resolution` is legal only on the bounded-admin tuple
- clinician-review states freeze admin mutation authority and follow-up scope

## Grant Law

Advice grant issuance is bounded by the live boundary decision plus:

- audience tier
- channel
- locale
- advice bundle version
- subject binding version
- session epoch
- trust slices
- route contract
- surface publication
- runtime publication bundle

The grant can be `live`, `blocked`, `superseded`, `expired`, or `invalidated`.

## Drift And Supersession

The application fails closed when the tuple drifts. Decision epoch drift, evidence drift, route drift, subject or session drift, publication drift, trust drift, and reopen or safety drift all stop the old tuple from authorizing new consequence.

Boundary supersession is append-safe. Grant transitions are append-safe. Replacement grant issuance supersedes the prior live or blocked grant rather than mutating it in place.

## Downstream Consumer Surfaces

`250` advice render consumes the current boundary decision, current advice grant, effective grant posture, and the reason-code set that explains whether render is live, blocked, invalidated, or expired.

`251` admin-resolution opening consumes the current boundary decision, its admin subtype, and the direct-resolution admin starter without depending on advice grant presence.

Those consumers do not need to infer self-care or admin posture from endpoint wording.

## Accepted Gaps

Two later tasks still own downstream work:

1. `250` still owns patient-visible advice render, content approval binding, and final presentation settlement.
2. `252` still owns dependency-set evaluation and reopen-trigger calculation beyond the current boundary tuple.
