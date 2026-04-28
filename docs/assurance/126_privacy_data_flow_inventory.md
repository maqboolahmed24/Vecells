        # 126 Privacy Data Flow Inventory

        Task: `par_126`  
        Reviewed at: `2026-04-14`

        ## Mock_now_execution

        - The flow inventory covers the real simulator-first baseline: intake, authenticated portal, secure-link recovery, telephony and transcription, staff and support workspace, booking and adapter exchanges, audit and observability, frozen evidence, and assistive planning.
        - The flow inventory is source-traceable to current route, classification, scope, telemetry, and trust-boundary artifacts.

        ## Actual_production_strategy_later

        - Live controller or processor assignments, sub-processor lists, transfer evidence, retention evidence, and channel-specific monitoring must be added to these same flow IDs.

        ## Flow table

        | Flow | Activity family | Track | Linked threats |
| --- | --- | --- | --- |
| FLOW_126_INGRESS_INTAKE | public_intake_and_draft_capture | mixed | PRIV-126-001 |
| FLOW_126_IDENTITY_AND_SESSION | authenticated_patient_portal_and_secure_links | mixed | PRIV-126-002 |
| FLOW_126_VISIBILITY_AND_AUDIENCE | internal_staff_workspace_and_support_replay | mixed | PRIV-126-003, PRIV-126-004 |
| FLOW_126_COMMUNICATIONS_AND_REACHABILITY | message_callback_notification_and_contact_route_repairs | mixed | PRIV-126-006 |
| FLOW_126_EXTERNAL_ADAPTERS | local_booking_network_coordination_and_pharmacy_loops | mixed | PRIV-126-007 |
| FLOW_126_OBSERVABILITY_AND_AUDIT | audit_observability_and_privacy_safe_telemetry | mixed | PRIV-126-005 |
| FLOW_126_FROZEN_AND_INVESTIGATION | frozen_bundles_evidence_quarantine_and_fallback_review | mixed | PRIV-126-008 |
| FLOW_126_EMBEDDED_AND_CONSTRAINED | embedded_or_constrained_browser_paths | actual_pending | PRIV-126-009 |
| FLOW_126_ASSISTIVE_AND_MODEL | assistive_shadow_mode_and_visible_assistance | actual_pending | PRIV-126-010 |

        ## Current source counts

        - Classification rows available: `73`
        - Route scope rows available: `23`
        - Telemetry vocabulary rows available: `133`
