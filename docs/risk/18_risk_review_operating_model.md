# 18 Risk Review Operating Model

        This review model makes risks and dependency watch posture consumable by planning, release, and assurance gates without re-reading the whole corpus.

        ## Risk Ownership Split

        | Owner role | Risk count |

| --- | --- |
| ROLE_BOOKING_DOMAIN_LEAD | 1 |
| ROLE_CLINICAL_PRODUCT_LEAD | 6 |
| ROLE_COMMUNICATIONS_PLATFORM_LEAD | 1 |
| ROLE_DPO | 1 |
| ROLE_GOVERNANCE_LEAD | 1 |
| ROLE_INTEROPERABILITY_LEAD | 5 |
| ROLE_MANUFACTURER_CSO | 4 |
| ROLE_PHARMACY_DOMAIN_LEAD | 1 |
| ROLE_PLATFORM_GOVERNANCE_LEAD | 2 |
| ROLE_PROGRAMME_ARCHITECT | 33 |
| ROLE_RELEASE_MANAGER | 3 |
| ROLE_SRE_LEAD | 2 |

        ## Dependency Ownership Split

        | Dependency type | Count |

| --- | --- |
| external_approval | 2 |
| external_service | 10 |
| infra_component | 2 |
| runbook_dependency | 2 |
| security_control | 1 |
| standards_baseline | 2 |
| supplier_capability | 7 |

        ## Review Cadence

        - Weekly programme risk review: open, mitigating, and blocked current-baseline rows.
        - Gate-preparation review: every risk with `gate_impact = blocking` or `critical_path_relevance = on_path`.
        - External dependency review: onboarding, blocked, and replaceable-by-simulator rows before external-readiness and Phase 0 long-lead gates.
        - Release and resilience review: release, resilience, dependency-hygiene, HSM, alert-routing, and restore-rehearsal rows before release readiness and BAU handover.
