import { createHash } from "node:crypto";

export type Phase8ExitVerdict = "approved_for_phase9" | "blocked";
export type Phase8ExitEvidenceFreshness = "current" | "missing" | "stale" | "wrong_commit" | "wrong_publication" | "contradictory";
export type Phase8ExitCheckState = "passed" | "failed";
export type Phase8ExitEvidenceStatus =
  | "passed"
  | "complete"
  | "approved"
  | "current"
  | "no_open_defects"
  | "reproducible"
  | "failed"
  | "open"
  | "missing";
export type Phase8ExitEvidenceKind =
  | "test_report"
  | "contract"
  | "safety_case"
  | "rollback_rehearsal"
  | "training_runbook"
  | "incident_path"
  | "defect_log"
  | "validator"
  | "runbook"
  | "analysis";
export type Phase8ExitCheckGroup = "Safety" | "Evaluation" | "Rollout" | "Operations" | "Governance";
export type Phase8ExitDefectSeverity = "sev1" | "sev2" | "sev3" | "sev4";
export type Phase8ExitDefectStatus = "open" | "mitigated" | "closed";

export interface Phase8ExitEvidenceRecord {
  evidenceRef: string;
  title: string;
  kind: Phase8ExitEvidenceKind;
  path?: string;
  command?: string;
  producedByTask: string;
  generatedAt: string;
  expiresAt?: string;
  commitRef?: string;
  publicationBundleRef?: string;
  allowCommitDrift?: boolean;
  allowPublicationDrift?: boolean;
  status: Phase8ExitEvidenceStatus;
  freshnessState?: Phase8ExitEvidenceFreshness;
  exists: boolean;
  contentHash?: string;
  schemaVersion?: string;
  tags?: readonly string[];
  contradictoryWithRefs?: readonly string[];
}

export interface Phase8ExitCheckEvidenceBinding {
  checkId: string;
  evidenceRefs: readonly string[];
}

export interface Phase8ExitDefectRecord {
  defectId: string;
  severity: Phase8ExitDefectSeverity;
  status: Phase8ExitDefectStatus;
  surfaceRef: string;
  summary: string;
}

export interface Phase8ExitGateEvidenceInput {
  schemaVersion: "431.phase8.exit-gate.evidence.v1";
  phase: 8;
  gate: "assistive_layer_completion";
  generatedAt: string;
  commitRef: string;
  publicationBundleRef: string;
  evidenceRecords: readonly Phase8ExitEvidenceRecord[];
  checkEvidenceBindings: readonly Phase8ExitCheckEvidenceBinding[];
  openDefects: readonly Phase8ExitDefectRecord[];
  safetyCaseRefs: readonly string[];
  rollbackRehearsalRefs: readonly string[];
  trainingRunbookRefs: readonly string[];
  incidentPathRefs: readonly string[];
  approverRolesRequired: readonly string[];
  sourceAlgorithmRefs: readonly string[];
  phase9PrerequisiteContractRefs: readonly string[];
  reproducibleCommands: readonly string[];
}

export interface Phase8ExitRequiredCheckDefinition {
  checkId: string;
  title: string;
  group: Phase8ExitCheckGroup;
  sourceBlueprintRef: string;
  failedOwner: string;
}

export interface Phase8ExitRequiredCheckResult extends Phase8ExitRequiredCheckDefinition {
  evidenceRefs: readonly string[];
  evidenceFreshnessState: Phase8ExitEvidenceFreshness;
  state: Phase8ExitCheckState;
  deterministicReason: string;
  ownerIfFailed?: string;
}

export interface Phase8ExitTestReportRef {
  evidenceRef: string;
  path?: string;
  command?: string;
  commitRef?: string;
  contentHash?: string;
}

export interface Phase8ExitPacket {
  phase: 8;
  gate: "assistive_layer_completion";
  verdict: Phase8ExitVerdict;
  generatedAt: string;
  commitRef: string;
  publicationBundleRef: string;
  evaluatorVersion: string;
  evidenceBundleHash: string;
  requiredChecks: readonly Phase8ExitRequiredCheckResult[];
  testReports: readonly Phase8ExitTestReportRef[];
  safetyCaseRefs: readonly string[];
  rollbackRehearsalRefs: readonly string[];
  trainingRunbookRefs: readonly string[];
  incidentPathRefs: readonly string[];
  openDefects: readonly Phase8ExitDefectRecord[];
  blockedReasons: readonly string[];
  approverRolesRequired: readonly string[];
  sourceAlgorithmRefs: readonly string[];
  phase9PrerequisiteContractRefs: readonly string[];
  reproducibleCommands: readonly string[];
}

