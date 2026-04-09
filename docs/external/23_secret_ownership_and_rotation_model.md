# 23 Secret Ownership And Rotation Model

        This model separates partner-console metadata from runtime secret material, then assigns owner, backup owner, creator, and approver chains before any account or credential enters the system.

        ## Owner Chain Matrix

        | Family | Owner | Backup owner | Creator | Approver | Representative gates |
| --- | --- | --- | --- | --- | --- |
| Booking supplier boundary | ROLE_BOOKING_DOMAIN_LEAD | ROLE_INTEROPERABILITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_GOVERNANCE_LEAD | GATE_EXTERNAL_TO_FOUNDATION, LIVE_GATE_SUPPLIER_CAPABILITY_REVIEW |
| Email and secure-link notification rail | ROLE_COMMUNICATIONS_PLATFORM_LEAD | ROLE_SUPPORT_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_SECURITY_LEAD | GATE_EXTERNAL_TO_FOUNDATION, LIVE_GATE_VENDOR_SENDER_REVIEW |
| Deferred NHS App embedded channel | ROLE_EMBEDDED_CHANNEL_LEAD | ROLE_SECURITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_GOVERNANCE_LEAD | LIVE_GATE_NHS_APP_DEFERRED_ONLY |
| GP system and IM1 programme boundary | ROLE_INTEROPERABILITY_LEAD | ROLE_SECURITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_GOVERNANCE_LEAD | GATE_EXTERNAL_TO_FOUNDATION, LIVE_GATE_IM1_SCAL_APPROVED |
| NHS login identity rail | ROLE_IDENTITY_PARTNER_MANAGER | ROLE_SECURITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_INTEROPERABILITY_LEAD | GATE_EXTERNAL_TO_FOUNDATION, LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED |
| Artifact scanning provider | ROLE_SECURITY_LEAD | ROLE_OPERATIONS_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_SECURITY_LEAD | GATE_EXTERNAL_TO_FOUNDATION, LIVE_GATE_TRANSCRIPT_SAFETY_REVIEW |
| Cross-organisation messaging transport | ROLE_INTEROPERABILITY_LEAD | ROLE_SECURITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_OPERATIONS_LEAD | GATE_EXTERNAL_TO_FOUNDATION, LIVE_GATE_CROSS_ORG_TRANSPORT_APPROVED |
| Future-optional assistive vendor boundary | ROLE_AI_GOVERNANCE_LEAD | ROLE_SECURITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_DPO | LIVE_GATE_ASSISTIVE_INTENDED_USE_REVIEW |
| Network capacity partner feed | ROLE_NETWORK_COORDINATION_OWNER | ROLE_INTEROPERABILITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_GOVERNANCE_LEAD | LIVE_GATE_NETWORK_FEED_TRUST_REVIEW |
| Optional PDS enrichment seam | ROLE_INTEROPERABILITY_LEAD | ROLE_DPO | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_GOVERNANCE_LEAD | LIVE_GATE_PDS_LEGAL_BASIS_APPROVED, GATE_EXTERNAL_TO_FOUNDATION |
| Pharmacy directory seam | ROLE_PHARMACY_PARTNER_OWNER | ROLE_PHARMACY_DOMAIN_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_GOVERNANCE_LEAD | LIVE_GATE_PHARMACY_DIRECTORY_REVIEW |
| Pharmacy outcome observation | ROLE_PHARMACY_DOMAIN_LEAD | ROLE_PHARMACY_PARTNER_OWNER | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_GOVERNANCE_LEAD | LIVE_GATE_PHARMACY_OUTCOME_REVIEW |
| Pharmacy dispatch transport | ROLE_PHARMACY_PARTNER_OWNER | ROLE_INTEROPERABILITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_OPERATIONS_LEAD | GATE_EXTERNAL_TO_FOUNDATION, LIVE_GATE_PHARMACY_TRANSPORT_REVIEW |
| SMS continuation delivery | ROLE_COMMUNICATIONS_PLATFORM_LEAD | ROLE_SUPPORT_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_SECURITY_LEAD | LIVE_GATE_VENDOR_SENDER_REVIEW |
| Telephony, IVR, and recording rail | ROLE_COMMUNICATIONS_PLATFORM_LEAD | ROLE_SECURITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_OPERATIONS_LEAD | GATE_EXTERNAL_TO_FOUNDATION, LIVE_GATE_TELEPHONY_RECORDING_APPROVED |
| Transcript processing provider | ROLE_COMMUNICATIONS_PLATFORM_LEAD | ROLE_SECURITY_LEAD | ROLE_PARTNER_ONBOARDING_LEAD | ROLE_MANUFACTURER_CSO | GATE_EXTERNAL_TO_FOUNDATION, LIVE_GATE_TRANSCRIPT_SAFETY_REVIEW |

        ## Storage And Custody

        | Storage backend | Trust zone | Usage class |
| --- | --- | --- |
| local_ephemeral_secret_store | tz_stateful_data | local_mock_only |
| ci_ephemeral_secret_store | tz_assurance_security | ci_mock_only |
| shared_nonprod_fixture_registry | tz_stateful_data | mock_metadata_and_synthetic_fixture |
| shared_nonprod_vault | tz_assurance_security | shared_nonprod_secret_material |
| partner_capture_quarantine | tz_assurance_security | temporary_landing_zone |
| partner_metadata_registry | tz_assurance_security | non-secret_partner_metadata |
| nonprod_hsm_keyring | tz_assurance_security | nonprod_private_key_custody |
| preprod_vault | tz_assurance_security | preprod_secret_material |
| production_vault | tz_assurance_security | production_secret_material |
| production_hsm_keyring | tz_assurance_security | production_private_key_custody |

        Rotation law:
        - Mock-only secret rows rotate per spin-up or per shared reset.
        - Live secret rows rotate on a fixed cadence plus every environment, redirect, endpoint, incident, or ownership change that could invalidate trust.
        - Metadata rows such as sender identities, phone numbers, client registrations, and public keys recertify on every topology change and at least quarterly.
        - Revocation always appends audit evidence and republishes runtime or metadata truth; no stale reference is allowed to linger as an implicit allow.
