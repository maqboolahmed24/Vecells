import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  HUB_SHELL_TASK_ID,
  HUB_SHELL_VISUAL_MODE,
  createHubGallerySeed,
  createHubRouteMapMermaid,
  hubMockProjectionExamples,
  hubOptionTimerMatrixRows,
  hubRouteContractSeedRows,
} from "../../apps/hub-desk/src/hub-shell-seed.model";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DOCS_DIR = path.join(ROOT, "docs", "architecture");
const DATA_DIR = path.join(ROOT, "data", "analysis");

const ROUTES_MD = path.join(DOCS_DIR, "118_hub_shell_seed_routes.md");
const PROJECTIONS_MD = path.join(DOCS_DIR, "118_hub_mock_projection_strategy.md");
const TRUTH_MD = path.join(DOCS_DIR, "118_hub_option_truth_and_fallback_contracts.md");
const ROUTE_MAP_MMD = path.join(DOCS_DIR, "118_hub_shell_route_map.mmd");
const GALLERY_HTML = path.join(DOCS_DIR, "118_hub_shell_gallery.html");

const ROUTES_CSV = path.join(DATA_DIR, "hub_route_contract_seed.csv");
const PROJECTIONS_JSON = path.join(DATA_DIR, "hub_mock_projection_examples.json");
const OPTION_MATRIX_CSV = path.join(DATA_DIR, "hub_option_and_timer_matrix.csv");

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
  return `# Hub shell seed routes

- Task: \`${HUB_SHELL_TASK_ID}\`
- Visual mode: \`${HUB_SHELL_VISUAL_MODE}\`
- Shell: \`hub-desk\`
- Route families: \`rf_hub_queue\`, \`rf_hub_case_management\`

## Same-shell law

The hub shell keeps one continuity frame, \`hub.queue\`, across queue review, case management, alternatives, exceptions, and audit. The selected case, the current option truth, the CasePulse summary, and the DecisionDock explanation stay live together rather than splitting into detached pages.

## Canonical routes

${hubRouteContractSeedRows
  .map(
    (row) =>
      `- \`${row.path}\` -> \`${row.routeFamilyRef}\` (${row.viewMode}) :: ${row.summary}`,
  )
  .join("\n")}

## Shell promises

1. Queue remains read-only and multi-user; case-management routes own the writable next step.
2. Alternatives and audit are same-shell views, not second applications.
3. Exceptions stay attached to the active case and current option truth instead of turning into a detached backlog.
`;
}

function buildProjectionDoc() {
  return `# Hub mock projection strategy

The seed shell uses truthful mock projections with the same route topology, selected-anchor law, and fallback behavior that the live hub domain will need later. It is intentionally precise about option truth and acknowledgement debt rather than simulating a generic call-centre queue.

## Seeded projection families

${hubMockProjectionExamples
  .map(
    (example) =>
      `- \`${example.exampleId}\` at \`${example.path}\` :: ${example.summary}`,
  )
  .join("\n")}

## Seeded case truths

- Held option with genuine exclusivity countdown
- Truthful nonexclusive offer with response-window wording only
- Native booking confirmation pending without calm booked posture
- Confirmed booking blocked by generation-bound practice acknowledgement debt
- Callback transfer pending after safe supply disappears
`;
}

function buildTruthDoc() {
  return `# Hub option truth and fallback contracts

## Timer law

Only \`exclusive_hold\` options may show a reserved countdown. \`truthful_nonexclusive\` options may show a response window, but they must say the slot remains subject to live confirmation. \`confirmation_pending\`, \`confirmed\`, \`callback_only\`, and \`diagnostic_only\` options never drive hold-style urgency.

## Fallback law

- \`callback_only\` is an explicit continuation, not a weak promise of future supply.
- \`diagnostic_only\` remains visible only as provenance and never reopens writable slot posture.
- \`confirmation_pending\` suppresses calm booked posture until stronger supplier evidence arrives.
- \`confirmed\` may still coexist with acknowledgement debt; closure waits for the current practice acknowledgement generation.

## Published matrix coverage

${hubOptionTimerMatrixRows
  .map(
    (row) =>
      `- \`${row.caseId}\` / \`${row.optionId}\` -> \`${row.optionTruthMode}\` + \`${row.timerMode}\` :: ${row.timerLabel}`,
  )
  .join("\n")}
