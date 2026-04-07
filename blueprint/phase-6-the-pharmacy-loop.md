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

Before this objective is considered met, close five high-priority objective gaps:

1. the objective allowed a pharmacy loop to exist without explicitly requiring the same request lineage, lifecycle lease, and closure-blocker law from start to finish
2. patient choice was present, but the objective must require timing-aware safety warnings and suppression of clearly unsafe late options where delay materially changes benefit
3. referral consent was implied, but not yet defined as provider-, pathway-, scope-, and package-bound with expiry, supersession, withdrawal, checkpoint, and post-dispatch revocation handling
4. dispatch and status tracking were named, but not yet tied to transport-assurance proof, external confirmation gates, and honest pending or disputed patient assurance
5. outcome return and bounce-back were present, but not yet constrained by active reachability dependencies and urgent-return repair before closure or reassurance

This phase objective is only satisfied when the loop also guarantees:

- the pharmacy path remains inside the same request lineage, under the same `RequestLifecycleLease`, and no close or reopen decision bypasses `LifecycleCoordinator`, `ScopedMutationGate`, or active closure blockers
- patient choice remains real but safety-aware, with timing guardrails, explicit warnings, and governed override behaviour where provider delay changes expected safety or benefit
- consent is captured against the selected provider, pathway, referral scope, channel, and frozen package lineage through one authoritative checkpoint, and later expiry, supersession, withdrawal, or post-dispatch revocation changes the case honestly rather than being treated as background metadata
- referral status is evidence-bound through transport-assurance class, `ExternalConfirmationGate`, dispatch proof deadline, and same-shell pending or reconciliation states instead of optimistic `referred` messaging
- bounce-back, urgent return, and pharmacy outcome handling surface active `ReachabilityDependency` repair as first-class blockers when patient or pharmacy contact truth is broken, disputed, or stale

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

## Pharmacy-loop control priorities

This iteration closes five high-priority defects inside the pharmacy loop:

1. `PharmacyCase` was under-governed and could race dispatch, outcome ingest, reopen, and close paths without explicit lease or mutation control.
2. Provider choice optimized ranking but must encode pathway-sensitive timing guardrails for cases where delay materially changes safety or expected benefit.
3. Referral consent was too loosely modeled to safely govern provider changes, redispatch, expiry, and post-dispatch revocation.
4. Dispatch truth was under-specified: the phase referenced dispatch and correlation artifacts but must define a first-class proof chain for degraded transports and confirmation gates.
5. Reachability and contact-route failure were not first-class blockers, which risks silent failure when pharmacy contact, urgent return, or outcome confirmation depends on a broken route.

---

## 6A. Pharmacy contract, case model, and state machine

This sub-phase creates the durable runtime model for the pharmacy loop.

### Backend work

Do not reuse the Phase 3 `EndpointDecision` or `PharmacyIntent` as the live working object. Preserve them as the source clinical decision, then wrap them in a real `PharmacyCase`.

That wrap must stay lineage-complete. `PharmacyCase` must acknowledge one canonical `LineageCaseLink(caseFamily = pharmacy)` on the same `RequestLineage` as the originating request, and bounce-back or urgent return must settle that same link into `returned` or open a child follow-on link rather than disappearing behind loosely related referral IDs.

Create these objects:

**PharmacyCase**  
`pharmacyCaseId`, `episodeRef`, `originRequestId`, `requestLineageRef`, `lineageCaseLinkRef`, `originTaskId`, `pharmacyIntentId`, `sourceDecisionEpochRef`, `sourceDecisionSupersessionRef`, `patientRef`, `tenantId`, `serviceType`, `candidatePathway`, `eligibilityRef`, `choiceSessionRef`, `selectedProviderRef`, `activeConsentRef`, `activeConsentCheckpointRef`, `latestConsentRevocationRef`, `activeDispatchAttemptRef`, `correlationRef`, `outcomeRef`, `bounceBackRef`, `leaseRef`, `ownershipEpoch`, `staleOwnerRecoveryRef`, `lineageFenceRef`, `currentConfirmationGateRefs`, `currentClosureBlockerRefs`, `activeReachabilityDependencyRefs`, `activeIdentityRepairCaseRef`, `identityRepairBranchDispositionRef`, `identityRepairReleaseSettlementRef`, `status`, `slaTargetAt`, `createdAt`, `updatedAt`

**ServiceTypeDecision**  
`decisionId`, `pharmacyCaseId`, `lane`, `candidatePathways`, `gatewayResult`, `exclusionFlags`, `redFlagState`, `evidenceSufficiency`, `decisionConfidence`, `rulePackVersion`

**PathwayEligibilityEvaluation**  
`evaluationId`, `pharmacyCaseId`, `pathwayCode`, `rulePackVersion`, `ageSexGateResult`, `pathwayGateResult`, `exclusionMatches`, `requiredSymptomSupport`, `evidenceCompleteness`, `contradictionScore`, `eligibilityConfidence`, `recommendedLane`, `unsafeFallbackReasonCode`, `explanationBundleRef`

**PharmacyDirectorySnapshot**  
`snapshotId`, `pharmacyCaseId`, `queryOrigin`, `fetchedAt`, `expiresAt`, `providerRefs`, `sourceModes`, `directorySourceSnapshotRefs[]`, `providerCapabilitySnapshotRefs[]`, `rankingInputs`, `rankPlanVersion`, `candidateUniverseHash`, `timingGuardrailRef`, `warningBundleRef`, `choiceProofRef`, `explanationRefs[]`, `disclosurePolicyRefs[]`, `directoryTupleHash`, `suppressedUnsafeProviderRefs`, `invalidHiddenProviderRefs`

**PharmacyDirectorySourceSnapshot**
`directorySourceSnapshotId`, `directorySnapshotRef`, `discoveryMode`, `adapterContractRef`, `adapterVersionRef`, `sourceQueryHash`, `sourcePayloadHash`, `providerRecordRefs[]`, `capturedAt`

**PharmacyProviderCapabilitySnapshot**
`providerCapabilitySnapshotId`, `directorySnapshotRef`, `providerRef`, `supportedTransportModes[]`, `manualFallbackState = not_needed | allowed | required | unavailable`, `capabilityEvidenceRefs[]`, `capabilityState = direct_supported | manual_supported | unsupported`, `capabilityTupleHash`, `capturedAt`

**PharmacyProvider**  
`providerId`, `providerCapabilitySnapshotRef`, `odsCode`, `displayName`, `openingState`, `address`, `distanceRef`, `pathwaySuitability`, `minorIllnessSuitability`, `dispatchCapabilityState = direct_supported | manual_supported | unsupported`, `accessibilityTags`, `contactEndpoints`, `consultationModeHints`, `recommendationFeatures`, `serviceFitClass`, `predictedServiceDelayMinutes`, `recommendationScore`, `availabilityRiskClass`, `choiceSafetyClass`, `timingBand`, `nextSafeContactWindow`, `choiceVisibilityState = recommended_visible | visible_with_warning | suppressed_unsafe | invalid_hidden`, `choiceExplanationRef`, `overrideRequirementState = none | warned_choice_ack_required | policy_override_required`

**PharmacyChoiceProof**
`pharmacyChoiceProofId`, `pharmacyCaseId`, `directorySnapshotRef`, `providerCapabilitySnapshotRefs[]`, `compiledPolicyBundleRef`, `pathwayTimingGuardrailRef`, `candidateUniverseHash`, `orderedProviderRefs[]`, `recommendedProviderRefs[]`, `warningVisibleProviderRefs[]`, `suppressedUnsafeProviderRefs[]`, `invalidHiddenProviderRefs[]`, `explanationRefs[]`, `disclosurePolicyRefs[]`, `directoryTupleHash`, `rankingTupleHash`, `generatedAt`, `supersededAt`

**PharmacyChoiceExplanation**
`pharmacyChoiceExplanationId`, `pharmacyChoiceProofRef`, `providerRef`, `rankOrdinal`, `serviceFitClass`, `timingBand`, `recommendationScore`, `visibilityDisposition = recommended_visible | visible_with_warning | suppressed_unsafe | invalid_hidden`, `reasonCodeRefs[]`, `patientReasonCueRefs[]`, `staffExplanationRefs[]`, `supportExplanationRefs[]`, `warningCopyRef`, `suppressionReasonCodeRef`, `overrideRequirementState = none | warned_choice_ack_required | policy_override_required`, `disclosureTupleHash`, `generatedAt`

**PharmacyChoiceDisclosurePolicy**
`pharmacyChoiceDisclosurePolicyId`, `surfaceFamily = patient_pharmacy | patient_request_detail | staff_pharmacy | support_replay | assurance_audit`, `audienceTier`, `allowedReasonCodeRefs[]`, `numericExposureMode = hidden | bucketed | diagnostic`, `warningDisclosureMode = plain_language | detailed | diagnostic`, `suppressionDisclosureMode = summary_only | provider_specific | diagnostic`, `recommendationDisclosureMode = advisory_only | advisory_plus_reason | diagnostic`, `policyState = active | superseded`, `publishedAt`

**PharmacyChoiceOverrideAcknowledgement**
`choiceOverrideAcknowledgementId`, `pharmacyCaseId`, `choiceSessionRef`, `pharmacyChoiceProofRef`, `pharmacyChoiceExplanationRef`, `selectedProviderRef`, `overrideRequirementState`, `acknowledgedByActorType = patient | staff_proxy | staff`, `acknowledgementTextRef`, `selectionBindingHash`, `capturedAt`, `supersededAt`

**PharmacyChoiceSession**  
`choiceSessionId`, `pharmacyCaseId`, `snapshotId`, `choiceProofRef`, `choiceDisclosurePolicyRef`, `visibleProviderRefs`, `recommendedProviderRefs`, `warningVisibleProviderRefs`, `suppressedUnsafeProviderRefs`, `selectedProviderExplanationRef`, `selectedProviderCapabilitySnapshotRef`, `selectedOverrideAcknowledgementRef`, `warningBundleRef`, `patientChoiceState`, `selectedProviderRef`, `patientOverrideRequired`, `selectionBindingHash`, `visibleChoiceSetHash`, `directoryTupleHash`, `expiresAt`

