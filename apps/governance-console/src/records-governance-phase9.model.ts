export const RECORDS_GOVERNANCE_TASK_ID = "par_455";
export const RECORDS_GOVERNANCE_SCHEMA_VERSION = "455.phase9.records-governance-route.v1";
export const PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION = "442.phase9.retention-lifecycle-engine.v1";
export const PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION =
  "443.phase9.disposition-execution-engine.v1";

export type RecordsGovernanceScenarioState =
  | "normal"
  | "empty"
  | "stale"
  | "degraded"
  | "blocked"
  | "permission_denied"
  | "settlement_pending";
export type RecordsGovernanceRouteMode = "records" | "holds" | "disposition";
export type RecordsGovernanceBindingState =
  | "live"
  | "review_only"
  | "revalidation_required"
  | "blocked";
export type RecordsGovernanceActionControlState =
  | "live_review"
  | "settlement_pending"
  | "revalidation_required"
  | "blocked";
export type RecordsGovernanceArtifactState =
  | "summary_only"
  | "governed_preview"
  | "external_handoff_ready"
  | "recovery_only";
export type RecordsGovernanceGraphState = "complete" | "partial" | "stale" | "blocked";
export type RecordsGovernanceEligibilityState = "blocked" | "archive_only" | "delete_allowed";
export type RecordsGovernanceEffectiveDisposition =
  | "preserve"
  | "archive_only"
  | "archive_pending"
  | "delete_pending"
  | "deleted"
  | "blocked";
export type RecordsGovernanceCriticality = "ordinary" | "replay_critical" | "worm" | "hash_chained";

export interface RecordsGovernanceRetentionClassOption {
  readonly retentionClassRef: string;
  readonly recordType: string;
  readonly minimumRetention: string;
  readonly disposalMode: string;
  readonly immutabilityMode: string;
  readonly policyTupleHash: string;
  readonly selected: boolean;
}

export interface RecordsGovernanceLifecycleRow {
  readonly governanceObjectId: string;
  readonly artifactRef: string;
  readonly artifactLabel: string;
  readonly retentionLifecycleBindingRef: string;
  readonly retentionClassRef: string;
  readonly retentionDecisionRef: string;
  readonly activeFreezeRefs: readonly string[];
  readonly activeLegalHoldRefs: readonly string[];
  readonly dispositionEligibilityAssessmentRef: string;
  readonly assessmentHash: string;
  readonly decisionHash: string;
  readonly graphHash: string;
  readonly graphCompletenessState: RecordsGovernanceGraphState;
  readonly graphCriticality: RecordsGovernanceCriticality;
  readonly effectiveDisposition: RecordsGovernanceEffectiveDisposition;
  readonly eligibilityState: RecordsGovernanceEligibilityState;
  readonly dependencySummary: string;
  readonly dependencyRefs: readonly string[];
  readonly currentAssessmentOnly: boolean;
  readonly rawBatchCandidate: boolean;
  readonly deleteControlState: "available" | "suppressed" | "blocked";
  readonly selected: boolean;
  readonly blockerRefs: readonly string[];
}

export interface RecordsGovernanceLegalHoldQueueItem {
  readonly legalHoldRecordRef: string;
  readonly scopeManifestRef: string;
  readonly scopeHash: string;
  readonly freezeRecordRef: string;
  readonly freezeScopeHash: string;
  readonly artifactCount: number;
  readonly dependencyCount: number;
  readonly reasonCode: string;
  readonly originType: string;
  readonly reviewDate: string;
  readonly holdState: "pending_review" | "active" | "released" | "superseded";
  readonly releaseLineageRef: string;
  readonly supersessionState: "current" | "released_needs_assessment" | "superseded";
  readonly selected: boolean;
  readonly blockerRefs: readonly string[];
}

export interface RecordsGovernanceDispositionJobProjection {
  readonly dispositionJobRef: string;
  readonly actionType: "archive" | "delete";
  readonly candidateAssessmentRefs: readonly string[];
  readonly resultState:
    | "queued"
    | "blocked"
    | "executing"
    | "partially_completed"
    | "completed"
    | "aborted";
  readonly admissionBasis: "current_assessment" | "blocked_raw_candidate";
  readonly jobScopeHash: string;
  readonly artifactRefs: readonly string[];
  readonly blockerRefs: readonly string[];
}

