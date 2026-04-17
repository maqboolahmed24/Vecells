# 129 Mock Now Vs Actual Provider Handover

Generated: 2026-04-14T05:30:24.144Z

## Mock_now_execution

The current engineering baseline remains simulator-first and fail-closed. No row in this handover plan implies live credentials, live mutation, or production acceptance already exist.

## Actual_provider_strategy_later

### adp_nhs_login_auth_bridge

- Live migration ref: LCC_057_DEP_NHS_LOGIN_RAIL_V1
- Pending onboarding evidence: Environment-specific callback and session-parity rehearsal; Partner approval and current redirect inventory; Technical conformance evidence
- Simulator assumptions to revisit: Client identifiers and signing material; Environment-scoped redirect URIs; Official branding or consent-page chrome outside Vecells control
- Proof objects that become live: Callback replay and nonce fence parity; Consent decline and subject-mismatch recovery parity; Writable-versus-read-only session establishment parity
- Monitoring and support evidence: Approve partner access, redirect and scope inventory, environment target, and mutation-gated callback parity evidence without weakening route-intent binding.; LIVE_GATE_ENVIRONMENT_TARGET_MISSING; LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD; LIVE_GATE_MUTATION_FLAG_DISABLED; LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED; LIVE_GATE_REDIRECT_URI_REVIEW; LIVE_GATE_TECHNICAL_CONFORMANCE_PENDING
- Current posture: simulator_backed
- Actual-provider summary: Partner approval and current redirect inventory; Technical conformance evidence

### adp_optional_pds_enrichment

- Live migration ref: LCC_057_DEP_PDS_FHIR_ENRICHMENT_V1
- Pending onboarding evidence: Legal basis and selected access mode; Named approver and environment; Wrong-patient and rollback readiness evidence
- Simulator assumptions to revisit: Access mode and network path; Certificate or credential profile; Demographic field mapping breadth
- Proof objects that become live: Feature-flag-off parity; No-match/multi-match regression; Wrong-patient hold preservation
- Monitoring and support evidence: GATE_EXTERNAL_TO_FOUNDATION; LIVE_GATE_PDS_LEGAL_BASIS_APPROVED; No mandatory graduation. The simulator remains permanent because the seam stays optional and tenants may deliberately keep the live route disabled.; PDS_LIVE_GATE_ACCESS_MODE_SELECTED; PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION; PDS_LIVE_GATE_ENVIRONMENT_TARGET_PRESENT; PDS_LIVE_GATE_NAMED_APPROVER_PRESENT
- Current posture: permanent_simulator
- Actual-provider summary: Legal basis and selected access mode; Named approver and environment

### adp_telephony_ivr_recording

- Live migration ref: LCC_057_DEP_TELEPHONY_IVR_RECORDING_PROVIDER_V1
- Pending onboarding evidence: Recording policy approval plus named environment; Vendor approval and spend authority; Webhook security and replay posture
- Simulator assumptions to revisit: Number inventory and vendor account identifiers; Webhook signatures and callback payload shape; Recording retrieval mechanics
- Proof objects that become live: Recording-missing recovery parity; Urgent-live preemption parity; Webhook replay and signature-failure parity
- Monitoring and support evidence: Approve vendor, recording posture, spend authority, webhook security pack, and named environment for the selected number profile.; TEL_LIVE_GATE_MUTATION_AND_SPEND_FLAGS; TEL_LIVE_GATE_NAMED_APPROVER; TEL_LIVE_GATE_PHASE0_EXTERNAL_READY; TEL_LIVE_GATE_PROCUREMENT_AND_SPEND_AUTHORITY; TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED; TEL_LIVE_GATE_VENDOR_APPROVED; TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK
- Current posture: simulator_backed
- Actual-provider summary: Vendor approval and spend authority; Webhook security and replay posture

### adp_transcription_processing

