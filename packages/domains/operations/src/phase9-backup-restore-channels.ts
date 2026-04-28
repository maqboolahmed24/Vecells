export const BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION =
  "462.phase9.backup-restore-channel-binding.v1";
export const BACKUP_RESTORE_CHANNEL_VISUAL_MODE = "Backup_Restore_Channel_Control_Ledger";
export const BACKUP_RESTORE_CHANNEL_GAP_ARTIFACT_REF =
  "PHASE9_BATCH_458_472_INTERFACE_GAP_462_BACKUP_RESTORE_CHANNELS";

export type BackupRestoreScenarioState =
  | "normal"
  | "target_creation"
  | "stale_checksum"
  | "missing_secret"
  | "missing_immutability_proof"
  | "report_delivery_failed"
  | "unsupported_scope"
  | "tuple_drift"
  | "withdrawn_channel";

export type EssentialFunctionRef =
  | "digital_intake"
  | "safety_gate"
  | "triage_queue"
  | "patient_status"
  | "local_booking"
  | "hub_coordination"
  | "pharmacy_referral_loop"
  | "outbound_comms"
  | "audit_search"
  | "assistive_downgrade";

export type RecoveryTierRef =
  | "tier_0_critical_15m"
  | "tier_1_operational_1h"
  | "tier_2_assurance_4h"
  | "tier_3_archive_24h";

export type BackupDatasetScope =
  | "patient_intake_event_data"
  | "safety_gate_triage_queue"
  | "booking_hub_coordination"
  | "pharmacy_referral_loop"
  | "outbound_communications"
  | "audit_search_assurance_ledger"
  | "assistive_downgrade_human_artifact"
  | "operational_projection_conformance_proof";

export type RecoveryArtifactType =
  | "restore_report"
  | "failover_report"
  | "chaos_report"
  | "journey_recovery_proof"
  | "backup_manifest_report"
  | "runbook_bundle"
  | "readiness_snapshot_summary";

export type BackupTargetVerificationStatus =
  | "verified"
  | "pending_creation"
  | "missing_secret"
  | "stale_checksum"
  | "missing_immutability_proof"
  | "blocked"
  | "unsupported_scope"
  | "tuple_drift"
  | "withdrawn";

export type RestoreReportDeliveryResult =
  | "delivered"
  | "blocked"
  | "failed"
  | "stale"
  | "withdrawn";

export type RecoveryControlState = "live_control" | "diagnostic_only" | "blocked";
export type BackupRestoreReadinessState = "ready" | "blocked" | "stale" | "diagnostic";

export interface BackupTargetVerificationRecord {
  readonly verificationId: string;
  readonly bindingId: string;
  readonly verifiedAt: string;
  readonly status: BackupTargetVerificationStatus;
  readonly checkedBy: "playwright:462_configure_backup_targets";
  readonly secretRef: string;
  readonly fakeTargetRef: string;
  readonly manifestRef: string;
  readonly evidencePackRef: string;
  readonly checksumAlgorithm: "sha256";
  readonly checksumExpected: string;
  readonly checksumObserved: string;
  readonly checksumMatches: boolean;
  readonly immutabilityProofObserved: boolean;
  readonly restoreCompatibilityDigest: string;
  readonly dependencyOrderDigest: string;
  readonly journeyProofRefs: readonly string[];
  readonly resilienceTupleHash: string;
  readonly fakeTargetObserved: boolean;
  readonly failureReason?: string;
}

export interface RecoveryArtifactChannelPolicy {
  readonly policyId: string;
  readonly artifactTypes: readonly RecoveryArtifactType[];
  readonly presentationContractRef: "ArtifactPresentationContract";
  readonly artifactSurfaceFrameRef: "ArtifactSurfaceFrame";
  readonly artifactModeTruthProjectionRef: "ArtifactModeTruthProjection";
  readonly rawObjectStoreUrlsAllowed: false;
  readonly outboundGrantRequired: true;
  readonly redactionMode: "minimum_necessary_summary_only";
  readonly maskingPolicyHash: string;
  readonly retentionClass: "phase9_resilience_evidence_7y";
  readonly archiveProtection: "immutable_legal_hold_capable";
  readonly permittedSurfaceRefs: readonly ("/ops/resilience" | "/ops/assurance" | "/ops/release")[];
}

export interface RestoreReportDeliverySettlement {
  readonly settlementId: string;
  readonly channelId: string;
  readonly deliveredAt: string | null;
  readonly result: RestoreReportDeliveryResult;
  readonly artifactType: RecoveryArtifactType;
  readonly artifactRef: string;
  readonly presentationGrantRef: string;
  readonly receiverRef: string;
  readonly receiverObserved: boolean;
  readonly responseCode: 202 | 409 | 423 | 503;
  readonly idempotencyKey: string;
  readonly redactionPolicyHash: string;
  readonly retryAttemptCount: number;
  readonly fallbackDisposition: "retain_on_resilience_board" | "queue_for_human_handoff";
  readonly failureReason?: string;
}

export interface BackupTargetBinding {
  readonly schemaVersion: typeof BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION;
  readonly bindingId: string;
  readonly label: string;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly releaseRef: string;
  readonly datasetScope: BackupDatasetScope;
  readonly essentialFunctionRefs: readonly EssentialFunctionRef[];
  readonly recoveryTierRefs: readonly RecoveryTierRef[];
  readonly runbookBindingRefs: readonly string[];
  readonly backupSetManifestRef: string;
  readonly recoveryEvidencePackRef: string;
  readonly immutabilityRequirement:
    | "append_only_object_lock_min_35d"
    | "write_once_archive_min_90d";
  readonly checksumAlgorithm: "sha256";
  readonly checksumCadence: "per_snapshot_and_daily";
  readonly restoreCompatibilityDigestStrategy: "clean_environment_restore_matrix_digest";
  readonly dependencyOrderDigestStrategy: "essential_function_dependency_order_digest";
  readonly secretRef: string;
  readonly secretHandleRef: string;
  readonly secretMaterialInline: false;
  readonly targetAlias: string;
  readonly storageClass: "fake_immutable_object_store" | "fake_immutable_archive";
  readonly latestVerificationRecord: BackupTargetVerificationRecord;
  readonly diagnosticDegradedConsequence:
    | "block_live_recovery_controls_show_diagnostic_only"
    | "block_restore_claims_until_manifest_reverified";
  readonly resilienceTupleHash: string;
  readonly bindingState: "live" | "pending" | "blocked" | "stale" | "withdrawn";
  readonly sourceRefs: readonly string[];
}

