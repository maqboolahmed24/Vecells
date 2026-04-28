import {
  PHASE9_ASSURANCE_NORMALIZATION_VERSION,
  hashAssurancePayload,
  orderedSetHash,
  type AssuranceEvidenceGraphSnapshot,
  type AssuranceSliceTrustRecord,
} from "./phase9-assurance-ledger-contracts";
import type { Phase9GraphConsumerContext, Phase9GraphVerdictRecord } from "./phase9-assurance-graph-verdict-engine";
import type { RetentionLifecycleBinding } from "./phase9-governance-control-contracts";

export const PHASE9_ASSURANCE_PACK_FACTORY_VERSION =
  "440.phase9.assurance-pack-factory.v1";
export const PHASE9_ASSURANCE_PACK_REPRODUCTION_VERSION =
  "440.phase9.assurance-pack-reproduction.v1";

export type AssuranceFrameworkCode =
  | "DSPT"
  | "DTAC"
  | "DCB0129"
  | "DCB0160"
  | "NHS_APP_CHANNEL"
  | "IM1_CHANGE"
  | "LOCAL_TENANT";

export type AssurancePackState =
  | "draft"
  | "dry_run"
  | "blocked_graph"
  | "blocked_trust"
  | "stale_pack"
  | "denied_scope"
  | "ready_for_attestation"
  | "signed_off"
  | "published_internal"
  | "export_ready";

export type AssurancePackSettlementResult =
  | "pending_attestation"
  | "signed_off"
  | "published_internal"
  | "export_ready"
  | "blocked_graph"
  | "blocked_trust"
  | "stale_pack"
  | "denied_scope"
  | "failed";

export type AssurancePackActionType =
  | "attest"
  | "signoff"
  | "publish_internal"
  | "export_external"
  | "supersede";

export type EvidenceFreshnessState = "current" | "stale" | "expired";
export type EvidenceVisibilityState = "allowed" | "denied";
export type EvidenceSupersessionState = "current" | "superseded";
export type ReproductionState = "exact" | "drifted" | "blocked";

export interface StandardsVersionMap {
  readonly standardsVersionMapId: string;
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly frameworkVersion: string;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly controlSetRef: string;
  readonly querySetRef: string;
  readonly renderTemplateRef: string;
  readonly redactionPolicyRef: string;
  readonly evidenceFreshnessPolicyRef: string;
  readonly requiredGraphVerdictContext: Phase9GraphConsumerContext;
  readonly packHashInputRefs: readonly string[];
  readonly ownerRole: string;
}

export interface AssuranceControlRecord {
  readonly controlRecordId: string;
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly frameworkVersionRef: string;
  readonly controlCode: string;
  readonly tenantId: string;
  readonly state: "satisfied" | "partial" | "missing" | "blocked";
  readonly evidenceCoverage: number;
  readonly ownerRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly requiresContinuityEvidence: boolean;
  readonly requiredEvidenceRefs: readonly string[];
}

export interface EvidenceGapRecord {
  readonly evidenceGapRecordId: string;
  readonly controlRecordId: string;
  readonly gapType:
    | "missing_evidence"
    | "stale_evidence"
    | "blocked_graph"
    | "low_trust"
    | "missing_redaction"
    | "missing_continuity_proof"
    | "superseded_evidence"
    | "policy_version_mismatch"
    | "tenant_scope_mismatch"
    | "phase8_exit_evidence_missing";
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly dueAt: string;
  readonly remediationRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly originGraphEdgeRefs: readonly string[];
  readonly graphHash: string;
  readonly sourceFrameworkRef: string;
  readonly deterministicReasonCode: string;
}

export interface FrameworkPackGenerator {
  readonly generatorId: string;
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly versionRef: string;
  readonly querySetRef: string;
  readonly renderTemplateRef: string;
  readonly supportedPackFamily: string;
  readonly requiredControlCodes: readonly string[];
  readonly continuityRequiredControlCodes: readonly string[];
  readonly requiredTrustRefs: readonly string[];
  readonly artifactPresentationContractRef: string;
  readonly outboundNavigationGrantPolicyRef: string;
}

export interface MonthlyAssurancePack {
  readonly monthlyAssurancePackId: string;
  readonly tenantId: string;
  readonly month: string;
  readonly controlStatusRefs: readonly string[];
  readonly incidentRefs: readonly string[];
  readonly exceptionRefs: readonly string[];
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly signoffState: "not_started" | "pending_attestation" | "signed_off" | "blocked";
}

export interface ContinuityEvidencePackSection {
  readonly continuityEvidencePackSectionId: string;
  readonly controlCode: string;
  readonly affectedRouteFamilyRefs: readonly string[];
  readonly experienceContinuityEvidenceRefs: readonly string[];
  readonly supportingRuntimePublicationRefs: readonly string[];
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly graphEdgeRefs: readonly string[];
  readonly validationState: "valid" | "missing" | "blocked";
  readonly blockingRefs: readonly string[];
  readonly audienceTierRefs: readonly string[];
  readonly generatedAt: string;
}

export interface AssuranceEvidenceRow {
  readonly evidenceRef: string;
  readonly controlRecordRef: string;
  readonly tenantId: string;
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly controlCode: string;
  readonly graphEdgeRef: string;
  readonly evidenceHash: string;
  readonly capturedAt: string;
  readonly freshnessState: EvidenceFreshnessState;
  readonly visibilityState: EvidenceVisibilityState;
  readonly supersessionState: EvidenceSupersessionState;
  readonly trustRef: string;
  readonly retentionLifecycleBindingRef?: string;
  readonly continuityEvidenceRef?: string;
  readonly routeFamilyRef?: string;
  readonly runtimePublicationRef?: string;
}

export interface AssuranceArtifactPolicy {
  readonly artifactPresentationContractRef?: string;
  readonly artifactTransferSettlementRef?: string;
  readonly outboundNavigationGrantPolicyRef?: string;
  readonly redactionPolicyRef?: string;
  readonly exportAllowed: boolean;
  readonly policyHash: string;
}

export interface AssurancePackGenerationInput {
  readonly tenantId: string;
  readonly scopeRef: string;
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly generatedAt: string;
  readonly standardsVersionMaps: readonly StandardsVersionMap[];
  readonly generators: readonly FrameworkPackGenerator[];
  readonly controlRecords: readonly AssuranceControlRecord[];
  readonly evidenceRows: readonly AssuranceEvidenceRow[];
  readonly graphSnapshot?: AssuranceEvidenceGraphSnapshot;
  readonly graphVerdict?: Phase9GraphVerdictRecord;
  readonly trustRecords: readonly AssuranceSliceTrustRecord[];
  readonly retentionBindings: readonly RetentionLifecycleBinding[];
  readonly artifactPolicy?: AssuranceArtifactPolicy;
  readonly phase8ExitPacket?: { readonly verdict?: string; readonly evidenceBundleHash?: string };
  readonly incidentRefs?: readonly string[];
  readonly exceptionRefs?: readonly string[];
  readonly dryRun?: boolean;
}

export interface GeneratedAssurancePack {
  readonly assurancePackId: string;
  readonly tenantId: string;
  readonly scopeRef: string;
  readonly frameworkCode: AssuranceFrameworkCode;
  readonly frameworkVersion: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly packState: AssurancePackState;
  readonly standardsVersionMapRef: string;
  readonly generatorRef: string;
  readonly controlRecordRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly evidenceSetHash: string;
  readonly continuitySetHash: string;
  readonly queryPlanHash: string;
  readonly renderTemplateHash: string;
  readonly redactionPolicyHash: string;
  readonly graphHash: string;
  readonly graphSnapshotRef: string;
  readonly graphVerdictRef: string;
  readonly graphVerdictDecisionHash: string;
  readonly trustSnapshotSetHash: string;
  readonly packVersionHash: string;
  readonly serializedArtifactHash: string;
  readonly exportManifestHash: string;
  readonly reproductionHash: string;
  readonly reproductionState: ReproductionState;
  readonly generatedArtifactRef: string;
  readonly retentionLifecycleBindingRef: string;
  readonly blockerRefs: readonly string[];
  readonly generatedAt: string;
}

