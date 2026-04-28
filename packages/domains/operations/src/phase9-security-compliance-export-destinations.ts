export const SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION =
  "463.phase9.security-compliance-export-destination.v1";
export const SECURITY_COMPLIANCE_EXPORT_VISUAL_MODE =
  "Security_Compliance_Export_Control_Ledger";
export const SECURITY_COMPLIANCE_EXPORT_GAP_ARTIFACT_REF =
  "PHASE9_BATCH_458_472_INTERFACE_GAP_463_SECURITY_COMPLIANCE_EXPORT_DESTINATIONS";

export type SecurityComplianceExportScenarioState =
  | "normal"
  | "missing_secret"
  | "missing_destination"
  | "denied_scope"
  | "stale_graph"
  | "stale_redaction_policy"
  | "blocked_graph"
  | "blocked_redaction"
  | "delivery_failed"
  | "permission_denied"
  | "reportability_pending";

export type ExportDestinationClass =
  | "reportable_data_security_incident_handoff"
  | "internal_security_incident_report_bundle"
  | "near_miss_learning_summary_destination"
  | "dspt_operational_evidence_pack_export"
  | "dtac_evidence_refresh_export"
  | "dcb0129_manufacturer_safety_pack_delta_export"
  | "dcb0160_deployment_handoff_pack_export"
  | "nhs_app_integrated_channel_operational_pack_export"
  | "audit_investigation_bundle_export"
  | "archive_manifest_deletion_certificate_export"
  | "recovery_evidence_pack_export"
  | "cross_phase_conformance_scorecard_export";

export type ExportArtifactClass =
  | "reportable_incident_handoff"
  | "internal_security_incident_report"
  | "near_miss_learning_summary"
  | "dspt_operational_evidence_pack"
  | "dtac_evidence_refresh_pack"
  | "dcb0129_manufacturer_safety_pack_delta"
  | "dcb0160_deployment_handoff_pack"
  | "nhs_app_operational_pack"
  | "audit_investigation_bundle"
  | "archive_manifest"
  | "deletion_certificate"
  | "recovery_evidence_pack"
  | "cross_phase_conformance_scorecard";

export type ExportFrameworkCode =
  | "DSPT"
  | "DTAC"
  | "DCB0129"
  | "DCB0160"
  | "NHS_APP_CHANNEL"
  | "AUDIT"
  | "RECORDS"
  | "RESILIENCE"
  | "CONFORMANCE"
  | "LOCAL_TENANT";

export type ExportDestinationKind = "security_reporting" | "compliance_export";
export type ExportVerificationState =
  | "verified"
  | "missing_secret"
  | "missing_destination"
  | "denied_scope"
  | "stale_graph"
  | "stale_redaction_policy"
  | "blocked_graph"
  | "blocked_redaction"
  | "failed"
  | "permission_denied"
  | "reportability_pending";
export type ExportDeliveryResult =
  | "delivered"
  | "blocked_graph"
  | "blocked_redaction"
  | "stale"
  | "failed"
  | "denied_scope"
  | "permission_denied"
  | "missing_destination"
  | "pending_reportability";
export type ExportSourceSurface =
  | "assurance"
  | "incident"
  | "audit"
  | "records"
  | "resilience"
  | "conformance";
export type ExportSourceReadinessState =
  | "ready"
  | "stale"
  | "blocked"
  | "permission_denied"
  | "pending";

export interface ComplianceExportPolicyBinding {
  readonly policyId: string;
  readonly frameworkCode: ExportFrameworkCode;
  readonly frameworkVersionRef: string;
  readonly standardsVersionMapRef: string;
  readonly artifactClassesAllowed: readonly ExportArtifactClass[];
  readonly redactionPolicyHash: string;
  readonly exportManifestHash: string;
  readonly reproductionHash: string;
  readonly artifactPresentationContractRef: "ArtifactPresentationContract";
  readonly artifactSurfaceFrameRef: "ArtifactSurfaceFrame";
  readonly artifactModeTruthProjectionRef: "ArtifactModeTruthProjection";
  readonly outboundNavigationGrantPolicyRef: "OutboundNavigationGrant";
  readonly rawExportUrlsAllowed: false;
  readonly unmanagedDownloadAllowed: false;
  readonly retentionClass:
    | "security_reporting_evidence_8y"
    | "compliance_export_evidence_8y"
    | "records_governance_manifest_per_code";
  readonly legalHoldBehavior: "preserve_on_hold_or_inquiry" | "archive_only_legal_hold_capable";
}

export interface ExportDestinationVerificationRecord {
  readonly verificationId: string;
  readonly bindingId: string;
  readonly verifiedAt: string;
  readonly status: ExportVerificationState;
  readonly checkedBy: "playwright:463_security_compliance_exports";
  readonly fakeReceiverRef: string;
  readonly secretRef: string;
  readonly serializedArtifactHash: string;
  readonly redactionPolicyHash: string;
  readonly exportManifestHash: string;
  readonly reproductionHash: string;
  readonly reproductionState: "exact" | "drifted" | "blocked";
  readonly frameworkVersionHash: string;
  readonly graphHash: string;
  readonly graphVerdictRef: string;
  readonly outboundGrantRef: string;
  readonly artifactPresentationContractRef: "ArtifactPresentationContract";
  readonly syntheticPayloadHash: string;
  readonly fakeReceiverObserved: boolean;
  readonly failureReason?: string;
}

export interface ExportDeliverySettlement {
  readonly settlementId: string;
  readonly bindingId: string;
  readonly idempotencyKey: string;
  readonly deliveredAt: string | null;
  readonly result: ExportDeliveryResult;
  readonly artifactClass: ExportArtifactClass;
  readonly artifactRef: string;
  readonly artifactTransferSettlementRef: string;
  readonly outboundNavigationGrantRef: string;
  readonly receiverRef: string;
  readonly receiverObserved: boolean;
  readonly responseCode: 202 | 409 | 423 | 451 | 503;
  readonly retryAttemptCount: number;
  readonly fallbackDisposition:
    | "retain_same_shell_summary"
    | "queue_governed_human_handoff"
    | "block_until_graph_or_redaction_revalidated";
  readonly authoritativeTransferState:
    | "ready"
    | "blocked"
    | "stale"
    | "failed"
    | "pending_reportability";
  readonly failureReason?: string;
}

