/* eslint-disable @typescript-eslint/no-explicit-any */

import { schemaArtifactCatalog } from "@vecells/event-contracts";

export type ProjectionCompatibilityState = "exact" | "dual_read" | "blocked";
export type ProjectionReadinessState = "live" | "recovering" | "stale" | "blocked";
export type ProjectionReadPathDisposition = "full_projection" | "summary_only" | "blocked";
export type ProjectionWritableDisposition = "enabled" | "guarded" | "blocked";
export type ProjectionRebuildMode = "rebuild" | "catch_up" | "dry_run";
export type ProjectionRebuildState = "idle" | "running" | "completed" | "blocked" | "crashed";

export interface ProjectionReplayEnvelope<TPayload = Record<string, unknown>> {
  eventId: string;
  eventName: string;
  schemaVersionRef: string;
  emittedAt: string;
  streamPosition: number;
  partitionKey: string;
  contractDigest: string;
  payload: TPayload;
}

export interface ProjectionContractVersion {
  projectionVersionRef: string;
  projectionFamilyRef: string;
  routeFamilyRef: string;
  manifestRef: string;
  contractDigest: string;
  requiredSchemaVersionRefs: readonly string[];
  dualReadCompatibleVersionRefs: readonly string[];
  staleAfterEventLag: number;
  sourceRefs: readonly string[];
}

export interface ProjectionContractVersionSet {
  projectionVersionSetRef: string;
  projectionFamilyRef: string;
  liveVersionRef: string;
  shadowVersionRef?: string;
  routeFamilyRef: string;
  manifestRef: string;
  compatibilityWindowRef: string;
  sourceRefs: readonly string[];
}

export interface ReadPathCompatibilityWindow {
  compatibilityWindowRef: string;
  projectionFamilyRef: string;
  mode: "exact_only" | "dual_read";
  allowedVersionRefs: readonly string[];
  writableDisposition: ProjectionWritableDisposition;
}

export interface ProjectionCompatibilityVerdict {
  projectionFamilyRef: string;
  projectionVersionRef: string;
  projectionVersionSetRef: string;
  compatibilityState: ProjectionCompatibilityState;
  writableDisposition: ProjectionWritableDisposition;
  missingSchemaVersionRefs: readonly string[];
  activeVersionRefs: readonly string[];
  evaluatedAt: string;
  reason: string;
}

export interface ProjectionReadinessVerdict {
  projectionFamilyRef: string;
  projectionVersionRef: string;
  projectionVersionSetRef: string;
  readinessState: ProjectionReadinessState;
  readPathDisposition: ProjectionReadPathDisposition;
  writableDisposition: ProjectionWritableDisposition;
  checkpointLag: number;
  checkpointToken: string | null;
  rebuildState: ProjectionRebuildState;
  compatibilityState: ProjectionCompatibilityState;
  cutoverPending: boolean;
  evaluatedAt: string;
  blockerRefs: readonly string[];
  reason: string;
}

export interface ProjectionDocument<TState = object> {
  projectionFamilyRef: string;
  projectionVersionRef: string;
  projectionKey: string;
  contractDigest: string;
  state: TState;
  lastAppliedEventId: string | null;
  lastAppliedStreamPosition: number;
  updatedAt: string | null;
}

export interface ProjectionApplyReceipt {
  projectionFamilyRef: string;
  projectionVersionRef: string;
  projectionKey: string;
  eventId: string;
  eventName: string;
  schemaVersionRef: string;
  streamPosition: number;
  effectDigest: string;
  appliedAt: string;
}

export interface ProjectionCheckpoint {
  projectionFamilyRef: string;
  projectionVersionRef: string;
  projectionKey: string;
  checkpointToken: string;
  checkpointedThroughEventId: string | null;
  checkpointedThroughPosition: number;
  nextStreamPosition: number;
  updatedAt: string;
}

export interface ProjectionRebuildCursor {
  cursorRef: string;
  projectionFamilyRef: string;
  projectionVersionRef: string;
  projectionKey: string;
  environment: string;
  rebuildMode: ProjectionRebuildMode;
  rebuildState: ProjectionRebuildState;
  nextStreamPosition: number;
  lastSeenEventId: string | null;
  checkpointToken: string | null;
  updatedAt: string;
}

export interface ProjectionRebuildLedger {
  rebuildJobId: string;
  projectionFamilyRef: string;
  projectionVersionRef: string;
  projectionVersionSetRef: string;
  projectionKey: string;
  environment: string;
  rebuildMode: ProjectionRebuildMode;
  rebuildState: ProjectionRebuildState;
  processedEventCount: number;
  duplicateEventCount: number;
  blockedEventCount: number;
  ignoredEventCount: number;
  resumeCount: number;
  crashCount: number;
  checkpointToken: string | null;
  lastAppliedStreamPosition: number;
  compatibilityState: ProjectionCompatibilityState;
  readinessState: ProjectionReadinessState;
  startedAt: string;
  finishedAt: string | null;
  notes: readonly string[];
}

export interface ProjectionDryRunComparison {
  comparisonRef: string;
  projectionFamilyRef: string;
  candidateVersionRef: string;
  baselineVersionRef: string;
  comparisonDigest: string;
  matchesLive: boolean;
  coreParityMatch: boolean;
  changedFields: readonly string[];
  evaluatedAt: string;
}

export interface ProjectionBackfillPlan {
  backfillPlanRef: string;
  projectionFamilyRef: string;
  projectionVersionRef: string;
  rebuildMode: ProjectionRebuildMode;
  checkpointStrategy: "per_event" | "per_batch";
  compareBeforeCutover: boolean;
  sourceRefs: readonly string[];
}

export interface SchemaMigrationPlanStub {
  migrationPlanRef: string;
  projectionFamilyRef: string;
  targetVersionRef: string;
  executionStrategy: "shadow_rebuild_then_promote" | "exact_replace";
  sourceRefs: readonly string[];
}

type ProjectionReducer<TState, TPayload> = {
  bivarianceHack: (state: TState, event: ProjectionReplayEnvelope<TPayload>) => TState;
}["bivarianceHack"];

export interface ProjectionHandlerDefinition<TState = object, TPayload = Record<string, unknown>> {
  handlerId: string;
  projectionFamilyRef: string;
  projectionVersionRef: string;
  routeFamilyRef: string;
  manifestRef: string;
  eventName: string;
  acceptedSchemaVersionRefs: readonly string[];
  createEmptyState: () => TState;
  reducer: ProjectionReducer<TState, TPayload>;
}

export interface ProjectionRebuildTarget {
  projectionFamilyRef: string;
  projectionVersionRef: string;
  projectionVersionSetRef: string;
  projectionKey?: string;
  environment?: string;
}

export interface ProjectionRebuildRunOptions {
  rebuildJobId: string;
  eventStream: readonly ProjectionReplayEnvelope[];
  targets: readonly ProjectionRebuildTarget[];
  rebuildMode?: ProjectionRebuildMode;
  maxParallelTargets?: number;
  simulateCrashAfterApplyCount?: number;
}

export interface ProjectionRebuildRunResult {
  rebuildJobId: string;
  ledgers: readonly ProjectionRebuildLedger[];
  readinessVerdicts: readonly ProjectionReadinessVerdict[];
  dryRunComparisons: readonly ProjectionDryRunComparison[];
}

export interface ProjectionLedgerValidation {
  valid: boolean;
  errors: readonly string[];
}

export interface ProjectionParallelInterfaceGap {
  gapId: string;
  title: string;
  boundedFallback: string;
}

interface EventApplySuccess<TState> {
  status: "applied";
  document: ProjectionDocument<TState>;
  receipt: ProjectionApplyReceipt;
}

interface EventApplyDuplicate {
  status: "duplicate";
  receipt: ProjectionApplyReceipt;
}

interface EventApplyIgnored {
  status: "ignored";
  reason: string;
}

interface EventApplyBlocked {
  status: "blocked";
  reason: string;
  blockerRef: string;
}

type EventApplyResult<TState> =
  | EventApplySuccess<TState>
  | EventApplyDuplicate
  | EventApplyIgnored
  | EventApplyBlocked;

type KnownSchemaArtifact = (typeof schemaArtifactCatalog.artifacts)[number];

export interface PatientRequestsProjectionState {
  requestRefs: readonly string[];
  submittedRequestRefs: readonly string[];
  closedRequestRefs: readonly string[];
  frozenRequestRefs: readonly string[];
  repairReleasedRequestRefs: readonly string[];
  openRequestCount: number;
  submittedRequestCount: number;
  closedRequestCount: number;
  calmSummaryState: "tracking" | "degraded";
  projectionFlavor: "v1" | "v2";
  summaryDigest?: string;
}

export interface StaffWorkspaceProjectionState {
  taskRefs: readonly string[];
  settledTaskRefs: readonly string[];
  activeTaskCount: number;
  settledTaskCount: number;
}

export interface OperationsBoardProjectionState {
  dependencyRefs: readonly string[];
  blockedDependencyRefs: readonly string[];
  repairingDependencyRefs: readonly string[];
  clearDependencyRefs: readonly string[];
  blockedDependencyCount: number;
  repairingDependencyCount: number;
}

export interface SupportReplayProjectionState {
  caseRefs: readonly string[];
  openCaseCount: number;
}

const schemaArtifactsByEventName = new Map<string, readonly KnownSchemaArtifact[]>();
for (const artifact of schemaArtifactCatalog.artifacts) {
  const current = schemaArtifactsByEventName.get(artifact.eventName) ?? [];
  schemaArtifactsByEventName.set(artifact.eventName, [...current, artifact]);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function stableProjectionDigestHex(value: string): string {
  const segments = [
    0x811c9dc5 ^ value.length,
    0x9e3779b9 ^ value.length,
    0xc2b2ae35 ^ value.length,
    0x27d4eb2f ^ value.length,
    0x165667b1 ^ value.length,
    0x85ebca77 ^ value.length,
    0x94d049bb ^ value.length,
    0x5bd1e995 ^ value.length,
  ];
  const multipliers = [
    0x01000193, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f, 0x165667b1, 0x9e3779b1, 0x94d049bb, 0x5bd1e995,
  ];

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index) ^ index;
    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
      const mixedCode = code + segmentIndex * 17;
      const segment = segments[segmentIndex]!;
      const multiplier = multipliers[segmentIndex]!;
      segments[segmentIndex] = Math.imul(segment ^ mixedCode, multiplier);
    }
  }

  for (let index = 0; index < segments.length; index += 1) {
    const current = segments[index]!;
    const left = segments[(index + segments.length - 1) % segments.length]!;
    const right = segments[(index + 1) % segments.length]!;
    const multiplier = multipliers[index]!;
    segments[index] = Math.imul(
      current ^ (left >>> ((index % 5) + 11)) ^ (right >>> ((index % 3) + 7)),
      multiplier,
    );
  }

  return segments.map((segment) => (segment >>> 0).toString(16).padStart(8, "0")).join("");
}

