export type ThemeMode = "light" | "dark";
export type ContrastMode = "standard" | "high";
export type DensityMode = "relaxed" | "balanced" | "compact";
export type MotionMode = "full" | "reduced" | "essential_only";
export type ShellType =
  | "patient"
  | "staff"
  | "hub"
  | "support"
  | "pharmacy"
  | "operations"
  | "governance"
  | "embedded";

export interface ModeTuple {
  theme: ThemeMode;
  contrast: ContrastMode;
  density: DensityMode;
  motion: MotionMode;
}

export interface ColorValue {
  hex: string;
  oklch: string;
}

export interface PrimitiveToken {
  tokenId: string;
  label: string;
  valueType:
    | "color"
    | "dimension"
    | "string"
    | "number"
    | "range"
    | "typography"
    | "motion"
    | "formula";
  value?: string | number | readonly string[];
  modeValues?: Record<string, ColorValue | string | number>;
  notes?: string;
}

export interface PrimitiveTokenGroup {
  groupId: string;
  label: string;
  tokens: readonly PrimitiveToken[];
}

export interface AliasToken {
  tokenId: string;
  label: string;
  aliasOf: readonly string[];
  valueType: "color" | "dimension" | "typography" | "motion" | "formula";
  modeValues?: Record<string, ColorValue | string | number>;
  notes?: string;
}

export interface ProfileToken {
  tokenId: string;
  shellType: ShellType;
  label: string;
  quietPosture: string;
  accentRole: "active" | "review" | "insight" | "success" | "danger";
  defaultDensityMode: DensityMode;
  defaultMotionMode: MotionMode;
  allowedTopologyMetricRefs: readonly string[];
  allowedSurfaceRoleRefs: readonly string[];
  notes: string;
}

export interface ProfileSelectionResolution {
  profileSelectionResolutionId: string;
  designTokenExportArtifactRef: string;
  tokenKernelLayeringPolicyRef: string;
  profileTokenRef: string;
  shellType: ShellType;
  routeClassRef: string;
  breakpointCoverageRefs: readonly string[];
  densityModeRefs: readonly DensityMode[];
  motionModeRefs: readonly MotionMode[];
  allowedTopologyMetricRefs: readonly string[];
  allowedSurfaceRoleRefs: readonly string[];
  semanticColorProfileRef: string;
  selectionDigestRef: string;
  effectiveAt: string;
}

export interface ContrastMatrixRow {
  contrast_matrix_id: string;
  theme: ThemeMode;
  contrast: ContrastMode;
  semantic_role: string;
  foreground_token: string;
  background_token: string;
  foreground_hex: string;
  background_hex: string;
  contrast_ratio: string;
  minimum_ratio: string;
  status: "pass" | "fail";
}

export interface ModeCoverageRow {
  mode_tuple_id: string;
  theme: ThemeMode;
  contrast: ContrastMode;
  density: DensityMode;
  motion: MotionMode;
  breakpoint_coverage: string;
  profile_coverage: string;
  status: "supported";
  digest_ref: string;
}

interface SeedPalette {
  surfaceCanvas: string;
  surfaceShell: string;
  surfacePanel: string;
  surfaceInset: string;
  surfaceOverlay: string;
  textStrong: string;
  textDefault: string;
  textMuted: string;
  borderSubtle: string;
  borderDefault: string;
  accentActive: string;
  accentReview: string;
  accentInsight: string;
  accentSuccess: string;
  accentDanger: string;
}

const GENERATED_AT = "2026-04-13T16:20:00+00:00";
const CAPTURED_ON = "2026-04-13";

export const DESIGN_TOKEN_FOUNDATION_TASK_ID = "par_103";
export const DESIGN_TOKEN_FOUNDATION_VISUAL_MODE = "Design_Token_Specimen";
export const DESIGN_TOKEN_FOUNDATION_REF = "DTF_SIGNAL_ATLAS_LIVE_QUIET_CLARITY_V1";
export const TOKEN_KERNEL_LAYERING_POLICY_ID = "TKLP_SIGNAL_ATLAS_LIVE_V1";
export const DESIGN_TOKEN_EXPORT_ARTIFACT_ID = "DTEA_SIGNAL_ATLAS_LIVE_CANONICAL_V1";
export const MODE_TUPLE_COVERAGE_REF = "MTC_SIGNAL_ATLAS_LIVE_ALL_MODES_V1";

export const DESIGN_TOKEN_SOURCE_PRECEDENCE = [
  "prompt/103.md",
  "prompt/shared_operating_contract_096_to_105.md",
  "prompt/AGENT.md",
  "prompt/checklist.md",
  "blueprint/design-token-foundation.md#Token architecture and inheritance",
  "blueprint/design-token-foundation.md#Machine-readable export contract",
  "blueprint/design-token-foundation.md#Modes",
  "blueprint/design-token-foundation.md#Breakpoints and layout lattice",
  "blueprint/design-token-foundation.md#Typography",
  "blueprint/design-token-foundation.md#Sizing and density",
  "blueprint/design-token-foundation.md#Radius and elevation",
  "blueprint/design-token-foundation.md#Color, contrast, and semantic state",
  "blueprint/design-token-foundation.md#Motion",
  "blueprint/design-token-foundation.md#Shell profiles",
  "blueprint/platform-frontend-blueprint.md#0.1A Canonical design-token and visual-language foundation",
  "blueprint/platform-frontend-blueprint.md#7. Canonical motion, accessibility, and verification system",
  "blueprint/platform-frontend-blueprint.md#7.8 Verification and Playwright contract",
  "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
  "blueprint/canonical-ui-contract-kernel.md#1. Token lattice",
  "blueprint/canonical-ui-contract-kernel.md#3. Semantic color roles and trust or freshness posture",
  "blueprint/ux-quiet-clarity-redesign.md#Redesign concept",
  "blueprint/ux-quiet-clarity-redesign.md#Patient-shell quantitative quiet budget",
  "blueprint/accessibility-and-content-system-contract.md#Token and verification rules",
  "blueprint/forensic-audit-findings.md#Finding 86",
  "blueprint/forensic-audit-findings.md#Finding 103",
  "blueprint/forensic-audit-findings.md#Finding 118",
  "blueprint/forensic-audit-findings.md#Finding 120",
  "data/analysis/frontend_contract_manifests.json",
  "data/analysis/design_contract_publication_bundles.json",
  "data/analysis/runtime_publication_bundles.json",
] as const;

const BREAKPOINTS = [
  { tokenId: "ref.breakpoint.xs", label: "xs", value: "320-479", columns: 4, gutter: "16px" },
  { tokenId: "ref.breakpoint.sm", label: "sm", value: "480-767", columns: 4, gutter: "16px" },
  { tokenId: "ref.breakpoint.md", label: "md", value: "768-1023", columns: 8, gutter: "24px" },
  { tokenId: "ref.breakpoint.lg", label: "lg", value: "1024-1439", columns: 12, gutter: "24px" },
  { tokenId: "ref.breakpoint.xl", label: "xl", value: "1440-1919", columns: 16, gutter: "32px" },
  { tokenId: "ref.breakpoint.2xl", label: "2xl", value: "1920+", columns: 16, gutter: "32px" },
] as const;

const SPACE_SCALE = [0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 128] as const;
const TONE_LADDER = [98, 96, 92, 88, 80, 72, 64, 52, 40, 28, 20, 12] as const;
const THEME_MODES = ["light", "dark"] as const satisfies readonly ThemeMode[];
const CONTRAST_MODES = ["standard", "high"] as const satisfies readonly ContrastMode[];
const DENSITY_MODES = ["relaxed", "balanced", "compact"] as const satisfies readonly DensityMode[];
const MOTION_MODES = [
  "full",
  "reduced",
  "essential_only",
] as const satisfies readonly MotionMode[];

