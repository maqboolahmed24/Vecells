# Scope Decision Log

## Upstream inputs consumed

- `requirement_registry.jsonl`: 1453 rows
- `summary_conflicts.json`: 19 discrepancy rows
- `cross_phase_conformance_seed.json`: 10 seeded rows

## DECISION_SCOPE_001

- Source statement: Programme baseline text states that the current completion line is Phases 0 to 6, Phase 8, and Phase 9, with Phase 7 deferred.
- Normalized interpretation: Treat Phase 7 as a designed but deferred channel expansion. Current delivery baseline excludes embedded NHS App rollout while still inventorying it.
- Reason: This closes the deferred-channel ambiguity and keeps milestone ownership aligned with the prior reconciliation pack.
- Source refs: blueprint-init.md#14. Programme Baseline With NHS App Deferred; phase-cards.md#Programme Baseline Update (NHS App Deferred)
- Upstream refs: docs/analysis/02_summary_reconciliation_decisions.md#SCOPE_DEFERRED_NHS_APP; docs/analysis/02_cross_phase_conformance_seed.md
- Affected capability ids: cap_nhs_app_embedded_channel, ng_native_nhs_app_current_baseline, cap_operational_analytics_and_continuity_evidence
- Assumption: ASSUMPTION_SCOPE_001: Deferring embedded NHS App rollout does not invalidate the web, phone, and support baseline as long as the phase-7 contracts remain designed and inventoried.
- Risk: RISK_SCOPE_001: Delayed embedded rollout increases later integration and assurance work, so phase-7 contracts must remain visible in planning even while deferred.

## DECISION_SCOPE_002

- Source statement: Blueprint orientation defines Vecells as demand orchestration for primary care and says appointment is only one endpoint.
- Normalized interpretation: Define the product boundary around governed request lineages and endpoint routing, not around appointment search and booking alone.
- Reason: This closes the scattered mission gap and creates a baseline that later engineering can test against.
- Source refs: blueprint-init.md#1. Product definition; blueprint-init.md#4. The end-to-end patient journey
- Upstream refs: none
- Affected capability ids: cap_unified_intake_and_safety_pipeline, ng_appointments_first_product_shape
- Assumption: none
- Risk: none

## DECISION_SCOPE_003

- Source statement: Web, NHS App jump-off, and phone are described as one access experience with one pipeline and telephony parity.
- Normalized interpretation: Treat all ingress modes as variants of one intake lineage and forbid a phone-only back-office path.
- Reason: This resolves the channel-vs-product boundary gap and makes parity enforceable.
- Source refs: blueprint-init.md#2. Core product surfaces; phase-0-the-foundation-protocol.md#4. Canonical ingest and request promotion
- Upstream refs: none
- Affected capability ids: cap_unified_intake_and_safety_pipeline, cap_patient_portal_account_and_communications_shell, ng_separate_phone_back_office_workflow
- Assumption: none
- Risk: none

## DECISION_SCOPE_004

- Source statement: Booking is split into local orchestration and network coordination, while supplier behavior stays behind adapter bindings.
- Normalized interpretation: Keep booking in scope as two coordinated capabilities and classify supplier-specific capability expansion as conditional behind adapter seams.
- Reason: This closes the booking-boundary ambiguity and prevents vendor lock-in from leaking into the core model.
- Source refs: blueprint-init.md#6. Booking and access continuity; phase-0-the-foundation-protocol.md#25E. BookingProviderAdapterBinding
- Upstream refs: none
- Affected capability ids: cap_local_booking_orchestrator, cap_truthful_booking_manage_waitlist_and_confirmation, cap_network_coordination_desk, cap_supplier_specific_capability_expansion, ng_supplier_logic_in_core_domain
- Assumption: ASSUMPTION_SCOPE_004: A common adapter contract can cover the current local-booking and network-booking baseline without exposing every supplier-specific convenience feature on day one.
- Risk: RISK_SCOPE_004: If a baseline deployment depends on a supplier-only capability that is not normalized into the adapter contract, launch scope will drift or fragment.

## DECISION_SCOPE_005

- Source statement: Pharmacy First is defined as a structured referral and closure loop rather than a direct GP record mutation path.
- Normalized interpretation: Keep eligibility, choice, consent, dispatch, bounce-back, and outcome reconciliation in scope, and reject direct GP record mutation as part of the Vecells product boundary.
- Reason: This closes the pharmacy boundary ambiguity and preserves the intended operational role of the platform.
- Source refs: blueprint-init.md#7. Pharmacy First pathway; phase-cards.md#Card 7: Phase 6 - The Pharmacy Loop
- Upstream refs: none
- Affected capability ids: cap_pharmacy_referral_dispatch_and_outcome_loop, ng_direct_gp_record_mutation_for_pharmacy
- Assumption: none
- Risk: none

