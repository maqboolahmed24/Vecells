import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SELECTED_ANCHOR_MANAGER_SCHEMA_PATH,
  SELECTED_ANCHOR_MANAGER_TASK_ID,
  SELECTED_ANCHOR_MANAGER_VISUAL_MODE,
  buildSelectedAnchorManagerArtifacts,
} from "../../packages/persistent-shell/src/selected-anchor-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(ROOT, "data", "analysis");
const DOCS_DIR = path.join(ROOT, "docs", "architecture");
const PACKAGE_DIR = path.join(ROOT, "packages", "persistent-shell");
const CONTRACTS_DIR = path.join(PACKAGE_DIR, "contracts");
const DESIGN_SYSTEM_DIR = path.join(ROOT, "packages", "design-system", "src");

const POLICY_MATRIX_PATH = path.join(DATA_DIR, "selected_anchor_policy_matrix.csv");
const ADJACENCY_MATRIX_PATH = path.join(DATA_DIR, "route_adjacency_matrix.csv");
const RESTORE_MATRIX_PATH = path.join(DATA_DIR, "navigation_restore_order_matrix.csv");
const EXAMPLES_PATH = path.join(DATA_DIR, "return_contract_examples.json");

const DOC_MANAGER_PATH = path.join(
  DOCS_DIR,
  "108_selected_anchor_and_return_contract_manager.md",
);
const DOC_LEDGER_PATH = path.join(
  DOCS_DIR,
  "108_navigation_state_ledger_and_restore_order.md",
);
const DOC_ADJACENCY_PATH = path.join(
  DOCS_DIR,
  "108_route_adjacency_and_anchor_invalidation_rules.md",
);
const INSPECTOR_PATH = path.join(DOCS_DIR, "108_continuity_inspector.html");
const SCHEMA_PATH = path.join(ROOT, SELECTED_ANCHOR_MANAGER_SCHEMA_PATH);

const FOUNDATION_CSS_PATH = path.join(DESIGN_SYSTEM_DIR, "foundation.css");

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
  ]
    .join("\n")
    .concat("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function scriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function buildSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Selected Anchor Manager Publication Artifact",
    type: "object",
    required: [
      "task_id",
      "visual_mode",
      "summary",
      "selected_anchor_policies",
      "route_adjacency_contracts",
      "restore_orders",
      "scenario_examples",
      "gap_resolutions",
      "follow_on_dependencies",
    ],
    properties: {
      task_id: { type: "string", const: SELECTED_ANCHOR_MANAGER_TASK_ID },
      visual_mode: { type: "string", const: SELECTED_ANCHOR_MANAGER_VISUAL_MODE },
      summary: {
        type: "object",
        required: [
          "route_count",
          "policy_count",
          "adjacency_count",
          "restore_step_count",
          "scenario_count",
          "gap_resolution_count",
          "follow_on_dependency_count",
        ],
        properties: {
          route_count: { type: "number" },
          policy_count: { type: "number" },
          adjacency_count: { type: "number" },
          restore_step_count: { type: "number" },
          scenario_count: { type: "number" },
          gap_resolution_count: { type: "number" },
          follow_on_dependency_count: { type: "number" },
        },
      },
      selected_anchor_policies: { type: "array", items: { type: "object" } },
      route_adjacency_contracts: { type: "array", items: { type: "object" } },
      restore_orders: { type: "array", items: { type: "object" } },
      scenario_examples: { type: "array", items: { type: "object" } },
      gap_resolutions: { type: "array", items: { type: "string" } },
      follow_on_dependencies: { type: "array", items: { type: "string" } },
      source_refs: { type: "array", items: { type: "string" } },
    },
  };
}

function buildManagerDoc(
  publication: ReturnType<typeof buildSelectedAnchorManagerArtifacts>["publication"],
): string {
  const scenarioBullets = publication.scenario_examples
    .map(
      (scenario) =>
        `- \`${scenario.scenarioId}\`: ${scenario.summary}`,
    )
    .join("\n");
  const gapBullets = publication.gap_resolutions
    .map((gap) => `- \`${gap}\``)
    .join("\n");
  const followOnBullets = publication.follow_on_dependencies
    .map((dependency) => `- \`${dependency}\``)
    .join("\n");
  return `# Selected Anchor And Return Contract Manager

Task \`${publication.task_id}\` publishes the shared continuity-memory subsystem for same-shell anchor preservation, return contracts, navigation-ledger persistence, explicit invalidation, and ordered restore.

## Scope

- Typed selected-anchor policies are published for all ${publication.summary.policy_count} current persistent-shell route families.
- Same-shell route adjacency is published for ${publication.summary.adjacency_count} route-family pairs.
- Restore order is explicit and machine-readable across ${publication.summary.restore_step_count} restore steps.
- Five scenario examples prove full restore, partial restore, read-only preserve, and recovery-required return.

## Shared Continuity Law

- Browser history is an input only; the source of truth is the typed \`NavigationStateLedger\`.
- Return semantics are anchored to the preserved \`anchorTupleHash\`, not to labels or scroll position alone.
- Invalidated anchors remain visible through a stub or acknowledgement gate before any safe fallback becomes dominant.
- Refresh and same-shell re-entry restore in the declared order: anchor, scroll, disclosure, then focus.

## Scenario Examples

${scenarioBullets}

## Gap Resolutions

${gapBullets}

## Follow-on Dependencies

${followOnBullets}
`;
}

