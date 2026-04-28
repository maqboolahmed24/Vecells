# 69 Reachability Assessment Rules

## Fail-closed rules

- `assessmentState = clear` is valid only when route authority is `current`, deliverability is `confirmed_reachable`, delivery risk is `on_track`, and `falseNegativeGuardState = pass`.
- `transport_ack` alone never clears a route. The resulting posture stays `at_risk` with `dominantReasonCode = TRANSPORT_ACK_WITHOUT_PROOF`.
- stale verification, stale demographics, stale preferences, disputed route input, or superseded snapshots fail closed to blocked or disputed posture.
- a blocked dependency must surface same-shell repair or explicit recovery routing. Detached settings success is invalid.
- successful repair may reopen actionability only after a fresh verified snapshot, a settled verification checkpoint, and a resulting clear assessment all point to the same rebound epoch.

## Reason-code ordering

1. `SNAPSHOT_SUPERSEDED`
2. `MANUAL_DISPUTE_OPEN`
3. `PREFERENCE_OPT_OUT_ACTIVE`
4. `INVALID_ROUTE_CONFIRMED`
5. `VERIFICATION_FAILURE_RECORDED`
6. `TRANSPORT_ACK_WITHOUT_PROOF`
7. `VERIFICATION_SUCCESS_REBOUND_READY`
8. `REACHABLE_SIGNAL_CONFIRMED`

## Simulator contract

- SMS accepted maps to weak `transport_ack`
- SMS delivered maps to moderate positive `delivery_receipt`
- SMS bounced maps to strong negative `bounce`
- SMS expired maps to negative `delivery_receipt`
- SMS opt-out maps to strong negative `opt_out`
- Voice no-answer maps to moderate negative `no_answer`
- Voice invalid-route maps to strong negative `invalid_route`
- Voice manual confirmation maps to strong `manual_confirmed_reachable | manual_confirmed_unreachable`
- Email disputed maps to strong ambiguous `manual_dispute`
- OTP success or failure maps to strong `verification_success | verification_failure`
