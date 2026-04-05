# Phase 5 - The Network Horizon

**Working scope**  
PCN Hub Desk and Enhanced Access coordination.

## Phase 5 implementation rules

**Rule 1: local booking stays first choice.**  
This phase only begins after the local booking engine cannot safely complete the case, or when a routing rule says the hub is the right destination from the start. That matches the booking flow and practice-team journey.

**Rule 2: hub coordination is task-driven, not magic slot brokering.**  
The hub desk should work from structured requests with priority, timeframe, and needs. Every coordination action should be explicit, timed, and auditable.

**Rule 3: policy must be configurable but governed.**  
Because current DES rules tie Enhanced Access to defined hours, appointment-book visibility, reminders, cancellation, and commissioner-approved plan changes, the platform should use versioned policy packs rather than hidden admin toggles. ([NHS England][4])

**Rule 4: booking in the hub’s native system is a first-class path, not a workaround.**  
The flow explicitly includes booking in the hub’s native system, so manual or semi-manual hub commits must be deliberately modelled and auditable, not treated as outside-system work.

**Rule 5: origin practice continuity never disappears.**  
Once a case moves to hub coordination, the originating practice still needs current status, booking outcome, and fallback context. The system should never leave the practice blind.

**Rule 6: patient choice should stay elegant.**  
Alternative slot offers, callback options, and network manage flows should feel like the same product as the rest of Vecells: minimal, clear, mobile-first, and quietly premium.

---

## 5A. Network coordination contract, case model, and state machine

This sub-phase creates the durable runtime model for hub coordination.

### Backend work

Do not reuse the Phase 4 `BookingCase` directly as the live hub object. Instead, preserve it as the source booking lineage and create a new `HubCoordinationCase` that wraps the network-specific work.

The booking-to-hub hop must preserve the same request lineage explicitly. `NetworkBookingRequest`, `HubCoordinationCase`, patient visibility, and practice acknowledgement must all bind the same `requestLineageRef`, and the hub branch must open one child `LineageCaseLink(caseFamily = hub, parentLineageCaseLinkRef = origin booking link)` rather than overwriting the booking branch or inferring lineage from foreign keys later.

Create these objects:

**NetworkBookingRequest**  
`networkBookingRequestId`, `episodeRef`, `requestLineageRef`, `originLineageCaseLinkRef`, `originBookingCaseId`, `originRequestId`, `originPracticeOds`, `patientRef`, `priorityBand`, `clinicalTimeframe`, `modalityPreference`, `clinicianType`, `continuityPreference`, `accessNeeds`, `travelConstraints`, `reasonForHubRouting`, `requestedAt`

**HubCoordinationCase**  
`hubCoordinationCaseId`, `episodeRef`, `requestLineageRef`, `lineageCaseLinkRef`, `parentLineageCaseLinkRef`, `networkBookingRequestId`, `servingPcnId`, `status`, `ownerState = unclaimed | claimed_active | release_pending | transfer_pending | supervisor_override | stale_owner_recovery`, `claimedBy`, `actingOrg`, `ownershipLeaseRef`, `activeOwnershipTransitionRef`, `ownershipFenceToken`, `ownershipEpoch`, `compiledPolicyBundleRef`, `enhancedAccessPolicyRef`, `policyEvaluationRef`, `policyTupleHash`, `candidateSnapshotRef`, `crossSiteDecisionPlanRef`, `activeAlternativeOfferSessionRef`, `activeOfferOptimisationPlanRef`, `latestOfferRegenerationSettlementRef`, `selectedCandidateRef`, `bookingEvidenceRef`, `networkAppointmentRef`, `offerToConfirmationTruthRef`, `activeFallbackRef`, `callbackExpectationRef`, `activeIdentityRepairCaseRef`, `identityRepairBranchDispositionRef`, `identityRepairReleaseSettlementRef`, `externalConfirmationState`, `practiceAckGeneration`, `practiceAckDueAt`, `openCaseBlockerRefs[]`, `lastProgressAt`, `slaTargetAt`, `queueEnteredAt`, `lastMaterialReturnAt`, `expectedCoordinationMinutes`, `urgencyCarry`, `createdAt`, `updatedAt`

**EnhancedAccessPolicy**  
`policyId`, `compiledPolicyBundleRef`, `routingPolicyRef`, `varianceWindowPolicyRef`, `serviceObligationPolicyRef`, `practiceVisibilityPolicyRef`, `capacityIngestionPolicyRef`, `policyTupleHash`, `policyState = active | superseded`, `effectiveAt`

**HubRoutingPolicyPack**
`routingPolicyId`, `networkStandardHours`, `localFirstRuleSetRef`, `hubEntryRuleSetRef`, `callbackFallbackRuleSetRef`, `returnToPracticeRuleSetRef`, `patientExposureRuleSetRef`, `sameDayOnlineAllowedNoTriage`, `siteConvenienceRules`, `modalityMixRules`, `policyVersionRef`

**HubVarianceWindowPolicy**
`varianceWindowPolicyId`, `approvedVarianceWindows`, `varianceReasonCodeRefs[]`, `outsideWindowVisibilityMode = hidden | diagnostic_only | patient_visible_with_warning`, `commissionerApprovalEvidenceRefs[]`, `policyVersionRef`

**HubServiceObligationPolicy**
`serviceObligationPolicyId`, `advanceAvailabilityDays`, `reminderRequired`, `simpleCancellationRequired`, `minutesPer1000Target`, `cancellationMakeUpWindowDays`, `obligationEscalationThresholds`, `opsOnlyRuleSetRef`, `policyVersionRef`

**HubPracticeVisibilityPolicy**
`practiceVisibilityPolicyId`, `ackGenerationRulesRef`, `ackDueByRuleRef`, `allowedNoAckExceptionRefs[]`, `visibilityObligationRuleSetRef`, `manageExposureRuleSetRef`, `patientDisclosureRuleSetRef`, `policyVersionRef`

**HubCapacityIngestionPolicy**
`capacityIngestionPolicyId`, `allowedAdapterModes[]`, `freshnessThresholdRefs[]`, `trustAdmissionRuleSetRef`, `quarantineRuleSetRef`, `degradedDiagnosticVisibilityRuleSetRef`, `dedupeRuleSetRef`, `policyVersionRef`

**NetworkCoordinationPolicyEvaluation**
`policyEvaluationId`, `hubCoordinationCaseId`, `compiledPolicyBundleRef`, `enhancedAccessPolicyRef`, `routingPolicyRef`, `varianceWindowPolicyRef`, `serviceObligationPolicyRef`, `practiceVisibilityPolicyRef`, `capacityIngestionPolicyRef`, `snapshotRef`, `selectedCandidateRef`, `evaluationScope = candidate_snapshot | offer_generation | commit_attempt | practice_visibility_generation | manage_exposure`, `routingDisposition = local_first_required | hub_allowed | hub_required | callback_required | return_required`, `varianceDisposition = inside_required_window | inside_approved_variance | outside_window_visible | outside_window_hidden`, `serviceObligationDisposition = compliant | obligation_risk | obligation_breached`, `practiceVisibilityDisposition = ack_not_required | ack_required | ack_exception_pending | manage_read_only`, `capacityAdmissionDisposition = trusted_offerable | degraded_diagnostic_only | quarantined_hidden`, `policyExceptionRefs[]`, `policyTupleHash`, `evaluatedAt`

**NetworkCandidateSnapshot**  
`snapshotId`, `hubCoordinationCaseId`, `fetchedAt`, `expiresAt`, `candidateRefs`, `capacitySourceRefs`, `assuranceSliceTrustRefs[]`, `compiledPolicyBundleRef`, `enhancedAccessPolicyRef`, `policyEvaluationRef`, `policyTupleHash`, `policyExceptionRefs[]`, `degradedSourceRefs[]`, `quarantinedSourceRefs[]`, `trustStateSummary`, `rankPlanVersion`, `capacityRankProofRef`, `rankDisclosurePolicyRef`, `uncertaintyModelVersionRef`, `dominanceFilteredCandidateRefs[]`, `crossSiteDecisionPlanRef`

**CrossSiteDecisionPlan**
`decisionPlanId`, `hubCoordinationCaseId`, `snapshotId`, `compiledPolicyBundleRef`, `enhancedAccessPolicyRef`, `policyEvaluationRef`, `routingPolicyRef`, `varianceWindowPolicyRef`, `capacityIngestionPolicyRef`, `objectiveVersionRef`, `capacityRankProofRef`, `rankDisclosurePolicyRef`, `feasibleCandidateRefs[]`, `dominanceFilteredCandidateRefs[]`, `rankedCandidateRefs[]`, `policyTupleHash`, `generatedAt`

**NetworkSlotCandidate**  
`candidateId`, `siteId`, `siteName`, `sourceSystem`, `slotReference`, `capacityUnitRef`, `modality`, `clinicianType`, `startAt`, `endAt`, `requiredWindowFit`, `travelScore`, `accessFit`, `bookabilityMode`, `manageCapabilities`, `sourceVersion`, `sourceTrustRef`, `sourceTrustState = trusted | degraded | quarantined`, `fitFeatures`, `baseUtility`, `uncertaintyRadius`, `robustFit`, `scoreExplanationRef`, `dominanceKey`

**AlternativeOfferSession**  
`offerSessionId`, `hubCoordinationCaseId`, `candidateSnapshotRef`, `candidateRefs`, `optimisationPlanRef`, `offerEntryRefs[]`, `fallbackCardRef`, `rankPlanVersionRef`, `capacityRankProofRef`, `rankDisclosurePolicyRef`, `rankDisclosureMode = recommended_open_choice`, `visibleOfferSetHash`, `openChoiceState = full_set_visible | callback_only | read_only_provenance`, `offerMode`, `patientChoiceState = prepared | delivered | opened | selected | declined | callback_requested | expired | superseded | recovery_only`, `callbackOfferState = hidden | available | selected | transferred | blocked`, `accessGrantRef`, `subjectRef`, `routeIntentRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeState = monitoring | frozen | kill_switch_active | rollback_recommended | released`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `transitionEnvelopeRef`, `experienceContinuityEvidenceRef`, `releaseRecoveryDispositionRef`, `truthProjectionRef`, `truthTupleHash`, `offerFenceEpoch`, `expiresAt`, `selectedCandidateRef`, `latestRegenerationSettlementRef`, `supersededByOfferSessionRef`, `supersededAt`, `stateConfidenceBand = high | medium | low`, `causalToken`, `monotoneRevision`

**AlternativeOfferOptimisationPlan**
`optimisationPlanId`, `hubCoordinationCaseId`, `candidateSnapshotRef`, `crossSiteDecisionPlanRef`, `capacityRankProofRef`, `rankDisclosurePolicyRef`, `objectiveVersionRef`, `frontierCandidateRefs[]`, `selectedCandidateRefs[]`, `representedBucketKeys[]`, `excludedCandidateRefs[]`, `excludedReasonRefs[]`, `offerSetHash`, `coverageScore`, `redundancyScore`, `callbackFallbackEligibilityState = hidden | available | required`, `planState = active | superseded`, `generatedAt`, `supersededAt`

`AlternativeOfferOptimisationPlan` is the only legal solver artifact for patient-visible hub choice. Raw top-`K` candidate arrays, coordinator-local curation, or browser-side filtering are not an acceptable substitute once patient offer posture is live. The plan must prove the clinically acceptable trusted frontier, the represented diversity buckets, the excluded redundant candidates, the callback fallback eligibility, and the exact `offerSetHash` that later patient and staff surfaces consume.

**AlternativeOfferEntry**
`offerEntryId`, `offerSessionRef`, `candidateRef`, `capacityRankExplanationRef`, `rankOrdinal`, `bucketKey`, `coverageRole = primary_bucket | diversity_fill | last_safe_extra`, `redundancyPenaltyClass = none | low | high`, `recommendationState = recommended | neutral`, `selectionState = available | selected | declined | expired | superseded | read_only_provenance`, `generatedAt`

`AlternativeOfferEntry` is the patient-visible open-choice row contract. It keeps recommendation, diversity role, and rank proof attached to one visible candidate without letting recommendation state collapse the set into a covert single-path funnel.

**AlternativeOfferFallbackCard**
`fallbackCardId`, `offerSessionRef`, `cardType = callback | outside_window_explanation`, `sourceFallbackRef`, `displayPlacement = after_ranked_offers`, `eligibilityState = hidden | visible | selected | transferred | blocked | read_only_provenance`, `reasonCodeRefs[]`, `leadTimeConstraintRef`, `dominantActionRef`, `generatedAt`

`AlternativeOfferFallbackCard` is the only legal patient-visible callback or explanation card alongside a live offer set. It may never occupy a ranked slot ordinal, replace the open-choice list, or masquerade as a normal option row.

**AlternativeOfferRegenerationSettlement**
`regenerationSettlementId`, `hubCoordinationCaseId`, `previousOfferSessionRef`, `nextOfferSessionRef`, `previousOfferSetHash`, `nextOfferSetHash`, `triggerClass = expiry | candidate_snapshot_superseded | subject_binding_drift | publication_drift | embedded_drift | continuity_drift | callback_linkage_change`, `preservedSelectedAnchorRef`, `preservedSelectedAnchorTupleHashRef`, `preservedOfferEntryRefs[]`, `preservedFallbackCardRef`, `resultState = regenerated_in_shell | read_only_provenance | callback_only_recovery | escalated_back | blocked`, `recordedAt`

`AlternativeOfferRegenerationSettlement` is the same-shell recovery receipt for alternative offers. Expiry, regenerated supply, subject drift, publication drift, or embedded drift may preserve the prior offer set as provenance, but they may not silently mutate a live choice route in place or leave stale accept, decline, or callback actions armed.

