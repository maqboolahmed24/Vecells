import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  captureAria,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  stopHubDesk,
  trackExternalRequests,
  waitForHubRootState,
  writeJsonArtifact,
} from "./327_hub_queue.helpers";
import { startPatientWeb, stopPatientWeb } from "./293_patient_booking_workspace.helpers.ts";

export {
  assertCondition,
  assertNoHorizontalOverflow,
  captureAria,
  importPlaywright,
  openHubRoute,
  outputPath,
  startHubDesk,
  startPatientWeb,
  stopHubDesk,
  stopPatientWeb,
  trackExternalRequests,
  waitForHubRootState,
  writeJsonArtifact,
};

export function networkConfirmationUrl(
  baseUrl: string,
  input: {
    scenarioId:
      | "network_confirmation_329_pending"
      | "network_confirmation_329_practice_informed"
      | "network_confirmation_329_practice_acknowledged"
      | "network_confirmation_329_disputed"
      | "network_confirmation_329_supplier_drift";
    host?: "browser" | "nhs_app";
    safeArea?: "none" | "top" | "bottom" | "both";
  },
): string {
  const url = new URL(`/bookings/network/confirmation/${input.scenarioId}`, baseUrl);
  if (input.host === "nhs_app") {
    url.searchParams.set("host", "nhs_app");
    url.searchParams.set("safeArea", input.safeArea ?? "bottom");
  }
  return url.toString();
}

export async function openNetworkConfirmationRoute(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByTestId("PatientNetworkConfirmationView").waitFor();
}

export async function readHubCommitMarkers(page: any) {
  const pane = page.getByTestId("HubCommitConfirmationPane");
  await pane.waitFor();
  return {
    posture: await pane.getAttribute("data-hub-commit-posture"),
    managePosture: await pane.getAttribute("data-manage-posture"),
    practiceVisibility: await page
      .getByTestId("PracticeVisibilityPanel")
      .getAttribute("data-practice-visibility"),
    acknowledgementState: await page
      .getByTestId("PracticeAcknowledgementIndicator")
      .getAttribute("data-acknowledgement-state"),
    continuityOpen: await page
      .getByTestId("ContinuityDeliveryEvidenceDrawer")
      .getAttribute("data-open"),
    supplierDrift: await page.locator("[data-testid='HubSupplierDriftBanner']").count(),
  };
}

export async function waitForHubCommitPosture(page: any, posture: string): Promise<void> {
  await page.waitForFunction((expected) => {
    const pane = document.querySelector("[data-testid='HubCommitConfirmationPane']");
    return pane?.getAttribute("data-hub-commit-posture") === expected;
  }, posture);
}

export async function readPatientConfirmationMarkers(page: any) {
  const root = page.getByTestId("PatientNetworkConfirmationView");
  await root.waitFor();
  return {
    scenarioId: await root.getAttribute("data-confirmation-scenario"),
    truthState: await root.getAttribute("data-confirmation-truth"),
    embeddedMode: await root.getAttribute("data-embedded-mode"),
    practiceInformed: await root.getAttribute("data-practice-informed"),
    practiceAcknowledged: await root.getAttribute("data-practice-acknowledged"),
  };
}

export async function waitForPatientConfirmationState(
  page: any,
  expected: Partial<{
    scenarioId: string;
    truthState: string;
    embeddedMode: string;
  }>,
): Promise<void> {
  await page.waitForFunction((assertion) => {
    const root = document.querySelector("[data-testid='PatientNetworkConfirmationView']");
    if (!root) {
      return false;
    }
    return Object.entries(assertion).every(([key, value]) => {
      if (value == null) {
        return true;
      }
      switch (key) {
        case "scenarioId":
          return root.getAttribute("data-confirmation-scenario") === value;
        case "truthState":
          return root.getAttribute("data-confirmation-truth") === value;
        case "embeddedMode":
          return root.getAttribute("data-embedded-mode") === value;
        default:
          return true;
      }
    });
  }, expected);
}

export function writeTextArtifact(fileName: string, content: string): void {
  fs.writeFileSync(outputPath(fileName), `${content}\n`);
}
