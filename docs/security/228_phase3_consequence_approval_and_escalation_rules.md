# 228 Phase 3 Consequence, Approval, And Escalation Rules

Task: `seq_228`

Primary rules source: `data/contracts/228_approval_policy_matrix.yaml`

## Deny-by-default consequence

Consequence is writable only while the current `DecisionEpoch` is live and unsuperseded.

If review version, selected anchor tuple, trust slice, publication tuple, ownership epoch, lineage fence, or current boundary tuple drifts, the endpoint rail must downgrade in place through `EndpointDecisionBinding` and `ReleaseRecoveryDisposition`. Stale consequence may remain visible as provenance. It may not remain live.

## Approval binds to one epoch

`ApprovalCheckpoint` is bound to one exact `decisionEpochRef`.

That means:

- a prior approval on an old epoch is not reusable
- approval invalidates on endpoint change
- approval invalidates on material payload change
- approval invalidates on patient reply
- approval invalidates on duplicate resolution change
- approval invalidates on publication or trust drift

This closes the gap where approval could quietly survive material change under generic task context.

## Boundary tuple mismatch freezes consequence

Self-care and admin consequence are security-relevant because they narrow the clinical and operational meaning of a case.

If `boundaryTupleHash` no longer matches across:

- `EndpointDecisionBinding`
- `EndpointDecisionSettlement`
- `SelfCareBoundaryDecision`
- downstream experience projection

the rail must freeze to preview-only or recovery-only posture. Copy, subtype labels, or stale previews may not redefine the boundary class.

## Assistive-seeded consequence remains human-gated

Future assistive drafts may seed the endpoint rail, but they do not reduce the approval burden.

An assistive-seeded `submit_endpoint` must carry the current:

- `assistiveSessionRef`
- `assistiveCapabilityTrustEnvelopeRef`
- `assistiveFeedbackChainRef`
- `assistiveSourceRefs[]`
- `humanApprovalGateAssessmentRef`
- `finalHumanArtifactRef`
- `approvalGatePolicyBundleRef`

If any of those are stale, missing, or incompatible with the current review version or selected anchor, settlement must fail closed to `blocked_approval_gate`.

## Urgent escalation is auditable, not implicit

Urgent escalation requires:

- one `DutyEscalationRecord`
- append-only `UrgentContactAttempt`
- one typed `UrgentEscalationOutcome`

The branch may resolve to:

- direct non-appointment outcome
- downstream handoff
- return to triage
- governed cancellation
- governed expiry

This prevents urgent work from disappearing into note text, banner copy, or untyped callback side effects.

## Downstream launches are epoch-bound

Booking, pharmacy, escalation, and reopen artifacts must carry the current `decisionEpochRef`.

If a worker, stale tab, or lagging downstream service presents an older epoch after supersession, the platform must settle `stale_recoverable`, preserve the stale artifact as provenance only, and require recommit from the replacement epoch.

## Summary-first presentation only

Outcome previews and confirmations are governed artifacts, not detached pages.

Primary consequence UX must resolve through:

- `EndpointOutcomePreviewArtifact` or `TriageOutcomePresentationArtifact`
- `ArtifactPresentationContract`
- `OutboundNavigationGrant` policy when navigation leaves the shell

Detached print pages, raw file URLs, and ad hoc confirmation screens are not valid primary consequence UX.
