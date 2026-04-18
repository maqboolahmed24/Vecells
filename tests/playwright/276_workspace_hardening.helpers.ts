import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import {
  ROOT,
  allocatePort,
  assertCondition,
  assertNoHorizontalOverflow,
  ensureOutputDir,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
  wait,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export const WORKSPACE_HARDENING_LAB_PATH = "/docs/frontend/276_workspace_hardening_assurance_lab.html";
const SAFE_FIXTURE = "hardening_safe";
const DISALLOWED_PHI_TOKENS = ["Asha Patel", "Noah Bennett", "Elena Morris", "Ravi Singh", "Maya Foster"];

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "text/plain; charset=utf-8";
}

function normalizeFixtureFlags(fixtureFlags: readonly string[]): string[] {
  return Array.from(new Set([SAFE_FIXTURE, ...fixtureFlags.map((flag) => flag.trim()).filter(Boolean)]));
}

export function buildWorkspaceHardeningUrl(
  baseUrl: string,
  relativePath: string,
  fixtureFlags: readonly string[] = [SAFE_FIXTURE],
): string {
  const url = new URL(relativePath, baseUrl);
  const existing = url.searchParams
    .get("fixture")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) ?? [];
  url.searchParams.set("fixture", normalizeFixtureFlags([...existing, ...fixtureFlags]).join(","));
  return url.toString();
}

export async function openHardeningWorkspaceRoute(
  page: any,
  baseUrl: string,
  relativePath: string,
  testId: string,
  fixtureFlags: readonly string[] = [SAFE_FIXTURE],
): Promise<string> {
  const url = buildWorkspaceHardeningUrl(baseUrl, relativePath, fixtureFlags);
  await openWorkspaceRoute(page, url, testId);
  return url;
}

export async function startWorkspaceHardeningLabServer(): Promise<{
  server: http.Server;
  atlasUrl: string;
}> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname =
      requestUrl.pathname === "/" ? WORKSPACE_HARDENING_LAB_PATH : decodeURIComponent(requestUrl.pathname);
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
    server,
    atlasUrl: `http://127.0.0.1:${port}${WORKSPACE_HARDENING_LAB_PATH}`,
  };
}

export async function stopWorkspaceHardeningLabServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function openWorkspaceHardeningScenario(
  page: any,
  atlasUrl: string,
  scenarioId: string,
): Promise<void> {
  await page.goto(`${atlasUrl}?scenario=${encodeURIComponent(scenarioId)}`, {
    waitUntil: "networkidle",
  });
  await page.locator("[data-testid='WorkspaceHardeningAssuranceLab']").waitFor();
  await page.waitForFunction(
    (targetScenarioId) =>
      document
        .querySelector("[data-testid='WorkspaceHardeningAssuranceLab']")
        ?.getAttribute("data-selected-scenario-id") === targetScenarioId,
    scenarioId,
  );
}

export async function startTracedContext(
  browser: any,
  options: {
    viewport?: { width: number; height: number };
    reducedMotion?: "reduce" | "no-preference";
  } = {},
): Promise<any> {
  const context = await browser.newContext({
    viewport: options.viewport ?? { width: 1440, height: 960 },
    reducedMotion: options.reducedMotion ?? "no-preference",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  return context;
}

export async function stopTrace(context: any, fileName: string): Promise<void> {
  ensureOutputDir();
  await context.tracing.stop({ path: outputPath(fileName) });
}

export async function captureAriaTree(page: any, selector: string): Promise<unknown> {
  const locator = page.locator(selector);
  await locator.waitFor();
  let snapshot: unknown = null;
  if (typeof locator.ariaSnapshot === "function") {
    snapshot = await locator.ariaSnapshot();
  } else {
    const handle = await locator.elementHandle();
    assertCondition(handle, `missing accessible root for ${selector}`);
    snapshot = await page.accessibility?.snapshot({
      root: handle,
      interestingOnly: false,
    });
  }
  assertCondition(snapshot, `missing accessibility snapshot for ${selector}`);
  return snapshot;
}

export async function writeWorkspaceAriaSnapshots(
  snapshots: Record<string, unknown>,
  fileName: string,
): Promise<void> {
  ensureOutputDir();
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshots, null, 2));
}

