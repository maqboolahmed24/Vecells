import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, wait, waitForHttp } from "./simulator-backplane-test-helpers.js";
import {
  build488ScenarioRecords,
  OUTPUT_ROOT,
  write488LaunchEvidenceArchiveArtifacts,
} from "../../tools/archive/archive_488_launch_evidence";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "governance-console");
const APP_PORT = 4414;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;
const OUTPUT_DIR = path.join(ROOT, OUTPUT_ROOT, "evidence-vault");

const forbiddenSurfacePatterns =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawRouteParam|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+44|0)\d{9,}/i;

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

async function startGovernanceConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(APP_PORT), "--strictPort"],
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
    await waitForHttp(
      `${APP_URL}/ops/governance/evidence-vault?vaultState=sealed_with_exceptions&vaultRole=governance_admin`,
      30_000,
    );
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

function assertNoSensitiveSerialized(value: string, label: string): void {
  assert(!value.match(forbiddenSurfacePatterns), `${label} exposed sensitive marker text`);
}

async function expectAttribute(locator: any, name: string, expected: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 4_000) {
    const value = await locator.getAttribute(name);
    if (value === expected) return;
    await wait(50);
  }
  const value = await locator.getAttribute(name);
  assert.equal(value, expected, `Expected ${name}=${expected}, found ${value}.`);
}

async function gotoVault(page: any, state: string, role = "governance_admin"): Promise<any> {
  await page.goto(`${APP_URL}/ops/governance/evidence-vault?vaultState=${state}&vaultRole=${role}`, {
    waitUntil: "networkidle",
  });
  const vault = page.locator("[data-testid='evidence-vault-488']");
  await vault.waitFor();
  await vault.scrollIntoViewIfNeeded();
  return vault;
}

async function writeAriaSnapshot(locator: any, name: string): Promise<string> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const serialized =
    typeof locator.ariaSnapshot === "function"
      ? String(await locator.ariaSnapshot())
      : String(await locator.evaluate((node: HTMLElement) => node.innerText));
  const target = path.join(OUTPUT_DIR, name);
  fs.writeFileSync(target, serialized);
  assertNoSensitiveSerialized(serialized, name);
  return path.relative(ROOT, target);
}

async function captureVaultScreenshot(locator: any, name: string): Promise<string> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const target = path.join(OUTPUT_DIR, name);
  await locator.screenshot({ path: target, animations: "disabled", caret: "hide" });
  const text = await locator.evaluate((node: HTMLElement) => node.innerText);
  assertNoSensitiveSerialized(text, name);
  return path.relative(ROOT, target);
}

async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assert(
    metrics.scrollWidth <= metrics.clientWidth + 2 &&
      metrics.bodyScrollWidth <= metrics.clientWidth + 2,
    `${label} has horizontal overflow: ${JSON.stringify(metrics)}`,
  );
}

async function assertFocusReturnsTo(page: any, testId: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 2_000) {
    const activeTestId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset.testid,
    );
    if (activeTestId === testId) return;
    await wait(50);
  }
  const activeTestId = await page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.dataset.testid,
  );
  assert.equal(activeTestId, testId, "Focus should return to the selected evidence card.");
}

function writeArtifactManifest(entries: readonly { readonly scenarioId: string; readonly artifactRef: string }[]): void {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "488-evidence-vault.artifact-manifest.json"),
    `${JSON.stringify(
      {
        recordType: "EvidenceVault488ArtifactManifest",
        generatedAt: "2026-04-28T00:00:00.000Z",
        entries,
      },
      null,
      2,
    )}\n`,
  );
}