const PROFILE_CONFIG = [
  {
    profileSelectionResolutionId: "PSR_050_PATIENT_V1",
    profileTokenRef: "profile.patient.signal_atlas_live",
    shellType: "patient" as const,
    label: "Patient portal",
    routeClassRef: "shell.patient.portal",
    quietPosture: "single dominant task, recovery-safe shell, low promotion ceiling",
    accentRole: "active" as const,
    defaultDensityMode: "relaxed" as const,
    defaultMotionMode: "reduced" as const,
    densityModeRefs: ["relaxed", "balanced"] as const,
    motionModeRefs: ["full", "reduced", "essential_only"] as const,
    allowedTopologyMetricRefs: ["topology.focus_frame", "topology.mission_stack", "topology.support.peek"] as const,
    allowedSurfaceRoleRefs: ["surface.portal", "surface.intake", "surface.recovery"] as const,
    semanticColorProfileRef: "SCP_103_PATIENT_CLARITY_V1",
    notes: "Public and authenticated patient work stays calm-first and never borrows staff density defaults.",
  },
  {
    profileSelectionResolutionId: "PSR_050_STAFF_V1",
    profileTokenRef: "profile.workspace.quiet_clinical",
    shellType: "staff" as const,
    label: "Clinical workspace",
    routeClassRef: "shell.workspace.mission",
    quietPosture: "two-plane review space with one promoted support lane",
    accentRole: "insight" as const,
    defaultDensityMode: "balanced" as const,
    defaultMotionMode: "reduced" as const,
    densityModeRefs: ["relaxed", "balanced", "compact"] as const,
    motionModeRefs: ["full", "reduced", "essential_only"] as const,
    allowedTopologyMetricRefs: ["topology.two_plane", "topology.mission_stack", "topology.support.open"] as const,
    allowedSurfaceRoleRefs: ["surface.workspace", "surface.queue", "surface.assistive"] as const,
    semanticColorProfileRef: "SCP_103_WORKSPACE_QUIET_MISSION_V1",
    notes: "Dense review is legal only through topology and disclosure, not type shrink or shell-local spacing.",
  },
  {
    profileSelectionResolutionId: "PSR_050_HUB_V1",
    profileTokenRef: "profile.hub.coordination",
    shellType: "hub" as const,
    label: "Hub desk",
    routeClassRef: "shell.hub.coordination",
    quietPosture: "coordination-first queue and case overview",
    accentRole: "insight" as const,
    defaultDensityMode: "balanced" as const,
    defaultMotionMode: "reduced" as const,
    densityModeRefs: ["balanced", "compact"] as const,
    motionModeRefs: ["full", "reduced", "essential_only"] as const,
    allowedTopologyMetricRefs: ["topology.two_plane", "topology.focus_frame", "topology.support.peek"] as const,
    allowedSurfaceRoleRefs: ["surface.queue", "surface.case", "surface.coordination"] as const,
    semanticColorProfileRef: "SCP_103_HUB_COORDINATION_V1",
    notes: "Hub work stays list-first and anchor-preserving across queue churn and scheduling deltas.",
  },
  {
    profileSelectionResolutionId: "PSR_050_SUPPORT_V1",
    profileTokenRef: "profile.support.quiet_service",
    shellType: "support" as const,
    label: "Support workspace",
    routeClassRef: "shell.support.ticketing",
    quietPosture: "advisory workspace with replay-aware side-stage posture",
    accentRole: "review" as const,
    defaultDensityMode: "balanced" as const,
    defaultMotionMode: "reduced" as const,
    densityModeRefs: ["balanced", "compact"] as const,
    motionModeRefs: ["full", "reduced", "essential_only"] as const,
    allowedTopologyMetricRefs: ["topology.two_plane", "topology.three_plane", "topology.support.open"] as const,
    allowedSurfaceRoleRefs: ["surface.ticket", "surface.replay", "surface.advisory"] as const,
    semanticColorProfileRef: "SCP_103_SUPPORT_SERVICE_V1",
    notes: "Replay and evidence lanes may promote, but the shell still keeps one dominant action locus.",
  },
  {
    profileSelectionResolutionId: "PSR_050_PHARMACY_V1",
    profileTokenRef: "profile.pharmacy.console",
    shellType: "pharmacy" as const,
    label: "Pharmacy console",
    routeClassRef: "shell.pharmacy.console",
    quietPosture: "verification and fulfilment console with explicit trust cues",
    accentRole: "success" as const,
    defaultDensityMode: "balanced" as const,
    defaultMotionMode: "reduced" as const,
    densityModeRefs: ["balanced", "compact"] as const,
    motionModeRefs: ["full", "reduced", "essential_only"] as const,
    allowedTopologyMetricRefs: ["topology.two_plane", "topology.focus_frame", "topology.support.peek"] as const,
    allowedSurfaceRoleRefs: ["surface.console", "surface.dispense", "surface.reconciliation"] as const,
    semanticColorProfileRef: "SCP_103_PHARMACY_SIGNAL_V1",
    notes: "The pharmacy surface uses success sparingly and never while downstream review or dispatch uncertainty remains.",
  },
  {
    profileSelectionResolutionId: "PSR_050_OPERATIONS_V1",
    profileTokenRef: "profile.operations.command_surface",
    shellType: "operations" as const,
    label: "Operations console",
    routeClassRef: "shell.operations.board",
    quietPosture: "control-room board with dense-data allowance for non-editable telemetry",
    accentRole: "danger" as const,
    defaultDensityMode: "compact" as const,
    defaultMotionMode: "reduced" as const,
    densityModeRefs: ["balanced", "compact"] as const,
    motionModeRefs: ["full", "reduced", "essential_only"] as const,
    allowedTopologyMetricRefs: ["topology.three_plane", "topology.dense_data", "topology.support.open"] as const,
    allowedSurfaceRoleRefs: ["surface.board", "surface.drilldown", "surface.health"] as const,
    semanticColorProfileRef: "SCP_103_OPERATIONS_WATCH_V1",
    notes: "Operations can compress passive telemetry, but editable controls still hold the canonical hit-target floors.",
  },
  {
    profileSelectionResolutionId: "PSR_050_GOVERNANCE_V1",
    profileTokenRef: "profile.governance.approval_surface",
    shellType: "governance" as const,
    label: "Governance admin",
    routeClassRef: "shell.governance.admin",
    quietPosture: "approval, evidence, and scope review stay in one shell without artifact drift",
    accentRole: "insight" as const,
    defaultDensityMode: "balanced" as const,
    defaultMotionMode: "reduced" as const,
    densityModeRefs: ["balanced", "compact"] as const,
    motionModeRefs: ["full", "reduced", "essential_only"] as const,
    allowedTopologyMetricRefs: ["topology.two_plane", "topology.three_plane", "topology.scope_ribbon"] as const,
    allowedSurfaceRoleRefs: ["surface.scope", "surface.approval", "surface.evidence"] as const,
    semanticColorProfileRef: "SCP_103_GOVERNANCE_SCOPE_V1",
    notes: "Governance surfaces show impact and evidence as support regions rather than detached mini-products.",
  },
  {
    profileSelectionResolutionId: "PSR_103_EMBEDDED_COMPANION_V1",
    profileTokenRef: "profile.embedded.companion",
    shellType: "embedded" as const,
    label: "Embedded companion",
    routeClassRef: "shell.embedded.companion",
    quietPosture: "constrained shell with safe-area resilience and same-anchor recovery",
    accentRole: "active" as const,
    defaultDensityMode: "balanced" as const,
    defaultMotionMode: "essential_only" as const,
    densityModeRefs: ["balanced"] as const,
    motionModeRefs: ["reduced", "essential_only"] as const,
    allowedTopologyMetricRefs: ["topology.focus_frame", "topology.mission_stack", "topology.embedded.safe_area"] as const,
    allowedSurfaceRoleRefs: ["surface.companion", "surface.safe_area", "surface.handoff"] as const,
    semanticColorProfileRef: "SCP_103_EMBEDDED_CHANNEL_V1",
    notes: "Embedded posture favors static equivalents, constrained chrome, and explicit handoff-safe states.",
  },
] as const;

const COLOR_SEEDS: Record<ThemeMode, Record<ContrastMode, SeedPalette>> = {
  light: {
    standard: {
      surfaceCanvas: "#F7F8FA",
      surfaceShell: "#EEF2F6",
      surfacePanel: "#FFFFFF",
      surfaceInset: "#E8EEF3",
      surfaceOverlay: "rgba(10, 18, 28, 0.36)",
      textStrong: "#0F1720",
      textDefault: "#24313D",
      textMuted: "#5E6B78",
      borderSubtle: "#D6DEE6",
      borderDefault: "#C2CDD8",
      accentActive: "#2F6FED",
      accentReview: "#B7791F",
      accentInsight: "#5B61F6",
      accentSuccess: "#117A55",
      accentDanger: "#B42318",
    },
    high: {
      surfaceCanvas: "#F5F7FA",
      surfaceShell: "#EAF0F5",
      surfacePanel: "#FFFFFF",
      surfaceInset: "#E2EAF1",
      surfaceOverlay: "rgba(10, 18, 28, 0.46)",
      textStrong: "#091118",
      textDefault: "#13202B",
      textMuted: "#384552",
      borderSubtle: "#95A8BA",
      borderDefault: "#617A91",
      accentActive: "#1455D9",
      accentReview: "#8C560E",
      accentInsight: "#454CEE",
      accentSuccess: "#0A6847",
      accentDanger: "#981B13",
    },
  },
  dark: {
    standard: {
      surfaceCanvas: "#0D141B",
      surfaceShell: "#111C24",
      surfacePanel: "#162430",
      surfaceInset: "#0F1821",
      surfaceOverlay: "rgba(3, 7, 12, 0.62)",
      textStrong: "#F5F7FA",
      textDefault: "#D6DEE6",
      textMuted: "#9FB0C1",
      borderSubtle: "#273848",
      borderDefault: "#355066",
      accentActive: "#78A7FF",
      accentReview: "#E0A94A",
      accentInsight: "#9A9BFF",
      accentSuccess: "#3DB98B",
      accentDanger: "#F06A62",
    },
    high: {
      surfaceCanvas: "#091018",
      surfaceShell: "#0D1720",
      surfacePanel: "#12202B",
      surfaceInset: "#0B141C",
      surfaceOverlay: "rgba(2, 5, 9, 0.76)",
      textStrong: "#FCFDFF",
      textDefault: "#EEF3F8",
      textMuted: "#CAD6E2",
      borderSubtle: "#536A7F",
      borderDefault: "#7D9CB7",
      accentActive: "#9ABCFF",
      accentReview: "#F2BF61",
      accentInsight: "#BBB8FF",
      accentSuccess: "#62D1A6",
      accentDanger: "#FF8B84",
    },
  },
};

function shortHash(value: string): string {
  let h1 = 0xdeadbeef ^ value.length;
  let h2 = 0x41c6ce57 ^ value.length;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    ((h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0")).slice(
      0,
      16,
    )
  );
}

function channelFromHex(channel: string): number {
  return Number.parseInt(channel, 16);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: channelFromHex(normalized.slice(0, 2)),
    g: channelFromHex(normalized.slice(2, 4)),
    b: channelFromHex(normalized.slice(4, 6)),
  };
}

