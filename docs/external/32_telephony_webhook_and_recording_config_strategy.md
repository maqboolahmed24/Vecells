        # 32 Telephony Webhook And Recording Config Strategy

        ## Summary

        - Webhook rows: `10`
        - Recording policies: `4`
        - IVR profiles: `4`

        ## Section A — `Mock_now_execution`

        The local carrier keeps answer, status, recording, transcript, and continuation hooks as separate rows so transport acceptance, recording arrival, transcript derivation, and SMS dispatch never collapse into one generic success badge.

        ### Webhook matrix

        | webhook_row_id | provider_vendor | endpoint_kind | signature_scheme | retry_profile | authoritative_truth_note |
| --- | --- | --- | --- | --- | --- |
| HOOK_MOCK_ANSWER | Vecells Internal Voice Twin | answer_or_route_intake | vecells-hmac-sha256 | immediate_plus_15s_plus_90s | Generates canonical telephony event only. Never implies evidence ready. |
| HOOK_MOCK_STATUS | Vecells Internal Voice Twin | call_status | vecells-hmac-sha256 | duplicate_and_disorder_fixture_enabled | Transport or call-end status does not settle callback or request truth. |
| HOOK_MOCK_RECORDING | Vecells Internal Voice Twin | recording_status | vecells-hmac-sha256 | 15s_plus_120s | Recording availability is weaker than evidence readiness. |
| HOOK_MOCK_TRANSCRIPT | Vecells Internal Voice Twin | transcript_hook | vecells-hmac-sha256 | 60s_plus_manual_replay | Transcript results are derivations and never replace source audio. |
| HOOK_MOCK_CONTINUATION | Vecells Internal Signal Fabric | continuation_sms_dispatch | vecells-hmac-sha256 | single_retry_then_repair_queue | Dispatch acknowledgement does not prove patient redemption. |
| HOOK_TWILIO_VOICE_URL | Twilio | voice_url | X-Twilio-Signature | provider-managed-plus-adapter-dedupe | Twilio voice callbacks feed canonical events only after adapter validation. |
| HOOK_TWILIO_RECORDING | Twilio | recording_status_callback | X-Twilio-Signature | provider-managed-plus-adapter-dedupe | Recording events update availability, not request completion. |
| HOOK_VONAGE_ANSWER_EVENT | Vonage | answer_and_event | application-signature-plus-jwt-posture | provider-timeout-plus-adapter-dedupe | Answer and event callbacks remain transport observations until Vecells settlement occurs. |
| HOOK_VONAGE_NUMBER_STATUS | Vonage | voice_status_callback | application-signature-plus-jwt-posture | provider-managed | Call-end status is weaker than callback resolution or intake promotion. |
| HOOK_VONAGE_RECORD_EVENT | Vonage | record_event_url | application-signature-plus-jwt-posture | provider-managed | Recording callbacks widen artefact availability but do not establish routine readiness. |

        ### Recording policies

        | recording_policy_ref | label | retention_class | transcript_floor | manual_review_trigger |
| --- | --- | --- | --- | --- |
| rec_default_dual_channel | Default dual-channel recording | telephony_sensitive_audio_nonprod_30d | keyword_or_partial_then_manual_if_needed | contradictory_capture_or_identity_drift |
| rec_urgent_immediate_fetch | Urgent immediate fetch | urgent_live_audio_locked_until_review | partial_allowed_but_urgent_live_can_open_first | recording_missing_or_live_handoff_gap |
| rec_callback_summary_only | Callback summary only | support_callback_audio_short_retention | summary_stub_only | outcome_dispute_or_route_repair |
| rec_missing_blocks_routine | Missing recording blocks routine | missing_recording_incident_register | none | recording_missing |

        ## Section B — `Actual_provider_strategy_later`

        Official provider grounding used for later execution:

        | source_id | vendor | title | url |
| --- | --- | --- | --- |
| twilio_api_keys_overview | Twilio | API keys overview | Twilio | https://www.twilio.com/docs/iam/api-keys |
| twilio_subaccounts | Twilio | REST API: Subaccounts | Twilio | https://www.twilio.com/docs/iam/api/subaccounts |
| twilio_webhooks_security | Twilio | Webhooks security | Twilio | https://www.twilio.com/docs/usage/webhooks/webhooks-security |
| twilio_incoming_phone_numbers | Twilio | IncomingPhoneNumber resource | Twilio | https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource |
| twilio_available_phone_numbers | Twilio | AvailablePhoneNumber Local resource | Twilio | https://www.twilio.com/docs/phone-numbers/api/availablephonenumberlocal-resource |
| twilio_recordings_resource | Twilio | Recordings resource | Twilio | https://www.twilio.com/docs/voice/api/recording |
| twilio_voice_pricing_gb | Twilio | Programmable Voice Pricing in United Kingdom | Twilio | https://www.twilio.com/en-us/voice/pricing/gb |
| vonage_voice_getting_started | Vonage | Getting Started with Voice API | Vonage | https://developer.vonage.com/en/voice/voice-api/getting-started |
| vonage_application_api_overview | Vonage | Application API Overview | Vonage | https://developer.vonage.com/en/application/overview |
| vonage_webhooks | Vonage | Webhooks | Vonage | https://developer.vonage.com/en/getting-started/concepts/webhooks |
| vonage_numbers_api | Vonage | Numbers API Reference | Vonage | https://developer.vonage.com/de/api/numbers |
| vonage_pricing | Vonage | API Pricing | Vonage | https://www.vonage.com/communications-apis/pricing/ |

        Twilio-later posture:

        - use subaccounts or equivalent bounded workspace segmentation
        - configure `VoiceUrl`, `VoiceFallbackUrl`, `StatusCallback`, and recording callbacks before any number purchase
        - prefer API keys over raw Auth Token for long-lived automation

        Vonage-later posture:

        - create one application that carries security plus callback configuration
        - wire `answer_url`, `event_url`, optional `fallback_answer_url`, and number-level `voiceStatusCallback`
        - treat `Buy a number` and `Cancel a number` as spend-bearing live mutations
