import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "assurance", "126_privacy_threat_atlas.html");
const FLOW_INVENTORY_PATH = path.join(ROOT, "data", "assurance", "privacy_data_flow_inventory.json");
const TRACEABILITY_PATH = path.join(ROOT, "data", "assurance", "privacy_control_traceability.json");
const THREAT_REGISTER_PATH = path.join(ROOT, "data", "assurance", "privacy_threat_register.csv");
const BACKLOG_PATH = path.join(ROOT, "data", "assurance", "dpia_backlog.csv");

const FLOW_INVENTORY = JSON.parse(fs.readFileSync(FLOW_INVENTORY_PATH, "utf8"));
const TRACEABILITY = JSON.parse(fs.readFileSync(TRACEABILITY_PATH, "utf8"));
const threatCount = fs.readFileSync(THREAT_REGISTER_PATH, "utf8").trim().split("\n").length - 1;
const backlogCount = fs.readFileSync(BACKLOG_PATH, "utf8").trim().split("\n").length - 1;

export const privacyThreatAtlasCoverage = [
  "filter and inspector synchronization",
  "data-flow, threat-table, and control-table parity",
  "keyboard navigation across threat rows",
  "responsive layout at md, lg, and xl breakpoints",
  "reduced-motion equivalence",
  "no raw PHI, phone numbers, or credentials in rendered fixtures",
  "landmark integrity for header, nav, main, and aside",
];

