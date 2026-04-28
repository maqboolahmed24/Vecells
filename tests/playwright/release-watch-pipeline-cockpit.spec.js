import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "97_release_watch_pipeline_cockpit.html");
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "release_watch_pipeline_catalog.json");

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
          ? "/docs/architecture/97_release_watch_pipeline_cockpit.html"
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
    server.listen(4397, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing release watch cockpit HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.RELEASE_WATCH_PIPELINE_URL ??
    "http://127.0.0.1:4397/docs/architecture/97_release_watch_pipeline_cockpit.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "watch-masthead",
      "scenario-rail",
      "state-grid",
      "timeline-panel",
      "trigger-table",
      "eligibility-table",
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

    await page.locator("[data-testid='filter-watch-state']").selectOption("satisfied");
    cards = await page.locator(".scenario-card").count();
    assertCondition(cards === 1, `Expected 1 satisfied scenario, found ${cards}.`);
    const inspectorSatisfied = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorSatisfied.includes("LOCAL_SATISFIED"),
      "Inspector did not synchronize with the satisfied scenario.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-watch-state']").selectOption("rollback_required");
    cards = await page.locator(".scenario-card").count();
    assertCondition(cards === 1, `Expected 1 rollback-required scenario, found ${cards}.`);

    await page.locator("[data-testid='scenario-card-PREPROD_ROLLBACK_REQUIRED']").click();
    const triggerText = await page.locator("[data-testid='trigger-table']").innerText();
    const inspectorRollback = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      triggerText.includes("rollback.preprod.parity-drift") &&
        triggerText.includes("rollback.preprod.manual-operator"),
      "Trigger table lost rollback trigger detail.",
    );
    assertCondition(
      inspectorRollback.includes("rollback_required") &&
        inspectorRollback.includes(
          "FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT",
        ),
      "Inspector lost rollback-required posture or readiness placeholder.",
    );

    await page.locator("[data-testid='filter-watch-state']").selectOption("all");
    await page.locator("[data-testid='filter-environment']").selectOption("local");
    await page.locator("[data-testid='scenario-card-LOCAL_ACCEPTED']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator("[data-testid='scenario-card-LOCAL_BLOCKED']")
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance scenario selection.");

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-watch-state']").selectOption("all");

    const acceptedCount = await page.locator('[data-state="accepted"]').count();
    const satisfiedCount = await page.locator('[data-state="satisfied"]').count();
    const blockedCount = await page.locator('[data-state="blocked"]').count();
    const staleCount = await page.locator('[data-state="stale"]').count();
    const rollbackCount = await page.locator('[data-state="rollback_required"]').count();
    assertCondition(acceptedCount > 0, "Accepted state styling disappeared.");
    assertCondition(satisfiedCount > 0, "Satisfied state styling disappeared.");
    assertCondition(blockedCount > 0, "Blocked state styling disappeared.");
    assertCondition(staleCount > 0, "Stale state styling disappeared.");
    assertCondition(rollbackCount > 0, "Rollback-required state styling disappeared.");

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
      await page.locator("[data-testid='eligibility-table']").isVisible(),
      "Eligibility table disappeared at tablet width.",
    );

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(
      landmarks >= 7,
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

export const releaseWatchPipelineCockpitManifest = {
  task: CATALOG.task_id,
  scenarios: CATALOG.summary.scenario_count,
  coverage: [
    "environment and watch-state filtering",
    "scenario selection and inspector synchronization",
    "keyboard navigation",
    "reduced motion",
    "responsive layout",
    "accessibility landmarks",
    "accepted, satisfied, blocked, stale, and rollback-required states remain distinct",
  ],
};
