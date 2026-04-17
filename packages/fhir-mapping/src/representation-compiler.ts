import { createHash } from "node:crypto";

export type CanonicalFhirResourceType =
  | "Task"
  | "ServiceRequest"
  | "DocumentReference"
  | "Communication"
  | "Consent"
  | "AuditEvent"
  | "Provenance"
  | "Bundle";

export type FhirRepresentationPurpose =
  | "clinical_persistence"
  | "external_interchange"
  | "partner_callback_correlation"
  | "audit_companion";

export type FhirRepresentationState = "staged" | "emitted" | "superseded" | "invalidated";
export type FhirMaterializationState = "staged" | "written" | "superseded" | "invalidated";
export type FhirExchangeState =
  | "staged"
  | "dispatched"
  | "accepted"
  | "replayed"
  | "failed"
  | "superseded";
export type FhirStorageDisposition =
  | "clinical_store"
  | "interchange_only"
  | "callback_cache"
  | "derived_view";
export type FhirBundleDirection = "outbound" | "inbound";
export type FhirBundleType =
  | "transaction"
  | "message"
  | "document"
  | "collection"
  | "searchset"
  | "history"
  | "batch";

export interface FhirResourceProfile {
  resourceType: CanonicalFhirResourceType;
  profileCanonicalUrl: string;
}

export interface FhirRepresentationContractSnapshot {
  fhirRepresentationContractId: string;
  owningBoundedContextRef: string;
  governingAggregateType: string;
  representationPurpose: FhirRepresentationPurpose;
  triggerMilestoneTypes: readonly string[];
  requiredEvidenceRefs: readonly string[];
  allowedResourceTypes: readonly CanonicalFhirResourceType[];
  requiredProfileCanonicalUrls: readonly string[];
  identifierPolicyRef: string;
  statusMappingPolicyRef: string;
  cardinalityPolicyRef: string;
  redactionPolicyRef: string;
  companionArtifactPolicyRef: string;
  replayPolicyRef: string;
  supersessionPolicyRef: string;
  callbackCorrelationPolicyRef: string;
  declaredBundlePolicyRefs: readonly string[];
  contractVersionRef: string;
  contractState: "draft" | "active" | "superseded" | "withdrawn";
  publishedAt: string | null;
  resourceProfiles: readonly FhirResourceProfile[];
  defectState: string;
  source_refs: readonly string[];
  rationale: string;
}

export interface FhirExchangeBundlePolicy {
  policyId: string;
  representationContractRefs: readonly string[];
  direction: FhirBundleDirection;
  legalBundleTypes: readonly FhirBundleType[];
  adapterProfileRefs: readonly string[];
  boundDependencyRefs: readonly string[];
  correlationKeyFields: readonly string[];
  receiptCheckpointRefs: readonly string[];
  authoritativeSuccess: string;
  supersessionBehavior: string;
  invalidationBehavior: string;
  mandatoryProofRefs: readonly string[];
  exchangeStates: readonly FhirExchangeState[];
  source_refs: readonly string[];
}

export interface FhirIdentifierPolicy {
  policyId: string;
  label: string;
  description: string;
  stableInputs: readonly string[];
  versionRule: string;
}

export interface FhirStatusMappingPolicy {
  policyId: string;
  label: string;
  resourceType: CanonicalFhirResourceType;
  mappings: Record<string, string>;
}

export interface FhirRepresentationSetSnapshot {
  fhirRepresentationSetId: string;
  representationContractRef: string;
  governingAggregateType: string;
  governingAggregateRef: string;
  governingAggregateVersionRef: string;
  governingLineageRef: string;
  evidenceSnapshotRef: string | null;
  representationPurpose: FhirRepresentationPurpose;
  resourceRecordRefs: readonly string[];
  bundleArtifactRef: string | null;
  setHash: string;
  causalToken: string;
  monotoneRevision: number;
  representationState: FhirRepresentationState;
  supersedesRepresentationSetRef: string | null;
  supersededByRepresentationSetRef: string | null;
  invalidationReasonRef: string | null;
  generatedAt: string;
  recordVersion: number;
  persistenceSchemaVersion: 1;
}

export interface FhirResourceRecordSnapshot {
  fhirResourceRecordId: string;
  representationSetRef: string;
  resourceType: CanonicalFhirResourceType;
  profileCanonicalUrl: string;
  logicalId: string;
  versionId: string;
  subjectRef: string | null;
  payloadArtifactRef: string;
  payloadHash: string;
  sourceAggregateRefs: readonly string[];
  identifierSetHash: string;
  provenanceAuditJoinRef: string | null;
  storageDisposition: FhirStorageDisposition;
  materializationState: FhirMaterializationState;
  supersededByRepresentationSetRef: string | null;
  invalidationReasonRef: string | null;
  writtenAt: string;
  recordVersion: number;
  persistenceSchemaVersion: 1;
  payload: Record<string, unknown>;
}

export interface FhirExchangeBundleSnapshot {
  fhirExchangeBundleId: string;
  representationSetRef: string;
  adapterContractProfileRef: string;
  direction: FhirBundleDirection;
  bundleType: FhirBundleType;
  transportPayloadRef: string;
  transportPayloadHash: string;
  targetPartnerRef: string | null;
  correlationKey: string;
  receiptCheckpointRef: string | null;
  exchangeState: FhirExchangeState;
  createdAt: string;
  closedAt: string | null;
  bundlePolicyRef: string;
  supersededByBundleRef: string | null;
  invalidationReasonRef: string | null;
  recordVersion: number;
  persistenceSchemaVersion: 1;
  bundlePayload: Record<string, unknown>;
}

export interface FhirAggregateMaterializationInput {
  governingAggregateType: string;
  aggregateRef: string;
  aggregateVersionRef: string;
  lineageRef: string;
  aggregateState?: string | null;
  subjectRef?: string | null;
  evidenceSnapshotRef?: string | null;
  authoritativeSettlementRef?: string | null;
  provenanceAuditJoinRef?: string | null;
  payload: Record<string, unknown>;
  sourceAggregateRefs?: readonly string[];
  availableEvidenceRefs?: readonly string[];
}

export interface MaterializeFhirRepresentationInput {
  representationContractRef: string;
  aggregate: FhirAggregateMaterializationInput;
  generatedAt: string;
  bundlePolicyRef?: string;
  adapterContractProfileRef?: string;
  bundleDirection?: FhirBundleDirection;
  targetPartnerRef?: string | null;
  receiptCheckpointRef?: string | null;
  correlationSeed?: string | null;
}

export interface AdapterConsumptionAuthorizationInput {
  allowedFhirRepresentationContractRefs: readonly string[];
  allowedFhirExchangeBundleTypes: readonly FhirBundleType[];
  representationContract: FhirRepresentationContractSnapshot;
  exchangeBundle: FhirExchangeBundleSnapshot;
}

export interface FhirMaterializationResult {
  representationSet: FhirRepresentationSetRecord;
  resourceRecords: readonly FhirResourceRecord[];
  exchangeBundle: FhirExchangeBundleRecord | null;
  replayed: boolean;
}