function rgbToHex(red: number, green: number, blue: number): string {
  const toHex = (value: number) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0");
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function blendHex(foreground: string, background: string, weight: number): string {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  const ratio = Math.max(0, Math.min(1, weight));
  return rgbToHex(
    fg.r * ratio + bg.r * (1 - ratio),
    fg.g * ratio + bg.g * (1 - ratio),
    fg.b * ratio + bg.b * (1 - ratio),
  );
}

function srgbChannelToLinear(value: number): number {
  const scaled = value / 255;
  if (scaled <= 0.04045) {
    return scaled / 12.92;
  }
  return ((scaled + 0.055) / 1.055) ** 2.4;
}

function hexToOklch(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const lr = srgbChannelToLinear(r);
  const lg = srgbChannelToLinear(g);
  const lb = srgbChannelToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const lightness = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const bAxis = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;

  const chroma = Math.sqrt(a * a + bAxis * bAxis);
  const hue = ((Math.atan2(bAxis, a) * 180) / Math.PI + 360) % 360;

  return `oklch(${(lightness * 100).toFixed(2)}% ${chroma.toFixed(4)} ${hue.toFixed(2)})`;
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const red = srgbChannelToLinear(r);
  const green = srgbChannelToLinear(g);
  const blue = srgbChannelToLinear(b);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground: string, background: string): number {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function themeContrastKey(theme: ThemeMode, contrast: ContrastMode): string {
  return `${theme}_${contrast}`;
}

function modeTupleId(modeTuple: ModeTuple): string {
  return `MODE_${modeTuple.theme.toUpperCase()}_${modeTuple.contrast.toUpperCase()}_${modeTuple.density.toUpperCase()}_${modeTuple.motion.toUpperCase()}`;
}

function px(value: number): string {
  return `${value}px`;
}

function colorValue(hex: string): ColorValue {
  return { hex, oklch: hexToOklch(hex) };
}

function getRecordValue<T>(record: Record<string, T>, key: string): T {
  return record[key]!;
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildMotionValues(motion: MotionMode) {
  if (motion === "essential_only") {
    return {
      durationAttention: "0ms",
      durationReveal: "0ms",
      durationSettle: "0ms",
      durationOverlay: "0ms",
      translateDistance: "0px",
      opacityDelta: "0",
      scaleFrom: "1",
      motionProfileState: "static_only",
    };
  }
  if (motion === "reduced") {
    return {
      durationAttention: "120ms",
      durationReveal: "180ms",
      durationSettle: "240ms",
      durationOverlay: "320ms",
      translateDistance: "4px",
      opacityDelta: "0.08",
      scaleFrom: "1",
      motionProfileState: "reduced",
    };
  }
  return {
    durationAttention: "120ms",
    durationReveal: "180ms",
    durationSettle: "240ms",
    durationOverlay: "320ms",
    translateDistance: "8px",
    opacityDelta: "0.14",
    scaleFrom: "0.98",
    motionProfileState: "full",
  };
}

function buildDensityValues(density: DensityMode) {
  const step = { relaxed: -1, balanced: 0, compact: 1 }[density];
  return {
    controlHeightPublic: px(Math.max(44, 48 - 4 * step)),
    controlHeightProfessional: px(Math.max(40, 44 - 4 * step)),
    passiveRowHeight: px(density === "compact" ? 36 : density === "relaxed" ? 44 : 40),
    padInline: px(Math.max(12, 16 - 4 * step)),
    padBlock: px(Math.max(8, 12 - 2 * step)),
    densityStep: String(step),
  };
}

function buildRoleContainer(accentHex: string, theme: ThemeMode, panelHex: string, contrast: ContrastMode) {
  const blendWeight = theme === "light" ? (contrast === "high" ? 0.16 : 0.1) : contrast === "high" ? 0.32 : 0.24;
  return blendHex(accentHex, panelHex, blendWeight);
}

function buildResolvedPalette(theme: ThemeMode, contrast: ContrastMode) {
  const seeds = COLOR_SEEDS[theme][contrast];
  const neutralBorder = contrast === "high"
    ? blendHex(seeds.textDefault, seeds.surfacePanel, theme === "light" ? 0.58 : 0.76)
    : blendHex(seeds.textDefault, seeds.surfacePanel, theme === "light" ? 0.62 : 0.68);

  const accentMap = {
    active: seeds.accentActive,
    review: seeds.accentReview,
    insight: seeds.accentInsight,
    success: seeds.accentSuccess,
    danger: seeds.accentDanger,
  } as const;

  return {
    surfaceCanvas: colorValue(seeds.surfaceCanvas),
    surfaceShell: colorValue(seeds.surfaceShell),
    surfacePanel: colorValue(seeds.surfacePanel),
    surfaceInset: colorValue(seeds.surfaceInset),
    surfaceOverlay: seeds.surfaceOverlay,
    textStrong: colorValue(seeds.textStrong),
    textDefault: colorValue(seeds.textDefault),
    textMuted: colorValue(seeds.textMuted),
    borderSubtle: colorValue(seeds.borderSubtle),
    borderDefault: colorValue(seeds.borderDefault),
    borderStrong: colorValue(neutralBorder),
    focusRing: colorValue(seeds.accentActive),
    neutralContainer: colorValue(seeds.surfaceInset),
    neutralBorder: colorValue(neutralBorder),
    state: {
      neutral: {
        container: colorValue(seeds.surfaceInset),
        border: colorValue(neutralBorder),
        text: colorValue(seeds.textStrong),
        accent: colorValue(neutralBorder),
      },
      active: {
        container: colorValue(buildRoleContainer(accentMap.active, theme, seeds.surfacePanel, contrast)),
        border: colorValue(accentMap.active),
        text: colorValue(seeds.textStrong),
        accent: colorValue(accentMap.active),
      },
      review: {
        container: colorValue(buildRoleContainer(accentMap.review, theme, seeds.surfacePanel, contrast)),
        border: colorValue(accentMap.review),
        text: colorValue(seeds.textStrong),
        accent: colorValue(accentMap.review),
      },
      insight: {
        container: colorValue(buildRoleContainer(accentMap.insight, theme, seeds.surfacePanel, contrast)),
        border: colorValue(accentMap.insight),
        text: colorValue(seeds.textStrong),
        accent: colorValue(accentMap.insight),
      },
      success: {
        container: colorValue(buildRoleContainer(accentMap.success, theme, seeds.surfacePanel, contrast)),
        border: colorValue(accentMap.success),
        text: colorValue(seeds.textStrong),
        accent: colorValue(accentMap.success),
      },
      danger: {
        container: colorValue(buildRoleContainer(accentMap.danger, theme, seeds.surfacePanel, contrast)),
        border: colorValue(accentMap.danger),
        text: colorValue(seeds.textStrong),
        accent: colorValue(accentMap.danger),
      },
    },
  };
}

export function resolveModeTokens(modeTuple: ModeTuple) {
  const palette = buildResolvedPalette(modeTuple.theme, modeTuple.contrast);
  const density = buildDensityValues(modeTuple.density);
  const motion = buildMotionValues(modeTuple.motion);
  return {
    palette,
    density,
    motion,
    breakpointClassRefs: ["xs", "sm", "md", "lg", "xl", "2xl"],
  };
}

function buildPrimitiveGroups(): readonly PrimitiveTokenGroup[] {
  const colorModeValues = Object.fromEntries(
    THEME_MODES.flatMap((theme) =>
      CONTRAST_MODES.flatMap((contrast) => {
        const key = themeContrastKey(theme, contrast);
        const palette = buildResolvedPalette(theme, contrast);
        return [
          [key, colorValue(COLOR_SEEDS[theme][contrast].surfaceCanvas)],
          [`${key}_shell`, colorValue(COLOR_SEEDS[theme][contrast].surfaceShell)],
          [`${key}_panel`, colorValue(COLOR_SEEDS[theme][contrast].surfacePanel)],
          [`${key}_inset`, colorValue(COLOR_SEEDS[theme][contrast].surfaceInset)],
          [`${key}_textStrong`, palette.textStrong],
          [`${key}_textDefault`, palette.textDefault],
          [`${key}_textMuted`, palette.textMuted],
          [`${key}_borderSubtle`, palette.borderSubtle],
          [`${key}_borderDefault`, palette.borderDefault],
          [`${key}_accentActive`, colorValue(COLOR_SEEDS[theme][contrast].accentActive)],
          [`${key}_accentReview`, colorValue(COLOR_SEEDS[theme][contrast].accentReview)],
          [`${key}_accentInsight`, colorValue(COLOR_SEEDS[theme][contrast].accentInsight)],
          [`${key}_accentSuccess`, colorValue(COLOR_SEEDS[theme][contrast].accentSuccess)],
          [`${key}_accentDanger`, colorValue(COLOR_SEEDS[theme][contrast].accentDanger)],
        ];
      }),
    ),
  ) as Record<string, ColorValue>;

  return [
    {
      groupId: "ref.grid",
      label: "Mathematical base and reading measure",
      tokens: [
        { tokenId: "ref.grid.atomic", label: "Atomic quantum", valueType: "dimension", value: "4px" },
        { tokenId: "ref.grid.structural", label: "Structural quantum", valueType: "dimension", value: "8px" },
        {
          tokenId: "ref.measure.reading",
          label: "Reading measure",
          valueType: "range",
          value: ["60ch", "72ch"],
        },
        {
          tokenId: "ref.measure.task",
          label: "Task copy measure",
          valueType: "range",
          value: ["36ch", "56ch"],
        },
      ],
    },
    {
      groupId: "ref.breakpoint",
      label: "Breakpoint lattice",
      tokens: BREAKPOINTS.map((breakpoint) => ({
        tokenId: breakpoint.tokenId,
        label: `${breakpoint.label} band`,
        valueType: "string",
        value: `${breakpoint.value} / ${breakpoint.columns} cols / ${breakpoint.gutter} gutters`,
      })),
    },
    {
      groupId: "ref.space",
      label: "Space ramp",
      tokens: SPACE_SCALE.map((value) => ({
        tokenId: `ref.space.${value}`,
        label: `Space ${value}`,
        valueType: "dimension",
        value: px(value),
      })),
    },
    {
      groupId: "ref.type",
      label: "Typography roles",
      tokens: [
        {
          tokenId: "ref.type.font.sans",
          label: "Sans stack",
          valueType: "string",
          value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        {
          tokenId: "ref.type.font.mono",
          label: "Mono stack",
          valueType: "string",
          value: 'ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace',
        },
        {
          tokenId: "ref.type.role.display",
          label: "Display",
          valueType: "typography",
          value: "40 / 48 / 600 / -0.01em",
        },
        {
          tokenId: "ref.type.role.headline",
          label: "Headline",
          valueType: "typography",
          value: "32 / 40 / 600 / -0.01em",
        },
        {
          tokenId: "ref.type.role.title",
          label: "Title",
          valueType: "typography",
          value: "24 / 32 / 600 / -0.005em",
        },
        {
          tokenId: "ref.type.role.section",
          label: "Section",
          valueType: "typography",
          value: "20 / 28 / 600 / 0",
        },
        {
          tokenId: "ref.type.role.body.lg",
          label: "Body large",
          valueType: "typography",
          value: "18 / 28 / 400 / 0",
        },
        {
          tokenId: "ref.type.role.body",
          label: "Body",
          valueType: "typography",
          value: "16 / 24 / 400 / 0",
        },
        {
          tokenId: "ref.type.role.body.sm",
          label: "Body small",
          valueType: "typography",
          value: "14 / 20 / 400 / 0",
        },
        {
          tokenId: "ref.type.role.label",
          label: "Label",
          valueType: "typography",
          value: "12 / 16 / 600 / 0.02em",
        },
        {
          tokenId: "ref.type.role.mono.sm",
          label: "Mono small",
          valueType: "typography",
          value: "12 / 16 / 500 / 0",
        },
      ],
    },
    {
      groupId: "ref.size",
      label: "Pane, icon, and dialog size buckets",
      tokens: [
        { tokenId: "ref.size.rail.collapsed", label: "Rail collapsed", valueType: "dimension", value: "72px" },
        { tokenId: "ref.size.rail.expanded", label: "Rail expanded", valueType: "dimension", value: "280px" },
        { tokenId: "ref.size.support.peek", label: "Support peek", valueType: "dimension", value: "320px" },
        {
          tokenId: "ref.size.support.open",
          label: "Support open",
          valueType: "formula",
          value: "clamp(320px, 28vw, 400px)",
        },
        {
          tokenId: "ref.size.drawer.inline",
          label: "Inline drawer",
          valueType: "formula",
          value: "clamp(360px, 33vw, 480px)",
        },
        { tokenId: "ref.size.dialog.sm", label: "Dialog small", valueType: "dimension", value: "480px" },
        { tokenId: "ref.size.dialog.md", label: "Dialog medium", valueType: "dimension", value: "640px" },
        { tokenId: "ref.size.dialog.lg", label: "Dialog large", valueType: "dimension", value: "800px" },
        { tokenId: "ref.size.icon.inline", label: "Icon inline", valueType: "dimension", value: "16px" },
        { tokenId: "ref.size.icon.standard", label: "Icon standard", valueType: "dimension", value: "20px" },
        { tokenId: "ref.size.icon.touch", label: "Icon touch", valueType: "dimension", value: "24px" },
      ],
    },
    {
      groupId: "ref.density",
      label: "Density equations",
      tokens: [
        { tokenId: "ref.density.relaxed", label: "Relaxed step", valueType: "number", value: -1 },
        { tokenId: "ref.density.balanced", label: "Balanced step", valueType: "number", value: 0 },
        { tokenId: "ref.density.compact", label: "Compact step", valueType: "number", value: 1 },
        {
          tokenId: "ref.density.control.public",
          label: "Public control formula",
          valueType: "formula",
          value: "max(44, 48 - 4 * densityStep)",
        },
        {
          tokenId: "ref.density.control.professional",
          label: "Professional control formula",
          valueType: "formula",
          value: "max(40, 44 - 4 * densityStep)",
        },
      ],
    },
    {
      groupId: "ref.radius",
      label: "Radius ladder",
      tokens: [
        { tokenId: "ref.radius.none", label: "None", valueType: "dimension", value: "0px" },
        { tokenId: "ref.radius.sm", label: "Small", valueType: "dimension", value: "4px" },
        { tokenId: "ref.radius.md", label: "Medium", valueType: "dimension", value: "8px" },
        { tokenId: "ref.radius.lg", label: "Large", valueType: "dimension", value: "12px" },
        { tokenId: "ref.radius.xl", label: "Extra large", valueType: "dimension", value: "16px" },
        { tokenId: "ref.radius.pill", label: "Pill", valueType: "dimension", value: "999px" },
      ],
    },
    {
      groupId: "ref.elevation",
      label: "Elevation model",
      tokens: [
        { tokenId: "ref.elevation.z0", label: "z0", valueType: "string", value: "flat + boundary" },
        { tokenId: "ref.elevation.z1", label: "z1", valueType: "string", value: "0 10px 28px rgba(15, 23, 32, 0.08)" },
        { tokenId: "ref.elevation.z2", label: "z2", valueType: "string", value: "0 18px 44px rgba(15, 23, 32, 0.12)" },
        { tokenId: "ref.elevation.z3", label: "z3", valueType: "string", value: "0 24px 60px rgba(15, 23, 32, 0.16)" },
      ],
    },
    {
      groupId: "ref.motion",
      label: "Motion timing and amplitude",
      tokens: [
        { tokenId: "ref.motion.duration.attention", label: "Attention", valueType: "motion", value: "120ms" },
        { tokenId: "ref.motion.duration.reveal", label: "Reveal", valueType: "motion", value: "180ms" },
        { tokenId: "ref.motion.duration.settle", label: "Settle", valueType: "motion", value: "240ms" },
        { tokenId: "ref.motion.duration.overlay", label: "Overlay", valueType: "motion", value: "320ms" },
        { tokenId: "ref.motion.scale.low", label: "Scale low", valueType: "number", value: 0.98 },
        { tokenId: "ref.motion.scale.static", label: "Scale static", valueType: "number", value: 1 },
        { tokenId: "ref.motion.translate.full", label: "Full travel", valueType: "dimension", value: "8px" },
        { tokenId: "ref.motion.translate.reduced", label: "Reduced travel", valueType: "dimension", value: "4px" },
        { tokenId: "ref.motion.translate.none", label: "Static travel", valueType: "dimension", value: "0px" },
      ],
    },
    {
      groupId: "ref.color",
      label: "Canonical seed palette and tone ladder",
      tokens: [
        {
          tokenId: "ref.color.surface.canvas",
          label: "Surface canvas",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, themeContrastKey(theme, contrast)),
              ]),
            ),
          ),
          notes: "GAP_RESOLUTION_TOKEN_SEEDS_LIGHT_V1 and GAP_RESOLUTION_TOKEN_SEEDS_DARK_V1 publish exact raw surface seeds.",
        },
        {
          tokenId: "ref.color.surface.shell",
          label: "Surface shell",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_shell`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.surface.panel",
          label: "Surface panel",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_panel`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.surface.inset",
          label: "Surface inset",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_inset`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.text.strong",
          label: "Text strong",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_textStrong`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.text.default",
          label: "Text default",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_textDefault`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.text.muted",
          label: "Text muted",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_textMuted`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.border.default",
          label: "Border default",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_borderDefault`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.accent.active",
          label: "Accent active",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_accentActive`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.accent.review",
          label: "Accent review",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_accentReview`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.accent.insight",
          label: "Accent insight",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_accentInsight`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.accent.success",
          label: "Accent success",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_accentSuccess`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.accent.danger",
          label: "Accent danger",
          valueType: "color",
          modeValues: Object.fromEntries(
            THEME_MODES.flatMap((theme) =>
              CONTRAST_MODES.map((contrast) => [
                themeContrastKey(theme, contrast),
                getRecordValue(colorModeValues, `${themeContrastKey(theme, contrast)}_accentDanger`),
              ]),
            ),
          ),
        },
        {
          tokenId: "ref.color.tone_ladder",
          label: "Tone ladder",
          valueType: "string",
          value: TONE_LADDER.join(", "),
          notes: "Additional state containers derive by blending accent seeds toward the active panel surface at fixed ratios per theme and contrast.",
        },
      ],
    },
  ] as const;
}

function buildSemanticAliases(): readonly AliasToken[] {
  const modeValues = (getter: (theme: ThemeMode, contrast: ContrastMode) => ColorValue | string) =>
    Object.fromEntries(
      THEME_MODES.flatMap((theme) =>
        CONTRAST_MODES.map((contrast) => [themeContrastKey(theme, contrast), getter(theme, contrast)]),
      ),
    );

  return [
    {
      tokenId: "sys.surface.canvas",
      label: "Canvas surface",
      aliasOf: ["ref.color.surface.canvas"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).surfaceCanvas),
    },
    {
      tokenId: "sys.surface.shell",
      label: "Shell surface",
      aliasOf: ["ref.color.surface.shell"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).surfaceShell),
    },
    {
      tokenId: "sys.surface.panel",
      label: "Panel surface",
      aliasOf: ["ref.color.surface.panel"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).surfacePanel),
    },
    {
      tokenId: "sys.surface.inset",
      label: "Inset surface",
      aliasOf: ["ref.color.surface.inset"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).surfaceInset),
    },
    {
      tokenId: "sys.text.strong",
      label: "Strong text",
      aliasOf: ["ref.color.text.strong"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).textStrong),
    },
    {
      tokenId: "sys.text.default",
      label: "Default text",
      aliasOf: ["ref.color.text.default"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).textDefault),
    },
    {
      tokenId: "sys.text.muted",
      label: "Muted text",
      aliasOf: ["ref.color.text.muted"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).textMuted),
    },
    {
      tokenId: "sys.border.subtle",
      label: "Subtle border",
      aliasOf: ["ref.color.border.default"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).borderSubtle),
    },
    {
      tokenId: "sys.border.default",
      label: "Default border",
      aliasOf: ["ref.color.border.default"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).borderDefault),
    },
    {
      tokenId: "sys.border.strong",
      label: "Strong border",
      aliasOf: ["ref.color.border.default", "ref.color.text.default"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).borderStrong),
    },
    {
      tokenId: "sys.focus.ring",
      label: "Focus ring",
      aliasOf: ["ref.color.accent.active", "ref.motion.duration.attention"],
      valueType: "color",
      modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).focusRing),
    },
    ...(["neutral", "active", "review", "insight", "success", "danger"] as const).flatMap((stateKey) => [
      {
        tokenId: `sys.state.${stateKey}.container`,
        label: `${stateKey} container`,
        aliasOf: [
          stateKey === "neutral" ? "ref.color.surface.inset" : `ref.color.accent.${stateKey}`,
          "ref.color.surface.panel",
        ],
        valueType: "color" as const,
        modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).state[stateKey].container),
      },
      {
        tokenId: `sys.state.${stateKey}.border`,
        label: `${stateKey} border`,
        aliasOf: [stateKey === "neutral" ? "ref.color.border.default" : `ref.color.accent.${stateKey}`],
        valueType: "color" as const,
        modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).state[stateKey].border),
      },
      {
        tokenId: `sys.state.${stateKey}.text`,
        label: `${stateKey} text`,
        aliasOf: ["ref.color.text.strong"],
        valueType: "color" as const,
        modeValues: modeValues((theme, contrast) => buildResolvedPalette(theme, contrast).state[stateKey].text),
      },
    ]),
    {
      tokenId: "sys.motion.reveal",
      label: "Reveal motion",
      aliasOf: ["ref.motion.duration.reveal"],
      valueType: "motion",
      modeValues: Object.fromEntries(
        MOTION_MODES.map((motion) => [motion, buildMotionValues(motion).durationReveal]),
      ),
    },
    {
      tokenId: "sys.motion.settle",
      label: "Settle motion",
      aliasOf: ["ref.motion.duration.settle"],
      valueType: "motion",
      modeValues: Object.fromEntries(
        MOTION_MODES.map((motion) => [motion, buildMotionValues(motion).durationSettle]),
      ),
    },
  ] as const;
}

function buildComponentAliases(): readonly AliasToken[] {
  return [
    {
      tokenId: "comp.shell.canvas",
      label: "Shell canvas",
      aliasOf: ["sys.surface.shell", "sys.border.subtle", "ref.elevation.z1"],
      valueType: "color",
      modeValues: Object.fromEntries(
        THEME_MODES.flatMap((theme) =>
          CONTRAST_MODES.map((contrast) => [
            themeContrastKey(theme, contrast),
            buildResolvedPalette(theme, contrast).surfaceShell,
          ]),
        ),
      ),
    },
    {
      tokenId: "comp.shell.masthead",
      label: "Shell masthead panel",
      aliasOf: ["sys.surface.panel", "sys.border.default", "ref.radius.xl"],
      valueType: "color",
      modeValues: Object.fromEntries(
        THEME_MODES.flatMap((theme) =>
          CONTRAST_MODES.map((contrast) => [
            themeContrastKey(theme, contrast),
            buildResolvedPalette(theme, contrast).surfacePanel,
          ]),
        ),
      ),
    },
    {
      tokenId: "comp.card.surface",
      label: "Card surface",
      aliasOf: ["sys.surface.panel", "sys.border.subtle", "ref.radius.lg"],
      valueType: "color",
      modeValues: Object.fromEntries(
        THEME_MODES.flatMap((theme) =>
          CONTRAST_MODES.map((contrast) => [
            themeContrastKey(theme, contrast),
            buildResolvedPalette(theme, contrast).surfacePanel,
          ]),
        ),
      ),
    },
    {
      tokenId: "comp.table.header",
      label: "Table header surface",
      aliasOf: ["sys.surface.inset", "sys.border.subtle"],
      valueType: "color",
      modeValues: Object.fromEntries(
        THEME_MODES.flatMap((theme) =>
          CONTRAST_MODES.map((contrast) => [
            themeContrastKey(theme, contrast),
            buildResolvedPalette(theme, contrast).surfaceInset,
          ]),
        ),
      ),
    },
    {
      tokenId: "comp.form.control.height.public",
      label: "Public control height",
      aliasOf: ["ref.density.control.public"],
      valueType: "dimension",
      modeValues: Object.fromEntries(
        DENSITY_MODES.map((density) => [density, buildDensityValues(density).controlHeightPublic]),
      ),
    },
    {
      tokenId: "comp.form.control.height.professional",
      label: "Professional control height",
      aliasOf: ["ref.density.control.professional"],
      valueType: "dimension",
      modeValues: Object.fromEntries(
        DENSITY_MODES.map((density) => [density, buildDensityValues(density).controlHeightProfessional]),
      ),
    },
    {
      tokenId: "comp.layout.pad.inline",
      label: "Inline padding",
      aliasOf: ["ref.density.control.professional"],
      valueType: "dimension",
      modeValues: Object.fromEntries(
        DENSITY_MODES.map((density) => [density, buildDensityValues(density).padInline]),
      ),
    },
    {
      tokenId: "comp.layout.pad.block",
      label: "Block padding",
      aliasOf: ["ref.density.control.professional"],
      valueType: "dimension",
      modeValues: Object.fromEntries(
        DENSITY_MODES.map((density) => [density, buildDensityValues(density).padBlock]),
      ),
    },
    {
      tokenId: "comp.rail.width.expanded",
      label: "Expanded rail width",
      aliasOf: ["ref.size.rail.expanded"],
      valueType: "dimension",
      modeValues: { default: "280px" },
    },
    {
      tokenId: "comp.support.width.open",
      label: "Support region width",
      aliasOf: ["ref.size.support.open"],
      valueType: "dimension",
      modeValues: { default: "clamp(320px, 28vw, 400px)" },
    },
    {
      tokenId: "comp.motion.reveal.distance",
      label: "Reveal translate distance",
      aliasOf: ["ref.motion.translate.full", "ref.motion.translate.reduced", "ref.motion.translate.none"],
      valueType: "dimension",
      modeValues: Object.fromEntries(
        MOTION_MODES.map((motion) => [motion, buildMotionValues(motion).translateDistance]),
      ),
    },
    {
      tokenId: "comp.motion.reveal.duration",
      label: "Reveal duration",
      aliasOf: ["sys.motion.reveal"],
      valueType: "motion",
      modeValues: Object.fromEntries(
        MOTION_MODES.map((motion) => [motion, buildMotionValues(motion).durationReveal]),
      ),
    },
  ] as const;
}

export const profileTokens: readonly ProfileToken[] = PROFILE_CONFIG.map((profile) => ({
  tokenId: profile.profileTokenRef,
  shellType: profile.shellType,
  label: profile.label,
  quietPosture: profile.quietPosture,
  accentRole: profile.accentRole,
  defaultDensityMode: profile.defaultDensityMode,
  defaultMotionMode: profile.defaultMotionMode,
  allowedTopologyMetricRefs: profile.allowedTopologyMetricRefs,
  allowedSurfaceRoleRefs: profile.allowedSurfaceRoleRefs,
  notes: profile.notes,
}));

export const profileSelectionResolutions: readonly ProfileSelectionResolution[] = PROFILE_CONFIG.map((profile) => {
  const digest = shortHash(
    serializeJson({
      profileTokenRef: profile.profileTokenRef,
      routeClassRef: profile.routeClassRef,
      densityModeRefs: profile.densityModeRefs,
      motionModeRefs: profile.motionModeRefs,
      allowedTopologyMetricRefs: profile.allowedTopologyMetricRefs,
      allowedSurfaceRoleRefs: profile.allowedSurfaceRoleRefs,
      semanticColorProfileRef: profile.semanticColorProfileRef,
    }),
  );

  return {
    profileSelectionResolutionId: profile.profileSelectionResolutionId,
    designTokenExportArtifactRef: DESIGN_TOKEN_EXPORT_ARTIFACT_ID,
    tokenKernelLayeringPolicyRef: TOKEN_KERNEL_LAYERING_POLICY_ID,
    profileTokenRef: profile.profileTokenRef,
    shellType: profile.shellType,
    routeClassRef: profile.routeClassRef,
    breakpointCoverageRefs: ["xs", "sm", "md", "lg", "xl", "2xl", "mission_stack"],
    densityModeRefs: profile.densityModeRefs,
    motionModeRefs: profile.motionModeRefs,
    allowedTopologyMetricRefs: profile.allowedTopologyMetricRefs,
    allowedSurfaceRoleRefs: profile.allowedSurfaceRoleRefs,
    semanticColorProfileRef: profile.semanticColorProfileRef,
    selectionDigestRef: digest,
    effectiveAt: GENERATED_AT,
  };
});

export const tokenKernelLayeringPolicy = {
  tokenKernelLayeringPolicyId: TOKEN_KERNEL_LAYERING_POLICY_ID,
  designTokenFoundationRef: DESIGN_TOKEN_FOUNDATION_REF,
  primitiveLayerNamespace: "ref.*",
  semanticLayerNamespace: "sys.*",
  componentLayerNamespace: "comp.*",
  profileLayerNamespace: "profile.*",
  requiredAliasOrder: "ref_to_sys_to_comp_to_profile",
  allowedShellVariationRefs: profileTokens.map((profile) => profile.tokenId),
  allowedModeVariationRefs: [
    "theme.light",
    "theme.dark",
    "contrast.standard",
    "contrast.high",
    "density.relaxed",
    "density.balanced",
    "density.compact",
    "motion.full",
    "motion.reduced",
    "motion.essential_only",
  ],
  forbiddenOverrideClasses: [
    "route_local_hex",
    "route_local_px",
    "route_local_shadow_stack",
    "route_local_radius_ladder",
    "route_local_telemetry_name",
    "route_local_animation_curve",
  ],
  requiredKernelStatePropagationRef: "SSKB_052_SHARED_KERNEL_PROPAGATION_V1",
  layeringDigestRef: shortHash(
    serializeJson({
      primitive: "ref.*",
      semantic: "sys.*",
      component: "comp.*",
      profile: "profile.*",
      profiles: profileTokens.map((profile) => profile.tokenId),
    }),
  ),
  effectiveAt: GENERATED_AT,
} as const;

export const primitiveTokenGroups = buildPrimitiveGroups();
export const semanticAliases = buildSemanticAliases();
export const componentAliases = buildComponentAliases();

function buildCompositeTokens() {
  return profileTokens.map((profile) => {
    const modeTuple: ModeTuple = {
      theme: profile.shellType === "embedded" ? "dark" : "light",
      contrast: "standard",
      density: profile.defaultDensityMode,
      motion: profile.defaultMotionMode,
    };
    const tokens = resolveModeTokens(modeTuple);
    const accentState = tokens.palette.state[profile.accentRole];
    return {
      compositeTokenId: `composite.${profile.shellType}.shell_sample`,
      label: `${profile.label} shell sample`,
      aliases: [
        "comp.shell.canvas",
        "comp.shell.masthead",
        `sys.state.${profile.accentRole}.border`,
        profile.tokenId,
      ],
      resolvedSample: {
        modeTupleRef: modeTupleId(modeTuple),
        shellSurface: tokens.palette.surfaceShell,
        panelSurface: tokens.palette.surfacePanel,
        accentBorder: accentState.border,
        controlHeight: profile.shellType === "patient"
          ? tokens.density.controlHeightPublic
          : tokens.density.controlHeightProfessional,
      },
    };
  });
}

export const compositeTokens = buildCompositeTokens();

export const specimenShellProfiles = profileTokens.map((profile) => ({
  shellType: profile.shellType,
  profileTokenRef: profile.tokenId,
  label: profile.label,
  quietPosture: profile.quietPosture,
  topology: profile.allowedTopologyMetricRefs[0],
  accentRole: profile.accentRole,
  density: profile.defaultDensityMode,
  motion: profile.defaultMotionMode,
  continuityNote: profile.notes,
}));

export const specimenSemanticStates = [
  {
    role: "neutral",
    label: "Calm neutral",
    copy: "Default structure, stale-safe explanation, and subdued chrome without hidden urgency.",
  },
  {
    role: "active",
    label: "Active",
    copy: "In-progress acknowledgement and the current dominant route anchor use one precise accent.",
  },
  {
    role: "review",
    label: "Review",
    copy: "Pending confirmation and stale-but-recoverable posture stay visible without shouting.",
  },
  {
    role: "insight",
    label: "Insight",
    copy: "Compare, diff, provenance, and newly surfaced evidence use the same quiet signal family.",
  },
  {
    role: "success",
    label: "Success",
    copy: "Authoritative completion is explicit but never celebratory when downstream work is still pending.",
  },
  {
    role: "danger",
    label: "Danger",
    copy: "Blocked, denied, or urgent exception posture escalates through copy, keyline, and focus parity.",
  },
] as const;

export const specimenParitySeries = [
  { label: "Authoritative", value: 84, role: "success" },
  { label: "Review", value: 46, role: "review" },
  { label: "Insight", value: 61, role: "insight" },
  { label: "Blocked", value: 18, role: "danger" },
] as const;

function buildDesignTokenExportArtifact() {
  const tokenValueDigestRef = shortHash(
    serializeJson({
      primitiveTokenGroups,
      semanticAliases,
      componentAliases,
      profileTokens,
      compositeTokens,
      profileSelectionResolutions,
    }),
  );

  return {
    designTokenExportArtifactId: DESIGN_TOKEN_EXPORT_ARTIFACT_ID,
    designTokenFoundationRef: DESIGN_TOKEN_FOUNDATION_REF,
    tokenKernelLayeringPolicyRef: TOKEN_KERNEL_LAYERING_POLICY_ID,
    modeTupleCoverageRef: MODE_TUPLE_COVERAGE_REF,
    primitiveTokenGroupRefs: primitiveTokenGroups.map((group) => group.groupId),
    semanticAliasRefs: semanticAliases.map((alias) => alias.tokenId),
    componentAliasRefs: componentAliases.map((alias) => alias.tokenId),
    profileResolutionRefs: profileSelectionResolutions.map((resolution) => resolution.profileSelectionResolutionId),
    compositeTokenRefs: compositeTokens.map((token) => token.compositeTokenId),
    exportFormatRefs: ["json.design_tokens", "css.variables", "ts.contracts", "svg.brand_mark"],
    tokenValueDigestRef,
    generatedAt: GENERATED_AT,
  };
}

export const canonicalDesignTokenExportArtifact = buildDesignTokenExportArtifact();

export function buildTokenModeCoverageRows(): readonly ModeCoverageRow[] {
  return THEME_MODES.flatMap((theme) =>
    CONTRAST_MODES.flatMap((contrast) =>
      DENSITY_MODES.flatMap((density) =>
        MOTION_MODES.map((motion) => {
          const modeTuple = { theme, contrast, density, motion } satisfies ModeTuple;
          return {
            mode_tuple_id: modeTupleId(modeTuple),
            theme,
            contrast,
            density,
            motion,
            breakpoint_coverage: "xs|md|lg|xl",
            profile_coverage: profileSelectionResolutions.map((resolution) => resolution.profileSelectionResolutionId).join("|"),
            status: "supported" as const,
            digest_ref: shortHash(serializeJson(modeTuple)),
          };
        }),
      ),
    ),
  );
}

export function buildTokenContrastMatrixRows(): readonly ContrastMatrixRow[] {
  const rows: ContrastMatrixRow[] = [];
  for (const theme of THEME_MODES) {
    for (const contrast of CONTRAST_MODES) {
      const palette = buildResolvedPalette(theme, contrast);
      const pushRow = (
        semanticRole: string,
        foregroundToken: string,
        foregroundHex: string,
        backgroundToken: string,
        backgroundHex: string,
        minimumRatio: number,
      ) => {
        const ratio = contrastRatio(foregroundHex, backgroundHex);
        rows.push({
          contrast_matrix_id: `${theme}_${contrast}_${semanticRole}_${foregroundToken}_${backgroundToken}`,
          theme,
          contrast,
          semantic_role: semanticRole,
          foreground_token: foregroundToken,
          background_token: backgroundToken,
          foreground_hex: foregroundHex,
          background_hex: backgroundHex,
          contrast_ratio: ratio.toFixed(2),
          minimum_ratio: minimumRatio.toFixed(2),
          status: ratio >= minimumRatio ? "pass" : "fail",
        });
      };

      pushRow("surface_text", "sys.text.strong", palette.textStrong.hex, "sys.surface.canvas", palette.surfaceCanvas.hex, 7);
      pushRow("surface_text", "sys.text.default", palette.textDefault.hex, "sys.surface.panel", palette.surfacePanel.hex, 4.5);
      pushRow("surface_text", "sys.text.muted", palette.textMuted.hex, "sys.surface.panel", palette.surfacePanel.hex, 4.5);
      pushRow("focus", "sys.focus.ring", palette.focusRing.hex, "sys.surface.panel", palette.surfacePanel.hex, 3);

      for (const role of ["neutral", "active", "review", "insight", "success", "danger"] as const) {
        const rolePalette = palette.state[role];
        pushRow(`${role}_text`, `sys.state.${role}.text`, rolePalette.text.hex, `sys.state.${role}.container`, rolePalette.container.hex, 4.5);
        pushRow(`${role}_border`, `sys.state.${role}.border`, rolePalette.border.hex, `sys.state.${role}.container`, rolePalette.container.hex, 3);
      }
    }
  }
  return rows;
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvFromRows(rows: readonly Record<string, string>[]): string {
  const [firstRow] = rows;
  if (!firstRow) {
    return "";
  }
  const headers = Object.keys(firstRow);
  const body = rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(","));
  return `${headers.join(",")}\n${body.join("\n")}\n`;
}

export function buildTokenContrastMatrixCsv(): string {
  return csvFromRows(
    buildTokenContrastMatrixRows().map((row) => ({
      contrast_matrix_id: row.contrast_matrix_id,
      theme: row.theme,
      contrast: row.contrast,
      semantic_role: row.semantic_role,
      foreground_token: row.foreground_token,
      background_token: row.background_token,
      foreground_hex: row.foreground_hex,
      background_hex: row.background_hex,
      contrast_ratio: row.contrast_ratio,
      minimum_ratio: row.minimum_ratio,
      status: row.status,
    })),
  );
}

export function buildTokenModeCoverageCsv(): string {
  return csvFromRows(
    buildTokenModeCoverageRows().map((row) => ({
      mode_tuple_id: row.mode_tuple_id,
      theme: row.theme,
      contrast: row.contrast,
      density: row.density,
      motion: row.motion,
      breakpoint_coverage: row.breakpoint_coverage,
      profile_coverage: row.profile_coverage,
      status: row.status,
      digest_ref: row.digest_ref,
    })),
  );
}

export function buildProfileSelectionResolutionPayload() {
  return {
    task_id: DESIGN_TOKEN_FOUNDATION_TASK_ID,
    generated_at: GENERATED_AT,
    captured_on: CAPTURED_ON,
    visual_mode: DESIGN_TOKEN_FOUNDATION_VISUAL_MODE,
    designTokenExportArtifactRef: DESIGN_TOKEN_EXPORT_ARTIFACT_ID,
    tokenKernelLayeringPolicyRef: TOKEN_KERNEL_LAYERING_POLICY_ID,
    summary: {
      shell_profile_count: profileSelectionResolutions.length,
      shell_types: profileSelectionResolutions.map((resolution) => resolution.shellType),
      profile_digest_ref: shortHash(serializeJson(profileSelectionResolutions)),
    },
    profileSelectionResolutions,
  };
}

export function buildDesignTokenFoundationArtifact() {
  return {
    task_id: DESIGN_TOKEN_FOUNDATION_TASK_ID,
    generated_at: GENERATED_AT,
    captured_on: CAPTURED_ON,
    visual_mode: DESIGN_TOKEN_FOUNDATION_VISUAL_MODE,
    mission:
      "Publish the first real canonical Signal Atlas Live token graph and its specimen experience so later shells resolve color, spacing, type, density, motion, and profile law from one source.",
    source_precedence: [...DESIGN_TOKEN_SOURCE_PRECEDENCE],
    summary: {
      primitive_group_count: primitiveTokenGroups.length,
      semantic_alias_count: semanticAliases.length,
      component_alias_count: componentAliases.length,
      profile_token_count: profileTokens.length,
      profile_selection_resolution_count: profileSelectionResolutions.length,
      supported_mode_tuple_count: buildTokenModeCoverageRows().length,
      contrast_matrix_row_count: buildTokenContrastMatrixRows().length,
    },
    gap_resolutions: [
      {
        gap_resolution_id: "GAP_RESOLUTION_TOKEN_SEEDS_LIGHT_V1",
        scope: "light_theme_seed_values",
        statement:
          "The blueprint defined semantic tone families but not final numeric seeds, so par_103 publishes the exact light-theme seed set as canonical ref.color primitives and exposes them as OKLCH values downstream.",
      },
      {
        gap_resolution_id: "GAP_RESOLUTION_TOKEN_SEEDS_DARK_V1",
        scope: "dark_theme_seed_values",
        statement:
          "par_103 publishes the exact dark-theme seed set as canonical ref.color primitives and keeps the same semantic alias vocabulary under dark mode rather than creating a second naming system.",
      },
      {
        gap_resolution_id: "GAP_RESOLUTION_TOKEN_TONE_DERIVATION_V1",
        scope: "state_container_tones",
        statement:
          "State container tones derive by blending the semantic accent seed toward the active panel surface at fixed theme- and contrast-specific ratios. The blend keeps tone law systematic while preserving contrast floors.",
      },
    ],
    designTokenFoundation: {
      designTokenFoundationRef: DESIGN_TOKEN_FOUNDATION_REF,
      visualLanguage: "Signal Atlas Live",
      overlay: "Quiet Clarity",
      compatibilityAlias: "Signal Atlas Quiet",
      tokenArchitecture: ["ref.*", "sys.*", "comp.*", "profile.*"],
      toneLadder: TONE_LADDER,
      modeTupleCoverageRef: MODE_TUPLE_COVERAGE_REF,
      sourceTraceabilityState: "exact",
    },
    tokenKernelLayeringPolicy,
    designTokenExportArtifact: canonicalDesignTokenExportArtifact,
    primitiveTokenGroups,
    semanticAliases,
    componentAliases,
    profileTokens,
    compositeTokens,
    profileSelectionResolutions,
    specimen: {
      brandMarkPath: "assets/brand/signal-atlas-live-mark.svg",
      shellProfiles: specimenShellProfiles,
      semanticStates: specimenSemanticStates,
      breakpointFrames: [
        { breakpointClass: "xs", width: 360, label: "Mission stack / xs" },
        { breakpointClass: "md", width: 820, label: "Clinical middle / md" },
        { breakpointClass: "lg", width: 1120, label: "Two-plane / lg" },
        { breakpointClass: "xl", width: 1440, label: "Wide atlas / xl" },
      ],
      paritySeries: specimenParitySeries,
      digestChips: [
        { label: "artifact", value: canonicalDesignTokenExportArtifact.tokenValueDigestRef },
        { label: "layering", value: tokenKernelLayeringPolicy.layeringDigestRef },
        { label: "profiles", value: shortHash(serializeJson(profileSelectionResolutions)) },
      ],
    },
    follow_on_dependencies: [
      {
        dependency_id: "FOLLOW_ON_DEPENDENCY_103_COMPONENT_BINDINGS",
        statement:
          "Later component and shell tracks must bind additional surface semantics through comp.* and profile.* rather than inventing route-local token branches.",
      },
      {
        dependency_id: "FOLLOW_ON_DEPENDENCY_103_SHELL_ROLLOUT_SURFACE_BINDING",
        statement:
          "Later shell-specialization work must consume the published profileSelectionResolution rows and may only add new rows when the canonical token graph changes here first.",
      },
    ],
  };
}

export const designTokenFoundationArtifact = buildDesignTokenFoundationArtifact();

export function buildSignalAtlasLiveMarkSvg(): string {
  return [
    '<svg id="signal-atlas-live-mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none" role="img" aria-labelledby="signal-atlas-live-mark-title signal-atlas-live-mark-desc">',
    "  <title id=\"signal-atlas-live-mark-title\">Signal Atlas Live</title>",
    "  <desc id=\"signal-atlas-live-mark-desc\">Three quiet orbital lines with one active node and one selected anchor node.</desc>",
    "  <g stroke=\"#7C8D9E\" stroke-width=\"4\" stroke-linecap=\"round\">",
    "    <circle cx=\"80\" cy=\"80\" r=\"58\" opacity=\"0.28\" />",
    "    <path d=\"M28 80c0-28.719 23.281-52 52-52 12.739 0 24.408 4.58 33.452 12.176\" opacity=\"0.48\" />",
    "    <path d=\"M124 48c5.062 8.234 8 17.922 8 28.291 0 28.719-23.281 52-52 52-14.358 0-27.358-5.822-36.771-15.229\" opacity=\"0.68\" />",
    "    <path d=\"M49 39c8.993-7.144 20.376-11.432 32.75-11.432 28.719 0 52 23.281 52 52 0 6.999-1.381 13.675-3.884 19.772\" opacity=\"0.86\" />",
    "  </g>",
    "  <circle cx=\"122\" cy=\"50\" r=\"8\" fill=\"#2F6FED\" />",
    "  <circle cx=\"45\" cy=\"119\" r=\"8\" fill=\"#0F1720\" stroke=\"#EEF2F6\" stroke-width=\"4\" />",
    "</svg>",
  ].join("\n");
}

export function buildFoundationStylesheet(): string {
  const themeRules = THEME_MODES.flatMap((theme) =>
    CONTRAST_MODES.map((contrast) => {
      const palette = buildResolvedPalette(theme, contrast);
      return `
body[data-theme="${theme}"][data-contrast="${contrast}"],
.token-foundation[data-theme="${theme}"][data-contrast="${contrast}"] {
  color-scheme: ${theme};
  --sys-surface-canvas: ${palette.surfaceCanvas.oklch};
  --sys-surface-shell: ${palette.surfaceShell.oklch};
  --sys-surface-panel: ${palette.surfacePanel.oklch};
  --sys-surface-inset: ${palette.surfaceInset.oklch};
  --sys-text-strong: ${palette.textStrong.oklch};
  --sys-text-default: ${palette.textDefault.oklch};
  --sys-text-muted: ${palette.textMuted.oklch};
  --sys-border-subtle: ${palette.borderSubtle.oklch};
  --sys-border-default: ${palette.borderDefault.oklch};
  --sys-border-strong: ${palette.borderStrong.oklch};
  --sys-focus-ring: ${palette.focusRing.oklch};
  --sys-state-neutral-container: ${palette.state.neutral.container.oklch};
  --sys-state-neutral-border: ${palette.state.neutral.border.oklch};
  --sys-state-active-container: ${palette.state.active.container.oklch};
  --sys-state-active-border: ${palette.state.active.border.oklch};
  --sys-state-review-container: ${palette.state.review.container.oklch};
  --sys-state-review-border: ${palette.state.review.border.oklch};
  --sys-state-insight-container: ${palette.state.insight.container.oklch};
  --sys-state-insight-border: ${palette.state.insight.border.oklch};
  --sys-state-success-container: ${palette.state.success.container.oklch};
  --sys-state-success-border: ${palette.state.success.border.oklch};
  --sys-state-danger-container: ${palette.state.danger.container.oklch};
  --sys-state-danger-border: ${palette.state.danger.border.oklch};
  --state-accent-active-hex: ${palette.state.active.border.hex};
  --state-accent-review-hex: ${palette.state.review.border.hex};
  --state-accent-insight-hex: ${palette.state.insight.border.hex};
  --state-accent-success-hex: ${palette.state.success.border.hex};
  --state-accent-danger-hex: ${palette.state.danger.border.hex};
}`.trim();
    }),
  ).join("\n\n");

  const densityRules = DENSITY_MODES.map((density) => {
    const tokens = buildDensityValues(density);
    return `
body[data-density="${density}"],
.token-foundation[data-density="${density}"] {
  --comp-control-height-public: ${tokens.controlHeightPublic};
  --comp-control-height-professional: ${tokens.controlHeightProfessional};
  --comp-passive-row-height: ${tokens.passiveRowHeight};
  --comp-pad-inline: ${tokens.padInline};
  --comp-pad-block: ${tokens.padBlock};
  --density-step: ${tokens.densityStep};
}`.trim();
  }).join("\n\n");

  const motionRules = MOTION_MODES.map((motion) => {
    const tokens = buildMotionValues(motion);
    return `
body[data-motion="${motion}"],
.token-foundation[data-motion="${motion}"] {
  --motion-duration-attention: ${tokens.durationAttention};
  --motion-duration-reveal: ${tokens.durationReveal};
  --motion-duration-settle: ${tokens.durationSettle};
  --motion-duration-overlay: ${tokens.durationOverlay};
  --motion-translate-distance: ${tokens.translateDistance};
  --motion-opacity-delta: ${tokens.opacityDelta};
  --motion-scale-from: ${tokens.scaleFrom};
  --motion-profile-state: ${tokens.motionProfileState};
}`.trim();
  }).join("\n\n");

  return `
:root,
body,
.token-foundation {
  color-scheme: light;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--sys-surface-canvas);
  color: var(--sys-text-default);
  --shadow-z1: 0 14px 30px rgba(15, 23, 32, 0.08);
  --shadow-z2: 0 22px 50px rgba(15, 23, 32, 0.12);
  --shadow-z3: 0 32px 72px rgba(15, 23, 32, 0.16);
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 999px;
  --grid-max-width: 1440px;
  --specimen-reading-measure: 68ch;
  --specimen-task-measure: 48ch;
}

body[data-theme="light"][data-contrast="standard"],
.token-foundation[data-theme="light"][data-contrast="standard"] {
  color-scheme: light;
}

body[data-density="balanced"],
.token-foundation[data-density="balanced"] {
  --comp-control-height-public: 48px;
  --comp-control-height-professional: 44px;
  --comp-passive-row-height: 40px;
  --comp-pad-inline: 16px;
  --comp-pad-block: 12px;
  --density-step: 0;
}

body[data-motion="reduced"],
.token-foundation[data-motion="reduced"] {
  --motion-duration-attention: 120ms;
  --motion-duration-reveal: 180ms;
  --motion-duration-settle: 240ms;
  --motion-duration-overlay: 320ms;
  --motion-translate-distance: 4px;
  --motion-opacity-delta: 0.08;
  --motion-scale-from: 1;
  --motion-profile-state: reduced;
}

${themeRules}

${densityRules}

${motionRules}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 15% 15%, rgba(47, 111, 237, 0.06), transparent 22%),
    radial-gradient(circle at 88% 12%, rgba(91, 97, 246, 0.06), transparent 18%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
    var(--sys-surface-canvas);
  color: var(--sys-text-default);
}

button,
input,
select,
textarea {
  font: inherit;
}

a {
  color: inherit;
}

:focus-visible {
  outline: 2px solid var(--sys-focus-ring);
  outline-offset: 3px;
}

.foundation-shell {
  min-height: 100vh;
  padding: 24px;
  max-width: var(--grid-max-width);
  margin: 0 auto;
}

.foundation-masthead,
.specimen-masthead {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  padding: 24px 28px;
  border: 1px solid var(--sys-border-default);
  border-radius: 24px;
  background: var(--sys-surface-panel);
  box-shadow: var(--shadow-z1);
}

.foundation-masthead h1,
.foundation-panel h2,
.foundation-panel h3,
.specimen-masthead h1,
.specimen-section h2,
.specimen-section h3 {
  margin: 0;
  color: var(--sys-text-strong);
}

.foundation-kicker,
.specimen-kicker {
  display: inline-flex;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  color: var(--sys-text-muted);
}

.foundation-chip-row,
.specimen-chip-row,
.mode-toggle-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.foundation-chip,
.specimen-chip,
.mode-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--sys-border-default);
  background: var(--sys-surface-inset);
  color: var(--sys-text-default);
}