function buildLedgerDoc(
  publication: ReturnType<typeof buildSelectedAnchorManagerArtifacts>["publication"],
): string {
  const samplePolicies = publication.selected_anchor_policies
    .slice(0, 6)
    .map(
      (policy) =>
        `| \`${policy.routeFamilyRef}\` | \`${policy.restoreOrder.join(" > ")}\` | \`${policy.fallbackAnchorRef}\` |`,
    )
    .join("\n");
  return `# Navigation State Ledger And Restore Order

The shared manager writes one navigation ledger per shell epoch and rehydrates from it before child-surface rendering resumes.

## Restore Order

The canonical restore sequence remains:

1. Restore the exact selected-anchor tuple when available.
2. Restore scroll to the preserved anchor region or nearest safe fallback.
3. Restore bounded disclosure posture without widening the shell.
4. Restore focus to the selected anchor, invalidation stub, or recovery notice.

## Sample Restore Rows

| Route family | Restore order | Fallback anchor |
| --- | --- | --- |
${samplePolicies}

## Ledger Guarantees

- Same-shell child routes keep a return contract to the origin anchor.
- Same-shell object switches may demote or replace anchors, but they may not silently choose a sibling object.
- Read-only and recovery posture override calm or writable return even when the shell remains stable.
`;
}

function buildAdjacencyDoc(
  publication: ReturnType<typeof buildSelectedAnchorManagerArtifacts>["publication"],
): string {
  const adjacencySummary = publication.route_adjacency_contracts
    .slice(0, 8)
    .map(
      (contract) =>
        `| \`${contract.fromRouteFamilyRef}\` | \`${contract.toRouteFamilyRef}\` | \`${contract.adjacencyType}\` | \`${contract.anchorDispositionRef}\` | \`${contract.defaultReturnPosture}\` |`,
    )
    .join("\n");
  return `# Route Adjacency And Anchor Invalidation Rules

Route adjacency decides whether the shell remains in place, whether the selected anchor survives, and whether the return posture may stay writable, read-only, or recovery-bound.

## Adjacency Rules

- \`same_object_child\` preserves the shell and mints a return contract to the source anchor.
- \`same_object_peer\` preserves the shell but may demote or replace the current object anchor.
- \`same_shell_object_switch\` requires an explicit anchor disposition and focus disposition.
- \`cross_shell_boundary\` fails closed and resets to a route default only when the shell family genuinely changes.

## Sample Adjacency Rows

| From | To | Adjacency | Anchor disposition | Default return posture |
| --- | --- | --- | --- | --- |
${adjacencySummary}

## Invalidation Rules

- An invalidated anchor remains visible until explicit acknowledgement, re-check, or dismissal.
- Replacement acknowledgement is required for governance, hub, operations, pharmacy, and support continuity where the question itself changes.
- Patient and artifact-origin recovery keeps the departing anchor visible as a stub and degrades in place rather than redirecting home.
`;
}

function buildReturnPathDiagramSvg(
  publication: ReturnType<typeof buildSelectedAnchorManagerArtifacts>["publication"],
): string {
  const scenario = publication.scenario_examples[0];
  const sequence = scenario?.routeSequence ?? [];
  const nodes = sequence
    .map((routeFamilyRef, index) => {
      const x = 28 + index * 205;
      return `
        <rect x="${x}" y="54" width="170" height="56" rx="16" fill="var(--sys-surface-panel)" stroke="var(--sys-border-default)" />
        <text x="${x + 16}" y="83" font-size="12" fill="currentColor">${routeFamilyRef}</text>
      `;
    })
    .join("");
  const arrows = sequence
    .slice(0, -1)
    .map((_, index) => {
      const x = 198 + index * 205;
      return `
        <path d="M ${x} 82 L ${x + 35} 82" stroke="var(--sys-border-strong)" stroke-width="2" fill="none" />
        <circle cx="${x + 35}" cy="82" r="3" fill="var(--sys-border-strong)" />
      `;
    })
    .join("");
  return `
    <svg viewBox="0 0 680 164" xmlns="http://www.w3.org/2000/svg" aria-label="Same-shell return path diagram">
      <text x="24" y="24" font-size="13" font-weight="700" fill="currentColor">Same-shell return path</text>
      <text x="24" y="42" font-size="12" fill="currentColor">The child route preserves the origin request anchor and restores it on return.</text>
      ${nodes}
      ${arrows}
    </svg>
  `;
}

