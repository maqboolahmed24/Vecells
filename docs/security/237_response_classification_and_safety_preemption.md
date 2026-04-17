# 237 Response Classification And Safety Preemption

Task `237` keeps patient reply handling fail closed.

## Classification rules

After an accepted reply enters the immutable evidence path, one `EvidenceClassificationDecision` is always appended.

The dominant class defaults to `potentially_clinical` unless the payload is both:

- on the explicit technical allow-list, or
- a pure control-plane delta

Route or reachability failures on active reply dependencies classify as `contact_safety_relevant`.

If parsing, extraction, or artifact posture is degraded, the reply is not classified optimistically. The classifier drops confidence, records the degraded reason codes, and the downstream path fails closed to manual review or blocked preemption.

## Preemption rules

Accepted material replies always route through canonical re-safety:

- create `SafetyPreemptionRecord`
- derive delta feature refs
- recompute impacted rules plus hard-stop and active-dependency rules
- rerun the canonical safety engine
- append one `SafetyDecisionRecord`

There is no reply-local shortcut.

## Consequence gating

While assimilation, classification, preemption, safety decision, or urgent issuance is pending:

- do not resume routine queue flow
- do not close the request
- do not settle downstream handoff as final
- do not show stale calm reassurance

## Urgent routing

When re-safety settles `requestedSafetyState = urgent_diversion_required`, the case returns immediately to urgent handling and `TriageTask.status = escalated`.

Routine queue return is blocked until urgent issuance is settled.

## Explainability and recovery

Blocked, superseded, expired, and late dispositions keep explicit `reasonCodeRefs` and recovery hooks.

`blocked_repair` is durable and explainable. It preserves receipt context without minting a new snapshot or silently resuming queue work.
