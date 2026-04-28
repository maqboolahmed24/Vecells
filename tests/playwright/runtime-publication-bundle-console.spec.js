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
  "94_runtime_publication_bundle_console.html",
);
const BUNDLE_CATALOG_PATH = path.join(ROOT, "data", "analysis", "runtime_publication_bundles.json");
const PARITY_CATALOG_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "release_publication_parity_records.json",
);

export const runtimePublicationBundleConsoleCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that blocked, drifted, and verified states remain visually and semantically distinct",
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
      pathname = "/docs/architecture/94_runtime_publication_bundle_console.html";
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/94_runtime_publication_bundle_console.html`,
      });
    });
  });
}

function getExpectedCounts() {
  const bundleCatalog = JSON.parse(fs.readFileSync(BUNDLE_CATALOG_PATH, "utf8"));
  const parityCatalog = JSON.parse(fs.readFileSync(PARITY_CATALOG_PATH, "utf8"));
  const rows = parityCatalog.surfaceAuthorityRows;
  return {
    bundleCatalog,
    parityCatalog,
    rows,
    pharmacyRows: rows.filter((row) => row.audienceSurface === "audsurf_pharmacy_console").length,
    publishedPharmacyRows: rows.filter(
      (row) =>
        row.audienceSurface === "audsurf_pharmacy_console" && row.publicationState === "published",
    ).length,
    staleRows: rows.filter((row) => row.driftState === "stale").length,
    verifiedRows: rows.filter((row) => row.provenanceVerificationState === "verified").length,
  };
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Runtime publication bundle console HTML is missing.");
  const expected = getExpectedCounts();
  assertCondition(
    expected.bundleCatalog.runtimePublicationBundles.length === 5,
    "Bundle count drifted.",
  );
  assertCondition(
    expected.parityCatalog.releasePublicationParityRecords.length === 5,
    "Parity count drifted.",
  );
  assertCondition(expected.rows.length === 45, "Surface authority row count drifted.");

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='tuple-diagram']").waitFor();
    await page.locator("[data-testid='parity-matrix']").waitFor();
    await page.locator("[data-testid='refusal-timeline']").waitFor();
    await page.locator("[data-testid='member-table']").waitFor();
    await page.locator("[data-testid='refusal-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='surface-row-']").count()) === expected.rows.length,
      "Initial member-table row count drifted.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("audsurf_pharmacy_console");
    assertCondition(
      (await page.locator("[data-testid^='surface-row-']").count()) === expected.pharmacyRows,
      "Audience filter drifted.",
    );

    await page.locator("[data-testid='filter-publication-state']").selectOption("published");
    assertCondition(
      (await page.locator("[data-testid^='surface-row-']").count()) ===
        expected.publishedPharmacyRows,
      "Audience plus publication filter drifted.",
    );

    await page.locator("[data-testid='filter-publication-state']").selectOption("all");
    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-drift-state']").selectOption("stale");
    assertCondition(
      (await page.locator("[data-testid^='surface-row-']").count()) === expected.staleRows,
      "Drift-state filter drifted.",
    );

    await page.locator("[data-testid='filter-drift-state']").selectOption("all");
    await page.locator("[data-testid='filter-provenance-state']").selectOption("verified");
    assertCondition(
      (await page.locator("[data-testid^='surface-row-']").count()) === expected.verifiedRows,
      "Provenance-state filter drifted.",
    );

    await page.locator("[data-testid='filter-provenance-state']").selectOption("all");
    await page.locator("[data-testid='surface-row-RC_LOCAL_V1--audsurf_pharmacy_console']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("rpb::local::authoritative") &&
        inspectorText.includes("rpp::local::authoritative"),
      "Inspector lost synchronized bundle/parity selection detail.",
    );
    const timelineSelected = await page
      .locator("[data-testid='timeline-RC_LOCAL_V1']")
      .getAttribute("data-selected");
    assertCondition(timelineSelected === "true", "Timeline did not synchronize selection.");

    const publishedColor = await page.evaluate(() => {
      const node = document.querySelector(
        "tr:has([data-testid='surface-row-RC_LOCAL_V1--audsurf_patient_public_entry']) .badge-published",
      );
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    const staleColor = await page.evaluate(() => {
      const node = document.querySelector(
        "tr:has([data-testid='surface-row-RC_CI_PREVIEW_V1--audsurf_patient_public_entry']) .badge-stale",
      );
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    const conflictColor = await page.evaluate(() => {
      const node = document.querySelector(
        "tr:has([data-testid='surface-row-RC_INTEGRATION_V1--audsurf_patient_public_entry']) .badge-conflict",
      );
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    assertCondition(
      publishedColor !== staleColor && staleColor !== conflictColor,
      "Published, stale, and conflict states are no longer visually distinct.",
    );

    const visibleOrder = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".surface-button")).map((node) =>
        node.getAttribute("data-testid"),
      ),
    );
    const currentIndex = visibleOrder.indexOf(
      "surface-row-RC_LOCAL_V1--audsurf_patient_public_entry",
    );
    assertCondition(currentIndex >= 0, "Focused row is missing from visible order.");
    const expectedNextRow = visibleOrder[Math.min(currentIndex + 1, visibleOrder.length - 1)];
    await page
      .locator("[data-testid='surface-row-RC_LOCAL_V1--audsurf_patient_public_entry']")
      .focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator(`tr[data-selected='true'] [data-testid='${expectedNextRow}']`)
      .count();
    assertCondition(nextSelected === 1, "ArrowDown did not advance selection.");

    await page.setViewportSize({ width: 980, height: 900 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared on tablet width.",
    );

    assertCondition(
      (await page.locator("header").count()) === 1 &&
        (await page.locator("nav").count()) === 1 &&
        (await page.locator("main").count()) === 1 &&
        (await page.locator("aside").count()) === 1,
      "Required landmarks are missing.",
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
