# Phase 8 - The Assistive Layer

**Working scope**  
Documentation automation and AI-assisted workflow.

This is the phase where Vecells adds the assistive layer the architecture already points to: Documentation Automation, Clinical Intelligence, a shared Feature Store, and a staff review flow that already shows AI suggestions while keeping a human approval gate around irreversible actions. In other words, this phase does not bolt AI onto the side of the product. It activates a capability the core architecture already reserves, on top of the same request model, event model, workspace, and audit spine.

The closest official NHS operational guidance for this kind of feature set is the current guidance on AI-enabled ambient scribing and documentation support. That guidance says users should review and approve outputs before further actions, output accuracy should be checked through ongoing audits, organisations should monitor bias and safety risks, and human oversight, training, and clear governance all need to be in place. DTAC also still applies across its five core areas, while DCB0129 and DCB0160 remain mandatory clinical safety standards. ([NHS England][1])

There is also a very important integration and assurance boundary here. Current IM1 guidance says AI-containing products go through a review of the whole product documentation during pairing, including DCB0129 safety documentation, DPIA, and medical device registration where applicable, but that IM1 does not perform AI-specific technical assurance of the model itself. The same guidance says that if an assured IM1 product evolves materially, especially through AI or other significant functional enhancement, suppliers must raise a formal RFC with updated SCAL and associated documentation. ([NHS England Digital][2])

There is also a regulatory design implication. Current NHS guidance on ambient scribing says plain transcription that can be easily verified by qualified users is likely not a medical device, but that generative AI used for further processing such as summarisation is treated as higher functionality and is likely to fall into medical-device territory. NHS guidance also says software products with a medical purpose for individual patients may qualify as a medical device, and MHRA regulates devices on the GB market. As an engineering inference, that means Vecells must split documentation assistance from clinical decision support from day one and must freeze intended-use wording before visible rollout. ([NHS England][1])

## Phase 8 objective

By the end of this phase, Vecells must be able to do all of the following safely:

- transcribe and structure supported audio and text artifacts
- generate reviewable note drafts, summaries, and message drafts
- suggest question sets, risk signals, and endpoint candidates to staff
- attach evidence traces and confidence metadata to every assistive output
- capture clinician edits, approvals, and rejections as structured feedback
- run shadow mode, gated visible mode, and rollback mode without changing the core workflow
- keep the final human decision as the only authoritative output that can close tasks, create bookings, escalate risk, or write back into operational records

## Overall Phase 8 algorithm

1. Freeze intended use per assistive capability.
2. Build a replayable evaluation corpus from prior reviewed cases.
3. Run transcription and draft-generation in shadow mode first.
4. Promote documentation drafting to visible staff assistance.
5. Add structured extraction and question suggestions.
6. Add endpoint suggestions only after thresholds are met.
7. Capture every override and approval as feedback and audit evidence.
8. Run drift, fairness, and safety monitoring continuously.
9. Control every material model or prompt change through formal change management.

## What Phase 8 must prove before Phase 9 starts

Before moving into the assurance-led phase, all of this needs to be true:

- assistive outputs are useful, bounded, and non-autonomous
- every model output is attributable to a model version, prompt version, and evidence snapshot
- the workspace stays faster and clearer, not noisier
- human approval is technically enforced, not policy-only
- documentation quality improves without hidden safety regressions
- endpoint suggestion never bypasses rule-based hard stops
- monitoring can detect drift, bias, and unsafe failure modes early
- rollout and rollback are operationally routine, not bespoke heroics

## Phase 8 implementation rules

**Rule 1: assistive, not autonomous.**  
The product may draft, suggest, rank, and highlight, but it must not directly commit final clinical actions. That is fully aligned with the staff flow and with current NHS guidance that users should review and approve AI outputs before further actions. ([NHS England][1])

**Rule 2: intended use must be frozen before visible rollout.**  
Do not treat AI as one capability. Split it into clear capability families: transcription, documentation draft, structured extraction, question suggestion, endpoint suggestion. The current NHS guidance on ambient scribing specifically warns that generative AI processing can introduce new functions and that safeguards are needed to keep outputs inside intended use. ([NHS England][1])

