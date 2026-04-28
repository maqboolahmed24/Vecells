
# Phase 2 Mock-Now Vs Cross-Cutting Boundary

## Mock Now Execution

| Area | Mock-now truth |
| --- | --- |
| Auth and session | Callback, replay, nonce/state, session establishment, rotation, expiry, logout, identity mismatch, and same-shell recovery pass in seq_204. |
| Telephony | Webhook, IVR, recording custody, evidence readiness, and continuation grants pass in seq_205 using simulator-backed provider behavior. |
| Parity and repair | Wrong-patient hold/release and web-phone semantic parity pass in seq_206. |
| PDS and re-safety | Optional enrichment and duplicate follow-up re-safety pass in seq_207 without turning PDS into hidden truth. |

## Cross-Cutting Consumption In 209+

| Consumer track | May consume | May not redefine |
| --- | --- | --- |
| Patient backend/frontend | Identity binding truth, session truth, grant truth, same-shell return contracts, canonical request/status truth | Patient binding, session establishment, duplicate law, or safety preemption law |
| Support backend/frontend | Repair state, masking, subject-history, controlled resend, replay-diff, support ticket lineage | Patient request ownership, patient-visible truth, or grant widening |

## Actual Production Strategy Later

| Carry-forward item | Owner | Close condition |
| --- | --- | --- |
| Live NHS login credentialled callback and logout evidence | seq_209 | Credentialled NHS login environment executes the same callback, state, nonce, session, logout, and recovery suites without new local algorithm changes. |
| Live telephony, SMS, and email signal-provider webhook evidence | seq_209 | Live carrier and notification providers replay the 205 webhook, recording, readiness, and grant cases with unchanged acceptance rules. |
| Patient-account work consumes Phase 2 identity truth without redefining it | seq_209 | Seq_209 publishes the shared interface registry and merge gates for patient-account tasks 210-217. |
| Support surfaces consume repair, replay, and masking boundaries without owning patient truth | seq_209 | Seq_209 freezes support lineage, subject history, controlled resend, replay, masking, and read-only fallback seams. |
| Production clinical-safety, DSPT, and operational signoff remains later assurance work | seq_209 | Production release gate links DCB0129 hazard updates, DSPT evidence, live incident runbooks, rollback rehearsals, and deployer acceptance to the same Phase 2 truth set. |

The Phase 2 truth model is closed for local algorithm work. Later patient-account and support tasks are consumers of the same trust tuples, action-routing semantics, and recovery laws.
