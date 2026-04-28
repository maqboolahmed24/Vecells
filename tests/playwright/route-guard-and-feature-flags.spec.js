import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "112_route_guard_lab.html");
const EXAMPLES_PATH = path.join(ROOT, "data", "analysis", "runtime_binding_guard_examples.json");

const EXAMPLES = JSON.parse(fs.readFileSync(EXAMPLES_PATH, "utf8"));

export const routeGuardFeatureFlagCoverage = {
  taskId: "par_112",
  scenarioCount: EXAMPLES.summary.scenario_count,
  postureCount: 4,
  routeCount: 3,
  guardCoverage: [
    "route live/read-only/recovery-only/blocked",
    "embedded and constrained-browser downgrade",
    "manifest-only capability visibility",
    "header and selected-anchor continuity",
    "reduced-motion equivalence",
    "guard DOM markers",
  ],
};

// prefers-reduced-motion equivalence is covered through emulateMedia({ reducedMotion: "reduce" }).

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

function serve(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname === "/") {
        pathname = "/docs/architecture/112_route_guard_lab.html";
      }
      const filePath = path.join(rootDir, pathname);
      if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html; charset=utf-8"
          : extension === ".json"
            ? "application/json; charset=utf-8"
            : extension === ".csv"
              ? "text/csv; charset=utf-8"
              : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(body);
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind route guard static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/112_route_guard_lab.html`,
      });
    });
  });
}

async function waitForLab(page) {
  for (const testId of [
    "route-guard-lab",
    "route-selector",
    "channel-selector",
    "guard-scenario-list",
    "guard-stage",
    "guard-stage-header",
    "guard-stage-anchor",
    "guard-runtime-inspector",
    "guard-capability-list",
    "guard-timeline",
    "precedence-diagram",
    "guard-decision-tree",
    "embedded-downgrade-diagram",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
}

async function gotoScenario(page, scenarioId) {
  await page.locator(`#scenario-list [data-scenario-id='${scenarioId}']`).click();
  await page.waitForFunction(
    (expectedScenarioId) =>
      document.querySelector("[data-testid='guard-stage']")?.getAttribute("data-scenario-id") ===
      expectedScenarioId,
    scenarioId,
  );
}

