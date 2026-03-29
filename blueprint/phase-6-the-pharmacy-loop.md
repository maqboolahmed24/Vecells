# Phase 6 - The Pharmacy Loop

**Working scope**  
Pharmacy First closed loop.

This is the phase where Vecells turns the `pharmacy_first_candidate` outcome from Phase 3 into a real referral-and-outcome subsystem. The Pharmacy First pathway already has the right shape: eligibility and pathway rules, a referral pack composer, dispatch through agreed messaging routes, and outcome capture back into GP workflow rather than a direct Vecells call into community-pharmacy record systems. The patient and staff flows also make the runtime explicit: the patient chooses a pharmacy, the referral is sent with instructions, the pharmacist either resolves the case or it bounce-backs, and the practice task reopens with higher visibility if needed.

Current NHS England guidance makes the scope much clearer. Pharmacy First now has 3 parts: urgent repeat medication supplies, low acuity or minor illness management, and clinical pathways consultations. For a GP-practice route like Vecells, the urgent repeat medication element is not the main target because that strand is for NHS 111 and urgent and emergency care settings only; the GP-practice referral path is about minor illness and the clinical pathways. NHS England's current general-practice referral page also still lists the 7 common-condition clinical pathways and their gateway age or sex rules, and states that GP teams can refer patients to a community pharmacist of the patient's choice with the patient's consent. ([NHS England][1])

The official technical boundaries are also still important here. GP Connect Update Record only lets registered community pharmacy professionals send consultation summaries for Pharmacy First, Blood Pressure Check, and Pharmacy Contraception services, using clinically and technically assured GP-system and community-pharmacy-system combinations. It is not used to communicate urgent actions or referrals back to general practice, which still follow local processes such as NHSmail or telephone. NHS England's Pharmacy First service specification and PGD or protocol set were updated in September 2025, so the rules engine in this phase needs versioned policy packs rather than fixed logic. For pharmacy discovery, the Directory of Healthcare Services is the strategic search API, while the EPS Directory of Services API is scheduled for deprecation on 31 May 2026 as NHS England re-platforms that area. And from 2026/27, the GP contract requires triage tools used for community-pharmacy clinical services to offer patients a full choice of providers, while practices must also maintain a dedicated monitored email address as a safety-net when GP Connect is unavailable or a pharmacy activity is not yet supported through GP Connect. ([NHS England Digital][2])

## Phase 6 objective

By the end of this phase, Vecells must be able to do all of the following through one coherent Pharmacy First loop:

- receive a `PharmacyIntent` from clinical triage
- determine whether the case belongs in a Pharmacy First service lane
- apply pathway and exclusion logic with versioned rule packs
- let the patient choose from a real pharmacy list without narrowing them to one hidden default
- generate and dispatch a structured referral pack
- track referral state without pretending that a pharmacy referral is a GP-style booked appointment
- ingest outcomes back from GP workflow or agreed messaging routes
- close resolved cases cleanly
- reopen unresolved or urgent bounce-backs back into the practice workflow with the right priority and context

## Overall Phase 6 algorithm

1. Convert `PharmacyIntent` into a durable pharmacy case.
2. Classify the case into Pharmacy First lane, pathway, or non-pharmacy fallback.
3. Run versioned gateway, exclusion, and red-flag rules.
4. Discover eligible pharmacies and present a patient-choice flow.
5. Compose a canonical referral pack and dispatch it through the right transport.
6. Track patient-facing status and practice-facing visibility from the same case.
7. Reconcile consultation outcomes from structured GP workflow or agreed message channels.
8. Close the case if resolved, or reopen and escalate if the pharmacy returns it.

## What Phase 6 must prove before Phase 7 starts

Before moving into NHS App-grade channel hardening, all of this needs to be true:

- pharmacy routing remains part of the same request lineage, not a detached referral subsystem
- eligibility is deterministic, explainable, and versioned
- the patient always gets a real choice of pharmacy provider
- a referral can be dispatched through more than one transport without changing the internal model
- a pharmacy referral is tracked as a referral and consultation loop, not mislabeled as a booked appointment
- structured outcomes and urgent bounce-backs both return into the same practice truth
- patient and staff views stay polished, minimal, and clear even when the path is operationally complex

## Phase 6 implementation rules

**Rule 1: model this as a referral-first loop, not as appointment booking.**  
The current GP-practice Pharmacy First pathway is an electronic referral with patient choice and consent, after which the patient is advised to contact the pharmacy and the pharmacist may consult by telephone, in person, or video. That is not the same interaction model as Phase 4 or Phase 5 booking, so the UX and data model should reflect referral and consultation states rather than fake appointment slots. ([NHS England][1])

**Rule 2: scope the GP-practice route correctly.**  
The service currently has 3 parts, but the urgent repeat medication strand is for NHS 111 and UEC settings only. So this phase should implement the GP-practice lanes: low acuity or minor illness and the clinical pathways consultations, with the 7-pathway rules pack being the main formal gateway engine. ([NHS England][1])

**Rule 3: no direct Update Record calls from Vecells.**  
Keep the product aligned with both the architecture and current NHS rules: Update Record is for registered community pharmacy professionals using assured systems, and it carries consultation summaries, not urgent referrals back to general practice. Vecells should therefore dispatch referrals through its own adapter layer and observe or ingest outcomes afterward; it should not try to behave like a pharmacy consultation system. ([NHS England Digital][2])

