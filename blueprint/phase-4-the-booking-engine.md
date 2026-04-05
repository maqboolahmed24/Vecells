# Phase 4 - The Booking Engine

**Working scope**
Local booking orchestration and patient self-service management.

## Booking surface-control priorities

The booking surface-control layer requires six corrections:

1. patient booking and manage routes still were not pinned to published `AudienceSurfaceRouteContract`, `surfacePublicationRef`, and `RuntimePublicationBundle`, so stale or withdrawn runtime contracts could still leave booking controls live
2. patient booking continuity preserved one shell in principle, but not yet through `PatientShellConsistencyProjection`, `PatientEmbeddedSessionProjection`, and `RouteFreezeDisposition`, so embedded or stale booking shells could drift into contradictory actionability
3. booking search, confirm, manage, and assisted-booking actions were still not bound to one authoritative `BookingCapabilityResolution` plus `BookingCapabilityProjection`, so supplier-specific capability drift, linkage prerequisites, local-consumer requirements, or trust downgrades could still expose unsupported controls or the wrong adapter path
4. staff assisted-booking sessions must be fenced by `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, `ReviewActionLease`, `WorkspaceFocusProtectionLease`, `ProtectedCompositionState`, and `TaskCompletionSettlementEnvelope`, so stale queue or task context could still leak optimistic booking posture
5. commit and manage flows must bind stale, frozen, or publication-conflicted booking routes to canonical `ReleaseRecoveryDisposition`, leaving degraded same-shell behaviour inconsistent
6. appointment confirmation, reminder, calendar, and browser handoff flows must be governed by `ArtifactPresentationContract` and `OutboundNavigationGrant`, so summary-first presentation and safe external navigation were not enforceable

## 4A. Booking contract, case model, and state machine

This sub-phase turns Phase 3 handoffs into a real booking-domain contract.

### Backend work

Phase 3 already ends with a `BookingIntent`. Phase 4 should not discard that and start a new model. Instead, wrap it in a durable `BookingCase`.

Create these objects:

**BookingCase**
`bookingCaseId`, `episodeRef`, `requestId`, `requestLineageRef`, `lineageCaseLinkRef`, `originTriageTaskRef`, `bookingIntentId`, `sourceDecisionEpochRef`, `sourceDecisionSupersessionRef`, `patientRef`, `tenantId`, `providerContext`, `activeCapabilityResolutionRef`, `activeCapabilityProjectionRef`, `activeProviderAdapterBindingRef`, `status`, `searchPolicyRef`, `currentOfferSessionRef`, `selectedSlotRef`, `appointmentRef`, `latestConfirmationTruthProjectionRef`, `waitlistEntryRef`, `activeWaitlistFallbackObligationRef`, `latestWaitlistContinuationTruthProjectionRef`, `exceptionRef`, `activeIdentityRepairCaseRef`, `identityRepairBranchDispositionRef`, `identityRepairReleaseSettlementRef`, `requestLifecycleLeaseRef`, `ownershipEpoch`, `staleOwnerRecoveryRef`, `patientShellConsistencyProjectionRef`, `patientEmbeddedSessionProjectionRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `routeFreezeDispositionRef`, `releaseRecoveryDispositionRef`, `createdAt`, `updatedAt`

**SearchPolicy**
`policyId`, `timeframeEarliest`, `timeframeLatest`, `modality`, `clinicianType`, `continuityPreference`, `sitePreference`, `accessibilityNeeds`, `maxTravelTime`, `bookabilityPolicy`, `selectionAudience`, `patientChannelMode`, `policyBundleHash`, `sameBandReorderSlackMinutesByWindow`

**BookingCapabilityResolution**
`bookingCapabilityResolutionId`, `bookingCaseId`, `appointmentId`, `tenantId`, `practiceRef`, `supplierRef`, `integrationMode`, `deploymentType`, `selectionAudience`, `actionScopeSet[]`, `providerCapabilityMatrixRef`, `capabilityMatrixVersionRef`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, `adapterContractProfileRef`, `dependencyDegradationProfileRef`, `assuranceSliceTrustRef`, `releaseTrustFreezeVerdictRef`, `gpLinkageCheckpointRef`, `localConsumerCheckpointRef`, `routeIntentBindingRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `parentAnchorRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `capabilityTupleHash`, `capabilityState = live_self_service | live_staff_assist | assisted_only | linkage_required | local_component_required | degraded_manual | recovery_only | blocked`, `allowedActionScopes[]`, `blockedActionReasonRefs[]`, `fallbackActionRefs[]`, `evidenceRefs[]`, `evaluatedAt`, `expiresAt`

**BookingCapabilityProjection**
`bookingCapabilityProjectionId`, `bookingCaseId`, `appointmentId`, `bookingCapabilityResolutionRef`, `selectionAudience`, `selectedAnchorRef`, `dominantCapabilityCueRef`, `selfServiceActionRefs[]`, `assistedActionRefs[]`, `manageActionRefs[]`, `fallbackActionRefs[]`, `surfaceState = self_service_live | staff_assist_live | assisted_only | linkage_required | local_component_required | degraded_manual | recovery_required | blocked`, `renderedAt`

**SlotSetSnapshot**
`snapshotId`, `bookingCaseId`, `searchSessionId`, `providerSupplier`, `integrationMode`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, `capabilityResolutionRef`, `capabilityTupleHash`, `fetchedAt`, `expiresAt`, `slotVersionVector`, `slotCount`, `candidateCount`, `snapshotChecksum`, `caseVersionRef`, `policyBundleHash`, `filterPlanVersion`, `rankPlanVersion`, `capacityRankProofRef`, `rankDisclosurePolicyRef`, `coverageState`, `candidateIndexRef`, `recoveryStateRef`, `normalizedSlotRefs`

**SnapshotCandidateIndex**
`candidateIndexId`, `snapshotId`, `selectionAudience`, `rankPlanVersion`, `capacityRankProofRef`, `orderedSlotRefs`, `dayBucketRefs`, `aggregateCounters`

**NormalizedSlot**
`slotPublicId`, `supplierSlotId`, `capacityUnitRef`, `scheduleId`, `siteId`, `siteName`, `clinicianType`, `modality`, `startAt`, `endAt`, `bookableUntil`, `continuityScore`, `restrictions`, `accessibilityTags`, `bookabilityMode`, `hardFilterMask`, `rankFeatures`, `scoreExplanationRef`, `canonicalTieBreakKey`, `sourceVersion`, `snapshotId`

**OfferSession**
`offerSessionId`, `bookingCaseId`, `snapshotId`, `capabilityResolutionRef`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, `capabilityTupleHash`, `reservationRef`, `reservationTruthProjectionRef`, `rankPlanVersion`, `capacityRankProofRef`, `rankDisclosurePolicyRef`, `offeredSlotRefs`, `offerMode`, `selectionAudience`, `truthMode`, `holdSupportState`, `selectionState`, `selectionToken`, `selectionProofHash`, `expiresAt`, `exclusiveUntilAt`

