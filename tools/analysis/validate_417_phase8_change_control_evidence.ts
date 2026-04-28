import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "packages/domains/assistive_assurance/package.json",
  "packages/domains/assistive_assurance/project.json",
  "packages/domains/assistive_assurance/tsconfig.json",
  "packages/domains/assistive_assurance/README.md",
  "packages/domains/assistive_assurance/src/index.ts",
  "services/command-api/migrations/417_phase8_change_control_evidence_pipeline.sql",
  "docs/backend/417_phase8_change_control_evidence_pipeline_spec.md",
  "docs/backend/417_phase8_release_and_regulatory_evidence_topology.mmd",
  "data/contracts/417_change_control_evidence_pipeline_contract.json",
  "data/analysis/417_algorithm_alignment_notes.md",
  "data/analysis/417_external_reference_notes.md",
  "data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_CHANGE_CONTROL_EVIDENCE_PIPELINE.json",
  "tests/unit/417_change_classification_and_regulatory_trigger_routing.spec.ts",
  "tests/integration/417_release_candidate_approval_and_baseline_freshness.spec.ts",
  "tests/integration/417_rollback_bundle_and_release_action_settlement.spec.ts",
  "tests/integration/417_test_helpers.ts",
  "tools/analysis/validate_417_phase8_change_control_evidence.ts",
] as const;

const REQUIRED_SERVICES = [
  "ChangeImpactAssessmentService",
  "RFCBundleAssembler",
  "AssuranceBaselineSnapshotService",
  "ReleaseApprovalGraphService",
  "RollbackReadinessBundleService",
  "AssuranceFreezeStateService",
  "AssistiveReleaseActionService",
  "AssistiveRegulatoryEvidenceExporter",
] as const;

const REQUIRED_OBJECTS = [
  "ModelChangeRequest",
  "ChangeImpactAssessment",
  "RFCBundle",
  "SubprocessorAssuranceRef",
  "MedicalDeviceAssessmentRef",
  "SafetyCaseDelta",
  "AssuranceBaselineSnapshot",
  "ReleaseApprovalGraph",
  "RollbackReadinessBundle",
  "AssuranceFreezeState",
  "AssistiveReleaseActionRecord",
  "AssistiveReleaseActionSettlement",
  "AssistiveRegulatoryEvidenceExport",
  "AssistiveAssuranceAuditRecord",
] as const;

const REQUIRED_MARKERS = [
  "change_impact_from_real_deltas",
  "exact_regulatory_trigger_routing",
  "im1_not_ai_specific_technical_assurance",
  "baseline_snapshot_pins_guidance_versions",
  "stale_baseline_blocks_promotion",
  "no_self_approval_and_independent_safety_review",
  "rollback_readiness_required_for_promotion",
  "release_actions_bind_exact_candidate_hashes",
  "supplier_drift_opens_assurance_freeze",
  "governed_evidence_exports_only",
  "medical_device_boundary_reassessment_required",
  "approval_graph_covers_all_active_triggers",
] as const;

const REQUIRED_CHANGE_CLASSES = [
  "copy_template_only",
  "prompt_or_threshold",
  "model_version",
  "subprocessor_or_inference_host",
  "capability_expansion",
  "intended_use",
  "regulatory_posture",
] as const;

