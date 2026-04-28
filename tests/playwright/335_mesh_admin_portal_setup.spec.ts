import path from "node:path";

import {
  assertCondition,
  importPlaywright,
  loginToMeshPortal,
  outputPath,
  startMeshPortalHarness,
  stopMeshPortalHarness,
  trackExternalRequests,
} from "./335_mesh_portal.helpers.ts";

export const meshAdminPortalSetupCoverage = [
  "local mailbox twin converges automated rows to the manifest binding hash",
  "Path to Live rows stay explicit as manual bridge instead of pretending portal automation",
  "the portal twin shows only masked secret and certificate evidence",
  "no external network traffic is required for the local proof harness",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  const { server, baseUrl } = await startMeshPortalHarness(
    path.join(process.cwd(), "output", "playwright", "335-mesh-admin-portal-state"),
  );
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await loginToMeshPortal(page, baseUrl);

    const hubLocal = page.getByTestId("mailbox-row-mailbox_335_vecells_hub_local_twin");
    const practiceLocal = page.getByTestId("mailbox-row-mailbox_335_practice_proxy_local_twin");
    const hubPtl = page.getByTestId("mailbox-row-mailbox_335_vecells_hub_path_to_live_deployment");

    assertCondition(
      (await hubLocal.getAttribute("data-configured-state")) === "unconfigured",
      "hub local mailbox should start unconfigured before convergence",
    );
    await page.getByTestId("mailbox-bootstrap-mailbox_335_vecells_hub_local_twin").click();
    await page.waitForURL(/\/portal\/mailboxes$/);
    assertCondition(
      (await hubLocal.getAttribute("data-configured-state")) === "current",
      "hub local mailbox should converge to current after bootstrap",
    );

    await page.getByTestId("mailbox-bootstrap-mailbox_335_practice_proxy_local_twin").click();
    await page.waitForURL(/\/portal\/mailboxes$/);
    assertCondition(
      (await practiceLocal.getAttribute("data-configured-state")) === "current",
      "practice local mailbox should converge to current after bootstrap",
    );

    assertCondition(
      await page.getByTestId("manual-bridge-mailbox_335_vecells_hub_path_to_live_deployment").isVisible(),
      "Path to Live mailbox row should expose a manual bridge banner",
    );
    assertCondition(
      (await hubPtl.getAttribute("data-configured-state")) === "manual_bridge_required",
      "Path to Live mailbox row must not claim current automation state",
    );
    assertCondition(
      (await page.getByTestId("mailbox-secret-fingerprint-mailbox_335_vecells_hub_local_twin").innerText()).includes(
        "sha256:",
      ),
      "mailbox rows should expose only masked secret fingerprints",
    );
    assertCondition(
      (await page
        .getByTestId("mailbox-certificate-fingerprint-mailbox_335_vecells_hub_local_twin")
        .innerText()).includes("sha256:"),
      "mailbox rows should expose only masked certificate fingerprints",
    );
    assertCondition(
      (await page.content()).includes("secret://") === false,
      "portal page must not render raw secret references",
    );
    assertCondition(
      (await page.content()).includes("certfp://") === false,
      "portal page must not render raw certificate reference identifiers",
    );
    assertCondition(
      (await page.content()).includes("BEGIN CERTIFICATE") === false,
      "portal page must not render certificate bodies",
    );
    assertCondition(
      externalRequests.size === 0,
      `mesh portal should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("335-mesh-admin-portal-setup.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("335-mesh-admin-portal-setup-trace.zip"),
    });
    await context.close();
  } finally {
    await browser.close();
    await stopMeshPortalHarness(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