export interface FhirCompilerDependencies {
  getRepresentationContract(
    contractId: string,
  ): Promise<FhirRepresentationContractSnapshot | undefined>;
  getBundlePolicy(policyId: string): Promise<FhirExchangeBundlePolicy | undefined>;
  getIdentifierPolicy(policyId: string): Promise<FhirIdentifierPolicy | undefined>;
  getStatusMappingPolicy(policyId: string): Promise<FhirStatusMappingPolicy | undefined>;
  getRepresentationSet(
    representationSetId: string,
  ): Promise<FhirRepresentationSetRecord | undefined>;
  saveRepresentationSet(record: FhirRepresentationSetRecord): Promise<void>;
  saveResourceRecord(record: FhirResourceRecord): Promise<void>;
  saveExchangeBundle(record: FhirExchangeBundleRecord): Promise<void>;
  getRepresentationSetByDeterministicKey(
    replayKey: string,
  ): Promise<FhirRepresentationSetRecord | undefined>;
  getCurrentRepresentationSetForContractAggregate(
    representationContractRef: string,
    aggregateRef: string,
  ): Promise<FhirRepresentationSetRecord | undefined>;
  listCurrentResourceRecordsForSet(
    representationSetRef: string,
  ): Promise<readonly FhirResourceRecord[]>;
  getCurrentExchangeBundleForSet(
    representationSetRef: string,
  ): Promise<FhirExchangeBundleRecord | undefined>;
  setReplayKey(replayKey: string, representationSetId: string): Promise<void>;
  setCurrentRepresentationSetIndex(
    representationContractRef: string,
    aggregateRef: string,
    representationSetId: string,
  ): Promise<void>;
}

export class FhirMappingInvariantError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "FhirMappingInvariantError";
    this.code = code;
  }
}

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new FhirMappingInvariantError(code, message);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function stableNormalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => stableNormalize(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableNormalize(entry)]),
    );
  }
  return value;
}

function stableDigest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableNormalize(value)))
    .digest("hex");
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function takeDigest(value: unknown, length = 16): string {
  return stableDigest(value).slice(0, length);
}

function deterministicResourceId(input: {
  contractRef: string;
  aggregateRef: string;
  aggregateVersionRef: string;
  resourceType: CanonicalFhirResourceType;
  profileCanonicalUrl: string;
  identifierPolicyRef: string;
}): string {
  const fingerprint = takeDigest(input, 24);
  return `${input.resourceType.toLowerCase()}_${fingerprint}`;
}

function deterministicVersionId(input: {
  logicalId: string;
  aggregateVersionRef: string;
  monotoneRevision: number;
  statusMappingPolicyRef: string;
}): string {
  return `v${input.monotoneRevision}_${takeDigest(input, 12)}`;
}

function deterministicRepresentationSetId(input: {
  representationContractRef: string;
  aggregateRef: string;
  aggregateVersionRef: string;
  evidenceSnapshotRef: string | null;
}): string {
  return `frset_${takeDigest(input, 24)}`;
}

function deterministicResourceRecordId(input: {
  representationSetRef: string;
  logicalId: string;
  profileCanonicalUrl: string;
}): string {
  return `frrec_${takeDigest(input, 24)}`;
}

function deterministicBundleId(input: {
  representationSetRef: string;
  bundlePolicyRef: string;
  adapterContractProfileRef: string;
  direction: FhirBundleDirection;
}): string {
  return `fxbundle_${takeDigest(input, 24)}`;
}

function contractAggregateKey(contractRef: string, aggregateRef: string): string {
  return `${contractRef}::${aggregateRef}`;
}

function replayKeyFromMaterialization(
  contractRef: string,
  aggregate: FhirAggregateMaterializationInput,
): string {
  return `${contractRef}::${aggregate.aggregateRef}::${aggregate.aggregateVersionRef}::${aggregate.evidenceSnapshotRef ?? "no_snapshot"}`;
}

function defaultStorageDisposition(purpose: FhirRepresentationPurpose): FhirStorageDisposition {
  switch (purpose) {
    case "clinical_persistence":
      return "clinical_store";
    case "external_interchange":
      return "interchange_only";
    case "partner_callback_correlation":
      return "callback_cache";
    case "audit_companion":
      return "derived_view";
  }
}

function defaultBundleType(bundlePolicy: FhirExchangeBundlePolicy): FhirBundleType {
  invariant(
    bundlePolicy.legalBundleTypes.length > 0,
    "BUNDLE_POLICY_HAS_NO_TYPES",
    `Bundle policy ${bundlePolicy.policyId} must declare at least one legal bundle type.`,
  );
  return bundlePolicy.legalBundleTypes[0]!;
}

function profileUrlLooksCanonical(profileCanonicalUrl: string): boolean {
  return /^https:\/\/[^/]+\/fhir\/StructureDefinition\/[A-Za-z0-9._-]+$/.test(profileCanonicalUrl);
}

function allowedResourceTypeSet(): ReadonlySet<CanonicalFhirResourceType> {
  return new Set<CanonicalFhirResourceType>([
    "Task",
    "ServiceRequest",
    "DocumentReference",
    "Communication",
    "Consent",
    "AuditEvent",
    "Provenance",
    "Bundle",
  ]);
}

function allowedBundleTypeSet(): ReadonlySet<FhirBundleType> {
  return new Set<FhirBundleType>([
    "transaction",
    "message",
    "document",
    "collection",
    "searchset",
    "history",
    "batch",
  ]);
}

export class FhirRepresentationContractRecord {
  private readonly snapshot: FhirRepresentationContractSnapshot;

  private constructor(snapshot: FhirRepresentationContractSnapshot) {
    this.snapshot = FhirRepresentationContractRecord.normalize(snapshot);
  }

  static publish(snapshot: FhirRepresentationContractSnapshot): FhirRepresentationContractRecord {
    return new FhirRepresentationContractRecord(snapshot);
  }

  private static normalize(
    snapshot: FhirRepresentationContractSnapshot,
  ): FhirRepresentationContractSnapshot {
    invariant(
      snapshot.contractState === "active",
      "FHIR_CONTRACT_NOT_PUBLISHED",
      `FHIR representation contract ${snapshot.fhirRepresentationContractId} must be active before runtime publication.`,
    );
    invariant(
      typeof snapshot.publishedAt === "string" && snapshot.publishedAt.length > 0,
      "FHIR_CONTRACT_MISSING_PUBLISHED_AT",
      `FHIR representation contract ${snapshot.fhirRepresentationContractId} must carry publishedAt.`,
    );
    const allowedTypes = allowedResourceTypeSet();
    for (const resourceType of snapshot.allowedResourceTypes) {
      invariant(
        allowedTypes.has(resourceType),
        "UNSUPPORTED_RESOURCE_TYPE",
        `FHIR representation contract ${snapshot.fhirRepresentationContractId} declares unsupported resource type ${resourceType}.`,
      );
    }

    const profileUrls = new Set<string>();
    const resourceTypes = new Set<CanonicalFhirResourceType>();
    for (const profile of snapshot.resourceProfiles) {
      invariant(
        snapshot.allowedResourceTypes.includes(profile.resourceType),
        "RESOURCE_PROFILE_NOT_ALLOWED",
        `FHIR representation contract ${snapshot.fhirRepresentationContractId} has profile for disallowed resource type ${profile.resourceType}.`,
      );
      invariant(
        profileUrlLooksCanonical(profile.profileCanonicalUrl),
        "PROFILE_CANONICAL_URL_INVALID",
        `FHIR representation contract ${snapshot.fhirRepresentationContractId} has invalid profile URL ${profile.profileCanonicalUrl}.`,
      );
      invariant(
        !profileUrls.has(profile.profileCanonicalUrl),
        "DUPLICATE_PROFILE_URL",
        `FHIR representation contract ${snapshot.fhirRepresentationContractId} duplicates profile ${profile.profileCanonicalUrl}.`,
      );
      invariant(
        !resourceTypes.has(profile.resourceType),
        "DUPLICATE_RESOURCE_TYPE_PROFILE",
        `FHIR representation contract ${snapshot.fhirRepresentationContractId} duplicates resource profile ${profile.resourceType}.`,
      );
      profileUrls.add(profile.profileCanonicalUrl);
      resourceTypes.add(profile.resourceType);
    }

    const requiredProfiles = uniqueSortedRefs(snapshot.requiredProfileCanonicalUrls);
    invariant(
      JSON.stringify([...profileUrls].sort()) === JSON.stringify(requiredProfiles),
      "PROFILE_REQUIREMENT_DRIFT",
      `FHIR representation contract ${snapshot.fhirRepresentationContractId} must keep requiredProfileCanonicalUrls aligned with resourceProfiles.`,
    );

    return {
      ...snapshot,
      allowedResourceTypes: [...snapshot.allowedResourceTypes],
      requiredEvidenceRefs: uniqueSortedRefs(snapshot.requiredEvidenceRefs),
      requiredProfileCanonicalUrls: requiredProfiles,
      triggerMilestoneTypes: uniqueSortedRefs(snapshot.triggerMilestoneTypes),
      declaredBundlePolicyRefs: uniqueSortedRefs(snapshot.declaredBundlePolicyRefs),
      resourceProfiles: [...snapshot.resourceProfiles].sort((left, right) =>
        left.resourceType.localeCompare(right.resourceType),
      ),
      source_refs: uniqueSortedRefs(snapshot.source_refs),
    };
  }

  toSnapshot(): FhirRepresentationContractSnapshot {
    return {
      ...this.snapshot,
      triggerMilestoneTypes: [...this.snapshot.triggerMilestoneTypes],
      requiredEvidenceRefs: [...this.snapshot.requiredEvidenceRefs],
      allowedResourceTypes: [...this.snapshot.allowedResourceTypes],
      requiredProfileCanonicalUrls: [...this.snapshot.requiredProfileCanonicalUrls],
      declaredBundlePolicyRefs: [...this.snapshot.declaredBundlePolicyRefs],
      resourceProfiles: this.snapshot.resourceProfiles.map((profile) => ({ ...profile })),
      source_refs: [...this.snapshot.source_refs],
    };
  }
}

export class FhirRepresentationSetRecord {
  private readonly snapshot: FhirRepresentationSetSnapshot;

  private constructor(snapshot: FhirRepresentationSetSnapshot) {
    this.snapshot = {
      ...snapshot,
      resourceRecordRefs: uniqueSortedRefs(snapshot.resourceRecordRefs),
    };
  }

  static create(
    snapshot: Omit<FhirRepresentationSetSnapshot, "recordVersion" | "persistenceSchemaVersion">,
  ): FhirRepresentationSetRecord {
    return new FhirRepresentationSetRecord({
      ...snapshot,
      recordVersion: 1,
      persistenceSchemaVersion: 1,
    });
  }

  static hydrate(snapshot: FhirRepresentationSetSnapshot): FhirRepresentationSetRecord {
    return new FhirRepresentationSetRecord(snapshot);
  }

  get fhirRepresentationSetId(): string {
    return this.snapshot.fhirRepresentationSetId;
  }

  get representationContractRef(): string {
    return this.snapshot.representationContractRef;
  }

  get governingAggregateRef(): string {
    return this.snapshot.governingAggregateRef;
  }

  get governingAggregateVersionRef(): string {
    return this.snapshot.governingAggregateVersionRef;
  }

  get monotoneRevision(): number {
    return this.snapshot.monotoneRevision;
  }

  get representationState(): FhirRepresentationState {
    return this.snapshot.representationState;
  }

  toSnapshot(): FhirRepresentationSetSnapshot {
    return {
      ...this.snapshot,
      resourceRecordRefs: [...this.snapshot.resourceRecordRefs],
    };
  }

  supersede(input: {
    supersededByRepresentationSetRef: string;
    generatedAt: string;
  }): FhirRepresentationSetRecord {
    return new FhirRepresentationSetRecord({
      ...this.snapshot,
      representationState: "superseded",
      supersededByRepresentationSetRef: requireRef(
        input.supersededByRepresentationSetRef,
        "supersededByRepresentationSetRef",
      ),
      generatedAt: input.generatedAt,
      recordVersion: this.snapshot.recordVersion + 1,
    });
  }

  invalidate(input: {
    invalidationReasonRef: string;
    generatedAt: string;
  }): FhirRepresentationSetRecord {
    return new FhirRepresentationSetRecord({
      ...this.snapshot,
      representationState: "invalidated",
      invalidationReasonRef: requireRef(input.invalidationReasonRef, "invalidationReasonRef"),
      generatedAt: input.generatedAt,
      recordVersion: this.snapshot.recordVersion + 1,
    });
  }
}

export class FhirResourceRecord {
  private readonly snapshot: FhirResourceRecordSnapshot;

  private constructor(snapshot: FhirResourceRecordSnapshot) {
    this.snapshot = {
      ...snapshot,
      sourceAggregateRefs: uniqueSortedRefs(snapshot.sourceAggregateRefs),
    };
  }

  static create(
    snapshot: Omit<FhirResourceRecordSnapshot, "recordVersion" | "persistenceSchemaVersion">,
  ): FhirResourceRecord {
    return new FhirResourceRecord({
      ...snapshot,
      recordVersion: 1,
      persistenceSchemaVersion: 1,
    });
  }

  static hydrate(snapshot: FhirResourceRecordSnapshot): FhirResourceRecord {
    return new FhirResourceRecord(snapshot);
  }

  get fhirResourceRecordId(): string {
    return this.snapshot.fhirResourceRecordId;
  }

  get representationSetRef(): string {
    return this.snapshot.representationSetRef;
  }

  get resourceType(): CanonicalFhirResourceType {
    return this.snapshot.resourceType;
  }

  get logicalId(): string {
    return this.snapshot.logicalId;
  }

  get versionId(): string {
    return this.snapshot.versionId;
  }

  get materializationState(): FhirMaterializationState {
    return this.snapshot.materializationState;
  }

  toSnapshot(): FhirResourceRecordSnapshot {
    return {
      ...this.snapshot,
      sourceAggregateRefs: [...this.snapshot.sourceAggregateRefs],
      payload: stableNormalize(this.snapshot.payload) as Record<string, unknown>,
    };
  }

  supersede(input: {
    supersededByRepresentationSetRef: string;
    writtenAt: string;
  }): FhirResourceRecord {
    return new FhirResourceRecord({
      ...this.snapshot,
      materializationState: "superseded",
      supersededByRepresentationSetRef: requireRef(
        input.supersededByRepresentationSetRef,
        "supersededByRepresentationSetRef",
      ),
      writtenAt: input.writtenAt,
      recordVersion: this.snapshot.recordVersion + 1,
    });
  }

