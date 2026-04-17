import fs from "node:fs";
import path from "node:path";
import {
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
  type ArtifactModeState,
  type AudienceSurface,
  type BreakpointClass,
  type EffectiveDisplayState,
  type KernelBundleSeed,
  type KernelRouteSeed,
  type ModeTuple,
  type PublicationState,
  type SemanticTone,
  type StatePrecedenceInput,
  type UiContractAccessibilityArtifact,
  type UiContractAutomationAnchorArtifact,
  type UiContractKernelPublicationArtifact,
  type UiContractLintVerdictArtifact,
} from "../../packages/design-system/src/ui-contract-kernel";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const DATA_DIR = path.join(ROOT, "data", "analysis");
const DOCS_DIR = path.join(ROOT, "docs", "architecture");
const PACKAGE_DIR = path.join(ROOT, "packages", "design-system");
const SOURCE_DIR = path.join(PACKAGE_DIR, "src");

const ROUTE_PROFILE_SOURCE_PATH = path.join(
  DATA_DIR,
  "frontend_accessibility_and_automation_profiles.json",
);
const LEGACY_BUNDLE_SOURCE_PATH = path.join(
  DATA_DIR,
  "design_contract_publication_bundles.json",
);

const PUBLICATION_ARTIFACT_PATH = path.join(
  DATA_DIR,
  "design_contract_publication_bundle.json",
);
const LINT_ARTIFACT_PATH = path.join(DATA_DIR, "design_contract_lint_verdicts.json");
const BINDING_CSV_PATH = path.join(DATA_DIR, "surface_state_kernel_bindings.csv");
const AUTOMATION_ARTIFACT_PATH = path.join(DATA_DIR, "automation_anchor_maps.json");
const ACCESSIBILITY_ARTIFACT_PATH = path.join(
  DATA_DIR,
  "accessibility_semantic_coverage_profiles.json",
);

