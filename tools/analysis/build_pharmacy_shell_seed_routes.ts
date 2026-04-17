import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PHARMACY_SHELL_TASK_ID,
  PHARMACY_SHELL_VISUAL_MODE,
  createPharmacyGallerySeed,
  createPharmacyRouteMapMermaid,
  pharmacyCases,
  pharmacyCheckpointAndProofMatrixRows,
  pharmacyMockProjectionExamples,
  pharmacyRouteContractSeedRows,
} from "../../apps/pharmacy-console/src/pharmacy-shell-seed.model";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DOCS_DIR = path.join(ROOT, "docs", "architecture");
const DATA_DIR = path.join(ROOT, "data", "analysis");

const ROUTES_MD = path.join(DOCS_DIR, "120_pharmacy_shell_seed_routes.md");
const PROJECTIONS_MD = path.join(DOCS_DIR, "120_pharmacy_mock_projection_strategy.md");
const CONTRACTS_MD = path.join(
  DOCS_DIR,
  "120_pharmacy_checkpoint_dispatch_and_outcome_contracts.md",
);
const ROUTE_MAP_MMD = path.join(DOCS_DIR, "120_pharmacy_shell_route_map.mmd");
const GALLERY_HTML = path.join(DOCS_DIR, "120_pharmacy_shell_gallery.html");

const ROUTES_CSV = path.join(DATA_DIR, "pharmacy_route_contract_seed.csv");
const PROJECTIONS_JSON = path.join(DATA_DIR, "pharmacy_mock_projection_examples.json");
const MATRIX_CSV = path.join(DATA_DIR, "pharmacy_checkpoint_and_proof_matrix.csv");

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
  return `# Pharmacy shell seed routes

- Task: \`${PHARMACY_SHELL_TASK_ID}\`
- Visual mode: \`${PHARMACY_SHELL_VISUAL_MODE}\`
- Shell: \`pharmacy-console\`
- Route family: \`rf_pharmacy_console\`

## Seed route law

The Phase 0 pharmacy shell keeps one continuity frame for queue, case workbench, validation review, inventory truth, dispatch proof, outcome review, and assurance. These are child states of the same pharmacy shell, not detached staff pages.

## Non-negotiable shell posture

1. Same case, same shell.
2. One checkpoint and one dominant action remain promoted at a time.
3. Inventory, consent, proof, and outcome truth stay explicit even when the shell is quiet.
4. Urgent return and reopen-for-safety posture stay in the same continuity frame rather than spawning a separate recovery UI.

## Canonical routes

- \`/workspace/pharmacy\` -> \`lane\`
- \`/workspace/pharmacy/:pharmacyCaseId\` -> \`case\`
- \`/workspace/pharmacy/:pharmacyCaseId/validate\` -> \`validate\`
- \`/workspace/pharmacy/:pharmacyCaseId/inventory\` -> \`inventory\`
- \`/workspace/pharmacy/:pharmacyCaseId/resolve\` -> \`resolve\`
- \`/workspace/pharmacy/:pharmacyCaseId/handoff\` -> \`handoff\`
- \`/workspace/pharmacy/:pharmacyCaseId/assurance\` -> \`assurance\`

## Seeded route witnesses

${pharmacyRouteContractSeedRows
  .map((row) => `- \`${row.path}\` -> \`${row.routeKey}\` :: ${row.summary}`)
  .join("\n")}

## Active anchors

- Queue lane root preserves the active case and queue anchor while the validation board stays visible.
- Case workbench preserves the active checkpoint and line item through same-shell posture changes.
- Child routes use a pharmacy return token instead of raw browser history so the exact checkpoint and line item reopen safely.
`;
}

function buildProjectionDoc() {
  return `# Pharmacy mock projection strategy

The seed uses one shared mock projection set to drive the queue spine, validation board, checkpoint rail, decision dock, route examples, gallery, and validator. The shell always keeps a calm explanation visible, then changes posture truthfully instead of swapping shells.

## Seeded scenario coverage

${pharmacyCases
  .map(
    (caseSeed) =>
      `- \`${caseSeed.scenario}\` / \`${caseSeed.pharmacyCaseId}\` :: ${caseSeed.queueSummary}`,
  )
  .join("\n")}

