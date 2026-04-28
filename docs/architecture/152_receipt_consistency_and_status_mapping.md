# par_152 Receipt Consistency And Status Mapping

`par_152` publishes one authoritative `PatientReceiptConsistencyEnvelope` for each promoted request lineage. Receipt copy and patient status are not allowed to invent separate promises.

## Consistency law

- one `receiptConsistencyKey` per promoted request lineage
- append-only `monotoneRevision`
- one authoritative ETA bucket at a time
- same envelope reused by receipt and patient status surfaces
- stale telemetry may freeze the prior promise or widen it; it may not silently improve it

## Minimal patient status model

The patient-facing macro state remains intentionally coarse:

- `received`
- `in_review`
- `we_need_you`
- `completed`
- `urgent_action`

Phase 1 routine handoff currently materializes the minimal truthful subset required for the first receipt surface:

- `received`
- `waiting`
- `blocked` when recovery is required

Internal queue metadata such as raw rank, queue depth, and service-band distribution stays inside the triage domain. Patient status only exposes the minimal state, the visible ETA bucket, the promise state, and the next-step/trust cues.

## Public truth boundary

The canonical status projection may include:

- macro state
- summary state
- visible ETA bucket
- promise state
- residual review posture

It may not include:

- queue rank
- queue size
- raw handling-time distributions
- calibrated probability tables
- internal staffing coverage values

## Phase 1 routine result

For routine submissions:

1. `Request.workflowState` advances `submitted -> intake_normalized -> triage_ready`
2. one `TriageTask` is created
3. one `PatientReceiptConsistencyEnvelope` is issued
4. one minimal `Phase1PatientStatusProjection` is published from the same consistency tuple