export const PHASE8_EXIT_GATE_EVALUATOR_VERSION = "phase8-exit-gate-431.v1";

export const REQUIRED_PHASE8_EXIT_CHECKS: readonly Phase8ExitRequiredCheckDefinition[] = [
  {
    checkId: "PH8_EXIT_001",
    title: "No Sev-1 or Sev-2 visible assistive defects remain open",
    group: "Safety",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8I Tests that must all pass before Phase 9",
    failedOwner: "clinical_safety_lead",
  },
  {
    checkId: "PH8_EXIT_002",
    title: "No-autonomous-write policy is proven",
    group: "Safety",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#Phase 8 implementation rules / Rule 1",
    failedOwner: "assistive_control_plane_owner",
  },
  {
    checkId: "PH8_EXIT_003",
    title: "Offline gold-set thresholds are green",
    group: "Evaluation",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8I Tests that must all pass before Phase 9",
    failedOwner: "evaluation_owner",
  },
  {
    checkId: "PH8_EXIT_004",
    title: "Hallucination, citation, red-flag, and false-reassurance regressions are green",
    group: "Evaluation",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
    failedOwner: "evaluation_owner",
  },
  {
    checkId: "PH8_EXIT_005",
    title: "Selective calibration, multicalibration, conformal or bounded-risk targets are green",
    group: "Evaluation",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
    failedOwner: "calibration_owner",
  },
  {
    checkId: "PH8_EXIT_006",
    title: "Shadow-vs-human comparison is stable",
    group: "Evaluation",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
    failedOwner: "shadow_comparison_owner",
  },
  {
    checkId: "PH8_EXIT_007",
    title: "Drift and fairness alerting are live",
    group: "Operations",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8G Monitoring, drift, fairness, and live safety controls",
    failedOwner: "assistive_ops_owner",
  },
  {
    checkId: "PH8_EXIT_008",
    title: "Override, reliance, edit-by-clinician, and audit trails are complete",
    group: "Safety",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8I Tests that must all pass before Phase 9",
    failedOwner: "feedback_chain_owner",
  },
  {
    checkId: "PH8_EXIT_009",
    title: "Stale-output invalidation is proven",
    group: "Safety",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8I Tests that must all pass before Phase 9",
    failedOwner: "freshness_owner",
  },
  {
    checkId: "PH8_EXIT_010",
    title: "Watch-tuple pinning and freeze-disposition behaviour are proven",
    group: "Rollout",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8G AssistiveCapabilityWatchTuple",
    failedOwner: "release_control_owner",
  },
  {
    checkId: "PH8_EXIT_011",
    title: "Rollout-slice-contract and rollout-verdict parity are proven",
    group: "Rollout",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8I AssistiveRolloutSliceContract",
    failedOwner: "rollout_owner",
  },
  {
    checkId: "PH8_EXIT_012",
    title: "Route-family and cohort split tests are green",
    group: "Rollout",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8I Pilot rollout, controlled slices, and formal exit gate",
    failedOwner: "rollout_owner",
  },
  {
    checkId: "PH8_EXIT_013",
    title: "Runtime-publication pinning and recovery-disposition behaviour are proven",
    group: "Rollout",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8H AssistiveReleaseCandidate",
    failedOwner: "runtime_publication_owner",
  },
  {
    checkId: "PH8_EXIT_014",
    title: "Artifact-presentation and outbound-navigation policy behaviour is proven",
    group: "Governance",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8H ArtifactPresentationContract",
    failedOwner: "artifact_policy_owner",
  },
  {
    checkId: "PH8_EXIT_015",
    title: "Assistive UI event and disclosure-fence behaviour is proven",
    group: "Governance",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8H UI observability",
    failedOwner: "telemetry_owner",
  },
  {
    checkId: "PH8_EXIT_016",
    title: "RFC, safety-case, and change-control delta processes are complete",
    group: "Governance",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8H IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control",
    failedOwner: "governance_owner",
  },
  {
    checkId: "PH8_EXIT_017",
    title: "Rollback rehearsal is complete",
    group: "Operations",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8I Tests that must all pass before Phase 9",
    failedOwner: "release_operations_owner",
  },
  {
    checkId: "PH8_EXIT_018",
    title: "Training, runbooks, support paths, and incident escalation paths are complete",
    group: "Operations",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8I Frontend work",
    failedOwner: "operations_support_owner",
  },
  {
    checkId: "PH8_EXIT_019",
    title: "Vendor/project audit logs and safety settings are configured for the non-production model stack",
    group: "Governance",
    sourceBlueprintRef: "blueprint/phase-8-the-assistive-layer.md#8H SubprocessorAssuranceRef",
    failedOwner: "model_platform_owner",
  },
  {
    checkId: "PH8_EXIT_020",
    title: "Generated evidence is reproducible from committed commands",
    group: "Governance",
    sourceBlueprintRef: "prompt/431.md#Required exit checks",
    failedOwner: "release_engineering_owner",
  },
] as const;