export interface RecordsGovernanceBlockExplainerProjection {
  readonly dispositionBlockExplainerRef: string;
  readonly artifactRef: string;
  readonly assessmentRef: string;
  readonly blockingReasonRefs: readonly string[];
  readonly activeDependencyRefs: readonly string[];
  readonly activeFreezeRefs: readonly string[];
  readonly activeLegalHoldRefs: readonly string[];
  readonly artifactPresentationContractRef: string;
  readonly summary: string;
}

export interface RecordsGovernanceArtifactStageProjection {
  readonly stageRef: string;
  readonly artifactKind: "deletion_certificate" | "archive_manifest" | "block_explainer";
  readonly artifactRef: string;
  readonly artifactPresentationContractRef: string;
  readonly artifactTransferSettlementRef: string;
  readonly outboundNavigationGrantRef: string;
  readonly artifactState: RecordsGovernanceArtifactState;
  readonly graphHash: string;
  readonly artifactHash: string;
  readonly summary: string;
  readonly blockerRefs: readonly string[];
}

export interface RecordsGovernanceActionProjection {
  readonly actionType: "approve_archive_job" | "approve_deletion_job" | "release_legal_hold";
  readonly label: string;
  readonly allowed: boolean;
  readonly controlState: RecordsGovernanceActionControlState;
  readonly settlementRef: string;
  readonly settlementState: "ready" | "pending" | "blocked" | "requires_revalidation";
  readonly disabledReason: string;
}

export interface RecordsGovernanceProjection {
  readonly taskId: typeof RECORDS_GOVERNANCE_TASK_ID;
  readonly schemaVersion: typeof RECORDS_GOVERNANCE_SCHEMA_VERSION;
  readonly route:
    | "/ops/governance/records"
    | "/ops/governance/records/holds"
    | "/ops/governance/records/disposition";
  readonly routeMode: RecordsGovernanceRouteMode;
  readonly scenarioState: RecordsGovernanceScenarioState;
  readonly scopeTokenRef: string;
  readonly selectedGovernanceObjectId: string;
  readonly selectedArtifactRef: string;
  readonly selectedArtifactLabel: string;
  readonly bindingState: RecordsGovernanceBindingState;
  readonly actionControlState: RecordsGovernanceActionControlState;
  readonly artifactState: RecordsGovernanceArtifactState;
  readonly graphCompletenessState: RecordsGovernanceGraphState;
  readonly lifecycleTupleHash: string;
  readonly surfaceSummary: string;
  readonly retentionClasses: readonly RecordsGovernanceRetentionClassOption[];
  readonly lifecycleLedgerRows: readonly RecordsGovernanceLifecycleRow[];
  readonly legalHoldQueue: readonly RecordsGovernanceLegalHoldQueueItem[];
  readonly holdScopeReview: RecordsGovernanceLegalHoldQueueItem | null;
  readonly dispositionJobs: readonly RecordsGovernanceDispositionJobProjection[];
  readonly dispositionExceptions: readonly RecordsGovernanceBlockExplainerProjection[];
  readonly blockExplainer: RecordsGovernanceBlockExplainerProjection | null;
  readonly deletionCertificateStage: RecordsGovernanceArtifactStageProjection;
  readonly archiveManifestStage: RecordsGovernanceArtifactStageProjection;
  readonly actionRail: readonly RecordsGovernanceActionProjection[];
  readonly automationAnchors: readonly string[];
  readonly sourceAlgorithmRefs: readonly string[];
  readonly upstreamSchemaVersions: Record<"442" | "443", string>;
}

export const recordsGovernanceAutomationAnchors = [
  "records-governance",
  "retention-class-browser",
  "lifecycle-ledger",
  "legal-hold-queue",
  "hold-scope-review",
  "disposition-queue",
  "block-explainer",
  "deletion-certificate-stage",
  "archive-manifest-stage",
] as const;

export const recordsGovernanceScenarioStates = [
  "normal",
  "empty",
  "stale",
  "degraded",
  "blocked",
  "permission_denied",
  "settlement_pending",
] as const satisfies readonly RecordsGovernanceScenarioState[];

const sourceAlgorithmRefs = [
  "blueprint/phase-9-the-assurance-ledger.md#9E",
  "blueprint/governance-admin-console-frontend-blueprint.md#/ops/governance/records",
  "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
] as const;

const upstreamSchemaVersions = {
  "442": PHASE9_RETENTION_LIFECYCLE_ENGINE_VERSION,
  "443": PHASE9_DISPOSITION_EXECUTION_ENGINE_VERSION,
} as const;

