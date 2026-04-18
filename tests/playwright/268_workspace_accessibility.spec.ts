import {
  assertCondition,
  importPlaywright,
  openWorkspaceRoute,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-208?state=live`, "WorkspaceTaskRoute");
    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    await root.waitFor();
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Quiet_Clinical_Ergonomic_Hardening",
      "shell visual mode should expose Quiet_Clinical_Ergonomic_Hardening",
    );
    assertCondition(
      (await root.getAttribute("aria-describedby")) === "workspace-shell-keyboard-model",
      "shell should describe the keyboard model to assistive technology",
    );
    assertCondition(
      ((await root.getAttribute("data-keyboard-region-order")) ?? "").includes("workspace-workboard"),
      "shell should publish the ordered pane model",
    );

    const skipLinks = page.locator(".staff-shell__skip-link");
    assertCondition((await skipLinks.count()) === 4, "task route should expose four skip links");
    assertCondition(
      (await page.locator("[data-testid='WorkspaceNavRail']").getAttribute("data-surface")) === "workspace_navigation",
      "nav rail should publish workspace_navigation semantics",
    );
    assertCondition(
      (await page.locator("#workspace-workboard").getAttribute("data-surface")) === "queue_workboard",
      "workboard should publish queue_workboard semantics",
    );
    assertCondition(
      (await page.locator("#workspace-task-canvas").getAttribute("data-surface")) === "task_canvas",
      "task canvas should publish task_canvas semantics",
    );
    assertCondition(
      (await page.locator("#workspace-decision-dock").getAttribute("data-surface")) === "decision_dock",
      "decision dock should publish decision_dock semantics",
    );
    assertCondition(
      (await page.locator("#workspace-context-region").getAttribute("data-surface")) === "context_region",
      "context region should publish context_region semantics",
    );
    await writeAccessibilitySnapshot(page, "268-workspace-task-accessibility-snapshot.json");

    await openWorkspaceRoute(page, `${baseUrl}/workspace/approvals?state=live`, "WorkspaceApprovalsRoute");
    assertCondition(
      (await page.locator("#workspace-peer-route").getAttribute("data-surface")) === "peer_route",
      "peer routes should publish peer_route semantics",
    );
    assertCondition(
      (await page.locator("[data-testid='WorkspaceAnnouncementHub']").getAttribute("data-announcement-channel")) ===
        "polite",
      "live approvals route should use a polite summary channel",
    );
    await writeAccessibilitySnapshot(page, "268-workspace-approvals-accessibility-snapshot.json");

    await openWorkspaceRoute(page, `${baseUrl}/workspace/callbacks?state=blocked`, "WorkspaceCallbacksRoute");
    assertCondition(
      (await page.locator("[data-testid='WorkspaceAnnouncementHub']").getAttribute("data-announcement-channel")) ===
        "assertive",
      "blocked callback route should escalate to an assertive announcement",
    );
    await writeAccessibilitySnapshot(page, "268-workspace-callbacks-accessibility-snapshot.json");

    await openWorkspaceRoute(page, `${baseUrl}/workspace/consequences?state=live`, "WorkspaceConsequencesRoute");
    await writeAccessibilitySnapshot(page, "268-workspace-consequences-accessibility-snapshot.json");

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await browser.close();
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
