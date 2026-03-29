# Phase 4 - The Booking Engine

**Working scope**  
Local booking orchestration and patient self-service management.

## 4A. Booking contract, case model, and state machine

This sub-phase turns Phase 3 handoffs into a real booking-domain contract.

### Backend work

Phase 3 already ends with a `BookingIntent`. Phase 4 should not discard that and start a new model. Instead, wrap it in a durable `BookingCase`.

Create these objects:

**BookingCase**  
`bookingCaseId`, `requestId`, `bookingIntentId`, `patientRef`, `tenantId`, `providerContext`, `status`, `searchPolicyRef`, `currentOfferSessionRef`, `selectedSlotRef`, `appointmentRef`, `waitlistEntryRef`, `exceptionRef`, `createdAt`, `updatedAt`

**SearchPolicy**  
`policyId`, `timeframeEarliest`, `timeframeLatest`, `modality`, `clinicianType`, `continuityPreference`, `sitePreference`, `accessibilityNeeds`, `maxTravelTime`, `bookabilityPolicy`, `selectionAudience`, `patientChannelMode`

**SlotSetSnapshot**  
`snapshotId`, `bookingCaseId`, `providerSupplier`, `integrationMode`, `fetchedAt`, `expiresAt`, `slotVersionVector`, `slotCount`, `candidateCount`, `snapshotChecksum`, `filterPlanVersion`, `rankPlanVersion`, `candidateIndexRef`, `normalizedSlotRefs`

**SnapshotCandidateIndex**  
`candidateIndexId`, `snapshotId`, `selectionAudience`, `rankPlanVersion`, `orderedSlotRefs`, `dayBucketRefs`, `aggregateCounters`

**NormalizedSlot**  
`slotPublicId`, `supplierSlotId`, `capacityUnitRef`, `scheduleId`, `siteId`, `siteName`, `clinicianType`, `modality`, `startAt`, `endAt`, `bookableUntil`, `continuityScore`, `restrictions`, `accessibilityTags`, `bookabilityMode`, `hardFilterMask`, `rankFeatures`, `canonicalTieBreakKey`, `sourceVersion`, `snapshotId`

**OfferSession**  
`offerSessionId`, `bookingCaseId`, `snapshotId`, `rankPlanVersion`, `offeredSlotRefs`, `offerMode`, `selectionAudience`, `holdSupportState`, `selectionState`, `selectionToken`, `expiresAt`

**BookingTransaction**  
`bookingTransactionId`, `bookingCaseId`, `selectedSlotRef`, `idempotencyKey`, `preflightVersion`, `fencingToken`, `commitAttempt`, `revalidationState`, `holdState`, `commitState`, `confirmationState`, `providerReference`, `reconciliationState`

**AppointmentRecord**  
`appointmentId`, `bookingCaseId`, `patientRef`, `providerReference`, `slotRef`, `site`, `modality`, `startAt`, `endAt`, `status`, `createdByMode`, `manageCapabilities`, `reminderPlanRef`

**WaitlistEntry**  
`waitlistEntryId`, `bookingCaseId`, `activeState`, `preferenceEnvelope`, `eligibilityHash`, `eligibilityWindow`, `priorityKey`, `candidateCursor`, `offerHistory`, `lastEvaluatedAt`, `deadlineAt`

**BookingException**  
`exceptionId`, `bookingCaseId`, `exceptionType`, `severity`, `lastObservedAt`, `retryState`, `fallbackRecommendation`

Lock the first booking state machine now:

`handoff_received -> capability_checked -> searching_local -> offers_ready -> selecting -> revalidating -> commit_pending -> booked | confirmation_pending | supplier_reconciliation_pending | waitlisted | fallback_to_hub | callback_fallback | booking_failed -> managed -> closed`

Execution rules:

- `revalidating` is entered the moment a chosen slot is being checked against current supplier state **and** the original `SearchPolicy`
- `waitlisted` is entered only when a real active `WaitlistEntry` exists
- `booking_failed` is entered only when the current local booking attempt has ended without an active continuation path
- `managed` is entered only after a definitive `AppointmentRecord` exists and the case has moved into its cancel, reschedule, reminder, or detail-update lifecycle

