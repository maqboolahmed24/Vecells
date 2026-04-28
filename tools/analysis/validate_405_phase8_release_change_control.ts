import fs from "node:fs";
import path from "node:path";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "docs/contracts/405_phase8_release_candidate_and_change_control_contract.md",
  "docs/contracts/405_phase8_regulatory_trigger_matrix.md",
  "docs/contracts/405_phase8_approval_graph_and_rollback_topology.mmd",
  "data/contracts/405_assistive_release_candidate_contracts.json",
  "data/contracts/405_regulatory_change_control_rules.json",
  "data/contracts/405_release_approval_graph_contract.json",
  "data/contracts/405_rollback_and_assurance_freeze_contracts.json",
  "data/analysis/405_algorithm_alignment_notes.md",
  "data/analysis/405_external_reference_notes.md",
  "data/analysis/405_dependency_and_gap_register.json",
  "tools/analysis/validate_405_phase8_release_change_control.ts",
] as const;

const REQUIRED_OBJECTS = [
  "ModelChangeRequest",
  "RFCBundle",
  "MedicalDeviceAssessmentRef",
  "SafetyCaseDelta",
  "SubprocessorAssuranceRef",
  "AssistiveReleaseCandidate",
  "ChangeImpactAssessment",
  "ReleaseApprovalGraph",
  "AssuranceBaselineSnapshot",
  "RollbackReadinessBundle",
  "AssuranceFreezeState",
  "AssistiveReleaseActionRecord",
] as const;

const REGULATORY_OUTPUTS = [
  "im1RfcRequired",
  "scalUpdateRequired",
  "dtacDeltaRequired",
  "dcb0129DeltaRequired",
  "dcb0160DependencyNoteRequired",
  "dpiaDeltaRequired",
  "mhraAssessmentRequired",
  "medicalDeviceReassessmentRequired",
] as const;

const OFFICIAL_REFERENCE_URLS = [
  "https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration",
  "https://digital.nhs.uk/developer/assurance/scal-process-for-apis-and-services",
  "https://digital.nhs.uk/developer/assurance",
  "https://www.england.nhs.uk/publication/guidance-on-the-use-of-ai-enabled-ambient-scribing-products/",
  "https://transform.england.nhs.uk/key-tools-and-info/digital-technology-assessment-criteria-dtac/",
  "https://digitalregulations.innovation.nhs.uk/regulations-and-guidance-for-developers/all-developers-guidance/using-the-digital-technology-assessment-criteria-dtac/",
  "https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards",
  "https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160/step-by-step-guidance",
  "https://www.gov.uk/government/publications/software-and-artificial-intelligence-ai-as-a-medical-device/software-and-artificial-intelligence-ai-as-a-medical-device",
  "https://digitalregulations.innovation.nhs.uk/regulations-and-guidance-for-developers/all-developers-guidance/improving-or-updating-medical-devices-after-deployment/",
] as const;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  for (const relativePath of REQUIRED_FILES) {
    invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:405-phase8-release-change-control"] ===
      "pnpm exec tsx ./tools/analysis/validate_405_phase8_release_change_control.ts",
    "package.json missing validate:405-phase8-release-change-control script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(
    /^- \[X\] par_404_phase8_track_gate_freeze_evaluation_corpus_shadow_mode_and_feedback_eligibility_contracts/m.test(
      checklist,
    ),
    "Checklist task 404 must be complete.",
  );
  invariant(
    /^- \[(?:-|X)\] par_405_phase8_track_gate_freeze_release_candidate_safety_case_and_regulatory_change_control_rules/m.test(
      checklist,
    ),
    "Checklist task 405 must be claimed or complete while this validator runs.",
  );

  validateUpstreamGate();

  const release = readJson<{
    taskId?: string;
    schemaVersion?: string;
    objectContracts?: JsonRecord[];
  }>("data/contracts/405_assistive_release_candidate_contracts.json");
  const regulatory = readJson<{
    taskId?: string;
    objectContracts?: JsonRecord[];
  }>("data/contracts/405_regulatory_change_control_rules.json");
  const approval = readJson<{
    taskId?: string;
    objectContracts?: JsonRecord[];
  }>("data/contracts/405_release_approval_graph_contract.json");
  const rollback = readJson<{
    taskId?: string;
    objectContracts?: JsonRecord[];
  }>("data/contracts/405_rollback_and_assurance_freeze_contracts.json");

  invariant(release.taskId === "par_405", "Release candidate contract task id drifted.");
  invariant(
    release.schemaVersion === "405.assistive-release-candidate-contracts.v1",
    "Release candidate schema version drifted.",
  );
  invariant(regulatory.taskId === "par_405", "Regulatory rules task id drifted.");
  invariant(approval.taskId === "par_405", "Approval graph task id drifted.");
  invariant(rollback.taskId === "par_405", "Rollback/freeze contract task id drifted.");

  const allContracts = [
    ...asArray<JsonRecord>(release.objectContracts, "release.objectContracts"),
    ...asArray<JsonRecord>(regulatory.objectContracts, "regulatory.objectContracts"),
    ...asArray<JsonRecord>(approval.objectContracts, "approval.objectContracts"),
    ...asArray<JsonRecord>(rollback.objectContracts, "rollback.objectContracts"),
  ];
  requireExactSuperset(
    allContracts.map((contract) => String(contract.objectName)),
    [...REQUIRED_OBJECTS],
    "405 required object contracts",
  );

  validateReleaseCandidateContract(release, allContracts);
  validateRegulatoryRules(regulatory);
  validateApprovalGraph(approval);
  validateRollbackAndFreeze(rollback);
  validateDocsAndNotes();

  console.log("405 phase8 release candidate and change-control contracts validated.");
}

