# 18 Dependency Watchlist

        The dependency watchlist merges external onboarding, supplier capability, standards hygiene, security seams, and restore or alerting runbook dependencies into one machine-readable posture.

        ## Summary

        - Total dependencies: 26
        - Current baseline: 22
        - Deferred: 1
        - Optional: 3

        ## Lifecycle Distribution

        | Lifecycle state | Count |

| --- | --- |
| blocked | 2 |
| current | 5 |
| deferred | 1 |
| onboarding | 15 |
| replaceable_by_simulator | 3 |

        ## Current-Baseline Watch Rows

        | Dependency | Name | Type | State | Owner | Next review |

| --- | --- | --- | --- | --- | --- |
| dep_alert_destination_binding | Alert-routing destination and on-call binding | runbook_dependency | blocked | ROLE_OPERATIONS_LEAD | GATE_RELEASE_READINESS |
| dep_assurance_evidence_graph | Assurance evidence graph completeness engine | infra_component | current | ROLE_ASSURANCE_PLATFORM_LEAD | GATE_CURRENT_BASELINE_CONFORMANCE |
| dep_cross_org_secure_messaging_mesh | Cross-organisation secure messaging rail including MESH | external_service | onboarding | ROLE_INTEROPERABILITY_LEAD | GATE_EXTERNAL_TO_FOUNDATION |
| dep_email_notification_provider | Email and notification delivery provider | external_service | onboarding | ROLE_INTEROPERABILITY_LEAD | MS_EXT_COMMS_AND_SCAN_VENDORS |
| dep_gp_system_supplier_paths | Principal GP-system supplier integration paths | supplier_capability | onboarding | ROLE_INTEROPERABILITY_LEAD | MS_EXT_PROVIDER_PATHS_AND_EVIDENCE |
| dep_hsm_signing_key_provisioning | HSM-backed signing key provisioning seam | security_control | blocked | ROLE_SECURITY_LEAD | GATE_RELEASE_READINESS |
| dep_im1_pairing_programme | IM1 Pairing programme and prerequisite path | supplier_capability | onboarding | ROLE_INTEROPERABILITY_LEAD | GATE_EXTERNAL_TO_FOUNDATION |
| dep_local_booking_supplier_adapters | Local booking supplier adapter family | supplier_capability | onboarding | ROLE_INTEROPERABILITY_LEAD | GATE_P4_PARALLEL_MERGE |
| dep_malware_scanning_provider | Malware and artifact scanning provider | external_service | onboarding | ROLE_INTEROPERABILITY_LEAD | MS_EXT_COMMS_AND_SCAN_VENDORS |
| dep_network_capacity_partner_feeds | Network and hub partner capacity feeds | supplier_capability | onboarding | ROLE_INTEROPERABILITY_LEAD | GATE_P5_PARALLEL_MERGE |
| dep_nhs_assurance_and_standards_sources | NHS standards and assurance source set | standards_baseline | current | ROLE_PLATFORM_GOVERNANCE_LEAD | GATE_P0_LONG_LEAD_ASSURANCE_MERGE |
| dep_nhs_login_rail | NHS login authentication rail | external_approval | onboarding | ROLE_INTEROPERABILITY_LEAD | GATE_EXTERNAL_TO_FOUNDATION |
| dep_origin_practice_ack_rail | Origin-practice acknowledgement rail | external_service | onboarding | ROLE_INTEROPERABILITY_LEAD | seq_040 |
| dep_pharmacy_directory_dohs | Pharmacy directory and discovery dependency | supplier_capability | onboarding | ROLE_INTEROPERABILITY_LEAD | GATE_P6_PARALLEL_MERGE |
| dep_pharmacy_outcome_observation | Pharmacy outcome observation and reconciliation path | supplier_capability | onboarding | ROLE_INTEROPERABILITY_LEAD | MS_P6_DEFINITION_AND_ENTRY |
| dep_pharmacy_referral_transport | Pharmacy referral transport dependency | supplier_capability | onboarding | ROLE_INTEROPERABILITY_LEAD | GATE_P6_PARALLEL_MERGE |

        ## Watch Rules

        - `current` means the dependency is in the baseline and has an explicit health signal and fallback posture.
        - `onboarding` means the dependency is required but still approval- or provisioning-bound.
        - `replaceable_by_simulator` means the baseline can continue with governed simulator or manual fallback, but the row remains watchlisted.
        - `blocked` means a current-baseline release or gate cannot go green without resolving the seam.
