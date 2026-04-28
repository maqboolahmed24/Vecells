# 299 Algorithm Alignment Notes

## Route-Level Truth Mapping

| Scenario | Exception class | Review lease | Focus lease | Confirmation truth | Settlement posture |
| --- | --- | --- | --- | --- | --- |
| `booking_case_299_linkage_required` | `linkage_required_blocker` | `live` | `released` | `pre_commit_review` | `gated` |
| `booking_case_299_compare_live` | `patient_self_service_blocked` | `live` | `active` | `pre_commit_review` | `gated` |
| `booking_case_299_pending_confirmation` | `ambiguous_commit` | `release_pending` | `active` | `confirmation_pending` | `pending_settlement` |
| `booking_case_299_stale_recovery` | `stale_owner_or_publication_drift` | `stale_owner` | `invalidated` | `reconciliation_required` | `reacquire_required` |
| `booking_case_299_confirmed` | `reminder_delivery_failure` | `live` | `idle` | `confirmed` | `authoritative` |

## Law Preserved

- `BookingExceptionQueuePanel` is not free-text triage. Each case exposes a machine-readable exception class.
- `AssistedBookingCaseSummary` makes linkage, capability, and self-service blocker posture explicit before staff act.
- `StaffAssistableSlotList` uses the same reservation-truth family as patient selection, widened only by staff-assistable supply labels.
- `AssistedSlotCompareStage` keeps one selected anchor and one compare anchor bounded in the same shell.
- `AssistedBookingRecoveryPanel` keeps stale-owner, reminder-route, and linkage posture visible in place.
- `TaskSettlementAndReacquireStrip` does not let the UI imply quiet completion before authoritative settlement.

## Shared Truth Families

- Reservation truth: `truthful_nonexclusive`, `exclusive_held`, `pending_confirmation`, `confirmed`, `revalidation_required`
- Confirmation truth: `pre_commit_review`, `confirmation_pending`, `reconciliation_required`, `confirmed`
- Settlement posture: `gated`, `pending_settlement`, `reacquire_required`, `authoritative`

## Workspace Law

- Focus protection controls whether compare posture may stay live while queue churn buffers.
- Stale-owner drift is same-shell recovery, not silent slot replacement.
- Read-only posture disables mutation controls but keeps booking state visible.
- The route remains under the staff workspace authority tuple and uses the shell’s buffered queue and next-task scaffolding.

