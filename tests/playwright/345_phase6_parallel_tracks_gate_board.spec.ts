import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import {
  ROOT,
  allocatePort,
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
} from "./255_workspace_shell_helpers";

const BOARD_PATH = "/docs/frontend/345_phase6_parallel_tracks_gate_board.html";

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
  await page.locator("[data-testid='Phase6ParallelGateBoard']").waitFor();
  await page.waitForFunction(() => Boolean((window as any).__phase6ParallelGateData?.loaded));
}

async function tabUntilFocus(page: any, selector: string, description: string, maxTabs = 32): Promise<void> {
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
    const root = page.locator("[data-testid='Phase6ParallelGateBoard']");

    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Phase6_Parallel_Tracks_Gate_Board",
      "visual mode drift",
    );
    assertCondition((await root.getAttribute("data-active-track")) === "par_346", "initial track drift");
    assertCondition((await root.getAttribute("data-ready-count")) === "2", "ready count drift");
    assertCondition((await root.getAttribute("data-blocked-count")) === "22", "blocked count drift");
    assertCondition((await root.getAttribute("data-deferred-count")) === "2", "deferred count drift");

    assertCondition((await page.locator("#track-list .track-button").count()) === 26, "track rail count drift");
    assertCondition((await page.locator("#graph-grid .graph-card-button").count()) === 26, "graph count drift");
    assertCondition(
      (await page.locator("[data-testid='Phase6TrackParityTable'] tbody tr").count()) === 26,
      "track parity count drift",
    );

    await page.selectOption("select[name='status']", "blocked");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase6ParallelGateBoard']")
          ?.getAttribute("data-filter-status") === "blocked",
    );
    assertCondition((await page.locator("#track-list .track-button").count()) === 22, "blocked filter list count drift");
    assertCondition((await page.locator("#graph-grid .graph-card-button").count()) === 22, "blocked filter graph count drift");
    assertCondition(
      (await page.locator("[data-testid='Phase6TrackParityTable'] tbody tr").count()) === 22,
      "blocked filter parity count drift",
    );

    await page.selectOption("select[name='owner']", "par_356");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase6ParallelGateBoard']")
          ?.getAttribute("data-filter-owner") === "par_356",
    );
    assertCondition((await page.locator("#track-list .track-button").count()) === 1, "owner filter count drift");
    assertCondition((await root.getAttribute("data-active-track")) === "par_356", "owner filter active track drift");

    await page.selectOption("select[name='status']", "all");
    await page.selectOption("select[name='owner']", "all");
    await page.selectOption("select[name='audienceFamily']", "patient");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase6ParallelGateBoard']")
          ?.getAttribute("data-filter-audience-family") === "patient",
    );
    const patientListCount = await page.locator("#track-list .track-button").count();
    const patientGraphCount = await page.locator("#graph-grid .graph-card-button").count();
    const patientTableCount = await page.locator("[data-testid='Phase6TrackParityTable'] tbody tr").count();
    assertCondition(
      patientListCount === patientGraphCount && patientGraphCount === patientTableCount && patientListCount >= 6,
      "patient audience parity drift",
    );

    await page.selectOption("select[name='audienceFamily']", "all");
    await page.locator(".graph-card-button[data-id='seq_367']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase6ParallelGateBoard']")
          ?.getAttribute("data-active-track") === "seq_367",
    );
    assertCondition(
      (await page.locator("#inspector-title").innerText()).includes("seq_367"),
      "inspector should sync to graph selection",
    );
    assertCondition(
      (await page.locator("[data-testid='Phase6GapTable'] tbody tr").count()) >= 2,
      "deferred environment track should expose gap rows",
    );

    await page.locator(".parity-track-button[data-id='par_347']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase6ParallelGateBoard']")
          ?.getAttribute("data-active-track") === "par_347",
    );
    assertCondition(
      (await page.locator("#inspector-body").innerText()).includes("Launch packet"),
      "ready track inspector should expose launch packet block",
    );

    await openBoard(page, board.boardUrl);
    await tabUntilFocus(page, ".track-button[data-id='par_346']", "track rail");
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase6ParallelGateBoard']")
          ?.getAttribute("data-active-track") === "par_347",
    );
    assertCondition(
      (await page.locator(".track-button[data-id='par_347']").getAttribute("data-active")) === "true",
      "keyboard navigation should activate next track",
    );

    await assertNoHorizontalOverflow(page, "345 board desktop");
    await page.screenshot({ path: outputPath("345_phase6_parallel_tracks_gate_board.desktop.png"), fullPage: true });

    await desktopContext.tracing.stop({ path: outputPath("345_phase6_parallel_tracks_gate_board.trace.zip") });
    await desktopContext.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 1180, height: 1180 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openBoard(reducedPage, board.boardUrl);
    const reducedRoot = reducedPage.locator("[data-testid='Phase6ParallelGateBoard']");
    assertCondition(
      (await reducedRoot.getAttribute("data-reduced-motion")) === "true",
      "reduced motion attribute drift",
    );
    await assertNoHorizontalOverflow(reducedPage, "345 board reduced motion");
    await reducedPage.screenshot({ path: outputPath("345_phase6_parallel_tracks_gate_board.reduced.png"), fullPage: true });
    await reducedContext.close();

    assertCondition(externalRequests.size === 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);
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