**Rule 4: patient choice is mandatory, not cosmetic.**  
NHS England now explicitly requires that referrals and triage tools used for community-pharmacy clinical services offer patients a full choice of providers, and the referral guidance already says the patient should be referred to a community pharmacist of the patient's choice. The product therefore needs ranking and recommendation, but it must not hard-lock patients into a single pharmacy without an explicit choice. ([NHS England][3])

**Rule 5: referral transport and outcome transport are different concerns.**  
A practice can set up pharmacy referrals through NHSmail, supplier interop, or other electronic pathways, and NHS England says IT suppliers will be required to meet BaRS. But urgent actions or referrals back from pharmacy to general practice still follow local routes such as NHSmail or telephone, not Update Record. Treat outbound referral dispatch and inbound bounce-back or urgent-return handling as separate transport contracts. ([NHS England][1])

**Rule 6: policy packs must be versioned.**  
The Pharmacy First service specification and pathway documents were updated in September 2025. That means gateway criteria, PGD-linked logic, explanatory text, and clinical pack metadata should all be version-controlled in the product so you can replay old decisions against the rule set that was active at the time. ([NHS England][4])

---

## 6A. Pharmacy contract, case model, and state machine

This sub-phase creates the durable runtime model for the pharmacy loop.

### Backend work

Do not reuse the Phase 3 `EndpointDecision` or `PharmacyIntent` as the live working object. Preserve them as the source clinical decision, then wrap them in a real `PharmacyCase`.

Create these objects:

**PharmacyCase**  
`pharmacyCaseId`, `originRequestId`, `originTaskId`, `pharmacyIntentId`, `patientRef`, `tenantId`, `serviceType`, `candidatePathway`, `eligibilityRef`, `choiceSessionRef`, `selectedProviderRef`, `dispatchRef`, `outcomeRef`, `bounceBackRef`, `status`, `slaTargetAt`, `createdAt`, `updatedAt`

**ServiceTypeDecision**  
`decisionId`, `pharmacyCaseId`, `lane`, `candidatePathways`, `gatewayResult`, `exclusionFlags`, `redFlagState`, `rulePackVersion`

**PathwayEligibilityEvaluation**  
`evaluationId`, `pharmacyCaseId`, `pathwayCode`, `rulePackVersion`, `ageSexGateResult`, `pathwayGateResult`, `exclusionMatches`, `recommendedLane`, `explanationBundleRef`

**PharmacyDirectorySnapshot**  
`snapshotId`, `pharmacyCaseId`, `queryOrigin`, `fetchedAt`, `expiresAt`, `providerRefs`, `sourceModes`, `rankingInputs`, `rankPlanVersion`

**PharmacyProvider**  
`providerId`, `odsCode`, `displayName`, `openingState`, `address`, `distanceRef`, `pathwaySuitability`, `minorIllnessSuitability`, `acceptsElectronicReferral`, `transportCapabilities`, `accessibilityTags`, `contactEndpoints`, `recommendationFeatures`, `recommendationScore`

**PharmacyChoiceSession**  
`choiceSessionId`, `pharmacyCaseId`, `snapshotId`, `visibleProviderRefs`, `recommendedProviderRefs`, `patientChoiceState`, `selectedProviderRef`, `expiresAt`

**PharmacyConsentRecord**  
`consentRecordId`, `pharmacyCaseId`, `decision`, `capturedByMode`, `capturedAt`, `consentTextVersion`, `scope`, `channel`, `evidenceRef`

**PharmacyReferralPackage**  
`packageId`, `pharmacyCaseId`, `serviceRequestRef`, `communicationRef`, `patientSummaryRef`, `transportMode`, `dispatchPayloadRef`, `consentRef`

**PharmacyOutcomeRecord**  
`outcomeId`, `pharmacyCaseId`, `sourceType`, `consultationMode`, `consultationSummaryRef`, `medicineSupplySummary`, `gpActionRequired`, `resolutionCategory`, `confidenceBand`, `manualReviewState`, `receivedAt`

**PharmacyBounceBackRecord**  
`bounceBackId`, `pharmacyCaseId`, `bounceBackType`, `urgency`, `returnedTaskRef`, `patientInformedAt`, `sourceEvidenceRef`

Lock the main state machine now:

`candidate_received -> rules_evaluating`  
`rules_evaluating -> ineligible_returned | eligible_choice_pending`  
`eligible_choice_pending -> provider_selected`  
`provider_selected -> consent_pending | package_ready`  
`consent_pending -> package_ready`  
`package_ready -> dispatch_pending -> referred -> consultation_outcome_pending`  
`consultation_outcome_pending -> resolved_by_pharmacy -> closed`  
`consultation_outcome_pending -> unresolved_returned`  
`consultation_outcome_pending -> urgent_bounce_back`  
`consultation_outcome_pending -> no_contact_return_pending`  
`consultation_outcome_pending -> outcome_reconciliation_pending`  
`outcome_reconciliation_pending -> resolved_by_pharmacy | unresolved_returned | urgent_bounce_back | no_contact_return_pending`

State semantics:

- `eligible_choice_pending` is entered once eligibility passes and a live provider-choice session exists
- `provider_selected` is entered when a specific pharmacy provider has been durably selected
- `consent_pending` is entered when provider selection exists but valid referral consent has not yet been captured, has expired, or has been withdrawn
- `package_ready` is entered when the canonical referral package has been frozen with a valid `consentRef`
- `dispatch_pending` is entered when the outbound transport attempt is underway
- `consultation_outcome_pending` is entered only after dispatch is confirmed and the case is waiting for pharmacy outcome
- `resolved_by_pharmacy` is a durable terminal-pre-close state, not a transient label
- `outcome_reconciliation_pending` is a `PharmacyCase`-local review state for weak or ambiguous outcome truth; it must never be copied into `Request.workflowState`, and it must keep the relevant confirmation or reconciliation work open
- `no_contact_return_pending` must never auto-close; it must lead to explicit practice review, bounce-back, or reopen handling

These are durable case states and must be written by the algorithms below.

Add the first event catalogue:

- `pharmacy.case.created`
- `pharmacy.service_type.resolved`
- `pharmacy.pathway.evaluated`
- `pharmacy.choice.session.created`
- `pharmacy.provider.selected`
- `pharmacy.package.composed`
- `pharmacy.dispatch.started`
- `pharmacy.dispatch.confirmed`
- `pharmacy.outcome.received`
- `pharmacy.outcome.reconciled`
- `pharmacy.case.resolved`
- `pharmacy.case.bounce_back`
- `pharmacy.case.reopened`
- `pharmacy.case.closed`

Expose a first API surface:

- `POST /v1/pharmacy/cases`
- `GET /v1/pharmacy/cases/{pharmacyCaseId}`
- `POST /v1/pharmacy/cases/{pharmacyCaseId}:evaluate`
- `POST /v1/pharmacy/cases/{pharmacyCaseId}:choose-provider`
- `POST /v1/pharmacy/cases/{pharmacyCaseId}:dispatch`
- `POST /v1/pharmacy/cases/{pharmacyCaseId}:capture-outcome`
- `POST /v1/pharmacy/cases/{pharmacyCaseId}:reopen`
- `POST /v1/pharmacy/cases/{pharmacyCaseId}:close`

### Frontend work

Add dedicated pharmacy routes to the patient and staff shells:

- `/pharmacy/:pharmacyCaseId/choose`
- `/pharmacy/:pharmacyCaseId/instructions`
- `/pharmacy/:pharmacyCaseId/status`
- `/workspace/pharmacy`
- `/workspace/pharmacy/:pharmacyCaseId`
- `/workspace/pharmacy/:pharmacyCaseId/validate`
- `/workspace/pharmacy/:pharmacyCaseId/inventory`
- `/workspace/pharmacy/:pharmacyCaseId/resolve`
- `/workspace/pharmacy/:pharmacyCaseId/handoff`
- `/workspace/pharmacy/:pharmacyCaseId/assurance`

Keep these distinct from appointment routes.

The staff routes must implement the mission-frame rules in `pharmacy-console-frontend-architecture.md`: quiet default shell, one dominant action, persistent medication and stock anchors, inline command fences for irreversible actions, and blocker-led promotion rather than banner-heavy escalation. These routes may live inside the staff product, but once entered they must switch to the pharmacy-shell mission frame rather than a generic workspace detail page. The visual structure should be quieter and more guidance-led than booking.

This specialization does not change the referral-first boundary of Phase 6 and must not be read as turning Vecells into a general PMR or dispensing system.

### Tests that must pass before moving on

- pharmacy-state transition tests
- migration tests from `PharmacyIntent` to `PharmacyCase`
- event-schema tests for pharmacy events
- no-orphan tests between case, package, outcome, and bounce-back records
- no-auto-close-on-no-contact tests
- projection rebuild tests from raw pharmacy events

### Exit state

The pharmacy subsystem now exists as a real case model with clear states, clear artifacts, and clear closure or reopen paths, including an explicit unresolved path for no-contact outcomes.

## 6B. Eligibility engine, pathway rules, and versioned policy packs

This sub-phase is the clinical gate of the pharmacy loop.

### Backend work

Build a rule engine around versioned policy packs, not scattered inline conditionals.

Create these objects:

**PharmacyRulePack**  
`rulePackId`, `effectiveFrom`, `effectiveTo`, `serviceSpecVersion`, `pathwayDefinitions`, `minorIllnessPolicy`, `globalExclusions`, `redFlagBridges`, `displayTextRefs`

**PathwayDefinition**  
`pathwayCode`, `displayName`, `ageSexGate`, `requiredSymptoms`, `exclusionRules`, `redFlagRules`, `minorIllnessFallbackRules`, `allowedEscalationModes`, `supplyModes`

**EligibilityExplanationBundle**  
`bundleId`, `patientFacingReason`, `staffFacingReason`, `matchedRules`, `nextBestEndpointSuggestion`

The first production rules pack should explicitly encode the current 7 pathway gates published by NHS England: uncomplicated UTI for women aged 16 to 64, impetigo for adults and children aged 1 and over, infected insect bites for adults and children aged 1 and over, acute sore throat for people aged 5 and over, acute sinusitis for people aged 12 and over, shingles for adults aged 18 and over, and acute otitis media for children aged 1 to 17. The rule pack should also support the broader service lanes that NHS England still describes for GP-practice referrals: low acuity or minor illness management and clinical pathway consultations. ([NHS England][1])

The evaluation algorithm should be:

1. move the case to `candidate_received`
2. snapshot current request evidence and move the case to `rules_evaluating`
3. resolve pharmacy service lane candidate
4. run global exclusions and red-flag bridge rules
5. if any global exclusion or red-flag bridge rule fires, set the case to `ineligible_returned` and return to non-pharmacy endpointing immediately
6. if the pathway lane remains viable, run pathway-specific gateway rules
7. only if the pathway fails for pathway-specific reasons **without** red flags or global exclusions, and local policy explicitly allows it, evaluate minor-illness fallback
8. if minor-illness fallback is eligible, continue pharmacy processing and prepare for provider choice
9. if the case fails pharmacy suitability entirely, set the case to `ineligible_returned` and return it to non-pharmacy endpointing
10. persist the matched rule IDs and the rule-pack version used
11. if the case remains suitable for pharmacy handling, create or refresh the choice flow and set the case to `eligible_choice_pending`

Because NHS England updated the service specification and pathway documents in September 2025, keep rule-pack change management strict: additive pack creation, effective dates, golden-case regression, and replay tooling. Never edit the active pack in place. ([NHS England][4])

### Frontend work

Build two surfaces from the same explanation bundle:

- a staff rule explainer showing which gate passed or failed and why
- a patient-friendly return state when a pharmacy route is not suitable

The staff view can be more detailed. The patient view should stay short and clear: `We’ll use another route for this.`

### Tests that must pass before moving on

- full decision-table tests across all pathway gates
- age and sex boundary tests
- exclusion and red-flag regression tests
- pack-version replay tests
- no-unsafe-downgrade-to-minor-illness tests
- mutation tests for gateway logic
- staff explanation and patient explanation consistency tests

### Exit state

The pharmacy gate is now deterministic, explainable, and strict about when a pathway failure may or may not downgrade into a minor-illness route.

## 6C. Pharmacy discovery, provider choice, and directory abstraction

This sub-phase turns patient chooses pharmacy into a real product capability.

### Backend work

Build a `PharmacyDiscoveryAdapter` rather than letting business logic talk directly to one NHS directory source.

Recommended adapter modes:

- `dohs_service_search`
- `eps_dos_legacy`
- `local_registry_override`
- `manual_directory_snapshot`

Use the Directory of Healthcare Services as the strategic service-discovery route, but keep a legacy adapter path for EPS DoS use cases while they still exist. NHS England explicitly says Service Search is the strategic API, and the EPS DoS API is currently scheduled for deprecation on 31 May 2026 as that area is re-platformed. ([NHS England Digital][5])

The discovery algorithm should be:

1. resolve patient location and case lane
2. query active directory adapters
3. normalize candidate pharmacies into one provider model
4. exclude only providers that are truly invalid for the referral, such as organisationally invalid records, non-commissioned service mismatch, or no viable dispatch route at all
5. annotate every remaining provider with open state, next opening window, transport fit, accessibility, and ranking signals
6. compute recommendation features for each valid provider `p`:
   - `serviceFitClass(p) in {2,1,0}`, where `2` means exact commissioned service and pathway fit, `1` means service-capable but only a manual-pathway or minor-illness fit, and `0` means visible fallback allowed by policy
   - `h_path(p) in [0,1]` for pathway or minor-illness suitability within the chosen service class
   - `h_open(p) = 1` if open now, otherwise `exp(-minutesUntilNextOpening(p) / tau_open)`
   - `h_travel(p) = exp(-travelMinutes(p) / tau_travel)`
   - `h_access(p) in [0,1]`
   - `h_transport(p) in [0,1]` for dispatch fit
   - `h_fresh(p) = exp(-stalenessMinutes(snapshot,p) / tau_fresh)`
7. compute `recommendationScore(p) = lambda_path * h_path(p) + lambda_open * h_open(p) + lambda_travel * h_travel(p) + lambda_access * h_access(p) + lambda_transport * h_transport(p) + lambda_fresh * h_fresh(p)` with `sum lambda_* = 1`
8. sort all valid providers lexicographically by `serviceFitClass(p)` descending, `recommendationScore(p)` descending, then `displayName` ascending, but keep the full valid choice set visible to the patient
9. create `PharmacyDirectorySnapshot`
10. create `PharmacyChoiceSession` with `visibleProviderRefs = all valid providers in ranked order` and `recommendedProviderRefs = top K providers from the highest available service-fit class above the configured recommendation threshold`
11. keep `PharmacyCase.status = eligible_choice_pending` while choice is outstanding
12. when the patient or staff selects a provider, persist that provider selection and move the case to `provider_selected`
13. capture explicit referral consent using a versioned patient-facing consent script that matches the channel and referral scope
14. if consent is granted, create `PharmacyConsentRecord` and allow the dispatch pipeline to proceed
15. if consent is missing, refused, expired, or withdrawn, move the case to `consent_pending` and do **not** dispatch the referral

The provider model should carry:

- ODS code and display name
- opening state and next opening window
- service suitability by pathway or minor-illness lane
- accessibility flags
- transport endpoints for referral
- consultation mode hints where available
- locality and travel scoring inputs

Do not let `open now`, `electronic referral supported`, or similar convenience signals quietly remove an otherwise valid provider from the patient’s choice set. Those are ranking and explanation inputs unless referral safety or dispatch feasibility truly fails.

### Frontend work

The patient pharmacy chooser should be sleek and reassuring, not like a clumsy search console.

Build:

- ranked list view as the default
- optional map view as a secondary surface
- recommended-near-you grouping
- open-now and open-later filters
- clear distance and access hints
- change-pharmacy action before dispatch
- one strong primary action per provider card