**BookingTransaction**
`bookingTransactionId`, `bookingCaseId`, `snapshotId`, `sourceDecisionEpochRef`, `sourceDecisionSupersessionRef`, `selectedSlotRef`, `canonicalReservationKey`, `selectedCandidateHash`, `policyBundleHash`, `capabilityResolutionRef`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, `adapterContractProfileRef`, `capabilityTupleHash`, `reservationTruthProjectionRef`, `confirmationTruthProjectionRef`, `idempotencyKey`, `preflightVersion`, `reservationVersion`, `supplierObservedAt`, `revalidationProofHash`, `requestLifecycleLeaseRef`, `requestOwnershipEpochRef`, `fencingToken`, `dispatchAttemptRef`, `latestReceiptCheckpointRef`, `commandSettlementRecordRef`, `commitAttempt`, `revalidationState`, `holdState`, `commitState`, `confirmationState`, `localAckState = none | shown | superseded`, `processingAcceptanceState = not_started | accepted_for_processing | awaiting_external_confirmation | externally_accepted | externally_rejected | timed_out`, `externalObservationState = unobserved | provider_reference_seen | read_after_write_seen | disputed | failed | expired`, `authoritativeOutcomeState = pending | confirmation_pending | reconciliation_required | booked | failed | expired | superseded`, `settlementRevision`, `providerReference`, `reconciliationState`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`

`BookingTransaction.fencingToken` is the `ReservationAuthority` fence, not a substitute for request ownership. Every confirm, waitlist, hub-fallback, cancel, reschedule, reminder, or assisted-booking mutation must also present the current `BookingCase.requestLifecycleLeaseRef` and matching `requestOwnershipEpochRef`; when staff are acting, the current `ReviewActionLease` must also still be live. If any of those ownership fences drift, the shell must fail closed into same-shell stale-owner recovery before mutating or closing the task.

`BookingTransaction` is also the booking-facing settlement bridge. Patient and staff shells may acknowledge the click, accepted-for-processing state, supplier observation, and final booking separately, but they may not treat any earlier phase as `booked` or quietly successful until `authoritativeOutcomeState = booked` on the same transaction chain.

**BookingConfirmationTruthProjection**
`bookingConfirmationTruthProjectionId`, `bookingCaseRef`, `bookingTransactionRef`, `selectedSlotRef`, `appointmentRecordRef`, `externalConfirmationGateRef`, `commandSettlementRecordRef`, `latestReceiptCheckpointRef`, `providerReference`, `authoritativeProofClass = none | durable_provider_reference | same_commit_read_after_write | reconciled_confirmation`, `confirmationTruthState = booking_in_progress | confirmation_pending | reconciliation_required | confirmed | failed | expired | superseded`, `patientVisibilityState = selected_slot_pending | provisional_receipt | booked_summary | recovery_required`, `manageExposureState = hidden | summary_only | writable`, `artifactExposureState = hidden | summary_only | handoff_ready`, `reminderExposureState = blocked | pending_schedule | scheduled`, `continuityEvidenceRef`, `truthBasisHash`, `projectionFreshnessEnvelopeRef`, `settlementRevision`, `generatedAt`

`BookingConfirmationTruthProjection` is the single booking-outcome contract for patient, staff, request-detail, and support surfaces. `BookingTransaction`, `AppointmentRecord`, `ExternalConfirmationGate`, reminder scheduling, and appointment artifacts must converge through it rather than letting any one of those objects imply final booking truth on its own.

**AppointmentRecord**
`appointmentId`, `bookingCaseId`, `patientRef`, `providerReference`, `slotRef`, `site`, `modality`, `startAt`, `endAt`, `status`, `supersedesAppointmentRef`, `supersededByAppointmentRef`, `lastSupplierVersion`, `createdByMode`, `providerAdapterBindingRef`, `manageSupportContractRef`, `manageCapabilities`, `manageCapabilityProjectionRef`, `confirmationTruthProjectionRef`, `reminderPlanRef`, `presentationArtifactRef`

**AppointmentPresentationArtifact**
`appointmentPresentationArtifactId`, `appointmentId`, `confirmationTruthProjectionRef`, `patientSummaryRef`, `attendanceInstructionRefs`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `calendarExportState = inline_only | external_handoff_allowed | hidden`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `artifactState = draft | renderable | read_only | placeholder_only`, `generatedAt`

**WaitlistEntry**
`waitlistEntryId`, `bookingCaseId`, `activeState = active | paused | transferred | closed`, `continuationState = waiting_local_supply | offer_pending | accepted_pending_confirmation | fallback_pending | callback_transferred | hub_transferred | booking_failed | closed`, `preferenceEnvelope`, `eligibilityHash`, `eligibilityWindow`, `joinedAt`, `priorityKey`, `candidateCursor`, `activeOfferRef`, `offerHistory`, `latestDeadlineEvaluationRef`, `activeFallbackObligationRef`, `continuationTruthProjectionRef`, `lastEvaluatedAt`, `deadlineAt`, `safeWaitlistUntilAt`, `expectedOfferServiceMinutes`

**WaitlistOffer**
`waitlistOfferId`, `waitlistEntryRef`, `deadlineEvaluationRef`, `fallbackObligationRef`, `continuationFenceEpoch`, `releasedSlotRef`, `capacityUnitRef`, `reservationRef`, `reservationTruthProjectionRef`, `allocationBatchRef`, `truthMode = exclusive_hold | truthful_nonexclusive`, `scoreVector`, `offerOrdinal`, `offerState`, `holdState`, `offerExpiryAt`, `exclusiveUntilAt`, `sentAt`, `respondedAt`, `supersededByRef`

**WaitlistDeadlineEvaluation**
`waitlistDeadlineEvaluationId`, `waitlistEntryRef`, `bookingCaseRef`, `deadlineAt`, `expectedOfferServiceMinutes`, `safeWaitlistUntilAt`, `workingMinutesRemaining`, `laxityMinutes`, `deadlineClass = on_track | warn | critical | expired`, `offerabilityState = waitlist_safe | at_risk | fallback_required | overdue`, `reasonCode`, `evaluatedAt`

**WaitlistFallbackObligation**
`waitlistFallbackObligationId`, `bookingCaseRef`, `waitlistEntryRef`, `latestDeadlineEvaluationRef`, `requiredFallbackRoute = stay_local_waitlist | callback | hub | booking_failed`, `triggerClass = none | no_safe_laxity | no_eligible_supply | offer_chain_exhausted | stale_capacity_truth | policy_cutoff`, `transferState = monitoring | armed | transfer_pending | transferred | satisfied | cancelled`, `callbackCaseRef`, `callbackExpectationEnvelopeRef`, `hubCoordinationCaseRef`, `createdAt`, `transferredAt`, `clearedAt`

**WaitlistContinuationTruthProjection**
`waitlistContinuationTruthProjectionId`, `bookingCaseRef`, `waitlistEntryRef`, `activeWaitlistOfferRef`, `latestDeadlineEvaluationRef`, `fallbackObligationRef`, `reservationTruthProjectionRef`, `selectedAnchorRef`, `patientVisibleState = waiting_for_offer | offer_available | accepted_pending_booking | callback_expected | hub_review_pending | expired | closed`, `windowRiskState = on_track | at_risk | fallback_due | overdue`, `dominantActionRef`, `fallbackActionRef`, `nextEvaluationAt`, `projectionFreshnessEnvelopeRef`, `generatedAt`

`WaitlistDeadlineEvaluation` is the only booking-side authority for whether local waitlist is still safe to continue. `WaitlistFallbackObligation` keeps callback, hub, or explicit failure debt live across offer expiry, supersession, and in-flight accept or commit attempts. `WaitlistContinuationTruthProjection` is the single patient and staff truth for whether the case is honestly still waiting for a local offer, already needs callback or hub transfer, or has expired into recovery.

**BookingException**
`exceptionId`, `bookingCaseId`, `exceptionType`, `severity`, `lastObservedAt`, `retryState`, `fallbackRecommendation`

Lock the first booking state machine now:

`handoff_received -> capability_checked -> searching_local -> offers_ready -> selecting -> revalidating -> commit_pending -> booked | confirmation_pending | supplier_reconciliation_pending | waitlisted | fallback_to_hub | callback_fallback | booking_failed -> managed -> closed`

Execution rules:

- `capability_checked` may advance to `searching_local` only when the current `BookingCapabilityResolution.capabilityState = live_self_service | live_staff_assist` for the active audience, the bound `BookingProviderAdapterBinding` and `AdapterContractProfile` are current, and the same `capabilityTupleHash` still matches route, publication, trust, and governing-object posture; otherwise the case must stay in the same shell under `BookingCapabilityProjection.surfaceState = assisted_only | linkage_required | local_component_required | degraded_manual | recovery_required | blocked`
- `revalidating` is entered the moment a chosen slot is being checked against current supplier state **and** the original `SearchPolicy`
- `waitlisted` is entered only when a real active `WaitlistEntry` exists, its `WaitlistDeadlineEvaluation.offerabilityState = waitlist_safe | at_risk`, and its current `WaitlistFallbackObligation.requiredFallbackRoute = stay_local_waitlist`
- `callback_fallback` is entered only when the current `WaitlistFallbackObligation.requiredFallbackRoute = callback` and the linked `CallbackCase` plus current `CallbackExpectationEnvelope` exist for the same fallback fence
- `fallback_to_hub` is entered only when the current `WaitlistFallbackObligation.requiredFallbackRoute = hub` and the linked `HubCoordinationCase` is durably created for the same booking lineage
- `booking_failed` is entered only when the current local booking attempt has ended without an active continuation path
- `managed` is entered only after an authoritative `AppointmentRecord` exists, backed by durable provider reference or same-commit read-after-write proof, and the case has moved into its cancel, reschedule, reminder, or detail-update lifecycle

These are real durable states, not UI-only labels. `supplier_reconciliation_pending` is a `BookingCase`-local state for ambiguous or disputed supplier truth; it must attach an `ExternalConfirmationGate` to the request lineage and must never be copied into `Request.workflowState`.

`BookingCase.latestConfirmationTruthProjectionRef` must always point at the current `BookingConfirmationTruthProjection` for the live transaction or authoritative appointment lineage. Older confirmation projections remain auditable history only; they may not drive current patient, staff, request-detail, reminder, or artifact posture once superseded.

`BookingCase.activeWaitlistFallbackObligationRef` and `BookingCase.latestWaitlistContinuationTruthProjectionRef` must point at the current waitlist-deadline and next-step truth whenever local booking has entered waitlist, accepted a waitlist offer, or is transferring to callback or hub because local waitlist is no longer safe. Offer expiry, supersession, or acceptance may not clear those refs until authoritative booking or durable fallback transfer settles.

`BookingCase.sourceDecisionEpochRef` is mandatory lineage, not optional metadata. Case creation, slot search, slot select, confirm, waitlist join, callback fallback, and hub fallback must all validate that the source epoch still matches the current unsuperseded triage decision. If a replacement epoch or `DecisionSupersessionRecord` appears after the booking shell opens, the patient or staff surface may preserve the chosen slot and search context as provenance, but every mutation path must fail closed to governed same-shell recovery before the booking flow can continue.

`BookingCase.lineageCaseLinkRef` is the sole canonical join from the request lineage into booking work. Case creation must move the bound `LineageCaseLink(caseFamily = booking)` from `proposed` to `acknowledged`, and live booking posture is legal only while that link remains current for the same `RequestLineage`. Hub fallback, callback fallback, reopen, or compensation may open child links, but they may not overwrite the booking link or pretend booking was never the owning branch.

If the lineage enters wrong-patient correction, `BookingCase.identityRepairBranchDispositionRef` becomes mandatory. Offer selection, confirm, manage, reminder, and patient-visible appointment assurance may preserve the current slot or appointment only as summary provenance while the branch is `pending_freeze | quarantined | compensation_pending`; live booking posture may return only after the branch is `released` under the current `IdentityRepairReleaseSettlement`.

Use the canonical `AdapterDispatchAttempt` and `AdapterReceiptCheckpoint` from Phase 0 for booking commit and callback handling. Phase 4 may reference them through `BookingTransaction`, but it must not invent a booking-local webhook dedupe contract that disagrees with the platform replay model.

Add the first event catalogue for this phase:

- `booking.case.created`
- `booking.capability.resolved`
- `booking.slots.fetched`
- `booking.offers.created`
- `booking.slot.selected`
- `booking.slot.revalidated`
- `booking.slot.revalidation.failed`
- `booking.commit.started`
- `booking.commit.confirmation_pending`
- `booking.commit.reconciliation_pending`
- `booking.commit.confirmed`
- `booking.commit.ambiguous`
- `booking.confirmation.truth.updated`
- `booking.appointment.created`
- `booking.reminders.scheduled`
- `booking.cancelled`
- `booking.reschedule.started`
- `booking.waitlist.joined`
- `booking.waitlist.deadline_evaluated`
- `booking.waitlist.offer.sent`
- `booking.waitlist.offer.accepted`
- `booking.waitlist.offer.expired`
- `booking.waitlist.offer.superseded`
- `booking.waitlist.fallback.required`
- `booking.fallback.callback_requested`
- `booking.fallback.hub_requested`
- `booking.exception.raised`

A clean initial API surface is:

- `POST /v1/bookings/cases`
- `GET /v1/bookings/cases/{bookingCaseId}`
- `POST /v1/bookings/cases/{bookingCaseId}:search`
- `POST /v1/bookings/cases/{bookingCaseId}:select-slot`
- `POST /v1/bookings/cases/{bookingCaseId}:confirm`
- `GET /v1/appointments/{appointmentId}`
- `POST /v1/appointments/{appointmentId}:cancel`
- `POST /v1/appointments/{appointmentId}:reschedule`
- `POST /v1/bookings/cases/{bookingCaseId}:join-waitlist`
- `POST /v1/bookings/cases/{bookingCaseId}:fallback-callback`
- `POST /v1/bookings/cases/{bookingCaseId}:fallback-hub`

### Frontend work

Add the booking routes to the patient shell now, with the relevant appointment-management surfaces mirrored into the workspace shell where policy and role scope allow:

- `/appointments`
- `/bookings/:bookingCaseId`
- `/bookings/:bookingCaseId/select`
- `/bookings/:bookingCaseId/confirm`
- `/appointments/:appointmentId`
- `/appointments/:appointmentId/manage`
- `/appointments/:appointmentId/cancel`
- `/appointments/:appointmentId/reschedule`

Booking entry may start from `Home`, `Requests`, or `Appointments`, but once the active booking or appointment object is known the patient must stay inside the same `PersistentShell`.

Do not build all logic into one giant appointment page. Keep list, choose, confirm, and manage as separate route contracts with one calm dominant action each.

Every patient-facing booking and appointment-management route must materialize beneath `PatientShellConsistencyProjection` and one published `AudienceSurfaceRouteContract` plus `surfacePublicationRef`. If booking publication becomes `stale`, `conflict`, or `withdrawn`, or if the route is running in embedded mode without a valid `PatientEmbeddedSessionProjection`, the same shell must freeze mutation and degrade through `RouteFreezeDisposition` or `ReleaseRecoveryDisposition` rather than leaving stale select, confirm, cancel, or reschedule controls live.

Add the patient booking and manage projections now so every patient-side appointment surface shares one truth model:

**PatientAppointmentListProjection**
`appointmentListProjectionId`, `patientShellConsistencyRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `upcomingAppointmentRefs[]`, `activeWaitlistOfferRefs[]`, `activeWaitlistOfferTruthRefs[]`, `activeWaitlistContinuationTruthRefs[]`, `manageCapabilityDigestRef`, `dominantActionRef`, `returnContractRef`, `surfaceState = loading | empty_actionable | ready | partial | recovery_required`, `computedAt`

`PatientAppointmentListProjection` is the list-shell truth for `/appointments`. Upcoming rows, waitlist offer cards, waitlist-deadline or fallback cards, and manage-entry actions must derive from it rather than stitching list chrome from separate appointment, waitlist, and capability calls.

**PatientAppointmentWorkspaceProjection**
`appointmentWorkspaceProjectionId`, `bookingCaseId`, `requestRef`, `patientShellConsistencyRef`, `searchPolicyRef`, `purposeSummaryRef`, `timeframeRef`, `modalityPreferenceRef`, `accessibilityNeedRefs[]`, `travelPreferenceRef`, `continuityPreferenceRef`, `capacityRankProofRef`, `rankDisclosurePolicyRef`, `selectedSlotRef`, `selectedScoreExplanationRef`, `selectedReservationTruthRef`, `selectedConfirmationTruthRef`, `selectedWaitlistContinuationTruthRef`, `latestBookingTransactionRef`, `slotSearchRevisionRef`, `lastRevalidationRef`, `fallbackPathRefs[]`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `returnContractRef`, `continuityEvidenceRef`, `surfaceState = searching | offers_ready | selecting | revalidating | confirmation_pending | fallback_required | recovery_required`, `computedAt`

`PatientAppointmentWorkspaceProjection` is the only patient-facing read model for slot search, selection, revalidation, and confirm posture. The chosen slot, its current reservation truth, current waitlist-continuation truth when relevant, fallback guidance, and next safe action must remain visible in the same shell through pending confirmation and recovery.

**PatientAppointmentManageProjection**
`appointmentManageProjectionId`, `appointmentId`, `bookingCaseId`, `patientShellConsistencyRef`, `appointmentSummaryRef`, `manageCapabilityRefs[]`, `latestManageSettlementRef`, `latestBookingTransactionRef`, `bookingConfirmationTruthRef`, `pendingConfirmationState = none | supplier_pending | reconciliation_required`, `activeRepairRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `returnContractRef`, `continuityEvidenceRef`, `surfaceState = ready | supplier_pending | reconciliation_required | read_only | recovery_required`, `computedAt`

`PatientAppointmentManageProjection` is the manage-shell truth for `/appointments/:appointmentId/manage` and its cancel or reschedule child states. It keeps the booked summary, active blocker, and last authoritative manage settlement attached to the same appointment anchor while quiet-success suppression remains in force.

**PatientAppointmentArtifactProjection**
`appointmentArtifactProjectionId`, `appointmentId`, `appointmentPresentationArtifactRef`, `bookingConfirmationTruthRef`, `artifactPresentationContractRef`, `outboundNavigationGrantRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `returnContractRef`, `artifactState = summary_only | renderable | handoff_ready | placeholder_only | recovery_required`, `computedAt`

`PatientAppointmentArtifactProjection` binds appointment summary, attendance instructions, reminder artifact, calendar export, print view, and browser handoff to the same appointment anchor and return target. Artifact actions may not detach into a separate success or export page when the manage shell can still render a summary-first view.

Rules:

- `PatientAppointmentListProjection`, `PatientAppointmentWorkspaceProjection`, and `PatientAppointmentManageProjection` must preserve the active `SelectedAnchor`, its tuple hash, the current route intent, and the same-shell return contract when the patient arrives from `Home`, `Requests`, `Appointments`, or record-origin follow-up
- if entry came from request detail or record follow-up, booking routes must preserve the upstream `PatientRequestReturnBundle` or `RecordOriginContinuationEnvelope` plus `RecoveryContinuationToken` before the booking shell becomes writable
- `PatientAppointmentWorkspaceProjection.surfaceState = confirmation_pending` and `PatientAppointmentManageProjection.pendingConfirmationState != none` must suppress quiet success and keep the chosen slot or booked summary visible until authoritative supplier settlement lands
- slot search refresh, offer revalidation, waitlist promotion, and recovery replay may patch the selected slot in place only while `selectedAnchorTupleHashRef` still resolves to the same slot identity; adjacent-slot substitution must degrade to invalidation or replacement stub with alternatives instead of silently switching the patient
- `PatientAppointmentWorkspaceProjection.capacityRankProofRef`, `selectedScoreExplanationRef`, and `rankDisclosurePolicyRef` are the only authorities for slot order, patient reason cues such as `soonest` or `best match`, and any assisted or replay explanation path; grouped day headers, calendar mode, local filters, or browser sort state may not recompute ordinals or invent new explanation text
- `PatientAppointmentWorkspaceProjection.selectedReservationTruthRef` and `PatientAppointmentListProjection.activeWaitlistOfferTruthRefs[]` are the only authorities for reserved language, hold countdowns, truthful nonexclusive wording, and expired or superseded offer posture; selected cards, list rows, and secure-link accept flows may not improvise those cues from `expiresAt`, selected state, or local timers
- `PatientAppointmentWorkspaceProjection.selectedWaitlistContinuationTruthRef` and `PatientAppointmentListProjection.activeWaitlistContinuationTruthRefs[]` are the only authorities for `still waiting for a local offer`, `callback expected`, `we have sent this to the hub`, deadline-risk warnings, and expired waitlist posture; `deadlineAt`, `expectedOfferServiceMinutes`, sent-offer history, or local timers may not manufacture calmer waitlist truth
- if the current waitlist-continuation truth says `patientVisibleState = callback_expected | hub_review_pending | expired` or `windowRiskState = fallback_due | overdue`, the same shell may preserve the active offer or preference summary as provenance, but the dominant action must switch to the governed fallback or recovery path and ordinary offer-acceptance posture must suppress in place
- `PatientAppointmentWorkspaceProjection.selectedConfirmationTruthRef`, `PatientAppointmentManageProjection.bookingConfirmationTruthRef`, and `PatientAppointmentArtifactProjection.bookingConfirmationTruthRef` are the only authorities for `booking in progress`, `we are confirming your booking`, `we are checking your booking`, clean booked summary, reminder readiness, export or handoff readiness, and writable manage posture; raw `AppointmentRecord` presence, `latestBookingTransactionRef`, `providerReference`, or notification send state may not bypass them
- those projections must derive pending, reconciliation, and booked reassurance from `latestBookingTransactionRef.commandSettlementRecordRef`, `processingAcceptanceState`, `externalObservationState`, and `authoritativeOutcomeState`; local acknowledgement, worker acceptance, or provider 202-style acceptance alone may not render calm success
- cancel and reschedule flows may not blank or replace the current appointment summary while supplier outcome, reconciliation, or stale-route recovery is pending; the shell must morph in place through `PatientAppointmentManageProjection`
- appointment list, workspace, manage, and artifact surfaces may not derive live actionability from stale capability, stale continuity evidence, or detached exports; they must degrade in place to read-only, placeholder, or recovery posture while keeping the last safe appointment anchor visible

### Tests that must pass before moving on

- booking-state transition tests
- migration tests from Phase 3 `BookingIntent` to `BookingCase`
- event-schema tests for all booking events
- replay tests from `BookingIntent` through confirmed `AppointmentRecord`
- source-decision-epoch tests proving stale or superseded handoff intents cannot create, search, or confirm a live `BookingCase`
- no-orphan-record tests between `BookingCase`, `LineageCaseLink`, `AppointmentRecord`, and `WaitlistEntry`

### Exit state

The booking domain now exists as a real subsystem with explicit states, objects, and events, including explicit confirmation-pending and reconciliation paths.

## 4B. Provider capability matrix and adapter seam

This is the most important engineering control in the whole phase.

### Backend work

Build a `ProviderCapabilityMatrix` instead of hard-coding feature assumptions.

Model it per:

- tenant
- GP supplier
- integration mode
- practice or organisation
- deployment type
- assurance state

Suggested integration modes:

- `im1_patient_api`
- `im1_transaction_api`
- `gp_connect_existing`
- `local_gateway_component`
- `manual_assist_only`

For each mode, capture capabilities such as:

- `can_search_slots`
- `can_book`
- `can_cancel`
- `can_reschedule`
- `can_view_appointment`
- `can_hold_slot`
- `requires_gp_linkage_details`
- `supports_patient_self_service`
- `supports_staff_assisted_booking`
- `supports_async_commit_confirmation`
- `requires_local_consumer_component`

`ProviderCapabilityMatrix` is the static capability source, not the live UI or mutation authority. Phase 4 must compile that matrix into one current `BookingProviderAdapterBinding`, then into one current `BookingCapabilityResolution` per booking or manage surface, and then widen that into one audience-aware `BookingCapabilityProjection`. Search, select, confirm, waitlist, cancel, reschedule, reminder, detail-update, and assisted-booking routes may not infer capability directly from supplier name, integration mode, appointment status, legacy feature flags, or component-local heuristics.

Current NHS guidance matters here. IM1 Pairing currently has no decommission plan, the active foundation suppliers are Optum for EMIS Web and TPP for SystmOne, and pairing runs through prerequisites, SCAL, a model interface licence, mock API access, supported test, assurance, and live rollout. The guidance also says provider functionality differs and detailed technical specs arrive through the supplier PIP after feasibility and acceptance. ([NHS England Digital][5])

The capability matrix must also respect the split between IM1 Patient and Transaction APIs. The Patient API supports viewing, booking, amending, and cancelling appointments, but also says the user must obtain GP-practice linkage details, and if NHS login is used the product must support both linkage scenarios. The Transaction API supports slot retrieval and diary information, but appointment functionality may only be available via GP Connect depending on the provider PIP, and some Transaction-style integrations may require a consumer component on a local practice machine. ([NHS England Digital][6])

The development algorithm here is:

1. resolve tenant, practice or organisation, governing booking or appointment object, route-intent tuple, parent anchor, active audience, and requested `actionScope`
2. resolve supplier, integration mode, deployment type, and the current published `ProviderCapabilityMatrix` row for that exact context
3. compile or look up one current `BookingProviderAdapterBinding` for that row; the binding must name exactly one `AdapterContractProfile`, one `DependencyDegradationProfile`, and the canonical search-normalization, temporal-normalization, revalidation, reservation, commit, authoritative-read, and manage-support contracts for that context. No worker, route handler, or component may pick an adapter or operation contract outside that binding
4. evaluate dynamic prerequisites and guards for the same tuple, including GP-linkage status, required local-consumer state, supplier degradation, release trust or freeze posture, assurance-slice trust, runtime publication, and the current governing-object version
5. persist one `BookingCapabilityResolution` with `allowedActionScopes[]`, fallback actions, blocking reasons, evidence refs, the chosen `providerAdapterBindingRef`, `providerAdapterBindingHash`, `adapterContractProfileRef`, and one exact `capabilityTupleHash`
6. derive one `BookingCapabilityProjection` for the current audience so patient and staff shells consume the same decision in different allowed forms rather than re-running local capability logic
7. fail closed if the required action is unsupported, stale, or drifted; if self-service is not allowed, degrade intentionally to assisted, linkage repair, local-component recovery, degraded manual fallback, or blocked posture in the same shell
8. route search, revalidation, commit, cancel, reschedule, reminder, detail-update, and any external effect only through the `providerAdapterBindingRef` named by the live resolution
9. emit `booking.capability.resolved` and persist audit-visible evidence for replay, debugging, and later dispute review

Do not let the UI ask for actions the backend cannot perform. The capability matrix should be projected into the patient and staff views.

The capability tuple must bind at least:

- tenant, practice or organisation, and supplier context
- integration mode and deployment type
- selection audience and requested `actionScope`
- `providerCapabilityMatrixRef` and matrix version
- chosen `adapterContractProfileRef`
- GP-linkage and local-consumer checkpoints where required
- current trust, publication, and route-intent tuple
- governing object, governing-object version, and parent anchor

`BookingProviderAdapterBinding` is translation-only. It may declare supplier query syntax, payload normalization, callback correlation, authoritative read-after-write proof, and manage-support families, but ranking, policy filtering, waitlist fallback choice, and patient-visible meaning stay in the booking core and `BookingCapabilityProjection`.

Rules:

- `BookingCapabilityResolution.capabilityState = live_self_service` is the only state that may expose patient self-service search, select, confirm, or patient-managed mutation controls
- `BookingCapabilityResolution.capabilityState = live_staff_assist` may widen staff actionability to `staff_assistable` supply, but it may not widen patient self-service affordances
- `assisted_only` keeps the booking or appointment anchor visible, suppresses self-service CTAs, and promotes the bounded assisted path from `fallbackActionRefs[]`
- `linkage_required` must route the patient into same-shell linkage or support recovery instead of pretending booking is generically unavailable
- `local_component_required` or `degraded_manual` must route through the declared fallback mode from `DependencyDegradationProfile`; direct adapter retries against the wrong mode are forbidden
- search, revalidation, commit, cancel, reschedule, reminder, and detail-update flows must all bind the same current `providerAdapterBindingRef` and `providerAdapterBindingHash`; if the binding drifts, older search snapshots, selected slots, manage pages, and command drafts become `recovery_only`
- manage actions may differ by provider and integration mode; cancel, reschedule, reminder, and detail-update exposure must come from the current `BookingCapabilityProjection` and the bound `manageSupportContractRef`, not from `AppointmentRecord.status` or historic supplier assumptions
- any change in supplier state, matrix version, route tuple, publication tuple, assurance trust, release trust, linkage checkpoint, or local-consumer checkpoint must supersede the old resolution and push older CTA payloads, list rows, and child routes to `recovery_only`
- cached rows, old manage pages, and draft commands that do not carry the current `capabilityTupleHash` are descriptive only until the shell refreshes them under the current runtime contract

### Frontend work

Build capability-aware UX, not universal UX.

That means:

- render booking and manage actionability only from `BookingCapabilityProjection`, never from supplier-name checks, appointment-status shortcuts, or route-local feature flags
- show self-service booking only when `BookingCapabilityProjection.surfaceState = self_service_live`
- show assisted-booking state when the current projection is `assisted_only` or `staff_assist_live`
- show linkage-required state if GP linkage details are needed
- show local-component-required or degraded-manual state when the declared adapter path cannot support patient self-service
- hide or freeze cancel and reschedule buttons when not actually available for the current provider context
- surface degraded capability state in the shared status strip or the affected capability card, reserving full-width banners for blocked-booking moments only
- keep the currently selected slot, appointment summary, or manage anchor visible while capability state morphs to assisted or recovery posture; capability drift may not reset the shell or silently switch to a different adapter path

The UI should still look clean and premium. Capability constraints should feel deliberate, not broken.

### Tests that must pass before moving on

- matrix-resolution tests for all tenant and supplier combinations
- capability-tuple replay and supersession tests for provider, audience, publication, and trust drift
- adapter contract tests against mocks and supplier-specific simulators
- binding-compilation and binding-hash drift tests across supplier, integration-mode, audience, and action-scope changes
- adapter-translation-only tests proving ranking, waitlist fallback, and patient copy stay core-owned
- wrong-adapter rejection tests when a stale or mismatched capability tuple reaches dispatch
- fail-closed tests for unsupported actions
- capability-to-UI projection tests
- patient-versus-staff projection parity tests proving the same resolution widens only the allowed audience
- linkage-required and local-component-required fallback tests
- release-trust and assurance-trust downgrade tests on live booking and manage controls
- local-gateway degraded-mode tests
- wrong-capability exposure tests

### Exit state

The system now knows what kind of booking it can really do, why that posture is valid, which adapter path is allowed, and how patient and staff surfaces must degrade when that posture changes.

---

## 4C. Slot search, normalisation, and availability snapshots

This sub-phase makes local availability real.

### Backend work

Build slot search as a snapshot-producing operation, not a live list that the UI talks to directly.

High-priority control gaps in this layer:

1. search runs are not yet pinned to one booking-case version, audience, and compiled policy bundle, so a patient can browse a snapshot that no longer matches live booking truth
2. empty or short result sets do not distinguish true no-supply from partial supplier coverage, timeout, or adapter degradation
3. deduplication by `capacityUnitRef` alone is too lossy and can collapse distinct slot inventory or incompatible bookability variants
4. temporal normalization is under-specified around supplier timezone, DST boundary, and clock-skew handling
5. the patient surface has no first-class same-shell recovery contract for stale snapshots, partial coverage, or support fallback

Suggested objects:

**SlotSearchSession**
`searchSessionId`, `bookingCaseId`, `routeFamily`, `selectionAudience`, `searchIntentRef`, `policyBundleRef`, `capabilityResolutionRef`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, `capabilityTupleHash`, `filterPlanVersion`, `rankPlanVersion`, `caseVersionRef`, `startedAt`, `expiresAt`, `sessionState`

**ProviderSearchSlice**
`providerSearchSliceId`, `searchSessionId`, `supplierRef`, `providerAdapterBindingRef`, `queryFingerprint`, `supplierWindowRef`, `fetchStartedAt`, `fetchCompletedAt`, `sliceCoverageState`, `partialReasonCode`, `sourceVersionRef`, `rawCount`, `normalizedCount`

**TemporalNormalizationEnvelope**
`temporalEnvelopeId`, `supplierRef`, `supplierTimezoneRef`, `siteTimezoneRef`, `normalizedInstant`, `localDayKey`, `dstBoundaryState`, `clockSkewMillis`, `validityState`

**CanonicalSlotIdentity**
`canonicalSlotId`, `supplierSlotRefs`, `capacityUnitRef`, `scheduleOwnerRef`, `bookabilityMode`, `modalityRef`, `siteRef`, `startInstant`, `inventoryLineageRef`, `identityHash`

**SlotSnapshotRecoveryState**
`recoveryStateId`, `slotSetSnapshotRef`, `viewState = renderable | partial_coverage | stale_refresh_required | no_supply_confirmed | support_fallback`, `anchorDayKey`, `recoveryReasonCode`, `sameShellRouteRef`

Use this algorithm:

1. `BookingCase` enters `searching_local`
2. materialize `SlotSearchSession` bound to the active booking-case version, route family, audience, and compiled policy inputs for this search
3. resolve `SearchPolicy`, including `selectionAudience` and `bookabilityPolicy`, plus the current `BookingCapabilityResolution`; if the resolution is no longer `live_self_service | live_staff_assist` for search, stop and return the same-shell fallback from `BookingCapabilityProjection`
4. call the provider adapter through `BookingProviderAdapterBinding.searchNormalizationContractRef` with the supplier-specific query syntax, mint one `ProviderSearchSlice` per supplier window, and request paged or streamable results when the adapter supports it
5. normalize supplier rows incrementally into `NormalizedSlot`, apply `BookingProviderAdapterBinding.temporalNormalizationContractRef` plus `TemporalNormalizationEnvelope`, resolve `CanonicalSlotIdentity`, preserve raw payload references for audit, and deduplicate only rows that resolve to the same canonical slot identity
6. apply hard filters during normalization; persist reject-reason counters and only materialize rejected rows when audit or reconciliation policy requires them
7. maintain per-audience day buckets and top-`K` surfaced candidate heaps while the stream is processed, track slice coverage and degradation state, then freeze a full or page-addressable candidate index so the system does not repeatedly sort the entire result set
8. finalize `SlotSetSnapshot` with `slotCount`, `candidateCount`, source version, fetch time, expiry metadata, `snapshotChecksum`, `candidateIndexRef`, `filterPlanVersion`, `rankPlanVersion`, `searchSessionId`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, `capabilityResolutionRef`, `capabilityTupleHash`, `coverageState`, and `recoveryStateRef`
9. emit `booking.slots.fetched` with raw-returned, normalized, deduplicated, filtered, surfaced, and partial-coverage counts
10. transition case to `offers_ready` only when the snapshot is renderable; otherwise keep the patient in the same booking shell with `SlotSnapshotRecoveryState`

An empty candidate set is not enough to conclude there is no supply. The platform may show `no_supply_confirmed` only when all required `ProviderSearchSlice` records have settled to complete coverage for the current search policy. Otherwise the state is `partial_coverage` or `support_fallback`.

Define the selection predicate for snapshot `q` at time `t` as:

`SnapshotSelectable(q,t) = 1[t <= q.expiresAt] * 1[q.caseVersionRef matches the active BookingCase version] * 1[q.policyBundleHash matches the active compiled policy bundle] * 1[q.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * 1[q.capabilityTupleHash matches the current BookingCapabilityResolution.capabilityTupleHash] * 1[q.coverageState in {complete, partial_coverage}] * 1[recoveryState(q).viewState != stale_refresh_required]`

If `SnapshotSelectable(q,t) = 0`, selection may preserve provenance and day anchor, but confirm-path mutation must fail closed and require refresh or governed recovery before a slot can be committed.

Filter, deduplicate, and bucket before ranking:

- outside clinical timeframe
- incompatible modality
- site or accessibility mismatch
- slot already expired
- provider-specific restrictions not satisfied
- `bookabilityMode` unsupported for the current `selectionAudience`
- duplicate supplier aliases resolving to the same `CanonicalSlotIdentity`

This aligns with NHS England digital requirements guidance, which says practices should make all directly bookable appointments available online, not just an arbitrary percentage. Search and projection should therefore explicitly distinguish directly bookable, staff-assistable, and currently non-bookable supply instead of flattening them into one filter. ([NHS England][2])

Do not throw away supplier metadata during normalisation. Keep raw provider payloads for audit and reconciliation, but never expose them directly to the UI.

Binding-declared hard supplier impossibility may mark a row unsupported, partial, or degraded, but adapters may not pre-rank supply, silently suppress patient-safe candidates, or emit patient copy. Those remain booking-core responsibilities after normalization.

Never re-sort the full supplier payload on every pagination or view-mode change. Page from the frozen snapshot index unless policy inputs changed.

If the `SlotSearchSession` expires, policy inputs change, or supplier truth is partially degraded, the snapshot must stop advertising itself as current. Preserve the booking shell, mark the snapshot stale or partial through `SlotSnapshotRecoveryState`, and require refresh before selection can continue.

### Frontend work

This is the first high-friction patient booking surface, so it needs excellent structure and reassurance.

The slot-selection experience should be:

- calm
- minimal
- mobile-first
- grouped by day
- easy to scan
- light on chrome
- keyboard-, screen-reader-, and zoom-safe
- rich enough to show what matters

Show only a few key pieces of information per slot:

- day and time
- location or remote
- clinician or clinician type
- accessibility or travel hints if relevant
- recommended indicator if ranked highly
- one short reason cue such as `soonest` or `best match`

Keep a clear `Need help booking?` route visible whenever self-service feels difficult.

Do not open with a complicated month-view calendar. The better default is a ranked list grouped by day, with a calendar view as an optional secondary mode that preserves the same accessible list state and selection context.

The slot surface must derive its visible state from `SlotSnapshotRecoveryState`:

- `renderable` shows slots normally
- `partial_coverage` shows bounded copy that availability may be incomplete and keeps support help visible
- `stale_refresh_required` freezes selection, preserves the current day anchor, and offers refresh in place
- `no_supply_confirmed` explains that the search completed exhaustively for the current policy
- `support_fallback` routes to assisted booking without pretending search completed cleanly

Never show a final `No appointments available` message while supplier coverage is partial or stale.

### Tests that must pass before moving on

- supplier search contract tests
- search-session fence and policy-drift tests
- slot normalisation tests across suppliers
- partial-coverage versus true-no-supply tests
- DST, supplier-timezone, and clock-skew normalization tests
- audience-aware bookability filter tests
- canonical-slot identity dedupe tests
- top-`K` versus full-sort equivalence tests
- snapshot-expiry tests
- large result-set performance tests
- visual regression tests on the slot list and day grouping
- screen-reader slot announcement tests
- same-shell stale-refresh and anchor-preservation tests
- high-zoom and narrow-width booking tests

### Exit state

Booking can now surface a trustworthy, normalized local availability view with explicit search-session lineage, supplier-coverage truth, canonical slot identity, hardened temporal normalization, and same-shell recovery instead of raw or misleading supplier output.

## 4D. Slot scoring, offer orchestration, and selection experience

This sub-phase turns availability into decision-quality offers.

### Backend work

Build a deterministic scorer on top of the snapshot candidate index, not raw supplier output.

Use hard filters first, then compute a versioned rank proof from normalized features. Do not combine raw times, distances, and booleans on incomparable scales, and do not allow convenience to move a candidate materially later than the earliest clinically safe supply inside the same timeliness band unless policy explicitly permits that reorder.

**Hard filters**

- beyond clinically safe latest date
- wrong modality for the case
- wrong clinician type
- accessibility needs not met
- not bookable by the current actor mode
- patient-specific exclusions or linkage problems

**Timeliness gates for feasible slot `s`**

- `windowClass(s)` is ordinal and strictly ordered as `2 = inside clinically preferred window`, `1 = inside clinically acceptable window`, `0 = outside window`
- `earliestStart_b = min_{u : windowClass(u)=b} startAtEpoch(u)`
- `Frontier_b = { s : windowClass(s)=b and startAtEpoch(s) <= earliestStart_b + Delta_reorder_b }`, where `Delta_reorder_b` is versioned in the active `RankPlan` and compiled from `SearchPolicy.sameBandReorderSlackMinutesByWindow`

Only slots inside `Frontier_b` may be preference-reordered inside the same timeliness band. Slots outside `Frontier_b` keep pure timeliness ordering inside their band.

**Normalized soft features for frontier slot `s`**

- `f_delay(s) = exp(-waitMinutes(s) / tau_delay)`
- `f_continuity(s) = continuityScore(s)`
- `f_site(s) = 1` for preferred site, `0.5` for neutral site, `0` otherwise
- `f_tod(s) = exp(-abs(midpointLocalMinutes(s) - preferredMidpointMinutes) / tau_tod)`
- `f_travel(s) = exp(-travelMinutes(s) / tau_travel)`
- `f_modality(s) = 1` for preferred modality, `0` otherwise

Compute:

`softScore(s) = w_delay * f_delay(s) + w_continuity * f_continuity(s) + w_site * f_site(s) + w_tod * f_tod(s) + w_travel * f_travel(s) + w_modality * f_modality(s)`

with `sum w_* = 1` in the versioned `RankPlan`.

Do not include both `waitMinutes` and `waitDays` in the same linear score. They encode the same underlying delay signal on two scales and therefore double-count availability recency.

Set the stable ordering rule to:

1. higher `windowClass(s)` first
2. inside each timeliness band `b`, rank `Frontier_b` by `softScore(s)` descending, then `startAtEpoch(s)` ascending, then `canonicalTieBreakKey(s)` ascending
3. inside each timeliness band `b`, rank slots outside `Frontier_b` by `startAtEpoch(s)` ascending, then `softScore(s)` descending, then `canonicalTieBreakKey(s)` ascending

Persist `windowClass`, `Frontier_b` membership, and the normalized feature vector in `rankFeatures`, then bind each ranked slot to one canonical `CapacityRankExplanation` inside the current `CapacityRankProof` so replay, audit, patient copy, and staff explanation all use the same ordering proof.

Implementation rules:

- compile `RankPlan` from `SearchPolicy` and persist its version in `SlotSetSnapshot`, `OfferSession`, and the linked `CapacityRankProof`
- compute the ordered rank proof once per snapshot and reuse it for pagination, day grouping, compare mode, and `see more` expansion instead of re-scoring every row on each interaction
- persist normalized feature values in `NormalizedSlot.rankFeatures` and `NormalizedSlot.scoreExplanationRef` as structured `CapacityRankExplanation` rows carrying reason codes, normalized feature values, `windowClass`, and frontier membership, not just rendered text
- break ties only with `canonicalTieBreakKey` so ranking is stable across nodes and replay
- cache `travelMinutes(s)` per search snapshot so travel burden is not recomputed on every UI interaction
- patient booking surfaces may expose one short reason cue from `CapacityRankExplanation.patientReasonCueRefs[]`, while staff-assisted booking, support replay, and operations diagnostics must read the richer explanation tuple through their own `CapacityRankDisclosurePolicy` without reordering the slot list

Store the score explanation on the candidate itself and on the governing proof. The patient does not need to see the full algorithm, but support staff and operations users need to understand why the system preferred one slot over another without reconstructing the order from raw slot rows.

Create `OfferSession` objects from the pre-ranked candidate index rather than handing slot IDs straight to the UI. That gives you a stable offer reference, a limited TTL, and a clean place to attach whether a real reservation exists.

If the supplier supports true temporary reservation, add `holdState = active`. If not, keep `holdState = none` and be honest about it. Never fake a hold countdown where none exists.

