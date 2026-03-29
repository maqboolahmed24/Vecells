# Phase 0 - The Foundation Protocol

**Working scope**  
Platform spine and integration seams.

## The detailed Phase 0 development algorithm

The cleanest way to run Phase 0 is as **seven internal sub-phases**. Each one leaves the system stronger than before, and each one has hard gates before you move on.

---

## 0A. Delivery skeleton and repository architecture

This is where you decide how the codebase will stay sane when the product becomes large.

For Vecells, a **modular monorepo** is the cleanest default unless there is a strong organisational reason not to use one. There will be several front-end surfaces and several backend executables sharing the same contracts, so a monorepo makes design-system reuse, typed API contracts, shared test fixtures, and cross-cutting refactors much easier.

The repo should be split by bounded context, not by framework convenience. A good starting shape is:

- `apps/patient-web`
- `apps/clinical-workspace`
- `apps/ops-console`
- `apps/hub-desk`
- `services/api-gateway`
- `services/command-api`
- `services/projection-worker`
- `services/notification-worker`
- `services/adapter-simulators`
- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/fhir-mapping`
- `packages/design-system`
- `packages/authz-policy`
- `packages/test-fixtures`
- `packages/observability`
- `packages/api-contracts`
- `packages/release-controls`
- `infra/environments`
- `ops/runbooks`

The rule is simple: **no app can own truth**. Truth lives in the domain kernel, event contracts, and persistence layer.

The first code written here is not business logic. It is build system, linting, type safety, code owners, import-boundary rules, environment loading, secret injection, local dev bootstrap, preview deploys, and CI workflows.

Phase 0 must also establish the delivery control plane now, not later. Create a contract registry for synchronous APIs and live update channels, a migration runner that enforces expand-migrate-contract discipline, ephemeral preview environments, a release-manifest generator that binds immutable artifacts to approved `CompiledPolicyBundle` hashes, and a canary plus rollback harness. Treat those as first-class platform capabilities rather than downstream DevOps chores.

On the backend side, create the runnable empty services with health endpoints, config validation, structured logging, and startup dependency checks.

On the frontend side, create the app shells with routing, route guards, layout primitives, global state plumbing, API client stubs, feature flag support, error boundaries, and loading skeletons.

**Tests that must pass before 0A is done**

- Every app and service builds in CI.
- Every service can boot locally with a one-command developer startup.
- Every frontend app can render shell pages in preview environments.
- API and event contract compatibility tests pass for every published route and event family.
- Schema migration dry-run tests pass against production-like snapshots.
- SBOM generation, dependency policy checks, and signed-artifact verification pass in CI.
- Preview deploy smoke tests and non-production canary rollback rehearsal pass.
- Import-boundary lint rules block forbidden cross-module dependencies.
- Secrets never appear in source, logs, or build output.

**Exit state**  
You have a live but nearly empty product platform. It does almost nothing useful yet, but it is deployable, release-controlled, testable, and hard to accidentally turn into spaghetti.

---

## 0B. Canonical domain kernel and state machine

This is the real heart of Phase 0.

The target remains one FHIR-native, event-driven platform with request intake, tasks, communications, booking handoffs, pharmacy flows, and audit, all hanging off the same runtime backbone.

The mistake to avoid is using FHIR resources directly as the internal object model. Build a **Vecells domain model first**, then map it to FHIR-oriented persistence and interchange.

At minimum, define these aggregates:

**Request**  
The canonical work item. Fields should include `id`, `tenantId`, `patientRef`, `sourceChannel`, `requestType`, `narrative`, `structuredData`, `attachmentRefs`, `contactPreferences`, `workflowState`, `safetyState`, `identityState`, `priorityBand`, `pathway`, `assignedQueue`, `slaClock`, `currentEvidenceSnapshotRef`, `currentHandoffRef`, `createdAt`, `updatedAt`, `version`.

**EvidenceSnapshot**  
Immutable evidence slice attached to a request. Fields like `snapshotId`, `requestId`, `sourceType`, `schemaVersion`, `capturedAt`, `structuredPayloadRef`, `attachmentRefs`, `audioRefs`, `derivedFactsRef`, `supersedesSnapshotRef`.

**Task**  
Operational or clinical action item. Fields like `taskId`, `requestId`, `taskType`, `ownerType`, `ownerId`, `status`, `dueAt`, `priority`, `resolution`, `approvalState`.

**Communication**  
Outbound or inbound message object. Fields like `channel`, `recipient`, `template`, `payload`, `deliveryState`, `threadId`, `relatedRequestId`.

**Attachment**  
Binary reference only, never inline blobs. Fields like `objectKey`, `contentType`, `size`, `checksum`, `virusScanState`, `documentReferenceId`.

**AuditRecord**  
Append-only action record. Fields like `actor`, `action`, `targetType`, `targetId`, `reasonCode`, `sourceIp`, `userAgent`, `timestamp`, `previousHash`, `hash`.

**IdempotencyRecord**  
Required for duplicate submits, repeated webhooks, and retry safety.

Add these cross-phase guardrail objects now:

**IdentityBinding**  
`bindingId`, `requestId`, `subjectRef`, `candidatePatientRefs`, `bindingState = candidate | ambiguous | verified_patient | corrected | revoked`, `assuranceLevel = none | low | medium | high`, `verifiedContactRouteRef`, `matchEvidenceRef`, `stepUpMethod`, `supersededByRef`, `createdAt`, `updatedAt`

**AccessGrant**  
`grantId`, `requestId`, `grantType`, `scope`, `subjectRef`, `boundPatientRef`, `boundContactRouteRef`, `oneTime`, `expiresAt`, `redeemedAt`, `revokedAt`, `supersedesGrantRef`, `createdAt`, `updatedAt`

**DuplicateCluster**  
`clusterId`, `canonicalRequestId`, `memberRequestRefs`, `memberSnapshotRefs`, `relationType = retry | same_episode_candidate | related_episode | review_required`, `reviewStatus`, `decisionRef`, `createdAt`, `updatedAt`

**SafetyPreemptionRecord**  
`preemptionId`, `requestId`, `triggeringSnapshotRef`, `sourceDomain`, `evidenceClass = technical_metadata | operationally_material_nonclinical | potentially_clinical`, `reasonCode`, `status = pending | cleared_routine | escalated_urgent | cancelled`, `createdAt`, `resolvedAt`

**RequestLifecycleLease**  
`leaseId`, `requestId`, `domain`, `domainObjectRef`, `state = active | releasing | released`, `closeBlockReason`, `acquiredAt`, `releasedAt`

**RequestClosureRecord**  
`closureRecordId`, `requestId`, `evaluatedAt`, `requiredCausalToken`, `blockingLeaseRefs`, `blockingPreemptionRefs`, `blockingApprovalRefs`, `decision`, `closedByMode`

**CapacityReservation**  
`reservationId`, `capacityUnitRef`, `sourceDomain`, `holderRef`, `state = none | soft_selected | held | pending_confirmation | confirmed | released | expired | disputed`, `expiresAt`, `confirmedAt`, `releasedAt`

**PharmacyCorrelationRecord**  
`correlationId`, `pharmacyCaseId`, `packageId`, `dispatchAttemptId`, `providerRef`, `patientRef`, `serviceType`, `transportMode`, `outboundReferenceSet`, `acknowledgementState`, `confidenceFloor`, `createdAt`, `updatedAt`

**VisibilityProjectionPolicy**  
`policyId`, `audienceTier`, `allowedFields`, `redactionRules`, `purposeOfUseRequirements`, `breakGlassAllowed`, `consistencyClass`

**CompiledPolicyBundle**  
`bundleId`, `tenantId`, `policyPackRefs`, `configVersionRefs`, `compiledHash`, `compatibilityState`, `simulationEvidenceRef`, `approvedBy`, `approvedAt`

Required platform services are:

- `LifecycleCoordinator`: sole cross-domain authority for request closure and reopen decisions
- `ReservationAuthority`: sole serializer for any user-visible claim on `capacityUnitRef`
- `AccessGrantService`: sole issuer, redeemer, revoker, and rotator of patient-access grants
- `SafetyOrchestrator`: sole owner of evidence classification, safety preemption, and canonical re-safety

Then define the intake and `Request` state contracts now. Even in Phase 0, the transition maps should be fixed.

Use four explicit axes rather than one overloaded status field. Confirmation gates, repair holds, duplicate review, fallback recovery, reachability repair, and other closure blockers are orthogonal control-plane facts; they must never be encoded as `Request.workflowState` values:

**Submission envelope state**  
`draft -> evidence_pending -> ready_to_promote -> promoted | abandoned | expired`

**Workflow state**  
`submitted -> intake_normalized -> triage_ready -> triage_active -> handoff_active -> outcome_recorded -> closed`

**Safety state**  
`not_screened -> screen_clear | residual_risk_flagged | urgent_diversion_required -> urgent_diverted`

**Identity state**  
`anonymous -> partial_match -> matched -> claimed`

State semantics matter:

- `SubmissionEnvelope` owns pre-submit capture and continuation; `Request` must not exist merely because draft evidence exists.
- `submitted` is mandatory and is entered when governed promotion from `SubmissionEnvelope` to `Request` succeeds, before normalization or safety. It is the durable post-submit state used for crash recovery, replay, dedupe, and SLA anchoring.
- `intake_normalized` is mandatory and is only entered after the immutable submission snapshot and canonical normalizer both succeed.
- `triage_ready` is only legal once a real `TriageTask` has been created.
- `triage_active` is the coarse canonical state for all live practice-side review and reopen activity on the request lineage.
- `residual_risk_flagged` is only legal when non-diversion safety rules remain active and their rule IDs have been durably persisted on the request lineage.
- `urgent_diversion_required` is only legal when the urgent path has been determined but the urgent advice or escalation action is not yet durably issued. Once that action is durably issued, the request must move to `urgent_diverted`.

With allowed workflow branches such as:

- `submitted -> intake_normalized`
- `intake_normalized -> triage_ready`
- `triage_ready -> triage_active`
- `triage_active -> handoff_active`
- `triage_active -> outcome_recorded`
- `handoff_active -> triage_active`
- `handoff_active -> outcome_recorded`
- `outcome_recorded -> closed`

Detailed queue, review, booking, hub, and pharmacy states must live on their own domain objects. The canonical `Request` should record milestone ownership and outcome state, not impersonate every downstream operational step.

Also lock these non-negotiable invariants now:

1. One `Request` represents one clinical episode. Suspected duplicates are clustered, not silently merged, unless they are proven idempotent retries or proven same-episode continuations.
2. Authentication, phone verification, or continuation redemption must not directly overwrite `Request.patientRef`. Patient binding must flow through `IdentityBinding`.
3. Any clinically material evidence must create a new immutable `EvidenceSnapshot` and must trigger the canonical safety reassessment before routine flow continues.
4. No domain-local service may close a request by itself. Only `LifecycleCoordinator` may write `Request.workflowState = closed`.
5. Confirmation pending, identity repair, duplicate review, fallback recovery, reachability repair, and degraded promises must remain orthogonal blocker facts; encoding them as `Request.workflowState` values is forbidden.
6. No patient-facing flow may imply slot exclusivity unless a real `CapacityReservation.state = held` exists.
7. No pharmacy case may auto-close from weakly correlated, email-only, or operator-entered outcome evidence.
8. Minimum-necessary access must be enforced before projection materialization, not only in the UI.
9. No production config promotion may occur until a single compiled policy bundle has passed compatibility validation and reference-case simulation.

At this stage, also define the first event catalogue. Use one cross-phase contract:

- `request.created`
- `request.updated`
- `request.submitted`
- `request.snapshot.created`
- `request.workflow.changed`
- `request.safety.changed`
- `request.identity.changed`
- `request.closure_blockers.changed`
- `intake.draft.created`
- `intake.draft.updated`
- `intake.attachment.added`
- `intake.attachment.quarantined`
- `intake.normalized`
- `safety.screened`
- `safety.urgent_diversion.required`
- `safety.urgent_diversion.completed`
- `triage.task.created`
- `triage.task.claimed`
- `triage.task.resumed`
- `patient.receipt.issued`
- `patient.receipt.degraded`
- `communication.queued`
- `audit.recorded`
- `identity.binding.created`
- `identity.binding.verified`
- `identity.binding.corrected`
- `identity.binding.revoked`
- `identity.repair_case.opened`
- `identity.repair_case.corrected`
- `identity.repair_case.closed`
- `access.grant.issued`
- `access.grant.redeemed`
- `access.grant.revoked`
- `request.duplicate.clustered`
- `request.duplicate.review_required`
- `request.duplicate.resolved`
- `request.merge.completed`
- `request.safety.preempted`
- `request.safety.reassessed`
- `request.lease.acquired`
- `request.lease.released`
- `reachability.dependency.created`
- `reachability.dependency.failed`
- `reachability.dependency.repaired`
- `fallback.review_case.opened`
- `fallback.review_case.recovered`
- `external.confirmation.gate.created`
- `external.confirmation.gate.confirmed`
- `external.confirmation.gate.disputed`
- `request.close.evaluated`
- `request.closed`
- `request.reopened`
- `capacity.reservation.created`
- `capacity.reservation.held`
- `capacity.reservation.confirmed`
- `capacity.reservation.released`
- `capacity.reservation.disputed`
- `pharmacy.dispatch.acknowledged`
- `pharmacy.outcome.unmatched`
- `policy.bundle.compiled`
- `policy.bundle.rejected`
- `policy.bundle.promoted`

Use these namespaces consistently across all later phases: `request.*`, `intake.*`, `identity.*`, `telephony.*`, `safety.*`, `triage.*`, `booking.*`, `hub.*`, `pharmacy.*`, `patient.*`, `communication.*`, `assistive.*`, `analytics.*`, and `audit.*`.

Do not introduce phase-local workflow meanings onto `Request` if a dedicated downstream aggregate already owns that detail.

On the FHIR side, the mapping layer should be explicit. `Task`, `ServiceRequest`, `DocumentReference`, and `Consent` are still the right core backbone, but the mapping should live in one place so the rest of the code stays domain-first.

**Frontend work in 0B**

Build an internal-only request inspector page inside the clinical shell and the patient shell. It should show:

- request summary
- current workflow, safety, and identity state
- event timeline
- attachments list
- related tasks
- raw debug identifiers

This is not a production feature. It is a developer tool that stops the team from building blind.

**Tests that must pass before 0B is done**

- state-transition tests for every allowed and forbidden transition on each state axis
- property-based tests proving invalid sequences are rejected
- event-schema compatibility tests
- idempotency tests for repeated submit and create commands
- snapshot tests for domain-to-FHIR mapping
- version-increment tests on aggregate updates

**Exit state**  
You have one canonical request model, one explicit state contract, and one event vocabulary. Every later phase depends on this being right.

## Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm

### 0. Purpose

This segment defines the mandatory platform-wide algorithm for:

* pre-submission capture and governed promotion
* episode formation and continuity control
* identity binding, claim, and wrong-patient correction
* request ownership and secure-link access
* safety and reachability preemption
* duplicate control and merge discipline
* lifecycle, closure, reopen, and cross-domain concurrency
* capacity reservation, truthful offer handling, and degraded external booking
* pharmacy dispatch, consent, and outcome reconciliation
* audience-tier projection, UI-state safety, and communication semantics
* support governance, derived-artifact control, and retention freezing
* resilience, assurance ingestion, and configuration promotion

Any local rule that conflicts with this segment is invalid.

The canonical boundary model is:

* `SubmissionEnvelope`: the only durable container for pre-submission input, incomplete drafts, and evidence that is not yet safe to promote.
* `Episode`: the only durable object that represents one clinical episode.
* `Request`: one governed submission lineage inside one `Episode`.
* domain cases such as triage, callback, booking, hub, pharmacy, reconciliation, and exception work: operational branches attached to the `Episode` and, where relevant, to the originating `Request`.

One object must not silently stand in for all four boundaries.

### 1. Required platform objects

#### 1.1 SubmissionEnvelope

Fields:

* `envelopeId`
* `sourceChannel = web_draft | telephony_call | telephony_continuation | nhs_app_resume | support_capture | secure_link_entry | assisted_capture`
* `sourceLineageRef`
* `state = draft | evidence_pending | ready_to_promote | promoted | abandoned | expired`
* `latestEvidenceSnapshotRef`
* `retentionClass = pre_submission | clinically_material_pre_submit`
* `verifiedSubjectRef`
* `candidatePatientRefs[]`
* `candidateEpisodeRef`
* `candidateRequestRef`
* `promotionDecisionRef`
* `expiresAt`
* `promotedRequestRef`
* `createdAt`
* `updatedAt`

Semantics:

* is the only durable container for incomplete, unauthenticated, or not-yet-promoted input
* is allowed to hold drafts, partial telephony capture, continuation fragments, and uploads
* must not be projected as a submitted clinical request
* may be linked to zero or one `Episode` before promotion and exactly one `Request` after promotion
* must use narrower retention and projection rules than canonical submitted work unless policy upgrades it because the pre-submission content is clinically material

#### 1.2 Episode

Fields:

* `episodeId`
* `patientRef?`
* `currentIdentityBindingRef`
* `activeIdentityRepairCaseRef`
* `currentConfirmationGateRefs[]`
* `currentClosureBlockerRefs[]`
* `episodeFingerprint`
* `originRequestRef`
* `memberRequestRefs[]`
* `state = open | resolved | archived`
* `resolutionReason`
* `openedAt`
* `resolvedAt`
* `updatedAt`

Semantics:

* is the sole canonical container for one clinical episode
* may parent one or more related `Request` objects without forcing them into a single operational lineage
* keeps identity repair, duplicate review, fallback recovery, confirmation gates, and other closure blockers orthogonal to episode lifecycle rather than encoding them as extra episode states
* is the object against which cross-domain invariants, closure, reopen, and high-risk correction are ultimately evaluated

#### 1.3 Request

Fields:

* `requestId`
* `episodeId`
* `originEnvelopeRef`
* `requestVersion`
* `tenantId`
* `sourceChannel`
* `requestType`
* `narrativeRef`
* `structuredDataRef`
* `attachmentRefs[]`
* `contactPreferencesRef`
* `workflowState = submitted | intake_normalized | triage_ready | triage_active | handoff_active | outcome_recorded | closed`
* `safetyState = not_screened | screen_clear | residual_risk_flagged | urgent_diversion_required | urgent_diverted`
* `identityState = anonymous | partial_match | matched | claimed`
* `priorityBand`
* `pathwayRef`
* `assignedQueueRef`
* `patientRef?`
* `currentIdentityBindingRef`
* `currentEvidenceSnapshotRef`
* `currentTriageTaskRef`
* `currentHandoffRef`
* `currentConfirmationGateRefs[]`
* `currentClosureBlockerRefs[]`
* `slaClockRef`
* `createdAt`
* `updatedAt`

Semantics:

* represents one governed submission lineage promoted from one `SubmissionEnvelope`
* is not a draft store
* keeps workflow milestones separate from confirmation, repair, duplicate-review, and fallback-recovery blockers
* derives `patientRef` from the latest verified `IdentityBinding`; before verified binding exists it may be null while `identityState` remains below `claimed`
* may receive additional immutable snapshots after promotion
* may remain related to other `Request` objects within the same `Episode` without being merged into them

#### 1.4 IdentityBinding

Fields:

* `bindingId`
* `episodeId`
* `requestId`
* `subjectRef`
* `candidatePatientRefs[]`
* `bindingState = candidate | provisional_verified | ambiguous | verified_patient | correction_pending | corrected | revoked`
* `assuranceLevel = none | low | medium | high`
* `verifiedContactRouteRef`
* `matchEvidenceRef`
* `stepUpMethod`
* `supersededByRef`
* `createdAt`
* `updatedAt`

Semantics:

* owns patient-binding decisions
* is the sole governed source for establishing or correcting patient identity on a `Request` and its `Episode`
* separates authentication, matching, and ownership
* supports provisional binding before irreversible downstream work exists

#### 1.5 IdentityRepairCase

Fields:

* `repairCaseId`
* `episodeId`
* `affectedRequestRefs[]`
* `suspectedWrongBindingRef`
* `state = opened | access_frozen | downstream_quarantined | corrected | rebuilt | closed`
* `openedBy`
* `supervisorApprovalRef`
* `independentReviewRef`
* `projectionRebuildRef`
* `compensationRefs[]`
* `createdAt`
* `updatedAt`

Semantics:

* is mandatory for any wrong-patient correction after a verified bind exists
* freezes access, revokes derivative grants, quarantines projections, and coordinates downstream compensation before ordinary flow resumes

#### 1.6 AccessGrant

Fields:

* `grantId`
* `grantFamily = draft_resume_minimal | public_status_minimal | claim_step_up | continuation_seeded_verified | continuation_challenge | transaction_action_minimal | support_recovery_minimal`
* `actionScope = envelope_resume | status_view | claim | respond_more_info | waitlist_offer | alternative_offer | appointment_manage_entry | pharmacy_status_entry | callback_status_entry | callback_response | message_thread_entry | message_reply | contact_route_repair | secure_resume`
* `lineageScope = envelope | request | episode`
* `subjectRef`
* `boundPatientRef`
* `boundContactRouteRef`
* `subjectBindingMode = none | soft_subject | hard_subject`
* `phiExposureClass = none | minimal | scoped`
* `replayPolicy = one_time | rotating | multi_use_minimal`
* `expiresAt`
* `redeemedAt`
* `revokedAt`
* `revocationReason`
* `supersedesGrantRef`
* `createdAt`
* `updatedAt`

Semantics:

* all secure-link, continuation, uplift, and transactional patient-entry flows must use this object
* `manual_only` is not a grant family; it is a routing disposition indicating no safe grant may be issued
* each grant family must use an independently testable validator, replay policy, and signing or key namespace so a family-specific defect cannot widen all access paths at once

#### 1.7 DuplicateCluster

Fields:

* `clusterId`
* `episodeId`
* `canonicalRequestId`
* `memberRequestRefs[]`
* `memberSnapshotRefs[]`
* `relationType = retry | same_episode_candidate | same_episode_confirmed | related_episode | review_required`
* `reviewStatus`
* `decisionRef`
* `createdAt`
* `updatedAt`

Semantics:

* `same_episode_candidate` is a clustering signal only
* `same_episode_candidate` never authorizes automatic attach or merge by itself
* only `retry` or `same_episode_confirmed` may authorize attach behavior, and `same_episode_confirmed` remains subject to the attach rules below

#### 1.8 SafetyPreemptionRecord

Fields:

* `preemptionId`
* `episodeId`
* `requestId`
* `triggeringSnapshotRef`
* `sourceDomain`
* `evidenceClass = technical_metadata | operationally_material_nonclinical | contact_safety_relevant | potentially_clinical`
* `priority = routine_review | urgent_review | urgent_live`
* `reasonCode`
* `status = pending | cleared_routine | escalated_urgent | cancelled`
* `createdAt`
* `resolvedAt`

Semantics:

* is the only cross-domain blocker for materially meaningful new evidence or reachability risk
* supports conservative urgent handling even before full evidence normalization is complete

#### 1.9 ReachabilityDependency

Fields:

* `dependencyId`
* `episodeId`
* `requestId`
* `domain`
* `domainObjectRef`
* `requiredRouteRef`
* `purpose = callback | clinician_message | more_info | waitlist_offer | alternative_offer | pharmacy_contact | urgent_return | outcome_confirmation`
* `deadlineAt`
* `failureEffect = escalate | urgent_review | requeue | invalidate_pending_action`
* `state = active | satisfied | expired | superseded`
* `createdAt`
* `updatedAt`

Semantics:

* formalizes when contact-route changes, delivery failures, or preference changes are no longer merely operational
* any active dependency can upgrade a delivery or reachability event into a preemption-triggering condition

#### 1.10 RequestLifecycleLease

Fields:

* `leaseId`
* `episodeId`
* `requestId`
* `domain`
* `domainObjectRef`
* `state = active | releasing | released | expired | broken`
* `closeBlockReason`
* `leaseTtlSeconds`
* `heartbeatAt`
* `fencingToken`
* `ownerInstanceRef`
* `acquiredAt`
* `releasedAt`
* `brokenByActorRef`
* `breakReason`

Semantics:

* is a first-class distributed systems primitive, not just a logical flag
* all active workflow objects must heartbeat their lease
* stale-owner fencing is mandatory

#### 1.11 LineageFence

Fields:

* `fenceId`
* `episodeId`
* `currentEpoch`
* `issuedFor = close | reopen | identity_repair | ownership_change | urgent_preemption | cross_domain_commit`
* `issuedAt`
* `expiresAt`

Semantics:

* any command that changes cross-domain invariants must present the current epoch
* stale-epoch writes must fail and trigger reevaluation rather than silently racing

#### 1.12 RequestClosureRecord

Fields:

* `closureRecordId`
* `episodeId`
* `requestId`
* `evaluatedAt`
* `requiredLineageEpoch`
* `blockingLeaseRefs[]`
* `blockingPreemptionRefs[]`
* `blockingApprovalRefs[]`
* `blockingConfirmationRefs[]`
* `blockingDuplicateClusterRefs[]`
* `blockingFallbackCaseRefs[]`
* `blockingIdentityRepairRefs[]`
* `blockingGrantRefs[]`
* `blockingReachabilityRefs[]`
* `blockingDegradedPromiseRefs[]`
* `decision = close | defer`
* `closedByMode`
* `deferReasonCodes[]`

#### 1.13 CapacityIdentity

Fields:

* `capacityIdentityId`
* `sourceSystem`
* `sourceSlotRef`
* `scheduleEnvelopeHash`
* `sourceVersion`
* `mutabilityClass = stable | unstable | manual_window`
* `normalizationConfidence = strong | medium | weak`
* `canonicalReservationKey`
* `createdAt`
* `updatedAt`

Semantics:

* `capacityUnitRef` must resolve to a `CapacityIdentity`, not to an underspecified universal slot assumption
* weak or manual identities may support candidate display, but they may not support exclusivity claims or final booked assurance until externally confirmed

#### 1.14 CapacityReservation

Fields:

* `reservationId`
* `capacityIdentityRef`
* `canonicalReservationKey`
* `sourceDomain`
* `holderRef`
* `state = none | soft_selected | held | pending_confirmation | confirmed | released | expired | disputed`
* `commitMode = exclusive_hold | truthful_nonexclusive | degraded_manual_pending`
* `expiresAt`
* `confirmedAt`
* `releasedAt`

#### 1.15 ExternalConfirmationGate

Fields:

* `gateId`
* `episodeId`
* `domain`
* `domainObjectRef`
* `transportMode`
* `assuranceLevel = strong | moderate | weak | manual`
* `proofRefs[]`
* `confirmationDeadlineAt`
* `state = pending | confirmed | expired | disputed | cancelled`
* `createdAt`
* `updatedAt`

Semantics:

* any weak, asynchronous, or manual external handoff must hold one of these gates
* no final patient assurance or closure may rely on a weak or manual path without this gate being satisfied or explicitly escalated under policy

#### 1.16 PharmacyCorrelationRecord

Fields:

* `correlationId`
* `pharmacyCaseId`
* `packageId`
* `dispatchAttemptId`
* `providerRef`
* `patientRef`
* `serviceType`
* `transportMode`
* `outboundReferenceSet`
* `acknowledgementState`
* `confidenceFloor`
* `createdAt`
* `updatedAt`

#### 1.17 VisibilityProjectionPolicy

Fields:

* `policyId`
* `audienceTier`
* `purposeOfUse`
* `allowedFields[]`
* `derivedFields[]`
* `prohibitedFields[]`
* `redactionRules`
* `breakGlassAllowed`
* `consistencyClass = informational_eventual | operational_guarded | command_following`
* `materializationMode = allowlisted_only`
* `createdAt`
* `updatedAt`

Semantics:

* minimum-necessary access must be enforced before projection materialization
* UI collapse is cosmetic only and is never a privacy control

#### 1.18 ProjectionActionSet

Fields:

* `projectionRef`
* `primaryActionRef`
* `blockingSecondaryActionRefs[]`
* `nonBlockingActionRefs[]`
* `pendingDependencyRefs[]`
* `riskDescriptor`
* `awaitedPartyDescriptor`
* `microStateDescriptor`
* `provisionalStateFlag`

Semantics:

* one prioritized action may exist
* multiple simultaneous obligations must remain visible
* the absence of a primary action must not hide blocking secondary actions or pending dependencies

#### 1.19 CompiledPolicyBundle

Fields:

* `bundleId`
* `tenantId`
* `domainPackHashes`
* `dependencyGraphHash`
* `compatibilityState = valid | invalid`
* `simulationEvidenceRef`
* `approvedBy`
* `approvedAt`
* `effectiveAt`
* `canaryScope`
* `rollbackRefs[]`

Semantics:

* is a modular bundle of domain policy packs, not one monolithic indivisible blob
* each domain pack must support independent canary and rollback within declared dependency constraints
* carries an `effectiveAt` boundary that routing, replay, audit, and mutation guards can evaluate explicitly rather than switching policy implicitly mid-flow

#### 1.20 FallbackReviewCase

Fields:

* `fallbackCaseId`
* `lineageScope = envelope | request | episode`
* `envelopeId`
* `requestId`
* `triggerClass = ingest_failure | safety_engine_failure | artifact_quarantine | auth_recovery | degraded_dependency`
* `patientVisibleState = draft_recoverable | submitted_degraded | under_manual_review | recovered | closed`
* `manualOwnerQueue`
* `slaAnchorAt`
* `receiptIssuedAt`
* `createdAt`
* `updatedAt`

Semantics:

* preserves accepted user progress when automated ingest, evidence handling, or safety execution cannot safely complete
* must keep the same lineage, public tracking state, and audit chain rather than spawning an unlinked side ticket
* `auth_recovery` here is limited to degraded grant or access recovery after accepted progress; wrong-patient or binding disputes still require `IdentityRepairCase`
* is a closure blocker until the failure has been recovered, superseded by governed manual action, or explicitly closed under policy

### 2. Required platform services

#### 2.1 LifecycleCoordinator

Responsibilities:

* is the sole logical policy authority for episode closure and governed reopen
* runs as a replicated deterministic state machine partitioned by `episodeId`
* issues and validates `LineageFence.currentEpoch`
* materializes and clears `currentConfirmationGateRefs[]` and `currentClosureBlockerRefs[]` from leases, repair cases, duplicate review, fallback recovery, grants, and degraded external promises
* persists `RequestClosureRecord`
* may set `Request.workflowState = closed` only after successful close evaluation

Logical centralization is mandatory; single-instance operational fragility is forbidden.

#### 2.2 ReservationAuthority

Responsibilities:

* is the sole serializer for any patient-facing or staff-facing claim on `canonicalReservationKey`
* arbitrates local booking, waitlist offers, staff booking, and hub booking
* owns `CapacityReservation` lifecycle
* forbids false exclusivity when only nonexclusive or weak supply evidence exists

#### 2.3 AccessGrantService

Responsibilities:

* issues, redeems, revokes, rotates, and supersedes all patient-access grants
* enforces family-specific subject binding, replay control, and scope narrowing
* blocks grant replay, family drift, and scope widening
* treats `manual_only` as a no-grant routing outcome

#### 2.4 SafetyOrchestrator

Responsibilities:

* classifies inbound evidence and reachability events
* creates `SafetyPreemptionRecord`
* re-runs canonical safety on materially new evidence
* prevents routine continuation until safety or contact-risk resolution is complete
* supports conservative urgent handling before full evidence-readiness completes

#### 2.5 IdentityRepairOrchestrator

Responsibilities:

* opens and advances `IdentityRepairCase`
* freezes access and outward comms where required
* revokes derivative grants
* rebuilds projections and coordinates downstream compensation

#### 2.6 VisibilityPolicyCompiler

Responsibilities:

* compiles per-audience and per-purpose field allow-lists
* rejects projection contracts that rely on collapse-only hiding
* emits testable schemas for hub, servicing site, support, and patient audiences

#### 2.7 AssuranceSupervisor

Responsibilities:

* enforces minimum pre-live control pack
* quarantines bad assurance producers at namespace or producer scope rather than globally blinding observability
* monitors queue lag, lease lag, public-link state, and restore readiness

#### 2.8 ScopedMutationGate

Responsibilities:

* is the sole mutation gateway for patient, staff, support, hub, and operations commands after initial ingest
* resolves acting context, role scope, break-glass state, grant family, and minimum required assurance before writable state is loaded
* enforces expiry, supersession, replay control, rate limits, idempotency keys, and action-to-governing-object binding
* validates `LineageFence.currentEpoch` and command-following freshness before any invariant-changing mutation is dispatched
* routes stale, orphaned, expired, or superseded actions to recovery or re-check rather than mutating state from a stale view

#### 2.9 ExceptionOrchestrator

Responsibilities:

* owns `FallbackReviewCase`, degraded transport and booking exceptions, unresolved confirmation gates, and contact-route repair escalation
* fans failures to the correct owning queue or recovery flow without using generic triage as a catch-all
* ensures unresolved manual, degraded, or disputed states remain visible and closure-blocking until policy explicitly downgrades them

### 3. Non-negotiable invariants

1. One `Episode` represents one clinical episode.
2. One `Request` represents one governed submission lineage inside one `Episode`.
3. Drafts, telephony capture stubs, partial continuation flows, and evidence that is not yet safe to promote must live in `SubmissionEnvelope`, not in `Request`.
4. Authentication, phone verification, SMS continuation redemption, NHS App launch, or support intervention must not directly overwrite `Request.patientRef` or `Episode.patientRef`.
5. `patientRef` may only be established or corrected via governed `IdentityBinding` and, for post-bind corrections, `IdentityRepairCase`.
6. `same_episode_candidate` is never merge-safe by itself.
7. Automatic attach is allowed only for strict idempotent retry or explicitly proven same-request continuation under the attach rules below.
8. Any clinically meaningful new evidence must create a new immutable snapshot and must pass through canonical safety preemption before routine flow continues.
9. Any active `ReachabilityDependency` can convert delivery failure, contact-route change, or preference change into a preemption-triggering event.
10. Telephony and live-call channels must support a conservative urgent path before transcript readiness; urgent callers must not wait for transcript or manual audio review before urgent diversion can begin.
11. No domain-local service may close an episode or request.
12. Only `LifecycleCoordinator` may set `Request.workflowState = closed`.
13. All long-running workflow branches must hold a `RequestLifecycleLease` with TTL, heartbeat, and fencing.
14. All cross-domain invariant-changing commands must present the current `LineageFence.currentEpoch`.
15. No user-facing flow may imply exclusivity unless `CapacityReservation.state = held` and the `CapacityIdentity` is strong enough to support exclusivity.
16. Weak or manual external dispatch or booking modes are degraded modes and must be modeled as such through `ExternalConfirmationGate`.
17. No pharmacy or hub case may auto-close from weakly correlated, email-only, shared-mailbox-only, or manually entered evidence without trusted correlation or governed human reconciliation.
18. Minimum-necessary access must be enforced before projection materialization, not only in presentation.
19. Patient-visible top-level state may be compressed into macro-states only if a secondary descriptor, awaited-party descriptor, and provisional-state flag remain visible when clinically or operationally necessary.
20. One prioritized next action may exist, but simultaneous blocking obligations must remain visible.
21. Unified timelines may exist, but typed subthreads must remain explicit where reply target, expiry, or owner semantics differ.
22. Urgent or decision-blocking deltas must not be silently buffered behind a subtle badge when a user is performing a safety-critical action.
23. Support actions that affect identity, access scope, or secure-link recovery require tiered access, just-in-time scope, and dual control where specified below.
24. No production traffic may be routed through this model until the minimum pre-live control pack in section 14 is active.
25. Every patient, staff, support, hub, or operations mutation after initial ingest must pass through `ScopedMutationGate`; direct mutation from a projection, recovered link, or client-side cache is forbidden.
26. Any unsafe, unreadable, malicious, or unsupported artifact must remain quarantined and may only proceed through `FallbackReviewCase` or an explicit governed recovery path; automatic discard is forbidden.
27. Any accepted user progress that later hits ingest or safety-engine failure must open `FallbackReviewCase`, issue a degraded receipt or recovery state, and surface visible work in the same lineage.
28. `DuplicateCluster(review_required)` must surface as explicit review work and invalidate any auto-attach or auto-merge assumption until resolved.
29. Any wrong-patient or identity-dispute signal must invalidate PHI-bearing transactional entry and attach lineage-level identity-hold metadata through `IdentityRepairCase`; in-place patient overwrite is forbidden.
30. Delivery or contact-route failure on an active `ReachabilityDependency` must rotate stale grants and surface explicit repair state; silent stale assurances are forbidden.
31. No pharmacy dispatch or redispatch may occur without valid unexpired consent bound to the current provider, pathway, and referral scope.
32. Policy-bundle promotion must be staged with effective-at, canary, and rollback control; hidden mid-case rule drift is forbidden.
33. Bad or incompatible event producers must be quarantined with scoped replay; one poisoned stream must not block unrelated projections or assurance slices.
34. Mutations from stale or causally incomplete projections must be blocked or forced through a governed re-check before commit.
35. Expired, superseded, or orphaned transactional links may recover or rebind, but they may never mutate state directly.

### 4. Canonical ingest, pre-submission capture, promotion, and episode formation

#### 4.1 Command ingest and envelope creation

For every inbound command or evidence-bearing message:

1. Resolve idempotency using:

   * source command id
   * transport correlation id
   * prior lineage reference
   * payload hash
   * session or continuation lineage
2. If idempotency resolves to a previously accepted command, return the prior accepted result and stop.
3. Otherwise persist a new immutable `EvidenceSnapshot` before normalization or state advancement.
4. If the inbound data is not yet a governed submit, append the snapshot to `SubmissionEnvelope`.
5. If no `SubmissionEnvelope` exists for the source lineage, create one.
6. A `SubmissionEnvelope` may move through:

   * `draft`
   * `evidence_pending`
   * `ready_to_promote`
   * `promoted`
   * `abandoned`
   * `expired`
7. `Request` must not be created merely because draft or partial evidence exists.

#### 4.2 Immediate urgent-live triage rule for telephony and live channels

Before transcript readiness or full normalization:

1. Evaluate minimal urgent-live signals, including:

   * explicit urgent keypad or menu selection
   * explicit caller declaration of urgent danger
   * staff-observed urgent declaration
   * configured high-confidence red-flag keyword or phrase detection
   * live operational rule requiring conservative urgent handling
2. If an urgent-live signal exists:

   * create `SafetyPreemptionRecord(priority = urgent_live, status = pending)`
   * create or reacquire the urgent diversion or live triage path immediately
   * mark the `SubmissionEnvelope` as `evidence_pending`
   * continue evidence capture and transcript processing in parallel
3. The system must not wait for transcript readiness before it can choose a conservative urgent response.

#### 4.3 Promotion readiness

A `SubmissionEnvelope` may become `ready_to_promote` only when all are true:

* evidence is safety-usable for the channel and pathway
* required submit intent or governed promotion intent exists
* required minimal identity or subject context for the pathway exists
* no unresolved urgent-live decision is still pending

Promotion from `SubmissionEnvelope` to `Request` is a governed action and must be explicit.

#### 4.3A Artifact quarantine and fallback review

1. If any upload, transcript, or inbound evidence is malicious, unreadable, unsupported, or otherwise not safely processable, keep it quarantined and do not promote it into routine flow.
2. If user progress has already been accepted or the platform now owes a response, open `FallbackReviewCase` under the same lineage, anchor SLA timing, and issue degraded receipt or recovery guidance.
3. `FallbackReviewCase` must route to the owning manual queue with the quarantined artifact reference, failure reason, and current visibility limits.
4. Recovery may replace the artifact, mark it unusable while preserving the rest of the lineage, or continue through governed manual confirmation when policy allows.
5. Engine, projection, or dependency failure must never silently discard a governed submission or strand it without patient-visible state.

#### 4.4 Episode relation rules

When a `SubmissionEnvelope` is ready to promote, derive candidate relation:

* `retry`
* `same_episode_candidate`
* `same_episode_confirmed`
* `related_episode`
* `new_episode`

A submission may be treated as `retry` only if all are true:

* same source lineage
* same effective actor or same grant lineage
* same payload semantics
* no intervening divergent decision exists

A submission may be treated as `same_episode_candidate` only if all are true:

* same verified patient or same high-assurance identity candidate
* some continuity evidence exists, such as same draft lineage, same continuation lineage, same call session, or same more-info response thread
* no conclusive evidence yet proves this is a distinct patient intent

A submission may be upgraded from `same_episode_candidate` to `same_episode_confirmed` only if all are true:

* explicit continuity token or explicit workflow continuity exists
* same verified patient or same high-assurance identity candidate
* same concern or episode fingerprint remains semantically aligned
* no separate patient acknowledgement of distinct intent exists
* no conflicting onset, reason, or timing exists
* either no downstream operational branch beyond pre-triage exists, or a human reviewer explicitly confirms continuity

All other suspected matches remain distinct.

#### 4.5 Episode and request creation algorithm

1. If relation = `retry`, acknowledge idempotently and stop.
2. If relation = `new_episode`, create a new `Episode` and a new `Request`.
3. If relation = `related_episode`, create a new `Request`; create a new `Episode` unless policy explicitly keeps the new request inside the existing episode graph as a related branch.
4. If relation = `same_episode_candidate`, create a new `Request` and a `DuplicateCluster`; do not auto-attach.
5. If relation = `same_episode_confirmed`, apply the attach rules:

   * if this is a continuation inside the same open submit lineage and no separate receipt or downstream branch exists, append the new snapshot to the existing `Request`
   * otherwise create a new `Request` inside the same `Episode` and link it as confirmed same-episode related work
6. Only a new `Request` may traverse:

   * `submitted -> intake_normalized`
7. An attached same-request continuation must not recreate `submitted` or `intake_normalized`.

#### 4.6 Pre-submission retention and expiry

1. `SubmissionEnvelope` objects that never promote must expire under their narrower retention rules unless policy upgrades them because the evidence is clinically material or safety-relevant.
2. Expiry of an envelope must not delete any evidence required for urgent handling, audit, or incident investigation.
3. Promotion must create an immutable mapping from `SubmissionEnvelope` to `Request`.

### 5. Identity binding, ownership, claim, and correction algorithm

#### 5.1 Separation of concerns

* authentication establishes subject identity
* matching establishes candidate patient identity
* claiming establishes request ownership
* these are separate steps and must not be collapsed

#### 5.2 Identity state mapping

Map request identity state from `IdentityBinding`:

* `anonymous` = no verified subject and no verified patient
* `partial_match` = verified subject or candidate patient exists, but patient is not safely unique
* `matched` = patient uniquely verified, but ownership not yet established
* `claimed` = patient uniquely verified and request ownership established

#### 5.3 Auto-link rules

Automatic patient linking is allowed only if all are true:

* exactly one candidate patient exists
* the match satisfies configured high-assurance threshold
* subject-to-patient proof exists for the requested sensitivity
* policy explicitly permits auto-link at that assurance level
* no downstream irreversible action has yet occurred unless the bind is already `verified_patient`

If the confidence is high enough for safe progress but not yet high enough for durable external consequences, use `bindingState = provisional_verified`.

A single demographic candidate without step-up challenge is `partial_match`, not `matched`.

#### 5.4 patientRef write control

1. `Request.patientRef` and `Episode.patientRef` are derived from the latest verified `IdentityBinding` and become effectively stable after first `verified_patient` bind.
2. Any post-bind correction requires:

   * `IdentityRepairCase`
   * supervisor approval
   * independent review
   * full audit record
   * immediate revocation of derivative grants
   * quarantine and rebuild of affected projections
   * downstream compensation where needed
3. No ordinary runtime path may silently replace the derived patient binding.

#### 5.5 Claim algorithm

On claim attempt:

1. Resolve request and episode lineage.
2. Resolve live grant or authenticated claim route.
3. Verify the grant is not expired, not redeemed contrary to policy, not revoked, and not superseded.
4. Evaluate `IdentityBinding`.
5. If high-assurance patient binding does not exist, require step-up verification.
6. If the request is already claimed by another subject, deny ordinary claim and route to governed support workflow.
7. If verification succeeds:

   * persist or update `IdentityBinding`
   * establish request ownership
   * set request identity state to `claimed`
   * revoke superseded grants
   * issue replacement grant only if still needed under current policy
   * rebuild projections under the new access scope

#### 5.6 Wrong-patient correction algorithm

If a wrong-patient bind is suspected after a durable bind exists:

1. open `IdentityRepairCase`
2. attach the repair case to `Episode.activeIdentityRepairCaseRef`, add it to `Episode.currentClosureBlockerRefs[]` and each affected `Request.currentClosureBlockerRefs[]`, and mark lineage visibility as identity-held under repair metadata rather than rewriting workflow milestones
3. revoke all live PHI-bearing grants and transactional action grants for the affected episode
4. degrade patient-public, patient-authenticated, hub, servicing-site, and support projections to minimal safe content until correction completes
5. stop any non-essential outbound communications and scheduled reminders
6. enumerate affected downstream branches, including:

   * booking
   * hub coordination
   * pharmacy dispatch
   * callback and message threads
   * support recovery flows
7. mark external branches for compensation or confirmation as needed
8. complete supervisor approval and independent review
9. persist corrected `IdentityBinding`
10. rebuild derived projections and action surfaces
11. reopen or compensate affected downstream branches under the corrected identity
12. only then close `IdentityRepairCase`, clear `Episode.activeIdentityRepairCaseRef`, detach the repair blocker refs, and release the lineage-level identity hold metadata

#### 5.7 Source-of-truth separation

The following sources must remain distinct and must not overwrite each other implicitly:

* submitted contact claims
* external demographic source
* verified route source
* patient communication preference source

### 6. Unified AccessGrant and secure-link rules

#### 6.1 Default grant policy

Unless a stricter rule exists:

* all grants are short-lived
* any grant that can reveal PHI is one-time or strictly rotating
* any PHI-bearing grant is subject-bound or hard-route-bound
* all grant rotations revoke superseded grants immediately
* each grant family must validate against its own action allow-list
* `manual_only` is a routing outcome and must create no redeemable grant

#### 6.2 Grant family semantics

`draft_resume_minimal`

* valid only for `SubmissionEnvelope`
* reveals no patient-linked prior narrative unless identity challenge later succeeds
* is not interchangeable with `public_status_minimal`

`public_status_minimal`

* may expose only receipt confirmation, safe generic status, and generic next-step messaging
* may not expose narrative content, attachments, clinical detail, or patient-linked demographics

`claim_step_up`

* may guide the user into a claim or identity challenge route
* may not expose PHI before subject and assurance checks succeed

`continuation_seeded_verified`

* valid only when the destination route is already verified and bound to the same lineage
* may reveal seeded continuation data only after binding checks pass

`continuation_challenge`

* opens a minimal route with no patient-linked data before challenge success

`transaction_action_minimal`

* must be action-scoped and single-purpose
* valid uses include:

  * respond to more-info
  * accept or decline waitlist offer
  * accept or decline hub alternative offer
  * appointment manage entry
  * pharmacy status or instructions entry
  * callback status or callback response entry
  * clinician message thread entry or reply
  * contact-route repair when a live dependency failed
* entry scopes that can surface PHI-bearing timeline or thread content must still force any higher-assurance step before PHI is revealed
* one transaction action grant must not silently authorize another action family

`support_recovery_minimal`

* may only re-establish previously authorized minimal entry routes
* must never widen scope beyond the immediately prior authorized minimal scope without fresh binding

#### 6.3 Redemption algorithm

On redemption:

1. validate family, action scope, lineage scope, expiry, replay status, supersession status, and subject binding mode
2. deny route resolution on any mismatch
3. reveal only the minimum material allowed for that grant family and action scope
4. if the action requires higher assurance than the link itself provides, force the higher assurance step before revealing PHI or mutating state
5. consume, rotate, or revoke the grant according to its replay policy
6. append immutable audit

#### 6.4 No-family-drift rule

The following are forbidden:

* inventing local grant types outside the canonical family list
* treating `manual_only` as a grant type
* reusing a status grant to perform a transactional action
* widening a minimal recovery grant into a seeded or PHI-bearing grant without fresh binding

#### 6.5 Typed transaction-action routing rule

<!-- Architectural correction: patient self-service commands are typed and domain-owned so booking, callback, messaging, pharmacy, and contact-repair flows do not collapse back into generic triage unless safety or reachability policy explicitly requires it. -->

On any patient-originated command from the authenticated shell or a redeemed `transaction_action_minimal` grant:

1. resolve the command to exactly one `actionScope`
2. bind it to one currently governing object and one lineage
3. reject or recover orphaned, expired, or superseded actions before mutation; do not insert them into the generic triage queue as a fallback
4. route by scope:

   * `respond_more_info` -> active `MoreInfoCycle`
   * `waitlist_offer` -> active `WaitlistOffer`
   * `alternative_offer` -> active `AlternativeOfferSession`
   * `appointment_manage_entry` -> `BookingCase` or `HubCoordinationCase`
   * `pharmacy_status_entry` -> `PharmacyCase`
   * `callback_status_entry` and `callback_response` -> `CallbackCase`
   * `message_thread_entry` and `message_reply` -> `ClinicianMessageThread`
   * `contact_route_repair` -> the affected `ReachabilityDependency` and its owning domain object
5. only when the submitted payload classifies as `potentially_clinical` or `contact_safety_relevant` may the owning service create `SafetyPreemptionRecord` and reacquire triage or urgent handling
6. authenticated portal routes and secure-link routes must use the same typed routing table so the same patient action behaves identically regardless of entry channel

#### 6.6 Scoped mutation gate

All post-submit mutations from patient portal, secure links, staff consoles, hub desks, operations tools, or support tools must traverse `ScopedMutationGate`.

Algorithm:

1. resolve acting context, audience tier, break-glass status, and minimum necessary field scope before loading writable state
2. validate the current `CompiledPolicyBundle`, its effective window, and the route family that initiated the command
3. validate grant family or role scope, `actionScope`, `lineageScope`, expiry, supersession, replay status, and rate or abuse limits
4. resolve exactly one governing object and the current `LineageFence.currentEpoch`
5. if projection freshness or causal token coverage is insufficient for this action, force a command-following re-read or return a recovery response; do not mutate from a stale view
6. attach idempotency key, fence epoch, correlation ID, actor reason code, and policy-bundle reference, then dispatch
7. on orphaned, expired, or superseded actions, rotate or revoke stale grants and render recovery guidance in the same shell or workflow family
8. if the payload classifies as `potentially_clinical` or `contact_safety_relevant`, create immutable snapshot and `SafetyPreemptionRecord` before routine downstream mutation continues

### 7. Universal safety-preemption and reachability-risk algorithm

#### 7.1 Evidence classification

Every inbound evidence item must be classified as:

* `technical_metadata`
* `operationally_material_nonclinical`
* `contact_safety_relevant`
* `potentially_clinical`

Only explicit allow-listed items may be classified as `technical_metadata`, including:

* delivery receipt
* transport acknowledgement
* attachment scan state
* virus scan state
* template render state
* read receipt

`operationally_material_nonclinical` includes items such as:

* non-critical preference change
* non-critical route metadata update
* grant issue or revoke event that does not alter a live contact dependency

`contact_safety_relevant` includes:

* delivery failure where an active `ReachabilityDependency` exists
* contact-route change that invalidates a route required by an active dependency
* preference change that prevents timely execution of an active dependency
* inability to contact during callback, urgent return, or required pharmacy follow-up

All other new evidence defaults to `potentially_clinical`.

#### 7.2 Mandatory preemption rule

For any `potentially_clinical` or `contact_safety_relevant` evidence:

1. persist immutable snapshot
2. create `SafetyPreemptionRecord(status = pending)`
3. recompute latest composite evidence
4. run canonical safety or contact-risk policy
5. block routine continuation until the decision is complete

This rule applies equally to:

* more-info replies
* SMS continuation details
* clinician-message replies
* callback outcomes
* duplicate-merge candidate evidence
* booking notes or booking change narratives
* hub return notes
* pharmacy bounce-backs
* manual structured capture containing clinically meaningful content
* reachability failures on active callback, more-info, waitlist, alternative-offer, pharmacy-contact, or urgent-return dependencies

#### 7.3 Pending preemption behavior

While any `SafetyPreemptionRecord.status = pending`:

* request closure is forbidden
* final routine completion messaging is forbidden
* final downstream completion handoff is forbidden
* automatic queue resumption is forbidden
* routine reassurance that ignores the new evidence is forbidden
* safety-critical commit actions must remain blocked until the delta is acknowledged or resolved

#### 7.4 Safety outcomes

If safety or contact-risk outcome is urgent:

* mark preemption `escalated_urgent`
* preempt routine flow immediately
* reacquire triage ownership or urgent diversion path
* emit an urgent non-bufferable UI delta under section 12

If outcome remains routine:

* mark preemption `cleared_routine`
* resume the appropriate owner path
* reopen triage if policy requires human reassessment
* if the issue was reachability-only, execute the configured requeue, route repair, or dependency-failure policy

### 8. Duplicate detection, clustering, and attach discipline

#### 8.1 Candidate generation

Use:

* verified patient identity or identity candidate
* source lineage
* time window
* request type
* recent activity
* semantic similarity
* continuity token
* continuation lineage
* channel correlation
* episode fingerprint

#### 8.2 Automatic merge and attach rules

Automatic merge is allowed only for strict idempotent retry.

Automatic attach to an existing `Request` is allowed only for `same_episode_confirmed` and only if all are true:

* the evidence is a continuation of the same governed submit lineage or an explicitly linked workflow return
* no separate patient acknowledgement of a distinct contact exists
* no divergent clinician decision exists
* no separate downstream lease or acknowledged handoff exists, unless a human explicitly confirms same-request continuation
* the semantic episode fingerprint remains aligned

If any of those conditions fails, create a separate `Request`. If the episode continuity is real, link it inside the same `Episode` rather than forcing it into the same `Request`.

#### 8.3 Metadata handling

`technical_metadata` may attach without safety rerun.

`operationally_material_nonclinical` may update the same request only when same-request continuity is already proven and the relevant access, communications, or dependency policy is re-evaluated.

The following are never merge-safe metadata by default:

* new narrative text
* new structured answers
* manual notes
* clinically interpretable attachments
* new symptom detail
* new risk detail

#### 8.4 Human review thresholds

* medium-confidence duplicate => create `DuplicateCluster(review_required)` and keep requests separate
* low-confidence duplicate => keep separate and optionally link as related work
* every merge, attach, or same-episode confirmation decision must store actor, reason, evidence, and lineage mapping

#### 8.5 Review-required cluster handling

1. `DuplicateCluster(review_required)` must create explicit review work linked from `TriageTask.duplicateClusterRef` or equivalent queue artifact.
2. While unresolved, it blocks auto-attach, auto-merge, final closure, and any cached decision that assumed one lineage.
3. Patient-visible actions may continue only on the specific governing object they were issued for; cross-lineage shortcuts are invalid.
4. Resolving the cluster must invalidate stale approvals, stale offers, and stale transactional links on every affected request.

### 9. Request and episode lifecycle, concurrency, reopen, and closure algorithm

#### 9.1 Lease acquisition

Every active workflow object must acquire a `RequestLifecycleLease`, including:

* triage task
* more-info cycle
* approval checkpoint
* callback case
* clinician-message thread
* booking case
* hub coordination case
* pharmacy case
* reconciliation case
* exception case
* identity repair case

#### 9.2 Lease heartbeat and stale-owner fencing

1. Every active lease must declare `leaseTtlSeconds`.
2. The owning worker or session must heartbeat before TTL expiry.
3. Every lease mutation must include `fencingToken`.
4. Commands from stale owners must fail.
5. If a lease expires without release:

   * mark it `expired`
   * create operator-visible recovery work
   * allow governed stale-lease break only under audited procedure
6. Closure evaluation must treat `active`, `releasing`, and not-yet-remediated `expired` leases as blockers.

#### 9.3 Lineage fence rule

The following commands must present the current `LineageFence.currentEpoch`:

* close
* reopen
* ownership transfer
* identity correction
* urgent preemption transition
* cross-domain commit that changes episode terminality
* compensation that resolves an external confirmation gate

If the epoch is stale:

* reject the command
* re-read authoritative state
* reevaluate

#### 9.4 Workflow state ownership

1. Domain services may propose milestone changes.
2. Only `LifecycleCoordinator` may make cross-domain closure or governed reopen decisions.
3. `Request.workflowState` is derived under coordinator control.
4. `Episode.state` may become `resolved` only when all related requests and branches satisfy closure policy.

#### 9.5 Required workflow semantics

* `triage_ready` only when triage work is eligible
* `triage_active` while any triage-side lease is active or reacquired
* `handoff_active` while booking, hub, or pharmacy work is active
* `outcome_recorded` when a terminal local outcome exists but global closure is not yet safe
* unresolved confirmation, identity repair, duplicate review, fallback recovery, and reachability repair live in `currentConfirmationGateRefs[]` or `currentClosureBlockerRefs[]`; they do not create extra `Request.workflowState` values
* `closed` only after persisted `RequestClosureRecord` and an empty blocker set

#### 9.6 Closure evaluation algorithm

`LifecycleCoordinator` must evaluate all of the following before closure:

1. no active, releasing, unremediated expired, or broken lifecycle lease remains
2. no pending `SafetyPreemptionRecord` remains
3. no approval or `ExternalConfirmationGate` remains unresolved, except where policy explicitly downgrades it to an operational follow-up that is not required for safe closure
4. no disputed booking, dispatch, or external confirmation state remains
5. no active `IdentityRepairCase`, unresolved `DuplicateCluster(review_required)`, or open `FallbackReviewCase` remains on the lineage
6. no active reachability repair or contact-route dependency remains for any promise still represented as current
7. no active PHI-bearing public, continuation, or transactional grant remains
8. `Request.currentClosureBlockerRefs[]`, `Request.currentConfirmationGateRefs[]`, and their episode-level equivalents are empty after coordinator materialization
9. required `command_following` projections have consumed the required causal token
10. a terminal outcome exists for the request
11. if episode-level closure is being evaluated, all sibling requests and branches satisfy episode closure policy
12. if practice acknowledgement is pending for a hub booking, it blocks closure only when policy marks it as clinically, legally, or operationally required for safe continuity; otherwise it becomes an escalated operational dependency, not a perpetual closure blocker
13. no active consent-pending dependency or degraded confirmation gate remains for any live patient promise still being represented as current

If any check fails:

* persist `RequestClosureRecord(decision = defer)`
* do not close

If all checks succeed:

* persist `RequestClosureRecord(decision = close)`
* set `Request.workflowState = closed`

#### 9.7 Reopen triggers

Any of the following must reacquire triage or equivalent governing ownership and prevent closure:

* materially new evidence
* urgent bounce-back
* pharmacy unable-to-complete
* callback escalation
* wrong-patient correction
* booking dispute or ambiguous confirmation
* hub return requiring reassessment
* contact dependency failure where policy requires reassessment

### 10. Capacity reservation, ranking, waitlist, and hub arbitration algorithm

#### 10.1 Canonical capacity identity

Every schedulable offer must resolve to `CapacityIdentity`.

Reservation serialization must use `canonicalReservationKey`, not a naive universal slot assumption.

#### 10.2 Urgency-first ordering rule

Within any clinically acceptable search space:

1. partition candidates by clinically safe timeliness band
2. rank earliest clinically safe supply before convenience or continuity preferences can reorder across bands
3. allow preference optimization only inside the same medically acceptable band unless policy explicitly states otherwise

Timeliness must not compete directly with convenience once the patient is near the edge of the clinically safe window.

#### 10.3 Reservation authority control

All patient-facing and staff-facing offer creation must go through `ReservationAuthority`.

No other service may create a user-visible exclusivity claim independently.

#### 10.4 Reservation state machine

`none -> soft_selected -> held -> pending_confirmation -> confirmed`

Alternative exits:

* `soft_selected -> released`
* `held -> released`
* `pending_confirmation -> released`
* `pending_confirmation -> disputed`
* any temporary state -> `expired`

#### 10.5 Exclusivity rules

1. Patient-facing exclusivity language is allowed only when:

   * `CapacityReservation.state = held`
   * `CapacityReservation.commitMode = exclusive_hold`
   * `CapacityIdentity.normalizationConfidence = strong`
2. If supplier provides no real hold:

   * use `soft_selected` or `truthful_nonexclusive`
   * do not show fake hold countdown
   * do not imply exclusivity
   * acceptance must revalidate live state immediately

#### 10.6 Waitlist throughput rule when no true hold exists

1. The default must remain truthful.
2. When true hold does not exist, policy may choose one of:

   * single active truthful offer per `canonicalReservationKey`
   * short-window cascading truthful offers
   * carefully bounded multi-offer strategy with explicit nonexclusive wording
3. Any nonexclusive multi-offer policy must:

   * never imply exclusivity
   * declare the offer as subject to live confirmation
   * preserve per-key serialization of actual commit attempts
4. Supply-efficiency optimizations may not fabricate a hold.

#### 10.7 Booking commit algorithm

1. run preflight revalidation against live supplier state and the full original policy envelope without holding exclusive lock longer than needed
2. acquire `ReservationAuthority` lock for `canonicalReservationKey` and mint a `fencingToken`
3. re-check supplier freshness and reservation version under that `fencingToken`
4. if supported, convert to `held`
5. submit booking command with idempotency key and `fencingToken`
6. if success is definitive:

   * create appointment record
   * set reservation `confirmed`
   * release competing soft selections
   * move request toward `outcome_recorded`
7. if response is async or ambiguous:

   * set reservation `pending_confirmation` or `disputed`
   * create `ExternalConfirmationGate`
   * block request closure
   * do not emit final booked assurance text
8. if failure:

   * release reservation
   * return to offers, waitlist, fallback, or failure state according to policy

`ReservationAuthority` lock scope must stay short and fenced. It must not be held across avoidable retries, notification fan-out, or projection work.

#### 10.8 Hub booking and manual degraded mode

Hub-originated or hub-assisted bookings must use the same `ReservationAuthority` or a bridge that serializes on the same `canonicalReservationKey`.

If hub booking uses a manual or weakly assured path:

* set `commitMode = degraded_manual_pending`
* create `ExternalConfirmationGate(assuranceLevel = weak or manual)`
* record structured proof
* do not create final booked assurance text
* do not close until independent authoritative confirmation arrives or a governed exception policy executes

### 11. Pharmacy choice, dispatch, consent, and outcome reconciliation algorithm

#### 11.1 Provider-choice rule with timing guardrails

Patient choice remains real, but pathway-sensitive timing guardrails are mandatory.

1. the full valid provider set may remain visible unless pathway policy explicitly restricts it
2. when time-to-service materially affects safety or expected benefit:

   * elevate sooner-service options
   * show a stronger timing warning
   * allow policy to temporarily suppress clearly unsafe late options
3. the UI must not treat all valid choices as equally time-safe when they are not

#### 11.2 Dispatch-proof and degraded transport rule

Before any outbound dispatch:

* create `PharmacyCorrelationRecord`
* create or update `ExternalConfirmationGate`
* persist all outbound references
* record provider, patient, service type, and transport mode

Transport modes must be classified by assurance:

* strong: structured, trusted, machine-correlatable paths
* moderate: structured but async or partially trusted
* weak: shared mailbox, email-like, or loosely correlated paths
* manual: operator-assisted or manual dispatch

Shared mailbox and manual dispatch are degraded modes. They require:

* shorter confirmation timers
* exception-first monitoring
* explicit independent confirmation deadlines
* no final patient reassurance until the gate is satisfied

#### 11.3 Dispatch algorithm

1. confirm that a provider has been selected
2. if there is no valid consent for this provider, pathway, and referral scope, set `consent_pending` and stop
3. create the canonical package and `PharmacyCorrelationRecord`
4. create dispatch attempt with idempotency key and move the case to `dispatch_pending`
5. transform and send the package through the chosen adapter
6. record provider-facing references on `PharmacyCorrelationRecord`
7. move the case to live referral only when:

   * positive transport acknowledgement exists, or
   * durable policy-defined dispatch proof exists, and
   * the relevant `ExternalConfirmationGate` is satisfied enough for the transport class
8. if proof is absent or ambiguous:

   * remain in `dispatch_pending` or transition the pharmacy case to its local review-pending state
   * create or keep the relevant `ExternalConfirmationGate` attached to the request lineage
   * do not imply live referral completion

#### 11.4 Post-dispatch consent revocation

If consent is revoked after dispatch:

1. create a post-dispatch revocation record
2. attempt downstream cancellation or revocation according to transport mode and provider capability
3. capture whether revocation was acknowledged, attempted but not confirmed, or impossible after handoff
4. update patient and staff projections honestly about what was and was not withdrawn
5. keep the case open or reconciliable until the downstream state is known enough for policy

#### 11.5 Outcome matching and weak-source restrictions

Outcome matching order:

1. exact correlation-chain match
2. otherwise, for candidate lineage `c` and inbound outcome `e`, compute a strong composite match:

   * `m_patient(c,e) in [0,1]` from verified patient identity agreement
   * `m_provider(c,e) in [0,1]` from provider or organisation agreement
   * `m_service(c,e) in [0,1]` from service-type agreement
   * `m_time(c,e) = exp(-abs(minutesBetween(observedAt_e, expectedWindowMidpoint_c)) / tau_match_time)`
   * `m_transport(c,e) in [0,1]` from dispatch, acknowledgement, or transport evidence
   * `sourceFloor_e in [0,1]` from the trusted-source policy class of the inbound evidence
   * `matchScore(c,e) = sourceFloor_e * (omega_patient * m_patient(c,e) + omega_provider * m_provider(c,e) + omega_service * m_service(c,e) + omega_time * m_time(c,e) + omega_transport * m_transport(c,e))`, with `sum omega_* = 1`
3. if no eligible candidate lineage exists, route to reconciliation
4. let `c_star = argmax_c matchScore(c,e)` and let `c_2` be the runner-up candidate lineage, or a null candidate with `matchScore(c_2,e) = 0`
5. auto-apply a terminal outcome only when `matchScore(c_star,e) >= tau_strong_match` and `matchScore(c_star,e) - matchScore(c_2,e) >= delta_match`
6. otherwise route to reconciliation

The strong-match weights and thresholds must come from a versioned reconciliation policy pack; they are not local adapter constants.

If the winning score or separation is below configured strong threshold:

* do not auto-apply terminal outcome
* create reconciliation work

Evidence from:

* email ingest
* shared mailbox ingest
* manual structured capture
* free-text operator entry

may only auto-update the case up to its local review-pending state unless:

* trusted correlation chain exists, and
* policy-defined transport validation passes, and
* a governed human confirms the match

When a human confirms a weak-source correlation:

* the actor who confirms correlation must not be the sole actor who performs terminal closure
* a second control or later coordinator evaluation must still exist

#### 11.6 Auto-close restrictions

Auto-close is allowed only if:

* source is trusted for its transport class
* match confidence meets strong threshold
* no urgent or failed-completion signal exists
* no pending safety preemption exists
* no `ExternalConfirmationGate` remains unresolved

The following must always trigger safety preemption and reopen logic:

* urgent GP action
* unable to complete
* unable to contact
* bounce-back with clinically meaningful content

Absence of message, absence of update record, or timer expiry is never proof of completion.

### 12. Audience-tier projection, communication semantics, and UI-state safety algorithm

#### 12.1 Mandatory audience tiers

At minimum:

* `patient_public`
* `patient_authenticated`
* `origin_practice`
* `hub_desk`
* `servicing_site`
* `support`

#### 12.2 Field-level projection materialization rule

Projection generation must enforce `VisibilityProjectionPolicy` before data is materialized.

Collapsed UI sections do not satisfy minimum-necessary access.

At minimum:

* `hub_desk` may receive only the minimum data needed to coordinate safely, such as operational routing state, timing needs, modality needs, travel or access constraints, safe clinical-routing summary, and coordination history
* `hub_desk` must not receive full narrative, full attachments, or broader clinical content by default
* `servicing_site` may receive only what is required to deliver the booked encounter or manage that site’s capacity
* `support` must default to masked views and must require stronger policy for identity or access-affecting actions

#### 12.3 Patient-visible state contract

Patient-visible state must include all of:

* one macro-state
* one `microStateDescriptor`
* one `awaitedPartyDescriptor`
* one `riskDescriptor` where timing, urgency, or provisionality materially matters
* one `provisionalStateFlag` whenever final external confirmation is not yet present

Macro-state compression is allowed only if these secondary descriptors remain visible where needed.

#### 12.4 Action hierarchy rule

Patient and staff projections must emit `ProjectionActionSet`.

Rules:

1. one prioritized `primaryActionRef` may exist
2. any blocking secondary obligations must remain visible
3. pending dependencies must remain visible
4. the absence of a visible primary action must not imply there is nothing important outstanding

#### 12.5 Unified timeline with typed subthreads

A unified request-level timeline may exist, but each communication item must retain typed semantics, including at minimum:

* `information`
* `more_info_request`
* `callback`
* `instruction`
* `transactional_offer`
* `patient_reply`
* `outcome_notice`

Each typed item must retain:

* reply target
* owner
* expiry or TTL if relevant
* whether replying is still valid
* which workflow branch it affects

A generic chat metaphor must not erase typed workflow semantics.

#### 12.6 Urgent and decision-blocking delta rule

The following deltas are non-bufferable:

* urgent safety escalation
* new evidence that invalidates the action currently being confirmed
* wrong-patient correction hold
* booking or dispatch dispute that invalidates the current assurance
* active dependency failure that changes who the system is waiting on

If such a delta arrives while a user is editing or confirming a safety-critical action:

* interrupt with a bounded, explicit alert
* preserve context
* block the affected commit until the delta is acknowledged or reconciled

#### 12.7 Causal read rule

Commands that change any of the following must return a causal token:

* ownership or claim
* booking confirmation or release
* pharmacy outcome
* closure
* patient-binding correction
* access freeze or identity hold
* transactional offer acceptance or expiry

Any `command_following` read must:

* wait until the projection consumes the causal token, or
* return a command-side confirmation view instead of a stale projection

### 13. Support governance, derived artifact control, and retention freezing

#### 13.1 Support governance

Support actions must be tiered:

* `support_view_only`
* `support_recovery_ops`
* `support_identity_access_admin`

Rules:

1. masked views must be default
2. just-in-time scope is required for any patient-specific recovery action
3. secure-link reissue, identity correction escalation, or access-affecting action must be reason-coded
4. identity-affecting or access-widening actions require dual control under policy
5. support must not directly mutate patient binding outside `IdentityRepairCase`

#### 13.2 Derived artifact minimization

For audio, transcript, concept extraction, and similar derived artifacts:

* the source artifact remains authoritative
* derived artifacts must reference the source lineage
* non-essential derived artifacts must have shorter retention and stricter access than or equal to source
* access policy for derivatives must never be weaker than for the source
* derivative persistence must be minimized to what is operationally required

#### 13.3 Conservative retention freeze for high-risk episodes

If an episode is disputed, safety-significant, identity-repaired, security-relevant, or externally contested:

1. freeze a full case bundle before ordinary dependency-graph deletion rules run
2. include source evidence, derived evidence needed for interpretation, communications, decisions, projections, and external handoff references
3. do not rely solely on pre-modeled dependency graphs when preserving forensic evidence

### 14. Assurance, resilience, and configuration promotion algorithm

#### 14.1 Minimum pre-live control pack

Before any production or pilot traffic is allowed, all of the following must exist and be tested:

* restore-tested backups for canonical stores
* queue lag and lease lag observability
* producer and consumer health alarms
* public-link kill switch and revocation audit
* break-glass review workflow
* support action governance
* stale-lease scavenger and recovery procedure
* external confirmation gate monitoring
* incident response workflow
* degraded-mode runbooks for booking, hub, and pharmacy paths

These are go-live prerequisites, not later hardening.

#### 14.2 Assurance ingestion fail-closed isolation rule

If assurance ingestion sees unknown namespace, incompatible schema, or untrusted producer behavior:

* quarantine the affected producer or namespace
* preserve ingestion for unaffected producers
* raise immediate operator alarms
* mark the affected assurance slice untrusted

Fail-closed must stop trust in the affected slice, not necessarily blind all assurance and monitoring.

#### 14.3 Modular bundle compilation

Before production promotion, compile one `CompiledPolicyBundle` composed of domain packs, including at minimum:

* routing pack
* SLA and ETA pack
* identity and access-grant pack
* duplicate and continuity pack
* visibility and audience pack
* waitlist and booking pack
* hub coordination pack
* callback and messaging pack
* pharmacy pack
* provider capability pack
* tenant override pack

Each pack must have an independent hash, compatibility contract, canary scope, and rollback path.

#### 14.4 Mandatory bundle validation

Compilation must fail if the effective bundle would allow any of the following:

* PHI exposure through a public, superseded, or mismatched grant family
* automatic patient binding below required assurance
* automatic attach from `same_episode_candidate`
* closure with active lease, pending preemption, unresolved external confirmation, or unresolved identity repair
* exclusive slot language without true `held` reservation on a strong `CapacityIdentity`
* pharmacy or hub final assurance from degraded manual or weak evidence
* any clinically meaningful inbound evidence path that bypasses safety preemption
* audience-tier projection containing fields outside the allow-list
* support tier capable of direct identity overwrite
* global assurance blackout caused by one bad producer

#### 14.5 Promotion gate

Production promotion is allowed only after:

* successful compile
* reference-case simulation
* immutable audit of approved bundle hash and domain pack hashes
* explicit authorization by approved actor
* canary strategy exists for high-risk packs
* rollback path exists for each promoted pack
* each promoted bundle or pack carries an `effectiveAt` boundary that is visible to routing, replay, and audit
* in-flight irreversible commands pin or re-check the applicable bundle instead of silently switching policy mid-commit

### 15. Downstream conformance requirements

Any downstream document or implementation that references this canonical segment must conform to all of the following:

1. Any design that stores drafts as `Request(workflowState = draft)` must be replaced with `SubmissionEnvelope.state = draft`.
2. Any flow that treats `manual_only` as an `AccessGrant` type must be replaced so that `manual_only` is only a routing disposition and issues no redeemable grant.
3. Any flow that auto-attaches on `same_episode_candidate` must be replaced so that `same_episode_candidate` is clustering only; attach requires `same_episode_confirmed` and the attach rules in section 8.
4. Any hub, servicing-site, or support view that relies on collapsed UI as the privacy boundary must be replaced with field-level projection allow-lists.
5. Any patient or staff view that shows only “one clear next action” must be replaced with `ProjectionActionSet`, which supports one primary action plus visible blocking secondary actions and dependencies.
6. Any unified communication thread must preserve typed subthreads and reply semantics.
7. Any buffering logic must implement the non-bufferable urgent and decision-blocking delta rule.
8. Any waitlist logic that uses nonexclusive supply may optimize throughput only through truthful nonexclusive policies and never through fake hold language.
9. Any manual hub booking or weak pharmacy transport path must use `ExternalConfirmationGate` and may not emit final assurance text before authoritative confirmation.
10. Any live rollout plan must satisfy the minimum pre-live control pack in section 14.

## Canonical real-time interaction, motion, and live-projection experience algorithm

### 0. Purpose

This segment defines the mandatory UI and interaction algorithm for all patient, staff, hub, pharmacy, support, operations, and embedded surfaces.

It codifies the **Signal Atlas Live** interaction model. Vecells must behave as a continuous case system with stable object identity, local asynchronous acknowledgement, calm real-time projection updates, and explicit trust signaling rather than as a set of detached pages, CRUD detail views, or generic enterprise dashboards.

This revision adds the **Quiet Clarity** overlay: keep continuity, safety, and trust cues intact while reducing simultaneous surface count, duplicated status chrome, and unnecessary visual escalation.

The platform-wide continuity law is:

**same object, same shell**

The low-noise operating law is:

**one screen, one question, one dominant action, one promoted support region**

Every major surface must default to a single focal task region. History, evidence, context, and assistive surfaces may remain available, but only one of them may be promoted automatically at a time unless a true blocker, compare task, or explicit user pin justifies more.

If the user is still working the same canonical request, booking case, hub case, pharmacy case, callback case, support investigation, or tightly related lineage object, the shell must remain stable while child states morph in place.

The experience must be:

* state-driven
* projection-backed
* real-time where safe
* locally acknowledged before remotely settled
* shell-stable across adjacent child states
* selected-anchor-preserving across validation, pending, settlement, invalidation, and failure
* explicit about freshness, trust, causality, ownership, and next action
* quiet by default with progressive disclosure
* list-first with visualization on demand
* soft-transitioned between adjacent lifecycle states
* calm under asynchronous change
* keyboard-first and accessibility-safe
* verifiable in browser automation without brittle selectors
* free of disruptive full-page reloads except at true shell, security, permission, or schema-divergence boundaries

Any local rule that implies hard navigation, contradictory status presentation, silent freshness loss, focus theft, selected-object disappearance, spinner-led waiting for an already-known entity, or multiple competing primary signals in the same viewport is invalid unless it matches an explicit exception in this segment.

### 0.1 Compatibility bridge

This segment upgrades the visual and interaction model while preserving downstream terminology compatibility.

Compatibility aliases:

* `AnchorCard` maps to `CasePulse`
* `LiveTimeline` maps to `StateBraid`
* `ActionDock` maps to `DecisionDock`
* `AmbientStateRibbon` and `FreshnessChip` render as one shared status strip in quiet mode
* `ContextConstellation` may render as a closed or peeked context drawer in quiet mode

Any existing phase or screen contract that still uses the compatibility names inherits the semantics defined here.

### 0.2 Continuity key and shell law

Define `entityContinuityKey = audienceTier + canonicalEntityRef + lineageScope`.

Where:

* `canonicalEntityRef` is the stable object the user is meaningfully working
* `lineageScope` is the minimal downstream scope that may share one shell without confusing object identity

Rules:

1. If the incoming surface resolves to the same `entityContinuityKey`, reuse the existing `PersistentShell`.
2. If only child view, access scope, sub-task, or downstream phase changes within the same `entityContinuityKey`, morph the child surface in place.
3. When the same continuity key remains active, preserve `CasePulse`, the shared status strip, `DecisionDock`, `StateBraid`, open side stages where still valid, scroll where safe, focus where safe, and any active `SelectedAnchor`.
4. Only replace the shell when one of the allowed hard-boundary conditions in this segment is met.
5. Route changes within the same `entityContinuityKey` must never imply loss of object identity or blank-page reset.
6. Access expansion after claim, sign-in, verification, or embedded deep-link validation must reveal newly authorized detail progressively inside the same shell whenever the continuity key is unchanged.
7. A continuity-preserving transition must also preserve the current disclosure posture unless a blocker, conflict, or explicit user action requires more detail.
8. When a temporary blocker, conflict, or compare posture resolves, restore the prior quiet posture unless the user explicitly pinned a richer layout.

### 1. Required experience topology and primitives

#### 1.1 PersistentShell

Fields:

* `shellId`
* `shellType = patient | staff | hub | pharmacy | support | operations | embedded`
* `audienceTier`
* `entityContinuityKey`
* `layoutTopology = focus_frame | two_plane | three_plane | mission_stack | embedded_strip`
* `clarityMode = essential | expanded | diagnostic`
* `attentionBudgetRef`
* `activeEntityRef`
* `activeChildView`
* `childSurfaceRef`
* `promotedSupportRegionRef`
* `suppressedRegionRefs[]`
* `signalRailState`
* `caseSpineState`
* `contextConstellationState = closed | peek | open | pinned`
* `pinnedContextRefs[]`
* `selectedAnchorRefs[]`
* `preservedPanels`
* `lastQuietPostureRef`
* `preservedScrollOffsets`
* `preservedFocusRef`
* `liveMode = live | buffered | paused`
* `liveProtectionMode = normal | buffered | composition_protected`
* `freshnessSummary`
* `shellHydrationState = partial | hydrated | degraded`
* `reducedMotionEnabled`

Semantics:

* is the durable visual container for a single active entity or tightly related lineage cluster

* must survive adjacent state changes of the same continuity key

* must preserve context across soft route changes

* must render the canonical Vecells layout topology:

  * patient and lightweight flows default to `focus_frame`
  * staff, hub, support, and operations flows default to `two_plane`
  * `three_plane` is reserved for comparison-heavy, blocker-heavy, or explicitly pinned context states
  * mobile and narrow tablet default to `mission_stack`
  * embedded surfaces may use `embedded_strip`

* must start in `clarityMode = essential` unless a blocker, conflict, or diagnostic task requires more detail

* must carry the active `AttentionBudget` for the shell and respect its surface-promotion limits

* in `clarityMode = essential`, must promote at most one support region in addition to the primary work surface unless a true blocker, compare mode, or explicit user pin justifies more

* must preserve active command context, open side stage, and pinned comparison context where still valid

* must preserve any active `SelectedAnchor` unless an explicit release rule is met

* must restore the last user-approved quiet posture after a temporary blocker, conflict, or compare promotion ends unless the user explicitly pinned a richer layout

#### 1.1A AttentionBudget

Fields:

* `budgetId`
* `entityContinuityKey`
* `clarityMode`
* `dominantQuestionRef`
* `dominantActionRef`
* `promotedSupportRegionRef = none | state_braid | evidence_prism | context_constellation | inline_side_stage`
* `maxPromotedRegions = 0 | 1 | 2`
* `allowedPlaneCount = 1 | 2 | 3`
* `promotionReason = none | blocker | conflict | reopen | compare | explicit_user_request | urgent`
* `promotionLockReason = none | composing | comparing | confirming | reading_delta`
* `suppressionWindowMs`
* `promotionCooldownMs`
* `lastPromotionAt`
* `suppressedSignalRefs[]`
* `returnToQuietPolicy = on_resolve | on_commit | manual_only`

Semantics:

* is the explicit cognitive contract emitted by `CognitiveLoadGovernor`
* constrains simultaneous promoted surfaces, status cues, and plane count for the current shell
* must default patient and routine staff work to `maxPromotedRegions <= 1`
* must allow `allowedPlaneCount = 3` only for blocker-heavy, compare-heavy, pinned, or diagnostic work
* must prefer demotion to summary stubs before introducing new banners, rails, or panels
* must freeze auto-promotion while the user is composing, comparing, confirming, or reading a materially changed delta unless blocker severity increases
* must rate-limit repeated shell-level cue promotion and demotion so the interface does not thrash under live change
* when a temporary promotion resolves, must restore the last quiet posture unless the user pinned a richer view

#### 1.2 CasePulse

Fields:

* `entityRef`
* `entityType`
* `macroState`
* `stateAxes.lifecycle`
* `stateAxes.ownership`
* `stateAxes.trust`
* `stateAxes.urgency`
* `stateAxes.interaction`
* `headline`
* `subheadline`
* `primaryNextActionRef`
* `statusTone`
* `freshnessState`
* `ownershipOrActorSummary`
* `urgencyBand`
* `confirmationPosture`
* `slaArc`
* `lastMeaningfulUpdateAt`
* `changedSinceSeen`
* `secondaryMetaState = collapsed | expanded`
* `pendingTransitionRefs[]`

Semantics:

* is the stable identity surface for the active object
* is the compact truth layer for the case
* must remain visually present while child states change
* must expose one shared `macroState` plus the five secondary `stateAxes`
* must foreground headline, macro state, and next best action cue before any secondary metadata
* must be shared across adjacent views of the same request, booking, hub case, pharmacy case, callback case, or support investigation
* must never contradict the authoritative patient-safe or staff-precise state mapping supplied by `MacroStateMapper`

#### 1.3 StateBraid

Fields:

* `timelineId`
* `entityRef`
* `audienceTier`
* `businessStateEventRefs[]`
* `communicationEventRefs[]`
* `externalConfirmationEventRefs[]`
* `exceptionRecoveryEventRefs[]`
* `reviewRequiredRefs[]`
* `returnEventRefs[]`
* `unseenEventRefs[]`
* `highlightedDeltaRefs[]`
* `currentTaskRef`
* `defaultWindow = latest_relevant | full_history`
* `collapsedEventCount`
* `liveInsertMode = immediate | buffered`
* `resumeMode = normal | diff_first`

Semantics:

* is the continuity spine for state change, communication, external confirmation, recovery, and re-check requirements
* replaces simplistic single-lane activity feeds
* must update in place
* must support changed-since-seen cues
* must preserve chronology while making causality legible
* must default to the latest relevant events in `clarityMode = essential`
* must support diff-first emphasis on reopen, return, and materially changed review flows

#### 1.4 EvidencePrism

Fields:

* `prismId`
* `entityRef`
* `factRefs[]`
* `inferredRefs[]`
* `thirdPartyConfirmationRefs[]`
* `ambiguousRefs[]`
* `staleRefs[]`
* `conflictRefs[]`
* `reviewRequiredReasonRefs[]`
* `sourceOpenState`
* `freshnessState`
* `defaultDensity = summary | expanded`
* `autoExpandReason = none | conflict | stale | blocker | requested`
* `reviewVersion`
* `lastAcknowledgedSnapshotRef`
* `diffFirstTargetRef`

Semantics:

* is the canonical evidence surface
* must distinguish user-entered facts, system-derived inference, third-party confirmation, ambiguous evidence, stale evidence, and conflicting evidence
* must support inline source inspection without leaving the current task
* must support diff-first rendering against the last acknowledged evidence snapshot
* must default to a summary posture in `clarityMode = essential`
* must auto-expand only when conflict, staleness, a blocking review requirement, or explicit user intent makes more detail necessary
* must remain explicit when new evidence invalidates an in-progress decision

#### 1.5 DecisionDock

Fields:

* `dockId`
* `entityRef`
* `location = bottom | side`
* `primaryActionRef`
* `secondaryActionRefs[]`
* `secondaryActionMode = inline | overflow`
* `recommendationReasonRef`
* `confidenceLevel`
* `consequencePreviewRef`
* `transitionEnvelopeRef`
* `anchorPersistenceRef`
* `stateStability = stable | pending | blocked | invalidated | reconciled`
* `blockingReason`
* `isSticky`

Semantics:

* is the single bounded action zone for the current moment
* must remain stable during live updates
* must expose asynchronous progress without moving the user to a different page
* must surface the dominant next action while keeping secondary actions subordinate or overflowed
* must show consequence and confidence before irreversible or externally consequential action
* must explain why an action is blocked, stale, invalidated, or awaiting re-check

#### 1.6 AmbientStateRibbon

Fields:

* `ribbonId`
* `entityRef`
* `saveState = idle | saving | saved | failed`
* `syncState = fresh | updating | stale | disconnected | paused`
* `pendingExternalState = none | awaiting_confirmation | awaiting_reply | awaiting_ack`
* `bufferState = none | queued_updates | review_required`
* `localAckState = none | acknowledged | pending | reconciled | failed`
* `attentionTone = quiet | caution | urgent`
* `renderMode = integrated_status_strip | promoted_banner`
* `message`
* `lastChangedAt`

Semantics:

* provides lightweight always-available feedback for save, sync, freshness, pending external work, and buffered live updates
* must replace silent waiting
* must visually merge with `FreshnessChip` into one shared status strip on routine surfaces
* must not dominate the viewport unless an urgent action or blocking trust state exists
* must communicate live buffering and re-check requirements without breaking shell continuity

#### 1.7 FreshnessChip

Fields:

* `chipId`
* `projectionRef`
* `consistencyClass = informational_eventual | operational_guarded | command_following`
* `freshnessState = fresh | updating | stale | disconnected | paused`
* `renderMode = integrated_status_strip | standalone`
* `freshnessAgeMs`
* `requiredForCurrentAction`
* `degradeReason`
* `lastProjectionVersion`
* `lastCausalTokenApplied`

Semantics:

* declares how trustworthy the visible data currently is
* must be available on all projection-backed detail, list, board, and spatial-comparison surfaces
* must render inside the shared status strip in `clarityMode = essential`
* may promote to standalone only when freshness is directly decision-blocking or when dense operational boards need per-surface trust signaling
* must be visible at shell level when freshness loss affects safe action
* must make freshness loss explicit before any unsafe follow-up action is allowed

#### 1.8 ProjectionSubscription

Fields:

* `subscriptionId`
* `projectionRef`
* `entityScope`
* `entityContinuityKey`
* `audienceTier`
* `consistencyClass`
* `applyMode = live_patch | batch_when_idle | manual_apply`
* `pauseReason`
* `lastEventCursor`
* `lastVersion`
* `lastCausalToken`
* `bufferedDeltaCount`
* `impactProfilePolicyRef`
* `deltaPolicyRef`

Semantics:

* is the real-time data-binding contract between UI state and projection state
* must support in-place patching, buffering, manual apply, and pause-live behavior
* must preserve continuity while still surfacing trust-impacting changes quickly

#### 1.9 TransitionEnvelope

Fields:

* `transitionId`
* `entityRef`
* `commandRef`
* `affectedAnchorRef`
* `originState`
* `targetIntent`
* `ackState = queued | local_ack | optimistic_applied | server_accepted | awaiting_external | projection_seen | review_required | settled | reverted | failed | expired`
* `causalToken`
* `settlementPolicy = projection_token | external_ack | manual_review`
* `userVisibleMessage`
* `visibleScope = local_component | active_card | active_shell`
* `startedAt`
* `updatedAt`
* `failureReason`
* `recoveryActionRef`
* `invalidateOnConflict`

Semantics:

* is the required bridge state for every asynchronous command or meaningful user action
* prevents dead spinners and page resets
* makes async progress explicit and local to the affected object
* must persist until authoritative settlement, explicit failure, or governed expiry
* must be able to enter `review_required` when optimistic assumptions are invalidated by later evidence or projection truth

#### 1.10 DeferredUIDelta

Fields:

* `deltaId`
* `entityRef`
* `projectionRef`
* `targetRegionRef`
* `deltaClass = non_disruptive | contextual | disruptive`
* `reasonBuffered`
* `summaryMessage`
* `invalidatesCurrentAction`
* `announcementPriority = silent | polite | assertive`
* `bufferedAt`
* `applyWhen = immediate | idle | explicit_user_apply | after_edit_commit`

Semantics:

* holds live updates that would otherwise steal focus or destabilize the layout
* must be used when the user is typing, reading deeply, comparing options, composing a reply, or working a focused case
* must communicate when buffered deltas materially change the safety or validity of the current decision

#### 1.11 QueueChangeBatch

Fields:

* `batchId`
* `queueRef`
* `insertedRefs[]`
* `updatedRefs[]`
* `priorityShiftRefs[]`
* `applyPolicy = idle_only | explicit_apply | immediate_if_safe`
* `focusProtectedRef`
* `summaryMessage`
* `batchState = available | applied | dismissed`
* `createdAt`

Semantics:

* is the only allowed mechanism for introducing disruptive live queue changes while a queue is in active use
* protects staff cognition and focus
* must preserve the currently pinned row or card while exposing queued changes in a reviewable way

#### 1.12 QueueLens

Fields:

* `lensId`
* `queueRef`
* `focusedItemRef`
* `densityHorizonRef`
* `priorityLayers[]`
* `ownershipGhostRefs[]`
* `changedSinceSeenRefs[]`
* `burstIndicatorState`
* `bulkActionRailState`
* `queuedUpdateBadgeState`
* `liveGuardState = live | buffered | paused`
* `viewMode = list | board | compact`

Semantics:

* is the canonical worklist surface for staff-facing operational work
* is not a passive table
* must support scan, compare, inline inspect, inline act, bulk act, and pivot to the active case without losing the working set
* must keep the focused item visually pinned while open

#### 1.13 InlineSideStage

Fields:

* `stageId`
* `hostSurfaceRef`
* `subjectRef`
* `subjectContinuityKey`
* `openState`
* `comparisonSubjectRefs[]`
* `returnFocusRef`
* `preservedDraftRef`
* `widthMode = narrow | standard | wide`

Semantics:

* is the bounded inline expansion surface for inspecting a related object, comparison target, or compose action
* replaces most modal stacks and detached detail pages
* must preserve the working set and restore focus on close
* must inherit continuity semantics when inspecting tightly related child objects

#### 1.14 ConversationThreadProjection

Fields:

* `threadId`
* `requestRef`
* `audienceTier`
* `messageRefs[]`
* `callbackRefs[]`
* `moreInfoRefs[]`
* `instructionRefs[]`
* `intentGroupRefs[]`
* `pendingReplyRefs[]`
* `reviewMarkerRefs[]`
* `lastSeenCursor`
* `currentActionRef`
* `replyCapabilityState`
* `surfaceMode = unified_request_thread`

Semantics:

* unifies messages, follow-up questions, callback expectations, and actionable instructions into one request-centered communication surface
* must prevent siloed communication experiences
* must support live insertion, reply pending states, changed-since-seen cues, and smooth return-to-review transitions

#### 1.15 ConsequencePreview

Fields:

* `previewId`
* `actionRef`
* `entityRef`
* `immediateEffects[]`
* `downstreamEffects[]`
* `blockingConditions[]`
* `fallbackActionRefs[]`
* `projectedMacroState`
* `projectedStateAxes`
* `requiresExplicitConfirm`

Semantics:

* is the required disclosure surface for irreversible, externally consequential, or high-risk actions
* must appear before commit for actions that can change downstream ownership, patient-visible status, capacity, messaging, or pharmacy/network execution
* must clarify what state language and trust posture will change after commit

#### 1.16 MotionIntentToken

Fields:

* `intent = reveal | morph | commit | pending | escalate | diff | reopen | degrade | handoff`
* `timingBand = instant | standard | deliberate | urgent`
* `sourceOriginRef`
* `amplitude = silent | low | medium | urgent`
* `movementProfile`
* `interruptionPolicy`
* `motionBudgetMs`
* `settleHint`
* `reducedMotionFallback`

Semantics:

* encodes motion meaning
* motion must represent state change, not decoration
* motion must originate from the changed object, command source, or selected anchor rather than from a generic page container
* motion budgets must remain subordinate to responsiveness and comprehension

#### 1.17 SelectedAnchor

Fields:

* `anchorId`
* `entityRef`
* `anchorType = slot | provider | pharmacy | queue_row | message | evidence_cluster | comparison_candidate | action_card`
* `hostSurfaceRef`
* `stabilityState = stable | validating | pending | invalidated | replaced`
* `fallbackAlternativesRef[]`
* `preserveUntil = settle | explicit_dismiss | entity_switch`
* `lastKnownLabel`
* `lastKnownPositionRef`

Semantics:

* is the visual object-permanence contract for the user’s current selection or focus anchor
* selected objects must not disappear during async work or remote revalidation
* invalidated anchors must remain visible long enough to preserve causality and explain the change
* must be used for selected slot, chosen provider, selected pharmacy, focused queue row, compare target, or any equivalently important user choice

### 2. Required frontend services

#### 2.1 LiveProjectionBridge

Responsibilities:

* subscribe to scoped projections
* apply in-place patches
* buffer disruptive deltas
* expose freshness state
* reconcile optimistic UI and server-confirmed state

#### 2.2 TransitionCoordinator

Responsibilities:

* create and advance `TransitionEnvelope`
* control soft route changes
* preserve shell, case pulse, state braid, decision dock, and selected anchors
* decide when a transition settles, reverts, expires, or remains pending
* convert conflicting projection truth into `review_required` rather than silent overwrite

#### 2.3 MotionSemanticRegistry

Responsibilities:

* map `MotionIntentToken` to actual motion rules
* enforce consistent motion meaning across patient and staff surfaces
* enforce reduced-motion fallbacks
* ensure motion originates from the changed object or initiating control

#### 2.4 FreshnessSupervisor

Responsibilities:

* classify projections as fresh, updating, stale, disconnected, or paused
* block unsafe destructive actions when required freshness is not met
* surface freshness at component and shell level

#### 2.5 MacroStateMapper

Responsibilities:

* translate internal workflow states into canonical audience-facing macro states
* ensure request, booking, hub, pharmacy, callback, and communication surfaces never contradict each other at top level
* provide patient-safe and staff-precise state language without divergence of underlying truth

#### 2.6 FocusIntegrityGuard

Responsibilities:

* enforce pinned focus law
* prevent live updates from moving the active case, active row, active slot, or active draft unexpectedly
* preserve cursor, selection, and scroll position where safe

#### 2.7 EvidenceLineageResolver

Responsibilities:

* classify evidence into fact, inference, third-party confirmation, ambiguous, stale, and conflicting layers
* compute diff against the last acknowledged review snapshot
* attach source lineage and freshness to each evidence cluster

#### 2.8 InteractionContractRegistry

Responsibilities:

* guarantee stable semantic roles and accessible names for critical controls and regions
* ensure custom components remain keyboard-operable and automation-verifiable
* expose explicit success, warning, locked, stale, failed, invalidated, and reconciled DOM states

#### 2.9 ContinuityOrchestrator

Responsibilities:

* derive `entityContinuityKey`
* decide shell reuse versus shell replacement
* prevent same-entity reloads and same-entity shell churn
* coordinate child-surface morphs, access-expansion reveals, and return-to-context behavior

#### 2.10 SelectedAnchorPreserver

Responsibilities:

* create, update, and release `SelectedAnchor`
* keep selected row, card, provider, or slot visible through validation, pending, settlement, and failure
* represent invalidation without disappearance
* surface nearest safe alternatives without losing causality

#### 2.11 LiveAnnouncementGovernor

Responsibilities:

* bound live region noise
* turn batched updates into concise, prioritized announcements
* escalate only blocking, urgent, or review-required changes
* prevent repetitive announcements for routine autosave, trivial freshness refreshes, or low-risk list churn

#### 2.12 ResponsivenessLedger

Responsibilities:

* emit continuity, acknowledgement, settle, focus-loss, and anchor-preservation telemetry
* detect same-entity reload regressions
* support automation assertions for local acknowledgement, projection settlement, and focus integrity
* measure perceived responsiveness as speed of stable feedback and comprehension, not only page load time

#### 2.13 CognitiveLoadGovernor

Responsibilities:

* derive and update `AttentionBudget`
* set `PersistentShell.clarityMode`
* choose the single auto-promoted support region for the current task
* cap simultaneously promoted support regions and other expanded secondary surfaces
* collapse secondary context, history, and explanation by default
* auto-promote only the specific hidden region required by a blocker, conflict, reopen delta, compare task, or explicit user request
* restore the last quiet posture once a temporary promotion resolves unless the user pinned richer context
* prevent duplicated status presentation across header, banner, chip, toast, and side rail
* apply promotion hysteresis so live deltas cannot repeatedly switch the promoted support region during active decision moments
* keep non-blocking pending, stale, and acknowledgement states inline or in the shared status strip unless a new user decision is required

### 3. Non-negotiable invariants

1. The same `entityContinuityKey` must reuse the same `PersistentShell`.
2. Adjacent lifecycle states of the same entity must render within the same `PersistentShell`.
3. Any route transition within the same continuity key must use soft navigation and preserve shell context.
4. Patient and lightweight shells must default to `focus_frame`; staff, hub, support, and operations shells must default to `two_plane`; `three_plane` is allowed only when comparison, blockers, or explicit pinning justify the extra noise; mobile and narrow-tablet shells must default to `mission_stack`; only true embedded surfaces may use `embedded_strip`.
5. Every major entity surface must include a `CasePulse`, one shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`, and a single current `DecisionDock`.
6. Every major entity surface must expose one shared `macroState` plus the five `stateAxes`.
7. `StateBraid` and `EvidencePrism` must exist where history or trust matter, but they may open as summary stubs or collapsed panels until the user requests more detail or a blocker, conflict, or reopen flow requires it.
8. At most one dominant primary action and one expanded support region may compete for attention within the same viewport.
   * `AttentionBudget` must be computed for every major entity surface.
   * In `clarityMode = essential`, only `CasePulse`, one shared status strip, one primary work region, and one `DecisionDock` may remain at full prominence by default.
   * `StateBraid`, `EvidencePrism`, `ContextConstellation`, and assistive surfaces must stay collapsed, summary-level, or closed unless explicitly promoted or needed for safe action.
   * When a temporary promotion resolves, the shell must return to the last quiet posture unless the user pinned a richer view.
