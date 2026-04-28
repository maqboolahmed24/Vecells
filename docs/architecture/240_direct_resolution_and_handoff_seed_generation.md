# 240 Direct Resolution And Handoff Seed Generation

## Scope

`240` turns the approved Phase 3 endpoint choice into one authoritative downstream consequence bundle without letting endpoint selection masquerade as final completion.

The command path is:

1. read the live `DecisionEpoch`
2. enforce approval truth for the current `decisionEpochRef`
3. create one typed consequence seed or handoff seed
4. bind `LineageCaseLink` for every live downstream family
5. persist one `DirectResolutionSettlement`
6. persist one `TriageOutcomePresentationArtifact`
7. persist one replay-safe patient status projection update
8. publish only outbox-safe consequence and lifecycle effects
9. move the triage task through `endpoint_selected -> resolved_without_appointment | handoff_pending -> closed`

## Typed consequence families

- `clinician_callback` -> `CallbackCaseSeed`
- `clinician_message` -> `ClinicianMessageSeed`
- `self_care_and_safety_net` -> `SelfCareConsequenceStarter`
- `admin_resolution` -> `AdminResolutionStarter`
- `appointment_required` -> `BookingIntent`
- `pharmacy_first_candidate` -> `PharmacyIntent`

Booking and pharmacy stop at clean handoff seeds. They do not launch detached downstream ownership in `240`.

## Epoch and lineage rules

Every seed, starter, intent, artifact, patient-status update, and outbox record carries the originating `decisionEpochRef`.

If a later `DecisionSupersessionRecord` replaces that epoch:

- the consequence seed or intent degrades to `recovery_only`
- the `TriageOutcomePresentationArtifact` degrades to `recovery_only`
- pending outbox entries are cancelled
- one `recovery_required` patient-status update is emitted

This keeps stale epochs lineage-visible instead of silently launching new work.

## Approval and task promotion

`240` no longer treats approval-required endpoints as blocked forever behind `decisionState = awaiting_approval`.

When approval truth is satisfied for the live epoch:

- the task is explicitly moved to `endpoint_selected`
- direct consequence settlement is recorded
- only then is the task promoted to `resolved_without_appointment` or `handoff_pending`
- only after settlement artifacts and outbox effects exist does the task move to `closed`

That closes the gap where “endpoint selected” could be mistaken for “case resolved”.

## Presentation and patient status

All operator and patient confirmation surfaces flow through one `TriageOutcomePresentationArtifact`.

No raw export URL, print route, or detached confirmation page is primary truth.

Patient-visible updates are written through one typed projection object for:

- direct resolution
- callback created
- clinician message created
- booking handoff pending
- pharmacy handoff pending
- stale consequence recovery

## Downstream boundary

`240` intentionally stops at authoritative seeds for callback, message, self-care, admin, booking, and pharmacy consequences.

Later tasks consume these exact seed objects:

- `par_243` callback state machine
- `par_244` clinician-message thread chain
- `par_249` and `par_250` self-care outcome lifecycle
- `par_251` and `par_254` admin-resolution lifecycle

That preserves one seed truth and prevents competing launch records.