The important product rule is this: recommend, but do not funnel. NHS England's current GP contract and Pharmacy First referral guidance both make patient choice explicit. So the UI should always preserve a genuine provider list rather than locking onto the first ranked result. ([NHS England][3])

### Tests that must pass before moving on

- adapter contract tests for all discovery modes
- ranking determinism tests
- full-choice exposure tests
- closed-but-valid provider exposure tests
- open-now and closed-state tests
- stale-directory snapshot tests
- accessibility tests for list and map selection
- mobile usability tests for provider choice

### Exit state

The patient can now choose a real pharmacy provider from a controlled, ranked, but still genuinely open choice set.

## 6D. Referral pack composer, dispatch adapters, and transport contract

This sub-phase turns a pharmacy decision into a real outbound referral.

### Backend work

Create one canonical `PharmacyReferralPackage`, then let adapters transform it for the actual transport.

This section is a pharmacy-specific application of the canonical dispatch, reconciliation, projection, and closure rules in `phase-0-the-foundation-protocol.md`. Live-referral status, patient or staff visibility, and closure gating must remain subordinate to `PharmacyCorrelationRecord`, `VisibilityProjectionPolicy`, `SafetyOrchestrator`, and `LifecycleCoordinator`.

The right internal shape is a FHIR `ServiceRequest` plus communication payload for referral artifacts. Keep that core model.

The canonical package should contain:

- patient identity and contact summary
- source practice and task lineage
- selected pharmacy provider
- pharmacy lane and pathway
- structured clinical summary
- red-flag and exclusion checks already run
- consent and communication preference state
- attachments or supporting material if appropriate
- correlation IDs for later reconciliation

Dispatch modes should include:

- `bars_fhir`
- `supplier_interop`
- `nhsmail_shared_mailbox`
- `mesh`
- `manual_assisted_dispatch`

That transport mix matches current national reality. NHS England's general-practice referral guidance says practices can set up the electronic message using NHSmail, interoperable messages between IT suppliers, or local shared-record arrangements, and says IT suppliers will be required to meet BaRS. BaRS itself is the national interoperability standard for sending booking and referral information between providers, and MESH remains the secure asynchronous route for messages and large files. ([NHS England][1])

Before dispatch, create `PharmacyCorrelationRecord` containing `pharmacyCaseId`, `packageId`, `dispatchAttemptId`, `providerRef`, `patientRef`, `serviceType`, `transportMode`, and all outbound transport references.

Make dispatch idempotent, consent-gated, and acknowledgement-aware:

1. confirm that a provider has been selected
2. if there is no valid `PharmacyConsentRecord` for this provider, pathway, and referral scope, set `PharmacyCase.status = consent_pending` and stop
3. create the canonical package, attach `consentRef`, move the case to `package_ready`, and create `PharmacyCorrelationRecord`
4. create dispatch attempt with idempotency key and move the case to `dispatch_pending`
5. transform and send the package through the chosen adapter
6. record provider-facing references on `PharmacyCorrelationRecord`
7. move the case to live referral only when either a positive transport acknowledgement is received or policy-defined durable dispatch proof exists, including independent confirmation for manual or no-ack transports
8. if dispatch proof is absent or ambiguous, keep the case in `dispatch_pending` or move it to explicit reconciliation; do not pretend the referral is live
9. only after live dispatch proof exists may the case move to `referred` and then `consultation_outcome_pending`
10. keep the canonical `Request` in `workflowState = handoff_active` while pharmacy outcome is still pending
11. if dispatch fails, raise exception and do not move the case into a referred or outcome-pending state
12. withdrawn or expired consent invalidates the package and forces a return to `consent_pending` before any retry

Keep urgent return channels separate. Update Record is not for urgent actions or referrals to general practice, so the pharmacy loop also needs an `UrgentReturnChannelConfig` per tenant, carrying the practice's professional number and dedicated monitored email or equivalent safety-net route. NHS England now explicitly requires practices to maintain that monitored email for pharmacy communications when GP Connect is unavailable or a pharmacy activity is not yet supported. ([NHS England Digital][2])

### Frontend work

Inside the workspace, add a referral confirmation drawer showing:

- selected pharmacy
- referral summary
- pathway or minor illness lane
- transport method
- patient-facing instructions preview

On the patient side, do not show transport jargon. Show only what matters: pharmacy chosen, what happens next, and what the patient should do. Keep one dominant next action, preserve the chosen pharmacy card across consent, dispatch, and pending states, and keep dispatch or acknowledgement drift in the shared status strip unless the user must decide something new.

### Tests that must pass before moving on

- dispatch idempotency tests
- adapter transform contract tests
- wrong-provider dispatch prevention tests
- acknowledgement and retry tests
- PII redaction tests in logs and telemetry
- transport-failure fallback tests
- end-to-end composed-package to dispatch-confirmed tests

### Exit state

A pharmacy referral can now be generated once, dispatched once, and traced cleanly across different national or local transport routes.

---

## 6E. Patient instructions, referral status, and pharmacy-facing UX logic

This sub-phase makes the loop understandable to the patient.

### Backend work

Build patient-facing status as a projection from `PharmacyCase`, not as ad hoc text assembled in controllers.

Patient-facing top-level state must use the canonical macro-state mapping from the real-time interaction section in Phase 0. In this phase, the valid top-level macro states are:

- `choose_or_confirm` while the patient still needs to choose or confirm the pharmacy route
- `action_in_progress` while referral dispatch, pharmacy contact, or consultation is in progress
- `reviewing_next_steps` when the pharmacy path has returned work for practice reassessment
- `completed` when the pharmacy outcome is durably settled
- `urgent_action` when urgent return or urgent GP action has preempted routine flow

Pharmacy-specific nuance belongs in the `LiveTimeline`, `ConversationThreadProjection`, and instruction panels, not in a competing top-level state dictionary.

This public model must match the true underlying referral flow. NHS England's current referral guidance says the practice advises the patient to contact the pharmacy, and the pharmacist may consult by telephone, video, or in person. So the status engine should never imply that the patient has a booked appointment unless a local partner model actually supports that. ([NHS England][1])

Keep this patient view aligned with `patient-account-and-communications-blueprint.md` so pharmacy status and next actions remain consistent with the same patient home used for triage, callback, and booking flows.

### Frontend work

The patient experience here should feel calm and premium, but instruction-led.

Build:

- chosen-pharmacy confirmation page
- what-happens-next page
- pharmacy contact details and opening status
- referral reference view
- clean status tracker
- outcome page
- we-are-reviewing-your-next-step return page for bounce-backs

These adjacent pharmacy states must reuse the same request-level shell and keep the chosen provider card visually persistent. Instructions, contact detail, pending status, and returned-for-review messaging should morph in place rather than feeling like disconnected standalone pages.

The page composition should prioritise clarity:

- what the patient needs to do now
- where to go or who will contact them
- when it may happen
- what to do if symptoms worsen

If the local workflow means the patient should contact the pharmacy, say that clearly. If the pharmacist may call them, say that clearly. If a video consultation may happen, present it as a possibility, not as a promise. ([NHS England][1])

### Tests that must pass before moving on

- status-projection consistency tests
- wrong-patient status access tests
- referral-reference security tests
- content tests for instruction clarity
- mobile and embedded-mode rendering tests
- keyboard and screen-reader tests on status and instruction pages

### Exit state

The patient can now understand the pharmacy route without mistaking it for a normal booked appointment flow.

---

## 6F. Outcome ingest, Update Record observation, and reconciliation

This sub-phase closes the technical loop.

### Backend work

The clean design here is outcome observation and reconciliation, not direct pharmacy-system control.

Build these outcome ingest sources:

- `gp_workflow_observation`
- `direct_structured_message`
- `email_ingest`
- `manual_structured_capture`

This follows the current NHS setup. If a practice has Update Record enabled, the community pharmacy consultation summary arrives as a secure digital message in the GPIT workflow; otherwise the pharmacy sends the outcome via email or letter. Update Record can only be sent by registered community pharmacy professionals using assured system combinations, and it only carries the consultation summary, not the urgent return itself. ([NHS England Digital][2])

That means Vecells should support this reconciliation algorithm:

This local reconciliation algorithm must not override the canonical Phase 0 rules. `SafetyOrchestrator` owns any materially meaningful inbound evidence path, and `LifecycleCoordinator` owns any request close decision that follows pharmacy resolution.

1. ingest incoming outcome evidence
2. classify source and confidence
3. attempt exact correlation-chain match first using `PharmacyCorrelationRecord`
4. if no exact match exists, compute the canonical strong composite match from Phase 0 against each eligible open case `c`:
   - `m_patient(c,e) in [0,1]` from verified patient identity agreement
   - `m_provider(c,e) in [0,1]` from provider or ODS agreement
   - `m_service(c,e) in [0,1]` from service-type agreement
   - `m_time(c,e) = exp(-abs(minutesBetween(outcomeAt_e, expectedWindowMidpoint_c)) / tau_match_time)`
   - `m_transport(c,e) in [0,1]` from dispatch, message, or Update Record transport evidence
   - `sourceFloor_e in [0,1]` from the trusted-source policy class of the inbound evidence
   - `matchScore(c,e) = sourceFloor_e * (omega_patient * m_patient(c,e) + omega_provider * m_provider(c,e) + omega_service * m_service(c,e) + omega_time * m_time(c,e) + omega_transport * m_transport(c,e))`, with `sum omega_* = 1`
