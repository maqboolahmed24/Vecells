# 247 Patient Conversation Tuple And Visibility

`247` makes `PatientConversationCluster`, `CommunicationEnvelope`, `ConversationSubthreadProjection`, `ConversationThreadProjection`, `PatientCommunicationVisibilityProjection`, and `PatientReceiptEnvelope` the authoritative patient-thread tuple for Phase 3 callback, clinician-message, more-info, reminder, repair, and legacy backfill state.

## Core outcome

- one request-centered cluster groups callback promises, clinician messages, more-info asks, reminders, repair notices, and patient replies
- `247` publishes the tuple that `246` consumes, so digest and composer calmness are derived from one current thread tuple rather than rebuilt from detached mini-flows
- preview depth is explicit and auditable: `public_safe_summary`, `authenticated_summary`, `step_up_required`, and `suppressed_recovery_only`
- local acknowledgement, transport acceptance, delivery evidence, delivery risk, and authoritative outcome stay separate inside `PatientReceiptEnvelope`

## Materialization model

`247` does not rewrite `243`, `244`, `245`, or `236`. It normalizes those bounded outputs into one row grammar:

- callback expectation becomes callback-thread authority
- clinician-message dispatch, delivery evidence, and patient reply become secure-message thread authority
- more-info ask, reminder, reply, and callback fallback stay on the same request-centered thread
- reachability repair becomes an explicit repair-guidance subthread instead of a sidecar truth source
- legacy history backfill lands as placeholder or recovery posture first

`CommunicationEnvelope` is the only visible row authority. Every row carries:

- `communicationKind`
- `transportAckState`
- `deliveryEvidenceState`
- `deliveryRiskState`
- `authoritativeOutcomeState`

## Thread law

`ConversationSubthreadProjection` retains owner, reply target, reply window, expiry, and workflow meaning. Reminder fallback or repair guidance can widen the visible guidance, but it cannot rewrite the meaning of the callback or secure-message branch it belongs to.

`ConversationThreadProjection` binds:

- ordered subthreads
- ordered communication envelopes
- latest receipt
- latest settlement
- latest callback status
- current visibility projection
- current continuity evidence
- selected anchor
- the current `threadTupleHash`

`247` to `246` handoff is explicit. `247` materializes the authoritative patient tuple, maps `authenticated_summary` to the `246` compatibility preview mode `full`, publishes the compatibility snapshot, and then rehydrates the resulting `246` digest ref back onto the thread bundle.

## Drift and continuity

Thread calmness is continuity-bound. If request-lineage inputs disagree, or only legacy backfill rows are available, the thread degrades instead of smoothing over contradictions:

- tuple drift => `continuityValidationState = stale`
- repair hold or suppressed visibility => `continuityValidationState = blocked`
- legacy backfill or active repair => `continuityValidationState = degraded`

The cluster remains present even when preview text is suppressed. The implementation keeps the cluster visible through placeholder and recovery contracts rather than dropping it from the patient surface.
