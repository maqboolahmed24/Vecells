# 329 algorithm alignment notes

## Local source order

1. `blueprint/phase-5-the-network-horizon.md`
2. `blueprint/patient-account-and-communications-blueprint.md`
3. `blueprint/patient-portal-experience-architecture-blueprint.md`
4. `blueprint/staff-workspace-interface-architecture.md`
5. `docs/architecture/313_phase5_offer_commit_confirmation_and_practice_visibility_contract.md`
6. `docs/architecture/321_hub_commit_attempts_confirmation_gates_and_appointment_truth.md`
7. `docs/architecture/322_practice_continuity_message_and_acknowledgement_chain.md`
8. `docs/architecture/324_network_reminders_manage_and_practice_visibility_backend.md`
9. `docs/architecture/325_hub_reconciler_supplier_mirror_and_exception_worker.md`

## Projection mapping

- `candidate_revalidation`
  - local authority: candidate snapshot remains live but `HubOfferToConfirmationTruthProjection` has not widened beyond pre-confirmation posture
  - shell consequence: no calm booked wording, no live manage posture
- `native_booking_pending`
  - local authority: `HubCommitAttempt.commitPath = manual_pending_confirmation` is active
  - shell consequence: structured proof review is visible; booked calmness remains illegal
- `confirmation_pending`
  - local authority: structured proof exists, supplier confirmation still missing
  - shell consequence: patient route stays provisional; practice visibility stays unwidened
- `booked_pending_practice_ack`
  - local authority: `confirmationTruthState = confirmed_pending_practice_ack`
  - shell consequence: patient may see `Appointment confirmed`; practice informed is secondary; acknowledgement debt stays dominant
- `booked`
  - local authority: authoritative confirmation plus current-generation acknowledgement
  - shell consequence: patient calmness and live manage posture are lawful
- `disputed`
  - local authority: imported confirmation exists but contradicts the live tuple and may not mint calm booked truth
  - shell consequence: imported review panel blocks booked calmness and keeps review posture visible
- `supplier_drift`
  - local authority: later mirror observation blocks stale tuple reuse and reopens acknowledgement debt
  - shell consequence: stale manage posture freezes in place and the shell stays in recovery tone

## Shared truth object

Staff, patient, and practice surfaces all read from `packages/domain-kernel/src/phase5-cross-org-confirmation-preview.ts`.

That shared object carries:

- appointment summary rows
- timeline rows
- settlement receipt rows
- patient wording
- practice minimum-necessary wording
- continuity evidence and notification preview

This closes the copy-drift risk between patient confirmation, practice visibility, and hub explanation.