**Rule 3: shadow first, visible later.**  
No capability should appear in the clinical workspace until it has run long enough in shadow mode against real workflow data and shown acceptable performance on a protected evaluation set.

**Rule 4: evidence-bearing outputs only.**  
Do not ship a vague chatbot into the workspace. Every suggestion should be typed, bounded, and traceable to source evidence spans, structured facts, or explicit abstention.

**Rule 5: human edits are the product truth.**  
The final signed-off note, endpoint, or message is the human-authored artifact, even if 95% started from a model draft.

**Rule 6: the UI must feel like a premium copilot, not a distraction.**  
Quiet side panels, high-signal diffs, crisp hierarchy, minimal clutter, no novelty UI, no pop-up spam.

---

## 8A. Assistive capability contract, intended-use boundaries, and policy envelope

This sub-phase defines exactly what the assistive layer is allowed to do.

The architecture already separates Documentation Automation from Clinical Intelligence, and the runtime flow already shows AI suggestions inside staff review rather than at the patient edge. That is the right boundary to keep. Current NHS guidance also makes intended-use discipline essential: generative AI can introduce unintended functionality, suppliers need safeguards to keep outputs within intended use, and higher-function processing like summarisation can shift regulatory posture. ([NHS England][1])

### Backend work

Create an `AssistiveCapabilityManifest` as the top-level contract.

Suggested objects:

**AssistiveCapabilityManifest**  
`manifestId`, `capabilityCode`, `intendedUseProfileRef`, `allowedContexts`, `allowedInputs`, `allowedOutputs`, `shadowModeDefault`, `visibleModeDefault`, `approvalRequirement`, `medicalDeviceAssessmentRef`, `releaseCohortRef`

**IntendedUseProfile**  
`profileId`, `clinicalPurpose`, `nonClinicalPurpose`, `medicalPurposeState`, `permittedUserRoles`, `forbiddenActions`, `evidenceRequirement`, `humanReviewRequirement`

**ModelPolicy**  
`policyId`, `modelRegistryRef`, `promptSurfaceRef`, `outputSchemaRef`, `abstentionPolicyRef`, `loggingPolicyRef`, `retentionPolicyRef`, `replayEvidencePolicyRef`

**ReplayEvidencePolicy**  
`policyId`, `inputSnapshotRetentionClassRef`, `outputArtifactRetentionClassRef`, `decisionLinkageRequirement`, `archiveOnlyWhenReferenced`

**NoAutoWritePolicy**  
`policyId`, `blockedCommands`, `blockedTransitions`, `writebackTargets`, `overrideMode`

**AssistiveReleaseState**  
`releaseStateId`, `capabilityCode`, `tenantId`, `cohortId`, `mode`, `effectiveFrom`, `effectiveTo`

Split the assistive layer into capability families:

- `transcription`
- `documentation_draft`
- `structured_fact_extraction`
- `question_set_suggestion`
- `endpoint_suggestion`
- `message_draft`
- `pharmacy_or_booking_handoff_draft`

Then define allowed outputs for each. Example:

- transcription may create `TranscriptArtifact`
- documentation_draft may create `DraftNoteArtifact`
- endpoint_suggestion may only create `SuggestionEnvelope`
- none of them may create `EndpointDecision`, `AppointmentRecord`, `PharmacyCase`, or `TaskClosure` directly

Any assistive output shown in live workflow must be materialized as an immutable artifact linked to model version, prompt version, input evidence snapshot, output schema version, and any post-processing version used. If that artifact contributes to a patient-specific decision, release decision, or assurance pack, it becomes replay-critical evidence and may be archived but not deleted by ordinary retention jobs.

Implement a capability gate that is evaluated on every assistive invocation:

1. resolve route and workflow context
2. resolve user role and acting context
3. resolve capability manifest
4. enforce intended-use policy
5. enforce release cohort
6. create assistive run only if all conditions pass

### Frontend work

Build the workspace plumbing for capability-specific assistive surfaces before any model output is shown.

Add:

- capability badges in the workspace
- assistant unavailable state
- shadow-only indicator for internal users
- capability-specific reveal rules
- compact provenance footer on every assistive artifact

Do not show a general AI panel with random capability mixing. The UI should reveal only what the current route and role permit.

### Tests that must pass before moving on

