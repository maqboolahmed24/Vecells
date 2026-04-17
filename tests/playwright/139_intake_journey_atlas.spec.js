import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "139_intake_journey_atlas.html");
const MATRIX_CSV_PATH = path.join(ROOT, "data", "analysis", "139_journey_step_matrix.csv");
const EVENT_CATALOG_PATH = path.join(ROOT, "data", "contracts", "139_intake_event_catalog.json");
const BINDING_SCHEMA_PATH = path.join(ROOT, "data", "contracts", "139_intake_surface_runtime_binding.schema.json");

export const intakeJourneyAtlasCoverage = [
  "journey navigation across every frozen step",
  "sticky footer behavior on mobile",
  "same-shell urgent-diversion and receipt transitions",
  "keyboard traversal, landmarks, and focus order",
  "responsive layout and mission_stack fold behavior",
  "reduced-motion equivalence",
  "diagram/table parity in the atlas",
];

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
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/139_intake_journey_atlas.html";
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
      const contentType =
        extension === ".html"
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": contentType });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/139_intake_journey_atlas.html`,
      });
    });
  });
}

function loadExpected() {
  const csvLines = fs.readFileSync(MATRIX_CSV_PATH, "utf8").trim().split("\n");
  const eventCatalog = JSON.parse(fs.readFileSync(EVENT_CATALOG_PATH, "utf8"));
  const bindingSchema = JSON.parse(fs.readFileSync(BINDING_SCHEMA_PATH, "utf8"));
  return {
    stepCount: csvLines.length - 1,
    eventCount: eventCatalog.eventCatalog.length,
    bindingCount: bindingSchema.examples.length,
  };
}

async function countTableRows(locator) {
  return await locator.locator("tbody tr").count();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "seq_139 intake journey atlas HTML is missing.");
  const expected = loadExpected();
  assertCondition(expected.stepCount === 10, "Journey step count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1220 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='patient-intake-mission-frame']").waitFor();
    await page.locator("[data-testid='step-rail']").waitFor();
    await page.locator("[data-testid='detail-panel']").waitFor();
    await page.locator("[data-testid='journey-spine']").waitFor();
    await page.locator("[data-testid='journey-table']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='step-button-']").count()) === expected.stepCount,
      "Journey rail step count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='binding-table'] tbody tr").count()) === expected.bindingCount,
      "Binding table row count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='event-table'] tbody tr").count()) === expected.eventCount,
      "Event table row count drifted.",
    );

    const stepKeys = [
      "landing",
      "request_type",
      "details",
      "supporting_files",
      "contact_preferences",
      "review_submit",
      "resume_recovery",
      "urgent_outcome",
      "receipt_outcome",
      "request_status",
    ];
    for (const stepKey of stepKeys) {
      const button = page.locator(`[data-testid='step-button-${stepKey}']`);
      await button.click();
      const title = (await page.locator("[data-testid='detail-panel'] .detail-title").innerText()).trim();
      assertCondition(title.length > 0, `Detail title failed to render for ${stepKey}.`);
      assertCondition(
        (await button.getAttribute("data-selected")) === "true",
        `Step ${stepKey} did not remain selected after navigation.`,
      );
    }

    await page.locator("[data-testid='step-button-urgent_outcome']").click();
    const urgentShellKey = (await page.locator("#detail-shell-key").innerText()).trim();
    const urgentOutcomeMode = (await page.locator("#detail-outcome-mode").innerText()).trim();
    assertCondition(urgentOutcomeMode === "urgent_diversion", "Urgent outcome mode drifted.");

    await page.locator("[data-testid='step-button-receipt_outcome']").click();
    const receiptShellKey = (await page.locator("#detail-shell-key").innerText()).trim();
    const receiptOutcomeMode = (await page.locator("#detail-outcome-mode").innerText()).trim();
    assertCondition(receiptOutcomeMode === "receipt", "Receipt outcome mode drifted.");
    assertCondition(
      urgentShellKey === receiptShellKey && receiptShellKey === "patient.portal.requests",
      "Urgent and receipt outcomes lost same-shell continuity.",
    );

    await page.locator("[data-testid='step-button-landing']").focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page.locator("[data-testid='step-button-request_type']").getAttribute("data-selected")) === "true",
      "ArrowDown did not move selection to request_type.",
    );
    await page.keyboard.press("End");
    assertCondition(
      (await page.locator("[data-testid='step-button-request_status']").getAttribute("data-selected")) === "true",
      "End did not move selection to request_status.",
    );
    await page.keyboard.press("Home");
    assertCondition(
      (await page.locator("[data-testid='step-button-landing']").getAttribute("data-selected")) === "true",
      "Home did not restore selection to landing.",
    );

    assertCondition((await page.locator("header").count()) === 1, "Header landmark is missing.");
    assertCondition((await page.locator("nav").count()) === 1, "Navigation landmark is missing.");
    assertCondition((await page.locator("main").count()) === 1, "Main landmark is missing.");
    assertCondition((await page.locator("aside").count()) === 1, "Aside landmark is missing.");

    const spineCount = await page.locator("[data-testid^='journey-spine-node-']").count();
    const journeyTableRows = await countTableRows(page.locator("[data-testid='journey-table']"));
    assertCondition(spineCount === journeyTableRows, "Journey spine and step matrix drifted out of parity.");

    await page.setViewportSize({ width: 980, height: 1180 });
    await page.waitForFunction(() => document.body.dataset.layout === "mission_stack");
    const layoutMode = await page.evaluate(() => document.body.dataset.layout);
    assertCondition(layoutMode === "mission_stack", "Responsive mission_stack fold did not activate.");
    assertCondition(
      await page.locator("[data-testid='peek-drawer-button']").isVisible(),
      "Peek drawer button disappeared in mission_stack layout.",
    );
    await page.locator("[data-testid='peek-drawer-button']").click();
    assertCondition(
      (await page.locator("[data-testid='recap-column']").getAttribute("data-open")) === "true",
      "Peek drawer did not open the recap column.",
    );
    const widthSafe = await page.evaluate(() => document.documentElement.scrollWidth <= 996);
    assertCondition(widthSafe, "Responsive layout overflowed horizontally.");

    await page.setViewportSize({ width: 390, height: 900 });
    const footerPosition = await page.locator("[data-testid='sticky-footer']").evaluate((node) =>
      getComputedStyle(node).position,
    );
    assertCondition(footerPosition === "fixed", "Sticky footer is not fixed on mobile.");
    assertCondition(
      await page.locator("[data-testid='sticky-footer']").isVisible(),
      "Sticky footer disappeared on mobile.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1320, height: 960 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body.reduced-motion").count()) === 1,
        "Reduced-motion posture did not activate.",
      );
      assertCondition(
        (await motionPage.locator("[data-testid^='step-button-']").count()) === expected.stepCount,
        "Reduced-motion rendering changed journey step count.",
      );
      const reducedSpine = await motionPage.locator("[data-testid^='journey-spine-node-']").count();
      const reducedRows = await countTableRows(motionPage.locator("[data-testid='journey-table']"));
      assertCondition(reducedSpine === reducedRows, "Reduced-motion rendering broke journey parity.");
    } finally {
      await motionPage.close();
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
