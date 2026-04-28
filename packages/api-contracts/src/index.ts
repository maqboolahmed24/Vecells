export * from "./shell-contracts";

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
  artifactId: "package_api_contracts",
  packageName: "@vecells/api-contracts",
  packageRole: "shared",
  ownerContextCode: "shared_contracts",
  ownerContextLabel: "Shared Contracts",
  purpose:
    "Published browser and runtime contract surface; shells and services must consume this layer instead of sibling package internals.",
  versioningPosture:
    "Workspace-private published contract boundary. Public exports are explicit and versionable.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/release-controls",
  ],
  forbiddenDependencies: [
    "apps/* truth owners",
    "services/* deep imports",
    "packages/domains/* private internals",
  ],
  dependencyContractRefs: [
    "CBC_041_SHELLS_TO_API_CONTRACTS",
    "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
  ],
  objectFamilyCount: 221,
  contractFamilyCount: 3,
  sourceContexts: [
    "assistive",
    "audited_flow_gap",
    "foundation_runtime_experience",
    "frontend_runtime",
    "patient_experience",
    "runtime_release",
    "unknown",
  ],
} as const satisfies PackageContract;

export const ownedObjectFamilies = [
  {
    canonicalName: "AbstentionRecord",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / AbstentionRecord",
  },
  {
    canonicalName: "AccessibleSurfaceContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / AccessibleSurfaceContract",
  },
  {
    canonicalName: "ArtifactExperienceCoordinator",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / ArtifactExperienceCoordinator",
  },
  {
    canonicalName: "ArtifactModePresentationProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "canonical-ui-contract-kernel.md#Canonical contracts / ArtifactModePresentationProfile",
  },
  {
    canonicalName: "ArtifactPresentationContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / ArtifactPresentationContract",
  },
  {
    canonicalName: "ArtifactSurfaceBinding",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Artifact rendering, preview, export, download, print, and handoff rules / ArtifactSurfaceBinding",
  },
  {
    canonicalName: "ArtifactSurfaceContext",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Artifact rendering, preview, export, download, print, and handoff rules / ArtifactSurfaceContext",
  },
  {
    canonicalName: "ArtifactSurfaceFrame",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ArtifactSurfaceFrame",
  },
  {
    canonicalName: "ArtifactTransferSettlement",
    objectKind: "settlement",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Artifact rendering, preview, export, download, print, and handoff rules / ArtifactTransferSettlement",
  },
  {
    canonicalName: "AssistiveAnnouncementContract",
    objectKind: "contract",
    boundedContext: "audited_flow_gap",
    authoritativeOwner: "Cross-phase gap register",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / AssistiveAnnouncementContract",
  },
  {
    canonicalName: "AssistiveAnnouncementIntent",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 4. Canonical real-time rendering algorithm / AssistiveAnnouncementIntent",
  },
  {
    canonicalName: "AssistiveAnnouncementTruthProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 4. Canonical real-time rendering algorithm / AssistiveAnnouncementTruthProjection",
  },
  {
    canonicalName: "AssistiveArtifactActionRecord",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / AssistiveArtifactActionRecord",
  },
  {
    canonicalName: "AssistiveCapabilityManifest",
    objectKind: "manifest",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveCapabilityManifest",
  },
  {
    canonicalName: "AssistiveDraftInsertionPoint",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / AssistiveDraftInsertionPoint",
  },
  {
    canonicalName: "AssistiveDraftPatchLease",
    objectKind: "lease",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / AssistiveDraftPatchLease",
  },
  {
    canonicalName: "AssistiveEvaluationSurfaceBinding",
    objectKind: "descriptor",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8B. Evaluation corpus, label store, replay harness, and shadow dataset / Backend work / AssistiveEvaluationSurfaceBinding",
  },
  {
    canonicalName: "AssistiveOpsActionLease",
    objectKind: "lease",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / AssistiveOpsActionLease",
  },
  {
    canonicalName: "AssistiveOpsSurfaceBinding",
    objectKind: "descriptor",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / AssistiveOpsSurfaceBinding",
  },
  {
    canonicalName: "AssistivePresentationContract",
    objectKind: "contract",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistivePresentationContract",
  },
  {
    canonicalName: "AssistiveRunSettlement",
    objectKind: "settlement",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveRunSettlement",
  },
  {
    canonicalName: "AssistiveSession",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / AssistiveSession",
  },
  {
    canonicalName: "AssistiveSurfaceBinding",
    objectKind: "descriptor",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveSurfaceBinding",
  },
  {
    canonicalName: "AssistiveVisibilityPolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveVisibilityPolicy",
  },
  {
    canonicalName: "AssistiveWorkProtectionLease",
    objectKind: "lease",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / AssistiveWorkProtectionLease",
  },
  {
    canonicalName: "AssuranceBaselineSnapshot",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / AssuranceBaselineSnapshot",
  },
  {
    canonicalName: "AttentionBudget",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / AttentionBudget",
  },
  {
    canonicalName: "AudienceSurfaceRuntimeBinding",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / AudienceSurfaceRuntimeBinding",
  },
  {
    canonicalName: "AudioCaptureSession",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8C. Audio, transcript, and artifact normalization pipeline / Backend work / AudioCaptureSession",
  },
  {
    canonicalName: "BiasSliceMetric",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / BiasSliceMetric",
  },
  {
    canonicalName: "CaseReplayBundle",
    objectKind: "bundle",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8B. Evaluation corpus, label store, replay harness, and shadow dataset / Backend work / CaseReplayBundle",
  },
  {
    canonicalName: "ChangeImpactAssessment",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / ChangeImpactAssessment",
  },
  {
    canonicalName: "ChannelContext",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7B. Embedded channel bootstrap, context resolver, and shell split / Backend work / ChannelContext",
  },
  {
    canonicalName: "ClinicalConceptSpan",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8C. Audio, transcript, and artifact normalization pipeline / Backend work / ClinicalConceptSpan",
  },
  {
    canonicalName: "CognitiveLoadGovernor",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / CognitiveLoadGovernor",
  },
  {
    canonicalName: "CommunicationEnvelope",
    objectKind: "record",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / CommunicationEnvelope",
  },
  {
    canonicalName: "ConformalPredictionSet",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / ConformalPredictionSet",
  },
  {
    canonicalName: "ConsequencePreview",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ConsequencePreview",
  },
  {
    canonicalName: "ContinuityFrame",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.2 Continuity key and shell law / ContinuityFrame",
  },
  {
    canonicalName: "ContinuityTransitionCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.2 Continuity key and shell law / ContinuityTransitionCheckpoint",
  },
  {
    canonicalName: "ContradictionCheckResult",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8D. Summary, note draft, and structured documentation composer / Backend work / ContradictionCheckResult",
  },
  {
    canonicalName: "ConversationSubthreadProjection",
    objectKind: "projection",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ConversationSubthreadProjection",
  },
  {
    canonicalName: "ConversationThreadProjection",
    objectKind: "projection",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ConversationThreadProjection",
  },
  {
    canonicalName: "DecisionDock",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / DecisionDock",
  },
  {
    canonicalName: "DecisionDockFocusLease",
    objectKind: "lease",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / A. Essential shell composition / DecisionDockFocusLease",
  },
  {
    canonicalName: "DeepLinkIntentEnvelope",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Deep-link and recovery rules / DeepLinkIntentEnvelope",
  },
  {
    canonicalName: "DeepLinkResolutionCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Deep-link and recovery rules / DeepLinkResolutionCheckpoint",
  },
  {
    canonicalName: "DesignContractVocabularyTuple",
    objectKind: "tuple",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "canonical-ui-contract-kernel.md#Canonical contracts / DesignContractVocabularyTuple",
  },
  {
    canonicalName: "DesignTokenExportArtifact",
    objectKind: "artifact",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "design-token-foundation.md#Machine-readable export contract / DesignTokenExportArtifact",
  },
  {
    canonicalName: "DesignTokenFoundation",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.1A Canonical design-token and visual-language foundation / DesignTokenFoundation",
  },
  {
    canonicalName: "DocumentationContextSnapshot",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8D. Summary, note draft, and structured documentation composer / Backend work / DocumentationContextSnapshot",
  },
  {
    canonicalName: "DominantActionHierarchy",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / DominantActionHierarchy",
  },
  {
    canonicalName: "DraftNoteArtifact",
    objectKind: "artifact",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8D. Summary, note draft, and structured documentation composer / Backend work / DraftNoteArtifact",
  },
  {
    canonicalName: "DraftSection",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8D. Summary, note draft, and structured documentation composer / Backend work / DraftSection",
  },
  {
    canonicalName: "EmbeddedErrorContract",
    objectKind: "contract",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7F. Webview limitations, file handling, and resilient error UX / Backend work / EmbeddedErrorContract",
  },
  {
    canonicalName: "EmbeddedStripContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Responsive and composition rules / EmbeddedStripContract",
  },
  {
    canonicalName: "EmbeddedSurfaceContractCoverageRecord",
    objectKind: "record",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Verification ladder contract / EmbeddedSurfaceContractCoverageRecord",
  },
  {
    canonicalName: "EmptyStateContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules / EmptyStateContract",
  },
  {
    canonicalName: "EndpointHypothesis",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / EndpointHypothesis",
  },
  {
    canonicalName: "ErrorTaxonomyRecord",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8B. Evaluation corpus, label store, replay harness, and shadow dataset / Backend work / ErrorTaxonomyRecord",
  },
  {
    canonicalName: "EssentialShellFrame",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / A. Essential shell composition / EssentialShellFrame",
  },
  {
    canonicalName: "EvaluationExportArtifact",
    objectKind: "artifact",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8B. Evaluation corpus, label store, replay harness, and shadow dataset / Backend work / EvaluationExportArtifact",
  },
  {
    canonicalName: "EvidenceMap",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8D. Summary, note draft, and structured documentation composer / Backend work / EvidenceMap",
  },
  {
    canonicalName: "EvidenceMapSet",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8D. Summary, note draft, and structured documentation composer / Backend work / EvidenceMapSet",
  },
  {
    canonicalName: "FeatureSnapshot",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8B. Evaluation corpus, label store, replay harness, and shadow dataset / Backend work / FeatureSnapshot",
  },
  {
    canonicalName: "FeedbackEligibilityFlag",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / FeedbackEligibilityFlag",
  },
  {
    canonicalName: "FinalHumanArtifact",
    objectKind: "artifact",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / FinalHumanArtifact",
  },
  {
    canonicalName: "FocusIntegrityGuard",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / FocusIntegrityGuard",
  },
  {
    canonicalName: "FocusTransitionContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / FocusTransitionContract",
  },
  {
    canonicalName: "FormErrorSummaryContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / FormErrorSummaryContract",
  },
  {
    canonicalName: "FrontendContractManifest",
    objectKind: "manifest",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / FrontendContractManifest",
  },
  {
    canonicalName: "GroundTruthLabel",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8B. Evaluation corpus, label store, replay harness, and shadow dataset / Backend work / GroundTruthLabel",
  },
  {
    canonicalName: "HumanApprovalGateAssessment",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / HumanApprovalGateAssessment",
  },
  {
    canonicalName: "InlineSideStage",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / InlineSideStage",
  },
  {
    canonicalName: "IntakeSurfaceRuntimeBinding",
    objectKind: "descriptor",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-1-the-red-flag-gate.md#1A. Journey contract and intake schema lock / IntakeSurfaceRuntimeBinding",
  },
  {
    canonicalName: "IntendedUseProfile",
    objectKind: "descriptor",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / IntendedUseProfile",
  },
  {
    canonicalName: "InteractionContractRegistry",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / InteractionContractRegistry",
  },
  {
    canonicalName: "InvalidatedOptionStub",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Design principles applied / 3. Object permanence before cleverness / InvalidatedOptionStub",
  },
  {
    canonicalName: "KeyboardInteractionContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / KeyboardInteractionContract",
  },
  {
    canonicalName: "LiveAnnouncementGovernor",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / LiveAnnouncementGovernor",
  },
  {
    canonicalName: "MacroStateMapper",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / MacroStateMapper",
  },
  {
    canonicalName: "MedicalDeviceAssessmentRef",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / MedicalDeviceAssessmentRef",
  },
  {
    canonicalName: "MessageDraftArtifact",
    objectKind: "artifact",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8D. Summary, note draft, and structured documentation composer / Backend work / MessageDraftArtifact",
  },
  {
    canonicalName: "MissionStackFoldPlan",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / A. Essential shell composition / MissionStackFoldPlan",
  },
  {
    canonicalName: "ModelChangeRequest",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / ModelChangeRequest",
  },
  {
    canonicalName: "ModelPolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / ModelPolicy",
  },
  {
    canonicalName: "ModelRegistryEntry",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8B. Evaluation corpus, label store, replay harness, and shadow dataset / Backend work / ModelRegistryEntry",
  },
  {
    canonicalName: "NarrowScreenContinuityPlan",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Responsive and composition rules / NarrowScreenContinuityPlan",
  },
  {
    canonicalName: "NavigationContract",
    objectKind: "contract",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours / Backend work / NavigationContract",
  },
  {
    canonicalName: "NavigationStateLedger",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / NavigationStateLedger",
  },
  {
    canonicalName: "NeighborSubstitutionPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Design principles applied / 3. Object permanence before cleverness / NeighborSubstitutionPolicy",
  },
  {
    canonicalName: "NoAutoWritePolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / NoAutoWritePolicy",
  },
  {
    canonicalName: "OpsBoardStateSnapshot",
    objectKind: "record",
    boundedContext: "audited_flow_gap",
    authoritativeOwner: "Cross-phase gap register",
    sourceRef:
      "operations-console-frontend-blueprint.md#2. Shell, continuity, and routes / OpsBoardStateSnapshot",
  },
  {
    canonicalName: "OutboundNavigationGrant",
    objectKind: "grant",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm / 1. Required platform objects / OutboundNavigationGrant",
  },
  {
    canonicalName: "OverrideRecord",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / OverrideRecord",
  },
  {
    canonicalName: "PatientActionRecoveryProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Recovery and identity-hold contract / PatientActionRecoveryProjection",
  },
  {
    canonicalName: "PatientActionRoutingProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Typed patient action routing contract / PatientActionRoutingProjection",
  },
  {
    canonicalName: "PatientActionSettlementProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Typed patient action routing contract / PatientActionSettlementProjection",
  },
  {
    canonicalName: "PatientArtifactFrame",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Frontend architectural blueprint / 1A. Calm route posture and artifact delivery / PatientArtifactFrame",
  },
  {
    canonicalName: "PatientAttentionCuePolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Portal entry and shell topology / PatientAttentionCuePolicy",
  },
  {
    canonicalName: "PatientAudienceCoverageProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Patient audience coverage contract / PatientAudienceCoverageProjection",
  },
  {
    canonicalName: "PatientCallbackStatusProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Callback status, contact repair, and consent checkpoint contract / PatientCallbackStatusProjection",
  },
  {
    canonicalName: "PatientCalmBudgetProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / B1. Patient-shell quantitative quiet budget / PatientCalmBudgetProfile",
  },
  {
    canonicalName: "PatientCommunicationVisibilityProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Communications timeline contract / PatientCommunicationVisibilityProjection",
  },
  {
    canonicalName: "PatientConsentCheckpointProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Callback status, contact repair, and consent checkpoint contract / PatientConsentCheckpointProjection",
  },
  {
    canonicalName: "PatientContactRepairProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Callback status, contact repair, and consent checkpoint contract / PatientContactRepairProjection",
  },
  {
    canonicalName: "PatientDominantActionHierarchy",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientDominantActionHierarchy",
  },
  {
    canonicalName: "PatientExperienceContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Core projections / PatientExperienceContinuityEvidenceProjection",
  },
  {
    canonicalName: "PatientIdentityHoldProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Recovery and identity-hold contract / PatientIdentityHoldProjection",
  },
  {
    canonicalName: "PatientManageCapabilitiesProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Manage capabilities contract / PatientManageCapabilitiesProjection",
  },
  {
    canonicalName: "PatientMoreInfoStatusProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#More-info response contract / PatientMoreInfoStatusProjection",
  },
  {
    canonicalName: "PatientNavSectionEligibility",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientNavSectionEligibility",
  },
  {
    canonicalName: "PatientNextActionProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Request detail contract / PatientNextActionProjection",
  },
  {
    canonicalName: "PatientPortalEntryProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Portal entry and shell topology / PatientPortalEntryProjection",
  },
  {
    canonicalName: "PatientPortalNavigationLedger",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientPortalNavigationLedger",
  },
  {
    canonicalName: "PatientPrimaryNavManifest",
    objectKind: "manifest",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientPrimaryNavManifest",
  },
  {
    canonicalName: "PatientReachabilitySummaryProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Callback status, contact repair, and consent checkpoint contract / PatientReachabilitySummaryProjection",
  },
  {
    canonicalName: "PatientRecordArtifactProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Health record contract / PatientRecordArtifactProjection",
  },
  {
    canonicalName: "PatientRecordContinuityState",
    objectKind: "descriptor",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Health record contract / PatientRecordContinuityState",
  },
  {
    canonicalName: "PatientRecordFollowUpEligibilityProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Health record contract / PatientRecordFollowUpEligibilityProjection",
  },
  {
    canonicalName: "PatientRecordSurfaceContext",
    objectKind: "other",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Health record contract / PatientRecordSurfaceContext",
  },
  {
    canonicalName: "PatientRequestDetailProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Request detail contract / PatientRequestDetailProjection",
  },
  {
    canonicalName: "PatientRequestDownstreamProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Request detail contract / PatientRequestDownstreamProjection",
  },
  {
    canonicalName: "PatientRequestReturnBundle",
    objectKind: "bundle",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Request detail contract / PatientRequestReturnBundle",
  },
  {
    canonicalName: "PatientRequestSummaryProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Request detail contract / PatientRequestSummaryProjection",
  },
  {
    canonicalName: "PatientRequestsIndexProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Requests surface contract / PatientRequestsIndexProjection",
  },
  {
    canonicalName: "PatientResultInterpretationProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Health record contract / PatientResultInterpretationProjection",
  },
  {
    canonicalName: "PatientRouteAdjacency",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientRouteAdjacency",
  },
  {
    canonicalName: "PatientRoutePosture",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Frontend architectural blueprint / 1A. Calm route posture and artifact delivery / PatientRoutePosture",
  },
  {
    canonicalName: "PatientSafetyInterruptionProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Typed patient action routing contract / PatientSafetyInterruptionProjection",
  },
  {
    canonicalName: "PatientSectionHeaderFrame",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Portal entry and shell topology / PatientSectionHeaderFrame",
  },
  {
    canonicalName: "PatientSectionSurfaceState",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientSectionSurfaceState",
  },
  {
    canonicalName: "PatientSecureLinkSessionProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Recovery and identity-hold contract / PatientSecureLinkSessionProjection",
  },
  {
    canonicalName: "PatientSelectedAnchorPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientSelectedAnchorPolicy",
  },
  {
    canonicalName: "PatientStatusPresentationContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientStatusPresentationContract",
  },
  {
    canonicalName: "PatientUtilityNavManifest",
    objectKind: "manifest",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Portal entry and shell topology / PatientUtilityNavManifest",
  },
  {
    canonicalName: "PendingActionRetention",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Design principles applied / 3. Object permanence before cleverness / PendingActionRetention",
  },
  {
    canonicalName: "PersistentShell",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / PersistentShell",
  },
  {
    canonicalName: "PrimaryRegionBinding",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / A. Essential shell composition / PrimaryRegionBinding",
  },
  {
    canonicalName: "ProjectionContractFamily",
    objectKind: "descriptor",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / ProjectionContractFamily",
  },
  {
    canonicalName: "ProjectionContractVersion",
    objectKind: "descriptor",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / ProjectionContractVersion",
  },
  {
    canonicalName: "ProjectionContractVersionSet",
    objectKind: "bundle",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / ProjectionContractVersionSet",
  },
  {
    canonicalName: "ProjectionReadinessFence",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules / ProjectionReadinessFence",
  },
  {
    canonicalName: "ProjectionSubscription",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ProjectionSubscription",
  },
  {
    canonicalName: "PromptTemplateVersion",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8B. Evaluation corpus, label store, replay harness, and shadow dataset / Backend work / PromptTemplateVersion",
  },
  {
    canonicalName: "QuestionSetRecommendation",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / QuestionSetRecommendation",
  },
  {
    canonicalName: "QueueAssignmentSuggestionSnapshot",
    objectKind: "record",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / QueueAssignmentSuggestionSnapshot",
  },
  {
    canonicalName: "QueueChangeBatch",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / QueueChangeBatch",
  },
  {
    canonicalName: "QueueLens",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / QueueLens",
  },
  {
    canonicalName: "QueueRankEntry",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / QueueRankEntry",
  },
  {
    canonicalName: "QueueRankPlan",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / QueueRankPlan",
  },
  {
    canonicalName: "QueueRankSnapshot",
    objectKind: "record",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / QueueRankSnapshot",
  },
  {
    canonicalName: "QuietClarityBinding",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / 0. Canonical truth and posture eligibility / QuietClarityBinding",
  },
  {
    canonicalName: "QuietClarityEligibilityGate",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / 0. Canonical truth and posture eligibility / QuietClarityEligibilityGate",
  },
  {
    canonicalName: "QuietSettlementEnvelope",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / D1. Settlement before return-to-calm / QuietSettlementEnvelope",
  },
  {
    canonicalName: "QuietWorkProtectionLease",
    objectKind: "lease",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / F. Staff and support workspace simplification / QuietWorkProtectionLease",
  },
  {
    canonicalName: "RFCBundle",
    objectKind: "bundle",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / RFCBundle",
  },
  {
    canonicalName: "RecordPlaceholderProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Patient secure record route contract / RecordPlaceholderProjection",
  },
  {
    canonicalName: "RecordReleaseGate",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Patient secure record route contract / RecordReleaseGate",
  },
  {
    canonicalName: "RecordStepUpCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Patient secure record route contract / RecordStepUpCheckpoint",
  },
  {
    canonicalName: "RecordVisibilityEnvelope",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Patient secure record route contract / RecordVisibilityEnvelope",
  },
  {
    canonicalName: "RecoveryRedactionFence",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Deep-link and recovery rules / RecoveryRedactionFence",
  },
  {
    canonicalName: "RegionPlaceholderContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules / RegionPlaceholderContract",
  },
  {
    canonicalName: "ReplayEvidencePolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / ReplayEvidencePolicy",
  },
  {
    canonicalName: "ResponsiveDimensionTokenSet",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Responsive and composition rules / ResponsiveDimensionTokenSet",
  },
  {
    canonicalName: "ResponsiveViewportProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Responsive and composition rules / ResponsiveViewportProfile",
  },
  {
    canonicalName: "ResponsivenessLedger",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / ResponsivenessLedger",
  },
  {
    canonicalName: "RetentionEnvelope",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8C. Audio, transcript, and artifact normalization pipeline / Backend work / RetentionEnvelope",
  },
  {
    canonicalName: "RollbackReadinessBundle",
    objectKind: "bundle",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / RollbackReadinessBundle",
  },
  {
    canonicalName: "RouteAdjacencyContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / RouteAdjacencyContract",
  },
  {
    canonicalName: "RouteFamilyOwnershipClaim",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / RouteFamilyOwnershipClaim",
  },
  {
    canonicalName: "RouteMorphologyDescriptor",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / RouteMorphologyDescriptor",
  },
  {
    canonicalName: "RuleGuardResult",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / RuleGuardResult",
  },
  {
    canonicalName: "SafetyCaseDelta",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / SafetyCaseDelta",
  },
  {
    canonicalName: "SelectedAnchor",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / SelectedAnchor",
  },
  {
    canonicalName: "SelectedAnchorPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / SelectedAnchorPolicy",
  },
  {
    canonicalName: "SelectedAnchorPreserver",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / SelectedAnchorPreserver",
  },
  {
    canonicalName: "SelectedObjectAnchor",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Design principles applied / 3. Object permanence before cleverness / SelectedObjectAnchor",
  },
  {
    canonicalName: "ShadowComparisonRun",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8G. Monitoring, drift, fairness, and live safety controls / Backend work / ShadowComparisonRun",
  },
  {
    canonicalName: "ShellBoundaryDecision",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.2 Continuity key and shell law / ShellBoundaryDecision",
  },
  {
    canonicalName: "ShellContinuityFrame",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.2 Continuity key and shell law / ShellContinuityFrame",
  },
  {
    canonicalName: "ShellFamilyOwnershipContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / ShellFamilyOwnershipContract",
  },
  {
    canonicalName: "ShellNavigationManifest",
    objectKind: "manifest",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / ShellNavigationManifest",
  },
  {
    canonicalName: "ShellResponsiveProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Responsive and composition rules / ShellResponsiveProfile",
  },
  {
    canonicalName: "ShellScopeDescriptor",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.2 Continuity key and shell law / ShellScopeDescriptor",
  },
  {
    canonicalName: "ShellVisualProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.1A Canonical design-token and visual-language foundation / ShellVisualProfile",
  },
  {
    canonicalName: "SpeakerSegment",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8C. Audio, transcript, and artifact normalization pipeline / Backend work / SpeakerSegment",
  },
  {
    canonicalName: "StateBraid",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / StateBraid",
  },
  {
    canonicalName: "StatusAcknowledgementScope",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 4. Canonical real-time rendering algorithm / StatusAcknowledgementScope",
  },
  {
    canonicalName: "StatusArbitrationDecision",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 4. Canonical real-time rendering algorithm / StatusArbitrationDecision",
  },
  {
    canonicalName: "StatusCueRecord",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 4. Canonical real-time rendering algorithm / StatusCueRecord",
  },
  {
    canonicalName: "StatusCueSettlement",
    objectKind: "settlement",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 4. Canonical real-time rendering algorithm / StatusCueSettlement",
  },
  {
    canonicalName: "StatusPresentationContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / StatusPresentationContract",
  },
  {
    canonicalName: "StatusStripAuthority",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / A. Essential shell composition / StatusStripAuthority",
  },
  {
    canonicalName: "StatusSuppressionLedger",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 4. Canonical real-time rendering algorithm / StatusSuppressionLedger",
  },
  {
    canonicalName: "StickyActionDockContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Responsive and composition rules / StickyActionDockContract",
  },
  {
    canonicalName: "SubprocessorAssuranceRef",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8H. IM1 RFC, DTAC, DCB safety, medical-device boundary, and change control / Backend and assurance work / SubprocessorAssuranceRef",
  },
  {
    canonicalName: "SuggestionActionRecord",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / SuggestionActionRecord",
  },
  {
    canonicalName: "SuggestionActionSettlement",
    objectKind: "settlement",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / SuggestionActionSettlement",
  },
  {
    canonicalName: "SuggestionDraftInsertionLease",
    objectKind: "lease",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / SuggestionDraftInsertionLease",
  },
  {
    canonicalName: "SuggestionEnvelope",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / SuggestionEnvelope",
  },
  {
    canonicalName: "SuggestionPresentationArtifact",
    objectKind: "artifact",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / SuggestionPresentationArtifact",
  },
  {
    canonicalName: "SuggestionSurfaceBinding",
    objectKind: "descriptor",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / SuggestionSurfaceBinding",
  },
  {
    canonicalName: "SurfaceHydrationContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules / SurfaceHydrationContract",
  },
  {
    canonicalName: "SurfacePostureFrame",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / SurfacePostureFrame",
  },
  {
    canonicalName: "SurfacePostureGovernor",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / SurfacePostureGovernor",
  },
  {
    canonicalName: "SurfaceStateContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / SurfaceStateContract",
  },
  {
    canonicalName: "TimeoutRecoveryContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / TimeoutRecoveryContract",
  },
  {
    canonicalName: "TokenKernelLayeringPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "design-token-foundation.md#Machine-readable export contract / TokenKernelLayeringPolicy",
  },
  {
    canonicalName: "TranscriptArtifact",
    objectKind: "artifact",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8C. Audio, transcript, and artifact normalization pipeline / Backend work / TranscriptArtifact",
  },
  {
    canonicalName: "TranscriptJob",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8C. Audio, transcript, and artifact normalization pipeline / Backend work / TranscriptJob",
  },
  {
    canonicalName: "TranscriptPresentationArtifact",
    objectKind: "artifact",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8C. Audio, transcript, and artifact normalization pipeline / Backend work / TranscriptPresentationArtifact",
  },
  {
    canonicalName: "TransitionCoordinator",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / TransitionCoordinator",
  },
  {
    canonicalName: "TransitionEnvelope",
    objectKind: "record",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / TransitionEnvelope",
  },
  {
    canonicalName: "UIEventEmissionCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 8. Required UI events / UIEventEmissionCheckpoint",
  },
  {
    canonicalName: "UIEventVisibilityProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 8. Required UI events / UIEventVisibilityProfile",
  },
  {
    canonicalName: "UIStateContract",
    objectKind: "contract",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7G. Accessibility, design-system convergence, and channel-grade UX refinement / Backend work / UIStateContract",
  },
  {
    canonicalName: "UITransitionSettlementRecord",
    objectKind: "settlement",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication and controlled migrations / UITransitionSettlementRecord",
  },
  {
    canonicalName: "VisualTokenProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "canonical-ui-contract-kernel.md#Canonical contracts / VisualTokenProfile",
  },
  {
    canonicalName: "VisualizationTableContract",
    objectKind: "contract",
    boundedContext: "audited_flow_gap",
    authoritativeOwner: "Cross-phase gap register",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / VisualizationTableContract",
  },
  {
    canonicalName: "WritableEligibilityFence",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules / WritableEligibilityFence",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const ownedContractFamilies = [
  {
    contractFamilyId: "CF_044_BROWSER_RUNTIME_SURFACES",
    label: "Browser and runtime surface contracts",
    description:
      "Public browser/runtime contracts, route intent bindings, and shared surface descriptors.",
    versioningPosture:
      "Published contract surface. Breaking contract changes require coordinated release-control review.",
    consumerContractIds: [
      "CBC_041_SHELLS_TO_API_CONTRACTS",
      "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
      "CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS",
      "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
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
      "services/adapter-simulators",
      "services/api-gateway",
      "services/projection-worker",
      "tools/assistive-control-lab",
    ],
    sourceRefs: [
      "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
      "prompt/044.md",
    ],
    ownedObjectFamilyCount: 118,
  },
  {
    contractFamilyId: "CF_044_PROJECTION_AND_PRESENTATION_CONTRACTS",
    label: "Projection and presentation contracts",
    description:
      "Projection bundles and presentation artifacts consumed by shells and workers through one public API.",
    versioningPosture: "Published projection contract family with additive-first evolution.",
    consumerContractIds: [
      "CBC_041_SHELLS_TO_API_CONTRACTS",
      "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
      "CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS",
      "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
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
      "services/adapter-simulators",
      "services/api-gateway",
      "services/projection-worker",
      "tools/assistive-control-lab",
    ],
    sourceRefs: [
      "blueprint/platform-frontend-blueprint.md#ProjectionContractFamily",
      "prompt/044.md",
    ],
    ownedObjectFamilyCount: 56,
  },
  {
    contractFamilyId: "CF_044_ASSISTIVE_AND_VISUALIZATION_SURFACES",
    label: "Assistive and visualization surfaces",
    description:
      "Assistive and visualization-facing runtime surfaces that must stay outside domain package internals.",
    versioningPosture: "Published UI-adjacent contract family with release-gated widening.",
    consumerContractIds: [
      "CBC_041_SHELLS_TO_API_CONTRACTS",
      "CBC_041_API_GATEWAY_TO_SHARED_CONTRACTS",
      "CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS",
      "CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES",
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
      "services/adapter-simulators",
      "services/api-gateway",
      "services/projection-worker",
      "tools/assistive-control-lab",
    ],
    sourceRefs: [
      "blueprint/platform-frontend-blueprint.md#Live-update, cache-policy, and route-inventory families",
      "prompt/044.md",
    ],
    ownedObjectFamilyCount: 68,
  },
] as const satisfies readonly OwnedContractFamily[];

export const eventFamilies = [
  {
    canonicalName: "UIEventEmissionCheckpoint",
    objectKind: "checkpoint",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 8. Required UI events / UIEventEmissionCheckpoint",
  },
  {
    canonicalName: "UIEventVisibilityProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 8. Required UI events / UIEventVisibilityProfile",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "AssistiveVisibilityPolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveVisibilityPolicy",
  },
  {
    canonicalName: "CognitiveLoadGovernor",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / CognitiveLoadGovernor",
  },
  {
    canonicalName: "FeedbackEligibilityFlag",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / FeedbackEligibilityFlag",
  },
  {
    canonicalName: "FocusIntegrityGuard",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / FocusIntegrityGuard",
  },
  {
    canonicalName: "HumanApprovalGateAssessment",
    objectKind: "record",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8F. Human-in-the-loop workspace integration, override capture, and feedback loop / Backend work / HumanApprovalGateAssessment",
  },
  {
    canonicalName: "LiveAnnouncementGovernor",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / LiveAnnouncementGovernor",
  },
  {
    canonicalName: "ModelPolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / ModelPolicy",
  },
  {
    canonicalName: "NeighborSubstitutionPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Design principles applied / 3. Object permanence before cleverness / NeighborSubstitutionPolicy",
  },
  {
    canonicalName: "NoAutoWritePolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / NoAutoWritePolicy",
  },
  {
    canonicalName: "PatientAttentionCuePolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Portal entry and shell topology / PatientAttentionCuePolicy",
  },
  {
    canonicalName: "PatientNavSectionEligibility",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientNavSectionEligibility",
  },
  {
    canonicalName: "PatientRecordFollowUpEligibilityProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Health record contract / PatientRecordFollowUpEligibilityProjection",
  },
  {
    canonicalName: "PatientSelectedAnchorPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Primary navigation model / PatientSelectedAnchorPolicy",
  },
  {
    canonicalName: "ProjectionReadinessFence",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules / ProjectionReadinessFence",
  },
  {
    canonicalName: "QuietClarityEligibilityGate",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "ux-quiet-clarity-redesign.md#Conceptual redesign strategy / 0. Canonical truth and posture eligibility / QuietClarityEligibilityGate",
  },
  {
    canonicalName: "RecordReleaseGate",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Patient secure record route contract / RecordReleaseGate",
  },
  {
    canonicalName: "RecoveryRedactionFence",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Deep-link and recovery rules / RecoveryRedactionFence",
  },
  {
    canonicalName: "ReplayEvidencePolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / ReplayEvidencePolicy",
  },
  {
    canonicalName: "RuleGuardResult",
    objectKind: "other",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8E. Risk extraction, question suggestions, and endpoint recommendation orchestrator / Backend work / RuleGuardResult",
  },
  {
    canonicalName: "SelectedAnchorPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / SelectedAnchorPolicy",
  },
  {
    canonicalName: "ShellScopeDescriptor",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.2 Continuity key and shell law / ShellScopeDescriptor",
  },
  {
    canonicalName: "StatusAcknowledgementScope",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 4. Canonical real-time rendering algorithm / StatusAcknowledgementScope",
  },
  {
    canonicalName: "SurfacePostureGovernor",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / SurfacePostureGovernor",
  },
  {
    canonicalName: "TokenKernelLayeringPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "design-token-foundation.md#Machine-readable export contract / TokenKernelLayeringPolicy",
  },
  {
    canonicalName: "WritableEligibilityFence",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules / WritableEligibilityFence",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [
  {
    canonicalName: "AssistiveAnnouncementTruthProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 4. Canonical real-time rendering algorithm / AssistiveAnnouncementTruthProjection",
  },
  {
    canonicalName: "ConversationSubthreadProjection",
    objectKind: "projection",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ConversationSubthreadProjection",
  },
  {
    canonicalName: "ConversationThreadProjection",
    objectKind: "projection",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ConversationThreadProjection",
  },
  {
    canonicalName: "PatientActionRecoveryProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Recovery and identity-hold contract / PatientActionRecoveryProjection",
  },
  {
    canonicalName: "PatientActionRoutingProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Typed patient action routing contract / PatientActionRoutingProjection",
  },
  {
    canonicalName: "PatientActionSettlementProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Typed patient action routing contract / PatientActionSettlementProjection",
  },
  {
    canonicalName: "PatientAudienceCoverageProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Patient audience coverage contract / PatientAudienceCoverageProjection",
  },
  {
    canonicalName: "PatientCallbackStatusProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Callback status, contact repair, and consent checkpoint contract / PatientCallbackStatusProjection",
  },
  {
    canonicalName: "PatientCommunicationVisibilityProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Communications timeline contract / PatientCommunicationVisibilityProjection",
  },
  {
    canonicalName: "PatientConsentCheckpointProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Callback status, contact repair, and consent checkpoint contract / PatientConsentCheckpointProjection",
  },
  {
    canonicalName: "PatientContactRepairProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Callback status, contact repair, and consent checkpoint contract / PatientContactRepairProjection",
  },
  {
    canonicalName: "PatientExperienceContinuityEvidenceProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Core projections / PatientExperienceContinuityEvidenceProjection",
  },
  {
    canonicalName: "PatientIdentityHoldProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Recovery and identity-hold contract / PatientIdentityHoldProjection",
  },
  {
    canonicalName: "PatientManageCapabilitiesProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Manage capabilities contract / PatientManageCapabilitiesProjection",
  },
  {
    canonicalName: "PatientMoreInfoStatusProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#More-info response contract / PatientMoreInfoStatusProjection",
  },
  {
    canonicalName: "PatientNextActionProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Request detail contract / PatientNextActionProjection",
  },
  {
    canonicalName: "PatientPortalEntryProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Portal entry and shell topology / PatientPortalEntryProjection",
  },
  {
    canonicalName: "PatientReachabilitySummaryProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Callback status, contact repair, and consent checkpoint contract / PatientReachabilitySummaryProjection",
  },
  {
    canonicalName: "PatientRecordArtifactProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Health record contract / PatientRecordArtifactProjection",
  },
  {
    canonicalName: "PatientRecordFollowUpEligibilityProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Health record contract / PatientRecordFollowUpEligibilityProjection",
  },
  {
    canonicalName: "PatientRequestDetailProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Request detail contract / PatientRequestDetailProjection",
  },
  {
    canonicalName: "PatientRequestDownstreamProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Request detail contract / PatientRequestDownstreamProjection",
  },
  {
    canonicalName: "PatientRequestSummaryProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Request detail contract / PatientRequestSummaryProjection",
  },
  {
    canonicalName: "PatientRequestsIndexProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "patient-portal-experience-architecture-blueprint.md#Overarching conceptual design strategy / Requests surface contract / PatientRequestsIndexProjection",
  },
  {
    canonicalName: "PatientResultInterpretationProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Health record contract / PatientResultInterpretationProjection",
  },
  {
    canonicalName: "PatientSafetyInterruptionProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Typed patient action routing contract / PatientSafetyInterruptionProjection",
  },
  {
    canonicalName: "PatientSecureLinkSessionProjection",
    objectKind: "projection",
    boundedContext: "patient_experience",
    authoritativeOwner: "Patient experience projections",
    sourceRef:
      "patient-account-and-communications-blueprint.md#Recovery and identity-hold contract / PatientSecureLinkSessionProjection",
  },
  {
    canonicalName: "ProjectionContractFamily",
    objectKind: "descriptor",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / ProjectionContractFamily",
  },
  {
    canonicalName: "ProjectionContractVersion",
    objectKind: "descriptor",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / ProjectionContractVersion",
  },
  {
    canonicalName: "ProjectionContractVersionSet",
    objectKind: "bundle",
    boundedContext: "runtime_release",
    authoritativeOwner: "Runtime publication control plane",
    sourceRef:
      "platform-runtime-and-release-blueprint.md#Runtime publication completeness / ProjectionContractVersionSet",
  },
  {
    canonicalName: "ProjectionReadinessFence",
    objectKind: "gate",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Shared visibility, hydration, and empty-state rules / ProjectionReadinessFence",
  },
  {
    canonicalName: "ProjectionSubscription",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / ProjectionSubscription",
  },
  {
    canonicalName: "RecordPlaceholderProjection",
    objectKind: "projection",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Patient secure record route contract / RecordPlaceholderProjection",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const publishedSurfaceContractFamilies = ownedObjectFamilies;

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

// seq_050_frontend_contract_manifest_exports:start
export const frontendContractManifestCatalog = {
  taskId: "seq_050",
  visualMode: "Manifest_Studio",
  schemaArtifactPath: "packages/api-contracts/schemas/frontend-contract-manifest.schema.json",
  manifestCount: 9,
  browserVisibleRouteFamilyCount: 19,
  projectionQueryContractCount: 19,
  mutationCommandContractCount: 19,
  liveUpdateChannelContractCount: 15,
  accessibilityProfileCount: 19,
  browserPostureStates: ["read_only", "recovery_only"],
  accessibilityCoverageStates: ["blocked", "degraded"],
  digestAlgorithm: "sha256:16",
} as const;

export const frontendContractManifestSchemas = [
  {
    schemaId: "FrontendContractManifest",
    artifactPath: "packages/api-contracts/schemas/frontend-contract-manifest.schema.json",
    generatedByTask: "seq_050",
    manifestCount: 9,
    browserVisibleRouteFamilyCount: 19,
  },
] as const;
// seq_050_frontend_contract_manifest_exports:end

// par_113_frontend_manifest_runtime_exports:start
export * from "./frontend-contract-manifest";
export {
  frontendContractManifestExamples,
  frontendManifestRuntimeCatalog,
  frontendManifestRuntimeSchemas,
  frontendManifestStore,
  frontendManifestValidationExamples,
  seedRouteManifestSpecimens,
} from "./frontend-contract-manifest.catalog";
// par_113_frontend_manifest_runtime_exports:end

// par_065_api_contract_registry_exports:start
export * from "./api-contract-registry";
// par_065_api_contract_registry_exports:end

// seq_056_scoped_mutation_gate_exports:start
export const scopedMutationGateCatalog = {
  taskId: "seq_056",
  visualMode: "Mutation_Intent_Lab",
  routeIntentRowCount: 16,
  actionScopeCount: 14,
  routeFamilyCount: 9,
  settlementResultCount: 10,
  recoveryModeCount: 8,
  bindingStates: ["live", "recovery_only", "stale", "superseded"],
  schemaArtifactPaths: [
    "packages/api-contracts/schemas/route-intent-binding.schema.json",
    "packages/api-contracts/schemas/command-settlement-record.schema.json",
  ],
} as const;

export const scopedMutationGateSchemas = [
  {
    schemaId: "RouteIntentBinding",
    artifactPath: "packages/api-contracts/schemas/route-intent-binding.schema.json",
    generatedByTask: "seq_056",
  },
  {
    schemaId: "CommandSettlementRecord",
    artifactPath: "packages/api-contracts/schemas/command-settlement-record.schema.json",
    generatedByTask: "seq_056",
  },
] as const;
// seq_056_scoped_mutation_gate_exports:end

// seq_057_adapter_contract_profile_exports:start
export const adapterContractProfileCatalog = {
  taskId: "seq_057",
  visualMode: "Adapter_Contract_Studio",
  adapterProfileCount: 20,
  degradationProfileCount: 20,
  effectFamilyCount: 20,
  schemaArtifactPaths: [
    "packages/api-contracts/schemas/adapter-contract-profile.schema.json",
    "packages/api-contracts/schemas/dependency-degradation-profile.schema.json",
  ],
} as const;

export const adapterContractProfileSchemas = [
  {
    schemaId: "AdapterContractProfile",
    artifactPath: "packages/api-contracts/schemas/adapter-contract-profile.schema.json",
    generatedByTask: "seq_057",
  },
  {
    schemaId: "DependencyDegradationProfile",
    artifactPath: "packages/api-contracts/schemas/dependency-degradation-profile.schema.json",
    generatedByTask: "seq_057",
  },
] as const;
// seq_057_adapter_contract_profile_exports:end

// seq_058_verification_ladder_exports:start
export const releaseVerificationLadderCatalog = {
  taskId: "seq_058",
  visualMode: "Verification_Ladder_Cockpit",
  ringCount: 5,
  verificationScenarioCount: 5,
  verificationMatrixCount: 5,
  gateCount: 5,
  syntheticRecoveryCoverageCount: 29,
  schemaArtifactPaths: [
    "packages/api-contracts/schemas/release-contract-verification-matrix.schema.json",
  ],
} as const;

export const releaseVerificationLadderSchemas = [
  {
    schemaId: "ReleaseContractVerificationMatrix",
    artifactPath: "packages/api-contracts/schemas/release-contract-verification-matrix.schema.json",
    generatedByTask: "seq_058",
  },
] as const;
// seq_058_verification_ladder_exports:end

// seq_060_recovery_tuple_baseline_exports:start
export const recoveryTupleBaselineCatalog = {
  taskId: "seq_060",
  visualMode: "Resilience_Control_Lab",
  essentialFunctionCount: 9,
  liveControlScopeCount: 3,
  blockedScopeCount: 2,
  backupManifestCount: 10,
  recoveryEvidenceArtifactCount: 18,
  schemaArtifactPaths: ["packages/api-contracts/schemas/recovery-control-posture.schema.json"],
} as const;

export const recoveryTupleBaselineSchemas = [
  {
    schemaId: "RecoveryControlPosture",
    artifactPath: "packages/api-contracts/schemas/recovery-control-posture.schema.json",
    generatedByTask: "seq_060",
  },
] as const;
// seq_060_recovery_tuple_baseline_exports:end

// par_072_transition_envelope_exports:start
export * from "./transition-envelope";
// par_072_transition_envelope_exports:end

// par_072_settlement_envelope_catalog:start
export const commandSettlementEnvelopeCatalog = {
  taskId: "par_072",
  visualMode: "Settlement_Envelope_Atlas",
  scenarioCount: 7,
  settlementRevisionCount: 10,
  recoveryRequiredCount: 3,
  settledCount: 2,
  schemaArtifactPaths: [
    "packages/api-contracts/schemas/command-settlement-record.schema.json",
    "packages/api-contracts/schemas/transition-envelope.schema.json",
  ],
} as const;

export const commandSettlementEnvelopeSchemas = [
  {
    schemaId: "CommandSettlementRecord",
    artifactPath: "packages/api-contracts/schemas/command-settlement-record.schema.json",
    generatedByTask: "par_072",
  },
  {
    schemaId: "TransitionEnvelope",
    artifactPath: "packages/api-contracts/schemas/transition-envelope.schema.json",
    generatedByTask: "par_072",
  },
] as const;
// par_072_settlement_envelope_catalog:end

// par_073_queue_ranking_exports:start
export * from "./queue-ranking";
// par_073_queue_ranking_exports:end