- capability-gate tests by role and route
- blocked-write tests
- release-cohort tests
- provenance-footer integrity tests
- replay-linkage tests proving every visible assistive artifact is tied to immutable input and output evidence

### Exit state

The assistive layer now has hard intended-use boundaries and replay-critical evidence contracts before any live visible rollout.

## 8B. Evaluation corpus, label store, replay harness, and shadow dataset

This sub-phase creates the evidence base that decides whether assistive outputs are good enough to show.

Current NHS guidance says organisations should audit output accuracy, monitor performance over time, and collect their own monitoring evidence rather than relying only on the manufacturer’s claims. It also says deploying organisations remain responsible for local assurance, because IM1 does not perform AI-specific technical assurance. ([NHS England][1])

### Backend work

Create a dedicated evaluation plane separate from the live transactional system.

Suggested objects:

**CaseReplayBundle**  
`replayBundleId`, `requestRef`, `taskRef`, `evidenceSnapshotRefs`, `expectedOutputsRef`, `sensitivityTag`, `datasetPartition`

**GroundTruthLabel**  
`labelId`, `replayBundleId`, `labelType`, `labelValue`, `annotatorRef`, `adjudicationState`, `createdAt`

**ErrorTaxonomyRecord**  
`errorId`, `replayBundleId`, `capabilityCode`, `errorClass`, `severity`, `sourceStage`, `reviewOutcome`

**PromptTemplateVersion**  
`templateVersionId`, `capabilityCode`, `promptBundleHash`, `schemaVersion`, `effectiveFrom`, `retiredAt`

**ModelRegistryEntry**  
`modelVersionId`, `provider`, `modelName`, `deploymentRegion`, `runtimeConfigHash`, `approvedUseProfiles`

**FeatureSnapshot**  
`featureSnapshotId`, `requestRef`, `taskRef`, `featureVectorRef`, `snapshotTimestamp`, `generationVersion`

Build three dataset partitions:

- gold set for hard regression and release gates
- shadow live set from current real cases, not shown to users
- feedback set built from clinician-reviewed visible use after release

The replay harness should rebuild the exact context an assistive run would see:

1. load request history
2. rebuild review bundle
3. rebuild evidence snapshot
4. inject feature snapshot
5. run the assistive pipeline deterministically against a pinned model and prompt
6. compare output to adjudicated labels

Do not let training, thresholding, and evaluation share the same uncontrolled data path. Keep the gold set protected and versioned.

### Frontend work

Build an internal-only annotation and replay workbench for clinical reviewers and product safety leads.

It should support:

- side-by-side replay vs human truth
- structured labeling
- severity tagging
- adjudication workflow
- evidence-span inspection
- export of release-gate summary

This tool can be ugly at first, but it must be accurate and fast.

### Tests that must pass before moving on

- replay determinism tests
- protected-gold-set isolation tests
- label-consistency and adjudication tests
- model-version pinning tests
- prompt-template immutability tests
- dataset lineage audit tests

### Exit state

You now have a real evaluation system rather than a loose collection of demos and screenshots.

---

## 8C. Audio, transcript, and artifact normalization pipeline

This sub-phase builds the input layer for documentation assistance.

Current NHS guidance on ambient and assistive documentation says organisations need to be clear about audio capture mode, whether recording starts manually, the legal basis for using and retaining data, whether patient consent is needed, how long audio and transcripts are retained, and how practitioners obtain permission from patients when required. The same guidance also warns that performance may vary with accents, dialects, English as a second language, and speech impairments. ([NHS England][1])

### Backend work

Scope the first release of audio support carefully.

Recommended input order:

1. telephony recordings already captured in earlier phases
2. uploaded audio artifacts
3. clinician dictation clips
4. optional live ambient capture only behind tenant policy and explicit approval

Create these objects:

**AudioCaptureSession**  
`audioCaptureSessionId`, `sourceType`, `captureMode`, `permissionState`, `retentionPolicyRef`, `startedAt`, `endedAt`, `artifactRef`

**TranscriptJob**  
`transcriptJobId`, `audioArtifactRef`, `diarisationMode`, `languageMode`, `status`, `modelVersionRef`, `outputRef`, `errorRef`

