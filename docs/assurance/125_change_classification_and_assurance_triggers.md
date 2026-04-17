# 125 Change Classification And Assurance Triggers

This trigger map explains which pack or delta must move when a change enters the clinical signoff workflow.

## Section A — `Mock_now_execution`

- DCB0129 deltas and release/runtime deltas are recorded as part of ordinary engineering delivery.
- DSPT, NHS Login, and IM1/SCAL deltas stay explicit instead of being collapsed into generic “security review”.
- Content-only or technical-only claims still require a conservative non-applicability record.

## Section B — `Actual_production_strategy_later`

- Replace placeholder pack refs with signed live evidence while preserving the same class IDs and delta refs.
- Keep onboarding- and standards-specific changes tied to the same event IDs so audits can prove when the delta was reviewed.

## Trigger Matrix

| Change class | Example | Required pack or delta refs | Required evidence refs | Required freeze or trust refs |
| --- | --- | --- | --- | --- |
| cc_safety_rule_or_triage_logic | Red-flag threshold, triage ruleset, or safety preemption logic changes. | PACK_121_DCB0129|DELTA_HAZARD_LOG_UPDATE|DELTA_SAFETY_CASE_UPDATE|DELTA_RULESET_CHANGE_RECORD | EVID_121_DCB0129_HAZARD_REGISTER|EVID_121_DCB0129_SAFETY_CASE_OUTLINE|EVID_121_DCB0129_REVIEW_EVENTS|EVID_RELEASE_PUBLICATION_PARITY | REF_RELEASE_APPROVAL_FREEZE|REF_RUNTIME_PUBLICATION_BUNDLE|REF_RELEASE_PUBLICATION_PARITY|REF_ASSURANCE_SLICE_TRUST_RECORD|REF_GOVERNANCE_REVIEW_PACKAGE |
| cc_identity_session_authorization_behavior | Identity binding, callback-to-session seam, access grant, or authorization behavior changes. | PACK_121_DCB0129|PACK_122_DSPT|PACK_124_NHS_LOGIN|PACK_123_IM1_SCAL|DELTA_SCOPE_CLAIM_REVIEW | EVID_121_DCB0129_HAZARD_REGISTER|EVID_122_DSPT_CONTROL_MATRIX|EVID_124_NHS_LOGIN_SCOPE_CLAIM_MATRIX|EVID_124_NHS_LOGIN_GAP_REGISTER | REF_RELEASE_APPROVAL_FREEZE|REF_RUNTIME_PUBLICATION_BUNDLE|REF_RELEASE_PUBLICATION_PARITY|REF_ASSURANCE_SLICE_TRUST_RECORD|REF_GOVERNANCE_REVIEW_PACKAGE|REF_STANDARDS_DEPENDENCY_WATCHLIST |
| cc_patient_visible_status_trust_writable_posture | Patient-visible status copy, trust indicators, writable posture, or same-shell continuity truth changes. | PACK_121_DCB0129|DELTA_STATUS_POSTURE_COPY_REVIEW|DELTA_RELEASE_REVIEW_PACKAGE | EVID_121_DCB0129_HAZARD_REGISTER|EVID_RELEASE_PUBLICATION_PARITY|EVID_RUNTIME_PUBLICATION_BUNDLE | REF_RELEASE_APPROVAL_FREEZE|REF_RUNTIME_PUBLICATION_BUNDLE|REF_RELEASE_PUBLICATION_PARITY|REF_ASSURANCE_SLICE_TRUST_RECORD|REF_CHANNEL_RELEASE_FREEZE_RECORD |
| cc_booking_network_pharmacy_truth_semantics | Booking confirmation, network ranking, pharmacy dispatch, or outcome truth-semantics changes. | PACK_121_DCB0129|PACK_122_DSPT|DELTA_BOOKING_NETWORK_PHARMACY_REVIEW | EVID_121_DCB0129_HAZARD_REGISTER|EVID_122_DSPT_CONTROL_MATRIX|EVID_RELEASE_PUBLICATION_PARITY | REF_RELEASE_APPROVAL_FREEZE|REF_RUNTIME_PUBLICATION_BUNDLE|REF_RELEASE_PUBLICATION_PARITY|REF_ASSURANCE_SLICE_TRUST_RECORD |
| cc_release_runtime_publication_manifest | Release, runtime, publication, manifest, or route-binding changes that can alter safety posture. | DELTA_RELEASE_REVIEW_PACKAGE|DELTA_RUNTIME_PUBLICATION_REVIEW|DELTA_RELEASE_FREEZE_RENEWAL | EVID_RELEASE_APPROVAL_FREEZE|EVID_RUNTIME_PUBLICATION_BUNDLE|EVID_RELEASE_PUBLICATION_PARITY|EVID_121_DCB0129_HAZARD_REGISTER | REF_RELEASE_APPROVAL_FREEZE|REF_RUNTIME_PUBLICATION_BUNDLE|REF_RELEASE_PUBLICATION_PARITY|REF_ASSURANCE_SLICE_TRUST_RECORD|REF_GOVERNANCE_REVIEW_PACKAGE|REF_STANDARDS_DEPENDENCY_WATCHLIST|REF_CHANNEL_RELEASE_FREEZE_RECORD |
| cc_external_adapter_or_supplier_behavior | External adapter, supplier, transport, or provider behavior changes that could alter safety posture. | PACK_121_DCB0129|PACK_122_DSPT|PACK_124_NHS_LOGIN|PACK_123_IM1_SCAL|DELTA_SUPPLIER_BEHAVIOR_REVIEW | EVID_121_DCB0129_HAZARD_REGISTER|EVID_122_DSPT_CONTROL_MATRIX|EVID_124_NHS_LOGIN_GAP_REGISTER | REF_RELEASE_APPROVAL_FREEZE|REF_RUNTIME_PUBLICATION_BUNDLE|REF_ASSURANCE_SLICE_TRUST_RECORD|REF_STANDARDS_DEPENDENCY_WATCHLIST |
| cc_communications_reachability_behavior | Communications, callback, contact-route, or reachability behavior changes. | PACK_121_DCB0129|PACK_122_DSPT|DELTA_COMMUNICATIONS_REVIEW | EVID_121_DCB0129_HAZARD_REGISTER|EVID_122_DSPT_CONTROL_MATRIX | REF_RELEASE_APPROVAL_FREEZE|REF_ASSURANCE_SLICE_TRUST_RECORD|REF_RUNTIME_PUBLICATION_BUNDLE |
| cc_assistive_capability_change | Assistive capability, visible-slice, or human-approval policy changes. | PACK_121_DCB0129|PACK_122_DSPT|DELTA_ASSISTIVE_APPROVAL_GRAPH_REVIEW | EVID_121_DCB0129_HAZARD_REGISTER|EVID_RELEASE_PUBLICATION_PARITY|EVID_122_DSPT_CONTROL_MATRIX | REF_RELEASE_APPROVAL_FREEZE|REF_RUNTIME_PUBLICATION_BUNDLE|REF_RELEASE_PUBLICATION_PARITY|REF_ASSURANCE_SLICE_TRUST_RECORD|REF_GOVERNANCE_REVIEW_PACKAGE |
| cc_content_only_non_clinical | Copy-only change with no clinical meaning, no trust implication, and no writable-posture effect. | DELTA_NON_APPLICABILITY_RECORD |  |  |
| cc_purely_technical_no_clinical_effect | Infrastructure or refactor-only change with no patient-visible, trust, identity, supplier, or clinical effect. | DELTA_NON_APPLICABILITY_RECORD |  | REF_RELEASE_APPROVAL_FREEZE |
