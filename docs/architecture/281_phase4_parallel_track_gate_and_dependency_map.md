# 281 Phase 4 Parallel Track Gate And Dependency Map

        ## Decision

        The local-booking implementation gate opens only two tracks now:

        - `par_282`
        - `par_283`

        Only `par_282` and `par_283` are approved to mutate new production code surfaces immediately.

        Every later track remains explicitly `blocked` or `deferred` until its upstream contracts and mutation authorities exist in production-shaped code.

        ## Why only the first wave opens

        The freeze packs from `278`, `279`, and `280` are sufficient to start:

        1. the executable `BookingCase` kernel
        2. the executable capability compiler and resolution engine

        They are not sufficient to let later tracks improvise ownership for slot search, offers, truthful hold, commit truth, waitlist obligation, or patient-shell recovery. This gate therefore converts the freeze packs into one exact owner map.

        ## First-wave launch table

        | Track | Title | Owned objects | Parallel-safe with |
| --- | --- | --- | --- |
| par_282 | Executable BookingCase kernel and durable intent lineage | BookingIntent, BookingCase, SearchPolicy, BookingCaseTransitionJournal | par_283 |
| par_283 | Executable capability matrix compiler and tuple resolution engine | ProviderCapabilityMatrix, AdapterContractProfile, DependencyDegradationProfile, AuthoritativeReadAndConfirmationGatePolicy, BookingProviderAdapterBinding, BookingCapabilityResolution, BookingCapabilityProjection | par_282 |

        ## Dependency map

        | Track | Status | Upstream tracks | Owned objects | Readiness note |
| --- | --- | --- | --- | --- |
| par_282 | ready | none | BookingIntent, BookingCase, SearchPolicy, BookingCaseTransitionJournal | Ready now because 278 froze the case kernel, 279 froze capability inputs, 280 froze downstream typed seams, and 281 forbids 282 from claiming slot or capability ownership. |
| par_283 | ready | none | ProviderCapabilityMatrix, AdapterContractProfile, DependencyDegradationProfile, AuthoritativeReadAndConfirmationGatePolicy, BookingProviderAdapterBinding, BookingCapabilityResolution, BookingCapabilityProjection | Ready now because 279 froze the tuple law and 281 explicitly blocks 283 from redefining BookingCase or slot semantics while allowing a parallel compile-and-resolve path. |
| par_284 | blocked | par_282, par_283 | SlotSearchSession, ProviderSearchSlice, TemporalNormalizationEnvelope, CanonicalSlotIdentity, NormalizedSlot, SnapshotCandidateIndex, SlotSetSnapshot, SlotSnapshotRecoveryState | Needs executable BookingCase and capability-query surfaces before snapshot production is lawful. |
| par_285 | blocked | par_284 | RankPlan, CapacityRankProof, CapacityRankExplanation, OfferSession | Needs 284 snapshot production and freshness law. |
| par_286 | blocked | par_285 | CapacityReservation, ReservationTruthProjection | Needs offer-session ownership and ranking proof from 285. |
| par_287 | blocked | par_286 | BookingTransaction, ExternalConfirmationGate, BookingConfirmationTruthProjection, AppointmentRecord | Needs reservation authority and truthful hold inputs from 286. |
| par_288 | blocked | par_287, par_283 | AppointmentManageCommand, BookingManageSettlement, BookingContinuityEvidenceProjection, AppointmentPresentationArtifact | Needs booked appointment truth from 287 and capability projection from 283. |
| par_289 | blocked | par_287, par_288 | ReminderPlan | Needs appointment truth and manage mutation settlement. |
| par_290 | blocked | par_286, par_287 | WaitlistEntry, WaitlistDeadlineEvaluation, WaitlistFallbackObligation, WaitlistOffer, WaitlistContinuationTruthProjection | Needs reservation and commit truth before autofill and fallback obligations are legal. |
| par_291 | blocked | par_290, par_287, par_288 | AssistedBookingSession, BookingException, BookingExceptionQueue | Needs waitlist/fallback truth and commit/manage exception inputs. |
| par_292 | blocked | par_287, par_290, par_291 | BookingReconciliationActionRecord, ExternalConfirmationEvidenceEnvelope, BookingConfirmationTruthProjection | Needs commit outputs, exception signals, and fallback branches before reconciliation can converge truth. |
| par_293 | blocked | par_282, par_283, par_284, par_285, par_287, par_292 | PatientAppointmentWorkspaceProjection, PatientAppointmentListProjection | Needs executable backend booking truth from 282 to 292. |
| par_294 | blocked | par_293, par_284, par_285 | SlotSearchResultsSurface | Needs patient workspace shell and backend snapshot truth. |
| par_295 | blocked | par_294, par_286 | OfferSelectionSurface | Needs 286 reservation truth on top of 294 search results. |
| par_296 | blocked | par_295, par_287, par_292 | BookingConfirmationRecoverySurface | Needs commit and reconciliation truth. |
| par_297 | blocked | par_296, par_288, par_289 | PatientAppointmentManageProjection | Needs 288 and 289 backend manage/reminder implementation plus 296 confirmation recovery. |
| par_298 | blocked | par_297, par_290 | WaitlistExperienceSurface | Needs 290 waitlist runtime and 297 manage/detail continuity. |
| par_299 | blocked | par_298, par_291, par_283 | StaffBookingHandoffPanel | Needs backend assisted-booking and waitlist truth before staff UI can be honest. |
| par_300 | blocked | par_293, par_297, par_299 | RecordOriginBookingEntrySurface | Needs 293, 297, and 299 to land core entry surfaces first. |
| par_301 | blocked | par_296, par_298, par_300 | PatientActionRecoveryEnvelope | Needs 296, 298, and 300 before recovery envelopes can be coherent. |
| par_302 | deferred | par_301 | MobileResponsiveBookingFlow | Deferred behind core route implementation. |
| par_303 | deferred | par_301 | PatientAppointmentArtifactProjection | Deferred behind core manage, recovery, and artifact generation work. |
| seq_304 | deferred | par_283 | ProviderSandboxConfiguration | Deferred by live-provider scope boundary. |
| seq_305 | deferred | seq_304 | ProviderCapabilityEvidencePack | Deferred by live-provider scope boundary. |
| seq_306 | deferred | seq_305 | BookingPortalNotificationIntegration | Deferred behind provider onboarding and full frontend/runtime completion. |
| seq_307 | deferred | seq_306 | Phase4CoreMatrixSuite | Deferred until runtime implementation exists. |
| seq_308 | deferred | seq_307 | Phase4ManageWaitlistAssistedMatrixSuite | Deferred until manage, waitlist, assisted, and reconciliation work exists. |
| seq_309 | deferred | seq_308 | Phase4BookingE2ESuite | Deferred until prior implementation and assurance waves finish. |
| seq_310 | deferred | seq_309 | Phase4BookingExitGate | Deferred until all prior tracks complete. |

        ## Invalidation chains

        | Chain | Title | Owning tracks | Law |