export interface AssurancePackActionRecord {
  readonly assurancePackActionRecordId: string;
  readonly assurancePackRef: string;
  readonly actionType: AssurancePackActionType;
  readonly routeIntentRef: string;
  readonly scopeTokenRef: string;
  readonly packVersionHash: string;
  readonly evidenceSetHash: string;
  readonly continuitySetHash: string;
  readonly graphHash: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly queryPlanHash: string;
  readonly renderTemplateHash: string;
  readonly redactionPolicyHash: string;
  readonly requiredTrustRefs: readonly string[];
  readonly assuranceSurfaceRuntimeBindingRef: string;
  readonly surfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly transitionEnvelopeRef: string;
  readonly releaseRecoveryDispositionRef: string;
  readonly idempotencyKey: string;
  readonly actorRef: string;
  readonly createdAt: string;
  readonly settledAt: string;
}

export interface AssurancePackSettlement {
  readonly assurancePackSettlementId: string;
  readonly assurancePackActionRecordRef: string;
  readonly commandActionRecordRef: string;
  readonly commandSettlementRecordRef: string;
  readonly uiTransitionSettlementRecordRef: string;
  readonly uiTelemetryDisclosureFenceRef: string;
  readonly presentationArtifactRef: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly result: AssurancePackSettlementResult;
  readonly serializedArtifactHash: string;
  readonly exportManifestHash: string;
  readonly reproductionHash: string;
  readonly reproductionState: ReproductionState;
  readonly recoveryActionRef: string;
  readonly recordedAt: string;
}

export interface AssurancePackFactoryResult {
  readonly schemaVersion: typeof PHASE9_ASSURANCE_PACK_FACTORY_VERSION;
  readonly standardsVersionMap: StandardsVersionMap;
  readonly generator: FrameworkPackGenerator;
  readonly pack: GeneratedAssurancePack;
  readonly monthlyPack: MonthlyAssurancePack;
  readonly continuitySections: readonly ContinuityEvidencePackSection[];
  readonly evidenceGaps: readonly EvidenceGapRecord[];
  readonly packActionRecords: readonly AssurancePackActionRecord[];
  readonly settlements: readonly AssurancePackSettlement[];
  readonly persisted: boolean;
  readonly resultHash: string;
}

export interface AssurancePackActionInput {
  readonly result: AssurancePackFactoryResult;
  readonly actionType: AssurancePackActionType;
  readonly actorRef: string;
  readonly routeIntentRef: string;
  readonly scopeTokenRef: string;
  readonly idempotencyKey: string;
  readonly generatedAt: string;
  readonly artifactPolicy?: AssuranceArtifactPolicy;
  readonly currentPackVersionHash?: string;
  readonly currentGraphHash?: string;
  readonly currentRedactionPolicyHash?: string;
}

export interface Phase9AssurancePackFactoryFixture {
  readonly schemaVersion: typeof PHASE9_ASSURANCE_PACK_FACTORY_VERSION;
  readonly generatedAt: string;
  readonly sourceAlgorithmRefs: readonly string[];
  readonly standardsVersionMaps: readonly StandardsVersionMap[];
  readonly generators: readonly FrameworkPackGenerator[];
  readonly baselineResult: AssurancePackFactoryResult;
  readonly dryRunResult: AssurancePackFactoryResult;
  readonly missingGraphVerdictResult: AssurancePackFactoryResult;
  readonly staleEvidenceResult: AssurancePackFactoryResult;
  readonly missingRedactionSettlement: AssurancePackSettlement;
  readonly ambiguousStandardsResult: AssurancePackFactoryResult;
  readonly wrongTenantResult: AssurancePackFactoryResult;
  readonly supersededEvidenceResult: AssurancePackFactoryResult;
  readonly missingContinuityResult: AssurancePackFactoryResult;
  readonly reproductionSettlement: AssurancePackSettlement;
  readonly changedTemplateResult: AssurancePackFactoryResult;
  readonly exportReadySettlement: AssurancePackSettlement;
  readonly replayHash: string;
}

export class Phase9AssurancePackFactoryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9AssurancePackFactoryError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new Phase9AssurancePackFactoryError(code, message);
  }
}

function toMs(timestamp: string): number {
  const parsed = Date.parse(timestamp);
  invariant(!Number.isNaN(parsed), "INVALID_TIMESTAMP", `Invalid timestamp ${timestamp}.`);
  return parsed;
}

function omitUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => omitUndefined(entry));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, omitUndefined(entry)]),
    );
  }
  return value;
}

function packHash(value: unknown, namespace: string): string {
  return hashAssurancePayload(omitUndefined(value), namespace);
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].filter((value) => value.length > 0).sort();
}

function isEffective(map: StandardsVersionMap, frameworkCode: AssuranceFrameworkCode, at: string): boolean {
  const atMs = toMs(at);
  return (
    map.frameworkCode === frameworkCode &&
    toMs(map.effectiveFrom) <= atMs &&
    (!map.effectiveTo || atMs < toMs(map.effectiveTo))
  );
}

function resolveStandardsVersion(input: AssurancePackGenerationInput): StandardsVersionMap | undefined {
  const active = input.standardsVersionMaps.filter((map) => isEffective(map, input.frameworkCode, input.periodEnd));
  if (active.length !== 1) {
    return undefined;
  }
  return active[0];
}

function resolveGenerator(input: AssurancePackGenerationInput, map: StandardsVersionMap): FrameworkPackGenerator | undefined {
  return input.generators.find(
    (generator) =>
      generator.frameworkCode === map.frameworkCode &&
      generator.versionRef === map.frameworkVersion &&
      generator.querySetRef === map.querySetRef &&
      generator.renderTemplateRef === map.renderTemplateRef,
  );
}

function derivePackState(blockers: readonly string[], dryRun: boolean): AssurancePackState {
  if (blockers.some((blocker) => blocker.startsWith("graph:"))) {
    return "blocked_graph";
  }
  if (blockers.some((blocker) => blocker.startsWith("trust:"))) {
    return "blocked_trust";
  }
  if (blockers.some((blocker) => blocker.startsWith("scope:") || blocker.startsWith("redaction:") || blocker.startsWith("tenant:"))) {
    return "denied_scope";
  }
  if (blockers.some((blocker) => blocker.startsWith("stale:"))) {
    return "stale_pack";
  }
  if (
    blockers.some(
      (blocker) =>
        blocker.startsWith("continuity:") ||
        blocker.startsWith("retention:") ||
        blocker.startsWith("phase8:"),
    )
  ) {
    return "stale_pack";
  }
  return dryRun ? "dry_run" : "ready_for_attestation";
}

function canonicalEvidenceRows(rows: readonly AssuranceEvidenceRow[]): readonly AssuranceEvidenceRow[] {
  return [...rows].sort(
    (left, right) =>
      left.frameworkCode.localeCompare(right.frameworkCode) ||
      left.controlCode.localeCompare(right.controlCode) ||
      left.evidenceRef.localeCompare(right.evidenceRef),
  );
}

