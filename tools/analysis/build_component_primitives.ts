import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "../../packages/design-system/node_modules/react/index.js";
import { renderToStaticMarkup } from "../../packages/design-system/node_modules/react-dom/server.js";
import {
  COMPONENT_PRIMITIVES_PUBLICATION_PATH,
  COMPONENT_PRIMITIVES_SCHEMA_PATH,
  COMPONENT_PRIMITIVES_TASK_ID,
  COMPONENT_PRIMITIVES_VISUAL_MODE,
  buildComponentPrimitiveArtifacts,
  componentAtlasSections,
  renderAtlasSupplementalShelf,
  renderSpecimenComposition,
  shellProfileLenses,
  specimenCompositions,
  type SpecimenId,
} from "../../packages/design-system/src/component-primitives";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(ROOT, "data", "analysis");
const DOCS_DIR = path.join(ROOT, "docs", "architecture");
const PACKAGE_DIR = path.join(ROOT, "packages", "design-system");
const SOURCE_DIR = path.join(PACKAGE_DIR, "src");
const CONTRACTS_DIR = path.join(PACKAGE_DIR, "contracts");

const PUBLICATION_PATH = path.join(DATA_DIR, "component_primitive_publication.json");
const BINDING_MATRIX_PATH = path.join(DATA_DIR, "component_binding_matrix.csv");
const AUTOMATION_MATRIX_PATH = path.join(
  DATA_DIR,
  "component_automation_anchor_matrix.json",
);
const ACCESSIBILITY_MATRIX_PATH = path.join(
  DATA_DIR,
  "component_accessibility_coverage_matrix.csv",
);

const DOC_BINDINGS_PATH = path.join(
  DOCS_DIR,
  "105_shared_component_primitives_and_token_bindings.md",
);
const DOC_API_PATH = path.join(
  DOCS_DIR,
  "105_component_api_and_surface_role_contracts.md",
);
const ATLAS_PATH = path.join(DOCS_DIR, "105_component_atlas.html");

const GENERATED_SOURCE_PATH = path.join(SOURCE_DIR, "component-primitives.generated.ts");
const SCHEMA_PATH = path.join(CONTRACTS_DIR, "component-primitives.schema.json");
const FOUNDATION_CSS_PATH = path.join(SOURCE_DIR, "foundation.css");
const COMPONENT_CSS_PATH = path.join(SOURCE_DIR, "component-primitives.css");

function writeText(filePath: string, value: string): void {
  fs.writeFileSync(filePath, value, "utf8");
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function buildCsv(rows: readonly Record<string, string>[], headers: readonly string[]): string {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] ?? "")).join(",")),
  ].join("\n").concat("\n");
}

function renderSpecimenMarkup(specimenId: SpecimenId): string {
  return renderToStaticMarkup(
    createElement("div", { className: "component-primitives" }, renderSpecimenComposition(specimenId)),
  );
}

function renderSupplementalShelfMarkup(): string {
  return renderToStaticMarkup(
    createElement("div", { className: "component-primitives" }, renderAtlasSupplementalShelf()),
  );
}

