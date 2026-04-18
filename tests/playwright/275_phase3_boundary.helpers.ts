import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import {
  ROOT,
  assertCondition,
  assertNoHorizontalOverflow,
  ensureOutputDir,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export const BOUNDARY_REOPEN_LAB_PATH = "/docs/frontend/275_boundary_reopen_assurance_lab.html";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "text/plain; charset=utf-8";
}

export async function startBoundaryReopenLabServer(): Promise<{
  server: http.Server;
  atlasUrl: string;
}> {
  const { allocatePort } = await import("./255_workspace_shell_helpers");
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname =
      requestUrl.pathname === "/" ? BOUNDARY_REOPEN_LAB_PATH : decodeURIComponent(requestUrl.pathname);
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
    atlasUrl: `http://127.0.0.1:${port}${BOUNDARY_REOPEN_LAB_PATH}`,
  };
}

export async function stopBoundaryReopenLabServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function openBoundaryReopenScenario(
  page: any,
  atlasUrl: string,
  scenarioId: string,
): Promise<void> {
  await page.goto(`${atlasUrl}?scenario=${encodeURIComponent(scenarioId)}`, {
    waitUntil: "networkidle",
  });
  await page.locator("[data-testid='BoundaryReopenAssuranceLab']").waitFor();
  await page.waitForFunction(
    (targetScenarioId) =>
      document
        .querySelector("[data-testid='BoundaryReopenAssuranceLab']")
        ?.getAttribute("data-selected-scenario-id") === targetScenarioId,
    scenarioId,
  );
}

export async function selectConsequenceRow(page: any, taskId: string): Promise<void> {
  await page
    .locator(
      `[data-testid='ConsequenceWorkbenchRow'][data-task-id='${taskId}'] .staff-shell__consequence-row-main`,
    )
    .click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`[data-testid='ConsequenceWorkbenchRow'][data-task-id='${selectedTaskId}']`)
        ?.getAttribute("data-selected") === "true",
    taskId,
  );
}

export async function tabUntil(
  page: any,
  matcher: () => Promise<boolean>,
  maxTabs: number,
  description: string,
): Promise<void> {
  for (let step = 0; step < maxTabs; step += 1) {
    await page.keyboard.press("Tab");
    if (await matcher()) {
      return;
    }
  }
  throw new Error(`keyboard flow should reach ${description}`);
}

export async function takeBoundaryReopenTrace(context: any, fileName: string): Promise<void> {
  ensureOutputDir();
  await context.tracing.stop({ path: outputPath(fileName) });
}

export async function writeBoundaryAriaSnapshots(
  snapshots: Record<string, unknown>,
  fileName: string,
): Promise<void> {
  ensureOutputDir();
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshots, null, 2));
}

export {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
  writeAccessibilitySnapshot,
};