export interface RestoreReportChannelBinding {
  readonly schemaVersion: typeof BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION;
  readonly channelId: string;
  readonly label: string;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly releaseRef: string;
  readonly destinationClass:
    | "resilience_board_artifact_channel"
    | "assurance_evidence_channel"
    | "release_watch_channel";
  readonly artifactTypes: readonly RecoveryArtifactType[];
  readonly artifactPresentationPolicy: RecoveryArtifactChannelPolicy;
  readonly maskingRedactionPolicyHash: string;
  readonly permittedRecipients: readonly string[];
  readonly secretRef: string;
  readonly secretHandleRef: string;
  readonly secretMaterialInline: false;
  readonly receiverRef: string;
  readonly settlementBehavior: "idempotent_upsert_by_artifact_tuple";
  readonly safeFallbackDisposition: "retain_on_resilience_board" | "queue_for_human_handoff";
  readonly retentionArchiveProtection:
    | "archive_only_immutable_legal_hold_capable"
    | "archive_only_retained_with_evidence_pack";
  readonly latestSettlement: RestoreReportDeliverySettlement;
  readonly channelState: "live" | "blocked" | "stale" | "withdrawn";
  readonly sourceRefs: readonly string[];
}

export interface FakeBackupTargetRecord {
  readonly targetRecordId: string;
  readonly bindingId: string;
  readonly targetRef: string;
  readonly observedAt: string;
  readonly accepted: boolean;
  readonly responseCode: 202 | 409 | 423;
  readonly payloadHash: string;
  readonly payload: BackupTargetSyntheticPayload;
}

export interface FakeRestoreReportReceiverRecord {
  readonly receiverRecordId: string;
  readonly channelId: string;
  readonly receiverRef: string;
  readonly observedAt: string;
  readonly accepted: boolean;
  readonly responseCode: 202 | 409 | 503;
  readonly payloadHash: string;
  readonly payload: RestoreReportSyntheticPayload;
}

export interface BackupTargetSyntheticPayload {
  readonly schemaVersion: "462.phase9.fake-backup-target-payload.v1";
  readonly bindingId: string;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly releaseRef: string;
  readonly datasetScope: BackupDatasetScope;
  readonly essentialFunctionRefs: readonly EssentialFunctionRef[];
  readonly backupSetManifestRef: string;
  readonly checksumAlgorithm: "sha256";
  readonly checksumObserved: string;
  readonly immutabilityProofRef: string;
  readonly restoreCompatibilityDigest: string;
  readonly dependencyOrderDigest: string;
  readonly resilienceTupleHash: string;
  readonly safeDescriptorHash: string;
}

export interface RestoreReportSyntheticPayload {
  readonly schemaVersion: "462.phase9.fake-restore-report-payload.v1";
  readonly channelId: string;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly releaseRef: string;
  readonly artifactType: RecoveryArtifactType;
  readonly artifactRef: string;
  readonly presentationGrantRef: string;
  readonly redactionPolicyHash: string;
  readonly retentionClass: RecoveryArtifactChannelPolicy["retentionClass"];
  readonly receiverRef: string;
  readonly safeDescriptorHash: string;
}

export interface BackupRestoreReadinessProjection {
  readonly route: "/ops/resilience";
  readonly readinessState: BackupRestoreReadinessState;
  readonly recoveryControlState: RecoveryControlState;
  readonly evidencePackState: "current" | "blocked" | "stale";
  readonly tupleState: "exact" | "drifted";
  readonly targetReadyCount: number;
  readonly targetBlockedCount: number;
  readonly channelReadyCount: number;
  readonly channelBlockedCount: number;
  readonly blockedTargetRefs: readonly string[];
  readonly blockedChannelRefs: readonly string[];
  readonly summary: string;
}

export interface BackupRestoreChannelRegistryProjection {
  readonly schemaVersion: typeof BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION;
  readonly visualMode: typeof BACKUP_RESTORE_CHANNEL_VISUAL_MODE;
  readonly scenarioState: BackupRestoreScenarioState;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly releaseRef: string;
  readonly selectedDatasetScope: BackupDatasetScope;
  readonly selectedTargetBindingId: string;
  readonly selectedTargetBinding: BackupTargetBinding;
  readonly selectedChannelId: string;
  readonly selectedChannel: RestoreReportChannelBinding;
  readonly targetBindings: readonly BackupTargetBinding[];
  readonly reportChannels: readonly RestoreReportChannelBinding[];
  readonly verificationRecords: readonly BackupTargetVerificationRecord[];
  readonly deliverySettlements: readonly RestoreReportDeliverySettlement[];
  readonly artifactPolicies: readonly RecoveryArtifactChannelPolicy[];
  readonly fakeBackupTargetRecords: readonly FakeBackupTargetRecord[];
  readonly fakeRestoreReportReceiverRecords: readonly FakeRestoreReportReceiverRecord[];
  readonly readiness: BackupRestoreReadinessProjection;
  readonly registryHash: string;
  readonly noRawArtifactUrls: true;
  readonly automationAnchors: readonly string[];
  readonly sourceAlgorithmRefs: readonly string[];
  readonly interfaceGapArtifactRef: typeof BACKUP_RESTORE_CHANNEL_GAP_ARTIFACT_REF;
}