function makeDigest(value: unknown): string {
  return stableProjectionDigestHex(stableStringify(value));
}

function dedupeSorted(values: readonly string[], nextValue: string): readonly string[] {
  if (values.includes(nextValue)) {
    return [...values];
  }
  return [...values, nextValue].sort((left, right) => left.localeCompare(right));
}

function removeSorted(values: readonly string[], removedValue: string): readonly string[] {
  return values
    .filter((value) => value !== removedValue)
    .sort((left, right) => left.localeCompare(right));
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeProjectionKey(
  projectionFamilyRef: string,
  projectionVersionRef: string,
  projectionKey = "singleton",
): string {
  return `${projectionFamilyRef}::${projectionVersionRef}::${projectionKey}`;
}

function makeReceiptKey(
  projectionFamilyRef: string,
  projectionVersionRef: string,
  projectionKey: string,
  eventId: string,
): string {
  return `${makeProjectionKey(projectionFamilyRef, projectionVersionRef, projectionKey)}::${eventId}`;
}

function makeCursorKey(
  projectionFamilyRef: string,
  projectionVersionRef: string,
  projectionKey: string,
  environment: string,
): string {
  return `${makeProjectionKey(projectionFamilyRef, projectionVersionRef, projectionKey)}::${environment}`;
}

function cloneState<TState>(state: TState): TState {
  return JSON.parse(JSON.stringify(state)) as TState;
}

function getSchemaArtifact(
  eventName: string,
  schemaVersionRef?: string,
): KnownSchemaArtifact | undefined {
  const versions = schemaArtifactsByEventName.get(eventName) ?? [];
  if (!schemaVersionRef) {
    return versions[0];
  }
  return versions.find((version) => version.schemaVersionRef === schemaVersionRef);
}

function getProjectionVersion(projectionVersionRef: string): ProjectionContractVersion {
  const version = projectionVersionCatalog.find(
    (entry) => entry.projectionVersionRef === projectionVersionRef,
  );
  if (!version) {
    throw new Error(`Unknown projection version: ${projectionVersionRef}`);
  }
  return version;
}

function getProjectionVersionSet(projectionVersionSetRef: string): ProjectionContractVersionSet {
  const versionSet = projectionVersionSetCatalog.find(
    (entry) => entry.projectionVersionSetRef === projectionVersionSetRef,
  );
  if (!versionSet) {
    throw new Error(`Unknown projection version set: ${projectionVersionSetRef}`);
  }
  return versionSet;
}

function getCompatibilityWindow(compatibilityWindowRef: string): ReadPathCompatibilityWindow {
  const window = projectionCompatibilityWindowCatalog.find(
    (entry) => entry.compatibilityWindowRef === compatibilityWindowRef,
  );
  if (!window) {
    throw new Error(`Unknown compatibility window: ${compatibilityWindowRef}`);
  }
  return window;
}

const patientProjectionStateV1 = (): PatientRequestsProjectionState => ({
  requestRefs: [],
  submittedRequestRefs: [],
  closedRequestRefs: [],
  frozenRequestRefs: [],
  repairReleasedRequestRefs: [],
  openRequestCount: 0,
  submittedRequestCount: 0,
  closedRequestCount: 0,
  calmSummaryState: "tracking",
  projectionFlavor: "v1",
});

const patientProjectionStateV2 = (): PatientRequestsProjectionState => ({
  ...patientProjectionStateV1(),
  projectionFlavor: "v2",
  summaryDigest: makeDigest({ version: "v2", requestRefs: [] }),
});

const staffProjectionState = (): StaffWorkspaceProjectionState => ({
  taskRefs: [],
  settledTaskRefs: [],
  activeTaskCount: 0,
  settledTaskCount: 0,
});

const operationsProjectionState = (): OperationsBoardProjectionState => ({
  dependencyRefs: [],
  blockedDependencyRefs: [],
  repairingDependencyRefs: [],
  clearDependencyRefs: [],
  blockedDependencyCount: 0,
  repairingDependencyCount: 0,
});

const supportReplayProjectionState = (): SupportReplayProjectionState => ({
  caseRefs: [],
  openCaseCount: 0,
});

function updatePatientProjectionState(
  state: PatientRequestsProjectionState,
  event: ProjectionReplayEnvelope,
  projectionFlavor: "v1" | "v2",
): PatientRequestsProjectionState {
  const requestId =
    typeof event.payload === "object" &&
    event.payload !== null &&
    "requestId" in event.payload &&
    typeof event.payload.requestId === "string"
      ? event.payload.requestId
      : event.partitionKey;

  let nextState: PatientRequestsProjectionState = {
    ...state,
    requestRefs: [...state.requestRefs],
    submittedRequestRefs: [...state.submittedRequestRefs],
    closedRequestRefs: [...state.closedRequestRefs],
    frozenRequestRefs: [...state.frozenRequestRefs],
    repairReleasedRequestRefs: [...state.repairReleasedRequestRefs],
    projectionFlavor,
  };

  if (event.eventName === "request.created") {
    nextState.requestRefs = dedupeSorted(nextState.requestRefs, requestId);
  }

  if (event.eventName === "request.submitted") {
    nextState.requestRefs = dedupeSorted(nextState.requestRefs, requestId);
    nextState.submittedRequestRefs = dedupeSorted(nextState.submittedRequestRefs, requestId);
  }

  if (event.eventName === "request.closed") {
    nextState.requestRefs = dedupeSorted(nextState.requestRefs, requestId);
    nextState.closedRequestRefs = dedupeSorted(nextState.closedRequestRefs, requestId);
  }

  if (event.eventName === "identity.repair_case.freeze_committed") {
    nextState.frozenRequestRefs = dedupeSorted(nextState.frozenRequestRefs, requestId);
    nextState.calmSummaryState = "degraded";
  }

  if (event.eventName === "identity.repair_release.settled") {
    nextState.repairReleasedRequestRefs = dedupeSorted(
      nextState.repairReleasedRequestRefs,
      requestId,
    );
    nextState.frozenRequestRefs = removeSorted(nextState.frozenRequestRefs, requestId);
    nextState.calmSummaryState =
      nextState.frozenRequestRefs.length === 0 ? "tracking" : nextState.calmSummaryState;
  }

  nextState.openRequestCount = nextState.requestRefs.filter(
    (ref) => !nextState.closedRequestRefs.includes(ref),
  ).length;
  nextState.submittedRequestCount = nextState.submittedRequestRefs.length;
  nextState.closedRequestCount = nextState.closedRequestRefs.length;

  if (projectionFlavor === "v2") {
    nextState.summaryDigest = makeDigest({
      requestRefs: nextState.requestRefs,
      submittedRequestRefs: nextState.submittedRequestRefs,
      closedRequestRefs: nextState.closedRequestRefs,
      calmSummaryState: nextState.calmSummaryState,
    });
  }

  return nextState;
}

function updateStaffProjectionState(
  state: StaffWorkspaceProjectionState,
  event: ProjectionReplayEnvelope,
): StaffWorkspaceProjectionState {
  const taskId =
    typeof event.payload === "object" &&
    event.payload !== null &&
    "taskId" in event.payload &&
    typeof event.payload.taskId === "string"
      ? event.payload.taskId
      : event.partitionKey;

  const nextState: StaffWorkspaceProjectionState = {
    ...state,
    taskRefs: [...state.taskRefs],
    settledTaskRefs: [...state.settledTaskRefs],
  };

  if (event.eventName === "triage.task.created") {
    nextState.taskRefs = dedupeSorted(nextState.taskRefs, taskId);
  }

  if (event.eventName === "triage.task.settled") {
    nextState.taskRefs = dedupeSorted(nextState.taskRefs, taskId);
    nextState.settledTaskRefs = dedupeSorted(nextState.settledTaskRefs, taskId);
  }

  nextState.settledTaskCount = nextState.settledTaskRefs.length;
  nextState.activeTaskCount = nextState.taskRefs.filter(
    (entry) => !nextState.settledTaskRefs.includes(entry),
  ).length;

  return nextState;
}

function updateOperationsProjectionState(
  state: OperationsBoardProjectionState,
  event: ProjectionReplayEnvelope,
): OperationsBoardProjectionState {
  const dependencyId =
    typeof event.payload === "object" &&
    event.payload !== null &&
    "dependencyId" in event.payload &&
    typeof event.payload.dependencyId === "string"
      ? event.payload.dependencyId
      : event.partitionKey;

  const assessmentState =
    typeof event.payload === "object" &&
    event.payload !== null &&
    "assessmentState" in event.payload &&
    typeof event.payload.assessmentState === "string"
      ? event.payload.assessmentState
      : "unknown";

  const nextState: OperationsBoardProjectionState = {
    ...state,
    dependencyRefs: [...state.dependencyRefs],
    blockedDependencyRefs: [...state.blockedDependencyRefs],
    repairingDependencyRefs: [...state.repairingDependencyRefs],
    clearDependencyRefs: [...state.clearDependencyRefs],
  };

  nextState.dependencyRefs = dedupeSorted(nextState.dependencyRefs, dependencyId);

  if (event.eventName === "reachability.assessment.settled") {
    nextState.blockedDependencyRefs = removeSorted(nextState.blockedDependencyRefs, dependencyId);
    nextState.clearDependencyRefs = removeSorted(nextState.clearDependencyRefs, dependencyId);

    if (assessmentState === "blocked") {
      nextState.blockedDependencyRefs = dedupeSorted(nextState.blockedDependencyRefs, dependencyId);
    } else if (assessmentState === "clear") {
      nextState.clearDependencyRefs = dedupeSorted(nextState.clearDependencyRefs, dependencyId);
    }
  }

  if (event.eventName === "reachability.repair.started") {
    nextState.repairingDependencyRefs = dedupeSorted(
      nextState.repairingDependencyRefs,
      dependencyId,
    );
  }

  nextState.blockedDependencyCount = nextState.blockedDependencyRefs.length;
  nextState.repairingDependencyCount = nextState.repairingDependencyRefs.length;

  return nextState;
}

function updateSupportProjectionState(
  state: SupportReplayProjectionState,
  event: ProjectionReplayEnvelope,
): SupportReplayProjectionState {
  const caseId =
    typeof event.payload === "object" &&
    event.payload !== null &&
    "caseId" in event.payload &&
    typeof event.payload.caseId === "string"
      ? event.payload.caseId
      : event.partitionKey;

  const nextState: SupportReplayProjectionState = {
    ...state,
    caseRefs: dedupeSorted(state.caseRefs, caseId),
  };
  nextState.openCaseCount = nextState.caseRefs.length;
  return nextState;
}

export const projectionVersionCatalog = [
  {
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    contractDigest: makeDigest("PRCV_082_PATIENT_REQUESTS_V1"),
    requiredSchemaVersionRefs: [
      "CESV_REQUEST_CREATED_V1",
      "CESV_REQUEST_SUBMITTED_V1",
      "CESV_REQUEST_CLOSED_V1",
      "CESV_IDENTITY_REPAIR_CASE_FREEZE_COMMITTED_V1",
      "CESV_IDENTITY_REPAIR_RELEASE_SETTLED_V1",
    ],
    dualReadCompatibleVersionRefs: [],
    staleAfterEventLag: 1,
    sourceRefs: [
      "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersion",
      "prompt/082.md",
    ],
  },
  {
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    contractDigest: makeDigest("PRCV_082_PATIENT_REQUESTS_V2"),
    requiredSchemaVersionRefs: [
      "CESV_REQUEST_CREATED_V1",
      "CESV_REQUEST_SUBMITTED_V1",
      "CESV_REQUEST_CLOSED_V1",
      "CESV_IDENTITY_REPAIR_CASE_FREEZE_COMMITTED_V1",
      "CESV_IDENTITY_REPAIR_RELEASE_SETTLED_V1",
    ],
    dualReadCompatibleVersionRefs: ["PRCV_082_PATIENT_REQUESTS_V1"],
    staleAfterEventLag: 1,
    sourceRefs: [
      "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
      "prompt/082.md",
    ],
  },
  {
    projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
    projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
    routeFamilyRef: "PCF_050_RF_STAFF_WORKSPACE_V1",
    manifestRef: "FCM_050_CLINICAL_WORKSPACE_V1",
    contractDigest: makeDigest("PRCV_082_STAFF_WORKSPACE_V1"),
    requiredSchemaVersionRefs: ["CESV_TRIAGE_TASK_CREATED_V1", "CESV_TRIAGE_TASK_SETTLED_V1"],
    dualReadCompatibleVersionRefs: [],
    staleAfterEventLag: 1,
    sourceRefs: [
      "staff-workspace-interface-architecture.md#backfill-and-committed-snapshot-consistency",
      "prompt/082.md",
    ],
  },
  {
    projectionVersionRef: "PRCV_082_OPERATIONS_BOARD_V1",
    projectionFamilyRef: "PRCF_082_OPERATIONS_BOARD",
    routeFamilyRef: "PCF_050_RF_OPERATIONS_BOARD_V1",
    manifestRef: "FCM_050_OPERATIONS_CONSOLE_V1",
    contractDigest: makeDigest("PRCV_082_OPERATIONS_BOARD_V1"),
    requiredSchemaVersionRefs: [
      "CESV_REACHABILITY_ASSESSMENT_SETTLED_V1",
      "CESV_REACHABILITY_REPAIR_STARTED_V1",
    ],
    dualReadCompatibleVersionRefs: [],
    staleAfterEventLag: 2,
    sourceRefs: ["blueprint/forensic-audit-findings.md#Finding 68", "prompt/082.md"],
  },
  {
    projectionVersionRef: "PRCV_082_SUPPORT_REPLAY_V1",
    projectionFamilyRef: "PRCF_082_SUPPORT_REPLAY",
    routeFamilyRef: "PCF_050_RF_SUPPORT_REPLAY_OBSERVE_V1",
    manifestRef: "FCM_050_SUPPORT_WORKSPACE_V1",
    contractDigest: makeDigest("PRCV_082_SUPPORT_REPLAY_V1"),
    requiredSchemaVersionRefs: ["CESV_EXCEPTION_REVIEW_CASE_OPENED_V1"],
    dualReadCompatibleVersionRefs: [],
    staleAfterEventLag: 1,
    sourceRefs: ["blueprint/forensic-audit-findings.md#Finding 63", "prompt/082.md"],
  },
  {
    projectionVersionRef: "PRCV_082_SUPPORT_REPLAY_V2",
    projectionFamilyRef: "PRCF_082_SUPPORT_REPLAY",
    routeFamilyRef: "PCF_050_RF_SUPPORT_REPLAY_OBSERVE_V1",
    manifestRef: "FCM_050_SUPPORT_WORKSPACE_V1",
    contractDigest: makeDigest("PRCV_082_SUPPORT_REPLAY_V2"),
    requiredSchemaVersionRefs: [
      "CESV_EXCEPTION_REVIEW_CASE_OPENED_V1",
      "CESV_EXCEPTION_REVIEW_CASE_RECOVERED_V1",
    ],
    dualReadCompatibleVersionRefs: [],
    staleAfterEventLag: 1,
    sourceRefs: [
      "blueprint/platform-runtime-and-release-blueprint.md#ReadPathCompatibilityWindow",
      "prompt/082.md",
    ],
  },
] as const satisfies readonly ProjectionContractVersion[];

export const projectionVersionSetCatalog = [
  {
    projectionVersionSetRef: "PRCVS_082_PATIENT_REQUESTS_V1",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    liveVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    compatibilityWindowRef: "PRCW_082_PATIENT_REQUESTS_EXACT",
    sourceRefs: [
      "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
    ],
  },
  {
    projectionVersionSetRef: "PRCVS_082_PATIENT_REQUESTS_DUAL_READ",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    liveVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
    shadowVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    compatibilityWindowRef: "PRCW_082_PATIENT_REQUESTS_DUAL_READ",
    sourceRefs: ["blueprint/platform-runtime-and-release-blueprint.md#ReadPathCompatibilityWindow"],
  },
  {
    projectionVersionSetRef: "PRCVS_082_STAFF_WORKSPACE_V1",
    projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
    liveVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
    routeFamilyRef: "PCF_050_RF_STAFF_WORKSPACE_V1",
    manifestRef: "FCM_050_CLINICAL_WORKSPACE_V1",
    compatibilityWindowRef: "PRCW_082_STAFF_WORKSPACE_EXACT",
    sourceRefs: [
      "staff-workspace-interface-architecture.md#backfill-and-committed-snapshot-consistency",
    ],
  },
  {
    projectionVersionSetRef: "PRCVS_082_OPERATIONS_BOARD_V1",
    projectionFamilyRef: "PRCF_082_OPERATIONS_BOARD",
    liveVersionRef: "PRCV_082_OPERATIONS_BOARD_V1",
    routeFamilyRef: "PCF_050_RF_OPERATIONS_BOARD_V1",
    manifestRef: "FCM_050_OPERATIONS_CONSOLE_V1",
    compatibilityWindowRef: "PRCW_082_OPERATIONS_BOARD_EXACT",
    sourceRefs: ["blueprint/platform-runtime-and-release-blueprint.md#ProjectionReadinessVerdict"],
  },
  {
    projectionVersionSetRef: "PRCVS_082_SUPPORT_REPLAY_V1",
    projectionFamilyRef: "PRCF_082_SUPPORT_REPLAY",
    liveVersionRef: "PRCV_082_SUPPORT_REPLAY_V1",
    routeFamilyRef: "PCF_050_RF_SUPPORT_REPLAY_OBSERVE_V1",
    manifestRef: "FCM_050_SUPPORT_WORKSPACE_V1",
    compatibilityWindowRef: "PRCW_082_SUPPORT_REPLAY_EXACT",
    sourceRefs: [
      "blueprint/platform-runtime-and-release-blueprint.md#ProjectionContractVersionSet",
    ],
  },
  {
    projectionVersionSetRef: "PRCVS_082_SUPPORT_REPLAY_BLOCKED",
    projectionFamilyRef: "PRCF_082_SUPPORT_REPLAY",
    liveVersionRef: "PRCV_082_SUPPORT_REPLAY_V2",
    routeFamilyRef: "PCF_050_RF_SUPPORT_REPLAY_OBSERVE_V1",
    manifestRef: "FCM_050_SUPPORT_WORKSPACE_V1",
    compatibilityWindowRef: "PRCW_082_SUPPORT_REPLAY_EXACT",
    sourceRefs: ["blueprint/forensic-audit-findings.md#Finding 119", "prompt/082.md"],
  },
] as const satisfies readonly ProjectionContractVersionSet[];

export const projectionCompatibilityWindowCatalog = [
  {
    compatibilityWindowRef: "PRCW_082_PATIENT_REQUESTS_EXACT",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    mode: "exact_only",
    allowedVersionRefs: ["PRCV_082_PATIENT_REQUESTS_V1"],
    writableDisposition: "enabled",
  },
  {
    compatibilityWindowRef: "PRCW_082_PATIENT_REQUESTS_DUAL_READ",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    mode: "dual_read",
    allowedVersionRefs: ["PRCV_082_PATIENT_REQUESTS_V1", "PRCV_082_PATIENT_REQUESTS_V2"],
    writableDisposition: "guarded",
  },
  {
    compatibilityWindowRef: "PRCW_082_STAFF_WORKSPACE_EXACT",
    projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
    mode: "exact_only",
    allowedVersionRefs: ["PRCV_082_STAFF_WORKSPACE_V1"],
    writableDisposition: "enabled",
  },
  {
    compatibilityWindowRef: "PRCW_082_OPERATIONS_BOARD_EXACT",
    projectionFamilyRef: "PRCF_082_OPERATIONS_BOARD",
    mode: "exact_only",
    allowedVersionRefs: ["PRCV_082_OPERATIONS_BOARD_V1"],
    writableDisposition: "enabled",
  },
  {
    compatibilityWindowRef: "PRCW_082_SUPPORT_REPLAY_EXACT",
    projectionFamilyRef: "PRCF_082_SUPPORT_REPLAY",
    mode: "exact_only",
    allowedVersionRefs: ["PRCV_082_SUPPORT_REPLAY_V1", "PRCV_082_SUPPORT_REPLAY_V2"],
    writableDisposition: "blocked",
  },
] as const satisfies readonly ReadPathCompatibilityWindow[];

export const projectionBackfillPlanCatalog = [
  {
    backfillPlanRef: "PBP_082_PATIENT_REQUESTS_V1",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
    rebuildMode: "rebuild",
    checkpointStrategy: "per_event",
    compareBeforeCutover: false,
    sourceRefs: [
      "prompt/082.md",
      "blueprint/platform-runtime-and-release-blueprint.md#ProjectionBackfillPlan",
    ],
  },
  {
    backfillPlanRef: "PBP_082_PATIENT_REQUESTS_V2",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
    rebuildMode: "dry_run",
    checkpointStrategy: "per_event",
    compareBeforeCutover: true,
    sourceRefs: [
      "prompt/082.md",
      "blueprint/platform-runtime-and-release-blueprint.md#ProjectionBackfillPlan",
    ],
  },
] as const satisfies readonly ProjectionBackfillPlan[];

export const schemaMigrationPlanStubs = [
  {
    migrationPlanRef: "PARALLEL_INTERFACE_GAP_082_SCHEMA_MIGRATION_RUNNER",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    targetVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
    executionStrategy: "shadow_rebuild_then_promote",
    sourceRefs: [
      "prompt/shared_operating_contract_076_to_085.md",
      "blueprint/platform-runtime-and-release-blueprint.md#SchemaMigrationPlan",
    ],
  },
] as const satisfies readonly SchemaMigrationPlanStub[];

export const projectionRebuildParallelInterfaceGaps = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_082_LIVE_EVENT_BUS_BINDING",
    title: "Live event-bus consumer binding",
    boundedFallback: "In-memory ordered replay stream with immutable envelope digests.",
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_082_MIGRATION_RUNNER",
    title: "Projection schema migration runner",
    boundedFallback: "Shadow rebuild and compare-before-cutover only.",
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_082_PROJECTION_STORE_DRIVER",
    title: "Durable projection-store adapter",
    boundedFallback: "In-memory checkpoint, receipt, and document store.",
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_082_PUBLICATION_GATE",
    title: "Runtime publication gate integration",
    boundedFallback: "Machine-readable readiness verdicts and guarded writable posture.",
  },
] as const satisfies readonly ProjectionParallelInterfaceGap[];

