import { hashAssurancePayload, orderedSetHash } from "./phase9-assurance-ledger-contracts";
import {
  createPhase9CrossPhaseConformanceFixture,
  type BAUReadinessPack,
  type ConformanceState,
  type CrossPhaseConformanceActorContext,
  type CrossPhaseConformanceScorecard,
  type OnCallMatrix,
  type RunbookBundle,
} from "./phase9-cross-phase-conformance";

export const PHASE9_EXIT_GATE_VERSION = "471.phase9.exit-gate.v1";

export type Phase9ExitGateDecisionState = "approved" | "blocked";
export type Phase9ExitGateChecklistState =
  | "exact"
  | "stale"
  | "blocked"
  | "missing"
  | "deferred_scope";
export type Phase9ExitGateProofFamily =
  | "assurance_ledger_integrity"
  | "assurance_graph_completeness"
  | "operational_projection_health"
  | "runtime_surface_bindings"
  | "audit_break_glass"
  | "assurance_pack_export"
  | "records_retention_worm_replay"
  | "restore_failover_chaos"
  | "incident_near_miss_capa"
  | "tenant_governance_dependency_hygiene"
  | "live_event_stream_drift"
  | "load_soak_regression_security"
  | "cross_phase_conformance_scorecard"
  | "bau_readiness_on_call_runbooks"
  | "phase8_assistive_exit_prerequisite"
  | "phase7_deferred_channel_scope";

export interface Phase9ExitGateCommandContext {
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly actorRef: string;
  readonly roleRefs: readonly string[];
  readonly purposeOfUseRef: string;
  readonly reasonRef: string;
  readonly idempotencyKey: string;
  readonly scopeTokenRef: string;
  readonly requestedDecisionState: Phase9ExitGateDecisionState;
  readonly commandIssuedAt: string;
}

export interface Phase9ExitGateProofFamilyInput {
  readonly proofFamilyId: Phase9ExitGateProofFamily;
  readonly title: string;
  readonly owner: string;
  readonly mandatory: boolean;
  readonly permittedDeferredScope: boolean;
  readonly sourceRefs: readonly string[];
  readonly proofRefs: readonly string[];
  readonly currentProofHashes: readonly string[];
  readonly evidenceFreshnessState: Phase9ExitGateChecklistState;
  readonly graphVerdictState: Phase9ExitGateChecklistState;
  readonly runtimeTupleState: Phase9ExitGateChecklistState;
  readonly settlementState: Phase9ExitGateChecklistState;
  readonly testEvidenceState: Phase9ExitGateChecklistState;
  readonly deferredScopeNote?: string;
  readonly nextSafeAction: string;
}

export interface Phase9ExitGateChecklistRow {
  readonly rowId: string;
  readonly proofFamilyId: Phase9ExitGateProofFamily;
  readonly title: string;
  readonly owner: string;
  readonly mandatory: boolean;
  readonly permittedDeferredScope: boolean;
  readonly sourceRefs: readonly string[];
  readonly proofRefs: readonly string[];
  readonly currentProofHashes: readonly string[];
  readonly evidenceFreshnessState: Phase9ExitGateChecklistState;
  readonly graphVerdictState: Phase9ExitGateChecklistState;
  readonly runtimeTupleState: Phase9ExitGateChecklistState;
  readonly settlementState: Phase9ExitGateChecklistState;
  readonly testEvidenceState: Phase9ExitGateChecklistState;
  readonly rowState: Phase9ExitGateChecklistState;
  readonly deferredScopeNote: string | null;
  readonly nextSafeAction: string;
  readonly rowHash: string;
  readonly generatedAt: string;
}

export interface Phase9ExitGateBlocker {
  readonly blockerId: string;
  readonly rowId: string;
  readonly proofFamilyId: Phase9ExitGateProofFamily;
  readonly blockerState: Exclude<Phase9ExitGateChecklistState, "exact">;
  readonly owner: string;
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly machineReason: string;
  readonly nextSafeAction: string;
  readonly blockerHash: string;
}

export interface Phase9CompletionEvidenceBundle {
  readonly completionEvidenceBundleId: string;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly crossPhaseConformanceScorecardRef: string;
  readonly crossPhaseConformanceScorecardHash: string;
  readonly checklistRowRefs: readonly string[];
  readonly mandatoryExactRowRefs: readonly string[];
  readonly permittedDeferredRowRefs: readonly string[];
  readonly proofRefs: readonly string[];
  readonly completionEvidenceBundleHash: string;
  readonly generatedAt: string;
}

export interface Phase9ExitGateSettlement {
  readonly settlementId: string;
  readonly commandId: string;
  readonly idempotencyKey: string;
  readonly actingContextRef: string;
  readonly requestedDecisionState: Phase9ExitGateDecisionState;
  readonly settledDecisionState: Phase9ExitGateDecisionState;
  readonly completionEvidenceBundleHash: string;
  readonly auditRecordRef: string;
  readonly wormLedgerRef: string;
  readonly settlementHash: string;
  readonly settledAt: string;
}