9. Every anchor-bearing selection or focus-critical choice must create or update a `SelectedAnchor`.
10. Selected anchors must remain visible through validation, pending, settlement, invalidation, and failure unless the user dismisses them or a true entity switch occurs.
11. Projection-backed state changes must patch in place; they must not trigger full-page reloads.
12. A full-screen loading state is forbidden once the active entity is known and at least one viable projection snapshot exists.
13. Every asynchronous action must create a `TransitionEnvelope`.
14. Every irreversible, externally consequential, or high-risk action must render a `ConsequencePreview` before commit.
15. Live updates must not steal focus, reset scroll, collapse open context, or discard partially entered user input.
16. Selected staff work items must remain visually pinned while the user is actively working them.
17. Patient-visible statuses across request, booking, hub, pharmacy, callback, and messaging views must derive from one shared `MacroStateMapper`.
18. Messages, follow-up questions, callback expectations, and actionable patient communications for a request must be unified inside one `ConversationThreadProjection`.
19. Waiting and in-review states must remain living shells with visible continuity, not dead status pages.
20. Evidence origin and trust class must never be flattened into a single undifferentiated content block.
21. Spatial comparison surfaces such as booking orbit or network lattice must always have an accessible list or table fallback and may not displace the calmer list-first default.
22. All critical controls and regions must expose stable semantic roles and accessible names.
23. Color is a secondary signal only; state meaning must also be conveyed by text, iconography, layout, or motion.
24. Reduced-motion mode must preserve all state meaning without requiring spatial animation.
25. Countdown or exclusivity language must not appear unless the underlying business state genuinely supports it.
26. Hard navigation is allowed only for:

