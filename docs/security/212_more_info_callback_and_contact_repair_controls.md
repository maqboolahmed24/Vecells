# 212 more-info, callback, and contact-repair controls

Patient reply, callback, repair, and consent routes are read-model first. The UI must resolve typed projections before it can show a live mutating control.

## Fail-closed rules

- `PatientMoreInfoStatusProjection.answerabilityState` is `answerable` only while the active cycle, route intent, request return bundle, continuity evidence, reachability, and consent checkpoint all agree.
- `PatientMoreInfoResponseThreadProjection` freezes prompts to `blocked` when continuity, cycle tuple, visibility, repair, or consent posture drifts.
- `PatientCallbackStatusProjection.patientVisibleState` and `windowRiskState` may advance only from `CallbackExpectationEnvelope`, `CallbackOutcomeEvidenceBundle`, and `CallbackResolutionGate`.
- `PatientReachabilitySummaryProjection` must derive route authority and delivery risk from current reachability assessment, not stale demographics, stale preferences, or the last successful send.
- `PatientContactRepairProjection` must preserve blocked action context until verification and resulting reachability assessment settle.
- `PatientConsentCheckpointProjection` suppresses quiet success and live mutation until renewal, withdrawal reconciliation, or recovery settles.

## Public-safe separation

Public or secure-link recovery audiences can receive `publicSafeSummaryRef`, blocked prompt refs, and next-step guidance. Authenticated-safe thread detail, callback detail, repair history, and consent history require an authenticated audience and current shell consistency.

## Replay and settlement

Reply, callback-response, repair, and consent actions still route through `PatientActionRoutingProjection`. Local acknowledgement is not finality; calm completion requires the relevant action settlement, callback gate, receipt, or repair rebind to settle against the same request lineage and return bundle.

## Evidence controls

The validator requires the 212 source to contain the six projection names, the four route contracts, the response-thread alias resolution, blocker cases, and Playwright proof. This keeps future frontend tasks from deriving answerability from route-local state, browser timers, or optimistic callback copy.
