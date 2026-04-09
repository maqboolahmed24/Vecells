
            # 17 Programme Milestones And Gate Model

            Mission: Turn the serialized checklist roadmap into one executable milestone graph with strict sequence, scoped exceptions, parallel blocks, merge gates, long-lead dependency visibility, and current-baseline critical-path truth.

            Current baseline: phase_0, phase_1, phase_2, phase_3, phase_4, phase_5, phase_6, phase_8, phase_9
            Deferred baseline: phase_7

            Summary:
            - Milestones: 76
            - Merge gates: 38
            - Parallel tracks: 36
            - Current baseline milestones: 67
            - Deferred milestones: 7
            - Optional milestones: 2

            Execution law:
            - `No later current-baseline sequence milestone may advance ahead of an earlier current-baseline sequence milestone. Deferred and optional sequence rows stay inventoried, but they do not block current-baseline advancement.`
            - `No merge or later sequence gate may advance until the active contiguous parallel block and its declared long-lead companion tracks are complete.`
            - `No phase exit or programme completion claim is valid while the bound phase conformance row or cross-phase scorecard is stale or blocked.`
            - `Deferred Phase 7 artifacts may not be used as proxy evidence for current-baseline milestones, gates, release readiness, or BAU closure.`

            ## Milestone Matrix

            | Milestone | Phase | Class | Scope | Tasks | Path | Gate |
