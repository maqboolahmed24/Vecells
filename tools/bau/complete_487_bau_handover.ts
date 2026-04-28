import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export const TASK_ID = "seq_487";
export const FIXED_NOW = "2026-04-28T00:00:00.000Z";
export const SCHEMA_VERSION = "487.programme.bau-handover.v1";
export const OUTPUT_ROOT = "output/playwright/487-bau-handover-board";

type JsonObject = Record<string, unknown>;
type EvidenceState = "exact" | "missing" | "stale" | "blocked";
type HandoverVerdict = "accepted" | "accepted_with_constraints" | "blocked";
type RotaCoverageState = "covered" | "missing" | "not_required";
type BAUState = "accepted" | "accepted_with_constraints" | "blocked";
type BAUDomainId =
  | "patient_support"
  | "staff_support"
  | "operations_monitoring"
  | "incident_command"
  | "release_wave_monitoring"
  | "assistive_trust_monitoring"
  | "nhs_app_channel_governance"
  | "records_archive"
  | "clinical_safety"
  | "privacy"
  | "security"
  | "supplier_management"
  | "continuous_improvement";

export type BAU487ScenarioState =
  | "accepted"
  | "accepted_with_constraints"
  | "deputy_missing_ooh"
  | "assistive_no_freeze_authority"
  | "channel_monthly_owner_missing"
  | "records_archive_owner_missing"
  | "supplier_programme_only"
  | "action_misclassified_release_blocking"
  | "runbook_competency_missing";

interface ReleaseBinding487 {
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly waveScopeRef: string;
}

interface ResponsibilityDomainDefinition {
  readonly domainId: BAUDomainId;
  readonly lane: string;
  readonly title: string;
  readonly serviceScope: string;
  readonly owner: string;
  readonly deputy: string;
  readonly launchCritical: boolean;
  readonly reviewCadence: string;
  readonly runbookRef: string;
  readonly competencyEvidenceRef: string;
  readonly escalationPathRef: string;
  readonly monitoringRef: string;
  readonly sourceRefs: readonly string[];
}