- Live migration ref: LCC_057_DEP_TRANSCRIPTION_PROCESSING_PROVIDER_V1
- Pending onboarding evidence: Named approver and final operator acknowledgement; Region and retention posture; Webhook security evidence
- Simulator assumptions to revisit: Latency profile and callback shape; Vocabulary or confidence metadata; Storage scope for raw transcript artifacts
- Proof objects that become live: Manual-review requirement parity; Queued/partial/ready parity; Supersession regression
- Monitoring and support evidence: Freeze region policy, retention policy, webhook security, and named environment for the selected transcript provider.; LIVE_GATE_EVIDENCE_FINAL_OPERATOR_ACK; LIVE_GATE_EVIDENCE_MUTATION_FLAG; LIVE_GATE_EVIDENCE_NAMED_APPROVER_AND_ENV; LIVE_GATE_EVIDENCE_REGION_POLICY_EXPLICIT; LIVE_GATE_EVIDENCE_RETENTION_POLICY_EXPLICIT; LIVE_GATE_EVIDENCE_WEBHOOK_SECURITY_READY
- Current posture: simulator_backed
- Actual-provider summary: Region and retention posture; Webhook security evidence

### adp_sms_notification_delivery

- Live migration ref: LCC_057_DEP_SMS_NOTIFICATION_PROVIDER_V1
- Pending onboarding evidence: Audit log export and replay guard evidence; Human-only checkpoint policy from seq_039; Repair policy approval
- Simulator assumptions to revisit: Sender ID format; Provider delivery callback schema; Link delivery TTL values
- Proof objects that become live: Controlled resend authorization parity; Replay fence regression; Support repair visibility parity
- Monitoring and support evidence: Freeze sender ownership, spend authority, and wrong-recipient repair policy for the selected SMS vendor.; LIVE_GATE_NOTIFY_APPROVER_AND_ENV; LIVE_GATE_NOTIFY_FINAL_POSTURE; LIVE_GATE_NOTIFY_LOG_EXPORT; LIVE_GATE_NOTIFY_REPAIR_POLICY
- Current posture: simulator_backed
- Actual-provider summary: Repair policy approval; Audit log export and replay guard evidence

### adp_email_notification_delivery

- Live migration ref: LCC_057_DEP_EMAIL_NOTIFICATION_PROVIDER_V1
- Pending onboarding evidence: Audit log export and replay guard evidence; Human-only checkpoint policy from seq_039; Repair policy approval
- Simulator assumptions to revisit: Sender and domain configuration; Webhook payload signatures; Provider event vocabularies for bounce and suppression
- Proof objects that become live: Controlled resend authorization parity; Replay fence regression; Support repair visibility parity
- Monitoring and support evidence: Freeze sender ownership, domain verification, webhook security, and named environment for the chosen notification vendor.; LIVE_GATE_NOTIFY_APPROVER_AND_ENV; LIVE_GATE_NOTIFY_FINAL_POSTURE; LIVE_GATE_NOTIFY_LOG_EXPORT; LIVE_GATE_NOTIFY_REPAIR_POLICY
- Current posture: simulator_backed
- Actual-provider summary: Repair policy approval; Audit log export and replay guard evidence

### adp_malware_artifact_scanning

- Live migration ref: LCC_057_DEP_MALWARE_SCANNING_PROVIDER_V1
- Pending onboarding evidence: Storage scope and quarantine policy; Webhook security and mutation gate posture
- Simulator assumptions to revisit: Missing simulator catalog/runtime must stay explicit and blocked instead of implying current provider readiness.
- Proof objects that become live: Preserve ACP_057_DEP_MALWARE_SCANNING_PROVIDER_V1 proof semantics when the live provider replaces the gap row.
- Monitoring and support evidence: Publish executable simulator or live-provider runtime evidence before promotion.; Bind webhook security, quarantine posture, and mutation-gate proof to the same adapter row.
- Current posture: simulator_backed
- Actual-provider summary: Storage scope and quarantine policy; Webhook security and mutation gate posture

### adp_im1_pairing_programme_gate