export interface ReportabilityHandoffVerificationRecord {
  readonly reportabilityVerificationId: string;
  readonly bindingId: string;
  readonly incidentRef: string;
  readonly frameworkRef: "DSPT";
  readonly decision: "reportable" | "not_reportable" | "needs_senior_review";
  readonly handoffState: "verified" | "pending" | "blocked" | "submitted" | "acknowledged";
  readonly decisionHash: string;
  readonly supportingFactsHash: string;
  readonly outboundNavigationGrantRef: string;
  readonly syntheticPayloadHash: string;
  readonly checkedBy: "playwright:463_security_reporting_destinations";
}

export interface GovernedExportDestinationBinding {
  readonly schemaVersion: typeof SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION;
  readonly bindingId: string;
  readonly destinationClass: ExportDestinationClass;
  readonly destinationKind: ExportDestinationKind;
  readonly label: string;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly frameworkCode: ExportFrameworkCode;
  readonly artifactClassesAllowed: readonly ExportArtifactClass[];
  readonly sourceSurfaceRefs: readonly ExportSourceSurface[];
  readonly audience: string;
  readonly purposeOfUse: string;
  readonly allowedHandoffMode:
    | "same_shell_summary"
    | "external_browser_handoff"
    | "governed_secure_delivery";
  readonly redactionPolicyHash: string;
  readonly maskingPolicyRef: string;
  readonly policyBinding: ComplianceExportPolicyBinding;
  readonly artifactPresentationContractRef: "ArtifactPresentationContract";
  readonly outboundNavigationGrantPolicyRef: "OutboundNavigationGrant";
  readonly retentionClass: ComplianceExportPolicyBinding["retentionClass"];
  readonly legalHoldBehavior: ComplianceExportPolicyBinding["legalHoldBehavior"];
  readonly secretRef: string;
  readonly secretHandleRef: string;
  readonly secretMaterialInline: false;
  readonly endpointAlias: string;
  readonly latestVerificationRecord: ExportDestinationVerificationRecord;
  readonly latestDeliverySettlement: ExportDeliverySettlement;
  readonly failureFallbackDisposition: ExportDeliverySettlement["fallbackDisposition"];
  readonly bindingState: "live" | "stale" | "blocked" | "permission_denied" | "missing";
  readonly sourceRefs: readonly string[];
}

export interface SecurityReportingDestinationBinding extends GovernedExportDestinationBinding {
  readonly destinationKind: "security_reporting";
  readonly reportabilityHandoffVerificationRecord: ReportabilityHandoffVerificationRecord;
}

export interface ExportArtifactFixture {
  readonly artifactFixtureId: string;
  readonly artifactClass: ExportArtifactClass;
  readonly artifactRef: string;
  readonly summary: string;
  readonly serializedArtifactHash: string;
  readonly exportManifestHash: string;
  readonly reproductionHash: string;
  readonly graphHash: string;
  readonly redactionPolicyHash: string;
  readonly rawExportUrl: null;
}

export interface SecurityReportingSyntheticPayload {
  readonly schemaVersion: "463.phase9.fake-security-reporting-payload.v1";
  readonly bindingId: string;
  readonly destinationClass: ExportDestinationClass;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly frameworkCode: ExportFrameworkCode;
  readonly reportabilityDecision: ReportabilityHandoffVerificationRecord["decision"];
  readonly handoffState: ReportabilityHandoffVerificationRecord["handoffState"];
  readonly artifactClassesAllowed: readonly ExportArtifactClass[];
  readonly serializedArtifactHash: string;
  readonly exportManifestHash: string;
  readonly redactionPolicyHash: string;
  readonly outboundNavigationGrantRef: string;
  readonly safeSummaryHash: string;
}

export interface ComplianceExportSyntheticPayload {
  readonly schemaVersion: "463.phase9.fake-compliance-export-payload.v1";
  readonly bindingId: string;
  readonly destinationClass: ExportDestinationClass;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly frameworkCode: ExportFrameworkCode;
  readonly artifactClass: ExportArtifactClass;
  readonly artifactRef: string;
  readonly standardsVersionMapRef: string;
  readonly serializedArtifactHash: string;
  readonly exportManifestHash: string;
  readonly reproductionHash: string;
  readonly redactionPolicyHash: string;
  readonly artifactPresentationContractRef: "ArtifactPresentationContract";
  readonly outboundNavigationGrantRef: string;
  readonly safeSummaryHash: string;
}

export interface FakeSecurityReportingReceiverRecord {
  readonly receiverRecordId: string;
  readonly bindingId: string;
  readonly receiverRef: string;
  readonly observedAt: string;
  readonly accepted: boolean;
  readonly responseCode: 202 | 409 | 451 | 503;
  readonly payloadHash: string;
  readonly payload: SecurityReportingSyntheticPayload;
}

export interface FakeComplianceExportReceiverRecord {
  readonly receiverRecordId: string;
  readonly bindingId: string;
  readonly receiverRef: string;
  readonly observedAt: string;
  readonly accepted: boolean;
  readonly responseCode: 202 | 409 | 423 | 503;
  readonly payloadHash: string;
  readonly payload: ComplianceExportSyntheticPayload;
}

export interface ExportSourceSurfaceReadinessProjection {
  readonly surface: ExportSourceSurface;
  readonly route:
    | "/ops/assurance"
    | "/ops/incidents"
    | "/ops/audit"
    | "/ops/governance/records"
    | "/ops/resilience"
    | "/ops/conformance";
  readonly readinessState: ExportSourceReadinessState;
  readonly destinationRefs: readonly string[];
  readonly blockedDestinationRefs: readonly string[];
  readonly summary: string;
}

export interface SecurityComplianceExportRegistryProjection {
  readonly schemaVersion: typeof SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION;
  readonly visualMode: typeof SECURITY_COMPLIANCE_EXPORT_VISUAL_MODE;
  readonly scenarioState: SecurityComplianceExportScenarioState;
  readonly tenantRef: string;
  readonly environmentRef: string;
  readonly selectedDestinationClass: ExportDestinationClass;
  readonly selectedBindingId: string;
  readonly selectedBinding: GovernedExportDestinationBinding;
  readonly bindings: readonly GovernedExportDestinationBinding[];
  readonly securityReportingBindings: readonly SecurityReportingDestinationBinding[];
  readonly complianceExportBindings: readonly GovernedExportDestinationBinding[];
  readonly verificationRecords: readonly ExportDestinationVerificationRecord[];
  readonly deliverySettlements: readonly ExportDeliverySettlement[];
  readonly reportabilityHandoffRecords: readonly ReportabilityHandoffVerificationRecord[];
  readonly artifactFixtures: readonly ExportArtifactFixture[];
  readonly fakeSecurityReportingReceiverRecords: readonly FakeSecurityReportingReceiverRecord[];
  readonly fakeComplianceExportReceiverRecords: readonly FakeComplianceExportReceiverRecord[];
  readonly sourceReadiness: readonly ExportSourceSurfaceReadinessProjection[];
  readonly registryHash: string;
  readonly readyCount: number;
  readonly blockedCount: number;
  readonly staleCount: number;
  readonly failedCount: number;
  readonly permissionDeniedCount: number;
  readonly noRawExportUrls: true;
  readonly automationAnchors: readonly string[];
  readonly sourceAlgorithmRefs: readonly string[];
  readonly interfaceGapArtifactRef: typeof SECURITY_COMPLIANCE_EXPORT_GAP_ARTIFACT_REF;
}