function buildInvalidationDiagramSvg(
  publication: ReturnType<typeof buildSelectedAnchorManagerArtifacts>["publication"],
): string {
  const scenario = publication.scenario_examples[1];
  const nodes = scenario?.steps ?? [];
  const rows = nodes
    .map((step, index) => {
      const y = 52 + index * 42;
      return `
        <circle cx="32" cy="${y}" r="9" fill="var(--sys-state-review-container)" stroke="var(--sys-state-review-border)" />
        <text x="54" y="${y + 4}" font-size="12" fill="currentColor">${escapeHtml(step.label)}</text>
      `;
    })
    .join("");
  const connectors = nodes
    .slice(0, -1)
    .map((_, index) => {
      const y = 61 + index * 42;
      return `<path d="M 32 ${y} L 32 ${y + 24}" stroke="var(--sys-border-strong)" stroke-width="2" fill="none" />`;
    })
    .join("");
  return `
    <svg viewBox="0 0 680 210" xmlns="http://www.w3.org/2000/svg" aria-label="Selected anchor invalidation ladder">
      <text x="24" y="24" font-size="13" font-weight="700" fill="currentColor">Selected-anchor invalidation ladder</text>
      <text x="24" y="42" font-size="12" fill="currentColor">The exact record anchor becomes a stub before the shell promotes the nearest safe fallback.</text>
      ${connectors}
      ${rows}
    </svg>
  `;
}

function buildRestoreOrderDiagramSvg(
  publication: ReturnType<typeof buildSelectedAnchorManagerArtifacts>["publication"],
): string {
  const steps = publication.restore_orders
    .filter((step) => step.routeFamilyRef === "rf_staff_workspace")
    .map((step) => step.stepKey);
  const labels = steps.length > 0 ? steps : ["anchor", "scroll", "disclosure", "focus"];
  const nodes = labels
    .map((label, index) => {
      const x = 28 + index * 158;
      return `
        <rect x="${x}" y="62" width="132" height="42" rx="14" fill="var(--sys-surface-panel)" stroke="var(--sys-border-default)" />
        <text x="${x + 16}" y="88" font-size="12" fill="currentColor">${label}</text>
      `;
    })
    .join("");
  const arrows = labels
    .slice(0, -1)
    .map((_, index) => {
      const x = 160 + index * 158;
      return `
        <path d="M ${x} 83 L ${x + 22} 83" stroke="var(--sys-border-strong)" stroke-width="2" fill="none" />
        <circle cx="${x + 22}" cy="83" r="3" fill="var(--sys-border-strong)" />
      `;
    })
    .join("");
  return `
    <svg viewBox="0 0 680 150" xmlns="http://www.w3.org/2000/svg" aria-label="Restore order diagram">
      <text x="24" y="24" font-size="13" font-weight="700" fill="currentColor">Restore order</text>
      <text x="24" y="42" font-size="12" fill="currentColor">Restore the exact anchor first, then scroll, disclosure posture, and finally focus.</text>
      ${nodes}
      ${arrows}
    </svg>
  `;
}

function buildInspectorHtml(
  publication: ReturnType<typeof buildSelectedAnchorManagerArtifacts>["publication"],
): string {
  const foundationCss = fs.readFileSync(FOUNDATION_CSS_PATH, "utf8");
  const modelJson = scriptJson(publication);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vecells Continuity Inspector</title>
    <style>
${foundationCss}

body {
  margin: 0;
}

.continuity-inspector {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--sys-surface-shell) 0%, var(--sys-surface-canvas) 100%);
  color: var(--sys-text-default);
}

.continuity-inspector__masthead {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px 18px;
  border-bottom: 1px solid var(--sys-border-subtle);
}

.continuity-inspector__brand {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.continuity-inspector__brand-mark {
  min-width: 122px;
  padding: 10px 14px;
  border-radius: 16px;
  background: var(--sys-surface-panel);
  border: 1px solid var(--sys-border-default);
  box-shadow: var(--shadow-z1);
}

.continuity-inspector__brand-mark strong,
.continuity-inspector__brand-mark span {
  display: block;
}

.continuity-inspector__brand-mark span {
  font-size: 12px;
  line-height: 16px;
  color: var(--sys-text-muted);
}

.continuity-inspector__eyebrow {
  font-size: 12px;
  line-height: 16px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sys-text-muted);
}