- Live migration ref: LCC_057_DEP_IM1_PAIRING_PROGRAMME_V1
- Pending onboarding evidence: Bounded use-case approval; Current supplier roster and pairing approval; Named sponsor, approver, and environment
- Simulator assumptions to revisit: Exact field map and endpoint tuples; Supplier-specific manage coverage; Search or hold feature flags by supplier estate
- Proof objects that become live: Commit ambiguity regression; Manage-booking coverage parity; Search/hold/commit parity
- Monitoring and support evidence: LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE; LIVE_GATE_ENVIRONMENT_TARGET_PRESENT; LIVE_GATE_MUTATION_FLAG_ENABLED; LIVE_GATE_NAMED_APPROVER_PRESENT; LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER; LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN; LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED; Pairing, provider roster refresh, bounded use-case approval, and named environment evidence are current for the EMIS lane.
- Current posture: simulator_backed
- Actual-provider summary: Current supplier roster and pairing approval; Bounded use-case approval

### adp_gp_supplier_path_resolution

- Live migration ref: LCC_057_DEP_GP_SYSTEM_SUPPLIER_PATHS_V1
- Pending onboarding evidence: Bounded use-case approval; Current supplier roster and pairing approval; Named sponsor, approver, and environment
- Simulator assumptions to revisit: Exact field map and endpoint tuples; Supplier-specific manage coverage; Search or hold feature flags by supplier estate
- Proof objects that become live: Commit ambiguity regression; Manage-booking coverage parity; Search/hold/commit parity
- Monitoring and support evidence: LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE; LIVE_GATE_ENVIRONMENT_TARGET_PRESENT; LIVE_GATE_MUTATION_FLAG_ENABLED; LIVE_GATE_NAMED_APPROVER_PRESENT; LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER; LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN; LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED; Pairing, provider roster refresh, bounded use-case approval, and named environment evidence are current for the TPP lane.
- Current posture: simulator_backed
- Actual-provider summary: Current supplier roster and pairing approval; Bounded use-case approval

### adp_local_booking_supplier

- Live migration ref: LCC_057_DEP_LOCAL_BOOKING_SUPPLIER_ADAPTERS_V1
- Pending onboarding evidence: Bounded booking MVP and architecture refresh; Named sponsor plus commissioning posture; Practice acknowledgement route evidence
- Simulator assumptions to revisit: Supplier capability tuple and surface naming; Commit timing windows; Practice-facing receipt or acknowledgement details
- Proof objects that become live: Ambiguous confirmation parity; Commit-to-projection replay parity; Practice acknowledgement overdue regression
- Monitoring and support evidence: Freeze provider capability evidence, bounded MVP, sponsor posture, and practice acknowledgement law for the named environment.; LIVE_GATE_ARCHITECTURE_AND_DATA_FLOW_CURRENT; LIVE_GATE_CREDIBLE_BOOKING_MVP; LIVE_GATE_MUTATION_FLAG_ENABLED; LIVE_GATE_NAMED_APPROVER_AND_ENVIRONMENT; LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION; LIVE_GATE_SPONSOR_AND_COMMISSIONING_POSTURE; LIVE_GATE_WATCH_REGISTER_CLEAR
- Current posture: simulator_backed
- Actual-provider summary: Bounded booking MVP and architecture refresh; Named sponsor plus commissioning posture

### adp_network_capacity_feed

- Live migration ref: LCC_057_DEP_NETWORK_CAPACITY_PARTNER_FEEDS_V1
- Pending onboarding evidence: Callback fallback ownership evidence; Freshness and expiry policy; Named partner feed provenance
- Simulator assumptions to revisit: Feed transport details; Capacity refresh cadence; Partner-specific no-slot reason vocabularies
- Proof objects that become live: Feed freshness indicator parity; No-slot callback fallback parity; Stale-capacity regression
- Monitoring and support evidence: LIVE_GATE_ARCHITECTURE_AND_DATA_FLOW_CURRENT; LIVE_GATE_CREDIBLE_BOOKING_MVP; LIVE_GATE_SPONSOR_AND_COMMISSIONING_POSTURE; LIVE_GATE_WATCH_REGISTER_CLEAR; Publish partner feed provenance, freshness policy, and callback fallback evidence for the bounded booking MVP.
- Current posture: simulator_backed
- Actual-provider summary: Named partner feed provenance; Freshness and expiry policy

### adp_mesh_secure_message

