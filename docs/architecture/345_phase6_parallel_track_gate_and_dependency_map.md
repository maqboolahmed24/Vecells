# 345 Phase 6 Parallel Track Gate And Dependency Map

Contract version: `345.phase6.parallel-gate.v1`

## Verdict

`wave_1_open_with_constraints`

Only `par_346` and `par_347` are safe to open now.
They consume only the frozen Phase 6 contracts from `342` and the carried-forward Phase 5 foundation from `341`.
Every later track remains blocked or deferred until executable upstream truth exists or environment-owned operator evidence replaces the inherited manual bridge boundaries.

## Summary

- Ready now: 2
- Blocked: 22
- Deferred: 2
- Total tracked rows: 26

## Why the first wave is limited

- `par_346` owns the canonical pharmacy case kernel, lineage child link, and request-fence law.
- `par_347` owns immutable pack compilation, deterministic evaluation, and explanation bundles.
- `par_348` onward depend on executable outputs from that first wave, not just frozen schemas.
- `seq_366` and `seq_367` also inherit the explicit operator and manual-bridge boundaries carried from `341`.

## Launch-ready first wave

| Track | Title | Mission | Launch Packet | Upstream Tracks |
| --- | --- | --- | --- | --- |
| par_346 | Pharmacy case state machine and lineage linkage | Implement the canonical pharmacy case kernel, lineage child link, fencing, stale-owner recovery, and governed lifecycle commands. | data/launchpacks/345_track_launch_packet_346.json | none |
| par_347 | Eligibility engine and versioned policy-pack compiler | Implement immutable Pharmacy First policy packs, deterministic pathway evaluation, explanation bundles, and replayable historical rule execution. | data/launchpacks/345_track_launch_packet_347.json | none |

## Blocked rows

| Track | Title | Depends On | Unlock Rule |
| --- | --- | --- | --- |
| par_348 | Directory abstraction and provider choice pipeline | par_346, par_347 | Unblock only after 346 and 347 complete, their validators pass, and the 345 gate is rerun. |
| par_349 | Referral package composer and content governance | par_348 | Unblock after 348 is complete and 345 confirms stale-consent and stale-provider invalidation remain explicit. |
| par_350 | Dispatch adapter, transport contract, and retry or expiry logic | par_348, par_349 | Unblock after 348 and 349 complete and 345 confirms package drift invalidates dispatch readiness. |
| par_351 | Patient instruction generation and referral status projections | par_348, par_350 | Unblock after 348 and 350 complete and before any patient UI track consumes pharmacy status. |
| par_352 | Outcome ingest, Update Record observation, and reconciliation pipeline | par_346, par_349, par_350 | Unblock after 346, 349, and 350 complete and after 367 readiness remains clearly deferred rather than overclaimed. |
| par_353 | Bounce-back, urgent return, and reopen mechanics | par_346, par_352 | Unblock after 346 and 352 complete and after the invalidation-chain seam still proves calm posture is blocked by return debt. |
| par_354 | Practice visibility, operations queue, and exception handling views API | par_350, par_352, par_353 | Unblock after 350, 352, and 353 complete and after 345 confirms one owner for practice visibility and operations projections. |
| par_355 | Pharmacy console support region and stock truth API | par_350, par_352, par_353, par_354 | Unblock after 350, 352, 353, and 354 complete and after the frontend truth-consumption seam remains explicit. |
| par_356 | Pharmacy shell route family and console mission frame | par_351, par_354, par_355 | Unblock after 351, 354, and 355 complete and after the frontend truth-consumption seam remains closed. |
| par_357 | Eligibility explainer and unsuitable-return views | par_347, par_356 | Unblock after 347 and 356 complete and after the shared explanation-bundle law remains unchanged. |
| par_358 | Patient pharmacy chooser ranked list, map, and warned-choice flow | par_348, par_356 | Unblock after 348 and 356 complete and after the full-choice law remains machine-auditable. |
| par_359 | Referral confirmation, dispatch posture, and consent continuity views | par_349, par_350, par_356 | Unblock after 349, 350, and 356 complete and after the dispatch/package invalidation chain remains explicit. |
| par_360 | Chosen-pharmacy instructions, status tracker, and outcome pages | par_351, par_353, par_356, par_359 | Unblock after 351, 353, 356, and 359 complete and after calm-completion law stays explicit. |
| par_361 | Outcome assurance, reconciliation, and manual review views | par_352, par_356 | Unblock after 352 and 356 complete and after outcome ambiguity still blocks closure. |
| par_362 | Bounce-back, urgent-return, and reopen recovery views | par_353, par_356 | Unblock after 353 and 356 complete and after loop-risk and urgent-return distinctions remain explicit. |
| par_363 | Practice visibility operations panel and pharmacy-console workbench | par_354, par_355, par_356, par_361, par_362 | Unblock after 354, 355, 356, 361, and 362 complete and after frontend truth-consumption remains server-derived. |
| par_364 | Narrow-screen and recovery postures for pharmacy console | par_356, par_363 | Unblock after 356 and 363 complete and after the same-shell continuity model is already proved on desktop. |
| par_365 | Accessibility and micro-interaction refinements for pharmacy flows | par_357, par_358, par_359, par_360, par_361, par_362, par_363, par_364 | Unblock after 357 to 364 complete and after the shell and status truth remain stable. |
| seq_368 | Merge pharmacy loop with triage, portal, operations, and notifications | par_346, par_351, par_354, par_360, par_363, seq_366, seq_367 | Unblock only after 346, 351, 354, 360, 363, 366, and 367 are complete and the gate is rerun. |
| seq_369 | Eligibility, directory, dispatch, and outcome reconciliation suites | par_347, par_348, par_350, par_352, seq_368 | Unblock after 347, 348, 350, 352, and 368 complete. |
| seq_370 | Bounce-back, urgent return, practice visibility, and exception suites | par_353, par_354, seq_368 | Unblock after 353, 354, and 368 complete. |
| seq_371 | Pharmacy console, patient status, and responsive accessibility suites | par_356, par_357, par_358, par_359, par_360, par_361, par_362, par_363, par_364, par_365, seq_368 | Unblock only after 356 to 365 and 368 complete. |