**HubBookingEvidenceBundle**  
`evidenceBundleId`, `hubCoordinationCaseId`, `offerSessionRef`, `selectedCandidateRef`, `selectedCandidateSourceVersion`, `commitMode`, `enteredBy`, `enteredAt`, `nativeBookingReference`, `proofRefs`, `evidenceSourceFamilies[]`, `independentConfirmationMode`, `independentConfirmationState`, `truthProjectionRef`, `truthTupleHash`, `confirmedAt`

**HubAppointmentRecord**  
`hubAppointmentId`, `hubCoordinationCaseId`, `patientRef`, `hubSiteId`, `offerSessionRef`, `commitAttemptRef`, `sourceBookingReference`, `commitMode`, `startAt`, `endAt`, `modality`, `status`, `manageCapabilities`, `externalConfirmationState`, `confirmationGateRef`, `confirmationConfidence`, `practiceAcknowledgementState = not_required | pending | acknowledged | disputed | overdue | recovery_required`, `confirmationEvidenceRef`, `truthProjectionRef`, `truthTupleHash`

**PracticeAcknowledgementRecord**  
`acknowledgementId`, `hubCoordinationCaseId`, `hubAppointmentId`, `originPracticeOds`, `ackGeneration`, `materialChangeSetRef`, `practiceVisibilityPolicyRef`, `serviceObligationPolicyRef`, `policyEvaluationRef`, `continuityMessageRef`, `transportAckState = none | accepted | rejected | timed_out`, `deliveryEvidenceState = pending | delivered | failed | disputed | expired`, `deliveryRiskState = on_track | at_risk | likely_failed | disputed`, `ackState = not_required | pending | acknowledged | disputed | overdue | recovery_required`, `truthProjectionRef`, `truthTupleHash`, `stateConfidenceBand = high | medium | low`, `ackedBy`, `ackedAt`, `ackEscalationAt`, `deliveryEvidenceRef`, `causalToken`, `monotoneRevision`

**HubOfferToConfirmationTruthProjection**
`hubOfferToConfirmationTruthProjectionId`, `hubCoordinationCaseId`, `selectionSource = direct_candidate | alternative_offer | assisted_read_back | imported_confirmation | callback_fallback | return_to_practice`, `candidateSnapshotRef`, `selectedCandidateRef`, `selectedCandidateSourceVersion`, `selectedCapacityUnitRef`, `offerSessionRef`, `offerOptimisationPlanRef`, `fallbackCardRef`, `offerSetHash`, `offerSessionRevision`, `offerExpiryAt`, `offerState = not_used | prepared | delivered | patient_choice_pending | selected | declined | expired | superseded`, `offerActionabilityState = live_open_choice | read_only_provenance | fallback_only | blocked`, `latestRegenerationSettlementRef`, `commitAttemptRef`, `bookingEvidenceRef`, `confirmationGateRef`, `hubAppointmentId`, `practiceAcknowledgementRef`, `practiceAckGeneration`, `fallbackRef`, `fallbackLinkState = none | callback_pending_link | callback_linked | return_pending_link | return_linked`, `confirmationTruthState = no_commit | candidate_revalidating | native_booking_pending | confirmation_pending | confirmed_pending_practice_ack | confirmed | disputed | expired | superseded`, `patientVisibilityState = choice_visible | provisional_receipt | confirmed_visible | fallback_visible | recovery_required`, `practiceVisibilityState = not_started | continuity_pending | ack_pending | acknowledged | exception_granted | recovery_required`, `closureState = blocked_by_offer | blocked_by_confirmation | blocked_by_practice_visibility | blocked_by_fallback_linkage | blocked_by_supplier_drift | closable`, `experienceContinuityEvidenceRef`, `truthTupleHash`, `blockingRefs[]`, `causalToken`, `monotoneRevision`, `generatedAt`

`HubOfferToConfirmationTruthProjection` is the single monotone bridge from network offer or direct selection into booked, practice-visible truth. Every live `AlternativeOfferSession`, `AlternativeOfferOptimisationPlan`, `AlternativeOfferEntry`, `AlternativeOfferFallbackCard`, accepted choice, `HubCommitAttempt`, `HubBookingEvidenceBundle`, `HubAppointmentRecord`, `PracticeAcknowledgementRecord`, and `HubFallbackRecord` must resolve into one current projection on the owning `HubCoordinationCase`; patient surfaces, hub console posture, origin-practice visibility, and closure blockers must derive from this projection rather than stitching those objects together independently.

When no patient-facing alternative pack exists, set `selectionSource = direct_candidate` and `offerState = not_used`; the same projection still governs direct hub commit, imported confirmation, and practice acknowledgement so hub-native booking never outruns current case truth just because the patient-choice branch was skipped.

Older offers, evidence bundles, appointment records, acknowledgements, and fallback transfers remain auditable, but they may not restore calmer patient copy, booked posture, practice-visible posture, or closeability unless their `truthTupleHash` still matches the current projection on `HubCoordinationCase.offerToConfirmationTruthRef`.

`PracticeAcknowledgementRecord` is the acknowledgement-debt contract for one practice-visibility generation. Transport acceptance, delivery evidence, delivery risk, and explicit acknowledgement are distinct facts: transport or MESH acceptance may widen pending guidance, but it may not satisfy the generation debt without current-generation acknowledgement evidence or an audited policy exception.

**HubOwnershipTransition**
`ownershipTransitionId`, `hubCoordinationCaseId`, `transitionType = claim | release | transfer | supervisor_takeover | stale_owner_recovery`, `fromOwnerRef`, `toOwnerRef`, `fromOrganisation`, `toOrganisation`, `transitionState = proposed | pending_acceptance | accepted | expired | cancelled`, `continuityMessageRef`, `effectiveFenceToken`, `createdAt`, `resolvedAt`

**HubFallbackRecord**  
`fallbackId`, `hubCoordinationCaseId`, `fallbackType = alternative_pack | callback_request | callback_transfer | return_to_practice | supervisor_review`, `reasonCode`, `callbackFallbackRef`, `returnToPracticeRef`, `callbackExpectationRef`, `patientNotificationRef`, `practiceVisibilityDeltaRef`, `truthProjectionRef`, `fallbackLinkState = none | callback_pending_link | callback_linked | return_pending_link | return_linked`, `state = proposed | patient_visible | transferred | expired | completed`, `createdAt`, `updatedAt`

`HubFallbackRecord` is the governing open-case continuity object for no-slot, callback, and return-to-practice work. `CallbackFallbackRecord` and `HubReturnToPracticeRecord` are typed child records beneath it, and the hub case may not disappear from active oversight until the fallback record is durably linked to the callback or return workflow and reaches `state = transferred | completed`.

Lock the main state machine now:

`hub_requested -> intake_validated -> queued -> claimed -> candidate_searching -> candidates_ready -> coordinator_selecting -> candidate_revalidating -> native_booking_pending -> confirmation_pending -> booked_pending_practice_ack -> booked -> closed`

Branch states from `coordinator_selecting` are:

- `alternatives_offered`
- `patient_choice_pending`
- `callback_transfer_pending`
- `callback_offered`
- `escalated_back`

Definitions:

- `alternatives_offered` is entered when a real `AlternativeOfferSession` has been created
- `patient_choice_pending` is entered when at least one live offer has been delivered and the case is now waiting for patient response
- `callback_transfer_pending` is entered when callback fallback has been selected but the linked `CallbackCase` or `CallbackExpectationEnvelope` is not yet durably created and patient-visible
- `callback_offered` is entered only when a `CallbackFallbackRecord` is linked to the active `HubFallbackRecord`, the current `CallbackCase`, and a fresh `CallbackExpectationEnvelope`
- `escalated_back` is entered when a `HubReturnToPracticeRecord` or equivalent urgent return has been created
- `candidate_revalidating` is entered when a selected network candidate is being rechecked against live capacity, `sourceVersion`, snapshot expiry, and policy rules before native booking

These are durable operational states, not descriptive labels.

If wrong-patient correction freezes the lineage, `HubCoordinationCase.identityRepairBranchDispositionRef` must hold the network branch in `quarantined`, `compensation_pending`, or later `released` posture. Alternative offers, callback fallback, practice acknowledgement, native-booking confirmation, and calm patient or practice assurance may not remain live from stale hub state while repair is unresolved.

Ownership and persistence invariants:

- hub ownership must be lease-based and fenced: only one live `ownershipLeaseRef` may exist per `HubCoordinationCase`, and claim, release, supervisor takeover, booking commit, return-to-practice, and close must present the current `ownershipFenceToken` plus `ownershipEpoch`
- lease expiry may not silently close, auto-transfer, or downgrade the case; it must emit governed stale-owner recovery, preserve `openCaseBlockerRefs[]`, and keep the case visible until a new owner or supervisor settles the transition
- for hub case `h`, define `OpenCaseBlockers(h)` as the set of active refs among: live ownership lease, live `HubOwnershipTransition`, every `blockingRef` named by the current `HubOfferToConfirmationTruthProjection`, unresolved supplier drift, unresolved callback expectation publication, and continuity-evidence blocks on writable routes
- any active `IdentityRepairBranchDisposition` on the hub lineage must also appear in `OpenCaseBlockers(h)` until the branch is `released` or terminal compensation is recorded
- `HubCoordinationCase.status = closed` is legal only when `OpenCaseBlockers(h)` is empty and `LifecycleCoordinator` has persisted the governing close decision

`HubCoordinationCase.status` remains an operational workflow state, not the cross-surface truth contract. Patient reassurance, hub booked posture, practice-visible posture, and closeability must all derive from the current `HubOfferToConfirmationTruthProjection` facets plus continuity evidence, not from raw status labels alone.

Add the first event catalogue:

- `hub.request.created`
- `hub.case.created`
- `hub.case.claimed`
- `hub.case.released`
- `hub.case.transfer_started`
- `hub.case.transfer_accepted`
- `hub.capacity.snapshot.created`
- `hub.candidates.rank_completed`
- `hub.offer.created`
- `hub.offer.accepted`
- `hub.booking.native_started`
- `hub.booking.confirmation_pending`
- `hub.booking.externally_confirmed`
- `hub.practice.notified`
- `hub.practice.acknowledged`
- `hub.patient.notified`
- `hub.callback.transfer_pending`
- `hub.callback.offered`
- `hub.escalated.back`
- `hub.queue.overload_critical`
- `hub.case.closed`

Expose a dedicated API surface:

- `POST /v1/hub/requests`
- `GET /v1/hub/cases/{hubCoordinationCaseId}`
- `POST /v1/hub/cases/{hubCoordinationCaseId}:claim`
- `POST /v1/hub/cases/{hubCoordinationCaseId}:transfer-ownership`
- `POST /v1/hub/cases/{hubCoordinationCaseId}:refresh-candidates`
- `POST /v1/hub/cases/{hubCoordinationCaseId}:offer-alternatives`
- `POST /v1/hub/cases/{hubCoordinationCaseId}:commit-native-booking`
- `POST /v1/hub/cases/{hubCoordinationCaseId}:return-to-practice`
- `POST /v1/hub/cases/{hubCoordinationCaseId}:close`

### Frontend work

Turn the Hub Desk shell from Phase 0 into a real application with these routes:

- `/hub/queue`
- `/hub/case/:hubCoordinationCaseId`
- `/hub/alternatives/:offerSessionId`
- `/hub/exceptions`
- `/hub/audit/:hubCoordinationCaseId`

The route model should support read-only multi-user viewing, single-user ownership for active coordination, explicit confirmation-pending states, and explicit practice-acknowledgement states before booked cases disappear from active oversight.

Hub shell-family ownership is explicit:

- instantiate one `ShellFamilyOwnershipContract(shellType = hub)` over `/hub/queue`, `/hub/case/:hubCoordinationCaseId`, `/hub/alternatives/:offerSessionId`, `/hub/exceptions`, and `/hub/audit/:hubCoordinationCaseId`
- every hub route family must publish one `RouteFamilyOwnershipClaim`; case detail is the hub shell root, alternatives and exception handling are same-shell child or peer routes, and audit or proof review remains bounded inside the same hub shell while the active coordination case is unchanged
- booking, callback, return-to-practice, acknowledgement, and audit domains may contribute child regions, artifacts, and command flows, but they do not get to re-home the active case into detached pages or a second shell
- deep links, refresh, browser back or forward, and manage recovery for hub child routes must reopen the current hub shell and selected case anchor rather than reconstructing generic booking, callback, or audit pages
- every hub route family must also materialize one live `FrontendContractManifest`, one exact `ProjectionContractVersionSet`, and one `projectionCompatibilityDigestRef`; queue, case detail, alternatives, exception handling, and audit surfaces may read only through declared `ProjectionQueryContract` refs, commit or manage only through declared `MutationCommandContract` refs, and preserve cached candidate or receipt state only through the declared `ClientCachePolicy`
- booking payload shape, callback linkage, and stale audit or acknowledgement rows may not imply writable hub posture, booked reassurance, or recovery semantics when the active hub manifest or runtime binding has degraded

### Tests that must pass before moving on

- state-transition tests for all allowed and forbidden hub case paths
- migration tests from Phase 4 fallback objects into `NetworkBookingRequest`
- no-orphan tests between `HubCoordinationCase`, `LineageCaseLink`, `HubAppointmentRecord`, `PracticeAcknowledgementRecord`, and `HubFallbackRecord`
- event-schema compatibility tests
- projection rebuild tests for hub cases from raw events
- ownership-transition fence and stale-owner recovery tests
- no-booked-state-before-external-confirmation tests
- no-close-before-practice-ack tests for booked cases
- no-close-before-callback-transfer-or-return-link tests

### Exit state

The platform now has a dedicated network-coordination domain rather than treating hub work as an unstructured booking exception, and booked cases cannot silently outrun confirmation or practice visibility.

## 5B. Staff identity, organisation boundaries, and acting context

This sub-phase makes cross-practice work safe.

### Backend work

