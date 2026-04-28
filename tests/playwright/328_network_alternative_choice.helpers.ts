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
import type { NetworkChoiceScenarioId } from "../../apps/patient-web/src/patient-network-alternative-choice.model.ts";

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

export const NETWORK_CHOICE_ATLAS_PATH =
  "/docs/frontend/328_patient_network_alternative_choice_atlas.html";

export function networkChoiceUrl(
  baseUrl: string,
  input: {
    scenarioId: NetworkChoiceScenarioId;
    origin?: "home" | "requests" | "appointments" | "secure_link";
    returnRoute?: string;
    host?: "browser" | "nhs_app";
    safeArea?: "none" | "bottom" | "top" | "both";
    anchor?: string;
    anchorLabel?: string;
  },
): string {
  const url = new URL(`/bookings/network/${input.scenarioId}`, baseUrl);
  url.searchParams.set("origin", input.origin ?? "requests");
  url.searchParams.set("returnRoute", input.returnRoute ?? "/requests");
  if (input.host === "nhs_app") {
    url.searchParams.set("host", "nhs_app");
    url.searchParams.set("safeArea", input.safeArea ?? "bottom");
  }
  if (input.anchor) {
    url.searchParams.set("anchor", input.anchor);
  }
  if (input.anchorLabel) {
    url.searchParams.set("anchorLabel", input.anchorLabel);
  }
  return url.toString();
}

export async function openNetworkChoiceRoute(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByTestId("Patient_Network_Alternative_Choice_Route").waitFor();
}

export async function startNetworkChoiceAtlasServer() {
  return startStaticServer(NETWORK_CHOICE_ATLAS_PATH);
}

export async function readNetworkChoiceMarkers(page: any) {
  const root = page.getByTestId("Patient_Network_Alternative_Choice_Route");
  await root.waitFor();
  return {
    offerSession: await root.getAttribute("data-offer-session"),
    choiceActionability: await root.getAttribute("data-choice-actionability"),
    offerState: await root.getAttribute("data-offer-state"),
    confirmationTruth: await root.getAttribute("data-confirmation-truth"),
    fallbackLinkState: await root.getAttribute("data-fallback-link-state"),
    patientVisibility: await root.getAttribute("data-patient-visibility"),
    selectedOfferEntry: await root.getAttribute("data-selected-offer-entry"),
    selectedAnchorRef: await root.getAttribute("data-selected-anchor-ref"),
    entryMode: await root.getAttribute("data-entry-mode"),
    recoveryReason: await root.getAttribute("data-recovery-reason"),
    breakpointClass: await root.getAttribute("data-breakpoint-class"),
    missionStackState: await root.getAttribute("data-mission-stack-state"),
    safeAreaClass: await root.getAttribute("data-safe-area-class"),
    stickyActionPosture: await root.getAttribute("data-sticky-action-posture"),
    embeddedMode: await root.getAttribute("data-embedded-mode"),
    motionProfile: await root.getAttribute("data-motion-profile"),
  };
}

export async function waitForNetworkChoiceState(
  page: any,
  expected: Partial<{
    offerSession: string;
    choiceActionability: string;
    offerState: string;
    confirmationTruth: string;
    fallbackLinkState: string;
    patientVisibility: string;
    selectedOfferEntry: string;
    recoveryReason: string;
    embeddedMode: string;
  }>,
): Promise<void> {
  await page.waitForFunction((assertion) => {
    const root = document.querySelector(
      "[data-testid='Patient_Network_Alternative_Choice_Route']",
    );
    if (!root) {
      return false;
    }
    const element = root as HTMLElement;
    return Object.entries(assertion).every(([key, value]) => {
      if (value == null) {
        return true;
      }
      switch (key) {
        case "offerSession":
          return element.getAttribute("data-offer-session") === value;
        case "choiceActionability":
          return element.getAttribute("data-choice-actionability") === value;
        case "offerState":
          return element.getAttribute("data-offer-state") === value;
        case "confirmationTruth":
          return element.getAttribute("data-confirmation-truth") === value;
        case "fallbackLinkState":
          return element.getAttribute("data-fallback-link-state") === value;
        case "patientVisibility":
          return element.getAttribute("data-patient-visibility") === value;
        case "selectedOfferEntry":
          return element.getAttribute("data-selected-offer-entry") === value;
        case "recoveryReason":
          return element.getAttribute("data-recovery-reason") === value;
        case "embeddedMode":
          return element.getAttribute("data-embedded-mode") === value;
        default:
          return true;
      }
    });
  }, expected);
}

export async function assertFocusableVisible(
  page: any,
  locator: any,
  reservePx = 136,
): Promise<void> {
  await locator.focus();
  await page.waitForTimeout(120);
  const visible = await locator.evaluate(
    (node: HTMLElement, reserve: number) => {
      const rect = node.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= window.innerHeight - reserve + 28;
    },
    reservePx,
  );
  assertCondition(visible, "focused control should remain visible above sticky reserve");
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
