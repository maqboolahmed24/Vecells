# 438 Phase 9 Essential Function Metrics

Schema version: 438.phase9.essential-function-metrics.v1
Generated at: 2026-04-27T09:20:00.000Z
Adapter count: 4
Baseline result hash: 0095b0a9de93a48efe9552967920fd75a6e3cb11700d946ef61c67a443f59688
Replay hash: ad79228d679bb370789552ce6c3b2971b57001e570e81d72351dfb7446d7d0f2
Waitlist conversion: 50.0%
Pharmacy bounce-back backlog: 3
Notification receipt rate: 50.0%

## Lifecycle Truth

- Waitlist conversion is counted from WaitlistOffer and BookingConfirmationTruthProjection lifecycle events, not notification state alone.
- Pharmacy metrics preserve dispatch, outcome, bounce-back, urgent return, no-contact, review, and reopen states.
- Notification delivery keeps provider acknowledgement, transport delivery, patient receipt, and conversation settlement distinct.
- All snapshots carry source event refs, source window hash, metric definition refs, trust/completeness state, projection health refs, graph verdict refs, and explicit blockers.
- Metric observations are fed back into the task 437 operational projection engine.
