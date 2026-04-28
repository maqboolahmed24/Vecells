# 478 External Dependency And Manual Fallback Runbook

Generated: 2026-04-28T00:00:00.000Z

## Launch Rule

Every launch-critical dependency must have a readiness verdict, service-level binding, current escalation contact, fallback mode, manual runbook, rehearsal evidence, and recovery exit criterion. Stale supplier contacts, missing owner rotas, missing restore report channels, and privacy/retention violations block launch-critical readiness.

## Dependency Matrix

| Dependency                               | Baseline readiness     | Launch critical | Fallback modes                                                | Owner                     |
| ---------------------------------------- | ---------------------- | --------------- | ------------------------------------------------------------- | ------------------------- |
| Core web runtime and private egress      | ready                  | yes             | fb_478_runtime_static_intake_pause, fb_478_staff_queue_freeze | platform-operations-lead  |
| NHS login and identity handoff           | ready_with_constraints | yes             | fb_478_identity_unsigned_intake, fb_478_identity_repair_queue | identity-access-owner     |
| Notification and secure message provider | ready_with_constraints | yes             | fb_478_manual_patient_contact, fb_478_secure_link_retry_hold  | communications-owner      |
| Local booking provider adapter           | ready_with_constraints | yes             | fb_478_booking_manual_appointment_log                         | booking-service-owner     |
| Pharmacy EPS and provider directory      | observe_only           | no              | fb_478_pharmacy_manual_prescription_comms                     | pharmacy-service-owner    |
| NHS App embedded channel                 | not_applicable         | no              | fb_478_nhs_app_core_web_redirect, fb_478_channel_route_freeze | phase7-channel-owner      |
| Monitoring and alerting destination      | ready                  | yes             | fb_478_monitoring_manual_watch_bridge                         | observability-owner       |
| Backup target and restore report channel | ready                  | yes             | fb_478_restore_report_manual_bridge                           | resilience-owner          |
| Document and export object store         | ready                  | yes             | fb_478_export_pause_and_reissue                               | records-governance-owner  |
| Assurance analytics destination          | ready                  | yes             | fb_478_analytics_local_evidence_freeze                        | analytics-assurance-owner |
| Supplier support and service desk routes | ready_with_constraints | yes             | fb_478_supplier_comms_bridge                                  | service-management-owner  |

## Manual Fallback Runbooks

### Core web runtime degraded mode

- Owner: platform-operations-lead
- Trigger: Runtime health envelope breaches or private egress unavailable.
- Dependencies: dep_478_core_web_runtime_edge
- Activation commands: cmd_478_activate_runtime_static_pause, cmd_478_activate_staff_queue_manual_priority
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Freeze non-essential writes for the Wave 1 tenant cohort.
2. Publish static intake pause and patient status degradation message.
3. Open staff queue manual priority list from last settled projection.
4. Escalate platform on-call and incident commander.
5. Do not resume dynamic intake until restore evidence is current.

### NHS login degraded identity fallback

- Owner: identity-access-owner
- Trigger: NHS login handoff fails or callback evidence stale.
- Dependencies: dep_478_nhs_login_identity
- Activation commands: cmd_478_activate_unsigned_intake, cmd_478_activate_identity_repair_queue
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Pause signed-in request start and signed-in status claims.
2. Route urgent and standard intake to unsigned flow with repair marker.
3. Open identity repair queue for staff follow-up.
4. Escalate NHS login service desk during supplier support window.
5. Re-enable signed-in status only after callback success and repair queue drain.

### Notification provider manual contact fallback

- Owner: communications-owner
- Trigger: Message delivery evidence missing or secure link dispatch failing.
- Dependencies: dep_478_notification_provider
- Activation commands: cmd_478_activate_manual_patient_contact, cmd_478_activate_secure_link_retry_hold
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Pause resend automation and retain failed delivery evidence.
2. Assign manual contact queue to support duty manager.
3. Use verified contact route only; no free-text PHI in supplier ticket.
4. Record contact outcome and reconcile delivery state.
5. Exit when delivery evidence and route repair both settle.

### Booking provider manual appointment log

- Owner: booking-service-owner
- Trigger: Slot search, hold, commit, or supplier mirror confirmation unavailable.
- Dependencies: dep_478_booking_provider_adapter
- Activation commands: cmd_478_activate_booking_manual_log
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Stop patient-facing appointment confirmation claims.
2. Open manual appointment log with duty manager ownership.
3. Hold patient communications until appointment truth is reconciled.
4. Escalate supplier during business-hours window and internal owner OOH.
5. Replay manual log into appointment truth projection before exit.

### Pharmacy provider manual prescription and communication path