For a PCN Hub Desk, the access model must become stricter than a normal practice workflow. This is the right place to integrate staff identity around CIS2. NHS England says CIS2 is the secure SSO service for health and care professionals, required for some national APIs, recommended for other third-party health applications, and that all new integrations must use CIS2 because CIS1 is deprecated. ([NHS England Digital][2])

Add these objects:

**StaffIdentityContext**  
`staffIdentityContextId`, `staffUserId`, `authProvider = cis2`, `homeOrganisation`, `affiliatedOrganisationRefs[]`, `tenantGrantRefs[]`, `activeOrganisation`, `rbacClaims`, `nationalRbacRef`, `localRoleRefs[]`, `sessionAssurance`, `identityState = authenticated | reauth_required | revoked`, `authenticatedAt`, `expiresAt`

**ActingContext**  
`actingContextId`, `staffIdentityContextRef`, `staffUserId`, `homePracticeOds`, `activeOrganisationRef`, `activePcnId`, `activeHubSiteId`, `tenantScopeMode = single_tenant | organisation_group | multi_tenant | platform`, `tenantScopeRefs[]`, `purposeOfUse`, `actingRoleRef`, `audienceTierRef`, `visibilityCoverageRef`, `minimumNecessaryContractRef`, `elevationState = none | requested | active | expiring | revoked`, `breakGlassState`, `contextState = current | stale | blocked | superseded`, `scopeTupleHash`, `switchGeneration`, `issuedAt`, `expiresAt`

**CrossOrganisationVisibilityEnvelope**
`crossOrganisationVisibilityEnvelopeId`, `actingContextRef`, `actingScopeTupleRef`, `sourceOrganisationRef`, `targetOrganisationRef`, `audienceTierRef`, `purposeOfUseRef`, `minimumNecessaryContractRef`, `requiredCoverageRowRefs[]`, `visibleFieldRefs[]`, `placeholderContractRef`, `envelopeState = current | stale | blocked | superseded`, `generatedAt`

**CoordinationOwnership**  
`hubCoordinationCaseId`, `claimedBy`, `claimedAt`, `activeOrganisation`, `ownershipLeaseRef`, `leaseExpiresAt`, `lastHeartbeatAt`, `fencingToken`, `ownershipEpoch`, `handoffChain`, `supervisorOverrideState`, `transferState`

Build the permission model around three visibility tiers, each bound to one materialized `VisibilityProjectionPolicy`, one `MinimumNecessaryContract`, and dedicated section, preview, and artifact contracts:

- **origin practice visibility:** can see request lineage, macro booking status, fallback reason code, patient communication state, latest continuity delta, and whether the current `ackGeneration` is still awaiting acknowledgement; it must not receive hub-internal free text, cross-site capacity detail, or raw native-booking proof
- **hub desk visibility:** can see the minimum clinical-routing summary, operational timing needs, travel or access constraints, and the governed evidence needed to coordinate safely; broader narrative or attachments require explicit policy promotion or reason-coded break-glass
- **servicing site visibility:** can see only what is required to deliver the encounter or manage site-local capacity; it must not receive origin-practice triage notes, callback rationale, or alternative options at other sites

Do not rely on raw role names alone. Use RBAC plus attributes like `originPractice`, `servingPCN`, `servingSite`, `purposeOfUse`, `breakGlassState`, the current `ActingContext.scopeTupleHash`, and the active `VisibilityProjectionPolicy` grant.

Every command must carry `ActingContext`, the current ownership fence, the active visibility contract, and, for cross-organisation work, the current `CrossOrganisationVisibilityEnvelope`, and every write must append an audit record that includes:

- who acted
- from which organisation
- on behalf of which coordination case
- why the action was permitted
- whether break-glass was used
- whether the command was rejected because lease, organisation, or visibility posture drifted

Organisation switch, stale lease, or visibility-contract drift must revoke writable posture in the current shell until the case is re-read under the new acting context.

### Frontend work

The hub desk UI should make acting context obvious without becoming noisy.

Build:

- organisation chip in the global header
- active PCN or site switcher where allowed
- origin-practice context integrated into `CasePulse` or the shared context strip rather than a repeating banner on every case
- governed summary or placeholder region for out-of-scope clinical detail; collapsed panels may not substitute for a narrower payload
- break-glass reason modal
- access-denied and out-of-scope states that feel intentional, not broken

This screen should look premium and controlled. Dense, but with strong separation between case overview, clinical context, and coordination actions.

### Tests that must pass before moving on

- CIS2 session bootstrap tests
- acting-context propagation tests
- cross-practice access-denied tests
- purpose-of-use enforcement tests
- break-glass reason-required tests
- supervisor override audit tests
- stale-session and organisation-switch tests

### Exit state

Hub users can now work across network cases with explicit permissions, clear acting context, and no blurred organisation boundaries.

---

## 5C. Enhanced Access policy engine and network capacity ingestion

This sub-phase turns PCN policy and hub capacity into structured data.

### Backend work

Create a dedicated policy engine rather than burying Enhanced Access assumptions inside search code.

The current DES is detailed enough that several policy items should exist as typed configuration, not comments in code. `EnhancedAccessPolicy` should therefore be the compiled envelope over separate routing, variance-window, service-obligation, practice-visibility, and capacity-ingestion policy packs rather than one mixed object. Routing and approved-variance law decide whether a candidate is offerable; service-obligation law feeds ledgers and exception alerts; practice-visibility law decides acknowledgement debt and manage exposure; and capacity-ingestion law decides whether a source is trusted, diagnostic-only, or quarantined. Those families must be replayable from one `policyTupleHash` and may not reinterpret each other at runtime. ([NHS England][4])

Build `HubCapacityAdapter` seams for each participating service window or native system:

- `native_api_feed`
- `partner_schedule_sync`
- `manual_capacity_board`
- `batched_capacity_import`

Normalize all incoming supply into `NetworkSlotCandidate` objects with consistent fields for:

- site and geography
- face-to-face or remote
- clinician type
- start and end
- source freshness
- source trust state
- whether it sits inside the required window
- whether it fits approved variance windows
- manage capabilities
- patient-accessibility fit

Treat `requiredWindowFit` as an ordinal rather than a loose boolean:

- `2 = inside_required_window`
- `1 = inside_approved_variance_window`
- `0 = outside_window_but_still_visible_by_policy`

Persist normalized fitness features rather than one opaque score. Use strict clinical band ordering plus a robust within-band score, then bind each candidate to one canonical `CapacityRankExplanation`; do not count `requiredWindowFit` both as a hard band and again inside the soft utility.

For case `c` and candidate slot `s`, compute:

- `windowClass(c,s) = requiredWindowFit(c,s)` in `{2,1,0}`
- `u_modality(c,s) = 1` when modality is compatible, otherwise `0`
- `u_access(c,s) in [0,1]`
- `u_travel(c,s) = exp(-travelMinutes(c,s) / tau_travel)`
- `u_wait(c,s) = exp(-waitMinutes(s) / tau_wait)`
- `u_fresh(c,s) = exp(-stalenessMinutes(s) / tau_fresh)`

Then compute the within-band base utility:

`baseUtility(c,s) = w_modality * u_modality(c,s) + w_access * u_access(c,s) + w_travel * u_travel(c,s) + w_wait * u_wait(c,s) + w_fresh * u_fresh(c,s)`

with `sum w_* = 1` in a versioned rank plan.

Next attach uncertainty explicitly. Let `epsilon_alpha(c,s) >= 0` be the calibrated uncertainty radius for live availability and commitability, derived from source trust class, snapshot staleness, duplicate-capacity collision risk, and recent adapter drift under the current `uncertaintyModelVersionRef`. Define:

- `uncertaintyRadius(c,s) = epsilon_alpha(c,s)`
- `robustFit(c,s) = baseUtility(c,s) - lambda_uncertainty * uncertaintyRadius(c,s)`

with `lambda_uncertainty >= 0` versioned in the same rank plan.

Dominance matters across sites. If candidate `s1` weakly dominates `s2` on `(windowClass, sourceTrustState, robustFit, startAt)` and strictly dominates on at least one coordinate, remove `s2` from the patient-offerable and direct-commit frontier and persist the dominance decision in `CrossSiteDecisionPlan`.

When surfacing candidate options, order lexicographically by:

1. `windowClass(c,s)` descending
2. source trust tier descending
3. `robustFit(c,s)` descending
4. `travelMinutes(c,s)` ascending
5. `startAt` ascending
6. `candidateId` ascending

where source trust tier is `2 = trusted`, `1 = degraded`, `0 = quarantined`.

This keeps clinical timeliness lexicographically above convenience, avoids double-counting window fit, makes uncertainty visible instead of burying it inside stale-feed heuristics, and gives local booking, hub staff, support replay, and patient offer surfaces one shared explanation tuple.

The ingestion algorithm should be:

1. resolve the participating hub sites for the case’s PCN
2. load current `EnhancedAccessPolicy` from the active `CompiledPolicyBundle`
3. append one `NetworkCoordinationPolicyEvaluation(evaluationScope = candidate_snapshot)` that binds the exact routing, variance-window, service-obligation, practice-visibility, and capacity-ingestion pack refs plus one `policyTupleHash`
4. fetch capacity from each active source
5. resolve the current `AssuranceSliceTrustRecord` for each source feed or supplier namespace before any candidate becomes bookable
6. normalize into `NetworkSlotCandidate`, carrying `sourceTrustRef` and `sourceTrustState`
7. apply only the current `HubCapacityIngestionPolicy` and trust-state evaluation to source admission: quarantined-source candidates must never become bookable or patient-offerable; degraded-source candidates may remain visible only for diagnostic or callback-fallback reasoning, not ordinary direct commit
8. compute and persist `baseUtility`, `uncertaintyRadius`, `robustFit`, and the dominance frontier once per snapshot, mint one `CapacityRankProof`, and attach one `CapacityRankExplanation` per candidate so later queueing and option views reuse the same math and explanation tuple
9. apply only routing, approved-variance, and capacity-admission outputs to the patient-offerable and direct-commit frontier; service-obligation and practice-visibility rules may mint ledgers, acknowledgement debt, and exception records, but they may not silently re-score, hide, or reorder candidates
10. persist `NetworkCandidateSnapshot`, one `CrossSiteDecisionPlan`, and the bound `NetworkCoordinationPolicyEvaluation`
11. emit typed policy exceptions if capacity is missing, stale, quarantined, outside allowed variance, obligation-risking, or visibility-restricted

Add two operational ledgers now:

**EnhancedAccessMinutesLedger**  
Tracks delivered and available minutes against the current minutes-per-1,000 obligation.

**CancellationMakeUpLedger**  
Tracks cancelled network time and whether replacement capacity was offered within the required window.

Those ledgers are not patient-facing, but they stop the hub desk from becoming a black box.

### Frontend work

Add a capacity-awareness layer to the hub desk:

- site filter
- service-window filter
- modality filter
- inside-required-window toggle
- policy tuple and approved-variance summary strip
- stale-feed signal in the shared status strip plus local stale markers on affected capacity panes
- lightweight day and week strip view of capacity

Hub staff must be able to inspect the current routing, variance-window, service-obligation, practice-visibility, and capacity-ingestion evaluations without reverse-engineering them from filters or queue state. A coordinator may still act only through the declared pack outputs, but they must be able to see which family blocked patient exposure, created acknowledgement debt, or opened an operational exception.

Do not build a giant calendar first. Build a high-signal coordination view first: which sites have usable supply right now, and how well does it fit the case?

### Tests that must pass before moving on

- policy-evaluation tests against current standard-hour rules
- approved-variance-window tests
- policy-family replay tests proving routing, variance, service-obligation, practice-visibility, and capacity-ingestion evaluations all resolve from one frozen `policyTupleHash`
- capacity-source contract tests
- stale-feed detection tests
- assurance-slice degraded and quarantined source tests proving degraded supply is never treated as normal bookable truth
- overlapping-slot deduplication tests
- robust-fit, uncertainty-radius, and dominance-frontier tests
- no-service-obligation-or-ack-rule-in-ranking tests
- minutes-ledger calculation tests
- cancellation-make-up tracking tests
- acknowledgement-debt generation tests from the current practice-visibility policy
- DST and timezone tests across sites

### Exit state

The hub system can now reason about actual Enhanced Access supply instead of relying on manual guesswork or fragmented site lists.

---

## 5D. Coordination queue, candidate ranking, and SLA engine

This sub-phase makes the hub desk operational.

### Backend work

The hub desk should not just list requests. It should rank them against risk and capacity fit, with risk always dominating convenience.

For case `i` at time `t`, define:

- `expectedService_i = max(s_hub_min, expectedCoordinationMinutes_i)`
- `d_clin_i(t) = workingMinutesBetween(t, clinicalWindowClose_i)`
- `d_sla_i(t) = workingMinutesBetween(t, slaTargetAt_i)`
- `laxity_clin_i = d_clin_i(t) - expectedService_i`
- `laxity_sla_i = d_sla_i(t) - expectedService_i`
- `urgencyCarry_i in [0,1]`, a persisted urgency floor raised by callback fallback, supplier drift, or return-to-practice events and cleared only by authoritative downstream settlement
- `rank_i^(0)(t)` as the seed order from the previous published queue order when available, otherwise the stable intrinsic order by smallest `min(laxity_clin_i, laxity_sla_i)`, highest `urgencyCarry_i`, originating clinical priority, `queueEnteredAt`, then `hubCoordinationCaseId`
- `e_j(t)` as the class-conditioned robust expected coordination workload for case `j`, anchored by `expectedCoordinationMinutes_j`
- `mu_eff(t)` as the effective staffed coordination capacity in workload-minutes cleared per working minute
- for iteration `m`, `B_i^(m)(t) = sum_{j : rank_j^(m)(t) < rank_i^(m)(t)} e_j(t)` as effective workload minutes ahead of `i`
- `W_i^(m)(t) = B_i^(m)(t) / max(mu_eff(t), 1e-6)` as expected wait-to-start
- `S_i` as the random in-service handling time for case `i`
- `C_i` as the random commit-and-confirmation time on the best currently trusted candidate, or `0` when no commit path is active
- `D_i` as any extra external-dependency delay random variable for patient response, supplier confirmation, practice acknowledgement, or callback routing
- `T_i^(m)(t) = W_i^(m)(t) + S_i + C_i + D_i`
- `mu_i^(m) = E[T_i^(m)(t)]` and `v_i^(m) = Var[T_i^(m)(t)]`, adding covariance terms only when a validated dependence model exists
- moment-matched Gamma parameters `k_i^(m) = (mu_i^(m))^2 / max(1e-6, v_i^(m))` and `theta_i^(m) = v_i^(m) / max(1e-6, mu_i^(m))`
- `P_clin_breach_i^(m)(t) = 1 - F_Gamma(d_clin_i(t); k_i^(m), theta_i^(m))` when `d_clin_i(t) > 0`, otherwise `1`
- `P_sla_breach_i^(m)(t) = 1 - F_Gamma(d_sla_i(t); k_i^(m), theta_i^(m))` when `d_sla_i(t) > 0`, otherwise `1`
- `P_breach_i^(m)(t) = max(P_clin_breach_i^(m)(t), P_sla_breach_i^(m)(t))`
- `rank_i^(m+1)(t)` as the stable sort induced by the current-iteration risk key below
- iterate until the order is unchanged or `max_i |P_breach_i^(m+1)(t) - P_breach_i^(m)(t)| < epsilon_rank`, with deterministic cap `m <= M_rank`
- publish `P_breach_i(t) = P_breach_i^(m*)(t)` and the converged order `rank_i(t) = rank_i^(m*)(t)`
- `riskBand_i = 3` when `min(laxity_clin_i, laxity_sla_i) <= 0`, `2` when `P_breach_i(t) >= tau_breach_critical`, `1` when `P_breach_i(t) >= tau_breach_warn`, and `0` otherwise
- `bestFit_i = max_s robustFit(i,s)` over the current `NetworkCandidateSnapshot`, or `0` if no policy-valid candidate exists
- `bestTrustedFit_i = max_s robustFit(i,s)` over trusted candidates, or `0` if none exist
- `trustGap_i = max(0, bestFit_i - bestTrustedFit_i)`
- `degradedOnly_i in {0,1}` when visible supply exists but every policy-valid candidate comes only from degraded sources
- `access_i in [0,1]` for access-needs severity and travel burden
- `modalityGap_i in [0,1]` where `0` is exact fit and `1` is poor fit
- `localFail_i in {0,1}` when local booking has already failed
- `awaitingPatient_i in {0,1}` when the patient is awaiting a response
- `bounce_i = min(bounceCount_i, B_cap) / B_cap`

Estimate `expectedCoordinationMinutes_i` from the trailing governed service-time prior for the coordination archetype, with fallback constant `s_hub_min`; do not make it reviewer-specific.

Then compute the non-risk secondary score:

`secondaryScore_i = b_gap * (1 - bestTrustedFit_i) + b_trust * trustGap_i + b_degraded * degradedOnly_i + b_access * access_i + b_modality * modalityGap_i + b_localfail * localFail_i + b_waiting * awaitingPatient_i + b_bounce * bounce_i`

with all `b_* >= 0`, `sum b_* = 1`, and versioned in the coordination rank plan. All thresholds and time constants such as `theta_*`, `tau_*`, `H_*`, `s_hub_min`, and `s_hub_quantum` must version with that same plan.

Use the stable sort key:

1. `riskBand_i` descending
2. `urgencyCarry_i` descending
3. `P_breach_i(t)` descending
4. originating clinical priority descending
5. `secondaryScore_i` descending
6. `queueEnteredAt` ascending
7. `hubCoordinationCaseId` ascending

This keeps breach risk lexicographically ahead of convenience, grounds urgency in queue workload and delayed confirmations rather than a local heuristic, and adds a persisted urgency floor plus trust-gap visibility without giving degraded-only supply a false appearance of safety.

Keep the ranking explanation. Supervisors need to know why one case sits above another, so persist `riskBand_i`, `P_breach_i(t)`, `laxity_clin_i`, `laxity_sla_i`, `expectedService_i`, `bestTrustedFit_i`, `trustGap_i`, `degradedOnly_i`, workload-ahead terms, dependency-delay assumptions, and the active rank-plan version.

Create these projections:

**HubQueueWorkbenchProjection**
`projectionId`, `savedViewRefs[]`, `visibleRowRefs[]`, `selectedCaseRef`, `queueChangeBatchRef`, `riskSummaryRef`, `fairnessMergeState`, `bundleVersion`, `continuityKey`, `staleAt`

**HubConsoleConsistencyProjection**
`projectionId`, `hubCoordinationCaseId`, `bundleVersion`, `audienceTier`, `governingVersionRefs`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `statusStripAuthorityRef`, `decisionDockFocusLeaseRef`, `postureRef`, `experienceContinuityEvidenceRef`, `staleAt`

**HubCaseConsoleProjection**
`projectionId`, `hubCoordinationCaseId`, `consistencyProjectionRef`, `casePulseRef`, `postureRef`, `ownershipTransitionRef`, `optionCardRefs[]`, `selectedOptionCardRef`, `communicationsRailRef`, `auditRailRef`, `decisionDockRef`, `openBlockerRefs[]`, `staleAt`

**HubOptionCardProjection**
`optionCardId`, `candidateRef`, `rankOrdinal`, `windowClass`, `sourceTrustState`, `freshnessBand = fresh | aging | stale`, `reservationTruthState = held | truthful_nonexclusive | no_hold | revalidation_required | unavailable`, `offerabilityState = direct_commit | patient_offerable | callback_only_reasoning | diagnostic_only`, `capacityRankProofRef`, `rankExplanationRef`, `rankDisclosurePolicyRef`, `rankReasonRefs[]`, `travelMinutes`, `waitMinutes`, `selectedState`, `comparisonState`, `staleAt`

**HubPostureProjection**
`postureId`, `hubCoordinationCaseId`, `macroPosture = working | awaiting_patient_choice | callback_transfer_pending | confirmation_pending | booked_pending_practice_ack | booked | escalation_required | recovery_required | read_only`, `dominantActionRef`, `settlementSuppressionState`, `freshnessState`, `experienceContinuityEvidenceRef`, `recoveryRouteRef`, `staleAt`

**HubEscalationBannerProjection**
`bannerId`, `hubCoordinationCaseId`, `bannerType = too_urgent | no_trusted_supply | practice_ack_overdue | supplier_drift | stale_owner | callback_transfer_blocked`, `severityBand`, `dominantActionRef`, `announcementPriority`, `suppressionState`, `createdAt`, `resolvedAt`

Rules:

- `HubQueueWorkbenchProjection`, `HubCaseConsoleProjection`, `HubPostureProjection`, and `HubEscalationBannerProjection` must assemble under one `HubConsoleConsistencyProjection`; if bundle version, audience tier, or governing case version diverges, claim, commit, offer, callback, and return controls freeze and the shell falls to bounded refresh or recovery instead of showing contradictory queue order, candidate ranking, or booked posture
- `HubOptionCardProjection` must bind the current `CrossSiteDecisionPlan`, `NetworkCandidateSnapshot`, `NetworkCoordinationPolicyEvaluation`, `CapacityRankProof`, `CapacityRankExplanation`, `CapacityReservation`, and source-trust rows; cards may expose rank reasons, approved-variance posture, and truthful hold state, but they may not render opaque scores, fake countdowns, patient-offerable CTAs for degraded or quarantined candidates, policy-hidden candidates, or browser-local reordering
- `HubEscalationBannerProjection` is the only banner-capable surface in the console; freshness, pending confirmation, acknowledgement debt, and quiet recovery belong to the shared status strip, while banners are reserved for blockers that change the dominant action or takeover path
- queue rows and case detail must share one selected-anchor contract; live reorder or candidate refresh may buffer through `QueueChangeBatch` or inline delta stubs, but they may not move the active case, selected option, or current consequence preview out from under the coordinator while `DecisionDockFocusLease` is active
- that shared contract must preserve one `selectedAnchorTupleHashRef` across row reorder, candidate re-rank, callback-offer toggles, and same-shell recovery; if the tuple can no longer be preserved, the console must render invalidation or explicit replacement stub before any neighboring candidate or case becomes dominant
- hub console, patient choice routes, support replay, and operations drill paths may render different disclosure depths, but they must all read the same current `CapacityRankProof` and current audience-specific `CapacityRankDisclosurePolicy` instead of restating rank from raw candidate fields

Then add a timer engine with explicit thresholds:

- candidate refresh timer
- patient choice expiry timer
- required-window breach timer
- too-urgent-for-network timer
- practice-notification overdue timer

For fairness across origin practices, apply deterministic service-cost-aware deficit round robin only within the same non-critical `riskBand_i` after the above sort, so one practice cannot monopolize the queue while imminent-breach cases still bypass the fairness merge. Estimate `rho_hub_crit = lambdaHat_hub_crit * mean(expectedService_i | riskBand_i = 3) / (m_hub * muHat_hub)`. If `rho_hub_crit >= rho_hub_guard`, emit `hub.queue.overload_critical` and trigger staffing or diversion policy rather than pretending starvation freedom still holds. Otherwise, for practice `o` on each merge cycle:

- `ageDebt_o = min(1, max(0, workingMinutesBetween(queueEnteredAt_head_o, t) - A_o) / H_o)`
- `credit_o <- min(C_hub_max, credit_o + q_o + gamma_hub_age * ageDebt_o)`
- emit the head eligible case from the practice with largest `credit_o / serviceCost(head_o)`, breaking ties by stable practice key
- after emission, set `credit_o <- credit_o - serviceCost(head_o)`, with `serviceCost(head_o) = max(1, expectedService_head_o / s_hub_quantum)`

Critical or overdue bands bypass the fairness merge, and each practice's internal order must remain the stable sort key above.

A good operational rule is that the hub desk should never discover too urgent only after the clinically required window has already closed. The SLA engine should elevate those cases before failure.

### Frontend work

This is the most important staff surface of the phase.

Treat `/hub/case/:hubCoordinationCaseId` as one `PersistentShell` with one `CasePulse`, one shared status strip rendered through `AmbientStateRibbon` plus `FreshnessChip`, and one dominant `DecisionDock`. Queue, ranked options, communications, audit, and recovery are regions of the same shell, not separate route resets.

Use a **three-panel coordination layout** on wide desktop:

- **left rail:** 320-360 px queue workbench with saved views, filters, and risk bands
- **centre pane:** min 560 px ranked option stack grouped by `windowClass`
- **right rail:** 352-400 px communications, audit, blocker detail, and `DecisionDock`

Spacing should stay on the quiet-density contract: 16 px inter-region gaps, 24 px section rhythm inside rails, and one expanded option card at a time in the centre pane. The queue row, selected option card, and active consequence preview must stay pinned while live deltas buffer through `QueueChangeBatch`.

Build:

- `CasePulse` with owner, origin practice, time-to-window-close, and current open blockers
- grouped ranked option cards with one truthful dominant CTA each
- best-fit-now strip
- one-click claim, transfer, and release
- queue views by origin practice, site, or SLA risk
- right-rail `DecisionDock` replacing ad hoc sticky action rails
- escalation banner lane above the centre pane for takeover-required states only

Option card grammar must be explicit: title line for time, site, and modality; secondary line for travel, wait, and manage capability; trust and freshness chips on the same row; plain-language rank reasons beneath from the current `CapacityRankExplanation`; truthful reservation state; and no opaque numeric score. Callback is never a fake slot row: when legal, it renders as a separate fallback action card below the ranked slot groups.

Use one shared status strip for freshness, pending confirmation, acknowledgement debt, and recovery. Do not stack extra success banners. Only the current `HubEscalationBannerProjection` may break out as a banner, and only when urgency, stale ownership, supplier drift, callback-transfer blockage, or overdue practice acknowledgement changes the dominant action.

On narrow desktop or tablet, collapse the right rail to a drawer and move `DecisionDock` to a bottom sticky bar. Below the safe-width threshold, switch to `mission_stack`; fold and unfold must preserve the selected queue row, selected option card, current blocker stub, and current pending or recovery posture. Keyboard order must remain queue -> ranked options -> `DecisionDock`, and trust, urgency, and freshness cues may not rely on color alone.

If travel or convenience scoring is enabled, present that lightly. The flow already allows optional travel-time ranking, so this is the right place for it.

### Tests that must pass before moving on

- ranking determinism tests
- fixed-point breach-order convergence tests
- time-to-window-breach simulations
- fairness tests across origin practices while `rho_hub_crit < rho_hub_guard`
- fairness-floor and credit-cap tests
- critical-overload detection tests proving `hub.queue.overload_critical` triggers instead of falsely promising starvation freedom
- no-starvation tests for lower-priority but aging cases while `rho_hub_crit < rho_hub_guard`
- concurrent claim tests
- candidate refresh invalidation tests
- queue performance tests on large PCN caseloads
- option-card truthfulness tests for trust, freshness, no-hold, and callback separation
- escalation-banner arbitration tests proving the status strip and banner lane do not duplicate the same state
- keyboard-only hub navigation tests

### Exit state

The hub desk can now pull the right case forward at the right time and show the best available options without manual sorting chaos.

---

## 5E. Alternative offers, patient choice, and network-facing UX

This sub-phase turns no-perfect-slot into a real patient interaction instead of an internal dead end.

### Backend work

The fallback shape is explicit: if there is no suitable slot in the required window, the hub can offer alternatives such as a different time or site, and may also expose callback as a separate governed fallback path; if the case is too urgent, it goes back to the practice duty path.

Build `AlternativeOfferSession` as a first-class coordination object. It should support:

