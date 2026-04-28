import type http from "node:http";
import { test, expect, type Browser, type Page } from "playwright/test";
import { closeServer, outputPath, startStaticServer } from "./255_workspace_shell_helpers";

let staticServer: http.Server;
let harnessUrl: string;

test.beforeAll(async () => {
  const started = await startStaticServer();
  staticServer = started.server;
  harnessUrl = new URL("/docs/frontend/429_phase8_invocation_regression_harness.html", started.atlasUrl).toString();
});

test.afterAll(async () => {
  await closeServer(staticServer);
});

async function openHarness(page: Page, state: string) {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  await page.goto(`${harnessUrl}?state=${state}`, { waitUntil: "networkidle" });
  await page.getByTestId(stateTestId(state)).waitFor();
  expect(consoleErrors).toEqual([]);
}

function stateTestId(state: string): string {
  if (state === "blocked") {
    return "BlockedInvocationPanel";
  }
  if (state === "kill") {
    return "KillSwitchPanel";
  }
  if (state === "draft") {
    return "DraftInsertionPanel";
  }
  if (state === "stale") {
    return "StaleFreezePanel";
  }
  if (state === "denied") {
    return "VisibilityDeniedPanel";
  }
  return "AllowedInvocationPanel";
}

async function tracedContext(browser: Browser, label: string, viewport = { width: 1360, height: 920 }) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  return { context, tracePath: outputPath(`429-${label}-trace.zip`) };
}

test("renders allowed and blocked invocation states with ARIA, keyboard, and screenshots", async ({ browser }) => {
  const { context, tracePath } = await tracedContext(browser, "allowed-blocked");
  const page = await context.newPage();

  try {
    await openHarness(page, "allowed");
    await expect(page.getByTestId("AllowedInvocationPanel")).toMatchAriaSnapshot({
      name: "429-allowed-invocation-panel.aria.yml",
    });
    await expect(page.getByTestId("AllowedInvocationPanel")).toHaveScreenshot("429-allowed-invocation-panel.png", {
      animations: "disabled",
    });

    const keyboard = page.keyboard;
    await page.getByRole("tab", { name: "Allowed" }).focus();
    await keyboard.press("ArrowRight");
    await expect(page.getByTestId("BlockedInvocationPanel")).toBeVisible();
    await expect(page.getByTestId("BlockedInvocationPanel")).toMatchAriaSnapshot({
      name: "429-blocked-invocation-panel.aria.yml",
    });
    await expect(page.getByTestId("BlockedInvocationPanel")).toHaveScreenshot("429-blocked-invocation-panel.png", {
      animations: "disabled",
    });
    await expect(page.getByText(/Send to patient|Commit booking|Change pharmacy outcome|Close task/i)).toHaveCount(0);
  } catch (error) {
    await context.tracing.stop({ path: tracePath });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: tracePath });
  await context.close();
});

test("freezes an open output when a kill switch lands without cache refresh assumptions", async ({ browser }) => {
  const { context, tracePath } = await tracedContext(browser, "kill-switch");
  const page = await context.newPage();

  try {
    await openHarness(page, "allowed");
    await page.getByTestId("ActivateKillSwitch").click();
    await expect(page.getByTestId("KillSwitchPanel")).toBeVisible();
    await expect(page.getByTestId("KillSwitchPanel")).toMatchAriaSnapshot({
      name: "429-kill-switch-panel.aria.yml",
    });
    await expect(page.getByTestId("KillSwitchPanel")).toHaveScreenshot("429-kill-switch-panel.png", {
      animations: "disabled",
    });
    await expect(page.getByRole("button", { name: "Insert draft disabled" })).toBeDisabled();
    await expect(page.getByText("No refresh required")).toBeVisible();
  } catch (error) {
    await context.tracing.stop({ path: tracePath });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: tracePath });
  await context.close();
});

test("inserts and undoes a suggested draft without prohibited mutation network calls", async ({ browser }) => {
  const { context, tracePath } = await tracedContext(browser, "draft-insertion");
  const page = await context.newPage();
  const observedRequests: string[] = [];

  await page.route("**/api/**", async (route) => {
    observedRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  try {
    await openHarness(page, "draft");
    await expect(page.getByTestId("DraftInsertionPanel")).toMatchAriaSnapshot({
      name: "429-draft-insertion-panel.aria.yml",
    });

    await page.getByTestId("InsertDraftButton").click();
    await expect(page.getByTestId("DraftStatus")).toContainText("Inserted as suggested support");
    await expect(page.getByTestId("UndoDraftButton")).toBeEnabled();
    await expect(page.getByTestId("DraftInsertionPanel")).toHaveScreenshot("429-draft-inserted-panel.png", {
      animations: "disabled",
    });

    await page.getByTestId("UndoDraftButton").click();
    await expect(page.getByTestId("DraftStatus")).toHaveText("Not inserted");
    await expect(page.getByTestId("InsertDraftButton")).toBeEnabled();

    expect(observedRequests.some((requestUrl) => requestUrl.includes("/api/assistive/audit-draft-insert"))).toBe(true);
    const prohibitedMutation = observedRequests.filter((requestUrl) =>
      ["/api/patient/send", "/api/booking/commit", "/api/pharmacy/outcome", "/api/task/close"].some((path) =>
        requestUrl.includes(path),
      ),
    );
    expect(prohibitedMutation).toEqual([]);
  } catch (error) {
    await context.tracing.stop({ path: tracePath });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: tracePath });
  await context.close();
});

test("covers stale freeze, visibility denial, hidden DOM checks, reduced motion, and narrow layout", async ({ browser }) => {
  const { context, tracePath } = await tracedContext(browser, "visibility-narrow", { width: 390, height: 860 });
  const page = await context.newPage();

  try {
    await openHarness(page, "stale");
    await expect(page.getByTestId("StaleFreezePanel")).toMatchAriaSnapshot({
      name: "429-stale-freeze-panel.aria.yml",
    });
    await expect(page.getByRole("button", { name: "Regenerate in place" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Insert draft disabled" })).toBeDisabled();

    await openHarness(page, "denied");
    await expect(page.getByTestId("VisibilityDeniedPanel")).toMatchAriaSnapshot({
      name: "429-visibility-denied-panel.aria.yml",
    });
    await expect(page.getByTestId("VisibilityDeniedPanel")).toBeVisible();
    await expect(page.getByRole("button", { name: "Raw rationale disabled" })).toBeDisabled();
    await expect(page.locator("[data-testid='RawAssistiveRationale']")).toHaveCount(0);

    const hiddenDom = await page.locator("[data-hidden-dom-sentinel]").textContent();
    expect(hiddenDom ?? "").not.toContain("RAW_ASSISTIVE_RATIONALE");
    const fullDomText = await page.locator("body").textContent();
    expect(fullDomText ?? "").not.toContain("CLINICIAN_ONLY_RATIONALE");
    await expect(page.getByTestId("VisibilityDeniedPanel")).toHaveScreenshot("429-visibility-denied-narrow-panel.png", {
      animations: "disabled",
    });
  } catch (error) {
    await context.tracing.stop({ path: tracePath });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: tracePath });
  await context.close();
});
