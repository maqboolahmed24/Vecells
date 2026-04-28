import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "performance", "168_burst_resilience_lab.html");
const LOAD_PROFILES_PATH = path.join(ROOT, "data", "performance", "168_load_profiles.yaml");
const FAULT_MATRIX_PATH = path.join(ROOT, "data", "performance", "168_resilience_fault_matrix.csv");
const BROWSER_BUDGETS_PATH = path.join(
  ROOT,
  "data",
  "performance",
  "168_browser_budget_targets.json",
);
const RESULTS_PATH = path.join(ROOT, "data", "performance", "168_suite_results.json");
const RUNNER_PATH = path.join(
  ROOT,
  "tools",
  "performance",
  "run_phase1_burst_resilience_suite.mjs",
);

export const burstResilienceBrowserCoverage = [
  "mobile",
  "tablet",
  "desktop",
  "projection_lag_read_model_delay_168",
  "notification_backlog_provider_delay_168",
  "sticky-footer focus",
  "reducedMotion",
  "throughput_wave_mark parity-table",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseProfiles(text) {
  const profiles = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- id:")) {
      current = { id: trimmed.replace("- id:", "").trim() };
      profiles.push(current);
    } else if (current && /^[a-zA-Z0-9_]+:/.test(trimmed)) {
      const [key, ...rest] = trimmed.split(":");
      current[key] = rest.join(":").trim();
    }
  }
  return profiles;
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/performance/168_burst_resilience_lab.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": filePath.endsWith(".html")
          ? "text/html; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : filePath.endsWith(".json")
              ? "application/json; charset=utf-8"
              : "text/plain; charset=utf-8",
      });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/performance/168_burst_resilience_lab.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= 1, `Page has horizontal overflow of ${overflow}px.`);
}

