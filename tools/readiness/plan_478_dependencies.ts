import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

const TASK_ID = "seq_478";
const FIXED_NOW = "2026-04-28T00:00:00.000Z";
const SCHEMA_VERSION = "478.programme.dependency-readiness.v1";

export type DependencyReadinessState =
  | "ready"
  | "ready_with_constraints"
  | "observe_only"
  | "blocked"
  | "not_applicable";

export type DependencyScenarioState =
  | "ready"
  | "ready_with_constraints"
  | "degraded_manual"
  | "blocked"
  | "deferred_channel"
  | "stale_contact";

export type ContinuityState = "normal" | "degraded" | "manual" | "blocked";
type JsonObject = Record<string, unknown>;

export interface DependencyDefinition {
  readonly dependencyRef: string;
  readonly label: string;
  readonly dependencyClass:
    | "identity"
    | "channel"
    | "runtime"
    | "messaging"
    | "booking"
    | "pharmacy"
    | "storage"
    | "monitoring"
    | "backup"
    | "analytics"
    | "supplier_support";
  readonly launchCritical: boolean;
  readonly baselineReadiness: DependencyReadinessState;
  readonly essentialFunctionRefs: readonly string[];
  readonly routeFamilies: readonly string[];
  readonly fallbackModeRefs: readonly string[];
  readonly serviceLevelBindingRef: string;
  readonly escalationContactRefs: readonly string[];
  readonly runbookRefs: readonly string[];
  readonly rehearsalEvidenceRefs: readonly string[];
  readonly dataClasses: readonly string[];
  readonly securityControls: readonly string[];
  readonly incidentSeverityMapping: string;
  readonly owner: string;
  readonly constraintRefs: readonly string[];
  readonly blockerRefs: readonly string[];
}

const sourceRefs = [
  "prompt/478.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-9-the-assurance-ledger.md#9F",
  "blueprint/phase-9-the-assurance-ledger.md#9G",
  "blueprint/phase-9-the-assurance-ledger.md#9I",
  "blueprint/platform-runtime-and-release-blueprint.md#operational-readiness",
  "blueprint/phase-7-inside-the-nhs-app.md#operational-delivery",
  "blueprint/phase-6-the-pharmacy-loop.md#operational-exceptions",
  "blueprint/staff-operations-and-support-blueprint.md#support-escalation",
] as const;

const requiredInputPaths = [
  "data/release/476_release_wave_manifest.json",
  "data/signoff/477_final_signoff_register.json",
  "data/signoff/477_supplier_and_dependency_signoff_register.json",
  "data/bau/475_operating_model.json",
  "data/bau/475_runbook_bundle_manifest.json",
  "data/bau/475_support_escalation_paths.json",
  "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
  "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
] as const;

const releaseBinding = {
  releaseCandidateRef: "RC_LOCAL_V1",
  runtimePublicationBundleRef: "rpb::local::authoritative",
  releaseWatchTupleRef: "RWT_LOCAL_V1",
  releaseWatchTupleHash: "9e41919b1cc69c26",
  tenantScope: "tenant-demo-gp:programme-core-release",
  cohortScope: "wtc_476_wave1_core_web_smallest_safe",
  channelScope: "channel:core-web-and-staff;nhs-app-deferred",
  waveRef: "wave_476_1_core_web_canary",
} as const;

const wormAuditLinkage = {
  storeRef: "worm:programme-readiness-ledger",
  chainRef: "worm-chain:phase9:dependency-readiness",
  retentionClass: "records:operational-readiness:7y",
  redactionProfileRef: "redaction:synthetic-no-phi-no-secrets",
} as const;

const essentialFunctions = [
  {
    essentialFunctionRef: "ef_478_digital_intake",
    label: "Digital intake",
    routeFamilies: ["patient_request_start", "staff_workspace"],
    owner: "service-owner",
  },
  {
    essentialFunctionRef: "ef_478_safety_gate",
    label: "Safety gate",
    routeFamilies: ["patient_request_start", "staff_workspace"],
    owner: "clinical-safety-officer",
  },
  {
    essentialFunctionRef: "ef_478_triage_queue",
    label: "Triage queue",
    routeFamilies: ["staff_workspace", "ops_hub"],
    owner: "operations-lead",
  },
  {
    essentialFunctionRef: "ef_478_patient_status_secure_links",
    label: "Patient status and secure links",
    routeFamilies: ["patient_status", "staff_workspace"],
    owner: "support-operations-lead",
  },
  {
    essentialFunctionRef: "ef_478_local_booking",
    label: "Local booking",
    routeFamilies: ["booking", "staff_workspace"],
    owner: "booking-service-owner",
  },
  {
    essentialFunctionRef: "ef_478_hub_coordination",
    label: "Hub coordination",
    routeFamilies: ["ops_hub", "staff_workspace"],
    owner: "hub-service-owner",
  },
  {
    essentialFunctionRef: "ef_478_pharmacy_referral_loop",
    label: "Pharmacy referral loop",
    routeFamilies: ["pharmacy_dispatch", "patient_status"],
    owner: "pharmacy-service-owner",
  },
  {
    essentialFunctionRef: "ef_478_outbound_comms",
    label: "Outbound communications",
    routeFamilies: ["patient_status", "staff_workspace"],
    owner: "communications-owner",
  },
  {
    essentialFunctionRef: "ef_478_audit_search",
    label: "Audit and assurance search",
    routeFamilies: ["ops_hub", "audit"],
    owner: "assurance-lead",
  },
  {
    essentialFunctionRef: "ef_478_assistive_downgrade_path",
    label: "Assistive downgrade path",
    routeFamilies: ["staff_workspace", "assistive_review_queue"],
    owner: "clinical-safety-officer",
  },
] as const;