const REQUIRED_RELEASE_ACTIONS = ["approve", "promote", "freeze", "unfreeze", "rollback"] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/assessment-criteria-assessed-section/",
  "https://digital.nhs.uk/developer/guides-and-documentation/introduction-to-healthcare-technology/clinical-safety",
  "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160",
  "https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/review-of-digital-clinical-safety-standards-dcb0129-and-dcb0160",
  "https://digital.nhs.uk/developer/api-catalogue/gp-connect-access-record-structured-fhir/clinical-assurance-process-details",
  "https://www.england.nhs.uk/long-read/guidance-on-the-use-of-ai-enabled-ambient-scribing-products-in-health-and-care-settings/",
  "https://www.gov.uk/government/publications/software-and-artificial-intelligence-ai-as-a-medical-device",
  "https://www.gov.uk/government/publications/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd/crafting-an-intended-purpose-in-the-context-of-software-as-a-medical-device-samd",
  "https://www.gov.uk/government/publications/predetermined-change-control-plans-for-machine-learning-enabled-medical-devices-guiding-principles",
  "https://www.gov.uk/government/publications/impact-of-ai-on-the-regulation-of-medical-products/impact-of-ai-on-the-regulation-of-medical-products",
] as const;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  for (const relativePath of REQUIRED_FILES) {
    invariant(
      fs.existsSync(path.join(ROOT, relativePath)),
      `MISSING_REQUIRED_FILE:${relativePath}`,
    );
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:417-phase8-change-control-evidence"] ===
      "pnpm exec tsx ./tools/analysis/validate_417_phase8_change_control_evidence.ts",
    "package.json missing validate:417-phase8-change-control-evidence script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_416_phase8_track_backend_build_assistive_freeze_disposition_and_policy_freshness_invalidations/m.test(
      checklist,
    ),
    "Checklist task 416 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_417_phase8_track_backend_build_dtac_dcb_safety_rfc_and_change_control_evidence_pipeline/m.test(
      checklist,
    ),
    "Checklist task 417 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGateAndGap();
  validateRuntimePackage();
  validateRuntimeContract();
  validateMigration();
  validateDocsAndNotes();

  console.log("417 phase8 change-control evidence pipeline validated.");
}

function validateUpstreamGateAndGap(): void {
  for (const upstream of [
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/410_capability_control_plane_contract.json",
    "data/contracts/414_replayable_provenance_and_trainability_contract.json",
    "data/contracts/415_monitoring_and_trust_projection_contract.json",
    "data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json",
  ]) {
    invariant(
      fs.existsSync(path.join(ROOT, upstream)),
      `417 requires upstream artifact ${upstream}.`,
    );
  }

  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track417 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find(
    (track) => track.trackId === "par_417",
  );
  invariant(track417, "403 registry missing par_417.");
  invariant(
    track417.readinessState === "blocked",
    "Static 403 registry is expected to still mark par_417 blocked.",
  );
  invariant(
    asArray(track417.blockingRefs, "track417.blockingRefs").includes(
      "GAP403_417_REQUIRES_405_414_416",
    ),
    "par_417 blocker ref drifted.",
  );

  const gap = readJson<{
    taskId?: string;
    missingSurface?: string;
    temporaryFallback?: string;
    followUpAction?: string;
  }>("data/analysis/PHASE8_BATCH_412_419_INTERFACE_GAP_CHANGE_CONTROL_EVIDENCE_PIPELINE.json");
  invariant(gap.taskId === "par_417", "417 gap note task id drifted.");
  requireIncludes(String(gap.missingSurface), "GAP403_417_REQUIRES_405_414_416", "417 gap note");
  for (const fallbackRef of [
    "data/contracts/405_assistive_release_candidate_contracts.json",
    "data/contracts/414_replayable_provenance_and_trainability_contract.json",
    "data/contracts/416_freeze_disposition_and_freshness_invalidations_contract.json",
  ]) {
    requireIncludes(String(gap.temporaryFallback), fallbackRef, "417 gap fallback");
  }
  requireIncludes(String(gap.followUpAction), "403_track_launch_packet_417", "417 gap follow-up");
}

