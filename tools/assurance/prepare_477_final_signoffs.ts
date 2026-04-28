import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

const TASK_ID = "seq_477";
const SCHEMA_VERSION = "477.programme.final-launch-signoff.v1";
const FIXED_NOW = "2026-04-28T00:00:00.000Z";
const DEFAULT_SCENARIO: Signoff477Scenario = "ready_with_constraints";

export type Signoff477Scenario =
  | "ready"
  | "ready_with_constraints"
  | "blocked"
  | "expired_signoff"
  | "missing_signoff"
  | "tuple_mismatch"
  | "exception_blocking";

type Json = null | boolean | number | string | Json[] | { readonly [key: string]: Json };
type JsonRecord = Record<string, unknown>;

type ExceptionClassification =
  | "launch-blocking"
  | "launch-with-constraint"
  | "BAU-follow-up"
  | "not-applicable";

type LaneId =
  | "security"
  | "clinical_safety"
  | "privacy_records"
  | "regulatory_dtac"
  | "accessibility_usability";

interface ReleaseBinding {
  readonly releaseRef: string;
  readonly releaseCandidateRef: string;
  readonly releaseApprovalFreezeRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly releaseWatchTupleRef: string;
  readonly releaseWatchTupleHash: string;
  readonly waveManifestRef: string;
  readonly waveManifestHash: string;
  readonly migrationPlanRef: string;
  readonly migrationTupleHash: string;
  readonly tenantScope: string;
  readonly tenantCohortScope: string;
  readonly channelScope: string;
  readonly assistiveScope: string;
  readonly routeFamilies: readonly string[];
}

export interface SignoffAuthority {
  readonly recordType: "SignoffAuthority";
  readonly authorityId: string;
  readonly laneId: LaneId;
  readonly laneLabel: string;
  readonly roleRef: string;
  readonly roleDisplayName: string;
  readonly signerRef: string;
  readonly signerDisplayName: string;
  readonly independenceGroup: string;
  readonly signoffState:
    | "signed"
    | "signed_with_constraints"
    | "missing"
    | "expired"
    | "tuple_mismatch"
    | "blocked";
  readonly signedAt: string | null;
  readonly expiresAt: string | null;
  readonly authoritySourceRefs: readonly string[];
  readonly evidenceBindingRefs: readonly string[];
  readonly releaseBinding: ReleaseBinding;
  readonly authorityTupleHash: string;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface SignoffEvidenceBinding {
  readonly recordType: "SignoffEvidenceBinding";
  readonly evidenceBindingId: string;
  readonly laneId: LaneId | "supplier_dependencies";
  readonly evidenceClass: string;
  readonly evidenceTitle: string;
  readonly evidenceState: "current" | "current_with_constraint" | "blocked" | "superseded";
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly releaseBinding: ReleaseBinding;
  readonly evidenceHash: string;
  readonly recordHash: string;
}

export interface SignoffException {
  readonly recordType: "SignoffException";
  readonly exceptionId: string;
  readonly title: string;
  readonly laneId: LaneId | "supplier_dependencies" | "downstream_launch_authority";
  readonly declaredClassification: ExceptionClassification;
  readonly sourceAlgorithmClassification: ExceptionClassification;
  readonly effectiveClassification: ExceptionClassification;
  readonly ownerRoleRef: string;
  readonly ownerDisplayName: string;
  readonly expiresAt: string | null;
  readonly scopeAppliesTo: string;
  readonly launchScopeApplicability: "in_scope" | "deferred_scope" | "not_in_current_wave";
  readonly state: "open" | "deferred" | "waived_with_expiry" | "closed" | "blocked";
  readonly sourceRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly blockerRefs: readonly string[];
  readonly releaseBinding: ReleaseBinding;
  readonly wormAuditRef: string;
  readonly recordHash: string;
}

export interface FinalLaunchSignoffRegister {
  readonly schemaVersion: typeof SCHEMA_VERSION;
  readonly taskId: typeof TASK_ID;
  readonly generatedAt: typeof FIXED_NOW;
  readonly recordType: "FinalLaunchSignoffRegister";
  readonly registerId: string;
  readonly scenarioState: Signoff477Scenario;
  readonly overallSignoffState:
    | "ready"
    | "ready_with_constraints"
    | "blocked"
    | "expired_signoff"
    | "missing_signoff"
    | "tuple_mismatch";
  readonly launchApprovalPermitted: boolean;
  readonly signoffReviewPermitted: boolean;
  readonly commandSettlementCurrent: boolean;
  readonly sourceRefs: readonly string[];
  readonly releaseBinding: ReleaseBinding;
  readonly authorities: readonly SignoffAuthority[];
  readonly evidenceBindings: readonly SignoffEvidenceBinding[];
  readonly activeExceptions: readonly SignoffException[];
  readonly launchDecision: {
    readonly releaseCandidateRef: string;
    readonly runtimePublicationBundleRef: string;
    readonly waveManifestRef: string;
    readonly signoffBlockerCount: number;
    readonly constrainedLaunchCount: number;
    readonly downstreamLaunchBlockerCount: number;
    readonly backendCommandSettlementState: "current" | "pending";
    readonly nextSafeAction: string;
  };
  readonly typedRecordCoverage: readonly string[];
  readonly edgeCaseRegressionFixtures: readonly JsonRecord[];
  readonly commandSettlementAuthorityRef: string;
  readonly recordHash: string;
}

export interface Signoff477Artifacts {
  readonly finalSignoffRegister: FinalLaunchSignoffRegister;
  readonly securityAssuranceMatrix: JsonRecord;
  readonly clinicalSafetyCaseDelta: JsonRecord;
  readonly privacyDpiaAndRecordsMatrix: JsonRecord;
  readonly regulatoryAndDtacEvidenceMatrix: JsonRecord;
  readonly accessibilityAndUsabilityAttestation: JsonRecord;
  readonly supplierAndDependencySignoffRegister: JsonRecord;
  readonly openExceptionRegister: JsonRecord;
  readonly schema: JsonRecord;
  readonly commandSettlementGap: JsonRecord;
  readonly algorithmAlignmentNotes: string;
  readonly externalReferenceNotes: JsonRecord;
  readonly finalLaunchSignoffPack: string;
}

const sourceRefs = [
  "prompt/477.md",
  "prompt/shared_operating_contract_473_to_489.md",
  "blueprint/phase-9-the-assurance-ledger.md",
  "blueprint/platform-runtime-and-release-blueprint.md",
  "blueprint/phase-0-the-foundation-protocol.md",
  "blueprint/phase-8-the-assistive-layer.md",
  "blueprint/phase-7-inside-the-nhs-app.md",
  "blueprint/accessibility-and-content-system-contract.md",
  "data/release/476_release_wave_manifest.json",
  "data/release/476_tenant_cohort_rollout_plan.json",
  "data/migration/474_cutover_runbook.json",
  "data/bau/475_operating_model.json",
  "data/evidence/471_phase9_exit_gate_decision.json",
] as const;

const typedRecordCoverage = [
  "FinalLaunchSignoffRegister",
  "SignoffAuthority",
  "SignoffEvidenceBinding",
  "SignoffException",
  "ClinicalSafetyCaseDelta",
  "HazardLogDeltaBinding",
  "DeploymentSafetyAcceptance",
  "AssistiveClinicalSafetyApproval",
  "PrivacyDPIAClosureRecord",
  "DataProtectionImpactException",
  "RecordsRetentionApproval",
  "LegalHoldReadinessProof",
  "SecurityAssuranceEvidenceRow",
  "PenTestClosureBinding",
  "VulnerabilityExceptionWaiver",
  "SupplyChainAttestation",
] as const;

const downstreamLaunchBlockers = [
  "blocker:477:external-dependency-operational-readiness-pending-seq-478",
  "blocker:477:production-like-dress-rehearsal-pending-seq-479",
  "blocker:477:uat-visual-regression-pending-seq-480",
  "blocker:477:dr-go-live-smoke-pending-seq-481",
  "blocker:477:promotion-settlement-pending-seq-482",
  "blocker:477:release-watch-observation-pending-seq-483",
] as const;

function canonicalize(value: unknown): Json {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((entry) => canonicalize(entry));
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(object)
        .sort()
        .map((key) => [key, canonicalize(object[key])]),
    ) as Json;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return null;
}

function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value), null, 2);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalStringify(value)).digest("hex");
}

function hashRef(label: string, value: unknown): string {
  return `${label}:${sha256(value).slice(0, 16)}`;
}

