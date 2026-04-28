# 121 DCB0129 Clinical Risk Management Plan

This document establishes the initial manufacturer-side DCB0129 clinical risk management baseline for Vecells. It is deliberately machine-readable and source-traceable rather than a one-off PDF narrative.

## Standards Baseline

- `standards_version`: `NHS_CLINICAL_SAFETY_BASELINE_REVIEWED_2026_04_14`
- `manufacturer_standard`: `DCB0129`
- `deployer_companion_standard`: `DCB0160`
- `reviewed_at`: `2026-04-14`
- `review_note`: Baseline reviewed on 2026-04-14 against the current NHS clinical safety guidance posture and the local Vecells blueprint corpus. Keep the seed pack versioned because NHS clinical safety standards and onboarding expectations may refresh.

## Boundary

- Manufacturer scope: architecture, seeded hazards, controls, evidence ownership, change-control hooks, and independent-review policy for Vecells as a supplier product.
- Deployer scope: local operational workflow acceptance, local pathway signoff, and DCB0160 deployment evidence remain separate follow-on packs.

## Section A — `Mock_now_execution`

- Seed the DCB0129 hazard register, safety-case outline, review events, and traceability table now.
- Use current blueprint law, current upstream machine-readable artifacts, and placeholder evidence owners where later phases are still pending.
- Treat missing named owners and future live-provider evidence as explicit gaps, not silent omissions.

## Section B — `Actual_production_strategy_later`

- Attach named Clinical Safety Officer, named independent reviewer roster, real provider onboarding evidence, and live rehearsal evidence to the same schema rather than replacing it.
- Promote placeholder evidence rows to live evidence rows while preserving stable hazard IDs, control IDs, and review-event IDs.
- Re-run the same validator before every release, onboarding pack, or major workflow change.

## Governance Roles

| Role ID | Role |
| --- | --- |
| ROLE_MANUFACTURER_CSO | Manufacturer Clinical Safety Officer (provisional placeholder) |
| ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER | Independent Clinical Safety Reviewer (provisional placeholder) |
| ROLE_CLINICAL_SAFETY_COORDINATOR | Clinical Safety Coordinator |
| ROLE_IDENTITY_DOMAIN_LEAD | Identity Domain Lead |
| ROLE_TRIAGE_RULESET_OWNER | Triage Ruleset Owner |
| ROLE_RELEASE_MANAGER | Release Manager |
| ROLE_BOOKING_DOMAIN_LEAD | Booking Domain Lead |
| ROLE_NETWORK_COORDINATION_LEAD | Network Coordination Lead |
| ROLE_PHARMACY_DOMAIN_LEAD | Pharmacy Domain Lead |
| ROLE_SUPPORT_WORKFLOW_LEAD | Support Workflow Lead |
| ROLE_ASSISTIVE_SAFETY_COORDINATOR | Assistive Safety Coordinator |
| ROLE_PRODUCT_SAFETY_APPROVER | Product Safety Approver |

## Review Cadence

| Review Event | Purpose | Type | Owner | Independent Reviewer |
| --- | --- | --- | --- | --- |
| REV_ANNUAL_BASELINE_REVIEW | Annual DCB0129 baseline review | scheduled | ROLE_MANUFACTURER_CSO | ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER |
| REV_RULESET_CHANGE_DELTA | Clinical ruleset delta review | change_triggered | ROLE_TRIAGE_RULESET_OWNER | ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER |
| REV_IDENTITY_AND_TELEPHONY_CHANGE | Identity, callback, and telephony safety review | change_triggered | ROLE_IDENTITY_DOMAIN_LEAD | ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER |
| REV_BOOKING_AND_NETWORK_CHANGE | Booking and network safety review | change_triggered | ROLE_BOOKING_DOMAIN_LEAD | ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER |
| REV_PHARMACY_CHANGE | Pharmacy safety review | change_triggered | ROLE_PHARMACY_DOMAIN_LEAD | ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER |
| REV_SUPPORT_AND_RELEASE_DRIFT | Support replay and publication drift review | change_triggered | ROLE_RELEASE_MANAGER | ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER |
| REV_ASSISTIVE_RELEASE_CHANGE | Assistive release and approval review | change_triggered | ROLE_ASSISTIVE_SAFETY_COORDINATOR | ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER |

## Prerequisite Snapshot

| Prerequisite | Artifact | Status | Purpose |
| --- | --- | --- | --- |
| PREREQ_REQ_TRACEABILITY_BASELINE | data/analysis/cross_phase_invariants.json | available | Canonical invariant anchors used by hazard-to-control traceability. |
| PREREQ_MASTER_RISK_REGISTER | data/analysis/master_risk_register.json | available | Existing programme risk posture and manufacturer CSO ownership baseline. |
| PREREQ_MUTATION_GATE | data/analysis/live_mutation_gate_rules.json | available | Stale-writable and decision-epoch safety controls. |
| PREREQ_DUPLICATE_CLUSTER | data/analysis/duplicate_cluster_manifest.json | available | Replay, silent merge, and same-request attach controls. |
| PREREQ_REACHABILITY_SNAPSHOT | data/analysis/contact_route_snapshot_manifest.json | available | Reachability and callback dependency safety controls. |
| PREREQ_EVIDENCE_ASSIMILATION | data/analysis/evidence_assimilation_casebook.json | available | Canonical evidence classification, material delta, and safety preemption controls. |
| PREREQ_BOOKING_CAPABILITY | data/analysis/gp_booking_capability_evidence.json | available | Booking capability and confirmation truth controls. |
| PREREQ_GATEWAY_SURFACES | data/analysis/gateway_surface_manifest.json | available | Audience-surface runtime binding and route publication controls. |
| PREREQ_RELEASE_PARITY | data/analysis/release_publication_parity_records.json | available | Release/publication parity control anchor for calm or writable posture. |
| PREREQ_RUNTIME_TOPOLOGY | data/analysis/runtime_topology_manifest.json | available | Runtime topology and trust-boundary baseline for safety controls. |
| PREREQ_EXTERNAL_ASSURANCE_OBLIGATIONS | data/analysis/external_assurance_obligations.csv | available | Existing external-assurance workstream split between supplier and deployer obligations. |
| PREREQ_PHARMACY_ACCESS_PATHS | data/analysis/pharmacy_referral_transport_decision_register.json | available | Seeded pharmacy referral and transport truth used by the pharmacy hazards. |

## Artifact Set

- [`121_dcb0129_clinical_risk_management_plan.md`](../../docs/assurance/121_dcb0129_clinical_risk_management_plan.md)
- [`121_dcb0129_hazard_log_structure.md`](../../docs/assurance/121_dcb0129_hazard_log_structure.md)
- [`121_dcb0129_clinical_safety_case_structure.md`](../../docs/assurance/121_dcb0129_clinical_safety_case_structure.md)
- [`121_hazard_identification_and_control_taxonomy.md`](../../docs/assurance/121_hazard_identification_and_control_taxonomy.md)
- [`121_change_control_and_safety_update_workflow.md`](../../docs/assurance/121_change_control_and_safety_update_workflow.md)
- [`dcb0129_hazard_register.json`](../../data/assurance/dcb0129_hazard_register.json)
- [`dcb0129_hazard_register.csv`](../../data/assurance/dcb0129_hazard_register.csv)
- [`dcb0129_hazard_to_control_traceability.csv`](../../data/assurance/dcb0129_hazard_to_control_traceability.csv)
- [`dcb0129_safety_case_outline.json`](../../data/assurance/dcb0129_safety_case_outline.json)
- [`dcb0129_review_events.json`](../../data/assurance/dcb0129_review_events.json)
- [`validate_dcb0129_seed_pack.py`](../../tools/assurance/validate_dcb0129_seed_pack.py)
