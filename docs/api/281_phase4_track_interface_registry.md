# 281 Phase 4 Track Interface Registry

        ## Object ownership

        | Artifact | Type | Owner | Group | Consumer tracks |
| --- | --- | --- | --- | --- |
| BookingIntent | object | par_282 | booking_case | par_283\|par_284\|par_287\|par_293\|seq_306 |
| BookingCase | object | par_282 | booking_case | par_283\|par_284\|par_287\|par_288\|par_290\|par_293\|par_299\|seq_306 |
| SearchPolicy | object | par_282 | booking_case | par_284\|par_285\|par_287 |
| BookingCaseTransitionJournal | object | par_282 | booking_case | par_292\|seq_307\|seq_310 |
| ProviderCapabilityMatrix | object | par_283 | capability_tuple | par_284\|par_288\|par_293\|par_297\|seq_304\|seq_305 |
| AdapterContractProfile | object | par_283 | capability_tuple | par_284\|par_287\|seq_304 |
| DependencyDegradationProfile | object | par_283 | capability_tuple | par_284\|par_287\|par_290\|seq_305 |
| AuthoritativeReadAndConfirmationGatePolicy | object | par_283 | capability_tuple | par_287\|par_288\|par_292 |
| BookingProviderAdapterBinding | object | par_283 | capability_tuple | par_284\|par_286\|par_287\|par_288\|par_292 |
| BookingCapabilityResolution | object | par_283 | capability_tuple | par_284\|par_287\|par_288\|par_293\|par_299\|seq_307 |
| BookingCapabilityProjection | object | par_283 | capability_tuple | par_293\|par_297\|par_299\|par_300 |
| SlotSearchSession | object | par_284 | slot_snapshot | par_285\|par_294\|seq_307 |
| ProviderSearchSlice | object | par_284 | slot_snapshot | par_285\|seq_307 |
| TemporalNormalizationEnvelope | object | par_284 | slot_snapshot | par_285\|par_287\|par_294 |
| CanonicalSlotIdentity | object | par_284 | slot_snapshot | par_285\|par_286\|par_287\|par_294 |
| NormalizedSlot | object | par_284 | slot_snapshot | par_285\|par_286\|par_294 |
| SnapshotCandidateIndex | object | par_284 | slot_snapshot | par_285\|par_286\|seq_307 |
| SlotSetSnapshot | object | par_284 | slot_snapshot | par_285\|par_286\|par_287\|par_294\|seq_307 |
| SlotSnapshotRecoveryState | object | par_284 | slot_snapshot | par_294\|par_301 |
| RankPlan | object | par_285 | offer_ranking | par_294\|par_295\|seq_307 |
| CapacityRankProof | object | par_285 | offer_ranking | par_295\|seq_307 |
| CapacityRankExplanation | object | par_285 | offer_ranking | par_295 |
| OfferSession | object | par_285 | offer_ranking | par_286\|par_295\|seq_307 |
| CapacityReservation | object | par_286 | reservation_truth | par_287\|par_295\|seq_307 |
| ReservationTruthProjection | object | par_286 | reservation_truth | par_287\|par_295\|par_296\|par_298\|seq_307 |
| BookingTransaction | object | par_287 | commit_truth | par_292\|par_296\|seq_307\|seq_308 |
| ExternalConfirmationGate | object | par_287 | commit_truth | par_296\|seq_308 |
| BookingConfirmationTruthProjection | object | par_287 | commit_truth | par_296\|par_297\|seq_307\|seq_308 |
| AppointmentRecord | object | par_287 | commit_truth | par_297\|par_300\|par_303\|seq_308 |
| AppointmentManageCommand | object | par_288 | manage_and_artifact | par_297\|seq_308 |
| BookingManageSettlement | object | par_288 | manage_and_artifact | par_297\|par_300\|par_301\|seq_308 |
| BookingContinuityEvidenceProjection | object | par_288 | manage_and_artifact | par_293\|par_297\|par_300\|par_301\|seq_308 |
| AppointmentPresentationArtifact | object | par_288 | manage_and_artifact | par_297\|par_300\|par_303 |
| ReminderPlan | object | par_289 | reminder | par_297\|seq_308\|seq_309 |
| WaitlistEntry | object | par_290 | waitlist_and_fallback | par_298\|seq_308 |
| WaitlistDeadlineEvaluation | object | par_290 | waitlist_and_fallback | par_298\|seq_308 |
| WaitlistFallbackObligation | object | par_290 | waitlist_and_fallback | par_291\|par_298\|par_301\|seq_308 |
| WaitlistOffer | object | par_290 | waitlist_and_fallback | par_298\|seq_308 |
| WaitlistContinuationTruthProjection | object | par_290 | waitlist_and_fallback | par_298\|par_301\|seq_308 |
| AssistedBookingSession | object | par_291 | assisted_booking | par_299\|seq_308 |
| BookingException | object | par_291 | assisted_booking | par_299\|seq_308 |
| BookingExceptionQueue | object | par_291 | assisted_booking | par_299\|seq_308 |
| BookingReconciliationActionRecord | object | par_292 | reconciliation | par_296\|seq_308\|seq_309 |
| ExternalConfirmationEvidenceEnvelope | object | par_292 | reconciliation | par_296\|seq_308\|seq_309 |
| PatientAppointmentWorkspaceProjection | projection | par_293 | patient_workspace | par_300\|par_301\|par_302\|seq_309 |
| PatientAppointmentListProjection | projection | par_293 | patient_workspace | par_300\|par_302\|seq_309 |
| SlotSearchResultsSurface | projection | par_294 | patient_search | par_295\|par_302\|seq_309 |
| OfferSelectionSurface | projection | par_295 | patient_selection | par_296\|par_302\|seq_309 |
| BookingConfirmationRecoverySurface | projection | par_296 | patient_confirmation | par_301\|par_302\|seq_309 |
| PatientAppointmentManageProjection | projection | par_297 | patient_manage | par_302\|par_303\|seq_309 |
| WaitlistExperienceSurface | projection | par_298 | patient_waitlist | par_301\|par_302\|seq_309 |
| StaffBookingHandoffPanel | projection | par_299 | staff_assist | seq_309 |
| RecordOriginBookingEntrySurface | projection | par_300 | record_entry | par_301\|par_302\|seq_309 |
| PatientActionRecoveryEnvelope | projection | par_301 | recovery_envelope | par_302\|seq_309\|seq_310 |
| PatientAppointmentArtifactProjection | projection | par_303 | mobile_and_artifact | seq_309\|seq_310 |
| ProviderSandboxConfiguration | surface | seq_304 | provider_activation | seq_305\|seq_306\|seq_310 |
| ProviderCapabilityEvidencePack | surface | seq_305 | provider_activation | seq_306\|seq_310 |
| BookingPortalNotificationIntegration | surface | seq_306 | integration | seq_307\|seq_308\|seq_309\|seq_310 |
| Phase4CoreMatrixSuite | suite | seq_307 | assurance | seq_308\|seq_309\|seq_310 |
| Phase4ManageWaitlistAssistedMatrixSuite | suite | seq_308 | assurance | seq_309\|seq_310 |
| Phase4BookingE2ESuite | suite | seq_309 | assurance | seq_310 |
| Phase4BookingExitGate | suite | seq_310 | assurance |  |

        ## Event owner overrides

        | Event | 278 owner | 281 owner | Status | Reason |