export interface BackupDatasetDefinition {
  readonly datasetScope: BackupDatasetScope;
  readonly label: string;
  readonly essentialFunctionRefs: readonly EssentialFunctionRef[];
  readonly recoveryTierRefs: readonly RecoveryTierRef[];
  readonly storageClass: BackupTargetBinding["storageClass"];
  readonly immutabilityRequirement: BackupTargetBinding["immutabilityRequirement"];
}

export interface RestoreReportChannelDefinition {
  readonly channelId: string;
  readonly label: string;
  readonly destinationClass: RestoreReportChannelBinding["destinationClass"];
  readonly artifactTypes: readonly RecoveryArtifactType[];
  readonly permittedRecipients: readonly string[];
  readonly surfaces: readonly ("/ops/resilience" | "/ops/assurance" | "/ops/release")[];
}

const BACKUP_DATASET_DEFINITIONS = [
  {
    datasetScope: "patient_intake_event_data",
    label: "Patient intake event data",
    essentialFunctionRefs: ["digital_intake", "patient_status"],
    recoveryTierRefs: ["tier_0_critical_15m"],
    storageClass: "fake_immutable_object_store",
    immutabilityRequirement: "append_only_object_lock_min_35d",
  },
  {
    datasetScope: "safety_gate_triage_queue",
    label: "Safety gate and triage queue",
    essentialFunctionRefs: ["safety_gate", "triage_queue", "patient_status"],
    recoveryTierRefs: ["tier_0_critical_15m", "tier_1_operational_1h"],
    storageClass: "fake_immutable_object_store",
    immutabilityRequirement: "append_only_object_lock_min_35d",
  },
  {
    datasetScope: "booking_hub_coordination",
    label: "Booking and hub coordination",
    essentialFunctionRefs: ["local_booking", "hub_coordination", "patient_status"],
    recoveryTierRefs: ["tier_1_operational_1h"],
    storageClass: "fake_immutable_object_store",
    immutabilityRequirement: "append_only_object_lock_min_35d",
  },
  {
    datasetScope: "pharmacy_referral_loop",
    label: "Pharmacy referral loop",
    essentialFunctionRefs: ["pharmacy_referral_loop", "patient_status"],
    recoveryTierRefs: ["tier_1_operational_1h"],
    storageClass: "fake_immutable_object_store",
    immutabilityRequirement: "append_only_object_lock_min_35d",
  },
  {
    datasetScope: "outbound_communications",
    label: "Outbound communications",
    essentialFunctionRefs: ["outbound_comms", "patient_status"],
    recoveryTierRefs: ["tier_1_operational_1h"],
    storageClass: "fake_immutable_object_store",
    immutabilityRequirement: "append_only_object_lock_min_35d",
  },
  {
    datasetScope: "audit_search_assurance_ledger",
    label: "Audit, search, and assurance ledger",
    essentialFunctionRefs: ["audit_search", "patient_status"],
    recoveryTierRefs: ["tier_2_assurance_4h", "tier_3_archive_24h"],
    storageClass: "fake_immutable_archive",
    immutabilityRequirement: "write_once_archive_min_90d",
  },
  {
    datasetScope: "assistive_downgrade_human_artifact",
    label: "Assistive downgrade and final human artifact",
    essentialFunctionRefs: ["assistive_downgrade", "outbound_comms"],
    recoveryTierRefs: ["tier_1_operational_1h", "tier_2_assurance_4h"],
    storageClass: "fake_immutable_archive",
    immutabilityRequirement: "write_once_archive_min_90d",
  },
  {
    datasetScope: "operational_projection_conformance_proof",
    label: "Operational projections and conformance proof",
    essentialFunctionRefs: ["audit_search", "hub_coordination", "patient_status"],
    recoveryTierRefs: ["tier_2_assurance_4h"],
    storageClass: "fake_immutable_archive",
    immutabilityRequirement: "write_once_archive_min_90d",
  },
] as const satisfies readonly BackupDatasetDefinition[];

const RECOVERY_ARTIFACT_TYPES = [
  "restore_report",
  "failover_report",
  "chaos_report",
  "journey_recovery_proof",
  "backup_manifest_report",
  "runbook_bundle",
  "readiness_snapshot_summary",
] as const satisfies readonly RecoveryArtifactType[];

const RESTORE_REPORT_CHANNEL_DEFINITIONS = [
  {
    channelId: "restore-channel-resilience-board",
    label: "Resilience board evidence channel",
    destinationClass: "resilience_board_artifact_channel",
    artifactTypes: RECOVERY_ARTIFACT_TYPES,
    permittedRecipients: ["resilience_duty_lead", "operations_duty_lead"],
    surfaces: ["/ops/resilience", "/ops/assurance"],
  },
  {
    channelId: "restore-channel-assurance-pack",
    label: "Assurance evidence pack channel",
    destinationClass: "assurance_evidence_channel",
    artifactTypes: [
      "restore_report",
      "journey_recovery_proof",
      "backup_manifest_report",
      "runbook_bundle",
      "readiness_snapshot_summary",
    ],
    permittedRecipients: ["assurance_evidence_owner", "resilience_duty_lead"],
    surfaces: ["/ops/assurance", "/ops/resilience"],
  },
  {
    channelId: "restore-channel-release-watch",
    label: "Release watch recovery channel",
    destinationClass: "release_watch_channel",
    artifactTypes: [
      "failover_report",
      "chaos_report",
      "readiness_snapshot_summary",
      "runbook_bundle",
    ],
    permittedRecipients: ["release_manager", "incident_commander"],
    surfaces: ["/ops/release", "/ops/resilience"],
  },
] as const satisfies readonly RestoreReportChannelDefinition[];

export const requiredBackupDatasetScopes = BACKUP_DATASET_DEFINITIONS.map(
  (definition) => definition.datasetScope,
);
export const requiredRecoveryArtifactTypes = RECOVERY_ARTIFACT_TYPES;
export const backupDatasetScopeOptions = BACKUP_DATASET_DEFINITIONS.map((definition) => ({
  value: definition.datasetScope,
  label: definition.label,
}));