**TranscriptArtifact**  
`transcriptArtifactId`, `rawTranscriptRef`, `speakerSegmentsRef`, `confidenceSummary`, `clinicalConceptRefs`, `redactionRefs`

**SpeakerSegment**  
`segmentId`, `speakerLabel`, `startMs`, `endMs`, `textRef`, `confidence`

**ClinicalConceptSpan**  
`conceptSpanId`, `sourceSegmentRef`, `conceptType`, `value`, `confidence`, `normalizationRef`

**RetentionEnvelope**  
`retentionEnvelopeId`, `artifactType`, `retentionBasis`, `deleteAfter`, `reviewSchedule`

Use this pipeline:

1. validate source and permission state
2. quarantine the artifact
3. run transcription and diarisation
4. attach confidence and speaker segments
5. run clinical term extraction and redaction span marking
6. persist transcript artifact
7. emit assistive-ready event for downstream drafting

Add a hard policy gate for ambient capture. If that mode is ever enabled, start with manual-start recording, explicit local governance, and clear permission language.

### Frontend work

Add a transcript viewer inside the Clinical Workspace with:

- audio scrubber
- speaker-separated transcript
- highlighted low-confidence spans
- correction mode
- use-in-note-draft action
- hidden states when transcription is not allowed for that context

For dictation capture, keep the UI restrained. One record control, one review control, one save control. No gimmicks.

### Tests that must pass before moving on

- noisy-audio and low-quality-phone tests
- accent and dialect evaluation slices
- speaker-segmentation tests
- retention and deletion tests
- permission-state enforcement tests
- transcript-correction tests
- PHI redaction tests in logs and telemetry

### Exit state

Vecells can now turn supported audio and text artifacts into governed transcript inputs for the assistive layer.

---

## 8D. Summary, note draft, and structured documentation composer

This sub-phase produces the first visible assistive artifacts.

The architecture already names Documentation Automation and specifically calls out transcription, note automation, and human approval gates. The current NHS guidance for documentation assistance also says users must review and approve outputs before further action and should continue to revise outputs as needed. ([NHS England][1])

### Backend work

Create a structured documentation composer instead of one free-form text generator.

Suggested objects:

**DocumentationContextSnapshot**  
`contextSnapshotId`, `requestRef`, `taskRef`, `reviewBundleRef`, `transcriptRefs`, `attachmentRefs`, `historyRefs`, `templateRef`

**DraftNoteArtifact**  
`draftNoteId`, `contextSnapshotId`, `sectionRefs`, `overallConfidence`, `evidenceMapRef`, `draftState`

**DraftSection**  
`sectionId`, `sectionType`, `generatedTextRef`, `evidenceSpanRefs`, `missingInfoFlags`, `confidence`

**MessageDraftArtifact**  
`messageDraftId`, `contextSnapshotId`, `messageType`, `bodyRef`, `evidenceMapRef`, `reviewState`

**EvidenceMap**  
`evidenceMapId`, `outputSpanRef`, `sourceEvidenceRefs`, `supportStrength`

**ContradictionCheckResult**  
`checkResultId`, `artifactRef`, `contradictionFlags`, `unsupportedAssertionFlags`, `templateConformanceState`

Use this algorithm:

1. build `DocumentationContextSnapshot`
2. select an approved template for the current workflow
3. generate sectioned draft outputs
4. attach evidence spans to each section
5. run contradiction and unsupported-assertion checks
6. downgrade confidence or abstain if support is weak
7. publish the draft artifact to the workspace

Start with a narrow set of draft types:

- triage summary
- clinician note draft
- patient message draft
- callback summary
- pharmacy or booking handoff summary

Do not auto-generate coded outcomes in this first visible release.

### Frontend work

This is one of the main visible staff experiences of the phase, so it needs to feel exceptional.

Build a draft composer rail with:

- diffable note preview
- section-by-section accept or reject
- evidence highlight on hover
- needs-more-evidence warning state
- template switcher where policy allows
- full edit history and clinician ownership banner

The design should be premium and quiet. The note draft is not the main screen; it is a disciplined assistant rail attached to the main review canvas.

### Tests that must pass before moving on

- hallucination and unsupported-assertion tests
- section-evidence alignment tests
- contradiction-detection tests
- template-rendering tests
- edit-distance measurement against clinician truth
- latency tests inside real workspace flows
- visual regression tests on the composer panel

### Exit state

The product can now generate reviewable drafts that feel useful and controlled rather than magical and risky.

---

## 8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator

This sub-phase extends the assistive layer from documentation help into bounded decision support.

The architecture already frames Clinical Intelligence as intent classification, acuity scoring, risk NLP, and complexity scoring, with output in the shape of `Task + ServiceRequest + priority band + endpoint recommendation`. The practice flow also already depicts AI suggestions on the review screen before a human selects the best endpoint.

### Backend work

Create a bounded inference orchestrator rather than a monolithic model call.

Suggested objects:

**SuggestionEnvelope**  
`suggestionEnvelopeId`, `contextSnapshotId`, `capabilityCode`, `priorityBandSuggestion`, `riskSignalRefs`, `endpointHypotheses`, `questionRecommendations`, `confidenceDescriptor`, `abstentionState`, `calibrationVersion`, `riskMatrixVersion`

**RiskSignal**  
`riskSignalId`, `signalType`, `severity`, `supportingEvidenceRefs`, `confidence`, `ruleGuardState`, `evidenceCoverage`

**EndpointHypothesis**  
`hypothesisId`, `endpointCode`, `rankingPosition`, `rationaleRef`, `supportingEvidenceRefs`, `confidence`, `expectedRisk`, `evidenceCoverage`, `marginToRunnerUp`

**QuestionSetRecommendation**  
`recommendationId`, `questionSetRef`, `triggerReason`, `confidence`, `evidenceRefs`, `evidenceCoverage`

**AbstentionRecord**  
`abstentionId`, `capabilityCode`, `reasonCode`, `contextSnapshotId`

**RuleGuardResult**  
`guardResultId`, `hardStopTriggered`, `conflictFlags`, `allowedSuggestionSet`

Use a multi-stage pipeline:

1. extract structured facts from the review bundle
2. run rule-based hard guards first
3. run assistive models only inside the allowed space
4. calibrate model outputs before they are shown as confidence
5. generate typed hypotheses, not direct actions
6. compute evidence coverage and expected decision risk for each surfaced hypothesis
7. abstain when evidence is weak, conflicting, or risk remains too high
8. publish suggestions to the workspace without mutating the task state

Do not let `confidence` be an uncalibrated model logit. For capability `c`, context `x`, and allowed hypothesis `h`, compute:

- raw model logits `ell_raw(y | x, c)`
- guard-masked logits `ell_guard(y | x, c) = ell_raw(y | x, c)` when `y` is allowed by `RuleGuardResult`, otherwise `-infinity`
- calibrated allowed-set probabilities `p_cal(. | x, c) = Cal_c(ell_guard(. | x, c))`, where `Cal_c` is a versioned vector calibration operator over the allowed hypothesis set, such as temperature scaling on logits or Dirichlet or classwise isotonic calibration, and always renormalizes after masking
- evidence coverage `coverage(h,x) = supportedEvidenceWeight(h,x) / max(1e-6, requiredEvidenceWeight(h,x))` clipped to `[0,1]`
- expected risk `R(h | x) = sum_y L_c(h, y) * p_cal(y | x, c)` using a capability-specific loss matrix `L_c` that penalizes false reassurance and unsafe downgrades more heavily than over-triage
- decision margin `margin(h,x) = p_cal(h | x, c) - p_cal(h_2 | x, c)` against the next-best allowed hypothesis

Only surface `h` when all of the following hold:

- `h` survives the rule guard mask
- `coverage(h,x) >= c_min`
- `R(h | x) <= theta_capability`
- `margin(h,x) >= m_min`

Otherwise abstain.

`confidenceDescriptor` should therefore be a binned view of calibrated probability, evidence coverage, and margin rather than raw model score.

If a capability lacks a validated calibration set, it may remain in shadow or off, but it may not present raw uncalibrated confidence as patient- or clinician-facing assurance.

The critical boundary is this: the orchestrator may suggest an endpoint, but it may never create the `EndpointDecision` record itself.

### Frontend work

Build a suggestion side panel with:

