# 121 DCB0129 Clinical Safety Case Structure

This document mirrors the architecture Vecells is actually building. It is the human-readable counterpart to [`dcb0129_safety_case_outline.json`](../../data/assurance/dcb0129_safety_case_outline.json).

## Section A — `Mock_now_execution`

- Use the current Phase 0 to Phase 9 architecture as the actual safety-case frame.
- Bind seeded controls to the same invariants, services, and runtime/publication laws already present in-repo.

## Section B — `Actual_production_strategy_later`

- Add signed evidence, challenge-set outputs, onboarding attestations, and deployer companion evidence to these same sections.
- Keep the architecture-layer and evidence IDs stable so later packs remain diffable.

## Safety Case Sections

| Section | Title | Evidence Refs |
| --- | --- | --- |
| SC-1 | Product scope, intended use, and manufacturer boundary | EVID_DCB0129_SEED_PACK_V1 |
| SC-2 | Safety governance, roles, and no-self-approval policy | EVID_RELEASE_APPROVAL_GRAPH_PLACEHOLDER_V1<br>EVID_CHANGE_DELTA_RECORD |
| SC-3 | Hazard identification method, taxonomy, and source traceability | EVID_DCB0129_SEED_PACK_V1<br>EVID_DUPLICATE_CLUSTER_VALIDATION |
| SC-4 | Control strategy by architectural layer | EVID_MUTATION_GATE_VALIDATION<br>EVID_GATEWAY_SURFACE_VALIDATION |
| SC-5 | Verification evidence plan and placeholder ownership | EVID_DCB0129_SEED_PACK_V1<br>EVID_IDENTITY_REPAIR_VALIDATION<br>EVID_ACCESS_GRANT_VALIDATION<br>EVID_EVIDENCE_ASSIMILATION_VALIDATION<br>EVID_DUPLICATE_CLUSTER_VALIDATION<br>EVID_MUTATION_GATE_VALIDATION<br>EVID_REACHABILITY_VALIDATION<br>EVID_COMMUNICATION_ENVELOPE_VALIDATION<br>EVID_TELEPHONY_READINESS_VALIDATION<br>EVID_RESERVATION_QUEUE_VALIDATION<br>EVID_BOOKING_CAPABILITY_PROOF<br>EVID_GATEWAY_SURFACE_VALIDATION<br>EVID_RELEASE_PARITY_VALIDATION<br>EVID_HUB_POLICY_PLACEHOLDER_V1<br>EVID_PHARMACY_CONSENT_PLACEHOLDER_V1<br>EVID_PHARMACY_RECONCILIATION_PLACEHOLDER_V1<br>EVID_SUPPORT_REPLAY_VALIDATION<br>EVID_ASSISTIVE_APPROVAL_GRAPH_PLACEHOLDER_V1<br>EVID_ASSISTIVE_SHADOW_SLICE_PLACEHOLDER_V1<br>EVID_RELEASE_APPROVAL_GRAPH_PLACEHOLDER_V1<br>EVID_ASSURANCE_GRAPH_PLACEHOLDER_V1<br>EVID_CHANGE_DELTA_RECORD<br>EVID_WORKSPACE_TRUST_VALIDATION |
| SC-6 | Residual-risk review, review events, and signoff readiness | EVID_CHANGE_DELTA_RECORD<br>EVID_ASSURANCE_GRAPH_PLACEHOLDER_V1 |

## Control Strategy By Architecture Layer

| Layer | Purpose | Control Refs |
| --- | --- | --- |
| domain_invariants | Canonical domain invariants | CTRL_IDENTITY_REPAIR_FREEZE<br>CTRL_EVIDENCE_ASSIMILATION_PREEMPTION<br>CTRL_DUPLICATE_ATTACH_FENCE<br>CTRL_BOOKING_CONFIRMATION_GATE |
| runtime_and_publication | Runtime, publication, and writable posture controls | CTRL_SCOPED_MUTATION_AND_DECISION_EPOCH<br>CTRL_PUBLICATION_PARITY_AND_RUNTIME_BINDING<br>CTRL_WORKSPACE_TRUST_ENVELOPE |
| communications_and_reachability | Reachability, callback, telephony, and support replay controls | CTRL_REACHABILITY_AND_CALLBACK_EXPECTATION<br>CTRL_TELEPHONY_EVIDENCE_READINESS<br>CTRL_SUPPORT_REPLAY_RESTORE |
| booking_network_and_pharmacy | Booking, network, and pharmacy operational truth | CTRL_RESERVATION_TRUTH_AND_WAITLIST_FALLBACK<br>CTRL_HUB_VISIBILITY_POLICY<br>CTRL_PHARMACY_CONSENT_CHECKPOINT<br>CTRL_PHARMACY_DISPATCH_AND_OUTCOME_RECONCILIATION |
| assurance_and_change_control | Safety governance, evidence packaging, and no-self-approval | CTRL_ASSISTIVE_TRUST_AND_HUMAN_APPROVAL<br>CTRL_NO_SELF_APPROVAL_RELEASE_GRAPH<br>CTRL_ASSURANCE_LEDGER_PACKAGING<br>CTRL_MASTER_RISK_AND_NON_APPLICABILITY_RECORD |
