import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "107_status_component_lab.html");
const FRESHNESS_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "freshness_envelope_examples.json",
);

const FRESHNESS_EXAMPLES = JSON.parse(fs.readFileSync(FRESHNESS_PATH, "utf8"));

export const statusTruthComponentCoverage = [
  "integrated strip and promoted banner rendering",
  "stale and recovery truth override optimistic copy",
  "same-shell CasePulse morph stability",
  "reduced-motion equivalence",
  "patient and workspace specimen truth parity",
  "DOM markers for summary, freshness, dominant action, and recovery posture",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw error;
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/107_status_component_lab.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html; charset=utf-8"
          : extension === ".json"
            ? "application/json; charset=utf-8"
            : extension === ".csv"
              ? "text/csv; charset=utf-8"
              : extension === ".css"
                ? "text/css; charset=utf-8"
                : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind status-truth lab static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/107_status_component_lab.html`,
      });
    });
  });
}

function trackExternalRequests(page, baseOrigin, externalRequests) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(baseOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Status truth component lab HTML is missing.");
  assertCondition(FRESHNESS_EXAMPLES.task_id === "par_107", "Freshness example task drifted.");
  assertCondition(
    FRESHNESS_EXAMPLES.visual_mode === "Status_Truth_Lab",
    "Status truth lab mode drifted.",
  );
  assertCondition(
    JSON.stringify(FRESHNESS_EXAMPLES.summary) ===
      JSON.stringify({
        example_count: 6,
        integrated_strip_count: 4,
        promoted_banner_count: 2,
      }),
    "Freshness example summary drifted.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1480, height: 1180 } });
    const page = await context.newPage();
    const baseOrigin = new URL(url).origin;
    const externalRequests = new Set();
    trackExternalRequests(page, baseOrigin, externalRequests);

    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "status-lab-root",
      "status-lab-masthead",
      "scenario-toggle",
      "demo-status-strip",
      "demo-case-pulse",
      "status-lab-inspector",
      "morph-panel",
      "morph-case-pulse",
      "specimen-grid",
      "diagram-grid",
      "reduced-motion-equivalence",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    await page
      .locator("[data-testid='demo-status-strip'] [data-testid='shared-status-strip']")
      .waitFor();
    await page.locator("[data-testid='case-pulse']").waitFor();

    const scenarioCount = await page.locator("#scenario-buttons button").count();
    assertCondition(scenarioCount === 4, `Expected 4 lab scenarios, found ${scenarioCount}.`);

    let strip = page.locator(
      "[data-testid='demo-status-strip'] [data-testid='shared-status-strip']",
    );
    assertCondition(
      (await strip.getAttribute("data-render-mode")) === "integrated_status_strip",
      "Ready scenario should render as the integrated strip.",
    );
    assertCondition(
      (await strip.getAttribute("data-freshness-state")) === "fresh",
      "Ready scenario freshness marker drifted.",
    );
    for (const marker of [
      "data-state-summary",
      "data-freshness-state",
      "data-dominant-action",
      "data-recovery-posture",
    ]) {
      const value = await strip.getAttribute(marker);
      assertCondition(Boolean(value), `Shared strip lost required marker ${marker}.`);
    }

    await page.locator("[data-scenario-id='stale_review']").click();
    strip = page.locator(
      "[data-testid='demo-status-strip'] [data-testid='shared-status-strip']",
    );
    const staleSummary = await page
      .locator("[data-testid='demo-status-strip'] [data-testid='status-summary']")
      .innerText();
    const staleChip = await page
      .locator("[data-testid='demo-status-strip'] [data-testid='freshness-chip']")
      .innerText();
    assertCondition(
      (await strip.getAttribute("data-render-mode")) === "integrated_status_strip",
      "Stale review should stay in integrated strip mode.",
    );
    assertCondition(
      (await strip.getAttribute("data-freshness-state")) === "stale_review",
      "Stale review scenario lost its freshness state marker.",
    );
    assertCondition(
      (await page
        .locator("[data-testid='demo-status-strip'] [data-testid='status-summary']")
        .getAttribute("aria-live")) === "assertive",
      "Stale review should escalate live announcements.",
    );
    assertCondition(
      staleSummary.includes("Projection review required"),
      "Stale review summary drifted.",
    );
    assertCondition(
      !/\bsaved\b|confirmed/i.test(`${staleSummary} ${staleChip}`),
      "Stale review lab copy overclaimed saved or confirmed state.",
    );

    await page.locator("[data-scenario-id='recovery_required']").click();
    strip = page.locator(
      "[data-testid='demo-status-strip'] [data-testid='shared-status-strip']",
    );
    const recoverySummary = await page
      .locator("[data-testid='demo-status-strip'] [data-testid='status-summary']")
      .innerText();
    assertCondition(
      (await strip.getAttribute("data-render-mode")) === "promoted_banner",
      "Recovery required should promote to banner mode.",
    );
    assertCondition(
      (await strip.getAttribute("data-recovery-posture")) === "blocked",
      "Recovery required scenario lost blocked recovery posture.",
    );
    assertCondition(
      (await strip.getAttribute("role")) === "alert",
      "Recovery required strip must render as an alert.",
    );
    assertCondition(
      recoverySummary.includes("Recovery required"),
      "Recovery required summary drifted.",
    );
    assertCondition(
      !/\bsaved\b|confirmed|resumed/i.test(recoverySummary),
      "Recovery posture should override optimistic local feedback wording.",
    );

    const morphRoot = page.locator("[data-testid='morph-case-pulse']");
    const continuityKeyBefore = await morphRoot.getAttribute("data-continuity-key");
    const macroBefore = await morphRoot.getAttribute("data-macro-state");
    await page.locator("[data-testid='morph-toggle']").click();
    const continuityKeyAfter = await morphRoot.getAttribute("data-continuity-key");
    const macroAfter = await morphRoot.getAttribute("data-macro-state");
    const morphText = await morphRoot.innerText();
    assertCondition(
      continuityKeyBefore === continuityKeyAfter,
      "CasePulse morph should preserve the same continuity key.",
    );
    assertCondition(
      macroBefore !== macroAfter && macroAfter === "reviewing_next_steps",
      "CasePulse morph should update macrostate inside the same shell.",
    );
    assertCondition(
      morphText.includes("Confirm next bounded action"),
      "CasePulse morph lost the next bounded action cue.",
    );

    const specimenCount = await page
      .locator("#specimen-grid-content > [data-testid^='specimen-']")
      .count();
    assertCondition(
      specimenCount === FRESHNESS_EXAMPLES.summary.example_count,
      `Expected ${FRESHNESS_EXAMPLES.summary.example_count} audience specimens, found ${specimenCount}.`,
    );

    const patientSpecimen = page.locator("[data-testid='specimen-patient']");
    const patientStrip = patientSpecimen.locator("[data-testid='shared-status-strip']");
    const patientText = await patientSpecimen.innerText();
    assertCondition(
      (await patientStrip.getAttribute("data-dominant-action")) === "Review appointment options",
      "Patient specimen lost the dominant action marker.",
    );
    assertCondition(
      patientText.includes("waiting for confirmation"),
      "Patient specimen lost pending confirmation copy.",
    );
    assertCondition(
      !/confirmed and safe to view|settled/i.test(patientText),
      "Patient specimen should not overclaim settled truth.",
    );

    const workspaceSpecimen = page.locator("[data-testid='specimen-workspace']");
    const workspaceStrip = workspaceSpecimen.locator("[data-testid='shared-status-strip']");
    const workspaceText = await workspaceSpecimen.innerText();
    assertCondition(
      (await workspaceStrip.getAttribute("data-freshness-state")) === "stale_review",
      "Workspace specimen lost stale-review freshness markers.",
    );
    assertCondition(
      workspaceText.includes("Projection review required"),
      "Workspace specimen lost review-required summary copy.",
    );
    assertCondition(
      !/\bsaved\b/i.test(workspaceText),
      "Workspace specimen should not expose contradictory saved wording.",
    );

    const reducedMotionPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    try {
      await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
      await reducedMotionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await reducedMotionPage.locator("body").getAttribute("data-reduced-motion")) === "true",
        "Reduced-motion posture did not activate in the status-truth lab.",
      );
      assertCondition(
        (await reducedMotionPage.locator("[data-testid='demo-status-summary']").innerText()).includes(
          "Authoritative settlement recorded",
        ),
        "Reduced-motion lab lost the default summary ordering.",
      );
    } finally {
      await reducedMotionPage.close();
    }

    assertCondition(
      externalRequests.size === 0,
      `Status truth lab should be offline-complete, found external requests: ${[
        ...externalRequests,
      ].join(", ")}`,
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

export const statusTruthComponentManifest = {
  task: FRESHNESS_EXAMPLES.task_id,
  exampleCount: FRESHNESS_EXAMPLES.summary.example_count,
  promotedBannerCount: FRESHNESS_EXAMPLES.summary.promoted_banner_count,
};