- slot alternatives
- different site alternatives
- different time-window alternatives
- callback fallback disclosure and transfer
- accept, decline, or no-response outcomes
- secure patient links
- TTL and expiry
- staff-assisted selection over the phone with structured read-back capture

Do not build an alternative pack by taking the next raw top-`K` candidates. The patient should receive a clinically safe and meaningfully diverse option set.

Let `bucket(s) = (siteId(s), localDayBucket(s), modality(s))` and `n_b(A_c) = sum_{s in A_c} 1[bucket(s)=b]`. Use:

- `coverage(A_c) = sum_{b in B_c} gamma_b * 1[n_b(A_c) >= 1]`
- `redundancy(A_c) = sum_{b in B_c} max(0, n_b(A_c) - 1) + eta_site * sum_{q in Q_c} max(0, n_q(A_c) - 1)`

where `B_c` is the clinically acceptable bucket universe under the current policy and `Q_c` is the set of `(siteId, localDayBucket)` clusters.

For case `c`, let `S_c^alt` be the clinically acceptable, trusted, non-dominated alternative frontier. Choose the offer set `A_c` by maximizing:

`offerUtility(A_c) = sum_{s in A_c} robustFit(c,s) + lambda_div * coverage(A_c) - lambda_dup * redundancy(A_c)`

subject to:

- `|A_c| <= K_offer`
- every `s in A_c` has `windowClass(c,s) >= 1` unless policy explicitly allows outside-window explanation cards
- at most one live offer per `capacityUnitRef`
- no more than one option per `(siteId, localDayBucket, modality)` bucket unless fewer than `K_offer` clinically acceptable buckets exist
- degraded or quarantined candidates are never patient-offerable
- if `callbackLead_i <= d_clin_i(t)`, callback may be included only as a separate fallback action card outside `A_c`; it must never occupy a ranked slot ordinal or suppress the full slot choice set
- outside-window explanation cards may explain why no in-window offer exists, but they are read-only unless policy explicitly marks them patient-offerable
- the patient-visible offer order must preserve the stable rank order from `CrossSiteDecisionPlan` and the linked `CapacityRankProof`; recommendation labels and reason chips may guide, but they may not auto-select, hide, renumber, or re-score the remaining offerable set into a single-path funnel

Also define `offerLead_i = Q_alpha(R_patient_i + C_commit_i + C_confirm_i)` under the current response and confirmation model. Alternative offers are legal only when `offerLead_i <= d_clin_i(t)`.

The algorithm should be:

1. coordinator chooses to offer alternatives
2. system solves one `AlternativeOfferOptimisationPlan` from the current `CrossSiteDecisionPlan`, selecting one best candidate per diversity bucket first and then adding only candidates with positive marginal `offerUtility(A_c)` gain; every excluded candidate must be recorded with its exclusion reason rather than disappearing into a local top-`K` truncation
3. system packages the active plan into one `AlternativeOfferSession`, one `AlternativeOfferEntry` per visible candidate, and one `AlternativeOfferFallbackCard` when callback or outside-window explanation is legal; bind them to one subject-safe `AccessGrant` issued by `AccessGrantService`, the current session and lineage fence, the governing `rankPlanVersionRef`, `capacityRankProofRef`, `rankDisclosurePolicyRef`, the active selected anchor, and the same-shell `TransitionEnvelope`, then set `HubCoordinationCase.status = alternatives_offered`
   * in the same transaction, system creates or refreshes `HubOfferToConfirmationTruthProjection` with `selectionSource = alternative_offer`, the current `candidateSnapshotRef`, the new `offerSessionRef`, current `offerOptimisationPlanRef`, `fallbackCardRef`, `offerSetHash`, current `offerExpiryAt`, `offerState = prepared`, and `closureState = blocked_by_offer`
4. once the offer is actually delivered, or a phone read-back session begins, system sets `HubCoordinationCase.status = patient_choice_pending` and refreshes `HubOfferToConfirmationTruthProjection.offerState = patient_choice_pending` plus `patientVisibilityState = choice_visible`
5. when the patient opens the choice route, validate `accessGrantRef`, `subjectRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeState`, `offerFenceEpoch`, `experienceContinuityEvidenceRef`, current `visibleOfferSetHash`, and current `HubOfferToConfirmationTruthProjection.truthTupleHash` before showing live accept, decline, or callback actions
6. patient explicitly selects one `AlternativeOfferEntry`, declines all, or requests callback from the separate `AlternativeOfferFallbackCard`
7. recommendation chips are advisory only. They may mark one `AlternativeOfferEntry.recommendationState = recommended`, but they may not preselect, renumber, hide, or collapse the remaining visible set
8. if a patient accepts an option, revalidate the chosen `AlternativeOfferEntry` against current `robustFit`, live reservation state, remaining clinical slack, current `candidateSnapshotRef`, and current `offerSetHash`; only if that revalidation still matches the active `truthTupleHash` may the system persist `selectedCandidateRef`, advance `offerState = selected`, and move the case to `coordinator_selecting` or directly to `native_booking_pending`
9. if the patient requests callback, create `HubFallbackRecord(fallbackType = callback_request)` plus `CallbackFallbackRecord`, set `HubCoordinationCase.status = callback_transfer_pending`, set `HubOfferToConfirmationTruthProjection.fallbackLinkState = callback_pending_link`, mark the current `AlternativeOfferFallbackCard.eligibilityState = selected`, and stay in the same shell until the linked `CallbackCase` and `CallbackExpectationEnvelope` exist
10. if the offer expires, is declined, remaining clinical slack falls below zero, a newer candidate snapshot supersedes the active `offerSetHash`, or subject, publication, embedded, or continuity posture drifts, create one `AlternativeOfferRegenerationSettlement`; preserve the stale option set as `read_only_provenance` with no live accept, decline, or callback mutation, and either mint a new `AlternativeOfferSession` in shell, degrade to callback-only recovery, or move to `escalated_back`

### Frontend work

There are two frontends here.

The first is the hub-staff alternative-offer composer, where staff choose what to offer and how to word it.

That composer must render the solved `AlternativeOfferOptimisationPlan`, including represented diversity buckets, excluded redundant candidates, callback-fallback eligibility, and recommendation rationale. Staff may regenerate wording or choose whether to deliver now, but they may not hand-edit the visible set into a hidden top-`K` funnel without recomputing the plan.

The second is the patient option page, which should be exceptionally clean:

- one clear title
- a short explanation
- ranked option cards
- visible site, time, and modality
- explicit recommendation chips with plain-language reasons from the current `CapacityRankExplanation.patientReasonCueRefs[]`
- the full open-choice set visible at once, not a pre-collapsed recommendation-first funnel
- no preselected option; accept requires explicit selection or structured phone read-back
- clear decline route and a separate callback fallback card
- minimal chrome
- mobile-first layout

Because NHS App web integrations still surface responsive websites and may require header and footer adjustments, design this offer page as an embed-ready route from day one. ([NHS England Digital][3])

This patient choice flow must still reuse the same request shell and selected-offer card grammar as local booking. Recommendation is advisory, not funneling: show the full patient-offerable set in one open list, keep the selected card pinned, and render callback as a separate fallback card beneath the ranked slot groups. Accept, decline, callback, and expiry states should morph in place with `TransitionEnvelope` and `AmbientStateRibbon`, not by dumping the patient into unrelated standalone pages. Reason chips, compare order, and grouped-site or grouped-day order must derive from the current `CapacityRankProof` plus `CapacityRankDisclosurePolicy`; the browser may group or hide options, but it may not re-score or renumber them. If callback fallback, offer acceptance, or later reminder contact is blocked by a degraded route, the selected offer card must remain pinned while the shell enters the same `ContactRouteRepairJourney`.

If the patient arrives through NHS App embedded mode, the offer route must fail closed on session-lineage drift, manifest drift, frozen rollout state, or any `AlternativeOfferRegenerationSettlement(triggerClass = embedded_drift | publication_drift)`. The route may preserve read-only offer context, but it may not leave stale accept or callback CTAs live.

`AlternativeOfferSession` is the route-local recovery contract for hub offers, but it is not sufficient on its own to represent current booked truth. Live accept, decline, callback, provisional selection copy, and later patient reassurance must all read the current `HubOfferToConfirmationTruthProjection`; route, publication, runtime-bundle, monotone revision, or tuple drift must preserve the last safe option set through `transitionEnvelopeRef`, `AlternativeOfferRegenerationSettlement`, and `releaseRecoveryDispositionRef` while blocking fresh mutations until the session is regenerated under the current fence tuple.

### Tests that must pass before moving on

- secure offer-link issue and expiry tests
- wrong-patient acceptance prevention
- accept-versus-expire race tests
- staff-assisted accept flow tests
- decline-all and callback-selection tests
- re-entry from accepted offer into commit flow tests
- offer-diversity and one-per-capacity-unit tests
- marginal-offer-utility and represented-bucket coverage tests
- excluded-redundancy proof tests
- recommended-open-choice visibility tests proving ranked options remain genuinely open
- recommendation-chip tests proving advisory labels never auto-select, hide, or renumber other options
- callback-card-separate-from-ranked-slots tests
- offer-lead-time gating tests
- stale-offer, stale-snapshot, and superseded-truth-tuple tests proving expired selections cannot satisfy later confirmation or fallback posture
- subject-binding, session-epoch, and embedded-rollout drift tests for alternative-offer links
- regeneration-settlement tests proving expiry, embedded drift, publication drift, or refreshed supply preserve stale provenance while blocking stale accept, decline, and callback mutations
- mobile rendering tests across common breakpoints
- accessibility tests on option cards and destructive actions
- same-shell `AlternativeOfferSession` recovery tests for embedded-rollout drift, expiry, and regenerated offer sets
- replay and backfill tests proving regenerated `HubOfferToConfirmationTruthProjection` preserves provenance but blocks stale accept or callback mutations

### Exit state

When the ideal hub slot is unavailable, the system can still produce a controlled and patient-friendly network choice flow.

---

## 5F. Native hub booking commit, practice continuity, and cross-org messaging

This sub-phase turns coordination into a booked outcome.

### Backend work

The central design truth of this phase is that many hub bookings will happen in a hub-native system, not in the same system used for local practice booking. The flow says that directly, so the platform must model it honestly.

This section is subordinate to the canonical reservation, closure, and reopen algorithm in `phase-0-the-foundation-protocol.md`. Hub coordination may adapt to different supplier surfaces, but it may not bypass `ReservationAuthority` or `LifecycleCoordinator`.

High-priority integrity gaps in this layer:

1. add a fenced, idempotent commit-attempt model so retries, duplicated clicks, or parallel workers cannot double-book the same external slot
2. add a write-ahead reconciliation path so partial failure between the native hub system and local durable state cannot orphan a real booking
3. constrain imported confirmations so unsolicited references or duplicate supplier messages cannot mint a booked outcome
4. formalize `PracticeContinuityMessage` as a first-class delivery contract with minimal disclosure, dedupe, and acknowledgement evidence
5. mirror supplier-side post-book changes so hub cancel or reschedule drift cannot leave patient and practice views falsely stable

Create a `HubBookingCommit` flow with commit modes:

- `native_api`
- `manual_pending_confirmation`
- `imported_confirmation`

Extend the runtime model for this sub-phase with:

**HubCommitAttempt**
`commitAttemptId`, `hubCoordinationCaseId`, `selectedCandidateRef`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, `capacityUnitRef`, `reservationRef`, `reservationFenceToken`, `commitMode`, `idempotencyKey`, `commandActionRecordRef`, `idempotencyRecordRef`, `adapterDispatchAttemptRef`, `latestReceiptCheckpointRef`, `adapterCorrelationKey`, `attemptState`, `journalState`, `externalResponseState`, `externalBookingRef`, `confirmationGateRef`, `confirmationEvidenceSetRef`, `confirmationConfidence`, `competingAttemptMargin`, `truthProjectionRef`, `truthTupleHash`, `reconciliationDueAt`, `createdAt`, `finalizedAt`

**HubActionRecord**
`hubActionRecordId`, `hubCoordinationCaseId`, `actionScope`, `governingObjectRef`, `caseVersionRef`, `reservationFenceToken`, `actingContextRef`, `compiledPolicyBundleRef`, `enhancedAccessPolicyRef`, `policyEvaluationRef`, `policyTupleHash`, `lineageFenceEpoch`, `idempotencyKey`, `createdByRef`, `createdAt`, `settledAt`

**HubCommitSettlement**
`settlementId`, `hubCoordinationCaseId`, `hubActionRecordRef`, `commitAttemptRef`, `result = pending_confirmation | booked_pending_ack | stale_candidate | reconciliation_required | imported_disputed | confirmation_disputed | confirmation_expired | denied_scope`, `experienceContinuityEvidenceRef`, `causalToken`, `transitionEnvelopeRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `stateConfidenceBand = high | medium | low`, `recoveryRouteRef`, `presentationArtifactRef`, `recordedAt`

**HubContinuityEvidenceProjection**
`hubContinuityEvidenceProjectionId`, `controlCode = hub_booking_manage`, `routeFamilyRef`, `routeContinuityEvidenceContractRef`, `governingObjectRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `continuityEnvelopeVersionRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `latestSettlementRef`, `latestContinuationRef`, `experienceContinuityEvidenceRef`, `continuityTupleHash`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `causalToken`, `monotoneRevision`, `capturedAt`

`HubContinuityEvidenceProjection` binds hub commit and manage shells to the assurance spine. Candidate revalidation, confirmation-pending posture, practice-acknowledgement waiting, and post-book manage recovery may not be presented as ordinary calm or writable hub state unless the current `ExperienceContinuityControlEvidence` still validates the same hub route family, selected-anchor tuple, and live publication tuple.

**PracticeContinuityMessage**
`messageId`, `hubCoordinationCaseId`, `hubAppointmentId`, `originPracticeOds`, `messageClass`, `payloadRef`, `payloadChecksum`, `dedupeKey`, `deliveryChannel`, `commandActionRecordRef`, `idempotencyRecordRef`, `adapterDispatchAttemptRef`, `latestReceiptCheckpointRef`, `visibilityEnvelopeVersionRef`, `deliveryModelVersionRef`, `practiceVisibilityPolicyRef`, `serviceObligationPolicyRef`, `policyEvaluationRef`, `policyTupleHash`, `transportAckState = none | accepted | rejected | timed_out`, `deliveryEvidenceState = pending | delivered | failed | disputed | expired`, `deliveryRiskState = on_track | at_risk | likely_failed | disputed`, `deliveryAttemptCount`, `firstDeliveredAt`, `ackGeneration`, `ackState = not_required | pending | acknowledged | disputed | overdue | recovery_required`, `ackDueAt`, `ackEvidenceRef`, `truthProjectionRef`, `truthTupleHash`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`, `stateConfidenceBand = high | medium | low`, `causalToken`, `monotoneRevision`

