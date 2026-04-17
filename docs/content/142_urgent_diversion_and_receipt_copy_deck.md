# 142 Urgent Diversion And Receipt Copy Deck

This deck freezes the patient-facing outcome grammar for the Phase 1 submit moment.

## Deck Comparison

| Deck | Family | State | Headline | Primary action | Summary |
| --- | --- | --- | --- | --- | --- |
| normal_safe_submission | safe_receipt | screen_clear | Your request has been sent | View request status | We have placed your request in the routine review path. |
| normal_safe_submission | safe_receipt | residual_risk_flagged | Your request has been sent for review | View request status | A clinician will review the detail you sent before the routine next step is chosen. |
| urgent_diversion | urgent_diversion | urgent_diversion_required | Get urgent help now | Call 999 now | This request cannot stay in the routine queue. |
| urgent_diversion | urgent_diversion | urgent_diverted | Urgent guidance has been issued | Open urgent guidance | We have switched this request to the urgent pathway and recorded that change. |
| safety_processing_failure | failed_safe | processing_failed | We could not safely complete this online | Call the practice now | Your details are still available, but this request was not placed in the routine queue. |

## Urgent Tone Guardrails

- urgent diversion is a pathway change, not a validation or transport failure
- one dominant next action only
- no passive reassurance such as “we will review this later”
- no field-error language such as “fix the highlighted fields”

Urgent required headline:

> Get urgent help now

Urgent required summary:

> This request cannot stay in the routine queue.

## Failed-safe Tone Guardrails

- failed-safe preserves continuity and saved detail, but it does not imply successful submission
- failed-safe may direct the patient to call the practice or use urgent help; it may not borrow calm receipt wording

Failed-safe headline:

> We could not safely complete this online

Failed-safe summary:

> Your details are still available, but this request was not placed in the routine queue.

## Shared Contract Notes

- Every family binds one `IntakeOutcomePresentationArtifact` and one `ArtifactPresentationContract`.
- External or cross-app urgent handoff must bind one `OutboundNavigationGrant`; raw URLs remain forbidden.
- `urgent_diverted` is legal only after `UrgentDiversionSettlement(settlementState = issued)`.
