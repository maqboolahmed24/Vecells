# Platform admin and config blueprint

## Purpose

Define a complete, versioned, and auditable platform administration surface for configuration, communications governance, and access administration.

This document is the admin surface for the canonical configuration, visibility, grant, duplicate, reservation, safety, and promotion rules defined in `phase-0-the-foundation-protocol.md`. Admin tooling may configure those rules, but it may not bypass the compiled-bundle gate or create local exceptions outside the canonical model.

The end-to-end shell, route, and screen architecture for these surfaces is defined in `governance-admin-console-frontend-blueprint.md`. This file remains the domain and control-plane contract that shell must honor.

## Governance shell linkage

The Governance and Admin Shell should own these route families:

- `/ops/governance/*`
- `/ops/access/*`
- `/ops/config/*`
- `/ops/comms/*`
- `/ops/release/*`

Deep links into `/ops/audit`, `/ops/assurance`, `/ops/incidents`, and `/ops/resilience` may open evidence drawers or side stages, but they should not sever the active `ChangeEnvelope`, approval review, or tenant continuity context when the user is still working the same governance object.

## Config center contract

`/ops/config` should be expanded into subviews for:

- routing rules
- tenant configuration matrix
- inheritance and override trace
- SLA and ETA policy
- opening hours and service windows
- provider and directory overrides
- waitlist policies
- callback policies
- pharmacy policy overrides
- feature-flag policy
- bundle comparison by tenant and environment
- simulation and compile readiness
- promotion history
- config diff and approvals

High-priority config-center defects in this surface:

1. subviews are listed, but not yet bound to one scoped workspace context carrying tenant, environment, draft, and governing change identity
2. inheritance and override trace are named, but not yet backed by a deterministic effective-value and precedence contract
3. simulation and compile readiness are described as tabs, but not yet tied to one exact candidate hash, scenario set, and compatibility proof
4. config editing does not yet materialize blast radius, so tenant, route, and patient-facing impact can be understated at review time
5. live-baseline drift, conflicting edits, and approval invalidation are not yet modeled as fences that freeze compile or promotion safely

Add the supporting config-center contracts:

**ConfigWorkspaceContext**
`workspaceContextId`, `changeEnvelopeRef`, `baselineSnapshotRef`, `baselineTupleHash`, `governanceScopeTokenRef`, `staffIdentityContextRef`, `actingContextRef`, `actingScopeTupleRef`, `scopeMode = tenant | org_group | network | platform`, `tenantRefs[]`, `affectedTenantCount`, `affectedOrganisationCount`, `environmentRef`, `liveBundleRef`, `draftBundleRef`, `scheduledBundleRef`, `governanceReviewContextRef`, `currentCompilationRecordRef`, `currentSimulationEnvelopeRef`, `currentGovernanceReviewPackageRef`, `activeDriftFenceRef`, `requiredCompiledPolicyDomains[]`, `currentCompilationTupleHash`, `scopeTupleHash`, `audienceTier`, `workspaceState = drafting | compile_pending | review_ready | approval_invalidated | promotion_ready | frozen`, `openedAt`

`ConfigWorkspaceContext` is the root context for `/ops/config`. Every subview in the session must resolve through the same workspace context so rule editing, comparison, simulation, and approval review cannot silently jump across tenant or environment scope.
The workspace must carry the same explicit blast radius that the current `GovernanceScopeToken` and `ActingScopeTuple` authorize; `multi_tenant` or `platform` review may not hide behind route labels or tenant lists without `affectedTenantCount`, `affectedOrganisationCount`, and the governing `scopeTupleHash`.
The workspace must also stay bound to one current governance scope and one current `ActingScopeTuple`; organisation switching, purpose-of-use drift, elevation expiry, or blast-radius widening must supersede that tuple and force revalidation before compile, approval, or promotion can continue.
Draft save may change only `draftBundleRef` and supporting resolution inputs. Any effective-config change must supersede `baselineTupleHash`, `currentCompilationRecordRef`, `currentSimulationEnvelopeRef`, `currentGovernanceReviewPackageRef`, and `currentCompilationTupleHash` together, pushing `workspaceState` back to `compile_pending` until a fresh compiled package is generated.

**EffectiveConfigResolution**
`resolutionId`, `policyDomain`, `scopeRef`, `effectiveValueRef`, `precedenceChainRefs[]`, `inheritedFromRef`, `overriddenByRef`, `hiddenAncestorRefs[]`, `resolutionVersion`

`EffectiveConfigResolution` is the only authority for inheritance and override trace. The UI must show not only the current effective value, but also why competing ancestors, tenant overrides, or environment-specific rules lost precedence.

**ConfigCompilationRecord**
`configCompilationRecordId`, `workspaceContextRef`, `changeEnvelopeRef`, `baselineSnapshotRef`, `baselineTupleHash`, `candidateBundleHash`, `candidateConfigVersionSet`, `requiredCompiledPolicyDomains[]`, `compiledPolicyBundleRef`, `compiledDomainPackHashes`, `referenceScenarioSetRef`, `surfaceSchemaSetRef`, `blastRadiusDigestRef`, `continuityControlImpactDigestRef`, `visibilityCoverageImpactDigestRef`, `boundedContextImpactDigestRef`, `policyCompatibilityAlertRefs[]`, `standardsDependencyWatchlistRef`, `standardsWatchlistHash`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `configDriftFenceRef`, `simulationEnvelopeRef`, `compileState = ready | blocked | superseded`, `releaseFreezeReadinessState = ready | blocked | invalidated`, `compilationTupleHash`, `compiledAt`

`ConfigCompilationRecord` is the only authority for turning one workspace draft into one `CompiledPolicyBundle`. It must be minted from one immutable baseline snapshot, one exact `baselineTupleHash`, one exact config-version set, one required policy-domain set, one reference-scenario set, one surface-schema set, and one current drift fence; downstream review may not reassemble that package from tabs or local cache.
It must also materialize one exact `ReleaseContractVerificationMatrix` for the same candidate so route contracts, frontend manifests, projection queries, mutation commands, client-cache policy, settlement schemas, transition envelopes, recovery dispositions, and continuity evidence contracts do not drift into later gates as sidecar proof.
If any effective value, required compiled domain, compatibility alert, standards watchlist finding, baseline input, scenario set, or schema set changes, the prior record is superseded and a new `ConfigCompilationRecord` must be generated. Release approval may not freeze or promote a bundle hash that is no longer the output of the current compilation record.

