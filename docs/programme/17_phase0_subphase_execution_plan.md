
            # 17 Phase0 Subphase Execution Plan

            The source algorithm states that Phase 0 runs as seven internal sub-phases with hard gates. The source explicitly names `0A`, `0B`, and `0G`; the intermediate `0C-0F` labels below are derived bridging names over the runtime, control-plane, verification, and shell obligations already present in the corpus.

            ## Phase 0A-0G Map

            | Subphase | Milestones | Tasks | Hard Gate | Notes |
| --- | --- | --- | --- | --- |
| 0A | MS_P0_0A_DELIVERY_SKELETON | seq_041 -> seq_045 | GATE_P0_0A_TO_0B | Source-named sub-phase. |
| 0B | MS_P0_0B_DOMAIN_KERNEL | seq_046 -> par_082 | GATE_P0_0B_TO_0C | Source-named sub-phase. |
| 0C | MS_P0_0C_RUNTIME_PUBLICATION_SUBSTRATE | seq_050 -> par_094 | GATE_P0_0C_TO_0D | Derived bridging sub-phase for the source-required runtime and release substrate. |
| 0D | MS_P0_0D_CONTROL_GOVERNORS_AND_MUTATION_LAW | seq_053 -> par_102 | GATE_P0_0D_TO_0E | Derived bridging sub-phase for control-plane and scope tuples that later phases assume. |
| 0E | MS_P0_0E_VERIFICATION_SIMULATORS_AND_FRONTEND_CONTRACTS | seq_058 -> par_114 | GATE_P0_PARALLEL_FOUNDATION_OPEN | Derived bridging sub-phase for the open-parallel foundation gate. |
| 0F | MS_P0_0F_SEED_SHELLS_AND_SYNTHETIC_FLOW | par_115 -> seq_131 | GATE_P0_0F_TO_0G | Derived bridging sub-phase for seed-shell integration and same-shell continuity proof. |
| 0G | MS_P0_0G_DCB0129_SAFETY_CASE; MS_P0_0G_DSPT_READINESS; MS_P0_0G_IM1_SCAL_ASSURANCE; MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE; MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE; MS_P0_0G_EXIT_PROOF_AND_FOUNDATION_SIGNOFF | par_121 -> seq_138 | GATE_P0_EXIT | Source-named sub-phase expanded into explicit long-lead assurance and exit-proof milestones. |

            Long-lead closeout lanes inside `0G`:
            - `MS_P0_0G_DCB0129_SAFETY_CASE`
            - `MS_P0_0G_DSPT_READINESS`
            - `MS_P0_0G_IM1_SCAL_ASSURANCE`
            - `MS_P0_0G_NHS_LOGIN_ONBOARDING_EVIDENCE`
            - `MS_P0_0G_CLINICAL_AND_PRIVACY_REVIEW_CADENCE`
