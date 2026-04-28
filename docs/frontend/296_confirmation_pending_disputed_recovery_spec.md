# 296 Confirmation pending disputed recovery spec

`BookingConfirmationStage` in `Confirmation_Truth_Studio` is the patient-facing confirm child surface for the signed-in booking shell.

## Route

- `/bookings/:bookingCaseId/confirm`

## Required regions

- `SelectedSlotProvenanceCard`
- `ConfirmStatePanel`
- `ConfirmationProgressStrip`
- `BookedSummaryMiniList`
- `RecoveryActionPanel`
- `ArtifactSummaryStub`

## Behavior

- Keep one selected-slot card pinned through review, booking-in-progress, pending confirmation, recovery, and confirmed summary states.
- Treat `pre_commit_review` as review-only posture. The patient is not booked and all manage or artifact exposure stays hidden.
- Treat `booking_in_progress` as bounded progress. Duplicate taps stay blocked and refresh restores the same booking attempt.
- Treat `confirmation_pending` as provisional receipt only. Known provider references may appear, but booked reassurance stays hidden.
- Treat `reconciliation_required` and route-freeze cases as explanation-first recovery instead of indefinite spinners or detached success pages.
- Show calm booked summary only when `confirmationTruthState=confirmed` and the matching manage and artifact exposure states are live.

## Copy law

- Confirmation copy is factual, low-noise, and consequence-aware.
- Provisional states say what the system is doing now, what the patient should do next, and what is still blocked.
- Confirmed copy stays compact and summary-first rather than turning into a dashboard or celebration page.

## Gating law

- `BookingConfirmationTruthProjection` is the only authority for booked reassurance.
- `ReservationTruthProjection` remains the only authority for slot hold, exclusivity, and countdown wording inside the selected-slot card.
- `RouteFreezeDisposition`, release recovery, and identity repair suppress confirm-adjacent mutation in place while preserving safe context.
- `ArtifactPresentationContract` and `OutboundNavigationGrant` govern export, print, directions, and browser handoff posture.

## Reference posture

- NHS summary-list and button guidance inform the compact transactional layout and action hierarchy.
- Linear informs the calm hierarchy and reduced chrome around the primary state panel.
- Carbon informs bounded loading and status treatment for progress and recovery states.
- WCAG 2.2, WAI-ARIA APG, and Playwright govern polite status messaging, focus retention, and proof structure.
