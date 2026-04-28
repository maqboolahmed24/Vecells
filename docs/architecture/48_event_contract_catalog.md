# 48 Event Contract Catalog

- Task: `seq_048`
- Captured on: `2026-04-11`
- Generated at: `2026-04-13T14:51:07+00:00`

Active event contracts: `192` across `22` namespaces.

### `request.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `request.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.updated` | `lifecycle` | `additive_only` | `idempotent_replace` | `declared` |
| `request.submitted` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.evidence.capture.frozen` | `evidence` | `additive_only` | `append_only` | `declared` |
| `request.snapshot.created` | `evidence` | `additive_only` | `append_only` | `declared` |
| `request.snapshot.superseded` | `evidence` | `additive_only` | `superseding` | `declared` |
| `request.evidence.parity.verified` | `evidence` | `additive_only` | `append_only` | `declared` |
| `request.representation.emitted` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.representation.superseded` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `request.workflow.changed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.safety.changed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.identity.changed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.closure_blockers.changed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.close.evaluated` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.closed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.reopened` | `recovery` | `additive_only` | `append_only` | `declared` |
| `request.duplicate.pair_scored` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.duplicate.clustered` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.duplicate.review_required` | `blocker` | `additive_only` | `append_only` | `declared` |
| `request.duplicate.attach_applied` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.duplicate.retry_collapsed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.duplicate.resolved` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `request.duplicate.separated` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.lease.acquired` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.lease.released` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `request.lease.broken` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `request.lease.takeover_committed` | `lifecycle` | `additive_only` | `superseding` | `declared` |

### `intake.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `intake.draft.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `intake.draft.updated` | `lifecycle` | `additive_only` | `idempotent_replace` | `declared` |
| `intake.ingress.recorded` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `intake.ingress.superseded` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `intake.attachment.added` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `intake.attachment.quarantined` | `blocker` | `additive_only` | `append_only` | `declared` |
| `intake.normalized` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `intake.promotion.settled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `intake.resume.continuity.updated` | `continuity` | `new_version_required` | `idempotent_replace` | `declared` |

### `identity.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `identity.binding.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `identity.binding.settled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `identity.binding.verified` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `identity.binding.superseded` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `identity.binding.corrected` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `identity.binding.revoked` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `identity.repair_signal.recorded` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `identity.repair_case.opened` | `recovery` | `additive_only` | `append_only` | `declared` |
| `identity.repair_case.freeze_committed` | `recovery` | `additive_only` | `append_only` | `declared` |
| `identity.repair_branch.quarantined` | `recovery` | `additive_only` | `append_only` | `declared` |
| `identity.repair_case.corrected` | `recovery` | `additive_only` | `append_only` | `declared` |
| `identity.repair_release.settled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `identity.repair_case.closed` | `recovery` | `additive_only` | `append_only` | `declared` |
| `identity.session.established` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `identity.session.rotated` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `identity.session.terminated` | `lifecycle` | `additive_only` | `append_only` | `declared` |

### `access.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `access.grant.issued` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `access.grant.redeemed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `access.grant.rotated` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `access.grant.superseded` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `access.grant.revoked` | `lifecycle` | `additive_only` | `superseding` | `declared` |

### `telephony.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `telephony.call.started` | `lifecycle` | `additive_only` | `append_only` | `watch` |
| `telephony.menu.selected` | `lifecycle` | `additive_only` | `append_only` | `watch` |
| `telephony.identity.captured` | `lifecycle` | `additive_only` | `append_only` | `watch` |
| `telephony.recording.ready` | `lifecycle` | `additive_only` | `append_only` | `watch` |
| `telephony.urgent_live.assessed` | `lifecycle` | `additive_only` | `append_only` | `watch` |
| `telephony.transcript.readiness.updated` | `lifecycle` | `additive_only` | `idempotent_replace` | `watch` |
| `telephony.evidence.pending` | `blocker` | `additive_only` | `append_only` | `watch` |
| `telephony.evidence.readiness.assessed` | `evidence` | `additive_only` | `append_only` | `watch` |
| `telephony.evidence.ready` | `evidence` | `additive_only` | `append_only` | `watch` |
| `telephony.manual_review.required` | `blocker` | `additive_only` | `append_only` | `watch` |
| `telephony.continuation.eligibility.settled` | `settlement` | `new_version_required` | `append_only` | `watch` |
| `telephony.sms_link.sent` | `lifecycle` | `additive_only` | `append_only` | `watch` |
| `telephony.request.seeded` | `lifecycle` | `additive_only` | `append_only` | `watch` |
| `telephony.continuation.context.created` | `lifecycle` | `additive_only` | `append_only` | `watch` |
| `telephony.continuation.context.resolved` | `settlement` | `new_version_required` | `append_only` | `watch` |

