import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "100_build_provenance_cockpit.html");
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "build_provenance_integrity_catalog.json");
const SCOPE_PATH = path.join(ROOT, "data", "analysis", "sbom_scope_catalog.json");

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/100_build_provenance_cockpit.html"
          : rawUrl.split("?")[0];
      const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
      const filePath = path.join(ROOT, safePath);
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4400, "127.0.0.1", () => resolve(server));
  });
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing provenance cockpit: ${HTML_PATH}`);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const scopeCatalog = JSON.parse(fs.readFileSync(SCOPE_PATH, "utf8"));
  const integrationQuarantinedCount = catalog.provenanceScenarios.filter(
    (scenario) =>
      scenario.environmentRing === "integration" && scenario.decisionState === "quarantined",
  ).length;

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.BUILD_PROVENANCE_COCKPIT_URL ??
    "http://127.0.0.1:4400/docs/architecture/100_build_provenance_cockpit.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "cockpit-masthead",
      "current-snapshot",
      "filter-ring",
      "filter-decision",
      "scenario-grid",
      "scenario-table",
      "policy-table",
      "scope-table",
      "inspector",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    assertCondition(
      (await page.locator(".scenario-card").count()) === catalog.provenanceScenarios.length,
      "Initial scenario-card count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='scope-row-']").count()) ===
        scopeCatalog.buildFamilies.length,
      "SBOM scope-table count drifted.",
    );

    // filters scenarios by ring and decision state
    await page.locator("[data-testid='filter-ring']").selectOption("integration");
    await page.locator("[data-testid='filter-decision']").selectOption("quarantined");
    assertCondition(
      (await page.locator(".scenario-card").count()) === integrationQuarantinedCount,
      "Filtered scenario-card count drifted.",
    );

    // keeps inspector selection synchronized between the card grid and table
    await page.locator("[data-testid='scenario-card-INTEGRATION_SIGNATURE_DRIFT_QUARANTINED']").click();
    let inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("INTEGRATION_SIGNATURE_DRIFT_QUARANTINED") &&
        inspectorText.includes("ATTESTATION_SIGNATURE_MISMATCH"),
      "Inspector did not synchronize from the card grid.",
    );

    await page.locator("[data-testid='scenario-row-INTEGRATION_SIGNATURE_DRIFT_QUARANTINED']").click();
    inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("integration") && inspectorText.includes("quarantined"),
      "Inspector did not synchronize from the scenario table.",
    );

    // renders reduced-motion and responsive layouts without dropping landmarks
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 960, height: 1180 });
    for (const testId of [
      "cockpit-masthead",
      "scenario-grid",
      "policy-table",
      "scope-table",
      "inspector",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  assertCondition(fs.existsSync(HTML_PATH), `Missing provenance cockpit: ${HTML_PATH}`);
  assertCondition(fs.existsSync(CATALOG_PATH), `Missing integrity catalog: ${CATALOG_PATH}`);
  assertCondition(fs.existsSync(SCOPE_PATH), `Missing SBOM scope catalog: ${SCOPE_PATH}`);
}
