import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "ops-console");
const APP_URL = "http://127.0.0.1:4316";
const OUTPUT_DIR = path.join(ROOT, ".artifacts", "operations-incidents-456");

const scenarioCases = [
  ["normal", "normal", "live", "live_control", "external_handoff_ready", "reported", "blocked"],
  ["empty", "empty", "live", "live_control", "summary_only", "not_applicable", "complete"],
  [
    "stale",
    "stale",
    "diagnostic_only",
    "diagnostic_only",
    "governed_preview",
    "superseded",
    "blocked",
  ],
  [
    "degraded",
    "degraded",
    "diagnostic_only",
    "diagnostic_only",
    "governed_preview",
    "reportable_pending_submission",
    "blocked",
  ],
  ["blocked", "blocked", "blocked", "blocked", "blocked", "insufficient_facts_blocked", "blocked"],
  [
    "permission-denied",
    "permission_denied",
    "blocked",
    "blocked",
    "summary_only",
    "insufficient_facts_blocked",
    "blocked",
  ],
  [
    "settlement-pending",
    "settlement_pending",
    "diagnostic_only",
    "diagnostic_only",
    "governed_preview",
    "reportable_pending_submission",
    "blocked",
  ],
];

function assertCondition(condition, message) {
  assert.equal(Boolean(condition), true, message);
}

