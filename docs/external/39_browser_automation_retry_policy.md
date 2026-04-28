        # 39 Browser Automation Retry Policy

        - Task: `seq_039`
        - Visual mode: `Provider_Control_Tower`

        ## Mock_now_execution

        The retry matrix defines six canonical classes. They close the "retry equals rerun" gap by separating read-only retry, checkpoint resume, review-gated continuation, capture-and-stop, never-repeat mutation, and secret-safe handling.

        | Class | Completion evidence | Insufficient evidence | Max auto retries | Capture posture | Live reuse |
| --- | --- | --- | --- | --- | --- |
| safe_read_retry | A fresh gate snapshot or official label match proves completion. | Page load, HTTP 200, or button visibility alone are insufficient. | 2 | masked_stills_allowed / trace_allowed_without_secrets | yes |
| resume_only | A stable draft id or checkpoint receipt proves where resume may start. | Filling the same fields again without a checkpoint token is insufficient. | 0 | masked_stills_allowed_before_commit / trace_until_checkpoint_only | yes |
| human_review | A named review reference tied to the next intended mutation proves completion. | Internal confidence or green UI state without reviewer identity is insufficient. | 0 | masked_stills_only / trace_disabled_by_default | yes |
| capture_stop | A safe evidence bundle and handoff record prove the automation did enough. | A screenshot without approval context or redaction proof is insufficient. | 0 | only_masked_approved_stills / trace_off_har_off | yes |
| never_auto_repeat | Only the first provider receipt or ticket id can prove completion. | Button-click success or page refresh after submit are insufficient. | 0 | no_commit_screenshots_without_approval / trace_off_har_off | yes |
| redacted_only | A vault receipt or quarantined masked evidence handle proves completion. | Clipboard copies, raw traces, HAR files, or unmasked screenshots are insufficient. | 0 | redaction_proven_then_masked_stills_only / trace_off_har_off_console_scrubbed | yes |

        ## Actual_provider_strategy_later

        The same vocabulary governs later live-provider scripts. Any non-idempotent action is either human-gated, capture-and-stop, secret-handled, or never-auto-repeat. No live mutation may quietly downgrade into a generic rerun.

        | Action | Stage | Retry | Idempotency | Blind resubmit |
| --- | --- | --- | --- | --- |
| Review NHS login partner application route | read | safe_read_retry | read_only | yes |
| Approve redirect and scope registration pack | review | human_review | review_checkpoint | no |
| Promote NHS login credentials into vault-handled storage | verify | redacted_only | secret_material_handling | no |
| Review GP provider path evidence and shortlist posture | read | safe_read_retry | read_only | yes |
| Resume IM1 prerequisite dossier drafting | fill | resume_only | draft_resume_safe | no |
| Review IM1 supported-test admissibility | review | human_review | review_checkpoint | no |
| Capture IM1 signatory handoff evidence and stop | verify | capture_stop | review_checkpoint | no |
| Submit IM1 provider request once | commit | never_auto_repeat | non_idempotent_mutation | no |
| Resume PDS use-case and risk-pack drafting | fill | resume_only | draft_resume_safe | no |
| Review PDS legal basis and feature-flag approval | review | human_review | review_checkpoint | no |
| Resume MESH mailbox application drafting | fill | resume_only | draft_resume_safe | no |
| Submit MESH workflow request once | commit | never_auto_repeat | non_idempotent_mutation | no |
| Resume telephony account and number plan drafting | fill | resume_only | draft_resume_safe | no |
| Purchase or bind a telephony number once | commit | never_auto_repeat | non_idempotent_mutation | no |
| Resume notification project and sender draft | fill | resume_only | draft_resume_safe | no |
| Capture sender or domain verification evidence and stop | verify | capture_stop | review_checkpoint | no |
| Resume evidence-processing provider draft | fill | resume_only | draft_resume_safe | no |
| Capture evidence-processing webhook secret handling safely | verify | redacted_only | secret_material_handling | no |
| Review pharmacy directory and access path evidence | read | safe_read_retry | read_only | yes |
| Commit a pharmacy dispatch route once | commit | never_auto_repeat | non_idempotent_mutation | no |
| Capture urgent-return rehearsal evidence and stop | verify | capture_stop | review_checkpoint | no |
| Resume NHS App EOI and environment pack drafting | fill | resume_only | draft_resume_safe | no |
| Review NHS App commissioning and assurance gate | review | human_review | review_checkpoint | no |

        Additional live-provider rules:

        - `safe_read_retry` is the only class that permits automatic retry.
        - `resume_from_checkpoint_only` requires a stable draft or checkpoint receipt; replay from the beginning is forbidden.
        - `human_review_before_continue`, `capture_evidence_then_stop`, `never_auto_repeat`, and `secrets_redacted_only` all require stop-and-review posture before the next mutation.
        - Secret-sensitive classes keep trace and HAR capture off by default and treat vault receipts as the only acceptable completion proof.
