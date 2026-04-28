# Selected Anchor And Return Contract Manager

Task `par_108` publishes the shared continuity-memory subsystem for same-shell anchor preservation, return contracts, navigation-ledger persistence, explicit invalidation, and ordered restore.

## Scope

- Typed selected-anchor policies are published for all 19 current persistent-shell route families.
- Same-shell route adjacency is published for 99 route-family pairs.
- Restore order is explicit and machine-readable across 76 restore steps.
- Five scenario examples prove full restore, partial restore, read-only preserve, and recovery-required return.

## Shared Continuity Law

- Browser history is an input only; the source of truth is the typed `NavigationStateLedger`.
- Return semantics are anchored to the preserved `anchorTupleHash`, not to labels or scroll position alone.
- Invalidated anchors remain visible through a stub or acknowledgement gate before any safe fallback becomes dominant.
- Refresh and same-shell re-entry restore in the declared order: anchor, scroll, disclosure, then focus.

## Scenario Examples

- `SCN_PATIENT_CHILD_RETURN_FULL`: Requests keeps the original request anchor through the intake child route and restores it on return.
- `SCN_PATIENT_RECORD_RECOVERY_RETURN`: When record-follow-up continuity degrades, the shell keeps the departing record anchor visible as a stub and restores the nearest safe summary anchor.
- `SCN_WORKSPACE_QUIET_RETURN`: The workspace keeps the active queue row as the authoritative return target while the case canvas takes focus.
- `SCN_OPERATIONS_STALE_RETURN`: A cleared anomaly cannot silently disappear; the board keeps a stub and degrades to read-only preserve.
- `SCN_GOVERNANCE_DIFF_REPLACEMENT`: Replacing the active diff anchor with an approval target requires an explicit acknowledgement before the new anchor becomes dominant.

## Gap Resolutions

- `GAP_RESOLUTION_RETURN_POSTURE_PATIENT_RECORD_RECOVERY_V1`
- `GAP_RESOLUTION_SELECTED_ANCHOR_IDENTITY_OPERATIONS_WATCHPOINT_V1`
- `GAP_RESOLUTION_SELECTED_ANCHOR_IDENTITY_HUB_OPTION_V1`
- `GAP_RESOLUTION_SELECTED_ANCHOR_IDENTITY_GOVERNANCE_DIFF_V1`
- `GAP_RESOLUTION_SELECTED_ANCHOR_IDENTITY_PHARMACY_CHECKPOINT_V1`

## Follow-on Dependencies

- `FOLLOW_ON_DEPENDENCY_PATIENT_RECORD_FOLLOW_UP_CHILD_ROUTE_TASK_109`
- `FOLLOW_ON_DEPENDENCY_WORKSPACE_EVIDENCE_CLUSTER_RETURN_COPY_TASK_116`
- `FOLLOW_ON_DEPENDENCY_GOVERNANCE_APPROVAL_DRILL_ROUTE_TASK_119`
- `FOLLOW_ON_DEPENDENCY_PHARMACY_INTERVENTION_CHILD_ROUTE_TASK_120`
