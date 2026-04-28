import type { CSSProperties, ReactNode } from "react";
import {
  componentPrimitiveContractFamily,
  componentPrimitiveObjectFamilies,
} from "./component-primitives";
export {
  PHARMACY_ACCESSIBLE_QUIET_POLISH_VISUAL_MODE,
  PharmacyA11yAnnouncementHub,
  PharmacyAccessibleStatusBadge,
  PharmacyDialogAndDrawerSemantics,
  PharmacyFocusRouteMap,
  PharmacyInlineAck,
  PharmacyReducedMotionBridge,
  PharmacyTargetSizeGuard,
} from "./pharmacy-accessibility-micro-interactions";
export type { PharmacyAccessibleTone } from "./pharmacy-accessibility-micro-interactions";
export {
  OpenOriginalRequestAction,
  PHARMACY_RECOVERY_CONTROL_VISUAL_MODE,
  PharmacyBounceBackQueue,
  PharmacyLoopRiskEscalationCard,
  PharmacyRecoveryControlPanel,
  PharmacyRecoveryDecisionDock,
  PharmacyReopenedCaseBanner,
  PharmacyReopenDiffStrip,
  PharmacyReturnMessagePreview,
  PharmacyUrgentReturnMode,
} from "./pharmacy-bounce-back-recovery-surfaces";
export type {
  OpenOriginalRequestActionModel,
  PharmacyBounceBackQueueItemModel,
  PharmacyBounceBackQueueModel,
  PharmacyBounceBackRecoveryPanelModel,
  PharmacyLoopRiskEscalationCardModel,
  PharmacyRecoveryDecisionDockActionModel,
  PharmacyRecoveryDecisionDockModel,
  PharmacyRecoverySurfaceState,
  PharmacyRecoveryTone,
  PharmacyReopenedCaseBannerModel,
  PharmacyReopenDiffRowModel,
  PharmacyReopenDiffStripModel,
  PharmacyReturnMessagePreviewModel,
  PharmacyUrgentReturnModeModel,
} from "./pharmacy-bounce-back-recovery-surfaces";
export {
  PHARMACY_MISSION_STACK_RECOVERY_VISUAL_MODE,
  PharmacyCaseResumeStub,
  PharmacyContinuityFrozenOverlay,
  PharmacyMissionStackController,
  PharmacyQueuePeekDrawer,
  PharmacyRecoveryStrip,
  PharmacySupportRegionResumeCard,
  PharmacyWatchWindowReentryBanner,
} from "./pharmacy-mission-stack-recovery-surfaces";
export type {
  PharmacyCaseResumeStubModel,
  PharmacyContinuityFrozenOverlayModel,
  PharmacyMissionStackControllerModel,
  PharmacyMissionStackTone,
  PharmacyQueuePeekDrawerModel,
  PharmacyRecoveryStripModel,
  PharmacySupportRegionResumeCardModel,
  PharmacyWatchWindowReentryBannerModel,
} from "./pharmacy-mission-stack-recovery-surfaces";
export {
  ChosenPharmacyAnchorCard,
  DispatchArtifactSummaryCard,
  DispatchContinuityWarningStrip,
  DispatchEvidenceRows,
  DispatchProofStatusStrip,
  PatientConsentCheckpointNotice,
  PatientDispatchPendingState,
  PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE,
  PharmacyReferralConfirmationDrawer,
} from "./pharmacy-dispatch-surfaces";
export type {
  ChosenPharmacyAnchorCardModel,
  DispatchArtifactDisposition,
  DispatchArtifactSummaryCardModel,
  DispatchArtifactSummaryRowModel,
  DispatchContinuityWarningStripModel,
  DispatchEvidenceRowModel,
  DispatchProofStatusStripModel,
  DispatchSurfaceTone,
  DispatchWarningKind,
  PatientConsentCheckpointNoticeModel,
  PatientDispatchPendingStateModel,
} from "./pharmacy-dispatch-surfaces";
export {
  OutcomeConfidenceMeter,
  OutcomeDecisionDock,
  OutcomeEvidenceDrawer,
  OutcomeEvidenceSourceCard,
  OutcomeGateTimeline,
  OutcomeManualReviewBanner,
  OutcomeMatchSummary,
  PHARMACY_ASSURANCE_WORKBENCH_VISUAL_MODE,
  PharmacyOutcomeAssurancePanel,
} from "./pharmacy-outcome-assurance-surfaces";
export type {
  OutcomeAssuranceHeaderModel,
  OutcomeConfidenceBreakdownModel,
  OutcomeConfidenceMeterModel,
  OutcomeDecisionDockActionModel,
  OutcomeDecisionDockModel,
  OutcomeEvidenceDrawerGroupModel,
  OutcomeEvidenceDrawerModel,
  OutcomeEvidenceDrawerRowModel,
  OutcomeEvidenceSourceCardModel,
  OutcomeGateTimelineModel,
  OutcomeGateTimelineStepModel,
  OutcomeManualReviewBannerModel,
  OutcomeMatchSummaryModel,
  PharmacyOutcomeAssurancePanelModel,
  PharmacyOutcomeAssuranceSurfaceState,
  PharmacyOutcomeAssuranceTone,
} from "./pharmacy-outcome-assurance-surfaces";
export {
  ChosenPharmacyConfirmationPage,
  PharmacyContactCard,
  PharmacyContactRouteRepairState,
  PharmacyNextStepPage,
  PharmacyOpeningStateChip,
  PharmacyOutcomePage,
  PharmacyReferralReferenceCard,
  PharmacyReviewNextStepPage,
  PharmacyStatusTracker,
} from "./pharmacy-patient-status-surfaces";
export type {
  ChosenPharmacyConfirmationPageModel,
  PharmacyContactCardModel,
  PharmacyContactRouteRepairStateModel,
  PharmacyNextStepPageModel,
  PharmacyOpeningStateChipModel,
  PharmacyOpeningStateChipTone,
  PharmacyOutcomePageModel,
  PharmacyReferralReferenceCardModel,
  PharmacyReviewNextStepPageModel,
  PharmacyStatusTrackerModel,
  PharmacyStatusTrackerStepModel,
} from "./pharmacy-patient-status-surfaces";
export {
  HandoffReadinessBoard,
  InventoryComparisonWorkspace,
  InventoryTruthPanel,
  MedicationValidationBoard,
  PHARMACY_OPERATIONS_WORKBENCH_VISUAL_MODE,
  PharmacyCaseWorkbench,
  PharmacyOperationsPanel,
  PharmacyOperationsQueueTable,
  PharmacyStockRiskChip,
  PharmacyWatchWindowBanner,
  PharmacyWorkbenchDecisionDock,
} from "./pharmacy-workbench-surfaces";
export type {
  HandoffProofLaneModel,
  HandoffReadinessBoardModel,
  InventoryComparisonCandidateModel,
  InventoryComparisonWorkspaceModel,
  InventoryTruthPanelModel,
  InventoryTruthRecordModel,
  MedicationLineCardModel,
  MedicationValidationBoardModel,
  MedicationValidationSignalModel,
  PharmacyCaseWorkbenchModel,
  PharmacyOperationsMetricModel,
  PharmacyOperationsPanelModel,
  PharmacyOperationsQueueRowModel,
  PharmacyOperationsQueueTableModel,
  PharmacyStockRiskChipModel,
  PharmacyWatchWindowBannerModel,
  PharmacyWorkbenchDecisionDockActionModel,
  PharmacyWorkbenchDecisionDockModel,
  PharmacyWorkbenchTone,
} from "./pharmacy-workbench-surfaces";