function validateUpstreamGate(): void {
  const registry = readJson<{
    launchVerdict?: string;
    tracks?: JsonRecord[];
  }>("data/contracts/403_phase8_track_readiness_registry.json");
  invariant(registry.launchVerdict === "open_phase8_now", "403 gate must open Phase 8.");
  const track405 = asArray<JsonRecord>(registry.tracks, "registry.tracks").find((track) => track.trackId === "par_405");
  invariant(track405, "403 registry missing par_405.");
  invariant(track405.readinessState === "ready", "par_405 must be ready in 403 registry.");
  invariant(asArray(track405.blockingRefs, "track405.blockingRefs").length === 0, "par_405 must have no blockers.");

  const packet405 = readJson<{
    trackId?: string;
    readyToLaunch?: boolean;
    launchState?: string;
    ownedInterfaces?: unknown[];
  }>("data/launchpacks/403_track_launch_packet_405.json");
  invariant(packet405.trackId === "par_405", "405 launch packet track id drifted.");
  invariant(packet405.readyToLaunch === true, "405 launch packet must be ready.");
  invariant(packet405.launchState === "open_now", "405 launch packet must be open_now.");
  requireExactSuperset(
    asStringArray(packet405.ownedInterfaces, "packet405.ownedInterfaces"),
    [
      "ModelChangeRequest",
      "RFCBundle",
      "MedicalDeviceAssessmentRef",
      "SafetyCaseDelta",
      "SubprocessorAssuranceRef",
      "AssistiveReleaseCandidate",
      "ChangeImpactAssessment",
      "ReleaseApprovalGraph",
      "RollbackReadinessBundle",
      "AssuranceFreezeState",
    ],
    "405 launch packet owned interfaces",
  );

  for (const required404 of [
    "data/contracts/404_assistive_evaluation_contracts.json",
    "data/contracts/404_feedback_eligibility_contracts.json",
    "data/contracts/404_shadow_mode_evidence_requirements.json",
  ]) {
    invariant(fs.existsSync(path.join(ROOT, required404)), `405 requires 404 artifact ${required404}.`);
  }
}