- Live migration ref: LCC_057_DEP_CROSS_ORG_SECURE_MESSAGING_MESH_V1
- Pending onboarding evidence: API onboarding completion or approved live path; Minimum-necessary review plus named approver; Named ODS owner and manager mode
- Simulator assumptions to revisit: Mailbox identifiers and owner ODS values; Route manager mode and queue wiring; Exact callback or polling strategy
- Proof objects that become live: Receipt ambiguity parity; Replay and duplicate delivery regression; Workflow-specific escalation parity
- Monitoring and support evidence: Freeze mailbox ownership, manager mode, named approver, minimum-necessary review, and mutation gate posture for the targeted workflow set.; MESH_LIVE_GATE_API_ONBOARDING_COMPLETE; MESH_LIVE_GATE_FINAL_POSTURE; MESH_LIVE_GATE_MANAGER_MODE_DECIDED; MESH_LIVE_GATE_MUTATION_AND_SPEND_ACK; MESH_LIVE_GATE_NAMED_APPROVER_PRESENT; MESH_LIVE_GATE_OWNER_ODS_KNOWN; MESH_LIVE_GATE_PHASE0_EXTERNAL_READY
- Current posture: simulator_backed
- Actual-provider summary: Named ODS owner and manager mode; API onboarding completion or approved live path

### adp_origin_practice_ack

- Live migration ref: LCC_057_DEP_ORIGIN_PRACTICE_ACK_RAIL_V1
- Pending onboarding evidence: Bounded booking MVP and architecture refresh; Named sponsor plus commissioning posture; Practice acknowledgement route evidence
- Simulator assumptions to revisit: Supplier capability tuple and surface naming; Commit timing windows; Practice-facing receipt or acknowledgement details
- Proof objects that become live: Ambiguous confirmation parity; Commit-to-projection replay parity; Practice acknowledgement overdue regression
- Monitoring and support evidence: Freeze provider capability evidence, bounded MVP, sponsor posture, and practice acknowledgement law for the named environment.; LIVE_GATE_ARCHITECTURE_AND_DATA_FLOW_CURRENT; LIVE_GATE_CREDIBLE_BOOKING_MVP; LIVE_GATE_MUTATION_FLAG_ENABLED; LIVE_GATE_NAMED_APPROVER_AND_ENVIRONMENT; LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION; LIVE_GATE_SPONSOR_AND_COMMISSIONING_POSTURE; LIVE_GATE_WATCH_REGISTER_CLEAR
- Current posture: simulator_backed
- Actual-provider summary: Bounded booking MVP and architecture refresh; Named sponsor plus commissioning posture

### adp_pharmacy_directory_lookup

- Live migration ref: LCC_057_DEP_PHARMACY_DIRECTORY_DOHS_V1
- Pending onboarding evidence: Service Search access approval and route policy; Choice tuple freshness and capability evidence
- Simulator assumptions to revisit: Missing simulator catalog/runtime must stay explicit and blocked instead of implying current provider readiness.
- Proof objects that become live: Preserve ACP_057_DEP_PHARMACY_DIRECTORY_DOHS_V1 proof semantics when the live provider replaces the gap row.
- Monitoring and support evidence: Publish executable simulator or live-provider runtime evidence before promotion.; Bind webhook security, quarantine posture, and mutation-gate proof to the same adapter row.
- Current posture: simulator_backed
- Actual-provider summary: Service Search access approval and route policy; Choice tuple freshness and capability evidence

### adp_pharmacy_referral_transport

- Live migration ref: LCC_057_DEP_PHARMACY_REFERRAL_TRANSPORT_V1
- Pending onboarding evidence: Bounded rollback to simulator-safe mode; Dispatch proof and acknowledgement thresholds signed off; Manual urgent-return ownership rehearsal evidence; Named approver and environment; Named transport route profile and provider tuple; Secret posture and callback parity review
- Simulator assumptions to revisit: Transport channel and receipt shape; Mailbox or endpoint identifiers; Provider-specific retry window values
- Proof objects that become live: Authoritative proof versus transport evidence proof; Dispatch acceptance-versus-confirmation parity; Expiry and redispatch regression; Replay parity proof; Rollback rehearsal; Urgent-return manual fallback preservation
- Monitoring and support evidence: Freeze live transport profile, named mailbox or endpoint, dispatch proof thresholds, urgent-return ownership rehearsal, and mutation-gated environment evidence.; LIVE_GATE_PHARMACY_CONSENT_AND_DISPATCH_MODELS_IMPLEMENTED; LIVE_GATE_PHARMACY_MUTATION_FLAG_ENABLED; LIVE_GATE_PHARMACY_MVP_APPROVED; LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT; LIVE_GATE_PHARMACY_URGENT_RETURN_OWNERSHIP_REHEARSED; LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR; LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION
- Current posture: simulator_backed
- Actual-provider summary: Named transport route profile and provider tuple; Dispatch proof and acknowledgement thresholds signed off

