# 115 Patient Mock Projection Strategy

## Purpose
The patient shell seed uses typed mock projections as a Phase 0 production surrogate. The goal is not fake completeness; it is truthful shell behavior before live BFFs, booking flows, messaging delivery, and record follow-up backends are attached.

## Projection families
- `patientRequests`
  Four seeded request states cover `reply_needed`, `awaiting_review`, `in_progress`, and `blocked_repair`.
- `patientAppointments`
  Four seeded appointment states cover `confirmation_pending`, `manage_eligible`, `waitlist_interest`, and `fallback_recovery`.
- `patientRecords`
  Three seeded record summaries cover a structured result, a letter, and a medication update.
- `patientThreads`
  Four seeded message states cover `reply_needed`, `awaiting_review`, `closed`, and `blocked_contact`.

## Runtime and contract strategy
- Authenticated patient routes use a manifest/runtime tuple that resolves to `live`.
- Appointments intentionally bind to a read-only tuple so the seed does not overstate manage authority.
- Recovery and embedded routes intentionally bind to `recovery_only` so same-shell downgrade behavior is visible before host and secure-link integrations exist.
- `resolvePatientShellView()` is the single composition point for manifest validation, runtime binding, route guard posture, action guard posture, status truth input, CasePulse, trust cues, and route-specific specimens.

## Continuity strategy
- `PatientShellViewMemory` preserves current home mode and the selected request, appointment, record, and thread identities.
- The shared selected-anchor manager persists same-shell continuity to local storage and restores the current anchor after refresh.
- Child routes stay inside their owning route family:
  request detail remains under `rf_patient_requests`;
  record follow-up remains under `rf_patient_health_record`;
  message thread remains under `rf_patient_messages`.

## Telemetry and disclosure
- Route-change telemetry uses `mintEdgeCorrelation()` plus `createStructuredTelemetryLogger()`.
- Only control-plane safe route identifiers, masked path descriptors, and PHI references are emitted.
- The patient shell never logs raw patient content or raw identifiers into browser-visible envelopes.

## Seed limits that remain intentional
- No live fetch, streaming, or cache invalidation is implemented yet.
- No full booking, reply composer, or record question flow is implied.
- Recovery and embedded routes prove posture grammar, not later-phase operational completion.

## Follow-on integration seam
Later tasks should replace only the mock projection sources and runtime loaders. They must preserve:
- the five-section nav manifest,
- the selected-anchor policy,
- the same-shell child route topology,
- the calm degraded-mode grammar,
- the status strip and CasePulse cadence,
- the premium visual shell already present in `apps/patient-web`.