function buildGaps(
  input: AssurancePackGenerationInput,
  map: StandardsVersionMap | undefined,
  controls: readonly AssuranceControlRecord[],
  evidenceRows: readonly AssuranceEvidenceRow[],
  blockers: readonly string[],
): readonly EvidenceGapRecord[] {
  const gaps: EvidenceGapRecord[] = [];
  const graphSnapshotRef = input.graphSnapshot?.assuranceEvidenceGraphSnapshotId ?? "graph-snapshot:missing";
  const graphHash = input.graphSnapshot?.graphHash ?? "graph:missing";
  const versionRef = map?.standardsVersionMapId ?? "standards-version:unresolved";
  const addGap = (
    control: AssuranceControlRecord | undefined,
    gapType: EvidenceGapRecord["gapType"],
    reason: string,
    severity: EvidenceGapRecord["severity"] = "high",
  ) => {
    const controlRef = control?.controlRecordId ?? `control:${input.frameworkCode}:unresolved`;
    const reasonCode = `${gapType}:${reason}`;
    const gapHash = packHash(
      { controlRef, tenantId: input.tenantId, graphHash, reasonCode, versionRef },
      "phase9.440.evidence-gap.id",
    );
    gaps.push({
      evidenceGapRecordId: `egr_440_${gapHash.slice(0, 16)}`,
      controlRecordId: controlRef,
      gapType,
      severity,
      dueAt: input.periodEnd,
      remediationRef: `remediation:${reason}`,
      assuranceEvidenceGraphSnapshotRef: graphSnapshotRef,
      originGraphEdgeRefs: control
        ? sortedUnique(evidenceRows.filter((row) => row.controlRecordRef === control.controlRecordId).map((row) => row.graphEdgeRef))
        : [],
      graphHash,
      sourceFrameworkRef: `${input.frameworkCode}:${map?.frameworkVersion ?? "unresolved"}`,
      deterministicReasonCode: reasonCode,
    });
  };

  if (!map) {
    addGap(undefined, "policy_version_mismatch", "ambiguous-standards-version", "critical");
  }
  for (const blocker of blockers) {
    if (blocker.startsWith("graph:")) {
      addGap(undefined, "blocked_graph", blocker, "critical");
    } else if (blocker.startsWith("trust:")) {
      addGap(undefined, "low_trust", blocker, "critical");
    } else if (blocker.startsWith("redaction:")) {
      addGap(undefined, "missing_redaction", blocker, "high");
    } else if (blocker.startsWith("tenant:")) {
      addGap(undefined, "tenant_scope_mismatch", blocker, "critical");
    } else if (blocker.startsWith("phase8:")) {
      addGap(undefined, "phase8_exit_evidence_missing", blocker, "critical");
    }
  }
  for (const control of controls) {
    const rows = evidenceRows.filter((row) => row.controlRecordRef === control.controlRecordId);
    if (rows.length === 0 || control.state === "missing") {
      addGap(control, "missing_evidence", `missing:${control.controlCode}`);
    }
    if (rows.some((row) => row.freshnessState !== "current")) {
      addGap(control, "stale_evidence", `stale:${control.controlCode}`, "medium");
    }
    if (rows.every((row) => row.supersessionState === "superseded") && rows.length > 0) {
      addGap(control, "superseded_evidence", `superseded:${control.controlCode}`);
    }
    if (control.requiresContinuityEvidence && rows.every((row) => !row.continuityEvidenceRef)) {
      addGap(control, "missing_continuity_proof", `continuity:${control.controlCode}`);
    }
  }
  return [...new Map(gaps.map((gap) => [gap.evidenceGapRecordId, gap])).values()].sort((left, right) =>
    left.evidenceGapRecordId.localeCompare(right.evidenceGapRecordId),
  );
}

function buildContinuitySections(
  input: AssurancePackGenerationInput,
  generator: FrameworkPackGenerator | undefined,
  rows: readonly AssuranceEvidenceRow[],
): readonly ContinuityEvidencePackSection[] {
  if (!generator) {
    return [];
  }
  return generator.continuityRequiredControlCodes.map((controlCode) => {
    const matchingRows = rows.filter((row) => row.controlCode === controlCode);
    const continuityRefs = sortedUnique(matchingRows.map((row) => row.continuityEvidenceRef ?? ""));
    const blockingRefs = continuityRefs.length === 0 ? [`continuity:missing:${controlCode}`] : [];
    const sectionHash = packHash(
      {
        controlCode,
        continuityRefs,
        graphHash: input.graphSnapshot?.graphHash ?? "graph:missing",
      },
      "phase9.440.continuity-section.id",
    );
    return {
      continuityEvidencePackSectionId: `ceps_440_${sectionHash.slice(0, 16)}`,
      controlCode,
      affectedRouteFamilyRefs: sortedUnique(matchingRows.map((row) => row.routeFamilyRef ?? "")),
      experienceContinuityEvidenceRefs: continuityRefs,
      supportingRuntimePublicationRefs: sortedUnique(matchingRows.map((row) => row.runtimePublicationRef ?? "")),
      assuranceEvidenceGraphSnapshotRef: input.graphSnapshot?.assuranceEvidenceGraphSnapshotId ?? "graph-snapshot:missing",
      graphEdgeRefs: sortedUnique(matchingRows.map((row) => row.graphEdgeRef)),
      validationState: blockingRefs.length === 0 ? "valid" : "missing",
      blockingRefs,
      audienceTierRefs: ["operations", "governance"],
      generatedAt: input.generatedAt,
    };
  });
}

function renderCanonicalPackArtifact(pack: Omit<GeneratedAssurancePack, "serializedArtifactHash" | "exportManifestHash" | "reproductionHash" | "reproductionState">): string {
  return JSON.stringify(omitUndefined(pack), Object.keys(omitUndefined(pack) as Record<string, unknown>).sort());
}

function trustSetHash(trustRecords: readonly AssuranceSliceTrustRecord[]): string {
  return orderedSetHash(
    trustRecords.map((record) => `${record.assuranceSliceTrustRecordId}:${record.trustLowerBound}:${record.trustState}:${record.completenessState}`),
    "phase9.440.trust-set",
  );
}

function resultHash(result: Omit<AssurancePackFactoryResult, "resultHash">): string {
  return packHash(
    {
      pack: result.pack,
      continuitySections: result.continuitySections,
      evidenceGaps: result.evidenceGaps,
      settlements: result.settlements,
      persisted: result.persisted,
    },
    "phase9.440.result",
  );
}

