        # 126 Privacy Threat Model

        Task: `par_126`  
        Reviewed at: `2026-04-14`  
        Visual mode: `Privacy_Threat_Atlas`

        ## Mission

        Publish one joined privacy architecture set for Vecells that engineering, release, governance, and later provider-onboarding work can all extend. The threat model is grounded in the current simulator-first Phase 0 algorithm, but it stays honest about live controller, processor, transfer, retention, and signoff evidence that is still pending.

        ## Mock_now_execution

        - Use the current mock-provider estate, seeded fixtures, runtime publication rows, scope tuples, telemetry vocabularies, and replay controls as the real baseline.
        - Keep every threat row tagged as `mock_current`, `actual_pending`, or `mixed`.
        - Reuse the published control plane names from the blueprint and validated Phase 0 outputs; do not create a second privacy vocabulary.

        ## Actual_production_strategy_later

        - Preserve the same threat IDs, backlog IDs, flow IDs, and control IDs.
        - Upgrade the artifacts with live controller or processor assignments, provider and sub-processor details, transfer evidence, retention evidence, named reviewers, and formal signoff records.
        - Do not collapse current rehearsal evidence into production-ready claims.

        ## Prerequisite gap

        - `PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING` is still open because the formal clinical signoff outputs from `par_125` are not yet published.
        - The privacy threat model therefore keeps some rows at `accepted_pending_signoff` or `blocked_by_unknown` instead of claiming completion.

        ## Threat register summary

        - Threat count: `10`
        - Processing activity count: `9`
        - Control family count: `12`
        - Open or blocked rows: `6`

        | Threat | Domain | Track | Residual risk | Backlog |
| --- | --- | --- | --- | --- |
| PRIV-126-001 | intake_capture | mixed | open | DPIA-126-001 |
| PRIV-126-002 | identity_session_bridge | mixed | bounded | DPIA-126-002 |
| PRIV-126-003 | audience_visibility_projection | mixed | open | DPIA-126-003 |
| PRIV-126-004 | audience_visibility_projection | mixed | bounded | DPIA-126-003 |
| PRIV-126-005 | observability_and_audit | mixed | bounded | DPIA-126-004 |
| PRIV-126-006 | communications_and_reachability | mixed | open | DPIA-126-005 |
| PRIV-126-007 | external_adapter_exchange | mixed | blocked_by_unknown | DPIA-126-006 |
| PRIV-126-008 | frozen_evidence_and_investigation | mixed | bounded | DPIA-126-007 |
| PRIV-126-009 | embedded_and_constrained_browser | actual_pending | blocked_by_unknown | DPIA-126-008 |
| PRIV-126-010 | assistive_and_model_governance | actual_pending | blocked_by_unknown | DPIA-126-009 |

        ## Threat families covered

        - Intake over-collection, unsafe attachments, and fallback over-exposure
        - Identity and session leakage across local bridge, secure links, and wrong-patient repair
        - Stale or widened visibility due to missing or stale `VisibilityProjectionPolicy`
        - Audience overreach and acting-scope failures
        - PHI leakage through canonical events, UI telemetry, logs, and diagnostics
        - Communication, callback, notification, and contact-route drift
        - Cross-organisation and external-adapter disclosure risk
        - Frozen-bundle, legal-hold, replay, and break-glass excess access
        - Embedded and constrained-browser privacy drift
        - Assistive and model-backed privacy risk with DPIA rerun triggers

        ## Source-traceable prerequisites

        | Prerequisite | Status | Path |
| --- | --- | --- |
| PREREQ_126_DATA_CLASSIFICATION_MATRIX | available | data/analysis/data_classification_matrix.csv |
| PREREQ_126_ACTING_SCOPE_TUPLE_MATRIX | available | data/analysis/acting_scope_tuple_matrix.csv |
| PREREQ_126_ROUTE_TO_SCOPE_REQUIREMENTS | available | data/analysis/route_to_scope_requirements.csv |
| PREREQ_126_ACCESS_GRANT_RUNTIME_TUPLE_MANIFEST | available | data/analysis/access_grant_runtime_tuple_manifest.json |
| PREREQ_126_CONTACT_ROUTE_SNAPSHOT_MANIFEST | available | data/analysis/contact_route_snapshot_manifest.json |
| PREREQ_126_BREAK_GLASS_SCOPE_RULES | available | data/analysis/break_glass_scope_rules.json |
| PREREQ_126_TELEMETRY_REDACTION_POLICY | available | data/analysis/telemetry_redaction_policy.json |
| PREREQ_126_AUDIT_EVENT_DISCLOSURE_MATRIX | available | data/analysis/audit_event_disclosure_matrix.csv |
| PREREQ_126_UI_TELEMETRY_VOCABULARY | available | data/analysis/ui_telemetry_vocabulary.json |
| PREREQ_126_GATEWAY_SURFACE_MANIFEST | available | data/analysis/gateway_surface_manifest.json |
| PREREQ_126_RUNTIME_TOPOLOGY_MANIFEST | available | data/analysis/runtime_topology_manifest.json |
| PREREQ_126_DCB0129_HAZARD_REGISTER | available | data/assurance/dcb0129_hazard_register.json |
| PREREQ_126_IM1_ARTIFACT_INDEX | available | data/assurance/im1_artifact_index.json |
| PREREQ_126_NHS_LOGIN_APPLICATION_ARTIFACT_INDEX | available | data/assurance/nhs_login_application_artifact_index.json |
| PREREQ_125_CLINICAL_SIGNOFF_PACK | blocked_on_parallel_task | docs/assurance/125_clinical_signoff_matrix.md |