const SOURCE_ALGORITHM_REFS = [
  "blueprint/phase-9-the-assurance-ledger.md#9F-resilience-backup-restore-and-recovery-control",
  "blueprint/phase-9-the-assurance-ledger.md#9I-final-pre-go-live-exercises",
  "blueprint/platform-runtime-and-release-blueprint.md#operational-readiness-snapshot",
  "blueprint/operations-console-frontend-blueprint.md#4.8A-resilience-board",
  "blueprint/phase-0-the-foundation-protocol.md#artifactpresentationcontract",
];

const AUTOMATION_ANCHORS = [
  "backup-restore-config-surface",
  "backup-restore-scope-ribbon",
  "backup-restore-wizard",
  "backup-target-table",
  "restore-report-channel-table",
  "fake-backup-target-ledger",
  "fake-restore-report-receiver-ledger",
  "recovery-artifact-policy-rail",
  "backup-restore-error-summary",
  "backup-restore-readiness-strip",
];

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `sha256:${(hash >>> 0).toString(16).padStart(8, "0")}${value
    .length.toString(16)
    .padStart(8, "0")}`;
}

function slug(value: string): string {
  return value.replace(/_/g, "-");
}

export function normalizeBackupRestoreScenarioState(
  value: string | null | undefined,
): BackupRestoreScenarioState {
  const normalized = String(value ?? "normal")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (
    normalized === "target_creation" ||
    normalized === "stale_checksum" ||
    normalized === "missing_secret" ||
    normalized === "missing_immutability_proof" ||
    normalized === "report_delivery_failed" ||
    normalized === "unsupported_scope" ||
    normalized === "tuple_drift" ||
    normalized === "withdrawn_channel"
  ) {
    return normalized;
  }
  return "normal";
}

export function backupSecretRefForScope(
  datasetScope: BackupDatasetScope,
  tenantRef = "tenant-demo-gp",
  environmentRef = "local",
): string {
  return `vault-ref/${tenantRef}/${environmentRef}/backup-targets/${slug(datasetScope)}/v1`;
}

export function restoreReportSecretRefForChannel(
  channelId = "restore-channel-resilience-board",
  tenantRef = "tenant-demo-gp",
  environmentRef = "local",
): string {
  return `vault-ref/${tenantRef}/${environmentRef}/restore-report-channels/${channelId}/v1`;
}

function tupleHashForScope(
  tenantRef: string,
  environmentRef: string,
  releaseRef: string,
  datasetScope: BackupDatasetScope,
  scenarioState: BackupRestoreScenarioState,
): string {
  return stableHash(
    `${tenantRef}:${environmentRef}:${releaseRef}:${datasetScope}:${
      scenarioState === "tuple_drift" ? "drifted" : "exact"
    }`,
  );
}

function statusForScenario(
  scenarioState: BackupRestoreScenarioState,
  selected: boolean,
): BackupTargetVerificationStatus {
  if (!selected) return "verified";
  switch (scenarioState) {
    case "target_creation":
      return "pending_creation";
    case "missing_secret":
      return "missing_secret";
    case "stale_checksum":
      return "stale_checksum";
    case "missing_immutability_proof":
      return "missing_immutability_proof";
    case "unsupported_scope":
      return "unsupported_scope";
    case "tuple_drift":
      return "tuple_drift";
    case "withdrawn_channel":
    case "report_delivery_failed":
    case "normal":
      return "verified";
  }
}

function bindingStateForStatus(
  status: BackupTargetVerificationStatus,
): BackupTargetBinding["bindingState"] {
  switch (status) {
    case "verified":
      return "live";
    case "pending_creation":
      return "pending";
    case "stale_checksum":
      return "stale";
    case "withdrawn":
      return "withdrawn";
    case "missing_secret":
    case "missing_immutability_proof":
    case "blocked":
    case "unsupported_scope":
    case "tuple_drift":
      return "blocked";
  }
}

function settlementResultForScenario(
  scenarioState: BackupRestoreScenarioState,
  selected: boolean,
): RestoreReportDeliveryResult {
  if (!selected) return "delivered";
  switch (scenarioState) {
    case "report_delivery_failed":
      return "failed";
    case "stale_checksum":
    case "tuple_drift":
      return "stale";
    case "withdrawn_channel":
      return "withdrawn";
    case "missing_secret":
    case "missing_immutability_proof":
    case "unsupported_scope":
    case "target_creation":
      return "blocked";
    case "normal":
      return "delivered";
  }
}

function channelStateForResult(
  result: RestoreReportDeliveryResult,
): RestoreReportChannelBinding["channelState"] {
  switch (result) {
    case "delivered":
      return "live";
    case "stale":
      return "stale";
    case "withdrawn":
      return "withdrawn";
    case "blocked":
    case "failed":
      return "blocked";
  }
}

function failureReasonForTarget(status: BackupTargetVerificationStatus): string | undefined {
  switch (status) {
    case "pending_creation":
      return "Target binding has not completed fake storage verification.";
    case "missing_secret":
      return "Vault reference is required before fake storage verification.";
    case "stale_checksum":
      return "Latest checksum does not match the required backup manifest cadence.";
    case "missing_immutability_proof":
      return "Object-lock or write-once proof is absent for the selected scope.";
    case "unsupported_scope":
      return "Selected tenant, environment, and essential-function scope are not permitted.";
    case "tuple_drift":
      return "Recovery tuple hash no longer matches the runtime publication bundle.";
    case "blocked":
      return "Backup target is blocked until the canonical tuple validates.";
    case "withdrawn":
      return "Backup target has been withdrawn from live recovery authority.";
    case "verified":
      return undefined;
  }
}