export class Phase9AssurancePackFactory {
  generatePackDraft(input: AssurancePackGenerationInput): AssurancePackFactoryResult {
    const standardsVersionMap = resolveStandardsVersion(input);
    const generator = standardsVersionMap ? resolveGenerator(input, standardsVersionMap) : undefined;
    const blockers: string[] = [];
    const graphSnapshotRef = input.graphSnapshot?.assuranceEvidenceGraphSnapshotId ?? "graph-snapshot:missing";
    const graphVerdictRef = input.graphVerdict?.verdictId ?? "graph-verdict:missing";
    const graphHash = input.graphSnapshot?.graphHash ?? input.graphVerdict?.graphHash ?? "graph:missing";

    if (!standardsVersionMap) {
      blockers.push("scope:standards-version-ambiguous-or-missing");
    }
    if (!generator) {
      blockers.push("scope:framework-pack-generator-missing");
    }
    if (!input.graphSnapshot) {
      blockers.push("graph:snapshot-missing");
    }
    if (!input.graphVerdict) {
      blockers.push("graph:verdict-missing");
    } else if (input.graphVerdict.state === "blocked") {
      blockers.push(`graph:verdict-blocked:${input.graphVerdict.verdictId}`, ...input.graphVerdict.reasonCodes.map((reason) => `graph:${reason}`));
    } else if (input.graphVerdict.state === "stale" || input.graphVerdict.state === "partial") {
      blockers.push(`stale:graph-verdict:${input.graphVerdict.state}`);
    }
    if (input.graphSnapshot && input.graphSnapshot.tenantScopeRef !== input.tenantId) {
      blockers.push("tenant:graph-snapshot-scope-mismatch");
    }
    if (input.phase8ExitPacket?.verdict !== "approved_for_phase9") {
      blockers.push("phase8:exit-evidence-missing");
    }

    const controlRecords = input.controlRecords
      .filter((control) => control.frameworkCode === input.frameworkCode)
      .sort((left, right) => left.controlCode.localeCompare(right.controlCode));
    for (const control of controlRecords) {
      if (control.tenantId !== input.tenantId) {
        blockers.push(`tenant:control:${control.controlRecordId}`);
      }
      if (control.graphHash !== graphHash) {
        blockers.push(`stale:control-graph:${control.controlRecordId}`);
      }
    }
    const applicableEvidence = canonicalEvidenceRows(input.evidenceRows.filter((row) => row.frameworkCode === input.frameworkCode));
    for (const row of applicableEvidence) {
      if (row.tenantId !== input.tenantId) {
        blockers.push(`tenant:evidence:${row.evidenceRef}`);
      }
      if (row.visibilityState !== "allowed") {
        blockers.push(`scope:evidence-visibility-denied:${row.evidenceRef}`);
      }
      if (row.freshnessState !== "current") {
        blockers.push(`stale:evidence:${row.evidenceRef}`);
      }
      if (row.supersessionState !== "current") {
        blockers.push(`stale:superseded-evidence:${row.evidenceRef}`);
      }
    }
    for (const record of input.trustRecords) {
      if (record.trustState !== "trusted" || record.completenessState !== "complete" || record.trustLowerBound < 0.82) {
        blockers.push(`trust:${record.assuranceSliceTrustRecordId}`);
      }
    }
    const redactionPolicyRef = input.artifactPolicy?.redactionPolicyRef ?? standardsVersionMap?.redactionPolicyRef;
    if (!redactionPolicyRef) {
      blockers.push("redaction:policy-missing");
    }

    const continuitySections = buildContinuitySections(input, generator, applicableEvidence);
    for (const section of continuitySections) {
      blockers.push(...section.blockingRefs);
    }
    const evidenceGaps = buildGaps(input, standardsVersionMap, controlRecords, applicableEvidence, blockers);
    const evidenceSetHash = orderedSetHash(
      applicableEvidence.filter((row) => row.visibilityState === "allowed" && row.supersessionState === "current").map((row) => row.evidenceHash),
      "phase9.440.evidence-set",
    );
    const continuitySetHash = orderedSetHash(
      continuitySections.flatMap((section) => section.experienceContinuityEvidenceRefs),
      "phase9.440.continuity-set",
    );
    const queryPlanHash = packHash(
      {
        tenantId: input.tenantId,
        scopeRef: input.scopeRef,
        frameworkCode: input.frameworkCode,
        frameworkVersion: standardsVersionMap?.frameworkVersion ?? "unresolved",
        querySetRef: standardsVersionMap?.querySetRef ?? "query-set:missing",
        controlRecords: controlRecords.map((control) => control.controlRecordId),
      },
      "phase9.440.query-plan",
    );
    const renderTemplateHash = packHash(
      {
        renderTemplateRef: generator?.renderTemplateRef ?? standardsVersionMap?.renderTemplateRef ?? "render-template:missing",
      },
      "phase9.440.render-template",
    );
    const redactionPolicyHash = packHash(
      {
        redactionPolicyRef: redactionPolicyRef ?? "redaction-policy:missing",
      },
      "phase9.440.redaction-policy",
    );
    const trustSnapshotSetHash = trustSetHash(input.trustRecords);
    const packVersionHash = packHash(
      {
        frameworkVersion: standardsVersionMap?.frameworkVersion ?? "unresolved",
        queryPlanHash,
        renderTemplateHash,
        redactionPolicyHash,
        continuitySetHash,
        graphHash,
        verdictDecisionHash: input.graphVerdict?.contractVerdict.decisionHash ?? "verdict:missing",
        trustSnapshotSetHash,
        evidenceSetHash,
      },
      "phase9.440.pack-version",
    );
    const generatedArtifactRef = `artifact:assurance-pack:${packVersionHash.slice(0, 16)}`;
    const retentionBinding = input.retentionBindings.find(
      (binding) => binding.artifactRef === generatedArtifactRef && binding.lifecycleState === "active",
    );
    if (!retentionBinding) {
      blockers.push(`retention:lifecycle-binding-missing:${generatedArtifactRef}`);
    }
    const packState = derivePackState(blockers, input.dryRun === true);
    const packWithoutArtifactHashes = {
      assurancePackId: `ap_440_${packVersionHash.slice(0, 16)}`,
      tenantId: input.tenantId,
      scopeRef: input.scopeRef,
      frameworkCode: input.frameworkCode,
      frameworkVersion: standardsVersionMap?.frameworkVersion ?? "unresolved",
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      packState,
      standardsVersionMapRef: standardsVersionMap?.standardsVersionMapId ?? "standards-version:unresolved",
      generatorRef: generator?.generatorId ?? "generator:missing",
      controlRecordRefs: controlRecords.map((control) => control.controlRecordId),
      evidenceRefs: applicableEvidence.map((row) => row.evidenceRef),
      evidenceSetHash,
      continuitySetHash,
      queryPlanHash,
      renderTemplateHash,
      redactionPolicyHash,
      graphHash,
      graphSnapshotRef,
      graphVerdictRef,
      graphVerdictDecisionHash: input.graphVerdict?.contractVerdict.decisionHash ?? "verdict:missing",
      trustSnapshotSetHash,
      packVersionHash,
      generatedArtifactRef,
      retentionLifecycleBindingRef: retentionBinding?.retentionLifecycleBindingId ?? "retention-binding:missing",
      blockerRefs: sortedUnique(blockers),
      generatedAt: input.generatedAt,
    };
    const serializedArtifactHash = packHash(
      renderCanonicalPackArtifact(packWithoutArtifactHashes),
      "phase9.440.serialized-artifact",
    );
    const exportManifestHash = packHash(
      {
        generatedArtifactRef,
        packVersionHash,
        serializedArtifactHash,
        graphHash,
      },
      "phase9.440.export-manifest",
    );
    const reproductionHash = packHash(
      {
        serializedArtifactHash,
        exportManifestHash,
        reproductionVersion: PHASE9_ASSURANCE_PACK_REPRODUCTION_VERSION,
      },
      "phase9.440.reproduction",
    );
    const pack: GeneratedAssurancePack = {
      ...packWithoutArtifactHashes,
      serializedArtifactHash,
      exportManifestHash,
      reproductionHash,
      reproductionState: blockers.some((blocker) => blocker.startsWith("graph:") || blocker.startsWith("retention:")) ? "blocked" : "exact",
    };
    const monthlyPack: MonthlyAssurancePack = {
      monthlyAssurancePackId: `map_440_${packHash({ packVersionHash, month: input.periodEnd.slice(0, 7) }, "phase9.440.monthly-pack").slice(0, 16)}`,
      tenantId: input.tenantId,
      month: input.periodEnd.slice(0, 7),
      controlStatusRefs: controlRecords.map((control) => control.controlRecordId),
      incidentRefs: sortedUnique(input.incidentRefs ?? []),
      exceptionRefs: sortedUnique(input.exceptionRefs ?? []),
      assuranceEvidenceGraphSnapshotRef: graphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: graphVerdictRef,
      graphHash,
      signoffState: packState === "ready_for_attestation" || packState === "dry_run" ? "pending_attestation" : "blocked",
    };
    const resultWithoutHash = {
      schemaVersion: PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
      standardsVersionMap: standardsVersionMap ?? {
        standardsVersionMapId: "standards-version:unresolved",
        frameworkCode: input.frameworkCode,
        frameworkVersion: "unresolved",
        effectiveFrom: input.periodStart,
        controlSetRef: "control-set:unresolved",
        querySetRef: "query-set:unresolved",
        renderTemplateRef: "render-template:unresolved",
        redactionPolicyRef: "redaction-policy:unresolved",
        evidenceFreshnessPolicyRef: "freshness:unresolved",
        requiredGraphVerdictContext: "assurance_pack",
        packHashInputRefs: [],
        ownerRole: "owner:unresolved",
      },
      generator: generator ?? {
        generatorId: "generator:missing",
        frameworkCode: input.frameworkCode,
        versionRef: "unresolved",
        querySetRef: "query-set:unresolved",
        renderTemplateRef: "render-template:unresolved",
        supportedPackFamily: "unresolved",
        requiredControlCodes: [],
        continuityRequiredControlCodes: [],
        requiredTrustRefs: [],
        artifactPresentationContractRef: "artifact-presentation:missing",
        outboundNavigationGrantPolicyRef: "outbound-navigation:missing",
      },
      pack,
      monthlyPack,
      continuitySections,
      evidenceGaps,
      packActionRecords: [],
      settlements: [],
      persisted: input.dryRun !== true && packState !== "dry_run",
    } satisfies Omit<AssurancePackFactoryResult, "resultHash">;
    return {
      ...resultWithoutHash,
      resultHash: resultHash(resultWithoutHash),
    };
  }

