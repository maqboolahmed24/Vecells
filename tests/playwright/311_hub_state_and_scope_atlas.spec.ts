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

const ATLAS_PATH = "/docs/frontend/311_phase5_hub_state_and_scope_atlas.html";

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
  await page.locator("[data-testid='Phase5HubAtlas']").waitFor();
  await page.waitForFunction(() => Boolean((window as any).__phase5HubAtlasData?.loaded));
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
    const desktopContext = await browser.newContext({ viewport: { width: 1600, height: 1300 } });
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
    const root = page.locator("[data-testid='Phase5HubAtlas']");
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Phase5_Hub_State_And_Scope_Atlas",
      "atlas visual mode drift",
    );
    assertCondition(
      (await root.getAttribute("data-active-state")) === "hub_requested",
      "initial state drift",
    );
    assertCondition(
      (await root.getAttribute("data-active-tier")) === "origin_practice_visibility",
      "initial audience tier drift",
    );

    const stateCount = await page.locator("#state-list .state-button").count();
    const audienceCount = await page.locator("#audience-list .audience-button").count();
    const routeRowCount = await page.locator("[data-testid='RouteFamilyTable'] tbody tr").count();
    const commandRowCount = await page.locator("[data-testid='CommandTable'] tbody tr").count();
    assertCondition(stateCount === 18, "atlas should render eighteen states");
    assertCondition(audienceCount === 3, "atlas should render three audience tiers");
    assertCondition(routeRowCount === 5, "atlas should render five route rows");
    assertCondition(commandRowCount === 8, "atlas should render eight mutation command rows");

    await page.locator(".state-button[data-id='candidate_revalidating']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5HubAtlas']")
          ?.getAttribute("data-active-state") === "candidate_revalidating",
    );
    const transitionText = await page.locator("#transition-list").innerText();
    const commandText = await page.locator("#command-list").innerText();
    const blockerText = await page.locator("#blocker-list").innerText();
    assertCondition(
      transitionText.includes("native_booking_pending"),
      "candidate_revalidating should lead to native_booking_pending",
    );
    assertCondition(
      commandText.includes("Commit native booking"),
      "candidate_revalidating should allow commit native booking",
    );
    assertCondition(
      blockerText.includes("Selected candidate not freshly revalidated"),
      "candidate_revalidating blocker drift",
    );

    await page.locator(".state-button[data-id='booked_pending_practice_ack']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5HubAtlas']")
          ?.getAttribute("data-active-state") === "booked_pending_practice_ack",
    );
    const pendingAckBlockers = await page.locator("#blocker-list").innerText();
    assertCondition(
      pendingAckBlockers.includes("Origin-practice acknowledgement debt open"),
      "booked_pending_practice_ack blocker drift",
    );

    await page.locator(".audience-button[data-id='servicing_site_visibility']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5HubAtlas']")
          ?.getAttribute("data-active-tier") === "servicing_site_visibility",
    );
    const visibleFields = await page.locator("#visible-field-list").innerText();
    const hiddenFields = await page.locator("#hidden-field-list").innerText();
    assertCondition(
      visibleFields.includes("site_local_capacity"),
      "servicing site visible fields drift",
    );
    assertCondition(
      hiddenFields.includes("callback_rationale"),
      "servicing site hidden fields drift",
    );

    await page.locator(".audience-button[data-id='origin_practice_visibility']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5HubAtlas']")
          ?.getAttribute("data-active-tier") === "origin_practice_visibility",
    );
    const originHiddenFields = await page.locator("#hidden-field-list").innerText();
    assertCondition(
      originHiddenFields.includes("raw_native_booking_proof"),
      "origin practice hidden proof drift",
    );

    await page.locator(".state-button[data-id='hub_requested']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5HubAtlas']")
          ?.getAttribute("data-active-state") === "hub_requested",
    );
    await page.locator("#active-state-tab").focus();
    await page.keyboard.press("ArrowDown");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5HubAtlas']")
          ?.getAttribute("data-active-state") === "intake_validated",
    );

    await page.locator("#active-audience-tab").focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='Phase5HubAtlas']")
          ?.getAttribute("data-active-tier") === "hub_desk_visibility",
    );

    await assertNoHorizontalOverflow(page, "311 atlas desktop");
    await page.screenshot({ path: outputPath("311-hub-atlas-desktop.png"), fullPage: true });

    const ariaSnapshots = {
      Phase5HubAtlas: await captureAria(root, page),
      RouteFamilyTable: await captureAria(page.locator("[data-testid='RouteFamilyTable']"), page),
      AudienceParityTable: await captureAria(
        page.locator("[data-testid='AudienceParityTable']"),
        page,
      ),
    };
    fs.writeFileSync(
      outputPath("311-hub-atlas-aria-snapshots.json"),
      `${JSON.stringify(ariaSnapshots, null, 2)}\n`,
    );

    assertCondition(
      externalRequests.size === 0,
      `atlas should not emit external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await desktopContext.tracing.stop({ path: outputPath("311-hub-atlas-trace.zip") });

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    await openAtlas(mobile, atlas.atlasUrl);
    await mobile.locator(".state-button[data-id='alternatives_offered']").click();
    await mobile.locator(".audience-button[data-id='hub_desk_visibility']").click();
    await assertNoHorizontalOverflow(mobile, "311 atlas mobile");
    await mobile.screenshot({ path: outputPath("311-hub-atlas-mobile.png"), fullPage: true });
    await mobileContext.tracing.stop({ path: outputPath("311-hub-atlas-mobile-trace.zip") });
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