function failureReasonForSettlement(result: RestoreReportDeliveryResult): string | undefined {
  switch (result) {
    case "failed":
      return "Fake restore report receiver rejected the synthetic artifact summary.";
    case "blocked":
      return "Report delivery is blocked while backup target verification is incomplete.";
    case "stale":
      return "Report delivery is stale because the recovery tuple or checksum proof drifted.";
    case "withdrawn":
      return "Report channel has been withdrawn from live restore reporting.";
    case "delivered":
      return undefined;
  }
}

export function createBackupTargetBinding(
  definition: BackupDatasetDefinition,
  options: {
    readonly tenantRef?: string;
    readonly environmentRef?: string;
    readonly releaseRef?: string;
    readonly selected?: boolean;
    readonly scenarioState?: BackupRestoreScenarioState | string | null;
    readonly secretRefOverride?: string;
  } = {},
): BackupTargetBinding {
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const releaseRef = options.releaseRef ?? "release-wave-blue-42";
  const scenarioState = normalizeBackupRestoreScenarioState(options.scenarioState);
  const status = statusForScenario(scenarioState, options.selected ?? false);
  const bindingId = `backup-target-${slug(definition.datasetScope)}`;
  const tupleHash = tupleHashForScope(
    tenantRef,
    environmentRef,
    releaseRef,
    definition.datasetScope,
    scenarioState,
  );
  const secretRef =
    options.secretRefOverride ??
    (status === "missing_secret"
      ? ""
      : backupSecretRefForScope(definition.datasetScope, tenantRef, environmentRef));
  const checksumExpected = stableHash(`${bindingId}:manifest:expected:${releaseRef}`);
  const checksumObserved =
    status === "stale_checksum" ? stableHash(`${bindingId}:manifest:stale`) : checksumExpected;
  const restoreCompatibilityDigest = stableHash(`${bindingId}:clean-env-restore-matrix`);
  const dependencyOrderDigest = stableHash(
    `${bindingId}:${definition.essentialFunctionRefs.join(">")}:dependency-order`,
  );
  const manifestRef = `backup-set-manifest:462:${definition.datasetScope}:${releaseRef}`;
  const evidencePackRef = `recovery-evidence-pack:462:${definition.datasetScope}:${releaseRef}`;
  const verification: BackupTargetVerificationRecord = {
    verificationId: `backup-verification-462-${slug(definition.datasetScope)}`,
    bindingId,
    verifiedAt: status === "stale_checksum" ? "2026-04-26T08:15:00Z" : "2026-04-28T10:18:00Z",
    status,
    checkedBy: "playwright:462_configure_backup_targets",
    secretRef,
    fakeTargetRef: `fake-backup-target:phase9:${slug(definition.datasetScope)}`,
    manifestRef,
    evidencePackRef,
    checksumAlgorithm: "sha256",
    checksumExpected,
    checksumObserved,
    checksumMatches: checksumExpected === checksumObserved,
    immutabilityProofObserved: status !== "missing_immutability_proof",
    restoreCompatibilityDigest,
    dependencyOrderDigest,
    journeyProofRefs: definition.essentialFunctionRefs.map(
      (functionRef) => `journey-proof:462:${functionRef}:${definition.datasetScope}`,
    ),
    resilienceTupleHash: tupleHash,
    fakeTargetObserved: status === "verified" || status === "stale_checksum",
    failureReason: failureReasonForTarget(status),
  };
  return {
    schemaVersion: BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
    bindingId,
    label: definition.label,
    tenantRef,
    environmentRef,
    releaseRef,
    datasetScope: definition.datasetScope,
    essentialFunctionRefs: definition.essentialFunctionRefs,
    recoveryTierRefs: definition.recoveryTierRefs,
    runbookBindingRefs: definition.essentialFunctionRefs.map(
      (functionRef) => `runbook-binding:phase9:${functionRef}`,
    ),
    backupSetManifestRef: manifestRef,
    recoveryEvidencePackRef: evidencePackRef,
    immutabilityRequirement: definition.immutabilityRequirement,
    checksumAlgorithm: "sha256",
    checksumCadence: "per_snapshot_and_daily",
    restoreCompatibilityDigestStrategy: "clean_environment_restore_matrix_digest",
    dependencyOrderDigestStrategy: "essential_function_dependency_order_digest",
    secretRef,
    secretHandleRef: secretRef,
    secretMaterialInline: false,
    targetAlias: `fake immutable target ${slug(definition.datasetScope)}`,
    storageClass: definition.storageClass,
    latestVerificationRecord: verification,
    diagnosticDegradedConsequence:
      definition.recoveryTierRefs.includes("tier_0_critical_15m")
        ? "block_live_recovery_controls_show_diagnostic_only"
        : "block_restore_claims_until_manifest_reverified",
    resilienceTupleHash: tupleHash,
    bindingState: bindingStateForStatus(status),
    sourceRefs: SOURCE_ALGORITHM_REFS,
  };
}

function createRecoveryArtifactChannelPolicy(
  definition: RestoreReportChannelDefinition,
  tenantRef: string,
  environmentRef: string,
): RecoveryArtifactChannelPolicy {
  return {
    policyId: `artifact-channel-policy-462-${definition.channelId}`,
    artifactTypes: definition.artifactTypes,
    presentationContractRef: "ArtifactPresentationContract",
    artifactSurfaceFrameRef: "ArtifactSurfaceFrame",
    artifactModeTruthProjectionRef: "ArtifactModeTruthProjection",
    rawObjectStoreUrlsAllowed: false,
    outboundGrantRequired: true,
    redactionMode: "minimum_necessary_summary_only",
    maskingPolicyHash: stableHash(`${tenantRef}:${environmentRef}:${definition.channelId}:masking`),
    retentionClass: "phase9_resilience_evidence_7y",
    archiveProtection: "immutable_legal_hold_capable",
    permittedSurfaceRefs: definition.surfaces,
  };
}