const PASSING_STATUSES = new Set<Phase8ExitEvidenceStatus>([
  "passed",
  "complete",
  "approved",
  "current",
  "no_open_defects",
  "reproducible",
]);

const FRESHNESS_RANK: Record<Phase8ExitEvidenceFreshness, number> = {
  current: 0,
  missing: 5,
  stale: 4,
  wrong_commit: 3,
  wrong_publication: 3,
  contradictory: 6,
};

export function evaluatePhase8ExitGate(input: Phase8ExitGateEvidenceInput): Phase8ExitPacket {
  validatePhase8ExitInputShape(input);

  const records = normalizedEvidenceRecords(input.evidenceRecords);
  const duplicateConflicts = detectDuplicateEvidenceConflicts(records);
  const recordByRef = new Map(records.map((record) => [record.evidenceRef, record] as const));
  const bindingsByCheck = new Map(input.checkEvidenceBindings.map((binding) => [binding.checkId, binding] as const));
  const openHighSeverityDefects = input.openDefects.filter(
    (defect) => defect.status === "open" && (defect.severity === "sev1" || defect.severity === "sev2"),
  );

  const requiredChecks: readonly Phase8ExitRequiredCheckResult[] = REQUIRED_PHASE8_EXIT_CHECKS.map((definition) => {
    const binding = bindingsByCheck.get(definition.checkId);
    const evidenceRefs = [...(binding?.evidenceRefs ?? [])].sort();
    const evidenceStates = evidenceRefs.map((evidenceRef) =>
      evaluateEvidenceFreshness(recordByRef.get(evidenceRef), input, duplicateConflicts),
    );
    const missingBinding = !binding || evidenceRefs.length === 0;
    const missingReproducibleCommands =
      definition.checkId === "PH8_EXIT_020" &&
      (input.reproducibleCommands.length === 0 ||
        !input.reproducibleCommands.includes("pnpm test:phase8:exit-gate") ||
        !input.reproducibleCommands.includes("pnpm validate:431-phase8-exit-gate"));
    const highSeverityDefectsOpen = definition.checkId === "PH8_EXIT_001" && openHighSeverityDefects.length > 0;
    const noAutonomousWriteEvidenceMissing =
      definition.checkId === "PH8_EXIT_002" &&
      !evidenceRefs.some((ref) => recordByRef.get(ref)?.tags?.includes("no_autonomous_write"));
    const state = worstFreshness(evidenceStates);
    const failed =
      missingBinding ||
      state !== "current" ||
      highSeverityDefectsOpen ||
      missingReproducibleCommands ||
      noAutonomousWriteEvidenceMissing;

    const resultState: Phase8ExitCheckState = failed ? "failed" : "passed";

    return {
      ...definition,
      evidenceRefs,
      evidenceFreshnessState: missingBinding ? "missing" : state,
      state: resultState,
      deterministicReason: deterministicReasonForCheck({
        definition,
        evidenceRefs,
        missingBinding,
        missingReproducibleCommands,
        highSeverityDefectsOpen,
        noAutonomousWriteEvidenceMissing,
        freshnessState: state,
      }),
      ownerIfFailed: failed ? definition.failedOwner : undefined,
    };
  });

  const blockedReasons = requiredChecks
    .filter((check) => check.state === "failed")
    .map((check) => `${check.checkId}:${check.deterministicReason}`);
  const evidenceBundleHash = buildPhase8ExitEvidenceBundleHash(input, records, requiredChecks);

  return {
    phase: 8,
    gate: "assistive_layer_completion",
    verdict: blockedReasons.length === 0 ? "approved_for_phase9" : "blocked",
    generatedAt: input.generatedAt,
    commitRef: input.commitRef,
    publicationBundleRef: input.publicationBundleRef,
    evaluatorVersion: PHASE8_EXIT_GATE_EVALUATOR_VERSION,
    evidenceBundleHash,
    requiredChecks,
    testReports: records
      .filter((record) => record.kind === "test_report")
      .map((record) => ({
        evidenceRef: record.evidenceRef,
        path: record.path,
        command: record.command,
        commitRef: record.commitRef,
        contentHash: record.contentHash,
      }))
      .sort((left, right) => left.evidenceRef.localeCompare(right.evidenceRef)),
    safetyCaseRefs: [...input.safetyCaseRefs].sort(),
    rollbackRehearsalRefs: [...input.rollbackRehearsalRefs].sort(),
    trainingRunbookRefs: [...input.trainingRunbookRefs].sort(),
    incidentPathRefs: [...input.incidentPathRefs].sort(),
    openDefects: [...input.openDefects].sort((left, right) => left.defectId.localeCompare(right.defectId)),
    blockedReasons,
    approverRolesRequired: [...input.approverRolesRequired].sort(),
    sourceAlgorithmRefs: [...input.sourceAlgorithmRefs].sort(),
    phase9PrerequisiteContractRefs: [...input.phase9PrerequisiteContractRefs].sort(),
    reproducibleCommands: [...input.reproducibleCommands].sort(),
  };
}