`OfferSession` must also bind one current canonical `ReservationTruthProjection` for the selected or dominant actionable offer. `OfferSession.expiresAt` is the interaction TTL, not proof of exclusivity. `exclusiveUntilAt`, reserved language, or any hold countdown may render only when `reservationTruthProjectionRef.truthState = exclusive_held` and `countdownMode = hold_expiry`; otherwise the slot card must render as truthful nonexclusive or availability-check-required posture.

Patient self-service flows may only surface self-service bookable slots. Staff-assisted flows may surface both self-service and `staff_assistable` slots, but those slots must remain clearly tagged and auditable.

When there is no acceptable local slot, branch to:

- join local waitlist
- assisted callback
- fallback-hub request for Phase 5

The hub fallback should be shaped around the booking request contract from your own phase sequence, and later Phase 5 will need to respect current Enhanced Access windows of 6:30pm to 8pm weekdays and 9am to 5pm Saturdays. ([NHS England][7])

### Frontend work

This is where the world-class minimal requirement matters most.

The slot-selection page should have:

- a calm `CasePulse` header with the appointment need
- a compact preference summary
- a ranked list of the best slots first
- one expanded slot card at a time in essential mode
- a secondary `Refine options` drawer rather than permanently exposed filters
- a sticky mobile CTA area
- extremely clear selection state
- a persistent `Need help booking?` assisted path
- almost no noise

A strong pattern here is:

- top: what this appointment is for and when it needs to happen
- middle: best options, grouped by day, with the currently selected slot pinned, one short rank cue from the current `CapacityRankExplanation.patientReasonCueRefs[]`, and any unavailable or changed option explained in plain language
- bottom: actions like choose this slot, see more, join waitlist, or ask us to arrange it

Selected and expanded slot cards must render one honest reservation cue from the current `ReservationTruthProjection`: `held` with real hold expiry when exclusive, `available and confirmed when you book` when truthful nonexclusive, `checking current availability` when revalidation or pending-confirmation posture governs, and `no longer available` or equivalent recovery posture when the reservation truth has expired, been released, or been superseded. Selected state alone may not imply the slot is being held.

Slot order, day-group order, compare order, and patient-facing reason cues such as `soonest`, `best match`, `closest suitable site`, or `fits your accessibility needs` must derive from the current `CapacityRankProof` plus `CapacityRankDisclosurePolicy`. The UI may group or hide slots, but it may not renumber, re-score, or invent fresh cues from browser-local preference state alone.

Avoid overbuilt scheduling UI and avoid default calendar-grid complexity. This should feel like a premium consumer product, not enterprise calendar software. Spatial compare can exist, but only as an explicit mode on top of the ranked-list default. Keep unfamiliar operational or clinical terms expandable in place rather than sending the patient to a separate help page.

### Tests that must pass before moving on

- scorer determinism tests
- rank-plan version replay tests
- stable tie-break tests
- timeliness-frontier reorder guard tests
- preference-ranking tests
- continuity-priority tests
- patient-versus-staff bookability tests
- no-suitable-slot branching tests
- true-hold versus no-hold UX tests
- keyboard-only slot selection tests
- screen-reader selected-slot persistence tests
- mobile usability tests
- reduced-motion selection tests

### Exit state

The patient or staff can now choose from ranked local offers rather than raw appointment inventory, without hiding legitimate staff-assisted supply.

## 4E. Commit path, revalidation, booking record, and compensation

This is the transactional core of the phase.

### Backend work

Booking commit should be implemented as a multi-step transaction with reconciliation, not a single naive API call.

All offer creation and user-visible exclusivity must run through `ReservationAuthority` and resolve to a canonical `capacityUnitRef`. No patient-facing flow may imply slot exclusivity unless a real `CapacityReservation.state = held` exists.

This phase-specific booking logic is subordinate to the canonical reservation and closure algorithm in `phase-0-the-foundation-protocol.md`. `ReservationAuthority` is the only source of exclusivity, hold, pending-confirmation, and release semantics.

Use this algorithm:

1. when an `OfferSession` is presented, persist `selectionToken`, `snapshotId`, `truthMode`, `reservationTruthProjectionRef`, and `selectionProofHash`, but do **not** mint `CapacityReservation.state = soft_selected` for every browsed candidate; a `soft_selected` reservation may exist only for the explicitly focused or chosen `capacityUnitRef`, with one active soft selection per `(bookingCaseId, canonicalReservationKey)` and a short TTL
2. when a specific slot is chosen, create `BookingTransaction` with `snapshotId`, `canonicalReservationKey`, `selectedCandidateHash`, `policyBundleHash`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, idempotency key, `preflightVersion`, `reservationVersion`, `reservationTruthProjectionRef`, `confirmationTruthProjectionRef`, `selectedSlotRef`, `localAckState`, and the initial pending settlement phases; create or refresh one `BookingConfirmationTruthProjection(confirmationTruthState = booking_in_progress, patientVisibilityState = selected_slot_pending, manageExposureState = hidden, artifactExposureState = hidden, reminderExposureState = blocked)` bound to the same selected slot and transaction chain
3. move the case to `revalidating` and evaluate

   `RevalidationPass(tx,t) = SnapshotSelectable(SlotSetSnapshot(tx.snapshotId),t) * 1[tx.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * LiveSupplierBookable(tx.selectedSlotRef,t) * PolicySatisfied(tx.selectedSlotRef, tx.policyBundleHash) * RouteWritable(tx,t) * VersionFresh(tx.preflightVersion, tx.selectedSlotRef, t)`

   where `RouteWritable(tx,t) = 1[AudienceSurfaceRouteContract live and surface publication current and RuntimePublicationBundle live and PatientShellConsistencyProjection valid and, when embedded, PatientEmbeddedSessionProjection valid]`
4. if `RevalidationPass(tx,t) = 0`, persist the structured failure reason, invalidate the selection proof, release any soft reservation, emit `booking.slot.revalidation.failed`, refresh the current `WaitlistDeadlineEvaluation`, `WaitlistFallbackObligation`, and `WaitlistContinuationTruthProjection` when local continuation is still in play, and then move the case either back to `offers_ready` or into the exact state required by `WaitlistFallbackObligation.requiredFallbackRoute`
4A. before taking the reservation lock, validate the current `BookingCase.requestLifecycleLeaseRef`, `requestOwnershipEpochRef`, route publication state, and, when `selectionAudience = staff`, the active `ReviewActionLease`; if any ownership fence is stale, expired, broken, or superseded, create or reuse `StaleOwnershipRecoveryRecord`, return same-shell `stale_recoverable`, and stop
5. acquire the `ReservationAuthority` lock on the selected `capacityUnitRef` via its `canonicalReservationKey` only after preflight passes, mint a `fencingToken`, and under that fence enforce

   `ExclusiveCount(k,t) = sum_r 1[key(r)=k and state(r) in {held, pending_confirmation, confirmed} and commitMode(r)=exclusive_hold] <= 1`

   and reject any stale `reservationVersion` or stale `fencingToken`
6. under the same fence, repeat the supplier freshness, reservation-version checks, and `BookingProviderAdapterBinding.revalidationContractRef`; if that guarded re-check fails, release the lock, persist the failure reason, and route back to search or failure policy
7. if the current `BookingProviderAdapterBinding.reservationSemantics = exclusive_hold`, convert the reservation to `held`, refresh `ReservationTruthProjection.truthState = exclusive_held`, and allow real hold-expiry copy only from that projection; if the binding says `truthful_nonexclusive` or `degraded_manual_pending`, keep the reservation truthful and non-exclusive, refresh the projection to `truthful_nonexclusive`, and do not present fake exclusivity or fake hold countdowns
8. before supplier commit continues, validate the originating request's current `SafetyDecisionRecord`, `SafetyPreemptionRecord`, and `safetyDecisionEpoch`; if a late safety epoch advanced or urgent issuance is still pending, abort calm booking commit and return governed review or recovery posture instead of committing against stale routine truth
9. move the case to `commit_pending`, create or reuse one `AdapterDispatchAttempt` for the booking effect, set `processingAcceptanceState = accepted_for_processing`, refresh `BookingConfirmationTruthProjection(confirmationTruthState = booking_in_progress, patientVisibilityState = provisional_receipt, manageExposureState = hidden, artifactExposureState = summary_only, reminderExposureState = blocked)`, and send the booking command through `BookingProviderAdapterBinding.commitContractRef` with the same idempotency key and `fencingToken`; worker restarts, button retries, or outbox replays must return the live attempt and same confirmation-truth chain instead of issuing a second external booking effect
10. treat supplier outcome as authoritative success only if the current `BookingProviderAdapterBinding.authoritativeReadContractRef` allows the proof class and it returns a durable provider reference or an authoritative read-after-write proves the appointment on the same `canonicalReservationKey`; duplicate or out-of-order callbacks must collapse through `AdapterReceiptCheckpoint` onto the same `BookingTransaction`; only then set `externalObservationState = provider_reference_seen | read_after_write_seen`, create `AppointmentRecord`, mark the reservation `confirmed`, refresh `ReservationTruthProjection.truthState = confirmed`, refresh `BookingConfirmationTruthProjection(confirmationTruthState = confirmed, authoritativeProofClass = durable_provider_reference | same_commit_read_after_write, patientVisibilityState = booked_summary, manageExposureState = writable, artifactExposureState = handoff_ready, reminderExposureState = pending_schedule)`, set `authoritativeOutcomeState = booked`, release competing soft selections, move the `BookingCase` to `booked` then `managed`, and emit the booking-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`
11. only after the `AppointmentRecord` exists, `BookingConfirmationTruthProjection.confirmationTruthState = confirmed`, and its authoritative outbox write has committed do confirmation and reminders get queued; reminder scheduling must then advance `BookingConfirmationTruthProjection.reminderExposureState = scheduled`
12. if the supplier accepts asynchronously or returns an ambiguous result under the same binding, keep the reservation in `pending_confirmation` or `disputed`, set `processingAcceptanceState = awaiting_external_confirmation`, set `authoritativeOutcomeState = confirmation_pending | reconciliation_required`, refresh `ReservationTruthProjection.truthState = pending_confirmation | disputed`, refresh `BookingConfirmationTruthProjection(confirmationTruthState = confirmation_pending | reconciliation_required, patientVisibilityState = provisional_receipt, manageExposureState = hidden, artifactExposureState = summary_only, reminderExposureState = blocked)`, move the case to `confirmation_pending` or `supplier_reconciliation_pending`, create or refresh the relevant `ExternalConfirmationGate`, and do not create final patient assurance text, writable manage posture, export-ready artifacts, or close the request; duplicate callbacks must return the live pending posture, and semantically divergent callbacks for the same provider correlation must open replay or reconciliation review rather than creating a second appointment or second booked narrative
13. if the supplier returns authoritative failure, set `externalObservationState = failed`, set `authoritativeOutcomeState = failed`, release the reservation, refresh the projection to `released | unavailable` with the terminal reason, refresh `BookingConfirmationTruthProjection(confirmationTruthState = failed, patientVisibilityState = recovery_required, manageExposureState = hidden, artifactExposureState = hidden, reminderExposureState = blocked)`, preserve or refresh the current `WaitlistFallbackObligation` until authoritative booking or durable fallback transfer exists, and move the case to `offers_ready`, `waitlisted`, `callback_fallback`, `fallback_to_hub`, or `booking_failed` according to the current waitlist-continuation truth instead of ad hoc branch policy
14. once confirmation, projections, audit writes, and gate clearance succeed, and no open booking exception, pending safety epoch, downstream lease, or stale-owner recovery remains, ask `LifecycleCoordinator` to evaluate request closure

Lock scope must be short. Never hold `ReservationAuthority` across avoidable supplier retries, notification dispatch, or projection work.

Never treat slot existence alone as sufficient revalidation. The booking commit path must re-check live supplier state against the original policy envelope.

The `RouteWritable(tx,t)` term in `RevalidationPass` must also bind the active `AudienceSurfaceRouteContract`, `surfacePublicationRef`, `RuntimePublicationBundle`, and governing `ReleaseRecoveryDisposition`. Confirm may not proceed if route publication is stale or withdrawn, if shell consistency no longer matches the booking lineage, or if embedded session posture has drifted. Those failures must keep the selected slot visible in the same shell and degrade to bounded refresh, read-only recovery, placeholder, or safe browser handoff instead of generic failure.

Core commit code may branch only on binding-declared outcome classes. Supplier-local response shapes, vendor-specific pending labels, or callback payload quirks must normalize through the current `BookingProviderAdapterBinding` before they can influence reservation truth, confirmation truth, or patient-visible copy.

This is also where the provider-pairing lifecycle matters. NHS England’s IM1 process still runs from prerequisites and SCAL through mock API access, supported test, assurance, and live rollout, so Phase 4 should be developed against deterministic mocks first, then supplier test environments, then limited live rollout by supplier and tenant pair. ([NHS England Digital][5])

Create a reconciliation worker that can answer:

- was the appointment booked remotely but not acknowledged locally?
- was the confirmation sent locally but the booking failed remotely?
- is the provider reference missing but the slot no longer available?
- should the case reopen, stay pending, or be marked booked?

### Frontend work

The confirmation path should feel precise and safe.

Build three distinct child states inside the same booking shell:

**Normal confirm**
Slot summary, contact route, reminder preferences, confirm CTA.

**Booking in progress**
Clear progress state, no duplicate tap risk, resume-safe on refresh, with the selected slot card still pinned in view.

**Confirmation or recovery**
Either a clean booked state, a `we are confirming your booking` child state when external confirmation is still pending, or a controlled recovery child state if availability changed.

Do not leave the patient on an indefinite spinner if reconciliation is required. Give them a clear `we are checking your booking` state with next-step messaging.

These are adjacent states of the same request and booking lineage, so they must render within one `PersistentShell`. Keep the selected slot card visible, show pending or recovery via `TransitionEnvelope` and `AmbientStateRibbon`, and morph the child surface in place rather than resetting the whole page or escalating non-blocking pending states into banner stacks.

`BookingConfirmationTruthProjection` governs whether the child state says `booking in progress`, `we are confirming your booking`, `we are checking your booking`, or a final booked summary. Manage links, reminder-ready copy, calendar export, print, and browser handoff may appear only when that projection has `confirmationTruthState = confirmed` and the relevant exposure states are live; appointment-object presence, callback acceptance, or transport progress alone may not unlock them.

Live confirm, reconciliation, and recovery affordances must stay active only while `PatientShellConsistencyProjection`, route publication state, and, when embedded, `PatientEmbeddedSessionProjection` remain valid. If those controls drift, the same booking shell must apply `RouteFreezeDisposition` or `ReleaseRecoveryDisposition` immediately and preserve the chosen slot card as read-only provenance or placeholder rather than exposing a stale confirm route.

The same selected slot card must also render from `PatientAppointmentWorkspaceProjection.selectedReservationTruthRef`. A pinned slot may stay visible through pending or recovery posture, but exclusivity copy, hold countdown, and calm availability reassurance may render only from the current reservation truth projection, never from `selectedSlotRef`, `OfferSession.expiresAt`, or local tap acknowledgement alone.

The same fail-closed rule applies to wrong-patient correction. An active `IdentityRepairFreezeRecord` or unreleased `identityRepairBranchDispositionRef` must suppress confirm, cancel, reschedule, reminder, and export controls in place while preserving the booked summary or chosen slot as safe context until revalidation or compensation completes.

Any patient-visible appointment summary, calendar export, attendance instruction artifact, or browser handoff from this flow must resolve through `AppointmentPresentationArtifact` under `ArtifactPresentationContract`; if navigation leaves the shell, it must consume `OutboundNavigationGrant` rather than raw browser navigation.

### Tests that must pass before moving on

- reservation-truth projection tests for selected-slot, confirm, pending-confirmation, and recovery states
- stale-slot revalidation tests
- no-soft-selection-on-browse tests
- double-book race tests
- idempotent commit tests
- duplicate callback and out-of-order receipt tests
- fencing-token replay rejection tests
- search-to-commit binding-hash drift tests
- short lock-scope under supplier latency tests
- provider-timeout reconciliation tests
- authoritative-read-contract tests for durable reference, read-after-write, and gate-required providers
- booking-confirmation-truth projection tests for booking-in-progress, confirmation-pending, reconciliation-required, confirmed, and no-premature manage or artifact exposure
- authoritative-success read-after-write tests
- partial-failure compensation tests
- exactly-once confirmation tests
- no-appointment-record-before-confirmation tests
- route-writable drift tests on confirm
- refresh-during-book tests
- end-to-end slot selection to confirmed appointment creation tests

### Exit state

Vecells can now commit real appointments without creating phantom records or false confirmations when supplier outcomes are incomplete.

## 4F. Appointment management: cancel, reschedule, reminders, and detail updates

This sub-phase turns booking into a lifecycle, not a one-time event.

### Backend work

Implement appointment management on the `AppointmentRecord` aggregate, but make every lifecycle transition explicit on both `AppointmentRecord` and `BookingCase`.

All manage actions are post-submit mutations and must traverse the canonical `ScopedMutationGate` before any supplier call or appointment write occurs.

Create these additional control objects:

**AppointmentManageCommand**
`commandId`, `appointmentId`, `bookingCaseId`, `actionScope = appointment_cancel | appointment_reschedule | appointment_detail_update | reminder_change`, `routeIntentBindingRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeContractDigestRef`, `routeIntentTupleHash`, `routeProfileRef`, `policyBundleRef`, `capabilityResolutionRef`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, `adapterContractProfileRef`, `capabilityTupleHash`, `freshnessToken`, `governingFenceEpoch`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `idempotencyKey`, `submittedByMode`, `submittedAt`

**BookingManageSettlement**
`settlementId`, `bookingCaseId`, `appointmentId`, `actionScope`, `routeIntentBindingRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeIntentTupleHash`, `capabilityResolutionRef`, `capabilityTupleHash`, `result = applied | supplier_pending | stale_recoverable | unsupported_capability | safety_preempted | reconciliation_required`, `receiptTextRef`, `experienceContinuityEvidenceRef`, `causalToken`, `transitionEnvelopeRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `routeFreezeDispositionRef`, `recoveryRouteRef`, `presentationArtifactRef`, `recordedAt`

