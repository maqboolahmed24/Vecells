# 25 NHS Login Mock Service Spec

            Section A — `Mock_now_execution`

            `Bluewoven_Identity_Simulator` is the contract-first local mock NHS login service and admin console for seq_025. It does not impersonate the real NHS login brand and it does not claim real approval, real identity proof, or real provider enablement.

            ## Simulator mission

            - Preserve the blueprint rule that NHS login authenticates and verifies while Vecells still owns local session establishment, route intent, writable capability, logout, and same-shell recovery.
            - Exercise the exact seams Vecells later depends on: client registration, redirect governance, state and nonce and PKCE, scope bundles, vectors of trust, callback error handling, settings-link return, and route-bound local-session decisions.
            - Keep IM1 and GP credential pairing behind an explicit client flag and high-assurance route policy instead of allowing one-off linkage-key retrieval.

            ## Core surfaces

            - `Admin_Client_Registry`: client cards, redirect URI cards, scope chips, VoT presets, environment switcher, test-user registry, JWKS preview, and dry-run credential drawer.
            - `User_Sign_In`: two-step email/password then OTP or step-up posture with a visible journey indicator.
            - `Consent_and_Share`: precise requested claims, allow or deny handling, and a visible mock disclaimer.
            - `Return_or_Error`: separate calm states for success, consent denied, stale code, reused code, expired session, wrong redirect URI, and IM1-gated refusal.
            - `Settings_Link_Simulator`: mock NHS-login-settings handoff with safe return to the correct patient route family.

            ## Supported protocol seams

            - `authorize`
            - `token`
            - `userinfo`
            - `logout`
            - `client registration`
            - `public-key and JWKS preview`
            - `redirect URI validation`
            - `state and nonce round-tripping`
            - `PKCE verification posture`
            - `consent denied`
            - `stale or reused auth code`
            - `session expiry and re-auth`
            - `environment isolation`
            - `route-family callback fan-out`

            ## Clients

            | Client | Route bindings | IM1 enabled | Redirect strategy |
| --- | --- | --- | --- |
| Vecells patient portal | rb_patient_home, rb_patient_requests, rb_patient_appointments, rb_patient_health_record, rb_patient_messages | `false` | route_family_split_under_10 |
| Vecells recovery bridge | rb_patient_intake_upgrade, rb_secure_link_recovery, rb_patient_settings_link | `false` | route_family_split_under_10 |
| Vecells IM1 pairing | rb_gp_im1_pairing | `true` | single_route_under_limit |
| Vecells embedded future | rb_embedded_channel_future | `false` | deferred_channel_placeholder |

            ## Test users

            | Alias | VoT | IM1 ready | Supported scenarios |
| --- | --- | --- | --- |
| basic-p0 | `P0.Cp` | `false` | happy_path, consent_denied, wrong_redirect_uri |
| repeat-p5 | `P5.Cp.Cd` | `false` | happy_path, stale_code, reused_code, expired_session |
| verified-p9 | `P9.Cp.Cd` | `false` | happy_path, stale_code, reused_code, settings_return |
| im1-ready-p9 | `P9.Cp.Cd` | `true` | happy_path, im1_pairing, stale_code |
| deny-consent | `P5.Cp.Cd` | `false` | consent_denied |

            ## Route-family callback posture

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

            ## Section B — `Actual_provider_strategy_later`

            The mock service stays useful even while real onboarding is blocked. The actual-provider path is generated from the same redirect, scope, VoT, and environment contract so later live registration cannot drift away from the simulator.

            ## Live gates

            | Gate | Status | Summary |
| --- | --- | --- |
| LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD | `blocked` | seq_020 still reports `withheld` for Phase 0 entry; no real provider mutation may proceed while the external-readiness chain remains withheld. |
| LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED | `blocked` | Real client IDs, redirect registration, and production credentials stay placeholder-only until the NHS login partner onboarding path and named approver identity are complete. |
| LIVE_GATE_REDIRECT_URI_REVIEW | `review_required` | The redirect matrix is generated and route-family bound, but a later human review must approve any real sandpit or live redirect registration. |
| LIVE_GATE_IDENTITY_SESSION_PARITY | `pass` | This pack binds redirect URIs, VoT profiles, scopes, and callback outcomes to the blueprint’s route-intent and local-session law. |
| LIVE_GATE_ENVIRONMENT_TARGET_MISSING | `blocked` | Real runs must specify sandpit, integration, or production as a named target. The pack intentionally leaves the field blank. |
| LIVE_GATE_MUTATION_FLAG_DISABLED | `blocked` | All generated browser automation defaults to dry-run and refuses live submission until ALLOW_REAL_PROVIDER_MUTATION=true. |
| LIVE_GATE_IM1_SCAL_APPROVED | `blocked` | Any real `gp_integration_credentials` use remains blocked until IM1, SCAL, and approved third-party pairing evidence are current. |
| LIVE_GATE_TECHNICAL_CONFORMANCE_PENDING | `review_required` | The simulator covers callback, userinfo, stale-code, and redirect rules now, but official technical conformance still belongs to the actual integration environment. |

            ## Key consequences

            - Auth success never implies writable patient action by itself.
            - Redirect URIs remain route-family artifacts, not loose configuration strings.
            - Overflow beyond the provider’s ten-URI cap is handled through opaque state fan-out, not by uncontrolled callback growth.
            - IM1 pairing remains conditional and cannot be used as a one-off retrieval shortcut.