  reproducePackFromHashes(result: AssurancePackFactoryResult): ReproductionState {
    const recomputed = packHash(
      {
        serializedArtifactHash: result.pack.serializedArtifactHash,
        exportManifestHash: result.pack.exportManifestHash,
        reproductionVersion: PHASE9_ASSURANCE_PACK_REPRODUCTION_VERSION,
      },
      "phase9.440.reproduction",
    );
    return recomputed === result.pack.reproductionHash ? "exact" : "drifted";
  }

  createPackActionSettlement(input: AssurancePackActionInput): AssurancePackSettlement {
    const pack = input.result.pack;
    const idempotencySeed = {
      packRef: pack.assurancePackId,
      actionType: input.actionType,
      idempotencyKey: input.idempotencyKey,
      actorRef: input.actorRef,
    };
    const actionHash = packHash(idempotencySeed, "phase9.440.pack-action.id");
    const actionRecord: AssurancePackActionRecord = {
      assurancePackActionRecordId: `apar_440_${actionHash.slice(0, 16)}`,
      assurancePackRef: pack.assurancePackId,
      actionType: input.actionType,
      routeIntentRef: input.routeIntentRef,
      scopeTokenRef: input.scopeTokenRef,
      packVersionHash: pack.packVersionHash,
      evidenceSetHash: pack.evidenceSetHash,
      continuitySetHash: pack.continuitySetHash,
      graphHash: pack.graphHash,
      assuranceEvidenceGraphSnapshotRef: pack.graphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: pack.graphVerdictRef,
      queryPlanHash: pack.queryPlanHash,
      renderTemplateHash: pack.renderTemplateHash,
      redactionPolicyHash: pack.redactionPolicyHash,
      requiredTrustRefs: input.result.generator.requiredTrustRefs,
      assuranceSurfaceRuntimeBindingRef: "assurance-surface-runtime:assurance-center",
      surfaceRouteContractRef: "surface-route:assurance-center",
      surfacePublicationRef: "surface-publication:assurance-center",
      runtimePublicationBundleRef: "runtime-publication:assurance-center",
      releasePublicationParityRef: "release-publication:assurance-center",
      transitionEnvelopeRef: `transition-envelope:${actionHash.slice(0, 12)}`,
      releaseRecoveryDispositionRef: "release-recovery:assurance-center",
      idempotencyKey: input.idempotencyKey,
      actorRef: input.actorRef,
      createdAt: input.generatedAt,
      settledAt: input.generatedAt,
    };
    let result: AssurancePackSettlementResult;
    if (pack.packState === "blocked_graph") {
      result = "blocked_graph";
    } else if (pack.packState === "blocked_trust") {
      result = "blocked_trust";
    } else if (pack.packState === "stale_pack" || input.currentPackVersionHash && input.currentPackVersionHash !== pack.packVersionHash || input.currentGraphHash && input.currentGraphHash !== pack.graphHash) {
      result = "stale_pack";
    } else if (
      input.actionType === "export_external" &&
      (!input.artifactPolicy?.artifactPresentationContractRef ||
        !input.artifactPolicy?.outboundNavigationGrantPolicyRef ||
        !input.artifactPolicy.redactionPolicyRef ||
        input.currentRedactionPolicyHash && input.currentRedactionPolicyHash !== pack.redactionPolicyHash)
    ) {
      result = "denied_scope";
    } else if (input.actionType === "attest") {
      result = "pending_attestation";
    } else if (input.actionType === "signoff") {
      result = "signed_off";
    } else if (input.actionType === "publish_internal") {
      result = "published_internal";
    } else if (input.actionType === "export_external") {
      result = "export_ready";
    } else {
      result = "failed";
    }
    const settlementHash = packHash(
      {
        actionRecord,
        result,
        serializedArtifactHash: pack.serializedArtifactHash,
        exportManifestHash: pack.exportManifestHash,
        reproductionHash: pack.reproductionHash,
      },
      "phase9.440.pack-settlement.id",
    );
    return {
      assurancePackSettlementId: `aps_440_${settlementHash.slice(0, 16)}`,
      assurancePackActionRecordRef: actionRecord.assurancePackActionRecordId,
      commandActionRecordRef: `command-action:${actionRecord.assurancePackActionRecordId}`,
      commandSettlementRecordRef: `command-settlement:${settlementHash.slice(0, 12)}`,
      uiTransitionSettlementRecordRef: `ui-transition:${settlementHash.slice(0, 12)}`,
      uiTelemetryDisclosureFenceRef: "ui-disclosure-fence:assurance-pack",
      presentationArtifactRef: pack.generatedArtifactRef,
      assuranceEvidenceGraphSnapshotRef: pack.graphSnapshotRef,
      assuranceGraphCompletenessVerdictRef: pack.graphVerdictRef,
      graphHash: pack.graphHash,
      result,
      serializedArtifactHash: pack.serializedArtifactHash,
      exportManifestHash: pack.exportManifestHash,
      reproductionHash: pack.reproductionHash,
      reproductionState: result === "export_ready" || result === "signed_off" || result === "published_internal" ? "exact" : pack.reproductionState,
      recoveryActionRef: result.startsWith("blocked") || result === "stale_pack" || result === "denied_scope" ? `recovery:${result}` : "recovery:not-required",
      recordedAt: input.generatedAt,
    };
  }
}

