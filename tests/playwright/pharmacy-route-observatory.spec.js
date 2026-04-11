import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "external", "37_pharmacy_route_observatory.html");
const REGISTER_PATH = path.join(ROOT, "data", "analysis", "pharmacy_referral_transport_decision_register.json");

const REGISTER = JSON.parse(fs.readFileSync(REGISTER_PATH, "utf8"));

export const pharmacyRouteObservatoryCoverage = [
  "route-purpose filtering",
  "route selection and inspector sync",
  "version sorting",
  "consent and proof card rendering",
  "blocker-chip visibility",
  "keyboard navigation",
  "responsive desktop/tablet/mobile layouts",
  "reduced-motion handling",
  "accessibility smoke",
  "table parity",
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function ensureDir(dirPath) {
  if (!dirPath) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = path.join(ROOT, "docs", "external");
    const server = http.createServer((req, res) => {
      if (!req.url || req.url === "/") {
        res.writeHead(302, { Location: "/37_pharmacy_route_observatory.html" });
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
      const contentType = filePath.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4336, "127.0.0.1", () => resolve(server));
  });
}

async function maybeCapture(page, name) {
  const captureDir = process.env.SEQ037_CAPTURE_DIR;
  if (!captureDir) return;
  ensureDir(captureDir);
  await page.screenshot({ path: path.join(captureDir, name), fullPage: true });
}

async function run() {
  if (!fs.existsSync(HTML_PATH)) {
    throw new Error(`Missing observatory HTML: ${HTML_PATH}`);
  }

  const report = {
    task: REGISTER.task_id,
    visualMode: REGISTER.visual_mode,
    coverage: pharmacyRouteObservatoryCoverage,
  };

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const url =
    process.env.PHARMACY_ROUTE_OBSERVATORY_URL ??
    "http://127.0.0.1:4336/37_pharmacy_route_observatory.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='observatory-shell']").waitFor();
    report.loaded = true;

    const initialRows = await page.locator("#matrix-body tr").count();
    const initialParityRows = await page.locator("#parity-body tr").count();
    if (initialRows !== 8 || initialParityRows !== 8) {
      throw new Error(`Expected 8 rows in both tables, found matrix=${initialRows} parity=${initialParityRows}`);
    }

    await page.locator("[data-testid='filter-purpose']").selectOption("visibility");
    const visibilityRows = await page.locator("#matrix-body tr").count();
    if (visibilityRows !== 1) {
      throw new Error(`Expected 1 visibility row after purpose filter, found ${visibilityRows}`);
    }

    await page.locator("[data-testid='route-row-gp_update_record_assured_path']").click();
    const inspectorText = await page.locator("[data-testid='route-inspector']").innerText();
    if (!inspectorText.includes("consultation summaries") && !inspectorText.includes("consultation summary")) {
      throw new Error("Inspector no longer reflects Update Record consultation-summary posture.");
    }
    if (!inspectorText.toLowerCase().includes("not for urgent")) {
      throw new Error("Inspector no longer reflects the urgent-use boundary.");
    }

    const proofText = await page.locator("[data-testid='proof-ladder']").innerText();
    if (!proofText.includes("PharmacyOutcomeReconciliationGate")) {
      throw new Error("Proof ladder no longer contains the reconciliation gate.");
    }

    await page.locator("[data-testid='filter-purpose']").selectOption("all");
    await page.locator("[data-testid='sort-select']").selectOption("version_desc");
    const firstRowText = await page.locator("#matrix-body tr").first().innerText();
    if (!firstRowText.includes("Service Search v3 / primary candidate")) {
      throw new Error("Version sorting no longer brings Service Search v3 to the top.");
    }

    await page.locator("[data-testid='filter-consent']").selectOption("manual_runbook");
    const manualRows = await page.locator("#matrix-body tr").count();
    const parityManualRows = await page.locator("#parity-body tr").count();
    if (manualRows !== 2 || parityManualRows !== 2) {
      throw new Error(`Expected 2 manual-runbook rows after consent filter, found matrix=${manualRows} parity=${parityManualRows}`);
    }

    const chipText = await page.locator("#matrix-body").innerText();
    if (!chipText.toLowerCase().includes("manual fallback required")) {
      throw new Error("Manual fallback chip disappeared from the matrix.");
    }

    await page.locator("[data-testid='filter-consent']").selectOption("all");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowDown");

    await maybeCapture(page, "seq_037_observatory_desktop.png");

    await page.setViewportSize({ width: 1024, height: 1100 });
    await page.locator("[data-testid='route-rail']").waitFor();
    await maybeCapture(page, "seq_037_observatory_tablet.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='route-matrix']").waitFor();
    await maybeCapture(page, "seq_037_observatory_mobile.png");

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const bodyFlag = await motionPage.locator("body").getAttribute("data-reduced-motion");
      if (bodyFlag !== "true") {
        throw new Error("Reduced-motion posture did not activate.");
      }
    } finally {
      await motionPage.close();
    }

    const landmarkCount = await page.locator("main, aside, section").count();
    if (landmarkCount < 6) {
      throw new Error(`Accessibility smoke failed: expected multiple landmarks, found ${landmarkCount}.`);
    }

    report.matrixRowCount = initialRows;
    report.visibilityRows = visibilityRows;
    report.manualRows = manualRows;
    report.phase0Verdict = REGISTER.phase0_entry_verdict;
    report.blockingGapCount = REGISTER.summary.blocking_gap_count;
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }

  if (process.env.SEQ037_REPORT_PATH) {
    ensureDir(path.dirname(process.env.SEQ037_REPORT_PATH));
    fs.writeFileSync(process.env.SEQ037_REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const pharmacyRouteObservatoryManifest = {
  task: REGISTER.task_id,
  routes: REGISTER.summary.route_count,
  blockingGaps: REGISTER.summary.blocking_gap_count,
  liveGates: REGISTER.summary.live_gate_count,
};