function recordWithHash<T extends JsonRecord>(record: T): T & { readonly recordHash: string } {
  const { recordHash: _recordHash, ...rest } = record;
  return { ...record, recordHash: sha256(rest) };
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  return JSON.parse(fs.readFileSync(absolutePath, "utf8")) as T;
}

function writeJson(relativePath: string, value: unknown): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${canonicalStringify(value)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value.endsWith("\n") ? value : `${value}\n`);
}

function buildReleaseBinding(): ReleaseBinding {
  const manifest = readJson<Record<string, any>>("data/release/476_release_wave_manifest.json", {});
  const wave1 = (manifest.deploymentWaves as any[] | undefined)?.find(
    (wave) => wave.waveId === "wave_476_1_core_web_canary",
  );
  const fallbackRoutes = ["patient_request_start", "patient_status", "staff_workspace", "ops_hub"];
  const tenantCohortScope = wave1?.tenantCohortRef ?? "wtc_476_wave1_core_web_smallest_safe";
  const channelScope = wave1?.channelScopeRef ?? "wcs_476_wave1_core_web_only";
  const assistiveScope = wave1?.assistiveScopeRef ?? "was_476_wave1_assistive_shadow_only";
  return {
    releaseRef:
      manifest.releaseRef ?? "release:programme-core-baseline:phase0-6-phase8-9:2026-04-28",
    releaseCandidateRef: manifest.releaseCandidateRef ?? "RC_LOCAL_V1",
    releaseApprovalFreezeRef: manifest.releaseApprovalFreezeRef ?? "RAF_LOCAL_V1",
    runtimePublicationBundleRef:
      manifest.runtimePublicationBundleRef ?? "rpb::local::authoritative",
    releasePublicationParityRef:
      manifest.releasePublicationParityRef ?? "rpp::local::authoritative",
    releaseWatchTupleRef: manifest.releaseWatchTupleRef ?? "RWT_LOCAL_V1",
    releaseWatchTupleHash: manifest.releaseWatchTupleHash ?? sha256("RWT_LOCAL_V1"),
    waveManifestRef: manifest.manifestId ?? "prwm_476_rc_local_v1",
    waveManifestHash: sha256(manifest.manifestId ? manifest : "prwm_476_rc_local_v1"),
    migrationPlanRef: "data/migration/474_cutover_runbook.json",
    migrationTupleHash:
      manifest.migrationTupleHash ?? sha256(readJson("data/migration/474_cutover_runbook.json", {})),
    tenantScope: manifest.tenantScope ?? "tenant-demo-gp:programme-core-release",
    tenantCohortScope,
    channelScope,
    assistiveScope,
    routeFamilies: wave1?.routeFamilies ?? fallbackRoutes,
  };
}

function bindingWithTuple(
  releaseBinding: ReleaseBinding,
  overrides: Partial<ReleaseBinding> = {},
): ReleaseBinding {
  return { ...releaseBinding, ...overrides };
}

function makeEvidenceBinding(input: Omit<SignoffEvidenceBinding, "recordType" | "evidenceHash" | "recordHash">) {
  const evidenceHash = hashRef(input.evidenceBindingId, {
    evidenceRefs: input.evidenceRefs,
    releaseBinding: input.releaseBinding,
    sourceRefs: input.sourceRefs,
    state: input.evidenceState,
  });
  return recordWithHash({
    ...input,
    recordType: "SignoffEvidenceBinding" as const,
    evidenceHash,
  });
}

function baseEvidenceBindings(releaseBinding: ReleaseBinding): readonly SignoffEvidenceBinding[] {
  return [
    makeEvidenceBinding({
      evidenceBindingId: "seb_477_security_runtime_supply_chain",
      laneId: "security",
      evidenceClass: "runtime-image-sbom-secrets-infra-monitoring",
      evidenceTitle: "Runtime image, SBOM, secrets, infrastructure and monitoring assurance",
      evidenceState: "current",
      evidenceRefs: [
        "data/evidence/470_full_regression_and_defensive_security_results.json",
        "data/release/release_candidate_tuple.json",
        "data/analysis/runtime_topology_manifest.json",
        "data/analysis/telemetry_redaction_policy.json",
      ],
      sourceRefs: [
        "blueprint/platform-runtime-and-release-blueprint.md#Gate 3",
        "blueprint/phase-9-the-assurance-ledger.md#signoffState",
      ],
      releaseBinding,
    }),
    makeEvidenceBinding({
      evidenceBindingId: "seb_477_clinical_core_web_dcb0129",
      laneId: "clinical_safety",
      evidenceClass: "dcb0129-dcb0160-hazard-delta",
      evidenceTitle: "Clinical safety case delta for Wave 1 core web and shadow assistive posture",
      evidenceState: "current_with_constraint",
      evidenceRefs: [
        "data/assurance/dcb0129_hazard_register.json",
        "data/assurance/clinical_signoff_gate_requirements.json",
        "data/release/476_tenant_cohort_rollout_plan.json",
      ],
      sourceRefs: [
        "blueprint/phase-8-the-assistive-layer.md#AssistiveRolloutSliceContract",
        "blueprint/phase-9-the-assurance-ledger.md#BAUReadinessPack",
      ],
      releaseBinding,
    }),
    makeEvidenceBinding({
      evidenceBindingId: "seb_477_privacy_dpia_records",
      laneId: "privacy_records",
      evidenceClass: "dpia-records-retention-legal-hold",
      evidenceTitle: "DPIA closure, records retention and legal-hold readiness",
      evidenceState: "current",
      evidenceRefs: [
        "data/assurance/privacy_data_flow_inventory.json",
        "data/assurance/privacy_control_traceability.json",
        "data/evidence/467_retention_legal_hold_worm_replay_results.json",
      ],
      sourceRefs: [
        "blueprint/phase-0-the-foundation-protocol.md#privacy controls",
        "blueprint/phase-9-the-assurance-ledger.md#records lifecycle",
      ],
      releaseBinding,
    }),
    makeEvidenceBinding({
      evidenceBindingId: "seb_477_regulatory_dtac_core_web",
      laneId: "regulatory_dtac",
      evidenceClass: "dtac-dspt-scal-channel",
      evidenceTitle: "DTAC, DSPT and channel assurance matrix for current release candidate",
      evidenceState: "current_with_constraint",
      evidenceRefs: [
        "data/assurance/dspt_control_matrix.csv",
        "data/assurance/dspt_evidence_catalog.json",
        "data/release/476_tenant_cohort_rollout_plan.json",
      ],
      sourceRefs: [
        "blueprint/phase-7-inside-the-nhs-app.md#IntegrationEvidencePack",
        "blueprint/phase-9-the-assurance-ledger.md#standards map",
      ],
      releaseBinding,
    }),
    makeEvidenceBinding({
      evidenceBindingId: "seb_477_accessibility_mobile_embedded",
      laneId: "accessibility_usability",
      evidenceClass: "wcag-usability-route-profile-coverage",
      evidenceTitle: "Accessibility and usability attestation across route profiles and fallbacks",
      evidenceState: "current_with_constraint",
      evidenceRefs: [
        "data/conformance/473_master_scorecard_after_phase7_reconciliation.json",
        "data/evidence/470_full_regression_and_defensive_security_results.json",
      ],
      sourceRefs: [
        "blueprint/accessibility-and-content-system-contract.md#AccessibilitySemanticCoverageProfile",
        "blueprint/phase-7-inside-the-nhs-app.md#channel release freeze",
      ],
      releaseBinding,
    }),
    makeEvidenceBinding({
      evidenceBindingId: "seb_477_supplier_dependency_scope",
      laneId: "supplier_dependencies",
      evidenceClass: "supplier-dependency-tenant-scope-attestation",
      evidenceTitle: "Supplier and dependency signoff for exact tenant and runtime scope",
      evidenceState: "current",
      evidenceRefs: [
        "data/analysis/external_assurance_obligations.csv",
        "data/release/476_release_wave_manifest.json",
      ],
      sourceRefs: [
        "blueprint/platform-runtime-and-release-blueprint.md#supply-chain pipeline",
        "blueprint/phase-7-inside-the-nhs-app.md#supplier/channel obligations",
      ],
      releaseBinding,
    }),
  ];
}