## DECISION_SCOPE_006

- Source statement: Support, operations, governance, runtime/release, analytics, assurance, and continuity proof are treated as foundational controls across the corpus.
- Normalized interpretation: Classify control-plane shells and evidence systems as baseline scope, not as post-launch hardening or BI backlog.
- Reason: This resolves the feature-vs-control-plane ambiguity and keeps baseline completion aligned with Phase 9 and runtime publication law.
- Source refs: blueprint-init.md#11. Analytics and assurance; blueprint-init.md#12. Practical engineering shape; phase-9-the-assurance-ledger.md#Rule 1: evidence comes from the system, not from retrospective narrative
- Upstream refs: docs/analysis/02_summary_reconciliation_decisions.md; docs/analysis/02_cross_phase_conformance_seed.md
- Affected capability ids: cap_authorization_consent_and_break_glass_governance, cap_support_workspace_replay_and_repair, cap_operations_console_control_room, cap_governance_and_admin_shell, cap_assurance_ledger_and_evidence_graph, cap_runtime_release_and_publication_control_plane, cap_operational_analytics_and_continuity_evidence, ng_control_plane_as_post_hoc_add_on
- Assumption: none
- Risk: none

## DECISION_SCOPE_007

- Source statement: Identity binding, authorization, and consent are distinct contracts; login success is not enough to claim or mutate.
- Normalized interpretation: Keep identity proof, claim, writable authority, consent scope, and break-glass posture separate in the scope boundary.
- Reason: This closes the identity and claim ambiguity and preserves the canonical patientRef and auth model normalized in the prior task.
- Source refs: blueprint-init.md#10. Identity, consent, security, and policy; phase-0-the-foundation-protocol.md#3. Non-negotiable invariants
- Upstream refs: docs/analysis/02_summary_reconciliation_decisions.md#STATE_IDENTITY_AXIS_PATIENTREF; docs/analysis/02_canonical_term_glossary.md
- Affected capability ids: cap_identity_binding_and_session_authority, cap_authorization_consent_and_break_glass_governance, ng_auth_implies_claim_or_consent, cap_optional_pds_enrichment
- Assumption: none
- Risk: none

## DECISION_SCOPE_008

- Source statement: Assistive behavior is optional, bounded, and subordinate to human approval; model rollout is cohort-governed.
- Normalized interpretation: Keep a bounded assistive sidecar in baseline scope because Phase 8 is in the completion line, but treat broad vendor-backed rollout as conditional rather than universal.
- Reason: This closes the AI posture ambiguity without pushing Phase 8 out of the baseline.
- Source refs: vecells-complete-end-to-end-flow.md#Baseline invariants; phase-8-the-assistive-layer.md#Pilot rollout, controlled slices, and formal exit gate
- Upstream refs: none
- Affected capability ids: cap_bounded_assistive_workspace_sidecar, cap_model_vendor_assistive_rollout, ng_mandatory_ai_or_autonomous_decisioning
- Assumption: ASSUMPTION_SCOPE_008: Baseline completeness for Phase 8 means the bounded control plane and at least a narrow governed rollout path exist, not that every tenant or route has visible assistive chrome.
- Risk: RISK_SCOPE_008: Teams may wrongly read Phase 8 as universal AI rollout unless the cohort and freeze contracts stay explicit in planning and release review.

## DECISION_SCOPE_009

- Source statement: LifecycleCoordinator owns cross-domain milestone derivation and request closure, while child domains emit facts and gates.
- Normalized interpretation: Make child-domain direct writes to Request.workflowState or closure a hard rejection criterion and keep downstream domains case-local first.
- Reason: This resolves state-ownership drift and prevents phase-local workflows from redefining canonical request meaning.
- Source refs: blueprint-init.md#3. The canonical request model; phase-0-the-foundation-protocol.md#3. Non-negotiable invariants
- Upstream refs: docs/analysis/02_summary_reconciliation_decisions.md#OWNERSHIP_LIFECYCLE_COORDINATOR
- Affected capability ids: cap_clinical_workspace_review_and_endpoint_selection, cap_network_coordination_desk, ng_direct_request_state_writes_from_child_domains
- Assumption: none
- Risk: none

## DECISION_SCOPE_010

