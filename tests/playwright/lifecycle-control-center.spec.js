import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "77_lifecycle_control_center.html");
const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "lifecycle_coordinator_casebook.json");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "lineage_fence_epoch_manifest.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "lifecycle_signal_contract_matrix.csv");

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
      pathname = "/docs/architecture/77_lifecycle_control_center.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/77_lifecycle_control_center.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Lifecycle control center HTML is missing.");
  assertCondition(fs.existsSync(CASEBOOK_PATH), "Lifecycle coordinator casebook is missing.");
  assertCondition(fs.existsSync(MANIFEST_PATH), "Lineage fence epoch manifest is missing.");
  assertCondition(fs.existsSync(MATRIX_PATH), "Lifecycle signal matrix is missing.");

  const casebook = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const signalCount = casebook.scenarios.reduce(
    (total, scenario) => total + scenario.signalStream.length,
    0,
  );

  assertCondition(
    casebook.summary.scenario_count === 9,
    "Scenario count drifted from the casebook.",
  );
  assertCondition(
    casebook.summary.signal_count === signalCount,
    "Signal count drifted from the casebook.",
  );
  assertCondition(
    Object.keys(manifest.scenarioWaterfalls).length === 9,
    "Waterfall coverage drifted.",
  );
  assertCondition(matrix.length === 15, "Signal contract matrix drifted.");

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

    await page.locator("[data-testid='filter-milestone']").waitFor();
    await page.locator("[data-testid='milestone-ribbon']").waitFor();
    await page.locator("[data-testid='blocker-lattice']").waitFor();
    await page.locator("[data-testid='epoch-waterfall']").waitFor();
    await page.locator("[data-testid='signal-table']").waitFor();
    await page.locator("[data-testid='closure-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialSignals = await page.locator("[data-testid^='signal-row-']").count();
    assertCondition(
      initialSignals === casebook.summary.signal_count,
      `Expected ${casebook.summary.signal_count} visible signal rows, found ${initialSignals}.`,
    );

    await page.locator("[data-testid='filter-blocker-family']").selectOption("fallback_review");
    const fallbackSignals = await page.locator("[data-testid^='signal-row-']").count();
    assertCondition(
      fallbackSignals === 2,
      `Fallback-review filter expected 2 rows, found ${fallbackSignals}.`,
    );

    await page
      .locator("[data-testid='filter-partition']")
      .selectOption("episode_077_more_info_reopen");
    const partitionSignals = await page.locator("[data-testid^='signal-row-']").count();
    assertCondition(
      partitionSignals === 1,
      `Combined fallback-review + partition filter expected 1 row, found ${partitionSignals}.`,
    );

    await page.locator("[data-testid='signal-row-sig-077-more-info-open']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("fallback_case_more_info_late_reply") &&
        inspectorText.includes("triage.more_info.open"),
      "Inspector lost parity with the selected more-info blocker signal.",
    );

    const linkedBlocker = await page
      .locator("[data-testid='blocker-node-fallback_review']")
      .getAttribute("data-linked");
    assertCondition(
      linkedBlocker === "true",
      "Fallback-review lattice node did not link to the selected signal.",
    );

    const linkedEpoch = await page
      .locator("[data-testid='epoch-node-more_info_reopen-2']")
      .getAttribute("data-linked");
    assertCondition(linkedEpoch === "true", "Epoch waterfall did not link to the selected signal.");

    await page.locator("[data-testid='filter-blocker-family']").selectOption("all");
    const moreInfoSignals = page.locator("[data-testid^='signal-row-']");
    const moreInfoCount = await moreInfoSignals.count();
    assertCondition(
      moreInfoCount === 3,
      `Partition filter expected 3 rows, found ${moreInfoCount}.`,
    );

    await moreInfoSignals.nth(0).focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await moreInfoSignals.nth(1).getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-key navigation did not move selection to the next signal.",
    );

    await page.locator("[data-testid='filter-signal-family']").selectOption("reopen");
    const reopenSignals = await page.locator("[data-testid^='signal-row-']").count();
    assertCondition(reopenSignals === 1, `Reopen filter expected 1 row, found ${reopenSignals}.`);

    const landmarks = {
      headers: await page.locator("header").count(),
      mains: await page.locator("main").count(),
      asides: await page.locator("aside").count(),
    };
    assertCondition(
      landmarks.headers >= 1 && landmarks.mains >= 1 && landmarks.asides >= 2,
      "Accessibility landmark coverage is incomplete.",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "networkidle" });
    const reducedMotion = await page.locator("body").getAttribute("data-reduced-motion");
    assertCondition(
      reducedMotion === "true",
      "Reduced-motion mode was not reflected on the document body.",
    );

    const tabletContext = await browser.newContext({ viewport: { width: 960, height: 1180 } });
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto(url, { waitUntil: "networkidle" });
    const tabletLayout = await tabletPage.locator("body").getAttribute("data-layout");
    assertCondition(
      tabletLayout === "tablet",
      "Tablet layout mode was not applied at tablet width.",
    );
    await tabletContext.close();
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
