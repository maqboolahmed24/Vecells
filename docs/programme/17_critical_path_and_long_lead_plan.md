            # 17 Critical Path And Long Lead Plan

            Critical-path digest:
            Current baseline runs planning -> current external readiness -> Phase 0 spine -> Phases 1-6 -> post-Phase-6 split -> Phase 8 and Phase 9 -> current-baseline conformance -> release readiness -> wave 1 -> widening -> BAU handover.

            ## Current-Baseline Critical Path

            | Critical Path Order | Milestone | Tasks | Scope | Notes |

| --- | --- | --- | --- | --- |
| 1 | MS_PLAN_DISCOVERY_BASELINE | seq_001 -> seq_016 | current | Discovery corpus, architecture baselines, and ADR freeze |
| 2 | MS_PLAN_EXECUTION_GRAPH | seq_017 | current | Programme graph and merge-gate model |
| 3 | MS_PLAN_RISK_AND_TRACEABILITY_FOUNDATION | seq_018 -> seq_020 | current | Master risk, watchlist, traceability, and Phase 0 gate foundation |
| 4 | MS_EXT_STRATEGY_AND_ACCOUNT_PLAN | seq_021 -> seq_023 | current | External inventory, provider scorecards, and account strategy |
| 5 | MS_EXT_NHS_LOGIN_ONBOARDING | seq_024 -> seq_025 | current | NHS login partner access requests and credential capture |
| 6 | MS_EXT_IM1_SCAL_READINESS | seq_026 | current | IM1 prerequisite forms and SCAL artifact plan |
| 7 | MS_EXT_MESH_ACCESS | seq_028 | current | MESH mailbox and message workflow access requests |
| 8 | MS_EXT_COMMS_AND_SCAN_VENDORS | seq_031 -> seq_035 | current | Telephony, notifications, transcription, and malware-scanning vendor setup |
| 9 | MS_EXT_PROVIDER_PATHS_AND_EVIDENCE | seq_036 -> seq_037 | current | GP, booking, and pharmacy provider path evidence |
| 10 | MS_EXT_SIMULATOR_AND_MANUAL_GATE_FREEZE | seq_038 -> seq_040 | current | Simulator backlog, manual checkpoints, and degraded-mode defaults |
| 11 | MS_P0_0A_DELIVERY_SKELETON | seq_041 -> seq_045 | current | Phase 0A delivery skeleton and repository architecture |
| 12 | MS_P0_0B_DOMAIN_KERNEL | seq_046 -> par_082 | current | Phase 0B canonical domain kernel and state machine |
| 13 | MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE | seq_050 -> par_094 | current | Phase 0C runtime topology, publication, and release substrate |
| 14 | MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW | seq_053 -> par_102 | current | Phase 0D control governors, tenant scope, and mutation law |
| 15 | MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS | seq_058 -> par_114 | current | Phase 0E verification ladder, simulators, and frontend contract kernel |
| 16 | MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW | par_115 -> seq_131 | current | Phase 0F seed shells, audience bindings, and synthetic flow integration |
| 17 | MS_P0_0G_DCB0129_SAFETY_CASE | par_121 | current | Phase 0G DCB0129 safety case and hazard-log lane |
| 18 | MS_P0_0G_DSPT_READINESS | par_122 | current | Phase 0G DSPT readiness lane |
| 19 | MS_P0_0G_IM1_SCAL_ASSURANCE | par_123 | current | Phase 0G IM1 and SCAL readiness lane |
| 20 | MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE | par_124 | current | Phase 0G NHS login onboarding evidence lane |
| 21 | MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE | par_125 -> par_126 | current | Phase 0G clinical review cadence and DPIA backlog |
| 22 | MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF | seq_132 -> seq_138 | current | Phase 0G observability, security, and foundation exit proof |
| 23 | MS_P1_DEFINITION_AND_ENTRY | seq_139 -> seq_143 | current | Phase 1 contract freeze and intake entry gate |
| 24 | MS_P1_PARALLEL_INTAKE_IMPLEMENTATION | par_144 -> par_163 | current | Phase 1 parallel intake implementation |
| 25 | MS_P1_MERGE_AND_PROOF | seq_164 -> seq_168 | current | Phase 1 merge, resilience proof, and end-to-end evidence |
| 26 | MS_P1_EXIT_GATE | seq_169 | current | Phase 1 red-flag gate exit approval |
| 27 | MS_P2_DEFINITION_AND_ENTRY | seq_170 -> seq_174 | current | Phase 2 trust, identity, and telephony contract freeze |
| 28 | MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY | par_175 -> par_201 | current | Phase 2 identity, telephony, and signed-in patient implementation |
| 29 | MS_P2_EXTERNAL_CONFIG | seq_202 -> seq_203 | current | Phase 2 partner and webhook configuration |
| 30 | MS_P2_PROOF_AND_REGRESSION | seq_204 -> seq_207 | current | Phase 2 proof and regression suites |
| 31 | MS_P2_EXIT_GATE | seq_208 | current | Phase 2 identity and echoes exit approval |
| 32 | MS_XC_ENTRY_GATE | seq_209 | current | Cross-phase patient account and support entry gate |
| 33 | MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT | par_210 -> par_222 | current | Cross-phase patient account and support implementation |
| 34 | MS_XC_MERGE_AND_PROOF | seq_223 -> seq_224 | current | Cross-phase patient account and support merge and proof |
| 35 | MS_XC_EXIT_GATE | seq_225 | current | Cross-phase portal and support baseline exit approval |
| 36 | MS_P3_DEFINITION_AND_ENTRY | seq_226 -> seq_230 | current | Phase 3 contract freeze and triage entry gate |
| 37 | MS_P3_PARALLEL_TRIAGE_AND_CALLBACK | par_231 -> par_269 | current | Phase 3 parallel triage, callback, and workspace implementation |
| 38 | MS_P3_MERGE_AND_PROOF | seq_270 -> seq_276 | current | Phase 3 merge and regression proof |
| 39 | MS_P3_EXIT_GATE | seq_277 | current | Phase 3 human checkpoint exit approval |
| 40 | MS_P4_DEFINITION_AND_ENTRY | seq_278 -> seq_281 | current | Phase 4 booking contract freeze and entry gate |
| 41 | MS_P4_PARALLEL_BOOKING_IMPLEMENTATION | par_282 -> par_303 | current | Phase 4 parallel booking implementation |
| 42 | MS_P4_MERGE_CONFIG_AND_PROOF | seq_304 -> seq_309 | current | Phase 4 booking provider configuration and proof |
| 43 | MS_P4_EXIT_GATE | seq_310 | current | Phase 4 booking engine exit approval |
| 44 | MS_P5_DEFINITION_AND_ENTRY | seq_311 -> seq_314 | current | Phase 5 network horizon contract freeze and entry gate |
| 45 | MS_P5_PARALLEL_NETWORK_IMPLEMENTATION | par_315 -> par_334 | current | Phase 5 parallel network coordination implementation |
| 46 | MS_P5_MERGE_CONFIG_AND_PROOF | seq_335 -> seq_340 | current | Phase 5 network partner configuration and proof |
| 47 | MS_P5_EXIT_GATE | seq_341 | current | Phase 5 network horizon exit approval |
| 48 | MS_P6_DEFINITION_AND_ENTRY | seq_342 -> seq_345 | current | Phase 6 pharmacy loop contract freeze and entry gate |
| 49 | MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION | par_346 -> par_365 | current | Phase 6 parallel pharmacy implementation |
| 50 | MS_P6_MERGE_CONFIG_AND_PROOF | seq_366 -> seq_371 | current | Phase 6 pharmacy dependency configuration and proof |
| 51 | MS_P6_EXIT_GATE | seq_372 | current | Phase 6 pharmacy loop exit approval |
| 52 | MS_POST6_SCOPE_SPLIT_GATE | seq_373 | current | Post-Phase-6 split gate for deferred NHS App and parallel assistive-assurance work |
| 53 | MS_P8_DEFINITION_AND_ENTRY | par_403 -> par_405 | current | Phase 8 assistive boundary and policy freeze |
| 54 | MS_P9_DEFINITION_AND_ENTRY | par_432 -> par_434 | current | Phase 9 assurance-ledger contract freeze |
| 55 | MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION | par_406 -> par_426 | current | Phase 8 assistive implementation |
| 56 | MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION | par_435 -> par_463 | current | Phase 9 assurance-ledger implementation |
| 57 | MS_P8_MERGE | par_427 | current | Phase 8 assistive merge |
| 58 | MS_P9_MERGE | par_464 | current | Phase 9 assurance merge |
| 59 | MS_P8_PROOF_AND_EXIT_PACK | par_428 -> par_430 | current | Phase 8 assistive proof pack |
| 60 | MS_P9_PROOF_AND_EXIT_PACK | par_465 -> par_470 | current | Phase 9 resilience and conformance proof pack |
| 61 | MS_P8_EXIT_GATE | par_431 | current | Phase 8 assistive exit approval |
| 62 | MS_P9_EXIT_GATE | par_471 | current | Phase 9 assurance-ledger exit approval |
| 63 | MS_PRG_CURRENT_BASELINE_CONFORMANCE | seq_472 | current | Current-baseline conformance scorecard reconciliation |
| 64 | MS_PRG_RELEASE_READINESS | seq_474 -> seq_481 | current | Release readiness, signoff, dress rehearsal, and final verification |
| 65 | MS_PRG_WAVE1_PROMOTION_AND_OBSERVATION | seq_482 -> seq_483 | current | Wave 1 promotion and observation window |
| 66 | MS_PRG_MULTIWAVE_RELEASE | seq_484 | current | Guardrailed widening for remaining current-baseline waves |
| 67 | MS_PRG_BAU_HANDOVER_AND_ARCHIVE | seq_487 -> seq_489 | current | BAU handover, evidence archive, and watchlist closeout |

            ## Long-Lead Dependencies

            | Long Lead Milestone | Tasks | Scope | Dependencies |

