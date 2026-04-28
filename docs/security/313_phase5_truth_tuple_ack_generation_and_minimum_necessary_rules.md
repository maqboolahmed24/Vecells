# 313 Phase 5 truth tuple, ack generation, and minimum-necessary rules

Task: `seq_313_phase5_freeze_cross_org_booking_commit_and_practice_visibility_contracts`

## Mandatory laws

1. No booked truth before authoritative confirmation.
2. `truthTupleHash` correlation is mandatory across offer, commit, evidence, appointment, continuity, acknowledgement, visibility, and manage lease objects.
3. Patient confirmation, practice informed, and practice acknowledged remain separate facets.
4. Transport acceptance is not practice acknowledgement.
5. `NetworkManageCapabilities` is leased, not static.
6. `PracticeVisibilityProjection` is minimum-necessary, envelope-bound, and scope-bound.
7. `PracticeVisibilityDeltaRecord` may not lower `ackGeneration` or supersede newer visibility envelopes.
8. Stale tuples and stale generations remain auditable only.

## Debt-clearance matrix

| Scenario | Tuple status | Generation status | Transport | Delivery | Ack state | Clears debt? | Resulting visibility state |
| --- | --- | --- | --- | --- | --- | --- | --- |
| transport_only_current_generation | current | current | accepted | unknown | pending | no | transport_pending |
| delivery_without_ack | current | current | accepted | downloaded | pending | no | delivered_pending_ack |
| superseded_generation_ack | current | superseded | accepted | downloaded | received | no | stale_generation |
| current_generation_explicit_ack | current | current | accepted | downloaded | received | yes | acknowledged |
| current_generation_policy_exception | current | current | accepted | failed | exception_recorded | yes | acknowledged |
| stale_tuple_ack | stale | current | accepted | downloaded | received | no | blocked |
| new_tuple_reopens_ack | current_new_tuple | pending_new | queued | unknown | pending | no | ack_pending |

## Minimum-necessary visibility boundary

| Visible to origin practice | Never widen from 313 |
| --- | --- |
| appointmentMacroStatus | providerAdapterBindingHash |
| appointmentDateTime | competingAttemptMargin |
| siteDisplayName | rawEvidencePayloadRef |
| practiceContinuityState | internalStaffNotes |
| ackGenerationState | patientExplanationVectors |
| manageCapabilityState | supplierMirrorDriftAudit |

## Rejected shortcuts

- MESH receipt or download does not equal practice acknowledgement.
- A stale generation acknowledgement does not clear current debt.
- A stale tuple acknowledgement does not clear current debt.
- A weak imported confirmation does not calm patient confirmation or manage posture.
- A cached or browser-local manage button set does not survive supplier drift or acknowledgement drift.
- Practice visibility may not be reconstructed from the latest message text without the current projection, envelope, and generation.

## Manage lease degradation

| Capability state | Read-only mode | Typical trigger | User-facing consequence |
| --- | --- | --- | --- |
| live | interactive | Current supplier, tuple, and acknowledgement truth all align. | Manage actions may remain interactive. |
| stale | read_only | Booked truth exists but current acknowledgement or supplier drift posture is unresolved. | View only plus typed guidance. |
| blocked | read_only | Tuple drift, identity hold, unsupported route, or current reconciliation dispute. | No stale CTA survives. |
| expired | read_only | Lease window or appointment version has expired. | A fresh capability compilation is required. |

## Supporting artifacts

- [313_truth_tuple_and_ack_generation_matrix.csv](/Users/test/Code/V/data/analysis/313_truth_tuple_and_ack_generation_matrix.csv)
- [313_commit_visibility_gap_log.json](/Users/test/Code/V/data/analysis/313_commit_visibility_gap_log.json)
- [313_commit_and_visibility_event_catalog.json](/Users/test/Code/V/data/contracts/313_commit_and_visibility_event_catalog.json)