export interface Phase9ExitGateDecision {
  readonly schemaVersion: typeof PHASE9_EXIT_GATE_VERSION;
  readonly phase9ExitGateDecisionId: string;
  readonly releaseRef: string;
  readonly tenantScope: string;
  readonly decisionState: Phase9ExitGateDecisionState;
  readonly approvalPermitted: boolean;
  readonly generatedAt: string;
  readonly runtimePublicationBundleRef: string;
  readonly runtimePublicationBundleHash: string;
  readonly releaseTrustFreezeVerdict: Phase9ExitGateChecklistState;
  readonly verificationScenarioRefs: readonly string[];
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdict: Phase9ExitGateChecklistState;
  readonly crossPhaseConformanceScorecardRef: string;
  readonly crossPhaseConformanceScorecardHash: string;
  readonly crossPhaseConformanceScorecardState: ConformanceState;
  readonly bauReadinessPackRef: string;
  readonly bauReadinessPackState: BAUReadinessPack["signoffState"];
  readonly onCallMatrixRef: string;
  readonly onCallMatrixState: OnCallMatrix["contactValidationState"];
  readonly runbookBundleRef: string;
  readonly runbookBundleState: RunbookBundle["rehearsalFreshnessState"];
  readonly checklistRows: readonly Phase9ExitGateChecklistRow[];
  readonly blockers: readonly Phase9ExitGateBlocker[];
  readonly completionEvidenceBundle: Phase9CompletionEvidenceBundle;
  readonly settlement: Phase9ExitGateSettlement;
  readonly auditRecord: {
    readonly auditRecordRef: string;
    readonly wormAppendState: "appended";
    readonly payloadClass: "metadata_only";
    readonly auditHash: string;
  };
  readonly releaseToBAURecordGuard: {
    readonly guardState: "permitted" | "blocked";
    readonly guardReasonRefs: readonly string[];
    readonly releaseToBAURecordMayBeMinted: boolean;
  };
  readonly noSev1OrSev2Defects: boolean;
  readonly deferredScopeNotes: readonly string[];
  readonly decisionHash: string;
}

export interface Phase9ExitGateReadModel {
  readonly routeRef: "/ops/conformance?exitGate=exact" | "/ops/conformance?exitGate=blocked";
  readonly dataSurface: "phase9-exit-gate-status";
  readonly decisionState: Phase9ExitGateDecisionState;
  readonly approvalControlState: "enabled" | "disabled";
  readonly approvalDisabledReason: string;
  readonly statusHeadline: string;
  readonly completionEvidenceBundleHash: string;
  readonly releaseToBAURecordGuardState: "permitted" | "blocked";
  readonly rows: readonly Pick<
    Phase9ExitGateChecklistRow,
    "rowId" | "title" | "owner" | "mandatory" | "rowState" | "rowHash" | "nextSafeAction"
  >[];
  readonly blockers: readonly Pick<
    Phase9ExitGateBlocker,
    "blockerId" | "owner" | "machineReason" | "nextSafeAction"
  >[];
  readonly artifactHandoffs: readonly {
    readonly handoffRef: string;
    readonly label: string;
    readonly payloadClass: "metadata_only";
    readonly artifactPresentationContract: "required";
    readonly outboundNavigationGrant: "required";
    readonly safeReturnToken: string;
    readonly rawArtifactUrlSuppressed: true;
  }[];
}

export interface Phase9ExitGateEvaluationInput {
  readonly command: Phase9ExitGateCommandContext;
  readonly runtimePublicationBundleRef: string;
  readonly runtimePublicationBundleHash: string;
  readonly releaseTrustFreezeVerdict: Phase9ExitGateChecklistState;
  readonly verificationScenarioRefs: readonly string[];
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdict: Phase9ExitGateChecklistState;
  readonly crossPhaseConformanceScorecard: CrossPhaseConformanceScorecard;
  readonly bauReadinessPack: BAUReadinessPack;
  readonly onCallMatrix: OnCallMatrix;
  readonly runbookBundle: RunbookBundle;
  readonly noSev1OrSev2Defects: boolean;
  readonly proofFamilies: readonly Phase9ExitGateProofFamilyInput[];
}

export interface Phase9ExitGateFixture {
  readonly schemaVersion: typeof PHASE9_EXIT_GATE_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly producedObjects: readonly string[];
  readonly apiSurface: readonly string[];
  readonly exactDecision: Phase9ExitGateDecision;
  readonly blockedDecision: Phase9ExitGateDecision;
  readonly missingProofDecision: Phase9ExitGateDecision;
  readonly exactReadModel: Phase9ExitGateReadModel;
  readonly blockedReadModel: Phase9ExitGateReadModel;
  readonly replayHash: string;
}

export class Phase9ExitGateError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9ExitGateError";
    this.code = code;
  }
}

function fail(code: string, message: string): never {
  throw new Phase9ExitGateError(code, message);
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    fail(code, message);
  }
}

function sortedUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function exitGateHash(value: unknown, namespace = "phase9.471.exit-gate"): string {
  return hashAssurancePayload(value, namespace);
}

function commandActor(command: Phase9ExitGateCommandContext): CrossPhaseConformanceActorContext {
  return {
    tenantScope: command.tenantScope,
    actorRef: command.actorRef,
    roleRefs: command.roleRefs,
    purposeOfUseRef: command.purposeOfUseRef,
    reasonRef: command.reasonRef,
    idempotencyKey: command.idempotencyKey,
    scopeTokenRef: command.scopeTokenRef,
    generatedAt: command.commandIssuedAt,
  };
}

function requireExitGateActor(command: Phase9ExitGateCommandContext): void {
  invariant(
    command.roleRefs.some((role) =>
      [
        "service_owner",
        "platform_governance",
        "release_manager",
        "bau_signoff_owner",
        "phase9_exit_gate_owner",
      ].includes(role),
    ),
    "PHASE9_EXIT_GATE_ROLE_DENIED",
    "Phase 9 exit gate approval requires service-owner, governance, release, BAU, or exit-gate role.",
  );
  invariant(
    command.purposeOfUseRef.startsWith("assurance:phase9-exit-gate") ||
      command.purposeOfUseRef.startsWith("assurance:bau-signoff"),
    "PHASE9_EXIT_GATE_PURPOSE_DENIED",
    "Phase 9 exit gate approval requires exit-gate or BAU purpose-of-use.",
  );
  invariant(
    command.scopeTokenRef.includes(command.tenantScope),
    "PHASE9_EXIT_GATE_TENANT_SCOPE_DENIED",
    "Phase 9 exit gate approval requires a tenant-bound scope token.",
  );
  invariant(command.reasonRef.length > 0, "PHASE9_EXIT_GATE_REASON_REQUIRED", "Reason required.");
  invariant(
    command.idempotencyKey.length > 0,
    "PHASE9_EXIT_GATE_IDEMPOTENCY_REQUIRED",
    "Idempotency key required.",
  );
}

function worstChecklistState(
  states: readonly Phase9ExitGateChecklistState[],
): Phase9ExitGateChecklistState {
  if (states.includes("missing")) return "missing";
  if (states.includes("blocked")) return "blocked";
  if (states.includes("stale")) return "stale";
  if (states.includes("deferred_scope")) return "deferred_scope";
  return "exact";
}

function proofRow(input: {
  readonly command: Phase9ExitGateCommandContext;
  readonly proofFamily: Phase9ExitGateProofFamilyInput;
}): Phase9ExitGateChecklistRow {
  const proofRefs = sortedUnique(input.proofFamily.proofRefs);
  const sourceRefs = sortedUnique(input.proofFamily.sourceRefs);
  const currentProofHashes = sortedUnique(input.proofFamily.currentProofHashes);
  const inferredState = worstChecklistState([
    proofRefs.length === 0 ? "missing" : "exact",
    sourceRefs.length === 0 ? "missing" : "exact",
    currentProofHashes.length === 0 ? "missing" : "exact",
    input.proofFamily.evidenceFreshnessState,
    input.proofFamily.graphVerdictState,
    input.proofFamily.runtimeTupleState,
    input.proofFamily.settlementState,
    input.proofFamily.testEvidenceState,
  ]);
  const rowState =
    inferredState === "deferred_scope" && !input.proofFamily.permittedDeferredScope
      ? "blocked"
      : inferredState;
  const rowBase = {
    proofFamilyId: input.proofFamily.proofFamilyId,
    title: input.proofFamily.title,
    owner: input.proofFamily.owner,
    mandatory: input.proofFamily.mandatory,
    permittedDeferredScope: input.proofFamily.permittedDeferredScope,
    sourceRefs,
    proofRefs,
    currentProofHashes,
    evidenceFreshnessState: input.proofFamily.evidenceFreshnessState,
    graphVerdictState: input.proofFamily.graphVerdictState,
    runtimeTupleState: input.proofFamily.runtimeTupleState,
    settlementState: input.proofFamily.settlementState,
    testEvidenceState: input.proofFamily.testEvidenceState,
    rowState,
    deferredScopeNote: input.proofFamily.deferredScopeNote ?? null,
    nextSafeAction: input.proofFamily.nextSafeAction,
  };
  const rowHash = exitGateHash(rowBase, "phase9.471.exit-gate-row.hash");
  return {
    rowId: `p9xgr_471_${rowHash.slice(0, 16)}`,
    ...rowBase,
    rowHash,
    generatedAt: input.command.commandIssuedAt,
  };
}

function blockerForRow(row: Phase9ExitGateChecklistRow): Phase9ExitGateBlocker | null {
  const rowBlocksApproval =
    (row.mandatory && row.rowState !== "exact") ||
    (row.rowState === "deferred_scope" && !row.permittedDeferredScope) ||
    row.rowState === "missing" ||
    row.rowState === "blocked";
  if (!rowBlocksApproval) return null;
  const blockerBase = {
    rowId: row.rowId,
    proofFamilyId: row.proofFamilyId,
    blockerState: row.rowState,
    owner: row.owner,
    evidenceRefs: row.proofRefs,
    sourceRefs: row.sourceRefs,
    machineReason: `${row.proofFamilyId}:${row.rowState}`,
    nextSafeAction: row.nextSafeAction,
  } satisfies Omit<Phase9ExitGateBlocker, "blockerId" | "blockerHash">;
  const blockerHash = exitGateHash(blockerBase, "phase9.471.exit-gate-blocker.hash");
  return {
    blockerId: `p9xgb_471_${blockerHash.slice(0, 16)}`,
    ...blockerBase,
    blockerHash,
  };
}

function buildCompletionBundle(input: {
  readonly command: Phase9ExitGateCommandContext;
  readonly scorecard: CrossPhaseConformanceScorecard;
  readonly rows: readonly Phase9ExitGateChecklistRow[];
}): Phase9CompletionEvidenceBundle {
  const orderedRows = [...input.rows].sort((left, right) => left.rowId.localeCompare(right.rowId));
  const proofRefs = sortedUnique(orderedRows.flatMap((row) => row.proofRefs));
  const mandatoryExactRowRefs = sortedUnique(
    orderedRows.filter((row) => row.mandatory && row.rowState === "exact").map((row) => row.rowId),
  );
  const permittedDeferredRowRefs = sortedUnique(
    orderedRows
      .filter((row) => !row.mandatory && row.rowState === "deferred_scope")
      .map((row) => row.rowId),
  );
  const bundleBase = {
    releaseRef: input.command.releaseRef,
    tenantScope: input.command.tenantScope,
    crossPhaseConformanceScorecardRef: input.scorecard.crossPhaseConformanceScorecardId,
    crossPhaseConformanceScorecardHash: input.scorecard.scorecardHash,
    checklistRowRefs: orderedRows.map((row) => row.rowId),
    mandatoryExactRowRefs,
    permittedDeferredRowRefs,
    proofRefs,
    rowHashes: orderedRows.map((row) => row.rowHash),
    rowStates: orderedRows.map((row) => `${row.proofFamilyId}:${row.rowState}`),
  };
  const completionEvidenceBundleHash = exitGateHash(
    bundleBase,
    "phase9.471.completion-evidence-bundle.hash",
  );
  return {
    completionEvidenceBundleId: `p9ceb_471_${completionEvidenceBundleHash.slice(0, 16)}`,
    releaseRef: input.command.releaseRef,
    tenantScope: input.command.tenantScope,
    crossPhaseConformanceScorecardRef: input.scorecard.crossPhaseConformanceScorecardId,
    crossPhaseConformanceScorecardHash: input.scorecard.scorecardHash,
    checklistRowRefs: orderedRows.map((row) => row.rowId),
    mandatoryExactRowRefs,
    permittedDeferredRowRefs,
    proofRefs,
    completionEvidenceBundleHash,
    generatedAt: input.command.commandIssuedAt,
  };
}