export const projectionHandlerDefinitions = [
  {
    handlerId: "PAH_082_PATIENT_V1_REQUEST_CREATED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "request.created",
    acceptedSchemaVersionRefs: ["CESV_REQUEST_CREATED_V1"],
    createEmptyState: patientProjectionStateV1,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v1"),
  },
  {
    handlerId: "PAH_082_PATIENT_V1_REQUEST_SUBMITTED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "request.submitted",
    acceptedSchemaVersionRefs: ["CESV_REQUEST_SUBMITTED_V1"],
    createEmptyState: patientProjectionStateV1,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v1"),
  },
  {
    handlerId: "PAH_082_PATIENT_V1_REQUEST_CLOSED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "request.closed",
    acceptedSchemaVersionRefs: ["CESV_REQUEST_CLOSED_V1"],
    createEmptyState: patientProjectionStateV1,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v1"),
  },
  {
    handlerId: "PAH_082_PATIENT_V1_FREEZE_COMMITTED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "identity.repair_case.freeze_committed",
    acceptedSchemaVersionRefs: ["CESV_IDENTITY_REPAIR_CASE_FREEZE_COMMITTED_V1"],
    createEmptyState: patientProjectionStateV1,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v1"),
  },
  {
    handlerId: "PAH_082_PATIENT_V1_RELEASE_SETTLED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "identity.repair_release.settled",
    acceptedSchemaVersionRefs: ["CESV_IDENTITY_REPAIR_RELEASE_SETTLED_V1"],
    createEmptyState: patientProjectionStateV1,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v1"),
  },
  {
    handlerId: "PAH_082_PATIENT_V2_REQUEST_CREATED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "request.created",
    acceptedSchemaVersionRefs: ["CESV_REQUEST_CREATED_V1"],
    createEmptyState: patientProjectionStateV2,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v2"),
  },
  {
    handlerId: "PAH_082_PATIENT_V2_REQUEST_SUBMITTED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "request.submitted",
    acceptedSchemaVersionRefs: ["CESV_REQUEST_SUBMITTED_V1"],
    createEmptyState: patientProjectionStateV2,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v2"),
  },
  {
    handlerId: "PAH_082_PATIENT_V2_REQUEST_CLOSED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "request.closed",
    acceptedSchemaVersionRefs: ["CESV_REQUEST_CLOSED_V1"],
    createEmptyState: patientProjectionStateV2,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v2"),
  },
  {
    handlerId: "PAH_082_PATIENT_V2_FREEZE_COMMITTED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "identity.repair_case.freeze_committed",
    acceptedSchemaVersionRefs: ["CESV_IDENTITY_REPAIR_CASE_FREEZE_COMMITTED_V1"],
    createEmptyState: patientProjectionStateV2,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v2"),
  },
  {
    handlerId: "PAH_082_PATIENT_V2_RELEASE_SETTLED",
    projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
    projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
    routeFamilyRef: "PCF_050_RF_PATIENT_REQUESTS_V1",
    manifestRef: "FCM_050_PATIENT_AUTHENTICATED_PORTAL_V1",
    eventName: "identity.repair_release.settled",
    acceptedSchemaVersionRefs: ["CESV_IDENTITY_REPAIR_RELEASE_SETTLED_V1"],
    createEmptyState: patientProjectionStateV2,
    reducer: (state: PatientRequestsProjectionState, event: ProjectionReplayEnvelope) =>
      updatePatientProjectionState(state, event, "v2"),
  },
  {
    handlerId: "PAH_082_STAFF_V1_TASK_CREATED",
    projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
    projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
    routeFamilyRef: "PCF_050_RF_STAFF_WORKSPACE_V1",
    manifestRef: "FCM_050_CLINICAL_WORKSPACE_V1",
    eventName: "triage.task.created",
    acceptedSchemaVersionRefs: ["CESV_TRIAGE_TASK_CREATED_V1"],
    createEmptyState: staffProjectionState,
    reducer: updateStaffProjectionState,
  },
  {
    handlerId: "PAH_082_STAFF_V1_TASK_SETTLED",
    projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
    projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
    routeFamilyRef: "PCF_050_RF_STAFF_WORKSPACE_V1",
    manifestRef: "FCM_050_CLINICAL_WORKSPACE_V1",
    eventName: "triage.task.settled",
    acceptedSchemaVersionRefs: ["CESV_TRIAGE_TASK_SETTLED_V1"],
    createEmptyState: staffProjectionState,
    reducer: updateStaffProjectionState,
  },
  {
    handlerId: "PAH_082_OPS_V1_ASSESSMENT_SETTLED",
    projectionFamilyRef: "PRCF_082_OPERATIONS_BOARD",
    projectionVersionRef: "PRCV_082_OPERATIONS_BOARD_V1",
    routeFamilyRef: "PCF_050_RF_OPERATIONS_BOARD_V1",
    manifestRef: "FCM_050_OPERATIONS_CONSOLE_V1",
    eventName: "reachability.assessment.settled",
    acceptedSchemaVersionRefs: ["CESV_REACHABILITY_ASSESSMENT_SETTLED_V1"],
    createEmptyState: operationsProjectionState,
    reducer: updateOperationsProjectionState,
  },
  {
    handlerId: "PAH_082_OPS_V1_REPAIR_STARTED",
    projectionFamilyRef: "PRCF_082_OPERATIONS_BOARD",
    projectionVersionRef: "PRCV_082_OPERATIONS_BOARD_V1",
    routeFamilyRef: "PCF_050_RF_OPERATIONS_BOARD_V1",
    manifestRef: "FCM_050_OPERATIONS_CONSOLE_V1",
    eventName: "reachability.repair.started",
    acceptedSchemaVersionRefs: ["CESV_REACHABILITY_REPAIR_STARTED_V1"],
    createEmptyState: operationsProjectionState,
    reducer: updateOperationsProjectionState,
  },
  {
    handlerId: "PAH_082_SUPPORT_V1_CASE_OPENED",
    projectionFamilyRef: "PRCF_082_SUPPORT_REPLAY",
    projectionVersionRef: "PRCV_082_SUPPORT_REPLAY_V1",
    routeFamilyRef: "PCF_050_RF_SUPPORT_REPLAY_OBSERVE_V1",
    manifestRef: "FCM_050_SUPPORT_WORKSPACE_V1",
    eventName: "exception.review_case.opened",
    acceptedSchemaVersionRefs: ["CESV_EXCEPTION_REVIEW_CASE_OPENED_V1"],
    createEmptyState: supportReplayProjectionState,
    reducer: updateSupportProjectionState,
  },
] as const satisfies readonly ProjectionHandlerDefinition<any, any>[];