export function summarizePhase8ExitPacket(packet: Phase8ExitPacket): string {
  const lines = [
    `# Phase 8 Assistive Layer Exit Gate`,
    "",
    `Verdict: ${packet.verdict}`,
    `Generated at: ${packet.generatedAt}`,
    `Commit: ${packet.commitRef}`,
    `Publication bundle: ${packet.publicationBundleRef}`,
    `Evidence bundle hash: ${packet.evidenceBundleHash}`,
    "",
    "## Required Checks",
    "",
    "| Check | Group | State | Freshness | Evidence | Reason |",
    "| --- | --- | --- | --- | --- | --- |",
    ...packet.requiredChecks.map(
      (check) =>
        `| ${check.checkId} ${check.title} | ${check.group} | ${check.state} | ${check.evidenceFreshnessState} | ${check.evidenceRefs.join(
          "<br>",
        )} | ${check.deterministicReason} |`,
    ),
    "",
    "## Blockers",
    "",
    packet.blockedReasons.length === 0 ? "None." : packet.blockedReasons.map((reason) => `- ${reason}`).join("\n"),
    "",
    "## Reproduce",
    "",
    ...packet.reproducibleCommands.map((command) => `- \`${command}\``),
    "",
    "## Safe Next Action",
    "",
    packet.verdict === "approved_for_phase9"
      ? "Phase 9 may consume this packet as the Phase 8 prerequisite contract."
      : "Do not start Phase 9 implementation against this packet until blockers are cleared and the gate is regenerated.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export function phase8ExitChecksToCsv(packet: Phase8ExitPacket): string {
  const header = "checkId,group,state,freshness,evidenceRefs,ownerIfFailed,reason";
  const rows = packet.requiredChecks.map((check) =>
    [
      check.checkId,
      check.group,
      check.state,
      check.evidenceFreshnessState,
      check.evidenceRefs.join("|"),
      check.ownerIfFailed ?? "",
      check.deterministicReason,
    ]
      .map(csvEscape)
      .join(","),
  );
  return `${[header, ...rows].join("\n")}\n`;
}

export function hashForPhase8Exit(value: unknown): string {
  return createHash("sha256").update(canonicalizePhase8ExitValue(value)).digest("hex");
}

export function canonicalizePhase8ExitValue(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizePhase8ExitValue).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizePhase8ExitValue(record[key])}`)
    .join(",")}}`;
}

function validatePhase8ExitInputShape(input: Phase8ExitGateEvidenceInput): void {
  if (input.schemaVersion !== "431.phase8.exit-gate.evidence.v1") {
    throw new Error("PHASE8_EXIT_INPUT_SCHEMA_VERSION_UNSUPPORTED");
  }
  if (input.phase !== 8 || input.gate !== "assistive_layer_completion") {
    throw new Error("PHASE8_EXIT_INPUT_GATE_MISMATCH");
  }
  if (!input.commitRef || !input.publicationBundleRef || !input.generatedAt) {
    throw new Error("PHASE8_EXIT_INPUT_REQUIRED_FIELD_MISSING");
  }
  const checkIds = new Set(REQUIRED_PHASE8_EXIT_CHECKS.map((check) => check.checkId));
  for (const binding of input.checkEvidenceBindings) {
    if (!checkIds.has(binding.checkId)) {
      throw new Error(`PHASE8_EXIT_UNKNOWN_CHECK:${binding.checkId}`);
    }
  }
}

function normalizedEvidenceRecords(records: readonly Phase8ExitEvidenceRecord[]): readonly Phase8ExitEvidenceRecord[] {
  return records
    .map((record) => ({
      ...record,
      contentHash:
        record.contentHash ??
        hashForPhase8Exit({
          evidenceRef: record.evidenceRef,
          path: record.path ?? null,
          command: record.command ?? null,
          status: record.status,
          generatedAt: record.generatedAt,
          schemaVersion: record.schemaVersion ?? null,
        }),
    }))
    .sort((left, right) => left.evidenceRef.localeCompare(right.evidenceRef));
}

