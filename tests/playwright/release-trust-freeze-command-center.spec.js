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
  "75_release_trust_freeze_command_center.html",
);
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "release_approval_freeze_manifest.json");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "release_trust_freeze_casebook.json");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));

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
        rawUrl === "/"
          ? "/docs/architecture/75_release_trust_freeze_command_center.html"
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
        : "application/json; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4375, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing command center HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
  const url =
    process.env.RELEASE_TRUST_COMMAND_CENTER_URL ??
    "http://127.0.0.1:4375/docs/architecture/75_release_trust_freeze_command_center.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='verdict-filter']").waitFor();
    await page.locator("[data-testid='trust-filter']").waitFor();
    await page.locator("[data-testid='surface-filter']").waitFor();
    await page.locator("[data-testid='channel-filter']").waitFor();
    await page.locator("[data-testid='verdict-rail']").waitFor();
    await page.locator("[data-testid='tuple-stack']").waitFor();
    await page.locator("[data-testid='trust-matrix']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='validator-table']").waitFor();

    const initialCards = await page.locator("button[data-testid^='verdict-card-']").count();
    assertCondition(
      initialCards === MANIFEST.summary.scenario_count,
      `Expected ${MANIFEST.summary.scenario_count} visible verdict cards, found ${initialCards}.`,
    );

    await page.locator("[data-testid='verdict-filter']").selectOption("diagnostic_only");
    const diagnosticCards = await page.locator("button[data-testid^='verdict-card-']").count();
    assertCondition(diagnosticCards === 1, `Expected 1 diagnostic card, found ${diagnosticCards}.`);

    await page.locator("[data-testid='verdict-filter']").selectOption("all");
    await page.locator("[data-testid='trust-filter']").selectOption("degraded");
    const degradedCards = await page.locator("button[data-testid^='verdict-card-']").count();
    assertCondition(degradedCards === 1, `Expected 1 degraded-trust card, found ${degradedCards}.`);

    await page.locator("[data-testid='trust-filter']").selectOption("all");
    await page.locator("[data-testid='surface-filter']").selectOption("patient-web");
    const patientCards = await page.locator("button[data-testid^='verdict-card-']").count();
    assertCondition(patientCards === 2, `Expected 2 patient-web cards, found ${patientCards}.`);

    await page.locator("[data-testid='surface-filter']").selectOption("all");
    await page.locator("[data-testid='channel-filter']").selectOption("embedded_webview");
    const embeddedCards = await page.locator("button[data-testid^='verdict-card-']").count();
    assertCondition(
      embeddedCards === 2,
      `Expected 2 embedded-webview cards, found ${embeddedCards}.`,
    );

    await page.locator("[data-testid='channel-filter']").selectOption("all");
    const recoveryCard = page.locator(
      "[data-testid='verdict-card-recovery_only_parity_or_provenance_drift']",
    );
    await recoveryCard.click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("recovery_only_parity_or_provenance_drift") &&
        inspectorText.includes("BLOCKER_RELEASE_PARITY_NOT_EXACT"),
      "Inspector lost selection synchronization for the parity-drift scenario.",
    );
    const tupleSelected = await page
      .locator("[data-testid='tuple-card-recovery_only_parity_or_provenance_drift']")
      .getAttribute("data-selected");
    assertCondition(
      tupleSelected === "true",
      "Tuple stack did not synchronize to the selected verdict.",
    );
    const linkageSelected = await page
      .locator("[data-testid='linkage-row-recovery_only_parity_or_provenance_drift']")
      .getAttribute("data-selected");
    assertCondition(
      linkageSelected === "true",
      "Linkage table did not synchronize to the selected verdict.",
    );

    const trustMatrixParity = await page
      .locator("[data-testid='trust-matrix-parity']")
      .textContent();
    assertCondition(
      trustMatrixParity.includes("12 visible trust rows"),
      "Trust matrix parity text drifted from the frozen casebook.",
    );
    assertCondition(CASEBOOK.summary.case_count === 6, "Casebook summary drifted from par_075.");

    const firstCard = page.locator("[data-testid='verdict-card-live_exact_parity_trusted_slices']");
    await firstCard.focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='verdict-card-diagnostic_only_degraded_slice']")
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "ArrowDown did not advance to the next verdict card.",
    );

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

export const releaseTrustFreezeCommandCenterManifest = {
  task: MANIFEST.task_id,
  scenarios: MANIFEST.summary.scenario_count,
  coverage: [
    "verdict and trust filtering",
    "selection synchronization",
    "chart and table parity",
    "keyboard navigation",
    "reduced motion",
    "responsive layout",
    "accessibility smoke checks",
  ],
};