export const projectionApplierDispatchTable = projectionHandlerDefinitions.map((definition) => {
  const artifacts = definition.acceptedSchemaVersionRefs
    .map((schemaVersionRef) => getSchemaArtifact(definition.eventName, schemaVersionRef))
    .filter((artifact): artifact is KnownSchemaArtifact => Boolean(artifact));

  return {
    handlerId: definition.handlerId,
    projectionFamilyRef: definition.projectionFamilyRef,
    projectionVersionRef: definition.projectionVersionRef,
    routeFamilyRef: definition.routeFamilyRef,
    manifestRef: definition.manifestRef,
    eventName: definition.eventName,
    schemaVersionRefs: definition.acceptedSchemaVersionRefs,
    compatibilityModes: artifacts.map((artifact) => artifact.compatibilityMode),
    replaySemantics: artifacts.map((artifact) => artifact.replaySemantics),
  };
});

export const projectionRebuildCanonicalEvents = Array.from(
  new Map(
    projectionHandlerDefinitions.map((definition) => {
      const artifacts = definition.acceptedSchemaVersionRefs
        .map((schemaVersionRef) => getSchemaArtifact(definition.eventName, schemaVersionRef))
        .filter((artifact): artifact is KnownSchemaArtifact => Boolean(artifact));
      return [
        definition.eventName,
        {
          eventName: definition.eventName,
          schemaVersionRefs: definition.acceptedSchemaVersionRefs,
          compatibilityModes: artifacts.map((artifact) => artifact.compatibilityMode),
          replaySemantics: artifacts.map((artifact) => artifact.replaySemantics),
        },
      ] as const;
    }),
  ).values(),
);

export class ProjectionHandlerRegistry {
  private readonly definitions: readonly ProjectionHandlerDefinition<any, any>[];
  private readonly definitionsByFamilyVersionEvent = new Map<
    string,
    ProjectionHandlerDefinition<any, any>[]
  >();

  constructor(
    definitions: readonly ProjectionHandlerDefinition<any, any>[] = projectionHandlerDefinitions,
  ) {
    this.definitions = definitions;
    for (const definition of definitions) {
      const key = this.makeKey(
        definition.projectionFamilyRef,
        definition.projectionVersionRef,
        definition.eventName,
      );
      const current = this.definitionsByFamilyVersionEvent.get(key) ?? [];
      this.definitionsByFamilyVersionEvent.set(key, [...current, definition]);
    }
  }

  private makeKey(
    projectionFamilyRef: string,
    projectionVersionRef: string,
    eventName: string,
  ): string {
    return `${projectionFamilyRef}::${projectionVersionRef}::${eventName}`;
  }

  getDefinitions(): readonly ProjectionHandlerDefinition<any, any>[] {
    return this.definitions;
  }

  getConsumedEventNames(
    projectionFamilyRef: string,
    projectionVersionRef: string,
  ): readonly string[] {
    return this.definitions
      .filter(
        (definition) =>
          definition.projectionFamilyRef === projectionFamilyRef &&
          definition.projectionVersionRef === projectionVersionRef,
      )
      .map((definition) => definition.eventName)
      .sort((left, right) => left.localeCompare(right));
  }

  getSupportedSchemaVersionRefs(
    projectionFamilyRef: string,
    projectionVersionRef: string,
  ): readonly string[] {
    const refs = this.definitions
      .filter(
        (definition) =>
          definition.projectionFamilyRef === projectionFamilyRef &&
          definition.projectionVersionRef === projectionVersionRef,
      )
      .flatMap((definition) => definition.acceptedSchemaVersionRefs);
    return Array.from(new Set(refs)).sort((left, right) => left.localeCompare(right));
  }

