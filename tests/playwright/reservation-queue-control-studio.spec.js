import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "81_reservation_queue_control_studio.html",
);
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "reservation_queue_casebook.json");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "reservation_fence_manifest.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "queue_rank_snapshot_matrix.csv");

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
  );
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
      pathname = "/docs/architecture/81_reservation_queue_control_studio.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/81_reservation_queue_control_studio.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Reservation queue control studio HTML is missing.");
  assertCondition(fs.existsSync(CASEBOOK_PATH), "Reservation queue casebook is missing.");
  assertCondition(fs.existsSync(MANIFEST_PATH), "Reservation fence manifest is missing.");
  assertCondition(fs.existsSync(MATRIX_PATH), "Queue rank snapshot matrix is missing.");

  const casebook = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));

  assertCondition(casebook.summary.scenario_count === 9, "Casebook scenario count drifted.");
  assertCondition(manifest.summary.parallel_interface_gap_count === 3, "Gap count drifted.");
  assertCondition(matrix.length === 14, "Queue rank snapshot matrix drifted.");

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1180 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='filter-reservation-state']").waitFor();
    await page.locator("[data-testid='filter-queue']").waitFor();
    await page.locator("[data-testid='filter-fairness-mode']").waitFor();
    await page.locator("[data-testid='filter-actor']").waitFor();
    await page.locator("[data-testid='fence-timeline']").waitFor();
    await page.locator("[data-testid='fairness-heat-surface']").waitFor();
    await page.locator("[data-testid='advisory-strip']").waitFor();
    await page.locator("[data-testid='reservation-table']").waitFor();
    await page.locator("[data-testid='queue-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='reservation-row-']").count()) ===
        casebook.summary.reservation_scenario_count,
      "Initial reservation row count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='queue-row-']").count()) ===
        casebook.summary.queue_scenario_count,
      "Initial queue row count drifted.",
    );

    await page.locator("[data-testid='filter-reservation-state']").selectOption("held");
    assertCondition(
      (await page.locator("[data-testid^='reservation-row-']").count()) === 2,
      "Held reservation filter should show two rows.",
    );

    await page
      .locator(
        "[data-testid='reservation-row-overlapping_local_and_hub_claims_same_key'] .row-select",
      )
      .click();
    const selectedScenario = await page
      .locator("[data-testid='fence-timeline']")
      .getAttribute("data-selected-scenario");
    assertCondition(
      selectedScenario === "overlapping_local_and_hub_claims_same_key",
      "Fence timeline lost synchronized reservation selection.",
    );
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("reservation_queue_control_backbone_reservationFenceRecord_0004"),
      "Inspector lost the blocking fence reference.",
    );

    await page.locator("[data-testid='filter-reservation-state']").selectOption("all");
    await page.locator("[data-testid='filter-fairness-mode']").selectOption("suppressed_overload");
    assertCondition(
      (await page.locator("[data-testid^='queue-row-']").count()) === 1,
      "Suppressed-overload filter should show exactly one queue row.",
    );
    const overloadText = await page.locator("[data-testid='fairness-heat-surface']").innerText();
    assertCondition(
      overloadText.includes("queue_081_overload_queue") &&
        overloadText.includes("overload_critical"),
      "Heat surface lost overload parity.",
    );

    await page.locator("[data-testid='filter-fairness-mode']").selectOption("all");
    await page
      .locator("[data-testid='queue-row-assignment_suggestions_preserve_base_queue'] .row-select")
      .click();
    const advisoryText = await page.locator("[data-testid='advisory-strip']").innerText();
    assertCondition(
      advisoryText.includes("task_assign_escalated") && advisoryText.includes("task_assign_return"),
      "Advisory strip lost next-task parity for the ready assignment case.",
    );
    const synchronizedPanels = await Promise.all([
      page.locator("[data-testid='fairness-heat-surface']").getAttribute("data-selected-scenario"),
      page.locator("[data-testid='advisory-strip']").getAttribute("data-selected-scenario"),
      page.locator("[data-testid='inspector']").getAttribute("data-selected-scenario"),
    ]);
    assertCondition(
      synchronizedPanels.every((value) => value === "assignment_suggestions_preserve_base_queue"),
      "Selection did not synchronize across queue-facing panels.",
    );

    await page
      .locator("[data-testid='queue-row-fair_queue_normal_load_commits_snapshot'] .row-select")
      .focus();
    await page.keyboard.press("ArrowDown");
    const keyboardSelected = await page
      .locator("[data-testid='queue-row-overload_queue_pressure_escalated']")
      .getAttribute("data-selected");
    assertCondition(
      keyboardSelected === "true",
      "Arrow-key navigation did not move queue selection to the next visible row.",
    );

    await page.setViewportSize({ width: 1024, height: 900 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );
    assertCondition(
      await page.locator("[data-testid='reservation-table']").isVisible(),
      "Reservation table disappeared at tablet width.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${landmarks}.`);
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

export const reservationQueueControlStudioManifest = {
  task: "par_081",
  coverage: [
    "filtering and synchronized selection behavior",
    "keyboard navigation and focus order",
    "reduced-motion handling",
    "responsive layout at desktop and tablet widths",
    "accessibility smoke checks and landmark verification",
  ],
};
