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

export const meshRouteVerificationCoverage = [
  "seeded route checks verify send, receive, retry, and duplicate handling in the local twin",
  "practice notice routes keep transport-only proof distinct from business acknowledgement",
  "manual Path to Live routes stay visible as manual bridge rows",
  "verification evidence stays local and secret-safe",
];

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  const { server, baseUrl } = await startMeshPortalHarness(
    path.join(process.cwd(), "output", "playwright", "335-mesh-route-portal-state"),
  );
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const externalRequests = new Set<string>();
    trackExternalRequests(page, baseUrl, externalRequests);

    await loginToMeshPortal(page, baseUrl);
    await page.getByTestId("mailbox-bootstrap-mailbox_335_vecells_hub_local_twin").click();
    await page.waitForURL(/\/portal\/mailboxes$/);
    await page.getByTestId("mailbox-bootstrap-mailbox_335_practice_proxy_local_twin").click();
    await page.waitForURL(/\/portal\/mailboxes$/);
    await page.getByTestId("mailbox-bootstrap-mailbox_335_servicing_site_local_twin").click();
    await page.waitForURL(/\/portal\/mailboxes$/);

    await page.getByTestId("portal-nav-routes").click();
    await page.waitForURL(/\/portal\/routes$/);
    await page.getByTestId("route-seed-all").click();
    await page.waitForURL(/\/portal\/routes$/);
    await page.getByTestId("route-verify-all").click();
    await page.waitForURL(/\/portal\/routes$/);

    const hubNotice = page.getByTestId("route-row-route_335_hub_notice_local");
    const practiceAck = page.getByTestId("route-row-route_335_practice_ack_local");
    const recovery = page.getByTestId("route-row-route_335_recovery_follow_up_local");
    const hubNoticePtl = page.getByTestId("route-row-route_335_hub_notice_ptl");

    assertCondition(
      (await hubNotice.getAttribute("data-verification-state")) === "verified",
      "hub notice local route should verify after seeded route checks",
    );
    assertCondition(
      (await page.getByTestId("route-decisions-route_335_hub_notice_local").innerText()).includes(
        "accepted_new",
      ),
      "hub notice route should include accepted_new decision",
    );
    assertCondition(
      (await page.getByTestId("route-decisions-route_335_hub_notice_local").innerText()).includes(
        "semantic_replay",
      ),
      "hub notice route should include semantic_replay decision",
    );
    assertCondition(
      (await page.getByTestId("route-decisions-route_335_hub_notice_local").innerText()).includes(
        "transport_only_not_acknowledged",
      ),
      "hub notice route should keep transport-only proof distinct from acknowledgement",
    );
    assertCondition(
      (await practiceAck.getAttribute("data-verification-state")) === "verified",
      "practice ack route should verify after seeded route checks",
    );
    assertCondition(
      (await page.getByTestId("route-decisions-route_335_practice_ack_local").innerText()).includes(
        "business_ack_generation_bound",
      ),
      "practice ack route should assert generation-bound acknowledgement proof",
    );
    assertCondition(
      (await recovery.getAttribute("data-verification-state")) === "verified",
      "recovery route should verify after seeded route checks",
    );
    assertCondition(
      (await page.getByTestId("route-decisions-route_335_recovery_follow_up_local").innerText()).includes(
        "transport_only_not_recovery_settled",
      ),
      "recovery route should keep dispatch separate from recovery settlement",
    );
    assertCondition(
      (await hubNoticePtl.getAttribute("data-verification-state")) === "manual_bridge_required",
      "Path to Live route should remain explicit manual bridge",
    );
    assertCondition(
      await page.getByTestId("manual-bridge-route_335_hub_notice_ptl").isVisible(),
      "Path to Live route should expose its manual bridge banner",
    );
    assertCondition(
      (await page.content()).includes("secret://") === false,
      "route verification page must not render raw secret references",
    );
    assertCondition(
      (await page.content()).includes("BEGIN CERTIFICATE") === false,
      "route verification page must not render certificate bodies",
    );
    assertCondition(
      externalRequests.size === 0,
      `route verification portal should stay local: ${Array.from(externalRequests).join(", ")}`,
    );

    await page.screenshot({
      path: outputPath("335-mesh-route-verification.png"),
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
    await context.tracing.stop({
      path: outputPath("335-mesh-route-verification-trace.zip"),
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
