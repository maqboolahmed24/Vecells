# Phase 9 - The Assurance Ledger

**Working scope**  
Operations console, assurance, resilience, and production hardening.

This is the phase where the Vecells platform stops being feature-complete and becomes operationally provable. The architecture already reserves the right primitives for this: an Operations Console, a WORM Audit Ledger, event domains that include `analytics.*` and `audit.*`, and an explicit Analytics and Assurance domain that produces live dashboards and monthly assurance packs. It also already treats break-glass and immutable audit as first-class controls, not admin afterthoughts.

Current NHS assurance expectations make this phase a core product phase, not a post-build tidy-up. The DSPT is the self-assessment tool that all organisations with access to NHS patient data and systems must use. DTAC still spans 5 areas: clinical safety, data protection, technical security, interoperability, and usability or accessibility. DCB0129 and DCB0160 remain mandatory. The newer CAF-aligned DSPT raises the bar on response-and-recovery testing and on understanding the systems and dependencies required to restore essential functions. The Records Management Code of Practice remains the retention framework and the HTML version is now explicitly the most up-to-date version. ([NHS England Digital][1])

There is also a practical platform-hygiene implication now. NHS England states that `developer.nhs.uk` and the old FHIR servers were decommissioned on 2 March 2026, and that essential content has been migrated or archived. So the final hardening phase should actively remove legacy documentation links, stale implementation references, and unsupported dependency assumptions from the product, runbooks, and support materials. ([NHS England Digital][2])

## Phase 9 objective

By the end of this phase, Vecells must be able to do all of the following as a normal part of running the service:

- derive live operational state from the same event history that runs the product
- expose queue health, breach risk, delivery health, access equity, and dependency health in one operations surface
- make every sensitive action searchable and reviewable through immutable audit
- generate monthly and on-demand assurance packs from evidence, not spreadsheets
- prove restore, failover, and incident-response capability through repeated rehearsal
- manage retention, deletion, and legal hold through policy-driven lifecycle controls
- run incident, breach, and near-miss workflows with reportability assessment and traceable follow-up
- version tenant configuration, policy packs, standards mappings, and evidence schemas so the whole platform remains governable over time

## Overall Phase 9 algorithm

1. Turn the event spine into an assurance spine.
2. Build operational projections and service-level health views from domain events.
3. Build a first-class audit and break-glass review system on top of the WORM ledger.
4. Map evidence continuously to DSPT, DTAC, DCB0129, DCB0160, and local operating controls.
5. Attach retention, deletion, archive, and legal-hold policy to every durable artifact type.
6. Define essential functions, dependencies, and recovery tiers, then rehearse restore and failover.
7. Operationalise incident handling, reportability assessment, post-incident review, and staff exercises.
8. Lock tenant config, policy versioning, dependency hygiene, and standards change control.
9. Transfer the whole platform into repeatable BAU with evidence-producing operations.

## What Phase 9 must prove before the core blueprint is considered complete

Before the core product can be considered production-complete, all of this needs to be true:

- one evidence spine exists across patient, staff, booking, hub, pharmacy, and assistive workflows
- operational dashboards and assurance packs are built from the same underlying truth
- break-glass, override, and config-change events are queryable and reviewable
- backup existence is not assumed; restore is repeatedly proven
- incidents, near misses, and reportable breaches can be handled inside a controlled workflow
- retention and deletion are policy-driven and auditable
- tenant-level variance does not create hidden config drift
- standards updates, supplier changes, and dependency changes can be absorbed without re-architecting the product

## Phase 9 implementation rules

**Rule 1: evidence comes from the system, not from retrospective narrative.**  
If a control cannot be demonstrated from the event history, signed attestation, policy register, or restore evidence, then the control is not operationally real.

**Rule 2: assurance must be continuous, not annual theatre.**  
DSPT is annual, DTAC evidence changes over time, DCB safety evidence evolves with changes, and the CAF-aligned DSPT expects stronger testing of the full response-and-recovery cycle. So evidence production should run continuously and only be packaged periodically. ([NHS England Digital][3])

**Rule 3: restore evidence matters more than backup configuration.**  
CAF-aligned DSPT now explicitly expects testing across the full incident-response cycle and understanding the restore order of dependent systems. That means backup dashboards alone are not enough; the product needs repeated clean-environment restore proof. ([NHS England Digital][4])

**Rule 4: retention is part of system design.**  
The Records Management Code of Practice explicitly covers storage, retention, and deletion, and it is meant to form the basis of organisational records policy. Phase 9 should therefore move retention out of ad hoc scripts and into the product’s metadata and lifecycle engine. ([NHS Transformation Directorate][5])

**Rule 5: standards and guidance are versioned inputs, not static assumptions.**  
NHS England refreshed DTAC guidance in March 2026, and NHS England has already commenced a review of DCB0129 and DCB0160. The assurance model should therefore carry standards-version metadata rather than hard-coding one permanent checklist. ([NHS Transformation Directorate][6])

**Rule 6: operations UI should feel as deliberate as the clinical UI.**  
This phase is admin-heavy, but the front end still matters. The operations console should be dense, elegant, fast, and legible, not a pile of unstructured charts.

## Control priorities

The Phase 9 operator-facing assurance control plane requires five corrections:

1. live `/ops/*`, audit, assurance, incident, and governance-adjacent routes must bind to one published `AudienceSurfaceRuntimeBinding`, so stale publication, parity drift, or provenance drift cannot still imply live control posture
2. operational interventions, replay exit, and pack actions must chain to canonical route intent, action, settlement, and recovery contracts
3. operator exports, investigation bundles, pack exports, deletion certificates, and archive manifests were missing governed `ArtifactPresentationContract` and `OutboundNavigationGrant` rules
4. PHI-bearing operational surfaces must include canonical `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` requirements
5. same-shell degraded behavior for frozen, withdrawn, or trust-blocked operator routes was still under-specified, which risked generic failure or detached navigation instead of governed `ReleaseRecoveryDisposition`

---

## 9A. Assurance ledger, evidence graph, and operational state contracts

This sub-phase creates the formal assurance substrate for the whole platform.

The architecture already says the platform is event-driven, that it includes a WORM audit ledger, and that analytics and assurance are first-class domain services. That is the exact right starting point. Phase 9 should make that explicit by treating every operational control, evidence link, and assurance pack as a formal domain object rather than a reporting by-product.

The assurance substrate requires six corrections:

1. assurance ingestion now carries explicit producer provenance and schema-pin metadata
2. the ledger now has exactly-once checkpointing and ordered replay rules instead of best-effort append
3. control status now evaluates freshness, supersession, and validation basis explicitly rather than assuming any linked evidence is sufficient
4. operational and assurance views now materialize per-slice trust and completeness state instead of treating all projections as equally trustworthy
5. the operations shell now has bounded degraded behavior for untrusted assurance slices instead of silently hiding or flattening them
6. assurance, replay, pack export, incident follow-up, and retention now consume one deterministic evidence graph snapshot instead of parallel local reference lists

### Backend work

Create these objects:

**AssuranceLedgerEntry**  
`assuranceLedgerEntryId`, `sourceEventRef`, `entryType`, `tenantId`, `producerRef`, `namespaceRef`, `schemaVersionRef`, `normalizationVersionRef`, `sourceSequenceRef`, `sourceBoundedContextRef`, `governingBoundedContextRef`, `requiredContextBoundaryRefs[]`, `edgeCorrelationId`, `continuityFrameRef`, `routeIntentRef`, `commandActionRef`, `commandSettlementRef`, `uiEventRef`, `uiTransitionSettlementRef`, `projectionVisibilityRef`, `auditRecordRef`, `telemetryDisclosureFenceRef`, `causalTokenRef`, `replayDecisionClass`, `effectKeyRef`, `controlRefs`, `evidenceRefs`, `graphEdgeRefs[]`, `canonicalPayloadHash`, `inputSetHash`, `hash`, `previousHash`, `createdAt`

**EvidenceArtifact**  
`evidenceArtifactId`, `artifactType`, `sourceRef`, `sourceVersion`, `sourceSnapshotRef`, `sourceCaptureBundleRef`, `sourceDerivationPackageRefs[]`, `sourceSummaryParityRef`, `producedByEntryRef`, `canonicalScopeRef`, `artifactRole`, `integrityHash`, `canonicalArtifactHash`, `artifactManifestHash`, `derivedFromArtifactRefs[]`, `redactionTransformHash`, `retentionClassRef`, `visibilityScope`, `supersedesArtifactRef`, `createdAt`

**ControlObjective**  
`controlObjectiveId`, `frameworkCode`, `controlCode`, `versionRef`, `ownerRole`, `status`, `evidenceRequirementSet`, `freshnessPolicyRef`, `validationPolicyRef`

**ControlEvidenceLink**  
`linkId`, `controlObjectiveId`, `requirementRef`, `requirementWeight`, `evidenceArtifactId`, `linkType`, `validFrom`, `validTo`, `validationState`, `validationBasisRef`, `freshnessState`, `lineagePathHash`, `evidenceSetHash`, `assuranceEvidenceGraphSnapshotRef`, `assuranceEvidenceGraphEdgeRef`, `linkConfidence`, `supersededAt`

**ProjectionHealthSnapshot**  
`projectionHealthSnapshotId`, `projectionCode`, `lagMs`, `stalenessState`, `rebuildState`, `trustState`, `completenessState`, `expectedInputRefs[]`, `observedInputRefs[]`, `coverageScore`, `replayMatchScore`, `determinismState`, `snapshotHash`, `rebuildHash`, `integrityScore`, `affectedAudienceRefs`, `capturedAt`

**AttestationRecord**  
`attestationId`, `controlObjectiveId`, `attestedBy`, `attestedAt`, `attestationScope`, `status`, `commentRef`

**AssurancePack**  
`assurancePackId`, `packType`, `periodStart`, `periodEnd`, `tenantScope`, `state`, `artifactRefs`, `signoffRefs`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`

**AssuranceIngestCheckpoint**
`assuranceIngestCheckpointId`, `producerRef`, `namespaceRef`, `schemaVersionRef`, `lastAcceptedSequenceRef`, `lastAcceptedEventRef`, `lastAcceptedHash`, `quarantineState`, `quarantineReason`, `updatedAt`

**ControlStatusSnapshot**
`controlStatusSnapshotId`, `controlObjectiveId`, `tenantId`, `state`, `coverageState`, `freshnessState`, `latestEvidenceRef`, `latestValidatedAt`, `coverageScore`, `coverageLowerBound`, `lineageScore`, `reproducibilityScore`, `decisionHash`, `evidenceSetHash`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `gapReasonRefs`, `generatedAt`

**AssuranceSliceTrustRecord**
`assuranceSliceTrustRecordId`, `sliceRef`, `scopeRef`, `audienceTier`, `trustState = trusted | degraded | quarantined | unknown`, `completenessState = complete | partial | blocked`, `trustScore`, `trustLowerBound`, `freshnessScore`, `coverageScore`, `lineageScore`, `replayScore`, `consistencyScore`, `hardBlockState`, `blockingProducerRefs[]`, `blockingNamespaceRefs[]`, `evaluationModelRef`, `evaluationInputHash`, `lastEvaluatedAt`

Replay-sensitive entries must preserve `replayDecisionClass` and `effectKeyRef` whenever they describe command dedupe, callback collapse, or outbox or inbox settlement. Assurance and audit consumers must be able to answer not only that a mutation settled, but whether it was original, exact replay, semantic replay, stale duplicate, or collision review.
`sourceBoundedContextRef` and `governingBoundedContextRef` must also survive normalization so assurance can prove which domain produced the evidence and which bounded context actually owned the lifecycle truth under review. Assurance, analytics, audit, and operations ingest remains observer or governance posture through `requiredContextBoundaryRefs[]`; these contexts may not write patient, booking, hub, pharmacy, or communication lifecycle state directly.

**ExperienceContinuityControlEvidence**
`continuityControlEvidenceId`, `controlCode`, `producerFamilyRef`, `audienceTier`, `audienceSurfaceRef`, `routeFamilyRef`, `routeContinuityEvidenceContractRef`, `canonicalObjectDescriptorRef`, `governingObjectRef`, `governingObjectVersionRef`, `shellContinuityKey`, `entityContinuityKey`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `sourceProjectionRef`, `sourceSettlementRef`, `sourceContinuationRef`, `evidenceArtifactRefs[]`, `validationState`, `validationBasisHash`, `continuityTupleHash`, `continuitySetHash`, `reproductionHash`, `lastValidatedAt`

`ExperienceContinuityControlEvidence` is the authoritative proof that a continuity-sensitive route was allowed to look calm, settled, writable, or same-shell recoverable at a specific moment. It must bind the producer family, governing route continuity contract, canonical object, shell or entity continuity keys, selected anchor tuple, current publication tuple, and the exact settlement or continuation chain that justified that posture. Local projection freshness, cached scroll state, browser history, or shell memory may preserve context, but they may not substitute for this evidence tuple.

**AssuranceSurfaceRuntimeBinding**
`assuranceSurfaceRuntimeBindingId`, `audienceSurface`, `routeFamilyRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `requiredTrustRefs[]`, `requiredChannelFreezeRefs[]`, `releaseTrustFreezeVerdictRef`, `releaseRecoveryDispositionRef`, `bindingState = live | diagnostic_only | recovery_only | blocked`, `validatedAt`

`AssuranceSurfaceRuntimeBinding.bindingState = live` is legal only while the linked `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`. `diagnostic_only` is mandatory when the verdict is merely `diagnostic_only`, and export or intervention controls may not bypass that downgrade.

**IdentityRepairEvidenceBundle**
`identityRepairEvidenceBundleId`, `identityRepairCaseRef`, `repairSignalRefs[]`, `freezeRecordRef`, `downstreamDispositionRefs[]`, `resultingIdentityBindingRef`, `releaseSettlementRef`, `artifactRefs[]`, `bundleHash`, `createdAt`

`IdentityRepairEvidenceBundle` is the assurance proof set for wrong-patient correction. It captures the immutable signal basis, exact freeze barrier, downstream branch set, corrected binding, and release settlement so audit or safety review can prove that access was frozen before correction, that affected branches were quarantined or compensated, and that continuity resumed only after governed release.

**AssuranceEvidenceGraphSnapshot**
`assuranceEvidenceGraphSnapshotId`, `tenantScopeRef`, `standardsVersionMapRefs[]`, `ledgerEntryRefs[]`, `evidenceArtifactRefs[]`, `controlObjectiveRefs[]`, `controlEvidenceLinkRefs[]`, `controlStatusSnapshotRefs[]`, `controlRecordRefs[]`, `evidenceGapRecordRefs[]`, `continuityEvidenceRefs[]`, `continuityEvidencePackSectionRefs[]`, `incidentRefs[]`, `exceptionRefs[]`, `capaActionRefs[]`, `retentionDecisionRefs[]`, `archiveManifestRefs[]`, `deletionCertificateRefs[]`, `packRefs[]`, `assurancePackActionRecordRefs[]`, `assurancePackSettlementRefs[]`, `recoveryEvidenceArtifactRefs[]`, `evidenceSetHash`, `continuitySetHash`, `incidentSetHash`, `retentionSetHash`, `graphHash`, `snapshotState = complete | stale | blocked`, `generatedAt`

