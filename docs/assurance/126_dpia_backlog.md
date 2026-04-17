        # 126 DPIA Backlog

        Task: `par_126`  
        Reviewed at: `2026-04-14`

        ## Mock_now_execution

        - Treat the backlog as immediately actionable engineering and governance work, not as a placeholder for a later DPIA rewrite.
        - Backlog items are grouped by architectural seam so work can be assigned across product, engineering, privacy, security, and operations now.

        ## Actual_production_strategy_later

        - Preserve the current seam grouping and backlog IDs.
        - Upgrade each item with controller or processor names, live contracts, transfer evidence, retention evidence, and formal signoff records.

        ## Backlog table

        | Backlog | Seam | Track | Priority | Threats |
| --- | --- | --- | --- | --- |
| DPIA-126-001 | intake_capture_and_attachment_handling | mixed | high | PRIV-126-001 |
| DPIA-126-002 | identity_session_and_subject_binding | mixed | high | PRIV-126-002 |
| DPIA-126-003 | audience_visibility_and_projection | mixed | high | PRIV-126-003, PRIV-126-004 |
| DPIA-126-004 | telemetry_observability_and_debug | mixed | high | PRIV-126-005 |
| DPIA-126-005 | communications_and_reachability | mixed | high | PRIV-126-006 |
| DPIA-126-006 | external_adapter_and_cross_org_disclosure | mixed | critical | PRIV-126-007 |
| DPIA-126-007 | frozen_evidence_and_investigation | mixed | critical | PRIV-126-008 |
| DPIA-126-008 | embedded_and_constrained_browser | actual_pending | high | PRIV-126-009 |
| DPIA-126-009 | assistive_and_model_governance | actual_pending | critical | PRIV-126-010 |

        ## Priority notes

        - `DPIA-126-006`, `DPIA-126-007`, and `DPIA-126-009` remain the strongest `actual_pending` obligations because they depend on live external processors, named review rosters, or future assistive rollout.
        - `DPIA-126-003` and `DPIA-126-007` carry `PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING`, because the final review cadence and signoff graph are not yet published.