const dependencyDefinitions: readonly DependencyDefinition[] = [
  {
    dependencyRef: "dep_478_core_web_runtime_edge",
    label: "Core web runtime and private egress",
    dependencyClass: "runtime",
    launchCritical: true,
    baselineReadiness: "ready",
    essentialFunctionRefs: [
      "ef_478_digital_intake",
      "ef_478_safety_gate",
      "ef_478_triage_queue",
      "ef_478_patient_status_secure_links",
      "ef_478_hub_coordination",
      "ef_478_audit_search",
    ],
    routeFamilies: ["patient_request_start", "patient_status", "staff_workspace", "ops_hub"],
    fallbackModeRefs: ["fb_478_runtime_static_intake_pause", "fb_478_staff_queue_freeze"],
    serviceLevelBindingRef: "slb_478_runtime_edge",
    escalationContactRefs: ["contact_478_runtime_service_owner", "contact_478_platform_24x7"],
    runbookRefs: ["runbook_478_runtime_edge_degraded"],
    rehearsalEvidenceRefs: ["rehearsal_478_runtime_failover_tabletop"],
    dataClasses: ["operational_metadata", "masked_patient_reference", "audit_metadata"],
    securityControls: ["trust-zone-private-egress", "tenant-scope-boundary", "secrets-ref-only"],
    incidentSeverityMapping: "sev1 if patient intake and staff queue unavailable together",
    owner: "platform-operations-lead",
    constraintRefs: [],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_nhs_login_identity",
    label: "NHS login and identity handoff",
    dependencyClass: "identity",
    launchCritical: true,
    baselineReadiness: "ready_with_constraints",
    essentialFunctionRefs: [
      "ef_478_digital_intake",
      "ef_478_patient_status_secure_links",
      "ef_478_audit_search",
    ],
    routeFamilies: ["patient_request_start", "patient_status"],
    fallbackModeRefs: ["fb_478_identity_unsigned_intake", "fb_478_identity_repair_queue"],
    serviceLevelBindingRef: "slb_478_nhs_login_identity",
    escalationContactRefs: ["contact_478_nhs_login_service_desk", "contact_478_identity_owner"],
    runbookRefs: ["runbook_478_identity_degraded"],
    rehearsalEvidenceRefs: ["rehearsal_478_identity_degraded_journey"],
    dataClasses: ["identity_assertion_metadata", "masked_patient_reference"],
    securityControls: ["oidc-state-boundary", "local-session-lease", "identity-repair-audit"],
    incidentSeverityMapping:
      "sev2 if sign-in unavailable; sev1 if unauthenticated safe intake also unavailable",
    owner: "identity-access-owner",
    constraintRefs: ["constraint:478:signed-in-status-pauses-when-nhs-login-unavailable"],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_notification_provider",
    label: "Notification and secure message provider",
    dependencyClass: "messaging",
    launchCritical: true,
    baselineReadiness: "ready_with_constraints",
    essentialFunctionRefs: [
      "ef_478_patient_status_secure_links",
      "ef_478_outbound_comms",
      "ef_478_triage_queue",
    ],
    routeFamilies: ["patient_status", "staff_workspace"],
    fallbackModeRefs: ["fb_478_manual_patient_contact", "fb_478_secure_link_retry_hold"],
    serviceLevelBindingRef: "slb_478_notification_provider",
    escalationContactRefs: [
      "contact_478_notification_supplier",
      "contact_478_support_out_of_hours",
    ],
    runbookRefs: ["runbook_478_notification_manual_contact"],
    rehearsalEvidenceRefs: ["rehearsal_478_manual_contact_switch"],
    dataClasses: ["contact_route_metadata", "message_delivery_metadata"],
    securityControls: ["contact-route-minimisation", "delivery-evidence-retention"],
    incidentSeverityMapping: "sev2 if outbound patient comms degraded for more than 30 minutes",
    owner: "communications-owner",
    constraintRefs: ["constraint:478:manual-contact-volume-ceiling-40-cases-per-hour"],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_booking_provider_adapter",
    label: "Local booking provider adapter",
    dependencyClass: "booking",
    launchCritical: true,
    baselineReadiness: "ready_with_constraints",
    essentialFunctionRefs: ["ef_478_local_booking", "ef_478_hub_coordination"],
    routeFamilies: ["booking", "staff_workspace", "ops_hub"],
    fallbackModeRefs: ["fb_478_booking_manual_appointment_log"],
    serviceLevelBindingRef: "slb_478_booking_provider",
    escalationContactRefs: ["contact_478_booking_supplier", "contact_478_booking_owner"],
    runbookRefs: ["runbook_478_booking_manual_log"],
    rehearsalEvidenceRefs: ["rehearsal_478_booking_manual_log"],
    dataClasses: ["appointment_metadata", "masked_patient_reference"],
    securityControls: ["appointment-truth-settlement", "manual-log-retention"],
    incidentSeverityMapping: "sev2 if slot offer or appointment confirmation truth unavailable",
    owner: "booking-service-owner",
    constraintRefs: ["constraint:478:direct-supplier-ooh-support-not-contracted"],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_pharmacy_eps_provider_directory",
    label: "Pharmacy EPS and provider directory",
    dependencyClass: "pharmacy",
    launchCritical: false,
    baselineReadiness: "observe_only",
    essentialFunctionRefs: ["ef_478_pharmacy_referral_loop", "ef_478_patient_status_secure_links"],
    routeFamilies: ["pharmacy_dispatch", "patient_status"],
    fallbackModeRefs: ["fb_478_pharmacy_manual_prescription_comms"],
    serviceLevelBindingRef: "slb_478_pharmacy_eps_provider",
    escalationContactRefs: ["contact_478_pharmacy_supplier", "contact_478_pharmacy_owner"],
    runbookRefs: ["runbook_478_pharmacy_manual_prescription"],
    rehearsalEvidenceRefs: ["rehearsal_478_pharmacy_manual_path"],
    dataClasses: ["pharmacy_referral_metadata", "ods_directory_metadata"],
    securityControls: ["ods-directory-authority", "referral-package-redaction"],
    incidentSeverityMapping: "sev2 in pharmacy wave; observe-only for core web Wave 1",
    owner: "pharmacy-service-owner",
    constraintRefs: ["constraint:478:wave1-excludes-pharmacy-dispatch"],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_nhs_app_channel",
    label: "NHS App embedded channel",
    dependencyClass: "channel",
    launchCritical: false,
    baselineReadiness: "not_applicable",
    essentialFunctionRefs: ["ef_478_digital_intake", "ef_478_patient_status_secure_links"],
    routeFamilies: ["nhs_app_embedded_entry", "nhs_app_status", "nhs_app_artifact_delivery"],
    fallbackModeRefs: ["fb_478_nhs_app_core_web_redirect", "fb_478_channel_route_freeze"],
    serviceLevelBindingRef: "slb_478_nhs_app_channel",
    escalationContactRefs: ["contact_478_nhs_app_integration_manager"],
    runbookRefs: ["runbook_478_nhs_app_deferred_channel"],
    rehearsalEvidenceRefs: ["rehearsal_478_nhs_app_incident_walkthrough"],
    dataClasses: ["embedded_session_metadata", "channel_telemetry_metadata"],
    securityControls: ["scal-readiness", "connection-agreement-gate", "wcag-2-2-aa-evidence"],
    incidentSeverityMapping: "not launch critical while Wave 1 scope excludes NHS App",
    owner: "phase7-channel-owner",
    constraintRefs: ["constraint:478:nhs-app-channel-deferred-core-web-can-launch"],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_monitoring_alerting_destination",
    label: "Monitoring and alerting destination",
    dependencyClass: "monitoring",
    launchCritical: true,
    baselineReadiness: "ready",
    essentialFunctionRefs: [
      "ef_478_safety_gate",
      "ef_478_triage_queue",
      "ef_478_audit_search",
      "ef_478_assistive_downgrade_path",
    ],
    routeFamilies: ["ops_hub", "staff_workspace", "audit"],
    fallbackModeRefs: ["fb_478_monitoring_manual_watch_bridge"],
    serviceLevelBindingRef: "slb_478_monitoring_alerting",
    escalationContactRefs: ["contact_478_alert_owner_rota", "contact_478_incident_commander"],
    runbookRefs: ["runbook_478_monitoring_manual_watch"],
    rehearsalEvidenceRefs: ["rehearsal_478_alert_owner_rota_check"],
    dataClasses: ["telemetry_metadata", "incident_metadata"],
    securityControls: ["no-phi-telemetry", "alert-owner-rota", "incident-bridge-audit"],
    incidentSeverityMapping: "sev1 if clinical safety alerts cannot reach owner rota",
    owner: "observability-owner",
    constraintRefs: [],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_backup_restore_target",
    label: "Backup target and restore report channel",
    dependencyClass: "backup",
    launchCritical: true,
    baselineReadiness: "ready",
    essentialFunctionRefs: ["ef_478_audit_search", "ef_478_triage_queue", "ef_478_digital_intake"],
    routeFamilies: ["ops_hub", "audit", "staff_workspace"],
    fallbackModeRefs: ["fb_478_restore_report_manual_bridge"],
    serviceLevelBindingRef: "slb_478_backup_restore",
    escalationContactRefs: ["contact_478_backup_owner", "contact_478_restore_report_owner"],
    runbookRefs: ["runbook_478_backup_restore_report"],
    rehearsalEvidenceRefs: ["rehearsal_478_restore_report_channel"],
    dataClasses: ["backup_manifest_metadata", "restore_report_metadata"],
    securityControls: ["encrypted-backup-target", "restore-report-worm", "tenant-bound-restore"],
    incidentSeverityMapping: "sev1 if restore cannot prove tenant-bound report publication",
    owner: "resilience-owner",
    constraintRefs: [],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_document_export_store",
    label: "Document and export object store",
    dependencyClass: "storage",
    launchCritical: true,
    baselineReadiness: "ready",
    essentialFunctionRefs: ["ef_478_patient_status_secure_links", "ef_478_audit_search"],
    routeFamilies: ["patient_status", "audit", "ops_hub"],
    fallbackModeRefs: ["fb_478_export_pause_and_reissue"],
    serviceLevelBindingRef: "slb_478_document_export_store",
    escalationContactRefs: ["contact_478_storage_owner"],
    runbookRefs: ["runbook_478_export_store_degraded"],
    rehearsalEvidenceRefs: ["rehearsal_478_export_store_quarantine"],
    dataClasses: ["redacted_artifact_metadata", "document_reference_metadata"],
    securityControls: ["object-retention-class", "redacted-url-only", "legal-hold-aware"],
    incidentSeverityMapping:
      "sev2 if artifacts unavailable; sev1 if private object exposure suspected",
    owner: "records-governance-owner",
    constraintRefs: [],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_assurance_analytics_destination",
    label: "Assurance analytics destination",
    dependencyClass: "analytics",
    launchCritical: true,
    baselineReadiness: "ready",
    essentialFunctionRefs: ["ef_478_audit_search", "ef_478_assistive_downgrade_path"],
    routeFamilies: ["audit", "ops_hub", "assistive_review_queue"],
    fallbackModeRefs: ["fb_478_analytics_local_evidence_freeze"],
    serviceLevelBindingRef: "slb_478_assurance_analytics",
    escalationContactRefs: ["contact_478_analytics_owner"],
    runbookRefs: ["runbook_478_analytics_local_freeze"],
    rehearsalEvidenceRefs: ["rehearsal_478_analytics_freeze"],
    dataClasses: ["assurance_metric_metadata", "deidentified_usage_metadata"],
    securityControls: ["deidentified-only", "metric-retention", "assistive-freeze-disposition"],
    incidentSeverityMapping: "sev2 if readiness proof cannot be published",
    owner: "analytics-assurance-owner",
    constraintRefs: [],
    blockerRefs: [],
  },
  {
    dependencyRef: "dep_478_supplier_support_channel",
    label: "Supplier support and service desk routes",
    dependencyClass: "supplier_support",
    launchCritical: true,
    baselineReadiness: "ready_with_constraints",
    essentialFunctionRefs: [
      "ef_478_digital_intake",
      "ef_478_triage_queue",
      "ef_478_outbound_comms",
      "ef_478_audit_search",
    ],
    routeFamilies: ["ops_hub", "staff_workspace", "patient_status"],
    fallbackModeRefs: ["fb_478_supplier_comms_bridge"],
    serviceLevelBindingRef: "slb_478_supplier_support",
    escalationContactRefs: [
      "contact_478_supplier_service_desk_primary",
      "contact_478_supplier_service_desk_ooh",
    ],
    runbookRefs: ["runbook_478_supplier_escalation_bridge"],
    rehearsalEvidenceRefs: ["rehearsal_478_supplier_comms_bridge"],
    dataClasses: ["incident_metadata", "supplier_ticket_metadata"],
    securityControls: ["supplier-comms-redaction", "role-contact-validation"],
    incidentSeverityMapping:
      "sev1 when supplier route blocks patient-affecting incident containment",
    owner: "service-management-owner",
    constraintRefs: ["constraint:478:supplier-contact-refresh-due-before-wide-release"],
    blockerRefs: [],
  },
] as const;

const serviceLevelBindings = [
  {
    serviceLevelBindingId: "slb_478_runtime_edge",
    dependencyRef: "dep_478_core_web_runtime_edge",
    supportWindow: "24x7 platform on-call",
    businessHours: "09:00-17:00 Europe/London",
    outOfHours: "platform-on-call escalation route active",
    rto: "30m",
    rpo: "5m",
    alertThresholds: ["5xx rate > 2% for 5m", "staff queue projection stale > 10m"],
    assumption: "Runtime rollback and failover remain bounded to Wave 1 tenant cohort.",
    owner: "platform-operations-lead",
  },
  {
    serviceLevelBindingId: "slb_478_nhs_login_identity",
    dependencyRef: "dep_478_nhs_login_identity",
    supportWindow: "supplier published support with internal identity owner rota",
    businessHours: "09:00-17:00 Europe/London",
    outOfHours: "internal identity owner covers safe-mode routing; supplier OOH by status channel",
    rto: "60m",
    rpo: "not_applicable",
    alertThresholds: ["auth error rate > 4% for 10m", "OIDC callback failures > 10 in 15m"],
    assumption: "Signed-in journeys can pause while unauthenticated safe intake remains available.",
    owner: "identity-access-owner",
  },
  {
    serviceLevelBindingId: "slb_478_notification_provider",
    dependencyRef: "dep_478_notification_provider",
    supportWindow: "business-hours supplier plus support OOH practice route",
    businessHours: "08:00-18:30 Europe/London",
    outOfHours: "local support duty manager routes urgent patient contact only",
    rto: "45m",
    rpo: "15m delivery evidence",
    alertThresholds: ["delivery failure > 5% for 10m", "secure link settlement missing > 20m"],
    assumption: "Manual contact volume ceiling is enforced and audited.",
    owner: "communications-owner",
  },
  {
    serviceLevelBindingId: "slb_478_booking_provider",
    dependencyRef: "dep_478_booking_provider_adapter",
    supportWindow: "business-hours supplier; local OOH workaround only",
    businessHours: "08:00-18:30 Europe/London",
    outOfHours: "no direct supplier OOH support path; local duty manager can activate manual log",
    rto: "2h",
    rpo: "15m appointment truth delta",
    alertThresholds: ["commit settlement missing > 5m", "supplier mirror drift > 1 record"],
    assumption: "Manual appointment log must reconcile before patient-facing confirmation.",
    owner: "booking-service-owner",
  },
  {
    serviceLevelBindingId: "slb_478_pharmacy_eps_provider",
    dependencyRef: "dep_478_pharmacy_eps_provider_directory",
    supportWindow: "observe-only for Wave 1; supplier route required before pharmacy wave",
    businessHours: "09:00-17:00 Europe/London",
    outOfHours: "not contracted for Wave 1",
    rto: "not_applicable_wave1",
    rpo: "not_applicable_wave1",
    alertThresholds: ["directory freshness stale > 24h", "dispatch ack missing > 30m"],
    assumption: "Core web can launch because pharmacy dispatch is excluded from Wave 1.",
    owner: "pharmacy-service-owner",
  },
  {
    serviceLevelBindingId: "slb_478_nhs_app_channel",
    dependencyRef: "dep_478_nhs_app_channel",
    supportWindow: "deferred channel; monthly data and service management protocol pending",
    businessHours: "NHS App integration manager route when channel active",
    outOfHours: "not applicable until channel approval",
    rto: "not_applicable_wave1",
    rpo: "not_applicable_wave1",
    alertThresholds: ["SCAL evidence stale", "connection agreement not current"],
    assumption: "NHS App channel remains excluded while core web and staff launch scope proceeds.",
    owner: "phase7-channel-owner",
  },
  {
    serviceLevelBindingId: "slb_478_monitoring_alerting",
    dependencyRef: "dep_478_monitoring_alerting_destination",
    supportWindow: "24x7 alert owner rota",
    businessHours: "09:00-17:00 Europe/London",
    outOfHours: "duty incident commander plus alert owner rota",
    rto: "15m",
    rpo: "5m",
    alertThresholds: ["alert delivery failure > 2 events", "owner ack missing > 10m"],
    assumption: "Manual watch bridge is activated only with named owner acknowledgement.",
    owner: "observability-owner",
  },
  {
    serviceLevelBindingId: "slb_478_backup_restore",
    dependencyRef: "dep_478_backup_restore_target",
    supportWindow: "24x7 restore owner with report publisher route",
    businessHours: "09:00-17:00 Europe/London",
    outOfHours: "resilience owner and restore report owner both callable",
    rto: "4h",
    rpo: "15m",
    alertThresholds: [
      "backup target unavailable > 15m",
      "restore report publication missing > 30m",
    ],
    assumption:
      "Restore is not authoritative until report publication is current and tenant-bound.",
    owner: "resilience-owner",
  },
  {
    serviceLevelBindingId: "slb_478_document_export_store",
    dependencyRef: "dep_478_document_export_store",
    supportWindow: "24x7 storage operations with records owner approval",
    businessHours: "09:00-17:00 Europe/London",
    outOfHours: "storage on-call routes suspected exposure to incident commander",
    rto: "2h",
    rpo: "15m",
    alertThresholds: ["signed artifact fetch failure > 2%", "raw artifact URL detected"],
    assumption: "Export pause is safer than reissuing artifacts without redacted grants.",
    owner: "records-governance-owner",
  },
  {
    serviceLevelBindingId: "slb_478_assurance_analytics",
    dependencyRef: "dep_478_assurance_analytics_destination",
    supportWindow: "business-hours analytics owner with local evidence freeze fallback",
    businessHours: "09:00-17:00 Europe/London",
    outOfHours: "evidence freeze can run locally; analytics replay waits for owner",
    rto: "4h",
    rpo: "1h",
    alertThresholds: [
      "assurance metric publish stale > 60m",
      "assistive trust projection stale > 30m",
    ],
    assumption: "No launch action reads analytics as authority while destination is degraded.",
    owner: "analytics-assurance-owner",
  },
  {
    serviceLevelBindingId: "slb_478_supplier_support",
    dependencyRef: "dep_478_supplier_support_channel",
    supportWindow: "named primary and OOH supplier escalation contacts",
    businessHours: "08:00-18:30 Europe/London",
    outOfHours: "OOH route must validate role, phone ref, and email ref before activation",
    rto: "30m first response for sev1",
    rpo: "not_applicable",
    alertThresholds: ["supplier contact verification stale > 30d", "role route missing"],
    assumption: "Supplier contact freshness blocks launch-critical incident fallback.",
    owner: "service-management-owner",
  },
] as const;

