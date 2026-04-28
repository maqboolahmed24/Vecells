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

const BOARD_PATH = "/docs/frontend/310_phase4_exit_board.html";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "text/plain; charset=utf-8";
}

async function startBoardServer(): Promise<{ atlasUrl: string; server: http.Server }> {
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

async function stopBoardServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function openBoard(page: any, atlasUrl: string, preview?: "approved" | "go_with_constraints" | "withheld"): Promise<void> {
  const url = new URL(atlasUrl);
  if (preview) {
    url.searchParams.set("previewVerdict", preview);
  }
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.locator("[data-testid='Phase4ExitBoard']").waitFor();
  const expectedVerdict = preview ?? "go_with_constraints";
  await page.waitForFunction(
    (targetVerdict) =>
      document
        .querySelector("[data-testid='Phase4ExitBoard']")
        ?.getAttribute("data-active-verdict") === targetVerdict,
    expectedVerdict,
  );
  await page.waitForFunction(() => Boolean((window as any).__phase4ExitBoardData?.loaded));
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

async function tabUntilFocus(page: any, selector: string, description: string, maxTabs = 18): Promise<void> {
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
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assertCondition(!hasOverflow, `${label} overflowed horizontally`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const board = await startBoardServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
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

    await openBoard(page, board.atlasUrl);
    const root = page.locator("[data-testid='Phase4ExitBoard']");
    assertCondition(
      (await root.getAttribute("data-current-verdict")) === "go_with_constraints",
      "current verdict should remain go_with_constraints",
    );
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Phase4_Booking_Exit_Board",
      "board visual mode should remain Phase4_Booking_Exit_Board",
    );

    const familyCount = await page.locator("#family-list .family-button").count();
    const carryCardCount = await page.locator("[data-testid='CarryForwardBoundaryDiagram'] .map-card").count();
    const carryTableCount = await page.locator("[data-testid='CarryForwardBoundaryTable'] tbody tr").count();
    const freshnessCount = await page.locator("[data-testid='EvidenceFreshnessMatrix'] tbody tr").count();
    assertCondition(familyCount === 10, "board should render ten conformance families");
    assertCondition(carryCardCount === 6, "carry-forward map should render six boundary cards");
    assertCondition(carryCardCount === carryTableCount, "carry-forward visual and table parity should align");
    assertCondition(freshnessCount === 8, "freshness matrix should render eight evidence rows");

    await page.locator(".family-button[data-row-id='PH4_ROW_10']").click();
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("#issue-list .issue-card strong"))
          .map((node) => node.textContent || "")
          .some((value) => value.includes("release safety delta")),
    );

    await assertNoHorizontalOverflow(page, "310 exit board desktop");
    await page.screenshot({
      path: outputPath("310-phase4-exit-board-go-with-constraints.png"),
      fullPage: true,
    });

    await page.locator(".preview-button[data-preview='approved']").click();
    await page.waitForURL(/previewVerdict=approved/);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase4ExitBoard']")
          ?.getAttribute("data-active-verdict") === "approved",
    );
    await page.screenshot({
      path: outputPath("310-phase4-exit-board-approved.png"),
      fullPage: true,
    });

    await page.locator(".preview-button[data-preview='withheld']").click();
    await page.waitForURL(/previewVerdict=withheld/);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase4ExitBoard']")
          ?.getAttribute("data-active-verdict") === "withheld",
    );
    await page.screenshot({
      path: outputPath("310-phase4-exit-board-withheld.png"),
      fullPage: true,
    });

    await openBoard(page, board.atlasUrl);
    await tabUntilFocus(
      page,
      ".preview-button[data-preview='approved']",
      "approved preview control",
    );
    await page.keyboard.press("Enter");
    await page.waitForURL(/previewVerdict=approved/);
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase4ExitBoard']")
          ?.getAttribute("data-active-verdict") === "approved",
    );

    await openBoard(page, board.atlasUrl);
    await tabUntilFocus(
      page,
      ".family-button[data-row-id='PH4_ROW_09']",
      "performance family row",
    );
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("#issue-list .issue-card strong"))
          .map((node) => node.textContent || "")
          .some((value) => value.includes("load probe")),
    );

    const ariaSnapshots = {
      ConformanceLadder: await captureAria(page.locator("[data-testid='ConformanceLadder']"), page),
      CarryForwardBoundaryMap: await captureAria(page.locator("[data-testid='CarryForwardBoundaryMap']"), page),
    };
    fs.writeFileSync(
      outputPath("310-phase4-exit-board-aria-snapshots.json"),
      `${JSON.stringify(ariaSnapshots, null, 2)}\n`,
    );

    assertCondition(
      externalRequests.size === 0,
      `board should not emit external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await desktopContext.tracing.stop({ path: outputPath("310-phase4-exit-board-trace.zip") });

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    await openBoard(mobile, board.atlasUrl, "withheld");
    assertCondition(
      (await mobile.locator("[data-testid='Phase4ExitBoard']").getAttribute("data-reduced-motion")) === "reduce",
      "reduced motion posture should be reflected on the board root",
    );
    await assertNoHorizontalOverflow(mobile, "310 exit board mobile reduced");
    await mobile.screenshot({
      path: outputPath("310-phase4-exit-board-mobile-reduced.png"),
      fullPage: true,
    });
    await mobileContext.tracing.stop({ path: outputPath("310-phase4-exit-board-mobile-trace.zip") });
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
