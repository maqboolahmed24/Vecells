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

## Assistive surface priorities

The assistive layer requires five corrections:

1. Visible assistive artifacts were governed by intended-use and visibility policy, but not yet by the canonical shell-continuity and surface-binding contract, so the same output could drift into the wrong shell or task posture.
2. `AssistiveSession` invalidation checked review and policy fences, but it must define a composition-protection lease for live editing, compare, and delta-review moments, which risks rail churn or anchor loss under real-time updates.
3. One-click suggestion insertion was draft-only in intent but not yet formalized as a bounded lease into the active `DecisionDock`, so stale or mismatched suggestions could still be pushed into the wrong decision context.
4. Monitoring defined kill switches and thresholds, but the product must include a first-class trust projection for degraded, quarantined, shadow-only, or frozen assistive capability states.
5. Rollout slices tracked metrics and kill switches, but visible cohorts must bind to a release watch tuple with an explicit in-shell freeze disposition when thresholds, trust, or policy drift failed.

---

## Assistive route and trust priorities

The assistive layer requires five corrections:

1. visible assistive routes still were not pinned to published `AudienceSurfaceRouteContract`, `surfacePublicationRef`, and `RuntimePublicationBundle`, so stale or withdrawn runtime contracts could still leave assistive controls live
2. human-in-the-loop assistive actions were session-fenced, but not yet bound to `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, `ReviewActionLease`, `WorkspaceFocusProtectionLease`, `ProtectedCompositionState`, or `TaskCompletionSettlementEnvelope`, so stale workspace context could still leak optimistic commit posture
3. assistive trust and rollout freezes must not remain local to the capability layer, but must map to canonical `ReleaseRecoveryDisposition`, leaving same-shell degraded behaviour inconsistent when trust, release, or publication posture failed
4. visible draft artifacts and any browser or export handoff must be governed by `ArtifactPresentationContract` and `OutboundNavigationGrant`, so summary-first rendering and safe external navigation were not enforced
5. assistive UI actions and provenance surfaces still did not emit canonical `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence`, so causal audit and PHI-safe telemetry were incomplete

---

## Assistive evidence and operator-control priorities

The assistive evidence and operator-control seam requires five corrections:

1. internal evaluation, annotation, and replay tooling must bind to published runtime contracts, so protected review surfaces could still look live on stale or withdrawn publication state
2. transcript and audio-review presentation must be governed by explicit `ArtifactPresentationContract` and `OutboundNavigationGrant` rules, which left raw artifact delivery and detached handoff paths under-specified
3. Assistive Ops oversight must define route-bound action posture for kill switch, freeze, or rollback interventions, so stale trust or publication state could still imply executable controls
4. release-admin approvals, promotion, freeze, and rollback work must chain to canonical route intent, action, settlement, and recovery contracts
5. internal assistive operator surfaces must include one explicit PHI-safe UI telemetry law across evaluation, transcript review, ops oversight, release admin, and rollout freeze transitions

---

## 8A. Assistive capability contract, intended-use boundaries, and policy envelope

This sub-phase defines exactly what the assistive layer is allowed to do.

The architecture already separates Documentation Automation from Clinical Intelligence, and the runtime flow already shows AI suggestions inside staff review rather than at the patient edge. That is the right boundary to keep. Current NHS guidance also makes intended-use discipline essential: generative AI can introduce unintended functionality, suppliers need safeguards to keep outputs within intended use, and higher-function processing like summarisation can shift regulatory posture. ([NHS England][1])

### Backend work

Create an `AssistiveCapabilityManifest` as the top-level contract.

High-priority control-plane gaps in this layer:

1. capability gating is currently too coarse because it does not mint a per-run grant bound to route, actor, subject scope, evidence class, and visibility ceiling
2. capability families are listed, but their allowed composition graph is undefined, so one assistive output could be laundered into a forbidden downstream decision path
3. release state alone is too weak a control plane; the blueprint needs tenant or environment kill-switch and compiled-policy version semantics
4. visible outputs do not yet carry an explicit surface-binding and audience policy, so artifacts could leak into the wrong shell or role
5. blocked, abstained, schema-invalid, or policy-drifted runs do not have a first-class settlement state, which invites unsafe silent failure or unsafe rendering

Suggested objects:

**AssistiveCapabilityManifest**  
`manifestId`, `capabilityCode`, `capabilityFamily`, `intendedUseProfileRef`, `allowedContexts`, `allowedInputs`, `allowedOutputs`, `compositionPolicyRef`, `visibilityPolicyRef`, `surfaceBindingPolicyRef`, `routeContractPolicyRef`, `publicationPolicyRef`, `rolloutLadderPolicyRef`, `recoveryDispositionPolicyRef`, `telemetryDisclosurePolicyRef`, `requiredTrustSliceRefs`, `shadowModeDefault`, `visibleModeDefault`, `approvalRequirement`, `medicalDeviceAssessmentRef`, `releaseCohortRef`, `killSwitchPolicyRef`

**IntendedUseProfile**  
`profileId`, `clinicalPurpose`, `nonClinicalPurpose`, `medicalPurposeState`, `permittedUserRoles`, `permittedSubjectScopes`, `forbiddenActions`, `forbiddenDownstreamConsumers`, `evidenceRequirement`, `humanReviewRequirement`

**ModelPolicy**  
`policyId`, `modelRegistryRef`, `promptSurfaceRef`, `outputSchemaRef`, `schemaValidationPolicyRef`, `abstentionPolicyRef`, `loggingPolicyRef`, `retentionPolicyRef`, `replayEvidencePolicyRef`

**ReplayEvidencePolicy**  
`policyId`, `inputSnapshotRetentionClassRef`, `outputArtifactRetentionClassRef`, `decisionLinkageRequirement`, `archiveOnlyWhenReferenced`

**NoAutoWritePolicy**  
`policyId`, `blockedCommands`, `blockedTransitions`, `writebackTargets`, `overrideMode`

**AssistiveReleaseState**  
`releaseStateId`, `capabilityCode`, `tenantId`, `cohortId`, `mode`, `effectiveFrom`, `effectiveTo`, `compiledPolicyBundleRef`

**AssistiveInvocationGrant**
`assistiveInvocationGrantId`, `capabilityCode`, `routeFamily`, `subjectScope`, `actorRef`, `actingContextRef`, `evidenceClassRefs`, `visibilityCeiling`, `compiledPolicyBundleRef`, `reviewVersionRef`, `lineageFenceEpoch`, `entityContinuityKey`, `surfaceBindingRef`, `rolloutVerdictRef`, `rolloutRung = shadow_only | visible_summary | visible_insert | visible_commit | frozen | withdrawn`, `renderPosture = shadow_only | visible | observe_only | blocked`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `telemetryDisclosureFenceRef`, `ticketOrTaskRef`, `grantFenceToken`, `issuedAt`, `expiresAt`, `grantState`

**AssistiveCompositionPolicy**
`compositionPolicyId`, `capabilityCode`, `allowedUpstreamCapabilityCodes`, `allowedDerivedArtifactTypes`, `blockedDownstreamObjectTypes`, `maxChainDepth`, `loopDetectionMode`

**AssistiveVisibilityPolicy**
`visibilityPolicyId`, `capabilityCode`, `allowedShells`, `allowedRouteFamilies`, `allowedAudienceTiers`, `maskingPolicyRef`, `patientFacingState`, `placeholderContractRef`

**AssistiveRolloutLadderPolicy**
`assistiveRolloutLadderPolicyId`, `capabilityCode`, `allowedRungSequence = shadow_only | visible_summary | visible_insert | visible_commit`, `shadowEntryEvidenceClasses[]`, `visibleEntryEvidenceClasses[]`, `insertEntryEvidenceClasses[]`, `commitEntryEvidenceClasses[]`, `requiredRouteContractPolicyRef`, `requiredPublicationPolicyRef`, `requiredTrustProjectionPolicyRef`, `requiredFreezeDispositionPolicyRef`, `downgradePolicyRef`, `defaultFallbackMode`, `policyState`

**AssistiveSurfaceBinding**
`surfaceBindingId`, `capabilityCode`, `entityContinuityKey`, `routeFamily`, `allowedShell`, `audienceTier`, `visibilityPolicyRef`, `rolloutVerdictRef`, `rolloutRung = shadow_only | visible_summary | visible_insert | visible_commit | frozen | withdrawn`, `renderPosture = shadow_only | visible | observe_only | blocked`, `consistencyProjectionRef`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `workspaceTrustEnvelopeRef`, `assistiveCapabilityTrustEnvelopeRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `selectedAnchorRequirement = required | optional | none`, `decisionDockMode = summarize | draft_insert_only | observe_only`, `placeholderContractRef`, `bindingState`

**AssistivePresentationContract**
`presentationContractId`, `capabilityCode`, `defaultSurfaceMode = summary_stub | inline_side_stage | bounded_drawer | control_workbench`, `desktopInlineSizeMin`, `desktopInlineSizeMax`, `maxPrimaryPlaneShare`, `summaryStubMinBlockSize`, `summaryStubMaxLines`, `provenanceDisclosureLevel = footer | footer_plus_popover | footer_plus_side_sheet`, `confidenceDisclosureMode = suppressed | conservative_band | band_plus_factors`, `defaultExpansionRule = collapsed | requested | review_subject_only`, `breakpointCollapseRef`, `reducedMotionMode`, `dominanceGuard = companion_only`

**AssistiveProvenanceEnvelope**
`provenanceEnvelopeId`, `artifactRef`, `capabilityCode`, `inputEvidenceSnapshotRef`, `inputEvidenceSnapshotHash`, `inputCaptureBundleRef`, `inputDerivationPackageRefs[]`, `inputSummaryParityRef`, `evidenceMapSetRef`, `modelVersionRef`, `promptSurfaceRef`, `outputSchemaVersionRef`, `calibrationBundleRef`, `policyBundleRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `generatedAt`, `freshnessState = current | aging | stale | invalidated`, `trustState = trusted | degraded | quarantined | unknown`, `continuityValidationState = trusted | degraded | stale | blocked`, `maskingPolicyRef`, `disclosureLevel`

**AssistiveConfidenceDigest**
`confidenceDigestId`, `artifactRef`, `displayBand = suppressed | insufficient | guarded | supported | strong`, `bandReasonCodes[]`, `supportProbabilityRef`, `evidenceCoverage`, `epistemicUncertainty`, `expectedHarmBand`, `calibrationVersionRef`, `displayMode = band_only | band_plus_factors | hidden`, `computedAt`

**AssistiveFreezeFrame**
`freezeFrameId`, `artifactRef`, `freezeReason = evidence_drift | session_stale | publication_stale | trust_degraded | trust_quarantined | selected_anchor_drift | policy_change | manual_freeze`, `freezeDisposition = observe_only | provenance_only | summary_stub | placeholder | recovery_route`, `retainVisibleText`, `retainEvidenceAnchors`, `suppressWriteAffordances`, `dominantRecoveryActionRef`, `frozenAt`

**AssistiveKillSwitchState**
`killSwitchStateId`, `capabilityCode`, `tenantId`, `environmentRing`, `killState`, `reasonCode`, `activatedBy`, `activatedAt`, `fallbackMode`

**AssistiveRunSettlement**
`assistiveRunSettlementId`, `assistiveRunRef`, `settlementState`, `quarantineReasonCode`, `renderableArtifactRefs`, `blockedArtifactRefs`, `schemaValidationState`, `policyBundleRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `transitionEnvelopeRef`, `uiTransitionSettlementRecordRef`, `assistiveCapabilityTrustEnvelopeRef`, `releaseRecoveryDispositionRef`, `settledAt`

**AssistiveCapabilityTrustEnvelope**
`assistiveCapabilityTrustEnvelopeId`, `assistiveSessionRef`, `capabilityCode`, `surfaceMode = same_shell_companion | standalone_control`, `assistiveSurfaceBindingRef`, `assistiveInvocationGrantRef`, `assistiveRunSettlementRef`, `assistiveVisibilityPolicyRef`, `assistiveCapabilityWatchTupleRef`, `assistiveCapabilityTrustProjectionRef`, `assistiveCapabilityRolloutVerdictRef`, `assistiveProvenanceEnvelopeRefs[]`, `assistiveConfidenceDigestRefs[]`, `assistiveFreezeFrameRef`, `assistiveKillSwitchStateRef`, `assistiveReleaseFreezeRecordRef`, `assistiveFreezeDispositionRef`, `owningShellTrustRef`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `workspaceTrustEnvelopeRef`, `reviewActionLeaseRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `assistiveContinuityEvidenceProjectionRef`, `experienceContinuityEvidenceRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `draftInsertionPointRef`, `draftPatchLeaseRef`, `watchTupleHash`, `policyBundleRef`, `entityContinuityKey`, `trustState = trusted | degraded | quarantined | shadow_only | frozen`, `surfacePostureState = interactive | observe_only | provenance_only | placeholder_only | hidden`, `actionabilityState = enabled | regenerate_only | observe_only | blocked_by_policy | blocked`, `confidencePostureState = conservative_band | suppressed | hidden`, `completionAdjacencyState = blocked | observe_only | allowed`, `blockingReasonRefs[]`, `computedAt`

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

Composition between families must also be explicit:

- `transcription` may feed `documentation_draft` or `structured_fact_extraction`
- `structured_fact_extraction` may feed `question_set_suggestion` or `endpoint_suggestion`
- `documentation_draft`, `message_draft`, and `pharmacy_or_booking_handoff_draft` may not feed endpoint or closure logic
- no capability may recursively consume its own derived artifact chain beyond the configured `maxChainDepth`
- any blocked composition path must settle to `quarantined` or `blocked_by_policy`, never to silent omission

Any assistive output shown in live workflow must be materialized as an immutable artifact linked to model version, prompt version, the exact input evidence snapshot hash, the frozen input capture and derivation packages, output schema version, and any post-processing version used. If that artifact contributes to a patient-specific decision, release decision, or assurance pack, it becomes replay-critical evidence and may be archived but not deleted by ordinary retention jobs.

`AssistiveRolloutLadderPolicy` is the only authority for promoting a capability from shadow to visible summary, visible insert, or governed commit posture. Local feature flags, client-side toggles, and route-local threshold overrides may narrow posture beneath that ladder, but they may not widen it. A capability without an exact ladder policy remains `shadow_only`.

Assistive capabilities may not rebuild their inputs from a mutable current task view. If transcript, extraction, or evidence-summary parity drifts, the current assistive artifact must freeze through `AssistiveFreezeFrame`; a rerun may use only the newly settled snapshot and parity contract.

Any assistive output rendered to a user must also be linked to the `AssistiveInvocationGrant`, `AssistiveRunSettlement`, `AssistiveVisibilityPolicy`, one current `AssistiveCapabilityTrustEnvelope`, the active `CompiledPolicyBundle` version, and the current `AssistiveCapabilityRolloutVerdict`. If those bindings cannot be resolved, the output must remain shadow-only, blocked-by-policy, or quarantined.

Any live assistive artifact must also materialize under the canonical `VisibilityProjectionPolicy`, the current shell continuity envelope for the owning task, and one current `AssistiveCapabilityTrustEnvelope`. `AssistiveSurfaceBinding.consistencyProjectionRef` must resolve to the active review surface inside the same `PersistentShell`; same-shell companion posture must also bind the current `WorkspaceTrustEnvelope` through `AssistiveSurfaceBinding.workspaceTrustEnvelopeRef`, and `AssistiveSurfaceBinding.assistiveCapabilityTrustEnvelopeRef` must resolve to the live assistive envelope for the same task, route family, selected anchor, and publication tuple. If route family, `entityContinuityKey`, audience tier, required shell projection, or envelope tuple drift, the assistive artifact must freeze in place and degrade to a governed placeholder, read-only provenance view, or regenerate-required state instead of reappearing in a different shell or decision context.

Any visible assistive surface must also bind one published `AudienceSurfaceRouteContract`, one `surfacePublicationRef`, one `RuntimePublicationBundle`, and one current `AssistiveCapabilityRolloutVerdict`. If publication becomes `stale`, `conflict`, or `withdrawn`, if the linked runtime publication is no longer publishable, or if the rollout verdict no longer authorizes visible posture for that route family and cohort slice, the assistive capability must fail closed to `shadow_only`, `quarantined`, or a governed recovery posture; live insert, accept, and regenerate controls may not remain active on an unpublished or unapproved slice.

Visible assistive workflow in this phase is staff-only. `AssistiveSurfaceBinding.staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, and `workspaceTrustEnvelopeRef` must point to the active `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, and `WorkspaceTrustEnvelope` for the same task, and `assistiveCapabilityTrustEnvelopeRef` must point to the live assistive envelope for that same task shell. If workspace bundle version, review version, task slice trust, workspace trust, governing-object version, or assistive envelope tuple drifts, the artifact must remain in the same shell but downgrade through the bound `ReleaseRecoveryDisposition` to read-only provenance, placeholder, shadow-only, or regenerate-required posture instead of silently moving or disappearing.

Every visible assistive artifact must also resolve one `AssistivePresentationContract`, one `AssistiveProvenanceEnvelope`, and one `AssistiveConfidenceDigest` before render. Non-promoted assistive content must default to a summary stub rather than a fully expanded rail: capability label first, then one bounded rationale line, then confidence or abstention state, then provenance and freshness, then exactly one dominant safe action. Full rail or drawer expansion is legal only on explicit user request or when the assistive artifact itself is the current review subject.

Provenance must render in three governed layers rather than one opaque footer blob. Layer 1 is a compact footer that always shows capability family, evidence-snapshot time, freshness state, trust state, and publication or shadow posture. Layer 2 is an inline popover or bounded explainer that may add rationale, model and prompt version, calibration bundle, and masking or policy notes. Layer 3 is a full replay-capable evidence or provenance view reached only through the current shell's bounded side-stage, drawer, or assistive control workbench. A surface may suppress richer layers for visibility or masking reasons, but it may not render a richer layer without the footer.

Confidence display must be conservative and anti-overclaiming. `AssistiveConfidenceDigest.displayBand` is the primary UI token, not a raw probability, and it must degrade to `suppressed` whenever calibration, trust, publication, or continuity posture is not good enough to support visible confidence. Raw percentages may appear only in secondary internal diagnostics, never as the primary chip or badge on live companion surfaces. Success-green semantics are reserved for authoritative settlement and verified completion, not probabilistic assistive support.

`AssistiveCapabilityTrustEnvelope` is the sole authority for live assistive renderability, confidence posture, visible actionability, and completion-adjacent posture. `trustState = trusted` may widen to interactive summary or side-stage only when the current envelope says so; `degraded` may show observe-only summary or provenance plus governed regenerate or recovery, `quarantined` may show provenance-only or placeholder, `shadow_only` may remain badge- or diagnostic-only, and `frozen` may preserve visible text only under the current `AssistiveFreezeDisposition`. Successful model return, stale rollout verdict, or stale watch-tuple health may not bypass the envelope.

When evidence, publication, trust, selected-anchor ownership, session continuity, kill-switch posture, or release-freeze posture drifts, the platform must materialize one `AssistiveFreezeFrame`, refresh the current `AssistiveCapabilityTrustEnvelope`, and freeze in place under the bound `ReleaseRecoveryDisposition`. Freeze-in-place means retaining the visible text, current evidence anchors, and provenance footer where policy still allows them, while suppressing accept, insert, regenerate, export, browser-handoff, and completion-adjacent controls immediately and surfacing one dominant regenerate or recovery action in the same shell.

Implement a capability gate that is evaluated on every assistive invocation:

1. resolve route and workflow context
2. resolve user role and acting context
3. resolve capability manifest
4. resolve the active `CompiledPolicyBundle`, shell consistency projection, `AssistiveRolloutLadderPolicy`, and any `AssistiveKillSwitchState`
5. resolve the active `AssistiveRolloutSliceContract` for route family, audience tier, tenant or cohort membership, and current `RuntimePublicationBundle`
6. compute the current `AssistiveCapabilityRolloutVerdict`
7. mint `AssistiveSurfaceBinding` under `VisibilityProjectionPolicy`
8. mint `AssistiveInvocationGrant` with subject scope, evidence classes, visibility ceiling, rollout verdict, review fence, and expiry
9. enforce intended-use policy
10. enforce release cohort and rollout-slice membership
11. enforce `AssistiveCompositionPolicy` for any upstream derived artifacts
12. create assistive run only if all conditions pass
13. validate outputs against schema, visibility, shell binding, rollout verdict, and no-auto-write policy before settlement
14. settle the run to `shadow_only`, `renderable`, `abstained`, `quarantined`, or `blocked_by_policy`
15. materialize or refresh the current `AssistiveCapabilityTrustProjection` and one current `AssistiveCapabilityTrustEnvelope` from the same watch tuple, rollout verdict, kill-switch state, release-freeze posture, shell-truth tuple, publication tuple, selected-anchor tuple, and any insertion-target tuple
16. render interactive, observe-only, provenance-only, placeholder-only, or hidden posture strictly from the current envelope; if no current envelope can be proven, keep the shell stable and fail closed to shadow-only, blocked-by-policy, or recovery posture

No route may render a live assistive artifact purely because a model returned text. Rendering requires both a live `AssistiveInvocationGrant`, `AssistiveRunSettlement.settlementState = renderable`, and one current `AssistiveCapabilityTrustEnvelope` whose `surfacePostureState` still permits the chosen render mode.

`AssistiveRunSettlement.settlementState = renderable` is necessary but not sufficient for visible staff output. Shadow comparison, visible summary, insert affordance, and approval burden must each remain capped by the current `AssistiveCapabilityRolloutVerdict`; a renderable artifact may still remain `shadow_only` or `observe_only` when the active slice has not been promoted to the next rung.

Any visible assistive state transition, placeholder reveal, or recovery render must also emit canonical UI telemetry: one `UIEventEnvelope`, one `UITransitionSettlementRecord` where local acknowledgement can diverge from authoritative renderability, and one `UITelemetryDisclosureFence` proving that route params, task identifiers, and PHI-bearing artifact fragments were redacted to the allowed disclosure class.

### Frontend work

Build the workspace plumbing for capability-specific assistive surfaces before any model output is shown.

Add:

- capability badges in the workspace
- assistant unavailable state
- shadow-only indicator for internal users
- capability-specific reveal rules
- collapsed summary-stub rendering for every non-promoted assistive artifact
- compact provenance footer on every assistive artifact
- conservative confidence-band chip with secondary factor drill-down only where policy allows
- frozen-in-place state with exact drift reason and single dominant recovery action
- assistive blocked-by-policy state
- assistive quarantined-for-review state
- capability-specific placeholder when visibility policy allows awareness but not content

Do not show a general AI panel with random capability mixing. The UI should reveal only what the current route and role permit.

Every visible assistive surface must bind to `AssistiveVisibilityPolicy`:

- never render live assistive artifacts on patient-facing routes in this phase
- never co-render artifacts from capability families whose composition path is blocked
- if a route loses grant validity or policy freshness, preserve the shell and replace the artifact with a bounded recovery, frozen-in-place, or placeholder state instead of stale content
- trust-gated visibility must resolve truthfully: `trusted` may show summary or interactive companion posture, `degraded` may show observe-only summary plus provenance, `quarantined` may show provenance-only or placeholder, and `unknown` may show badge-only awareness until trust resolves
- capability badges, confidence chips, and provenance footers must show shadow, renderable, quarantined, or blocked state explicitly

### Tests that must pass before moving on

- invocation-grant tests by role, route, subject scope, and evidence class
- capability-gate tests by role and route
- blocked-composition and loop-detection tests across capability families
- blocked-write tests
- release-cohort tests
- kill-switch and compiled-policy propagation tests
- surface-binding and patient-route exclusion tests
- shell-continuity tests proving the same task keeps the same `PersistentShell`, `DecisionDock`, and valid `SelectedAnchor` while assistive artifacts patch in place
- assistive focus-protection and insertion-point retention tests proving stale drift freezes insert in place without retargeting the active artifact
- settlement and quarantine tests for abstention, schema failure, and policy drift
- summary-stub render-order and presentation-contract tests for non-promoted assistive artifacts
- provenance-footer integrity tests
- conservative-confidence suppression tests for stale publication, degraded trust, and missing calibration posture
- freeze-frame and in-shell recovery tests for evidence drift, selected-anchor drift, and policy change
- replay-linkage tests proving every visible assistive artifact is tied to immutable input and output evidence

### Exit state

The assistive layer now has hard intended-use boundaries, per-run invocation grants, explicit composition limits, render-surface controls, kill-switch semantics, and replay-critical evidence contracts before any live visible rollout.

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

