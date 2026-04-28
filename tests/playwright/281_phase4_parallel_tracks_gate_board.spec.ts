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

const BOARD_PATH = "/docs/frontend/281_phase4_parallel_tracks_gate_board.html";
const REGISTRY_PATH = path.join(ROOT, "data", "contracts", "281_phase4_track_readiness_registry.json");

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return "text/yaml; charset=utf-8";
  return "text/plain; charset=utf-8";
}

async function startBoardServer(): Promise<{ boardUrl: string; server: http.Server }> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? BOARD_PATH : decodeURIComponent(requestUrl.pathname);
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
    boardUrl: `http://127.0.0.1:${port}${BOARD_PATH}`,
    server,
  };
}

async function stopBoardServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

async function openBoard(page: any, boardUrl: string): Promise<void> {
  await page.goto(boardUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Phase4ParallelGateBoard']").waitFor();
  await page.locator("[data-testid='TrackButton-par_282']").waitFor();
  await page.locator("[data-testid='ReadinessMatrixTable']").waitFor();
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
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assertCondition(!hasOverflow, `${label} overflowed horizontally`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  const board = await startBoardServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1280 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    const baseOrigin = new URL(board.boardUrl).origin;
    const externalRequests = new Set<string>();
    page.on("request", (request: any) => {
      const url = request.url();
      if (!url.startsWith(baseOrigin) && !url.startsWith("data:") && !url.startsWith("about:")) {
        externalRequests.add(url);
      }
    });

    await openBoard(page, board.boardUrl);

    const root = page.locator("[data-testid='Phase4ParallelGateBoard']");
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Phase4_Parallel_Gate_Board",
      "board visual mode drifted",
    );
    assertCondition(
      (await root.getAttribute("data-active-track")) === "par_282",
      "default active track drifted",
    );

    const boardPayload = await page.evaluate(() => {
      const script = document.querySelector("#atlas-data");
      if (!(script instanceof HTMLScriptElement) || !script.textContent) {
        throw new Error("atlas data script missing");
      }
      const decoder = document.createElement("textarea");
      decoder.innerHTML = script.textContent;
      return JSON.parse(decoder.value);
    });

    assertCondition(
      boardPayload.tracks.length === registry.trackCount,
      "board track count must match readiness registry",
    );
    assertCondition(
      boardPayload.firstWaveTrackIds.join("|") === registry.firstWaveTrackIds.join("|"),
      "board first-wave tracks drifted",
    );
    assertCondition(
      boardPayload.summaryBands.length === 4,
      "summary band count drifted",
    );

    const summaryCounts = await page.locator("[data-testid='GateSummaryStrip'] .summary-band").count();
    assertCondition(summaryCounts === 4, "summary strip must render four status bands");

    const dependencyNodeCount = await page.locator("[id='dependency-lattice'] [data-testid^='DependencyNode-']").count();
    const dependencyRowCount = await page.locator("[data-testid='DependencyLatticeTable'] tbody tr").count();
    assertCondition(dependencyNodeCount === dependencyRowCount, "dependency graph and table parity drifted");

    const chainCardCount = await page.locator("[data-testid^='InvalidationChain-']").count();
    const chainRowCount = await page.locator("[data-testid='InvalidationBraidTable'] tbody tr").count();
    assertCondition(chainCardCount === chainRowCount, "invalidation braid and table parity drifted");

    await page.locator("[data-testid='DependencyNode-par_283']").click();
    assertCondition(
      (await root.getAttribute("data-active-track")) === "par_283",
      "dependency node selection did not sync root state",
    );
    assertCondition(
      ((await page.locator("[data-testid='InspectorTrackTitle']").textContent()) || "").includes("par_283"),
      "inspector did not sync to par_283",
    );
    assertCondition(
      (await page.locator("[data-testid='ReadinessRow-par_283']").getAttribute("data-active")) === "true",
      "readiness row did not sync to par_283",
    );

    await page.screenshot({
      path: outputPath("281-phase4-parallel-gate-ready.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='StatusFilter']").selectOption("blocked");
    assertCondition(
      (await root.getAttribute("data-filter-status")) === "blocked",
      "status filter did not sync root state",
    );
    const blockedButtons = await page.locator("[data-testid^='TrackButton-']").count();
    assertCondition(blockedButtons === registry.statusCounts.blocked, "blocked filter count drifted");
    assertCondition(
      (await root.getAttribute("data-active-track")) === "par_284",
      "blocked filter should auto-select first visible blocked track",
    );
    assertCondition(
      ((await page.locator("[data-testid='InspectorReason']").textContent()) || "").includes("BookingCase"),
      "blocked inspector reason did not render the exact blocker explanation",
    );

    await page.locator("[data-testid='OwnerFilter']").selectOption("waitlist_runtime");
    const waitlistButtons = await page.locator("[data-testid^='TrackButton-']").count();
    assertCondition(waitlistButtons === 1, "owner filter should collapse to one waitlist track");
    assertCondition(
      (await root.getAttribute("data-active-track")) === "par_290",
      "owner filter should select par_290",
    );

    await page.locator("[data-testid='OwnerFilter']").selectOption("all");
    await page.locator("[data-testid='ChainFilter']").selectOption("IC_281_WAITLIST_FALLBACK_TYPED");
    const waitlistChainButtons = await page.locator("[data-testid^='TrackButton-']").evaluateAll((nodes: Element[]) =>
      nodes.map((node) => node.getAttribute("data-testid") || ""),
    );
    const expectedWaitlistTracks = [
      "TrackButton-par_290",
      "TrackButton-par_291",
      "TrackButton-par_298",
      "TrackButton-par_299",
      "TrackButton-par_301",
    ];
    assertCondition(
      expectedWaitlistTracks.every((trackId) => waitlistChainButtons.includes(trackId)),
      "chain filter did not keep the waitlist and fallback family together",
    );

    await page.screenshot({
      path: outputPath("281-phase4-parallel-gate-blocked.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='StatusFilter']").selectOption("all");
    await page.locator("[data-testid='ChainFilter']").selectOption("all");
    await page.locator("#TrackButton-par_282").focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assertCondition(
      (await root.getAttribute("data-active-track")) === "par_283",
      "keyboard rail navigation did not select par_283",
    );

    await assertNoHorizontalOverflow(page, "desktop board");

    const accessibility = await captureAria(root, page);
    fs.writeFileSync(
      outputPath("281-phase4-parallel-gate-aria-snapshots.json"),
      JSON.stringify(accessibility, null, 2),
      "utf-8",
    );

    await context.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 430, height: 1100 },
      reducedMotion: "reduce",
      colorScheme: "light",
    });
    const reducedPage = await reducedContext.newPage();
    await openBoard(reducedPage, board.boardUrl);
    assertCondition(
      (await reducedPage.locator("[data-testid='Phase4ParallelGateBoard']").getAttribute("data-reduced-motion")) ===
        "true",
      "reduced-motion root flag drifted",
    );
    await reducedPage.locator("[data-testid='StatusFilter']").selectOption("deferred");
    assertCondition(
      (await reducedPage.locator("[data-testid='Phase4ParallelGateBoard']").getAttribute("data-active-track")) ===
        "par_302",
      "deferred filter should auto-select first deferred track",
    );
    await assertNoHorizontalOverflow(reducedPage, "mobile reduced board");
    await reducedPage.screenshot({
      path: outputPath("281-phase4-parallel-gate-mobile-reduced.png"),
      fullPage: true,
    });
    await reducedContext.close();

    assertCondition(
      externalRequests.size === 0,
      `board should not fetch external resources: ${[...externalRequests].join(", ")}`,
    );
  } finally {
    await browser.close();
    await stopBoardServer(board.server);
  }
}

if (import.meta.main) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
