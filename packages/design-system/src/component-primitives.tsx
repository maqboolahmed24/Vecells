import * as React from "react";
import type {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import {
  MODE_TUPLE_COVERAGE_REF,
  componentAliases,
  compositeTokens,
  primitiveTokenGroups,
  profileSelectionResolutions,
  profileTokens,
  type DensityMode,
  type MotionMode,
  type ShellType,
} from "./token-foundation";
import {
  uiContractAccessibilityArtifact,
  uiContractAutomationAnchorArtifact,
  uiContractKernelPublication,
  uiContractLintVerdictArtifact,
} from "./ui-contract-kernel.generated";

export const COMPONENT_PRIMITIVES_TASK_ID = "par_105";
export const COMPONENT_PRIMITIVES_VISUAL_MODE = "Component_Atlas";
export const COMPONENT_PRIMITIVES_SCHEMA_PATH =
  "packages/design-system/contracts/component-primitives.schema.json";
export const COMPONENT_PRIMITIVES_PUBLICATION_PATH =
  "data/analysis/component_primitive_publication.json";
export const COMPONENT_PRIMITIVES_CSS_PATH =
  "packages/design-system/src/component-primitives.css";

export const COMPONENT_PRIMITIVES_SOURCE_PRECEDENCE = [
  "prompt/105.md",
  "prompt/shared_operating_contract_096_to_105.md",
  "prompt/AGENT.md",
  "prompt/checklist.md",
  "blueprint/design-token-foundation.md",
  "blueprint/canonical-ui-contract-kernel.md",
  "blueprint/platform-frontend-blueprint.md#PersistentShell",
  "blueprint/platform-frontend-blueprint.md#CasePulse",
  "blueprint/platform-frontend-blueprint.md#StateBraid",
  "blueprint/platform-frontend-blueprint.md#DecisionDock",
  "blueprint/platform-frontend-blueprint.md#status-strip law",
  "blueprint/ux-quiet-clarity-redesign.md",
  "blueprint/accessibility-and-content-system-contract.md",
  "blueprint/forensic-audit-findings.md#Finding 86",
  "blueprint/forensic-audit-findings.md#Finding 92",
  "blueprint/forensic-audit-findings.md#Finding 93",
  "blueprint/forensic-audit-findings.md#Finding 97",
  "blueprint/forensic-audit-findings.md#Finding 116",
  "blueprint/forensic-audit-findings.md#Finding 117",
  "blueprint/forensic-audit-findings.md#Finding 118",
  "blueprint/forensic-audit-findings.md#Finding 120",
  "data/analysis/design_token_export_artifact.json",
  "data/analysis/profile_selection_resolutions.json",
  "data/analysis/design_contract_publication_bundle.json",
  "data/analysis/automation_anchor_maps.json",
  "data/analysis/accessibility_semantic_coverage_profiles.json",
] as const;

export type PrimitiveFamily =
  | "shell-plane"
  | "semantic-working"
  | "surface-role"
  | "control"
  | "calm-state"
  | "visualization";

export type AtlasSectionId =
  | "shell-plane"
  | "semantic-working"
  | "board"
  | "card"
  | "task"
  | "rail"
  | "drawer"
  | "form"
  | "list"
  | "table"
  | "artifact"
  | "controls"
  | "state-postures"
  | "visualization";

export type AccentTone =
  | "neutral"
  | "active"
  | "review"
  | "insight"
  | "success"
  | "danger";

export type AutomationSlotName =
  | "surface_state"
  | "dominant_action"
  | "selected_anchor"
  | "artifact_mode"
  | "continuity_key"
  | "accessibility";

export type VisualizationParityState =
  | "not_applicable"
  | "summary_and_table_fallback";

export type SpecimenId =
  | "Patient_Mission_Frame"
  | "Workspace_Quiet_Mission_Control"
  | "Operations_Control_Room_Preview"
  | "Governance_Approval_Frame";

export interface PrimitiveTokenBinding {
  tokenRef: string;
  cssVar: string;
  purpose: string;
}

export interface PrimitiveKernelBinding {
  bindingKind:
    | "profile_selection"
    | "publication_bundle"
    | "surface_state"
    | "automation_anchor"
    | "accessibility";
  routeFamilyRef: string;
  ref: string;
  note: string;
}

export interface PrimitiveAutomationRouteAnchor {
  routeFamilyRef: string;
  markerRef: string;
  domMarker: string;
  requiredDomMarkers: readonly string[];
}

export interface PrimitiveAutomationSlot {
  slotName: AutomationSlotName;
  routeAnchors: readonly PrimitiveAutomationRouteAnchor[];
}

export interface PrimitiveAccessibilityRouteCoverage {
  routeFamilyRef: string;
  shellType: ShellType;
  coverageState: "complete" | "degraded" | "blocked";
  semanticSurfaceRefs: readonly string[];
  keyboardInteractionContractRefs: readonly string[];
  focusTransitionContractRefs: readonly string[];
  reducedMotionEquivalenceRef: string;
  highContrastEquivalenceRef: string;
  visualizationFallbackContractRefs: readonly string[];
  visualizationTableContractRefs: readonly string[];
  visualizationParityProjectionRefs: readonly string[];
}

export interface PrimitiveAccessibilityContract {
  summary: string;
  routeCoverage: readonly PrimitiveAccessibilityRouteCoverage[];
}

export interface PrimitiveComponentContract {
  componentId: string;
  displayName: string;
  primitiveFamily: PrimitiveFamily;
  atlasSectionId: AtlasSectionId;
  surfaceRoleLabel: string;
  description: string;
  shellTypes: readonly ShellType[];
  routeFamilyRefs: readonly string[];
  specimenIds: readonly SpecimenId[];
  stateVariants: readonly string[];
  tokenBindings: readonly PrimitiveTokenBinding[];
  kernelBindings: readonly PrimitiveKernelBinding[];
  automationSlots: readonly PrimitiveAutomationSlot[];
  accessibility: PrimitiveAccessibilityContract;
  apiSignature: string;
  accentPolicy: string;
  densityPolicy: string;
  visualizationParity: VisualizationParityState;
  contractDigestRef: string;
}

export interface PrimitiveGapResolution {
  gapId: string;
  title: string;
  resolution: string;
  source_refs: readonly string[];
}

export interface PrimitiveFollowOnDependency {
  dependencyId: string;
  ownerTaskRange: string;
  description: string;
  source_refs: readonly string[];
}

export interface ShellProfileLens {
  shellType: ShellType;
  label: string;
  profileSelectionResolutionId: string;
  profileTokenRef: string;
  routeClassRef: string;
  accentRole: string;
  defaultDensityMode: DensityMode;
  defaultMotionMode: MotionMode;
  allowedSurfaceRoleRefs: readonly string[];
}

export interface SpecimenComposition {
  specimenId: SpecimenId;
  label: string;
  shellType: ShellType;
  bundleRef: string;
  routeFamilyRef: string;
  routeLabel: string;
  atlasSectionId: AtlasSectionId;
  headline: string;
  summary: string;
  dominantAccentTokenRef: string;
  dominantActionLabel: string;
  promotedSupportRegionLabel: string;
  promotedSupportRegionCount: 0 | 1;
  layoutTopology: "focus_frame" | "two_plane" | "three_plane";
  densityPosture: "quiet" | "mixed" | "dense";
  componentIds: readonly string[];
}

export interface PrimitiveBindingMatrixRow {
  component_id: string;
  display_name: string;
  primitive_family: PrimitiveFamily;
  atlas_section: AtlasSectionId;
  surface_role: string;
  shell_types: string;
  route_family_refs: string;
  specimen_ids: string;
  token_refs: string;
  kernel_binding_refs: string;
  api_signature: string;
  visualization_parity: VisualizationParityState;
}

export interface PrimitiveAutomationMatrixRow {
  componentId: string;
  displayName: string;
  atlasSectionId: AtlasSectionId;
  routeFamilyRefs: readonly string[];
  dominantActionMarkerRefs: readonly string[];
  selectedAnchorMarkerRefs: readonly string[];
  artifactMarkerRefs: readonly string[];
  continuityMarkerRefs: readonly string[];
  requiredDomMarkers: readonly string[];
}

export interface PrimitiveAccessibilityMatrixRow {
  component_id: string;
  display_name: string;
  shell_types: string;
  route_family_refs: string;
  coverage_states: string;
  reduced_motion_refs: string;
  high_contrast_ref: string;
  semantic_surface_refs: string;
  keyboard_contract_refs: string;
  focus_contract_refs: string;
  visualization_fallback_refs: string;
  visualization_table_refs: string;
}

export interface ComponentPrimitivePublicationArtifact {
  task_id: string;
  visual_mode: string;
  summary: {
    component_count: number;
    specimen_count: number;
    surface_role_count: number;
    shell_profile_count: number;
    route_binding_count: number;
    exact_route_binding_count: number;
    blocked_route_binding_count: number;
    degraded_accessibility_route_count: number;
    gap_resolution_count: number;
    follow_on_dependency_count: number;
  };
  componentContracts: readonly PrimitiveComponentContract[];
  specimenCompositions: readonly SpecimenComposition[];
  shellProfileLenses: readonly ShellProfileLens[];
  gap_resolutions: readonly PrimitiveGapResolution[];
  follow_on_dependencies: readonly PrimitiveFollowOnDependency[];
  source_refs: readonly string[];
}

type UiScenario = (typeof uiContractKernelPublication.studio_scenarios)[number];
type UiBundle = (typeof uiContractKernelPublication.designContractPublicationBundles)[number];
type UiBinding = (typeof uiContractKernelPublication.surfaceStateKernelBindings)[number];
type UiAutomation = (typeof uiContractAutomationAnchorArtifact.automationAnchorMaps)[number];
type UiAccessibility =
  (typeof uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles)[number];
type UiLintVerdict = (typeof uiContractLintVerdictArtifact.designContractLintVerdicts)[number];
type UiProfileSelection = (typeof profileSelectionResolutions)[number];
type UiProfileToken = (typeof profileTokens)[number];

export interface ResolvedPrimitiveRouteBinding {
  routeFamilyRef: string;
  shellType: ShellType;
  bundle: UiBundle;
  scenario: UiScenario;
  automation: UiAutomation;
  accessibility: UiAccessibility;
  kernelBinding: UiBinding;
  lintVerdict: UiLintVerdict;
  profileSelection: UiProfileSelection;
  profileToken: UiProfileToken;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function stableDigest(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `dig_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value ${String(value)}`);
}

const TOKEN_REF_SET = new Set([
  ...primitiveTokenGroups.flatMap((group) => group.tokens.map((token) => token.tokenId)),
  ...componentAliases.map((token) => token.tokenId),
  ...compositeTokens.map((token) => token.compositeTokenId),
]);

const bundleByRoute = new Map<string, UiBundle>();
for (const bundle of uiContractKernelPublication.designContractPublicationBundles) {
  for (const routeFamilyRef of bundle.routeFamilyRefs) {
    bundleByRoute.set(routeFamilyRef, bundle);
  }
}
const scenarioByRoute = new Map<string, UiScenario>(
  uiContractKernelPublication.studio_scenarios.map((row) => [row.routeFamilyRef, row]),
);
const automationByRoute = new Map<string, UiAutomation>(
  uiContractAutomationAnchorArtifact.automationAnchorMaps.map((row) => [row.surfaceRef, row]),
);
const accessibilityByRoute = new Map<string, UiAccessibility>(
  uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles.map((row) => [
    row.routeFamilyRef,
    row,
  ]),
);
const kernelBindingByRoute = new Map<string, UiBinding>(
  uiContractKernelPublication.surfaceStateKernelBindings.map((row) => [row.routeFamilyRef, row]),
);
const lintByBundle = new Map<string, UiLintVerdict>(
  uiContractLintVerdictArtifact.designContractLintVerdicts.map((row) => [
    row.designContractPublicationBundleRef,
    row,
  ]),
);
const profileSelectionByShell = new Map<ShellType, UiProfileSelection>(
  profileSelectionResolutions.map((row) => [row.shellType, row]),
);
const profileTokenByShell = new Map<ShellType, UiProfileToken>(
  profileTokens.map((row) => [row.shellType, row]),
);

function requireValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

export function resolvePrimitiveRouteBinding(routeFamilyRef: string): ResolvedPrimitiveRouteBinding {
  const bundle = requireValue(
    bundleByRoute.get(routeFamilyRef),
    `Missing bundle for route ${routeFamilyRef}`,
  );
  const scenario = requireValue(
    scenarioByRoute.get(routeFamilyRef),
    `Missing scenario for route ${routeFamilyRef}`,
  );
  const automation = requireValue(
    automationByRoute.get(routeFamilyRef),
    `Missing automation map for route ${routeFamilyRef}`,
  );
  const accessibility = requireValue(
    accessibilityByRoute.get(routeFamilyRef),
    `Missing accessibility profile for route ${routeFamilyRef}`,
  );
  const kernelBinding = requireValue(
    kernelBindingByRoute.get(routeFamilyRef),
    `Missing surface-state kernel binding for route ${routeFamilyRef}`,
  );
  const lintVerdict = requireValue(
    lintByBundle.get(bundle.designContractPublicationBundleId),
    `Missing lint verdict for bundle ${bundle.designContractPublicationBundleId}`,
  );
  const profileSelection = requireValue(
    profileSelectionByShell.get(bundle.shellType),
    `Missing profile selection for shell ${bundle.shellType}`,
  );
  const profileToken = requireValue(
    profileTokenByShell.get(bundle.shellType),
    `Missing profile token for shell ${bundle.shellType}`,
  );
  return {
    routeFamilyRef,
    shellType: bundle.shellType,
    bundle,
    scenario,
    automation,
    accessibility,
    kernelBinding,
    lintVerdict,
    profileSelection,
    profileToken,
  };
}

function assertTokenBindingRefs(bindings: readonly PrimitiveTokenBinding[]): void {
  for (const binding of bindings) {
    if (!TOKEN_REF_SET.has(binding.tokenRef)) {
      throw new Error(`Unknown token ref ${binding.tokenRef}`);
    }
  }
}

function toneTokenRef(tone: AccentTone): string {
  switch (tone) {
    case "neutral":
      return "ref.color.border.default";
    case "active":
      return "ref.color.accent.active";
    case "review":
      return "ref.color.accent.review";
    case "insight":
      return "ref.color.accent.insight";
    case "success":
      return "ref.color.accent.success";
    case "danger":
      return "ref.color.accent.danger";
    default:
      return assertNever(tone);
  }
}

function shellAccentHex(shellType: ShellType): string {
  const profileToken = requireValue(profileTokenByShell.get(shellType), `Missing shell ${shellType}`);
  return `var(--state-accent-${profileToken.accentRole}-hex)`;
}

function toTitle(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b[a-z]/g, (match) => match.toUpperCase());
}

function buildKernelBindings(routeFamilyRefs: readonly string[]): PrimitiveKernelBinding[] {
  return routeFamilyRefs.flatMap((routeFamilyRef) => {
    const binding = resolvePrimitiveRouteBinding(routeFamilyRef);
    return [
      {
        bindingKind: "profile_selection",
        routeFamilyRef,
        ref: binding.profileSelection.profileSelectionResolutionId,
        note: `${binding.shellType} shell profile selection`,
      },
      {
        bindingKind: "publication_bundle",
        routeFamilyRef,
        ref: binding.bundle.designContractPublicationBundleId,
        note: `${binding.bundle.audienceSurface} publication bundle`,
      },
      {
        bindingKind: "surface_state",
        routeFamilyRef,
        ref: binding.kernelBinding.surfaceStateKernelBindingId,
        note: `${binding.scenario.label} status binding`,
      },
      {
        bindingKind: "automation_anchor",
        routeFamilyRef,
        ref: binding.automation.automationAnchorMapId,
        note: `${binding.scenario.label} automation anchor map`,
      },
      {
        bindingKind: "accessibility",
        routeFamilyRef,
        ref: binding.accessibility.accessibilitySemanticCoverageProfileId,
        note: `${binding.scenario.label} accessibility coverage`,
      },
    ];
  });
}