.continuity-inspector__masthead h1 {
  margin: 4px 0 10px;
  font-size: 32px;
  line-height: 40px;
  color: var(--sys-text-strong);
}

.continuity-inspector__masthead p {
  margin: 0;
  max-width: 78ch;
}

.continuity-inspector__controls {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.continuity-inspector button {
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.continuity-inspector__toolbar-button,
.continuity-inspector__nav-button,
.continuity-inspector__scenario-button,
.continuity-inspector__step-button {
  border: 1px solid var(--sys-border-default);
  background: var(--sys-surface-panel);
  border-radius: 12px;
  padding: 10px 14px;
  transition:
    border-color var(--motion-duration-attention),
    background-color var(--motion-duration-attention),
    transform var(--motion-duration-attention);
}

.continuity-inspector__scenario-button,
.continuity-inspector__nav-button {
  width: 100%;
  text-align: left;
}

.continuity-inspector__toolbar-button:hover,
.continuity-inspector__nav-button:hover,
.continuity-inspector__scenario-button:hover,
.continuity-inspector__step-button:hover,
.continuity-inspector__toolbar-button:focus-visible,
.continuity-inspector__nav-button:focus-visible,
.continuity-inspector__scenario-button:focus-visible,
.continuity-inspector__step-button:focus-visible {
  border-color: var(--sys-focus-ring);
  outline: none;
}

.continuity-inspector__scenario-button.is-active,
.continuity-inspector__nav-button.is-active,
.continuity-inspector__toolbar-button[aria-pressed="true"] {
  background: var(--sys-state-active-container);
  border-color: var(--sys-state-active-border);
}

.continuity-inspector__trace-ribbon {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 0 28px 18px;
}

.continuity-inspector__trace-ribbon span {
  border-radius: 999px;
  border: 1px solid var(--sys-border-subtle);
  background: var(--sys-surface-panel);
  padding: 7px 12px;
  font-size: 12px;
  line-height: 16px;
}

.continuity-inspector__layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 380px;
  gap: 20px;
  padding: 0 28px 20px;
}

.continuity-inspector__panel {
  border-radius: 20px;
  border: 1px solid var(--sys-border-subtle);
  background: color-mix(in srgb, var(--sys-surface-panel) 92%, white 8%);
  box-shadow: var(--shadow-z1);
}

.continuity-inspector__panel-header {
  padding: 18px 20px 12px;
  border-bottom: 1px solid var(--sys-border-subtle);
}

.continuity-inspector__panel-header h2,
.continuity-inspector__panel-header h3 {
  margin: 6px 0 0;
  font-size: 20px;
  line-height: 28px;
  color: var(--sys-text-strong);
}

.continuity-inspector__scenario-list,
.continuity-inspector__route-sequence,
.continuity-inspector__timeline-list,
.continuity-inspector__detail-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.continuity-inspector__scenario-list {
  padding: 12px;
  display: grid;
  gap: 10px;
}

.continuity-inspector__scenario-button strong,
.continuity-inspector__nav-button strong {
  display: block;
  font-size: 16px;
  line-height: 24px;
  color: var(--sys-text-strong);
}

.continuity-inspector__scenario-button span,
.continuity-inspector__nav-button span,
.continuity-inspector__metadata-card span,
.continuity-inspector__timeline-list span,
.continuity-inspector__detail-list code,
.continuity-inspector__step-copy {
  color: var(--sys-text-muted);
}

.continuity-inspector__route-sequence {
  padding: 12px 16px 18px;
  display: grid;
  gap: 8px;
}

.continuity-inspector__route-sequence li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.continuity-inspector__route-sequence li::before {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 6px;
  background: var(--sys-border-default);
}

.continuity-inspector__route-sequence li.is-active::before {
  background: var(--sys-state-active-border);
}

.continuity-inspector__stage {
  display: grid;
  gap: 16px;
  padding: 18px 20px 20px;
}

.continuity-inspector__specimen {
  display: grid;
  gap: 14px;
}

.continuity-inspector__specimen-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.continuity-inspector__specimen-header h2 {
  margin: 6px 0 8px;
  font-size: 24px;
  line-height: 32px;
  color: var(--sys-text-strong);
}

.continuity-inspector__cue-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.continuity-inspector__cue {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--sys-border-default);
  background: var(--sys-surface-inset);
  font-size: 12px;
  line-height: 16px;
}

.continuity-inspector__specimen-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.85fr);
  gap: 16px;
}

.continuity-inspector__anchor-list,
.continuity-inspector__detail-column,
.continuity-inspector__metadata-stack {
  display: grid;
  gap: 12px;
}