async function startOpsConsole() {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4316", "--strictPort"],
    {
      cwd: APP_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  try {
    await waitForHttp(`${APP_URL}/ops/incidents`, 25_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`ops-console failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

async function stopOpsConsole(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function expectAttribute(locator, name, expected) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 3_000) {
    const value = await locator.getAttribute(name);
    if (value === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const value = await locator.getAttribute(name);
  assert.equal(value, expected, `Expected ${name}=${expected}, found ${value}.`);
}

async function writeAccessibilitySnapshot(page, name) {
  const accessibilityApi = page.accessibility;
  if (accessibilityApi?.snapshot) {
    const snapshot = await accessibilityApi.snapshot({ interestingOnly: false });
    fs.writeFileSync(path.join(OUTPUT_DIR, name), JSON.stringify(snapshot, null, 2));
    return JSON.stringify(snapshot);
  }
  const locatorSnapshot =
    typeof page.locator("body").ariaSnapshot === "function"
      ? await page.locator("body").ariaSnapshot()
      : await page.locator("body").evaluate((body) => body.innerText);
  fs.writeFileSync(path.join(OUTPUT_DIR, name), String(locatorSnapshot));
  return String(locatorSnapshot);
}

export async function run() {
  const playwright = await importPlaywright();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { child } = await startOpsConsole();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1120 },
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(`${APP_URL}/ops/incidents?state=normal`, { waitUntil: "networkidle" });
    const root = page.locator("[data-testid='ops-shell-root']");
    const desk = page.locator("[data-surface='incident-desk']");
    await root.waitFor();
    await desk.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/incidents");
    await expectAttribute(root, "data-ops-lens", "incidents");
    await expectAttribute(root, "data-layout-mode", "three_plane");
    await expectAttribute(root, "data-incident-binding-state", "live");
    await expectAttribute(root, "data-incident-action-control-state", "live_control");
    await expectAttribute(root, "data-incident-reportability-decision", "reported");
    await expectAttribute(desk, "data-reportability-decision", "reported");
    await page.locator("[data-surface='incident-command-strip']").waitFor();
    await page.locator("[data-surface='incident-queue']").waitFor();
    await page.locator("[data-surface='near-miss-intake']").waitFor();
    await page.locator("[data-surface='severity-board']").waitFor();
    await page.locator("[data-surface='containment-timeline']").waitFor();
    await page.locator("[data-surface='reportability-checklist']").waitFor();
    await page.locator("[data-surface='pir-panel']").waitFor();
    await page.locator("[data-surface='incident-capa-links']").waitFor();
    await page.locator("[data-surface='incident-evidence-links']").waitFor();
    await page.locator("[data-surface='incident-telemetry-redaction']").waitFor();
    assertCondition(
      (await page.locator("[data-surface='incident-queue'] [data-row-kind='near_miss']").count()) >=
        1,
      "Near-miss row is missing from the queue.",
    );
    assertCondition(
      (await page.locator("[data-testid='incident-action-close_review']").isDisabled()) === true,
      "Closure should stay blocked until PIR, CAPA, and reportability complete.",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "ops-incidents-normal-desktop.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='incident-filter-near_miss']").click();
    await expectAttribute(
      page.locator("[data-surface='incident-queue']"),
      "data-filter",
      "near_miss",
    );
    await expectAttribute(
      page.locator("[data-testid='incident-row-si_447_bba5b7a4610a530c']"),
      "data-filter-preserved",
      "true",
    );
    await page.locator("[data-testid='incident-row-nmr_447_training_near_miss']").click();
    await expectAttribute(desk, "data-selected-incident-ref", "nmr_447_training_near_miss");
    await expectAttribute(
      page.locator("[data-surface='severity-board']"),
      "data-severity",
      "near_miss",
    );

    await page.locator("[data-testid='near-miss-submit']").click();
    await page.locator("[data-testid='near-miss-error']").waitFor();
    await page
      .locator("[data-surface='near-miss-intake'] textarea")
      .fill("Escalation note was missing during the drill rehearsal.");
    await page.locator("[data-testid='near-miss-submit']").click();
    await expectAttribute(
      page.locator("[data-surface='near-miss-intake']"),
      "data-validation-state",
      "accepted_pending_settlement",
    );
    assertCondition(
      (await page.locator("[data-testid='near-miss-settlement']").innerText()).includes(
        "authoritative settlement is pending",
      ),
      "Near-miss valid submission did not show settlement copy.",
    );

    await page.locator("[data-testid='incident-evidence-investigation_timeline']").click();
    const returnDrawer = page.locator("[data-testid='incident-investigation-return']");
    await returnDrawer.waitFor();
    await expectAttribute(returnDrawer, "data-payload-class", "redacted_summary");
    assertCondition(
      ((await returnDrawer.getAttribute("data-safe-return-token")) ?? "").startsWith(
        "ORT_INCIDENT_",
      ),
      "Evidence drawer did not expose an OpsReturnToken-like safe return ref.",
    );

    const bodyText = await page.locator("body").innerText();
    for (const prohibited of ["NHS123", "DOB", "patient name", "full address"]) {
      assertCondition(!bodyText.includes(prohibited), `PHI leak marker visible: ${prohibited}`);
    }
    assertCondition(
      bodyText.includes("patientIdentifier"),
      "Redacted field list missing patientIdentifier.",
    );
    assertCondition(
      bodyText.includes("artifactFragment"),
      "Redacted field list missing artifactFragment.",
    );

    await page.locator("[data-testid='incident-filter-all']").click();
    await page.locator("[data-testid='incident-row-si_447_5f9d3a81126d4eb9']").focus();
    await page.keyboard.press("Enter");
    await expectAttribute(desk, "data-selected-incident-ref", "si_447_5f9d3a81126d4eb9");

    for (const [
      queryState,
      expectedState,
      bindingState,
      actionControlState,
      artifactState,
      reportabilityDecision,
      closureState,
    ] of scenarioCases) {
      await page.goto(`${APP_URL}/ops/incidents?state=${queryState}`, { waitUntil: "networkidle" });
      await root.waitFor();
      await desk.waitFor();
      await expectAttribute(root, "data-overview-state", expectedState);
      await expectAttribute(root, "data-incident-binding-state", bindingState);
      await expectAttribute(root, "data-incident-action-control-state", actionControlState);
      await expectAttribute(root, "data-incident-reportability-decision", reportabilityDecision);
      await expectAttribute(root, "data-incident-closure-state", closureState);
      await expectAttribute(desk, "data-binding-state", bindingState);
      await expectAttribute(desk, "data-action-control-state", actionControlState);
      await expectAttribute(desk, "data-artifact-state", artifactState);
      await expectAttribute(desk, "data-reportability-decision", reportabilityDecision);
      await expectAttribute(desk, "data-closure-state", closureState);
      await expectAttribute(
        page.locator("[data-surface='reportability-checklist']"),
        "data-reportability-decision",
        reportabilityDecision,
      );
      if (expectedState === "empty") {
        await page.locator("[data-testid='incident-queue-empty']").waitFor();
      }
      if (expectedState === "blocked") {
        await page.locator("[data-testid='containment-event-failed']").waitFor();
      }
      if (expectedState === "settlement_pending" || expectedState === "degraded") {
        assertCondition(
          (await page.locator("[data-testid='containment-event-pending']").count()) >= 1,
          "Pending containment event is missing.",
        );
      }
      if (expectedState === "permission_denied") {
        assertCondition(
          (await page.locator("[data-surface='severity-board']").innerText()).includes(
            "Role scope only permits metadata",
          ),
          "Permission-denied severity board did not show metadata-only scope.",
        );
      }
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-incidents-${expectedState}.png`),
        fullPage: true,
      });
    }

    for (const [label, viewport, expectedLayout] of [
      ["desktop", { width: 1440, height: 1120 }, "three_plane"],
      ["laptop", { width: 1200, height: 920 }, "three_plane"],
      ["tablet", { width: 900, height: 1180 }, "mission_stack"],
      ["narrow", { width: 390, height: 920 }, "mission_stack"],
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`${APP_URL}/ops/incidents?state=normal`, { waitUntil: "networkidle" });
      await expectAttribute(root, "data-layout-mode", expectedLayout);
      await desk.waitFor();
      await page.screenshot({
        path: path.join(OUTPUT_DIR, `ops-incidents-${label}.png`),
        fullPage: true,
      });
    }

    const aria = await writeAccessibilitySnapshot(page, "ops-incidents-aria.json");
    assertCondition(aria.includes("Incident Desk"), "ARIA snapshot lost Incident Desk.");
    assertCondition(aria.includes("Incident queue"), "ARIA snapshot lost Incident queue.");
    assertCondition(
      aria.includes("Containment timeline"),
      "ARIA snapshot lost containment timeline.",
    );
    assertCondition(
      aria.includes("Reportability checklist"),
      "ARIA snapshot lost reportability checklist.",
    );
    assert.deepEqual(consoleErrors, [], `Console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Page errors: ${pageErrors.join("\n")}`);

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(`${APP_URL}/ops/incidents?state=normal`, {
      waitUntil: "networkidle",
    });
    await reducedPage.locator("[data-surface='incident-desk']").waitFor();
    const transitionDuration = await reducedPage
      .locator(".ops-incident-row")
      .first()
      .evaluate((element) => window.getComputedStyle(element).transitionDuration);
    assertCondition(
      transitionDuration.includes("0.01ms") || transitionDuration.includes("1e-05s"),
      `Reduced-motion transition did not collapse as expected: ${transitionDuration}`,
    );
    await reducedPage.screenshot({
      path: path.join(OUTPUT_DIR, "ops-incidents-reduced-motion.png"),
      fullPage: true,
    });
    await reducedContext.close();
  } finally {
    await browser.close();
    await stopOpsConsole(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