- endpoint chips ranked by confidence
- risk signals grouped by severity
- questions-to-ask-next recommendations
- why-this-suggestion explainer
- abstain state when no safe suggestion exists
- one-click insert into the decision form as a draft, not a commit

This UI should feel precise, not chatty. Use concise chips, short rationale lines, and evidence popovers. No chatbot transcript.

### Tests that must pass before moving on

- red-flag miss regression tests
- endpoint ranking quality tests
- confidence-calibration tests
- abstention-behaviour tests
- prompt-injection and adversarial-input tests
- no-state-mutation tests
- stale-context invalidation tests

### Exit state

The system can now surface bounded clinical suggestions while still forcing the human to choose and approve the actual outcome.

---

## 8F. Human-in-the-loop workspace integration, override capture, and feedback loop

This sub-phase makes the assistive layer operational in the real workspace.

Current NHS guidance is explicit here: users should review and approve outputs before further actions, practitioners retain responsibility to review and revise the outputs, and user training needs to reinforce that continuing responsibility. ([NHS England][1])

### Backend work

Create a first-class `AssistiveSession` attached to each workspace review.

Suggested objects:

**AssistiveSession**  
`assistiveSessionId`, `taskRef`, `contextSnapshotId`, `visibleArtifacts`, `openedBy`, `openedAt`, `sessionState`

**SuggestionActionRecord**  
`actionRecordId`, `assistiveSessionId`, `artifactRef`, `actionType`, `sectionRef`, `actorRef`, `timestamp`

**OverrideRecord**  
`overrideRecordId`, `assistiveSessionId`, `capabilityCode`, `modelOutputRef`, `humanOutputRef`, `overrideReasonCode`, `freeTextRef`

**FinalHumanArtifact**  
`finalArtifactId`, `taskRef`, `artifactType`, `contentRef`, `approvedBy`, `approvedAt`, `sourceAssistiveRefs`

**FeedbackEligibilityFlag**  
`feedbackFlagId`, `overrideRecordId`, `eligibleForTraining`, `exclusionReason`

Use this interaction algorithm:

1. workspace opens task
2. assistive session binds to the current evidence snapshot
3. staff sees draft and suggestion artifacts
4. staff accepts, edits, rejects, or ignores outputs
5. only the final human artifact can be committed to the workflow
6. override records and final artifacts are persisted for audit and later evaluation
7. if new patient evidence arrives, invalidate stale assistive outputs and require regeneration

### Frontend work

This is where the UI must feel like a premium professional copilot.

Use a right-hand assistant rail inside the existing Clinical Workspace with:

- concise summary block
- draft note sections
- suggestion chips
- confidence and evidence affordances
- accept section, edit section, and reject section actions
- edited-by-clinician trail
- override-reason capture only when it adds value, not everywhere

Strong design rule: do not cover the core case information. The assistant rail should complement the review canvas, not fight it.

Apply the canonical real-time interaction rules here as well: the assistant rail must be supplementary, not layout-destabilizing. New assistive outputs or invalidation due to fresh evidence should patch in place, buffer when the clinician is actively typing, and never displace the primary review canvas without user intent.

Also add keyboard-first flows for power users:

- accept section
- jump to evidence
- insert draft into note
- dismiss suggestion
- regenerate when allowed

### Tests that must pass before moving on

- stale-output invalidation tests
- concurrent-edit consistency tests
- audit completeness tests for accepts, edits, and rejects
- section-accept fidelity tests
- final-human-artifact writeback tests
- keyboard-only workspace tests
- accessibility tests on dense assistive UI

### Exit state

The assistive layer is now part of the real staff workflow, with human review technically enforced and every assistive action traceable.

---

## 8G. Monitoring, drift, fairness, and live safety controls

This sub-phase makes the assistive layer safe after first release, not just at launch.

Current NHS guidance says organisations should run ongoing audits of output accuracy, monitor system performance, identify emerging safety risks and potential bias, maintain human oversight, and collect monitoring data independently from the manufacturer. It also says pilots should be time-limited and not used to bypass compliance. ([NHS England][1])

### Backend work

Create a dedicated live monitoring plane.

Suggested objects:

**ShadowComparisonRun**  
`comparisonRunId`, `assistiveSessionRef`, `humanOutcomeRef`, `modelOutcomeRef`, `deltaMetricsRef`