const PUBLICATION_DOC_PATH = path.join(
  DOCS_DIR,
  "104_canonical_ui_contract_kernel_publication.md",
);
const BINDING_DOC_PATH = path.join(
  DOCS_DIR,
  "104_surface_state_kernel_binding_strategy.md",
);
const BUNDLE_DOC_PATH = path.join(
  DOCS_DIR,
  "104_design_contract_publication_bundle_strategy.md",
);
const STUDIO_HTML_PATH = path.join(DOCS_DIR, "104_ui_kernel_studio.html");
const GENERATED_SOURCE_PATH = path.join(SOURCE_DIR, "ui-contract-kernel.generated.ts");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeText(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function toRouteFamilyRef(ref: string): string {
  const match = ref.match(/_RF_([A-Z0-9_]+)_V\d+$/);
  if (!match) {
    throw new Error(`Unable to derive route family from ref ${ref}`);
  }
  return `rf_${match[1].toLowerCase()}`;
}

function assertArrayLengthMatch(bundleId: string, lengths: number[]): void {
  const baseline = lengths[0];
  if (!lengths.every((value) => value === baseline)) {
    throw new Error(`Bundle ${bundleId} has misaligned route-ref arrays: ${lengths.join(", ")}`);
  }
}

type LegacyRouteProfile = {
  routeFamilyRef: string;
  routeFamilyLabel: string;
  shellType: KernelRouteSeed["shellType"];
  profileSelectionResolutionRefs: string[];
  accessibilitySemanticCoverageProfileRef: string;
  automationAnchorProfileRef: string;
  automationAnchorMapRef: string;
  surfaceStateSemanticsProfileRef: string;
  surfaceStateKernelBindingRef: string;
  keyboardModel: string;
  focusTransitionScope: string;
  landmarks: string[];
  breakpointCoverageRefs: BreakpointClass[];
  modeCoverageRefs: string[];
  requiredDomMarkers: string[];
  requiredDataAttributes: string[];
  verificationState: string;
};

type LegacyRouteProfilePayload = {
  routeProfiles: LegacyRouteProfile[];
};

type LegacyBundleRow = {
  designContractPublicationBundleId: string;
  audienceSurface: AudienceSurface;
  lintVerdictRef: string;
  visualTokenProfileRefs: string[];
  telemetryBindingProfileRefs: string[];
  artifactModePresentationProfileRefs: string[];
  designContractVocabularyTupleRefs: string[];
  structuralSnapshotRefs: string[];
};

type LegacyBundlePayload = {
  designContractPublicationBundles: LegacyBundleRow[];
};

function buildSeeds(): {
  routeSeeds: KernelRouteSeed[];
  bundleSeeds: KernelBundleSeed[];
} {
  const routePayload = readJson<LegacyRouteProfilePayload>(ROUTE_PROFILE_SOURCE_PATH);
  const legacyBundlePayload = readJson<LegacyBundlePayload>(LEGACY_BUNDLE_SOURCE_PATH);
  const routeSourceMap = new Map(routePayload.routeProfiles.map((row) => [row.routeFamilyRef, row]));
  const routeAugment = new Map<
    string,
    {
      audienceSurface: AudienceSurface;
      designContractPublicationBundleRef: string;
      lintVerdictRef: string;
      visualTokenProfileRef: string;
      telemetryBindingProfileRef: string;
      artifactModePresentationProfileRef: string;
      designContractVocabularyTupleRef: string;
    }
  >();

  const bundleSeeds: KernelBundleSeed[] = [];

  for (const bundle of legacyBundlePayload.designContractPublicationBundles) {
    assertArrayLengthMatch(bundle.designContractPublicationBundleId, [
      bundle.visualTokenProfileRefs.length,
      bundle.telemetryBindingProfileRefs.length,
      bundle.artifactModePresentationProfileRefs.length,
      bundle.designContractVocabularyTupleRefs.length,
    ]);

    const routeFamilyRefs = bundle.visualTokenProfileRefs.map(toRouteFamilyRef);
    bundleSeeds.push({
      designContractPublicationBundleId: bundle.designContractPublicationBundleId,
      lintVerdictRef: bundle.lintVerdictRef,
      audienceSurface: bundle.audienceSurface,
      shellType:
        routeSourceMap.get(routeFamilyRefs[0])?.shellType ??
        (() => {
          throw new Error(`Unable to resolve shell type for ${bundle.designContractPublicationBundleId}`);
        })(),
      routeFamilyRefs,
      structuralSnapshotRefs: bundle.structuralSnapshotRefs,
    });

    routeFamilyRefs.forEach((routeFamilyRef, index) => {
      routeAugment.set(routeFamilyRef, {
        audienceSurface: bundle.audienceSurface,
        designContractPublicationBundleRef: bundle.designContractPublicationBundleId,
        lintVerdictRef: bundle.lintVerdictRef,
        visualTokenProfileRef: bundle.visualTokenProfileRefs[index],
        telemetryBindingProfileRef: bundle.telemetryBindingProfileRefs[index],
        artifactModePresentationProfileRef: bundle.artifactModePresentationProfileRefs[index],
        designContractVocabularyTupleRef: bundle.designContractVocabularyTupleRefs[index],
      });
    });
  }

  const routeSeeds = routePayload.routeProfiles.map((routeProfile) => {
    const augment = routeAugment.get(routeProfile.routeFamilyRef);
    if (!augment) {
      throw new Error(`Route ${routeProfile.routeFamilyRef} is missing bundle augmentation.`);
    }
    return {
      routeFamilyRef: routeProfile.routeFamilyRef,
      routeFamilyLabel: routeProfile.routeFamilyLabel,
      shellType: routeProfile.shellType,
      audienceSurface: augment.audienceSurface,
      designContractPublicationBundleRef: augment.designContractPublicationBundleRef,
      lintVerdictRef: augment.lintVerdictRef,
      profileSelectionResolutionRefs: routeProfile.profileSelectionResolutionRefs,
      visualTokenProfileRef: augment.visualTokenProfileRef,
      accessibilitySemanticCoverageProfileRef:
        routeProfile.accessibilitySemanticCoverageProfileRef,
      automationAnchorProfileRef: routeProfile.automationAnchorProfileRef,
      automationAnchorMapRef: routeProfile.automationAnchorMapRef,
      surfaceStateSemanticsProfileRef: routeProfile.surfaceStateSemanticsProfileRef,
      surfaceStateKernelBindingRef: routeProfile.surfaceStateKernelBindingRef,
      telemetryBindingProfileRef: augment.telemetryBindingProfileRef,
      artifactModePresentationProfileRef: augment.artifactModePresentationProfileRef,
      designContractVocabularyTupleRef: augment.designContractVocabularyTupleRef,
      keyboardModel: routeProfile.keyboardModel,
      focusTransitionScope: routeProfile.focusTransitionScope,
      landmarks: routeProfile.landmarks,
      breakpointCoverageRefs: routeProfile.breakpointCoverageRefs,
      modeCoverageRefs: routeProfile.modeCoverageRefs,
      requiredDomMarkers: routeProfile.requiredDomMarkers,
      requiredDataAttributes: routeProfile.requiredDataAttributes,
      verificationState: routeProfile.verificationState,
    } satisfies KernelRouteSeed;
  });

  return {
    routeSeeds,
    bundleSeeds,
  };
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function buildBindingCsv(
  rows: readonly Record<string, string>[],
  headers: readonly string[],
): string {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

function formatJsonForTs(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildGeneratedSource(args: {
  publicationArtifact: UiContractKernelPublicationArtifact;
  lintArtifact: UiContractLintVerdictArtifact;
  automationArtifact: UiContractAutomationAnchorArtifact;
  accessibilityArtifact: UiContractAccessibilityArtifact;
  bindingRows: readonly Record<string, string>[];
}): string {
  const { publicationArtifact, lintArtifact, automationArtifact, accessibilityArtifact, bindingRows } =
    args;
  const summary = publicationArtifact.summary;

  return `import type {
  SurfaceStateKernelBindingCsvRow,
  UiContractAccessibilityArtifact,
  UiContractAutomationAnchorArtifact,
  UiContractKernelPublicationArtifact,
  UiContractLintVerdictArtifact,
} from "./ui-contract-kernel";

export const uiContractKernelPublication = ${formatJsonForTs(publicationArtifact)} as const satisfies UiContractKernelPublicationArtifact;

export const uiContractLintVerdictArtifact = ${formatJsonForTs(lintArtifact)} as const satisfies UiContractLintVerdictArtifact;

export const uiContractAutomationAnchorArtifact = ${formatJsonForTs(automationArtifact)} as const satisfies UiContractAutomationAnchorArtifact;

export const uiContractAccessibilityArtifact = ${formatJsonForTs(accessibilityArtifact)} as const satisfies UiContractAccessibilityArtifact;

export const uiContractSurfaceStateKernelBindingRows = ${formatJsonForTs(bindingRows)} as const satisfies readonly SurfaceStateKernelBindingCsvRow[];

export const uiContractKernelCatalog = {
  taskId: "${UI_CONTRACT_KERNEL_TASK_ID}",
  visualMode: "${UI_CONTRACT_KERNEL_VISUAL_MODE}",
  schemaArtifactPath: "${UI_CONTRACT_KERNEL_SCHEMA_PATH}",
  bundleCount: ${summary.bundle_count},
  routeFamilyCount: ${summary.route_family_count},
  exactBindingCount: ${summary.exact_binding_count},
  staleBindingCount: ${summary.stale_binding_count},
  blockedBindingCount: ${summary.blocked_binding_count},
  lintVerdictCount: ${lintArtifact.summary.lint_verdict_count},
  lintPassCount: ${lintArtifact.summary.pass_count},
  accessibilityProfileCount: ${accessibilityArtifact.summary.accessibility_profile_count},
  automationAnchorMapCount: ${automationArtifact.summary.automation_anchor_map_count},
  digestAlgorithm: "sha256:16",
} as const;

export const uiContractKernelSchemas = [
  {
    schemaId: "UiContractKernelPublicationArtifact",
    artifactPath: "${UI_CONTRACT_KERNEL_SCHEMA_PATH}",
    generatedByTask: "${UI_CONTRACT_KERNEL_TASK_ID}",
    bundleCount: ${summary.bundle_count},
    routeFamilyCount: ${summary.route_family_count},
    lintVerdictCount: ${lintArtifact.summary.lint_verdict_count},
  },
] as const;

export const uiContractPublicationBundles = uiContractKernelPublication.designContractPublicationBundles;
export const uiContractLintVerdicts = uiContractLintVerdictArtifact.designContractLintVerdicts;
export const uiContractAutomationAnchorMaps = uiContractAutomationAnchorArtifact.automationAnchorMaps;
export const uiContractAccessibilitySemanticCoverageProfiles = uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles;
`;
}

function renderCodeFenceJson(label: string, value: unknown): string {
  return `### ${label}

\`\`\`json
${JSON.stringify(value, null, 2)}
\`\`\``;
}

function buildPublicationDoc(publicationArtifact: UiContractKernelPublicationArtifact): string {
  const summary = publicationArtifact.summary;
  return `# 104 Canonical UI Contract Kernel Publication

` + [
    "This publication turns the canonical UI contract kernel into one executable, machine-readable contract plane for Vecells. Every route-family bundle now resolves visible state, automation markers, accessibility coverage, telemetry vocabulary, and artifact posture from the same kernel tuple.",
    `The current publication covers ${summary.route_family_count} route families across ${summary.bundle_count} audience-surface bundles, with ${summary.exact_binding_count} exact bindings, ${summary.stale_binding_count} safe-fallback stale bindings, and ${summary.blocked_binding_count} fail-closed blocked bindings.`,
    "The bundle artifact is production-grade rather than illustrative. It preserves the existing route-family and bundle refs from the earlier seq_050/seq_052 surfaces so later runtime publication work can consume the same identifiers without introducing alias drift.",
    "## What the Kernel Publishes",
    "- `VisualTokenProfile` for every route family, always bound to the canonical par_103 token export and the current layering policy.",
    "- `SurfaceStateSemanticsProfile` for every mocked route truth posture, resolved by the executable precedence equation rather than local component logic.",
    "- `SurfaceStateKernelBinding` proving whether accessibility, automation, telemetry, and artifact posture still agree as `exact`, `stale`, or `blocked`.",
    "- `DesignContractPublicationBundle` and `DesignContractLintVerdict` rows for every audience surface so release and runtime consumers can reason about design truth as a contract, not a screenshot.",
    "## Fail-Closed Rules",
    "- Accessibility coverage gaps remain blocked at the binding level and surface in the lint verdict instead of silently downgrading to advisory drift.",
    "- Artifact-mode uncertainty falls back to safe summary or handoff posture and emits `FOLLOW_ON_DEPENDENCY_ARTIFACT_MODE_*` rows.",
    "- `read_only` is published as an explicit display-state token through `GAP_RESOLUTION_KERNEL_EXECUTION_FORMAT_EFFECTIVE_DISPLAY_STATE_V1` so shells do not invent their own disabled-state semantics.",
    renderCodeFenceJson("Summary", publicationArtifact.summary),
  ].join("\n\n");
}

function buildBindingDoc(publicationArtifact: UiContractKernelPublicationArtifact): string {
  const blocked = publicationArtifact.surfaceStateKernelBindings.filter(
    (row) => row.bindingState === "blocked",
  );
  const stale = publicationArtifact.surfaceStateKernelBindings.filter(
    (row) => row.bindingState === "stale",
  );

  return `# 104 Surface State Kernel Binding Strategy

The binding strategy is now executable in code and directly inspectable in the Kernel Atlas studio.

## Binding Law

1. Resolve visible state through the kernel precedence equation.
2. Project the same winning state into \`SurfaceStateSemanticsProfile\`.
3. Bind accessibility, automation, telemetry, and artifact posture to the same vocabulary tuple.
4. Publish \`bindingState = exact | stale | blocked\` and fail closed when the tuple drifts.

## Current posture

- Blocked bindings: ${blocked.length}
- Stale bindings: ${stale.length}
- Exact bindings: ${publicationArtifact.summary.exact_binding_count}

## Coverage-driven blocking

The blocked bindings are currently restricted to route families whose accessibility coverage is still degraded under reduced motion, host resize, mission-stack, or buffered-update conditions. Those routes remain summary-first or recovery-first until the missing coverage is published as complete.

${renderCodeFenceJson("Gap Resolutions", publicationArtifact.gap_resolutions)}

${renderCodeFenceJson(
  "Coverage Gaps",
  publicationArtifact.kernel_coverage_gaps.map((row) => ({
    gapId: row.gapId,
    routeFamilyRef: row.routeFamilyRef,
    coverageState: row.coverageState,
    failClosedSurfaceState: row.failClosedSurfaceState,
  })),
)}
`;
}

function buildBundleDoc(
  publicationArtifact: UiContractKernelPublicationArtifact,
  lintArtifact: UiContractLintVerdictArtifact,
): string {
  return `# 104 Design Contract Publication Bundle Strategy

Each ` + "`DesignContractPublicationBundle`" + ` now acts as the contract join between route families, the canonical token export, the current kernel bindings, and the lint verdict that decides whether the bundle may remain published.

## Bundle strategy

- Bundle ids and route refs stay compatible with the existing seq_052 publication plane.
- Digest calculation is deterministic and includes token export, kernel propagation, accessibility tuple hashes, and the lint verdict id.
- Bundle publication is fail-closed: if any route in a bundle blocks or drifts, the bundle verdict blocks rather than claiming mixed-vocabulary calmness.

## Lint result

- Pass bundles: ${lintArtifact.summary.pass_count}
- Blocked bundles: ${lintArtifact.summary.blocked_count}

${renderCodeFenceJson(
  "Bundle Verdict Snapshot",
  lintArtifact.designContractLintVerdicts.map((row) => ({
    designContractLintVerdictId: row.designContractLintVerdictId,
    designContractPublicationBundleRef: row.designContractPublicationBundleRef,
    kernelStatePropagationState: row.kernelStatePropagationState,
    accessibilitySemanticCoverageState: row.accessibilitySemanticCoverageState,
    artifactModeParityState: row.artifactModeParityState,
    result: row.result,
  })),
)}
`;
}

function buildStudioHtml(
  publicationArtifact: UiContractKernelPublicationArtifact,
  lintArtifact: UiContractLintVerdictArtifact,
  bindingRows: readonly Record<string, string>[],
): string {
  const data = {
    publication: publicationArtifact,
    lint: lintArtifact,
    bindingRows,
    routeRootMarkers: UI_KERNEL_ROUTE_ROOT_MARKERS,
    precedence: {
      posturePriority: POSTURE_PRIORITY,
      stateClassPriority: STATE_CLASS_PRIORITY,
      freshnessPriority: FRESHNESS_PRIORITY,
      trustPriority: TRUST_PRIORITY,
      settlementPriority: SETTLEMENT_PRIORITY,
      writablePriority: WRITABLE_PRIORITY,
      artifactPriority: ARTIFACT_PRIORITY,
      tieBreakOrder: DISPLAY_STATE_TIE_BREAK_ORDER,
    },
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>104 UI Kernel Studio</title>
    <link rel="stylesheet" href="../../packages/design-system/src/foundation.css" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, color-mix(in oklab, var(--sys-surface-inset) 72%, transparent), transparent 32%),
          linear-gradient(180deg, color-mix(in oklab, var(--sys-surface-canvas) 94%, white), var(--sys-surface-canvas));
      }

      .kernel-shell {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        min-height: 100vh;
        transition: grid-template-columns 180ms ease;
      }

      .kernel-shell[data-rail-collapsed="true"] {
        grid-template-columns: 72px minmax(0, 1fr);
      }

      .kernel-rail {
        position: sticky;
        top: 0;
        height: 100vh;
        padding: 20px 16px;
        border-right: 1px solid var(--sys-border-subtle);
        background: color-mix(in oklab, var(--sys-surface-panel) 94%, var(--sys-surface-inset));
        overflow: auto;
      }

      .kernel-rail__head,
      .kernel-rail__cluster,
      .kernel-masthead__digest,
      .kernel-masthead__controls,
      .kernel-preview__summary,
      .kernel-inspector__grid,
      .kernel-precedence__grid,
      .kernel-propagation__legend,
      .kernel-lower-grid,
      .kernel-automation__grid,
      .kernel-accessibility__grid,
      .kernel-artifact__grid,
      .kernel-telemetry__list,
      .kernel-route-root__meta,
      .kernel-mode-strip,
      .kernel-preview__hero,
      .kernel-equivalence__grid,
      .chip-row {
        display: grid;
        gap: 12px;
      }

      .kernel-rail__head {
        gap: 16px;
      }

      .kernel-shell[data-rail-collapsed="true"] .rail-copy,
      .kernel-shell[data-rail-collapsed="true"] .bundle-card__copy,
      .kernel-shell[data-rail-collapsed="true"] .bundle-card__meta {
        display: none;
      }

      .kernel-shell[data-rail-collapsed="true"] .bundle-card {
        justify-items: center;
        text-align: center;
      }

      .kernel-main {
        padding: 0 24px 48px;
      }

      .kernel-frame {
        max-width: 1600px;
        margin: 0 auto;
      }

      .kernel-masthead {
        position: sticky;
        top: 0;
        z-index: 20;
        display: grid;
        gap: 16px;
        padding: 18px 0 20px;
        background: linear-gradient(180deg, color-mix(in oklab, var(--sys-surface-canvas) 98%, white), rgba(255, 255, 255, 0.85));
        backdrop-filter: blur(18px);
      }

      .kernel-summary-bar {
        min-height: 56px;
        padding: 16px 18px;
        border-radius: 18px;
        border: 1px solid var(--sys-border-subtle);
        background: color-mix(in oklab, var(--sys-surface-panel) 94%, white);
        display: grid;
        gap: 16px;
        grid-template-columns: minmax(0, 1.3fr) minmax(320px, 420px);
      }

      .kernel-summary-bar h1,
      .kernel-summary-bar p,
      .bundle-card h3,
      .kernel-panel h2,
      .kernel-panel h3,
      .kernel-panel p {
        margin: 0;
      }

      .kernel-masthead__copy {
        display: grid;
        gap: 10px;
        max-width: 74ch;
      }

      .kernel-masthead__controls {
        justify-items: end;
        align-content: start;
      }

      .chip-row {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .kernel-chip,
      .bundle-card,
      .kernel-panel,
      .kernel-route-root,
      .kernel-precedence__result,
      .kernel-mode-button,
      .kernel-rail button,
      select {
        border-radius: 18px;
        border: 1px solid var(--sys-border-subtle);
        background: color-mix(in oklab, var(--sys-surface-panel) 92%, white);
        color: var(--sys-text-default);
      }

      .kernel-chip {
        padding: 10px 12px;
        display: grid;
        gap: 4px;
      }

      .kernel-chip strong,
      .bundle-card strong,
      .kernel-panel strong,
      .kernel-route-root__hero strong {
        color: var(--sys-text-strong);
      }

      .bundle-card {
        width: 100%;
        text-align: left;
        padding: 14px;
        cursor: pointer;
        display: grid;
        gap: 8px;
      }

      .bundle-card[data-selected="true"] {
        border-color: var(--sys-state-active-border);
        box-shadow: var(--shadow-z2);
      }

      .bundle-card__meta {
        font-size: 12px;
        color: var(--sys-text-muted);
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .kernel-mode-strip {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .kernel-mode-group {
        display: grid;
        gap: 10px;
      }

      .kernel-mode-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .kernel-mode-button,
      .kernel-rail button,
      select {
        padding: 10px 12px;
        font: inherit;
      }

      .kernel-mode-button[data-selected="true"],
      .kernel-rail button[data-active="true"] {
        border-color: var(--sys-state-active-border);
        color: var(--sys-text-strong);
        background: color-mix(in oklab, var(--sys-surface-panel) 78%, var(--sys-state-active-soft));
      }

      .kernel-main-grid {
        display: grid;
        gap: 24px;
        grid-template-columns: minmax(640px, 1fr) clamp(320px, 28vw, 420px);
        align-items: start;
      }

      .kernel-panel {
        padding: 24px;
        display: grid;
        gap: 18px;
      }

      .kernel-preview__hero {
        grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
      }

      .kernel-route-root {
        padding: 24px;
        display: grid;
        gap: 18px;
        scroll-margin-top: 88px;
      }

      .kernel-route-root__hero {
        display: grid;
        gap: 12px;
      }

      .kernel-route-root__meta {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .route-chip {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid currentColor;
        color: inherit;
      }

      .kernel-lower-grid {
        margin-top: 24px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .kernel-lower-grid > .kernel-panel {
        min-height: 100%;
      }

      .kernel-precedence__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .kernel-precedence__controls {
        display: grid;
        gap: 12px;
      }

      .kernel-precedence__controls label {
        display: grid;
        gap: 6px;
      }

      .kernel-precedence__result {
        padding: 18px;
        gap: 10px;
      }

      .kernel-precedence__ladder {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .ladder-chip {
        min-height: 32px;
        padding: 0 12px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--sys-border-default);
        color: var(--sys-text-muted);
      }

      .ladder-chip[data-active="true"] {
        border-color: var(--sys-state-active-border);
        color: var(--sys-text-strong);
      }

      .kernel-propagation__svg {
        width: 100%;
        max-width: 720px;
        height: auto;
        border-radius: 18px;
        border: 1px solid var(--sys-border-subtle);
        background: color-mix(in oklab, var(--sys-surface-inset) 68%, white);
      }

      .kernel-propagation__legend,
      .kernel-automation__grid,
      .kernel-accessibility__grid,
      .kernel-artifact__grid,
      .kernel-equivalence__grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .kernel-panel pre {
        margin: 0;
        padding: 16px;
        border-radius: 16px;
        overflow: auto;
        background: #111827;
        color: #f9fafb;
        font-size: 12px;
        line-height: 1.5;
      }

      .kernel-table {
        width: 100%;
        border-collapse: collapse;
      }

      .kernel-table th,
      .kernel-table td {
        border-bottom: 1px solid var(--sys-border-subtle);
        padding: 10px 12px;
        text-align: left;
        font-size: 14px;
      }

      .kernel-table tbody tr {
        min-height: 40px;
      }

      .kernel-table code,
      .kernel-copy-muted {
        color: var(--sys-text-muted);
      }

      @media (max-width: 1280px) {
        .kernel-main-grid,
        .kernel-lower-grid,
        .kernel-summary-bar {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 920px) {
        .kernel-shell {
          grid-template-columns: 1fr;
        }

        .kernel-rail {
          position: static;
          height: auto;
          border-right: 0;
          border-bottom: 1px solid var(--sys-border-subtle);
        }

        .chip-row,
        .kernel-mode-strip,
        .kernel-preview__hero,
        .kernel-route-root__meta,
        .kernel-precedence__grid,
        .kernel-propagation__legend,
        .kernel-automation__grid,
        .kernel-accessibility__grid,
        .kernel-artifact__grid,
        .kernel-equivalence__grid {
          grid-template-columns: 1fr;
        }

        .kernel-main {
          padding: 0 16px 32px;
        }
      }
    </style>
  </head>
  <body data-theme="light" data-contrast="standard" data-density="balanced" data-motion="reduced">
    <div class="kernel-shell" data-testid="kernel-shell" data-rail-collapsed="false">
      <aside class="kernel-rail">
        <div class="kernel-rail__head">
          <button type="button" data-testid="rail-toggle">Toggle rail</button>
          <div class="rail-copy">
            <span class="foundation-kicker">Kernel Atlas</span>
            <strong>Canonical UI contract kernel</strong>
            <p class="kernel-copy-muted">One shared contract plane for tokens, state, accessibility, automation, telemetry, and artifact posture.</p>
          </div>
        </div>
        <div class="kernel-rail__cluster" data-testid="bundle-switcher"></div>
      </aside>
      <main class="kernel-main">
        <div class="kernel-frame">
          <header class="kernel-masthead" data-testid="kernel-masthead">
            <div class="kernel-summary-bar">
              <div class="kernel-masthead__copy">
                <span class="foundation-kicker">par_104</span>
                <h1>Kernel Atlas</h1>
                <p>Inspect bundle digests, lint verdicts, route-family bindings, and the precedence law that later shells must consume without forking local semantics.</p>
              </div>
              <div class="kernel-masthead__controls">
                <div class="chip-row kernel-masthead__digest" data-testid="masthead-digest-row"></div>
                <label>
                  <span class="foundation-kicker">Route family</span>
                  <select data-testid="route-family-selector"></select>
                </label>
              </div>
            </div>
            <section class="kernel-mode-strip" data-testid="mode-strip"></section>
          </header>
          <section class="kernel-main-grid">
            <article class="kernel-panel" data-testid="preview-plane">
              <div class="kernel-preview__hero">
                <div class="kernel-preview__summary">
                  <span class="foundation-kicker">Live preview</span>
                  <h2 id="preview-title">Route preview</h2>
                  <p id="preview-copy" class="kernel-copy-muted"></p>
                </div>
                <div class="kernel-preview__summary" data-testid="preview-summary-card"></div>
              </div>
              <section class="kernel-route-root" data-testid="preview-root" tabindex="-1">
                <div class="kernel-route-root__hero">
                  <span class="route-chip" data-testid="preview-tone-chip"></span>
                  <strong data-testid="preview-dominant-action"></strong>
                  <p data-testid="preview-reason" class="kernel-copy-muted"></p>
                </div>
                <div class="kernel-route-root__meta" data-testid="preview-meta-grid"></div>
              </section>
            </article>
            <aside class="kernel-panel" data-testid="inspector-panel">
              <span class="foundation-kicker">Inspector</span>
              <h2 id="inspector-title">Bundle contract inspector</h2>
              <div class="kernel-inspector__grid" data-testid="inspector-grid"></div>
              <pre data-testid="inspector-json"></pre>
            </aside>
          </section>
          <section class="kernel-lower-grid">
            <article class="kernel-panel" data-testid="precedence-visualizer">
              <span class="foundation-kicker">Precedence</span>
              <h2>State-precedence visualizer</h2>
              <div class="kernel-precedence__grid">
                <form class="kernel-precedence__controls" data-testid="precedence-controls"></form>
                <div class="kernel-precedence__result">
                  <strong data-testid="precedence-effective-tone"></strong>
                  <span data-testid="precedence-effective-state"></span>
                  <span data-testid="precedence-live-mode"></span>
                  <span data-testid="precedence-motion-intent"></span>
                  <span data-testid="precedence-binding-state"></span>
                  <div class="kernel-precedence__ladder" data-testid="precedence-ladder"></div>
                </div>
              </div>
              <table class="kernel-table" data-testid="precedence-table">
                <thead>
                  <tr>
                    <th>Axis</th>
                    <th>Value</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </article>
            <article class="kernel-panel" data-testid="propagation-diagram">
              <span class="foundation-kicker">Propagation</span>
              <h2>Kernel propagation</h2>
              <svg class="kernel-propagation__svg" viewBox="0 0 760 280" role="img" aria-labelledby="propagation-title">
                <title id="propagation-title">Surface truth to accessibility, automation, telemetry, and artifact mode propagation</title>
                <defs>
                  <linearGradient id="propGradient" x1="0" x2="1">
                    <stop offset="0%" stop-color="#3559E6" />
                    <stop offset="100%" stop-color="#0EA5A4" />
                  </linearGradient>
                </defs>
                <rect x="24" y="96" width="136" height="84" rx="18" fill="#F8FAFC" stroke="#CBD5E1" />
                <rect x="200" y="96" width="160" height="84" rx="18" fill="#F8FAFC" stroke="#CBD5E1" />
                <rect x="400" y="96" width="164" height="84" rx="18" fill="#F8FAFC" stroke="#CBD5E1" />
                <rect x="604" y="40" width="132" height="48" rx="16" fill="#F8FAFC" stroke="#CBD5E1" />
                <rect x="604" y="104" width="132" height="48" rx="16" fill="#F8FAFC" stroke="#CBD5E1" />
                <rect x="604" y="168" width="132" height="48" rx="16" fill="#F8FAFC" stroke="#CBD5E1" />
                <line x1="160" y1="138" x2="200" y2="138" stroke="url(#propGradient)" stroke-width="3" />
                <line x1="360" y1="138" x2="400" y2="138" stroke="url(#propGradient)" stroke-width="3" />
                <line x1="564" y1="122" x2="604" y2="64" stroke="url(#propGradient)" stroke-width="3" />
                <line x1="564" y1="138" x2="604" y2="128" stroke="url(#propGradient)" stroke-width="3" />
                <line x1="564" y1="154" x2="604" y2="192" stroke="url(#propGradient)" stroke-width="3" />
                <text x="46" y="124" font-size="13" fill="#334155">Surface truth</text>
                <text x="46" y="144" font-size="11" fill="#64748B">posture + state + trust</text>
                <text x="222" y="124" font-size="13" fill="#334155">State semantics</text>
                <text x="222" y="144" font-size="11" fill="#64748B">tone + live mode + motion</text>
                <text x="422" y="124" font-size="13" fill="#334155">Kernel binding</text>
                <text x="422" y="144" font-size="11" fill="#64748B">exact / stale / blocked</text>
                <text x="622" y="68" font-size="12" fill="#334155">Accessibility</text>
                <text x="622" y="132" font-size="12" fill="#334155">Automation</text>
                <text x="622" y="196" font-size="12" fill="#334155">Telemetry / artifact</text>
              </svg>
              <div class="kernel-propagation__legend" data-testid="propagation-legend"></div>
            </article>
            <article class="kernel-panel" data-testid="automation-panel">
              <span class="foundation-kicker">Automation</span>
              <h2>Automation anchor map</h2>
              <div class="kernel-automation__grid" data-testid="automation-grid"></div>
            </article>
            <article class="kernel-panel" data-testid="accessibility-panel">
              <span class="foundation-kicker">Accessibility</span>
              <h2>Accessibility coverage</h2>
              <div class="kernel-accessibility__grid" data-testid="accessibility-grid"></div>
            </article>
            <article class="kernel-panel" data-testid="artifact-panel">
              <span class="foundation-kicker">Artifact mode</span>
              <h2>Artifact posture</h2>
              <div class="kernel-artifact__grid" data-testid="artifact-grid"></div>
            </article>
            <article class="kernel-panel" data-testid="telemetry-panel">
              <span class="foundation-kicker">Telemetry</span>
              <h2>Telemetry vocabulary</h2>
              <pre data-testid="telemetry-list"></pre>
            </article>
            <article class="kernel-panel" data-testid="reduced-motion-equivalence">
              <span class="foundation-kicker">Reduced motion</span>
              <h2>Reduced-motion equivalence</h2>
              <div class="kernel-equivalence__grid" data-testid="equivalence-grid"></div>
            </article>
          </section>
        </div>
      </main>
    </div>
    <script>
      const DATA = ${JSON.stringify(data)};
      const state = {
        selectedBundleId: DATA.publication.designContractPublicationBundles[0].designContractPublicationBundleId,
        selectedRouteFamilyRef: DATA.publication.designContractPublicationBundles[0].routeFamilyRefs[0],
        theme: "light",
        contrast: "standard",
        density: "balanced",
        motion: "reduced",
        railCollapsed: false,
        precedence: {
          postureState: "ready",
          stateClass: "settled",
          freshnessState: "fresh",
          trustState: "trusted",
          settlementState: "settled",
          writableState: "writable",
          artifactModeState: "preview_verified",
        },
      };

      const verdictByBundleId = new Map(DATA.lint.designContractLintVerdicts.map((row) => [row.designContractPublicationBundleRef, row]));
      const scenarioByRouteFamily = new Map(DATA.publication.studio_scenarios.map((row) => [row.routeFamilyRef, row]));
      const semanticsByRouteFamily = new Map(DATA.publication.surfaceStateSemanticsProfiles.map((row) => [row.surfaceRef, row]));
      const accessibilityByRouteFamily = new Map(DATA.publication.accessibilitySemanticCoverageProfiles.map((row) => [row.routeFamilyRef, row]));
      const automationByRouteFamily = new Map(DATA.publication.automationAnchorMaps.map((row) => [row.surfaceRef, row]));
      const telemetryByRouteFamily = new Map(DATA.publication.telemetryBindingProfiles.map((row) => [row.surfaceRef, row]));
      const artifactByRouteFamily = new Map(DATA.publication.artifactModePresentationProfiles.map((row) => [row.artifactModePresentationProfileId, row]));
      const bundleById = new Map(DATA.publication.designContractPublicationBundles.map((row) => [row.designContractPublicationBundleId, row]));
      const bindingRowByRouteFamily = new Map(DATA.bindingRows.map((row) => [row.route_family_ref, row]));

      function routeLabel(routeFamilyRef) {
        return routeFamilyRef.replace(/^rf_/, "").split("_").map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join(" ");
      }

      function currentBundle() {
        return bundleById.get(state.selectedBundleId) ?? DATA.publication.designContractPublicationBundles[0];
      }

      function currentRouteFamilyRef() {
        const bundle = currentBundle();
        if (!bundle.routeFamilyRefs.includes(state.selectedRouteFamilyRef)) {
          state.selectedRouteFamilyRef = bundle.routeFamilyRefs[0];
        }
        return state.selectedRouteFamilyRef;
      }

      function currentScenario() {
        return scenarioByRouteFamily.get(currentRouteFamilyRef());
      }

      function currentVerdict() {
        return verdictByBundleId.get(currentBundle().designContractPublicationBundleId);
      }

      function currentAutomation() {
        return automationByRouteFamily.get(currentRouteFamilyRef());
      }

      function currentAccessibility() {
        return accessibilityByRouteFamily.get(currentRouteFamilyRef());
      }

      function currentTelemetry() {
        return telemetryByRouteFamily.get(currentRouteFamilyRef());
      }

      function computePrecedence(inputs) {
        const severity = Math.max(
          DATA.precedence.posturePriority[inputs.postureState],
          DATA.precedence.stateClassPriority[inputs.stateClass],
          DATA.precedence.freshnessPriority[inputs.freshnessState],
          DATA.precedence.trustPriority[inputs.trustState],
          DATA.precedence.settlementPriority[inputs.settlementState],
          DATA.precedence.writablePriority[inputs.writableState],
          DATA.precedence.artifactPriority[inputs.artifactModeState],
        );

        let effectiveDisplayState = "ready";
        if (inputs.stateClass === "blocked" || inputs.freshnessState === "disconnected" || inputs.trustState === "blocked" || inputs.settlementState === "failed" || inputs.settlementState === "expired" || inputs.writableState === "blocked" || inputs.artifactModeState === "blocked") {
          effectiveDisplayState = "blocked";
        } else if (inputs.stateClass === "recovery" || inputs.writableState === "recovery_only" || inputs.postureState === "blocked_recovery") {
          effectiveDisplayState = "recovery";
        } else if (inputs.stateClass === "degraded" || inputs.trustState === "degraded" || inputs.artifactModeState === "preview_degraded") {
          effectiveDisplayState = "degraded";
        } else if (inputs.stateClass === "stale" || inputs.freshnessState === "stale" || inputs.postureState === "stale_review" || inputs.settlementState === "review_required") {
          effectiveDisplayState = "stale";
        } else if (inputs.postureState === "read_only" || inputs.writableState === "read_only") {
          effectiveDisplayState = "read_only";
        } else if (inputs.postureState === "settled_pending_confirmation" || inputs.settlementState === "server_accepted" || inputs.settlementState === "awaiting_external" || inputs.settlementState === "projection_seen") {
          effectiveDisplayState = "settled_pending_confirmation";
        } else if (inputs.postureState === "loading_summary" || inputs.stateClass === "loading") {
          effectiveDisplayState = "loading";
        } else if (inputs.postureState === "empty_actionable" || inputs.postureState === "empty_informational" || inputs.stateClass === "empty") {
          effectiveDisplayState = "empty";
        } else if (inputs.stateClass === "sparse") {
          effectiveDisplayState = "sparse";
        }

        const tones = {
          blocked: "accent_danger",
          recovery: "accent_review",
          degraded: "accent_review",
          stale: "accent_review",
          read_only: "neutral",
          settled_pending_confirmation: "accent_active",
          loading: "neutral",
          empty: "accent_insight",
          sparse: "neutral",
          ready: "accent_active",
        };
        const liveModes = {
          blocked: "assertive",
          recovery: "assertive",
          degraded: inputs.settlementState === "review_required" ? "assertive" : "polite",
          stale: inputs.settlementState === "review_required" ? "assertive" : "polite",
          read_only: "polite",
          settled_pending_confirmation: "polite",
          loading: "polite",
          empty: "polite",
          sparse: "polite",
          ready: "off",
        };
        const motions = {
          blocked: "motion.escalate",
          recovery: "motion.recover",
          degraded: "motion.degrade",
          stale: "motion.degrade",
          read_only: "motion.degrade",
          settled_pending_confirmation: "motion.pending",
          loading: "motion.reveal",
          empty: "motion.reveal",
          sparse: "motion.morph",
          ready: "motion.morph",
        };

        return {
          effectiveSeverity: severity,
          effectiveDisplayState,
          effectiveTone: tones[effectiveDisplayState],
          ariaLiveMode: liveModes[effectiveDisplayState],
          motionIntentRef: motions[effectiveDisplayState],
        };
      }

      function renderBundleCards() {
        const host = document.querySelector("[data-testid='bundle-switcher']");
        host.innerHTML = "";
        DATA.publication.designContractPublicationBundles.forEach((bundle) => {
          const verdict = verdictByBundleId.get(bundle.designContractPublicationBundleId);
          const button = document.createElement("button");
          button.type = "button";
          button.className = "bundle-card";
          button.dataset.bundleId = bundle.designContractPublicationBundleId;
          button.dataset.selected = String(bundle.designContractPublicationBundleId === state.selectedBundleId);
          button.dataset.active = String(bundle.designContractPublicationBundleId === state.selectedBundleId);
          button.setAttribute(
            "data-testid",
            "bundle-card-" +
              bundle.designContractPublicationBundleId.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
          );
          button.innerHTML =
            '<div class="bundle-card__copy">' +
            '<span class="foundation-kicker">' +
            bundle.audienceSurface +
            "</span>" +
            "<h3>" +
            bundle.designContractPublicationBundleId +
            "</h3>" +
            "</div>" +
            '<div class="bundle-card__meta">' +
            "<span>" +
            bundle.routeFamilyRefs.length +
            " routes</span>" +
            "<span>" +
            (verdict?.result ?? "blocked") +
            "</span>" +
            "</div>";
          button.addEventListener("click", () => {
            state.selectedBundleId = bundle.designContractPublicationBundleId;
            state.selectedRouteFamilyRef = bundle.routeFamilyRefs[0];
            render();
          });
          host.appendChild(button);
        });
      }

      function renderRouteSelector() {
        const select = document.querySelector("[data-testid='route-family-selector']");
        const bundle = currentBundle();
        select.innerHTML = "";
        bundle.routeFamilyRefs.forEach((routeFamilyRef) => {
          const option = document.createElement("option");
          option.value = routeFamilyRef;
          option.textContent = routeLabel(routeFamilyRef);
          option.selected = routeFamilyRef === currentRouteFamilyRef();
          select.appendChild(option);
        });
        select.onchange = (event) => {
          state.selectedRouteFamilyRef = event.target.value;
          render();
        };
      }

      function modeButton(label, group, value, currentValue) {
        return (
          '<button type="button" class="kernel-mode-button" data-testid="mode-' +
          group +
          "-" +
          value +
          '" data-group="' +
          group +
          '" data-value="' +
          value +
          '" data-selected="' +
          String(value === currentValue) +
          '">' +
          label +
          "</button>"
        );
      }

      function renderModeStrip() {
        const host = document.querySelector("[data-testid='mode-strip']");
        host.innerHTML = [
          '<section class="kernel-mode-group">',
          '<span class="foundation-kicker">Theme</span>',
          '<div class="kernel-mode-buttons">',
          modeButton("Light", "theme", "light", state.theme),
          modeButton("Dark", "theme", "dark", state.theme),
          "</div>",
          "</section>",
          '<section class="kernel-mode-group">',
          '<span class="foundation-kicker">Contrast</span>',
          '<div class="kernel-mode-buttons">',
          modeButton("Standard", "contrast", "standard", state.contrast),
          modeButton("High", "contrast", "high", state.contrast),
          "</div>",
          "</section>",
          '<section class="kernel-mode-group">',
          '<span class="foundation-kicker">Density</span>',
          '<div class="kernel-mode-buttons">',
          modeButton("Relaxed", "density", "relaxed", state.density),
          modeButton("Balanced", "density", "balanced", state.density),
          modeButton("Compact", "density", "compact", state.density),
          "</div>",
          "</section>",
          '<section class="kernel-mode-group">',
          '<span class="foundation-kicker">Motion</span>',
          '<div class="kernel-mode-buttons">',
          modeButton("Full", "motion", "full", state.motion),
          modeButton("Reduced", "motion", "reduced", state.motion),
          modeButton("Essential", "motion", "essential_only", state.motion),
          "</div>",
          "</section>",
        ].join("");
        host.querySelectorAll(".kernel-mode-button").forEach((button) => {
          button.addEventListener("click", () => {
            state[button.dataset.group] = button.dataset.value;
            render();
          });
        });
      }

      function renderDigestRow() {
        const host = document.querySelector("[data-testid='masthead-digest-row']");
        const bundle = currentBundle();
        const verdict = currentVerdict();
        const scenario = currentScenario();
        host.innerHTML = [
          '<article class="kernel-chip"><span class="foundation-kicker">Digest</span><strong>',
          bundle.designContractDigestRef,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Lint</span><strong>',
          verdict.result,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Mode tuple</span><strong data-testid="mode-tuple-summary">',
          state.theme,
          " / ",
          state.contrast,
          " / ",
          state.density,
          " / ",
          state.motion,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Binding</span><strong>',
          scenario.bindingState,
          "</strong></article>",
        ].join("");
      }

      function renderPreview() {
        const bundle = currentBundle();
        const scenario = currentScenario();
        const semantics = semanticsByRouteFamily.get(currentRouteFamilyRef());
        const accessibility = currentAccessibility();
        const bindingRow = bindingRowByRouteFamily.get(currentRouteFamilyRef());
        const verdict = currentVerdict();
        const preview = document.querySelector("[data-testid='preview-root']");
        preview.dataset.designContractDigest = bundle.designContractDigestRef;
        preview.dataset.designContractState = bundle.publicationState;
        preview.dataset.designContractLintState = verdict.result;
        preview.dataset.accessibilityCoverageState = accessibility.coverageState;
        preview.dataset.semanticSurface = accessibility.semanticSurfaceRefs[0];
        preview.dataset.keyboardModel = accessibility.keyboardInteractionContractRefs[0];
        preview.dataset.focusTransitionScope = accessibility.focusTransitionContractRefs[0];
        preview.dataset.liveAnnounceState = semantics.ariaLiveMode;
        preview.dataset.shellType = bundle.shellType;
        preview.dataset.channelProfile = bundle.audienceSurface;
        preview.dataset.routeFamily = currentRouteFamilyRef();
        preview.dataset.layoutTopology = bundle.shellType === "operations" ? "three_plane" : "two_plane";
        preview.dataset.breakpointClass = "medium";
        preview.dataset.densityProfile = state.density;
        preview.dataset.surfaceState = semantics.effectiveDisplayState;
        preview.dataset.stateOwner = semantics.statusOwnerRef;
        preview.dataset.stateReason = semantics.surfaceStateFrameRef;
        preview.dataset.writableState = scenario.writableState;
        preview.dataset.dominantAction = currentAutomation().dominantActionMarkerRef;
        preview.dataset.anchorId = currentAutomation().selectedAnchorMarkerRef;
        preview.dataset.anchorState = scenario.bindingState;
        preview.dataset.artifactStage = semantics.artifactStageRef;
        preview.dataset.artifactMode = scenario.artifactModeState;
        preview.dataset.transferState = scenario.artifactPosture;
        preview.dataset.continuityKey = currentRouteFamilyRef() + "::continuity";
        preview.dataset.returnAnchor = "return_anchor." + currentRouteFamilyRef();

        document.querySelector("#preview-title").textContent = routeLabel(currentRouteFamilyRef());
        document.querySelector("#preview-copy").textContent = bundle.audienceSurface;
        document.querySelector("[data-testid='preview-tone-chip']").textContent = semantics.effectiveTone;
        document.querySelector("[data-testid='preview-dominant-action']").textContent = scenario.dominantActionLabel;
        document.querySelector("[data-testid='preview-reason']").textContent = scenario.selectedAnchorLabel;
        document.querySelector("[data-testid='preview-summary-card']").innerHTML = [
          '<span class="foundation-kicker">Route markers</span>',
          "<strong>",
          bindingRow.binding_state,
          " / ",
          semantics.effectiveDisplayState,
          "</strong>",
          '<span class="kernel-copy-muted">',
          currentAutomation().dominantActionMarkerRef,
          "</span>",
        ].join("");
        document.querySelector("[data-testid='preview-meta-grid']").innerHTML = [
          '<article class="kernel-chip"><span class="foundation-kicker">Coverage</span><strong>',
          accessibility.coverageState,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">aria-live</span><strong>',
          semantics.ariaLiveMode,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Motion</span><strong>',
          semantics.motionIntentRef,
          "</strong></article>",
        ].join("");
      }

      function renderInspector() {
        const bundle = currentBundle();
        const verdict = currentVerdict();
        const routeFamilyRef = currentRouteFamilyRef();
        const semantics = semanticsByRouteFamily.get(routeFamilyRef);
        const accessibility = currentAccessibility();
        const automation = currentAutomation();
        const telemetry = currentTelemetry();
        document.querySelector("#inspector-title").textContent =
          bundle.designContractPublicationBundleId;
        document.querySelector("[data-testid='inspector-grid']").innerHTML = [
          '<article class="kernel-chip"><span class="foundation-kicker">Audience</span><strong>',
          bundle.audienceSurface,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Lint verdict</span><strong>',
          verdict.result,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Display state</span><strong>',
          semantics.effectiveDisplayState,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Coverage tuple</span><strong>',
          accessibility.coverageTupleHash,
          "</strong></article>",
        ].join("");
        document.querySelector("[data-testid='inspector-json']").textContent = JSON.stringify({
          routeFamilyRef,
          designContractDigestRef: bundle.designContractDigestRef,
          semantics,
          accessibilityCoverageState: accessibility.coverageState,
          automationAnchorMapId: automation.automationAnchorMapId,
          telemetryBindingProfileId: telemetry.telemetryBindingProfileId,
        }, null, 2);
      }

      function renderPrecedence() {
        const form = document.querySelector("[data-testid='precedence-controls']");
        const options = {
          postureState: Object.keys(DATA.precedence.posturePriority),
          stateClass: Object.keys(DATA.precedence.stateClassPriority),
          freshnessState: Object.keys(DATA.precedence.freshnessPriority),
          trustState: Object.keys(DATA.precedence.trustPriority),
          settlementState: Object.keys(DATA.precedence.settlementPriority),
          writableState: Object.keys(DATA.precedence.writablePriority),
          artifactModeState: Object.keys(DATA.precedence.artifactPriority),
        };

        form.innerHTML = Object.entries(options)
          .map(([key, values]) => {
            const optionsHtml = values
              .map((value) => {
                const selected = state.precedence[key] === value ? " selected" : "";
                return (
                  '<option value="' + value + '"' + selected + ">" + value + "</option>"
                );
              })
              .join("");
            return (
              "<label>" +
              '<span class="foundation-kicker">' +
              key +
              "</span>" +
              '<select data-testid="precedence-' +
              key +
              '">' +
              optionsHtml +
              "</select>" +
              "</label>"
            );
          })
          .join("");

        form.querySelectorAll("select").forEach((select) => {
          select.addEventListener("change", (event) => {
            state.precedence[event.target.dataset.testid.replace("precedence-", "")] = event.target.value;
            renderPrecedence();
          });
        });

        const result = computePrecedence(state.precedence);
        const scenario = currentScenario();
        document.querySelector("[data-testid='precedence-effective-tone']").textContent =
          "Tone: " + result.effectiveTone;
        document.querySelector("[data-testid='precedence-effective-state']").textContent =
          "State: " + result.effectiveDisplayState;
        document.querySelector("[data-testid='precedence-live-mode']").textContent =
          "aria-live: " + result.ariaLiveMode;
        document.querySelector("[data-testid='precedence-motion-intent']").textContent =
          "Motion: " + result.motionIntentRef;
        document.querySelector("[data-testid='precedence-binding-state']").textContent =
          "Automation anchor: " +
          currentAutomation().dominantActionMarkerRef +
          " / binding " +
          scenario.bindingState;
        document.querySelector("[data-testid='precedence-ladder']").innerHTML =
          DATA.precedence.tieBreakOrder
            .map(
              (stateName) =>
                '<span class="ladder-chip" data-active="' +
                String(stateName === result.effectiveDisplayState) +
                '">' +
                stateName +
                "</span>",
            )
            .join("");
        document.querySelector("[data-testid='precedence-table'] tbody").innerHTML = [
          ["postureState", state.precedence.postureState, DATA.precedence.posturePriority[state.precedence.postureState]],
          ["stateClass", state.precedence.stateClass, DATA.precedence.stateClassPriority[state.precedence.stateClass]],
          ["freshnessState", state.precedence.freshnessState, DATA.precedence.freshnessPriority[state.precedence.freshnessState]],
          ["trustState", state.precedence.trustState, DATA.precedence.trustPriority[state.precedence.trustState]],
          ["settlementState", state.precedence.settlementState, DATA.precedence.settlementPriority[state.precedence.settlementState]],
          ["writableState", state.precedence.writableState, DATA.precedence.writablePriority[state.precedence.writableState]],
          ["artifactModeState", state.precedence.artifactModeState, DATA.precedence.artifactPriority[state.precedence.artifactModeState]],
        ]
          .map(
            ([axis, value, priority]) =>
              "<tr><td>" +
              axis +
              "</td><td>" +
              value +
              "</td><td>" +
              priority +
              "</td></tr>",
          )
          .join("");
      }

      function renderPropagation() {
        document.querySelector("[data-testid='propagation-legend']").innerHTML = [
          '<article class="kernel-chip"><span class="foundation-kicker">Source</span><strong>surface truth</strong></article>',
          '<article class="kernel-chip"><span class="foundation-kicker">Bind</span><strong>same vocabulary tuple</strong></article>',
          '<article class="kernel-chip"><span class="foundation-kicker">Fail closed</span><strong>blocked or summary-first</strong></article>',
          '<article class="kernel-chip"><span class="foundation-kicker">Static parity</span><strong>reduced motion keeps ordering exact</strong></article>',
        ].join("");
      }

      function renderAutomation() {
        const automation = currentAutomation();
        document.querySelector("[data-testid='automation-grid']").innerHTML = [
          '<article class="kernel-chip"><span class="foundation-kicker">Dominant action</span><strong>',
          automation.dominantActionMarkerRef,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Selected anchor</span><strong>',
          automation.selectedAnchorMarkerRef,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Artifact marker</span><strong>',
          automation.artifactMarkerRef,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Continuity marker</span><strong>',
          automation.continuityMarkerRef,
          "</strong></article>",
        ].join("");
      }

      function renderAccessibility() {
        const accessibility = currentAccessibility();
        document.querySelector("[data-testid='accessibility-grid']").innerHTML = [
          '<article class="kernel-chip"><span class="foundation-kicker">Coverage state</span><strong>',
          accessibility.coverageState,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Reduced motion</span><strong>',
          accessibility.reducedMotionEquivalenceRef,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Mission stack</span><strong>',
          accessibility.missionStackCoverageRef,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Buffered update</span><strong>',
          accessibility.bufferedUpdateCoverageRefs.join(", "),
          "</strong></article>",
        ].join("");
      }

      function renderArtifact() {
        const bundle = currentBundle();
        const row = currentTelemetry();
        const artifactRef = bundle.artifactModePresentationProfileRefs[bundle.routeFamilyRefs.indexOf(currentRouteFamilyRef())];
        const artifact = artifactByRouteFamily.get(artifactRef);
        document.querySelector("[data-testid='artifact-grid']").innerHTML = [
          '<article class="kernel-chip"><span class="foundation-kicker">Preview</span><strong>',
          artifact.previewPolicyRef,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Print</span><strong>',
          artifact.printPolicyRef,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Download</span><strong>',
          artifact.downloadPolicyRef,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Handoff</span><strong>',
          artifact.handoffPolicyRef,
          "</strong></article>",
        ].join("");
      }

      function renderTelemetry() {
        document.querySelector("[data-testid='telemetry-list']").textContent = JSON.stringify({
          requiredUiEventRefs: currentTelemetry().requiredUiEventRefs,
          requiredDomMarkerSchemaRef: currentTelemetry().requiredDomMarkerSchemaRef,
          redactionProfileRef: currentTelemetry().redactionProfileRef,
        }, null, 2);
      }

      function renderEquivalence() {
        const scenario = currentScenario();
        document.querySelector("[data-testid='equivalence-grid']").innerHTML = [
          '<article class="kernel-chip"><span class="foundation-kicker">Static equivalent</span><strong>',
          scenario.effectiveDisplayState,
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Ordering</span><strong>focus -> announcement -> action</strong></article>',
          '<article class="kernel-chip"><span class="foundation-kicker">Reduced motion active</span><strong>',
          String(state.motion !== "full"),
          "</strong></article>",
          '<article class="kernel-chip"><span class="foundation-kicker">Anchor preserved</span><strong>',
          currentAutomation().selectedAnchorMarkerRef,
          "</strong></article>",
        ].join("");
      }

      function renderBodyMode() {
        document.body.dataset.theme = state.theme;
        document.body.dataset.contrast = state.contrast;
        document.body.dataset.density = state.density;
        document.body.dataset.motion = state.motion;
        document.body.dataset.reducedMotion = String(state.motion !== "full");
      }

      function render() {
        document.querySelector("[data-testid='kernel-shell']").dataset.railCollapsed = String(state.railCollapsed);
        renderBodyMode();
        renderBundleCards();
        renderRouteSelector();
        renderModeStrip();
        renderDigestRow();
        renderPreview();
        renderInspector();
        renderPrecedence();
        renderPropagation();
        renderAutomation();
        renderAccessibility();
        renderArtifact();
        renderTelemetry();
        renderEquivalence();
      }

      document.querySelector("[data-testid='rail-toggle']").addEventListener("click", () => {
        state.railCollapsed = !state.railCollapsed;
        render();
      });

      render();
    </script>
  </body>
</html>
`;
}

function main(): void {
  const { routeSeeds, bundleSeeds } = buildSeeds();
  const generatedAt = new Date().toISOString().replace(".000Z", "Z");
  const capturedOn = generatedAt.slice(0, 10);
  const { publicationArtifact, lintArtifact, automationArtifact, accessibilityArtifact, surfaceStateKernelBindingRows } =
    buildUiContractKernelArtifacts({
      generatedAt,
      capturedOn,
      routeSeeds,
      bundleSeeds,
    });

  writeJson(PUBLICATION_ARTIFACT_PATH, publicationArtifact);
  writeJson(LINT_ARTIFACT_PATH, lintArtifact);
  writeJson(AUTOMATION_ARTIFACT_PATH, automationArtifact);
  writeJson(ACCESSIBILITY_ARTIFACT_PATH, accessibilityArtifact);

  const bindingRowObjects = surfaceStateKernelBindingRows.map((row) => ({
    surface_state_kernel_binding_id: row.surface_state_kernel_binding_id,
    route_family_ref: row.route_family_ref,
    audience_surface: row.audience_surface,
    shell_type: row.shell_type,
    binding_state: row.binding_state,
    accessibility_coverage_state: row.accessibility_coverage_state,
    artifact_mode_state: row.artifact_mode_state,
    effective_display_state: row.effective_display_state,
    effective_tone: row.effective_tone,
    aria_live_mode: row.aria_live_mode,
    motion_intent_ref: row.motion_intent_ref,
    dominant_action_marker_ref: row.dominant_action_marker_ref,
    selected_anchor_marker_ref: row.selected_anchor_marker_ref,
    kernel_propagation_digest_ref: row.kernel_propagation_digest_ref,
    design_contract_digest_ref: row.design_contract_digest_ref,
  }));

  writeText(
    BINDING_CSV_PATH,
    buildBindingCsv(bindingRowObjects, Object.keys(bindingRowObjects[0])),
  );

  writeText(PUBLICATION_DOC_PATH, buildPublicationDoc(publicationArtifact));
  writeText(BINDING_DOC_PATH, buildBindingDoc(publicationArtifact));
  writeText(BUNDLE_DOC_PATH, buildBundleDoc(publicationArtifact, lintArtifact));
  writeText(STUDIO_HTML_PATH, buildStudioHtml(publicationArtifact, lintArtifact, bindingRowObjects));
  writeText(
    GENERATED_SOURCE_PATH,
    buildGeneratedSource({
      publicationArtifact,
      lintArtifact,
      automationArtifact,
      accessibilityArtifact,
      bindingRows: bindingRowObjects,
    }),
  );

  process.stdout.write(`Built ${UI_CONTRACT_KERNEL_TASK_ID} UI contract kernel artifacts.\n`);
}

main();