export function writeRepoJson(relativePath: string, data: unknown): void {
  const absolutePath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function waitForFocusOn(page: any, selector: string): Promise<void> {
  await page.waitForFunction(
    (targetSelector) => document.activeElement?.matches(targetSelector) ?? false,
    selector,
  );
}

export async function tabUntilFocus(
  page: any,
  selector: string,
  maxTabs: number,
  description: string,
): Promise<void> {
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
  throw new Error(`keyboard flow should reach ${description}`);
}

export async function ensurePhiSafeWorkspace(page: any): Promise<void> {
  const shellText = await page.locator("[data-testid='WorkspaceShellRouteFamily']").innerText();
  for (const token of DISALLOWED_PHI_TOKENS) {
    assertCondition(!shellText.includes(token), `PHI token leaked into workspace evidence: ${token}`);
  }
}

export async function measureAsyncActionMs(action: () => Promise<void>): Promise<number> {
  const startedAt = Date.now();
  await action();
  return Date.now() - startedAt;
}

export async function collectNavigationMetrics(page: any): Promise<{
  domContentLoadedMs: number | null;
  loadEventEndMs: number | null;
  lcpMs: number | null;
  cls: number;
}> {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint") as PerformanceEntry[];
    const layoutShiftEntries = performance.getEntriesByType("layout-shift") as Array<
      PerformanceEntry & { value?: number; hadRecentInput?: boolean }
    >;
    return {
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      loadEventEndMs: navigation ? Math.round(navigation.loadEventEnd) : null,
      lcpMs: lcpEntries.length ? Math.round(lcpEntries[lcpEntries.length - 1]!.startTime) : null,
      cls: Number(
        layoutShiftEntries
          .filter((entry) => !entry.hadRecentInput)
          .reduce((sum, entry) => sum + (entry.value ?? 0), 0)
          .toFixed(4),
      ),
    };
  });
}

export async function countRenderedQueueRows(page: any): Promise<number> {
  return await page.locator("[data-testid='queue-workboard'] [role='option']").count();
}

export async function readQueueRowCount(page: any): Promise<number> {
  const raw = await page.locator("[data-testid='queue-workboard']").getAttribute("data-row-count");
  return Number(raw ?? "0");
}

export async function waitForPreviewTask(page: any, taskId: string): Promise<void> {
  await page.waitForFunction(
    (targetTaskId) =>
      document
        .querySelector("[data-testid='queue-preview-pocket']")
        ?.getAttribute("data-task-id") === targetTaskId,
    taskId,
  );
}

export async function assertReadonlyMutationLock(
  page: any,
  selector: string,
  reasonSelector?: string,
): Promise<void> {
  const control = page.locator(selector).first();
  await control.waitFor();
  assertCondition(await control.isDisabled(), `expected ${selector} to be disabled in read-only posture`);
  if (reasonSelector) {
    await page.locator(reasonSelector).first().waitFor();
  }
}

export async function assertWritableMutationControl(page: any, selector: string): Promise<void> {
  const control = page.locator(selector).first();
  await control.waitFor();
  assertCondition(!(await control.isDisabled()), `expected ${selector} to remain writable for the active owner`);
}

export async function openCommandPalette(page: any): Promise<void> {
  await page.keyboard.press("Control+K");
  await page.locator("[data-testid='WorkspaceCommandPaletteDialog']").waitFor();
  await waitForFocusOn(page, "#workspace-command-palette-input");
}

export async function closeCommandPalette(page: any): Promise<void> {
  await page.keyboard.press("Escape");
  await page.locator("[data-testid='WorkspaceCommandPaletteDialog']").waitFor({ state: "detached" });
}

export async function readBoundingBoxY(page: any, selector: string): Promise<number> {
  const box = await page.locator(selector).boundingBox();
  assertCondition(box, `missing bounding box for ${selector}`);
  return Math.round(box.y);
}

export async function waitForQuietFrame(): Promise<void> {
  await wait(80);
}

export {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
  wait,
  writeAccessibilitySnapshot,
};