function buildSettlement(input: {
  readonly command: Phase9ExitGateCommandContext;
  readonly decisionState: Phase9ExitGateDecisionState;
  readonly bundleHash: string;
}): Phase9ExitGateSettlement {
  const commandId = `p9xgc_471_${exitGateHash(input.command, "phase9.471.command.hash").slice(
    0,
    16,
  )}`;
  const actingContextRef = `acting-context:${input.command.actorRef}:${input.command.tenantScope}`;
  const auditRecordRef = `audit:phase9-exit-gate:${commandId}`;
  const settlementBase = {
    commandId,
    idempotencyKey: input.command.idempotencyKey,
    actingContextRef,
    requestedDecisionState: input.command.requestedDecisionState,
    settledDecisionState: input.decisionState,
    completionEvidenceBundleHash: input.bundleHash,
    auditRecordRef,
    wormLedgerRef: "worm-ledger:phase9-exit-gate",
  };
  const settlementHash = exitGateHash(settlementBase, "phase9.471.exit-gate-settlement.hash");
  return {
    settlementId: `p9xgs_471_${settlementHash.slice(0, 16)}`,
    ...settlementBase,
    settlementHash,
    settledAt: input.command.commandIssuedAt,
  };
}

export class Phase9ExitGateService {
  attemptExitGateApproval(input: Phase9ExitGateEvaluationInput): Phase9ExitGateDecision {
    requireExitGateActor(input.command);
    const rows = input.proofFamilies
      .map((proofFamily) => proofRow({ command: input.command, proofFamily }))
      .sort((left, right) => left.proofFamilyId.localeCompare(right.proofFamilyId));
    const rowBlockers = rows
      .map(blockerForRow)
      .filter((blocker): blocker is Phase9ExitGateBlocker => blocker !== null);
    const systemBlockerInputs: readonly Phase9ExitGateProofFamilyInput[] = [
      {
        proofFamilyId: "cross_phase_conformance_scorecard",
        title: "CrossPhaseConformanceScorecard exact state",
        owner: "service_owner",
        mandatory: true,
        permittedDeferredScope: false,
        sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#CrossPhaseConformanceScorecard"],
        proofRefs: [input.crossPhaseConformanceScorecard.crossPhaseConformanceScorecardId],
        currentProofHashes: [input.crossPhaseConformanceScorecard.scorecardHash],
        evidenceFreshnessState:
          input.crossPhaseConformanceScorecard.scorecardState === "exact" ? "exact" : "blocked",
        graphVerdictState: input.assuranceGraphCompletenessVerdict,
        runtimeTupleState: input.releaseTrustFreezeVerdict,
        settlementState: "exact",
        testEvidenceState: input.noSev1OrSev2Defects ? "exact" : "blocked",
        nextSafeAction: "Regenerate the scorecard from current rows before approval.",
      },
      {
        proofFamilyId: "bau_readiness_on_call_runbooks",
        title: "BAU readiness, on-call matrix, runbook bundle, and rollback posture",
        owner: "bau_signoff_owner",
        mandatory: true,
        permittedDeferredScope: false,
        sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#BAUReadinessPack"],
        proofRefs: [
          input.bauReadinessPack.bauReadinessPackId,
          input.onCallMatrix.onCallMatrixId,
          input.runbookBundle.runbookBundleId,
        ],
        currentProofHashes: [
          input.bauReadinessPack.packHash,
          input.onCallMatrix.matrixHash,
          input.runbookBundle.bundleHash,
        ],
        evidenceFreshnessState:
          input.bauReadinessPack.signoffState === "signed_off" ? "exact" : "blocked",
        graphVerdictState: input.assuranceGraphCompletenessVerdict,
        runtimeTupleState: input.releaseTrustFreezeVerdict,
        settlementState:
          input.onCallMatrix.contactValidationState === "validated" &&
          input.runbookBundle.rehearsalFreshnessState === "current"
            ? "exact"
            : "blocked",
        testEvidenceState: input.noSev1OrSev2Defects ? "exact" : "blocked",
        nextSafeAction:
          "Hold ReleaseToBAURecord creation until BAU pack, on-call contacts, runbooks, and rollback proof are exact.",
      },
    ];
    const systemRows = systemBlockerInputs
      .map((proofFamily) => proofRow({ command: input.command, proofFamily }))
      .filter((row) => row.rowState !== "exact");
    const systemBlockers = systemRows
      .map(blockerForRow)
      .filter((blocker): blocker is Phase9ExitGateBlocker => blocker !== null);
    const blockers = [...rowBlockers, ...systemBlockers].sort((left, right) =>
      left.blockerId.localeCompare(right.blockerId),
    );
    const decisionState: Phase9ExitGateDecisionState =
      blockers.length === 0 && input.command.requestedDecisionState === "approved"
        ? "approved"
        : "blocked";
    const completionEvidenceBundle = buildCompletionBundle({
      command: input.command,
      scorecard: input.crossPhaseConformanceScorecard,
      rows,
    });
    const settlement = buildSettlement({
      command: input.command,
      decisionState,
      bundleHash: completionEvidenceBundle.completionEvidenceBundleHash,
    });
    const releaseGuardReasonRefs = sortedUnique([
      ...blockers.map((blocker) => blocker.blockerId),
      ...(input.crossPhaseConformanceScorecard.scorecardState === "exact"
        ? []
        : [`scorecard:${input.crossPhaseConformanceScorecard.scorecardState}`]),
      ...(input.bauReadinessPack.signoffState === "signed_off"
        ? []
        : [`bau-readiness:${input.bauReadinessPack.signoffState}`]),
    ]);
    const releaseToBAURecordMayBeMinted =
      decisionState === "approved" &&
      input.crossPhaseConformanceScorecard.scorecardState === "exact" &&
      input.bauReadinessPack.signoffState === "signed_off";
    const auditHash = exitGateHash(
      {
        settlementHash: settlement.settlementHash,
        completionEvidenceBundleHash: completionEvidenceBundle.completionEvidenceBundleHash,
        payloadClass: "metadata_only",
      },
      "phase9.471.exit-gate-audit.hash",
    );
    const decisionBase = {
      releaseRef: input.command.releaseRef,
      tenantScope: input.command.tenantScope,
      decisionState,
      approvalPermitted: decisionState === "approved",
      runtimePublicationBundleRef: input.runtimePublicationBundleRef,
      runtimePublicationBundleHash: input.runtimePublicationBundleHash,
      releaseTrustFreezeVerdict: input.releaseTrustFreezeVerdict,
      verificationScenarioRefs: sortedUnique(input.verificationScenarioRefs),
      assuranceEvidenceGraphSnapshotRef: input.assuranceEvidenceGraphSnapshotRef,
      assuranceGraphCompletenessVerdict: input.assuranceGraphCompletenessVerdict,
      crossPhaseConformanceScorecardRef:
        input.crossPhaseConformanceScorecard.crossPhaseConformanceScorecardId,
      crossPhaseConformanceScorecardHash: input.crossPhaseConformanceScorecard.scorecardHash,
      crossPhaseConformanceScorecardState: input.crossPhaseConformanceScorecard.scorecardState,
      bauReadinessPackRef: input.bauReadinessPack.bauReadinessPackId,
      bauReadinessPackState: input.bauReadinessPack.signoffState,
      onCallMatrixRef: input.onCallMatrix.onCallMatrixId,
      onCallMatrixState: input.onCallMatrix.contactValidationState,
      runbookBundleRef: input.runbookBundle.runbookBundleId,
      runbookBundleState: input.runbookBundle.rehearsalFreshnessState,
      checklistRows: rows,
      blockers,
      completionEvidenceBundle,
      settlement,
      auditRecord: {
        auditRecordRef: settlement.auditRecordRef,
        wormAppendState: "appended" as const,
        payloadClass: "metadata_only" as const,
        auditHash,
      },
      releaseToBAURecordGuard: {
        guardState: (releaseToBAURecordMayBeMinted ? "permitted" : "blocked") as
          | "permitted"
          | "blocked",
        guardReasonRefs: releaseGuardReasonRefs,
        releaseToBAURecordMayBeMinted,
      },
      noSev1OrSev2Defects: input.noSev1OrSev2Defects,
      deferredScopeNotes: rows
        .filter((row) => row.rowState === "deferred_scope" && row.deferredScopeNote)
        .map((row) => row.deferredScopeNote as string),
    };
    const decisionHash = exitGateHash(decisionBase, "phase9.471.exit-gate-decision.hash");
    return {
      schemaVersion: PHASE9_EXIT_GATE_VERSION,
      phase9ExitGateDecisionId: `p9xgd_471_${decisionHash.slice(0, 16)}`,
      ...decisionBase,
      generatedAt: input.command.commandIssuedAt,
      decisionHash,
    };
  }

