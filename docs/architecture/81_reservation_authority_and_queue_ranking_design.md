# 81 Reservation Authority and Queue Ranking Design

## Core law

`ReservationAuthority` is the only serializer over `canonicalReservationKey`, and `QueueRankingCoordinator` is the only service that may commit canonical queue order from one fact cut.

Patient-visible exclusivity appears only when a real `held` reservation exists with a persisted expiry. `soft_selected` and `pending_confirmation` stay truthful but non-exclusive. On the workspace side, reviewer guidance is derived only after one committed `QueueRankSnapshot` exists and is never allowed to mutate that base order.

## Control records

The control layer adds four persisted records on top of the existing par_073 and par_074 substrates:

1. `ReservationFenceRecord` tracks short-lived fencing tokens, blocked contention, and terminal release or expiry posture.
2. `QueueSnapshotCommitRecord` binds one committed queue snapshot to one plan, one fact cut, and one fairness posture.
3. `QueuePressureEscalationRecord` preserves overload-critical evidence for replay and operator visibility.
4. `NextTaskAdvisorySnapshot` keeps launch readiness downstream from canonical queue truth and blocks mixed-snapshot drift.

## Persistence and simulator

The simulator covers nine deterministic scenarios:

1. `soft_selected_supply_no_exclusive_hold`
2. `real_held_reservation_with_expiry_and_revalidation`
3. `pending_confirmation_requires_truthful_nonfinal_copy`
4. `overlapping_local_and_hub_claims_same_key`
5. `fair_queue_normal_load_commits_snapshot`
6. `overload_queue_pressure_escalated`
7. `fairness_merge_rotates_routine_bands`
8. `assignment_suggestions_preserve_base_queue`
9. `next_task_advice_blocked_on_stale_owner`

The runtime reuses the par_074 reservation truth service and the par_073 queue-ranking service directly. par_081 adds only the authoritative control surface around them: fencing, snapshot commitment, overload persistence, and next-task discipline.