## Projection rules

1. Queue rows describe the highest consequence signal without pretending that local activity is final release or closure.
2. The validation board always keeps one active case, one active checkpoint, and one active line item visible.
3. Inventory truth downgrades from visual-plus-table to table-only or summary-only without swapping route family.
4. Weak-match, contradictory proof, clarification, and urgent-return cases stay procedurally explicit rather than cosmetically complete.

## Future-gap markers published in the seed

- \`GAP_PHARMACY_PROVIDER_SPECIFIC_DISPATCH_BINDING_V1\`
- \`GAP_FUTURE_PHARMACY_FLOW_DIRECTORY_RESELECTION_V1\`
- \`GAP_TRUTHFUL_PHARMACY_POSTURE_CONSENT_DRIFT_V1\`
- \`GAP_TRUTHFUL_PHARMACY_POSTURE_PROOF_DISPUTE_V1\`
- \`GAP_TRUTHFUL_PHARMACY_POSTURE_WEAK_MATCH_V1\`
- \`GAP_TRUTHFUL_PHARMACY_POSTURE_REOPEN_SAFETY_V1\`
`;
}

function buildContractsDoc() {
  return `# Pharmacy checkpoint dispatch and outcome contracts

## Consent and checkpoint truth

The active checkpoint rail is the shell-local summary of consent, validation, inventory, dispatch, and outcome posture. A blocked or review-required checkpoint may narrow the route posture, but it may not silently advance the active line item or replace the shell.

## Dispatch proof contract

Dispatch proof remains split into three lanes:

1. Transport acceptance
2. Provider acceptance
3. Authoritative proof

Local acknowledgement, adapter acceptance, or historical dispatch may widen pending copy, but they may not tint the shell as quietly released until the authoritative proof lane is satisfied for the current case.

## Outcome truth contract

Outcome review stays separate from dispatch proof. Weak-match outcome, manual-review debt, contradictory proof, and urgent-return posture remain explicit in the same shell and continue to bind the current case, checkpoint, and line item.

## Reopen-for-safety

Urgent return and reopen-for-safety posture keep the same route family, active case, and return-safe context. The assurance route is therefore a same-shell promoted state, not a detached exception page.
`;
}

