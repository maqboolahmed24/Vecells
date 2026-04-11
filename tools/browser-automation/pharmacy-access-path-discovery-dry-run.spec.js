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
    server.listen(4337, "127.0.0.1", () => resolve(server));
  });
}

function requiredLiveEnv() {
  return REGISTER.dry_run_harness.required_env;
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
    headers: { "user-agent": "vecells-seq037-dry-run" },
  });
  assertCondition(response.ok, `Failed to fetch official source ${url}`);
  const html = await response.text();
  for (const snippet of expectedSnippets) {
    assertCondition(html.includes(snippet), `Official source ${url} no longer contains: ${snippet}`);
  }
}

async function verifyOfficialMechanics() {
  const guidance = REGISTER.official_guidance;
  await verifyOfficialSource(
    guidance.find((row) => row.source_id === "official_service_search_v3").url,
    REGISTER.dry_run_harness.official_label_checks.service_search_v3,
  );
  await verifyOfficialSource(
    guidance.find((row) => row.source_id === "official_eps_dos_posture").url,
    REGISTER.dry_run_harness.official_label_checks.eps_supplier_guidance,
  );
  await verifyOfficialSource(
    guidance.find((row) => row.source_id === "official_gp_connect_update_record").url,
    REGISTER.dry_run_harness.official_label_checks.gp_connect_update_record,
  );
  await verifyOfficialSource(
    guidance.find((row) => row.source_id === "official_gp_connect_programme_news").url,
    REGISTER.dry_run_harness.official_label_checks.gp_connect_news,
  );
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing observatory HTML: ${HTML_PATH}`);
  await verifyOfficialMechanics();

  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";
  if (realMutationRequested) {
    validateLiveInputs();
  }
  if (process.env.PHARMACY_ACCESS_SKIP_BROWSER === "true") {
    return;
  }

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const selectors =
    REGISTER.dry_run_harness.selector_map[process.env.PHARMACY_SELECTOR_PROFILE ?? "base_profile"];
  const url =
    process.env.PHARMACY_ROUTE_OBSERVATORY_URL ??
    "http://127.0.0.1:4337/37_pharmacy_route_observatory.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator(selectors.shell).waitFor();

    await page.locator(selectors.purpose_filter).selectOption("visibility");
    await page.locator(selectors.row_update_record).click();
    const updateRecordText = await page.locator(selectors.inspector).innerText();
    assertCondition(
      updateRecordText.toLowerCase().includes("not for urgent"),
      "Update Record inspector drifted away from the urgent-use boundary.",
    );
    assertCondition(
      updateRecordText.includes("MESH"),
      "Update Record inspector drifted away from the MESH dependency.",
    );

    await page.locator(selectors.purpose_filter).selectOption("all");
    await page.locator(selectors.maturity_filter).selectOption("actual_later_gated");
    await page.locator(selectors.row_service_search).click();
    const serviceSearchText = await page.locator(selectors.inspector).innerText();
    assertCondition(
      serviceSearchText.includes("Service Search") || serviceSearchText.includes("directory"),
      "Service Search inspector drifted away from directory posture.",
    );

    await page.locator(selectors.maturity_filter).selectOption("manual_only");
    await page.locator(selectors.row_manual_fallback).click();
    const manualText = await page.locator(selectors.inspector).innerText();
    assertCondition(
      manualText.toLowerCase().includes("urgent return"),
      "Manual fallback inspector drifted away from urgent-return posture.",
    );

    const blockedGateCount = REGISTER.live_gates.filter((row) => row.status === "blocked").length;
    assertCondition(blockedGateCount >= 5, "Live gate set unexpectedly opened.");
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

export const pharmacyAccessPathDryRunManifest = {
  task: REGISTER.task_id,
  requiredLiveEnv: requiredLiveEnv(),
  selectorProfiles: Object.keys(REGISTER.dry_run_harness.selector_map),
};
