import fs from "node:fs";

import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

export {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  writeAccessibilitySnapshot,
};

export function appointmentFamilyUrl(
  baseUrl: string,
  input: {
    familyRef?: string;
    entry?: "appointments_list" | "request_detail" | "notification";
    requestRef?: string;
    variant?: "default" | "pending";
  } = {},
): string {
  const url = new URL("/appointments", baseUrl);
  if (input.familyRef) {
    url.searchParams.set("family", input.familyRef);
  }
  if (input.entry) {
    url.searchParams.set("entry", input.entry);
  }
  if (input.requestRef) {
    url.searchParams.set("request", input.requestRef);
  }
  if (input.variant) {
    url.searchParams.set("variant", input.variant);
  }
  return url.toString();
}

export function requestDetailUrl(baseUrl: string, requestRef = "request_211_a"): string {
  return new URL(`/requests/${requestRef}`, baseUrl).toString();
}

export async function openAppointmentFamilyRoute(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByTestId("PatientAppointmentFamilyWorkspace").waitFor();
}

export async function readAppointmentFamilyMarkers(page: any) {
  const root = page.getByTestId("PatientAppointmentFamilyWorkspace");
  await root.waitFor();
  return {
    selectedFamilyRef: await root.getAttribute("data-selected-family-ref"),
    entrySource: await root.getAttribute("data-entry-source"),
    requestContext: await root.getAttribute("data-request-context"),
    returnAnchor: await root.getAttribute("data-return-anchor"),
  };
}

export async function waitForAppointmentFamilySelection(
  page: any,
  expectedFamilyRef: string,
): Promise<void> {
  await page.waitForFunction((familyRef) => {
    const root = document.querySelector("[data-testid='PatientAppointmentFamilyWorkspace']");
    return root?.getAttribute("data-selected-family-ref") === familyRef;
  }, expectedFamilyRef);
}

export async function startTrace(context: any): Promise<void> {
  await context.tracing.start({ screenshots: true, snapshots: true });
}

export async function stopTraceOnError(
  context: any,
  traceFileName: string,
  error: unknown,
): Promise<never> {
  await context.tracing.stop({ path: outputPath(traceFileName) });
  throw error;
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