**AssistiveEvaluationSurfaceBinding**
`assistiveEvaluationSurfaceBindingId`, `routeFamilyRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `requiredTrustRefs[]`, `releaseRecoveryDispositionRef`, `telemetryDisclosureFenceRef`, `validatedAt`

**EvaluationExportArtifact**
`evaluationExportArtifactId`, `replayBundleRef`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `artifactState = summary_only | inline_renderable | external_handoff_ready | recovery_only`, `createdAt`

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

All internal evaluation, annotation, and replay routes must bind one published `AudienceSurfaceRouteContract`, one `surfacePublicationRef`, and one `RuntimePublicationBundle` through `AssistiveEvaluationSurfaceBinding`. If publication, trust, or recovery posture drifts, the workbench must remain in the same shell but degrade to observe-only or bounded recovery instead of leaving approval-like controls live.

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

Release-gate summary export, replay-bundle export, and evidence-span detail handoff must render through `EvaluationExportArtifact` plus one governed `ArtifactPresentationContract`. If the user leaves the shell for export, print, overlay, or browser handoff, the action must consume `OutboundNavigationGrant` and preserve a safe in-shell return.

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
`transcriptArtifactId`, `sourceCaptureBundleRef`, `derivationPackageRef`, `rawTranscriptRef`, `speakerSegmentsRef`, `confidenceSummary`, `clinicalConceptRefs`, `redactionRefs`

**TranscriptPresentationArtifact**
`transcriptPresentationArtifactId`, `transcriptArtifactRef`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `artifactState = summary_only | inline_renderable | external_handoff_ready | recovery_only`, `createdAt`

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
6. persist transcript artifact plus the immutable `EvidenceDerivationPackage` that produced it
7. emit canonical `assistive.transcript.ready` and, once drafting input has been frozen, `assistive.context.snapshot.created` for downstream drafting

Any transcript rerun, correction, diarisation change, concept-extraction update, or redaction-policy change must append a new immutable derivation or redaction record. It may not replace the package, text, or redaction spans referenced by an existing `EvidenceSnapshot` or `AssistiveProvenanceEnvelope`. If the new derivation is clinically material, the owning workflow must mint a new snapshot and rerun safety or review before live assistive surfaces adopt it.

Add a hard policy gate for ambient capture. If that mode is ever enabled, start with manual-start recording, explicit local governance, and clear permission language.

Transcript preview, correction, scrub, and any downstream audio or transcript handoff must resolve through `TranscriptPresentationArtifact` and one `ArtifactPresentationContract`. If a transcript or audio view leaves the current shell for browser preview, print, download, or cross-app handoff, it must consume `OutboundNavigationGrant` bound to the current task or support lineage, permission state, and safe return contract rather than launching a raw blob URL.

### Frontend work

Add a transcript viewer inside the Clinical Workspace with:

- audio scrubber
- speaker-separated transcript
- highlighted low-confidence spans
- correction mode
- use-in-note-draft action
- hidden states when transcription is not allowed for that context

The transcript viewer must stay summary-first and same-shell. Low-confidence spans, speaker segmentation, and correction state may patch in place, but publication drift, permission drift, or rollout freeze must preserve the current shell and degrade through the route's `ReleaseRecoveryDisposition` or placeholder contract instead of exposing stale transcript actions.

For dictation capture, keep the UI restrained. One record control, one review control, one save control. No gimmicks.

### Tests that must pass before moving on

- noisy-audio and low-quality-phone tests
- accent and dialect evaluation slices
- speaker-segmentation tests
- retention and deletion tests
- permission-state enforcement tests
- transcript-correction tests
- transcript-supersession immutability tests
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
`draftNoteId`, `contextSnapshotId`, `sectionRefs`, `overallConfidenceDescriptor`, `minimumSectionSupport`, `unsupportedAssertionRisk`, `abstentionState = none | partial | full`, `calibrationVersion`, `evidenceMapSetRef`, `artifactPresentationContractRef`, `draftState`

**DraftSection**  
`sectionId`, `sectionType`, `generatedTextRef`, `evidenceSpanRefs`, `missingInfoFlags`, `supportProbability`, `evidenceCoverage`, `unsupportedAssertionRisk`, `confidenceDescriptor`

**MessageDraftArtifact**  
`messageDraftId`, `contextSnapshotId`, `messageType`, `bodyRef`, `supportProbability`, `evidenceCoverage`, `unsupportedAssertionRisk`, `abstentionState = none | partial | full`, `calibrationVersion`, `evidenceMapSetRef`, `artifactPresentationContractRef`, `reviewState`

**EvidenceMapSet**
`evidenceMapSetId`, `artifactRef`, `artifactRevisionRef`, `contextSnapshotId`, `mapHash`, `createdAt`

**EvidenceMap**  
`evidenceMapId`, `evidenceMapSetRef`, `outputSpanRef`, `sourceEvidenceRefs`, `supportWeight`, `requiredWeight`, `supportStrength`

**ContradictionCheckResult**  
`checkResultId`, `artifactRef`, `contradictionFlags`, `unsupportedAssertionFlags`, `templateConformanceState`, `riskScore`

Use this algorithm:

1. build `DocumentationContextSnapshot`
2. select an approved template for the current workflow
3. generate sectioned draft outputs
4. attach evidence spans and compute `EvidenceMap` for each section or message draft
5. run contradiction and unsupported-assertion checks
6. compute support on verifier outputs rather than decoder token probabilities. Aggregate section support from the `EvidenceMap` rows that belong to `s`, then use:
   - raw verifier score `q_raw(s | x)` from contradiction, attribution, schema, and factual-support checks
   - calibrated support probability `p_sup(s | x) = Cal_doc(q_raw(s | x))`
   - evidence coverage `cov(s,x) = supportWeight(s,x) / max(1e-6, requiredWeight(s,x))` clipped to `[0,1]`
   - unsupported-assertion risk `U(s | x) = 1 - p_sup(s | x) + lambda_conflict * 1{contradiction} + lambda_unsup * unsupportedAssertionRate(s,x) + lambda_miss * (1 - cov(s,x))`
7. render a section only when `cov(s,x) >= c_doc_render` and `U(s | x) <= theta_doc_render`; otherwise convert the section into explicit `missingInfoFlags` or full abstention
8. set `confidenceDescriptor = bucket(min{p_sup(s | x), cov(s,x), 1 - U(s | x)}, B_doc)`; `overallConfidenceDescriptor` is the minimum required-section bucket rather than an average that can hide one weak section
9. resolve `ArtifactPresentationContract` for the draft artifact and publish only the governed summary or preview mode to the workspace

Persist `minimumSectionSupport = min cov(s,x)` over required rendered sections only. `DraftNoteArtifact.abstentionState = partial` when one or more required sections are withheld but the artifact still contains at least one rendered section; `full` is legal only when no safe rendered section remains.

`evidenceMapSetRef` must point to one immutable same-artifact set of `EvidenceMap` rows for the current draft revision. A documentation artifact may not claim one support posture while its visible sections are backed by a different map set.

Start with a narrow set of draft types:

- triage summary
- clinician note draft
- patient message draft
- callback summary
- pharmacy or booking handoff summary

Do not auto-generate coded outcomes in this first visible release.

If the documentation composer lacks a validated calibration window for the active release cohort, it may remain in shadow or off, but it may not surface visible draft confidence.

All documentation-composer thresholds and calibration artifacts, including `Cal_doc`, `B_doc`, `c_doc_render`, `theta_doc_render`, `lambda_conflict`, `lambda_unsup`, and `lambda_miss`, must be versioned in the active documentation calibration bundle pinned by the current assistive release candidate and watch tuple. Local defaults are forbidden.

Any export, print, external preview, browser handoff, or cross-app share for a visible assistive draft must consume a short-lived `OutboundNavigationGrant` bound to the active route family, session or review fence, and safe return contract. Raw file URLs, detached print routes, or unsupported browser downloads are not valid assistive delivery paths.

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

Draft preview, message preview, and downstream share actions must stay summary-first under `ArtifactPresentationContract`. If a contract allows only structured summary or placeholder, the UI may not synthesize richer body access. Section accept, replace, and message insert may target only a live `AssistiveDraftInsertionPoint` backed by the current `SelectedAnchor`, `reviewVersionRef`, `decisionEpochRef`, and `lineageFenceEpoch`; the UI may not paste assistive text into a hidden, superseded, or off-screen editor instance. If the user leaves the shell for export, print, overlay, or browser handoff, the action must consume `OutboundNavigationGrant` and preserve a safe in-shell return.

### Tests that must pass before moving on

- hallucination and unsupported-assertion tests
- section-evidence alignment tests
- immutable `EvidenceMapSet` and same-artifact map-binding tests
- contradiction-detection tests
- documentation-calibration bundle pinning tests
- draft-confidence suppression tests when no validated calibration window exists
- template-rendering tests
- edit-distance measurement against clinician truth
- latency tests inside real workspace flows
- visual regression tests on the composer panel
- artifact-presentation-contract tests for note and message drafts
- outbound-navigation-grant tests for export, print, and browser handoff
- watch-tuple and release-candidate pinning tests for documentation calibration bundles

### Exit state

The product can now generate reviewable drafts that feel useful and controlled rather than magical and risky.

---

## 8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator

This sub-phase extends the assistive layer from documentation help into bounded decision support.

The architecture already frames Clinical Intelligence as intent classification, acuity scoring, risk NLP, and complexity scoring, with output in the shape of a reviewable Vecells recommendation bundle that may later materialize as mapped FHIR `Task` and `ServiceRequest` artifacts alongside priority band and endpoint recommendation. The practice flow also already depicts AI suggestions on the review screen before a human selects the best endpoint.

### Backend work

Create a bounded inference orchestrator rather than a monolithic model call.

Suggested objects:

**SuggestionEnvelope**  
`suggestionEnvelopeId`, `contextSnapshotId`, `capabilityCode`, `priorityBandSuggestion`, `riskSignalRefs`, `endpointHypotheses`, `questionRecommendations`, `topHypothesisRef`, `confidenceDescriptor`, `allowedSetMass`, `epistemicUncertainty`, `predictionSetRef`, `abstentionState = none | review_only | full`, `calibrationVersion`, `riskMatrixVersion`, `reviewVersionRef`, `decisionEpochRef`, `policyBundleRef`, `lineageFenceEpoch`, `allowedSuggestionSetHash`, `staleAt`, `invalidatedAt`

**RiskSignal**  
`riskSignalId`, `signalType`, `severity`, `supportingEvidenceRefs`, `posteriorProbability`, `confidenceDescriptor`, `ruleGuardState`, `evidenceCoverage`

**EndpointHypothesis**  
`hypothesisId`, `endpointCode`, `rankingPosition`, `rationaleRef`, `supportingEvidenceRefs`, `posteriorProbability`, `allowedConditionalProbability`, `confidenceDescriptor`, `expectedHarm`, `evidenceCoverage`, `marginToRunnerUp`, `predictionSetState = in_set | out_of_set | blocked_by_guard`

**QuestionSetRecommendation**  
`recommendationId`, `questionSetRef`, `triggerReason`, `posteriorProbability`, `confidenceDescriptor`, `evidenceRefs`, `evidenceCoverage`

**ConformalPredictionSet**
`predictionSetId`, `capabilityCode`, `contextSnapshotId`, `includedHypotheses`, `coverageTarget`, `riskTarget`, `nonconformityVersion`, `constructedAt`

**AbstentionRecord**  
`abstentionId`, `suggestionEnvelopeRef`, `capabilityCode`, `reasonCode`, `contextSnapshotId`, `reviewVersionRef`, `policyBundleRef`, `lineageFenceEpoch`, `diagnosticMetricRef`, `reviewOnlyState = observe_only | blocked | full_abstain`

**RuleGuardResult**  
`guardResultId`, `hardStopTriggered`, `conflictFlags`, `allowedSuggestionSet`

**SuggestionDraftInsertionLease**
`suggestionDraftInsertionLeaseId`, `assistiveSessionRef`, `suggestionEnvelopeRef`, `decisionEpochRef`, `selectedAnchorRef`, `decisionDockRef`, `draftInsertionPointRef`, `reviewVersionRef`, `policyBundleRef`, `lineageFenceEpoch`, `allowedSuggestionSetHash`, `slotHash`, `leaseState = live | consumed | stale | expired | revoked`, `issuedAt`, `expiresAt`

**SuggestionSurfaceBinding**
`suggestionSurfaceBindingId`, `suggestionEnvelopeRef`, `routeFamilyRef`, `assistiveSurfaceBindingRef`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `audienceSurfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `placeholderContractRef`, `bindingState = live | observe_only | stale | blocked`

**SuggestionActionRecord**
`suggestionActionRecordId`, `assistiveSessionRef`, `routeIntentBindingRef`, `suggestionEnvelopeRef`, `suggestionDraftInsertionLeaseRef`, `assistiveArtifactActionRecordRef`, `actionType = insert_draft | regenerate | dismiss | acknowledge_abstain`, `decisionDockRef`, `decisionEpochRef`, `selectedAnchorRef`, `reviewVersionRef`, `policyBundleRef`, `lineageFenceEpoch`, `allowedSuggestionSetHash`, `submittedBy`, `submittedAt`, `commandActionRecordRef`

**SuggestionActionSettlement**
`suggestionActionSettlementId`, `suggestionActionRecordRef`, `commandSettlementRecordRef`, `transitionEnvelopeRef`, `result = draft_inserted | regenerated | dismissed | abstention_acknowledged | observe_only | stale_recoverable | blocked_policy | blocked_posture | failed`, `releaseRecoveryDispositionRef`, `settledAt`

**SuggestionPresentationArtifact**
`suggestionPresentationArtifactId`, `artifactType = endpoint_explainer | risk_signal_summary | question_set_preview | abstention_notice`, `suggestionEnvelopeRef`, `summaryRef`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `maskingPolicyRef`, `externalHandoffPolicyRef`, `artifactState = summary_only | interactive_same_shell | recovery_only`

Use a multi-stage pipeline:

1. extract structured facts from the review bundle
2. run rule-based hard guards first
3. resolve one `SuggestionSurfaceBinding`, one published `AudienceSurfaceRouteContract`, one `surfacePublicationRef`, and one `RuntimePublicationBundle` for the active staff route before any visible suggestion state is armed
4. run assistive models against the fixed capability hypothesis space and carry `RuleGuardResult` forward as a later surfacing constraint rather than shrinking the label space before calibration
5. calibrate full-space model outputs before any rule masking is applied, and compute a separate versioned uncertainty selector for out-of-domain or weakly calibrated cases
6. generate typed candidate sets, not direct actions
7. compute evidence coverage, expected harm, and conformal candidate support for each surfaced hypothesis
8. abstain or downgrade to observe-only when evidence is weak, conflicting, distribution-shifted, or the candidate set is not sufficiently sharp for the current gate
9. publish suggestions to the workspace without mutating the task state
10. route every insert, regenerate, dismiss, or abstention acknowledgement through one `RouteIntentBinding`, one `CommandActionRecord`, and one `SuggestionActionSettlement`; local panel acknowledgement is not authoritative decision-draft state

Every `SuggestionEnvelope` must be bound to one review snapshot, one `reviewVersionRef`, one current `decisionEpochRef`, one active `CompiledPolicyBundle`, and one `lineageFenceEpoch`. If evidence, decision-epoch truth, policy, or allowed suggestion set changes, the envelope becomes invalid rather than silently remaining advisory.