| --- | --- | --- | --- | --- |
| booking.case.created | par_282 | par_282 | consistent | BookingCase creation stays in the kernel track. |
| booking.capability.resolved | par_283 | par_283 | consistent | Capability tuple resolution stays solely in the capability engine. |
| booking.slots.fetched | par_282 | par_284 | collision_remediated | Slot fetch lifecycle truth belongs to the slot snapshot pipeline, not the BookingCase kernel. |
| booking.offers.created | par_282 | par_285 | collision_remediated | Offer generation belongs to the ranking and orchestration track. |
| booking.slot.selected | par_282 | par_285 | collision_remediated | Selection rules belong to the offer orchestration track before hold and commit authority attach. |
| booking.slot.revalidated | par_282 | par_287 | collision_remediated | Commit-path revalidation belongs to the booking transaction track. |
| booking.slot.revalidation.failed | par_282 | par_287 | collision_remediated | Failed revalidation is part of commit-path truth, not case-kernel generic state. |
| booking.commit.started | par_282 | par_287 | collision_remediated | BookingTransaction owns commit start truth. |
| booking.commit.confirmation_pending | par_282 | par_287 | collision_remediated | Initial confirmation-pending settlement belongs to commit. |
| booking.commit.reconciliation_pending | par_282 | par_287 | collision_remediated | Initial ambiguous reconciliation pending is emitted by commit before worker follow-up. |
| booking.commit.confirmed | par_282 | par_287 | collision_remediated | Immediate authoritative confirmation belongs to commit. |
| booking.commit.ambiguous | par_282 | par_287 | collision_remediated | Ambiguous commit outcomes originate in commit logic and are later reconciled by 292. |
| booking.confirmation.truth.updated | par_282 | par_292 | collision_remediated | Ongoing confirmation-truth convergence belongs to reconciliation and dispute handling. |
| booking.appointment.created | par_282 | par_287 | collision_remediated | AppointmentRecord creation belongs to authoritative commit success. |
| booking.reminders.scheduled | par_282 | par_289 | collision_remediated | Reminder scheduling belongs to ReminderPlan orchestration. |
| booking.cancelled | par_282 | par_288 | collision_remediated | Cancel mutations belong to appointment management commands. |
| booking.reschedule.started | par_282 | par_288 | collision_remediated | Reschedule start belongs to appointment management commands. |
| booking.waitlist.joined | par_282 | par_290 | collision_remediated | Waitlist entry creation belongs to the smart waitlist track. |
| booking.waitlist.deadline_evaluated | par_282 | par_290 | collision_remediated | Deadline evaluation belongs to smart waitlist logic. |
| booking.waitlist.offer.sent | par_282 | par_290 | collision_remediated | Waitlist offers belong to smart waitlist logic. |
| booking.waitlist.offer.accepted | par_282 | par_290 | collision_remediated | Waitlist offer acceptance belongs to waitlist truth and continuation logic. |
| booking.waitlist.offer.expired | par_282 | par_290 | collision_remediated | Waitlist offer expiry belongs to waitlist truth and deadline logic. |
| booking.waitlist.offer.superseded | par_282 | par_290 | collision_remediated | Waitlist offer supersession belongs to waitlist truth and deadline logic. |
| booking.waitlist.fallback.required | par_282 | par_290 | collision_remediated | Fallback obligation belongs to waitlist and no-supply continuation logic. |
| booking.fallback.callback_requested | par_282 | par_290 | collision_remediated | Typed callback fallback is decided by waitlist and fallback obligation truth before staff handling. |
| booking.fallback.hub_requested | par_282 | par_290 | collision_remediated | Typed hub fallback is decided by waitlist and fallback obligation truth before staff handling. |
| booking.exception.raised | par_282 | par_291 | collision_remediated | BookingExceptionQueue ownership belongs to assisted booking and exception handling. |

        ## Production code surface roots by track

        | Track | Status | Owner role | Representative surfaces |
