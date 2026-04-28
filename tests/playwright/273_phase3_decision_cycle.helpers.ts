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
  openStaffMoreInfoRoute,
  openStaffTaskRoute,
  openWorkspaceRoute,
  readAttributes,
  startPatientWorkspacePair,
  stopPatientWorkspacePair,
  type PatientWorkspacePair,
} from "./271_phase3_patient_workspace.helpers";

export const DECISION_CYCLE_LAB_PATH =
  "/docs/frontend/273_decision_cycle_assurance_lab.html";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  if (filePath.endsWith(".csv")) {
    return "text/csv; charset=utf-8";
  }
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (filePath.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".svg")) {
    return "image/svg+xml";
  }
  return "text/plain; charset=utf-8";
}

export async function startDecisionCycleLabServer(): Promise<{
  server: http.Server;
  atlasUrl: string;
}> {
  const { allocatePort } = await import("./255_workspace_shell_helpers");
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname =
      requestUrl.pathname === "/"
        ? DECISION_CYCLE_LAB_PATH
        : decodeURIComponent(requestUrl.pathname);
    const filePath = path.join(ROOT, pathname);

    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
      });
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
    atlasUrl: `http://127.0.0.1:${port}${DECISION_CYCLE_LAB_PATH}`,
  };
}

export async function stopDecisionCycleLabServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function openDecisionCycleScenario(
  page: any,
  atlasUrl: string,
  scenarioId: string,
): Promise<void> {
  await page.goto(`${atlasUrl}?scenario=${encodeURIComponent(scenarioId)}`, {
    waitUntil: "networkidle",
  });
  await page.locator("[data-testid='DecisionCycleAssuranceLab']").waitFor();
  await page.waitForFunction(
    (targetScenarioId) =>
      document
        .querySelector("[data-testid='DecisionCycleAssuranceLab']")
        ?.getAttribute("data-selected-scenario-id") === targetScenarioId,
    scenarioId,
  );
}

export async function takeDecisionCycleTrace(
  context: any,
  fileName: string,
): Promise<void> {
  ensureOutputDir();
  await context.tracing.stop({ path: outputPath(fileName) });
}

export async function writeDecisionCycleAriaSnapshots(
  snapshots: Record<string, string>,
  fileName: string,
): Promise<void> {
  ensureOutputDir();
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshots, null, 2));
}

export {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientConversationRoute,
  openStaffMoreInfoRoute,
  openStaffTaskRoute,
  openWorkspaceRoute,
  outputPath,
  readAttributes,
  startPatientWorkspacePair,
  stopPatientWorkspacePair,
  type PatientWorkspacePair,
};
