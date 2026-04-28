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
  "199_signed_in_request_start_and_restore_atlas.html",
);
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "199_signed_in_request_start_surface_contract.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "199_saved_context_restore_and_promotion_mapping_matrix.csv",
);
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "199_authenticated_entry_and_draft_continuity_cases.json",
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
      pathname = "/docs/frontend/199_signed_in_request_start_and_restore_atlas.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/199_signed_in_request_start_and_restore_atlas.html`,
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

function expected199() {
  for (const filePath of [ATLAS_PATH, CONTRACT_PATH, MATRIX_PATH, CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing par_199 artifact ${filePath}`);
  }
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")) as {
    readonly visualMode: string;
    readonly canonicalIntakeLaw: {
      readonly secondAuthenticatedIntakeModelForbidden: boolean;
      readonly canonicalPhase1TargetPrefix: string;
    };
  };
  assertCondition(contract.visualMode === "SignedIn_Mission_Frame", "Wrong visual mode.");
  assertCondition(
    contract.canonicalIntakeLaw.secondAuthenticatedIntakeModelForbidden,
    "Contract allows a second authenticated intake model.",
  );
  assertCondition(
    contract.canonicalIntakeLaw.canonicalPhase1TargetPrefix === "/start-request/",
    "Contract lost canonical intake target.",
  );
}

async function openAtlas(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Signed_In_Request_Start_Restore_Atlas']").waitFor();
}

async function openApp(page: Page, baseUrl: string, pathname: string): Promise<void> {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Signed_In_Request_Start_Restore_Route']").waitFor();
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

async function screenshot(page: Page, relativePath: string): Promise<void> {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
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

async function assertAtlas(page: Page): Promise<void> {
  for (const testId of [
    "start-versus-continue-gallery",
    "start-versus-continue-table",
    "saved-context-restore-board",
    "saved-context-restore-list",
    "promoted-draft-mapping-table",
    "authenticated-home-to-intake-diagram",
    "continuity-diagram-parity-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  const atlasText = await page
    .locator("[data-testid='Signed_In_Request_Start_Restore_Atlas']")
    .innerText();
  assertCondition(
    atlasText.includes("No second authenticated intake model"),
    "Atlas lost parity invariant.",
  );
  assertCondition(atlasText.includes("PromotedDraftMappedOutcome"), "Atlas lost promoted mapping.");
}

async function assertStartUsesCanonicalIntake(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/start-request");
  assertCondition(
    (await page
      .locator("[data-testid='Signed_In_Request_Start_Restore_Route']")
      .getAttribute("data-screen-key")) === "SignedInStartRequestEntry",
    "Start entry resolved wrong screen.",
  );
  assertCondition(
    (
      (await page
        .locator("[data-testid='Signed_In_Request_Start_Restore_Route']")
        .getAttribute("data-supported-testids")) ?? ""
    ).includes("signed-in-start-request-action"),
    "Start route does not publish signed-in-start-request-action marker.",
  );
  await page.getByRole("button", { name: "Start a request" }).first().waitFor();
  await page.locator("[data-testid='signed-in-start-request-action']").click();
  await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
  const intakeRoot = page.locator("[data-testid='patient-intake-mission-frame-root']");
  assertCondition(
    (await intakeRoot.getAttribute("data-route-family")) === "rf_intake_self_service",
    "Signed-in start did not enter canonical intake route family.",
  );
  assertCondition(
    (await intakeRoot.getAttribute("data-route-key")) === "request_type",
    "Signed-in start did not land on request type.",
  );
}

async function assertContinueDraft(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/start-request/continue");
  const root = page.locator("[data-testid='Signed_In_Request_Start_Restore_Route']");
  assertCondition(
    (await root.getAttribute("data-screen-key")) === "ContinueDraftEntry",
    "Continue route drifted.",
  );
  await page.locator("[data-testid='saved-context-card']").waitFor();
  await page.locator("[data-testid='draft-continuity-summary']").waitFor();
  assertCondition(
    (await root.getAttribute("data-selected-anchor")) === "request-proof",
    "Continue lost anchor.",
  );
  await page.locator("[data-testid='continue-draft-entry-action']").click();
  await page.locator("[data-testid='patient-intake-details-step']").waitFor();
  const intakeRoot = page.locator("[data-testid='patient-intake-mission-frame-root']");
  assertCondition(
    (await intakeRoot.getAttribute("data-selected-anchor")) === "request-proof",
    "Canonical details route did not preserve selected anchor.",
  );
}

async function assertRestoreRefreshAndPostAuth(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/start-request/restore");
  await page.locator("[data-testid='restore-decision-notice']").waitFor();
  await page.reload({ waitUntil: "networkidle" });
  const root = page.locator("[data-testid='Signed_In_Request_Start_Restore_Route']");
  assertCondition(
    (await root.getAttribute("data-screen-key")) === "SavedContextRestoreEntry",
    "Refresh lost restore screen.",
  );
  assertCondition(
    (await root.getAttribute("data-selected-step")) === "supporting_files",
    "Refresh lost restored step.",
  );
  assertCondition(
    (await root.getAttribute("data-local-cache-only")) === "false",
    "Restore relied on local cache only.",
  );
  const liveRegion = page.locator("[data-testid='signed-in-start-live-region']");
  assertCondition(
    (await liveRegion.getAttribute("aria-live")) === "polite",
    "Live region missing aria-live.",
  );

  await openApp(page, baseUrl, "/portal/start-request/post-auth-return");
  await page.locator("[data-testid='restore-saved-context-action']").click();
  await page.locator("[data-testid='patient-intake-files-step']").waitFor();
  const intakeRoot = page.locator("[data-testid='patient-intake-mission-frame-root']");
  assertCondition(
    (await intakeRoot.getAttribute("data-route-key")) === "supporting_files",
    "Post-auth return did not restore files step.",
  );
}

async function assertPromotedAndNarrowed(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/start-request/promoted");
  const promotedRoot = page.locator("[data-testid='Signed_In_Request_Start_Restore_Route']");
  assertCondition(
    (await promotedRoot.getAttribute("data-screen-key")) === "PromotedDraftMappedOutcome",
    "Promoted route resolved wrong screen.",
  );
  assertCondition(
    (await promotedRoot.getAttribute("data-maps-to-request-truth")) === "true",
    "Promoted draft did not map to request truth.",
  );
  const promotedText = (
    await page.locator("[data-testid='promoted-draft-mapped-outcome']").innerText()
  ).toLowerCase();
  assertCondition(
    promotedText.includes("editing remains closed"),
    "Promoted draft reopened editing copy.",
  );
  await page.locator("[data-testid='promoted-draft-mapped-action']").click();
  await page.locator("[data-testid='authenticated-request-detail']").waitFor();

  await openApp(page, baseUrl, "/portal/start-request/narrowed");
  await page.locator("[data-testid='narrowed-write-posture-entry']").waitFor();
  await page.locator("[data-testid='narrowed-write-posture-action']").click();
  await page.locator("[data-testid='Claim_Resume_Identity_Hold_Route']").waitFor();
  assertCondition(
    (await page
      .locator("[data-testid='Claim_Resume_Identity_Hold_Route']")
      .getAttribute("data-posture-key")) === "identity_hold",
    "Narrowed write did not defer to par_197 posture family.",
  );
}

async function assertAccountDisclosureAndKeyboard(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/start-request/continue");
  const disclosure = page.locator("[data-testid='authenticated-account-disclosure']");
  assertCondition(
    (await disclosure.getAttribute("data-dominance")) === "secondary",
    "Account disclosure dominates.",
  );
  await page.locator("[data-testid='account-disclosure-toggle']").focus();
  await page.keyboard.press("Enter");
  const disclosureText = await disclosure.innerText();
  assertCondition(
    disclosureText.includes("Quiet account disclosure"),
    "Account disclosure did not open.",
  );
  assertCondition(
    (await activeTestId(page)) === "account-disclosure-toggle",
    "Keyboard focus did not land on disclosure toggle.",
  );
  await page.locator("[data-testid='continue-draft-entry-action']").focus();
  assertCondition(
    (await activeTestId(page)) === "continue-draft-entry-action",
    "Focus placement for restored dominant action failed.",
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
      await openApp(page, baseUrl, "/portal/start-request/continue");
      await assertNoOverflow(page);
      await screenshot(page, `output/playwright/199-signed-in-start-${size.name}.png`);
    } finally {
      await page.close();
    }
  }

  const context = await browser.newContext({
    viewport: { width: 390, height: 880 },
    reducedMotion: "reduce",
  });
  const reducedPage = await context.newPage();
  try {
    await openApp(reducedPage, baseUrl, "/portal/start-request/restore");
    const prefersReduced = await reducedPage.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    assertCondition(prefersReduced, "prefers-reduced-motion did not match reduced context.");
    await reducedPage.locator("[data-testid='restore-decision-notice']").waitFor();
    await screenshot(reducedPage, "output/playwright/199-signed-in-start-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function runBrowserChecks(browser: Browser): Promise<void> {
  expected199();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
  try {
    await openAtlas(page, staticServer.url);
    await assertAtlas(page);
    await screenshot(page, "output/playwright/199-signed-in-start-atlas.png");
    await assertStartUsesCanonicalIntake(page, patientWeb.baseUrl);
    await assertContinueDraft(page, patientWeb.baseUrl);
    await assertRestoreRefreshAndPostAuth(page, patientWeb.baseUrl);
    await assertPromotedAndNarrowed(page, patientWeb.baseUrl);
    await assertAccountDisclosureAndKeyboard(page, patientWeb.baseUrl);
    await assertResponsiveAndReducedMotion(browser, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected199();
  if (!process.argv.includes("--run")) {
    console.log("199_signed_in_request_creation_and_saved_context_restore.spec.ts: syntax ok");
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
