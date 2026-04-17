            # 17 Merge Gate Policy

            Merge gates are evidence-driven, not title-driven. A gate is only ready when its incoming milestone work is complete and the bound artifact, dependency, risk-posture, and conformance refs are current.

            Gate rules:
            - `No later current-baseline sequence milestone may advance ahead of an earlier current-baseline sequence milestone. Deferred and optional sequence rows stay inventoried, but they do not block current-baseline advancement.`
            - `No merge or later sequence gate may advance until the active contiguous parallel block and its declared long-lead companion tracks are complete.`
            - `No phase exit or programme completion claim is valid while the bound phase conformance row or cross-phase scorecard is stale or blocked.`
            - `Final promotion and BAU readiness require runtime publication, verification, governance proof, operational proof, and recovery readiness on the same tuple.`

            ## Gate Matrix

            | Gate | Type | Scope | Incoming | Status | Artifacts | Rules |

| --- | --- | --- | --- | --- | --- | --- |
| GATE_PLAN_EXTERNAL_ENTRY | phase_entry | current | MS_PLAN_DISCOVERY_BASELINE, MS_PLAN_EXECUTION_GRAPH, MS_PLAN_RISK_AND_TRACEABILITY_FOUNDATION | in_progress | programme_milestones.json; master_risk_register.json; requirement_task_traceability.csv; phase0_gate_verdict.json | RULE_SEQ_SCOPE_AWARE_ORDER; RULE_LONG_LEAD_VISIBLE |
| GATE_EXTERNAL_TO_FOUNDATION | external_readiness | current | MS_EXT_STRATEGY_AND_ACCOUNT_PLAN, MS_EXT_NHS_LOGIN_ONBOARDING, MS_EXT_IM1_SCAL_READINESS, MS_EXT_MESH_ACCESS, MS_EXT_COMMS_AND_SCAN_VENDORS, MS_EXT_PROVIDER_PATHS_AND_EVIDENCE, MS_EXT_SIMULATOR_AND_MANUAL_GATE_FREEZE | blocked | external_dependencies.json; external_assurance_obligations.csv; dependency_simulator_strategy.json; integration_assumption_freeze | RULE_LONG_LEAD_VISIBLE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_OPTIONAL_PDS_ENABLEMENT | external_readiness | optional | MS_EXT_OPTIONAL_PDS_ENRICHMENT | optional | PDSSandboxRequest; PDSFeatureFlagPlan | RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P0_0A_TO_0B | phase_entry | current | MS_P0_0A_DELIVERY_SKELETON | blocked | monorepo_boundary_rules; bootstrap_runbooks; ci_pipeline_bootstrap | RULE_SEQ_SCOPE_AWARE_ORDER |
| GATE_P0_0B_TO_0C | phase_entry | current | MS_P0_0B_DOMAIN_KERNEL | blocked | canonical_domain_glossary.csv; state_machines.json; service_runtime_matrix.csv | RULE_SEQ_SCOPE_AWARE_ORDER |
| GATE_P0_0C_TO_0D | phase_entry | current | MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE | blocked | runtime_workload_families.json; gateway_surface_matrix.csv; release_gate_matrix.csv | RULE_SEQ_SCOPE_AWARE_ORDER |
| GATE_P0_0D_TO_0E | phase_entry | current | MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW | blocked | acting_scope_tuple_matrix.csv; idempotency_and_replay_rules.json; dependency_truth_and_fallback_matrix.csv | RULE_SEQ_SCOPE_AWARE_ORDER |
| GATE_P0_PARALLEL_FOUNDATION_OPEN | phase_entry | current | MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS | blocked | playwright_coverage_matrix.csv; ui_contract_publication_matrix.csv; dependency_simulator_strategy.json | RULE_SEQ_SCOPE_AWARE_ORDER; RULE_PAR_BLOCK_COMPLETE |
| GATE_P0_0F_TO_0G | phase_entry | current | MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW | blocked | audience_surface_inventory.csv; gateway_surface_matrix.csv; release_publication_parity_pack | RULE_SEQ_SCOPE_AWARE_ORDER |
| GATE_P0_LONG_LEAD_ASSURANCE_MERGE | par_block_merge | current | MS_P0_0G_DCB0129_SAFETY_CASE, MS_P0_0G_DSPT_READINESS, MS_P0_0G_IM1_SCAL_ASSURANCE, MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE, MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE | blocked | safety_hazard_register_seed.csv; dspt_gap_assessment_pack; im1_scal_readiness_pack; nhs_login_onboarding_evidence_pack; dpia_backlog_pack | RULE_LONG_LEAD_VISIBLE; RULE_PAR_BLOCK_COMPLETE |
| GATE_P0_EXIT | phase_exit | current | MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF | blocked | release_candidate_freeze_pack; foundation_exit_evidence_pack; backup_restore_rehearsal_pack; cross_phase_conformance_scorecard_current_baseline | RULE_CONFORMANCE_ROW_FRESH; RULE_RUNTIME_PUBLICATION_AND_OPS_PROOF |
| GATE_P1_PARALLEL_MERGE | par_block_merge | current | MS_P1_PARALLEL_INTAKE_IMPLEMENTATION | blocked | phase1_end_to_end_evidence_pack | RULE_PAR_BLOCK_COMPLETE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P1_EXIT | phase_exit | current | MS_P1_MERGE_AND_PROOF | blocked | phase1_exit_verdict; phase1_end_to_end_evidence_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P2_PARALLEL_MERGE | par_block_merge | current | MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY | blocked | phase2_identity_and_echoes_pack | RULE_PAR_BLOCK_COMPLETE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P2_EXIT | phase_exit | current | MS_P2_PROOF_AND_REGRESSION | blocked | phase2_exit_verdict; phase2_regression_evidence_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_XC_PARALLEL_MERGE | par_block_merge | current | MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT | blocked | patient_account_surface_pack; support_workspace_pack | RULE_PAR_BLOCK_COMPLETE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_XC_EXIT | programme_conformance | current | MS_XC_MERGE_AND_PROOF | blocked | cross_phase_exit_verdict; cross_phase_continuity_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P3_PARALLEL_MERGE | par_block_merge | current | MS_P3_PARALLEL_TRIAGE_AND_CALLBACK | blocked | p3_implementation_pack | RULE_PAR_BLOCK_COMPLETE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P3_EXIT | phase_exit | current | MS_P3_MERGE_AND_PROOF | blocked | p3_exit_verdict; p3_proof_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P4_PARALLEL_MERGE | par_block_merge | current | MS_P4_PARALLEL_BOOKING_IMPLEMENTATION | blocked | p4_implementation_pack | RULE_PAR_BLOCK_COMPLETE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P4_EXIT | phase_exit | current | MS_P4_MERGE_CONFIG_AND_PROOF | blocked | p4_exit_verdict; p4_proof_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P5_PARALLEL_MERGE | par_block_merge | current | MS_P5_PARALLEL_NETWORK_IMPLEMENTATION | blocked | p5_implementation_pack | RULE_PAR_BLOCK_COMPLETE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P5_EXIT | phase_exit | current | MS_P5_MERGE_CONFIG_AND_PROOF | blocked | p5_exit_verdict; p5_proof_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P6_PARALLEL_MERGE | par_block_merge | current | MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION | blocked | p6_implementation_pack | RULE_PAR_BLOCK_COMPLETE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P6_EXIT | phase_exit | current | MS_P6_MERGE_CONFIG_AND_PROOF | blocked | p6_exit_verdict; p6_proof_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_POST6_SCOPE_SPLIT | programme_conformance | current | MS_POST6_SCOPE_SPLIT_GATE | blocked | scope_split_gate_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P7_DEFERRED_MERGE | par_block_merge | deferred | MS_P7_PARALLEL_EMBEDDED_CHANNEL | deferred | phase7_embedded_channel_pack | RULE_PAR_BLOCK_COMPLETE; RULE_LONG_LEAD_VISIBLE |
| GATE_P7_EXIT | phase_exit | deferred | MS_P7_MERGE_AND_PROOF | deferred | phase7_exit_verdict; phase7_proof_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_LONG_LEAD_VISIBLE |
| GATE_P8_PARALLEL_MERGE | par_block_merge | current | MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION | blocked | phase8_assistive_pack | RULE_PAR_BLOCK_COMPLETE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P8_EXIT | phase_exit | current | MS_P8_PROOF_AND_EXIT_PACK | blocked | phase8_exit_verdict; phase8_proof_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P9_PARALLEL_MERGE | par_block_merge | current | MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION | blocked | phase9_assurance_pack | RULE_PAR_BLOCK_COMPLETE; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_P9_EXIT | phase_exit | current | MS_P9_PROOF_AND_EXIT_PACK | blocked | phase9_exit_verdict; phase9_proof_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_CURRENT_BASELINE_CONFORMANCE | programme_conformance | current | MS_PRG_CURRENT_BASELINE_CONFORMANCE | blocked | cross_phase_conformance_scorecard_current_baseline | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_RELEASE_READINESS | seq_release | current | MS_PRG_RELEASE_READINESS | blocked | production_readiness_pack; dress_rehearsal_pack; final_verification_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_WAVE1_OBSERVATION | seq_release | current | MS_PRG_WAVE1_PROMOTION_AND_OBSERVATION | blocked | wave1_watch_tuple_pack; wave1_observation_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_OPTIONAL_ASSISTIVE_ENABLEMENT | programme_conformance | optional | MS_PRG_OPTIONAL_ASSISTIVE_VISIBLE_ENABLEMENT | optional | assistive_visible_cohort_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
| GATE_DEFERRED_NHSAPP_ENABLEMENT | programme_conformance | deferred | MS_PRG_DEFERRED_PHASE7_CONFORMANCE, MS_PRG_DEFERRED_NHSAPP_ENABLEMENT | deferred | nhsapp_manifest_enablement_pack | RULE_CONFORMANCE_ROW_FRESH; RULE_LONG_LEAD_VISIBLE |
| GATE_BAU_TRANSFER | programme_conformance | current | MS_PRG_MULTIWAVE_RELEASE, MS_PRG_BAU_HANDOVER_AND_ARCHIVE | blocked | bau_readiness_pack; release_to_bau_record; launch_evidence_archive | RULE_CONFORMANCE_ROW_FRESH; RULE_DEFERRED_PHASE7_NO_PROXY |
