import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PATIENT_APP_DIR = path.join(ROOT, "apps", "patient-web");
const SUPPORT_APP_DIR = path.join(ROOT, "apps", "clinical-workspace");
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");
const DATA_DIR = path.join(ROOT, "data", "test");
const LAB_PATH = "/docs/frontend/224_patient_support_continuity_assurance_lab.html";
const CASE_MATRIX_PATH = path.join(DATA_DIR, "224_continuity_case_matrix.csv");
const EXPECTATIONS_PATH = path.join(DATA_DIR, "224_expected_settlements_and_recoveries.json");
const RESULTS_PATH = path.join(DATA_DIR, "224_suite_results.json");
const DEFECT_LOG_PATH = path.join(DATA_DIR, "224_defect_log_and_remediation.json");
const TASK_ID =
  "seq_224_crosscutting_Playwright_or_other_appropriate_tooling_testing_run_patient_account_support_and_record_artifact_continuity_suites";
const SPEC_ID = "224_patient_support_record_artifact_continuity";
const STATUS_VOCABULARY = ["passed", "failed", "blocked_external", "not_applicable"];

export const patientSupportContinuityCoverage = [
  "patient shell continuity through home, detail, more-info, callback, refresh, back-button, and stale-link states",
  "support entry, inbox, ticket, child-tab, observe-only, and fallback continuity",
  "patient/support parity for live status, repair posture, and provisional communication handling",
  "record-artifact parity for verified summary, chart fallback, source-only handoff, and restricted placeholders",
  "masking, disclosure, and read-only artifact preservation",
  "signed-out and identity-hold recovery surfaces",
  "keyboard traversal, ARIA snapshots, reduced motion, high zoom, assurance-lab screenshots, and traces",
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

async function allocatePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate local port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // keep retrying
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startViteApp(appDir, readyPath) {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: appDir,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}${readyPath}`);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Vite app failed to start at ${appDir}.\n${logs.join("")}`, {
      cause: error,
    });
  }
  return { child, baseUrl };
}

async function stopProcess(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function startStaticServer() {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? LAB_PATH : decodeURIComponent(requestUrl.pathname);
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const extension = path.extname(filePath);
    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".json"
          ? "application/json; charset=utf-8"
          : extension === ".csv"
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(undefined));
  });
  return { server, labUrl: `http://127.0.0.1:${port}${LAB_PATH}` };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

function ensureDirs() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function outputPath(name) {
  return path.join(OUTPUT_DIR, name);
}

function evidencePath(name) {
  return `output/playwright/${name}`;
}

async function saveScreenshot(page, fileName) {
  await page.screenshot({ path: outputPath(fileName), fullPage: true });
  return evidencePath(fileName);
}

async function writeAccessibilitySnapshot(page, fileName) {
  const snapshot = await page.evaluate(() => {
    const selectors = [
      "header",
      "nav",
      "main",
      "aside",
      "section",
      "button",
      "[role='status']",
      "[role='tab']",
      "[role='tabpanel']",
      "[aria-label]",
      "[aria-live]",
      "[data-testid]",
    ];
    return Array.from(document.querySelectorAll(selectors.join(","))).map((node) => ({
      tag: node.tagName.toLowerCase(),
      role: node.getAttribute("role") || null,
      ariaLabel: node.getAttribute("aria-label") || null,
      ariaLive: node.getAttribute("aria-live") || null,
      testId: node.getAttribute("data-testid") || null,
      text: (node.textContent || "").trim().replace(/\s+/g, " ").slice(0, 220),
    }));
  });
  fs.writeFileSync(outputPath(fileName), JSON.stringify(snapshot, null, 2));
  return evidencePath(fileName);
}

function trackExternalRequests(page, allowedOrigin, collector) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(allowedOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:")
    ) {
      collector.add(requestUrl);
    }
  });
}

async function assertNoHorizontalOverflow(page, label, allowance = 2) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= allowance, `${label} overflowed horizontally by ${overflow}px`);
}

async function assertKeyboardFocusMoves(page, label) {
  await page.keyboard.press("Tab");
  const activeTag = await page.evaluate(
    () => document.activeElement?.tagName?.toLowerCase() || null,
  );
  assertCondition(activeTag !== null && activeTag !== "body", `${label} did not move focus on Tab`);
}