function domMarkerForSlot(slotName: AutomationSlotName): string {
  switch (slotName) {
    case "surface_state":
      return "surface-state";
    case "dominant_action":
      return "dominant-action";
    case "selected_anchor":
      return "selected-anchor";
    case "artifact_mode":
      return "data-artifact-mode";
    case "continuity_key":
      return "data-continuity-key";
    case "accessibility":
      return "accessibility-coverage-state";
    default:
      return assertNever(slotName);
  }
}

function markerRefForSlot(slotName: AutomationSlotName, binding: ResolvedPrimitiveRouteBinding): string {
  switch (slotName) {
    case "surface_state":
      return "surface-state";
    case "dominant_action":
      return binding.automation.dominantActionMarkerRef;
    case "selected_anchor":
      return binding.automation.selectedAnchorMarkerRef;
    case "artifact_mode":
      return binding.automation.artifactMarkerRef;
    case "continuity_key":
      return binding.automation.continuityMarkerRef;
    case "accessibility":
      return binding.accessibility.accessibilitySemanticCoverageProfileId;
    default:
      return assertNever(slotName);
  }
}

function buildAutomationSlots(
  routeFamilyRefs: readonly string[],
  slotNames: readonly AutomationSlotName[],
): PrimitiveAutomationSlot[] {
  return slotNames.map((slotName) => ({
    slotName,
    routeAnchors: routeFamilyRefs.map((routeFamilyRef) => {
      const binding = resolvePrimitiveRouteBinding(routeFamilyRef);
      return {
        routeFamilyRef,
        markerRef: markerRefForSlot(slotName, binding),
        domMarker: domMarkerForSlot(slotName),
        requiredDomMarkers: binding.automation.requiredDomMarkers,
      };
    }),
  }));
}

function buildAccessibility(
  routeFamilyRefs: readonly string[],
  summary: string,
): PrimitiveAccessibilityContract {
  return {
    summary,
    routeCoverage: routeFamilyRefs.map((routeFamilyRef) => {
      const binding = resolvePrimitiveRouteBinding(routeFamilyRef);
      return {
        routeFamilyRef,
        shellType: binding.shellType,
        coverageState: binding.accessibility.coverageState,
        semanticSurfaceRefs: binding.accessibility.semanticSurfaceRefs,
        keyboardInteractionContractRefs: binding.accessibility.keyboardInteractionContractRefs,
        focusTransitionContractRefs: binding.accessibility.focusTransitionContractRefs,
        reducedMotionEquivalenceRef: binding.accessibility.reducedMotionEquivalenceRef,
        highContrastEquivalenceRef: `${MODE_TUPLE_COVERAGE_REF}::high_contrast_supported`,
        visualizationFallbackContractRefs:
          binding.accessibility.visualizationFallbackContractRefs,
        visualizationTableContractRefs: binding.accessibility.visualizationTableContractRefs,
        visualizationParityProjectionRefs:
          binding.accessibility.visualizationParityProjectionRefs,
      } satisfies PrimitiveAccessibilityRouteCoverage;
    }),
  };
}

type ComponentSeed = Omit<
  PrimitiveComponentContract,
  "kernelBindings" | "automationSlots" | "accessibility" | "contractDigestRef"
> & {
  automationSlotNames: readonly AutomationSlotName[];
  accessibilitySummary: string;
};

function defineComponent(seed: ComponentSeed): PrimitiveComponentContract {
  assertTokenBindingRefs(seed.tokenBindings);
  const kernelBindings = buildKernelBindings(seed.routeFamilyRefs);
  const automationSlots = buildAutomationSlots(seed.routeFamilyRefs, seed.automationSlotNames);
  const accessibility = buildAccessibility(seed.routeFamilyRefs, seed.accessibilitySummary);
  const digestInput = JSON.stringify({
    componentId: seed.componentId,
    routeFamilyRefs: seed.routeFamilyRefs,
    tokenBindings: seed.tokenBindings,
    apiSignature: seed.apiSignature,
    visualizationParity: seed.visualizationParity,
  });
  return {
    ...seed,
    kernelBindings,
    automationSlots,
    accessibility,
    contractDigestRef: stableDigest(digestInput),
  };
}