async function waitForLab(page) {
  await page.goto(page.url(), { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Burst_Resilience_Lab']").waitFor();
}

async function openLab(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Burst_Resilience_Lab']").waitFor();
}

async function assertVisibleTruth(page) {
  await page.locator("[data-testid='throughput_wave_mark']").waitFor();
  await page.locator("[data-testid='load-profile-ribbon']").waitFor();
  await page.locator("[data-testid='side-effect-integrity-braid']").waitFor();
  await page.locator("[data-testid='degraded-mode-ladder']").waitFor();
  await page.locator("[data-testid='metrics-table']").waitFor();
  await page.locator("[data-testid='fault-table']").waitFor();
  await page.locator("[data-testid='budget-table']").waitFor();
  await page.locator("[data-testid='parity-table']").waitFor();

  const bodyText = await page.locator("body").innerText();
  for (const forbidden of ["Everything is fine", "Notification sent", "All saved"]) {
    assertCondition(
      !bodyText.includes(forbidden),
      `Forbidden reassurance copy found: ${forbidden}`,
    );
  }
}

async function assertProjectionLagAndNotificationDelay(page) {
  await page.locator("[data-testid='profile-button-projection_lag_read_model_delay_168']").click();
  await page.locator("[data-testid='surface-mode']").waitFor();
  const projectionText = await page.locator("[data-testid='fault-inspector']").innerText();
  assertCondition(
    /stale|recovery|bounded degraded/i.test(projectionText),
    "Projection lag did not expose degraded recovery posture.",
  );
  assertCondition(
    !/you are detached from this request|generic detached failure/i.test(projectionText),
    "Projection lag exposed a generic detached error.",
  );

  await page
    .locator("[data-testid='profile-button-notification_backlog_provider_delay_168']")
    .click();
  const notificationText = await page.locator("[data-testid='fault-inspector']").innerText();
  assertCondition(
    /notification pending|pending|retry/i.test(notificationText),
    "Notification delay did not expose pending delivery truth.",
  );
  assertCondition(
    !/notification sent|delivery confirmed/i.test(notificationText.toLowerCase()),
    "Notification delay exposed premature reassurance.",
  );
}

async function assertStickyFooterAndFocus(page) {
  const footerBox = await page.locator("[data-testid='sticky-footer']").boundingBox();
  assertCondition(Boolean(footerBox), "Sticky footer is missing.");
  const viewport = page.viewportSize();
  assertCondition(Boolean(viewport), "Viewport is not available.");
  assertCondition(
    footerBox.y + footerBox.height <= viewport.height + 2,
    "Sticky footer is not visible within the viewport.",
  );
  await page.locator("#focus-main").click();
  const focusedId = await page.evaluate(() => document.activeElement?.id);
  assertCondition(focusedId === "lab-main", "Focus evidence button did not move focus to main.");
}

async function assertDiagramTableParity(page) {
  const parityText = await page.locator("[data-testid='parity-table']").innerText();
  for (const [visual, table] of [
    ["throughput_wave_mark", "metrics-table"],
    ["load-profile-ribbon", "load-profile-ribbon-table"],
    ["side-effect-integrity-braid", "side-effect-integrity-table"],
    ["degraded-mode-ladder", "degraded-mode-table"],
  ]) {
    assertCondition(parityText.includes(visual), `${visual} missing from parity table.`);
    assertCondition(parityText.includes(table), `${table} missing from parity table.`);
  }
}

async function assertReducedMotionParity(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await openLab(page, url);
    await assertVisibleTruth(page);
    await assertDiagramTableParity(page);
    const duration = await page
      .locator(".wave-path")
      .evaluate((element) => getComputedStyle(element).animationDuration);
    assertCondition(
      Number.parseFloat(duration) <= 1,
      `Reduced motion did not collapse animation duration: ${duration}`,
    );
    const reducedText = await page.locator("[data-testid='reduced-motion-state']").innerText();
    assertCondition(
      /Reduced motion parity is required/i.test(reducedText),
      "Reduced motion parity copy is missing.",
    );
  } finally {
    await context.close();
  }
}

function verifyStaticFixtures() {
  for (const filePath of [
    HTML_PATH,
    LOAD_PROFILES_PATH,
    FAULT_MATRIX_PATH,
    BROWSER_BUDGETS_PATH,
    RESULTS_PATH,
    RUNNER_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing fixture ${filePath}`);
  }
  const profiles = parseProfiles(fs.readFileSync(LOAD_PROFILES_PATH, "utf8"));
  const faults = parseCsv(fs.readFileSync(FAULT_MATRIX_PATH, "utf8"));
  const budgets = JSON.parse(fs.readFileSync(BROWSER_BUDGETS_PATH, "utf8"));
  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));
  assertCondition(profiles.length === results.fixtureCounts.loadProfiles, "Profile count drifted.");
  assertCondition(faults.length === results.fixtureCounts.faultMatrixRows, "Fault count drifted.");
  assertCondition(
    budgets.runtimeBudgets.maxDuplicateAuthoritativeSideEffects === 0,
    "Browser budgets allow duplicate authoritative side effects.",
  );
  assertCondition(
    results.globalInvariants.calmWritableDuringDegradationAllowed === false,
    "Suite results allow calm writable degraded posture.",
  );
}

function runServiceRunner() {
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "tsx",
      "./tools/performance/run_phase1_burst_resilience_suite.mjs",
      "--assert",
      "--json",
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 90_000,
    },
  );
  assertCondition(
    result.status === 0,
    `run_phase1_burst_resilience_suite.mjs failed\n${result.stdout}\n${result.stderr}`,
  );
  const summary = JSON.parse(result.stdout);
  const duplicateCount = summary.scenarios.reduce(
    (total, scenario) => total + scenario.duplicateAuthoritativeSideEffects,
    0,
  );
  assertCondition(duplicateCount === 0, "Service runner found duplicate side effects.");
}

async function runViewportChecks(browser, url) {
  for (const viewport of [
    { id: "mobile", width: 390, height: 844 },
    { id: "tablet", width: 820, height: 1180 },
    { id: "desktop", width: 1440, height: 960 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();
    try {
      await openLab(page, url);
      await waitForLab(page);
      await assertNoOverflow(page);
      await assertVisibleTruth(page);
      await assertProjectionLagAndNotificationDelay(page);
      await assertStickyFooterAndFocus(page);
      await assertDiagramTableParity(page);
    } catch (error) {
      throw new Error(`${viewport.id} burst resilience check failed: ${error.message}`, {
        cause: error,
      });
    } finally {
      await context.close();
    }
  }
}

export async function run() {
  verifyStaticFixtures();
  runServiceRunner();

  const { chromium } = await importPlaywright();
  const staticServer = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    await runViewportChecks(browser, staticServer.url);
    await assertReducedMotionParity(browser, staticServer.url);
  } finally {
    await browser.close();
    await closeServer(staticServer.server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.log("168_burst_resilience_lab.spec.js: syntax ok");
}