  hasConsumption(
    projectionFamilyRef: string,
    projectionVersionRef: string,
    eventName: string,
  ): boolean {
    return this.definitionsByFamilyVersionEvent.has(
      this.makeKey(projectionFamilyRef, projectionVersionRef, eventName),
    );
  }

  findDefinition(
    projectionFamilyRef: string,
    projectionVersionRef: string,
    eventName: string,
    schemaVersionRef: string,
  ): ProjectionHandlerDefinition<any, any> | undefined {
    const definitions =
      this.definitionsByFamilyVersionEvent.get(
        this.makeKey(projectionFamilyRef, projectionVersionRef, eventName),
      ) ?? [];
    return definitions.find((definition) =>
      definition.acceptedSchemaVersionRefs.includes(schemaVersionRef),
    );
  }
}

export class InMemoryProjectionRuntimeStore {
  private readonly projectionDocuments = new Map<string, ProjectionDocument>();
  private readonly applyReceipts = new Map<string, ProjectionApplyReceipt>();
  private readonly checkpoints = new Map<string, ProjectionCheckpoint>();
  private readonly cursors = new Map<string, ProjectionRebuildCursor>();
  private readonly ledgers = new Map<string, ProjectionRebuildLedger>();
  private readonly readinessVerdicts = new Map<string, ProjectionReadinessVerdict>();
  private readonly dryRunComparisons = new Map<string, ProjectionDryRunComparison>();

  getProjectionDocument<TState = object>(
    projectionFamilyRef: string,
    projectionVersionRef: string,
    projectionKey = "singleton",
  ): ProjectionDocument<TState> | undefined {
    return this.projectionDocuments.get(
      makeProjectionKey(projectionFamilyRef, projectionVersionRef, projectionKey),
    ) as ProjectionDocument<TState> | undefined;
  }

  saveProjectionDocument(document: ProjectionDocument<any>): void {
    this.projectionDocuments.set(
      makeProjectionKey(
        document.projectionFamilyRef,
        document.projectionVersionRef,
        document.projectionKey,
      ),
      document,
    );
  }

  getReceipt(
    projectionFamilyRef: string,
    projectionVersionRef: string,
    projectionKey: string,
    eventId: string,
  ): ProjectionApplyReceipt | undefined {
    return this.applyReceipts.get(
      makeReceiptKey(projectionFamilyRef, projectionVersionRef, projectionKey, eventId),
    );
  }

  saveReceipt(receipt: ProjectionApplyReceipt): void {
    this.applyReceipts.set(
      makeReceiptKey(
        receipt.projectionFamilyRef,
        receipt.projectionVersionRef,
        receipt.projectionKey,
        receipt.eventId,
      ),
      receipt,
    );
  }

  listReceipts(): readonly ProjectionApplyReceipt[] {
    return Array.from(this.applyReceipts.values()).sort(
      (left, right) => left.streamPosition - right.streamPosition,
    );
  }

  getCheckpoint(
    projectionFamilyRef: string,
    projectionVersionRef: string,
    projectionKey = "singleton",
  ): ProjectionCheckpoint | undefined {
    return this.checkpoints.get(
      makeProjectionKey(projectionFamilyRef, projectionVersionRef, projectionKey),
    );
  }

  saveCheckpoint(checkpoint: ProjectionCheckpoint): void {
    this.checkpoints.set(
      makeProjectionKey(
        checkpoint.projectionFamilyRef,
        checkpoint.projectionVersionRef,
        checkpoint.projectionKey,
      ),
      checkpoint,
    );
  }

  listCheckpoints(): readonly ProjectionCheckpoint[] {
    return Array.from(this.checkpoints.values()).sort((left, right) =>
      left.projectionFamilyRef.localeCompare(right.projectionFamilyRef),
    );
  }

  getCursor(
    projectionFamilyRef: string,
    projectionVersionRef: string,
    projectionKey: string,
    environment: string,
  ): ProjectionRebuildCursor | undefined {
    return this.cursors.get(
      makeCursorKey(projectionFamilyRef, projectionVersionRef, projectionKey, environment),
    );
  }

  saveCursor(cursor: ProjectionRebuildCursor): void {
    this.cursors.set(
      makeCursorKey(
        cursor.projectionFamilyRef,
        cursor.projectionVersionRef,
        cursor.projectionKey,
        cursor.environment,
      ),
      cursor,
    );
  }

  saveLedger(ledger: ProjectionRebuildLedger): void {
    this.ledgers.set(
      `${ledger.rebuildJobId}::${ledger.projectionFamilyRef}::${ledger.projectionVersionRef}`,
      ledger,
    );
  }

  listLedgers(): readonly ProjectionRebuildLedger[] {
    return Array.from(this.ledgers.values()).sort((left, right) =>
      left.projectionFamilyRef.localeCompare(right.projectionFamilyRef),
    );
  }

  saveReadinessVerdict(verdict: ProjectionReadinessVerdict): void {
    this.readinessVerdicts.set(
      `${verdict.projectionFamilyRef}::${verdict.projectionVersionRef}::${verdict.projectionVersionSetRef}`,
      verdict,
    );
  }

  listReadinessVerdicts(): readonly ProjectionReadinessVerdict[] {
    return Array.from(this.readinessVerdicts.values()).sort((left, right) =>
      left.projectionFamilyRef.localeCompare(right.projectionFamilyRef),
    );
  }

  saveDryRunComparison(comparison: ProjectionDryRunComparison): void {
    this.dryRunComparisons.set(comparison.comparisonRef, comparison);
  }

  listDryRunComparisons(): readonly ProjectionDryRunComparison[] {
    return Array.from(this.dryRunComparisons.values()).sort((left, right) =>
      left.comparisonRef.localeCompare(right.comparisonRef),
    );
  }
}

export function createProjectionRuntimeStore(): InMemoryProjectionRuntimeStore {
  return new InMemoryProjectionRuntimeStore();
}

export function evaluateProjectionCompatibility(args: {
  projectionVersionRef: string;
  projectionVersionSetRef: string;
  availableSchemaVersionRefs: readonly string[];
  evaluatedAt?: string;
}): ProjectionCompatibilityVerdict {
  const version = getProjectionVersion(args.projectionVersionRef);
  const versionSet = getProjectionVersionSet(args.projectionVersionSetRef);
  const compatibilityWindow = getCompatibilityWindow(versionSet.compatibilityWindowRef);
  const missingSchemaVersionRefs = version.requiredSchemaVersionRefs.filter(
    (schemaVersionRef) => !args.availableSchemaVersionRefs.includes(schemaVersionRef),
  );

  if (missingSchemaVersionRefs.length > 0) {
    return {
      projectionFamilyRef: version.projectionFamilyRef,
      projectionVersionRef: version.projectionVersionRef,
      projectionVersionSetRef: versionSet.projectionVersionSetRef,
      compatibilityState: "blocked",
      writableDisposition: "blocked",
      missingSchemaVersionRefs,
      activeVersionRefs: compatibilityWindow.allowedVersionRefs,
      evaluatedAt: args.evaluatedAt ?? nowIso(),
      reason: "Required schema versions are not present in the applier dispatch registry.",
    };
  }

  if (
    compatibilityWindow.mode === "dual_read" &&
    version.dualReadCompatibleVersionRefs.length > 0 &&
    compatibilityWindow.allowedVersionRefs.some((entry) =>
      version.dualReadCompatibleVersionRefs.includes(entry),
    )
  ) {
    return {
      projectionFamilyRef: version.projectionFamilyRef,
      projectionVersionRef: version.projectionVersionRef,
      projectionVersionSetRef: versionSet.projectionVersionSetRef,
      compatibilityState: "dual_read",
      writableDisposition: compatibilityWindow.writableDisposition,
      missingSchemaVersionRefs: [],
      activeVersionRefs: compatibilityWindow.allowedVersionRefs,
      evaluatedAt: args.evaluatedAt ?? nowIso(),
      reason:
        "The projection version set is running in an explicit dual-read compatibility window.",
    };
  }

  return {
    projectionFamilyRef: version.projectionFamilyRef,
    projectionVersionRef: version.projectionVersionRef,
    projectionVersionSetRef: versionSet.projectionVersionSetRef,
    compatibilityState: "exact",
    writableDisposition: compatibilityWindow.writableDisposition,
    missingSchemaVersionRefs: [],
    activeVersionRefs: compatibilityWindow.allowedVersionRefs,
    evaluatedAt: args.evaluatedAt ?? nowIso(),
    reason: "The projection version requirements match the current dispatch registry exactly.",
  };
}

export function evaluateProjectionReadinessVerdict(args: {
  projectionVersionRef: string;
  projectionVersionSetRef: string;
  compatibilityVerdict: ProjectionCompatibilityVerdict;
  checkpointLag: number;
  checkpointToken: string | null;
  rebuildState: ProjectionRebuildState;
  cutoverPending?: boolean;
  blockerRefs?: readonly string[];
  evaluatedAt?: string;
}): ProjectionReadinessVerdict {
  const version = getProjectionVersion(args.projectionVersionRef);
  const cutoverPending = args.cutoverPending ?? false;
  const blockerRefs = [...(args.blockerRefs ?? [])];

  if (args.compatibilityVerdict.compatibilityState === "blocked") {
    return {
      projectionFamilyRef: version.projectionFamilyRef,
      projectionVersionRef: version.projectionVersionRef,
      projectionVersionSetRef: args.projectionVersionSetRef,
      readinessState: "blocked",
      readPathDisposition: "blocked",
      writableDisposition: "blocked",
      checkpointLag: args.checkpointLag,
      checkpointToken: args.checkpointToken,
      rebuildState: args.rebuildState,
      compatibilityState: args.compatibilityVerdict.compatibilityState,
      cutoverPending,
      evaluatedAt: args.evaluatedAt ?? nowIso(),
      blockerRefs: [
        ...blockerRefs,
        ...args.compatibilityVerdict.missingSchemaVersionRefs.map(
          (schemaVersionRef) => `missing_schema:${schemaVersionRef}`,
        ),
      ],
      reason: args.compatibilityVerdict.reason,
    };
  }

  if (args.rebuildState === "crashed" || args.rebuildState === "blocked") {
    return {
      projectionFamilyRef: version.projectionFamilyRef,
      projectionVersionRef: version.projectionVersionRef,
      projectionVersionSetRef: args.projectionVersionSetRef,
      readinessState: "blocked",
      readPathDisposition: "blocked",
      writableDisposition: "blocked",
      checkpointLag: args.checkpointLag,
      checkpointToken: args.checkpointToken,
      rebuildState: args.rebuildState,
      compatibilityState: args.compatibilityVerdict.compatibilityState,
      cutoverPending,
      evaluatedAt: args.evaluatedAt ?? nowIso(),
      blockerRefs: [...blockerRefs, "rebuild_fault"],
      reason: "The projection worker is not in a recoverable live posture.",
    };
  }

  if (args.checkpointLag > version.staleAfterEventLag) {
    return {
      projectionFamilyRef: version.projectionFamilyRef,
      projectionVersionRef: version.projectionVersionRef,
      projectionVersionSetRef: args.projectionVersionSetRef,
      readinessState: "stale",
      readPathDisposition: "summary_only",
      writableDisposition: "guarded",
      checkpointLag: args.checkpointLag,
      checkpointToken: args.checkpointToken,
      rebuildState: args.rebuildState,
      compatibilityState: args.compatibilityVerdict.compatibilityState,
      cutoverPending,
      evaluatedAt: args.evaluatedAt ?? nowIso(),
      blockerRefs: [...blockerRefs, "checkpoint_lag_exceeded"],
      reason: "Checkpoint lag exceeds the declared publication threshold for this projection.",
    };
  }

  if (
    args.rebuildState === "running" ||
    args.compatibilityVerdict.compatibilityState === "dual_read" ||
    cutoverPending
  ) {
    return {
      projectionFamilyRef: version.projectionFamilyRef,
      projectionVersionRef: version.projectionVersionRef,
      projectionVersionSetRef: args.projectionVersionSetRef,
      readinessState: "recovering",
      readPathDisposition: "summary_only",
      writableDisposition: args.compatibilityVerdict.writableDisposition,
      checkpointLag: args.checkpointLag,
      checkpointToken: args.checkpointToken,
      rebuildState: args.rebuildState,
      compatibilityState: args.compatibilityVerdict.compatibilityState,
      cutoverPending,
      evaluatedAt: args.evaluatedAt ?? nowIso(),
      blockerRefs,
      reason: "The projection is replay-safe but is still converging or awaiting cutover.",
    };
  }

  return {
    projectionFamilyRef: version.projectionFamilyRef,
    projectionVersionRef: version.projectionVersionRef,
    projectionVersionSetRef: args.projectionVersionSetRef,
    readinessState: "live",
    readPathDisposition: "full_projection",
    writableDisposition: args.compatibilityVerdict.writableDisposition,
    checkpointLag: args.checkpointLag,
    checkpointToken: args.checkpointToken,
    rebuildState: args.rebuildState,
    compatibilityState: args.compatibilityVerdict.compatibilityState,
    cutoverPending,
    evaluatedAt: args.evaluatedAt ?? nowIso(),
    blockerRefs,
    reason: "Projection checkpoints are current and the published contract is compatible.",
  };
}

