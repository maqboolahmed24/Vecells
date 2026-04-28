import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import {
  build475BAUArtifacts,
  write475BAUArtifacts,
} from "../../tools/bau/plan_475_training_runbooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4350";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright", "475-training-runbook-centre");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|https?:\/\//i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startOpsConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4350", "--strictPort"],
    {
      cwd: APP_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const logs: string[] = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  try {
    await waitForHttp(`${APP_URL}/ops/conformance?trainingState=constrained`, 25_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`ops-console failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

async function stopOpsConsole(child: ChildProcessWithoutNullStreams): Promise<void> {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function expectAttribute(locator: any, name: string, expected: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 3_000) {
    const value = await locator.getAttribute(name);
    if (value === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const value = await locator.getAttribute(name);
  assert.equal(value, expected, `Expected ${name}=${expected}, found ${value}.`);
}

function assertNoSensitiveSerialized(value: string | Buffer, label: string): void {
  const serialized = Buffer.isBuffer(value) ? value.toString("latin1") : value;
  assert(!serialized.match(forbiddenSurfacePatterns), `${label} exposed sensitive marker text`);
}

async function writeAriaSnapshot(locator: any, name: string): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const serialized =
    typeof locator.ariaSnapshot === "function"
      ? String(await locator.ariaSnapshot())
      : String(await locator.evaluate((node: HTMLElement) => node.innerText));
  fs.writeFileSync(path.join(OUTPUT_DIR, name), serialized);
  assertNoSensitiveSerialized(serialized, name);
}

async function captureTrainingScreenshot(page: any, name: string): Promise<void> {
  const screenshotPath = path.join(OUTPUT_DIR, name);
  await page.locator("[data-testid='training-475-centre']").screenshot({ path: screenshotPath });
  assertNoSensitiveSerialized(fs.readFileSync(screenshotPath), name);
}

async function gotoTraining(page: any, state: string, role = "clinician"): Promise<any> {
  await page.goto(`${APP_URL}/ops/conformance?trainingState=${state}&trainingRole=${role}`, {
    waitUntil: "networkidle",
  });
  const centre = page.locator("[data-testid='training-475-centre']");
  await centre.waitFor();
  return centre;
}

export async function run(): Promise<void> {
  write475BAUArtifacts();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const blockedArtifacts = build475BAUArtifacts("blocked");
  assert.equal(
    blockedArtifacts.supportEscalationPaths.readinessState,
    "blocked",
    "API-side out-of-hours gap should block escalation readiness.",
  );
  const supersededArtifacts = build475BAUArtifacts("superseded_runbook");
  assert.equal(
    supersededArtifacts.runbookBundleManifest.readinessState,
    "blocked",
    "API-side superseded runbook tuple should block runbook readiness.",
  );

  const playwright = await importPlaywright();
  const server = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1260 },
    reducedMotion: "reduce",
    colorScheme: "dark",
    forcedColors: "active",
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  page.on("console", (message: any) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error: Error) => pageErrors.push(error.message));
  page.on("requestfailed", (request: any) => {
    if (!request.url().includes("/@vite/client")) {
      requestFailures.push(`${request.method()} ${request.url()}`);
    }
  });

  try {
    const centre = await gotoTraining(page, "constrained");
    await expectAttribute(centre, "data-readiness-state", "complete_with_constraints");
    await expectAttribute(centre, "data-mark-complete-action-state", "disabled_constraints");

    const roleGrid = page.locator("[data-testid='training-475-role-grid']");
    const runbookDrawer = page.locator("[data-testid='training-475-runbook-drawer']");
    const evidenceLedger = page.locator("[data-testid='training-475-evidence-ledger']");
    const cadenceCalendar = page.locator("[data-testid='training-475-cadence-calendar']");
    const markComplete = page.locator("[data-testid='training-475-mark-complete']");
    await roleGrid.waitFor();
    assert(await markComplete.isDisabled(), "Constrained state must not mark training complete.");

    for (const roleId of [
      "clinician",
      "support_analyst",
      "governance_admin",
      "clinical_safety_officer",
      "incident_commander",
    ]) {
      const card = page.locator(`[data-testid='training-475-role-card-${roleId}']`);
      await card.waitFor();
      await card.click();
      await expectAttribute(centre, "data-selected-role-id", roleId);
    }

    await writeAriaSnapshot(roleGrid, "475-role-grid.aria.txt");
    await writeAriaSnapshot(runbookDrawer, "475-runbook-drawer.aria.txt");
    await writeAriaSnapshot(evidenceLedger, "475-evidence-ledger.aria.txt");
    await writeAriaSnapshot(cadenceCalendar, "475-cadence-calendar.aria.txt");
    await captureTrainingScreenshot(page, "475-constrained-training-centre.png");

    await page.locator("[data-testid='training-475-role-card-clinical_safety_officer']").click();
    await page.locator("[data-testid='training-475-close-module-details']").click();
    const activeTestId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
    );
    assert.equal(
      activeTestId,
      "training-475-role-card-clinical_safety_officer",
      "Focus should return to the selected role card after closing module details.",
    );

    const visibleText = await centre.evaluate((node: HTMLElement) => node.innerText);
    assert(
      visibleText.includes("Staff must review, revise, and approve assistive outputs"),
      "Assistive responsibility message should be visible.",
    );
    assert(
      visibleText.includes("NHS App channel is not live for this release"),
      "NHS App deferred-channel message should be visible.",
    );

    await gotoTraining(page, "complete", "clinician");
    await expectAttribute(centre, "data-readiness-state", "complete");
    assert(!(await markComplete.isDisabled()), "Complete state with exact evidence should enable action.");
    await captureTrainingScreenshot(page, "475-complete-training-centre.png");

    await gotoTraining(page, "blocked", "clinical_safety_officer");
    await expectAttribute(centre, "data-readiness-state", "blocked");
    await expectAttribute(centre, "data-mark-complete-action-state", "disabled_missing_evidence");
    assert(await markComplete.isDisabled(), "Missing clinical safety evidence must disable completion.");
    await expectAttribute(
      page.locator("[data-testid='training-475-role-card-clinical_safety_officer']"),
      "data-competency-state",
      "missing",
    );
    await captureTrainingScreenshot(page, "475-blocked-training-centre.png");

    await gotoTraining(page, "superseded_runbook", "release_manager");
    await expectAttribute(centre, "data-readiness-state", "blocked");
    await expectAttribute(centre, "data-mark-complete-action-state", "disabled_superseded_runbook");
    assert(await markComplete.isDisabled(), "Superseded runbook tuple must disable completion.");
    assert(
      (await runbookDrawer.evaluate((node: HTMLElement) => node.innerText)).includes("Superseded"),
      "Runbook drawer should expose superseded tuple state.",
    );
    await captureTrainingScreenshot(page, "475-superseded-runbook-training-centre.png");

    await page.setViewportSize({ width: 390, height: 980 });
    await gotoTraining(page, "constrained", "support_analyst");
    await expectAttribute(centre, "data-responsive-contract", "training_runbook_tables_preserved");
    assert(await roleGrid.isVisible(), "Mobile layout must keep role grid reachable.");
    assert(await runbookDrawer.isVisible(), "Mobile layout must keep runbook drawer reachable.");
    assert(await evidenceLedger.isVisible(), "Mobile layout must keep evidence table reachable.");
    await writeAriaSnapshot(centre, "475-mobile-constrained-centre.aria.txt");

    assertNoSensitiveSerialized(
      await centre.evaluate((node: HTMLElement) => node.innerText),
      "training runbook centre",
    );
    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "475-training-runbook-centre-success-trace.zip"),
    });
  } catch (error) {
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "475-training-runbook-centre-failure-trace.zip"),
    });
    throw error;
  } finally {
    await browser.close();
    await stopOpsConsole(server.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
