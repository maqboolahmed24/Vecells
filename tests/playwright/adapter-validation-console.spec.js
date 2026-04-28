import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "integrations", "129_adapter_validation_console.html");
const CATALOG_PATH = path.join(ROOT, "data", "integration", "seeded_external_contract_catalog.json");

export const adapterValidationConsoleCoverage = [
  "adapter selection and inspector sync",
  "unsupported capability visibility",
  "degraded-mode rendering",
  "keyboard traversal and landmark structure",
  "responsive layout and reduced-motion equivalence",
  "table parity for capability, degradation, and handover surfaces",
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
      pathname = "/docs/integrations/129_adapter_validation_console.html";
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
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": type });
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
        url: `http://127.0.0.1:${address.port}/docs/integrations/129_adapter_validation_console.html`,
      });
    });
  });
}

function loadExpected() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const rows = catalog.adapterRows;
  assertCondition(Array.isArray(rows) && rows.length > 0, "Adapter catalog rows must be present.");

  const selectedAdapter =
    rows.find((row) => row.adapterId === "adp_local_booking_supplier") ??
    rows.find((row) => row.currentValidationState === "pass") ??
    rows[0];
  const gapAdapter =
    rows.find((row) => row.currentValidationState === "blocked") ??
    rows.find((row) => row.currentValidationState === "partial") ??
    rows[rows.length - 1];

  return {
    rows,
    count: rows.length,
    evidenceProcessingCount: rows.filter((row) => row.adapterFamily === "evidence_processing").length,
    blockedCount: rows.filter((row) => row.currentValidationState === "blocked").length,
    partialCount: rows.filter((row) => row.currentValidationState === "partial").length,
    selectedAdapter,
    gapAdapter,
  };
}