export async function run(): Promise<void> {
  fs.rmSync(path.join(ROOT, OUTPUT_ROOT), { recursive: true, force: true });
  write488LaunchEvidenceArchiveArtifacts();
  const firstRecords = build488ScenarioRecords("sealed_with_exceptions", []);
  const secondRecords = build488ScenarioRecords("sealed_with_exceptions", []);
  assert.equal(firstRecords.manifest.recordHash, secondRecords.manifest.recordHash);
  assert.equal(firstRecords.manifest.wormSealDigest, secondRecords.manifest.wormSealDigest);

  const playwright = await importPlaywright();
  const server = await startGovernanceConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1120 },
    reducedMotion: "reduce",
    colorScheme: "light",
    forcedColors: "active",
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  page.on("console", (message: any) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error: Error) => pageErrors.push(error.message));
  page.on("requestfailed", (request: any) => {
    const url = request.url();
    if (!url.includes("/@vite/client") && !url.includes("favicon")) {
      requestFailures.push(`${request.method()} ${url}`);
    }
  });

  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    const exceptions = await gotoVault(page, "sealed_with_exceptions", "governance_admin");
    await expectAttribute(exceptions, "data-archive-verdict", "sealed_with_exceptions");
    await expectAttribute(exceptions, "data-export-action-state", "enabled");
    await page.locator("[data-testid='evidence-vault-488-top-strip']").waitFor();
    await page.locator("[data-testid='evidence-vault-488-shelves']").waitFor();
    await page.locator("[data-testid='evidence-vault-488-cards']").waitFor();
    await page.locator("[data-testid='evidence-vault-488-capa-table']").waitFor();
    await page.locator("[data-testid='evidence-vault-488-right-rail']").waitFor();
    assert(!(await page.locator("[data-testid='evidence-vault-488-export-action']").isDisabled()));
    assertNoSensitiveSerialized(await exceptions.evaluate((node: HTMLElement) => node.innerText), "exceptions vault");
    await assertNoHorizontalOverflow(page, "sealed with exceptions vault");

    entries.push({
      scenarioId: "sealed_with_exceptions",
      artifactRef: await writeAriaSnapshot(
        page.locator("[data-testid='evidence-vault-488-shelves']"),
        "488-shelves.aria.txt",
      ),
    });
    const firstCard = page.locator("[data-testid^='evidence-vault-488-card-']").first();
    const firstCardTestId = String(await firstCard.getAttribute("data-testid"));
    entries.push({
      scenarioId: "sealed_with_exceptions",
      artifactRef: await writeAriaSnapshot(firstCard, "488-first-evidence-card.aria.txt"),
    });
    entries.push({
      scenarioId: "sealed_with_exceptions",
      artifactRef: await writeAriaSnapshot(
        page.locator("[data-testid='evidence-vault-488-capa-table']"),
        "488-capa-table.aria.txt",
      ),
    });
    entries.push({
      scenarioId: "sealed_with_exceptions",
      artifactRef: await captureVaultScreenshot(exceptions, "488-sealed-with-exceptions-vault.png"),
    });

    await firstCard.focus();
    await page.keyboard.press("Enter");
    const drawer = page.locator("[data-testid='evidence-vault-488-retention-drawer']");
    await drawer.waitFor();
    entries.push({
      scenarioId: "retention_drawer",
      artifactRef: await writeAriaSnapshot(drawer, "488-retention-drawer.aria.txt"),
    });
    await page.locator("[data-testid='evidence-vault-488-close-retention-drawer']").click();
    await assertFocusReturnsTo(page, firstCardTestId);

    await page.locator("[data-testid='evidence-vault-488-export-action']").click();
    const dialog = page.locator("[data-testid='evidence-vault-488-export-dialog']");
    await dialog.waitFor();
    entries.push({
      scenarioId: "export_dialog",
      artifactRef: await writeAriaSnapshot(dialog, "488-export-dialog.aria.txt"),
    });

    const sealed = await gotoVault(page, "sealed", "governance_admin");
    await expectAttribute(sealed, "data-archive-verdict", "sealed");
    await expectAttribute(sealed, "data-export-action-state", "enabled");
    entries.push({
      scenarioId: "sealed",
      artifactRef: await captureVaultScreenshot(sealed, "488-sealed-vault.png"),
    });

    const blocked = await gotoVault(page, "blocked", "governance_admin");
    await expectAttribute(blocked, "data-archive-verdict", "blocked");
    await expectAttribute(blocked, "data-export-posture", "blocked");
    await expectAttribute(blocked, "data-export-action-state", "disabled_posture");
    assert(await page.locator("[data-testid='evidence-vault-488-export-action']").isDisabled());
    entries.push({
      scenarioId: "blocked",
      artifactRef: await captureVaultScreenshot(blocked, "488-blocked-vault.png"),
    });

    const quarantined = await gotoVault(page, "quarantined", "governance_admin");
    await expectAttribute(quarantined, "data-archive-verdict", "sealed_with_exceptions");
    await expectAttribute(quarantined, "data-export-posture", "quarantined");
    await expectAttribute(quarantined, "data-export-action-state", "disabled_posture");
    assert(await page.locator("[data-seal-state='quarantined']").count() > 0);
    assert(await page.locator("[data-testid='evidence-vault-488-export-action']").isDisabled());
    entries.push({
      scenarioId: "quarantined",
      artifactRef: await captureVaultScreenshot(quarantined, "488-quarantined-vault.png"),
    });

    const viewer = await gotoVault(page, "sealed_with_exceptions", "viewer");
    await expectAttribute(viewer, "data-export-action-state", "disabled_role");
    assert(await page.locator("[data-testid='evidence-vault-488-export-action']").isDisabled());

    await page.setViewportSize({ width: 390, height: 960 });
    const mobile = await gotoVault(page, "sealed_with_exceptions", "governance_admin");
    await page.locator("[data-testid='evidence-vault-488-shelves']").waitFor();
    await assertNoHorizontalOverflow(page, "mobile evidence vault");
    entries.push({
      scenarioId: "mobile",
      artifactRef: await writeAriaSnapshot(mobile, "488-mobile-evidence-vault.aria.txt"),
    });

    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
    await context.tracing.stop({ path: path.join(OUTPUT_DIR, "488-evidence-vault-success.trace.zip") });
    entries.push({
      scenarioId: "trace",
      artifactRef: path.relative(ROOT, path.join(OUTPUT_DIR, "488-evidence-vault-success.trace.zip")),
    });
    writeArtifactManifest(entries);
  } catch (error) {
    await context.tracing.stop({ path: path.join(OUTPUT_DIR, "488-evidence-vault-failure.trace.zip") });
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