const contacts = [
  {
    contactId: "contact_478_runtime_service_owner",
    dependencyRef: "dep_478_core_web_runtime_edge",
    role: "Runtime service owner",
    tier: "primary",
    routeRefs: ["service-desk:platform-runtime", "phone-ref:synthetic-runtime-primary"],
    emailRef: "email-ref:runtime-service-owner",
    phoneRef: "phone-ref:synthetic-runtime-primary",
    verifiedAt: "2026-04-24T10:00:00.000Z",
    expiresAt: "2026-05-24T10:00:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_platform_24x7",
    dependencyRef: "dep_478_core_web_runtime_edge",
    role: "Platform 24x7 on-call",
    tier: "out_of_hours",
    routeRefs: ["pager-ref:synthetic-platform-24x7"],
    emailRef: "email-ref:platform-on-call",
    phoneRef: "phone-ref:synthetic-platform-24x7",
    verifiedAt: "2026-04-24T10:05:00.000Z",
    expiresAt: "2026-05-24T10:05:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_nhs_login_service_desk",
    dependencyRef: "dep_478_nhs_login_identity",
    role: "NHS login service desk route",
    tier: "supplier",
    routeRefs: ["service-desk:nhs-login-partner-support"],
    emailRef: "email-ref:nhs-login-partner-support",
    phoneRef: "phone-ref:not-published-use-service-desk",
    verifiedAt: "2026-04-22T09:00:00.000Z",
    expiresAt: "2026-05-22T09:00:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: false,
  },
  {
    contactId: "contact_478_identity_owner",
    dependencyRef: "dep_478_nhs_login_identity",
    role: "Identity access owner",
    tier: "internal_owner",
    routeRefs: ["service-desk:identity-access", "phone-ref:synthetic-identity-owner"],
    emailRef: "email-ref:identity-access-owner",
    phoneRef: "phone-ref:synthetic-identity-owner",
    verifiedAt: "2026-04-22T09:05:00.000Z",
    expiresAt: "2026-05-22T09:05:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_notification_supplier",
    dependencyRef: "dep_478_notification_provider",
    role: "Notification supplier support",
    tier: "supplier",
    routeRefs: ["service-desk:notification-supplier"],
    emailRef: "email-ref:notification-supplier",
    phoneRef: "phone-ref:synthetic-notification-supplier",
    verifiedAt: "2026-04-20T14:00:00.000Z",
    expiresAt: "2026-05-20T14:00:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: false,
  },
  {
    contactId: "contact_478_support_out_of_hours",
    dependencyRef: "dep_478_notification_provider",
    role: "Support duty manager OOH",
    tier: "out_of_hours",
    routeRefs: ["pager-ref:synthetic-support-duty-manager"],
    emailRef: "email-ref:support-duty-manager",
    phoneRef: "phone-ref:synthetic-support-duty-manager",
    verifiedAt: "2026-04-20T14:10:00.000Z",
    expiresAt: "2026-05-20T14:10:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_booking_supplier",
    dependencyRef: "dep_478_booking_provider_adapter",
    role: "Booking supplier business-hours support",
    tier: "supplier",
    routeRefs: ["service-desk:booking-supplier"],
    emailRef: "email-ref:booking-supplier",
    phoneRef: "phone-ref:synthetic-booking-supplier",
    verifiedAt: "2026-04-19T11:30:00.000Z",
    expiresAt: "2026-05-19T11:30:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: false,
  },
  {
    contactId: "contact_478_booking_owner",
    dependencyRef: "dep_478_booking_provider_adapter",
    role: "Booking service owner",
    tier: "internal_owner",
    routeRefs: ["service-desk:booking-service-owner"],
    emailRef: "email-ref:booking-owner",
    phoneRef: "phone-ref:synthetic-booking-owner",
    verifiedAt: "2026-04-19T11:35:00.000Z",
    expiresAt: "2026-05-19T11:35:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_pharmacy_supplier",
    dependencyRef: "dep_478_pharmacy_eps_provider_directory",
    role: "Pharmacy provider supplier route",
    tier: "supplier",
    routeRefs: ["service-desk:pharmacy-provider-directory"],
    emailRef: "email-ref:pharmacy-provider-support",
    phoneRef: "phone-ref:synthetic-pharmacy-provider",
    verifiedAt: "2026-04-18T15:00:00.000Z",
    expiresAt: "2026-05-18T15:00:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: false,
  },
  {
    contactId: "contact_478_pharmacy_owner",
    dependencyRef: "dep_478_pharmacy_eps_provider_directory",
    role: "Pharmacy service owner",
    tier: "internal_owner",
    routeRefs: ["service-desk:pharmacy-owner"],
    emailRef: "email-ref:pharmacy-owner",
    phoneRef: "phone-ref:synthetic-pharmacy-owner",
    verifiedAt: "2026-04-18T15:05:00.000Z",
    expiresAt: "2026-05-18T15:05:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_nhs_app_integration_manager",
    dependencyRef: "dep_478_nhs_app_channel",
    role: "NHS App integration manager",
    tier: "supplier_channel",
    routeRefs: ["service-desk:nhs-app-integration-manager"],
    emailRef: "email-ref:nhs-app-integration-manager",
    phoneRef: "phone-ref:not-applicable-until-channel-active",
    verifiedAt: "2026-04-16T10:00:00.000Z",
    expiresAt: "2026-05-16T10:00:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: false,
  },
  {
    contactId: "contact_478_alert_owner_rota",
    dependencyRef: "dep_478_monitoring_alerting_destination",
    role: "Alert owner rota",
    tier: "primary",
    routeRefs: ["rota-ref:alert-owner-24x7"],
    emailRef: "email-ref:alert-owner-rota",
    phoneRef: "phone-ref:synthetic-alert-rota",
    verifiedAt: "2026-04-25T08:00:00.000Z",
    expiresAt: "2026-05-25T08:00:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_incident_commander",
    dependencyRef: "dep_478_monitoring_alerting_destination",
    role: "Incident commander",
    tier: "out_of_hours",
    routeRefs: ["pager-ref:incident-commander"],
    emailRef: "email-ref:incident-commander",
    phoneRef: "phone-ref:synthetic-incident-commander",
    verifiedAt: "2026-04-25T08:05:00.000Z",
    expiresAt: "2026-05-25T08:05:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_backup_owner",
    dependencyRef: "dep_478_backup_restore_target",
    role: "Backup target owner",
    tier: "primary",
    routeRefs: ["service-desk:backup-owner"],
    emailRef: "email-ref:backup-owner",
    phoneRef: "phone-ref:synthetic-backup-owner",
    verifiedAt: "2026-04-23T13:00:00.000Z",
    expiresAt: "2026-05-23T13:00:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_restore_report_owner",
    dependencyRef: "dep_478_backup_restore_target",
    role: "Restore report publisher",
    tier: "primary",
    routeRefs: ["service-desk:restore-report-publisher"],
    emailRef: "email-ref:restore-report-publisher",
    phoneRef: "phone-ref:synthetic-restore-report-publisher",
    verifiedAt: "2026-04-23T13:05:00.000Z",
    expiresAt: "2026-05-23T13:05:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_storage_owner",
    dependencyRef: "dep_478_document_export_store",
    role: "Object storage owner",
    tier: "primary",
    routeRefs: ["service-desk:object-storage-owner"],
    emailRef: "email-ref:object-storage-owner",
    phoneRef: "phone-ref:synthetic-object-storage-owner",
    verifiedAt: "2026-04-21T09:00:00.000Z",
    expiresAt: "2026-05-21T09:00:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_analytics_owner",
    dependencyRef: "dep_478_assurance_analytics_destination",
    role: "Analytics assurance owner",
    tier: "primary",
    routeRefs: ["service-desk:analytics-assurance"],
    emailRef: "email-ref:analytics-assurance-owner",
    phoneRef: "phone-ref:synthetic-analytics-owner",
    verifiedAt: "2026-04-21T09:15:00.000Z",
    expiresAt: "2026-05-21T09:15:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
  {
    contactId: "contact_478_supplier_service_desk_primary",
    dependencyRef: "dep_478_supplier_support_channel",
    role: "Supplier service desk primary",
    tier: "supplier",
    routeRefs: ["service-desk:supplier-primary"],
    emailRef: "email-ref:supplier-primary",
    phoneRef: "phone-ref:synthetic-supplier-primary",
    verifiedAt: "2026-04-17T12:00:00.000Z",
    expiresAt: "2026-05-17T12:00:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: false,
  },
  {
    contactId: "contact_478_supplier_service_desk_ooh",
    dependencyRef: "dep_478_supplier_support_channel",
    role: "Supplier service desk OOH escalation",
    tier: "out_of_hours",
    routeRefs: ["pager-ref:supplier-ooh"],
    emailRef: "email-ref:supplier-ooh",
    phoneRef: "phone-ref:synthetic-supplier-ooh",
    verifiedAt: "2026-04-17T12:05:00.000Z",
    expiresAt: "2026-05-17T12:05:00.000Z",
    verificationState: "verified",
    outOfHoursCoverage: true,
  },
] as const;

const fallbackModes = [
  {
    fallbackModeId: "fb_478_runtime_static_intake_pause",
    dependencyRef: "dep_478_core_web_runtime_edge",
    label: "Static intake pause and status banner",
    continuityState: "degraded",
    activationCommandRef: "cmd_478_activate_runtime_static_pause",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["patient_request_start", "patient_status"],
  },
  {
    fallbackModeId: "fb_478_staff_queue_freeze",
    dependencyRef: "dep_478_core_web_runtime_edge",
    label: "Staff queue freeze with manual priority list",
    continuityState: "manual",
    activationCommandRef: "cmd_478_activate_staff_queue_manual_priority",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["staff_workspace", "ops_hub"],
  },
  {
    fallbackModeId: "fb_478_identity_unsigned_intake",
    dependencyRef: "dep_478_nhs_login_identity",
    label: "Unsigned intake with local identity repair",
    continuityState: "degraded",
    activationCommandRef: "cmd_478_activate_unsigned_intake",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["patient_request_start"],
  },
  {
    fallbackModeId: "fb_478_identity_repair_queue",
    dependencyRef: "dep_478_nhs_login_identity",
    label: "Identity repair queue for signed-in status",
    continuityState: "manual",
    activationCommandRef: "cmd_478_activate_identity_repair_queue",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["patient_status"],
  },
  {
    fallbackModeId: "fb_478_manual_patient_contact",
    dependencyRef: "dep_478_notification_provider",
    label: "Manual patient contact through verified route",
    continuityState: "manual",
    activationCommandRef: "cmd_478_activate_manual_patient_contact",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["patient_status", "staff_workspace"],
  },
  {
    fallbackModeId: "fb_478_secure_link_retry_hold",
    dependencyRef: "dep_478_notification_provider",
    label: "Secure link retry hold",
    continuityState: "degraded",
    activationCommandRef: "cmd_478_activate_secure_link_retry_hold",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["patient_status"],
  },
  {
    fallbackModeId: "fb_478_booking_manual_appointment_log",
    dependencyRef: "dep_478_booking_provider_adapter",
    label: "Manual appointment log with reconciliation gate",
    continuityState: "manual",
    activationCommandRef: "cmd_478_activate_booking_manual_log",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["booking", "staff_workspace"],
  },
  {
    fallbackModeId: "fb_478_pharmacy_manual_prescription_comms",
    dependencyRef: "dep_478_pharmacy_eps_provider_directory",
    label: "Manual prescription and pharmacy communication",
    continuityState: "manual",
    activationCommandRef: "cmd_478_activate_pharmacy_manual_comms",
    privacyRetentionPosture: "untested",
    routeFamilyRefs: ["pharmacy_dispatch"],
  },
  {
    fallbackModeId: "fb_478_nhs_app_core_web_redirect",
    dependencyRef: "dep_478_nhs_app_channel",
    label: "Core web route remains active outside NHS App",
    continuityState: "degraded",
    activationCommandRef: "cmd_478_keep_nhs_app_deferred",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["nhs_app_embedded_entry", "patient_request_start"],
  },
  {
    fallbackModeId: "fb_478_channel_route_freeze",
    dependencyRef: "dep_478_nhs_app_channel",
    label: "NHS App route freeze",
    continuityState: "blocked",
    activationCommandRef: "cmd_478_freeze_nhs_app_channel",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["nhs_app_status", "nhs_app_artifact_delivery"],
  },
  {
    fallbackModeId: "fb_478_monitoring_manual_watch_bridge",
    dependencyRef: "dep_478_monitoring_alerting_destination",
    label: "Manual watch bridge with owner acknowledgement",
    continuityState: "manual",
    activationCommandRef: "cmd_478_activate_monitoring_manual_watch",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["ops_hub"],
  },
  {
    fallbackModeId: "fb_478_restore_report_manual_bridge",
    dependencyRef: "dep_478_backup_restore_target",
    label: "Manual restore report bridge",
    continuityState: "manual",
    activationCommandRef: "cmd_478_activate_restore_report_bridge",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["ops_hub", "audit"],
  },
  {
    fallbackModeId: "fb_478_export_pause_and_reissue",
    dependencyRef: "dep_478_document_export_store",
    label: "Artifact export pause and controlled reissue",
    continuityState: "degraded",
    activationCommandRef: "cmd_478_activate_export_pause",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["patient_status", "audit"],
  },
  {
    fallbackModeId: "fb_478_analytics_local_evidence_freeze",
    dependencyRef: "dep_478_assurance_analytics_destination",
    label: "Local evidence freeze and delayed analytics replay",
    continuityState: "degraded",
    activationCommandRef: "cmd_478_activate_analytics_freeze",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["audit", "ops_hub"],
  },
  {
    fallbackModeId: "fb_478_supplier_comms_bridge",
    dependencyRef: "dep_478_supplier_support_channel",
    label: "Supplier communications bridge",
    continuityState: "manual",
    activationCommandRef: "cmd_478_activate_supplier_bridge",
    privacyRetentionPosture: "safe",
    routeFamilyRefs: ["ops_hub"],
  },
] as const;

const runbooks = [
  {
    runbookId: "runbook_478_runtime_edge_degraded",
    title: "Core web runtime degraded mode",
    dependencyRefs: ["dep_478_core_web_runtime_edge"],
    fallbackModeRefs: ["fb_478_runtime_static_intake_pause", "fb_478_staff_queue_freeze"],
    owner: "platform-operations-lead",
    trigger: "Runtime health envelope breaches or private egress unavailable.",
    steps: [
      "Freeze non-essential writes for the Wave 1 tenant cohort.",
      "Publish static intake pause and patient status degradation message.",
      "Open staff queue manual priority list from last settled projection.",
      "Escalate platform on-call and incident commander.",
      "Do not resume dynamic intake until restore evidence is current.",
    ],
    exitCriterionRefs: ["exit_478_runtime_projection_current", "exit_478_runtime_alerts_clear"],
    privacyRetentionControls: ["no-raw-event-browser-joins", "manual-list-destroy-after-replay"],
  },
  {
    runbookId: "runbook_478_identity_degraded",
    title: "NHS login degraded identity fallback",
    dependencyRefs: ["dep_478_nhs_login_identity"],
    fallbackModeRefs: ["fb_478_identity_unsigned_intake", "fb_478_identity_repair_queue"],
    owner: "identity-access-owner",
    trigger: "NHS login handoff fails or callback evidence stale.",
    steps: [
      "Pause signed-in request start and signed-in status claims.",
      "Route urgent and standard intake to unsigned flow with repair marker.",
      "Open identity repair queue for staff follow-up.",
      "Escalate NHS login service desk during supplier support window.",
      "Re-enable signed-in status only after callback success and repair queue drain.",
    ],
    exitCriterionRefs: [
      "exit_478_identity_callback_success",
      "exit_478_identity_repair_queue_clear",
    ],
    privacyRetentionControls: ["masked-patient-reference-only", "identity-repair-audit-required"],
  },
  {
    runbookId: "runbook_478_notification_manual_contact",
    title: "Notification provider manual contact fallback",
    dependencyRefs: ["dep_478_notification_provider"],
    fallbackModeRefs: ["fb_478_manual_patient_contact", "fb_478_secure_link_retry_hold"],
    owner: "communications-owner",
    trigger: "Message delivery evidence missing or secure link dispatch failing.",
    steps: [
      "Pause resend automation and retain failed delivery evidence.",
      "Assign manual contact queue to support duty manager.",
      "Use verified contact route only; no free-text PHI in supplier ticket.",
      "Record contact outcome and reconcile delivery state.",
      "Exit when delivery evidence and route repair both settle.",
    ],
    exitCriterionRefs: [
      "exit_478_notification_delivery_recovered",
      "exit_478_manual_contact_reconciled",
    ],
    privacyRetentionControls: ["contact-minimisation", "delivery-evidence-retention"],
  },
  {
    runbookId: "runbook_478_booking_manual_log",
    title: "Booking provider manual appointment log",
    dependencyRefs: ["dep_478_booking_provider_adapter"],
    fallbackModeRefs: ["fb_478_booking_manual_appointment_log"],
    owner: "booking-service-owner",
    trigger: "Slot search, hold, commit, or supplier mirror confirmation unavailable.",
    steps: [
      "Stop patient-facing appointment confirmation claims.",
      "Open manual appointment log with duty manager ownership.",
      "Hold patient communications until appointment truth is reconciled.",
      "Escalate supplier during business-hours window and internal owner OOH.",
      "Replay manual log into appointment truth projection before exit.",
    ],
    exitCriterionRefs: [
      "exit_478_booking_truth_reconciled",
      "exit_478_booking_supplier_ack_current",
    ],
    privacyRetentionControls: ["manual-log-retention-24h-after-replay", "masked-reference-only"],
  },
  {
    runbookId: "runbook_478_pharmacy_manual_prescription",
    title: "Pharmacy provider manual prescription and communication path",
    dependencyRefs: ["dep_478_pharmacy_eps_provider_directory"],
    fallbackModeRefs: ["fb_478_pharmacy_manual_prescription_comms"],
    owner: "pharmacy-service-owner",
    trigger: "Provider directory, EPS dispatch, acknowledgement, or outcome reconciliation fails.",
    steps: [
      "Keep pharmacy route observe-only for Wave 1.",
      "If pharmacy wave is active, stop automated dispatch before manual communication.",
      "Confirm manual prescription path has current rehearsal evidence.",
      "Do not activate untested manual communication path for live patient referrals.",
      "Exit only after provider ack and outcome reconciliation are current.",
    ],
    exitCriterionRefs: ["exit_478_pharmacy_manual_rehearsed", "exit_478_pharmacy_ack_current"],
    privacyRetentionControls: ["referral-redaction", "manual-comms-rehearsal-required"],
  },
  {
    runbookId: "runbook_478_nhs_app_deferred_channel",
    title: "NHS App deferred channel route freeze",
    dependencyRefs: ["dep_478_nhs_app_channel"],
    fallbackModeRefs: ["fb_478_nhs_app_core_web_redirect", "fb_478_channel_route_freeze"],
    owner: "phase7-channel-owner",
    trigger: "Channel remains outside Wave 1 release or SCAL/connection evidence is stale.",
    steps: [
      "Keep NHS App entry routes out of the release scope.",
      "Maintain core web and staff routes as launchable surfaces.",
      "Route support queries to standard core web service desk.",
      "Prepare monthly data and incident walkthrough evidence for later limited release.",
      "Exit only through channel approval and wave action settlement.",
    ],
    exitCriterionRefs: [
      "exit_478_nhs_app_scal_current",
      "exit_478_nhs_app_limited_release_approved",
    ],
    privacyRetentionControls: ["wcag-2-2-aa-evidence", "connection-agreement-current"],
  },
  {
    runbookId: "runbook_478_monitoring_manual_watch",
    title: "Monitoring manual watch bridge",
    dependencyRefs: ["dep_478_monitoring_alerting_destination"],
    fallbackModeRefs: ["fb_478_monitoring_manual_watch_bridge"],
    owner: "observability-owner",
    trigger: "Alerting destination configured but delivery or owner acknowledgement absent.",
    steps: [
      "Confirm alert owner rota before manual watch starts.",
      "Route clinical safety alerts to incident commander if owner ack is absent.",
      "Record manual observation checks at fifteen-minute intervals.",
      "Treat missing rota as launch-blocking, not degraded-ready.",
      "Exit only after destination delivery and owner acknowledgement are current.",
    ],
    exitCriterionRefs: ["exit_478_alert_owner_ack_current", "exit_478_monitoring_delivery_current"],
    privacyRetentionControls: ["no-phi-telemetry", "manual-watch-audit"],
  },
  {
    runbookId: "runbook_478_backup_restore_report",
    title: "Backup restore and report publication fallback",
    dependencyRefs: ["dep_478_backup_restore_target"],
    fallbackModeRefs: ["fb_478_restore_report_manual_bridge"],
    owner: "resilience-owner",
    trigger: "Backup target, restore proof, or restore report publication unavailable.",
    steps: [
      "Keep restore evidence in recovery-only state until report channel publishes.",
      "Escalate backup owner and restore report owner together.",
      "Use manual report bridge only with tenant-bound restore hash.",
      "Block launch decisions when report channel is absent.",
      "Exit after restore report is WORM-published and linked to runtime tuple.",
    ],
    exitCriterionRefs: ["exit_478_restore_report_published", "exit_478_restore_hash_bound"],
    privacyRetentionControls: ["restore-report-worm", "tenant-bound-restore-proof"],
  },
  {
    runbookId: "runbook_478_export_store_degraded",
    title: "Document export store degraded mode",
    dependencyRefs: ["dep_478_document_export_store"],
    fallbackModeRefs: ["fb_478_export_pause_and_reissue"],
    owner: "records-governance-owner",
    trigger: "Signed artifact delivery fails, quarantine triggers, or raw URL risk detected.",
    steps: [
      "Pause affected export class and prevent raw object URL rendering.",
      "Publish artifact unavailable status to staff and patient status surfaces.",
      "Inspect quarantine and legal hold state before reissue.",
      "Reissue only through signed redacted grant.",
      "Exit after successful redacted grant fetch and audit replay.",
    ],
    exitCriterionRefs: ["exit_478_export_grant_reissued", "exit_478_export_audit_replayed"],
    privacyRetentionControls: ["redacted-grant-only", "legal-hold-aware"],
  },
  {
    runbookId: "runbook_478_analytics_local_freeze",
    title: "Assurance analytics local freeze",
    dependencyRefs: ["dep_478_assurance_analytics_destination"],
    fallbackModeRefs: ["fb_478_analytics_local_evidence_freeze"],
    owner: "analytics-assurance-owner",
    trigger: "Analytics destination stale while readiness proof is needed.",
    steps: [
      "Freeze local evidence pack with deterministic hash.",
      "Stop treating analytics destination as readiness authority.",
      "Queue replay to analytics destination after owner review.",
      "Keep assistive trust decisions in conservative mode.",
      "Exit after replay hash parity and owner signoff.",
    ],
    exitCriterionRefs: ["exit_478_analytics_hash_parity", "exit_478_analytics_owner_signoff"],
    privacyRetentionControls: ["deidentified-only", "metric-retention"],
  },
  {
    runbookId: "runbook_478_supplier_escalation_bridge",
    title: "Supplier support communications bridge",
    dependencyRefs: ["dep_478_supplier_support_channel"],
    fallbackModeRefs: ["fb_478_supplier_comms_bridge"],
    owner: "service-management-owner",
    trigger: "Supplier support route needed for a launch-critical dependency incident.",
    steps: [
      "Verify supplier role, phone ref, email ref, and service desk ref.",
      "Open supplier bridge with redacted impact summary only.",
      "Assign internal owner and incident commander for decisions.",
      "Reject stale or unverified contact routes as blocking.",
      "Exit after supplier acknowledgement and service owner closure note.",
    ],
    exitCriterionRefs: ["exit_478_supplier_contact_verified", "exit_478_supplier_ack_received"],
    privacyRetentionControls: ["supplier-ticket-redaction", "no-raw-patient-data"],
  },
] as const;

const activationCommands = fallbackModes.map((mode) => ({
  commandId: mode.activationCommandRef,
  fallbackModeRef: mode.fallbackModeId,
  dependencyRef: mode.dependencyRef,
  commandKind: "FallbackActivationCommand",
  authorizedRoleRefs: ["ROLE_SERVICE_OWNER", "ROLE_INCIDENT_COMMANDER"],
  requiredScope: releaseBinding.tenantScope,
  requiredCohortRef: releaseBinding.cohortScope,
  requiredChannelScope: releaseBinding.channelScope,
  idempotencyKeyTemplate: `idem-478-${mode.activationCommandRef}-{incidentRef}`,
  purposeBinding: "essential-function-continuity",
  injectedClockRequired: true,
  settlementState: "pending_backend_command_settlement",
  completionClaimPermitted: false,
  wormAuditRef: "worm:programme-readiness-ledger:fallback-activation-pending",
}));

const exitCriteria = [
  "exit_478_runtime_projection_current",
  "exit_478_runtime_alerts_clear",
  "exit_478_identity_callback_success",
  "exit_478_identity_repair_queue_clear",
  "exit_478_notification_delivery_recovered",
  "exit_478_manual_contact_reconciled",
  "exit_478_booking_truth_reconciled",
  "exit_478_booking_supplier_ack_current",
  "exit_478_pharmacy_manual_rehearsed",
  "exit_478_pharmacy_ack_current",
  "exit_478_nhs_app_scal_current",
  "exit_478_nhs_app_limited_release_approved",
  "exit_478_alert_owner_ack_current",
  "exit_478_monitoring_delivery_current",
  "exit_478_restore_report_published",
  "exit_478_restore_hash_bound",
  "exit_478_export_grant_reissued",
  "exit_478_export_audit_replayed",
  "exit_478_analytics_hash_parity",
  "exit_478_analytics_owner_signoff",
  "exit_478_supplier_contact_verified",
  "exit_478_supplier_ack_received",
].map((criterionId) => ({
  exitCriterionId: criterionId,
  criterionKind: "FallbackExitCriterion",
  requiredEvidenceState: "current",
  requiredAuthority: criterionId.includes("supplier")
    ? "supplier_ack_and_service_owner"
    : criterionId.includes("restore")
      ? "worm_published_restore_report"
      : "service_owner_verdict",
  failClosedIfMissing: true,
}));

const rehearsalEvidence = [
  {
    rehearsalEvidenceId: "rehearsal_478_runtime_failover_tabletop",
    runbookRef: "runbook_478_runtime_edge_degraded",
    dependencyRef: "dep_478_core_web_runtime_edge",
    scenario: "runtime failover and queue freeze tabletop",
    exercisedAt: "2026-04-18T10:00:00.000Z",
    result: "passed_with_minor_actions",
    evidenceRefs: ["data/evidence/468_restore_failover_chaos_slice_quarantine_results.json"],
    openGapRefs: [],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_identity_degraded_journey",
    runbookRef: "runbook_478_identity_degraded",
    dependencyRef: "dep_478_nhs_login_identity",
    scenario: "NHS login callback failure and unsigned intake continuity",
    exercisedAt: "2026-04-17T09:30:00.000Z",
    result: "passed_with_constraints",
    evidenceRefs: ["data/contracts/202_nhs_login_client_config_manifest.json"],
    openGapRefs: ["gap:478:external-supplier-ooh-contact-not-direct"],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_manual_contact_switch",
    runbookRef: "runbook_478_notification_manual_contact",
    dependencyRef: "dep_478_notification_provider",
    scenario: "delivery failure to support manual contact switch",
    exercisedAt: "2026-04-19T14:00:00.000Z",
    result: "passed_with_constraints",
    evidenceRefs: ["data/bau/475_support_escalation_paths.json"],
    openGapRefs: ["gap:478:manual-contact-volume-ceiling"],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_booking_manual_log",
    runbookRef: "runbook_478_booking_manual_log",
    dependencyRef: "dep_478_booking_provider_adapter",
    scenario: "booking supplier unavailable and manual log reconciliation",
    exercisedAt: "2026-04-20T11:00:00.000Z",
    result: "passed_with_constraints",
    evidenceRefs: ["data/bau/475_runbook_bundle_manifest.json"],
    openGapRefs: ["gap:478:direct-booking-supplier-ooh-support"],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_pharmacy_manual_path",
    runbookRef: "runbook_478_pharmacy_manual_prescription",
    dependencyRef: "dep_478_pharmacy_eps_provider_directory",
    scenario: "provider directory failure and manual prescription communication",
    exercisedAt: null,
    result: "not_exercised_wave1_observe_only",
    evidenceRefs: ["data/contracts/345_phase6_dependency_interface_map.yaml"],
    openGapRefs: ["gap:478:manual-pharmacy-prescription-path-untested"],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_nhs_app_incident_walkthrough",
    runbookRef: "runbook_478_nhs_app_deferred_channel",
    dependencyRef: "dep_478_nhs_app_channel",
    scenario: "NHS App channel deferred incident walkthrough",
    exercisedAt: "2026-04-16T15:30:00.000Z",
    result: "channel_deferred_core_web_unblocked",
    evidenceRefs: ["data/conformance/473_phase7_channel_readiness_reconciliation.json"],
    openGapRefs: ["gap:478:nhs-app-scal-before-channel-wave"],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_alert_owner_rota_check",
    runbookRef: "runbook_478_monitoring_manual_watch",
    dependencyRef: "dep_478_monitoring_alerting_destination",
    scenario: "configured alert destination with owner rota acknowledgement",
    exercisedAt: "2026-04-23T08:30:00.000Z",
    result: "passed",
    evidenceRefs: ["data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json"],
    openGapRefs: [],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_restore_report_channel",
    runbookRef: "runbook_478_backup_restore_report",
    dependencyRef: "dep_478_backup_restore_target",
    scenario: "backup restore target and restore report publication",
    exercisedAt: "2026-04-22T13:15:00.000Z",
    result: "passed",
    evidenceRefs: ["data/evidence/468_restore_failover_chaos_slice_quarantine_results.json"],
    openGapRefs: [],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_export_store_quarantine",
    runbookRef: "runbook_478_export_store_degraded",
    dependencyRef: "dep_478_document_export_store",
    scenario: "artifact export quarantine and redacted grant reissue",
    exercisedAt: "2026-04-21T12:45:00.000Z",
    result: "passed",
    evidenceRefs: ["data/evidence/468_restore_failover_chaos_slice_quarantine_results.json"],
    openGapRefs: [],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_analytics_freeze",
    runbookRef: "runbook_478_analytics_local_freeze",
    dependencyRef: "dep_478_assurance_analytics_destination",
    scenario: "analytics destination stale and local evidence freeze",
    exercisedAt: "2026-04-21T15:15:00.000Z",
    result: "passed",
    evidenceRefs: ["data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json"],
    openGapRefs: [],
  },
  {
    rehearsalEvidenceId: "rehearsal_478_supplier_comms_bridge",
    runbookRef: "runbook_478_supplier_escalation_bridge",
    dependencyRef: "dep_478_supplier_support_channel",
    scenario: "supplier bridge with redacted impact summary",
    exercisedAt: "2026-04-18T16:30:00.000Z",
    result: "passed_with_constraints",
    evidenceRefs: ["data/signoff/477_supplier_and_dependency_signoff_register.json"],
    openGapRefs: ["gap:478:supplier-contact-refresh-due-before-wide-release"],
  },
] as const;

const edgeCaseProofs = [
  {
    edgeCaseId: "edge_478_business_hours_ready_no_ooh",
    description: "Dependency is ready in business hours but has no out-of-hours supplier path.",
    dependencyRef: "dep_478_booking_provider_adapter",
    expectedReadiness: "ready_with_constraints",
    failClosedReason:
      "direct supplier OOH is missing; local duty workaround must own OOH activation",
  },
  {
    edgeCaseId: "edge_478_nhs_app_deferred_core_web_launch",
    description: "NHS App channel remains deferred while core web can launch.",
    dependencyRef: "dep_478_nhs_app_channel",
    expectedReadiness: "not_applicable",
    failClosedReason: "channel route frozen; launch scope excludes NHS App",
  },
  {
    edgeCaseId: "edge_478_pharmacy_manual_path_untested",
    description: "Pharmacy provider fails but manual prescription/communication path is untested.",
    dependencyRef: "dep_478_pharmacy_eps_provider_directory",
    expectedReadiness: "blocked",
    failClosedReason:
      "manual pharmacy communication has no rehearsal evidence for patient referrals",
  },
  {
    edgeCaseId: "edge_478_monitoring_configured_no_owner_rota",
    description: "Monitoring destination configured but alert owner rota is missing.",
    dependencyRef: "dep_478_monitoring_alerting_destination",
    expectedReadiness: "blocked",
    failClosedReason:
      "clinical safety alert destination cannot prove accountable owner acknowledgement",
  },
  {
    edgeCaseId: "edge_478_backup_ready_no_restore_report_channel",
    description: "Backup target ready but restore report channel is absent.",
    dependencyRef: "dep_478_backup_restore_target",
    expectedReadiness: "blocked",
    failClosedReason: "restore cannot become authoritative without WORM-published restore report",
  },
  {
    edgeCaseId: "edge_478_supplier_contact_expired_unverified",
    description:
      "Supplier contact exists but role, phone, or email reference is expired or unverified.",
    dependencyRef: "dep_478_supplier_support_channel",
    expectedReadiness: "blocked",
    failClosedReason:
      "supplier route cannot support a launch-critical incident with stale contact evidence",
  },
  {
    edgeCaseId: "edge_478_manual_fallback_privacy_retention_violation",
    description: "Manual fallback solves workflow but violates privacy or retention controls.",
    dependencyRef: "dep_478_notification_provider",
    expectedReadiness: "blocked",
    failClosedReason:
      "manual contact route must not move raw PHI into supplier tickets or unretained logs",
  },
] as const;

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize((value as JsonObject)[key])}`)
    .join(",")}}`;
}

function hashValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function withHash<T extends JsonObject>(
  record: T,
  hashField = "recordHash",
): T & { readonly recordHash: string } {
  return { ...record, [hashField]: hashValue(record) } as T & { readonly recordHash: string };
}

function readJson<T>(relativePath: string): T | null {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, "utf8")) as T;
}

function ensureRequiredInputs(): void {
  const missing = requiredInputPaths.filter(
    (relativePath) => !fs.existsSync(path.join(ROOT, relativePath)),
  );
  if (missing.length > 0) {
    throw new Error(`Missing required 478 source input(s): ${missing.join(", ")}`);
  }
}

function stateForDependency(
  definition: DependencyDefinition,
  scenarioState: DependencyScenarioState,
): DependencyReadinessState {
  if (scenarioState === "ready") {
    if (definition.dependencyRef === "dep_478_nhs_app_channel") return "not_applicable";
    if (definition.dependencyRef === "dep_478_pharmacy_eps_provider_directory")
      return "observe_only";
    return "ready";
  }
  if (scenarioState === "deferred_channel") {
    if (definition.dependencyRef === "dep_478_nhs_app_channel") return "not_applicable";
    if (definition.dependencyRef === "dep_478_pharmacy_eps_provider_directory")
      return "observe_only";
    return definition.launchCritical ? "ready" : definition.baselineReadiness;
  }
  if (scenarioState === "degraded_manual") {
    if (
      definition.dependencyRef === "dep_478_notification_provider" ||
      definition.dependencyRef === "dep_478_booking_provider_adapter"
    ) {
      return "ready_with_constraints";
    }
    if (definition.dependencyRef === "dep_478_pharmacy_eps_provider_directory")
      return "observe_only";
    return definition.baselineReadiness === "blocked" ? "blocked" : definition.baselineReadiness;
  }
  if (scenarioState === "blocked") {
    if (
      definition.dependencyRef === "dep_478_monitoring_alerting_destination" ||
      definition.dependencyRef === "dep_478_backup_restore_target" ||
      definition.dependencyRef === "dep_478_notification_provider"
    ) {
      return "blocked";
    }
  }
  if (scenarioState === "stale_contact") {
    if (definition.dependencyRef === "dep_478_supplier_support_channel") return "blocked";
  }
  return definition.baselineReadiness;
}

