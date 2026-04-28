import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "71_control_plane_lab.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "request_lifecycle_lease_manifest.json");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "stale_ownership_casebook.json");
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "lineage_fence_and_command_action_matrix.csv",
);

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
const MATRIX = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\r?\n/).slice(1);

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

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
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/" ? "/docs/architecture/71_control_plane_lab.html" : rawUrl.split("?")[0];
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
    server.listen(4371, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing lab HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.CONTROL_PLANE_LAB_URL ??
    "http://127.0.0.1:4371/docs/architecture/71_control_plane_lab.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='timeline']").waitFor();
    await page.locator("[data-testid='epoch-strip']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='case-table']").waitFor();
    await page.locator("[data-testid='validator-table']").waitFor();

    const leaseCards = await page.locator("button[data-testid^='lease-card-']").count();
    assertCondition(
      leaseCards === MANIFEST.summary.lease_count,
      `Expected ${MANIFEST.summary.lease_count} visible lease cards, found ${leaseCards}.`,
    );

    await page.locator("[data-testid='domain-filter']").selectOption("pharmacy");
    const pharmacyLeases = await page.locator("button[data-testid^='lease-card-']").count();
    assertCondition(pharmacyLeases === 1, `Expected 1 pharmacy lease, found ${pharmacyLeases}.`);
    const pharmacyActions = await page.locator("button[data-testid^='action-card-']").count();
    assertCondition(
      pharmacyActions === 2,
      `Expected 2 pharmacy action cards, found ${pharmacyActions}.`,
    );

    await page.locator("[data-testid='action-card-CAR_071_PHARMACY_RECOVERY']").click();
    await page.waitForFunction(() => {
      const inspector = document.querySelector("[data-testid='inspector']");
      return inspector?.textContent?.includes("CAR_071_PHARMACY_RECOVERY");
    });
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("CAR_071_PHARMACY_RECOVERY") &&
        inspectorText.includes("idem_pharmacy_dispatch_2") &&
        inspectorText.includes("CAR_071_PHARMACY_EXACT"),
      "Inspector lost action selection synchronization.",
    );
    const selectedCase = await page
      .locator("[data-testid='case-row-repeated_ui_actions_reuse_or_supersede']")
      .getAttribute("data-selected");
    assertCondition(
      selectedCase === "true",
      "Case table lost synchronization with selected action.",
    );

    await page.locator("[data-testid='domain-filter']").selectOption("all");
    await page.locator("[data-testid='lease-state-filter']").selectOption("broken");
    const brokenLeases = await page.locator("button[data-testid^='lease-card-']").count();
    assertCondition(brokenLeases === 2, `Expected 2 broken leases, found ${brokenLeases}.`);

    await page.locator("[data-testid='lease-state-filter']").selectOption("all");
    await page.locator("[data-testid='fence-issue-filter']").selectOption("stale_epoch");
    const staleEpochLeases = await page.locator("button[data-testid^='lease-card-']").count();
    assertCondition(
      staleEpochLeases === 1,
      `Expected 1 stale-epoch lease, found ${staleEpochLeases}.`,
    );
    const staleEpochCases = await page.locator("button[data-testid^='case-row-']").count();
    assertCondition(
      staleEpochCases === 1,
      `Expected 1 stale-epoch case, found ${staleEpochCases}.`,
    );

    await page.locator("[data-testid='fence-issue-filter']").selectOption("all");

    const parityText = await page.locator("[data-testid='timeline-parity']").textContent();
    assertCondition(parityText.includes("7 visible leases"), "Timeline parity text drifted.");
    assertCondition(
      MATRIX.length ===
        MANIFEST.summary.lineage_fence_count + MANIFEST.summary.command_action_count,
      "Matrix row count drifted from the frozen control-plane baseline.",
    );

    await page.locator("[data-testid='lease-card-LSE_071_BOOKING_ALPHA']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='lease-card-LSE_071_BOOKING_BRAVO']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance lease selection.");

    await page.locator("[data-testid='case-row-competing_reviewers_same_task']").focus();
    await page.keyboard.press("ArrowDown");
    const nextCaseSelected = await page
      .locator("[data-testid='case-row-worker_restart_with_stale_fencing_token']")
      .getAttribute("data-selected");
    assertCondition(nextCaseSelected === "true", "ArrowDown did not advance case-row selection.");

    await page.setViewportSize({ width: 390, height: 844 });
    const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
    assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(landmarks >= 7, `Expected multiple landmarks, found ${landmarks}.`);
    assertCondition(CASEBOOK.summary.case_count === 5, "Casebook summary drifted.");
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

export const controlPlaneLabManifest = {
  task: MANIFEST.task_id,
  leases: MANIFEST.summary.lease_count,
  recoveries: MANIFEST.summary.recovery_count,
  coverage: [
    "domain filtering",
    "lease-state filtering",
    "fence issue filtering",
    "selection synchronization",
    "diagram and table parity",
    "keyboard navigation",
    "reduced motion",
    "responsive layout",
  ],
};
