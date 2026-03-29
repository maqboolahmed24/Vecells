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

Create these objects:

**NetworkBookingRequest**  
`networkBookingRequestId`, `originBookingCaseId`, `originRequestId`, `originPracticeOds`, `patientRef`, `priorityBand`, `clinicalTimeframe`, `modalityPreference`, `clinicianType`, `continuityPreference`, `accessNeeds`, `travelConstraints`, `reasonForHubRouting`, `requestedAt`

**HubCoordinationCase**  
`hubCoordinationCaseId`, `networkBookingRequestId`, `servingPcnId`, `status`, `ownerState`, `claimedBy`, `actingOrg`, `policyVersionRef`, `candidateSnapshotRef`, `selectedCandidateRef`, `bookingEvidenceRef`, `networkAppointmentRef`, `fallbackRef`, `externalConfirmationState`, `practiceAckDueAt`, `slaTargetAt`, `createdAt`, `updatedAt`

**EnhancedAccessPolicy**  
`policyId`, `networkStandardHours`, `approvedVarianceWindows`, `advanceAvailabilityDays`, `sameDayOnlineAllowedNoTriage`, `reminderRequired`, `simpleCancellationRequired`, `minutesPer1000Target`, `cancellationMakeUpWindowDays`, `siteConvenienceRules`, `modalityMixRules`

**NetworkCandidateSnapshot**  
`snapshotId`, `hubCoordinationCaseId`, `fetchedAt`, `expiresAt`, `candidateRefs`, `capacitySourceRefs`, `policyEvaluationSummary`, `rankPlanVersion`

**NetworkSlotCandidate**  
`candidateId`, `siteId`, `siteName`, `sourceSystem`, `slotReference`, `modality`, `clinicianType`, `startAt`, `endAt`, `requiredWindowFit`, `travelScore`, `accessFit`, `bookabilityMode`, `manageCapabilities`, `sourceVersion`, `fitFeatures`, `candidateFit`

**AlternativeOfferSession**  
`offerSessionId`, `hubCoordinationCaseId`, `candidateRefs`, `offerMode`, `patientChoiceState`, `expiresAt`, `selectedCandidateRef`

**HubBookingEvidenceBundle**  
`evidenceBundleId`, `hubCoordinationCaseId`, `commitMode`, `enteredBy`, `enteredAt`, `nativeBookingReference`, `proofRefs`, `independentConfirmationMode`, `independentConfirmationState`, `confirmedAt`

**HubAppointmentRecord**  
`hubAppointmentId`, `hubCoordinationCaseId`, `patientRef`, `hubSiteId`, `sourceBookingReference`, `commitMode`, `startAt`, `endAt`, `modality`, `status`, `manageCapabilities`, `externalConfirmationState`, `practiceAcknowledgementState`, `confirmationEvidenceRef`

**PracticeAcknowledgementRecord**  
`acknowledgementId`, `hubCoordinationCaseId`, `originPracticeOds`, `deliveryState`, `ackState`, `ackedBy`, `ackedAt`, `deliveryEvidenceRef`

**HubFallbackRecord**  
`fallbackId`, `hubCoordinationCaseId`, `fallbackType`, `reasonCode`, `returnedToPracticeTaskRef`, `patientInformedAt`

Lock the main state machine now:

`hub_requested -> intake_validated -> queued -> claimed -> candidate_searching -> candidates_ready -> coordinator_selecting -> candidate_revalidating -> native_booking_pending -> confirmation_pending -> booked_pending_practice_ack -> booked -> closed`

Branch states from `coordinator_selecting` are:

- `alternatives_offered`
- `patient_choice_pending`
- `callback_offered`
- `escalated_back`

Definitions:

