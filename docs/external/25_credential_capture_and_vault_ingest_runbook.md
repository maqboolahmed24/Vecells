# 25 Credential Capture And Vault Ingest Runbook

            Section A — `Mock_now_execution`

            `Bluewoven_Identity_Simulator` exposes the same credential and redirect fields that later real onboarding will need, but every live value remains placeholder-only and every browser flow remains dry-run by default.

            ## Placeholder registry

            | Field | Owner | Backend | Live required | Default |
| --- | --- | --- | --- | --- |
| Named approver | ROLE_INTEROPERABILITY_LEAD | partner_metadata_registry | `true` | `` |
| Environment target | ROLE_IDENTITY_PARTNER_MANAGER | partner_metadata_registry | `true` | `` |
| Sandpit client ID | ROLE_IDENTITY_PARTNER_MANAGER | partner_capture_quarantine | `false` | `PLACEHOLDER_SANDPIT_CLIENT_ID` |
| Integration client ID | ROLE_IDENTITY_PARTNER_MANAGER | partner_capture_quarantine | `false` | `PLACEHOLDER_INTEGRATION_CLIENT_ID` |
| Production client ID | ROLE_IDENTITY_PARTNER_MANAGER | partner_capture_quarantine | `false` | `PLACEHOLDER_PRODUCTION_CLIENT_ID` |
| Public-key submission ref | ROLE_SECURITY_LEAD | nonprod_hsm_keyring | `true` | `kid_portal_2026_04` |
| Redirect review ref | ROLE_PROGRAMME_ARCHITECT | partner_metadata_registry | `true` | `REDIRECT_REVIEW_PENDING` |
| Scope approval ref | ROLE_INTEROPERABILITY_LEAD | partner_metadata_registry | `true` | `SCOPE_APPROVAL_PENDING` |
| Provider test pack reference | ROLE_PARTNER_ONBOARDING_LEAD | partner_metadata_registry | `false` | `TEST_PACK_PENDING` |
| IM1 pairing reference | ROLE_INTEROPERABILITY_LEAD | partner_metadata_registry | `false` | `IM1_PAIRING_PENDING` |
| Allow real provider mutation | ROLE_SECURITY_LEAD | partner_metadata_registry | `true` | `false` |

            ## Owner model

            | Field | Owner | Backup owner | Backend | Notes |
| --- | --- | --- | --- | --- |
| Named approver | `ROLE_INTEROPERABILITY_LEAD` | `ROLE_SECURITY_LEAD` | `partner_metadata_registry` | Must identify the operator who may later pause-and-confirm a real submission run. |
| Environment target | `ROLE_IDENTITY_PARTNER_MANAGER` | `ROLE_PROGRAMME_ARCHITECT` | `partner_metadata_registry` | Must be one of sandpit, integration, or production. |
| Sandpit client ID | `ROLE_IDENTITY_PARTNER_MANAGER` | `ROLE_SECURITY_LEAD` | `partner_capture_quarantine` | Capture to quarantine first, then move to metadata registry after review. |
| Integration client ID | `ROLE_IDENTITY_PARTNER_MANAGER` | `ROLE_SECURITY_LEAD` | `partner_capture_quarantine` | Becomes active only after product demo and environment approval. |
| Production client ID | `ROLE_IDENTITY_PARTNER_MANAGER` | `ROLE_SECURITY_LEAD` | `partner_capture_quarantine` | Must never be committed to the repository or screenshots. |
| Public-key submission ref | `ROLE_SECURITY_LEAD` | `ROLE_IDENTITY_PARTNER_MANAGER` | `nonprod_hsm_keyring` | The private key remains outside the repo; this field records the approved public-key reference only. |
| Redirect review ref | `ROLE_PROGRAMME_ARCHITECT` | `ROLE_IDENTITY_PARTNER_MANAGER` | `partner_metadata_registry` | Must refer to the generated route-family redirect matrix rather than ad hoc form text. |
| Scope approval ref | `ROLE_INTEROPERABILITY_LEAD` | `ROLE_PROGRAMME_ARCHITECT` | `partner_metadata_registry` | Records the approved scope bundle and VTR for later real onboarding. |
| Provider test pack reference | `ROLE_PARTNER_ONBOARDING_LEAD` | `ROLE_IDENTITY_PARTNER_MANAGER` | `partner_metadata_registry` | Captures the provider-issued test pack reference; not the raw spreadsheet itself. |
| IM1 pairing reference | `ROLE_INTEROPERABILITY_LEAD` | `ROLE_SECURITY_LEAD` | `partner_metadata_registry` | Only complete when the IM1-enabled flag, SCAL, and approved third-party posture all exist. |
| Allow real provider mutation | `ROLE_SECURITY_LEAD` | `ROLE_PROGRAMME_ARCHITECT` | `partner_metadata_registry` | Must remain false by default and requires a pause-before-submit acknowledgement. |

            ## Vault ingest sequence

            | Step | Action | Owner | Backend |
| --- | --- | --- | --- |
| ingest_01 | Capture provider-issued values into partner_capture_quarantine | ROLE_PARTNER_ONBOARDING_LEAD | partner_capture_quarantine |
| ingest_02 | Record non-secret metadata into partner_metadata_registry | ROLE_IDENTITY_PARTNER_MANAGER | partner_metadata_registry |
| ingest_03 | Promote live secret material into preprod_vault or production_vault only after dual review | ROLE_SECURITY_LEAD | preprod_vault |
| ingest_04 | Reference signing material by HSM key ID only; never expose private-key bytes to browser automation | ROLE_SECURITY_LEAD | production_hsm_keyring |

            ## Dry-run automation law

            - `ALLOW_REAL_PROVIDER_MUTATION` defaults to `false`.
            - Browser automation may fill only placeholder or redacted values unless all live gates pass.
            - Traces, screenshots, and logs must remain redacted and secrets-safe.
            - Final submit must pause for an explicit operator confirmation even in a later live-enabled run.

            ## Section B — `Actual_provider_strategy_later`

            The real-provider path begins only after the external-readiness chain clears and the identity owner, security owner, approver, target environment, and current evidence bundle are all named.

            ## Current gate posture

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

            ## Dependencies from seq_024

            - Reuses the application-dossier fields `fld_redirect_uri_primary, fld_public_key_ref, fld_scopes_claims_summary, fld_vector_of_trust_profile, fld_named_approver, fld_environment_target, fld_live_mutation_flag`.
            - Keeps the phase verdict at `withheld`.
            - Preserves the existing fail-closed dry-run default from the seq_024 live gate pack.
