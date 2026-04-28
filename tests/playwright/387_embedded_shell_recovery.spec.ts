import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openShellRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
} from "./387_embedded_shell.helpers.ts";

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) return;

  const server = await startPatientWeb();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const deepLinkContext = await browser.newContext({ viewport: { width: 430, height: 900 } });
    await deepLinkContext.tracing.start({ screenshots: true, snapshots: true });
    const deepLinkPage = await deepLinkContext.newPage();
    await openShellRoute(
      deepLinkPage,
      `${server.baseUrl}/nhs-app/requests/REQ-2049/status?phase7=embedded_shell&shell=embedded&context=signed&scenario=stale_continuity`,
    );
    const staleRoot = deepLinkPage.getByTestId("EmbeddedPatientShellRoot");
    assertCondition((await staleRoot.getAttribute("data-shell-state")) === "recovery_only", "stale shell not recovery");
    assertCondition(
      (await staleRoot.getAttribute("data-recovery-posture")) === "stale_continuity",
      "stale recovery posture missing",
    );
    assertCondition(
      (await deepLinkPage.getByTestId("EmbeddedRecoveryFrame").getAttribute("data-mutation-state")) === "frozen",
      "stale recovery did not freeze mutations",
    );
    assertCondition(await deepLinkPage.getByTestId("EmbeddedDominantActionButton").isDisabled(), "stale action live");
    await assertNoHorizontalOverflow(deepLinkPage, "deep-link stale recovery");
    await deepLinkContext.tracing.stop({ path: outputPath("387-deep-link-recovery-trace.zip") });
    await deepLinkContext.close();

    const blockedContext = await browser.newContext({ viewport: { width: 430, height: 900 } });
    const blockedPage = await blockedContext.newPage();
    await openShellRoute(
      blockedPage,
      `${server.baseUrl}/nhs-app/requests/REQ-2049/status?phase7=embedded_shell&shell=embedded&context=signed&scenario=wrong_patient`,
    );
    const blockedRoot = blockedPage.getByTestId("EmbeddedPatientShellRoot");
    assertCondition((await blockedRoot.getAttribute("data-shell-state")) === "blocked", "wrong patient not blocked");
    assertCondition(
      (await blockedPage.getByTestId("EmbeddedRecoveryFrame").getAttribute("role")) === "alert",
      "blocked recovery should be an alert",
    );
    assertCondition(await blockedPage.getByTestId("EmbeddedDominantActionButton").isDisabled(), "blocked action live");
    await blockedContext.close();

    const freezeContext = await browser.newContext({ viewport: { width: 430, height: 900 } });
    const freezePage = await freezeContext.newPage();
    await openShellRoute(
      freezePage,
      `${server.baseUrl}/nhs-app/appointments/APT-778/manage?phase7=embedded_shell&shell=embedded&context=signed&scenario=route_freeze`,
    );
    assertCondition(
      (await freezePage.getByTestId("EmbeddedShellStateRibbon").getAttribute("data-eligibility-state")) ===
        "read_only",
      "route freeze did not expose read-only eligibility",
    );
    assertCondition(
      (await freezePage.getByTestId("EmbeddedRecoveryFrame").getAttribute("data-recovery-posture")) ===
        "route_freeze",
      "route freeze recovery frame missing",
    );
    await freezeContext.close();

    const handoffContext = await browser.newContext({ viewport: { width: 430, height: 900 } });
    await handoffContext.tracing.start({ screenshots: true, snapshots: true });
    const handoffPage = await handoffContext.newPage();
    await openShellRoute(
      handoffPage,
      `${server.baseUrl}/nhs-app/handoff-return?phase7=embedded_shell&shell=embedded&context=signed&route=request_status&anchor=REQ-2049&return=browser_handoff`,
    );
    const handoffRoot = handoffPage.getByTestId("EmbeddedPatientShellRoot");
    assertCondition(
      (await handoffRoot.getAttribute("data-return-handoff-ref")) === "SafeBrowserHandoffReturn:387",
      "safe browser handoff return ref missing",
    );
    assertCondition(
      (await handoffRoot.getAttribute("data-route-family")) === "request_status",
      "handoff return did not restore route family",
    );
    assertCondition((await handoffRoot.getAttribute("data-shell-state")) === "live", "handoff return should be live");
    await handoffContext.tracing.stop({ path: outputPath("387-safe-browser-handoff-return-trace.zip") });
    await handoffContext.close();
  } finally {
    await browser.close();
    await stopPatientWeb(server.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
