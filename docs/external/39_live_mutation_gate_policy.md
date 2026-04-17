        # 39 Live Mutation Gate Policy

        - Task: `seq_039`
        - Visual mode: `Provider_Control_Tower`

        ## Mock_now_execution

        Mock and dry-run browser automation use the live gate as a fail-closed rehearsal object. The same helper calls validate approver, environment, evidence freshness, and live intent even when the script stops before commit.

        ## Actual_provider_strategy_later

        Live-provider later execution must satisfy all of the following common rules before any sensitive action can proceed:

        - `LIVE_GATE_COMMON_NAMED_APPROVER`: Every live mutation requires a named approver bound to the exact environment target.
- `LIVE_GATE_COMMON_ENVIRONMENT_TARGET`: Every live mutation declares sandpit, integration, preprod, or production explicitly. Blank targets fail closed.
- `LIVE_GATE_COMMON_EVIDENCE_FRESHNESS`: Architecture, hazard, risk, procurement, or ownership evidence must be current within the provider profile freshness window.
- `LIVE_GATE_COMMON_EXPLICIT_LIVE_FLAG`: ALLOW_REAL_PROVIDER_MUTATION=true is mandatory for any real portal mutation.
- `LIVE_GATE_COMMON_NO_BLIND_RESUBMIT`: Non-idempotent mutations never auto-repeat. Ambiguity routes to reconciliation, not replay.
- `LIVE_GATE_COMMON_SECRET_SAFE_CAPTURE`: Screenshots, traces, HAR files, and logs stay blocked for secret-sensitive actions unless masking is proven and approved.

        Provider family profiles:

        | Family | Blocked gates | Review gates | Required env | Freshness window |
| --- | --- | --- | --- | --- |
| NHS login | 5 | 2 | NHS_LOGIN_NAMED_APPROVER, NHS_LOGIN_ENVIRONMENT_TARGET, ALLOW_REAL_PROVIDER_MUTATION | 21 days |
| GP systems / IM1 | 6 | 1 | ALLOW_REAL_PROVIDER_MUTATION, GP_PROVIDER_ARCHITECTURE_DIAGRAM_REF, GP_PROVIDER_BOOKING_MVP_REF, GP_PROVIDER_DATAFLOW_DIAGRAM_REF, GP_PROVIDER_ENVIRONMENT_TARGET, GP_PROVIDER_NAMED_APPROVER, GP_PROVIDER_SPONSOR_MODE, GP_PROVIDER_WATCH_REGISTER_ACK | 30 days |
| GP systems / IM1 | 7 | 2 | IM1_NAMED_APPROVER, IM1_ENVIRONMENT_TARGET, IM1_SPONSOR_NAME, IM1_COMMERCIAL_OWNER, ALLOW_REAL_PROVIDER_MUTATION | 30 days |
| PDS | 5 | 6 | PDS_NAMED_APPROVER, PDS_ENVIRONMENT_TARGET, PDS_ORGANISATION_ODS, PDS_USE_CASE_OWNER, ALLOW_REAL_PROVIDER_MUTATION | 30 days |
| MESH | 5 | 4 | MESH_NAMED_APPROVER, MESH_ENVIRONMENT_TARGET, MESH_MAILBOX_OWNER_ODS, MESH_MANAGING_PARTY_MODE, MESH_WORKFLOW_TEAM_CONTACT, MESH_API_ONBOARDING_COMPLETE, MESH_MINIMUM_NECESSARY_REVIEW_REF, ALLOW_REAL_PROVIDER_MUTATION, ALLOW_SPEND | 30 days |
| Telephony | 5 | 4 | TELEPHONY_VENDOR_ID, TELEPHONY_NAMED_APPROVER, TELEPHONY_TARGET_ENVIRONMENT, TELEPHONY_CALLBACK_BASE_URL, TELEPHONY_RECORDING_POLICY_REF, TELEPHONY_NUMBER_PROFILE_REF, TELEPHONY_SPEND_CAP_GBP, TELEPHONY_WEBHOOK_SECRET_REF, ALLOW_REAL_PROVIDER_MUTATION, ALLOW_SPEND | 14 days |
| Notification | 6 | 5 | NOTIFICATION_VENDOR_ID, NOTIFICATION_NAMED_APPROVER, NOTIFICATION_TARGET_ENVIRONMENT, NOTIFICATION_PROJECT_SCOPE, NOTIFICATION_CALLBACK_BASE_URL, NOTIFICATION_WEBHOOK_SECRET_REF, NOTIFICATION_SENDER_REF, ALLOW_REAL_PROVIDER_MUTATION, ALLOW_SPEND | 14 days |
| Evidence processing | 5 | 5 | EVIDENCE_PROVIDER_VENDOR_ID, EVIDENCE_PROJECT_SCOPE, EVIDENCE_TARGET_ENVIRONMENT, EVIDENCE_REGION_POLICY_REF, EVIDENCE_RETENTION_POLICY_REF, EVIDENCE_WEBHOOK_BASE_URL, EVIDENCE_WEBHOOK_SECRET_REF, EVIDENCE_STORAGE_BUCKET_REF, EVIDENCE_SCAN_POLICY_REF, EVIDENCE_NAMED_APPROVER, ALLOW_REAL_PROVIDER_MUTATION, ALLOW_SPEND | 14 days |
| Pharmacy | 7 | 1 | ALLOW_REAL_PROVIDER_MUTATION, PHARMACY_MVP_REF, PHARMACY_NAMED_APPROVER, PHARMACY_ROUTE_ATTEMPT, PHARMACY_RUNTIME_IMPLEMENTATION_REF, PHARMACY_TARGET_ENVIRONMENT, PHARMACY_UPDATE_RECORD_COMBINATION_REF, PHARMACY_URGENT_RETURN_REHEARSAL_REF, PHARMACY_WATCH_REGISTER_ACK | 14 days |
| NHS App | 6 | 6 | NHS_APP_NAMED_APPROVER, NHS_APP_ENVIRONMENT_TARGET, ALLOW_REAL_PROVIDER_MUTATION | 30 days |

        Guard-library contract:

        - `buildLiveMutationContext(profile, env, overrides)` normalises provider-specific environment bindings into one live-gate object.
        - `assertProviderActionAllowed(actionKey, context)` blocks unsafe retries, stale evidence, missing approval, or unapproved capture posture.
        - `nextRetryDecision(actionKey, attempt, outcome)` returns `retry`, `resume_from_checkpoint`, `human_review`, or `stop` so later scripts cannot collapse all failure modes into rerun.