**DriftSignal**  
`driftSignalId`, `capabilityCode`, `metricCode`, `segmentKey`, `observedAt`, `severity`, `triggerState`

**BiasSliceMetric**  
`sliceMetricId`, `capabilityCode`, `sliceDefinition`, `metricSet`, `windowRef`

**AssistiveKillSwitch**  
`killSwitchId`, `scope`, `triggeredBy`, `triggeredAt`, `fallbackMode`

**ReleaseGuardThreshold**  
`thresholdId`, `capabilityCode`, `metricCode`, `warningLevel`, `blockLevel`

**AssistiveIncidentLink**  
`incidentLinkId`, `assistiveSessionRef`, `incidentSystemRef`, `severity`, `investigationState`

Run monitoring at three levels:

1. offline release quality against the protected gold set
2. live shadow comparison against real clinician outcomes
3. post-visible drift and fairness monitoring across cohorts and subgroups

Track at least:

- accept rate
- median edit distance
- abstention rate
- unsupported assertion rate
- critical omission rate
- endpoint suggestion precision and recall
- Brier score and expected calibration error for any surfaced confidence
- selective risk at the live abstention threshold
- false reassurance risk signals
- Jensen-Shannon divergence or PSI for feature and output drift
- performance by request type, channel, accent and dialect slice where appropriate, and tenant

Use interval-aware thresholds rather than point estimates alone. Any block-level threshold breach should auto-downgrade the capability to shadow or off, for example when `LCB_95(precision_slice) < theta_precision_block`, `UCB_95(falseReassuranceRate) > theta_false_reassurance_block`, or live calibration error breaches the configured ceiling for the active capability.

### Frontend work

Add an internal Assistive Ops view for safety, product, and clinical leads.

It should show:

- visible vs shadow cohorts
- drift alerts
- bias slices
- unsafe suggestion review queue
- capability kill switches
- version rollout map
- incident links

Keep it dense and serious. This is not a marketing dashboard.

### Tests that must pass before moving on

- drift alert firing tests
- kill-switch tests
- shadow-visible isolation tests
- fairness-slice metric tests
- incident-link propagation tests
- threshold-trigger rollback tests
- dashboard data lineage tests

### Exit state

The assistive layer can now be run like a governed production capability instead of a static model deployment.

---

## 8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control

This sub-phase formalises what has to happen when AI is added to a real NHS-integrated product.

Current IM1 guidance says AI products go through documentation review during pairing, including DCB0129 safety material, DPIA, and medical device registration where applicable, but that AI-specific technical assurance stays out of scope for IM1 and remains the deploying organisation’s responsibility. It also says that when an assured product evolves through AI integration or other significant enhancement, a formal RFC and updated SCAL are required. DTAC still applies alongside, rather than instead of, other approvals. ([NHS England Digital][2])

### Backend and assurance work

Create a formal model-change control system.

Suggested objects:

**ModelChangeRequest**  
`changeRequestId`, `capabilityCode`, `changeType`, `currentVersionRef`, `proposedVersionRef`, `intendedUseImpact`, `safetyImpact`, `approvalState`

**RFCBundle**  
`rfcBundleId`, `im1ProductRef`, `changeRequestId`, `SCALDeltaRef`, `safetyCaseDeltaRef`, `documentationRefs`, `submissionState`

**MedicalDeviceAssessmentRef**  
`assessmentRefId`, `capabilityCode`, `intendedUseProfileRef`, `assessmentOutcome`, `registrationState`, `evidenceRefs`

**SafetyCaseDelta**  
`deltaId`, `hazardChanges`, `controlsAdded`, `testEvidenceRef`, `signoffState`

**SubprocessorAssuranceRef**  
`subprocessorRefId`, `supplierName`, `safetyEvidenceRef`, `dpiaRef`, `contractualControlRef`

Classify changes into:

- copy or template-only change
- prompt or threshold change
- model version change
- capability expansion
- intended-use change
- regulatory posture change

Then route them accordingly. For example:

- template-only changes may need local QA and prompt replay
- threshold or prompt changes may need evaluation rerun and safety signoff
- capability expansion or visible endpoint suggestion changes may require full safety-case delta and IM1 RFC
- intended-use changes may require renewed medical-device assessment and deployment signoff