function buildGalleryHtml() {
  const gallerySeed = createPharmacyGallerySeed();
  const serializedSeed = JSON.stringify(gallerySeed, null, 2);
  const mermaid = createPharmacyRouteMapMermaid();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pharmacy Shell Gallery</title>
    <style>
      body {
        margin: 0;
        font-family: "IBM Plex Sans", "Avenir Next", sans-serif;
        color: #182226;
        background:
          radial-gradient(circle at top right, rgba(36, 106, 99, 0.14), transparent 25%),
          linear-gradient(180deg, #f6f0e8 0%, #ece4da 100%);
      }
      main {
        width: min(1220px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 44px;
      }
      .hero,
      .panel {
        border-radius: 28px;
        border: 1px solid rgba(35, 46, 50, 0.14);
        background: rgba(252, 247, 239, 0.94);
        box-shadow: 0 18px 42px rgba(18, 22, 24, 0.08);
      }
      .hero {
        padding: 24px 28px;
      }
      .hero-grid,
      .specimen-grid,
      .route-grid {
        display: grid;
        gap: 18px;
      }
      .hero-grid {
        grid-template-columns: auto 1fr;
        align-items: center;
      }
      .specimen-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 18px;
      }
      .route-grid {
        grid-template-columns: 1.2fr 0.8fr;
        margin-top: 18px;
      }
      .panel {
        padding: 20px;
      }
      .eyebrow {
        margin: 0 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.72rem;
        color: #5d676b;
      }
      svg {
        width: 54px;
        height: 54px;
        stroke: #1e5f62;
        stroke-width: 2.8;
        fill: rgba(255, 255, 255, 0.22);
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .chip {
        padding: 8px 11px;
        border-radius: 999px;
        background: rgba(31, 108, 86, 0.1);
        font-size: 0.83rem;
      }
      .specimen-card {
        display: grid;
        gap: 10px;
      }
      .specimen-card strong {
        font-size: 1.04rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.92rem;
      }
      th,
      td {
        padding: 10px 8px;
        text-align: left;
        border-bottom: 1px solid rgba(35, 46, 50, 0.12);
      }
      pre {
        margin: 0;
        padding: 16px;
        border-radius: 18px;
        background: rgba(24, 29, 31, 0.94);
        color: #edf4f1;
        overflow: auto;
      }
      @media (max-width: 880px) {
        .hero-grid,
        .specimen-grid,
        .route-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main data-testid="pharmacy-shell-gallery" data-example-count="${gallerySeed.length}">
      <section class="hero">
        <div class="hero-grid">
          <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="10" y="10" width="76" height="76" rx="22" />
            <path d="M28 28H68" />
            <path d="M28 48H68" />
            <path d="M48 28V68" />
            <circle cx="30" cy="66" r="8" />
            <path d="M58 63C58 57.4772 62.4772 53 68 53V53C73.5228 53 78 57.4772 78 63V66H58V63Z" />
          </svg>
          <div>
            <p class="eyebrow">Pharmacy shell seed</p>
            <h1>Checkpoint-driven pharmacy console gallery</h1>
            <p>
              One queue spine, one validation board, one checkpoint rail, one decision dock, and one promoted support region. Dispatch proof, weak-match outcome, and reopen-for-safety all stay inside the same shell.
            </p>
            <div class="chips">
              <span class="chip">Task ${PHARMACY_SHELL_TASK_ID}</span>
              <span class="chip">Visual mode ${PHARMACY_SHELL_VISUAL_MODE}</span>
              <span class="chip">8 seeded scenarios</span>
            </div>
          </div>
        </div>
      </section>

      <section class="specimen-grid">
        ${gallerySeed
          .map(
            (specimen) => `<article class="panel specimen-card">
          <p class="eyebrow">${specimen.path}</p>
          <strong>${specimen.queueLane}</strong>
          <span>${specimen.summary}</span>
          <div class="chips">
            <span class="chip">${specimen.dominantAction}</span>
            <span class="chip">${specimen.visualizationMode}</span>
            <span class="chip">${specimen.recoveryPosture}</span>
          </div>
        </article>`,
          )
          .join("")}
      </section>

      <section class="route-grid">
        <article class="panel">
          <p class="eyebrow">Route map</p>
          <pre>${mermaid}</pre>
        </article>
        <article class="panel">
          <p class="eyebrow">Checkpoint, proof, and outcome matrix</p>
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Scenario</th>
                <th>Proof</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              ${pharmacyCheckpointAndProofMatrixRows
                .map(
                  (row) => `<tr>
                <td>${row.pharmacyCaseId}</td>
                <td>${row.scenario}</td>
                <td>${row.proofState}</td>
                <td>${row.outcomeTruthState}</td>
              </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </article>
      </section>

      <section class="panel">
        <p class="eyebrow">Serialized gallery seed</p>
        <pre>${serializedSeed}</pre>
      </section>
    </main>
  </body>
</html>`;
}

function main() {
  writeFile(ROUTES_MD, buildRoutesDoc());
  writeFile(PROJECTIONS_MD, buildProjectionDoc());
  writeFile(CONTRACTS_MD, buildContractsDoc());
  writeFile(ROUTE_MAP_MMD, `${createPharmacyRouteMapMermaid()}\n`);
  writeFile(GALLERY_HTML, buildGalleryHtml());
  writeFile(ROUTES_CSV, `${toCsv(pharmacyRouteContractSeedRows)}\n`);
  writeFile(
    PROJECTIONS_JSON,
    `${JSON.stringify(
      {
        task_id: PHARMACY_SHELL_TASK_ID,
        visual_mode: PHARMACY_SHELL_VISUAL_MODE,
        examples: pharmacyMockProjectionExamples,
        gallery: createPharmacyGallerySeed(),
      },
      null,
      2,
    )}\n`,
  );
  writeFile(MATRIX_CSV, `${toCsv(pharmacyCheckpointAndProofMatrixRows)}\n`);
}

main();
