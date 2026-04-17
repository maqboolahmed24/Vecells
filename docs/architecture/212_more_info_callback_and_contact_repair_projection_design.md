# 212 more-info, callback, and contact-repair projection design

Task `par_212_crosscutting_track_backend_build_more_info_response_thread_callback_status_and_contact_repair_projections` closes the request-context child-truth gap left open for the cross-cutting request shell.

## Query surfaces

- `patient_portal_request_more_info`: `GET /v1/me/requests/{requestRef}/more-info` returns `PatientMoreInfoStatusProjection`, reachability, contact repair, consent checkpoint, and the current `PatientRequestReturnBundle`.
- `patient_portal_request_more_info_thread`: `GET /v1/me/requests/{requestRef}/more-info/thread` returns `PatientMoreInfoResponseThreadProjection` as a derivative of the active `MoreInfoCycle`.
- `patient_portal_message_callback_status`: `GET /v1/me/messages/{clusterId}/callback/{callbackCaseId}` returns `PatientCallbackStatusProjection` for the request shell or message shell.
- `patient_portal_contact_repair_current`: `GET /v1/me/contact-repair/{repairCaseId}` returns `PatientContactRepairProjection` with the blocked action summary preserved.

All four routes preserve the same governing request lineage, request return bundle, selected anchor, and continuity evidence. Browser history and secure-link state are not used as truth.

## Projection family

- `PatientMoreInfoStatusProjection` is the authority for reply-needed, reply-submitted, awaiting-review, accepted-late-review, expired, superseded, repair-required, and read-only posture.
- `PatientMoreInfoResponseThreadProjection` is the canonical renderable response-thread projection. It is an alias-compatible derivative of the active `MoreInfoCycle`, ordered prompt stack, receipt posture, return bundle, and continuity evidence.
- `PatientCallbackStatusProjection` derives patient-visible callback state only from `CallbackExpectationEnvelope`, `CallbackOutcomeEvidenceBundle`, and `CallbackResolutionGate`.
- `PatientReachabilitySummaryProjection` lifts contact-route truth into the active patient journey from the current reachability assessment and contact-route snapshot.
- `PatientContactRepairProjection` preserves the blocked callback, reminder, or reply action while repair, verification, or rebound is active.
- `PatientConsentCheckpointProjection` gives consent and verification blockers their own typed surface instead of collapsing them into generic recovery.

## Blocker dominance

Dominance order is deterministic:

1. identity hold or recovery posture from `PatientAudienceCoverageProjection`
2. safety interruption from the request action stack
3. consent or verification checkpoint
4. reachability/contact repair
5. cycle expiry or supersession
6. reply submitted or awaiting review
7. callback expectation or more-info reply action

If `PatientReachabilitySummaryProjection.summaryState` is `blocked`, `recovering`, or `rebound_pending`, or `PatientContactRepairProjection.repairState` is not `applied`, the dominant action becomes `contact_route_repair`. If `PatientConsentCheckpointProjection.surfaceState` is `expired`, `required`, or `renewal_pending`, the dominant action becomes `renew_consent`.

## Timer and expiry discipline

secure-link expiry is only grant posture. More-info cycle expiry comes from the active cycle and `replyWindowCheckpointRef`. A link can be stale while `PatientMoreInfoStatusProjection.cycleState = reply_needed`, and the projection remains answerable if route intent, continuity, reachability, and consent still permit it.

## Shell interoperability

The same callback case may render inside the request shell or the message shell. `PatientCallbackStatusProjection` carries both `requestShellRouteRef` and `messageShellRouteRef`; route-specific wrappers can choose the frame, but cannot reinterpret callback truth.

## Design sources

The atlas borrows interaction discipline from current official/public documentation: GOV.UK check-answers and confirmation guidance for explicit review and next-step states, NHS service manual accessibility guidance for patient-safe content posture, Playwright docs for ARIA/screenshot proof, and OWASP session/OAuth guidance for fail-closed session and route-intent handling.