.foundation-chip--masthead {
  border-color: var(--sys-state-active-border);
}

.foundation-ownership,
.foundation-metrics,
.foundation-card-grid,
.specimen-grid,
.specimen-shell-grid,
.semantic-state-wall,
.motion-grid,
.responsive-frame-grid,
.parity-grid {
  display: grid;
  gap: 16px;
}

.foundation-ownership {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: 20px;
  padding: 20px;
  border-radius: 22px;
  background: var(--sys-surface-panel);
  border: 1px solid var(--sys-border-subtle);
}

.foundation-ownership > div,
.foundation-metric,
.foundation-card,
.foundation-visual-row,
.foundation-rail li,
.specimen-card,
.shell-profile-card,
.state-card,
.motion-card,
.frame-card,
.parity-card {
  background: var(--sys-surface-panel);
  border: 1px solid var(--sys-border-subtle);
  border-radius: 18px;
}

.foundation-ownership > div,
.foundation-metric,
.foundation-card,
.foundation-panel,
.foundation-visual,
.foundation-rail,
.foundation-parity,
.specimen-card,
.shell-profile-card,
.state-card,
.motion-card,
.frame-card,
.parity-card {
  padding: 20px;
}

.foundation-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 20px;
}

.foundation-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 24px;
}

.foundation-panel {
  border: 1px solid var(--sys-border-default);
  border-radius: 24px;
  background: var(--sys-surface-panel);
  box-shadow: var(--shadow-z1);
}