async function assertContrastRatio(page, selector, minRatio, label) {
  const ratio = await page.locator(selector).evaluate((element) => {
    const parse = (raw) => {
      const match = raw.match(/^rgba?\(([^)]+)\)$/i);
      if (!match) return [255, 255, 255];
      return match[1]
        .split(",")
        .slice(0, 3)
        .map((value) => Number(value.trim()));
    };
    const luminance = (rgb) => {
      const channel = rgb.map((value) => {
        const normalized = value / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
    };
    const computed = window.getComputedStyle(element);
    const foreground = luminance(parse(computed.color));
    const background = luminance(
      parse(
        computed.backgroundColor && computed.backgroundColor !== "rgba(0, 0, 0, 0)"
          ? computed.backgroundColor
          : "rgb(255, 255, 255)",
      ),
    );
    const lighter = Math.max(foreground, background);
    const darker = Math.min(foreground, background);
    return (lighter + 0.05) / (darker + 0.05);
  });
  assertCondition(ratio >= minRatio, `${label} contrast ratio ${ratio.toFixed(2)} fell below ${minRatio}`);
}

async function readPhase2Attrs(page, selector) {
  return await page.locator(selector).evaluate((node) => ({
    requestRef: node.getAttribute("data-shared-request-ref"),
    lineageRef: node.getAttribute("data-shared-lineage-ref"),
    causeClass: node.getAttribute("data-cause-class"),
    recoveryClass: node.getAttribute("data-recovery-class"),
    canonicalStatus: node.getAttribute("data-canonical-status-label"),
    shellMode: node.getAttribute("data-shell-mode"),
    motionMode: node.getAttribute("data-motion-mode"),
  }));
}

async function verifyLabels(page, labels, label) {
  for (const text of labels) {
    await page.getByText(text, { exact: true }).waitFor();
  }
  return `${label}: ${labels.join(", ")}`;
}

function findCase(matrixRows, caseId) {
  const row = matrixRows.find((candidate) => candidate.case_id === caseId);
  assertCondition(Boolean(row), `Case matrix row missing ${caseId}`);
  return row;
}

function createResults(matrixRows) {
  return {
    taskId: TASK_ID,
    specId: SPEC_ID,
    schemaVersion: "portal-support-crosscutting-continuity-suite-v1",
    visualMode: "Portal_Support_Continuity_Assurance_Lab",
    overallStatus: "running",
    mockNow: true,
    statusVocabulary: STATUS_VOCABULARY,
    repositoryOwnedDefectFinding: "resolved_in_seq_224",
    fixedDefectIds: ["CONT224_001", "CONT224_002"],
    executedAt: new Date().toISOString(),
    suiteCommands: {
      browser: "node /Users/test/Code/V/tests/playwright/224_patient_support_record_artifact_continuity.spec.js --run",
      validator: "python3 /Users/test/Code/V/tools/test/validate_crosscutting_continuity_suite.py",
    },
    sourceArtifacts: {
      caseMatrix: "data/test/224_continuity_case_matrix.csv",
      expectations: "data/test/224_expected_settlements_and_recoveries.json",
      recordParityCases: "data/test/224_record_parity_and_visibility_cases.csv",
      supportMaskingCases: "data/test/224_support_masking_and_fallback_cases.csv",
      defectLog: "data/test/224_defect_log_and_remediation.json",
    },
    fixtureCounts: {
      totalCases: matrixRows.length,
    },
    familyResults: [],
    caseResults: [],
    statusCounts: {
      passed: 0,
      failed: 0,
      blocked_external: 0,
      not_applicable: 0,
    },
    screenshotEvidence: [],
    ariaEvidence: [],
    traceEvidence: [],
    externalRequestViolations: [],
  };
}

function persistResults(results) {
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
}

function appendUnique(list, item) {
  if (!list.includes(item)) list.push(item);
}

function recordCase(results, row, status, actualResult, evidencePaths, defectId = null) {
  results.caseResults.push({
    caseId: row.case_id,
    sourceSection: row.source_section,
    scenarioFamily: row.scenario_family,
    routeFamily: row.route_family,
    governingLineage: row.governing_lineage,
    expectedPosture: row.expected_posture,
    expectedSettlementOrRecovery: row.expected_settlement_or_recovery,
    expectedStatusLabel: row.expected_status_label,
    expectedNextSafeAction: row.expected_next_safe_action,
    actualResult,
    evidencePaths,
    defectId,
    status,
  });
  results.statusCounts[status] += 1;
  for (const pathRef of evidencePaths) {
    if (pathRef.endsWith(".png")) appendUnique(results.screenshotEvidence, pathRef);
    if (pathRef.endsWith(".json")) appendUnique(results.ariaEvidence, pathRef);
    if (pathRef.endsWith(".zip")) appendUnique(results.traceEvidence, pathRef);
  }
}

async function runCase(results, row, execution) {
  try {
    const { actualResult, evidencePaths = [] } = await execution();
    recordCase(results, row, "passed", actualResult, evidencePaths);
  } catch (error) {
    recordCase(results, row, "failed", error instanceof Error ? error.message : String(error), []);
    persistResults(results);
    throw error;
  }
}

async function startTracedContext(browser, traceName, options = {}) {
  const context = await browser.newContext(options);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  return { context, tracePath: evidencePath(traceName), traceOutputPath: outputPath(traceName) };
}

async function stopTracedContext(context, traceOutputPath) {
  await context.tracing.stop({ path: traceOutputPath });
  await context.close();
}

async function runPatientFamily(results, matrixRows, browser, patientBaseUrl, externalRequests) {
  const { context, tracePath, traceOutputPath } = await startTracedContext(browser, "224-patient-family-trace.zip", {
    viewport: { width: 1440, height: 1080 },
  });
  const page = await context.newPage();
  trackExternalRequests(page, patientBaseUrl, externalRequests);
  try {
    const homeRow = findCase(matrixRows, "CONT224_PAT_HOME_TO_REQUEST_DETAIL");
    await runCase(results, homeRow, async () => {
      await page.goto(`${patientBaseUrl}/home`, { waitUntil: "networkidle" });
      await page.locator("[data-testid='Patient_Home_Requests_Detail_Route']").waitFor();
      const homeAria = await writeAccessibilitySnapshot(page, "224-patient-home-aria.json");
      await page.locator("[data-testid='home-spotlight-primary-action']").click();
      await page.waitForURL(`${patientBaseUrl}/requests/request_211_a`);
      await page.locator("[data-testid='patient-request-detail-route']").waitFor();
      const requestAttrs = await readPhase2Attrs(
        page,
        "[data-testid='Patient_Home_Requests_Detail_Route']",
      );
      assertCondition(requestAttrs.canonicalStatus === "Reply needed", "Patient request detail lost Reply needed status");
      const detailAria = await writeAccessibilitySnapshot(page, "224-patient-request-detail-aria.json");
      const screenshot = await saveScreenshot(page, "224-patient-home-requests-detail.png");
      return {
        actualResult: `Home primary action opened ${requestAttrs.requestRef} with ${requestAttrs.canonicalStatus}.`,
        evidencePaths: [homeAria, detailAria, screenshot],
      };
    });

    const moreInfoRow = findCase(matrixRows, "CONT224_PAT_MORE_INFO_DEEP_LINK");
    await runCase(results, moreInfoRow, async () => {
      await page.goto(`${patientBaseUrl}/requests/request_211_a/more-info`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-testid='More_Info_Callback_Contact_Repair_Route']").waitFor();
      await page.locator("[data-testid='prompt-step-card']").waitFor();
      await page.locator("[data-testid='continuity-preserved-panel']").waitFor();
      await page.getByText("/requests/request_211_a", { exact: true }).waitFor();
      const screenshot = await saveScreenshot(page, "224-patient-more-info-deep-link.png");
      return {
        actualResult: "More-info deep link kept the request return bundle and the governing request detail route visible.",
        evidencePaths: [screenshot],
      };
    });

    const callbackRow = findCase(matrixRows, "CONT224_PAT_CALLBACK_REPAIR_CHILD");
    await runCase(results, callbackRow, async () => {
      await page.goto(`${patientBaseUrl}/requests/request_211_a/callback/at-risk`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-testid='callback-status-rail']").waitFor();
      await page.locator("[data-testid='blocked-action-summary-card']").waitFor();
      const attrs = await readPhase2Attrs(page, "[data-testid='More_Info_Callback_Contact_Repair_Route']");
      assertCondition(attrs.causeClass === "repair_required", "Patient callback repair route lost repair_required cause class");
      const screenshot = await saveScreenshot(page, "224-patient-callback-repair.png");
      return {
        actualResult: `Callback repair route remained ${attrs.causeClass} with ${attrs.recoveryClass} recovery.`,
        evidencePaths: [screenshot],
      };
    });

    const messagesRow = findCase(matrixRows, "CONT224_PAT_MESSAGES_AND_BACK");
    await runCase(results, messagesRow, async () => {
      await page.goto(`${patientBaseUrl}/requests/request_211_a`, { waitUntil: "networkidle" });
      await page.locator("[data-testid='patient-request-detail-route']").waitFor();
      await page.goto(`${patientBaseUrl}/messages/cluster_214_derm/thread/thread_214_primary`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-testid='Health_Record_Communications_Route']").waitFor();
      await page.locator("[data-testid='conversation-braid']").waitFor();
      const messagesAria = await writeAccessibilitySnapshot(page, "224-patient-messages-aria.json");
      const screenshot = await saveScreenshot(page, "224-patient-messages-thread.png");
      await page.goBack({ waitUntil: "networkidle" });
      await page.locator("[data-testid='patient-request-detail-route']").waitFor();
      return {
        actualResult: "Messages thread opened with the same lineage and browser back returned to patient request detail without losing context.",
        evidencePaths: [messagesAria, screenshot],
      };
    });

    const refreshRow = findCase(matrixRows, "CONT224_PAT_REQUEST_REFRESH_REPLAY");
    await runCase(results, refreshRow, async () => {
      await page.goto(`${patientBaseUrl}/requests/request_211_a`, { waitUntil: "networkidle" });
      const before = await readPhase2Attrs(page, "[data-testid='Patient_Home_Requests_Detail_Route']");
      await page.reload({ waitUntil: "networkidle" });
      await page.locator("[data-testid='patient-request-detail-route']").waitFor();
      const after = await readPhase2Attrs(page, "[data-testid='Patient_Home_Requests_Detail_Route']");
      assertCondition(before.requestRef === after.requestRef, "Refresh replay drifted request ref");
      assertCondition(before.lineageRef === after.lineageRef, "Refresh replay drifted lineage ref");
      const screenshot = await saveScreenshot(page, "224-patient-request-refresh.png");
      return {
        actualResult: `Refresh replay preserved ${after.requestRef}, ${after.lineageRef}, and ${after.canonicalStatus}.`,
        evidencePaths: [screenshot],
      };
    });

    const staleRow = findCase(matrixRows, "CONT224_PAT_STALE_MORE_INFO_LINK");
    await runCase(results, staleRow, async () => {
      await page.goto(`${patientBaseUrl}/requests/request_211_a/more-info/expired`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-testid='more-info-read-only-recovery-panel']").waitFor();
      const screenshot = await saveScreenshot(page, "224-patient-stale-more-info.png");
      return {
        actualResult: "Expired more-info link degraded to a safe summary in place and preserved the current request return route.",
        evidencePaths: [screenshot],
      };
    });
  } finally {
    await stopTracedContext(context, traceOutputPath);
    appendUnique(results.traceEvidence, tracePath);
  }
}

async function runSupportFamily(results, matrixRows, browser, supportBaseUrl, externalRequests) {
  const { context, tracePath, traceOutputPath } = await startTracedContext(browser, "224-support-family-trace.zip", {
    viewport: { width: 1440, height: 1080 },
  });
  const page = await context.newPage();
  trackExternalRequests(page, supportBaseUrl, externalRequests);
  try {
    const entryRow = findCase(matrixRows, "CONT224_SUP_ENTRY_TO_TICKET");
    await runCase(results, entryRow, async () => {
      await page.goto(`${supportBaseUrl}/ops/support`, { waitUntil: "networkidle" });
      await page.locator("[data-testid='OpsSupportRoute']").waitFor();
      const entryAria = await writeAccessibilitySnapshot(page, "224-support-entry-aria.json");
      await page.goto(`${supportBaseUrl}/ops/support/inbox/repair`, { waitUntil: "networkidle" });
      await page.locator("[data-testid='OpsSupportInboxRoute']").waitFor();
      await page.getByRole("button", { name: "Launch governed ticket" }).first().click();
      await page.waitForURL(`${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=quiet`);
      await page.locator("[data-testid='SupportTicketRoute']").waitFor();
      const ticketAria = await writeAccessibilitySnapshot(page, "224-support-ticket-aria.json");
      const screenshot = await saveScreenshot(page, "224-support-entry-inbox-ticket.png");
      return {
        actualResult: "Support entry led into the repair inbox and launched the governed ticket in the same SPA shell.",
        evidencePaths: [entryAria, ticketAria, screenshot],
      };
    });

    const conversationRow = findCase(matrixRows, "CONT224_SUP_TICKET_CONVERSATION_CHILD");
    await runCase(results, conversationRow, async () => {
      await page.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/conversation?state=provisional&anchor=repair_preview_219`,
        { waitUntil: "networkidle" },
      );
      await page.locator("[data-testid='SupportConversationRoute']").waitFor();
      const attrs = await readPhase2Attrs(page, "[data-testid='Support_Ticket_Omnichannel_Shell']");
      assertCondition(attrs.shellMode === "provisional", "Conversation route lost provisional shell mode");
      assertCondition(
        (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-selected-anchor")) ===
          "repair_preview_219",
        "Conversation route lost selected anchor",
      );
      const screenshot = await saveScreenshot(page, "224-support-ticket-route-tabs.png");
      return {
        actualResult: "Support conversation child route preserved the selected anchor and remained inside the provisional ticket shell.",
        evidencePaths: [screenshot],
      };
    });

    const historyKnowledgeRow = findCase(matrixRows, "CONT224_SUP_TICKET_HISTORY_KNOWLEDGE_CHILD");
    await runCase(results, historyKnowledgeRow, async () => {
      await page.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=active&disclosure=expanded&anchor=envelope_214_reply`,
        { waitUntil: "networkidle" },
      );
      await page.locator("[data-testid='SupportHistoryRoute']").waitFor();
      await page.locator("[data-testid='SupportHistoryExpandedRows']").waitFor();
      await page.getByRole("tab", { name: "Knowledge" }).click();
      await page.waitForURL(/\/ops\/support\/tickets\/support_ticket_218_delivery_failure\/knowledge\?/);
      await page.locator("[data-testid='SupportKnowledgeRoute']").waitFor();
      await page.locator("[data-testid='KnowledgeStackRail']").waitFor();
      const screenshot = await saveScreenshot(page, "224-support-history-knowledge.png");
      return {
        actualResult: "History widen and knowledge view both stayed inside the same ticket shell and reused the governed route family tabs.",
        evidencePaths: [screenshot],
      };
    });

    const observeRow = findCase(matrixRows, "CONT224_SUP_OBSERVE_ONLY_ENTRY");
    await runCase(results, observeRow, async () => {
      await page.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/observe/support_observe_session_218_delivery_failure?state=calm&anchor=repair_preview_219`,
        { waitUntil: "networkidle" },
      );
      await page.locator("[data-testid='SupportObserveRoute']").waitFor();
      await page.locator("[data-testid='ObserveReplayBreadcrumb']").waitFor();
      const attrs = await readPhase2Attrs(page, "[data-testid='Support_Ticket_Omnichannel_Shell']");
      assertCondition(attrs.shellMode === "observe_only", "Observe route lost observe_only shell mode");
      assertCondition(await page.locator("[data-testid='support-action-cta']").isDisabled(), "Observe route exposed writable action");
      const screenshot = await saveScreenshot(page, "224-support-observe-only.png");
      return {
        actualResult: "Observe-only entry kept chronology visible and suppressed writable authority in place.",
        evidencePaths: [screenshot],
      };
    });

    const driftRow = findCase(matrixRows, "CONT224_SUP_ROUTE_INTENT_DRIFT_FALLBACK");
    await runCase(results, driftRow, async () => {
      await page.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/actions/controlled_resend?state=blocked&fallback=route_intent_drift&anchor=repair_preview_219`,
        { waitUntil: "networkidle" },
      );
      await page.locator("[data-testid='ReadOnlyFallbackHero']").waitFor();
      await page.locator("[data-testid='FallbackArtifactAnchor']").waitFor();
      const fallbackAria = await writeAccessibilitySnapshot(page, "224-support-fallback-aria.json");
      const attrs = await readPhase2Attrs(page, "[data-testid='Support_Ticket_Omnichannel_Shell']");
      assertCondition(attrs.canonicalStatus === "Read-only recovery", "Route-intent drift fallback lost read-only recovery status");
      const screenshot = await saveScreenshot(page, "224-support-route-intent-fallback.png");
      return {
        actualResult: "Route-intent drift collapsed to same-shell read-only fallback while preserving the selected anchor and strongest artifact.",
        evidencePaths: [fallbackAria, screenshot],
      };
    });

    const returnRow = findCase(matrixRows, "CONT224_SUP_RETURN_TO_INBOX");
    await runCase(results, returnRow, async () => {
      await page.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=active&anchor=repair_preview_219`,
        { waitUntil: "networkidle" },
      );
      await page.locator("[data-testid='SupportTicketRoute']").waitFor();
      await page.getByRole("button", { name: "Inbox" }).click();
      await page.locator("[data-testid='OpsSupportInboxRoute']").waitFor();
      assertCondition(
        new URL(page.url()).pathname === "/ops/support/inbox/repair",
        "Ticket shell did not return to the support inbox route",
      );
      const screenshot = await saveScreenshot(page, "224-support-return-to-inbox.png");
      return {
        actualResult: "Ticket return used the inbox stub instead of ejecting to a detached page.",
        evidencePaths: [screenshot],
      };
    });
  } finally {
    await stopTracedContext(context, traceOutputPath);
    appendUnique(results.traceEvidence, tracePath);
  }
}

async function runParityFamily(results, matrixRows, browser, patientBaseUrl, supportBaseUrl, externalRequests) {
  const { context, tracePath, traceOutputPath } = await startTracedContext(browser, "224-parity-family-trace.zip", {
    viewport: { width: 1440, height: 1080 },
  });
  const patientPage = await context.newPage();
  const supportPage = await context.newPage();
  trackExternalRequests(patientPage, patientBaseUrl, externalRequests);
  trackExternalRequests(supportPage, supportBaseUrl, externalRequests);
  try {
    const liveRow = findCase(matrixRows, "CONT224_PAR_LIVE_STATUS_AND_LINEAGE");
    await runCase(results, liveRow, async () => {
      await patientPage.goto(`${patientBaseUrl}/requests/request_211_a`, { waitUntil: "networkidle" });
      await patientPage.locator("[data-testid='Patient_Home_Requests_Detail_Route']").waitFor();
      await supportPage.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=active&anchor=repair_preview_219`,
        { waitUntil: "networkidle" },
      );
      await supportPage.locator("[data-testid='SupportTicketRoute']").waitFor();
      const patientAttrs = await readPhase2Attrs(
        patientPage,
        "[data-testid='Patient_Home_Requests_Detail_Route']",
      );
      const supportAttrs = await readPhase2Attrs(
        supportPage,
        "[data-testid='Support_Ticket_Omnichannel_Shell']",
      );
      assertCondition(patientAttrs.requestRef === supportAttrs.requestRef, "Patient/support requestRef drifted");
      assertCondition(patientAttrs.lineageRef === supportAttrs.lineageRef, "Patient/support lineageRef drifted");
      assertCondition(patientAttrs.canonicalStatus === supportAttrs.canonicalStatus, "Patient/support canonical status drifted");
      await verifyLabels(
        patientPage,
        [
          "Auth claim",
          "Identity evidence",
          "Demographic evidence",
          "Patient preference",
          "Support reachability",
        ],
        "patient contact domains",
      );
      await verifyLabels(
        supportPage,
        [
          "Auth claim",
          "Identity evidence",
          "Demographic evidence",
          "Patient preference",
          "Support reachability",
        ],
        "support contact domains",
      );
      await supportPage.getByText("Reply with more information", { exact: true }).first().waitFor();
      await supportPage
        .getByText("Guide the patient back to the same reply-needed step", {
          exact: true,
        })
        .first()
        .waitFor();
      const screenshot = await saveScreenshot(supportPage, "224-patient-support-live-parity.png");
      return {
        actualResult: `Patient and support stayed aligned on ${patientAttrs.requestRef}, ${patientAttrs.lineageRef}, and ${patientAttrs.canonicalStatus}.`,
        evidencePaths: [screenshot],
      };
    });

    const repairRow = findCase(matrixRows, "CONT224_PAR_REPAIR_POSTURE");
    await runCase(results, repairRow, async () => {
      await patientPage.goto(`${patientBaseUrl}/requests/request_211_a/callback/at-risk`, {
        waitUntil: "networkidle",
      });
      await patientPage.locator("[data-testid='More_Info_Callback_Contact_Repair_Route']").waitFor();
      await supportPage.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/actions/controlled_resend?state=active&anchor=repair_preview_219`,
        { waitUntil: "networkidle" },
      );
      await supportPage.locator("[data-testid='SupportActionRoute']").waitFor();
      const patientAttrs = await readPhase2Attrs(
        patientPage,
        "[data-testid='More_Info_Callback_Contact_Repair_Route']",
      );
      const supportAttrs = await readPhase2Attrs(
        supportPage,
        "[data-testid='Support_Ticket_Omnichannel_Shell']",
      );
      assertCondition(patientAttrs.causeClass === "repair_required", "Patient repair route lost repair_required");
      assertCondition(supportAttrs.causeClass === "repair_required", "Support controlled resend route lost repair_required");
      await supportPage.getByText("Repair contact route", { exact: true }).first().waitFor();
      await supportPage
        .getByText("Repair the outbound route without leaving the same ticket anchor", {
          exact: true,
        })
        .first()
        .waitFor();
      const screenshot = await saveScreenshot(supportPage, "224-patient-support-repair-parity.png");
      return {
        actualResult: "Patient callback repair and support controlled resend now share the same repair_required cause class and bounded repair guidance.",
        evidencePaths: [screenshot],
      };
    });

    const provisionalRow = findCase(matrixRows, "CONT224_PAR_PROVISIONAL_COMMUNICATION");
    await runCase(results, provisionalRow, async () => {
      await patientPage.goto(`${patientBaseUrl}/messages/cluster_214_dispute`, {
        waitUntil: "networkidle",
      });
      await patientPage.locator("[data-testid='Health_Record_Communications_Route']").waitFor();
      await patientPage.locator("[data-testid='delivery-dispute-notice']").waitFor();
      await supportPage.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/conversation?state=provisional&anchor=envelope_214_reply`,
        { waitUntil: "networkidle" },
      );
      await supportPage.locator("[data-testid='SupportConversationRoute']").waitFor();
      const supportAttrs = await readPhase2Attrs(
        supportPage,
        "[data-testid='Support_Ticket_Omnichannel_Shell']",
      );
      assertCondition(supportAttrs.shellMode === "provisional", "Support provisional conversation drifted");
      const screenshot = await saveScreenshot(supportPage, "224-patient-support-provisional-parity.png");
      return {
        actualResult: "Patient dispute messaging and support provisional conversation both stayed visibly non-authoritative while chronology remained available.",
        evidencePaths: [screenshot],
      };
    });
  } finally {
    await stopTracedContext(context, traceOutputPath);
    appendUnique(results.traceEvidence, tracePath);
  }
}

