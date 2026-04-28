import fs from "node:fs";

import {
  createInitialHubShellState,
  resolveHubShellSnapshot,
  type HubShellHistorySnapshot,
  type HubShellSnapshot,
  type HubShellState,
} from "../../apps/hub-desk/src/hub-desk-shell.model.ts";
import {
  assertCondition,
  assertNoHorizontalOverflow,
  captureAria,
  importPlaywright,
  openHubRoute,
  outputPath,
  readQueueOrder,
  startHubDesk,
  stopHubDesk,
  trackExternalRequests,
  waitForHubRootState,
  writeJsonArtifact,
} from "./327_hub_queue.helpers.ts";

export {
  assertCondition,
  assertNoHorizontalOverflow,
  captureAria,
  importPlaywright,
  openHubRoute,
  outputPath,
  readQueueOrder,
  startHubDesk,
  stopHubDesk,
  trackExternalRequests,
  waitForHubRootState,
  writeJsonArtifact,
};

export interface ExpectedHubScenario338 {
  readonly state: HubShellState;
  readonly snapshot: HubShellSnapshot;
}

export function buildExpectedHubScenario(
  pathname: string,
  viewportWidth: number,
  historySnapshot?: Partial<HubShellHistorySnapshot> | null,
): ExpectedHubScenario338 {
  const state = createInitialHubShellState(pathname, {
    historySnapshot: historySnapshot ?? undefined,
  });
  return {
    state,
    snapshot: resolveHubShellSnapshot(state, viewportWidth),
  };
}

export async function waitForRootAttributes(
  page: any,
  expected: Record<string, string>,
): Promise<void> {
  await page.waitForFunction((attrs) => {
    const root = document.querySelector("[data-testid='hub-shell-root']");
    if (!root) {
      return false;
    }
    return Object.entries(attrs).every(
      ([key, value]) => (root as HTMLElement).getAttribute(key) === value,
    );
  }, expected);
}

export async function assertRootMatchesExpectedScenario(
  page: any,
  expected: ExpectedHubScenario338,
): Promise<void> {
  await waitForHubRootState(page, {
    currentPath: expected.snapshot.location.pathname,
    viewMode: expected.snapshot.location.viewMode,
    routeFamily: expected.snapshot.location.routeFamilyRef,
    selectedCaseId: expected.snapshot.currentCase.caseId,
    layoutMode: expected.snapshot.layoutMode,
    savedViewId: expected.snapshot.savedView.savedViewId,
    shellStatus: expected.snapshot.routeShellPosture,
  });
  await waitForRootAttributes(page, {
    "data-acting-organisation": expected.state.selectedOrganisationId,
    "data-acting-site": expected.state.selectedSiteId,
    "data-purpose-of-use": expected.state.selectedPurposeId,
    "data-audience-tier":
      expected.snapshot.actingContextControlPlane.visibilityEnvelopeLegend.currentAudienceTierId,
    "data-access-posture": expected.snapshot.actingContextControlPlane.accessPosture,
    "data-break-glass-state":
      expected.snapshot.actingContextControlPlane.scopeSummaryStrip.breakGlassState,
    "data-visibility-envelope-state":
      expected.snapshot.actingContextControlPlane.scopeSummaryStrip.visibilityEnvelopeState,
    "data-route-mutation": expected.snapshot.routeMutationEnabled ? "enabled" : "disabled",
  });
}

export async function readRootAttributes338(
  page: any,
  attributes: readonly string[],
): Promise<Record<string, string | null>> {
  return page.locator("[data-testid='hub-shell-root']").evaluate((root, names) => {
    const output: Record<string, string | null> = {};
    for (const name of names as string[]) {
      output[name] = (root as HTMLElement).getAttribute(name);
    }
    return output;
  }, attributes);
}

export async function startTrace(context: any): Promise<void> {
  await context.tracing.start({ screenshots: true, snapshots: true });
}

export async function stopTrace(context: any, fileName: string): Promise<void> {
  await context.tracing.stop({ path: outputPath(fileName) });
}

export async function stopTraceOnError(
  context: any,
  fileName: string,
  error: unknown,
): Promise<never> {
  await stopTrace(context, fileName);
  throw error;
}

export function writeTextArtifact(fileName: string, content: string): void {
  fs.writeFileSync(outputPath(fileName), `${content}\n`, "utf8");
}