**PharmacyConsentRecord**
`consentRecordId`, `pharmacyCaseId`, `choiceSessionRef`, `choiceProofRef`, `selectedProviderExplanationRef`, `overrideAcknowledgementRef`, `providerRef`, `pathwayCode`, `decision`, `capturedByMode`, `capturedAt`, `consentTextVersion`, `referralScopeHash`, `selectionBindingHash`, `packageFingerprint`, `channel`, `consentState = active | expiring | expired | withdrawn | superseded | revoked_post_dispatch`, `expiresAt`, `revokedAt`, `supersededByConsentRef`, `latestConsentCheckpointRef`, `latestRevocationRecordRef`, `evidenceRef`

**PharmacyConsentCheckpoint**
`consentCheckpointId`, `pharmacyCaseId`, `consentRecordRef`, `choiceProofRef`, `selectedProviderExplanationRef`, `overrideAcknowledgementRef`, `selectedProviderRef`, `pathwayCode`, `referralScopeHash`, `selectionBindingHash`, `packageFingerprint`, `latestDispatchAttemptRef`, `latestDispatchSettlementRef`, `patientConsentCheckpointProjectionRef`, `resumeContinuationRef`, `requestReturnBundleRef`, `checkpointState = satisfied | expiring | renewal_required | withdrawn | revoked_post_dispatch | withdrawal_reconciliation | recovery_required`, `blockingReasonCodes[]`, `continuityEvidenceRef`, `evaluatedAt`

**PharmacyConsentRevocationRecord**
`consentRevocationRecordId`, `pharmacyCaseId`, `consentRecordRef`, `dispatchAttemptRef`, `revocationKind = pre_dispatch | post_dispatch`, `revokedAt`, `downstreamWithdrawalState = not_required | requested | confirmed | disputed | impossible_after_handoff`, `providerAcknowledgementRef`, `recoveryRouteRef`, `resolutionNotesRef`, `recordedAt`, `settledAt`

**PharmacyReferralPackage**
`packageId`, `pharmacyCaseId`, `patientRef`, `providerRef`, `providerCapabilitySnapshotRef`, `pathwayRef`, `fhirRepresentationSetRef`, `serviceRequestArtifactRef`, `communicationArtifactRef`, `documentReferenceArtifactRefs[]`, `consentArtifactRef`, `provenanceArtifactRef`, `auditEventArtifactRef`, `patientSummaryRef`, `consentRef`, `consentCheckpointRef`, `directorySnapshotRef`, `compiledPolicyBundleRef`, `selectionBindingHash`, `lineageRefs`, `clinicalSummaryRef`, `packageFingerprint`, `packageHash`, `packageState = composing | frozen | superseded | invalidated`, `frozenAt`

**PharmacyDispatchPlan**
`dispatchPlanId`, `pharmacyCaseId`, `packageId`, `providerRef`, `providerCapabilitySnapshotRef`, `transportMode`, `transportAssuranceProfileRef`, `dispatchAdapterBindingRef`, `transformContractRef`, `allowedArtifactClasses`, `artifactManifestRef`, `dispatchPayloadRef`, `dispatchPayloadHash`, `dispatchPlanHash`, `manualReviewPolicyRef`, `planState = active | superseded | invalidated`, `plannedAt`

**PharmacyDispatchAttempt**
`dispatchAttemptId`, `pharmacyCaseId`, `packageId`, `dispatchPlanRef`, `transportMode`, `transportAssuranceProfileRef`, `routeIntentBindingRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeIntentTupleHash`, `idempotencyKey`, `requestLifecycleLeaseRef`, `requestOwnershipEpochRef`, `commandActionRecordRef`, `idempotencyRecordRef`, `adapterDispatchAttemptRef`, `latestReceiptCheckpointRef`, `providerRef`, `providerCapabilitySnapshotRef`, `dispatchAdapterBindingRef`, `dispatchPlanHash`, `packageHash`, `outboundReferenceSet`, `outboundReferenceSetHash`, `status = created | adapter_dispatched | transport_accepted | provider_accepted | proof_pending | proof_satisfied | reconciliation_required | superseded | failed | expired`, `transportAcceptanceState = none | accepted | rejected | timed_out | disputed`, `providerAcceptanceState = none | accepted | rejected | timed_out | disputed`, `proofDeadlineAt`, `proofState`, `dispatchConfidence`, `contradictionScore`, `proofEnvelopeRef`, `externalConfirmationGateRef`, `authoritativeProofRef`, `supersededByAttemptRef`, `attemptedAt`, `confirmedAt`

**PharmacyOutcomeRecord**
`outcomeId`, `pharmacyCaseId`, `sourceType`, `consultationMode`, `consultationSummaryRef`, `medicineSupplySummary`, `gpActionRequired`, `resolutionCategory`, `confidenceBand`, `manualReviewState`, `receivedAt`

**PharmacyBounceBackRecord**
`bounceBackId`, `pharmacyCaseId`, `bounceBackType`, `urgency`, `urgencyCarryFloor`, `reopenSignalScore`, `materialChangeScore`, `loopRiskScore`, `reopenPriorityBand`, `reopenByAt`, `returnedTaskRef`, `patientInformedAt`, `sourceEvidenceRef`

**PharmacyReachabilityPlan**
`planId`, `pharmacyCaseId`, `patientContactRouteRef`, `pharmacyContactDependencyRef`, `outcomeConfirmationDependencyRef`, `urgentReturnDependencyRef`, `repairState`, `lastValidatedAt`

Do not invent pharmacy-local shortcuts around the canonical control objects from Phase 0. `PharmacyCase` mutations must traverse `ScopedMutationGate`, every live case must hold a `RequestLifecycleLease`, and any close, reopen, bounce-back, or dispatch-proof transition must present the current `LineageFence.currentEpoch`. `PharmacyDispatchAttempt` is the pharmacy-facing wrapper over the canonical `IdempotencyRecord`, `CommandActionRecord`, and `AdapterDispatchAttempt` plus `AdapterReceiptCheckpoint` chain, and it must preserve the exact `RouteIntentBinding` target tuple plus one exact `PharmacyDispatchPlan` tuple over the selected provider, provider-capability snapshot, frozen package, dispatch adapter binding, transport assurance profile, and outbound payload lineage; duplicate receipts, redispatch retries, and disputed provider callbacks must reconcile there rather than through pharmacy-local last-write-wins logic. Dispatch, redispatch, outcome ingest, bounce-back, reopen, and close must also compare-and-set the current `RequestLifecycleLease.ownershipEpoch` plus `fencingToken`; expired or superseded owners must create or reuse `StaleOwnershipRecoveryRecord`, preserve the same patient or staff shell as recovery posture, and block calm completion or closure until reacquire or takeover settles. If wrong-patient repair is active, `identityRepairBranchDispositionRef` becomes mandatory and dispatch, redispatch, patient status entry, outcome closure, and calm reassurance must freeze until the branch is released or compensated.

Lock the main state machine now:

`candidate_received -> rules_evaluating`  
`rules_evaluating -> ineligible_returned | eligible_choice_pending`
`eligible_choice_pending -> provider_selected`
`provider_selected -> consent_pending | package_ready`
`consent_pending -> package_ready`
`package_ready -> consent_pending`
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
- `consent_pending` is entered when provider selection exists but valid referral consent has not yet been captured, has expired, has been superseded by provider or scope drift, or has been withdrawn
- `package_ready` is entered when the canonical referral package has been frozen with a valid `consentRef` and current `PharmacyConsentCheckpoint.checkpointState = satisfied`
- `dispatch_pending` is entered when a fenced `PharmacyDispatchAttempt` is underway and the relevant confirmation gate has been created or refreshed
- `consultation_outcome_pending` is entered only after dispatch is confirmed to the level required by the transport assurance profile and the case is waiting for pharmacy outcome
- `resolved_by_pharmacy` is a durable terminal-pre-close state, not a transient label
- `outcome_reconciliation_pending` is a `PharmacyCase`-local review state for weak or ambiguous outcome truth; it must never be copied into `Request.workflowState`, and it must keep the relevant confirmation or reconciliation work open
- `no_contact_return_pending` must never auto-close; it must lead to explicit practice review, bounce-back, or reopen handling

`PharmacyCase.status` alone is not authority to dispatch, redispatch, or render calm pharmacy reassurance. Those actions also require the current `PharmacyConsentCheckpoint` and `PharmacyContinuityEvidenceProjection` to validate the same provider, pathway, scope, package, and route lineage.

These are durable case states and must be written by the algorithms below.

Add the first event catalogue:

- `pharmacy.case.created`
- `pharmacy.service_type.resolved`
- `pharmacy.pathway.evaluated`
- `pharmacy.choice.session.created`
- `pharmacy.provider.selected`
- `pharmacy.consent.checkpoint.updated`
- `pharmacy.package.composed`
- `pharmacy.dispatch.started`
- `pharmacy.dispatch.confirmed`
- `pharmacy.dispatch.proof_missing`
- `pharmacy.consent.revoked`
- `pharmacy.consent.revocation.recorded`
- `pharmacy.outcome.received`
- `pharmacy.outcome.reconciled`
- `pharmacy.reachability.blocked`
- `pharmacy.reachability.repaired`
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

Backfill and compatibility are part of the design, not a later clean-up. On rollout, materialize one current `PharmacyConsentCheckpoint` for every open `PharmacyCase` from the latest consent row, selected provider, current pathway, referral scope, and frozen package lineage. Any legacy case whose consent is expired, revoked, superseded, or ambiguous must reopen in `consent_pending`, and any dispatched case with later revocation must mint `PharmacyConsentRevocationRecord` plus a non-satisfied checkpoint before staff or patient surfaces render writable or calm posture again. Materialize one current `PharmacyChoiceProof`, `PharmacyChoiceExplanation` set, `PharmacyChoiceDisclosurePolicy`, and `visibleChoiceSetHash` for every open `eligible_choice_pending`, `provider_selected`, or `consent_pending` case as well; if a legacy case cannot reconstruct one unambiguous visible choice set plus selected-provider explanation, supersede the old session and require a fresh same-shell choice or consent renewal instead of replaying stale recommendations.

This specialization does not change the referral-first boundary of Phase 6 and must not be read as turning Vecells into a general PMR or dispensing system.

### Tests that must pass before moving on