function baseAuthorities(
  releaseBinding: ReleaseBinding,
  evidenceBindings: readonly SignoffEvidenceBinding[],
): readonly SignoffAuthority[] {
  const evidenceRef = (laneId: LaneId) =>
    evidenceBindings
      .filter((binding) => binding.laneId === laneId)
      .map((binding) => binding.evidenceBindingId);
  const authorityInputs: readonly Omit<
    SignoffAuthority,
    "recordType" | "authorityTupleHash" | "wormAuditRef" | "recordHash"
  >[] = [
    {
      authorityId: "authority_477_security_lead",
      laneId: "security",
      laneLabel: "Security",
      roleRef: "ROLE_SECURITY_LEAD",
      roleDisplayName: "Security lead",
      signerRef: "synthetic-persona:security-lead",
      signerDisplayName: "Security Privacy Owner",
      independenceGroup: "security",
      signoffState: "signed",
      signedAt: "2026-04-28T09:00:00.000Z",
      expiresAt: "2026-07-27T23:59:59.000Z",
      authoritySourceRefs: [
        "blueprint/platform-runtime-and-release-blueprint.md#Gate 3",
        "blueprint/phase-0-the-foundation-protocol.md#WORM audit",
      ],
      evidenceBindingRefs: evidenceRef("security"),
      releaseBinding,
    },
    {
      authorityId: "authority_477_clinical_safety_cso",
      laneId: "clinical_safety",
      laneLabel: "Clinical Safety",
      roleRef: "ROLE_CLINICAL_SAFETY_LEAD",
      roleDisplayName: "Clinical safety officer delegate",
      signerRef: "synthetic-persona:clinical-safety-officer",
      signerDisplayName: "Clinical Safety Officer",
      independenceGroup: "clinical_safety",
      signoffState: "signed_with_constraints",
      signedAt: "2026-04-28T09:15:00.000Z",
      expiresAt: "2026-06-27T23:59:59.000Z",
      authoritySourceRefs: [
        "blueprint/phase-8-the-assistive-layer.md#human approval posture",
        "blueprint/phase-9-the-assurance-ledger.md#formal completion tests",
      ],
      evidenceBindingRefs: evidenceRef("clinical_safety"),
      releaseBinding,
    },
    {
      authorityId: "authority_477_privacy_dpo",
      laneId: "privacy_records",
      laneLabel: "Privacy & Records",
      roleRef: "ROLE_PRIVACY_LEAD",
      roleDisplayName: "Data protection officer delegate",
      signerRef: "synthetic-persona:data-protection-officer",
      signerDisplayName: "Data Protection Officer",
      independenceGroup: "privacy",
      signoffState: "signed",
      signedAt: "2026-04-28T09:30:00.000Z",
      expiresAt: "2026-07-27T23:59:59.000Z",
      authoritySourceRefs: [
        "blueprint/phase-0-the-foundation-protocol.md#data classification",
        "blueprint/phase-9-the-assurance-ledger.md#records lifecycle",
      ],
      evidenceBindingRefs: evidenceRef("privacy_records"),
      releaseBinding,
    },
    {
      authorityId: "authority_477_regulatory_dtac",
      laneId: "regulatory_dtac",
      laneLabel: "Regulatory/DTAC",
      roleRef: "ROLE_REGULATORY_DTAC_OWNER",
      roleDisplayName: "Regulatory and DTAC owner",
      signerRef: "synthetic-persona:regulatory-dtac-owner",
      signerDisplayName: "Regulatory DTAC Owner",
      independenceGroup: "regulatory",
      signoffState: "signed_with_constraints",
      signedAt: "2026-04-28T09:45:00.000Z",
      expiresAt: "2026-06-12T23:59:59.000Z",
      authoritySourceRefs: [
        "blueprint/phase-7-inside-the-nhs-app.md#NHS App assurance",
        "blueprint/phase-9-the-assurance-ledger.md#standards map",
      ],
      evidenceBindingRefs: evidenceRef("regulatory_dtac"),
      releaseBinding,
    },
    {
      authorityId: "authority_477_accessibility_usability",
      laneId: "accessibility_usability",
      laneLabel: "Accessibility & Usability",
      roleRef: "ROLE_ACCESSIBILITY_USABILITY_APPROVER",
      roleDisplayName: "Accessibility and usability approver",
      signerRef: "synthetic-persona:accessibility-usability-approver",
      signerDisplayName: "Accessibility Usability Approver",
      independenceGroup: "service_design",
      signoffState: "signed_with_constraints",
      signedAt: "2026-04-28T10:00:00.000Z",
      expiresAt: "2026-06-27T23:59:59.000Z",
      authoritySourceRefs: [
        "blueprint/accessibility-and-content-system-contract.md#semantic coverage",
        "blueprint/phase-7-inside-the-nhs-app.md#journey-change controls",
      ],
      evidenceBindingRefs: evidenceRef("accessibility_usability"),
      releaseBinding,
    },
  ];

  return authorityInputs.map((authority) => {
    const authorityTupleHash = hashRef(authority.authorityId, {
      roleRef: authority.roleRef,
      signerRef: authority.signerRef,
      evidenceBindingRefs: authority.evidenceBindingRefs,
      releaseBinding: authority.releaseBinding,
      expiresAt: authority.expiresAt,
    });
    return recordWithHash({
      ...authority,
      recordType: "SignoffAuthority" as const,
      authorityTupleHash,
      wormAuditRef: `worm-ledger:477:signoff-authority:${authority.authorityId}`,
    });
  });
}

function exceptionRecord(
  releaseBinding: ReleaseBinding,
  input: Omit<SignoffException, "recordType" | "releaseBinding" | "wormAuditRef" | "recordHash">,
): SignoffException {
  return recordWithHash({
    ...input,
    recordType: "SignoffException" as const,
    releaseBinding,
    wormAuditRef: `worm-ledger:477:signoff-exception:${input.exceptionId}`,
  });
}

function activeExceptions(releaseBinding: ReleaseBinding): readonly SignoffException[] {
  return [
    exceptionRecord(releaseBinding, {
      exceptionId: "ex_477_backend_command_settlement_pending",
      title: "Launch signoff command can be reviewed but cannot settle until backend command authority is current",
      laneId: "downstream_launch_authority",
      declaredClassification: "launch-with-constraint",
      sourceAlgorithmClassification: "launch-with-constraint",
      effectiveClassification: "launch-with-constraint",
      ownerRoleRef: "ROLE_RELEASE_DEPLOYMENT_APPROVER",
      ownerDisplayName: "Release deployment approver",
      expiresAt: "2026-05-05T23:59:59.000Z",
      scopeAppliesTo: "all launch approval mutations",
      launchScopeApplicability: "in_scope",
      state: "open",
      sourceRefs: [
        "blueprint/phase-0-the-foundation-protocol.md#command settlement",
        "blueprint/phase-9-the-assurance-ledger.md#AssurancePackActionRecord",
      ],
      evidenceRefs: ["data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_477_COMMAND_SETTLEMENT_AUTHORITY.json"],
      blockerRefs: [],
    }),
    exceptionRecord(releaseBinding, {
      exceptionId: "ex_477_nhs_app_channel_scal_deferred",
      title: "NHS App embedded channel remains outside Wave 1 until SCAL and route-freeze evidence is current",
      laneId: "regulatory_dtac",
      declaredClassification: "launch-with-constraint",
      sourceAlgorithmClassification: "launch-with-constraint",
      effectiveClassification: "launch-with-constraint",
      ownerRoleRef: "ROLE_NHS_APP_CHANNEL_OWNER",
      ownerDisplayName: "NHS App channel owner",
      expiresAt: "2026-05-12T23:59:59.000Z",
      scopeAppliesTo: "NHS App embedded channel only",
      launchScopeApplicability: "deferred_scope",
      state: "deferred",
      sourceRefs: [
        "blueprint/phase-7-inside-the-nhs-app.md#IntegrationEvidencePack",
        "blueprint/phase-7-inside-the-nhs-app.md#channel release freeze",
      ],
      evidenceRefs: ["data/release/476_tenant_cohort_rollout_plan.json"],
      blockerRefs: [],
    }),
    exceptionRecord(releaseBinding, {
      exceptionId: "ex_477_assistive_visible_mode_future_scope",
      title: "Assistive visible mode clinical approval is not applicable to Wave 1 shadow-only assistive scope",
      laneId: "clinical_safety",
      declaredClassification: "not-applicable",
      sourceAlgorithmClassification: "launch-blocking",
      effectiveClassification: "not-applicable",
      ownerRoleRef: "ROLE_CLINICAL_SAFETY_LEAD",
      ownerDisplayName: "Clinical safety officer delegate",
      expiresAt: null,
      scopeAppliesTo: "future assistive visible mode waves",
      launchScopeApplicability: "not_in_current_wave",
      state: "deferred",
      sourceRefs: [
        "blueprint/phase-8-the-assistive-layer.md#AssistiveRolloutSliceContract",
        "blueprint/phase-8-the-assistive-layer.md#no self-approval",
      ],
      evidenceRefs: ["data/release/476_tenant_cohort_rollout_plan.json"],
      blockerRefs: [],
    }),
  ];
}