- `alternatives_offered` is entered when a real `AlternativeOfferSession` has been created
- `patient_choice_pending` is entered when at least one live offer has been delivered and the case is now waiting for patient response
- `callback_offered` is entered when a callback-only fallback has been issued
- `escalated_back` is entered when a `HubReturnToPracticeRecord` or equivalent urgent return has been created
- `candidate_revalidating` is entered when a selected network candidate is being rechecked against live capacity, `sourceVersion`, snapshot expiry, and policy rules before native booking

These are durable operational states, not descriptive labels.

Add the first event catalogue:

- `hub.request.created`
- `hub.case.created`
- `hub.case.claimed`
- `hub.case.released`
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
- `hub.callback.offered`
- `hub.escalated.back`
- `hub.case.closed`

Expose a dedicated API surface:

- `POST /v1/hub/requests`
- `GET /v1/hub/cases/{hubCoordinationCaseId}`
- `POST /v1/hub/cases/{hubCoordinationCaseId}:claim`
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

### Tests that must pass before moving on

- state-transition tests for all allowed and forbidden hub case paths
- migration tests from Phase 4 fallback objects into `NetworkBookingRequest`
- no-orphan tests between `HubCoordinationCase`, `HubAppointmentRecord`, `PracticeAcknowledgementRecord`, and `HubFallbackRecord`
- event-schema compatibility tests
- projection rebuild tests for hub cases from raw events
- no-booked-state-before-external-confirmation tests
- no-close-before-practice-ack tests for booked cases

### Exit state

The platform now has a dedicated network-coordination domain rather than treating hub work as an unstructured booking exception, and booked cases cannot silently outrun confirmation or practice visibility.

## 5B. Staff identity, organisation boundaries, and acting context

This sub-phase makes cross-practice work safe.

### Backend work

For a PCN Hub Desk, the access model must become stricter than a normal practice workflow. This is the right place to integrate staff identity around CIS2. NHS England says CIS2 is the secure SSO service for health and care professionals, required for some national APIs, recommended for other third-party health applications, and that all new integrations must use CIS2 because CIS1 is deprecated. ([NHS England Digital][2])

Add these objects:

**StaffIdentityContext**  
`staffUserId`, `authProvider = cis2`, `homeOrganisation`, `activeOrganisation`, `rbacClaims`, `nationalRbacRef`, `sessionAssurance`, `authenticatedAt`

**ActingContext**  
`actingContextId`, `staffUserId`, `homePracticeOds`, `activePcnId`, `activeHubSiteId`, `purposeOfUse`, `breakGlassState`

**CoordinationOwnership**  
`hubCoordinationCaseId`, `claimedBy`, `claimedAt`, `activeOrganisation`, `handoffChain`, `supervisorOverrideState`

Build the permission model around three visibility tiers:

- **origin practice visibility:** can see request lineage, booking status, fallback reason, patient comms status
- **hub desk visibility:** can see enough clinical and operational context to coordinate safely
- **servicing site visibility:** can see only what is required to deliver the booked encounter or manage that site’s slot capacity

Do not rely on raw role names alone. Use RBAC plus attributes like `originPractice`, `servingPCN`, `servingSite`, `purposeOfUse`, and `breakGlassState`.

Every command must carry `ActingContext`, and every write must append an audit record that includes:

- who acted
- from which organisation
- on behalf of which coordination case
- why the action was permitted
- whether break-glass was used

### Frontend work

The hub desk UI should make acting context obvious without becoming noisy.

Build:

- organisation chip in the global header
- active PCN or site switcher where allowed
- origin-practice context integrated into `CasePulse` or the shared context strip rather than a repeating banner on every case
- collapsed sensitive-content section by default if the user is outside the origin practice
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

The current DES is detailed enough that several policy items should exist as typed configuration, not comments in code. At minimum, `EnhancedAccessPolicy` should model current standard hours, any commissioner-approved variance windows, two-week advance availability expectations, reminder and cancellation requirements, the minimum 60 minutes per 1,000 adjusted patients per week, and the requirement to make up cancelled Enhanced Access time within two weeks unless otherwise agreed. Some of those are case-routing rules, while others are service-level operational rules that should feed dashboards and exception alerts rather than blocking a single patient flow. ([NHS England][4])

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
- whether it sits inside the required window
- whether it fits approved variance windows
- manage capabilities
- patient-accessibility fit

