
# 278 Phase 4 BookingCase Contract and State Machine

`seq_278` freezes the Phase 4 booking case kernel. This pack is deliberately narrow: it fixes the durable BookingIntent handoff, BookingCase aggregate, SearchPolicy contract, top-level state vocabulary, legal transition graph, route-family laws, and patient projection bundle without stealing ownership from `seq_279` or `seq_280`.

## Kernel boundary

- Phase 3 already ends with a governed `BookingIntent`; Phase 4 must wrap that lineage rather than starting from blank browser state.
- `BookingCase.status` is the top-level booking workflow only.
- Capability truth, reservation truth, confirmation truth, manage posture, and route-publication posture remain separate authorities.
- `LifecycleCoordinator` remains the only request-closure authority.

## BookingIntent handoff freeze

| Field | Meaning | Phase 4 rule |
| --- | --- | --- |
| `intentId` | Stable Phase 3 seed id | Preserve exactly; BookingCase stores this as `bookingIntentId`. |
| `lineageCaseLinkRef` | Booking child branch join | Case creation must acknowledge, not replace, this child link. |
| `decisionEpochRef` | Source decision epoch | Maps to `BookingCase.sourceDecisionEpochRef`. |
| `decisionSupersessionRecordRef` | Source decision supersession | Maps to `BookingCase.sourceDecisionSupersessionRef`. |
| `lifecycleLeaseRef` | Request lifecycle lease | Maps to `BookingCase.requestLifecycleLeaseRef`. |
| `ownershipEpoch` | Request ownership epoch | Maps to `BookingCase.ownershipEpoch`. |
| `fencingToken` | Single-writer fence | Must still validate before booking mutation. |

## BookingCase state vocabulary

| State | Dominant authority | Meaning |
| --- | --- | --- |
| handoff_received | Phase 3 BookingIntent plus the proposed LineageCaseLink. | The booking branch exists only as a direct-resolution handoff and proposed lineage child link. |
| capability_checked | BookingCapabilityResolution and BookingCapabilityProjection. | The case has validated current booking capability, route publication, trust, and identity posture but has not opened a live slot search yet. |
| searching_local | SearchPolicy plus BookingCapabilityResolution plus SlotSetSnapshot. | The case is actively running local search under one SearchPolicy and one current capability tuple. |
| offers_ready | OfferSession plus ReservationTruthProjection plus rank proof. | Current snapshot and offer session expose a lawful set of local choices. |
| selecting | OfferSession selection tuple and the selected anchor tuple hash. | The shell holds a chosen slot candidate but not yet a fresh revalidation outcome. |
| revalidating | BookingTransaction preflight, SearchPolicy, and current capability tuple. | The selected slot is being checked against supplier truth and the original SearchPolicy before commit can start. |
| commit_pending | BookingTransaction and ReservationTruthProjection. | A commit path is in flight and must not be mistaken for final booking. |
| booked | BookingConfirmationTruthProjection and AppointmentRecord. | The commit path has authoritative booking proof and can now open management posture. |
| confirmation_pending | BookingConfirmationTruthProjection. | The supplier has accepted or is processing the booking but durable confirmation truth is still pending. |
| supplier_reconciliation_pending | ExternalConfirmationGate and BookingConfirmationTruthProjection. | Supplier truth is ambiguous or disputed and the case must preserve provenance while freezing mutation. |
| waitlisted | WaitlistEntry, WaitlistDeadlineEvaluation, and WaitlistContinuationTruthProjection. | The case is still lawfully waiting for local supply and has not yet crossed into callback or hub fallback. |
| fallback_to_hub | WaitlistFallbackObligation and HubCoordinationCase typed seam. | Local booking has durably transferred to the hub path. |
| callback_fallback | WaitlistFallbackObligation and CallbackCase typed seam. | Local booking has durably transferred to governed callback handling. |
| booking_failed | BookingException and continuation truth. | The current local booking branch ended without an active waitlist or fallback continuation. |
| managed | AppointmentRecord, BookingConfirmationTruthProjection, and BookingManageSettlement. | An authoritative appointment exists and the case has entered its manage lifecycle. |
| closed | BookingCase branch settlement only; not request closure. | The booking branch is durably finished, but request closure remains a coordinator decision. |

## Authority separation