These are real durable states, not UI-only labels. `supplier_reconciliation_pending` is a `BookingCase`-local state for ambiguous or disputed supplier truth; it must attach an `ExternalConfirmationGate` to the request lineage and must never be copied into `Request.workflowState`.

Add the first event catalogue for this phase:

- `booking.case.created`
- `booking.capability.resolved`
- `booking.slots.fetched`
- `booking.offers.created`
- `booking.slot.selected`
- `booking.slot.revalidated`
- `booking.commit.started`
- `booking.commit.confirmation_pending`
- `booking.commit.reconciliation_pending`
- `booking.commit.confirmed`
- `booking.commit.ambiguous`
- `booking.appointment.created`
- `booking.reminders.scheduled`
- `booking.cancelled`
- `booking.reschedule.started`
- `booking.waitlist.joined`
- `booking.waitlist.offer.sent`
- `booking.waitlist.offer.accepted`
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

### Tests that must pass before moving on

- booking-state transition tests
- migration tests from Phase 3 `BookingIntent` to `BookingCase`
- event-schema tests for all booking events
- replay tests from `BookingIntent` through confirmed `AppointmentRecord`
- no-orphan-record tests between `BookingCase`, `AppointmentRecord`, and `WaitlistEntry`

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

Current NHS guidance matters here. IM1 Pairing currently has no decommission plan, the active foundation suppliers are Optum for EMIS Web and TPP for SystmOne, and pairing runs through prerequisites, SCAL, a model interface licence, mock API access, supported test, assurance, and live rollout. The guidance also says provider functionality differs and detailed technical specs arrive through the supplier PIP after feasibility and acceptance. ([NHS England Digital][5])

The capability matrix must also respect the split between IM1 Patient and Transaction APIs. The Patient API supports viewing, booking, amending, and cancelling appointments, but also says the user must obtain GP-practice linkage details, and if NHS login is used the product must support both linkage scenarios. The Transaction API supports slot retrieval and diary information, but appointment functionality may only be available via GP Connect depending on the provider PIP, and some Transaction-style integrations may require a consumer component on a local practice machine. ([NHS England Digital][6])

The development algorithm here is:

1. resolve tenant and practice context
2. resolve supplier and integration mode
3. load capability contract
4. fail closed if the required action is unsupported
5. route to the correct adapter
6. persist capability evidence used for the decision

Do not let the UI ask for actions the backend cannot perform. The capability matrix should be projected into the patient and staff views.

### Frontend work

Build capability-aware UX, not universal UX.

That means:

- show self-service booking only when self-service is truly supported
- show assisted-booking state when only staff-assisted booking is possible
- show linkage-required state if GP linkage details are needed
- hide cancel and reschedule buttons when not actually available
- surface degraded capability state in the shared status strip or the affected capability card, reserving full-width banners for blocked-booking moments only

The UI should still look clean and premium. Capability constraints should feel deliberate, not broken.

### Tests that must pass before moving on

- matrix-resolution tests for all tenant and supplier combinations
- adapter contract tests against mocks and supplier-specific simulators
- fail-closed tests for unsupported actions
- capability-to-UI projection tests
- local-gateway degraded-mode tests
- wrong-capability exposure tests

### Exit state

The system now knows what kind of booking it can really do before it attempts anything.

---

## 4C. Slot search, normalisation, and availability snapshots

This sub-phase makes local availability real.

### Backend work

Build slot search as a snapshot-producing operation, not a live list that the UI talks to directly.

Use this algorithm:

1. `BookingCase` enters `searching_local`
2. resolve `SearchPolicy`, including `selectionAudience` and `bookabilityPolicy`, and compile versioned `FilterPlan` and `RankPlan`
3. call the provider adapter with the supplier-specific search query and request paged or streamable results when the adapter supports it
4. normalize supplier rows incrementally into `NormalizedSlot`, resolve canonical `capacityUnitRef`, preserve raw payload references for audit, and deduplicate supplier aliases before they reach ranking
5. apply hard filters during normalization; persist reject-reason counters and only materialize rejected rows when audit or reconciliation policy requires them
6. maintain per-audience day buckets and top-`K` surfaced candidate heaps while the stream is processed, then freeze a full or page-addressable candidate index so the system does not repeatedly sort the entire result set
7. finalize `SlotSetSnapshot` with `slotCount`, `candidateCount`, source version, fetch time, expiry metadata, `snapshotChecksum`, `candidateIndexRef`, `filterPlanVersion`, and `rankPlanVersion`
8. emit `booking.slots.fetched` with raw-returned, normalized, deduplicated, filtered, and surfaced counts
9. transition case to `offers_ready` if the candidate index is non-empty