export interface SupportRotaAssignment {
  readonly recordType: "SupportRotaAssignment";
  readonly assignmentId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly domainId: BAUDomainId;
  readonly lane: string;
  readonly serviceScope: string;
  readonly owner: string;
  readonly deputy: string | null;
  readonly escalationPathRef: string;
  readonly rotaWindowRefs: readonly string[];
  readonly outOfHoursCoverageState: RotaCoverageState;
  readonly bankHolidayCoverageState: RotaCoverageState;
  readonly competencyEvidenceState: EvidenceState;
  readonly runbookOwnershipState: BAUState;
  readonly coverageState: "exact" | "constrained" | "blocked";
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

export interface ServiceOwnerAcceptance {
  readonly recordType: "ServiceOwnerAcceptance";
  readonly acceptanceId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly domainId: BAUDomainId;
  readonly acceptedBy: string;
  readonly deputyRef: string | null;
  readonly acceptanceState: BAUState;
  readonly commandRef: string;
  readonly settlementRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly acceptedAt: string | null;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface IncidentCommanderRota {
  readonly recordType: "IncidentCommanderRota";
  readonly incidentCommanderRotaId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly primaryCommander: string;
  readonly deputyCommander: string | null;
  readonly outOfHoursCommander: string | null;
  readonly bankHolidayCommander: string | null;
  readonly escalationPathRefs: readonly string[];
  readonly launchCriticalPathRefs: readonly string[];
  readonly coverageState: "exact" | "blocked";
  readonly tenantScope: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface BAUOpenAction {
  readonly recordType: "BAUOpenAction";
  readonly openActionId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly title: string;
  readonly owner: string;
  readonly dueDate: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly actionClass: "release_blocking" | "constrained" | "bau_follow_up";
  readonly releaseBlocking: boolean;
  readonly classificationState: "exact" | "misclassified";
  readonly sourceRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly nextSafeAction: string;
  readonly state: "open" | "accepted_for_bau" | "blocked";
  readonly recordHash: string;
}

export interface GovernanceReviewCalendar {
  readonly recordType: "GovernanceReviewCalendar";
  readonly calendarId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly events: readonly GovernanceReviewEvent[];
  readonly nextReviewAt: string;
  readonly reviewCadenceState: "current" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly generatedAt: string;
  readonly recordHash: string;
}

interface GovernanceReviewEvent {
  readonly eventId: string;
  readonly title: string;
  readonly owner: string;
  readonly cadence: string;
  readonly nextOccurrence: string;
  readonly requiredEvidenceRefs: readonly string[];
  readonly state: "scheduled" | "blocked";
}

export interface RunbookOwnershipTransfer {
  readonly recordType: "RunbookOwnershipTransfer";
  readonly transferId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly domainId: BAUDomainId;
  readonly runbookRef: string;
  readonly previousOwner: "programme-launch";
  readonly newOwner: string;
  readonly deputyOwner: string | null;
  readonly competencyEvidenceRef: string;
  readonly competencyEvidenceState: EvidenceState;
  readonly lastRehearsedAt: string;
  readonly transferState: BAUState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface MonitoringOwnershipTransfer {
  readonly recordType: "MonitoringOwnershipTransfer";
  readonly transferId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly domainId: BAUDomainId;
  readonly monitoringRef: string;
  readonly previousOwner: "programme-launch";
  readonly newOwner: string;
  readonly deputyOwner: string | null;
  readonly authorityState: "live_control" | "observe_only" | "blocked";
  readonly freezeDowngradeAuthorityState: "present" | "missing" | "not_required";
  readonly transferState: BAUState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface AssistiveBAUOwnership {
  readonly recordType: "AssistiveBAUOwnership";
  readonly ownershipId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly owner: string;
  readonly deputy: string | null;
  readonly trustProjectionRef: string;
  readonly visibleModeSettlementRef: string;
  readonly freezeAuthorityState: "present" | "missing";
  readonly downgradeAuthorityState: "present" | "missing";
  readonly monitoringCadence: string;
  readonly state: BAUState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface ChannelBAUOwnership {
  readonly recordType: "ChannelBAUOwnership";
  readonly ownershipId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly owner: string;
  readonly deputy: string | null;
  readonly channelRef: "channel:nhs-app-web-integration";
  readonly activationSettlementRef: string;
  readonly monthlyDataOwner: string | null;
  readonly journeyChangeOwner: string;
  readonly monthlyDataOwnershipState: "assigned" | "missing";
  readonly state: BAUState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface RecordsBAUOwnership {
  readonly recordType: "RecordsBAUOwnership";
  readonly ownershipId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly owner: string | null;
  readonly deputy: string | null;
  readonly archiveScopeRef: string;
  readonly launchEvidenceOwnerState: "assigned" | "missing";
  readonly legalHoldReviewState: "current" | "blocked";
  readonly state: BAUState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface ReleaseWaveBAUOwnership {
  readonly recordType: "ReleaseWaveBAUOwnership";
  readonly ownershipId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly owner: string;
  readonly deputy: string | null;
  readonly releaseWaveRef: string;
  readonly observationPolicyRef: string;
  readonly killSwitchOwner: string;
  readonly rollbackOwner: string;
  readonly state: BAUState;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface BAUHandoverAcceptanceCommand {
  readonly recordType: "BAUHandoverAcceptanceCommand";
  readonly commandId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly requestedVerdict: HandoverVerdict;
  readonly roleAuthorizationRef: string;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly idempotencyKey: string;
  readonly purposeBindingRef: string;
  readonly injectedClockRef: string;
  readonly actingContextRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly createdAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface BAUHandoverAcceptanceSettlement {
  readonly recordType: "BAUHandoverAcceptanceSettlement";
  readonly settlementId: string;
  readonly scenarioId: BAU487ScenarioState;
  readonly commandRef: string;
  readonly result: HandoverVerdict;
  readonly releaseToBAURecordRef: string | null;
  readonly observedOwnerCoverageState: "exact" | "blocked";
  readonly observedRotaCoverageState: "exact" | "blocked";
  readonly observedRunbookTransferState: "exact" | "blocked";
  readonly observedOpenActionClassificationState: "exact" | "blocked";
  readonly recoveryActionRef: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly recordedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface BAUHandoverPack {
  readonly recordType: "BAUHandoverPack";
  readonly bauHandoverPackId: string;
  readonly taskId: typeof TASK_ID;
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly scenarioId: BAU487ScenarioState;
  readonly verdict: HandoverVerdict;
  readonly signoffState: "signed_off" | "signed_off_with_constraints" | "blocked";
  readonly releaseToBAURecordRef: string | null;
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly watchTupleHash: string;
  readonly crossPhaseConformanceScorecardRef: string;
  readonly supportModelRef: string;
  readonly serviceOwnerAcceptanceRegisterRef: string;
  readonly supportRotaMatrixRef: string;
  readonly incidentCommanderRotaRef: string;
  readonly governanceReviewCalendarRef: string;
  readonly openActionsRegisterRef: string;
  readonly ownershipTransferRefs: readonly string[];
  readonly responsibilityDomainRefs: readonly BAUDomainId[];
  readonly launchCriticalDomainCount: number;
  readonly rotaCoverageState: "exact" | "blocked";
  readonly ownerAcceptanceState: "exact" | "blocked";
  readonly runbookTransferState: "exact" | "blocked";
  readonly monitoringTransferState: "exact" | "blocked";
  readonly blockerRefs: readonly string[];
  readonly constraintRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly owner: string;
  readonly generatedAt: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export const required487EdgeCases: readonly BAU487ScenarioState[] = [
  "deputy_missing_ooh",
  "assistive_no_freeze_authority",
  "channel_monthly_owner_missing",
  "records_archive_owner_missing",
  "supplier_programme_only",
  "action_misclassified_release_blocking",
  "runbook_competency_missing",
] as const;

const sourceRefs = [
  "prompt/487.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-9-the-assurance-ledger.md#9i-full-program-exercises-bau-transfer-and-formal-exit-gate",
  "blueprint/staff-operations-and-support-blueprint.md#support-verification-contract",
  "blueprint/operations-console-frontend-blueprint.md#opsresiliencereadinessslice",
  "blueprint/governance-admin-console-frontend-blueprint.md#compliance-and-evidence",
  "data/bau/475_operating_model.json",
  "data/readiness/478_external_dependency_readiness_matrix.json",
  "data/release/482_wave1_promotion_settlement.json",
  "data/release/483_wave1_stability_verdict.json",
  "data/release/484_wave_widening_evidence.json",
  "data/assistive/485_assistive_enablement_settlements.json",
  "data/channel/486_nhs_app_channel_enablement_settlement.json",
] as const;

const requiredInputPaths = [
  "data/bau/475_operating_model.json",
  "data/bau/475_role_responsibility_matrix.json",
  "data/bau/475_competency_evidence_ledger.json",
  "data/bau/475_runbook_bundle_manifest.json",
  "data/bau/475_governance_cadence_calendar.json",
  "data/bau/475_support_escalation_paths.json",
  "data/readiness/478_external_dependency_readiness_matrix.json",
  "data/readiness/478_manual_fallback_runbook_bundle.json",
  "data/release/482_wave1_promotion_settlement.json",
  "data/release/483_wave1_stability_verdict.json",
  "data/release/484_wave_widening_evidence.json",
  "data/assistive/485_assistive_enablement_settlements.json",
  "data/channel/486_nhs_app_channel_enablement_settlement.json",
] as const;

const TENANT_SCOPE = "tenant-demo-gp:programme-core-release";
const COHORT_SCOPE = "cohort:wave1-to-remaining-waves:bau-transfer";
const CHANNEL_SCOPE = "channel:core-web-staff-pharmacy-nhs-app-assistive";

const releaseBinding: ReleaseBinding487 = {
  releaseRef: "release:programme-core-baseline:phase0-6-phase8-9:2026-04-28",
  releaseCandidateRef: "RC_LOCAL_V1",
  runtimePublicationBundleRef: "rpb::local::authoritative",
  releasePublicationParityRef: "rpp::local::authoritative",
  releaseWatchTupleRef: "RWT_LOCAL_V1",
  watchTupleHash: "9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779",
  waveScopeRef: "waves:476:wave1-through-remaining-canaries",
};

const domains: readonly ResponsibilityDomainDefinition[] = [
  {
    domainId: "patient_support",
    lane: "Support",
    title: "Patient support",
    serviceScope: "patient-contact-and-request-continuity",
    owner: "svc-owner:patient-support",
    deputy: "svc-deputy:patient-support",
    launchCritical: true,
    reviewCadence: "daily during launch; weekly BAU",
    runbookRef: "rb_475_patient_support_lineage",
    competencyEvidenceRef: "competency:475:support_analyst:support_lineage",
    escalationPathRef: "ep_475_support_ops_out_of_hours",
    monitoringRef: "monitoring:ops-continuity:patient-nav",
    sourceRefs: ["blueprint/staff-operations-and-support-blueprint.md#support-verification-contract"],
  },
  {
    domainId: "staff_support",
    lane: "Support",
    title: "Staff support",
    serviceScope: "staff-workspace-and-same-shell-recovery",
    owner: "svc-owner:staff-support",
    deputy: "svc-deputy:staff-support",
    launchCritical: true,
    reviewCadence: "daily during launch; weekly BAU",
    runbookRef: "rb_475_staff_support_replay",
    competencyEvidenceRef: "competency:475:care_navigator:support_lineage",
    escalationPathRef: "ep_475_support_ops_out_of_hours",
    monitoringRef: "monitoring:ops-continuity:workspace-task-completion",
    sourceRefs: ["blueprint/staff-operations-and-support-blueprint.md#support-verification-contract"],
  },
  {
    domainId: "operations_monitoring",
    lane: "Operations",
    title: "Operations monitoring",
    serviceScope: "ops-overview-continuity-and-resilience",
    owner: "svc-owner:operations-control",
    deputy: "svc-deputy:operations-control",
    launchCritical: true,
    reviewCadence: "twice daily during launch; weekly BAU",
    runbookRef: "rb_475_operations_monitoring",
    competencyEvidenceRef: "competency:475:service_owner:governance_cadence",
    escalationPathRef: "ep_475_release_rollback",
    monitoringRef: "monitoring:ops-board:essential-function-health",
    sourceRefs: ["blueprint/operations-console-frontend-blueprint.md#ops-board-projections"],
  },
  {
    domainId: "incident_command",
    lane: "Operations",
    title: "Incident command",
    serviceScope: "incident-command-and-reportability",
    owner: "svc-owner:incident-command",
    deputy: "svc-deputy:incident-command",
    launchCritical: true,
    reviewCadence: "24/7 rota; weekly review",
    runbookRef: "rb_475_incident_command",
    competencyEvidenceRef: "competency:475:incident_commander:security_privacy",
    escalationPathRef: "ep_475_security_privacy_incident",
    monitoringRef: "monitoring:incident-desk:reportability",
    sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9g-incident-workflow"],
  },
  {
    domainId: "release_wave_monitoring",
    lane: "Operations",
    title: "Release and wave monitoring",
    serviceScope: "release-watch-and-wave-guardrails",
    owner: "svc-owner:release-wave",
    deputy: "svc-deputy:release-wave",
    launchCritical: true,
    reviewCadence: "per observation window; weekly BAU",
    runbookRef: "docs/runbooks/484_guardrailed_canary_rollout_runbook.md",
    competencyEvidenceRef: "competency:475:release_manager:rollback_rehearsal",
    escalationPathRef: "ep_475_release_rollback",
    monitoringRef: "monitoring:release-watch:wave-observation",
    sourceRefs: ["blueprint/platform-runtime-and-release-blueprint.md#waveobservationpolicy"],
  },
  {
    domainId: "assistive_trust_monitoring",
    lane: "Assistive",
    title: "Assistive trust monitoring",
    serviceScope: "assistive-visible-mode-trust-and-freeze",
    owner: "svc-owner:assistive-trust",
    deputy: "svc-deputy:assistive-trust",
    launchCritical: true,
    reviewCadence: "daily during visible mode rollout",
    runbookRef: "docs/runbooks/485_assistive_visible_mode_enablement_runbook.md",
    competencyEvidenceRef: "competency:475:clinical_safety_officer:assistive",
    escalationPathRef: "ep_475_clinical_safety",
    monitoringRef: "monitoring:assistive:trust-envelope",
    sourceRefs: ["blueprint/phase-8-the-assistive-layer.md#8g-trust-monitoring"],
  },
  {
    domainId: "nhs_app_channel_governance",
    lane: "Channel",
    title: "NHS App channel governance",
    serviceScope: "nhs-app-monthly-data-and-journey-change",
    owner: "svc-owner:nhs-app-channel",
    deputy: "svc-deputy:nhs-app-channel",
    launchCritical: true,
    reviewCadence: "monthly data pack; change-notice review as needed",
    runbookRef: "docs/runbooks/486_nhs_app_channel_activation_runbook.md",
    competencyEvidenceRef: "competency:475:service_owner:nhs_app_channel",
    escalationPathRef: "ep_475_nhs_app_supplier_deferred",
    monitoringRef: "monitoring:nhs-app:monthly-data",
    sourceRefs: ["blueprint/phase-7-inside-the-nhs-app.md#limited-release-post-live-governance-and-formal-exit-gate"],
  },
  {
    domainId: "records_archive",
    lane: "Records",
    title: "Records and archive",
    serviceScope: "launch-evidence-retention-legal-hold",
    owner: "svc-owner:records-governance",
    deputy: "svc-deputy:records-governance",
    launchCritical: true,
    reviewCadence: "fortnightly until archive sealed",
    runbookRef: "rb_475_records_lifecycle",
    competencyEvidenceRef: "competency:475:governance_admin:records_governance",
    escalationPathRef: "ep_475_governance_records",
    monitoringRef: "monitoring:records:retention-holds",
    sourceRefs: ["blueprint/governance-admin-console-frontend-blueprint.md#records-lifecycle-governance"],
  },
  {
    domainId: "clinical_safety",
    lane: "Clinical Safety",
    title: "Clinical safety",
    serviceScope: "clinical-safety-case-and-hazard-delta",
    owner: "svc-owner:clinical-safety",
    deputy: "svc-deputy:clinical-safety",
    launchCritical: true,
    reviewCadence: "weekly and after material incidents",
    runbookRef: "rb_475_clinical_safety",
    competencyEvidenceRef: "competency:475:clinical_safety_officer:dcb0160",
    escalationPathRef: "ep_475_clinical_safety",
    monitoringRef: "monitoring:clinical-safety:hazard-delta",
    sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#clinical-safety-assurance"],
  },
  {
    domainId: "privacy",
    lane: "Security/Privacy",
    title: "Privacy",
    serviceScope: "privacy-impact-and-disclosure-fences",
    owner: "svc-owner:privacy",
    deputy: "svc-deputy:privacy",
    launchCritical: true,
    reviewCadence: "weekly and after scope changes",
    runbookRef: "rb_475_privacy_disclosure",
    competencyEvidenceRef: "competency:475:security_privacy_owner:privacy",
    escalationPathRef: "ep_475_security_privacy_incident",
    monitoringRef: "monitoring:privacy:disclosure-fence",
    sourceRefs: ["blueprint/governance-admin-console-frontend-blueprint.md#compliance-and-evidence"],
  },
  {
    domainId: "security",
    lane: "Security/Privacy",
    title: "Security",
    serviceScope: "security-incident-and-dependency-hygiene",
    owner: "svc-owner:security",
    deputy: "svc-deputy:security",
    launchCritical: true,
    reviewCadence: "weekly and after incident drills",
    runbookRef: "rb_475_security_incident",
    competencyEvidenceRef: "competency:475:security_privacy_owner:security",
    escalationPathRef: "ep_475_security_privacy_incident",
    monitoringRef: "monitoring:security:incident-hygiene",
    sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9g-incident-workflow"],
  },
  {
    domainId: "supplier_management",
    lane: "Suppliers",
    title: "Supplier management",
    serviceScope: "external-dependency-escalation-and-manual-fallback",
    owner: "svc-owner:supplier-management",
    deputy: "svc-deputy:supplier-management",
    launchCritical: true,
    reviewCadence: "weekly and after dependency events",
    runbookRef: "docs/runbooks/478_external_dependency_and_manual_fallback_runbook.md",
    competencyEvidenceRef: "competency:475:supplier_contact:dependency_readiness",
    escalationPathRef: "ep_475_supplier_dependency",
    monitoringRef: "monitoring:dependencies:supplier-escalation",
    sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#external-dependency-readiness"],
  },
  {
    domainId: "continuous_improvement",
    lane: "Governance",
    title: "Continuous improvement",
    serviceScope: "capa-and-improvement-cadence",
    owner: "svc-owner:continuous-improvement",
    deputy: "svc-deputy:continuous-improvement",
    launchCritical: false,
    reviewCadence: "monthly",
    runbookRef: "rb_475_continuous_improvement",
    competencyEvidenceRef: "competency:475:governance_admin:cadence",
    escalationPathRef: "ep_475_governance_cadence",
    monitoringRef: "monitoring:governance:capa",
    sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#bau-transfer"],
  },
] as const;

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalize(entry)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize((value as JsonObject)[key])}`)
    .join(",")}}`;
}

export function hashValue(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

function withHash<T>(record: Omit<T, "recordHash">): T {
  return { ...record, recordHash: hashValue(record) } as T;
}

function uniq(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
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

function formatFiles(paths: readonly string[]): void {
  execFileSync("pnpm", ["exec", "prettier", "--write", ...paths], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

function ensureRequiredInputs(): void {
  const missing = requiredInputPaths.filter(
    (relativePath) => !fs.existsSync(path.join(ROOT, relativePath)),
  );
  if (missing.length > 0) throw new Error(`487 required inputs missing: ${missing.join(", ")}`);
}

function listOutputArtifacts(): string[] {
  const absoluteRoot = path.join(ROOT, OUTPUT_ROOT);
  if (!fs.existsSync(absoluteRoot)) return [];
  const found: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else found.push(path.relative(ROOT, absolutePath));
    }
  };
  visit(absoluteRoot);
  return found.sort();
}

function scenarioLabel(scenarioId: BAU487ScenarioState): string {
  return scenarioId.replace(/_/g, "-");
}

function domainBlockers(
  scenarioId: BAU487ScenarioState,
  domain: ResponsibilityDomainDefinition,
): string[] {
  const blockers: string[] = [];
  if (scenarioId === "deputy_missing_ooh" && domain.domainId === "incident_command") {
    blockers.push("blocker:487:incident-command-deputy-missing-ooh");
  }
  if (scenarioId === "runbook_competency_missing" && domain.domainId === "clinical_safety") {
    blockers.push("blocker:487:runbook-owner-competency-missing");
  }
  if (scenarioId === "supplier_programme_only" && domain.domainId === "supplier_management") {
    blockers.push("blocker:487:supplier-escalation-held-by-programme");
  }
  return blockers;
}

function buildRotaAssignments(scenarioId: BAU487ScenarioState): readonly SupportRotaAssignment[] {
  return domains.map((domain) => {
    const blockers = domainBlockers(scenarioId, domain);
    const deputy =
      blockers.includes("blocker:487:incident-command-deputy-missing-ooh") ||
      blockers.includes("blocker:487:supplier-escalation-held-by-programme")
        ? null
        : domain.deputy;
    const competencyEvidenceState =
      blockers.includes("blocker:487:runbook-owner-competency-missing") ? "missing" : "exact";
    const outOfHoursCoverageState =
      domain.launchCritical && deputy === null ? "missing" : domain.launchCritical ? "covered" : "not_required";
    const bankHolidayCoverageState =
      domain.launchCritical && deputy === null ? "missing" : domain.launchCritical ? "covered" : "not_required";
    const coverageState =
      blockers.length > 0 || outOfHoursCoverageState === "missing" || competencyEvidenceState === "missing"
        ? "blocked"
        : scenarioId === "accepted_with_constraints" && !domain.launchCritical
          ? "constrained"
          : "exact";

    return withHash<SupportRotaAssignment>({
      recordType: "SupportRotaAssignment",
      assignmentId: `support_rota_487_${scenarioLabel(scenarioId)}_${domain.domainId}`,
      scenarioId,
      domainId: domain.domainId,
      lane: domain.lane,
      serviceScope: domain.serviceScope,
      owner: domain.owner,
      deputy,
      escalationPathRef: domain.escalationPathRef,
      rotaWindowRefs: domain.launchCritical
        ? ["weekday_core", "out_of_hours", "bank_holiday"]
        : ["weekday_core"],
      outOfHoursCoverageState,
      bankHolidayCoverageState,
      competencyEvidenceState,
      runbookOwnershipState: competencyEvidenceState === "exact" ? "accepted" : "blocked",
      coverageState,
      tenantScope: TENANT_SCOPE,
      cohortScope: COHORT_SCOPE,
      channelScope: CHANNEL_SCOPE,
      releaseCandidateRef: releaseBinding.releaseCandidateRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
      watchTupleHash: releaseBinding.watchTupleHash,
      blockerRefs: blockers,
      evidenceRefs: [
        domain.runbookRef,
        domain.competencyEvidenceRef,
        domain.escalationPathRef,
        "data/bau/475_support_escalation_paths.json",
      ],
      sourceRefs: uniq([...sourceRefs, ...domain.sourceRefs]),
      generatedAt: FIXED_NOW,
    });
  });
}

function buildServiceOwnerAcceptances(
  scenarioId: BAU487ScenarioState,
  rotaAssignments: readonly SupportRotaAssignment[],
): readonly ServiceOwnerAcceptance[] {
  return domains.map((domain) => {
    const rota = rotaAssignments.find((assignment) => assignment.domainId === domain.domainId);
    const blockers = rota?.blockerRefs ?? [];
    const acceptanceState = blockers.length > 0 ? "blocked" : "accepted";
    return withHash<ServiceOwnerAcceptance>({
      recordType: "ServiceOwnerAcceptance",
      acceptanceId: `service_owner_acceptance_487_${scenarioLabel(scenarioId)}_${domain.domainId}`,
      scenarioId,
      domainId: domain.domainId,
      acceptedBy: domain.owner,
      deputyRef: rota?.deputy ?? null,
      acceptanceState,
      commandRef: `bau_handover_command_487_${scenarioLabel(scenarioId)}`,
      settlementRef: `bau_handover_settlement_487_${scenarioLabel(scenarioId)}`,
      tenantScope: TENANT_SCOPE,
      cohortScope: COHORT_SCOPE,
      channelScope: CHANNEL_SCOPE,
      releaseCandidateRef: releaseBinding.releaseCandidateRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
      watchTupleHash: releaseBinding.watchTupleHash,
      acceptedAt: acceptanceState === "blocked" ? null : FIXED_NOW,
      blockerRefs: blockers,
      evidenceRefs: [
        `support_rota_487_${scenarioLabel(scenarioId)}_${domain.domainId}`,
        domain.competencyEvidenceRef,
      ],
      sourceRefs: uniq([...sourceRefs, ...domain.sourceRefs]),
      wormAuditRef: `worm-ledger:487:service-owner-acceptance:${scenarioLabel(scenarioId)}:${domain.domainId}`,
    });
  });
}

function buildIncidentCommanderRota(
  scenarioId: BAU487ScenarioState,
  rotaAssignments: readonly SupportRotaAssignment[],
): IncidentCommanderRota {
  const incidentRota = rotaAssignments.find((assignment) => assignment.domainId === "incident_command");
  const blockers = incidentRota?.blockerRefs ?? [];
  return withHash<IncidentCommanderRota>({
    recordType: "IncidentCommanderRota",
    incidentCommanderRotaId: `incident_commander_rota_487_${scenarioLabel(scenarioId)}`,
    scenarioId,
    primaryCommander: "svc-owner:incident-command",
    deputyCommander: incidentRota?.deputy ?? null,
    outOfHoursCommander:
      incidentRota?.outOfHoursCoverageState === "covered" ? "svc-ooh:incident-command" : null,
    bankHolidayCommander:
      incidentRota?.bankHolidayCoverageState === "covered"
        ? "svc-bank-holiday:incident-command"
        : null,
    escalationPathRefs: ["ep_475_security_privacy_incident", "ep_475_release_rollback"],
    launchCriticalPathRefs: [
      "incident:security-privacy",
      "incident:clinical-safety",
      "incident:release-watch",
      "incident:nhs-app-channel",
    ],
    coverageState: blockers.length > 0 ? "blocked" : "exact",
    tenantScope: TENANT_SCOPE,
    releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
    watchTupleHash: releaseBinding.watchTupleHash,
    blockerRefs: blockers,
    evidenceRefs: ["data/bau/475_support_escalation_paths.json", "data/readiness/478_manual_fallback_runbook_bundle.json"],
    sourceRefs,
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:487:incident-commander-rota:${scenarioLabel(scenarioId)}`,
  });
}

function buildRunbookTransfers(
  scenarioId: BAU487ScenarioState,
  rotaAssignments: readonly SupportRotaAssignment[],
): readonly RunbookOwnershipTransfer[] {
  return domains.map((domain) => {
    const rota = rotaAssignments.find((assignment) => assignment.domainId === domain.domainId);
    const blockers = rota?.competencyEvidenceState === "missing" ? ["blocker:487:runbook-owner-competency-missing"] : [];
    return withHash<RunbookOwnershipTransfer>({
      recordType: "RunbookOwnershipTransfer",
      transferId: `runbook_transfer_487_${scenarioLabel(scenarioId)}_${domain.domainId}`,
      scenarioId,
      domainId: domain.domainId,
      runbookRef: domain.runbookRef,
      previousOwner: "programme-launch",
      newOwner: domain.owner,
      deputyOwner: rota?.deputy ?? null,
      competencyEvidenceRef: domain.competencyEvidenceRef,
      competencyEvidenceState: rota?.competencyEvidenceState ?? "blocked",
      lastRehearsedAt: "2026-04-27T16:00:00.000Z",
      transferState: blockers.length > 0 ? "blocked" : "accepted",
      blockerRefs: blockers,
      evidenceRefs: [domain.competencyEvidenceRef, "data/bau/475_runbook_bundle_manifest.json"],
      sourceRefs: uniq([...sourceRefs, ...domain.sourceRefs]),
      wormAuditRef: `worm-ledger:487:runbook-transfer:${scenarioLabel(scenarioId)}:${domain.domainId}`,
    });
  });
}

function buildMonitoringTransfers(scenarioId: BAU487ScenarioState): readonly MonitoringOwnershipTransfer[] {
  return domains
    .filter((domain) =>
      [
        "operations_monitoring",
        "release_wave_monitoring",
        "assistive_trust_monitoring",
        "nhs_app_channel_governance",
        "records_archive",
        "security",
        "privacy",
      ].includes(domain.domainId),
    )
    .map((domain) => {
      const assistiveAuthorityMissing =
        scenarioId === "assistive_no_freeze_authority" &&
        domain.domainId === "assistive_trust_monitoring";
      const blockers = assistiveAuthorityMissing
        ? ["blocker:487:assistive-freeze-downgrade-authority-missing"]
        : [];
      return withHash<MonitoringOwnershipTransfer>({
        recordType: "MonitoringOwnershipTransfer",
        transferId: `monitoring_transfer_487_${scenarioLabel(scenarioId)}_${domain.domainId}`,
        scenarioId,
        domainId: domain.domainId,
        monitoringRef: domain.monitoringRef,
        previousOwner: "programme-launch",
        newOwner: domain.owner,
        deputyOwner: assistiveAuthorityMissing ? domain.deputy : domain.deputy,
        authorityState: assistiveAuthorityMissing ? "observe_only" : "live_control",
        freezeDowngradeAuthorityState: assistiveAuthorityMissing
          ? "missing"
          : domain.domainId === "assistive_trust_monitoring" || domain.domainId === "release_wave_monitoring"
            ? "present"
            : "not_required",
        transferState: blockers.length > 0 ? "blocked" : "accepted",
        blockerRefs: blockers,
        evidenceRefs: [domain.monitoringRef, "data/release/484_wave_widening_evidence.json"],
        sourceRefs: uniq([...sourceRefs, ...domain.sourceRefs]),
        wormAuditRef: `worm-ledger:487:monitoring-transfer:${scenarioLabel(scenarioId)}:${domain.domainId}`,
      });
    });
}

function buildAssistiveOwnership(scenarioId: BAU487ScenarioState): AssistiveBAUOwnership {
  const blocked = scenarioId === "assistive_no_freeze_authority";
  return withHash<AssistiveBAUOwnership>({
    recordType: "AssistiveBAUOwnership",
    ownershipId: `assistive_bau_ownership_487_${scenarioLabel(scenarioId)}`,
    scenarioId,
    owner: "svc-owner:assistive-trust",
    deputy: "svc-deputy:assistive-trust",
    trustProjectionRef: "data/assistive/485_trust_envelope_resolution.json",
    visibleModeSettlementRef: "assistive_visible_settlement_485_visible_insert_approved",
    freezeAuthorityState: blocked ? "missing" : "present",
    downgradeAuthorityState: blocked ? "missing" : "present",
    monitoringCadence: "daily during visible-mode launch; weekly BAU",
    state: blocked ? "blocked" : "accepted",
    blockerRefs: blocked ? ["blocker:487:assistive-freeze-downgrade-authority-missing"] : [],
    evidenceRefs: [
      "data/assistive/485_assistive_enablement_settlements.json",
      "docs/runbooks/485_assistive_visible_mode_enablement_runbook.md",
    ],
    sourceRefs: uniq([...sourceRefs, "blueprint/phase-8-the-assistive-layer.md#8g-trust-monitoring"]),
    wormAuditRef: `worm-ledger:487:assistive-ownership:${scenarioLabel(scenarioId)}`,
  });
}

function buildChannelOwnership(scenarioId: BAU487ScenarioState): ChannelBAUOwnership {
  const blocked = scenarioId === "channel_monthly_owner_missing";
  return withHash<ChannelBAUOwnership>({
    recordType: "ChannelBAUOwnership",
    ownershipId: `channel_bau_ownership_487_${scenarioLabel(scenarioId)}`,
    scenarioId,
    owner: "svc-owner:nhs-app-channel",
    deputy: "svc-deputy:nhs-app-channel",
    channelRef: "channel:nhs-app-web-integration",
    activationSettlementRef: "nhs_app_channel_settlement_486_approved_embedded",
    monthlyDataOwner: blocked ? null : "svc-owner:nhs-app-monthly-data",
    journeyChangeOwner: "svc-owner:nhs-app-channel",
    monthlyDataOwnershipState: blocked ? "missing" : "assigned",
    state: blocked ? "blocked" : "accepted",
    blockerRefs: blocked ? ["blocker:487:nhs-app-monthly-data-owner-missing"] : [],
    evidenceRefs: [
      "data/channel/486_monthly_data_and_assurance_obligation_binding.json",
      "data/channel/486_nhs_app_channel_enablement_settlement.json",
    ],
    sourceRefs: uniq([...sourceRefs, "blueprint/phase-7-inside-the-nhs-app.md#limited-release-post-live-governance-and-formal-exit-gate"]),
    wormAuditRef: `worm-ledger:487:channel-ownership:${scenarioLabel(scenarioId)}`,
  });
}

function buildRecordsOwnership(scenarioId: BAU487ScenarioState): RecordsBAUOwnership {
  const blocked = scenarioId === "records_archive_owner_missing";
  return withHash<RecordsBAUOwnership>({
    recordType: "RecordsBAUOwnership",
    ownershipId: `records_bau_ownership_487_${scenarioLabel(scenarioId)}`,
    scenarioId,
    owner: blocked ? null : "svc-owner:records-governance",
    deputy: blocked ? null : "svc-deputy:records-governance",
    archiveScopeRef: "archive-scope:launch-evidence-pack:473-489",
    launchEvidenceOwnerState: blocked ? "missing" : "assigned",
    legalHoldReviewState: blocked ? "blocked" : "current",
    state: blocked ? "blocked" : "accepted",
    blockerRefs: blocked ? ["blocker:487:records-archive-owner-missing"] : [],
    evidenceRefs: ["data/bau/475_governance_cadence_calendar.json", "blueprint/phase-0-the-foundation-protocol.md#worm-audit"],
    sourceRefs: uniq([...sourceRefs, "blueprint/governance-admin-console-frontend-blueprint.md#records-lifecycle-governance"]),
    wormAuditRef: `worm-ledger:487:records-ownership:${scenarioLabel(scenarioId)}`,
  });
}

function buildReleaseWaveOwnership(scenarioId: BAU487ScenarioState): ReleaseWaveBAUOwnership {
  return withHash<ReleaseWaveBAUOwnership>({
    recordType: "ReleaseWaveBAUOwnership",
    ownershipId: `release_wave_bau_ownership_487_${scenarioLabel(scenarioId)}`,
    scenarioId,
    owner: "svc-owner:release-wave",
    deputy: "svc-deputy:release-wave",
    releaseWaveRef: releaseBinding.waveScopeRef,
    observationPolicyRef: "wop_476_remaining_waves_48h",
    killSwitchOwner: "svc-owner:release-wave",
    rollbackOwner: "svc-owner:operations-control",
    state: "accepted",
    blockerRefs: [],
    evidenceRefs: ["data/release/483_wave1_stability_verdict.json", "data/release/484_wave_widening_evidence.json"],
    sourceRefs: uniq([...sourceRefs, "blueprint/platform-runtime-and-release-blueprint.md#waveactionsettlement"]),
    wormAuditRef: `worm-ledger:487:release-wave-ownership:${scenarioLabel(scenarioId)}`,
  });
}

function buildOpenActions(scenarioId: BAU487ScenarioState): readonly BAUOpenAction[] {
  const actions: BAUOpenAction[] = [
    withHash<BAUOpenAction>({
      recordType: "BAUOpenAction",
      openActionId: `bau_open_action_487_${scenarioLabel(scenarioId)}_support_feedback_triage`,
      scenarioId,
      title: "Triage first-week support feedback into continuous improvement queue",
      owner: "svc-owner:continuous-improvement",
      dueDate: "2026-05-08",
      severity: "low",
      actionClass: "bau_follow_up",
      releaseBlocking: false,
      classificationState: "exact",
      sourceRefs,
      evidenceRefs: ["data/bau/475_operating_model.json"],
      blockerRefs: [],
      nextSafeAction: "Review in first BAU improvement forum.",
      state: "accepted_for_bau",
    }),
    withHash<BAUOpenAction>({
      recordType: "BAUOpenAction",
      openActionId: `bau_open_action_487_${scenarioLabel(scenarioId)}_supplier_contact_retest`,
      scenarioId,
      title: "Retest supplier escalation route after BAU contact rotation",
      owner: "svc-owner:supplier-management",
      dueDate: "2026-05-03",
      severity: "medium",
      actionClass: "constrained",
      releaseBlocking: false,
      classificationState: "exact",
      sourceRefs,
      evidenceRefs: ["data/readiness/478_dependency_contact_and_escalation_ledger.json"],
      blockerRefs: [],
      nextSafeAction: "Retest escalation route before the next dependency review.",
      state: "open",
    }),
  ];

  if (scenarioId === "action_misclassified_release_blocking") {
    actions.push(
      withHash<BAUOpenAction>({
        recordType: "BAUOpenAction",
        openActionId: "bau_open_action_487_misclassified_release_blocking",
        scenarioId,
        title: "Missing out-of-hours incident escalation validation",
        owner: "svc-owner:incident-command",
        dueDate: "2026-04-28",
        severity: "critical",
        actionClass: "bau_follow_up",
        releaseBlocking: true,
        classificationState: "misclassified",
        sourceRefs,
        evidenceRefs: ["data/bau/475_support_escalation_paths.json"],
        blockerRefs: ["blocker:487:release-blocking-action-misclassified"],
        nextSafeAction: "Reclassify as release-blocking and keep handover blocked.",
        state: "blocked",
      }),
    );
  }

  return actions;
}

function buildGovernanceCalendar(scenarioId: BAU487ScenarioState): GovernanceReviewCalendar {
  const events: GovernanceReviewEvent[] = [
    {
      eventId: "governance_review_487_launch_day",
      title: "Launch-day BAU checkpoint",
      owner: "svc-owner:operations-control",
      cadence: "daily during launch",
      nextOccurrence: "2026-04-29T09:00:00.000Z",
      requiredEvidenceRefs: ["data/bau/487_bau_handover_pack.json"],
      state: "scheduled",
    },
    {
      eventId: "governance_review_487_nhs_app_monthly_pack",
      title: "NHS App monthly data and journey-change review",
      owner: "svc-owner:nhs-app-channel",
      cadence: "monthly",
      nextOccurrence: "2026-05-28T10:00:00.000Z",
      requiredEvidenceRefs: ["data/channel/486_monthly_data_and_assurance_obligation_binding.json"],
      state: scenarioId === "channel_monthly_owner_missing" ? "blocked" : "scheduled",
    },
    {
      eventId: "governance_review_487_archive_retention",
      title: "Launch evidence archive and legal-hold review",
      owner: "svc-owner:records-governance",
      cadence: "fortnightly until archive sealed",
      nextOccurrence: "2026-05-12T14:00:00.000Z",
      requiredEvidenceRefs: ["data/bau/487_service_owner_acceptance_register.json"],
      state: scenarioId === "records_archive_owner_missing" ? "blocked" : "scheduled",
    },
    {
      eventId: "governance_review_487_assistive_trust",
      title: "Assistive visible mode trust and freeze authority review",
      owner: "svc-owner:assistive-trust",
      cadence: "weekly",
      nextOccurrence: "2026-05-05T11:00:00.000Z",
      requiredEvidenceRefs: ["data/assistive/485_trust_envelope_resolution.json"],
      state: scenarioId === "assistive_no_freeze_authority" ? "blocked" : "scheduled",
    },
  ];
  const blockers = events
    .filter((event) => event.state === "blocked")
    .map((event) => `blocker:487:${event.eventId}:owner-or-authority-missing`);
  return withHash<GovernanceReviewCalendar>({
    recordType: "GovernanceReviewCalendar",
    calendarId: `governance_review_calendar_487_${scenarioLabel(scenarioId)}`,
    scenarioId,
    events,
    nextReviewAt: "2026-04-29T09:00:00.000Z",
    reviewCadenceState: blockers.length > 0 ? "blocked" : "current",
    blockerRefs: blockers,
    evidenceRefs: [
      "data/bau/475_governance_cadence_calendar.json",
      "data/channel/486_monthly_data_and_assurance_obligation_binding.json",
    ],
    sourceRefs,
    generatedAt: FIXED_NOW,
  });
}

function blockersForScenario(records: {
  readonly rotaAssignments: readonly SupportRotaAssignment[];
  readonly acceptances: readonly ServiceOwnerAcceptance[];
  readonly incidentCommanderRota: IncidentCommanderRota;
  readonly openActions: readonly BAUOpenAction[];
  readonly governanceCalendar: GovernanceReviewCalendar;
  readonly runbookTransfers: readonly RunbookOwnershipTransfer[];
  readonly monitoringTransfers: readonly MonitoringOwnershipTransfer[];
  readonly assistiveOwnership: AssistiveBAUOwnership;
  readonly channelOwnership: ChannelBAUOwnership;
  readonly recordsOwnership: RecordsBAUOwnership;
  readonly releaseWaveOwnership: ReleaseWaveBAUOwnership;
}): string[] {
  return uniq([
    ...records.rotaAssignments.flatMap((record) => record.blockerRefs),
    ...records.acceptances.flatMap((record) => record.blockerRefs),
    ...records.incidentCommanderRota.blockerRefs,
    ...records.openActions.flatMap((record) => record.blockerRefs),
    ...records.governanceCalendar.blockerRefs,
    ...records.runbookTransfers.flatMap((record) => record.blockerRefs),
    ...records.monitoringTransfers.flatMap((record) => record.blockerRefs),
    ...records.assistiveOwnership.blockerRefs,
    ...records.channelOwnership.blockerRefs,
    ...records.recordsOwnership.blockerRefs,
    ...records.releaseWaveOwnership.blockerRefs,
  ]);
}

function buildVerdict(
  scenarioId: BAU487ScenarioState,
  blockers: readonly string[],
  openActions: readonly BAUOpenAction[],
): HandoverVerdict {
  if (blockers.length > 0) return "blocked";
  if (scenarioId === "accepted") return "accepted";
  if (openActions.some((action) => action.actionClass === "constrained" && !action.releaseBlocking)) {
    return "accepted_with_constraints";
  }
  return "accepted";
}

function buildCommand(
  scenarioId: BAU487ScenarioState,
  verdict: HandoverVerdict,
  blockers: readonly string[],
): BAUHandoverAcceptanceCommand {
  return withHash<BAUHandoverAcceptanceCommand>({
    recordType: "BAUHandoverAcceptanceCommand",
    commandId: `bau_handover_command_487_${scenarioLabel(scenarioId)}`,
    scenarioId,
    requestedVerdict: verdict,
    roleAuthorizationRef: "role-auth:service-owner:bau-handover-accept",
    tenantScope: TENANT_SCOPE,
    cohortScope: COHORT_SCOPE,
    channelScope: CHANNEL_SCOPE,
    idempotencyKey: `idem:487:bau-handover:${scenarioLabel(scenarioId)}:2026-04-28`,
    purposeBindingRef: "purpose:programme-to-bau-transfer",
    injectedClockRef: `clock:${FIXED_NOW}`,
    actingContextRef: "acting-context:service-owner:launch-to-bau",
    releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
    watchTupleHash: releaseBinding.watchTupleHash,
    blockerRefs: blockers,
    evidenceRefs: [
      "data/bau/487_support_rota_matrix.json",
      "data/bau/487_service_owner_acceptance_register.json",
      "data/bau/487_bau_open_actions_register.json",
    ],
    sourceRefs,
    createdAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:487:handover-command:${scenarioLabel(scenarioId)}`,
  });
}

function buildSettlement(
  scenarioId: BAU487ScenarioState,
  verdict: HandoverVerdict,
  blockers: readonly string[],
  command: BAUHandoverAcceptanceCommand,
): BAUHandoverAcceptanceSettlement {
  return withHash<BAUHandoverAcceptanceSettlement>({
    recordType: "BAUHandoverAcceptanceSettlement",
    settlementId: `bau_handover_settlement_487_${scenarioLabel(scenarioId)}`,
    scenarioId,
    commandRef: command.commandId,
    result: verdict,
    releaseToBAURecordRef: verdict === "blocked" ? null : `release_to_bau_record_487_${scenarioLabel(scenarioId)}`,
    observedOwnerCoverageState: blockers.some((blocker) => blocker.includes("owner")) ? "blocked" : "exact",
    observedRotaCoverageState: blockers.some((blocker) => blocker.includes("deputy") || blocker.includes("escalation"))
      ? "blocked"
      : "exact",
    observedRunbookTransferState: blockers.some((blocker) => blocker.includes("runbook")) ? "blocked" : "exact",
    observedOpenActionClassificationState: blockers.some((blocker) => blocker.includes("misclassified"))
      ? "blocked"
      : "exact",
    recoveryActionRef:
      verdict === "blocked" ? "recovery:487:keep-programme-launch-mode" : "recovery:487:bau-observe-and-review",
    blockerRefs: blockers,
    evidenceRefs: [command.commandId, "data/bau/487_bau_handover_pack.json"],
    sourceRefs,
    recordedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:487:handover-settlement:${scenarioLabel(scenarioId)}`,
  });
}

export function build487ScenarioRecords(
  scenarioId: BAU487ScenarioState = "accepted_with_constraints",
  artifactRefs: readonly string[] = [],
) {
  ensureRequiredInputs();
  readJson("data/bau/475_operating_model.json");
  const rotaAssignments = buildRotaAssignments(scenarioId);
  const acceptances = buildServiceOwnerAcceptances(scenarioId, rotaAssignments);
  const incidentCommanderRota = buildIncidentCommanderRota(scenarioId, rotaAssignments);
  const openActions = buildOpenActions(scenarioId);
  const governanceCalendar = buildGovernanceCalendar(scenarioId);
  const runbookTransfers = buildRunbookTransfers(scenarioId, rotaAssignments);
  const monitoringTransfers = buildMonitoringTransfers(scenarioId);
  const assistiveOwnership = buildAssistiveOwnership(scenarioId);
  const channelOwnership = buildChannelOwnership(scenarioId);
  const recordsOwnership = buildRecordsOwnership(scenarioId);
  const releaseWaveOwnership = buildReleaseWaveOwnership(scenarioId);
  const blockers = blockersForScenario({
    rotaAssignments,
    acceptances,
    incidentCommanderRota,
    openActions,
    governanceCalendar,
    runbookTransfers,
    monitoringTransfers,
    assistiveOwnership,
    channelOwnership,
    recordsOwnership,
    releaseWaveOwnership,
  });
  const verdict = buildVerdict(scenarioId, blockers, openActions);
  const command = buildCommand(scenarioId, verdict, blockers);
  const settlement = buildSettlement(scenarioId, verdict, blockers, command);
  const constraintRefs =
    verdict === "accepted_with_constraints"
      ? openActions
          .filter((action) => action.actionClass === "constrained")
          .map((action) => `constraint:487:${action.openActionId}`)
      : [];

  const pack = withHash<BAUHandoverPack>({
    recordType: "BAUHandoverPack",
    bauHandoverPackId: `bau_handover_pack_487_${scenarioLabel(scenarioId)}`,
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    scenarioId,
    verdict,
    signoffState:
      verdict === "accepted"
        ? "signed_off"
        : verdict === "accepted_with_constraints"
          ? "signed_off_with_constraints"
          : "blocked",
    releaseToBAURecordRef: settlement.releaseToBAURecordRef,
    tenantScope: TENANT_SCOPE,
    cohortScope: COHORT_SCOPE,
    channelScope: CHANNEL_SCOPE,
    releaseRef: releaseBinding.releaseRef,
    releaseCandidateRef: releaseBinding.releaseCandidateRef,
    runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
    releasePublicationParityRef: releaseBinding.releasePublicationParityRef,
    releaseWatchTupleRef: releaseBinding.releaseWatchTupleRef,
    watchTupleHash: releaseBinding.watchTupleHash,
    crossPhaseConformanceScorecardRef:
      "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
    supportModelRef: "data/bau/475_operating_model.json",
    serviceOwnerAcceptanceRegisterRef: "data/bau/487_service_owner_acceptance_register.json",
    supportRotaMatrixRef: "data/bau/487_support_rota_matrix.json",
    incidentCommanderRotaRef: "data/bau/487_incident_commander_rota.json",
    governanceReviewCalendarRef: "data/bau/487_governance_review_calendar.json",
    openActionsRegisterRef: "data/bau/487_bau_open_actions_register.json",
    ownershipTransferRefs: [
      assistiveOwnership.ownershipId,
      channelOwnership.ownershipId,
      recordsOwnership.ownershipId,
      releaseWaveOwnership.ownershipId,
      ...monitoringTransfers.map((transfer) => transfer.transferId),
      ...runbookTransfers.map((transfer) => transfer.transferId),
    ],
    responsibilityDomainRefs: domains.map((domain) => domain.domainId),
    launchCriticalDomainCount: domains.filter((domain) => domain.launchCritical).length,
    rotaCoverageState: rotaAssignments.some((assignment) => assignment.coverageState === "blocked")
      ? "blocked"
      : "exact",
    ownerAcceptanceState: acceptances.some((acceptance) => acceptance.acceptanceState === "blocked")
      ? "blocked"
      : "exact",
    runbookTransferState: runbookTransfers.some((transfer) => transfer.transferState === "blocked")
      ? "blocked"
      : "exact",
    monitoringTransferState: monitoringTransfers.some((transfer) => transfer.transferState === "blocked")
      ? "blocked"
      : "exact",
    blockerRefs: blockers,
    constraintRefs,
    evidenceRefs: [
      "data/bau/475_operating_model.json",
      "data/readiness/478_external_dependency_readiness_matrix.json",
      "data/release/482_wave1_promotion_settlement.json",
      "data/release/483_wave1_stability_verdict.json",
      "data/release/484_wave_widening_evidence.json",
      "data/assistive/485_assistive_enablement_settlements.json",
      "data/channel/486_nhs_app_channel_enablement_settlement.json",
    ],
    artifactRefs,
    sourceRefs,
    owner: "svc-owner:operations-control",
    generatedAt: FIXED_NOW,
    wormAuditRef: `worm-ledger:487:bau-handover-pack:${scenarioLabel(scenarioId)}`,
  });

  return {
    pack,
    command,
    settlement,
    rotaAssignments,
    acceptances,
    incidentCommanderRota,
    openActions,
    governanceCalendar,
    runbookTransfers,
    monitoringTransfers,
    assistiveOwnership,
    channelOwnership,
    recordsOwnership,
    releaseWaveOwnership,
  };
}

export function build487Records(artifactRefs: readonly string[] = []) {
  const activeScenario = build487ScenarioRecords("accepted_with_constraints", artifactRefs);
  const edgeCaseFixtures = required487EdgeCases.map((scenarioId) => {
    const records = build487ScenarioRecords(scenarioId, []);
    return {
      scenarioId,
      expectedVerdict: records.pack.verdict,
      settlementResult: records.settlement.result,
      blockerRefs: records.pack.blockerRefs,
      recoveryActionRef: records.settlement.recoveryActionRef,
    };
  });
  return {
    activeScenario,
    edgeCaseFixtures,
  };
}

function buildSchema(): JsonObject {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/contracts/487_bau_handover.schema.json",
    title: "Task 487 BAU handover contract",
    type: "object",
    required: ["recordType", "taskId", "schemaVersion", "generatedAt", "recordHash"],
    properties: {
      recordType: { type: "string" },
      taskId: { const: TASK_ID },
      schemaVersion: { const: SCHEMA_VERSION },
      generatedAt: { const: FIXED_NOW },
      recordHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
      verdict: { enum: ["accepted", "accepted_with_constraints", "blocked"] },
      blockerRefs: { type: "array", items: { type: "string" } },
      sourceRefs: { type: "array", items: { type: "string" } },
    },
    additionalProperties: true,
  };
}

function buildInterfaceGap(): JsonObject {
  return {
    recordType: "ProgrammeBatchInterfaceGap",
    taskId: TASK_ID,
    schemaVersion: SCHEMA_VERSION,
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_487_BAU_HANDOVER_AUTHORITY",
    gapSummary:
      "The repository had BAU training and runbook readiness records from task 475, but no single typed authority for final release-to-BAU handover acceptance, rota coverage, monitoring ownership transfer, and open-action classification.",
    sourceRefs,
    failClosedBridge: {
      bridgeId: "fail_closed_bau_handover_authority_bridge_487",
      privilegedMutationPermitted: false,
      handoverAcceptedOnlyWhen: [
        "owner_and_deputy_present_for_launch_critical_domains",
        "out_of_hours_and_bank_holiday_rota_covered",
        "runbook_owner_competency_evidence_exact",
        "assistive_freeze_and_downgrade_authority_present",
        "nhs_app_monthly_data_owner_assigned",
        "records_archive_owner_assigned",
        "supplier_escalation_not_programme_only",
        "release_blocking_actions_not_classified_as_bau_follow_up",
      ],
      safeState: "programme_launch_mode_retained_until_blockers_clear",
    },
    generatedAt: FIXED_NOW,
    recordHash: hashValue({
      gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_487_BAU_HANDOVER_AUTHORITY",
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
    }),
  };
}

function buildExternalReferenceNotes(): JsonObject {
  return {
    recordType: "ExternalReferenceNotes",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    references: [
      {
        topic: "NHS App operational obligations",
        relevance:
          "Monthly data ownership and journey-change control must remain assigned after channel activation.",
        appliedAs: "ChannelBAUOwnership.monthlyDataOwner and GovernanceReviewCalendar monthly event",
      },
      {
        topic: "Clinical safety and DCB responsibilities",
        relevance:
          "Clinical safety owners remain accountable for hazard deltas and deployment safety after launch.",
        appliedAs: "clinical_safety lane owner, deputy, runbook transfer, and review cadence",
      },
      {
        topic: "Security, privacy, and resilience operations",
        relevance:
          "Incident, privacy, security, and restore paths require 24/7 rota coverage and evidence-backed runbooks.",
        appliedAs: "IncidentCommanderRota, SupportRotaAssignment, and MonitoringOwnershipTransfer",
      },
      {
        topic: "Records management",
        relevance:
          "Launch evidence, legal holds, and archive ownership must be assigned before evidence sealing.",
        appliedAs: "RecordsBAUOwnership and archive review calendar event",
      },
      {
        topic: "Accessibility and operations UI",
        relevance:
          "The BAU board uses semantic sections, keyboard cards, tables, and ARIA snapshots.",
        appliedAs: "BAU Handover Board Playwright evidence",
      },
    ],
  };
}

function buildAlgorithmAlignmentNotes(records: ReturnType<typeof build487Records>): string {
  return `# 487 Algorithm Alignment Notes

Generated: ${FIXED_NOW}

## Source alignment

- Implements Prompt 487 and the shared operating contract for tasks 473-489.
- Binds BAU handover to Phase 9 \`BAUReadinessPack\`, \`OnCallMatrix\`, \`RunbookBundle\`, and \`ReleaseToBAURecord\` concepts.
- Consumes training/runbook readiness from task 475, dependency fallback readiness from task 478, release promotion and watch evidence from tasks 482-484, assistive visible-mode settlement from task 485, and NHS App channel activation from task 486.
- Uses deterministic hashes on every generated record and WORM refs on decisions or ownership transfers.

## Active verdict

- Handover pack: ${records.activeScenario.pack.bauHandoverPackId}
- Verdict: ${records.activeScenario.pack.verdict}
- Blockers: ${records.activeScenario.pack.blockerRefs.length}
- Constraints: ${records.activeScenario.pack.constraintRefs.length}
- Settlement: ${records.activeScenario.settlement.settlementId}

## Edge cases covered

${records.edgeCaseFixtures
  .map((edgeCase) => `- ${edgeCase.scenarioId}: ${edgeCase.expectedVerdict}; blockers=${edgeCase.blockerRefs.join(", ")}`)
  .join("\n")}
`;
}

function buildRunbook(records: ReturnType<typeof build487Records>): string {
  return `# BAU Handover Runbook

Generated: ${FIXED_NOW}

## Authority

Use \`data/bau/487_bau_handover_pack.json\`, \`data/bau/487_support_rota_matrix.json\`, \`data/bau/487_service_owner_acceptance_register.json\`, and \`data/bau/487_bau_open_actions_register.json\` as the handover authority. Do not accept BAU transfer from a narrative report, meeting note, or dashboard-only label.

## Handover sequence

1. Confirm each launch-critical domain has an owner, deputy, escalation path, out-of-hours rota, bank-holiday cover, runbook transfer, and competency evidence.
2. Confirm incident command, supplier escalation, release/wave monitoring, assistive trust monitoring, NHS App monthly data, records/archive, clinical safety, privacy, and security have named BAU ownership.
3. Confirm every open action is classified as release-blocking, constrained, or BAU follow-up. Release-blocking work cannot move to BAU follow-up.
4. Confirm the acceptance command carries role authorization, tenant/cohort/channel scope, idempotency key, purpose binding, injected clock, and WORM audit refs.
5. Settle BAU handover as accepted, accepted with constraints, or blocked.

## Active result

- Pack: ${records.activeScenario.pack.bauHandoverPackId}
- Verdict: ${records.activeScenario.pack.verdict}
- Release-to-BAU record: ${records.activeScenario.pack.releaseToBAURecordRef}
- Rota coverage: ${records.activeScenario.pack.rotaCoverageState}
- Open blockers: ${records.activeScenario.pack.blockerRefs.length}
`;
}

function buildReport(records: ReturnType<typeof build487Records>): string {
  return `# Service Owner Handover Report

Generated: ${FIXED_NOW}

The service owner handover is ${records.activeScenario.pack.verdict}. Ownership has transferred for ${
    records.activeScenario.pack.responsibilityDomainRefs.length
  } responsibility domains with ${
    records.activeScenario.pack.launchCriticalDomainCount
  } launch-critical domains requiring out-of-hours and bank-holiday coverage.

## Evidence refs

- Handover pack: data/bau/487_bau_handover_pack.json
- Rota matrix: data/bau/487_support_rota_matrix.json
- Acceptance register: data/bau/487_service_owner_acceptance_register.json
- Incident commander rota: data/bau/487_incident_commander_rota.json
- Governance calendar: data/bau/487_governance_review_calendar.json
- Open actions: data/bau/487_bau_open_actions_register.json

## Browser evidence

${
  records.activeScenario.pack.artifactRefs.length === 0
    ? "- Browser artifacts are generated by the Playwright suite."
    : records.activeScenario.pack.artifactRefs.map((artifact) => `- ${artifact}`).join("\n")
}
`;
}

export function write487BAUHandoverArtifacts(): void {
  const artifactRefs = listOutputArtifacts();
  const records = build487Records(artifactRefs);
  writeJson(
    "data/bau/487_bau_handover_pack.json",
    withHash<JsonObject>({
      recordType: "BAUHandoverPackEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      activePack: records.activeScenario.pack,
      activeCommand: records.activeScenario.command,
      activeSettlement: records.activeScenario.settlement,
      ownershipTransfers: {
        assistive: records.activeScenario.assistiveOwnership,
        channel: records.activeScenario.channelOwnership,
        records: records.activeScenario.recordsOwnership,
        releaseWave: records.activeScenario.releaseWaveOwnership,
        monitoring: records.activeScenario.monitoringTransfers,
        runbooks: records.activeScenario.runbookTransfers,
      },
      edgeCaseFixtures: records.edgeCaseFixtures,
      sourceRefs,
    }),
  );
  writeJson(
    "data/bau/487_support_rota_matrix.json",
    withHash<JsonObject>({
      recordType: "SupportRotaMatrix",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      rotaAssignments: records.activeScenario.rotaAssignments,
      rotaCoverageState: records.activeScenario.pack.rotaCoverageState,
      sourceRefs,
    }),
  );
  writeJson(
    "data/bau/487_service_owner_acceptance_register.json",
    withHash<JsonObject>({
      recordType: "ServiceOwnerAcceptanceRegister",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      acceptances: records.activeScenario.acceptances,
      activeCommand: records.activeScenario.command,
      activeSettlement: records.activeScenario.settlement,
      ownerAcceptanceState: records.activeScenario.pack.ownerAcceptanceState,
      sourceRefs,
    }),
  );
  writeJson(
    "data/bau/487_incident_commander_rota.json",
    withHash<JsonObject>({
      recordType: "IncidentCommanderRotaEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      incidentCommanderRota: records.activeScenario.incidentCommanderRota,
      sourceRefs,
    }),
  );
  writeJson(
    "data/bau/487_governance_review_calendar.json",
    withHash<JsonObject>({
      recordType: "GovernanceReviewCalendarEnvelope",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      calendar: records.activeScenario.governanceCalendar,
      sourceRefs,
    }),
  );
  writeJson(
    "data/bau/487_bau_open_actions_register.json",
    withHash<JsonObject>({
      recordType: "BAUOpenActionsRegister",
      taskId: TASK_ID,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: FIXED_NOW,
      openActions: records.activeScenario.openActions,
      sourceRefs,
    }),
  );
  writeJson("data/contracts/487_bau_handover.schema.json", buildSchema());
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_487_BAU_HANDOVER_AUTHORITY.json",
    buildInterfaceGap(),
  );
  writeJson("data/analysis/487_external_reference_notes.json", buildExternalReferenceNotes());
  writeText("data/analysis/487_algorithm_alignment_notes.md", buildAlgorithmAlignmentNotes(records));
  writeText("docs/runbooks/487_bau_handover_runbook.md", buildRunbook(records));
  writeText("docs/programme/487_service_owner_handover_report.md", buildReport(records));
  formatFiles([
    "data/bau/487_bau_handover_pack.json",
    "data/bau/487_support_rota_matrix.json",
    "data/bau/487_service_owner_acceptance_register.json",
    "data/bau/487_incident_commander_rota.json",
    "data/bau/487_governance_review_calendar.json",
    "data/bau/487_bau_open_actions_register.json",
    "data/contracts/487_bau_handover.schema.json",
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_487_BAU_HANDOVER_AUTHORITY.json",
    "data/analysis/487_external_reference_notes.json",
    "data/analysis/487_algorithm_alignment_notes.md",
    "docs/runbooks/487_bau_handover_runbook.md",
    "docs/programme/487_service_owner_handover_report.md",
  ]);
}

if (process.argv[1]?.endsWith("complete_487_bau_handover.ts")) {
  write487BAUHandoverArtifacts();
}
