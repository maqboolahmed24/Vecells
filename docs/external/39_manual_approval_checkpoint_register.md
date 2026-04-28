        # 39 Manual Approval Checkpoint Register

        - Task: `seq_039`
        - Visual mode: `Provider_Control_Tower`
        - Captured on: `2026-04-11`
        - Mission: Create one governed checkpoint and retry framework for provider and onboarding automation so mock-now rehearsals and actual-later portal work share the same evidence law, retry vocabulary, live-mutation fence, and secret-safe capture posture.

        ## Mock_now_execution

        The executable-now control model treats every provider and onboarding step as a bounded checkpoint with named evidence, retry posture, and redaction rules. The authoritative register lives in:

        - `/Users/test/Code/V/data/analysis/manual_approval_checkpoints.csv`
        - `/Users/test/Code/V/data/analysis/browser_automation_retry_matrix.json`
        - `/Users/test/Code/V/data/analysis/provider_portal_action_idempotency_rules.csv`
        - `/Users/test/Code/V/data/analysis/live_mutation_gate_rules.json`

        Current coverage:

        - Checkpoints: `23`
        - Human-review checkpoints: `4`
        - Never-auto-repeat checkpoints: `4`
        - Unresolved live blockers across provider packs: `57`

        Each row below closes the "manual approval exists somewhere else" gap by naming the evidence, retry class, and live posture explicitly.

        | Checkpoint | Family | Class | Evidence | Live posture |
| --- | --- | --- | --- | --- |
| CHK_001 | NHS login | safe_read_retry | gate_snapshot | pass |
| CHK_002 | NHS login | human_review | review_reference | review_required |
| CHK_003 | NHS login | redacted_only | vault_receipt | blocked |
| CHK_004 | GP systems / IM1 | safe_read_retry | gate_snapshot | pass |
| CHK_005 | GP systems / IM1 | resume_only | checkpoint_receipt | review_required |
| CHK_006 | GP systems / IM1 | human_review | review_reference | blocked |
| CHK_007 | GP systems / IM1 | capture_stop | review_reference | blocked |
| CHK_008 | GP systems / IM1 | never_auto_repeat | provider_receipt | blocked |
| CHK_009 | PDS | resume_only | checkpoint_receipt | review_required |
| CHK_010 | PDS | human_review | review_reference | blocked |
| CHK_011 | MESH | resume_only | checkpoint_receipt | review_required |
| CHK_012 | MESH | never_auto_repeat | provider_receipt | blocked |
| CHK_013 | Telephony | resume_only | checkpoint_receipt | review_required |
| CHK_014 | Telephony | never_auto_repeat | provider_receipt | blocked |
| CHK_015 | Notification | resume_only | checkpoint_receipt | review_required |
| CHK_016 | Notification | capture_stop | review_reference | blocked |
| CHK_017 | Evidence processing | resume_only | checkpoint_receipt | review_required |
| CHK_018 | Evidence processing | redacted_only | vault_receipt | blocked |
| CHK_019 | Pharmacy | safe_read_retry | gate_snapshot | pass |
| CHK_020 | Pharmacy | never_auto_repeat | provider_receipt | blocked |
| CHK_021 | Pharmacy | capture_stop | review_reference | blocked |
| CHK_022 | NHS App | resume_only | checkpoint_receipt | review_required |
| CHK_023 | NHS App | human_review | review_reference | blocked |

        ## Actual_provider_strategy_later

        The live-provider lane keeps one shared human approval taxonomy for all current provider and onboarding work. Every live mutation stays fail-closed until named approver, environment target, fresh evidence, and explicit live intent exist together.

        | Lane | Meaning |
| --- | --- |
| Legal / governance | Legal basis, governance approval, or feature-flag review before the step can widen beyond mock posture. |
| Sponsor / commercial | Named sponsor, commissioner, or commercial owner confirms the bounded MVP and supplier posture. |
| Signatory | Human-only legal or organisational signatory handoff outside the repo and outside browser automation. |
| Environment approval | A named approver binds the action to sandpit, integration, preprod, or production before mutation is allowed. |
| Vendor service desk | Supplier-side mailbox, workflow, number, sender, or account steps need later human liaison or service-desk handling. |
| Safety / privacy assurance | Hazard logs, risk logs, minimum-necessary review, or accessibility/service evidence must be current and approved. |
| Ownership / rehearsal | Operational ownership, incident path, or urgent manual fallback must be rehearsed before live widening. |

        Live-provider later rules:

        - No checkpoint may infer completion from page navigation or button-click success alone.
        - Non-idempotent steps route to reconciliation, not blind re-submission.
        - Signatory, legal, sponsor, commissioner, and vendor-service-desk steps remain human-owned even when a browser script prepared the pack.
        - Secret-sensitive steps require vault or quarantine receipts instead of raw screenshots, traces, HAR files, or logs.