**ConfigSimulationEnvelope**
`simulationEnvelopeId`, `workspaceContextRef`, `configCompilationRecordRef`, `baselineTupleHash`, `compiledPolicyBundleRef`, `candidateBundleHash`, `referenceScenarioSetRef`, `surfaceSchemaSetRef`, `compatibilityEvidenceRefs[]`, `continuityEvidenceRefs[]`, `assuranceEvidenceGraphSnapshotRef`, `assuranceGraphCompletenessVerdictRef`, `graphHash`, `blastRadiusDigestRef`, `continuityControlImpactDigestRef`, `visibilityCoverageImpactDigestRef`, `boundedContextImpactDigestRef`, `policyCompatibilityAlertRefs[]`, `standardsDependencyWatchlistRef`, `standardsWatchlistHash`, `releaseContractVerificationMatrixRef`, `releaseContractMatrixHash`, `configDriftFenceRef`, `governanceReviewPackageRef`, `reviewPackageHash`, `continuityValidationState`, `compileReadinessState = ready | blocked | invalidated | superseded`, `releaseFreezeReadinessState = ready | blocked | invalidated`, `blockingReasonCodes[]`, `compilationTupleHash`, `generatedAt`

`ConfigSimulationEnvelope` binds simulation and compile readiness to one exact compiled candidate, not to editable draft state. Reference-case outcomes, schema and route-publication compatibility, continuity proofs, visibility coverage, compatibility alerts, and compile blockers must all point to the same `ConfigCompilationRecord`, `baselineTupleHash`, `CompiledPolicyBundle`, and `compilationTupleHash` the operator is preparing to approve.
It must also stay bound to one exact `ReleaseContractVerificationMatrix` and `releaseContractMatrixHash`; simulation may not prove route, frontend, settlement, recovery, or continuity compatibility against a different generated tuple than the one later used by release verification and runtime publication.
Once review is open, the envelope must also remain bound to one exact `GovernanceReviewPackage`, `reviewPackageHash`, `StandardsDependencyWatchlist`, and `standardsWatchlistHash`; diff, impact, continuity evidence, communications simulation, standards blockers, and approval may not read a fresher or sibling simulation result while the operator is still looking at the current package.
When affected continuity or assurance controls are in scope, the envelope must also point to one current `AssuranceEvidenceGraphSnapshot`, one current `AssuranceGraphCompletenessVerdict`, and the exact `graphHash` that made those proofs admissible. Loose evidence refs are not enough for promotion.
Re-running simulation because of draft edits, scenario changes, schema changes, or drift-fence movement must mint a new envelope and supersede the old one. Review, approval, and promotion may not continue against an invalidated or superseded envelope merely because the human-readable diff still looks unchanged, and they may not keep the old `reviewPackageHash` after that supersession.

**ConfigBlastRadiusDigest**
`blastRadiusDigestId`, `workspaceContextRef`, `affectedTenantCount`, `affectedOrganisationCount`, `affectedRouteFamilies[]`, `affectedSurfaceClasses[]`, `patientFacingPromiseRefs[]`, `riskBand`, `lastComputedAt`

`ConfigBlastRadiusDigest` materializes what the change can touch. Routing, SLA, callback, booking, pharmacy, or communication edits may not be reviewed as local tweaks when they alter patient promises, support flows, or cross-tenant behavior.

**ContinuityControlImpactDigest**
`continuityControlImpactDigestId`, `workspaceContextRef`, `governanceReviewPackageRef`, `reviewPackageHash`, `affectedContinuityControlCodes[]`, `affectedRouteFamilies[]`, `requiredEvidenceRefs[]`, `requiredAssuranceSliceTrustRefs[]`, `requiredAssuranceEvidenceGraphSnapshotRef`, `requiredAssuranceGraphCompletenessVerdictRef`, `requiredGraphHash`, `validationState = complete | stale | missing | blocked`, `lastComputedAt`

`ContinuityControlImpactDigest` materializes whether a draft touches patient-home actionability, record-follow-up recovery, more-info reply posture, conversation settlement posture, support replay restore, intake resume, booking manage posture, hub booking-manage posture, assistive-session continuity, workspace task completion, or pharmacy-console settlement. When those controls are in scope, the UI must show the exact `ExperienceContinuityControlEvidence` and trust posture required to promote safely; “no visible diff” is not enough.
That digest must also stay attached to the same `GovernanceReviewPackage` as diff, simulation, continuity evidence, and approval so continuity-sensitive blast radius cannot be reviewed against a different package epoch than the visible change.

**VisibilityCoverageImpactDigest**
`visibilityCoverageImpactDigestId`, `workspaceContextRef`, `affectedAudienceTiers[]`, `affectedAudienceSurfaces[]`, `affectedPurposeOfUseRefs[]`, `affectedProjectionFamilies[]`, `affectedRouteFamilies[]`, `affectedMinimumNecessaryContracts[]`, `affectedSectionContracts[]`, `affectedPreviewContracts[]`, `affectedArtifactContracts[]`, `missingCoverageRefs[]`, `missingMaterializationRefs[]`, `summaryWideningRefs[]`, `sectionWideningRefs[]`, `previewWideningRefs[]`, `artifactModeWideningRefs[]`, `mutationWideningRefs[]`, `redactionDeltaRefs[]`, `breakGlassDeltaRefs[]`, `validationState = complete | stale | missing | blocked`, `generatedAt`

`VisibilityCoverageImpactDigest` materializes whether a draft changes the audience matrix itself. Reviewers must see which tiers, surfaces, summaries, sections, previews, timelines, receipts, artifacts, mutations, redaction packs, and break-glass rows widen, narrow, or go missing before compile or promotion.

**BoundedContextImpactDigest**
`boundedContextImpactDigestId`, `workspaceContextRef`, `affectedOwningContextRefs[]`, `affectedContributorContextRefs[]`, `affectedBoundaryContractRefs[]`, `affectedGatewaySurfaceRefs[]`, `affectedRouteFamilies[]`, `newCrossContextWriteRefs[]`, `forbiddenDirectWriteRefs[]`, `sharedKernelDeltaRefs[]`, `packageBoundaryDriftRefs[]`, `validationState = complete | stale | missing | blocked`, `generatedAt`

`BoundedContextImpactDigest` materializes whether a draft widens, narrows, or bypasses bounded-context ownership. Reviewers must see which contexts own the affected routes and aggregates, which contexts only contribute via declared boundaries, and whether any package, gateway, or route starts writing across a seam that should remain event-only, projection-only, or governance-gated.

**ConfigDriftFence**
`driftFenceId`, `workspaceContextRef`, `baselineSnapshotRef`, `baselineTupleHash`, `baselineBundleHash`, `baselineConfigVersionSet`, `configCompilationRecordRef`, `simulationEnvelopeRef`, `governanceReviewContextRef`, `approvalEvidenceBundleRef`, `concurrentChangeRefs[]`, `approvalInvalidationState = current | invalidated | regeneration_required`, `approvalInvalidationReasonCodes[]`, `lastVerifiedBaselineTupleHash`, `lastVerifiedCompilationTupleHash`, `lastVerifiedApprovalTupleHash`, `lastVerifiedReviewPackageHash`, `lastVerifiedStandardsWatchlistHash`, `freezeState = clear | review_required | compile_blocked | approval_blocked | promotion_blocked`, `recoveryActionRef`, `lastVerifiedAt`

