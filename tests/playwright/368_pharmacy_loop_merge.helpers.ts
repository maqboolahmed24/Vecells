import { spawn, type ChildProcess } from "node:child_process";

import {
  allocatePort,
  assertCondition,
  importPlaywright,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  waitForHttp,
} from "./255_workspace_shell_helpers.ts";
import {
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  patientPharmacyUrl,
  startPatientWeb,
  startPharmacyConsole,
  stopPatientWeb,
  stopPharmacyConsole,
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
} from "./356_pharmacy_shell.helpers.ts";

const OPS_APP_DIR = "/Users/test/Code/V/apps/ops-console";

export {
  assertCondition,
  importPlaywright,
  openPatientPharmacyRoute,
  openWorkspacePharmacyRoute,
  patientPharmacyUrl,
  startClinicalWorkspace,
  startPatientWeb,
  startPharmacyConsole,
  stopClinicalWorkspace,
  stopPatientWeb,
  stopPharmacyConsole,
  waitForPatientPharmacyState,
  waitForWorkspacePharmacyState,
  workspacePharmacyUrl,
};

async function waitForAttribute(
  locator: any,
  name: string,
  expected: string,
  timeoutMs = 4_000,
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if ((await locator.getAttribute(name)) === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    `Expected ${name}=${expected} but found ${String(await locator.getAttribute(name))}`,
  );
}

export async function startOpsConsole(): Promise<{ child: ChildProcess; baseUrl: string }> {
  const port = await allocatePort();
  const logs: string[] = [];
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: OPS_APP_DIR,
      env: { ...process.env, BROWSER: "none" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}/ops/overview`);
    return { child, baseUrl };
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`ops-console failed to start.\n${logs.join("")}`, { cause: error });
  }
}

export async function stopOpsConsole(child: ChildProcess): Promise<void> {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

export async function openPatientRequestRoute(page: any, baseUrl: string, requestRef: string) {
  await page.goto(`${baseUrl}/requests/${requestRef}`, { waitUntil: "load" });
  await page.locator("[data-testid='Patient_Home_Requests_Detail_Route']").waitFor();
}

export async function waitForPatientRequestState(
  page: any,
  expected: {
    routeKey: string;
    requestRef: string;
  },
) {
  const root = page.locator("[data-testid='Patient_Home_Requests_Detail_Route']");
  await waitForAttribute(root, "data-route-key", expected.routeKey);
  await page.locator("[data-testid='request-detail-hero']").waitFor();
  await waitForAttribute(
    page.locator("[data-testid='request-detail-hero']"),
    "data-request-ref",
    expected.requestRef,
  );
}

export async function openMessagesRoute(page: any, baseUrl: string, clusterRef: string) {
  await page.goto(`${baseUrl}/messages/${clusterRef}`, { waitUntil: "load" });
  await page.locator("[data-testid='Health_Record_Communications_Route']").waitFor();
}

export async function waitForMessagesState(
  page: any,
  expected: {
    routeKey: string;
    clusterRef: string;
  },
) {
  const root = page.locator("[data-testid='Health_Record_Communications_Route']");
  await waitForAttribute(root, "data-route-key", expected.routeKey);
  await page.locator(`[data-cluster-ref='${expected.clusterRef}']`).first().waitFor();
}

export async function openOpsOverview(page: any, baseUrl: string) {
  await page.goto(`${baseUrl}/ops/overview`, { waitUntil: "load" });
  await page.locator("[data-testid='ops-shell-root']").waitFor();
}