const retentionClasses = [
  {
    retentionClassRef: "retclass_442_request_snapshot",
    recordType: "request_snapshot",
    minimumRetention: "P8Y",
    disposalMode: "delete_when_assessed",
    immutabilityMode: "mutable_until_disposition",
    policyTupleHash: "rchashrequestsnapshot4550000000000000000000000000000000000000",
  },
  {
    retentionClassRef: "retclass_442_transcript",
    recordType: "recorded_media_transcript",
    minimumRetention: "P8Y",
    disposalMode: "case_by_case",
    immutabilityMode: "retained_with_source_lineage",
    policyTupleHash: "rchashtranscript455000000000000000000000000000000000000000",
  },
  {
    retentionClassRef: "retclass_442_worm_audit",
    recordType: "worm_audit_entry",
    minimumRetention: "P20Y",
    disposalMode: "archive_only",
    immutabilityMode: "worm",
    policyTupleHash: "rchashwormaudit45500000000000000000000000000000000000000",
  },
  {
    retentionClassRef: "retclass_442_replay_critical",
    recordType: "model_trace_and_replay_evidence",
    minimumRetention: "P10Y",
    disposalMode: "archive_only_while_dependent",
    immutabilityMode: "hash_chained",
    policyTupleHash: "rchashreplaycritical4550000000000000000000000000000000000",
  },
] as const;

const baseLifecycleRows = [
  {
    governanceObjectId: "records-disposition-31",
    artifactRef: "artifact:req-snapshot-442-001",
    artifactLabel: "Request snapshot RS-442-001",
    retentionLifecycleBindingRef: "rlb_442_req_snapshot_001",
    retentionClassRef: "retclass_442_request_snapshot",
    retentionDecisionRef: "rd_442_req_snapshot_delete_pending",
    activeFreezeRefs: [],
    activeLegalHoldRefs: [],
    dispositionEligibilityAssessmentRef: "dea_442_req_snapshot_delete_allowed",
    assessmentHash: "assessdeleteallowed45500000000000000000000000000000000000000",
    decisionHash: "decisiondeletepending455000000000000000000000000000000000000",
    graphHash: "graphrecords455complete0000000000000000000000000000000000000",
    graphCompletenessState: "complete",
    graphCriticality: "ordinary",
    effectiveDisposition: "delete_pending",
    eligibilityState: "delete_allowed",
    dependencySummary: "No active graph dependency remains after the current assessment.",
    dependencyRefs: [],
    currentAssessmentOnly: true,
    rawBatchCandidate: false,
    deleteControlState: "available",
    blockerRefs: [],
  },
  {
    governanceObjectId: "records-hold-09",
    artifactRef: "artifact:transcript-442-held-009",
    artifactLabel: "Telephony transcript TT-442-009",
    retentionLifecycleBindingRef: "rlb_442_transcript_009",
    retentionClassRef: "retclass_442_transcript",
    retentionDecisionRef: "rd_442_transcript_preserve_hold",
    activeFreezeRefs: ["rfr_442_hold_h09_freeze"],
    activeLegalHoldRefs: ["lhr_442_h09_active"],
    dispositionEligibilityAssessmentRef: "dea_442_transcript_hold_blocked",
    assessmentHash: "assessholdblocked455000000000000000000000000000000000000000",
    decisionHash: "decisionpreservehold45500000000000000000000000000000000000",
    graphHash: "graphrecords455complete0000000000000000000000000000000000000",
    graphCompletenessState: "complete",
    graphCriticality: "ordinary",
    effectiveDisposition: "preserve",
    eligibilityState: "blocked",
    dependencySummary: "Legal hold H-09 and freeze scope preserve the transcript and source call.",
    dependencyRefs: ["dep_442_transcript_source_call", "dep_442_incident_review_bundle"],
    currentAssessmentOnly: true,
    rawBatchCandidate: false,
    deleteControlState: "blocked",
    blockerRefs: ["legal-hold:active:lhr_442_h09_active", "freeze:active:rfr_442_hold_h09_freeze"],
  },
  {
    governanceObjectId: "records-freeze-archive-14",
    artifactRef: "artifact:audit-ledger-worm-014",
    artifactLabel: "WORM audit ledger segment AL-014",
    retentionLifecycleBindingRef: "rlb_442_worm_audit_014",
    retentionClassRef: "retclass_442_worm_audit",
    retentionDecisionRef: "rd_442_worm_archive_only",
    activeFreezeRefs: ["rfr_442_archive_freeze_14"],
    activeLegalHoldRefs: [],
    dispositionEligibilityAssessmentRef: "dea_442_worm_archive_only",
    assessmentHash: "assesswormarchive45500000000000000000000000000000000000000",
    decisionHash: "decisionwormarchive45500000000000000000000000000000000000",
    graphHash: "graphrecords455complete0000000000000000000000000000000000000",
    graphCompletenessState: "complete",
    graphCriticality: "worm",
    effectiveDisposition: "archive_only",
    eligibilityState: "archive_only",
    dependencySummary: "WORM immutability excludes deletion; archive manifest remains admissible.",
    dependencyRefs: ["dep_443_archive_manifest_chain"],
    currentAssessmentOnly: true,
    rawBatchCandidate: false,
    deleteControlState: "suppressed",
    blockerRefs: ["immutability:worm", "delete-excluded:assurance-ledger"],
  },
  {
    governanceObjectId: "records-disposition-31",
    artifactRef: "artifact:model-trace-replay-118",
    artifactLabel: "Replay-critical model trace MT-118",
    retentionLifecycleBindingRef: "rlb_442_replay_trace_118",
    retentionClassRef: "retclass_442_replay_critical",
    retentionDecisionRef: "rd_442_replay_archive_only",
    activeFreezeRefs: [],
    activeLegalHoldRefs: [],
    dispositionEligibilityAssessmentRef: "dea_442_replay_dependency_blocked",
    assessmentHash: "assessreplayblocked455000000000000000000000000000000000000",
    decisionHash: "decisionreplayarchive455000000000000000000000000000000000",
    graphHash: "graphrecords455complete0000000000000000000000000000000000000",
    graphCompletenessState: "complete",
    graphCriticality: "replay_critical",
    effectiveDisposition: "archive_only",
    eligibilityState: "archive_only",
    dependencySummary:
      "Replay proof is still required by an unsuperseded assistive evidence chain.",
    dependencyRefs: ["dep_442_assistive_replay", "dep_443_certificate_dependency"],
    currentAssessmentOnly: true,
    rawBatchCandidate: false,
    deleteControlState: "suppressed",
    blockerRefs: ["dependency:replay-critical", "delete-excluded:active-dependency"],
  },
] as const satisfies readonly Omit<RecordsGovernanceLifecycleRow, "selected">[];