export interface ShellMetric {
  label: string;
  value: string;
  detail: string;
}

export interface ShellCard {
  kicker: string;
  title: string;
  body: string;
  footnote: string;
}

export interface ShellVisualRow {
  label: string;
  value: string;
  detail: string;
}

export interface ShellRailItem {
  title: string;
  detail: string;
}

export interface FoundationShellDefinition {
  slug: string;
  displayName: string;
  namespace: string;
  layout: "patient" | "clinical" | "ops" | "hub" | "pharmacy" | "support" | "governance";
  accentPrimary: string;
  accentSecondary: string;
  masthead: string;
  eyebrow: string;
  title: string;
  description: string;
  chips: string[];
  metrics: ShellMetric[];
  cards: ShellCard[];
  visualTitle: string;
  visualRows: ShellVisualRow[];
  railTitle: string;
  railItems: ShellRailItem[];
  parityHeaders: [string, string, string];
  parityRows: [string, string, string][];
}

export interface ReleasePosture {
  ring: string;
  publication: string;
  owner: string;
  automationGate: string;
}

export interface ShellContract {
  shellSlug: string;
  artifactId: string;
  ownerContext: string;
  routeFamilyIds: readonly string[];
  gatewaySurfaceIds: readonly string[];
  routeCount: number;
  gatewayCount: number;
  automationMarkers: readonly string[];
}

