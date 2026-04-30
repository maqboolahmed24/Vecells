import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "111_accessibility_harness.html");
const ACCESSIBILITY_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "accessibility_semantic_coverage_profiles.json",
);
const ANNOUNCEMENT_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "assistive_announcement_examples.json",
);

const ACCESSIBILITY = JSON.parse(fs.readFileSync(ACCESSIBILITY_PATH, "utf8"));
const ANNOUNCEMENTS = JSON.parse(fs.readFileSync(ANNOUNCEMENT_PATH, "utf8"));

export const accessibilityHarnessCoverage = [
  "keyboard-only scenario and trigger activation",
  "focus preservation for same-shell and buffered updates",
  "focus moves only on contracted invalidation and recovery flows",
  "reduced-motion equivalence keeps the same semantic outcome",
  "zoom-driven stacked reflow keeps the same verification truth",
  "chart-to-table parity downgrade stays in the same shell",
  "root DOM markers publish focus target, announcement authority, and parity state",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForAttribute(locator, name, expected, message, timeoutMs = 3_000) {
  const startedAt = Date.now();
  let latest = null;
  while (Date.now() - startedAt < timeoutMs) {
    latest = await locator.getAttribute(name);
    if (latest === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`${message} Last observed ${name}: ${latest}`);
}

async function waitForActiveFocusTarget(page, expected, message, timeoutMs = 3_000) {
  const startedAt = Date.now();
  let latest = null;
  while (Date.now() - startedAt < timeoutMs) {
    latest = await page.evaluate(() =>
      document.activeElement?.getAttribute("data-focus-target-ref"),
    );
    if (latest === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`${message} Last observed active focus target: ${latest}`);
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw error;
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/111_accessibility_harness.html";
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
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html; charset=utf-8"
          : extension === ".json"
            ? "application/json; charset=utf-8"
            : extension === ".csv"
              ? "text/csv; charset=utf-8"
              : extension === ".css"
                ? "text/css; charset=utf-8"
                : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind accessibility harness static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/111_accessibility_harness.html`,
      });
    });
  });
}

function trackExternalRequests(page, baseOrigin, externalRequests) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(baseOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Accessibility harness HTML is missing.");
  assertCondition(
    ACCESSIBILITY.summary.accessibility_profile_count === 19,
    "Accessibility base profile count drifted.",
  );
  assertCondition(
    ACCESSIBILITY.harness_summary.focus_transition_contract_count === 133,
    "Focus transition contract count drifted.",
  );
  assertCondition(
    ACCESSIBILITY.harness_summary.keyboard_interaction_contract_count === 19,
    "Keyboard interaction contract count drifted.",
  );
  assertCondition(
    ANNOUNCEMENTS.summary.example_count === 14,
    "Announcement example count drifted.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1540, height: 1200 } });
    const page = await context.newPage();
    const baseOrigin = new URL(url).origin;
    const externalRequests = new Set();
    trackExternalRequests(page, baseOrigin, externalRequests);

    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "accessibility-harness-root",
      "harness-masthead",
      "scenario-rail",
      "live-specimen-pane",
      "verification-pane",
      "focus-trail",
      "keyboard-model-panel",
      "transcript-panel",
      "parity-panel",
      "breakpoint-strip",
      "motion-strip",
      "zoom-strip",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const root = page.locator("[data-testid='accessibility-harness-root']");
    const scenarioCount = await page.locator("[data-scenario-id]").count();
    assertCondition(scenarioCount === 6, "Expected 6 harness scenarios.");

    await page.locator("[data-scenario-id='SCN_PATIENT_REQUEST_BUFFERED_PRESERVE']").focus();
    await page.keyboard.press("Enter");
    await page.locator("[data-focus-target-ref='focus.current.patient_requests']").waitFor();

    await page.locator("[data-testid='trigger-buffered_update']").focus();
    await page.keyboard.press("Enter");
    await waitForAttribute(
      root,
      "data-current-focus-target",
      "focus.current.patient_requests",
      "Buffered update should preserve patient request focus.",
    );
    await waitForActiveFocusTarget(
      page,
      "focus.current.patient_requests",
      "Buffered update moved actual browser focus unexpectedly.",
    );

    await page.locator("[data-testid='trigger-restore']").focus();
    await page.keyboard.press("Enter");
    await waitForAttribute(
      root,
      "data-current-focus-target",
      "focus.selected_anchor.patient_requests",
      "Restore should return patient requests to the selected anchor.",
    );
    await waitForActiveFocusTarget(
      page,
      "focus.selected_anchor.patient_requests",
      "Restore did not move browser focus to the selected anchor.",
    );

    await page.locator("[data-scenario-id='SCN_SUPPORT_BLOCKED_RECOVERY']").focus();
    await page.keyboard.press("Enter");
    await page.locator("[data-focus-target-ref='focus.current.support_replay_observe']").waitFor();
    await waitForActiveFocusTarget(
      page,
      "focus.current.support_replay_observe",
      "Support scenario should settle initial focus before trigger activation.",
    );

    await page.locator("[data-testid='trigger-same_shell_refresh']").focus();
    await page.keyboard.press("Enter");
    await waitForAttribute(
      root,
      "data-current-focus-target",
      "focus.current.support_replay_observe",
      "Same-shell refresh should preserve support replay focus.",
    );
    await waitForActiveFocusTarget(
      page,
      "focus.current.support_replay_observe",
      "Same-shell refresh should settle focus before the invalidation trigger.",
    );

    await page.locator("[data-testid='trigger-invalidation']").focus();
    await page.keyboard.press("Enter");
    await waitForAttribute(
      root,
      "data-current-focus-target",
      "focus.stub.support_replay_observe",
      "Support invalidation should move focus to the recovery stub.",
    );
    await waitForActiveFocusTarget(
      page,
      "focus.stub.support_replay_observe",
      "Support invalidation did not move browser focus to the recovery stub.",
    );

    await page.locator("[data-testid='trigger-recovery_return']").focus();
    await page.keyboard.press("Enter");
    await waitForAttribute(
      root,
      "data-current-focus-target",
      "focus.selected_anchor.support_replay_observe",
      "Recovery return should restore support replay focus to the selected anchor.",
    );
    await waitForActiveFocusTarget(
      page,
      "focus.selected_anchor.support_replay_observe",
      "Recovery return should settle selected-anchor focus before changing scenarios.",
    );

    await page.locator("[data-scenario-id='SCN_OPERATIONS_PARITY_DOWNGRADE']").focus();
    await page.keyboard.press("Enter");
    const baselineSummary = await page.locator("#summary-sentence").innerText();
    await waitForActiveFocusTarget(
      page,
      "focus.current.operations_board",
      "Operations scenario should settle initial focus before display toggles.",
    );

    await page.locator("#motion-options button").nth(1).focus();
    await page.keyboard.press("Enter");
    await waitForAttribute(
      root,
      "data-motion-mode",
      "reduced",
      "Reduced-motion toggle did not update the root marker.",
    );
    assertCondition(
      (await page.locator("#summary-sentence").innerText()) === baselineSummary,
      "Reduced motion should preserve the same summary meaning.",
    );
    await waitForActiveFocusTarget(
      page,
      "focus.current.operations_board",
      "Reduced-motion render should settle focus before zoom is changed.",
    );

    await page.locator("#zoom-options button").nth(1).focus();
    await page.keyboard.press("Enter");
    await waitForAttribute(
      root,
      "data-zoom-mode",
      "400",
      "Zoom toggle did not update the root marker.",
    );
    await waitForAttribute(
      root,
      "data-layout-mode",
      "stacked",
      "Zoom equivalent reflow should switch the harness into stacked layout mode.",
    );
    await waitForActiveFocusTarget(
      page,
      "focus.current.operations_board",
      "Zoom reflow should settle focus before the parity toggle is activated.",
    );

    await page.locator("[data-testid='toggle-parity-fallback']").focus();
    await page.keyboard.press("Enter");
    await waitForAttribute(
      root,
      "data-parity-state",
      "table_only",
      "Parity toggle should downgrade the operations scenario to table_only.",
    );
    assertCondition(
      await page.locator("[data-testid='visualization-chart']").isHidden(),
      "Chart surface should be hidden in table_only parity.",
    );
    assertCondition(
      await page.locator("[data-testid='visualization-table']").isVisible(),
      "Fallback table should stay visible in table_only parity.",
    );

    const announcementAuthority = await root.getAttribute("data-announcement-authority");
    assertCondition(
      Boolean(announcementAuthority) && announcementAuthority !== "none",
      "Announcement authority DOM marker is missing.",
    );
    const transcriptText = await page.locator("[data-testid='transcript-panel']").innerText();
    assertCondition(
      transcriptText.includes("current") && transcriptText.includes("deduplicated"),
      "Transcript panel lost the required status labels.",
    );

    assertCondition(
      externalRequests.size === 0,
      `Accessibility harness should stay self-contained, but requested ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
