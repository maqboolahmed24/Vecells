import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DECISION_REGISTER_PATH = path.join(ROOT, "data", "analysis", "gp_provider_decision_register.json");
const HTML_PATH = path.join(ROOT, "docs", "external", "36_gp_provider_pathfinder.html");

const DECISION_REGISTER = JSON.parse(fs.readFileSync(DECISION_REGISTER_PATH, "utf8"));

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This harness needs the `playwright` package when run with --run.");
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
      const contentType = filePath.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4327, "127.0.0.1", () => resolve(server));
  });
}

function requiredLiveEnv() {
  return DECISION_REGISTER.dry_run_harness.required_env;
}

function validateLiveInputs() {
  for (const envVar of requiredLiveEnv()) {
    assertCondition(process.env[envVar], `Missing required live gate input: ${envVar}`);
  }
  assertCondition(
    process.env.ALLOW_REAL_PROVIDER_MUTATION === "true",
    "Real provider mutation remains blocked until ALLOW_REAL_PROVIDER_MUTATION=true",
  );
}

async function verifyOfficialSource(url, expectedSnippets) {
  const response = await fetch(url, {
    headers: { "user-agent": "vecells-seq036-dry-run" },
  });
  assertCondition(response.ok, `Failed to fetch official source ${url}`);
  const html = await response.text();
  for (const snippet of expectedSnippets) {
    assertCondition(html.includes(snippet), `Official source ${url} no longer contains: ${snippet}`);
  }
}

async function verifyOfficialMechanics() {
  const guidance = DECISION_REGISTER.official_guidance;
  await verifyOfficialSource(
    guidance.find((row) => row.source_id === "official_im1_pairing_integration").url,
    DECISION_REGISTER.dry_run_harness.official_label_checks.im1_pairing,
  );
  await verifyOfficialSource(
    guidance.find((row) => row.source_id === "official_gp_connect_supplier_progress").url,
    DECISION_REGISTER.dry_run_harness.official_label_checks.gp_connect_supplier_progress,
  );
  await verifyOfficialSource(
    guidance.find((row) => row.source_id === "official_referrals_and_bookings_guidance").url,
    DECISION_REGISTER.dry_run_harness.official_label_checks.referrals_and_bookings,
  );
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing HTML pathfinder: ${HTML_PATH}`);
  await verifyOfficialMechanics();

  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";
  if (realMutationRequested) {
    validateLiveInputs();
  }
  if (process.env.GP_PROVIDER_SKIP_BROWSER === "true") {
    return;
  }

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const selectors =
    DECISION_REGISTER.dry_run_harness.selector_map[process.env.GP_PROVIDER_SELECTOR_PROFILE ?? "base_profile"];
  const targetUrl =
    process.env.GP_PROVIDER_PATHFINDER_URL ?? "http://127.0.0.1:4327/36_gp_provider_pathfinder.html";

  try {
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.locator(selectors.shell).waitFor();
    await page.locator(selectors.maturity_filter).selectOption("actual_later_gated");
    await page.locator(selectors.row_im1_optum).click();
    await page.locator(selectors.inspector).waitFor();

    const inspectorText = await page.locator(selectors.inspector).innerText();
    assertCondition(
      inspectorText.includes("BookingConfirmationTruthProjection"),
      "Actual-later inspector drifted away from canonical confirmation proof",
    );

    await page.locator(selectors.maturity_filter).selectOption("watch_only");
    await page.locator(selectors.row_gpc).click();
    const watchText = await page.locator(selectors.inspector).innerText();
    assertCondition(
      watchText.toLowerCase().includes("watch") || watchText.toLowerCase().includes("existing"),
      "Watch-only GP Connect posture disappeared from inspector",
    );

    await page.locator(selectors.row_bars).click();
    const barsText = await page.locator(selectors.inspector).innerText();
    assertCondition(
      barsText.includes("BaRS") || barsText.includes("referral"),
      "BaRS watch posture disappeared from inspector",
    );

    const blockedGateCount = DECISION_REGISTER.live_gates.filter((row) => row.status === "blocked").length;
    assertCondition(blockedGateCount >= 5, "Live gate set unexpectedly opened");

    if (!realMutationRequested) {
      assertCondition(
        blockedGateCount >= 5,
        "Dry-run posture drifted: expected blocked gates to remain visible without real mutation.",
      );
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

export const gpProviderPathDiscoveryManifest = {
  task: DECISION_REGISTER.task_id,
  requiredLiveEnv: requiredLiveEnv(),
  selectorProfiles: Object.keys(DECISION_REGISTER.dry_run_harness.selector_map),
};