| --- | --- | --- | --- |
| par_282 | ready | booking_kernel | /Users/test/Code/V/packages/domains/booking/src/index.ts \| /Users/test/Code/V/packages/domains/booking/src/phase4-booking-case-kernel.ts \| /Users/test/Code/V/packages/domains/booking/tests/phase4-booking-case-kernel.test.ts |
| par_283 | ready | capability_engine | /Users/test/Code/V/packages/domains/booking/src/index.ts \| /Users/test/Code/V/packages/domains/booking/src/phase4-booking-capability-engine.ts \| /Users/test/Code/V/packages/domains/booking/tests/phase4-booking-capability-engine.test.ts |
| par_284 | blocked | slot_snapshot_pipeline | /Users/test/Code/V/packages/domains/booking/src/phase4-slot-search-pipeline.ts \| /Users/test/Code/V/services/command-api/src/phase4-slot-search.ts \| /Users/test/Code/V/packages/event-contracts/schemas/booking/booking.slots.fetched.v1.schema.json |
| par_285 | blocked | offer_orchestration | /Users/test/Code/V/packages/domains/booking/src/phase4-offer-orchestration.ts \| /Users/test/Code/V/services/command-api/src/phase4-offers.ts \| /Users/test/Code/V/packages/event-contracts/schemas/booking/booking.offers.created.v1.schema.json |
| par_286 | blocked | reservation_authority | /Users/test/Code/V/packages/domains/booking/src/phase4-reservation-authority.ts \| /Users/test/Code/V/services/command-api/src/phase4-reservation-authority.ts |
| par_287 | blocked | commit_pipeline | /Users/test/Code/V/packages/domains/booking/src/phase4-booking-commit.ts \| /Users/test/Code/V/services/command-api/src/phase4-booking-commit.ts \| /Users/test/Code/V/packages/event-contracts/schemas/booking/booking.commit.started.v1.schema.json |
| par_288 | blocked | manage_commands | /Users/test/Code/V/packages/domains/booking/src/phase4-appointment-manage.ts \| /Users/test/Code/V/services/command-api/src/phase4-appointment-manage.ts |
| par_289 | blocked | reminder_scheduler | /Users/test/Code/V/packages/domains/booking/src/phase4-reminder-scheduler.ts \| /Users/test/Code/V/services/command-api/src/phase4-reminder-scheduler.ts |
| par_290 | blocked | waitlist_runtime | /Users/test/Code/V/packages/domains/booking/src/phase4-smart-waitlist.ts \| /Users/test/Code/V/services/command-api/src/phase4-smart-waitlist.ts |
| par_291 | blocked | staff_assisted_api | /Users/test/Code/V/packages/domains/booking/src/phase4-staff-assisted-booking.ts \| /Users/test/Code/V/services/command-api/src/phase4-staff-assisted-booking.ts |
| par_292 | blocked | reconciliation_worker | /Users/test/Code/V/services/command-api/src/phase4-booking-reconciliation.ts \| /Users/test/Code/V/services/command-api/tests/phase4-booking-reconciliation.integration.test.js |
| par_293 | blocked | patient_booking_frontend | /Users/test/Code/V/apps/patient-web/src/patient-booking-workspace.tsx |
| par_294 | blocked | patient_booking_search_frontend | /Users/test/Code/V/apps/patient-web/src/patient-booking-search-results.tsx |
| par_295 | blocked | patient_offer_frontend | /Users/test/Code/V/apps/patient-web/src/patient-offer-selection.tsx |
| par_296 | blocked | patient_confirmation_frontend | /Users/test/Code/V/apps/patient-web/src/patient-booking-confirmation.tsx |
| par_297 | blocked | patient_manage_frontend | /Users/test/Code/V/apps/patient-web/src/patient-appointment-manage.tsx |
| par_298 | blocked | patient_waitlist_frontend | /Users/test/Code/V/apps/patient-web/src/patient-booking-waitlist.tsx |
| par_299 | blocked | staff_booking_frontend | /Users/test/Code/V/apps/clinical-workspace/src/staff-booking-handoff-panel.tsx |
| par_300 | blocked | patient_record_entry_frontend | /Users/test/Code/V/apps/patient-web/src/patient-booking-entry.tsx |
| par_301 | blocked | patient_recovery_frontend | /Users/test/Code/V/apps/patient-web/src/patient-booking-recovery.tsx |
| par_302 | deferred | mobile_hardening | /Users/test/Code/V/apps/patient-web/src |
| par_303 | deferred | artifact_accessibility_frontend | /Users/test/Code/V/apps/patient-web/src/patient-booking-artifacts.tsx |
| seq_304 | deferred | provider_activation | /Users/test/Code/V/tools/provider-sandboxes |
| seq_305 | deferred | provider_activation | /Users/test/Code/V/tools/provider-evidence |
| seq_306 | deferred | runtime_integration | /Users/test/Code/V/services/command-api/src/phase4-booking-integration.ts |
| seq_307 | deferred | assurance | /Users/test/Code/V/tests/playwright |
| seq_308 | deferred | assurance | /Users/test/Code/V/tests/playwright |
| seq_309 | deferred | assurance | /Users/test/Code/V/tests/playwright |
| seq_310 | deferred | governance | /Users/test/Code/V/docs/governance |

        ## Law

        - The 278 to 280 packs freeze names, schemas, and formulas.
        - The 281 registry freezes implementation ownership and launch order.
        - Later tracks may consume the earlier objects, but they may not fork their authoritative meaning.