**BookingContinuityEvidenceProjection**
`bookingContinuityEvidenceProjectionId`, `bookingCaseId`, `appointmentId`, `controlCode = booking_manage`, `routeFamilyRef`, `routeContinuityEvidenceContractRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `latestManageSettlementRef`, `latestRecoveryRouteRef`, `experienceContinuityEvidenceRef`, `continuityTupleHash`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `capturedAt`

`BookingContinuityEvidenceProjection` binds cancel, reschedule, reminder, and detail-update posture to the assurance spine. A booking shell may preserve the appointment summary and selected route anchor locally, but it may not claim writable manage posture or calm completion unless the current `ExperienceContinuityControlEvidence` still validates the same appointment lineage, selected-anchor tuple, manage route family, and live publication tuple.

`PatientAppointmentManageProjection.bookingConfirmationTruthRef` must remain `confirmationTruthState = confirmed` with `manageExposureState = writable` before cancel, reschedule, reminder, or detail-update controls render as live. If the latest booking truth falls back to `confirmation_pending`, `reconciliation_required`, `failed`, or recovery posture, the same shell may keep the appointment summary visible but it must downgrade manage actions to summary-only or recovery posture in place.

Provider-specific manage semantics remain behind `providerAdapterBindingRef`. Manage flows may branch only on the current binding's `manageSupportContractRef` outcome classes; supplier-local capability strings, provider-reference patterns, or historic appointment status assumptions may not author actionability or patient copy.

Use `AppointmentRecord.status` values:

- `booked`
- `cancellation_pending`
- `cancelled`
- `reschedule_in_progress`
- `superseded`

Execution rules:

- `BookingCase.status = managed` is entered only by the Phase 4 commit path after an authoritative appointment exists
- ordinary cancel, reschedule, reminder, and detail-update flows start from `managed`
- ordinary manage flows do not reopen the canonical `Request`; the original request should already be `closed` once the appointment outcome is durably recorded
- for any appointment `a` and time `t`, `Cancelable(a,t) = 1[a.status = booked and startAt(a) - t >= cancelCutoff(a) and no live AppointmentManageCommand fence exists for a]`
- for any appointment `a` and time `t`, `Reschedulable(a,t) = 1[a.status = booked and startAt(a) - t >= amendCutoff(a) and no live AppointmentManageCommand fence exists for a]`

For cancellation:

1. resolve `AppointmentManageCommand` for `appointment_cancel`, bind exactly one `AppointmentRecord` plus its governing `BookingCase`, and validate route family, exact route-intent tuple, the current `BookingCapabilityResolution`, the current `BookingProviderAdapterBinding`, current policy bundle, last-seen appointment version, booking fence epoch, and `Cancelable(a,t) = 1`
2. if the current appointment view is stale, the authoritative appointment or booking target no longer matches the bound route intent tuple, supplier truth is already pending, or the manage capability has been withdrawn, return `BookingManageSettlement.result = stale_recoverable`, `reconciliation_required`, or `unsupported_capability` and keep the user in the same booking shell
3. set `AppointmentRecord.status = cancellation_pending`
4. keep `BookingCase.status = managed` while supplier cancellation is in flight
5. call provider cancellation only when the current `manageSupportContractRef` declares supplier-side cancellation support; otherwise record the declared manual-assisted cancellation workflow
6. return `BookingManageSettlement.result = supplier_pending` with same-shell pending copy while authoritative supplier state is outstanding
7. on authoritative cancellation, set `AppointmentRecord.status = cancelled`, emit `booking.cancelled`, release reminder state, and only then emit released availability for the old appointment's resolved `capacityUnitRef` so waitlist matching can begin
8. if the patient wants immediate rebook, transition `BookingCase.status = searching_local` and start a new booking flow
9. if there is no immediate rebook, transition `BookingCase.status = closed`
10. if provider cancellation fails or is ambiguous, raise `BookingException`, move the case to `managed` or `supplier_reconciliation_pending` according to the failure mode, keep or create the relevant `ExternalConfirmationGate` until truth is restored, and surface `BookingManageSettlement.result = reconciliation_required`

For reschedule:

1. resolve `AppointmentManageCommand` for `appointment_reschedule`, bind one governing appointment plus booking case, require exact route-intent tuple parity plus current `BookingCapabilityResolution.capabilityTupleHash` and `providerAdapterBindingHash`, and reject stale or unsupported manage state before opening replacement search
2. validate `Reschedulable(a,t) = 1` and freeze ordinary cancel mutation on the source appointment while replacement selection is live
3. set `AppointmentRecord.status = reschedule_in_progress`
4. transition `BookingCase.status = searching_local` and open replacement search with `supersedesAppointmentRef = currentAppointmentId`
5. run the same search, offer, revalidation, and commit pipeline for the replacement slot
6. only after the replacement appointment has authoritative supplier success or same-commit read-after-write proof cancel the old appointment, unless the supplier supports atomic amend; pending replacement may not emit released availability for the old slot
7. when replacement succeeds, set the old `AppointmentRecord.status = superseded`, create or update the new `AppointmentRecord.status = booked`, write the supersession linkage on both appointment records, transition `BookingCase.status = managed`, and return settled confirmation in the same booking shell
8. if replacement search is abandoned or fails before confirmation, revert the original `AppointmentRecord.status = booked` and `BookingCase.status = managed`

For `UpdateAppointmentDetails` and reminder changes:

1. resolve `AppointmentManageCommand` for `appointment_detail_update` or `reminder_change`, bind one governing appointment plus booking case, and validate route family, exact route-intent tuple, current capability resolution, freshness token, and fence epoch before mutation
2. validate the requested field is capability-safe for the current supplier route and the current `manageSupportContractRef`
3. treat the manage form as admin-only unless the payload is explicitly routed through a clinically governed flow
4. if the submitted payload includes symptom change, worsening condition, or other clinically meaningful free text, do not mutate the appointment directly; first settle one canonical `EvidenceAssimilationRecord` and one `MaterialDeltaAssessment`, then persist immutable evidence on the originating request lineage, append `EvidenceClassificationDecision`, create `SafetyPreemptionRecord`, append `SafetyDecisionRecord`, return `BookingManageSettlement.result = safety_preempted`, and route the user back into the governed request shell without false completion text
5. if the payload is purely administrative, apply the change without moving `BookingCase` out of `managed`
6. record audit and patient-facing projection updates

For reminders, create `ReminderPlan` as a first-class object rather than scheduling raw jobs without state. That lets you manage send, retry, cancel, and template versioning safely.

Manage commands must also validate the active `AudienceSurfaceRouteContract`, `surfacePublicationRef`, `RuntimePublicationBundle`, `PatientShellConsistencyProjection`, and the current bound route-intent tuple before writable posture remains live. When running in embedded mode, cancel, reschedule, reminder, and detail-update routes must also validate `PatientEmbeddedSessionProjection`; stale publication, frozen channel posture, embedded drift, or target-tuple drift must degrade through `RouteFreezeDisposition` or `ReleaseRecoveryDisposition` in the same shell.

Manage commands must also emit and consume `BookingContinuityEvidenceProjection`. If continuity evidence for the current booking-manage route becomes stale, blocked, or degraded, the shell may keep the appointment summary, last confirmed artifact, and bounded recovery copy visible, but it must not re-enable ordinary cancel, reschedule, reminder, or detail-update controls until continuity proof is refreshed.

Legacy booking-manage routes, cached forms, or command payloads that do not carry `routeIntentBindingRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, and `routeIntentTupleHash` are recovery-only until the shell refreshes them under the current runtime contract.