`ConfigDriftFence` blocks false confidence under concurrency. If the live baseline changes, `baselineTupleHash` changes, a sibling draft lands, the simulation envelope or review context is regenerated, the approval bundle expires, the immutable review package is regenerated, the candidate-bound standards watchlist is regenerated, or the referenced compilation tuple, approval tuple, `reviewPackageHash`, or `standardsWatchlistHash` no longer matches, compile, approval, and promotion actions must freeze until the workspace is revalidated.
Local admin affordances may not bypass this fence. A compile success from an older tuple is evidence only for that superseded tuple and must not be reused as if it still proved the current draft.

Add the authoritative mutation contracts used across config, access, communications, and release surfaces:

**AdminActionRecord**
`adminActionRecordId`, `routeFamily`, `workspaceContextRef`, `governanceScopeTokenRef`, `actingScopeTupleRef`, `scopeTupleHash`, `governingObjectRef`, `actionType`, `driftFenceRef`, `releaseApprovalFreezeRef`, `assuranceSliceTrustRefs[]`, `idempotencyKey`, `actorRef`, `createdAt`, `settledAt`

**AdminActionSettlement**
`adminActionSettlementId`, `adminActionRecordRef`, `result = draft_saved | compile_started | compile_blocked | approval_invalidated | promoted_pending_wave | wave_action_pending | stale_recoverable | denied_scope | failed`, `recoveryActionRef`, `recordedAt`

Rules:

- every consequential admin mutation must traverse `ScopedMutationGate`, write one `AdminActionRecord`, and settle through one `AdminActionSettlement`
- stale workspace state, drift-fence conflict, frozen release tuple, or degraded required assurance slices must resolve to `compile_blocked | approval_invalidated | stale_recoverable` instead of partial commit
- compile, approve, promote, export, rollback, and kill-switch posture must follow `AdminActionSettlement`, not optimistic UI state or transport acknowledgement alone
- only the current `ConfigCompilationRecord` may supply the `CompiledPolicyBundle` used by review, approval, or release freeze; tabs, previews, and local draft state may not mint their own implied candidate
- `ConfigSimulationEnvelope` may be generated only from the current `ConfigCompilationRecord`, and `GovernanceReviewContext`, `ApprovalEvidenceBundle`, `ReleaseApprovalFreeze`, and `PromotionIntentEnvelope` must all resolve the same `baselineTupleHash` and `compilationTupleHash`
- `ConfigSimulationEnvelope`, `CommunicationsSimulationEnvelope`, `TemplatePolicyImpactDigest`, `ContinuityControlImpactDigest`, `GovernanceReviewContext`, `ApprovalEvidenceBundle`, and `ReleaseApprovalFreeze` must also resolve the same current `GovernanceReviewPackage` and `reviewPackageHash`; review, impact, simulation, continuity evidence, and approval may not read adjacent package members from different freshness epochs
- `ConfigCompilationRecord`, `ConfigSimulationEnvelope`, `GovernanceReviewContext`, `ApprovalEvidenceBundle`, and `ReleaseApprovalFreeze` must also resolve the same current `StandardsDependencyWatchlist` and `watchlistHash`; standards blockers may not be advisory in one lane and blocking in another
- `ConfigCompilationRecord`, `ConfigSimulationEnvelope`, `VerificationScenario`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, and `ReleaseApprovalFreeze` must also resolve the same current `ReleaseContractVerificationMatrix` and `releaseContractMatrixHash`; cross-layer contract proof may not be regenerated independently in compile, verification, publication, or watch lanes
- `ConfigWorkspaceContext`, `GovernanceReviewContext`, `ApprovalEvidenceBundle`, `AdminActionRecord`, and `PromotionIntentEnvelope` must also resolve the same current `GovernanceScopeToken`, `ActingScopeTuple`, and `scopeTupleHash`
- `ChangeBaselineSnapshot`, `ChangeEnvelope`, `GovernanceReviewContext`, `ApprovalEvidenceBundle`, `ReleaseApprovalFreeze`, and `PromotionIntentEnvelope` must all resolve the same immutable `baselineTupleHash`; any drift between reviewed baseline and promoted tuple is a hard freeze
- `ApprovalEvidenceBundle`, `GovernanceReviewContext`, `ReleaseApprovalFreeze`, and `PromotionIntentEnvelope` must all resolve the same `approvalTupleHash`; approval may not attach to one package while promotion advances another
- when affected continuity controls are in scope, `ConfigSimulationEnvelope`, `ContinuityControlImpactDigest`, `GovernanceReviewContext`, and `ApprovalEvidenceBundle` must also resolve the same current `AssuranceEvidenceGraphSnapshot`, `AssuranceGraphCompletenessVerdict`, and `graphHash`
- bounded-context ownership, gateway seams, and cross-context write posture must be proven by `BoundedContextImpactDigest`; route or package naming alone is not compile evidence
- if any in-scope `PolicyCompatibilityAlert.compatibilityClass = compile_blocking | promotion_blocking`, or `ConfigDriftFence.approvalInvalidationState != current`, the workspace must remain frozen until regeneration produces a new exact package

## Config compilation pipeline

Use one deterministic config pipeline:

1. `ConfigWorkspaceContext` collects raw draft edits and `EffectiveConfigResolution`, but it does not imply approval or promotion readiness.
2. the system materializes one immutable `ConfigCompilationRecord` over the current baseline snapshot, `baselineTupleHash`, candidate config-version set, required compiled policy domains, scenario set, schema set, impact digests, one candidate-bound `StandardsDependencyWatchlist`, and one exact `ReleaseContractVerificationMatrix`
3. the system generates one `ConfigSimulationEnvelope` from that exact compilation record and records compile blockers, compatibility evidence, route-publication implications, continuity evidence, the current assurance-evidence graph and completeness verdict, visibility evidence, bounded-context evidence, standards-watchlist posture, the bound `ReleaseContractVerificationMatrix`, and release-freeze readiness for the same baseline tuple and compilation tuple
4. the system assembles one immutable `GovernanceReviewPackage` over the current baseline tuple, compilation record, simulation envelope, current standards watchlist, any in-scope communications simulation and template-impact digest, continuity impact digest, and continuity evidence, and only then may `GovernanceReviewContext` and `ApprovalEvidenceBundle` become writable or approvable
5. `ReleaseApprovalFreeze` and later `PromotionIntentEnvelope` may freeze only the current compiled bundle plus the same `baselineTupleHash`, `approvalTupleHash`, `compilationTupleHash`, `reviewPackageHash`, `standardsWatchlistHash`, and `releaseContractMatrixHash`; promotion is impossible once drift invalidates that package

## Communication governance contract

Suggested route family:

- `/ops/comms`