export class EventApplier {
  constructor(
    private readonly store: InMemoryProjectionRuntimeStore,
    private readonly registry = new ProjectionHandlerRegistry(),
  ) {}

  getRegistry(): ProjectionHandlerRegistry {
    return this.registry;
  }

  apply(args: {
    projectionFamilyRef: string;
    projectionVersionRef: string;
    projectionKey: string;
    event: ProjectionReplayEnvelope;
  }): EventApplyResult<any> {
    const artifact = getSchemaArtifact(args.event.eventName, args.event.schemaVersionRef);
    if (!artifact) {
      return {
        status: "blocked",
        blockerRef: "unknown_schema_version",
        reason: `Event ${args.event.eventName} is not published at ${args.event.schemaVersionRef}.`,
      };
    }

    if (
      !this.registry.hasConsumption(
        args.projectionFamilyRef,
        args.projectionVersionRef,
        args.event.eventName,
      )
    ) {
      return {
        status: "ignored",
        reason: `Projection ${args.projectionFamilyRef} does not consume ${args.event.eventName}.`,
      };
    }

    const definition = this.registry.findDefinition(
      args.projectionFamilyRef,
      args.projectionVersionRef,
      args.event.eventName,
      args.event.schemaVersionRef,
    );

    if (!definition) {
      return {
        status: "blocked",
        blockerRef: "incompatible_event_version",
        reason: `Projection ${args.projectionVersionRef} does not accept ${args.event.schemaVersionRef}.`,
      };
    }

    const existingReceipt = this.store.getReceipt(
      args.projectionFamilyRef,
      args.projectionVersionRef,
      args.projectionKey,
      args.event.eventId,
    );
    if (existingReceipt) {
      return {
        status: "duplicate",
        receipt: existingReceipt,
      };
    }

    const currentDocument =
      this.store.getProjectionDocument<any>(
        args.projectionFamilyRef,
        args.projectionVersionRef,
        args.projectionKey,
      ) ??
      ({
        projectionFamilyRef: args.projectionFamilyRef,
        projectionVersionRef: args.projectionVersionRef,
        projectionKey: args.projectionKey,
        contractDigest: getProjectionVersion(args.projectionVersionRef).contractDigest,
        state: definition.createEmptyState(),
        lastAppliedEventId: null,
        lastAppliedStreamPosition: 0,
        updatedAt: null,
      } satisfies ProjectionDocument<any>);

    const nextState = definition.reducer(cloneState(currentDocument.state), args.event);
    const appliedAt = nowIso();
    const nextDocument: ProjectionDocument<any> = {
      ...currentDocument,
      contractDigest: getProjectionVersion(args.projectionVersionRef).contractDigest,
      state: nextState,
      lastAppliedEventId: args.event.eventId,
      lastAppliedStreamPosition: args.event.streamPosition,
      updatedAt: appliedAt,
    };

    const receipt: ProjectionApplyReceipt = {
      projectionFamilyRef: args.projectionFamilyRef,
      projectionVersionRef: args.projectionVersionRef,
      projectionKey: args.projectionKey,
      eventId: args.event.eventId,
      eventName: args.event.eventName,
      schemaVersionRef: args.event.schemaVersionRef,
      streamPosition: args.event.streamPosition,
      effectDigest: makeDigest({
        document: nextDocument.state,
        eventId: args.event.eventId,
        projectionVersionRef: args.projectionVersionRef,
      }),
      appliedAt,
    };

    this.store.saveProjectionDocument(nextDocument);
    this.store.saveReceipt(receipt);

    return {
      status: "applied",
      document: nextDocument,
      receipt,
    };
  }
}

function compareProjectionStates(
  candidate: Record<string, unknown>,
  baseline: Record<string, unknown>,
): { matchesLive: boolean; coreParityMatch: boolean; changedFields: readonly string[] } {
  const candidateRecord = candidate as Record<string, unknown>;
  const baselineRecord = baseline as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(candidate), ...Object.keys(baseline)])).sort(
    (left, right) => left.localeCompare(right),
  );
  const changedFields = keys.filter(
    (key) => stableStringify(candidateRecord[key]) !== stableStringify(baselineRecord[key]),
  );
  const coreParityFields = keys.filter(
    (key) =>
      key.endsWith("Count") ||
      key.endsWith("Refs") ||
      key === "calmSummaryState" ||
      key === "openRequestCount",
  );
  const coreParityMatch = coreParityFields.every(
    (key) => stableStringify(candidateRecord[key]) === stableStringify(baselineRecord[key]),
  );
  return {
    matchesLive: changedFields.length === 0,
    coreParityMatch,
    changedFields,
  };
}

export class ProjectionRebuildWorker {
  constructor(
    private readonly store: InMemoryProjectionRuntimeStore,
    private readonly applier: EventApplier,
  ) {}

