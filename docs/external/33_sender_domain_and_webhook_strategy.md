# 33 Sender Domain And Webhook Strategy

        Generated: `2026-04-10T09:52:31+00:00`

        Sender identity, domain posture, and webhook authenticity are separated deliberately:

        - SMS senders do not share the same ownership pack as email domains
        - email domain verification, suppression, and reply posture stay explicit
        - webhook authenticity and replay fences are designed before any live provider project is allowed to mutate

        ## Section A — `Mock_now_execution`

        The local studio uses placeholder senders and signed mock webhooks to exercise:

        - bounce and dispute rendering
        - suppression and unsubscribe handling
        - controlled resend and repair notice issuance
        - sender and route validation warnings without touching a real provider

        ## Section B — `Actual_provider_strategy_later`

        The live-later strategy keeps four distinct provider mechanics visible:

        - Twilio SMS: messaging services plus status callbacks
        - Vonage SMS: application-level callbacks plus signed requests
        - Mailgun email: subaccounts, sandbox or verified domains, and event webhooks
        - SendGrid email: subusers, domain authentication, signed event webhooks, and sandbox-mode limitations

        ### Sender And Domain Matrix

        | Identity Ref | Channel | Provider | Verification | Lane |
| --- | --- | --- | --- | --- |
| SND_SMS_LOCAL_PLACEHOLDER | sms | shared | seeded_placeholder | mock_now |
| SND_SMS_PREVIEW_PLACEHOLDER | sms | shared | placeholder_preview | mock_now |
| SND_SMS_TWILIO_PROVIDER | sms | twilio_sms | messaging_service_config_required | actual_later |
| SND_SMS_VONAGE_PROVIDER | sms | vonage_sms | application_and_sender_registration_required | actual_later |
| SND_SMS_SUPPORT_REPAIR | sms | shared | governed_manual_only | actual_later |
| SND_EMAIL_LOCAL_PLACEHOLDER | email | shared | seeded_placeholder | mock_now |
| SND_EMAIL_PREVIEW_PLACEHOLDER | email | shared | placeholder_preview | mock_now |
| DOM_EMAIL_MAILGUN_SANDBOX | email | mailgun_email | sandbox_domain_only | actual_later |
| DOM_EMAIL_MAILGUN_VERIFIED | email | mailgun_email | dns_verification_required | actual_later |
| WH_EMAIL_MAILGUN_SIGNED | email | mailgun_email | http_signing_key_required | actual_later |
| SND_EMAIL_SENDGRID_SINGLE_SENDER | email | sendgrid_email | single_sender_verification_required | actual_later |
| DOM_EMAIL_SENDGRID_AUTH | email | sendgrid_email | domain_auth_required | actual_later |
| WH_EMAIL_SENDGRID_SIGNED | email | sendgrid_email | signed_event_webhook_required | actual_later |
| SND_DUAL_SUPPORT_FALLBACK | dual_if_supported | shared | support_repair_only | actual_later |

        ### Current Official Guidance

        | Vendor | Family | Title | URL |
| --- | --- | --- | --- |
| Twilio | sms | Messaging Services | https://www.twilio.com/docs/messaging/services |
| Twilio | sms | Track outbound message status | https://www.twilio.com/docs/messaging/guides/track-outbound-message-status |
| Twilio | sms | Webhooks security | https://www.twilio.com/docs/usage/webhooks/webhooks-security |
| Twilio | sms | Twilio SMS pricing in United Kingdom | https://www.twilio.com/en-us/sms/pricing/gb |
| Vonage | sms | Before you begin with SMS | https://developer.vonage.com/en/messaging/sms/code-snippets/before-you-begin |
| Vonage | sms | Signing Messages | https://developer.vonage.com/en/getting-started/concepts/signing-messages |
| Vonage | sms | Webhooks | https://developer.vonage.com/en/getting-started/concepts/webhooks |
| Vonage | sms | Vonage SMS pricing | https://www.vonage.com/communications-apis/sms/pricing/ |
| Mailgun | email | Webhooks | https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks |
| Mailgun | email | Get webhook signing key | https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/account-management/get-v5-accounts-http_signing_key |
| Mailgun | email | Subaccounts | https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts |
| Mailgun | email | Sandbox Domain | https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox |
