import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "release", "131_release_candidate_freeze_board.html");
const CANDIDATE_PATH = path.join(ROOT, "data", "release", "release_candidate_tuple.json");
const BLOCKERS_PATH = path.join(ROOT, "data", "release", "freeze_blockers.json");
const MATRIX_PATH = path.join(ROOT, "data", "release", "environment_compatibility_matrix.csv");

export const releaseCandidateFreezeBoardCoverage = [
  "candidate, ring, and blocker selection sync",
  "exact candidate rendering with visible blocked ring truth",
  "keyboard traversal across the ring ladder and blocker matrix",
  "responsive layout and reduced-motion coverage",
  "diagram and table parity for tuple, ring, blocker, and evidence surfaces",
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
      pathname = "/docs/release/131_release_candidate_freeze_board.html";
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
        url: `http://127.0.0.1:${address.port}/docs/release/131_release_candidate_freeze_board.html`,
      });
    });
  });
}

function getExpected() {
  const candidateExport = JSON.parse(fs.readFileSync(CANDIDATE_PATH, "utf8"));
  const blockerExport = JSON.parse(fs.readFileSync(BLOCKERS_PATH, "utf8"));
  const matrixRowCount =
    fs
      .readFileSync(MATRIX_PATH, "utf8")
      .trim()
      .split("\n").length - 1;

  const candidate = candidateExport.releaseCandidateTuple;
  const ringSummaries = candidateExport.environmentCompatibilitySummaries;
  const ciPreviewRing = ringSummaries.find((ring) => ring.environmentRing === "ci-preview");
  const localRing = ringSummaries.find((ring) => ring.environmentRing === "local");
  const ciPreviewBlocker = blockerExport.blockers.find(
    (blocker) => blocker.blockerId === "FZB_131_CI_PREVIEW_RUNTIME_PUBLICATION_AND_PARITY",
  );

  assertCondition(candidate, "Expected a release candidate tuple.");
  assertCondition(ciPreviewRing, "Expected a ci-preview ring summary.");
  assertCondition(localRing, "Expected a local ring summary.");
  assertCondition(ciPreviewBlocker, "Expected the ci-preview runtime/parity blocker.");

  return {
    candidate,
    ringSummaries,
    blockerCount: blockerExport.blockers.length,
    matrixRowCount,
    ciPreviewRing,
    localRing,
    ciPreviewBlocker,
  };
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Release candidate freeze board HTML is missing.");
  const expected = getExpected();

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1540, height: 1220 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='tuple-braid']").waitFor();
    await page.locator("[data-testid='ring-ladder']").waitFor();
    await page.locator("[data-testid='blocker-matrix']").waitFor();
    await page.locator("[data-testid='compatibility-table']").waitFor();
    await page.locator("[data-testid='evidence-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    assertCondition(
      (await page.locator("[data-testid='candidate-verdict-badge']").innerText()).trim() === "Exact",
      "Candidate verdict badge must render the exact tuple state.",
    );
    assertCondition(
      (await page.locator("[data-testid='summary-release-ref']").innerText()).trim() ===
        expected.candidate.releaseRef,
      "Release summary drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='ring-row-']").count()) === expected.ringSummaries.length,
      "Ring ladder count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='blocker-matrix'] tbody tr").count()) === expected.blockerCount,
      "Blocker matrix count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='compatibility-table'] tbody tr").count()) === 8,
      "Candidate view should default to the eight local compatibility rows.",
    );

    await page.locator("[data-testid='ring-row-ci-preview']").click();
    const inspectorAfterRing = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorAfterRing.includes("ci-preview") && inspectorAfterRing.includes("blocked"),
      "Ring selection did not synchronize the inspector.",
    );
    assertCondition(
      (await page.locator("[data-testid='compatibility-table'] tbody tr").count()) === 8,
      "Ring selection must keep one row per compatibility dimension.",
    );
    assertCondition(
      (await page.locator("[data-testid='ring-table-row-ci-preview']").getAttribute("data-selected")) ===
        "true",
      "Ring table did not synchronize selection.",
    );

    await page.locator(`[data-testid='blocker-row-${expected.ciPreviewBlocker.blockerId}']`).click();
    const inspectorAfterBlocker = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorAfterBlocker.includes(expected.ciPreviewBlocker.blockerId) &&
        inspectorAfterBlocker.includes("Runtime publication and parity"),
      "Blocker selection did not synchronize the inspector.",
    );
    assertCondition(
      (await page.locator("[data-testid='ring-table-row-ci-preview']").getAttribute("data-selected")) ===
        "true",
      "Selecting a blocker must keep the owning ring visible in the ladder and table.",
    );
    const evidenceText = await page.locator("[data-testid='evidence-table']").innerText();
    assertCondition(
      evidenceText.includes("release_publication_parity_records.json"),
      "Evidence table lost the parity source reference for the selected blocker.",
    );

    await page.locator("[data-testid='ring-row-local']").focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page.locator("[data-testid='ring-table-row-ci-preview']").getAttribute("data-selected")) ===
        "true",
      "ArrowDown did not advance selection across the ring ladder.",
    );

    await page.locator("[data-testid='filter-blocker-state']").selectOption("blocked");
    const filteredBlockerCount = await page.locator("[data-testid='blocker-matrix'] tbody tr").count();
    assertCondition(
      filteredBlockerCount < expected.blockerCount && filteredBlockerCount > 0,
      "Blocked-state filter did not narrow the blocker matrix.",
    );
    await page.locator("[data-testid='filter-blocker-state']").selectOption("all");

    assertCondition((await page.locator("nav").count()) === 1, "Navigation landmark is missing.");
    assertCondition((await page.locator("main").count()) === 1, "Main landmark is missing.");
    assertCondition((await page.locator("aside").count()) === 1, "Inspector landmark is missing.");

    const tupleTableCount = await page.locator("[data-testid='tuple-table'] tbody tr").count();
    const ringTableCount = await page.locator("[data-testid='ring-table'] tbody tr").count();
    assertCondition(tupleTableCount === 5, "Tuple table parity drifted.");
    assertCondition(ringTableCount === expected.ringSummaries.length, "Ring table parity drifted.");

    await page.setViewportSize({ width: 960, height: 1080 });
    assertCondition(
      await page.locator("[data-testid='ring-ladder']").isVisible(),
      "Ring ladder disappeared on narrow width.",
    );
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared on narrow width.",
    );
    const widthSafe = await page.evaluate(() => document.documentElement.scrollWidth <= 980);
    assertCondition(widthSafe, "Responsive layout overflowed horizontally.");

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 920 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
      assertCondition(
        (await motionPage.locator("[data-testid='ring-table'] tbody tr").count()) ===
          expected.ringSummaries.length,
        "Reduced-motion rendering changed ring table parity.",
      );
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