- pharmacy-state transition tests
- migration tests from `PharmacyIntent` to `PharmacyCase`
- event-schema tests for pharmacy events
- lease fencing and stale-owner rejection tests
- scoped-mutation-gate tests on choose, dispatch, outcome, reopen, and close commands
- no-orphan tests between `PharmacyCase`, `LineageCaseLink`, package, outcome, and bounce-back records
- consent-checkpoint backfill tests for expired, superseded, revoked, and ambiguous legacy consent rows
- no-close-while-confirmation-gate-or-reachability-blocker-active tests
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
`rulePackId`, `effectiveFrom`, `effectiveTo`, `serviceSpecVersion`, `pathwayDefinitions`, `minorIllnessPolicy`, `eligibilityThresholds`, `reconciliationThresholds`, `globalExclusions`, `redFlagBridges`, `timingGuardrails`, `displayTextRefs`

**PathwayDefinition**
`pathwayCode`, `displayName`, `ageSexGate`, `requiredSymptoms`, `requiredSymptomWeights`, `exclusionRules`, `redFlagRules`, `minorIllnessFallbackRules`, `timingGuardrailRef`, `allowedEscalationModes`, `supplyModes`

**PathwayTimingGuardrail**
`guardrailId`, `rulePackVersion`, `pathwayCode`, `materialityLevel`, `maxRecommendedDelayMinutes`, `maxAllowedDelayMinutes`, `latestSafeOpeningDeltaMinutes`, `suppressionPolicy`, `warningCopyRef`

**EligibilityExplanationBundle**
`bundleId`, `patientFacingReason`, `staffFacingReason`, `matchedRules`, `nextBestEndpointSuggestion`

The first production rules pack should explicitly encode the current 7 pathway gates published by NHS England: uncomplicated UTI for women aged 16 to 64, impetigo for adults and children aged 1 and over, infected insect bites for adults and children aged 1 and over, acute sore throat for people aged 5 and over, acute sinusitis for people aged 12 and over, shingles for adults aged 18 and over, and acute otitis media for children aged 1 to 17. The rule pack should also support the broader service lanes that NHS England still describes for GP-practice referrals: low acuity or minor illness management and clinical pathway consultations. ([NHS England][1])

The evaluation algorithm should be:

1. move the case to `candidate_received`
2. snapshot current request evidence and move the case to `rules_evaluating`
3. resolve pharmacy service lane candidate and, for each pathway `p` under consideration for case evidence `x`, compute:

   * `a_p(x) in {0,1}` from the hard age and sex gate
   * `r_j(x) in [0,1]` as positive support that required symptom `j` is present
   * `c_j(x) in [0,1]` as evidence completeness for required symptom `j`
   * `s_req(p,x) = sum_j alpha_j * r_j(x) / sum_j alpha_j`
   * `s_comp(p,x) = sum_j alpha_j * c_j(x) / sum_j alpha_j`
   * `s_excl(p,x) = max_k x_k(x)` over pathway-specific exclusions
   * `s_global(x) = max_q g_q(x)` over global exclusions and red-flag bridge rules
   * `s_contra(p,x) in [0,1]` from contradictory or mutually incompatible evidence
   * `eligibilityConfidence(p,x) = a_p(x) * s_req(p,x) * s_comp(p,x) * (1 - s_excl(p,x))^{eta_excl} * (1 - s_global(x))^{eta_global} * (1 - s_contra(p,x))^{eta_contra}`
4. if `s_global(x) >= tau_global_block`, set the case to `ineligible_returned` and return to non-pharmacy endpointing immediately
5. mark pathway `p` hard-failed if `a_p(x) = 0`, `s_excl(p,x) >= tau_path_block`, or `s_contra(p,x) >= tau_contra_block`
6. mark pathway `p` eligible only if `s_req(p,x) >= tau_req_pass`, `s_comp(p,x) >= tau_min_complete`, and `eligibilityConfidence(p,x) >= tau_eligible`
7. if more than one pathway remains eligible, choose by clinical pathway precedence first, then `eligibilityConfidence(p,x)` descending, then deterministic tie-breaker
8. only if no clinical pathway is eligible, `s_global(x) < tau_global_block`, and every rejected clinical pathway failed for pathway-specific reasons only, may local policy evaluate minor-illness fallback with `fallbackScore(x) = product_h max(epsilon, m_h(x))^{xi_h}` and threshold `tau_minor_eligible`
9. if minor-illness fallback is eligible, continue pharmacy processing and prepare for provider choice
10. if the case fails pharmacy suitability entirely, set the case to `ineligible_returned` and return it to non-pharmacy endpointing
11. persist the matched rule IDs, rule-pack version, `requiredSymptomSupport`, `evidenceCompleteness`, `contradictionScore`, `eligibilityConfidence`, and any applicable `PathwayTimingGuardrail`
12. if the case remains suitable for pharmacy handling, create or refresh the choice flow and set the case to `eligible_choice_pending`

All `alpha_*`, `eta_*`, `xi_*`, and `tau_*` parameters must be versioned inside the active `PharmacyRulePack`; local defaults are forbidden.

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
- timing-guardrail replay and boundary tests
- eligibility-confidence and evidence-completeness threshold tests
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
2. query active directory adapters and persist one `PharmacyDirectorySourceSnapshot` per returned source
3. normalize candidate pharmacies into one provider model and one `PharmacyProviderCapabilitySnapshot` per normalized provider
4. load the applicable `PathwayTimingGuardrail` for the pathway or minor-illness lane
5. exclude only providers that are truly invalid for the referral, such as organisationally invalid records, non-commissioned service mismatch, or `PharmacyProviderCapabilitySnapshot.capabilityState = unsupported`; providers that are only `manual_supported` remain visible with warning rather than being silently removed
6. annotate every remaining provider with open state, next opening window, capability-summary posture, accessibility, timing risk, and ranking signals, but do not resolve a transport mode, dispatch adapter binding, or outbound payload yet
7. mint one `PharmacyChoiceProof`, `PharmacyChoiceExplanation`, and `PharmacyChoiceDisclosurePolicy` set for the current directory snapshot and guardrail, classifying every normalized provider as `recommended_visible`, `visible_with_warning`, `suppressed_unsafe`, or `invalid_hidden`
8. compute recommendation features for each valid provider `p`:

   - `serviceFitClass(p) in {2,1,0}`, where `2` means exact commissioned service and pathway fit, `1` means service-capable but only a manual-pathway or minor-illness fit, and `0` means visible fallback allowed by policy
   - `h_path(p) in [0,1]` for pathway or minor-illness suitability within the chosen service class
   - `dispatchCapabilityState(p) in {direct_supported, manual_supported}`, derived from the current `PharmacyProviderCapabilitySnapshot`, for explanation and warning posture only
   - `t_ready(p) = max(now, nextSafeContactWindow(p))`
   - `delay_p = max(0, minutesBetween(now, t_ready(p)))`
   - `timingBand(p) = 2` when `delay_p <= maxRecommendedDelayMinutes`, `1` when `maxRecommendedDelayMinutes < delay_p <= maxAllowedDelayMinutes` and policy still allows warned choice, and `0` otherwise
   - `h_timing(p) = exp(-max(0, delay_p - maxRecommendedDelayMinutes) / tau_delay)`
   - `h_travel(p) = exp(-travelMinutes(p) / tau_travel)`
   - `h_access(p) in [0,1]`
   - `h_fresh(p) = exp(-stalenessMinutes(snapshot,p) / tau_fresh)`
9. compute `recommendationScore(p) = product_k max(epsilon, h_k(p))^{lambda_k}` over `h_path`, `h_timing`, `h_travel`, `h_access`, and `h_fresh`, with `sum lambda_k = 1`
10. sort all valid visible providers lexicographically by `timingBand(p)` descending, `serviceFitClass(p)` descending, `recommendationScore(p)` descending, then `displayName` ascending, but keep the full valid choice set visible unless timing policy explicitly suppresses clearly unsafe late options; capability summary and manual-fallback posture may influence explanation and warning copy, but they may not silently re-rank or hide a valid provider beyond the `unsupported` gate
11. derive `recommendedProviderRefs` from the same visible frontier, not from a hidden top-`K` slice. Use the current `PharmacyChoiceProof` to highlight every provider in the best available timing band and service-fit frontier whose score stays within policy-defined frontier tolerance of the best score
12. create `PharmacyDirectorySnapshot` plus the current `PharmacyDirectorySourceSnapshot` set, `PharmacyProviderCapabilitySnapshot` set, `PharmacyChoiceProof`, `PharmacyChoiceExplanation` set, and `PharmacyChoiceDisclosurePolicy`
13. create `PharmacyChoiceSession` with the full visible provider set and advisory recommended frontier; `patientOverrideRequired = false` until a selected provider requires warned-choice or policy-override acknowledgement
14. keep `PharmacyCase.status = eligible_choice_pending` while choice is outstanding
15. when the patient or staff selects a provider, persist that provider selection together with `selectedProviderExplanationRef` and the current `selectedProviderCapabilitySnapshotRef`; if `overrideRequirementState != none`, append `PharmacyChoiceOverrideAcknowledgement`, set `patientOverrideRequired = true`, and do not advance to consent until the acknowledgement settles
16. capture explicit referral consent using a versioned patient-facing consent script that matches the provider, pathway, channel, referral scope, current return path, and current `selectionBindingHash`
17. if consent is granted, create `PharmacyConsentRecord` bound to that provider, pathway, referral scope, choice session, current `PharmacyChoiceProof`, selected explanation, any override acknowledgement, and `selectionBindingHash`, then materialize `PharmacyConsentCheckpoint` as the only authority for whether dispatch and reassurance may proceed
18. if the provider changes, the pathway changes, the referral scope changes materially, the current `PharmacyChoiceProof` is superseded, or the prior package fingerprint no longer matches, supersede the earlier consent record, invalidate any frozen package that pointed at it, and reopen the case in `consent_pending`
19. if `PharmacyConsentCheckpoint.checkpointState = satisfied`, allow the dispatch pipeline to proceed
20. if consent is missing, refused, expired, withdrawn, superseded, or otherwise non-satisfied, move the case to `consent_pending`, preserve the chosen provider card in the same shell, and do **not** dispatch the referral

The provider model should carry:

- ODS code and display name
- opening state and next opening window
- service suitability by pathway or minor-illness lane
- accessibility flags
- referral contact endpoints and published consultation-mode hints
- one `PharmacyProviderCapabilitySnapshot` describing the currently allowed dispatch families and any manual-fallback posture
- locality and travel scoring inputs
- timing-band and warned-choice state where the next safe contact window materially changes suitability

Discovery may classify a provider as `direct_supported`, `manual_supported`, or `unsupported`, but it may not lock the transport mode, adapter binding, or outbound payload shape while the patient is still choosing. Those transport-bound decisions belong to `PharmacyDispatchPlan` after `PharmacyReferralPackage` is frozen.

Do not let `open now`, `electronic referral supported`, or similar convenience signals quietly remove an otherwise valid provider from the patient’s choice set. Those are ranking and explanation inputs unless referral safety, timing guardrail policy, or dispatch feasibility truly fails.

**PharmacyChoiceTruthProjection**
`pharmacyChoiceTruthProjectionId`, `pharmacyCaseId`, `choiceSessionRef`, `directorySnapshotRef`, `choiceProofRef`, `choiceDisclosurePolicyRef`, `directoryTupleHash`, `visibleProviderRefs`, `recommendedProviderRefs`, `warningVisibleProviderRefs`, `suppressedUnsafeSummaryRef`, `selectedProviderRef`, `selectedProviderExplanationRef`, `selectedProviderCapabilitySnapshotRef`, `patientOverrideRequired`, `overrideAcknowledgementRef`, `selectionBindingHash`, `visibleChoiceSetHash`, `projectionState = choosing | selected_waiting_consent | read_only_provenance | recovery_required`, `computedAt`

`PharmacyChoiceTruthProjection` is the single audience-safe choice contract for patient chooser, request-detail, staff assist, and replay surfaces. Visible order, recommended frontier, warning copy, suppressed-unsafe summary, selected-provider provenance, and warned-choice acknowledgement must all resolve from the same current proof plus disclosure policy rather than from browser-local sorting, cached map markers, or staff-only heuristics.

### Frontend work

The patient pharmacy chooser should be sleek and reassuring, not like a clumsy search console.

Build:

- ranked list view from `PharmacyChoiceTruthProjection` as the default
- optional map view as a secondary surface driven by the same order and explanations
- recommended and all-valid groupings derived from the same `PharmacyChoiceProof`
- open-now and open-later filters that bucket the current visible proof rather than silently removing warned providers
- clear distance and access hints
- explicit reason chips for `recommended`, `allowed with warning`, and suppressed-unsafe summary posture
- change-pharmacy action before dispatch
- in-place warned-choice acknowledgement before a warned or policy-overridden provider can advance to consent
- one strong primary action per provider card

The important product rule is this: recommend, but do not funnel. NHS England's current GP contract and Pharmacy First referral guidance both make patient choice explicit. So the UI should always preserve a genuine provider list rather than locking onto the first ranked result. ([NHS England][3])

When timing guardrails elevate sooner-service options, make that explicit in the chooser. The user may still need real choice, but the interface must not present a tomorrow-morning provider as equally safe as an open-now provider when the pathway policy says delay matters. If the visible order, recommended frontier, or warning posture changes because directory data or policy changed, mint a new `PharmacyChoiceTruthProjection`, pin the previous selection as read-only provenance, and recover in place rather than silently re-sorting the old cards.

### Tests that must pass before moving on

- adapter contract tests for all discovery modes
- ranking determinism tests
- full-choice exposure tests
- no-top-`K` recommendation-funneling tests
- closed-but-valid provider exposure tests
- timing-warning and explicit-override tests
- clearly-unsafe late-option suppression tests
- patient-versus-staff explanation parity tests
- selected-provider explanation and `selectionBindingHash` replay tests
- provider-change and scope-drift tests proving earlier consent is superseded before redispatch or renewed packaging
- timing-band and dispatch-capability disclosure tests
- no-transport-feasibility-in-recommendation tests
- open-now and closed-state tests
- stale-directory snapshot tests
- directory-source failover and deprecation replay tests
- stale-choice-proof and stale-choice-session supersession tests
- accessibility tests for list and map selection
- mobile usability tests for provider choice

### Exit state

The patient can now choose a real pharmacy provider from a controlled, ranked, but still genuinely open choice set.

## 6D. Referral pack composer, dispatch adapters, and transport contract

This sub-phase turns a pharmacy decision into a real outbound referral.

### Backend work

Create one canonical `PharmacyReferralPackage`, then let adapters transform it for the actual transport.

This section is a pharmacy-specific application of the canonical dispatch, reconciliation, projection, and closure rules in `phase-0-the-foundation-protocol.md`. Live-referral status, patient or staff visibility, and closure gating must remain subordinate to `PharmacyCorrelationRecord`, `VisibilityProjectionPolicy`, `SafetyOrchestrator`, and `LifecycleCoordinator`.

Reuse the canonical `PharmacyCorrelationRecord` from Phase 0; do not create a pharmacy-local alternative correlation model.

Dispatch is a post-submit mutation and must traverse the canonical `ScopedMutationGate`. Provider choice, consent scope, and referral dispatch may not drift independently once a patient or staff operator commits the pharmacy path.

High-priority dispatch gaps in this slice:

1. the canonical referral package is described functionally, but not frozen as one immutable dispatch artifact bound to provider choice, consent, policy, and lineage versions
2. transport choice is listed, but the adapter capability and approved transform set are not bound to the live dispatch attempt, so a retry could drift to a different transport posture
3. attachments and supporting material are included generically, but there is no manifest proving which artifacts were allowed, redacted, transformed, or omitted per transport
4. acknowledgement and durable-dispatch proof are treated broadly, but there is no single proof envelope that correlates transport receipts, weak proof, or duplicate provider responses back to the governed attempt
5. `manual_assisted_dispatch` is present as a transport mode, but it is not yet fenced strongly enough to stop staff from asserting live referral without operator evidence and secondary review when policy requires it

Create these dispatch objects:

**TransportAssuranceProfile**
`transportMode`, `assuranceClass`, `ackRequired`, `proofSources`, `proofDeadlinePolicy`, `dispatchConfidenceThreshold`, `contradictionThreshold`, `proofRiskModelRef`, `proofRiskCalibrationVersion`, `proofRiskThresholdSetRef`, `revisionPolicyRef`, `patientAssurancePolicy`, `exceptionPolicy`

**DispatchAdapterBinding**
`dispatchAdapterBindingId`, `transportMode`, `adapterVersionRef`, `transformContractRef`, `providerCapabilitySnapshotRef`, `allowedArtifactClasses`, `requiresManualOperator`, `manualReviewPolicyRef`, `bindingHash`, `boundAt`

**ReferralArtifactManifest**
`artifactManifestId`, `dispatchPlanRef`, `packageId`, `includedArtifactRefs`, `redactedArtifactRefs`, `omittedArtifactRefs`, `transformNotesRef`, `classificationRef`, `manifestHash`, `compiledAt`

Use the canonical `PharmacyReferralPackage`, `PharmacyDispatchPlan`, and `PharmacyDispatchAttempt` definitions declared earlier in this phase. Do not fork second dispatch-contract schemas inside the dispatch section; extend their behavior here only through the supporting objects below. The phase-local `PharmacyDispatchAttempt` must keep its `commandActionRecordRef`, `idempotencyRecordRef`, `adapterDispatchAttemptRef`, and `latestReceiptCheckpointRef` aligned with the underlying canonical effect ledger.

**DispatchProofEnvelope**
`dispatchProofEnvelopeId`, `dispatchAttemptId`, `transportAssuranceProfileRef`, `proofDeadlineAt`, `proofSources`, `transportAcceptanceEvidenceRefs`, `providerAcceptanceEvidenceRefs`, `deliveryEvidenceRefs`, `authoritativeProofSourceRef`, `proofComponents`, `proofConfidence`, `dispatchConfidence`, `contradictionScore`, `sourceCorrelationRefs`, `duplicateOfRef`, `proofState = pending | satisfied | disputed | expired`, `riskState = on_track | at_risk | likely_failed | disputed`, `stateConfidenceBand = high | medium | low`, `calibrationVersion`, `causalToken`, `monotoneRevision`, `verifiedAt`

`transportAcceptanceEvidenceRefs`, `providerAcceptanceEvidenceRefs`, and `deliveryEvidenceRefs` are subordinate evidence lanes. They may widen pending confidence, contradiction handling, and operator context, but only `authoritativeProofSourceRef` may satisfy the current attempt for `live_referral_confirmed`.

**ManualDispatchAssistanceRecord**
`manualDispatchAssistanceRecordId`, `dispatchAttemptId`, `operatorRef`, `operatorActionRef`, `secondReviewerRef`, `evidenceRefs`, `attestationState = pending | attested | rejected`, `completedAt`

