# 115 Patient Nav Manifest And Return Contracts

## Primary nav manifest
| Section | Route entry | Selected anchor default | Return contract posture |
| --- | --- | --- | --- |
| Home | `/home` | `home-spotlight` or `home-next-step` | Return stays inside the shell and restores the current home mode. |
| Requests | `/requests` | `request-needs-attention` | Request detail returns to the currently selected request anchor. |
| Appointments | `/appointments` | `appointments-upcoming` | Read-only appointment review preserves the itinerary anchor. |
| Health record | `/records` | `record-summary` | Record follow-up returns to the record-origin summary list. |
| Messages | `/messages` | `messages-inbox` | Thread detail returns to the current thread or inbox anchor. |

## Child route adjacency
- `Requests -> Request detail`
  The route family remains `rf_patient_requests`; only the object focus changes.
- `Health record -> Record follow-up`
  The route family remains `rf_patient_health_record`; artifact context preserves the record-origin return target.
- `Messages -> Thread preview`
  The route family remains `rf_patient_messages`; local acknowledgement remains subordinate to authoritative reply state.
- `Messages -> Recovery`
  Recovery is adjacent and same-shell. It is a bounded downgrade, not a navigation escape hatch.
- `Home -> Embedded posture`
  Embedded posture stays under the patient shell while host capability gaps fail closed.

## Selected-anchor policy
- Anchor labels remain patient-readable and route-specific.
- Refresh restoration prefers the exact anchor, then the nearest safe anchor, then the route default.
- Same-shell route changes preserve the anchor whenever the owning route family law allows it.
- Recovery routes retain the last safe summary and the current continuity key instead of resetting shell context.

## Return-safe contracts
- Request detail keeps the request lineage visible and returns to the same request bucket/list context.
- Record follow-up keeps artifact summary parity, selected anchor, and return target visible together.
- Message threads preserve sender, thread summary, and route ownership when reply posture degrades.
- Embedded and secure-link recovery keep the patient in the same shell and refuse unsupported browser departure.

## DecisionDock alignment
`DecisionDock` stays quiet unless one dominant next action is truly lawful. When the tuple downgrades:
- live actions are replaced with truthful recovery language,
- read-only tuples keep summary review visible,
- recovery-only tuples promote only the bounded repair or return-safe next step.

