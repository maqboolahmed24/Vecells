# Task 456 Operations Incidents Implementation Note

`/ops/incidents` now renders a same-shell Incident Desk with a command strip, filterable incident and near-miss queue, near-miss intake, severity board, containment timeline, reportability checklist, external DSPT handoff, post-incident review, CAPA/training links, safe-return evidence links, and UI telemetry redaction proof.

Reportability uses the task 447 workflow authority. The normal path shows `reported` and acknowledged handoff, settlement-pending keeps `reportable_pending_submission`, blocked and permission-limited states expose `insufficient_facts_blocked`, and stale projections remain `superseded` until revalidated.

Closure is deliberately blocked until PIR, CAPA, training drill, and reportability all complete. Local UI actions expose settlement refs and disabled reasons instead of implying command success.

The route carries `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` refs and only permits metadata-only telemetry. Incident summaries, patient identifiers, route params, artifact fragments, and investigation keys are listed as redacted fields.

Task 456 reuses task 439 timeline, task 440 pack, task 441 CAPA/attestation, task 446 quarantine, and task 447 incident reportability contracts, so no `PHASE9_BATCH_443_457_INTERFACE_GAP_456_REPORTABILITY_INPUTS.json` artifact is required.

Playwright evidence is written to `.artifacts/operations-incidents-456` for normal, empty, stale, degraded, blocked, permission-denied, settlement-pending, reduced-motion, desktop, laptop, tablet, and narrow mission-stack states.
