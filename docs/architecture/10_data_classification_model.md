# 10 Data Classification Model

Vecells now has one canonical data-classification model covering 73 classification rows, 22 audience-surface policies, 29 field entries, 11 artifact families, and 11 audit-event families.

## Sensitivity Classes

| Display name | Code | PHI profile | Default projection posture |
| --- | --- | --- | --- |
| Public-safe | public_safe | no | Awareness-only and neutral recovery-safe copy. |
| Operational internal non-PHI | operational_internal_non_phi | no | Operational refs, hashes, trust states, and posture flags without subject payloads. |
| Patient identifying | patient_identifying | yes | Summary-first with strict audience and purpose binding. |
| Contact sensitive | contact_sensitive | yes | Masked summaries, never raw in telemetry or ordinary logs. |
| Clinical sensitive | clinical_sensitive | yes | Governed preview, bounded detail, or summary-only placeholder depending audience. |
| Identity proof sensitive | identity_proof_sensitive | yes | Never browser-hydrated as ordinary route detail; references and masked fragments only. |
| Security or secret sensitive | security_or_secret_sensitive | no | Never exposed outside short-lived governed control surfaces. |
| Audit and investigation restricted | audit_investigation_restricted | contextual | Masked replay or bounded-detail only under InvestigationScopeEnvelope. |
| Retention governance restricted | retention_governance_restricted | contextual | Governance-only summaries or witness detail, never ordinary patient download content. |

## Audience-Surface Coverage

| Surface | Audience | Purpose | Preview | Detail | Artifact | Policy |
| --- | --- | --- | --- | --- | --- | --- |
| surf_patient_intake_web | patient_public | public_status | masked_summary | summary_only | summary_only | POL_PUBLIC_SAFE_PLACEHOLDER |
| surf_patient_intake_phone | patient_public | public_status | masked_summary | summary_only | summary_only | POL_PUBLIC_SAFE_PLACEHOLDER |
| surf_patient_secure_link_recovery | patient_grant_scoped | secure_link_recovery | masked_summary | summary_only | summary_only | POL_GRANT_RECOVERY_BOUNDARY |
| surf_patient_home | patient_authenticated | authenticated_self_service | governed_preview | bounded_detail | summary_only | POL_PATIENT_AUTH_SUMMARY |
| surf_patient_requests | patient_authenticated | authenticated_self_service | governed_preview | bounded_detail | summary_only | POL_PATIENT_AUTH_SUMMARY |
| surf_patient_appointments | patient_authenticated | authenticated_self_service | governed_preview | bounded_detail | governed_inline | POL_PATIENT_ARTIFACT_GOVERNED |
| surf_patient_health_record | patient_authenticated | authenticated_self_service | governed_preview | bounded_detail | governed_download | POL_PATIENT_ARTIFACT_GOVERNED |
| surf_patient_messages | patient_authenticated | authenticated_self_service | governed_preview | bounded_detail | summary_only | POL_PATIENT_AUTH_SUMMARY |
| surf_patient_embedded_shell | patient_embedded_authenticated | embedded_authenticated | governed_preview | bounded_detail | governed_inline_no_download | POL_EMBEDDED_ARTIFACT_CHANNEL |
| surf_clinician_workspace | origin_practice_clinical | operational_execution | governed_preview | full_detail | governed_inline | POL_WORKSPACE_MINIMUM_NECESSARY |
| surf_clinician_workspace_child | origin_practice_clinical | operational_execution | governed_preview | full_detail | governed_inline | POL_WORKSPACE_MINIMUM_NECESSARY |
| surf_practice_ops_workspace | origin_practice_operations | operational_execution | governed_preview | bounded_detail | summary_only | POL_WORKSPACE_MINIMUM_NECESSARY |
| surf_hub_queue | hub_desk | coordination | governed_preview | bounded_detail | summary_only | POL_WORKSPACE_MINIMUM_NECESSARY |
| surf_hub_case_management | hub_desk | coordination | governed_preview | full_detail | governed_inline | POL_WORKSPACE_MINIMUM_NECESSARY |
| surf_pharmacy_console | servicing_site | servicing_delivery | governed_preview | full_detail | governed_inline | POL_WORKSPACE_MINIMUM_NECESSARY |
| surf_support_ticket_workspace | support | support_recovery | governed_preview | bounded_detail | governed_inline_masked | POL_SUPPORT_MASKED_REPLAY |
| surf_support_replay_observe | support | support_recovery | governed_preview | bounded_detail | governed_inline_masked | POL_SUPPORT_MASKED_REPLAY |
| surf_support_assisted_capture | support | support_recovery | governed_preview | bounded_detail | summary_only | POL_SUPPORT_MASKED_REPLAY |
| surf_operations_board | operations_control | operational_control | governed_preview | summary_only | summary_only | POL_OPS_AGGREGATE_DISCLOSURE |
| surf_operations_drilldown | operations_control | operational_control | governed_preview | bounded_detail | governed_inline_masked | POL_INVESTIGATION_SCOPE_ENVELOPE |
| surf_governance_shell | governance_review | governance_review | governed_preview | bounded_detail | governed_handoff | POL_INVESTIGATION_SCOPE_ENVELOPE |
| surf_assistive_sidecar | assistive_adjunct | assistive_companion | governed_preview | summary_only | summary_only | POL_WORKSPACE_MINIMUM_NECESSARY |

## Non-negotiable Closures

- Minimum-necessary access now resolves before projection materialization, not after browser hydration.
- Previews, detail sections, artifacts, telemetry, logs, replay, and export are treated as separate disclosure surfaces.
- `patient_public`, `patient_grant_scoped`, `patient_authenticated`, and `patient_embedded_authenticated` now compile to distinct rows rather than one broad patient payload.
- Wrong-patient hold explicitly suppresses cached PHI replay and preserves only summary-safe continuity breadcrumbs.
- Break-glass and replay pivot to a separately governed investigation purpose row instead of widening ordinary operational or support sessions in place.
