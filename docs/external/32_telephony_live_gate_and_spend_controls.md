        # 32 Telephony Live Gate And Spend Controls

        ## Summary

        - Current creation posture: `blocked`
        - Gate rows: `10`
        - Blocked gates: `5`
        - Review-required gates: `4`
        - Pass gates: `1`

        ## Section A — `Mock_now_execution`

        The mock lane exposes the future live-gate fields in read/write form, but it never mutates an external provider. Cost and spend controls are still visible so the team rehearses governance before live procurement begins.

        ## Section B — `Actual_provider_strategy_later`

        ### Required live env

        | env |
| --- |
| TELEPHONY_VENDOR_ID |
| TELEPHONY_NAMED_APPROVER |
| TELEPHONY_TARGET_ENVIRONMENT |
| TELEPHONY_CALLBACK_BASE_URL |
| TELEPHONY_RECORDING_POLICY_REF |
| TELEPHONY_NUMBER_PROFILE_REF |
| TELEPHONY_SPEND_CAP_GBP |
| TELEPHONY_WEBHOOK_SECRET_REF |
| ALLOW_REAL_PROVIDER_MUTATION |
| ALLOW_SPEND |

        ### Gate checklist

        | gate_id | status | class | summary | reason |
| --- | --- | --- | --- | --- |
| TEL_LIVE_GATE_PHASE0_EXTERNAL_READY | blocked | programme | Phase 0 external-readiness chain is still withheld. | Current baseline verdict remains withheld, so no live telephony mutation may start. |
| TEL_LIVE_GATE_VENDOR_APPROVED | review_required | vendor | The target vendor must be one of the task 031 telephony shortlist entries. | Shortlist exists, but a live target vendor has not been selected for mutation. |
| TEL_LIVE_GATE_WORKSPACE_OWNERSHIP | pass | governance | Owner and backup owner roles are already defined for telephony accounts and numbers. | Task 023 established owner and backup-owner roles for telephony secrets and number ranges. |
| TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK | review_required | security | Webhook base URLs, signature validation, replay defense, and endpoint mapping must be explicit. | The pack defines the model, but no live callback base URL or vault-backed secret set is yet approved. |
| TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED | review_required | safety | Recording retention, transcript floor, and missing-recording posture must be reviewed. | The retention and evidence-readiness model is defined but not approved for a real vendor environment. |
| TEL_LIVE_GATE_PROCUREMENT_AND_SPEND_AUTHORITY | blocked | commercial | Spend authority and procurement posture must be explicit before account or number creation. | Both shortlisted vendors make number creation a commercial action. |
| TEL_LIVE_GATE_NAMED_APPROVER | blocked | governance | A named approver is required before any real mutation path. | No named approver is currently bound to the telephony lane. |
| TEL_LIVE_GATE_ENVIRONMENT_TARGET | review_required | environment | The target environment must be explicit and not inferred from provider defaults. | The pack supports provider-like preprod and production, but no live target is approved. |
| TEL_LIVE_GATE_MUTATION_AND_SPEND_FLAGS | blocked | runtime_guard | Live mutation and spend flags remain false by default. | Real provider mutation stays fail-closed until explicit env gates are true. |
| TEL_LIVE_GATE_FINAL_POSTURE | blocked | final | Current real account and number creation posture is blocked. | The local lab is ready now, but live account creation remains blocked until all gates pass. |
