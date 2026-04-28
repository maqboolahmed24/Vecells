export interface OwnedObjectFamily {
  canonicalName: string;
  objectKind: string;
  boundedContext: string;
  authoritativeOwner: string;
  sourceRef: string;
}

export interface PackageContract {
  artifactId: string;
  packageName: string;
  packageRole: string;
  ownerContextCode: string;
  ownerContextLabel: string;
  purpose: string;
  versioningPosture: string;
  allowedDependencies: readonly string[];
  forbiddenDependencies: readonly string[];
  dependencyContractRefs: readonly string[];
  objectFamilyCount: number;
  contractFamilyCount: number;
  sourceContexts: readonly string[];
}

export const packageContract = {
  artifactId: "package_domains_analytics_assurance",
  packageName: "@vecells/domain-analytics-assurance",
  packageRole: "domain",
  ownerContextCode: "analytics_assurance",
  ownerContextLabel: "Analytics Assurance",
  purpose: "Canonical package home for the Analytics Assurance bounded context.",
  versioningPosture:
    "Workspace-private domain boundary. Public exports are explicit and additive-first.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/authz-policy",
    "packages/observability",
  ],
  forbiddenDependencies: [
    "packages/domains/* sibling internals",
    "apps/*",
    "services/*",
    "packages/design-system",
  ],
  dependencyContractRefs: [
    "CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL",
    "CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS",
    "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
  ],
  objectFamilyCount: 65,
  contractFamilyCount: 0,
  sourceContexts: ["assurance_and_governance"],
} as const satisfies PackageContract;

export const domainModule = {
  artifactId: packageContract.artifactId,
  packageName: packageContract.packageName,
  ownerContext: packageContract.ownerContextCode,
  posture: "baseline_required",
  note: packageContract.purpose,
} as const;

