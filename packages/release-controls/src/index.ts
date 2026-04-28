export const foundationReleasePosture = {
  "patient-web": {
    ring: "alpha",
    publication: "watch",
    owner: "patient_experience",
    automationGate: "stable data-testid contract",
  },
  "clinical-workspace": {
    ring: "alpha",
    publication: "controlled",
    owner: "triage_workspace",
    automationGate: "stable data-testid contract",
  },
  "hub-desk": {
    ring: "alpha",
    publication: "controlled",
    owner: "hub_coordination",
    automationGate: "stable data-testid contract",
  },
  "pharmacy-console": {
    ring: "alpha",
    publication: "controlled",
    owner: "pharmacy",
    automationGate: "stable data-testid contract",
  },
  "support-workspace": {
    ring: "alpha",
    publication: "controlled",
    owner: "support",
    automationGate: "stable data-testid contract",
  },
  "ops-console": {
    ring: "alpha",
    publication: "controlled",
    owner: "operations",
    automationGate: "stable data-testid contract",
  },
  "governance-console": {
    ring: "alpha",
    publication: "controlled",
    owner: "governance_admin",
    automationGate: "stable data-testid contract",
  },
} as const;

export type ReleasePosture =
  (typeof foundationReleasePosture)[keyof typeof foundationReleasePosture];

// par_075_release_trust_contracts:start
export type ReleaseApprovalFreezeState = "active" | "superseded" | "expired";
export type ChannelReleaseState =
  | "monitoring"
  | "frozen"
  | "kill_switch_active"
  | "rollback_recommended"
  | "released";
export type AssuranceTrustState = "trusted" | "degraded" | "quarantined" | "unknown";
export type AssuranceCompletenessState = "complete" | "partial" | "blocked";
export type ReleaseTrustSurfaceAuthorityState =
  | "live"
  | "diagnostic_only"
  | "recovery_only"
  | "blocked";
export type ReleaseTrustCalmTruthState = "allowed" | "suppressed";
export type ReleaseTrustMutationAuthorityState =
  | "enabled"
  | "governed_recovery"
  | "observe_only"
  | "blocked";

export interface ReleaseApprovalFreezeContract {
  releaseApprovalFreezeId: string;
  releaseCandidateRef: string;
  governanceReviewPackageRef: string;
  standardsDependencyWatchlistRef: string;
  reviewPackageHash: string;
  standardsWatchlistHash: string;
  freezeState: ReleaseApprovalFreezeState;
  approvedAt: string;
}

export interface ChannelReleaseFreezeRecordContract {
  channelFreezeId: string;
  channelFamily: string;
  releaseApprovalFreezeRef: string;
  channelState: ChannelReleaseState;
  effectiveAt: string;
  updatedAt: string;
}

export interface AssuranceSliceTrustRecordContract {
  sliceTrustId: string;
  sliceNamespace: string;
  trustState: AssuranceTrustState;
  completenessState: AssuranceCompletenessState;
  trustLowerBound: number;
  hardBlockState: boolean;
}

export interface ReleaseTrustFreezeVerdictContract {
  releaseTrustFreezeVerdictId: string;
  audienceSurface: string;
  routeFamilyRef: string;
  releaseApprovalFreezeRef: string;
  requiredChannelFreezeRefs: readonly string[];
  requiredAssuranceSliceTrustRefs: readonly string[];
  surfaceAuthorityState: ReleaseTrustSurfaceAuthorityState;
  calmTruthState: ReleaseTrustCalmTruthState;
  mutationAuthorityState: ReleaseTrustMutationAuthorityState;
  blockerRefs: readonly string[];
  evaluatedAt: string;
}

export function isLiveReleaseTrustVerdict(
  verdict: Pick<ReleaseTrustFreezeVerdictContract, "surfaceAuthorityState">,
): boolean {
  return verdict.surfaceAuthorityState === "live";
}

export function releaseTrustAllowsCalmTruth(
  verdict: Pick<ReleaseTrustFreezeVerdictContract, "surfaceAuthorityState" | "calmTruthState">,
): boolean {
  return verdict.surfaceAuthorityState === "live" && verdict.calmTruthState === "allowed";
}

export function releaseTrustAllowsMutation(
  verdict: Pick<
    ReleaseTrustFreezeVerdictContract,
    "surfaceAuthorityState" | "mutationAuthorityState"
  >,
): boolean {
  return verdict.surfaceAuthorityState === "live" && verdict.mutationAuthorityState === "enabled";
}
// par_075_release_trust_contracts:end

export * from "./projection-rebuild";

// par_091_build_provenance_exports:start
export * from "./build-provenance";
// par_091_build_provenance_exports:end

