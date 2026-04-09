# 15 Incident Audit And Assurance Tooling

        The incident baseline is a just-culture incident desk with near-miss intake, immutable audit, evidence preservation, reportability assessment, post-incident review, and assurance-ledger writeback.

        ## Alert And Incident Routing Matrix

        | Route | Family | Severity | Audit | Reportability | CAPA | On-call route |
| --- | --- | --- | --- | --- | --- | --- |
| ALERT_PATIENT_ENTRY_SLO | service_level_breach | high | yes | conditional | WS_CLINICAL_DEPLOYMENT_USE | ROLE_OPERATIONS_LEAD -> ROLE_RELEASE_GUARDRAIL_OWNER |
| ALERT_PATIENT_SELF_SERVICE_CONTINUITY | continuity_drift | high | yes | conditional | WS_SERVICE_OPERATIONS_AND_BAU | ROLE_OPERATIONS_LEAD -> ROLE_SUPPORT_LEAD |
| ALERT_WORKSPACE_SETTLEMENT_SLO | settlement_lag | high | yes | conditional | WS_CLINICAL_DEPLOYMENT_USE | ROLE_OPERATIONS_LEAD -> ROLE_SERVICE_OWNER |
| ALERT_BOOKING_AND_PARTNER_FLOW_SLO | partner_flow_drift | high | yes | conditional | WS_INTEROPERABILITY_EVIDENCE | ROLE_OPERATIONS_LEAD -> ROLE_PARTNER_ONBOARDING_LEAD |
| ALERT_HUB_COORDINATION_HEALTH | cross_org_coordination_drift | high | yes | conditional | WS_INTEROPERABILITY_EVIDENCE | ROLE_OPERATIONS_LEAD -> ROLE_NETWORK_COORDINATION_OWNER |
| ALERT_PHARMACY_REFERRAL_HEALTH | pharmacy_dispatch_or_outcome_drift | high | yes | conditional | WS_INTEROPERABILITY_EVIDENCE | ROLE_OPERATIONS_LEAD -> ROLE_PHARMACY_PARTNER_OWNER |
| ALERT_COMMUNICATION_AND_CALLBACK_HEALTH | communication_and_callback_drift | high | yes | conditional | WS_SERVICE_OPERATIONS_AND_BAU | ROLE_OPERATIONS_LEAD -> ROLE_SUPPORT_LEAD |
| ALERT_WATCH_TUPLE_OR_PARITY_DRIFT | release_tuple_drift | critical | yes | conditional | WS_TECHNICAL_SECURITY_ASSURANCE | ROLE_RELEASE_MANAGER -> ROLE_RELEASE_GUARDRAIL_OWNER -> ROLE_SERVICE_OWNER |
| ALERT_WAVE_GUARDRAIL_BREACH | wave_guardrail_breach | critical | yes | conditional | WS_SERVICE_OPERATIONS_AND_BAU | ROLE_RELEASE_GUARDRAIL_OWNER -> ROLE_RELEASE_MANAGER |
| ALERT_PROVENANCE_OR_SBOM_BLOCKED | supply_chain_integrity | critical | yes | conditional | WS_TECHNICAL_SECURITY_ASSURANCE | ROLE_SECURITY_LEAD -> ROLE_RELEASE_MANAGER |
| ALERT_DISCLOSURE_FENCE_BLOCKED | telemetry_disclosure_violation | critical | yes | yes | WS_DATA_PROTECTION_PRIVACY | ROLE_SECURITY_LEAD -> ROLE_DPO -> ROLE_RELEASE_MANAGER |
| ALERT_ASSURANCE_SLICE_QUARANTINED | assurance_slice_quarantine | critical | yes | conditional | WS_SERVICE_OPERATIONS_AND_BAU | ROLE_OPERATIONS_LEAD -> ROLE_SECURITY_LEAD -> ROLE_RELEASE_MANAGER |
| ALERT_BREAK_GLASS_OR_TENANT_SWITCH | heightened_access_event | critical | yes | yes | WS_DATA_PROTECTION_PRIVACY | ROLE_SECURITY_LEAD -> ROLE_DPO -> ROLE_SUPPORT_LEAD |
| ALERT_READINESS_OR_REHEARSAL_STALE | stale_recovery_authority | critical | yes | conditional | WS_SERVICE_OPERATIONS_AND_BAU | ROLE_RELEASE_GUARDRAIL_OWNER -> ROLE_SERVICE_OWNER -> ROLE_OPERATIONS_LEAD |
| ALERT_SECURITY_INCIDENT_OR_NEAR_MISS | security_incident_or_near_miss | critical | yes | yes | WS_TECHNICAL_SECURITY_ASSURANCE | ROLE_SECURITY_LEAD -> ROLE_DPO -> ROLE_SERVICE_OWNER |

        ## Incident Law

        - Near miss is first-class and may open CAPA without waiting for a major breach.
        - Break-glass, tenant switch, support replay, and telemetry disclosure violations are always immutable audit classes.
        - Incident, replay, governance export, and release follow-up all consume the same assurance graph and evidence lineage.
        - Any path lacking immutable audit, reportability review, and CAPA linkage is invalid by design.