* initial shell load
* explicit entity switch
* explicit workspace switch
* true authentication boundary
* permission boundary
* unrecoverable projection or schema divergence

27. Assistive suggestions must remain supplementary and must never displace primary clinical or operational content without user intent.
28. Modal-on-modal stacks are forbidden for adjacent inspection, comparison, or compose flows that can be handled by `InlineSideStage`.
29. Queue reorder, queue insertion, and queue priority shift while a queue is in active use must flow through `QueueChangeBatch`.
30. A live update that materially invalidates an in-progress review must mark that review as `review_required`; it must not silently overwrite or auto-submit the user’s current decision context.
31. Staleness, disconnection, and paused-live mode must be visible when they affect safe action.
32. Route change alone is not an acceptable representation of state change; the relevant object state must also be reflected in the DOM.
33. Same-entity async completion must not create history-stack spam or navigate to a visually unrelated page.
34. Duplicating the same status across multiple simultaneous banners, chips, and toasts is forbidden unless the duplicated state is blocking and the duplication is localized to the active action.
35. Continuity, anchor preservation, focus integrity, and avoidable noise regressions are product defects, not cosmetic issues.
36. Auto-promotion may not switch support regions while the user is composing, comparing, confirming, or actively reading a highlighted delta unless urgency or blocker severity strictly increases.
37. Non-blocking pending, stale, acknowledgement, and capability states must stay local to the active card or the shared status strip; they may not escalate to persistent full-width banners by default.