  invalidate(input: { invalidationReasonRef: string; writtenAt: string }): FhirResourceRecord {
    return new FhirResourceRecord({
      ...this.snapshot,
      materializationState: "invalidated",
      invalidationReasonRef: requireRef(input.invalidationReasonRef, "invalidationReasonRef"),
      writtenAt: input.writtenAt,
      recordVersion: this.snapshot.recordVersion + 1,
    });
  }
}

export class FhirExchangeBundleRecord {
  private readonly snapshot: FhirExchangeBundleSnapshot;

  private constructor(snapshot: FhirExchangeBundleSnapshot) {
    this.snapshot = snapshot;
  }

  static create(
    snapshot: Omit<FhirExchangeBundleSnapshot, "recordVersion" | "persistenceSchemaVersion">,
  ): FhirExchangeBundleRecord {
    return new FhirExchangeBundleRecord({
      ...snapshot,
      recordVersion: 1,
      persistenceSchemaVersion: 1,
    });
  }

  static hydrate(snapshot: FhirExchangeBundleSnapshot): FhirExchangeBundleRecord {
    return new FhirExchangeBundleRecord(snapshot);
  }

  get fhirExchangeBundleId(): string {
    return this.snapshot.fhirExchangeBundleId;
  }

  get bundleType(): FhirBundleType {
    return this.snapshot.bundleType;
  }

  get exchangeState(): FhirExchangeState {
    return this.snapshot.exchangeState;
  }

  toSnapshot(): FhirExchangeBundleSnapshot {
    return {
      ...this.snapshot,
      bundlePayload: stableNormalize(this.snapshot.bundlePayload) as Record<string, unknown>,
    };
  }

  supersede(input: { supersededByBundleRef: string; closedAt: string }): FhirExchangeBundleRecord {
    return new FhirExchangeBundleRecord({
      ...this.snapshot,
      exchangeState: "superseded",
      supersededByBundleRef: requireRef(input.supersededByBundleRef, "supersededByBundleRef"),
      closedAt: input.closedAt,
      recordVersion: this.snapshot.recordVersion + 1,
    });
  }

  invalidate(input: { invalidationReasonRef: string; closedAt: string }): FhirExchangeBundleRecord {
    return new FhirExchangeBundleRecord({
      ...this.snapshot,
      exchangeState: "failed",
      invalidationReasonRef: requireRef(input.invalidationReasonRef, "invalidationReasonRef"),
      closedAt: input.closedAt,
      recordVersion: this.snapshot.recordVersion + 1,
    });
  }
}

interface DescriptorSeed {
  resourceType: CanonicalFhirResourceType;
  profileCanonicalUrl: string;
  logicalId: string;
  versionId: string;
}

function makeIdentifierSet(input: {
  resourceType: CanonicalFhirResourceType;
  logicalId: string;
  aggregateRef: string;
  aggregateVersionRef: string;
  contractRef: string;
  identifierPolicy: FhirIdentifierPolicy;
}): Array<Record<string, unknown>> {
  return [
    {
      system: `https://vecells.example/fhir/identifier/${input.identifierPolicy.policyId}`,
      value: `${input.resourceType.toLowerCase()}-${takeDigest(input, 20)}`,
    },
    {
      system: "https://vecells.example/fhir/identifier/governing-aggregate",
      value: `${input.aggregateRef}:${input.aggregateVersionRef}`,
    },
    {
      system: "https://vecells.example/fhir/identifier/representation-contract",
      value: input.contractRef,
    },
  ];
}

function subjectReference(
  subjectRef: string | null | undefined,
): Record<string, unknown> | undefined {
  if (!subjectRef) {
    return undefined;
  }
  return { reference: `Patient/${subjectRef}` };
}

function aggregateStatus(
  statusPolicy: FhirStatusMappingPolicy | undefined,
  aggregateState: string | null | undefined,
  fallback: string,
): string {
  if (aggregateState && statusPolicy) {
    return statusPolicy.mappings[aggregateState] ?? fallback;
  }
  return fallback;
}

function governanceExtension(input: {
  contract: FhirRepresentationContractSnapshot;
  aggregate: FhirAggregateMaterializationInput;
}): Array<Record<string, unknown>> {
  return [
    {
      url: "https://vecells.example/fhir/StructureDefinition/representation-contract-ref",
      valueString: input.contract.fhirRepresentationContractId,
    },
    {
      url: "https://vecells.example/fhir/StructureDefinition/governing-aggregate-ref",
      valueString: input.aggregate.aggregateRef,
    },
    {
      url: "https://vecells.example/fhir/StructureDefinition/governing-aggregate-version-ref",
      valueString: input.aggregate.aggregateVersionRef,
    },
    {
      url: "https://vecells.example/fhir/StructureDefinition/governing-lineage-ref",
      valueString: input.aggregate.lineageRef,
    },
  ];
}

function descriptorTargetRefs(
  descriptors: readonly DescriptorSeed[],
): Array<Record<string, unknown>> {
  return descriptors
    .filter((descriptor) => descriptor.resourceType !== "Provenance")
    .map((descriptor) => ({ reference: `${descriptor.resourceType}/${descriptor.logicalId}` }));
}