| Axis | Governing field | Owner | Notes |
| --- | --- | --- | --- |
| Booking case workflow | BookingCase.status | seq_278 | Top-level workflow status only. |
| Capability truth | BookingCapabilityResolution.capabilityState | seq_279 | Search or manage eligibility must not be inferred from BookingCase.status. |
| Reservation and hold truth | ReservationTruthProjection.truthState | seq_280 | Holds, exclusivity, and offer expiry stay on reservation truth, not case state. |
| Confirmation truth | BookingConfirmationTruthProjection.confirmationTruthState | seq_280 | Booked wording, manage exposure, and artifact readiness derive from confirmation truth only. |
| Manage posture | BookingManageSettlement + manage exposure fields | seq_280 | Cancel, reschedule, and reminder posture are separate from top-level case state. |
| Route publication and recovery | SurfacePublication + RuntimePublicationBundle + RouteFreezeDisposition + ReleaseRecoveryDisposition | seq_278 | Same-shell writability is publication-governed and can degrade without changing the booking workflow state. |

## Legal transition graph

| From | To | Controlling object | Predicate id |
| --- | --- | --- | --- |
| handoff_received | capability_checked | BookingIntent + LineageCaseLink | P278_HANDOFF_ACKNOWLEDGED |
| capability_checked | searching_local | BookingCapabilityResolution + BookingCapabilityProjection | P278_CAPABILITY_LIVE_FOR_SEARCH |
| searching_local | offers_ready | OfferSession + SlotSetSnapshot | P278_OFFERS_DISCLOSED |
| searching_local | waitlisted | WaitlistEntry + WaitlistDeadlineEvaluation + WaitlistFallbackObligation | P278_WAITLIST_SAFE |
| searching_local | callback_fallback | WaitlistFallbackObligation + CallbackCase seam | P278_CALLBACK_REQUIRED |
| searching_local | fallback_to_hub | WaitlistFallbackObligation + HubCoordinationCase seam | P278_HUB_REQUIRED |
| searching_local | booking_failed | BookingException + continuation truth | P278_SEARCH_FAILED_NO_CONTINUATION |
| offers_ready | selecting | OfferSession | P278_SLOT_CHOSEN |
| offers_ready | waitlisted | WaitlistEntry + WaitlistContinuationTruthProjection | P278_WAITLIST_CHOSEN_FROM_OFFERS |
| offers_ready | callback_fallback | WaitlistFallbackObligation | P278_OFFERS_TO_CALLBACK |
| offers_ready | fallback_to_hub | WaitlistFallbackObligation | P278_OFFERS_TO_HUB |
| offers_ready | booking_failed | OfferSession + BookingException | P278_OFFERS_EXHAUSTED |
| selecting | revalidating | BookingTransaction preflight | P278_REVALIDATION_STARTED |
| selecting | offers_ready | OfferSession | P278_SELECTION_CLEARED |
| selecting | waitlisted | WaitlistEntry + WaitlistContinuationTruthProjection | P278_SELECTION_TO_WAITLIST |
| selecting | callback_fallback | WaitlistFallbackObligation | P278_SELECTION_TO_CALLBACK |
| selecting | fallback_to_hub | WaitlistFallbackObligation | P278_SELECTION_TO_HUB |
| selecting | booking_failed | BookingException | P278_SELECTION_FAILED |
| revalidating | commit_pending | BookingTransaction | P278_PREFLIGHT_VALID |
| revalidating | offers_ready | BookingTransaction + OfferSession | P278_PREFLIGHT_REFRESH_REQUIRED |
| revalidating | waitlisted | WaitlistEntry + WaitlistDeadlineEvaluation | P278_PREFLIGHT_TO_WAITLIST |
| revalidating | callback_fallback | WaitlistFallbackObligation | P278_PREFLIGHT_TO_CALLBACK |
| revalidating | fallback_to_hub | WaitlistFallbackObligation | P278_PREFLIGHT_TO_HUB |
| revalidating | booking_failed | BookingException + continuation truth | P278_PREFLIGHT_FAILED |
| commit_pending | booked | BookingTransaction + BookingConfirmationTruthProjection + AppointmentRecord | P278_COMMIT_CONFIRMED |
| commit_pending | confirmation_pending | BookingTransaction + BookingConfirmationTruthProjection | P278_COMMIT_WAITING_CONFIRMATION |
| commit_pending | supplier_reconciliation_pending | BookingTransaction + ExternalConfirmationGate | P278_COMMIT_AMBIGUOUS |
| commit_pending | waitlisted | WaitlistEntry + WaitlistContinuationTruthProjection | P278_COMMIT_TO_WAITLIST |
| commit_pending | callback_fallback | WaitlistFallbackObligation | P278_COMMIT_TO_CALLBACK |
| commit_pending | fallback_to_hub | WaitlistFallbackObligation | P278_COMMIT_TO_HUB |
| commit_pending | booking_failed | BookingTransaction + BookingException | P278_COMMIT_FAILED |
| booked | managed | AppointmentRecord + BookingConfirmationTruthProjection | P278_MANAGE_LIFECYCLE_OPEN |
| confirmation_pending | managed | BookingConfirmationTruthProjection | P278_PENDING_TO_MANAGED |
| confirmation_pending | supplier_reconciliation_pending | ExternalConfirmationGate | P278_PENDING_TO_RECONCILIATION |
| confirmation_pending | booking_failed | BookingConfirmationTruthProjection | P278_PENDING_FAILED |
| confirmation_pending | callback_fallback | WaitlistFallbackObligation | P278_PENDING_TO_CALLBACK |
| confirmation_pending | fallback_to_hub | WaitlistFallbackObligation | P278_PENDING_TO_HUB |
| supplier_reconciliation_pending | managed | ExternalConfirmationGate + BookingConfirmationTruthProjection | P278_RECONCILIATION_CONFIRMED |
| supplier_reconciliation_pending | booking_failed | ExternalConfirmationGate + BookingException | P278_RECONCILIATION_FAILED |
| supplier_reconciliation_pending | callback_fallback | WaitlistFallbackObligation | P278_RECONCILIATION_TO_CALLBACK |
| supplier_reconciliation_pending | fallback_to_hub | WaitlistFallbackObligation | P278_RECONCILIATION_TO_HUB |
| waitlisted | selecting | WaitlistContinuationTruthProjection + WaitlistOffer | P278_WAITLIST_OFFER_VISIBLE |
| waitlisted | revalidating | WaitlistOffer + BookingTransaction | P278_WAITLIST_ACCEPTED_PENDING_BOOKING |
| waitlisted | callback_fallback | WaitlistContinuationTruthProjection + WaitlistFallbackObligation | P278_WAITLIST_TO_CALLBACK |
| waitlisted | fallback_to_hub | WaitlistContinuationTruthProjection + WaitlistFallbackObligation | P278_WAITLIST_TO_HUB |
| waitlisted | booking_failed | WaitlistContinuationTruthProjection | P278_WAITLIST_EXPIRED |
| waitlisted | managed | BookingConfirmationTruthProjection + AppointmentRecord | P278_WAITLIST_CONFIRMED |
| managed | searching_local | AppointmentManageCommand + BookingCase | P278_MANAGE_REBOOK |
| managed | supplier_reconciliation_pending | BookingManageSettlement + ExternalConfirmationGate | P278_MANAGE_RECONCILIATION |
| managed | closed | BookingManageSettlement | P278_MANAGE_FINISHED |
| callback_fallback | closed | CallbackCase seam + LineageCaseLink | P278_CALLBACK_BRANCH_CLOSED |
| fallback_to_hub | closed | HubCoordinationCase seam + LineageCaseLink | P278_HUB_BRANCH_CLOSED |
| booking_failed | closed | BookingException | P278_FAILURE_BRANCH_CLOSED |