export const ownedObjectFamilies = [
  {
    canonicalName: "ArtifactDependencyLink",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / ArtifactDependencyLink",
  },
  {
    canonicalName: "AssuranceControlRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline / Backend work / AssuranceControlRecord",
  },
  {
    canonicalName: "AssuranceEvidenceGraphEdge",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / AssuranceEvidenceGraphEdge",
  },
  {
    canonicalName: "AssuranceEvidenceGraphSnapshot",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / AssuranceEvidenceGraphSnapshot",
  },
  {
    canonicalName: "AssuranceGraphCompletenessVerdict",
    objectKind: "witness",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / AssuranceGraphCompletenessVerdict",
  },
  {
    canonicalName: "AssuranceIngestCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / AssuranceIngestCheckpoint",
  },
  {
    canonicalName: "AssuranceLedgerEntry",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / AssuranceLedgerEntry",
  },
  {
    canonicalName: "AssurancePack",
    objectKind: "bundle",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / AssurancePack",
  },
  {
    canonicalName: "AssurancePackActionRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline / Backend work / AssurancePackActionRecord",
  },
  {
    canonicalName: "AssurancePackSettlement",
    objectKind: "settlement",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline / Backend work / AssurancePackSettlement",
  },
  {
    canonicalName: "AssuranceSliceTrustRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AssuranceSliceTrustRecord",
  },
  {
    canonicalName: "AssuranceSurfaceRuntimeBinding",
    objectKind: "descriptor",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / AssuranceSurfaceRuntimeBinding",
  },
  {
    canonicalName: "BAUReadinessPack",
    objectKind: "bundle",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9I. Full-program exercises, BAU transfer, and formal exit gate / Backend work / BAUReadinessPack",
  },
  {
    canonicalName: "ContinuityControlHealthProjection",
    objectKind: "projection",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Backend work / ContinuityControlHealthProjection",
  },
  {
    canonicalName: "ContinuityEvidencePackSection",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline / Backend work / ContinuityEvidencePackSection",
  },
  {
    canonicalName: "ControlEvidenceLink",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / ControlEvidenceLink",
  },
  {
    canonicalName: "ControlObjective",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / ControlObjective",
  },
  {
    canonicalName: "ControlStatusSnapshot",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / ControlStatusSnapshot",
  },
  {
    canonicalName: "CrossPhaseConformanceScorecard",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9I. Full-program exercises, BAU transfer, and formal exit gate / Backend work / CrossPhaseConformanceScorecard",
  },
  {
    canonicalName: "DataSubjectTrace",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / DataSubjectTrace",
  },
  {
    canonicalName: "DeletionCertificate",
    objectKind: "witness",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / DeletionCertificate",
  },
  {
    canonicalName: "DependencyHealthRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Backend work / DependencyHealthRecord",
  },
  {
    canonicalName: "DependencyRegistryEntry",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene / Backend work / DependencyRegistryEntry",
  },
  {
    canonicalName: "DispositionBlockExplainer",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / DispositionBlockExplainer",
  },
  {
    canonicalName: "DispositionEligibilityAssessment",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / DispositionEligibilityAssessment",
  },
  {
    canonicalName: "DispositionJob",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / DispositionJob",
  },
  {
    canonicalName: "EquitySliceMetric",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Backend work / EquitySliceMetric",
  },
  {
    canonicalName: "EvidenceArtifact",
    objectKind: "artifact",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / EvidenceArtifact",
  },
  {
    canonicalName: "EvidenceGapRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline / Backend work / EvidenceGapRecord",
  },
  {
    canonicalName: "ExperienceContinuityControlEvidence",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / ExperienceContinuityControlEvidence",
  },
  {
    canonicalName: "FailoverScenario",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme / Backend work / FailoverScenario",
  },
  {
    canonicalName: "FrameworkPackGenerator",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline / Backend work / FrameworkPackGenerator",
  },
  {
    canonicalName: "IdentityRepairEvidenceBundle",
    objectKind: "bundle",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / IdentityRepairEvidenceBundle",
  },
  {
    canonicalName: "InterventionCandidateLease",
    objectKind: "lease",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Frontend work / InterventionCandidateLease",
  },
  {
    canonicalName: "InvestigationDrawerSession",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Frontend work / InvestigationDrawerSession",
  },
  {
    canonicalName: "InvestigationScopeEnvelope",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / InvestigationScopeEnvelope",
  },
  {
    canonicalName: "InvestigationTimelineReconstruction",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / InvestigationTimelineReconstruction",
  },
  {
    canonicalName: "LegalHoldRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / LegalHoldRecord",
  },
  {
    canonicalName: "LegalHoldScopeManifest",
    objectKind: "manifest",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / LegalHoldScopeManifest",
  },
  {
    canonicalName: "LiveBoardDeltaWindow",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Frontend work / LiveBoardDeltaWindow",
  },
  {
    canonicalName: "MetricAnomalySnapshot",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Backend work / MetricAnomalySnapshot",
  },
  {
    canonicalName: "MonthlyAssurancePack",
    objectKind: "bundle",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline / Backend work / MonthlyAssurancePack",
  },
  {
    canonicalName: "NearMissReport",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting / Backend work / NearMissReport",
  },
  {
    canonicalName: "OnCallMatrix",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9I. Full-program exercises, BAU transfer, and formal exit gate / Backend work / OnCallMatrix",
  },
  {
    canonicalName: "OperationalMetricDefinition",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Backend work / OperationalMetricDefinition",
  },
  {
    canonicalName: "OpsOverviewContextFrame",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Frontend work / OpsOverviewContextFrame",
  },
  {
    canonicalName: "OpsOverviewSliceEnvelope",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Frontend work / OpsOverviewSliceEnvelope",
  },
  {
    canonicalName: "PhaseConformanceRow",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9I. Full-program exercises, BAU transfer, and formal exit gate / Backend work / PhaseConformanceRow",
  },
  {
    canonicalName: "PolicyPackVersion",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene / Backend work / PolicyPackVersion",
  },
  {
    canonicalName: "PostIncidentReview",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting / Backend work / PostIncidentReview",
  },
  {
    canonicalName: "ProjectionHealthSnapshot",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / ProjectionHealthSnapshot",
  },
  {
    canonicalName: "QueueHealthSnapshot",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Backend work / QueueHealthSnapshot",
  },
  {
    canonicalName: "ReleaseToBAURecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9I. Full-program exercises, BAU transfer, and formal exit gate / Backend work / ReleaseToBAURecord",
  },
  {
    canonicalName: "ReportabilityAssessment",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting / Backend work / ReportabilityAssessment",
  },
  {
    canonicalName: "RetentionClass",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / RetentionClass",
  },
  {
    canonicalName: "RetentionDecision",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / RetentionDecision",
  },
  {
    canonicalName: "RetentionLifecycleBinding",
    objectKind: "descriptor",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / RetentionLifecycleBinding",
  },
  {
    canonicalName: "RunbookBundle",
    objectKind: "bundle",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9I. Full-program exercises, BAU transfer, and formal exit gate / Backend work / RunbookBundle",
  },
  {
    canonicalName: "SLOProfile",
    objectKind: "descriptor",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Backend work / SLOProfile",
  },
  {
    canonicalName: "SecurityIncident",
    objectKind: "case",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting / Backend work / SecurityIncident",
  },
  {
    canonicalName: "StandardsChangeNotice",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene / Backend work / StandardsChangeNotice",
  },
  {
    canonicalName: "StandardsVersionMap",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline / Backend work / StandardsVersionMap",
  },
  {
    canonicalName: "SupportReplaySession",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / SupportReplaySession",
  },
  {
    canonicalName: "TenantBaselineProfile",
    objectKind: "descriptor",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene / Backend work / TenantBaselineProfile",
  },
  {
    canonicalName: "TrainingDrillRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting / Backend work / TrainingDrillRecord",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "InvestigationDrawerSession",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Frontend work / InvestigationDrawerSession",
  },
  {
    canonicalName: "SecurityIncident",
    objectKind: "case",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting / Backend work / SecurityIncident",
  },
  {
    canonicalName: "SupportReplaySession",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / SupportReplaySession",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "DispositionEligibilityAssessment",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / DispositionEligibilityAssessment",
  },
  {
    canonicalName: "InvestigationScopeEnvelope",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / InvestigationScopeEnvelope",
  },
  {
    canonicalName: "LegalHoldScopeManifest",
    objectKind: "manifest",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / LegalHoldScopeManifest",
  },
  {
    canonicalName: "PolicyPackVersion",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene / Backend work / PolicyPackVersion",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "ContinuityControlHealthProjection",
    objectKind: "projection",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Backend work / ContinuityControlHealthProjection",
  },
  {
    canonicalName: "ProjectionHealthSnapshot",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / ProjectionHealthSnapshot",
  },
] as const satisfies readonly OwnedObjectFamily[];