function buildTaxonomyDiagramSvg(): string {
  const familyRows = [
    ["Shell plane", "ShellFrame", "ShellRail", "ShellHeader", "SharedStatusStrip"],
    ["Semantic", "CasePulse", "StateBraid", "DecisionDock", "SelectedAnchorStub"],
    ["Surface roles", "BoardSurface", "TaskSurface", "TableSurface", "ArtifactSurface"],
    ["Controls", "QuietPrimaryButton", "SegmentedTabs", "InputFieldFrame", "CheckboxRadioFrame"],
    ["State postures", "LoadingSkeleton", "StaleStateFrame", "BlockedStateFrame", "RecoveryStateFrame"],
    ["Visualization", "ComparisonLedger", "BoundedVisualizationPanel"],
  ];
  const rowHeight = 52;
  const width = 700;
  const height = 72 + familyRows.length * rowHeight;
  const rows = familyRows
    .map((row, index) => {
      const y = 24 + index * rowHeight;
      const cells = row
        .map((cell, cellIndex) => {
          const x = 18 + cellIndex * 165;
          return `
            <rect x="${x}" y="${y}" width="${cellIndex === 0 ? 130 : 150}" height="34" rx="14" fill="${
              cellIndex === 0 ? "rgba(49, 83, 214, 0.12)" : "rgba(255,255,255,0.82)"
            }" stroke="rgba(87, 104, 129, 0.22)" />
            <text x="${x + 12}" y="${y + 22}" font-size="12" fill="currentColor">${cell}</text>
          `;
        })
        .join("");
      return cells;
    })
    .join("");
  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="Component taxonomy diagram">
      <rect width="${width}" height="${height}" fill="transparent" />
      <text x="18" y="18" font-size="13" font-weight="700" fill="currentColor">Component taxonomy</text>
      ${rows}
    </svg>
  `;
}

function buildDensityDiagramSvg(): string {
  const rows = [
    { label: "Patient mission", density: "quiet", fill: "#DCE8FF" },
    { label: "Workspace mission", density: "mixed", fill: "#E7E8FF" },
    { label: "Operations preview", density: "dense", fill: "#F8E6C6" },
    { label: "Governance review", density: "mixed", fill: "#F8E6C6" },
  ];
  const width = 640;
  const height = 250;
  const bars = rows
    .map((row, index) => {
      const y = 34 + index * 48;
      const barWidth = row.density === "quiet" ? 180 : row.density === "mixed" ? 280 : 360;
      return `
        <text x="18" y="${y + 17}" font-size="12" fill="currentColor">${row.label}</text>
        <rect x="170" y="${y}" width="${barWidth}" height="24" rx="12" fill="${row.fill}" stroke="rgba(87,104,129,0.18)" />
        <text x="${170 + barWidth + 12}" y="${y + 17}" font-size="12" fill="currentColor">${row.density}</text>
      `;
    })
    .join("");
  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="Density posture diagram">
      <text x="18" y="18" font-size="13" font-weight="700" fill="currentColor">Density posture</text>
      ${bars}
    </svg>
  `;
}

function buildSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Component Primitive Publication Artifact",
    type: "object",
    required: [
      "task_id",
      "visual_mode",
      "summary",
      "componentContracts",
      "specimenCompositions",
      "shellProfileLenses",
      "gap_resolutions",
      "follow_on_dependencies",
    ],
    properties: {
      task_id: { type: "string", const: COMPONENT_PRIMITIVES_TASK_ID },
      visual_mode: { type: "string", const: COMPONENT_PRIMITIVES_VISUAL_MODE },
      summary: {
        type: "object",
        required: ["component_count", "specimen_count", "surface_role_count", "shell_profile_count"],
        properties: {
          component_count: { type: "number" },
          specimen_count: { type: "number" },
          surface_role_count: { type: "number" },
          shell_profile_count: { type: "number" },
          route_binding_count: { type: "number" },
          exact_route_binding_count: { type: "number" },
          blocked_route_binding_count: { type: "number" },
          degraded_accessibility_route_count: { type: "number" },
          gap_resolution_count: { type: "number" },
          follow_on_dependency_count: { type: "number" },
        },
      },
      componentContracts: {
        type: "array",
        items: { $ref: "#/$defs/PrimitiveComponentContract" },
      },
      specimenCompositions: {
        type: "array",
        items: { $ref: "#/$defs/SpecimenComposition" },
      },
      shellProfileLenses: {
        type: "array",
        items: { $ref: "#/$defs/ShellProfileLens" },
      },
      gap_resolutions: {
        type: "array",
        items: { $ref: "#/$defs/GapResolution" },
      },
      follow_on_dependencies: {
        type: "array",
        items: { $ref: "#/$defs/FollowOnDependency" },
      },
      source_refs: {
        type: "array",
        items: { type: "string" },
      },
    },
    $defs: {
      PrimitiveComponentContract: {
        type: "object",
        required: [
          "componentId",
          "displayName",
          "primitiveFamily",
          "atlasSectionId",
          "surfaceRoleLabel",
          "description",
          "shellTypes",
          "routeFamilyRefs",
          "tokenBindings",
          "kernelBindings",
          "automationSlots",
          "accessibility",
          "apiSignature",
          "contractDigestRef",
        ],
        properties: {
          componentId: { type: "string" },
          displayName: { type: "string" },
          primitiveFamily: { type: "string" },
          atlasSectionId: { type: "string" },
          surfaceRoleLabel: { type: "string" },
          description: { type: "string" },
          shellTypes: { type: "array", items: { type: "string" } },
          routeFamilyRefs: { type: "array", items: { type: "string" } },
          specimenIds: { type: "array", items: { type: "string" } },
          stateVariants: { type: "array", items: { type: "string" } },
          apiSignature: { type: "string" },
          accentPolicy: { type: "string" },
          densityPolicy: { type: "string" },
          visualizationParity: { type: "string" },
          contractDigestRef: { type: "string" },
        },
      },
      SpecimenComposition: {
        type: "object",
        required: [
          "specimenId",
          "label",
          "shellType",
          "routeFamilyRef",
          "headline",
          "summary",
          "componentIds",
        ],
        properties: {
          specimenId: { type: "string" },
          label: { type: "string" },
          shellType: { type: "string" },
          routeFamilyRef: { type: "string" },
          headline: { type: "string" },
          summary: { type: "string" },
          componentIds: { type: "array", items: { type: "string" } },
        },
      },
      ShellProfileLens: {
        type: "object",
        required: ["shellType", "label", "profileSelectionResolutionId", "profileTokenRef"],
        properties: {
          shellType: { type: "string" },
          label: { type: "string" },
          profileSelectionResolutionId: { type: "string" },
          profileTokenRef: { type: "string" },
          routeClassRef: { type: "string" },
          accentRole: { type: "string" },
          defaultDensityMode: { type: "string" },
          defaultMotionMode: { type: "string" },
          allowedSurfaceRoleRefs: { type: "array", items: { type: "string" } },
        },
      },
      GapResolution: {
        type: "object",
        required: ["gapId", "title", "resolution", "source_refs"],
        properties: {
          gapId: { type: "string" },
          title: { type: "string" },
          resolution: { type: "string" },
          source_refs: { type: "array", items: { type: "string" } },
        },
      },
      FollowOnDependency: {
        type: "object",
        required: ["dependencyId", "ownerTaskRange", "description", "source_refs"],
        properties: {
          dependencyId: { type: "string" },
          ownerTaskRange: { type: "string" },
          description: { type: "string" },
          source_refs: { type: "array", items: { type: "string" } },
        },
      },
    },
  };
}

