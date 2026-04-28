# par_152 Triage Task And ETA Design

`par_152` closes the Phase 1 routine handoff gap by creating one canonical `TriageTask` before a request can move to `workflowState = triage_ready`.

## Runtime chain

1. `intake-submit` promotes the immutable submission, evaluates synchronous safety, and advances the canonical `Request` to `intake_normalized`.
2. When the persisted `SafetyDecisionRecord.requestedSafetyState` is `screen_clear` or `residual_risk_flagged`, the command-api seam creates exactly one Phase 1 `TriageTask`.
3. Only after that task exists does the same request advance to `triage_ready`.
4. The same handoff produces one `Phase1TriageEtaForecast` and one `Phase1PatientStatusProjection`.

## Canonical objects

- `Phase1TriageTaskDocument`
- `Phase1TriageEtaForecastDocument`
- `Phase1PatientStatusProjectionDocument`

The task schema is intentionally bounded and explicit under `GAP_RESOLVED_TRIAGE_TASK_PHASE1_SCHEMA_V1`. It carries only the minimal Phase 1-safe queue truth needed for downstream routing and later shells.

## ETA method

The ETA engine follows the blueprint's conservative rules:

- deterministic seeded simulation over one queue snapshot
- shrunken band-specific handling-time priors
- bounded staffed-capacity distribution
- conformal or conservative padding
- bucket admissibility based on both calibrated probability and upper-bound deadline
- monotonicity by queue rank for median and upper bounds
- hysteresis so the promise does not oscillate on one optimistic refresh
- stale or thin telemetry freezes or widens the promise instead of improving it

The public contract never publishes a point timestamp promise. The patient truth is one calibrated bucket plus lower/median/upper internal bounds carried through the authoritative receipt envelope.

## Residual-risk routine handling

`residual_risk_flagged` remains a routine Phase 1 path, but it is not treated as ordinary `screen_clear` work:

- the task uses `residual_review`
- residual contributor rule IDs are persisted onto the task
- receipt and patient status semantics remain routine but disclose residual review posture through the minimal status projection

## Events

Routine handoff emits:

- `triage.task.created`
- `patient.receipt.issued`
- `communication.queued`

These events bind to the same promoted request lineage and the same authoritative receipt/status consistency tuple.
