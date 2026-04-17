import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "52_design_contract_studio.html");
const BUNDLE_PATH = path.join(ROOT, "data", "analysis", "design_contract_publication_bundles.json");
const VOCABULARY_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "design_contract_vocabulary_tuples.csv",
);

const BUNDLE_PAYLOAD = JSON.parse(fs.readFileSync(BUNDLE_PATH, "utf8"));
const VOCABULARY_ROWS = fs
  .readFileSync(VOCABULARY_PATH, "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => line.split(","));

export const designContractStudioCoverage = [
  "audience filtering",
  "bundle selection",
  "lint-state visibility",
  "matrix parity",
  "keyboard navigation",
  "responsive behavior",
  "reduced motion",
  "accessibility smoke checks",
  "stable contract digest markers",
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
      pathname = "/docs/architecture/52_design_contract_studio.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/52_design_contract_studio.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Studio HTML is missing.");
  assertCondition(
    BUNDLE_PAYLOAD.summary.bundle_count === 9,
    "Bundle count drifted from expected audience surface set.",
  );
  assertCondition(
    VOCABULARY_ROWS.length === 19,
    "Vocabulary tuple count drifted from expected route coverage.",
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

    await page.locator("[data-testid='bundle-rail']").waitFor();
    await page.locator("[data-testid='constellation-canvas']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("[data-testid^='bundle-card-']").count();
    assertCondition(
      initialCards === BUNDLE_PAYLOAD.summary.bundle_count,
      `Initial bundle-card parity drifted: expected ${BUNDLE_PAYLOAD.summary.bundle_count}, found ${initialCards}.`,
    );

    await page.locator("[data-testid='filter-audience']").selectOption("audsurf_pharmacy_console");
    const pharmacyCards = await page.locator("[data-testid^='bundle-card-']").count();
    assertCondition(
      pharmacyCards === 1,
      `Pharmacy audience filter expected 1 bundle, found ${pharmacyCards}.`,
    );
    const pharmacyInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      pharmacyInspector.includes("Pharmacy console routes"),
      "Inspector did not sync to pharmacy bundle.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    const authenticatedId = "dcpb::patient_authenticated_shell::planned";
    await page.locator(`[data-testid='bundle-card-${toTestId(authenticatedId)}']`).click();
    const lintRailText = await page.locator("[data-testid='lint-rail']").innerText();
    assertCondition(lintRailText.includes("pass"), "Lint rail failed to show the pass verdict.");

    const expectedVocabularyRows = BUNDLE_PAYLOAD.designContractPublicationBundles.find(
      (row) => row.designContractPublicationBundleId === authenticatedId,
    ).designContractVocabularyTupleRefs.length;
    const renderedVocabularyRows = await page.locator("[data-testid^='vocabulary-row-']").count();
    assertCondition(
      renderedVocabularyRows === expectedVocabularyRows,
      `Vocabulary matrix parity drifted: expected ${expectedVocabularyRows}, found ${renderedVocabularyRows}.`,
    );

    await page
      .locator(`[data-testid='bundle-card-${toTestId("dcpb::patient_public_entry::planned")}']`)
      .focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator(
        `[data-testid='bundle-card-${toTestId("dcpb::patient_authenticated_shell::planned")}']`,
      )
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance bundle selection.");

    const digestMarker = await page
      .locator(`[data-testid='bundle-card-${toTestId(authenticatedId)}']`)
      .getAttribute("data-contract-digest");
    assertCondition(
      digestMarker ===
        BUNDLE_PAYLOAD.designContractPublicationBundles.find(
          (row) => row.designContractPublicationBundleId === authenticatedId,
        ).designContractDigestRef,
      "Stable bundle digest marker drifted.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='inspector']").waitFor();
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

export const designContractStudioManifest = {
  task: BUNDLE_PAYLOAD.task_id,
  bundles: BUNDLE_PAYLOAD.summary.bundle_count,
  vocabularyRows: VOCABULARY_ROWS.length,
};
