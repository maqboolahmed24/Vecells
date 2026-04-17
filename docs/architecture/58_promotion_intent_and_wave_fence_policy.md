# 58 Promotion Intent And Wave Fence Policy

        Promotion, pause, resume, and rollback are explicit control-plane actions, not operator folklore. Seq `058` binds those actions to one `PromotionIntentEnvelope`, one `WaveEligibilitySnapshot`, one `WaveControlFence`, and one exact watch tuple.

        ## Scenario Inventory

        | Ring | Scenario | State | Drift state | Continuity controls | Synthetic recovery refs |
        | --- | --- | --- | --- | ---: | ---: |
        | local | VS_058_LOCAL_V1 | armed | aligned | 4 | 0 |
| ci-preview | VS_058_CI_PREVIEW_V1 | armed | aligned | 4 | 0 |
| integration | VS_058_INTEGRATION_V1 | restart_required | restart_required | 7 | 7 |
| preprod | VS_058_PREPROD_V1 | halted | halted | 11 | 11 |
| production | VS_058_PRODUCTION_V1 | rollback_required | rollback_required | 11 | 11 |

        ## Wave-Control Rules

        - Canary, widen, halt, rollback, and resume are legal only while the declared `WaveControlFence` and watch tuple still match the pinned matrix hash.
        - `haltOnDrift` and `restartOnDrift` remain mandatory in every ring.
        - Production wave posture is understandable without color alone because the cockpit renders text labels for canary, widen, halt, rollback, and resume posture.

        ## Assumptions

        - `ASSUMPTION_058_CONFIG_COMPILATION_RECORDS_PUBLISHED_HERE`: ConfigCompilationRecord and ConfigSimulationEnvelope refs are published as seq_058 contract-layer objects because earlier tasks froze hashes and bundle refs but not standalone runtime records.
- `ASSUMPTION_058_SIMULATOR_EVIDENCE_REMAINS_PHASE0_AUTHORITY`: Simulator-backed adapter families remain valid promotion evidence in all Phase 0 rings, including production-wave controls, until later live-cutover tasks publish narrower provider-specific proof.