.foundation-panel--primary {
  grid-column: span 7;
}

.foundation-panel--visual {
  grid-column: span 5;
}

.foundation-panel--rail {
  grid-column: span 4;
}

.foundation-panel--parity {
  grid-column: span 8;
}

.foundation-card-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.foundation-card,
.foundation-metric,
.foundation-visual-row,
.shell-profile-card,
.state-card,
.motion-card,
.frame-card,
.parity-card {
  display: grid;
  gap: 12px;
}

.foundation-visual-row {
  border-left: 4px solid var(--sys-state-active-border);
}

.foundation-rail ul,
.specimen-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.foundation-parity table,
.parity-table {
  width: 100%;
  border-collapse: collapse;
}

.foundation-parity th,
.foundation-parity td,
.parity-table th,
.parity-table td {
  padding: 12px;
  border-bottom: 1px solid var(--sys-border-subtle);
  text-align: left;
}

.specimen-page {
  max-width: var(--grid-max-width);
  margin: 0 auto;
  padding: 24px;
  display: grid;
  gap: 20px;
}

.specimen-section {
  display: grid;
  gap: 16px;
}

.specimen-grid {
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.9fr);
}

.lattice-diagram {
  display: grid;
  gap: 14px;
}

.lattice-lane {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: center;
}