**PharmacyDispatchSettlement**
`settlementId`, `pharmacyCaseId`, `dispatchAttemptId`, `dispatchPlanRef`, `routeIntentBindingRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `routeIntentTupleHash`, `proofEnvelopeRef`, `transportAssuranceProfileRef`, `dispatchAdapterBindingRef`, `consentCheckpointRef`, `result = live_referral_confirmed | pending_ack | stale_choice_or_consent | denied_scope | reconciliation_required`, `proofRiskState = on_track | at_risk | likely_failed | disputed`, `stateConfidenceBand = high | medium | low`, `calibrationVersion`, `receiptTextRef`, `experienceContinuityEvidenceRef`, `causalToken`, `recoveryRouteRef`, `monotoneRevision`, `recordedAt`

**PharmacyContinuityEvidenceProjection**
`pharmacyContinuityEvidenceProjectionId`, `routeFamilyRef`, `pharmacyCaseId`, `selectedProviderRef`, `latestConsentCheckpointRef`, `latestConsentRevocationRef`, `latestDispatchSettlementRef`, `latestOutcomeSettlementRef`, `latestOutcomeTruthRef`, `latestOutcomeReconciliationGateRef`, `experienceContinuityEvidenceRef`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `capturedAt`

`PharmacyContinuityEvidenceProjection` binds the patient and staff pharmacy shells to the assurance spine. Chosen-pharmacy continuity, consent-renewal hold, dispatch-pending posture, referred confirmation, and outcome recovery may not be presented as ordinary calm or writable state unless the current `ExperienceContinuityControlEvidence` still validates the same pharmacy route family, consent checkpoint, route-intent tuple, and anchor.

**PharmacyDispatchTruthProjection**
`pharmacyDispatchTruthProjectionId`, `pharmacyCaseId`, `dispatchAttemptRef`, `dispatchPlanRef`, `selectedProviderRef`, `packageId`, `packageHash`, `transportMode`, `transportAssuranceProfileRef`, `dispatchAdapterBindingRef`, `dispatchPlanHash`, `transportAcceptanceState = none | accepted | rejected | timed_out | disputed`, `providerAcceptanceState = none | accepted | rejected | timed_out | disputed`, `authoritativeProofState = pending | satisfied | disputed | expired`, `proofRiskState = on_track | at_risk | likely_failed | disputed`, `dispatchConfidence`, `contradictionScore`, `proofDeadlineAt`, `outboundReferenceSetHash`, `proofEnvelopeRef`, `dispatchSettlementRef`, `continuityEvidenceRef`, `audienceMessageRef`, `computedAt`

`PharmacyDispatchTruthProjection` is the single audience-safe dispatch truth contract for patient, pharmacy-console, request-detail, and operations surfaces. Transport acceptance, provider acceptance, or shared-mailbox delivery may widen pending guidance, but they may not render calm `referred`, `consultation_outcome_pending`, or handoff-complete posture until `authoritativeProofState = satisfied` for the current attempt.

Dispatch proof must also carry a calibrated missing-proof model. For the current dispatch attempt `a`, elapsed discrete interval `u`, feature vector `x_a` built from transport mode, provider, adapter, route health, and prior proof latency, and terminal causes `k in {proof_satisfied, failed, disputed, expired}`, compute:

- `lambda_k(u | x_a) = P(T_a = u, J_a = k | T_a >= u, x_a)`
- `S_a(u | x_a) = prod_{v = 1}^{u} (1 - sum_k lambda_k(v | x_a))`
- `F_k(u | x_a) = sum_{v = 1}^{u} lambda_k(v | x_a) * S_a(v - 1 | x_a)`
- `p_k(u | x_a) = Cal_dispatch,k(F_k(u | x_a))` using a versioned calibrator over resolved dispatch attempts

Map the calibrated probabilities to `DispatchProofEnvelope.riskState` and `PharmacyDispatchSettlement.proofRiskState`:

- `on_track` while `p_proof_satisfied(u | x_a) >= theta_dispatch_track` and no counterevidence exists
- `at_risk` once the soft proof horizon is missed without proof or hard-failure evidence
- `likely_failed` when `p_failed(u | x_a) + p_expired(u | x_a) >= theta_dispatch_fail`
- `disputed` whenever contradictory same-attempt terminal evidence exists

`riskState` may widen pending or repair guidance, but it may never promote a case to `live_referral_confirmed`, `referred`, or calm patient reassurance without `proofState = satisfied` for the current attempt.

All calibrated dispatch-proof parameters and state-mapping thresholds, including `Cal_dispatch,k`, `theta_dispatch_track`, `theta_dispatch_fail`, the active competing-risk feature set, and monotone revision policy, must be versioned by the current `TransportAssuranceProfile`. `DispatchProofEnvelope.calibrationVersion`, `DispatchProofEnvelope.transportAssuranceProfileRef`, `PharmacyDispatchSettlement.calibrationVersion`, and `PharmacyDispatchSettlement.monotoneRevision` must trace back to that profile rather than to local adapter defaults.

`PharmacyDispatchSettlement.proofEnvelopeRef` must point to the same current aggregate `DispatchProofEnvelope` whose `dispatchConfidence`, `riskState`, `calibrationVersion`, and `monotoneRevision` justified the settlement. Settlement copy and proof-envelope state may not diverge under retry, replay, or later disputed evidence.

The right internal shape is a transport-neutral `PharmacyReferralPackage`, then one transport-bound `PharmacyDispatchPlan`, then one governed `PharmacyDispatchAttempt` that emits the exact outbound payload. The package may contain or reference one governed `FhirRepresentationSet` for the referral boundary, and the dispatch plan may derive transport-specific payloads, manifests, and omissions from it. `ServiceRequest`, supporting `Communication`, `DocumentReference`, `Consent`, `Provenance`, and `AuditEvent` artifacts are mapped outputs and transform products, not the owning aggregate.

The canonical package should contain:

- patient identity and contact summary
- source practice and task lineage
- selected pharmacy provider
- pharmacy lane and pathway
- structured clinical summary
- red-flag and exclusion checks already run
- consent and communication preference state
- canonical attachments or supporting material through the frozen package artifact set, with any transport-specific omissions or redactions deferred to `PharmacyDispatchPlan.artifactManifestRef`
- correlation IDs for later reconciliation

Dispatch modes should include:

- `bars_fhir`
- `supplier_interop`
- `nhsmail_shared_mailbox`
- `mesh`
- `manual_assisted_dispatch`

That transport mix matches current national reality. NHS England's general-practice referral guidance says practices can set up the electronic message using NHSmail, interoperable messages between IT suppliers, or local shared-record arrangements, and says IT suppliers will be required to meet BaRS. BaRS itself is the national interoperability standard for sending booking and referral information between providers, and MESH remains the secure asynchronous route for messages and large files. ([NHS England][1])

Before dispatch, create `PharmacyCorrelationRecord` containing `pharmacyCaseId`, `packageId`, `dispatchAttemptId`, `providerRef`, `patientRef`, `serviceType`, `directorySnapshotRef`, `providerCapabilitySnapshotRef`, `dispatchPlanRef`, `transportMode`, `transportAssuranceProfileRef`, `dispatchAdapterBindingRef`, `dispatchPlanHash`, and all outbound transport references.

Make dispatch idempotent, consent-gated, and acknowledgement-aware:

1. resolve exactly one governing `PharmacyCase`, selected provider, exact route-intent tuple, and route family through `ScopedMutationGate`
2. confirm that a provider has been selected, still exists in the active or explicitly accepted superseded `PharmacyDirectorySnapshot`, and still points at the current or explicitly accepted superseded `PharmacyChoiceExplanation`
3. load the current `PharmacyProviderCapabilitySnapshot` for the selected provider and the applicable `TransportAssuranceProfile`
4. evaluate or refresh the current `PharmacyConsentCheckpoint` for the selected provider, current `PharmacyChoiceProof`, selected explanation, any override acknowledgement, pathway, referral scope, current or prospective package fingerprint, and shell continuity; if the checkpoint is not `satisfied`, set `PharmacyCase.status = consent_pending`, route to same-shell renewal or recovery, and stop
5. validate that provider choice, current `PharmacyChoiceProof`, current `PharmacyChoiceDisclosurePolicy`, `selectionBindingHash`, pathway, consent scope, current or prospective package fingerprint, current route-intent tuple, and current `CompiledPolicyBundle` still agree; if the choice snapshot expired, the choice proof was superseded, the visible choice set changed materially, the authoritative pharmacy target no longer matches the bound route intent tuple, or consent scope no longer matches, supersede the earlier checkpoint, return `PharmacyDispatchSettlement.result = stale_choice_or_consent`, and recover inside the same pharmacy shell
6. compose and freeze one immutable `PharmacyReferralPackage`, attach `consentRef`, `consentCheckpointRef`, `directorySnapshotRef`, `compiledPolicyBundleRef`, the current `selectedProviderCapabilitySnapshotRef`, and the published canonical representation contract inputs, calculate `packageHash`, materialize one canonical `FhirRepresentationSet`, move the case to `package_ready`, and create `PharmacyCorrelationRecord`
7. resolve one `PharmacyDispatchPlan` for the chosen transport path from the frozen package, current `PharmacyProviderCapabilitySnapshot`, one `TransportAssuranceProfile`, and one `DispatchAdapterBinding`; compile one `ReferralArtifactManifest`, one transport-bound payload, and one `dispatchPlanHash`, and fail closed if adapter version, capability snapshot, or allowed artifact classes do not match the frozen package
8. create or refresh the relevant `ExternalConfirmationGate` before any outbound send, then create one `PharmacyDispatchAttempt` with idempotency key, `dispatchPlanRef`, `dispatchAdapterBindingRef`, `transportAssuranceProfileRef`, `dispatchPlanHash`, `packageHash`, and the current route-intent target tuple, bound to one canonical `IdempotencyRecord`, `CommandActionRecord`, and `AdapterDispatchAttempt`; duplicate taps or retried commands must return the live attempt rather than start a second dispatch
9. immediately before adapter send commits, re-check that the same `PharmacyConsentCheckpoint` remains `satisfied` and that the bound dispatch plan still matches the same provider-capability snapshot, transport assurance profile, dispatch adapter binding, and payload hash; if consent expired, was withdrawn, was superseded, or no longer matches provider, pathway, scope, package lineage, or the bound transport-plan tuple, invalidate the frozen package or dispatch plan, settle `stale_choice_or_consent`, and do not send
10. transform and send the frozen package through the bound `PharmacyDispatchPlan` only; the adapter may emit omission or redaction evidence into `ReferralArtifactManifest`, but it may not widen the package after freeze, reinterpret discovery results, or rewrite the bound canonical representation set ad hoc
11. record provider-facing references on `PharmacyCorrelationRecord` and `PharmacyDispatchAttempt`, bind `outboundReferenceSetHash` to the frozen package plus chosen dispatch-plan effect, then create or update the current aggregate `DispatchProofEnvelope` for every accepted `AdapterReceiptCheckpoint`, durable-send proof, manual attestation, or disputed provider response, persisting `transportAssuranceProfileRef`, `proofDeadlineAt`, and `dispatchConfidence(a)`, with:

    * `pi_j(a) = sourceTrust_j * correlationConfidence_j * freshnessFactor_j` for each positive proof event `j`
    * `proofConfidence(a) = 1 - product_{j in E_a^+}(1 - pi_j(a))`
    * `rho_k(a) in [0,1]` for each contradictory or disputed event `k`
    * `contradictionScore(a) = 1 - product_{k in E_a^-}(1 - rho_k(a))`
    * `dispatchConfidence(a) = proofConfidence(a) * (1 - contradictionScore(a))^{lambda_dispatch_contra}`
    * keep transport acceptance, provider acceptance, delivery evidence, and authoritative dispatch proof on distinct evidence lanes in the active `DispatchProofEnvelope`, `PharmacyCorrelationRecord`, and `PharmacyDispatchTruthProjection`; weaker evidence may widen pending copy but may never promote live referral on its own
    * evidence whose `packageHash`, `providerRef`, `transportMode`, `dispatchAdapterBindingRef`, `dispatchPlanHash`, or `outboundReferenceSetHash` no longer matches the active attempt stays auditable only and may not satisfy the current attempt
12. if `transportMode = manual_assisted_dispatch`, require `ManualDispatchAssistanceRecord` with operator evidence and secondary review where policy requires it before the proof envelope may become satisfied; duplicate or out-of-order provider receipts must update the same `latestReceiptCheckpointRef`, while divergent same-correlation receipts must open `ReplayCollisionReview` instead of confirming a second referral
13. move the case to live referral only when `dispatchConfidence(a) >= TransportAssuranceProfile.dispatchConfidenceThreshold`, `contradictionScore(a) <= TransportAssuranceProfile.contradictionThreshold`, `DispatchProofEnvelope.authoritativeProofSourceRef` is present and accepted for the transport class, the `ExternalConfirmationGate` is satisfied enough for the transport class, the proof is correlated to the current attempt rather than a duplicate or stale send, and current consent checkpoint plus package fingerprints plus route-intent tuple still match the lineage and the active `PharmacyDispatchPlan`
14. if `dispatchConfidence(a) < TransportAssuranceProfile.dispatchConfidenceThreshold` at the proof deadline, `contradictionScore(a) > TransportAssuranceProfile.contradictionThreshold`, `DispatchProofEnvelope.authoritativeProofSourceRef` is absent or disputed, or the active consent checkpoint has moved out of `satisfied`, compute the current `DispatchProofEnvelope.riskState`, copy the current `proofEnvelopeRef`, `dispatchPlanRef`, `transportAssuranceProfileRef`, `dispatchAdapterBindingRef`, `consentCheckpointRef`, and `calibrationVersion` into `PharmacyDispatchSettlement`, refresh `PharmacyDispatchTruthProjection`, keep the case in `dispatch_pending` or move it to explicit reconciliation, return `PharmacyDispatchSettlement.result = pending_ack`, `stale_choice_or_consent`, or `reconciliation_required`, and surface `at_risk`, `likely_failed`, or governed repair guidance rather than pretending the referral is live or emitting final patient reassurance text
15. only after live dispatch proof exists may the case move to `referred` and then `consultation_outcome_pending`; transport acceptance, provider acceptance, or mailbox delivery alone may not advance either state
16. keep the canonical `Request` in `workflowState = handoff_active` while pharmacy outcome is still pending
17. if dispatch fails, raise exception and do not move the case into a referred or outcome-pending state
18. withdrawn, superseded, or expired consent invalidates the package and forces a return to `consent_pending` before any retry; retries may reuse the same frozen package only while `packageHash`, provider, pathway, consent checkpoint, and selection binding still match, but any retry that would change provider capability snapshot, transport mode, dispatch adapter binding, transform contract, dispatch payload hash, or outbound reference set must supersede the old `PharmacyDispatchPlan` and `PharmacyDispatchAttempt` and keep stale evidence from satisfying the new truth chain
19. patient-facing `referred` or same-shell settled posture may render only while the current `PharmacyContinuityEvidenceProjection` validates the same selected provider, consent checkpoint, dispatch settlement, route family, and route-intent tuple; stale or blocked evidence must hold the shell in bounded pending, read-only, or recovery posture instead of quiet confirmation

If consent is revoked after dispatch, create `PharmacyConsentRevocationRecord`, move the active `PharmacyConsentCheckpoint` to `revoked_post_dispatch` and then `withdrawal_reconciliation`, attempt downstream cancellation or withdrawal according to transport mode and provider capability, update patient and staff projections honestly about what was and was not withdrawn, block redispatch and calm referred or resolved copy while the revocation record is unsettled, and keep the case open until downstream state is known enough for policy.

Keep urgent return channels separate. Update Record is not for urgent actions or referrals to general practice, so the pharmacy loop also needs an `UrgentReturnChannelConfig` per tenant, carrying the practice's professional number and dedicated monitored email or equivalent safety-net route. NHS England now explicitly requires practices to maintain that monitored email for pharmacy communications when GP Connect is unavailable or a pharmacy activity is not yet supported. ([NHS England Digital][2])

### Frontend work

Inside the workspace, add a referral confirmation drawer showing:

- selected pharmacy
- referral summary
- pathway or minor illness lane
- transport method
- dispatch-proof posture
- omitted or redacted artifact summary when it changes what will be sent
- patient-facing instructions preview

All patient, staff, and operations surfaces must derive pharmacy dispatch posture from `PharmacyDispatchTruthProjection`, not from raw adapter status or local acknowledgement. Staff views must show separate rows for transport acceptance, provider acceptance, authoritative proof, proof deadline, and current recovery owner so `pending`, `reconcile required`, and `confirmed` remain semantically distinct.

On the patient side, do not show transport jargon. Show only what matters: pharmacy chosen, what happens next, and what the patient should do. Keep one dominant next action, preserve the chosen pharmacy card across consent, dispatch, and pending states, and keep dispatch or acknowledgement drift in the shared status strip unless the user must decide something new. When `PharmacyConsentCheckpoint.checkpointState != satisfied`, the child shell must render through `PatientConsentCheckpointProjection` with the chosen-pharmacy card plus latest safe dispatch summary preserved in place. Transport acceptance, provider acceptance, or mailbox delivery may widen `we're still confirming your referral` guidance, but only `PharmacyDispatchTruthProjection.authoritativeProofState = satisfied` may collapse the shell into calm referred reassurance. The shell may not collapse into calm referred reassurance until `PharmacyContinuityEvidenceProjection` confirms the active consent checkpoint, dispatch settlement, and chosen-pharmacy anchor are still continuity-valid.

