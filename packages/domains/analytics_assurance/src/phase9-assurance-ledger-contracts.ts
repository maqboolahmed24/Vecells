import { createHash } from "node:crypto";

export const PHASE9_ASSURANCE_CONTRACT_VERSION = "432.phase9.assurance-ledger-contracts.v1";
export const PHASE9_ASSURANCE_NORMALIZATION_VERSION = "phase9.assurance.normalization.v1";
export const PHASE9_ASSURANCE_GRAPH_SNAPSHOT_VERSION = "phase9.assurance.graph-snapshot.v1";
export const PHASE9_ASSURANCE_TRUST_EVALUATION_MODEL = "phase9.assurance.slice-trust.lower-bound.v1";
export const PHASE9_ASSURANCE_REPLAY_DETERMINISM_VERSION = "phase9.assurance.replay-determinism.v1";
export const GENESIS_ASSURANCE_LEDGER_HASH = "0".repeat(64);

export const REQUIRED_PHASE9_ASSURANCE_CONTRACTS = [
  "AssuranceLedgerEntry",
  "EvidenceArtifact",
  "ControlObjective",
  "ControlEvidenceLink",
  "ProjectionHealthSnapshot",
  "AttestationRecord",
  "AssurancePack",
  "AssuranceIngestCheckpoint",
  "ControlStatusSnapshot",
  "AssuranceSliceTrustRecord",
  "ExperienceContinuityControlEvidence",
  "AssuranceSurfaceRuntimeBinding",
  "IdentityRepairEvidenceBundle",
  "AssuranceEvidenceGraphSnapshot",
  "AssuranceEvidenceGraphEdge",
  "AssuranceGraphCompletenessVerdict",
] as const;

export type Phase9AssuranceContractName = (typeof REQUIRED_PHASE9_ASSURANCE_CONTRACTS)[number];

export type ReplayDecisionClass =
  | "original"
  | "exact_replay"
  | "semantic_replay"
  | "stale_duplicate"
  | "collision_review";

export type Phase9AssuranceTrustState = "trusted" | "degraded" | "quarantined" | "unknown";
export type Phase9AssuranceCompletenessState = "complete" | "partial" | "blocked";
export type GraphVerdictState = "complete" | "stale" | "blocked";
export type GraphSnapshotState = "complete" | "stale" | "blocked";
export type FreshnessState = "current" | "stale" | "expired" | "missing" | "quarantined";
export type ValidationState = "validated" | "pending" | "failed" | "superseded";
export type CoverageState = "satisfied" | "partial" | "missing" | "blocked";
export type ControlStatusState = "satisfied" | "degraded" | "unsatisfied" | "blocked";
export type ProjectionStalenessState = "fresh" | "near_stale" | "stale" | "blocked";
export type ProjectionRebuildState = "not_required" | "queued" | "rebuilt" | "failed";
export type DeterminismState = "deterministic" | "approximate" | "diverged" | "unknown";
export type BindingState = "live" | "diagnostic_only" | "recovery_only" | "blocked";
export type QuarantineState = "clear" | "quarantined" | "released";
export type EdgeScopeState = "in_scope" | "out_of_scope_conflict";
export type EdgeSupersessionState = "live" | "superseded" | "unresolved";
export type AssuranceGraphEdgeType =
  | "ledger_produces_artifact"
  | "artifact_satisfies_control"
  | "control_materializes_status"
  | "control_opens_gap"
  | "artifact_supports_continuity"
  | "continuity_section_supports_pack"
  | "incident_opens_gap"
  | "gap_drives_capa"
  | "retention_preserves_artifact"
  | "deletion_blocks_pack"
  | "export_materializes_artifact"
  | "standards_version_governs_control";

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };
export type JsonRecord = { readonly [key: string]: JsonValue };

export class Phase9AssuranceContractError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "Phase9AssuranceContractError";
    this.code = code;
  }
}

function fail(code: string, message: string): never {
  throw new Phase9AssuranceContractError(code, message);
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    fail(code, message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

function normalizeTimestampString(value: string): string {
  if (!ISO_TIMESTAMP_PATTERN.test(value)) {
    return value;
  }
  const timestamp = Date.parse(value);
  invariant(!Number.isNaN(timestamp), "INVALID_TIMESTAMP", `Invalid timestamp ${value}.`);
  return new Date(timestamp).toISOString();
}

function canonicalizeInternal(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return JSON.stringify(normalizeTimestampString(value));
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    invariant(Number.isFinite(value), "NON_FINITE_NUMBER", "Canonical JSON does not admit NaN or Infinity.");
    if (Number.isInteger(value)) {
      invariant(Number.isSafeInteger(value), "UNSAFE_INTEGER", "Canonical integer exceeds safe precision.");
    }
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalizeInternal(entry)).join(",")}]`;
  }
  if (isRecord(value)) {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => {
        invariant(entry !== undefined, "UNDEFINED_CANONICAL_FIELD", `Field ${key} is undefined.`);
        return `${JSON.stringify(key)}:${canonicalizeInternal(entry)}`;
      })
      .join(",")}}`;
  }
  fail("UNSUPPORTED_CANONICAL_VALUE", `Unsupported canonical value type ${typeof value}.`);
}

export function canonicalizeAssuranceValue(value: unknown): string {
  return canonicalizeInternal(value);
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashAssurancePayload(value: unknown, namespace = "phase9.assurance.payload"): string {
  return sha256Hex(canonicalizeAssuranceValue({ hashNamespace: namespace, payload: value }));
}

export function orderedSetHash(
  values: readonly unknown[],
  namespace = "phase9.assurance.ordered-set",
): string {
  const elementHashes = values.map((value) => hashAssurancePayload(value, `${namespace}.element`)).sort();
  return merkleRootForHashes(elementHashes, namespace);
}

export function merkleRootForHashes(
  hashes: readonly string[],
  namespace = "phase9.assurance.merkle",
): string {
  if (hashes.length === 0) {
    return hashAssurancePayload({ empty: true }, `${namespace}.empty`);
  }
  let level = [...hashes].sort();
  for (const hash of level) {
    invariant(isSha256Hex(hash), "INVALID_MERKLE_INPUT_HASH", "Merkle inputs must be SHA-256 hex hashes.");
  }
  while (level.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      invariant(left, "MERKLE_LEFT_NODE_MISSING", "Merkle left node missing.");
      const right = level[index + 1] ?? left;
      next.push(sha256Hex(`${namespace}:node:${left}:${right}`));
    }
    level = next.sort();
  }
  const root = level[0];
  invariant(root, "MERKLE_ROOT_MISSING", "Merkle root missing.");
  return root;
}

export interface Phase9FieldDefinition {
  readonly fieldName: string;
  readonly fieldType: string;
  readonly required: boolean;
  readonly enumRef?: Phase9AssuranceEnumName;
  readonly notes: string;
}

export interface Phase9ContractStateExample {
  readonly exampleId: string;
  readonly description: string;
  readonly fieldValues: JsonRecord;
}

export interface Phase9AssuranceContractDefinition {
  readonly contractName: Phase9AssuranceContractName;
  readonly schemaVersion: typeof PHASE9_ASSURANCE_CONTRACT_VERSION;
  readonly sourceAlgorithmRef: string;
  readonly fieldNames: readonly string[];
  readonly requiredFields: readonly string[];
  readonly optionalFields: readonly string[];
  readonly fields: readonly Phase9FieldDefinition[];
  readonly enumValues: Record<string, readonly string[]>;
  readonly tenantScopeConstraints: readonly string[];
  readonly identityKeys: readonly string[];
  readonly idempotencyKeys: readonly string[];
  readonly versioningStrategy: readonly string[];
  readonly canonicalHashInputs: readonly string[];
  readonly piiPhiClassification: string;
  readonly retentionClassRef: string;
  readonly auditEventMapping: readonly string[];
  readonly migrationCompatibilityNotes: readonly string[];
  readonly validStateExamples: readonly Phase9ContractStateExample[];
  readonly invalidStateExamples: readonly Phase9ContractStateExample[];
}

export const phase9AssuranceEnumValues = {
  entryType: [
    "event_ingest",
    "control_evaluation",
    "evidence_materialization",
    "projection_health",
    "trust_evaluation",
    "continuity_evidence",
    "identity_repair_evidence",
    "surface_runtime_binding",
  ],
  replayDecisionClass: [
    "original",
    "exact_replay",
    "semantic_replay",
    "stale_duplicate",
    "collision_review",
  ],
  artifactType: ["event_snapshot", "projection_snapshot", "audit_record", "pack_section", "retention_artifact"],
  artifactRole: ["source", "derived", "summary", "redacted", "manifest"],
  visibilityScope: ["tenant_internal", "governance", "support", "audit_export", "patient_visible"],
  controlObjectiveStatus: ["active", "deprecated", "superseded", "draft"],
  linkType: ["mandatory", "supporting", "compensating", "attestation"],
  validationState: ["validated", "pending", "failed", "superseded"],
  freshnessState: ["current", "stale", "expired", "missing", "quarantined"],
  stalenessState: ["fresh", "near_stale", "stale", "blocked"],
  rebuildState: ["not_required", "queued", "rebuilt", "failed"],
  trustState: ["trusted", "degraded", "quarantined", "unknown"],
  completenessState: ["complete", "partial", "blocked"],
  determinismState: ["deterministic", "approximate", "diverged", "unknown"],
  attestationStatus: ["draft", "attested", "rejected", "revoked"],
  packType: ["dtac", "dcb0129", "im1", "records_governance", "incident_followup", "release_assurance"],
  packState: ["collecting", "validating", "awaiting_attestation", "published", "superseded", "archived"],
  quarantineState: ["clear", "quarantined", "released"],
  controlStatusState: ["satisfied", "degraded", "unsatisfied", "blocked"],
  coverageState: ["satisfied", "partial", "missing", "blocked"],
  audienceTier: ["patient", "staff", "support", "operations", "governance", "tenant_admin"],
  bindingState: ["live", "diagnostic_only", "recovery_only", "blocked"],
  graphSnapshotState: ["complete", "stale", "blocked"],
  edgeType: [
    "ledger_produces_artifact",
    "artifact_satisfies_control",
    "control_materializes_status",
    "control_opens_gap",
    "artifact_supports_continuity",
    "continuity_section_supports_pack",
    "incident_opens_gap",
    "gap_drives_capa",
    "retention_preserves_artifact",
    "deletion_blocks_pack",
    "export_materializes_artifact",
    "standards_version_governs_control",
  ],
  scopeState: ["in_scope", "out_of_scope_conflict"],
  supersessionState: ["live", "superseded", "unresolved"],
  graphVerdictState: ["complete", "stale", "blocked"],
} as const;

type Phase9AssuranceEnumName = keyof typeof phase9AssuranceEnumValues;

function field(
  fieldName: string,
  fieldType: string,
  required = true,
  enumRef?: Phase9AssuranceEnumName,
): Phase9FieldDefinition {
  return {
    fieldName,
    fieldType,
    required,
    enumRef,
    notes: enumRef
      ? `Enum pinned by phase9AssuranceEnumValues.${enumRef}.`
      : "Pinned by Phase 9A assurance ledger source algorithm.",
  };
}