Every visible suggestion surface must also bind to the active staff shell. `SuggestionSurfaceBinding.assistiveSurfaceBindingRef`, `staffWorkspaceConsistencyProjectionRef`, and `workspaceSliceTrustProjectionRef` must resolve to the current task, review version, and workspace slice trust for the same `entityContinuityKey`. If route family, publication state, workspace consistency, slice trust, or policy freshness drifts, the suggestion panel must remain in the same shell and degrade through the bound `ReleaseRecoveryDisposition` to placeholder, observe-only, or regenerate-required posture rather than leaving stale chips or insert controls live.

Do not let `confidence` be an uncalibrated model logit or a renormalized score over a rule-masked subset alone. For capability `c`, context `x`, and fixed hypothesis space `Y_c`, compute:

- allowed hypothesis set `A(x,c) subseteq Y_c` from `RuleGuardResult`
- raw score vector `s_raw(. | x, c)` over the full label space
- full-space calibrated probabilities `p_full(. | x, c) = Cal_c(s_raw(. | x, c))`, where `Cal_c` is versioned, held-out validated, and subgroup-audited; masking happens after full-space calibration, not before it
- allowed-set mass `M_A(x,c) = sum_{y in A(x,c)} p_full(y | x, c)`
- allowed-conditional probabilities `p_A(y | x, c) = p_full(y | x, c) / max(1e-8, M_A(x,c))` for `y in A(x,c)`
- evidence coverage `cov(h,x) = supportedEvidenceWeight(h,x) / max(1e-6, requiredEvidenceWeight(h,x))` clipped to `[0,1]`
- epistemic or OOD uncertainty `u_epi(x,c) in [0,1]`, produced by a versioned selector based on ensemble disagreement, stochastic inference variance, embedding-density deficit, or an equivalent held-out validated detector
- expected harm `H(h | x,c) = sum_{y in Y_c} L_c(h,y) * p_full(y | x,c)`, with `L_c` asymmetric and strictly heavier on false reassurance, under-triage, and unsafe downgrades than on benign over-triage
- allowed-space margin `margin_A(h,x) = p_A(h | x,c) - max_{y in A(x,c), y != h} p_A(y | x,c)`
- conformal candidate set `Gamma_{alpha,c}(x) = { y in Y_c : eta_c(y,x) <= q_{alpha,c} }`, where `eta_c` is a versioned nonconformity score and `q_{alpha,c}` is calibrated on held-out data for the active capability

Use two operating points, not one. Let `lambda` index increasingly conservative gates so that larger `lambda` yields a subset of less conservative outputs.

- visible-set operator `C_vis,lambda(x,c) = { h in A(x,c) : cov(h,x) >= c_vis(lambda) and M_A(x,c) >= gamma_vis(lambda) and u_epi(x,c) <= u_vis(lambda) and H(h | x,c) <= theta_vis(lambda) and h in Gamma_{alpha_vis,c}(x) }`
- insert-set operator `C_ins,lambda(x,c) = { h in C_vis,lambda(x,c) : p_A(h | x,c) >= pi_ins(lambda) and margin_A(h,x) >= m_ins(lambda) }`

Do not hand-tune these thresholds independently. Choose `lambda_hat_vis,c` and `lambda_hat_ins,c` on a held-out calibration window with conformal risk control:

`lambda_hat = inf { lambda in Lambda_c : Rhat_CRC_plus,c(lambda) <= alpha_target,c }`

where `Rhat_CRC_plus,c` is an upper confidence bound on a monotone capability loss that weights false reassurance and missed high-severity endpoints more heavily than benign over-triage.

Runtime policy is then:

- if `M_A(x,c) < gamma_floor` or `u_epi(x,c) > u_block` or `Gamma_{alpha_vis,c}(x) intersection A(x,c) = emptyset`, create `AbstentionRecord`
- visible ranked suggestions may render only from `C_vis,lambda_hat_vis,c(x,c)`
- one-click insert may arm only when `C_ins,lambda_hat_ins,c(x,c) = {h*}` and the active trust, publication, and session-fence posture are all green
- if `|C_vis,lambda_hat_vis,c(x,c)| > 1`, the UI stays observe-only and may not imply a single best action
- if the conformal set contains any disallowed or higher-severity hypothesis with non-negligible mass, abstain or downgrade to review-only; do not renormalize that risk away

Persist `predictionSetRef` as the current `ConformalPredictionSet` for the envelope. Set `EndpointHypothesis.predictionSetState = in_set` only when the hypothesis survives both the rule guard and the current conformal set, `blocked_by_guard` when it is in the conformal set but disallowed by rules, and `out_of_set` otherwise. Set `topHypothesisRef` only when one visible hypothesis remains strictly dominant after the current visible-set gate; otherwise leave it null so the envelope does not imply a single best action.

`confidenceDescriptor` should therefore be a conservative band, for example `bucket(min{p_A(h | x,c), M_A(x,c), cov(h,x), 1 - u_epi(x,c), 1 - H(h | x,c) / H_max,c}, B_c)`, rather than a raw model score or an average that hides one weak dimension.

Aggregate ECE is not sufficient for release. Before visible rollout, each `Cal_c` must also stay within configured ceilings on classwise ECE, Brier score, and multicalibration gap across the operational and protected subgroup families used for live monitoring.

If a capability lacks a validated calibration set, a validated uncertainty selector, or a conformal calibration window for the active release cohort, it may remain in shadow or off, but it may not present visible confidence or one-click insert.

All assistive-decision parameters and artifacts, including `Cal_c`, `eta_c`, `q_{alpha,c}`, `Lambda_c`, `alpha_target,c`, `gamma_*`, `u_*`, `theta_*`, `pi_ins`, `m_ins`, `H_max,c`, the asymmetric loss matrix `L_c`, and the monitored subgroup family, must be versioned in the active capability calibration bundle, uncertainty-selector bundle, conformal bundle, and threshold set pinned by the current `AssistiveCapabilityWatchTuple` and `AssistiveReleaseCandidate`.

The orchestrator may not survive beyond its evidence fence. When new patient evidence, duplicate resolution, identity repair, approval-state change, or policy-bundle promotion changes the allowed hypothesis set, the platform must set `invalidatedAt`, suppress one-click insert, and require regeneration before any suggestion is reused.

The critical boundary is this: the orchestrator may suggest an endpoint, but it may never create the `EndpointDecision` record itself.

One-click insertion is therefore a bounded drafting aid, not a shortcut around review. `SuggestionDraftInsertionLease` may create only a draft proposal inside the active `DecisionDock` for the current governing object, `SelectedAnchor`, current `decisionEpochRef`, and a live `AssistiveDraftInsertionPoint`. Free cursor state, restored browser selection, or an off-screen editor instance are not valid insertion targets. The lease must fail closed if the suggestion envelope is stale, the allowed suggestion set changed, the review version drifted, the decision epoch advanced or was superseded, the lineage fence advanced, the insertion-point `slotHash` changed, or the user is no longer acting on the same task. Lease failure must keep the current shell stable, freeze insert controls, and require regenerate-in-place rather than silently inserting a stale hypothesis into the wrong decision context.

Insert, regenerate, dismiss, and abstention acknowledgement are assistive workflow actions, not free UI gestures. They must persist one `SuggestionActionRecord`, settle through one authoritative `SuggestionActionSettlement`, and carry the current `TransitionEnvelope` plus governed `ReleaseRecoveryDisposition` whenever publication, review, or workspace posture no longer supports live drafting.

`SuggestionActionRecord.allowedSuggestionSetHash` must equal the live envelope hash and any active insertion-lease hash at submit time. `SuggestionActionSettlement.result` must preserve action identity one-for-one: dismiss may not collapse into generic `observe_only`, and abstention acknowledgement may not be replayed as if a draft mutation occurred.

For insert, regenerate, dismiss, and abstention acknowledgement, `SuggestionActionRecord` is the suggestion-specific child contract and `AssistiveArtifactActionRecord` is the session-level audit wrapper for the same user gesture. They must reference the same `assistiveSessionRef`, `selectedAnchorRef`, and route intent; the platform may not record two independent truths for one assistive action.

Why-this-suggestion explainers, risk summaries, question previews, and abstention notices are governed assistive artifacts. They must render through `SuggestionPresentationArtifact` and one `ArtifactPresentationContract`; if the user prints, exports, opens an overlay, or leaves the shell for browser or cross-app handoff, the action must consume one `OutboundNavigationGrant` tied to the current route, masking policy, and safe return contract rather than using raw artifact URLs.

### Frontend work

Build a suggestion side panel with:

- endpoint chips ranked by conservative `confidenceDescriptor` and expected-harm band, never raw model percentage
- risk signals grouped by severity
- questions-to-ask-next recommendations
- why-this-suggestion explainer
- abstain state when no safe suggestion exists
- one-click insert into the decision form as a draft, not a commit

This UI should feel precise, not chatty. Use concise chips, short rationale lines, and evidence popovers. No chatbot transcript.

Confidence and rationale should render in a strict hierarchy. The default chip shows the conservative confidence band only; factor rows for evidence coverage, uncertainty, expected harm, or why-this-suggestion open inside a bounded popover or explainer state and may not masquerade as settled truth. Supportive or uncertain assistive chips must use informational or caution semantics rather than success-green.

The side panel must resolve one live `SuggestionSurfaceBinding` before any insert, regenerate, or dismiss control becomes interactive. If publication, workspace consistency, trust, or policy posture drifts, the same shell must remain visible while the panel degrades to observe-only, placeholder, or regenerate-required posture through the bound `ReleaseRecoveryDisposition`.

The panel may show local acknowledgement for insert or regenerate, but it may not imply that the draft inside `DecisionDock` changed until the current `SuggestionActionSettlement` confirms the bound route intent, review version, and selected anchor.

Explainers, evidence popovers, question previews, and abstention notices must remain summary-first under `ArtifactPresentationContract`. If a contract permits only bounded summary or placeholder, the UI may not synthesize richer body access. Any print, export, overlay, or browser handoff must consume `OutboundNavigationGrant` and preserve a safe in-shell return.

All visible suggestion transitions across panel reveal, insert, regenerate, dismiss, abstention, and recovery posture must emit canonical UI observability:

- one `UIEventEnvelope`
- one `UITransitionSettlementRecord` whenever local acknowledgement can diverge from authoritative settlement or recovery posture
- one `UITelemetryDisclosureFence` proving that route params, task identifiers, evidence spans, and PHI-bearing rationale fragments were redacted to the permitted disclosure class

### Tests that must pass before moving on

