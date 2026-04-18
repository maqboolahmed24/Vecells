# 274 Phase 3 Communication Case Matrix

This suite carries `17` explicit case rows.

## Callback Intent And Scheduling

Callback intent and scheduling stays lease-governed even when the closed case continues to expose the last authoritative lease snapshot.

| Case ID | Scenario | Expected posture |
| --- | --- | --- |
| `CIR274_001` | Schedule callback under live lease | `scheduled` |
| `CIR274_002` | Reschedule rotates active lease | `scheduled` with new `CallbackIntentLease` |
| `CIR274_003` | Cancel closes via gate | `closed` with `cancel` decision |
| `CIR274_004` | Gate-led expiry | `closed` with `expire` decision |
| `CIR274_005` | Duplicate dial suppression | same `CallbackAttemptRecord` |
| `CIR274_006` | Voicemail allowed only with policy + evidence | `retry` with durable evidence |

## Clinician-Message Delivery And Dispute

Clinician-message delivery and dispute remains bound to dispatch, evidence, and governed repair.

| Case ID | Scenario | Expected posture |
| --- | --- | --- |
| `CIR274_007` | Transport accepted but evidence pending | provisional only |
| `CIR274_008` | Delivered with evidence bundle | `delivered` |
| `CIR274_009` | Contradictory late failure | dispute required |
| `CIR274_010` | Resend, channel change, and attachment recovery | blocked until current repair chain clears |

## Reachability Repair

Reachability repair never returns to calm before a fresh epoch is confirmed.

| Case ID | Scenario | Expected posture |
| --- | --- | --- |
| `CIR274_011` | Bounce creates repair-required posture | `blocked` / `repair_required` |
| `CIR274_012` | Rebound on fresh epoch | `clear` on newer epoch |
| `CIR274_013` | Controlled resend and callback reschedule after repair | authorized only after rebound |
| `CIR274_014` | Identity or consent freshness drift | repair remains blocked |

## Patient, Staff, And Support Parity

Patient, staff, and support parity is enforced on the same lineage and repair posture.

| Case ID | Scenario | Expected posture |
| --- | --- | --- |
| `CIR274_015` | Callback parity across patient and staff | same bundle, lineage, delivery, repair posture |
| `CIR274_016` | Message parity across patient, staff, and support | same lineage and governed repair posture |
| `CIR274_017` | Support provisional action | no premature calmness |

## Notes

- callback and message browser states are verified under pending, delivered, disputed, repair-required, and stale-recoverable postures
- route-history and reload are asserted while repair or replay remains active
- no defect id is attached to any row because the final rerun found no repository-owned communication defect