### `safety.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `safety.screened` | `evidence` | `additive_only` | `append_only` | `declared` |
| `safety.classified` | `evidence` | `additive_only` | `append_only` | `declared` |
| `safety.preempted` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `safety.reassessed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `safety.decision_settled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `safety.urgent_diversion.required` | `recovery` | `additive_only` | `append_only` | `declared` |
| `safety.urgent_diversion.issued` | `recovery` | `additive_only` | `append_only` | `declared` |
| `safety.urgent_diversion.completed` | `recovery` | `additive_only` | `append_only` | `declared` |

### `triage.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `triage.task.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `triage.task.claimed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `triage.task.resumed` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `triage.task.settled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `triage.task_completion.continuity.updated` | `continuity` | `new_version_required` | `idempotent_replace` | `declared` |

### `booking.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `booking.capability.resolved` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `booking.slots.fetched` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.offers.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.slot.selected` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.slot.revalidated` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.slot.revalidation.failed` | `blocker` | `additive_only` | `append_only` | `declared` |
| `booking.commit.started` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.commit.confirmation_pending` | `blocker` | `additive_only` | `append_only` | `declared` |
| `booking.commit.reconciliation_pending` | `blocker` | `additive_only` | `append_only` | `declared` |
| `booking.commit.confirmed` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `booking.commit.ambiguous` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.confirmation.truth.updated` | `evidence` | `additive_only` | `idempotent_replace` | `declared` |
| `booking.appointment.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.reminders.scheduled` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.cancelled` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.reschedule.started` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `booking.manage.continuity.updated` | `continuity` | `new_version_required` | `idempotent_replace` | `declared` |

### `hub.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `hub.case.released` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `hub.case.transfer_started` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `hub.case.transfer_accepted` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `hub.capacity.snapshot.created` | `evidence` | `additive_only` | `append_only` | `declared` |
| `hub.candidates.rank_completed` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `hub.offer.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `hub.offer.accepted` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `hub.booking.native_started` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `hub.booking.confirmation_pending` | `blocker` | `additive_only` | `append_only` | `declared` |
| `hub.booking.externally_confirmed` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `hub.practice.notified` | `lifecycle` | `additive_only` | `append_only` | `declared` |

### `pharmacy.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `pharmacy.dispatch.started` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `pharmacy.dispatch.acknowledged` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `pharmacy.dispatch.confirmed` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `pharmacy.dispatch.proof_missing` | `blocker` | `additive_only` | `append_only` | `declared` |
| `pharmacy.consent.revoked` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `pharmacy.consent.revocation.recorded` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `pharmacy.outcome.received` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `pharmacy.outcome.unmatched` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `pharmacy.outcome.reconciled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `pharmacy.reachability.blocked` | `blocker` | `additive_only` | `append_only` | `declared` |
| `pharmacy.reachability.repaired` | `recovery` | `additive_only` | `append_only` | `declared` |
| `pharmacy.case.resolved` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `pharmacy.case.bounce_back` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `pharmacy.console_settlement.continuity.updated` | `continuity` | `new_version_required` | `idempotent_replace` | `declared` |

### `patient.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `patient.receipt.issued` | `settlement` | `namespace_break` | `append_only` | `declared` |
| `patient.receipt.degraded` | `recovery` | `namespace_break` | `append_only` | `declared` |
| `patient.receipt.consistency.updated` | `lifecycle` | `additive_only` | `idempotent_replace` | `declared` |
| `patient.nav.digest.updated` | `evidence` | `additive_only` | `idempotent_replace` | `declared` |
| `patient.nav.return.bound` | `continuity` | `new_version_required` | `append_only` | `declared` |
| `patient.record_action.context.issued` | `continuity` | `new_version_required` | `append_only` | `declared` |
| `patient.recovery.continuation.issued` | `continuity` | `new_version_required` | `append_only` | `declared` |

### `communication.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `communication.queued` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `communication.receipt.enveloped` | `evidence` | `additive_only` | `append_only` | `declared` |
| `communication.command.settled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `communication.delivery.evidence.recorded` | `evidence` | `additive_only` | `append_only` | `declared` |
| `communication.callback.outcome.recorded` | `evidence` | `additive_only` | `append_only` | `declared` |

### `reachability.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `reachability.dependency.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `reachability.assessment.settled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `reachability.dependency.failed` | `blocker` | `additive_only` | `append_only` | `declared` |
| `reachability.repair.started` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `reachability.dependency.repaired` | `recovery` | `additive_only` | `append_only` | `declared` |

