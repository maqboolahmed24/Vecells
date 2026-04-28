# 25 Redirect URI And Scope Matrix

            Section A — `Mock_now_execution`

            `Bluewoven_Identity_Simulator` derives the redirect and scope pack from Vecells route families, acting-scope posture, and local session law. It is not a page-list export.

            ## Redirect matrix

            | Client | Environment | Route binding | Callback URI | Return intent | Ceiling |
| --- | --- | --- | --- | --- | --- |
| mc_patient_portal | env_local_mock | rb_patient_home | `http://127.0.0.1:4174/auth/callback/home` | `patient.home.entry` | `auth_read_only` |
| mc_patient_portal | env_local_mock | rb_patient_requests | `http://127.0.0.1:4174/auth/callback/requests` | `patient.requests.detail` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_local_mock | rb_patient_appointments | `http://127.0.0.1:4174/auth/callback/appointments` | `patient.appointments.manage` | `writable_if_local_capability_allows` |
| mc_patient_portal | env_local_mock | rb_patient_health_record | `http://127.0.0.1:4174/auth/callback/health-record` | `patient.record.entry` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_local_mock | rb_patient_messages | `http://127.0.0.1:4174/auth/callback/messages` | `patient.messages.thread` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_sandpit_like | rb_patient_home | `https://sandpit-like.vecells.local/auth/callback/home` | `patient.home.entry` | `auth_read_only` |
| mc_patient_portal | env_sandpit_like | rb_patient_requests | `https://sandpit-like.vecells.local/auth/callback/requests` | `patient.requests.detail` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_sandpit_like | rb_patient_appointments | `https://sandpit-like.vecells.local/auth/callback/appointments` | `patient.appointments.manage` | `writable_if_local_capability_allows` |
| mc_patient_portal | env_sandpit_like | rb_patient_health_record | `https://sandpit-like.vecells.local/auth/callback/health-record` | `patient.record.entry` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_sandpit_like | rb_patient_messages | `https://sandpit-like.vecells.local/auth/callback/messages` | `patient.messages.thread` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_integration_like | rb_patient_home | `https://integration-like.vecells.local/auth/callback/home` | `patient.home.entry` | `auth_read_only` |
| mc_patient_portal | env_integration_like | rb_patient_requests | `https://integration-like.vecells.local/auth/callback/requests` | `patient.requests.detail` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_integration_like | rb_patient_appointments | `https://integration-like.vecells.local/auth/callback/appointments` | `patient.appointments.manage` | `writable_if_local_capability_allows` |
| mc_patient_portal | env_integration_like | rb_patient_health_record | `https://integration-like.vecells.local/auth/callback/health-record` | `patient.record.entry` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_integration_like | rb_patient_messages | `https://integration-like.vecells.local/auth/callback/messages` | `patient.messages.thread` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_actual_sandpit | rb_patient_home | `https://sandpit.patient.vecells.example/auth/callback/home` | `patient.home.entry` | `auth_read_only` |
| mc_patient_portal | env_actual_sandpit | rb_patient_requests | `https://sandpit.patient.vecells.example/auth/callback/requests` | `patient.requests.detail` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_actual_sandpit | rb_patient_appointments | `https://sandpit.patient.vecells.example/auth/callback/appointments` | `patient.appointments.manage` | `writable_if_local_capability_allows` |
| mc_patient_portal | env_actual_sandpit | rb_patient_health_record | `https://sandpit.patient.vecells.example/auth/callback/health-record` | `patient.record.entry` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_actual_sandpit | rb_patient_messages | `https://sandpit.patient.vecells.example/auth/callback/messages` | `patient.messages.thread` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_actual_integration | rb_patient_home | `https://integration.patient.vecells.example/auth/callback/home` | `patient.home.entry` | `auth_read_only` |
| mc_patient_portal | env_actual_integration | rb_patient_requests | `https://integration.patient.vecells.example/auth/callback/requests` | `patient.requests.detail` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_actual_integration | rb_patient_appointments | `https://integration.patient.vecells.example/auth/callback/appointments` | `patient.appointments.manage` | `writable_if_local_capability_allows` |
| mc_patient_portal | env_actual_integration | rb_patient_health_record | `https://integration.patient.vecells.example/auth/callback/health-record` | `patient.record.entry` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_actual_integration | rb_patient_messages | `https://integration.patient.vecells.example/auth/callback/messages` | `patient.messages.thread` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_actual_production | rb_patient_home | `https://patient.vecells.example/auth/callback/home` | `patient.home.entry` | `auth_read_only` |
| mc_patient_portal | env_actual_production | rb_patient_requests | `https://patient.vecells.example/auth/callback/requests` | `patient.requests.detail` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_actual_production | rb_patient_appointments | `https://patient.vecells.example/auth/callback/appointments` | `patient.appointments.manage` | `writable_if_local_capability_allows` |
| mc_patient_portal | env_actual_production | rb_patient_health_record | `https://patient.vecells.example/auth/callback/health-record` | `patient.record.entry` | `auth_read_only_or_writable_after_local_capability` |
| mc_patient_portal | env_actual_production | rb_patient_messages | `https://patient.vecells.example/auth/callback/messages` | `patient.messages.thread` | `auth_read_only_or_writable_after_local_capability` |
| mc_recovery_bridge | env_local_mock | rb_patient_intake_upgrade | `http://127.0.0.1:4174/auth/callback/intake` | `patient.intake.upgrade` | `auth_read_only` |
| mc_recovery_bridge | env_local_mock | rb_secure_link_recovery | `http://127.0.0.1:4174/auth/callback/recovery` | `patient.recovery.resume` | `claim_pending_or_step_up` |
| mc_recovery_bridge | env_local_mock | rb_patient_settings_link | `http://127.0.0.1:4174/auth/callback/settings-link` | `patient.settings.return` | `auth_read_only` |
| mc_recovery_bridge | env_sandpit_like | rb_patient_intake_upgrade | `https://sandpit-like.vecells.local/auth/callback/intake` | `patient.intake.upgrade` | `auth_read_only` |
| mc_recovery_bridge | env_sandpit_like | rb_secure_link_recovery | `https://sandpit-like.vecells.local/auth/callback/recovery` | `patient.recovery.resume` | `claim_pending_or_step_up` |
| mc_recovery_bridge | env_sandpit_like | rb_patient_settings_link | `https://sandpit-like.vecells.local/auth/callback/settings-link` | `patient.settings.return` | `auth_read_only` |
| mc_recovery_bridge | env_integration_like | rb_patient_intake_upgrade | `https://integration-like.vecells.local/auth/callback/intake` | `patient.intake.upgrade` | `auth_read_only` |
| mc_recovery_bridge | env_integration_like | rb_secure_link_recovery | `https://integration-like.vecells.local/auth/callback/recovery` | `patient.recovery.resume` | `claim_pending_or_step_up` |
| mc_recovery_bridge | env_integration_like | rb_patient_settings_link | `https://integration-like.vecells.local/auth/callback/settings-link` | `patient.settings.return` | `auth_read_only` |
| mc_recovery_bridge | env_actual_sandpit | rb_patient_intake_upgrade | `https://sandpit.patient.vecells.example/auth/callback/intake` | `patient.intake.upgrade` | `auth_read_only` |
| mc_recovery_bridge | env_actual_sandpit | rb_secure_link_recovery | `https://sandpit.patient.vecells.example/auth/callback/recovery` | `patient.recovery.resume` | `claim_pending_or_step_up` |
| mc_recovery_bridge | env_actual_sandpit | rb_patient_settings_link | `https://sandpit.patient.vecells.example/auth/callback/settings-link` | `patient.settings.return` | `auth_read_only` |
| mc_recovery_bridge | env_actual_integration | rb_patient_intake_upgrade | `https://integration.patient.vecells.example/auth/callback/intake` | `patient.intake.upgrade` | `auth_read_only` |
| mc_recovery_bridge | env_actual_integration | rb_secure_link_recovery | `https://integration.patient.vecells.example/auth/callback/recovery` | `patient.recovery.resume` | `claim_pending_or_step_up` |
| mc_recovery_bridge | env_actual_integration | rb_patient_settings_link | `https://integration.patient.vecells.example/auth/callback/settings-link` | `patient.settings.return` | `auth_read_only` |
| mc_recovery_bridge | env_actual_production | rb_patient_intake_upgrade | `https://patient.vecells.example/auth/callback/intake` | `patient.intake.upgrade` | `auth_read_only` |
| mc_recovery_bridge | env_actual_production | rb_secure_link_recovery | `https://patient.vecells.example/auth/callback/recovery` | `patient.recovery.resume` | `claim_pending_or_step_up` |
| mc_recovery_bridge | env_actual_production | rb_patient_settings_link | `https://patient.vecells.example/auth/callback/settings-link` | `patient.settings.return` | `auth_read_only` |
| mc_im1_pairing | env_local_mock | rb_gp_im1_pairing | `http://127.0.0.1:4174/auth/callback/gp-pairing` | `patient.gp.im1.pairing` | `claim_pending_or_step_up` |
| mc_im1_pairing | env_integration_like | rb_gp_im1_pairing | `https://integration-like.vecells.local/auth/callback/gp-pairing` | `patient.gp.im1.pairing` | `claim_pending_or_step_up` |
| mc_im1_pairing | env_actual_integration | rb_gp_im1_pairing | `https://integration.patient.vecells.example/auth/callback/gp-pairing` | `patient.gp.im1.pairing` | `claim_pending_or_step_up` |
| mc_im1_pairing | env_actual_production | rb_gp_im1_pairing | `https://patient.vecells.example/auth/callback/gp-pairing` | `patient.gp.im1.pairing` | `claim_pending_or_step_up` |
| mc_embedded_future | env_local_mock | rb_embedded_channel_future | `http://127.0.0.1:4174/auth/callback/embedded` | `patient.embedded.return` | `deferred_channel_only` |
| mc_embedded_future | env_integration_like | rb_embedded_channel_future | `https://integration-like.vecells.local/auth/callback/embedded` | `patient.embedded.return` | `deferred_channel_only` |

            Redirect law:

            - The current matrix stays under the official `10` redirect URI cap per client.
            - Every row carries a route-intent key so callback completion can re-enter the correct shell and anchor.
            - If a later environment needs more than `10` destinations, the partner must use opaque state fan-out rather than widening registered URIs indefinitely.

            ## Scope and claim matrix

            | Bundle | Route binding | VTR | Scopes | Claims | IM1 gated |