export const privacyThreatAtlasManifest = {
  task: "par_126",
  visualMode: FLOW_INVENTORY.visual_mode,
  flowCount: FLOW_INVENTORY.summary.processing_activity_count,
  threatCount,
  controlCount: TRACEABILITY.summary.control_family_count,
  backlogCount,
  prerequisiteGapId: TRACEABILITY.prerequisite_gaps[0]?.gapId ?? null,
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
    throw new Error("This spec needs the `playwright` package when run with --run.", { cause: error });
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/assurance/126_privacy_threat_atlas.html";
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
        reject(new Error("Unable to bind privacy atlas static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/assurance/126_privacy_threat_atlas.html`,
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

async function resetFilters(page) {
  for (const testId of [
    "domain-filter-all",
    "audience-filter-all",
    "track-filter-all",
    "risk-filter-all",
  ]) {
    await page.locator(`[data-testid='${testId}']`).click();
  }
}

async function waitForLayoutMode(page, expected) {
  await page.waitForFunction(
    (mode) => document.querySelector("[data-testid='privacy-threat-atlas-root']")?.getAttribute("data-layout-mode") === mode,
    expected,
  );
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Privacy threat atlas HTML is missing.");
  assertCondition(
    FLOW_INVENTORY.task_id === "par_126" && FLOW_INVENTORY.visual_mode === "Privacy_Threat_Atlas",
    "Privacy flow inventory metadata drifted.",
  );
  assertCondition(
    TRACEABILITY.task_id === "par_126" && TRACEABILITY.summary.control_family_count >= 10,
    "Privacy control traceability drifted.",
  );
  assertCondition(threatCount >= 10, "Expected at least ten threat rows.");
  assertCondition(backlogCount >= 8, "Expected at least eight backlog rows.");
  assertCondition(
    privacyThreatAtlasManifest.prerequisiteGapId === "PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING",
    "Expected par_125 prerequisite gap to remain explicit.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1520, height: 1180 } });
    const page = await context.newPage();
    const baseOrigin = new URL(url).origin;
    const externalRequests = new Set();
    trackExternalRequests(page, baseOrigin, externalRequests);

    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "privacy-threat-atlas-root",
      "privacy-threat-atlas-masthead",
      "filter-rail",
      "diagram-canvas",
      "data-flow-diagram",
      "data-flow-table",
      "threat-density-matrix",
      "threat-table",
      "control-trace-braid",
      "control-table",
      "backlog-table",
      "review-trigger-timeline",
      "inspector-panel",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const root = page.locator("[data-testid='privacy-threat-atlas-root']");
    assertCondition(
      (await root.getAttribute("data-mode")) === "Privacy_Threat_Atlas",
      "Atlas mode drifted.",
    );

    assertCondition(
      (await page.locator("[data-testid='data-flow-diagram'] [data-flow-id]").count()) ===
        privacyThreatAtlasManifest.flowCount,
      "Flow card count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='data-flow-table'] tbody tr").count()) ===
        privacyThreatAtlasManifest.flowCount,
      "Flow table parity drifted.",
    );

    await page.locator("[data-testid='domain-filter-observability_and_audit']").click();
    await page.locator("[data-testid='selected-threat-id']").waitFor();
    assertCondition(
      (await root.getAttribute("data-selected-threat-id")) === "PRIV-126-005",
      "Filtering to observability should auto-select PRIV-126-005.",
    );
    assertCondition(
      (await page.locator("[data-testid='selected-backlog-id']").innerText()).trim() === "DPIA-126-004",
      "Inspector backlog did not synchronize with the selected telemetry threat.",
    );
    assertCondition(
      (await page.locator("[data-testid='flow-card-FLOW_126_OBSERVABILITY_AND_AUDIT']").getAttribute("data-selected")) ===
        "true",
      "Data-flow diagram did not synchronize with telemetry threat selection.",
    );
    assertCondition(
      (await page.locator("[data-backlog-id='DPIA-126-004']").getAttribute("data-linked")) === "selected",
      "Backlog table did not synchronize with selected threat.",
    );
    await page.locator("[data-testid='control-trace-braid'] [data-control-id='CTRL_126_UI_TELEMETRY_DISCLOSURE_FENCE_V1']").waitFor();

    await resetFilters(page);
    await page.locator("[data-testid='threat-list'] [data-threat-id='PRIV-126-001']").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assertCondition(
      (await root.getAttribute("data-selected-threat-id")) === "PRIV-126-002",
      "Threat keyboard navigation did not move to PRIV-126-002.",
    );

    const landmarks = await page.locator("header, nav, main, aside").count();
    assertCondition(landmarks >= 4, `Expected header/nav/main/aside landmarks, found ${landmarks}.`);

    await page.setViewportSize({ width: 820, height: 1180 });
    await waitForLayoutMode(page, "md");
    assertCondition(
      (await root.getAttribute("data-layout-mode")) === "md",
      "Atlas did not switch to md layout.",
    );
    await page.setViewportSize({ width: 1120, height: 1180 });
    await waitForLayoutMode(page, "lg");
    assertCondition(
      (await root.getAttribute("data-layout-mode")) === "lg",
      "Atlas did not switch to lg layout.",
    );
    await page.setViewportSize({ width: 1520, height: 1180 });
    await waitForLayoutMode(page, "xl");
    assertCondition(
      (await root.getAttribute("data-layout-mode")) === "xl",
      "Atlas did not switch back to xl layout.",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(100);
    assertCondition(
      (await root.getAttribute("data-motion-mode")) === "reduced",
      "Reduced-motion mode did not propagate into the atlas.",
    );
    assertCondition(
      (await page.locator("[data-testid='selected-threat-id']").innerText()).trim() === "PRIV-126-002",
      "Reduced-motion toggle should not lose current selection.",
    );

    await resetFilters(page);
    const visibleThreatButtons = await page.locator("[data-testid='threat-list'] [data-threat-id]").count();
    assertCondition(visibleThreatButtons === privacyThreatAtlasManifest.threatCount, "Threat list count drifted.");
    assertCondition(
      (await page.locator("[data-testid='threat-table'] tbody tr").count()) === visibleThreatButtons,
      "Threat table parity drifted.",
    );
    const selectedControlCards = await page
      .locator("[data-testid='control-trace-braid'] [data-control-id^='CTRL_']")
      .count();
    assertCondition(
      (await page.locator("[data-testid='control-table'] tbody tr").count()) === selectedControlCards,
      "Control table parity drifted.",
    );

    const pageText = await page.locator("body").innerText();
    assertCondition(!/\b(?:07\d{9}|(?:\+44|0044)\d{10})\b/.test(pageText), "Rendered fixtures contain a phone number.");
    assertCondition(!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(pageText), "Rendered fixtures contain an email address.");
    for (const forbidden of ["Bearer ", "password=", "tel:+", "nhs_number:"]) {
      assertCondition(!pageText.includes(forbidden), `Rendered fixtures contain forbidden token: ${forbidden}`);
    }

    assertCondition(externalRequests.size === 0, `Unexpected external requests: ${Array.from(externalRequests).join(", ")}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(() => resolve(undefined)));
  }
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entrypoint && entrypoint === __filename) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
