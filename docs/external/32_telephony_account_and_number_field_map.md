        # 32 Telephony Account And Number Field Map

        ## Summary

        - Total fields: `33`
        - Mock-required fields: `7`
        - Live-required fields: `29`

        ## Section A — `Mock_now_execution`

        Shared mock-now controls still matter because the mock lab is not a toy stub. The same number profile, recording policy, webhook base, and secret-ref surfaces must exist locally so the lab preserves the eventual live contract shape.

        ### Shared telephony fields

        | field_id | canonical_label | value_kind | required_in_mock | required_in_live | notes |
| --- | --- | --- | --- | --- | --- |
| FLD_SHARED_VENDOR_ID | Approved telephony vendor | enum | no | yes | Must be one of the task 031 shortlisted vendors and never a non-shortlisted suite. |
| FLD_SHARED_NAMED_APPROVER | Named approver | string | no | yes | Required before any real portal step or billable number action. |
| FLD_SHARED_TARGET_ENVIRONMENT | Target environment | enum | yes | yes | Values are `local_mock`, `provider_like_preprod`, or `production`; live starts blocked while Phase 0 is withheld. |
| FLD_SHARED_CALLBACK_BASE_URL | Callback base URL | uri | yes | yes | All provider callbacks land on internal endpoints before becoming canonical telephony events. |
| FLD_SHARED_RECORDING_POLICY | Recording policy | enum | yes | yes | Recording policy is distinct from evidence readiness and must point to a reviewed retention posture. |
| FLD_SHARED_NUMBER_PROFILE | Number profile | enum | yes | yes | Ties one number choice to IVR, recording, webhook, and urgent-preemption semantics. |
| FLD_SHARED_WEBHOOK_SECRET_REF | Webhook secret ref | secret_ref | yes | yes | Secret handle only. Real secrets never enter repo or traces. |
| FLD_SHARED_SPEND_CAP_GBP | Spend cap (GBP) | decimal | yes | yes | A real purchase path remains blocked without an explicit spend cap and approver. |
| FLD_SHARED_ALLOW_MUTATION | Allow real provider mutation | boolean | no | yes | Hard gate for any live vendor mutation path. |
| FLD_SHARED_ALLOW_SPEND | Allow spend | boolean | no | yes | Hard gate for number purchase, reservation, or other billable actions. |

        ## Section B — `Actual_provider_strategy_later`

        ### Twilio-later field map

        | field_id | provider_field_name | canonical_label | required_in_live | live_surface | notes |
| --- | --- | --- | --- | --- | --- |
| FLD_TWILIO_SUBACCOUNT_NAME | subaccount_name | Twilio subaccount name | yes | Twilio Console or Subaccounts API | Use a bounded-purpose subaccount per environment or rehearsal lane. |
| FLD_TWILIO_API_KEY_REF | api_key_ref | Twilio API key ref | yes | Twilio Console or Key API | Prefer restricted keys rather than long-lived Auth Token use. |
| FLD_TWILIO_AUTH_TOKEN_REF | auth_token_ref | Twilio Auth Token ref | review_only | Twilio Console | Auth Token use is permitted for local testing but is not the preferred production posture. |
| FLD_TWILIO_REGION | region_profile | Twilio region profile | review_only | Twilio IAM regional profile | API credentials are region-specific when Twilio Regions are enabled. |
| FLD_TWILIO_VOICE_URL | VoiceUrl | Twilio Voice URL | yes | IncomingPhoneNumber config | Receives the initial TwiML or adapter callback for inbound voice. |
| FLD_TWILIO_VOICE_FALLBACK_URL | VoiceFallbackUrl | Twilio Voice fallback URL | review_only | IncomingPhoneNumber config | Failure posture for answer URL retrieval remains explicit rather than hidden provider behavior. |
| FLD_TWILIO_STATUS_CALLBACK | StatusCallback | Twilio status callback | yes | IncomingPhoneNumber config | Delivery callbacks remain transport evidence only until Vecells settlement logic runs. |
| FLD_TWILIO_RECORDING_CALLBACK | recording_status_callback | Twilio recording status callback | yes | Voice application or number config | Recording availability transitions must never be flattened into call success. |
| FLD_TWILIO_AVAILABLE_FILTER | available_phone_number_filter | Twilio number search filter | yes | AvailablePhoneNumber Local resource | Filter by geography, pattern, and capability before purchase. |
| FLD_TWILIO_NUMBER_SID | incoming_phone_number_sid | Twilio number SID | yes | IncomingPhoneNumber resource | Delete or release operations key off this identifier. |
| FLD_TWILIO_CAPABILITY_FLAGS | capabilities | Twilio capability flags | yes | IncomingPhoneNumber resource | Voice and SMS capabilities stay distinct so telephony and continuation are not conflated. |

        ### Vonage-later field map

        | field_id | provider_field_name | canonical_label | required_in_live | live_surface | notes |
| --- | --- | --- | --- | --- | --- |
| FLD_VONAGE_ACCOUNT_OWNER | account_owner | Vonage account owner | yes | Vonage dashboard | Vonage account creation yields API key and secret for the initial owner. |
| FLD_VONAGE_API_KEY_REF | api_key_ref | Vonage API key ref | yes | Vonage dashboard | Generated at account creation; never stored in repo. |
| FLD_VONAGE_API_SECRET_REF | api_secret_ref | Vonage API secret ref | yes | Vonage dashboard | Paired with the API key and kept under the same dual-control policy. |
| FLD_VONAGE_APPLICATION_ID | app_id | Vonage application id | yes | Application API | Binds numbers, security config, and callbacks to one application record. |
| FLD_VONAGE_PRIVATE_KEY_REF | private_key_ref | Vonage private key ref | yes | Application API | Application-level voice auth depends on a private key that stays vault-backed. |
| FLD_VONAGE_ANSWER_URL | answer_url | Vonage answer URL | yes | Application voice config | Returns NCCO for inbound voice and IVR flow selection. |
| FLD_VONAGE_EVENT_URL | event_url | Vonage event URL | yes | Application voice config | Receives call status information and remains weaker than authoritative request settlement. |
| FLD_VONAGE_FALLBACK_ANSWER_URL | fallback_answer_url | Vonage fallback answer URL | review_only | Application voice config | Required to make the fallback and degraded-mode posture explicit rather than implicit. |
| FLD_VONAGE_VOICE_STATUS_CALLBACK | voiceStatusCallback | Vonage number status callback | yes | Numbers API update | Configured per number to receive call-end status information. |
| FLD_VONAGE_MSISDN | msisdn | Vonage MSISDN | yes | Numbers API | Referenced for buy, cancel, and update operations. |
| FLD_VONAGE_NUMBER_SEARCH | search_available_numbers | Vonage number search filter | yes | Numbers API | Search precedes buy and remains a distinct, reviewable choice. |
| FLD_VONAGE_RENT_NUMBER_CREDIT | credit_loaded_before_number_rent | Vonage credit loaded | yes | Vonage dashboard and live gate form | Vonage requires credit before renting a number, making spend control explicit. |
