import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import {
  ROOT,
  allocatePort,
  assertCondition,
  importPlaywright,
  outputPath,
} from "./255_workspace_shell_helpers";

const ATLAS_PATH = "/docs/frontend/312_phase5_policy_tuple_and_capacity_atlas.html";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "text/plain; charset=utf-8";
}

async function startAtlasServer(): Promise<{ atlasUrl: string; server: http.Server }> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname =
      requestUrl.pathname === "/" ? ATLAS_PATH : decodeURIComponent(requestUrl.pathname);
    const filePath = path.join(ROOT, pathname);

    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("not found");
      return;
    }

    response.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    atlasUrl: `http://127.0.0.1:${port}${ATLAS_PATH}`,
    server,
  };
}

async function stopAtlasServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function openAtlas(page: any, atlasUrl: string): Promise<void> {
  await page.goto(atlasUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Phase5PolicyCapacityAtlas']").waitFor();
  await page.waitForFunction(() => Boolean((window as any).__phase5PolicyCapacityAtlasData?.loaded));
}

async function captureAria(locator: any, page: any): Promise<unknown> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "accessibility snapshot missing");
  return snapshot;
}

async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  assertCondition(!hasOverflow, `${label} overflowed horizontally`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const atlas = await startAtlasServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1660, height: 1320 } });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await desktopContext.newPage();

    const externalRequests = new Set<string>();
    const baseOrigin = new URL(atlas.atlasUrl).origin;
    page.on("request", (request: any) => {
      const requestUrl = request.url();
      if (
        !requestUrl.startsWith(baseOrigin) &&
        !requestUrl.startsWith("data:") &&
        !requestUrl.startsWith("about:")
      ) {
        externalRequests.add(requestUrl);
      }
    });

    await openAtlas(page, atlas.atlasUrl);
    const root = page.locator("[data-testid='Phase5PolicyCapacityAtlas']");
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Phase5_Policy_Tuple_And_Capacity_Atlas",
      "atlas visual mode drift",
    );
    assertCondition(
      (await root.getAttribute("data-active-family")) === "routing",
      "initial active family drift",
    );
    assertCondition(
      (await root.getAttribute("data-active-candidate")) === "candidate_trusted_required_001",
      "initial active candidate drift",
    );

    const familyCount = await page.locator("#family-list .family-button").count();
    const candidateCount = await page.locator("#candidate-list .candidate-button").count();
    assertCondition(familyCount === 5, "atlas should render five policy families");
    assertCondition(candidateCount === 5, "atlas should render five candidate buttons");

    await page.locator(".family-button[data-id='service_obligation']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5PolicyCapacityAtlas']")
          ?.getAttribute("data-active-family") === "service_obligation",
    );
    const familySummary = await page.locator("#family-summary").innerText();
    const formulaText = await page.locator("#family-formulas").innerText();
    const effectsText = await page.locator("#family-effects").innerText();
    assertCondition(
      familySummary.includes("minutes-per-1,000"),
      "service obligation summary drift",
    );
    assertCondition(
      formulaText.includes("No ranking formula ownership"),
      "service obligation should not own ranking formulas",
    );
    assertCondition(
      effectsText.includes("May create ledgers or exception records only"),
      "service obligation blocked effects drift",
    );

    await page.locator(".family-button[data-id='capacity_ingestion']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5PolicyCapacityAtlas']")
          ?.getAttribute("data-active-family") === "capacity_ingestion",
    );
    const capacityFormulaText = await page.locator("#family-formulas").innerText();
    assertCondition(
      capacityFormulaText.includes("u_fresh(c,s)") &&
        capacityFormulaText.includes("uncertaintyRadius(c,s)") &&
        capacityFormulaText.includes("robustFit(c,s)"),
      "capacity-ingestion formula linkage drift",
    );

    await page.locator(".candidate-button[data-id='candidate_quarantined_required_004']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5PolicyCapacityAtlas']")
          ?.getAttribute("data-active-candidate") === "candidate_quarantined_required_004",
    );
    const candidateSummary = await page.locator("#candidate-summary").innerText();
    const metricsText = await page.locator("#candidate-metrics").innerText();
    const reasonText = await page.locator("#candidate-reasons").innerText();
    const trustPosture = await page.locator("#candidate-trust-posture").innerText();
    assertCondition(candidateSummary.includes("Southbank Outreach"), "candidate summary drift");
    assertCondition(
      metricsText.includes("diagnostic_only") && metricsText.includes("0.39"),
      "quarantined candidate metrics drift",
    );
    assertCondition(
      reasonText.includes("quarantined_source=true"),
      "quarantined candidate reason drift",
    );
    assertCondition(
      trustPosture.includes("Patient-offerable frontier: no") &&
        trustPosture.includes("quarantined_source_excluded_from_frontier"),
      "quarantined trust posture drift",
    );

    await page.locator(".candidate-row-button[data-id='candidate_trusted_variance_003']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5PolicyCapacityAtlas']")
          ?.getAttribute("data-active-candidate") === "candidate_trusted_variance_003",
    );
    const varianceMetrics = await page.locator("#candidate-metrics").innerText();
    assertCondition(
      varianceMetrics.includes("patient_offerable") &&
        varianceMetrics.includes("0.76"),
      "trusted variance candidate metrics drift",
    );

    await assertNoHorizontalOverflow(page, "312 atlas desktop");
    await page.screenshot({ path: outputPath("312-policy-capacity-atlas-desktop.png"), fullPage: true });

    const ariaSnapshots = {
      Phase5PolicyCapacityAtlas: await captureAria(root, page),
      CandidateTable: await captureAria(page.locator("[data-testid='CandidateTable']"), page),
      FormulaParityTable: await captureAria(
        page.locator("[data-testid='FormulaParityTable']"),
        page,
      ),
    };
    fs.writeFileSync(
      outputPath("312-policy-capacity-atlas-aria-snapshots.json"),
      `${JSON.stringify(ariaSnapshots, null, 2)}\n`,
    );

    assertCondition(
      externalRequests.size === 0,
      `atlas should not emit external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await desktopContext.tracing.stop({ path: outputPath("312-policy-capacity-atlas-trace.zip") });

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    await openAtlas(mobile, atlas.atlasUrl);
    await mobile.locator(".family-button[data-id='practice_visibility']").click();
    await mobile.locator(".candidate-button[data-id='candidate_degraded_required_002']").click();
    await assertNoHorizontalOverflow(mobile, "312 atlas mobile");
    await mobile.screenshot({ path: outputPath("312-policy-capacity-atlas-mobile.png"), fullPage: true });
    await mobileContext.tracing.stop({ path: outputPath("312-policy-capacity-atlas-mobile-trace.zip") });
  } finally {
    await browser.close();
    await stopAtlasServer(atlas.server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
