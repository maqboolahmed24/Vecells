import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "55_lifecycle_coordinator_lab.html");
const TAXONOMY_PATH = path.join(ROOT, "data", "analysis", "closure_blocker_taxonomy.json");
const SIGNAL_PATH = path.join(ROOT, "data", "analysis", "milestone_signal_matrix.csv");
const REOPEN_PATH = path.join(ROOT, "data", "analysis", "reopen_trigger_matrix.csv");

const TAXONOMY = JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf8"));

export const lifecycleCoordinatorCoverage = [
  "blocker filtering",
  "signal selection",
  "matrix and inspector parity",
  "verdict-panel rendering",
  "keyboard navigation",
  "responsive behavior",
  "reduced motion",
  "accessibility smoke checks",
];

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

function toTestId(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
      pathname = "/docs/architecture/55_lifecycle_coordinator_lab.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/55_lifecycle_coordinator_lab.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Lifecycle coordinator lab HTML is missing.");
  const signalRows = parseCsv(fs.readFileSync(SIGNAL_PATH, "utf8"));
  const reopenRows = parseCsv(fs.readFileSync(REOPEN_PATH, "utf8"));
  assertCondition(
    signalRows.length === TAXONOMY.summary.milestone_signal_count,
    "Signal row count drifted from taxonomy summary.",
  );
  assertCondition(
    reopenRows.length === TAXONOMY.summary.reopen_trigger_count,
    "Reopen row count drifted from taxonomy summary.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='filter-domain']").waitFor();
    await page.locator("[data-testid='constellation-canvas']").waitFor();
    await page.locator("[data-testid='verdict-panel']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='defect-strip']").waitFor();

    const initialSignals = await page.locator("[data-testid^='signal-row-']").count();
    assertCondition(
      initialSignals === TAXONOMY.summary.milestone_signal_count,
      `Expected ${TAXONOMY.summary.milestone_signal_count} signal rows, found ${initialSignals}.`,
    );

    await page.locator("[data-testid='filter-blocker-class']").selectOption("confirmation_gate");
    const confirmationSignals = await page.locator("[data-testid^='signal-row-']").count();
    assertCondition(
      confirmationSignals === 4,
      `Confirmation-gate filter expected 4 rows, found ${confirmationSignals}.`,
    );

    await page.locator("[data-testid='filter-blocker-class']").selectOption("all");
    await page.locator("[data-testid='filter-domain']").selectOption("pharmacy");
    const pharmacySignals = await page.locator("[data-testid^='signal-row-']").count();
    assertCondition(
      pharmacySignals === 4,
      `Pharmacy domain filter expected 4 rows, found ${pharmacySignals}.`,
    );

    const bounceBackId = "MSIG_055_PHARMACY_CASE_BOUNCE_BACK";
    await page
      .locator(`[data-testid='signal-row-${toTestId(bounceBackId)}']`)
      .click({ force: true });
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("pharmacy.case.bounce_back") &&
        inspectorText.includes("LineageFence.currentEpoch"),
      "Inspector lost bounce-back parity or epoch requirements.",
    );

    const linkedBlocker = await page
      .locator("[data-testid='blocker-row-reachability-dependency']")
      .getAttribute("data-linked");
    assertCondition(
      linkedBlocker === "true",
      "Reachability blocker row did not link to the selected pharmacy bounce-back signal.",
    );

    const linkedReopen = await page
      .locator("[data-testid='reopen-row-bounce-back']")
      .getAttribute("data-linked");
    assertCondition(
      linkedReopen === "true",
      "Bounce-back reopen row did not link to the selected signal.",
    );

    await page.locator("[data-testid='filter-domain']").selectOption("all");
    await page
      .locator("[data-testid='filter-closure-eligibility']")
      .selectOption("close_candidate");
    const closeCandidates = await page.locator("[data-testid^='signal-row-']").count();
    assertCondition(
      closeCandidates === 5,
      `Close-candidate filter expected 5 rows, found ${closeCandidates}.`,
    );

    await page.locator("[data-testid='filter-closure-eligibility']").selectOption("all");
    await page.locator("[data-testid='filter-domain']").selectOption("booking");
    const visibleRows = page.locator("[data-testid^='signal-row-']");
    await visibleRows.nth(0).focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await visibleRows.nth(1).getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "ArrowDown did not advance booking signal selection.",
    );

    const verdictText = await page.locator("[data-testid='verdict-panel']").innerText();
    assertCondition(
      verdictText.includes("LifecycleCoordinator") ||
        verdictText.includes("close") ||
        verdictText.includes("defer"),
      "Verdict panel failed to render lifecycle verdict text.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
    assertCondition(inspectorVisible, "Inspector disappeared at mobile width.");

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    try {
      await reducedPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await reducedPage.evaluate(() => document.body.dataset.reducedMotion);
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await reducedContext.close();
    }

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(
      landmarks >= 8,
      `Accessibility smoke failed: expected landmarks, found ${landmarks}.`,
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

export const lifecycleCoordinatorLabManifest = {
  task: TAXONOMY.task_id,
  inputs: TAXONOMY.summary.coordinator_input_count,
  blockers: TAXONOMY.summary.blocker_category_count,
  signals: TAXONOMY.summary.milestone_signal_count,
  reopenTriggers: TAXONOMY.summary.reopen_trigger_count,
};