High-priority communications-governance defects in this surface:

1. template editing and approval are named, but not yet bound to one scoped workspace carrying the exact template set, tenant scope, and package-bound review context under review
2. suppression, quiet-hours, fallback, and channel-freeze posture can still be treated as secondary detail instead of first-class blast-radius and approval inputs
3. preview is described by channel and journey state, but not yet frozen to one candidate hash, runtime publication posture, and settlement lineage
4. communications drift can still invalidate a package after preview without a single freeze disposition in the same shell
5. export or handoff of communications evidence is not yet explicitly tied to the same review context and return-safe governance shell

Suggested objects:

- `MessageTemplateVersion`
- `TemplateSet`
- `ReusableCopyBlock`
- `ChannelPolicy`
- `QuietHoursPolicy`
- `FallbackRuleSet`
- `PreviewMatrix`
- `TemplateApprovalRecord`
- `CommunicationsGovernanceWorkspace`
- `TemplatePolicyImpactDigest`
- `CommunicationsSimulationEnvelope`
- `CommunicationsFreezeDisposition`

**CommunicationsGovernanceWorkspace**
`communicationsWorkspaceId`, `scopeTokenRef`, `changeEnvelopeRef`, `reviewContextRef`, `currentGovernanceReviewPackageRef`, `templateSetRef`, `channelPolicyRefs[]`, `quietHoursPolicyRef`, `fallbackRuleSetRef`, `liveChannelFreezeRefs[]`, `runtimePublicationRef`, `openedAt`

`CommunicationsGovernanceWorkspace` is the root context for `/ops/comms`. Template editing, preview, diff, approval, and promotion must all resolve through the same workspace so live, draft, and scheduled posture cannot drift between panes.
Once review is open, the workspace must also publish one current `GovernanceReviewPackage`; preview, impact, simulation, approval, and release-freeze posture may not each recompute against a fresher template set or publication epoch.

**TemplatePolicyImpactDigest**
`templatePolicyImpactDigestId`, `communicationsWorkspaceRef`, `governanceReviewPackageRef`, `reviewPackageHash`, `affectedTenantCount`, `affectedJourneyStateRefs[]`, `suppressionDeltaRefs[]`, `fallbackDeltaRefs[]`, `quietHoursDeltaRefs[]`, `continuityControlRefs[]`, `riskBand`, `generatedAt`

`TemplatePolicyImpactDigest` materializes the real blast radius of a communications change. Suppression or fallback changes may not remain buried in prose when they alter patient promises, channel behavior, or continuity-sensitive journeys.
It must stay bound to the same `GovernanceReviewPackage` as the visible diff, preview matrix, and approval posture so a reviewer is not reading blast radius from one template candidate while approving another.

**CommunicationsSimulationEnvelope**
`communicationsSimulationEnvelopeId`, `communicationsWorkspaceRef`, `governanceReviewPackageRef`, `candidateTemplateHash`, `previewMatrixRef`, `templatePolicyImpactDigestRef`, `runtimePublicationRef`, `compatibilityEvidenceRefs[]`, `channelFreezeRefs[]`, `reviewPackageHash`, `compileReadinessState`, `generatedAt`

`CommunicationsSimulationEnvelope` binds preview, compatibility, and publication posture to one exact candidate so reviewers know the message set they are approving is the same set that can be promoted.
It must also bind preview and publication posture to one exact `GovernanceReviewPackage`; communications preview may not be recomputed against fresher runtime publication, suppression, fallback, or quiet-hours truth while the current diff and approval package remain on screen.

**CommunicationsFreezeDisposition**
`communicationsFreezeDispositionId`, `communicationsWorkspaceRef`, `trigger = scope_drift | package_drift | channel_freeze | publication_drift | lease_expired`, `allowedActions`, `requiredRecoveryAction`, `setAt`, `clearedAt`

`CommunicationsFreezeDisposition` is the communications-specific freeze adapter used when template review must stay same-shell but become read-only or revalidation-first.

Core capabilities:

- browse templates and versions
- preview by channel and journey state
- approve and promote template changes
- inspect suppression and fallback rules
- track live template state by tenant
- keep communications diff, impact, simulation, and approval bound to the same `GovernanceReviewPackage`, `GovernanceReviewContext`, and `AdminActionSettlement`

## Access administration contract

Suggested route family:

- `/ops/access`

High-priority access-administration defects in this surface:

1. role and grant editing are present, but not yet bound to one workspace carrying the exact subject, effective-access preview, and package-bound review context under review
2. lockout, orphaned ownership, and visibility widening are still treated as secondary checks instead of first-class impact data
3. elevation, expiry, and recertification posture can drift between preview and approval without one freeze disposition or settlement owner in the same shell
4. reviewers can see role and membership data, but not yet one deterministic summary of what the subject can do now, what would change, and why that change is permitted
5. periodic access review and exceptional access are not yet explicitly chained through the same audit, approval, and mutation-settlement posture as other governance work

Suggested objects:

- `UserMembershipRecord`
- `RoleAssignmentRecord`
- `ActingContextApprovalRecord`
- `BreakGlassEligibilityRecord`
- `ScopedElevationRequest`
- `EffectiveAccessPreview`
- `AccessReviewDecision`
- `PermissionChangeAuditRecord`
- `AccessAdministrationWorkspace`
- `AccessImpactDigest`
- `AccessFreezeDisposition`

**AccessAdministrationWorkspace**
`accessWorkspaceId`, `scopeTokenRef`, `actingScopeTupleRef`, `scopeTupleHash`, `changeEnvelopeRef`, `reviewContextRef`, `subjectRef`, `currentMembershipRefs[]`, `effectiveAccessPreviewRef`, `currentElevationRefs[]`, `openedAt`

`AccessAdministrationWorkspace` is the root context for `/ops/access`. Membership edits, role diffs, elevation review, and recertification decisions must resolve through the same workspace so the same subject, scope, and package remain visible from preview to settlement. Organisation switching, purpose-of-use change, or elevation-expiry drift must supersede `actingScopeTupleRef` and freeze the workspace before approval or revocation can continue.

**AccessImpactDigest**
`accessImpactDigestId`, `accessWorkspaceRef`, `impactedSubjectCount`, `lockoutRiskRefs[]`, `orphanedOwnershipCount`, `visibilityWideningState`, `affectedReviewRefs[]`, `expiryBoundaryRefs[]`, `riskBand`, `generatedAt`

`AccessImpactDigest` materializes the real cost of a role, grant, deactivation, or elevation change. Reviewers must see whether a subject loses access, gains wider audience reach, or strands ownership before approval or revocation settles.

**AccessFreezeDisposition**
`accessFreezeDispositionId`, `accessWorkspaceRef`, `trigger = scope_drift | package_drift | expiry_drift | policy_drift | lease_expired`, `allowedActions`, `requiredRecoveryAction`, `setAt`, `clearedAt`

