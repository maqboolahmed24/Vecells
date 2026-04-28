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
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

const BOARD_PATH = "/docs/frontend/341_phase5_exit_gate_board.html";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
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
  await page.locator("[data-testid='Phase5ExitGateBoard']").waitFor();
  await page.waitForFunction(
    () =>
      Boolean((window as any).__phase5ExitBoardData?.loaded) &&
      document
        .querySelector("[data-testid='Phase5ExitGateBoard']")
        ?.getAttribute("data-current-verdict") === "go_with_constraints",
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

async function tabUntilFocus(page: any, selector: string, description: string, maxTabs = 80): Promise<void> {
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

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const board = await startBoardServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await desktopContext.newPage();

    const externalRequests = new Set<string>();
    trackExternalRequests(page, new URL(board.boardUrl).origin, externalRequests);

    await openBoard(page, board.boardUrl);

    const root = page.locator("[data-testid='Phase5ExitGateBoard']");
    const verdictStrip = page.locator("[data-testid='Phase5ExitVerdictStrip']");

    assertCondition(
      (await root.getAttribute("data-current-verdict")) === "go_with_constraints",
      "board root should reflect go_with_constraints",
    );
    assertCondition(
      (await root.getAttribute("data-release-class")) === "controlled_phase5_foundation_only",
      "board root should reflect the controlled release class",
    );
    assertCondition(
      (await verdictStrip.getAttribute("data-active-verdict")) === "go_with_constraints",
      "verdict strip should reflect go_with_constraints",
    );

    const boardData = await page.evaluate(() => (window as any).__phase5ExitBoardData);
    assertCondition(boardData?.loaded === true, "board data should be marked loaded");
    assertCondition(boardData?.capabilities?.length === 11, "board data should expose eleven capabilities");
    assertCondition(boardData?.blockers?.length === 4, "board data should expose four blocking defects");
    assertCondition(boardData?.carryForwards?.length === 6, "board data should expose six carry-forward entries");

    const capabilityButtons = page.locator("#capability-list .capability-button");
    assertCondition((await capabilityButtons.count()) === 11, "capability rail should render eleven buttons");

    await page.locator(".capability-button[data-capability-id='CAP341_08']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5ExitGateBoard']")
          ?.getAttribute("data-selected-capability") === "CAP341_08",
    );
    await page.waitForFunction(() => {
      const text = document.querySelector("[data-testid='Phase5BlockerInspector']")?.textContent || "";
      return text.includes("Live partner onboarding remains manual-bridge or review-required for routes and feeds");
    });

    await page.locator("#filter-release-class").getByRole("button", { name: "Approved" }).click();
    await page.waitForFunction(
      () => document.querySelectorAll("#capability-list .capability-button").length === 7,
    );
    assertCondition(
      (await page.locator("#filter-release-class").getByRole("button", { name: "Approved" }).getAttribute("aria-pressed")) ===
        "true",
      "approved release filter should be active",
    );

    await page.locator("#filter-release-class").getByRole("button", { name: "All" }).click();
    await page.waitForFunction(
      () => document.querySelectorAll("#capability-list .capability-button").length === 11,
    );
    await page.locator("#filter-severity").getByRole("button", { name: "Sev3" }).click();
    await page.waitForFunction(
      () => document.querySelectorAll("#capability-list .capability-button").length === 4,
    );

    await page.locator("#filter-severity").getByRole("button", { name: "All" }).click();
    await page.waitForFunction(
      () => document.querySelectorAll("#capability-list .capability-button").length === 11,
    );

    await openBoard(page, board.boardUrl);
    await tabUntilFocus(
      page,
      ".capability-button[data-capability-id='CAP341_09']",
      "CAP341_09 capability button",
    );
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5ExitGateBoard']")
          ?.getAttribute("data-selected-capability") === "CAP341_09",
    );
    await tabUntilFocus(page, "#capability-summary-card tbody a", "capability summary artifact link");

    const ariaSnapshots = {
      capabilityRail: await captureAria(page.locator("[data-testid='Phase5CapabilityRail']"), page),
      evidenceCanvas: await captureAria(page.locator("[data-testid='Phase5EvidenceCanvas']"), page),
      blockerInspector: await captureAria(page.locator("[data-testid='Phase5BlockerInspector']"), page),
    };
    fs.writeFileSync(
      outputPath("341-phase5-exit-board-aria-snapshots.json"),
      `${JSON.stringify(ariaSnapshots, null, 2)}\n`,
    );

    await assertNoHorizontalOverflow(page, "341 exit gate board desktop");
    await page.screenshot({
      path: outputPath("341-phase5-exit-board-desktop.png"),
      fullPage: true,
    });
    await desktopContext.tracing.stop({ path: outputPath("341-phase5-exit-board-trace.zip") });

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    trackExternalRequests(mobile, new URL(board.boardUrl).origin, externalRequests);

    await openBoard(mobile, board.boardUrl);
    assertCondition(
      (await mobile.locator("[data-testid='Phase5ExitGateBoard']").getAttribute("data-reduced-motion")) === "reduce",
      "mobile board should expose reduced-motion posture",
    );
    await assertNoHorizontalOverflow(mobile, "341 exit gate board mobile reduced");
    await mobile.screenshot({
      path: outputPath("341-phase5-exit-board-mobile-reduced.png"),
      fullPage: true,
    });
    await mobileContext.tracing.stop({ path: outputPath("341-phase5-exit-board-mobile-trace.zip") });

    assertCondition(
      externalRequests.size === 0,
      `board should not emit external requests: ${Array.from(externalRequests).join(", ")}`,
    );
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