- Owner: pharmacy-service-owner
- Trigger: Provider directory, EPS dispatch, acknowledgement, or outcome reconciliation fails.
- Dependencies: dep_478_pharmacy_eps_provider_directory
- Activation commands: cmd_478_activate_pharmacy_manual_comms
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Keep pharmacy route observe-only for Wave 1.
2. If pharmacy wave is active, stop automated dispatch before manual communication.
3. Confirm manual prescription path has current rehearsal evidence.
4. Do not activate untested manual communication path for live patient referrals.
5. Exit only after provider ack and outcome reconciliation are current.

### NHS App deferred channel route freeze

- Owner: phase7-channel-owner
- Trigger: Channel remains outside Wave 1 release or SCAL/connection evidence is stale.
- Dependencies: dep_478_nhs_app_channel
- Activation commands: cmd_478_keep_nhs_app_deferred, cmd_478_freeze_nhs_app_channel
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Keep NHS App entry routes out of the release scope.
2. Maintain core web and staff routes as launchable surfaces.
3. Route support queries to standard core web service desk.
4. Prepare monthly data and incident walkthrough evidence for later limited release.
5. Exit only through channel approval and wave action settlement.

### Monitoring manual watch bridge

- Owner: observability-owner
- Trigger: Alerting destination configured but delivery or owner acknowledgement absent.
- Dependencies: dep_478_monitoring_alerting_destination
- Activation commands: cmd_478_activate_monitoring_manual_watch
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Confirm alert owner rota before manual watch starts.
2. Route clinical safety alerts to incident commander if owner ack is absent.
3. Record manual observation checks at fifteen-minute intervals.
4. Treat missing rota as launch-blocking, not degraded-ready.
5. Exit only after destination delivery and owner acknowledgement are current.

### Backup restore and report publication fallback

- Owner: resilience-owner
- Trigger: Backup target, restore proof, or restore report publication unavailable.
- Dependencies: dep_478_backup_restore_target
- Activation commands: cmd_478_activate_restore_report_bridge
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Keep restore evidence in recovery-only state until report channel publishes.
2. Escalate backup owner and restore report owner together.
3. Use manual report bridge only with tenant-bound restore hash.
4. Block launch decisions when report channel is absent.
5. Exit after restore report is WORM-published and linked to runtime tuple.

### Document export store degraded mode

- Owner: records-governance-owner
- Trigger: Signed artifact delivery fails, quarantine triggers, or raw URL risk detected.
- Dependencies: dep_478_document_export_store
- Activation commands: cmd_478_activate_export_pause
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Pause affected export class and prevent raw object URL rendering.
2. Publish artifact unavailable status to staff and patient status surfaces.
3. Inspect quarantine and legal hold state before reissue.
4. Reissue only through signed redacted grant.
5. Exit after successful redacted grant fetch and audit replay.

### Assurance analytics local freeze

- Owner: analytics-assurance-owner
- Trigger: Analytics destination stale while readiness proof is needed.
- Dependencies: dep_478_assurance_analytics_destination
- Activation commands: cmd_478_activate_analytics_freeze
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Freeze local evidence pack with deterministic hash.
2. Stop treating analytics destination as readiness authority.
3. Queue replay to analytics destination after owner review.
4. Keep assistive trust decisions in conservative mode.
5. Exit after replay hash parity and owner signoff.

### Supplier support communications bridge

- Owner: service-management-owner
- Trigger: Supplier support route needed for a launch-critical dependency incident.
- Dependencies: dep_478_supplier_support_channel
- Activation commands: cmd_478_activate_supplier_bridge
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:

1. Verify supplier role, phone ref, email ref, and service desk ref.
2. Open supplier bridge with redacted impact summary only.
3. Assign internal owner and incident commander for decisions.
4. Reject stale or unverified contact routes as blocking.
5. Exit after supplier acknowledgement and service owner closure note.

## Required Edge Cases

- edge_478_business_hours_ready_no_ooh: Dependency is ready in business hours but has no out-of-hours supplier path. Expected: ready_with_constraints.
- edge_478_nhs_app_deferred_core_web_launch: NHS App channel remains deferred while core web can launch. Expected: not_applicable.
- edge_478_pharmacy_manual_path_untested: Pharmacy provider fails but manual prescription/communication path is untested. Expected: blocked.
- edge_478_monitoring_configured_no_owner_rota: Monitoring destination configured but alert owner rota is missing. Expected: blocked.
- edge_478_backup_ready_no_restore_report_channel: Backup target ready but restore report channel is absent. Expected: blocked.
- edge_478_supplier_contact_expired_unverified: Supplier contact exists but role, phone, or email reference is expired or unverified. Expected: blocked.
- edge_478_manual_fallback_privacy_retention_violation: Manual fallback solves workflow but violates privacy or retention controls. Expected: blocked.