  getExitGateStatus(decision: Phase9ExitGateDecision): Phase9ExitGateReadModel {
    const approvalControlState = decision.approvalPermitted ? "enabled" : "disabled";
    return {
      routeRef: decision.approvalPermitted
        ? "/ops/conformance?exitGate=exact"
        : "/ops/conformance?exitGate=blocked",
      dataSurface: "phase9-exit-gate-status",
      decisionState: decision.decisionState,
      approvalControlState,
      approvalDisabledReason: decision.approvalPermitted
        ? "All mandatory Phase 9 proof rows are exact."
        : "Approval is disabled until every mandatory proof row is exact and the scorecard remains exact.",
      statusHeadline: decision.approvalPermitted
        ? "Phase 9 exit gate approved"
        : "Phase 9 exit gate blocked",
      completionEvidenceBundleHash: decision.completionEvidenceBundle.completionEvidenceBundleHash,
      releaseToBAURecordGuardState: decision.releaseToBAURecordGuard.guardState,
      rows: decision.checklistRows.map((row) => ({
        rowId: row.rowId,
        title: row.title,
        owner: row.owner,
        mandatory: row.mandatory,
        rowState: row.rowState,
        rowHash: row.rowHash,
        nextSafeAction: row.nextSafeAction,
      })),
      blockers: decision.blockers.map((blocker) => ({
        blockerId: blocker.blockerId,
        owner: blocker.owner,
        machineReason: blocker.machineReason,
        nextSafeAction: blocker.nextSafeAction,
      })),
      artifactHandoffs: [
        {
          handoffRef: `handoff:phase9-exit-gate:${decision.phase9ExitGateDecisionId}`,
          label: "Completion evidence bundle",
          payloadClass: "metadata_only",
          artifactPresentationContract: "required",
          outboundNavigationGrant: "required",
          safeReturnToken: `ORT_471_${decision.phase9ExitGateDecisionId}`,
          rawArtifactUrlSuppressed: true,
        },
      ],
    };
  }
}