export function createRestoreReportChannelBinding(
  definition: RestoreReportChannelDefinition,
  options: {
    readonly tenantRef?: string;
    readonly environmentRef?: string;
    readonly releaseRef?: string;
    readonly selected?: boolean;
    readonly scenarioState?: BackupRestoreScenarioState | string | null;
    readonly secretRefOverride?: string;
  } = {},
): RestoreReportChannelBinding {
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const releaseRef = options.releaseRef ?? "release-wave-blue-42";
  const scenarioState = normalizeBackupRestoreScenarioState(options.scenarioState);
  const result = settlementResultForScenario(scenarioState, options.selected ?? false);
  const policy = createRecoveryArtifactChannelPolicy(definition, tenantRef, environmentRef);
  const secretRef =
    options.secretRefOverride ??
    (scenarioState === "missing_secret" && options.selected
      ? ""
      : restoreReportSecretRefForChannel(definition.channelId, tenantRef, environmentRef));
  const selectedArtifactType = definition.artifactTypes[0] ?? "restore_report";
  const settlement: RestoreReportDeliverySettlement = {
    settlementId: `restore-settlement-462-${definition.channelId}`,
    channelId: definition.channelId,
    deliveredAt: result === "delivered" ? "2026-04-28T10:22:00Z" : null,
    result,
    artifactType: selectedArtifactType,
    artifactRef: `recovery-artifact:462:${definition.channelId}:${selectedArtifactType}`,
    presentationGrantRef: `presentation-grant:462:${definition.channelId}:${selectedArtifactType}`,
    receiverRef: `fake-restore-report-receiver:phase9:${definition.channelId}`,
    receiverObserved: result === "delivered" || result === "failed",
    responseCode: result === "delivered" ? 202 : result === "failed" ? 503 : result === "withdrawn" ? 423 : 409,
    idempotencyKey: `${tenantRef}:${environmentRef}:${releaseRef}:${definition.channelId}:v1`,
    redactionPolicyHash: policy.maskingPolicyHash,
    retryAttemptCount: result === "failed" ? 3 : 0,
    fallbackDisposition:
      result === "failed" || result === "withdrawn"
        ? "queue_for_human_handoff"
        : "retain_on_resilience_board",
    failureReason: failureReasonForSettlement(result),
  };
  return {
    schemaVersion: BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
    channelId: definition.channelId,
    label: definition.label,
    tenantRef,
    environmentRef,
    releaseRef,
    destinationClass: definition.destinationClass,
    artifactTypes: definition.artifactTypes,
    artifactPresentationPolicy: policy,
    maskingRedactionPolicyHash: policy.maskingPolicyHash,
    permittedRecipients: definition.permittedRecipients,
    secretRef,
    secretHandleRef: secretRef,
    secretMaterialInline: false,
    receiverRef: settlement.receiverRef,
    settlementBehavior: "idempotent_upsert_by_artifact_tuple",
    safeFallbackDisposition: settlement.fallbackDisposition,
    retentionArchiveProtection:
      definition.destinationClass === "resilience_board_artifact_channel"
        ? "archive_only_immutable_legal_hold_capable"
        : "archive_only_retained_with_evidence_pack",
    latestSettlement: settlement,
    channelState: channelStateForResult(result),
    sourceRefs: SOURCE_ALGORITHM_REFS,
  };
}

export function createBackupTargetSyntheticPayload(
  binding: BackupTargetBinding,
): BackupTargetSyntheticPayload {
  return {
    schemaVersion: "462.phase9.fake-backup-target-payload.v1",
    bindingId: binding.bindingId,
    tenantRef: binding.tenantRef,
    environmentRef: binding.environmentRef,
    releaseRef: binding.releaseRef,
    datasetScope: binding.datasetScope,
    essentialFunctionRefs: binding.essentialFunctionRefs,
    backupSetManifestRef: binding.backupSetManifestRef,
    checksumAlgorithm: binding.checksumAlgorithm,
    checksumObserved: binding.latestVerificationRecord.checksumObserved,
    immutabilityProofRef: `immutability-proof:462:${binding.datasetScope}:${binding.releaseRef}`,
    restoreCompatibilityDigest: binding.latestVerificationRecord.restoreCompatibilityDigest,
    dependencyOrderDigest: binding.latestVerificationRecord.dependencyOrderDigest,
    resilienceTupleHash: binding.resilienceTupleHash,
    safeDescriptorHash: stableHash(`${binding.bindingId}:safe-backup-target-descriptor`),
  };
}

export function createRestoreReportSyntheticPayload(
  channel: RestoreReportChannelBinding,
): RestoreReportSyntheticPayload {
  return {
    schemaVersion: "462.phase9.fake-restore-report-payload.v1",
    channelId: channel.channelId,
    tenantRef: channel.tenantRef,
    environmentRef: channel.environmentRef,
    releaseRef: channel.releaseRef,
    artifactType: channel.latestSettlement.artifactType,
    artifactRef: channel.latestSettlement.artifactRef,
    presentationGrantRef: channel.latestSettlement.presentationGrantRef,
    redactionPolicyHash: channel.maskingRedactionPolicyHash,
    retentionClass: channel.artifactPresentationPolicy.retentionClass,
    receiverRef: channel.receiverRef,
    safeDescriptorHash: stableHash(`${channel.channelId}:safe-restore-report-descriptor`),
  };
}

function createFakeBackupTargetRecord(binding: BackupTargetBinding): FakeBackupTargetRecord {
  const payload = createBackupTargetSyntheticPayload(binding);
  const responseCode =
    binding.latestVerificationRecord.status === "verified"
      ? 202
      : binding.latestVerificationRecord.status === "missing_immutability_proof"
        ? 423
        : 409;
  return {
    targetRecordId: `fake-backup-target-record-462-${slug(binding.datasetScope)}`,
    bindingId: binding.bindingId,
    targetRef: binding.latestVerificationRecord.fakeTargetRef,
    observedAt: binding.latestVerificationRecord.verifiedAt,
    accepted: binding.latestVerificationRecord.status === "verified",
    responseCode,
    payloadHash: stableHash(JSON.stringify(payload)),
    payload,
  };
}

