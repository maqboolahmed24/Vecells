import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp, wait } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const ATLAS_PATH = path.join(ROOT, "docs", "tests", "136_shell_conformance_atlas.html");
const SMOKE_EXPECTATIONS_PATH = path.join(ROOT, "data", "test", "136_shell_smoke_expectations.json");
const SUITE_RESULTS_PATH = path.join(ROOT, "data", "test", "136_preview_environment_suite_results.json");

const SUITE_RESULTS = JSON.parse(fs.readFileSync(SUITE_RESULTS_PATH, "utf8"));
const SMOKE_EXPECTATIONS = JSON.parse(fs.readFileSync(SMOKE_EXPECTATIONS_PATH, "utf8"));

const ORCHESTRATED_SPECS = [
  "preview-environment-control-room.spec.js",
  "accessibility-semantic-coverage.spec.js",
  "patient-shell-seed-routes.spec.js",
  "staff-shell-seed-routes.spec.js",
  "operations-shell-seed-routes.spec.js",
  "hub-shell-seed-routes.spec.js",
  "governance-shell-seed-routes.spec.js",
  "pharmacy-shell-seed-routes.spec.js",
];

export const shellAccessibilityPreviewSmokeCoverage = [
  "atlas shell-family synchronization and diagram parity",
  "atlas keyboard navigation across shell rail, tabs, and result tables",
  "atlas responsive and reduced-motion verification",
  "cross-app landmark and heading sweep",
  "cross-app keyboard traversal smoke sweep",
  "same-shell suppression route sweep for every seeded shell family",
  "child-proof orchestration for preview environment, accessibility harness, and existing shell route specs",
];

function assertCondition(condition, message) {
  assert.equal(Boolean(condition), true, message);
}

async function allocatePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate a free port."));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function startStaticServer(defaultPath) {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = defaultPath;
    }
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const contentType =
      filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(undefined));
  });

  return {
    server,
    url: `http://127.0.0.1:${port}${defaultPath}`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function startViteApp(appDir, launchPath) {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: path.join(ROOT, appDir),
    env: {
      ...process.env,
      BROWSER: "none",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}${launchPath}`, 20_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Failed to start ${appDir}.\n${logs.join("")}`, { cause: error });
  }

  return { child, baseUrl, logs };
}

