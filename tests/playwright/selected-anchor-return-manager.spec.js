import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "108_continuity_inspector.html");
const EXAMPLES_PATH = path.join(ROOT, "data", "analysis", "return_contract_examples.json");
const SCREENSHOT_DIR = path.join(ROOT, ".artifacts", "selected-anchor-return-manager");

const PUBLICATION = JSON.parse(fs.readFileSync(EXAMPLES_PATH, "utf8"));

export const selectedAnchorReturnManagerCoverage = {
  taskId: "par_108",
  visualMode: "Continuity_Inspector",
  routeCount: 19,
  policyCount: 19,
  adjacencyCount: 99,
  restoreStepCount: 76,
  scenarioCount: 5,
};

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
      pathname = "/docs/architecture/108_continuity_inspector.html";
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
                : extension === ".svg"
                  ? "image/svg+xml"
                  : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind Continuity Inspector static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/108_continuity_inspector.html`,
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

async function waitForInspector(page) {
  for (const testId of [
    "continuity-inspector",
    "scenario-picker",
    "route-sequence",
    "continuity-stage",
    "continuity-specimen",
    "continuity-inspector-panel",
    "selected-anchor-panel",
    "return-contract-panel",
    "restore-order-panel",
    "continuity-timeline",
    "return-path-diagram",
    "invalidation-ladder-diagram",
    "restore-order-diagram",
    "restore-announcement",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
}

async function selectedAnchorText(page) {
  return page.locator("[data-testid='selected-anchor-card']").innerText();
}

async function stubText(page) {
  return page.locator("[data-testid='selected-anchor-stub']").innerText();
}

async function currentActiveMarkers(page) {
  return page.evaluate(() => ({
    marker: document.activeElement?.getAttribute("data-dom-marker"),
    testId: document.activeElement?.getAttribute("data-testid"),
    text: document.activeElement?.textContent?.trim() || "",
  }));
}

async function announcementText(page) {
  return (await page.locator("[data-testid='restore-announcement']").textContent()) || "";
}

async function gotoScenario(page, baseUrl, scenarioId, step) {
  await page.goto(`${baseUrl}?scenario=${scenarioId}&step=${step}`, { waitUntil: "networkidle" });
  await waitForInspector(page);
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Continuity inspector HTML is missing.");
  assertCondition(PUBLICATION.task_id === "par_108", "Continuity publication drifted from par_108.");
  assertCondition(
    PUBLICATION.visual_mode === "Continuity_Inspector",
    "Continuity inspector visual mode drifted.",
  );
  assertCondition(
    JSON.stringify(PUBLICATION.summary) ===
      JSON.stringify({
        route_count: 19,
        policy_count: 19,
        adjacency_count: 99,
        restore_step_count: 76,
        scenario_count: 5,
        gap_resolution_count: 5,
        follow_on_dependency_count: 4,
      }),
    "Continuity publication summary drifted.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1540, height: 1240 } });
    const page = await context.newPage();
    const baseOrigin = new URL(url).origin;
    const externalRequests = new Set();
    trackExternalRequests(page, baseOrigin, externalRequests);

    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await waitForInspector(page);

    const scenarioButtonCount = await page.locator("[data-scenario-id]").count();
    assertCondition(
      scenarioButtonCount === selectedAnchorReturnManagerCoverage.scenarioCount,
      `Scenario count drifted: expected ${selectedAnchorReturnManagerCoverage.scenarioCount}, found ${scenarioButtonCount}.`,
    );
    const restoreRowCount = await page.locator("[data-testid='restore-order-panel'] tbody tr").count();
    assertCondition(restoreRowCount === 4, "Restore-order panel drifted from 4 ordered steps.");

    await page.locator("[data-scenario-id='SCN_WORKSPACE_QUIET_RETURN']").click();
    await page.locator("[data-testid='next-step']").click();
    await page.waitForTimeout(40);
    const workspaceAnchor = await selectedAnchorText(page);
    assertCondition(
      workspaceAnchor.includes("Queue Decision"),
      "Workspace child-route step lost the active queue decision anchor.",
    );
    const workspaceReturnCue = await page.locator("[data-testid='return-contract-panel']").innerText();
    assertCondition(
      workspaceReturnCue.includes("Returning to Queue / Queue Active Case"),
      "Workspace child-route step lost its return-contract cue.",
    );
    const workspaceAnnouncement = await announcementText(page);
    assertCondition(
      workspaceAnnouncement.includes("Case canvas takes focus"),
      "Restore announcement did not update for the workspace child-route step.",
    );

    await page.reload({ waitUntil: "networkidle" });
    await waitForInspector(page);
    assertCondition(
      (await page.locator("[data-testid='step-indicator']").innerText()).includes("Step 2 of 3"),
      "Refresh did not preserve the active workspace step.",
    );
    assertCondition(
      (await selectedAnchorText(page)).includes("Queue Decision"),
      "Refresh did not preserve the selected workspace anchor.",
    );
    const activeAfterRefresh = await currentActiveMarkers(page);
    assertCondition(
      activeAfterRefresh.marker?.includes("selected-anchor"),
      "Refresh did not return focus to the selected anchor card.",
    );

    await gotoScenario(page, url, "SCN_PATIENT_RECORD_RECOVERY_RETURN", 2);
    assertCondition(
      (await selectedAnchorText(page)).includes("Record Summary"),
      "Deep-link recovery lost the nearest safe record summary anchor.",
    );
    assertCondition(
      (await stubText(page)).includes("The exact anchor could not be restored"),
      "Deep-link recovery lost the preserved record stub.",
    );
    const recoveryPanel = await page.locator("[data-testid='return-contract-panel']").innerText();
    assertCondition(
      recoveryPanel.includes("recovery required return"),
      "Deep-link recovery lost the recovery-required return posture.",
    );
    const activeRecoveryFocus = await currentActiveMarkers(page);
    assertCondition(
      activeRecoveryFocus.marker?.includes("selected-anchor-stub"),
      "Recovery restore should focus the visible stub when the exact anchor is gone.",
    );

    await gotoScenario(page, url, "SCN_PATIENT_CHILD_RETURN_FULL", 0);
    await page.locator("[data-testid='next-step']").click();
    await page.locator("[data-testid='next-step']").click();
    await page.waitForTimeout(40);
    assertCondition(
      (await selectedAnchorText(page)).includes("Request Needs Attention"),
      "Child-route exit did not restore the origin patient request anchor.",
    );
    assertCondition(
      (await page.locator("[data-testid='step-indicator']").innerText()).includes("Origin anchor restored"),
      "Patient return step indicator drifted after child-route exit.",
    );

    await gotoScenario(page, url, "SCN_GOVERNANCE_DIFF_REPLACEMENT", 1);
    assertCondition(
      (await stubText(page)).includes("requires acknowledgement"),
      "Governance replacement step lost the acknowledgement stub.",
    );
    assertCondition(
      (await selectedAnchorText(page)).includes("Governance Diff"),
      "Governance replacement step silently switched to the replacement anchor.",
    );
    const governanceFocus = await currentActiveMarkers(page);
    assertCondition(
      governanceFocus.marker?.includes("selected-anchor-stub"),
      "Governance replacement step should focus the stub, not an unseen replacement target.",
    );
    await page.locator("[data-testid='next-step']").click();
    await page.waitForTimeout(40);
    assertCondition(
      (await selectedAnchorText(page)).includes("Governance Approval"),
      "Governance replacement acknowledgement did not promote the new anchor.",
    );
    assertCondition(
      (await page.locator("[data-testid='selected-anchor-stub']").count()) === 0,
      "Governance replacement acknowledgement left the stub visible.",
    );

    await gotoScenario(page, url, "SCN_OPERATIONS_STALE_RETURN", 2);
    await page.locator("[data-testid='continuity-stage']").screenshot({
      path: path.join(SCREENSHOT_DIR, "operations-full-motion.png"),
    });
    const operationsSummaryBeforeMotion = await page
      .locator("[data-testid='continuity-inspector-panel']")
      .innerText();
    await page.locator("[data-testid='reduced-motion-toggle']").click();
    await page.waitForTimeout(20);
    assertCondition(
      (await page.evaluate(() => document.body.dataset.motion)) === "reduced",
      "Reduced-motion toggle did not update the document motion dataset.",
    );
    const operationsSummaryAfterMotion = await page
      .locator("[data-testid='continuity-inspector-panel']")
      .innerText();
    assertCondition(
      operationsSummaryBeforeMotion === operationsSummaryAfterMotion,
      "Reduced motion changed continuity inspector semantics.",
    );
    await page.locator("[data-testid='continuity-stage']").screenshot({
      path: path.join(SCREENSHOT_DIR, "operations-reduced-motion.png"),
    });

    assertCondition(externalRequests.size === 0, `Unexpected external requests: ${[...externalRequests].join(", ")}`);
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(undefined);
      });
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
