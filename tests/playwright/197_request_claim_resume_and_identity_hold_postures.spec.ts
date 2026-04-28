import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "patient-web");
const ATLAS_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "197_claim_resume_and_identity_hold_atlas.html",
);
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "197_patient_claim_resume_surface_contract.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "197_access_posture_and_reason_code_matrix.csv",
);
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "197_refresh_replay_and_stale_grant_cases.json",
);

interface StaticServer {
  readonly server: http.Server;
  readonly url: string;
}

interface PatientWebServer {
  readonly child: ChildProcess;
  readonly baseUrl: string;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
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

async function allocatePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function startStaticServer(): Promise<StaticServer> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/197_claim_resume_and_identity_hold_atlas.html";
    }
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

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    server,
    url: `http://127.0.0.1:${port}/docs/frontend/197_claim_resume_and_identity_hold_atlas.html`,
  };
}

async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url: string, timeoutMs = 15_000): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startPatientWeb(): Promise<PatientWebServer> {
  const port = await allocatePort();
  const logs: string[] = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: APP_DIR,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr?.on("data", (chunk) => logs.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(baseUrl);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Patient web failed to start.\n${logs.join("")}`, { cause: error });
  }

  return { child, baseUrl };
}

async function stopPatientWeb(child: ChildProcess): Promise<void> {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

function expected197() {
  for (const filePath of [ATLAS_PATH, CONTRACT_PATH, MATRIX_PATH, CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing par_197 artifact ${filePath}`);
  }
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")) as {
    readonly visualMode: string;
    readonly postures: readonly string[];
  };
  assertCondition(contract.visualMode === "Continuity_Bridge_Atlas", "Wrong visual mode.");
  assertCondition(contract.postures.includes("identity_hold"), "Contract lost identity_hold.");
  assertCondition(
    contract.postures.includes("stale_grant_mapped"),
    "Contract lost replay mapping.",
  );
  return contract;
}

async function openAtlas(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Claim_Resume_Identity_Hold_Atlas']").waitFor();
}

async function openApp(page: Page, baseUrl: string, pathname: string): Promise<void> {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Claim_Resume_Identity_Hold_Route']").waitFor();
}

async function assertNoOverflow(page: Page, maxOverflow = 12): Promise<void> {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth - window.innerWidth,
    bodyWidth: document.body.scrollWidth - window.innerWidth,
  }));
  assertCondition(
    overflow.width <= maxOverflow && overflow.bodyWidth <= maxOverflow,
    `Overflow exceeded tolerance: ${JSON.stringify(overflow)}`,
  );
}

async function activeTestId(page: Page): Promise<string | null> {
  return await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) {
      return null;
    }
    return (
      active.getAttribute("data-testid") ??
      active.closest("[data-testid]")?.getAttribute("data-testid") ??
      null
    );
  });
}