- Source statement: Reservation truth, external confirmation, and outcome reconciliation are separate from calm user-facing success states.
- Normalized interpretation: Make truthful waitlist, booking, hub, pharmacy, and manage semantics part of scope, and reject countdown-based or transport-only reassurance.
- Reason: This closes the false-reassurance boundary for booking and pharmacy journeys.
- Source refs: phase-0-the-foundation-protocol.md#3. Non-negotiable invariants; blueprint-init.md#6. Booking and access continuity; blueprint-init.md#7. Pharmacy First pathway
- Upstream refs: docs/analysis/02_summary_reconciliation_decisions.md#TRUTH_EXTERNAL_CONFIRMATION_GATE
- Affected capability ids: cap_truthful_booking_manage_waitlist_and_confirmation, cap_pharmacy_referral_dispatch_and_outcome_loop, ng_false_reservation_truth_from_countdown, ng_optimistic_booked_reassurance
- Assumption: none
- Risk: none

## DECISION_SCOPE_011

- Source statement: Bounded contexts, gateway/BFF boundaries, outbox reliability, quarantine, append-only audit, and recovery posture are named as mandatory architecture, not implementation detail.
- Normalized interpretation: Keep modular bounded contexts, append-only audit, object-store quarantine, event bus plus outbox, gateway boundaries, and recovery-safe runtime publication inside the scope boundary.
- Reason: This converts broad architecture prose into enforceable platform scope and blocks drift toward an unstructured monolith, coupled microservice sprawl, or direct browser-to-service access.
- Source refs: blueprint-init.md#12. Practical engineering shape; platform-frontend-blueprint.md#Frontend/backend integration boundary contract; platform-runtime-and-release-blueprint.md#Runtime rules; phase-0-the-foundation-protocol.md#4.3A Artifact quarantine and fallback review
- Upstream refs: none
- Affected capability ids: cap_fallback_review_and_artifact_quarantine, cap_support_workspace_replay_and_repair, cap_operations_console_control_room, cap_governance_and_admin_shell, cap_assurance_ledger_and_evidence_graph, cap_runtime_release_and_publication_control_plane, cap_external_adapter_seams_and_baseline_rails, ng_auto_merge_duplicates_without_review, ng_direct_browser_to_adapter_or_internal_service_access
- Assumption: none
- Risk: none

## DECISION_SCOPE_012

- Source statement: Supplier and model-vendor variability must resolve through adapter contracts or rollout contracts, not through core-domain branching.
- Normalized interpretation: Treat supplier-specific capability expansion and model-vendor rollout as conditional scope behind published seams, while keeping the seam infrastructure itself in baseline scope.
- Reason: This preserves a stable baseline while allowing future expansion without reopening product identity.
- Source refs: phase-8-the-assistive-layer.md#Pilot rollout, controlled slices, and formal exit gate; platform-runtime-and-release-blueprint.md#AdapterContractProfile; phase-0-the-foundation-protocol.md#25E. BookingProviderAdapterBinding
- Upstream refs: docs/analysis/02_summary_reconciliation_decisions.md
- Affected capability ids: cap_local_booking_orchestrator, cap_bounded_assistive_workspace_sidecar, cap_external_adapter_seams_and_baseline_rails, cap_model_vendor_assistive_rollout, cap_supplier_specific_capability_expansion, ng_supplier_logic_in_core_domain
- Assumption: ASSUMPTION_SCOPE_012: The current baseline can normalize the common denominator of supplier and model capabilities while leaving richer options cohort-gated or adapter-specific.
- Risk: RISK_SCOPE_012: If conditional capability expansion leaks into core workflow language, teams will mistake a supplier-specific edge for baseline product law.

## DECISION_SCOPE_013

- Source statement: The canonical request and identity model works with nullable patientRef derived from verified IdentityBinding, so extra demographic enrichment is not required for baseline scope.
- Normalized interpretation: Classify PDS enrichment as future optional and keep IdentityBinding as the canonical baseline authority.
- Reason: This prevents a new external dependency from being smuggled into the baseline identity boundary without corpus support.
- Source refs: phase-0-the-foundation-protocol.md#3. Non-negotiable invariants; blueprint-init.md#10. Identity, consent, security, and policy
- Upstream refs: docs/analysis/02_summary_reconciliation_decisions.md#STATE_IDENTITY_AXIS_PATIENTREF
- Affected capability ids: cap_identity_binding_and_session_authority, cap_optional_pds_enrichment
- Assumption: ASSUMPTION_SCOPE_013: Baseline delivery can achieve safe identity matching and claim without live PDS enrichment because the corpus already defines verified IdentityBinding and repair flows.
- Risk: RISK_SCOPE_013: Demographic quality issues may raise later demand for PDS enrichment, so this remains inventoried as conditional future scope rather than ignored.