function scenarioBlockers(
  definition: DependencyDefinition,
  scenarioState: DependencyScenarioState,
): readonly string[] {
  const blockers = [...definition.blockerRefs];
  if (scenarioState === "blocked") {
    if (definition.dependencyRef === "dep_478_monitoring_alerting_destination") {
      blockers.push("blocker:478:alert-owner-rota-missing");
    }
    if (definition.dependencyRef === "dep_478_backup_restore_target") {
      blockers.push("blocker:478:restore-report-channel-absent");
    }
    if (definition.dependencyRef === "dep_478_notification_provider") {
      blockers.push("blocker:478:manual-fallback-privacy-retention-violation");
    }
  }
  if (
    scenarioState === "stale_contact" &&
    definition.dependencyRef === "dep_478_supplier_support_channel"
  ) {
    blockers.push("blocker:478:supplier-contact-role-phone-email-unverified");
  }
  return blockers;
}

function scenarioConstraints(
  definition: DependencyDefinition,
  scenarioState: DependencyScenarioState,
): readonly string[] {
  const constraints = [...definition.constraintRefs];
  if (
    scenarioState === "degraded_manual" &&
    definition.dependencyRef === "dep_478_notification_provider"
  ) {
    constraints.push("constraint:478:manual-contact-fallback-active");
  }
  if (
    scenarioState === "degraded_manual" &&
    definition.dependencyRef === "dep_478_booking_provider_adapter"
  ) {
    constraints.push("constraint:478:manual-appointment-log-active");
  }
  if (
    scenarioState === "deferred_channel" &&
    definition.dependencyRef === "dep_478_nhs_app_channel"
  ) {
    constraints.push("constraint:478:nhs-app-sample-users-zero");
  }
  return constraints;
}