const sourceAlgorithmRefs = [
  "blueprint/phase-9-the-assurance-ledger.md#9I. Full-program exercises, BAU transfer, and formal exit gate",
  "blueprint/phase-9-the-assurance-ledger.md#BAUReadinessPack",
  "blueprint/phase-9-the-assurance-ledger.md#OnCallMatrix",
  "blueprint/phase-9-the-assurance-ledger.md#RunbookBundle",
  "blueprint/phase-9-the-assurance-ledger.md#PhaseConformanceRow",
  "blueprint/phase-9-the-assurance-ledger.md#CrossPhaseConformanceScorecard",
  "blueprint/phase-9-the-assurance-ledger.md#ReleaseToBAURecord",
  "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
  "blueprint/phase-0-the-foundation-protocol.md#WORM audit",
  "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
  "blueprint/phase-0-the-foundation-protocol.md#CommandSettlementRecord",
  "blueprint/platform-runtime-and-release-blueprint.md#VerificationScenario",
  "blueprint/platform-runtime-and-release-blueprint.md#Release trust freeze",
] as const;

function exactProofFamilies(scorecardHash: string): readonly Phase9ExitGateProofFamilyInput[] {
  const exactStates = {
    evidenceFreshnessState: "exact",
    graphVerdictState: "exact",
    runtimeTupleState: "exact",
    settlementState: "exact",
    testEvidenceState: "exact",
  } as const;
  return [
    {
      proofFamilyId: "assurance_ledger_integrity",
      title: "Assurance ledger integrity and ordered replay",
      owner: "assurance_ledger_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9A"],
      proofRefs: [
        "data/contracts/432_phase9_assurance_ledger_contracts.json",
        "data/contracts/435_phase9_assurance_ingest_service_contract.json",
        "data/contracts/436_phase9_graph_verdict_engine_contract.json",
      ],
      currentProofHashes: ["proof:432:exact", "proof:435:exact", "proof:436:exact"],
      ...exactStates,
      nextSafeAction: "Replay assurance ledger and regenerate graph verdict before approval.",
    },
    {
      proofFamilyId: "assurance_graph_completeness",
      title: "Assurance evidence graph completeness and hash parity",
      owner: "assurance_graph_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#AssuranceGraphCompletenessVerdict"],
      proofRefs: ["data/contracts/436_phase9_graph_verdict_engine_contract.json"],
      currentProofHashes: ["proof:436:graph-hash-parity"],
      ...exactStates,
      nextSafeAction: "Resolve graph completeness blockers and repin the graph snapshot.",
    },
    {
      proofFamilyId: "operational_projection_health",
      title: "Operational projection health and slice trust",
      owner: "operations_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9B"],
      proofRefs: [
        "data/contracts/433_phase9_operational_projection_contracts.json",
        "data/contracts/437_phase9_operational_projection_engine_contract.json",
        "data/contracts/438_phase9_essential_function_metrics_contract.json",
      ],
      currentProofHashes: ["proof:433:exact", "proof:437:exact", "proof:438:exact"],
      ...exactStates,
      nextSafeAction: "Rebuild operational projections and quarantine stale slices.",
    },
    {
      proofFamilyId: "runtime_surface_bindings",
      title:
        "Operations, audit, assurance, resilience, incident, records, tenant, access, and conformance runtime bindings",
      owner: "runtime_publication_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/platform-runtime-and-release-blueprint.md#VerificationScenario"],
      proofRefs: [
        "data/contracts/450_phase9_ops_overview_route_contract.json",
        "data/contracts/454_phase9_ops_assurance_route_contract.json",
        "data/contracts/455_phase9_records_governance_route_contract.json",
        "data/contracts/456_phase9_ops_incidents_route_contract.json",
        "data/contracts/457_phase9_tenant_governance_route_contract.json",
        "data/contracts/458_phase9_role_scope_studio_route_contract.json",
        "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
        "data/contracts/464_phase9_live_projection_gateway_contract.json",
      ],
      currentProofHashes: ["proof:450-460:runtime-bindings", "proof:464:live-gateway"],
      ...exactStates,
      nextSafeAction: "Republish route contracts and release recovery dispositions.",
    },
    {
      proofFamilyId: "audit_break_glass",
      title: "Immutable audit and break-glass review proof",
      owner: "audit_governance_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9C"],
      proofRefs: ["data/evidence/466_audit_break_glass_assurance_redaction_results.json"],
      currentProofHashes: ["proof:466:audit-break-glass"],
      ...exactStates,
      nextSafeAction: "Re-run audit, WORM, break-glass, replay, and redaction proof.",
    },
    {
      proofFamilyId: "assurance_pack_export",
      title: "Assurance pack generation, signoff, export determinism, and redaction parity",
      owner: "assurance_pack_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9D"],
      proofRefs: [
        "data/contracts/440_phase9_assurance_pack_factory_contract.json",
        "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
      ],
      currentProofHashes: ["proof:440:pack-factory", "proof:466:redaction"],
      ...exactStates,
      nextSafeAction: "Regenerate assurance pack and export presentation evidence.",
    },
    {
      proofFamilyId: "records_retention_worm_replay",
      title:
        "Records lifecycle, retention, legal hold, archive, deletion, WORM, and replay dependency protection",
      owner: "records_governance_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9E"],
      proofRefs: ["data/evidence/467_retention_legal_hold_worm_replay_results.json"],
      currentProofHashes: ["proof:467:records-worm-replay"],
      ...exactStates,
      nextSafeAction:
        "Re-run retention, legal hold, archive, deletion, and replay dependency checks.",
    },
    {
      proofFamilyId: "restore_failover_chaos",
      title:
        "Restore, failover, chaos, backup manifest, recovery evidence, runbook binding, and readiness proof",
      owner: "resilience_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9F"],
      proofRefs: [
        "data/contracts/462_phase9_backup_restore_channel_registry_contract.json",
        "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
      ],
      currentProofHashes: ["proof:462:backup-restore", "proof:468:resilience"],
      ...exactStates,
      nextSafeAction: "Re-run restore, failover, chaos, and recovery pack checks.",
    },
    {
      proofFamilyId: "incident_near_miss_capa",
      title: "Incident, near-miss, reportability, containment, PIR, CAPA, and training drill proof",
      owner: "incident_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9G"],
      proofRefs: [
        "data/contracts/447_phase9_incident_reportability_workflow_contract.json",
        "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      ],
      currentProofHashes: ["proof:447:incident-workflow", "proof:469:incident-tenant"],
      ...exactStates,
      nextSafeAction: "Re-run incident, near-miss, reportability, PIR, CAPA, and drill evidence.",
    },
    {
      proofFamilyId: "tenant_governance_dependency_hygiene",
      title:
        "Tenant baseline diff, config immutability, compiled policy bundle, standards watchlist, dependency hygiene, and exception expiry proof",
      owner: "tenant_governance_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9H"],
      proofRefs: [
        "data/contracts/448_phase9_tenant_config_governance_contract.json",
        "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      ],
      currentProofHashes: ["proof:448:tenant-config", "proof:469:dependency-hygiene"],
      ...exactStates,
      nextSafeAction:
        "Resolve config drift, standards watchlist, dependency, and exception blockers.",
    },
    {
      proofFamilyId: "live_event_stream_drift",
      title: "Live event stream integration and fail-closed projection drift behavior",
      owner: "live_projection_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/platform-runtime-and-release-blueprint.md#Release trust freeze"],
      proofRefs: ["data/contracts/464_phase9_live_projection_gateway_contract.json"],
      currentProofHashes: ["proof:464:drift-fail-closed"],
      ...exactStates,
      nextSafeAction: "Repin live projection gateway and stale-delta behavior.",
    },
    {
      proofFamilyId: "load_soak_regression_security",
      title:
        "Load/soak, breach detection, queue heatmap, cross-phase regression, and defensive penetration evidence",
      owner: "quality_security_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#9I final tests"],
      proofRefs: [
        "data/evidence/465_load_soak_breach_queue_heatmap_results.json",
        "data/evidence/470_full_regression_and_defensive_security_results.json",
      ],
      currentProofHashes: ["proof:465:load-soak", "proof:470:full-regression-security"],
      ...exactStates,
      nextSafeAction:
        "Re-run full regression, breach, queue heatmap, and defensive security suites.",
    },
    {
      proofFamilyId: "cross_phase_conformance_scorecard",
      title: "CrossPhaseConformanceScorecard exact state",
      owner: "service_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#CrossPhaseConformanceScorecard"],
      proofRefs: [
        "data/contracts/449_phase9_cross_phase_conformance_contract.json",
        "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
      ],
      currentProofHashes: [scorecardHash],
      ...exactStates,
      nextSafeAction: "Regenerate conformance rows and scorecard before approval.",
    },
    {
      proofFamilyId: "bau_readiness_on_call_runbooks",
      title: "BAU readiness pack, on-call matrix, runbook bundle, and rollback plan readiness",
      owner: "bau_signoff_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-9-the-assurance-ledger.md#ReleaseToBAURecord"],
      proofRefs: ["data/fixtures/449_phase9_cross_phase_conformance_fixtures.json"],
      currentProofHashes: ["proof:449:bau-readiness"],
      ...exactStates,
      nextSafeAction:
        "Keep BAU signoff blocked until pack, on-call, runbooks, and rollback are exact.",
    },
    {
      proofFamilyId: "phase8_assistive_exit_prerequisite",
      title: "Phase 8 assistive exit prerequisite and continuity evidence",
      owner: "assistive_governance_owner",
      mandatory: true,
      permittedDeferredScope: false,
      sourceRefs: ["blueprint/phase-8-the-assistive-layer.md#8I"],
      proofRefs: [
        "data/contracts/428_phase8_offline_eval_contract.json",
        "data/contracts/431_phase8_exit_packet.json",
      ],
      currentProofHashes: ["proof:428:offline-eval", "proof:431:phase8-exit"],
      ...exactStates,
      nextSafeAction: "Re-run Phase 8 exit packet and assistive safety evidence.",
    },
    {
      proofFamilyId: "phase7_deferred_channel_scope",
      title: "Phase 7/NHS App deferred channel scope is explicit and source-backed",
      owner: "channel_governance_owner",
      mandatory: false,
      permittedDeferredScope: true,
      sourceRefs: [
        "blueprint/phase-cards.md#Programme Baseline Update",
        "blueprint/blueprint-init.md#programme baseline",
        "blueprint/phase-7-inside-the-nhs-app.md#7I",
      ],
      proofRefs: [
        "data/evidence/470_full_regression_and_defensive_security_results.json",
        "data/contracts/461_phase9_operational_destination_registry_contract.json",
        "data/contracts/463_phase9_security_compliance_export_registry_contract.json",
      ],
      currentProofHashes: ["proof:470:deferred-scope", "proof:461-463:channel-contracts"],
      evidenceFreshnessState: "deferred_scope",
      graphVerdictState: "exact",
      runtimeTupleState: "exact",
      settlementState: "exact",
      testEvidenceState: "exact",
      deferredScopeNote:
        "Phase 7 live NHS App traffic remains deferred, while active route, channel-freeze, artifact handoff, and export contracts are covered by current local proof.",
      nextSafeAction:
        "Do not mint external-channel completion until Phase 7 live-channel proof is merged.",
    },
  ];
}