- red-flag miss regression tests
- endpoint ranking quality tests
- confidence-calibration tests
- conformal candidate-set and one-click-insert gate tests
- allowed-set-mass floor and epistemic-uncertainty abstention tests
- abstention-behaviour tests
- prompt-injection and adversarial-input tests
- no-state-mutation tests
- draft-insertion-lease tests proving stale or mismatched suggestions cannot enter the wrong `DecisionDock`
- decision-epoch invalidation tests proving one-click insert cannot reuse suggestions from a superseded triage decision
- insertion-point and `slotHash` drift tests proving suggestions cannot target a hidden, superseded, or off-screen editor
- stale-context invalidation tests
- route-publication and `SuggestionSurfaceBinding` tests for suggestion routes inside the active workspace shell
- authoritative `SuggestionActionSettlement` tests proving insert or regenerate remain pending or blocked until settlement lands
- `ReleaseRecoveryDisposition` downgrade tests for publication drift, workspace drift, trust loss, and policy-bundle change
- `ArtifactPresentationContract` and `OutboundNavigationGrant` tests for explainers, previews, and abstention artifacts
- UI telemetry disclosure and redaction tests for suggestion interactions
- watch-tuple pinning tests for calibration, uncertainty-selector, conformal, and threshold bundles

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
`assistiveSessionId`, `taskRef`, `contextSnapshotId`, `visibleArtifacts`, `openedBy`, `openedAt`, `lastValidatedAt`, `sessionState`, `reviewVersionRef`, `decisionEpochRef`, `policyBundleRef`, `lineageFenceEpoch`, `entityContinuityKey`, `surfaceBindingRef`, `presentationContractRef`, `staffWorkspaceConsistencyProjectionRef`, `workspaceSliceTrustProjectionRef`, `workspaceTrustEnvelopeRef`, `assistiveCapabilityTrustEnvelopeRef`, `reviewActionLeaseRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `selectedAnchorRef`, `decisionDockStateRef`, `summaryStubRef`, `freezeFrameRef`, `sessionFenceToken`, `feedbackChainRefs[]`, `currentFeedbackChainRef`, `workProtectionLeaseRef`, `taskCompletionSettlementEnvelopeRef`, `experienceContinuityEvidenceRef`, `uiTelemetryDisclosureFenceRef`, `invalidationState`

**AssistiveFeedbackChain**
`assistiveFeedbackChainId`, `assistiveSessionRef`, `assistiveCapabilityTrustEnvelopeRef`, `artifactRef`, `artifactHash`, `capabilityCode`, `taskRef`, `routeIntentBindingRef`, `selectedAnchorRef`, `reviewVersionRef`, `decisionEpochRef`, `policyBundleRef`, `lineageFenceEpoch`, `actionRecordRefs[]`, `latestActionRecordRef`, `overrideRecordRefs[]`, `currentOverrideRecordRef`, `approvalGateAssessmentRefs[]`, `currentApprovalGateAssessmentRef`, `currentFinalHumanArtifactRef`, `feedbackEligibilityFlagRef`, `incidentLinkRefs[]`, `supersedesFeedbackChainRef`, `supersededByFeedbackChainRef`, `chainState = in_review | approval_pending | settled_clean | adjudication_pending | excluded | revoked | superseded`, `openedAt`, `settledAt`, `revokedAt`

`AssistiveFeedbackChain` is the only end-to-end feedback contract for one visible assistive artifact revision. Gesture capture, override reasoning, approval burden, final human artifact settlement, incident linkage, and training eligibility must all resolve on this chain; regenerate, artifact-hash drift, dismissal, or stale recovery may supersede or exclude the chain, but may not fork parallel truths for the same reviewed artifact.

**AssistiveArtifactActionRecord**
`actionRecordId`, `assistiveSessionId`, `assistiveFeedbackChainRef`, `assistiveCapabilityTrustEnvelopeRef`, `artifactRef`, `artifactHash`, `actionType = accept_unchanged | accept_after_edit | reject_to_alternative | abstained_by_human | insert_draft | regenerate | dismiss_suggestion | acknowledge_abstain | stale_recovery`, `actionGestureKey`, `sectionRef`, `actorRef`, `routeIntentBindingRef`, `selectedAnchorRef`, `reviewVersionRef`, `decisionEpochRef`, `reviewActionLeaseRef`, `uiEventEnvelopeRef`, `uiTransitionSettlementRecordRef`, `uiTelemetryDisclosureFenceRef`, `resultingOverrideRecordRef`, `resultingApprovalGateAssessmentRef`, `resultingFinalHumanArtifactRef`, `resultingFeedbackEligibilityFlagRef`, `supersedesActionRecordRef`, `timestamp`, `authoritativeSettlementState = pending | settled | recovery_required | manual_handoff_required | stale_recoverable`, `actionState = captured | superseded | revoked`

**AssistiveDraftInsertionPoint**
`assistiveDraftInsertionPointId`, `taskRef`, `surfaceRef`, `contentClass = note_section | message_body | endpoint_reasoning | question_set`, `selectedAnchorRef`, `reviewVersionRef`, `decisionEpochRef`, `lineageFenceEpoch`, `slotHash`, `slotState = live | occupied | stale | blocked`, `lastValidatedAt`

**AssistiveDraftPatchLease**
`assistiveDraftPatchLeaseId`, `assistiveSessionRef`, `artifactRef`, `sectionRef`, `draftInsertionPointRef`, `reviewActionLeaseRef`, `selectedAnchorRef`, `reviewVersionRef`, `decisionEpochRef`, `lineageFenceEpoch`, `slotHash`, `leaseState`, `issuedAt`, `expiresAt`

**OverrideRecord**  
`overrideRecordId`, `assistiveSessionId`, `assistiveFeedbackChainRef`, `assistiveArtifactActionRecordRef`, `assistiveCapabilityTrustEnvelopeRef`, `capabilityCode`, `decisionType`, `modelOutputRef`, `humanOutputRef`, `artifactHash`, `overrideDisposition = accepted_unchanged | accepted_after_edit | rejected_to_alternative | abstained_by_human`, `overrideScope = style_only | content_material | policy_exception | trust_recovery`, `changedSpanRefs[]`, `overrideReasonCodes[]`, `reasonRequirementState = optional | required`, `freeTextRef`, `displayConfidenceBand`, `allowedSetMassAtDecision`, `epistemicUncertaintyAtDecision`, `expectedHarmAtDecision`, `trustScoreAtDecision`, `sessionFreshnessPenalty`, `continuityValidationState`, `provenanceEnvelopeRef`, `confidenceDigestRef`, `approvalGateAssessmentRef`, `finalHumanArtifactRef`, `feedbackEligibilityFlagRef`, `selectedAnchorRef`, `reviewVersionRef`, `recordedAt`, `overrideState = captured | superseded | revoked`

**HumanApprovalGateAssessment**
`approvalGateAssessmentId`, `assistiveSessionRef`, `assistiveFeedbackChainRef`, `assistiveCapabilityTrustEnvelopeRef`, `artifactRef`, `artifactHash`, `reviewVersionRef`, `decisionEpochRef`, `selectedAnchorRef`, `approvalPolicyBundleRef`, `decisionType`, `riskTier`, `expectedHarmAtGate`, `requiredApproverCount`, `currentApproverCount`, `trustScoreAtGate`, `sessionFreshnessPenalty`, `continuityValidationState`, `eligibilityState = blocked | single_review | dual_review | ready_to_settle`, `blockingReasonCodes[]`, `finalHumanArtifactRef`, `computedAt`, `assessmentState = current | superseded | blocked | settled`

**FinalHumanArtifact**  
`finalArtifactId`, `taskRef`, `assistiveFeedbackChainRef`, `assistiveCapabilityTrustEnvelopeRef`, `artifactType`, `contentRef`, `artifactHash`, `approvedByRefs[]`, `approvalEventRefs[]`, `approvedAt`, `approvalMode = de_novo | assistive_seeded | assistive_edited`, `approvalGateAssessmentRef`, `sourceAssistiveRefs[]`, `artifactPresentationContractRef`, `authoritativeWorkflowSettlementRef`, `taskCompletionSettlementEnvelopeRef`, `reviewVersionRef`, `decisionEpochRef`, `selectedAnchorRef`, `workflowSettlementState = pending | settled | superseded | incident_held | excluded`, `supersededByFinalHumanArtifactRef`, `settledAt`

**FeedbackEligibilityFlag**  
`feedbackFlagId`, `assistiveFeedbackChainRef`, `assistiveCapabilityTrustEnvelopeRef`, `overrideRecordId`, `finalHumanArtifactRef`, `authoritativeWorkflowSettlementRef`, `eligibleForTraining`, `eligibilityState = pending_settlement | requires_adjudication | eligible | excluded | revoked`, `exclusionReason`, `requiresAdjudication`, `adjudicationCaseRef`, `latestIncidentLinkRef`, `labelQualityState = pending | routine_clean | adjudicated | excluded`, `counterfactualCompletenessState = complete | partial | absent | not_applicable`, `evaluatedAt`, `revokedAt`

**AssistiveWorkProtectionLease**
`assistiveWorkProtectionLeaseId`, `assistiveSessionId`, `workspaceFocusProtectionLeaseRef`, `assistiveCapabilityTrustEnvelopeRef`, `artifactRef`, `lockReason = composing | comparing | confirming | reading_delta`, `selectedAnchorRef`, `draftInsertionPointRef`, `protectedRegionRef`, `quietReturnTargetRef`, `bufferedDeferredDeltaRefs[]`, `queueChangeBatchRef`, `leaseState = active | invalidated | released`, `invalidatingDriftState = none | review_version | publication | trust | insertion_point_invalidated | anchor_invalidated`, `startedAt`, `releasedAt`

**AssistiveContinuityEvidenceProjection**
`assistiveContinuityEvidenceProjectionId`, `assistiveSessionRef`, `taskRef`, `controlCode = assistive_session`, `routeFamilyRef`, `routeContinuityEvidenceContractRef`, `assistiveCapabilityTrustEnvelopeRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `latestActionOrTaskSettlementRef`, `experienceContinuityEvidenceRef`, `continuityTupleHash`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `capturedAt`

`AssistiveContinuityEvidenceProjection` binds visible assistive session posture to the assurance spine. The rail may keep stale text, provenance, and anchors visible locally, but it may not present fresh accept, insert, regenerate, or completion-adjacent calmness unless the current `ExperienceContinuityControlEvidence` still validates the same task shell, selected-anchor tuple, assistive session, and live publication tuple, and the current `AssistiveCapabilityTrustEnvelope` has degraded to the matching observe-only or blocked posture.

Use this interaction algorithm:

1. workspace opens task
2. assistive session binds to the current evidence snapshot, `reviewVersionRef`, `decisionEpochRef`, `policyBundleRef`, `lineageFenceEpoch`, `entityContinuityKey`, `AssistiveSurfaceBinding`, `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, the current `WorkspaceTrustEnvelope`, one current `AssistiveCapabilityTrustEnvelope`, and the published runtime contract for the active workspace route
3. staff sees draft and suggestion artifacts, and the platform materializes one `AssistiveFeedbackChain` per visible artifact revision, selected-anchor tuple, review version, and policy bundle
4. if the user starts editing, comparing, confirming, or reviewing a highlighted delta, create `AssistiveWorkProtectionLease` bound to the active artifact, `SelectedAnchor`, current draft insertion point, and quiet-return target
5. every visible accept, edit, reject, insert, regenerate, dismiss, abstention acknowledgement, or stale-recovery gesture must first resolve or refresh the active `AssistiveFeedbackChain`, then persist exactly one `AssistiveArtifactActionRecord(actionGestureKey)` on that chain; replayed clicks, retried network posts, and local acknowledgement may return the same action record, but may not mint a second truth for one human gesture
6. before any assistive insertion or final-artifact commit, compute `sessionFreshnessPenalty = min(1, max(0, (now - lastValidatedAt - ttl_live) / ttl_grace))`, derive provisional `trustScoreAtGate` and `continuityValidationState` from the live trust and continuity projections, and revalidate that the session fence token, review version, decision epoch, policy bundle, surface binding, selected-anchor ownership, `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, the current `WorkspaceTrustEnvelope`, one current `AssistiveCapabilityTrustEnvelope`, live `ReviewActionLease`, surface publication state, `AssistiveContinuityEvidenceProjection`, the active `AssistiveFeedbackChain`, and any active `AssistiveDraftInsertionPoint` or `AssistiveDraftPatchLease` still match live workspace state. `AssistiveCapabilityTrustEnvelope.actionabilityState` must remain `enabled`, and `completionAdjacencyState` may widen only when the same envelope still allows it; stale sessions must fail closed and require regeneration
7. while `AssistiveWorkProtectionLease` is active, disruptive updates must buffer through `DeferredUIDelta` or `QueueChangeBatch` and may not replace the promoted assistive region, retarget the active insertion point, or clear the current anchor unless blocker severity strictly increases
8. persist one `OverrideRecord` on the same chain for every materially reviewed assistive artifact, including `accept_unchanged`, `accept_after_edit`, `reject_to_alternative`, and `abstained_by_human`. Cosmetic wording changes may remain `reasonRequirementState = optional`, but material edits, policy exceptions, low-confidence or high-harm acceptances, and trust-recovery decisions must require deterministic reason capture before the chain may advance
9. before any externally consequential commit, materialize one `HumanApprovalGateAssessment` on the same chain using the current `trustScoreAtGate`, `sessionFreshnessPenalty`, `continuityValidationState`, `artifactHash`, current `decisionEpochRef`, and `expectedHarmAtGate`. Set `requiredApproverCount = 2` when the artifact is externally consequential or irreversible and any of the following hold: `riskTier = high`, `expectedHarmAtGate > theta_dual_review`, `trustScoreAtGate < tau_single_reviewer_green`, or the clinician is overriding a policy exception or hard-stop explanation. Otherwise set `requiredApproverCount = 1`. Then define `CommitGate = 1{all_fences_valid} * 1{sessionFreshnessPenalty = 0} * 1{continuityValidationState = trusted} * 1{trustScoreAtGate >= tau_commit}`
10. only the final human artifact can be committed to the workflow, and only when `CommitGate = 1`, `currentApproverCount >= requiredApproverCount`, and the current `AssistiveCapabilityTrustEnvelope.completionAdjacencyState = allowed`; assistive acceptance, insertion, or preview never satisfies workflow settlement on its own
11. after the relevant writeback or downstream command settles, materialize or refresh `FinalHumanArtifact` on the same chain so assistive-seeded content, approval events, and authoritative workflow settlement all point to one settled human artifact rather than to loose edit history
12. set `FeedbackEligibilityFlag.eligibleForTraining = true` only when the same chain's `FinalHumanArtifact` is authoritatively settled, no later incident or supersession invalidates it, and `labelQualityState = adjudicated | routine_clean`. High-severity cases, dual-review cases, incident-linked cases, policy-exception overrides, regenerate-only flows, dismissed suggestions, stale-recovery actions, or incomplete counterfactual evidence default to `requiresAdjudication`, `excluded`, or `revoked`
13. every visible action and feedback transition must emit `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence`; PHI-bearing prompt fragments, route params, hidden evidence spans, and free-text override notes may not leak into assistive UI telemetry
14. if new patient evidence arrives, duplicate resolution changes, the active `DecisionEpoch` is superseded, a policy promotion alters the allowed suggestion set, or runtime publication, trust posture, selected anchor, insertion-point validity, incident linkage, or final-artifact supersession drifts, invalidate stale assistive outputs, set `AssistiveWorkProtectionLease.leaseState = invalidated`, refresh the current `AssistiveCapabilityTrustEnvelope`, supersede or revoke the affected `AssistiveFeedbackChain`, freeze draft-insert, accept, regenerate, export, and completion-adjacent actions, keep the current artifact visible as stale-recoverable provenance, and require regeneration or governed recovery in place
15. task close, downstream handoff, or next-task launch may proceed only after `TaskCompletionSettlementEnvelope` reflects authoritative downstream settlement or recovery, the linked assistive continuity evidence still validates the same task shell, any required `HumanApprovalGateAssessment` has settled, and the active `AssistiveFeedbackChain` no longer has capture, approval, or adjudication work in flight; local assistive acceptance is not sufficient to collapse the task