function overallReadinessState(
  dependencyVerdicts: readonly {
    readonly readinessState: DependencyReadinessState;
    readonly launchCritical: boolean;
  }[],
  scenarioState: DependencyScenarioState,
): DependencyReadinessState {
  if (
    dependencyVerdicts.some(
      (verdict) => verdict.launchCritical && verdict.readinessState === "blocked",
    )
  ) {
    return "blocked";
  }
  if (scenarioState === "ready") return "ready";
  if (scenarioState === "deferred_channel") return "ready_with_constraints";
  if (
    dependencyVerdicts.some(
      (verdict) => verdict.launchCritical && verdict.readinessState === "ready_with_constraints",
    )
  ) {
    return "ready_with_constraints";
  }
  return "ready";
}

function continuityForEssentialFunction(
  dependencyStates: readonly {
    readonly dependencyRef: string;
    readonly readinessState: DependencyReadinessState;
    readonly fallbackModeRefs: readonly string[];
  }[],
  essentialFunctionRef: string,
  scenarioState: DependencyScenarioState,
): ContinuityState {
  const dependencies = dependencyDefinitions.filter((dependency) =>
    dependency.essentialFunctionRefs.includes(essentialFunctionRef),
  );
  const states = dependencies.map(
    (dependency) =>
      dependencyStates.find((state) => state.dependencyRef === dependency.dependencyRef)
        ?.readinessState ?? dependency.baselineReadiness,
  );
  if (states.includes("blocked")) return "blocked";
  if (
    scenarioState === "degraded_manual" &&
    (essentialFunctionRef === "ef_478_outbound_comms" ||
      essentialFunctionRef === "ef_478_local_booking" ||
      essentialFunctionRef === "ef_478_hub_coordination")
  ) {
    return "manual";
  }
  if (
    states.includes("ready_with_constraints") ||
    states.includes("observe_only") ||
    states.includes("not_applicable")
  ) {
    return "degraded";
  }
  return "normal";
}