async function runRecordFamily(results, matrixRows, browser, patientBaseUrl, externalRequests) {
  const { context, tracePath, traceOutputPath } = await startTracedContext(browser, "224-record-family-trace.zip", {
    viewport: { width: 1440, height: 1080 },
  });
  const page = await context.newPage();
  trackExternalRequests(page, patientBaseUrl, externalRequests);
  try {
    await page.goto(`${patientBaseUrl}/records`, { waitUntil: "networkidle" });
    await page.locator("[data-testid='Health_Record_Communications_Route']").waitFor();
    const recordsAria = await writeAccessibilitySnapshot(page, "224-patient-records-aria.json");
    appendUnique(results.ariaEvidence, recordsAria);

    const verifiedRow = findCase(matrixRows, "CONT224_REC_VERIFIED_SUMMARY_SOURCE");
    await runCase(results, verifiedRow, async () => {
      await page.goto(`${patientBaseUrl}/records/documents/document_213_letter`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-testid='record-artifact-panel']").waitFor();
      await page.getByText("The structured summary matches the current source artifact and parity witness.", {
        exact: true,
      }).waitFor();
      const screenshot = await saveScreenshot(page, "224-record-artifact-verified-summary.png");
      return {
        actualResult: "Verified structured document summary stayed aligned with the current source artifact and parity witness.",
        evidencePaths: [recordsAria, screenshot],
      };
    });

    const fallbackRow = findCase(matrixRows, "CONT224_REC_CHART_TABLE_FALLBACK");
    await runCase(results, fallbackRow, async () => {
      await page.goto(`${patientBaseUrl}/records/results/result_213_stale`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-testid='chart-demotion-notice']").waitFor();
      await page.locator("[data-testid='record-result-table']").waitFor();
      const screenshot = await saveScreenshot(page, "224-record-chart-table-fallback.png");
      return {
        actualResult: "Stale result view demoted to the structured table fallback without implying richer chart truth.",
        evidencePaths: [screenshot],
      };
    });

    const sourceOnlyRow = findCase(matrixRows, "CONT224_REC_SOURCE_ONLY_HANDOFF");
    await runCase(results, sourceOnlyRow, async () => {
      await page.goto(`${patientBaseUrl}/records/documents/document_213_source_only`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-testid='record-artifact-panel']").waitFor();
      await page.getByText("The source artifact is available, but the structured summary is labelled provisional.", {
        exact: true,
      }).waitFor();
      const screenshot = await saveScreenshot(page, "224-record-source-only-handoff.png");
      return {
        actualResult: "Source-only handoff kept the summary provisional and explicitly pointed back to source authority.",
        evidencePaths: [screenshot],
      };
    });

    const restrictedRow = findCase(matrixRows, "CONT224_REC_RESTRICTED_PLACEHOLDER");
    await runCase(results, restrictedRow, async () => {
      await page.goto(`${patientBaseUrl}/records/documents/document_213_restricted`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-testid='record-visibility-placeholder']").waitFor();
      const screenshot = await saveScreenshot(page, "224-record-restricted-placeholder.png");
      return {
        actualResult: "Restricted record stayed visible as a governed placeholder instead of disappearing from the record surface.",
        evidencePaths: [screenshot],
      };
    });
  } finally {
    await stopTracedContext(context, traceOutputPath);
    appendUnique(results.traceEvidence, tracePath);
  }
}

