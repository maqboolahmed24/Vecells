import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  outputPath,
  startPatientWeb,
  startStaticServer,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";
import type { NetworkManageScenarioId330 } from "../../apps/patient-web/src/patient-network-manage.model.ts";

export {
  assertCondition,
  assertNoHorizontalOverflow,
  closeServer,
  importPlaywright,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
};

export const NETWORK_MANAGE_ATLAS_PATH =
  "/docs/frontend/330_network_manage_and_message_timeline_atlas.html";

export function networkManageUrl(
  baseUrl: string,
  input: {
    scenarioId: NetworkManageScenarioId330;
    host?: "browser" | "nhs_app";
    safeArea?: "none" | "top" | "bottom" | "both";
  },
): string {
  const url = new URL(`/bookings/network/manage/${input.scenarioId}`, baseUrl);
  if (input.host === "nhs_app") {
    url.searchParams.set("host", "nhs_app");
    url.searchParams.set("safeArea", input.safeArea ?? "bottom");
  }
  return url.toString();
}

export async function openNetworkManageRoute(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByTestId("Patient_Network_Manage_Route").waitFor();
}

export async function startNetworkManageAtlasServer() {
  return startStaticServer(NETWORK_MANAGE_ATLAS_PATH);
}

export async function readNetworkManageMarkers(page: any) {
  const root = page.getByTestId("Patient_Network_Manage_Route");
  await root.waitFor();
  return {
    scenarioId: await root.getAttribute("data-manage-scenario"),
    capabilityState: await root.getAttribute("data-manage-capability-state"),
    readOnlyMode: await root.getAttribute("data-manage-read-only-mode"),
    selectedTimelineRow: await root.getAttribute("data-selected-timeline-row"),
    settlement: await root.getAttribute("data-manage-settlement"),
    repairState: await root.getAttribute("data-contact-repair"),
    messageContext: await root.getAttribute("data-message-context"),
    embeddedMode: await root.getAttribute("data-embedded-mode"),
  };
}

export async function waitForNetworkManageState(
  page: any,
  expected: Partial<{
    scenarioId: string;
    capabilityState: string;
    readOnlyMode: string;
    selectedTimelineRow: string;
    settlement: string;
    repairState: string;
    embeddedMode: string;
  }>,
): Promise<void> {
  await page.waitForFunction((assertion) => {
    const root = document.querySelector("[data-testid='Patient_Network_Manage_Route']");
    if (!root) {
      return false;
    }
    return Object.entries(assertion).every(([key, value]) => {
      if (value == null) {
        return true;
      }
      switch (key) {
        case "scenarioId":
          return root.getAttribute("data-manage-scenario") === value;
        case "capabilityState":
          return root.getAttribute("data-manage-capability-state") === value;
        case "readOnlyMode":
          return root.getAttribute("data-manage-read-only-mode") === value;
        case "selectedTimelineRow":
          return root.getAttribute("data-selected-timeline-row") === value;
        case "settlement":
          return root.getAttribute("data-manage-settlement") === value;
        case "repairState":
          return root.getAttribute("data-contact-repair") === value;
        case "embeddedMode":
          return root.getAttribute("data-embedded-mode") === value;
        default:
          return true;
      }
    });
  }, expected);
}

export async function captureAria(locator: any, page: any): Promise<unknown> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "aria snapshot root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "accessibility snapshot missing");
  return snapshot;
}

export function writeJsonArtifact(fileName: string, payload: unknown): void {
  fs.writeFileSync(outputPath(fileName), `${JSON.stringify(payload, null, 2)}\n`);
}