async function stageSnapshot(page) {
  return page.locator("[data-testid='guard-stage']").evaluate((node) => ({
    posture: node.getAttribute("data-guard-posture"),
    hydration: node.getAttribute("data-runtime-binding-state"),
    recoveryAction: node.getAttribute("data-recovery-action"),
    header: node.querySelector("[data-testid='guard-stage-header']")?.textContent?.trim() || "",
    anchor: node.querySelector("[data-testid='guard-stage-anchor']")?.textContent?.trim() || "",
  }));
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Route guard lab HTML is missing.");
  assertCondition(EXAMPLES.task_id === "par_112", "Route guard examples drifted off par_112.");
  assertCondition(EXAMPLES.summary.scenario_count === 7, "Route guard scenario count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1520, height: 1220 } });
    await page.goto(url, { waitUntil: "networkidle" });
    await waitForLab(page);

    const scenarioButtons = await page.locator("#scenario-list [data-scenario-id]").count();
    assertCondition(
      scenarioButtons === EXAMPLES.summary.scenario_count,
      `Scenario count drifted: expected ${EXAMPLES.summary.scenario_count}, found ${scenarioButtons}.`,
    );

    await page.locator("[data-testid='route-selector']").selectOption("rf_patient_requests");
    await page.locator("[data-testid='channel-selector']").selectOption("browser");
    await gotoScenario(page, "SCN_ROUTE_LIVE_PATIENT_REQUESTS");
    let snapshot = await stageSnapshot(page);
    assertCondition(snapshot.posture === "live", "Live patient requests route no longer renders live.");
    assertCondition(
      snapshot.header.includes("Requests"),
      "Live route lost the patient requests header.",
    );
    assertCondition(
      snapshot.anchor.includes("request-needs-attention"),
      "Live route lost the selected anchor cue.",
    );
    assertCondition(snapshot.recoveryAction === "none", "Live route exposed a recovery action.");
    assertCondition(
      !(await page.locator("[data-testid='guard-capability-list']").innerText()).includes(
        "Embedded host bridge",
      ),
      "Embedded capability leaked into a non-embedded route.",
    );

    await gotoScenario(page, "SCN_PENDING_BINDING_PATIENT_REQUESTS");
    snapshot = await stageSnapshot(page);
    assertCondition(
      snapshot.posture === "recovery_only" && snapshot.hydration === "binding_pending",
      "Pending runtime binding no longer downgrades patient requests to recovery-only.",
    );
    assertCondition(
      snapshot.header.includes("Requests") && snapshot.anchor.includes("request-needs-attention"),
      "Pending runtime binding lost the preserved header or selected anchor.",
    );
    assertCondition(
      snapshot.recoveryAction === "refresh-runtime-binding",
      "Pending runtime binding lost the governed refresh action marker.",
    );

    await gotoScenario(page, "SCN_DIAGNOSTIC_READ_ONLY_PATIENT_REQUESTS");
    snapshot = await stageSnapshot(page);
    assertCondition(snapshot.posture === "read_only", "Diagnostic release posture no longer renders read-only.");
    assertCondition(
      (await page.locator("[data-testid='guard-reason-list']").innerText()).includes(
        "release_diagnostic_window",
      ),
      "Diagnostic read-only posture lost its release reason.",
    );

    await gotoScenario(page, "SCN_ROUTE_WITHDRAWN_BLOCKED");
    snapshot = await stageSnapshot(page);
    assertCondition(snapshot.posture === "blocked", "Withdrawn route no longer renders blocked in place.");
    assertCondition(
      snapshot.recoveryAction === "refresh-runtime-binding",
      "Blocked same-shell route lost its governed recovery action marker.",
    );

    await page.locator("[data-testid='route-selector']").selectOption("rf_patient_embedded_channel");
    await page.locator("[data-testid='channel-selector']").selectOption("embedded");
    await gotoScenario(page, "SCN_EMBEDDED_CAPABILITY_RECOVERY");
    snapshot = await stageSnapshot(page);
    assertCondition(
      snapshot.posture === "recovery_only",
      "Embedded capability drift no longer downgrades to recovery-only.",
    );
    assertCondition(
      (await page.locator("[data-testid='guard-capability-list']").innerText()).includes(
        "Embedded host bridge",
      ),
      "Embedded route lost its explicit embedded capability switch.",
    );
    assertCondition(
      snapshot.recoveryAction === "open-governed-handoff",
      "Embedded capability drift lost the governed handoff action marker.",
    );

    await page.locator("[data-testid='route-selector']").selectOption("rf_intake_telephony_capture");
    await page.locator("[data-testid='channel-selector']").selectOption("browser");
    await gotoScenario(page, "SCN_CONSTRAINED_BROWSER_BLOCKED");
    snapshot = await stageSnapshot(page);
    assertCondition(
      snapshot.posture === "blocked",
      "Constrained browser mismatch no longer blocks the route.",
    );
    assertCondition(
      snapshot.recoveryAction === "resume-capture-safely",
      "Constrained browser mismatch lost the resume action marker.",
    );

    const reducedPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    try {
      await reducedPage.emulateMedia({ reducedMotion: "reduce" });
      await reducedPage.goto(
        `${url}?route=rf_patient_requests&channel=browser&scenario=SCN_DIAGNOSTIC_READ_ONLY_PATIENT_REQUESTS`,
        { waitUntil: "networkidle" },
      );
      await waitForLab(reducedPage);
      const reducedSnapshot = await stageSnapshot(reducedPage);
      const reducedMotion = await reducedPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion mode did not activate.");
      assertCondition(
        reducedSnapshot.posture === "read_only",
        "Reduced-motion path drifted from the diagnostic read-only posture.",
      );
    } finally {
      await reducedPage.close();
    }
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