Treat `requiredWindowFit` as an ordinal rather than a loose boolean:

- `2 = inside_required_window`
- `1 = inside_approved_variance_window`
- `0 = outside_window_but_still_visible_by_policy`

Persist normalized fitness features rather than one opaque score. For case `c` and candidate slot `s`, compute:

- `g_window(c,s) = requiredWindowFit(c,s) / 2`
- `g_modality(c,s) = 1` when modality is compatible, otherwise `0`
- `g_access(c,s) in [0,1]`
- `g_travel(c,s) = exp(-travelMinutes(c,s) / tau_travel)`
- `g_wait(c,s) = exp(-waitMinutes(s) / tau_wait)`
- `g_fresh(c,s) = exp(-stalenessMinutes(s) / tau_fresh)`

Then compute:

`candidateFit(c,s) = w_window * g_window(c,s) + w_modality * g_modality(c,s) + w_access * g_access(c,s) + w_travel * g_travel(c,s) + w_wait * g_wait(c,s) + w_fresh * g_fresh(c,s)`

with `sum w_* = 1` in a versioned rank plan.

When surfacing candidate options, sort by `requiredWindowFit` descending, then `candidateFit(c,s)` descending, then `startAt` ascending, then `candidateId` ascending so clinical window fit wins before convenience.

The ingestion algorithm should be:

1. resolve the participating hub sites for the case’s PCN
2. load current `EnhancedAccessPolicy`
3. fetch capacity from each active source
4. normalize into `NetworkSlotCandidate`
5. compute and persist `candidateFit` inputs once per snapshot so later queueing and option views reuse the same math
6. apply policy filters
7. persist `NetworkCandidateSnapshot`
8. emit policy exceptions if capacity is missing, stale, or non-compliant

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
- stale-feed signal in the shared status strip plus local stale markers on affected capacity panes
- lightweight day and week strip view of capacity

Do not build a giant calendar first. Build a high-signal coordination view first: which sites have usable supply right now, and how well does it fit the case?

### Tests that must pass before moving on

- policy-evaluation tests against current standard-hour rules
- approved-variance-window tests
- capacity-source contract tests
- stale-feed detection tests
- overlapping-slot deduplication tests
- minutes-ledger calculation tests
- cancellation-make-up tracking tests
- DST and timezone tests across sites

### Exit state

The hub system can now reason about actual Enhanced Access supply instead of relying on manual guesswork or fragmented site lists.

---

## 5D. Coordination queue, candidate ranking, and SLA engine

This sub-phase makes the hub desk operational.

### Backend work

The hub desk should not just list requests. It should rank them against risk and capacity fit, with risk always dominating convenience.

For case `i`, define:

- `d_clin_i = workingMinutesBetween(now, clinicalWindowClose_i)`, positive before window close, `0` at close, and negative when overdue
- `d_sla_i = workingMinutesBetween(now, slaTargetAt_i)`, positive before SLA target, `0` at target, and negative when overdue
- `band_clin_i = 3` when `d_clin_i <= 0`, `2` when `0 < d_clin_i <= theta_clin_critical`, `1` when `theta_clin_critical < d_clin_i <= theta_clin_warn`, and `0` otherwise
- `band_sla_i = 3` when `d_sla_i <= 0`, `2` when `0 < d_sla_i <= theta_sla_critical`, `1` when `theta_sla_critical < d_sla_i <= theta_sla_warn`, and `0` otherwise
- `clinPressure_i = 1 / (1 + exp((d_clin_i - theta_clin_warn) / tau_clin))`
- `slaPressure_i = 1 / (1 + exp((d_sla_i - theta_sla_warn) / tau_sla))`
- `risk_i = max(clinPressure_i, slaPressure_i)`
- `riskBand_i = max(band_clin_i, band_sla_i)`
- `bestFit_i = max_s candidateFit(i,s)` over the current `NetworkCandidateSnapshot`, or `0` if no policy-valid candidate exists
- `access_i in [0,1]` for access-needs severity and travel burden
- `modalityGap_i in [0,1]` where `0` is exact fit and `1` is poor fit
- `localFail_i in {0,1}` when local booking has already failed
- `awaitingPatient_i in {0,1}` when the patient is awaiting a response
- `bounce_i = min(bounceCount_i, B_cap) / B_cap`