.lattice-node {
  padding: 14px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--sys-border-default);
  background: var(--sys-surface-panel);
  color: var(--sys-text-strong);
}

.lattice-arrow {
  height: 2px;
  background: linear-gradient(90deg, var(--sys-state-active-border), var(--sys-state-insight-border));
  border-radius: 999px;
}

.shell-profile-card {
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--motion-duration-reveal) ease,
    border-color var(--motion-duration-attention) ease,
    box-shadow var(--motion-duration-attention) ease;
}

.shell-profile-card[data-selected="true"] {
  border-color: var(--sys-state-active-border);
  box-shadow: var(--shadow-z2);
}

.shell-profile-card:hover {
  transform: translateY(calc(var(--motion-translate-distance) * -0.5));
}

.semantic-state-wall {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.state-card {
  position: relative;
  overflow: hidden;
}

.state-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 6px;
  border-radius: 999px;
  background: var(--sys-state-active-border);
}

.state-card[data-role="neutral"] {
  background: var(--sys-state-neutral-container);
}

.state-card[data-role="neutral"]::before {
  background: var(--sys-state-neutral-border);
}

.state-card[data-role="active"] {
  background: var(--sys-state-active-container);
}

.state-card[data-role="active"]::before {
  background: var(--sys-state-active-border);
}