### 4. Canonical real-time rendering algorithm

#### 4.0 Continuity resolution algorithm

On route entry, route update, projection apply, sign-in change, claim completion, or access-scope change:

1. Resolve `canonicalEntityRef`, `lineageScope`, `audienceTier`, and `entityContinuityKey`.

2. Compare the resolved `entityContinuityKey` to the current shell.

3. If the key is unchanged:

   * reuse the existing `PersistentShell`
   * preserve current `CasePulse`, the shared status strip, `DecisionDock`, `StateBraid`, the current disclosure posture, and active `SelectedAnchor`
   * morph only the child surface that changed

4. If the key is unchanged but authorization expands:

   * reveal newly authorized regions in place
   * do not discard currently visible safe context

5. If the key changes because of an explicit entity switch, workspace switch, true auth boundary, permission boundary, or unrecoverable schema divergence:

   * create a new shell
   * preserve safe return context where possible

6. Emit continuity telemetry for reuse, preservation, or boundary replacement.

7. Never blank the whole screen solely because a child phase or downstream status changed for the same continuity key.

#### 4.1 Initial mount algorithm

On entry to an entity-backed route:

1. Resolve the active entity scope, continuity key, audience tier, device breakpoint, and access grant posture.

2. Choose `PersistentShell.layoutTopology`:

   * `focus_frame` for patient and lightweight task surfaces on desktop and wide tablet
   * `two_plane` for routine staff, hub, support, and operations surfaces
   * `three_plane` only when the opening task already requires pinned comparison or blocking context
   * `mission_stack` for mobile and narrow-tablet surfaces
   * `embedded_strip` only for intentionally embedded experiences

