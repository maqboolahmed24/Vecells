# Call Session Timeout And Rebuild Rules

## Timeout Policy

`phase2-call-session-timeout-policy-188.v1` freezes the first operational timeout law:

| State | Window | Disposition |
| --- | ---: | --- |
| `menu_selected` | 180 seconds | `abandoned` |
| `identity_in_progress` | 240 seconds | `manual_followup_required` |
| `recording_expected` | 600 seconds | `recording_missing` |

The timeout clock is `last_state_transition_updated_at`. Timeout handling appends a normal `CallSessionCanonicalEvent`; it does not mutate the aggregate out of band. Timeout outcomes include `TEL_SESSION_188_TIMEOUT_POLICY_APPLIED`.

## Rebuild Rules

Rebuild source is `canonical_call_session_events_plus_immutable_assessment_refs`.

Ordering is deterministic:

1. `sequence`
2. `occurredAt`
3. event-type precedence
4. event ref

The same ordered canonical event stream must produce the same `CallSessionAggregate` and `CallSessionSupportProjection`.

## Disorder Cases

- Duplicate call-start events collapse by idempotency key.
- `call_completed` arriving before menu capture is not platform closure.
- `recording_available` after provider completion may append a recording ref.
- Provider error after earlier progress moves to `provider_error` unless the call is already submitted or closed.
- Late operator corrections append `MenuSelectionCapture` records and update the derived current menu.
- Split webhook and polling delivery is replayed by the same ordering rules.

## Closed Versus Completed

Provider completion is a transport status. It does not close platform work. Only `call_closed` can move the aggregate to `closed`; downstream readiness, manual review, continuation, or convergence may still be pending after provider completion.

## Promotion Guard

The state machine blocks `request_seeded` and `submission_promoted` unless authoritative readiness refs are present and the state is eligible. Calls in `recording_expected`, `recording_available`, `evidence_preparing`, `evidence_pending`, `urgent_live_only`, or `continuation_eligible` remain blocked from routine promotion.

## Operational Review

Support tooling should read `CallSessionSupportProjection` for current posture and follow linked refs for deeper review. Operators must not inspect edge raw receipts except through the controlled quarantine/debug path owned by task 187.