const baseHoldQueue = [
  {
    legalHoldRecordRef: "lhr_442_h09_active",
    scopeManifestRef: "lhsm_442_h09_scope",
    scopeHash: "scopehashh0945500000000000000000000000000000000000000000",
    freezeRecordRef: "rfr_442_hold_h09_freeze",
    freezeScopeHash: "freezescopeh0945500000000000000000000000000000000000000",
    artifactCount: 2,
    dependencyCount: 2,
    reasonCode: "patient_dispute",
    originType: "legal",
    reviewDate: "2026-05-06T09:30:00.000Z",
    holdState: "active",
    releaseLineageRef: "hold-release-lineage:h09:none",
    supersessionState: "current",
    blockerRefs: ["superseding-assessment:required-before-delete"],
  },
  {
    legalHoldRecordRef: "lhr_442_released_old_assessment",
    scopeManifestRef: "lhsm_442_h09_scope_released",
    scopeHash: "scopehashh09released455000000000000000000000000000000000000",
    freezeRecordRef: "rfr_442_hold_h09_freeze",
    freezeScopeHash: "freezescopeh0945500000000000000000000000000000000000000",
    artifactCount: 2,
    dependencyCount: 2,
    reasonCode: "released_after_review",
    originType: "governance",
    reviewDate: "2026-05-08T11:00:00.000Z",
    holdState: "released",
    releaseLineageRef: "hold-release-lineage:h09:released",
    supersessionState: "released_needs_assessment",
    blockerRefs: ["superseding-assessment:missing", "delete-posture:not-restored-by-release"],
  },
] as const satisfies readonly Omit<RecordsGovernanceLegalHoldQueueItem, "selected">[];

function syntheticHash(value: string): string {
  return `${value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}455`.padEnd(64, "0").slice(0, 64);
}

export function normalizeRecordsGovernanceScenarioState(
  value: string | null | undefined,
): RecordsGovernanceScenarioState {
  const normalized = (value ?? "normal").replace(/-/g, "_");
  return recordsGovernanceScenarioStates.includes(normalized as RecordsGovernanceScenarioState)
    ? (normalized as RecordsGovernanceScenarioState)
    : "normal";
}

export function recordsGovernanceRouteModeForPath(pathname: string): RecordsGovernanceRouteMode {
  if (pathname.endsWith("/holds")) return "holds";
  if (pathname.endsWith("/disposition")) return "disposition";
  return "records";
}

