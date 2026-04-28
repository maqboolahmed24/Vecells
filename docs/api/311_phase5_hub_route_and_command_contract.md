# 311 Phase 5 Hub Route And Command Contract

This document freezes the route family, API surface, and command-envelope law for the first Phase 5 hub shell.

## Route-family registry

| Route | Projection | Transition type | Dominant action | Notes |
| --- | --- | --- | --- | --- |
| `/hub/queue` | HubQueueProjection | same_shell_section_switch | claim_or_monitor | Same shell family |
| `/hub/case/:hubCoordinationCaseId` | HubCaseConsoleProjection | same_family_root | coordinate_or_resume | Same shell family |
| `/hub/alternatives/:offerSessionId` | HubAlternativeOfferProjection | same_object_child | deliver_or_review_choices | Same shell family |
| `/hub/exceptions` | HubExceptionWorkbenchProjection | same_shell_section_switch | recover_or_supervise | Same shell family |
| `/hub/audit/:hubCoordinationCaseId` | HubAuditTrailProjection | same_object_child | review_proof | Same shell family |

### Governing route rules

1. The hub remains one same-shell family. Queue, case detail, alternatives, exceptions, and audit are never detached mini-products.
2. Case detail is the root ownership route for an active coordination case.
3. Child routes preserve the selected case anchor, current acting context, and last safe continuity evidence where that evidence is still valid.
4. Publication drift, manifest drift, or scope drift freezes or downgrades the current shell in place through `RouteFreezeDisposition` or `ReleaseRecoveryDisposition`; it does not silently leave stale controls armed.

## API surface skeleton

| Method | Path | Action scope | Primary states | Required envelope |
| --- | --- | --- | --- | --- |
| `GET` | `/v1/hub/cases/{hubCoordinationCaseId}` | `hub.case.read` | `hub_requested`, `intake_validated`, `queued`, `claimed`, `candidate_searching`, `candidates_ready`, `coordinator_selecting`, `candidate_revalidating`, `native_booking_pending`, `confirmation_pending`, `booked_pending_practice_ack`, `booked`, `closed`, `alternatives_offered`, `patient_choice_pending`, `callback_transfer_pending`, `callback_offered`, `escalated_back` | ActingContext; current visibility contract; CrossOrganisationVisibilityEnvelope when cross-org scope applies |
| `POST` | `/v1/hub/requests` | `hub.request.create` | `hub_requested` | requestLineageRef; originBookingCaseId; originLineageCaseLinkRef; reasonForHubRouting; sourceDecisionEpochRef or equivalent lineage proof |
| `POST` | `/v1/hub/cases/{hubCoordinationCaseId}:claim` | `hub.case.claim` | `queued`, `claimed` | ActingContext; StaffIdentityContext; ownershipEpoch expectation; current visibility contract; request lineage fence |
| `POST` | `/v1/hub/cases/{hubCoordinationCaseId}:transfer-ownership` | `hub.case.transfer_ownership` | `claimed`, `candidate_searching`, `candidates_ready`, `coordinator_selecting` | ActingContext; ownershipFenceToken; ownershipEpoch; current visibility contract; continuity message ref |
| `POST` | `/v1/hub/cases/{hubCoordinationCaseId}:refresh-candidates` | `hub.case.refresh_candidates` | `claimed`, `candidate_searching`, `candidates_ready` | ActingContext; ownershipFenceToken; ownershipEpoch; policyTupleHash; CrossOrganisationVisibilityEnvelope when cross-org work applies |
| `POST` | `/v1/hub/cases/{hubCoordinationCaseId}:offer-alternatives` | `hub.case.offer_alternatives` | `candidates_ready`, `coordinator_selecting`, `alternatives_offered`, `patient_choice_pending` | ActingContext; ownershipFenceToken; policyTupleHash; current candidate snapshot ref; current visibility contract |
| `POST` | `/v1/hub/cases/{hubCoordinationCaseId}:commit-native-booking` | `hub.case.commit_native_booking` | `coordinator_selecting`, `candidate_revalidating`, `native_booking_pending`, `confirmation_pending` | ActingContext; ownershipFenceToken; ownershipEpoch; policyTupleHash; current truthTupleHash; CrossOrganisationVisibilityEnvelope when cross-org work applies; idempotency key |
| `POST` | `/v1/hub/cases/{hubCoordinationCaseId}:return-to-practice` | `hub.case.return_to_practice` | `queued`, `claimed`, `candidate_searching`, `candidates_ready`, `coordinator_selecting`, `alternatives_offered`, `patient_choice_pending`, `candidate_revalidating`, `native_booking_pending`, `confirmation_pending`, `booked_pending_practice_ack`, `callback_transfer_pending`, `escalated_back` | ActingContext; ownershipFenceToken; ownershipEpoch; current visibility contract; reason-coded fallback rationale |
| `POST` | `/v1/hub/cases/{hubCoordinationCaseId}:close` | `hub.case.close` | `booked`, `callback_offered`, `escalated_back`, `closed` | ActingContext; ownershipFenceToken; ownershipEpoch; current visibility contract; LifecycleCoordinator close decision proof; openCaseBlockerRefs[] = empty |

### Command-envelope law

Every writable hub command must carry:

1. `ActingContext`
2. the current ownership fence token and epoch
3. the active minimum-necessary visibility contract
4. the current `CrossOrganisationVisibilityEnvelope` whenever cross-organisation work applies
5. one immutable `CommandActionRecord`
6. one authoritative `CommandSettlementRecord`

URL params, detached projection fragments, copied CTA state, or client-local cache may not supply missing authority.

## Event catalog

| Event | Aggregate | Implementation owner | Note |
| --- | --- | --- | --- |
| `hub.request.created` | NetworkBookingRequest | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.case.created` | HubCoordinationCase | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.case.claimed` | HubCoordinationCase | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.case.released` | HubCoordinationCase | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.case.transfer_started` | HubCoordinationCase | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.case.transfer_accepted` | HubCoordinationCase | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.capacity.snapshot.created` | NetworkCandidateSnapshot | `seq_312` | Frozen here so later work may implement without renaming. |
| `hub.candidates.rank_completed` | NetworkCandidateSnapshot | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.offer.created` | AlternativeOfferSession | `seq_312` | Frozen here so later work may implement without renaming. |
| `hub.offer.accepted` | AlternativeOfferSession | `seq_312` | Frozen here so later work may implement without renaming. |
| `hub.booking.native_started` | HubCommitAttempt | `seq_313` | Frozen here so later work may implement without renaming. |
| `hub.booking.confirmation_pending` | HubCommitAttempt | `seq_313` | Frozen here so later work may implement without renaming. |
| `hub.booking.externally_confirmed` | HubCommitAttempt | `seq_313` | Frozen here so later work may implement without renaming. |
| `hub.practice.notified` | PracticeAcknowledgementRecord | `seq_313` | Frozen here so later work may implement without renaming. |
| `hub.practice.acknowledged` | PracticeAcknowledgementRecord | `seq_313` | Frozen here so later work may implement without renaming. |
| `hub.patient.notified` | HubCoordinationCase | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.callback.transfer_pending` | HubFallbackRecord | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.callback.offered` | HubFallbackRecord | `seq_312` | Frozen here so later work may implement without renaming. |
| `hub.escalated.back` | HubFallbackRecord | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.queue.overload_critical` | HubCoordinationCase | `seq_311` | Frozen here so later work may implement without renaming. |
| `hub.case.closed` | HubCoordinationCase | `seq_311` | Frozen here so later work may implement without renaming. |