If reminder change, callback fallback, or any contact-dependent manage action is blocked by an active `ReachabilityDependency`, create or refresh one `ContactRouteRepairJourney`, keep the appointment or offer anchor pinned in the same shell, and reopen ordinary manage posture only after `ContactRouteVerificationCheckpoint.rebindState = rebound`, the current `ReachabilityAssessmentRecord` is `clear` with `routeAuthorityState = current`, and the same booking continuity evidence still validates the appointment lineage.

Any patient-visible manage outcome, attendance summary, reminder artifact, calendar export, or directions handoff must resolve through `AppointmentPresentationArtifact` and `ArtifactPresentationContract`. If the contract allows only summary or placeholder, the shell may not synthesize richer body access; if the patient leaves the shell for a browser or overlay handoff, the action must consume `OutboundNavigationGrant`.

### Frontend work

This is one of the most important trust surfaces in the product.

Build a clean Manage appointment page with:

- appointment summary
- how to attend
- reminder preference and contact route
- cancel action
- reschedule action
- update details action
- support fallback if online action is unavailable

The page should feel extremely polished and quiet. Patients often open manage flows under time pressure, so keep it simple, confidence-building, and easy to recover if they pause mid-task.

For reschedule, reuse the same slot-selection UI rather than building a second version. For cancellation, include a short optional reason but do not force a long form. For detail updates, keep the form narrow and easy. Only one destructive decision should be foregrounded at a time.

The patient flow explicitly says the patient can cancel, reschedule, and update details at any time, so these are not optional extras.

Cancel, reschedule, reminder, and detail-update child states must stay inside the same booking shell and be able to show four authoritative settlement modes without a route reset:

- supplier pending
- stale or changed availability
- safety review required
- controlled recovery or support fallback

Live `PatientAppointmentManageProjection.manageCapabilityRefs[]` affordances must stay active only while the current `BookingCapabilityProjection`, `PatientShellConsistencyProjection`, surface publication state, and, when embedded, `PatientEmbeddedSessionProjection` all remain valid for the current appointment lineage. If those controls drift, preserve the current appointment summary and apply `RouteFreezeDisposition` or `ReleaseRecoveryDisposition` in place rather than bouncing the patient into a generic manage failure.

Quiet manage success must also depend on `BookingContinuityEvidenceProjection`, the current `PatientAppointmentManageProjection.pendingConfirmationState`, and `latestBookingTransactionRef.authoritativeOutcomeState = booked`. If the linked `experienceContinuityEvidenceRef` is stale or blocked after local acknowledgement, accepted-for-processing state, or supplier callback, or if supplier confirmation is still pending or disputed, the shell must hold the patient in bounded pending or recovery posture instead of collapsing into ordinary managed-state reassurance.

Calendar, reminder, attendance, and browser-handoff actions must stay summary-first through `PatientAppointmentArtifactProjection` under `ArtifactPresentationContract`; if browser or overlay navigation is allowed, it must use `OutboundNavigationGrant` and preserve a safe return to the same booking shell.

### Tests that must pass before moving on

- cancel-before-start tests
- cancel-after-start prohibition tests
- stale-manage-view rejection tests
- manage-binding drift rejection tests
- manage-mutation mutual-exclusion tests
- same-shell pending and reconciliation state tests for cancel and reschedule
- manage-action suppression tests while booking confirmation truth is not confirmed
- duplicate-tap idempotency tests for cancel, reschedule, and reminder changes
- reschedule old and new appointment consistency tests
- no-released-capacity-emission-before-authoritative-cancel tests
- reminder dedupe and cancellation tests
- manage-capability exposure tests
- contact-preference update tests
- UI regression tests on manage flows
- screen-reader manage-state continuity tests
- accessibility tests on destructive action confirmation
- booking-manage continuity-evidence tests for stale proof, supplier-pending posture, and same-shell recovery

### Exit state

The appointment is now a managed object with a full patient self-service lifecycle.

---

## 4G. Smart Waitlist and local auto-fill

This sub-phase is where the system becomes operationally valuable even when slots are scarce.

### Backend work

Implement the local Smart Waitlist now. Leave network-level waitlist for Phase 5.

This waitlist flow is an application of the same canonical reservation rules from Phase 0. Local waitlist logic may not create a second exclusivity model or bypass `ReservationAuthority`.

Create `WaitlistEntry` with:

- patient and request reference
- acceptable modality
- acceptable site set
- acceptable date window
- max travel or convenience constraints
- continuity preference
- offer mode
- response deadline policy
- compiled `eligibilityHash` and secondary index keys
- stable base `priorityKey`
- `candidateCursor`
- `activeOfferRef`
- `lastEvaluatedAt`
- `joinedAt`
- `deadlineAt`
- `safeWaitlistUntilAt`
- `expectedOfferServiceMinutes` from the active waitlist rank plan or governed fallback prior
- `latestDeadlineEvaluationRef`
- `activeFallbackObligationRef`
- `continuationTruthProjectionRef`
- active or inactive state

Create `WaitlistOffer` as a first-class object with:

- `deadlineEvaluationRef`
- `fallbackObligationRef`
- `continuationFenceEpoch`
- released slot reference
- `capacityUnitRef`
- `reservationRef`
- `reservationTruthProjectionRef`
- `allocationBatchRef`
- `truthMode = exclusive_hold | truthful_nonexclusive`
- `scoreVector`
- `offerOrdinal`
- offer state
- hold state
- offer-expiry time
- exclusive-until time, but only if `holdState = active` and a real reservation is held
- sent-at time
- responded-at time
- superseded-by reference

Use this algorithm:

1. patient or staff joins waitlist from a `BookingCase`
2. compile the preference envelope into `eligibilityHash`, secondary indexes, immutable `joinedAt`, and a stable base `priorityKey`
3. create a real `WaitlistEntry`, compute `safeWaitlistUntilAt`, mint the first `WaitlistDeadlineEvaluation`, create `WaitlistFallbackObligation(requiredFallbackRoute = stay_local_waitlist, transferState = monitoring)`, create `WaitlistContinuationTruthProjection(patientVisibleState = waiting_for_offer, windowRiskState = on_track | at_risk)`, and move the case to `waitlisted`
4. every released slot must resolve to a canonical `capacityUnitRef`
5. authoritative cancellation or newly released slot emits availability against that `capacityUnitRef`; pending or ambiguous cancellation may not emit released capacity
6. matcher retrieves only potentially eligible waitlist entries using indexed modality, site, date-window, and continuity constraints rather than scanning the whole active waitlist
7. use a two-part priority model:
   - `WaitlistEntry.priorityKey` is the immutable base key `(deadlineAt, joinedAt, waitlistEntryId)` so replay and sharded matching stay stable
   - `expectedService_i = max(s_wait_min, expectedOfferServiceMinutes_i)`
   - `safeWaitlistUntil_i = deadlineAt_i - expectedService_i`
   - `d_deadline_i = workingMinutesBetween(now, deadlineAt_i)`, positive before deadline, `0` at deadline, and negative when overdue
   - `laxity_i = d_deadline_i - expectedService_i`
   - `deadlineClass_i = 3` when `laxity_i <= 0`, `2` when `0 < laxity_i <= theta_wait_critical`, `1` when `theta_wait_critical < laxity_i <= theta_wait_warn`, and `0` otherwise
   - `deadlineWarn_i = 1 / (1 + exp((laxity_i - theta_wait_warn) / tau_deadline))`
   - `deadlineLate_i = min(1, log(1 + max(0, -laxity_i) / tau_wait_late) / log(1 + H_wait_late / tau_wait_late))`
   - `deadlinePressure_i = beta_wait_warn * deadlineWarn_i + beta_wait_late * deadlineLate_i`, with `beta_wait_warn + beta_wait_late = 1`
   - `ageLift_i = min(1, log(1 + waitMinutes_i / tau_waitlist) / log(1 + A_wait_cap / tau_waitlist))`
   - `fairnessDebt_i = min(1, max(0, waitMinutes_i - A_wait_floor) / H_wait_floor)`
   - `prefFit(i,s) = sum_{k in K} rho_k * m_k(i,s) * f_k(i,s) / max(1e-6, sum_{k in K} rho_k * m_k(i,s))`, where `K = {site, modality, travel, continuity}` and `m_k(i,s) in {0,1}` indicates that the preference dimension is known and applicable
   - `acceptProb(i,s) = calibratedAcceptanceProbability(i,s)` from an audited model family, or `0` when policy disables efficiency learning
   - `cooldown_i = 1` only while the latest terminal offer in `offerHistory` still sits inside the policy cooldown window, otherwise `0`
   - slot-specific score `matchScore(i,s) = alpha_deadline * deadlinePressure_i + alpha_age * ageLift_i + alpha_fair * fairnessDebt_i + alpha_pref * prefFit(i,s) - alpha_cooldown * cooldown_i`, with thresholds, time constants, and service-time priors versioned in the active waitlist rank plan
   - `pairUtility(i,s) = beta_age * ageLift_i + beta_fair * fairnessDebt_i + beta_pref * prefFit(i,s) + beta_accept * acceptProb(i,s) - beta_cooldown * cooldown_i`, with `sum beta_* = 1` in the active waitlist rank plan
8. before any new offer is emitted, refresh `WaitlistDeadlineEvaluation` and `WaitlistFallbackObligation` for every candidate entry; entries with `offerabilityState = fallback_required | overdue` must not receive a new local offer and must instead rotate into callback, hub, or explicit failure continuation
9. derive the deterministic eligible-pair order by `deadlineClass_i` descending, then `matchScore(i,s)` descending, then `joinedAt` ascending, then `waitlistEntryId` ascending, then stable slot tie-break
10. when one or more independent released capacity units arrive inside batching horizon `Delta_batch`, solve a micro-batched assignment problem instead of greedy slot-by-slot allocation:
   - decision `x_{i,s} in {0,1}` only for eligible pairs
   - maximize lexicographically: first total assignments for higher `deadlineClass_i`, then `sum_{i,s} x_{i,s} * matchScore(i,s)`, then `sum_{i,s} x_{i,s} * pairUtility(i,s)`
   - subject to `sum_s x_{i,s} <= 1` for each entry `i`
   - subject to `sum_i x_{i,s} <= B_s` for each released `capacityUnitRef` `s`
   - subject to `B_s = 1` by default; `B_s > 1` is allowed only under an audited truthful-nonexclusive policy with explicit wording and serialized commit attempts
   - when multiple optimal assignments remain, use the stable pair order from step 9 as the deterministic tie-break
11. all offer creation runs through `ReservationAuthority`, which writes `CapacityReservation`
12. if true hold support exists, set `B_s = 1`, convert the winning reservation to `held`, refresh `reservationTruthProjectionRef.truthState = exclusive_held`, and send one exclusive offer for that held unit; parallel offers are allowed only when there are genuinely independent capacity units
13. if no true hold exists, default to one active truthful offer per `capacityUnitRef`; if policy enables bounded truthful-nonexclusive multi-offer, choose the smallest batch size `B_s` satisfying `1 - prod_{j=1}^{B_s} (1 - acceptProb(j,s)) >= eta_fill(s)`, where `acceptProb(j,s)` is the calibrated acceptance probability of the `j`th ranked assigned offer for slot `s`, capped by `B_policy(s)`, and mark every such offer as nonexclusive and subject to live confirmation through `reservationTruthProjectionRef.truthState = truthful_nonexclusive`
14. every emitted `WaitlistOffer` must bind the current `WaitlistDeadlineEvaluation`, `WaitlistFallbackObligation`, and `continuationFenceEpoch`; stale or superseded offers may not satisfy a newer continuation fence
15. a `WaitlistEntry` may have at most one active decision-required offer across the same route family at a time
16. patient accepts within TTL or offer expires
17. an accepted offer re-enters the same revalidation and commit pipeline under the same `capacityUnitRef`; commit attempts remain serialized by `canonicalReservationKey`, and the current `WaitlistFallbackObligation` stays armed until authoritative booking truth or durable fallback transfer settles
18. expiry, supersession, or commit failure releases the reservation, refreshes `WaitlistDeadlineEvaluation` plus `WaitlistContinuationTruthProjection`, and either advances via the stored ordered candidate cursor or keeps the same fallback obligation live
19. if the waitlist can no longer satisfy the required deadline, route through the current `WaitlistFallbackObligation.requiredFallbackRoute`; callback fallback must create or link `CallbackCase` plus `CallbackExpectationEnvelope`, hub fallback must create or link `HubCoordinationCase`, and explicit booking failure may occur only when neither governed continuation path is allowed by policy

Use `expectedOfferServiceMinutes_i` as a policy-governed or empirically learned estimate of the end-to-end offer-processing cost for that entry class; never let it default to zero, or lateness will be understated for complex waitlist offers.

`safeWaitlistUntilAt` is the last truthful point at which local waitlist may still present itself as the next safe continuation. It is not a UI hint. Once the current evaluation crosses that boundary, patient and staff surfaces must stop saying the system is still simply looking for a local slot.