function edgeCaseFixtures(releaseBinding: ReleaseBinding): readonly JsonRecord[] {
  const tupleMismatch = bindingWithTuple(releaseBinding, {
    releaseCandidateRef: "RC_SUPERSEDED_PREVIOUS",
  });
  return [
    recordWithHash({
      edgeCaseId: "edge_477_clinical_core_web_signed_assistive_visible_missing",
      recordType: "SignoffEdgeCaseProof",
      laneId: "clinical_safety",
      scenarioState: "exception_blocking",
      sourceAlgorithmClassification: "launch-blocking",
      observedClaim: "Core web DCB0129 signoff exists.",
      requiredDecision:
        "Block assistive visible launch until visible-mode slice, monitoring, training and independent clinical safety approval are current.",
      blockerRefs: ["blocker:477:assistive-visible-mode-clinical-safety-signoff-missing"],
      releaseBinding: bindingWithTuple(releaseBinding, {
        assistiveScope: "was_476_assistive_visible_narrow_staff",
      }),
    }),
    recordWithHash({
      edgeCaseId: "edge_477_dpia_old_telemetry_destination",
      recordType: "SignoffEdgeCaseProof",
      laneId: "privacy_records",
      scenarioState: "blocked",
      sourceAlgorithmClassification: "launch-blocking",
      observedClaim: "DPIA closure references telemetry:privacy-safe-observability:v1.",
      requiredDecision:
        "Block privacy closure until the DPIA binds telemetry:privacy-safe-observability:v2 used by the release tuple.",
      blockerRefs: ["blocker:477:dpia-closure-telemetry-destination-stale"],
      releaseBinding,
    }),
    recordWithHash({
      edgeCaseId: "edge_477_medium_pentest_waiver_missing_expiry",
      recordType: "SignoffEdgeCaseProof",
      laneId: "security",
      scenarioState: "blocked",
      sourceAlgorithmClassification: "launch-blocking",
      observedClaim: "Medium penetration-test finding accepted without waiver expiry.",
      requiredDecision:
        "Block launch because accepted vulnerability exceptions must have owner, compensating control and expiry.",
      blockerRefs: ["blocker:477:medium-pentest-waiver-expiry-missing"],
      releaseBinding,
    }),
    recordWithHash({
      edgeCaseId: "edge_477_supplier_tenant_scope_mismatch",
      recordType: "SignoffEdgeCaseProof",
      laneId: "supplier_dependencies",
      scenarioState: "tuple_mismatch",
      sourceAlgorithmClassification: "launch-blocking",
      observedClaim: "Supplier attestation names tenant-demo-gp-legacy instead of tenant-demo-gp:programme-core-release.",
      requiredDecision:
        "Block supplier dependency signoff until the exact tenant/cohort tuple is named.",
      blockerRefs: ["blocker:477:supplier-attestation-tenant-scope-mismatch"],
      releaseBinding,
    }),
    recordWithHash({
      edgeCaseId: "edge_477_accessibility_desktop_only",
      recordType: "SignoffEdgeCaseProof",
      laneId: "accessibility_usability",
      scenarioState: "blocked",
      sourceAlgorithmClassification: "launch-blocking",
      observedClaim: "Desktop accessibility pass is present; mobile and embedded route coverage are untested.",
      requiredDecision:
        "Block embedded/mobile route release until compact/narrow, 400 percent zoom and embedded route fallbacks are attested.",
      blockerRefs: ["blocker:477:mobile-embedded-accessibility-coverage-missing"],
      releaseBinding,
    }),
    recordWithHash({
      edgeCaseId: "edge_477_dtac_superseded_release_candidate",
      recordType: "SignoffEdgeCaseProof",
      laneId: "regulatory_dtac",
      scenarioState: "tuple_mismatch",
      sourceAlgorithmClassification: "launch-blocking",
      observedClaim: "DTAC matrix points at RC_SUPERSEDED_PREVIOUS.",
      requiredDecision:
        "Block DTAC signoff because evidence is bound to a superseded release candidate.",
      blockerRefs: ["blocker:477:dtac-evidence-release-candidate-superseded"],
      releaseBinding: tupleMismatch,
    }),
    recordWithHash({
      edgeCaseId: "edge_477_exception_non_blocking_claim_overridden",
      recordType: "SignoffEdgeCaseProof",
      laneId: "downstream_launch_authority",
      scenarioState: "exception_blocking",
      declaredClassification: "BAU-follow-up",
      sourceAlgorithmClassification: "launch-blocking",
      requiredDecision:
        "Use source algorithm classification when an exception register understates a release-blocking condition.",
      blockerRefs: ["blocker:477:exception-register-contradicts-source-release-blocking-rule"],
      releaseBinding,
    }),
  ];
}

function scenarioExceptions(
  scenario: Signoff477Scenario,
  releaseBinding: ReleaseBinding,
): readonly SignoffException[] {
  const exceptions = [...activeExceptions(releaseBinding)];
  if (scenario === "ready") {
    return [];
  }
  if (scenario === "blocked") {
    exceptions.push(
      exceptionRecord(releaseBinding, {
        exceptionId: "ex_477_blocked_dpia_telemetry_destination",
        title: "DPIA closure references a stale telemetry destination",
        laneId: "privacy_records",
        declaredClassification: "launch-blocking",
        sourceAlgorithmClassification: "launch-blocking",
        effectiveClassification: "launch-blocking",
        ownerRoleRef: "ROLE_PRIVACY_LEAD",
        ownerDisplayName: "Data protection officer delegate",
        expiresAt: "2026-04-30T23:59:59.000Z",
        scopeAppliesTo: "Wave 1 telemetry and audit events",
        launchScopeApplicability: "in_scope",
        state: "blocked",
        sourceRefs: ["blueprint/phase-0-the-foundation-protocol.md#privacy controls"],
        evidenceRefs: ["data/assurance/privacy_data_flow_inventory.json"],
        blockerRefs: ["blocker:477:dpia-closure-telemetry-destination-stale"],
      }),
    );
  }
  if (scenario === "exception_blocking") {
    exceptions.push(
      exceptionRecord(releaseBinding, {
        exceptionId: "ex_477_exception_register_understates_blocker",
        title: "Exception register says BAU follow-up but source algorithm marks it release-blocking",
        laneId: "downstream_launch_authority",
        declaredClassification: "BAU-follow-up",
        sourceAlgorithmClassification: "launch-blocking",
        effectiveClassification: "launch-blocking",
        ownerRoleRef: "ROLE_RELEASE_DEPLOYMENT_APPROVER",
        ownerDisplayName: "Release deployment approver",
        expiresAt: "2026-04-30T23:59:59.000Z",
        scopeAppliesTo: "release approval mutation",
        launchScopeApplicability: "in_scope",
        state: "blocked",
        sourceRefs: [
          "blueprint/phase-9-the-assurance-ledger.md#completeness verdict",
          "blueprint/phase-0-the-foundation-protocol.md#fail closed",
        ],
        evidenceRefs: ["data/signoff/477_open_exception_register.json"],
        blockerRefs: ["blocker:477:exception-register-contradicts-source-release-blocking-rule"],
      }),
    );
  }
  return exceptions;
}

function applyScenarioToAuthorities(
  scenario: Signoff477Scenario,
  authorities: readonly SignoffAuthority[],
): readonly SignoffAuthority[] {
  return authorities.map((authority) => {
    if (scenario === "expired_signoff" && authority.laneId === "clinical_safety") {
      return recordWithHash({
        ...authority,
        signoffState: "expired" as const,
        expiresAt: "2026-04-01T23:59:59.000Z",
        authorityTupleHash: hashRef(`${authority.authorityId}:expired`, authority),
      });
    }
    if (scenario === "missing_signoff" && authority.laneId === "privacy_records") {
      return recordWithHash({
        ...authority,
        signoffState: "missing" as const,
        signerRef: "synthetic-persona:unassigned-privacy-authority",
        signerDisplayName: "Unassigned privacy authority",
        signedAt: null,
        expiresAt: null,
        authorityTupleHash: hashRef(`${authority.authorityId}:missing`, authority),
      });
    }
    if (scenario === "tuple_mismatch" && authority.laneId === "regulatory_dtac") {
      const releaseBinding = bindingWithTuple(authority.releaseBinding, {
        releaseCandidateRef: "RC_SUPERSEDED_PREVIOUS",
      });
      return recordWithHash({
        ...authority,
        signoffState: "tuple_mismatch" as const,
        releaseBinding,
        authorityTupleHash: hashRef(`${authority.authorityId}:tuple-mismatch`, releaseBinding),
      });
    }
    if (scenario === "blocked" && authority.laneId === "privacy_records") {
      return recordWithHash({
        ...authority,
        signoffState: "blocked" as const,
        authorityTupleHash: hashRef(`${authority.authorityId}:blocked`, authority),
      });
    }
    return authority;
  });
}