.state-card[data-role="review"] {
  background: var(--sys-state-review-container);
}

.state-card[data-role="review"]::before {
  background: var(--sys-state-review-border);
}

.state-card[data-role="insight"] {
  background: var(--sys-state-insight-container);
}

.state-card[data-role="insight"]::before {
  background: var(--sys-state-insight-border);
}

.state-card[data-role="success"] {
  background: var(--sys-state-success-container);
}

.state-card[data-role="success"]::before {
  background: var(--sys-state-success-border);
}

.state-card[data-role="danger"] {
  background: var(--sys-state-danger-container);
}

.state-card[data-role="danger"]::before {
  background: var(--sys-state-danger-border);
}

.state-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  border: 1px solid currentColor;
  width: fit-content;
}

.responsive-frame-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.frame-preview {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid var(--sys-border-default);
  background: var(--sys-surface-shell);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.frame-preview-inner {
  padding: 18px;
  display: grid;
  gap: 12px;
}

.frame-shell-strip {
  display: grid;
  grid-template-columns: 72px 1fr minmax(120px, 320px);
  gap: 12px;
}

.frame-rail,
.frame-main,
.frame-support {
  min-height: 120px;
  border-radius: 16px;
  border: 1px solid var(--sys-border-subtle);
  background: var(--sys-surface-panel);
}

.frame-breakpoint-label {
  font-family: ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace;
  font-size: 12px;
  line-height: 16px;
  color: var(--sys-text-muted);
}

.motion-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.motion-card[data-motion-animate="true"] .motion-chip {
  animation: specimenRise var(--motion-duration-reveal) ease both;
}

.motion-card[data-static-equivalent="true"] .motion-chip {
  transform: none;
  opacity: 1;
}

.motion-chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: var(--radius-pill);
  background: var(--sys-surface-inset);
  border: 1px solid var(--sys-border-default);
}

