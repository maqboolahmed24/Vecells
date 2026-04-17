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
  "74_reservation_confirmation_truth_lab.html",
);
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "capacity_reservation_manifest.json");
const CASEBOOK_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "external_confirmation_gate_casebook.json",
);

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
          ? "/docs/architecture/74_reservation_confirmation_truth_lab.html"
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
    server.listen(4374, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing lab HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
  const url =
    process.env.RESERVATION_CONFIRMATION_LAB_URL ??
    "http://127.0.0.1:4374/docs/architecture/74_reservation_confirmation_truth_lab.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='state-filter']").waitFor();
    await page.locator("[data-testid='commit-mode-filter']").waitFor();
    await page.locator("[data-testid='assurance-filter']").waitFor();
    await page.locator("[data-testid='state-rail']").waitFor();
    await page.locator("[data-testid='truth-card-strip']").waitFor();
    await page.locator("[data-testid='confidence-panel']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='evidence-table']").waitFor();
    await page.locator("[data-testid='validator-table']").waitFor();

    const initialCards = await page.locator("button[data-testid^='truth-card-']").count();
    assertCondition(
      initialCards === MANIFEST.summary.scenario_count,
      `Expected ${MANIFEST.summary.scenario_count} truth cards, found ${initialCards}.`,
    );

    await page.locator("[data-testid='state-filter']").selectOption("confirmed");
    const confirmedCards = await page.locator("button[data-testid^='truth-card-']").count();
    assertCondition(confirmedCards === 2, `Expected 2 confirmed cards, found ${confirmedCards}.`);

    await page.locator("[data-testid='assurance-filter']").selectOption("manual");
    const manualCards = await page.locator("button[data-testid^='truth-card-']").count();
    assertCondition(manualCards === 1, `Expected 1 manual card, found ${manualCards}.`);

    const manualCard = page.locator(
      "[data-testid='truth-card-weak_manual_two_family_confirmation']",
    );
    await manualCard.click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("weak_manual_two_family_confirmation") &&
        inspectorText.includes("gate::weak_manual_two_family_confirmation"),
      "Inspector lost selection synchronization for the manual confirmation scenario.",
    );
    const selectedState = await page
      .locator("[data-testid='state-rail-item-confirmed']")
      .getAttribute("data-selected");
    assertCondition(
      selectedState === "true",
      "State rail did not synchronize to the selected truth card.",
    );
    const evidenceRows = await page.locator("[data-testid^='evidence-row-']").count();
    assertCondition(evidenceRows === 2, `Expected 2 evidence rows, found ${evidenceRows}.`);
    const confidenceParity = await page.locator("[data-testid='confidence-parity']").textContent();
    assertCondition(
      confidenceParity.includes("2 source families"),
      "Confidence parity text drifted from the selected gate.",
    );

    await page.locator("[data-testid='state-filter']").selectOption("all");
    await page.locator("[data-testid='assurance-filter']").selectOption("all");
    await page.locator("[data-testid='commit-mode-filter']").selectOption("all");
    const firstCard = page.locator("[data-testid='truth-card-soft_selection_without_hold']");
    await firstCard.focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='truth-card-exclusive_hold_with_real_expiry']")
      .getAttribute("data-selected");
    assertCondition(secondSelected === "true", "ArrowDown did not advance to the next truth card.");

    const railParity = await page.locator("[data-testid='state-rail-parity']").textContent();
    assertCondition(railParity.includes("8 visible scenarios"), "State rail parity text drifted.");
    assertCondition(CASEBOOK.summary.case_count === 8, "Casebook summary drifted.");

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
    assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${landmarks}.`);
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

export const reservationConfirmationTruthLabManifest = {
  task: MANIFEST.task_id,
  scenarios: MANIFEST.summary.scenario_count,
  coverage: [
    "state and assurance filtering",
    "selection synchronization",
    "chart and table parity",
    "keyboard navigation",
    "reduced motion",
    "responsive layout",
    "accessibility smoke checks",
  ],
};