  async run(options: ProjectionRebuildRunOptions): Promise<ProjectionRebuildRunResult> {
    const rebuildMode = options.rebuildMode ?? "rebuild";
    const targets = [...options.targets].sort((left, right) =>
      left.projectionFamilyRef.localeCompare(right.projectionFamilyRef),
    );
    const maxParallelTargets = Math.max(1, options.maxParallelTargets ?? 1);
    const ledgers: ProjectionRebuildLedger[] = [];
    const readinessVerdicts: ProjectionReadinessVerdict[] = [];
    const dryRunComparisons: ProjectionDryRunComparison[] = [];
    let remainingCrashBudget = options.simulateCrashAfterApplyCount ?? Number.POSITIVE_INFINITY;

    const orderedEvents = [...options.eventStream].sort((left, right) => {
      if (left.streamPosition !== right.streamPosition) {
        return left.streamPosition - right.streamPosition;
      }
      return left.eventId.localeCompare(right.eventId);
    });

    for (let index = 0; index < targets.length; index += maxParallelTargets) {
      const batch = targets.slice(index, index + maxParallelTargets);
      const batchResults = await Promise.all(
        batch.map(async (target) => {
          const projectionKey = target.projectionKey ?? "singleton";
          const environment = target.environment ?? "lab";
          const versionSet = getProjectionVersionSet(target.projectionVersionSetRef);
          const compatibilityVerdict = evaluateProjectionCompatibility({
            projectionVersionRef: target.projectionVersionRef,
            projectionVersionSetRef: target.projectionVersionSetRef,
            availableSchemaVersionRefs: this.applier
              .getRegistry()
              .getSupportedSchemaVersionRefs(
                target.projectionFamilyRef,
                target.projectionVersionRef,
              ),
          });

          const cursor =
            this.store.getCursor(
              target.projectionFamilyRef,
              target.projectionVersionRef,
              projectionKey,
              environment,
            ) ??
            ({
              cursorRef: `${options.rebuildJobId}::${target.projectionFamilyRef}::${target.projectionVersionRef}`,
              projectionFamilyRef: target.projectionFamilyRef,
              projectionVersionRef: target.projectionVersionRef,
              projectionKey,
              environment,
              rebuildMode,
              rebuildState: "idle",
              nextStreamPosition: 1,
              lastSeenEventId: null,
              checkpointToken: null,
              updatedAt: nowIso(),
            } satisfies ProjectionRebuildCursor);

          const initialResumeCount = this.store.getCheckpoint(
            target.projectionFamilyRef,
            target.projectionVersionRef,
            projectionKey,
          )
            ? 1
            : 0;

          const ledger: ProjectionRebuildLedger = {
            rebuildJobId: options.rebuildJobId,
            projectionFamilyRef: target.projectionFamilyRef,
            projectionVersionRef: target.projectionVersionRef,
            projectionVersionSetRef: target.projectionVersionSetRef,
            projectionKey,
            environment,
            rebuildMode,
            rebuildState:
              compatibilityVerdict.compatibilityState === "blocked" ? "blocked" : "running",
            processedEventCount: 0,
            duplicateEventCount: 0,
            blockedEventCount: 0,
            ignoredEventCount: 0,
            resumeCount: initialResumeCount,
            crashCount: 0,
            checkpointToken: cursor.checkpointToken,
            lastAppliedStreamPosition: Math.max(0, cursor.nextStreamPosition - 1),
            compatibilityState: compatibilityVerdict.compatibilityState,
            readinessState: "recovering",
            startedAt: nowIso(),
            finishedAt: null,
            notes: [],
          };

          if (compatibilityVerdict.compatibilityState === "blocked") {
            const readinessVerdict = evaluateProjectionReadinessVerdict({
              projectionVersionRef: target.projectionVersionRef,
              projectionVersionSetRef: target.projectionVersionSetRef,
              compatibilityVerdict,
              checkpointLag: orderedEvents.length,
              checkpointToken: cursor.checkpointToken,
              rebuildState: "blocked",
              blockerRefs: compatibilityVerdict.missingSchemaVersionRefs.map(
                (entry) => `schema:${entry}`,
              ),
            });
            ledger.rebuildState = "blocked";
            ledger.blockedEventCount = compatibilityVerdict.missingSchemaVersionRefs.length;
            ledger.readinessState = readinessVerdict.readinessState;
            ledger.finishedAt = nowIso();
            this.store.saveCursor({
              ...cursor,
              rebuildMode,
              rebuildState: "blocked",
              updatedAt: nowIso(),
            });
            this.store.saveLedger(ledger);
            this.store.saveReadinessVerdict(readinessVerdict);
            return {
              ledger,
              readinessVerdict,
              dryRunComparison: null as ProjectionDryRunComparison | null,
            };
          }

          const relevantEvents = orderedEvents.filter(
            (event) =>
              event.streamPosition >= cursor.nextStreamPosition &&
              this.applier
                .getRegistry()
                .hasConsumption(
                  target.projectionFamilyRef,
                  target.projectionVersionRef,
                  event.eventName,
                ),
          );

          const seedDefinition = this.applier
            .getRegistry()
            .getDefinitions()
            .find(
              (definition) =>
                definition.projectionFamilyRef === target.projectionFamilyRef &&
                definition.projectionVersionRef === target.projectionVersionRef,
            );
          if (!seedDefinition) {
            throw new Error(
              `Missing handler seed for ${target.projectionFamilyRef}/${target.projectionVersionRef}.`,
            );
          }

          const currentDocument = this.store.getProjectionDocument(
            target.projectionFamilyRef,
            target.projectionVersionRef,
            projectionKey,
          );

          const baselineDocument =
            rebuildMode === "dry_run" && versionSet.shadowVersionRef
              ? this.store.getProjectionDocument(
                  target.projectionFamilyRef,
                  versionSet.shadowVersionRef,
                  projectionKey,
                )
              : null;

          let shadowState =
            rebuildMode === "dry_run"
              ? cloneState(
                  (baselineDocument?.state ??
                    currentDocument?.state ??
                    seedDefinition.createEmptyState()) as object,
                )
              : null;

          this.store.saveCursor({
            ...cursor,
            rebuildMode,
            rebuildState: "running",
            updatedAt: nowIso(),
          });

          for (const event of relevantEvents) {
            if (rebuildMode === "dry_run") {
              const definition = this.applier
                .getRegistry()
                .findDefinition(
                  target.projectionFamilyRef,
                  target.projectionVersionRef,
                  event.eventName,
                  event.schemaVersionRef,
                );
              if (!definition) {
                ledger.blockedEventCount += 1;
                ledger.rebuildState = "blocked";
                break;
              }
              if (!shadowState) {
                shadowState = definition.createEmptyState();
              }
              shadowState = definition.reducer(shadowState, event);
              ledger.processedEventCount += 1;
              ledger.lastAppliedStreamPosition = event.streamPosition;
              continue;
            }

            const applyResult = this.applier.apply({
              projectionFamilyRef: target.projectionFamilyRef,
              projectionVersionRef: target.projectionVersionRef,
              projectionKey,
              event,
            });

            if (applyResult.status === "ignored") {
              ledger.ignoredEventCount += 1;
              continue;
            }

            if (applyResult.status === "blocked") {
              ledger.blockedEventCount += 1;
              ledger.rebuildState = "blocked";
              break;
            }

            if (applyResult.status === "duplicate") {
              ledger.duplicateEventCount += 1;
            }

            if (applyResult.status === "applied") {
              ledger.processedEventCount += 1;
            }

            ledger.lastAppliedStreamPosition = event.streamPosition;

            if (applyResult.status === "applied") {
              remainingCrashBudget -= 1;
              if (remainingCrashBudget === 0) {
                ledger.crashCount += 1;
                ledger.rebuildState = "crashed";
                ledger.finishedAt = nowIso();
                this.store.saveLedger(ledger);
                this.store.saveCursor({
                  ...cursor,
                  rebuildMode,
                  rebuildState: "crashed",
                  nextStreamPosition: event.streamPosition,
                  lastSeenEventId: event.eventId,
                  checkpointToken: cursor.checkpointToken,
                  updatedAt: nowIso(),
                });
                const readinessVerdict = evaluateProjectionReadinessVerdict({
                  projectionVersionRef: target.projectionVersionRef,
                  projectionVersionSetRef: target.projectionVersionSetRef,
                  compatibilityVerdict,
                  checkpointLag: orderedEvents.length - event.streamPosition,
                  checkpointToken: cursor.checkpointToken,
                  rebuildState: "crashed",
                  blockerRefs: ["simulated_crash"],
                });
                this.store.saveReadinessVerdict(readinessVerdict);
                return {
                  ledger,
                  readinessVerdict,
                  dryRunComparison: null as ProjectionDryRunComparison | null,
                };
              }
            }

            const checkpoint: ProjectionCheckpoint = {
              projectionFamilyRef: target.projectionFamilyRef,
              projectionVersionRef: target.projectionVersionRef,
              projectionKey,
              checkpointToken: makeDigest({
                projectionFamilyRef: target.projectionFamilyRef,
                projectionVersionRef: target.projectionVersionRef,
                projectionKey,
                eventId: event.eventId,
                streamPosition: event.streamPosition,
              }),
              checkpointedThroughEventId: event.eventId,
              checkpointedThroughPosition: event.streamPosition,
              nextStreamPosition: event.streamPosition + 1,
              updatedAt: nowIso(),
            };
            this.store.saveCheckpoint(checkpoint);
            this.store.saveCursor({
              ...cursor,
              rebuildMode,
              rebuildState: "running",
              nextStreamPosition: checkpoint.nextStreamPosition,
              lastSeenEventId: event.eventId,
              checkpointToken: checkpoint.checkpointToken,
              updatedAt: checkpoint.updatedAt,
            });
            ledger.checkpointToken = checkpoint.checkpointToken;
          }

          if (ledger.rebuildState === "running") {
            ledger.rebuildState = "completed";
          }
          ledger.finishedAt = nowIso();
          const checkpoint = this.store.getCheckpoint(
            target.projectionFamilyRef,
            target.projectionVersionRef,
            projectionKey,
          );
          const lastRelevantEvent =
            relevantEvents.length > 0 ? relevantEvents[relevantEvents.length - 1] : null;
          const maxRelevantPosition = lastRelevantEvent
            ? lastRelevantEvent.streamPosition
            : ledger.lastAppliedStreamPosition;
          const checkpointLag =
            rebuildMode === "dry_run"
              ? 0
              : Math.max(0, maxRelevantPosition - (checkpoint?.checkpointedThroughPosition ?? 0));
          const readinessCheckpointToken =
            rebuildMode === "dry_run"
              ? `dry_run_${makeDigest({
                  rebuildJobId: options.rebuildJobId,
                  projectionFamilyRef: target.projectionFamilyRef,
                  projectionVersionRef: target.projectionVersionRef,
                  maxRelevantPosition,
                }).slice(0, 16)}`
              : (checkpoint?.checkpointToken ?? null);

          let dryRunComparison: ProjectionDryRunComparison | null = null;
          if (rebuildMode === "dry_run") {
            const liveDocument =
              baselineDocument ??
              this.store.getProjectionDocument(
                target.projectionFamilyRef,
                versionSet.shadowVersionRef ?? target.projectionVersionRef,
                projectionKey,
              );
            if (shadowState && liveDocument) {
              const comparison = compareProjectionStates(
                shadowState as Record<string, unknown>,
                liveDocument.state as Record<string, unknown>,
              );
              dryRunComparison = {
                comparisonRef: `${options.rebuildJobId}::${target.projectionFamilyRef}::${target.projectionVersionRef}`,
                projectionFamilyRef: target.projectionFamilyRef,
                candidateVersionRef: target.projectionVersionRef,
                baselineVersionRef: liveDocument.projectionVersionRef,
                comparisonDigest: makeDigest({
                  candidate: shadowState,
                  baseline: liveDocument.state,
                }),
                matchesLive: comparison.matchesLive,
                coreParityMatch: comparison.coreParityMatch,
                changedFields: comparison.changedFields,
                evaluatedAt: nowIso(),
              };
              this.store.saveDryRunComparison(dryRunComparison);
            }
          }

          const readinessVerdict = evaluateProjectionReadinessVerdict({
            projectionVersionRef: target.projectionVersionRef,
            projectionVersionSetRef: target.projectionVersionSetRef,
            compatibilityVerdict,
            checkpointLag,
            checkpointToken: readinessCheckpointToken,
            rebuildState: ledger.rebuildState,
            cutoverPending:
              rebuildMode === "dry_run" && compatibilityVerdict.compatibilityState === "dual_read",
          });

          ledger.readinessState = readinessVerdict.readinessState;
          ledger.compatibilityState = compatibilityVerdict.compatibilityState;
          this.store.saveLedger(ledger);
          this.store.saveReadinessVerdict(readinessVerdict);

          return { ledger, readinessVerdict, dryRunComparison };
        }),
      );

      for (const result of batchResults) {
        ledgers.push(result.ledger);
        readinessVerdicts.push(result.readinessVerdict);
        if (result.dryRunComparison) {
          dryRunComparisons.push(result.dryRunComparison);
        }
      }
    }

    return {
      rebuildJobId: options.rebuildJobId,
      ledgers,
      readinessVerdicts,
      dryRunComparisons,
    };
  }
}

