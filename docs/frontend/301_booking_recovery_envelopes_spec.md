# 301 Booking Recovery Envelopes Spec

`par_301_phase4_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_action_recovery_envelopes_for_booking_failures`

## Outcome

Booking failures now reopen through one booking-aware recovery family instead of route-local stale banners:

- workspace recovery at `/bookings/:bookingCaseId`
- selection recovery at `/bookings/:bookingCaseId/select`
- confirmation recovery at `/bookings/:bookingCaseId/confirm`
- manage recovery at `/bookings/:bookingCaseId/manage`
- waitlist and offer-acceptance recovery at `/bookings/:bookingCaseId/waitlist`

The governing recovery surface preserves:

- `lastSafeSummaryRef`
- `selectedAnchorRef`
- the active return contract
- the current `RecoveryContinuationToken`
- one dominant next-safe action

## Visual Mode

`Booking_Recovery_Envelope`

The recovery shell stays premium and transactional:

- preserved summary first
- one explanation panel
- one dominant action
- optional identity-hold and secure-link rails
- same-shell contact repair morph when reachability is the blocker

## Required UI Primitives

- `BookingRecoveryShell`
- `BookingRecoveryReasonPanel`
- `BookingRecoverySummaryCard`
- `BookingRecoveryNextActionCard`
- `BookingIdentityHoldPanel`
- `BookingSecureLinkRecoveryFrame`
- `BookingContactRepairMorph`
- `BookingRecoveryReturnStub`
- `BookingRecoveryReasonCatalog`

## Recovery Authority

- Route-local stale or disputed panels no longer own booking failure explanation.
- `BookingRecoveryReasonCatalog` classifies booking-local recovery language on top of the canonical `PatientActionRecoveryEnvelope`.
- Secure-link and authenticated recovery for the same booking tuple keep the same `recoveryReason`, `summaryTier`, and `nextSafeActionRef`.
- Wrong-patient recovery stays summary-safe and suppresses booked reassurance, manage controls, and artifact language.
- Contact-route repair remains attached to the blocked booking or waitlist context.

## Reason Catalog

The implemented catalog covers:

- `stale_session`
- `expired_action`
- `superseded_action`
- `confirmation_disputed`
- `confirmation_pending`
- `wrong_patient`
- `contact_route_repair_required`

## Summary Tiers

- `booking_safe_summary`
- `appointment_safe_summary`
- `identity_hold_summary`

## DOM Markers

- `data-recovery-reason`
- `data-summary-tier`
- `data-identity-hold-state`
- `data-next-safe-action`
- `data-reentry-route-family`
- `data-channel-mode`
- `data-recovery-tuple-hash`
- `data-selected-anchor-ref`

## Primary Scenarios

1. `booking_case_293_recovery`
   Workspace continuity drift keeps the booking need and return path visible while continuity is restored.
2. `booking_case_295_stale`
   Selection recovery replaces the stale selection banner and restores the ranked results after refresh.
3. `booking_case_295_unavailable`
   Expired or unavailable selected-slot truth keeps the last chosen slot as provenance only.
4. `booking_case_296_reconciliation`
   Disputed confirmation remains non-booked and routes back to selection or support.
5. `booking_case_296_identity_repair`
   Wrong-patient or identity-hold recovery collapses to summary-only context.
6. `booking_case_297_reminder_blocked`
   Manage recovery reopens a booking-aware contact repair morph.
7. `booking_case_297_confirmation_pending`
   Manage recovery stays calm but does not imply final confirmation.
8. `booking_case_298_offer_expired`
   Waitlist expiry keeps the offer pinned as provenance and returns to a lawful continuation.
9. `booking_case_298_offer_superseded`
   Superseded and expired remain distinct recovery reasons.
10. `booking_case_298_contact_repair`
    Waitlist contact repair reopens inside the booking shell with the active offer still visible.
11. `booking_case_298_contact_repair_secure`
    Secure-link contact repair keeps the same reason and next action as the authenticated route.

## Keyboard Order

The recovery shell uses one stable reading order:

1. secure-link frame when present
2. summary card
3. identity-hold card when present
4. reason panel
5. next-action card
6. contact-repair morph when present
7. return stub

Focus stays within logical reading order and the return action resolves from the current booking continuity contract instead of browser-history guesswork.

## Proof

Playwright is the primary proof tool for this task.

The 301 suite covers:

- workspace recovery
- selection stale refresh
- confirmation disputed recovery
- manage reminder-blocked recovery
- waitlist expiry recovery
- authenticated and secure-link parity for waitlist contact repair
- atlas rendering
- accessibility and aria snapshots