function buildVerdicts(scenarioState: DependencyScenarioState) {
  return dependencyDefinitions.map((definition) => {
    const readinessState = stateForDependency(definition, scenarioState);
    const blockerRefs = scenarioBlockers(definition, scenarioState);
    const constraintRefs = scenarioConstraints(definition, scenarioState);
    return withHash({
      recordType: "ExternalDependencyReadinessVerdict",
      verdictId: `verdict_478_${definition.dependencyRef.replace("dep_478_", "")}`,
      dependencyRef: definition.dependencyRef,
      label: definition.label,
      dependencyClass: definition.dependencyClass,
      launchCritical: definition.launchCritical,
      readinessState,
      sourceRefs,
      releaseBinding,
      runtimeBinding: {
        topologyRef: "runtime-topology:phase9:authoritative",
        trustZoneRef: "trust-zone:programme-core-private-egress",
        publicationState: "authoritative",
      },
      tenantScope: releaseBinding.tenantScope,
      cohortScope: releaseBinding.cohortScope,
      channelScope: releaseBinding.channelScope,
      owner: definition.owner,
      serviceLevelBindingRef: definition.serviceLevelBindingRef,
      escalationContactRefs: definition.escalationContactRefs,
      fallbackModeRefs: definition.fallbackModeRefs,
      runbookRefs: definition.runbookRefs,
      rehearsalEvidenceRefs: definition.rehearsalEvidenceRefs,
      essentialFunctionRefs: definition.essentialFunctionRefs,
      routeFamilies: definition.routeFamilies,
      dataClasses: definition.dataClasses,
      securityControls: definition.securityControls,
      incidentSeverityMapping: definition.incidentSeverityMapping,
      constraintRefs,
      blockerRefs,
      evidenceRefs: [
        "data/release/476_release_wave_manifest.json",
        "data/signoff/477_supplier_and_dependency_signoff_register.json",
        "data/bau/475_runbook_bundle_manifest.json",
        "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
        "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      ],
      wormAuditLinkage,
      noRawSecretsOrPhi: true,
      generatedAt: FIXED_NOW,
    });
  });
}

function buildServiceLevelBindings() {
  return serviceLevelBindings.map((binding) =>
    withHash({
      recordType: "DependencyServiceLevelBinding",
      ...binding,
      sourceRefs,
      releaseBinding,
      owner: binding.owner,
      evidenceRefs: [
        "data/bau/475_operating_model.json",
        "data/bau/475_support_escalation_paths.json",
      ],
      generatedAt: FIXED_NOW,
    }),
  );
}

function buildContacts(scenarioState: DependencyScenarioState) {
  return contacts.map((contact) => {
    const stale =
      scenarioState === "stale_contact" &&
      contact.dependencyRef === "dep_478_supplier_support_channel" &&
      contact.tier === "out_of_hours";
    return withHash({
      recordType: "DependencyEscalationContact",
      ...contact,
      verifiedAt: stale ? "2026-02-01T12:05:00.000Z" : contact.verifiedAt,
      expiresAt: stale ? "2026-03-01T12:05:00.000Z" : contact.expiresAt,
      verificationState: stale ? "expired_role_phone_email_unverified" : contact.verificationState,
      routeRefs: stale ? ["service-desk:supplier-ooh-expired"] : contact.routeRefs,
      emailRef: stale ? "email-ref:expired-supplier-ooh" : contact.emailRef,
      phoneRef: stale ? "phone-ref:unverified-supplier-ooh" : contact.phoneRef,
      sourceRefs,
      releaseBinding,
      noRawContactDetails: true,
      evidenceRefs: ["data/bau/475_support_escalation_paths.json"],
      generatedAt: FIXED_NOW,
    });
  });
}

function buildFallbackModes(scenarioState: DependencyScenarioState) {
  return fallbackModes.map((mode) => {
    const privacyViolation =
      scenarioState === "blocked" && mode.fallbackModeId === "fb_478_manual_patient_contact";
    const untestedPharmacy = mode.fallbackModeId === "fb_478_pharmacy_manual_prescription_comms";
    return withHash({
      recordType: "DependencyFallbackMode",
      ...mode,
      readinessState: privacyViolation
        ? "blocked"
        : untestedPharmacy
          ? "observe_only"
          : mode.privacyRetentionPosture === "safe"
            ? "ready"
            : "ready_with_constraints",
      privacyRetentionPosture: privacyViolation
        ? "privacy_retention_violation_blocked"
        : mode.privacyRetentionPosture,
      sourceRefs,
      releaseBinding,
      settlementRequiredBeforeCompletionClaim: true,
      evidenceRefs: ["data/bau/475_runbook_bundle_manifest.json"],
      generatedAt: FIXED_NOW,
    });
  });
}

function buildRunbooks(scenarioState: DependencyScenarioState) {
  return runbooks.map((runbook) =>
    withHash({
      recordType: "ManualFallbackRunbook",
      ...runbook,
      sourceRefs,
      releaseBinding,
      activationCommandRefs: activationCommands
        .filter((command) => runbook.fallbackModeRefs.includes(command.fallbackModeRef))
        .map((command) => command.commandId),
      rehearsalEvidenceRefs: rehearsalEvidence
        .filter((evidence) => evidence.runbookRef === runbook.runbookId)
        .map((evidence) => evidence.rehearsalEvidenceId),
      readinessState:
        scenarioState === "blocked" &&
        runbook.runbookId === "runbook_478_notification_manual_contact"
          ? "blocked"
          : runbook.runbookId === "runbook_478_pharmacy_manual_prescription"
            ? "ready_with_constraints"
            : "ready",
      wormAuditLinkage,
      generatedAt: FIXED_NOW,
    }),
  );
}

function buildRehearsals(scenarioState: DependencyScenarioState) {
  return rehearsalEvidence.map((evidence) => {
    const blockedScenario =
      scenarioState === "blocked" &&
      (evidence.rehearsalEvidenceId === "rehearsal_478_alert_owner_rota_check" ||
        evidence.rehearsalEvidenceId === "rehearsal_478_restore_report_channel");
    return withHash({
      recordType: "FallbackRehearsalEvidence",
      ...evidence,
      result: blockedScenario ? "failed_missing_required_evidence" : evidence.result,
      openGapRefs: blockedScenario
        ? [
            ...(evidence.openGapRefs as readonly string[]),
            evidence.rehearsalEvidenceId === "rehearsal_478_alert_owner_rota_check"
              ? "gap:478:alert-owner-rota-missing"
              : "gap:478:restore-report-channel-absent",
          ]
        : evidence.openGapRefs,
      sourceRefs,
      releaseBinding,
      generatedAt: FIXED_NOW,
    });
  });
}

function buildIncidentBridges() {
  return dependencyDefinitions.map((dependency) =>
    withHash({
      recordType: "DependencyIncidentBridge",
      bridgeId: `bridge_478_${dependency.dependencyRef.replace("dep_478_", "")}`,
      dependencyRef: dependency.dependencyRef,
      owner: dependency.owner,
      severityMapping: dependency.incidentSeverityMapping,
      escalationContactRefs: dependency.escalationContactRefs,
      supplierInfoRequestRefs: [
        "request:supplier-impact-summary",
        "request:timeline",
        "request:mitigation-plan",
        "request:log-files-redacted-where-necessary",
      ],
      reportabilityRefs: ["DSPT_D1_RESPONSE_RECOVERY", "phase9_incident_reportability_workflow"],
      sourceRefs,
      releaseBinding,
      generatedAt: FIXED_NOW,
    }),
  );
}

function buildSupplierCommsPlans() {
  return dependencyDefinitions.map((dependency) =>
    withHash({
      recordType: "SupplierCommsPlan",
      commsPlanId: `comms_478_${dependency.dependencyRef.replace("dep_478_", "")}`,
      dependencyRef: dependency.dependencyRef,
      owner: dependency.owner,
      templates: [
        {
          audience: "staff",
          templateRef: `template:478:${dependency.dependencyRef}:staff`,
          summary: `${dependency.label} is degraded; use the bound fallback route and do not claim completion before settlement.`,
        },
        {
          audience: "patients",
          templateRef: `template:478:${dependency.dependencyRef}:patients`,
          summary:
            "Service updates are limited to operational status and next safe route; no clinical detail is exposed.",
        },
        {
          audience: "service_owners",
          templateRef: `template:478:${dependency.dependencyRef}:service-owner`,
          summary:
            "Service owner gets readiness state, essential functions, blocker refs, and exit criteria.",
        },
        {
          audience: "supplier",
          templateRef: `template:478:${dependency.dependencyRef}:supplier`,
          summary:
            "Supplier gets redacted impact summary, incident bridge ref, and requested evidence list.",
        },
      ],
      sourceRefs,
      releaseBinding,
      generatedAt: FIXED_NOW,
    }),
  );
}

function buildHygieneReviews(scenarioState: DependencyScenarioState) {
  return dependencyDefinitions.map((dependency) => {
    const contactStale =
      scenarioState === "stale_contact" &&
      dependency.dependencyRef === "dep_478_supplier_support_channel";
    return withHash({
      recordType: "DependencyHygieneReview",
      hygieneReviewId: `hygiene_478_${dependency.dependencyRef.replace("dep_478_", "")}`,
      dependencyRef: dependency.dependencyRef,
      standardsWatchlistState: "current",
      contractReviewState:
        dependency.dependencyRef === "dep_478_nhs_app_channel" ? "deferred" : "current",
      contactFreshnessState: contactStale ? "stale_blocking" : "current",
      lastReviewedAt: "2026-04-26T09:00:00.000Z",
      nextReviewDueAt: "2026-05-26T09:00:00.000Z",
      owner: dependency.owner,
      sourceRefs,
      releaseBinding,
      evidenceRefs: [
        "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      ],
      generatedAt: FIXED_NOW,
    });
  });
}

function buildDegradationProfiles(scenarioState: DependencyScenarioState) {
  const modes = buildFallbackModes(scenarioState);
  return dependencyDefinitions.map((dependency) => {
    const linkedModes = modes.filter((mode) =>
      dependency.fallbackModeRefs.includes(String(mode.fallbackModeId)),
    );
    return withHash({
      recordType: "DependencyDegradationProfile",
      degradationProfileId: `profile_478_${dependency.dependencyRef.replace("dep_478_", "")}`,
      dependencyRef: dependency.dependencyRef,
      label: dependency.label,
      states: [
        {
          state: "normal",
          condition: "Dependency service-level binding current and no launch-critical blockers.",
        },
        {
          state: "degraded",
          condition: "Primary path is impaired but safe reduced service remains available.",
        },
        {
          state: "manual",
          condition: "Manual fallback command is pending settlement and named owner accepts queue.",
        },
        {
          state: "blocked",
          condition:
            "No safe degraded/manual route, stale contact, missing owner rota, missing restore report, or privacy-retention violation.",
        },
      ],
      fallbackModeRefs: dependency.fallbackModeRefs,
      fallbackModes: linkedModes,
      triggerConditions: [
        "stale evidence",
        "supplier outage",
        "support contact expired",
        "monitoring owner ack absent",
        "privacy or retention control failure",
      ],
      sourceRefs,
      releaseBinding,
      generatedAt: FIXED_NOW,
    });
  });
}

function buildActivationCommandBundle() {
  return activationCommands.map((command) =>
    withHash({
      recordType: "FallbackActivationCommand",
      ...command,
      sourceRefs,
      releaseBinding,
      generatedAt: FIXED_NOW,
    }),
  );
}

function buildExitCriteria() {
  return exitCriteria.map((criterion) =>
    withHash({
      recordType: "FallbackExitCriterion",
      ...criterion,
      sourceRefs,
      releaseBinding,
      generatedAt: FIXED_NOW,
    }),
  );
}

function buildExternalReferences() {
  return withHash({
    schemaVersion: `${SCHEMA_VERSION}.external-references`,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    notes: [
      {
        refId: "ext_478_nhs_app_web_integration",
        title: "NHS App web integration",
        url: "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
        appliedTo: ["dep_478_nhs_app_channel", "runbook_478_nhs_app_deferred_channel"],
        alignmentNote:
          "Channel readiness requires integration process, service management, incident rehearsal, limited release, post-go-live data, and annual assurance expectations.",
      },
      {
        refId: "ext_478_nhs_app_standards",
        title: "Standards for NHS App integration",
        url: "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
        appliedTo: ["dep_478_nhs_app_channel"],
        alignmentNote:
          "Deferred channel carries WCAG 2.2 AA, NHS service standard, clinical safety, and data privacy evidence constraints before channel activation.",
      },
      {
        refId: "ext_478_nhs_login_partners",
        title: "NHS login for partners and developers",
        url: "https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers",
        appliedTo: ["dep_478_nhs_login_identity"],
        alignmentNote:
          "Identity dependency is treated as a trusted external identity platform with developer guidance and help routes, but local safe-mode routing remains needed.",
      },
      {
        refId: "ext_478_dspt_d1_response_recovery",
        title: "CAF-aligned DSPT D1 response and recovery planning",
        url: "https://digital.nhs.uk/cyber-and-data-security/guidance-and-resources/caf-aligned-dspt-guidance/objective-d/principle-d1-response-and-recovery-planning/",
        appliedTo: [
          "all_external_dependencies",
          "all_manual_fallback_runbooks",
          "all_rehearsal_evidence",
        ],
        alignmentNote:
          "Essential functions, alternative service provision, supplier incident coordination, OOH response arrangements, fallback mechanisms, and exercising evidence shape the 478 readiness gates.",
      },
      {
        refId: "ext_478_service_manual_accessibility",
        title: "NHS digital service manual accessibility",
        url: "https://service-manual.nhs.uk/accessibility",
        appliedTo: ["Dependency Readiness Board", "dep_478_nhs_app_channel"],
        alignmentNote:
          "Operations UI and channel fallback retain accessible table fallbacks, keyboard operation, focus restoration, and WCAG 2.2 AA-aligned expectations.",
      },
      {
        refId: "ext_478_eps_service_search_migration",
        title: "ETP Web Services SOAP API migration to Service Search API",
        url: "https://digital.nhs.uk/developer/api-catalogue/electronic-transmission-of-prescriptions-web-services-soap/migrating-from-the-etp-web-services-soap-api-to-the-service-search-api",
        appliedTo: ["dep_478_pharmacy_eps_provider_directory"],
        alignmentNote:
          "Pharmacy directory dependency tracks EPS/provider directory support posture and treats untested manual prescription communication as blocked outside observe-only Wave 1 scope.",
      },
    ],
  });
}

function buildAlgorithmAlignmentNotes(overallState: DependencyReadinessState): string {
  return `# 478 Algorithm Alignment Notes

Generated: ${FIXED_NOW}

## Source Alignment

- Phase 9 resilience and recovery is applied at essential-function level first, then dependency level. The generated records map each external dependency to essential functions, fallback modes, escalation contacts, service-level assumptions, rehearsal evidence, and exit criteria.
- Platform operational readiness is implemented as fail-closed launch gating: launch-critical dependencies must have a readiness verdict, current service-level binding, escalation contact, fallback binding, runbook binding, and rehearsal evidence.
- Phase 7 channel logic keeps the NHS App channel deferred while Wave 1 core web and staff routes remain launchable under the 476 channel scope.
- Phase 6 pharmacy handling is observe-only for Wave 1; an untested manual prescription/communication path is explicitly represented as a blocking edge case before any pharmacy wave.
- Staff operations support rules are reflected in the manual workaround runbooks and supplier communications bridge. No fallback activation command is allowed to claim completion while settlement is pending.

## Readiness Verdict

Overall default readiness: ${overallState}

The default state is constrained-ready because Wave 1 excludes NHS App and pharmacy dispatch, and some suppliers have business-hours-only direct support. The launch-critical core web dependencies carry bounded fallbacks and named internal owners.

## Interface Gap

The repository had release/signoff command settlement authority records for 476 and 477, but no repository-native fallback activation settlement bridge for this dependency readiness task. The generated file \`data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_478_FALLBACK_ACTIVATION_SETTLEMENT.json\` supplies the smallest fail-closed bridge: fallback activation commands require role authorization, tenant/cohort/channel scope, idempotency key, purpose binding, injected clock, WORM audit output, and settlement before completion claims.
`;
}

function buildSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/478_dependency_readiness.schema.json",
    title: "478 Dependency Readiness Contract",
    type: "object",
    required: ["schemaVersion", "taskId", "generatedAt", "releaseBinding", "recordHash"],
    properties: {
      schemaVersion: { const: SCHEMA_VERSION },
      taskId: { const: TASK_ID },
      generatedAt: { type: "string" },
      releaseBinding: {
        type: "object",
        required: [
          "releaseCandidateRef",
          "runtimePublicationBundleRef",
          "tenantScope",
          "cohortScope",
          "channelScope",
        ],
      },
      dependencyVerdicts: {
        type: "array",
        items: { $ref: "#/$defs/ExternalDependencyReadinessVerdict" },
      },
      recordHash: { type: "string", minLength: 64, maxLength: 64 },
    },
    $defs: {
      ExternalDependencyReadinessVerdict: {
        type: "object",
        required: [
          "recordType",
          "dependencyRef",
          "readinessState",
          "launchCritical",
          "fallbackModeRefs",
          "serviceLevelBindingRef",
          "escalationContactRefs",
          "runbookRefs",
          "rehearsalEvidenceRefs",
          "recordHash",
        ],
        properties: {
          recordType: { const: "ExternalDependencyReadinessVerdict" },
          readinessState: {
            enum: ["ready", "ready_with_constraints", "observe_only", "blocked", "not_applicable"],
          },
          launchCritical: { type: "boolean" },
        },
      },
    },
  };
}

function buildInterfaceGap() {
  return withHash({
    schemaVersion: `${SCHEMA_VERSION}.interface-gap.fallback-activation-settlement`,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    interfaceGapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_478_FALLBACK_ACTIVATION_SETTLEMENT",
    missingNativeContract:
      "No repository-native contract existed for dependency fallback activation command settlement.",
    bridgeKind: "fail_closed_fallback_activation_settlement",
    appliesToRecordTypes: ["FallbackActivationCommand", "ManualFallbackRunbook"],
    commandRequirements: {
      roleAuthorizationRequired: true,
      tenantCohortChannelScopeRequired: true,
      idempotencyKeyRequired: true,
      purposeBindingRequired: true,
      injectedClockRequired: true,
      wormAuditOutputRequired: true,
      settlementRequiredBeforeCompletionClaim: true,
    },
    defaultCommandState: "pending_backend_command_settlement",
    sourceRefs,
    releaseBinding,
    wormAuditLinkage,
  });
}

function buildMarkdownRunbook(): string {
  const dependencyLines = dependencyDefinitions
    .map(
      (dependency) =>
        `| ${dependency.label} | ${dependency.baselineReadiness} | ${dependency.launchCritical ? "yes" : "no"} | ${dependency.fallbackModeRefs.join(", ")} | ${dependency.owner} |`,
    )
    .join("\n");
  const runbookLines = runbooks
    .map(
      (runbook) => `### ${runbook.title}

- Owner: ${runbook.owner}
- Trigger: ${runbook.trigger}
- Dependencies: ${runbook.dependencyRefs.join(", ")}
- Activation commands: ${activationCommands
        .filter((command) => runbook.fallbackModeRefs.includes(command.fallbackModeRef))
        .map((command) => command.commandId)
        .join(", ")}
- Completion claim: blocked until command settlement and exit criteria evidence are current.

Steps:
${runbook.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}
`,
    )
    .join("\n");

  return `# 478 External Dependency And Manual Fallback Runbook

Generated: ${FIXED_NOW}

## Launch Rule

Every launch-critical dependency must have a readiness verdict, service-level binding, current escalation contact, fallback mode, manual runbook, rehearsal evidence, and recovery exit criterion. Stale supplier contacts, missing owner rotas, missing restore report channels, and privacy/retention violations block launch-critical readiness.

## Dependency Matrix

| Dependency | Baseline readiness | Launch critical | Fallback modes | Owner |
| --- | --- | --- | --- | --- |
${dependencyLines}

## Manual Fallback Runbooks

${runbookLines}

## Required Edge Cases

${edgeCaseProofs
  .map((edge) => `- ${edge.edgeCaseId}: ${edge.description} Expected: ${edge.expectedReadiness}.`)
  .join("\n")}
`;
}