3. Set `PersistentShell.clarityMode = essential` unless a blocker, conflict, or diagnostic route contract requires a higher detail posture.

4. Ask `CognitiveLoadGovernor` to derive the initial `AttentionBudget` from route class, blocker state, compare posture, and explicit user pins.

5. Create or reuse `PersistentShell`.

6. Render shell chrome immediately:

   * compact `GlobalSignalRail` or mission anchor
   * `CaseSpine`
   * `ContextConstellation` as closed or peeked by default, or stacked context drawer on narrow surfaces unless `AttentionBudget` explicitly promotes it

7. If a current projection snapshot exists:

   * render `CasePulse`
   * render `DecisionDock`
   * render one shared status strip using `AmbientStateRibbon` plus `FreshnessChip`
   * render the budget-approved primary work region at full prominence
   * render non-promoted `StateBraid`, `EvidencePrism`, assistive surfaces, and context as summary stubs, tabs, or closed drawers
   * restore any valid `SelectedAnchor`
   * subscribe in background

8. If only a last-stable snapshot exists for the same continuity key:

   * hydrate the shell from that last-stable snapshot
   * mark freshness as `updating`
   * do not show a blank reset

9. If no snapshot exists:

   * render bounded skeleton regions only for missing panels
   * do not block shell creation

