import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "96_cache_channel_contract_studio.html");
const CACHE_PATH = path.join(ROOT, "data", "analysis", "client_cache_policy_catalog.json");
const LIVE_PATH = path.join(ROOT, "data", "analysis", "live_update_channel_contract_catalog.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "browser_recovery_posture_matrix.csv");

export const cacheChannelContractStudioCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that live, read-only, recovery-only, and blocked states remain visually distinct",
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
      pathname = "/docs/architecture/96_cache_channel_contract_studio.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/96_cache_channel_contract_studio.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Cache channel contract studio HTML is missing.");
  const cacheCatalog = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  const liveCatalog = JSON.parse(fs.readFileSync(LIVE_PATH, "utf8"));
  const matrixRows = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8")).map((row) => ({
    ...row,
    secondaryCachePolicyRefs: row.secondaryCachePolicyRefs
      ? row.secondaryCachePolicyRefs.split("|").filter(Boolean)
      : [],
  }));

  assertCondition(
    cacheCatalog.summary.client_cache_policy_count === 21,
    "Cache policy count drifted.",
  );
  assertCondition(
    liveCatalog.summary.live_update_channel_contract_count === 15,
    "Live channel count drifted.",
  );
  assertCondition(matrixRows.length === 95, "Browser recovery matrix row count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1460, height: 1120 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='summary-strip']").waitFor();
    await page.locator("[data-testid='matrix-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='matrix-record-']").count()) === matrixRows.length,
      "Initial matrix row count drifted.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("audsurf_support_workspace");
    await page.locator("[data-testid='filter-environment']").selectOption("local");
    const supportRows = matrixRows.filter(
      (row) =>
        row.audienceSurfaceRef === "audsurf_support_workspace" && row.environmentRing === "local",
    );
    assertCondition(
      (await page.locator("[data-testid^='matrix-record-']").count()) === supportRows.length,
      "Audience and environment filter drifted.",
    );

    await page.locator("[data-testid='filter-posture']").selectOption("recovery_only");
    const supportRecoveryRows = supportRows.filter(
      (row) => row.baselineBrowserPosture === "recovery_only",
    );
    assertCondition(
      (await page.locator("[data-testid^='matrix-record-']").count()) ===
        supportRecoveryRows.length,
      "Posture filter drifted.",
    );

    await page.locator("[data-testid='filter-live']").selectOption("live");
    const supportRecoveryLiveRows = supportRecoveryRows.filter(
      (row) => row.liveUpdateChannelContractRef,
    );
    assertCondition(
      (await page.locator("[data-testid^='matrix-record-']").count()) ===
        supportRecoveryLiveRows.length,
      "Live filter drifted.",
    );

    const selected = supportRecoveryLiveRows[0];
    await page.locator(`[data-testid='matrix-row-${selected.browserRecoveryPostureId}']`).click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes(selected.cachePolicyRef) &&
        inspectorText.includes(selected.routeFamilyRef) &&
        inspectorText.includes(selected.releasePublicationParityRecordRef),
      "Inspector lost synchronized route/cache/parity detail.",
    );

    const liveColor = await page
      .locator(
        `tr[data-testid='matrix-record-${selected.browserRecoveryPostureId}'] .chip-recovery_only`,
      )
      .evaluate((node) => getComputedStyle(node).backgroundColor);

    await page.locator("[data-testid='filter-audience']").selectOption("audsurf_governance_admin");
    await page.locator("[data-testid='filter-environment']").selectOption("production");
    await page.locator("[data-testid='filter-posture']").selectOption("read_only");
    await page.locator("[data-testid='filter-live']").selectOption("live");
    const governanceRow = matrixRows.find(
      (row) =>
        row.audienceSurfaceRef === "audsurf_governance_admin" &&
        row.environmentRing === "production" &&
        row.routeFamilyRef === "rf_governance_shell",
    );
    assertCondition(Boolean(governanceRow), "Governance production row is missing.");
    await page
      .locator(`[data-testid='matrix-row-${governanceRow.browserRecoveryPostureId}']`)
      .click();
    const blockedColor = await page
      .locator(
        `tr[data-testid='matrix-record-${governanceRow.browserRecoveryPostureId}'] .chip-read_only`,
      )
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    assertCondition(
      liveColor !== blockedColor,
      "Recovery and read-only chips are no longer visually distinct.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-posture']").selectOption("all");
    await page.locator("[data-testid='filter-live']").selectOption("all");

    const visibleIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".matrix-button")).map((node) =>
        node.getAttribute("data-row-id"),
      ),
    );
    const firstId = visibleIds[0];
    const secondId = visibleIds[1];
    await page.locator(`[data-testid='matrix-row-${firstId}']`).focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator(`[data-testid='matrix-record-${secondId}']`)
      .getAttribute("data-selected");
    assertCondition(secondSelected === "true", "ArrowDown did not advance selection.");

    await page.setViewportSize({ width: 980, height: 900 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );

    assertCondition(
      (await page.locator("header").count()) === 1 &&
        (await page.locator("nav").count()) === 1 &&
        (await page.locator("main").count()) === 1 &&
        (await page.locator("aside").count()) === 1,
      "Required landmarks are missing.",
    );

    const reducedMotionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
      await reducedMotionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await reducedMotionPage
        .locator("body")
        .getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await reducedMotionPage.close();
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