.continuity-inspector__anchor-card,
.continuity-inspector__stub-card,
.continuity-inspector__detail-card,
.continuity-inspector__metadata-card,
.continuity-inspector__diagram-card,
.continuity-inspector__timeline-card {
  border-radius: 16px;
  border: 1px solid var(--sys-border-default);
  background: var(--sys-surface-panel);
  padding: 16px 18px;
}

.continuity-inspector__anchor-card.is-selected {
  border-color: var(--sys-focus-ring);
  background: color-mix(in srgb, var(--sys-state-active-container) 72%, white 28%);
}

.continuity-inspector__stub-card {
  background: color-mix(in srgb, var(--sys-state-review-container) 78%, white 22%);
  border-color: var(--sys-state-review-border);
}

.continuity-inspector__anchor-card:focus-visible,
.continuity-inspector__stub-card:focus-visible {
  outline: 2px solid var(--sys-focus-ring);
  outline-offset: 2px;
}

.continuity-inspector__anchor-card strong,
.continuity-inspector__stub-card strong,
.continuity-inspector__metadata-card strong {
  display: block;
  color: var(--sys-text-strong);
}

.continuity-inspector__detail-list {
  display: grid;
  gap: 10px;
}

.continuity-inspector__detail-list li {
  display: grid;
  gap: 2px;
}

.continuity-inspector__step-controls {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.continuity-inspector__timeline {
  padding: 0 28px 28px;
}

.continuity-inspector__timeline-panel {
  border-radius: 20px;
  border: 1px solid var(--sys-border-subtle);
  background: var(--sys-surface-panel);
  box-shadow: var(--shadow-z1);
  padding: 18px 20px 20px;
}

.continuity-inspector__timeline-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.continuity-inspector__timeline-list li {
  position: relative;
  padding-left: 18px;
}

.continuity-inspector__timeline-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 6px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--sys-border-default);
}

.continuity-inspector__timeline-list li.is-active::before {
  background: var(--sys-state-active-border);
}

.continuity-inspector__diagram-grid {
  display: grid;
  gap: 12px;
}

.continuity-inspector__restore-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 20px;
}

.continuity-inspector__restore-table th,
.continuity-inspector__restore-table td {
  padding: 8px 0;
  border-bottom: 1px solid var(--sys-border-subtle);
  text-align: left;
}

.continuity-inspector__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

body[data-motion="reduced"] .continuity-inspector__toolbar-button,
body[data-motion="reduced"] .continuity-inspector__nav-button,
body[data-motion="reduced"] .continuity-inspector__scenario-button,
body[data-motion="reduced"] .continuity-inspector__step-button,
body[data-motion="reduced"] .continuity-inspector__anchor-card,
body[data-motion="reduced"] .continuity-inspector__stub-card {
  transition: none;
}

