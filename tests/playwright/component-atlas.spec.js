import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "105_component_atlas.html");
const PUBLICATION_PATH = path.join(ROOT, "data", "analysis", "component_primitive_publication.json");
const AUTOMATION_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "component_automation_anchor_matrix.json",
);

const PUBLICATION = JSON.parse(fs.readFileSync(PUBLICATION_PATH, "utf8"));
const AUTOMATION = JSON.parse(fs.readFileSync(AUTOMATION_PATH, "utf8"));

export const componentAtlasCoverage = {
  taskId: "par_105",
  visualMode: "Component_Atlas",
  expectedComponents: 38,
  expectedSpecimens: 4,
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
      pathname = "/docs/architecture/105_component_atlas.html";
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
        reject(new Error("Unable to bind Component Atlas static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/105_component_atlas.html`,
      });
    });
  });
}

function screenshotHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function stageDataset(page, specimenId) {
  return page.locator(`[data-testid='specimen-root-${specimenId}']`).evaluate((node) => ({
    ...node.dataset,
  }));
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Component Atlas HTML is missing.");
  assertCondition(PUBLICATION.task_id === "par_105", "Publication task drifted from par_105.");
  assertCondition(PUBLICATION.visual_mode === "Component_Atlas", "Component Atlas mode drifted.");
  assertCondition(
    JSON.stringify(PUBLICATION.summary) ===
      JSON.stringify({
        component_count: 38,
        specimen_count: 4,
        surface_role_count: 14,
        shell_profile_count: 8,
        route_binding_count: 4,
        exact_route_binding_count: 2,
        blocked_route_binding_count: 2,
        degraded_accessibility_route_count: 2,
        gap_resolution_count: 3,
        follow_on_dependency_count: 3,
      }),
    "Component publication summary drifted.",
  );
  assertCondition(
    AUTOMATION.summary.component_count === 38 &&
      AUTOMATION.summary.route_family_count === 9,
    "Automation summary drifted.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1580, height: 1240 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "atlas-shell",
      "atlas-masthead",
      "shell-lens-rail",
      "surface-role-nav",
      "specimen-nav",
      "mode-controls",
      "specimen-stage",
      "stage-canvas",
      "inspector-panel",
      "motion-strip",
      "supplemental-shelf",
      "taxonomy-diagram",
      "density-diagram",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const defaultDataset = await stageDataset(page, "Patient_Mission_Frame");
    assertCondition(
      defaultDataset.routeFamily === "rf_patient_home" &&
        defaultDataset.designContractState === "published" &&
        defaultDataset.accessibilityCoverageState === "complete",
      "Default patient specimen root lost route-safe dataset bindings.",
    );
    assertCondition(
      (await page.locator("[data-dom-marker='dominant-action']").count()) >= 1,
      "Default stage lost the dominant-action DOM marker.",
    );

    await page.locator("[data-section-id='table']").focus();
    await page.keyboard.press("Enter");
    assertCondition(
      (await page.locator(".is-highlighted").count()) >= 1,
      "Surface-role selection did not highlight any stage regions.",
    );

    await page.locator("[data-shell-type='governance']").focus();
    await page.keyboard.press("Enter");
    const inspectorAfterGovernanceLens = await page
      .locator("[data-testid='inspector-panel']")
      .innerText();
    assertCondition(
      inspectorAfterGovernanceLens.includes("PSR_050_GOVERNANCE_V1"),
      "Governance shell lens did not propagate into the inspector.",
    );

    await page.locator("[data-specimen-id='Governance_Approval_Frame']").focus();
    await page.keyboard.press("Enter");
    const governanceDataset = await stageDataset(page, "Governance_Approval_Frame");
    assertCondition(
      governanceDataset.routeFamily === "rf_governance_shell" &&
        governanceDataset.accessibilityCoverageState === "degraded" &&
        governanceDataset.designContractLintState === "blocked",
      "Governance specimen lost blocked or degraded kernel markers.",
    );

    await page.locator("[data-specimen-id='Operations_Control_Room_Preview']").focus();
    await page.keyboard.press("Enter");
    const operationsDataset = await stageDataset(page, "Operations_Control_Room_Preview");
    assertCondition(
      operationsDataset.routeFamily === "rf_operations_board" &&
        operationsDataset.anchorState === "blocked" &&
        operationsDataset.artifactMode === "summary_only",
      "Operations specimen lost blocked summary-only posture.",
    );

    const summaryBeforeModeShift = await page
      .locator("[data-testid='visualization-summary']")
      .innerText();
    const tableRowCount = await page
      .locator("[data-testid='visualization-table'] tbody tr")
      .count();
    assertCondition(
      tableRowCount === 4 &&
        summaryBeforeModeShift.includes("Gateway BFF"),
      "Visualization panel lost summary text or table fallback parity.",
    );

    await page.locator("[data-mode='contrast'][data-value='high']").focus();
    await page.keyboard.press("Enter");
    await page.locator("[data-mode='motion'][data-value='full']").focus();
    await page.keyboard.press("Enter");
    const bodyDataset = await page.evaluate(() => ({ ...document.body.dataset }));
    assertCondition(
      bodyDataset.contrast === "high" && bodyDataset.motion === "full",
      "Mode controls did not update contrast and motion datasets.",
    );

    await page.locator("[data-mode='motion'][data-value='reduced']").focus();
    await page.keyboard.press("Enter");
    const summaryAfterReducedMotion = await page
      .locator("[data-testid='visualization-summary']")
      .innerText();
    assertCondition(
      summaryBeforeModeShift === summaryAfterReducedMotion,
      "Reduced motion changed the semantic summary content.",
    );

    const screenshotDir = path.join(ROOT, ".artifacts", "component-atlas");
    fs.mkdirSync(screenshotDir, { recursive: true });

    await page.locator("[data-specimen-id='Patient_Mission_Frame']").click();
    const patientShot = await page.locator("[data-testid='specimen-stage']").screenshot({
      path: path.join(screenshotDir, "patient-stage.png"),
    });

    await page.locator("[data-specimen-id='Operations_Control_Room_Preview']").click();
    const operationsShot = await page.locator("[data-testid='specimen-stage']").screenshot({
      path: path.join(screenshotDir, "operations-stage.png"),
    });

    assertCondition(
      screenshotHash(patientShot) !== screenshotHash(operationsShot),
      "Distinct specimen screenshots collapsed to the same hash.",
    );

    assertCondition(
      (await page.locator("[data-testid='taxonomy-diagram'] svg").count()) === 1 &&
        (await page.locator("[data-testid='density-diagram'] svg").count()) === 1,
      "Atlas diagrams failed to render.",
    );
  } finally {
    await browser.close();
    server.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