`PracticeContinuityMessage` is the minimum-necessary outward delivery contract to the origin practice. It must distinguish provider or transport acceptance from evidence-bound delivery and from generation-satisfying acknowledgement so hub and origin-practice shells never collapse a weak send into calm visibility. It is also bound to the same canonical replay ledger as other external effects, so a MESH retry, API resend, or duplicate callback updates one live delivery chain instead of inventing parallel visibility truth for the same `ackGeneration`. It must also cite the exact current `HubPracticeVisibilityPolicy`, `HubServiceObligationPolicy`, and `NetworkCoordinationPolicyEvaluation` that minted the live visibility duty.

`PracticeContinuityMessage` must bind the current `visibilityEnvelopeVersionRef`, delivery-model version, and monotone revision. An older, lower-confidence, or stale-envelope message may remain auditable, but it may not supersede a newer generation, thaw a recovery route, or clear acknowledgement debt minted by a later material change.

**HubSupplierMirrorState**
`mirrorStateId`, `hubAppointmentId`, `supplierSystem`, `supplierVersion`, `lastSyncAt`, `nextSyncDueAt`, `driftState = aligned | pending_review | drift_detected | disputed | reconciled`, `manageFreezeState = live | frozen`, `lastObservedStatus`, `latestContinuityMessageRef`, `transitionEnvelopeRef`, `stateConfidenceBand = high | medium | low`, `causalToken`, `monotoneRevision`, `reopenTaskRef`

`HubSupplierMirrorState` is monotone-safe. Later evidence may widen recovery or reopen posture, but an older sync snapshot, stale callback, or replayed supplier payload may not downgrade a more severe `driftState`, clear `manageFreezeState`, or supersede a newer continuity message.

The algorithm should be:

1. coordinator selects a candidate and resolves exactly one governing `HubCoordinationCase`, candidate, current `ActingContext`, current `ActingContext.scopeTupleHash`, one current `NetworkCoordinationPolicyEvaluation(evaluationScope = commit_attempt)`, and, where cross-organisation visibility applies, one current `CrossOrganisationVisibilityEnvelope` through `ScopedMutationGate`; the gate must bind the current case version, compiled policy bundle, policy tuple, and lineage fence before any commit work starts
2. system writes one `HubActionRecord` for `actionScope = commit_native_booking | record_manual_confirmation | import_supplier_confirmation`
3. system asks `ReservationAuthority` to create or refresh `CapacityReservation` for that `capacityUnitRef` and receives a reservation fence token or reservation epoch
4. system creates exactly one active `HubCommitAttempt` for the case, candidate, reservation, and commit mode; if another live attempt exists for the same case or `capacityUnitRef`, reject the new attempt and return the current attempt state instead of starting over
   * every active `HubCommitAttempt` must bind the current `HubOfferToConfirmationTruthProjection.truthTupleHash` plus the current `providerAdapterBindingHash`; if the active tuple has drifted because the offer expired, the candidate snapshot changed, fallback linkage changed, the provider binding changed, or a newer practice-visibility generation already exists, the attempt is denied as stale before any side effect