function createFakeRestoreReportReceiverRecord(
  channel: RestoreReportChannelBinding,
): FakeRestoreReportReceiverRecord {
  const payload = createRestoreReportSyntheticPayload(channel);
  return {
    receiverRecordId: `fake-restore-report-record-462-${channel.channelId}`,
    channelId: channel.channelId,
    receiverRef: channel.receiverRef,
    observedAt: channel.latestSettlement.deliveredAt ?? "2026-04-28T10:22:00Z",
    accepted: channel.latestSettlement.result === "delivered",
    responseCode:
      channel.latestSettlement.result === "delivered"
        ? 202
        : channel.latestSettlement.result === "failed"
          ? 503
          : 409,
    payloadHash: stableHash(JSON.stringify(payload)),
    payload,
  };
}

function buildReadiness(
  targetBindings: readonly BackupTargetBinding[],
  reportChannels: readonly RestoreReportChannelBinding[],
  scenarioState: BackupRestoreScenarioState,
): BackupRestoreReadinessProjection {
  const blockedTargets = targetBindings.filter(
    (binding) => binding.latestVerificationRecord.status !== "verified",
  );
  const staleTargets = targetBindings.filter(
    (binding) => binding.latestVerificationRecord.status === "stale_checksum",
  );
  const blockedChannels = reportChannels.filter(
    (channel) => channel.latestSettlement.result !== "delivered",
  );
  const drifted = scenarioState === "tuple_drift";
  const readinessState: BackupRestoreReadinessState =
    blockedTargets.length === 0 && blockedChannels.length === 0 && !drifted
      ? "ready"
      : staleTargets.length > 0 || scenarioState === "tuple_drift"
        ? "stale"
        : scenarioState === "target_creation"
          ? "diagnostic"
          : "blocked";
  const recoveryControlState: RecoveryControlState =
    readinessState === "ready"
      ? "live_control"
      : readinessState === "diagnostic"
        ? "diagnostic_only"
        : "blocked";
  return {
    route: "/ops/resilience",
    readinessState,
    recoveryControlState,
    evidencePackState:
      readinessState === "ready" ? "current" : readinessState === "stale" ? "stale" : "blocked",
    tupleState: drifted ? "drifted" : "exact",
    targetReadyCount: targetBindings.length - blockedTargets.length,
    targetBlockedCount: blockedTargets.length,
    channelReadyCount: reportChannels.length - blockedChannels.length,
    channelBlockedCount: blockedChannels.length,
    blockedTargetRefs: blockedTargets.map((binding) => binding.bindingId),
    blockedChannelRefs: blockedChannels.map((channel) => channel.channelId),
    summary:
      readinessState === "ready"
        ? "Backup targets, restore report channels, artifact grants, and recovery tuple are current."
        : `Recovery controls downgraded because ${blockedTargets.length} backup target and ${blockedChannels.length} report channel checks require settlement.`,
  };
}

export function createBackupRestoreChannelRegistryProjection(
  options: {
    readonly scenarioState?: BackupRestoreScenarioState | string | null;
    readonly tenantRef?: string;
    readonly environmentRef?: string;
    readonly releaseRef?: string;
    readonly selectedDatasetScope?: BackupDatasetScope;
    readonly selectedChannelId?: string;
    readonly targetSecretRefOverride?: string;
    readonly reportSecretRefOverride?: string;
  } = {},
): BackupRestoreChannelRegistryProjection {
  const scenarioState = normalizeBackupRestoreScenarioState(options.scenarioState);
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const releaseRef = options.releaseRef ?? "release-wave-blue-42";
  const selectedDefinition =
    BACKUP_DATASET_DEFINITIONS.find(
      (definition) => definition.datasetScope === options.selectedDatasetScope,
    ) ?? BACKUP_DATASET_DEFINITIONS[0]!;
  const selectedChannelDefinition =
    RESTORE_REPORT_CHANNEL_DEFINITIONS.find(
      (definition) => definition.channelId === options.selectedChannelId,
    ) ?? RESTORE_REPORT_CHANNEL_DEFINITIONS[0]!;
  const targetBindings = BACKUP_DATASET_DEFINITIONS.map((definition) =>
    createBackupTargetBinding(definition, {
      tenantRef,
      environmentRef,
      releaseRef,
      selected: definition.datasetScope === selectedDefinition.datasetScope,
      scenarioState,
      secretRefOverride:
        definition.datasetScope === selectedDefinition.datasetScope
          ? options.targetSecretRefOverride
          : undefined,
    }),
  );
  const reportChannels = RESTORE_REPORT_CHANNEL_DEFINITIONS.map((definition) =>
    createRestoreReportChannelBinding(definition, {
      tenantRef,
      environmentRef,
      releaseRef,
      selected: definition.channelId === selectedChannelDefinition.channelId,
      scenarioState,
      secretRefOverride:
        definition.channelId === selectedChannelDefinition.channelId
          ? options.reportSecretRefOverride
          : undefined,
    }),
  );
  const selectedTargetBinding =
    targetBindings.find((binding) => binding.datasetScope === selectedDefinition.datasetScope) ??
    targetBindings[0]!;
  const selectedChannel =
    reportChannels.find((channel) => channel.channelId === selectedChannelDefinition.channelId) ??
    reportChannels[0]!;
  const verificationRecords = targetBindings.map((binding) => binding.latestVerificationRecord);
  const deliverySettlements = reportChannels.map((channel) => channel.latestSettlement);
  const artifactPolicies = reportChannels.map((channel) => channel.artifactPresentationPolicy);
  const fakeBackupTargetRecords = targetBindings
    .filter((binding) => binding.latestVerificationRecord.fakeTargetObserved)
    .map(createFakeBackupTargetRecord);
  const fakeRestoreReportReceiverRecords = reportChannels
    .filter((channel) => channel.latestSettlement.receiverObserved)
    .map(createFakeRestoreReportReceiverRecord);
  const readiness = buildReadiness(targetBindings, reportChannels, scenarioState);
  return {
    schemaVersion: BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
    visualMode: BACKUP_RESTORE_CHANNEL_VISUAL_MODE,
    scenarioState,
    tenantRef,
    environmentRef,
    releaseRef,
    selectedDatasetScope: selectedTargetBinding.datasetScope,
    selectedTargetBindingId: selectedTargetBinding.bindingId,
    selectedTargetBinding,
    selectedChannelId: selectedChannel.channelId,
    selectedChannel,
    targetBindings,
    reportChannels,
    verificationRecords,
    deliverySettlements,
    artifactPolicies,
    fakeBackupTargetRecords,
    fakeRestoreReportReceiverRecords,
    readiness,
    registryHash: stableHash(
      JSON.stringify([
        targetBindings.map((binding) => [
          binding.bindingId,
          binding.latestVerificationRecord.status,
          binding.latestVerificationRecord.checksumObserved,
          binding.resilienceTupleHash,
        ]),
        reportChannels.map((channel) => [channel.channelId, channel.latestSettlement.result]),
      ]),
    ),
    noRawArtifactUrls: true,
    automationAnchors: AUTOMATION_ANCHORS,
    sourceAlgorithmRefs: SOURCE_ALGORITHM_REFS,
    interfaceGapArtifactRef: BACKUP_RESTORE_CHANNEL_GAP_ARTIFACT_REF,
  };
}