## Deferred rows

| Track | Title | Depends On | Inherited Boundaries |
| --- | --- | --- | --- |
| seq_366 | Directory and dispatch provider credential configuration | par_348, par_350 | BLK341_004, CF341_003, CF341_004, CF341_005 |
| seq_367 | Update Record and referral transport sandbox readiness | par_350, par_352 | BLK341_004, CF341_002, CF341_003 |

## Exact object-to-owner registry

| Artifact | Owner | Object Family | Truth Family | Consumers |
| --- | --- | --- | --- | --- |
| PharmacyCase | par_346 | case | lineage | par_347, par_348, par_349, par_350, par_352, seq_368 |
| LineageCaseLink(caseFamily = pharmacy) | par_346 | case | lineage | par_348, par_352, seq_368 |
| ServiceTypeDecision | par_347 | policy | eligibility | par_346, par_348, par_349 |
| PathwayEligibilityEvaluation | par_347 | policy | eligibility | par_346, par_348, par_357, seq_369 |
| PharmacyRulePack | par_347 | policy | eligibility | par_348, par_349, seq_369 |
| PathwayDefinition | par_347 | policy | eligibility | par_348, seq_369 |
| PathwayTimingGuardrail | par_347 | policy | eligibility | par_348, par_349, par_359 |
| EligibilityExplanationBundle | par_347 | policy | eligibility | par_357 |
| PharmacyDirectorySnapshot | par_348 | directory | choice_truth | par_349, par_358, seq_366, seq_369 |
| PharmacyDirectorySourceSnapshot | par_348 | directory | choice_truth | seq_366, seq_369 |
| PharmacyProviderCapabilitySnapshot | par_348 | directory | choice_truth | par_349, par_358, seq_366, seq_369 |
| PharmacyChoiceProof | par_348 | choice | choice_truth | par_349, par_358, seq_369 |
| PharmacyChoiceSession | par_348 | choice | choice_truth | par_349, par_358, par_359 |
| PharmacyConsentRecord | par_348 | choice | choice_truth | par_349, par_359 |
| PharmacyConsentCheckpoint | par_348 | choice | choice_truth | par_349, par_350, par_359 |
| PharmacyReferralPackage | par_349 | package | package_truth | par_350, par_359, seq_369 |
| PharmacyDispatchPlan | par_350 | dispatch | dispatch_truth | par_351, par_352, par_359, seq_366, seq_367, seq_369 |
| PharmacyDispatchAttempt | par_350 | dispatch | dispatch_truth | par_352, par_359, seq_367, seq_369 |
| DispatchProofEnvelope | par_350 | dispatch | dispatch_truth | par_352, par_359, seq_367, seq_369 |
| PharmacyDispatchTruthProjection | par_350 | dispatch | dispatch_truth | par_351, par_352, par_354, par_355, par_359, seq_368, seq_369 |
| PharmacyPatientStatusProjection | par_351 | status | status_truth | par_354, par_356, par_360, seq_368, seq_371 |
| OutcomeEvidenceEnvelope | par_352 | outcome | outcome_truth | par_361, seq_367, seq_369 |
| PharmacyOutcomeReconciliationGate | par_352 | outcome | outcome_truth | par_353, par_361, seq_369 |
| PharmacyOutcomeTruthProjection | par_352 | outcome | outcome_truth | par_353, par_354, par_355, par_361, seq_368, seq_369, seq_370 |
| PharmacyBounceBackRecord | par_353 | return | return_truth | par_354, par_360, par_362, seq_368, seq_370 |
| PharmacyReachabilityPlan | par_353 | return | return_truth | par_351, par_354, par_360, par_362, seq_370 |
| PharmacyPracticeVisibilityProjection | par_354 | visibility | visibility_truth | par_356, par_363, seq_368, seq_370 |
| PharmacyOperationsQueueProjection | par_354 | visibility | visibility_truth | par_356, par_363, seq_368, seq_370 |
| PharmacyConsoleWorklistProjection | par_355 | console | console_truth | par_356, par_363, par_364, seq_371 |
| PharmacyCaseWorkbenchProjection | par_355 | console | console_truth | par_363, par_364, seq_371 |
| InventoryTruthPanelProjection | par_355 | console | console_truth | par_363, par_364 |
| HandoffReadinessProjection | par_355 | console | console_truth | par_363, seq_371 |