export interface ExportDestinationDefinition {
  readonly destinationClass: ExportDestinationClass;
  readonly destinationKind: ExportDestinationKind;
  readonly label: string;
  readonly frameworkCode: ExportFrameworkCode;
  readonly artifactClassesAllowed: readonly ExportArtifactClass[];
  readonly sourceSurfaceRefs: readonly ExportSourceSurface[];
  readonly audience: string;
  readonly purposeOfUse: string;
  readonly allowedHandoffMode: GovernedExportDestinationBinding["allowedHandoffMode"];
  readonly retentionClass: ComplianceExportPolicyBinding["retentionClass"];
  readonly legalHoldBehavior: ComplianceExportPolicyBinding["legalHoldBehavior"];
}

const DESTINATION_DEFINITIONS = [
  {
    destinationClass: "reportable_data_security_incident_handoff",
    destinationKind: "security_reporting",
    label: "Reportable data-security incident handoff",
    frameworkCode: "DSPT",
    artifactClassesAllowed: ["reportable_incident_handoff"],
    sourceSurfaceRefs: ["incident", "assurance"],
    audience: "DSPT incident reporter and data protection officer",
    purposeOfUse: "Submit reportable data-security incidents through the governed DSPT handoff path.",
    allowedHandoffMode: "external_browser_handoff",
    retentionClass: "security_reporting_evidence_8y",
    legalHoldBehavior: "preserve_on_hold_or_inquiry",
  },
  {
    destinationClass: "internal_security_incident_report_bundle",
    destinationKind: "security_reporting",
    label: "Internal security incident report bundle",
    frameworkCode: "LOCAL_TENANT",
    artifactClassesAllowed: ["internal_security_incident_report"],
    sourceSurfaceRefs: ["incident", "audit", "assurance"],
    audience: "Security owner and incident commander",
    purposeOfUse: "Deliver redacted internal incident bundles with timeline and containment proof.",
    allowedHandoffMode: "same_shell_summary",
    retentionClass: "security_reporting_evidence_8y",
    legalHoldBehavior: "preserve_on_hold_or_inquiry",
  },
  {
    destinationClass: "near_miss_learning_summary_destination",
    destinationKind: "security_reporting",
    label: "Near-miss learning summary destination",
    frameworkCode: "LOCAL_TENANT",
    artifactClassesAllowed: ["near_miss_learning_summary"],
    sourceSurfaceRefs: ["incident", "assurance"],
    audience: "Safety learning owner",
    purposeOfUse: "Route near-miss learning summaries without widening incident detail.",
    allowedHandoffMode: "same_shell_summary",
    retentionClass: "security_reporting_evidence_8y",
    legalHoldBehavior: "archive_only_legal_hold_capable",
  },
  {
    destinationClass: "dspt_operational_evidence_pack_export",
    destinationKind: "compliance_export",
    label: "DSPT operational evidence pack export",
    frameworkCode: "DSPT",
    artifactClassesAllowed: ["dspt_operational_evidence_pack"],
    sourceSurfaceRefs: ["assurance", "conformance"],
    audience: "DSPT assurance owner",
    purposeOfUse: "Export the current DSPT operational evidence pack through a governed artifact transfer.",
    allowedHandoffMode: "governed_secure_delivery",
    retentionClass: "compliance_export_evidence_8y",
    legalHoldBehavior: "preserve_on_hold_or_inquiry",
  },
  {
    destinationClass: "dtac_evidence_refresh_export",
    destinationKind: "compliance_export",
    label: "DTAC evidence refresh export",
    frameworkCode: "DTAC",
    artifactClassesAllowed: ["dtac_evidence_refresh_pack"],
    sourceSurfaceRefs: ["assurance", "conformance"],
    audience: "DTAC assessment owner",
    purposeOfUse: "Export refreshed DTAC evidence bound to the current standards map.",
    allowedHandoffMode: "governed_secure_delivery",
    retentionClass: "compliance_export_evidence_8y",
    legalHoldBehavior: "archive_only_legal_hold_capable",
  },
  {
    destinationClass: "dcb0129_manufacturer_safety_pack_delta_export",
    destinationKind: "compliance_export",
    label: "DCB0129 manufacturer safety pack delta export",
    frameworkCode: "DCB0129",
    artifactClassesAllowed: ["dcb0129_manufacturer_safety_pack_delta"],
    sourceSurfaceRefs: ["assurance", "conformance"],
    audience: "Clinical safety manufacturer owner",
    purposeOfUse: "Export manufacturer safety case deltas with clinical-risk evidence hashes.",
    allowedHandoffMode: "governed_secure_delivery",
    retentionClass: "compliance_export_evidence_8y",
    legalHoldBehavior: "preserve_on_hold_or_inquiry",
  },
  {
    destinationClass: "dcb0160_deployment_handoff_pack_export",
    destinationKind: "compliance_export",
    label: "DCB0160 deployment handoff pack export",
    frameworkCode: "DCB0160",
    artifactClassesAllowed: ["dcb0160_deployment_handoff_pack"],
    sourceSurfaceRefs: ["assurance", "conformance"],
    audience: "Deploying organisation clinical safety owner",
    purposeOfUse: "Export deployment handoff safety packs for operational clinical-risk governance.",
    allowedHandoffMode: "governed_secure_delivery",
    retentionClass: "compliance_export_evidence_8y",
    legalHoldBehavior: "preserve_on_hold_or_inquiry",
  },
  {
    destinationClass: "nhs_app_integrated_channel_operational_pack_export",
    destinationKind: "compliance_export",
    label: "Monthly NHS App and integrated-channel operational pack export",
    frameworkCode: "NHS_APP_CHANNEL",
    artifactClassesAllowed: ["nhs_app_operational_pack"],
    sourceSurfaceRefs: ["assurance", "conformance"],
    audience: "Integrated-channel service owner",
    purposeOfUse: "Export monthly operational channel packs with current route and continuity proof.",
    allowedHandoffMode: "governed_secure_delivery",
    retentionClass: "compliance_export_evidence_8y",
    legalHoldBehavior: "archive_only_legal_hold_capable",
  },
  {
    destinationClass: "audit_investigation_bundle_export",
    destinationKind: "compliance_export",
    label: "Audit investigation bundle export",
    frameworkCode: "AUDIT",
    artifactClassesAllowed: ["audit_investigation_bundle"],
    sourceSurfaceRefs: ["audit", "incident"],
    audience: "Audit reviewer",
    purposeOfUse: "Export investigation bundles bound to scope, timeline, graph verdict, and masking policy.",
    allowedHandoffMode: "same_shell_summary",
    retentionClass: "security_reporting_evidence_8y",
    legalHoldBehavior: "preserve_on_hold_or_inquiry",
  },
  {
    destinationClass: "archive_manifest_deletion_certificate_export",
    destinationKind: "compliance_export",
    label: "Archive manifest and deletion certificate export",
    frameworkCode: "RECORDS",
    artifactClassesAllowed: ["archive_manifest", "deletion_certificate"],
    sourceSurfaceRefs: ["records", "assurance"],
    audience: "Records governance lead",
    purposeOfUse: "Export lifecycle manifests and deletion certificates through governed records policy.",
    allowedHandoffMode: "same_shell_summary",
    retentionClass: "records_governance_manifest_per_code",
    legalHoldBehavior: "preserve_on_hold_or_inquiry",
  },
  {
    destinationClass: "recovery_evidence_pack_export",
    destinationKind: "compliance_export",
    label: "Recovery evidence pack export",
    frameworkCode: "RESILIENCE",
    artifactClassesAllowed: ["recovery_evidence_pack"],
    sourceSurfaceRefs: ["resilience", "assurance"],
    audience: "Resilience lead",
    purposeOfUse: "Export recovery evidence packs while preserving artifact grant and graph parity.",
    allowedHandoffMode: "governed_secure_delivery",
    retentionClass: "compliance_export_evidence_8y",
    legalHoldBehavior: "archive_only_legal_hold_capable",
  },
  {
    destinationClass: "cross_phase_conformance_scorecard_export",
    destinationKind: "compliance_export",
    label: "Cross-phase conformance scorecard export",
    frameworkCode: "CONFORMANCE",
    artifactClassesAllowed: ["cross_phase_conformance_scorecard"],
    sourceSurfaceRefs: ["conformance", "assurance"],
    audience: "Service owner and governance lead",
    purposeOfUse: "Export the current cross-phase conformance scorecard only when proof rows remain exact.",
    allowedHandoffMode: "governed_secure_delivery",
    retentionClass: "compliance_export_evidence_8y",
    legalHoldBehavior: "archive_only_legal_hold_capable",
  },
] as const satisfies readonly ExportDestinationDefinition[];