Every conditional edge is backed by one governing predicate in `/data/contracts/278_booking_case_state_machine.json`. The graph rejects the common drift modes called out in the prompt:

1. case state does not stand in for capability state
2. reservation or confirmation truth does not collapse into `status`
3. superseded or wrong-patient lineage cannot continue mutating just because the booking shell is already open
4. callback and hub fallback remain explicit branch states, not quiet route redirects

## Lineage, route, and lease rules

| Binding | Why it exists | Rule |
| --- | --- | --- |
| sourceDecisionEpochRef | Mandatory lineage from Phase 3 decision truth into every Phase 4 mutation path. | Case creation, search, select, confirm, waitlist, callback fallback, and hub fallback must validate the current unsuperseded triage decision epoch before mutating. |
| sourceDecisionSupersessionRef | Replacement triage epochs freeze booking mutation in place. | If supersession appears after shell open, selected slot and summary provenance may remain visible but every mutation degrades to governed same-shell recovery. |
| lineageCaseLinkRef | The only canonical join from request lineage to booking work. | Case creation moves the booking child link from proposed to acknowledged and later child links must not overwrite it. |
| requestLifecycleLeaseRef | Booking mutation remains lease-bound to the request lifecycle. | Confirm, waitlist, hub fallback, callback fallback, cancel, reschedule, reminder, and staff-assisted actions must present the current request lifecycle lease. |
| ownershipEpoch | One active request ownership epoch fences booking mutation. | Ownership drift creates or reuses stale-owner recovery and freezes mutation until reacquire. |
| identityRepairBranchDispositionRef | Wrong-patient correction can quarantine live booking posture without erasing provenance. | Pending_freeze, quarantined, and compensation_pending preserve summary provenance only; live booking returns only after released settlement. |
| patientShellConsistencyProjectionRef | All patient routes stay inside one governed signed-in shell. | Same-shell booking and appointment routes may mutate only when shell continuity remains current. |
| patientEmbeddedSessionProjectionRef | Embedded entry is separately validated and can freeze writes. | Embedded mode without a current embedded-session projection must degrade to route freeze or release recovery. |
| surfaceRouteContractRef | Booking and appointment routes are explicit route-family contracts, not browser-history conventions. | Every booking child route remains publication-governed and same-shell. |
| surfacePublicationRef | Live route publication determines whether mutation remains available. | Stale, conflict, or withdrawn publication freezes in place rather than silently leaving controls live. |
| runtimePublicationBundleRef | Runtime publication is part of the same-shell safety boundary. | Shell writability depends on the live bundle, not only local route state. |
| routeFreezeDispositionRef | Route-freeze posture explains why the shell became read-only or recovery-only. | Select, confirm, cancel, and reschedule surfaces must freeze in place with explicit recovery posture. |
| releaseRecoveryDispositionRef | Release recovery can override calm route posture without changing booking workflow state. | Release recovery applies to booking routes and appointment manage flows before any local browser heuristics. |