function buildPayload(input: {
  contract: FhirRepresentationContractSnapshot;
  descriptor: DescriptorSeed;
  descriptors: readonly DescriptorSeed[];
  aggregate: FhirAggregateMaterializationInput;
  identifierPolicy: FhirIdentifierPolicy;
  statusPolicy?: FhirStatusMappingPolicy;
  generatedAt: string;
}): Record<string, unknown> {
  const identifier = makeIdentifierSet({
    resourceType: input.descriptor.resourceType,
    logicalId: input.descriptor.logicalId,
    aggregateRef: input.aggregate.aggregateRef,
    aggregateVersionRef: input.aggregate.aggregateVersionRef,
    contractRef: input.contract.fhirRepresentationContractId,
    identifierPolicy: input.identifierPolicy,
  });
  const sharedMeta = {
    resourceType: input.descriptor.resourceType,
    id: input.descriptor.logicalId,
    meta: {
      versionId: input.descriptor.versionId,
      profile: [input.descriptor.profileCanonicalUrl],
    },
    identifier,
    extension: governanceExtension({
      contract: input.contract,
      aggregate: input.aggregate,
    }),
  } satisfies Record<string, unknown>;
  const subject = subjectReference(input.aggregate.subjectRef);
  const summaryText = `${input.contract.governingAggregateType} ${input.aggregate.aggregateRef}`;

  switch (input.descriptor.resourceType) {
    case "Task":
      return {
        ...sharedMeta,
        status: aggregateStatus(input.statusPolicy, input.aggregate.aggregateState, "requested"),
        intent: "order",
        for: subject,
        description: `Vecells task representation for ${summaryText}`,
        authoredOn: input.generatedAt,
        focus: {
          identifier: {
            system: "https://vecells.example/fhir/focus/governing-aggregate",
            value: input.aggregate.aggregateRef,
          },
        },
      };
    case "ServiceRequest":
      return {
        ...sharedMeta,
        status: aggregateStatus(input.statusPolicy, input.aggregate.aggregateState, "active"),
        intent: "order",
        subject,
        authoredOn: input.generatedAt,
        code: {
          text: `Vecells service request for ${summaryText}`,
        },
      };
    case "DocumentReference":
      return {
        ...sharedMeta,
        status: "current",
        subject,
        date: input.generatedAt,
        description: `Vecells evidence artifact for ${summaryText}`,
        content: [
          {
            attachment: {
              url: `urn:vecells:artifact:${input.aggregate.aggregateRef}:${input.descriptor.logicalId}`,
              contentType: "application/json",
            },
          },
        ],
      };
    case "Communication":
      return {
        ...sharedMeta,
        status: aggregateStatus(input.statusPolicy, input.aggregate.aggregateState, "completed"),
        subject,
        sent: input.generatedAt,
        about: [
          {
            identifier: {
              system: "https://vecells.example/fhir/about/governing-aggregate",
              value: input.aggregate.aggregateRef,
            },
          },
        ],
        payload: [
          {
            contentString:
              (input.aggregate.payload["messageText"] as string | undefined) ??
              `Vecells communication companion for ${summaryText}`,
          },
        ],
      };
    case "Consent":
      return {
        ...sharedMeta,
        status: aggregateStatus(input.statusPolicy, input.aggregate.aggregateState, "active"),
        patient: subject,
        dateTime: input.generatedAt,
        scope: { text: "Vecells consent representation" },
        provision: { type: "permit" },
      };
    case "AuditEvent":
      return {
        ...sharedMeta,
        recorded: input.generatedAt,
        outcome: aggregateStatus(input.statusPolicy, input.aggregate.aggregateState, "0"),
        type: {
          text: `Vecells audit companion for ${summaryText}`,
        },
        entity: [
          {
            what: {
              identifier: {
                system: "https://vecells.example/fhir/entity/governing-aggregate",
                value: input.aggregate.aggregateRef,
              },
            },
          },
        ],
      };
    case "Provenance":
      return {
        ...sharedMeta,
        recorded: input.generatedAt,
        target: descriptorTargetRefs(input.descriptors),
        activity: {
          text: input.contract.representationPurpose,
        },
        entity: [
          {
            role: "source",
            what: {
              identifier: {
                system: "https://vecells.example/fhir/entity/governing-aggregate-version",
                value: input.aggregate.aggregateVersionRef,
              },
            },
          },
        ],
      };
    case "Bundle":
      return {
        ...sharedMeta,
        type: "collection",
        timestamp: input.generatedAt,
        entry: input.descriptors
          .filter((descriptor) => descriptor.logicalId !== input.descriptor.logicalId)
          .map((descriptor) => ({
            fullUrl: `urn:uuid:${descriptor.logicalId}`,
            request: { method: "GET", url: `${descriptor.resourceType}/${descriptor.logicalId}` },
          })),
      };
  }
}

function buildExchangeBundlePayload(input: {
  representationSet: FhirRepresentationSetRecord;
  resourceRecords: readonly FhirResourceRecord[];
  bundleType: FhirBundleType;
  generatedAt: string;
  contract: FhirRepresentationContractSnapshot;
}): Record<string, unknown> {
  return {
    resourceType: "Bundle",
    id: `bundle_${takeDigest(
      {
        representationSetId: input.representationSet.fhirRepresentationSetId,
        bundleType: input.bundleType,
      },
      20,
    )}`,
    type: input.bundleType,
    timestamp: input.generatedAt,
    identifier: {
      system: "https://vecells.example/fhir/identifier/representation-set",
      value: input.representationSet.fhirRepresentationSetId,
    },
    entry: input.resourceRecords.map((record) => {
      const snapshot = record.toSnapshot();
      return {
        fullUrl: `urn:uuid:${snapshot.logicalId}`,
        resource: stableNormalize(snapshot.payload),
      };
    }),
    meta: {
      tag: [
        {
          system: "https://vecells.example/fhir/tags/representation-purpose",
          code: input.contract.representationPurpose,
        },
      ],
    },
  };
}

function coerceCorrelationComponent(input: {
  field: string;
  aggregate: FhirAggregateMaterializationInput;
  representationSet: FhirRepresentationSetRecord;
  bundleHash: string;
}): string {
  switch (input.field) {
    case "requestId":
      return input.aggregate.aggregateRef;
    case "representationSetId":
      return input.representationSet.fhirRepresentationSetId;
    case "bundleHash":
      return input.bundleHash;
    default: {
      const rawValue = input.aggregate.payload[input.field];
      if (typeof rawValue === "string" && rawValue.length > 0) {
        return rawValue;
      }
      return `${input.field}:${takeDigest(
        {
          field: input.field,
          aggregateRef: input.aggregate.aggregateRef,
          bundleHash: input.bundleHash,
        },
        10,
      )}`;
    }
  }
}

function appendVersionedRecord<T extends { recordVersion: number }>(
  historyMap: Map<string, T[]>,
  key: string,
  next: T,
  label: string,
): void {
  const history = historyMap.get(key) ?? [];
  const current = history.at(-1);
  if (current) {
    invariant(
      next.recordVersion === current.recordVersion + 1,
      `NON_MONOTONE_${label.toUpperCase()}_VERSION`,
      `${label} history for ${key} must append with a strictly increasing recordVersion.`,
    );
  } else {
    invariant(
      next.recordVersion === 1,
      `INVALID_${label.toUpperCase()}_INITIAL_VERSION`,
      `${label} history for ${key} must start at recordVersion 1.`,
    );
  }
  history.push(next);
  historyMap.set(key, history);
}

export class InMemoryFhirRepresentationStore implements FhirCompilerDependencies {
  private readonly contracts = new Map<string, FhirRepresentationContractSnapshot>();
  private readonly bundlePolicies = new Map<string, FhirExchangeBundlePolicy>();
  private readonly identifierPolicies = new Map<string, FhirIdentifierPolicy>();
  private readonly statusPolicies = new Map<string, FhirStatusMappingPolicy>();
  private readonly representationSetHistory = new Map<string, FhirRepresentationSetSnapshot[]>();
  private readonly resourceRecordHistory = new Map<string, FhirResourceRecordSnapshot[]>();
  private readonly exchangeBundleHistory = new Map<string, FhirExchangeBundleSnapshot[]>();
  private readonly replayIndex = new Map<string, string>();
  private readonly currentRepresentationIndex = new Map<string, string>();

  constructor(options?: {
    contracts?: readonly FhirRepresentationContractSnapshot[];
    bundlePolicies?: readonly FhirExchangeBundlePolicy[];
    identifierPolicies?: readonly FhirIdentifierPolicy[];
    statusPolicies?: readonly FhirStatusMappingPolicy[];
  }) {
    for (const contract of options?.contracts ?? []) {
      const published = FhirRepresentationContractRecord.publish(contract).toSnapshot();
      this.contracts.set(published.fhirRepresentationContractId, published);
    }
    for (const policy of options?.bundlePolicies ?? []) {
      this.bundlePolicies.set(policy.policyId, {
        ...policy,
        representationContractRefs: uniqueSortedRefs(policy.representationContractRefs),
        legalBundleTypes: [...policy.legalBundleTypes],
        adapterProfileRefs: uniqueSortedRefs(policy.adapterProfileRefs),
        boundDependencyRefs: uniqueSortedRefs(policy.boundDependencyRefs),
        correlationKeyFields: uniqueSortedRefs(policy.correlationKeyFields),
        receiptCheckpointRefs: uniqueSortedRefs(policy.receiptCheckpointRefs),
        mandatoryProofRefs: uniqueSortedRefs(policy.mandatoryProofRefs),
        exchangeStates: [...policy.exchangeStates],
        source_refs: uniqueSortedRefs(policy.source_refs),
      });
    }
    for (const policy of options?.identifierPolicies ?? []) {
      this.identifierPolicies.set(policy.policyId, {
        ...policy,
        stableInputs: uniqueSortedRefs(policy.stableInputs),
      });
    }
    for (const policy of options?.statusPolicies ?? []) {
      this.statusPolicies.set(policy.policyId, {
        ...policy,
        mappings: { ...policy.mappings },
      });
    }
  }