async function screenshot(page: Page, relativePath: string): Promise<void> {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertAtlas(page: Page): Promise<void> {
  for (const testId of [
    "posture-state-board-gallery",
    "reason-code-ui-matrix",
    "same-shell-transition-diagram",
    "stale-grant-mapping-table",
    "diagram-parity-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  await page.locator("[data-testid='posture-state-select']").selectOption("identity_hold");
  const card = await page.locator("[data-testid='posture-state-card']").innerText();
  assertCondition(
    card.includes("identity_evidence_hold_active"),
    "Atlas identity hold state failed.",
  );
  await page.locator("[data-testid='posture-state-select']").selectOption("stale_grant_mapped");
  const replay = await page.locator("[data-testid='posture-state-card']").innerText();
  assertCondition(replay.includes("duplicate_redemption_mapped"), "Atlas replay mapping failed.");
}

async function assertPostureRoutes(page: Page, baseUrl: string): Promise<void> {
  const routes = [
    ["claim_pending", "/portal/claim/pending", "posture-claim_pending"],
    ["claim_confirmed", "/portal/claim/confirmed", "posture-claim_confirmed"],
    ["read_only", "/portal/claim/read-only", "posture-read_only"],
    ["recover_only", "/portal/claim/recover-only", "posture-recover_only"],
    ["identity_hold", "/portal/claim/identity-hold", "posture-identity_hold"],
    ["rebind_required", "/portal/claim/rebind-required", "posture-rebind_required"],
    ["stale_link_mapped", "/portal/claim/stale-link", "posture-stale_link_mapped"],
    ["stale_grant_mapped", "/portal/claim/stale-grant", "posture-stale_grant_mapped"],
    [
      "support_recovery_required",
      "/portal/claim/support-recovery",
      "posture-support_recovery_required",
    ],
    ["wrong_patient_freeze", "/portal/claim/wrong-patient-freeze", "posture-wrong_patient_freeze"],
    ["promoted_draft_mapped", "/portal/claim/promoted-draft", "posture-promoted_draft_mapped"],
  ] as const;

  for (const [posture, route, testId] of routes) {
    await openApp(page, baseUrl, route);
    const root = page.locator("[data-testid='Claim_Resume_Identity_Hold_Route']");
    assertCondition(
      (await root.getAttribute("data-posture-key")) === posture,
      `${route} wrong posture.`,
    );
    await page.getByRole("navigation", { name: "Claim and recovery postures" }).waitFor();
    await page.locator(`[data-testid='${testId}']`).waitFor();
    await page.locator("[data-testid='continuity-context-panel']").waitFor();
    await page.locator("[data-testid='dominant-next-safe-action']").waitFor();
    await assertNoOverflow(page);
  }
}

async function assertPrivacyAndReplay(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/claim/identity-hold");
  const hold = page.locator("[data-testid='posture-identity_hold']");
  assertCondition(
    (await hold.getAttribute("data-coverage")) === "summary_only",
    "Hold not summary_only.",
  );
  const holdText = (
    await page.locator("[data-testid='claim-resume-main']").innerText()
  ).toLowerCase();
  for (const forbidden of ["daylight photo", "flare", "raw grant", "subject hash"]) {
    assertCondition(!holdText.includes(forbidden), `Identity hold leaked ${forbidden}.`);
  }

  await openApp(page, baseUrl, "/portal/claim/rebind-required");
  const rebind = page.locator("[data-testid='posture-rebind_required']");
  assertCondition(
    (await rebind.getAttribute("data-coverage")) === "summary_only",
    "Rebind not summary_only.",
  );
  assertCondition(
    (await page.locator("[data-testid='dominant-next-safe-action']").innerText()).includes(
      "Reconnect",
    ),
    "Rebind did not center corrective action.",
  );

  await openApp(page, baseUrl, "/portal/claim/stale-grant");
  const replayText = (
    await page.locator("[data-testid='posture-stale_grant_mapped']").innerText()
  ).toLowerCase();
  assertCondition(replayText.includes("already claimed"), "Replay did not map to settled result.");
  assertCondition(!replayText.includes("start new claim"), "Replay invited a second claim path.");

  await openApp(page, baseUrl, "/portal/claim/promoted-draft");
  const draftText = (
    await page.locator("[data-testid='posture-promoted_draft_mapped']").innerText()
  ).toLowerCase();
  assertCondition(
    draftText.includes("now a request"),
    "Promoted draft did not map to request truth.",
  );
  assertCondition(!draftText.includes("edit draft"), "Promoted draft reopened mutable editing.");

  await openApp(page, baseUrl, "/portal/claim/wrong-patient-freeze");
  const freezeText = (
    await page.locator("[data-testid='claim-resume-main']").innerText()
  ).toLowerCase();
  assertCondition(
    freezeText.includes("paused for safety"),
    "Wrong-patient freeze missing safe title.",
  );
  assertCondition(
    !freezeText.includes("daylight photo"),
    "Wrong-patient freeze leaked request narrative.",
  );
}

async function assertRefreshFocusAndAnnouncements(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/claim/read-only");
  assertCondition(
    (await page.locator("[data-testid='posture-read_only']").getAttribute("data-reason-code")) ===
      "scope_envelope_narrowed_read_only",
    "Read-only reason code missing.",
  );
  assertCondition(
    (await activeTestId(page)) === "dominant-next-safe-action",
    "Focus did not move to dominant action for read-only posture.",
  );
  assertCondition(
    (await page.locator("[data-testid='claim-nav-read_only']").getAttribute("aria-current")) ===
      "page",
    "Read-only nav did not expose aria-current.",
  );
  await page.locator("[data-testid='claim-nav-identity_hold']").click();
  await page.locator("[data-testid='posture-identity_hold']").waitFor();
  const announcement = await page.locator("[data-testid='claim-resume-live-region']").innerText();
  assertCondition(
    announcement.includes("identity hold"),
    "Live region did not announce posture shift.",
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid='posture-identity_hold']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='Claim_Resume_Identity_Hold_Route']")
      .getAttribute("data-posture-key")) === "identity_hold",
    "Refresh did not preserve identity hold posture.",
  );
}

async function assertResponsiveAndReducedMotion(browser: Browser, baseUrl: string): Promise<void> {
  const sizes = [
    { name: "desktop", width: 1440, height: 1040 },
    { name: "tablet", width: 900, height: 980 },
    { name: "mobile", width: 390, height: 880 },
  ];
  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    try {
      await openApp(page, baseUrl, "/portal/claim/identity-hold");
      await assertNoOverflow(page);
      await screenshot(page, `output/playwright/197-identity-hold-${size.name}.png`);
    } finally {
      await page.close();
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const reducedPage = await context.newPage();
  try {
    await openApp(reducedPage, baseUrl, "/portal/claim/pending");
    await reducedPage.keyboard.press("Tab");
    await reducedPage.locator("[data-testid='claim-pending-progress']").waitFor();
    await screenshot(reducedPage, "output/playwright/197-claim-pending-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function runBrowserChecks(browser: Browser): Promise<void> {
  expected197();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
  try {
    await openAtlas(page, staticServer.url);
    await assertAtlas(page);
    await screenshot(page, "output/playwright/197-atlas.png");
    await assertPostureRoutes(page, patientWeb.baseUrl);
    await assertPrivacyAndReplay(page, patientWeb.baseUrl);
    await assertRefreshFocusAndAnnouncements(page, patientWeb.baseUrl);
    await assertResponsiveAndReducedMotion(browser, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected197();
  if (!process.argv.includes("--run")) {
    console.log("197_request_claim_resume_and_identity_hold_postures.spec.ts: syntax ok");
    return;
  }
  const playwright = await importPlaywright();
  assertCondition(playwright, "Playwright unavailable.");
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    await runBrowserChecks(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