### Tests that must pass before moving on

- dispatch idempotency tests
- stale-provider-choice and consent-scope drift rejection tests
- consent-checkpoint expiry, supersession, and in-place renewal recovery tests
- duplicate-dispatch replay tests returning the same `PharmacyDispatchAttempt`
- duplicate provider receipt and out-of-order callback tests collapsing onto the same `PharmacyDispatchAttempt`
- frozen-package hash tests covering provider, consent, policy, and lineage drift
- adapter-binding drift tests proving retries cannot silently change adapter version, artifact class, or capability posture
- artifact-manifest tests covering inclusion, omission, redaction, and transport-specific transform evidence
- adapter transform contract tests
- wrong-provider dispatch prevention tests
- transport-assurance-profile classification tests
- weak or manual transport proof-deadline and gate-blocking tests
- pharmacy dispatch continuity-evidence tests for stale provider, blocked continuity proof, and same-shell pending posture
- `DispatchProofEnvelope` correlation tests covering duplicate acks, stale receipts, and disputed proof
- transport-acceptance versus authoritative-proof distinction tests
- dispatch-confidence and contradiction-threshold tests
- outbound-reference-set hash stability tests proving stale or cross-attempt evidence cannot satisfy the current attempt
- superseded-attempt evidence rejection tests covering stale receipts after redispatch
- manual-assisted-dispatch attestation and dual-review tests
- acknowledgement and retry tests
- post-dispatch consent-revocation tests
- same-shell patient and staff withdrawal-reconciliation projection tests
- patient, pharmacy-console, and operations dispatch-truth projection parity tests
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

Project patient status together with the active canonical `ReachabilityDependency` objects for `pharmacy_contact`, `outcome_confirmation`, and `urgent_return`. If an active dependency is broken, unverified, stale, or disputed, the dominant patient action becomes contact-route repair or support recovery, not a false `completed` or `in progress` reassurance. That patient-facing blocker must come from the current `ReachabilityAssessmentRecord` and `ContactRouteSnapshot`, not from the last dispatch attempt or last-known demographic row.

That blocker must resolve through one same-shell `ContactRouteRepairJourney` bound to the current provider card, referral anchor, and recovery continuation. Pharmacy status, urgent return, and outcome confirmation may not reopen ordinary contact or reassurance posture until the linked verification checkpoint rebounds, the resulting `ReachabilityAssessmentRecord` is `clear` with `routeAuthorityState = current`, and the governing dependency is current again.

An active wrong-patient repair freeze must follow the same shell law. Keep the chosen provider card and referral anchor visible as safe summary provenance, but suppress provider detail, dispatch reassurance, outcome reassurance, and live pharmacy actions until `identityRepairBranchDispositionRef` is `released` or terminal compensation is recorded under the active repair case.

Patient-facing top-level state must use the canonical macro-state mapping from the real-time interaction section in Phase 0. In this phase, the valid top-level macro states are:

- `choose_or_confirm` while the patient still needs to choose or confirm the pharmacy route
- `action_in_progress` while referral dispatch, pharmacy contact, or consultation is in progress
- `reviewing_next_steps` when the pharmacy path has returned work for practice reassessment
- `completed` when the pharmacy outcome is durably settled
- `urgent_action` when urgent return or urgent GP action has preempted routine flow

Pharmacy-specific nuance belongs in the `LiveTimeline`, `ConversationThreadProjection`, and instruction panels, not in a competing top-level state dictionary.

`completed` is legal for pharmacy only when `PharmacyOutcomeTruthProjection.outcomeTruthState = settled_resolved` and no active `PharmacyOutcomeReconciliationGate(blockingClosureState = blocks_close)` remains. Weak-match review, unmatched outcome evidence, no-contact ambiguity, or contradictory outcome truth must render as `reviewing_next_steps` or governed recovery, never as quiet completion.

This public model must match the true underlying referral flow. NHS England's current referral guidance says the practice advises the patient to contact the pharmacy, and the pharmacist may consult by telephone, video, or in person. So the status engine should never imply that the patient has a booked appointment unless a local partner model actually supports that. ([NHS England][1])

Keep this patient view aligned with `patient-account-and-communications-blueprint.md` so pharmacy status and next actions remain consistent with the same patient home used for triage, callback, and booking flows.

That includes identity repair. Pharmacy status pages may not quietly resume because the corrected binding exists somewhere else; they may resume only from `IdentityRepairReleaseSettlement` plus a released pharmacy branch disposition.

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

If contact-route repair is blocking the pharmacy path, keep the chosen provider card and referral context visible, but replace the main CTA with the repair action. Do not strand the patient in a passive status page while pharmacy or practice cannot safely reach them.

If outcome reconciliation is blocking closure, keep the chosen pharmacy card and latest safe summary visible, but switch the main body to an explicit `we're reviewing an update from the pharmacy` posture sourced from `PharmacyOutcomeTruthProjection`; do not show a completed outcome page, routine reassurance, or quiet disappearance of the case from the request shell.

### Tests that must pass before moving on

- status-projection consistency tests
- wrong-patient status access tests
- referral-reference security tests
- reachability-blocker projection tests
- stale-grant rotation and contact-route-repair tests for pharmacy status entry
- pharmacy consent expiry, supersession, and post-dispatch withdrawal-reconciliation shell tests
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

