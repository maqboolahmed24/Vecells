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

const ATLAS_PATH = "/docs/frontend/313_phase5_confirmation_and_practice_visibility_atlas.html";

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
    const pathname = requestUrl.pathname === "/" ? ATLAS_PATH : decodeURIComponent(requestUrl.pathname);
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
  await page.locator("[data-testid='Phase5CommitVisibilityAtlas']").waitFor();
  await page.waitForFunction(
    () => Boolean((window as any).__phase5CommitVisibilityAtlasData?.loaded),
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
    const desktopContext = await browser.newContext({ viewport: { width: 1680, height: 1320 } });
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
    const root = page.locator("[data-testid='Phase5CommitVisibilityAtlas']");
    assertCondition(
      (await root.getAttribute("data-visual-mode")) ===
        "Phase5_Commit_Confirmation_Practice_Visibility_Atlas",
      "atlas visual mode drift",
    );
    assertCondition(
      (await root.getAttribute("data-active-state")) === "offer_live",
      "initial state drift",
    );
    assertCondition(
      (await root.getAttribute("data-active-message")) === "message_not_started",
      "initial message drift",
    );

    const stateCount = await page.locator("#state-list .state-button").count();
    assertCondition(stateCount === 5, "atlas should render five truth states");

    await page.locator(".state-button[data-id='confirmed_pending_ack']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5CommitVisibilityAtlas']")
          ?.getAttribute("data-active-state") === "confirmed_pending_ack",
    );
    const summaryText = await page.locator("#active-state-summary").innerText();
    const manageText = await page.locator("[data-testid='ManageCapabilityCard']").innerText();
    const messageTableText = await page.locator("[data-testid='MessageChainTable']").innerText();
    assertCondition(
      summaryText.includes("generation 4"),
      "confirmed-pending-ack summary drift",
    );
    assertCondition(
      manageText.includes("stale / read_only"),
      "confirmed-pending-ack manage posture drift",
    );
    assertCondition(
      messageTableText.includes("Transport accepted only") &&
        messageTableText.includes("Delivered, awaiting practice acknowledgement"),
      "message chain rows drift",
    );

    await page.locator(".message-row-button[data-id='message_delivered_pending_ack']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5CommitVisibilityAtlas']")
          ?.getAttribute("data-active-message") === "message_delivered_pending_ack",
    );
    const messageDetail = await page.locator("[data-testid='MessageDetailCard']").innerText();
    const ladderText = await page.locator("[data-testid='AckGenerationLadder']").innerText();
    assertCondition(
      messageDetail.includes("delivered_pending_ack") &&
        messageDetail.includes("ACK GENERATION"),
      "selected message detail drift",
    );
    assertCondition(
      ladderText.includes("Gen 4") && ladderText.includes("pending_current"),
      "ack ladder linkage drift",
    );

    await page.locator(".state-button[data-id='confirmed_acknowledged']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5CommitVisibilityAtlas']")
          ?.getAttribute("data-active-state") === "confirmed_acknowledged",
    );
    const projectionText = await page.locator("#projection-strip").innerText();
    const acknowledgedManage = await page.locator("[data-testid='ManageCapabilityCard']").innerText();
    assertCondition(
      projectionText.includes("confirmed") && projectionText.includes("acknowledged"),
      "acknowledged projection drift",
    );
    assertCondition(
      acknowledgedManage.includes("live / interactive"),
      "acknowledged manage posture drift",
    );

    await page.locator(".state-button[data-id='stale_tuple_blocked']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5CommitVisibilityAtlas']")
          ?.getAttribute("data-active-state") === "stale_tuple_blocked",
    );
    await page.locator(".message-row-button[data-id='message_new_generation_pending']").click();
    const blockedProjection = await page.locator("#projection-strip").innerText();
    const blockedMessage = await page.locator("[data-testid='MessageDetailCard']").innerText();
    assertCondition(
      blockedProjection.includes("blocked_by_drift") &&
        blockedProjection.includes("linkage_debt"),
      "blocked projection drift",
    );
    assertCondition(
      blockedMessage.includes("ack_pending") && blockedMessage.includes("ACK GENERATION"),
      "new generation message drift",
    );

    await assertNoHorizontalOverflow(page, "313 atlas desktop");
    await page.screenshot({
      path: outputPath("313-commit-visibility-atlas-desktop.png"),
      fullPage: true,
    });

    const ariaSnapshots = {
      Phase5CommitVisibilityAtlas: await captureAria(root, page),
      MessageChainTable: await captureAria(
        page.locator("[data-testid='MessageChainTable']"),
        page,
      ),
      BlockerParityTable: await captureAria(
        page.locator("[data-testid='BlockerParityTable']"),
        page,
      ),
    };
    fs.writeFileSync(
      outputPath("313-commit-visibility-atlas-aria-snapshots.json"),
      `${JSON.stringify(ariaSnapshots, null, 2)}\n`,
    );

    assertCondition(
      externalRequests.size === 0,
      `atlas should not emit external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await desktopContext.tracing.stop({
      path: outputPath("313-commit-visibility-atlas-desktop-trace.zip"),
    });

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    await openAtlas(mobile, atlas.atlasUrl);
    await mobile.locator(".state-button[data-id='confirmed_pending_ack']").click();
    await mobile.locator(".message-row-button[data-id='message_delivered_pending_ack']").click();
    await assertNoHorizontalOverflow(mobile, "313 atlas mobile");
    await mobile.screenshot({
      path: outputPath("313-commit-visibility-atlas-mobile.png"),
      fullPage: true,
    });
    await mobileContext.tracing.stop({
      path: outputPath("313-commit-visibility-atlas-mobile-trace.zip"),
    });
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
