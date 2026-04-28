import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPS_SHELL_TASK_ID,
  OPS_SHELL_VISUAL_MODE,
  createOpsGallerySeed,
  createOpsRouteMapMermaid,
  opsAnomalyMatrixRows,
  opsMockProjectionExamples,
  opsRouteContractSeedRows,
} from "../../apps/ops-console/src/operations-shell-seed.model";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DOCS_DIR = path.join(ROOT, "docs", "architecture");
const DATA_DIR = path.join(ROOT, "data", "analysis");

const ROUTES_MD = path.join(DOCS_DIR, "117_operations_shell_seed_routes.md");
const PROJECTIONS_MD = path.join(DOCS_DIR, "117_operations_mock_projection_strategy.md");
const CONTINUITY_MD = path.join(DOCS_DIR, "117_operations_board_continuity_and_delta_gate_contracts.md");
const ROUTE_MAP_MMD = path.join(DOCS_DIR, "117_operations_shell_route_map.mmd");
const GALLERY_HTML = path.join(DOCS_DIR, "117_operations_shell_gallery.html");

const ROUTES_CSV = path.join(DATA_DIR, "operations_route_contract_seed.csv");
const PROJECTIONS_JSON = path.join(DATA_DIR, "operations_mock_projection_examples.json");
const ANOMALY_CSV = path.join(DATA_DIR, "operations_anomaly_and_intervention_matrix.csv");

function writeFile(target: string, contents: string) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function toCsv<T extends Record<string, unknown>>(rows: readonly T[]) {
  const headers = Object.keys(rows[0] ?? {});
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (Array.isArray(value)) {
            return csvEscape(value.join("|"));
          }
          return csvEscape(String(value ?? ""));
        })
        .join(","),
    ),
  ].join("\n");
}

function buildRoutesDoc() {
  return `# Operations shell seed routes

- Task: \`${OPS_SHELL_TASK_ID}\`
- Visual mode: \`${OPS_SHELL_VISUAL_MODE}\`
- Shell: \`ops-console\`
- Route families: \`rf_operations_board\`, \`rf_operations_drilldown\`

## Seed route map

The Phase 0 operations shell keeps one calm mission-control frame while the lens changes between overview, queues, capacity, dependencies, audit, assurance, incidents, and resilience. Investigation, intervention, compare, and health are same-shell child routes rather than detached dashboards.

## Board law

1. The shell defaults to a two-plane board: a dominant anomaly field in the main plane and a sticky InterventionWorkbench in the secondary plane.
2. Three-plane posture appears only for compare or incident-command contexts.
3. Return from child routes uses the current OpsReturnToken instead of raw browser history.
4. Governance handoff remains read-only and bounded; it never replaces the operations shell.

## Canonical routes

${opsRouteContractSeedRows
  .map(
    (row) =>
      `- \`${row.path}\` -> \`${row.routeFamilyRef}\` (${row.childRouteKind ?? "board"}) :: ${row.summary}`,
  )
  .join("\n")}
`;
}

function buildProjectionDoc() {
  return `# Operations mock projection strategy

The seed routes are backed by truthful mock projections that preserve the production shell topology. The board seeds one promoted anomaly at a time, keeps lower-noise watchpoints visible, and downgrades visuals without changing shells when parity or freshness drift.

## Seeded anomaly families

- Backlog surge
- Dependency degradation
- Continuity breakage
- Confirmation drift
- Release freeze
- Restore debt
- Supplier ambiguity

## Projection examples

${opsMockProjectionExamples
  .map(
    (example) =>
      `- \`${example.exampleId}\` at \`${example.path}\` (\`${example.deltaGateState}\`) :: ${example.summary}`,
  )
  .join("\n")}

## Recorded future gaps

- \`GAP_FUTURE_OPS_METRIC_QUEUE_DENSITY_V1\`
- \`GAP_FUTURE_OPS_METRIC_DEPENDENCY_TRACES_V1\`
- \`GAP_FUTURE_OPS_CHILD_ROUTE_CONTINUITY_GRAPH_V1\`
- \`GAP_BOUNDARY_OPS_GOV_HANDOFF_RELEASE_EXCEPTION_V1\`
`;
}

function buildContinuityDoc() {
  return `# Operations board continuity and delta-gate contracts

## OpsBoardStateSnapshot

The board snapshot binds the selected anomaly, current delta gate, current selection lease, service-health rows, cohort rows, and the same-shell child-route intent into one published view model.

## OpsSelectionLease

The selected anomaly stays pinned while the delta gate is \`buffered\`, \`stale\`, or \`table_only\`. Fresh deltas may update secondary summaries, but they do not steal the promoted anomaly.

## OpsDeltaGate

- \`live\`: chart-plus-table visuals and bounded intervention eligibility
- \`buffered\`: new deltas queue behind the current lease and the workbench is guarded
- \`stale\`: the board preserves the last safe explanation and freezes the workbench
- \`table_only\`: visualization parity has degraded, so the shell falls back to table-first evidence

## OpsReturnToken

The return token records the origin path, selected anomaly, lens, and time horizon. Child routes and governance stubs must use it when returning to board state.
`;
}