`AccessFreezeDisposition` is the access-specific freeze adapter used when the same shell must stay visible but approve, narrow, or revoke work becomes read-only or revalidation-first.

Core capabilities:

- invite or deactivate user
- assign role and scope
- manage organisation membership
- approve acting context
- review break-glass eligibility
- preview effective permissions before commit
- run periodic access reviews and exceptional-access decisions
- inspect permission change history
- keep role, grant, and elevation review bound to the same `GovernanceReviewContext`, `EffectiveAccessPreview`, and `AdminActionSettlement`

## Authority-link governance contract

Suggested route family:

- `/ops/governance/authority-links`

Suggested objects:

- `AuthorityLinkRecord`
- `AuthorityDelegationPolicy`
- `DirectoryCoverageRecord`
- `LinkConflictRecord`
- `LinkApprovalRecord`

Core capabilities:

- inspect source and target organisation relationships
- compare current and proposed precedence
- stage `effectiveFrom` and `effectiveTo` changes
- surface impacted grants, memberships, queues, and directory views before approval
- revoke or supersede a link without orphaning dependent grants

## Change control rules

All admin changes should require:

- config versioning
- approval workflow where required
- actor attribution
- reason code
- impact preview
- preflight simulation where required
- rollback path
- immutable audit record
- `ScopedMutationGate` validation plus `AdminActionRecord` and `AdminActionSettlement` for every consequential mutation

## Release governance contract

Suggested route family:

- `/ops/release`

Suggested objects:

- `ReleaseCandidate`
- `ReleaseApprovalFreeze`
- `BuildProvenanceRecord`
- `SchemaMigrationPlan`
- `ProjectionBackfillPlan`
- `MigrationExecutionBinding`
- `MigrationImpactPreview`
- `MigrationActionRecord`
- `MigrationActionSettlement`
- `MigrationActionObservationWindow`
- `ReadPathCompatibilityDigest`
- `ProjectionBackfillExecutionLedger`
- `MigrationCutoverCheckpoint`
- `DeploymentWave`
- `RollbackDecisionRecord`
- `ReleaseGateEvidence`

Core capabilities:

- inspect artifact digests, SBOM references, and provenance state
- bind one approved `ConfigCompilationRecord`, `ConfigSimulationEnvelope`, and `CompiledPolicyBundle` hash to a specific release candidate
- freeze the approved `ReleaseCandidate`, config compilation tuple, bundle hash set, surface schema set, migration execution binding, migration impact preview, read-path compatibility digest, backfill plan, and cutover checkpoint posture as one immutable approval tuple before production promotion
- inspect `ContinuityControlImpactDigest`, linked `ExperienceContinuityControlEvidence`, and the bound assurance-evidence graph verdict when the candidate affects patient, support, or workflow continuity controls
- inspect `VisibilityCoverageImpactDigest` when the candidate affects audience tiers, purpose-of-use rows, summary or section detail, preview depth, artifact modes, redaction packs, or break-glass posture
- treat more-info reply, intake autosave or resume, booking manage flows, hub booking-manage flows, assistive visible-session writeback, workspace completion continuity, and pharmacy-console settlement continuity as first-class affected controls when compiling or promoting a candidate
- approve migration and projection-backfill plans per environment
- inspect route-scoped read-path compatibility, backfill convergence, lag budget, and rollback bundle posture before allowing cutover or promotion
- inspect `MigrationImpactPreview` so the exact affected route families and declared live, summary-only, recovery-only, or blocked posture are visible before any migration action starts
- keep contractive cutover blocked until affected routes prove live, summary-only, or recovery-only posture explicitly rather than relying on implicit mixed-version compatibility
- execute start, pause, resume, complete, or abort of migration work only through the current `MigrationExecutionBinding`, `MigrationImpactPreview`, and authoritative `MigrationActionSettlement`
- pause, widen, rollback, or kill-switch a live deployment wave
- inspect environment drift, release history, and rollback evidence
- surface the authoritative `AdminActionSettlement` for compile, promote, and wave-action paths in the same continuity context that initiated them

Add the supporting release-evolution contracts:

**ReadPathCompatibilityDigest**
`readPathCompatibilityDigestId`, `releaseCandidateRef`, `environmentRef`, `schemaMigrationPlanRef`, `projectionBackfillPlanRef`, `migrationExecutionBindingRef`, `migrationImpactPreviewRef`, `affectedAudienceSurfaceRefs[]`, `affectedRouteFamilyRefs[]`, `liveRouteDigestRefs[]`, `summaryOnlyRouteRefs[]`, `recoveryOnlyRouteRefs[]`, `blockedRouteRefs[]`, `lastMigrationActionSettlementRef`, `rollbackCompatibilityState = verified | missing | blocked`, `digestState = exact | constrained | blocked`, `generatedAt`

`ReadPathCompatibilityDigest` is the release-gate truth for migration-safe reads. Every affected route must be classified as live, summary-only, recovery-only, or blocked under the current candidate and environment; “backfill in progress” is not a sufficient control on its own.
Its classifications must remain bound to the latest authoritative migration settlement; admin may not treat a stale digest as current merely because the underlying jobs are still running.

**ProjectionBackfillExecutionLedger**
`projectionBackfillExecutionLedgerId`, `backfillPlanRef`, `migrationExecutionBindingRef`, `environmentRef`, `projectionFamilyRefs[]`, `routeReadinessVerdictRefs[]`, `coverageState = pending | partial | converged | stale | blocked`, `lagBudgetState = within_budget | breached | unknown`, `cutoverReadinessState = not_ready | ready | blocked`, `affectedAudienceSurfaceRefs[]`, `affectedRouteFamilyRefs[]`, `lastMigrationActionSettlementRef`, `lastMigrationObservationWindowRef`, `lastAdvancedAt`

`ProjectionBackfillExecutionLedger` is the authoritative progress and lag surface for release decisions. It proves whether rebuild work has converged enough for live cutover, must remain constrained, or has become too stale to trust.
Coverage and lag posture must be explained from the latest observed migration action window, not from transport success or worker heartbeat alone.

**MigrationCutoverCheckpoint**
`migrationCutoverCheckpointId`, `releaseCandidateRef`, `migrationExecutionBindingRef`, `migrationImpactPreviewRef`, `readPathCompatibilityDigestRef`, `projectionBackfillExecutionLedgerRef`, `preCutoverPublicationBundleRef`, `targetPublicationBundleRef`, `rollbackPublicationBundleRef`, `lastMigrationActionSettlementRef`, `lastMigrationObservationWindowRef`, `checkpointState = staging | dual_read | cutover_ready | contract_blocked | rollback_only | completed`, `verifiedAt`