@media (max-width: 1200px) {
  .continuity-inspector__layout {
    grid-template-columns: 1fr;
  }
}
    </style>
  </head>
  <body data-theme="light" data-contrast="standard" data-density="balanced" data-motion="full">
    <main class="token-foundation continuity-inspector" data-testid="continuity-inspector">
      <header class="continuity-inspector__masthead" data-testid="continuity-masthead">
        <div class="continuity-inspector__brand">
          <div class="continuity-inspector__brand-mark" aria-hidden="true">
            <strong>Signal Atlas Live</strong>
            <span>Continuity Inspector</span>
          </div>
          <div>
            <div class="continuity-inspector__eyebrow">Selected anchor runtime</div>
            <h1>Continuity Inspector</h1>
            <p>Selected-anchor state, return contracts, navigation-ledger epochs, restore order, invalidation, and focus handoff all render from the same typed continuity model.</p>
          </div>
        </div>
        <div class="continuity-inspector__controls">
          <button class="continuity-inspector__toolbar-button" type="button" data-testid="reduced-motion-toggle" aria-pressed="false">Reduced motion</button>
        </div>
      </header>
      <div class="continuity-inspector__trace-ribbon" data-testid="trace-ribbon">
        <span>${escapeHtml(publication.task_id)}</span>
        <span>${escapeHtml(publication.visual_mode)}</span>
        <span>${publication.summary.policy_count} policies</span>
        <span>${publication.summary.adjacency_count} same-shell adjacencies</span>
        <span>${publication.summary.scenario_count} scenarios</span>
      </div>
      <div class="continuity-inspector__layout">
        <aside class="continuity-inspector__panel" data-testid="scenario-picker">
          <div class="continuity-inspector__panel-header">
            <div class="continuity-inspector__eyebrow">Scenarios</div>
            <h2>Route-family sequences</h2>
          </div>
          <ul class="continuity-inspector__scenario-list" id="scenario-list"></ul>
          <div class="continuity-inspector__panel-header">
            <div class="continuity-inspector__eyebrow">Sequence</div>
            <h3>Route-family path</h3>
          </div>
          <ul class="continuity-inspector__route-sequence" id="route-sequence" data-testid="route-sequence"></ul>
        </aside>
        <section class="continuity-inspector__panel" data-testid="continuity-stage">
          <div class="continuity-inspector__stage">
            <div class="continuity-inspector__step-controls">
              <button class="continuity-inspector__step-button" type="button" data-testid="prev-step">Previous</button>
              <div class="continuity-inspector__step-copy" data-testid="step-indicator"></div>
              <button class="continuity-inspector__step-button" type="button" data-testid="next-step">Next</button>
            </div>
            <section id="continuity-specimen" data-testid="continuity-specimen"></section>
            <section class="continuity-inspector__diagram-grid">
              <article class="continuity-inspector__diagram-card" data-testid="return-path-diagram">
                ${buildReturnPathDiagramSvg(publication)}
              </article>
              <article class="continuity-inspector__diagram-card" data-testid="invalidation-ladder-diagram">
                ${buildInvalidationDiagramSvg(publication)}
              </article>
              <article class="continuity-inspector__diagram-card" data-testid="restore-order-diagram">
                ${buildRestoreOrderDiagramSvg(publication)}
              </article>
            </section>
          </div>
        </section>
        <aside class="continuity-inspector__panel" data-testid="continuity-inspector-panel">
          <div class="continuity-inspector__panel-header">
            <div class="continuity-inspector__eyebrow">Inspector</div>
            <h2>Tuple and restore state</h2>
          </div>
          <div class="continuity-inspector__metadata-stack" id="inspector-stack"></div>
        </aside>
      </div>
      <section class="continuity-inspector__timeline" data-testid="continuity-timeline">
        <div class="continuity-inspector__timeline-panel">
          <div class="continuity-inspector__eyebrow">Timeline</div>
          <h2>Restore epochs and invalidation gates</h2>
          <ul class="continuity-inspector__timeline-list" id="timeline-list"></ul>
        </div>
      </section>
      <div
        class="continuity-inspector__sr-only"
        data-testid="restore-announcement"
        aria-live="polite"
        aria-atomic="true"
      ></div>
    </main>
    <script id="continuity-model" type="application/json">${modelJson}</script>
    <script>
      const STORAGE_KEY = "par_108::continuity-inspector";
      const model = JSON.parse(document.getElementById("continuity-model").textContent);
      const params = new URLSearchParams(window.location.search);
      const persisted = (() => {
        try {
          return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
        } catch {
          return null;
        }
      })();
      const state = {
        scenarioId: params.get("scenario") || persisted?.scenarioId || model.scenario_examples[0]?.scenarioId,
        stepIndex: Number(params.get("step") || persisted?.stepIndex || 0),
        reducedMotion: persisted?.reducedMotion === true,
      };

      const scenarioList = document.getElementById("scenario-list");
      const routeSequence = document.getElementById("route-sequence");
      const specimen = document.getElementById("continuity-specimen");
      const inspectorStack = document.getElementById("inspector-stack");
      const timelineList = document.getElementById("timeline-list");
      const stepIndicator = document.querySelector("[data-testid='step-indicator']");
      const reducedMotionToggle = document.querySelector("[data-testid='reduced-motion-toggle']");
      const restoreAnnouncement = document.querySelector("[data-testid='restore-announcement']");

      function persist() {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      function syncUrl() {
        const url = new URL(window.location.href);
        url.searchParams.set("scenario", state.scenarioId);
        url.searchParams.set("step", String(state.stepIndex));
        window.history.replaceState({}, "", url);
      }

      function currentScenario() {
        return model.scenario_examples.find((scenario) => scenario.scenarioId === state.scenarioId) || model.scenario_examples[0];
      }

      function currentStep() {
        const scenario = currentScenario();
        const index = Math.max(0, Math.min(state.stepIndex, scenario.steps.length - 1));
        state.stepIndex = index;
        return scenario.steps[index];
      }

      function policyForRoute(routeFamilyRef) {
        return model.selected_anchor_policies.find((policy) => policy.routeFamilyRef === routeFamilyRef);
      }

      function restoreRowsForRoute(routeFamilyRef) {
        return model.restore_orders.filter((row) => row.routeFamilyRef === routeFamilyRef);
      }

      function renderScenarioList() {
        scenarioList.innerHTML = model.scenario_examples.map((scenario) => \`
          <li>
            <button type="button" class="continuity-inspector__scenario-button \${scenario.scenarioId === state.scenarioId ? "is-active" : ""}" data-scenario-id="\${scenario.scenarioId}">
              <strong>\${scenario.title}</strong>
              <span>\${scenario.summary}</span>
            </button>
          </li>
        \`).join("");
        scenarioList.querySelectorAll("[data-scenario-id]").forEach((button) => {
          button.addEventListener("click", () => {
            state.scenarioId = button.getAttribute("data-scenario-id");
            state.stepIndex = 0;
            persist();
            render();
          });
        });
      }

      function renderRouteSequence() {
        const scenario = currentScenario();
        const step = currentStep();
        routeSequence.innerHTML = scenario.routeSequence.map((routeFamilyRef, index) => \`
          <li class="\${routeFamilyRef === step.routeFamilyRef ? "is-active" : ""}" data-route-family-ref="\${routeFamilyRef}">
            <div>
              <strong>\${routeFamilyRef}</strong>
              <span>\${index + 1 === scenario.routeSequence.length ? "Return target" : "Same-shell step " + (index + 1)}</span>
            </div>
          </li>
        \`).join("");
      }

      function renderSpecimen() {
        const scenario = currentScenario();
        const step = currentStep();
        const policy = policyForRoute(step.routeFamilyRef);
        const returnCue = step.returnLabel ? \`<div class="continuity-inspector__cue" data-dom-marker="return-contract">\${step.returnLabel}</div>\` : "";
        const stubCard = step.stubLabel
          ? \`<button type="button" class="continuity-inspector__stub-card" tabindex="-1" data-dom-marker="selected-anchor-stub focus-target" data-testid="selected-anchor-stub">
              <div class="continuity-inspector__eyebrow">Preserved stub</div>
              <strong>\${step.selectedAnchorLabel}</strong>
              <p>\${step.stubLabel}</p>
            </button>\`
          : "";
        specimen.innerHTML = \`
          <article class="continuity-inspector__specimen" data-route-family="\${step.routeFamilyRef}" data-return-posture="\${step.returnPosture}" data-invalidation-state="\${step.invalidationState}">
            <div class="continuity-inspector__specimen-header">
              <div>
                <div class="continuity-inspector__eyebrow">\${scenario.audience}</div>
                <h2>\${scenario.title}</h2>
                <p>\${step.detail}</p>
              </div>
              <div class="continuity-inspector__cue-row">
                <div class="continuity-inspector__cue">\${step.returnPosture.replaceAll("_", " ")}</div>
                <div class="continuity-inspector__cue">\${step.invalidationState.replaceAll("_", " ")}</div>
                \${returnCue}
              </div>
            </div>
            <div class="continuity-inspector__specimen-grid">
              <div class="continuity-inspector__anchor-list">
                <button type="button" class="continuity-inspector__anchor-card is-selected" tabindex="-1" data-dom-marker="selected-anchor focus-target" data-testid="selected-anchor-card">
                  <div class="continuity-inspector__eyebrow">Selected anchor</div>
                  <strong>\${step.selectedAnchorLabel}</strong>
                  <p>Policy \${policy?.policyId || "unknown"} keeps this anchor visible through refresh, invalidation, and return.</p>
                </button>
                \${stubCard}
              </div>
              <div class="continuity-inspector__detail-column">
                <article class="continuity-inspector__detail-card">
                  <div class="continuity-inspector__eyebrow">Restore contract</div>
                  <ul class="continuity-inspector__detail-list">
                    <li><strong>Route family</strong><code>\${step.routeFamilyRef}</code></li>
                    <li><strong>Disclosure posture</strong><code>\${step.disclosurePosture}</code></li>
                    <li><strong>Scroll anchor</strong><code>\${step.scrollAnchorRef}</code></li>
                    <li><strong>Focus target</strong><code>\${step.focusTargetRef}</code></li>
                  </ul>
                </article>
              </div>
            </div>
          </article>
        \`;
        const focusTarget =
          (step.focusTargetRef.startsWith("focus.stub")
            ? specimen.querySelector("[data-dom-marker*='selected-anchor-stub']")
            : null) ||
          (step.focusTargetRef === "focus.recovery.notice"
            ? specimen.querySelector("[data-dom-marker*='selected-anchor-stub']")
            : null) ||
          specimen.querySelector("[data-dom-marker*='selected-anchor']");
        window.requestAnimationFrame(() => {
          if (focusTarget) {
            focusTarget.focus();
          }
        });
      }

      function renderInspector() {
        const step = currentStep();
        const policy = policyForRoute(step.routeFamilyRef);
        const restoreRows = restoreRowsForRoute(step.routeFamilyRef);
        inspectorStack.innerHTML = \`
          <article class="continuity-inspector__metadata-card" data-testid="selected-anchor-panel">
            <div class="continuity-inspector__eyebrow">Selected anchor tuple</div>
            <strong>\${step.selectedAnchorLabel}</strong>
            <span>\${step.routeFamilyRef}</span>
            <ul class="continuity-inspector__detail-list">
              <li><strong>Invalidation state</strong><code>\${step.invalidationState}</code></li>
              <li><strong>Focus target</strong><code data-dom-marker="focus-target">\${step.focusTargetRef}</code></li>
              <li><strong>Fallback anchor</strong><code>\${policy?.fallbackAnchorRef || "n/a"}</code></li>
            </ul>
          </article>
          <article class="continuity-inspector__metadata-card" data-testid="return-contract-panel">
            <div class="continuity-inspector__eyebrow">Return contract</div>
            <strong>\${step.returnPosture.replaceAll("_", " ")}</strong>
            <span data-dom-marker="return-contract">\${step.returnLabel || "Same surface / no explicit child return active"}</span>
          </article>
          <article class="continuity-inspector__metadata-card" data-testid="restore-order-panel">
            <div class="continuity-inspector__eyebrow">Restore order</div>
            <table class="continuity-inspector__restore-table">
              <thead>
                <tr><th>Order</th><th>Step</th><th>Description</th></tr>
              </thead>
              <tbody>
                \${restoreRows.map((row) => \`<tr><td>\${row.order}</td><td>\${row.stepKey}</td><td>\${row.description}</td></tr>\`).join("")}
              </tbody>
            </table>
          </article>
        \`;
      }

      function renderTimeline() {
        const scenario = currentScenario();
        timelineList.innerHTML = scenario.steps.map((step, index) => \`
          <li class="\${index === state.stepIndex ? "is-active" : ""}" data-step-index="\${index}">
            <strong>\${step.label}</strong>
            <span>\${step.detail}</span>
          </li>
        \`).join("");
      }

      function renderStepIndicator() {
        const scenario = currentScenario();
        stepIndicator.textContent = \`Step \${state.stepIndex + 1} of \${scenario.steps.length} · \${currentStep().label}\`;
      }

      function renderAnnouncement() {
        const scenario = currentScenario();
        const step = currentStep();
        restoreAnnouncement.textContent = \`\${scenario.title}. \${step.label}. Return posture \${step.returnPosture.replaceAll("_", " ")}. Focus target \${step.focusTargetRef}.\`;
      }

      function renderMotionState() {
        document.body.dataset.motion = state.reducedMotion ? "reduced" : "full";
        reducedMotionToggle.setAttribute("aria-pressed", state.reducedMotion ? "true" : "false");
      }

      function render() {
        persist();
        syncUrl();
        renderScenarioList();
        renderRouteSequence();
        renderStepIndicator();
        renderSpecimen();
        renderInspector();
        renderTimeline();
        renderAnnouncement();
        renderMotionState();
      }

      document.querySelector("[data-testid='prev-step']").addEventListener("click", () => {
        state.stepIndex = Math.max(0, state.stepIndex - 1);
        persist();
        render();
      });

      document.querySelector("[data-testid='next-step']").addEventListener("click", () => {
        const scenario = currentScenario();
        state.stepIndex = Math.min(scenario.steps.length - 1, state.stepIndex + 1);
        persist();
        render();
      });

      reducedMotionToggle.addEventListener("click", () => {
        state.reducedMotion = !state.reducedMotion;
        persist();
        renderMotionState();
      });

      render();
    </script>
  </body>
</html>
`;
}

function main(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });

  const artifacts = buildSelectedAnchorManagerArtifacts();
  const schema = buildSchema();

  writeText(
    POLICY_MATRIX_PATH,
    buildCsv(artifacts.policyRows, [
      "route_family_ref",
      "shell_slug",
      "anchor_type",
      "primary_anchor_slot_ref",
      "replacement_requirement_ref",
      "fallback_anchor_ref",
      "restore_order",
      "invalidation_presentation_ref",
      "source_refs",
    ]),
  );
  writeText(
    ADJACENCY_MATRIX_PATH,
    buildCsv(artifacts.adjacencyRows, [
      "from_route_family_ref",
      "to_route_family_ref",
      "shell_slug",
      "adjacency_type",
      "history_policy",
      "anchor_disposition_ref",
      "focus_disposition_ref",
      "default_return_posture",
      "source_refs",
    ]),
  );
  writeText(
    RESTORE_MATRIX_PATH,
    buildCsv(artifacts.restoreOrderRows, [
      "route_family_ref",
      "posture",
      "step_key",
      "order",
      "description",
      "source_refs",
    ]),
  );
  writeJson(EXAMPLES_PATH, artifacts.publication);
  writeJson(SCHEMA_PATH, schema);

  writeText(DOC_MANAGER_PATH, buildManagerDoc(artifacts.publication));
  writeText(DOC_LEDGER_PATH, buildLedgerDoc(artifacts.publication));
  writeText(DOC_ADJACENCY_PATH, buildAdjacencyDoc(artifacts.publication));
  writeText(INSPECTOR_PATH, buildInspectorHtml(artifacts.publication));
}

main();