| --- | --- | --- | --- | --- | --- | --- |
| MS_PLAN_DISCOVERY_BASELINE | planning | planning | current | seq_001 -> seq_016 | on_path | GATE_PLAN_EXTERNAL_ENTRY |
| MS_PLAN_EXECUTION_GRAPH | planning | planning | current | seq_017 | on_path | GATE_PLAN_EXTERNAL_ENTRY |
| MS_PLAN_RISK_AND_TRACEABILITY_FOUNDATION | planning | planning | current | seq_018 -> seq_020 | on_path | GATE_PLAN_EXTERNAL_ENTRY |
| MS_EXT_STRATEGY_AND_ACCOUNT_PLAN | external_readiness | dependency_readiness | current | seq_021 -> seq_023 | on_path | GATE_EXTERNAL_TO_FOUNDATION |
| MS_EXT_NHS_LOGIN_ONBOARDING | external_readiness, phase_2 | dependency_readiness | current | seq_024 -> seq_025 | on_path | GATE_EXTERNAL_TO_FOUNDATION |
| MS_EXT_IM1_SCAL_READINESS | external_readiness, phase_0 | dependency_readiness | current | seq_026 | on_path | GATE_EXTERNAL_TO_FOUNDATION |
| MS_EXT_OPTIONAL_PDS_ENRICHMENT | external_readiness, phase_2 | dependency_readiness | optional | seq_027 | off_path | GATE_OPTIONAL_PDS_ENABLEMENT |
| MS_EXT_MESH_ACCESS | external_readiness, phase_5 | dependency_readiness | current | seq_028 | on_path | GATE_EXTERNAL_TO_FOUNDATION |
| MS_EXT_DEFERRED_NHSAPP_ECOSYSTEM | external_readiness, phase_7 | deferred_channel | deferred | seq_029 -> seq_030 | off_path | GATE_DEFERRED_NHSAPP_ENABLEMENT |
| MS_EXT_COMMS_AND_SCAN_VENDORS | external_readiness, phase_1, phase_2 | dependency_readiness | current | seq_031 -> seq_035 | on_path | GATE_EXTERNAL_TO_FOUNDATION |
| MS_EXT_PROVIDER_PATHS_AND_EVIDENCE | external_readiness, phase_4, phase_6 | dependency_readiness | current | seq_036 -> seq_037 | on_path | GATE_EXTERNAL_TO_FOUNDATION |
| MS_EXT_SIMULATOR_AND_MANUAL_GATE_FREEZE | external_readiness, phase_0 | dependency_readiness | current | seq_038 -> seq_040 | on_path | GATE_EXTERNAL_TO_FOUNDATION |
| MS_P0_0A_DELIVERY_SKELETON | phase_0 | foundation | current | seq_041 -> seq_045 | on_path | GATE_P0_0A_TO_0B |
| MS_P0_0B_DOMAIN_KERNEL | phase_0 | foundation | current | seq_046 -> par_082 | on_path | GATE_P0_0B_TO_0C |
| MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE | phase_0 | foundation | current | seq_050 -> par_094 | on_path | GATE_P0_0C_TO_0D |
| MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW | phase_0 | foundation | current | seq_053 -> par_102 | on_path | GATE_P0_0D_TO_0E |
| MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS | phase_0 | foundation | current | seq_058 -> par_114 | on_path | GATE_P0_PARALLEL_FOUNDATION_OPEN |
| MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW | phase_0 | foundation | current | par_115 -> seq_131 | on_path | GATE_P0_0F_TO_0G |
| MS_P0_0G_DCB0129_SAFETY_CASE | phase_0 | dependency_readiness | current | par_121 | on_path | GATE_P0_LONG_LEAD_ASSURANCE_MERGE |
| MS_P0_0G_DSPT_READINESS | phase_0 | dependency_readiness | current | par_122 | on_path | GATE_P0_LONG_LEAD_ASSURANCE_MERGE |
| MS_P0_0G_IM1_SCAL_ASSURANCE | phase_0 | dependency_readiness | current | par_123 | on_path | GATE_P0_LONG_LEAD_ASSURANCE_MERGE |
| MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE | phase_0 | dependency_readiness | current | par_124 | on_path | GATE_P0_LONG_LEAD_ASSURANCE_MERGE |
| MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE | phase_0 | assurance_gate | current | par_125 -> par_126 | on_path | GATE_P0_LONG_LEAD_ASSURANCE_MERGE |
| MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF | phase_0 | release_gate | current | seq_132 -> seq_138 | on_path | GATE_P0_EXIT |
| MS_P1_DEFINITION_AND_ENTRY | phase_1 | phase_delivery | current | seq_139 -> seq_143 | on_path | GATE_P1_PARALLEL_MERGE |
| MS_P1_PARALLEL_INTAKE_IMPLEMENTATION | phase_1 | phase_delivery | current | par_144 -> par_163 | on_path | GATE_P1_PARALLEL_MERGE |
| MS_P1_MERGE_AND_PROOF | phase_1 | phase_delivery | current | seq_164 -> seq_168 | on_path | GATE_P1_EXIT |
| MS_P1_EXIT_GATE | phase_1 | release_gate | current | seq_169 | on_path | GATE_P1_EXIT |
| MS_P2_DEFINITION_AND_ENTRY | phase_2 | phase_delivery | current | seq_170 -> seq_174 | on_path | GATE_P2_PARALLEL_MERGE |
| MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY | phase_2 | phase_delivery | current | par_175 -> par_201 | on_path | GATE_P2_PARALLEL_MERGE |
| MS_P2_EXTERNAL_CONFIG | phase_2 | dependency_readiness | current | seq_202 -> seq_203 | on_path | GATE_P2_EXIT |
| MS_P2_PROOF_AND_REGRESSION | phase_2 | phase_delivery | current | seq_204 -> seq_207 | on_path | GATE_P2_EXIT |
| MS_P2_EXIT_GATE | phase_2 | release_gate | current | seq_208 | on_path | GATE_P2_EXIT |
| MS_XC_ENTRY_GATE | cross_phase_controls | cross_phase_control | current | seq_209 | on_path | GATE_XC_PARALLEL_MERGE |
| MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT | cross_phase_controls | cross_phase_control | current | par_210 -> par_222 | on_path | GATE_XC_PARALLEL_MERGE |
| MS_XC_MERGE_AND_PROOF | cross_phase_controls | cross_phase_control | current | seq_223 -> seq_224 | on_path | GATE_XC_EXIT |
| MS_XC_EXIT_GATE | cross_phase_controls | release_gate | current | seq_225 | on_path | GATE_XC_EXIT |
| MS_P3_DEFINITION_AND_ENTRY | phase_3 | phase_delivery | current | seq_226 -> seq_230 | on_path | GATE_P3_PARALLEL_MERGE |
| MS_P3_PARALLEL_TRIAGE_AND_CALLBACK | phase_3 | phase_delivery | current | par_231 -> par_269 | on_path | GATE_P3_PARALLEL_MERGE |
| MS_P3_MERGE_AND_PROOF | phase_3 | phase_delivery | current | seq_270 -> seq_276 | on_path | GATE_P3_EXIT |
| MS_P3_EXIT_GATE | phase_3 | release_gate | current | seq_277 | on_path | GATE_P3_EXIT |
| MS_P4_DEFINITION_AND_ENTRY | phase_4 | phase_delivery | current | seq_278 -> seq_281 | on_path | GATE_P4_PARALLEL_MERGE |
| MS_P4_PARALLEL_BOOKING_IMPLEMENTATION | phase_4 | phase_delivery | current | par_282 -> par_303 | on_path | GATE_P4_PARALLEL_MERGE |
| MS_P4_MERGE_CONFIG_AND_PROOF | phase_4 | phase_delivery | current | seq_304 -> seq_309 | on_path | GATE_P4_EXIT |
| MS_P4_EXIT_GATE | phase_4 | release_gate | current | seq_310 | on_path | GATE_P4_EXIT |
| MS_P5_DEFINITION_AND_ENTRY | phase_5 | phase_delivery | current | seq_311 -> seq_314 | on_path | GATE_P5_PARALLEL_MERGE |
| MS_P5_PARALLEL_NETWORK_IMPLEMENTATION | phase_5 | phase_delivery | current | par_315 -> par_334 | on_path | GATE_P5_PARALLEL_MERGE |
| MS_P5_MERGE_CONFIG_AND_PROOF | phase_5 | phase_delivery | current | seq_335 -> seq_340 | on_path | GATE_P5_EXIT |
| MS_P5_EXIT_GATE | phase_5 | release_gate | current | seq_341 | on_path | GATE_P5_EXIT |
| MS_P6_DEFINITION_AND_ENTRY | phase_6 | phase_delivery | current | seq_342 -> seq_345 | on_path | GATE_P6_PARALLEL_MERGE |
| MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION | phase_6 | phase_delivery | current | par_346 -> par_365 | on_path | GATE_P6_PARALLEL_MERGE |
| MS_P6_MERGE_CONFIG_AND_PROOF | phase_6 | phase_delivery | current | seq_366 -> seq_371 | on_path | GATE_P6_EXIT |
| MS_P6_EXIT_GATE | phase_6 | release_gate | current | seq_372 | on_path | GATE_P6_EXIT |
| MS_POST6_SCOPE_SPLIT_GATE | phase_6, phase_7, phase_8, phase_9 | cross_phase_control | current | seq_373 | on_path | GATE_POST6_SCOPE_SPLIT |
| MS_P7_DEFINITION_AND_ENTRY | phase_7 | deferred_channel | deferred | par_374 -> par_376 | off_path | GATE_P7_DEFERRED_MERGE |
| MS_P7_PARALLEL_EMBEDDED_CHANNEL | phase_7 | deferred_channel | deferred | par_377 -> par_396 | off_path | GATE_P7_DEFERRED_MERGE |
| MS_P7_MERGE_AND_PROOF | phase_7 | deferred_channel | deferred | par_397 -> par_401 | off_path | GATE_P7_EXIT |
| MS_P7_EXIT_GATE | phase_7 | deferred_channel | deferred | par_402 | off_path | GATE_P7_EXIT |
| MS_P8_DEFINITION_AND_ENTRY | phase_8 | phase_delivery | current | par_403 -> par_405 | on_path | GATE_P8_PARALLEL_MERGE |
| MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION | phase_8 | phase_delivery | current | par_406 -> par_426 | on_path | GATE_P8_PARALLEL_MERGE |
| MS_P8_MERGE | phase_8 | phase_delivery | current | par_427 | on_path | GATE_P8_EXIT |
| MS_P8_PROOF_AND_EXIT_PACK | phase_8 | phase_delivery | current | par_428 -> par_430 | on_path | GATE_P8_EXIT |
| MS_P8_EXIT_GATE | phase_8 | assurance_gate | current | par_431 | on_path | GATE_P8_EXIT |
| MS_P9_DEFINITION_AND_ENTRY | phase_9 | phase_delivery | current | par_432 -> par_434 | on_path | GATE_P9_PARALLEL_MERGE |
| MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION | phase_9 | phase_delivery | current | par_435 -> par_463 | on_path | GATE_P9_PARALLEL_MERGE |
| MS_P9_MERGE | phase_9 | phase_delivery | current | par_464 | on_path | GATE_P9_EXIT |
| MS_P9_PROOF_AND_EXIT_PACK | phase_9 | phase_delivery | current | par_465 -> par_470 | on_path | GATE_P9_EXIT |
| MS_P9_EXIT_GATE | phase_9 | assurance_gate | current | par_471 | on_path | GATE_P9_EXIT |
| MS_PRG_CURRENT_BASELINE_CONFORMANCE | programme_release | assurance_gate | current | seq_472 | on_path | GATE_CURRENT_BASELINE_CONFORMANCE |
| MS_PRG_DEFERRED_PHASE7_CONFORMANCE | programme_release, phase_7 | deferred_channel | deferred | seq_473 | off_path | GATE_DEFERRED_NHSAPP_ENABLEMENT |
| MS_PRG_RELEASE_READINESS | programme_release | release_gate | current | seq_474 -> seq_481 | on_path | GATE_RELEASE_READINESS |
| MS_PRG_WAVE1_PROMOTION_AND_OBSERVATION | programme_release | release_gate | current | seq_482 -> seq_483 | on_path | GATE_WAVE1_OBSERVATION |
| MS_PRG_MULTIWAVE_RELEASE | programme_release | release_gate | current | seq_484 | on_path | GATE_BAU_TRANSFER |
| MS_PRG_OPTIONAL_ASSISTIVE_VISIBLE_ENABLEMENT | programme_release, phase_8 | release_gate | optional | seq_485 | off_path | GATE_OPTIONAL_ASSISTIVE_ENABLEMENT |
| MS_PRG_DEFERRED_NHSAPP_ENABLEMENT | programme_release, phase_7 | deferred_channel | deferred | seq_486 | off_path | GATE_DEFERRED_NHSAPP_ENABLEMENT |
| MS_PRG_BAU_HANDOVER_AND_ARCHIVE | programme_release | assurance_gate | current | seq_487 -> seq_489 | on_path | GATE_BAU_TRANSFER |
