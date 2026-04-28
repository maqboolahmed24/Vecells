import type http from "node:http";
import { test, expect, type Browser, type Page } from "playwright/test";
import { closeServer, outputPath, startStaticServer } from "./255_workspace_shell_helpers";

let staticServer: http.Server;
let harnessUrl: string;

test.beforeAll(async () => {
  const started = await startStaticServer();
  staticServer = started.server;
  harnessUrl = new URL("/docs/frontend/430_phase8_trust_rollout_harness.html", started.atlasUrl).toString();
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
  if (state === "degraded") {
    return "DegradedEnvelopePanel";
  }
  if (state === "feedback") {
    return "FeedbackCapturePanel";
  }
  if (state === "rollout") {
    return "RolloutCardPanel";
  }
  if (state === "frozen") {
    return "FrozenStatePanel";
  }
  if (state === "rollback") {
    return "RollbackStatePanel";
  }
  return "TrustedEnvelopePanel";
}

async function tracedContext(browser: Browser, label: string, viewport = { width: 1360, height: 920 }) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  return { context, tracePath: outputPath(`430-${label}-trace.zip`) };
}

test("propagates trust envelope through trusted and degraded visible states", async ({ browser }) => {
  const { context, tracePath } = await tracedContext(browser, "trust-envelope");
  const page = await context.newPage();

  try {
    await openHarness(page, "trusted");
    await expect(page.getByTestId("TrustedEnvelopePanel")).toMatchAriaSnapshot({
      name: "430-trusted-envelope-panel.aria.yml",
    });
    await expect(page.getByTestId("TrustedEnvelopePanel")).toHaveScreenshot("430-trusted-envelope-panel.png", {
      animations: "disabled",
    });

    await page.getByRole("tab", { name: "Trusted" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("DegradedEnvelopePanel")).toBeVisible();
    await expect(page.getByTestId("DegradedEnvelopePanel")).toMatchAriaSnapshot({
      name: "430-degraded-envelope-panel.aria.yml",
    });
    await expect(page.getByRole("button", { name: "Insert draft disabled" })).toBeDisabled();
  } catch (error) {
    await context.tracing.stop({ path: tracePath });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: tracePath });
  await context.close();
});

test("captures feedback evidence without prohibited mutation requests", async ({ browser }) => {
  const { context, tracePath } = await tracedContext(browser, "feedback");
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
    await openHarness(page, "feedback");
    await expect(page.getByTestId("FeedbackCapturePanel")).toMatchAriaSnapshot({
      name: "430-feedback-capture-panel.aria.yml",
    });
    await page.getByTestId("AcceptFeedbackButton").click();
    await expect(page.getByTestId("FeedbackStatus")).toContainText("feedback recorded");
    await expect(page.getByTestId("FeedbackCapturePanel")).toHaveScreenshot("430-feedback-open-panel.png", {
      animations: "disabled",
    });

    const prohibitedMutation = observedRequests.filter((requestUrl) =>
      ["/api/patient/send", "/api/booking/commit", "/api/pharmacy/outcome", "/api/task/close"].some((path) =>
        requestUrl.includes(path),
      ),
    );
    expect(observedRequests.some((requestUrl) => requestUrl.includes("/api/assistive/feedback-audit"))).toBe(true);
    expect(prohibitedMutation).toEqual([]);
  } catch (error) {
    await context.tracing.stop({ path: tracePath });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: tracePath });
  await context.close();
});

test("renders rollout, frozen, and rollback cards with shared ops-release language", async ({ browser }) => {
  const { context, tracePath } = await tracedContext(browser, "rollout-frozen-rollback");
  const page = await context.newPage();

  try {
    await openHarness(page, "rollout");
    await expect(page.getByTestId("RolloutCardPanel")).toMatchAriaSnapshot({
      name: "430-rollout-card-panel.aria.yml",
    });
    await expect(page.getByTestId("RolloutCardPanel")).toHaveScreenshot("430-rollout-card-panel.png", {
      animations: "disabled",
    });
    await expect(page.getByText("Pilot cohort visible insert")).toHaveCount(3);

    await openHarness(page, "frozen");
    await expect(page.getByTestId("FrozenStatePanel")).toMatchAriaSnapshot({
      name: "430-frozen-state-panel.aria.yml",
    });
    await expect(page.getByTestId("FrozenStatePanel")).toHaveScreenshot("430-frozen-state-panel.png", {
      animations: "disabled",
    });
    await expect(page.getByRole("button", { name: "Export disabled" })).toBeDisabled();

    await openHarness(page, "rollback");
    await expect(page.getByTestId("RollbackStatePanel")).toBeVisible();
    await expect(page.getByRole("button", { name: "Promote rollout disabled" })).toBeDisabled();
    await expect(page.getByText("current rollout controls")).toBeVisible();
  } catch (error) {
    await context.tracing.stop({ path: tracePath });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: tracePath });
  await context.close();
});

test("proves narrow layout, reduced motion, keyboard flow, and hidden blocked content absence", async ({ browser }) => {
  const { context, tracePath } = await tracedContext(browser, "narrow-hidden", { width: 390, height: 860 });
  const page = await context.newPage();

  try {
    await openHarness(page, "frozen");
    await expect(page.getByTestId("FrozenStatePanel")).toBeVisible();
    await expect(page.getByTestId("FrozenStatePanel")).toHaveScreenshot("430-frozen-narrow-panel.png", {
      animations: "disabled",
    });

    await page.getByRole("tab", { name: "Frozen" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("RollbackStatePanel")).toBeVisible();

    const hiddenBlockedContent = await page.locator("[data-hidden-blocked-content]").textContent();
    expect(hiddenBlockedContent ?? "").not.toContain("RAW_ASSISTIVE_RATIONALE");
    const bodyText = await page.locator("body").textContent();
    expect(bodyText ?? "").not.toContain("CLINICIAN_ONLY_RATIONALE");
  } catch (error) {
    await context.tracing.stop({ path: tracePath });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: tracePath });
  await context.close();
});
