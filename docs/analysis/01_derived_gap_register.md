# Derived gap register

The registry converts 120 forensic findings into derived gap-closure rows and adds 10 explicit edge-case rows that the task prompt required to be surfaced even when scattered across multiple documents.

## Gap themes

| Theme | Finding count |
| --- | --- |
| booking and network coordination | 9 |
| continuity, support, and experience proof | 17 |
| cross-phase control hygiene | 41 |
| intake and identity integrity | 21 |
| pharmacy routing and reconciliation | 6 |
| runtime, release, and governance | 9 |
| safety, triage, and closure control | 17 |

## Mandatory edge-case coverage

| Requirement | Source block |
| --- | --- |
| `REQ-EDGE-VISIBILITY-PROJECTION-BEFORE-MATERIALIZATION` VisibilityProjectionPolicy must bind before patient or staff projections materialize | `phase-0-the-foundation-protocol.md` / 12.2 Field-level projection materialization rule |
| `REQ-EDGE-RELEASE-CHANNEL-TRUST-FENCE` Writable posture requires release freeze, channel freeze, and assurance trust compatibility | `phase-0-the-foundation-protocol.md` / 14.5 Promotion gate |
| `REQ-EDGE-IDENTITY-REPAIR-CASE` Wrong-patient correction must route through IdentityRepairCase | `phase-0-the-foundation-protocol.md` / 5.6 Wrong-patient correction algorithm |
| `REQ-EDGE-ACCEPTED-RETRY-RETURNS-PRIOR-RESULT` Accepted retry must return the prior accepted result | `phase-0-the-foundation-protocol.md` / 6.3B Replay return rule |
| `REQ-EDGE-ROUTE-INTENT-AND-SETTLEMENT` Post-submit mutation requires RouteIntentBinding plus authoritative command settlement | `phase-0-the-foundation-protocol.md` / 6.6 Scoped mutation gate |
| `REQ-EDGE-MATERIAL-DELTA-RE-SAFETY` Material delta evidence must trigger canonical re-safety | `phase-0-the-foundation-protocol.md` / 7.1B Canonical evidence assimilation and material-delta gate |
| `REQ-EDGE-URGENT-STATE-SEPARATION` urgent_diversion_required and urgent_diverted must remain distinct safety states | `phase-0-the-foundation-protocol.md` / 7.4 Safety outcomes |
| `REQ-EDGE-DUPLICATE-CLUSTER-REVIEW` Duplicate review must materialize as DuplicateCluster review work instead of silent merge | `phase-0-the-foundation-protocol.md` / 8.6 Review-required cluster handling |
| `REQ-EDGE-CHILD-CASE-AMBIGUITY-BLOCKS-CLOSURE` Child-case ambiguity must not prematurely close the parent request | `phase-0-the-foundation-protocol.md` / 9.6 Closure evaluation algorithm |
| `REQ-EDGE-FALLBACK-AFTER-ACCEPTED-PROGRESS` Accepted progress that later degrades must open fallback review instead of disappearing | `vecells-complete-end-to-end-flow.md` / Audited baseline introduction |

## Assumptions and risks

- `ASSUMPTION_001`: dependent task-consumer bands in the source manifest are inferred from the current checklist ranges and file scope, because later tasks have not yet produced finer-grained consumption maps.
- `ASSUMPTION_002`: supporting design references (`uiux-skill.md` and `ux-quiet-clarity-redesign.md`) inform interaction language but remain subordinate to canonical shell, accessibility, runtime, and phase contracts.
- `RISK_001`: later tasks may split or rename specific requirement rows once implementation evidence reveals finer bounded-context seams, but they should preserve the current source traceability and stable IDs whenever possible.

## Open conflicts

- No unresolved cross-source conflict was left implicit in this first-pass registry. Conflicts that remain are expected to surface in task 002 through the summary reconciliation matrix rather than through silent precedence drift.