function validateReleaseCandidateContract(release: JsonRecord, allContracts: JsonRecord[]): void {
  const candidate = requiredByKey(allContracts, "objectName", "AssistiveReleaseCandidate", "AssistiveReleaseCandidate");
  requireExactSuperset(
    asStringArray(candidate.requiredFields, "AssistiveReleaseCandidate.requiredFields"),
    [
      "capabilityCode",
      "modelVersionRef",
      "promptPackageRef",
      "compiledPolicyBundleRef",
      "outputSchemaBundleRef",
      "calibrationBundleRef",
      "thresholdSetRef",
      "runtimePublicationBundleRef",
      "surfaceRouteContractRefs",
      "recoveryDispositionSetRef",
      "evaluationCorpusRef",
      "rollbackBundleRef",
      "assuranceBaselineSnapshotRef",
      "candidateHash",
    ],
    "AssistiveReleaseCandidate required fields",
  );
  requireExactSuperset(
    asStringArray(candidate.states, "AssistiveReleaseCandidate.states"),
    ["frozen", "approved", "promotion_ready", "promotion_blocked", "frozen_by_assurance", "rolled_back"],
    "AssistiveReleaseCandidate states",
  );
  requireIncludes(JSON.stringify(candidate.dependencyRules), "candidateHash is computed", "AssistiveReleaseCandidate dependency rules");
  requireIncludes(JSON.stringify(candidate.dependencyRules), "promotion_ready requires", "AssistiveReleaseCandidate dependency rules");

  const impact = requiredByKey(allContracts, "objectName", "ChangeImpactAssessment", "ChangeImpactAssessment");
  requireExactSuperset(
    asStringArray(impact.requiredFields, "ChangeImpactAssessment.requiredFields"),
    [...REGULATORY_OUTPUTS, "medicalPurposeBoundaryState", "workflowDecisionDelta", "intendedUseDelta"],
    "ChangeImpactAssessment required fields",
  );
  requireIncludes(JSON.stringify(impact.dependencyRules), "material AI functional enhancement", "ChangeImpactAssessment dependency rules");

  const subprocessor = requiredByKey(allContracts, "objectName", "SubprocessorAssuranceRef", "SubprocessorAssuranceRef");
  requireExactSuperset(
    asStringArray(subprocessor.states, "SubprocessorAssuranceRef.states"),
    ["current", "stale", "drifted", "suspended", "withdrawn"],
    "SubprocessorAssuranceRef states",
  );

  const boundary = release.medicalPurposeBoundary as JsonRecord | undefined;
  invariant(boundary, "Release contract missing medicalPurposeBoundary.");
  requireExactSuperset(
    asStringArray(boundary.boundaryStates, "medicalPurposeBoundary.boundaryStates"),
    [
      "transcription_documentation_assistance",
      "higher_function_summarisation_structured_inference",
      "endpoint_suggestion_clinically_consequential_decision_support",
      "regulatory_posture_change",
    ],
    "medical purpose boundary states",
  );
  invariant(boundary.failClosedState === "regulatory_posture_change", "Medical purpose boundary must fail closed.");

  requireExactSuperset(
    asStringArray(release.promotionBlockers, "release.promotionBlockers"),
    [
      "assurance_baseline_stale",
      "supplier_assurance_stale",
      "supplier_suspended",
      "rollback_bundle_not_ready",
      "runtime_publication_stale",
      "regulatory_trigger_unresolved",
    ],
    "promotion blockers",
  );
  requireExactSuperset(
    asArray<JsonRecord>(release.invariants, "release.invariants").map((entry) => String(entry.invariantId)),
    ["INV405_001", "INV405_002", "INV405_003", "INV405_004", "INV405_005", "INV405_006", "INV405_007", "INV405_008"],
    "release invariants",
  );
}

