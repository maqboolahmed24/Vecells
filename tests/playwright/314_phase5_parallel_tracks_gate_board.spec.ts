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

const BOARD_PATH = "/docs/frontend/314_phase5_parallel_tracks_gate_board.html";

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
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function openBoard(page: any, boardUrl: string): Promise<void> {
  await page.goto(boardUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Phase5ParallelGateBoard']").waitFor();
  await page.waitForFunction(() => Boolean((window as any).__phase5ParallelGateData?.loaded));
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

async function tabUntilFocus(page: any, selector: string, description: string, maxTabs = 30): Promise<void> {
  for (let step = 0; step < maxTabs; step += 1) {
    await page.keyboard.press("Tab");
    const matched = await page.evaluate((targetSelector) => {
      const active = document.activeElement;
      return active instanceof Element ? active.matches(targetSelector) : false;
    }, selector);
    if (matched) return;
  }
  throw new Error(`keyboard flow did not reach ${description}`);
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

  const board = await startBoardServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1680, height: 1280 } });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await desktopContext.newPage();

    const externalRequests = new Set<string>();
    const baseOrigin = new URL(board.boardUrl).origin;
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

    await openBoard(page, board.boardUrl);
    const root = page.locator("[data-testid='Phase5ParallelGateBoard']");
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Phase5_Parallel_Tracks_Gate_Board",
      "board visual mode drift",
    );
    assertCondition(
      (await root.getAttribute("data-active-track")) === "par_315",
      "initial active track drift",
    );
    assertCondition((await root.getAttribute("data-ready-count")) === "3", "ready count drift");
    assertCondition((await root.getAttribute("data-blocked-count")) === "21", "blocked count drift");
    assertCondition((await root.getAttribute("data-deferred-count")) === "2", "deferred count drift");

    const initialListCount = await page.locator("#track-list .track-button").count();
    const initialGraphCount = await page.locator("#graph-grid .graph-card-button").count();
    const initialTableCount = await page.locator("[data-testid='TrackParityTable'] tbody tr").count();
    assertCondition(initialListCount === 26, "board should render twenty-six track buttons initially");
    assertCondition(initialGraphCount === 26, "board should render twenty-six graph cards initially");
    assertCondition(initialTableCount === 26, "board should render twenty-six parity rows initially");

    await page.locator(".filter-button[data-filter-group='readiness'][data-value='blocked']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5ParallelGateBoard']")
          ?.getAttribute("data-filter-readiness") === "blocked",
    );
    const blockedListCount = await page.locator("#track-list .track-button").count();
    const blockedGraphCount = await page.locator("#graph-grid .graph-card-button").count();
    const blockedTableCount = await page.locator("[data-testid='TrackParityTable'] tbody tr").count();
    assertCondition(blockedListCount === 21, "blocked filter should show twenty-one track buttons");
    assertCondition(
      blockedGraphCount === blockedTableCount && blockedGraphCount === 21,
      "blocked filter graph/list parity drift",
    );

    await page.locator(".filter-button[data-filter-group='domain'][data-value='frontend']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5ParallelGateBoard']")
          ?.getAttribute("data-filter-domain") === "frontend",
    );
    const frontendGraphCount = await page.locator("#graph-grid .graph-card-button").count();
    const frontendTableCount = await page.locator("[data-testid='TrackParityTable'] tbody tr").count();
    assertCondition(
      frontendGraphCount === 9 && frontendGraphCount === frontendTableCount,
      "frontend blocked filter parity drift",
    );

    await page.locator(".graph-card-button[data-id='par_329']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5ParallelGateBoard']")
          ?.getAttribute("data-active-track") === "par_329",
    );
    const inspectorTitle = await page.locator("#inspector-title").innerText();
    assertCondition(
      inspectorTitle.includes("par_329") && inspectorTitle.includes("Cross-org commit"),
      "inspector should sync to graph-card selection",
    );
    assertCondition(
      (await page.locator("#track-list .track-button[data-id='par_329']").getAttribute("data-active")) ===
        "true",
      "list state should sync to graph-card selection",
    );

    await openBoard(page, board.boardUrl);
    await tabUntilFocus(
      page,
      ".filter-button[data-filter-group='readiness'][data-value='all']",
      "all readiness filter",
    );
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5ParallelGateBoard']")
          ?.getAttribute("data-filter-readiness") === "ready",
    );
    const readyGraphCount = await page.locator("#graph-grid .graph-card-button").count();
    assertCondition(readyGraphCount === 3, "ready keyboard filter should show three graph cards");

    await tabUntilFocus(page, ".track-button[data-id='par_315']", "ready track list");
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5ParallelGateBoard']")
          ?.getAttribute("data-active-track") === "par_316",
    );
    assertCondition(
      (await page.locator("#track-list .track-button[data-id='par_316']").getAttribute("data-active")) ===
        "true",
      "keyboard navigation should activate the next ready track",
    );

    await assertNoHorizontalOverflow(page, "314 board desktop");
    await page.screenshot({
      path: outputPath("314-phase5-parallel-gate-board-desktop.png"),
      fullPage: true,
    });

    const ariaSnapshots = {
      Phase5ParallelGateBoard: await captureAria(root, page),
      TrackParityTable: await captureAria(page.locator("[data-testid='TrackParityTable']"), page),
    };
    fs.writeFileSync(
      outputPath("314-phase5-parallel-gate-board-aria-snapshots.json"),
      `${JSON.stringify(ariaSnapshots, null, 2)}\n`,
    );

    assertCondition(
      externalRequests.size === 0,
      `board should not emit external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await desktopContext.tracing.stop({
      path: outputPath("314-phase5-parallel-gate-board-trace.zip"),
    });

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    await openBoard(mobile, board.boardUrl);
    assertCondition(
      (await mobile.locator("[data-testid='Phase5ParallelGateBoard']").getAttribute("data-reduced-motion")) ===
        "reduce",
      "reduced motion posture should be reflected on the board root",
    );
    await mobile.locator(".filter-button[data-filter-group='readiness'][data-value='deferred']").click();
    await mobile.locator(".filter-button[data-filter-group='domain'][data-value='ops']").click();
    await mobile.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5ParallelGateBoard']")
          ?.getAttribute("data-filtered-count") === "2",
    );
    await assertNoHorizontalOverflow(mobile, "314 board mobile reduced");
    await mobile.screenshot({
      path: outputPath("314-phase5-parallel-gate-board-mobile-reduced.png"),
      fullPage: true,
    });
    await mobileContext.tracing.stop({
      path: outputPath("314-phase5-parallel-gate-board-mobile-trace.zip"),
    });
  } finally {
    await browser.close();
    await stopBoardServer(board.server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