## Later-owned typed seams

| Missing surface | Owner task | Typed seams |
| --- | --- | --- |
| Booking capability tuple and adapter binding compiler | seq_279 | activeCapabilityResolutionRef -> BookingCapabilityResolution; activeCapabilityProjectionRef -> BookingCapabilityProjection; activeProviderAdapterBindingRef -> BookingProviderAdapterBinding |
| Search snapshot, offer, reservation, confirmation, waitlist, and appointment deep contracts | seq_280 | currentOfferSessionRef -> OfferSession; selectedSlotRef -> CanonicalSlotIdentity / NormalizedSlot; appointmentRef -> AppointmentRecord; latestConfirmationTruthProjectionRef -> BookingConfirmationTruthProjection; waitlistEntryRef -> WaitlistEntry; activeWaitlistFallbackObligationRef -> WaitlistFallbackObligation; latestWaitlistContinuationTruthProjectionRef -> WaitlistContinuationTruthProjection |
| Concrete event schemas for newly frozen waitlist, fallback, and case-creation events | par_282 | booking.case.created; booking.waitlist.joined; booking.waitlist.deadline_evaluated; booking.waitlist.offer.sent; booking.waitlist.offer.accepted; booking.waitlist.offer.expired; booking.waitlist.offer.superseded; booking.waitlist.fallback.required; booking.fallback.callback_requested; booking.fallback.hub_requested; booking.exception.raised |

Those gaps are also published machine-readably in `/data/analysis/PHASE4_INTERFACE_GAP_BOOKING_CASE_KERNEL.json`. They are typed seams, not prose TODOs.

## Event and API freeze

- the event catalog is frozen in `/data/contracts/278_booking_case_event_catalog.json`
- the API skeleton is frozen there and expanded narratively in `/docs/api/278_phase4_booking_case_route_and_projection_contract.md`
- missing concrete event schemas are explicitly catalogued with `implementationOwnerTask` instead of left implicit
