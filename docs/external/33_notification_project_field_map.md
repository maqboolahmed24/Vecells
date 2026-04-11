# 33 Notification Project Field Map

        Generated: `2026-04-10T09:52:31+00:00`

        The field map keeps provider-specific creation mechanics behind a common project contract so the studio and later dry-run harness share one schema.

        ## Coverage Summary

        - total rows: `44`
        - shared rows: `12`
        - Twilio SMS rows: `8`
        - Vonage SMS rows: `8`
        - Mailgun rows: `8`
        - SendGrid rows: `8`

        ## Section A — `Mock_now_execution`

        The mock studio consumes the shared rows plus placeholder sender/domain fields. Those rows are enough to render environment posture, route validation, webhook readiness, and live-gate explanations without touching a real provider.

        ## Section B — `Actual_provider_strategy_later`

        Provider-specific rows become active only when the live gates pass. That includes subaccounts, messaging-service names, application ids, verified domains, signed event-webhook references, and spend controls.

        ## Field Inventory

        | Field Id | Scope | Field | Mock | Actual |
| --- | --- | --- | --- | --- |
| FLD_SHARED_PROJECT_NAME | shared | project_name | yes | yes |
| FLD_SHARED_ENVIRONMENT_PROFILE | shared | environment_profile | yes | yes |
| FLD_SHARED_VENDOR_ID | shared | vendor_id | no | yes |
| FLD_SHARED_OWNER_ROLE | shared | owner_role | yes | yes |
| FLD_SHARED_BACKUP_OWNER_ROLE | shared | backup_owner_role | yes | yes |
| FLD_SHARED_NAMED_APPROVER | shared | named_approver | no | yes |
| FLD_SHARED_PROJECT_SCOPE | shared | project_scope | yes | yes |
| FLD_SHARED_CALLBACK_BASE_URL | shared | callback_base_url | yes | yes |
| FLD_SHARED_WEBHOOK_SECRET_REF | shared | webhook_secret_ref | yes | yes |
| FLD_SHARED_REPLAY_WINDOW_SECONDS | shared | replay_window_seconds | yes | yes |
| FLD_SHARED_TEMPLATE_REGISTRY_VERSION | shared | template_registry_version | yes | yes |
| FLD_SHARED_SPEND_CAP_GBP | shared | spend_cap_gbp | no | yes |
| FLD_TWILIO_SUBACCOUNT_NAME | twilio_sms | subaccount_name | no | yes |
| FLD_TWILIO_API_KEY_REF | twilio_sms | api_key_ref | no | yes |
| FLD_TWILIO_MESSAGING_SERVICE_NAME | twilio_sms | messaging_service_name | no | yes |
| FLD_TWILIO_MESSAGING_SERVICE_SID | twilio_sms | messaging_service_sid_placeholder | yes | yes |
| FLD_TWILIO_STATUS_CALLBACK_URL | twilio_sms | status_callback_url | yes | yes |
| FLD_TWILIO_INBOUND_WEBHOOK_URL | twilio_sms | inbound_webhook_url | yes | yes |
| FLD_TWILIO_TEST_CREDENTIAL_PROFILE | twilio_sms | test_credential_profile | yes | no |
| FLD_TWILIO_COST_CENTER_TAG | twilio_sms | cost_center_tag | no | yes |
| FLD_VONAGE_API_KEY_REF | vonage_sms | api_key_ref | no | yes |
| FLD_VONAGE_API_SECRET_REF | vonage_sms | api_secret_ref | no | yes |
| FLD_VONAGE_APPLICATION_NAME | vonage_sms | application_name | no | yes |
| FLD_VONAGE_APPLICATION_ID | vonage_sms | application_id_placeholder | yes | yes |

        The full machine-readable inventory is in `data/analysis/33_notification_project_field_map.json`.