| --- | --- | --- | --- |
| IC_281_CAPABILITY_TUPLE_DRIFT | Capability tuple drift | par_283, par_284, par_285, par_286, par_288, par_297 | Capability tuple drift invalidates stale snapshots, offers, selected slots, manage views, and command drafts. |
| IC_281_SNAPSHOT_EXPIRY | Snapshot expiry without provenance loss | par_284, par_285, par_287, par_294, par_295 | Snapshot expiry invalidates selection and commit paths without erasing provenance. |
| IC_281_RESERVATION_CONFIRMATION_MANAGE | Reservation, confirmation, and manage cohesion | par_286, par_287, par_288, par_289, par_292, par_297 | Reservation truth, confirmation truth, and manage exposure cannot drift apart. |
| IC_281_ROUTE_PUBLICATION_CONTINUITY | Route publication and continuity freeze | par_288, par_293, par_297, par_300, par_301, par_303 | Route publication, embedded session, or continuity-evidence drift freezes stale booking mutation in the same shell. |
| IC_281_WAITLIST_FALLBACK_TYPED | Typed waitlist and fallback obligation chain | par_290, par_291, par_298, par_299, par_301 | Waitlist and fallback obligations remain typed dependencies rather than improvised later branches. |

        ## Owner law

        The owner matrix in [281_phase4_track_owner_matrix.csv](/Users/test/Code/V/data/analysis/281_phase4_track_owner_matrix.csv) is authoritative.

        Every load-bearing Phase 4 object or projection has exactly one owner track.
        Multiple tracks may consume an object. Multiple tracks may not own its mutation semantics.
        No later track may fork workflow state vocabulary.

        ## Collision remediations

        1. `278_booking_case_event_catalog.json` froze correct event names but overly broad implementation owners. `281` remaps the owners explicitly and leaves the naming pack untouched.
        2. `PHASE4_INTERFACE_GAP_SLOT_OFFER_COMMIT_MANAGE.json` used generic future-owner labels. `281` replaces those with exact tracks `290`, `291`, and `292`.
        3. Provider onboarding and runtime integration remain later than the first local-booking wave and stay deferred rather than quietly implied.

        ## Event owner overrides

        The exact event-owner remap is published in the readiness registry and the API interface registry. Downstream implementation must follow the `281` override map, not the broad `implementationOwnerTask` placeholders frozen in `278`.

        ## Append-only evidence

        - readiness registry: [281_phase4_track_readiness_registry.json](/Users/test/Code/V/data/contracts/281_phase4_track_readiness_registry.json)
        - dependency map: [281_phase4_dependency_interface_map.yaml](/Users/test/Code/V/data/contracts/281_phase4_dependency_interface_map.yaml)
        - consistency matrix: [281_phase4_contract_consistency_matrix.csv](/Users/test/Code/V/data/analysis/281_phase4_contract_consistency_matrix.csv)
        - gap log: [281_phase4_parallel_gap_log.json](/Users/test/Code/V/data/analysis/281_phase4_parallel_gap_log.json)