async function runMaskingFamily(results, matrixRows, browser, supportBaseUrl, externalRequests) {
  const { context, tracePath, traceOutputPath } = await startTracedContext(browser, "224-masking-family-trace.zip", {
    viewport: { width: 1440, height: 1080 },
  });
  const page = await context.newPage();
  trackExternalRequests(page, supportBaseUrl, externalRequests);
  try {
    const summaryRow = findCase(matrixRows, "CONT224_MASK_SUMMARY_FIRST_HISTORY");
    await runCase(results, summaryRow, async () => {
      await page.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=calm&anchor=envelope_214_reply`,
        { waitUntil: "networkidle" },
      );
      await page.locator("[data-testid='SupportHistoryRoute']").waitFor();
      await page.locator("[data-testid='DisclosureGatePrompt']").waitFor();
      assertCondition(
        (await page.locator("[data-testid='SupportHistoryExpandedRows']").count()) === 0,
        "History summary-first route unexpectedly widened",
      );
      const screenshot = await saveScreenshot(page, "224-support-history-summary-first.png");
      return {
        actualResult: "History remained summary-first until disclosure authority widened it.",
        evidencePaths: [screenshot],
      };
    });

    const widenRow = findCase(matrixRows, "CONT224_MASK_DISCLOSURE_WIDEN");
    await runCase(results, widenRow, async () => {
      await page.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/history?state=active&disclosure=expanded&anchor=envelope_214_reply`,
        { waitUntil: "networkidle" },
      );
      await page.locator("[data-testid='SupportHistoryExpandedRows']").waitFor();
      assertCondition(
        (await page.locator("[data-testid='Support_Ticket_Omnichannel_Shell']").getAttribute("data-selected-anchor")) ===
          "envelope_214_reply",
        "History widen drifted the selected anchor",
      );
      const screenshot = await saveScreenshot(page, "224-support-history-disclosure-widen.png");
      return {
        actualResult: "Governed history widen exposed expanded rows while preserving the current timeline anchor.",
        evidencePaths: [screenshot],
      };
    });

    const knowledgeRow = findCase(matrixRows, "CONT224_MASK_KNOWLEDGE_LIMITED_SCOPE");
    await runCase(results, knowledgeRow, async () => {
      await page.goto(
        `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure/knowledge?state=active&assist=blocked&anchor=repair_preview_219`,
        { waitUntil: "networkidle" },
      );
      await page.locator("[data-testid='KnowledgeStackRail']").waitFor();
      await page.getByText("Blocked in current posture").first().waitFor();
      const screenshot = await saveScreenshot(page, "224-support-knowledge-limited-scope.png");
      return {
        actualResult: "Knowledge rail remained visible under limited scope and blocked its widening affordances in place.",
        evidencePaths: [screenshot],
      };
    });

    const replayRow = findCase(matrixRows, "CONT224_MASK_READ_ONLY_ARTIFACT_PRESERVED");
    await runCase(results, replayRow, async () => {
      await page.goto(
        `${supportBaseUrl}/ops/support/replay/support_replay_session_218_delivery_failure?state=blocked&fallback=replay_restore_failure&anchor=repair_preview_219`,
        { waitUntil: "networkidle" },
      );
      await page.locator("[data-testid='ReadOnlyFallbackHero']").waitFor();
      await page.locator("[data-testid='FallbackArtifactAnchor']").waitFor();
      const screenshot = await saveScreenshot(page, "224-support-read-only-artifact.png");
      return {
        actualResult: "Read-only replay kept the strongest confirmed artifact and reacquire paths visible without reopening writable authority.",
        evidencePaths: [screenshot],
      };
    });
  } finally {
    await stopTracedContext(context, traceOutputPath);
    appendUnique(results.traceEvidence, tracePath);
  }
}

