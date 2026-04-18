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

const BOARD_PATH = "/docs/frontend/277_phase3_exit_board.html";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "text/plain; charset=utf-8";
}

async function startExitBoardServer(): Promise<{ atlasUrl: string; server: http.Server }> {
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
    atlasUrl: `http://127.0.0.1:${port}${BOARD_PATH}`,
    server,
  };
}

async function stopExitBoardServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function openExitBoard(page: any, atlasUrl: string, previewVerdict?: "approved" | "go_with_constraints" | "withheld"): Promise<void> {
  const url = new URL(atlasUrl);
  if (previewVerdict) {
    url.searchParams.set("previewVerdict", previewVerdict);
  }
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.locator("[data-testid='Phase3ExitBoard']").waitFor();
  const expectedVerdict = previewVerdict ?? "go_with_constraints";
  await page.waitForFunction(
    (targetVerdict) =>
      document
        .querySelector("[data-testid='Phase3ExitBoard']")
        ?.getAttribute("data-active-verdict") === targetVerdict,
    expectedVerdict,
  );
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

async function tabUntilFocus(page: any, selector: string, description: string, maxTabs = 16): Promise<void> {
  for (let step = 0; step < maxTabs; step += 1) {
    await page.keyboard.press("Tab");
    const matched = await page.evaluate((targetSelector) => {
      const active = document.activeElement;
      return active instanceof Element ? active.matches(targetSelector) : false;
    }, selector);
    if (matched) {
      return;
    }
  }
  throw new Error(`keyboard flow did not reach ${description}`);
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

  const board = await startExitBoardServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1500, height: 1080 } });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await desktopContext.newPage();

    const externalRequests = new Set<string>();
    const baseOrigin = new URL(board.atlasUrl).origin;
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

    await openExitBoard(page, board.atlasUrl);
    const root = page.locator("[data-testid='Phase3ExitBoard']");
    await root.waitFor();

    assertCondition(
      (await root.getAttribute("data-current-verdict")) === "go_with_constraints",
      "current repository verdict should remain go_with_constraints",
    );
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Human_Checkpoint_Exit_Board",
      "board visual mode should remain Human_Checkpoint_Exit_Board",
    );

    const phaseNodeCount = await page.locator("[data-testid='PhaseBraidDiagram'] .phase-node").count();
    const phaseTableRowCount = await page.locator("[data-testid='PhaseBraidTable'] tbody tr").count();
    assertCondition(phaseNodeCount === 8, "phase braid should expose eight phase nodes");
    assertCondition(phaseNodeCount === phaseTableRowCount, "phase braid diagram and table should stay aligned");

    const scorecardRowCount = await page.locator("[data-testid='ConformanceLadder'] .scorecard-row").count();
    const boundaryCardCount = await page.locator("[data-testid='CarryForwardBoundaryDiagram'] .boundary-card").count();
    const boundaryTableRowCount = await page.locator("[data-testid='CarryForwardBoundaryTable'] tbody tr").count();
    assertCondition(scorecardRowCount === 12, "scorecard should render twelve conformance rows");
    assertCondition(boundaryCardCount === 3, "carry-forward map should stay grouped into three boundary cards");
    assertCondition(boundaryTableRowCount === 10, "carry-forward table should render ten structured open items");

    await assertNoHorizontalOverflow(page, "277 exit board desktop");
    await page.screenshot({
      path: outputPath("277-phase3-exit-board-go-with-constraints.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='VerdictScenarioControls'] .preview-button[data-preview='approved']").click();
    await page.waitForURL(/previewVerdict=approved/);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase3ExitBoard']")
          ?.getAttribute("data-active-verdict") === "approved",
    );
    await page.screenshot({
      path: outputPath("277-phase3-exit-board-approved.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='VerdictScenarioControls'] .preview-button[data-preview='withheld']").click();
    await page.waitForURL(/previewVerdict=withheld/);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase3ExitBoard']")
          ?.getAttribute("data-active-verdict") === "withheld",
    );
    await page.screenshot({
      path: outputPath("277-phase3-exit-board-withheld.png"),
      fullPage: true,
    });

    await openExitBoard(page, board.atlasUrl);
    await tabUntilFocus(
      page,
      "[data-testid='VerdictScenarioControls'] .preview-button[data-preview='approved']",
      "approved preview control",
    );
    await page.keyboard.press("Enter");
    await page.waitForURL(/previewVerdict=approved/);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase3ExitBoard']")
          ?.getAttribute("data-active-verdict") === "approved",
    );

    const ariaSnapshots = {
      ConformanceLadder: await captureAria(page.locator("[data-testid='ConformanceLadder']"), page),
      CarryForwardBoundaryMap: await captureAria(page.locator("[data-testid='CarryForwardBoundaryMap']"), page),
    };
    fs.writeFileSync(
      outputPath("277-phase3-exit-board-aria-snapshots.json"),
      `${JSON.stringify(ariaSnapshots, null, 2)}\n`,
    );

    assertCondition(externalRequests.size === 0, `board should not emit external requests: ${Array.from(externalRequests).join(", ")}`);
    await desktopContext.tracing.stop({ path: outputPath("277-phase3-exit-board-trace.zip") });

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    await openExitBoard(mobile, board.atlasUrl, "withheld");
    assertCondition(
      (await mobile.locator("[data-testid='Phase3ExitBoard']").getAttribute("data-reduced-motion")) === "reduce",
      "reduced motion posture should be reflected on the board root",
    );
    await assertNoHorizontalOverflow(mobile, "277 exit board mobile reduced");
    await mobile.screenshot({
      path: outputPath("277-phase3-exit-board-mobile-reduced.png"),
      fullPage: true,
    });
    await mobileContext.tracing.stop({ path: outputPath("277-phase3-exit-board-mobile-trace.zip") });
  } finally {
    await browser.close();
    await stopExitBoardServer(board.server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