**AssuranceEvidenceGraphEdge**
`assuranceEvidenceGraphEdgeId`, `graphSnapshotRef`, `fromRef`, `toRef`, `edgeType = ledger_produces_artifact | artifact_satisfies_control | control_materializes_status | control_opens_gap | artifact_supports_continuity | continuity_section_supports_pack | incident_opens_gap | gap_drives_capa | retention_preserves_artifact | deletion_blocks_pack | export_materializes_artifact | standards_version_governs_control`, `scopeState = in_scope | out_of_scope_conflict`, `supersessionState = live | superseded | unresolved`, `edgeHash`, `createdAt`

**AssuranceGraphCompletenessVerdict**
`assuranceGraphCompletenessVerdictId`, `graphSnapshotRef`, `scopeRef`, `requiredNodeRefs[]`, `missingNodeRefs[]`, `orphanNodeRefs[]`, `missingEdgeRefs[]`, `supersessionConflictRefs[]`, `crossScopeConflictRefs[]`, `requiredPackRefs[]`, `requiredRetentionRefs[]`, `blockedExportRefs[]`, `verdictState = complete | stale | blocked`, `decisionHash`, `evaluatedAt`

`AssuranceEvidenceGraphSnapshot` is the single admissibility graph for assurance, audit, replay, export, incident follow-up, and retention. Evidence may exist physically before it reaches this graph, but no pack, export, continuity section, incident bundle, deletion certificate, or archive manifest may claim authoritative completeness until the current graph snapshot and completeness verdict say it is in scope, unsuperseded, and hash-stable.

`AssuranceControlRecord`, `EvidenceGapRecord`, `MonthlyAssurancePack`, `ContinuityEvidencePackSection`, `AssurancePackActionRecord`, `AssurancePackSettlement`, `RetentionDecision`, `ArchiveManifest`, `DeletionCertificate`, and `RecoveryEvidenceArtifact` must all bind one current `AssuranceEvidenceGraphSnapshot` plus one current `AssuranceGraphCompletenessVerdict`. Presence of a PDF, blob, incident note, or export file is not enough if the graph no longer proves which exact ledger entries, controls, continuity sections, standards version rows, CAPA items, and retention decisions made that artifact admissible.

The assurance math must be explicit, conservative, and reproducible.

For any event, evidence set, control evaluation, slice trust evaluation, or export candidate, let `H(x) = SHA-256(JCS(x))`, where JCS is the RFC 8785 canonical JSON form of `x`, and let `Merkle(S)` be the Merkle root of the lexicographically sorted element hashes in set `S`. Raw serializer order is never a valid hashing basis.

For any evidence family `u` with required rules `r` and non-negative weights `w_r`:

- `F_u = exp(-max(0, age_u - freshnessBudget_u) / tau_u)`
- `C_hat_u = sum_r w_r * 1[present_r and valid_r] / sum_r w_r`
- `n_eff(u) = (sum_r w_r)^2 / max(1e-6, sum_r w_r^2)`
- `LB(p, n, z) = (p + z^2/(2n) - z * sqrt(p(1-p)/n + z^2/(4n^2))) / (1 + z^2/n)`
- `C_u^- = LB(C_hat_u, n_eff(u), 1.96)` and define `L_u^-`, `R_u^-`, and `X_u^-` analogously for lineage-chain validity, replay reproducibility, and cross-slice consistency
- `Q_u^- = exp(alpha_F * ln(max(1e-6, F_u)) + alpha_C * ln(max(1e-6, C_u^-)) + alpha_L * ln(max(1e-6, L_u^-)) + alpha_R * ln(max(1e-6, R_u^-)) + alpha_X * ln(max(1e-6, X_u^-)))`, with `sum alpha = 1`

`hardBlockState` must be asserted on schema incompatibility, missing mandatory evidence, failed hash-chain continuity, failed lineage, summary, or redaction parity, replay divergence on command-following projections, or any quarantined mandatory producer. `ControlStatusSnapshot.state = satisfied` is legal only when all mandatory requirement groups pass, `hardBlockState = false`, and the governing lower-bound quality score is above policy threshold on the current evaluation model. No later projection or export layer may reinterpret a failed lower bound as green because a point estimate happened to be higher.

Projection integrity is a separate quantity, not a UI styling choice. For projection `p`, compute `I_p^- = exp(beta_F * ln(max(1e-6, F_p)) + beta_C * ln(max(1e-6, C_p^-)) + beta_R * ln(max(1e-6, R_p^-)) + beta_D * ln(max(1e-6, D_p^-)))`, where `C_p^-` is required-input coverage, `R_p^-` is replay agreement, and `D_p^-` is deterministic rebuild agreement on the same model version. Command-following projections require exact replay equality; approximate replay is not sufficient for authoritative actionability.

Use this algorithm:

1. accept only events whose producer, published `CanonicalEventContract`, namespace, and schema version match a registered assurance-ingest contract
2. resolve or create `AssuranceIngestCheckpoint` for that producer and namespace; reject duplicates idempotently and quarantine out-of-order or incompatible sequences instead of appending speculative ledger rows
3. map any legacy aliases such as `ingest.*`, `tasks.*`, `fallback.review_case.*`, or `external.confirmation.gate.*` through `CanonicalEventNormalizationRule` into the published canonical namespace set before projection or assurance ingestion, and record the alias mapping in the normalization metadata
4. canonicalize every accepted event through JCS, compute `canonicalPayloadHash = H(event)`, and normalize it into a typed `AssuranceLedgerEntry` pinned to producer, schema, normalization version, causal token, and `inputSetHash`
5. append ledger rows only after checkpoint validation and previous-hash continuity succeed; each accepted ingest batch must also emit one Merkle root over the appended entry hashes
6. materialize `EvidenceArtifact` with `sourceSnapshotRef`, `sourceCaptureBundleRef`, `sourceDerivationPackageRefs[]`, `sourceSummaryParityRef`, `canonicalArtifactHash`, `artifactManifestHash`, and `redactionTransformHash`; derived artifacts must reference their parent artifacts explicitly
7. materialize `ControlEvidenceLink` and `ControlStatusSnapshot` only from unsuperseded evidence, and calculate `evidenceSetHash`, `lineagePathHash`, summary-to-source parity, coverage lower bounds, freshness, and decision hashes explicitly rather than inferring validity from link existence
8. materialize one `AssuranceEvidenceGraphSnapshot` over the same admissible evidence cut, add typed `AssuranceEvidenceGraphEdge` rows for controls, continuity sections, incidents, CAPA items, standards rows, retention artifacts, and export artifacts, and compute one `graphHash = Merkle(AssuranceEvidenceGraphEdge.edgeHash)`
9. evaluate one `AssuranceGraphCompletenessVerdict` over that graph before any pack, replay, sign-off, export, deletion certificate, archive manifest, or recovery artifact becomes authoritative; missing nodes, missing edges, cross-scope joins, or unresolved supersession must downgrade the verdict to `stale` or `blocked`
10. update `ProjectionHealthSnapshot` and `AssuranceSliceTrustRecord` using lower-bound quality scores, deterministic replay checks, exact blocker provenance, and the current graph completeness verdict; a slice or projection may never be labeled greener than its lowest required input
11. require deterministic rebuild from raw events on scheduled replay and whenever normalization, projection, query-plan, or render-model versions change; if `snapshotHash != rebuildHash`, downgrade to `degraded` or `quarantined` according to policy and freeze authoritative actions immediately
12. build assurance packs, retention artifacts, and recovery evidence only from trusted or explicitly attested degraded slices, and pin each artifact to the exact trust snapshot hashes, graph hash, graph completeness verdict, evidence-set hash, and continuity-set hash it depends on
13. preserve the last stable diagnostic view with explicit age and blocker detail when evidence is missing, stale, or blocked; never impute healthy current truth from stale cached projections

Every writable or export-capable operator-facing route under `/ops/*`, audit review, assurance-center export, incident handling, records governance, and tenant governance must also validate one published `AudienceSurfaceRuntimeBinding` through `AssuranceSurfaceRuntimeBinding`. If publication becomes stale, parity drifts, the tuple is withdrawn, provenance is blocked, the shared `ReleaseTrustFreezeVerdict` is no longer `live`, the required bounded-context seam is stale or undeclared, or the active purpose-of-use coverage row is no longer exact, the surface must remain in the same shell and degrade through the bound `ReleaseRecoveryDisposition`; it may not keep live controls armed.

All cross-organisation operational, support, and assurance views must materialize under `VisibilityProjectionPolicy` from the canonical Phase 0 section. No later projection layer may widen audience scope after materialization, and break-glass or acting-context expansions must switch to a distinct purpose-of-use coverage row before deeper detail appears.

Assurance ingestion must fail closed on unknown namespaces or incompatible schema versions. It must not silently drop intake, safety, patient, communication, identity, access, telephony, reachability, confirmation, capacity, support, assistive, policy, release, analytics, or audit events, because request-intake health, patient-message delivery, safety coverage, control-plane diagnosis, and multi-channel operational evidence all depend on complete domain coverage.

The assurance substrate must also treat patient and support continuity controls as first-class evidence, not UX commentary. `PatientNavUrgencyDigest`, `PatientNavReturnContract`, `PatientSpotlightDecisionProjection`, `PatientQuietHomeDecision`, `RecordActionContextToken`, `RecoveryContinuationToken`, `ConversationThreadProjection`, `ConversationSubthreadProjection`, `CommunicationEnvelope`, `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, `ConversationCommandSettlement`, and `SupportReplayRestoreSettlement` must each produce ledgered evidence showing which authoritative settlement, continuation, or restore posture governed the user-visible shell at the time. The same rule now applies to `PatientExperienceContinuityEvidenceProjection(controlCode = more_info_reply)`, `DraftContinuityEvidenceProjection(controlCode = intake_resume)`, `BookingContinuityEvidenceProjection(controlCode = booking_manage)`, `HubContinuityEvidenceProjection(controlCode = hub_booking_manage)`, `AssistiveContinuityEvidenceProjection(controlCode = assistive_session)`, `WorkspaceContinuityEvidenceProjection(controlCode = workspace_task_completion)`, and `PharmacyConsoleContinuityEvidenceProjection(controlCode = pharmacy_console_settlement)`. `ExperienceContinuityControlEvidence` should therefore bind route-family continuity controls to the supporting producer family, governing route continuity contract, shell and anchor tuple, spotlight or quiet-home decision tuple where applicable, publication tuple, and the supporting artifacts, traces, and validation basis used in packs, audit review, degraded-slice attestation, and rollout proof for every one of those control families.

Patient record artifacts are also first-class assurance producers. `PatientRecordArtifactProjection`, `ArtifactSurfaceBinding`, `ArtifactSurfaceFrame`, `ArtifactParityDigest`, `RecordArtifactParityWitness`, `ArtifactModeTruthProjection`, `ArtifactTransferSettlement`, and `ArtifactFallbackDisposition` must produce evidence showing which exact source artifact, source bundle, summary artifact, derivation package, redaction transforms, parity tuple, masking scope, visibility envelope, release gate, step-up checkpoint, and return-safe continuity state governed the visible record shell. If a summary overclaimed authority relative to the source artifact, the assurance graph must be able to prove which witness allowed that posture, when it drifted, and which bounded recovery or source-only posture replaced it.

`SelfCareBoundaryDecision`, `SelfCareExperienceProjection`, `AdviceRenderSettlement`, `AdviceAdminDependencySet`, `AdminResolutionExperienceProjection`, and `AdminResolutionSettlement` are also mandatory assurance producers. The ledger must preserve the exact `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, `adminMutationAuthorityState`, `reopenState`, `decisionEpochRef`, and supporting dependency or settlement refs that justified visible self-care calmness, bounded admin-only actionability, or clinician re-entry. Patient-safe wording, subtype labels, or detached timeline summaries are not admissible substitutes for that boundary tuple when audit or assurance asks why a route looked informational, operational, or review-blocked.

Assistive rollout proof must also bind one `AssistiveReleaseCandidate`, one `AssistiveRolloutSliceContract`, one `AssistiveCapabilityRolloutVerdict`, and any active `AssistiveReleaseFreezeRecord` for the visible slice under review. Assurance packs, degraded-slice attestations, and audit exports may not infer visible assistive posture from trust score, slice label, or watch tuple hash alone.
Assistive human-review and training-label proof must bind one `AssistiveFeedbackChain`, the relevant `AssistiveArtifactActionRecord` set, any current `OverrideRecord`, any current `HumanApprovalGateAssessment`, the current `FinalHumanArtifact`, and the current `FeedbackEligibilityFlag`. Acceptance counts, edit distance, or model-output presence are not sufficient evidence that a reviewed artifact actually settled as human truth or that its label is safe for training. If incident linkage, supersession, exclusion, or adjudication drift changes that answer later, assurance must append superseding evidence and revoke trainability rather than mutating prior evidence in place.

Wrong-patient correction is a mandatory assurance chain, not an operational footnote. Whenever `IdentityRepairCase` exists, assurance must materialize one `IdentityRepairEvidenceBundle` from `IdentityRepairSignal`, `IdentityRepairFreezeRecord`, every active `IdentityRepairBranchDisposition`, the resulting `IdentityBinding`, and `IdentityRepairReleaseSettlement`. Missing freeze proof, missing branch coverage, or missing release proof must set `hardBlockState = true` for any identity-binding, patient-visibility, or access-scope control that depends on that lineage.

Producer quarantine must be slice-bounded, not platform-global. If one producer or namespace is untrusted:

- preserve ingestion for unaffected producers
- mark only the dependent `AssuranceSliceTrustRecord` rows as `degraded` or `quarantined`
- surface exact blocking producers and namespaces in operational projections
- prevent `ControlStatusSnapshot.state = satisfied` where required evidence is now stale, quarantined, superseded, or incomplete
- require explicit attestation to publish packs that contain degraded slices

`AssuranceSliceTrustRecord.trustState` must use hysteresis around the lower-bound score so slices do not flap near thresholds: enter `trusted` only when `trustLowerBound >= 0.88` for two consecutive evaluations on the same model version, leave `trusted` when `trustLowerBound < 0.82`, and enter `quarantined` immediately on any `hardBlockState` or when `trustLowerBound < 0.40`. This stabilizes the diagnostic label only; stricter Phase 0 automation gates still apply to writable, ranking, and export-capable posture.

Create an assurance-pack state machine:

`collecting -> validating -> awaiting_attestation -> published -> superseded -> archived`

### Frontend work

Build the first real Operations Console route family:

- `/ops/overview`
- `/ops/queues`
- `/ops/capacity`
- `/ops/dependencies`
- `/ops/audit`
- `/ops/assurance`
- `/ops/incidents`
- `/ops/resilience`

`/ops/overview`, `/ops/queues`, `/ops/capacity`, and `/ops/dependencies` should normally reuse one `OperationsConsoleShell` keyed by scope and time horizon, with one shared masthead, one shared filter contract, and continuity-preserving drill-in semantics.

`/ops/assurance` must use that same shell law while exposing the new assurance trust model directly:

- every assurance tile, control row, and evidence summary must show freshness, trust, and completeness separately
- degraded or quarantined slices must remain visible with exact blocking producer or namespace detail; they must not disappear, flatten to green, or collapse into generic `data unavailable`
- when an operator drills from overview into assurance on the same scope and horizon, the shell must preserve board context and return path rather than opening a detached governance product
- pack preview and control status views must distinguish `trusted`, `degraded with attestation`, and `blocked` evidence states before export or sign-off controls appear
- operational drill-down remains read-only in this shell when the selected slice is quarantined; governed remediation still hands off to the Governance and Admin Shell

The detailed visual hierarchy, live-update, motion, and drill-down contract for this route family is defined in `operations-console-frontend-blueprint.md`.

