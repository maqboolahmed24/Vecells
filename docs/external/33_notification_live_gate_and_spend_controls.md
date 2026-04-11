# 33 Notification Live Gate And Spend Controls

        Generated: `2026-04-10T09:52:31+00:00`
        Current live posture: `blocked`

        ## Section A — `Mock_now_execution`

        The mock studio exposes the full live gate model even though no real provider mutation is allowed. The operator can fill the dry-run fields, inspect required env vars, and see why the live submit button remains disabled.

        ## Section B — `Actual_provider_strategy_later`

        Real provider mutation must stay blocked unless all of the following are true:

        - provider is on the seq_031 shortlist
        - sender or domain ownership posture is explicit
        - signed webhook plus replay controls are ready
        - named approver and environment target are present
        - `ALLOW_REAL_PROVIDER_MUTATION=true`
        - `ALLOW_SPEND=true`

        The current live posture is still blocked because `phase0_entry_verdict = withheld`.

        ### Live Gates

        | Gate Id | Title | Status | Class |
| --- | --- | --- | --- |
| LIVE_GATE_NOTIFY_PHASE0_EXTERNAL_READY | Phase 0 external readiness | blocked | blocker |
| LIVE_GATE_NOTIFY_VENDOR_APPROVED | Shortlisted vendor selected | pass | governance |
| LIVE_GATE_NOTIFY_PROJECT_SCOPE | Project scope and environment split | review_required | configuration |
| LIVE_GATE_NOTIFY_SENDER_OWNERSHIP | Sender ownership pack | blocked | ownership |
| LIVE_GATE_NOTIFY_DOMAIN_VERIFICATION | Domain or sender verification evidence | blocked | ownership |
| LIVE_GATE_NOTIFY_WEBHOOK_SECURITY | Signed webhook and replay fence pack | blocked | security |
| LIVE_GATE_NOTIFY_REPAIR_POLICY | Controlled resend and repair policy | review_required | product_law |
| LIVE_GATE_NOTIFY_TEMPLATE_MIGRATION | Template migration plan | review_required | configuration |
| LIVE_GATE_NOTIFY_LOG_EXPORT | Log export and retention policy | review_required | assurance |
| LIVE_GATE_NOTIFY_APPROVER_AND_ENV | Named approver and target environment | review_required | governance |
| LIVE_GATE_NOTIFY_MUTATION_AND_SPEND_FLAGS | Mutation and spend flags | blocked | spend |
| LIVE_GATE_NOTIFY_FINAL_POSTURE | Final live posture | blocked | final |

        ### Required Environment Variables

        - `NOTIFICATION_VENDOR_ID`
- `NOTIFICATION_NAMED_APPROVER`
- `NOTIFICATION_TARGET_ENVIRONMENT`
- `NOTIFICATION_PROJECT_SCOPE`
- `NOTIFICATION_CALLBACK_BASE_URL`
- `NOTIFICATION_WEBHOOK_SECRET_REF`
- `NOTIFICATION_SENDER_REF`
- `ALLOW_REAL_PROVIDER_MUTATION`
- `ALLOW_SPEND``
