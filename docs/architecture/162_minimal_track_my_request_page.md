# par_162 Minimal Track-My-Request Page

`par_162` turns the Phase 1 status route into one real patient tracking surface instead of a placeholder outcome step.

## Core law

- The page stays inside the `Quiet_Clarity_Mission_Frame`.
- Status uses the same `PHASE1_PATIENT_RECEIPT_CONSISTENCY_ENVELOPE_V1` lineage truth as the receipt route from `par_161`.
- The patient only sees the approved Phase 1 macro states:
  - `received`
  - `in_review`
  - `we_need_you`
  - `completed`
  - `urgent_action`
- The page never exposes raw queue position, staffing telemetry, Monte Carlo output, or exact timestamps.

## Surface structure

- `RequestPulseHeader`
- `EtaPromiseNote`
- `CurrentStatePanel`
- `NextStepsTimeline`
- `ActionNeededCard`
- `ReturnAnchorLink`

The route is intentionally summary-first: one current state, one next-step message, one compact timeline, one lawful ETA bucket when available, and one dominant action cue at most.

## Continuity and return law

- Receipt and status share one consistency envelope and one request-lineage reference.
- Receipt-to-status navigation stays inside the same shell and keeps the selected anchor at `request-return`.
- When no action is needed, the only secondary path is the governed return link back to the receipt route.
- When the authoritative state narrows to urgent or recovery posture, the status route stays inside the same shell and hands off to the urgent guidance route instead of falling into a generic failure page.

## Recovery and read-only posture

- `summary_read_only` is the normal status posture.
- `recovery_only` is the narrowed posture when promise-state truth becomes `recovery_required` or the macro state moves to `urgent_action`.
- Recovery posture may withhold the ETA bucket, but it still preserves request reference, macro state, and same-lineage navigation.

## Gap closures

- `GAP_RESOLVED_TRACK_REQUEST_COPY_STATE_PACK_V1`
- `GAP_RESOLVED_TRACK_REQUEST_COPY_RECOVERY_PACK_V1`
- `GAP_RESOLVED_TRACK_REQUEST_SUMMARY_MINIMALISM_V1`
- `GAP_RESOLVED_TRACK_REQUEST_SINGLE_CUE_V1`
- `GAP_RESOLVED_TRACK_REQUEST_RECEIPT_CONTINUITY_V1`
- `GAP_RESOLVED_TRACK_REQUEST_SAME_SHELL_RECOVERY_V1`

## Guardrails

- The page is not a dashboard.
- The page does not show multiple competing status cards.
- The page does not imply that queued or accepted work has been completed.
- The ETA bucket is a patient-safe bucket and not an exact time.