Then compute the non-risk secondary score:

`secondaryScore_i = b_gap * (1 - bestFit_i) + b_access * access_i + b_modality * modalityGap_i + b_localfail * localFail_i + b_waiting * awaitingPatient_i + b_bounce * bounce_i`

with all `b_* >= 0`, `sum b_* = 1`, and versioned in the coordination rank plan.

Use the stable sort key:

1. `riskBand_i` descending
2. originating clinical priority descending
3. `risk_i` descending
4. `secondaryScore_i` descending
5. `createdAt` ascending
6. `hubCoordinationCaseId` ascending

This keeps risk lexicographically ahead of convenience. A pure weighted sum cannot guarantee that property.

Keep the ranking explanation. Supervisors need to know why one case sits above another, so persist `riskBand_i`, `risk_i`, `bestFit_i`, normalized feature values, and the active rank-plan version.

Create these projections:

- `hub_coordination_queue_projection`
- `hub_my_cases_projection`
- `hub_candidates_projection`
- `hub_alternative_offers_projection`
- `hub_returned_to_practice_projection`
- `hub_sla_risk_projection`

Then add a timer engine with explicit thresholds:

- candidate refresh timer
- patient choice expiry timer
- required-window breach timer
- too-urgent-for-network timer
- practice-notification overdue timer

For fairness across origin practices, apply deterministic deficit round robin only within the same non-critical `riskBand_i` after the above sort, so one practice cannot monopolize the queue while imminent-breach cases still bypass the fairness merge. Use per-practice credits `credit_o <- credit_o + q_o`, emit from the eligible practice with largest credit, then decrement that practice credit by `1`.

A good operational rule is that the hub desk should never discover too urgent only after the clinically required window has already closed. The SLA engine should elevate those cases before failure.

### Frontend work

This is the most important staff surface of the phase.

Use a **three-panel coordination layout**:

- **left panel:** queue, saved views, filters
- **centre panel:** candidate options, ranked by fitness
- **right panel:** communications, audit trail, and next actions

This should feel different from the Clinical Workspace, but consistent with it. More coordination, less clinical reading. Still dense, still premium, still minimal.

Build:

- ranked option cards
- best-fit-now strip
- urgency band with time-to-window-close
- one-click claim and release
- queue views by origin practice, site, or SLA risk
- sticky action rail on case detail

If travel or convenience scoring is enabled, present that lightly. The flow already allows optional travel-time ranking, so this is the right place for it.

### Tests that must pass before moving on

- ranking determinism tests
- time-to-window-breach simulations
- fairness tests across origin practices
- no-starvation tests for lower-priority but aging cases
- concurrent claim tests
- candidate refresh invalidation tests
- queue performance tests on large PCN caseloads
- keyboard-only hub navigation tests

### Exit state

The hub desk can now pull the right case forward at the right time and show the best available options without manual sorting chaos.

---

## 5E. Alternative offers, patient choice, and network-facing UX

This sub-phase turns no-perfect-slot into a real patient interaction instead of an internal dead end.

### Backend work

The fallback shape is explicit: if there is no suitable slot in the required window, the hub can offer alternatives such as a different time, site, or clinician callback; if the case is too urgent, it goes back to the practice duty path.

Build `AlternativeOfferSession` as a first-class coordination object. It should support:

- slot alternatives
- different site alternatives
- different time-window alternatives
- callback alternative
- accept, decline, or no-response outcomes
- secure patient links
- TTL and expiry
- staff-assisted selection over the phone with structured read-back capture

The algorithm should be:

1. coordinator chooses to offer alternatives
2. system packages ranked candidate set into an `AlternativeOfferSession` and sets `HubCoordinationCase.status = alternatives_offered`
3. once the offer is actually delivered, or a phone read-back session begins, system sets `HubCoordinationCase.status = patient_choice_pending`
4. patient accepts one option, declines all, or requests callback
5. if a patient accepts an option, move the case to `coordinator_selecting` or directly to `native_booking_pending`, depending on whether the chosen route needs final staff confirmation
6. if the patient requests callback, create `CallbackFallbackRecord` and set `HubCoordinationCase.status = callback_offered`
7. if the offer expires or is declined, return the case to `queued` or to `callback_offered` according to policy

### Frontend work

There are two frontends here.

The first is the hub-staff alternative-offer composer, where staff choose what to offer and how to word it.

The second is the patient option page, which should be exceptionally clean:

- one clear title
- a short explanation
- ranked option cards
- visible site, time, and modality
- one-tap accept
- clear decline or callback route
- minimal chrome
- mobile-first layout

Because NHS App web integrations still surface responsive websites and may require header and footer adjustments, design this offer page as an embed-ready route from day one. ([NHS England Digital][3])

This patient choice flow must still reuse the same request shell and selected-offer card grammar as local booking. Accept, decline, callback, and expiry states should morph in place with `TransitionEnvelope` and `AmbientStateRibbon`, not by dumping the patient into unrelated standalone pages.

### Tests that must pass before moving on

- secure offer-link issue and expiry tests
- wrong-patient acceptance prevention
- accept-versus-expire race tests
- staff-assisted accept flow tests
- decline-all and callback-selection tests
- re-entry from accepted offer into commit flow tests
- mobile rendering tests across common breakpoints
- accessibility tests on option cards and destructive actions

### Exit state

When the ideal hub slot is unavailable, the system can still produce a controlled and patient-friendly network choice flow.

---

## 5F. Native hub booking commit, practice continuity, and cross-org messaging

This sub-phase turns coordination into a booked outcome.

### Backend work

The central design truth of this phase is that many hub bookings will happen in a hub-native system, not in the same system used for local practice booking. The flow says that directly, so the platform must model it honestly.

This section is subordinate to the canonical reservation, closure, and reopen algorithm in `phase-0-the-foundation-protocol.md`. Hub coordination may adapt to different supplier surfaces, but it may not bypass `ReservationAuthority` or `LifecycleCoordinator`.

Create a `HubBookingCommit` flow with commit modes:

- `native_api`
- `manual_pending_confirmation`
- `imported_confirmation`

The algorithm should be:

1. coordinator selects a candidate and resolves it to the same canonical `capacityUnitRef` used by local booking and waitlist flows
2. system asks `ReservationAuthority` to create or refresh `CapacityReservation` for that `capacityUnitRef`
3. system sets `HubCoordinationCase.status = candidate_revalidating`
4. system refreshes the selected candidate against current capacity source, `sourceVersion`, snapshot expiry, and the applicable policy envelope, including window fit, modality, clinician type, and access requirements
5. if the candidate is stale, unavailable, or no longer policy-valid, persist the failure reason, release the reservation, and return the case to `candidate_searching` or `candidates_ready`
6. only after successful revalidation does the system set `HubCoordinationCase.status = native_booking_pending`
7. if a real hold is supported, convert the reservation to `held`; if not, keep the reservation non-exclusive and do not imply exclusivity to the user
8. if API exists, call the native booking adapter with the same serialized capacity claim
9. if no API exists, coordinator records structured proof into `HubBookingEvidenceBundle`; that proof may advance only to `pending_confirmation`, not to final booked state
10. on definitive external confirmation, create `HubAppointmentRecord`, mark the reservation `confirmed`, and keep the origin `BookingCase` in legal Phase 4 states only
11. if hub confirmation is async or ambiguous, keep the reservation in `pending_confirmation` or `disputed`, create or keep the relevant `ExternalConfirmationGate`, do not create final patient assurance text, and block request closure
12. once definitive hub confirmation exists, create any required local proxy or bridge reference, update the origin `BookingCase` to `status = managed`, and set `HubCoordinationCase.status = booked_pending_practice_ack`
13. send patient and practice notifications with wording that matches the actual confirmation state
14. once the origin practice acknowledges visibility, set `HubAppointmentRecord.practiceAcknowledgementState = acknowledged`, transition the hub case to `booked`, and emit the booked-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`
15. once booked proof, practice visibility, and patient-facing projections are all durably committed, ask `LifecycleCoordinator` to evaluate request closure

Never write `network_booked_pending_practice_ack` or any other hub-only value into `BookingCase.status`. The origin booking lineage must use only legal Phase 4 states.

The hub must use the same `ReservationAuthority` or a strictly serialized bridge keyed to the same `capacityUnitRef` so local, waitlist, and hub flows cannot oversubscribe the same slot.

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

Where direct practice-to-hub APIs are not available, add a `PracticeContinuityMessage` path. MESH is still an appropriate secure fallback for cross-organisation messages and files, so this is the right place to integrate or simulate that adapter if direct interop is missing. ([NHS England Digital][5])

### Frontend work

The booking-commit UI should be serious and friction-appropriate.

Build:

- candidate confirmation drawer
- manual native-booking proof modal
- confirmation-pending child state
- booked-state confirmation child state
- patient and practice notification preview under secondary disclosure
- practice-acknowledgement indicator

The design should feel precise, not bureaucratic. Staff need confidence that the case is really booked and really visible to the origin practice.

Candidate revalidation, pending confirmation, booked, and acknowledgement-pending should all stay within one stable staff shell. Use local card or pane state plus bounded progress envelopes, and never force a hard navigation just because confirmation moved from server-accepted to awaiting external acknowledgement.

### Tests that must pass before moving on

- native adapter contract tests
- manual booking proof-completeness tests
- duplicate-confirm prevention tests
- ambiguous booking confirmation tests
- independent-confirmation-required tests for manual booking
- practice-notification idempotency tests
- MESH fallback contract tests
- no-close-before-booked-proof tests
- no-close-before-practice-ack tests
- full audit tests on manual and API commit modes

### Exit state

A network case can now become a real booked appointment without dropping out of Vecells just because the hub uses a different native booking surface, and manual entry alone can no longer fake a booked state.

## 5G. No-slot handling, urgent bounce-back, callback fallback, and reopen mechanics

This sub-phase makes failure safe.

### Backend work

The flow is very clear: if no suitable slot exists in the current window, the hub can offer alternatives; if the case is too urgent, it escalates back to the practice duty clinician.

Alternative offers, callback fallback, and return-to-practice logic must still defer to the canonical Phase 0 reservation, safety, and lifecycle rules. No hub-local shortcut may mint exclusivity, suppress safety preemption, or close a request independently.

Build these fallback objects:

**HubReturnToPracticeRecord**  
`returnId`, `hubCoordinationCaseId`, `returnType`, `reasonCode`, `priorityUpgrade`, `returnedTaskRef`, `returnedAt`

**CallbackFallbackRecord**  
`callbackFallbackId`, `hubCoordinationCaseId`, `callbackUrgency`, `preferredWindow`, `contactRoute`, `patientInformedAt`

**HubCoordinationException**  
`exceptionId`, `hubCoordinationCaseId`, `exceptionType`, `severity`, `retryState`, `escalationState`

Use this algorithm:

1. no suitable candidate exists in the clinically required window
2. if next-best options are still clinically acceptable, create an `AlternativeOfferSession`, resolve each option to canonical `capacityUnitRef`, and set `HubCoordinationCase.status = alternatives_offered`
3. if the patient wants callback, or policy requires callback rather than slot choice, create `CallbackFallbackRecord` and set `HubCoordinationCase.status = callback_offered`
4. if alternatives are not clinically acceptable or the case is now too urgent, create `HubReturnToPracticeRecord` and set `HubCoordinationCase.status = escalated_back`
5. reopen or create the originating practice task with explicit reason and raised priority
6. reacquire the triage-side lease so `LifecycleCoordinator` may derive `Request.workflowState = triage_active`
7. inform the patient of what happens next
8. prevent ping-pong by tracking return count and last-return reason
9. only close the hub case after the return-to-practice workflow has been durably linked to the original request lineage

Any hub alternative or callback offer must follow the same reservation rules as local booking: one active consumer offer per `capacityUnitRef` when no true hold exists, and no fake exclusivity language.

Add a hard stop on infinite loops. If the same case is returned from practice to hub more than a configured threshold without new capacity or new clinical context, escalate to supervisor review.

### Frontend work

Build a clear no-slot resolution panel inside the hub console.

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
- too-urgent return tests
- reopened practice-task context tests
- loop-prevention tests
- patient-informed state tests
- escalation timer tests
- end-to-end local fail to hub to return to practice tests

### Exit state

The hub desk can now fail safely and explicitly, instead of leaving difficult cases in indefinite coordination limbo.

---

## 5H. Patient communications, network reminders, manage flows, and practice visibility

This sub-phase makes network appointments feel like part of the same product.

### Backend work

Extend the appointment lifecycle from Phase 4 so that a `HubAppointmentRecord` can participate in the same communication and status system as local appointments.

Build:

**NetworkReminderPlan**  
`reminderPlanId`, `hubAppointmentId`, `templateSet`, `schedule`, `deliveryStates`

**PracticeVisibilityProjection**  
A read model showing origin practice users the current network status, slot summary, notification state, confirmation state, acknowledgement state, and manage capabilities.

**NetworkManageCapabilities**  
Flags for cancel, reschedule, callback-request, details-update, and read-only mode.

Align this sub-phase with `patient-account-and-communications-blueprint.md` so network appointment states, callback fallbacks, and patient communication timelines appear in one unified patient account model rather than as isolated flow pages.

This matters because the current DES still requires Enhanced Access reminders and a simple way for patients to cancel appointments at all times, and it requires the Network Standard Hours appointment book to be accessible to core network practices. ([NHS England][4])

For booked hub cases, create or update the `PracticeVisibilityProjection` immediately and open or refresh a `PracticeAcknowledgementRecord`. Until acknowledgement is received, the case remains `booked_pending_practice_ack`, stays visible in the hub desk and origin-practice view, and participates in overdue timers. Booked hub cases should only become closable once that acknowledgement is present or an explicit, audited no-ack-required policy exception applies.

For patient manage flows, reuse the Phase 4 portal patterns rather than inventing a second booking UI. If network reschedule is not truly supported for a given hub route, expose the best supported fallback honestly: cancellation plus callback request, or assisted contact. Apply the same admin-only guardrail as Phase 4 to manage forms: clinically meaningful free text or new symptom content must route back through the governed request shell and safety-preemption path rather than mutate the hub appointment directly. If booking confirmation is still pending, show a provisional confirmation state rather than a normal manage screen.

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

### Tests that must pass before moving on

- reminder-scheduling tests for hub appointments
- network cancellation route tests
- manage-capability exposure tests
- practice visibility projection tests
- practice-acknowledgement overdue tests
- stale-notification recovery tests
- patient status consistency tests
- destructive-action confirmation accessibility tests
- end-to-end confirmed hub appointment to reminder to cancel flow tests

### Exit state

A network appointment is now visible, manageable, and communicated through the same product experience as a local appointment, and the origin practice can no longer be left blind while the hub closes the case.

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
