# 23 Credential Ingest And Redaction Runbook

        ## Section A — `Mock_now_execution`

        Mock capture is still audited. Seed material lands outside the repo, Playwright consumes brokered handles, and any screenshot or trace created during rehearsal must remain secret-free.

        ## Section B — `Actual_provider_strategy_later`

        Capture and ingest sequence:
        1. Confirm the target family, environment, named approver, and live gates before touching any provider portal or partner email.
2. Capture credentials or metadata only into the temporary quarantine or metadata review queue; never paste directly into the repo, chat, ticket text, or markdown.
3. Redact screenshots immediately and keep Playwright traces, videos, and console logs disabled unless the value path is demonstrably secret-free.
4. Ingest secret material into the correct vault or HSM path, then bind only the reference handle into runtime manifests or partner metadata registries.
5. Run post-ingest verification: ownership chain, gate references, redirect or endpoint parity, workload access policy, and audit-event emission.
6. Record rotation or revocation evidence in the external access lifecycle ledger and publish the updated runtime or metadata tuple only after approval.
7. On incident, revoke in the provider console first when necessary, rotate vault material second, invalidate runtime handles third, then append the incident evidence pack.

        Checklist excerpt:

        | Target | Family | Environment | Capture type | Landing zone |
| --- | --- | --- | --- | --- |
| ACC_BOOKING_SUPPLIER_INTEGRATION_PRINCIPAL | booking_supplier | integration | secret_capture | partner_capture_quarantine |
| ACC_EMAIL_PREPROD_PROJECT | email | preprod | secret_capture | partner_capture_quarantine |
| SEC_EMAIL_PRODUCTION_WEBHOOK | email | production | secret_capture | partner_capture_quarantine |
| ID_EMAIL_PRODUCTION_SENDER | email | production | metadata_capture | partner_metadata_review_queue |
| ACC_NHS_APP_SANDPIT_SITE_LINK | embedded_channel | sandpit | metadata_capture | partner_metadata_review_queue |
| ACC_IM1_PROGRAMME_INTEGRATION_ACCOUNT | gp_system | integration | metadata_capture | partner_metadata_review_queue |
| ACC_GP_SUPPLIER_INTEGRATION_PRINCIPAL | gp_system | integration | secret_capture | partner_capture_quarantine |
| KEY_GP_SUPPLIER_MTLS | gp_system | integration | secret_capture | partner_capture_quarantine |
| KEY_IM1_PROGRAMME_CERT | gp_system | integration | secret_capture | partner_capture_quarantine |
| USER_NHS_LOGIN_SHARED_DEV_TEST_SET | identity_auth | shared_dev | secret_capture | partner_test_pack_quarantine |
| PUB_NHS_LOGIN_SHARED_DEV_JWKS | identity_auth | shared_dev | metadata_capture | partner_metadata_review_queue |
| DATA_NHS_LOGIN_SHARED_DEV_FIXTURES | identity_auth | shared_dev | metadata_capture | partner_test_pack_quarantine |

        Browser-automation redaction law:
        - live dry runs default to no trace, no video, and redacted screenshots only
        - raw values may enter only brokered input channels and may never be echoed back into DOM assertions or logs
        - generated markdown and HTML stay placeholder-only even after a real capture session occurs
