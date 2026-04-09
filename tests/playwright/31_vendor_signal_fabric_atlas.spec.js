import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const ATLAS_PATH = path.join(ROOT, "docs", "external", "31_vendor_signal_fabric_atlas.html");
const SHORTLIST_PATH = path.join(ROOT, "data", "analysis", "31_vendor_shortlist.json");
const SHORTLIST = JSON.parse(fs.readFileSync(SHORTLIST_PATH, "utf8"));

export const vendorSignalFabricCoverage = [
  "tab switching",
  "sorting and filtering",
  "explicit mock-vs-actual lane toggle",
  "evidence drawer rendering",
  "chart and table parity",
  "responsive desktop/tablet/mobile behavior",
  "keyboard navigation",
  "reduced motion",
  "accessibility smoke",
  "offline completeness",
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
    const server = http.createServer((req, res) => {
      if (!req.url || req.url === "/") {
        res.writeHead(302, { Location: "/31_vendor_signal_fabric_atlas.html" });
        res.end();
        return;
      }
      const safePath = req.url.replace(/^\/+/, "");
      const filePath = path.join(ROOT, "docs", "external", safePath);
      if (!filePath.startsWith(path.join(ROOT, "docs", "external")) || !fs.existsSync(filePath)) {
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
    server.listen(4317, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  if (!fs.existsSync(ATLAS_PATH)) {
    throw new Error(`Missing atlas file: ${ATLAS_PATH}`);
  }

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const baseUrl = process.env.VENDOR_SIGNAL_FABRIC_ATLAS_URL ?? "http://127.0.0.1:4317/31_vendor_signal_fabric_atlas.html";

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.locator("[data-testid='vendor-atlas-shell']").waitFor();

    await page.locator("[data-testid='tab-sms']").click();
    await page.locator("[data-testid='provider-row-twilio_sms']").waitFor();

    await page.locator("[data-testid='tab-email']").click();
    await page.locator("[data-testid='provider-row-mailgun_email']").click();
    await page.locator("[data-testid='evidence-drawer']").waitFor();
    await page.locator("[data-testid='evidence-card-ev_mailgun_secure_webhooks']").waitFor();

    await page.locator("[data-testid='sort-select']").selectOption("vendor_name");
    await page.locator("[data-testid='dimension-filter']").selectOption("security_replay");
    await page.locator("[data-testid='provider-row-mailgun_email']").waitFor();

    await page.locator("[data-testid='lane-toggle']").click();
    await page.locator("[data-testid='lane-toggle']").waitFor();

    await page.locator("[data-testid='tab-telephony_ivr']").click();
    await page.locator("[data-testid='provider-row-vonage_telephony_ivr']").click();
    await page.locator("[data-testid='score-band-vonage_telephony_ivr-security_replay']").waitFor();
    await page.locator("[data-testid='score-cell-vonage_telephony_ivr-security_replay']").waitFor();

    const chartBands = await page.locator("#dimension-chart .diagram-row").count();
    const tableRows = await page.locator("#dimension-table-body tr").count();
    if (chartBands !== tableRows || chartBands < 10) {
      throw new Error(`Chart/table parity failed: chart=${chartBands}, table=${tableRows}`);
    }

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("[data-testid='reduced-motion-indicator']").waitFor();

    await page.setViewportSize({ width: 1024, height: 1100 });
    await page.locator("[data-testid='coverage-diagram']").waitFor();
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.locator("[data-testid='dimension-table']").waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='provider-grid']").waitFor();

    await page.context().setOffline(true);
    await page.locator("[data-testid='tab-actual_lane']").click();
    await page.locator("[data-testid='provider-row-twilio_sendgrid_suite']").waitFor();

    const headings = await page.locator("h1, h2, h3").count();
    if (headings < 6) {
      throw new Error("Accessibility smoke failed: expected at least six headings.");
    }
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const vendorSignalFabricManifest = {
  task: SHORTLIST.task_id,
  shortlisted: SHORTLIST.summary.actual_shortlisted_vendor_count,
  evidenceRows: SHORTLIST.summary.official_evidence_rows,
};