function routeForMode(mode: RecordsGovernanceRouteMode): RecordsGovernanceProjection["route"] {
  switch (mode) {
    case "holds":
      return "/ops/governance/records/holds";
    case "disposition":
      return "/ops/governance/records/disposition";
    case "records":
    default:
      return "/ops/governance/records";
  }
}

function graphStateForScenario(
  scenarioState: RecordsGovernanceScenarioState,
): RecordsGovernanceGraphState {
  switch (scenarioState) {
    case "stale":
      return "stale";
    case "degraded":
    case "settlement_pending":
      return "partial";
    case "blocked":
    case "permission_denied":
      return "blocked";
    case "normal":
    case "empty":
    default:
      return "complete";
  }
}

function bindingStateForScenario(
  scenarioState: RecordsGovernanceScenarioState,
): RecordsGovernanceBindingState {
  switch (scenarioState) {
    case "stale":
      return "revalidation_required";
    case "degraded":
    case "settlement_pending":
      return "review_only";
    case "blocked":
    case "permission_denied":
      return "blocked";
    case "normal":
    case "empty":
    default:
      return "live";
  }
}

function actionControlForScenario(
  scenarioState: RecordsGovernanceScenarioState,
): RecordsGovernanceActionControlState {
  switch (scenarioState) {
    case "settlement_pending":
      return "settlement_pending";
    case "stale":
    case "degraded":
      return "revalidation_required";
    case "blocked":
    case "permission_denied":
      return "blocked";
    case "normal":
    case "empty":
    default:
      return "live_review";
  }
}

function artifactStateForScenario(
  scenarioState: RecordsGovernanceScenarioState,
): RecordsGovernanceArtifactState {
  switch (scenarioState) {
    case "normal":
      return "external_handoff_ready";
    case "blocked":
    case "permission_denied":
    case "empty":
      return "summary_only";
    case "stale":
    case "degraded":
    case "settlement_pending":
    default:
      return "governed_preview";
  }
}

function scenarioBlockers(scenarioState: RecordsGovernanceScenarioState): readonly string[] {
  switch (scenarioState) {
    case "stale":
      return ["graph:stale", "redaction-policy:requires-revalidation"];
    case "degraded":
      return ["dependency-posture:partial", "senior-review:required"];
    case "settlement_pending":
      return ["governance-action-settlement:pending"];
    case "blocked":
      return ["graph:blocked", "immutability:unresolved"];
    case "permission_denied":
      return ["scope:denied", "purpose-of-use:insufficient"];
    case "empty":
      return ["records:none-in-scope"];
    case "normal":
    default:
      return [];
  }
}

function defaultSelectedObjectForMode(routeMode: RecordsGovernanceRouteMode): string {
  switch (routeMode) {
    case "disposition":
      return "records-disposition-31";
    case "holds":
      return "records-hold-09";
    case "records":
    default:
      return "records-hold-09";
  }
}

function applyScenarioToRow(
  row: Omit<RecordsGovernanceLifecycleRow, "selected">,
  scenarioState: RecordsGovernanceScenarioState,
  selected: boolean,
): RecordsGovernanceLifecycleRow {
  const graphCompletenessState = graphStateForScenario(scenarioState);
  const blockers = scenarioBlockers(scenarioState);
  const scenarioBlocksActions = blockers.length > 0 && scenarioState !== "empty";
  const permissionDenied = scenarioState === "permission_denied";
  return {
    ...row,
    graphCompletenessState:
      graphCompletenessState === "complete" ? row.graphCompletenessState : graphCompletenessState,
    graphHash:
      graphCompletenessState === "complete"
        ? row.graphHash
        : syntheticHash(`records-${scenarioState}-graph`),
    eligibilityState: scenarioBlocksActions || permissionDenied ? "blocked" : row.eligibilityState,
    effectiveDisposition:
      scenarioBlocksActions || permissionDenied ? "blocked" : row.effectiveDisposition,
    deleteControlState:
      row.graphCriticality === "worm" ||
      row.graphCriticality === "hash_chained" ||
      row.graphCriticality === "replay_critical"
        ? "suppressed"
        : scenarioBlocksActions || permissionDenied
          ? "blocked"
          : row.deleteControlState,
    selected,
    blockerRefs: [...row.blockerRefs, ...blockers],
  };
}