export interface ShellTelemetrySnapshot {
  shellSlug: string;
  routeCount: number;
  gatewayCount: number;
  continuityPosture: string;
  publicationPosture: string;
}

export interface FoundationOwnershipProps {
  artifactId: string;
  ownerContext: string;
  rootTestId: string;
}

function MetricStrip({ metrics }: { metrics: FoundationShellDefinition["metrics"] }) {
  return (
    <div className="foundation-metrics" data-testid="metric-strip">
      {metrics.map((metric) => (
        <article className="foundation-metric" key={metric.label}>
          <span className="foundation-kicker">{metric.label}</span>
          <strong>{metric.value}</strong>
          <p>{metric.detail}</p>
        </article>
      ))}
    </div>
  );
}

function CardGrid({ cards }: { cards: FoundationShellDefinition["cards"] }) {
  return (
    <div className="foundation-card-grid">
      {cards.map((card) => (
        <article className="foundation-card" key={card.title}>
          <span className="foundation-kicker">{card.kicker}</span>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
          <small>{card.footnote}</small>
        </article>
      ))}
    </div>
  );
}

function VisualRows({
  layout,
  title,
  rows,
}: {
  layout: FoundationShellDefinition["layout"];
  title: string;
  rows: FoundationShellDefinition["visualRows"];
}) {
  return (
    <section
      className={`foundation-visual foundation-visual--${layout}`}
      data-testid="shell-visual"
    >
      <div className="foundation-panel-header">
        <span className="foundation-kicker">Visual</span>
        <h3>{title}</h3>
      </div>
      <div className="foundation-visual-stack">
        {rows.map((row) => (
          <article
            className="foundation-visual-row"
            data-testid={`${layout}::visual`}
            key={`${row.label}-${row.value}`}
          >
            <strong>{row.label}</strong>
            <span>{row.value}</span>
            <p>{row.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Rail({ title, items }: { title: string; items: FoundationShellDefinition["railItems"] }) {
  return (
    <section className="foundation-rail">
      <div className="foundation-panel-header">
        <span className="foundation-kicker">Rail</span>
        <h3>{title}</h3>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ParityTable({
  shell,
  contract,
}: {
  shell: FoundationShellDefinition;
  contract: ShellContract;
}) {
  return (
    <section className="foundation-parity" data-testid="shell-parity">
      <div className="foundation-panel-header">
        <span className="foundation-kicker">Parity</span>
        <h3>Visual/list parity</h3>
      </div>
      <table data-testid={`${shell.namespace}::parity`}>
        <thead>
          <tr>
            {shell.parityHeaders.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shell.parityRows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
          <tr>
            <td>Route families</td>
            <td>{contract.routeCount}</td>
            <td>Route ownership remains visible in every shell placeholder.</td>
          </tr>
          <tr>
            <td>Gateway surfaces</td>
            <td>{contract.gatewayCount}</td>
            <td>Gateway breadth is visible without implying live backend completeness.</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function OwnershipStrip({
  ownership,
  release,
  telemetry,
  contract,
}: {
  ownership: FoundationOwnershipProps;
  release: ReleasePosture;
  telemetry: ShellTelemetrySnapshot;
  contract: ShellContract;
}) {
  return (
    <section className="foundation-ownership" data-testid="ownership-strip">
      <div>
        <span className="foundation-kicker">Artifact</span>
        <strong>{ownership.artifactId}</strong>
      </div>
      <div>
        <span className="foundation-kicker">Owner</span>
        <strong>{ownership.ownerContext}</strong>
      </div>
      <div>
        <span className="foundation-kicker">Release</span>
        <strong>
          {release.ring} / {release.publication}
        </strong>
      </div>
      <div>
        <span className="foundation-kicker">Telemetry</span>
        <strong>{telemetry.continuityPosture}</strong>
      </div>
      <div>
        <span className="foundation-kicker">Markers</span>
        <strong>{contract.automationMarkers.join(", ")}</strong>
      </div>
    </section>
  );
}

export function FoundationShellApp({
  shell,
  contract,
  release,
  telemetry,
  ownership,
}: {
  shell: FoundationShellDefinition;
  contract: ShellContract;
  release: ReleasePosture;
  telemetry: ShellTelemetrySnapshot;
  ownership: FoundationOwnershipProps;
}) {
  const style = {
    "--accent-primary": shell.accentPrimary,
    "--accent-secondary": shell.accentSecondary,
  } as CSSProperties;

  return (
    <main
      className={`foundation-shell foundation-shell--${shell.layout}`}
      style={style}
      data-shell={shell.slug}
      data-testid={ownership.rootTestId}
      aria-label={`${shell.displayName} placeholder shell`}
    >
      <header className="foundation-masthead">
        <div>
          <span className="foundation-kicker">{shell.eyebrow}</span>
          <h1>{shell.displayName}</h1>
          <p>{shell.title}</p>
        </div>
        <div className="foundation-chip-row">
          <span className="foundation-chip foundation-chip--masthead">{shell.masthead}</span>
          {shell.chips.map((chip) => (
            <span className="foundation-chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      </header>
      <OwnershipStrip
        ownership={ownership}
        release={release}
        telemetry={telemetry}
        contract={contract}
      />
      <MetricStrip metrics={shell.metrics} />
      <section className="foundation-grid">
        <section className="foundation-panel foundation-panel--primary">
          <div className="foundation-panel-header">
            <span className="foundation-kicker">Primary</span>
            <h2>{shell.description}</h2>
          </div>
          <CardGrid cards={shell.cards} />
        </section>
        <section className="foundation-panel foundation-panel--visual">
          <VisualRows layout={shell.layout} title={shell.visualTitle} rows={shell.visualRows} />
        </section>
        <section className="foundation-panel foundation-panel--rail">
          <Rail title={shell.railTitle} items={shell.railItems} />
        </section>
        <section className="foundation-panel foundation-panel--parity">
          <ParityTable shell={shell} contract={contract} />
        </section>
      </section>
    </main>
  );
}

export function FoundationStaticLabel({ children }: { children: ReactNode }) {
  return <span className="foundation-chip">{children}</span>;
}

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
  artifactId: "package_design_system",
  packageName: "@vecells/design-system",
  packageRole: "shared",
  ownerContextCode: "design_system",
  ownerContextLabel: "Design System",
  purpose:
    "Single legal shared home for tokens, automation markers, accessibility vocabulary, and shell-inheritance law.",
  versioningPosture:
    "Workspace-private published contract boundary. Public exports are explicit and versionable.",
  allowedDependencies: [],
  forbiddenDependencies: ["packages/domains/*", "services/*"],
  dependencyContractRefs: ["CBC_041_SHELLS_TO_DESIGN_SYSTEM"],
  objectFamilyCount: 65,
  contractFamilyCount: 2,
  sourceContexts: ["assistive", "foundation_runtime_experience", "frontend_runtime", "unknown"],
} as const satisfies PackageContract;

const legacyOwnedObjectFamilies = [
  {
    canonicalName: "AccessibilityEquivalenceCheck",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 7. Canonical motion, accessibility, and verification system / AccessibilityEquivalenceCheck",
  },
  {
    canonicalName: "AccessibilitySemanticCoverageProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Shared IA rules / AccessibilitySemanticCoverageProfile",
  },
  {
    canonicalName: "AccessibleContentVariant",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7G. Accessibility, design-system convergence, and channel-grade UX refinement / Backend work / AccessibleContentVariant",
  },
  {
    canonicalName: "AmbientStateRibbon",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / AmbientStateRibbon",
  },
  {
    canonicalName: "AppPageIntent",
    objectKind: "other",
    boundedContext: "unknown",
    authoritativeOwner: "Programme architecture registry",
    sourceRef:
      "phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours / Backend work / AppPageIntent",
  },
  {
    canonicalName: "AssistiveCompositionPolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveCompositionPolicy",
  },
  {
    canonicalName: "AssistiveTextPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / AssistiveTextPolicy",
  },
  {
    canonicalName: "AutomationAnchorMap",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "canonical-ui-contract-kernel.md#Canonical contracts / AutomationAnchorMap",
  },
  {
    canonicalName: "AutomationAnchorProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "platform-frontend-blueprint.md#Shared IA rules / AutomationAnchorProfile",
  },
  {
    canonicalName: "BreakpointInterpolationRule",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 0.1A Canonical design-token and visual-language foundation / BreakpointInterpolationRule",
  },
  {
    canonicalName: "FieldAccessibilityContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / FieldAccessibilityContract",
  },
  {
    canonicalName: "FreshnessAccessibilityContract",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / FreshnessAccessibilityContract",
  },
  {
    canonicalName: "FreshnessChip",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / FreshnessChip",
  },
  {
    canonicalName: "MotionCueEnvelope",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 7. Canonical motion, accessibility, and verification system / MotionCueEnvelope",
  },
  {
    canonicalName: "MotionIntentToken",
    objectKind: "token",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 1. Required experience topology and primitives / MotionIntentToken",
  },
  {
    canonicalName: "MotionRegionArbitration",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 7. Canonical motion, accessibility, and verification system / MotionRegionArbitration",
  },
  {
    canonicalName: "MotionSemanticRegistry",
    objectKind: "other",
    boundedContext: "foundation_runtime_experience",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "phase-0-the-foundation-protocol.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 2. Required frontend services / MotionSemanticRegistry",
  },
  {
    canonicalName: "MotionVerificationTrace",
    objectKind: "other",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 7. Canonical motion, accessibility, and verification system / MotionVerificationTrace",
  },
  {
    canonicalName: "ReducedMotionProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "platform-frontend-blueprint.md#Canonical real-time interaction, motion, and live-projection experience algorithm / 7. Canonical motion, accessibility, and verification system / ReducedMotionProfile",
  },
  {
    canonicalName: "SurfaceStateSemanticsProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "canonical-ui-contract-kernel.md#Canonical contracts / SurfaceStateSemanticsProfile",
  },
  {
    canonicalName: "VisualTokenProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "canonical-ui-contract-kernel.md#Canonical contracts / VisualTokenProfile",
  },
  {
    canonicalName: "SurfaceStateKernelBinding",
    objectKind: "contract",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "canonical-ui-contract-kernel.md#Canonical contracts / SurfaceStateKernelBinding",
  },
  {
    canonicalName: "TelemetryBindingProfile",
    objectKind: "descriptor",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "canonical-ui-contract-kernel.md#Canonical contracts / TelemetryBindingProfile",
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
    canonicalName: "DesignContractVocabularyTuple",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "canonical-ui-contract-kernel.md#Canonical contracts / DesignContractVocabularyTuple",
  },
  {
    canonicalName: "DesignContractPublicationBundle",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "canonical-ui-contract-kernel.md#Canonical contracts / DesignContractPublicationBundle",
  },
  {
    canonicalName: "DesignContractLintVerdict",
    objectKind: "record",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef: "canonical-ui-contract-kernel.md#Canonical contracts / DesignContractLintVerdict",
  },
];

export const ownedObjectFamilies = [
  ...legacyOwnedObjectFamilies,
  ...componentPrimitiveObjectFamilies,
] as const satisfies readonly OwnedObjectFamily[];

const legacyOwnedContractFamilies = [
  {
    contractFamilyId: "CF_044_TOKENS_AND_ACCESSIBILITY_MARKERS",
    label: "Design tokens, accessibility vocabulary, and automation markers",
    description:
      "Single shared home for design inheritance, accessibility semantics, and stable shell markers.",
    versioningPosture: "Published design contract family with controlled additive marker growth.",
    consumerContractIds: ["CBC_041_SHELLS_TO_DESIGN_SYSTEM"],
    consumerOwnerCodes: [
      "governance_admin",
      "hub_coordination",
      "operations",
      "patient_experience",
      "pharmacy",
      "support",
      "triage_workspace",
    ],
    consumerSelectors: ["apps/*"],
    sourceRefs: [
      "blueprint/design-token-foundation.md",
      "blueprint/accessibility-and-content-system-contract.md",
      "prompt/044.md",
    ],
    ownedObjectFamilyCount: 27,
  },
];

export const ownedContractFamilies = [
  ...legacyOwnedContractFamilies,
  componentPrimitiveContractFamily,
] as const satisfies readonly OwnedContractFamily[];

export const eventFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [
  {
    canonicalName: "AssistiveCompositionPolicy",
    objectKind: "policy",
    boundedContext: "assistive",
    authoritativeOwner: "Assistive control plane",
    sourceRef:
      "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope / Backend work / AssistiveCompositionPolicy",
  },
  {
    canonicalName: "AssistiveTextPolicy",
    objectKind: "policy",
    boundedContext: "frontend_runtime",
    authoritativeOwner: "Frontend continuity runtime",
    sourceRef:
      "accessibility-and-content-system-contract.md#Canonical accessibility and content objects / AssistiveTextPolicy",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const designContractFamilies = ownedContractFamilies;
export const designObjectFamilies = ownedObjectFamilies;

export function automationMarkerForShell(shellSlug: string): string {
  return `${shellSlug}::foundation-marker`;
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

// seq_052_design_contract_publication_exports:start
export const designContractPublicationCatalog = {
  taskId: "seq_052",
  visualMode: "Design_Contract_Studio",
  schemaArtifactPath: "packages/design-system/contracts/design-contract-publication.schema.json",
  bundleCount: 9,
  publishedBundleCount: 9,
  blockedBundleCount: 0,
  lintVerdictCount: 9,
  lintPassCount: 9,
  vocabularyTupleCount: 19,
  tokenExportArtifactCount: 7,
  audiences: [
    "audsurf_patient_public_entry",
    "audsurf_patient_authenticated_portal",
    "audsurf_patient_transaction_recovery",
    "audsurf_clinical_workspace",
    "audsurf_support_workspace",
    "audsurf_hub_desk",
    "audsurf_pharmacy_console",
    "audsurf_operations_console",
    "audsurf_governance_admin",
  ],
  digestAlgorithm: "sha256:16",
} as const;

export const designContractPublicationSchemas = [
  {
    schemaId: "DesignContractPublicationBundle",
    artifactPath: "packages/design-system/contracts/design-contract-publication.schema.json",
    generatedByTask: "seq_052",
    bundleCount: 9,
    lintVerdictCount: 9,
  },
] as const;
// seq_052_design_contract_publication_exports:end

export {
  COMPONENT_FOLLOW_ON_DEPENDENCIES,
  COMPONENT_GAP_RESOLUTIONS,
  COMPONENT_PRIMITIVES_CSS_PATH,
  COMPONENT_PRIMITIVES_PUBLICATION_PATH,
  COMPONENT_PRIMITIVES_SCHEMA_PATH,
  COMPONENT_PRIMITIVES_SOURCE_PRECEDENCE,
  COMPONENT_PRIMITIVES_TASK_ID,
  COMPONENT_PRIMITIVES_VISUAL_MODE,
  buildComponentPrimitiveArtifacts,
  componentAtlasSections,
  componentPrimitiveContractFamily,
  componentPrimitiveContracts,
  componentPrimitiveObjectFamilies,
  renderAtlasSupplementalShelf,
  renderSpecimenComposition,
  resolvePrimitiveRouteBinding,
  shellProfileLenses,
  specimenCompositions,
} from "./component-primitives";

export {
  componentAtlasSpecimenMarkup,
  componentPrimitiveAccessibilityCoverageRows,
  componentPrimitiveAutomationAnchorArtifact,
  componentPrimitiveBindingMatrixRows,
  componentPrimitiveCatalog,
  componentPrimitivePublication,
  componentPrimitiveSchemas,
} from "./component-primitives.generated";

export {
  DESIGN_TOKEN_EXPORT_ARTIFACT_ID,
  DESIGN_TOKEN_FOUNDATION_REF,
  DESIGN_TOKEN_FOUNDATION_TASK_ID,
  DESIGN_TOKEN_FOUNDATION_VISUAL_MODE,
  MODE_TUPLE_COVERAGE_REF,
  TOKEN_KERNEL_LAYERING_POLICY_ID,
  buildDesignTokenFoundationArtifact,
  buildFoundationStylesheet,
  buildProfileSelectionResolutionPayload,
  buildSignalAtlasLiveMarkSvg,
  buildTokenContrastMatrixCsv,
  buildTokenContrastMatrixRows,
  buildTokenModeCoverageCsv,
  buildTokenModeCoverageRows,
  canonicalDesignTokenExportArtifact,
  componentAliases,
  compositeTokens,
  contrastRatio,
  designTokenFoundationArtifact,
  designTokenFoundationCatalog,
  designTokenFoundationSchemas,
  primitiveTokenGroups,
  profileSelectionResolutions,
  profileTokens,
  resolveModeTokens,
  semanticAliases,
  specimenParitySeries,
  specimenSemanticStates,
  specimenShellProfiles,
  tokenKernelLayeringPolicy,
} from "./token-foundation";

export {
  ARTIFACT_PRIORITY,
  DISPLAY_STATE_TIE_BREAK_ORDER,
  FRESHNESS_PRIORITY,
  POSTURE_PRIORITY,
  SETTLEMENT_PRIORITY,
  STATE_CLASS_PRIORITY,
  TRUST_PRIORITY,
  UI_CONTRACT_KERNEL_SCHEMA_PATH,
  UI_CONTRACT_KERNEL_SOURCE_PRECEDENCE,
  UI_CONTRACT_KERNEL_TASK_ID,
  UI_CONTRACT_KERNEL_VISUAL_MODE,
  UI_KERNEL_GAP_RESOLUTIONS,
  UI_KERNEL_ROUTE_ROOT_MARKERS,
  WRITABLE_PRIORITY,
  buildUiContractKernelArtifacts,
  resolveStatePrecedence,
} from "./ui-contract-kernel";

export {
  uiContractAccessibilityArtifact,
  uiContractAccessibilitySemanticCoverageProfiles,
  uiContractAutomationAnchorArtifact,
  uiContractAutomationAnchorMaps,
  uiContractKernelCatalog,
  uiContractKernelPublication,
  uiContractKernelSchemas,
  uiContractLintVerdictArtifact,
  uiContractLintVerdicts,
  uiContractPublicationBundles,
  uiContractSurfaceStateKernelBindingRows,
} from "./ui-contract-kernel.generated";

export {
  ARTIFACT_SHELL_FOLLOW_ON_DEPENDENCIES,
  ARTIFACT_SHELL_GAP_RESOLUTIONS,
  ARTIFACT_SHELL_SOURCE_PRECEDENCE,
  ARTIFACT_SHELL_TASK_ID,
  ARTIFACT_SHELL_VISUAL_MODE,
  AppointmentArtifactSpecimen,
  ArtifactActionMatrix,
  ArtifactModeTruthResolver,
  ArtifactParityDigestPanel,
  ArtifactShellSpecimenGrid,
  ArtifactStage,
  ArtifactSurfaceFrame,
  ArtifactTransferTimeline,
  GovernanceEvidenceArtifactSpecimen,
  LargeAttachmentArtifactSpecimen,
  OperationsReleaseArtifactSpecimen,
  RecoveryReportArtifactSpecimen,
  RecordResultArtifactSpecimen,
  artifactShellSpecimens,
  resolveArtifactModeTruth,
  validateArtifactTruthTuple,
} from "./artifact-shell";

export type {
  ArtifactActionAvailability,
  ArtifactActionPolicy,
  ArtifactAuthorityState,
  ArtifactByteDeliveryPosture,
  ArtifactChannelPosture,
  ArtifactDestinationType,
  ArtifactFallbackDisposition,
  ArtifactFallbackKind,
  ArtifactFallbackTrigger,
  ArtifactGrantState,
  ArtifactHandoffPolicy,
  ArtifactHandoffPosture,
  ArtifactIssue,
  ArtifactKind,
  ArtifactLocalAckState,
  ArtifactModeTruthProjection,
  ArtifactParityDigest,
  ArtifactParityState,
  ArtifactPresentationContract,
  ArtifactPreviewPage,
  ArtifactPreviewPolicy,
  ArtifactRequestedMode,
  ArtifactReturnTruthState,
  ArtifactShellSpecimen,
  ArtifactStageMode,
  ArtifactSummarySafetyTier,
  ArtifactSummarySection,
  ArtifactSurfaceBinding,
  ArtifactSurfaceContext,
  ArtifactTone,
  ArtifactTransferKind,
  ArtifactTransferSettlement,
  ArtifactTransferState,
  OutboundNavigationGrant,
} from "./artifact-shell";

export {
  STATUS_TRUTH_SOURCE_PRECEDENCE,
  STATUS_TRUTH_TASK_ID,
  STATUS_TRUTH_VISUAL_MODE,
  AmbientStateRibbon,
  CasePulse,
  CasePulseMetaRow,
  FreshnessActionabilityBadge,
  FreshnessChip,
  GovernanceStatusTruthSpecimen,
  HubStatusTruthSpecimen,
  OperationsStatusTruthSpecimen,
  PatientStatusTruthSpecimen,
  PharmacyStatusTruthSpecimen,
  SharedStatusStrip,
  StatusSentenceComposer,
  StatusStripAuthorityInspector,
  StatusTruthSpecimenGrid,
  WorkspaceStatusTruthSpecimen,
  composeStatusSentence,
  statusTruthSpecimens,
  validateStatusTruthInput,
} from "./status-truth";

export type {
  AuthoritativeOutcomeState,
  CasePulseAxis,
  CasePulseContract,
  LocalFeedbackState,
  PendingExternalState,
  ProcessingAcceptanceState,
  ProjectionActionabilityState,
  ProjectionFreshnessEnvelope,
  ProjectionFreshnessState,
  ProjectionTransportState,
  ProjectionTrustState,
  SaveState,
  StatusAudienceProfile,
  StatusAudienceTier,
  StatusIssue,
  StatusMacroState,
  StatusSentence,
  StatusStripAuthority,
  StatusStripDegradeMode,
  StatusTone,
  StatusTruthInput,
  StatusTruthSpecimen,
} from "./status-truth";

export {
  ACCESSIBILITY_HARNESS_FOLLOW_ON_DEPENDENCIES,
  ACCESSIBILITY_HARNESS_GAP_RESOLUTIONS,
  ACCESSIBILITY_HARNESS_PREREQUISITE_GAPS,
  ACCESSIBILITY_HARNESS_PUBLICATION_PATH,
  ACCESSIBILITY_HARNESS_SOURCE_PRECEDENCE,
  ACCESSIBILITY_HARNESS_TASK_ID,
  ACCESSIBILITY_HARNESS_VISUAL_MODE,
  ASSISTIVE_ANNOUNCEMENT_EXAMPLES_PATH,
  FOCUS_TRANSITION_CONTRACT_MATRIX_PATH,
  KEYBOARD_INTERACTION_CONTRACT_MATRIX_PATH,
  accessibilityHarnessArtifacts,
  accessibilityHarnessCatalog,
  accessibilityHarnessPublication,
  accessibilityHarnessRouteProfiles,
  accessibilityHarnessScenarios,
  assistiveAnnouncementExampleArtifact,
  arbitrateAssistiveAnnouncements,
  evaluateVisualizationParity,
  focusTransitionContractRows,
  keyboardInteractionContractRows,
  resolveFocusTransition,
  verifyKeyboardInteraction,
} from "./accessibility-harness";

export type {
  AccessibilityCoverageHarnessExtension,
  AccessibilityHarnessArtifacts,
  AccessibilityHarnessRouteProfile,
  AccessibilityHarnessScenario,
  AnnouncementAuthority,
  AnnouncementIntent,
  AnnouncementStatus,
  AssistiveAnnouncementExample,
  AssistiveAnnouncementExampleArtifact,
  AssistiveAnnouncementInput,
  ContractState,
  FocusDisposition,
  FocusTargetDescriptor,
  FocusTransitionContractRow,
  FocusTransitionDecision,
  FocusTransitionScope,
  FocusTrigger,
  FollowOnDependencyRecord,
  GapResolutionRecord,
  KeyboardInteractionContractRow,
  KeyboardModel,
  KeyboardVerificationResult,
  PrerequisiteGapRecord,
  VisualizationParityDecision,
  VisualizationParityInput,
  VisualizationParityState,
} from "./accessibility-harness";

export {
  CROSS_ORG_ARTIFACT_HANDOFF_VISUAL_MODE,
  AccessibleTimelineStatusAnnotations,
  ArtifactHandoffActionBar,
  ArtifactParityBanner,
  CrossOrgArtifactSurfaceFrame,
  CrossOrgContentLegend,
  GrantBoundPreviewState,
  GovernedPlaceholderSummary,
  NetworkConfirmationArtifactStage,
  PracticeNotificationArtifactSummary,
  ReturnAnchorReceipt,
} from "./cross-org-artifact-handoff";

export type {
  CrossOrgArtifactAction,
  CrossOrgArtifactGrantState,
  CrossOrgArtifactStageMode,
  CrossOrgArtifactTone,
  CrossOrgContentLegendItem,
  CrossOrgSummaryRow,
  CrossOrgTimelineStatusAnnotation,
} from "./cross-org-artifact-handoff";

export {
  EligibilityEvidenceDrawer,
  EligibilityGateLadder,
  EligibilitySupersessionNotice,
  EligibilityVersionChip,
  PatientAlternativeRouteNextStepPanel,
  PatientUnsuitableReturnState,
  PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE,
  PharmacyEligibilityRuleExplainer,
} from "./pharmacy-eligibility-surfaces";

export type {
  PharmacyEligibilityEvidenceSummaryRow,
  PharmacyEligibilityFinalDisposition,
  PharmacyEligibilityGateState,
  PharmacyEligibilityGateViewModel,
  PharmacyEligibilityNextStepPanelModel,
  PharmacyEligibilityPolicyPackMeta,
  PharmacyEligibilityPublicationState,
  PharmacyEligibilitySurfaceModel,
  PharmacyEligibilitySupersessionNoticeModel,
} from "./pharmacy-eligibility-surfaces";

export {
  VECELL_BRAND_NAME,
  VECELL_FAVICON_HREF,
  VECELL_ICON_VIEW_BOX,
  VECELL_LOCKUP_VIEW_BOX,
  VECELL_WORDMARK_VIEW_BOX,
  VecellLogoIcon,
  VecellLogoLockup,
  VecellLogoWordmark,
  applyVecellBrowserBranding,
  createVecellLogoSvgMarkup,
  formatVecellTitle,
} from "./vecell-branding";

export type { VecellBrowserBrandingOptions, VecellLogoVariant } from "./vecell-branding";