## Invalidation chains that 345 proves explicitly

| Chain | Trigger | Invalidates | Blocked Outcome | Canonical Owners |
| --- | --- | --- | --- | --- |
| INV345_001 | Provider change, provider capability drift, or pathway change | PharmacyConsentRecord, PharmacyConsentCheckpoint, PharmacyReferralPackage | Dispatch readiness must fail closed until choice and package truth are refreshed. | par_348, par_349, par_350 |
| INV345_002 | Consent supersession, package supersession, or package hash drift | PharmacyDispatchPlan, PharmacyDispatchAttempt, DispatchProofEnvelope | Any in-flight or pending dispatch must be treated as stale and non-authoritative. | par_349, par_350 |
| INV345_003 | Outcome ambiguity, contradiction, or weak match review | PharmacyOutcomeTruthProjection.closeEligibilityState, PharmacyCase closure path | Closure and calm completion stay blocked until reconciliation settles. | par_352 |
| INV345_004 | Urgent return, no-contact return, or reachability repair failure | PharmacyPatientStatusProjection.calmCopyAllowed, PharmacyPracticeVisibilityProjection.calmCopyAllowed | Patient and practice posture must remain visibly non-calm while return debt or reachability repair stays open. | par_351, par_353, par_354 |
| INV345_005 | Loop-risk escalation or reopen-review debt | Automatic redispatch, Close command | Automatic redispatch or close remains blocked until supervisor or review authority settles the case. | par_353, par_350, par_352 |

## Hard merge criteria for the first wave

- Only par_346 may canonically mutate PharmacyCase and the pharmacy LineageCaseLink; later tracks consume refs or emit typed deltas only.
- Only par_347 may canonically mutate ServiceTypeDecision, PathwayEligibilityEvaluation, PharmacyRulePack, PathwayDefinition, PathwayTimingGuardrail, and EligibilityExplanationBundle.
- Provider or pathway drift must invalidate consent and package truth before dispatch can proceed; no downstream track may bypass that invalidation chain.
- Dispatch proof, outcome reconciliation, and bounce-back return truth remain separate owners across par_350, par_352, and par_353.
- Frontend tracks 356 to 365 may consume only the pharmacy truth projections explicitly mapped here; they may not derive state from browser-local timers or booleans.
- seq_366 and seq_367 remain deferred until lawful operator evidence replaces the inherited manual-bridge boundaries from 341.
- Large Vite bundle warnings remain visible carry-forward debt for frontend and final proof tracks; do not reinterpret them as release clearance.
- No blocked or deferred track may be reclassified without rerunning the 345 validator against the new upstream state.

## Repository-owned collisions resolved by 345

- `GAP345_001`: dispatch, outcome, and bounce-back now have distinct typed owners.
- `GAP345_002`: frontend tracks now have explicit backend truth dependencies instead of inferred booleans.
- `GAP345_003`: invalidation chains are now explicit and machine-readable.
- `GAP345_006`: frontend checklist labels for `356` to `363` were corrected to match the actual prompt files and shared contract.

## Still-open inherited constraints

- BLK341_001: Release-scoped clinical-safety delta is still missing from the executable Phase 5 candidate
- BLK341_002: Rollback rehearsal evidence is still absent for the final Network Horizon candidate
- BLK341_003: The inherited interaction-support target has not been re-cleared for widened rollout claims
- BLK341_004: Live partner onboarding remains manual-bridge or review-required for routes and feeds

- CF341_001: Queue-side patient-choice expiry remains a typed fail-closed upstream gap
- CF341_002: Path-to-Live MESH mailbox administration remains a manual bridge
- CF341_003: Supported-test supplier portal onboarding and GP Connect INT promotion remain bounded operational reviews
- CF341_004: Secret rotation and credential stewardship remain out-of-repo operational controls
- CF341_005: The unsupported legacy shadow feed remains explicit and must stay non-routable
- CF341_006: Large Vite bundle warnings remain open frontend hygiene debt