async function runAuthFamily(results, matrixRows, browser, patientBaseUrl, externalRequests) {
  const { context, tracePath, traceOutputPath } = await startTracedContext(browser, "224-auth-family-trace.zip", {
    viewport: { width: 1440, height: 1080 },
  });
  const page = await context.newPage();
  trackExternalRequests(page, patientBaseUrl, externalRequests);
  try {
    const signedOutRow = findCase(matrixRows, "CONT224_AUTH_SIGNED_OUT_DETAIL_RECOVERY");
    await runCase(results, signedOutRow, async () => {
      await page.goto(`${patientBaseUrl}/auth/signed-out`, { waitUntil: "networkidle" });
      await page.locator("[data-testid='Auth_Callback_Recovery_Route']").waitFor();
      const attrs = await readPhase2Attrs(page, "[data-testid='Auth_Callback_Recovery_Route']");
      assertCondition(attrs.causeClass === "session_recovery_required", "Signed-out recovery lost session_recovery_required");
      const screenshot = await saveScreenshot(page, "224-auth-signed-out-recovery.png");
      return {
        actualResult: "Signed-out recovery route stayed same-shell and preserved a safe resume path.",
        evidencePaths: [screenshot],
      };
    });

    const holdRow = findCase(matrixRows, "CONT224_AUTH_IDENTITY_HOLD_SUMMARY_ONLY");
    await runCase(results, holdRow, async () => {
      await page.goto(`${patientBaseUrl}/portal/claim/identity-hold`, { waitUntil: "networkidle" });
      await page.locator("[data-testid='Claim_Resume_Identity_Hold_Route']").waitFor();
      const attrs = await readPhase2Attrs(page, "[data-testid='Claim_Resume_Identity_Hold_Route']");
      assertCondition(attrs.causeClass === "identity_hold", "Identity hold route lost identity_hold cause class");
      const screenshot = await saveScreenshot(page, "224-auth-identity-hold.png");
      return {
        actualResult: "Identity-hold route remained summary-only and preserved the bounded recovery path without re-exposing mutable context.",
        evidencePaths: [screenshot],
      };
    });
  } finally {
    await stopTracedContext(context, traceOutputPath);
    appendUnique(results.traceEvidence, tracePath);
  }
}

