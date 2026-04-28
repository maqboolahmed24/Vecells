import type { ChildProcess } from "node:child_process";
import { test, expect } from "playwright/test";
import {
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";

let clinicalWorkspace: { child: ChildProcess; baseUrl: string };

test.beforeAll(async () => {
  clinicalWorkspace = await startClinicalWorkspace();
});

test.afterAll(async () => {
  await stopClinicalWorkspace(clinicalWorkspace.child);
});

test("exposes headings, plain button names, blocked messaging, and predictable focus order", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveDraft=insert-blocked-session`,
    "WorkspaceTaskRoute",
  );

  const deck = page.getByTestId("AssistiveDraftSectionDeck");
  await expect(page.getByRole("complementary", { name: "Assistive companion" })).toBeVisible();
  await expect(deck.getByRole("heading", { name: "Draft note sections" })).toBeVisible();
  await expect(deck.getByRole("heading", { name: "History summary", exact: true })).toBeVisible();
  await expect(deck.getByRole("heading", { name: "Safety-net plan", exact: true })).toBeVisible();
  await expect(deck.getByRole("button", { name: "Insert in shown slot" }).first()).toBeDisabled();
  await expect(deck.getByText("Insert blocked before click").first()).toBeVisible();

  const focusableNames = await deck.evaluate((node) =>
    Array.from(node.querySelectorAll<HTMLElement>("button, [tabindex]:not([tabindex='-1'])"))
      .filter((element) => !element.hasAttribute("hidden") && element.tabIndex >= 0)
      .map((element) => {
        if (element.getAttribute("data-assistive-draft-card") === "true") {
          return element.querySelector("h4")?.textContent?.trim() || "draft card";
        }
        return element.getAttribute("aria-label") || element.textContent?.trim() || element.tagName;
      }),
  );

  expect(focusableNames.slice(0, 7)).toEqual([
    "History summary",
    "Before",
    "After",
    "Compare",
    "Review target",
    "Keep draft visible",
    "Insert in shown slot",
  ]);

  const firstCard = page.getByTestId("AssistiveDraftSectionCard").first();
  const secondCard = page.getByTestId("AssistiveDraftSectionCard").nth(1);
  await firstCard.focus();
  await page.keyboard.press("ArrowDown");
  await expect(secondCard).toBeFocused();
  await page.keyboard.press("Home");
  await expect(firstCard).toBeFocused();
  await page.keyboard.press("End");
  await expect(secondCard).toBeFocused();

  await context.tracing.stop({
    path: outputPath("419-diffable-note-draft-accessibility-trace.zip"),
  });
  await context.close();
});

test("compare open fixture exposes a named compare control without changing target context", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  await openWorkspaceRoute(
    page,
    `${clinicalWorkspace.baseUrl}/workspace/task/task-311?assistiveRail=shadow-summary&assistiveDraft=compare-open`,
    "WorkspaceTaskRoute",
  );

  const firstCard = page.getByTestId("AssistiveDraftSectionCard").first();
  await expect(
    firstCard.getByRole("group", { name: "Compare view for History summary" }),
  ).toBeVisible();
  await expect(firstCard.getByRole("button", { name: "Compare" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(firstCard.getByTestId("AssistiveDraftDiffBlock")).toHaveAttribute(
    "data-compare-mode",
    "both",
  );
  await expect(firstCard.getByText("Decision note - history slot", { exact: true })).toBeVisible();

  await context.tracing.stop({
    path: outputPath("419-diffable-note-draft-compare-open-accessibility-trace.zip"),
  });
  await context.close();
});