This is also the right place to draw the medical-purpose boundary explicitly. Based on current NHS and MHRA guidance, simple verified transcription is a different class of product risk from generative summarisation that informs clinical decisions. So keep the capability manifests, safety case, and product wording aligned.

### Frontend work

Build a slim internal Assistive Release Admin surface for approved engineering and safety users only.

It should support:

- current live model versions
- prompt template versions
- cohort rollout states
- pending change requests
- safety signoff state
- rollback target selection

Do not let production model changes happen through environment variables and hope.

### Tests that must pass before moving on

- change-control workflow tests
- version immutability tests
- evidence-completeness tests for RFC bundles
- rollback-package tests
- model-registry integrity tests
- tenant-cohort change-isolation tests

### Exit state

Every material assistive change is now governable, replayable, and safe to carry into an NHS-assured deployment environment.

---

## 8I. Pilot rollout, controlled slices, and formal exit gate

This sub-phase turns the assistive layer into a safe live capability.

NHS guidance on AI-enabled documentation tools is clear that pilots should not be used to bypass compliance, and that monitoring, safety, governance, and training still need to be in place. ([NHS England][1])

### Backend work

Run rollout in clearly separated slices.

Recommended slices:

**Slice 8.1**  
Shadow transcription and shadow draft notes only. No visible staff output.

**Slice 8.2**  
Visible documentation drafts for a narrow staff cohort. No endpoint suggestions.

**Slice 8.3**  
Structured extraction and question-set suggestions.

**Slice 8.4**  
Endpoint suggestions in visible mode for a limited tenant cohort with stricter thresholds and high abstention.

**Slice 8.5**  
Broad assistive panel rollout with drift monitoring, kill switches, and full feedback loop.

Track these metrics from day one:

- staff adoption rate
- section accept rate
- mean edit distance
- unsafe suggestion rate
- abstention rate
- review-time change
- note-completion time
- critical omission rate
- drift and fairness alerts
- kill-switch activations
- incident count linked to assistive use

### Frontend work

Before broad release, the assistive workspace needs to feel final, not experimental:

- fast
- quiet
- evidence-backed
- visually restrained
- keyboard efficient
- easy to ignore when not useful
- impossible to mistake for final authority

Also make training part of the rollout package. Current NHS guidance specifically calls out user training and the need to reinforce practitioner responsibility to review and revise outputs. ([NHS England][1])

### Tests that must all pass before Phase 9

- no Sev-1 or Sev-2 defects in visible assistive workflows
- no-autonomous-write policy proven in production-like environments
- gold-set thresholds green for all visible capabilities
- shadow-vs-human comparison stable across release cohorts
- drift and fairness alerting live
- override and audit trail complete
- stale-output invalidation proven
- RFC and safety-case delta process proven for material AI changes
- rollback rehearsal completed
- training, runbooks, and incident paths completed

### Exit state

The assistive layer is now live, bounded, auditable, and genuinely useful without becoming the decision-maker.

---

## Recommended rollout slices inside Phase 8

Ship this phase in five slices:

**Slice 8.1**  
Shadow transcription and note draft generation only.

**Slice 8.2**  
Visible draft notes and summary composer for selected staff cohorts.

**Slice 8.3**  
Question-set suggestions, structured extraction, and evidence-backed message drafts.

**Slice 8.4**  
Endpoint suggestions for limited clinical cohorts with high abstention and strict monitoring.

**Slice 8.5**  
Full assistive workspace with feedback loops, drift dashboards, and formal change control.

## System after Phase 8

After this phase, Vecells gains a real assistive layer that sits exactly where the architecture intended it to sit: on top of the same review workflow, the same feature store, the same event history, and the same audit spine. Staff get transcription, note drafting, summary generation, question suggestions, and bounded endpoint recommendations, but every meaningful action still flows through a human checkpoint, every assistive output is versioned and replayable, and every release is governed by clinical safety, DTAC, IM1 change control, and explicit rollout thresholds. ([NHS England][1])

[1]: https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/ "NHS England » Guidance on the use of AI-enabled ambient scribing products in health and care settings"
[2]: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration "IM1 Pairing integration - NHS England Digital"