const phase9AssuranceFieldSpecs = {
  AssuranceLedgerEntry: [
    field("assuranceLedgerEntryId", "string"),
    field("sourceEventRef", "string"),
    field("entryType", "Phase9AssuranceEntryType", true, "entryType"),
    field("tenantId", "string"),
    field("producerRef", "string"),
    field("namespaceRef", "string"),
    field("schemaVersionRef", "string"),
    field("normalizationVersionRef", "string"),
    field("sourceSequenceRef", "string"),
    field("sourceBoundedContextRef", "string"),
    field("governingBoundedContextRef", "string"),
    field("requiredContextBoundaryRefs", "readonly string[]"),
    field("edgeCorrelationId", "string"),
    field("continuityFrameRef", "string", false),
    field("routeIntentRef", "string", false),
    field("commandActionRef", "string", false),
    field("commandSettlementRef", "string", false),
    field("uiEventRef", "string", false),
    field("uiTransitionSettlementRef", "string", false),
    field("projectionVisibilityRef", "string", false),
    field("auditRecordRef", "string"),
    field("telemetryDisclosureFenceRef", "string", false),
    field("causalTokenRef", "string"),
    field("replayDecisionClass", "ReplayDecisionClass", true, "replayDecisionClass"),
    field("effectKeyRef", "string"),
    field("controlRefs", "readonly string[]"),
    field("evidenceRefs", "readonly string[]"),
    field("graphEdgeRefs", "readonly string[]"),
    field("canonicalPayloadHash", "sha256-hex"),
    field("inputSetHash", "sha256-hex"),
    field("hash", "sha256-hex"),
    field("previousHash", "sha256-hex"),
    field("createdAt", "iso-timestamp"),
  ],
  EvidenceArtifact: [
    field("evidenceArtifactId", "string"),
    field("artifactType", "EvidenceArtifactType", true, "artifactType"),
    field("sourceRef", "string"),
    field("sourceVersion", "string"),
    field("sourceSnapshotRef", "string"),
    field("sourceCaptureBundleRef", "string"),
    field("sourceDerivationPackageRefs", "readonly string[]"),
    field("sourceSummaryParityRef", "string"),
    field("producedByEntryRef", "string"),
    field("canonicalScopeRef", "string"),
    field("artifactRole", "EvidenceArtifactRole", true, "artifactRole"),
    field("integrityHash", "sha256-hex"),
    field("canonicalArtifactHash", "sha256-hex"),
    field("artifactManifestHash", "sha256-hex"),
    field("derivedFromArtifactRefs", "readonly string[]"),
    field("redactionTransformHash", "sha256-hex"),
    field("retentionClassRef", "string"),
    field("visibilityScope", "VisibilityScope", true, "visibilityScope"),
    field("supersedesArtifactRef", "string", false),
    field("createdAt", "iso-timestamp"),
  ],
  ControlObjective: [
    field("controlObjectiveId", "string"),
    field("frameworkCode", "string"),
    field("controlCode", "string"),
    field("versionRef", "string"),
    field("ownerRole", "string"),
    field("status", "ControlObjectiveStatus", true, "controlObjectiveStatus"),
    field("evidenceRequirementSet", "readonly EvidenceRequirement[]"),
    field("freshnessPolicyRef", "string"),
    field("validationPolicyRef", "string"),
  ],
  ControlEvidenceLink: [
    field("linkId", "string"),
    field("controlObjectiveId", "string"),
    field("requirementRef", "string"),
    field("requirementWeight", "number"),
    field("evidenceArtifactId", "string"),
    field("linkType", "ControlEvidenceLinkType", true, "linkType"),
    field("validFrom", "iso-timestamp"),
    field("validTo", "iso-timestamp", false),
    field("validationState", "ValidationState", true, "validationState"),
    field("validationBasisRef", "string"),
    field("freshnessState", "FreshnessState", true, "freshnessState"),
    field("lineagePathHash", "sha256-hex"),
    field("evidenceSetHash", "sha256-hex"),
    field("assuranceEvidenceGraphSnapshotRef", "string"),
    field("assuranceEvidenceGraphEdgeRef", "string"),
    field("linkConfidence", "number"),
    field("supersededAt", "iso-timestamp", false),
  ],
  ProjectionHealthSnapshot: [
    field("projectionHealthSnapshotId", "string"),
    field("projectionCode", "string"),
    field("lagMs", "number"),
    field("stalenessState", "ProjectionStalenessState", true, "stalenessState"),
    field("rebuildState", "ProjectionRebuildState", true, "rebuildState"),
    field("trustState", "AssuranceTrustState", true, "trustState"),
    field("completenessState", "AssuranceCompletenessState", true, "completenessState"),
    field("expectedInputRefs", "readonly string[]"),
    field("observedInputRefs", "readonly string[]"),
    field("coverageScore", "number"),
    field("replayMatchScore", "number"),
    field("determinismState", "DeterminismState", true, "determinismState"),
    field("snapshotHash", "sha256-hex"),
    field("rebuildHash", "sha256-hex"),
    field("integrityScore", "number"),
    field("affectedAudienceRefs", "readonly string[]"),
    field("capturedAt", "iso-timestamp"),
  ],
  AttestationRecord: [
    field("attestationId", "string"),
    field("controlObjectiveId", "string"),
    field("attestedBy", "string"),
    field("attestedAt", "iso-timestamp"),
    field("attestationScope", "string"),
    field("status", "AttestationStatus", true, "attestationStatus"),
    field("commentRef", "string", false),
  ],
  AssurancePack: [
    field("assurancePackId", "string"),
    field("packType", "AssurancePackType", true, "packType"),
    field("periodStart", "iso-timestamp"),
    field("periodEnd", "iso-timestamp"),
    field("tenantScope", "string"),
    field("state", "AssurancePackState", true, "packState"),
    field("artifactRefs", "readonly string[]"),
    field("signoffRefs", "readonly string[]"),
    field("assuranceEvidenceGraphSnapshotRef", "string"),
    field("assuranceGraphCompletenessVerdictRef", "string"),
    field("graphHash", "sha256-hex"),
  ],
  AssuranceIngestCheckpoint: [
    field("assuranceIngestCheckpointId", "string"),
    field("producerRef", "string"),
    field("namespaceRef", "string"),
    field("schemaVersionRef", "string"),
    field("lastAcceptedSequenceRef", "string"),
    field("lastAcceptedEventRef", "string"),
    field("lastAcceptedHash", "sha256-hex"),
    field("quarantineState", "QuarantineState", true, "quarantineState"),
    field("quarantineReason", "string", false),
    field("updatedAt", "iso-timestamp"),
  ],
  ControlStatusSnapshot: [
    field("controlStatusSnapshotId", "string"),
    field("controlObjectiveId", "string"),
    field("tenantId", "string"),
    field("state", "ControlStatusState", true, "controlStatusState"),
    field("coverageState", "CoverageState", true, "coverageState"),
    field("freshnessState", "FreshnessState", true, "freshnessState"),
    field("latestEvidenceRef", "string"),
    field("latestValidatedAt", "iso-timestamp"),
    field("coverageScore", "number"),
    field("coverageLowerBound", "number"),
    field("lineageScore", "number"),
    field("reproducibilityScore", "number"),
    field("decisionHash", "sha256-hex"),
    field("evidenceSetHash", "sha256-hex"),
    field("assuranceEvidenceGraphSnapshotRef", "string"),
    field("assuranceGraphCompletenessVerdictRef", "string"),
    field("graphHash", "sha256-hex"),
    field("gapReasonRefs", "readonly string[]"),
    field("generatedAt", "iso-timestamp"),
  ],
  AssuranceSliceTrustRecord: [
    field("assuranceSliceTrustRecordId", "string"),
    field("sliceRef", "string"),
    field("scopeRef", "string"),
    field("audienceTier", "AudienceTier", true, "audienceTier"),
    field("trustState", "AssuranceTrustState", true, "trustState"),
    field("completenessState", "AssuranceCompletenessState", true, "completenessState"),
    field("trustScore", "number"),
    field("trustLowerBound", "number"),
    field("freshnessScore", "number"),
    field("coverageScore", "number"),
    field("lineageScore", "number"),
    field("replayScore", "number"),
    field("consistencyScore", "number"),
    field("hardBlockState", "boolean"),
    field("blockingProducerRefs", "readonly string[]"),
    field("blockingNamespaceRefs", "readonly string[]"),
    field("evaluationModelRef", "string"),
    field("evaluationInputHash", "sha256-hex"),
    field("lastEvaluatedAt", "iso-timestamp"),
  ],
  ExperienceContinuityControlEvidence: [
    field("continuityControlEvidenceId", "string"),
    field("controlCode", "string"),
    field("producerFamilyRef", "string"),
    field("audienceTier", "AudienceTier", true, "audienceTier"),
    field("audienceSurfaceRef", "string"),
    field("routeFamilyRef", "string"),
    field("routeContinuityEvidenceContractRef", "string"),
    field("canonicalObjectDescriptorRef", "string"),
    field("governingObjectRef", "string"),
    field("governingObjectVersionRef", "string"),
    field("shellContinuityKey", "string"),
    field("entityContinuityKey", "string"),
    field("selectedAnchorRef", "string"),
    field("selectedAnchorTupleHashRef", "sha256-hex"),
    field("surfacePublicationRef", "string"),
    field("runtimePublicationBundleRef", "string"),
    field("releasePublicationParityRef", "string"),
    field("sourceProjectionRef", "string"),
    field("sourceSettlementRef", "string"),
    field("sourceContinuationRef", "string"),
    field("evidenceArtifactRefs", "readonly string[]"),
    field("validationState", "ValidationState", true, "validationState"),
    field("validationBasisHash", "sha256-hex"),
    field("continuityTupleHash", "sha256-hex"),
    field("continuitySetHash", "sha256-hex"),
    field("reproductionHash", "sha256-hex"),
    field("lastValidatedAt", "iso-timestamp"),
  ],
  AssuranceSurfaceRuntimeBinding: [
    field("assuranceSurfaceRuntimeBindingId", "string"),
    field("audienceSurface", "string"),
    field("routeFamilyRef", "string"),
    field("audienceSurfaceRuntimeBindingRef", "string"),
    field("surfaceRouteContractRef", "string"),
    field("surfacePublicationRef", "string"),
    field("runtimePublicationBundleRef", "string"),
    field("releasePublicationParityRef", "string"),
    field("requiredTrustRefs", "readonly string[]"),
    field("requiredChannelFreezeRefs", "readonly string[]"),
    field("releaseTrustFreezeVerdictRef", "string"),
    field("releaseRecoveryDispositionRef", "string"),
    field("bindingState", "BindingState", true, "bindingState"),
    field("validatedAt", "iso-timestamp"),
  ],
  IdentityRepairEvidenceBundle: [
    field("identityRepairEvidenceBundleId", "string"),
    field("identityRepairCaseRef", "string"),
    field("repairSignalRefs", "readonly string[]"),
    field("freezeRecordRef", "string"),
    field("downstreamDispositionRefs", "readonly string[]"),
    field("resultingIdentityBindingRef", "string"),
    field("releaseSettlementRef", "string"),
    field("artifactRefs", "readonly string[]"),
    field("bundleHash", "sha256-hex"),
    field("createdAt", "iso-timestamp"),
  ],
  AssuranceEvidenceGraphSnapshot: [
    field("assuranceEvidenceGraphSnapshotId", "string"),
    field("tenantScopeRef", "string"),
    field("standardsVersionMapRefs", "readonly string[]"),
    field("ledgerEntryRefs", "readonly string[]"),
    field("evidenceArtifactRefs", "readonly string[]"),
    field("controlObjectiveRefs", "readonly string[]"),
    field("controlEvidenceLinkRefs", "readonly string[]"),
    field("controlStatusSnapshotRefs", "readonly string[]"),
    field("controlRecordRefs", "readonly string[]"),
    field("evidenceGapRecordRefs", "readonly string[]"),
    field("continuityEvidenceRefs", "readonly string[]"),
    field("continuityEvidencePackSectionRefs", "readonly string[]"),
    field("incidentRefs", "readonly string[]"),
    field("exceptionRefs", "readonly string[]"),
    field("capaActionRefs", "readonly string[]"),
    field("retentionDecisionRefs", "readonly string[]"),
    field("archiveManifestRefs", "readonly string[]"),
    field("deletionCertificateRefs", "readonly string[]"),
    field("packRefs", "readonly string[]"),
    field("assurancePackActionRecordRefs", "readonly string[]"),
    field("assurancePackSettlementRefs", "readonly string[]"),
    field("recoveryEvidenceArtifactRefs", "readonly string[]"),
    field("evidenceSetHash", "sha256-hex"),
    field("continuitySetHash", "sha256-hex"),
    field("incidentSetHash", "sha256-hex"),
    field("retentionSetHash", "sha256-hex"),
    field("graphHash", "sha256-hex"),
    field("snapshotState", "GraphSnapshotState", true, "graphSnapshotState"),
    field("generatedAt", "iso-timestamp"),
  ],
  AssuranceEvidenceGraphEdge: [
    field("assuranceEvidenceGraphEdgeId", "string"),
    field("graphSnapshotRef", "string"),
    field("fromRef", "string"),
    field("toRef", "string"),
    field("edgeType", "AssuranceGraphEdgeType", true, "edgeType"),
    field("scopeState", "EdgeScopeState", true, "scopeState"),
    field("supersessionState", "EdgeSupersessionState", true, "supersessionState"),
    field("edgeHash", "sha256-hex"),
    field("createdAt", "iso-timestamp"),
  ],
  AssuranceGraphCompletenessVerdict: [
    field("assuranceGraphCompletenessVerdictId", "string"),
    field("graphSnapshotRef", "string"),
    field("scopeRef", "string"),
    field("requiredNodeRefs", "readonly string[]"),
    field("missingNodeRefs", "readonly string[]"),
    field("orphanNodeRefs", "readonly string[]"),
    field("missingEdgeRefs", "readonly string[]"),
    field("supersessionConflictRefs", "readonly string[]"),
    field("crossScopeConflictRefs", "readonly string[]"),
    field("requiredPackRefs", "readonly string[]"),
    field("requiredRetentionRefs", "readonly string[]"),
    field("blockedExportRefs", "readonly string[]"),
    field("verdictState", "GraphVerdictState", true, "graphVerdictState"),
    field("decisionHash", "sha256-hex"),
    field("evaluatedAt", "iso-timestamp"),
  ],
} as const satisfies Record<Phase9AssuranceContractName, readonly Phase9FieldDefinition[]>;

