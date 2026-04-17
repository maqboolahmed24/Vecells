# 205 Webhook Signature Event And Retry Matrix

## Webhook Integrity

| Case                            | Input                             | Edge result                  | Idempotency result   | Call-session effect         | Audit event                                   |
| ------------------------------- | --------------------------------- | ---------------------------- | -------------------- | --------------------------- | --------------------------------------------- |
| `TEL205_VALID_STATUS_CALLBACK`  | Correct signature status callback | accepted                     | new replay key       | advanced to `call_started`  | `telephony.webhook.accepted.v1`               |
| `TEL205_INVALID_SIGNATURE`      | Tampered signature                | rejected 401                 | no business key      | frozen                      | `telephony.webhook.invalid_signature.v1`      |
| `TEL205_MISSING_SIGNATURE`      | No signature header               | rejected 401                 | no business key      | frozen                      | `telephony.webhook.invalid_signature.v1`      |
| `TEL205_REPLAYED_SIGNATURE`     | Reused signature and payload      | blocked replay               | duplicate replay key | no second advance           | `telephony.webhook.replay_blocked.v1`         |
| `TEL205_DUPLICATE_EVENT_ID`     | Duplicate provider event id       | accepted as duplicate ack    | duplicate collapsed  | no duplicate state revision | `telephony.webhook.duplicate_collapsed.v1`    |
| `TEL205_OUT_OF_ORDER_SEQUENCE`  | Recording before call-start       | accepted then buffered       | pending replay       | buffered until bootstrap    | `telephony.webhook.disorder_buffered.v1`      |
| `TEL205_UNKNOWN_CALL_SESSION`   | Callback for unknown session      | accepted to quarantine       | no canonical advance | frozen pending correlation  | `telephony.webhook.unknown_session.v1`        |
| `TEL205_AFTER_TERMINAL_SESSION` | Callback after terminal session   | accepted to audit only       | terminal replay key  | terminal state preserved    | `telephony.webhook.after_terminal_ignored.v1` |
| `TEL205_MALFORMED_PAYLOAD`      | Invalid event payload             | rejected 400                 | no canonical event   | frozen                      | `telephony.webhook.malformed_rejected.v1`     |
| `TEL205_BURST_RETRY_BEHAVIOR`   | Provider retry burst              | one accepted, rest collapsed | retry window bounded | one worker advance          | `telephony.webhook.retry_collapsed.v1`        |

## IVR Gather And Call-Session Integrity

| Case                                 | Input                        | Expected transition                     | Deterministic rule                           |
| ------------------------------------ | ---------------------------- | --------------------------------------- | -------------------------------------------- |
| `TEL205_DTMF_CAPTURE`                | DTMF menu selection          | `menu_selected`                         | exact menu code stored once                  |
| `TEL205_SPEECH_CAPTURE`              | Speech capture               | `menu_selected`                         | transcript confidence recorded               |
| `TEL205_MIXED_CAPTURE_ALLOWED`       | DTMF and speech both present | `menu_selected`                         | explicit mixed-source parse posture          |
| `TEL205_PARTIAL_ENTRY_RETRY`         | Partial entry then retry     | `menu_retry_pending` to `menu_selected` | retry does not fork session                  |
| `TEL205_TIMEOUT_NO_INPUT`            | No input timeout             | `no_input_recovery`                     | callback or staff review is next-safe action |
| `TEL205_MENU_URGENT_PATH`            | Urgent branch                | `urgent_live_only`                      | urgent preemption blocks normal promotion    |
| `TEL205_MENU_NON_URGENT_PATH`        | Non-urgent branch            | `recording_expected`                    | readiness remains required                   |
| `TEL205_CALLER_RESTARTS_MENU`        | Restart command              | `menu_restarted`                        | prior capture superseded, not deleted        |
| `TEL205_HANGUP_BEFORE_COMPLETION`    | Hangup before completion     | `abandoned`                             | explicit abandonment settlement              |
| `TEL205_DUPLICATE_GATHER_SUBMISSION` | Duplicate gather callback    | duplicate collapsed                     | no menu history overwrite                    |

## Mock-Now Versus Live-Later

This matrix is mock-now and supported by local simulator signatures, repository-owned tests, and Playwright browser proof. Live-provider-later execution must preserve the same replay, disorder-buffer, terminal-state, continuation, grant, and IVR state-machine semantics.
