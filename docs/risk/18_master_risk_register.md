# 18 Master Risk Register

        Seq_018 consolidates the Vecells risk posture across the blueprint corpus, forensic findings, ADR freeze, external dependency inventory, workstream pack, tooling baseline, and programme gate model.

        ## Summary

        - Total risks: 60
        - Open, watching, or mitigating: 51
        - Blocking gate impact: 11
        - Critical-path relevant: 60

        ## Risk Classes

        | Risk class | Count |
| --- | --- |
| architecture | 15 |
| clinical_safety | 3 |
| delivery | 1 |
| dependency_hygiene | 2 |
| external_dependency | 6 |
| governance | 6 |
| integration | 2 |
| operational | 3 |
| privacy | 3 |
| product_logic | 7 |
| release | 6 |
| resilience | 4 |
| security | 2 |

        ## Highest-Score Risks

        | Risk | Title | Class | Status | Gate impact | Path | Score | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HZ_TELEPHONY_EVIDENCE_INADEQUACY | Telephony evidence inadequacy | clinical_safety | mitigating | blocking | on_path | 44 | ROLE_MANUFACTURER_CSO |
| HZ_DUPLICATE_SUPPRESSION_OR_MERGE | Duplicate suppression or merge hazard | clinical_safety | mitigating | blocking | on_path | 43 | ROLE_MANUFACTURER_CSO |
| HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE | Urgent diversion under-triage or over-triage | clinical_safety | mitigating | blocking | on_path | 43 | ROLE_MANUFACTURER_CSO |
| RISK_EXT_NHS_LOGIN_DELAY | NHS login partner onboarding or redirect proof delay stalls the current baseline | external_dependency | open | blocking | on_path | 42 | ROLE_INTEROPERABILITY_LEAD |
| RISK_EXT_COMMS_VENDOR_DELAY | Notifications, telephony, transcription, or scanning onboarding drifts past the engineering path | external_dependency | open | blocking | on_path | 41 | ROLE_COMMUNICATIONS_PLATFORM_LEAD |
| RISK_EXT_IM1_SCAL_DELAY | IM1 and SCAL readiness lag blocks Phase 0 assurance merge and later booking reach | external_dependency | open | blocking | on_path | 41 | ROLE_INTEROPERABILITY_LEAD |
| FINDING_095 | Governance watch tuples and recovery posture drift away from runtime release truth | release | watching | watch | on_path | 39 | ROLE_PROGRAMME_ARCHITECT |
| FINDING_118 | Design-contract publication drifts outside the published runtime tuple | release | watching | watch | on_path | 39 | ROLE_PROGRAMME_ARCHITECT |
| GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT | Design-contract publication could drift outside runtime publication | release | retired | watch | on_path | 39 | ROLE_PROGRAMME_ARCHITECT |
| RISK_ASSURANCE_001 | continuity-sensitive calmness is proven by ExperienceContinuityControlEvidence | release | watching | watch | on_path | 39 | ROLE_RELEASE_MANAGER |
| RISK_BOOKING_002 | ExternalConfirmationGate governs ambiguous booking and dispatch truth | integration | watching | watch | on_path | 39 | ROLE_INTEROPERABILITY_LEAD |
| RISK_EXT_PHARMACY_PROVIDER_GAP | Pharmacy directory, transport, or outcome observation posture remains weak | external_dependency | watching | watch | on_path | 39 | ROLE_PHARMACY_DOMAIN_LEAD |

        ## Required Forensic Coverage

        | Finding | Coverage status | Mapped risks |
| --- | --- | --- |
| FINDING_091 | watching | RISK_MUTATION_003, RISK_016_CANONICAL_CLOSURE_DRIFT, RISK_MUTATION_002, GAP_016_SCATTERED_DECISION_FREEZE, FINDING_091, GAP_016_PHASE0_CONTROL_PLANE_LOCALITY, RISK_MUTATION_001, RISK_UI_002 |
| FINDING_095 | watching | FINDING_095, RISK_RUNTIME_001, GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT, FINDING_091, GAP_016_PHASE0_CONTROL_PLANE_LOCALITY |
| FINDING_104 | watching | FINDING_095, RISK_ASSURANCE_001, RISK_RUNTIME_001, FINDING_112, FINDING_119, GAP_016_PHASE0_CONTROL_PLANE_LOCALITY |
| FINDING_105 | watching | RISK_ASSURANCE_001, GAP_016_PHASE0_CONTROL_PLANE_LOCALITY |
| FINDING_106 | watching | RISK_ASSURANCE_001, GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT |
| FINDING_107 | watching | FINDING_118, RISK_ASSURANCE_001, RISK_MUTATION_003, GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY, GAP_016_PHASE0_CONTROL_PLANE_LOCALITY |
| FINDING_108 | watching | RISK_ASSURANCE_001 |
| FINDING_109 | watching | RISK_ASSURANCE_001 |
| FINDING_110 | watching | RISK_ASSURANCE_001, RISK_MUTATION_003 |
| FINDING_111 | watching | RISK_ASSURANCE_001 |
| FINDING_112 | open_or_mitigating | RISK_EXT_COMMS_VENDOR_DELAY, RISK_MUTATION_003, RISK_RESTORE_EVIDENCE_STALENESS, FINDING_112 |
| FINDING_113 | watching | RISK_ASSURANCE_001 |
| FINDING_114 | open_or_mitigating | RISK_EXT_NHS_LOGIN_DELAY, FINDING_114, GAP_016_TENANT_SCOPE_DRIFT |
| FINDING_115 | watching | FINDING_115, GAP_016_ARTIFACT_MODE_TRUTH, RISK_UI_002 |
| FINDING_116 | watching | RISK_MUTATION_003, RISK_016_DISCLOSURE_FENCE_DRIFT, FINDING_116, RISK_UI_002 |
| FINDING_117 | watching | RISK_UI_001, RISK_UI_002 |
| FINDING_118 | watching | FINDING_118, GAP_016_DESIGN_RUNTIME_PUBLICATION_DRIFT, RISK_RUNTIME_001 |
| FINDING_119 | watching | RISK_ASSURANCE_001, RISK_MUTATION_003, GAP_016_OPS_GOVERNANCE_CONTINUITY_SPLIT, FINDING_119 |
| FINDING_120 | watching | GAP_016_PATIENT_DEGRADED_ROUTE_LOCALITY, RISK_UI_002 |

        ## Notes

        - Risks linked to critical-path milestones or critical gates are explicitly scored and marked so later gate tasks can fail closed.
        - Resolved architecture gaps remain present as retired or guarded rows so seq_020 can still consume them as evidence.
        - Simulator or manual fallback never upgrades a dependency to fully healthy status.