`HumanApprovalGateAssessment.currentApproverCount` counts distinct currently eligible human approvers bound to the same `reviewVersionRef`, `decisionEpochRef`, `selectedAnchorRef`, and artifact hash. When `requiredApproverCount = 2`, the second approver must be independent of the first and may not be satisfied by the same actor re-approving or by the model-output generator. If session freshness, trust posture, continuity posture, decision-epoch truth, artifact content, or the pinned `approvalPolicyBundleRef` drifts, recompute the assessment and downgrade `eligibilityState` immediately.

`AssistiveCapabilityTrustEnvelope` is the sole authority for whether the rail may render as interactive summary, observe-only summary, provenance-only, placeholder-only, or hidden, and for whether accept, insert, reject, regenerate, export, or completion-adjacent posture may remain live. Neither a successful model run, a green watch tuple, a visible rollout rung, nor a fresh-looking rail badge may restore those affordances once workspace trust, publication, continuity, selected-anchor, or insertion-target truth has drifted.

`AssistiveFeedbackChain` is the same-chain guard for human-review truth. A regenerate or artifact-hash change must supersede the prior chain, preserving its action, override, approval, incident, and eligibility evidence for replay. A dismiss, stale-recovery, or abstention acknowledgement may append to the chain, but it may not backfill a trainable label. `AssistiveArtifactActionRecord.actionGestureKey` is the idempotency boundary for one visible human gesture, and every downstream override, approval, final-artifact, or feedback-eligibility record must point back to that same chain before it can become authoritative.

`FeedbackEligibilityFlag` is not an analytics convenience boolean. It is the settlement-backed training gate for one chain. Any later incident link, superseded final human artifact, exclusion decision, or adjudication outcome must supersede or revoke the current flag rather than mutating a previously trainable label in place.

All assistive session-gate thresholds and timers, including `ttl_live`, `ttl_grace`, `theta_dual_review`, `tau_single_reviewer_green`, and `tau_commit`, must be versioned in the active assistive approval-gate policy bundle pinned by the current `AssistiveCapabilityWatchTuple`, `AssistiveReleaseCandidate`, and workspace route family. Local thresholds are forbidden.

### Frontend work

This is where the UI must feel like a premium professional copilot.

Use a right-hand assistant rail inside the existing Clinical Workspace with:

- collapsed summary-stub entry state with capability label, confidence band, provenance footer, and freeze reason where applicable
- concise summary block
- draft note sections
- suggestion chips
- conservative confidence, expected-harm, and evidence affordances
- accept section, edit section, and reject section actions
- edited-by-clinician trail
- override-reason capture only when it adds value, not everywhere

Strong design rule: do not cover the core case information. The assistant rail should complement the review canvas, not fight it.

Apply the canonical real-time interaction rules here as well: the assistant rail must be supplementary, not layout-destabilizing. New assistive outputs or invalidation due to fresh evidence should patch in place, buffer when the clinician is actively typing, and never displace the primary review canvas without user intent.

If an assistive session becomes invalid while the clinician is editing, the rail should keep the existing text visible but freeze accept and insert actions, show why the artifact is stale, downgrade the current `AssistiveCapabilityTrustEnvelope` to `actionabilityState = regenerate_only | observe_only`, and offer regenerate-in-place rather than silently dropping the work.

If continuity evidence for the active session becomes stale or blocked, the rail must behave the same way even when the raw artifacts are still present: preserve the current text and provenance, freeze accept or insert, downgrade the current `AssistiveCapabilityTrustEnvelope` in place, and require regenerate-in-place or governed recovery before the shell can look writable again.

The assistive rail must also stay inside the same `PersistentShell` as the active review task. When continuity is unchanged, it must preserve `DecisionDock`, keep the current `SelectedAnchor`, retain the active insertion point and quiet-return target, and respect the route's `AttentionBudget`; assistive output is a bounded side stage, not a competing workspace takeover.

Accept, insert, reject, regenerate, export, and close-task affordances must only stay live while the current `ReviewActionLease`, workspace-consistency projection, workspace-slice trust projection, current `WorkspaceTrustEnvelope`, current `AssistiveCapabilityTrustEnvelope`, current `DecisionEpoch`, surface publication state, and any active `AssistiveDraftInsertionPoint` or `AssistiveDraftPatchLease` all remain valid. `AssistiveCapabilityTrustEnvelope.actionabilityState = enabled` is therefore mandatory for live action controls, and `completionAdjacencyState = allowed` is mandatory for any completion-adjacent cue. If any of those drift, the rail keeps the current artifact visible as read-only provenance or placeholder and applies the bound `ReleaseRecoveryDisposition` in place rather than dropping the user into a generic stale panel.

Override capture must be progressive but deterministic. Cosmetic wording edits may keep reason capture optional, but `rejected_to_alternative`, materially different edits, low-confidence or high-harm acceptances, policy exceptions, and trust-recovery decisions must require explicit reason codes before the assistive session can settle. The UI must show the current provenance footer, confidence band, and before-or-after diff at the capture point so override reasons are anchored to the actual contested artifact rather than to operator memory.

Also add keyboard-first flows for power users:

- accept section
- jump to evidence
- insert draft into note
- dismiss suggestion
- regenerate when allowed

### Tests that must pass before moving on

- stale-output invalidation tests
- policy-bundle and review-version fence rejection tests for stale `AssistiveSession`
- work-protection-lease tests covering typing, compare, confirm, and highlighted-delta review without assistive rail churn
- concurrent-edit consistency tests
- gesture-deduplication tests proving one visible gesture mints exactly one authoritative `AssistiveArtifactActionRecord`
- audit completeness tests for accepts, edits, rejects, and human abstains
- suggestion-action and assistive-session audit-link tests proving one user gesture cannot fork into mismatched ledgers
- section-accept fidelity tests
- final-human-artifact writeback tests
- feedback-chain supersession tests for regenerate, dismiss, stale-recovery, and artifact-hash drift
- dual-review burden tests for high-risk or externally consequential assistive artifacts
- feedback-eligibility and adjudication-routing tests for incident-linked or policy-exception overrides
- feedback-eligibility revocation tests for incident linkage, final-artifact supersession, and excluded counterfactual evidence
- review-action-lease rejection tests for stale queue, review-version, or lineage drift
- task-completion-settlement tests proving assistive acceptance cannot visually close or advance the task early
- assistive continuity-evidence tests proving stale or blocked continuity proof freezes accept, insert, and next-task posture in place
- assistive-capability-trust-envelope tests proving `shadow_only`, `degraded`, `quarantined`, `frozen`, `observe_only`, and `blocked_by_policy` postures freeze in place without overclaiming confidence, rollout, or actionability
- decision-epoch drift tests proving endpoint reasoning drafts and approval-gated assistive commits cannot survive a superseded triage decision
- insertion-point and assistive-patch-lease tests proving accept or insert cannot target a hidden, superseded, or drifted editor slot
- override-reason requirement tests for material edits, policy exceptions, and trust-recovery decisions
- UI telemetry disclosure-fence tests for accept, reject, regenerate, dismiss, abstention acknowledgement, and insert flows
- distinct-approver and no-self-approval tests for dual-review `HumanApprovalGateAssessment`
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
`comparisonRunId`, `assistiveSessionRef`, `humanOutcomeRef`, `modelOutcomeRef`, `deltaMetricsRef`, `overrideDispositionRef`, `incidentOutcomeRef`, `decisionLatencyMs`

**DriftSignal**  
`driftSignalId`, `capabilityCode`, `metricCode`, `segmentKey`, `detectorType = representation_mmd | output_js | performance_delta | calibration_gap | fairness_gap`, `effectSize`, `evidenceValue`, `observedAt`, `severity`, `triggerState`

**BiasSliceMetric**  
`sliceMetricId`, `capabilityCode`, `sliceDefinition`, `metricCode`, `posteriorMean`, `intervalLow`, `intervalHigh`, `effectiveSampleSize`, `referenceSliceRef`, `metricSet`, `windowRef`, `actionState`

**AssistiveKillSwitch**  
`killSwitchId`, `scope`, `triggeredBy`, `triggeredAt`, `fallbackMode`

**ReleaseGuardThreshold**  
`thresholdId`, `capabilityCode`, `metricCode`, `metricLevel = visible | insert | commit | release`, `targetRiskAlpha`, `minimumSampleSize`, `intervalMethodRef`, `sequentialDetectorPolicyRef`, `warningLevel`, `blockLevel`

**AssistiveIncidentLink**  
`incidentLinkId`, `assistiveSessionRef`, `incidentSystemRef`, `severity`, `investigationState`

**AssistiveCapabilityWatchTuple**
`assistiveCapabilityWatchTupleId`, `capabilityCode`, `releaseCandidateRef`, `rolloutLadderPolicyRef`, `modelVersionRef`, `promptBundleHash`, `policyBundleRef`, `releaseCohortRef`, `surfaceRouteContractRefs[]`, `runtimePublicationBundleRef`, `calibrationBundleRef`, `uncertaintySelectorVersionRef`, `conformalBundleRef`, `thresholdSetRef`, `watchTupleHash`

**AssistiveCapabilityTrustProjection**
`assistiveCapabilityTrustProjectionId`, `watchTupleHash`, `capabilityCode`, `releaseCandidateRef`, `rolloutLadderPolicyRef`, `audienceTier`, `assuranceSliceTrustRefs[]`, `incidentRateRef`, `surfacePublicationState`, `runtimePublicationBundleRef`, `assistiveKillSwitchStateRef`, `releaseFreezeRecordRef`, `freezeDispositionRef`, `releaseRecoveryDispositionRef`, `trustScore`, `trustPenaltyRef`, `thresholdState = green | warn | block`, `trustState = trusted | degraded | quarantined | shadow_only | frozen`, `visibilityEligibilityState = visible | observe_only | blocked`, `insertEligibilityState = enabled | observe_only | blocked`, `approvalEligibilityState = single_review | dual_review | blocked`, `rolloutCeilingState = shadow_only | visible | observe_only | blocked`, `fallbackMode`, `evaluatedAt`

**AssistiveCapabilityRolloutVerdict**
`assistiveCapabilityRolloutVerdictId`, `capabilityCode`, `watchTupleHash`, `releaseCandidateRef`, `rolloutSliceContractRef`, `routeFamilyRef`, `audienceTier`, `releaseCohortRef`, `sliceMembershipState = in_slice | out_of_slice | unknown | superseded`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `trustProjectionRef`, `releaseFreezeRecordRef`, `freezeDispositionRef`, `policyState = exact | stale | blocked`, `publicationState = published | stale | withdrawn | blocked`, `shadowEvidenceState = complete | stale | missing | blocked`, `visibleEvidenceState = complete | stale | missing | blocked`, `insertEvidenceState = complete | stale | missing | blocked`, `commitEvidenceState = complete | stale | missing | blocked`, `rolloutRung = shadow_only | visible_summary | visible_insert | visible_commit | frozen | withdrawn`, `renderPosture = shadow_only | visible | observe_only | blocked`, `insertPosture = enabled | observe_only | blocked`, `approvalPosture = single_review | dual_review | blocked`, `fallbackMode`, `verdictState = current | stale | superseded | blocked`, `evaluatedAt`

