# Call Session Event And Menu Capture Contract

Task 188 publishes three internal route families:

| Route | Contract | Purpose |
| --- | --- | --- |
| `POST /internal/telephony/call-sessions/{callSessionRef}/events` | `CallSessionEventContract` | Append one provider-neutral `CallSessionCanonicalEvent` and apply the state machine idempotently. |
| `POST /internal/telephony/call-sessions/{callSessionRef}/rebuild` | `CallSessionRebuildContract` | Rebuild the aggregate and support-safe projection from canonical event history. |
| `GET /internal/telephony/call-sessions/{callSessionRef}/projection` | `CallSessionProjectionContract` | Read the derived support-safe projection without raw provider payloads or full caller identifiers. |

## CallSessionCanonicalEvent

Required fields:

- `callSessionEventRef`
- `eventType`
- `sourceCanonicalEventRef`
- `sourceCanonicalEventType`
- `callSessionRef`
- `providerCorrelationRef`
- `idempotencyKey`
- `sequence`
- `occurredAt`
- `recordedAt`
- `payload`
- `reasonCodes`
- `policyVersionRef = phase2-call-session-state-machine-188.v1`

The event is provider-neutral. It may cite `providerCorrelationRef`, `providerEventRef`, `providerPayloadRef`, and artifact refs, but it must never include raw provider payload fields, full caller numbers, raw recording URLs, or patient identifiers.

## MenuSelectionCapture

Menu capture is durable evidence. Every `menu_captured` event appends one `MenuSelectionCapture` with:

- `selectedTopLevelPath = symptoms | medications | admin | results | unknown`
- `rawTransportSourceFamily = dtmf | speech | operator | simulator | unknown`
- `normalizedMenuCode`
- `capturedAt`
- `providerEventRef`
- `confidence`
- `parsePosture`
- `branchRepeatCount`
- `correctionOfCaptureRef`
- `maskedCallerContextRef`
- `sessionCorrelationRefs`

Repeated selections do not overwrite history. The projection marks the latest non-duplicate capture as current.

## Projection Contract

`CallSessionSupportProjection` includes `currentCallState`, `currentMenuPath`, `currentUrgentLivePosture`, `currentLastSeenEventRef`, `nextExpectedMilestone`, `activeBlockerOrHoldReason`, linked readiness refs, and a masked caller fragment.

Projection fields are derived views over append-only records. They are not a second source of truth and must not be used to infer routine promotion readiness. Promotion still requires the latest `TelephonyEvidenceReadinessAssessment(usabilityState = safety_usable, promotionReadiness = ready_to_promote)`.

## Idempotency

The append route requires idempotency. If an event with the same `idempotencyKey` has already been applied to a call session, the service returns the settled projection and reason `TEL_SESSION_188_DUPLICATE_EVENT_REPLAY_COLLAPSED` without advancing state or appending another menu capture.