function deriveOverallState(
  scenario: Signoff477Scenario,
  authorities: readonly SignoffAuthority[],
  exceptions: readonly SignoffException[],
): FinalLaunchSignoffRegister["overallSignoffState"] {
  if (scenario === "expired_signoff") return "expired_signoff";
  if (scenario === "missing_signoff") return "missing_signoff";
  if (scenario === "tuple_mismatch") return "tuple_mismatch";
  if (
    authorities.some((authority) => authority.signoffState === "blocked") ||
    exceptions.some((entry) => entry.effectiveClassification === "launch-blocking")
  ) {
    return "blocked";
  }
  if (
    exceptions.some((entry) => entry.effectiveClassification === "launch-with-constraint") ||
    authorities.some((authority) => authority.signoffState === "signed_with_constraints")
  ) {
    return "ready_with_constraints";
  }
  return "ready";
}

function signoffBlockerCount(
  authorities: readonly SignoffAuthority[],
  exceptions: readonly SignoffException[],
): number {
  const authorityBlockers = authorities.filter((authority) =>
    ["missing", "expired", "tuple_mismatch", "blocked"].includes(authority.signoffState),
  ).length;
  const exceptionBlockers = exceptions.filter(
    (entry) => entry.effectiveClassification === "launch-blocking",
  ).length;
  return authorityBlockers + exceptionBlockers;
}

function buildSecurityMatrix(
  releaseBinding: ReleaseBinding,
  evidenceBindings: readonly SignoffEvidenceBinding[],
): JsonRecord {
  const securityBinding = evidenceBindings.find((binding) => binding.laneId === "security");
  const rows = [
    {
      recordType: "SecurityAssuranceEvidenceRow",
      rowId: "security_477_runtime_image_provenance",
      evidenceArea: "runtime_image",
      state: "current",
      ownerRoleRef: "ROLE_SECURITY_LEAD",
      releaseBinding,
      evidenceRefs: ["data/release/release_candidate_tuple.json"],
      evidenceHash: securityBinding?.evidenceHash,
      blockerRefs: [],
    },
    {
      recordType: "SecurityAssuranceEvidenceRow",
      rowId: "security_477_dependencies_sbom_sca",
      evidenceArea: "dependencies",
      state: "current",
      ownerRoleRef: "ROLE_SECURITY_LEAD",
      releaseBinding,
      evidenceRefs: ["data/evidence/470_full_regression_and_defensive_security_results.json"],
      evidenceHash: hashRef("security-dependencies", releaseBinding),
      blockerRefs: [],
    },
    {
      recordType: "SecurityAssuranceEvidenceRow",
      rowId: "security_477_secrets_iac_egress",
      evidenceArea: "secrets_infrastructure_egress",
      state: "current",
      ownerRoleRef: "ROLE_SECURITY_LEAD",
      releaseBinding,
      evidenceRefs: ["data/analysis/runtime_topology_manifest.json"],
      evidenceHash: hashRef("security-secrets-iac-egress", releaseBinding),
      blockerRefs: [],
    },
    {
      recordType: "SecurityAssuranceEvidenceRow",
      rowId: "security_477_monitoring_destinations",
      evidenceArea: "monitoring_destinations",
      state: "current",
      ownerRoleRef: "ROLE_SECURITY_LEAD",
      releaseBinding,
      evidenceRefs: ["data/analysis/telemetry_redaction_policy.json"],
      evidenceHash: hashRef("security-monitoring-destinations", releaseBinding),
      blockerRefs: [],
    },
  ].map((row) => recordWithHash(row));
  const vulnerabilityExceptionWaiver = recordWithHash({
    recordType: "VulnerabilityExceptionWaiver",
    waiverId: "vew_477_medium_vulnerability_runtime_header_hardening",
    severity: "medium",
    findingRef: "pentest-finding:470:medium:response-header-tightening",
    acceptanceReason: "Compensating edge policy and response header hardening already deployed in runtime tuple.",
    ownerRoleRef: "ROLE_SECURITY_LEAD",
    expiresAt: "2026-05-28T23:59:59.000Z",
    compensatingControlRefs: ["data/evidence/470_full_regression_and_defensive_security_results.json"],
    releaseBinding,
  });
  const penTestClosureBinding = recordWithHash({
    recordType: "PenTestClosureBinding",
    bindingId: "ptcb_477_release_candidate_security_closure",
    state: "closed_with_timeboxed_medium_waiver",
    closedFindingCount: 14,
    acceptedFindingCount: 1,
    vulnerabilityExceptionWaiverRefs: [vulnerabilityExceptionWaiver.waiverId],
    evidenceRefs: ["data/evidence/470_full_regression_and_defensive_security_results.json"],
    releaseBinding,
  });
  return recordWithHash({
    schemaVersion: "477.security-assurance-matrix.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "SecurityAssuranceMatrix",
    matrixId: "security_matrix_477_final_launch",
    releaseBinding,
    rows,
    penTestClosureBinding,
    vulnerabilityExceptionWaivers: [vulnerabilityExceptionWaiver],
    supplyChainAttestationRefs: ["supplier_attestation_477_cloud_runtime"],
    edgeCaseProofs: edgeCaseFixtures(releaseBinding).filter((edge) => edge.laneId === "security"),
  });
}

function buildClinicalDelta(releaseBinding: ReleaseBinding): JsonRecord {
  return recordWithHash({
    schemaVersion: "477.clinical-safety-case-delta.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "ClinicalSafetyCaseDelta",
    deltaId: "clinical_delta_477_wave1_core_web",
    releaseBinding,
    hazardLogDeltaBindings: [
      recordWithHash({
        recordType: "HazardLogDeltaBinding",
        bindingId: "hldb_477_core_web_route_delta",
        affectedRouteFamilies: releaseBinding.routeFamilies,
        hazardRefs: [
          "identity_authorization",
          "safety_screening_triage",
          "workflow_concurrency_replay",
          "visibility_runtime_publication",
        ],
        state: "accepted",
        evidenceRefs: ["data/assurance/dcb0129_hazard_register.json"],
        releaseBinding,
      }),
      recordWithHash({
        recordType: "HazardLogDeltaBinding",
        bindingId: "hldb_477_assistive_visible_future_delta",
        affectedRouteFamilies: ["staff_workspace", "assistive_visible_review"],
        hazardRefs: ["assistive_change_control"],
        state: "deferred_not_in_wave1",
        evidenceRefs: ["data/release/476_tenant_cohort_rollout_plan.json"],
        releaseBinding: bindingWithTuple(releaseBinding, {
          assistiveScope: "was_476_assistive_visible_narrow_staff",
        }),
      }),
    ],
    deploymentSafetyAcceptances: [
      recordWithHash({
        recordType: "DeploymentSafetyAcceptance",
        acceptanceId: "dsa_477_wave1_core_web",
        state: "accepted",
        clinicalSafetyOfficerRef: "synthetic-persona:clinical-safety-officer",
        deployerBoundaryState: "deployer_DCB0160_local_acceptance_required_by_live_provider",
        evidenceRefs: [
          "data/assurance/clinical_signoff_gate_requirements.json",
          "data/release/476_release_wave_manifest.json",
        ],
        releaseBinding,
      }),
    ],
    assistiveClinicalSafetyApprovals: [
      recordWithHash({
        recordType: "AssistiveClinicalSafetyApproval",
        approvalId: "acsa_477_assistive_shadow_only",
        state: "approved_for_shadow_only",
        visibleModePermitted: false,
        monitoringRef: "assistive-monitoring:shadow-only:wave1",
        humanApprovalPosture: "staff_remains_responsible_no_autonomous_clinical_action",
        evidenceRefs: ["data/release/476_tenant_cohort_rollout_plan.json"],
        releaseBinding,
      }),
    ],
    edgeCaseProofs: edgeCaseFixtures(releaseBinding).filter(
      (edge) => edge.laneId === "clinical_safety",
    ),
  });
}