async function runAccessibilityFamily(results, matrixRows, browser, patientBaseUrl, supportBaseUrl, labUrl, externalRequests) {
  const { context, tracePath, traceOutputPath } = await startTracedContext(browser, "224-accessibility-family-trace.zip", {
    viewport: { width: 1440, height: 1080 },
  });
  const patientPage = await context.newPage();
  const supportPage = await context.newPage();
  const labPage = await context.newPage();
  trackExternalRequests(patientPage, patientBaseUrl, externalRequests);
  trackExternalRequests(supportPage, supportBaseUrl, externalRequests);
  trackExternalRequests(labPage, new URL(labUrl).origin, externalRequests);
  try {
    const keyboardRow = findCase(matrixRows, "CONT224_A11Y_KEYBOARD_CORE_ROUTES");
    await runCase(results, keyboardRow, async () => {
      await patientPage.goto(`${patientBaseUrl}/home`, { waitUntil: "networkidle" });
      await patientPage.locator("[data-testid='Patient_Home_Requests_Detail_Route']").waitFor();
      await assertKeyboardFocusMoves(patientPage, "Patient home");
      await supportPage.goto(`${supportBaseUrl}/ops/support`, { waitUntil: "networkidle" });
      await supportPage.locator("[data-testid='OpsSupportRoute']").waitFor();
      await assertKeyboardFocusMoves(supportPage, "Support entry");
      const screenshot = await saveScreenshot(supportPage, "224-keyboard-core-routes.png");
      return {
        actualResult: "Keyboard focus moved through core patient and support routes without dropping to the document body.",
        evidencePaths: [
          evidencePath("224-patient-home-aria.json"),
          evidencePath("224-support-entry-aria.json"),
          screenshot,
        ],
      };
    });

    const reducedRow = findCase(matrixRows, "CONT224_A11Y_REDUCED_MOTION_EQUIVALENCE");
    await runCase(results, reducedRow, async () => {
      const reducedContext = await browser.newContext({
        viewport: { width: 1280, height: 960 },
        reducedMotion: "reduce",
      });
      try {
        const reducedPage = await reducedContext.newPage();
        trackExternalRequests(reducedPage, supportBaseUrl, externalRequests);
        await reducedContext.tracing.start({ screenshots: true, snapshots: true, sources: true });
        await reducedPage.goto(
          `${supportBaseUrl}/ops/support/tickets/support_ticket_218_delivery_failure?state=active&anchor=repair_preview_219`,
          { waitUntil: "networkidle" },
        );
        await reducedPage.locator("[data-testid='SupportTicketRoute']").waitFor();
        const attrs = await readPhase2Attrs(
          reducedPage,
          "[data-testid='Support_Ticket_Omnichannel_Shell']",
        );
        assertCondition(attrs.motionMode === "reduced", "Reduced motion did not propagate");
        const screenshot = await saveScreenshot(reducedPage, "224-reduced-motion-equivalence.png");
        const traceName = "224-reduced-motion-trace.zip";
        await reducedContext.tracing.stop({ path: outputPath(traceName) });
        appendUnique(results.traceEvidence, evidencePath(traceName));
        return {
          actualResult: "Reduced motion preserved the same route semantics and switched the support shell into reduced motion mode.",
          evidencePaths: [screenshot, evidencePath(traceName)],
        };
      } finally {
        await reducedContext.close();
      }
    });

    const zoomRow = findCase(matrixRows, "CONT224_A11Y_HIGH_ZOOM_NO_OVERFLOW");
    await runCase(results, zoomRow, async () => {
      await patientPage.goto(`${patientBaseUrl}/requests/request_211_a`, { waitUntil: "networkidle" });
      await patientPage.locator("[data-testid='patient-request-detail-route']").waitFor();
      await patientPage.evaluate(() => {
        document.documentElement.style.zoom = "1.75";
      });
      await assertNoHorizontalOverflow(patientPage, "High zoom patient request detail", 4);
      const screenshot = await saveScreenshot(patientPage, "224-high-zoom-request-detail.png");
      return {
        actualResult: "Request detail stayed readable without horizontal overflow under high zoom.",
        evidencePaths: [screenshot],
      };
    });

    await labPage.goto(labUrl, { waitUntil: "networkidle" });
    await labPage.locator("[data-testid='Portal_Support_Continuity_Assurance_Lab']").waitFor();
    await assertContrastRatio(labPage, ".hero__panel h1", 4.5, "Assurance lab hero");
    await assertNoHorizontalOverflow(labPage, "Assurance lab desktop");
    const labAria = await writeAccessibilitySnapshot(labPage, "224-assurance-lab-aria.json");
    appendUnique(results.ariaEvidence, labAria);
    appendUnique(results.screenshotEvidence, await saveScreenshot(labPage, "224-assurance-lab.png"));
    await labPage.setViewportSize({ width: 390, height: 844 });
    await assertNoHorizontalOverflow(labPage, "Assurance lab mobile");
    appendUnique(results.screenshotEvidence, await saveScreenshot(labPage, "224-assurance-lab-mobile.png"));
  } finally {
    await stopTracedContext(context, traceOutputPath);
    appendUnique(results.traceEvidence, tracePath);
  }
}