### adp_pharmacy_outcome_observation

- Live migration ref: LCC_057_DEP_PHARMACY_OUTCOME_OBSERVATION_V1
- Pending onboarding evidence: Assured supplier/system combination for Update Record; Reconciliation runtime implementation reference; Watch-register closure for visibility and manual fallback gaps
- Simulator assumptions to revisit: Transport wrapper and acknowledgement cadence; Supplier-specific visibility field mapping; Assured-combination registry values
- Proof objects that become live: No-auto-close reconciliation regression; Practice-disabled fallback parity; Weak-match and duplicate-outcome parity
- Monitoring and support evidence: LIVE_GATE_PHARMACY_CONSENT_AND_DISPATCH_MODELS_IMPLEMENTED; LIVE_GATE_PHARMACY_MVP_APPROVED; LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT; LIVE_GATE_PHARMACY_UPDATE_RECORD_COMBINATION_NAMED; LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR; LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION; Name the assured Update Record combination, publish the reconciliation runtime reference, and clear the visibility watch register.
- Current posture: simulator_backed
- Actual-provider summary: Assured supplier/system combination for Update Record; Reconciliation runtime implementation reference

### adp_pharmacy_urgent_return_contact

- Live migration ref: LCC_057_DEP_PHARMACY_URGENT_RETURN_PROFESSIONAL_ROUTES_V1
- Pending onboarding evidence: Bounded rollback to simulator-safe mode; Dispatch proof and acknowledgement thresholds signed off; Manual urgent-return ownership rehearsal evidence; Named approver and environment; Named transport route profile and provider tuple; Secret posture and callback parity review
- Simulator assumptions to revisit: Transport channel and receipt shape; Mailbox or endpoint identifiers; Provider-specific retry window values
- Proof objects that become live: Authoritative proof versus transport evidence proof; Dispatch acceptance-versus-confirmation parity; Expiry and redispatch regression; Replay parity proof; Rollback rehearsal; Urgent-return manual fallback preservation
- Monitoring and support evidence: Freeze live transport profile, named mailbox or endpoint, dispatch proof thresholds, urgent-return ownership rehearsal, and mutation-gated environment evidence.; LIVE_GATE_PHARMACY_CONSENT_AND_DISPATCH_MODELS_IMPLEMENTED; LIVE_GATE_PHARMACY_MUTATION_FLAG_ENABLED; LIVE_GATE_PHARMACY_MVP_APPROVED; LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT; LIVE_GATE_PHARMACY_URGENT_RETURN_OWNERSHIP_REHEARSED; LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR; LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION
- Current posture: simulator_backed
- Actual-provider summary: Named approver and environment; Secret posture and callback parity review

### adp_nhs_app_embedded_bridge

- Live migration ref: LCC_057_DEP_NHS_APP_EMBEDDED_CHANNEL_ECOSYSTEM_V1
- Pending onboarding evidence: Scope-window approval and commissioning posture; Current NHS login readiness for embedded use
- Simulator assumptions to revisit: Missing simulator catalog/runtime must stay explicit and blocked instead of implying current provider readiness.
- Proof objects that become live: Preserve ACP_057_DEP_NHS_APP_EMBEDDED_CHANNEL_ECOSYSTEM_V1 proof semantics when the live provider replaces the gap row.
- Monitoring and support evidence: Publish executable simulator or live-provider runtime evidence before promotion.; Bind webhook security, quarantine posture, and mutation-gate proof to the same adapter row.
- Current posture: simulator_backed
- Actual-provider summary: Scope-window approval and commissioning posture; Current NHS login readiness for embedded use