const ARTIFACT_FIXTURE_CLASSES = [
  "dspt_operational_evidence_pack",
  "audit_investigation_bundle",
  "deletion_certificate",
  "archive_manifest",
  "recovery_evidence_pack",
  "cross_phase_conformance_scorecard",
] as const satisfies readonly ExportArtifactClass[];

const SOURCE_ALGORITHM_REFS = [
  "blueprint/phase-9-the-assurance-ledger.md#9C-audit-explorer-break-glass-review-and-support-replay",
  "blueprint/phase-9-the-assurance-ledger.md#9D-assurance-pack-factory-and-standards-evidence-pipeline",
  "blueprint/phase-9-the-assurance-ledger.md#9E-records-lifecycle-retention-legal-hold-and-deletion-engine",
  "blueprint/phase-9-the-assurance-ledger.md#9G-security-operations-incident-workflow-and-just-culture-reporting",
  "blueprint/phase-9-the-assurance-ledger.md#9I-full-program-exercises-bau-transfer-and-formal-exit-gate",
  "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
  "blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant",
  "blueprint/governance-admin-console-frontend-blueprint.md#compliance-and-evidence",
  "blueprint/platform-admin-and-config-blueprint.md#destination-governance",
];

const AUTOMATION_ANCHORS = [
  "security-compliance-export-config-surface",
  "security-compliance-export-scope-ribbon",
  "security-compliance-export-wizard",
  "security-compliance-export-readiness-strip",
  "export-destination-table",
  "fake-security-reporting-receiver-ledger",
  "fake-compliance-export-receiver-ledger",
  "export-artifact-policy-rail",
  "security-compliance-export-error-summary",
];

export const requiredExportDestinationClasses = DESTINATION_DEFINITIONS.map(
  (definition) => definition.destinationClass,
);
export const requiredExportArtifactClasses = [
  ...new Set(DESTINATION_DEFINITIONS.flatMap((definition) => definition.artifactClassesAllowed)),
] as readonly ExportArtifactClass[];
export const exportDestinationClassOptions = DESTINATION_DEFINITIONS.map((definition) => ({
  value: definition.destinationClass,
  label: definition.label,
  frameworkCode: definition.frameworkCode,
  destinationKind: definition.destinationKind,
}));

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
  return value.replace(/_/g, "-").toLowerCase();
}

function verificationStateForScenario(
  scenarioState: SecurityComplianceExportScenarioState,
  selected: boolean,
): ExportVerificationState {
  if (!selected) return "verified";
  switch (scenarioState) {
    case "missing_secret":
      return "missing_secret";
    case "missing_destination":
      return "missing_destination";
    case "denied_scope":
      return "denied_scope";
    case "stale_graph":
      return "stale_graph";
    case "stale_redaction_policy":
      return "stale_redaction_policy";
    case "blocked_graph":
      return "blocked_graph";
    case "blocked_redaction":
      return "blocked_redaction";
    case "delivery_failed":
      return "failed";
    case "permission_denied":
      return "permission_denied";
    case "reportability_pending":
      return "reportability_pending";
    case "normal":
      return "verified";
  }
}

function deliveryResultForState(status: ExportVerificationState): ExportDeliveryResult {
  switch (status) {
    case "verified":
      return "delivered";
    case "stale_graph":
    case "stale_redaction_policy":
      return "stale";
    case "blocked_graph":
      return "blocked_graph";
    case "blocked_redaction":
      return "blocked_redaction";
    case "failed":
      return "failed";
    case "denied_scope":
      return "denied_scope";
    case "permission_denied":
      return "permission_denied";
    case "missing_destination":
    case "missing_secret":
      return "missing_destination";
    case "reportability_pending":
      return "pending_reportability";
  }
}