function buildGeneratedSource(args: {
  publication: ReturnType<typeof buildComponentPrimitiveArtifacts>["publication"];
  bindingRows: ReturnType<typeof buildComponentPrimitiveArtifacts>["bindingRows"];
  automationArtifact: ReturnType<typeof buildComponentPrimitiveArtifacts>["automationArtifact"];
  accessibilityRows: ReturnType<typeof buildComponentPrimitiveArtifacts>["accessibilityRows"];
  specimenMarkupById: Record<string, string>;
}) {
  return `export const componentPrimitiveCatalog = ${JSON.stringify(
    {
      taskId: COMPONENT_PRIMITIVES_TASK_ID,
      visualMode: COMPONENT_PRIMITIVES_VISUAL_MODE,
      schemaArtifactPath: COMPONENT_PRIMITIVES_SCHEMA_PATH,
      publicationArtifactPath: COMPONENT_PRIMITIVES_PUBLICATION_PATH,
      componentCount: args.publication.summary.component_count,
      specimenCount: args.publication.summary.specimen_count,
      surfaceRoleCount: args.publication.summary.surface_role_count,
      shellProfileCount: args.publication.summary.shell_profile_count,
      exactRouteBindingCount: args.publication.summary.exact_route_binding_count,
      blockedRouteBindingCount: args.publication.summary.blocked_route_binding_count,
      degradedAccessibilityRouteCount:
        args.publication.summary.degraded_accessibility_route_count,
    },
    null,
    2,
  )} as const;

export const componentPrimitiveSchemas = [
  {
    schemaId: "ComponentPrimitivePublication",
    artifactPath: "${COMPONENT_PRIMITIVES_SCHEMA_PATH}",
    generatedByTask: "${COMPONENT_PRIMITIVES_TASK_ID}",
    componentCount: ${args.publication.summary.component_count},
    specimenCount: ${args.publication.summary.specimen_count},
  },
] as const;

export const componentPrimitivePublication = ${JSON.stringify(args.publication, null, 2)} as const;

export const componentPrimitiveBindingMatrixRows = ${JSON.stringify(
    args.bindingRows,
    null,
    2,
  )} as const;

export const componentPrimitiveAutomationAnchorArtifact = ${JSON.stringify(
    args.automationArtifact,
    null,
    2,
  )} as const;

export const componentPrimitiveAccessibilityCoverageRows = ${JSON.stringify(
    args.accessibilityRows,
    null,
    2,
  )} as const;

export const componentAtlasSpecimenMarkup = ${JSON.stringify(
    args.specimenMarkupById,
    null,
    2,
  )} as const;
`;
}

function buildBindingsDoc(
  publication: ReturnType<typeof buildComponentPrimitiveArtifacts>["publication"],
): string {
  const lines = [
    "# Shared Component Primitives And Token Bindings",
    "",
    "## Outcome",
    "",
    "Vecells now has a first real shared primitive layer bound to the par_103 token foundation and the par_104 kernel publication. The primitives below are the reusable route-safe source for later patient, workspace, support, pharmacy, operations, and governance shells.",
    "",
    "## Summary",
    "",
    `- Components: ${publication.summary.component_count}`,
    `- Specimens: ${publication.summary.specimen_count}`,
    `- Shell profile lenses: ${publication.summary.shell_profile_count}`,
    `- Exact route bindings across specimens: ${publication.summary.exact_route_binding_count}`,
    `- Blocked route bindings across specimens: ${publication.summary.blocked_route_binding_count}`,
    "",
    "## Specimens",
    "",
  ];
  for (const specimen of publication.specimenCompositions) {
    lines.push(
      `### ${specimen.headline}`,
      "",
      `- Route: \`${specimen.routeFamilyRef}\``,
      `- Shell: \`${specimen.shellType}\``,
      `- Layout: \`${specimen.layoutTopology}\``,
      `- Density posture: \`${specimen.densityPosture}\``,
      `- Components: ${specimen.componentIds.join(", ")}`,
      "",
      specimen.summary,
      "",
    );
  }
  lines.push("## Gap Resolutions", "");
  for (const gap of publication.gap_resolutions) {
    lines.push(`- \`${gap.gapId}\`: ${gap.resolution}`);
  }
  lines.push("", "## Follow-On Dependencies", "");
  for (const dependency of publication.follow_on_dependencies) {
    lines.push(`- \`${dependency.dependencyId}\` (${dependency.ownerTaskRange}): ${dependency.description}`);
  }
  lines.push("", "## Source Precedence", "");
  for (const source of publication.source_refs) {
    lines.push(`- ${source}`);
  }
  lines.push("");
  return lines.join("\n");
}