The waitlist must be transactional and event-driven. Do not implement it as full rescans plus send an SMS and hope. Create real offer objects with states such as `sent`, `opened`, `accepted`, `expired`, `superseded`.

This aligns directly with the architecture and patient flow, which show Join Smart Waitlist with auto-offers cancellations as a core booking outcome when immediate local confirmation is not possible.

If the waitlist cannot satisfy the booking need by the required deadline, the system should create a clean fallback request for Phase 5 or a callback path through the current `WaitlistFallbackObligation`. Do not keep the patient in an indefinite waitlist with no escalation, and do not clear fallback debt merely because one offer was sent, accepted, expired, or superseded.

### Frontend work

The waitlist experience should be lightweight and elegant.

Build:

- join-waitlist sheet
- preference summary
- confirmation child state
- manage-waitlist child state
- offer-accept child state from secure link
- expiry outcome child state

The offer-accept flow should be one of the simplest in the whole product. One key action, minimal friction, clear time limit if real, and clear fallback if the slot has already gone.

Join, manage, accept, pending, and expiry states must preserve the same request-level shell and selected offer context. Use the same card grammar as booking confirmation, keep the active offer card pinned, and when no true hold exists, never simulate countdown urgency beyond the real business state.

Waitlist offer cards must also render the current `reservationTruthProjectionRef`. `offerExpiryAt` may explain when the current response window ends, but only `ReservationTruthProjection(countdownMode = hold_expiry)` may drive reserved-for-you or time-left exclusivity copy. Nonexclusive offers must say they are subject to live confirmation, and expired or superseded offers must remain visible only as read-only provenance or recovery state.

Waitlist list rows, manage children, and secure-link accept views must also render the current `WaitlistContinuationTruthProjection`. When `windowRiskState = fallback_due | overdue`, or when the current projection has already moved to callback or hub posture, the same shell must keep the offer or preference summary visible but switch the dominant action and explanatory copy to the governed fallback path instead of pretending the patient is still simply waiting.

If an active contact dependency blocks waitlist offer acceptance, callback fallback, or reminder reassurance, that same shell must morph to `ContactRouteRepairJourney` with the active offer card still visible, and the blocked offer posture must be explained from the current `ReachabilityAssessmentRecord`. Detached settings repair or generic home recovery is not a valid waitlist continuation pattern.

### Tests that must pass before moving on

- waitlist eligibility tests
- indexed-matcher selectivity tests
- micro-batched bipartite assignment optimality tests
- offer ordering tests
- acceptance race tests
- expired-offer tests
- duplicate-offer prevention tests
- one-active-offer-per-entry tests
- single-active-offer-per-slot tests under the default truthful policy
- bounded truthful-nonexclusive batch-size calibration tests where policy enables them
- waitlist-offer reservation-truth projection tests for exclusive, nonexclusive, expired, and superseded posture
- waitlist-deadline evaluation monotonicity tests
- accepted-offer, expired-offer, and superseded-offer preservation tests for `WaitlistFallbackObligation`
- re-entry into booking commit tests
- no-capacity-release-before-authoritative-cancel tests
- deadline-based fallback tests
- callback-fallback publication tests from local waitlist deadline breach
- end-to-end cancellation to waitlist offer to booked tests

### Exit state

The local booking engine can now recover supply and fill cancellations instead of simply failing when first-choice slots are unavailable, and it does so without overselling a single released slot.

## 4H. Staff booking handoff panel, assisted booking, and exception queue

Phase 4 is not only patient self-service. Staff need a strong assisted-booking path too.

### Backend work

Build a thin but real staff-side booking panel around `BookingCase`.

Create:

**AssistedBookingSession**
`sessionId`, `bookingCaseId`, `staffUser`, `mode`, `startedAt`, `currentSnapshotRef`, `selectedSlotRef`, `capabilityResolutionRef`, `capabilityProjectionRef`, `providerAdapterBindingRef`, `providerAdapterBindingHash`, `adapterContractProfileRef`, `capabilityTupleHash`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `reviewActionLeaseRef`, `workProtectionLeaseRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `taskCompletionSettlementEnvelopeRef`

**BookingExceptionQueue**
Projection of cases needing manual attention, such as:

- supplier endpoint unavailable
- slot revalidation failure
- ambiguous commit
- patient cannot complete self-service
- capability mismatch
- linkage-required state blocking patient booking
- reminder delivery failure

Current IM1 guidance has an important effect here. If a patient-facing IM1 route requires GP-practice linkage details, or a practice-side route depends on a local consumer component, the staff panel must be able to detect that and route the case into assisted handling instead of leaving the patient stuck in a broken self-service flow. ([NHS England Digital][6])

Assisted booking should still use the same slot-search, ranking, and commit machinery, but with `selectionAudience = staff` and `bookabilityPolicy = include_staff_assistable`. Staff are not allowed to bypass the model and write mysterious side notes like `booked by phone`.

`AssistedBookingSession` must consume the same `BookingCapabilityResolution` family as the patient shell, widened only by `selectionAudience = staff`. If patient posture is `assisted_only`, the staff session may advance only when the staff resolution is `live_staff_assist` on the same supplier, `providerAdapterBindingRef`, `providerAdapterBindingHash`, and `capabilityTupleHash`; otherwise the workspace must stay in bounded recovery or blocked posture rather than silently widening supply or switching adapters.

Assisted-booking select, confirm, waitlist, hub-fallback, and recovery actions must also bind to `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, one live `ReviewActionLease`, and the current `BookingCase.requestLifecycleLeaseRef`. If queue, review, lineage, publication, trust, or ownership state drifts, the panel must fail closed in place, create or reuse stale-owner recovery, and require explicit reacquire before mutation resumes. While a user is comparing staff-assistable slots, confirming a manual recovery path, or reviewing reconciliation detail, `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState` must preserve the selected slot card, compare anchors, current recovery form, and quiet-return target while disruptive queue or evidence deltas buffer. If a protected slot, compare target, or writable fence becomes invalid, the panel must freeze in stale-recoverable posture rather than replacing the active slot comparison with a refreshed list. Closing the booking task or launching the next task may proceed only after `TaskCompletionSettlementEnvelope` reflects authoritative downstream settlement or governed recovery.

Staff-assisted booking panels must also derive `accepted`, `confirmation_pending`, `reconciliation_required`, and `confirmed` posture from the same current `BookingConfirmationTruthProjection` used by patient and request-detail surfaces. Accepted-for-processing chips, provider-reference echoes, or reminder-plan existence may widen pending explanation, but they may not close the task, present a booked chip, or unlock manage or artifact follow-ups until that projection is confirmed.

### Frontend work

Inside the staff workspace, add a booking panel or slim sub-route such as:

- `/workspace/bookings`
- `/workspace/bookings/:bookingCaseId`

It should show:

- the original booking need from triage
- patient preference summary
- local search outcome
- current exception state
- slot search and assisted confirmation controls
- clear tagging for slots that are staff-assistable but not patient self-service bookable
- fallback actions: waitlist, callback, escalate to hub

This is not the full Hub Desk. Keep it local and exception-focused.

The UI should be dense but calm: strong hierarchy, minimal clutter, fast scan, clear failure reason, obvious next action.

The assisted-booking panel must stay inside the same staff workspace shell, preserve `SelectedAnchor`, retain current compare anchors and the active recovery draft until explicit release, and keep booking mutations bound to the active `ReviewActionLease` and runtime publication state. Staff may assist, but they may not bypass stale queue context, withdrawn route contracts, or degraded workspace trust.

### Tests that must pass before moving on

- staff-assisted booking tests
- exception-queue projection tests
- capability-blocked patient path to staff assist tests
- patient-to-staff capability projection parity tests
- staff-can-see-assistable-slots tests
- patient-cannot-see-staff-only-slots tests
- ambiguous-commit recovery tests
- slot-compare anchor-preservation and stale-recoverable focus-release tests
- selected-slot tuple-hash preservation tests across revalidation, waitlist promotion, and recovery replay
- assisted-booking audit tests
- wrong-patient assisted action prevention tests

### Exit state

The local booking system now has a deliberate assisted path that can use staff-assistable supply without bypassing the booking model.

## 4I. Hardening, clinical safety, pilot rollout, and formal exit gate

This is where Phase 4 becomes releasable.

### Backend work

Instrument the booking engine deeply.

Minimum metrics:

- slot-search success rate
- slot-search p95 latency
- average usable slot count
- offer-to-selection conversion rate
- revalidation failure rate
- booking commit success rate
- ambiguous commit rate
- cancel rate
- reschedule rate
- waitlist join rate
- waitlist fill rate
- exception queue age
- reminder delivery success rate

Add alerts for:

- supplier adapter outage
- local gateway outage
- sharp rise in stale-slot failures
- repeated ambiguous commits
- capability tuple drift or wrong-adapter rejection spikes
- reminder backlog
- waitlist offers not being accepted
- booking cases stuck in `commit_pending` or `supplier_reconciliation_pending`
- booking route publication stale or withdrawn
- recovery-disposition activations on visible booking routes

Booking is also a clinical safety phase, not just an operations phase. Wrong-patient booking, wrong-time booking, silent booking failure, incorrect cancellation, and delay caused by failed slot revalidation are all clinically relevant hazards. Current NHS guidance says compliance with DCB0129 and DCB0160 is mandatory, that developers need a DCB0129-conformant clinical risk management process, and that NHS England provides templates for the safety case, risk management plan, and hazard log. ([NHS England Digital][8])

The Phase 4 hazard set should explicitly include:

- wrong patient attached to booked slot
- booking committed locally but not remotely
- booking committed remotely but not locally
- stale slot shown as available
- cancellation confirmed to patient but not provider
- reschedule creates gap or duplicate appointment
- reminder sent to wrong contact channel
- unsupported manage action exposed in UI
- stale capability tuple routes booking or manage traffic through the wrong adapter or fallback
- waitlist offer accepted after expiry but still committed
- stale embedded or withdrawn route contract leaving booking mutation live
- unsafe external calendar or browser handoff from appointment routes

### Frontend work

Before sign-off, the whole patient booking surface should feel polished enough to demo externally:

- premium slot picker
- clear confirmation state
- excellent manage-appointment page
- elegant waitlist entry and offer-accept flow
- accessibility-complete on mobile and desktop
- embedded-mode ready for later NHS App use

NHS App web integration still expects a responsive website, a demo environment, required testing in Sandpit and AOS, SCAL completion, and UI compliance with NHS requirements. Even though NHS App embedding is not the target of this phase itself, the booking UI should already be built to survive that later path. ([NHS England Digital][4])

Before widening rollout, every visible patient and staff booking route family must pin one published `AudienceSurfaceRouteContract`, one `RuntimePublicationBundle`, and governed `ReleaseRecoveryDisposition` or `RouteFreezeDisposition`. Pilot slices may not widen while booking publication is stale, embedded session posture is invalid, or assisted-booking routes are missing their workspace action fences.

### Tests that must all pass before Phase 5

- no Sev-1 or Sev-2 defects in booking commit, cancel, or reschedule paths
- deterministic slot ranking proven
- provider capability enforcement proven
- stale-slot and double-book race tests green
- ambiguous commit reconciliation proven
- self-service and assisted-booking both proven
- route-contract publication and recovery-disposition behaviour proven for patient and staff booking routes
- patient shell-consistency and embedded route-freeze behaviour proven for select, confirm, cancel, and reschedule flows
- waitlist offer and acceptance flow proven
- reminder scheduling and cancellation proven
- artifact-presentation and outbound-navigation policy behaviour proven for appointment summaries, reminders, calendar export, and browser handoff
- review-action-lease and task-completion-settlement behaviour proven for assisted booking and exception handling
- full audit trail complete for search, select, commit, cancel, reschedule, waitlist, and fallback
- updated hazard log and safety evidence completed for this release
- rollback rehearsal completed

### Exit state

Local booking is now real, safe, recoverable, and manageable.

[1]: https://digital.nhs.uk/developer/guides-and-documentation/building-healthcare-software/referrals-and-bookings/guidance-for-specific-use-cases?utm_source=chatgpt.com "Referrals and bookings - guidance for specific use cases"
[2]: https://www.england.nhs.uk/gp/investment/gp-contract/digital-requirements-guidance/ "NHS England » Digital requirements guidance"
[3]: https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards "Interface Mechanism 1 API standards - NHS England Digital"
[4]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration "NHS App web integration - NHS England Digital"
[5]: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration "IM1 Pairing integration - NHS England Digital"
[6]: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance "Interface mechanisms guidance - NHS England Digital"
[7]: https://www.england.nhs.uk/gp/investment/gp-contract/network-contract-directed-enhanced-service-des/enhanced-access-faqs/ "NHS England » Enhanced Access to General Practice services through the network contract DES – Frequently asked questions"
[8]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards?utm_source=chatgpt.com "Clinical risk management standards"