function bindingStateForStatus(
  status: ExportVerificationState,
): GovernedExportDestinationBinding["bindingState"] {
  switch (status) {
    case "verified":
      return "live";
    case "stale_graph":
    case "stale_redaction_policy":
      return "stale";
    case "permission_denied":
      return "permission_denied";
    case "missing_secret":
    case "missing_destination":
      return "missing";
    case "blocked_graph":
    case "blocked_redaction":
    case "failed":
    case "denied_scope":
    case "reportability_pending":
      return "blocked";
  }
}

function readinessForResult(result: ExportDeliveryResult): ExportSourceReadinessState {
  switch (result) {
    case "delivered":
      return "ready";
    case "stale":
      return "stale";
    case "permission_denied":
      return "permission_denied";
    case "pending_reportability":
      return "pending";
    case "blocked_graph":
    case "blocked_redaction":
    case "failed":
    case "denied_scope":
    case "missing_destination":
      return "blocked";
  }
}

function failureReasonForStatus(status: ExportVerificationState): string | undefined {
  switch (status) {
    case "missing_secret":
      return "Destination secret reference is required before synthetic verification.";
    case "missing_destination":
      return "Destination binding is absent for the selected artifact class.";
    case "denied_scope":
      return "Selected tenant, environment, framework, or artifact class is outside scope.";
    case "stale_graph":
      return "Assurance graph hash is stale for the selected artifact fixture.";
    case "stale_redaction_policy":
      return "Redaction policy hash no longer matches the export manifest.";
    case "blocked_graph":
      return "Graph completeness verdict blocks export and report readiness.";
    case "blocked_redaction":
      return "Redaction parity check blocks outbound delivery.";
    case "failed":
      return "Fake receiver rejected the synthetic export delivery.";
    case "permission_denied":
      return "Operator lacks export destination configuration permission.";
    case "reportability_pending":
      return "Reportable incident decision requires senior review before handoff.";
    case "verified":
      return undefined;
  }
}

export function normalizeSecurityComplianceExportScenarioState(
  value: string | null | undefined,
): SecurityComplianceExportScenarioState {
  const normalized = String(value ?? "normal")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (
    normalized === "missing_secret" ||
    normalized === "missing_destination" ||
    normalized === "denied_scope" ||
    normalized === "stale_graph" ||
    normalized === "stale_redaction_policy" ||
    normalized === "blocked_graph" ||
    normalized === "blocked_redaction" ||
    normalized === "delivery_failed" ||
    normalized === "permission_denied" ||
    normalized === "reportability_pending"
  ) {
    return normalized;
  }
  return "normal";
}

export function secretRefForExportDestination(
  destinationClass: ExportDestinationClass,
  tenantRef = "tenant-demo-gp",
  environmentRef = "local",
): string {
  return `vault-ref/${tenantRef}/${environmentRef}/security-compliance-exports/${slug(destinationClass)}/v1`;
}

function createArtifactFixture(
  artifactClass: ExportArtifactClass,
  tenantRef: string,
  environmentRef: string,
  frameworkCode: ExportFrameworkCode,
): ExportArtifactFixture {
  const artifactRef = `governed-export-artifact:463:${artifactClass}:${tenantRef}:${environmentRef}`;
  const graphHash = stableHash(`${artifactRef}:graph:${frameworkCode}`);
  const redactionPolicyHash = stableHash(`${artifactRef}:redaction:minimum-necessary`);
  const serializedArtifactHash = stableHash(`${artifactRef}:serialized`);
  const exportManifestHash = stableHash(
    `${frameworkCode}:${serializedArtifactHash}:${redactionPolicyHash}:${graphHash}:manifest`,
  );
  return {
    artifactFixtureId: `artifact-fixture-463-${slug(artifactClass)}`,
    artifactClass,
    artifactRef,
    summary: `Synthetic ${artifactClass.replace(/_/g, " ")} fixture with redacted summary and manifest metadata only.`,
    serializedArtifactHash,
    exportManifestHash,
    reproductionHash: stableHash(`${exportManifestHash}:rerendered`),
    graphHash,
    redactionPolicyHash,
    rawExportUrl: null,
  };
}

function createPolicyBinding(
  definition: ExportDestinationDefinition,
  tenantRef: string,
  environmentRef: string,
): ComplianceExportPolicyBinding {
  const canonicalKey = `${tenantRef}:${environmentRef}:${definition.frameworkCode}:${definition.destinationClass}`;
  return {
    policyId: `compliance-export-policy-463-${slug(definition.destinationClass)}`,
    frameworkCode: definition.frameworkCode,
    frameworkVersionRef: `standards-version-map:463:${definition.frameworkCode}:2026.04`,
    standardsVersionMapRef: `standards-version-map:463:${definition.frameworkCode}`,
    artifactClassesAllowed: definition.artifactClassesAllowed,
    redactionPolicyHash: stableHash(`${canonicalKey}:redaction`),
    exportManifestHash: stableHash(`${canonicalKey}:manifest`),
    reproductionHash: stableHash(`${canonicalKey}:reproduction`),
    artifactPresentationContractRef: "ArtifactPresentationContract",
    artifactSurfaceFrameRef: "ArtifactSurfaceFrame",
    artifactModeTruthProjectionRef: "ArtifactModeTruthProjection",
    outboundNavigationGrantPolicyRef: "OutboundNavigationGrant",
    rawExportUrlsAllowed: false,
    unmanagedDownloadAllowed: false,
    retentionClass: definition.retentionClass,
    legalHoldBehavior: definition.legalHoldBehavior,
  };
}

