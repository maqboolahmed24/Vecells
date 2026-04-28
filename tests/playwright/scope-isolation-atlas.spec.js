import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "54_scope_and_isolation_atlas.html");
const TENANT_PATH = path.join(ROOT, "data", "analysis", "tenant_isolation_modes.json");
const ROUTE_PATH = path.join(ROOT, "data", "analysis", "route_to_scope_requirements.csv");
const BLAST_PATH = path.join(ROOT, "data", "analysis", "surface_to_blast_radius_matrix.csv");

const TENANT_PAYLOAD = JSON.parse(fs.readFileSync(TENANT_PATH, "utf8"));

export const scopeIsolationAtlasCoverage = [
  "scope filtering",
  "route selection",
  "matrix and inspector parity",
  "drift-trigger visibility",
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
      pathname = "/docs/architecture/54_scope_and_isolation_atlas.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/54_scope_and_isolation_atlas.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Scope atlas HTML is missing.");
  const routeRows = parseCsv(fs.readFileSync(ROUTE_PATH, "utf8"));
  const blastRows = parseCsv(fs.readFileSync(BLAST_PATH, "utf8"));
  assertCondition(
    routeRows.length === TENANT_PAYLOAD.summary.route_scope_requirement_count,
    "Route coverage drifted from the expected baseline.",
  );
  assertCondition(blastRows.length >= 10, "Surface blast-radius matrix unexpectedly shrank.");

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

    await page.locator("[data-testid='route-rail']").waitFor();
    await page.locator("[data-testid='tuple-braid']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='drift-table']").waitFor();
    await page.locator("[data-testid='defect-strip']").waitFor();

    const initialCards = await page.locator("[data-testid^='route-card-']").count();
    assertCondition(
      initialCards === TENANT_PAYLOAD.summary.route_scope_requirement_count,
      `Expected ${TENANT_PAYLOAD.summary.route_scope_requirement_count} route cards, found ${initialCards}.`,
    );

    await page.locator("[data-testid='filter-audience']").selectOption("support");
    const supportCards = await page.locator("[data-testid^='route-card-']").count();
    assertCondition(supportCards === 3, `Support filter expected 3 cards, found ${supportCards}.`);

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-scope-mode']").selectOption("platform");
    const platformCards = await page.locator("[data-testid^='route-card-']").count();
    assertCondition(
      platformCards === 1,
      `Platform scope filter expected 1 card, found ${platformCards}.`,
    );

    await page.locator("[data-testid='filter-scope-mode']").selectOption("all");
    await page.locator("[data-testid='filter-blast-radius']").selectOption("cross_org");
    const crossOrgCards = await page.locator("[data-testid^='route-card-']").count();
    assertCondition(
      crossOrgCards === 2,
      `Cross-org blast filter expected 2 cards, found ${crossOrgCards}.`,
    );

    await page.locator("[data-testid='filter-blast-radius']").selectOption("all");
    const governanceRequirementId = "RSR_054_GWS_GOVERNANCE_SHELL_RF_GOVERNANCE_SHELL";
    await page.locator(`[data-testid='route-card-${toTestId(governanceRequirementId)}']`).click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("AST_054_GOVERNANCE_PLATFORM_V1") &&
        inspectorText.includes("32") &&
        inspectorText.includes("required"),
      "Inspector lost tuple or blast-radius parity for governance.",
    );

    const linkedBlast = await page
      .locator("[data-testid='blast-row-sbr-054-gws-governance-shell']")
      .getAttribute("data-linked");
    assertCondition(
      linkedBlast === "true",
      "Blast-radius table did not link the selected governance surface.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("hub_desk");
    const hubCards = page.locator("[data-testid^='route-card-']");
    const firstHubCard = hubCards.nth(0);
    const secondHubCard = hubCards.nth(1);
    await firstHubCard.focus();
    await page.keyboard.press("ArrowDown");
    const hubSelected = await secondHubCard.getAttribute("data-selected");
    assertCondition(hubSelected === "true", "ArrowDown did not advance hub route selection.");

    const linkedDrift = await page
      .locator("[data-testid='drift-row-dcr-054-hub-visibility-drift-v1']")
      .getAttribute("data-linked");
    assertCondition(linkedDrift === "true", "Drift table did not reflect the selected tuple.");

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

export const scopeIsolationAtlasManifest = {
  task: TENANT_PAYLOAD.task_id,
  tuples: TENANT_PAYLOAD.summary.acting_scope_tuple_count,
  routes: TENANT_PAYLOAD.summary.route_scope_requirement_count,
  broadScopeRoutes: TENANT_PAYLOAD.summary.broad_scope_route_count,
};