Outcome ingest must be replay-safe. Replayed Update Record messages, duplicated inbox deliveries, or repeated manual captures may not reopen, close, or re-message the same case twice.

Build these outcome ingest sources:

- `gp_workflow_observation`
- `direct_structured_message`
- `email_ingest`
- `manual_structured_capture`

Create these additional control objects:

**OutcomeEvidenceEnvelope**
`outcomeEvidenceEnvelopeId`, `sourceType`, `sourceMessageKey`, `rawPayloadHash`, `semanticPayloadHash`, `replayKey`, `decisionClass = exact_replay | semantic_replay | collision_review | distinct`, `parserVersion`, `receivedAt`, `trustClass`, `correlationRefs`, `dedupeState`

**PharmacyOutcomeIngestAttempt**
`ingestAttemptId`, `outcomeEvidenceEnvelopeRef`, `pharmacyCaseId`, `bestCandidateCaseRef`, `runnerUpCaseRef`, `matchState`, `matchScore`, `runnerUpMatchScore`, `posteriorMatchConfidence`, `contradictionScore`, `classificationState`, `replayState = exact_replay | semantic_replay | collision_review | distinct`, `manualReviewState = none | required | in_review | approved_apply | approved_reopen | approved_unmatched`, `outcomeReconciliationGateRef`, `autoApplyEligible`, `closeEligibilityState = blocked_by_reconciliation | blocked_by_safety | eligible_pending_projection | not_closable`, `settlementState`, `createdAt`, `settledAt`

**PharmacyOutcomeReconciliationGate**
`outcomeReconciliationGateId`, `pharmacyCaseId`, `ingestAttemptRef`, `outcomeEvidenceEnvelopeRef`, `candidateCaseRef`, `runnerUpCaseRef`, `matchScore`, `runnerUpMatchScore`, `posteriorMatchConfidence`, `contradictionScore`, `classificationState`, `gateState = open | in_review | resolved_apply | resolved_reopen | resolved_unmatched | superseded`, `manualReviewState = required | in_review | approved_apply | approved_reopen | approved_unmatched | dismissed`, `blockingClosureState = blocks_close | operational_only`, `patientVisibilityState = review_placeholder | hidden`, `currentOwnerRef`, `resolutionNotesRef`, `openedAt`, `resolvedAt`

**PharmacyOutcomeSettlement**
`settlementId`, `pharmacyCaseId`, `ingestAttemptId`, `consentCheckpointRef`, `outcomeReconciliationGateRef`, `result = resolved_pending_projection | reopened_for_safety | review_required | unmatched | duplicate_ignored`, `matchConfidenceBand = high | medium | low`, `closeEligibilityState = blocked_by_reconciliation | blocked_by_safety | eligible_pending_projection | not_closable`, `receiptTextRef`, `experienceContinuityEvidenceRef`, `causalToken`, `recoveryRouteRef`, `recordedAt`

**PharmacyOutcomeTruthProjection**
`pharmacyOutcomeTruthProjectionId`, `pharmacyCaseId`, `latestOutcomeSettlementRef`, `latestOutcomeRecordRef`, `latestIngestAttemptRef`, `outcomeReconciliationGateRef`, `outcomeTruthState = waiting_for_outcome | review_required | resolved_pending_projection | reopened_for_safety | unmatched | duplicate_ignored | settled_resolved`, `resolutionClass`, `matchConfidenceBand = high | medium | low`, `contradictionScore`, `manualReviewState`, `closeEligibilityState`, `patientVisibilityState = review_placeholder | recovery_required | quiet_result | hidden`, `continuityEvidenceRef`, `audienceMessageRef`, `computedAt`

`PharmacyOutcomeReconciliationGate` is the dedicated weak-match review seam for pharmacy outcomes. It is case-local, blocks closure while open, and is the only authority allowed to convert ambiguous, contradictory, or low-confidence outcome evidence into `resolved_by_pharmacy`, `reopened_for_safety`, or `unmatched`.

`PharmacyOutcomeTruthProjection` is the audience-safe source for patient, pharmacy-console, request-detail, and operations outcome posture. Weak or contradictory outcome evidence may widen review guidance, but it may not produce calm `completed`, `managed`, or `closed` posture until `outcomeTruthState = settled_resolved` and the linked reconciliation gate is absent or resolved.

This follows the current NHS setup. If a practice has Update Record enabled, the community pharmacy consultation summary arrives as a secure digital message in the GPIT workflow; otherwise the pharmacy sends the outcome via email or letter. Update Record can only be sent by registered community pharmacy professionals using assured system combinations, and it only carries the consultation summary, not the urgent return itself. ([NHS England Digital][2])

That means Vecells should support this reconciliation algorithm:

This local reconciliation algorithm must not override the canonical Phase 0 rules. `SafetyOrchestrator` owns any materially meaningful inbound evidence path, and `LifecycleCoordinator` owns any request close decision that follows pharmacy resolution.

1. ingest incoming outcome evidence
2. canonicalize it into immutable `OutcomeEvidenceEnvelope` fields `rawPayloadHash`, `semanticPayloadHash`, and `replayKey`, together with source message key, parser version, trust class, and trusted correlation refs
3. classify replay posture under the canonical Phase 0 model before any case mutation:

   - `exact_replay` when source identifiers or replay key match, semantic payload matches, and no divergent settlement exists
   - `semantic_replay` when semantic payload and governing scope match but raw framing differs
   - `collision_review` when a reused source identifier or trusted correlation chain now carries semantically divergent content
   - `distinct` otherwise
4. if replay posture = `exact_replay` or `semantic_replay`, return `PharmacyOutcomeSettlement.result = duplicate_ignored` and settle back to the prior accepted outcome without creating a second case mutation
5. if replay posture = `collision_review`, persist the envelope and ingest attempt, route to reconciliation review, and stop ordinary auto-apply flow
6. classify source and confidence, and cap `sourceFloor_e` by trust class
7. attempt exact correlation-chain match first using `PharmacyCorrelationRecord`
8. if no exact match exists, only keep candidate open cases `c` that satisfy hard floors:

   - `m_patient(c,e) >= tau_patient_floor`
   - `m_service(c,e) >= tau_service_floor`
   - if outbound dispatch exists, `max(m_provider(c,e), m_transport(c,e)) >= tau_route_floor`
9. for each remaining eligible open case `c`, compute:

   - `m_patient(c,e) in [0,1]` from verified patient identity agreement
   - `m_provider(c,e) in [0,1]` from provider or ODS agreement
   - `m_service(c,e) in [0,1]` from service-type agreement
   - `m_time(c,e) = exp(-abs(minutesBetween(outcomeAt_e, expectedWindowMidpoint_c)) / tau_match_time)`
   - `m_transport(c,e) in [0,1]` from dispatch, message, or Update Record transport evidence
   - `m_contra(c,e) in [0,1]` from conflicting patient, provider, service, or timing evidence
   - `rawMatch(c,e) = product_k max(epsilon, m_k(c,e))^{omega_k}`, with `sum omega_k = 1`
   - `matchScore(c,e) = sourceFloor_e * rawMatch(c,e) * (1 - m_contra(c,e))^{lambda_match_contra}`
10. if no eligible open case exists, create a `PharmacyOutcomeIngestAttempt` in unmatched posture, route to `unmatched`, and stop
11. let `c_star = argmax_c matchScore(c,e)` and let `c_2` be the runner-up case, or a null candidate with `matchScore(c_2,e) = 0`
12. compute `posterior(c | e) = exp(kappa_match * matchScore(c,e)) / sum_{c'} exp(kappa_match * matchScore(c',e))`
13. create one `PharmacyOutcomeIngestAttempt` for the evidence envelope and current best-match posture, persisting `bestCandidateCaseRef`, `runnerUpCaseRef`, `runnerUpMatchScore`, and the current `closeEligibilityState`; repeated parser retries or operator replays may settle back into the same attempt only when replay posture is `exact_replay` or `semantic_replay`
14. if `matchScore(c_star,e) < tau_strong_match`, `posterior(c_star | e) < tau_posterior_strong`, `matchScore(c_star,e) - matchScore(c_2,e) < delta_match`, or `m_contra(c_star,e) > tau_contra_apply`, create or refresh one `PharmacyOutcomeReconciliationGate(blockingClosureState = blocks_close)`, bind it to the ingest attempt and case, set `PharmacyCase.status = outcome_reconciliation_pending`, add the gate to lineage closure blockers, return `PharmacyOutcomeSettlement.result = review_required`, refresh `PharmacyOutcomeTruthProjection(outcomeTruthState = review_required)`, and stop ordinary auto-apply flow
15. classify outcome as `advice_only`, `medicine_supplied`, `resolved_no_supply`, `onward_referral`, `urgent_gp_action`, `unable_to_contact`, `pharmacy_unable_to_complete`, or `unmatched`
16. auto-close is allowed only when the outcome is from a trusted source, replay posture is `distinct`, `matchScore(c_star,e)` plus `posterior(c_star | e)` meet the strong thresholds recorded in policy, `m_contra(c_star,e) <= tau_contra_apply`, no active `PharmacyOutcomeReconciliationGate(blockingClosureState = blocks_close)` remains, the active `PharmacyConsentCheckpoint` is not in `revoked_post_dispatch` or `withdrawal_reconciliation`, and no unresolved confirmation, revocation, or safety blocker remains
17. `email_ingest` and `manual_structured_capture` may update the case automatically only up to `outcome_reconciliation_pending` unless a human resolves the current `PharmacyOutcomeReconciliationGate` for apply, reopen, or unmatched disposition, or the message contains a trustworthy correlation chain accepted by policy
18. before any pharmacy outcome advances workflow, settle one canonical `EvidenceAssimilationRecord` and one `MaterialDeltaAssessment` for the matched outcome evidence and current lineage state
19. if the classification is `advice_only`, `medicine_supplied`, or `resolved_no_supply`, the trusted strong-match thresholds are met, there is no active revocation reconciliation, `MaterialDeltaAssessment.triggerDecision = no_re_safety`, and any current `PharmacyOutcomeReconciliationGate` is absent or resolved as `resolved_apply`, set the case to `resolved_by_pharmacy`, update practice and patient views through `PharmacyOutcomeTruthProjection(outcomeTruthState = resolved_pending_projection | settled_resolved)` only after projections converge, emit the pharmacy-outcome milestone so `LifecycleCoordinator` may derive `Request.workflowState = outcome_recorded`, return `PharmacyOutcomeSettlement.result = resolved_pending_projection` with the current `consentCheckpointRef`, and ask `LifecycleCoordinator` to evaluate closure after required communications, revocation checks, reconciliation-block clearance, and projections are durably committed
20. if the classification is `onward_referral`, `pharmacy_unable_to_complete`, `urgent_gp_action`, or `unable_to_contact`, if the active gate resolves as `resolved_reopen`, or if `MaterialDeltaAssessment.triggerDecision = re_safety_required | blocked_manual_review`, append `EvidenceClassificationDecision` under the canonical four-class model, create `SafetyPreemptionRecord` because the outcome is at least `contact_safety_relevant` and often `potentially_clinical`, append `SafetyDecisionRecord`, reacquire triage ownership, let `LifecycleCoordinator` derive `Request.workflowState = triage_active` from that reopened lease, return `PharmacyOutcomeSettlement.result = reopened_for_safety`, and route to the appropriate bounce-back or reopen path; urgent return, no-contact, and bounce-back branches may not be inferred onto a weakly matched lineage until the gate is manually resolved
21. if `unmatched`, or if the active gate resolves as `resolved_unmatched`, raise exception queue item, return `PharmacyOutcomeSettlement.result = unmatched`, and do not close anything
22. no absence of Update Record, no absence of email, and no elapsed timer may be interpreted as proof of completion
23. patient or practice outcome calmness may advance only while the current `PharmacyOutcomeTruthProjection.outcomeTruthState = settled_resolved`, the linked reconciliation gate is absent or resolved, and the current `PharmacyContinuityEvidenceProjection` validates the same consent checkpoint, outcome settlement, and route family; stale or blocked continuity evidence must keep the case in bounded recovery or review posture instead of quiet resolution
24. weak-match review may not reuse bounce-back, `resolved_by_pharmacy`, `managed`, or `closed` copy by projection accident; until the current reconciliation gate resolves, patient surfaces render a bounded review placeholder, staff surfaces render explicit close blockers, and operations surfaces count the case as open reconciliation debt

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
- active reconciliation gate and current closure-block posture
- local exception state on the affected outcome card plus promoted evidence review when the outcome could not be matched cleanly