**AssistiveOpsSurfaceBinding**
`assistiveOpsSurfaceBindingId`, `routeFamilyRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `requiredTrustRefs[]`, `releaseRecoveryDispositionRef`, `validatedAt`

**AssistiveOpsActionLease**
`assistiveOpsActionLeaseId`, `watchTupleHash`, `actionScope`, `routeIntentBindingRef`, `surfaceBindingRef`, `trustProjectionRef`, `rolloutVerdictRef`, `policyBundleRef`, `eligibilityState = executable | observe_only | blocked`, `expiresAt`

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
- Brier score, classwise ECE, and selective calibration error for any surfaced confidence
- multicalibration gap across configured operational and protected subgroup families
- selective risk at the live abstention and insert thresholds
- allowed-set mass floor breach rate and OOD or epistemic block rate
- over-reliance, under-reliance, and appropriate-reliance rates from settled human dispositions
- false reassurance risk signals
- Jensen-Shannon divergence, MMD, or equivalent representation-aware drift metrics for feature and output drift
- performance by request type, channel, accent and dialect slice where appropriate, and tenant
- disclosure-fence block or redaction violation rate for assistive UI events

For binary or rate metrics, use Wilson or Beta-Binomial intervals rather than raw point estimates. For slice `g` and metric `m`, maintain `[LCB_95(m_g), UCB_95(m_g)]`. For distribution-shift metrics, require both an effect-size floor and sequential evidence, not a single p-value snapshot.

Measure subgroup calibration explicitly rather than inferring it from aggregate ECE. A suitable release and live-monitoring statistic is `MCGap_c(G) = sup_{g in G, b in B} | E[1{correct} | g(X)=1, conf(X) in b] - E[conf(X) | g(X)=1, conf(X) in b] |`, where `G` is the configured family of operational and protected slices and `B` is the confidence-bucket family used in production.

For fairness, compare only within clinically comparable strata. Let `Delta_m(g,s) = m_g,s - m_ref,s`. Use hierarchical shrinkage or pooled interval estimation for small slices and trigger action only when `effectiveSampleSize >= n_min` and interval evidence is decisive, for example `UCB_95(harmGap_g,s) > theta_harm_gap_block` or `LCB_95(coverage_g,s) < theta_coverage_block`. Small noisy slices may stay watch-only, but they may not be silently treated as healthy.

Use interval-aware and sequentially valid thresholds rather than point estimates alone. Any block-level threshold breach should auto-downgrade the capability to shadow or off, for example when `LCB_95(precision_slice) < theta_precision_block`, `UCB_95(falseReassuranceRate) > theta_false_reassurance_block`, `UCB_95(selectiveCalibrationError_slice) > theta_sce_block`, `MCGap_c(G) > theta_mc_block`, or a configured sequential drift detector crosses its evidence boundary.

Do not treat all monitors as independent red-amber-green counters. Compute a normalized trust penalty `P(t) = sum_i w_i * delta_i(t)`, where each `delta_i(t) in [0,1]` is the normalized severity of calibration, selective-risk, drift, fairness, incident, disclosure-fence, and staleness failures for the active watch tuple. Then compute `trustScore(t) = 1{publication = published} * 1{runtime_bundle = current} * 1{no_hard_freeze} * exp(-P(t))`.

Map the score monotonically into operational states:

- `trusted` when `trustScore >= tau_trusted` and no hard blocker is active
- `degraded` when `tau_quarantine <= trustScore < tau_trusted`
- `quarantined` when `trustScore < tau_quarantine` or any hard blocker fires
- `shadow_only` when calibration, uncertainty, or outcome-evidence requirements for visible use are incomplete
- `frozen` when `AssistiveReleaseFreezeRecord.freezeState = frozen`

If thresholds are refreshed online as more settled outcomes arrive, use anytime-valid conformal risk control or an equivalent sequentially valid procedure; fixed-size calibration guarantees may not be reused after optional stopping.

`AssistiveCapabilityTrustProjection` remains the capability-wide trust floor, but it is not by itself the UI authority for shadow, visible, insert, or commit posture. Every route family and cohort slice must publish one `AssistiveCapabilityRolloutVerdict` that combines the current trust projection, the active `AssistiveRolloutSliceContract`, route contract, runtime publication, current `AssistiveKillSwitchState`, and any open `AssistiveReleaseFreezeRecord` into one monotonic ceiling for visible behavior.

`AssistiveKillSwitch` is the operator command record, not the live safety truth. Trust, rollout, and same-shell UI decisions must consume the current materialized `AssistiveKillSwitchState`, and visible companion posture must then converge through one current `AssistiveCapabilityTrustEnvelope` rather than reading historical kill-switch commands, rollout labels, or raw trust counters directly.

Visible assistive controls must therefore depend on one current `AssistiveCapabilityTrustEnvelope` assembled from `AssistiveCapabilityTrustProjection`, `AssistiveCapabilityRolloutVerdict`, the published runtime contract, and the governing recovery posture. Compute eligibility monotonically from the active trust projection and rollout verdict:

- `visibilityEligibilityState = visible` only when `trustScore >= tau_visible`, `thresholdState != block`, and publication plus runtime posture are current
- `insertEligibilityState = enabled` only when `trustScore >= tau_insert` and the stricter insert gate for the active capability is satisfied
- `approvalEligibilityState = single_review | dual_review | blocked` from the active trust posture plus the capability-level approval-burden policy for the current watch tuple
- `AssistiveCapabilityRolloutVerdict.renderPosture = visible` only when the active slice is `in_slice`, `rolloutRung >= visible_summary`, `visibleEvidenceState = complete`, `publicationState = published`, and the trust projection remains at least `visibilityEligibilityState = visible`
- `AssistiveCapabilityRolloutVerdict.insertPosture = enabled` only when `rolloutRung >= visible_insert`, `insertEvidenceState = complete`, `publicationState = published`, and the trust projection still allows insert
- `AssistiveCapabilityRolloutVerdict.approvalPosture` may widen to `single_review | dual_review` only when `rolloutRung = visible_commit`, `commitEvidenceState = complete`, and the active approval-gate policy bundle still matches the watch tuple and release candidate

Different tenants, route families, and visible cohorts must therefore publish different rollout verdict rows when their slice contract, route contract, runtime publication bundle, or freeze posture differs. The same `watchTupleHash` is not enough to imply identical visible posture across surfaces.

`approvalEligibilityState` is the capability-level upper bound only. Any concrete externally consequential commit must still materialize and satisfy its own `HumanApprovalGateAssessment`; capability posture alone may never stand in for artifact-level review burden. The projection and rollout verdict compute ceilings, but the current `AssistiveCapabilityTrustEnvelope` is the only surface authority for interactive, observe-only, provenance-only, placeholder, hidden, enabled, regenerate-only, or blocked posture.

If the relevant assurance slice becomes `degraded`, `quarantined`, `shadow_only`, or `frozen`, if `surfacePublicationState` is stale, conflicting, or withdrawn, if rollout-slice evidence is stale or missing, or if disclosure-fence health is below floor, the workspace must refresh the current `AssistiveCapabilityTrustEnvelope`, suppress fresh accept or insert controls, retain provenance, and apply the bound `ReleaseRecoveryDisposition` in place. The Assistive Ops view must expose exact blocking slices, watch tuple hash, rollout rung, trust score, runtime publication state, slice membership, recovery disposition, disclosure-fence health, and current envelope posture rather than flattening the capability into a generic healthy or unavailable chip.

Assistive Ops actions such as freeze, narrow cohort, kill switch, shadow-only downgrade, visible-summary promotion, visible-insert promotion, governed-commit promotion, or rollback recommendation must resolve one `RouteIntentBinding`, one `AssistiveOpsActionLease`, one current `AssistiveCapabilityRolloutVerdict`, and one canonical action-settlement chain before the UI implies completion. If trust, publication, slice membership, or route posture drifts, the Ops surface must stay in the same shell and downgrade to observe-only or blocked posture through the declared `ReleaseRecoveryDisposition`.

### Frontend work

Add an internal Assistive Ops view for safety, product, and clinical leads.

It should show:

- visible vs shadow cohorts
- drift alerts
- bias slices
- unsafe suggestion review queue
- capability kill switches
- watch tuple hashes and trust projections
- runtime publication state and recovery dispositions
- version rollout map
- incident links
- disclosure-fence violations and redaction blocks

Keep it dense and serious. This is not a marketing dashboard.

The Assistive Ops surface must materialize beneath one published `AssistiveOpsSurfaceBinding`. Watch-tuple tiles may remain readable when trust degrades, but intervention controls may not stay live unless the active `AssistiveOpsActionLease` is `executable`.

### Tests that must pass before moving on

- drift alert firing tests with effect-size and sequential-evidence thresholds
- kill-switch tests
- shadow-visible isolation tests
- fairness-slice metric tests with minimum-sample and hierarchical-shrinkage behavior
- multicalibration-gap monitoring tests
- incident-link propagation tests
- threshold-trigger rollback tests
- degraded-trust and frozen-capability rendering tests
- publication-stale and recovery-disposition rendering tests
- rollout-verdict monotonicity tests across `shadow_only`, `visible_summary`, `visible_insert`, and `visible_commit`
- route-family and cohort split tests proving one watch tuple can publish different rollout verdicts without widening the wrong slice
- disclosure-fence monitoring tests
- trust-score and eligibility-state monotonicity tests
- dashboard data lineage tests
- calibration-bundle, conformal-bundle, and threshold-set pinning tests for `AssistiveCapabilityWatchTuple`

### Exit state

The assistive layer can now be run like a governed production capability instead of a static model deployment.

---

## 8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control

This sub-phase formalises what has to happen when AI is added to a real NHS-integrated product.

Current IM1 guidance says AI products go through documentation review during pairing, including DCB0129 safety material, DPIA, and medical device registration where applicable, but that AI-specific technical assurance stays out of scope for IM1 and remains the deploying organisation’s responsibility. It also says that when an assured product evolves through AI integration or other significant enhancement, a formal RFC and updated SCAL are required. DTAC still applies alongside, rather than instead of, other approvals. ([NHS England Digital][2])

### Backend and assurance work

Create a formal model-change control system.

High-priority governance gaps in this layer:

1. approval is currently too loosely tied to version refs and not to one immutable release candidate containing model, prompt, policy, schema, evaluation, and deployment material
2. change classes are too coarse to prove when IM1 RFC, DTAC delta, DCB0129 update, DPIA rerun, or medical-device reassessment is required
3. signoff topology does not yet enforce independent safety, product, and deployment approval or prevent self-approval
4. assurance evidence is listed but not pinned to one standards baseline with freshness, expiry, and supplier-drift semantics
5. rollback target selection is mentioned without proof that rollback artifacts, config, and kill-switch behavior remain safe and compatible

Suggested objects:

**ModelChangeRequest**  
`changeRequestId`, `capabilityCode`, `changeType`, `currentVersionRef`, `proposedVersionRef`, `releaseCandidateRef`, `impactAssessmentRef`, `intendedUseImpact`, `safetyImpact`, `approvalState`, `requestedBy`, `requestedAt`

**RFCBundle**  
`rfcBundleId`, `im1ProductRef`, `changeRequestId`, `releaseCandidateRef`, `SCALDeltaRef`, `safetyCaseDeltaRef`, `documentationRefs`, `evidenceBaselineRef`, `approvalGraphRef`, `submissionState`, `expiresAt`

**MedicalDeviceAssessmentRef**  
`assessmentRefId`, `capabilityCode`, `intendedUseProfileRef`, `boundaryDecisionRef`, `assessmentOutcome`, `registrationState`, `evidenceRefs`, `reviewDueAt`

**SafetyCaseDelta**  
`deltaId`, `hazardChanges`, `controlsAdded`, `hazardTraceRef`, `controlVerificationRefs`, `residualRiskRef`, `testEvidenceRef`, `signoffState`

**SubprocessorAssuranceRef**  
`subprocessorRefId`, `supplierName`, `suppliedModelOrServiceRefs`, `safetyEvidenceRef`, `dpiaRef`, `contractualControlRef`, `assuranceVersion`, `assuranceFreshUntil`, `driftState`, `suspensionState`

**AssistiveReleaseCandidate**
`releaseCandidateId`, `capabilityCode`, `rolloutLadderPolicyRef`, `rolloutSliceContractRefs[]`, `watchTupleHash`, `modelVersionRef`, `promptPackageRef`, `compiledPolicyBundleRef`, `outputSchemaBundleRef`, `surfaceRouteContractRefs[]`, `runtimePublicationBundleRef`, `recoveryDispositionSetRef`, `artifactPresentationPolicyRef`, `uiTelemetryDisclosureBaselineRef`, `evaluationCorpusRef`, `calibrationBundleRef`, `uncertaintySelectorVersionRef`, `conformalBundleRef`, `thresholdSetRef`, `replayHarnessVersionRef`, `containerOrRuntimeImageRef`, `subprocessorRefs`, `rollbackBundleRef`, `candidateHash`, `candidateState`

**ChangeImpactAssessment**
`impactAssessmentId`, `changeRequestId`, `surfaceDeltaRefs`, `surfacePublicationDeltaRefs`, `rolloutLadderDelta`, `rolloutSliceDeltaRefs[]`, `workflowDecisionDelta`, `artifactDeliveryDelta`, `uiTelemetryDisclosureDelta`, `intendedUseDelta`, `medicalPurposeBoundaryState`, `im1RfcRequired`, `dtacDeltaRequired`, `dcb0129DeltaRequired`, `dpiaDeltaRequired`, `mhraAssessmentRequired`, `blockingReasonCodes`

**ReleaseApprovalGraph**
`approvalGraphId`, `changeRequestId`, `requiredApproverRoles`, `currentApprovalState`, `noSelfApprovalState`, `independentSafetyReviewerRef`, `deploymentApproverRef`, `signoffRefs`, `completedAt`

**AssuranceBaselineSnapshot**
`baselineSnapshotId`, `im1GuidanceVersionRef`, `dtacVersionRef`, `dcbStandardVersionRef`, `dpiaRef`, `scalVersionRef`, `medicalDeviceAssessmentRef`, `evaluationDatasetRef`, `replayHarnessVersionRef`, `freshUntil`, `supersededAt`

**RollbackReadinessBundle**
`rollbackBundleId`, `releaseCandidateRef`, `rollbackTargetRef`, `dataCompatibilityState`, `policyCompatibilityState`, `killSwitchPlanRef`, `operatorRunbookRef`, `verificationEvidenceRefs`, `bundleState`

**AssuranceFreezeState**
`assuranceFreezeStateId`, `scopeRef`, `freezeReasonCode`, `triggerRef`, `activatedBy`, `activatedAt`, `liftCriteria`, `freezeState`

**AssistiveReleaseActionRecord**
`assistiveReleaseActionRecordId`, `releaseCandidateRef`, `rolloutSliceContractRef`, `rolloutVerdictRef`, `actionType = approve | promote | freeze | unfreeze | rollback`, `routeIntentBindingRef`, `commandActionRecordRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`, `idempotencyKey`, `actorRef`, `createdAt`, `settledAt`

**AssistiveReleaseActionSettlement**
`assistiveReleaseActionSettlementId`, `assistiveReleaseActionRecordRef`, `commandSettlementRecordRef`, `uiTransitionSettlementRecordRef`, `uiTelemetryDisclosureFenceRef`, `presentationArtifactRef`, `result = approved | promoted | frozen | unfrozen | rollback_started | stale_recoverable | denied_scope | blocked_policy | failed`, `recoveryActionRef`, `recordedAt`

Classify changes into:

- copy or template-only change
- prompt or threshold change
- model version change
- subprocessor or inference-host change
- capability expansion
- intended-use change
- regulatory posture change

Then route them accordingly. For example:

- template-only changes may proceed only if the `ChangeImpactAssessment` proves no medical-purpose, workflow-decision, rollout-ladder, slice-membership, or patient-facing wording delta and the `AssistiveReleaseCandidate` hash remains stable
- threshold or prompt changes may need evaluation rerun against the pinned `AssuranceBaselineSnapshot`, updated safety signoff, and replay proof for affected routes
- model version, subprocessor, or inference-host changes may require replay, supplier-assurance freshness checks, updated rollback evidence, and deployment freeze if drift is unresolved
- capability expansion or visible endpoint suggestion changes may require full safety-case delta, updated SCAL material, and IM1 RFC
- intended-use or regulatory-posture changes may require renewed medical-device assessment, updated product wording, and deployment signoff

Use this control algorithm:

1. materialize one immutable `AssistiveReleaseCandidate` before any approval work starts
2. derive `ChangeImpactAssessment` from intended use, visible surfaces, workflow effects, and medical-purpose boundary deltas
3. pin the `AssuranceBaselineSnapshot` and active `SubprocessorAssuranceRef` set that the release will rely on
4. compile or refresh the published assistive `AudienceSurfaceRouteContract` set, `RuntimePublicationBundle`, `ReleaseRecoveryDisposition` set, `ArtifactPresentationContract` policy, UI telemetry disclosure baseline, `AssistiveRolloutLadderPolicy`, and exact `AssistiveRolloutSliceContract` set that the release will rely on
5. build the `RFCBundle` and `ReleaseApprovalGraph`, enforcing no self-approval and independent safety signoff
6. generate `RollbackReadinessBundle` and verify kill-switch, rollback target, runtime publication parity, and operator runbook compatibility
7. for any approve, promote, freeze, unfreeze, or rollback action, resolve one `RouteIntentBinding`, one exact `AssistiveRolloutSliceContract`, one current `AssistiveCapabilityRolloutVerdict`, persist one canonical `CommandActionRecord`, and require one authoritative `CommandSettlementRecord` before the release-admin shell implies completion
8. block promotion if the baseline is stale, supplier assurance is drifted or suspended, runtime publication or disclosure baseline is incomplete, rollout-ladder or slice-contract proof is incomplete, rollback proof is incomplete, or the approval graph is not satisfied
9. if post-approval drift appears before or during rollout, set `AssuranceFreezeState`, bind one `TransitionEnvelope`, and require explicit re-clearance before the candidate can move again through the declared `ReleaseRecoveryDisposition`

This is also the right place to draw the medical-purpose boundary explicitly. Based on current NHS and MHRA guidance, simple verified transcription is a different class of product risk from generative summarisation that informs clinical decisions. So keep the capability manifests, safety case, and product wording aligned.

No regulatory or deployment approval may attach directly to loose version refs. Approval must attach to the `AssistiveReleaseCandidate.candidateHash`, the pinned `AssuranceBaselineSnapshot`, the exact `RuntimePublicationBundle`, the exact `AssistiveRolloutLadderPolicy`, the exact `AssistiveRolloutSliceContract` set, the assistive UI telemetry disclosure baseline, and the exact `RollbackReadinessBundle` that will be available at rollout time.

### Frontend work

Build a slim internal Assistive Release Admin surface for approved engineering and safety users only.

It should support:

- current live model versions
- immutable release-candidate identity and diff view
- prompt template versions
- cohort rollout states
- pending change requests
- regulatory-trigger view for IM1, DTAC, DCB0129, DPIA, and medical-device reassessment
- safety signoff state
- approval-graph progress with signer coverage and self-approval rejection
- evidence-baseline freshness and supplier-drift state
- route-contract and runtime-publication parity
- recovery-disposition and artifact-presentation policy deltas
- rollback target selection
- rollback-readiness and assurance-freeze state

Do not let production model changes happen through environment variables and hope.

Release-candidate diffs, replay-gate summaries, approval evidence, rollback bundles, and operator runbooks must render through governed `ArtifactPresentationContract` rather than ad hoc file handoff. Any external export, print, or browser handoff from Release Admin must consume `OutboundNavigationGrant` tied to the current candidate hash, masking or disclosure policy, and return path.

All internal assistive operator surfaces in this phase, including evaluation workbench, transcript review, Assistive Ops, Release Admin, and rollout freeze transitions, must emit canonical UI observability:

- one `UIEventEnvelope`
- one `UITransitionSettlementRecord` whenever local acknowledgement can diverge from authoritative action, recovery, or publication posture
- one `UITelemetryDisclosureFence` proving that task refs, route params, transcript fragments, evidence spans, candidate hashes, and operator notes were redacted to the permitted disclosure class

### Tests that must pass before moving on

- change-control workflow tests
- version immutability tests
- evidence-completeness tests for RFC bundles
- release-candidate hash and approval-binding tests
- regulatory-routing tests for medical-purpose and visible-surface deltas
- separation-of-duties and self-approval rejection tests
- evidence-baseline freshness and supplier-drift freeze tests
- runtime-publication and route-contract parity tests
- rollout-ladder policy and slice-contract hash-binding tests
- shadow-summary-insert-commit rung isolation tests on `AssistiveReleaseCandidate`
- disclosure-baseline completeness tests
- calibration, uncertainty-selector, conformal, and threshold-set binding tests on `AssistiveReleaseCandidate`
- rollback-package tests
- rollback-readiness compatibility and kill-switch proof tests
- model-registry integrity tests
- tenant-cohort change-isolation tests

### Exit state

Every material assistive change is now governable through an immutable release candidate, pinned regulatory baseline, independent signoff graph, supplier-aware freshness controls, and rollback or freeze proof before it enters an NHS-assured deployment environment.

---

## 8I. Pilot rollout, controlled slices, and formal exit gate

This sub-phase turns the assistive layer into a safe live capability.

NHS guidance on AI-enabled documentation tools is clear that pilots should not be used to bypass compliance, and that monitoring, safety, governance, and training still need to be in place. ([NHS England][1])

### Backend work

Run rollout in clearly separated slices.

Add the typed rollout-ladder objects:

**AssistiveRolloutSliceContract**
`assistiveRolloutSliceContractId`, `capabilityCode`, `releaseCandidateRef`, `releaseCohortRef`, `routeFamilyRef`, `audienceTier`, `cohortSelectorRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `watchTupleHash`, `requiredShadowEvidenceRefs[]`, `requiredVisibleEvidenceRefs[]`, `requiredInsertEvidenceRefs[]`, `requiredCommitEvidenceRefs[]`, `requiredDisclosureFenceBaselineRef`, `requiredArtifactPresentationContractRef`, `requiredContinuityEvidenceRef`, `maxRolloutRung = shadow_only | visible_summary | visible_insert | visible_commit`, `fallbackMode = shadow_only | observe_only | read_only_provenance | placeholder_only | assistive_hidden`, `sliceContractHash`, `sliceState = draft | published | frozen | superseded | withdrawn`, `publishedAt`

