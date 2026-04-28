import type http from "node:http";
import { test, expect } from "playwright/test";
import { closeServer, outputPath, startStaticServer } from "./255_workspace_shell_helpers";

let staticServer: http.Server;
let harnessUrl: string;

test.beforeAll(async () => {
  const started = await startStaticServer();
  staticServer = started.server;
  harnessUrl = new URL("/docs/frontend/428_phase8_offline_eval_harness.html", started.atlasUrl).toString();
});

test.afterAll(async () => {
  await closeServer(staticServer);
});

async function openHarness(page: any, state: string) {
  const consoleErrors: string[] = [];
  page.on("console", (message: any) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  await page.goto(`${harnessUrl}?state=${state}`, { waitUntil: "networkidle" });
  await page.getByTestId(`${stateTestId(state)}-panel`).waitFor();
  expect(consoleErrors).toEqual([]);
}

function stateTestId(state: string): string {
  if (state === "red") {
    return "red-flag-result";
  }
  if (state === "hallucination") {
    return "hallucination-blocked";
  }
  if (state === "stale") {
    return "stale-frozen";
  }
  return "safe-result";
}

test("renders evaluated result panels with ARIA snapshots and keyboard-only state changes", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1360, height: 920 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openHarness(page, "safe");
    await expect(page.getByTestId("safe-result-panel")).toMatchAriaSnapshot({
      name: "428-safe-result-panel.aria.yml",
    });

    const keyboard = page.keyboard;
    await page.getByRole("tab", { name: "Grounded" }).focus();
    await keyboard.press("ArrowRight");
    await expect(page.getByTestId("red-flag-result-panel")).toBeVisible();
    await expect(page.getByTestId("red-flag-result-panel")).toMatchAriaSnapshot({
      name: "428-red-flag-result-panel.aria.yml",
    });

    await keyboard.press("ArrowRight");
    await expect(page.getByTestId("hallucination-blocked-panel")).toBeVisible();
    await expect(page.getByTestId("hallucination-blocked-panel")).toMatchAriaSnapshot({
      name: "428-hallucination-blocked-panel.aria.yml",
    });

    await keyboard.press("ArrowRight");
    await expect(page.getByTestId("stale-frozen-panel")).toBeVisible();
    await expect(page.getByTestId("stale-frozen-panel")).toMatchAriaSnapshot({
      name: "428-stale-frozen-panel.aria.yml",
    });

    await expect(page.getByTestId("AutonomousWriteButton")).toHaveCount(0);
    await expect(page.getByText(/Send to patient|Commit booking|Change pharmacy outcome/i)).toHaveCount(0);
  } catch (error) {
    await context.tracing.stop({ path: outputPath("428-offline-eval-aria-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("428-offline-eval-aria-trace.zip") });
  await context.close();
});

test("captures safe, red-flag, hallucination-blocked, and stale-frozen visual evidence", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1360, height: 920 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  try {
    await openHarness(page, "safe");
    await expect(page.getByTestId("safe-result-panel")).toHaveScreenshot("428-safe-result-panel.png", {
      animations: "disabled",
    });

    await openHarness(page, "red");
    await expect(page.getByTestId("red-flag-result-panel")).toHaveScreenshot("428-red-flag-result-panel.png", {
      animations: "disabled",
    });

    await openHarness(page, "hallucination");
    await expect(page.getByTestId("hallucination-blocked-panel")).toHaveScreenshot(
      "428-hallucination-blocked-panel.png",
      {
        animations: "disabled",
      },
    );

    await openHarness(page, "stale");
    await expect(page.getByTestId("stale-frozen-panel")).toHaveScreenshot("428-stale-frozen-panel.png", {
      animations: "disabled",
    });
  } catch (error) {
    await context.tracing.stop({ path: outputPath("428-offline-eval-visual-failure-trace.zip") });
    await context.close();
    throw error;
  }

  await context.tracing.stop({ path: outputPath("428-offline-eval-visual-trace.zip") });
  await context.close();
});
