import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importPlaywright, waitForHttp } from "./simulator-backplane-test-helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT = path.resolve(__dirname, "..", "..");
export const APP_DIR = path.join(ROOT, "apps", "governance-console");
export const APP_URL = "http://127.0.0.1:4319";
export const OUTPUT_DIR = path.join(ROOT, ".artifacts", "role-scope-studio-458");

type StartedServer = {
  readonly child: ChildProcessWithoutNullStreams;
  readonly logs: string[];
};

export async function startGovernanceConsole(): Promise<StartedServer> {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", "4319", "--strictPort"],
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
    await waitForHttp(`${APP_URL}/ops/access/role-scope-studio`, 25_000);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`governance-console failed to start.\n${logs.join("")}`, { cause: error });
  }
  return { child, logs };
}

export async function stopGovernanceConsole(child: ChildProcessWithoutNullStreams) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

export async function expectAttribute(locator: any, name: string, expected: string): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 3_000) {
    const value = await locator.getAttribute(name);
    if (value === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const value = await locator.getAttribute(name);
  assert.equal(value, expected, `Expected ${name}=${expected}, found ${value}.`);
}

export async function writeAccessibilitySnapshot(page: any, name: string): Promise<string> {
  if (page.accessibility?.snapshot) {
    const snapshot = await page.accessibility.snapshot({ interestingOnly: false });
    const serialized = JSON.stringify(snapshot, null, 2);
    fs.writeFileSync(path.join(OUTPUT_DIR, name), serialized);
    return serialized;
  }
  const locatorSnapshot =
    typeof page.locator("body").ariaSnapshot === "function"
      ? await page.locator("body").ariaSnapshot()
      : await page.locator("body").evaluate((body: HTMLElement) => body.innerText);
  fs.writeFileSync(path.join(OUTPUT_DIR, name), String(locatorSnapshot));
  return String(locatorSnapshot);
}

async function withBrowser(
  callback: (page: any, context: any, browser: any) => Promise<void>,
  options: { viewport?: { width: number; height: number }; reducedMotion?: boolean } = {},
) {
  const playwright = await importPlaywright();
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const { child } = await startGovernanceConsole();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: options.viewport ?? { width: 1440, height: 1100 },
    reducedMotion: options.reducedMotion ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  page.on("console", (message: any) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error: Error) => pageErrors.push(error.message));
  page.on("requestfailed", (request: any) => {
    requestFailures.push(`${request.method()} ${request.url()}`);
  });
  try {
    await callback(page, context, browser);
    assert.deepEqual(consoleErrors, [], `Unexpected console errors: ${consoleErrors.join("\n")}`);
    assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join("\n")}`);
    assert.deepEqual(
      requestFailures,
      [],
      `Unexpected failed network requests: ${requestFailures.join("\n")}`,
    );
  } finally {
    await browser.close();
    await stopGovernanceConsole(child);
  }
}

export async function runRoleScopeStudioFlowSuite() {
  await withBrowser(async (page) => {
    await page.goto(`${APP_URL}/ops/access/role-scope-studio?state=normal`, {
      waitUntil: "networkidle",
    });
    const root = page.locator("[data-testid='governance-shell-root']");
    const studio = page.locator("[data-testid='role-scope-studio']");
    await root.waitFor();
    await studio.waitFor();
    await expectAttribute(root, "data-current-path", "/ops/access/role-scope-studio");
    await expectAttribute(studio, "data-visual-mode", "Role_Scope_Proof_Studio");
    await expectAttribute(studio, "data-binding-state", "live");
    await expectAttribute(studio, "data-action-control-state", "preview_only");
    await expectAttribute(studio, "data-no-live-mutation-controls", "true");

    for (const surface of [
      "governance-scope-ribbon-458",
      "role-scope-matrix",
      "effective-access-preview-pane",
      "access-mask-diff-card",
      "break-glass-elevation-summary",
      "release-freeze-card-rail",
      "denied-action-explainer",
      "scope-tuple-inspector",
      "governance-return-context-strip",
    ]) {
      await page.locator(`[data-testid='${surface}']`).waitFor();
    }

    assert(
      (await page.locator("[data-testid='role-scope-matrix'] tbody tr").count()) >= 7,
      "role scope matrix should render route/action family rows",
    );
    await page.locator("[data-testid='role-scope-row-route_family_incident_command']").click();
    await expectAttribute(studio, "data-selected-route-family", "route-family:incident-command");
    assert(
      (await page.locator("[data-testid='effective-access-preview-pane']").innerText()).includes(
        "incident_review",
      ),
      "access preview should follow selected route family",
    );
    await page.locator("[data-testid='role-scope-persona-persona_incident_commander']").click();
    assert(
      (await page.locator("[data-testid='break-glass-elevation-summary']").innerText()).includes(
        "Adequate",
      ),
      "incident persona should expose break-glass reason adequacy",
    );
    await page.locator("[data-testid='denied-action-export_preview']").click();
    await expectAttribute(
      page.locator("[data-testid='denied-action-explainer']"),
      "data-selected-action",
      "export_preview",
    );
    await page
      .locator("[data-testid='role-scope-cell-route_family_access_governance-ordinary']")
      .focus();
    await page.keyboard.press("Enter");
    await expectAttribute(studio, "data-selected-route-family", "route-family:access-governance");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "role-scope-studio-normal-desktop.png"),
      fullPage: true,
    });

    const cases = [
      ["normal", "live", "preview_only", "live"],
      ["empty", "live", "preview_only", "empty"],
      ["stale", "stale_review", "diagnostic_only", "stale"],
      ["degraded", "degraded_read_only", "diagnostic_only", "degraded"],
      ["blocked", "blocked", "blocked", "blocked"],
      ["permission-denied", "permission_denied", "metadata_only", "denied"],
      ["settlement-pending", "settlement_pending", "settlement_pending", "pending_settlement"],
      ["frozen", "release_frozen", "frozen", "frozen"],
      ["masked", "live", "preview_only", "masked"],
    ];
    for (const [query, binding, action, preview] of cases) {
      await page.goto(`${APP_URL}/ops/access/role-scope-studio?state=${query}`, {
        waitUntil: "networkidle",
      });
      await studio.waitFor();
      await expectAttribute(studio, "data-binding-state", binding);
      await expectAttribute(studio, "data-action-control-state", action);
      await expectAttribute(studio, "data-preview-state", preview);
    }
  });
}

export async function runRoleScopeStudioMaskingSuite() {
  await withBrowser(async (page) => {
    await page.goto(`${APP_URL}/ops/access/role-scope-studio?state=masked`, {
      waitUntil: "networkidle",
    });
    const mask = page.locator("[data-testid='access-mask-diff-card']");
    await mask.waitFor();
    await expectAttribute(mask, "data-telemetry-redacted", "true");
    await expectAttribute(mask, "data-hidden-fields-not-rendered", "true");
    const bodyText = await page.locator("body").innerText();
    assert(bodyText.includes("Masked synthetic patient identifier"));
    assert(!bodyText.includes("Raw artifact fragment"));
    assert(!bodyText.includes("rawPatientIdentifier"));
    assert(!bodyText.includes("Synthetic patient Ada"));
    const domText = await page.locator("body").evaluate((body: HTMLElement) => body.textContent);
    assert(!String(domText).includes("Raw artifact fragment"));
    await writeAccessibilitySnapshot(page, "role-scope-masked-accessibility.json");
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "role-scope-studio-masked.png"),
      fullPage: true,
    });
  });
}

export async function runRoleScopeStudioFreezeSuite() {
  await withBrowser(async (page) => {
    await page.goto(`${APP_URL}/ops/access/role-scope-studio?state=frozen`, {
      waitUntil: "networkidle",
    });
    const studio = page.locator("[data-testid='role-scope-studio']");
    await studio.waitFor();
    await expectAttribute(studio, "data-action-control-state", "frozen");
    await expectAttribute(
      page.locator("[data-testid='role-scope-action-approve_role']"),
      "data-action-allowed",
      "false",
    );
    await expectAttribute(
      page.locator("[data-testid='role-scope-action-export_preview']"),
      "data-action-allowed",
      "false",
    );
    assert.equal(
      await page
        .locator("[data-testid='release-freeze-card-rail'] [data-release-freeze-card]")
        .count(),
      6,
      "release freeze rail should expose all six card kinds",
    );
    assert(
      (await page.locator("[data-testid='role-scope-matrix'] [data-state='frozen']").count()) >= 14,
      "frozen state should visibly freeze export, approval, and admin capability cells",
    );
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "role-scope-studio-frozen.png"),
      fullPage: true,
    });
  });
}

export async function runRoleScopeStudioAccessibilitySuite() {
  await withBrowser(async (page) => {
    await page.goto(`${APP_URL}/ops/access/role-scope-studio?state=permission-denied`, {
      waitUntil: "networkidle",
    });
    await page.getByRole("banner").waitFor();
    await page.getByRole("main").waitFor();
    await page.getByRole("table", { name: /Role grants by route family/i }).waitFor();
    await page.locator("[data-testid='role-scope-persona-persona_service_owner_denied']").focus();
    await page.keyboard.press("Enter");
    await expectAttribute(
      page.locator("[data-testid='role-scope-studio']"),
      "data-access-decision",
      "deny",
    );
    await page.keyboard.press("Tab");
    const activeTag = await page.evaluate(() => document.activeElement?.tagName);
    assert.notEqual(activeTag, "BODY", "keyboard focus should move to another control");
    const snapshot = await writeAccessibilitySnapshot(
      page,
      "role-scope-permission-denied-a11y.json",
    );
    assert(snapshot.includes("Role scope studio") || snapshot.includes("Governance"));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, "role-scope-studio-permission-denied.png"),
      fullPage: true,
    });
  });
}

export async function runRoleScopeStudioVisualSuite() {
  const viewports = [
    ["desktop", { width: 1440, height: 1100 }],
    ["laptop", { width: 1280, height: 900 }],
    ["tablet", { width: 820, height: 1180 }],
    ["narrow-mission-stack", { width: 390, height: 920 }],
  ] as const;

  for (const [name, viewport] of viewports) {
    await withBrowser(
      async (page) => {
        await page.goto(`${APP_URL}/ops/access/role-scope-studio?state=normal`, {
          waitUntil: "networkidle",
        });
        await page.locator("[data-testid='role-scope-studio']").waitFor();
        await page.screenshot({
          path: path.join(OUTPUT_DIR, `role-scope-studio-${name}.png`),
          fullPage: true,
        });
      },
      { viewport },
    );
  }

  await withBrowser(
    async (page) => {
      await page.goto(`${APP_URL}/ops/access/role-scope-studio?state=stale`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-testid='role-scope-studio']").waitFor();
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "role-scope-studio-reduced-motion-stale.png"),
        fullPage: true,
      });
    },
    { viewport: { width: 1280, height: 900 }, reducedMotion: true },
  );

  await withBrowser(
    async (page) => {
      await page.goto(`${APP_URL}/ops/access/role-scope-studio?state=settlement-pending`, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
      });
      await page.locator("[data-testid='role-scope-studio']").waitFor();
      await page.screenshot({
        path: path.join(OUTPUT_DIR, "role-scope-studio-200-percent-zoom.png"),
        fullPage: true,
      });
    },
    { viewport: { width: 720, height: 900 } },
  );
}