Add the visible-rollout freeze objects:

**AssistiveReleaseFreezeRecord**
`assistiveReleaseFreezeRecordId`, `capabilityCode`, `releaseCandidateRef`, `rolloutSliceContractRef`, `rolloutVerdictRef`, `routeFamilyRef`, `audienceTier`, `releaseCohortRef`, `watchTupleHash`, `policyBundleRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releaseRecoveryDispositionRef`, `rolloutRungAtFreeze = shadow_only | visible_summary | visible_insert | visible_commit`, `fallbackMode`, `triggerType = threshold_breach | trust_degraded | trust_quarantined | policy_drift | publication_stale | incident_spike`, `freezeState = monitoring | frozen | shadow_only | released`, `openedAt`, `releasedAt`

**AssistiveFreezeDisposition**
`assistiveFreezeDispositionId`, `capabilityCode`, `rolloutVerdictRef`, `freezeMode = shadow_only | read_only_provenance | placeholder_only | assistive_hidden`, `staffMessageRef`, `recoveryActionRef`, `releaseRecoveryDispositionRef`, `preserveVisibleArtifacts`, `appliesToRouteFamilies[]`

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

`AssistiveRolloutSliceContract` is the only legal bridge from those slice labels to live user-facing behavior. Every route family, tenant or cohort selector, and audience tier that can see assistive chrome must therefore resolve one published slice contract plus one current `AssistiveCapabilityRolloutVerdict`; slice labels, tenancy flags, and feature toggles are not rollout authority on their own.

Track these metrics from day one:

- staff adoption rate
- section accept rate
- mean edit distance
- unsafe suggestion rate
- abstention rate
- review-time change
- note-completion time
- selective calibration error and multicalibration gap for visible capabilities
- over-reliance and under-reliance rates for assistive-seeded decisions
- critical omission rate
- drift and fairness alerts
- kill-switch activations
- incident count linked to assistive use

Every visible slice must pin one `AssistiveCapabilityWatchTuple`, one published `AudienceSurfaceRouteContract`, one `RuntimePublicationBundle`, one `AssistiveRolloutSliceContract`, and one current `AssistiveCapabilityRolloutVerdict`. If thresholds breach, trust projection degrades, policy bundle drifts, rollout-slice evidence becomes stale, runtime publication becomes stale or withdrawn, or incidents cross the configured ceiling, open `AssistiveReleaseFreezeRecord`, refresh the current `AssistiveCapabilityTrustEnvelope`, and apply the capability's governed `AssistiveFreezeDisposition` plus `ReleaseRecoveryDisposition` without changing the underlying workspace route family. A frozen assistive slice may degrade to shadow-only, read-only provenance, placeholder-only, or fully hidden assistive chrome, but it may not leave stale insert actions live or imply the capability is still trusted.

Promotion through the rollout ladder must be monotonic and typed:

1. `shadow_only` allows shadow comparison and operator diagnostics only; no staff-visible summary chrome is legal
2. `visible_summary` allows summary stub, provenance, and bounded observe-only interaction, but not insert
3. `visible_insert` allows draft insertion where the active route family and trust projection also permit it, but it does not widen commit or approval posture on its own
4. `visible_commit` only lifts the assistive capability ceiling for governed human approval; concrete workflow settlement still depends on `HumanApprovalGateAssessment`, the current `AssistiveCapabilityTrustEnvelope`, `CommandSettlementRecord`, and any route-specific recovery law
5. any stale, missing, blocked, or out-of-slice state must degrade in place to `shadow_only`, `observe_only`, `read_only_provenance`, `placeholder_only`, or `assistive_hidden` through the published `AssistiveFreezeDisposition`

Route-family, tenant, and cohort differences must be expressed by different `AssistiveRolloutSliceContract` rows and therefore different rollout verdicts. The same watch tuple may be `visible_insert` on one narrow staff route and `shadow_only` or `observe_only` everywhere else.

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

If a capability freezes mid-session, the same shell must remain stable. Existing visible artifacts may stay as read-only provenance when policy allows, but insert, accept, regenerate, export, and browser-handoff actions must obey `AssistiveFreezeDisposition`, `ReleaseRecoveryDisposition`, and any `ArtifactPresentationContract` immediately and show the governing reason in context.

Training packs, freeze explanations, and rollout evidence shown during pilot slices must also render through governed `ArtifactPresentationContract`; external handoff for those materials must consume `OutboundNavigationGrant` and preserve a safe return into the same rollout or workspace shell.

### Tests that must all pass before Phase 9

- no Sev-1 or Sev-2 defects in visible assistive workflows
- no-autonomous-write policy proven in production-like environments
- gold-set thresholds green for all visible capabilities
- selective-calibration, multicalibration, and conformal-risk targets green for all visible capabilities
- shadow-vs-human comparison stable across release cohorts
- drift and fairness alerting live
- override, reliance, and audit trail complete
- stale-output invalidation proven
- watch-tuple pinning and freeze-disposition behavior proven for every visible slice
- rollout-slice-contract and rollout-verdict parity proven for every shadow, summary, insert, and governed-commit slice
- route-family and cohort split tests proving the same watch tuple cannot imply wider visible posture on a different slice
- runtime-publication pinning and recovery-disposition behavior proven for every visible slice
- artifact-presentation and outbound-navigation policy behavior proven for visible assistive artifacts
- assistive UI-event and disclosure-fence behavior proven for live visible slices
- RFC and safety-case delta process proven for material AI changes
- rollback rehearsal completed
- training, runbooks, and incident paths completed

### Exit state

The assistive layer is now live, bounded, auditable, and genuinely useful without becoming the decision-maker.

---

## Recommended rollout slices inside Phase 8

Use the canonical Slice 8.1 to 8.5 rollout taxonomy defined in 8I above. Do not fork a second rollout vocabulary or drift the slice meanings in summary sections; any shorter recap here must remain semantically identical to the 8I definitions.

## System after Phase 8

After this phase, Vecells gains a real assistive layer that sits exactly where the architecture intended it to sit: on top of the same review workflow, the same feature store, the same event history, and the same audit spine. Staff get transcription, note drafting, summary generation, question suggestions, and bounded endpoint recommendations, but every meaningful action still flows through a human checkpoint, every assistive output is versioned and replayable, and every release is governed by clinical safety, DTAC, IM1 change control, and explicit rollout thresholds. ([NHS England][1])

[1]: https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/ "NHS England » Guidance on the use of AI-enabled ambient scribing products in health and care settings"
[2]: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration "IM1 Pairing integration - NHS England Digital"
