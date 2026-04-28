import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  startStaticServer,
  stopClinicalWorkspace,
  closeServer,
  trackExternalRequests,
} from "./255_workspace_shell_helpers";

export const workspaceShellVisualCoverage = [
  "home desktop screenshot",
  "task desktop screenshot",
  "decision tablet screenshot",
  "search mobile screenshot",
  "atlas screenshot",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { child, baseUrl } = await startClinicalWorkspace();
  const { server, atlasUrl } = await startStaticServer();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await openWorkspaceRoute(page, `${baseUrl}/workspace`, "WorkspaceHomeRoute");
    await page.screenshot({ path: outputPath("255-workspace-home-desktop.png"), fullPage: true });

    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311`, "WorkspaceTaskRoute");
    await page.screenshot({ path: outputPath("255-workspace-task-desktop.png"), fullPage: true });

    await page.setViewportSize({ width: 1100, height: 900 });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/task/task-311/decision`, "WorkspaceDecisionChildRoute");
    await page.screenshot({ path: outputPath("255-workspace-decision-tablet.png"), fullPage: true });

    await page.setViewportSize({ width: 430, height: 960 });
    await openWorkspaceRoute(page, `${baseUrl}/workspace/search`, "WorkspaceSearchRoute");
    await page.screenshot({ path: outputPath("255-workspace-search-mobile.png"), fullPage: true });
    await assertNoHorizontalOverflow(page, "255 workspace search mobile");
    assertCondition(externalRequests.size === 0, `unexpected external requests: ${Array.from(externalRequests).join(", ")}`);

    const atlasPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await atlasPage.goto(atlasUrl, { waitUntil: "networkidle" });
    await atlasPage.locator("#workspace-shell-atlas-root").waitFor();
    await atlasPage.screenshot({ path: outputPath("255-workspace-shell-atlas.png"), fullPage: true });
  } finally {
    await browser.close();
    await closeServer(server);
    await stopClinicalWorkspace(child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
