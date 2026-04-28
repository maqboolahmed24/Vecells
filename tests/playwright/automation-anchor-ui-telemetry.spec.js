import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertSharedMarker,
  automationTelemetryEnvelopes,
  automationTelemetryProfiles,
  automationTelemetryVocabulary,
  findEnvelope,
  getRouteProfile,
  getScenario,
} from "./automation-anchor-ui-telemetry.helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "114_ui_telemetry_diagnostics_console.html",
);

export const automationAnchorUiTelemetryCoverage = [
  "shared marker selectors resolve from published route profiles",
  "marker overlay labels expose shared refs instead of route-local names",
  "selected-anchor and recovery-posture actions emit shared event envelopes",
  "event payloads stay PHI-safe through redacted digest fields",
  "reduced-motion mode preserves event ordering and visibility",
  "root DOM markers remain aligned with the published tuple refs",
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
      pathname = "/docs/architecture/114_ui_telemetry_diagnostics_console.html";
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
        reject(new Error("Unable to bind automation/telemetry console static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/114_ui_telemetry_diagnostics_console.html`,
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
  assertCondition(fs.existsSync(HTML_PATH), "Automation/telemetry diagnostics console HTML is missing.");
  assertCondition(
    automationTelemetryProfiles.summary.route_profile_count === 19,
    "Automation profile count drifted.",
  );
  assertCondition(
    automationTelemetryProfiles.summary.matrix_row_count === 171,
    "Automation marker matrix row count drifted.",
  );
  assertCondition(
    automationTelemetryVocabulary.summary.event_binding_count === 133,
    "Telemetry vocabulary binding count drifted.",
  );
  assertCondition(
    automationTelemetryEnvelopes.summary.example_count === 24,
    "Telemetry envelope example count drifted.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1560, height: 1220 } });
    const page = await context.newPage();
    const baseOrigin = new URL(url).origin;
    const externalRequests = new Set();
    trackExternalRequests(page, baseOrigin, externalRequests);

    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='ui-telemetry-console'][data-loaded='true']").waitFor();

    for (const testId of [
      "scenario-rail",
      "shell-filter",
      "route-filter",
      "scenario-list",
      "specimen-pane",
      "selected-anchor-tuple",
      "focus-restore-state",
      "marker-tree",
      "recent-events",
      "event-timeline",
      "marker-overlay-toggle",
      "reduced-motion-toggle",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const scenarioCards = page.locator("[data-scenario-id]");
    assertCondition((await scenarioCards.count()) === 6, "Expected 6 diagnostics scenarios.");

    const patientScenario = getScenario("SCN_SHELL_GALLERY_PATIENT_HOME");
    const patientProfile = getRouteProfile(patientScenario.routeFamilyRef);
    await page.locator("[data-scenario-id='SCN_SHELL_GALLERY_PATIENT_HOME']").click();
    await assertSharedMarker(page, patientScenario.routeFamilyRef, "landmark");
    await assertSharedMarker(page, patientScenario.routeFamilyRef, "state_summary");
    await assertSharedMarker(page, patientScenario.routeFamilyRef, "selected_anchor");
    await assertSharedMarker(page, patientScenario.routeFamilyRef, "dominant_action");
    await assertSharedMarker(page, patientScenario.routeFamilyRef, "focus_restore");

    const specimenRoot = page.locator("[data-testid='specimen-surface']");
    assertCondition(
      (await specimenRoot.getAttribute("data-automation-anchor-map-ref")) ===
        patientProfile.automationAnchorMapRef,
      "Specimen root lost automation anchor map ref.",
    );
    assertCondition(
      (await specimenRoot.getAttribute("data-telemetry-binding-profile-ref")) ===
        patientProfile.telemetryBindingProfileRef,
      "Specimen root lost telemetry binding profile ref.",
    );
    assertCondition(
      (await specimenRoot.getAttribute("data-design-contract-vocabulary-tuple-ref")) ===
        patientProfile.designContractVocabularyTupleRef,
      "Specimen root lost design tuple ref.",
    );

    await page.locator("[data-testid='shell-filter']").selectOption("patient-web");
    await page.locator("[data-testid='route-filter']").selectOption("rf_patient_home");
    assertCondition(
      (await page.locator("[data-scenario-id]").count()) === 2,
      "Shell and route filters did not narrow the scenario list to patient-home entries.",
    );
    await page.locator("[data-testid='shell-filter']").selectOption("all");
    await page.locator("[data-testid='route-filter']").selectOption("all");

    await page.locator("[data-testid='marker-overlay-toggle']").click();
    await page.locator(".overlay-label").first().waitFor();
    const overlayText = await page.locator(".overlay-label").nth(1).innerText();
    assertCondition(
      overlayText === patientScenario.selectedAnchorRef,
      "Overlay label drifted away from the shared selected-anchor ref.",
    );

    let timelineCount = await page.locator("[data-testid='timeline-stream'] .event-card").count();
    const selectedAnchorEnvelope = findEnvelope(
      "SCN_SHELL_GALLERY_PATIENT_HOME",
      "selected_anchor_changed",
    );
    await page.locator("[data-testid='selected-anchor-node']").click();
    await page
      .locator(`[data-testid='recent-events'] [data-event-code='${selectedAnchorEnvelope.eventCode}']`)
      .last()
      .waitFor();
    await page.waitForFunction(
      (previousCount) =>
        document.querySelectorAll("[data-testid='timeline-stream'] .event-card").length ===
        previousCount + 1,
      timelineCount,
    );
    assertCondition(
      (await page.locator("[data-testid='timeline-stream'] .event-card").count()) ===
        timelineCount + 1,
      "Selected-anchor action did not append a shared event envelope.",
    );
    const timelineText = await page.locator("[data-testid='timeline-stream']").innerText();
    assertCondition(timelineText.includes("redacted::"), "Timeline lost redacted digest payloads.");
    assertCondition(
      !timelineText.includes("Patient portal Example"),
      "Timeline leaked raw PHI-shaped example copy.",
    );

    const visibilityScenario = getScenario("SCN_ROUTE_GUARD_PATIENT_REQUESTS");
    const visibilityEnvelope = findEnvelope(
      "SCN_ROUTE_GUARD_PATIENT_REQUESTS",
      "visibility_freshness_downgrade",
    );
    await page.locator(`[data-scenario-id='${visibilityScenario.scenarioId}']`).click();
    await page.locator("[data-testid='reduced-motion-toggle']").click();
    assertCondition(
      (await page.locator("body").getAttribute("data-reduced-motion")) === "true",
      "Reduced-motion mode did not toggle.",
    );
    timelineCount = await page.locator("[data-testid='timeline-stream'] .event-card").count();
    await page.locator("[data-testid='visualization-authority-node']").click();
    await page
      .locator(`[data-testid='recent-events'] [data-event-code='${visibilityEnvelope.eventCode}']`)
      .last()
      .waitFor();
    await page.waitForFunction(
      (previousCount) =>
        document.querySelectorAll("[data-testid='timeline-stream'] .event-card").length ===
        previousCount + 1,
      timelineCount,
    );
    assertCondition(
      (await page.locator("[data-testid='timeline-stream'] .event-card").count()) ===
        timelineCount + 1,
      "Visibility downgrade did not append an event under reduced motion.",
    );
    const visualizationState = await specimenRoot.getAttribute("data-visualization-authority");
    assertCondition(
      visualizationState === "table_only" || visualizationState === "summary_only",
      `Visualization authority did not downgrade, found ${visualizationState}.`,
    );

    const operationsScenario = getScenario("SCN_POSTURE_GALLERY_OPERATIONS_RECOVERY");
    const recoveryEnvelope = findEnvelope(
      "SCN_POSTURE_GALLERY_OPERATIONS_RECOVERY",
      "recovery_posture_changed",
    );
    await page.locator(`[data-scenario-id='${operationsScenario.scenarioId}']`).click();
    await page.locator("[data-testid='recovery-posture-node']").click();
    await page
      .locator(`[data-testid='recent-events'] [data-event-code='${recoveryEnvelope.eventCode}']`)
      .last()
      .waitFor();
    assertCondition(
      (await specimenRoot.getAttribute("data-recovery-posture")) === "blocked",
      "Recovery-posture action did not move the operations specimen to blocked posture.",
    );

    const focusEnvelope = findEnvelope("SCN_SHELL_GALLERY_PATIENT_HOME", "selected_anchor_changed");
    await page.locator("[data-scenario-id='SCN_SHELL_GALLERY_PATIENT_HOME']").click();
    await page.locator("[data-testid='focus-restore-node']").click();
    await page
      .locator(`[data-testid='recent-events'] [data-event-code='${focusEnvelope.eventCode}']`)
      .last()
      .waitFor();
    await page.waitForFunction(
      () =>
        document.activeElement?.getAttribute("data-automation-anchor-class") ===
        "selected_anchor",
    );
    const focusedClass = await page.evaluate(
      () => document.activeElement?.getAttribute("data-automation-anchor-class"),
    );
    assertCondition(
      focusedClass === "selected_anchor",
      "Focus restore did not land on the shared selected-anchor node.",
    );

    assertCondition(externalRequests.size === 0, `Expected no external requests, found ${[...externalRequests].join(", ")}`);
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