export function upsertBackupTargetBinding(
  bindings: readonly BackupTargetBinding[],
  candidate: BackupTargetBinding,
): readonly BackupTargetBinding[] {
  const naturalKey = `${candidate.tenantRef}:${candidate.environmentRef}:${candidate.releaseRef}:${candidate.datasetScope}`;
  const existingIndex = bindings.findIndex(
    (binding) =>
      `${binding.tenantRef}:${binding.environmentRef}:${binding.releaseRef}:${binding.datasetScope}` ===
      naturalKey,
  );
  if (existingIndex === -1) {
    return [...bindings, candidate];
  }
  return bindings.map((binding, index) => (index === existingIndex ? candidate : binding));
}

export function upsertRestoreReportChannelBinding(
  channels: readonly RestoreReportChannelBinding[],
  candidate: RestoreReportChannelBinding,
): readonly RestoreReportChannelBinding[] {
  const naturalKey = candidate.latestSettlement.idempotencyKey;
  const existingIndex = channels.findIndex(
    (channel) => channel.latestSettlement.idempotencyKey === naturalKey,
  );
  if (existingIndex === -1) {
    return [...channels, candidate];
  }
  return channels.map((channel, index) => (index === existingIndex ? candidate : channel));
}

export function verifyBackupTargetBinding(
  binding: BackupTargetBinding,
): {
  readonly binding: BackupTargetBinding;
  readonly verification: BackupTargetVerificationRecord;
  readonly fakeBackupTargetRecord: FakeBackupTargetRecord;
} {
  const definition =
    BACKUP_DATASET_DEFINITIONS.find(
      (candidate) => candidate.datasetScope === binding.datasetScope,
    ) ?? BACKUP_DATASET_DEFINITIONS[0]!;
  const verified = createBackupTargetBinding(definition, {
    tenantRef: binding.tenantRef,
    environmentRef: binding.environmentRef,
    releaseRef: binding.releaseRef,
    selected: true,
    scenarioState: "normal",
    secretRefOverride: binding.secretRef,
  });
  return {
    binding: verified,
    verification: verified.latestVerificationRecord,
    fakeBackupTargetRecord: createFakeBackupTargetRecord(verified),
  };
}

export function settleRestoreReportChannel(
  channel: RestoreReportChannelBinding,
): {
  readonly channel: RestoreReportChannelBinding;
  readonly settlement: RestoreReportDeliverySettlement;
  readonly fakeReceiverRecord: FakeRestoreReportReceiverRecord;
} {
  const definition =
    RESTORE_REPORT_CHANNEL_DEFINITIONS.find(
      (candidate) => candidate.channelId === channel.channelId,
    ) ?? RESTORE_REPORT_CHANNEL_DEFINITIONS[0]!;
  const settled = createRestoreReportChannelBinding(definition, {
    tenantRef: channel.tenantRef,
    environmentRef: channel.environmentRef,
    releaseRef: channel.releaseRef,
    selected: true,
    scenarioState: "normal",
    secretRefOverride: channel.secretRef,
  });
  return {
    channel: settled,
    settlement: settled.latestSettlement,
    fakeReceiverRecord: createFakeRestoreReportReceiverRecord(settled),
  };
}

export function createBackupRestoreChannelRegistryFixture() {
  const scenarios = [
    "normal",
    "target_creation",
    "stale_checksum",
    "missing_secret",
    "missing_immutability_proof",
    "report_delivery_failed",
    "unsupported_scope",
    "tuple_drift",
    "withdrawn_channel",
  ] as const satisfies readonly BackupRestoreScenarioState[];
  return {
    schemaVersion: BACKUP_RESTORE_CHANNEL_SCHEMA_VERSION,
    visualMode: BACKUP_RESTORE_CHANNEL_VISUAL_MODE,
    requiredBackupDatasetScopes,
    requiredRecoveryArtifactTypes,
    sourceAlgorithmRefs: SOURCE_ALGORITHM_REFS,
    automationAnchors: AUTOMATION_ANCHORS,
    scenarioProjections: Object.fromEntries(
      scenarios.map((scenarioState) => [
        scenarioState,
        createBackupRestoreChannelRegistryProjection({ scenarioState }),
      ]),
    ) as Record<BackupRestoreScenarioState, BackupRestoreChannelRegistryProjection>,
  };
}