function enumValuesForFields(fields: readonly Phase9FieldDefinition[]): Record<string, readonly string[]> {
  const values: Record<string, readonly string[]> = {};
  for (const spec of fields) {
    if (spec.enumRef) {
      values[spec.fieldName] = phase9AssuranceEnumValues[spec.enumRef];
    }
  }
  return values;
}

function identityKeyFor(contractName: Phase9AssuranceContractName): string {
  const idField = phase9AssuranceFieldSpecs[contractName].find((spec) => spec.fieldName.endsWith("Id"));
  invariant(idField, "CONTRACT_ID_FIELD_MISSING", `${contractName} is missing an identity field.`);
  return idField.fieldName;
}

function tenantConstraintsFor(fields: readonly Phase9FieldDefinition[]): readonly string[] {
  const names = new Set(fields.map((spec) => spec.fieldName));
  const constraints = [
    "All refs that carry tenant or scope metadata must resolve inside the same tenant scope unless an explicit governed cross-organisation grant exists.",
    "Analytics assurance remains observer or governance posture and must not mutate patient, booking, hub, pharmacy, or communication lifecycle truth.",
  ];
  if (names.has("tenantId")) {
    constraints.push("tenantId is mandatory and must match every tenant-scoped referenced artifact.");
  }
  if (names.has("tenantScope") || names.has("tenantScopeRef") || names.has("scopeRef")) {
    constraints.push("tenant scope refs may narrow but never widen audience or organisation scope after materialization.");
  }
  return constraints;
}

function piiPhiClassificationFor(contractName: Phase9AssuranceContractName): string {
  if (contractName === "EvidenceArtifact" || contractName === "IdentityRepairEvidenceBundle") {
    return "PHI/PII pointer-sensitive: no inline PHI; source, identity, and artifact refs require redaction and retention controls.";
  }
  if (contractName === "ExperienceContinuityControlEvidence" || contractName === "AssuranceSurfaceRuntimeBinding") {
    return "Operational continuity metadata with possible patient-route refs; no inline clinical content permitted.";
  }
  return "Operational assurance metadata; may contain tenant, audit, producer, and artifact refs but no inline PHI.";
}

function retentionClassFor(fields: readonly Phase9FieldDefinition[], contractName: Phase9AssuranceContractName): string {
  if (fields.some((spec) => spec.fieldName === "retentionClassRef")) {
    return "retentionClassRef is required and must map to the Records Management Code aligned retention catalog.";
  }
  if (
    contractName === "AssuranceEvidenceGraphSnapshot" ||
    contractName === "AssuranceGraphCompletenessVerdict" ||
    contractName === "AssurancePack"
  ) {
    return "governance_assurance_worm_record";
  }
  return "inherits_retention_from_linked_evidence_or_audit_record";
}

function canonicalHashInputsFor(fields: readonly Phase9FieldDefinition[]): readonly string[] {
  return fields
    .map((spec) => spec.fieldName)
    .filter((name) => !["hash", "edgeHash", "graphHash", "decisionHash"].includes(name));
}

function contractDefinition(contractName: Phase9AssuranceContractName): Phase9AssuranceContractDefinition {
  const fields = phase9AssuranceFieldSpecs[contractName];
  const requiredFields = fields.filter((spec) => spec.required).map((spec) => spec.fieldName);
  const optionalFields = fields.filter((spec) => !spec.required).map((spec) => spec.fieldName);
  const identityKey = identityKeyFor(contractName);
  return {
    contractName,
    schemaVersion: PHASE9_ASSURANCE_CONTRACT_VERSION,
    sourceAlgorithmRef: "blueprint/phase-9-the-assurance-ledger.md#9A",
    fieldNames: fields.map((spec) => spec.fieldName),
    requiredFields,
    optionalFields,
    fields,
    enumValues: enumValuesForFields(fields),
    tenantScopeConstraints: tenantConstraintsFor(fields),
    identityKeys: [identityKey],
    idempotencyKeys: [
      identityKey,
      fields.some((spec) => spec.fieldName === "tenantId") ? "tenantId" : "scopeRef|tenantScopeRef|tenantScope",
      "schemaVersionRef|versionRef|evaluationModelRef",
    ],
    versioningStrategy: [
      `contract schema pinned to ${PHASE9_ASSURANCE_CONTRACT_VERSION}`,
      `normalization pinned to ${PHASE9_ASSURANCE_NORMALIZATION_VERSION} where source events are normalized`,
      `graph snapshots pinned to ${PHASE9_ASSURANCE_GRAPH_SNAPSHOT_VERSION}`,
      `slice trust lower-bound model pinned to ${PHASE9_ASSURANCE_TRUST_EVALUATION_MODEL}`,
      `replay determinism pinned to ${PHASE9_ASSURANCE_REPLAY_DETERMINISM_VERSION}`,
    ],
    canonicalHashInputs: canonicalHashInputsFor(fields),
    piiPhiClassification: piiPhiClassificationFor(contractName),
    retentionClassRef: retentionClassFor(fields, contractName),
    auditEventMapping: [
      `assurance.phase9.${contractName}.created`,
      `assurance.phase9.${contractName}.validated`,
      `assurance.phase9.${contractName}.superseded_or_quarantined`,
    ],
    migrationCompatibilityNotes: [
      "Unknown namespaces and unsupported schema versions must quarantine before ledger append.",
      "Legacy aliases may normalize only through a registered CanonicalEventNormalizationRule and must record the alias mapping.",
      "Hash, graph, replay, and trust model version changes require deterministic rebuild before authoritative use.",
    ],
    validStateExamples: [
      {
        exampleId: `valid:${contractName}:canonical-fixture`,
        description: `Canonical valid ${contractName} example is materialized under data/fixtures/432_phase9_assurance_contract_fixtures.json#/examples/${contractName}.`,
        fieldValues: { fixturePath: "data/fixtures/432_phase9_assurance_contract_fixtures.json" },
      },
    ],
    invalidStateExamples: [
      {
        exampleId: `invalid:${contractName}:missing-required-field`,
        description: `Removing any required field from ${contractName} must fail contract validation.`,
        fieldValues: { invalidMutation: "delete_first_required_field" },
      },
      {
        exampleId: `invalid:${contractName}:bad-enum`,
        description: `Replacing an enum field on ${contractName} with an unregistered value must fail closed.`,
        fieldValues: { invalidMutation: "replace_enum_with_unregistered_value" },
      },
    ],
  };
}

export const phase9AssuranceContractDefinitions = REQUIRED_PHASE9_ASSURANCE_CONTRACTS.map(
  contractDefinition,
) as readonly Phase9AssuranceContractDefinition[];

export interface Phase9ContractValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export function getPhase9AssuranceContractDefinition(
  contractName: Phase9AssuranceContractName,
): Phase9AssuranceContractDefinition {
  const definition = phase9AssuranceContractDefinitions.find((candidate) => candidate.contractName === contractName);
  invariant(definition, "PHASE9_CONTRACT_DEFINITION_MISSING", `${contractName} definition is missing.`);
  return definition;
}

