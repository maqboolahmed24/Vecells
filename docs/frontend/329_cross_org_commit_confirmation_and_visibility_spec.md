# 329 Cross-org commit confirmation and visibility spec

Visual mode: `Cross_Org_Confirmation_Ledger`

## Outcome

This surface family keeps one honest distinction between:

- commit evidence still under review
- authoritative appointment confirmation
- practice informed
- practice acknowledged
- disputed imported evidence
- supplier drift that freezes stale manage posture

The hub desk keeps all of these inside the existing shell family. The patient route reuses the patient booking shell family and only widens calm reassurance when authoritative confirmation exists. The practice panel renders the minimum-necessary projection and carries the exact patient-facing wording as a secondary disclosure rather than inferring it from macro status.

## Staff surface

Primary staff mount:

- `/hub/case/:hubCoordinationCaseId`
- `/hub/audit/:hubCoordinationCaseId`

Required components:

- `HubCommitConfirmationPane`
- `HubCommitSettlementReceipt`
- `HubCommitAttemptTimeline`
- `ManualNativeBookingProofModal`
- `ImportedConfirmationReviewPanel`
- `PracticeVisibilityPanel`
- `PracticeAcknowledgementIndicator`
- `ContinuityDeliveryEvidenceDrawer`
- `HubSupplierDriftBanner`

Rules:

- candidate revalidation is visibly weaker than booked truth
- manual native proof uses structured reviewed fields, never loose narrative text
- imported confirmation dispute blocks calm booked copy
- practice informed and practice acknowledged remain visibly separate
- supplier drift freezes stale manage posture and reopens acknowledgement debt

## Patient surface

Primary patient mount:

- `/bookings/network/confirmation/:scenarioId`

Required regions:

- primary reassurance panel
- appointment summary block
- what happens next block
- secondary disclosure strip for `Appointment confirmed`, `Practice informed`, and `Practice acknowledged`
- bounded manage/contact follow-on stub

Rules:

- only `Appointment confirmed` is primary reassurance
- `Practice informed` and `Practice acknowledged` stay secondary operational cues
- pending and drift states keep the appointment summary visible but suppress calm completion language
- the route stays responsive and NHS App embed-safe

## Practice visibility

`PracticeVisibilityPanel` is the governed origin-practice projection.

It may show:

- patient identifier reduced to the minimum-necessary operational form
- slot, site, and generation-bound acknowledgement debt
- the exact patient-facing wording as a secondary disclosure

It may not show:

- hub rank proof identifiers
- queue rationale
- internal commit attempt debug detail
- stale acknowledgement as if it cleared newer debt

## State law

| Hub posture                   | Patient cue           | Practice cue                                | Manage posture |
| ----------------------------- | --------------------- | ------------------------------------------- | -------------- |
| `candidate_revalidation`      | provisional only      | not widened                                 | quiet pending  |
| `native_booking_pending`      | provisional only      | not widened                                 | quiet pending  |
| `confirmation_pending`        | provisional only      | not widened                                 | quiet pending  |
| `booked_pending_practice_ack` | appointment confirmed | practice informed / acknowledgement pending | quiet pending  |
| `booked`                      | appointment confirmed | practice informed / acknowledged            | live           |
| `disputed`                    | review posture        | no new booked notice                        | frozen         |
| `supplier_drift`              | review posture        | acknowledgement reopened                    | frozen         |

## DOM markers

- `data-hub-commit-posture`
- `data-commit-timeline`
- `data-practice-visibility`
- `data-acknowledgement-state`
- `data-patient-confirmation`
- `data-supplier-drift`

## Proof expectations

- Playwright drives the primary proof
- keyboard flow covers modal and disclosure behavior
- ARIA snapshots cover the hub pane, modal, and patient route
- mobile proof checks reflow without horizontal clipping