export const getDefaultStandardsVersionMaps = (): readonly StandardsVersionMap[] => [
  {
    standardsVersionMapId: "svm_440_dspt_2026",
    frameworkCode: "DSPT",
    frameworkVersion: "DSPT-2026",
    effectiveFrom: "2026-04-01T00:00:00.000Z",
    effectiveTo: "2027-04-01T00:00:00.000Z",
    controlSetRef: "control-set:dspt-operational-2026",
    querySetRef: "query-set:dspt-operational-2026",
    renderTemplateRef: "render-template:dspt-operational-v1",
    redactionPolicyRef: "redaction:assurance-pack-minimum-necessary",
    evidenceFreshnessPolicyRef: "freshness:monthly",
    requiredGraphVerdictContext: "assurance_pack",
    packHashInputRefs: ["graphHash", "evidenceSetHash", "continuitySetHash"],
    ownerRole: "ig_owner",
  },
  {
    standardsVersionMapId: "svm_440_dtac_2026",
    frameworkCode: "DTAC",
    frameworkVersion: "DTAC-2026-03",
    effectiveFrom: "2026-03-01T00:00:00.000Z",
    effectiveTo: "2027-03-01T00:00:00.000Z",
    controlSetRef: "control-set:dtac-2026",
    querySetRef: "query-set:dtac-2026",
    renderTemplateRef: "render-template:dtac-evidence-refresh-v1",
    redactionPolicyRef: "redaction:assurance-pack-minimum-necessary",
    evidenceFreshnessPolicyRef: "freshness:monthly",
    requiredGraphVerdictContext: "assurance_pack",
    packHashInputRefs: ["phase8ExitPacket", "graphHash", "evidenceSetHash"],
    ownerRole: "clinical_safety_owner",
  },
  {
    standardsVersionMapId: "svm_440_dcb0129_2026",
    frameworkCode: "DCB0129",
    frameworkVersion: "DCB0129-2026-delta",
    effectiveFrom: "2026-04-01T00:00:00.000Z",
    controlSetRef: "control-set:dcb0129-manufacturer-delta",
    querySetRef: "query-set:dcb0129-delta",
    renderTemplateRef: "render-template:dcb0129-v1",
    redactionPolicyRef: "redaction:safety-case-delta",
    evidenceFreshnessPolicyRef: "freshness:release",
    requiredGraphVerdictContext: "assurance_pack",
    packHashInputRefs: ["hazardLog", "safetyCaseDelta", "graphHash"],
    ownerRole: "clinical_safety_owner",
  },
  {
    standardsVersionMapId: "svm_440_dcb0160_2026",
    frameworkCode: "DCB0160",
    frameworkVersion: "DCB0160-2026-handoff",
    effectiveFrom: "2026-04-01T00:00:00.000Z",
    controlSetRef: "control-set:dcb0160-deployment",
    querySetRef: "query-set:dcb0160-handoff",
    renderTemplateRef: "render-template:dcb0160-v1",
    redactionPolicyRef: "redaction:deployment-handoff",
    evidenceFreshnessPolicyRef: "freshness:release",
    requiredGraphVerdictContext: "assurance_pack",
    packHashInputRefs: ["deploymentContext", "rollbackEvidence", "graphHash"],
    ownerRole: "deployment_safety_owner",
  },
  {
    standardsVersionMapId: "svm_440_nhs_app_2026",
    frameworkCode: "NHS_APP_CHANNEL",
    frameworkVersion: "NHS-APP-MONTHLY-2026",
    effectiveFrom: "2026-04-01T00:00:00.000Z",
    controlSetRef: "control-set:nhs-app-monthly",
    querySetRef: "query-set:nhs-app-channel",
    renderTemplateRef: "render-template:nhs-app-channel-v1",
    redactionPolicyRef: "redaction:channel-pack-minimum-necessary",
    evidenceFreshnessPolicyRef: "freshness:monthly",
    requiredGraphVerdictContext: "assurance_pack",
    packHashInputRefs: ["runtimePublication", "continuityEvidence", "notificationMetrics"],
    ownerRole: "channel_owner",
  },
  {
    standardsVersionMapId: "svm_440_im1_2026",
    frameworkCode: "IM1_CHANGE",
    frameworkVersion: "IM1-CHANGE-2026",
    effectiveFrom: "2026-04-01T00:00:00.000Z",
    controlSetRef: "control-set:im1-change",
    querySetRef: "query-set:im1-change",
    renderTemplateRef: "render-template:im1-change-v1",
    redactionPolicyRef: "redaction:integration-change",
    evidenceFreshnessPolicyRef: "freshness:release",
    requiredGraphVerdictContext: "assurance_pack",
    packHashInputRefs: ["integrationPublication", "dependencyEvidence", "graphHash"],
    ownerRole: "integration_owner",
  },
  {
    standardsVersionMapId: "svm_440_local_tenant_2026",
    frameworkCode: "LOCAL_TENANT",
    frameworkVersion: "LOCAL-TENANT-2026",
    effectiveFrom: "2026-04-01T00:00:00.000Z",
    controlSetRef: "control-set:local-tenant",
    querySetRef: "query-set:local-tenant",
    renderTemplateRef: "render-template:local-tenant-v1",
    redactionPolicyRef: "redaction:tenant-pack",
    evidenceFreshnessPolicyRef: "freshness:monthly",
    requiredGraphVerdictContext: "assurance_pack",
    packHashInputRefs: ["tenantConfig", "dependencyHygiene", "graphHash"],
    ownerRole: "tenant_governance_owner",
  },
];

export const getDefaultFrameworkPackGenerators = (): readonly FrameworkPackGenerator[] =>
  getDefaultStandardsVersionMaps().map((map) => ({
    generatorId: `fpg_440_${packHash(map, "phase9.440.framework-generator.id").slice(0, 16)}`,
    frameworkCode: map.frameworkCode,
    versionRef: map.frameworkVersion,
    querySetRef: map.querySetRef,
    renderTemplateRef: map.renderTemplateRef,
    supportedPackFamily:
      map.frameworkCode === "DSPT"
        ? "dspt_operational_evidence"
        : map.frameworkCode === "DTAC"
          ? "dtac_evidence_refresh"
          : map.frameworkCode === "DCB0129"
            ? "dcb0129_manufacturer_safety_delta"
            : map.frameworkCode === "DCB0160"
              ? "dcb0160_deployment_handoff_delta"
              : map.frameworkCode === "NHS_APP_CHANNEL"
                ? "nhs_app_monthly_channel_pack"
                : map.frameworkCode === "IM1_CHANGE"
                  ? "im1_integrated_change_delta"
                  : "local_tenant_controls_pack",
    requiredControlCodes: [`${map.frameworkCode.toLowerCase()}:control:core`, `${map.frameworkCode.toLowerCase()}:control:continuity`],
    continuityRequiredControlCodes: [`${map.frameworkCode.toLowerCase()}:control:continuity`],
    requiredTrustRefs: [`trust:${map.frameworkCode.toLowerCase()}:pack`],
    artifactPresentationContractRef: `artifact-presentation:${map.frameworkCode.toLowerCase()}`,
    outboundNavigationGrantPolicyRef: `outbound-navigation:${map.frameworkCode.toLowerCase()}`,
  }));