export function createPhase9ExitGateExactEvaluationInput(
  overrides: Partial<Phase9ExitGateEvaluationInput> = {},
): Phase9ExitGateEvaluationInput {
  const conformance = createPhase9CrossPhaseConformanceFixture();
  const command: Phase9ExitGateCommandContext = {
    releaseRef: "release:phase9-core:2026-04-28",
    tenantScope: "tenant:vecells-core",
    actorRef: "actor:phase9-exit-gate-owner",
    roleRefs: ["phase9_exit_gate_owner", "service_owner", "bau_signoff_owner"],
    purposeOfUseRef: "assurance:phase9-exit-gate:approve",
    reasonRef: "reason:final-phase9-machine-verifiable-decision",
    idempotencyKey: "idem:471:phase9-exit-gate:exact",
    scopeTokenRef: "scope:tenant:vecells-core:phase9-exit-gate",
    requestedDecisionState: "approved",
    commandIssuedAt: "2026-04-28T00:00:00.000Z",
  };
  return {
    command,
    runtimePublicationBundleRef: "rpb:phase9-core:current",
    runtimePublicationBundleHash: "rpbhash:phase9-core:exact",
    releaseTrustFreezeVerdict: "exact",
    verificationScenarioRefs: ["verification:phase9-core:full-programme"],
    assuranceEvidenceGraphSnapshotRef: "aegs:phase9-core:current",
    assuranceGraphCompletenessVerdict: "exact",
    crossPhaseConformanceScorecard: conformance.exactScorecard,
    bauReadinessPack: conformance.signedOffBauReadinessPack,
    onCallMatrix: conformance.validOnCallMatrix,
    runbookBundle: conformance.currentRunbookBundle,
    noSev1OrSev2Defects: true,
    proofFamilies: exactProofFamilies(conformance.exactScorecard.scorecardHash),
    ...overrides,
  };
}