5. if no eligible open case exists, route to `outcome_reconciliation_pending` or `unmatched`
6. let `c_star = argmax_c matchScore(c,e)` and let `c_2` be the runner-up case, or a null candidate with `matchScore(c_2,e) = 0`
7. if `matchScore(c_star,e) < tau_strong_match` or `matchScore(c_star,e) - matchScore(c_2,e) < delta_match`, route to `outcome_reconciliation_pending` or `unmatched`
8. classify outcome as `advice_only`, `medicine_supplied`, `resolved_no_supply`, `onward_referral`, `urgent_gp_action`, `unable_to_contact`, `pharmacy_unable_to_complete`, or `unmatched`
9. auto-close is allowed only when the outcome is from a trusted source and `matchScore(c_star,e)` meets the strong-match threshold recorded in policy
10. `email_ingest` and `manual_structured_capture` may update the case automatically only up to `outcome_reconciliation_pending` unless a human confirms the match or the message contains a trustworthy correlation chain accepted by policy
11. if the classification is `advice_only`, `medicine_supplied`, or `resolved_no_supply` and the trusted strong-match threshold is met, set the case to `resolved_by_pharmacy`, update practice and patient views, emit the pharmacy-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`, and ask `LifecycleCoordinator` to evaluate closure after required communications and projections are durably committed
12. if the classification is `onward_referral`, `pharmacy_unable_to_complete`, `urgent_gp_action`, or `unable_to_contact`, create `SafetyPreemptionRecord`, reacquire triage ownership, let `LifecycleCoordinator` derive `Request.workflowState = triage_active` from that reopened lease, and route to the appropriate bounce-back or reopen path
13. if `unmatched`, raise exception queue item and do not close anything
14. no absence of Update Record, no absence of email, and no elapsed timer may be interpreted as proof of completion

Keep supplier awareness in the ingest layer. NHS England currently says Update Record is assured between EMIS and TPP on the GP side and four named community-pharmacy suppliers on the pharmacy side, so the parser and reconciliation engine should respect supplier-specific evidence shapes rather than assuming a single universal payload. ([NHS England Digital][2])

### Frontend work

Build a staff-facing pharmacy outcome panel showing:

- incoming summary source
- matched case
- consultation mode
- medicines supplied if present
- whether GP action is required
- resolution classification
- reconciliation confidence
- whether manual review is required before close
- local exception state on the affected outcome card plus promoted evidence review when the outcome could not be matched cleanly

This panel should render as the `assurance` child state of the same pharmacy shell rather than as a detached detail page. Matched evidence, confidence, close eligibility, reopen actions, and clarification actions must share one `DecisionDock` so the pharmacist never has to hunt across multiple panes for the authoritative next step.

### Tests that must pass before moving on

- structured-summary parsing tests
- Update Record observed-path tests
- email-ingest and structured manual-capture tests
- duplicate outcome dedupe tests
- unmatched-outcome exception tests
- supplier-specific normalization tests
- confidence-threshold close-versus-review tests
- no-auto-close-on-unable-to-contact tests
- end-to-end dispatch to outcome to case-close or reopen tests

### Exit state

The pharmacy loop can now close on real outcome evidence rather than relying on an optimistic `we referred it so it must be done` assumption, and low-confidence reconciliations can no longer auto-close a case.

## 6G. Bounce-back, urgent return, and reopen mechanics

This sub-phase handles the cases pharmacy cannot safely complete.

### Backend work

Build `PharmacyBounceBackRecord` as a first-class workflow object, not a note pasted into the case timeline.

Use bounce-back types such as:

- `urgent_gp_return`
- `routine_gp_return`
- `patient_not_contactable`
- `patient_declined`
- `pharmacy_unable_to_complete`
- `referral_expired`
- `safeguarding_concern`

This design follows current NHS guidance. Pharmacists are expected to recognise red-flag symptoms and, when something more serious is suspected, help arrange an urgent GP appointment using the practice's dedicated professional number or escalate to urgent care. Update Record must not be used to communicate urgent actions or referrals back to general practice, and the GP contract now requires practices to maintain a dedicated monitored email as a safety-net for pharmacy communications when GP Connect is unavailable or a newer pharmacy activity is not yet supported. ([NHS England][1])

The bounce-back algorithm should be:

1. ingest urgent or unresolved pharmacy return
2. create `PharmacyBounceBackRecord`
3. if the return is urgent, set `PharmacyCase.status = urgent_bounce_back`
4. if the return is unresolved but non-urgent, set `PharmacyCase.status = unresolved_returned`
5. if the return is a no-contact outcome, set `PharmacyCase.status = no_contact_return_pending`
6. reopen original request or create duty task, based on urgency
7. attach pharmacy evidence bundle
8. reacquire the triage-side lease so `LifecycleCoordinator` may derive `Request.workflowState = triage_active`
9. upgrade priority and timing
10. notify patient of next step
11. block auto-close until the reopened case is explicitly resolved

Also add loop protection. If the same case bounces between practice and pharmacy more than a configured threshold without materially new information, escalate to supervisor review.

### Frontend work

Inside the workspace, add:

- pharmacy bounce-back queue
- reopened-case banner
- urgent return mode with prominent status
- one-click open-original-request action
- patient-message preview for return states

Bounce-back work must reopen inside the same pharmacy shell with diff markers, preserved evidence anchors, and a narrowed `DecisionDock`. The urgent path should visually feel distinct from a routine unresolved case, but it should suppress non-essential inventory and queue chrome rather than introducing a second, disconnected emergency UI.

### Tests that must pass before moving on

- urgent return-to-duty-task tests
- routine reopen tests
- evidence-linking tests
- loop-prevention tests
- patient-informed state tests
- unresolved-pharmacy-outcome to reopened-practice-task tests
- end-to-end resolved versus bounce-back branch tests

### Exit state

The pharmacy route can now fail safely and explicitly, rather than disappearing into an external mailbox or forcing staff to reconstruct what happened.

---

## 6H. Practice visibility, operations queue, and pharmacy exception handling

This sub-phase makes the pharmacy loop manageable day to day.

### Backend work

Build dedicated projections for pharmacy operations:

- `pharmacy_active_cases_projection`
- `pharmacy_waiting_for_choice_projection`
- `pharmacy_dispatched_waiting_outcome_projection`
- `pharmacy_bounce_back_projection`
- `pharmacy_dispatch_exception_projection`
- `pharmacy_provider_health_projection`

Add a practice visibility model that shows:

- the selected pharmacy
- dispatch state
- latest known patient instruction state
- last outcome evidence
- whether GP action is now required
- whether the case has re-entered triage

Also add operational exception classes such as:

- discovery unavailable
- no eligible providers returned
- dispatch failed
- acknowledgement missing
- outcome unmatched
- no outcome within configured window
- conflicting outcomes from multiple sources

Feed these queues into the shared staff operating model in `staff-operations-and-support-blueprint.md` so pharmacy exception work appears in the same start-of-day and changed-since-seen surfaces as triage, callback, booking, and hub work.

### Frontend work

Build a slim but serious pharmacy operations panel inside the staff product:

- active pharmacy cases
- waiting for patient choice
- waiting for outcome
- bounce-backs
- transport failures
- provider outages
- validation due
- stock risk
- handoff blocked

This is not the same as the broader operations console from the final assurance phase. It is the workbench that lets practice teams see what is out with pharmacy right now.

When a pharmacist opens a case from this panel, the queue row must morph into the Pharmacy Console mission frame from `pharmacy-console-frontend-architecture.md`, not a generic admin detail page. Default posture should be queue spine plus validation board, with inventory, evidence, and chronology surfaces collapsed until risk or explicit user intent justifies promotion.

Design-wise, keep it dense but elegant: strong hierarchy, quiet colours, one glance to understand what needs attention.

### Tests that must pass before moving on

- projection correctness tests
- dispatch-exception queue tests
- unmatched-outcome queue tests
- provider-health alert tests
- visibility consistency tests between practice and patient status
- UI performance tests on large pharmacy caseloads

### Exit state

The practice can now see and manage the whole pharmacy loop as part of normal operations instead of losing sight of referred cases.

---

## 6I. Hardening, safety evidence, pilot rollout, and formal exit gate

This is where the pharmacy loop becomes releasable.

### Backend work

Instrument the phase deeply.

Minimum metrics:

- pharmacy candidate rate
- eligibility pass rate by pathway
- patient choice completion rate
- dispatch success rate by transport
- outcome received rate
- median outcome latency
- resolved-by-pharmacy rate
- bounce-back rate
- urgent return rate
- unmatched outcome rate
- no-contact expiry rate
- provider discovery failure rate

Add alerts for:

- sudden drop in dispatch confirmations
- pharmacy discovery returning zero providers unexpectedly
- outcome backlog above threshold
- urgent returns not acknowledged
- unmatched outcome spike
- bounce-back spike for a specific pathway or provider

This phase also needs explicit clinical safety coverage. Compliance with DCB0129 and DCB0160 remains mandatory, and if a BaRS adapter is used the onboarding material explicitly expects a hazard log and clinical safety case report aligned with DCB0129. ([NHS England Digital][6])

The hazard set for this release should explicitly include:

- ineligible patient referred down a Pharmacy First pathway
- wrong pathway or wrong pharmacy chosen
- patient denied full provider choice
- referral lost in transport
- patient believes a referral is a booked appointment
- urgent bounce-back not seen in time
- outcome received but linked to the wrong case
- lack of Update Record mistaken for lack of outcome
- repeated bounce-backs causing unsafe delay

### Frontend work

Run this phase in controlled pilot slices.

Before broader release, the pharmacy patient journey should already feel polished enough to stand beside the rest of Vecells:

- clean pharmacy chooser
- calm instruction pages
- reliable status tracker
- excellent return-state messaging
- bounce-back handling that feels deliberate, not broken

### Tests that must all pass before Phase 7

- no Sev-1 or Sev-2 defects in eligibility, choice, dispatch, outcome, or bounce-back flows
- full decision-table coverage for all active pathway rules
- provider-choice rules proven
- dispatch idempotency proven across all enabled transports
- outcome reconciliation proven across structured and fallback channels
- urgent return and reopen paths proven
- unmatched-outcome exception handling proven
- audit trail complete for evaluation, choice, dispatch, ingest, reconciliation, and reopen
- updated hazard log and safety case completed for this release
- rollback rehearsal completed

### Exit state

The Pharmacy First loop is now technically complete, operationally visible, and clinically governable.

---

## Recommended rollout slices inside Phase 6

To keep this iterative and safe, ship Phase 6 in five slices:

**Slice 6.1**  
Read-only pharmacy recommendation and eligibility engine, no live dispatch.

**Slice 6.2**  
Patient choice flow and referral pack composition with sandbox transports only.

**Slice 6.3**  
Live dispatch for a limited cohort of practices and providers.

**Slice 6.4**  
Outcome ingest and structured case closure.

**Slice 6.5**  
Bounce-back, urgent return, and reopened practice workflow.

## System after Phase 6

After this phase, Vecells can take a pharmacy-appropriate triage decision, run a real Pharmacy First gateway, let the patient choose from valid pharmacy providers, dispatch a structured referral, track the consultation loop, reconcile outcomes from GP workflow or agreed message channels, and reopen the original case when the pharmacy cannot safely complete it. That is the closed-loop pharmacy behaviour the architecture and journey diagrams are aiming for, while staying aligned with the current NHS rules around patient choice, transport, and Update Record boundaries. ([NHS England][1])

[1]: https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/ "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/"
[2]: https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record"
[3]: https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/ "https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/"
[4]: https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/ "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/"
[5]: https://digital.nhs.uk/developer/api-catalogue/electronic-transmission-of-prescriptions-web-services-soap/migrating-from-the-etp-web-services-soap-api-to-the-service-search-api "https://digital.nhs.uk/developer/api-catalogue/electronic-transmission-of-prescriptions-web-services-soap/migrating-from-the-etp-web-services-soap-api-to-the-service-search-api"
[6]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards "https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards"