export function createPhase9AssurancePackFactoryFixture(): Phase9AssurancePackFactoryFixture {
  const generatedAt = "2026-04-27T10:00:00.000Z";
  const standardsVersionMaps = getDefaultStandardsVersionMaps();
  const generators = getDefaultFrameworkPackGenerators();
  const graphSnapshot: AssuranceEvidenceGraphSnapshot = {
    assuranceEvidenceGraphSnapshotId: "aegs_440_demo",
    tenantScopeRef: "tenant:demo-gp",
    standardsVersionMapRefs: standardsVersionMaps.map((map) => map.standardsVersionMapId),
    ledgerEntryRefs: ["ale_440_core", "ale_440_continuity"],
    evidenceArtifactRefs: ["evidence:440:core", "evidence:440:continuity"],
    controlObjectiveRefs: ["control:dtac:control:core", "control:dtac:control:continuity"],
    controlEvidenceLinkRefs: ["link:440:core", "link:440:continuity"],
    controlStatusSnapshotRefs: ["control-status:440:core", "control-status:440:continuity"],
    controlRecordRefs: ["acr_440_core", "acr_440_continuity"],
    evidenceGapRecordRefs: [],
    continuityEvidenceRefs: ["continuity:440:patient-navigation"],
    continuityEvidencePackSectionRefs: [],
    incidentRefs: ["incident:440:monthly"],
    exceptionRefs: [],
    capaActionRefs: [],
    retentionDecisionRefs: ["retention-decision:440:pack"],
    archiveManifestRefs: [],
    deletionCertificateRefs: [],
    packRefs: [],
    assurancePackActionRecordRefs: [],
    assurancePackSettlementRefs: [],
    recoveryEvidenceArtifactRefs: [],
    evidenceSetHash: "e".repeat(64),
    continuitySetHash: "c".repeat(64),
    incidentSetHash: "i".repeat(64),
    retentionSetHash: "r".repeat(64),
    graphHash: "440".padEnd(64, "0"),
    snapshotState: "complete",
    generatedAt,
  };
  const graphVerdict: Phase9GraphVerdictRecord = {
    verdictId: "pgvr_440_complete",
    graphSnapshotRef: graphSnapshot.assuranceEvidenceGraphSnapshotId,
    graphHash: graphSnapshot.graphHash,
    context: "assurance_pack",
    scopeRef: graphSnapshot.tenantScopeRef,
    state: "complete",
    contractVerdict: {
      assuranceGraphCompletenessVerdictId: "agcv_440_complete",
      graphSnapshotRef: graphSnapshot.assuranceEvidenceGraphSnapshotId,
      scopeRef: graphSnapshot.tenantScopeRef,
      requiredNodeRefs: [...graphSnapshot.ledgerEntryRefs, ...graphSnapshot.evidenceArtifactRefs],
      missingNodeRefs: [],
      orphanNodeRefs: [],
      missingEdgeRefs: [],
      supersessionConflictRefs: [],
      crossScopeConflictRefs: [],
      requiredPackRefs: [],
      requiredRetentionRefs: [],
      blockedExportRefs: [],
      verdictState: "complete",
      decisionHash: "d".repeat(64),
      evaluatedAt: generatedAt,
    },
    evaluatedRequirements: ["graph-complete"],
    passedRequirements: ["graph-complete"],
    failedRequirements: [],
    orphanEdgeRefs: [],
    missingEdgeRefs: [],
    staleEvidenceRefs: [],
    contradictionRefs: [],
    visibilityGapRefs: [],
    trustBlockingRefs: [],
    reasonCodes: [],
    watermarks: {
      graphWatermark: graphSnapshot.graphHash,
      requiredLedgerWatermark: graphSnapshot.graphHash,
    },
    traversal: { visitedRefs: graphSnapshot.evidenceArtifactRefs, cycleRefs: [], maxDepthReached: false },
    generatedAt,
    evaluatorVersion: "436.phase9.graph-verdict-engine.v1",
    policyHash: "policy:440",
    verdictHash: "v".repeat(64),
  };
  const controlRecords: AssuranceControlRecord[] = [
    {
      controlRecordId: "acr_440_core",
      frameworkCode: "DTAC",
      frameworkVersionRef: "DTAC-2026-03",
      controlCode: "dtac:control:core",
      tenantId: "tenant:demo-gp",
      state: "satisfied",
      evidenceCoverage: 1,
      ownerRef: "clinical_safety_owner",
      assuranceEvidenceGraphSnapshotRef: graphSnapshot.assuranceEvidenceGraphSnapshotId,
      assuranceGraphCompletenessVerdictRef: graphVerdict.verdictId,
      graphHash: graphSnapshot.graphHash,
      requiresContinuityEvidence: false,
      requiredEvidenceRefs: ["evidence:440:core"],
    },
    {
      controlRecordId: "acr_440_continuity",
      frameworkCode: "DTAC",
      frameworkVersionRef: "DTAC-2026-03",
      controlCode: "dtac:control:continuity",
      tenantId: "tenant:demo-gp",
      state: "satisfied",
      evidenceCoverage: 1,
      ownerRef: "clinical_safety_owner",
      assuranceEvidenceGraphSnapshotRef: graphSnapshot.assuranceEvidenceGraphSnapshotId,
      assuranceGraphCompletenessVerdictRef: graphVerdict.verdictId,
      graphHash: graphSnapshot.graphHash,
      requiresContinuityEvidence: true,
      requiredEvidenceRefs: ["evidence:440:continuity"],
    },
  ];
  const evidenceRows: AssuranceEvidenceRow[] = [
    {
      evidenceRef: "evidence:440:core",
      controlRecordRef: "acr_440_core",
      tenantId: "tenant:demo-gp",
      frameworkCode: "DTAC",
      controlCode: "dtac:control:core",
      graphEdgeRef: "edge:440:core",
      evidenceHash: "a".repeat(64),
      capturedAt: "2026-04-27T09:00:00.000Z",
      freshnessState: "current",
      visibilityState: "allowed",
      supersessionState: "current",
      trustRef: "trust:dtac:pack",
      retentionLifecycleBindingRef: "rlb_440_pack",
    },
    {
      evidenceRef: "evidence:440:continuity",
      controlRecordRef: "acr_440_continuity",
      tenantId: "tenant:demo-gp",
      frameworkCode: "DTAC",
      controlCode: "dtac:control:continuity",
      graphEdgeRef: "edge:440:continuity",
      evidenceHash: "b".repeat(64),
      capturedAt: "2026-04-27T09:05:00.000Z",
      freshnessState: "current",
      visibilityState: "allowed",
      supersessionState: "current",
      trustRef: "trust:dtac:pack",
      retentionLifecycleBindingRef: "rlb_440_pack",
      continuityEvidenceRef: "continuity:440:patient-navigation",
      routeFamilyRef: "rf_patient_home",
      runtimePublicationRef: "runtime-publication:phase8-assistive",
    },
  ];
  const trustRecords: AssuranceSliceTrustRecord[] = [
    {
      assuranceSliceTrustRecordId: "trust:dtac:pack",
      sliceRef: "slice:dtac-pack",
      scopeRef: "tenant:demo-gp",
      audienceTier: "governance",
      trustState: "trusted",
      completenessState: "complete",
      trustScore: 0.95,
      trustLowerBound: 0.9,
      freshnessScore: 0.96,
      coverageScore: 0.97,
      lineageScore: 0.98,
      replayScore: 1,
      consistencyScore: 0.96,
      hardBlockState: false,
      blockingProducerRefs: [],
      blockingNamespaceRefs: [],
      evaluationModelRef: "phase9.assurance.slice-trust.lower-bound.v1",
      evaluationInputHash: "t".repeat(64),
      lastEvaluatedAt: generatedAt,
    },
  ];
  const artifactPolicy: AssuranceArtifactPolicy = {
    artifactPresentationContractRef: "artifact-presentation:dtac",
    artifactTransferSettlementRef: "artifact-transfer:dtac",
    outboundNavigationGrantPolicyRef: "outbound-navigation:dtac",
    redactionPolicyRef: "redaction:assurance-pack-minimum-necessary",
    exportAllowed: true,
    policyHash: "artifact-policy:dtac",
  };
  const factory = new Phase9AssurancePackFactory();
  const baseInputWithoutRetention: Omit<AssurancePackGenerationInput, "retentionBindings"> = {
    tenantId: "tenant:demo-gp",
    scopeRef: "scope:tenant:demo-gp",
    frameworkCode: "DTAC",
    periodStart: "2026-04-01T00:00:00.000Z",
    periodEnd: "2026-04-30T23:59:59.000Z",
    generatedAt,
    standardsVersionMaps,
    generators,
    controlRecords,
    evidenceRows,
    graphSnapshot,
    graphVerdict,
    trustRecords,
    artifactPolicy,
    phase8ExitPacket: { verdict: "approved_for_phase9", evidenceBundleHash: "phase8:exit:hash" },
    incidentRefs: ["incident:440:monthly"],
    exceptionRefs: [],
  };
  const preflight = factory.generatePackDraft({ ...baseInputWithoutRetention, retentionBindings: [] });
  const retentionBindings: RetentionLifecycleBinding[] = [
    {
      retentionLifecycleBindingId: "rlb_440_pack",
      artifactRef: preflight.pack.generatedArtifactRef,
      artifactVersionRef: preflight.pack.packVersionHash,
      artifactClassRef: "artifact-class:assurance-pack",
      retentionClassRef: "retention:assurance-ledger-worm",
      disposalMode: "archive_only",
      immutabilityMode: "hash_chained",
      dependencyCheckPolicyRef: "dependency-check:assurance-pack",
      activeFreezeRefs: [],
      activeLegalHoldRefs: [],
      graphCriticality: "hash_chained",
      lifecycleState: "active",
      classificationHash: "classification:440",
      createdAt: generatedAt,
    },
  ];
  const baseInput = { ...baseInputWithoutRetention, retentionBindings };
  const baselineResult = factory.generatePackDraft(baseInput);
  const dryRunResult = factory.generatePackDraft({ ...baseInput, dryRun: true });
  const { graphVerdict: _omittedGraphVerdict, ...missingGraphVerdictInput } = baseInput;
  const missingGraphVerdictResult = factory.generatePackDraft(missingGraphVerdictInput);
  const staleEvidenceResult = factory.generatePackDraft({
    ...baseInput,
    evidenceRows: evidenceRows.map((row) =>
      row.evidenceRef === "evidence:440:core" ? { ...row, freshnessState: "stale" as const } : row,
    ),
  });
  const ambiguousStandardsResult = factory.generatePackDraft({
    ...baseInput,
    standardsVersionMaps: [
      ...standardsVersionMaps,
      { ...standardsVersionMaps.find((map) => map.frameworkCode === "DTAC")!, standardsVersionMapId: "svm_440_dtac_duplicate" },
    ],
  });
  const wrongTenantResult = factory.generatePackDraft({
    ...baseInput,
    evidenceRows: [{ ...evidenceRows[0]!, tenantId: "tenant:other" }, evidenceRows[1]!],
  });
  const supersededEvidenceResult = factory.generatePackDraft({
    ...baseInput,
    evidenceRows: evidenceRows.map((row) =>
      row.evidenceRef === "evidence:440:core" ? { ...row, supersessionState: "superseded" as const } : row,
    ),
  });
  const missingContinuityResult = factory.generatePackDraft({
    ...baseInput,
    evidenceRows: evidenceRows.map((row) => {
      if (row.evidenceRef !== "evidence:440:continuity") {
        return row;
      }
      const { continuityEvidenceRef: _omittedContinuityEvidenceRef, ...rowWithoutContinuityEvidence } = row;
      return rowWithoutContinuityEvidence;
    }),
  });
  const { redactionPolicyRef: _omittedRedactionPolicyRef, ...artifactPolicyWithoutRedaction } = artifactPolicy;
  const missingRedactionSettlement = factory.createPackActionSettlement({
    result: baselineResult,
    actionType: "export_external",
    actorRef: "actor:governance-440",
    routeIntentRef: "route-intent:assurance-pack",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:440:missing-redaction",
    generatedAt,
    artifactPolicy: artifactPolicyWithoutRedaction,
  });
  const reproductionSettlement = factory.createPackActionSettlement({
    result: baselineResult,
    actionType: "signoff",
    actorRef: "actor:governance-440",
    routeIntentRef: "route-intent:assurance-pack",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:440:signoff",
    generatedAt,
    artifactPolicy,
  });
  const changedTemplateResult = factory.generatePackDraft({
    ...baseInput,
    generators: generators.map((generator) =>
      generator.frameworkCode === "DTAC" ? { ...generator, renderTemplateRef: "render-template:dtac-evidence-refresh-v2" } : generator,
    ),
    standardsVersionMaps: standardsVersionMaps.map((map) =>
      map.frameworkCode === "DTAC" ? { ...map, renderTemplateRef: "render-template:dtac-evidence-refresh-v2" } : map,
    ),
  });
  const exportReadySettlement = factory.createPackActionSettlement({
    result: baselineResult,
    actionType: "export_external",
    actorRef: "actor:governance-440",
    routeIntentRef: "route-intent:assurance-pack",
    scopeTokenRef: "scope-token:tenant-demo",
    idempotencyKey: "idem:440:export",
    generatedAt,
    artifactPolicy,
    currentRedactionPolicyHash: baselineResult.pack.redactionPolicyHash,
  });
  const replayed = factory.generatePackDraft(baseInput);
  return {
    schemaVersion: PHASE9_ASSURANCE_PACK_FACTORY_VERSION,
    generatedAt,
    sourceAlgorithmRefs: [
      "blueprint/phase-9-the-assurance-ledger.md#9D",
      "blueprint/phase-9-the-assurance-ledger.md#9A",
      "blueprint/phase-9-the-assurance-ledger.md#9C",
      "blueprint/phase-9-the-assurance-ledger.md#9E",
      "data/contracts/431_phase8_exit_packet.json",
      "data/contracts/432_phase9_assurance_ledger_contracts.json",
      "data/contracts/433_phase9_operational_projection_contracts.json",
      "data/contracts/434_phase9_governance_control_contracts.json",
      "data/contracts/435_phase9_assurance_ingest_service_contract.json",
      "data/contracts/436_phase9_graph_verdict_engine_contract.json",
      "data/contracts/439_phase9_investigation_timeline_service_contract.json",
    ],
    standardsVersionMaps,
    generators,
    baselineResult,
    dryRunResult,
    missingGraphVerdictResult,
    staleEvidenceResult,
    missingRedactionSettlement,
    ambiguousStandardsResult,
    wrongTenantResult,
    supersededEvidenceResult,
    missingContinuityResult,
    reproductionSettlement,
    changedTemplateResult,
    exportReadySettlement,
    replayHash: orderedSetHash(
      [baselineResult.resultHash, replayed.resultHash, baselineResult.pack.packVersionHash],
      "phase9.440.fixture.replay",
    ),
  };
}