Governed mutation handoffs from these routes should land in the Governance and Admin Shell under `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, or `/ops/release/*`, not create a second independent config surface inside the Operations Console.

Every `/ops/overview`, `/ops/queues`, `/ops/capacity`, `/ops/dependencies`, `/ops/audit`, `/ops/assurance`, `/ops/incidents`, and `/ops/resilience` route must carry the active `AssuranceSurfaceRuntimeBinding`. Board restore, drill-down return, and live intervention posture may not come back greener or more writable than the current publication, trust, and freeze state now allows.

This should not look like a generic BI tool. It should feel like a control room for a live clinical operations platform.

### Tests that must pass before moving on

- assurance-ledger append-only tests
- hash-chain integrity tests
- canonical-hash and Merkle-root determinism tests
- producer-contract and schema-pin validation tests
- ingest-checkpoint idempotency and out-of-order replay tests
- replay-decision evidence tests proving original, duplicate, stale, and collision-review paths remain distinguishable in the ledger
- evidence-link lineage tests
- control-status freshness and supersession tests
- control-status lower-bound gating tests
- projection-lag detection tests
- assurance-slice trust-state materialization tests
- projection-integrity exact-replay tests
- redaction-parity and reproduction-hash tests
- assurance-pack state-transition tests
- rebuild-from-raw-events tests
- degraded-slice attestation-gate tests
- tenant-scope isolation tests
- patient-navigation digest evidence tests
- record-continuation and recovery-token evidence tests
- conversation receipt-and-settlement evidence tests
- support-replay-restore evidence and fail-closed attestation tests

### Exit state

The product now has one formal assurance spine with provenance, exactly-once ingest, explicit trust state, and degraded-slice discipline sitting on top of the event spine rather than beside it.

---

## 9B. Live operational projections, service levels, and breach-risk engine

This sub-phase turns platform telemetry into operational truth.

The architecture already expects live dashboards and an Ops Console, and earlier phases already created queueing, booking, network coordination, pharmacy, and assistive workflows. Phase 9 now needs to turn those into a single live operational view. The most important design choice here is to measure essential functions, not vanity metrics. That aligns with the CAF-aligned DSPT emphasis on identifying essential functions and understanding the data, systems, and dependencies that support them. ([NHS England Digital][7])

### Backend work

Create these objects:

**SLOProfile**  
`sloProfileId`, `functionCode`, `availabilityTarget`, `latencyTarget`, `freshnessTarget`, `restoreTarget`, `workingTimeCalendarRef`, `alertThresholds`, `calibrationPolicyRef`

**OperationalMetricDefinition**  
`metricDefinitionId`, `metricCode`, `sourceProjection`, `numeratorSpec`, `denominatorSpec`, `aggregationWindow`, `tenantScope`, `ownerRole`, `baselineModelRef`, `minimumSupport`, `thresholdPolicyRef`, `normalizationVersionRef`

**BreachRiskRecord**  
`breachRiskRecordId`, `entityType`, `entityRef`, `riskType`, `severity`, `predictedAt`, `windowCloseAt`, `predictedProbability`, `predictionLowerBound`, `predictionUpperBound`, `modelVersionRef`, `calibrationVersionRef`, `queueSnapshotHash`, `supportingMetricRefs`, `explanationVectorRef`

**QueueHealthSnapshot**  
`queueHealthSnapshotId`, `queueCode`, `depth`, `medianAge`, `p95Age`, `arrivalRate`, `clearRate`, `utilization`, `aggregateBreachProbability`, `breachRiskCount`, `escalationCount`, `anomalyState`, `capturedAt`

**DependencyHealthRecord**  
`dependencyHealthRecordId`, `dependencyCode`, `healthState`, `latencyP95`, `errorRate`, `timeoutRate`, `fallbackState`, `availabilityScore`, `delayHazardRef`, `capturedAt`

**EquitySliceMetric**  
`equitySliceMetricId`, `sliceDefinition`, `metricSetRef`, `periodWindow`, `effectiveSampleSize`, `varianceMagnitude`, `confidenceBandRef`, `persistenceState`, `varianceState`

**MetricAnomalySnapshot**
`metricAnomalySnapshotId`, `metricDefinitionRef`, `observedValue`, `expectedValue`, `standardizedResidual`, `ewmaScore`, `cusumPositiveScore`, `cusumNegativeScore`, `support`, `alertState = normal | watch | elevated | critical`, `thresholdPolicyRef`, `capturedAt`

**ContinuityControlHealthProjection**
`continuityControlHealthProjectionId`, `controlCode = patient_nav | record_continuation | conversation_settlement | more_info_reply | support_replay_restore | intake_resume | booking_manage | hub_booking_manage | assistive_session | workspace_task_completion | pharmacy_console_settlement`, `scopeRef`, `producerFamilyRefs[]`, `routeContinuityEvidenceContractRefs[]`, `requiredAssuranceSliceTrustRefs[]`, `experienceContinuityEvidenceRefs[]`, `continuityTupleHashes[]`, `continuitySetHash`, `latestSettlementOrRestoreRef`, `latestReturnOrContinuationRef`, `supportingSymptomRefs[]`, `trustLowerBound`, `validationBasisHash`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `recommendedHandoffRef`, `capturedAt`

`ContinuityControlHealthProjection` is the first-class continuity-proof summary for operational diagnosis. Queue age, delivery delay, backlog, and freshness may explain blast radius, but they remain supporting symptoms only; they may not replace the exact settlement, continuation, or restore chain, the required `AssuranceSliceTrustRecord` rows, or the current `continuitySetHash` governing whether a shell was actually allowed to look calm, writable, or same-shell recoverable.

Build projections for:

- request intake health
- triage queue health
- more-info loop latency
- booking search and commit success
- waitlist conversion
- hub coordination delays
- pharmacy dispatch and outcome latency
- patient message delivery
- patient-home navigation continuity
- record-follow-up recovery integrity
- conversation settlement integrity
- support replay restore integrity
- intake autosave and governed resume integrity
- booking-manage continuity integrity
- assistive-session continuity integrity
- workspace task-completion continuity integrity
- pharmacy-console settlement continuity integrity
- assistive capability health
- audit and projection staleness

Use the event history to compute both current state and forward risk. The breach-risk engine and anomaly thresholds must be explicit, conservative, calibrated, and reproducible.

For active entity `i` in lane `ell` at time `t`, define:

- `d_i(t) = workingMinutesBetween(t, targetWindowCloseAt_i)` as remaining working-minute slack to the governing target
- `rank_i(t)` under the deterministic queue or workflow ordering for the responsible service
- `e_j(t)` as the class-conditioned robust expected handling workload for upstream item `j`, including validated coordination overhead
- `B_i(t) = sum_{j \prec i} e_j(t)` as effective workload minutes ahead of `i`
- `a_ell(t)` as the staffed-availability multiplier for lane `ell`
- `g_ell(t)` as the conservative degradation multiplier induced by dependency health, fallback sufficiency, and trust posture, with `0 < g_ell(t) <= 1`
- `mu_ell^-(t) = q_0.10(mu_ell | recent validated completions) * a_ell(t) * g_ell(t)` as the lower calibrated service-capacity rate in workload-minutes cleared per working minute
- `W_i(t) = B_i(t) / max(1e-6, mu_ell^-(t))` as conservative wait-to-start
- `S_i` as the random in-service handling time for `i`, modelled from the active class distribution
- `D_i` as the extra external-dependency delay random variable for supplier, hub, pharmacy, patient, or channel-response states; set `D_i = 0` when none applies
- `T_i(t) = W_i(t) + S_i + D_i` as total time-to-safe-resolution
- `m_i = E[T_i(t)]` and `v_i = Var[T_i(t)]`, adding covariance terms only when a validated dependence model exists
- `k_i = m_i^2 / max(1e-6, v_i)` and `theta_i = v_i / max(1e-6, m_i)` as moment-matched Gamma parameters
- `P_i_raw(t) = 1 - F_Gamma(d_i(t); k_i, theta_i)` when `d_i(t) > 0`, otherwise `1`
- `P_breach_i(t) = Cal_{ell,v}(P_i_raw(t))` where `Cal` is the current monotone held-out calibration map for lane `ell` and model version `v`
- `P_breach_i^-(t)` and `P_breach_i^+(t)` as the calibration-bin Wilson bounds for the predicted probability under the current effective sample size
- `priority_i(t) = severityWeight_i * P_breach_i(t) * (1 + max(0, -d_i(t)) / breachWindow_i)`

When deterministic per-item prefix workload is unavailable because a lane is pooled or partially unordered, use the conservative Kingman fallback `E[W_q,ell] ~= ((c_a,ell^2 + c_s,ell^2) / 2) * (rho_ell / max(1e-6, 1 - rho_ell)) * sbar_ell`, with `rho_ell = lambda_ell * sbar_ell / m_ell`, and assign each entity the larger of the rank-based or lane-level wait estimate consistent with its percentile position.

For any operational metric `m` used to promote anomalies, define:

- `y_m(t)` as the observed normalized metric value
- `yhat_m(t)` as the versioned baseline expectation for the same scope, calendar segment, and normalization version
- `r_m(t) = (y_m(t) - yhat_m(t)) / max(sigmaHat_m(t), sigmaFloor_m)` as the standardized residual
- `z_m(t) = lambda_m * r_m(t) + (1 - lambda_m) * z_m(t-1)` as EWMA
- `C_m^+(t) = max(0, C_m^+(t-1) + r_m(t) - k_m)` and `C_m^-(t) = max(0, C_m^-(t-1) - r_m(t) - k_m)` as one-sided CUSUM scores
- enter `alertState = elevated | critical` only when `support_m(t) >= n_min_m` and the entry thresholds fire; exit only after the lower exit thresholds hold for `h_m` consecutive evaluations

Queue-level breach exposure must also be explicit: for queue `q`, set `P_any_breach_q(t) = 1 - prod_{i in active(q)} (1 - P_breach_i(t))` over the currently active entities after deduplicating mutually exclusive timers. `QueueHealthSnapshot.aggregateBreachProbability` must render that value directly rather than forcing operators to infer it from counts alone.

A good breach-risk algorithm is therefore:

1. identify active work items, governing timers, and the validated denominator or exposure set for each KPI
2. derive `B_i(t)`, `mu_ell^-(t)`, and dependency-delay distributions from queue speed, staffed availability, dependency health, and slice trust
3. compute `P_breach_i(t)`, `P_breach_i^-(t)`, `P_breach_i^+(t)`, and `P_any_breach_q(t)`
4. update `MetricAnomalySnapshot` with standardized residual, EWMA, CUSUM, support, and hysteresis state
5. rank and surface intervention candidates by `priority_i(t)`, remaining slack `d_i(t)`, confidence-interval width, and stable entity key
6. attach explanation fields so operators can act, not just look
7. back-test calibration continuously; if calibration error breaches policy, downgrade forecasts to advisory posture until recalibrated

### Frontend work

High-priority operations-overview defects in this slice:

1. the six surfaces are named, but the board lacks a typed context frame, so scope, horizon, and filter state can drift between tiles and drill-downs
2. cross-surface trust, freshness, and completeness are not normalized at render time, so operators could compare stale and trusted metrics as if they were equivalent
3. `InvestigationDrawer` is described as canonical, but not yet bound to the board snapshot or return context that opened it
4. `InterventionWorkbench` lacks an action-eligibility lease, so stale or quarantined projections could still expose live operational interventions
5. pause-live behavior is named, but not yet governed by a delta-window contract, so resumed boards can thrash, jump, or silently skip material changes

The operations overview should have six disciplined surfaces:

- `NorthStarBand`
- `BottleneckRadar`
- `CapacityAllocator`
- `ServiceHealthGrid`
- `CohortImpactMatrix`
- `InterventionWorkbench`

All six surfaces must materialize under one `OpsOverviewContextFrame`:

**OpsOverviewContextFrame**
`contextFrameId`, `scopeRef`, `timeHorizonRef`, `filterDigest`, `projectionBundleRef`, `macroStateRef`, `boardStateSnapshotRef`, `boardTupleHash`, `activeSelectionLeaseRefs[]`, `actionEligibilityFenceRef`, `returnTokenRef`, `selectedSliceRef`, `viewMode = live | paused | replaying`

`OpsOverviewContextFrame` is the only legal continuity contract for `/ops/overview`. Tiles, filters, drill-downs, and intervention candidates may not assemble from different scope or horizon snapshots while the same board frame is active, and a returned or resumed board may not reuse the frame unless its `boardTupleHash`, active selection leases, and action-eligibility fence still validate.

Every surface must also render a trust envelope:

**OpsOverviewSliceEnvelope**
`sliceEnvelopeId`, `surfaceCode`, `projectionRef`, `boardTupleHash`, `selectedEntityTupleHash`, `freshnessState`, `trustState`, `trustLowerBound`, `integrityScore`, `completenessState`, `confidenceBandRef`, `blockingDependencyRefs[]`, `releaseTrustFreezeVerdictRef`, `actionEligibilityState = interactive | observe_only | stale_reacquire | read_only_recovery | blocked`, `diagnosticOnlyReasonRef`, `renderMode = interactive | observe_only | blocked`

`OpsOverviewSliceEnvelope` normalizes trust across `NorthStarBand`, `BottleneckRadar`, `CapacityAllocator`, `ServiceHealthGrid`, `CohortImpactMatrix`, and `InterventionWorkbench`. If a slice is stale, degraded, or quarantined, the board must say so explicitly and may not let a visually healthy tile imply actionability. `renderMode = interactive` is legal only while the linked `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`, the slice still matches the current `boardTupleHash`, and `actionEligibilityState = interactive`; diagnostic-only and recovery verdicts must surface as `observe_only` or `blocked`, not as green tiles with disabled buttons added later.

`ServiceHealthGrid` must also materialize one current `EssentialFunctionHealthEnvelope` per essential function from the same assurance spine. The envelope is the only authority allowed to combine `OpsOverviewSliceEnvelope`, required `AssuranceSliceTrustRecord` rows, current `ReleaseTrustFreezeVerdict`, active `ChannelReleaseFreezeRecord` rows, fallback sufficiency, and resilience posture into service-health state, overlay calmness, and mitigation authority. A health cell, drill path, action posture, or stable-service digest may not look greener than the least-trusted required input by recomputing those fragments locally.

Time-bounded fallback, constrained mitigation, active freeze, recovery-only posture, or degraded trust must remain inline in the affected health cell and in stable-service watch posture. Assurance may preserve calm scanability, but it may not collapse those states into decorative green boards or healthy-empty summaries.

Any forecast-bearing surface must bind its displayed interval and calibration age to the same envelope. No tile may render single-point risk, relief, or capacity as if it were certain when the envelope is degraded, stale, or wide-band.

Where the operational question is rooted in user-visible continuity rather than raw queue pressure alone, the board must also surface `ContinuityControlHealthProjection` from the same assurance spine. `/ops/overview`, `/ops/assurance`, and `/ops/audit` may not explain a patient-home CTA freeze, record-follow-up recovery loop, thread-settlement dispute, support replay restore hold, intake resume failure, booking-manage recovery loop, stale assistive session, workspace completion stall, or pharmacy-console settle mismatch using only generic delivery or freshness signals when continuity evidence already provides the governing proof.

`InvestigationDrawer` should be the canonical drill-down surface across all six so operators can move from macro health to queue, dependency, cohort, and entity detail without losing board context.

**InvestigationDrawerSession**
`drawerSessionId`, `openedFromSurface`, `sourceSliceEnvelopeRef`, `sourceSnapshotRef`, `sourceBoardTupleHash`, `selectedEntityRef`, `selectedEntityTupleHash`, `continuityQuestionHash`, `baseContinuityControlHealthProjectionRef`, `baseOpsContinuityEvidenceSliceRef`, `baseExperienceContinuityEvidenceRefs[]`, `baseAssuranceSliceTrustRefs[]`, `baseContinuityTupleHashes[]`, `baseContinuitySetHash`, `baseLatestSettlementOrRestoreRef`, `returnContextFrameRef`, `diffBaseRef`, `observeOnlyReasonRef`, `deltaState = aligned | drifted | superseded | blocked`, `lastDeltaComputedAt`

`InvestigationDrawerSession` binds the drill-down to the exact board slice, tuple, and snapshot that opened it. When the question is continuity-rooted, it must also bind the exact `ContinuityControlHealthProjection`, `OpsContinuityEvidenceSlice`, `ExperienceContinuityControlEvidence` set, and `AssuranceSliceTrustRecord` set that defined the operator's starting proof basis. If fresher truth arrives while the drawer is open, the drawer must surface the delta against that preserved base instead of silently rebasing and changing the investigative question underneath the operator. Control code, blocker set, trust basis, and governing settlement chain may not switch in place without explicit operator reacquire of a new `continuityQuestionHash`.

`InterventionWorkbench` must be driven by explicit action leases:

**InterventionCandidateLease**
`candidateLeaseId`, `candidateRef`, `actionScopeRef`, `sourceSliceEnvelopeRef`, `opsBoardStateSnapshotRef`, `opsSelectionLeaseRef`, `opsRouteIntentRef`, `opsDeltaGateRef`, `opsReturnTokenRef`, `boardTupleHash`, `selectedEntityTupleHash`, `releaseTrustFreezeVerdictRef`, `governingObjectRef`, `eligibilityState = executable | observe_only | stale_reacquire | read_only_recovery | blocked`, `policyBundleRef`, `expiresAt`

`InterventionCandidateLease` prevents stale operational boards from leaking real mutation power. `eligibilityState = executable` is legal only while the source slice is interactive, the current board tuple and selected-entity tuple still match, the linked `OpsSelectionLease` is live, the linked `OpsDeltaGate` is `safe_apply | released`, and the linked `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`. When eligibility is not `executable`, the workbench may explain, queue, or hand off the intervention, but it may not arm a live control inside the overview shell.

If the active `InvestigationDrawerSession.deltaState = drifted | superseded | blocked` for the governing `continuityQuestionHash`, or if the current `ContinuityControlHealthProjection` no longer matches the session's preserved `baseContinuitySetHash`, `InterventionCandidateLease.eligibilityState` must immediately degrade to `observe_only`, `stale_reacquire`, or `read_only_recovery`. Mostly green queue or dependency metrics may not keep executable posture armed once continuity proof drifts.

The visual style should be premium but operational: quiet enough to scan all day, but not gimmicky.

Operational boards must use the canonical live-projection rules from Phase 0: in-place tile updates, visible `FreshnessChip` state, `ProjectionSubscription`-driven patching, operator-controlled pause-live behavior, and no viewport hijack when thresholds breach or backlog shifts. The detailed composition and motion rules are defined in `operations-console-frontend-blueprint.md`.

Pause-live and resume behavior must be governed by:

**LiveBoardDeltaWindow**
`deltaWindowId`, `contextFrameRef`, `baseBoardTupleHash`, `selectionLeaseRefs[]`, `pauseStartedAt`, `queuedDeltaRefs[]`, `queuedTupleDriftRefs[]`, `materialChangeCount`, `resumeStrategy = apply_in_place | step_review | reopen_drawer_base | stale_reacquire`, `resumeCheckpointRef`

`LiveBoardDeltaWindow` batches disruptive updates while the operator pauses or investigates. Resume must either apply the queued deltas deterministically, require a step review for material board changes, reopen the drawer against the preserved base, or fall to stale-reacquire when tuple drift breaks the old basis; it may not silently jump the board to the latest state without explaining what changed.

### Tests that must pass before moving on

- metric-calculation determinism tests
- breach-risk reproducibility tests
- probability-calibration and interval-coverage tests
- threshold-hysteresis tests for EWMA and CUSUM promotion
- queue-aggregate breach-probability tests
- conservative-capacity downgrade tests for degraded trust or dependency state
- large-volume event ingestion tests
- projection freshness tests
- stale dependency feed tests
- continuity-control health projection tests
- UI performance tests on live dashboards
- filter and slice consistency tests
- `OpsOverviewContextFrame` continuity tests across scope, horizon, filter, drill-down return, board tuple, and resumed action-eligibility fence state
- cross-surface `OpsOverviewSliceEnvelope` trust-normalization tests
- `InvestigationDrawerSession` snapshot-parity and rebase-diff tests
- `InterventionCandidateLease` observe-only, stale-reacquire, read-only-recovery, and blocked-state tests for stale or quarantined slices
- `LiveBoardDeltaWindow` pause, batch, tuple-drift, and deterministic-resume tests

### Exit state

Ops users can now see the service as one live operational system rather than a set of disconnected feature dashboards.

---

## 9C. Audit explorer, break-glass review, and support replay

This sub-phase turns immutable audit into a usable operational surface.

The architecture makes break-glass and immutable audit part of the core identity and policy layer, not a logging detail. The WORM audit ledger is also already explicit in the platform design. Phase 9 should therefore create an audit experience that is actually usable for governance, support, and investigation.

### Backend work

Create these objects:

**InvestigationScopeEnvelope**
`investigationScopeEnvelopeId`, `originAudienceSurface`, `originRouteIntentRef`, `originOpsReturnTokenRef`, `purposeOfUse`, `actingContextRef`, `maskingPolicyRef`, `disclosureCeilingRef`, `visibilityCoverageRefs[]`, `scopeEntityRefs[]`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `investigationQuestionHash`, `requiredBreakGlassReviewRef`, `requiredSupportLineageBindingRef`, `scopeHash`, `issuedAt`, `expiresAt`

`InvestigationScopeEnvelope` is the single scope authority for audit search, break-glass review, support replay, and investigation export. It preserves the diagnostic question, selected anchor, purpose of use, masking ceiling, visibility rows, and operations-shell return contract so those paths cannot quietly widen scope or reframe the question in place.

**InvestigationTimelineReconstruction**
`investigationTimelineReconstructionId`, `investigationScopeEnvelopeRef`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `dataSubjectTraceRef`, `baseLedgerWatermarkRef`, `sourceEventRefs[]`, `normalizationVersionRef`, `reconstructionInputHash`, `timelineHash`, `graphHash`, `timelineState = exact | stale | blocked`, `generatedAt`

`InvestigationTimelineReconstruction` is the deterministic timeline contract shared by audit explorer, replay, diff, and export. It prevents audit routes, replay routes, and governance review from reconstructing different chronologies for the same investigative question.

**AuditQuerySession**  
`auditQuerySessionId`, `openedBy`, `filtersRef`, `investigationScopeEnvelopeRef`, `purposeOfUse`, `visibilityCoverageRefs[]`, `actingContextRef`, `breakGlassReviewRef`, `coverageState = exact | stale | blocked`, `requiredEdgeCorrelationId`, `requiredContinuityFrameRefs[]`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `investigationQuestionHash`, `missingJoinRefs[]`, `causalityState = complete | accepted_only | visibility_missing | audit_missing | blocked`, `assuranceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseRecoveryDispositionRef`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `timelineReconstructionRef`, `supportReplaySessionRef`, `artifactPresentationContractRef`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `outboundNavigationGrantPolicyRef`, `baseLedgerWatermarkRef`, `reconstructionInputHash`, `timelineHash`, `graphHash`, `createdAt`, `expiresAt`

**AccessEventIndex**  
`accessEventIndexId`, `actorRef`, `subjectRef`, `entityType`, `entityRef`, `actionType`, `eventTime`, `purposeOfUse`, `actingContextRef`, `breakGlassState`, `visibilityCoverageRef`, `disclosureCeilingRef`, `edgeCorrelationId`, `continuityFrameRef`, `auditRecordRef`, `policyDecisionWitnessRef`, `eventHash`

**BreakGlassReviewRecord**  
`breakGlassReviewRecordId`, `eventRef`, `investigationScopeEnvelopeRef`, `timelineReconstructionRef`, `reviewerRef`, `reviewState`, `reasonAdequacy = sufficient | insufficient | contradicted`, `visibilityWideningSummaryRef`, `objectClassCoverageRefs[]`, `expiryBoundaryRef`, `followUpBurdenState = none | attestation_required | peer_review_required | governance_review_required`, `queueState = pending_review | in_review | awaiting_follow_up | expired | closed`, `followUpRequired`, `decisionHash`

**SupportReplaySession**  
`supportReplaySessionId`, `operatorRef`, `targetJourneyRef`, `auditQuerySessionRef`, `investigationScopeEnvelopeRef`, `timelineReconstructionRef`, `timelineRefs`, `timelineHash`, `maskingPolicyRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `originOpsReturnTokenRef`, `evidenceSetHash`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `edgeCorrelationId`, `restoreSettlementRef`, `latestSettlementRef`, `restoreEligibilityState`, `replayDeterminismState`, `routeIntentBindingRef`, `actionRecordRef`, `actionSettlementRef`, `uiEventCausalityFrameRef`, `projectionVisibilityRef`, `auditRecordRef`, `transitionEnvelopeRef`, `uiTelemetryDisclosureFenceRef`, `causalityState = complete | accepted_only | visibility_missing | audit_missing | blocked`

**DataSubjectTrace**  
`dataSubjectTraceId`, `subjectRef`, `investigationScopeEnvelopeRef`, `timelineReconstructionRef`, `relatedEventRefs`, `edgeCorrelationRefs[]`, `projectionVisibilityRefs[]`, `crossSystemRefs`, `maskingPolicyRef`, `disclosureCeilingRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `traceWindow`, `traceMerkleRoot`, `traceHash`, `gapState`, `causalityGapRefs[]`, `reconstructionState`

Build a searchable audit model that can answer questions like:

- who opened this request, task, appointment, or pharmacy case
- when was break-glass used
- what changed between two versions
- which outbound messages were sent and when
- which config version was active when the decision happened
- what the user saw at the time of an incident
- which projection version, shell-decision class, and selected-anchor change became visible before the user saw success, recovery, or stale posture

Support replay must stay safe. Operators should be able to reconstruct the timeline without re-performing actions or viewing data outside role scope.

`InvestigationScopeEnvelope` must bind the current purpose of use, acting context, masking ceiling, selected anchor, and operations-shell return tuple before audit search, break-glass review, replay preview, or export posture can materialize. Ordinary support or operations coverage may not silently widen into break-glass investigation detail inside the same session, and a pivot that changes the diagnostic question must supersede the envelope rather than mutating it in place.

`AuditQuerySession`, `SupportReplaySession`, `BreakGlassReviewRecord`, and `DataSubjectTrace` must all reference the same current `InvestigationScopeEnvelope` plus the same current `InvestigationTimelineReconstruction` while they are answering one investigative question. Support replay may not compute a looser chronology, broader mask scope, or fresher selected anchor than the audit route that spawned it.

`AuditQuerySession.causalityState` must stay `complete` before the system presents authoritative user-visible completion in replay, diff, or export. If the chain contains only `server_accepted`, lacks the matching `UIProjectionVisibilityReceipt`, or lacks the matching `AuditRecord`, the session must surface `accepted_only`, `visibility_missing`, or `audit_missing` and fail closed to read-only recovery.

Timeline reconstruction must be deterministic. Order replay and audit timelines by `(eventTime, sourceSequenceRef, assuranceLedgerEntryId)` after canonical normalization, reconstruct joins by `edgeCorrelationId`, `continuityFrameRef`, and `causalTokenRef`, compute `timelineHash = Merkle(AssuranceLedgerEntry.hash)`, and pin every diff, export, and replay surface to that hash through one `InvestigationTimelineReconstruction` plus the current masking policy, route scope, `graphHash`, and `AssuranceGraphCompletenessVerdict.decisionHash`. If a required event, settlement, visibility receipt, continuity artifact, incident link, CAPA link, or retention artifact is missing, superseded without replacement, out of scope, or hash-divergent, the session must fall to read-only recovery and the export or replay-exit path must remain blocked.

Replay and audit export may not rebuild their own local evidence lists. `AuditQuerySession` and `SupportReplaySession` must consume the same current `AssuranceEvidenceGraphSnapshot` and `AssuranceGraphCompletenessVerdict` used by pack generation and retention. If the graph is merely present but structurally incomplete, replay is diagnostic history only and export remains blocked.

`AccessEventIndex` is a search index, not an alternate audit truth. Search may start from it, but every detail view, diff, replay, and review queue must pivot immediately into the bound `InvestigationScopeEnvelope`, `InvestigationTimelineReconstruction`, and WORM-backed evidence chain instead of staying on raw indexed rows.

`BreakGlassReviewRecord` must show reason adequacy, exact visibility widening, object-class coverage, expiry boundary, mandatory follow-up burden, and queue state together. A reviewer may not have to leave the current shell or open raw audit rows to understand what was widened, why it was widened, how long it lasts, and what burden remains.

Replay exit must be provable as well as safe. Any attempt to leave replay and resume live support work must write `SupportReplayRestoreSettlement`, bind the resumed shell to the latest authoritative settlement and revalidation evidence, carry the replay checkpoint hash, evidence-boundary hash, route-intent tuple, selected-anchor tuple, current mask scope, held-draft disposition, and held mutation-chain state that governed restore, and fail closed to `awaiting_external_hold`, `stale_reacquire`, `read_only_recovery`, or `escalate_recovery` whenever continuity evidence is stale, incomplete, quarantined, or incompatible with the frozen replay proof.

Any pivot from `/ops/audit` into support replay, governance break-glass review, assurance evidence, or preserved artifact detail must preserve the same `investigationQuestionHash`, `scopeHash`, `timelineHash`, and selected-anchor tuple through the relevant return token or return intent. If those tuples drift while the operator is away, the shell must return to read-only diagnostic posture with the last safe summary and the original question still visible.

Any replay-exit, secure-link reissue, communication replay, or attachment-access recovery launched from these routes must resolve one `RouteIntentBinding`, persist one canonical action record, and settle one authoritative command or workflow settlement before the shell implies completion. Local drawer acknowledgement is not authoritative support recovery.

Support replay and audit export must remain PHI-safe but reconstructable. Redacted UI telemetry, disclosure fences, and assurance-ledger joins must still preserve `edgeCorrelationId`, `shellDecisionClass`, `selectedAnchorChangeClass`, proof class, and visibility coverage so review can explain why a shell was reused, recovered, frozen, or replaced without reopening raw patient payloads.

### Frontend work

Build an Audit Explorer with:

- global search by request, patient, task, appointment, pharmacy case, or actor
- one visible investigation-scope ribbon showing purpose of use, masking ceiling, selected anchor, and the preserved diagnostic question
- timeline view
- diff view between versions
- break-glass review queue
- support replay mode
- exportable investigation bundle for approved users

Add an operational support desk surface that can run controlled recovery actions such as secure-link reissue, communication replay, and attachment-access recovery under explicit policy and audit controls. Define those actions in `staff-operations-and-support-blueprint.md`.

Audit Explorer and the support desk should reuse the same `OperationsConsoleShell` masthead, filter semantics, freshness strip, and return-to-board behavior defined in `operations-console-frontend-blueprint.md`.

Investigation-bundle export, replay evidence export, and any route that opens preserved artifacts from audit must use one governed `ArtifactPresentationContract`; if the route leaves the current shell, it must consume one short-lived `OutboundNavigationGrant` bound to the current audit scope, masking policy, and safe return token. `ArtifactTransferSettlement` and `ArtifactFallbackDisposition` must keep the last safe summary visible until authoritative export availability, governed return, or bounded recovery is known. Raw blob URLs or detached export pages are not valid primary audit UX.

This screen must be extremely legible. Dense data is fine. Confusing data is not.

### Tests that must pass before moving on

- WORM tamper-detection tests
- audit-search correctness tests
- timeline-hash reproducibility tests
- break-glass review workflow tests
- support replay masking tests
- support replay restore-settlement, checkpoint-hash, mask-scope, and held-draft revalidation tests
- operations-shell return tests proving audit pivots preserve `investigationQuestionHash`, `scopeHash`, `timelineHash`, and selected-anchor tuple across replay, governance review, and evidence export
- break-glass adequacy, visibility-widening, expiry, and review-burden tests
- actor and subject scoping tests
- replay graph-completeness blocking tests
- investigation-bundle export integrity tests
- audit-export graph parity tests
- investigation-bundle manifest-hash tests
- full cross-journey trace tests

### Exit state

Sensitive actions are now operationally reviewable, not just theoretically logged.

---

## 9D. Assurance pack factory and standards evidence pipeline

This sub-phase turns raw evidence into structured assurance output.

This is where the current standards landscape matters most. DSPT is annual and mandatory for organisations with access to NHS patient data and systems. DTAC remains the framework across 5 core areas and applies alongside other approvals rather than replacing them. DCB0129 and DCB0160 remain mandatory, but NHS England has already begun a review of them to keep pace with newer workflows and technologies. DTAC guidance was also refreshed in March 2026. The engineering implication is that Vecells needs a versioned standards map, not a static checklist baked into code. ([NHS England Digital][1])

### Backend work

Create these objects:

**StandardsVersionMap**  
`standardsVersionMapId`, `frameworkCode`, `frameworkVersion`, `effectiveFrom`, `effectiveTo`, `controlSetRef`

**AssuranceControlRecord**  
`controlRecordId`, `frameworkCode`, `controlCode`, `tenantId`, `state`, `evidenceCoverage`, `ownerRef`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`

**EvidenceGapRecord**  
`evidenceGapRecordId`, `controlRecordId`, `gapType`, `severity`, `dueAt`, `remediationRef`, `assuranceEvidenceGraphSnapshotRef`, `originGraphEdgeRefs[]`, `graphHash`

**FrameworkPackGenerator**  
`generatorId`, `frameworkCode`, `versionRef`, `querySetRef`, `renderTemplateRef`

**MonthlyAssurancePack**  
`monthlyAssurancePackId`, `tenantId`, `month`, `controlStatusRefs`, `incidentRefs`, `exceptionRefs`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `signoffState`

**ContinuityEvidencePackSection**
`continuityEvidencePackSectionId`, `controlCode`, `affectedRouteFamilyRefs[]`, `experienceContinuityEvidenceRefs[]`, `supportingRuntimePublicationRefs[]`, `assuranceEvidenceGraphSnapshotRef`, `graphEdgeRefs[]`, `validationState`, `blockingRefs[]`, `audienceTierRefs[]`, `generatedAt`

**CAPAAction**  
`capaActionId`, `sourceRef`, `rootCauseRef`, `ownerRef`, `targetDate`, `status`, `assuranceEvidenceGraphSnapshotRef`, `evidenceGapRefs[]`, `graphHash`

Add the governing mutation contracts for attestation, sign-off, publish, and export:

**AssurancePackActionRecord**
`assurancePackActionRecordId`, `assurancePackRef`, `actionType = attest | signoff | publish_internal | export_external | supersede`, `routeIntentRef`, `scopeTokenRef`, `packVersionHash`, `evidenceSetHash`, `continuitySetHash`, `graphHash`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `queryPlanHash`, `renderTemplateHash`, `redactionPolicyHash`, `requiredTrustRefs[]`, `assuranceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `transitionEnvelopeRef`, `releaseRecoveryDispositionRef`, `idempotencyKey`, `actorRef`, `createdAt`, `settledAt`

**AssurancePackSettlement**
`assurancePackSettlementId`, `assurancePackActionRecordRef`, `commandActionRecordRef`, `commandSettlementRecordRef`, `uiTransitionSettlementRecordRef`, `uiTelemetryDisclosureFenceRef`, `presentationArtifactRef`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `result = pending_attestation | signed_off | published_internal | export_ready | blocked_graph | blocked_trust | stale_pack | denied_scope | failed`, `serializedArtifactHash`, `exportManifestHash`, `reproductionHash`, `reproductionState = exact | drifted | blocked`, `recoveryActionRef`, `recordedAt`

Build pack generators for at least:

- DSPT operational evidence pack
- DTAC evidence refresh pack
- DCB0129 manufacturer safety pack delta
- DCB0160 deployment handoff pack
- NHS App post-live monthly operational pack
- IM1 and NHS-integrated change pack deltas where required

Pack generation and export must be deterministic. Let `E_pack` be the ordered admissible evidence set after scope filtering, freshness gating, trust gating, and redaction. Let `H_pack = Merkle(E_pack)` and `P_pack = H(frameworkVersion || queryPlanHash || renderTemplateHash || redactionPolicyHash || continuitySetHash || graphHash || AssuranceGraphCompletenessVerdict.decisionHash || trustSnapshotSet || H_pack)`. `packVersionHash` must equal `P_pack`; any drift invalidates sign-off and export.

Use this algorithm:

1. resolve the active framework version
2. map control records to evidence queries
3. canonicalize the resulting evidence rows and compute `evidenceSetHash`, `continuitySetHash`, and `queryPlanHash`
4. materialize or refresh the current `AssuranceEvidenceGraphSnapshot` and `AssuranceGraphCompletenessVerdict` for that scope, compute `graphHash`, and only then derive `packVersionHash` before any pack rows are considered admissible
5. generate a draft pack with completeness scoring and exact section provenance from that graph snapshot, not from ad hoc query joins
6. attach incidents, exceptions, and CAPA items only when the current graph shows the same standards version map, control record lineage, and unsuperseded edge set for them
7. attach `ContinuityEvidencePackSection` rows whenever the pack covers patient-navigation, record-follow-up, conversation-settlement, support-replay, intake-resume, booking-manage, assistive-session, workspace-task-completion, pharmacy-console-settlement, release, or incident controls that depend on those behaviors
8. validate missing or stale evidence and block immediately if trust lower bounds, deterministic replay checks, graph completeness, or redaction parity fail
9. require attestation and sign-off through `AssurancePackActionRecord(actionType = attest | signoff)` pinned to the current hashes, graph verdict, included continuity-evidence sections, and required `AssuranceSliceTrustRecord` rows
10. if the pack, framework version, graph snapshot, graph completeness verdict, included continuity evidence, required trust posture, surface publication, runtime bundle, query plan, render template, or redaction policy drifts before settlement, return `AssurancePackSettlement.result = blocked_graph | blocked_trust | stale_pack`, bind one `TransitionEnvelope`, and keep the same shell in the declared `ReleaseRecoveryDisposition`
11. publish internally and export externally only after a settled `AssurancePackSettlement(result = signed_off | published_internal | export_ready)` proves the current hashes, graph verdict, continuity evidence, trust posture, and scope are still valid
12. render export bytes only from the canonical pack snapshot, compute `serializedArtifactHash`, `exportManifestHash`, and `reproductionHash`, and block export unless a same-version re-render reproduces the same digest exactly

### Frontend work

Build an Assurance Center with:

- framework selector
- control heat map
- evidence completeness status
- evidence-gap queue
- attestation workflow
- pack preview and export
- CAPA tracker

When a pack depends on patient, support, or workflow continuity controls, the preview must expose the relevant `ContinuityEvidencePackSection` beside the ordinary control evidence. Export, sign-off, and attestation may not treat those sections as optional appendix material.

Attestation, sign-off, publish, and export controls must surface the authoritative `AssurancePackSettlement` in the same continuity path as the current pack preview. The shell may show local acknowledgement, but it may not imply a published or exportable pack until the current pack version, scope token, and required trust posture have settled.

Pack preview, signed pack render, export bundle, deletion certificate lookup, and archive manifest viewer must each render through one governed `ArtifactPresentationContract`. Any external export or browser handoff must consume one `OutboundNavigationGrant` tied to the current pack version hash, masking or redaction policy, and return path, and pack export may not look complete until `ArtifactTransferSettlement.authoritativeTransferState` is ready or fallback is promoted in place.

Pack preview must expose the current pack version hash, evidence-set hash, continuity-set hash, `graphHash`, `AssuranceGraphCompletenessVerdict.decisionHash`, redaction-policy hash, and reproduction state before any export control is armed.

The design should feel like a productized governance system, not a filing cabinet. Assurance Center should remain a child lens of the same operations shell rather than a visually disconnected admin product.

### Tests that must pass before moving on

- framework-version mapping tests
- evidence-completeness calculation tests
- evidence-graph completeness and orphan-edge tests
- pack-generation determinism tests
- export-manifest reproducibility tests
- query-plan and render-template drift tests
- graph-hash drift invalidation tests
- export redaction tests
- CAPA lifecycle tests
- stale-evidence alert tests
- intake-resume continuity-evidence tests
- booking-manage continuity-evidence tests
- assistive-session continuity-evidence tests
- assistive feedback-chain and training-eligibility evidence tests
- workspace-task-completion continuity-evidence tests
- pharmacy-console-settlement continuity-evidence tests
- sign-off workflow tests
- continuity-evidence pack-section generation tests
- pack publish-blocking tests for stale or missing continuity evidence
- pack publish-blocking tests for stale or incomplete graph verdicts

### Exit state

Vecells can now generate credible assurance packs from live evidence rather than rebuilding the service in PowerPoint every month.

---

## 9E. Records lifecycle, retention, legal hold, and deletion engine

This sub-phase gives the platform a governed data lifecycle.

The Records Management Code of Practice is explicit that it covers storage, retention, and deletion, and that different classes of records should be kept for different periods. It also explicitly says the HTML version is the most up-to-date version. For recorded media and derived outputs, NHS England’s information-governance guidance also says transcripts or summaries of recordings should be retained in line with the Records Management Code as appropriate, and anything not covered should be decided case by case with the records-management or IG lead. ([NHS Transformation Directorate][5])

The lifecycle engine requires six corrections:

1. lifecycle classification must be bound once at artifact creation time instead of inferred later from blob paths, mime types, or batch naming
2. `RetentionFreezeRecord` and `LegalHoldRecord` must operate as one preservation-first control plane rather than parallel operator workflows
3. delete and archive automation must execute only from explicit eligibility assessments, not raw storage scans or silent nightly jobs
4. dependency protection must remain transitive across assurance packs, replay proof, investigation bundles, certificates, manifests, and other derived governance artifacts
5. blocked disposition must stay intelligible through governed explainers, not opaque batch failure or hidden policy logic
6. records lifecycle review, hold management, and disposition approval must live in one restricted governance shell instead of runbook folklore

### Backend work

Create these objects:

**RetentionLifecycleBinding**
`retentionLifecycleBindingId`, `artifactRef`, `artifactVersionRef`, `artifactClassRef`, `retentionClassRef`, `disposalMode`, `immutabilityMode`, `dependencyCheckPolicyRef`, `minimumRetentionOverrideRef`, `activeFreezeRefs[]`, `activeLegalHoldRefs[]`, `graphCriticality = ordinary | replay_critical | worm | hash_chained`, `lifecycleState = active | superseded | retired`, `classificationHash`, `createdAt`

**RetentionClass**  
`retentionClassId`, `recordType`, `basisRef`, `minimumRetention`, `reviewPoint`, `disposalMode`, `immutabilityMode`, `dependencyCheckPolicyRef`, `sourcePolicyRef`, `freezeEscalationPolicyRef`, `legalHoldEscalationPolicyRef`, `derivativeRetentionPolicyRef`, `classState = active | superseded | retired`, `policyTupleHash`

**RetentionDecision**  
`retentionDecisionId`, `artifactRef`, `retentionLifecycleBindingRef`, `retentionClassRef`, `decisionDate`, `deleteAfter`, `archiveAfter`, `activeFreezeRefs[]`, `activeLegalHoldRefs[]`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphEdgeRefs[]`, `dispositionEligibilityAssessmentRef`, `effectiveDisposition = preserve | archive_only | archive_pending | delete_pending | deleted | blocked`, `supersedesDecisionRef`, `decisionHash`

**ArtifactDependencyLink**  
`dependencyLinkId`, `artifactRef`, `dependentArtifactRef`, `governingScopeRef`, `dependencyType`, `dependencyStrength = explanatory | replay_required | legal_preservation_required | disposal_blocking`, `activeState`, `sourceGraphEdgeRef`, `linkHash`

**LegalHoldScopeManifest**
`legalHoldScopeManifestId`, `legalHoldRecordRef`, `scopeType = artifact | request | episode | incident | control_pack`, `scopeEntityRefs[]`, `artifactRefs[]`, `freezeRefs[]`, `dependencyLinkRefs[]`, `scopeHash`, `capturedAt`

**LegalHoldRecord**  
`legalHoldRecordId`, `scopeRef`, `scopeManifestRef`, `scopeHash`, `reasonCode`, `originType = governance | legal | incident | regulatory | patient_dispute`, `placedBy`, `placedAt`, `reviewDate`, `holdState = pending_review | active | released | superseded`, `freezeRef`, `supersedesHoldRef`, `releasedAt`, `releaseReason`, `holdHash`

**DispositionEligibilityAssessment**
`dispositionEligibilityAssessmentId`, `artifactRef`, `retentionLifecycleBindingRef`, `retentionDecisionRef`, `activeFreezeRefs[]`, `activeLegalHoldRefs[]`, `activeDependencyLinkRefs[]`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `eligibilityState = blocked | archive_only | delete_allowed`, `blockingReasonRefs[]`, `assessmentHash`, `assessedAt`

**DispositionJob**  
`dispositionJobId`, `artifactRefs`, `candidateAssessmentRefs[]`, `actionType`, `scheduledAt`, `executedAt`, `jobScopeHash`, `resultArtifactRef`, `resultState = queued | blocked | executing | partially_completed | completed | aborted`

**DispositionBlockExplainer**
`dispositionBlockExplainerId`, `artifactRef`, `assessmentRef`, `blockingReasonRefs[]`, `activeDependencyRefs[]`, `activeFreezeRefs[]`, `activeLegalHoldRefs[]`, `summaryProjectionRef`, `artifactPresentationContractRef`, `generatedAt`

**DeletionCertificate**  
`deletionCertificateId`, `artifactRef`, `retentionDecisionRef`, `dispositionJobRef`, `assessmentRef`, `hashAtDeletion`, `deletedAt`, `deletedBySystemVersion`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `freezeRefs[]`, `legalHoldRefs[]`, `dependencyExplainerRef`, `certificateHash`

**ArchiveManifest**  
`archiveManifestId`, `artifactRefs`, `retentionDecisionRefs[]`, `candidateAssessmentRefs[]`, `archiveLocationRef`, `checksumBundleRef`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `freezeRefs[]`, `legalHoldRefs[]`, `manifestHash`, `createdAt`

`RetentionLifecycleBinding` is the creation-time lifecycle authority for every durable artifact. Retention, archive, delete, replay, export, and governance review may not infer lifecycle from storage path, blob metadata, or operator convention once this binding exists.

`DispositionEligibilityAssessment` is the only archive or delete gate. `DispositionJob` may queue artifacts only from current assessments, and every assessment must be pinned to the same freeze state, hold scope, dependency set, and assurance-evidence graph posture that justified the disposition outcome.

Every durable object created in prior phases should now carry a lifecycle class at creation time, but those classes must distinguish ordinary records from immutable evidence:

**Policy-driven archive or delete classes**

- request snapshots
- task timelines
- appointment records
- hub case records
- pharmacy case records
- transcripts
- draft-note artifacts
- incident records

**Archive-only or immutable classes**

- audit entries
- assurance ledger entries
- hash-chain records
- retention freeze records
- freeze bundle manifests
- legal hold records
- deletion certificates
- archive manifests

**Replay-critical classes**

- config history
- prompt versions
- model traces and evaluation artifacts
- evidence capture bundles
- evidence derivation packages
- evidence redaction transforms
- evidence summary parity records
- assistive input and output evidence snapshots that are linked to patient-specific decisions, release cohorts, assurance packs, incidents, or safety cases

WORM and hash-chained artifacts must never be scheduled for deletion. Replay-critical artifacts may be archived, but they must not be deleted while any active dependency link exists.

Signed-off packs, replay sessions, incident bundles, and recovery artifacts are graph dependencies too. If the current `AssuranceEvidenceGraphSnapshot` still shows an artifact as required by an unsuperseded control evaluation, continuity section, CAPA chain, export, deletion certificate, archive manifest, or replay proof, retention must fail closed to archive-only or blocked posture. Retention may never improve graph completeness by deleting the very node whose absence would have failed the graph.

Use this algorithm:

1. mint one `RetentionLifecycleBinding` at artifact creation time and assign its initial `RetentionClass`, `disposalMode`, and `immutabilityMode`
2. attach the first `RetentionDecision` and any required `ArtifactDependencyLink` rows immediately; derivative artifacts must never wait for a later batch to discover their source lineage
3. converge any active `RetentionFreezeRecord` and `LegalHoldRecord` onto the same preservation scope before archival or deletion posture can materialize; repeated preservation triggers must widen or supersede the current scope rather than create parallel ambiguous holds
4. materialize one current `DispositionEligibilityAssessment` from the binding, decision, freeze state, hold scope, dependency links, current `AssuranceEvidenceGraphSnapshot`, current `AssuranceGraphCompletenessVerdict`, and `graphHash`
5. admit artifacts into `DispositionJob` only when the latest assessment is `archive_only` or `delete_allowed`; raw storage scans, bucket prefixes, and operator-curated CSVs are not valid disposition inputs
6. if an artifact is WORM, hash-chained, immutable, or replay-critical with active dependencies, preserve or archive only and retain integrity hashes; those classes may never enter a delete-ready assessment
7. if a freeze or hold is released, issue a superseding `DispositionEligibilityAssessment` before any queued job may proceed; hold release or freeze release alone is not delete authority
8. issue `DeletionCertificate` or `ArchiveManifest` pinned to the same assessment, graph snapshot, completeness verdict, and graph hash that justified the action, and keep blocked disposition legible through `DispositionBlockExplainer`
9. append lifecycle events, hold placement or release, assessments, archive moves, and deletions to the assurance ledger

Deletion certificates, archive manifests, legal-hold notices, and dependency explainers are governed operator artifacts. They must render summary-first through `ArtifactPresentationContract`; external export, print, or cross-app handoff must use `OutboundNavigationGrant` rather than raw storage URLs.

### Frontend work

Build a restricted Records Governance surface with:

- retention class browser
- legal hold queue
- freeze and hold scope review
- upcoming disposition jobs
- disposition exceptions
- deletion certificate lookup
- archive manifest viewer
- dependency and immutability explainer for blocked deletions

This UI should be quiet and precise. No casual destructive actions.

### Tests that must pass before moving on

- retention-class assignment tests
- `RetentionLifecycleBinding` creation-time immutability tests
- legal-hold override tests
- legal-hold scope-manifest and supersession tests
- deletion-certificate integrity tests
- archive-manifest checksum tests
- assurance-graph dependency preservation tests
- transcript-retention policy tests
- policy-change propagation tests
- disposition-assessment admission tests proving jobs never execute from raw storage scans or stale assessments
- WORM-exclusion tests proving audit and assurance-ledger entries never enter delete jobs
- replay-critical dependency protection tests for model traces, config history, evidence snapshots, capture bundles, derivation packages, redaction transforms, and parity records
- retention-freeze reuse and supersession tests proving repeated preservation triggers cannot create parallel ambiguous freeze or hold scope
- freeze-release and hold-release re-assessment tests proving release alone does not authorize deletion
- transitive dependency-block tests for deletion certificates, archive manifests, assurance packs, replay proof, and preserved investigation artifacts
- disposition safety tests in non-production and production-like environments

### Exit state

Data retention and deletion are now controlled by one preservation-first lifecycle engine, one governance review surface, and one evidence-backed disposition gate without breaking the WORM audit promise or the replayability of assistive decisions.

## 9F. Resilience architecture, restore orchestration, and chaos programme

This sub-phase proves the service can survive failure.

CAF-aligned DSPT now expects a higher bar for testing the incident-response cycle, and it explicitly says organisations should test all parts of the response cycle so they can restore business operations. The resilience guidance also says organisations should understand which systems matter most to restoring essential functions and the order in which interdependent systems can be brought back online. NHS England’s cyber incident response exercise framework is also now a live source of reusable health-and-care-specific scenarios for rehearsing incident response. ([NHS England Digital][4])

### Backend work

Create these objects:

**EssentialFunctionMap**  
`essentialFunctionMapId`, `functionCode`, `audienceScopeRefs[]`, `businessOwnerRef`, `recoveryTierRef`, `supportingSystemRefs[]`, `supportingDataRefs[]`, `dependencyOrderRef`, `degradedModeRefs[]`, `runbookBindingRefs[]`, `currentOperationalReadinessSnapshotRef`, `functionState = mapped | rehearsal_due | recovery_only | retired`

**RecoveryTier**  
`recoveryTierId`, `functionCode`, `rto`, `rpo`, `maxDiagnosticOnlyWindow`, `degradedModeDefinitionRef`, `restorePriority`, `requiredJourneyProofRefs[]`, `requiredDependencyRestoreProofRefs[]`, `requiredFailoverScenarioRefs[]`, `requiredChaosExperimentRefs[]`, `requiredBackupScopeRefs[]`, `tierState = active | superseded | retired`

**BackupSetManifest**  
`backupSetManifestId`, `datasetScopeRef`, `essentialFunctionRefs[]`, `recoveryTierRefs[]`, `snapshotTime`, `immutabilityState = immutable | mutable | disputed`, `restoreTestState = current | stale | blocked | missing`, `checksumBundleRef`, `restoreCompatibilityDigestRef`, `dependencyOrderDigestRef`, `requiredJourneyProofContractRefs[]`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `releaseWatchTupleRef`, `watchTupleHash`, `latestRecoveryEvidencePackRef`, `latestResilienceActionSettlementRef`, `resilienceTupleHash`, `manifestTupleHash`, `manifestState = current | stale | superseded | withdrawn`, `verifiedAt`

**RestoreRun**  
`restoreRunId`, `releaseRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `watchTupleHash`, `essentialFunctionRefs[]`, `recoveryTierRefs[]`, `targetEnvironmentRef`, `backupSetManifestRefs[]`, `operationalReadinessSnapshotRef`, `runbookBindingRefs[]`, `recoveryControlPostureRef`, `dependencyOrderDigestRef`, `dependencyProofArtifactRefs[]`, `journeyProofArtifactRefs[]`, `syntheticRecoveryCoverageRefs[]`, `restoreTupleHash`, `resilienceTupleHash`, `scopeTupleHash`, `dependencyValidationState = pending | complete | blocked`, `journeyValidationState = pending | complete | blocked`, `initiatedAt`, `completedAt`, `resultState = running | data_restored | journey_validation_pending | succeeded | failed | superseded`, `evidenceArtifactRefs[]`, `recoveryEvidencePackRef`, `resilienceActionSettlementRef`

**FailoverScenario**  
`failoverScenarioId`, `targetFunction`, `essentialFunctionRefs[]`, `recoveryTierRefs[]`, `triggerType`, `degradedModeRef`, `successCriteriaRef`, `requiredRunbookBindingRefs[]`, `requiredSyntheticRecoveryCoverageRefs[]`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `activationPolicyRef`, `scopeTupleHash`, `scenarioHash`, `scenarioState = draft | approved | withdrawn`

**FailoverRun**
`failoverRunId`, `releaseRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `watchTupleHash`, `failoverScenarioRef`, `essentialFunctionRefs[]`, `recoveryTierRefs[]`, `operationalReadinessSnapshotRef`, `runbookBindingRefs[]`, `recoveryControlPostureRef`, `failoverTupleHash`, `resilienceTupleHash`, `scopeTupleHash`, `degradedModeRef`, `dependencyOrderDigestRef`, `journeyProofArtifactRefs[]`, `syntheticRecoveryCoverageRefs[]`, `validationState = pending | complete | blocked`, `startedAt`, `completedAt`, `resultState = armed | active | validation_pending | stood_down | failed | superseded`, `evidenceArtifactRefs[]`, `recoveryEvidencePackRef`, `resilienceActionSettlementRef`

**ChaosExperiment**  
`chaosExperimentId`, `blastRadiusRef`, `essentialFunctionRefs[]`, `recoveryTierRefs[]`, `hypothesisRef`, `guardrailRefs[]`, `requiredSyntheticRecoveryCoverageRefs[]`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `approvalPolicyRef`, `approvedScopeTupleHash`, `experimentHash`, `experimentState = draft | approved | withdrawn`

**ChaosRun**
`chaosRunId`, `releaseRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `watchTupleHash`, `chaosExperimentRef`, `essentialFunctionRefs[]`, `recoveryTierRefs[]`, `operationalReadinessSnapshotRef`, `runbookBindingRefs[]`, `recoveryControlPostureRef`, `chaosTupleHash`, `resilienceTupleHash`, `scopeTupleHash`, `blastRadiusRef`, `guardrailState = approved | constrained | blocked`, `journeyProofArtifactRefs[]`, `syntheticRecoveryCoverageRefs[]`, `startedAt`, `completedAt`, `resultState = scheduled | running | halted | completed | failed | superseded`, `evidenceArtifactRefs[]`, `recoveryEvidencePackRef`, `resilienceActionSettlementRef`

**RecoveryEvidencePack**  
`recoveryEvidencePackId`, `releaseRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `watchTupleHash`, `periodWindow`, `operationalReadinessSnapshotRef`, `recoveryTierRefs[]`, `backupSetManifestRefs[]`, `restoreRunRefs[]`, `failoverRunRefs[]`, `chaosRunRefs[]`, `syntheticRecoveryCoverageRefs[]`, `latestResilienceActionSettlementRefs[]`, `readinessStateAtPackTime`, `packTupleHash`, `resilienceTupleHash`, `artifactRefs[]`, `attestationState`, `packState = current | stale | blocked | superseded`

**ResilienceSurfaceRuntimeBinding**
`resilienceSurfaceRuntimeBindingId`, `routeFamilyRef`, `audienceSurfaceRuntimeBindingRef`, `audienceSurfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `requiredAssuranceSliceRefs[]`, `releaseTrustFreezeVerdictRef`, `releaseWatchTupleRef`, `watchTupleHash`, `operationalReadinessSnapshotRef`, `requiredRunbookBindingRefs[]`, `requiredRecoveryTierRefs[]`, `requiredBackupSetManifestRefs[]`, `latestRecoveryEvidencePackRef`, `requiredSyntheticRecoveryCoverageRefs[]`, `latestResilienceActionSettlementRefs[]`, `recoveryControlPostureRef`, `releaseRecoveryDispositionRef`, `bindingTupleHash`, `bindingState = live | diagnostic_only | recovery_only | blocked`

**RecoveryControlPosture**
`recoveryControlPostureId`, `scopeRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `watchTupleHash`, `publicationState`, `trustState`, `freezeState`, `releaseTrustFreezeVerdictRef`, `operationalReadinessSnapshotRef`, `requiredRunbookBindingRefs[]`, `recoveryTierRefs[]`, `requiredBackupSetManifestRefs[]`, `requiredSyntheticRecoveryCoverageRefs[]`, `latestRestoreRunRef`, `latestFailoverRunRef`, `latestChaosRunRef`, `currentRecoveryEvidencePackRef`, `latestRecoveryEvidencePackRef`, `latestResilienceActionSettlementRefs[]`, `restoreValidationFreshnessState = fresh | stale | expired | missing`, `failoverValidationFreshnessState = fresh | stale | expired | missing`, `chaosValidationFreshnessState = fresh | stale | expired | missing`, `dependencyCoverageState = complete | partial | blocked`, `journeyRecoveryCoverageState = exact | partial | missing`, `backupManifestState = current | stale | missing`, `evidencePackAdmissibilityState = exact | stale | blocked`, `postureState = live_control | diagnostic_only | governed_recovery | blocked`, `allowedActionRefs[]`, `blockerRefs[]`, `authoritativeScopeTupleHash`, `controlTupleHash`, `releaseRecoveryDispositionRef`, `lastComputedAt`

**ResilienceActionRecord**
`resilienceActionRecordId`, `routeIntentBindingRef`, `actionType = restore_prepare | restore_start | restore_validate | failover_activate | failover_validate | failover_stand_down | chaos_schedule | chaos_start | chaos_abort | recovery_pack_attest`, `scopeRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `watchTupleHash`, `resilienceSurfaceRuntimeBindingRef`, `operationalReadinessSnapshotRef`, `recoveryControlPostureRef`, `backupSetManifestRefs[]`, `requiredSyntheticRecoveryCoverageRefs[]`, `scopeTupleHash`, `submittedBy`, `submittedAt`, `commandActionRecordRef`

**ResilienceActionSettlement**
`resilienceActionSettlementId`, `resilienceActionRecordRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `watchTupleHash`, `commandSettlementRef`, `transitionEnvelopeRef`, `authoritativeRunRefs[]`, `recoveryEvidencePackRef`, `syntheticRecoveryCoverageRefs[]`, `recoveryEvidenceArtifactRefs[]`, `result = accepted_pending_evidence | applied | blocked_publication | blocked_trust | blocked_readiness | blocked_guardrail | frozen | stale_scope | failed | superseded`, `recordedPostureRef`, `scopeTupleHash`, `controlTupleHash`, `releaseRecoveryDispositionRef`, `settledAt`

**RecoveryEvidenceArtifact**
`recoveryEvidenceArtifactId`, `artifactType = restore_report | failover_report | chaos_report | recovery_pack_export | dependency_restore_explainer | journey_recovery_proof | backup_manifest_report | runbook_bundle | readiness_snapshot_summary`, `scopeRef`, `verificationScenarioRef`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseWatchTupleRef`, `watchTupleHash`, `operationalReadinessSnapshotRef`, `recoveryControlPostureRef`, `runbookBindingRefs[]`, `backupSetManifestRefs[]`, `producingRunRef`, `recoveryEvidencePackRef`, `syntheticRecoveryCoverageRefs[]`, `latestResilienceActionSettlementRefs[]`, `summaryRef`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `artifactPresentationContractRef`, `artifactSurfaceContextRef`, `artifactModeTruthProjectionRef`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `outboundNavigationGrantPolicyRef`, `maskingPolicyRef`, `externalHandoffPolicyRef`, `selectedAnchorRef`, `returnIntentTokenRef`, `resilienceTupleHash`, `artifactState = summary_only | governed_preview | external_handoff_ready | recovery_only`

The readiness contracts from `platform-runtime-and-release-blueprint.md` are part of this resilience control plane, not adjacent documentation. `OperationalReadinessSnapshot` and `RunbookBindingRecord` must therefore be treated as required resilience inputs for every restore, failover, chaos, and recovery-pack action rather than as preflight links that operators are expected to interpret manually.

The current resilience tuple is the exact join of `VerificationScenario`, `ReleaseContractVerificationMatrix`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, `ReleaseWatchTuple`, the active `OperationalReadinessSnapshot`, required `RunbookBindingRecord` rows, current `BackupSetManifest` rows, the current `RecoveryEvidencePack`, and the in-scope `SyntheticRecoveryCoverageRecord` set. `BackupSetManifest`, `RestoreRun`, `FailoverRun`, `ChaosRun`, `RecoveryEvidencePack`, `ResilienceSurfaceRuntimeBinding`, `RecoveryControlPosture`, `ResilienceActionRecord`, `ResilienceActionSettlement`, and `RecoveryEvidenceArtifact` may remain visible after drift, but they stop being live authority the moment that `resilienceTupleHash` no longer matches current runtime truth.

`RecoveryTier` is incomplete unless it declares the dependency-restore proof, journey proof, failover scenario, chaos experiment, and backup scope needed to recover that essential function under its allowed diagnostic and degraded window. A tier that can restore data but cannot prove dependency order or one end-to-end journey remains `rehearsal_due`.

Start by mapping essential functions, not infrastructure components. For Vecells those are likely:

- digital intake
- safety gate
- triage queue
- patient status and secure links
- local booking
- hub coordination
- pharmacy referral loop
- outbound comms
- audit search
- assistive layer downgrade path

Then map dependencies in restore order.

Use this resilience algorithm:

1. define essential functions and recovery tiers
2. map systems, data, and dependency ordering
3. capture or refresh one tuple-bound `OperationalReadinessSnapshot` and required `RunbookBindingRecord` set for the current runtime publication bundle, watch tuple, recovery dispositions, and essential-function map before any resilience control is exposed
4. bind every live resilience route or action to one `ResilienceSurfaceRuntimeBinding` over a current `AudienceSurfaceRuntimeBinding` with exact publication parity before any restore, failover, or chaos control is exposed
5. create backup manifests with immutability, checksum verification, and tuple-compatible restore digests
6. restore into clean environments on a regular schedule
7. validate functional restore, dependency ordering, and at least one end-to-end journey proof for every essential function in scope, not just database restore
8. derive one `RecoveryControlPosture` from publication state, assurance trust, active freezes, current `OperationalReadinessSnapshot`, bound `RunbookBindingRecord` rows, backup-manifest freshness, dependency coverage, restore-validation freshness, failover-validation freshness, chaos-validation freshness, and current evidence-pack admissibility before enabling any operator control
9. run failover and degraded-mode exercises through `FailoverRun`, not just scenario approval
10. route every restore, failover, chaos, and attestation command through one `RouteIntentBinding`, one `CommandActionRecord`, and one `ResilienceActionSettlement`; local acknowledgement is not authoritative recovery state
11. run chaos experiments within approved blast radius and persist them as `ChaosRun`
12. render restore reports, failover reports, backup explainers, journey proofs, readiness summaries, and recovery-pack exports through governed `RecoveryEvidenceArtifact` and `ArtifactPresentationContract` rules, pinned to the current `AssuranceEvidenceGraphSnapshot`, `AssuranceGraphCompletenessVerdict`, and `graphHash`
13. write recovery evidence into the assurance ledger, attach it to the current assurance-evidence graph, and refresh affected `OperationalReadinessSnapshot`, `RunbookBindingRecord`, `ResilienceSurfaceRuntimeBinding`, and `RecoveryControlPosture` rows whenever the live tuple or latest recovery proof changes

If publication becomes stale, withdrawn, quarantined, or trust-blocked, or if a release freeze invalidates the current exercise posture, the current shell must remain in place and degrade through the bound `ReleaseRecoveryDisposition`. Resilience Board may not continue to imply live restore or failover authority just because the last board snapshot looked healthy.

Restore completion, failover completion, and chaos completion are authoritative only when the bound `ResilienceActionSettlement` confirms the current route intent, publication tuple, current `OperationalReadinessSnapshot`, current `RunbookBindingRecord` set, and `RecoveryControlPosture`. A completed log line in one subsystem is not enough to reopen wider controls.

A `RecoveryEvidencePack` is admissible only while `packState = current`, its `resilienceTupleHash` still matches the live tuple, and its graph proof remains complete. Historical packs stay explorable, but they may not clear blockers, re-arm controls, or satisfy current rehearsal freshness once tuple drift or graph drift occurs.

Stale or superseded `RestoreRun`, `FailoverRun`, and `ChaosRun` rows remain operational history, but they may not satisfy current `RecoveryControlPosture.restoreValidationFreshnessState`, dependency coverage, or journey recovery coverage after tuple drift. The board must keep those prior runs visible as evidence while refusing to treat them as live authority.

Recovery reports, backup manifests, dependency explainers, and attested evidence packs are governed operator artifacts. Summary-first rendering is mandatory; governed preview, export, print, or browser handoff may remain live only while the current `ArtifactModeTruthProjection` still validates parity, masking scope, graph admissibility, and return-safe continuity. Raw object-store links are forbidden.

### Frontend work

Build a Resilience Board inside the operations console with:

- essential function map
- dependency graph
- backup freshness
- latest restore result
- next scheduled exercise
- degraded-mode readiness
- open recovery risks

The board and its drill-down routes must resolve one `ResilienceSurfaceRuntimeBinding` and current `RecoveryControlPosture` before showing live controls for restore start, restore validation, failover activation, failover stand-down, chaos scheduling, or chaos abort. If publication, trust, or freeze posture drifts, the board must stay in the same shell, keep the current evidence visible, and shift to the declared `ReleaseRecoveryDisposition` rather than clearing context or leaving stale controls armed.

`ResilienceSurfaceRuntimeBinding.bindingState = live` and any executable `RecoveryControlPosture.allowedActionRefs` are legal only while the linked `ReleaseTrustFreezeVerdict.surfaceAuthorityState = live`, the linked `latestRecoveryEvidencePackRef.packState = current`, and `bindingTupleHash` still matches the current `OperationalReadinessSnapshot.resilienceTupleHash`. Degraded trust, constrained guardrails, active channel freeze, stale evidence-pack admissibility, or tuple drift may still preserve diagnostic evidence, but they must downgrade the board to `diagnostic_only`, `recovery_only`, or `blocked` before any restore or failover control can re-arm.

The primary board summary must show the current `OperationalReadinessSnapshot`, stale or unrehearsed `RunbookBindingRecord` rows, backup-manifest freshness, latest `RestoreRun`, latest `FailoverRun`, latest `ChaosRun`, current dependency-order coverage, journey-recovery proof debt, and current `RecoveryEvidencePack.packState` for the selected essential function. Operators should not have to jump between dashboards and loose runbook links to answer whether recovery is actually live-authoritative right now.

Every operator action on this surface must produce one `ResilienceActionRecord` and settle through one `ResilienceActionSettlement`. Pending banners are allowed, but the UI may not imply that a restore proved clean, a failover is active, or a chaos run is approved until the authoritative settlement confirms the current scope, posture, readiness snapshot, and evidence set.

Restore reports, failover reports, chaos evidence, backup manifests, and recovery-pack exports must render through one governed `ArtifactPresentationContract`. Any print flow, download, or external handoff must consume one `OutboundNavigationGrant` bound to the current recovery scope, masking policy, and safe return path, while `ArtifactModeTruthProjection`, `ArtifactTransferSettlement`, and `ArtifactFallbackDisposition` keep recovery evidence summary-first and same-shell if parity, scope, trust posture, byte-delivery viability, or return continuity drifts.

This should feel serious and concise. Resilience Board should reuse the same command masthead, scope filters, freshness semantics, and drill-down patterns defined in `operations-console-frontend-blueprint.md` so operators do not have to learn a second console. Operators should know within seconds whether the platform can recover and what is currently weak.

All PHI-bearing resilience transitions across Resilience Board, restore drill-down, failover control, backup manifest review, and chaos evidence review must emit canonical UI observability:

- one `UIEventEnvelope`
- one `UITransitionSettlementRecord` whenever local acknowledgement can diverge from authoritative settlement or recovery posture
- one `UITelemetryDisclosureFence` proving that backup scopes, environment identifiers, incident references, investigation notes, and artifact fragments were redacted to the permitted disclosure class

### Tests that must pass before moving on

- clean-environment restore tests
- cross-service dependency restore tests
- degraded-mode activation tests
- notification fallback tests
- failover timing tests
- chaos guardrail tests
- recovery-evidence pack generation tests
- `RecoveryEvidencePack` tuple-admissibility tests proving stale packs and stale graph joins cannot satisfy current posture
- full restore of at least one end-to-end patient journey and one staff journey
- route-publication binding tests for `/ops/resilience/*` and restore drill-down routes
- `OperationalReadinessSnapshot` freshness and tuple-drift tests for resilience routes and actions
- `RunbookBindingRecord` rehearsal and withdrawal tests proving stale runbooks downgrade live control posture
- `RecoveryControlPosture` downgrade tests for stale publication, frozen release, degraded trust, and expired restore validation
- stale or superseded `RestoreRun`, `FailoverRun`, and `ChaosRun` tests proving old evidence cannot satisfy current posture
- authoritative settlement tests proving restore, failover, and chaos controls remain pending or blocked until `ResilienceActionSettlement` lands
- approved scope and blast-radius tests proving `FailoverScenario` and `ChaosExperiment` cannot be reused outside the current resilience tuple
- recovery-evidence writeback tests proving settled runs refresh assurance-ledger and readiness state instead of remaining detached operational history
- artifact redaction and `OutboundNavigationGrant` tests for restore reports, backup manifests, and recovery-pack exports
- UI observability redaction tests for resilience transitions and evidence review flows

### Exit state

The platform can now demonstrate recovery, not just claim it.

---

## 9G. Security operations, incident workflow, and just-culture reporting

This sub-phase makes operational security a routine workflow instead of a side-channel panic path.

DSPT now includes an incident-reporting capability, and NHS England states that reportable data-security and protection incidents must be notified through that reporting tool. CAF-aligned DSPT guidance also emphasises a positive information-assurance culture, leadership attention, and staff willingness to report breaches, near misses, and problem processes rather than hide them. ([NHS England Digital][1])

### Backend work

Create these objects:

**SecurityIncident**  
`securityIncidentId`, `incidentType`, `sourceRef`, `detectedAt`, `severity`, `impactScope`, `status`, `reportabilityAssessmentRef`

**NearMissReport**  
`nearMissReportId`, `reportedBy`, `contextRef`, `summaryRef`, `investigationState`, `linkedIncidentRef`

**ReportabilityAssessment**  
`assessmentId`, `incidentRef`, `frameworkRef`, `decision`, `supportingFactsRef`, `reportedAt`

**ContainmentAction**  
`containmentActionId`, `incidentRef`, `actionType`, `initiatedBy`, `initiatedAt`, `resultState`

**PostIncidentReview**  
`reviewId`, `incidentRef`, `rootCauseRef`, `capaRefs`, `lessonsLearnedRef`, `ownerRef`

**TrainingDrillRecord**  
`trainingDrillRecordId`, `scenarioRef`, `audienceRef`, `runAt`, `findingsRef`, `followUpRefs`

Use this incident algorithm:

1. detect from telemetry, operator report, or near miss
2. classify and triage severity
3. preserve evidence and timeline
4. execute containment playbook
5. assess reportability
6. submit reportable incidents through the appropriate route
7. perform post-incident review
8. generate CAPA actions and training updates
9. write all outcomes back into the assurance ledger

Treat near miss as a first-class object. The cultural guidance is very clear that operators need to feel able to surface near misses and unacceptable behaviour early rather than wait for a major breach. ([NHS England Digital][8])

### Frontend work

Build an Incident Desk with:

- incident queue
- near-miss intake
- severity board
- containment timeline
- reportability checklist
- DSPT and reporting handoff status
- post-incident review panel
- runbook and exercise links

The UX should feel fast, serious, and calm under pressure.

All PHI-bearing operational transitions across `/ops/*`, Audit Explorer, Support Desk, Assurance Center, Records Governance, Incident Desk, and tenant-governance views must emit canonical UI observability:

- one `UIEventEnvelope`
- one `UITransitionSettlementRecord` whenever local acknowledgement can diverge from authoritative settlement or recovery posture
- one `UITelemetryDisclosureFence` proving that route params, investigation keys, incident summaries, patient identifiers, and artifact fragments were redacted to the permitted disclosure class

Analytics, replay, and automation may observe trust, publication, settlement, and recovery posture, but they may not leak protected data into traces, selectors, or event payloads.

### Tests that must pass before moving on

- incident-timeline integrity tests
- evidence-preservation tests
- reportability-decision tests
- near-miss workflow tests
- CAPA generation tests
- incident-to-assurance-pack propagation tests
- operator drill and tabletop exercise tests

### Exit state

Vecells can now detect, investigate, report, and learn from incidents within a controlled operational system.

---

## 9H. Tenant governance, config immutability, and dependency hygiene

This sub-phase makes the platform governable across multiple tenants and over time.

This matters more now than earlier in the programme. DTAC has just been refreshed, DCB clinical-safety standards are under review, and the legacy `developer.nhs.uk` and FHIR servers have now been decommissioned. So the product needs configuration and dependency governance that assumes standards, documentation locations, and integration envelopes will continue to move. ([NHS Transformation Directorate][6])

This section is an implementation of the canonical configuration compilation and promotion algorithm in `phase-0-the-foundation-protocol.md`. If any tenant-local promotion shortcut conflicts with that section, the canonical Phase 0 section wins.

### Backend work

Create these objects:

**TenantBaselineProfile**  
`tenantBaselineProfileId`, `tenantId`, `enabledCapabilities`, `policyPackRefs`, `integrationRefs`, `standardsVersionRefs`, `approvalState`

**ConfigVersion**  
`configVersionId`, `scope`, `hash`, `parentVersionRef`, `changedBy`, `changedAt`, `changeType`, `attestationRef`

**PolicyPackVersion**  
`policyPackVersionId`, `packType`, `effectiveFrom`, `effectiveTo`, `changeSummaryRef`, `compatibilityRefs`

**DependencyRegistryEntry**  
`dependencyRegistryEntryId`, `dependencyCode`, `sourceAuthority`, `currentVersion`, `supportState`, `legacyRiskState`, `replacementPathRef`

Reuse the canonical `LegacyReferenceFinding` from `platform-admin-and-config-blueprint.md`. Assurance and standards workflows may project or filter those findings differently, but they must not redefine a second legacy-finding schema with incompatible identifiers, severity classes, or affected-scope references.
Reuse the canonical `StandardsDependencyWatchlist`, `DependencyLifecycleRecord`, `PolicyCompatibilityAlert`, and `StandardsExceptionRecord` from `platform-admin-and-config-blueprint.md`. Assurance may attest, export, or alert over those contracts, but it must not fork a second standards-drift tracker with different candidate binding, blast-radius fields, exception semantics, or enforcement classes.

**StandardsChangeNotice**  
`noticeId`, `frameworkCode`, `currentVersionRef`, `newVersionRef`, `impactAssessmentRef`, `ownerRef`

Reuse the canonical `CompiledPolicyBundle` from Phase 0. Phase 9 may validate, hash, attest, and publish against that bundle, but it must not fork a second policy-bundle contract with the same name.

Use this algorithm:

1. compile routing rules, SLA or ETA policy, identity and grant policy, duplicate policy, provider overrides, waitlist and booking policy, hub coordination policy, callback and messaging policy, pharmacy rule packs, communications policy, access policy, visibility policy, provider capability matrices, and tenant overrides into one `CompiledPolicyBundle`
2. mint one immutable config-compilation package over that candidate, consisting of the current `ConfigCompilationRecord`, `ConfigSimulationEnvelope`, current `StandardsDependencyWatchlist`, impact digests, exact `compilationTupleHash`, and exact `standardsWatchlistHash`; later review, approval, and promotion evidence may not reassemble that package from draft state
3. reject any bundle that permits PHI exposure through a public or superseded grant
4. reject any bundle that permits automatic patient binding below the required assurance level
5. reject any bundle that permits automatic duplicate merge or same-request attach without the canonical replay and duplicate controls: deterministic replay proof for merges, or `same_episode_confirmed` plus the stricter `same_request_attach` thresholds for attaches
6. reject any bundle that permits closure with any active lease, pending preemption, or unresolved reconciliation
7. reject any bundle that permits exclusive slot language without a real `CapacityReservation.state = held`
8. reject any bundle that permits pharmacy auto-close from weakly correlated evidence
9. reject any bundle that permits callback, message, hub, booking, pharmacy, support-capture, async-enrichment, or override paths to bypass canonical `EvidenceAssimilationCoordinator`, `MaterialDeltaAssessment`, or the universal re-safety rule
10. reject any bundle that permits a projection, section, preview snippet, communication digest, or artifact mode to include fields outside the audience-tier visibility policy or its bound `MinimumNecessaryContract`
11. reject any bundle or release pair that permits pharmacy dispatch from stale provider choice, expired consent scope, or mismatched dispatch correlation
12. reject any bundle or release pair that permits assistive suggestions or final human artifact writes after session invalidation, review-version drift, or policy-bundle change
13. after compile success, version every tenant config and policy pack, diff tenant baselines continuously, mint one current `StandardsDependencyWatchlist` for the exact `candidateBundleHash`, carry owner, replacement path, remediation deadline, route-family blast radius, tenant scopes, live channels, and affected simulations through every blocking or advisory finding, and map standards changes to required evidence updates
14. allow promotion only after compile success, reference-case simulation, immutable audit of the approved bundle hash, exact `compilationTupleHash`, exact `standardsWatchlistHash`, and evidence that the approved release candidate froze the same `ConfigCompilationRecord`, `ConfigSimulationEnvelope`, `StandardsDependencyWatchlist`, compatible bundle hashes, surface schemas, projection backfill plans, the migration execution tuple that will govern live schema change, and the watch-tuple or observation-policy template that will govern live wave proof together

This is also where you formally purge stale references to retired NHS endpoints and archived documentation.

### Frontend work

Build a Tenant Governance surface with:

- tenant baseline matrix
- config diff viewer
- policy-pack history
- candidate-bound standards and dependency watchlist
- promotion approval and release-watch status

Extend this surface using `platform-admin-and-config-blueprint.md` so routing rules, SLA or ETA settings, waitlist policies, callback policies, pharmacy policy overrides, communications governance, and access-role administration are managed as versioned and auditable configuration domains.

This page should make it impossible to pretend the platform is identical everywhere when it is not.

### Tests that must pass before moving on

- config-immutability tests
- tenant-drift detection tests
- policy-pack compatibility tests
- granular visibility-contract compile tests covering sections, previews, and artifact modes
- migration-execution-binding and migration-observation evidence tests
- stale-pharmacy-dispatch rejection tests in reference-case simulation
- stale-assistive-session invalidation tests in reference-case simulation
- legacy-reference scanner tests
- standards-change impact workflow tests
- standards-watchlist hash parity tests
- standards-exception expiry reopen tests
- approval-gate bypass prevention tests

### Exit state

The platform can now evolve safely across tenants, suppliers, and changing NHS control frameworks.

---

## 9I. Full-program exercises, BAU transfer, and formal exit gate

This final sub-phase turns the whole programme into a stable service.

By this point, the product has intake, identity, telephony, clinical workflow, local booking, network coordination, pharmacy loop, NHS App channel, and assistive features. Phase 9 now has to prove those parts can be operated together, evidenced together, restored together, and governed together. That is exactly what the architecture’s analytics-and-assurance layer was reserving from the beginning.

The final exit gate requires one last correction:

1. programme summaries, canonical phase contracts, runtime verification tuples, governance proof, ops proof, and BAU sign-off still do not resolve through one machine-readable conformance artifact, which leaves room for delivery planning to describe a simpler system than the one the runtime and operators actually depend on

### Backend work

Run a final integrated programme of exercises:

1. full load and soak across patient and staff flows
2. projection rebuild from raw event history
3. backup restore into clean environment
4. failover rehearsal
5. security incident rehearsal
6. reportable-incident drill
7. monthly assurance-pack generation
8. retention and deletion dry run
9. tenant baseline diff and approval audit
10. full end-to-end regression across all phase-delivered journeys
11. continuity-evidence convergence across operations, governance, assurance-pack, and release-watch consumers

Create these objects:

**BAUReadinessPack**  
`bauReadinessPackId`, `tenantScope`, `sloRefs`, `runbookRefs`, `exerciseRefs`, `openRiskRefs`, `continuityEvidenceRefs[]`, `crossPhaseConformanceScorecardRef`, `requiredPhaseConformanceRowRefs[]`, `continuityEvidenceReviewState`, `signoffState`

**OnCallMatrix**  
`onCallMatrixId`, `serviceScope`, `rotaRefs`, `escalationPaths`, `contactValidationState`

**RunbookBundle**  
`runbookBundleId`, `scope`, `versionRef`, `dependencyRefs`, `lastRehearsedAt`

**PhaseConformanceRow**
`phaseConformanceRowId`, `phaseCode`, `summarySourceRefs[]`, `canonicalBlueprintRefs[]`, `requiredControlStatusSnapshotRefs[]`, `requiredAssuranceSliceTrustRefs[]`, `requiredExperienceContinuityEvidenceRefs[]`, `requiredOpsContinuityEvidenceSliceRefs[]`, `requiredGovernanceContinuityEvidenceBundleRefs[]`, `requiredRuntimePublicationBundleRefs[]`, `requiredVerificationScenarioRefs[]`, `requiredReleaseRecoveryDispositionRefs[]`, `requiredEndStateProofRefs[]`, `summaryAlignmentState = exact | stale | blocked`, `contractAdoptionState = exact | partial | blocked`, `verificationCoverageState = exact | stale | blocked`, `operationalProofState = exact | stale | blocked`, `endStateProofState = exact | stale | blocked`, `rowState = exact | stale | blocked`, `rowHash`, `generatedAt`

`PhaseConformanceRow` is the machine-auditable join for one delivery phase or cross-phase control family. A row is incomplete unless the planning summary, canonical blueprints, current control status, continuity evidence, operations proof, governance proof, runtime publication tuple, verification tuple, recovery posture, and final Phase 9 proof all point at the same architectural claim.

**CrossPhaseConformanceScorecard**
`crossPhaseConformanceScorecardId`, `releaseRef`, `tenantScope`, `summarySourceRefs[]`, `phaseConformanceRowRefs[]`, `requiredVerificationScenarioRefs[]`, `requiredRuntimePublicationBundleRefs[]`, `requiredControlStatusSnapshotRefs[]`, `requiredAssuranceSliceTrustRefs[]`, `requiredExperienceContinuityEvidenceRefs[]`, `requiredOpsContinuityEvidenceSliceRefs[]`, `requiredGovernanceContinuityEvidenceBundleRefs[]`, `requiredReleaseRecoveryDispositionRefs[]`, `requiredEndStateProofRefs[]`, `summaryAlignmentState = exact | stale | blocked`, `contractAdoptionState = exact | partial | blocked`, `verificationCoverageState = exact | stale | blocked`, `operationalProofState = exact | stale | blocked`, `endStateProofState = exact | stale | blocked`, `scorecardState = exact | stale | blocked`, `scorecardHash`, `generatedAt`

`CrossPhaseConformanceScorecard` is the final programme-truth artifact. Phase summaries, runtime verification, governance review, ops diagnosis, and BAU sign-off may not each declare completion independently once this scorecard exists.

**ReleaseToBAURecord**  
`releaseToBAURecordId`, `effectiveDate`, `supportModelRef`, `acceptanceRefs`, `crossPhaseConformanceScorecardRef`, `scorecardHash`, `rollbackPlanRef`

Use this conformance algorithm:

1. mint or refresh `PhaseConformanceRow` for each phase and each cross-phase control family that the release, pack, or BAU sign-off claims is complete
2. bind each row to the exact `phase-cards.md` or `blueprint-init.md` summary sources, the canonical blueprint refs, the in-scope `ControlStatusSnapshot` rows, required `AssuranceSliceTrustRecord` rows, required `ExperienceContinuityControlEvidence` rows, any `OpsContinuityEvidenceSlice` rows, any `GovernanceContinuityEvidenceBundle` rows, the exact `RuntimePublicationBundle`, the pinned `VerificationScenario`, the declared `ReleaseRecoveryDisposition` set, and the final operational proof refs used for sign-off
3. mark `summaryAlignmentState = blocked` whenever a phase card or bootstrap summary omits, flattens, or contradicts a contract that the runtime tuple, governance proof, operations proof, or end-state criteria require
4. mark `verificationCoverageState = blocked` whenever an affected phase or control family lacks a pinned `VerificationScenario`, runtime-publication tuple, continuity-evidence contract, or recovery-proof reference
5. mark `operationalProofState = blocked` whenever required `ControlStatusSnapshot`, `AssuranceSliceTrustRecord`, `OpsContinuityEvidenceSlice`, or `GovernanceContinuityEvidenceBundle` rows are stale, missing, or no longer exact for the claimed phase outcome
6. compute `scorecardState = exact` only when every required row is `rowState = exact` and the scorecard hash still matches the current planning summary, verification tuple, runtime publication tuple, continuity-proof set, and final end-state proof set
7. block `BAUReadinessPack.signoffState = signed_off` and `ReleaseToBAURecord` creation while the scorecard is `stale | blocked`; narrative confidence, spreadsheet status, or local dashboard green is not a substitute

### Frontend work

Before final sign-off, the operations surfaces should feel finished:

- overview that works for service owners
- audit and break-glass views that work for governance
- incident desk that works for support and security
- resilience board that works for engineering and operations
- assurance center that works for safety and compliance
- tenant governance views that work for platform leadership
- one conformance scorecard view that shows phase rows, cross-phase control families, runtime tuple coverage, governance proof, ops proof, and BAU sign-off blockers on the same screen

This phase should not ship with temporary admin screens. It is the final product layer that makes the rest survivable.

### Tests that must all pass before the blueprint is considered complete

- no Sev-1 or Sev-2 defects in operations, audit, restore, or incident paths
- full projection rebuild from raw events is proven
- immutable audit integrity is proven
- break-glass review workflow is proven
- monthly assurance-pack generation is proven
- continuity-evidence convergence across ops, governance, pack generation, and release watch is proven
- cross-phase conformance scorecard alignment is proven across `phase-cards.md`, `blueprint-init.md`, canonical blueprints, runtime publication, verification tuples, governance proof, ops proof, and BAU sign-off
- retention and deletion workflow is proven
- full restore and failover exercises are proven
- incident and near-miss workflows are proven
- config drift and legacy dependency scanning are proven
- full end-to-end regression across all patient and staff journeys is green
- route-contract publication and `ReleaseRecoveryDisposition` behavior is proven for `/ops/*`, audit, assurance-center, incident, records-governance, and tenant-governance surfaces
- canonical action-settlement behavior is proven for interventions, replay exit, recovery actions, and assurance-pack attestation or export flows
- `ArtifactPresentationContract` and `OutboundNavigationGrant` behavior is proven for investigation bundles, pack export, deletion certificates, archive manifests, and audit evidence handoff
- `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` emission and redaction are proven for critical operator journeys
- BAU runbooks, owners, and on-call paths are signed off
- `CrossPhaseConformanceScorecard.scorecardState = exact` is proven before final sign-off

### Exit state

The platform is no longer just feature-rich. It is operationally defensible, and its planning layer, runtime layer, governance layer, operations layer, and BAU sign-off all point at the same machine-auditable conformance proof.

---

## Recommended rollout slices inside Phase 9

Ship this phase in five slices:

**Slice 9.1**  
Assurance ledger, control mapping, and read-only operations overview.

**Slice 9.2**  
Audit explorer, break-glass review, and live queue and breach-risk views.

**Slice 9.3**  
Assurance pack generation, records lifecycle controls, and tenant config governance.

**Slice 9.4**  
Restore orchestration, resilience board, chaos programme, and incident desk.

**Slice 9.5**  
Full BAU transfer, recurring exercise schedule, automated monthly packs, and final sign-off.

## System after Phase 9

After this phase, Vecells becomes the full core product the architecture was aiming at from the start: a Vecells-first, FHIR-integrated, event-driven primary-care access and operations layer with one shared event spine, one shared audit spine, one governed clinical-representation layer, one live operations surface, one evidence-producing assurance layer, policy-driven retention, proven restore and incident handling, and standards-aware governance wrapped around every major workflow. The patient and staff capabilities from Phases 1 to 8 still matter, but Phase 9 is what makes them sustainable in real NHS deployment conditions. ([NHS England Digital][1])

[1]: https://digital.nhs.uk/services/data-security-and-protection-toolkit "Data Security and Protection Toolkit - NHS England Digital"
[2]: https://digital.nhs.uk/developer/decommissioning-developer.nhs.uk-and-fhir-servers "Decommissioning developer.nhs.uk and FHIR servers - NHS England Digital"
[3]: https://digital.nhs.uk/services/data-access-request-service-dars/process/data-access-request-service-dars-pre-application-checklist "Data Access Request Service (DARS): pre-application checklist - NHS England Digital"
[4]: https://digital.nhs.uk/cyber-and-data-security/guidance-and-assurance/2024-25-caf-aligned-dspt-guidance/objective-d/principle-d1-response-and-recovery-planning "Principle: D1 Response and recovery planning - NHS England Digital"
[5]: https://transform.england.nhs.uk/information-governance/guidance/records-management-code/ "Records Management Code of Practice - NHS Transformation Directorate"
[6]: https://transform.england.nhs.uk/innovation-lab/ "Innovation Service - NHS Transformation Directorate"
[7]: https://digital.nhs.uk/cyber-and-data-security/guidance-and-assurance/2024-25-caf-aligned-dspt-guidance/objective-b/principle-b3-data-security "Principle: B3 Data security - NHS England Digital"
[8]: https://digital.nhs.uk/cyber-and-data-security/guidance-and-assurance/caf-aligned-dspt-guidance/objective-b/principle-b6-staff-awareness-and-training "Principle: B6 Staff awareness and training - NHS England Digital"
