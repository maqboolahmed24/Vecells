import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "91_build_provenance_pipeline_atlas.html",
);
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "build_provenance_manifest.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "pipeline_gate_matrix.csv");
const POLICY_PATH = path.join(ROOT, "data", "analysis", "artifact_quarantine_policy.json");

export const buildProvenancePipelineAtlasCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that quarantined, revoked, and published states are visually and semantically distinct",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
  );
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/91_build_provenance_pipeline_atlas.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/91_build_provenance_pipeline_atlas.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Build provenance atlas HTML is missing.");
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const policy = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));

  assertCondition(manifest.summary.pipeline_run_count === 8, "Pipeline run count drifted.");
  assertCondition(matrix.length === 40, "Pipeline gate matrix count drifted.");
  assertCondition(policy.rules.length === 6, "Quarantine rule count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='pipeline-lane']").waitFor();
    await page.locator("[data-testid='provenance-card-wall']").waitFor();
    await page.locator("[data-testid='decision-timeline']").waitFor();
    await page.locator("[data-testid='run-table']").waitFor();
    await page.locator("[data-testid='policy-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='run-row-']").count()) ===
        manifest.summary.pipeline_run_count,
      "Initial run-table row count drifted.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("integration");
    await page.locator("[data-testid='filter-provenance-state']").selectOption("quarantined");
    assertCondition(
      (await page.locator("[data-testid^='run-row-']").count()) === 1,
      "Environment + provenance filter drifted.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-provenance-state']").selectOption("all");
    await page.locator("[data-testid='filter-artifact-state']").selectOption("revoked");
    assertCondition(
      (await page.locator("[data-testid^='run-row-']").count()) === 1,
      "Artifact-state filter drifted.",
    );

    await page.locator("[data-testid='filter-artifact-state']").selectOption("all");
    await page.locator("[data-testid='filter-gate']").selectOption("provenance_verify");
    const provenanceVerifyRows = await page.locator("[data-testid^='run-row-']").count();
    assertCondition(provenanceVerifyRows === 3, "Gate filter drifted.");

    await page.locator("[data-testid='filter-gate']").selectOption("all");
    await page
      .locator("[data-testid='filter-build-family']")
      .selectOption("bf_release_control_bundle");
    assertCondition(
      (await page.locator("[data-testid^='run-row-']").count()) === 2,
      "Build-family filter drifted.",
    );

    await page.locator("[data-testid='filter-build-family']").selectOption("all");
    await page
      .locator("[data-testid='run-row-run_gateway_integration_quarantined_dependency'] .row-button")
      .click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("run_gateway_integration_quarantined_dependency") &&
        inspectorText.includes("DEPENDENCY_POLICY_BLOCKED"),
      "Inspector lost synchronized selection detail.",
    );
    const cardSelected = await page
      .locator("[data-testid='provenance-card-run_gateway_integration_quarantined_dependency']")
      .getAttribute("data-selected");
    assertCondition(cardSelected === "true", "Card selection did not synchronize.");
    const timelineSelected = await page
      .locator("[data-testid='timeline-item-run_gateway_integration_quarantined_dependency']")
      .getAttribute("data-selected");
    assertCondition(timelineSelected === "true", "Timeline selection did not synchronize.");

    const publishedColor = await page.evaluate(() => {
      const node = document.querySelector(
        "[data-testid='provenance-card-run_foundation_ci_preview_verified'] .badge-verified",
      );
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    const quarantinedColor = await page.evaluate(() => {
      const card = document.querySelector(
        "[data-testid='provenance-card-run_gateway_integration_quarantined_dependency']",
      );
      const node = card?.querySelector(".badge-quarantined");
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    const revokedColor = await page.evaluate(() => {
      const card = document.querySelector(
        "[data-testid='provenance-card-run_command_preprod_revoked']",
      );
      const node = card?.querySelector(".badge-revoked");
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    assertCondition(
      publishedColor !== quarantinedColor && quarantinedColor !== revokedColor,
      "Published, quarantined, and revoked states are no longer visually distinct.",
    );

    await page
      .locator("[data-testid='run-row-run_foundation_ci_preview_verified'] .row-button")
      .focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='run-row-run_gateway_integration_quarantined_dependency']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance visible selection.");

    await page.setViewportSize({ width: 980, height: 900 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared on tablet width.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarks = await page.locator("header, nav, main, aside, section").count();
    assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}.`);
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
