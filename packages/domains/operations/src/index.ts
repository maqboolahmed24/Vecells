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
  artifactId: "package_domains_operations",
  packageName: "@vecells/domain-operations",
  packageRole: "domain",
  ownerContextCode: "operations",
  ownerContextLabel: "Operations",
  purpose: "Canonical package home for the Operations bounded context.",
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
  objectFamilyCount: 44,
  contractFamilyCount: 0,
  sourceContexts: ["staff_support_operations"],
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
    canonicalName: "CohortActionBridge",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.5 CohortImpactMatrix / CohortActionBridge",
  },
  {
    canonicalName: "CohortDriverPath",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.5 CohortImpactMatrix / CohortDriverPath",
  },
  {
    canonicalName: "CohortImpactCellProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.5 CohortImpactMatrix / CohortImpactCellProjection",
  },
  {
    canonicalName: "CohortVisibilityGuard",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.5 CohortImpactMatrix / CohortVisibilityGuard",
  },
  {
    canonicalName: "ContinuityEvidenceDrillPath",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.8 Continuity evidence and assurance drill-down / ContinuityEvidenceDrillPath",
  },
  {
    canonicalName: "DecisionCommitEnvelope",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / DecisionCommitEnvelope",
  },
  {
    canonicalName: "EvidenceDeltaPacket",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / EvidenceDeltaPacket",
  },
  {
    canonicalName: "FallbackReadinessDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.4 ServiceHealthGrid / FallbackReadinessDigest",
  },
  {
    canonicalName: "HealthActionPosture",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.4 ServiceHealthGrid / HealthActionPosture",
  },
  {
    canonicalName: "HealthDrillPath",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.4 ServiceHealthGrid / HealthDrillPath",
  },
  {
    canonicalName: "InterruptionDigestProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / InterruptionDigestProjection",
  },
  {
    canonicalName: "InventoryComparisonCandidateProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Inventory management architecture / 6A. Inventory comparison and supply-delta posture / InventoryComparisonCandidateProjection",
  },
  {
    canonicalName: "InventoryComparisonFence",
    objectKind: "gate",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / InventoryComparisonFence",
  },
  {
    canonicalName: "LineCheckpointEvaluation",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Prescription validation architecture / 4. Checkpoint rail / LineCheckpointEvaluation",
  },
  {
    canonicalName: "MaterialityEvaluation",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.5 CohortImpactMatrix / MaterialityEvaluation",
  },
  {
    canonicalName: "NextTaskLaunchLease",
    objectKind: "lease",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / NextTaskLaunchLease",
  },
  {
    canonicalName: "OpsActionEligibilityFence",
    objectKind: "gate",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsActionEligibilityFence",
  },
  {
    canonicalName: "OpsBoardPosture",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2A. Calm board posture and briefing artifacts / OpsBoardPosture",
  },
  {
    canonicalName: "OpsBoardSurfaceState",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / OpsBoardSurfaceState",
  },
  {
    canonicalName: "OpsBriefingArtifact",
    objectKind: "artifact",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2A. Calm board posture and briefing artifacts / OpsBriefingArtifact",
  },
  {
    canonicalName: "OpsDeltaGate",
    objectKind: "gate",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsDeltaGate",
  },
  {
    canonicalName: "OpsDrillContextAnchor",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.7 InvestigationDrawer / OpsDrillContextAnchor",
  },
  {
    canonicalName: "OpsEscalationCooldownWindow",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#5. Visual hierarchy and motion rules / OpsEscalationCooldownWindow",
  },
  {
    canonicalName: "OpsFocusProtectionFence",
    objectKind: "gate",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#5. Visual hierarchy and motion rules / OpsFocusProtectionFence",
  },
  {
    canonicalName: "OpsGovernanceHandoff",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsGovernanceHandoff",
  },
  {
    canonicalName: "OpsInterventionActionRecord",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsInterventionActionRecord",
  },
  {
    canonicalName: "OpsInterventionReadiness",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.6 InterventionWorkbench / OpsInterventionReadiness",
  },
  {
    canonicalName: "OpsInterventionSettlement",
    objectKind: "settlement",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsInterventionSettlement",
  },
  {
    canonicalName: "OpsLiveCadencePolicy",
    objectKind: "policy",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#3. Front-end data architecture / 3.1 Live cadence and stale-slice posture / OpsLiveCadencePolicy",
  },
  {
    canonicalName: "OpsMotionEnvelope",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#5. Visual hierarchy and motion rules / OpsMotionEnvelope",
  },
  {
    canonicalName: "OpsProminenceDecision",
    objectKind: "record",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#5. Visual hierarchy and motion rules / OpsProminenceDecision",
  },
  {
    canonicalName: "OpsRecoveryRunTimeline",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.8A Resilience readiness and restore control / OpsRecoveryRunTimeline",
  },
  {
    canonicalName: "OpsReducedMotionProfile",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#5. Visual hierarchy and motion rules / OpsReducedMotionProfile",
  },
  {
    canonicalName: "OpsResilienceReadinessSlice",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.8A Resilience readiness and restore control / OpsResilienceReadinessSlice",
  },
  {
    canonicalName: "OpsRestoreReport",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2B. Restore reporting and board-frame discipline / OpsRestoreReport",
  },
  {
    canonicalName: "OpsReturnToken",
    objectKind: "token",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsReturnToken",
  },
  {
    canonicalName: "OpsRouteIntent",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsRouteIntent",
  },
  {
    canonicalName: "OpsSelectedAnomalyState",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / OpsSelectedAnomalyState",
  },
  {
    canonicalName: "OpsSelectionLease",
    objectKind: "lease",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsSelectionLease",
  },
  {
    canonicalName: "OpsSemanticTonePolicy",
    objectKind: "policy",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2B. Restore reporting and board-frame discipline / OpsSemanticTonePolicy",
  },
  {
    canonicalName: "OpsSliceFreshnessState",
    objectKind: "descriptor",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#3. Front-end data architecture / 3.1 Live cadence and stale-slice posture / OpsSliceFreshnessState",
  },
  {
    canonicalName: "OpsStableServiceDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / OpsStableServiceDigest",
  },
  {
    canonicalName: "OpsSurfaceFootprintPlan",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / OpsSurfaceFootprintPlan",
  },
  {
    canonicalName: "ServiceHealthCellProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.4 ServiceHealthGrid / ServiceHealthCellProjection",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [
  {
    canonicalName: "OpsStableServiceDigest",
    objectKind: "digest",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / OpsStableServiceDigest",
  },
  {
    canonicalName: "ServiceHealthCellProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.4 ServiceHealthGrid / ServiceHealthCellProjection",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "CohortVisibilityGuard",
    objectKind: "other",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.5 CohortImpactMatrix / CohortVisibilityGuard",
  },
  {
    canonicalName: "InventoryComparisonFence",
    objectKind: "gate",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Canonical shell model / InventoryComparisonFence",
  },
  {
    canonicalName: "OpsActionEligibilityFence",
    objectKind: "gate",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsActionEligibilityFence",
  },
  {
    canonicalName: "OpsDeltaGate",
    objectKind: "gate",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsDeltaGate",
  },
  {
    canonicalName: "OpsFocusProtectionFence",
    objectKind: "gate",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#5. Visual hierarchy and motion rules / OpsFocusProtectionFence",
  },
  {
    canonicalName: "OpsLiveCadencePolicy",
    objectKind: "policy",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#3. Front-end data architecture / 3.1 Live cadence and stale-slice posture / OpsLiveCadencePolicy",
  },
  {
    canonicalName: "OpsSemanticTonePolicy",
    objectKind: "policy",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#2B. Restore reporting and board-frame discipline / OpsSemanticTonePolicy",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "CohortImpactCellProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.5 CohortImpactMatrix / CohortImpactCellProjection",
  },
  {
    canonicalName: "InterruptionDigestProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "staff-workspace-interface-architecture.md#Workspace projections and client state / InterruptionDigestProjection",
  },
  {
    canonicalName: "InventoryComparisonCandidateProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "pharmacy-console-frontend-architecture.md#Inventory management architecture / 6A. Inventory comparison and supply-delta posture / InventoryComparisonCandidateProjection",
  },
  {
    canonicalName: "ServiceHealthCellProjection",
    objectKind: "projection",
    boundedContext: "staff_support_operations",
    authoritativeOwner: "Staff, support, and operations control",
    sourceRef:
      "operations-console-frontend-blueprint.md#4. Canonical overview composition / 4.4 ServiceHealthGrid / ServiceHealthCellProjection",
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

export * from "./phase9-operational-destination-registry";
export * from "./phase9-backup-restore-channels";
export * from "./phase9-security-compliance-export-destinations";
export * from "./phase9-live-projection-gateway";
