import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "88_live_update_and_cache_atlas.html");
const CACHE_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "cache_namespace_manifest.json");
const LIVE_MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "live_transport_topology_manifest.json",
);
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "cache_transport_boundary_matrix.csv");

export const liveUpdateAndCacheAtlasCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that stale and blocked modes remain visibly distinct from restored or healthy modes",
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

function filteredRows(rows, filters) {
  return rows.filter((row) => {
    return (
      (!filters.audience || row.audience_surface_ref === filters.audience) &&
      (!filters.channelState || row.channel_state === filters.channelState) &&
      (!filters.cacheClass || row.namespace_class === filters.cacheClass) &&
      (!filters.environment || row.environment_ring === filters.environment) &&
      (!filters.degradedMode || row.degraded_mode === filters.degradedMode)
    );
  });
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/88_live_update_and_cache_atlas.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/88_live_update_and_cache_atlas.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Live update and cache atlas HTML is missing.");
  const cacheManifest = JSON.parse(fs.readFileSync(CACHE_MANIFEST_PATH, "utf8"));
  const liveManifest = JSON.parse(fs.readFileSync(LIVE_MANIFEST_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));

  assertCondition(
    cacheManifest.summary.cache_namespace_count === 21,
    "Cache namespace count drifted.",
  );
  assertCondition(liveManifest.summary.live_channel_count === 15, "Live channel count drifted.");
  assertCondition(matrix.length === 95, "Boundary matrix row count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='topology-diagram']").waitFor();
    await page.locator("[data-testid='cache-grid']").waitFor();
    await page.locator("[data-testid='replay-timeline']").waitFor();
    await page.locator("[data-testid='topology-table']").waitFor();
    await page.locator("[data-testid='policy-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='topology-row-']").count()) === matrix.length,
      "Initial topology row count drifted.",
    );

    await page
      .locator("[data-testid='filter-audience']")
      .selectOption("audsurf_operations_console");
    await page.locator("[data-testid='filter-environment']").selectOption("ci-preview");
    await page.locator("[data-testid='filter-channel-state']").selectOption("stale");
    const staleOperationsRows = filteredRows(matrix, {
      audience: "audsurf_operations_console",
      environment: "ci-preview",
      channelState: "stale",
    });
    assertCondition(
      (await page.locator("[data-testid^='topology-row-']").count()) === staleOperationsRows.length,
      "Audience, environment, and channel-state filter drifted.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-channel-state']").selectOption("all");
    await page.locator("[data-testid='filter-cache-class']").selectOption("entity_scoped");
    const entityRows = filteredRows(matrix, { cacheClass: "entity_scoped" });
    assertCondition(
      (await page.locator("[data-testid^='topology-row-']").count()) === entityRows.length,
      "Cache-class filter drifted.",
    );

    await page.locator("[data-testid='filter-cache-class']").selectOption("all");
    await page
      .locator("[data-testid='filter-degraded-mode']")
      .selectOption("fail_closed_review_required");
    const blockedRows = filteredRows(matrix, {
      degradedMode: "fail_closed_review_required",
    });
    assertCondition(
      blockedRows.length > 0 &&
        (await page.locator("[data-testid^='topology-row-']").count()) === blockedRows.length,
      "Degraded-mode filter drifted.",
    );

    const blockedRow = blockedRows[0];
    await page.locator(`[data-testid='topology-row-${blockedRow.row_id}'] .row-button`).click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes(blockedRow.route_family_ref) &&
        inspectorText.includes(blockedRow.connection_registry_ref),
      "Inspector lost synchronized blocked-row detail.",
    );

    const blockedColor = await page
      .locator(`[data-testid='topology-row-${blockedRow.row_id}'] .state-chip`)
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    await page
      .locator("[data-testid='filter-degraded-mode']")
      .selectOption("restored_after_rebind");
    const restoredRows = filteredRows(matrix, { degradedMode: "restored_after_rebind" });
    assertCondition(restoredRows.length > 0, "Restored rows are missing.");
    const restoredRow = restoredRows[0];
    const restoredColor = await page
      .locator(`[data-testid='topology-row-${restoredRow.row_id}'] .state-chip`)
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    assertCondition(
      blockedColor !== restoredColor,
      "Blocked and restored modes are no longer visually distinct.",
    );

    await page.locator("[data-testid='filter-degraded-mode']").selectOption("all");
    const visibleRows = filteredRows(matrix, {});
    const first = visibleRows[0];
    const second = visibleRows[1];
    await page.locator(`[data-testid='topology-row-${first.row_id}'] .row-button`).focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator(`[data-testid='topology-row-${second.row_id}']`)
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-key navigation did not advance to the next visible row.",
    );

    await page.setViewportSize({ width: 1024, height: 900 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );
    assertCondition(
      await page.locator("[data-testid='topology-table']").isVisible(),
      "Topology table disappeared at tablet width.",
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
    assertCondition(landmarks >= 6, `Accessibility smoke failed: found ${landmarks} landmarks.`);
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

export const liveUpdateAndCacheAtlasManifest = {
  task: "par_088",
  cacheNamespaces: 21,
  liveChannels: 15,
  boundaryRows: 95,
};