Filter, deduplicate, and bucket before ranking:

- outside clinical timeframe
- incompatible modality
- site or accessibility mismatch
- slot already expired
- provider-specific restrictions not satisfied
- `bookabilityMode` unsupported for the current `selectionAudience`
- duplicate supplier aliases resolving to the same `capacityUnitRef`

This aligns with NHS England digital requirements guidance, which says practices should make all directly bookable appointments available online, not just an arbitrary percentage. Search and projection should therefore explicitly distinguish directly bookable, staff-assistable, and currently non-bookable supply instead of flattening them into one filter. ([NHS England][2])

Do not throw away supplier metadata during normalisation. Keep raw provider payloads for audit and reconciliation, but never expose them directly to the UI.

Never re-sort the full supplier payload on every pagination or view-mode change. Page from the frozen snapshot index unless policy inputs changed.

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

### Tests that must pass before moving on

- supplier search contract tests
- slot normalisation tests across suppliers
- DST and timezone tests
- audience-aware bookability filter tests
- `capacityUnitRef` dedupe tests
- top-`K` versus full-sort equivalence tests
- snapshot-expiry tests
- large result-set performance tests
- visual regression tests on the slot list and day grouping
- screen-reader slot announcement tests
- high-zoom and narrow-width booking tests

### Exit state

Booking can now surface a trustworthy, normalized local availability view instead of raw supplier output, and staff-assisted supply is no longer accidentally filtered out.

## 4D. Slot scoring, offer orchestration, and selection experience

This sub-phase turns availability into decision-quality offers.

### Backend work

Build a deterministic scorer on top of the snapshot candidate index, not raw supplier output.

Use hard filters first, then compute a versioned `RankVector` from normalized features. Do not combine raw times, distances, and booleans on incomparable scales.

**Hard filters**

- beyond clinically safe latest date
- wrong modality for the case
- wrong clinician type
- accessibility needs not met
- not bookable by the current actor mode
- patient-specific exclusions or linkage problems

**Normalized soft features for feasible slot `s`**

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

Set the stable rank tuple to:

`RankVector(s) = (windowClass(s), softScore(s), startAtEpoch(s), canonicalTieBreakKey(s))`

where `windowClass` is ordinal and strictly ordered as:

- `2 = inside clinically preferred window`
- `1 = inside clinically acceptable window`
- `0 = outside window`

Order lexicographically by `RankVector`, descending on `windowClass` and `softScore`, then ascending on `startAtEpoch` and `canonicalTieBreakKey`.

Implementation rules:

- compile `RankPlan` from `SearchPolicy` and persist its version in both `SlotSetSnapshot` and `OfferSession`
- compute `RankVector` once per snapshot and reuse it for pagination, day grouping, and `see more` expansion instead of re-scoring every row on each interaction
- persist normalized feature values in `NormalizedSlot.rankFeatures` and `scoreExplanation` as structured reason codes, normalized feature values, and `windowClass`, not just rendered text
- break ties only with `canonicalTieBreakKey` so ranking is stable across nodes and replay
- cache `travelMinutes(s)` per search snapshot so travel burden is not recomputed on every UI interaction

Store the score explanation. The patient does not need to see the full algorithm, but support staff and operations users need to understand why the system preferred one slot over another.

Create `OfferSession` objects from the pre-ranked candidate index rather than handing slot IDs straight to the UI. That gives you a stable offer reference, a limited TTL, and a clean place to attach whether a real reservation exists.

If the supplier supports true temporary reservation, add `holdState = active`. If not, keep `holdState = none` and be honest about it. Never fake a hold countdown where none exists.

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
- middle: best options, grouped by day, with the currently selected slot pinned and any unavailable or changed option explained in plain language
- bottom: actions like choose this slot, see more, join waitlist, or ask us to arrange it