function detectDuplicateEvidenceConflicts(records: readonly Phase8ExitEvidenceRecord[]): Set<string> {
  const conflicts = new Set<string>();
  const firstByRef = new Map<string, Phase8ExitEvidenceRecord>();

  for (const record of records) {
    const existing = firstByRef.get(record.evidenceRef);
    if (!existing) {
      firstByRef.set(record.evidenceRef, record);
      continue;
    }
    if (
      existing.contentHash !== record.contentHash ||
      existing.status !== record.status ||
      existing.commitRef !== record.commitRef ||
      existing.publicationBundleRef !== record.publicationBundleRef
    ) {
      conflicts.add(record.evidenceRef);
    }
  }

  for (const record of records) {
    for (const contradicted of record.contradictoryWithRefs ?? []) {
      conflicts.add(record.evidenceRef);
      conflicts.add(contradicted);
    }
  }

  return conflicts;
}

function evaluateEvidenceFreshness(
  record: Phase8ExitEvidenceRecord | undefined,
  input: Phase8ExitGateEvidenceInput,
  conflicts: ReadonlySet<string>,
): Phase8ExitEvidenceFreshness {
  if (!record || !record.exists || record.status === "missing") {
    return "missing";
  }
  if (conflicts.has(record.evidenceRef)) {
    return "contradictory";
  }
  if (record.freshnessState && record.freshnessState !== "current") {
    return record.freshnessState;
  }
  if (record.expiresAt && Date.parse(record.expiresAt) < Date.parse(input.generatedAt)) {
    return "stale";
  }
  if (record.commitRef && record.commitRef !== input.commitRef && !record.allowCommitDrift) {
    return "wrong_commit";
  }
  if (
    record.publicationBundleRef &&
    record.publicationBundleRef !== input.publicationBundleRef &&
    !record.allowPublicationDrift
  ) {
    return "wrong_publication";
  }
  if (!PASSING_STATUSES.has(record.status)) {
    return "stale";
  }
  return "current";
}

function worstFreshness(states: readonly Phase8ExitEvidenceFreshness[]): Phase8ExitEvidenceFreshness {
  if (states.length === 0) {
    return "missing";
  }
  return [...states].sort((left, right) => FRESHNESS_RANK[right] - FRESHNESS_RANK[left])[0] ?? "missing";
}

function deterministicReasonForCheck(args: {
  definition: Phase8ExitRequiredCheckDefinition;
  evidenceRefs: readonly string[];
  missingBinding: boolean;
  missingReproducibleCommands: boolean;
  highSeverityDefectsOpen: boolean;
  noAutonomousWriteEvidenceMissing: boolean;
  freshnessState: Phase8ExitEvidenceFreshness;
}): string {
  if (args.missingBinding) {
    return "No evidence refs are bound to this required exit check.";
  }
  if (args.highSeverityDefectsOpen) {
    return "At least one Sev-1 or Sev-2 visible assistive defect remains open.";
  }
  if (args.noAutonomousWriteEvidenceMissing) {
    return "No bound evidence record is tagged as no_autonomous_write proof.";
  }
  if (args.missingReproducibleCommands) {
    return "The gate is missing the required one-command test and validation reproduction commands.";
  }
  if (args.freshnessState !== "current") {
    return `Evidence freshness is ${args.freshnessState}.`;
  }
  return `Passed with ${args.evidenceRefs.length} current evidence record${args.evidenceRefs.length === 1 ? "" : "s"}.`;
}

function buildPhase8ExitEvidenceBundleHash(
  input: Phase8ExitGateEvidenceInput,
  records: readonly Phase8ExitEvidenceRecord[],
  checks: readonly Phase8ExitRequiredCheckResult[],
): string {
  return hashForPhase8Exit({
    phase: input.phase,
    gate: input.gate,
    commitRef: input.commitRef,
    publicationBundleRef: input.publicationBundleRef,
    records: records.map((record) => ({
      evidenceRef: record.evidenceRef,
      contentHash: record.contentHash,
      status: record.status,
      generatedAt: record.generatedAt,
      expiresAt: record.expiresAt ?? null,
      commitRef: record.commitRef ?? null,
      publicationBundleRef: record.publicationBundleRef ?? null,
    })),
    checks: checks.map((check) => ({
      checkId: check.checkId,
      state: check.state,
      evidenceRefs: [...check.evidenceRefs].sort(),
      freshness: check.evidenceFreshnessState,
    })),
  });
}

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