This panel should render as the `assurance` child state of the same pharmacy shell rather than as a detached detail page. Matched evidence, confidence, close eligibility, reconciliation-gate owner, reopen actions, and clarification actions must share one `DecisionDock` so the pharmacist never has to hunt across multiple panes for the authoritative next step.

### Tests that must pass before moving on

- structured-summary parsing tests
- Update Record observed-path tests
- email-ingest and structured manual-capture tests
- exact-replay and semantic-replay outcome dedupe tests returning `duplicate_ignored`
- collision-review outcome tests proving reused source identifiers with divergent semantics cannot auto-apply
- duplicate outcome dedupe tests
- unmatched-outcome exception tests
- supplier-specific normalization tests
- confidence-threshold close-versus-review tests
- posterior-match confidence, hard-floor, and contradiction-threshold tests
- reconciliation-gate persistence and closure-block tests
- no-patient-or-practice-calmness-while-outcome-gate-open tests
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

1. ingest urgent or unresolved pharmacy return and normalize it into typed bounce-back evidence
2. create `PharmacyBounceBackRecord` with `urgencyCarryFloor` derived from the bounce-back type, latest safety classification, and elapsed time since the pharmacy first declared inability to complete
3. compute and persist on `PharmacyBounceBackRecord` for the inbound bounce-back `b` on lineage `l`:

   - `u_urgent(b) in {0,1}` from `urgent_gp_return` or `safeguarding_concern`
   - `u_unable(b) in {0,1}` from `pharmacy_unable_to_complete` or `referral_expired` where clinical work remains outstanding
   - `u_contact(b) in [0,1]` from `patient_not_contactable` severity plus contact-route trust failure
   - `u_decline(b) in [0,1]` from `patient_declined` where alternative endpointing is required
   - `delta_j(b,l) in [0,1]` for new clinical, contact, provider, consent, or timing information relative to the last settled pharmacy state
   - `materialChange(b,l) = 1 - product_j (1 - nu_j * delta_j(b,l))`, with `sum nu_j = 1`
   - `loopRisk(b,l) = min(bounceCount_l / B_loop, 1) * (1 - materialChange(b,l))`
   - `reopenSignal(b,l) = max(u_urgent(b), u_unable(b), u_contact(b), u_decline(b))`
   - `reopenPriorityBand = max(originPriorityBand_l, 3 * 1[u_urgent(b) = 1], 2 * 1[max(u_unable(b), u_contact(b)) >= tau_reopen_secondary], 1 * 1[loopRisk(b,l) >= tau_loop])`
4. if `u_urgent(b) = 1`, set `PharmacyCase.status = urgent_bounce_back`
5. else if `u_contact(b) >= tau_contact_return`, set `PharmacyCase.status = no_contact_return_pending`
6. else set `PharmacyCase.status = unresolved_returned`
7. reopen original request or create duty task according to `reopenPriorityBand` and urgency policy
8. attach pharmacy evidence bundle
9. create or refresh the relevant urgent-return or outcome-confirmation `ReachabilityDependency`, and rotate any stale patient-entry grants if the bound contact route is no longer trustworthy
10. reacquire the triage-side lease so `LifecycleCoordinator` may derive `Request.workflowState = triage_active`
11. upgrade priority and timing by setting reopened triage `urgencyCarry <- max(existingUrgencyCarry, urgencyCarryFloor)` and by applying `reopenPriorityBand` before the task re-enters canonical queue ranking
12. notify patient of next step
13. if `loopRisk(b,l) >= tau_loop`, escalate to supervisor review and block automatic redispatch or automatic close until review completes
14. block auto-close until the reopened case is explicitly resolved

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
- reopen-priority and loop-risk supervisor-escalation tests
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

`pharmacy_waiting_for_choice_projection` must surface the current `PharmacyChoiceTruthProjection` summary, including visible-choice count, recommended frontier summary, warned-choice summary, and stale-proof posture, so practice staff do not invent local ranking or hide valid providers while assisting the patient.

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
- reachability repair required
- consent revoked after dispatch
- dispatch proof stale

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

When a pharmacist opens a case from this panel, the queue row must morph into the Pharmacy Console mission frame from `pharmacy-console-frontend-architecture.md`, not a generic admin detail page. Default posture should be queue spine plus validation board, with the persistent checkpoint rail, one expanded medication card, and one sticky `DecisionDock` visible before any compare or handoff promotion. Inventory comparison, substitution, and partial-supply work must open as a same-shell promoted support region bound to the active line item rather than as a detached inventory page, and release must move into the same-shell `HandoffReadinessBoard` with provisional settlement visibility until `PharmacyDispatchSettlement` converges.

Design-wise, keep it dense but elegant: strong hierarchy, quiet colours, tabular numerics, one glance to understand what needs attention, and no page split between validation, compare, and handoff work.

### Tests that must pass before moving on

- projection correctness tests
- dispatch-exception queue tests
- unmatched-outcome queue tests
- provider-health alert tests
- reachability-repair queue tests
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
- pharmacy-contact reachability failure rate
- urgent-return reachability repair latency

Add alerts for:

- sudden drop in dispatch confirmations
- pharmacy discovery returning zero providers unexpectedly
- outcome backlog above threshold
- urgent returns not acknowledged
- unmatched outcome spike
- bounce-back spike for a specific pathway or provider
- pharmacy-contact route failures above threshold
- overdue degraded-dispatch proof deadlines

This phase also needs explicit clinical safety coverage. Compliance with DCB0129 and DCB0160 remains mandatory, and if a BaRS adapter is used the onboarding material explicitly expects a hazard log and clinical safety case report aligned with DCB0129. ([NHS England Digital][6])

The hazard set for this release should explicitly include:

- ineligible patient referred down a Pharmacy First pathway
- wrong pathway or wrong pharmacy chosen
- patient denied full provider choice
- stale or superseded pharmacy consent treated as still valid
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
- degraded transport confirmation-gate behaviour proven
- outcome reconciliation proven across structured and fallback channels
- urgent return and reopen paths proven
- reachability blocker and repair paths proven
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

Before enabling Slice 6.3, run the consent backfill that materializes `PharmacyConsentCheckpoint` and `PharmacyConsentRevocationRecord` for every open pharmacy case. Any case that cannot be reconstructed into one unambiguous satisfied checkpoint must downgrade to `consent_pending` until a fresh consent capture settles.

**Slice 6.4**  
Outcome ingest and structured case closure.

**Slice 6.5**  
Bounce-back, urgent return, and reopened practice workflow.

## System after Phase 6

After this phase, Vecells can take a pharmacy-appropriate triage decision, run a real Pharmacy First gateway, let the patient choose from valid pharmacy providers, bind referral consent to one authoritative provider- and scope-aware checkpoint, dispatch a structured referral only while that checkpoint remains satisfied, track the consultation loop, reconcile outcomes from GP workflow or agreed message channels, and reopen the original case when the pharmacy cannot safely complete it. That is the closed-loop pharmacy behaviour the architecture and journey diagrams are aiming for, while staying aligned with the current NHS rules around patient choice, transport, and Update Record boundaries. ([NHS England][1])

[1]: https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/ "https://www.england.nhs.uk/primary-care/pharmacy/community-pharmacy-contractual-framework/referring-minor-illness-patients-to-a-community-pharmacist/"
[2]: https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record "https://digital.nhs.uk/services/gp-connect/gp-connect-in-your-organisation/gp-connect-update-record"
[3]: https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/ "https://www.england.nhs.uk/long-read/changes-to-the-gp-contract-in-2026-27/"
[4]: https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/ "https://www.england.nhs.uk/publication/community-pharmacy-advanced-service-specification-nhs-pharmacy-first-service/"
[5]: https://digital.nhs.uk/developer/api-catalogue/electronic-transmission-of-prescriptions-web-services-soap/migrating-from-the-etp-web-services-soap-api-to-the-service-search-api "https://digital.nhs.uk/developer/api-catalogue/electronic-transmission-of-prescriptions-web-services-soap/migrating-from-the-etp-web-services-soap-api-to-the-service-search-api"
[6]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards "https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards"
