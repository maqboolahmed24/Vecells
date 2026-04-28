import {
  assertCondition,
  countRenderedQueueRows,
  captureAriaTree,
  ensurePhiSafeWorkspace,
  importPlaywright,
  openCommandPalette,
  openHardeningWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  startTracedContext,
  stopClinicalWorkspace,
  stopTrace,
  trackExternalRequests,
  waitForFocusOn,
  writeWorkspaceAriaSnapshots,
} from "./276_workspace_hardening.helpers";

async function runBrowserSemanticPass(
  browserProject: string,
  browserType: any,
  baseUrl: string,
  allSnapshots: Record<string, unknown>,
): Promise<void> {
  const browser = await browserType.launch({ headless: true });
  const context = await startTracedContext(browser);
  const page = await context.newPage();
  const externalRequests = new Set<string>();
  trackExternalRequests(page, baseUrl, externalRequests);

  try {
    await openHardeningWorkspaceRoute(
      page,
      baseUrl,
      "/workspace/queue/recommended?state=live",
      "WorkspaceQueueRoute",
      ["hardening_safe", "large_queue"],
    );
    await ensurePhiSafeWorkspace(page);

    const root = page.locator("[data-testid='WorkspaceShellRouteFamily']");
    assertCondition(
      (await root.getAttribute("data-semantic-coverage-state")) === "complete",
      `${browserProject} queue route should expose complete semantic coverage`,
    );
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Quiet_Clinical_Ergonomic_Hardening",
      `${browserProject} queue route should expose the hardened workspace visual mode`,
    );

    const declaredRowCount = Number(
      (await page.locator("[data-testid='queue-workboard']").getAttribute("data-row-count")) ?? "0",
    );
    const renderedRowCount = await countRenderedQueueRows(page);
    assertCondition(declaredRowCount > 50, `${browserProject} should exercise a >50 row queue`);
    assertCondition(
      renderedRowCount < declaredRowCount,
      `${browserProject} should render a windowed subset instead of the full queue`,
    );

    allSnapshots[`${browserProject}.queue_workboard`] = await captureAriaTree(
      page,
      "#workspace-workboard",
    );

    await openHardeningWorkspaceRoute(
      page,
      baseUrl,
      "/workspace/task/task-311?state=live",
      "WorkspaceTaskRoute",
    );
    await ensurePhiSafeWorkspace(page);

    assertCondition(
      ((await root.getAttribute("data-keyboard-region-order")) ?? "").includes(
        "workspace-workboard -> workspace-task-canvas -> workspace-decision-dock -> workspace-context-region",
      ),
      `${browserProject} should publish the declared pane order`,
    );
    assertCondition(
      (await page.locator(".staff-shell__skip-link").count()) === 4,
      `${browserProject} task route should expose four skip links`,
    );

    await page.locator(".staff-shell__skip-link").first().focus();
    assertCondition(
      await page.evaluate(() => {
        const active = document.activeElement;
        return active instanceof Element ? active.matches(".staff-shell__skip-link") : false;
      }),
      `${browserProject} skip rail should expose a focusable skip link`,
    );
    await page.keyboard.press("Enter");
    await waitForFocusOn(page, "#workspace-workboard");

    await page.locator("[data-testid='WorkspaceCommandPaletteTrigger']").focus();
    await openCommandPalette(page);
    await page.keyboard.press("Escape");
    await page.locator("[data-testid='WorkspaceCommandPaletteDialog']").waitFor({ state: "detached" });
    await waitForFocusOn(page, "[data-testid='WorkspaceCommandPaletteTrigger']");

    allSnapshots[`${browserProject}.task_canvas`] = await captureAriaTree(
      page,
      "#workspace-task-canvas",
    );
    allSnapshots[`${browserProject}.decision_dock`] = await captureAriaTree(
      page,
      "#workspace-decision-dock",
    );

    await openHardeningWorkspaceRoute(
      page,
      baseUrl,
      "/workspace/task/task-311/more-info?state=read_only",
      "WorkspaceMoreInfoChildRoute",
    );
    await ensurePhiSafeWorkspace(page);
    await page.locator("[data-testid='ProtectedCompositionRecovery']").waitFor();
    assertCondition(
      await page.locator(".staff-shell__note-field textarea").isDisabled(),
      `${browserProject} read-only more-info route should fence the draft field`,
    );
    allSnapshots[`${browserProject}.read_only_recovery`] = await captureAriaTree(
      page,
      "[data-testid='ProtectedCompositionRecovery']",
    );

    await openHardeningWorkspaceRoute(
      page,
      baseUrl,
      "/workspace/approvals?state=live",
      "WorkspaceApprovalsRoute",
    );
    allSnapshots[`${browserProject}.peer_route`] = await captureAriaTree(
      page,
      "#workspace-peer-route",
    );

    assertCondition(
      externalRequests.size === 0,
      `${browserProject} emitted unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await stopTrace(context, `276-workspace-semantics-${browserProject}.trace.zip`);
    await browser.close();
  }
}

async function launchSecondaryBrowser(playwright: any): Promise<{ name: string; type: any }> {
  try {
    await playwright.firefox.launch({ headless: true }).then((browser: any) => browser.close());
    return { name: "firefox", type: playwright.firefox };
  } catch {
    await playwright.webkit.launch({ headless: true }).then((browser: any) => browser.close());
    return { name: "webkit", type: playwright.webkit };
  }
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const snapshots: Record<string, unknown> = {};

  try {
    await runBrowserSemanticPass("chromium", playwright.chromium, baseUrl, snapshots);
    const secondary = await launchSecondaryBrowser(playwright);
    await runBrowserSemanticPass(secondary.name, secondary.type, baseUrl, snapshots);
    await writeWorkspaceAriaSnapshots(snapshots, "276-workspace-aria-snapshots.json");
  } finally {
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