| --- | --- | --- | --- | --- | --- |
| Auth contact minimum | rb_patient_intake_upgrade | `["P0.Cp"]` | `openid email phone` | sub, iss, aud, email, email_verified, phone_number, phone_number_verified | `false` |
| Patient profile | rb_secure_link_recovery | `["P5.Cp.Cd","P5.Cm","P9.Cp.Cd","P9.Cm"]` | `openid profile email phone` | sub, nhs_number, family_name, birthdate, identity_proofing_level, email, phone_number, phone_number_verified | `false` |
| Patient profile | rb_patient_home | `["P5.Cp.Cd","P5.Cp.Ck","P5.Cm"]` | `openid profile email phone` | sub, nhs_number, family_name, birthdate, identity_proofing_level, email, phone_number, phone_number_verified | `false` |
| Patient profile | rb_patient_requests | `["P5.Cp.Cd","P5.Cm","P9.Cp.Cd","P9.Cm"]` | `openid profile email phone` | sub, nhs_number, family_name, birthdate, identity_proofing_level, email, phone_number, phone_number_verified | `false` |
| Patient profile extended | rb_patient_appointments | `["P9.Cp.Cd","P9.Cp.Ck","P9.Cm"]` | `openid profile profile_extended email phone` | sub, nhs_number, family_name, given_name, birthdate, identity_proofing_level, email, phone_number | `false` |
| Patient profile extended | rb_patient_health_record | `["P9.Cp.Cd","P9.Cp.Ck","P9.Cm"]` | `openid profile profile_extended email phone` | sub, nhs_number, family_name, given_name, birthdate, identity_proofing_level, email, phone_number | `false` |
| Patient profile | rb_patient_messages | `["P5.Cp.Cd","P5.Cp.Ck","P5.Cm"]` | `openid profile email phone` | sub, nhs_number, family_name, birthdate, identity_proofing_level, email, phone_number, phone_number_verified | `false` |
| Auth contact minimum | rb_patient_settings_link | `["P0.Cp"]` | `openid email phone` | sub, iss, aud, email, email_verified, phone_number, phone_number_verified | `false` |
| IM1 GP pairing | rb_gp_im1_pairing | `["P9.Cp.Cd","P9.Cp.Ck","P9.Cm"]` | `openid profile email phone gp_integration_credentials` | sub, nhs_number, family_name, birthdate, identity_proofing_level, email, phone_number, gp_linkage_key, gp_ods_code, gp_user_id | `true` |
| Patient profile | rb_embedded_channel_future | `["P5.Cp.Cd","P5.Cm","P9.Cp.Cd","P9.Cm"]` | `openid profile email phone` | sub, nhs_number, family_name, birthdate, identity_proofing_level, email, phone_number, phone_number_verified | `false` |

            Scope law:

            - `openid` is mandatory everywhere.
            - `profile` and `basic_demographics` are mutually exclusive, so this pack standardises on `profile` for patient-facing identity payloads.
            - `gp_integration_credentials` appears only on the IM1 pairing client and only under a high-assurance VoT plus explicit IM1 enablement.

            ## Section B — `Actual_provider_strategy_later`

            The same matrix becomes the submission pack for sandpit, integration, and later live review.

            ## Environment profile reference

            | Environment | Lane | Base URL | Test data | IM1 posture |
