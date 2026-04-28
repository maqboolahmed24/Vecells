import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const GENERATED_AT = "2026-04-28T00:00:00.000Z";
const TASK_ID = "seq_475";
const SCHEMA_VERSION = "475.programme.bau-training-runbooks.v1";

type ReadinessState = "complete" | "complete_with_constraints" | "blocked";
type EvidenceState = "exact" | "missing" | "stale" | "superseded" | "blocked";
type TrainingScenarioState =
  | "complete"
  | "complete_with_constraints"
  | "blocked"
  | "superseded_runbook";

export type LaunchRoleId =
  | "clinician"
  | "care_navigator"
  | "admin"
  | "hub_operator"
  | "pharmacist"
  | "support_analyst"
  | "governance_admin"
  | "clinical_safety_officer"
  | "security_privacy_owner"
  | "incident_commander"
  | "service_owner"
  | "release_manager"
  | "supplier_contact";

export interface RoleResponsibilityAssignment {
  readonly roleId: LaunchRoleId;
  readonly roleLabel: string;
  readonly owner: string;
  readonly responsibilityRibbon: string;
  readonly launchTasks: readonly string[];
  readonly supportDecisions: readonly string[];
  readonly escalationTriggers: readonly string[];
  readonly assistiveResponsibilities: readonly string[];
  readonly channelResponsibilities: readonly string[];
  readonly prohibitedActions: readonly string[];
  readonly trainingModuleRefs: readonly string[];
  readonly competencyEvidenceRefs: readonly string[];
  readonly escalationPathRefs: readonly string[];
  readonly tenantScope: string;
  readonly cohortScope: string;
  readonly channelScope: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly state: ReadinessState;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly assignmentHash: string;
}

export interface TrainingModule {
  readonly moduleId: string;
  readonly title: string;
  readonly audienceRoleRefs: readonly LaunchRoleId[];
  readonly prerequisites: readonly string[];
  readonly durationMinutes: number;
  readonly competencyEvidenceRequirement: string;
  readonly failureRetrainingPath: string;
  readonly learningOutcomes: readonly string[];
  readonly requiredResponsibilityAssertions: readonly string[];
  readonly accessibleFormats: readonly string[];
  readonly artifactPresentationContractRef: string;
  readonly sourceRefs: readonly string[];
  readonly state: ReadinessState;
  readonly moduleHash: string;
}

export interface CompetencyEvidenceEntry {
  readonly evidenceEntryId: string;
  readonly roleId: LaunchRoleId;
  readonly moduleId: string;
  readonly evidenceState: EvidenceState;
  readonly evidenceRef: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly verifiedAt: string | null;
  readonly expiresAt: string | null;
  readonly assessorRole: string;
  readonly failureRetrainingPathRef: string;
  readonly wormAuditRef: string;
  readonly blockerRefs: readonly string[];
  readonly evidenceHash: string;
}

export interface EscalationPath {
  readonly escalationPathId: string;
  readonly title: string;
  readonly primaryOwner: string;
  readonly secondaryOwner: string;
  readonly outOfHoursOwner: string | null;
  readonly outOfHoursCoverage: boolean;
  readonly contactValidationState: ReadinessState;
  readonly escalationTriggers: readonly string[];
  readonly settlementRecordRef: string;
  readonly tenantScope: string;
  readonly channelScope: string;
  readonly state: ReadinessState;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly escalationPathHash: string;
}

export interface GovernanceCadenceEvent {
  readonly cadenceEventId: string;
  readonly title: string;
  readonly cadence: string;
  readonly nextOccurrence: string;
  readonly owner: string;
  readonly requiredRoleRefs: readonly LaunchRoleId[];
  readonly evidenceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly state: ReadinessState;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly cadenceEventHash: string;
}

export interface RunbookBindingRecord {
  readonly runbookId: string;
  readonly title: string;
  readonly owner: string | null;
  readonly reviewCadenceDays: number | null;
  readonly versionRef: string;
  readonly sourceAlgorithmBlock: string;
  readonly releaseCandidateRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly evidenceRequirementRefs: readonly string[];
  readonly rehearsalProofRef: string;
  readonly escalationPathRef: string;
  readonly artifactPresentationContractRef: string | null;
  readonly accessibleAlternativeRef: string | null;
  readonly prohibitedShortcutRefs: readonly string[];
  readonly state: ReadinessState;
  readonly blockerRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly bindingHash: string;
}

export interface RunbookDrillEvidence {
  readonly drillEvidenceId: string;
  readonly runbookRef: string;
  readonly lastRehearsedAt: string;
  readonly participantRoleRefs: readonly LaunchRoleId[];
  readonly result: ReadinessState;
  readonly evidenceRefs: readonly string[];
  readonly wormAuditRef: string;
  readonly drillHash: string;
}

export interface RunbookVersionApproval {
  readonly approvalId: string;
  readonly runbookRef: string;
  readonly versionRef: string;
  readonly approverRoleRef: LaunchRoleId;
  readonly approvalState: ReadinessState;
  readonly approvedAt: string | null;
  readonly wormAuditRef: string;
  readonly approvalHash: string;
}

export interface BAUArtifacts {
  readonly operatingModel: any;
  readonly roleResponsibilityMatrix: any;
  readonly trainingCurriculumManifest: any;
  readonly competencyEvidenceLedger: any;
  readonly runbookBundleManifest: any;
  readonly governanceCadenceCalendar: any;
  readonly supportEscalationPaths: any;
  readonly contractSchema: any;
  readonly interfaceGap: any;
  readonly algorithmNotes: string;
  readonly externalReferenceNotes: any;
}

const sourceAlgorithmRefs = [
  "prompt/475.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-9-the-assurance-ledger.md",
  "blueprint/staff-operations-and-support-blueprint.md",
  "blueprint/operations-console-frontend-blueprint.md",
  "blueprint/governance-admin-console-frontend-blueprint.md",
  "blueprint/phase-8-the-assistive-layer.md",
  "blueprint/phase-7-inside-the-nhs-app.md",
  "blueprint/accessibility-and-content-system-contract.md",
] as const;

const upstreamEvidenceRefs = [
  "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
  "data/conformance/473_phase7_channel_readiness_reconciliation.json",
  "data/migration/474_cutover_runbook.json",
  "data/migration/474_projection_readiness_verdicts.json",
  "data/evidence/471_phase9_exit_gate_decision.json",
  "data/release/release_candidate_tuple.json",
] as const;

const allRoleIds: readonly LaunchRoleId[] = [
  "clinician",
  "care_navigator",
  "admin",
  "hub_operator",
  "pharmacist",
  "support_analyst",
  "governance_admin",
  "clinical_safety_officer",
  "security_privacy_owner",
  "incident_commander",
  "service_owner",
  "release_manager",
  "supplier_contact",
] as const;

const moduleIds = {
  launch: "tm_475_launch_operations_foundation",
  support: "tm_475_support_lineage_and_handoff",
  assistive: "tm_475_assistive_human_review_responsibility",
  channel: "tm_475_nhs_app_deferred_channel_support",
  security: "tm_475_incident_security_privacy_escalation",
  rollback: "tm_475_rollback_rehearsal_and_cutover_support",
  governance: "tm_475_governance_cadence_and_evidence_pack",
  accessibility: "tm_475_accessible_artifact_and_non_html_controls",
  clinicalSafety: "tm_475_clinical_safety_dcb0160_operations",
} as const;

function canonicalize(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  );
}

function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function digestRef(prefix: string, value: unknown): string {
  return `${prefix}:${sha256(value).slice(0, 16)}`;
}

function withHash<T extends Record<string, unknown>, K extends string>(
  value: T,
  hashField: K,
): T & Record<K, string> {
  return { ...value, [hashField]: sha256(value) } as T & Record<K, string>;
}

function absolute(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function assertFile(relativePath: string): void {
  if (!fs.existsSync(absolute(relativePath))) {
    throw new Error(`Missing required input: ${relativePath}`);
  }
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(absolute(relativePath), "utf8")) as T;
}

