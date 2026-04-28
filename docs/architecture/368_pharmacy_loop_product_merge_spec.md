# 368 Pharmacy Loop Product Merge Spec

## Purpose

`seq_368` binds the Phase 6 pharmacy loop into the wider Vecells product so pharmacy work is no longer a side channel. The parent request, patient request detail, patient messages, patient pharmacy routes, staff-entry changed-since-seen surfaces, operations, support replay, and pharmacy console now read the same request-to-pharmacy lineage snapshots.

## Authoritative merge bindings

| Parent request | Pharmacy case | Merge state | Patient route | Message cluster | Ops visibility | Staff-entry posture |
| --- | --- | --- | --- | --- | --- | --- |
| `request_211_b` | `PHC-2057` | `dispatch_pending` | `/pharmacy/PHC-2057/status` | `cluster_368_pharmacy_pending` | none promoted | triage-created pharmacy continuation |
| `request_215_callback` | `PHC-2103` | `urgent_return` | `/pharmacy/PHC-2103/instructions` | `cluster_368_pharmacy_urgent_return` | `ops-route-pharmacy-2103` | urgent return / changed-since-seen |
| `request_215_closed` | `PHC-2196` | `completed` | `/pharmacy/PHC-2196/status` | `cluster_368_pharmacy_completed` | none promoted | settled record / calm completion |

## Merge law

1. The pharmacy loop keeps the parent request as the continuity anchor.
2. Request detail exposes the pharmacy child using existing Phase 6 pharmacy projections, not a new local status model.
3. Patient messages derive from the same authoritative merge snapshot used by request detail and pharmacy routes.
4. Staff-entry changed-since-seen and cross-domain cards use the same request ref, case id, notification state, and support replay summary as the parent request and messages.
5. Operations receives the urgent-return case as a first-class anomaly plus explicit service-health and cohort impact rows.
6. Support replay and audit summaries stay request-led; neither sees a second pharmacy-only history.

## Surface rules

### Patient request detail

- `request_211_b`, `request_215_callback`, and `request_215_closed` expose `linkedPharmacyCaseId`, `linkedPharmacyStatusLabel`, and `changedSinceSeenLabel`.
- Downstream child strips now render a dedicated pharmacy continuation card with merge state, notification posture, support replay summary, and audit summary.
- The request-lineage action target follows the pharmacy child route when a merged pharmacy continuation exists.

### Patient messages

- `cluster_368_pharmacy_pending`, `cluster_368_pharmacy_urgent_return`, and `cluster_368_pharmacy_completed` are projected from the same merge adapter.
- Conversation braid and message preview rows expose request anchor, pharmacy case id, and authoritative status.
- The “open request” action now returns to `/requests/:requestRef?origin=messages`, not to a non-existent conversation sub-route.

### Staff entry

- `CrossDomainTaskStrip` now carries request ref, pharmacy case id, authoritative notification state, and changed-since-seen metadata for the dominant pharmacy merge.
- Blocking and busy scenarios promote the reopened urgent-return lineage; quieter scenarios promote the triage-created pharmacy continuation.

### Operations

- `ops-route-pharmacy-2103` is now a ranked board anomaly.
- `svc_pharmacy_loop` service health and `cohort_pharmacy_reentry` cohort impact rows make the pharmacy loop visible in the ordinary ops board instead of only in the pharmacy console.

## Notification and status law

- Pending merge: patient message and browser status both say pending confirmation and forbid calm completion wording.
- Urgent return merge: patient and staff surfaces keep urgent-return / reopened-request language and preserve the original request anchor.
- Completed merge: patient message and browser status both say outcome recorded and only then allow calm settled copy.

## Reopen law

Urgent return never creates a detached pharmacy branch. `PHC-2103` stays bound to `request_215_callback`, the reopened anchor remains the same request ref, and support replay plus audit summaries continue to reference the parent request lineage.

## Proof scope

The merge is proven through:

- package and integration tests for request/message/ops/staff coherence
- Playwright proof for triage to pharmacy to request detail
- Playwright proof for notification and status coherence
- Playwright proof for reopen to triage and operations visibility