function validateRuntimePackage(): void {
  const packageJson = readJson<{ name?: string; scripts?: Record<string, string> }>(
    "packages/domains/assistive_assurance/package.json",
  );
  invariant(
    packageJson.name === "@vecells/domain-assistive-assurance",
    "Assistive assurance package name drifted.",
  );
  invariant(
    packageJson.scripts?.typecheck === "tsc -p tsconfig.json --noEmit",
    "Assistive assurance typecheck script missing.",
  );
  invariant(
    readText("tsconfig.base.json").includes('"@vecells/domain-assistive-assurance"'),
    "tsconfig.base.json missing @vecells/domain-assistive-assurance path.",
  );

  const source = readText("packages/domains/assistive_assurance/src/index.ts");
  for (const serviceName of REQUIRED_SERVICES) {
    invariant(source.includes(`class ${serviceName}`), `Runtime source missing ${serviceName}.`);
  }
  for (const objectName of REQUIRED_OBJECTS) {
    invariant(source.includes(objectName), `Runtime source missing ${objectName}.`);
  }
  for (const marker of REQUIRED_MARKERS) {
    invariant(source.includes(marker), `Runtime source missing invariant marker ${marker}.`);
  }
  for (const changeClass of REQUIRED_CHANGE_CLASSES) {
    requireIncludes(source, changeClass, "417 runtime source change classes");
  }
  for (const action of REQUIRED_RELEASE_ACTIONS) {
    requireIncludes(source, action, "417 runtime source release actions");
  }
  for (const requiredSnippet of [
    "createAssistiveAssurancePlane",
    "stableAssistiveAssuranceHash",
    "regulatoryFlagsFor",
    "requiredRolesForAssessment",
    "rollbackBlockers",
    "assuranceFreezeBlockers",
    "settlementBlockers",
    "artifactPresentationPolicyRef",
    "outboundNavigationGrantRef",
    "copy_template_only_claim_has_material_delta",
  ]) {
    requireIncludes(source, requiredSnippet, "417 runtime source");
  }
}

function validateRuntimeContract(): void {
  const contract = readJson<{
    taskId?: string;
    schemaVersion?: string;
    services?: JsonRecord[];
    persistedObjects?: unknown[];
    changeClassificationPolicy?: JsonRecord;
    regulatoryTriggerPolicy?: JsonRecord;
    baselinePolicy?: JsonRecord;
    approvalPolicy?: JsonRecord;
    releaseActionPolicy?: JsonRecord;
    laterConsumers?: unknown[];
    invariants?: JsonRecord[];
  }>("data/contracts/417_change_control_evidence_pipeline_contract.json");

  invariant(contract.taskId === "par_417", "417 runtime contract task id drifted.");
  invariant(
    contract.schemaVersion === "417.change-control-evidence-pipeline.v1",
    "417 runtime contract schema version drifted.",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.services, "contract.services").map((service) =>
      String(service.serviceName),
    ),
    REQUIRED_SERVICES,
    "417 services",
  );
  requireExactSuperset(
    asStringArray(contract.persistedObjects, "contract.persistedObjects"),
    REQUIRED_OBJECTS,
    "417 persisted objects",
  );
  requireExactSuperset(
    asStringArray(contract.changeClassificationPolicy?.allowedClasses, "allowedClasses"),
    REQUIRED_CHANGE_CLASSES,
    "417 change classes",
  );
  requireIncludes(
    JSON.stringify(contract.regulatoryTriggerPolicy),
    "im1AndScalTriggers",
    "417 trigger policy",
  );
  requireIncludes(
    JSON.stringify(contract.regulatoryTriggerPolicy),
    "localTechnicalAssuranceIsSeparateFromIM1",
    "417 trigger policy",
  );
  requireIncludes(
    JSON.stringify(contract.baselinePolicy),
    "staleStatesBlockPromotion",
    "417 baseline policy",
  );
  requireIncludes(JSON.stringify(contract.approvalPolicy), "noSelfApproval", "417 approval policy");
  requireExactSuperset(
    asStringArray(contract.releaseActionPolicy?.allowedActions, "allowedActions"),
    REQUIRED_RELEASE_ACTIONS,
    "417 release actions",
  );
  requireExactSuperset(
    asStringArray(contract.laterConsumers, "contract.laterConsumers"),
    ["418", "427", "428", "429", "430", "431", "440"],
    "417 later consumers",
  );
  requireExactSuperset(
    asArray<JsonRecord>(contract.invariants, "contract.invariants").map((entry) =>
      String(entry.code),
    ),
    REQUIRED_MARKERS,
    "417 invariants",
  );
}