  async getRepresentationContract(
    contractId: string,
  ): Promise<FhirRepresentationContractSnapshot | undefined> {
    return this.contracts.get(contractId);
  }

  async getBundlePolicy(policyId: string): Promise<FhirExchangeBundlePolicy | undefined> {
    return this.bundlePolicies.get(policyId);
  }

  async getIdentifierPolicy(policyId: string): Promise<FhirIdentifierPolicy | undefined> {
    return this.identifierPolicies.get(policyId);
  }

  async getStatusMappingPolicy(policyId: string): Promise<FhirStatusMappingPolicy | undefined> {
    return this.statusPolicies.get(policyId);
  }

  async getRepresentationSet(
    representationSetId: string,
  ): Promise<FhirRepresentationSetRecord | undefined> {
    const history = this.representationSetHistory.get(representationSetId);
    return history ? FhirRepresentationSetRecord.hydrate(history.at(-1)!) : undefined;
  }

  async saveRepresentationSet(record: FhirRepresentationSetRecord): Promise<void> {
    appendVersionedRecord(
      this.representationSetHistory,
      record.fhirRepresentationSetId,
      record.toSnapshot(),
      "representation_set",
    );
  }

  async saveResourceRecord(record: FhirResourceRecord): Promise<void> {
    appendVersionedRecord(
      this.resourceRecordHistory,
      record.fhirResourceRecordId,
      record.toSnapshot(),
      "resource_record",
    );
  }

  async saveExchangeBundle(record: FhirExchangeBundleRecord): Promise<void> {
    appendVersionedRecord(
      this.exchangeBundleHistory,
      record.fhirExchangeBundleId,
      record.toSnapshot(),
      "exchange_bundle",
    );
  }

  async getRepresentationSetByDeterministicKey(
    replayKey: string,
  ): Promise<FhirRepresentationSetRecord | undefined> {
    const representationSetId = this.replayIndex.get(replayKey);
    if (!representationSetId) {
      return undefined;
    }
    const history = this.representationSetHistory.get(representationSetId);
    return history ? FhirRepresentationSetRecord.hydrate(history.at(-1)!) : undefined;
  }

  async getCurrentRepresentationSetForContractAggregate(
    representationContractRef: string,
    aggregateRef: string,
  ): Promise<FhirRepresentationSetRecord | undefined> {
    const representationSetId = this.currentRepresentationIndex.get(
      contractAggregateKey(representationContractRef, aggregateRef),
    );
    if (!representationSetId) {
      return undefined;
    }
    const history = this.representationSetHistory.get(representationSetId);
    return history ? FhirRepresentationSetRecord.hydrate(history.at(-1)!) : undefined;
  }

  async listCurrentResourceRecordsForSet(
    representationSetRef: string,
  ): Promise<readonly FhirResourceRecord[]> {
    const records: FhirResourceRecord[] = [];
    for (const history of this.resourceRecordHistory.values()) {
      const snapshot = history.at(-1)!;
      if (snapshot.representationSetRef === representationSetRef) {
        records.push(FhirResourceRecord.hydrate(snapshot));
      }
    }
    return records.sort((left, right) =>
      left.toSnapshot().resourceType.localeCompare(right.toSnapshot().resourceType),
    );
  }

  async getCurrentExchangeBundleForSet(
    representationSetRef: string,
  ): Promise<FhirExchangeBundleRecord | undefined> {
    for (const history of this.exchangeBundleHistory.values()) {
      const snapshot = history.at(-1)!;
      if (snapshot.representationSetRef === representationSetRef) {
        return FhirExchangeBundleRecord.hydrate(snapshot);
      }
    }
    return undefined;
  }

  async setReplayKey(replayKey: string, representationSetId: string): Promise<void> {
    this.replayIndex.set(replayKey, representationSetId);
  }

  async setCurrentRepresentationSetIndex(
    representationContractRef: string,
    aggregateRef: string,
    representationSetId: string,
  ): Promise<void> {
    this.currentRepresentationIndex.set(
      contractAggregateKey(representationContractRef, aggregateRef),
      representationSetId,
    );
  }
}

export function createFhirRepresentationStore(options?: {
  contracts?: readonly FhirRepresentationContractSnapshot[];
  bundlePolicies?: readonly FhirExchangeBundlePolicy[];
  identifierPolicies?: readonly FhirIdentifierPolicy[];
  statusPolicies?: readonly FhirStatusMappingPolicy[];
}): InMemoryFhirRepresentationStore {
  return new InMemoryFhirRepresentationStore(options);
}

export class FhirRepresentationCompiler {
  constructor(private readonly dependencies: FhirCompilerDependencies) {}