5. system sets `HubCoordinationCase.status = candidate_revalidating`
6. system refreshes the selected candidate against current capacity source, `sourceVersion`, snapshot expiry, the current routing, variance-window, and capacity-ingestion policy outputs, source trust state, and the reservation fence token
7. if the candidate is stale, unavailable, sourced only from degraded or quarantined trust, no longer policy-valid, or the fence token has changed, persist the failure reason, mark the attempt failed as stale, return `HubCommitSettlement.result = stale_candidate`, release the reservation, and return the case to `candidate_searching` or `candidates_ready`
8. only after successful revalidation does the system set `HubCoordinationCase.status = native_booking_pending` and durably write a commit-intent journal record before any external side effect occurs
9. if a real hold is supported, convert the reservation to `held` and bind the hold token to the active commit attempt; if not, keep the reservation non-exclusive and do not imply exclusivity to the user
10. for `native_api`, call the native booking adapter exactly once per `idempotencyKey`, using the current `BookingProviderAdapterBinding` resolved for the selected candidate, one canonical `AdapterDispatchAttempt` bound to the `HubCommitAttempt`, the same serialized capacity claim, the reservation fence token, and an adapter correlation key that the supplier must echo in confirmation payloads
11. for `manual_pending_confirmation`, coordinator records structured proof into `HubBookingEvidenceBundle` bound to the same `truthTupleHash`; manual proof may advance only to `pending_confirmation`, and weak or manual paths must carry at least two independent `evidenceSourceFamilies[]` before `confirmed` is legal
12. for `imported_confirmation`, accept a supplier confirmation only if it matches an open `HubCommitAttempt` or governed intake queue item on supplier organisation, `capacityUnitRef`, source version or supplier version, booking reference, and a bounded time window, and only after the inbound payload has been accepted through `AdapterReceiptCheckpoint`; otherwise route it to `disputed`, return `HubCommitSettlement.result = imported_disputed`, and require manual adjudication
13. after every adapter response, manual proof capture, or imported confirmation, recompute the linked `ExternalConfirmationGate` under the canonical Phase 0 Bayesian gate model, persist `HubCommitAttempt.confirmationConfidence` and `HubCommitAttempt.competingAttemptMargin`, and refresh `HubOfferToConfirmationTruthProjection.confirmationTruthState`
14. if the hard-match set fails, contradictory evidence arrives, or `confirmationConfidence` stays below `tau_hold` past deadline, mark the attempt `disputed` or `expired`, release any non-held reservation, return `HubCommitSettlement.result = confirmation_disputed | confirmation_expired` as applicable, and block final booked posture
15. if hub confirmation is async, ambiguous, or below `tau_confirm`, keep the reservation and attempt in `pending_confirmation` or `disputed`, create or keep the relevant `ExternalConfirmationGate`, return `HubCommitSettlement.result = pending_confirmation`, do not create final patient assurance text, and block request closure
16. if the adapter times out or the local commit path fails after uncertainty about external side effects, set `HubCommitAttempt.attemptState = reconciliation_required`, keep the reservation fenced, return `HubCommitSettlement.result = reconciliation_required`, and hand the case to a reconciliation worker; do not open a second live attempt until reconciliation finishes
17. only when the linked gate passes all hard matches, `confirmationConfidence >= tau_confirm`, `competingAttemptMargin >= delta_confirm`, and the active `providerAdapterBindingHash` plus `truthTupleHash` still name the same selected candidate and source version may the system append the supplier response artifact to the commit journal, create or update `HubAppointmentRecord`, mark the reservation `confirmed`, and keep the origin `BookingCase` in legal Phase 4 states only
18. create `PracticeContinuityMessage` from the confirmed appointment using minimum necessary booking data, a deterministic `dedupeKey`, payload checksum, channel choice, acknowledgement due time, the current `visibilityEnvelopeVersionRef`, the current `HubPracticeVisibilityPolicy`, the current `HubServiceObligationPolicy`, one `NetworkCoordinationPolicyEvaluation(evaluationScope = practice_visibility_generation)`, a new `ackGeneration`, and the same `truthTupleHash`; delivery must flow through an outbox and the same canonical adapter effect ledger so API retries and MESH retries remain idempotent
19. once authoritative hub confirmation exists for the active attempt and gate state, create any required local proxy or bridge reference, update the origin `BookingCase` to `status = managed`, set `HubCoordinationCase.practiceAckGeneration` to the current `ackGeneration`, set `HubAppointmentRecord.practiceAcknowledgementState = pending`, refresh `HubOfferToConfirmationTruthProjection` to `confirmationTruthState = confirmed_pending_practice_ack` and `practiceVisibilityState = ack_pending`, set `HubCoordinationCase.status = booked_pending_practice_ack`, and return `HubCommitSettlement.result = booked_pending_ack`
20. send patient and practice notifications with wording that matches the actual confirmation and acknowledgement state; patient-facing appointment-confirmed language may render once authoritative hub confirmation exists and the patient continuation or delivery contract is durably committed, but any claim that the origin practice has seen or acknowledged the booking must remain blocked until the current practice-visibility generation is satisfied by acknowledgement evidence, an audited no-ack-required policy exception, or other continuity-delivery proof explicitly allowed by the current `HubPracticeVisibilityPolicy`
21. once the origin practice satisfies the current `ackGeneration` by API acknowledgement, MESH delivery evidence plus governed staff acknowledgement, or equivalent approved evidence, persist that evidence on `PracticeAcknowledgementRecord`, require the evidence to match the live `truthTupleHash`, current `ackGeneration`, and current `NetworkCoordinationPolicyEvaluation`, set `HubAppointmentRecord.practiceAcknowledgementState = acknowledged`, refresh `HubOfferToConfirmationTruthProjection` to `confirmationTruthState = confirmed` and `practiceVisibilityState = acknowledged`, transition the hub case to `booked`, and emit the booked-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`; stale-generation, stale-tuple, policy-stale, or transport-only evidence may not silently clear the latest acknowledgement debt
22. once booked proof, practice visibility, patient-facing projections, and any required fallback linkage are all durably committed and `HubOfferToConfirmationTruthProjection.closureState = closable`, ask `LifecycleCoordinator` to evaluate request closure
23. after booking, start `HubSupplierMirrorState` for the external appointment; any supplier-side cancellation, reschedule, or status drift must increment `HubSupplierMirrorState.monotoneRevision`, freeze stale manage actions, emit a new continuity message, and invoke the canonical correction or reopen path rather than leaving the case silently booked

Never write `network_booked_pending_practice_ack` or any other hub-only value into `BookingCase.status`. The origin booking lineage must use only legal Phase 4 states.

The hub must use the same `ReservationAuthority` or a strictly serialized bridge keyed to the same `capacityUnitRef` so local, waitlist, and hub flows cannot oversubscribe the same slot.

`HubCommitAttempt` is the only object allowed to talk to a native booking adapter or ingest an imported confirmation into a booked outcome. `HubCoordinationCase` and UI actions may request a commit, but they may not directly mint a booking.

`HubCommitAttempt` must also carry the live `providerAdapterBindingRef` and `providerAdapterBindingHash`. Imported or native confirmation that matches supplier identifiers but not the current binding may remain evidence only; it must not settle booked truth or thaw stale hub manage posture.

`HubActionRecord` and `HubCommitSettlement` are the only same-shell mutation and settlement contracts allowed to advance commit UI posture. Local button state, optimistic banners, or imported supplier messages may not bypass those contracts.

`HubCommitSettlement` must remain route-bound and publication-bound. If route contract, publication, runtime bundle, or continuity posture drifts before settlement, the shell must preserve the last safe receipt through `transitionEnvelopeRef` and `releaseRecoveryDispositionRef` rather than leaving fresh commit CTAs or calm booked copy live.

`HubCommitAttempt`, `HubBookingEvidenceBundle`, `HubAppointmentRecord`, `PracticeContinuityMessage`, and `PracticeAcknowledgementRecord` must all carry the same live `truthTupleHash` from `HubOfferToConfirmationTruthProjection`. If a newer offer session, candidate snapshot, fallback transfer, supplier drift event, or practice-visibility generation supersedes that tuple, older objects stay auditable only; they may not confirm the case, clear acknowledgement debt, or drive patient or practice posture forward.

Practice acknowledgement is generation-bound: an acknowledgement for generation `g` can satisfy only the continuity delta and practice-visibility evaluation that minted `g` and must not silently clear later cancellation, reschedule, callback-fallback, supplier-drift, or policy-tuple changes.

The commit shell must also bind `HubContinuityEvidenceProjection`. If commit continuity evidence is stale, blocked, or degraded, the shell may keep the selected candidate, reservation context, and latest proof artifact visible, but it must not present a quiet booked state or fresh commit CTA until continuity evidence is refreshed for the active route family.

Rollout and backfill must be explicit. For every open `HubCoordinationCase`, run a projection backfill that derives one current `HubOfferToConfirmationTruthProjection` from the newest live offer session, selected candidate, active commit attempt, appointment record, continuity message, acknowledgement record, and fallback record. If backfill finds competing live tuples or ambiguous lineage, the case must land in `confirmationTruthState = disputed` or `practiceVisibilityState = recovery_required`, stay open, and route to supervised reconciliation; migration may not guess a calmer booked state.

For manual commit, require structured fields:

- hub site
- date and time
- modality
- clinician or clinician type
- native booking reference if available
- operator identity
- confirmation source
- independent confirmation method
- confirmation due time

That makes manual native booking auditable rather than anecdotal and prevents operator proof alone from minting a false booked outcome.

Where direct practice-to-hub APIs are not available, add a `PracticeContinuityMessage` path. MESH is still an appropriate secure fallback for cross-organisation messages and files, so this is the right place to integrate or simulate that adapter if direct interop is missing. ([NHS England Digital][5]) `PracticeContinuityMessage` should carry only minimum necessary operational data, reference richer evidence by pointer rather than embedding it, and treat MESH receipts, checksum validation, transport acceptance, delivery evidence, and current-generation acknowledgement evidence as separate first-class facts rather than one collapsed "delivered" state.

Add these services:

- `services/hub-commit-orchestrator`
- `services/hub-booking-reconciler`
- `services/practice-continuity-outbox`
- `services/hub-supplier-mirror`

### Frontend work

The booking-commit UI should be serious and friction-appropriate.

Build:

- candidate confirmation drawer
- manual native-booking proof modal
- confirmation-pending child state
- booked-state confirmation child state
- patient and practice notification preview under secondary disclosure
- practice-acknowledgement indicator
- commit-attempt timeline with reconciliation-required state
- disputed imported-confirmation review state
- continuity-delivery evidence drawer
- supplier-drift banner that freezes stale manage actions
- same-shell `HubCommitSettlement` receipt and recovery panel

The design should feel precise, not bureaucratic. Staff need confidence that the case is really booked and really visible to the origin practice.

`confirmation_pending` and `booked_pending_practice_ack` are distinct postures. The selected candidate card must stay pinned, and the shell must render separate evidence rows for supplier confirmation, patient-facing notification, and origin-practice visibility. Local acknowledgement or transport acceptance may acknowledge progress, but they may not tint the shell as fully booked or practice-visible before the governing evidence exists.

Candidate revalidation, pending confirmation, booked, acknowledgement-pending, reconciliation-required, and drift-detected should all stay within one stable staff shell. Use local card or pane state plus bounded progress envelopes, and never force a hard navigation just because confirmation moved from transport-accepted or provider-accepted to awaiting external acknowledgement evidence.

### Tests that must pass before moving on

- native adapter contract tests
- scoped-mutation-gate and same-shell `HubCommitSettlement` tests across native, manual, and imported commit modes
- idempotent retry and reservation-fence tests for `HubCommitAttempt`
- reconciliation tests for external-success and local-failure split-brain paths
- manual booking proof-completeness tests
- duplicate-confirm prevention tests
- imported-confirmation correlation tests for wrong case, wrong slot, wrong supplier, and late duplicate payloads
- ambiguous booking confirmation tests
- Bayesian confirmation-gate threshold and competing-attempt margin tests
- independent-confirmation-required tests for manual booking
- practice-notification idempotency tests
- separate patient-confirmed versus practice-acknowledged posture tests
- generation-bound practice-acknowledgement tests
- truth-tuple correlation tests across `AlternativeOfferSession`, `HubCommitAttempt`, `HubBookingEvidenceBundle`, `HubAppointmentRecord`, `PracticeContinuityMessage`, and `PracticeAcknowledgementRecord`
- continuity-message minimum-disclosure and checksum-validation tests
- MESH fallback contract tests
- no-close-before-booked-proof tests
- no-close-before-latest-required-practice-ack tests
- supplier cancel or reschedule drift propagation tests
- full audit tests on manual and API commit modes
- route-contract, publication, and runtime-bundle drift tests for same-shell `HubCommitSettlement`
- monotone `HubSupplierMirrorState` freeze-and-recovery tests
- projection-backfill tests for open hub cases with stale offers, pending confirmation, duplicate acknowledgements, and callback-transfer debt

### Exit state

A network case can now become a real booked appointment without dropping out of Vecells just because the hub uses a different native booking surface, while fenced commit attempts, split-brain reconciliation, governed imported confirmations, continuity-message evidence, and supplier-drift monitoring prevent the most dangerous booking-integrity failures.

## 5G. No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics

This sub-phase makes failure safe.

### Backend work

The flow is very clear: if no suitable slot exists in the current window, the hub can offer alternatives; if the case is too urgent, it escalates back to the practice duty clinician.

Alternative offers, callback fallback, and return-to-practice logic must still defer to the canonical Phase 0 reservation, safety, and lifecycle rules. No hub-local shortcut may mint exclusivity, suppress safety preemption, or close a request independently.

When a case arrives from Phase 4 because local waitlist is no longer safe, the handoff must carry the latest `WaitlistDeadlineEvaluation`, `WaitlistFallbackObligation`, and `WaitlistContinuationTruthProjection`. Hub users may inspect that evidence, but they may not silently reopen local waitlist posture or reframe the case as ordinary search failure unless a newer evaluation explicitly supersedes the old fallback obligation.

Build these fallback objects:

**HubReturnToPracticeRecord**  
`returnId`, `hubCoordinationCaseId`, `returnType`, `reasonCode`, `priorityUpgrade`, `urgencyCarryFloor`, `returnedTaskRef`, `returnedAt`

**CallbackFallbackRecord**  
`callbackFallbackId`, `hubCoordinationCaseId`, `sourceOfferSessionRef`, `sourceFallbackCardRef`, `callbackUrgency`, `preferredWindow`, `contactRoute`, `patientInformedAt`

**HubCoordinationException**  
`exceptionId`, `hubCoordinationCaseId`, `exceptionType`, `severity`, `retryState`, `escalationState`

Use this algorithm:

Let `offerLead_i = Q_alpha(R_patient_i + C_commit_i + C_confirm_i)` under the current patient-response and confirmation model, and let `callbackLead_i = Q_alpha(C_callback_i + C_return_i)` under the current callback or reassessment model.

1. no suitable trusted candidate exists in the clinically required window
2. if a clinically acceptable trusted alternative frontier exists and `offerLead_i <= d_clin_i(t)`, create an `AlternativeOfferOptimisationPlan` plus `AlternativeOfferSession`, resolve each option to canonical `capacityUnitRef`, keep callback as a separate `AlternativeOfferFallbackCard` when legal, and set `HubCoordinationCase.status = alternatives_offered`
3. if the patient wants callback, or policy requires callback rather than slot choice, and `callbackLead_i <= d_clin_i(t)`, create `HubFallbackRecord(fallbackType = callback_request)` plus `CallbackFallbackRecord`, link any `sourceOfferSessionRef` and `sourceFallbackCardRef`, and set `HubCoordinationCase.status = callback_transfer_pending`
4. if alternatives are not clinically acceptable, only degraded evidence exists, or the relevant lead-time inequality fails, create `HubFallbackRecord(fallbackType = return_to_practice)` plus `HubReturnToPracticeRecord` with `urgencyCarryFloor = max(P_breach_i(t), trustGap_i, urgencyCarry_i)` and set `HubCoordinationCase.status = escalated_back`
5. if return-to-practice was chosen, reopen or create the originating practice task with explicit reason, raised priority, and `urgencyCarry <- max(existingUrgencyCarry, urgencyCarryFloor)`
6. if return-to-practice was chosen, reacquire the triage-side lease so `LifecycleCoordinator` may derive `Request.workflowState = triage_active`
7. if callback was chosen, create or link the governed `CallbackCase`, publish the current `CallbackExpectationEnvelope`, set `HubFallbackRecord.state = transferred`, and only then move the case to `callback_offered`
8. inform the patient of what happens next using the active `HubFallbackRecord` and, for callback, the published `CallbackExpectationEnvelope`
9. prevent ping-pong by tracking `bounceCount_i` and `noveltyScore_i`, where `noveltyScore_i = max(deltaBestTrustedFit_i, newClinicalContext_i, priorityUpgrade_i)` on normalized `[0,1]` inputs; if `bounceCount_i >= B_max` and `noveltyScore_i < tau_novelty`, escalate to supervisor review instead of recirculating to ordinary hub flow
10. only close the hub case after the return-to-practice workflow or callback workflow has been durably linked to the original request lineage and the active `HubFallbackRecord` has reached `state = transferred | completed`

Any hub alternative offer, and any callback flow that still carries a concrete slot option, must follow the same reservation rules as local booking: one active consumer offer per `capacityUnitRef` when no true hold exists, and no fake exclusivity language. Degraded or quarantined candidates may inform the rationale for fallback, but they may not satisfy the clinically acceptable trusted frontier required for patient offer.

Add a hard stop on infinite loops. If the same case is returned from practice to hub more than a configured threshold without new capacity or new clinical context, escalate to supervisor review.

`CallbackFallbackRecord` must also bind the canonical `CallbackExpectationEnvelope` from `callback-and-clinician-messaging-loop.md`. Until that envelope exists for the current fallback fence, the hub shell stays in `callback_transfer_pending` and the case remains open.

Selecting callback from a live `AlternativeOfferSession` may not collapse the open-choice set into a fake callback slot or erase the prior option context. The active `AlternativeOfferSession` and `AlternativeOfferFallbackCard` remain visible as `read_only_provenance` until callback linkage settles or a newer regeneration settlement supersedes them.

If Phase 4 already transferred the case into governed callback fallback before hub ownership began, the current `CallbackExpectationEnvelope` remains the patient-facing truth. Hub tooling may observe, repair, or escalate that path, but it may not restore calmer `still waiting for a local slot` language from stale pre-fallback waitlist state.

### Frontend work

Build a clear no-slot resolution panel inside the hub console. It must stay inside the same `HubCaseConsoleProjection`; switching from ranked options to callback or return-to-practice may not blank the option context, rationale, or current blocker state.

It should support:

- offer alternatives
- switch to callback
- escalate back to duty clinician
- capture rationale
- preview patient message
- preview practice return task

When urgency is the issue, the UI must look urgent. Not red for decoration, but unmistakably a different mode from ordinary coordination.

### Tests that must pass before moving on

- no-slot-to-alternatives tests
- no-slot-to-callback tests
- lead-time inequality tests for alternatives and callback fallback
- too-urgent return tests
- reopened practice-task context tests
- loop-prevention tests
- callback-transfer-pending to callback-offered continuity tests
- bounce-novelty supervisor-escalation tests
- patient-informed state tests
- escalation timer tests
- end-to-end local fail to hub to return to practice tests

### Exit state

The hub desk can now fail safely and explicitly, instead of leaving difficult cases in indefinite coordination limbo.

---

## 5H. Patient communications, network reminders, manage flows, and practice visibility

This sub-phase makes network appointments feel like part of the same product.

### Backend work

High-priority integrity gaps in this layer:

1. `NetworkReminderPlan` is too thin to govern contact-route health, delivery dispute, template versioning, or reminder suppression when the appointment is still provisional
2. `PracticeVisibilityProjection` can currently drift from patient-facing truth and overexpose cross-organisation detail because it lacks one minimum-necessary consistency envelope
3. `NetworkManageCapabilities` is only a flag set, not a live capability lease bound to supplier truth, policy, and fallback posture
4. network manage actions do not yet have an explicit same-shell settlement and recovery contract for stale, blocked, or reconciliation-bound hub states
5. practice acknowledgement covers first booking visibility, but not later cancellation, reschedule, reminder failure, or supplier-drift propagation to the origin practice

Extend the appointment lifecycle from Phase 4 so that a `HubAppointmentRecord` can participate in the same communication and status system as local appointments without inventing a second manage model.

Build:

**NetworkReminderPlan**  
`reminderPlanId`, `hubAppointmentId`, `threadId`, `conversationClusterRef`, `conversationSubthreadRef`, `communicationEnvelopeRef`, `templateSetRef`, `templateVersionRef`, `routeProfileRef`, `channel`, `payloadRef`, `contactRouteRef`, `contactRouteVersionRef`, `currentContactRouteSnapshotRef`, `reachabilityDependencyRef`, `currentReachabilityAssessmentRef`, `reachabilityEpoch`, `contactRepairJourneyRef`, `deliveryModelVersionRef`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`, `scheduleRefs`, `scheduleState = draft | scheduled | queued | sent | delivery_blocked | disputed | cancelled | completed`, `transportAckState = none | accepted | rejected | timed_out`, `deliveryEvidenceState = pending | delivered | disputed | failed | expired | suppressed`, `deliveryRiskState = on_track | at_risk | likely_failed | disputed`, `authoritativeOutcomeState = scheduled | awaiting_delivery_truth | delivered | callback_fallback | settled | recovery_required | suppressed`, `stateConfidenceBand = high | medium | low`, `suppressionReasonRefs`, `deliveryEvidenceRefs`, `lastDeliveryAttemptAt`, `nextAttemptAt`, `causalToken`, `monotoneRevision`

**PracticeVisibilityProjection**  
`hubCoordinationCaseId`, `hubAppointmentId`, `originPracticeOds`, `bundleVersion`, `entityVersionRefs`, `minimumNecessaryViewRef`, `visibilityEnvelopeVersionRef`, `crossOrganisationVisibilityEnvelopeRef`, `actingContextRef`, `actingScopeTupleRef`, `practiceVisibilityPolicyRef`, `serviceObligationPolicyRef`, `policyEvaluationRef`, `policyTupleHash`, `slotSummaryRef`, `confirmationState`, `patientFacingStateRef`, `notificationState`, `ackGeneration`, `practiceAcknowledgementState = not_required | pending | acknowledged | disputed | overdue | recovery_required`, `manageSettlementState`, `supplierMirrorState`, `latestContinuityMessageRef`, `truthProjectionRef`, `truthTupleHash`, `experienceContinuityEvidenceRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`, `stateConfidenceBand = high | medium | low`, `actionRequiredState`, `causalToken`, `monotoneRevision`, `staleAt`

**NetworkManageCapabilities**  
`capabilitySetId`, `hubAppointmentId`, `bookingCaseId`, `capabilityLeaseExpiresAt`, `entityVersionRef`, `consistencyToken`, `compiledPolicyBundleRef`, `enhancedAccessPolicyRef`, `practiceVisibilityPolicyRef`, `policyEvaluationRef`, `policyTupleHash`, `supplierCapabilityProfileRef`, `routeIntentRef`, `subjectRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeState = monitoring | frozen | kill_switch_active | rollback_recommended | released`, `mutationGateRef`, `capabilityState = live | stale | blocked | expired`, `canCancel`, `canReschedule`, `canRequestCallback`, `canUpdateDetails`, `readOnlyMode = interactive | read_only`, `fallbackRouteRef`, `blockedByRefs[]`, `releaseRecoveryDispositionRef`, `stateConfidenceBand = high | medium | low`, `causalToken`, `monotoneRevision`

