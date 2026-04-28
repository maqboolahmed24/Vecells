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
  "200_contact_truth_and_preference_atlas.html",
);
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "200_contact_truth_surface_contract.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "200_contact_source_editability_and_repair_matrix.csv",
);
const CASES_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "200_reachability_blocker_visibility_cases.json",
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
      pathname = "/docs/frontend/200_contact_truth_and_preference_atlas.html";
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
    url: `http://127.0.0.1:${port}/docs/frontend/200_contact_truth_and_preference_atlas.html`,
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

function expected200() {
  for (const filePath of [ATLAS_PATH, CONTRACT_PATH, MATRIX_PATH, CASES_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing par_200 artifact ${filePath}`);
  }
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")) as {
    readonly visualMode: string;
    readonly sourceFamilies: Record<string, { readonly editableHere: boolean }>;
    readonly reachabilityLaw: { readonly blockingActivePathPromotesPanel: boolean };
  };
  assertCondition(contract.visualMode === "Contact_Truth_Ledger", "Wrong visual mode.");
  assertCondition(
    contract.sourceFamilies.nhs_login_claim.editableHere === false,
    "NHS login claims became locally editable.",
  );
  assertCondition(
    contract.sourceFamilies.vecells_preference.editableHere === true,
    "Vecells preferences are not reviewable.",
  );
  assertCondition(
    contract.reachabilityLaw.blockingActivePathPromotesPanel === true,
    "Reachability blocker promotion contract is missing.",
  );
}

async function openAtlas(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Contact_Truth_Preference_Atlas']").waitFor();
}

async function openApp(page: Page, baseUrl: string, pathname: string): Promise<void> {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='Contact_Truth_Preference_Route']").waitFor();
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
    "source-of-truth-comparison-board",
    "source-of-truth-comparison-table",
    "editability-matrix",
    "editability-matrix-table",
    "reachability-blocker-gallery",
    "reachability-blocker-table",
    "repair-return-flow-diagram",
    "repair-return-flow-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  const atlasText = await page
    .locator("[data-testid='Contact_Truth_Preference_Atlas']")
    .innerText();
  assertCondition(
    atlasText.includes("Preference review changes Vecells communication behavior only"),
    "Atlas lost preference side-effect boundary.",
  );
  assertCondition(
    atlasText.includes("data-promoted-to-visible-panel=true"),
    "Atlas lost blocker promotion proof.",
  );
}

async function assertSourceSeparation(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/account/contact");
  const root = page.locator("[data-testid='Contact_Truth_Preference_Route']");
  assertCondition(
    (await root.getAttribute("data-visual-mode")) === "Contact_Truth_Ledger",
    "Route visual mode drifted.",
  );
  const nhs = page.locator("[data-testid='source-truth-card-nhs-login']");
  const prefs = page.locator("[data-testid='preference-ledger-card']");
  const pds = page.locator("[data-testid='demographic-source-card-pds']");
  const gp = page.locator("[data-testid='demographic-source-card-gp']");
  await nhs.waitFor();
  await prefs.waitFor();
  await pds.waitFor();
  await gp.waitFor();
  assertCondition(
    (await nhs.getAttribute("data-source-family")) === "nhs_login_claim",
    "NHS login source family drifted.",
  );
  assertCondition(
    (await nhs.getAttribute("data-editable-here")) === "false",
    "NHS login source became editable.",
  );
  assertCondition(
    (await prefs.getAttribute("data-source-family")) === "vecells_preference",
    "Preference source family drifted.",
  );
  assertCondition(
    (await prefs.getAttribute("data-editable-here")) === "true",
    "Vecells preferences are not editable/reviewable.",
  );
  assertCondition(
    (await pds.getAttribute("data-source-family")) === "external_demographic",
    "PDS family drifted.",
  );
  assertCondition(
    (await gp.getAttribute("data-row-available")) === "false",
    "GP unavailable row should be bounded absence in default environment.",
  );

  for (const testId of [
    "provenance-badge-row-nhs-login",
    "provenance-badge-row-vecells-preferences",
    "provenance-badge-row-pds",
    "provenance-badge-row-gp-system",
  ]) {
    const text = (await page.locator(`[data-testid='${testId}']`).innerText()).toLowerCase();
    assertCondition(
      text.includes("source") && text.includes("freshness") && text.includes("authority"),
      `${testId} is color-only or missing provenance text.`,
    );
  }
}

async function assertPreferenceReviewAndExternalAbsence(
  page: Page,
  baseUrl: string,
): Promise<void> {
  await openApp(page, baseUrl, "/portal/account/contact");
  await page.getByRole("button", { name: "Review Vecells preference" }).click();
  const reviewText = await page.locator("[data-testid='preference-review-panel']").innerText();
  assertCondition(
    reviewText.includes("Vecells communication behavior only"),
    "Preference review lost Vecells-only copy.",
  );
  assertCondition(
    reviewText.includes(
      "does not update NHS login claims, PDS demographic rows, or GP demographic rows",
    ),
    "Preference review implies cross-source write.",
  );
  const liveRegion = page.locator("[data-testid='contact-truth-live-region']");
  assertCondition((await liveRegion.getAttribute("aria-live")) === "polite", "Missing aria-live.");

  await openApp(page, baseUrl, "/portal/account/contact/external-off");
  const pdsText = await page.locator("[data-testid='demographic-source-card-pds']").innerText();
  const gpText = await page.locator("[data-testid='demographic-source-card-gp']").innerText();
  assertCondition(pdsText.includes("feature-gated off"), "PDS absence was silent.");
  assertCondition(
    gpText.includes("not projected") || gpText.includes("No value is inferred"),
    "GP absence was silent.",
  );
}

async function assertRepairRequiredSameShell(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/account/contact/repair");
  const root = page.locator("[data-testid='Contact_Truth_Preference_Route']");
  const risk = page.locator("[data-testid='reachability-risk-panel']");
  const repair = page.locator("[data-testid='contact-repair-entry-card']");
  assertCondition(
    (await root.getAttribute("data-blocks-active-path")) === "true",
    "Repair route does not block active path.",
  );
  assertCondition(
    (await risk.getAttribute("data-promoted-to-visible-panel")) === "true",
    "Reachability blocker was not promoted.",
  );
  assertCondition(
    (await repair.getAttribute("data-same-shell-required")) === "true",
    "Repair is not same-shell.",
  );
  assertCondition(
    (await repair.getAttribute("data-context-preserved")) === "true",
    "Blocked action context is not preserved.",
  );
  await page.locator("[data-testid='contact-repair-action']").click();
  assertCondition(
    (await repair.getAttribute("data-repair-started")) === "true",
    "Repair action did not start in shell.",
  );
  await page.locator("[data-testid='contact-return-action']").click();
  assertCondition(
    (await root.getAttribute("data-same-shell-return")) === "true",
    "Return did not stay in the same shell.",
  );
  const returnTarget =
    (await page
      .locator("[data-testid='contact-return-action']")
      .getAttribute("data-return-target")) ?? "";
  assertCondition(returnTarget.includes("REQ-4219#reply-window"), "Return target lost context.");
  assertCondition(
    (await page.locator("[data-testid='contact-truth-live-region']").innerText()).includes(
      "same shell",
    ),
    "Same-shell return was not announced.",
  );
}

async function assertKeyboardSemantics(page: Page, baseUrl: string): Promise<void> {
  await openApp(page, baseUrl, "/portal/account/contact");
  await page.locator("[data-testid='preference-review-action']").focus();
  assertCondition(
    (await activeTestId(page)) === "preference-review-action",
    "Keyboard focus did not land on preference review action.",
  );
  await page.keyboard.press("Enter");
  await page.locator("[data-testid='preference-review-panel']").waitFor();

  await openApp(page, baseUrl, "/portal/account/contact/repair");
  await page.locator("[data-testid='contact-return-action']").focus();
  assertCondition(
    (await activeTestId(page)) === "contact-return-action",
    "Keyboard focus did not land on repair return action.",
  );
}

async function assertResponsiveAndReducedMotion(browser: Browser, baseUrl: string): Promise<void> {
  const sizes = [
    { name: "desktop", width: 1280, height: 1040 },
    { name: "tablet", width: 900, height: 980 },
    { name: "mobile", width: 390, height: 880 },
  ];
  for (const size of sizes) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    try {
      await openApp(page, baseUrl, "/portal/account/contact/repair");
      await assertNoOverflow(page);
      if (size.name === "mobile") {
        const positions = await page.evaluate(() => {
          const repair = document.querySelector("[data-testid='contact-repair-entry-card']");
          const grid = document.querySelector("[data-testid='contact-source-card-grid']");
          if (!(repair instanceof HTMLElement) || !(grid instanceof HTMLElement)) {
            throw new Error("Repair card or source grid missing.");
          }
          return {
            repairTop: repair.getBoundingClientRect().top,
            gridTop: grid.getBoundingClientRect().top,
          };
        });
        assertCondition(
          positions.repairTop < positions.gridTop,
          "Mobile repair card is not promoted before lower-priority source cards.",
        );
      }
      await screenshot(page, `output/playwright/200-contact-truth-${size.name}.png`);
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
    await openApp(reducedPage, baseUrl, "/portal/account/contact/repair");
    const prefersReduced = await reducedPage.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    assertCondition(prefersReduced, "prefers-reduced-motion did not match reduced context.");
    await reducedPage.locator("[data-testid='contact-repair-entry-card']").waitFor();
    await screenshot(reducedPage, "output/playwright/200-contact-truth-reduced-motion.png");
  } finally {
    await context.close();
  }
}

async function runBrowserChecks(browser: Browser): Promise<void> {
  expected200();
  const staticServer = await startStaticServer();
  const patientWeb = await startPatientWeb();
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
  try {
    await openAtlas(page, staticServer.url);
    await assertAtlas(page);
    await screenshot(page, "output/playwright/200-contact-truth-atlas.png");
    await assertSourceSeparation(page, patientWeb.baseUrl);
    await assertPreferenceReviewAndExternalAbsence(page, patientWeb.baseUrl);
    await assertRepairRequiredSameShell(page, patientWeb.baseUrl);
    await assertKeyboardSemantics(page, patientWeb.baseUrl);
    await assertResponsiveAndReducedMotion(browser, patientWeb.baseUrl);
  } finally {
    await page.close();
    await stopPatientWeb(patientWeb.child);
    await closeServer(staticServer.server);
  }
}

async function main(): Promise<void> {
  expected200();
  if (!process.argv.includes("--run")) {
    console.log("200_contact_claim_visibility_and_preference_separation_ui.spec.ts: syntax ok");
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