function surfaceSummaryForScenario(
  scenarioState: RecordsGovernanceScenarioState,
  selectedLabel: string,
): string {
  switch (scenarioState) {
    case "empty":
      return "No lifecycle rows match the restricted governance scope; the shell remains available for lookup and evidence review.";
    case "stale":
      return `${selectedLabel} remains visible, but graph or redaction drift froze lifecycle actions until revalidation.`;
    case "degraded":
      return `${selectedLabel} is review-only because dependency proof is partial and requires senior review.`;
    case "blocked":
      return `${selectedLabel} is blocked by graph or immutability posture; destructive controls stay unavailable.`;
    case "permission_denied":
      return "The selected records scope is denied for this purpose-of-use; summary-only posture is retained.";
    case "settlement_pending":
      return `${selectedLabel} is waiting for GovernanceActionSettlement and may not imply delete authority.`;
    case "normal":
    default:
      return `${selectedLabel} is pinned to current lifecycle binding, retention decision, and disposition assessment proof.`;
  }
}

export function createRecordsGovernanceProjection(
  input: {
    readonly routePath?: string;
    readonly scenarioState?: string | null;
    readonly selectedObjectId?: string | null;
  } = {},
): RecordsGovernanceProjection {
  const routeMode = recordsGovernanceRouteModeForPath(input.routePath ?? "/ops/governance/records");
  const route = routeForMode(routeMode);
  const scenarioState = normalizeRecordsGovernanceScenarioState(input.scenarioState);
  const selectedGovernanceObjectId =
    input.selectedObjectId &&
    baseLifecycleRows.some((row) => row.governanceObjectId === input.selectedObjectId)
      ? input.selectedObjectId
      : defaultSelectedObjectForMode(routeMode);
  const graphCompletenessState = graphStateForScenario(scenarioState);
  const bindingState = bindingStateForScenario(scenarioState);
  const actionControlState = actionControlForScenario(scenarioState);
  const artifactState = artifactStateForScenario(scenarioState);
  const blockers = scenarioBlockers(scenarioState);
  const lifecycleLedgerRows =
    scenarioState === "empty"
      ? []
      : baseLifecycleRows.map((row) =>
          applyScenarioToRow(
            row,
            scenarioState,
            row.governanceObjectId === selectedGovernanceObjectId,
          ),
        );
  const selectedRow =
    lifecycleLedgerRows.find((row) => row.selected) ??
    lifecycleLedgerRows[0] ??
    applyScenarioToRow(baseLifecycleRows[1]!, scenarioState, true);
  const selectedHold =
    baseHoldQueue.find((hold) =>
      selectedRow.activeLegalHoldRefs.includes(hold.legalHoldRecordRef),
    ) ?? baseHoldQueue[0]!;
  const legalHoldQueue =
    scenarioState === "empty"
      ? []
      : baseHoldQueue.map((hold) => ({
          ...hold,
          selected: hold.legalHoldRecordRef === selectedHold.legalHoldRecordRef,
          supersessionState:
            scenarioState === "settlement_pending" && hold.holdState === "released"
              ? "released_needs_assessment"
              : hold.supersessionState,
          blockerRefs: [...hold.blockerRefs, ...blockers],
        }));
  const holdScopeReview = legalHoldQueue.find((hold) => hold.selected) ?? null;
  const currentAssessmentRefs = lifecycleLedgerRows
    .filter((row) => row.currentAssessmentOnly && row.eligibilityState !== "blocked")
    .map((row) => row.dispositionEligibilityAssessmentRef);
  const dispositionJobs: readonly RecordsGovernanceDispositionJobProjection[] =
    scenarioState === "empty"
      ? []
      : [
          {
            dispositionJobRef: `dj_455_archive_${scenarioState}`,
            actionType: "archive",
            candidateAssessmentRefs: currentAssessmentRefs.filter((ref) => ref.includes("archive")),
            resultState:
              actionControlState === "blocked"
                ? "blocked"
                : actionControlState === "settlement_pending"
                  ? "executing"
                  : "queued",
            admissionBasis: "current_assessment",
            jobScopeHash: syntheticHash(`archive-job-${scenarioState}`),
            artifactRefs: lifecycleLedgerRows
              .filter((row) => row.eligibilityState === "archive_only")
              .map((row) => row.artifactRef),
            blockerRefs: blockers,
          },
          {
            dispositionJobRef: `dj_455_delete_${scenarioState}`,
            actionType: "delete",
            candidateAssessmentRefs: currentAssessmentRefs.filter((ref) =>
              ref.includes("delete_allowed"),
            ),
            resultState:
              actionControlState === "live_review" &&
              selectedRow.eligibilityState === "delete_allowed"
                ? "queued"
                : "blocked",
            admissionBasis: "current_assessment",
            jobScopeHash: syntheticHash(`delete-job-${scenarioState}`),
            artifactRefs: lifecycleLedgerRows
              .filter((row) => row.eligibilityState === "delete_allowed")
              .map((row) => row.artifactRef),
            blockerRefs:
              actionControlState === "live_review"
                ? selectedRow.blockerRefs
                : [...selectedRow.blockerRefs, ...blockers],
          },
        ];
  const dispositionExceptions = lifecycleLedgerRows
    .filter((row) => row.blockerRefs.length > 0 || row.deleteControlState !== "available")
    .map((row) => ({
      dispositionBlockExplainerRef: `dbe_455_${row.assessmentHash.slice(0, 12)}`,
      artifactRef: row.artifactRef,
      assessmentRef: row.dispositionEligibilityAssessmentRef,
      blockingReasonRefs:
        row.blockerRefs.length > 0 ? row.blockerRefs : [`immutability:${row.graphCriticality}`],
      activeDependencyRefs: row.dependencyRefs,
      activeFreezeRefs: row.activeFreezeRefs,
      activeLegalHoldRefs: row.activeLegalHoldRefs,
      artifactPresentationContractRef: `apc_455_block_${row.assessmentHash.slice(0, 10)}`,
      summary: `${row.artifactLabel}: ${row.dependencySummary}`,
    })) satisfies readonly RecordsGovernanceBlockExplainerProjection[];
  const blockExplainer =
    dispositionExceptions.find((explainer) => explainer.artifactRef === selectedRow.artifactRef) ??
    dispositionExceptions[0] ??
    null;
  const selectedLabel = selectedRow.artifactLabel;
  const lifecycleTupleHash = syntheticHash(
    `${scenarioState}-${routeMode}-${selectedRow.retentionLifecycleBindingRef}-${selectedRow.dispositionEligibilityAssessmentRef}`,
  );
  const archiveManifestStage: RecordsGovernanceArtifactStageProjection = {
    stageRef: `artifact-stage-455-archive-${scenarioState}`,
    artifactKind: "archive_manifest",
    artifactRef: "archive_manifest_443_current_summary",
    artifactPresentationContractRef: "apc_443_archive_manifest_summary",
    artifactTransferSettlementRef: `ats_455_archive_${scenarioState}`,
    outboundNavigationGrantRef: `ong_455_archive_${scenarioState}`,
    artifactState,
    graphHash: selectedRow.graphHash,
    artifactHash: syntheticHash(`archive-manifest-${scenarioState}`),
    summary:
      artifactState === "external_handoff_ready"
        ? "ArchiveManifest is summary-first, graph-pinned, and transfer-ready through a scoped outbound grant."
        : "ArchiveManifest remains summary-first until graph, scope, and transfer posture settle.",
    blockerRefs: blockers,
  };
  const deletionCertificateStage: RecordsGovernanceArtifactStageProjection = {
    stageRef: `artifact-stage-455-certificate-${scenarioState}`,
    artifactKind: "deletion_certificate",
    artifactRef: "deletion_certificate_443_current_summary",
    artifactPresentationContractRef: "apc_443_deletion_certificate_summary",
    artifactTransferSettlementRef: `ats_455_certificate_${scenarioState}`,
    outboundNavigationGrantRef: `ong_455_certificate_${scenarioState}`,
    artifactState:
      selectedRow.eligibilityState === "delete_allowed" &&
      artifactState === "external_handoff_ready"
        ? "external_handoff_ready"
        : artifactState === "recovery_only"
          ? "recovery_only"
          : "governed_preview",
    graphHash: selectedRow.graphHash,
    artifactHash: syntheticHash(`deletion-certificate-${scenarioState}`),
    summary:
      selectedRow.eligibilityState === "delete_allowed"
        ? "DeletionCertificate preview is bound to the current assessment, graph verdict, and certificate hash."
        : "DeletionCertificate lookup is summary-first and cannot arm deletion for preserved or archive-only artifacts.",
    blockerRefs: selectedRow.blockerRefs,
  };
  const canApproveArchive =
    actionControlState === "live_review" &&
    selectedRow.currentAssessmentOnly &&
    (selectedRow.eligibilityState === "archive_only" ||
      selectedRow.eligibilityState === "delete_allowed");
  const canApproveDelete =
    actionControlState === "live_review" &&
    selectedRow.currentAssessmentOnly &&
    selectedRow.eligibilityState === "delete_allowed" &&
    selectedRow.deleteControlState === "available";
  const canReleaseHold =
    actionControlState === "live_review" &&
    selectedRow.activeLegalHoldRefs.length > 0 &&
    scenarioState !== "settlement_pending";

  return {
    taskId: RECORDS_GOVERNANCE_TASK_ID,
    schemaVersion: RECORDS_GOVERNANCE_SCHEMA_VERSION,
    route,
    routeMode,
    scenarioState,
    scopeTokenRef: `scope-token-455-${routeMode}-${scenarioState}`,
    selectedGovernanceObjectId,
    selectedArtifactRef: selectedRow.artifactRef,
    selectedArtifactLabel: selectedLabel,
    bindingState,
    actionControlState,
    artifactState,
    graphCompletenessState,
    lifecycleTupleHash,
    surfaceSummary: surfaceSummaryForScenario(scenarioState, selectedLabel),
    retentionClasses: retentionClasses.map((retentionClass) => ({
      ...retentionClass,
      selected: retentionClass.retentionClassRef === selectedRow.retentionClassRef,
    })),
    lifecycleLedgerRows,
    legalHoldQueue,
    holdScopeReview,
    dispositionJobs,
    dispositionExceptions,
    blockExplainer,
    deletionCertificateStage,
    archiveManifestStage,
    actionRail: [
      {
        actionType: "approve_archive_job",
        label: "approve archive job",
        allowed: canApproveArchive,
        controlState: actionControlState,
        settlementRef: `gas_455_archive_${scenarioState}`,
        settlementState: canApproveArchive
          ? "ready"
          : actionControlState === "settlement_pending"
            ? "pending"
            : "blocked",
        disabledReason: canApproveArchive
          ? "GovernanceActionSettlement is ready for the current archive assessment."
          : "Archive approval requires a current assessment, graph proof, hold posture, and artifact contract.",
      },
      {
        actionType: "approve_deletion_job",
        label: "approve deletion job",
        allowed: canApproveDelete,
        controlState: actionControlState,
        settlementRef: `gas_455_delete_${scenarioState}`,
        settlementState: canApproveDelete
          ? "ready"
          : actionControlState === "settlement_pending"
            ? "pending"
            : "blocked",
        disabledReason: canApproveDelete
          ? "Delete approval is available only for the current delete-allowed assessment."
          : "Deletion remains unavailable until the current assessment, graph proof, active hold/freeze posture, WORM/hash-chained/replay-critical exclusion checks, and next review settlement are satisfied.",
      },
      {
        actionType: "release_legal_hold",
        label: "release legal hold",
        allowed: canReleaseHold,
        controlState: actionControlState,
        settlementRef: `gas_455_hold_release_${scenarioState}`,
        settlementState: canReleaseHold
          ? "ready"
          : actionControlState === "settlement_pending"
            ? "pending"
            : "requires_revalidation",
        disabledReason: canReleaseHold
          ? "Hold release can be requested, but delete posture waits for a superseding assessment."
          : "Hold release does not restore delete-ready posture until a superseding assessment exists.",
      },
    ],
    automationAnchors: recordsGovernanceAutomationAnchors,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
  };
}

export function createRecordsGovernanceFixture() {
  const scenarioProjections = Object.fromEntries(
    recordsGovernanceScenarioStates.map((scenarioState) => [
      scenarioState,
      createRecordsGovernanceProjection({ scenarioState }),
    ]),
  ) as Record<RecordsGovernanceScenarioState, RecordsGovernanceProjection>;
  const routeProjections = {
    records: createRecordsGovernanceProjection({ routePath: "/ops/governance/records" }),
    holds: createRecordsGovernanceProjection({ routePath: "/ops/governance/records/holds" }),
    disposition: createRecordsGovernanceProjection({
      routePath: "/ops/governance/records/disposition",
    }),
  } as const satisfies Record<RecordsGovernanceRouteMode, RecordsGovernanceProjection>;

  return {
    taskId: RECORDS_GOVERNANCE_TASK_ID,
    schemaVersion: RECORDS_GOVERNANCE_SCHEMA_VERSION,
    routes: [
      "/ops/governance/records",
      "/ops/governance/records/holds",
      "/ops/governance/records/disposition",
    ] as const,
    sourceAlgorithmRefs,
    upstreamSchemaVersions,
    automationAnchors: recordsGovernanceAutomationAnchors,
    scenarioProjections,
    routeProjections,
  };
}