`MigrationCutoverCheckpoint` is the only authority for contractive cutover. A release may carry migration plans and backfill ledgers, but it may not drop legacy fields, flip read contracts, or shrink compatibility windows until this checkpoint proves the target and rollback bundles still match the current environment.
`checkpointState = cutover_ready` is legal only while the latest migration settlement is no longer pending observation and the corresponding observation window still proves the declared route posture.

Runtime-owned migration execution objects must stay visible in this admin surface rather than being replaced by local progress banners:

- `MigrationImpactPreview`
- `MigrationActionRecord`
- `MigrationActionSettlement`
- `MigrationActionObservationWindow`

Admin may initiate migration control from `/ops/release`, but it may not mint a second release-local execution model. The authoritative start, pause, resume, cutover, and abort result comes from the runtime-owned migration action chain.

## Compiled policy bundle contract

Before any production promotion, compile routing rules, SLA or ETA policy, identity and grant policy, duplicate policy, provider overrides, waitlist and booking policy, hub coordination policy, callback and messaging policy, pharmacy rule packs, communications policy, access policy, visibility policy, provider capability matrices, and tenant overrides into a single `CompiledPolicyBundle`. The hub coordination pack must compile as an explicit family tuple over `HubRoutingPolicyPack`, `HubVarianceWindowPolicy`, `HubServiceObligationPolicy`, `HubPracticeVisibilityPolicy`, and `HubCapacityIngestionPolicy`; approval may not treat that area as one opaque Enhanced Access blob.

Suggested object:

- `CompiledPolicyBundle`

Within this admin and release surface, every `CompiledPolicyBundle` must be traceable to one immutable `ConfigCompilationRecord`, one immutable `ConfigSimulationEnvelope`, and one exact `compilationTupleHash`; a naked bundle hash is not sufficient approval evidence.

Required fields:

- `bundleId`
- `tenantId`
- `domainPackRefs`
- `policyPackRefs`
- `configVersionRefs`
- `compiledHash`
- `subpackTupleRefs`
- `compatibilityState`
- `simulationEvidenceRef`
- `approvedBy`
- `approvedAt`

## Production promotion gate

The compiler must reject any bundle that:

- permits PHI exposure through a public or superseded grant
- permits automatic patient binding below the required assurance level
- permits automatic duplicate merge or same-request attach without the canonical replay and duplicate controls: deterministic replay proof for retry collapse, immutable `DuplicatePairEvidence`, immutable `DuplicateResolutionDecision`, explicit continuity witness for attach, and `same_episode_confirmed` plus the stricter `same_request_attach` thresholds and candidate-competition margins for attaches
- lacks validated `channelCalibrationRef` coverage for any web, phone, SMS-continuation, or authenticated-return path that the bundle would allow to auto-confirm duplicate decisions
- permits closure with any active lease, pending preemption, or unresolved reconciliation
- permits exclusive slot language without a real `held` reservation
- permits pharmacy auto-close from weakly correlated evidence
- permits callback, message, hub, booking, or pharmacy paths to bypass the universal re-safety rule
- permits any hub offerability, direct-commit, callback fallback, or practice-manage exposure path to depend on undeclared routing, variance-window, practice-visibility, service-obligation, or capacity-ingestion policy instead of one compiled hub policy tuple
- lets service-obligation rules such as minutes-per-1,000, reminder duties, cancellation make-up, or availability expectations reorder patient or coordinator-visible network candidates instead of producing a typed obligation evaluation and exception record
- lets practice-acknowledgement debt, no-ack exceptions, or manage-exposure recovery clear without one current `HubPracticeVisibilityPolicy`, one current `NetworkCoordinationPolicyEvaluation`, and matching `ackGeneration` evidence
- permits a projection, section, summary snippet, timeline row, communication preview, or artifact mode to include fields outside the bound audience-tier visibility policy or `MinimumNecessaryContract`
- lacks `AudienceVisibilityCoverage`, required section or preview contracts, required artifact contracts, or required redaction policies for any route family, timeline preview, receipt, communication digest, artifact contract, or mutation posture the bundle would allow to render
- reuses one projection family across audience tiers or purpose-of-use rows even though the declared summary, section, preview, artifact, redaction, or mutation ceilings differ
- couples redaction behavior to route-family branches instead of named visibility-policy contracts and compile evidence
- widens acting-context or break-glass scope without a dedicated coverage row, audit policy, and verification evidence
- allows a route, gateway surface, or package boundary to mutate a governing object owned by another bounded context without one declared `ContextBoundaryContract`, published milestone contract, or governance gate
- widens `RouteFamilyOwnershipClaim`, `CanonicalObjectDescriptor`, or `AudienceSurfaceRouteContract` so the owning bounded context becomes ambiguous or conflicts with the published gateway/runtime contracts
- lacks one published `ReleaseTrustFreezeVerdict` path for any audience surface or route family that can become writable, diagnostically visible, or governed-recovery-capable under the candidate
- permits any route, wave action, governance handoff, or operational intervention to remain `publishable_live` when the required assurance slice trust is `degraded | quarantined | unknown`, the required channel freeze is active, the guardrail snapshot is `constrained | frozen | rollback_review_required`, or the bound release tuple is stale

The promotion gate must also reject any release that lacks a signed build provenance record, an approved schema migration plan, a verified projection backfill plan for the target environment, a current `ReadPathCompatibilityDigest`, a current `ProjectionBackfillExecutionLedger`, a verified `MigrationCutoverCheckpoint` where contractive cutover is in scope, or successful canary evidence for the target wave.

Promotion must also fail closed when:

- the current `ConfigCompilationRecord` is missing, `compileState != ready`, `releaseFreezeReadinessState != ready`, or its baseline snapshot, candidate bundle hash, required policy-domain set, reference-scenario set, or surface-schema set differs from the visible approval package
- the current `ConfigSimulationEnvelope` is missing, `compileReadinessState != ready`, `releaseFreezeReadinessState != ready`, or it was not generated from the same `ConfigCompilationRecord`, `CompiledPolicyBundle`, and `compilationTupleHash` that approval saw
- the current `ReleaseContractVerificationMatrix` is missing, `matrixState != exact`, or its `matrixHash` no longer matches the visible candidate, simulation envelope, or frozen release tuple
- the current `StandardsDependencyWatchlist` is missing, `watchlistState != current`, or its `candidateBundleHash`, `compileGateState`, `promotionGateState`, or `watchlistHash` no longer matches the visible candidate and review package
- the current `GovernanceReviewPackage` is missing, `packageState != current`, or `ConfigWorkspaceContext`, `CommunicationsGovernanceWorkspace`, `GovernanceReviewContext`, `ApprovalEvidenceBundle`, or `ReleaseApprovalFreeze` points at a different `reviewPackageHash` than the approved review package
- `ChangeBaselineSnapshot`, `ChangeEnvelope`, `GovernanceReviewContext`, `ApprovalEvidenceBundle`, `ReleaseApprovalFreeze`, or `PromotionIntentEnvelope` points at a different `baselineTupleHash` than the approved review package
- the current `ConfigSimulationEnvelope` points at a stale or blocked `AssuranceEvidenceGraphSnapshot`, or its `graphHash` and completeness verdict do not match the continuity proof the approval tuple reviewed
- `ConfigDriftFence.approvalInvalidationState != current` or `ConfigDriftFence.freezeState != clear` for the tuple the release is attempting to promote
- `ApprovalEvidenceBundle`, `GovernanceReviewContext`, `ReleaseApprovalFreeze`, or `PromotionIntentEnvelope` points at a different `approvalTupleHash` than the approved release package
- `ApprovalEvidenceBundle`, `GovernanceReviewContext`, `ReleaseApprovalFreeze`, or `PromotionIntentEnvelope` points at a different `compilationTupleHash` than the approved config package
- `ConfigCompilationRecord`, `ConfigSimulationEnvelope`, `VerificationScenario`, `RuntimePublicationBundle`, `ReleasePublicationParityRecord`, `ReleaseApprovalFreeze`, or `PromotionIntentEnvelope` points at a different `releaseContractMatrixHash` than the approved candidate contract matrix
- `ApprovalEvidenceBundle`, `GovernanceReviewContext`, `ReleaseApprovalFreeze`, or `PromotionIntentEnvelope` points at a different `standardsWatchlistHash` than the approved candidate watchlist
- `ConfigWorkspaceContext`, `ApprovalEvidenceBundle`, `GovernanceReviewContext`, `ReleaseApprovalFreeze`, or `PromotionIntentEnvelope` points at a stale or different `scopeTupleHash` than the approved governance scope package
- any `WritableRouteContractCoverageRecord`, `ContinuityContractCoverageRecord`, or `EmbeddedSurfaceContractCoverageRecord` linked from the current contract matrix is `stale | blocked` for an affected route family or continuity-sensitive workflow
- any blocking dependency lifecycle record, legacy reference finding, or compatibility alert in the current watchlist lacks owner, replacement path, remediation deadline, affected route family, affected tenant scope, affected live channel, or affected simulation references
- any `StandardsExceptionRecord` linked to the current watchlist is expired, revoked, points at a different candidate or review package, or lacks immutable approval evidence for the candidate under review
- the approved `CompiledPolicyBundle` hash no longer matches the frozen `ReleaseCandidate`
- the release changes behavior but lacks compatibility evidence for affected surface schemas or live channels
- any affected route family is missing from `ReadPathCompatibilityDigest`, is classified only by prose instead of machine-readable posture, or lacks a verified rollback compatibility state
- `ProjectionBackfillExecutionLedger.coverageState = stale | blocked` or `lagBudgetState = unknown` for an affected projection family
- contractive schema change, route-contract cutover, or projection read-model swap is requested while `MigrationCutoverCheckpoint.checkpointState` is not `cutover_ready` or `completed`
- `MigrationExecutionBinding.bindingState != ready` or its bound publication parity, watch tuple, read-path digest, or cutover checkpoint no longer matches the visible approval tuple
- any in-scope migration or backfill action lacks `MigrationImpactPreview`, `MigrationActionSettlement`, or `MigrationActionObservationWindow` proving the declared route posture has actually converged
- the latest in-scope `MigrationActionSettlement.result` remains `accepted_pending_observation | stale_recoverable | rollback_required | failed`
- reference-case simulation does not prove stale pharmacy choice or consent dispatch is rejected
- reference-case simulation does not prove invalidated assistive sessions cannot write final human artifacts
- `ContinuityControlImpactDigest.validationState != complete` for a candidate that affects patient navigation, record-continuation recovery, more-info reply posture, conversation settlement posture, support replay restore, intake resume, booking manage posture, hub booking-manage posture, assistive session continuity, workspace task completion, or pharmacy-console settlement
- `ContinuityControlImpactDigest.requiredAssuranceGraphCompletenessVerdictRef` is missing, stale, or not `complete` for an affected continuity-control family
- required `ExperienceContinuityControlEvidence` for an affected continuity control is stale, missing, blocked, or untrusted for the target wave
- `VisibilityCoverageImpactDigest.validationState != complete` for a candidate that affects audience tiers, purpose-of-use rows, summary or section detail, preview depth, artifact modes, redaction packs, or break-glass posture
- a `multi_tenant` or `platform` candidate lacks explicit `affectedTenantCount`, `affectedOrganisationCount`, or the current scope tuple proving the blast radius under review
- `BoundedContextImpactDigest.validationState != complete` for a candidate that affects owning contexts, contributor contexts, boundary contracts, gateway surfaces, shared-kernel packages, or cross-context write posture
- reference-case simulation or compile evidence does not prove that cross-context routes degrade to milestone, projection, governance, or recovery posture instead of directly writing another context's lifecycle truth
- reference-case simulation or compile evidence does not prove that affected `intake_resume`, `booking_manage`, `assistive_session`, `workspace_task_completion`, or `pharmacy_console_settlement` routes fail closed through the declared runtime recovery posture
- reference-case simulation or compile evidence does not prove that partially rebuilt, lagging, or rollback-mode projections degrade the affected routes to the exact declared live, summary-only, recovery-only, or blocked posture without misleading calmness
- the initiating admin action lacks a settled `AdminActionSettlement` tied to the current `ConfigDriftFence`, `ReleaseApprovalFreeze`, and required `AssuranceSliceTrustRecord` posture

Promotion is allowed only after compile success, reference-case simulation, immutable audit of the approved bundle hash and `compilationTupleHash`, signed build provenance, approved migration and backfill plans, verified route-scoped read-path compatibility, current backfill convergence evidence, and successful canary evidence for the target wave.

## Dependency and standards hygiene

Admin surfaces should expose:

- standards version map
- dependency lifecycle state
- legacy reference findings
- policy compatibility warnings

High-priority hygiene defects in this surface:

1. standards versions are listed, but not yet pinned to one authoritative baseline per environment, tenant scope, and promotion candidate
2. dependency lifecycle state is visible, but not yet tied to owner, remediation deadline, supported window, or promotion effect
3. legacy reference findings are not yet linked to the exact routes, bundles, or simulations they endanger, so teams can understate blast radius
4. policy compatibility warnings are not yet separated into advisory, compile-blocking, and promotion-blocking classes with explicit recovery paths
5. exceptions to standards or dependency policy are not yet modeled as time-bounded, approval-bound objects, so drift can become permanent by omission

Add the supporting hygiene contracts:

**StandardsBaselineMap**
`baselineMapId`, `environmentRef`, `tenantScopeRef`, `candidateBundleHash`, `liveBundleHash`, `requiredStandardRefs[]`, `standardsVersionRefs`, `requiredByDateRefs`, `blockingDeltaRefs[]`, `affectedRouteFamilyRefs[]`, `affectedTenantScopeRefs[]`, `affectedSurfaceSchemaRefs[]`, `affectedLiveChannelRefs[]`, `affectedSimulationRefs[]`, `watchlistRef`, `watchlistHash`, `baselineState = exact | stale | missing | blocked`, `generatedAt`

