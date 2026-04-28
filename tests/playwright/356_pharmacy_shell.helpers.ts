import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  allocatePort,
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  trackExternalRequests,
  wait,
  waitForHttp,
  writeAccessibilitySnapshot,
} from "./293_patient_booking_workspace.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PHARMACY_APP_DIR = path.join(ROOT, "apps", "pharmacy-console");

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

export function workspacePharmacyUrl(baseUrl: string, pathname = "/workspace/pharmacy"): string {
  return `${baseUrl}${pathname}`;
}

export function patientPharmacyUrl(
  baseUrl: string,
  pharmacyCaseId: string,
  routeKey: "choose" | "instructions" | "status",
): string {
  return `${baseUrl}/pharmacy/${pharmacyCaseId}/${routeKey}`;
}

export async function startPharmacyConsole(): Promise<{ child: ChildProcess; baseUrl: string }> {
  const port = await allocatePort();
  const logs: string[] = [];
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: PHARMACY_APP_DIR,
      env: { ...process.env, BROWSER: "none" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}/workspace/pharmacy`);
    return { child, baseUrl };
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`pharmacy-console failed to start.\n${logs.join("")}`, { cause: error });
  }
}

export async function stopPharmacyConsole(child: ChildProcess): Promise<void> {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

async function waitForAttribute(
  locator: any,
  name: string,
  expected: string,
  timeoutMs = 4_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if ((await locator.getAttribute(name)) === expected) {
      return;
    }
    await wait(50);
  }
  const actual = await locator.getAttribute(name);
  throw new Error(`Expected ${name}=${expected} but found ${String(actual)}`);
}

export async function openWorkspacePharmacyRoute(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "load" });
  await page.locator("[data-testid='pharmacy-shell-root']").waitFor();
}

export async function openPatientPharmacyRoute(page: any, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "load" });
  await page.locator("[data-testid='pharmacy-patient-shell-root']").waitFor();
}

export async function waitForWorkspacePharmacyState(
  page: any,
  expected: {
    currentPath: string;
    layoutMode?: string;
    breakpointClass?: string;
    selectedCaseId?: string;
    routeKey?: string;
    recoveryPosture?: string;
  },
): Promise<void> {
  const root = page.locator("[data-testid='pharmacy-shell-root']");
  await waitForAttribute(root, "data-current-path", expected.currentPath);
  if (expected.layoutMode) {
    await waitForAttribute(root, "data-layout-mode", expected.layoutMode);
  }
  if (expected.breakpointClass) {
    await waitForAttribute(root, "data-breakpoint-class", expected.breakpointClass);
  }
  if (expected.selectedCaseId) {
    await waitForAttribute(root, "data-selected-case-id", expected.selectedCaseId);
  }
  if (expected.routeKey) {
    await waitForAttribute(root, "data-route-key", expected.routeKey);
  }
  if (expected.recoveryPosture) {
    await waitForAttribute(root, "data-recovery-posture", expected.recoveryPosture);
  }
}

export async function waitForPatientPharmacyState(
  page: any,
  expected: {
    currentPath: string;
    layoutMode?: string;
    breakpointClass?: string;
    routeKey?: string;
    recoveryPosture?: string;
    selectedCaseId?: string;
  },
): Promise<void> {
  const root = page.locator("[data-testid='pharmacy-patient-shell-root']");
  await waitForAttribute(root, "data-current-path", expected.currentPath);
  if (expected.layoutMode) {
    await waitForAttribute(root, "data-layout-mode", expected.layoutMode);
  }
  if (expected.breakpointClass) {
    await waitForAttribute(root, "data-breakpoint-class", expected.breakpointClass);
  }
  if (expected.routeKey) {
    await waitForAttribute(root, "data-current-route", expected.routeKey);
  }
  if (expected.recoveryPosture) {
    await waitForAttribute(root, "data-recovery-posture", expected.recoveryPosture);
  }
  if (expected.selectedCaseId) {
    await waitForAttribute(root, "data-selected-case-id", expected.selectedCaseId);
  }
}