  async materializeRepresentationSet(
    input: MaterializeFhirRepresentationInput,
  ): Promise<FhirMaterializationResult> {
    const contractSnapshot = await this.dependencies.getRepresentationContract(
      input.representationContractRef,
    );
    invariant(
      contractSnapshot,
      "FHIR_CONTRACT_NOT_FOUND",
      `FHIR representation contract ${input.representationContractRef} was not published.`,
    );
    const contract = FhirRepresentationContractRecord.publish(contractSnapshot).toSnapshot();

    invariant(
      input.aggregate.governingAggregateType === contract.governingAggregateType,
      "GOVERNING_AGGREGATE_TYPE_MISMATCH",
      `Contract ${contract.fhirRepresentationContractId} expects ${contract.governingAggregateType} but received ${input.aggregate.governingAggregateType}.`,
    );

    const availableEvidenceRefs = new Set<string>([
      input.aggregate.governingAggregateType,
      ...(input.aggregate.availableEvidenceRefs ?? []),
    ]);
    if (input.aggregate.evidenceSnapshotRef) {
      availableEvidenceRefs.add("EvidenceSnapshot");
    }
    for (const evidenceRef of contract.requiredEvidenceRefs) {
      invariant(
        availableEvidenceRefs.has(evidenceRef),
        "MISSING_REQUIRED_EVIDENCE_REF",
        `Contract ${contract.fhirRepresentationContractId} requires evidence ref ${evidenceRef}.`,
      );
    }

    const identifierPolicy = await this.dependencies.getIdentifierPolicy(
      contract.identifierPolicyRef,
    );
    invariant(
      identifierPolicy,
      "IDENTIFIER_POLICY_NOT_FOUND",
      `Identifier policy ${contract.identifierPolicyRef} was not published.`,
    );

    const statusPolicy = await this.dependencies.getStatusMappingPolicy(
      contract.statusMappingPolicyRef,
    );

    const replayKey = replayKeyFromMaterialization(
      contract.fhirRepresentationContractId,
      input.aggregate,
    );
    const replayedSet = await this.dependencies.getRepresentationSetByDeterministicKey(replayKey);
    if (replayedSet) {
      return {
        representationSet: replayedSet,
        resourceRecords: await this.dependencies.listCurrentResourceRecordsForSet(
          replayedSet.fhirRepresentationSetId,
        ),
        exchangeBundle:
          (await this.dependencies.getCurrentExchangeBundleForSet(
            replayedSet.fhirRepresentationSetId,
          )) ?? null,
        replayed: true,
      };
    }

    const priorSet = await this.dependencies.getCurrentRepresentationSetForContractAggregate(
      contract.fhirRepresentationContractId,
      input.aggregate.aggregateRef,
    );
    const monotoneRevision = (priorSet?.monotoneRevision ?? 0) + 1;

    const descriptors = contract.resourceProfiles.map((profile) => {
      const logicalId = deterministicResourceId({
        contractRef: contract.fhirRepresentationContractId,
        aggregateRef: input.aggregate.aggregateRef,
        aggregateVersionRef: input.aggregate.aggregateVersionRef,
        resourceType: profile.resourceType,
        profileCanonicalUrl: profile.profileCanonicalUrl,
        identifierPolicyRef: contract.identifierPolicyRef,
      });
      return {
        resourceType: profile.resourceType,
        profileCanonicalUrl: profile.profileCanonicalUrl,
        logicalId,
        versionId: deterministicVersionId({
          logicalId,
          aggregateVersionRef: input.aggregate.aggregateVersionRef,
          monotoneRevision,
          statusMappingPolicyRef: contract.statusMappingPolicyRef,
        }),
      } satisfies DescriptorSeed;
    });

    const representationSetId = deterministicRepresentationSetId({
      representationContractRef: contract.fhirRepresentationContractId,
      aggregateRef: input.aggregate.aggregateRef,
      aggregateVersionRef: input.aggregate.aggregateVersionRef,
      evidenceSnapshotRef: input.aggregate.evidenceSnapshotRef ?? null,
    });

    const resourceRecords = descriptors.map((descriptor) => {
      const payload = buildPayload({
        contract,
        descriptor,
        descriptors,
        aggregate: input.aggregate,
        identifierPolicy,
        statusPolicy,
        generatedAt: input.generatedAt,
      });
      const identifierSetHash = stableDigest(payload["identifier"]);
      return FhirResourceRecord.create({
        fhirResourceRecordId: deterministicResourceRecordId({
          representationSetRef: representationSetId,
          logicalId: descriptor.logicalId,
          profileCanonicalUrl: descriptor.profileCanonicalUrl,
        }),
        representationSetRef: representationSetId,
        resourceType: descriptor.resourceType,
        profileCanonicalUrl: descriptor.profileCanonicalUrl,
        logicalId: descriptor.logicalId,
        versionId: descriptor.versionId,
        subjectRef: input.aggregate.subjectRef ?? null,
        payloadArtifactRef: `resource://${representationSetId}/${descriptor.logicalId}.json`,
        payloadHash: stableDigest(payload),
        sourceAggregateRefs: uniqueSortedRefs([
          input.aggregate.aggregateRef,
          ...(input.aggregate.sourceAggregateRefs ?? []),
        ]),
        identifierSetHash,
        provenanceAuditJoinRef: input.aggregate.provenanceAuditJoinRef ?? null,
        storageDisposition: defaultStorageDisposition(contract.representationPurpose),
        materializationState: "written",
        supersededByRepresentationSetRef: null,
        invalidationReasonRef: null,
        writtenAt: input.generatedAt,
        payload,
      });
    });

    let exchangeBundle: FhirExchangeBundleRecord | null = null;
    let bundleArtifactRef: string | null = null;
    if (input.bundlePolicyRef || contract.declaredBundlePolicyRefs.length === 1) {
      const bundlePolicyRef = input.bundlePolicyRef ?? contract.declaredBundlePolicyRefs[0]!;
      const bundlePolicy = await this.dependencies.getBundlePolicy(bundlePolicyRef);
      invariant(
        bundlePolicy,
        "FHIR_BUNDLE_POLICY_NOT_FOUND",
        `FHIR exchange bundle policy ${bundlePolicyRef} was not published.`,
      );
      invariant(
        contract.declaredBundlePolicyRefs.includes(bundlePolicyRef),
        "BUNDLE_POLICY_NOT_DECLARED_BY_CONTRACT",
        `Contract ${contract.fhirRepresentationContractId} does not declare bundle policy ${bundlePolicyRef}.`,
      );
      for (const bundleType of bundlePolicy.legalBundleTypes) {
        invariant(
          allowedBundleTypeSet().has(bundleType),
          "UNSUPPORTED_BUNDLE_TYPE",
          `Bundle policy ${bundlePolicy.policyId} declares unsupported bundle type ${bundleType}.`,
        );
      }
      const bundleType = defaultBundleType(bundlePolicy);
      const setRecord = FhirRepresentationSetRecord.create({
        fhirRepresentationSetId: representationSetId,
        representationContractRef: contract.fhirRepresentationContractId,
        governingAggregateType: input.aggregate.governingAggregateType,
        governingAggregateRef: input.aggregate.aggregateRef,
        governingAggregateVersionRef: input.aggregate.aggregateVersionRef,
        governingLineageRef: input.aggregate.lineageRef,
        evidenceSnapshotRef: input.aggregate.evidenceSnapshotRef ?? null,
        representationPurpose: contract.representationPurpose,
        resourceRecordRefs: resourceRecords.map((record) => record.fhirResourceRecordId),
        bundleArtifactRef: null,
        setHash: "",
        causalToken: "",
        monotoneRevision,
        representationState: "emitted",
        supersedesRepresentationSetRef: priorSet?.fhirRepresentationSetId ?? null,
        supersededByRepresentationSetRef: null,
        invalidationReasonRef: null,
        generatedAt: input.generatedAt,
      });
      const bundlePayload = buildExchangeBundlePayload({
        representationSet: setRecord,
        resourceRecords,
        bundleType,
        generatedAt: input.generatedAt,
        contract,
      });
      const transportPayloadHash = stableDigest(bundlePayload);
      const exchangeBundleId = deterministicBundleId({
        representationSetRef: representationSetId,
        bundlePolicyRef,
        adapterContractProfileRef:
          input.adapterContractProfileRef ??
          bundlePolicy.adapterProfileRefs[0] ??
          "internal_compiler",
        direction: input.bundleDirection ?? bundlePolicy.direction,
      });
      const correlationKey = bundlePolicy.correlationKeyFields
        .map((field) =>
          coerceCorrelationComponent({
            field,
            aggregate: input.aggregate,
            representationSet: setRecord,
            bundleHash: transportPayloadHash,
          }),
        )
        .join("::");
      exchangeBundle = FhirExchangeBundleRecord.create({
        fhirExchangeBundleId: exchangeBundleId,
        representationSetRef: representationSetId,
        adapterContractProfileRef:
          input.adapterContractProfileRef ??
          bundlePolicy.adapterProfileRefs[0] ??
          "internal_compiler",
        direction: input.bundleDirection ?? bundlePolicy.direction,
        bundleType,
        transportPayloadRef: `bundle://${exchangeBundleId}.json`,
        transportPayloadHash,
        targetPartnerRef: input.targetPartnerRef ?? null,
        correlationKey:
          input.correlationSeed ??
          (correlationKey.length > 0 ? correlationKey : `bundle-${takeDigest(bundlePayload, 16)}`),
        receiptCheckpointRef:
          input.receiptCheckpointRef ?? bundlePolicy.receiptCheckpointRefs[0] ?? null,
        exchangeState: bundlePolicy.direction === "outbound" ? "staged" : "accepted",
        createdAt: input.generatedAt,
        closedAt: null,
        bundlePolicyRef,
        supersededByBundleRef: null,
        invalidationReasonRef: null,
        bundlePayload,
      });
      bundleArtifactRef = exchangeBundle.toSnapshot().transportPayloadRef;
    }

    const setHash = stableDigest({
      representationContractRef: contract.fhirRepresentationContractId,
      aggregateRef: input.aggregate.aggregateRef,
      aggregateVersionRef: input.aggregate.aggregateVersionRef,
      resourcePayloadHashes: resourceRecords.map((record) => record.toSnapshot().payloadHash),
      bundlePayloadHash: exchangeBundle?.toSnapshot().transportPayloadHash ?? null,
    });
    const causalToken = stableDigest({
      representationContractRef: contract.fhirRepresentationContractId,
      aggregateVersionRef: input.aggregate.aggregateVersionRef,
      evidenceSnapshotRef: input.aggregate.evidenceSnapshotRef ?? null,
      authoritativeSettlementRef: input.aggregate.authoritativeSettlementRef ?? null,
      setHash,
    });

    const representationSet = FhirRepresentationSetRecord.create({
      fhirRepresentationSetId: representationSetId,
      representationContractRef: contract.fhirRepresentationContractId,
      governingAggregateType: input.aggregate.governingAggregateType,
      governingAggregateRef: input.aggregate.aggregateRef,
      governingAggregateVersionRef: input.aggregate.aggregateVersionRef,
      governingLineageRef: input.aggregate.lineageRef,
      evidenceSnapshotRef: input.aggregate.evidenceSnapshotRef ?? null,
      representationPurpose: contract.representationPurpose,
      resourceRecordRefs: resourceRecords.map((record) => record.fhirResourceRecordId),
      bundleArtifactRef,
      setHash,
      causalToken,
      monotoneRevision,
      representationState: "emitted",
      supersedesRepresentationSetRef: priorSet?.fhirRepresentationSetId ?? null,
      supersededByRepresentationSetRef: null,
      invalidationReasonRef: null,
      generatedAt: input.generatedAt,
    });

    if (priorSet) {
      const supersededSet = priorSet.supersede({
        supersededByRepresentationSetRef: representationSet.fhirRepresentationSetId,
        generatedAt: input.generatedAt,
      });
      await this.dependencies.saveRepresentationSet(supersededSet);
      const priorResources = await this.dependencies.listCurrentResourceRecordsForSet(
        priorSet.fhirRepresentationSetId,
      );
      for (const priorResource of priorResources) {
        await this.dependencies.saveResourceRecord(
          priorResource.supersede({
            supersededByRepresentationSetRef: representationSet.fhirRepresentationSetId,
            writtenAt: input.generatedAt,
          }),
        );
      }
      const priorBundle = await this.dependencies.getCurrentExchangeBundleForSet(
        priorSet.fhirRepresentationSetId,
      );
      if (priorBundle) {
        if (exchangeBundle) {
          await this.dependencies.saveExchangeBundle(
            priorBundle.supersede({
              supersededByBundleRef: exchangeBundle.fhirExchangeBundleId,
              closedAt: input.generatedAt,
            }),
          );
        } else {
          await this.dependencies.saveExchangeBundle(
            priorBundle.invalidate({
              invalidationReasonRef: "REPRESENTATION_SET_SUPERSEDED_WITHOUT_BUNDLE_REISSUE",
              closedAt: input.generatedAt,
            }),
          );
        }
      }
    }

    await this.dependencies.saveRepresentationSet(representationSet);
    for (const resourceRecord of resourceRecords) {
      await this.dependencies.saveResourceRecord(resourceRecord);
    }
    if (exchangeBundle) {
      await this.dependencies.saveExchangeBundle(exchangeBundle);
    }
    await this.dependencies.setReplayKey(replayKey, representationSet.fhirRepresentationSetId);
    await this.dependencies.setCurrentRepresentationSetIndex(
      contract.fhirRepresentationContractId,
      input.aggregate.aggregateRef,
      representationSet.fhirRepresentationSetId,
    );

    return {
      representationSet,
      resourceRecords,
      exchangeBundle,
      replayed: false,
    };
  }