function buildApiDoc(
  publication: ReturnType<typeof buildComponentPrimitiveArtifacts>["publication"],
): string {
  const lines = [
    "# Component API And Surface Role Contracts",
    "",
    "## Surface Role Sections",
    "",
  ];
  for (const section of componentAtlasSections) {
    const components = publication.componentContracts.filter(
      (component) => component.atlasSectionId === section.sectionId,
    );
    lines.push(`### ${section.label}`, "", section.summary, "");
    for (const component of components) {
      lines.push(
        `- \`${component.componentId}\`: ${component.apiSignature}`,
        `  Token refs: ${component.tokenBindings.map((binding) => binding.tokenRef).join(", ")}`,
        `  Route refs: ${component.routeFamilyRefs.join(", ")}`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

function buildAtlasHtml(args: {
  publication: ReturnType<typeof buildComponentPrimitiveArtifacts>["publication"];
  specimenMarkupById: Record<string, string>;
  supplementalShelfMarkup: string;
}) {
  const foundationCss = fs.readFileSync(FOUNDATION_CSS_PATH, "utf8");
  const componentCss = fs.readFileSync(COMPONENT_CSS_PATH, "utf8");
  const defaultSpecimen = specimenCompositions[0];
  const atlasModel = {
    publication: args.publication,
    sections: componentAtlasSections,
    shellProfileLenses,
    specimens: specimenCompositions,
    specimenMarkupById: args.specimenMarkupById,
    supplementalShelfMarkup: args.supplementalShelfMarkup,
    taxonomySvg: buildTaxonomyDiagramSvg(),
    densitySvg: buildDensityDiagramSvg(),
  };
  const shellButtons = shellProfileLenses
    .map(
      (lens) => `
        <button type="button" data-shell-type="${lens.shellType}" class="${lens.shellType === defaultSpecimen.shellType ? "is-active" : ""}">
          <strong>${lens.label}</strong>
          <span>${lens.profileSelectionResolutionId}</span>
        </button>
      `,
    )
    .join("");
  const sectionButtons = componentAtlasSections
    .map(
      (section) => `
        <button type="button" data-section-id="${section.sectionId}" class="${section.sectionId === defaultSpecimen.atlasSectionId ? "is-active" : ""}">
          <strong>${section.label}</strong>
          <span>${section.summary}</span>
        </button>
      `,
    )
    .join("");
  const specimenButtons = specimenCompositions
    .map(
      (specimen) => `
        <button type="button" data-specimen-id="${specimen.specimenId}" class="${specimen.specimenId === defaultSpecimen.specimenId ? "is-active" : ""}">
          <strong>${specimen.label}</strong>
          <span>${specimen.routeFamilyRef}</span>
        </button>
      `,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vecells Component Atlas</title>
    <style>
${foundationCss}
${componentCss}
    </style>
  </head>
  <body class="token-foundation component-atlas-body" data-theme="light" data-contrast="standard" data-density="balanced" data-motion="reduced">
    <main class="component-atlas" data-testid="atlas-shell">
      <aside class="component-atlas__panel component-atlas__panel--rail">
        <div class="component-atlas__title">
          <span class="cp-kicker">Vecells Component Atlas</span>
          <h1 data-testid="atlas-masthead">Route-safe primitives for Signal Atlas Live</h1>
          <p>Shared shell, surface, control, and visualization primitives bound to token and kernel law.</p>
        </div>
        <section data-testid="shell-lens-rail">
          <span class="cp-kicker">Shell profiles</span>
          <div class="component-atlas__toggle-grid">${shellButtons}</div>
        </section>
        <section data-testid="surface-role-nav">
          <span class="cp-kicker">Surface role navigation</span>
          <div class="component-atlas__nav">${sectionButtons}</div>
        </section>
        <section data-testid="specimen-nav">
          <span class="cp-kicker">Specimens</span>
          <div class="component-atlas__specimen-nav">${specimenButtons}</div>
        </section>
        <section data-testid="mode-controls">
          <span class="cp-kicker">Modes</span>
          <div class="component-atlas__mode-grid">
            <button type="button" data-mode="contrast" data-value="standard" class="is-active"><strong>Standard contrast</strong><span>Default quiet palette</span></button>
            <button type="button" data-mode="contrast" data-value="high"><strong>High contrast</strong><span>Same hierarchy, stronger edges</span></button>
            <button type="button" data-mode="motion" data-value="reduced" class="is-active"><strong>Reduced motion</strong><span>Static emphasis and focus movement only</span></button>
            <button type="button" data-mode="motion" data-value="full"><strong>Full motion</strong><span>120/180/240ms canonical timings</span></button>
          </div>
        </section>
      </aside>
      <section class="component-atlas__main">
        <section class="component-atlas__stage-shell" data-testid="specimen-stage">
          <div class="component-atlas__stage-topline">
            <p class="component-atlas__summary-line" data-testid="stage-summary-line"></p>
            <div class="component-atlas__route-badges" data-testid="route-badges"></div>
          </div>
          <div class="component-atlas__stage-frame" data-testid="stage-canvas">${args.specimenMarkupById[defaultSpecimen.specimenId]}</div>
        </section>
        <section class="component-atlas__lower-strip">
          <div class="component-atlas__panel">
            <span class="cp-kicker">Motion and state transitions</span>
            <div class="component-atlas__motion-strip" data-testid="motion-strip"></div>
          </div>
          <div class="component-atlas__panel" data-testid="supplemental-shelf">${args.supplementalShelfMarkup}</div>
        </section>
      </section>
      <aside class="component-atlas__panel component-atlas__panel--inspector" data-testid="inspector-panel">
        <div class="component-atlas__inspector-stack" data-testid="inspector-stack"></div>
        <div class="component-atlas__diagram" data-testid="taxonomy-diagram"></div>
        <div class="component-atlas__diagram" data-testid="density-diagram"></div>
      </aside>
    </main>
    <script type="application/json" id="component-atlas-model">${JSON.stringify(atlasModel)}</script>
    <script>
      const model = JSON.parse(document.getElementById("component-atlas-model").textContent);
      const state = {
        specimenId: "${defaultSpecimen.specimenId}",
        shellType: "${defaultSpecimen.shellType}",
        sectionId: "${defaultSpecimen.atlasSectionId}",
        contrast: "standard",
        motion: "reduced",
      };
      const stageCanvas = document.querySelector("[data-testid='stage-canvas']");
      const stageSummaryLine = document.querySelector("[data-testid='stage-summary-line']");
      const routeBadges = document.querySelector("[data-testid='route-badges']");
      const inspectorStack = document.querySelector("[data-testid='inspector-stack']");
      const motionStrip = document.querySelector("[data-testid='motion-strip']");
      const taxonomyDiagram = document.querySelector("[data-testid='taxonomy-diagram']");
      const densityDiagram = document.querySelector("[data-testid='density-diagram']");
      taxonomyDiagram.innerHTML = model.taxonomySvg;
      densityDiagram.innerHTML = model.densitySvg;

      function escapeHtml(value) {
        return value
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");
      }

      function currentSpecimen() {
        return model.specimens.find((specimen) => specimen.specimenId === state.specimenId);
      }

      function currentShellLens() {
        return model.shellProfileLenses.find((lens) => lens.shellType === state.shellType);
      }

      function currentSectionComponents() {
        return model.publication.componentContracts.filter((component) => {
          const inSection = component.atlasSectionId === state.sectionId;
          const supportsShell = component.shellTypes.includes(state.shellType);
          return inSection && supportsShell;
        });
      }

      function setButtonState(selector, attr, value) {
        document.querySelectorAll(selector).forEach((button) => {
          button.classList.toggle("is-active", button.getAttribute(attr) === value);
        });
      }

      function highlightStage() {
        stageCanvas.querySelectorAll("[data-atlas-section], [data-surface-role]").forEach((node) => {
          node.classList.remove("is-highlighted");
        });
        stageCanvas.querySelectorAll(\`[data-atlas-section="\${state.sectionId}"], [data-surface-role="\${state.sectionId}"]\`).forEach((node) => {
          node.classList.add("is-highlighted");
        });
      }

      function renderRouteBadges(specimen) {
        routeBadges.innerHTML = [
          \`<span>\${escapeHtml(specimen.routeFamilyRef)}</span>\`,
          \`<span>\${escapeHtml(specimen.bundleRef)}</span>\`,
          \`<span>\${escapeHtml(specimen.layoutTopology)}</span>\`,
          \`<span>\${escapeHtml(specimen.densityPosture)}</span>\`,
        ].join("");
      }

      function renderInspector() {
        const specimen = currentSpecimen();
        const shellLens = currentShellLens();
        const components = currentSectionComponents();
        inspectorStack.innerHTML = [
          '<div class="component-atlas__metric-list">',
          \`<article class="component-atlas__metric-card"><span class="cp-kicker">Shell lens</span><strong>\${escapeHtml(shellLens.label)}</strong><code>\${escapeHtml(shellLens.profileSelectionResolutionId)}</code></article>\`,
          \`<article class="component-atlas__metric-card"><span class="cp-kicker">Section</span><strong>\${escapeHtml(state.sectionId)}</strong><code>\${components.length} components</code></article>\`,
          \`<article class="component-atlas__metric-card"><span class="cp-kicker">Specimen</span><strong>\${escapeHtml(specimen.label)}</strong><code>\${escapeHtml(specimen.routeFamilyRef)}</code></article>\`,
          \`<article class="component-atlas__metric-card"><span class="cp-kicker">Modes</span><strong>\${escapeHtml(document.body.dataset.contrast)} / \${escapeHtml(document.body.dataset.motion)}</strong><code>\${escapeHtml(document.body.dataset.theme || "light")}</code></article>\`,
          '</div>',
          '<div class="component-atlas__component-list">',
          ...components.map((component) => \`
            <article class="component-atlas__component-card">
              <span class="cp-kicker">\${escapeHtml(component.primitiveFamily)}</span>
              <strong>\${escapeHtml(component.displayName)}</strong>
              <p class="component-atlas__inspector-copy">\${escapeHtml(component.description)}</p>
              <code>\${escapeHtml(component.apiSignature)}</code>
              <ul>
                <li><strong>Token refs:</strong> \${escapeHtml(component.tokenBindings.map((binding) => binding.tokenRef).join(", "))}</li>
                <li><strong>Kernel refs:</strong> \${escapeHtml(component.kernelBindings.slice(0, 4).map((binding) => binding.ref).join(", "))}</li>
                <li><strong>Route refs:</strong> \${escapeHtml(component.routeFamilyRefs.join(", "))}</li>
                <li><strong>Coverage:</strong> \${escapeHtml(component.accessibility.routeCoverage.map((row) => row.coverageState).join(", "))}</li>
              </ul>
            </article>
          \`),
          "</div>",
        ].join("");
      }

      function renderMotionStrip() {
        const specimen = currentSpecimen();
        const currentRoute = model.publication.specimenCompositions.find((row) => row.specimenId === specimen.specimenId);
        const routeBinding = model.publication.componentContracts.find((component) => component.componentId === "ShellFrame");
        motionStrip.innerHTML = [
          '<article class="component-atlas__motion-card"><span class="cp-kicker">Hover/focus</span><strong>120ms</strong><p>Attention cues stay crisp and non-bouncy.</p></article>',
          '<article class="component-atlas__motion-card"><span class="cp-kicker">Reveal</span><strong>180ms</strong><p>Same-surface expansion preserves continuity.</p></article>',
          \`<article class="component-atlas__motion-card"><span class="cp-kicker">Settle</span><strong>240ms</strong><p>\${escapeHtml(currentRoute.routeFamilyRef)} remains in \${escapeHtml(specimen.layoutTopology)} posture.</p></article>\`,
        ].join("");
      }

      function renderStage() {
        const specimen = currentSpecimen();
        stageCanvas.innerHTML = model.specimenMarkupById[specimen.specimenId];
        stageSummaryLine.innerHTML = \`<strong>\${escapeHtml(specimen.label)}</strong> carries one dominant action, \${specimen.promotedSupportRegionCount} promoted support region, and route \${escapeHtml(specimen.routeFamilyRef)}.\`;
        renderRouteBadges(specimen);
        highlightStage();
      }

      function render() {
        renderStage();
        renderInspector();
        renderMotionStrip();
        setButtonState("[data-shell-type]", "data-shell-type", state.shellType);
        setButtonState("[data-section-id]", "data-section-id", state.sectionId);
        setButtonState("[data-specimen-id]", "data-specimen-id", state.specimenId);
        setButtonState("[data-mode='contrast']", "data-value", state.contrast);
        setButtonState("[data-mode='motion']", "data-value", state.motion);
      }

      document.querySelectorAll("[data-shell-type]").forEach((button) => {
        button.addEventListener("click", () => {
          state.shellType = button.getAttribute("data-shell-type");
          render();
        });
      });
      document.querySelectorAll("[data-section-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const sectionId = button.getAttribute("data-section-id");
          const preferredSpecimen = model.specimens.find((item) => item.atlasSectionId === sectionId);
          state.sectionId = sectionId;
          if (preferredSpecimen) {
            state.specimenId = preferredSpecimen.specimenId;
            state.shellType = preferredSpecimen.shellType;
          }
          render();
        });
      });
      document.querySelectorAll("[data-specimen-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const specimenId = button.getAttribute("data-specimen-id");
          const specimen = model.specimens.find((item) => item.specimenId === specimenId);
          state.specimenId = specimenId;
          state.shellType = specimen.shellType;
          state.sectionId = specimen.atlasSectionId;
          render();
        });
      });
      document.querySelectorAll("[data-mode]").forEach((button) => {
        button.addEventListener("click", () => {
          const mode = button.getAttribute("data-mode");
          const value = button.getAttribute("data-value");
          state[mode] = value;
          document.body.dataset[mode] = value;
          render();
        });
      });

      render();
    </script>
  </body>
</html>
`;
}

function main() {
  const artifacts = buildComponentPrimitiveArtifacts();
  const specimenMarkupById = Object.fromEntries(
    specimenCompositions.map((specimen) => [
      specimen.specimenId,
      renderSpecimenMarkup(specimen.specimenId),
    ]),
  );
  const supplementalShelfMarkup = renderSupplementalShelfMarkup();

  const bindingHeaders = [
    "component_id",
    "display_name",
    "primitive_family",
    "atlas_section",
    "surface_role",
    "shell_types",
    "route_family_refs",
    "specimen_ids",
    "token_refs",
    "kernel_binding_refs",
    "api_signature",
    "visualization_parity",
  ] as const;
  const accessibilityHeaders = [
    "component_id",
    "display_name",
    "shell_types",
    "route_family_refs",
    "coverage_states",
    "reduced_motion_refs",
    "high_contrast_ref",
    "semantic_surface_refs",
    "keyboard_contract_refs",
    "focus_contract_refs",
    "visualization_fallback_refs",
    "visualization_table_refs",
  ] as const;

  writeJson(PUBLICATION_PATH, artifacts.publication);
  writeText(BINDING_MATRIX_PATH, buildCsv(artifacts.bindingRows, bindingHeaders));
  writeJson(AUTOMATION_MATRIX_PATH, artifacts.automationArtifact);
  writeText(
    ACCESSIBILITY_MATRIX_PATH,
    buildCsv(artifacts.accessibilityRows, accessibilityHeaders),
  );
  writeText(DOC_BINDINGS_PATH, buildBindingsDoc(artifacts.publication));
  writeText(DOC_API_PATH, buildApiDoc(artifacts.publication));
  writeText(
    GENERATED_SOURCE_PATH,
    buildGeneratedSource({
      publication: artifacts.publication,
      bindingRows: artifacts.bindingRows,
      automationArtifact: artifacts.automationArtifact,
      accessibilityRows: artifacts.accessibilityRows,
      specimenMarkupById,
    }),
  );
  writeJson(SCHEMA_PATH, buildSchema());
  writeText(
    ATLAS_PATH,
    buildAtlasHtml({
      publication: artifacts.publication,
      specimenMarkupById,
      supplementalShelfMarkup,
    }),
  );
}

main();
