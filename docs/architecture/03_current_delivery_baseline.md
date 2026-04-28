# Current Delivery Baseline

The current delivery baseline is Phases 0 to 6, Phase 8, and Phase 9, with Phase 7 retained as a deferred NHS App embedded-channel expansion.

## Included phases

- Phase 0: The Foundation Protocol
- Phase 1: The Red Flag Gate
- Phase 2: Identity and Echoes
- Phase 3: The Human Checkpoint
- Phase 4: The Booking Engine
- Phase 5: The Network Horizon
- Phase 6: The Pharmacy Loop
- Phase 8: The Assistive Layer
- Phase 9: The Assurance Ledger

## Baseline capabilities

| ID | Capability | Class | Owning phases | Dependency summary |
| --- | --- | --- | --- | --- |
| cap_unified_intake_and_safety_pipeline | Unified intake convergence and safety-gated request promotion | core_now | The Foundation Protocol, The Red Flag Gate, Identity and Echoes, The Human Checkpoint | NHS login rail (required_baseline); Telephony capture and IVR adapter (required_baseline); SMS continuation links (feature_flagged) |
| cap_fallback_review_and_artifact_quarantine | Fallback review, degraded receipt, and artifact quarantine | core_now | The Foundation Protocol, The Red Flag Gate, The Assurance Ledger | Binary artifact store (required_baseline); Manual review queue (required_baseline) |
| cap_identity_binding_and_session_authority | Identity binding, patient claim, and session authority | core_now | The Foundation Protocol, Identity and Echoes | NHS login rail (required_baseline); Secure-link continuation flow (required_baseline); Telephony identity capture (required_baseline) |
| cap_authorization_consent_and_break_glass_governance | Authorization, consent, purpose-of-use, and break-glass governance | core_enabling_control_plane | The Foundation Protocol, Identity and Echoes, The Assurance Ledger | Organisation-controlled SSO (required_baseline); Compiled policy bundles (required_baseline); Immutable audit ledger (required_baseline) |
| cap_patient_portal_account_and_communications_shell | Signed-in patient shell for status, communications, and managed actions | core_now | The Foundation Protocol, The Red Flag Gate, Identity and Echoes, The Booking Engine | Messaging adapters (required_baseline); Secure-link continuation (required_baseline); Release and runtime publication tuple (required_baseline) |
| cap_patient_records_manage_and_same_shell_continuity | Patient records, booking manage, and continuity-bound recovery | core_now | The Foundation Protocol, The Booking Engine, The Assurance Ledger | Artifact presentation and handoff controls (required_baseline); Continuity evidence producers (required_baseline) |
| cap_clinical_workspace_review_and_endpoint_selection | Clinical Workspace review, safety preemption, and endpoint selection | core_now | The Foundation Protocol, The Human Checkpoint | Organisation SSO (required_baseline); Workspace lease and settlement contracts (required_baseline) |
| cap_support_workspace_replay_and_repair | Ticket-centric support replay, resend, repair, and bounded mutation | core_now | The Foundation Protocol, The Human Checkpoint, The Assurance Ledger | Messaging adapters (required_baseline); Telephony adapters (required_baseline); Support continuity evidence (required_baseline) |
| cap_operations_console_control_room | Operations control-room boards, drill-down, and intervention posture | core_enabling_control_plane | The Foundation Protocol, The Assurance Ledger | Operational analytics projections (required_baseline); Assurance slice trust evaluations (required_baseline); Recovery evidence packs (required_baseline) |
| cap_governance_and_admin_shell | Governance, policy, release, access, and compliance shell | core_enabling_control_plane | The Foundation Protocol, The Assurance Ledger | Compiled policy bundles (required_baseline); Release watch tuples and guardrail snapshots (required_baseline); Assurance evidence bundles (required_baseline) |
| cap_local_booking_orchestrator | Local Booking Orchestrator behind supplier capability and adapter contracts | core_now | The Foundation Protocol, The Booking Engine | IM1 and local GP integration rails (required_baseline); Supplier capability matrix (required_baseline); Provider simulators (replaceable_by_simulator) |
| cap_truthful_booking_manage_waitlist_and_confirmation | Truthful booking confirmation, waitlist, and appointment manage posture | core_now | The Foundation Protocol, The Booking Engine, The Assurance Ledger | Supplier confirmation evidence (required_baseline); Messaging reminders and notifications (optional); Waitlist continuation policies (required_baseline) |
| cap_network_coordination_desk | Network coordination desk for cross-site, hub, and callback fallback booking work | core_now | The Foundation Protocol, The Network Horizon | Hub or cross-site scheduling adapters (required_baseline); Practice visibility and acknowledgement channels (required_baseline); Callback fallback rail (required_baseline) |
| cap_pharmacy_referral_dispatch_and_outcome_loop | Pharmacy First eligibility, referral dispatch, bounce-back, and outcome reconciliation loop | core_now | The Foundation Protocol, The Pharmacy Loop | Directory of Healthcare Services or service search rail (required_baseline); Referral transport rail (required_baseline); Outcome ingestion channel (required_baseline) |
| cap_bounded_assistive_workspace_sidecar | Bounded assistive sidecar inside the human-led workspace | core_now | The Foundation Protocol, The Human Checkpoint, The Assistive Layer | Assistive rollout slice contracts (required_baseline); Human approval and feedback chain (required_baseline); Model vendor integration (feature_flagged) |
| cap_assurance_ledger_and_evidence_graph | Assurance ledger, evidence graph, retention, audit, and recovery admissibility | core_enabling_control_plane | The Foundation Protocol, The Assurance Ledger | WORM audit ledger (required_baseline); Standards evidence mapping (required_baseline); Recovery rehearsal evidence (required_baseline) |
| cap_runtime_release_and_publication_control_plane | Runtime topology, route publication, release freeze, and publication parity control plane | core_enabling_control_plane | The Foundation Protocol, The Assurance Ledger | UK-hosted cloud runtime (required_baseline); Route publication and manifest pipeline (required_baseline); Canary, freeze, and rollback control plane (required_baseline) |
| cap_external_adapter_seams_and_baseline_rails | Baseline external rails isolated behind adapter seams | core_now | The Foundation Protocol, The Booking Engine, The Network Horizon, The Pharmacy Loop, The Assurance Ledger | NHS login rail (required_baseline); IM1 and GP-system adapters (required_baseline); Messaging and telephony adapters (required_baseline); Service discovery and referral transport rails (required_baseline); Contract simulators (replaceable_by_simulator) |
| cap_operational_analytics_and_continuity_evidence | Operational analytics, continuity proof, and cross-phase conformance evidence | core_enabling_control_plane | The Foundation Protocol, The Assurance Ledger | Event bus plus outbox publication (required_baseline); Assurance slice trust evaluation (required_baseline); Cross-phase conformance scorecard (required_baseline) |

## Baseline interpretation

- The baseline keeps 13 direct capability rows in scope now.
- The baseline keeps 6 control-plane rows in scope now.
- Deferred or conditional rows are still inventoried, but they do not block the current completion line.
- Upstream summary conflict pack size: 19 rows.