export function validateContractDefinitionCoverage(
  definitions: readonly Phase9AssuranceContractDefinition[] = phase9AssuranceContractDefinitions,
): Phase9ContractValidationResult {
  const errors: string[] = [];
  const names = new Set(definitions.map((definition) => definition.contractName));
  for (const requiredName of REQUIRED_PHASE9_ASSURANCE_CONTRACTS) {
    if (!names.has(requiredName)) {
      errors.push(`MISSING_CONTRACT:${requiredName}`);
    }
  }
  if (names.size !== definitions.length) {
    errors.push("DUPLICATE_CONTRACT_NAME");
  }
  for (const definition of definitions) {
    for (const key of [
      "tenantScopeConstraints",
      "identityKeys",
      "idempotencyKeys",
      "versioningStrategy",
      "canonicalHashInputs",
      "auditEventMapping",
      "migrationCompatibilityNotes",
      "validStateExamples",
      "invalidStateExamples",
    ] as const) {
      if (definition[key].length === 0) {
        errors.push(`CONTRACT_METADATA_EMPTY:${definition.contractName}:${key}`);
      }
    }
    for (const requiredField of definition.requiredFields) {
      if (!definition.fieldNames.includes(requiredField)) {
        errors.push(`REQUIRED_FIELD_NOT_DECLARED:${definition.contractName}:${requiredField}`);
      }
    }
  }
  const allFieldNames = new Set(definitions.flatMap((definition) => definition.fieldNames));
  for (const distinctConcept of [
    "trustState",
    "completenessState",
    "freshnessState",
    "replayDecisionClass",
    "effectKeyRef",
    "sourceBoundedContextRef",
    "governingBoundedContextRef",
  ]) {
    if (!allFieldNames.has(distinctConcept)) {
      errors.push(`COLLAPSED_REQUIRED_CONCEPT:${distinctConcept}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateContractObject(
  contractName: Phase9AssuranceContractName,
  value: unknown,
): Phase9ContractValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { valid: false, errors: [`CONTRACT_OBJECT_NOT_RECORD:${contractName}`] };
  }
  const definition = getPhase9AssuranceContractDefinition(contractName);
  for (const requiredField of definition.requiredFields) {
    const fieldValue = value[requiredField];
    if (
      fieldValue === undefined ||
      fieldValue === null ||
      (typeof fieldValue === "string" && fieldValue.trim().length === 0)
    ) {
      errors.push(`MISSING_REQUIRED_FIELD:${contractName}.${requiredField}`);
    }
  }
  for (const fieldSpec of definition.fields) {
    const fieldValue = value[fieldSpec.fieldName];
    if (fieldValue === undefined || !fieldSpec.enumRef) {
      continue;
    }
    if (!phase9AssuranceEnumValues[fieldSpec.enumRef].includes(fieldValue as never)) {
      errors.push(`INVALID_ENUM:${contractName}.${fieldSpec.fieldName}:${String(fieldValue)}`);
    }
  }
  for (const hashField of definition.fields.filter((spec) => spec.fieldType === "sha256-hex")) {
    const fieldValue = value[hashField.fieldName];
    if (fieldValue !== undefined && !isSha256Hex(fieldValue)) {
      errors.push(`INVALID_HASH:${contractName}.${hashField.fieldName}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidContractObject(contractName: Phase9AssuranceContractName, value: unknown): void {
  const result = validateContractObject(contractName, value);
  invariant(result.valid, "PHASE9_CONTRACT_OBJECT_INVALID", result.errors.join("; "));
}

export interface TenantScopedReference {
  readonly fieldName: string;
  readonly ref: string;
  readonly tenantId: string;
}

export function validateTenantIsolation(
  expectedTenantId: string,
  references: readonly TenantScopedReference[],
): Phase9ContractValidationResult {
  const errors = references
    .filter((reference) => reference.tenantId !== expectedTenantId)
    .map((reference) => `CROSS_TENANT_REFERENCE:${reference.fieldName}:${reference.ref}`);
  return { valid: errors.length === 0, errors };
}

interface EvidenceRequirement {
  readonly requirementRef: string;
  readonly weight: number;
  readonly mandatory: boolean;
}

export interface AssuranceLedgerEntry {
  readonly assuranceLedgerEntryId: string;
  readonly sourceEventRef: string;
  readonly entryType: string;
  readonly tenantId: string;
  readonly producerRef: string;
  readonly namespaceRef: string;
  readonly schemaVersionRef: string;
  readonly normalizationVersionRef: string;
  readonly sourceSequenceRef: string;
  readonly sourceBoundedContextRef: string;
  readonly governingBoundedContextRef: string;
  readonly requiredContextBoundaryRefs: readonly string[];
  readonly edgeCorrelationId: string;
  readonly continuityFrameRef?: string;
  readonly routeIntentRef?: string;
  readonly commandActionRef?: string;
  readonly commandSettlementRef?: string;
  readonly uiEventRef?: string;
  readonly uiTransitionSettlementRef?: string;
  readonly projectionVisibilityRef?: string;
  readonly auditRecordRef: string;
  readonly telemetryDisclosureFenceRef?: string;
  readonly causalTokenRef: string;
  readonly replayDecisionClass: ReplayDecisionClass;
  readonly effectKeyRef: string;
  readonly controlRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly graphEdgeRefs: readonly string[];
  readonly canonicalPayloadHash: string;
  readonly inputSetHash: string;
  readonly hash: string;
  readonly previousHash: string;
  readonly createdAt: string;
}

export type AssuranceLedgerEntryDraft = Omit<
  AssuranceLedgerEntry,
  "canonicalPayloadHash" | "inputSetHash" | "hash"
> & {
  readonly canonicalPayload?: unknown;
  readonly inputSetValues?: readonly unknown[];
  readonly canonicalPayloadHash?: string;
  readonly inputSetHash?: string;
};

export interface EvidenceArtifact {
  readonly evidenceArtifactId: string;
  readonly artifactType: string;
  readonly sourceRef: string;
  readonly sourceVersion: string;
  readonly sourceSnapshotRef: string;
  readonly sourceCaptureBundleRef: string;
  readonly sourceDerivationPackageRefs: readonly string[];
  readonly sourceSummaryParityRef: string;
  readonly producedByEntryRef: string;
  readonly canonicalScopeRef: string;
  readonly artifactRole: string;
  readonly integrityHash: string;
  readonly canonicalArtifactHash: string;
  readonly artifactManifestHash: string;
  readonly derivedFromArtifactRefs: readonly string[];
  readonly redactionTransformHash: string;
  readonly retentionClassRef: string;
  readonly visibilityScope: string;
  readonly supersedesArtifactRef?: string;
  readonly createdAt: string;
}

export interface ControlObjective {
  readonly controlObjectiveId: string;
  readonly frameworkCode: string;
  readonly controlCode: string;
  readonly versionRef: string;
  readonly ownerRole: string;
  readonly status: string;
  readonly evidenceRequirementSet: readonly EvidenceRequirement[];
  readonly freshnessPolicyRef: string;
  readonly validationPolicyRef: string;
}

export interface ControlEvidenceLink {
  readonly linkId: string;
  readonly controlObjectiveId: string;
  readonly requirementRef: string;
  readonly requirementWeight: number;
  readonly evidenceArtifactId: string;
  readonly linkType: string;
  readonly validFrom: string;
  readonly validTo?: string;
  readonly validationState: ValidationState;
  readonly validationBasisRef: string;
  readonly freshnessState: FreshnessState;
  readonly lineagePathHash: string;
  readonly evidenceSetHash: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceEvidenceGraphEdgeRef: string;
  readonly linkConfidence: number;
  readonly supersededAt?: string;
}

export interface ProjectionHealthSnapshot {
  readonly projectionHealthSnapshotId: string;
  readonly projectionCode: string;
  readonly lagMs: number;
  readonly stalenessState: ProjectionStalenessState;
  readonly rebuildState: ProjectionRebuildState;
  readonly trustState: Phase9AssuranceTrustState;
  readonly completenessState: Phase9AssuranceCompletenessState;
  readonly expectedInputRefs: readonly string[];
  readonly observedInputRefs: readonly string[];
  readonly coverageScore: number;
  readonly replayMatchScore: number;
  readonly determinismState: DeterminismState;
  readonly snapshotHash: string;
  readonly rebuildHash: string;
  readonly integrityScore: number;
  readonly affectedAudienceRefs: readonly string[];
  readonly capturedAt: string;
}

export interface AttestationRecord {
  readonly attestationId: string;
  readonly controlObjectiveId: string;
  readonly attestedBy: string;
  readonly attestedAt: string;
  readonly attestationScope: string;
  readonly status: string;
  readonly commentRef?: string;
}

export interface AssurancePack {
  readonly assurancePackId: string;
  readonly packType: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly tenantScope: string;
  readonly state: string;
  readonly artifactRefs: readonly string[];
  readonly signoffRefs: readonly string[];
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
}

export interface AssuranceIngestCheckpoint {
  readonly assuranceIngestCheckpointId: string;
  readonly producerRef: string;
  readonly namespaceRef: string;
  readonly schemaVersionRef: string;
  readonly lastAcceptedSequenceRef: string;
  readonly lastAcceptedEventRef: string;
  readonly lastAcceptedHash: string;
  readonly quarantineState: QuarantineState;
  readonly quarantineReason?: string;
  readonly updatedAt: string;
}

export interface ControlStatusSnapshot {
  readonly controlStatusSnapshotId: string;
  readonly controlObjectiveId: string;
  readonly tenantId: string;
  readonly state: ControlStatusState;
  readonly coverageState: CoverageState;
  readonly freshnessState: FreshnessState;
  readonly latestEvidenceRef: string;
  readonly latestValidatedAt: string;
  readonly coverageScore: number;
  readonly coverageLowerBound: number;
  readonly lineageScore: number;
  readonly reproducibilityScore: number;
  readonly decisionHash: string;
  readonly evidenceSetHash: string;
  readonly assuranceEvidenceGraphSnapshotRef: string;
  readonly assuranceGraphCompletenessVerdictRef: string;
  readonly graphHash: string;
  readonly gapReasonRefs: readonly string[];
  readonly generatedAt: string;
}

export interface AssuranceSliceTrustRecord {
  readonly assuranceSliceTrustRecordId: string;
  readonly sliceRef: string;
  readonly scopeRef: string;
  readonly audienceTier: string;
  readonly trustState: Phase9AssuranceTrustState;
  readonly completenessState: Phase9AssuranceCompletenessState;
  readonly trustScore: number;
  readonly trustLowerBound: number;
  readonly freshnessScore: number;
  readonly coverageScore: number;
  readonly lineageScore: number;
  readonly replayScore: number;
  readonly consistencyScore: number;
  readonly hardBlockState: boolean;
  readonly blockingProducerRefs: readonly string[];
  readonly blockingNamespaceRefs: readonly string[];
  readonly evaluationModelRef: string;
  readonly evaluationInputHash: string;
  readonly lastEvaluatedAt: string;
}

export interface ExperienceContinuityControlEvidence {
  readonly continuityControlEvidenceId: string;
  readonly controlCode: string;
  readonly producerFamilyRef: string;
  readonly audienceTier: string;
  readonly audienceSurfaceRef: string;
  readonly routeFamilyRef: string;
  readonly routeContinuityEvidenceContractRef: string;
  readonly canonicalObjectDescriptorRef: string;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string;
  readonly shellContinuityKey: string;
  readonly entityContinuityKey: string;
  readonly selectedAnchorRef: string;
  readonly selectedAnchorTupleHashRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly sourceProjectionRef: string;
  readonly sourceSettlementRef: string;
  readonly sourceContinuationRef: string;
  readonly evidenceArtifactRefs: readonly string[];
  readonly validationState: ValidationState;
  readonly validationBasisHash: string;
  readonly continuityTupleHash: string;
  readonly continuitySetHash: string;
  readonly reproductionHash: string;
  readonly lastValidatedAt: string;
}

export interface AssuranceSurfaceRuntimeBinding {
  readonly assuranceSurfaceRuntimeBindingId: string;
  readonly audienceSurface: string;
  readonly routeFamilyRef: string;
  readonly audienceSurfaceRuntimeBindingRef: string;
  readonly surfaceRouteContractRef: string;
  readonly surfacePublicationRef: string;
  readonly runtimePublicationBundleRef: string;
  readonly releasePublicationParityRef: string;
  readonly requiredTrustRefs: readonly string[];
  readonly requiredChannelFreezeRefs: readonly string[];
  readonly releaseTrustFreezeVerdictRef: string;
  readonly releaseRecoveryDispositionRef: string;
  readonly bindingState: BindingState;
  readonly validatedAt: string;
}

export interface IdentityRepairEvidenceBundle {
  readonly identityRepairEvidenceBundleId: string;
  readonly identityRepairCaseRef: string;
  readonly repairSignalRefs: readonly string[];
  readonly freezeRecordRef: string;
  readonly downstreamDispositionRefs: readonly string[];
  readonly resultingIdentityBindingRef: string;
  readonly releaseSettlementRef: string;
  readonly artifactRefs: readonly string[];
  readonly bundleHash: string;
  readonly createdAt: string;
}

export interface AssuranceEvidenceGraphSnapshot {
  readonly assuranceEvidenceGraphSnapshotId: string;
  readonly tenantScopeRef: string;
  readonly standardsVersionMapRefs: readonly string[];
  readonly ledgerEntryRefs: readonly string[];
  readonly evidenceArtifactRefs: readonly string[];
  readonly controlObjectiveRefs: readonly string[];
  readonly controlEvidenceLinkRefs: readonly string[];
  readonly controlStatusSnapshotRefs: readonly string[];
  readonly controlRecordRefs: readonly string[];
  readonly evidenceGapRecordRefs: readonly string[];
  readonly continuityEvidenceRefs: readonly string[];
  readonly continuityEvidencePackSectionRefs: readonly string[];
  readonly incidentRefs: readonly string[];
  readonly exceptionRefs: readonly string[];
  readonly capaActionRefs: readonly string[];
  readonly retentionDecisionRefs: readonly string[];
  readonly archiveManifestRefs: readonly string[];
  readonly deletionCertificateRefs: readonly string[];
  readonly packRefs: readonly string[];
  readonly assurancePackActionRecordRefs: readonly string[];
  readonly assurancePackSettlementRefs: readonly string[];
  readonly recoveryEvidenceArtifactRefs: readonly string[];
  readonly evidenceSetHash: string;
  readonly continuitySetHash: string;
  readonly incidentSetHash: string;
  readonly retentionSetHash: string;
  readonly graphHash: string;
  readonly snapshotState: GraphSnapshotState;
  readonly generatedAt: string;
}

export interface AssuranceEvidenceGraphEdge {
  readonly assuranceEvidenceGraphEdgeId: string;
  readonly graphSnapshotRef: string;
  readonly fromRef: string;
  readonly toRef: string;
  readonly edgeType: AssuranceGraphEdgeType;
  readonly scopeState: EdgeScopeState;
  readonly supersessionState: EdgeSupersessionState;
  readonly edgeHash: string;
  readonly createdAt: string;
}

export interface AssuranceGraphCompletenessVerdict {
  readonly assuranceGraphCompletenessVerdictId: string;
  readonly graphSnapshotRef: string;
  readonly scopeRef: string;
  readonly requiredNodeRefs: readonly string[];
  readonly missingNodeRefs: readonly string[];
  readonly orphanNodeRefs: readonly string[];
  readonly missingEdgeRefs: readonly string[];
  readonly supersessionConflictRefs: readonly string[];
  readonly crossScopeConflictRefs: readonly string[];
  readonly requiredPackRefs: readonly string[];
  readonly requiredRetentionRefs: readonly string[];
  readonly blockedExportRefs: readonly string[];
  readonly verdictState: GraphVerdictState;
  readonly decisionHash: string;
  readonly evaluatedAt: string;
}

function hashableRecord<T extends Record<string, unknown>>(value: T, excludedKeys: readonly string[]): Record<string, unknown> {
  const excluded = new Set(excludedKeys);
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!excluded.has(key) && entry !== undefined) {
      result[key] = entry;
    }
  }
  return result;
}

export function buildAssuranceLedgerEntry(draft: AssuranceLedgerEntryDraft): AssuranceLedgerEntry {
  const canonicalPayloadHash =
    draft.canonicalPayloadHash ??
    hashAssurancePayload(
      draft.canonicalPayload ?? {
        sourceEventRef: draft.sourceEventRef,
        producerRef: draft.producerRef,
        namespaceRef: draft.namespaceRef,
        sourceSequenceRef: draft.sourceSequenceRef,
      },
      "phase9.assurance.ledger.canonicalPayload",
    );
  const inputSetHash =
    draft.inputSetHash ??
    orderedSetHash(
      draft.inputSetValues ?? [
        draft.sourceEventRef,
        draft.controlRefs,
        draft.evidenceRefs,
        draft.requiredContextBoundaryRefs,
      ],
      "phase9.assurance.ledger.inputSet",
    );
  const entryWithoutHash = hashableRecord(
    {
      ...draft,
      canonicalPayloadHash,
      inputSetHash,
    },
    ["hash", "canonicalPayload", "inputSetValues"],
  );
  const hash = hashAssurancePayload(entryWithoutHash, "phase9.assurance.ledger.entry");
  const entry = {
    ...draft,
    canonicalPayloadHash,
    inputSetHash,
    hash,
  };
  assertValidContractObject("AssuranceLedgerEntry", entry);
  return entry;
}

export function validateAssuranceLedgerEntry(entry: AssuranceLedgerEntry): Phase9ContractValidationResult {
  const errors = [...validateContractObject("AssuranceLedgerEntry", entry).errors];
  for (const provenanceField of [
    "producerRef",
    "namespaceRef",
    "schemaVersionRef",
    "normalizationVersionRef",
    "sourceSequenceRef",
    "sourceBoundedContextRef",
    "governingBoundedContextRef",
  ] as const) {
    if (!isNonEmptyString(entry[provenanceField])) {
      errors.push(`LEDGER_PROVENANCE_FIELD_MISSING:${provenanceField}`);
    }
  }
  if (entry.previousHash !== GENESIS_ASSURANCE_LEDGER_HASH && !isSha256Hex(entry.previousHash)) {
    errors.push("LEDGER_PREVIOUS_HASH_INVALID");
  }
  return { valid: errors.length === 0, errors };
}

export function validateLedgerPreviousHashContinuity(
  entries: readonly AssuranceLedgerEntry[],
): Phase9ContractValidationResult {
  const errors: string[] = [];
  entries.forEach((entry, index) => {
    if (index === 0) {
      if (entry.previousHash !== GENESIS_ASSURANCE_LEDGER_HASH) {
        errors.push(`LEDGER_PREVIOUS_HASH_NOT_GENESIS:${entry.assuranceLedgerEntryId}`);
      }
      return;
    }
    const previous = entries[index - 1];
    if (!previous || entry.previousHash !== previous.hash) {
      errors.push(`LEDGER_PREVIOUS_HASH_BREAK:${entry.assuranceLedgerEntryId}`);
    }
  });
  return { valid: errors.length === 0, errors };
}

export type AssuranceEvidenceGraphEdgeDraft = Omit<AssuranceEvidenceGraphEdge, "edgeHash"> & {
  readonly edgeHash?: string;
};

export function buildAssuranceEvidenceGraphEdge(
  draft: AssuranceEvidenceGraphEdgeDraft,
): AssuranceEvidenceGraphEdge {
  const edgeHash =
    draft.edgeHash ??
    hashAssurancePayload(hashableRecord({ ...draft }, ["edgeHash"]), "phase9.assurance.graph.edge");
  const edge = { ...draft, edgeHash };
  assertValidContractObject("AssuranceEvidenceGraphEdge", edge);
  return edge;
}

export type AssuranceEvidenceGraphSnapshotDraft = Omit<
  AssuranceEvidenceGraphSnapshot,
  "evidenceSetHash" | "continuitySetHash" | "incidentSetHash" | "retentionSetHash" | "graphHash"
> & {
  readonly evidenceSetHash?: string;
  readonly continuitySetHash?: string;
  readonly incidentSetHash?: string;
  readonly retentionSetHash?: string;
  readonly graphHash?: string;
};

export function buildAssuranceEvidenceGraphSnapshot(
  draft: AssuranceEvidenceGraphSnapshotDraft,
  edges: readonly AssuranceEvidenceGraphEdge[],
): AssuranceEvidenceGraphSnapshot {
  const evidenceSetHash =
    draft.evidenceSetHash ??
    orderedSetHash(
      [
        draft.standardsVersionMapRefs,
        draft.ledgerEntryRefs,
        draft.evidenceArtifactRefs,
        draft.controlObjectiveRefs,
        draft.controlEvidenceLinkRefs,
        draft.controlStatusSnapshotRefs,
        draft.controlRecordRefs,
        draft.evidenceGapRecordRefs,
      ],
      "phase9.assurance.graph.evidenceSet",
    );
  const continuitySetHash =
    draft.continuitySetHash ??
    orderedSetHash(
      [
        draft.continuityEvidenceRefs,
        draft.continuityEvidencePackSectionRefs,
        draft.packRefs,
        draft.recoveryEvidenceArtifactRefs,
      ],
      "phase9.assurance.graph.continuitySet",
    );
  const incidentSetHash =
    draft.incidentSetHash ??
    orderedSetHash(
      [draft.incidentRefs, draft.exceptionRefs, draft.capaActionRefs],
      "phase9.assurance.graph.incidentSet",
    );
  const retentionSetHash =
    draft.retentionSetHash ??
    orderedSetHash(
      [draft.retentionDecisionRefs, draft.archiveManifestRefs, draft.deletionCertificateRefs],
      "phase9.assurance.graph.retentionSet",
    );
  const graphHash =
    draft.graphHash ??
    merkleRootForHashes(
      edges.map((edge) => edge.edgeHash),
      "phase9.assurance.graph.edges",
    );
  const snapshot = {
    ...draft,
    evidenceSetHash,
    continuitySetHash,
    incidentSetHash,
    retentionSetHash,
    graphHash,
  };
  assertValidContractObject("AssuranceEvidenceGraphSnapshot", snapshot);
  return snapshot;
}

export function collectGraphNodeRefs(snapshot: AssuranceEvidenceGraphSnapshot): Set<string> {
  return new Set([
    ...snapshot.standardsVersionMapRefs,
    ...snapshot.ledgerEntryRefs,
    ...snapshot.evidenceArtifactRefs,
    ...snapshot.controlObjectiveRefs,
    ...snapshot.controlEvidenceLinkRefs,
    ...snapshot.controlStatusSnapshotRefs,
    ...snapshot.controlRecordRefs,
    ...snapshot.evidenceGapRecordRefs,
    ...snapshot.continuityEvidenceRefs,
    ...snapshot.continuityEvidencePackSectionRefs,
    ...snapshot.incidentRefs,
    ...snapshot.exceptionRefs,
    ...snapshot.capaActionRefs,
    ...snapshot.retentionDecisionRefs,
    ...snapshot.archiveManifestRefs,
    ...snapshot.deletionCertificateRefs,
    ...snapshot.packRefs,
    ...snapshot.assurancePackActionRecordRefs,
    ...snapshot.assurancePackSettlementRefs,
    ...snapshot.recoveryEvidenceArtifactRefs,
  ]);
}

export interface AssuranceGraphCompletenessInput {
  readonly assuranceGraphCompletenessVerdictId: string;
  readonly snapshot: AssuranceEvidenceGraphSnapshot;
  readonly edges: readonly AssuranceEvidenceGraphEdge[];
  readonly scopeRef: string;
  readonly requiredNodeRefs: readonly string[];
  readonly requiredPackRefs?: readonly string[];
  readonly requiredRetentionRefs?: readonly string[];
  readonly blockedExportRefs?: readonly string[];
  readonly evaluatedAt: string;
}

export function evaluateAssuranceGraphCompletenessVerdict(
  input: AssuranceGraphCompletenessInput,
): AssuranceGraphCompletenessVerdict {
  const nodeRefs = collectGraphNodeRefs(input.snapshot);
  const missingNodeRefs = input.requiredNodeRefs.filter((nodeRef) => !nodeRefs.has(nodeRef)).sort();
  const requiredNodeSet = new Set(input.requiredNodeRefs);
  const edgeEndpointRefs = new Set(input.edges.flatMap((edge) => [edge.fromRef, edge.toRef]));
  const orphanNodeRefs = input.requiredNodeRefs
    .filter((nodeRef) => nodeRefs.has(nodeRef) && !edgeEndpointRefs.has(nodeRef))
    .sort();
  const missingEdgeRefs = input.edges
    .filter((edge) => !nodeRefs.has(edge.fromRef) || !nodeRefs.has(edge.toRef))
    .map((edge) => edge.assuranceEvidenceGraphEdgeId)
    .sort();
  const supersessionConflictRefs = input.edges
    .filter((edge) => edge.supersessionState !== "live")
    .map((edge) => edge.assuranceEvidenceGraphEdgeId)
    .sort();
  const crossScopeConflictRefs = input.edges
    .filter((edge) => edge.scopeState !== "in_scope")
    .map((edge) => edge.assuranceEvidenceGraphEdgeId)
    .sort();
  const blockedExportRefs = [...(input.blockedExportRefs ?? [])].sort();
  const requiredPackRefs = [...(input.requiredPackRefs ?? [])].sort();
  const requiredRetentionRefs = [...(input.requiredRetentionRefs ?? [])].sort();
  const missingRequiredPackRefs = requiredPackRefs.filter((packRef) => !requiredNodeSet.has(packRef));
  const missingRequiredRetentionRefs = requiredRetentionRefs.filter((retentionRef) => !requiredNodeSet.has(retentionRef));
  const hardBlocks = [
    ...missingNodeRefs,
    ...orphanNodeRefs,
    ...missingEdgeRefs,
    ...supersessionConflictRefs,
    ...crossScopeConflictRefs,
    ...blockedExportRefs,
    ...missingRequiredPackRefs,
    ...missingRequiredRetentionRefs,
  ];
  const verdictState: GraphVerdictState =
    hardBlocks.length > 0 || input.snapshot.snapshotState === "blocked"
      ? "blocked"
      : input.snapshot.snapshotState === "stale"
        ? "stale"
        : "complete";
  const decisionPayload = {
    graphSnapshotRef: input.snapshot.assuranceEvidenceGraphSnapshotId,
    scopeRef: input.scopeRef,
    requiredNodeRefs: [...input.requiredNodeRefs].sort(),
    missingNodeRefs,
    orphanNodeRefs,
    missingEdgeRefs,
    supersessionConflictRefs,
    crossScopeConflictRefs,
    requiredPackRefs,
    requiredRetentionRefs,
    blockedExportRefs,
    verdictState,
  };
  const verdict: AssuranceGraphCompletenessVerdict = {
    assuranceGraphCompletenessVerdictId: input.assuranceGraphCompletenessVerdictId,
    graphSnapshotRef: input.snapshot.assuranceEvidenceGraphSnapshotId,
    scopeRef: input.scopeRef,
    requiredNodeRefs: [...input.requiredNodeRefs].sort(),
    missingNodeRefs,
    orphanNodeRefs,
    missingEdgeRefs,
    supersessionConflictRefs,
    crossScopeConflictRefs,
    requiredPackRefs,
    requiredRetentionRefs,
    blockedExportRefs,
    verdictState,
    decisionHash: hashAssurancePayload(decisionPayload, "phase9.assurance.graph.verdict"),
    evaluatedAt: input.evaluatedAt,
  };
  assertValidContractObject("AssuranceGraphCompletenessVerdict", verdict);
  return verdict;
}

export function assertGraphSnapshotImmutable(
  previousSnapshot: AssuranceEvidenceGraphSnapshot,
  nextSnapshot: AssuranceEvidenceGraphSnapshot,
): void {
  if (previousSnapshot.snapshotState !== "complete") {
    return;
  }
  const previousCanonical = canonicalizeAssuranceValue(previousSnapshot);
  const nextCanonical = canonicalizeAssuranceValue(nextSnapshot);
  invariant(
    previousCanonical === nextCanonical,
    "GRAPH_SNAPSHOT_IMMUTABLE_ONCE_SEALED",
    "A complete assurance graph snapshot is sealed and must not be mutated.",
  );
}

export type Phase9GraphGatedConsumer =
  | "pack_export"
  | "support_replay"
  | "retention_disposition"
  | "archive_or_deletion"
  | "recovery_proof"
  | "authoritative_dashboard";

export function assertGraphCompletenessRequiredForConsumer(
  consumer: Phase9GraphGatedConsumer,
  snapshot: AssuranceEvidenceGraphSnapshot | undefined,
  verdict: AssuranceGraphCompletenessVerdict | undefined,
): void {
  invariant(snapshot, "GRAPH_SNAPSHOT_REQUIRED", `${consumer} requires an assurance evidence graph snapshot.`);
  invariant(verdict, "GRAPH_VERDICT_REQUIRED", `${consumer} requires an assurance graph completeness verdict.`);
  invariant(
    verdict.graphSnapshotRef === snapshot.assuranceEvidenceGraphSnapshotId,
    "GRAPH_VERDICT_SNAPSHOT_MISMATCH",
    `${consumer} verdict does not match graph snapshot.`,
  );
  invariant(
    snapshot.snapshotState === "complete" && verdict.verdictState === "complete",
    "GRAPH_VERDICT_NOT_COMPLETE",
    `${consumer} must fail closed unless the current graph and verdict are complete.`,
  );
}

export function assertNoParallelEvidenceListWhenGraphAvailable(
  snapshot: AssuranceEvidenceGraphSnapshot | undefined,
  localEvidenceRefs: readonly string[] | undefined,
): void {
  invariant(
    !snapshot || !localEvidenceRefs || localEvidenceRefs.length === 0,
    "PARALLEL_LOCAL_EVIDENCE_LIST_FORBIDDEN",
    "Phase 9 consumers must use the graph snapshot instead of parallel local evidence lists.",
  );
}

export interface AssuranceSliceTrustDerivationInput {
  readonly previousTrustState: Phase9AssuranceTrustState;
  readonly consecutiveTrustedEvaluations: number;
  readonly evaluationModelRef: string;
  readonly previousEvaluationModelRef?: string;
  readonly trustLowerBound: number;
  readonly hardBlockState: boolean;
  readonly graphVerdictState: GraphVerdictState;
}

export interface AssuranceSliceTrustDerivation {
  readonly trustState: Phase9AssuranceTrustState;
  readonly consecutiveTrustedEvaluations: number;
  readonly visibleDashboardPosture: BindingState;
  readonly operationsShellPosture: BindingState;
}

export function deriveAssuranceSliceTrustState(
  input: AssuranceSliceTrustDerivationInput,
): AssuranceSliceTrustDerivation {
  invariant(
    Number.isFinite(input.trustLowerBound) && input.trustLowerBound >= 0 && input.trustLowerBound <= 1,
    "TRUST_LOWER_BOUND_OUT_OF_RANGE",
    "trustLowerBound must be between 0 and 1.",
  );
  if (input.hardBlockState || input.graphVerdictState === "blocked" || input.trustLowerBound < 0.4) {
    return {
      trustState: "quarantined",
      consecutiveTrustedEvaluations: 0,
      visibleDashboardPosture: "blocked",
      operationsShellPosture: "blocked",
    };
  }
  if (input.graphVerdictState !== "complete") {
    return {
      trustState: "degraded",
      consecutiveTrustedEvaluations: 0,
      visibleDashboardPosture: "diagnostic_only",
      operationsShellPosture: "diagnostic_only",
    };
  }
  if (input.previousTrustState === "trusted" && input.trustLowerBound < 0.82) {
    return {
      trustState: "degraded",
      consecutiveTrustedEvaluations: 0,
      visibleDashboardPosture: "diagnostic_only",
      operationsShellPosture: "diagnostic_only",
    };
  }
  const sameModel =
    !input.previousEvaluationModelRef || input.previousEvaluationModelRef === input.evaluationModelRef;
  const consecutiveTrustedEvaluations =
    sameModel && input.trustLowerBound >= 0.88 ? input.consecutiveTrustedEvaluations + 1 : 0;
  if (consecutiveTrustedEvaluations >= 2) {
    return {
      trustState: "trusted",
      consecutiveTrustedEvaluations,
      visibleDashboardPosture: "live",
      operationsShellPosture: "live",
    };
  }
  return {
    trustState: input.previousTrustState === "trusted" ? "trusted" : "degraded",
    consecutiveTrustedEvaluations,
    visibleDashboardPosture: input.previousTrustState === "trusted" ? "live" : "diagnostic_only",
    operationsShellPosture: input.previousTrustState === "trusted" ? "live" : "diagnostic_only",
  };
}

export type SchemaCompatibilityState = "normalized" | "quarantined";

export interface SchemaCompatibilityResult {
  readonly state: SchemaCompatibilityState;
  readonly schemaVersionRef: string;
  readonly normalizationVersionRef: string;
  readonly quarantineReason?: string;
  readonly migrationApplied?: string;
}

const legacySchemaVersionMap: Record<string, string> = {
  "phase9.assurance-ledger-contracts.v0.9": PHASE9_ASSURANCE_CONTRACT_VERSION,
};

export function normalizeOrQuarantineAssuranceContractVersion(schemaVersionRef: string): SchemaCompatibilityResult {
  if (schemaVersionRef === PHASE9_ASSURANCE_CONTRACT_VERSION) {
    return {
      state: "normalized",
      schemaVersionRef,
      normalizationVersionRef: PHASE9_ASSURANCE_NORMALIZATION_VERSION,
    };
  }
  const migrated = legacySchemaVersionMap[schemaVersionRef];
  if (migrated) {
    return {
      state: "normalized",
      schemaVersionRef: migrated,
      normalizationVersionRef: PHASE9_ASSURANCE_NORMALIZATION_VERSION,
      migrationApplied: `${schemaVersionRef}->${migrated}`,
    };
  }
  return {
    state: "quarantined",
    schemaVersionRef,
    normalizationVersionRef: PHASE9_ASSURANCE_NORMALIZATION_VERSION,
    quarantineReason: "UNSUPPORTED_SCHEMA_VERSION",
  };
}

export type Phase9AssuranceContractObject =
  | AssuranceLedgerEntry
  | EvidenceArtifact
  | ControlObjective
  | ControlEvidenceLink
  | ProjectionHealthSnapshot
  | AttestationRecord
  | AssurancePack
  | AssuranceIngestCheckpoint
  | ControlStatusSnapshot
  | AssuranceSliceTrustRecord
  | ExperienceContinuityControlEvidence
  | AssuranceSurfaceRuntimeBinding
  | IdentityRepairEvidenceBundle
  | AssuranceEvidenceGraphSnapshot
  | AssuranceEvidenceGraphEdge
  | AssuranceGraphCompletenessVerdict;

export interface Phase9AssuranceContractFixture {
  readonly schemaVersion: typeof PHASE9_ASSURANCE_CONTRACT_VERSION;
  readonly phase8ExitPacketRef: string;
  readonly generatedAt: string;
  readonly contractNames: readonly Phase9AssuranceContractName[];
  readonly canonicalizationRule: JsonRecord;
  readonly ledgerEntries: readonly AssuranceLedgerEntry[];
  readonly graphEdges: readonly AssuranceEvidenceGraphEdge[];
  readonly graphSnapshot: AssuranceEvidenceGraphSnapshot;
  readonly graphCompletenessVerdict: AssuranceGraphCompletenessVerdict;
  readonly examples: Record<Phase9AssuranceContractName, Phase9AssuranceContractObject>;
  readonly contractSetHash: string;
}

function sampleHash(label: string): string {
  return hashAssurancePayload({ sample: label }, "phase9.assurance.fixture.sample");
}

function buildFixtureExamples(): Omit<
  Phase9AssuranceContractFixture,
  "canonicalizationRule" | "contractSetHash"
> {
  const now = "2026-04-27T09:00:00.000Z";
  const tenantId = "tenant:demo-gp";
  const graphSnapshotId = "aegs_432_demo";
  const graphVerdictId = "agcv_432_demo";
  const ledgerEntryId = "ale_432_demo_0001";
  const secondLedgerEntryId = "ale_432_demo_0002";
  const evidenceArtifactId = "ea_432_demo_control_artifact";
  const controlObjectiveId = "co_432_dtac_audit_001";
  const controlEvidenceLinkId = "cel_432_dtac_audit_001";
  const controlStatusSnapshotId = "css_432_dtac_audit_001";
  const continuityEvidenceId = "ecce_432_ops_overview";
  const retentionDecisionRef = "retention_decision:432:demo";
  const standardsVersionRef = "standards:dtac:2026-03";
  const packRef = "ap_432_dtac_april";
  const graphEdgeId = "aege_432_ledger_artifact";

  const ledgerEntry = buildAssuranceLedgerEntry({
    assuranceLedgerEntryId: ledgerEntryId,
    sourceEventRef: "event:assistive.rollout.verdict:432-demo",
    entryType: "event_ingest",
    tenantId,
    producerRef: "producer:assistive-control-plane",
    namespaceRef: "assistive.rollout.verdict",
    schemaVersionRef: PHASE9_ASSURANCE_CONTRACT_VERSION,
    normalizationVersionRef: PHASE9_ASSURANCE_NORMALIZATION_VERSION,
    sourceSequenceRef: "000000000001",
    sourceBoundedContextRef: "assistive_control_plane",
    governingBoundedContextRef: "release_control",
    requiredContextBoundaryRefs: ["release_control", "assistive_control_plane"],
    edgeCorrelationId: "edge-correlation:432:demo",
    continuityFrameRef: "continuity-frame:ops-overview",
    routeIntentRef: "route-intent:/ops/overview",
    commandActionRef: "command-action:release-freeze-check",
    commandSettlementRef: "command-settlement:release-freeze-check",
    uiEventRef: "ui-event:ops-overview-load",
    uiTransitionSettlementRef: "ui-transition:settled",
    projectionVisibilityRef: "visibility:operations",
    auditRecordRef: "audit:432:ledger-entry",
    telemetryDisclosureFenceRef: "telemetry-fence:ops",
    causalTokenRef: "causal-token:432:demo",
    replayDecisionClass: "original",
    effectKeyRef: "effect:release-freeze-check:432",
    controlRefs: [controlObjectiveId],
    evidenceRefs: [evidenceArtifactId],
    graphEdgeRefs: [graphEdgeId],
    previousHash: GENESIS_ASSURANCE_LEDGER_HASH,
    createdAt: now,
    canonicalPayload: {
      sourceEventRef: "event:assistive.rollout.verdict:432-demo",
      visiblePosture: "diagnostic_only",
      tenantId,
      occurredAt: now,
    },
  });

  const secondLedgerEntry = buildAssuranceLedgerEntry({
    assuranceLedgerEntryId: secondLedgerEntryId,
    sourceEventRef: "event:projection.health:432-demo",
    entryType: "projection_health",
    tenantId,
    producerRef: "producer:projection-worker",
    namespaceRef: "projection.health.snapshot",
    schemaVersionRef: PHASE9_ASSURANCE_CONTRACT_VERSION,
    normalizationVersionRef: PHASE9_ASSURANCE_NORMALIZATION_VERSION,
    sourceSequenceRef: "000000000002",
    sourceBoundedContextRef: "operations",
    governingBoundedContextRef: "analytics_assurance",
    requiredContextBoundaryRefs: ["analytics_assurance", "operations"],
    edgeCorrelationId: "edge-correlation:432:demo:projection",
    auditRecordRef: "audit:432:projection-health",
    causalTokenRef: "causal-token:432:demo:projection",
    replayDecisionClass: "exact_replay",
    effectKeyRef: "effect:projection-health:432",
    controlRefs: [controlObjectiveId],
    evidenceRefs: [evidenceArtifactId],
    graphEdgeRefs: [],
    previousHash: ledgerEntry.hash,
    createdAt: now,
    canonicalPayload: {
      sourceEventRef: "event:projection.health:432-demo",
      lagMs: 1200,
      tenantId,
      occurredAt: now,
    },
  });

  const evidenceArtifact: EvidenceArtifact = {
    evidenceArtifactId,
    artifactType: "projection_snapshot",
    sourceRef: "projection:operations.control-health",
    sourceVersion: "projection.operations.control-health.v1",
    sourceSnapshotRef: "projection-snapshot:ops-health:432",
    sourceCaptureBundleRef: "capture-bundle:ops-health:432",
    sourceDerivationPackageRefs: ["derivation:ops-health:summary-parity"],
    sourceSummaryParityRef: "summary-parity:ops-health:432",
    producedByEntryRef: ledgerEntry.assuranceLedgerEntryId,
    canonicalScopeRef: tenantId,
    artifactRole: "derived",
    integrityHash: sampleHash("evidence.integrity"),
    canonicalArtifactHash: sampleHash("evidence.canonical"),
    artifactManifestHash: sampleHash("evidence.manifest"),
    derivedFromArtifactRefs: [],
    redactionTransformHash: sampleHash("evidence.redaction-transform"),
    retentionClassRef: "retention:governance-assurance:8y",
    visibilityScope: "governance",
    createdAt: now,
  };

  const controlObjective: ControlObjective = {
    controlObjectiveId,
    frameworkCode: "DTAC",
    controlCode: "DTAC-AUDIT-LEDGER-001",
    versionRef: "standards:dtac:2026-03",
    ownerRole: "governance_admin",
    status: "active",
    evidenceRequirementSet: [
      {
        requirementRef: "req:ledger-continuity",
        weight: 1,
        mandatory: true,
      },
    ],
    freshnessPolicyRef: "freshness:assurance-ledger:24h",
    validationPolicyRef: "validation:graph-complete-required",
  };

  const graphEdges = [
    buildAssuranceEvidenceGraphEdge({
      assuranceEvidenceGraphEdgeId: graphEdgeId,
      graphSnapshotRef: graphSnapshotId,
      fromRef: ledgerEntry.assuranceLedgerEntryId,
      toRef: evidenceArtifact.evidenceArtifactId,
      edgeType: "ledger_produces_artifact",
      scopeState: "in_scope",
      supersessionState: "live",
      createdAt: now,
    }),
    buildAssuranceEvidenceGraphEdge({
      assuranceEvidenceGraphEdgeId: "aege_432_artifact_control",
      graphSnapshotRef: graphSnapshotId,
      fromRef: evidenceArtifact.evidenceArtifactId,
      toRef: controlObjective.controlObjectiveId,
      edgeType: "artifact_satisfies_control",
      scopeState: "in_scope",
      supersessionState: "live",
      createdAt: now,
    }),
    buildAssuranceEvidenceGraphEdge({
      assuranceEvidenceGraphEdgeId: "aege_432_control_status",
      graphSnapshotRef: graphSnapshotId,
      fromRef: controlObjective.controlObjectiveId,
      toRef: controlStatusSnapshotId,
      edgeType: "control_materializes_status",
      scopeState: "in_scope",
      supersessionState: "live",
      createdAt: now,
    }),
    buildAssuranceEvidenceGraphEdge({
      assuranceEvidenceGraphEdgeId: "aege_432_artifact_continuity",
      graphSnapshotRef: graphSnapshotId,
      fromRef: evidenceArtifact.evidenceArtifactId,
      toRef: continuityEvidenceId,
      edgeType: "artifact_supports_continuity",
      scopeState: "in_scope",
      supersessionState: "live",
      createdAt: now,
    }),
    buildAssuranceEvidenceGraphEdge({
      assuranceEvidenceGraphEdgeId: "aege_432_continuity_pack",
      graphSnapshotRef: graphSnapshotId,
      fromRef: continuityEvidenceId,
      toRef: packRef,
      edgeType: "continuity_section_supports_pack",
      scopeState: "in_scope",
      supersessionState: "live",
      createdAt: now,
    }),
    buildAssuranceEvidenceGraphEdge({
      assuranceEvidenceGraphEdgeId: "aege_432_standards_control",
      graphSnapshotRef: graphSnapshotId,
      fromRef: standardsVersionRef,
      toRef: controlObjective.controlObjectiveId,
      edgeType: "standards_version_governs_control",
      scopeState: "in_scope",
      supersessionState: "live",
      createdAt: now,
    }),
    buildAssuranceEvidenceGraphEdge({
      assuranceEvidenceGraphEdgeId: "aege_432_retention_artifact",
      graphSnapshotRef: graphSnapshotId,
      fromRef: retentionDecisionRef,
      toRef: evidenceArtifact.evidenceArtifactId,
      edgeType: "retention_preserves_artifact",
      scopeState: "in_scope",
      supersessionState: "live",
      createdAt: now,
    }),
  ] as const;

  const graphSnapshot = buildAssuranceEvidenceGraphSnapshot(
    {
      assuranceEvidenceGraphSnapshotId: graphSnapshotId,
      tenantScopeRef: tenantId,
      standardsVersionMapRefs: [standardsVersionRef],
      ledgerEntryRefs: [ledgerEntry.assuranceLedgerEntryId, secondLedgerEntry.assuranceLedgerEntryId],
      evidenceArtifactRefs: [evidenceArtifact.evidenceArtifactId],
      controlObjectiveRefs: [controlObjective.controlObjectiveId],
      controlEvidenceLinkRefs: [controlEvidenceLinkId],
      controlStatusSnapshotRefs: [controlStatusSnapshotId],
      controlRecordRefs: ["assurance-control-record:432:demo"],
      evidenceGapRecordRefs: [],
      continuityEvidenceRefs: [continuityEvidenceId],
      continuityEvidencePackSectionRefs: ["continuity-pack-section:432:ops-overview"],
      incidentRefs: [],
      exceptionRefs: [],
      capaActionRefs: [],
      retentionDecisionRefs: [retentionDecisionRef],
      archiveManifestRefs: [],
      deletionCertificateRefs: [],
      packRefs: [packRef],
      assurancePackActionRecordRefs: ["assurance-pack-action:432:publish"],
      assurancePackSettlementRefs: ["assurance-pack-settlement:432:published"],
      recoveryEvidenceArtifactRefs: [],
      snapshotState: "complete",
      generatedAt: now,
    },
    graphEdges,
  );

  const graphCompletenessVerdict = evaluateAssuranceGraphCompletenessVerdict({
    assuranceGraphCompletenessVerdictId: graphVerdictId,
    snapshot: graphSnapshot,
    edges: graphEdges,
    scopeRef: tenantId,
    requiredNodeRefs: [
      standardsVersionRef,
      ledgerEntry.assuranceLedgerEntryId,
      evidenceArtifact.evidenceArtifactId,
      controlObjective.controlObjectiveId,
      controlStatusSnapshotId,
      continuityEvidenceId,
      packRef,
      retentionDecisionRef,
    ],
    requiredPackRefs: [packRef],
    requiredRetentionRefs: [retentionDecisionRef],
    evaluatedAt: now,
  });

  const controlEvidenceLink: ControlEvidenceLink = {
    linkId: controlEvidenceLinkId,
    controlObjectiveId,
    requirementRef: "req:ledger-continuity",
    requirementWeight: 1,
    evidenceArtifactId,
    linkType: "mandatory",
    validFrom: now,
    validationState: "validated",
    validationBasisRef: "validation:graph-complete-required",
    freshnessState: "current",
    lineagePathHash: sampleHash("lineage.path"),
    evidenceSetHash: graphSnapshot.evidenceSetHash,
    assuranceEvidenceGraphSnapshotRef: graphSnapshot.assuranceEvidenceGraphSnapshotId,
    assuranceEvidenceGraphEdgeRef: graphEdgeId,
    linkConfidence: 0.99,
  };

  const projectionHealthSnapshot: ProjectionHealthSnapshot = {
    projectionHealthSnapshotId: "phs_432_ops_control_health",
    projectionCode: "ops.control-health",
    lagMs: 1200,
    stalenessState: "fresh",
    rebuildState: "rebuilt",
    trustState: "trusted",
    completenessState: "complete",
    expectedInputRefs: [ledgerEntry.assuranceLedgerEntryId, secondLedgerEntry.assuranceLedgerEntryId],
    observedInputRefs: [ledgerEntry.assuranceLedgerEntryId, secondLedgerEntry.assuranceLedgerEntryId],
    coverageScore: 1,
    replayMatchScore: 1,
    determinismState: "deterministic",
    snapshotHash: sampleHash("projection.snapshot"),
    rebuildHash: sampleHash("projection.snapshot"),
    integrityScore: 0.98,
    affectedAudienceRefs: ["operations", "governance"],
    capturedAt: now,
  };

  const attestationRecord: AttestationRecord = {
    attestationId: "att_432_dtac_audit",
    controlObjectiveId,
    attestedBy: "governance-admin:demo",
    attestedAt: now,
    attestationScope: tenantId,
    status: "attested",
    commentRef: "comment:attestation:432",
  };

  const assurancePack: AssurancePack = {
    assurancePackId: packRef,
    packType: "dtac",
    periodStart: "2026-04-01T00:00:00.000Z",
    periodEnd: "2026-04-30T23:59:59.000Z",
    tenantScope: tenantId,
    state: "published",
    artifactRefs: [evidenceArtifactId],
    signoffRefs: [attestationRecord.attestationId],
    assuranceEvidenceGraphSnapshotRef: graphSnapshot.assuranceEvidenceGraphSnapshotId,
    assuranceGraphCompletenessVerdictRef: graphCompletenessVerdict.assuranceGraphCompletenessVerdictId,
    graphHash: graphSnapshot.graphHash,
  };

  const assuranceIngestCheckpoint: AssuranceIngestCheckpoint = {
    assuranceIngestCheckpointId: "aic_432_assistive_rollout",
    producerRef: ledgerEntry.producerRef,
    namespaceRef: ledgerEntry.namespaceRef,
    schemaVersionRef: ledgerEntry.schemaVersionRef,
    lastAcceptedSequenceRef: secondLedgerEntry.sourceSequenceRef,
    lastAcceptedEventRef: secondLedgerEntry.sourceEventRef,
    lastAcceptedHash: secondLedgerEntry.hash,
    quarantineState: "clear",
    updatedAt: now,
  };

  const controlStatusSnapshot: ControlStatusSnapshot = {
    controlStatusSnapshotId,
    controlObjectiveId,
    tenantId,
    state: "satisfied",
    coverageState: "satisfied",
    freshnessState: "current",
    latestEvidenceRef: evidenceArtifactId,
    latestValidatedAt: now,
    coverageScore: 1,
    coverageLowerBound: 0.94,
    lineageScore: 0.98,
    reproducibilityScore: 1,
    decisionHash: sampleHash("control.status.decision"),
    evidenceSetHash: graphSnapshot.evidenceSetHash,
    assuranceEvidenceGraphSnapshotRef: graphSnapshot.assuranceEvidenceGraphSnapshotId,
    assuranceGraphCompletenessVerdictRef: graphCompletenessVerdict.assuranceGraphCompletenessVerdictId,
    graphHash: graphSnapshot.graphHash,
    gapReasonRefs: [],
    generatedAt: now,
  };

  const assuranceSliceTrustRecord: AssuranceSliceTrustRecord = {
    assuranceSliceTrustRecordId: "astr_432_ops_overview",
    sliceRef: "slice:/ops/overview",
    scopeRef: tenantId,
    audienceTier: "operations",
    trustState: "trusted",
    completenessState: "complete",
    trustScore: 0.96,
    trustLowerBound: 0.9,
    freshnessScore: 0.97,
    coverageScore: 0.95,
    lineageScore: 0.98,
    replayScore: 1,
    consistencyScore: 0.96,
    hardBlockState: false,
    blockingProducerRefs: [],
    blockingNamespaceRefs: [],
    evaluationModelRef: PHASE9_ASSURANCE_TRUST_EVALUATION_MODEL,
    evaluationInputHash: sampleHash("trust.evaluation.input"),
    lastEvaluatedAt: now,
  };

  const experienceContinuityControlEvidence: ExperienceContinuityControlEvidence = {
    continuityControlEvidenceId: continuityEvidenceId,
    controlCode: "ops_overview_continuity",
    producerFamilyRef: "operations-shell",
    audienceTier: "operations",
    audienceSurfaceRef: "/ops/overview",
    routeFamilyRef: "ops.overview",
    routeContinuityEvidenceContractRef: "route-continuity:ops-overview:v1",
    canonicalObjectDescriptorRef: "canonical-object:operations-control-health",
    governingObjectRef: "projection:ops.control-health",
    governingObjectVersionRef: "projection.operations.control-health.v1",
    shellContinuityKey: "shell:/ops",
    entityContinuityKey: "tenant:demo-gp:/ops/overview",
    selectedAnchorRef: "anchor:ops-overview:control-health",
    selectedAnchorTupleHashRef: sampleHash("selected.anchor.tuple"),
    surfacePublicationRef: "surface-publication:/ops/overview:432",
    runtimePublicationBundleRef: "runtime-publication:ops:432",
    releasePublicationParityRef: "release-publication-parity:432",
    sourceProjectionRef: projectionHealthSnapshot.projectionHealthSnapshotId,
    sourceSettlementRef: "settlement:ops-overview:432",
    sourceContinuationRef: "continuation:ops-overview:432",
    evidenceArtifactRefs: [evidenceArtifactId],
    validationState: "validated",
    validationBasisHash: sampleHash("continuity.validation.basis"),
    continuityTupleHash: sampleHash("continuity.tuple"),
    continuitySetHash: graphSnapshot.continuitySetHash,
    reproductionHash: sampleHash("continuity.reproduction"),
    lastValidatedAt: now,
  };

  const assuranceSurfaceRuntimeBinding: AssuranceSurfaceRuntimeBinding = {
    assuranceSurfaceRuntimeBindingId: "asrb_432_ops_overview",
    audienceSurface: "/ops/overview",
    routeFamilyRef: "ops.overview",
    audienceSurfaceRuntimeBindingRef: "audience-surface-runtime-binding:ops-overview:v1",
    surfaceRouteContractRef: "surface-route-contract:ops-overview:v1",
    surfacePublicationRef: "surface-publication:/ops/overview:432",
    runtimePublicationBundleRef: "runtime-publication:ops:432",
    releasePublicationParityRef: "release-publication-parity:432",
    requiredTrustRefs: [assuranceSliceTrustRecord.assuranceSliceTrustRecordId],
    requiredChannelFreezeRefs: ["channel-freeze:ops:clear"],
    releaseTrustFreezeVerdictRef: "release-trust-freeze-verdict:432",
    releaseRecoveryDispositionRef: "release-recovery-disposition:diagnostic-only",
    bindingState: "live",
    validatedAt: now,
  };

  const identityRepairEvidenceBundle: IdentityRepairEvidenceBundle = {
    identityRepairEvidenceBundleId: "ireb_432_identity_repair",
    identityRepairCaseRef: "identity-repair-case:432",
    repairSignalRefs: ["identity-repair-signal:pds-mismatch"],
    freezeRecordRef: "identity-repair-freeze:432",
    downstreamDispositionRefs: ["identity-repair-disposition:affected-branches-quarantined"],
    resultingIdentityBindingRef: "identity-binding:corrected:432",
    releaseSettlementRef: "identity-repair-release-settlement:432",
    artifactRefs: [evidenceArtifactId],
    bundleHash: sampleHash("identity.repair.bundle"),
    createdAt: now,
  };

  const examples = {
    AssuranceLedgerEntry: ledgerEntry,
    EvidenceArtifact: evidenceArtifact,
    ControlObjective: controlObjective,
    ControlEvidenceLink: controlEvidenceLink,
    ProjectionHealthSnapshot: projectionHealthSnapshot,
    AttestationRecord: attestationRecord,
    AssurancePack: assurancePack,
    AssuranceIngestCheckpoint: assuranceIngestCheckpoint,
    ControlStatusSnapshot: controlStatusSnapshot,
    AssuranceSliceTrustRecord: assuranceSliceTrustRecord,
    ExperienceContinuityControlEvidence: experienceContinuityControlEvidence,
    AssuranceSurfaceRuntimeBinding: assuranceSurfaceRuntimeBinding,
    IdentityRepairEvidenceBundle: identityRepairEvidenceBundle,
    AssuranceEvidenceGraphSnapshot: graphSnapshot,
    AssuranceEvidenceGraphEdge: graphEdges[0],
    AssuranceGraphCompletenessVerdict: graphCompletenessVerdict,
  } satisfies Record<Phase9AssuranceContractName, Phase9AssuranceContractObject>;

  return {
    schemaVersion: PHASE9_ASSURANCE_CONTRACT_VERSION,
    phase8ExitPacketRef: "data/contracts/431_phase8_exit_packet.json",
    generatedAt: now,
    contractNames: REQUIRED_PHASE9_ASSURANCE_CONTRACTS,
    ledgerEntries: [ledgerEntry, secondLedgerEntry],
    graphEdges,
    graphSnapshot,
    graphCompletenessVerdict,
    examples,
  };
}

export function createPhase9AssuranceContractFixture(): Phase9AssuranceContractFixture {
  const fixtureCore = buildFixtureExamples();
  const canonicalizationRule: JsonRecord = {
    ruleName: "JCS-equivalent SHA-256",
    fieldOrdering: "object keys sorted lexicographically by Unicode code point",
    nullHandling: "null is preserved; undefined is rejected before hashing",
    arrayOrdering: "arrays preserve source order; set-like ref collections use orderedSetHash over sorted element hashes",
    timestampNormalization: "ISO-8601 timestamps normalize to UTC milliseconds with Date.toISOString()",
    numericPrecision: "finite JSON numbers only; integers must be JavaScript safe integers",
    hashAlgorithm: "SHA-256 hex",
    hashNamespacePrefix: "phase9.assurance.*",
    inputSetHashConstruction: "Merkle root over lexicographically sorted element hashes",
    graphHashConstruction: "Merkle root over lexicographically sorted AssuranceEvidenceGraphEdge.edgeHash values",
    previousHashContinuity: "first ledger entry uses GENESIS_ASSURANCE_LEDGER_HASH; each next entry.previousHash equals prior entry.hash",
  };
  const contractSetHash = orderedSetHash(
    phase9AssuranceContractDefinitions.map((definition) => ({
      contractName: definition.contractName,
      fieldNames: definition.fieldNames,
      requiredFields: definition.requiredFields,
      enumValues: definition.enumValues,
      canonicalHashInputs: definition.canonicalHashInputs,
    })),
    "phase9.assurance.contractSet",
  );
  return {
    ...fixtureCore,
    canonicalizationRule,
    contractSetHash,
  };
}

export function phase9AssuranceContractMatrixToCsv(
  definitions: readonly Phase9AssuranceContractDefinition[] = phase9AssuranceContractDefinitions,
): string {
  const rows = [
    [
      "contractName",
      "requiredFieldCount",
      "optionalFieldCount",
      "identityKeys",
      "idempotencyKeys",
      "hashInputCount",
      "piiPhiClassification",
      "retentionClassRef",
    ],
    ...definitions.map((definition) => [
      definition.contractName,
      String(definition.requiredFields.length),
      String(definition.optionalFields.length),
      definition.identityKeys.join("|"),
      definition.idempotencyKeys.join("|"),
      String(definition.canonicalHashInputs.length),
      definition.piiPhiClassification,
      definition.retentionClassRef,
    ]),
  ];
  return `${rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replaceAll('"', '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n")}\n`;
}

export function summarizePhase9AssuranceContractFreeze(
  fixture: Phase9AssuranceContractFixture = createPhase9AssuranceContractFixture(),
): string {
  return [
    "# 432 Phase 9 Assurance Ledger Contract Freeze",
    "",
    `Schema version: ${fixture.schemaVersion}`,
    `Phase 8 exit packet: ${fixture.phase8ExitPacketRef}`,
    `Contract count: ${fixture.contractNames.length}`,
    `Contract set hash: ${fixture.contractSetHash}`,
    `Graph snapshot: ${fixture.graphSnapshot.assuranceEvidenceGraphSnapshotId}`,
    `Graph hash: ${fixture.graphSnapshot.graphHash}`,
    `Completeness verdict: ${fixture.graphCompletenessVerdict.verdictState}`,
    "",
    "## Frozen Contracts",
    "",
    ...fixture.contractNames.map((contractName) => `- ${contractName}`),
    "",
    "## Fail-Closed Gates",
    "",
    "- Pack export, support replay, retention disposition, deletion/archive, recovery proof, and authoritative dashboards require a complete graph snapshot and completeness verdict.",
    "- Slice trust uses lower-bound scores with Phase 9 hysteresis: enter trusted at >= 0.88 for two same-model evaluations, leave trusted below 0.82, quarantine on hard block or below 0.40.",
    "- Evidence artifacts preserve capture bundle, derivation package, summary parity, redaction transform, retention class, and visibility scope.",
    "- Consumers may not keep local evidence lists when an AssuranceEvidenceGraphSnapshot is available.",
    "",
  ].join("\n");
}

export function phase9AssuranceAlgorithmAlignmentNotes(): string {
  return [
    "# 432 Phase 9 Assurance Algorithm Alignment Notes",
    "",
    "- Source algorithm: `blueprint/phase-9-the-assurance-ledger.md#9A`.",
    "- Canonicalization rule: SHA-256 over JCS-equivalent canonical JSON with sorted object keys, UTC timestamp normalization, finite numbers, and explicit set hashing.",
    "- Ledger invariant: producer provenance, namespace, schema version, normalization version, source sequence, bounded-context ownership, replay decision class, effect key, and previous hash continuity are required.",
    "- Evidence graph invariant: graph edges are typed, scoped, supersession-aware, and hash-stable; complete snapshots are immutable.",
    "- Completeness invariant: graph verdicts are evaluated before pack export, replay, retention, deletion/archive, recovery proof, or authoritative dashboard display.",
    "- Trust invariant: lower-bound slice trust, hard-block provenance, and graph verdict state govern visible dashboards and operations shell posture.",
    "- Compatibility invariant: unsupported schema versions quarantine before ledger append; supported legacy versions normalize through the pinned normalization version.",
    "",
  ].join("\n");
}