.parity-grid {
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
}

.parity-chart {
  display: grid;
  gap: 12px;
}

.parity-bar-row {
  display: grid;
  grid-template-columns: 120px 1fr 56px;
  gap: 12px;
  align-items: center;
}

.parity-bar {
  height: 12px;
  border-radius: 999px;
  background: var(--sys-state-insight-border);
}

.parity-bar[data-role="success"] {
  background: var(--sys-state-success-border);
}

.parity-bar[data-role="review"] {
  background: var(--sys-state-review-border);
}

.parity-bar[data-role="insight"] {
  background: var(--sys-state-insight-border);
}

.parity-bar[data-role="danger"] {
  background: var(--sys-state-danger-border);
}

.mode-group {
  display: grid;
  gap: 8px;
}

.mode-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mode-button {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--sys-border-default);
  border-radius: var(--radius-pill);
  background: var(--sys-surface-panel);
  color: var(--sys-text-default);
  cursor: pointer;
}

.mode-button[aria-pressed="true"] {
  border-color: var(--sys-state-active-border);
  background: var(--sys-state-active-container);
  color: var(--sys-text-strong);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@keyframes specimenRise {
  from {
    transform: translateY(var(--motion-translate-distance)) scale(var(--motion-scale-from));
    opacity: calc(1 - var(--motion-opacity-delta));
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .motion-card[data-motion-animate="true"] .motion-chip,
  .shell-profile-card,
  .mode-button {
    animation: none !important;
    transition-duration: 0ms !important;
  }
}

@media (max-width: 1180px) {
  .specimen-grid,
  .parity-grid,
  .responsive-frame-grid {
    grid-template-columns: 1fr;
  }

  .semantic-state-wall,
  .motion-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .foundation-ownership,
  .foundation-metrics,
  .foundation-card-grid,
  .semantic-state-wall,
  .motion-grid,
  .responsive-frame-grid {
    grid-template-columns: 1fr;
  }

  .foundation-grid {
    grid-template-columns: 1fr;
  }

  .foundation-panel--primary,
  .foundation-panel--visual,
  .foundation-panel--rail,
  .foundation-panel--parity {
    grid-column: span 1;
  }

  .frame-shell-strip {
    grid-template-columns: 1fr;
  }
}
`.trim();
}

export const designTokenFoundationCatalog = {
  taskId: DESIGN_TOKEN_FOUNDATION_TASK_ID,
  visualMode: DESIGN_TOKEN_FOUNDATION_VISUAL_MODE,
  schemaArtifactPath: "packages/design-system/contracts/design-token-foundation.schema.json",
  exportArtifactId: DESIGN_TOKEN_EXPORT_ARTIFACT_ID,
  primitiveGroupCount: primitiveTokenGroups.length,
  semanticAliasCount: semanticAliases.length,
  componentAliasCount: componentAliases.length,
  profileTokenCount: profileTokens.length,
  profileSelectionResolutionCount: profileSelectionResolutions.length,
  supportedModeTupleCount: buildTokenModeCoverageRows().length,
  contrastMatrixRowCount: buildTokenContrastMatrixRows().length,
} as const;

export const designTokenFoundationSchemas = [
  {
    artifactId: "schema_design_token_foundation",
    artifactPath: "packages/design-system/contracts/design-token-foundation.schema.json",
    generatedByTask: DESIGN_TOKEN_FOUNDATION_TASK_ID,
  },
] as const;