function validateMigration(): void {
  const migration = readText(
    "services/command-api/migrations/417_phase8_change_control_evidence_pipeline.sql",
  );
  for (const tableName of [
    "model_change_request",
    "change_impact_assessment",
    "rfc_bundle",
    "subprocessor_assurance_ref",
    "medical_device_assessment_ref",
    "safety_case_delta",
    "assurance_baseline_snapshot",
    "release_approval_graph",
    "rollback_readiness_bundle",
    "assurance_freeze_state",
    "assistive_release_action_record",
    "assistive_release_action_settlement",
    "assistive_regulatory_evidence_export",
    "assistive_assurance_audit_record",
  ]) {
    requireIncludes(migration, tableName, "417 migration");
  }
  for (const constraint of [
    "model_change_request_candidate_hash_required",
    "change_impact_from_real_deltas",
    "exact_regulatory_trigger_routing",
    "medical_device_boundary_reassessment_required",
    "im1_not_ai_specific_technical_assurance",
    "supplier_assurance_current_or_freeze",
    "medical_device_assessment_refs_only",
    "safety_case_delta_trace_required",
    "baseline_snapshot_pins_guidance_versions",
    "stale_baseline_blocks_promotion",
    "no_self_approval_and_independent_safety_review",
    "approval_graph_covers_all_active_triggers",
    "rollback_readiness_required_for_promotion",
    "supplier_drift_opens_assurance_freeze",
    "release_actions_bind_exact_candidate_hashes",
    "governed_evidence_exports_only",
    "assistive_assurance_phi_safe_refs_only",
  ]) {
    requireIncludes(migration, constraint, "417 migration constraints");
  }
}

function validateDocsAndNotes(): void {
  const spec = readText("docs/backend/417_phase8_change_control_evidence_pipeline_spec.md");
  for (const serviceName of REQUIRED_SERVICES) {
    requireIncludes(spec, serviceName, "417 backend spec");
  }
  for (const phrase of [
    "Change Classes",
    "Baseline And Approval",
    "Rollback And Freeze",
    "Release Actions",
    "Evidence Export",
    "IM1 pairing",
  ]) {
    requireIncludes(spec, phrase, "417 backend spec");
  }

  const topology = readText("docs/backend/417_phase8_release_and_regulatory_evidence_topology.mmd");
  for (const node of [
    "405 AssistiveReleaseCandidate",
    "ChangeImpactAssessment",
    "AssuranceBaselineSnapshot",
    "SubprocessorAssuranceRef",
    "SafetyCaseDelta",
    "MedicalDeviceAssessmentRef",
    "RFCBundle",
    "ReleaseApprovalGraph",
    "RollbackReadinessBundle",
    "AssuranceFreezeState",
    "AssistiveReleaseActionRecord",
    "AssistiveReleaseActionSettlement",
    "AssistiveRegulatoryEvidenceExport",
  ]) {
    requireIncludes(topology, node, "417 topology");
  }

  const algorithmNotes = readText("data/analysis/417_algorithm_alignment_notes.md");
  for (const phrase of [
    "blueprint/phase-8-the-assistive-layer.md",
    "validated outputs from `405`, `410`, `414`, `415`, and `416`",
    "ChangeImpactAssessmentService",
    "AssuranceBaselineSnapshotService",
    "ReleaseApprovalGraphService",
    "AssistiveReleaseActionService",
    "IM1 packaging is represented as due-diligence",
  ]) {
    requireIncludes(algorithmNotes, phrase, "417 algorithm notes");
  }

  const externalNotes = readText("data/analysis/417_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    requireIncludes(externalNotes, url, "417 external reference notes");
  }
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function asArray<T>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function asStringArray(value: unknown, label: string): string[] {
  return asArray<unknown>(value, label).map((entry) => String(entry));
}

function requireExactSuperset(
  actual: readonly string[],
  expected: readonly string[],
  label: string,
): void {
  for (const entry of expected) {
    invariant(actual.includes(entry), `${label} missing ${entry}.`);
  }
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