function writeJson(relativePath: string, value: unknown): void {
  const target = absolute(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(canonicalize(value), null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const target = absolute(relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${value.trimEnd()}\n`);
}

function sourceFileHashes(): readonly { readonly ref: string; readonly sha256: string }[] {
  return [...sourceAlgorithmRefs, ...upstreamEvidenceRefs].map((ref) => ({
    ref,
    sha256: createHash("sha256").update(fs.readFileSync(absolute(ref))).digest("hex"),
  }));
}

function titleCaseRole(roleId: LaunchRoleId): string {
  return roleId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function scenarioShape(scenarioState: TrainingScenarioState) {
  return {
    readinessState:
      scenarioState === "blocked" || scenarioState === "superseded_runbook"
        ? ("blocked" as const)
        : scenarioState,
    clinicalSafetyEvidenceState: scenarioState === "blocked" ? ("missing" as const) : ("exact" as const),
    incidentOutOfHoursCoverage: scenarioState !== "blocked",
    runbookReleaseTupleState:
      scenarioState === "superseded_runbook" ? ("superseded" as const) : ("current" as const),
    trainingCompletionState:
      scenarioState === "complete" ? ("complete" as const) : scenarioState === "blocked" ? ("blocked" as const) : ("complete_with_constraints" as const),
  };
}

function module(
  input: Omit<TrainingModule, "moduleHash">,
): TrainingModule {
  return withHash(input as unknown as Record<string, unknown>, "moduleHash") as unknown as TrainingModule;
}

function evidenceEntry(
  input: Omit<CompetencyEvidenceEntry, "evidenceHash">,
): CompetencyEvidenceEntry {
  return withHash(input as unknown as Record<string, unknown>, "evidenceHash") as unknown as CompetencyEvidenceEntry;
}

function escalationPath(input: Omit<EscalationPath, "escalationPathHash">): EscalationPath {
  return withHash(
    input as unknown as Record<string, unknown>,
    "escalationPathHash",
  ) as unknown as EscalationPath;
}

function cadenceEvent(
  input: Omit<GovernanceCadenceEvent, "cadenceEventHash">,
): GovernanceCadenceEvent {
  return withHash(
    input as unknown as Record<string, unknown>,
    "cadenceEventHash",
  ) as unknown as GovernanceCadenceEvent;
}

function runbook(input: Omit<RunbookBindingRecord, "bindingHash">): RunbookBindingRecord {
  return withHash(input as unknown as Record<string, unknown>, "bindingHash") as unknown as RunbookBindingRecord;
}

function drill(input: Omit<RunbookDrillEvidence, "drillHash">): RunbookDrillEvidence {
  return withHash(input as unknown as Record<string, unknown>, "drillHash") as unknown as RunbookDrillEvidence;
}

function approval(input: Omit<RunbookVersionApproval, "approvalHash">): RunbookVersionApproval {
  return withHash(input as unknown as Record<string, unknown>, "approvalHash") as unknown as RunbookVersionApproval;
}

function roleAssignment(
  input: Omit<RoleResponsibilityAssignment, "assignmentHash">,
): RoleResponsibilityAssignment {
  return withHash(
    input as unknown as Record<string, unknown>,
    "assignmentHash",
  ) as unknown as RoleResponsibilityAssignment;
}

function modulesForRole(roleId: LaunchRoleId): readonly string[] {
  const shared = [moduleIds.launch, moduleIds.accessibility];
  const roleSpecific: Record<LaunchRoleId, readonly string[]> = {
    clinician: [moduleIds.support, moduleIds.assistive, moduleIds.clinicalSafety],
    care_navigator: [moduleIds.support, moduleIds.channel],
    admin: [moduleIds.support, moduleIds.channel],
    hub_operator: [moduleIds.support],
    pharmacist: [moduleIds.support, moduleIds.assistive],
    support_analyst: [moduleIds.support, moduleIds.assistive, moduleIds.channel, moduleIds.security, moduleIds.rollback],
    governance_admin: [moduleIds.assistive, moduleIds.channel, moduleIds.security, moduleIds.governance],
    clinical_safety_officer: [moduleIds.assistive, moduleIds.governance, moduleIds.clinicalSafety],
    security_privacy_owner: [moduleIds.security, moduleIds.governance],
    incident_commander: [moduleIds.support, moduleIds.channel, moduleIds.security, moduleIds.rollback],
    service_owner: [moduleIds.channel, moduleIds.rollback, moduleIds.governance, moduleIds.clinicalSafety],
    release_manager: [moduleIds.rollback, moduleIds.governance],
    supplier_contact: [moduleIds.channel],
  };
  return Array.from(new Set([...shared, ...roleSpecific[roleId]]));
}

function buildTrainingModules(): readonly TrainingModule[] {
  return [
    module({
      moduleId: moduleIds.launch,
      title: "Launch operations foundation",
      audienceRoleRefs: allRoleIds,
      prerequisites: ["Current role authorization and release-readiness briefing"],
      durationMinutes: 45,
      competencyEvidenceRequirement:
        "Observed walkthrough of the BAU model, support boundaries, and release tuple constraints.",
      failureRetrainingPath: "Repeat facilitated walkthrough, then supervised launch huddle exercise.",
      learningOutcomes: [
        "Explain the BAU readiness state without implying release-wave promotion.",
        "Find the current runbook owner and escalation path for a launch issue.",
        "Record evidence through WORM-linked settlement records rather than local notes.",
      ],
      requiredResponsibilityAssertions: [
        "Narrative confidence and local dashboard labels do not override the conformance scorecard.",
      ],
      accessibleFormats: ["HTML summary", "tagged PDF alternative", "plain-text transcript"],
      artifactPresentationContractRef: "artifact-presentation:475:launch-operations-foundation",
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9I"],
      state: "complete",
    }),
    module({
      moduleId: moduleIds.support,
      title: "Support lineage and handoff",
      audienceRoleRefs: [
        "clinician",
        "care_navigator",
        "admin",
        "hub_operator",
        "pharmacist",
        "support_analyst",
        "incident_commander",
      ],
      prerequisites: ["Launch operations foundation"],
      durationMinutes: 60,
      competencyEvidenceRequirement:
        "Role-played support ticket handoff with SupportLineageBinding and transfer settlement evidence.",
      failureRetrainingPath: "Repeat support replay and handoff drill with supervisor sign-off.",
      learningOutcomes: [
        "Keep support actions inside the current ticket shell and lineage boundary.",
        "Use structured handoff summaries and acceptance deadlines.",
        "Avoid final success wording until the authoritative settlement exists.",
      ],
      requiredResponsibilityAssertions: [
        "Support actions never bypass clinical workflow ownership.",
        "Observe-only or replay posture cannot arm live repair controls.",
      ],
      accessibleFormats: ["HTML workbook", "captioned drill recording", "plain-text checklist"],
      artifactPresentationContractRef: "artifact-presentation:475:support-lineage-handoff",
      sourceRefs: ["blueprint/staff-operations-and-support-blueprint.md#support-route-contract"],
      state: "complete",
    }),
    module({
      moduleId: moduleIds.assistive,
      title: "Assistive layer human review responsibility",
      audienceRoleRefs: [
        "clinician",
        "pharmacist",
        "support_analyst",
        "governance_admin",
        "clinical_safety_officer",
      ],
      prerequisites: ["Launch operations foundation"],
      durationMinutes: 75,
      competencyEvidenceRequirement:
        "Reviewed synthetic assistive output, corrected a material error, and recorded final human approval.",
      failureRetrainingPath:
        "Blocked from assistive-capable workflows until the human-review simulation is passed.",
      learningOutcomes: [
        "Review, revise, and approve assistive outputs before they affect a record or workflow.",
        "Recognize stale, low-trust, and incident-linked assistive outputs.",
        "Record feedback and overrides on the same assistive evidence chain.",
      ],
      requiredResponsibilityAssertions: [
        "Staff must review, revise, and approve every assistive output used in work.",
        "No model output is final authority.",
        "Only the final human artifact can settle the workflow.",
      ],
      accessibleFormats: ["HTML module", "tagged PDF alternative", "plain-language checklist"],
      artifactPresentationContractRef: "artifact-presentation:475:assistive-human-review",
      sourceRefs: [
        "blueprint/phase-8-the-assistive-layer.md#training",
        "blueprint/phase-8-the-assistive-layer.md#HumanApprovalGateAssessment",
      ],
      state: "complete",
    }),
    module({
      moduleId: moduleIds.channel,
      title: "NHS App deferred channel support",
      audienceRoleRefs: [
        "care_navigator",
        "admin",
        "support_analyst",
        "governance_admin",
        "incident_commander",
        "service_owner",
        "supplier_contact",
      ],
      prerequisites: ["Launch operations foundation"],
      durationMinutes: 60,
      competencyEvidenceRequirement:
        "Answered a deferred-channel support scenario without claiming NHS App go-live.",
      failureRetrainingPath:
        "Repeat channel support scenario and review change-notice obligations with governance.",
      learningOutcomes: [
        "Explain that the NHS App channel remains deferred for the current release.",
        "Use unsupported-action handoff behavior for app webview limitations.",
        "Prepare monthly data, annual assurance, and journey-change records for future activation.",
      ],
      requiredResponsibilityAssertions: [
        "NHS App is not live for this release.",
        "Channel changes require the manifest and change-notice process.",
        "Unsupported downloads or print flows must use governed fallback routes.",
      ],
      accessibleFormats: ["HTML module", "plain-text support script", "tagged PDF alternative"],
      artifactPresentationContractRef: "artifact-presentation:475:nhs-app-deferred-channel",
      sourceRefs: [
        "blueprint/phase-7-inside-the-nhs-app.md#7I",
        "data/conformance/473_phase7_channel_readiness_reconciliation.json",
      ],
      state: "complete_with_constraints",
    }),
    module({
      moduleId: moduleIds.security,
      title: "Incident, security, and privacy escalation",
      audienceRoleRefs: [
        "support_analyst",
        "governance_admin",
        "security_privacy_owner",
        "incident_commander",
      ],
      prerequisites: ["Launch operations foundation", "Support lineage and handoff"],
      durationMinutes: 70,
      competencyEvidenceRequirement:
        "Completed reportable-incident drill with out-of-hours escalation evidence.",
      failureRetrainingPath: "Repeat incident drill and complete security/privacy owner review.",
      learningOutcomes: [
        "Separate support tickets, security incidents, privacy incidents, and clinical safety events.",
        "Escalate out of hours without leaving the ticket unowned.",
        "Preserve audit and redaction boundaries in incident artifacts.",
      ],
      requiredResponsibilityAssertions: [
        "Out-of-hours gaps block readiness.",
        "Incident evidence must be synthetic in tests and redacted in operator traces.",
      ],
      accessibleFormats: ["HTML drill guide", "tagged PDF alternative", "plain-text on-call path"],
      artifactPresentationContractRef: "artifact-presentation:475:incident-security-privacy",
      sourceRefs: [
        "blueprint/phase-9-the-assurance-ledger.md#security-incident-workflow",
        "blueprint/staff-operations-and-support-blueprint.md#governance-requirements",
      ],
      state: "complete",
    }),
    module({
      moduleId: moduleIds.rollback,
      title: "Rollback rehearsal and cutover support",
      audienceRoleRefs: ["support_analyst", "incident_commander", "service_owner", "release_manager"],
      prerequisites: ["Launch operations foundation"],
      durationMinutes: 55,
      competencyEvidenceRequirement:
        "Observed rollback tabletop tied to the current migration tuple and release recovery disposition.",
      failureRetrainingPath: "Repeat rollback tabletop before joining launch on-call rotation.",
      learningOutcomes: [
        "Use the current release tuple and rollback matrix before any exposure change.",
        "Keep production cutover disabled until release-wave authority is exact.",
        "Route stale migration or projection evidence into constrained or blocked readiness.",
      ],
      requiredResponsibilityAssertions: [
        "Superseded release tuple evidence blocks completion.",
      ],
      accessibleFormats: ["HTML tabletop script", "tagged PDF alternative", "plain-text command list"],
      artifactPresentationContractRef: "artifact-presentation:475:rollback-cutover-support",
      sourceRefs: ["data/migration/474_cutover_runbook.json"],
      state: "complete_with_constraints",
    }),
    module({
      moduleId: moduleIds.governance,
      title: "Governance cadence and evidence pack",
      audienceRoleRefs: [
        "governance_admin",
        "clinical_safety_officer",
        "security_privacy_owner",
        "service_owner",
        "release_manager",
      ],
      prerequisites: ["Launch operations foundation"],
      durationMinutes: 65,
      competencyEvidenceRequirement:
        "Prepared a monthly assurance pack entry and governance cadence decision record.",
      failureRetrainingPath: "Repeat cadence pack exercise with governance admin review.",
      learningOutcomes: [
        "Run daily, weekly, monthly, quarterly, and annual readiness cadences.",
        "Bind each cadence event to evidence and WORM audit references.",
        "Use scope-safe governance surfaces for approvals, packs, and watch windows.",
      ],
      requiredResponsibilityAssertions: [
        "Governance completion comes from evidence graph state, not export acknowledgement.",
      ],
      accessibleFormats: ["HTML guide", "tagged PDF alternative", "calendar ICS summary"],
      artifactPresentationContractRef: "artifact-presentation:475:governance-cadence-pack",
      sourceRefs: [
        "blueprint/governance-admin-console-frontend-blueprint.md#release-gate",
        "blueprint/phase-9-the-assurance-ledger.md#9I",
      ],
      state: "complete",
    }),
    module({
      moduleId: moduleIds.accessibility,
      title: "Accessible training artifacts and non-HTML controls",
      audienceRoleRefs: allRoleIds,
      prerequisites: ["Launch operations foundation"],
      durationMinutes: 35,
      competencyEvidenceRequirement:
        "Confirmed table fallback, focus return, plain-language copy, and accessible alternative for a non-HTML artifact.",
      failureRetrainingPath:
        "Rework the training artifact and repeat accessibility sign-off before publication.",
      learningOutcomes: [
        "Keep action labels verb-led and consequence-aware.",
        "Provide accessible alternatives for non-HTML training materials.",
        "Return focus to the invoking role card after closing details.",
      ],
      requiredResponsibilityAssertions: [
        "Non-HTML materials without an accessible alternative or presentation contract are blocked.",
      ],
      accessibleFormats: ["HTML module", "tagged PDF alternative", "plain-text transcript"],
      artifactPresentationContractRef: "artifact-presentation:475:accessible-training-artifacts",
      sourceRefs: ["blueprint/accessibility-and-content-system-contract.md"],
      state: "complete",
    }),
    module({
      moduleId: moduleIds.clinicalSafety,
      title: "Clinical safety operations and DCB0160 evidence",
      audienceRoleRefs: ["clinician", "clinical_safety_officer", "governance_admin", "service_owner"],
      prerequisites: ["Launch operations foundation"],
      durationMinutes: 80,
      competencyEvidenceRequirement:
        "Reviewed a synthetic hazard, linked mitigation evidence, and confirmed the clinical safety officer route.",
      failureRetrainingPath:
        "Clinical safety officer must approve retraining evidence before the role can be marked complete.",
      learningOutcomes: [
        "Apply deployment and use clinical risk management responsibilities.",
        "Keep hazard log and clinical safety case references current.",
        "Block support-only completion when clinical safety owner evidence is missing.",
      ],
      requiredResponsibilityAssertions: [
        "Clinical safety owner competency is required separately from support completion.",
      ],
      accessibleFormats: ["HTML module", "tagged PDF alternative", "plain-text hazard checklist"],
      artifactPresentationContractRef: "artifact-presentation:475:clinical-safety-operations",
      sourceRefs: [
        "blueprint/phase-9-the-assurance-ledger.md#incident-and-near-miss-workflows",
        "external:nhs-digital-clinical-safety-assurance",
      ],
      state: "complete",
    }),
  ];
}

function buildCompetencyLedger(
  roles: readonly LaunchRoleId[],
  releaseCandidateRef: string,
  runtimePublicationBundleRef: string,
  shape: ReturnType<typeof scenarioShape>,
): readonly CompetencyEvidenceEntry[] {
  return roles.flatMap((roleId) =>
    modulesForRole(roleId).map((moduleId) => {
      const clinicalSafetyBlocked =
        roleId === "clinical_safety_officer" &&
        moduleId === moduleIds.clinicalSafety &&
        shape.clinicalSafetyEvidenceState === "missing";
      const state: EvidenceState = clinicalSafetyBlocked ? "missing" : "exact";
      return evidenceEntry({
        evidenceEntryId: `cel_475_${roleId}_${moduleId.replace("tm_475_", "")}`,
        roleId,
        moduleId,
        evidenceState: state,
        evidenceRef:
          state === "exact"
            ? `competency:475:${roleId}:${moduleId}:observed-v1`
            : `competency:475:${roleId}:${moduleId}:missing`,
        releaseCandidateRef,
        runtimePublicationBundleRef,
        verifiedAt: state === "exact" ? "2026-04-28T09:00:00.000Z" : null,
        expiresAt: state === "exact" ? "2026-07-28T09:00:00.000Z" : null,
        assessorRole:
          roleId === "clinical_safety_officer" ? "service_owner" : "governance_admin",
        failureRetrainingPathRef: `retraining:475:${moduleId}`,
        wormAuditRef: `worm-ledger:475:competency:${roleId}:${moduleId}`,
        blockerRefs: clinicalSafetyBlocked
          ? ["blocker:475:clinical-safety-owner-competency-missing"]
          : [],
      });
    }),
  );
}

export function build475BAUArtifacts(
  scenarioState: TrainingScenarioState = "complete_with_constraints",
): BAUArtifacts {
  for (const ref of [...sourceAlgorithmRefs, ...upstreamEvidenceRefs]) {
    assertFile(ref);
  }

  const phase7 = readJson<any>("data/conformance/473_phase7_channel_readiness_reconciliation.json");
  const scorecard = readJson<any>("data/conformance/473_master_scorecard_after_phase7_reconciliation.json");
  const cutover = readJson<any>("data/migration/474_cutover_runbook.json");
  const releaseTuple = readJson<any>("data/release/release_candidate_tuple.json");

  const cutoverPlan = cutover.programmeCutoverPlan ?? {};
  const releaseRef = cutoverPlan.releaseRef ?? scorecard.releaseRef;
  const tenantScope = cutoverPlan.tenantScope ?? scorecard.tenantScope;
  const cohortScope = "cohort:wave1:bau-training-and-runbook-readiness";
  const channelScope =
    cutoverPlan.channelScope ?? "channel:core-web-and-staff;nhs-app-deferred";
  const releaseCandidateRef =
    cutoverPlan.releaseCandidateRef ?? releaseTuple.releaseCandidateTuple?.releaseRef ?? "RC_LOCAL_V1";
  const runtimePublicationBundleRef =
    cutoverPlan.runtimePublicationBundleRef ??
    releaseTuple.releaseCandidateTuple?.runtimePublicationBundleRef ??
    "rpb::local::authoritative";
  const releasePublicationParityRef =
    cutoverPlan.releasePublicationParityRef ??
    releaseTuple.releaseCandidateTuple?.releasePublicationParityRef ??
    "rpp::local::authoritative";
  const migrationTupleHash = cutoverPlan.migrationTupleHash ?? digestRef("migration-tuple", cutoverPlan);
  const phase7Deferred = phase7.readinessPredicate?.state === "deferred";
  const manifestVersionRef =
    phase7.readinessPredicate?.manifestVersionRef ?? "nhsapp-manifest-v0.1.0-freeze-374";
  const shape = scenarioShape(scenarioState);
  const sourceRefs = [...sourceAlgorithmRefs, ...upstreamEvidenceRefs];
  const sourceHashes = sourceFileHashes();

  const modules = buildTrainingModules();
  const competencyEntries = buildCompetencyLedger(
    allRoleIds,
    releaseCandidateRef,
    runtimePublicationBundleRef,
    shape,
  );

  const escalationPaths = [
    escalationPath({
      escalationPathId: "ep_475_support_ops_out_of_hours",
      title: "Support operations and out-of-hours escalation",
      primaryOwner: "support_analyst",
      secondaryOwner: "incident_commander",
      outOfHoursOwner: shape.incidentOutOfHoursCoverage ? "incident_commander_on_call" : null,
      outOfHoursCoverage: shape.incidentOutOfHoursCoverage,
      contactValidationState: shape.incidentOutOfHoursCoverage ? "complete" : "blocked",
      escalationTriggers: [
        "Support ticket unowned after transfer deadline",
        "Live repair action awaiting external confirmation beyond policy threshold",
        "Support continuity evidence stale or blocked",
      ],
      settlementRecordRef: "SupportTransferAcceptanceSettlement:475:launch",
      tenantScope,
      channelScope,
      state: shape.incidentOutOfHoursCoverage ? "complete" : "blocked",
      blockerRefs: shape.incidentOutOfHoursCoverage
        ? []
        : ["blocker:475:incident-escalation-out-of-hours-gap"],
      sourceRefs: ["blueprint/staff-operations-and-support-blueprint.md#handoff-and-resolution"],
    }),
    escalationPath({
      escalationPathId: "ep_475_clinical_safety",
      title: "Clinical safety and assistive incident escalation",
      primaryOwner: "clinical_safety_officer",
      secondaryOwner: "service_owner",
      outOfHoursOwner: "incident_commander_on_call",
      outOfHoursCoverage: true,
      contactValidationState: "complete",
      escalationTriggers: [
        "Assistive output suspected inaccurate or over-relied on",
        "Hazard log mitigation evidence stale",
        "Clinical workflow owner disputes support-side evidence",
      ],
      settlementRecordRef: "ClinicalSafetyEscalationSettlement:475:launch",
      tenantScope,
      channelScope,
      state: "complete",
      blockerRefs: [],
      sourceRefs: [
        "blueprint/phase-8-the-assistive-layer.md#HumanApprovalGateAssessment",
        "blueprint/phase-9-the-assurance-ledger.md#incident-and-near-miss-workflows",
      ],
    }),
    escalationPath({
      escalationPathId: "ep_475_security_privacy_incident",
      title: "Security and privacy incident escalation",
      primaryOwner: "security_privacy_owner",
      secondaryOwner: "incident_commander",
      outOfHoursOwner: "security_privacy_owner_on_call",
      outOfHoursCoverage: true,
      contactValidationState: "complete",
      escalationTriggers: [
        "Telemetry, trace, or artifact leaks sensitive marker text",
        "Access-affecting support action reported as a near miss",
        "Supplier-hosted dependency incident affects confidentiality or integrity",
      ],
      settlementRecordRef: "SecurityPrivacyIncidentSettlement:475:launch",
      tenantScope,
      channelScope,
      state: "complete",
      blockerRefs: [],
      sourceRefs: [
        "blueprint/staff-operations-and-support-blueprint.md#governance-requirements",
        "blueprint/phase-9-the-assurance-ledger.md#security-incident-workflow",
      ],
    }),
    escalationPath({
      escalationPathId: "ep_475_nhs_app_supplier_deferred",
      title: "NHS App deferred-channel supplier support",
      primaryOwner: "supplier_contact",
      secondaryOwner: "service_owner",
      outOfHoursOwner: "support_analyst_on_call",
      outOfHoursCoverage: true,
      contactValidationState: "complete_with_constraints",
      escalationTriggers: [
        "Support ticket mentions NHS App jump-off route for this deferred release",
        "Journey-change notice requested before channel activation authority",
        "Unsupported embedded behavior requires governed fallback advice",
      ],
      settlementRecordRef: "ChannelSupportResponsibilityNotice:475:deferred",
      tenantScope,
      channelScope,
      state: "complete_with_constraints",
      blockerRefs: phase7Deferred ? ["constraint:475:phase7-channel-deferred"] : [],
      sourceRefs: ["blueprint/phase-7-inside-the-nhs-app.md#7I"],
    }),
    escalationPath({
      escalationPathId: "ep_475_release_rollback",
      title: "Release rollback and cutover support escalation",
      primaryOwner: "release_manager",
      secondaryOwner: "service_owner",
      outOfHoursOwner: "incident_commander_on_call",
      outOfHoursCoverage: true,
      contactValidationState: "complete",
      escalationTriggers: [
        "Runbook references superseded release tuple",
        "Projection or migration evidence loses exact state",
        "Release-wave authority is requested before 476 or 482 is available",
      ],
      settlementRecordRef: "ReleaseRollbackEscalationSettlement:475:launch",
      tenantScope,
      channelScope,
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["data/migration/474_cutover_runbook.json"],
    }),
  ];

  const runbooks = [
    runbook({
      runbookId: "rb_475_clinical_ops_launch_huddle",
      title: "Clinical operations launch huddle",
      owner: "service_owner",
      reviewCadenceDays: 14,
      versionRef: `runbook-version:475:clinical-ops:${releaseCandidateRef}`,
      sourceAlgorithmBlock: "phase-9-9I-bau-transfer",
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      evidenceRequirementRefs: [
        "data/bau/475_role_responsibility_matrix.json",
        "data/bau/475_competency_evidence_ledger.json",
      ],
      rehearsalProofRef: "rde_475_clinical_ops_launch_huddle",
      escalationPathRef: "ep_475_support_ops_out_of_hours",
      artifactPresentationContractRef: "artifact-presentation:475:clinical-ops-launch-huddle",
      accessibleAlternativeRef: "accessible-alt:475:clinical-ops-launch-huddle:plain-text",
      prohibitedShortcutRefs: ["shortcut:475:local-dashboard-green-as-signoff"],
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9I"],
    }),
    runbook({
      runbookId: "rb_475_support_triage_lineage_handoff",
      title: "Support triage, lineage, and handoff",
      owner: "support_analyst",
      reviewCadenceDays: 30,
      versionRef: `runbook-version:475:support-lineage:${releaseCandidateRef}`,
      sourceAlgorithmBlock: "staff-operations-support-route-contract",
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      evidenceRequirementRefs: ["SupportLineageBinding:475:launch", "SupportOwnershipTransferRecord:475:launch"],
      rehearsalProofRef: "rde_475_support_lineage_handoff",
      escalationPathRef: "ep_475_support_ops_out_of_hours",
      artifactPresentationContractRef: "artifact-presentation:475:support-lineage-handoff",
      accessibleAlternativeRef: "accessible-alt:475:support-lineage-handoff:plain-text",
      prohibitedShortcutRefs: ["shortcut:475:detached-ticket-note-as-resolution"],
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["blueprint/staff-operations-and-support-blueprint.md#support-route-contract"],
    }),
    runbook({
      runbookId: "rb_475_assistive_human_review_incident",
      title: "Assistive human review and incident path",
      owner: "clinical_safety_officer",
      reviewCadenceDays: 30,
      versionRef: `runbook-version:475:assistive-human-review:${releaseCandidateRef}`,
      sourceAlgorithmBlock: "phase-8-human-approval-gate",
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      evidenceRequirementRefs: [
        "AssistiveReviewResponsibilityNotice:475",
        "HumanApprovalGateAssessment:475:training-simulation",
      ],
      rehearsalProofRef: "rde_475_assistive_human_review_incident",
      escalationPathRef: "ep_475_clinical_safety",
      artifactPresentationContractRef: "artifact-presentation:475:assistive-human-review-runbook",
      accessibleAlternativeRef: "accessible-alt:475:assistive-human-review:plain-text",
      prohibitedShortcutRefs: ["shortcut:475:model-output-as-final-authority"],
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["blueprint/phase-8-the-assistive-layer.md#HumanApprovalGateAssessment"],
    }),
    runbook({
      runbookId: "rb_475_nhs_app_deferred_channel_support",
      title: "NHS App deferred-channel support",
      owner: "service_owner",
      reviewCadenceDays: 30,
      versionRef: `runbook-version:475:nhs-app-deferred:${releaseCandidateRef}`,
      sourceAlgorithmBlock: "phase-7-7I-post-live-governance",
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      evidenceRequirementRefs: [
        "ChannelSupportResponsibilityNotice:475",
        "data/conformance/473_phase7_channel_readiness_reconciliation.json",
      ],
      rehearsalProofRef: "rde_475_nhs_app_deferred_channel_support",
      escalationPathRef: "ep_475_nhs_app_supplier_deferred",
      artifactPresentationContractRef: "artifact-presentation:475:nhs-app-deferred-channel-runbook",
      accessibleAlternativeRef: "accessible-alt:475:nhs-app-deferred-channel:plain-text",
      prohibitedShortcutRefs: ["shortcut:475:nhs-app-live-claim-while-phase7-deferred"],
      state: "complete_with_constraints",
      blockerRefs: phase7Deferred ? ["constraint:475:phase7-channel-deferred"] : [],
      sourceRefs: ["blueprint/phase-7-inside-the-nhs-app.md#7I"],
    }),
    runbook({
      runbookId: "rb_475_security_privacy_incident",
      title: "Security and privacy incident response",
      owner: "security_privacy_owner",
      reviewCadenceDays: 30,
      versionRef: `runbook-version:475:security-privacy:${releaseCandidateRef}`,
      sourceAlgorithmBlock: "phase-9-security-incident-workflow",
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      evidenceRequirementRefs: ["SecurityPrivacyIncidentSettlement:475:launch"],
      rehearsalProofRef: "rde_475_security_privacy_incident",
      escalationPathRef: "ep_475_security_privacy_incident",
      artifactPresentationContractRef: "artifact-presentation:475:security-privacy-incident-runbook",
      accessibleAlternativeRef: "accessible-alt:475:security-privacy-incident:plain-text",
      prohibitedShortcutRefs: ["shortcut:475:raw-token-or-phi-in-trace"],
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#security-incident-workflow"],
    }),
    runbook({
      runbookId: "rb_475_rollback_cutover_rehearsal",
      title: "Rollback rehearsal and release tuple check",
      owner: "release_manager",
      reviewCadenceDays: 14,
      versionRef:
        shape.runbookReleaseTupleState === "superseded"
          ? "runbook-version:475:rollback:SUPERSEDED_RC"
          : `runbook-version:475:rollback:${releaseCandidateRef}`,
      sourceAlgorithmBlock: "task-474-cutover-runbook",
      releaseCandidateRef:
        shape.runbookReleaseTupleState === "superseded" ? "SUPERSEDED_RC" : releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      evidenceRequirementRefs: ["data/migration/474_cutover_runbook.json"],
      rehearsalProofRef: "rde_475_rollback_cutover_rehearsal",
      escalationPathRef: "ep_475_release_rollback",
      artifactPresentationContractRef: "artifact-presentation:475:rollback-cutover-runbook",
      accessibleAlternativeRef: "accessible-alt:475:rollback-cutover:plain-text",
      prohibitedShortcutRefs: ["shortcut:475:superseded-release-tuple-as-current"],
      state: shape.runbookReleaseTupleState === "superseded" ? "blocked" : "complete_with_constraints",
      blockerRefs:
        shape.runbookReleaseTupleState === "superseded"
          ? ["blocker:475:runbook-release-tuple-superseded"]
          : ["constraint:475:production-cutover-disabled-until-release-wave-authority"],
      sourceRefs: ["data/migration/474_cutover_runbook.json"],
    }),
    runbook({
      runbookId: "rb_475_accessible_artifact_training_delivery",
      title: "Accessible training artifact delivery",
      owner: "governance_admin",
      reviewCadenceDays: 60,
      versionRef: `runbook-version:475:accessible-artifacts:${releaseCandidateRef}`,
      sourceAlgorithmBlock: "accessibility-content-system-contract",
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      evidenceRequirementRefs: ["AccessibleSurfaceContract:475:training-runbook-centre"],
      rehearsalProofRef: "rde_475_accessible_artifact_training_delivery",
      escalationPathRef: "ep_475_support_ops_out_of_hours",
      artifactPresentationContractRef: "artifact-presentation:475:accessible-training-delivery",
      accessibleAlternativeRef: "accessible-alt:475:training-materials:plain-text",
      prohibitedShortcutRefs: ["shortcut:475:non-html-material-without-accessible-alternative"],
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["blueprint/accessibility-and-content-system-contract.md"],
    }),
    runbook({
      runbookId: "rb_475_governance_cadence_pack",
      title: "Governance cadence and assurance pack",
      owner: "governance_admin",
      reviewCadenceDays: 30,
      versionRef: `runbook-version:475:governance-cadence:${releaseCandidateRef}`,
      sourceAlgorithmBlock: "governance-admin-release-and-evidence-pack",
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      evidenceRequirementRefs: ["GovernanceCadenceEvent:475:monthly-assurance-pack"],
      rehearsalProofRef: "rde_475_governance_cadence_pack",
      escalationPathRef: "ep_475_clinical_safety",
      artifactPresentationContractRef: "artifact-presentation:475:governance-cadence-pack",
      accessibleAlternativeRef: "accessible-alt:475:governance-cadence:plain-text",
      prohibitedShortcutRefs: ["shortcut:475:export-acknowledgement-as-governance-completion"],
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["blueprint/governance-admin-console-frontend-blueprint.md#release-gate"],
    }),
  ];

  const drillEvidence = runbooks.map((item, index) =>
    drill({
      drillEvidenceId: item.rehearsalProofRef,
      runbookRef: item.runbookId,
      lastRehearsedAt: `2026-04-${String(20 + index).padStart(2, "0")}T10:00:00.000Z`,
      participantRoleRefs: index % 2 === 0
        ? ["support_analyst", "clinical_safety_officer", "incident_commander"]
        : ["governance_admin", "service_owner", "release_manager"],
      result: item.state === "blocked" ? "blocked" : "complete",
      evidenceRefs: [`evidence:475:drill:${item.runbookId}`, "data/evidence/471_phase9_exit_gate_decision.json"],
      wormAuditRef: `worm-ledger:475:runbook-drill:${item.runbookId}`,
    }),
  );

  const versionApprovals = runbooks.map((item) =>
    approval({
      approvalId: `rva_475_${item.runbookId.replace("rb_475_", "")}`,
      runbookRef: item.runbookId,
      versionRef: item.versionRef,
      approverRoleRef:
        item.owner === "clinical_safety_officer"
          ? "clinical_safety_officer"
          : item.owner === "security_privacy_owner"
            ? "security_privacy_owner"
            : item.owner === "release_manager"
              ? "release_manager"
              : "governance_admin",
      approvalState: item.state,
      approvedAt: item.state === "blocked" ? null : "2026-04-28T11:00:00.000Z",
      wormAuditRef: `worm-ledger:475:runbook-version-approval:${item.runbookId}`,
    }),
  );

  const roleResponsibilityMatrixRows = allRoleIds.map((roleId) => {
    const assignedModules = modulesForRole(roleId);
    const entryRefs = competencyEntries
      .filter((entry) => entry.roleId === roleId && assignedModules.includes(entry.moduleId))
      .map((entry) => entry.evidenceEntryId);
    const hasMissingEvidence = competencyEntries.some(
      (entry) => entry.roleId === roleId && entry.evidenceState !== "exact",
    );
    const roleBlockers =
      roleId === "supplier_contact" && phase7Deferred
        ? ["constraint:475:phase7-channel-deferred"]
        : hasMissingEvidence
          ? ["blocker:475:competency-evidence-not-exact"]
          : [];
    const responsibility: Record<LaunchRoleId, string> = {
      clinician: "Human clinical decision and assistive output approval",
      care_navigator: "Patient support routing and safe handoff wording",
      admin: "Administrative queue support and channel scripts",
      hub_operator: "Network coordination support and transfer acceptance",
      pharmacist: "Pharmacy exception review and assistive-seeded content check",
      support_analyst: "Support ticket triage, replay, handoff, and escalation",
      governance_admin: "Evidence pack, cadence, and scope-safe governance records",
      clinical_safety_officer: "Clinical risk, hazard, and assistive incident ownership",
      security_privacy_owner: "Security, privacy, redaction, and DSPT-linked training",
      incident_commander: "Incident command, out-of-hours rota, and near-miss review",
      service_owner: "BAU acceptance and launch operating model ownership",
      release_manager: "Release tuple, rollback, and migration support governance",
      supplier_contact: "NHS App supplier liaison while channel remains deferred",
    };
    const escalationTriggers = escalationPaths
      .filter((pathItem) =>
        roleId === "supplier_contact"
          ? pathItem.escalationPathId.includes("nhs_app")
          : pathItem.primaryOwner === roleId ||
            pathItem.secondaryOwner === roleId ||
            pathItem.outOfHoursOwner?.includes(roleId),
      )
      .flatMap((pathItem) => pathItem.escalationTriggers.slice(0, 2));
    return roleAssignment({
      roleId,
      roleLabel: titleCaseRole(roleId),
      owner: roleId,
      responsibilityRibbon: responsibility[roleId],
      launchTasks: [
        `Attend role-specific launch briefing for ${titleCaseRole(roleId)}.`,
        "Use only current release/runtime tuple evidence.",
        "Record blockers through WORM-linked readiness evidence.",
      ],
      supportDecisions:
        roleId === "clinician" || roleId === "clinical_safety_officer"
          ? ["Decide whether clinical safety escalation is required.", "Reject assistive output if review evidence is not current."]
          : roleId === "support_analyst"
            ? ["Keep support action read-only when lineage or lease evidence is stale.", "Escalate unowned ticket before accept-by deadline."]
            : ["Escalate outside role boundary instead of making local completion claims."],
      escalationTriggers:
        escalationTriggers.length > 0
          ? escalationTriggers
          : [`${titleCaseRole(roleId)} must escalate any launch blocker outside role authority.`],
      assistiveResponsibilities: assignedModules.includes(moduleIds.assistive)
        ? [
            "Review, revise, and approve assistive outputs before use.",
            "Treat model output as advisory only.",
          ]
        : ["Escalate assistive-output questions to trained clinical or governance owner."],
      channelResponsibilities: assignedModules.includes(moduleIds.channel)
        ? [
            "Tell staff and patients that NHS App channel remains deferred for this release.",
            "Prepare monthly data and journey-change evidence without enabling jump-off routes.",
          ]
        : ["Do not claim NHS App is live unless channel activation evidence is published."],
      prohibitedActions: [
        "Mark training complete without exact competency evidence.",
        "Use superseded release tuple runbooks.",
        "Create local sign-off outside WORM-linked evidence.",
      ],
      trainingModuleRefs: assignedModules,
      competencyEvidenceRefs: entryRefs,
      escalationPathRefs: escalationPaths
        .filter((pathItem) => pathItem.primaryOwner === roleId || pathItem.secondaryOwner === roleId)
        .map((pathItem) => pathItem.escalationPathId),
      tenantScope,
      cohortScope,
      channelScope,
      releaseCandidateRef,
      runtimePublicationBundleRef,
      state: hasMissingEvidence ? "blocked" : roleBlockers.length > 0 ? "complete_with_constraints" : "complete",
      blockerRefs: roleBlockers,
      sourceRefs: [
        "prompt/475.md#Implementation algorithm",
        "blueprint/phase-9-the-assurance-ledger.md#9I",
      ],
      wormAuditRef: `worm-ledger:475:role-responsibility:${roleId}`,
    });
  });

  const governanceEvents = [
    cadenceEvent({
      cadenceEventId: "gce_475_daily_launch_huddle",
      title: "Daily launch and support huddle",
      cadence: "daily during launch window",
      nextOccurrence: "2026-04-29T09:15:00.000Z",
      owner: "service_owner",
      requiredRoleRefs: ["service_owner", "support_analyst", "incident_commander"],
      evidenceRefs: ["data/bau/475_support_escalation_paths.json"],
      wormAuditRef: "worm-ledger:475:cadence:daily-launch-huddle",
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9I"],
    }),
    cadenceEvent({
      cadenceEventId: "gce_475_weekly_clinical_safety_review",
      title: "Weekly clinical safety and assistive review",
      cadence: "weekly",
      nextOccurrence: "2026-05-05T14:00:00.000Z",
      owner: "clinical_safety_officer",
      requiredRoleRefs: ["clinical_safety_officer", "clinician", "governance_admin"],
      evidenceRefs: ["AssistiveReviewResponsibilityNotice:475", "ClinicalSafetyEscalationSettlement:475:launch"],
      wormAuditRef: "worm-ledger:475:cadence:clinical-safety-review",
      state: shape.clinicalSafetyEvidenceState === "missing" ? "blocked" : "complete",
      blockerRefs:
        shape.clinicalSafetyEvidenceState === "missing"
          ? ["blocker:475:clinical-safety-owner-competency-missing"]
          : [],
      sourceRefs: ["blueprint/phase-8-the-assistive-layer.md#training"],
    }),
    cadenceEvent({
      cadenceEventId: "gce_475_monthly_assurance_pack",
      title: "Monthly assurance pack and conformance review",
      cadence: "monthly",
      nextOccurrence: "2026-05-28T10:00:00.000Z",
      owner: "governance_admin",
      requiredRoleRefs: ["governance_admin", "service_owner", "security_privacy_owner"],
      evidenceRefs: ["data/conformance/473_master_scorecard_after_phase7_reconciliation.json"],
      wormAuditRef: "worm-ledger:475:cadence:monthly-assurance-pack",
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#monthly-assurance-pack-generation"],
    }),
    cadenceEvent({
      cadenceEventId: "gce_475_monthly_nhs_app_data_pack_ready",
      title: "NHS App monthly data pack readiness",
      cadence: "monthly after future channel activation",
      nextOccurrence: "deferred-until-channel-activation",
      owner: "service_owner",
      requiredRoleRefs: ["service_owner", "supplier_contact", "governance_admin"],
      evidenceRefs: ["ChannelSupportResponsibilityNotice:475", manifestVersionRef],
      wormAuditRef: "worm-ledger:475:cadence:nhs-app-monthly-data-pack",
      state: "complete_with_constraints",
      blockerRefs: phase7Deferred ? ["constraint:475:phase7-channel-deferred"] : [],
      sourceRefs: ["blueprint/phase-7-inside-the-nhs-app.md#7I"],
    }),
    cadenceEvent({
      cadenceEventId: "gce_475_quarterly_rehearsal",
      title: "Quarterly incident and rollback rehearsal",
      cadence: "quarterly",
      nextOccurrence: "2026-07-28T13:00:00.000Z",
      owner: "incident_commander",
      requiredRoleRefs: ["incident_commander", "release_manager", "support_analyst"],
      evidenceRefs: ["data/bau/475_runbook_bundle_manifest.json"],
      wormAuditRef: "worm-ledger:475:cadence:quarterly-rehearsal",
      state: "complete",
      blockerRefs: [],
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9I"],
    }),
    cadenceEvent({
      cadenceEventId: "gce_475_annual_nhs_app_assurance_review",
      title: "Annual NHS App and NHS login assurance review readiness",
      cadence: "annual after future channel activation",
      nextOccurrence: "deferred-until-channel-activation",
      owner: "service_owner",
      requiredRoleRefs: ["service_owner", "supplier_contact", "governance_admin"],
      evidenceRefs: ["ChannelSupportResponsibilityNotice:475"],
      wormAuditRef: "worm-ledger:475:cadence:annual-nhs-app-assurance",
      state: "complete_with_constraints",
      blockerRefs: phase7Deferred ? ["constraint:475:phase7-channel-deferred"] : [],
      sourceRefs: ["blueprint/phase-7-inside-the-nhs-app.md#7I"],
    }),
  ];

  const roleMatrixState: ReadinessState = roleResponsibilityMatrixRows.some(
    (role) => role.state === "blocked",
  )
    ? "blocked"
    : roleResponsibilityMatrixRows.some((role) => role.state === "complete_with_constraints")
      ? "complete_with_constraints"
      : "complete";
  const runbookState: ReadinessState = runbooks.some((item) => item.state === "blocked")
    ? "blocked"
    : runbooks.some((item) => item.state === "complete_with_constraints")
      ? "complete_with_constraints"
      : "complete";
  const escalationState: ReadinessState = escalationPaths.some((item) => item.state === "blocked")
    ? "blocked"
    : escalationPaths.some((item) => item.state === "complete_with_constraints")
      ? "complete_with_constraints"
      : "complete";
  const operatingReadinessState: ReadinessState =
    shape.readinessState === "blocked" || roleMatrixState === "blocked" || runbookState === "blocked" || escalationState === "blocked"
      ? "blocked"
      : phase7Deferred || scenarioState === "complete_with_constraints"
        ? "complete_with_constraints"
        : "complete";

  const roleResponsibilityMatrix = withHash(
    {
      schemaVersion: SCHEMA_VERSION,
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      matrixId: "rrm_475_launch_role_responsibility_matrix",
      releaseRef,
      tenantScope,
      cohortScope,
      channelScope,
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      readinessState: roleMatrixState,
      launchRoles: roleResponsibilityMatrixRows,
      edgeCaseGuards: [
        withHash(
          {
            edgeCaseId: "support_training_complete_clinical_safety_owner_missing",
            expectedState: "blocked",
            guard:
              "Support analyst completion cannot satisfy clinical safety officer competency for assistive or clinical-risk operations.",
            evidenceRefs: ["tm_475_clinical_safety_dcb0160_operations"],
          },
          "guardHash",
        ),
        withHash(
          {
            edgeCaseId: "channel_training_claims_nhs_app_live_while_deferred",
            expectedState: "blocked",
            guard:
              "Channel support training must say NHS App remains deferred until the Phase 7 channel enablement artifact is exact.",
            evidenceRefs: ["data/conformance/473_phase7_channel_readiness_reconciliation.json"],
          },
          "guardHash",
        ),
      ],
      sourceFileHashes: sourceHashes,
      sourceRefs,
    },
    "matrixHash",
  );

  const audienceBindings = modules.flatMap((trainingModule) =>
    trainingModule.audienceRoleRefs.map((roleId) =>
      withHash(
        {
          bindingId: `tab_475_${roleId}_${trainingModule.moduleId.replace("tm_475_", "")}`,
          roleId,
          moduleId: trainingModule.moduleId,
          requiredBeforeLaunch: true,
          competencyEvidenceRequirement: trainingModule.competencyEvidenceRequirement,
          tenantScope,
          cohortScope,
          channelScope,
          state:
            trainingModule.moduleId === moduleIds.channel && phase7Deferred
              ? "complete_with_constraints"
              : "complete",
        },
        "bindingHash",
      ),
    ),
  );

  const assistiveReviewResponsibilityNotice = withHash(
    {
      noticeId: "AssistiveReviewResponsibilityNotice:475",
      title: "Assistive outputs require human review",
      requiredMessage:
        "Staff must review, revise, and approve assistive outputs. No model output is final authority.",
      owner: "clinical_safety_officer",
      applicableModuleRef: moduleIds.assistive,
      state: "complete",
      prohibitedClaims: ["model output is final", "assistive acceptance completes the workflow"],
      sourceRefs: ["blueprint/phase-8-the-assistive-layer.md#HumanApprovalGateAssessment"],
    },
    "noticeHash",
  );

  const channelSupportResponsibilityNotice = withHash(
    {
      noticeId: "ChannelSupportResponsibilityNotice:475",
      title: "NHS App channel remains deferred",
      requiredMessage:
        "The NHS App channel is not live for this release. Support teams prepare monthly data, incident reporting, and journey-change evidence without enabling jump-off routes.",
      owner: "service_owner",
      manifestVersionRef,
      phase7ReadinessState: phase7.readinessPredicate?.state ?? "unknown",
      channelActivationPermitted: false,
      state: "complete_with_constraints",
      prohibitedClaims: ["NHS App is live", "jump-off routes are enabled"],
      sourceRefs: ["blueprint/phase-7-inside-the-nhs-app.md#7I"],
    },
    "noticeHash",
  );

  const trainingCurriculumManifest = withHash(
    {
      schemaVersion: SCHEMA_VERSION,
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      manifestId: "tcm_475_launch_training_curriculum",
      releaseRef,
      tenantScope,
      cohortScope,
      channelScope,
      readinessState:
        shape.clinicalSafetyEvidenceState === "missing" ? "blocked" : "complete_with_constraints",
      modules,
      audienceBindings,
      assistiveReviewResponsibilityNotice,
      channelSupportResponsibilityNotice,
      edgeCaseGuards: [
        withHash(
          {
            edgeCaseId: "assistive_training_omits_human_review_responsibility",
            expectedState: "blocked",
            guard:
              "Assistive training is invalid unless it explicitly requires staff to review, revise, and approve outputs and rejects model final authority.",
            requiredFragments: ["review", "revise", "approve", "No model output is final authority"],
          },
          "guardHash",
        ),
        withHash(
          {
            edgeCaseId: "non_html_training_lacks_accessible_alternative",
            expectedState: "blocked",
            guard:
              "Every non-HTML module must publish an accessible alternative and artifact presentation contract.",
            requiredRefs: ["artifactPresentationContractRef", "accessibleFormats"],
          },
          "guardHash",
        ),
      ],
      sourceFileHashes: sourceHashes,
      sourceRefs,
    },
    "manifestHash",
  );

  const competencyEvidenceLedger = withHash(
    {
      schemaVersion: SCHEMA_VERSION,
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      ledgerId: "cel_475_competency_evidence_ledger",
      releaseRef,
      tenantScope,
      cohortScope,
      channelScope,
      releaseCandidateRef,
      runtimePublicationBundleRef,
      readinessState: competencyEntries.some((entry) => entry.evidenceState !== "exact")
        ? "blocked"
        : "complete",
      exactEvidenceCount: competencyEntries.filter((entry) => entry.evidenceState === "exact").length,
      entries: competencyEntries,
      scenarioExamples: [
        withHash(
          {
            scenarioId: "support_complete_clinical_safety_owner_missing",
            expectedState: "blocked",
            supportAnalystEvidenceState: "exact",
            clinicalSafetyOfficerEvidenceState: "missing",
            blockerRefs: ["blocker:475:clinical-safety-owner-competency-missing"],
          },
          "scenarioHash",
        ),
      ],
      sourceFileHashes: sourceHashes,
      sourceRefs,
    },
    "ledgerHash",
  );

  const runbookBundleManifest = withHash(
    {
      schemaVersion: SCHEMA_VERSION,
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      runbookBundleId: "rbb_475_launch_bau_runbook_bundle",
      scope: "programme-core-release-bau",
      versionRef: `runbook-bundle:475:${releaseCandidateRef}`,
      releaseRef,
      tenantScope,
      cohortScope,
      channelScope,
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      migrationTupleHash,
      readinessState: runbookState,
      lastRehearsedAt: "2026-04-28T10:00:00.000Z",
      runbookBindingRecords: runbooks,
      runbookDrillEvidence: drillEvidence,
      runbookVersionApprovals: versionApprovals,
      edgeCaseGuards: [
        withHash(
          {
            edgeCaseId: "support_runbook_exists_without_owner_or_review_cadence",
            expectedState: "blocked",
            guard: "A support runbook with null owner or null review cadence cannot be signed off.",
            blockedExample: {
              owner: null,
              reviewCadenceDays: null,
            },
          },
          "guardHash",
        ),
        withHash(
          {
            edgeCaseId: "runbook_link_points_to_superseded_release_tuple",
            expectedState: "blocked",
            guard: "Runbook releaseCandidateRef and versionRef must match the current release tuple.",
            currentReleaseCandidateRef: releaseCandidateRef,
          },
          "guardHash",
        ),
        withHash(
          {
            edgeCaseId: "non_html_material_lacks_accessible_alternative_or_presentation_contract",
            expectedState: "blocked",
            guard:
              "Runbooks and training packs must bind ArtifactPresentationContract and an accessible alternative before completion.",
          },
          "guardHash",
        ),
      ],
      sourceFileHashes: sourceHashes,
      sourceRefs,
    },
    "bundleHash",
  );

  const governanceCadenceCalendar = withHash(
    {
      schemaVersion: SCHEMA_VERSION,
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      calendarId: "gcc_475_governance_cadence_calendar",
      releaseRef,
      tenantScope,
      cohortScope,
      channelScope,
      readinessState: governanceEvents.some((event) => event.state === "blocked")
        ? "blocked"
        : "complete_with_constraints",
      events: governanceEvents,
      sourceFileHashes: sourceHashes,
      sourceRefs,
    },
    "calendarHash",
  );

  const supportEscalationPaths = withHash(
    {
      schemaVersion: SCHEMA_VERSION,
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      escalationPathSetId: "eps_475_support_escalation_paths",
      releaseRef,
      tenantScope,
      cohortScope,
      channelScope,
      readinessState: escalationState,
      escalationPaths,
      edgeCaseGuards: [
        withHash(
          {
            edgeCaseId: "incident_escalation_path_has_out_of_hours_gap",
            expectedState: "blocked",
            guard:
              "Incident escalation cannot complete when outOfHoursOwner is null or contact validation is not complete.",
          },
          "guardHash",
        ),
      ],
      sourceFileHashes: sourceHashes,
      sourceRefs,
    },
    "escalationPathSetHash",
  );

  const clinicalOpsSupportModel = withHash(
    {
      modelId: "ClinicalOpsSupportModel:475",
      tenantScope,
      cohortScope,
      channelScope,
      supportSurfaceRefs: ["/ops/support", "/ops/conformance", "/ops/incidents"],
      governingTicketContractRefs: ["SupportTicket", "SupportLineageBinding", "SupportActionSettlement"],
      supportModelState: escalationState,
      roleRefs: allRoleIds,
      escalationPathRefs: escalationPaths.map((item) => item.escalationPathId),
      sourceRefs: ["blueprint/staff-operations-and-support-blueprint.md"],
    },
    "modelHash",
  );

  const operatingModel = withHash(
    {
      schemaVersion: SCHEMA_VERSION,
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      operatingModelId: "bau_475_operating_model",
      releaseRef,
      tenantScope,
      cohortScope,
      channelScope,
      releaseCandidateRef,
      runtimePublicationBundleRef,
      releasePublicationParityRef,
      migrationTupleHash,
      readinessState: operatingReadinessState,
      trainingCompletionState: trainingCurriculumManifest.readinessState,
      runbookBundleVersionRef: runbookBundleManifest.versionRef,
      nextRehearsalAt: "2026-07-28T13:00:00.000Z",
      bauModelHashInputRefs: [
        roleResponsibilityMatrix.matrixHash,
        trainingCurriculumManifest.manifestHash,
        competencyEvidenceLedger.ledgerHash,
        runbookBundleManifest.bundleHash,
        governanceCadenceCalendar.calendarHash,
        supportEscalationPaths.escalationPathSetHash,
      ],
      readinessBlockerRefs:
        operatingReadinessState === "blocked"
          ? [
              ...roleResponsibilityMatrixRows.flatMap((role) => role.blockerRefs),
              ...runbooks.flatMap((item) => item.blockerRefs.filter((ref) => ref.startsWith("blocker:"))),
              ...escalationPaths.flatMap((item) => item.blockerRefs),
            ]
          : [],
      readinessConstraintRefs: [
        ...(phase7Deferred ? ["constraint:475:phase7-channel-deferred"] : []),
        "constraint:475:production-release-wave-authority-not-yet-available",
      ],
      roleResponsibilityMatrixRef: "data/bau/475_role_responsibility_matrix.json",
      trainingCurriculumManifestRef: "data/bau/475_training_curriculum_manifest.json",
      competencyEvidenceLedgerRef: "data/bau/475_competency_evidence_ledger.json",
      runbookBundleManifestRef: "data/bau/475_runbook_bundle_manifest.json",
      governanceCadenceCalendarRef: "data/bau/475_governance_cadence_calendar.json",
      supportEscalationPathsRef: "data/bau/475_support_escalation_paths.json",
      clinicalOpsSupportModel,
      assistiveReviewResponsibilityNotice,
      channelSupportResponsibilityNotice,
      releaseWaveReadinessFeed: {
        feedId: "release-wave-readiness-feed:475",
        feedState: operatingReadinessState,
        consumedByFutureTasks: ["seq_476", "seq_477", "seq_482", "seq_486"],
        mayPromoteReleaseWave: false,
        reason:
          "Task 475 publishes training and BAU readiness evidence only; release-wave promotion remains owned by later authority tasks.",
      },
      privilegedMutationPolicy: {
        typedCommandHandlerRef: "BAUTrainingCompletionCommandHandler:475",
        roleAuthorizationRequired: true,
        tenantCohortChannelScopeRequired: true,
        idempotencyKeyRequired: true,
        purposeBindingRequired: true,
        injectedClockRequired: true,
        wormAuditOutputRequired: true,
        settlementRecordRef: "BAUTrainingCompletionSettlement:475",
        completionBlockedUnlessExactEvidenceAndCurrentReleaseTuple: true,
      },
      sourceFileHashes: sourceHashes,
      sourceRefs,
    },
    "operatingModelHash",
  );

  const contractSchema = withHash(
    {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://vecells.local/contracts/475_bau_training_runbooks.schema.json",
      title: "Task 475 BAU training and runbook contracts",
      type: "object",
      required: ["schemaVersion", "taskId", "generatedAt"],
      properties: {
        schemaVersion: { const: SCHEMA_VERSION },
        taskId: { const: TASK_ID },
        generatedAt: { type: "string", format: "date-time" },
        readinessState: { enum: ["complete", "complete_with_constraints", "blocked"] },
        releaseCandidateRef: { type: "string", minLength: 1 },
        runtimePublicationBundleRef: { type: "string", minLength: 1 },
        tenantScope: { type: "string", minLength: 1 },
        channelScope: { type: "string", minLength: 1 },
      },
      definitions: {
        BAUOperatingModel: {
          type: "object",
          required: [
            "operatingModelId",
            "readinessState",
            "roleResponsibilityMatrixRef",
            "trainingCurriculumManifestRef",
            "runbookBundleManifestRef",
            "operatingModelHash",
          ],
        },
        RoleResponsibilityAssignment: {
          type: "object",
          required: [
            "roleId",
            "launchTasks",
            "supportDecisions",
            "escalationTriggers",
            "assistiveResponsibilities",
            "channelResponsibilities",
            "prohibitedActions",
            "assignmentHash",
          ],
        },
        TrainingModule: {
          type: "object",
          required: [
            "moduleId",
            "audienceRoleRefs",
            "durationMinutes",
            "competencyEvidenceRequirement",
            "failureRetrainingPath",
            "artifactPresentationContractRef",
            "moduleHash",
          ],
        },
        RunbookBindingRecord: {
          type: "object",
          required: [
            "runbookId",
            "owner",
            "reviewCadenceDays",
            "releaseCandidateRef",
            "runtimePublicationBundleRef",
            "evidenceRequirementRefs",
            "rehearsalProofRef",
            "escalationPathRef",
            "bindingHash",
          ],
        },
      },
    },
    "schemaHash",
  );

  const interfaceGap = withHash(
    {
      gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_475_COMPETENCY_COMPLETION_AUTHORITY",
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      missingNativeContract:
        "No repository-native competency completion settlement contract exists for marking BAU training complete from exact evidence.",
      failClosedBridge: {
        bridgeContractRef: "BAUTrainingCompletionSettlement:475",
        privilegedMutationPermitted: false,
        releaseWavePromotionPermitted: false,
        markCompleteAllowedOnlyWhen: [
          "role authorization is current",
          "tenant, cohort, and channel scope match",
          "idempotency key is present",
          "purpose binding is present",
          "injected clock is used",
          "WORM audit output is written",
          "every required competency evidence entry is exact",
          "runbook release tuple matches the current release candidate",
        ],
      },
      sourceRefs: ["prompt/475.md#Backend architecture performance and security requirements"],
    },
    "gapHash",
  );

  const algorithmNotes = [
    "# Task 475 Algorithm Alignment Notes",
    "",
    `Generated: ${GENERATED_AT}`,
    "",
    "## Source Alignment",
    "",
    "- Phase 9 9I requires BAU runbooks, owners, on-call paths, exercises, incident paths, rollback rehearsal, and conformance-linked sign-off before BAU transfer.",
    "- Staff operations support requires support actions to stay ticket-centric, lineage-bound, policy-checked, settlement-backed, and same-shell recoverable.",
    "- Phase 8 requires staff to review, revise, and approve assistive outputs; no model output is final authority.",
    "- Phase 7 is represented as deferred for the current release; training prepares support posture, monthly data obligations, incident reporting, and journey-change governance without claiming NHS App go-live.",
    "- The accessibility contract requires plain-language action labels, focus return, table fallbacks, and accessible alternatives for non-HTML materials.",
    "",
    "## Readiness Decision",
    "",
    `The default BAU operating model is \`${operatingReadinessState}\` because core training and runbooks are complete while NHS App channel activation and release-wave promotion authority remain future constrained inputs.`,
    "",
    "## Edge Cases Covered",
    "",
    "- Support runbook without owner or review cadence blocks runbook bundle completion.",
    "- Support-only training cannot complete clinical safety owner competency.",
    "- Assistive training omitting human review responsibility is blocked.",
    "- NHS App live claims remain blocked while Phase 7 is deferred.",
    "- Out-of-hours escalation gaps block incident readiness.",
    "- Superseded release tuple runbooks block completion.",
    "- Non-HTML training materials without accessible alternatives or artifact presentation contracts are blocked.",
  ].join("\n");

  const externalReferenceNotes = withHash(
    {
      schemaVersion: SCHEMA_VERSION,
      taskId: TASK_ID,
      generatedAt: GENERATED_AT,
      references: [
        {
          referenceId: "nhs-ai-ambient-scribing-healthcare-workers",
          publisher: "NHS England Transformation Directorate",
          title: "Using AI-enabled ambient scribing products in health and care settings",
          url: "https://transform.england.nhs.uk/information-governance/guidance/using-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
          appliedTo: [
            "assistive human review responsibility",
            "staff training",
            "accuracy review and practitioner accountability",
          ],
        },
        {
          referenceId: "nhs-ai-ambient-scribing-guidance",
          publisher: "NHS England",
          title:
            "Guidance on the use of AI-enabled ambient scribing products in health and care settings",
          url: "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
          appliedTo: ["clinical safety officer route", "DPIA and DCB0160 evidence", "training staff"],
        },
        {
          referenceId: "nhs-digital-clinical-safety-assurance",
          publisher: "NHS England",
          title: "Digital clinical safety assurance",
          url: "https://www.england.nhs.uk/long-read/digital-clinical-safety-assurance/",
          appliedTo: ["clinical safety officer responsibilities", "hazard log", "clinical safety case"],
        },
        {
          referenceId: "nhs-app-web-integration",
          publisher: "NHS England Digital",
          title: "NHS App web integration",
          url: "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
          appliedTo: [
            "NHS App deferred-channel support",
            "monthly data obligations",
            "annual assurance review",
            "journey-change notice lead times",
          ],
        },
        {
          referenceId: "nhs-app-developer-guidance",
          publisher: "NHS App developer documentation",
          title: "Web Integration Guidance",
          url: "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
          appliedTo: [
            "embedded route posture",
            "SSO handoff and prompt none",
            "unsupported downloads and print behavior",
          ],
        },
        {
          referenceId: "nhs-service-manual-wcag-22",
          publisher: "NHS digital service manual",
          title: "New criteria in WCAG 2.2",
          url: "https://service-manual.nhs.uk/accessibility/new-criteria-in-wcag-2-2",
          appliedTo: ["WCAG 2.2 AA", "focus not obscured", "target size", "redundant entry"],
        },
        {
          referenceId: "nhs-service-manual-content",
          publisher: "NHS digital service manual",
          title: "Accessibility content guidance",
          url: "https://service-manual.nhs.uk/accessibility/content",
          appliedTo: ["plain language", "error summaries", "alt text", "tables"],
        },
        {
          referenceId: "nhs-dspt-b6-staff-awareness",
          publisher: "NHS England Digital",
          title: "Principle B6: Staff awareness",
          url: "https://digital.nhs.uk/cyber-and-data-security/guidance-and-assurance/strengthening-assurance-independent-assessment-and-audit-framework-guidance/objective-b---protecting-against-cyber-attack-and-data-breaches/principle-b6-staff-awareness",
          appliedTo: ["role-specific information assurance training", "staff incident reporting awareness"],
        },
      ],
    },
    "referenceNotesHash",
  );

  return {
    operatingModel,
    roleResponsibilityMatrix,
    trainingCurriculumManifest,
    competencyEvidenceLedger,
    runbookBundleManifest,
    governanceCadenceCalendar,
    supportEscalationPaths,
    contractSchema,
    interfaceGap,
    algorithmNotes,
    externalReferenceNotes,
  };
}

function writeDocs(artifacts: BAUArtifacts): void {
  const model = artifacts.operatingModel;
  const roles = artifacts.roleResponsibilityMatrix.launchRoles as RoleResponsibilityAssignment[];
  const modules = artifacts.trainingCurriculumManifest.modules as TrainingModule[];
  const runbooks = artifacts.runbookBundleManifest.runbookBindingRecords as RunbookBindingRecord[];
  const cadence = artifacts.governanceCadenceCalendar.events as GovernanceCadenceEvent[];

  writeText(
    "docs/runbooks/475_bau_operating_model.md",
    [
      "# Task 475 BAU Operating Model",
      "",
      `Readiness state: \`${model.readinessState}\``,
      `BAU model hash: \`${model.operatingModelHash}\``,
      `Release candidate: \`${model.releaseCandidateRef}\``,
      `Runtime publication bundle: \`${model.runtimePublicationBundleRef}\``,
      "",
      "## Operating Rule",
      "",
      "BAU readiness evidence may feed future release-wave decisions, but it cannot promote a release wave by itself. Training completion, runbook ownership, escalation paths, governance cadence, and WORM-linked evidence must all remain current.",
      "",
      "## Launch Roles",
      "",
      "| Role | Responsibility | State | Blockers |",
      "| --- | --- | --- | --- |",
      ...roles.map(
        (role) =>
          `| ${role.roleLabel} | ${role.responsibilityRibbon} | ${role.state} | ${role.blockerRefs.join(", ") || "None"} |`,
      ),
      "",
      "## Runbooks",
      "",
      "| Runbook | Owner | Review cadence | State | Escalation path |",
      "| --- | --- | --- | --- | --- |",
      ...runbooks.map(
        (runbook) =>
          `| ${runbook.title} | ${runbook.owner ?? "Missing"} | ${runbook.reviewCadenceDays ?? "Missing"} days | ${runbook.state} | ${runbook.escalationPathRef} |`,
      ),
      "",
      "## Governance Cadence",
      "",
      "| Event | Cadence | Owner | State |",
      "| --- | --- | --- | --- |",
      ...cadence.map((event) => `| ${event.title} | ${event.cadence} | ${event.owner} | ${event.state} |`),
    ].join("\n"),
  );

  writeText(
    "docs/training/475_launch_training_pack.md",
    [
      "# Task 475 Launch Training Pack",
      "",
      "This pack is the role-based launch curriculum for clinical operations, support, service owners, governance admins, and supplier contacts.",
      "",
      "| Module | Audience | Duration | Evidence | Retraining path |",
      "| --- | --- | ---: | --- | --- |",
      ...modules.map(
        (trainingModule) =>
          `| ${trainingModule.title} | ${trainingModule.audienceRoleRefs.map(titleCaseRole).join(", ")} | ${trainingModule.durationMinutes} | ${trainingModule.competencyEvidenceRequirement} | ${trainingModule.failureRetrainingPath} |`,
      ),
      "",
      "Every module publishes an artifact presentation contract and accessible formats. Non-HTML material without an accessible alternative is not complete.",
    ].join("\n"),
  );

  writeText(
    "docs/training/475_assistive_layer_human_review_training.md",
    [
      "# Task 475 Assistive Layer Human Review Training",
      "",
      "Staff must review, revise, and approve assistive outputs before the output affects a record, message, decision, or workflow.",
      "",
      "No model output is final authority. Local acceptance of an assistive suggestion is not workflow completion. Only the final human artifact and the authoritative downstream settlement can complete the work.",
      "",
      "Training evidence requires a synthetic assistive output review, a recorded correction or rejection where needed, and a WORM-linked competency evidence entry.",
    ].join("\n"),
  );

  writeText(
    "docs/training/475_nhs_app_channel_support_training.md",
    [
      "# Task 475 NHS App Channel Support Training",
      "",
      "The NHS App channel remains deferred for the current release. Staff must not tell patients, practices, suppliers, or governance reviewers that NHS App jump-off routes are live.",
      "",
      "Support training covers embedded route posture, unsupported browser behavior, incident reporting, future monthly data packs, annual assurance review readiness, and the journey-change notice process.",
      "",
      "If an unsupported NHS App behavior is reported before activation, support uses the deferred-channel escalation path and preserves the current core-web journey guidance.",
    ].join("\n"),
  );
}

export function write475BAUArtifacts(): BAUArtifacts {
  const artifacts = build475BAUArtifacts("complete_with_constraints");
  writeJson("data/bau/475_operating_model.json", artifacts.operatingModel);
  writeJson("data/bau/475_role_responsibility_matrix.json", artifacts.roleResponsibilityMatrix);
  writeJson("data/bau/475_training_curriculum_manifest.json", artifacts.trainingCurriculumManifest);
  writeJson("data/bau/475_competency_evidence_ledger.json", artifacts.competencyEvidenceLedger);
  writeJson("data/bau/475_runbook_bundle_manifest.json", artifacts.runbookBundleManifest);
  writeJson("data/bau/475_governance_cadence_calendar.json", artifacts.governanceCadenceCalendar);
  writeJson("data/bau/475_support_escalation_paths.json", artifacts.supportEscalationPaths);
  writeJson("data/contracts/475_bau_training_runbooks.schema.json", artifacts.contractSchema);
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_475_COMPETENCY_COMPLETION_AUTHORITY.json",
    artifacts.interfaceGap,
  );
  writeText("data/analysis/475_algorithm_alignment_notes.md", artifacts.algorithmNotes);
  writeJson("data/analysis/475_external_reference_notes.json", artifacts.externalReferenceNotes);
  writeDocs(artifacts);
  return artifacts;
}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  const artifacts = write475BAUArtifacts();
  console.log(
    `Task 475 BAU artifacts written: ${artifacts.operatingModel.operatingModelHash}`,
  );
}