function buildPrivacyMatrix(releaseBinding: ReleaseBinding): JsonRecord {
  return recordWithHash({
    schemaVersion: "477.privacy-dpia-records-matrix.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "PrivacyDPIAAndRecordsMatrix",
    matrixId: "privacy_records_477_final_launch",
    releaseBinding,
    dpiaClosureRecords: [
      recordWithHash({
        recordType: "PrivacyDPIAClosureRecord",
        closureId: "dpia_477_wave1_core_web_privacy_safe_telemetry",
        state: "closed_current",
        dataFlowRefs: ["FLOW_126_INGRESS_INTAKE", "FLOW_126_AUDIT_AND_OBSERVABILITY"],
        telemetryDestinationRef: "telemetry:privacy-safe-observability:v2",
        ownerRoleRef: "ROLE_PRIVACY_LEAD",
        evidenceRefs: [
          "data/assurance/privacy_data_flow_inventory.json",
          "data/assurance/privacy_control_traceability.json",
        ],
        releaseBinding,
      }),
    ],
    dataProtectionImpactExceptions: [
      recordWithHash({
        recordType: "DataProtectionImpactException",
        exceptionId: "dpie_477_nhs_app_deferred_channel",
        state: "deferred_scope",
        classification: "launch-with-constraint",
        ownerRoleRef: "ROLE_PRIVACY_LEAD",
        expiresAt: "2026-05-12T23:59:59.000Z",
        reason: "NHS App embedded channel remains outside Wave 1 scope.",
        evidenceRefs: ["data/release/476_tenant_cohort_rollout_plan.json"],
        releaseBinding,
      }),
    ],
    recordsRetentionApprovals: [
      recordWithHash({
        recordType: "RecordsRetentionApproval",
        approvalId: "rra_477_request_audit_archive_retention",
        state: "approved",
        retentionClassRefs: ["request-case-record", "audit-command-settlement", "assurance-pack"],
        archiveReadinessRef: "data/evidence/467_retention_legal_hold_worm_replay_results.json",
        releaseBinding,
      }),
    ],
    legalHoldReadinessProofs: [
      recordWithHash({
        recordType: "LegalHoldReadinessProof",
        proofId: "lhrp_477_release_evidence_legal_hold",
        state: "ready",
        holdScopeRefs: ["assurance-pack", "release-command-settlement", "dpia-closure"],
        evidenceRefs: ["data/evidence/467_retention_legal_hold_worm_replay_results.json"],
        releaseBinding,
      }),
    ],
    edgeCaseProofs: edgeCaseFixtures(releaseBinding).filter(
      (edge) => edge.laneId === "privacy_records",
    ),
  });
}

function buildRegulatoryMatrix(releaseBinding: ReleaseBinding): JsonRecord {
  const dtacSections = [
    ["C1", "Clinical safety", "signed_with_constraints"],
    ["C2", "Data protection", "signed"],
    ["C3", "Technical security", "signed"],
    ["C4", "Interoperability", "signed"],
    ["D1", "Usability and accessibility", "signed_with_constraints"],
  ] as const;
  return recordWithHash({
    schemaVersion: "477.regulatory-dtac-evidence-matrix.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "RegulatoryAndDTACEvidenceMatrix",
    matrixId: "regulatory_dtac_477_final_launch",
    releaseBinding,
    dtacEvidenceRows: dtacSections.map(([sectionCode, sectionTitle, state]) =>
      recordWithHash({
        recordType: "DTACEvidenceRow",
        rowId: `dtac_477_${sectionCode.toLowerCase()}`,
        sectionCode,
        sectionTitle,
        state,
        releaseCandidateRef: releaseBinding.releaseCandidateRef,
        evidenceRefs: ["data/assurance/dspt_evidence_catalog.json", "data/release/476_release_wave_manifest.json"],
        sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#standards map"],
        releaseBinding,
      }),
    ),
    scalChannelEvidence: recordWithHash({
      recordType: "NHSAppSCALChannelEvidence",
      evidenceId: "scal_477_nhs_app_deferred",
      state: "deferred_not_in_wave1",
      channelScope: "NHS App embedded channel",
      requiredBeforeActivationRefs: ["seq_486"],
      evidenceRefs: ["data/release/476_tenant_cohort_rollout_plan.json"],
      releaseBinding,
    }),
    dsptEvidenceState: "current",
    edgeCaseProofs: edgeCaseFixtures(releaseBinding).filter(
      (edge) => edge.laneId === "regulatory_dtac",
    ),
  });
}

function buildAccessibilityAttestation(releaseBinding: ReleaseBinding): JsonRecord {
  return recordWithHash({
    schemaVersion: "477.accessibility-usability-attestation.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "AccessibilityAndUsabilityAttestation",
    attestationId: "accessibility_477_final_launch",
    releaseBinding,
    coverageProfile: {
      profileRef: "profile.governance.release.final_signoff",
      semanticCoverageState: "attested_with_deferred_embedded_channel",
      coveredViewportModes: ["compact", "narrow", "medium", "expanded", "wide"],
      coveredInteractionModes: ["keyboard", "screen-reader", "forced-colors", "reduced-motion"],
      tableFallbackState: "available_for_every_matrix",
      zoom400PercentState: "attested",
      mobileCoreWebState: "attested",
      embeddedNhsAppState: "deferred_not_in_wave1",
    },
    usabilityEvidenceRows: [
      recordWithHash({
        recordType: "UsabilityEvidenceRow",
        rowId: "uer_477_core_web_keyboard_screen_reader",
        state: "attested",
        routeFamilies: releaseBinding.routeFamilies,
        evidenceRefs: ["data/evidence/470_full_regression_and_defensive_security_results.json"],
        releaseBinding,
      }),
      recordWithHash({
        recordType: "UsabilityEvidenceRow",
        rowId: "uer_477_nhs_app_embedded_deferred",
        state: "deferred_scope",
        routeFamilies: ["nhs_app_embedded_entry", "nhs_app_status"],
        evidenceRefs: ["data/release/476_tenant_cohort_rollout_plan.json"],
        releaseBinding: bindingWithTuple(releaseBinding, {
          channelScope: "wcs_476_nhs_app_limited_release_blocked",
        }),
      }),
    ],
    edgeCaseProofs: edgeCaseFixtures(releaseBinding).filter(
      (edge) => edge.laneId === "accessibility_usability",
    ),
  });
}

function buildSupplierRegister(releaseBinding: ReleaseBinding): JsonRecord {
  return recordWithHash({
    schemaVersion: "477.supplier-dependency-signoff-register.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "SupplierAndDependencySignoffRegister",
    registerId: "supplier_dependencies_477_final_launch",
    releaseBinding,
    supplyChainAttestations: [
      recordWithHash({
        recordType: "SupplyChainAttestation",
        attestationId: "supplier_attestation_477_cloud_runtime",
        supplierRef: "synthetic-supplier:cloud-runtime",
        supplierDisplayName: "Cloud runtime supplier",
        state: "signed",
        tenantScope: releaseBinding.tenantScope,
        runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
        evidenceRefs: ["data/analysis/external_assurance_obligations.csv"],
        expiresAt: "2026-07-27T23:59:59.000Z",
        releaseBinding,
      }),
      recordWithHash({
        recordType: "SupplyChainAttestation",
        attestationId: "supplier_attestation_477_monitoring_processor",
        supplierRef: "synthetic-supplier:monitoring-processor",
        supplierDisplayName: "Monitoring processor supplier",
        state: "signed",
        tenantScope: releaseBinding.tenantScope,
        runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
        evidenceRefs: ["data/analysis/telemetry_redaction_policy.json"],
        expiresAt: "2026-07-27T23:59:59.000Z",
        releaseBinding,
      }),
    ],
    dependencyRows: [
      recordWithHash({
        rowId: "dependency_477_runtime_image",
        dependencyClass: "runtime_image",
        state: "current",
        releaseBinding,
      }),
      recordWithHash({
        rowId: "dependency_477_external_suppliers",
        dependencyClass: "external_suppliers",
        state: "signed",
        releaseBinding,
      }),
    ],
    edgeCaseProofs: edgeCaseFixtures(releaseBinding).filter(
      (edge) => edge.laneId === "supplier_dependencies",
    ),
  });
}

