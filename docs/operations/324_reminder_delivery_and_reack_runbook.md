# 324 Reminder Delivery And Reack Runbook

## Purpose

This runbook covers the 324 backend surfaces that can force reminder recovery or practice re-acknowledgement on booked network appointments.

## Daily checks

- Review `phase5_network_reminder_plans` where `schedule_state IN ('delivery_blocked', 'disputed')`.
- Review `phase5_network_reminder_delivery_evidence` for `evidence_state IN ('failed', 'expired', 'disputed')`.
- Review `phase5_network_manage_capabilities` where `capability_state IN ('blocked', 'stale', 'expired')` and the top blocker is not expected release freeze.
- Review `phase5_practice_visibility_projections` where `projection_state = 'published_pending_ack'` and `action_required_state != 'none'`.
- Review `phase5_practice_visibility_delta_records` for repeated `delta_reason = 'reminder_failure'` on the same case.

## Failure handling

1. Confirm the current appointment lineage is still authoritative.
2. Inspect the latest reminder plan for route trust, reachability, and current `contactRouteVersionRef`.
3. Inspect the latest delivery evidence row.
4. If the evidence is `failed`, `expired`, or `disputed`, expect:
   - the reminder plan to move into recovery posture
   - a `ReminderTimelinePublication(publicationKind = reminder_failed)`
   - a reopened practice acknowledgement debt
   - a fresh `PracticeVisibilityProjection` with explicit recovery posture
5. If those writes are missing, rerun the 324 validator before attempting manual repair.

## Manage lease handling

- Do not manually reopen a blocked manage lease by flipping UI flags.
- Recompile `NetworkManageCapabilities` only after the underlying blocker is fixed: acknowledgement debt settled, route repair completed, supplier drift reconciled, or session/subject lease refreshed.
- After any applied or provider-pending manage mutation, expect `post_mutation_refresh_required` until a new lease is compiled.

## Re-acknowledgement handling

- Reminder failure, cancellation, reschedule, callback fallback, and supplier drift all count as material post-book changes.
- The correct repair path is to reopen acknowledgement debt and issue a refreshed practice continuity message under the current visibility envelope.
- Do not clear acknowledgement debt with stale generation or stale envelope evidence.

## Known seam

The patient timeline renderer is still a later-owned surface. If timeline rows exist but the patient UI does not render them, use the 324 gap note and hand off to `330` rather than rewriting reminder truth in an ad hoc notification store.