export function phase9AssurancePackFactorySummary(
  fixture: Phase9AssurancePackFactoryFixture = createPhase9AssurancePackFactoryFixture(),
): string {
  return [
    "# 440 Phase 9 Assurance Pack Factory",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Generated at: ${fixture.generatedAt}`,
    `Framework mappings: ${fixture.standardsVersionMaps.length}`,
    `Baseline pack: ${fixture.baselineResult.pack.assurancePackId}`,
    `Pack version hash: ${fixture.baselineResult.pack.packVersionHash}`,
    `Evidence set hash: ${fixture.baselineResult.pack.evidenceSetHash}`,
    `Continuity set hash: ${fixture.baselineResult.pack.continuitySetHash}`,
    `Replay hash: ${fixture.replayHash}`,
    "",
    "## Factory Contract",
    "",
    "- Supported framework families have versioned StandardsVersionMap rows.",
    "- Pack generation is graph-backed, deterministic, and hash-addressable.",
    "- Export-ready settlement requires ArtifactPresentationContract, OutboundNavigationGrant, redaction policy, current graph verdict, and retention lifecycle binding.",
    "- Task 441 can consume AssurancePackActionRecord and AssurancePackSettlement rows for attestation, signoff, CAPA, and export-ready workflow.",
    "",
  ].join("\n");
}

export function phase9AssurancePackFactoryMatrixCsv(): string {
  const rows = [
    ["frameworkCode", "packFamily", "ownerRole", "querySetRef", "renderTemplateRef", "redactionPolicyRef"],
    ...getDefaultStandardsVersionMaps().map((map) => {
      const generator = getDefaultFrameworkPackGenerators().find((candidate) => candidate.frameworkCode === map.frameworkCode);
      return [
        map.frameworkCode,
        generator?.supportedPackFamily ?? "missing",
        map.ownerRole,
        map.querySetRef,
        map.renderTemplateRef,
        map.redactionPolicyRef,
      ];
    }),
  ];
  return `${rows.map((row) => row.join(",")).join("\n")}\n`;
}