export function createGovernedExportDestinationBinding(
  definition: ExportDestinationDefinition,
  options: {
    readonly tenantRef?: string;
    readonly environmentRef?: string;
    readonly selected?: boolean;
    readonly scenarioState?: SecurityComplianceExportScenarioState | string | null;
    readonly secretRefOverride?: string;
  } = {},
): GovernedExportDestinationBinding {
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const scenarioState = normalizeSecurityComplianceExportScenarioState(options.scenarioState);
  const status = verificationStateForScenario(scenarioState, options.selected ?? false);
  const result = deliveryResultForState(status);
  const bindingId = `export-destination-${slug(definition.destinationClass)}`;
  const policyBinding = createPolicyBinding(definition, tenantRef, environmentRef);
  const primaryArtifactClass = definition.artifactClassesAllowed[0] ?? "dspt_operational_evidence_pack";
  const artifactFixture = createArtifactFixture(
    primaryArtifactClass,
    tenantRef,
    environmentRef,
    definition.frameworkCode,
  );
  const secretRef =
    options.secretRefOverride ??
    (status === "missing_secret"
      ? ""
      : secretRefForExportDestination(definition.destinationClass, tenantRef, environmentRef));
  const verification: ExportDestinationVerificationRecord = {
    verificationId: `export-verification-463-${slug(definition.destinationClass)}`,
    bindingId,
    verifiedAt:
      status === "stale_graph" || status === "stale_redaction_policy"
        ? "2026-04-26T11:30:00Z"
        : "2026-04-28T11:30:00Z",
    status,
    checkedBy: "playwright:463_security_compliance_exports",
    fakeReceiverRef: `fake-export-receiver:phase9:${slug(definition.destinationClass)}`,
    secretRef,
    serializedArtifactHash: artifactFixture.serializedArtifactHash,
    redactionPolicyHash:
      status === "stale_redaction_policy"
        ? stableHash(`${bindingId}:stale-redaction`)
        : policyBinding.redactionPolicyHash,
    exportManifestHash: artifactFixture.exportManifestHash,
    reproductionHash: artifactFixture.reproductionHash,
    reproductionState:
      status === "stale_graph" || status === "stale_redaction_policy"
        ? "drifted"
        : status === "blocked_graph" || status === "blocked_redaction"
          ? "blocked"
          : "exact",
    frameworkVersionHash: stableHash(policyBinding.frameworkVersionRef),
    graphHash:
      status === "stale_graph" || status === "blocked_graph"
        ? stableHash(`${bindingId}:graph:stale-or-blocked`)
        : artifactFixture.graphHash,
    graphVerdictRef:
      status === "blocked_graph"
        ? "assurance-graph-verdict:463:blocked"
        : status === "stale_graph"
          ? "assurance-graph-verdict:463:stale"
          : "assurance-graph-verdict:463:complete",
    outboundGrantRef: `outbound-navigation-grant:463:${slug(definition.destinationClass)}`,
    artifactPresentationContractRef: "ArtifactPresentationContract",
    syntheticPayloadHash: stableHash(`${bindingId}:${status}:${artifactFixture.exportManifestHash}`),
    fakeReceiverObserved: result === "delivered" || result === "failed",
    failureReason: failureReasonForStatus(status),
  };
  const settlement: ExportDeliverySettlement = {
    settlementId: `export-settlement-463-${slug(definition.destinationClass)}`,
    bindingId,
    idempotencyKey: `${tenantRef}:${environmentRef}:${definition.destinationClass}:v1`,
    deliveredAt: result === "delivered" ? "2026-04-28T11:34:00Z" : null,
    result,
    artifactClass: primaryArtifactClass,
    artifactRef: artifactFixture.artifactRef,
    artifactTransferSettlementRef: `artifact-transfer-settlement:463:${slug(definition.destinationClass)}`,
    outboundNavigationGrantRef: verification.outboundGrantRef,
    receiverRef: verification.fakeReceiverRef,
    receiverObserved: verification.fakeReceiverObserved,
    responseCode:
      result === "delivered"
        ? 202
        : result === "failed"
          ? 503
          : result === "permission_denied"
            ? 451
            : result === "blocked_redaction" || result === "blocked_graph"
              ? 423
              : 409,
    retryAttemptCount: result === "failed" ? 3 : 0,
    fallbackDisposition:
      result === "blocked_graph" || result === "blocked_redaction" || result === "stale"
        ? "block_until_graph_or_redaction_revalidated"
        : result === "failed" || result === "pending_reportability"
          ? "queue_governed_human_handoff"
          : "retain_same_shell_summary",
    authoritativeTransferState:
      result === "delivered"
        ? "ready"
        : result === "stale"
          ? "stale"
          : result === "failed"
            ? "failed"
            : result === "pending_reportability"
              ? "pending_reportability"
              : "blocked",
    failureReason: failureReasonForStatus(status),
  };
  const baseBinding: GovernedExportDestinationBinding = {
    schemaVersion: SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
    bindingId,
    destinationClass: definition.destinationClass,
    destinationKind: definition.destinationKind,
    label: definition.label,
    tenantRef,
    environmentRef,
    frameworkCode: definition.frameworkCode,
    artifactClassesAllowed: definition.artifactClassesAllowed,
    sourceSurfaceRefs: definition.sourceSurfaceRefs,
    audience: definition.audience,
    purposeOfUse: definition.purposeOfUse,
    allowedHandoffMode: definition.allowedHandoffMode,
    redactionPolicyHash: verification.redactionPolicyHash,
    maskingPolicyRef: `masking-policy:463:${definition.frameworkCode}:minimum-necessary`,
    policyBinding,
    artifactPresentationContractRef: "ArtifactPresentationContract",
    outboundNavigationGrantPolicyRef: "OutboundNavigationGrant",
    retentionClass: definition.retentionClass,
    legalHoldBehavior: definition.legalHoldBehavior,
    secretRef,
    secretHandleRef: secretRef,
    secretMaterialInline: false,
    endpointAlias: `fake export receiver ${slug(definition.destinationClass)}`,
    latestVerificationRecord: verification,
    latestDeliverySettlement: settlement,
    failureFallbackDisposition: settlement.fallbackDisposition,
    bindingState: bindingStateForStatus(status),
    sourceRefs: SOURCE_ALGORITHM_REFS,
  };
  if (definition.destinationKind !== "security_reporting") {
    return baseBinding;
  }
  const handoffRecord: ReportabilityHandoffVerificationRecord = {
    reportabilityVerificationId: `reportability-handoff-463-${slug(definition.destinationClass)}`,
    bindingId,
    incidentRef: `security-incident:463:${slug(definition.destinationClass)}`,
    frameworkRef: "DSPT",
    decision: status === "reportability_pending" ? "needs_senior_review" : "reportable",
    handoffState:
      status === "verified"
        ? "verified"
        : status === "reportability_pending"
          ? "pending"
          : status === "failed"
            ? "blocked"
            : "blocked",
    decisionHash: stableHash(`${bindingId}:reportability-decision:${status}`),
    supportingFactsHash: stableHash(`${bindingId}:supporting-facts:redacted`),
    outboundNavigationGrantRef: verification.outboundGrantRef,
    syntheticPayloadHash: verification.syntheticPayloadHash,
    checkedBy: "playwright:463_security_reporting_destinations",
  };
  const securityBinding: SecurityReportingDestinationBinding = {
    ...baseBinding,
    destinationKind: "security_reporting",
    reportabilityHandoffVerificationRecord: handoffRecord,
  };
  return securityBinding;
}