10. Establish `ProjectionSubscription` for all required projections.

11. Mark freshness as `updating` until the first authoritative snapshot arrives.

12. When the snapshot arrives:

* patch missing or stale regions in place
* use `MotionIntentToken(intent = reveal)`
* do not blank the shell
* do not rebuild unaffected regions
* do not auto-expand secondary context unless safe action requires it

13. If the entity was already visible in an adjacent state, morph the child work surface rather than recreating the shell.
14. If verification or claim expands access during mount, reveal newly authorized detail progressively inside the current shell.

#### 4.1A Attention budget algorithm

On shell mount, route morph, blocker change, compare request, reopen, or explicit pin toggle:

1. Start from `clarityMode = essential` and assume the lowest viable surface count.
2. Set `maxPromotedRegions = 0` for simple patient intake, receipt, and quiet status-tracking views.
3. Set `maxPromotedRegions = 1` for routine review, conversation, booking selection, and ordinary staff operational work.
4. Raise to `maxPromotedRegions = 2` and allow `allowedPlaneCount = 3` only when:

   * a blocking trust conflict and comparison task are both present
   * the user explicitly pins context while compare mode is active
   * diagnostic or support replay mode is requested

5. Choose `promotedSupportRegionRef` by decision priority:

   * blocker, stale-trust, or conflict resolution -> `evidence_prism`
   * reopen, return, or materially changed chronology -> `state_braid`
   * active compare task -> `inline_side_stage`
   * policy note or linked context needed for safe action -> `context_constellation`
   * assistive suggestion review -> `inline_side_stage` only when the user requests it or when the suggestion itself is the current review subject

6. If `promotionLockReason != none`, freeze the current promoted support region unless the incoming signal is urgent or blocking with strictly higher severity.
7. Apply `promotionCooldownMs` before switching auto-promoted regions for the same continuity key unless the current promoted region no longer explains the active blocker or conflict.
8. Demote all non-promoted support regions to summary stubs, tabs, closed drawers, or quiet badges.
9. Never auto-promote more than one support region at a time.
10. When the promotion reason resolves, restore `lastQuietPostureRef` unless the user pinned a richer layout.

#### 4.1B Status suppression algorithm

At render and on every delta apply:

1. Collect candidate status cues from save, sync, freshness, review-required, pending external work, SLA risk, and active `TransitionEnvelope` objects.
2. Collapse equivalent cues by semantic meaning and entity scope before rendering chrome.
3. Hash each remaining cue by `entityScope + semanticState + blockingReason + actionScope` and suppress repeats inside `suppressionWindowMs` unless severity increases or the user initiates a new action.
4. Route one shell-level message to the shared status strip.
5. Keep control-specific acknowledgement on the initiating control or affected card only.
6. Promote to banner only when the state is blocking, urgent, or requires a new user decision.
7. Suppress routine toasts for save success, fresh projection arrival, and low-risk queue churn.
8. When a blocking or urgent state resolves, demote it back to the shared status strip or local control state.