  async invalidateRepresentationSet(input: {
    representationSetId: string;
    invalidationReasonRef: string;
    invalidatedAt: string;
  }): Promise<void> {
    const matchingSet = await this.dependencies.getRepresentationSet(input.representationSetId);
    invariant(
      matchingSet,
      "REPRESENTATION_SET_NOT_FOUND",
      `FHIR representation set ${input.representationSetId} was not found.`,
    );
    await this.dependencies.saveRepresentationSet(
      matchingSet.invalidate({
        invalidationReasonRef: input.invalidationReasonRef,
        generatedAt: input.invalidatedAt,
      }),
    );
    const resources = await this.dependencies.listCurrentResourceRecordsForSet(
      input.representationSetId,
    );
    for (const resource of resources) {
      await this.dependencies.saveResourceRecord(
        resource.invalidate({
          invalidationReasonRef: input.invalidationReasonRef,
          writtenAt: input.invalidatedAt,
        }),
      );
    }
    const exchangeBundle = await this.dependencies.getCurrentExchangeBundleForSet(
      input.representationSetId,
    );
    if (exchangeBundle) {
      await this.dependencies.saveExchangeBundle(
        exchangeBundle.invalidate({
          invalidationReasonRef: input.invalidationReasonRef,
          closedAt: input.invalidatedAt,
        }),
      );
    }
  }
}

export function createFhirRepresentationCompiler(
  dependencies: FhirCompilerDependencies,
): FhirRepresentationCompiler {
  return new FhirRepresentationCompiler(dependencies);
}

export async function authorizeAdapterConsumption(
  input: AdapterConsumptionAuthorizationInput,
): Promise<void> {
  invariant(
    input.representationContract.contractState === "active" &&
      typeof input.representationContract.publishedAt === "string",
    "ADAPTER_CONSUMPTION_REQUIRES_PUBLISHED_CONTRACT",
    `Adapter consumption requires published FHIR contract ${input.representationContract.fhirRepresentationContractId}.`,
  );
  invariant(
    input.allowedFhirRepresentationContractRefs.includes(
      input.representationContract.fhirRepresentationContractId,
    ),
    "ADAPTER_CONSUMPTION_CONTRACT_NOT_ALLOWED",
    `Adapter is not allowed to consume ${input.representationContract.fhirRepresentationContractId}.`,
  );
  invariant(
    input.allowedFhirExchangeBundleTypes.includes(input.exchangeBundle.bundleType),
    "ADAPTER_CONSUMPTION_BUNDLE_TYPE_NOT_ALLOWED",
    `Adapter is not allowed to consume bundle type ${input.exchangeBundle.bundleType}.`,
  );
}