export function createSecurityReportingSyntheticPayload(
  binding: GovernedExportDestinationBinding,
): SecurityReportingSyntheticPayload {
  const securityBinding = binding as SecurityReportingDestinationBinding;
  return {
    schemaVersion: "463.phase9.fake-security-reporting-payload.v1",
    bindingId: binding.bindingId,
    destinationClass: binding.destinationClass,
    tenantRef: binding.tenantRef,
    environmentRef: binding.environmentRef,
    frameworkCode: binding.frameworkCode,
    reportabilityDecision:
      securityBinding.reportabilityHandoffVerificationRecord?.decision ?? "reportable",
    handoffState:
      securityBinding.reportabilityHandoffVerificationRecord?.handoffState ?? "verified",
    artifactClassesAllowed: binding.artifactClassesAllowed,
    serializedArtifactHash: binding.latestVerificationRecord.serializedArtifactHash,
    exportManifestHash: binding.latestVerificationRecord.exportManifestHash,
    redactionPolicyHash: binding.redactionPolicyHash,
    outboundNavigationGrantRef: binding.latestDeliverySettlement.outboundNavigationGrantRef,
    safeSummaryHash: stableHash(`${binding.bindingId}:security-reporting-summary`),
  };
}

export function createComplianceExportSyntheticPayload(
  binding: GovernedExportDestinationBinding,
): ComplianceExportSyntheticPayload {
  return {
    schemaVersion: "463.phase9.fake-compliance-export-payload.v1",
    bindingId: binding.bindingId,
    destinationClass: binding.destinationClass,
    tenantRef: binding.tenantRef,
    environmentRef: binding.environmentRef,
    frameworkCode: binding.frameworkCode,
    artifactClass: binding.latestDeliverySettlement.artifactClass,
    artifactRef: binding.latestDeliverySettlement.artifactRef,
    standardsVersionMapRef: binding.policyBinding.standardsVersionMapRef,
    serializedArtifactHash: binding.latestVerificationRecord.serializedArtifactHash,
    exportManifestHash: binding.latestVerificationRecord.exportManifestHash,
    reproductionHash: binding.latestVerificationRecord.reproductionHash,
    redactionPolicyHash: binding.redactionPolicyHash,
    artifactPresentationContractRef: "ArtifactPresentationContract",
    outboundNavigationGrantRef: binding.latestDeliverySettlement.outboundNavigationGrantRef,
    safeSummaryHash: stableHash(`${binding.bindingId}:compliance-export-summary`),
  };
}

function createFakeSecurityReceiverRecord(
  binding: SecurityReportingDestinationBinding,
): FakeSecurityReportingReceiverRecord {
  const payload = createSecurityReportingSyntheticPayload(binding);
  return {
    receiverRecordId: `fake-security-reporting-record-463-${slug(binding.destinationClass)}`,
    bindingId: binding.bindingId,
    receiverRef: binding.latestDeliverySettlement.receiverRef,
    observedAt: binding.latestDeliverySettlement.deliveredAt ?? "2026-04-28T11:34:00Z",
    accepted: binding.latestDeliverySettlement.result === "delivered",
    responseCode:
      binding.latestDeliverySettlement.result === "delivered"
        ? 202
        : binding.latestDeliverySettlement.result === "failed"
          ? 503
          : binding.latestDeliverySettlement.result === "permission_denied"
            ? 451
            : 409,
    payloadHash: stableHash(JSON.stringify(payload)),
    payload,
  };
}

function createFakeComplianceReceiverRecord(
  binding: GovernedExportDestinationBinding,
): FakeComplianceExportReceiverRecord {
  const payload = createComplianceExportSyntheticPayload(binding);
  return {
    receiverRecordId: `fake-compliance-export-record-463-${slug(binding.destinationClass)}`,
    bindingId: binding.bindingId,
    receiverRef: binding.latestDeliverySettlement.receiverRef,
    observedAt: binding.latestDeliverySettlement.deliveredAt ?? "2026-04-28T11:34:00Z",
    accepted: binding.latestDeliverySettlement.result === "delivered",
    responseCode:
      binding.latestDeliverySettlement.result === "delivered"
        ? 202
        : binding.latestDeliverySettlement.result === "failed"
          ? 503
          : binding.latestDeliverySettlement.result === "blocked_redaction" ||
              binding.latestDeliverySettlement.result === "blocked_graph"
            ? 423
            : 409,
    payloadHash: stableHash(JSON.stringify(payload)),
    payload,
  };
}

function buildSourceReadiness(
  bindings: readonly GovernedExportDestinationBinding[],
): readonly ExportSourceSurfaceReadinessProjection[] {
  const surfaces = [
    ["assurance", "/ops/assurance"],
    ["incident", "/ops/incidents"],
    ["audit", "/ops/audit"],
    ["records", "/ops/governance/records"],
    ["resilience", "/ops/resilience"],
    ["conformance", "/ops/conformance"],
  ] as const satisfies readonly (readonly [ExportSourceSurface, ExportSourceSurfaceReadinessProjection["route"]])[];
  return surfaces.map(([surface, route]) => {
    const surfaceBindings = bindings.filter((binding) => binding.sourceSurfaceRefs.includes(surface));
    const blocked = surfaceBindings.filter(
      (binding) => readinessForResult(binding.latestDeliverySettlement.result) !== "ready",
    );
    const readinessState =
      blocked.length === 0
        ? "ready"
        : blocked.some((binding) => binding.latestDeliverySettlement.result === "permission_denied")
          ? "permission_denied"
          : blocked.some((binding) => binding.latestDeliverySettlement.result === "stale")
            ? "stale"
            : blocked.some(
                  (binding) => binding.latestDeliverySettlement.result === "pending_reportability",
                )
              ? "pending"
              : "blocked";
    return {
      surface,
      route,
      readinessState,
      destinationRefs: surfaceBindings.map((binding) => binding.bindingId),
      blockedDestinationRefs: blocked.map((binding) => binding.bindingId),
      summary:
        blocked.length === 0
          ? `${surface} exports have governed destinations, grants, and redaction parity.`
          : `${surface} export readiness waits on ${blocked.length} destination binding${blocked.length === 1 ? "" : "s"}.`,
    };
  });
}