function buildOpenExceptionRegister(
  releaseBinding: ReleaseBinding,
  exceptions: readonly SignoffException[],
): JsonRecord {
  return recordWithHash({
    schemaVersion: "477.open-exception-register.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "OpenExceptionRegister",
    registerId: "open_exceptions_477_final_launch",
    releaseBinding,
    exceptions,
    classificationPolicy: {
      allowedClassifications: [
        "launch-blocking",
        "launch-with-constraint",
        "BAU-follow-up",
        "not-applicable",
      ],
      sourceAlgorithmOverridesDeclaredClassification: true,
      expiredExceptionIsBlocking: true,
      missingExpiryForAcceptedSecurityWaiverIsBlocking: true,
    },
    edgeCaseProofs: edgeCaseFixtures(releaseBinding).filter(
      (edge) => edge.laneId === "downstream_launch_authority",
    ),
  });
}

function buildSchema(): JsonRecord {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.example/contracts/477_final_signoff.schema.json",
    title: "Task 477 final launch signoff register",
    type: "object",
    required: [
      "schemaVersion",
      "recordType",
      "registerId",
      "releaseBinding",
      "authorities",
      "evidenceBindings",
      "activeExceptions",
      "launchDecision",
      "recordHash",
    ],
    properties: {
      schemaVersion: { const: SCHEMA_VERSION },
      recordType: { const: "FinalLaunchSignoffRegister" },
      registerId: { type: "string", minLength: 1 },
      scenarioState: {
        enum: [
          "ready",
          "ready_with_constraints",
          "blocked",
          "expired_signoff",
          "missing_signoff",
          "tuple_mismatch",
          "exception_blocking",
        ],
      },
      overallSignoffState: {
        enum: [
          "ready",
          "ready_with_constraints",
          "blocked",
          "expired_signoff",
          "missing_signoff",
          "tuple_mismatch",
        ],
      },
      launchApprovalPermitted: { type: "boolean" },
      signoffReviewPermitted: { type: "boolean" },
      commandSettlementCurrent: { type: "boolean" },
      releaseBinding: {
        type: "object",
        required: [
          "releaseCandidateRef",
          "runtimePublicationBundleRef",
          "waveManifestRef",
          "waveManifestHash",
          "tenantScope",
          "tenantCohortScope",
          "channelScope",
          "assistiveScope",
          "routeFamilies",
        ],
      },
      authorities: { type: "array", minItems: 5 },
      evidenceBindings: { type: "array", minItems: 5 },
      activeExceptions: { type: "array" },
      launchDecision: {
        type: "object",
        required: [
          "releaseCandidateRef",
          "runtimePublicationBundleRef",
          "waveManifestRef",
          "signoffBlockerCount",
          "backendCommandSettlementState",
        ],
      },
      recordHash: { type: "string", minLength: 64, maxLength: 64 },
    },
    additionalProperties: true,
  };
}

function buildCommandSettlementGap(releaseBinding: ReleaseBinding): JsonRecord {
  return recordWithHash({
    schemaVersion: "PROGRAMME_BATCH_473_489_INTERFACE_GAP.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "ProgrammeBatchInterfaceGap",
    gapId: "PROGRAMME_BATCH_473_489_INTERFACE_GAP_477_COMMAND_SETTLEMENT_AUTHORITY",
    gapTitle: "Final signoff launch mutation requires backend command settlement authority",
    sourceConcept: "WORM-backed command settlement for release approval mutation",
    bridgeState: "fail_closed_until_seq_482_promotion_settlement",
    launchApprovalPermitted: false,
    requiredSettlementTuple: {
      roleAuthorizationRef: "role-auth:release-governance:final-launch-signoff",
      tenantCohortChannelScope: `${releaseBinding.tenantScope}|${releaseBinding.tenantCohortScope}|${releaseBinding.channelScope}`,
      idempotencyKeyScope: "releaseCandidate+runtimeBundle+waveManifest+tenantCohort+channelScope",
      purposeBindingRef: "purpose:477:final-launch-signoff-review",
      injectedClockRef: "clock:477:fixed-2026-04-28T00:00:00Z",
      wormAuditOutputRef: "worm-ledger:477:final-launch-signoff-command",
    },
    sourceRefs: [
      "blueprint/phase-0-the-foundation-protocol.md#command settlement",
      "blueprint/phase-9-the-assurance-ledger.md#AssurancePackActionRecord",
    ],
    releaseBinding,
  });
}

function buildExternalReferenceNotes(): JsonRecord {
  return recordWithHash({
    schemaVersion: "477.external-reference-notes.v1",
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "ExternalReferenceNotes",
    reviewedAt: "2026-04-28",
    references: [
      {
        refId: "nhs-digital-clinical-safety",
        title: "NHS England Digital clinical safety",
        url: "https://digital.nhs.uk/services/clinical-safety",
        relevance:
          "Clinical safety assurance and mandatory clinical risk-management standards for health IT.",
      },
      {
        refId: "nhs-dtac-2026",
        title: "NHS England DTAC guidance for buyers and suppliers",
        url: "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
        relevance:
          "DTAC sections for clinical safety, data protection, technical security, interoperability, usability and accessibility; 2026 form transition.",
      },
      {
        refId: "nhs-dspt",
        title: "NHS Data Security and Protection Toolkit",
        url: "https://www.dsptoolkit.nhs.uk/",
        relevance: "Data security assurance for organisations with access to NHS patient data and systems.",
      },
      {
        refId: "ico-dpia",
        title: "ICO data protection impact assessments guidance",
        url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/",
        relevance: "DPIA closure expectations and privacy-risk review.",
      },
      {
        refId: "nhs-records-code",
        title: "NHS Records Management Code of Practice",
        url: "https://transform.england.nhs.uk/information-governance/guidance/records-management-code/records-management-code-of-practice/",
        relevance: "Retention, storage, deletion, archive and legal-hold record management baseline.",
      },
      {
        refId: "nhs-service-manual-accessibility",
        title: "NHS digital service manual accessibility",
        url: "https://service-manual.nhs.uk/accessibility",
        relevance: "Accessibility and inclusive service requirements for NHS digital services.",
      },
      {
        refId: "nhs-app-web-integration",
        title: "NHS App web integration",
        url: "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
        relevance: "Embedded NHS App channel obligations and route-change controls.",
      },
      {
        refId: "nhs-ai-ambient-scribing",
        title: "NHS England guidance on AI-enabled ambient scribing products",
        url: "https://www.england.nhs.uk/publication/guidance-on-the-use-of-ai-enabled-ambient-scribing-products/",
        relevance:
          "Assistive/AI clinical documentation governance, supplier and monitoring posture for future visible modes.",
      },
    ],
  });
}

function buildAlgorithmAlignmentNotes(register: FinalLaunchSignoffRegister): string {
  return `# Task 477 Algorithm Alignment Notes

Generated: ${FIXED_NOW}

This artifact binds final launch signoff evidence to the source algorithm blocks named in prompt/477.md. The register is an evidence ledger, not a narrative approval. Every signoff authority carries the exact release candidate (${register.releaseBinding.releaseCandidateRef}), runtime bundle (${register.releaseBinding.runtimePublicationBundleRef}), wave manifest (${register.releaseBinding.waveManifestRef}), tenant/cohort scope, channel scope, assistive scope, route families, source refs, evidence refs, WORM audit ref, and deterministic record hash.

## Fail-Closed Rules

- Missing, expired, role-mismatched, tuple-mismatched, superseded, partial, stale, cross-tenant, or contradictory evidence is blocking unless the source algorithm explicitly defines a constrained safe state.
- Exception classifications are evaluated from the source algorithm classification. A declared non-blocking exception cannot override a launch-blocking source rule.
- Accepted vulnerability exceptions must have owner, compensating-control evidence, and an expiry.
- Clinical safety approval for core web cannot authorize assistive visible mode. The Wave 1 binding remains shadow-only for assistive scope.
- NHS App embedded channel signoff remains deferred and cannot activate until SCAL, route freeze, monthly-data, privacy and accessibility evidence are current.
- The UI may open a command review, but no signoff action settles until the backend command settlement authority is current.

## Default Decision

Default scenario: ${register.scenarioState}

Signoff blocker count: ${register.launchDecision.signoffBlockerCount}

Constrained launch count: ${register.launchDecision.constrainedLaunchCount}

Downstream launch blocker count: ${register.launchDecision.downstreamLaunchBlockerCount}
`;
}

