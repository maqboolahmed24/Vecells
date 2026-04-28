# 306 Algorithm Alignment Notes

## Governing seam

Task `306` closes the local seam between:

1. Phase 3 direct-resolution handoff output
2. Phase 4 booking-case ownership and confirmation truth
3. lifecycle milestones and governed reopen
4. patient-safe notification generation and deep-link re-entry

The implementation follows the repository blueprints instead of introducing a parallel workflow:

- `blueprint/phase-3-the-human-checkpoint.md`
- `blueprint/phase-4-the-booking-engine.md`
- `blueprint/patient-account-and-communications-blueprint.md`
- `blueprint/patient-portal-experience-architecture-blueprint.md`

## Local algorithm decisions

### 1. Handoff acceptance stays epoch-bound

- `acceptBookingHandoff` consumes only the current approved booking handoff bundle.
- The downstream booking case acknowledges the proposed `LineageCaseLink` only while the source `DecisionEpoch` remains current.
- Acceptance records the lifecycle milestone instead of letting booking infer ownership implicitly.

### 2. Booking truth outranks triage posture once handoff is active

- Patient-facing status is derived from authoritative booking truth and reopen state, not from stale triage wording.
- `booking_confirmation_pending` stays visibly pending across patient shell and staff shell.
- `booking_confirmed` becomes calm only after authoritative confirmation truth settles.
- `booking_reopened` keeps recovery explicit and returns the request workflow to triage-owned posture.

### 3. Reopen and supersession fail closed

- A superseded decision epoch does not silently continue booking work.
- Refresh reopens to triage through governed reopen wiring and returns the lineage link instead of leaving split ownership.
- The patient deep link remains same-shell and recovery-oriented after reopen.

### 4. Notification dedupe is lineage-safe

- Dedupe is keyed as `booking_triage_notification::{requestId}::{statusDigest}`.
- This preserves one user-visible reassurance per authoritative booking posture.
- Replay classes remain machine-visible as `accepted_new`, `semantic_replay`, and `stale_ignored`.

### 5. Notification entry uses the owning patient shell

- Notification links land inside `/bookings/:bookingCaseId` route family.
- The patient shell exposes `data-origin-key=secure_link` and `data-notification-state=*` markers.
- No shortcut page bypasses the booking shell, continuity bundle, or safe return contract.

## Scenario seed alignment

The committed state matrix and validator derive from the same four scenario anchors:

1. `booking_case_306_handoff_live`
2. `booking_case_306_confirmation_pending`
3. `booking_case_306_confirmed`
4. `booking_case_306_reopened`

These cover the live handoff, pending confirmation, confirmed manage entry, and reopened recovery path across staff and patient shells.
