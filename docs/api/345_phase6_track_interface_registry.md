# 345 Phase 6 Track Interface Registry

Contract version: `345.phase6.parallel-gate.v1`

This registry maps each Phase 6 track to the interfaces it is allowed to produce and the upstream tracks it must consume.

## Track interface map

| Track | Title | Produced Interfaces | Depends On Tracks | Downstream Dependents |
| --- | --- | --- | --- | --- |
| par_346 | Pharmacy case state machine and lineage linkage | PharmacyCaseKernel, PharmacyCaseTransitionGuard, PharmacyLineageLinkMaterializer, PharmacyMutationAuthorityVerifier | none | par_348, par_349, par_350, par_352, seq_368 |
| par_347 | Eligibility engine and versioned policy-pack compiler | PharmacyRulePackCompiler, PharmacyEligibilityEvaluationService, EligibilityReplayService, GoldenCaseRegressionHarness | none | par_348, par_349, par_357, seq_369 |
| par_348 | Directory abstraction and provider choice pipeline | PharmacyDiscoveryAdapterRegistry, PharmacyChoiceTruthProjection, ConsentCheckpointService | par_346, par_347 | par_349, par_351, par_358, seq_366, seq_369 |
| par_349 | Referral package composer and content governance | PharmacyReferralPackageComposer, ReferralContentGovernancePolicy, ReferralCorrelationSeedService | par_348 | par_350, par_359, seq_369 |
| par_350 | Dispatch adapter, transport contract, and retry or expiry logic | PharmacyDispatchAdapter, TransportAssuranceProfileRegistry, DispatchProofAggregator, DispatchRetryAndExpiryService | par_348, par_349 | par_351, par_352, par_359, seq_366, seq_367, seq_369 |
| par_351 | Patient instruction generation and referral status projections | PatientPharmacyStatusProjector, PatientInstructionGenerator | par_348, par_350 | par_356, par_360, seq_368, seq_371 |
| par_352 | Outcome ingest, Update Record observation, and reconciliation pipeline | OutcomeIngestPipeline, OutcomeReplayClassifier, OutcomeMatchAndSettlementService | par_346, par_349, par_350 | par_353, par_354, par_361, seq_367, seq_369, seq_370 |
| par_353 | Bounce-back, urgent return, and reopen mechanics | PharmacyBounceBackClassifier, UrgentReturnCoordinator, ReopenPriorityService, ReachabilityRepairPlanner | par_346, par_352 | par_354, par_360, par_362, seq_370 |
| par_354 | Practice visibility, operations queue, and exception handling views API | PracticeVisibilityProjector, PharmacyOperationsQueueApi, ProviderHealthProjectionApi, PharmacyExceptionViewApi | par_350, par_352, par_353 | par_356, par_363, seq_368, seq_370 |
| par_355 | Pharmacy console support region and stock truth API | PharmacyConsoleWorkbenchApi, InventoryComparisonApi, SupplyComputationApi, HandoffReadinessBoardApi | par_350, par_352, par_353, par_354 | par_356, par_363, seq_371 |
| par_356 | Pharmacy shell route family and console mission frame | PharmacyShellRouteFamily, PharmacyMissionFrame, PharmacyDecisionDockHost | par_351, par_354, par_355 | par_357, par_358, par_359, par_360, par_361, par_362, par_363, seq_371 |
| par_357 | Eligibility explainer and unsuitable-return views | EligibilityExplainerScreen, PatientUnsuitableReturnScreen | par_347, par_356 | par_365, seq_371 |
| par_358 | Patient pharmacy chooser ranked list, map, and warned-choice flow | PharmacyChooserScreen, WarnedChoiceAcknowledgementFlow | par_348, par_356 | par_359, par_365, seq_371 |
| par_359 | Referral confirmation, dispatch posture, and consent continuity views | ReferralConfirmationScreen, DispatchPostureInspector | par_349, par_350, par_356 | par_360, par_365, seq_371 |
| par_360 | Chosen-pharmacy instructions, status tracker, and outcome pages | ChosenPharmacyInstructionScreen, PatientPharmacyStatusTracker | par_351, par_353, par_356, par_359 | par_365, seq_368, seq_371 |
| par_361 | Outcome assurance, reconciliation, and manual review views | OutcomeAssuranceScreen, OutcomeEvidenceDrawer | par_352, par_356 | par_363, par_365, seq_370, seq_371 |
| par_362 | Bounce-back, urgent-return, and reopen recovery views | BounceBackRecoveryScreen, UrgentReturnRecoveryScreen | par_353, par_356 | par_363, par_364, par_365, seq_370, seq_371 |
| par_363 | Practice visibility operations panel and pharmacy-console workbench | PharmacyConsoleWorkbenchScreen, PracticeOperationsQueueScreen | par_354, par_355, par_356, par_361, par_362 | par_364, par_365, seq_368, seq_371 |
| par_364 | Narrow-screen and recovery postures for pharmacy console | PharmacyMissionStackResponsiveLayout | par_356, par_363 | par_365, seq_371 |
| par_365 | Accessibility and micro-interaction refinements for pharmacy flows | PharmacyAccessibilityRegressionHarness | par_357, par_358, par_359, par_360, par_361, par_362, par_363, par_364 | seq_371 |
| seq_366 | Directory and dispatch provider credential configuration | NonProdProviderCredentialSetupFlow, ProviderBindingVerificationRun | par_348, par_350 | seq_368, seq_369 |
| seq_367 | Update Record and referral transport sandbox readiness | UpdateRecordReadinessRequestFlow, TransportSandboxVerificationRun | par_350, par_352 | seq_368, seq_369, seq_370 |
| seq_368 | Merge pharmacy loop with triage, portal, operations, and notifications | PharmacyLoopProductMerge | par_346, par_351, par_354, par_360, par_363, seq_366, seq_367 | seq_369, seq_370, seq_371 |
| seq_369 | Eligibility, directory, dispatch, and outcome reconciliation suites | Phase6TestEvidencePack_369 | par_347, par_348, par_350, par_352, seq_368 | seq_370, seq_371 |
| seq_370 | Bounce-back, urgent return, practice visibility, and exception suites | Phase6TestEvidencePack_370 | par_353, par_354, seq_368 | seq_371 |
| seq_371 | Pharmacy console, patient status, and responsive accessibility suites | Phase6TestEvidencePack_371 | par_356, par_357, par_358, par_359, par_360, par_361, par_362, par_363, par_364, par_365, seq_368 | none |

## Machine-readable ownership seams

- data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_DISPATCH_OUTCOME_BOUNCE_BACK_OWNERSHIP.json
- data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_FRONTEND_TRUTH_CONSUMPTION_BOUNDARY.json
- data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_INVALIDATION_CHAIN_AUTHORITY.json
- data/contracts/PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json

## Why this registry exists

- it prevents `dispatch`, `outcome`, and `bounce-back` from sharing one accidental owner
- it prevents frontend tracks from fabricating truth families later
- it prevents environment setup tasks from hiding operator-owned readiness boundaries