export function createSecurityComplianceExportRegistryProjection(
  options: {
    readonly scenarioState?: SecurityComplianceExportScenarioState | string | null;
    readonly tenantRef?: string;
    readonly environmentRef?: string;
    readonly destinationClass?: ExportDestinationClass;
    readonly secretRefOverride?: string;
  } = {},
): SecurityComplianceExportRegistryProjection {
  const scenarioState = normalizeSecurityComplianceExportScenarioState(options.scenarioState);
  const tenantRef = options.tenantRef ?? "tenant-demo-gp";
  const environmentRef = options.environmentRef ?? "local";
  const selectedDefinition =
    DESTINATION_DEFINITIONS.find(
      (definition) => definition.destinationClass === options.destinationClass,
    ) ?? DESTINATION_DEFINITIONS[0]!;
  const bindings = DESTINATION_DEFINITIONS.map((definition) =>
    createGovernedExportDestinationBinding(definition, {
      tenantRef,
      environmentRef,
      selected: definition.destinationClass === selectedDefinition.destinationClass,
      scenarioState,
      secretRefOverride:
        definition.destinationClass === selectedDefinition.destinationClass
          ? options.secretRefOverride
          : undefined,
    }),
  );
  const selectedBinding =
    bindings.find((binding) => binding.destinationClass === selectedDefinition.destinationClass) ??
    bindings[0]!;
  const securityReportingBindings = bindings.filter(
    (binding): binding is SecurityReportingDestinationBinding =>
      binding.destinationKind === "security_reporting",
  );
  const complianceExportBindings = bindings.filter(
    (binding) => binding.destinationKind === "compliance_export",
  );
  const deliverySettlements = bindings.map((binding) => binding.latestDeliverySettlement);
  const verificationRecords = bindings.map((binding) => binding.latestVerificationRecord);
  const artifactFixtures = ARTIFACT_FIXTURE_CLASSES.map((artifactClass) =>
    createArtifactFixture(
      artifactClass,
      tenantRef,
      environmentRef,
      selectedBinding.frameworkCode,
    ),
  );
  const fakeSecurityReportingReceiverRecords = securityReportingBindings
    .filter((binding) => binding.latestVerificationRecord.fakeReceiverObserved)
    .map(createFakeSecurityReceiverRecord);
  const fakeComplianceExportReceiverRecords = complianceExportBindings
    .filter((binding) => binding.latestVerificationRecord.fakeReceiverObserved)
    .map(createFakeComplianceReceiverRecord);
  const sourceReadiness = buildSourceReadiness(bindings);
  const readyCount = bindings.filter(
    (binding) => binding.latestVerificationRecord.status === "verified",
  ).length;
  const staleCount = bindings.filter(
    (binding) =>
      binding.latestVerificationRecord.status === "stale_graph" ||
      binding.latestVerificationRecord.status === "stale_redaction_policy",
  ).length;
  const failedCount = bindings.filter(
    (binding) => binding.latestVerificationRecord.status === "failed",
  ).length;
  const permissionDeniedCount = bindings.filter(
    (binding) => binding.latestVerificationRecord.status === "permission_denied",
  ).length;
  const blockedCount =
    bindings.length - readyCount - staleCount - failedCount - permissionDeniedCount;
  return {
    schemaVersion: SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
    visualMode: SECURITY_COMPLIANCE_EXPORT_VISUAL_MODE,
    scenarioState,
    tenantRef,
    environmentRef,
    selectedDestinationClass: selectedBinding.destinationClass,
    selectedBindingId: selectedBinding.bindingId,
    selectedBinding,
    bindings,
    securityReportingBindings,
    complianceExportBindings,
    verificationRecords,
    deliverySettlements,
    reportabilityHandoffRecords: securityReportingBindings.map(
      (binding) => binding.reportabilityHandoffVerificationRecord,
    ),
    artifactFixtures,
    fakeSecurityReportingReceiverRecords,
    fakeComplianceExportReceiverRecords,
    sourceReadiness,
    registryHash: stableHash(
      JSON.stringify(
        bindings.map((binding) => [
          binding.bindingId,
          binding.latestVerificationRecord.status,
          binding.latestDeliverySettlement.result,
          binding.redactionPolicyHash,
          binding.policyBinding.exportManifestHash,
        ]),
      ),
    ),
    readyCount,
    blockedCount,
    staleCount,
    failedCount,
    permissionDeniedCount,
    noRawExportUrls: true,
    automationAnchors: AUTOMATION_ANCHORS,
    sourceAlgorithmRefs: SOURCE_ALGORITHM_REFS,
    interfaceGapArtifactRef: SECURITY_COMPLIANCE_EXPORT_GAP_ARTIFACT_REF,
  };
}

export function upsertGovernedExportDestinationBinding(
  bindings: readonly GovernedExportDestinationBinding[],
  candidate: GovernedExportDestinationBinding,
): readonly GovernedExportDestinationBinding[] {
  const naturalKey = `${candidate.tenantRef}:${candidate.environmentRef}:${candidate.destinationClass}`;
  const existingIndex = bindings.findIndex(
    (binding) =>
      `${binding.tenantRef}:${binding.environmentRef}:${binding.destinationClass}` === naturalKey,
  );
  if (existingIndex === -1) {
    return [...bindings, candidate];
  }
  return bindings.map((binding, index) => (index === existingIndex ? candidate : binding));
}

export function verifyGovernedExportDestinationBinding(
  binding: GovernedExportDestinationBinding,
): {
  readonly binding: GovernedExportDestinationBinding;
  readonly verification: ExportDestinationVerificationRecord;
  readonly settlement: ExportDeliverySettlement;
} {
  const definition =
    DESTINATION_DEFINITIONS.find(
      (candidate) => candidate.destinationClass === binding.destinationClass,
    ) ?? DESTINATION_DEFINITIONS[0]!;
  const verified = createGovernedExportDestinationBinding(definition, {
    tenantRef: binding.tenantRef,
    environmentRef: binding.environmentRef,
    selected: true,
    scenarioState: "normal",
    secretRefOverride: binding.secretRef,
  });
  return {
    binding: verified,
    verification: verified.latestVerificationRecord,
    settlement: verified.latestDeliverySettlement,
  };
}

export function createSecurityComplianceExportRegistryFixture() {
  const scenarios = [
    "normal",
    "missing_secret",
    "missing_destination",
    "denied_scope",
    "stale_graph",
    "stale_redaction_policy",
    "blocked_graph",
    "blocked_redaction",
    "delivery_failed",
    "permission_denied",
    "reportability_pending",
  ] as const satisfies readonly SecurityComplianceExportScenarioState[];
  return {
    schemaVersion: SECURITY_COMPLIANCE_EXPORT_SCHEMA_VERSION,
    visualMode: SECURITY_COMPLIANCE_EXPORT_VISUAL_MODE,
    requiredExportDestinationClasses,
    requiredExportArtifactClasses,
    sourceAlgorithmRefs: SOURCE_ALGORITHM_REFS,
    automationAnchors: AUTOMATION_ANCHORS,
    scenarioProjections: Object.fromEntries(
      scenarios.map((scenarioState) => [
        scenarioState,
        createSecurityComplianceExportRegistryProjection({ scenarioState }),
      ]),
    ) as Record<SecurityComplianceExportScenarioState, SecurityComplianceExportRegistryProjection>,
  };
}