export function bootstrapDomainModule() {
  return {
    packageName: packageContract.packageName,
    objectFamilies: ownedObjectFamilies.length,
    aggregateFamilies: aggregateFamilies.length,
    domainServiceFamilies: domainServiceFamilies.length,
    eventFamilies: eventFamilies.length,
    policyFamilies: policyFamilies.length,
    projectionFamilies: projectionFamilies.length,
  };
}
export * from "./assurance-slice-trust-backbone";
export * from "./phase9-assurance-ledger-contracts";
export * from "./phase9-operational-projection-contracts";
export * from "./phase9-governance-control-contracts";
export * from "./phase9-assurance-ingest-service";
export * from "./phase9-assurance-graph-verdict-engine";
export * from "./phase9-operational-projection-engine";
export * from "./phase9-essential-function-metrics";
export * from "./phase9-investigation-timeline-service";
export * from "./phase9-assurance-pack-factory";
export * from "./phase9-capa-attestation-workflow";
export * from "./phase9-retention-lifecycle-engine";
export * from "./phase9-disposition-execution-engine";
export * from "./phase9-operational-readiness-posture";
export * from "./phase9-resilience-action-settlement";
export * from "./phase9-projection-rebuild-quarantine";
export * from "./phase9-incident-reportability-workflow";
export * from "./phase9-tenant-config-governance";
export * from "./phase9-cross-phase-conformance";
export * from "./phase9-exit-gate";
