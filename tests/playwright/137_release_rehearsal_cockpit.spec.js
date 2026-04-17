import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "tests", "137_release_rehearsal_cockpit.html");
const RESULTS_PATH = path.join(ROOT, "data", "test", "137_rehearsal_results.json");
const EXPECTATIONS_PATH = path.join(ROOT, "data", "test", "137_release_rehearsal_expectations.json");

const RESULTS = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
const EXPECTATIONS = JSON.parse(fs.readFileSync(EXPECTATIONS_PATH, "utf8"));
const CHILD_SPEC_REFS = [
  "preview-environment-control-room.spec.js",
  "release-candidate-freeze-board.spec.js",
  "release-watch-pipeline-cockpit.spec.js",
  "resilience-baseline-cockpit.spec.js",
  "canary-and-rollback-cockpit.spec.js",
];

export const releaseRehearsalCockpitCoverage = [
  "freeze-state suppression of interactive controls",
  "canary start/widen/rollback state transitions in the cockpit",
  "restore timeline rendering and readiness gating",
  "keyboard navigation and landmarks",
  "reduced-motion handling",
  "responsive desktop/tablet layout",
  "diagram/table parity",
  "child-proof orchestration of preview, freeze, watch, resilience, and canary proof surfaces",
];

function assertCondition(condition, message) {
  assert.equal(Boolean(condition), true, message);
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/tests/137_release_rehearsal_cockpit.html"
          : rawUrl.split("?")[0];
      const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
      const filePath = path.join(ROOT, safePath);
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind seq_137 static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/tests/137_release_rehearsal_cockpit.html`,
      });
    });
  });
}

async function runChildSpec(filename) {
  await new Promise((resolve, reject) => {
    const child = spawn("node", [filename, "--run"], {
      cwd: __dirname,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const logs = [];
    child.stdout.on("data", (chunk) => logs.push(String(chunk)));
    child.stderr.on("data", (chunk) => logs.push(String(chunk)));
    child.once("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }
      reject(new Error(`${filename} failed.\n${logs.join("")}`));
    });
  });
}

async function assertCockpit(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1180 } });
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "release-rehearsal-cockpit",
      "cockpit-masthead",
      "tuple-hash-badge",
      "blocked-action-count",
      "control-rail",
      "case-rail",
      "freeze-trust-ribbon",
      "wave-ladder",
      "observation-window-chart",
      "restore-timeline",
      "action-results-table",
      "restore-readiness-table",
      "inspector",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    assertCondition(
      (await page.locator("[data-testid='masthead-verdict']").innerText()).trim() === EXPECTATIONS.suite_verdict,
      "seq_137 verdict drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='tuple-hash-badge']").innerText()).trim() === EXPECTATIONS.active_tuple_hash,
      "seq_137 tuple hash drifted.",
    );
    assertCondition(
      Number((await page.locator("[data-testid='blocked-action-count']").innerText()).trim()) ===
        EXPECTATIONS.blocked_action_count,
      "seq_137 blocked action count drifted.",
    );

    const actionRows = await page.locator("[data-testid='action-results-table'] tbody tr").count();
    const restoreRows = await page.locator("[data-testid='restore-readiness-table'] tbody tr").count();
    assertCondition(actionRows === RESULTS.summary.rehearsal_case_count, "Action table row count drifted.");
    assertCondition(restoreRows === RESULTS.summary.restore_readiness_case_count, "Restore table row count drifted.");
    assertCondition(
      (await page.locator("[data-testid='wave-ladder-table'] tbody tr").count()) === 5,
      "Wave ladder table parity drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='observation-window-table'] tbody tr").count()) ===
        RESULTS.summary.wave_observation_case_count,
      "Observation table parity drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='restore-timeline-table'] tbody tr").count()) ===
        RESULTS.summary.restore_readiness_case_count,
      "Restore timeline table parity drifted.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("preprod");
    assertCondition(
      (await page.locator("[data-testid='case-rail'] .case-button").count()) === 3,
      "Preprod filter should surface three cases.",
    );

    await page.locator("[data-testid='case-button-PREPROD_CHANNEL_FREEZE_BLOCKS_PROMOTION']").click();
    const inspectorFreeze = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorFreeze.includes("PREPROD_CHANNEL_FREEZE_BLOCKS_PROMOTION") &&
        inspectorFreeze.includes("suppressed"),
      "Freeze-state suppression of interactive controls no longer renders in the inspector.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-action-class']").selectOption("canary_start");
    assertCondition(
      (await page.locator("[data-testid='case-rail'] .case-button").count()) === 1,
      "Canary start filter drifted.",
    );
    let inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("accepted_pending_observation"),
      "Canary start no longer shows accepted-pending-observation state.",
    );

    await page.locator("[data-testid='filter-action-class']").selectOption("widen_resume");
    assertCondition(
      (await page.locator("[data-testid='case-rail'] .case-button").count()) === 1,
      "Widen or resume filter drifted.",
    );
    inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("satisfied_but_live_withheld"),
      "Canary widen no longer keeps applied success withheld.",
    );

    await page.locator("[data-testid='filter-action-class']").selectOption("rollback");
    assertCondition(
      (await page.locator("[data-testid='case-rail'] .case-button").count()) === 1,
      "Rollback filter drifted.",
    );
    inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("rollback_required") &&
        inspectorText.includes("recovery_only"),
      "Rollback case lost authoritative rollback-required posture.",
    );

    await page.locator("[data-testid='filter-action-class']").selectOption("all");
    await page.locator("[data-testid='filter-environment']").selectOption("local");
    await page.locator("[data-testid='case-button-LOCAL_CANARY_START_ACCEPTED_PENDING_OBSERVATION']").focus();
    await page.keyboard.press("ArrowDown");
    assertCondition(
      (await page
        .locator("[data-testid='case-button-LOCAL_WIDEN_RESUME_ONLY_AFTER_SATISFIED_OBSERVATION']")
        .getAttribute("data-selected")) === "true",
      "Arrow-key navigation no longer advances selection across the case rail.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-action-class']").selectOption("restore_validation");
    inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("LOCAL_RESTORE_REQUIRES_JOURNEY_VALIDATION_AND_FRESH_RUNBOOK") &&
        inspectorText.includes("diagnostic_only_nonprod") &&
        inspectorText.includes("restore_verified_live_withheld"),
      "Restore validation case no longer keeps recovery proof bounded and live-withheld in the inspector.",
    );
    const restoreTimelineText = await page.locator("[data-testid='restore-timeline-table']").innerText();
    assertCondition(
      restoreTimelineText.includes("LOCAL_EXACT_READY") &&
        restoreTimelineText.includes("no"),
      "Restore timeline table lost live-authority gating.",
    );

    assertCondition(
      (await page.locator("header[data-testid='cockpit-masthead']").count()) === 1,
      "Header landmark is missing.",
    );
    assertCondition(
      (await page.locator("main[data-testid='cockpit-canvas']").count()) === 1,
      "Main landmark is missing.",
    );
    assertCondition(
      (await page.locator("aside[data-testid='inspector']").count()) === 1,
      "Inspector landmark is missing.",
    );
    assertCondition(
      (await page.locator("nav[data-testid='control-rail']").count()) === 1,
      "Navigation landmark is missing.",
    );

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 920 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body").getAttribute("data-reduced-motion")) === "true",
        "Reduced-motion posture did not activate.",
      );
      assertCondition(
        (await motionPage.locator("[data-testid='observation-window-table'] tbody tr").count()) ===
          RESULTS.summary.wave_observation_case_count,
        "Reduced motion changed observation table parity.",
      );
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 980, height: 1080 });
    assertCondition(
      await page.locator("[data-testid='observation-window-chart']").isVisible(),
      "Observation chart disappeared at tablet width.",
    );
    assertCondition(
      await page.locator("[data-testid='restore-readiness-table']").isVisible(),
      "Restore readiness table disappeared at tablet width.",
    );
    const widthSafe = await page.evaluate(() => document.documentElement.scrollWidth <= 1000);
    assertCondition(widthSafe, "Responsive layout overflowed horizontally.");
  } finally {
    await page.close();
  }
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Release rehearsal cockpit HTML is missing.");
  assert.deepEqual(
    EXPECTATIONS.orchestrated_spec_refs,
    CHILD_SPEC_REFS,
    "seq_137 orchestrated child-proof spec refs drifted.",
  );
  const { chromium } = await importPlaywright();
  const { server, url } = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  try {
    await assertCockpit(browser, url);
    for (const specRef of CHILD_SPEC_REFS) {
      await runChildSpec(specRef);
    }
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
