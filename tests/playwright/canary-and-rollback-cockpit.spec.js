import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "102_canary_and_rollback_cockpit.html");
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "canary_scenario_catalog.json");

const CATALOG = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));

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
          ? "/docs/architecture/102_canary_and_rollback_cockpit.html"
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
    server.listen(4402, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing canary cockpit HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.CANARY_AND_ROLLBACK_COCKPIT_URL ??
    "http://127.0.0.1:4402/docs/architecture/102_canary_and_rollback_cockpit.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "canary-masthead",
      "scenario-rail",
      "state-grid",
      "history-panel",
      "guardrail-table",
      "audit-panel",
      "inspector",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    let cards = await page.locator(".scenario-card").count();
    assertCondition(
      cards === CATALOG.summary.scenario_count,
      `Expected ${CATALOG.summary.scenario_count} scenario cards, found ${cards}.`,
    );

    await page.locator("[data-testid='filter-environment']").selectOption("local");
    cards = await page.locator(".scenario-card").count();
    assertCondition(cards === 3, `Expected 3 local scenarios, found ${cards}.`);

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-action']").selectOption("rollback");
    cards = await page.locator(".scenario-card").count();
    assertCondition(cards === 1, `Expected 1 rollback scenario, found ${cards}.`);
    const inspectorRollback = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorRollback.includes("INTEGRATION_ROLLBACK_ON_TRIGGER_BREACH") &&
        inspectorRollback.includes("rpb::local::authoritative"),
      "Inspector did not synchronize with the rollback scenario.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-action']").selectOption("all");
    await page.locator("[data-testid='filter-cockpit-state']").selectOption("constrained");
    cards = await page.locator(".scenario-card").count();
    assertCondition(cards === 2, `Expected 2 constrained cockpit scenarios, found ${cards}.`);

    await page
      .locator("[data-testid='scenario-card-PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE']")
      .click();
    const guardrailText = await page.locator("[data-testid='guardrail-table']").innerText();
    assertCondition(
      guardrailText.includes("GUARDRAIL_TRUST_OR_KILL_SWITCH_FAILURE") &&
        guardrailText.includes("GUARDRAIL_PUBLICATION_OR_PARITY_FAILURE"),
      "Guardrail table lost kill-switch failure references.",
    );

    await page.locator("[data-testid='filter-cockpit-state']").selectOption("all");
    await page.locator("[data-testid='filter-environment']").selectOption("local");
    await page.locator("[data-testid='scenario-card-LOCAL_CANARY_START_HAPPY_PATH']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='scenario-card-LOCAL_WIDEN_AFTER_SATISFIED_OBSERVATION']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance scenario selection.");

    await page.locator("[data-testid='scenario-card-LOCAL_ROLLFORWARD_AFTER_SUPERSEDED_TUPLE']").click();
    const inspectorRollforward = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorRollforward.includes("wap::") &&
        !inspectorRollforward.includes("No superseded predecessor preview"),
      "Inspector lost superseded preview linkage for the rollforward scenario.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-action']").selectOption("all");
    await page.locator("[data-testid='filter-cockpit-state']").selectOption("all");

    for (const stateName of [
      "preview",
      "accepted",
      "observed",
      "satisfied",
      "constrained",
      "rollback_required",
      "superseded",
    ]) {
      const count = await page.locator(`[data-state='${stateName}']`).count();
      assertCondition(count > 0, `${stateName} state styling disappeared.`);
    }

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reduced = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reduced === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 1100, height: 900 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );
    assertCondition(
      await page.locator("[data-testid='guardrail-table']").isVisible(),
      "Guardrail table disappeared at tablet width.",
    );

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(
      landmarks >= 8,
      `Accessibility smoke failed: found only ${landmarks} landmarks.`,
    );
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

export const canaryAndRollbackCockpitManifest = {
  task: CATALOG.task_id,
  scenarios: CATALOG.summary.scenario_count,
  coverage: [
    "environment, action, and cockpit-state filtering",
    "scenario selection and inspector synchronization",
    "keyboard navigation",
    "reduced motion",
    "responsive layout",
    "accessibility landmarks",
    "preview, accepted, observed, satisfied, constrained, rollback-required, and superseded states remain distinct",
  ],
};