const componentContractSeeds = [
  {
    componentId: "ShellFrame",
    displayName: "Shell Frame",
    primitiveFamily: "shell-plane",
    atlasSectionId: "shell-plane",
    surfaceRoleLabel: "shell-plane",
    description:
      "Top-level continuity shell that owns the route-safe data markers, shell profile, and dominant-action law.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_staff_workspace",
      "rf_operations_board",
      "rf_governance_shell",
    ],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "settled_pending_confirmation", "degraded", "stale"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.canvas", cssVar: "--sys-surface-canvas", purpose: "Canvas plane" },
      { tokenRef: "ref.color.surface.shell", cssVar: "--sys-surface-shell", purpose: "Shell frame surface" },
      { tokenRef: "ref.space.32", cssVar: "--cp-shell-gap", purpose: "Desktop shell spacing" },
      { tokenRef: "ref.type.role.section", cssVar: "--cp-shell-title", purpose: "Primary section typography" },
    ],
    apiSignature:
      "ShellFrame({ binding, specimenId, headline, summary, dominantActionLabel, promotedSupportRegion, children })",
    accentPolicy: "One shell accent at a time; route-local markers stay on the root frame.",
    densityPolicy: "Balanced default with compact inner regions only through surface-role children.",
    visualizationParity: "not_applicable",
    automationSlotNames: [
      "surface_state",
      "dominant_action",
      "selected_anchor",
      "artifact_mode",
      "continuity_key",
      "accessibility",
    ],
    accessibilitySummary:
      "The shell frame carries the root semantic surfaces, keyboard scope markers, and reduced-motion equivalence rules.",
  },
  {
    componentId: "ShellRail",
    displayName: "Shell Rail",
    primitiveFamily: "shell-plane",
    atlasSectionId: "shell-plane",
    surfaceRoleLabel: "rail",
    description:
      "Persistent navigation and taxonomy rail used for queue, evidence, and shell-profile context.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: ["rf_staff_workspace", "rf_operations_board", "rf_governance_shell"],
    specimenIds: [
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "stale", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.inset", cssVar: "--sys-surface-inset", purpose: "Inset rail surface" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Rail separators" },
      { tokenRef: "ref.space.16", cssVar: "--cp-rail-pad", purpose: "Rail padding" },
      { tokenRef: "ref.radius.lg", cssVar: "--cp-rail-radius", purpose: "Rail radius" },
    ],
    apiSignature: "ShellRail({ title, items, eyebrow, footer })",
    accentPolicy: "Secondary emphasis only; never competes with the specimen dominant action.",
    densityPolicy: "Balanced or compact depending on shell profile; list-first status only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "continuity_key", "accessibility"],
    accessibilitySummary:
      "Rail sections stay keyboard-first and inherit anchor restore semantics from their route binding.",
  },
  {
    componentId: "ShellHeader",
    displayName: "Shell Header",
    primitiveFamily: "shell-plane",
    atlasSectionId: "shell-plane",
    surfaceRoleLabel: "shell-plane",
    description:
      "Top specimen header for the current mission, combining quiet hero copy, one dominant action, and calm metadata.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_staff_workspace",
      "rf_operations_board",
      "rf_governance_shell",
    ],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "settled_pending_confirmation", "degraded", "stale"],
    tokenBindings: [
      { tokenRef: "ref.type.role.title", cssVar: "--cp-header-title", purpose: "Header title typography" },
      { tokenRef: "ref.type.role.body", cssVar: "--cp-header-copy", purpose: "Header copy typography" },
      { tokenRef: "ref.space.24", cssVar: "--cp-header-pad", purpose: "Header padding" },
      { tokenRef: "ref.motion.duration.reveal", cssVar: "--motion-duration-reveal", purpose: "Same-surface reveal" },
    ],
    apiSignature: "ShellHeader({ eyebrow, title, summary, chips, children })",
    accentPolicy: "Hero copy may inherit the active shell accent but never a second semantic accent.",
    densityPolicy: "Quiet default; only one status cluster or action row may sit in the masthead.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["dominant_action", "accessibility"],
    accessibilitySummary:
      "Header copy forms the specimen summary and keeps the dominant action adjacent to its live-summary region.",
  },
  {
    componentId: "SharedStatusStrip",
    displayName: "Shared Status Strip",
    primitiveFamily: "shell-plane",
    atlasSectionId: "shell-plane",
    surfaceRoleLabel: "status-strip",
    description:
      "Canonical quiet strip that combines ambient state, freshness, and settlement status without adding a second command band.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_staff_workspace",
      "rf_operations_board",
      "rf_governance_shell",
    ],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "pending", "stale", "degraded"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Status strip panel" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Status strip border" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-status-radius", purpose: "Status strip radius" },
      { tokenRef: "ref.space.12", cssVar: "--cp-status-gap", purpose: "Status strip spacing" },
    ],
    apiSignature:
      "SharedStatusStrip({ tone, stateLabel, freshnessLabel, settlementLabel, continuityKey })",
    accentPolicy: "Ambient state may use one semantic tone; freshness stays neutral and never becomes a second accent.",
    densityPolicy: "Compact inline strip; does not expand into a second promoted support region.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "artifact_mode", "accessibility"],
    accessibilitySummary:
      "Status strip carries the live-summary state, freshness accessibility rules, and artifact status marker.",
  },
  {
    componentId: "PromotedSupportRegionFrame",
    displayName: "Promoted Support Region Frame",
    primitiveFamily: "shell-plane",
    atlasSectionId: "shell-plane",
    surfaceRoleLabel: "artifact",
    description:
      "Single promoted support pocket for assistance, evidence, or follow-up context. Never more than one in a quiet specimen viewport.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_governance_shell"],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "review", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Support pane surface" },
      { tokenRef: "ref.radius.lg", cssVar: "--cp-support-radius", purpose: "Support frame radius" },
      { tokenRef: "ref.space.24", cssVar: "--cp-support-pad", purpose: "Support frame spacing" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Support frame outline" },
    ],
    apiSignature: "PromotedSupportRegionFrame({ title, eyebrow, children, supportingCopy })",
    accentPolicy: "Support frames inherit shell accent only as a hairline; the interior stays neutral.",
    densityPolicy: "Balanced only; compact support frames are pushed down to rail or drawer surfaces.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "artifact_mode", "continuity_key", "accessibility"],
    accessibilitySummary:
      "Promoted support regions preserve return-anchor and artifact-mode status without duplicating dominant-action markers.",
  },
  {
    componentId: "CasePulse",
    displayName: "Case Pulse",
    primitiveFamily: "semantic-working",
    atlasSectionId: "semantic-working",
    surfaceRoleLabel: "card",
    description:
      "Small semantic count or readiness pulse used for calm, glanceable mission status.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_operations_board"],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
    ],
    stateVariants: ["ready", "pending", "degraded"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Pulse tile surface" },
      { tokenRef: "ref.type.role.label", cssVar: "--cp-pulse-label", purpose: "Pulse label typography" },
      { tokenRef: "ref.type.role.section", cssVar: "--cp-pulse-value", purpose: "Pulse value typography" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-pulse-radius", purpose: "Pulse radius" },
    ],
    apiSignature: "CasePulse({ label, value, detail, tone })",
    accentPolicy: "Pulse tiles may adopt a single semantic accent border.",
    densityPolicy: "Compact or balanced only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "accessibility"],
    accessibilitySummary:
      "CasePulse retains semantic-state context and never encodes importance through color alone.",
  },
  {
    componentId: "StateBraid",
    displayName: "State Braid",
    primitiveFamily: "semantic-working",
    atlasSectionId: "semantic-working",
    surfaceRoleLabel: "task",
    description:
      "Ordered state ladder for progress, approval, or recovery that keeps causal transitions stable across reduced motion.",
    shellTypes: ["staff", "operations", "governance"],
    routeFamilyRefs: ["rf_staff_workspace", "rf_operations_board", "rf_governance_shell"],
    specimenIds: [
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["settled", "review", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.space.8", cssVar: "--cp-braid-gap", purpose: "State braid spacing" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "State braid outline" },
      { tokenRef: "ref.motion.duration.settle", cssVar: "--motion-duration-settle", purpose: "Settle duration" },
      { tokenRef: "ref.radius.pill", cssVar: "--cp-braid-pill", purpose: "State node radius" },
    ],
    apiSignature: "StateBraid({ steps, activeStep, tone })",
    accentPolicy: "Only the active step adopts the route accent.",
    densityPolicy: "Balanced. Dense state braids must move into summary-only tables instead.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "selected_anchor", "accessibility"],
    accessibilitySummary:
      "StateBraid retains ordered semantics and focus restore for progress or approval ladders.",
  },
  {
    componentId: "DecisionDock",
    displayName: "Decision Dock",
    primitiveFamily: "semantic-working",
    atlasSectionId: "semantic-working",
    surfaceRoleLabel: "task",
    description:
      "Dominant action dock with one primary command, one secondary action, and optional quiet utility action.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_staff_workspace",
      "rf_operations_board",
      "rf_governance_shell",
    ],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "pending", "review", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Dock surface" },
      { tokenRef: "ref.space.16", cssVar: "--cp-dock-gap", purpose: "Dock spacing" },
      { tokenRef: "ref.motion.duration.attention", cssVar: "--motion-duration-attention", purpose: "Focus cue duration" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-dock-radius", purpose: "Dock radius" },
    ],
    apiSignature:
      "DecisionDock({ title, summary, primaryActionLabel, secondaryActionLabel, utilityActionLabel, dominantMarkerRef, selectedAnchorMarkerRef })",
    accentPolicy: "Exactly one primary button may carry the shell accent.",
    densityPolicy: "Balanced by default; compact mode keeps the same focus order and action hierarchy.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["dominant_action", "selected_anchor", "continuity_key", "accessibility"],
    accessibilitySummary:
      "DecisionDock owns the dominant-action marker, stable focus restore target, and button contrast requirements.",
  },
  {
    componentId: "FreshnessChip",
    displayName: "Freshness Chip",
    primitiveFamily: "semantic-working",
    atlasSectionId: "semantic-working",
    surfaceRoleLabel: "status-strip",
    description:
      "Freshness and replay-awareness chip that complements, but does not replace, the ambient state ribbon.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_staff_workspace",
      "rf_operations_board",
      "rf_governance_shell",
    ],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["fresh", "aging", "stale", "disconnected"],
    tokenBindings: [
      { tokenRef: "ref.radius.pill", cssVar: "--cp-chip-radius", purpose: "Pill radius" },
      { tokenRef: "ref.type.role.label", cssVar: "--cp-chip-type", purpose: "Chip typography" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Chip outline" },
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Chip surface" },
    ],
    apiSignature: "FreshnessChip({ freshnessState, label })",
    accentPolicy: "Freshness chips stay neutral until the route explicitly degrades.",
    densityPolicy: "Inline only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "accessibility"],
    accessibilitySummary:
      "FreshnessChip reflects freshness accessibility contracts and communicates replay status without color-only semantics.",
  },
  {
    componentId: "AmbientStateRibbon",
    displayName: "Ambient State Ribbon",
    primitiveFamily: "semantic-working",
    atlasSectionId: "semantic-working",
    surfaceRoleLabel: "status-strip",
    description:
      "Primary status ribbon for current trust, state, or review status. Always present when the shell exposes state risk.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_staff_workspace",
      "rf_operations_board",
      "rf_governance_shell",
    ],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "settled_pending_confirmation", "degraded", "stale"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Ribbon surface" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Ribbon edge" },
      { tokenRef: "ref.space.12", cssVar: "--cp-ribbon-pad", purpose: "Ribbon spacing" },
      { tokenRef: "ref.type.role.label", cssVar: "--cp-ribbon-type", purpose: "Ribbon typography" },
    ],
    apiSignature: "AmbientStateRibbon({ tone, label, detail })",
    accentPolicy: "Ribbon tone is the only semantic accent inside the shared status strip.",
    densityPolicy: "Inline, never expanded into a dashboard banner.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "artifact_mode", "accessibility"],
    accessibilitySummary:
      "AmbientStateRibbon mirrors live-state semantics and preserves polite or assertive announcement law.",
  },
  {
    componentId: "SelectedAnchorStub",
    displayName: "Selected Anchor Summary",
    primitiveFamily: "semantic-working",
    atlasSectionId: "semantic-working",
    surfaceRoleLabel: "artifact",
    description:
      "Compact anchor reminder used to communicate what the system will restore or return to after an interruption.",
    shellTypes: ["staff", "operations", "governance"],
    routeFamilyRefs: ["rf_staff_workspace", "rf_operations_board", "rf_governance_shell"],
    specimenIds: [
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "review", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.inset", cssVar: "--sys-surface-inset", purpose: "Anchor summary surface" },
      { tokenRef: "ref.type.role.body.sm", cssVar: "--cp-anchor-type", purpose: "Anchor summary typography" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-anchor-radius", purpose: "Anchor summary radius" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Anchor summary outline" },
    ],
    apiSignature: "SelectedAnchorStub({ markerRef, label, detail })",
    accentPolicy: "Anchor stubs use neutral treatment and a hairline accent only.",
    densityPolicy: "Compact inline block.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "continuity_key", "accessibility"],
    accessibilitySummary:
      "SelectedAnchorStub surfaces return-anchor and focus-transition hints without introducing new interactive focus stops.",
  },
  {
    componentId: "BoardSurface",
    displayName: "Board Surface",
    primitiveFamily: "surface-role",
    atlasSectionId: "board",
    surfaceRoleLabel: "board",
    description:
      "Open working board for missions, overview clusters, and grouped primary content. Distinct from card or table surfaces.",
    shellTypes: ["patient", "staff", "operations"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_operations_board"],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
    ],
    stateVariants: ["ready", "settled_pending_confirmation", "degraded"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.shell", cssVar: "--sys-surface-shell", purpose: "Board base" },
      { tokenRef: "ref.space.24", cssVar: "--cp-board-pad", purpose: "Board spacing" },
      { tokenRef: "ref.radius.lg", cssVar: "--cp-board-radius", purpose: "Board radius" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Board frame" },
    ],
    apiSignature: "BoardSurface({ eyebrow, title, summary, children })",
    accentPolicy: "Boards use shell accent only as a top edge or small indicator.",
    densityPolicy: "Balanced surface with quiet subsections.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "selected_anchor", "accessibility"],
    accessibilitySummary:
      "BoardSurface groups primary mission content and keeps route-level semantic surfaces intact.",
  },
  {
    componentId: "CardSurface",
    displayName: "Card Surface",
    primitiveFamily: "surface-role",
    atlasSectionId: "card",
    surfaceRoleLabel: "card",
    description:
      "True card role for spotlight or limited supporting content. Not a universal wrapper.",
    shellTypes: ["patient", "staff", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_governance_shell"],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "review", "blocked"],
    tokenBindings: [
      { tokenRef: "comp.card.surface", cssVar: "--cp-card-surface", purpose: "Card role alias" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-card-radius", purpose: "Card radius" },
      { tokenRef: "ref.space.16", cssVar: "--cp-card-pad", purpose: "Card padding" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Card outline" },
    ],
    apiSignature: "CardSurface({ eyebrow, title, summary, children, tone })",
    accentPolicy: "Cards may carry one accent border if they are the spotlight surface.",
    densityPolicy: "Quiet or balanced only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "accessibility"],
    accessibilitySummary:
      "CardSurface stays semantically limited and inherits announcement scope from its parent route.",
  },
  {
    componentId: "TaskSurface",
    displayName: "Task Surface",
    primitiveFamily: "surface-role",
    atlasSectionId: "task",
    surfaceRoleLabel: "task",
    description:
      "Focused task area with explicit action status, different from a passive card or board grouping.",
    shellTypes: ["staff", "operations", "governance"],
    routeFamilyRefs: ["rf_staff_workspace", "rf_operations_board", "rf_governance_shell"],
    specimenIds: [
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["settled_pending_confirmation", "degraded", "stale"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Task panel surface" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-task-radius", purpose: "Task radius" },
      { tokenRef: "ref.space.16", cssVar: "--cp-task-pad", purpose: "Task padding" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Task boundary" },
    ],
    apiSignature: "TaskSurface({ eyebrow, title, summary, children, tone })",
    accentPolicy: "Task surfaces may use a left accent rule to signal action ownership.",
    densityPolicy: "Balanced. Dense tasks split into list or table subregions instead of shrinking type.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "dominant_action", "selected_anchor", "accessibility"],
    accessibilitySummary:
      "TaskSurface preserves actionable semantics, focus restore, and one dominant action marker.",
  },
  {
    componentId: "RailSurface",
    displayName: "Rail Surface",
    primitiveFamily: "surface-role",
    atlasSectionId: "rail",
    surfaceRoleLabel: "rail",
    description:
      "Dense, vertical support surface for evidence lists, queue filters, or change history.",
    shellTypes: ["staff", "operations", "governance"],
    routeFamilyRefs: ["rf_staff_workspace", "rf_operations_board", "rf_governance_shell"],
    specimenIds: [
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["ready", "degraded", "stale"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.inset", cssVar: "--sys-surface-inset", purpose: "Rail role surface" },
      { tokenRef: "ref.radius.lg", cssVar: "--cp-rail-radius", purpose: "Rail radius" },
      { tokenRef: "ref.space.16", cssVar: "--cp-rail-pad", purpose: "Rail padding" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Rail separators" },
    ],
    apiSignature: "RailSurface({ eyebrow, title, children })",
    accentPolicy: "Rail surfaces stay neutral with thin shell-accent markers only.",
    densityPolicy: "Compact or balanced.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "continuity_key", "accessibility"],
    accessibilitySummary:
      "RailSurface keeps list semantics and keyboard traversal stable even in compact density.",
  },
  {
    componentId: "DrawerSurface",
    displayName: "Drawer Surface",
    primitiveFamily: "surface-role",
    atlasSectionId: "drawer",
    surfaceRoleLabel: "drawer",
    description:
      "Elevated support drawer or preview pocket with 12px radius and clear return-anchor law.",
    shellTypes: ["staff", "operations"],
    routeFamilyRefs: ["rf_staff_workspace", "rf_operations_board"],
    specimenIds: ["Workspace_Quiet_Mission_Control", "Operations_Control_Room_Preview"],
    stateVariants: ["settled_pending_confirmation", "degraded"],
    tokenBindings: [
      { tokenRef: "ref.radius.lg", cssVar: "--cp-drawer-radius", purpose: "Drawer radius" },
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Drawer surface" },
      { tokenRef: "ref.space.24", cssVar: "--cp-drawer-pad", purpose: "Drawer padding" },
      { tokenRef: "ref.motion.duration.overlay", cssVar: "--motion-duration-overlay", purpose: "Overlay duration" },
    ],
    apiSignature: "DrawerSurface({ eyebrow, title, summary, children })",
    accentPolicy: "Drawer edge may inherit shell accent; interior content stays neutral.",
    densityPolicy: "Balanced only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "continuity_key", "artifact_mode", "accessibility"],
    accessibilitySummary:
      "DrawerSurface preserves return-anchor and restore semantics for same-shell preview expansion.",
  },
  {
    componentId: "FormSurface",
    displayName: "Form Surface",
    primitiveFamily: "surface-role",
    atlasSectionId: "form",
    surfaceRoleLabel: "form",
    description:
      "Explicit form grouping surface that carries field and error-summary contracts.",
    shellTypes: ["patient", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_governance_shell", "rf_intake_self_service"],
    specimenIds: ["Patient_Mission_Frame", "Governance_Approval_Frame"],
    stateVariants: ["ready", "review", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Form panel surface" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-form-radius", purpose: "Form radius" },
      { tokenRef: "ref.space.16", cssVar: "--cp-form-pad", purpose: "Form spacing" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Form outline" },
    ],
    apiSignature: "FormSurface({ eyebrow, title, summary, children, errorSummary })",
    accentPolicy: "Form surfaces stay neutral; field validation uses semantic state accents locally.",
    densityPolicy: "Balanced or relaxed.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "surface_state", "accessibility"],
    accessibilitySummary:
      "FormSurface must retain field accessibility and error-summary contracts from patient and governance routes.",
  },
  {
    componentId: "ListSurface",
    displayName: "List Surface",
    primitiveFamily: "surface-role",
    atlasSectionId: "list",
    surfaceRoleLabel: "list",
    description:
      "List-first surface for request excerpts, queue rows, or evidence lines.",
    shellTypes: ["patient", "staff", "support"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_support_ticket_workspace"],
    specimenIds: ["Patient_Mission_Frame", "Workspace_Quiet_Mission_Control"],
    stateVariants: ["ready", "settled_pending_confirmation", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "List surface" },
      { tokenRef: "ref.space.12", cssVar: "--cp-list-gap", purpose: "List row gap" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "List separators" },
      { tokenRef: "ref.type.role.body.sm", cssVar: "--cp-list-type", purpose: "List typography" },
    ],
    apiSignature: "ListSurface({ eyebrow, title, rows })",
    accentPolicy: "List surfaces stay neutral; row badges may use semantic accents sparingly.",
    densityPolicy: "Compact or balanced.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "continuity_key", "accessibility"],
    accessibilitySummary:
      "ListSurface retains list semantics and keyboard order through queue churn.",
  },
  {
    componentId: "TableSurface",
    displayName: "Table Surface",
    primitiveFamily: "surface-role",
    atlasSectionId: "table",
    surfaceRoleLabel: "table",
    description:
      "Dense tabular surface for health grids, limited data views, and parity-first visual summaries.",
    shellTypes: ["operations", "governance", "pharmacy"],
    routeFamilyRefs: ["rf_operations_board", "rf_governance_shell", "rf_pharmacy_console"],
    specimenIds: ["Operations_Control_Room_Preview", "Governance_Approval_Frame"],
    stateVariants: ["degraded", "stale", "ready"],
    tokenBindings: [
      { tokenRef: "comp.table.header", cssVar: "--cp-table-header", purpose: "Table role alias" },
      { tokenRef: "ref.radius.sm", cssVar: "--cp-table-radius", purpose: "Dense table radius" },
      { tokenRef: "ref.space.8", cssVar: "--cp-table-pad", purpose: "Dense table padding" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Table rules" },
    ],
    apiSignature: "TableSurface({ caption, columns, rows, summary })",
    accentPolicy: "Table surfaces use accent only in limited summary or row markers.",
    densityPolicy: "Compact by default.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "artifact_mode", "accessibility"],
    accessibilitySummary:
      "TableSurface keeps caption, row headers, and table fallback parity for limited visualizations.",
  },
  {
    componentId: "ArtifactSurface",
    displayName: "Artifact Surface",
    primitiveFamily: "surface-role",
    atlasSectionId: "artifact",
    surfaceRoleLabel: "artifact",
    description:
      "Artifact or evidence viewing surface that explicitly exposes summary-only, preview, or blocked status.",
    shellTypes: ["patient", "operations", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_operations_board", "rf_governance_shell"],
    specimenIds: [
      "Patient_Mission_Frame",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["preview_verified", "summary_only", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.inset", cssVar: "--sys-surface-inset", purpose: "Artifact well" },
      { tokenRef: "ref.type.role.mono.sm", cssVar: "--cp-artifact-type", purpose: "Artifact metadata type" },
      { tokenRef: "ref.radius.lg", cssVar: "--cp-artifact-radius", purpose: "Artifact radius" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Artifact outline" },
    ],
    apiSignature: "ArtifactSurface({ title, status, metadata, children })",
    accentPolicy: "Artifact surfaces stay neutral and lean on metadata rather than large semantic fills.",
    densityPolicy: "Balanced or compact depending on metadata density.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["artifact_mode", "continuity_key", "selected_anchor", "accessibility"],
    accessibilitySummary:
      "ArtifactSurface keeps summary-only and preview status explicit, with stable return-anchor law.",
  },
  {
    componentId: "QuietPrimaryButton",
    displayName: "Quiet Primary Button",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Quiet primary button used for the single dominant action in a specimen viewport.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_staff_workspace",
      "rf_operations_board",
      "rf_governance_shell",
    ],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["default", "disabled"],
    tokenBindings: [
      { tokenRef: "ref.color.accent.active", cssVar: "--cp-button-accent", purpose: "Primary action accent" },
      { tokenRef: "ref.type.role.label", cssVar: "--cp-button-type", purpose: "Button typography" },
      { tokenRef: "ref.radius.pill", cssVar: "--cp-button-radius", purpose: "Button radius" },
      { tokenRef: "ref.density.control.public", cssVar: "--comp-control-height-public", purpose: "Public control height" },
    ],
    apiSignature: "QuietPrimaryButton({ children, markerRef, disabled })",
    accentPolicy: "Only one primary button may carry the route accent in a primary viewport.",
    densityPolicy: "Uses canonical control heights only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["dominant_action", "accessibility"],
    accessibilitySummary:
      "QuietPrimaryButton owns dominant-action marker law and contrast-safe focus treatment.",
  },
  {
    componentId: "SecondaryButton",
    displayName: "Secondary Button",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Neutral secondary button that pairs with the dominant action without competing visually.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_staff_workspace",
      "rf_operations_board",
      "rf_governance_shell",
    ],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["default", "disabled"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Secondary button surface" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Secondary button outline" },
      { tokenRef: "ref.radius.pill", cssVar: "--cp-button-radius", purpose: "Button radius" },
      { tokenRef: "ref.density.control.professional", cssVar: "--comp-control-height-professional", purpose: "Professional control height" },
    ],
    apiSignature: "SecondaryButton({ children, disabled })",
    accentPolicy: "Secondary buttons remain neutral even in blocked or review states.",
    densityPolicy: "Uses canonical professional control height.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["accessibility"],
    accessibilitySummary:
      "SecondaryButton retains the same focus and keyboard semantics as the dominant button without the accent fill.",
  },
  {
    componentId: "InlineUtilityButton",
    displayName: "Inline Utility Button",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Low-emphasis inline utility action for reveal, copy, or side observation.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_operations_board"],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
    ],
    stateVariants: ["default", "disabled"],
    tokenBindings: [
      { tokenRef: "ref.type.role.label", cssVar: "--cp-button-type", purpose: "Utility button type" },
      { tokenRef: "ref.color.text.muted", cssVar: "--sys-text-muted", purpose: "Utility button copy" },
      { tokenRef: "ref.motion.duration.attention", cssVar: "--motion-duration-attention", purpose: "Utility hover cue" },
      { tokenRef: "ref.radius.sm", cssVar: "--cp-button-radius-sm", purpose: "Utility radius" },
    ],
    apiSignature: "InlineUtilityButton({ children })",
    accentPolicy: "Utility actions stay text-led and never use a filled accent.",
    densityPolicy: "Inline only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["accessibility"],
    accessibilitySummary:
      "Inline utility actions keep focus affordances even with restrained visual weight.",
  },
  {
    componentId: "SegmentedTabs",
    displayName: "Segmented Tabs",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Segmented tabs for limited view changes inside a surface without changing shell continuity.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_operations_board"],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
    ],
    stateVariants: ["ready", "review"],
    tokenBindings: [
      { tokenRef: "ref.radius.pill", cssVar: "--cp-tabs-radius", purpose: "Tabs radius" },
      { tokenRef: "ref.color.surface.inset", cssVar: "--sys-surface-inset", purpose: "Tabs track" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Tabs outline" },
      { tokenRef: "ref.motion.duration.attention", cssVar: "--motion-duration-attention", purpose: "Tabs switch cue" },
    ],
    apiSignature: "SegmentedTabs({ items, activeItem })",
    accentPolicy: "Selected segment may use the shell accent; inactive tabs stay neutral.",
    densityPolicy: "Compact or balanced.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "accessibility"],
    accessibilitySummary:
      "Segmented tabs keep tablist semantics and selected-anchor continuity.",
  },
  {
    componentId: "QuietChip",
    displayName: "Quiet Chip",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Passive or lightly interactive chip for route-safe status metadata.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_operations_board"],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Operations_Control_Room_Preview",
    ],
    stateVariants: ["default", "selected"],
    tokenBindings: [
      { tokenRef: "ref.radius.pill", cssVar: "--cp-chip-radius", purpose: "Chip radius" },
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Chip surface" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Chip outline" },
      { tokenRef: "ref.type.role.label", cssVar: "--cp-chip-type", purpose: "Chip typography" },
    ],
    apiSignature: "QuietChip({ label, tone })",
    accentPolicy: "Chips use outline or soft tint only.",
    densityPolicy: "Inline only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["accessibility"],
    accessibilitySummary:
      "Quiet chips preserve legible text and icon contrast without relying on fill color alone.",
  },
  {
    componentId: "FilterPill",
    displayName: "Filter Pill",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Interactive pill for limited filter sets with count badges and keyboard-first toggling.",
    shellTypes: ["staff", "hub", "operations", "support"],
    routeFamilyRefs: ["rf_staff_workspace", "rf_operations_board", "rf_support_ticket_workspace"],
    specimenIds: ["Workspace_Quiet_Mission_Control", "Operations_Control_Room_Preview"],
    stateVariants: ["selected", "unselected"],
    tokenBindings: [
      { tokenRef: "ref.radius.pill", cssVar: "--cp-chip-radius", purpose: "Pill radius" },
      { tokenRef: "ref.color.surface.inset", cssVar: "--sys-surface-inset", purpose: "Filter pill track" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Filter pill outline" },
      { tokenRef: "ref.type.role.label", cssVar: "--cp-chip-type", purpose: "Filter pill type" },
    ],
    apiSignature: "FilterPill({ label, count, selected })",
    accentPolicy: "Selected filter pills may use a shell accent edge and neutral fill.",
    densityPolicy: "Compact.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "accessibility"],
    accessibilitySummary:
      "Filter pills keep button semantics and selected-state text cues beyond color fill.",
  },
  {
    componentId: "InputFieldFrame",
    displayName: "Input Field Frame",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Quiet text input frame with canonical focus and validation semantics.",
    shellTypes: ["patient", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_governance_shell", "rf_intake_self_service"],
    specimenIds: ["Patient_Mission_Frame", "Governance_Approval_Frame"],
    stateVariants: ["default", "error", "read_only"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Input well" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Input border" },
      { tokenRef: "ref.radius.sm", cssVar: "--cp-input-radius", purpose: "Input radius" },
      { tokenRef: "ref.density.control.public", cssVar: "--comp-control-height-public", purpose: "Input height" },
    ],
    apiSignature: "InputFieldFrame({ label, value, summary, state, hint })",
    accentPolicy: "Focus ring uses canonical token; validation tone is local only.",
    densityPolicy: "Public or relaxed height only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "accessibility"],
    accessibilitySummary:
      "Input frames preserve field accessibility contracts and explicit hint wiring.",
  },
  {
    componentId: "TextareaFrame",
    displayName: "Textarea Frame",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Quiet multiline text frame with canonical focus, hint, and validation treatment.",
    shellTypes: ["patient", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_governance_shell", "rf_intake_self_service"],
    specimenIds: ["Patient_Mission_Frame", "Governance_Approval_Frame"],
    stateVariants: ["default", "error", "read_only"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Textarea well" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Textarea border" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-input-radius", purpose: "Textarea radius" },
      { tokenRef: "ref.space.12", cssVar: "--cp-field-pad", purpose: "Textarea spacing" },
    ],
    apiSignature: "TextareaFrame({ label, value, summary, state, hint })",
    accentPolicy: "Validation tone is local and never changes the shell accent.",
    densityPolicy: "Balanced only.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "accessibility"],
    accessibilitySummary:
      "Textarea frames retain field labels, hint text, and error-summary wiring.",
  },
  {
    componentId: "SelectFrame",
    displayName: "Select Frame",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Quiet select frame for limited, explicit option sets.",
    shellTypes: ["patient", "staff", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_governance_shell"],
    specimenIds: [
      "Patient_Mission_Frame",
      "Workspace_Quiet_Mission_Control",
      "Governance_Approval_Frame",
    ],
    stateVariants: ["default", "error", "read_only"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Select well" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Select outline" },
      { tokenRef: "ref.radius.sm", cssVar: "--cp-input-radius", purpose: "Select radius" },
      { tokenRef: "ref.density.control.professional", cssVar: "--comp-control-height-professional", purpose: "Select height" },
    ],
    apiSignature: "SelectFrame({ label, options, value, state })",
    accentPolicy: "Select focus treatment uses canonical focus ring only.",
    densityPolicy: "Balanced or compact.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "accessibility"],
    accessibilitySummary:
      "Select frames keep accessible labels, option semantics, and focus treatment consistent.",
  },
  {
    componentId: "CheckboxRadioFrame",
    displayName: "Checkbox Radio Frame",
    primitiveFamily: "control",
    atlasSectionId: "controls",
    surfaceRoleLabel: "control",
    description:
      "Grouped checkbox or radio options with quiet framing and explicit legends.",
    shellTypes: ["patient", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_governance_shell", "rf_intake_self_service"],
    specimenIds: ["Patient_Mission_Frame", "Governance_Approval_Frame"],
    stateVariants: ["default", "error", "read_only"],
    tokenBindings: [
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Choice outline" },
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Choice surface" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-choice-radius", purpose: "Choice frame radius" },
      { tokenRef: "ref.type.role.body.sm", cssVar: "--cp-choice-type", purpose: "Choice typography" },
    ],
    apiSignature: "CheckboxRadioFrame({ legend, kind, options, selectedValues })",
    accentPolicy: "Selected controls use icon plus text cues, not color alone.",
    densityPolicy: "Balanced.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["selected_anchor", "accessibility"],
    accessibilitySummary:
      "Choice groups preserve fieldset semantics and selection state without color-only cues.",
  },
  {
    componentId: "LoadingSkeleton",
    displayName: "Loading Skeleton",
    primitiveFamily: "calm-state",
    atlasSectionId: "state-postures",
    surfaceRoleLabel: "state",
    description:
      "Calm loading summary that keeps spatial continuity and avoids decorative motion.",
    shellTypes: ["patient", "staff", "operations", "governance"],
    routeFamilyRefs: [
      "rf_patient_home",
      "rf_staff_workspace",
      "rf_operations_board",
      "rf_governance_shell",
    ],
    specimenIds: [],
    stateVariants: ["loading_summary"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.inset", cssVar: "--sys-surface-inset", purpose: "Skeleton surface" },
      { tokenRef: "ref.motion.duration.reveal", cssVar: "--motion-duration-reveal", purpose: "Reveal timing" },
      { tokenRef: "ref.motion.scale.low", cssVar: "--cp-skeleton-scale", purpose: "Static pulse scale" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-state-radius", purpose: "Skeleton radius" },
    ],
    apiSignature: "LoadingSkeleton({ label })",
    accentPolicy: "No semantic accent while loading.",
    densityPolicy: "Mirrors the target surface density.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "accessibility"],
    accessibilitySummary:
      "Loading skeletons keep loading semantics and reduced-motion equivalence through static emphasis only.",
  },
  {
    componentId: "EmptyStateFrame",
    displayName: "Empty State Frame",
    primitiveFamily: "calm-state",
    atlasSectionId: "state-postures",
    surfaceRoleLabel: "state",
    description:
      "Actionable empty state with one quiet next step and no dramatic illustration.",
    shellTypes: ["patient", "staff", "support"],
    routeFamilyRefs: ["rf_patient_home", "rf_staff_workspace", "rf_support_ticket_workspace"],
    specimenIds: [],
    stateVariants: ["empty_actionable", "empty_informational"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Empty state surface" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-state-radius", purpose: "State radius" },
      { tokenRef: "ref.space.16", cssVar: "--cp-state-pad", purpose: "State padding" },
      { tokenRef: "ref.type.role.body", cssVar: "--cp-state-copy", purpose: "State typography" },
    ],
    apiSignature: "EmptyStateFrame({ title, body, actionLabel })",
    accentPolicy: "Only the action button may use accent; container stays neutral.",
    densityPolicy: "Quiet or balanced.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "dominant_action", "accessibility"],
    accessibilitySummary:
      "Empty states retain summary and action hierarchy for keyboard-only recovery.",
  },
  {
    componentId: "StaleStateFrame",
    displayName: "Stale State Frame",
    primitiveFamily: "calm-state",
    atlasSectionId: "state-postures",
    surfaceRoleLabel: "state",
    description:
      "Review-state frame for stale or aging information that preserves context and one follow-up cue.",
    shellTypes: ["operations", "governance", "support"],
    routeFamilyRefs: ["rf_operations_board", "rf_governance_shell", "rf_support_replay_observe"],
    specimenIds: [],
    stateVariants: ["stale_review"],
    tokenBindings: [
      { tokenRef: "ref.color.accent.review", cssVar: "--cp-state-accent", purpose: "Review accent" },
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "State frame surface" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-state-radius", purpose: "State radius" },
      { tokenRef: "ref.space.16", cssVar: "--cp-state-pad", purpose: "State padding" },
    ],
    apiSignature: "StaleStateFrame({ title, body, freshnessLabel })",
    accentPolicy: "Review tone only, never danger fill.",
    densityPolicy: "Balanced.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "accessibility"],
    accessibilitySummary:
      "Stale states keep review status explicit and preserve reduced-motion summary equivalence.",
  },
  {
    componentId: "BlockedStateFrame",
    displayName: "Blocked State Frame",
    primitiveFamily: "calm-state",
    atlasSectionId: "state-postures",
    surfaceRoleLabel: "state",
    description:
      "Blocked or fail-closed state frame with one safe next step and no ambiguous implied action.",
    shellTypes: ["operations", "governance", "support"],
    routeFamilyRefs: ["rf_operations_board", "rf_governance_shell", "rf_support_replay_observe"],
    specimenIds: [],
    stateVariants: ["blocked_recovery"],
    tokenBindings: [
      { tokenRef: "ref.color.accent.danger", cssVar: "--cp-state-accent", purpose: "Blocked accent" },
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Blocked frame surface" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-state-radius", purpose: "State radius" },
      { tokenRef: "ref.space.16", cssVar: "--cp-state-pad", purpose: "State padding" },
    ],
    apiSignature: "BlockedStateFrame({ title, body, recoveryActionLabel })",
    accentPolicy: "Danger tone only at the boundary and icon; body stays calm.",
    densityPolicy: "Balanced.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "dominant_action", "accessibility"],
    accessibilitySummary:
      "Blocked states keep assertive next-step semantics and safe focus targets.",
  },
  {
    componentId: "RecoveryStateFrame",
    displayName: "Recovery State Frame",
    primitiveFamily: "calm-state",
    atlasSectionId: "state-postures",
    surfaceRoleLabel: "state",
    description:
      "Recovery-only state frame for read-only or guided continuation status.",
    shellTypes: ["patient", "support", "governance"],
    routeFamilyRefs: [
      "rf_patient_secure_link_recovery",
      "rf_support_replay_observe",
      "rf_governance_shell",
    ],
    specimenIds: [],
    stateVariants: ["recovery", "read_only"],
    tokenBindings: [
      { tokenRef: "ref.color.accent.success", cssVar: "--cp-state-accent", purpose: "Recovery accent" },
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Recovery frame surface" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-state-radius", purpose: "State radius" },
      { tokenRef: "ref.space.16", cssVar: "--cp-state-pad", purpose: "State padding" },
    ],
    apiSignature: "RecoveryStateFrame({ title, body, helperText })",
    accentPolicy: "Success or recovery accent only.",
    densityPolicy: "Quiet.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["surface_state", "selected_anchor", "accessibility"],
    accessibilitySummary:
      "Recovery states preserve restore and resume status without overloading the command lane.",
  },
  {
    componentId: "PlaceholderArtifactFrame",
    displayName: "Summary Artifact Frame",
    primitiveFamily: "calm-state",
    atlasSectionId: "state-postures",
    surfaceRoleLabel: "artifact",
    description:
      "Summary-only artifact summary for absent preview, handoff-only, or pending evidence surfaces.",
    shellTypes: ["patient", "operations", "governance"],
    routeFamilyRefs: ["rf_patient_home", "rf_operations_board", "rf_governance_shell"],
    specimenIds: [],
    stateVariants: ["summary_only", "handoff_only", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.inset", cssVar: "--sys-surface-inset", purpose: "Summary surface" },
      { tokenRef: "ref.radius.lg", cssVar: "--cp-artifact-radius", purpose: "Summary radius" },
      { tokenRef: "ref.type.role.mono.sm", cssVar: "--cp-artifact-type", purpose: "Summary metadata" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Summary border" },
    ],
    apiSignature: "PlaceholderArtifactFrame({ title, postureLabel, metadata })",
    accentPolicy: "No semantic fill; status is communicated through labels and metadata.",
    densityPolicy: "Compact or balanced.",
    visualizationParity: "not_applicable",
    automationSlotNames: ["artifact_mode", "continuity_key", "accessibility"],
    accessibilitySummary:
      "Summary artifact frames keep summary-only status explicit and machine-readable.",
  },
  {
    componentId: "ComparisonLedger",
    displayName: "Comparison Ledger",
    primitiveFamily: "visualization",
    atlasSectionId: "visualization",
    surfaceRoleLabel: "artifact",
    description:
      "Comparison primitive for before/after or current/proposed values with list-first fallback content.",
    shellTypes: ["operations", "governance"],
    routeFamilyRefs: ["rf_operations_board", "rf_governance_shell"],
    specimenIds: ["Operations_Control_Room_Preview", "Governance_Approval_Frame"],
    stateVariants: ["review", "blocked"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Comparison surface" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Comparison dividers" },
      { tokenRef: "ref.space.16", cssVar: "--cp-visualization-gap", purpose: "Comparison spacing" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-visualization-radius", purpose: "Comparison radius" },
    ],
    apiSignature: "ComparisonLedger({ title, rows, summary })",
    accentPolicy: "Comparison uses text-led deltas and small accent cues only.",
    densityPolicy: "Balanced.",
    visualizationParity: "summary_and_table_fallback",
    automationSlotNames: ["artifact_mode", "selected_anchor", "accessibility"],
    accessibilitySummary:
      "Comparison ledgers keep explicit summary text and structured row fallback data.",
  },
  {
    componentId: "BoundedVisualizationPanel",
    displayName: "Limited Visualization Panel",
    primitiveFamily: "visualization",
    atlasSectionId: "visualization",
    surfaceRoleLabel: "table",
    description:
      "Limited chart primitive that must always ship with summary text and a table fallback from the same data.",
    shellTypes: ["operations", "governance"],
    routeFamilyRefs: ["rf_operations_board", "rf_governance_shell"],
    specimenIds: ["Operations_Control_Room_Preview", "Governance_Approval_Frame"],
    stateVariants: ["degraded", "summary_only", "review"],
    tokenBindings: [
      { tokenRef: "ref.color.surface.panel", cssVar: "--sys-surface-panel", purpose: "Visualization panel surface" },
      { tokenRef: "ref.color.border.default", cssVar: "--sys-border-default", purpose: "Visualization panel boundary" },
      { tokenRef: "ref.space.16", cssVar: "--cp-visualization-gap", purpose: "Visualization spacing" },
      { tokenRef: "ref.radius.md", cssVar: "--cp-visualization-radius", purpose: "Visualization radius" },
    ],
    apiSignature:
      "BoundedVisualizationPanel({ title, summary, tableCaption, data, tone })",
    accentPolicy: "One semantic accent only, reflected in bars and summary badge.",
    densityPolicy: "Balanced. Dense grids live in the table fallback, not the chart plane.",
    visualizationParity: "summary_and_table_fallback",
    automationSlotNames: ["artifact_mode", "selected_anchor", "accessibility"],
    accessibilitySummary:
      "Limited visualizations must preserve summary text, table fallback, and parity projection refs from the same data source.",
  },
] as const satisfies readonly ComponentSeed[];

export const COMPONENT_GAP_RESOLUTIONS = [
  {
    gapId: "GAP_RESOLUTION_COMPONENT_API_SURFACE_ROLE_FRAMING_V1",
    title: "Surface-role framing props were not named in the corpus",
    resolution:
      "Every surface primitive now takes explicit `eyebrow`, `title`, and `summary` props so route-safe semantics stay visible and card-like wrappers do not absorb board, task, rail, or artifact roles.",
    source_refs: ["prompt/105.md", "blueprint/platform-frontend-blueprint.md#PersistentShell"],
  },
  {
    gapId: "GAP_RESOLUTION_COMPONENT_API_DECISION_DOCK_ACTIONS_V1",
    title: "Next-action command slots were implied but not typed",
    resolution:
      "Next-action controls now require one `primaryActionLabel` plus optional secondary and utility labels, which keeps one dominant action explicit.",
    source_refs: ["prompt/105.md", "blueprint/ux-quiet-clarity-redesign.md"],
  },
  {
    gapId: "GAP_RESOLUTION_COMPONENT_API_VISUALIZATION_PARITY_V1",
    title: "Visualization parity needed an explicit primitive rules",
    resolution:
      "BoundedVisualizationPanel requires `summary`, `tableCaption`, and `data` props together so chart and table parity cannot be skipped or added ad hoc by specimen code.",
    source_refs: ["prompt/105.md", "blueprint/accessibility-and-content-system-contract.md"],
  },
] as const satisfies readonly PrimitiveGapResolution[];

export const COMPONENT_FOLLOW_ON_DEPENDENCIES = [
  {
    dependencyId: "FOLLOW_ON_DEPENDENCY_PATIENT_SHELL_SPECIALIZATION_V1",
    ownerTaskRange: "par_154-par_163",
    description:
      "Patient shell work should compose `ShellFrame`, `SharedStatusStrip`, `CardSurface`, `ListSurface`, and `FormSurface` directly instead of creating patient-only container primitives.",
    source_refs: ["prompt/105.md", "prompt/154.md", "prompt/163.md"],
  },
  {
    dependencyId: "FOLLOW_ON_DEPENDENCY_WORKSPACE_QUEUE_SPECIALIZATION_V1",
    ownerTaskRange: "par_220-par_222",
    description:
      "Support and staff workspace shells should specialize queue and replay content through `RailSurface`, `TaskSurface`, `DecisionDock`, and `SelectedAnchorStub` without forking state semantics or automation markers.",
    source_refs: ["prompt/105.md", "prompt/220.md", "prompt/222.md"],
  },
  {
    dependencyId: "FOLLOW_ON_DEPENDENCY_GOVERNANCE_APPROVAL_SPECIALIZATION_V1",
    ownerTaskRange: "phase3 governance and release tracks",
    description:
      "Governance approval and release flows should keep `StateBraid`, `ArtifactSurface`, `ComparisonLedger`, and `BoundedVisualizationPanel` intact while adding route-specific copy and evidence data later.",
    source_refs: ["prompt/105.md", "prompt/239.md", "prompt/240.md"],
  },
] as const satisfies readonly PrimitiveFollowOnDependency[];

export const componentPrimitiveContracts = componentContractSeeds.map(defineComponent);

export const componentPrimitiveObjectFamilies: readonly {
  canonicalName: string;
  objectKind: string;
  boundedContext: string;
  authoritativeOwner: string;
  sourceRef: string;
}[] = componentPrimitiveContracts.map((component) => ({
  canonicalName: component.componentId,
  objectKind: "other",
  boundedContext: "foundation_runtime_experience",
  authoritativeOwner: "Frontend continuity runtime",
  sourceRef: `prompt/105.md#${component.componentId}`,
}));

export const componentPrimitiveContractFamily = {
  contractFamilyId: "CF_105_SHARED_COMPONENT_PRIMITIVES",
  label: "Shared component primitives and route-safe specimen compositions",
  description:
    "Typed component primitives bound to token and core law so later shells compose the same semantic, automation, and accessibility details.",
  versioningPosture: "Published additive component rules family with route-safe token and core bindings.",
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
  sourceRefs: ["prompt/105.md", "blueprint/platform-frontend-blueprint.md"],
  ownedObjectFamilyCount: componentPrimitiveObjectFamilies.length,
} as const;

export const shellProfileLenses = profileSelectionResolutions.map((profileSelection) => {
  const profileToken = requireValue(
    profileTokenByShell.get(profileSelection.shellType),
    `Missing profile token for ${profileSelection.shellType}`,
  );
  return {
    shellType: profileSelection.shellType,
    label: toTitle(profileSelection.shellType),
    profileSelectionResolutionId: profileSelection.profileSelectionResolutionId,
    profileTokenRef: profileSelection.profileTokenRef,
    routeClassRef: profileSelection.routeClassRef,
    accentRole: profileToken.accentRole,
    defaultDensityMode: profileToken.defaultDensityMode,
    defaultMotionMode: profileToken.defaultMotionMode,
    allowedSurfaceRoleRefs: profileSelection.allowedSurfaceRoleRefs,
  } satisfies ShellProfileLens;
});

export const specimenCompositions = [
  {
    specimenId: "Patient_Mission_Frame",
    label: "Patient mission frame",
    shellType: "patient",
    bundleRef: "dcpb::patient_authenticated_shell::planned",
    routeFamilyRef: "rf_patient_home",
    routeLabel: "Patient Home",
    atlasSectionId: "board",
    headline: "Patient_Mission_Frame",
    summary:
      "Calm section entry with a spotlight card, quiet action row, limited record excerpt, and one promoted support region.",
    dominantAccentTokenRef: "ref.color.accent.active",
    dominantActionLabel: "Continue today’s request",
    promotedSupportRegionLabel: "Support snapshot",
    promotedSupportRegionCount: 1,
    layoutTopology: "focus_frame",
    densityPosture: "quiet",
    componentIds: [
      "ShellFrame",
      "ShellHeader",
      "SharedStatusStrip",
      "BoardSurface",
      "CardSurface",
      "DecisionDock",
      "ListSurface",
      "PromotedSupportRegionFrame",
      "ArtifactSurface",
      "FormSurface",
    ],
  },
  {
    specimenId: "Workspace_Quiet_Mission_Control",
    label: "Workspace quiet mission control",
    shellType: "staff",
    bundleRef: "dcpb::clinical_workspace::planned",
    routeFamilyRef: "rf_staff_workspace",
    routeLabel: "Staff Workspace",
    atlasSectionId: "task",
    headline: "Workspace_Quiet_Mission_Control",
    summary:
      "Compact queue spine, preview pocket, active task surface, decision dock, and interruption digest summary.",
    dominantAccentTokenRef: "ref.color.accent.insight",
    dominantActionLabel: "Advance active review",
    promotedSupportRegionLabel: "Preview pocket",
    promotedSupportRegionCount: 1,
    layoutTopology: "two_plane",
    densityPosture: "mixed",
    componentIds: [
      "ShellFrame",
      "ShellRail",
      "ShellHeader",
      "SharedStatusStrip",
      "RailSurface",
      "TaskSurface",
      "DrawerSurface",
      "DecisionDock",
      "SelectedAnchorStub",
      "ListSurface",
    ],
  },
  {
    specimenId: "Operations_Control_Room_Preview",
    label: "Operations control room preview",
    shellType: "operations",
    bundleRef: "dcpb::operations_console::planned",
    routeFamilyRef: "rf_operations_board",
    routeLabel: "Operations Board",
    atlasSectionId: "table",
    headline: "Operations_Control_Room_Preview",
    summary:
      "North-star band, one table-first health grid, one limited chart with summary and table fallback, and intervention workbench summary.",
    dominantAccentTokenRef: "ref.color.accent.review",
    dominantActionLabel: "Inspect anomaly summary",
    promotedSupportRegionLabel: "Intervention workbench",
    promotedSupportRegionCount: 1,
    layoutTopology: "three_plane",
    densityPosture: "dense",
    componentIds: [
      "ShellFrame",
      "ShellRail",
      "ShellHeader",
      "SharedStatusStrip",
      "BoardSurface",
      "TableSurface",
      "BoundedVisualizationPanel",
      "ComparisonLedger",
      "DrawerSurface",
      "BlockedStateFrame",
    ],
  },
  {
    specimenId: "Governance_Approval_Frame",
    label: "Governance approval frame",
    shellType: "governance",
    bundleRef: "dcpb::governance_admin::planned",
    routeFamilyRef: "rf_governance_shell",
    routeLabel: "Governance Shell",
    atlasSectionId: "artifact",
    headline: "Governance_Approval_Frame",
    summary:
      "Scope ribbon, change envelope, impact preview, approval stepper, and evidence rail held in one quiet review shell.",
    dominantAccentTokenRef: "ref.color.accent.review",
    dominantActionLabel: "Review approval summary",
    promotedSupportRegionLabel: "Evidence rail",
    promotedSupportRegionCount: 1,
    layoutTopology: "two_plane",
    densityPosture: "mixed",
    componentIds: [
      "ShellFrame",
      "ShellRail",
      "ShellHeader",
      "SharedStatusStrip",
      "CardSurface",
      "TaskSurface",
      "ComparisonLedger",
      "StateBraid",
      "ArtifactSurface",
      "FormSurface",
    ],
  },
] as const satisfies readonly SpecimenComposition[];

export const componentAtlasSections = [
  {
    sectionId: "shell-plane",
    label: "Shell plane",
    summary: "Continuity shell, masthead, rail, support pocket, and shared status law.",
  },
  {
    sectionId: "semantic-working",
    label: "Semantic working",
    summary: "Mission state, decision, freshness, and anchor primitives.",
  },
  { sectionId: "board", label: "Board", summary: "Open mission board surfaces." },
  { sectionId: "card", label: "Card", summary: "Limited spotlight or support cards only." },
  { sectionId: "task", label: "Task", summary: "Focused action surfaces." },
  { sectionId: "rail", label: "Rail", summary: "Dense vertical evidence or queue rails." },
  { sectionId: "drawer", label: "Drawer", summary: "Elevated preview and support drawers." },
  { sectionId: "form", label: "Form", summary: "Field and grouped input surfaces." },
  { sectionId: "list", label: "List", summary: "List-first request and queue excerpts." },
  { sectionId: "table", label: "Table", summary: "Dense tabular surfaces and chart fallback tables." },
  { sectionId: "artifact", label: "Artifact", summary: "Evidence and summary-only artifact planes." },
  { sectionId: "controls", label: "Controls", summary: "Buttons, chips, tabs, and field frames." },
  { sectionId: "state-postures", label: "State postures", summary: "Calm loading, empty, stale, blocked, and recovery states." },
  { sectionId: "visualization", label: "Visualization", summary: "Comparison and limited chart primitives with fallback parity." },
] as const;

type MarkerProps = {
  componentId: string;
  atlasSectionId: AtlasSectionId;
  surfaceRoleLabel: string;
  testId?: string;
  className?: string;
};

function componentProps({
  componentId,
  atlasSectionId,
  surfaceRoleLabel,
  testId,
  className,
}: MarkerProps): Record<string, string | undefined> {
  return {
    className: cx("cp-component", className),
    "data-component-id": componentId,
    "data-atlas-section": atlasSectionId,
    "data-surface-role": surfaceRoleLabel,
    "data-testid": testId,
  };
}

function toneClass(tone: AccentTone): string {
  return `cp-tone--${tone}`;
}

function SectionHeading({
  eyebrow,
  title,
  summary,
}: {
  eyebrow: string;
  title: string;
  summary?: string;
}) {
  return (
    <header className="cp-heading">
      <span className="cp-kicker">{eyebrow}</span>
      <h3>{title}</h3>
      {summary ? <p>{summary}</p> : null}
    </header>
  );
}

export function QuietPrimaryButton({
  children,
  markerRef,
  testId,
  disabled,
}: {
  children: ReactNode;
  markerRef?: string;
  testId?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="cp-button cp-button--primary"
      data-component-id="QuietPrimaryButton"
      data-atlas-section="controls"
      data-surface-role="control"
      data-dom-marker={markerRef ? "dominant-action" : undefined}
      data-marker-ref={markerRef}
      data-testid={testId}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  testId,
  disabled,
}: {
  children: ReactNode;
  testId?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="cp-button cp-button--secondary"
      data-component-id="SecondaryButton"
      data-atlas-section="controls"
      data-surface-role="control"
      data-testid={testId}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function InlineUtilityButton({
  children,
  testId,
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      className="cp-button cp-button--utility"
      data-component-id="InlineUtilityButton"
      data-atlas-section="controls"
      data-surface-role="control"
      data-testid={testId}
    >
      {children}
    </button>
  );
}

export function QuietChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: AccentTone;
}) {
  return (
    <span
      className={cx("cp-chip", tone !== "neutral" && toneClass(tone))}
      data-component-id="QuietChip"
      data-atlas-section="controls"
      data-surface-role="control"
    >
      {label}
    </span>
  );
}

export function FilterPill({
  label,
  count,
  selected,
}: {
  label: string;
  count: number;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      className={cx("cp-pill", selected && "is-selected")}
      data-component-id="FilterPill"
      data-atlas-section="controls"
      data-surface-role="control"
      aria-pressed={selected}
    >
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

export function SegmentedTabs({
  items,
  activeItem,
}: {
  items: readonly string[];
  activeItem: string;
}) {
  return (
    <div
      className="cp-tabs"
      data-component-id="SegmentedTabs"
      data-atlas-section="controls"
      data-surface-role="control"
      role="tablist"
      aria-label="Segmented tabs"
    >
      {items.map((item) => {
        const selected = item === activeItem;
        return (
          <button
            key={item}
            type="button"
            role="tab"
            className={cx("cp-tabs__item", selected && "is-selected")}
            aria-selected={selected}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

type FieldShellProps = {
  componentId: "InputFieldFrame" | "TextareaFrame" | "SelectFrame";
  label: string;
  hint?: string;
  state?: "default" | "error" | "read_only";
  children: ReactNode;
};

function FieldShell({ componentId, label, hint, state = "default", children }: FieldShellProps) {
  return (
    <label
      className={cx("cp-field", state !== "default" && `is-${state}`)}
      data-component-id={componentId}
      data-atlas-section="controls"
      data-surface-role="control"
    >
      <span className="cp-field__label">{label}</span>
      {children}
      {hint ? <span className="cp-field__hint">{hint}</span> : null}
    </label>
  );
}

export function InputFieldFrame({
  label,
  value,
  placeholder,
  state = "default",
  hint,
  inputProps,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  state?: "default" | "error" | "read_only";
  hint?: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "placeholder" | "readOnly">;
}) {
  return (
    <FieldShell componentId="InputFieldFrame" label={label} state={state} hint={hint}>
      <input
        className="cp-field__control"
        value={value}
        placeholder={placeholder}
        readOnly={state === "read_only" || value !== undefined}
        {...inputProps}
      />
    </FieldShell>
  );
}

export function TextareaFrame({
  label,
  value,
  placeholder,
  state = "default",
  hint,
  textareaProps,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  state?: "default" | "error" | "read_only";
  hint?: string;
  textareaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "placeholder" | "readOnly"
  >;
}) {
  return (
    <FieldShell componentId="TextareaFrame" label={label} state={state} hint={hint}>
      <textarea
        className="cp-field__control cp-field__control--textarea"
        value={value}
        placeholder={placeholder}
        readOnly={state === "read_only" || value !== undefined}
        {...textareaProps}
      />
    </FieldShell>
  );
}

export function SelectFrame({
  label,
  value,
  options,
  state = "default",
}: {
  label: string;
  value: string;
  options: readonly string[];
  state?: "default" | "error" | "read_only";
}) {
  return (
    <FieldShell componentId="SelectFrame" label={label} state={state}>
      <select
        className="cp-field__control"
        defaultValue={value}
        disabled={state === "read_only"}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxRadioFrame({
  legend,
  kind,
  options,
  selectedValues,
}: {
  legend: string;
  kind: "checkbox" | "radio";
  options: readonly string[];
  selectedValues: readonly string[];
}) {
  return (
    <fieldset
      className="cp-choice-group"
      data-component-id="CheckboxRadioFrame"
      data-atlas-section="controls"
      data-surface-role="control"
    >
      <legend>{legend}</legend>
      {options.map((option) => {
        const checked = selectedValues.includes(option);
        return (
          <label key={option} className="cp-choice-group__option">
            <input
              type={kind}
              value={option}
              defaultChecked={checked}
              name={legend}
            />
            <span>{option}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

type SurfaceProps = {
  componentId:
    | "BoardSurface"
    | "CardSurface"
    | "TaskSurface"
    | "RailSurface"
    | "DrawerSurface"
    | "FormSurface"
    | "ListSurface"
    | "TableSurface"
    | "ArtifactSurface";
  atlasSectionId: AtlasSectionId;
  surfaceRoleLabel: string;
  eyebrow: string;
  title: string;
  summary?: string;
  tone?: AccentTone;
  className?: string;
  children: ReactNode;
  testId?: string;
};

function SurfaceFrame({
  componentId,
  atlasSectionId,
  surfaceRoleLabel,
  eyebrow,
  title,
  summary,
  tone = "neutral",
  className,
  children,
  testId,
}: SurfaceProps) {
  return (
    <section
      {...componentProps({
        componentId,
        atlasSectionId,
        surfaceRoleLabel,
        className: cx("cp-surface", className, tone !== "neutral" && toneClass(tone)),
        testId,
      })}
    >
      <SectionHeading eyebrow={eyebrow} title={title} summary={summary} />
      {children}
    </section>
  );
}

export function BoardSurface(props: Omit<SurfaceProps, "componentId" | "atlasSectionId" | "surfaceRoleLabel">) {
  return <SurfaceFrame {...props} componentId="BoardSurface" atlasSectionId="board" surfaceRoleLabel="board" className={cx("cp-surface--board", props.className)} />;
}

export function CardSurface(props: Omit<SurfaceProps, "componentId" | "atlasSectionId" | "surfaceRoleLabel">) {
  return <SurfaceFrame {...props} componentId="CardSurface" atlasSectionId="card" surfaceRoleLabel="card" className={cx("cp-surface--card", props.className)} />;
}

export function TaskSurface(props: Omit<SurfaceProps, "componentId" | "atlasSectionId" | "surfaceRoleLabel">) {
  return <SurfaceFrame {...props} componentId="TaskSurface" atlasSectionId="task" surfaceRoleLabel="task" className={cx("cp-surface--task", props.className)} />;
}

export function RailSurface(props: Omit<SurfaceProps, "componentId" | "atlasSectionId" | "surfaceRoleLabel">) {
  return <SurfaceFrame {...props} componentId="RailSurface" atlasSectionId="rail" surfaceRoleLabel="rail" className={cx("cp-surface--rail", props.className)} />;
}

export function DrawerSurface(props: Omit<SurfaceProps, "componentId" | "atlasSectionId" | "surfaceRoleLabel">) {
  return <SurfaceFrame {...props} componentId="DrawerSurface" atlasSectionId="drawer" surfaceRoleLabel="drawer" className={cx("cp-surface--drawer", props.className)} />;
}

export function FormSurface(props: Omit<SurfaceProps, "componentId" | "atlasSectionId" | "surfaceRoleLabel">) {
  return <SurfaceFrame {...props} componentId="FormSurface" atlasSectionId="form" surfaceRoleLabel="form" className={cx("cp-surface--form", props.className)} />;
}

export function ListSurface({
  eyebrow,
  title,
  summary,
  rows,
  tone = "neutral",
  testId,
}: {
  eyebrow: string;
  title: string;
  summary?: string;
  rows: readonly { title: string; detail: string; meta: string }[];
  tone?: AccentTone;
  testId?: string;
}) {
  return (
    <SurfaceFrame
      componentId="ListSurface"
      atlasSectionId="list"
      surfaceRoleLabel="list"
      eyebrow={eyebrow}
      title={title}
      summary={summary}
      tone={tone}
      className="cp-surface--list"
      testId={testId}
    >
      <ul className="cp-list">
        {rows.map((row) => (
          <li key={`${row.title}-${row.meta}`}>
            <strong>{row.title}</strong>
            <span>{row.detail}</span>
            <small>{row.meta}</small>
          </li>
        ))}
      </ul>
    </SurfaceFrame>
  );
}

export function TableSurface({
  caption,
  columns,
  rows,
  summary,
  tone = "neutral",
  testId,
}: {
  caption: string;
  columns: readonly string[];
  rows: readonly string[][];
  summary: string;
  tone?: AccentTone;
  testId?: string;
}) {
  return (
    <SurfaceFrame
      componentId="TableSurface"
      atlasSectionId="table"
      surfaceRoleLabel="table"
      eyebrow="Table surface"
      title={caption}
      summary={summary}
      tone={tone}
      className="cp-surface--table"
      testId={testId}
    >
      <table className="cp-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join(":")}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </SurfaceFrame>
  );
}

export function ArtifactSurface({
  title,
  posture,
  metadata,
  children,
  tone = "neutral",
  testId,
}: {
  title: string;
  posture: string;
  metadata: readonly string[];
  children: ReactNode;
  tone?: AccentTone;
  testId?: string;
}) {
  return (
    <SurfaceFrame
      componentId="ArtifactSurface"
      atlasSectionId="artifact"
      surfaceRoleLabel="artifact"
      eyebrow="Artifact surface"
      title={title}
      summary={posture}
      tone={tone}
      className="cp-surface--artifact"
      testId={testId}
    >
      <div className="cp-artifact-meta">
        {metadata.map((item) => (
          <code key={item}>{item}</code>
        ))}
      </div>
      <div className="cp-artifact-body">{children}</div>
    </SurfaceFrame>
  );
}

export function CasePulse({
  label,
  value,
  detail,
  tone = "active",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: AccentTone;
}) {
  return (
    <article
      className={cx("cp-pulse", toneClass(tone))}
      data-component-id="CasePulse"
      data-atlas-section="semantic-working"
      data-surface-role="card"
    >
      <span className="cp-kicker">{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

export function FreshnessChip({
  freshnessState,
  label,
}: {
  freshnessState: "fresh" | "aging" | "stale" | "disconnected";
  label: string;
}) {
  return (
    <span
      className={cx("cp-chip", "cp-chip--freshness", freshnessState === "stale" && "is-stale")}
      data-component-id="FreshnessChip"
      data-atlas-section="semantic-working"
      data-surface-role="status-strip"
    >
      {label}
    </span>
  );
}

export function AmbientStateRibbon({
  tone = "neutral",
  label,
  detail,
}: {
  tone?: AccentTone;
  label: string;
  detail: string;
}) {
  return (
    <div
      className={cx("cp-ribbon", tone !== "neutral" && toneClass(tone))}
      data-component-id="AmbientStateRibbon"
      data-atlas-section="semantic-working"
      data-surface-role="status-strip"
    >
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function SharedStatusStrip({
  tone,
  stateLabel,
  detail,
  freshnessLabel,
  settlementLabel,
  testId,
}: {
  tone: AccentTone;
  stateLabel: string;
  detail: string;
  freshnessLabel: string;
  settlementLabel: string;
  testId?: string;
}) {
  return (
    <section
      {...componentProps({
        componentId: "SharedStatusStrip",
        atlasSectionId: "shell-plane",
        surfaceRoleLabel: "status-strip",
        className: "cp-status-strip",
        testId,
      })}
      data-dom-marker="surface-state"
    >
      <AmbientStateRibbon tone={tone} label={stateLabel} detail={detail} />
      <FreshnessChip freshnessState={tone === "review" ? "aging" : "fresh"} label={freshnessLabel} />
      <QuietChip label={settlementLabel} tone="neutral" />
    </section>
  );
}

export function SelectedAnchorStub({
  markerRef,
  label,
  detail,
}: {
  markerRef: string;
  label: string;
  detail: string;
}) {
  return (
    <aside
      className="cp-anchor-stub"
      data-component-id="SelectedAnchorStub"
      data-atlas-section="semantic-working"
      data-surface-role="artifact"
      data-dom-marker="selected-anchor"
      data-marker-ref={markerRef}
    >
      <span className="cp-kicker">Selected anchor</span>
      <strong>{label}</strong>
      <p>{detail}</p>
    </aside>
  );
}

export function StateBraid({
  steps,
  activeStep,
  tone = "review",
}: {
  steps: readonly string[];
  activeStep: string;
  tone?: AccentTone;
}) {
  return (
    <ol
      className={cx("cp-state-braid", toneClass(tone))}
      data-component-id="StateBraid"
      data-atlas-section="semantic-working"
      data-surface-role="task"
    >
      {steps.map((step) => (
        <li key={step} className={cx(step === activeStep && "is-active")}>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function DecisionDock({
  title,
  summary,
  primaryActionLabel,
  secondaryActionLabel,
  utilityActionLabel,
  dominantMarkerRef,
  selectedAnchorMarkerRef,
}: {
  title: string;
  summary: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  utilityActionLabel?: string;
  dominantMarkerRef: string;
  selectedAnchorMarkerRef: string;
}) {
  return (
    <section
      className="cp-decision-dock"
      data-component-id="DecisionDock"
      data-atlas-section="semantic-working"
      data-surface-role="task"
      data-dom-marker="selected-anchor"
      data-anchor-ref={selectedAnchorMarkerRef}
    >
      <div className="cp-decision-dock__copy">
        <span className="cp-kicker">Decision dock</span>
        <h3>{title}</h3>
        <p>{summary}</p>
      </div>
      <div className="cp-decision-dock__actions">
        <QuietPrimaryButton markerRef={dominantMarkerRef}>{primaryActionLabel}</QuietPrimaryButton>
        {secondaryActionLabel ? <SecondaryButton>{secondaryActionLabel}</SecondaryButton> : null}
        {utilityActionLabel ? <InlineUtilityButton>{utilityActionLabel}</InlineUtilityButton> : null}
      </div>
    </section>
  );
}

export function ShellHeader({
  eyebrow,
  title,
  summary,
  chips,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  chips: readonly string[];
  children?: ReactNode;
}) {
  return (
    <header
      className="cp-shell-header"
      data-component-id="ShellHeader"
      data-atlas-section="shell-plane"
      data-surface-role="shell-plane"
    >
      <div className="cp-shell-header__copy">
        <span className="cp-kicker">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{summary}</p>
      </div>
      <div className="cp-shell-header__meta">
        <div className="cp-chip-row">
          {chips.map((chip) => (
            <QuietChip key={chip} label={chip} />
          ))}
        </div>
        {children}
      </div>
    </header>
  );
}

export function ShellRail({
  title,
  items,
  footer,
}: {
  title: string;
  items: readonly { title: string; detail: string }[];
  footer?: ReactNode;
}) {
  return (
    <aside
      className="cp-shell-rail"
      data-component-id="ShellRail"
      data-atlas-section="shell-plane"
      data-surface-role="rail"
    >
      <SectionHeading eyebrow="Shell rail" title={title} />
      <ul className="cp-shell-rail__items">
        {items.map((item) => (
          <li key={`${item.title}-${item.detail}`}>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </li>
        ))}
      </ul>
      {footer ? <div className="cp-shell-rail__footer">{footer}</div> : null}
    </aside>
  );
}

export function PromotedSupportRegionFrame({
  title,
  eyebrow,
  supportingCopy,
  children,
}: {
  title: string;
  eyebrow: string;
  supportingCopy: string;
  children: ReactNode;
}) {
  return (
    <aside
      className="cp-support-region"
      data-component-id="PromotedSupportRegionFrame"
      data-atlas-section="shell-plane"
      data-surface-role="artifact"
    >
      <SectionHeading eyebrow={eyebrow} title={title} summary={supportingCopy} />
      {children}
    </aside>
  );
}

type StateFrameTone = "neutral" | "review" | "danger" | "success";

function StateFrame({
  componentId,
  title,
  body,
  actionLabel,
  actionMarkerRef,
  tone,
  children,
}: {
  componentId:
    | "LoadingSkeleton"
    | "EmptyStateFrame"
    | "StaleStateFrame"
    | "BlockedStateFrame"
    | "RecoveryStateFrame"
    | "PlaceholderArtifactFrame";
  title: string;
  body: string;
  actionLabel?: string;
  actionMarkerRef?: string;
  tone: StateFrameTone;
  children?: ReactNode;
}) {
  return (
    <section
      className={cx("cp-state-frame", `cp-state-frame--${tone}`)}
      data-component-id={componentId}
      data-atlas-section="state-postures"
      data-surface-role={componentId === "PlaceholderArtifactFrame" ? "artifact" : "state"}
    >
      <span className="cp-kicker">{toTitle(componentId)}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      {children}
      {actionLabel ? (
        <QuietPrimaryButton markerRef={actionMarkerRef}>{actionLabel}</QuietPrimaryButton>
      ) : null}
    </section>
  );
}

export function LoadingSkeleton({ label }: { label: string }) {
  return (
    <section
      className="cp-state-frame cp-state-frame--neutral cp-skeleton"
      data-component-id="LoadingSkeleton"
      data-atlas-section="state-postures"
      data-surface-role="state"
      aria-label={label}
    >
      <span className="cp-kicker">Loading skeleton</span>
      <div className="cp-skeleton__line cp-skeleton__line--wide" />
      <div className="cp-skeleton__line" />
      <div className="cp-skeleton__line cp-skeleton__line--short" />
    </section>
  );
}

export function EmptyStateFrame({
  title,
  body,
  actionLabel,
}: {
  title: string;
  body: string;
  actionLabel: string;
}) {
  return <StateFrame componentId="EmptyStateFrame" title={title} body={body} actionLabel={actionLabel} tone="neutral" />;
}

export function StaleStateFrame({
  title,
  body,
  freshnessLabel,
}: {
  title: string;
  body: string;
  freshnessLabel: string;
}) {
  return (
    <StateFrame componentId="StaleStateFrame" title={title} body={body} tone="review">
      <FreshnessChip freshnessState="stale" label={freshnessLabel} />
    </StateFrame>
  );
}

export function BlockedStateFrame({
  title,
  body,
  recoveryActionLabel,
  recoveryActionMarkerRef,
}: {
  title: string;
  body: string;
  recoveryActionLabel: string;
  recoveryActionMarkerRef?: string;
}) {
  return (
    <StateFrame
      componentId="BlockedStateFrame"
      title={title}
      body={body}
      actionLabel={recoveryActionLabel}
      actionMarkerRef={recoveryActionMarkerRef}
      tone="danger"
    />
  );
}

export function RecoveryStateFrame({
  title,
  body,
  helperText,
}: {
  title: string;
  body: string;
  helperText: string;
}) {
  return (
    <StateFrame componentId="RecoveryStateFrame" title={title} body={body} tone="success">
      <p className="cp-state-frame__helper">{helperText}</p>
    </StateFrame>
  );
}

export function PlaceholderArtifactFrame({
  title,
  postureLabel,
  metadata,
}: {
  title: string;
  postureLabel: string;
  metadata: readonly string[];
}) {
  return (
    <StateFrame componentId="PlaceholderArtifactFrame" title={title} body={postureLabel} tone="neutral">
      <div className="cp-artifact-meta">
        {metadata.map((item) => (
          <code key={item}>{item}</code>
        ))}
      </div>
    </StateFrame>
  );
}

export function ComparisonLedger({
  title,
  rows,
  summary,
}: {
  title: string;
  rows: readonly { label: string; current: string; proposed: string }[];
  summary: string;
}) {
  return (
    <section
      className="cp-visualization cp-visualization--comparison"
      data-component-id="ComparisonLedger"
      data-atlas-section="visualization"
      data-surface-role="artifact"
    >
      <SectionHeading eyebrow="Comparison ledger" title={title} summary={summary} />
      <table className="cp-table">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Current</th>
            <th scope="col">Proposed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.current}</td>
              <td>{row.proposed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export interface VisualizationDatum {
  label: string;
  value: number;
  detail: string;
}

export function BoundedVisualizationPanel({
  title,
  summary,
  tableCaption,
  data,
  tone = "review",
  testId,
}: {
  title: string;
  summary: string;
  tableCaption: string;
  data: readonly VisualizationDatum[];
  tone?: AccentTone;
  testId?: string;
}) {
  return (
    <section
      className={cx("cp-visualization", "cp-visualization--bounded", toneClass(tone))}
      data-component-id="BoundedVisualizationPanel"
      data-atlas-section="visualization"
      data-surface-role="table"
      data-testid={testId}
    >
      <SectionHeading eyebrow="Limited visualization" title={title} summary={summary} />
      <p data-testid="visualization-summary">{summary}</p>
      <div className="cp-chart" aria-hidden="true">
        {data.map((row) => (
          <div className="cp-chart__row" key={row.label}>
            <span>{row.label}</span>
            <div className="cp-chart__bar-track">
              <div className="cp-chart__bar" style={{ width: `${row.value}%` } as CSSProperties} />
            </div>
            <strong>{row.value}%</strong>
          </div>
        ))}
      </div>
      <table className="cp-table" data-testid="visualization-table">
        <caption>{tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Availability</th>
            <th scope="col">Context</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}%</td>
              <td>{row.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function specimenRows(specimenId: SpecimenId) {
  if (specimenId === "Patient_Mission_Frame") {
    return {
      listRows: [
        { title: "Medication request", detail: "Awaiting patient confirmation", meta: "Due today" },
        { title: "Appointment note", detail: "Summary accepted", meta: "Projection seen" },
        { title: "Care update", detail: "Clinician reply buffered", meta: "Live parity intact" },
      ],
    };
  }
  if (specimenId === "Workspace_Quiet_Mission_Control") {
    return {
      listRows: [
        { title: "Callback routing", detail: "Pinned to triage owner", meta: "Anchor intact" },
        { title: "Evidence refresh", detail: "Buffered replay available", meta: "No action yet" },
        { title: "Patient reply", detail: "Preview pocket loaded", meta: "Summary only" },
      ],
    };
  }
  if (specimenId === "Operations_Control_Room_Preview") {
    return {
      tableRows: [
        ["Gateway BFF", "91%", "Summary only"],
        ["Projection worker", "98%", "Healthy"],
        ["Notification worker", "94%", "Watch lane"],
        ["Preview environments", "88%", "Intervention required"],
      ],
    };
  }
  return {
    listRows: [
      { title: "Change bundle", detail: "Scope freeze held", meta: "Awaiting evidence" },
      { title: "Impact witness", detail: "Comparison ledger pinned", meta: "Review rail" },
      { title: "Approval step", detail: "Majority quorum incomplete", meta: "Read-only" },
    ],
  };
}

function buildRootDataset(
  specimen: SpecimenComposition,
  binding: ResolvedPrimitiveRouteBinding,
): Record<string, string> {
  return {
    "data-shell-type": binding.shellType,
    "data-channel-profile": binding.profileSelection.profileSelectionResolutionId,
    "data-route-family": binding.routeFamilyRef,
    "data-design-contract-digest": binding.bundle.designContractDigestRef,
    "data-design-contract-state": binding.bundle.publicationState,
    "data-design-contract-lint-state": binding.lintVerdict.result,
    "data-layout-topology": specimen.layoutTopology,
    "data-breakpoint-class": "expanded",
    "data-density-profile": specimen.densityPosture,
    "data-surface-state": binding.scenario.effectiveDisplayState,
    "data-state-owner": specimen.label,
    "data-state-reason": binding.scenario.label,
    "data-writable-state": binding.scenario.writableState,
    "data-dominant-action": binding.automation.dominantActionMarkerRef,
    "data-anchor-id": binding.automation.selectedAnchorMarkerRef,
    "data-anchor-state": binding.scenario.bindingState,
    "data-artifact-stage": "artifact.primary",
    "data-artifact-mode": binding.scenario.artifactModeState,
    "data-transfer-state": binding.scenario.artifactPosture,
    "data-continuity-key": binding.automation.continuityMarkerRef,
    "data-return-anchor": binding.automation.selectedAnchorMarkerRef,
    "data-accessibility-coverage-state": binding.accessibility.coverageState,
    "data-semantic-surface": binding.accessibility.semanticSurfaceRefs[0] ?? "semantic_surface.unknown",
    "data-keyboard-model":
      binding.accessibility.keyboardInteractionContractRefs[0] ?? "KIC_UNKNOWN",
    "data-focus-transition-scope":
      binding.accessibility.focusTransitionContractRefs[0] ?? "FTC_UNKNOWN",
    "data-live-announce-state": binding.scenario.ariaLiveMode,
  };
}

export function ShellFrame({
  binding,
  specimen,
  headline,
  summary,
  dominantActionLabel,
  promotedSupportRegion,
  children,
}: {
  binding: ResolvedPrimitiveRouteBinding;
  specimen: SpecimenComposition;
  headline: string;
  summary: string;
  dominantActionLabel: string;
  promotedSupportRegion: string;
  children: ReactNode;
}) {
  const rootDataset = buildRootDataset(specimen, binding);
  const style = {
    "--cp-shell-accent": shellAccentHex(binding.shellType),
    "--cp-tone-ref": `var(--${toneTokenRef(
      binding.scenario.effectiveTone.includes("review")
        ? "review"
        : binding.scenario.effectiveTone.includes("insight")
          ? "insight"
          : binding.scenario.effectiveTone.includes("success")
            ? "success"
            : binding.scenario.effectiveTone.includes("danger")
              ? "danger"
              : "active",
    )})`,
  } as CSSProperties;
  return (
    <section
      {...componentProps({
        componentId: "ShellFrame",
        atlasSectionId: "shell-plane",
        surfaceRoleLabel: "shell-plane",
        className: cx(
          "cp-shell-frame",
          `cp-shell-frame--${binding.shellType}`,
          `cp-shell-frame--${specimen.densityPosture}`,
        ),
        testId: `specimen-root-${specimen.specimenId}`,
      })}
      id={`${binding.routeFamilyRef}-root`}
      data-dom-marker={`${binding.routeFamilyRef}-root`}
      aria-label={`${headline} specimen`}
      aria-live={binding.scenario.ariaLiveMode === "off" ? undefined : binding.scenario.ariaLiveMode}
      style={style}
      {...rootDataset}
    >
      <div className="cp-shell-frame__meta-strip">
        <span data-dom-marker="semantic-surface">{binding.accessibility.semanticSurfaceRefs[0]}</span>
        <span data-dom-marker="keyboard-model">
          {binding.accessibility.keyboardInteractionContractRefs[0]}
        </span>
        <span data-dom-marker="focus-transition-scope">
          {binding.accessibility.focusTransitionContractRefs[0]}
        </span>
        <span data-dom-marker="live-announce-state">{binding.scenario.ariaLiveMode}</span>
        <span data-dom-marker="accessibility-coverage-state">
          {binding.accessibility.coverageState}
        </span>
      </div>
      <header className="cp-shell-frame__masthead">
        <div>
          <span className="cp-kicker">{specimen.routeLabel}</span>
          <h1>{headline}</h1>
          <p>{summary}</p>
        </div>
        <div className="cp-shell-frame__continuity">
          <QuietChip label={binding.bundle.designContractPublicationBundleId} />
          <QuietChip label={dominantActionLabel} tone="active" />
          <QuietChip label={promotedSupportRegion} />
        </div>
      </header>
      {children}
    </section>
  );
}

function renderPatientMissionFrame(binding: ResolvedPrimitiveRouteBinding) {
  const rows = specimenRows("Patient_Mission_Frame");
  return (
    <ShellFrame
      binding={binding}
      specimen={specimenCompositions[0]}
      headline="Patient_Mission_Frame"
      summary="Calm mission entry keeps one primary action, one support pocket, and a limited status strip."
      dominantActionLabel={binding.scenario.dominantActionLabel}
      promotedSupportRegion="Support snapshot"
    >
      <ShellHeader
        eyebrow="Authenticated shell"
        title="Continue with one quiet path"
        summary="The spotlight card is the only amplified region. Support stays tucked into a single evidence pocket."
        chips={["Signal Atlas Live", "Quiet status", "Route-safe"]}
      >
        <CasePulse label="Current mission" value="1" detail="One open request remains in view." />
      </ShellHeader>
      <SharedStatusStrip
        tone="active"
        stateLabel="Ready"
        detail="Today’s request and contact path are stable."
        freshnessLabel="Fresh"
        settlementLabel="Projection seen"
      />
      <div className="cp-specimen-grid cp-specimen-grid--patient">
        <BoardSurface
          eyebrow="Mission board"
          title="Today’s request"
          summary="A single spotlight card leads, followed by limited history and a quiet action row."
        >
          <CardSurface
            eyebrow="Spotlight"
            title="Medication continuation"
            summary="Draft and clinician note remain in sync."
            tone="active"
          >
            <div className="cp-pulse-grid">
              <CasePulse label="Trust" value="Trusted" detail="Contact path verified." />
              <CasePulse label="Freshness" value="2m" detail="No drift detected." tone="insight" />
            </div>
            <DecisionDock
              title="Complete the safe next step"
              summary="The dock keeps one dominant action, one secondary follow-up, and a low-noise utility affordance."
              primaryActionLabel="Continue today’s request"
              secondaryActionLabel="Review appointment note"
              utilityActionLabel="Copy summary"
              dominantMarkerRef={binding.automation.dominantActionMarkerRef}
              selectedAnchorMarkerRef={binding.automation.selectedAnchorMarkerRef}
            />
          </CardSurface>
          <ListSurface
            eyebrow="Request excerpt"
            title="Recent request activity"
            summary="List-first excerpt keeps chronology visible without card repetition."
            rows={rows.listRows ?? []}
          />
        </BoardSurface>
        <PromotedSupportRegionFrame
          eyebrow="Promoted support region"
          title="Support snapshot"
          supportingCopy="One support pocket stays available for continuity and proof."
        >
          <ArtifactSurface
            title="Linked artifact"
            posture="Preview verified"
            metadata={["artifact.primary", binding.scenario.artifactPosture, binding.automation.continuityMarkerRef]}
          >
            <SelectedAnchorStub
              markerRef={binding.automation.selectedAnchorMarkerRef}
              label="Patient home anchor"
              detail="Focus returns to the spotlight card after any support detour."
            />
            <FormSurface
              eyebrow="Contact preference"
              title="Quiet confirmation"
              summary="A small form group demonstrates field and choice contracts without inflating the viewport."
            >
              <InputFieldFrame label="Preferred contact" value="Text message" hint="Editable after review" />
              <CheckboxRadioFrame
                legend="Notification consent"
                kind="checkbox"
                options={["SMS updates", "Email summary"]}
                selectedValues={["SMS updates"]}
              />
            </FormSurface>
          </ArtifactSurface>
        </PromotedSupportRegionFrame>
      </div>
    </ShellFrame>
  );
}

function renderWorkspaceQuietMissionControl(binding: ResolvedPrimitiveRouteBinding) {
  const rows = specimenRows("Workspace_Quiet_Mission_Control");
  return (
    <ShellFrame
      binding={binding}
      specimen={specimenCompositions[1]}
      headline="Workspace_Quiet_Mission_Control"
      summary="Queue spine, active task, preview pocket, and interruption digest all stay inside one continuity envelope."
      dominantActionLabel={binding.scenario.dominantActionLabel}
      promotedSupportRegion="Preview pocket"
    >
      <div className="cp-specimen-grid cp-specimen-grid--workspace">
        <ShellRail
          title="Queue spine"
          items={[
            { title: "Priority review", detail: "3 cases ready" },
            { title: "Anchor-safe replay", detail: "1 paused pocket" },
            { title: "Interruption digest", detail: "2 quiet notices" },
          ]}
          footer={
            <>
              <SegmentedTabs items={["My queue", "Team queue", "Later"]} activeItem="My queue" />
              <div className="cp-pill-row">
                <FilterPill label="Urgent" count={2} selected />
                <FilterPill label="Review" count={4} />
              </div>
            </>
          }
        />
        <div className="cp-specimen-main">
          <ShellHeader
            eyebrow="Clinical workspace"
            title="Maintain one mission at a time"
            summary="The active task stays centered while the preview pocket remains limited and reversible."
            chips={["Triage", "Buffered replay", "Same shell"]}
          />
          <SharedStatusStrip
            tone="insight"
            stateLabel="Settled pending confirmation"
            detail="Projection is stable while the current offer awaits external follow-through."
            freshnessLabel="Fresh"
            settlementLabel="Awaiting external"
          />
          <TaskSurface
            eyebrow="Active task"
            title="Review callback eligibility"
            summary="Task content differs from boards and cards through a left action rail and tighter sequencing."
            tone="insight"
          >
            <StateBraid
              steps={["Receive", "Review", "Confirm", "Handoff"]}
              activeStep="Review"
              tone="insight"
            />
            <div className="cp-pulse-grid">
              <CasePulse label="Hold" value="14m" detail="Offer remains fenced." />
              <CasePulse label="Context" value="2" detail="Two relevant notes attached." tone="active" />
            </div>
            <DecisionDock
              title="Advance the current review"
              summary="A single primary action remains available while support content stays in the preview pocket."
              primaryActionLabel="Advance active review"
              secondaryActionLabel="Hold current offer"
              utilityActionLabel="Copy callback window"
              dominantMarkerRef={binding.automation.dominantActionMarkerRef}
              selectedAnchorMarkerRef={binding.automation.selectedAnchorMarkerRef}
            />
          </TaskSurface>
          <ListSurface
            eyebrow="Interruption digest"
            title="Limited side signals"
            summary="Side signals remain list-first and do not become a second decision lane."
            rows={rows.listRows ?? []}
          />
        </div>
        <DrawerSurface
          eyebrow="Preview pocket"
          title="Attached patient context"
          summary="The preview pocket is elevated, limited, and safe to dismiss without route drift."
        >
          <SelectedAnchorStub
            markerRef={binding.automation.selectedAnchorMarkerRef}
            label="Staff workspace anchor"
            detail="Return focus to the active task after pocket dismissal."
          />
          <ArtifactSurface
            title="Interruption witness"
            posture="Rules permitted preview"
            metadata={["summary_only", binding.automation.artifactMarkerRef]}
          >
            <PlaceholderArtifactFrame
              title="Buffered patient reply"
              postureLabel="Preview is stable; action remains in the task surface."
              metadata={[binding.scenario.artifactPosture, binding.bundle.designContractDigestRef]}
            />
          </ArtifactSurface>
        </DrawerSurface>
      </div>
    </ShellFrame>
  );
}

function renderOperationsControlRoomPreview(binding: ResolvedPrimitiveRouteBinding) {
  const rows = specimenRows("Operations_Control_Room_Preview");
  const chartData = [
    { label: "Gateway BFF", value: 91, detail: "Summary-only guardrail active" },
    { label: "Projection worker", value: 98, detail: "Stable queue settlement" },
    { label: "Notification worker", value: 94, detail: "Digesting on watch lane" },
    { label: "Preview env reset", value: 88, detail: "Intervention workbench queued" },
  ] as const satisfies readonly VisualizationDatum[];
  return (
    <ShellFrame
      binding={binding}
      specimen={specimenCompositions[2]}
      headline="Operations_Control_Room_Preview"
      summary="North-star status, one health grid, one limited chart with parity fallback, and one intervention workbench."
      dominantActionLabel={binding.scenario.dominantActionLabel}
      promotedSupportRegion="Intervention workbench"
    >
      <ShellHeader
        eyebrow="Operations shell"
        title="Watch the platform without adding another dashboard layer"
        summary="The board stays table-first. Visuals are limited and always fall back to summary plus table."
        chips={["Summary-only", "Watch lane", "Limited chart"]}
      >
        <AmbientStateRibbon
          tone="review"
          label="North-star watch"
          detail="Operations remains review-led and read-only while anomalies settle."
        />
      </ShellHeader>
      <SharedStatusStrip
        tone="review"
        stateLabel="Degraded"
        detail="The route is blocked for live action but summary parity remains intact."
        freshnessLabel="Aging"
        settlementLabel="Summary only"
      />
      <div className="cp-specimen-grid cp-specimen-grid--operations">
        <BoardSurface
          eyebrow="Health board"
          title="Limited availability grid"
          summary="A dense table carries the primary operational details."
          tone="review"
        >
          <TableSurface
            caption="Runtime watch grid"
            summary="Dense grid for runtime watch status."
            columns={["Runtime", "Availability", "Status"]}
            rows={rows.tableRows ?? []}
          />
        </BoardSurface>
        <BoundedVisualizationPanel
          title="Service availability watch"
          summary="Gateway BFF and preview environment reset remain the only watch items below 92%, so the console stays in summary-only review status."
          tableCaption="Availability table fallback"
          data={chartData}
          tone="review"
          testId="operations-visualization"
        />
        <DrawerSurface
          eyebrow="Intervention workbench"
          title="Blocked intervention pocket"
          summary="Workbench stays limited while live action is blocked."
        >
          <ComparisonLedger
            title="Current versus proposed intervention"
            summary="A list-first comparison keeps actions explicit before rollout continues."
            rows={[
              { label: "Scope", current: "Gateway watch only", proposed: "Gateway plus preview reset" },
              { label: "Mode", current: "Summary only", proposed: "Escalated verification" },
              { label: "Owner", current: "Ops watch", proposed: "Runtime control handoff" },
            ]}
          />
          <BlockedStateFrame
            title="Live intervention is blocked"
            body="Artifact status is summary-only and the route binding is blocked, so the workbench cannot promote an action yet."
            recoveryActionLabel="Inspect anomaly summary"
            recoveryActionMarkerRef={binding.automation.dominantActionMarkerRef}
          />
        </DrawerSurface>
      </div>
    </ShellFrame>
  );
}

function renderGovernanceApprovalFrame(binding: ResolvedPrimitiveRouteBinding) {
  const rows = specimenRows("Governance_Approval_Frame");
  return (
    <ShellFrame
      binding={binding}
      specimen={specimenCompositions[3]}
      headline="Governance_Approval_Frame"
      summary="Scope ribbon, change envelope, impact preview, approval stepper, and one evidence rail remain in a quiet review shell."
      dominantActionLabel={binding.scenario.dominantActionLabel}
      promotedSupportRegion="Evidence rail"
    >
      <div className="cp-specimen-grid cp-specimen-grid--governance">
        <ShellRail
          title="Evidence rail"
          items={[
            { title: "Policy witness", detail: "Attached to approval summary" },
            { title: "Change digest", detail: "Scope freeze verified" },
            { title: "Impact fallback", detail: "Table parity available" },
          ]}
          footer={<SelectedAnchorStub markerRef={binding.automation.selectedAnchorMarkerRef} label="Governance anchor" detail="Return to the approval stepper after evidence review." />}
        />
        <div className="cp-specimen-main">
          <ShellHeader
            eyebrow="Governance review"
            title="Hold one change envelope in focus"
            summary="The shell stays read-only and review-led while impact evidence and step state remain explicit."
            chips={["Read-only", "Review tone", "Evidence rail"]}
          />
          <SharedStatusStrip
            tone="review"
            stateLabel="Stale review"
            detail="This shell is read-only and summary-led until fresh evidence arrives."
            freshnessLabel="Aging"
            settlementLabel="Projection seen"
          />
          <CardSurface
            eyebrow="Scope ribbon"
            title="Change envelope"
            summary="One limited envelope holds the proposed release and scope guardrails."
            tone="review"
          >
            <ComparisonLedger
              title="Impact preview"
              summary="Comparison uses row-first semantics so reviewers can scan impact without a chart-first bias."
              rows={[
                { label: "Audience", current: "Operations only", proposed: "Operations plus support" },
                { label: "Risk lane", current: "Standard", proposed: "Review required" },
                { label: "Fallback", current: "Preview", proposed: "Summary only" },
              ]}
            />
          </CardSurface>
          <TaskSurface
            eyebrow="Approval stepper"
            title="Approval progression"
            summary="One action remains available while the shell stays quiet and read-only."
            tone="review"
          >
            <StateBraid
              steps={["Scope", "Impact", "Evidence", "Approve"]}
              activeStep="Evidence"
              tone="review"
            />
            <DecisionDock
              title="Review the approval summary"
              summary="The dominant action remains informational while evidence and step state continue to settle."
              primaryActionLabel="Review approval summary"
              secondaryActionLabel="Open evidence packet"
              utilityActionLabel="Copy digest"
              dominantMarkerRef={binding.automation.dominantActionMarkerRef}
              selectedAnchorMarkerRef={binding.automation.selectedAnchorMarkerRef}
            />
          </TaskSurface>
          <FormSurface
            eyebrow="Approval status"
            title="Review acknowledgement"
            summary="Form controls stay inside the review shell and do not become a second dominant lane."
          >
            <SelectFrame
              label="Review status"
              value="Summary only"
              options={["Summary only", "Preview verified", "Blocked"]}
              state="read_only"
            />
            <TextareaFrame
              label="Reviewer note"
              value="Waiting for fresh evidence snapshot before approval can settle."
              state="read_only"
            />
            <CheckboxRadioFrame
              legend="Acknowledged evidence"
              kind="checkbox"
              options={["Impact table checked", "Summary digest checked"]}
              selectedValues={["Summary digest checked"]}
            />
          </FormSurface>
          <ListSurface
            eyebrow="Evidence lines"
            title="Review notes"
            rows={rows.listRows ?? []}
          />
        </div>
      </div>
    </ShellFrame>
  );
}

export function renderSpecimenComposition(specimenId: SpecimenId) {
  const specimen = requireValue(
    specimenCompositions.find((item) => item.specimenId === specimenId),
    `Unknown specimen ${specimenId}`,
  );
  const binding = resolvePrimitiveRouteBinding(specimen.routeFamilyRef);
  if (specimenId === "Patient_Mission_Frame") {
    return renderPatientMissionFrame(binding);
  }
  if (specimenId === "Workspace_Quiet_Mission_Control") {
    return renderWorkspaceQuietMissionControl(binding);
  }
  if (specimenId === "Operations_Control_Room_Preview") {
    return renderOperationsControlRoomPreview(binding);
  }
  return renderGovernanceApprovalFrame(binding);
}

export function renderAtlasSupplementalShelf() {
  return (
    <div className="cp-atlas-shelf">
      <div className="cp-atlas-shelf__block" data-testid="controls-shelf">
        <SectionHeading
          eyebrow="Control shelf"
          title="Canonical controls"
          summary="Quiet buttons, chips, filters, tabs, and field frames reuse the same token law."
        />
        <div className="cp-control-shelf">
          <QuietPrimaryButton>Primary</QuietPrimaryButton>
          <SecondaryButton>Secondary</SecondaryButton>
          <InlineUtilityButton>Utility</InlineUtilityButton>
          <SegmentedTabs items={["Queue", "Preview", "Notes"]} activeItem="Preview" />
          <div className="cp-chip-row">
            <QuietChip label="Review required" tone="review" />
            <FilterPill label="Fresh only" count={3} selected />
          </div>
          <InputFieldFrame label="Case note" value="Ready for callback review" />
          <TextareaFrame
            label="Limited note"
            value="Component shelf demonstrates form rules parity with the same token bindings."
          />
          <SelectFrame label="Scope" value="Patient" options={["Patient", "Operations", "Governance"]} />
          <CheckboxRadioFrame
            legend="Selection mode"
            kind="radio"
            options={["Safe", "Review", "Blocked"]}
            selectedValues={["Review"]}
          />
        </div>
      </div>
      <div className="cp-atlas-shelf__block" data-testid="state-shelf">
        <SectionHeading
          eyebrow="State shelf"
          title="Calm state transitions"
          summary="Loading, empty, stale, blocked, recovery, and summary states keep quiet structure and explicit semantics."
        />
        <div className="cp-state-shelf">
          <LoadingSkeleton label="Loading queue summary" />
          <EmptyStateFrame
            title="No queued interrupts"
            body="The shelf remains empty and actionable."
            actionLabel="Open next filter"
          />
          <StaleStateFrame
            title="Summary is aging"
            body="Data is still readable but should be reviewed before action."
            freshnessLabel="Aging"
          />
          <BlockedStateFrame
            title="Route is blocked"
            body="A blocked state keeps the next step explicit."
            recoveryActionLabel="Review blocked summary"
          />
          <RecoveryStateFrame
            title="Recovery only"
            body="Resume is available without reopening the broader surface."
            helperText="Return-anchor remains pinned."
          />
          <PlaceholderArtifactFrame
            title="Artifact unavailable"
            postureLabel="Summary only"
            metadata={["handoff_only", "return-anchor::kept"]}
          />
        </div>
      </div>
    </div>
  );
}

export function buildComponentPrimitiveArtifacts() {
  const specimenRouteBindings = specimenCompositions.map((specimen) =>
    resolvePrimitiveRouteBinding(specimen.routeFamilyRef),
  );

  const bindingRows: PrimitiveBindingMatrixRow[] = componentPrimitiveContracts.map((component) => ({
    component_id: component.componentId,
    display_name: component.displayName,
    primitive_family: component.primitiveFamily,
    atlas_section: component.atlasSectionId,
    surface_role: component.surfaceRoleLabel,
    shell_types: component.shellTypes.join("|"),
    route_family_refs: component.routeFamilyRefs.join("|"),
    specimen_ids: component.specimenIds.join("|"),
    token_refs: component.tokenBindings.map((binding) => binding.tokenRef).join("|"),
    kernel_binding_refs: component.kernelBindings.map((binding) => binding.ref).join("|"),
    api_signature: component.apiSignature,
    visualization_parity: component.visualizationParity,
  }));

  const automationRows: PrimitiveAutomationMatrixRow[] = componentPrimitiveContracts.map(
    (component) => {
      const routeBindings = component.routeFamilyRefs.map(resolvePrimitiveRouteBinding);
      return {
        componentId: component.componentId,
        displayName: component.displayName,
        atlasSectionId: component.atlasSectionId,
        routeFamilyRefs: component.routeFamilyRefs,
        dominantActionMarkerRefs: unique(
          routeBindings.map((binding) => binding.automation.dominantActionMarkerRef),
        ),
        selectedAnchorMarkerRefs: unique(
          routeBindings.map((binding) => binding.automation.selectedAnchorMarkerRef),
        ),
        artifactMarkerRefs: unique(
          routeBindings.map((binding) => binding.automation.artifactMarkerRef),
        ),
        continuityMarkerRefs: unique(
          routeBindings.map((binding) => binding.automation.continuityMarkerRef),
        ),
        requiredDomMarkers: unique(
          routeBindings.flatMap((binding) => binding.automation.requiredDomMarkers),
        ),
      };
    },
  );

  const automationArtifact = {
    task_id: COMPONENT_PRIMITIVES_TASK_ID,
    visual_mode: COMPONENT_PRIMITIVES_VISUAL_MODE,
    summary: {
      component_count: componentPrimitiveContracts.length,
      route_family_count: unique(
        componentPrimitiveContracts.flatMap((component) => component.routeFamilyRefs),
      ).length,
      dominant_action_marker_count: unique(
        automationRows.flatMap((row) => row.dominantActionMarkerRefs),
      ).length,
      selected_anchor_marker_count: unique(
        automationRows.flatMap((row) => row.selectedAnchorMarkerRefs),
      ).length,
    },
    componentAutomationAnchors: automationRows,
    source_refs: COMPONENT_PRIMITIVES_SOURCE_PRECEDENCE,
  } as const;

  const accessibilityRows: PrimitiveAccessibilityMatrixRow[] = componentPrimitiveContracts.map(
    (component) => ({
      component_id: component.componentId,
      display_name: component.displayName,
      shell_types: component.shellTypes.join("|"),
      route_family_refs: component.routeFamilyRefs.join("|"),
      coverage_states: unique(
        component.accessibility.routeCoverage.map((row) => row.coverageState),
      ).join("|"),
      reduced_motion_refs: unique(
        component.accessibility.routeCoverage.map(
          (row) => row.reducedMotionEquivalenceRef,
        ),
      ).join("|"),
      high_contrast_ref: unique(
        component.accessibility.routeCoverage.map((row) => row.highContrastEquivalenceRef),
      ).join("|"),
      semantic_surface_refs: unique(
        component.accessibility.routeCoverage.flatMap((row) => row.semanticSurfaceRefs),
      ).join("|"),
      keyboard_contract_refs: unique(
        component.accessibility.routeCoverage.flatMap(
          (row) => row.keyboardInteractionContractRefs,
        ),
      ).join("|"),
      focus_contract_refs: unique(
        component.accessibility.routeCoverage.flatMap(
          (row) => row.focusTransitionContractRefs,
        ),
      ).join("|"),
      visualization_fallback_refs: unique(
        component.accessibility.routeCoverage.flatMap(
          (row) => row.visualizationFallbackContractRefs,
        ),
      ).join("|"),
      visualization_table_refs: unique(
        component.accessibility.routeCoverage.flatMap(
          (row) => row.visualizationTableContractRefs,
        ),
      ).join("|"),
    }),
  );

  const publication = {
    task_id: COMPONENT_PRIMITIVES_TASK_ID,
    visual_mode: COMPONENT_PRIMITIVES_VISUAL_MODE,
    summary: {
      component_count: componentPrimitiveContracts.length,
      specimen_count: specimenCompositions.length,
      surface_role_count: componentAtlasSections.length,
      shell_profile_count: shellProfileLenses.length,
      route_binding_count: specimenRouteBindings.length,
      exact_route_binding_count: specimenRouteBindings.filter(
        (binding) => binding.scenario.bindingState === "exact",
      ).length,
      blocked_route_binding_count: specimenRouteBindings.filter(
        (binding) => binding.scenario.bindingState === "blocked",
      ).length,
      degraded_accessibility_route_count: specimenRouteBindings.filter(
        (binding) => binding.accessibility.coverageState === "degraded",
      ).length,
      gap_resolution_count: COMPONENT_GAP_RESOLUTIONS.length,
      follow_on_dependency_count: COMPONENT_FOLLOW_ON_DEPENDENCIES.length,
    },
    componentContracts: componentPrimitiveContracts,
    specimenCompositions,
    shellProfileLenses: shellProfileLenses,
    gap_resolutions: COMPONENT_GAP_RESOLUTIONS,
    follow_on_dependencies: COMPONENT_FOLLOW_ON_DEPENDENCIES,
    source_refs: COMPONENT_PRIMITIVES_SOURCE_PRECEDENCE,
  } satisfies ComponentPrimitivePublicationArtifact;

  return {
    publication,
    bindingRows,
    automationArtifact,
    accessibilityRows,
  };
}
