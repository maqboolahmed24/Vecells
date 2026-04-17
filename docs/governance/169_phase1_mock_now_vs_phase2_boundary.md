# Phase 1 Mock-Now Vs Phase 2 Boundary

## Mock Now Execution

The approved baseline is the current simulator-backed public web intake flow:

| Area              | Mock-now truth                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Identity          | Anonymous public web intake plus sign-in uplift/recovery postures, not live NHS login                                          |
| Attachments       | Contract-faithful scanner/quarantine simulator and bounded malicious upload fixtures                                           |
| Notifications     | Local confirmation dispatch and provider simulator truth with queued, accepted, delivered, and authoritative outcome separated |
| Provider channels | No live GP/pharmacy/provider transport claim                                                                                   |
| Browser           | Same-shell web journey, receipt, tracking, recovery, accessibility, and resilience proof                                       |
| Performance       | Controlled local load and fault proof with machine-readable budgets                                                            |

## Actual Production Strategy Later

Phase 2 and later work must extend the same contracts without replacing the Phase 1 truth model:

| Deferred item                                  | Later phase rule                                                                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| NHS login and local sessions                   | Implement behind the Phase 2 trust kernel without collapsing authentication, patient linking, claim, grant, and session authority. |
| Telephony and SMS continuation                 | Converge into the same canonical submission promotion and receipt semantics.                                                       |
| Authenticated patient home and claim           | Preserve the Phase 1 receipt and minimal status envelope while adding ownership authority.                                         |
| Optional PDS enrichment                        | Remain feature-gated and non-authoritative until the patient-link contract allows it.                                              |
| Live provider onboarding and delivery evidence | Strengthen delivery proof without changing queued, accepted, delivered, or authoritative outcome meanings.                         |
| Production assurance signoff                   | Add live operational evidence without weakening fail-closed posture or exact-once law.                                             |

## Non-Blocking Rationale

The deferred work is not a Phase 1 blocker because Phase 1 scope is the simulator-first Red Flag Gate for public web intake. The deferred items are published in `data/analysis/169_phase1_open_items_and_phase2_carry_forward.json`, so they cannot be hidden inside general approval prose.