export function createPhase9ExitGateFixture(): Phase9ExitGateFixture {
  const service = new Phase9ExitGateService();
  const exactInput = createPhase9ExitGateExactEvaluationInput();
  const exactDecision = service.attemptExitGateApproval(exactInput);
  const blockedDecision = service.attemptExitGateApproval({
    ...exactInput,
    command: {
      ...exactInput.command,
      idempotencyKey: "idem:471:phase9-exit-gate:blocked",
    },
    proofFamilies: exactInput.proofFamilies.map((proofFamily) =>
      proofFamily.proofFamilyId === "cross_phase_conformance_scorecard"
        ? {
            ...proofFamily,
            evidenceFreshnessState: "stale",
            currentProofHashes: ["proof:scorecard:stale"],
            nextSafeAction: "Regenerate the CrossPhaseConformanceScorecard from current rows.",
          }
        : proofFamily,
    ),
  });
  const missingProofDecision = service.attemptExitGateApproval({
    ...exactInput,
    command: {
      ...exactInput.command,
      idempotencyKey: "idem:471:phase9-exit-gate:missing-proof",
    },
    proofFamilies: exactInput.proofFamilies.map((proofFamily) =>
      proofFamily.proofFamilyId === "restore_failover_chaos"
        ? {
            ...proofFamily,
            proofRefs: [],
            currentProofHashes: [],
            evidenceFreshnessState: "missing",
            nextSafeAction: "Restore and failover proof must be regenerated before approval.",
          }
        : proofFamily,
    ),
  });
  const exactReadModel = service.getExitGateStatus(exactDecision);
  const blockedReadModel = service.getExitGateStatus(blockedDecision);
  return {
    schemaVersion: PHASE9_EXIT_GATE_VERSION,
    generatedAt: exactInput.command.commandIssuedAt,
    sourceAlgorithmRefs,
    producedObjects: [
      "Phase9ExitGateDecision",
      "Phase9ExitGateChecklistRow",
      "Phase9ExitGateBlocker",
      "Phase9CompletionEvidenceBundle",
      "Phase9ExitGateSettlement",
    ],
    apiSurface: [
      "attemptExitGateApproval",
      "getExitGateStatus",
      "createPhase9ExitGateExactEvaluationInput",
      "createPhase9ExitGateFixture",
    ],
    exactDecision,
    blockedDecision,
    missingProofDecision,
    exactReadModel,
    blockedReadModel,
    replayHash: orderedSetHash(
      [
        exactDecision.decisionHash,
        blockedDecision.decisionHash,
        missingProofDecision.decisionHash,
        exactReadModel.completionEvidenceBundleHash,
        blockedReadModel.completionEvidenceBundleHash,
      ],
      "phase9.471.fixture.replay",
    ),
  };
}