Avoid overbuilt scheduling UI and avoid default calendar-grid complexity. This should feel like a premium consumer product, not enterprise calendar software. Spatial compare can exist, but only as an explicit mode on top of the ranked-list default. Keep unfamiliar operational or clinical terms expandable in place rather than sending the patient to a separate help page.

### Tests that must pass before moving on

- scorer determinism tests
- rank-plan version replay tests
- stable tie-break tests
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

1. when an `OfferSession` is presented, resolve the candidate to `capacityUnitRef`, persist `selectionToken`, and create or refresh `CapacityReservation.state = soft_selected`
2. when a specific slot is chosen, create `BookingTransaction` with idempotency key, `preflightVersion`, and `selectedSlotRef`
3. move the case to `revalidating` and run preflight revalidation against live supplier state **and** the full original policy envelope, including timeframe, modality, clinician type, continuity rules, accessibility needs, provider restrictions, bookability mode, and source version
4. if preflight revalidation fails, persist the failure reason, release any soft reservation, and move the case either back to `offers_ready` or to `booking_failed` depending on whether alternative local supply still exists
5. acquire the `ReservationAuthority` lock on the selected `capacityUnitRef` via its `canonicalReservationKey` only after preflight passes, mint a `fencingToken`, and re-check that supplier freshness plus reservation version still satisfy the preflight assumptions
6. if that guarded re-check fails, release the lock, persist the failure reason, and route back to search or failure policy
7. if the supplier supports a real hold, convert the reservation to `held`; if no real hold exists, keep the reservation non-exclusive and do not present fake exclusivity or fake hold countdowns
8. move the case to `commit_pending` and send the booking command with the same idempotency key and `fencingToken`
9. if the supplier returns definitive success, create `AppointmentRecord`, mark the reservation `confirmed`, move the `BookingCase` to `booked` then `managed`, and emit the booking-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`
10. only after the `AppointmentRecord` exists do confirmation and reminders get queued
11. if the supplier accepts asynchronously or returns an ambiguous result, keep the reservation in `pending_confirmation` or `disputed`, move the case to `confirmation_pending` or `supplier_reconciliation_pending`, create or refresh the relevant `ExternalConfirmationGate`, and do not create final patient assurance text or close the request
12. if the supplier returns definitive failure, release the reservation and move the case to `offers_ready`, `waitlisted`, `fallback_to_hub`, or `booking_failed` according to policy
13. once confirmation, projections, and audit writes succeed, the `ExternalConfirmationGate` is cleared, and no open booking exception or downstream lease remains, ask `LifecycleCoordinator` to evaluate request closure

Lock scope must be short. Never hold `ReservationAuthority` across avoidable supplier retries, notification dispatch, or projection work.

Never treat slot existence alone as sufficient revalidation. The booking commit path must re-check live supplier state against the original policy envelope.

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

### Tests that must pass before moving on

- stale-slot revalidation tests
- double-book race tests
- idempotent commit tests
- fencing-token replay rejection tests
- short lock-scope under supplier latency tests
- provider-timeout reconciliation tests
- partial-failure compensation tests
- exactly-once confirmation tests
- no-appointment-record-before-confirmation tests
- refresh-during-book tests
- end-to-end slot selection to confirmed appointment creation tests

### Exit state

Vecells can now commit real appointments without creating phantom records or false confirmations when supplier outcomes are incomplete.

## 4F. Appointment management: cancel, reschedule, reminders, and detail updates

This sub-phase turns booking into a lifecycle, not a one-time event.

### Backend work

Implement appointment management on the `AppointmentRecord` aggregate, but make every lifecycle transition explicit on both `AppointmentRecord` and `BookingCase`.

Use `AppointmentRecord.status` values:

- `booked`
- `cancellation_pending`
- `cancelled`
- `reschedule_in_progress`
- `superseded`

Execution rules:

- `BookingCase.status = managed` is entered only by the Phase 4 commit path after a definitive appointment exists
- ordinary cancel, reschedule, reminder, and detail-update flows start from `managed`
- ordinary manage flows do not reopen the canonical `Request`; the original request should already be `closed` once the appointment outcome is durably recorded

For cancellation:

1. validate the appointment is cancellable
2. set `AppointmentRecord.status = cancellation_pending`
3. keep `BookingCase.status = managed` while supplier cancellation is in flight
4. call provider cancellation if supported, or record manual-assisted cancellation workflow if not
5. on definitive cancellation, set `AppointmentRecord.status = cancelled` and emit `booking.cancelled`
6. release reminder state and any dependent waitlist logic
7. if the patient wants immediate rebook, transition `BookingCase.status = searching_local` and start a new booking flow
8. if there is no immediate rebook, transition `BookingCase.status = closed`
9. if provider cancellation fails or is ambiguous, raise `BookingException`, move the case to `managed` or `supplier_reconciliation_pending` according to the failure mode, and keep or create the relevant `ExternalConfirmationGate` until truth is restored

For reschedule:

1. validate the appointment is amendable
2. set `AppointmentRecord.status = reschedule_in_progress`
3. transition `BookingCase.status = searching_local`
4. run the same search, offer, revalidation, and commit pipeline for the replacement slot
5. only after the replacement appointment is definitively confirmed cancel the old appointment, unless the supplier supports atomic amend
6. when replacement succeeds, set the old `AppointmentRecord.status = superseded`, create or update the new `AppointmentRecord.status = booked`, and transition `BookingCase.status = managed`
7. if replacement search is abandoned or fails before confirmation, revert the original `AppointmentRecord.status = booked` and `BookingCase.status = managed`

For `UpdateAppointmentDetails` and reminder changes:

1. validate the requested field is capability-safe for the current supplier route
2. treat the manage form as admin-only unless the payload is explicitly routed through a clinically governed flow
3. if the submitted payload includes symptom change, worsening condition, or other clinically meaningful free text, do not mutate the appointment directly; persist immutable evidence on the originating request lineage, create `SafetyPreemptionRecord`, and return the user to the governed request shell
4. if the payload is purely administrative, apply the change without moving `BookingCase` out of `managed`
5. record audit and patient-facing projection updates

For reminders, create `ReminderPlan` as a first-class object rather than scheduling raw jobs without state. That lets you manage send, retry, cancel, and template versioning safely.

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

### Tests that must pass before moving on

- cancel-before-start tests
- cancel-after-start prohibition tests
- reschedule old and new appointment consistency tests
- reminder dedupe and cancellation tests
- manage-capability exposure tests
- contact-preference update tests
- UI regression tests on manage flows
- screen-reader manage-state continuity tests
- accessibility tests on destructive action confirmation

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
- `lastEvaluatedAt`
- active or inactive state

Create `WaitlistOffer` as a first-class object with:

- released slot reference
- `capacityUnitRef`
- `reservationRef`
- offer state
- hold state
- offer-expiry time
- exclusive-until time, but only if `holdState = active` and a real reservation is held
- sent-at time
- responded-at time
- superseded-by reference

Use this algorithm:

1. patient or staff joins waitlist from a `BookingCase`
2. compile the preference envelope into `eligibilityHash`, secondary indexes, and a stable base `priorityKey`
3. create a real `WaitlistEntry` and move the case to `waitlisted`
4. every released slot must resolve to a canonical `capacityUnitRef`
5. cancellation or newly released slot emits availability against that `capacityUnitRef`
6. matcher retrieves only potentially eligible waitlist entries using indexed modality, site, date-window, and continuity constraints rather than scanning the whole active waitlist
7. use a two-part priority model:
   - `WaitlistEntry.priorityKey` is the immutable base key `(clinicalDeadlineAt, joinedAt, waitlistEntryId)` so replay and sharded matching stay stable
   - `d_deadline_i = workingMinutesBetween(now, clinicalDeadlineAt_i)`, positive before deadline, `0` at deadline, and negative when overdue
   - `deadlinePressure_i = 1 / (1 + exp((d_deadline_i - theta_wait_warn) / tau_deadline))`
   - `ageLift_i = min(1, log(1 + waitMinutes_i / tau_waitlist) / log(1 + A_wait_cap / tau_waitlist))`
   - `prefFit(i,s) = sum_{k in K} rho_k * m_k(i,s) * f_k(i,s) / max(1e-6, sum_{k in K} rho_k * m_k(i,s))`, where `K = {site, modality, travel, continuity}` and `m_k(i,s) in {0,1}` indicates that the preference dimension is known and applicable
   - `cooldown_i = 1` only while the latest terminal offer in `offerHistory` still sits inside the policy cooldown window, otherwise `0`
   - slot-specific score `matchScore(i,s) = alpha_deadline * deadlinePressure_i + alpha_age * ageLift_i + alpha_pref * prefFit(i,s) - alpha_cooldown * cooldown_i`
8. order eligible entries by urgency class, then `matchScore(i,s)` descending, then `joinedAt` ascending, then `waitlistEntryId` ascending
9. all offer creation runs through `ReservationAuthority`, which writes `CapacityReservation`
10. if true hold support exists, the system may convert the reservation to `held` and send one exclusive offer for that held unit; parallel offers are allowed only when there are genuinely independent capacity units
11. if no true hold exists, default to one active truthful offer per `capacityUnitRef`; policy may enable short-window cascading truthful offers with an absolute cap, explicit nonexclusive wording, and per-key serialized commit attempts
12. patient accepts within TTL or offer expires
13. an accepted offer re-enters the same revalidation and commit pipeline under the same `capacityUnitRef`
14. expiry, supersession, or commit failure releases the reservation and either advances via the stored ordered candidate cursor or leaves the entry active
15. if the waitlist can no longer satisfy the required deadline, move the case to `fallback_to_hub` or `booking_failed` according to policy

The waitlist must be transactional and event-driven. Do not implement it as full rescans plus send an SMS and hope. Create real offer objects with states such as `sent`, `opened`, `accepted`, `expired`, `superseded`.

This aligns directly with the architecture and patient flow, which show Join Smart Waitlist with auto-offers cancellations as a core booking outcome when immediate local confirmation is not possible.

If the waitlist cannot satisfy the booking need by the required deadline, the system should create a clean fallback request for Phase 5 or a callback path. Do not keep the patient in an indefinite waitlist with no escalation.

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

### Tests that must pass before moving on

- waitlist eligibility tests
- indexed-matcher selectivity tests
- offer ordering tests
- acceptance race tests
- expired-offer tests
- duplicate-offer prevention tests
- single-active-offer-per-slot tests under the default truthful policy
- bounded cascading truthful-offer tests where policy enables them
- re-entry into booking commit tests
- deadline-based fallback tests
- end-to-end cancellation to waitlist offer to booked tests

### Exit state

The local booking engine can now recover supply and fill cancellations instead of simply failing when first-choice slots are unavailable, and it does so without overselling a single released slot.

## 4H. Staff booking handoff panel, assisted booking, and exception queue

Phase 4 is not only patient self-service. Staff need a strong assisted-booking path too.

### Backend work

Build a thin but real staff-side booking panel around `BookingCase`.

Create:

**AssistedBookingSession**  
`sessionId`, `bookingCaseId`, `staffUser`, `mode`, `startedAt`, `currentSnapshotRef`, `selectedSlotRef`

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

### Tests that must pass before moving on

- staff-assisted booking tests
- exception-queue projection tests
- capability-blocked patient path to staff assist tests
- staff-can-see-assistable-slots tests
- patient-cannot-see-staff-only-slots tests
- ambiguous-commit recovery tests
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
- reminder backlog
- waitlist offers not being accepted
- booking cases stuck in `commit_pending` or `supplier_reconciliation_pending`

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
- waitlist offer accepted after expiry but still committed

### Frontend work

Before sign-off, the whole patient booking surface should feel polished enough to demo externally:

- premium slot picker
- clear confirmation state
- excellent manage-appointment page
- elegant waitlist entry and offer-accept flow
- accessibility-complete on mobile and desktop
- embedded-mode ready for later NHS App use

NHS App web integration still expects a responsive website, a demo environment, required testing in Sandpit and AOS, SCAL completion, and UI compliance with NHS requirements. Even though NHS App embedding is not the target of this phase itself, the booking UI should already be built to survive that later path. ([NHS England Digital][4])

### Tests that must all pass before Phase 5

- no Sev-1 or Sev-2 defects in booking commit, cancel, or reschedule paths
- deterministic slot ranking proven
- provider capability enforcement proven
- stale-slot and double-book race tests green
- ambiguous commit reconciliation proven
- self-service and assisted-booking both proven
- waitlist offer and acceptance flow proven
- reminder scheduling and cancellation proven
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
