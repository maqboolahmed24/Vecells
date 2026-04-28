# 363 Pharmacy Operations Panel And Workbench Spec

## Scope

`par_363` turns `/workspace/pharmacy` into the real Phase 6 operations workbench.

It covers:

- the scan-first pharmacy operations panel at the queue root
- row-to-workbench morph inside the existing pharmacy mission frame
- one dense `PharmacyCaseWorkbench` with one expanded medication card
- same-shell `InventoryTruthPanel`, `InventoryComparisonWorkspace`, and `HandoffReadinessBoard`
- stock-risk, waiting-state, outage, transport-failure, and handoff-blocked visibility
- continuity-safe refresh for the selected case, selected line, support region, and scroll position

It does not replace the backend projection contracts from `354` and `355`, patient pharmacy pages from `360`, or outcome/bounce-back assurance work from `361` and `362`.

## Authoritative surfaces

- `PharmacyOperationsPanel`
- `PharmacyOperationsQueueTable`
- `PharmacyCaseWorkbench`
- `MedicationValidationBoard`
- `InventoryTruthPanel`
- `InventoryComparisonWorkspace`
- `HandoffReadinessBoard`
- `PharmacyStockRiskChip`
- `PharmacyWatchWindowBanner`
- `PharmacyWorkbenchDecisionDock`

## Truth sources

The workbench is presentation-bound to the frozen backend projection family introduced by `354` and `355`:

- `PharmacyConsoleWorklistProjection`
- `PharmacyCaseWorkbenchProjection`
- `MedicationValidationProjection`
- `InventoryTruthProjection`
- `InventoryComparisonProjection`
- `PharmacyHandoffProjection`
- `PharmacyActionSettlementProjection`
- `PharmacyConsoleContinuityEvidenceProjection`
- `PharmacyProviderHealthProjection`
- `PharmacyDispatchExceptionProjection`

The browser may align and compose these fields for display density. It may not invent calmness, release readiness, or continuity validity from local click state.

## Same-shell law

- the queue root remains `/workspace/pharmacy`
- opening a row moves the route to `/workspace/pharmacy/:pharmacyCaseId` without leaving the pharmacy shell
- the queue spine, validation board, checkpoint rail, and sticky `DecisionDock` remain part of one shell family
- only one promoted support region is active in the normal case
- inventory comparison and handoff never become detached pages
- refresh may restore the current case, line item, support region, and scroll position only when the continuity binding for that route remains lawful

## Support-region contract

- queue root promotes `operations_queue`
- case route promotes `inventory_truth`
- validate route promotes `eligibility_evidence` when the 357 preview is present, otherwise `inventory_truth`
- inventory route promotes `inventory_comparison`
- handoff route promotes `handoff_readiness`
- resolve route promotes `outcome_truth`
- assurance route remains owned by `361` and `362`

## Operational scenarios

- `PHC-2232` proves waiting-for-patient-choice posture without hiding valid provider truth
- `PHC-2244` proves provider outage, handoff blockage, and watch-window escalation inside the same workbench
- `PHC-2124` proves stock-risk comparison and promoted inventory support-region work
- `PHC-2072` keeps transport failure and contradictory proof visible in the queue grammar

## Visual law

- visual mode name is `Pharmacy_Operations_Workbench`
- the queue stays slim and scannable rather than becoming a dashboard wall
- the validation board stays dominant at desktop widths
- the support region stays bounded so comparison and handoff do not crush the workbench
- the workbench uses quiet hierarchy, tabular numerics, and restrained risk colour

## Interface gap

`PHASE6_BATCH_356_363_INTERFACE_GAP_PHARMACY_WORKBENCH.json` records the remaining seam: the repo still binds a deterministic preview resolver over the frozen 354/355 projection contracts rather than a live runtime-fed pharmacy-console route bundle.

## Proof expectations

Playwright must prove that:

1. queue rows morph into the workbench without shell loss
2. selected case, line item, support region, and scroll position survive refresh on lawful routes
3. inventory comparison and handoff stay same-shell promoted support regions
4. only one support region auto-promotes at a time in the normal path
5. the desktop and narrow-screen workbench stay dense without horizontal overflow