function validateRegulatoryRules(regulatory: JsonRecord): void {
  requireExactSet(asStringArray(regulatory.decisionOutputs, "regulatory.decisionOutputs"), [...REGULATORY_OUTPUTS], "regulatory decision outputs");

  const triggerMatrix = asArray<JsonRecord>(regulatory.triggerMatrix, "regulatory.triggerMatrix");
  requireExactSuperset(
    triggerMatrix.map((row) => String(row.changeType)),
    [
      "template_copy_only_no_behavior",
      "prompt_template_change",
      "threshold_calibration_policy_change",
      "model_version_change",
      "subprocessor_or_inference_host_change",
      "capability_expansion",
      "intended_use_change",
      "endpoint_suggestion_or_decision_support",
      "regulatory_posture_change",
      "safety_incident_or_hazard_response",
    ],
    "regulatory trigger matrix rows",
  );
  for (const row of triggerMatrix) {
    const outputs = row.decisionOutputs as JsonRecord | undefined;
    invariant(outputs, `${row.changeType} missing decisionOutputs.`);
    for (const output of REGULATORY_OUTPUTS) {
      invariant(output in outputs, `${row.changeType} missing ${output}.`);
    }
  }

  const endpoint = requiredByKey(triggerMatrix, "changeType", "endpoint_suggestion_or_decision_support", "endpoint trigger row");
  const endpointOutputs = endpoint.decisionOutputs as JsonRecord;
  for (const output of REGULATORY_OUTPUTS) {
    invariant(endpointOutputs[output] === true, `endpoint_suggestion_or_decision_support must require ${output}.`);
  }

  const regulatoryPosture = requiredByKey(triggerMatrix, "changeType", "regulatory_posture_change", "regulatory posture row");
  const postureOutputs = regulatoryPosture.decisionOutputs as JsonRecord;
  for (const output of REGULATORY_OUTPUTS) {
    invariant(postureOutputs[output] === true, `regulatory_posture_change must require ${output}.`);
  }

  requireIncludes(JSON.stringify(regulatory.failClosedRules), "unclassified change types route as regulatory_posture_change", "fail closed rules");
  requireExactSuperset(
    asArray<JsonRecord>(regulatory.invariants, "regulatory.invariants").map((entry) => String(entry.invariantId)),
    ["INV405_REG_001", "INV405_REG_002", "INV405_REG_003"],
    "regulatory invariants",
  );
}

function validateApprovalGraph(approval: JsonRecord): void {
  const contracts = asArray<JsonRecord>(approval.objectContracts, "approval.objectContracts");
  const graph = requiredByKey(contracts, "objectName", "ReleaseApprovalGraph", "ReleaseApprovalGraph");
  requireExactSuperset(
    asStringArray(graph.requiredFields, "ReleaseApprovalGraph.requiredFields"),
    [
      "candidateHash",
      "assuranceBaselineSnapshotRef",
      "requiredApproverRoles",
      "noSelfApprovalState",
      "independentSafetyReviewerRef",
      "deploymentApproverRef",
      "signoffRefs",
    ],
    "ReleaseApprovalGraph required fields",
  );
  requireExactSuperset(
    asStringArray(graph.states, "ReleaseApprovalGraph.states"),
    ["awaiting_signoff", "approved", "blocked", "invalidated"],
    "ReleaseApprovalGraph states",
  );

  const action = requiredByKey(contracts, "objectName", "AssistiveReleaseActionRecord", "AssistiveReleaseActionRecord");
  requireExactSuperset(
    asStringArray(action.requiredFields, "AssistiveReleaseActionRecord.requiredFields"),
    [
      "routeIntentBindingRef",
      "commandActionRecordRef",
      "surfaceRouteContractRef",
      "surfacePublicationRef",
      "runtimePublicationBundleRef",
      "transitionEnvelopeRef",
      "releaseRecoveryDispositionRef",
      "idempotencyKey",
      "settledAt",
    ],
    "AssistiveReleaseActionRecord fields",
  );

  const settlement = requiredByKey(contracts, "objectName", "AssistiveReleaseActionSettlement", "AssistiveReleaseActionSettlement");
  requireExactSuperset(
    asStringArray(settlement.states, "AssistiveReleaseActionSettlement.states"),
    ["approved", "promoted", "frozen", "unfrozen", "rollback_started", "blocked_policy"],
    "AssistiveReleaseActionSettlement states",
  );
  requireIncludes(JSON.stringify(settlement.dependencyRules), "UI acknowledgement does not imply settlement", "settlement dependency rules");

  const roleTopology = asArray<JsonRecord>(approval.roleTopology, "approval.roleTopology");
  requireExactSuperset(
    roleTopology.map((role) => String(role.approverRole)),
    [
      "implementation_maker",
      "requester",
      "product_owner",
      "independent_clinical_safety_reviewer",
      "deployment_approver",
      "information_governance_reviewer",
      "security_reviewer",
      "regulatory_owner",
    ],
    "approval role topology",
  );
  requireIncludes(JSON.stringify(approval.noSelfApprovalRules), "implementation_maker may not satisfy", "no-self-approval rules");
  requireIncludes(JSON.stringify(approval.actionSettlementRules), "commandActionRecordRef is not completion", "action settlement rules");
}