function buildFinalLaunchSignoffPack(register: FinalLaunchSignoffRegister): string {
  const authorityRows = register.authorities
    .map(
      (authority) =>
        `| ${authority.laneLabel} | ${authority.roleDisplayName} | ${authority.signerDisplayName} | ${authority.signoffState} | ${authority.expiresAt ?? "not applicable"} | ${authority.authorityTupleHash} |`,
    )
    .join("\n");
  const exceptionRows = register.activeExceptions
    .map(
      (entry) =>
        `| ${entry.exceptionId} | ${entry.effectiveClassification} | ${entry.ownerDisplayName} | ${entry.expiresAt ?? "not applicable"} | ${entry.scopeAppliesTo} |`,
    )
    .join("\n");
  return `# Task 477 Final Launch Signoff Pack

This pack is a human-readable index over the canonical signed evidence register. The source of truth is \`data/signoff/477_final_signoff_register.json\`.

## Launch Decision

- Release candidate: \`${register.launchDecision.releaseCandidateRef}\`
- Runtime bundle: \`${register.launchDecision.runtimePublicationBundleRef}\`
- Wave manifest: \`${register.launchDecision.waveManifestRef}\`
- Signoff blockers: \`${register.launchDecision.signoffBlockerCount}\`
- Constraint count: \`${register.launchDecision.constrainedLaunchCount}\`
- Backend settlement: \`${register.launchDecision.backendCommandSettlementState}\`
- Launch approval permitted: \`${register.launchApprovalPermitted}\`

## Authority Tuples

| Lane | Authority | Signer | State | Expiry | Tuple hash |
| --- | --- | --- | --- | --- | --- |
${authorityRows}

## Open Exceptions

| Exception | Effective classification | Owner | Expiry | Scope |
| --- | --- | --- | --- | --- |
${exceptionRows}

## Canonical Artifacts

- \`data/signoff/477_security_assurance_matrix.json\`
- \`data/signoff/477_clinical_safety_case_delta.json\`
- \`data/signoff/477_privacy_dpia_and_records_matrix.json\`
- \`data/signoff/477_regulatory_and_dtac_evidence_matrix.json\`
- \`data/signoff/477_accessibility_and_usability_attestation.json\`
- \`data/signoff/477_supplier_and_dependency_signoff_register.json\`
- \`data/signoff/477_open_exception_register.json\`
`;
}

export function build477FinalSignoffArtifacts(
  scenario: Signoff477Scenario = DEFAULT_SCENARIO,
): Signoff477Artifacts {
  const releaseBinding = buildReleaseBinding();
  const evidenceBindings = baseEvidenceBindings(releaseBinding);
  const authorities = applyScenarioToAuthorities(
    scenario,
    baseAuthorities(releaseBinding, evidenceBindings),
  );
  const exceptions = scenarioExceptions(scenario, releaseBinding);
  const blockers = signoffBlockerCount(authorities, exceptions);
  const constrainedLaunchCount = exceptions.filter(
    (entry) => entry.effectiveClassification === "launch-with-constraint",
  ).length;
  const commandSettlementCurrent = false;
  const overallSignoffState = deriveOverallState(scenario, authorities, exceptions);
  const signoffReviewPermitted =
    blockers === 0 && !["expired_signoff", "missing_signoff", "tuple_mismatch"].includes(scenario);
  const finalSignoffRegister = recordWithHash({
    schemaVersion: SCHEMA_VERSION,
    taskId: TASK_ID,
    generatedAt: FIXED_NOW,
    recordType: "FinalLaunchSignoffRegister" as const,
    registerId: "flsr_477_final_launch",
    scenarioState: scenario,
    overallSignoffState,
    launchApprovalPermitted: signoffReviewPermitted && commandSettlementCurrent,
    signoffReviewPermitted,
    commandSettlementCurrent,
    sourceRefs,
    releaseBinding,
    authorities,
    evidenceBindings,
    activeExceptions: exceptions,
    launchDecision: {
      releaseCandidateRef: releaseBinding.releaseCandidateRef,
      runtimePublicationBundleRef: releaseBinding.runtimePublicationBundleRef,
      waveManifestRef: releaseBinding.waveManifestRef,
      signoffBlockerCount: blockers,
      constrainedLaunchCount,
      downstreamLaunchBlockerCount: downstreamLaunchBlockers.length,
      backendCommandSettlementState: commandSettlementCurrent ? "current" : "pending",
      nextSafeAction: signoffReviewPermitted
        ? "Review signed evidence; launch mutation remains disabled until backend command settlement is current and downstream launch blockers clear."
        : "Resolve signoff blockers before any launch approval review.",
    },
    typedRecordCoverage,
    edgeCaseRegressionFixtures: edgeCaseFixtures(releaseBinding),
    commandSettlementAuthorityRef:
      "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_477_COMMAND_SETTLEMENT_AUTHORITY.json",
  }) as FinalLaunchSignoffRegister;

  const securityAssuranceMatrix = buildSecurityMatrix(releaseBinding, evidenceBindings);
  const clinicalSafetyCaseDelta = buildClinicalDelta(releaseBinding);
  const privacyDpiaAndRecordsMatrix = buildPrivacyMatrix(releaseBinding);
  const regulatoryAndDtacEvidenceMatrix = buildRegulatoryMatrix(releaseBinding);
  const accessibilityAndUsabilityAttestation = buildAccessibilityAttestation(releaseBinding);
  const supplierAndDependencySignoffRegister = buildSupplierRegister(releaseBinding);
  const openExceptionRegister = buildOpenExceptionRegister(releaseBinding, exceptions);
  const commandSettlementGap = buildCommandSettlementGap(releaseBinding);
  const externalReferenceNotes = buildExternalReferenceNotes();
  return {
    finalSignoffRegister,
    securityAssuranceMatrix,
    clinicalSafetyCaseDelta,
    privacyDpiaAndRecordsMatrix,
    regulatoryAndDtacEvidenceMatrix,
    accessibilityAndUsabilityAttestation,
    supplierAndDependencySignoffRegister,
    openExceptionRegister,
    schema: buildSchema(),
    commandSettlementGap,
    algorithmAlignmentNotes: buildAlgorithmAlignmentNotes(finalSignoffRegister),
    externalReferenceNotes,
    finalLaunchSignoffPack: buildFinalLaunchSignoffPack(finalSignoffRegister),
  };
}

export function write477FinalSignoffArtifacts(
  scenario: Signoff477Scenario = DEFAULT_SCENARIO,
): Signoff477Artifacts {
  const artifacts = build477FinalSignoffArtifacts(scenario);
  writeJson("data/signoff/477_final_signoff_register.json", artifacts.finalSignoffRegister);
  writeJson("data/signoff/477_security_assurance_matrix.json", artifacts.securityAssuranceMatrix);
  writeJson("data/signoff/477_clinical_safety_case_delta.json", artifacts.clinicalSafetyCaseDelta);
  writeJson(
    "data/signoff/477_privacy_dpia_and_records_matrix.json",
    artifacts.privacyDpiaAndRecordsMatrix,
  );
  writeJson(
    "data/signoff/477_regulatory_and_dtac_evidence_matrix.json",
    artifacts.regulatoryAndDtacEvidenceMatrix,
  );
  writeJson(
    "data/signoff/477_accessibility_and_usability_attestation.json",
    artifacts.accessibilityAndUsabilityAttestation,
  );
  writeJson(
    "data/signoff/477_supplier_and_dependency_signoff_register.json",
    artifacts.supplierAndDependencySignoffRegister,
  );
  writeJson("data/signoff/477_open_exception_register.json", artifacts.openExceptionRegister);
  writeJson("data/contracts/477_final_signoff.schema.json", artifacts.schema);
  writeJson(
    "data/contracts/PROGRAMME_BATCH_473_489_INTERFACE_GAP_477_COMMAND_SETTLEMENT_AUTHORITY.json",
    artifacts.commandSettlementGap,
  );
  writeJson("data/analysis/477_external_reference_notes.json", artifacts.externalReferenceNotes);
  writeText("data/analysis/477_algorithm_alignment_notes.md", artifacts.algorithmAlignmentNotes);
  writeText("docs/assurance/477_final_launch_signoff_pack.md", artifacts.finalLaunchSignoffPack);
  return artifacts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const scenario = (process.argv[2] as Signoff477Scenario | undefined) ?? DEFAULT_SCENARIO;
  write477FinalSignoffArtifacts(scenario);
  console.log(`Task 477 final signoff artifacts written for scenario ${scenario}.`);
}