export async function run() {
  ensureDirs();
  const matrixRows = parseCsv(fs.readFileSync(CASE_MATRIX_PATH, "utf8"));
  const expectations = JSON.parse(fs.readFileSync(EXPECTATIONS_PATH, "utf8"));
  const defectLog = JSON.parse(fs.readFileSync(DEFECT_LOG_PATH, "utf8"));
  assertCondition(expectations.taskId === TASK_ID, "Expectation taskId drifted");
  assertCondition(Array.isArray(defectLog.defects) && defectLog.defects.length >= 2, "Defect log drifted");

  const results = createResults(matrixRows);
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, labUrl } = await startStaticServer();
  const patientApp = await startViteApp(PATIENT_APP_DIR, "/home");
  const supportApp = await startViteApp(SUPPORT_APP_DIR, "/ops/support");
  const browser = await playwright.chromium.launch({ headless: true });
  const externalRequests = new Set();

  try {
    await runPatientFamily(results, matrixRows, browser, patientApp.baseUrl, externalRequests);
    results.familyResults.push({ family: "patient_shell_continuity", status: "passed", caseCount: 6, evidence: "output/playwright/224-patient-family-trace.zip" });

    await runSupportFamily(results, matrixRows, browser, supportApp.baseUrl, externalRequests);
    results.familyResults.push({ family: "support_continuity", status: "passed", caseCount: 6, evidence: "output/playwright/224-support-family-trace.zip" });

    await runParityFamily(results, matrixRows, browser, patientApp.baseUrl, supportApp.baseUrl, externalRequests);
    results.familyResults.push({ family: "patient_support_parity", status: "passed", caseCount: 3, evidence: "output/playwright/224-parity-family-trace.zip" });

    await runRecordFamily(results, matrixRows, browser, patientApp.baseUrl, externalRequests);
    results.familyResults.push({ family: "record_artifact_parity", status: "passed", caseCount: 4, evidence: "output/playwright/224-record-family-trace.zip" });

    await runMaskingFamily(results, matrixRows, browser, supportApp.baseUrl, externalRequests);
    results.familyResults.push({ family: "masking_disclosure_fallback", status: "passed", caseCount: 4, evidence: "output/playwright/224-masking-family-trace.zip" });

    await runAuthFamily(results, matrixRows, browser, patientApp.baseUrl, externalRequests);
    results.familyResults.push({ family: "cross_state_auth_and_recovery", status: "passed", caseCount: 2, evidence: "output/playwright/224-auth-family-trace.zip" });

    await runAccessibilityFamily(results, matrixRows, browser, patientApp.baseUrl, supportApp.baseUrl, labUrl, externalRequests);
    results.familyResults.push({ family: "accessibility_resilience", status: "passed", caseCount: 3, evidence: "output/playwright/224-accessibility-family-trace.zip" });

    assertCondition(results.caseResults.length === matrixRows.length, "Not every matrix row produced a runtime result");
    assertCondition(results.statusCounts.failed === 0, "Case results still contain failures");
    assertCondition(externalRequests.size === 0, `Unexpected external requests: ${Array.from(externalRequests).join(", ")}`);

    results.overallStatus = "passed";
    results.externalRequestViolations = [];
    persistResults(results);
  } catch (error) {
    results.overallStatus = "failed";
    results.externalRequestViolations = Array.from(externalRequests);
    persistResults(results);
    throw error;
  } finally {
    await browser.close();
    await stopProcess(patientApp.child);
    await stopProcess(supportApp.child);
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.log("224_patient_support_record_artifact_continuity.spec.js: syntax ok");
}