function validateRollbackAndFreeze(rollback: JsonRecord): void {
  const contracts = asArray<JsonRecord>(rollback.objectContracts, "rollback.objectContracts");
  const bundle = requiredByKey(contracts, "objectName", "RollbackReadinessBundle", "RollbackReadinessBundle");
  requireExactSuperset(
    asStringArray(bundle.requiredFields, "RollbackReadinessBundle.requiredFields"),
    [
      "rollbackTargetRef",
      "dataCompatibilityState",
      "policyCompatibilityState",
      "runtimePublicationCompatibilityState",
      "schemaCompatibilityState",
      "killSwitchPlanRef",
      "operatorRunbookRef",
      "verificationEvidenceRefs",
      "bundleState",
    ],
    "RollbackReadinessBundle fields",
  );
  requireIncludes(asStringArray(bundle.states, "RollbackReadinessBundle.states"), "ready", "RollbackReadinessBundle states");
  requireIncludes(JSON.stringify(bundle.dependencyRules), "ready is required before promotion", "RollbackReadinessBundle dependency rules");

  const freeze = requiredByKey(contracts, "objectName", "AssuranceFreezeState", "AssuranceFreezeState");
  requireExactSuperset(
    asStringArray(freeze.states, "AssuranceFreezeState.states"),
    ["clear", "promotion_blocked", "rollout_frozen", "rollback_required", "lift_pending", "lifted"],
    "AssuranceFreezeState states",
  );
  requireExactSuperset(
    asStringArray(freeze.requiredFields, "AssuranceFreezeState.requiredFields"),
    ["freezeReasonCode", "triggerRef", "liftCriteria", "freezeState", "releaseRecoveryDispositionRef"],
    "AssuranceFreezeState fields",
  );

  requireExactSuperset(
    asArray<JsonRecord>(rollback.freezeTriggers, "rollback.freezeTriggers").map((trigger) => String(trigger.freezeReasonCode)),
    [
      "assurance_baseline_stale",
      "supplier_assurance_stale",
      "supplier_suspended_or_withdrawn",
      "runtime_publication_drift",
      "surface_publication_drift",
      "rollback_bundle_not_ready",
      "approval_graph_invalidated",
      "regulatory_blocker",
      "incident_spike_or_threshold_breach",
    ],
    "freeze triggers",
  );
  requireExactSuperset(
    asStringArray(rollback.rollbackProofRequirements, "rollback.rollbackProofRequirements"),
    [
      "rollbackTargetRef points to an approved or previously promoted candidate compatible with the active route family",
      "dataCompatibilityState is compatible",
      "policyCompatibilityState is compatible",
      "runtimePublicationCompatibilityState is compatible",
      "schemaCompatibilityState is compatible",
      "killSwitchPlanRef is verified",
      "operatorRunbookRef is current",
    ],
    "rollback proof requirements",
  );
}

