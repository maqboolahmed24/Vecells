import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "86_object_storage_retention_atlas.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "object_storage_class_manifest.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "object_retention_policy_matrix.csv");

export const objectStorageRetentionAtlasCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that quarantine and trusted classes are visually and semantically distinct",
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

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const rawUrl = request.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/86_object_storage_retention_atlas.html"
          : rawUrl.split("?")[0];
      const filePath = path.join(ROOT, decodeURIComponent(urlPath).replace(/^\/+/, ""));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": contentType });
      response.end(body);
    });
    server.once("error", reject);
    server.listen(4386, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing object storage atlas HTML: ${HTML_PATH}`);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  assertCondition(manifest.summary.storage_class_count === 6, "Storage class count drifted.");
  assertCondition(matrix.length === 30, "Retention matrix row count drifted.");

  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1480, height: 1100 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const url =
    process.env.OBJECT_STORAGE_RETENTION_ATLAS_URL ??
    "http://127.0.0.1:4386/docs/architecture/86_object_storage_retention_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='flow-diagram']").waitFor();
    await page.locator("[data-testid='lifecycle-ribbon']").waitFor();
    await page.locator("[data-testid='access-matrix']").waitFor();
    await page.locator("[data-testid='manifest-table']").waitFor();
    await page.locator("[data-testid='retention-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const landmarks = await Promise.all([
      page.locator("header[aria-label='Atlas masthead']").count(),
      page.locator("nav[aria-label='Atlas filters']").count(),
      page.locator("main[aria-label='Atlas canvas']").count(),
      page.locator("aside[aria-label='Inspector']").count(),
    ]);
    assertCondition(
      landmarks.every((count) => count === 1),
      "Landmark contract drifted.",
    );

    assertCondition(
      (await page.locator("[data-testid^='manifest-row-']").count()) === 6,
      "Expected 6 manifest rows on initial render.",
    );
    assertCondition(
      (await page.locator("[data-testid^='policy-row-local-']").count()) === 6,
      "Expected 6 local policy rows on initial render.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("production");
    await page
      .locator("[data-testid='filter-workload']")
      .selectOption("wf_shell_delivery_published_gateway");
    assertCondition(
      (await page.locator("[data-testid^='manifest-row-']").count()) === 2,
      "Expected 2 classes for published gateway access.",
    );

    await page
      .locator("[data-testid='filter-retention']")
      .selectOption("governed_presentation_retention");
    assertCondition(
      (await page.locator("[data-testid^='manifest-row-']").count()) === 1,
      "Expected 1 governed presentation class.",
    );

    await page
      .locator("[data-testid='policy-row-production-redacted_presentation'] .row-select")
      .click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("ret_086_redacted_presentation"),
      "Inspector lost retention policy detail.",
    );

    await page.locator("[data-testid='filter-retention']").selectOption("all");
    await page.locator("[data-testid='filter-class']").selectOption("all");
    const firstButton = page.locator("[data-focus-ref='redacted_presentation']");
    await firstButton.focus();
    await page.keyboard.press("ArrowDown");
    const activeText = await page.evaluate(() => document.activeElement?.textContent ?? "");
    assertCondition(
      activeText.includes("Outbound ephemeral"),
      "ArrowDown should move focus to the next visible class row.",
    );

    const reducedMotion = await page.locator("body").getAttribute("data-reduced-motion");
    assertCondition(reducedMotion === "true", "Reduced motion state was not reflected in the DOM.");

    await page.locator("[data-testid='filter-workload']").selectOption("all");
    const quarantineAccent = await page
      .locator("[data-testid='flow-node-quarantine_raw']")
      .getAttribute("data-accent");
    const trustedAccent = await page
      .locator("[data-testid='flow-node-evidence_source_immutable']")
      .getAttribute("data-accent");
    assertCondition(
      quarantineAccent !== trustedAccent,
      "Quarantine and trusted classes must remain visually distinct.",
    );

    await page.setViewportSize({ width: 960, height: 1100 });
    assertCondition(
      (await page.locator("[data-testid='inspector']").isVisible()) === true,
      "Inspector should remain visible at tablet width.",
    );
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

if (process.argv.includes("--run")) {
  run()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  assertCondition(fs.existsSync(HTML_PATH), "Atlas HTML is missing.");
  assertCondition(fs.existsSync(MANIFEST_PATH), "Object storage manifest is missing.");
  assertCondition(fs.existsSync(MATRIX_PATH), "Retention matrix is missing.");
}
