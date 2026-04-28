import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "external", "38_simulator_backlog_studio.html");
const MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "adapter_simulator_contract_manifest.json",
);

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

export const adapterSimulatorBacklogStudioCoverage = [
  "priority, fidelity, phase, and family filtering",
  "priority sorting",
  "row selection and inspector sync",
  "blocker and fallback badge rendering",
  "keyboard navigation",
  "responsive desktop/tablet/mobile layouts",
  "reduced-motion handling",
  "accessibility smoke",
  "table parity for matrix diagram",
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
        res.writeHead(302, { Location: "/38_simulator_backlog_studio.html" });
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
    server.listen(4338, "127.0.0.1", () => resolve(server));
  });
}

async function maybeCapture(page, name) {
  const captureDir = process.env.SEQ038_CAPTURE_DIR;
  if (!captureDir) return;
  ensureDir(captureDir);
  await page.screenshot({ path: path.join(captureDir, name), fullPage: true });
}

async function run() {
  if (!fs.existsSync(HTML_PATH)) {
    throw new Error(`Missing backlog studio HTML: ${HTML_PATH}`);
  }

  const report = {
    task: MANIFEST.task_id,
    visualMode: MANIFEST.visual_mode,
    coverage: adapterSimulatorBacklogStudioCoverage,
  };

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const url =
    process.env.ADAPTER_SIMULATOR_STUDIO_URL ??
    "http://127.0.0.1:4338/38_simulator_backlog_studio.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='studio-shell']").waitFor();
    report.loaded = true;

    const initialRows = await page.locator("#backlog-body tr").count();
    const initialParityRows = await page.locator("#parity-body tr").count();
    if (initialRows !== 17) {
      throw new Error(`Expected 17 backlog rows on load, found ${initialRows}`);
    }
    if (initialParityRows !== 4) {
      throw new Error(`Expected 4 parity rows, found ${initialParityRows}`);
    }

    await page.locator("[data-testid='filter-priority']").selectOption("critical");
    const criticalRows = await page.locator("#backlog-body tr").count();
    if (criticalRows !== 6) {
      throw new Error(`Expected 6 critical rows, found ${criticalRows}`);
    }

    await page.locator("[data-testid='filter-priority']").selectOption("all");
    await page.locator("[data-testid='filter-family']").selectOption("pharmacy");
    const pharmacyRows = await page.locator("#backlog-body tr").count();
    if (pharmacyRows !== 3) {
      throw new Error(`Expected 3 pharmacy rows, found ${pharmacyRows}`);
    }
    await page.locator("[data-testid='sim-row-sim_pharmacy_dispatch_transport_twin']").click();
    const inspectorText = await page.locator("[data-testid='simulator-inspector']").innerText();
    if (!inspectorText.includes("PharmacyDispatchEnvelope")) {
      throw new Error("Inspector no longer includes PharmacyDispatchEnvelope.");
    }
    if (!inspectorText.includes("hybrid_contract_twin")) {
      throw new Error("Inspector no longer includes the replacement mode.");
    }

    await page.locator("[data-testid='filter-family']").selectOption("all");
    await page.locator("[data-testid='filter-phase']").selectOption("phase_3_deferred_optional");
    const deferredRows = await page.locator("#backlog-body tr").count();
    if (deferredRows !== 2) {
      throw new Error(`Expected 2 deferred/optional rows, found ${deferredRows}`);
    }

    await page.locator("[data-testid='filter-phase']").selectOption("all");
    await page.locator("[data-testid='filter-fidelity']").selectOption("near-live_contract_twin");
    const nearLiveRows = await page.locator("#backlog-body tr").count();
    if (nearLiveRows !== 5) {
      throw new Error(`Expected 5 near-live rows, found ${nearLiveRows}`);
    }

    await page.locator("[data-testid='filter-fidelity']").selectOption("all");
    await page.locator("[data-testid='sort-select']").selectOption("priority_asc");
    const firstAscendingRow = await page.locator("#backlog-body tr").first().innerText();
    if (!firstAscendingRow.includes("Optional PDS enrichment twin")) {
      throw new Error("Ascending priority sort no longer puts the PDS twin first.");
    }

    await page.locator("[data-testid='sim-row-sim_support_replay_resend_twin']").click();
    const selectedRowText = await page
      .locator("[data-testid='sim-row-sim_support_replay_resend_twin']")
      .innerText();
    if (!selectedRowText.toLowerCase().includes("permanent fallback")) {
      throw new Error("Permanent fallback badge disappeared from the support replay row.");
    }

    await page.locator("[data-testid='sort-select']").selectOption("priority_desc");
    const firstRow = page.locator("[data-testid='sim-row-sim_pharmacy_dispatch_transport_twin']");
    await firstRow.focus();
    await page.keyboard.press("ArrowDown");
    const nextRowSelected = await page
      .locator("[data-testid='sim-row-sim_nhs_login_auth_session_twin']")
      .getAttribute("data-selected");
    if (nextRowSelected !== "true") {
      throw new Error("Arrow-down navigation no longer advances selection.");
    }

    await maybeCapture(page, "seq_038_foundry_desktop.png");

    await page.setViewportSize({ width: 1024, height: 1100 });
    await page.locator("[data-testid='filter-rail']").waitFor();
    await maybeCapture(page, "seq_038_foundry_tablet.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='backlog-table']").waitFor();
    await maybeCapture(page, "seq_038_foundry_mobile.png");

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
      throw new Error(
        `Accessibility smoke failed: expected multiple landmarks, found ${landmarkCount}.`,
      );
    }

    report.initialRowCount = initialRows;
    report.criticalRows = criticalRows;
    report.pharmacyRows = pharmacyRows;
    report.deferredRows = deferredRows;
    report.nearLiveRows = nearLiveRows;
    report.parityRows = initialParityRows;
    report.blockedGateInstances = MANIFEST.summary.blocked_live_gate_instances;
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }

  if (process.env.SEQ038_REPORT_PATH) {
    ensureDir(path.dirname(process.env.SEQ038_REPORT_PATH));
    fs.writeFileSync(process.env.SEQ038_REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const adapterSimulatorBacklogStudioManifest = {
  task: MANIFEST.task_id,
  simulators: MANIFEST.summary.simulator_count,
  blockedLiveGateInstances: MANIFEST.summary.blocked_live_gate_instances,
  phases: MANIFEST.summary.execution_phase_count,
};