| --- | --- | --- | --- |
| MS_EXT_NHS_LOGIN_ONBOARDING | seq_024 -> seq_025 | current | dep_nhs_login_rail |
| MS_EXT_IM1_SCAL_READINESS | seq_026 | current | dep_im1_pairing_programme |
| MS_EXT_MESH_ACCESS | seq_028 | current | dep_cross_org_secure_messaging_mesh |
| MS_EXT_COMMS_AND_SCAN_VENDORS | seq_031 -> seq_035 | current | dep_telephony_ivr_recording_provider; dep_sms_notification_provider; dep_email_notification_provider; dep_transcription_processing_provider; dep_malware_scanning_provider |
| MS_EXT_PROVIDER_PATHS_AND_EVIDENCE | seq_036 -> seq_037 | current | dep_gp_system_supplier_paths; dep_local_booking_supplier_adapters; dep_pharmacy_directory_dohs |
| MS_P0_0G_DCB0129_SAFETY_CASE | par_121 | current | dep_nhs_assurance_and_standards_sources |
| MS_P0_0G_DSPT_READINESS | par_122 | current | dep_nhs_assurance_and_standards_sources |
| MS_P0_0G_IM1_SCAL_ASSURANCE | par_123 | current | dep_im1_pairing_programme |
| MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE | par_124 | current | dep_nhs_login_rail |