#### 4.1C Reference implementation shape

Use reducer-style, deterministic front-end code so quiet-mode decisions stay inspectable in review and testable in automation. A TypeScript-style shape is sufficient:

```ts
export type PromotionLockReason =
  | 'none'
  | 'composing'
  | 'comparing'
  | 'confirming'
  | 'reading_delta';

export function deriveAttentionBudget(input: AttentionBudgetInput): AttentionBudget {
  const current = input.currentBudget;
  const rankedSignals = rankSignals(input.signals);
  const nextRegion = selectPromotedRegion({
    rankedSignals,
    currentRegion: current?.promotedSupportRegionRef ?? 'none',
    promotionLockReason: input.promotionLockReason,
    cooldownMs: current?.promotionCooldownMs ?? 1200,
    now: input.now,
  });

  return {
    ...current,
    clarityMode: input.requiresDiagnostic ? 'expanded' : 'essential',
    maxPromotedRegions: input.routeClass === 'quiet_patient' ? 0 : nextRegion.allowCompare ? 2 : 1,
    promotedSupportRegionRef: nextRegion.region,
    promotionLockReason: input.promotionLockReason,
    suppressionWindowMs: 2500,
    promotionCooldownMs: 1200,
    lastPromotionAt: nextRegion.changed ? input.now : current?.lastPromotionAt ?? input.now,
  };
}
```

#### 4.2 Soft navigation algorithm

When navigating between adjacent views of the same entity:

1. Reuse the existing `PersistentShell`.

2. Preserve:

   * `CasePulse`
   * the shared status strip
   * `DecisionDock`
   * open `InlineSideStage` where still valid
   * open drawers where still valid
   * current `clarityMode`
   * scroll and focus where safe
   * selected option cards, chosen provider cards, active queue rows, and active comparison context where still valid

3. Update URL by client-side route transition only.

4. Replace or morph only the child work surface in `CaseSpine`.

5. Use `MotionIntentToken(intent = morph or handoff)` for the child surface.

6. Do not blank the whole screen.

7. Do not re-fetch unrelated projections if the current subscription is still valid.

8. Do not detach the user from the working set to inspect a closely related child object if that inspection can be satisfied by `InlineSideStage`.

9. Do not swap to a different shell for booking, messaging, hub, pharmacy, callback, or review work that still belongs to the same request continuity key.

#### 4.3 Projection delta classification algorithm

For each live delta from `ProjectionSubscription`:

1. Compute an impact profile:

   * `surfaceScope = local | regional | shell`
   * `focusImpact = none | soft | disruptive`
   * `anchorImpact = preserves_anchor | updates_anchor | invalidates_anchor`
   * `trustImpact = none | caution | blocking`
   * `macroStateImpact = none | secondary_axis_only | macro_state_change`
   * `routeImpact = none | child_surface_change | boundary_change`
   * `announcementPriority = silent | polite | assertive`

2. Map the impact profile to one of:

   * `non_disruptive`
   * `contextual`
   * `disruptive`

3. `non_disruptive` deltas:

   * patch immediately
   * use minimal `reveal` or `commit` motion
   * do not disturb the active anchor or focused region

4. `contextual` deltas:

   * patch non-focused areas immediately
   * mark changed sections with changed-since-seen cues
   * if the changed area is currently focused, buffer via `DeferredUIDelta`

5. `disruptive` deltas:

   * buffer if the user is editing, reading a selected case, comparing options, composing a reply, or in a decision-critical step
   * otherwise apply through a controlled `QueueChangeBatch` or explicit patch

6. If `anchorImpact = invalidates_anchor`:

   * keep the prior `SelectedAnchor` visible
   * mark it `invalidated`
   * preserve its label and spatial anchor where possible
   * surface nearest safe alternatives in context
   * do not silently remove the anchor from the user’s mental model

7. If `trustImpact = caution` or `trustImpact = blocking`:

   * update `EvidencePrism`
   * create a diff against the last acknowledged snapshot
   * update `CasePulse.stateAxes.trust`
   * update the shared status strip
   * update `DecisionDock` blockers or re-check messaging
   * let `CognitiveLoadGovernor` update `AttentionBudget` and auto-promote only the single hidden evidence or context region needed to resolve the blocker
   * demote other support regions to summary posture unless the user pinned them
   * mark the active review surface as `review_required` if policy requires a fresh human check

8. If `macroStateImpact = macro_state_change` and the continuity key is unchanged:

   * update `CasePulse`
   * append the change to `StateBraid`
   * update the shared status strip
   * keep the shell stable

9. Never force-scroll the viewport to the changed area.

10. Never discard local draft input because of remote updates.

11. Never silently replace a focused decision surface with an unacknowledged remote state.

12. Never mutate browser history or route solely because a live delta arrived.

13. When buffered deltas are waiting, expose a subtle count and summary in the shared status strip or local queue badge without breaking concentration.

14. Live announcements must be bounded and prioritized by `announcementPriority`.
15. When the reason for a temporary promotion clears, restore `lastQuietPostureRef` unless the user pinned a richer layout.

#### 4.4 Command and async transition algorithm

For any user action that changes state:

1. Classify the action as:

   * reversible local
   * externally consequential
   * policy-sensitive
   * freshness-sensitive
   * anchor-specific

2. If the action is irreversible, externally consequential, or policy-sensitive:

   * construct `ConsequencePreview`
   * disclose immediate effects, downstream effects, blockers, and fallback actions
   * disclose projected `macroState` and state-axis changes
   * require explicit confirm where policy says so

3. Create `TransitionEnvelope(ackState = local_ack)` or `TransitionEnvelope(ackState = queued)` if dispatch is intentionally deferred.

4. If the action is anchor-specific:

   * bind the envelope to the relevant `SelectedAnchor`
   * create the anchor if it does not already exist

5. Within the local acknowledgement budget:

   * apply bounded control-level or card-level acknowledgement
   * prefer low-amplitude button compression, label change, or card settle on the initiating element
   * do not show a generic full-screen spinner

6. If the action is safe for optimistic feedback:

   * apply bounded local visual acknowledgement
   * set `ackState = optimistic_applied`

7. Send the command.

8. On server acceptance:

   * store returned `causalToken`
   * set `ackState = server_accepted`
   * keep the user in the same shell

9. If further external completion is required:

   * set `ackState = awaiting_external`
   * morph the affected anchor or action region into a provisional pending state
   * update the shared status strip
   * keep prior confirmed artifacts visible but clearly subordinate to pending truth

10. When the corresponding projection consumes the `causalToken` or an authoritative completion event arrives:

* set `ackState = projection_seen`
* patch the UI in place
* append the result to `StateBraid`
* update `CasePulse`
* settle or release the relevant `SelectedAnchor` according to policy
* set `ackState = settled`

11. If returned projection truth materially conflicts with the optimistic or assumed path:

* set `ackState = review_required`
* keep the current context visible
* surface diff-first explanation
* block unsafe follow-up actions until the user re-checks

12. On failure or governed expiry:

* revert only the affected local region
* set `ackState = failed`, `reverted`, or `expired`
* preserve shell and selected anchor context where possible
* expose a recovery action in `DecisionDock`

13. Under no circumstance may async completion move the user to a visually unrelated page without an explicit entity change.

#### 4.5 Command-following read rule

For components marked `command_following`:

1. After a successful command, wait for a projection version that includes the relevant `causalToken`.

2. Until it arrives:

   * keep the old stable entity visible
   * show provisional transition state locally
   * do not hard refresh

3. If the token does not arrive within policy threshold:

   * mark component `stale`
   * show bounded fallback messaging
   * keep context intact

4. Destructive follow-up actions must remain blocked when required command-following freshness is absent.

5. If a conflicting authoritative state arrives before the awaited token, convert the transition to `review_required` or `failed`; do not silently settle.

#### 4.6 Focus and composition protection algorithm

If the user is:

* typing
* editing a draft
* composing a reply
* selecting a slot
* comparing hub candidates
* reviewing a focused case
* reading an audit trail or diff
* using keyboard navigation inside a queue
* examining evidence lineage or consequences

then disruptive projection deltas must be buffered into `DeferredUIDelta` or `QueueChangeBatch` until:

* idle state is reached
* the draft is saved or submitted
* the comparison is closed
* the user explicitly applies updates

While buffered:

* show a subtle available-update indicator
* preserve current focus and selection
* preserve current queue position and active row
* preserve current draft text
* preserve current comparison anchors
* preserve the current `SelectedAnchor`

If buffered updates invalidate the current action:

* mark the relevant region as `review_required`
* keep the current context visible until the user acknowledges the change
* land re-check emphasis on the changed region first, not on a generic page top

When the user explicitly applies updates:

* settle the active anchor region first
* then settle peripheral regions
* do not reorder the entire shell before the focused region is stable
* once the focused region is stable and no blocker remains, restore the last quiet posture unless the user pinned a richer view

#### 4.7 Degraded and disconnected algorithm

On transient subscription loss or backend lag:

1. Keep the last stable UI state visible.
2. Change the shared status strip to `stale`, `disconnected`, or `paused` by updating `FreshnessChip` and `AmbientStateRibbon` together.
3. Disable only those actions that require fresh authoritative state.
4. Continue local draft capture where safe.
5. Keep `DecisionDock`, `CasePulse`, `StateBraid`, and any current `SelectedAnchor` visible.
6. Allow manual refresh or resume where appropriate without destroying shell context.
7. Resume live patching automatically when the connection recovers.
8. Do not clear the page or destroy the active shell.
9. Only on unrecoverable projection or schema divergence may the shell be replaced with a bounded recovery surface.

#### 4.8 Inline side-stage algorithm

When a user opens a related row, candidate, message, or compare target:

1. Open an `InlineSideStage` attached to the host surface.
2. Keep the originating working set visible.
3. Preserve keyboard focus order and return focus to the invoker on close.
4. Support compare mode for multiple related candidates where relevant.
5. Preserve draft or partially entered text within the side stage until explicit discard or commit.
6. Do not replace the whole entity shell for adjacent inspection or compare work unless a true entity switch is requested.
7. If the side-stage subject shares the same continuity key, inherit the shell and anchor-preservation rules.

#### 4.9 Evidence and diff algorithm

Whenever new material evidence enters an active case:

1. Classify it through `EvidenceLineageResolver`.

2. Insert it into `EvidencePrism` with source, freshness, and trust class.

3. Compute diff against the last acknowledged evidence snapshot.

4. Surface the changed regions first on reopen or resume flows.

5. If the new evidence conflicts with a previously confirmed fact:

   * keep the prior fact visible
   * mark the conflict explicitly
   * do not silently overwrite the prior fact

6. If a pending action depends on evidence that is now stale, conflicted, or superseded:

   * block unsafe commit
   * explain the reason in `DecisionDock`
   * mark the relevant review path as `review_required`

#### 4.10 Selected anchor lifecycle algorithm

When a user selects a slot, provider, pharmacy, queue row, comparison candidate, or equivalent focal object:

1. Create or update a `SelectedAnchor`.

2. Preserve the anchor’s label, local position reference, and visual identity throughout validation and async work.

3. While the anchor is being validated or is awaiting external completion:

   * set `stabilityState = validating` or `pending`
   * morph the anchor in place
   * keep it visibly connected to the command that caused the transition

4. If the anchor becomes invalid:

   * set `stabilityState = invalidated`
   * keep the anchor visible
   * explain the invalidation in context
   * present nearest safe alternatives without removing the original anchor first

5. Release or replace the anchor only when:

   * the transition settles with a confirmed replacement
   * the user explicitly dismisses it
   * a true entity switch occurs

6. If the anchor is referenced in a receipt, timeline event, or downstream status card, preserve lineage wording so the user can recognize the same object across states.

### 5. Patient lifecycle experience algorithm

#### 5.1 Patient macro-state mapping

All patient-visible request surfaces must map internal state into one of:

* `drafting`
* `received`
* `in_review`
* `we_need_you`
* `choose_or_confirm`
* `action_in_progress`
* `reviewing_next_steps`
* `completed`
* `urgent_action`

Rules:

1. `CasePulse.macroState` is the single top-level state language for patients.
2. Booking, hub, pharmacy, callback, and messaging states must map into this same set.
3. Detailed internal state may appear in timeline entries, but must not contradict the top-level macro state.
4. Patient wording must be calm, explicit, and consequence-aware.
5. `received`, `in_review`, `action_in_progress`, and `reviewing_next_steps` must remain living shells with visible last meaningful update, next expected step, and freshness state; they must not collapse into dead status pages.
6. `stateAxes` may provide secondary cues for urgency, trust, ownership, and interaction posture, but must remain subordinate to the shared patient macro state.
7. Patient shells must foreground one next step and one current status at a time; secondary detail belongs in progressive disclosure.

#### 5.2 Intake and draft algorithm

During intake:

1. Render the draft in one continuous shell.

2. On mobile and narrow surfaces, use `mission_stack`.

3. Form progression must behave like a structured interview, not a paperwork dump.

4. Patient and public flows should default to one question or one tightly related decision at a time unless repeat-use evidence shows that a merged step is faster and clearer.

5. Conditional questions must reveal in place from the control or section that triggered them.

6. Autosave must update the shared status strip as:

   * `saving`
   * `saved`
   * `failed`

7. On autosave success:

   * use `MotionIntentToken(intent = commit, timingBand = instant or standard)`
   * do not show disruptive toast if the save is routine

8. Attachment upload must remain inside the same shell as a persistent tray or panel.

9. If a sync conflict occurs:

   * keep the current draft visible
   * show a bounded merge or review layer
   * never dump the user to a generic error page

10. Field-level validation, upload retry, and partial save failure must remain local to the affected region and must not reset scroll.

11. Bounded help, hints, or supporting detail should open in side stages, drawers, or in-place reveals rather than full navigation.

12. Inline summaries, previous answers, and saved details should support recognition over recall and must not duplicate the full form unless the user requests review mode.
13. In `clarityMode = essential`, only the current question, one short rationale or help region, and one next action may be expanded at once; additional explanation must replace the current helper region rather than stack beneath it.

#### 5.3 Submission to receipt morph algorithm

On successful submission:

1. Do not navigate to an unrelated receipt page with a blank reset.
2. Transform the draft review surface into the receipt surface in place.
3. Preserve the summary of what was just submitted, including attachment references where relevant.
4. Append a receipt event to `StateBraid`.
5. Update `CasePulse.macroState` to `received` or `in_review`.
6. Surface next steps immediately in the same shell.
7. If downstream triage status or acknowledgement arrives shortly after submit, patch the current shell in place; do not perform a second page transition solely to show that change.

#### 5.4 Claim, secure-link, and embedded access algorithm

When access scope changes because of sign-in, claim, verified continuation, or embedded deep link:

1. Preserve the current shell and active request where possible.
2. Keep the same `CasePulse`.
3. Reveal newly authorized sections progressively after verification succeeds.
4. Do not reveal patient-linked detail before the relevant access grant or challenge completes.
5. Use a `reveal` or `morph` semantic transition, not a disruptive redirect, unless a true auth boundary requires shell replacement.
6. If the continuity key is unchanged, do not reset the request, receipt, or active conversation thread.

#### 5.5 Unified care conversation algorithm

For every patient request:

1. Render one `ConversationThreadProjection`.

2. The thread must unify:

   * clinician messages
   * follow-up questions
   * callback expectations and outcomes
   * patient replies
   * actionable instructions linked to the same request

3. The current required action must be pinned above or within the thread.

4. Show the latest relevant items first in quiet mode, with full history available on demand.

5. New thread items must insert in place with changed-since-seen markers.

6. Reply submission must remain in the same shell and create a `TransitionEnvelope`.

7. If the reply returns the case to review, the UI must morph to `in_review` without page reload.

8. Callback prompts, more-info questions, and instruction acknowledgements must not fork to unrelated pages or disconnected mini-flows for the same request.
9. In `clarityMode = essential`, keep either the current required action composer or the latest relevant history cluster expanded, not both; older history stays collapsed until requested.

#### 5.5A Patient record and results visualization algorithm

1. Patient record routes must open inside the signed-in patient shell with the same primary navigation and the same quiet posture as requests, appointments, and messages.
2. The record overview must foreground latest changes, action-needed items, and last-updated metadata before full chronology.
3. Each result detail must render a patient-safe title, plain-language summary, measured value and range, trend or comparison, next step, and source metadata in that order.
4. Charts are optional compare surfaces only; an equivalent accessible table and screen-reader summary are required.
5. When detail is sensitivity-gated, explain why, preserve shell context, and surface the safest next action instead of a blank or generic access-denied state.
6. Documents and letters should prefer structured in-browser rendering with file download as a secondary action when policy allows.
7. In `clarityMode = essential`, expand one record card, one result detail, or one document summary at a time; technical detail stays behind a clearly labeled disclosure.
8. Record routes linked to an active request, appointment, or message thread must preserve lineage links and return paths without changing the owning shell unless the canonical entity changes.

#### 5.6 Booking, waitlist, hub, and pharmacy continuity algorithm

1. Booking, waitlist, hub alternatives, and pharmacy progression for the same request must reuse the same request shell.

2. Selected option cards must persist through `SelectedAnchor`.

3. The default booking and routing surface should be a calm ranked list or table. Spatial views such as booking orbit or network lattice are optional compare modes and must have an accessible list or table fallback.

4. Slot selection, confirmation, alternative selection, or pharmacy choice may have distinct route contracts, but they must render as adjacent child states inside the same shell and expand inline or in a bounded sheet or drawer rather than resetting the page.

5. Confirmation pending must render as a provisional in-place state on the selected card.

6. If no true hold exists:

   * do not show hold countdown
   * do not imply exclusivity

7. Waitlist and hub offers must reuse the same action language and card grammar as booking.

8. Pharmacy instructions and status must keep the chosen provider card visually persistent.

9. If a selected option becomes invalidated, keep it visible, mark it invalidated, and present nearest safe alternatives in context without losing the request shell.
10. In `clarityMode = essential`, only one candidate detail or compare surface may be expanded at a time; opening another must collapse the previous one unless the user explicitly enters compare mode.

#### 5.7 Reopen and bounce-back algorithm

When a request reopens or a downstream path returns work:

1. Keep prior confirmed artifacts visible but visually superseded.
2. Change `CasePulse.macroState` to `reviewing_next_steps` or `urgent_action` as appropriate.
3. Insert the return event into `StateBraid`.
4. Surface the new next action in the existing `DecisionDock`.
5. Use `MotionIntentToken(intent = reopen)` to signal reversal without disorientation.
6. Land the user on the changed evidence, changed instructions, or changed options first rather than forcing a full re-read.
7. If reopening was triggered by new external information or a conflicting confirmation, present a diff-first summary before expanding the full history.

### 6. Staff, hub, support, and operations experience algorithm

#### 6.1 Staff queue algorithm

For active worklists:

1. `QueueLens` is the default queue surface; simple table rendering is a fallback mode, not the only mode.

2. The selected row or card must remain pinned while open.

3. New work must enter through `QueueChangeBatch`.

4. Priority changes for the focused item must appear as local signals, not forced list jumps.

5. Background items may reorder only when:

   * the user is idle
   * the user applies queued updates
   * the queue is not in active focused use

6. Keyboard position and focus must be preserved.

7. Bulk action controls must remain stable while the queue updates.

8. Queue surfaces may enter buffered or paused mode while the user is reading, typing, or deciding; queued changes must remain visible as a count and summary without displacing the current item.

9. Opening a case must not destroy or forget the current working set.
10. When a case is active, demote secondary queue summaries, charts, and board widgets to a slim index or collapsed stubs; the review canvas must remain the dominant surface.

#### 6.2 Case review algorithm

On opening a case:

1. Keep queue, review canvas, and decision surface within one stable shell.

2. Default to `two_plane` composition:

   * context and patient or request summary in the main review canvas
   * `DecisionDock`

3. Reveal `EvidencePrism` as a summary by default and expand it only when conflict, staleness, blocker state, or explicit reviewer intent requires deeper inspection.

4. New evidence must land as highlighted deltas wherever possible.

5. If a case reopens with new material:

   * default to diff-first presentation
   * do not force full case re-reading without highlighting changes

6. Assistive suggestions must appear in a supplementary rail or drawer and must not reflow the primary content unexpectedly.

7. Any material change to evidence, endpoint, approval state, or merge lineage must invalidate stale decision assumptions and require explicit re-check before commit.

8. If endpoint, ownership, or merge lineage changes while a review is open, keep the prior judgment context visible with explicit supersession markers rather than silently replacing it.
9. In routine review, `EvidencePrism`, `StateBraid`, `ContextConstellation`, and assistive suggestions may not all remain fully expanded together; `AttentionBudget` must promote only the single support region most relevant to the current decision.
10. When a conflict, blocker, or compare posture resolves, the review shell must return to the last quiet posture unless the reviewer explicitly pinned more detail.

#### 6.3 Booking and network comparison algorithm

For booking and network decision surfaces:

1. Start with a ranked list or table. Spatial comparison views may be used for slots, candidates, or routes, but must always have an accessible fallback representation and may not be the only first view.

2. The selected candidate must remain visually persistent through validation, provisional pending, and confirmation.

3. Constraint changes must reshape the visible option field without losing the selected anchor where still valid.

4. Alternatives should remain visible before the current route fully fails, when policy allows.

5. If a chosen option becomes invalid during review:

   * keep it visible
   * mark it invalidated
   * present nearest safe alternatives in context

6. Comparison surfaces may patch non-focused candidates live but must buffer changes that would reflow the selected candidate under pointer or keyboard focus.
7. In `clarityMode = essential`, only one candidate detail or comparison side stage may be expanded automatically; multi-candidate compare is an explicit mode, not the resting state.

#### 6.4 Hub and pharmacy desk algorithm

For hub and pharmacy operational surfaces:

1. Ranking changes must use low-amplitude, non-jarring motion.
2. Time-sensitive states must be represented through ambient urgency cues, not flashing or aggressive motion.
3. Practice acknowledgement pending, dispatch pending, or confirmation pending must remain local to the active card or pane.
4. Returning work must reopen in the same shell with clear diff and status cues.
5. Chain-of-custody or acknowledgement events must enter `StateBraid` rather than disappear into detached logs.
6. Chosen practice, provider, or pharmacy cards must persist as `SelectedAnchor` objects through pending, invalidation, failure, and settlement.

#### 6.5 Support and replay algorithm

For support and investigation surfaces:

1. Default to `two_plane` composition with queue or workboard context on one side and the active `SupportTicket` mission frame in the main plane.
2. The mission frame must unify ticket summary, omnichannel timeline, and one active response or recovery form without route-breaking context switches.
3. `SupportSubject360Projection`, `SupportKnowledgeStackProjection`, policy notes, and replay controls must enter as summary cards, tabs, or quiet chips by default; `AttentionBudget` may auto-promote only one of them at a time.
4. In `clarityMode = essential`, keep either the active composer or recovery form, or the latest unresolved history cluster expanded; older history stays collapsed until requested.
5. Switching from conversation to recovery, escalation, or resolution must preserve draft state, scroll position, and the selected message or event anchor.
6. Knowledge-base articles, macros, and playbooks must open inline or in a bounded side stage with freshness and applicability cues; they must not navigate the agent away from the ticket.
7. Replay and timeline inspection must occur within a stable shell.
8. Live updates must be pausable.
9. Pausing live updates must preserve current context while new events queue in the background.
10. Resuming live updates must apply queued changes in an ordered, reviewable way.
11. Support actions such as link reissue, communication replay, attachment recovery, identity correction, or access review must open in bounded side panels or drawers, not context-destroying page swaps.
12. Replay surfaces must provide event grouping, diff markers, explicit freshness state, and a clear return-to-ticket control.
13. Re-entering the queue from an active ticket must restore the previous working set, filter state, and keyboard position.

#### 6.6 Operations board algorithm

For real-time operational boards:

1. Tiles, tables, and strip metrics must update in place and retain stable object identity.
2. Operations shells must default to `two_plane` composition with a dominant anomaly field in the main plane and a persistent `InterventionWorkbench` in the secondary plane.
3. `three_plane` is allowed only for explicit compare, incident-command, or deep diagnostic work; it may not be the resting state of `/ops/overview`.
4. `NorthStarBand`, `BottleneckRadar`, `CapacityAllocator`, `ServiceHealthGrid`, `CohortImpactMatrix`, and `InterventionWorkbench` are the canonical overview surfaces; no operations landing page may substitute a wall of unrelated charts for that structure.
5. Only one board region may hold escalated visual priority at a time; the highest-actionability bottleneck wins and other abnormal regions must summarize rather than compete.
6. Operators must be able to pause live updates during diagnosis, planning, or incident command.
7. Staleness must be visible at shell, board, and component level.
8. Critical threshold breaches may elevate presentation tone, but must not hijack the user’s viewport.
9. Resource reallocation proposals must present current state, projected relief, confidence, and policy guardrails before commit.
10. Drill-in from the board must open an `InvestigationDrawer` or continuity-preserving split view and must serialize an `OpsReturnToken` so the operator can return without losing filters, scroll, selected anomaly, or horizon.
11. Batched board changes must animate as grouped settlement rather than as jittery per-tile motion.
12. High-churn metrics must favor calm value morphs or number updates over repeated resorting that breaks scanability.
13. Launching from an operations board into a request, incident, audit trace, queue entity, or specialist workspace must preserve originating board context and support one-step return.
14. Full operations-console interaction, hierarchy, and drill-down rules are defined in `operations-console-frontend-blueprint.md`.

### 7. Canonical motion, accessibility, and verification system

#### 7.1 Motion intent meanings

Required semantic intents:

* `reveal`: disclose new content or freshly available detail
* `morph`: transform the same object into a new adjacent state
* `commit`: settle a completed action into the timeline or card
* `pending`: indicate that work is in progress elsewhere
* `escalate`: signal urgent or high-attention transition
* `diff`: draw attention to what changed
* `reopen`: communicate reversal from settled to active
* `degrade`: communicate stale, offline, or fallback mode
* `handoff`: shift emphasis between closely related child panels without breaking shell continuity

Typical domain mappings:

* autosave success -> `commit`
* submit-to-receipt -> `morph`
* selected option validation -> `pending`
* authoritative confirmation -> `commit`
* evidence change requiring re-check -> `diff`
* request returned to active work -> `reopen`
* stale or disconnected state -> `degrade`

#### 7.2 Motion timing bands

Recommended platform timing bands:

* `instant = 90ms to 140ms`
* `standard = 140ms to 220ms`
* `deliberate = 220ms to 320ms`
* `urgent = 100ms to 160ms`

Rules:

1. `instant` is for acknowledgements and save feedback.
2. `standard` is for normal reveals and commits.
3. `deliberate` is for handoffs and panel morphs.
4. `urgent` is for high-attention state changes without dramatic flourish.

#### 7.3 Motion application rules

1. Motion must originate from the element, object, or `SelectedAnchor` that changed.

2. Page-wide or shell-wide motion is forbidden when the object is already known and the shell remains stable.

3. Selected-anchor motion takes precedence over peripheral motion in the same region.

4. Local acknowledgement should begin as low-amplitude control or card feedback on the initiating element before any broader timeline or header update.

5. Only one primary motion intent may dominate a region at a time.

6. Pending indicators must be low amplitude, local, and non-blocking.

7. Diff highlighting must fade to a passive state after attention is established.

8. Motion must support causality:

   * action starts in `DecisionDock` or the initiating control
   * provisional state appears on the affected object or `SelectedAnchor`
   * final state settles into `CasePulse`, `StateBraid`, or the affected card

9. Motion must be interruptible and reversible where the business action is reversible.

10. Motion must not delay readiness, focus availability, or actionability.

11. Repeated live deltas must batch into calm settlements rather than stack multiple competing animations.

12. Motion must reduce, not increase, cognitive load.

#### 7.4 Reduced-motion rule

When reduced motion is enabled:

1. Replace spatial transitions with opacity, emphasis, and static state changes.
2. Preserve all sequencing and meaning.
3. Remove non-essential looping motion.
4. Never require motion perception to understand urgency, completion, invalidation, or failure.
5. Preserve diff-first emphasis through layout, iconography, and text when motion is reduced.

#### 7.5 Accessibility and interaction contract

1. All core workflows must be fully operable by keyboard.
2. Focus indicators must be visible, high-contrast, and never hidden behind sticky chrome.
3. Every custom control must expose a semantic role and stable accessible name.
4. Every spatial comparison surface must have a semantic fallback.
5. No state may rely on color alone.
6. Reflow, zoom, and narrow-width rendering must preserve the primary action path.
7. Live regions must be bounded and must not create noisy repeated announcements for routine updates.
8. Assertive announcements are reserved for blocking, urgent, or review-required changes.
9. Buffered update announcements must summarize batches rather than narrate every individual patch.
10. Drag-only interaction patterns are forbidden unless a full keyboard and screen-reader alternative exists.

#### 7.6 Verification and Playwright contract

1. Prefer semantic HTML and accessible roles before test IDs.
2. Every critical workflow must expose deterministic success and failure markers in the DOM.
3. Loading, stale, locked, processing, empty, warning, failed, invalidated, review-required, and reconciled states must be explicit in the DOM and visually distinct.
4. Do not use animation to hide readiness or delay actionability.
5. `CasePulse`, `StateBraid`, `EvidencePrism`, `DecisionDock`, `QueueLens`, `InlineSideStage`, and `SelectedAnchor` surfaces must have stable automation anchors.
6. Route change alone is not an acceptable assertion of state change; the relevant object state must also be reflected in the DOM.
7. Continuity reuse, selected-anchor preservation, freshness state, and re-check state must all be observable in automation without relying on visual timing guesses.

#### 7.7 Responsiveness budgets and continuity measures

Required measures:

* `interaction_to_local_ack_ms`
* `interaction_to_server_accept_ms`
* `interaction_to_projection_seen_ms`
* `delta_to_visible_patch_ms`
* `same_entity_shell_reuse_rate`
* `selected_anchor_preservation_rate`
* `focus_loss_rate`
* `same_entity_full_reload_count`
* `buffered_delta_apply_lag_ms`

Rules:

1. Optimize for time to stable local acknowledgement and time to stable comprehension, not only network completion.

2. Target budgets for core flows:

   * local acknowledgement should normally occur within 150ms of interaction
   * non-disruptive projection deltas should normally patch visibly within 250ms of receipt
   * same-entity full reload count must be `0` by design
   * focus loss rate for protected workflows must be `0` by design

3. Regressions in continuity, anchor preservation, or focus integrity are product defects.

4. Responsiveness must be judged by whether the user can understand what is happening without losing context, not by whether a new page loaded quickly.

### 8. Required UI events

Emit the following events where applicable:

* `ui.shell.created`
* `ui.shell.reused`
* `ui.continuity.resolved`
* `ui.continuity.preserved`
* `ui.continuity.broken`
* `ui.case_pulse.rendered`
* `ui.attention_budget.changed`
* `ui.support_region.promoted`
* `ui.support_region.demoted`
* `ui.status_suppressed`
* `ui.state_axes.changed`
* `ui.state_braid.rendered`
* `ui.evidence_prism.rendered`
* `ui.decision_dock.rendered`
* `ui.selected_anchor.created`
* `ui.selected_anchor.preserved`
* `ui.selected_anchor.invalidated`
* `ui.selected_anchor.released`
* `ui.transition.started`
* `ui.transition.server_accepted`
* `ui.transition.awaiting_external`
* `ui.transition.projection_seen`
* `ui.transition.settled`
* `ui.transition.reverted`
* `ui.transition.failed`
* `ui.transition.expired`
* `ui.consequence.previewed`
* `ui.projection.subscribed`
* `ui.projection.delta_received`
* `ui.projection.delta_buffered`
* `ui.projection.delta_applied`
* `ui.freshness.changed`
* `ui.queue.batch_available`
* `ui.queue.batch_applied`
* `ui.queue.focus_pinned`
* `ui.side_stage.opened`
* `ui.side_stage.closed`
* `ui.live.paused`
* `ui.live.resumed`
* `ui.buffer.state_changed`
* `ui.buffer.flushed`
* `ui.diff.revealed`
* `ui.review.required`
* `ui.motion.reduced_enabled`

### 9. Forbidden behaviors

The following behaviors are explicitly forbidden:

1. hard reloading the page for a projection-backed adjacent state change
2. showing a blank or full-screen loading state when the active entity is already known
3. replacing the whole request surface when only a child panel, evidence cluster, selected card, or status has changed
4. resetting focus or scroll because a live update arrived
5. reordering or removing the currently open staff item while it is being worked
6. splitting messages, callback expectations, and follow-up questions into unrelated silo pages for the same request
7. showing fake exclusivity, fake hold countdown, or fake real-time confidence
8. using generic endless spinners instead of explicit bridge states
9. allowing live updates to overwrite partially entered user text
10. using animation that flashes, bounces, or dramatizes urgent states
11. relying on route changes alone to communicate state change
12. presenting contradictory top-level status across patient-facing surfaces for the same request
13. hiding staleness or disconnection when fresh data is required for safe action
14. using assistive suggestions in a way that displaces primary clinical or operational content without user intent
15. stacking modal on top of modal for adjacent compare, inspect, or compose work that can be served by `InlineSideStage`
16. flattening evidence origin, confidence, and freshness into one undifferentiated content block
17. exposing irreversible or externally consequential actions without `ConsequencePreview`
18. relying on color-only severity or urgency signalling
19. shipping bespoke controls that are not keyboard-operable or lack stable semantic naming
20. presenting a spatial-only selection surface without an accessible fallback representation
21. removing a `SelectedAnchor` during validation, pending, invalidation, or failure without explicit replacement or dismissal
22. sending the user to a different shell for messaging, booking, hub, callback, pharmacy, or review work that still belongs to the same request continuity key
23. using transient toast alone as the only evidence that a state change occurred
24. force-scrolling to new timeline entries or live deltas while the user is reading, typing, or deciding
25. treating `received`, `in_review`, or `action_in_progress` as dead static pages
26. silently settling a transition when later projection truth conflicts with the optimistic path
27. applying high-churn board updates as jittery per-item resort loops that break scanability
28. hiding buffered live changes until they silently apply without user awareness
29. duplicating the same status across header, banner, chip, toast, and side rail when one shared status strip would do
30. auto-expanding more than one support region for the same state change unless diagnostic mode or an explicit user pin justifies it
31. leaving blocker-only evidence, context, or compare chrome expanded after the reason has resolved when the user did not pin it
32. defaulting a routine task into `three_plane` layout when `focus_frame` or `two_plane` would preserve clarity
33. creating browser-history noise for every async sub-state or projection refresh
34. measuring speed only by page load while ignoring continuity loss, focus loss, anchor loss, or avoidable noise
35. stacking persistent full-width banners for pending, stale, assistive, or capability states that could remain local to the active card or the shared status strip

## 0G. Observability, security plumbing, and operational controls

Now make the platform operable.

Every request should get a correlation ID at the edge and carry it through browser, API, command handler, event bus, worker, projection, and audit. Without that, later debugging becomes miserable.

Add:

- structured logs
- distributed tracing
- metrics for latency, error rate, queue depth, retries, and projection lag
- feature flags
- config versioning
- secret rotation hooks
- PII redaction rules
- health endpoints
- readiness and liveness probes
- alert definitions
- synthetic transactions

On the client side, add:

- error boundaries
- frontend telemetry
- release version tagging
- route transition timing
- safe redaction before telemetry emit

This is also the right moment to define failure language in the UI. Not generic "something went wrong," but product-grade failure states that later map to telephony outage, GP system outage, notification delay, stale queue, or auth failure.

**Tests that must pass before 0G is done**

- Correlation IDs appear end to end
- Telemetry excludes PHI
- Alert rules fire in test environments
- Feature flags can enable or disable surfaces without redeploy
- Secrets can rotate without code changes
- Synthetic probes detect degraded dependencies

**Exit state**  
The system is observable enough that later feature work does not become guesswork.

[1]: https://digital.nhs.uk/services/gp-connect?utm_source=chatgpt.com "GP Connect"
[2]: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works "How NHS login works - NHS England Digital"
[3]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards "Clinical risk management standards - NHS England Digital"
[4]: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration "IM1 Pairing integration - NHS England Digital"
[5]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration "NHS App web integration - NHS England Digital"