function validateDocsAndNotes(): void {
  const contractDoc = readText("docs/contracts/405_phase8_release_candidate_and_change_control_contract.md");
  for (const needle of [
    "AssistiveReleaseCandidate",
    "ModelChangeRequest",
    "ChangeImpactAssessment",
    "ReleaseApprovalGraph",
    "RollbackReadinessBundle",
    "AssuranceFreezeState",
    "candidateHash",
    "no-self-approval",
    "SubprocessorAssuranceRef",
  ]) {
    requireIncludes(contractDoc, needle, "405 contract doc");
  }

  const matrixDoc = readText("docs/contracts/405_phase8_regulatory_trigger_matrix.md");
  for (const needle of ["IM1 RFC", "SCAL update", "DTAC delta", "DCB0129 delta", "DCB0160 note", "DPIA delta", "medical-device reassessment"]) {
    requireIncludes(matrixDoc, needle, "405 regulatory trigger matrix doc");
  }

  const topology = readText("docs/contracts/405_phase8_approval_graph_and_rollback_topology.mmd");
  for (const needle of ["CandidateFrozen", "ApprovalGraphOpen", "AssuranceFrozen", "RollbackStarted", "RolledBack"]) {
    requireIncludes(topology, needle, "405 approval graph topology");
  }

  const externalNotes = readText("data/analysis/405_external_reference_notes.md");
  for (const url of OFFICIAL_REFERENCE_URLS) {
    requireIncludes(externalNotes, url, "405 external reference notes");
  }
  requireIncludes(externalNotes, "Rejected or constrained", "405 external reference notes");

  const alignmentNotes = readText("data/analysis/405_algorithm_alignment_notes.md");
  requireIncludes(alignmentNotes, "No blocking interface gap remains", "405 algorithm alignment notes");
  requireIncludes(alignmentNotes, "candidateHash", "405 algorithm alignment notes");

  const gapRegister = readJson<{
    blockingGapCount?: number;
    fallbackGapFileRequired?: boolean;
    resolvedInterfaceGaps?: JsonRecord[];
    downstreamContracts?: JsonRecord[];
  }>("data/analysis/405_dependency_and_gap_register.json");
  invariant(gapRegister.blockingGapCount === 0, "405 gap register must have zero blockers.");
  invariant(gapRegister.fallbackGapFileRequired === false, "405 fallback gap file must not be required.");
  invariant(
    asArray<JsonRecord>(gapRegister.resolvedInterfaceGaps, "gapRegister.resolvedInterfaceGaps").length >= 6,
    "405 gap register must document support object resolutions.",
  );
  requireExactSuperset(
    asArray<JsonRecord>(gapRegister.downstreamContracts, "gapRegister.downstreamContracts").map((entry) =>
      String(entry.consumerTaskId),
    ),
    ["par_410", "par_411", "par_415", "par_416", "par_417", "phase8_rollout"],
    "405 downstream gap register contracts",
  );
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function asArray<T = unknown>(value: unknown, label: string): T[] {
  invariant(Array.isArray(value), `${label} must be an array.`);
  return value as T[];
}

function asStringArray(value: unknown, label: string): string[] {
  return asArray<unknown>(value, label).map((entry) => String(entry));
}

function requiredByKey(rows: JsonRecord[], key: string, expected: string, label: string): JsonRecord {
  const row = rows.find((entry) => entry[key] === expected);
  invariant(row, `${label} missing.`);
  return row;
}

function requireExactSet(actual: string[], expected: string[], label: string): void {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  invariant(
    actualSorted.length === expectedSorted.length && expectedSorted.every((value, index) => actualSorted[index] === value),
    `${label} mismatch. Expected ${expectedSorted.join(", ")} got ${actualSorted.join(", ")}.`,
  );
}

function requireExactSuperset(actual: string[], expected: string[], label: string): void {
  for (const expectedValue of expected) {
    requireIncludes(actual, expectedValue, label);
  }
}

function requireIncludes(haystack: string[] | string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