function buildGalleryHtml() {
  const gallerySeed = createOpsGallerySeed();
  const serializedSeed = JSON.stringify(gallerySeed, null, 2);
  const mermaid = createOpsRouteMapMermaid();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Operations Shell Gallery</title>
    <style>
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Avenir Next", sans-serif;
        color: #192024;
        background:
          radial-gradient(circle at top right, rgba(47, 86, 101, 0.18), transparent 24%),
          linear-gradient(180deg, #fcfbf7 0%, #f0ede7 100%);
      }
      main {
        width: min(1200px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 48px;
      }
      .hero,
      .panel {
        background: rgba(247, 244, 238, 0.94);
        border: 1px solid rgba(50, 57, 61, 0.14);
        border-radius: 28px;
        box-shadow: 0 18px 42px rgba(20, 22, 25, 0.08);
      }
      .hero {
        padding: 24px 28px;
      }
      .hero svg {
        width: 52px;
        height: 52px;
        stroke: #2f5665;
        stroke-width: 2.4;
        fill: none;
      }
      .hero__row,
      .gallery-grid,
      .diagram-grid,
      .parity-grid {
        display: grid;
        gap: 18px;
      }
      .hero__row {
        grid-template-columns: auto 1fr;
        align-items: center;
      }
      .gallery-grid,
      .diagram-grid,
      .parity-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 18px;
      }
      .panel {
        padding: 20px;
      }
      .specimen {
        display: grid;
        gap: 12px;
      }
      .specimen strong,
      .diagram-card strong {
        font-size: 1.05rem;
      }
      .eyebrow {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.72rem;
        color: #566068;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .chip {
        padding: 7px 10px;
        border-radius: 999px;
        background: rgba(47, 86, 101, 0.1);
        font-size: 0.84rem;
      }
      .diagram-card,
      .parity-card {
        padding: 18px;
        border-radius: 22px;
        background: rgba(232, 227, 217, 0.72);
      }
      svg.diagram {
        width: 100%;
        height: 220px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.92rem;
      }
      th,
      td {
        padding: 10px 8px;
        border-bottom: 1px solid rgba(50, 57, 61, 0.12);
        text-align: left;
      }
      pre {
        overflow: auto;
        padding: 16px;
        border-radius: 18px;
        background: rgba(24, 29, 31, 0.92);
        color: #f8f7f3;
      }
      @media (max-width: 900px) {
        .gallery-grid,
        .diagram-grid,
        .parity-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main data-testid="ops-shell-gallery">
      <section class="hero" data-testid="ops-shell-gallery-hero">
        <div class="hero__row">
          <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="8" y="8" width="56" height="56" rx="16"></rect>
            <path d="M20 27.5H52"></path>
            <path d="M20 36H52"></path>
            <path d="M20 44.5H52"></path>
            <circle cx="28" cy="36" r="4.5"></circle>
            <circle cx="44" cy="27.5" r="3.5"></circle>
            <circle cx="44" cy="44.5" r="3.5"></circle>
          </svg>
          <div>
            <p class="eyebrow">Quiet operations mission control</p>
            <h1>Operations shell gallery</h1>
            <p>The seed gallery proves one premium control-room frame with truthful anomaly promotion, same-shell child routes, bounded governance handoff, and visualization parity fallbacks.</p>
          </div>
        </div>
      </section>

      <section class="gallery-grid" id="gallery" data-testid="ops-shell-gallery-grid"></section>

      <section class="diagram-grid" data-testid="ops-shell-gallery-diagrams">
        <article class="panel diagram-card">
          <p class="eyebrow">Board topology diagram</p>
          <strong>One shell, two or three planes, one action lane</strong>
          <svg class="diagram" viewBox="0 0 520 220" role="img" aria-label="Board topology">
            <rect x="18" y="30" width="230" height="150" rx="18" fill="rgba(47,86,101,0.10)" stroke="#2f5665"></rect>
            <rect x="268" y="30" width="106" height="150" rx="18" fill="rgba(139,110,40,0.10)" stroke="#8b6e28"></rect>
            <rect x="392" y="30" width="110" height="150" rx="18" fill="rgba(23,28,31,0.06)" stroke="#4f5960"></rect>
            <text x="38" y="60">Dominant anomaly field</text>
            <text x="38" y="88">NorthStarBand + BottleneckRadar</text>
            <text x="288" y="60">Workbench</text>
            <text x="412" y="60">Compare / incident plane</text>
            <text x="412" y="88">Only when explicitly promoted</text>
          </svg>
          <p>Summary: the board stays in two-plane posture until compare or incident-command posture explicitly opens the third plane.</p>
        </article>

        <article class="panel diagram-card">
          <p class="eyebrow">Anomaly to intervention flow</p>
          <strong>Promotion stays bounded by the eligibility fence</strong>
          <svg class="diagram" viewBox="0 0 520 220" role="img" aria-label="Anomaly to intervention flow">
            <rect x="24" y="70" width="110" height="72" rx="16" fill="rgba(143,65,49,0.10)" stroke="#8f4131"></rect>
            <rect x="196" y="70" width="126" height="72" rx="16" fill="rgba(47,86,101,0.10)" stroke="#2f5665"></rect>
            <rect x="382" y="70" width="116" height="72" rx="16" fill="rgba(139,110,40,0.10)" stroke="#8b6e28"></rect>
            <path d="M134 106H196" stroke="#192024" stroke-width="2"></path>
            <path d="M322 106H382" stroke="#192024" stroke-width="2"></path>
            <text x="44" y="100">Promoted anomaly</text>
            <text x="214" y="100">Eligibility fence</text>
            <text x="400" y="100">Intervention workbench</text>
          </svg>
          <p>Summary: the shell never hides the workbench; it freezes or guards it when authority degrades.</p>
        </article>

        <article class="panel diagram-card">
          <p class="eyebrow">Delta gate and return law</p>
          <strong>Buffer, freeze, then return safely</strong>
          <svg class="diagram" viewBox="0 0 520 220" role="img" aria-label="Delta gate and restore">
            <rect x="32" y="42" width="120" height="60" rx="16" fill="rgba(47,86,101,0.10)" stroke="#2f5665"></rect>
            <rect x="200" y="42" width="124" height="60" rx="16" fill="rgba(139,110,40,0.12)" stroke="#8b6e28"></rect>
            <rect x="370" y="42" width="118" height="60" rx="16" fill="rgba(143,65,49,0.12)" stroke="#8f4131"></rect>
            <rect x="122" y="142" width="270" height="48" rx="16" fill="rgba(23,28,31,0.06)" stroke="#4f5960"></rect>
            <text x="58" y="78">Live</text>
            <text x="220" y="78">Buffered delta</text>
            <text x="402" y="78">Frozen / table-only</text>
            <text x="154" y="171">OpsReturnToken returns to the preserved board state</text>
          </svg>
          <p>Summary: child routes preserve the active question and return to the board by token, not history guesswork.</p>
        </article>

        <article class="panel">
          <p class="eyebrow">Route map</p>
          <strong>Mermaid source</strong>
          <pre data-testid="ops-shell-gallery-route-map">${mermaid}</pre>
        </article>
      </section>

      <section class="parity-grid" data-testid="ops-shell-gallery-parity">
        <article class="panel parity-card">
          <p class="eyebrow">Visualization parity specimen</p>
          <strong>Chart plus table</strong>
          <div class="chips">
            <span class="chip">Live</span>
            <span class="chip">Table fallback present</span>
          </div>
          <table>
            <thead>
              <tr><th>Service</th><th>State</th><th>Trust</th></tr>
            </thead>
            <tbody>
              <tr><td>Confirmation service</td><td>Degraded</td><td>Authoritative</td></tr>
              <tr><td>Notification delivery</td><td>Degraded</td><td>Buffered</td></tr>
              <tr><td>Continuity evidence</td><td>Blocked</td><td>Stale</td></tr>
            </tbody>
          </table>
        </article>

        <article class="panel parity-card">
          <p class="eyebrow">Parity downgrade</p>
          <strong>Table-only fallback</strong>
          <div class="chips">
            <span class="chip">Parity degraded</span>
            <span class="chip">Same shell preserved</span>
          </div>
          <p>The shell keeps the explanation and table fallback visible while the visual layer is suppressed inside the same route family.</p>
        </article>
      </section>
    </main>

    <script type="module">
      const seed = ${serializedSeed};
      const gallery = document.getElementById("gallery");
      gallery.innerHTML = seed
        .map((snapshot) => \`
          <article class="panel specimen" data-testid="ops-gallery-snapshot-\${snapshot.snapshotId}" data-frame-mode="\${snapshot.frameMode}">
            <p class="eyebrow">\${snapshot.location.pathname}</p>
            <strong>\${snapshot.selectedAnomaly.title}</strong>
            <p>\${snapshot.summarySentence}</p>
            <div class="chips">
              <span class="chip">Lease \${snapshot.selectionLease.leaseState}</span>
              <span class="chip">Delta \${snapshot.deltaGate.gateState}</span>
              <span class="chip">Workbench \${snapshot.workbenchState}</span>
            </div>
          </article>
        \`)
        .join("");
    </script>
  </body>
</html>`;
}

function main() {
  writeFile(ROUTES_MD, buildRoutesDoc());
  writeFile(PROJECTIONS_MD, buildProjectionDoc());
  writeFile(CONTINUITY_MD, buildContinuityDoc());
  writeFile(ROUTE_MAP_MMD, `${createOpsRouteMapMermaid()}\n`);
  writeFile(GALLERY_HTML, buildGalleryHtml());
  writeFile(ROUTES_CSV, `${toCsv(opsRouteContractSeedRows)}\n`);
  writeFile(
    PROJECTIONS_JSON,
    `${JSON.stringify(
      {
        task_id: OPS_SHELL_TASK_ID,
        visual_mode: OPS_SHELL_VISUAL_MODE,
        examples: opsMockProjectionExamples,
        gallery: createOpsGallerySeed(),
      },
      null,
      2,
    )}\n`,
  );
  writeFile(ANOMALY_CSV, `${toCsv(opsAnomalyMatrixRows)}\n`);
}

main();