async function stopChild(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

function trackExternalRequests(page, baseOrigin, externalRequests) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(baseOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:") &&
      !requestUrl.startsWith("ws:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

async function assertHeadingIntegrity(page) {
  const headingLevels = await page.evaluate(() =>
    [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((element) =>
      Number(element.tagName.slice(1)),
    ),
  );
  assertCondition(headingLevels.length > 0, "Expected at least one heading.");
  assertCondition(
    headingLevels.filter((level) => level === 1).length === 1,
    `Expected exactly one h1, found ${headingLevels.filter((level) => level === 1).length}.`,
  );
  const uniqueLevels = [...new Set(headingLevels)].sort((left, right) => left - right);
  assertCondition(uniqueLevels[0] === 1, "Headings must start at h1.");
  for (let index = 1; index < uniqueLevels.length; index += 1) {
    assertCondition(
      uniqueLevels[index] - uniqueLevels[index - 1] <= 1,
      `Heading hierarchy skipped from h${uniqueLevels[index - 1]} to h${uniqueLevels[index]}.`,
    );
  }
}

async function assertLandmarks(page) {
  const headerCount = await page.locator("header, [role='banner']").count();
  const mainCount = await page.locator("main, [role='main']").count();
  assertCondition(headerCount >= 1, "Expected a shell header or banner landmark.");
  assertCondition(mainCount >= 1, "Expected a shell main landmark.");
}

async function assertKeyboardTraversal(page, rootTestId) {
  const focusableCount = await page.locator(
    `[data-testid='${rootTestId}'] button, [data-testid='${rootTestId}'] a, [data-testid='${rootTestId}'] [tabindex='0']`,
  ).count();
  assertCondition(focusableCount >= 3, `Expected at least 3 focusable elements inside ${rootTestId}.`);

  const descriptors = [];
  for (let index = 0; index < 3; index += 1) {
    await page.keyboard.press("Tab");
    const descriptor = await page.evaluate((testId) => {
      const root = document.querySelector(`[data-testid="${testId}"]`);
      const active = document.activeElement;
      const focusable = root
        ? [...root.querySelectorAll("button, a, [tabindex='0']")]
            .filter((element) => element instanceof HTMLElement && !element.hasAttribute("disabled"))
        : [];
      const focusIndex =
        active instanceof HTMLElement
          ? focusable.findIndex((element) => element === active)
          : -1;
      return {
        insideRoot: Boolean(root && active && root.contains(active)),
        tagName: active?.tagName ?? null,
        dataTestId: active?.getAttribute("data-testid"),
        ariaLabel: active?.getAttribute("aria-label"),
        text: active?.textContent?.trim().replace(/\s+/g, " ").slice(0, 48) ?? null,
        focusIndex,
      };
    }, rootTestId);
    assertCondition(descriptor.insideRoot, `Keyboard focus escaped ${rootTestId}.`);
    descriptors.push(
      `${descriptor.focusIndex}:${descriptor.tagName}:${descriptor.dataTestId ?? descriptor.ariaLabel ?? descriptor.text ?? "none"}`,
    );
  }

  assertCondition(new Set(descriptors).size >= 2, "Keyboard traversal did not move to distinct targets.");
}

async function assertAtlas(browser) {
  const { server, url } = await startStaticServer("/docs/tests/136_shell_conformance_atlas.html");
  try {
    const page = await browser.newPage({ viewport: { width: 1520, height: 1180 } });
    const baseOrigin = new URL(url).origin;
    const externalRequests = new Set();
    trackExternalRequests(page, baseOrigin, externalRequests);

    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "shell-conformance-atlas",
      "atlas-masthead",
      "shell-family-rail",
      "atlas-canvas",
      "topology-constellation",
      "topology-parity-table",
      "breakpoint-ladder",
      "breakpoint-parity-table",
      "accessibility-coverage-matrix",
      "accessibility-parity-table",
      "shell-inspector",
      "smoke-results-table",
      "accessibility-results-table",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    assert.equal(
      await page.locator("[data-testid='masthead-verdict']").innerText(),
      "release_withheld",
      "Atlas verdict drifted.",
    );
    assert.equal(
      await page.locator("[data-testid='masthead-failing-shell-count']").innerText(),
      String(SUITE_RESULTS.summary.suppressed_shell_count),
      "Atlas failing shell count drifted.",
    );

    await page.locator("[data-testid='shell-family-button-patient']").focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(
      await page.locator("[data-testid='shell-family-button-staff']").getAttribute("data-selected"),
      "true",
      "Arrow-key navigation no longer changes shell-family selection.",
    );

    await page.locator("[data-testid='shell-family-button-governance']").click();
    assert.equal(
      await page.locator("[data-testid='masthead-preview-label']").innerText(),
      "pev_rc_governance_audit",
      "Atlas preview label drifted after shell selection.",
    );

    await page.locator("[data-testid='tab-breakpoints']").click();
    await page.locator("[data-testid='breakpoint-panel']").waitFor({ state: "visible" });
    await page.locator("[data-testid='tab-accessibility']").focus();
    await page.keyboard.press("ArrowLeft");
    assert.equal(
      await page.locator("[data-testid='tab-breakpoints']").getAttribute("data-selected"),
      "true",
      "Tab-row keyboard navigation drifted.",
    );

    const firstSmokeRow = page.locator("[data-testid^='smoke-row-']").first();
    await firstSmokeRow.focus();
    await page.keyboard.press("Enter");
    const inspectorText = await page.locator("[data-testid='inspector-case-summary']").innerText();
    assertCondition(
      inspectorText.includes("/ops/governance"),
      "Smoke-row selection no longer synchronizes the inspector.",
    );

    await page.setViewportSize({ width: 920, height: 1100 });
    await page.locator("[data-testid='shell-inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assert.equal(
        await motionPage.locator("body").getAttribute("data-reduced-motion"),
        "true",
        "Reduced-motion marker did not activate on the atlas.",
      );
    } finally {
      await motionPage.close();
    }

    assert.equal(
      externalRequests.size,
      0,
      `Atlas made unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await page.close();
  } finally {
    await closeServer(server);
  }
}

async function runLiveShellSweep(browser) {
  for (const sweepCase of SMOKE_EXPECTATIONS.liveSweepCases) {
    const { child, baseUrl } = await startViteApp(sweepCase.appDir, sweepCase.launchPath);
    const baseOrigin = new URL(baseUrl).origin;
    const externalRequests = new Set();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1120 } });
      trackExternalRequests(page, baseOrigin, externalRequests);

      await page.goto(`${baseUrl}${sweepCase.launchPath}`, { waitUntil: "networkidle" });
      await page.locator(`[data-testid='${sweepCase.rootTestId}']`).waitFor();
      await assertLandmarks(page);
      await assertHeadingIntegrity(page);
      await assertKeyboardTraversal(page, sweepCase.rootTestId);

      await page.goto(`${baseUrl}${sweepCase.suppressionPath}`, { waitUntil: "networkidle" });
      await page.locator(`[data-testid='${sweepCase.rootTestId}']`).waitFor();
      await page.setViewportSize({ width: 760, height: 1180 });
      await wait(120);
      await page.locator(`[data-testid='${sweepCase.rootTestId}']`).waitFor();

      assert.equal(
        externalRequests.size,
        0,
        `Unexpected external requests for ${sweepCase.shellFamily}: ${Array.from(externalRequests).join(", ")}`,
      );
      await page.close();
    } finally {
      await stopChild(child);
    }
  }
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

export async function run() {
  assertCondition(fs.existsSync(ATLAS_PATH), "Shell conformance atlas HTML is missing.");
  assert.equal(SUITE_RESULTS.task_id, "seq_136", "Suite results drifted off seq_136.");
  assert.equal(SUITE_RESULTS.visual_mode, "Shell_Conformance_Atlas", "Visual mode drifted.");
  assert.equal(SMOKE_EXPECTATIONS.task_id, "seq_136", "Smoke expectations drifted off seq_136.");
  assert.equal(SUITE_RESULTS.summary.shell_family_count, 6, "Expected six shell families.");
  assert.equal(
    SUITE_RESULTS.summary.preview_shell_case_count,
    87,
    "Preview shell case count drifted.",
  );
  assert.equal(
    SUITE_RESULTS.summary.accessibility_case_count,
    87,
    "Accessibility case count drifted.",
  );

  const playwright = await importPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    await assertAtlas(browser);
    await runLiveShellSweep(browser);
  } finally {
    await browser.close();
  }

  for (const filename of ORCHESTRATED_SPECS) {
    await runChildSpec(filename);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