export function validateProjectionLedgerState(
  store: InMemoryProjectionRuntimeStore,
): ProjectionLedgerValidation {
  const errors: string[] = [];
  const checkpointKeys = new Set(
    store
      .listCheckpoints()
      .map((checkpoint) =>
        makeProjectionKey(
          checkpoint.projectionFamilyRef,
          checkpoint.projectionVersionRef,
          checkpoint.projectionKey,
        ),
      ),
  );

  for (const ledger of store.listLedgers()) {
    const key = makeProjectionKey(
      ledger.projectionFamilyRef,
      ledger.projectionVersionRef,
      ledger.projectionKey,
    );
    if (
      ledger.rebuildState === "completed" &&
      !checkpointKeys.has(key) &&
      ledger.rebuildMode !== "dry_run"
    ) {
      errors.push(`Missing checkpoint for completed ledger ${ledger.rebuildJobId}/${key}.`);
    }
    if (ledger.processedEventCount < 0 || ledger.duplicateEventCount < 0) {
      errors.push(`Negative counters detected for ${ledger.rebuildJobId}/${key}.`);
    }
  }

  const receiptIds = new Set<string>();
  for (const receipt of store.listReceipts()) {
    const receiptKey = makeReceiptKey(
      receipt.projectionFamilyRef,
      receipt.projectionVersionRef,
      receipt.projectionKey,
      receipt.eventId,
    );
    if (receiptIds.has(receiptKey)) {
      errors.push(`Duplicate receipt detected for ${receiptKey}.`);
    }
    receiptIds.add(receiptKey);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function makeProjectionReplayEvent<TPayload extends Record<string, unknown>>(args: {
  eventName: string;
  streamPosition: number;
  payload: TPayload;
  schemaVersionRef?: string;
  emittedAt?: string;
  partitionKey?: string;
  eventId?: string;
}): ProjectionReplayEnvelope<TPayload> {
  const artifact = getSchemaArtifact(args.eventName, args.schemaVersionRef);
  if (!artifact) {
    throw new Error(
      `Unknown schema artifact for ${args.eventName}/${args.schemaVersionRef ?? "latest"}.`,
    );
  }

  const partitionKey =
    args.partitionKey ??
    (typeof args.payload.requestId === "string"
      ? args.payload.requestId
      : typeof args.payload.taskId === "string"
        ? args.payload.taskId
        : typeof args.payload.dependencyId === "string"
          ? args.payload.dependencyId
          : typeof args.payload.caseId === "string"
            ? args.payload.caseId
            : args.eventName);

  return {
    eventId:
      args.eventId ??
      `evt_${makeDigest({
        eventName: args.eventName,
        streamPosition: args.streamPosition,
        payload: args.payload,
      }).slice(0, 16)}`,
    eventName: args.eventName,
    schemaVersionRef: artifact.schemaVersionRef,
    emittedAt: args.emittedAt ?? new Date(2026, 3, 12, 9, args.streamPosition, 0).toISOString(),
    streamPosition: args.streamPosition,
    partitionKey,
    contractDigest: artifact.artifactSha256,
    payload: args.payload,
  };
}

export function createProjectionHandlerRegistry(): ProjectionHandlerRegistry {
  return new ProjectionHandlerRegistry();
}

export interface ProjectionRebuildSimulationHarness {
  store: InMemoryProjectionRuntimeStore;
  registry: ProjectionHandlerRegistry;
  applier: EventApplier;
  worker: ProjectionRebuildWorker;
  eventStream: readonly ProjectionReplayEnvelope[];
}

export function createProjectionRebuildSimulationHarness(): ProjectionRebuildSimulationHarness {
  const store = createProjectionRuntimeStore();
  const registry = createProjectionHandlerRegistry();
  const applier = new EventApplier(store, registry);
  const worker = new ProjectionRebuildWorker(store, applier);
  const eventStream = [
    makeProjectionReplayEvent({
      eventName: "request.created",
      streamPosition: 1,
      payload: { requestId: "REQ_082_001" },
    }),
    makeProjectionReplayEvent({
      eventName: "request.submitted",
      streamPosition: 2,
      payload: { requestId: "REQ_082_001" },
    }),
    makeProjectionReplayEvent({
      eventName: "triage.task.created",
      streamPosition: 3,
      payload: { taskId: "TASK_082_001", requestId: "REQ_082_001" },
    }),
    makeProjectionReplayEvent({
      eventName: "reachability.assessment.settled",
      streamPosition: 4,
      payload: { dependencyId: "DEP_082_SMS", assessmentState: "blocked" },
    }),
    makeProjectionReplayEvent({
      eventName: "identity.repair_case.freeze_committed",
      streamPosition: 5,
      payload: { requestId: "REQ_082_001", repairCaseId: "IRC_082_CASE" },
    }),
    makeProjectionReplayEvent({
      eventName: "triage.task.settled",
      streamPosition: 6,
      payload: { taskId: "TASK_082_001", requestId: "REQ_082_001" },
    }),
    makeProjectionReplayEvent({
      eventName: "identity.repair_release.settled",
      streamPosition: 7,
      payload: { requestId: "REQ_082_001", repairCaseId: "IRC_082_CASE" },
    }),
    makeProjectionReplayEvent({
      eventName: "exception.review_case.opened",
      streamPosition: 8,
      payload: { caseId: "EXC_082_001", severity: "warning" },
    }),
    makeProjectionReplayEvent({
      eventName: "request.closed",
      streamPosition: 9,
      payload: { requestId: "REQ_082_001" },
    }),
    makeProjectionReplayEvent({
      eventName: "reachability.repair.started",
      streamPosition: 10,
      payload: { dependencyId: "DEP_082_SMS" },
    }),
  ] as const satisfies readonly ProjectionReplayEnvelope[];

  return {
    store,
    registry,
    applier,
    worker,
    eventStream,
  };
}

export async function runProjectionRebuildSimulation() {
  const harness = createProjectionRebuildSimulationHarness();
  const coldRebuild = await harness.worker.run({
    rebuildJobId: "PRB_082_COLD_REBUILD",
    eventStream: harness.eventStream,
    targets: [
      {
        projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
        projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
        projectionVersionSetRef: "PRCVS_082_PATIENT_REQUESTS_V1",
      },
    ],
  });

  const partialHarness = createProjectionRebuildSimulationHarness();
  const checkpointSeedEvent = partialHarness.eventStream.find(
    (event) => event.eventName === "triage.task.created",
  );
  if (!checkpointSeedEvent) {
    throw new Error("Missing seed event for partial checkpoint replay.");
  }
  partialHarness.applier.apply({
    projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
    projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
    projectionKey: "singleton",
    event: checkpointSeedEvent,
  });
  const partialCheckpointToken = makeDigest({
    projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
    projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
    checkpointSeedEvent: checkpointSeedEvent.eventId,
  });
  partialHarness.store.saveCheckpoint({
    projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
    projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
    projectionKey: "singleton",
    checkpointToken: partialCheckpointToken,
    checkpointedThroughEventId: checkpointSeedEvent.eventId,
    checkpointedThroughPosition: checkpointSeedEvent.streamPosition,
    nextStreamPosition: checkpointSeedEvent.streamPosition + 1,
    updatedAt: nowIso(),
  });
  partialHarness.store.saveCursor({
    cursorRef: "PRB_082_PARTIAL_RESUME::cursor",
    projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
    projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
    projectionKey: "singleton",
    environment: "lab",
    rebuildMode: "catch_up",
    rebuildState: "idle",
    nextStreamPosition: checkpointSeedEvent.streamPosition + 1,
    lastSeenEventId: checkpointSeedEvent.eventId,
    checkpointToken: partialCheckpointToken,
    updatedAt: nowIso(),
  });
  const partialResume = await partialHarness.worker.run({
    rebuildJobId: "PRB_082_PARTIAL_RESUME",
    rebuildMode: "catch_up",
    eventStream: partialHarness.eventStream,
    targets: [
      {
        projectionFamilyRef: "PRCF_082_STAFF_WORKSPACE",
        projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
        projectionVersionSetRef: "PRCVS_082_STAFF_WORKSPACE_V1",
      },
    ],
  });

  const resumeHarness = createProjectionRebuildSimulationHarness();
  const firstPass = await resumeHarness.worker.run({
    rebuildJobId: "PRB_082_CRASHED_PASS",
    eventStream: resumeHarness.eventStream,
    targets: [
      {
        projectionFamilyRef: "PRCF_082_OPERATIONS_BOARD",
        projectionVersionRef: "PRCV_082_OPERATIONS_BOARD_V1",
        projectionVersionSetRef: "PRCVS_082_OPERATIONS_BOARD_V1",
      },
    ],
    simulateCrashAfterApplyCount: 1,
  });
  const resumedPass = await resumeHarness.worker.run({
    rebuildJobId: "PRB_082_RESUMED_PASS",
    eventStream: resumeHarness.eventStream,
    targets: [
      {
        projectionFamilyRef: "PRCF_082_OPERATIONS_BOARD",
        projectionVersionRef: "PRCV_082_OPERATIONS_BOARD_V1",
        projectionVersionSetRef: "PRCVS_082_OPERATIONS_BOARD_V1",
      },
    ],
  });

  const dualReadHarness = createProjectionRebuildSimulationHarness();
  await dualReadHarness.worker.run({
    rebuildJobId: "PRB_082_DUAL_READ_BASELINE",
    eventStream: dualReadHarness.eventStream,
    targets: [
      {
        projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
        projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V1",
        projectionVersionSetRef: "PRCVS_082_PATIENT_REQUESTS_V1",
      },
    ],
  });
  const dualRead = await dualReadHarness.worker.run({
    rebuildJobId: "PRB_082_DUAL_READ_COMPARE",
    rebuildMode: "dry_run",
    eventStream: dualReadHarness.eventStream,
    targets: [
      {
        projectionFamilyRef: "PRCF_082_PATIENT_REQUESTS",
        projectionVersionRef: "PRCV_082_PATIENT_REQUESTS_V2",
        projectionVersionSetRef: "PRCVS_082_PATIENT_REQUESTS_DUAL_READ",
      },
    ],
  });

  const blockedCompatibility = evaluateProjectionCompatibility({
    projectionVersionRef: "PRCV_082_SUPPORT_REPLAY_V2",
    projectionVersionSetRef: "PRCVS_082_SUPPORT_REPLAY_BLOCKED",
    availableSchemaVersionRefs: harness.registry.getSupportedSchemaVersionRefs(
      "PRCF_082_SUPPORT_REPLAY",
      "PRCV_082_SUPPORT_REPLAY_V2",
    ),
  });

  const staleVerdict = evaluateProjectionReadinessVerdict({
    projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
    projectionVersionSetRef: "PRCVS_082_STAFF_WORKSPACE_V1",
    compatibilityVerdict: evaluateProjectionCompatibility({
      projectionVersionRef: "PRCV_082_STAFF_WORKSPACE_V1",
      projectionVersionSetRef: "PRCVS_082_STAFF_WORKSPACE_V1",
      availableSchemaVersionRefs: harness.registry.getSupportedSchemaVersionRefs(
        "PRCF_082_STAFF_WORKSPACE",
        "PRCV_082_STAFF_WORKSPACE_V1",
      ),
    }),
    checkpointLag: 3,
    checkpointToken: "checkpoint_stale_082",
    rebuildState: "completed",
  });

  const validation = validateProjectionLedgerState(dualReadHarness.store);

  return {
    taskId: "par_082",
    mode: "Projection_Rebuild_Observatory",
    summary: {
      scenarioCount: 7,
      liveCount:
        coldRebuild.readinessVerdicts.filter((entry) => entry.readinessState === "live").length +
        partialResume.readinessVerdicts.filter((entry) => entry.readinessState === "live").length +
        resumedPass.readinessVerdicts.filter((entry) => entry.readinessState === "live").length,
      recoveringCount: dualRead.readinessVerdicts.filter(
        (entry) => entry.readinessState === "recovering",
      ).length,
      blockedCount: Number(blockedCompatibility.compatibilityState === "blocked"),
      staleCount: Number(staleVerdict.readinessState === "stale"),
      restartSafeResumeCount: resumedPass.ledgers.filter((entry) => entry.duplicateEventCount > 0)
        .length,
    },
    scenarios: [
      coldRebuild,
      partialResume,
      firstPass,
      resumedPass,
      dualRead,
      blockedCompatibility,
      staleVerdict,
    ],
    validation,
  };
}
