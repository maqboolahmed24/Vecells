# 363 Algorithm Alignment Notes

## Projection mapping

`par_363` keeps the queue and workbench tied to the frozen Phase 6 backend projection family.

### Queue scanning

- `PharmacyConsoleWorklistProjection` is the primary source for queue membership and queue summary
- `PharmacyProviderHealthProjection` provides degraded or outage posture
- `PharmacyDispatchExceptionProjection` keeps transport failure, handoff blockage, and waiting debt explicit
- row indicators map directly from `PharmacyOperationsStateRef`, not from local filter heuristics

### Case workbench

- `PharmacyCaseWorkbenchProjection` owns the dominant action, checkpoint context, current provider, pathway, due posture, and current support-region intent
- `MedicationValidationProjection` owns line-level validation, stock risk, checkpoint summary, and the one-expanded-line posture
- `InventoryTruthProjection` is the same-shell grounding surface for the case route and the inventory route

### Support regions

- `InventoryComparisonProjection` owns compare candidates, substitution consequences, and partial-supply math
- `PharmacyHandoffProjection` owns the same-shell handoff board
- `PharmacyActionSettlementProjection` and `PharmacyConsoleContinuityEvidenceProjection` keep release posture provisional until settlement and continuity align

## Queue-state mapping

| operational state | workbench effect | proof case |
| --- | --- | --- |
| `active_case` | row remains visible in the main worklist and can morph into the case workbench | `PHC-2048` |
| `waiting_for_patient_choice` | row tone becomes review and the workbench starts from choice-sensitive validation | `PHC-2232` |
| `waiting_for_outcome` | row remains operationally open without implying completion | `PHC-2057` |
| `bounce_back` | row remains explicit and is handed off to the assurance/recovery family | `PHC-2103` |
| `transport_failure` | row becomes blocked and handoff posture remains explicit | `PHC-2072` |
| `provider_outage` | provider-health outage blocks handoff and keeps the watch banner active | `PHC-2244` |
| `validation_due` | queue and validation board stay aligned on the next safe action | `PHC-2232` |
| `stock_risk` | the shell promotes inventory comparison instead of implying release readiness | `PHC-2124` |
| `handoff_blocked` | release posture stays bounded to the handoff board and dock | `PHC-2244` |

## Support-region law

- `lane` promotes `operations_queue`
- `case` promotes `inventory_truth`
- `validate` promotes `eligibility_evidence` only when the 357 preview exists, otherwise `inventory_truth`
- `inventory` promotes `inventory_comparison`
- `handoff` promotes `handoff_readiness`
- `resolve` promotes `outcome_truth`
- `assurance` is delegated to `361` or `362`

Only one support region auto-promotes at a time in the normal case. The 363 proof battery checks that inventory comparison does not remain active when the route promotes handoff readiness.

## Continuity and refresh

The current shell persists:

- `selectedCaseId`
- `activeCheckpointId`
- `activeLineItemId`
- `scrollY`

The persistence key is route-specific, so refresh restores only the lawful state for the current shell pathname. This is intentionally bounded and recorded in `PHASE6_BATCH_356_363_INTERFACE_GAP_PHARMACY_WORKBENCH.json` until a backend-owned route bundle replaces the seed-backed resolver.
