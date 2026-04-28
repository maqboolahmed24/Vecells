import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";
import {
  build477FinalSignoffArtifacts,
  write477FinalSignoffArtifacts,
} from "../../tools/assurance/prepare_477_final_signoffs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "governance-console");
const APP_URL = "http://127.0.0.1:4352";
const OUTPUT_DIR = path.join(ROOT, "output", "playwright", "477-signoff-cockpit");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|@nhs\.net/i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startGovernanceConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4352", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/release?signoffState=ready_with_constraints`, 25_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`governance-console failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

async function stopGovernanceConsole(child: ChildProcessWithoutNullStreams): Promise<void> {
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

async function captureCockpitScreenshot(page: any, name: string): Promise<void> {
  const screenshotPath = path.join(OUTPUT_DIR, name);
  await page.locator("[data-testid='final-477-signoff-cockpit']").screenshot({
    path: screenshotPath,
  });
  assertNoSensitiveSerialized(fs.readFileSync(screenshotPath), name);
}

async function gotoCockpit(page: any, state: string): Promise<any> {
  await page.goto(`${APP_URL}/ops/release?signoffState=${state}`, { waitUntil: "networkidle" });
  const cockpit = page.locator("[data-testid='final-477-signoff-cockpit']");
  await cockpit.waitFor();
  await cockpit.scrollIntoViewIfNeeded();
  return cockpit;
}

export async function run(): Promise<void> {
  write477FinalSignoffArtifacts();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  assert.equal(
    build477FinalSignoffArtifacts("missing_signoff").finalSignoffRegister.signoffReviewPermitted,
    false,
    "API-side missing signoff fixture must block approval.",
  );
  assert.equal(
    build477FinalSignoffArtifacts("tuple_mismatch").finalSignoffRegister.signoffReviewPermitted,
    false,
    "API-side tuple mismatch fixture must block approval.",
  );

  const playwright = await importPlaywright();
  const server = await startGovernanceConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1280 },
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
    const cockpit = await gotoCockpit(page, "ready_with_constraints");
    await expectAttribute(cockpit, "data-overall-signoff-state", "ready_with_constraints");
    await expectAttribute(cockpit, "data-signoff-blocker-count", "0");
    await expectAttribute(
      cockpit,
      "data-launch-approval-action-state",
      "review_allowed_settlement_pending",
    );
    await writeAriaSnapshot(
      page.locator("[data-testid='final-477-signoff-lanes']"),
      "477-signoff-lanes.aria.txt",
    );
    await writeAriaSnapshot(
      page.locator("[data-testid='final-477-launch-decision-strip']"),
      "477-launch-decision-strip.aria.txt",
    );
    await writeAriaSnapshot(
      page.locator("[data-testid='final-477-exception-ledger']"),
      "477-exception-ledger.aria.txt",
    );
    await writeAriaSnapshot(
      page.locator("[data-testid='final-477-source-drawer']"),
      "477-source-drawer.aria.txt",
    );

    for (const lane of [
      "security",
      "clinical-safety",
      "privacy-records",
      "regulatory-dtac",
      "accessibility-usability",
    ]) {
      await page.locator(`[data-testid='final-477-lane-${lane}']`).waitFor();
    }

    await page.locator("[data-testid='final-477-filter-launch-blocking']").focus();
    await page.keyboard.press("Enter");
    assert(
      (await page.locator("[data-testid='final-477-exception-ledger']").innerText()).includes(
        "No exceptions in this filter",
      ),
      "Launch-blocking filter should be keyboard reachable and empty for constrained-ready state.",
    );

    const clinicalEvidence = page.locator(
      "[data-testid='final-477-evidence-row-seb_477_clinical_core_web_dcb0129']",
    );
    await clinicalEvidence.focus();
    await page.keyboard.press("Enter");
    const drawer = page.locator("[data-testid='final-477-source-drawer']");
    await drawer.waitFor();
    assert(
      (await drawer.innerText()).includes("Clinical Safety Officer"),
      "Source drawer must show signer identity.",
    );
    assert(
      (await drawer.innerText()).includes("ROLE_CLINICAL_SAFETY_LEAD"),
      "Source drawer must show signoff authority.",
    );
    assertNoSensitiveSerialized(await drawer.innerText(), "source drawer");
    await page.locator("[data-testid='final-477-close-source-drawer']").click();
    const activeTestId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
    );
    assert.equal(
      activeTestId,
      "final-477-evidence-row-seb_477_clinical_core_web_dcb0129",
      "Focus should return to the evidence row after closing the drawer.",
    );

    await page.locator("[data-testid='final-477-launch-approval-action']").click();
    const commandDialog = page.getByRole("dialog", {
      name: /Launch signoff command confirmation/i,
    });
    await commandDialog.waitFor();
    assert(
      await page.locator("[data-testid='final-477-command-confirm']").isDisabled(),
      "No signoff action may settle while backend command settlement is pending.",
    );
    await writeAriaSnapshot(commandDialog, "477-command-dialog.aria.txt");
    await page.getByRole("button", { name: /Close command review/i }).click();
    await captureCockpitScreenshot(page, "477-ready-with-constraints-signoff-cockpit.png");

    for (const state of ["ready", "blocked", "expired_signoff"]) {
      await gotoCockpit(page, state);
      await captureCockpitScreenshot(page, `477-${state.replace(/_/g, "-")}-signoff-cockpit.png`);
    }

    for (const state of ["missing_signoff", "expired_signoff", "tuple_mismatch", "blocked", "exception_blocking"]) {
      const stateCockpit = await gotoCockpit(page, state);
      await expectAttribute(stateCockpit, "data-launch-approval-action-state", "blocked_by_signoff");
      assert(
        await page.locator("[data-testid='final-477-launch-approval-action']").isDisabled(),
        `${state} must disable launch signoff approval review.`,
      );
    }

    await page.setViewportSize({ width: 390, height: 980 });
    await gotoCockpit(page, "ready_with_constraints");
    await page.locator("[data-testid='final-477-signoff-lanes']").waitFor();
    await page.locator("[data-testid='final-477-exception-ledger']").waitFor();
    await writeAriaSnapshot(cockpit, "477-mobile-signoff-cockpit.aria.txt");

    assertNoSensitiveSerialized(
      await page.locator("[data-testid='final-477-signoff-cockpit']").innerText(),
      "final signoff cockpit",
    );
    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "477-signoff-cockpit-success-trace.zip"),
    });
  } catch (error) {
    await context.tracing.stop({
      path: path.join(OUTPUT_DIR, "477-signoff-cockpit-failure-trace.zip"),
    });
    throw error;
  } finally {
    await browser.close();
    await stopGovernanceConsole(server.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