**HubManageSettlement**
`settlementId`, `hubAppointmentId`, `actionScope`, `routeIntentRef`, `mutationGateRef`, `lineageFenceEpoch`, `result = applied | provider_pending | stale_recoverable | blocked_dependency | identity_recheck_required | reconciliation_required | unsupported_capability`, `experienceContinuityEvidenceRef`, `causalToken`, `transitionEnvelopeRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `stateConfidenceBand = high | medium | low`, `recoveryRouteRef`, `presentationArtifactRef`, `recordedAt`

**PracticeVisibilityDeltaRecord**
`deltaRecordId`, `hubAppointmentId`, `changeClass = booked | acknowledged | cancelled | rescheduled | reminder_failed | supplier_drift | callback_fallback | reopened`, `sourceEventRef`, `continuityMessageRef`, `visibilityEnvelopeVersionRef`, `ackGeneration`, `materialChangeHash`, `ackState = not_required | pending | acknowledged | disputed | overdue | recovery_required`, `practiceProjectionVersionRef`, `stateConfidenceBand = high | medium | low`, `causalToken`, `monotoneRevision`, `createdAt`

Align this sub-phase with `patient-account-and-communications-blueprint.md` so network appointment states, callback fallbacks, and patient communication timelines appear in one unified patient account model rather than as isolated flow pages.

This matters because the current DES still requires Enhanced Access reminders and a simple way for patients to cancel appointments at all times, and it requires the Network Standard Hours appointment book to be accessible to core network practices. ([NHS England][4])

Rules:

- create `NetworkReminderPlan` only after authoritative hub confirmation exists for the active appointment; provisional, disputed, or confirmation-pending hub bookings may show reminder intent, but they may not send ordinary booked reminders
- reminder scheduling and delivery must bind to the active contact route, `contactRouteVersionRef`, current `ContactRouteSnapshot`, template version, route profile, `ReachabilityDependency`, current `ReachabilityAssessmentRecord`, `ContactRouteRepairJourney`, `artifactPresentationContractRef`, and `outboundNavigationGrantPolicyRef`; delivery failure, channel dispute, route invalidation, stale verification, or elevated reminder-delivery risk must move `NetworkReminderPlan.scheduleState` to `delivery_blocked | disputed`, update `deliveryRiskState`, suppress stale reminder assurance, and surface repair or recovery in the same patient shell through `transitionEnvelopeRef` and `releaseRecoveryDispositionRef`
- reminder delivery, reminder failure, and callback fallback must also publish through the same `threadId`, `conversationSubthreadRef`, and `communicationEnvelopeRef` consumed by `ConversationThreadProjection`, `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement`; reminder chips, callback fallback cards, and appointment banners may summarize that state, but they may not become a detached communication truth source
- reminder recovery, callback fallback, and manage re-entry may not reopen ordinary cancel, reschedule, or callback-request posture until the linked `ContactRouteVerificationCheckpoint.rebindState = rebound`, the current `ReachabilityAssessmentRecord` is `clear` with `routeAuthorityState = current`, and the current hub continuity evidence still validates the same appointment lineage
- `PracticeVisibilityProjection` must assemble under one minimum-necessary consistency envelope shared with the patient-facing hub appointment state, the current `HubOfferToConfirmationTruthProjection`, and the current `CrossOrganisationVisibilityEnvelope` so origin-practice users can see operational truth without inferring or exposing richer hub-only detail than policy allows; the projection must persist `ackGeneration`, the bound `visibilityEnvelopeVersionRef`, the current `actingScopeTupleRef`, the current `HubPracticeVisibilityPolicy`, the current `HubServiceObligationPolicy`, the current `NetworkCoordinationPolicyEvaluation(evaluationScope = manage_exposure | practice_visibility_generation)`, and the current `truthTupleHash` so stale acknowledgements, stale policy tuples, or stale organisation scope cannot satisfy newer material changes
- `PracticeVisibilityProjection` and `PracticeContinuityMessage` must advance monotonically together: an older envelope, lower-confidence delivery update, or stale supplier status may remain visible for audit, but it may not overwrite a newer `ackGeneration`, `stateConfidenceBand`, or continuity-evidence state
- if organisation switching, purpose-of-use drift, or `CrossOrganisationVisibilityEnvelope.envelopeState != current` invalidates the current scope, the same shell must degrade to read-only or recovery posture rather than silently reinterpreting practice visibility under the new scope
- patient-facing appointment confirmation and origin-practice visibility are orthogonal facets of the same `HubOfferToConfirmationTruthProjection`: once authoritative hub confirmation exists and the current patient projection or delivery contract is durable, the patient shell may render the appointment as confirmed; `practice informed` and `practice acknowledged` must remain separate disclosed states and may not be implied, hidden, or used as a gate on patient confirmation copy
- `NetworkManageCapabilities` must be leased from current supplier truth, the current compiled hub policy bundle, the current `HubPracticeVisibilityPolicy`, one current `NetworkCoordinationPolicyEvaluation(evaluationScope = manage_exposure)`, and the current hub appointment version; if supplier drift, acknowledgement debt, identity hold, delivery dispute, policy-tuple drift, or unsupported route blocks an action, the capability set must morph to `capabilityState = blocked | stale | expired` and `readOnlyMode = read_only` with a typed fallback route instead of leaving stale CTAs live
- `NetworkManageCapabilities` must also bind the current `routeIntentRef`, `subjectRef`, `sessionEpochRef`, `subjectBindingVersionRef`, and, when embedded, `manifestVersionRef`, `releaseApprovalFreezeRef`, and `channelReleaseFreezeState`; drift in any of those fences must downgrade the route to typed recovery or read-only posture rather than leaving stale patient manage CTAs live
- every cancel, reschedule, callback-request, or details-update mutation on a hub appointment must traverse `ScopedMutationGate` and return `HubManageSettlement` in the same shell; stale, blocked, unsupported, identity-held, embedded-frozen, or reconciliation-bound outcomes must stay inside the hub appointment route family rather than redirecting the user to generic support or pretending success
- patient-visible manage posture, provisional booking reassurance, and supplier-drift recovery must also bind `HubContinuityEvidenceProjection`; if the linked `experienceContinuityEvidenceRef` is stale, blocked, or degraded, the shell may preserve the current appointment anchor and latest safe receipt, but it must not re-enable ordinary manage controls or quiet-success copy
- each booking, acknowledgement, cancellation, reschedule, reminder failure, supplier-drift, or fallback event must append `PracticeVisibilityDeltaRecord`, refresh `PracticeVisibilityProjection`, increment or reaffirm the active `ackGeneration` on `HubCoordinationCase` whenever the origin practice must re-acknowledge a material change, and reopen or refresh `PracticeAcknowledgementRecord` when the origin practice must re-acknowledge the changed state
- `PracticeVisibilityDeltaRecord` is monotone-safe: replayed or stale delta events may not lower `ackGeneration`, reduce `stateConfidenceBand`, or supersede a newer `visibilityEnvelopeVersionRef`
- `PracticeAcknowledgementRecord` is generation-bound: only an acknowledgement with `ackGeneration = PracticeVisibilityProjection.ackGeneration` satisfies the current continuity debt; older acknowledgements remain auditable but do not clear newer deltas

For booked hub cases, create or update the `PracticeVisibilityProjection` immediately and open or refresh a `PracticeAcknowledgementRecord`. Until acknowledgement is received for the current `ackGeneration`, the case remains `booked_pending_practice_ack`, stays visible in the hub desk and origin-practice view, and participates in overdue timers. Booked hub cases should only become closable once that acknowledgement is present for the latest required generation or an explicit, audited no-ack-required policy exception applies. The same rule applies again after any later cancellation, reschedule, callback fallback, or supplier-drift event that materially changes what the origin practice must know.

For patient manage flows, reuse the Phase 4 portal patterns rather than inventing a second booking UI. If network reschedule is not truly supported for a given hub route, expose the best supported fallback honestly through `NetworkManageCapabilities.fallbackRouteRef`: cancellation plus callback request, or assisted contact. Apply the same admin-only guardrail as Phase 4 to manage forms: clinically meaningful free text or new symptom content must route back through the governed request shell and safety-preemption path rather than mutate the hub appointment directly. If booking confirmation is still pending, if supplier drift is unresolved, if delivery and identity dependencies are blocking trust, or if session-lineage or embedded rollout fences have drifted, show a provisional or recovery manage state rather than a normal manage screen.

### Frontend work

Build three polished patient-facing views:

- network appointment confirmation
- manage network appointment
- network alternative or callback outcome

Also add a practice-side visibility panel in the staff workspace so the origin practice can see:

- that the case moved to hub
- whether it is confirmation-pending, booked-pending-ack, or fully booked
- where and when
- what the patient was told
- whether cancellation or changes occurred later
- whether the practice has acknowledged receipt

The patient UI should stay light, calm, and consistent with the rest of Vecells. The practice UI should stay dense and operational. Both should feel like the same product family.

The patient confirmation view must separate `Appointment confirmed`, `Practice informed`, and `Practice acknowledged` into distinct cues. Only the first is primary patient reassurance; the latter two are secondary operational disclosures or absent only when the current `HubPracticeVisibilityPolicy` says to hide them. The practice-side visibility panel should make acknowledgement debt dominant when present, with the exact patient-facing wording shown in secondary disclosure rather than inferred from macro status.

### Tests that must pass before moving on

- reminder-scheduling tests for hub appointments
- network cancellation route tests
- manage-capability exposure tests
- practice visibility projection tests
- practice-acknowledgement overdue tests
- stale-notification recovery tests
- patient status consistency tests
- patient-confirmed-versus-practice-visible state separation tests
- destructive-action confirmation accessibility tests
- end-to-end confirmed hub appointment to reminder to cancel flow tests
- reminder suppression and recovery tests for provisional booking, route invalidation, and delivery dispute
- reminder artifact-presentation and outbound-handoff policy tests
- minimum-necessary practice-visibility tests across origin-practice acting contexts
- same-shell `HubManageSettlement` tests for stale, blocked, unsupported, and reconciliation-required manage actions
- hub continuity-evidence parity tests for commit-pending, booked-pending-ack, and manage-recovery routes
- session-lineage and embedded-rollout fence tests for hub manage routes
- generation-bound re-acknowledgement propagation tests for post-book cancel, reschedule, reminder failure, and supplier-drift events
- blocker-set and monotone-state tests for `NetworkManageCapabilities`
- monotone `PracticeVisibilityDeltaRecord` and envelope-version supersession tests

### Exit state

A network appointment is now visible, manageable, and communicated through the same product experience as a local appointment, while reminder delivery, capability exposure, minimum-necessary practice visibility, same-shell recovery, and post-book change propagation all follow one governed contract.

## 5I. Hardening, policy assurance, pilot rollout, and formal exit gate

This is where the network layer becomes releasable rather than merely functional.

### Backend work

Instrument the hub subsystem deeply.

Minimum metrics:

- local-to-hub routing rate
- hub queue age
- candidate-found rate inside required window
- alternative-offer rate
- alternative acceptance rate
- no-slot rate
- return-to-practice rate
- urgent bounce-back latency
- patient-notification latency
- practice-notification latency
- reminder delivery success
- network cancellation success
- manual native-booking rate
- reconciliation-required rate

Also add operational compliance dashboards for policy-driven measures such as:

- visible Enhanced Access supply horizon
- delivered or available minutes against the minutes-per-1,000 target
- cancellation make-up tracking
- stale site feeds
- high-return practices or sites
- cross-org access violations or break-glass events

This phase also carries real clinical safety obligations. NHS England states that compliance with DCB0129 and DCB0160 is mandatory. For this phase, the hazard set should explicitly cover cross-org access leakage, wrong-practice visibility, wrong-site or wrong-time booking, network slot offered outside safe timeframe, urgent case delayed in hub, patient not informed of fallback, cancellation not propagated, and expired alternative offers being wrongly committed. ([NHS England Digital][6])

### Frontend work

Run a feature-flagged pilot in controlled slices. Before broad release, the hub desk should already feel polished enough to be used all day:

- stable queue views
- strong hierarchy
- low visual noise
- very fast option scanning
- reliable filters
- excellent empty and degraded states
- mobile-clean patient alternative pages
- practice visibility that does not require training to interpret

### Tests that must all pass before Phase 6

- no Sev-1 or Sev-2 defects in hub coordination, booking commit, or return paths
- cross-org authz model proven
- deterministic candidate ranking proven
- patient alternative flows proven
- manual native-booking capture proven
- practice continuity notifications proven
- too-urgent bounce-back path proven
- patient manage and cancel paths proven for supported hub routes
- all critical hub events present in audit timeline
- policy dashboards and alerts live
- updated safety case and hazard log completed for this release
- rollback rehearsal completed

### Exit state

The network layer is now operationally and clinically usable, not just architecturally plausible.

[1]: https://www.england.nhs.uk/gp/investment/gp-contract/network-contract-directed-enhanced-service-des/enhanced-access-faqs/ "NHS England » Enhanced Access to General Practice services through the network contract DES – Frequently asked questions"
[2]: https://digital.nhs.uk/services/care-identity-service/applications-and-services/cis2-authentication "CIS2 Authentication - NHS England Digital"
[3]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration "NHS App web integration - NHS England Digital"
[4]: https://www.england.nhs.uk/wp-content/uploads/2025/03/PRN02067v-network-contract-des-contract-specification-2526-pcn-requirements-and-entitlements.pdf "Network Contract DES - Contract specification 2025/26 – PCN requirements"
[5]: https://digital.nhs.uk/developer/api-catalogue/message-exchange-for-social-care-and-health-api "Message Exchange for Social Care and Health (MESH) API - NHS England Digital"
[6]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards "Clinical risk management standards - NHS England Digital"