`;
}

function buildGalleryHtml() {
  const gallerySeed = createHubGallerySeed();
  const serializedSeed = JSON.stringify(gallerySeed, null, 2);
  const mermaid = createHubRouteMapMermaid();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hub Shell Gallery</title>
    <style>
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Avenir Next", sans-serif;
        color: #17272d;
        background:
          radial-gradient(circle at top left, rgba(29, 91, 102, 0.16), transparent 26%),
          radial-gradient(circle at 88% 18%, rgba(156, 109, 39, 0.18), transparent 22%),
          linear-gradient(180deg, #fbf7f0 0%, #efe4d2 100%);
      }
      main {
        width: min(1200px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 48px;
      }
      .hero,
      .panel {
        border: 1px solid rgba(24, 48, 56, 0.12);
        border-radius: 28px;
        background: rgba(255, 251, 246, 0.92);
        box-shadow: 0 20px 44px rgba(28, 34, 36, 0.12);
      }
      .hero,
      .panel {
        padding: 22px;
      }
      .hero-row,
      .grid {
        display: grid;
        gap: 18px;
      }
      .hero-row {
        grid-template-columns: auto 1fr;
        align-items: center;
      }
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 18px;
      }
      .eyebrow {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.72rem;
        color: #5d6c72;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .chip {
        padding: 8px 10px;
        border-radius: 999px;
        background: rgba(29, 91, 102, 0.1);
      }
      .specimen,
      .diagram-card {
        padding: 18px;
        border-radius: 22px;
        background: rgba(240, 233, 221, 0.82);
      }
      pre {
        overflow: auto;
        padding: 16px;
        border-radius: 18px;
        background: rgba(24, 29, 31, 0.92);
        color: #f8f7f3;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.92rem;
      }
      th,
      td {
        padding: 10px 8px;
        border-bottom: 1px solid rgba(24, 48, 56, 0.1);
        text-align: left;
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main data-testid="hub-shell-gallery">
      <section class="hero" data-testid="hub-shell-gallery-hero">
        <div class="hero-row">
          <svg viewBox="0 0 72 72" width="56" height="56" aria-hidden="true" fill="none" stroke="#1d5b66" stroke-width="2.6">
            <rect x="8" y="8" width="56" height="56" rx="18"></rect>
            <path d="M20 24H52"></path>
            <path d="M20 36H52"></path>
            <path d="M20 48H40"></path>
            <circle cx="46" cy="48" r="6"></circle>
          </svg>
          <div>
            <p class="eyebrow">Hub shell gallery</p>
            <h1>Queue-first same-shell coordination</h1>
            <p>The hub seed routes keep ranked options, fallback truth, acknowledgement debt, and audit proof inside one premium shell.</p>
          </div>
        </div>
        <div class="chips">
          <span class="chip">rf_hub_queue</span>
          <span class="chip">rf_hub_case_management</span>
          <span class="chip">continuity key hub.queue</span>
          <span class="chip">case pulse + decision dock stay live</span>
        </div>
      </section>

      <section class="grid">
        ${hubMockProjectionExamples
          .map(
            (example) => `
          <article class="specimen">
            <p class="eyebrow">${example.viewMode}</p>
            <strong>${example.exampleId}</strong>
            <p>${example.summary}</p>
            <div class="chips">
              <span class="chip">${example.status}</span>
              <span class="chip">${example.optionTruthMode}</span>
              <span class="chip">${example.timerMode}</span>
            </div>
          </article>`,
          )
          .join("")}
      </section>

      <section class="grid">
        <article class="panel diagram-card">
          <p class="eyebrow">Route map</p>
          <strong>Same-shell route flow</strong>
          <pre>${mermaid}</pre>
        </article>
        <article class="panel diagram-card">
          <p class="eyebrow">Truth and timer specimens</p>
          <strong>Option contract summary</strong>
          <table>
            <thead>
              <tr>
                <th>Option</th>
                <th>Truth</th>
                <th>Timer</th>
              </tr>
            </thead>
            <tbody>
              ${hubOptionTimerMatrixRows
                .slice(0, 6)
                .map(
                  (row) => `
                <tr>
                  <td>${row.optionId}</td>
                  <td>${row.optionTruthMode}</td>
                  <td>${row.timerMode}</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </article>
      </section>

      <section class="panel">
        <p class="eyebrow">Gallery seed</p>
        <strong>Serialized specimen seed</strong>
        <pre>${serializedSeed}</pre>
      </section>
    </main>
  </body>
</html>`;
}

function main() {
  writeFile(ROUTES_MD, buildRoutesDoc());
  writeFile(PROJECTIONS_MD, buildProjectionDoc());
  writeFile(TRUTH_MD, buildTruthDoc());
  writeFile(ROUTE_MAP_MMD, `${createHubRouteMapMermaid()}\n`);
  writeFile(GALLERY_HTML, buildGalleryHtml());
  writeFile(ROUTES_CSV, `${toCsv(hubRouteContractSeedRows)}\n`);
  writeFile(
    PROJECTIONS_JSON,
    `${JSON.stringify(
      {
        task_id: HUB_SHELL_TASK_ID,
        visual_mode: HUB_SHELL_VISUAL_MODE,
        examples: hubMockProjectionExamples,
        gallery: createHubGallerySeed(),
      },
      null,
      2,
    )}\n`,
  );
  writeFile(OPTION_MATRIX_CSV, `${toCsv(hubOptionTimerMatrixRows)}\n`);
}

main();