// par_094_runtime_publication_exports:start
export * from "./runtime-publication";
// par_094_runtime_publication_exports:end

// par_096_browser_runtime_governor_exports:start
export * from "./browser-runtime-governor";
// par_096_browser_runtime_governor_exports:end

// par_095_migration_backfill_exports:start
export * from "./migration-backfill";
// par_095_migration_backfill_exports:end

// par_097_release_watch_pipeline_exports:start
export * from "./release-watch-pipeline";
// par_097_release_watch_pipeline_exports:end

// par_098_dependency_degradation_exports:start
export * from "./dependency-degradation";
// par_098_dependency_degradation_exports:end

// par_099_runtime_topology_publication_exports:start
export * from "./runtime-topology-publication";
// par_099_runtime_topology_publication_exports:end

// par_100_supply_chain_provenance_exports:start
export * from "./supply-chain-provenance";
// par_100_supply_chain_provenance_exports:end

// par_101_resilience_baseline_exports:start
export * from "./resilience-baseline";
// par_101_resilience_baseline_exports:end

// par_102_canary_rollback_harness_exports:start
export * from "./canary-rollback-harness";
// par_102_canary_rollback_harness_exports:end

export interface OwnedObjectFamily {
  canonicalName: string;
  objectKind: string;
  boundedContext: string;
  authoritativeOwner: string;
  sourceRef: string;
}

export interface OwnedContractFamily {
  contractFamilyId: string;
  label: string;
  description: string;
  versioningPosture: string;
  consumerContractIds: readonly string[];
  consumerOwnerCodes: readonly string[];
  consumerSelectors: readonly string[];
  sourceRefs: readonly string[];
  ownedObjectFamilyCount: number;
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
  artifactId: "package_release_controls",
  packageName: "@vecells/release-controls",
  packageRole: "shared",
  ownerContextCode: "release_control",
  ownerContextLabel: "Release Control",
  purpose:
    "Single package family for publication tuples, approval freezes, watch posture, and runtime parity law.",
  versioningPosture:
    "Workspace-private published contract boundary. Public exports are explicit and versionable.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/api-contracts",
    "packages/observability",
  ],
  forbiddenDependencies: ["apps/* release authority", "packages/domains/* private internals"],
  dependencyContractRefs: [
    "CBC_041_SHELLS_TO_RELEASE_CONTROLS",
    "CBC_041_RELEASE_CONTROL_TO_OBSERVABILITY",
  ],
  objectFamilyCount: 39,
  contractFamilyCount: 3,
  sourceContexts: [
    "assistive",
    "audited_flow_gap",
    "frontend_runtime",
    "runtime_release",
    "unknown",
  ],
} as const satisfies PackageContract;