async function tableBodyRowCount(locator) {
  return await locator.locator("tbody tr").count();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Adapter validation console HTML is missing.");
  const expected = loadExpected();

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1540, height: 1200 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid^='adapter-card-']").first().waitFor();
    await page.locator("[data-testid='capability-matrix']").waitFor();
    await page.locator("[data-testid='degradation-braid']").waitFor();
    await page.locator("[data-testid='handover-ladder']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='adapter-card-']").count()) === expected.count,
      "Initial adapter count drifted.",
    );
    assertCondition(
      (await page.locator("nav[aria-label='Adapter filters and rail']").count()) === 1,
      "Adapter rail landmark is missing.",
    );
    assertCondition((await page.locator("main.layout").count()) === 1, "Main workspace landmark is missing.");
    assertCondition((await page.locator("aside[data-testid='inspector']").count()) === 1, "Inspector landmark is missing.");

    await page.locator("[data-testid='filter-family']").selectOption("evidence_processing");
    assertCondition(
      (await page.locator("[data-testid^='adapter-card-']").count()) === expected.evidenceProcessingCount,
      "Adapter family filter drifted.",
    );
    await page.locator("[data-testid='filter-family']").selectOption("all");

    const validationStateFilter =
      expected.blockedCount > 0 ? "blocked" : expected.partialCount > 0 ? "partial" : "pass";
    const expectedStateCount = expected.rows.filter(
      (row) => row.currentValidationState === validationStateFilter,
    ).length;
    await page.locator("[data-testid='filter-state']").selectOption(validationStateFilter);
    assertCondition(
      (await page.locator("[data-testid^='adapter-card-']").count()) === expectedStateCount,
      "Validation-state filter drifted.",
    );

    await page.locator("[data-testid='filter-family']").selectOption("all");
    await page.locator("[data-testid='filter-state']").selectOption("all");
    await page.locator("[data-testid='filter-posture']").selectOption("mock_now_execution");
    assertCondition(
      (await page.locator("[data-testid^='adapter-card-']").count()) === expected.count,
      "Mock posture filter drifted.",
    );
    await page.locator("[data-testid='filter-posture']").selectOption("all");

    const selected = expected.selectedAdapter;
    await page.locator(`[data-testid='adapter-card-${selected.adapterId}']`).click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes(selected.adapterId) && inspectorText.includes(selected.adapterLabel),
      "Inspector lost selected adapter identity.",
    );
    const unsupportedItems = await page
      .locator("[data-testid='unsupported-capability-list'] li")
      .allInnerTexts();
    assertCondition(
      unsupportedItems.includes(selected.unsupportedCapabilityRefs[0]),
      "Unsupported capability visibility drifted for the selected adapter.",
    );

    const capabilityCellCount = await page.locator("[data-testid^='capability-cell-']").count();
    const capabilityTableRows = await tableBodyRowCount(page.locator("[data-testid='capability-parity']"));
    assertCondition(capabilityCellCount === capabilityTableRows, "Capability matrix/table parity drifted.");

    const degradedRowCount = await page.locator("[data-testid^='degraded-row-']").count();
    const degradedTableRows = await tableBodyRowCount(page.locator("[data-testid='degradation-parity']"));
    assertCondition(degradedRowCount === degradedTableRows, "Degraded braid/table parity drifted.");

    const handoverStepCount = await page.locator("[data-testid^='handover-step-']").count();
    const handoverTableRows = await tableBodyRowCount(page.locator("[data-testid='handover-parity']"));
    assertCondition(handoverStepCount === handoverTableRows, "Handover ladder/table parity drifted.");

    const beforeCapability = await page.locator("[data-testid='capability-table']").innerText();
    const beforeDegradation = await page.locator("[data-testid='degradation-table']").innerText();
    const beforeHandover = await page.locator("[data-testid='handover-table']").innerText();

    const gapAdapter = expected.gapAdapter;
    await page.locator(`[data-testid='adapter-card-${gapAdapter.adapterId}']`).click();
    const gapInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      gapInspector.includes(gapAdapter.adapterId),
      "Inspector did not switch to the selected gap adapter.",
    );
    assertCondition(
      gapAdapter.currentValidationState === "pass" ||
        (await page.locator("[data-testid='gap-refs']").innerText()) !== "none",
      "Gap adapter lost explicit gap visibility.",
    );
    const afterCapability = await page.locator("[data-testid='capability-table']").innerText();
    const afterDegradation = await page.locator("[data-testid='degradation-table']").innerText();
    const afterHandover = await page.locator("[data-testid='handover-table']").innerText();
    assertCondition(beforeCapability !== afterCapability, "Capability surface did not synchronize selection.");
    assertCondition(beforeDegradation !== afterDegradation, "Degradation surface did not synchronize selection.");
    assertCondition(beforeHandover !== afterHandover, "Handover surface did not synchronize selection.");

    const visibleOrder = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-testid^='adapter-card-']")).map((node) =>
        node.getAttribute("data-testid"),
      ),
    );
    const currentIndex = visibleOrder.indexOf(`adapter-card-${gapAdapter.adapterId}`);
    assertCondition(currentIndex >= 0, "Selected adapter is missing from the visible adapter rail.");
    const expectedNext = visibleOrder[Math.min(currentIndex + 1, visibleOrder.length - 1)];
    await page.locator(`[data-testid='adapter-card-${gapAdapter.adapterId}']`).focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page.locator(`[data-testid='${expectedNext}'][data-selected='true']`).count()) === 1,
      "ArrowDown did not advance adapter selection.",
    );

    if (expected.blockedCount > 0 && expected.partialCount > 0) {
      const partialColor = await page
        .locator(".chip.partial")
        .first()
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      const blockedColor = await page
        .locator(".chip.blocked")
        .first()
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      assertCondition(
        partialColor !== blockedColor,
        "Blocked and partial validation states are no longer visually distinct.",
      );
    }

    await page.setViewportSize({ width: 980, height: 920 });
    assertCondition(
      await page.locator("[data-testid='capability-table']").isVisible(),
      "Capability table disappeared on narrow width.",
    );
    assertCondition(
      await page.locator("[data-testid='degradation-table']").isVisible(),
      "Degradation table disappeared on narrow width.",
    );
    assertCondition(
      await page.locator("[data-testid='handover-table']").isVisible(),
      "Handover table disappeared on narrow width.",
    );
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared on narrow width.",
    );

    const reducedMotionPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    try {
      await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
      await reducedMotionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await reducedMotionPage.locator("body[data-reduced-motion='true']").count()) === 1,
        "Reduced-motion posture did not activate.",
      );
      assertCondition(
        (await reducedMotionPage.locator("[data-testid^='adapter-card-']").count()) === expected.count,
        "Reduced-motion rendering changed the adapter count.",
      );
      const reducedCapabilityRows = await tableBodyRowCount(
        reducedMotionPage.locator("[data-testid='capability-parity']"),
      );
      const reducedCapabilityCells = await reducedMotionPage
        .locator("[data-testid^='capability-cell-']")
        .count();
      assertCondition(
        reducedCapabilityRows === reducedCapabilityCells,
        "Reduced-motion rendering broke capability parity.",
      );
    } finally {
      await reducedMotionPage.close();
    }
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

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  const expected = loadExpected();
  assertCondition(expected.count >= 18, "Adapter validation catalog dropped below the seq_129 floor.");
  console.log("adapter-validation-console.spec.js:ok");
}
