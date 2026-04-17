import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "53_audit_ledger_explorer.html");
const DEPENDENCY_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "audit_admissibility_dependencies.json",
);

const DEPENDENCY_PAYLOAD = JSON.parse(fs.readFileSync(DEPENDENCY_PATH, "utf8"));

export const auditLedgerExplorerCoverage = [
  "taxonomy filtering",
  "record selection",
  "chain and table parity",
  "inspector rendering",
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
      pathname = "/docs/architecture/53_audit_ledger_explorer.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/53_audit_ledger_explorer.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Explorer HTML is missing.");
  assertCondition(
    DEPENDENCY_PAYLOAD.summary.audit_record_count === 14,
    "Audit record count drifted from expected baseline.",
  );
  assertCondition(
    DEPENDENCY_PAYLOAD.summary.inadmissible_dependency_count === 4,
    "Inadmissible dependency count drifted from expected fail-closed baseline.",
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

    await page.locator("[data-testid='filter-rail']").waitFor();
    await page.locator("[data-testid='chain-lane']").waitFor();
    await page.locator("[data-testid='ledger-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialRows = await page.locator("[data-testid^='ledger-row-']").count();
    assertCondition(
      initialRows === DEPENDENCY_PAYLOAD.summary.audit_record_count,
      `Expected ${DEPENDENCY_PAYLOAD.summary.audit_record_count} ledger rows, found ${initialRows}.`,
    );

    const initialChainNodes = await page.locator("[data-testid^='chain-node-']").count();
    assertCondition(
      initialChainNodes === initialRows,
      `Chain and table parity drifted: ${initialChainNodes} chain nodes vs ${initialRows} rows.`,
    );

    await page.locator("[data-testid='filter-taxonomy']").selectOption("support_replay");
    const supportRows = await page.locator("[data-testid^='ledger-row-']").count();
    assertCondition(
      supportRows === 2,
      `Support replay filter expected 2 rows, found ${supportRows}.`,
    );

    const supportChainNodes = await page.locator("[data-testid^='chain-node-']").count();
    assertCondition(
      supportChainNodes === supportRows,
      "Support replay filter broke chain/table parity.",
    );

    await page.locator("[data-testid='filter-taxonomy']").selectOption("all");
    await page.locator("[data-testid='filter-admissibility']").selectOption("blocked");
    const blockedRows = await page.locator("[data-testid^='ledger-row-']").count();
    assertCondition(
      blockedRows === 2,
      `Blocked admissibility filter expected 2 rows, found ${blockedRows}.`,
    );

    const exportRecordId = "AR_053_AUDIT_EXPORT_GENERATED_01";
    await page.locator(`[data-testid='ledger-row-${toTestId(exportRecordId)}']`).click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("Governed audit export generated") &&
        inspectorText.includes("AuditEvent + Provenance companion only") &&
        inspectorText.includes("blocked"),
      "Inspector lost expected export and companion detail.",
    );

    await page.locator("[data-testid='filter-admissibility']").selectOption("all");
    await page
      .locator(`[data-testid='ledger-row-${toTestId("AR_053_ROUTE_INTENT_ESTABLISHED_01")}']`)
      .focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator(`[data-testid='ledger-row-${toTestId("AR_053_COMMAND_INGESTED_01")}']`)
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance ledger-row selection.");

    const dependencyRows = await page.locator("[data-testid^='dependency-row-']").count();
    assertCondition(dependencyRows >= 1, "Dependency table did not render linked rows.");

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
      `Accessibility smoke failed: expected many landmarks, found ${landmarks}.`,
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

export const auditLedgerExplorerManifest = {
  task: DEPENDENCY_PAYLOAD.task_id,
  records: DEPENDENCY_PAYLOAD.summary.audit_record_count,
  inadmissibleDependencies: DEPENDENCY_PAYLOAD.summary.inadmissible_dependency_count,
  chainBreaks: DEPENDENCY_PAYLOAD.summary.chain_break_count,
};