| --- | --- | --- | --- | --- |
| Local mock | Mock_now_execution | `http://127.0.0.1:4174` | Synthetic aliases, static OTP, deterministic callback-race and stale-code fault injection. | Disabled by default; can simulate `gp_integration_credentials` only when IM1 flag is enabled on the client. |
| Sandpit-like | Mock_now_execution | `https://sandpit-like.vecells.local` | Prepared dummy accounts plus static OTP rehearsal; no real ID or full PDS-backed registration. | IM1 registration flow stays disabled, matching sandpit restrictions on GP Online testing. |
| Integration-like | Mock_now_execution | `https://integration-like.vecells.local` | Synthetic PDS-matched and IM1-ready aliases mirror integration test-pack structure. | Available only when client and test user both carry IM1 enablement. |
| Actual sandpit later | Actual_provider_strategy_later | `https://sandpit.patient.vecells.example` | Provider-issued sandpit client plus supplied test pack after request approval. | Do not assume GP Online or IM1 testing is available; keep it disabled until integration. |
| Actual integration later | Actual_provider_strategy_later | `https://integration.patient.vecells.example` | Provider integration pack plus optional IM1 linkage details after approval. | IM1 pathways are allowed only with approved pairings and explicit high-assurance scope approval. |
| Actual production later | Actual_provider_strategy_later | `https://patient.vecells.example` | Smoke-test user only, no exploratory testing, and no load testing. | Production `gp_integration_credentials` remains blocked until live IM1 enablement is approved. |

            ## Official source alignment

            - [What is NHS login?](https://nhsconnect.github.io/nhslogin/)
            - [How NHS login works](https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works)
            - [How do I integrate to the sandpit?](https://nhsconnect.github.io/nhslogin/integrating-to-sandpit/)
            - [Compare NHS login environments](https://nhsconnect.github.io/nhslogin/compare-environments/)
            - [Test data](https://nhsconnect.github.io/nhslogin/test-data/)
            - [Multiple redirect URIs](https://nhsconnect.github.io/nhslogin/multiple-redirect-uris/)
            - [Technical Conformance](https://nhsconnect.github.io/nhslogin/technical-conformance/)
            - [Using NHS login to create or retrieve GP credentials](https://nhsconnect.github.io/nhslogin/gp-credentials/)
            - [Scopes and claims](https://nhsconnect.github.io/nhslogin/scopes-and-claims/)
            - [Introduction to Vectors of Trust](https://nhsconnect.github.io/nhslogin/vectors-of-trust/)
