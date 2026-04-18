import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import {
  ROOT,
  assertCondition,
  ensureOutputDir,
  importPlaywright,
  outputPath,
} from "./255_workspace_shell_helpers";
import {
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  openPatientConversationRoute,
  openStaffCallbacksRoute,
  openStaffMoreInfoRoute,
  openStaffTaskRoute,
  openWorkspaceRoute,
  outputPath as sharedOutputPath,
  readAttributes,
  selectCallbackRow,
  startPatientWorkspacePair,
  stopPatientWorkspacePair,
  type PatientWorkspacePair,
} from "./271_phase3_patient_workspace.helpers";

export const COMMUNICATION_INTEGRITY_LAB_PATH =
  "/docs/frontend/274_communication_repair_integrity_lab.html";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "text/plain; charset=utf-8";
}

export async function startCommunicationIntegrityLabServer(): Promise<{
  server: http.Server;
  atlasUrl: string;
}> {
  const { allocatePort } = await import("./255_workspace_shell_helpers");
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname =
      requestUrl.pathname === "/"
        ? COMMUNICATION_INTEGRITY_LAB_PATH
        : decodeURIComponent(requestUrl.pathname);
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
    atlasUrl: `http://127.0.0.1:${port}${COMMUNICATION_INTEGRITY_LAB_PATH}`,
  };
}

export async function stopCommunicationIntegrityLabServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function openCommunicationIntegrityScenario(
  page: any,
  atlasUrl: string,
  scenarioId: string,
): Promise<void> {
  await page.goto(`${atlasUrl}?scenario=${encodeURIComponent(scenarioId)}`, {
    waitUntil: "networkidle",
  });
  await page.locator("[data-testid='CommunicationRepairIntegrityLab']").waitFor();
  await page.waitForFunction(
    (targetScenarioId) =>
      document
        .querySelector("[data-testid='CommunicationRepairIntegrityLab']")
        ?.getAttribute("data-selected-scenario-id") === targetScenarioId,
    scenarioId,
  );
}

export async function stopCommunicationTrace(context: any, fileName: string): Promise<void> {
  ensureOutputDir();
  await context.tracing.stop({ path: outputPath(fileName) });
}

export async function writeCommunicationAriaSnapshots(
  snapshots: Record<string, unknown>,
  fileName: string,
): Promise<void> {
  ensureOutputDir();
  fs.writeFileSync(sharedOutputPath(fileName), JSON.stringify(snapshots, null, 2));
}

export async function openStaffMessagesRoute(
  page: any,
  baseUrl: string,
  state = "live",
): Promise<void> {
  await openWorkspaceRoute(page, `${baseUrl}/workspace/messages?state=${state}`, "WorkspaceMessagesRoute");
}

export async function selectMessageRow(page: any, taskId: string): Promise<void> {
  await page
    .locator(`[data-testid='ClinicianMessageWorklistRow'][data-task-id='${taskId}'] .staff-shell__message-row-main`)
    .click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`[data-testid='ClinicianMessageWorklistRow'][data-task-id='${selectedTaskId}']`)
        ?.getAttribute("data-selected") === "true",
    taskId,
  );
}

export async function openSupportRoute(page: any, url: string, testId: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".support-workspace").waitFor();
  await page.locator(`[data-testid='${testId}']`).waitFor();
}

export {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientConversationRoute,
  openStaffCallbacksRoute,
  openStaffMoreInfoRoute,
  openStaffTaskRoute,
  openWorkspaceRoute,
  outputPath,
  readAttributes,
  selectCallbackRow,
  startPatientWorkspacePair,
  stopPatientWorkspacePair,
  type PatientWorkspacePair,
};
