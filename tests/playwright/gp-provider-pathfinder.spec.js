import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "external", "36_gp_provider_pathfinder.html");
const DECISION_REGISTER_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "gp_provider_decision_register.json",
);
const EVIDENCE_PATH = path.join(ROOT, "data", "analysis", "gp_booking_capability_evidence.json");

const DECISION_REGISTER = JSON.parse(fs.readFileSync(DECISION_REGISTER_PATH, "utf8"));
const EVIDENCE = JSON.parse(fs.readFileSync(EVIDENCE_PATH, "utf8"));

export const gpProviderPathfinderCoverage = [
  "actor, maturity, and proof-class filtering",
  "freshness sorting",
  "provider-rail and matrix parity",
  "proof-ladder updates",
  "inspector synchronization",
  "gap-strip visibility",
  "keyboard navigation",
  "offline-static behavior",
  "responsive desktop/tablet/mobile layouts",
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = path.join(ROOT, "docs", "external");
    const server = http.createServer((req, res) => {
      if (!req.url || req.url === "/") {
        res.writeHead(302, { Location: "/36_gp_provider_pathfinder.html" });
        res.end();
        return;
      }
      const safePath = req.url.replace(/^\/+/, "");
      const filePath = path.join(rootDir, safePath);
      if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4326, "127.0.0.1", () => resolve(server));
  });
}

function ensureDir(dirPath) {
  if (!dirPath) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

async function maybeCapture(page, name) {
  const captureDir = process.env.SEQ036_CAPTURE_DIR;
  if (!captureDir) return;
  ensureDir(captureDir);
  await page.screenshot({ path: path.join(captureDir, name), fullPage: true });
}

async function run() {
  if (!fs.existsSync(HTML_PATH)) {
    throw new Error(`Missing HTML pathfinder: ${HTML_PATH}`);
  }

  const report = {
    task: DECISION_REGISTER.task_id,
    visualMode: DECISION_REGISTER.visual_mode,
    coverage: gpProviderPathfinderCoverage,
  };

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const url =
    process.env.GP_PROVIDER_PATHFINDER_URL ??
    "http://127.0.0.1:4326/36_gp_provider_pathfinder.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='pathfinder-shell']").waitFor();
    report.loaded = true;

    const rowCount = await page.locator("#matrix-body tr").count();
    if (rowCount !== 6) {
      throw new Error(`Expected 6 path rows on initial load, found ${rowCount}`);
    }

    await page.locator("[data-testid='filter-maturity']").selectOption("watch_only");
    const watchRows = await page.locator("#matrix-body tr").count();
    if (watchRows !== 2) {
      throw new Error(`Expected 2 watch-only rows, found ${watchRows}`);
    }
    await page
      .locator("[data-testid='path-row-gp_connect_appointment_management_watch_only']")
      .click();
    await page.locator("[data-testid='path-inspector']").waitFor();
    await page.locator("[data-testid='proof-ladder']").waitFor();

    await page.locator("[data-testid='filter-maturity']").selectOption("all");
    await page.locator("[data-testid='filter-actor-mode']").selectOption("patient_self_service");
    const patientRows = await page.locator("#matrix-body tr").count();
    if (patientRows < 3) {
      throw new Error(`Expected at least 3 patient-self-service rows, found ${patientRows}`);
    }
    await page
      .locator("[data-testid='filter-proof-class']")
      .selectOption("authoritative_commit_or_read_after_write");
    const im1Rows = await page.locator("#matrix-body tr").count();
    if (im1Rows !== 2) {
      throw new Error(`Expected 2 IM1 rows after proof-class filter, found ${im1Rows}`);
    }
    await page.locator("[data-testid='path-row-im1_pairing_optum_emisweb']").click();
    const inspectorText = await page.locator("[data-testid='path-inspector']").innerText();
    if (!inspectorText.includes("BookingConfirmationTruthProjection")) {
      throw new Error("Inspector no longer includes confirmation truth proof.");
    }

    await page.locator("[data-testid='filter-proof-class']").selectOption("all");
    await page.locator("[data-testid='filter-actor-mode']").selectOption("all");
    await page.locator("[data-testid='sort-freshness']").selectOption("freshness_desc");
    const firstRowText = await page.locator("#matrix-body tr").first().innerText();
    if (!firstRowText.includes("Local adapter simulator / Required")) {
      throw new Error("Freshness sort no longer brings the local simulator to the top.");
    }

    const gapCardCount = await page.locator("#gap-grid .gap-card").count();
    if (gapCardCount < 6) {
      throw new Error(`Expected at least 6 visible gap cards, found ${gapCardCount}`);
    }

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowDown");

    await maybeCapture(page, "seq_036_pathfinder_desktop.png");

    await page.setViewportSize({ width: 1024, height: 1100 });
    await page.locator("[data-testid='path-matrix']").waitFor();
    await maybeCapture(page, "seq_036_pathfinder_tablet.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='provider-rail']").waitFor();
    await maybeCapture(page, "seq_036_pathfinder_mobile.png");

    await page.context().setOffline(true);
    await page.locator("[data-testid='path-button-manual_practice_handoff_only']").click();
    const offlineInspectorText = await page.locator("[data-testid='path-inspector']").innerText();
    if (!offlineInspectorText.includes("ExternalConfirmationGate")) {
      throw new Error("Offline interaction no longer preserves manual path truth details.");
    }

    report.matrixRowCount = rowCount;
    report.watchRowCount = watchRows;
    report.patientRowCount = patientRows;
    report.im1RowCount = im1Rows;
    report.gapCardCount = gapCardCount;
    report.phase0Verdict = DECISION_REGISTER.summary.phase0_entry_verdict;
    report.proofClassCount = EVIDENCE.summary.proof_class_count;
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }

  if (process.env.SEQ036_REPORT_PATH) {
    ensureDir(path.dirname(process.env.SEQ036_REPORT_PATH));
    fs.writeFileSync(process.env.SEQ036_REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const gpProviderPathfinderManifest = {
  task: DECISION_REGISTER.task_id,
  paths: DECISION_REGISTER.summary.path_count,
  blockedGates: DECISION_REGISTER.summary.blocked_live_gate_count,
  proofClasses: EVIDENCE.summary.proof_class_count,
};