`StandardsBaselineMap` is the authoritative version map for standards and platform obligations. It must bind the visible baseline to the exact candidate or live bundle under review, so operators cannot compare a draft against a stale or ambiguous standards set.

**DependencyLifecycleRecord**
`dependencyLifecycleRecordId`, `dependencyRef`, `candidateBundleHash`, `liveBundleHash`, `ownerRef`, `owningTeamRef`, `lifecycleState = supported | maintenance_only | deprecated | end_of_life | emergency_blocked`, `supportedUntil`, `replacementRef`, `remediationDueAt`, `affectedRouteFamilyRefs[]`, `affectedTenantScopeRefs[]`, `affectedSurfaceSchemaRefs[]`, `affectedLiveChannelRefs[]`, `affectedSimulationRefs[]`, `watchlistRef`, `watchlistHash`, `currentExceptionRefs[]`, `promotionImpact = none | warn | compile_block | promotion_block`, `recordState = current | stale | superseded`, `recordedAt`

`DependencyLifecycleRecord` turns package age into an actionable control. Admin surfaces must show not only that a dependency is old, but who owns it, when support ends, what replaces it, and whether current promotion is merely warned or fully blocked.

**LegacyReferenceFinding**
`legacyReferenceFindingId`, `referenceClass`, `candidateBundleHash`, `liveBundleHash`, `ownerRef`, `replacementRef`, `remediationDueAt`, `affectedRouteRefs[]`, `affectedRouteFamilyRefs[]`, `affectedTenantScopeRefs[]`, `affectedBundleRefs[]`, `affectedSurfaceSchemaRefs[]`, `affectedLiveChannelRefs[]`, `affectedSimulationRefs[]`, `watchlistRef`, `watchlistHash`, `findingSeverity = info | warn | compile_block | promotion_block`, `migrationPathRef`, `findingState = open | excepted | resolved | superseded`, `recordedAt`

`LegacyReferenceFinding` must point to the concrete surfaces and bundles at risk. A legacy EPS directory usage, obsolete NHS standard, or retired transport assumption may not survive as a generic note once it affects a live route family or compiled bundle.

**PolicyCompatibilityAlert**
`policyCompatibilityAlertId`, `candidateBundleHash`, `liveBundleHash`, `affectedPolicyDomains[]`, `affectedSurfaceSchemas[]`, `affectedRouteFamilyRefs[]`, `affectedTenantScopeRefs[]`, `affectedLiveChannelRefs[]`, `affectedSimulationRefs[]`, `ownerRef`, `replacementRef`, `remediationDueAt`, `watchlistRef`, `watchlistHash`, `compatibilityClass = advisory | compile_blocking | promotion_blocking`, `evidenceRefs[]`, `recoveryActionRef`, `linkedExceptionRef`, `alertState = open | excepted | resolved | superseded`, `expiresAt`

`PolicyCompatibilityAlert` classifies compatibility warnings by enforcement level. Alerts that affect PHI visibility, release tuples, live channels, or standards obligations must freeze compile or promotion until resolved or explicitly excepted through policy.

**StandardsExceptionRecord**
`standardsExceptionRecordId`, `scopeRef`, `candidateBundleHash`, `liveBundleHash`, `reviewPackageHash`, `approvalTupleHash`, `approvalEvidenceBundleRef`, `releaseApprovalFreezeRef`, `linkedFindingRefs[]`, `affectedRouteFamilyRefs[]`, `affectedTenantScopeRefs[]`, `affectedSurfaceSchemaRefs[]`, `affectedLiveChannelRefs[]`, `affectedSimulationRefs[]`, `watchlistRef`, `watchlistHash`, `justificationRef`, `mitigationRef`, `ownerRef`, `approvedByRef`, `approvedAt`, `expiresAt`, `revokedAt`, `requiredReopenFindingRefs[]`, `exceptionState = proposed | approved | expired | revoked`

`StandardsExceptionRecord` is the only legal bypass for a blocked standard or dependency finding. Exceptions must be explicit, time-bounded, approval-bound, and visible beside the blocked candidate; silent tolerance is forbidden.

**StandardsDependencyWatchlist**
`standardsDependencyWatchlistId`, `candidateBundleHash`, `liveBundleHash`, `environmentRef`, `tenantScopeRef`, `scopeTupleHash`, `reviewPackageHash`, `standardsBaselineMapRef`, `dependencyLifecycleRecordRefs[]`, `legacyReferenceFindingRefs[]`, `policyCompatibilityAlertRefs[]`, `standardsExceptionRecordRefs[]`, `affectedRouteFamilyRefs[]`, `affectedTenantScopeRefs[]`, `affectedSurfaceSchemaRefs[]`, `affectedLiveChannelRefs[]`, `affectedSimulationRefs[]`, `blockingFindingRefs[]`, `advisoryFindingRefs[]`, `compileGateState = pass | review_required | blocked`, `promotionGateState = pass | review_required | blocked`, `watchlistState = current | stale | superseded | blocked`, `watchlistHash`, `generatedAt`

`StandardsDependencyWatchlist` is the candidate-bound hygiene truth for config compile, approval, and release promotion. Standards baselines, dependency lifecycle posture, legacy references, compatibility alerts, and approved exceptions must all materialize through one watchlist so the operator sees one enforcement model for the exact candidate under review rather than four adjacent note sets.

Rules:

- dependency and standards views must resolve against the same `candidateBundleHash` or live bundle hash the operator is preparing to compile, approve, or promote
- `StandardsBaselineMap`, `ConfigCompilationRecord`, `ConfigSimulationEnvelope`, `GovernanceReviewPackage`, `ApprovalEvidenceBundle`, `ReleaseApprovalFreeze`, and `VerificationScenario` must resolve the same current `StandardsDependencyWatchlist` and `watchlistHash`; compile, approval, and release lanes may not each evaluate hygiene posture independently
- `compile_block` and `promotion_block` findings must feed the same freeze posture shown in config, approval, and release surfaces; hygiene warnings may not remain informational in one surface and blocking in another
- blast radius must show affected route families, tenant scopes, surface schemas, live channels, and affected simulations before an operator can approve a standards exception
- expired or revoked `StandardsExceptionRecord` objects must immediately re-open the linked blocking findings and invalidate stale approvals
- every blocking or advisory finding must preserve owner, replacement path, remediation deadline, affected route family, affected tenant scope, affected live channel, and affected simulation refs through the current watchlist; raw version drift without a remediation owner is incomplete evidence
- no production promotion should proceed while a required baseline map, lifecycle record, or compatibility alert is missing for the candidate under review

No production promotion should bypass declared config and standards checks.