### `exception.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `exception.review_case.opened` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `exception.review_case.recovered` | `recovery` | `additive_only` | `append_only` | `declared` |
| `exception.artifact.quarantined` | `blocker` | `additive_only` | `append_only` | `declared` |
| `exception.artifact.cleared` | `lifecycle` | `additive_only` | `append_only` | `declared` |

### `confirmation.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `confirmation.gate.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `confirmation.gate.confirmed` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `confirmation.gate.disputed` | `blocker` | `additive_only` | `append_only` | `declared` |
| `confirmation.gate.expired` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `confirmation.gate.cancelled` | `lifecycle` | `additive_only` | `append_only` | `declared` |

### `capacity.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `capacity.reservation.created` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `capacity.reservation.soft_selected` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `capacity.reservation.held` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `capacity.reservation.pending_confirmation` | `blocker` | `additive_only` | `append_only` | `declared` |
| `capacity.reservation.confirmed` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `capacity.reservation.released` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `capacity.reservation.expired` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `capacity.reservation.superseded` | `lifecycle` | `additive_only` | `superseding` | `declared` |
| `capacity.reservation.disputed` | `blocker` | `additive_only` | `append_only` | `declared` |
| `capacity.reservation.truth.updated` | `evidence` | `additive_only` | `idempotent_replace` | `declared` |

### `support.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `support.action.settled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `support.repair.route_opened` | `lifecycle` | `additive_only` | `append_only` | `declared` |
| `support.repair.route_settled` | `settlement` | `new_version_required` | `append_only` | `declared` |
| `support.replay.restore.required` | `recovery` | `additive_only` | `append_only` | `declared` |
| `support.replay.restore.settled` | `recovery` | `namespace_break` | `append_only` | `declared` |

### `assistive.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `assistive.transcript.ready` | `lifecycle` | `new_version_required` | `append_only` | `watch` |
| `assistive.context.snapshot.created` | `continuity` | `new_version_required` | `append_only` | `watch` |
| `assistive.artifact.generated` | `lifecycle` | `new_version_required` | `append_only` | `watch` |
| `assistive.run.settled` | `settlement` | `new_version_required` | `append_only` | `watch` |
| `assistive.freeze.opened` | `lifecycle` | `namespace_break` | `append_only` | `watch` |
| `assistive.freeze.released` | `lifecycle` | `namespace_break` | `superseding` | `watch` |
| `assistive.session.continuity.updated` | `continuity` | `new_version_required` | `idempotent_replace` | `watch` |

### `policy.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `policy.bundle.compiled` | `policy` | `new_version_required` | `append_only` | `watch` |
| `policy.bundle.rejected` | `policy` | `new_version_required` | `append_only` | `watch` |
| `policy.bundle.promoted` | `policy` | `new_version_required` | `append_only` | `watch` |

### `release.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `release.candidate.published` | `policy` | `new_version_required` | `append_only` | `declared` |
| `release.wave.started` | `policy` | `new_version_required` | `append_only` | `declared` |
| `release.wave.widened` | `policy` | `new_version_required` | `append_only` | `declared` |
| `release.freeze.opened` | `policy` | `namespace_break` | `append_only` | `declared` |
| `release.freeze.released` | `policy` | `namespace_break` | `superseding` | `declared` |
| `release.rollback.started` | `policy` | `new_version_required` | `superseding` | `declared` |
| `release.rollback.completed` | `policy` | `new_version_required` | `superseding` | `declared` |

### `analytics.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `analytics.projection_health.updated` | `observability` | `new_version_required` | `observational` | `watch` |
| `analytics.assurance_slice.degraded` | `observability` | `new_version_required` | `observational` | `watch` |
| `analytics.assurance_slice.quarantined` | `observability` | `new_version_required` | `observational` | `watch` |
| `analytics.continuity_control.health.updated` | `observability` | `new_version_required` | `observational` | `watch` |

### `audit.*`

| Event | Purpose | Compatibility | Replay | Defect |
| --- | --- | --- | --- | --- |
| `audit.recorded` | `observability` | `new_version_required` | `observational` | `watch` |
| `audit.break_glass.used` | `observability` | `namespace_break` | `observational` | `watch` |
| `audit.export.generated` | `observability` | `new_version_required` | `observational` | `watch` |