export const ownedObjectFamilies = [
  {
    canonicalName: "ArtifactFallbackDisposition",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Artifact rendering, preview, export, download, print, and handoff rules / ArtifactFallbackDisposition",
  },
  {
    canonicalName: "ArtifactParityDigest",
    objectKind: "digest",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Artifact rendering, preview, export, download, print, and handoff rules / ArtifactParityDigest",
  },
  {
    canonicalName: "AssistiveCapabilityRolloutVerdict",
    objectKind: "witness",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / AssistiveCapabilityRolloutVerdict",
  },
  {
    canonicalName: "AssistiveFreezeDisposition",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8I. Pilot rollout, controlled slices, and formal exit gate / Backend work / AssistiveFreezeDisposition",
  },
  {
    canonicalName: "AssistiveFreezeFrame",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveFreezeFrame",
  },
  {
    canonicalName: "AssistiveKillSwitch",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / AssistiveKillSwitch",
  },
  {
    canonicalName: "AssistiveKillSwitchState",
    objectKind: "descriptor",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveKillSwitchState",
  },
  {
    canonicalName: "AssistiveReleaseActionRecord",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / AssistiveReleaseActionRecord",
  },
  {
    canonicalName: "AssistiveReleaseActionSettlement",
    objectKind: "settlement",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / AssistiveReleaseActionSettlement",
  },
  {
    canonicalName: "AssistiveReleaseCandidate",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / AssistiveReleaseCandidate",
  },
  {
    canonicalName: "AssistiveReleaseFreezeRecord",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8I. Pilot rollout, controlled slices, and formal exit gate / Backend work / AssistiveReleaseFreezeRecord",
  },
  {
    canonicalName: "AssistiveReleaseState",
    objectKind: "descriptor",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveReleaseState",
  },
  {
    canonicalName: "AssistiveRolloutLadderPolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveRolloutLadderPolicy",
  },
  {
    canonicalName: "AssistiveRolloutSliceContract",
    objectKind: "contract",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8I. Pilot rollout, controlled slices, and formal exit gate / Backend work / AssistiveRolloutSliceContract",
  },
  {
    canonicalName: "AssuranceFreezeState",
    objectKind: "descriptor",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / AssuranceFreezeState",
  },
  {
    canonicalName: "CalmDegradedStateContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / C1. Bounded degraded and frozen calm states / CalmDegradedStateContract",
  },
  {
    canonicalName: "ChannelDegradedMode",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7F. Webview limitations, file handling, and resilient error UX / Backend work / ChannelDegradedMode",
  },
  {
    canonicalName: "ChannelReleaseCohort",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7I. Limited release, post-live governance, and formal exit gate / Backend work / ChannelReleaseCohort",
  },
  {
    canonicalName: "CompareFallbackContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Responsive and composition rules / CompareFallbackContract",
  },
  {
    canonicalName: "ContinuityCarryForwardPlan",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.2 Continuity key and shell law / ContinuityCarryForwardPlan",
  },
  {
    canonicalName: "ContinuityContractCoverageRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Verification ladder contract / ContinuityContractCoverageRecord",
  },
  {
    canonicalName: "ContinuityRestorePlan",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Design principles applied / 3. Object permanence before cleverness / ContinuityRestorePlan",
  },
  {
    canonicalName: "DraftMergePlan",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine / DraftMergePlan",
  },
  {
    canonicalName: "DraftMutationRecord",
    objectKind: "record",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine / DraftMutationRecord",
  },
  {
    canonicalName: "DraftRecoveryRecord",
    objectKind: "record",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine / DraftRecoveryRecord",
  },
  {
    canonicalName: "DraftSaveSettlement",
    objectKind: "settlement",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine / DraftSaveSettlement",
  },
  {
    canonicalName: "DraftSessionLease",
    objectKind: "lease",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1B. Draft lifecycle and autosave engine / DraftSessionLease",
  },
  {
    canonicalName: "EnvironmentBaselineFingerprint",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Environment ring and promotion contract / EnvironmentBaselineFingerprint",
  },
  {
    canonicalName: "ProfileSelectionResolution",
    objectKind: "other",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / ProfileSelectionResolution",
  },
  {
    canonicalName: "RecoveryEvidencePack",
    objectKind: "bundle",
    boundedContext: "audited_flow_gap",
    authoritativeOwner: "Cross-phase gap register",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9F. Resilience architecture, restore orchestration, and chaos programme / Backend work / RecoveryEvidencePack",
  },
  {
    canonicalName: "ReleaseApprovalGraph",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / ReleaseApprovalGraph",
  },
  {
    canonicalName: "ReleaseGuardThreshold",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / ReleaseGuardThreshold",
  },
  {
    canonicalName: "ReleaseGuardrailPolicy",
    objectKind: "policy",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7I. Limited release, post-live governance, and formal exit gate / Backend work / ReleaseGuardrailPolicy",
  },
  {
    canonicalName: "ReleasePublicationParityRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / ReleasePublicationParityRecord",
  },
  {
    canonicalName: "SyntheticRecoveryCoverageRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract / SyntheticRecoveryCoverageRecord",
  },
  {
    canonicalName: "UIEventCoverageAssertion",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 8. Required UI events / UIEventCoverageAssertion",
  },
  {
    canonicalName: "VisualizationFallbackContract",
    objectKind: "contract",
    boundedContext: "audited_flow_gap",
    authoritativeOwner: "Cross-phase gap register",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / VisualizationFallbackContract",
  },
  {
    canonicalName: "VisualizationParityProjection",
    objectKind: "projection",
    boundedContext: "audited_flow_gap",
    authoritativeOwner: "Cross-phase gap register",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / VisualizationParityProjection",
  },
  {
    canonicalName: "WritableRouteContractCoverageRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Verification ladder contract / WritableRouteContractCoverageRecord",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const ownedContractFamilies = [
  {
    contractFamilyId: "CF_044_PUBLICATION_FREEZE_AND_PARITY",
    label: "Publication, freeze, and parity controls",
    description:
      "Shared runtime publication tuples, freeze posture, parity evidence, and route coverage controls.",
    versioningPosture:
      "Published release-control family. Breaking changes require explicit release-governance review.",
    consumerContractIds: [
      "CBC_041_SHELLS_TO_RELEASE_CONTROLS",
      "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
      "CBC_041_NOTIFICATION_WORKER_TO_COMMUNICATIONS_SUPPORT_IDENTITY",
      "CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS",
    ],
    consumerOwnerCodes: [
      "assistive_lab",
      "governance_admin",
      "hub_coordination",
      "operations",
      "patient_experience",
      "pharmacy",
      "platform_integration",
      "platform_runtime",
      "support",
      "triage_workspace",
    ],
    consumerSelectors: [
      "apps/*",
      "services/api-gateway",
      "services/notification-worker",
      "tools/assistive-control-lab",
    ],
    sourceRefs: [
      "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
      "prompt/044.md",
    ],
    ownedObjectFamilyCount: 14,
  },
  {
    contractFamilyId: "CF_044_DEGRADED_MODE_AND_RECOVERY_CONTROLS",
    label: "Degraded-mode and recovery controls",
    description:
      "Fallback, degraded-mode, and recovery controls that must remain visible to shells and operators.",
    versioningPosture:
      "Shared degraded-mode control family with explicit widening and rollback semantics.",
    consumerContractIds: [
      "CBC_041_SHELLS_TO_RELEASE_CONTROLS",
      "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
      "CBC_041_NOTIFICATION_WORKER_TO_COMMUNICATIONS_SUPPORT_IDENTITY",
      "CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS",
    ],
    consumerOwnerCodes: [
      "assistive_lab",
      "governance_admin",
      "hub_coordination",
      "operations",
      "patient_experience",
      "pharmacy",
      "platform_integration",
      "platform_runtime",
      "support",
      "triage_workspace",
    ],
    consumerSelectors: [
      "apps/*",
      "services/api-gateway",
      "services/notification-worker",
      "tools/assistive-control-lab",
    ],
    sourceRefs: ["prompt/040.md", "prompt/044.md"],
    ownedObjectFamilyCount: 10,
  },
  {
    contractFamilyId: "CF_044_ASSISTIVE_RELEASE_SAFEGUARDS",
    label: "Assistive release safeguards",
    description:
      "Assistive rollout, freeze, kill-switch, and release candidate safeguards published through one shared surface.",
    versioningPosture: "Assistive release control family with fail-closed widening.",
    consumerContractIds: [
      "CBC_041_SHELLS_TO_RELEASE_CONTROLS",
      "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
      "CBC_041_NOTIFICATION_WORKER_TO_COMMUNICATIONS_SUPPORT_IDENTITY",
      "CBC_041_ASSISTIVE_LAB_TO_CONTRACTS_AND_RELEASE_CONTROLS",
    ],
    consumerOwnerCodes: [
      "assistive_lab",
      "governance_admin",
      "hub_coordination",
      "operations",
      "patient_experience",
      "pharmacy",
      "platform_integration",
      "platform_runtime",
      "support",
      "triage_workspace",
    ],
    consumerSelectors: [
      "apps/*",
      "services/api-gateway",
      "services/notification-worker",
      "tools/assistive-control-lab",
    ],
    sourceRefs: ["blueprint/phase-8-the-assistive-layer.md", "prompt/044.md"],
    ownedObjectFamilyCount: 15,
  },
] as const satisfies readonly OwnedContractFamily[];

export const eventFamilies = [
  {
    canonicalName: "UIEventCoverageAssertion",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 8. Required UI events / UIEventCoverageAssertion",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "AssistiveFreezeDisposition",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8I. Pilot rollout, controlled slices, and formal exit gate / Backend work / AssistiveFreezeDisposition",
  },
  {
    canonicalName: "AssistiveFreezeFrame",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveFreezeFrame",
  },
  {
    canonicalName: "AssistiveReleaseFreezeRecord",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8I. Pilot rollout, controlled slices, and formal exit gate / Backend work / AssistiveReleaseFreezeRecord",
  },
  {
    canonicalName: "AssistiveRolloutLadderPolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveRolloutLadderPolicy",
  },
  {
    canonicalName: "AssuranceFreezeState",
    objectKind: "descriptor",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / AssuranceFreezeState",
  },
  {
    canonicalName: "ReleaseGuardThreshold",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / ReleaseGuardThreshold",
  },
  {
    canonicalName: "ReleaseGuardrailPolicy",
    objectKind: "policy",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7I. Limited release, post-live governance, and formal exit gate / Backend work / ReleaseGuardrailPolicy",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "VisualizationParityProjection",
    objectKind: "projection",
    boundedContext: "audited_flow_gap",
    authoritativeOwner: "Cross-phase gap register",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / VisualizationParityProjection",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const releaseControlFamilies = ownedObjectFamilies;
export const releaseControlContractFamilies = ownedContractFamilies;

export function makePublicationTuple(ring: string, posture: string): string {
  return `${ring}:${posture}`;
}

export function bootstrapSharedPackage() {
  return {
    packageName: packageContract.packageName,
    objectFamilies: ownedObjectFamilies.length,
    contractFamilies: ownedContractFamilies.length,
    eventFamilies: eventFamilies.length,
    policyFamilies: policyFamilies.length,
    projectionFamilies: projectionFamilies.length,
  };
}