function buildMermaidConstellation(): string {
  const nodes = essentialFunctions
    .map(
      (essentialFunction) =>
        `  ${essentialFunction.essentialFunctionRef}["${essentialFunction.label}"]`,
    )
    .join("\n");
  const depNodes = dependencyDefinitions
    .map((dependency) => `  ${dependency.dependencyRef}("${dependency.label}")`)
    .join("\n");
  const links = dependencyDefinitions
    .flatMap((dependency) =>
      dependency.essentialFunctionRefs.map((essentialFunctionRef) => {
        const modeLabel = fallbackModes
          .filter((mode) => dependency.fallbackModeRefs.includes(mode.fallbackModeId))
          .map((mode) => mode.label)
          .slice(0, 1)
          .join(", ");
        return `  ${essentialFunctionRef} -- "${modeLabel}" --> ${dependency.dependencyRef}`;
      }),
    )
    .join("\n");
  return `flowchart LR
  classDef essential fill:#ffffff,stroke:#314239,color:#14201b;
  classDef dependency fill:#eef2ef,stroke:#b8c7bf,color:#14201b;
${nodes}
${depNodes}
${links}
  class ${essentialFunctions.map((essentialFunction) => essentialFunction.essentialFunctionRef).join(",")} essential;
  class ${dependencyDefinitions.map((dependency) => dependency.dependencyRef).join(",")} dependency;
`;
}

function writeJson(relativePath: string, value: unknown): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value.endsWith("\n") ? value : `${value}\n`);
}

function formatGeneratedFiles(relativePaths: readonly string[]): void {
  execFileSync("pnpm", ["exec", "prettier", "--write", ...relativePaths], {
    cwd: ROOT,
    stdio: "ignore",
  });
}

export function build478DependencyReadinessArtifacts(
  scenarioState: DependencyScenarioState = "ready_with_constraints",
) {
  const upstream = {
    releaseWaveManifest: readJson<JsonObject>("data/release/476_release_wave_manifest.json"),
    finalSignoffRegister: readJson<JsonObject>("data/signoff/477_final_signoff_register.json"),
    supplierSignoffRegister: readJson<JsonObject>(
      "data/signoff/477_supplier_and_dependency_signoff_register.json",
    ),
    bauOperatingModel: readJson<JsonObject>("data/bau/475_operating_model.json"),
    bauRunbookManifest: readJson<JsonObject>("data/bau/475_runbook_bundle_manifest.json"),
    supportEscalationPaths: readJson<JsonObject>("data/bau/475_support_escalation_paths.json"),
    restoreFailoverEvidence: readJson<JsonObject>(
      "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
    ),
    hygieneEvidence: readJson<JsonObject>(
      "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
    ),
  };
  const upstreamHash = hashValue(upstream);
  const dependencyVerdicts = buildVerdicts(scenarioState);
  const serviceLevelBindingRecords = buildServiceLevelBindings();
  const contactRecords = buildContacts(scenarioState);
  const fallbackModeRecords = buildFallbackModes(scenarioState);
  const runbookRecords = buildRunbooks(scenarioState);
  const activationCommandRecords = buildActivationCommandBundle();
  const exitCriterionRecords = buildExitCriteria();
  const rehearsalRecords = buildRehearsals(scenarioState);
  const incidentBridges = buildIncidentBridges();
  const supplierCommsPlans = buildSupplierCommsPlans();
  const hygieneReviews = buildHygieneReviews(scenarioState);
  const degradationProfiles = buildDegradationProfiles(scenarioState);
  const overallState = overallReadinessState(dependencyVerdicts, scenarioState);
  const launchCriticalVerdicts = dependencyVerdicts.filter((verdict) => verdict.launchCritical);
  const launchCriticalReadyVerdicts = launchCriticalVerdicts.filter(
    (verdict) =>
      verdict.readinessState === "ready" || verdict.readinessState === "ready_with_constraints",
  );
  const allBlockers = dependencyVerdicts.flatMap(
    (verdict) => verdict.blockerRefs as readonly string[],
  );
  const allConstraints = dependencyVerdicts.flatMap(
    (verdict) => verdict.constraintRefs as readonly string[],
  );

  const matrix = withHash({
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    matrixId: `matrix_478_external_dependency_readiness_${scenarioState}`,
    recordType: "ExternalDependencyReadinessMatrix",
    scenarioState,
    overallReadinessState: overallState,
    releaseBinding,
    sourceRefs,
    upstreamHash,
    launchCriticalDependencyCount: launchCriticalVerdicts.length,
    launchCriticalReadyCount: launchCriticalReadyVerdicts.length,
    launchCriticalBlockedCount: launchCriticalVerdicts.length - launchCriticalReadyVerdicts.length,
    blockerRefs: allBlockers,
    constraintRefs: allConstraints,
    dependencyVerdicts,
    serviceLevelBindings: serviceLevelBindingRecords,
    serviceLevelBindingRefs: serviceLevelBindingRecords.map(
      (binding) => binding.serviceLevelBindingId,
    ),
    contactLedgerRef: "data/readiness/478_dependency_contact_and_escalation_ledger.json",
    manualFallbackRunbookBundleRef: "data/readiness/478_manual_fallback_runbook_bundle.json",
    rehearsalEvidenceRef: "data/readiness/478_fallback_rehearsal_evidence.json",
    edgeCaseProofs,
    wormAuditLinkage,
    noRawSecretsOrPhi: true,
  });

  const essentialFunctionMap = withHash({
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "EssentialFunctionDependencyMap",
    mapId: `map_478_essential_functions_${scenarioState}`,
    scenarioState,
    releaseBinding,
    sourceRefs,
    essentialFunctions: essentialFunctions.map((essentialFunction) => {
      const linkedDependencies = dependencyDefinitions.filter((dependency) =>
        dependency.essentialFunctionRefs.includes(essentialFunction.essentialFunctionRef),
      );
      return withHash({
        recordType: "EssentialFunctionDependencyMap",
        ...essentialFunction,
        continuityState: continuityForEssentialFunction(
          dependencyVerdicts,
          essentialFunction.essentialFunctionRef,
          scenarioState,
        ),
        dependencyRefs: linkedDependencies.map((dependency) => dependency.dependencyRef),
        fallbackModeRefs: linkedDependencies.flatMap((dependency) => dependency.fallbackModeRefs),
        launchCriticalDependencyRefs: linkedDependencies
          .filter((dependency) => dependency.launchCritical)
          .map((dependency) => dependency.dependencyRef),
      });
    }),
    tableFallbackRequired: true,
    noClientAuthorityJoins: true,
  });

  const manualFallbackBundle = withHash({
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "ManualFallbackRunbookBundle",
    bundleId: `bundle_478_manual_fallback_${scenarioState}`,
    scenarioState,
    releaseBinding,
    sourceRefs,
    readinessState: overallState === "blocked" ? "blocked" : "ready_with_constraints",
    runbooks: runbookRecords,
    fallbackActivationCommands: activationCommandRecords,
    fallbackExitCriteria: exitCriterionRecords,
    commandSettlementAuthorityRef:
      "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_478_FALLBACK_ACTIVATION_SETTLEMENT.json",
    noCompletionClaimBeforeSettlement: true,
    wormAuditLinkage,
  });

  const contactLedger = withHash({
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "DependencyContactAndEscalationLedger",
    ledgerId: `ledger_478_dependency_contacts_${scenarioState}`,
    scenarioState,
    releaseBinding,
    sourceRefs,
    contacts: contactRecords,
    incidentBridges,
    supplierCommsPlans,
    staleContactRefs: contactRecords
      .filter((contact) => String(contact.verificationState).includes("expired"))
      .map((contact) => contact.contactId),
    noRawContactDetails: true,
  });

  const degradationProfileBundle = withHash({
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "DependencyDegradationProfileBundle",
    bundleId: `profiles_478_dependency_degradation_${scenarioState}`,
    scenarioState,
    releaseBinding,
    sourceRefs,
    degradationProfiles,
    fallbackModes: fallbackModeRecords,
  });

  const rehearsalEvidenceBundle = withHash({
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "FallbackRehearsalEvidenceBundle",
    bundleId: `rehearsal_478_fallback_evidence_${scenarioState}`,
    scenarioState,
    releaseBinding,
    sourceRefs,
    rehearsals: rehearsalRecords,
    hygieneReviews,
    edgeCaseProofs,
  });

  return {
    matrix,
    essentialFunctionMap,
    manualFallbackBundle,
    contactLedger,
    degradationProfileBundle,
    rehearsalEvidenceBundle,
    schema: buildSchema(),
    interfaceGap: buildInterfaceGap(),
    algorithmAlignmentNotes: buildAlgorithmAlignmentNotes(overallState),
    externalReferenceNotes: buildExternalReferences(),
    markdownRunbook: buildMarkdownRunbook(),
    mermaidConstellation: buildMermaidConstellation(),
  };
}

export function write478DependencyReadinessArtifacts(
  scenarioState: DependencyScenarioState = "ready_with_constraints",
): ReturnType<typeof build478DependencyReadinessArtifacts> {
  ensureRequiredInputs();
  const artifacts = build478DependencyReadinessArtifacts(scenarioState);
  writeJson("data/readiness/478_external_dependency_readiness_matrix.json", artifacts.matrix);
  writeJson(
    "data/readiness/478_essential_function_dependency_map.json",
    artifacts.essentialFunctionMap,
  );
  writeJson(
    "data/readiness/478_manual_fallback_runbook_bundle.json",
    artifacts.manualFallbackBundle,
  );
  writeJson(
    "data/readiness/478_dependency_contact_and_escalation_ledger.json",
    artifacts.contactLedger,
  );
  writeJson(
    "data/readiness/478_dependency_degradation_profiles.json",
    artifacts.degradationProfileBundle,
  );
  writeJson(
    "data/readiness/478_fallback_rehearsal_evidence.json",
    artifacts.rehearsalEvidenceBundle,
  );
  writeJson("data/contracts/478_dependency_readiness.schema.json", artifacts.schema);
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_478_FALLBACK_ACTIVATION_SETTLEMENT.json",
    artifacts.interfaceGap,
  );
  writeJson("data/analysis/478_external_reference_notes.json", artifacts.externalReferenceNotes);
  writeText("data/analysis/478_algorithm_alignment_notes.md", artifacts.algorithmAlignmentNotes);
  writeText(
    "docs/runbooks/478_external_dependency_and_manual_fallback_runbook.md",
    artifacts.markdownRunbook,
  );
  writeText("docs/architecture/478_dependency_constellation.mmd", artifacts.mermaidConstellation);
  formatGeneratedFiles([
    "data/readiness/478_external_dependency_readiness_matrix.json",
    "data/readiness/478_essential_function_dependency_map.json",
    "data/readiness/478_manual_fallback_runbook_bundle.json",
    "data/readiness/478_dependency_contact_and_escalation_ledger.json",
    "data/readiness/478_dependency_degradation_profiles.json",
    "data/readiness/478_fallback_rehearsal_evidence.json",
    "data/contracts/478_dependency_readiness.schema.json",
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_478_FALLBACK_ACTIVATION_SETTLEMENT.json",
    "data/analysis/478_external_reference_notes.json",
    "data/analysis/478_algorithm_alignment_notes.md",
    "docs/runbooks/478_external_dependency_and_manual_fallback_runbook.md",
    "docs/architecture/478_dependency_constellation.mmd",
  ]);
  return artifacts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  write478DependencyReadinessArtifacts();
}
