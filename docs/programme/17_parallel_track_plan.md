            # 17 Parallel Track Plan

            The checklist contains these contiguous parallel windows:
            - `062-126`
            - `144-163`
            - `175-201`
            - `210-222`
            - `231-269`
            - `282-303`
            - `315-334`
            - `346-365`
            - `374-471`

            Parallel-track law:
            - `No merge or later sequence gate may advance until the active contiguous parallel block and its declared long-lead companion tracks are complete.`
            - `Long-lead approvals and assurance workstreams must be named as first-class milestones or tracks rather than hidden inside implementation milestones.`

            ## Track Matrix

            | Track | Phase | Scope | Milestone | Tasks | Class | Long Lead |

| --- | --- | --- | --- | --- | --- | --- |
| TRK_P0_BACKEND_DOMAIN_KERNEL | phase_0 | current | MS_P0_0B_DOMAIN_KERNEL | par_062 -> par_082 | backend | near_path |
| TRK_P0_RUNTIME_RELEASE | phase_0 | current | MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE | par_083 -> par_094 | runtime | near_path |
| TRK_P0_RUNTIME_CONTROL | phase_0 | current | MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW | par_095 -> par_102 | runtime | near_path |
| TRK_P0_FRONTEND_CONTRACTS | phase_0 | current | MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS | par_103 -> par_114 | frontend | near_path |
| TRK_P0_FRONTEND_SHELLS | phase_0 | current | MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW | par_115 -> par_120 | frontend | near_path |
| TRK_P0_ASSURANCE_DCB0129 | phase_0 | current | MS_P0_0G_DCB0129_SAFETY_CASE | par_121 | assurance | on_path |
| TRK_P0_ASSURANCE_DSPT | phase_0 | current | MS_P0_0G_DSPT_READINESS | par_122 | assurance | on_path |
| TRK_P0_ASSURANCE_IM1 | phase_0 | current | MS_P0_0G_IM1_SCAL_ASSURANCE | par_123 | assurance | on_path |
| TRK_P0_ASSURANCE_NHS_LOGIN | phase_0 | current | MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE | par_124 | assurance | on_path |
| TRK_P0_ASSURANCE_PRIVACY | phase_0 | current | MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE | par_125 -> par_126 | assurance | near_path |
| TRK_P1_BACKEND_INTAKE | phase_1 | current | MS_P1_PARALLEL_INTAKE_IMPLEMENTATION | par_144 -> par_154 | backend | near_path |
| TRK_P1_FRONTEND_INTAKE | phase_1 | current | MS_P1_PARALLEL_INTAKE_IMPLEMENTATION | par_155 -> par_163 | frontend | near_path |
| TRK_P2_IDENTITY | phase_2 | current | MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY | par_175 -> par_186 | backend | near_path |
| TRK_P2_TELEPHONY | phase_2 | current | MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY | par_187 -> par_194 | backend | near_path |
| TRK_P2_FRONTEND | phase_2 | current | MS_P2_PARALLEL_IDENTITY_AND_TELEPHONY | par_195 -> par_201 | frontend | near_path |
| TRK_XC_PATIENT_ACCOUNT | cross_phase_controls | current | MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT | par_210 -> par_217 | cross_phase | near_path |
| TRK_XC_SUPPORT | cross_phase_controls | current | MS_XC_PARALLEL_PATIENT_ACCOUNT_AND_SUPPORT | par_218 -> par_222 | cross_phase | near_path |
| TRK_P3_TRIAGE_CORE | phase_3 | current | MS_P3_PARALLEL_TRIAGE_AND_CALLBACK | par_231 -> par_242 | backend | near_path |
| TRK_P3_CALLBACK | phase_3 | current | MS_P3_PARALLEL_TRIAGE_AND_CALLBACK | par_243 -> par_248 | backend | near_path |
| TRK_P3_SELFCARE | phase_3 | current | MS_P3_PARALLEL_TRIAGE_AND_CALLBACK | par_249 -> par_254 | backend | near_path |
| TRK_P3_WORKSPACE | phase_3 | current | MS_P3_PARALLEL_TRIAGE_AND_CALLBACK | par_255 -> par_269 | frontend | near_path |
| TRK_P4_BOOKING_BACKEND | phase_4 | current | MS_P4_PARALLEL_BOOKING_IMPLEMENTATION | par_282 -> par_292 | backend | near_path |
| TRK_P4_BOOKING_FRONTEND | phase_4 | current | MS_P4_PARALLEL_BOOKING_IMPLEMENTATION | par_293 -> par_303 | frontend | near_path |
| TRK_P5_NETWORK_BACKEND | phase_5 | current | MS_P5_PARALLEL_NETWORK_IMPLEMENTATION | par_315 -> par_325 | backend | near_path |
| TRK_P5_NETWORK_FRONTEND | phase_5 | current | MS_P5_PARALLEL_NETWORK_IMPLEMENTATION | par_326 -> par_334 | frontend | near_path |
| TRK_P6_PHARMACY_BACKEND | phase_6 | current | MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION | par_346 -> par_356 | backend | near_path |
| TRK_P6_PHARMACY_FRONTEND | phase_6 | current | MS_P6_PARALLEL_PHARMACY_IMPLEMENTATION | par_357 -> par_365 | frontend | near_path |
| TRK_P7_EMBEDDED_BACKEND | phase_7 | deferred | MS_P7_PARALLEL_EMBEDDED_CHANNEL | par_377 -> par_385 | backend | off_path |
| TRK_P7_EMBEDDED_FRONTEND | phase_7 | deferred | MS_P7_PARALLEL_EMBEDDED_CHANNEL | par_386 -> par_393 | frontend | off_path |
| TRK_P7_EMBEDDED_ONBOARDING | phase_7 | deferred | MS_P7_PARALLEL_EMBEDDED_CHANNEL | par_394 -> par_396 | dependency | off_path |
| TRK_P8_ASSISTIVE_BACKEND | phase_8 | current | MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION | par_406 -> par_417 | backend | near_path |
| TRK_P8_ASSISTIVE_FRONTEND | phase_8 | current | MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION | par_418 -> par_424 | frontend | near_path |
| TRK_P8_ASSISTIVE_VENDOR | phase_8 | optional | MS_P8_PARALLEL_ASSISTIVE_IMPLEMENTATION | par_425 -> par_426 | dependency | off_path |
| TRK_P9_ASSURANCE_BACKEND | phase_9 | current | MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION | par_435 -> par_449 | backend | on_path |
| TRK_P9_ASSURANCE_FRONTEND | phase_9 | current | MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION | par_450 -> par_460 | frontend | on_path |
| TRK_P9_PLATFORM_BINDINGS | phase_9 | current | MS_P9_PARALLEL_ASSURANCE_IMPLEMENTATION | par_461 -> par_463 | dependency | on_path |
