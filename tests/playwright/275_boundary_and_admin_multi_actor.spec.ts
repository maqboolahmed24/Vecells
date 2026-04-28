import {
  assertCondition,
  importPlaywright,
  openBoundaryReopenScenario,
  openWorkspaceRoute,
  selectConsequenceRow,
  startBoundaryReopenLabServer,
  startClinicalWorkspace,
  stopBoundaryReopenLabServer,
  stopClinicalWorkspace,
  trackExternalRequests,
} from "./275_phase3_boundary.helpers";

async function readText(locator: any): Promise<string> {
  return ((await locator.textContent()) ?? "").replace(/\s+/g, " ").trim();
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const lab = await startBoundaryReopenLabServer();
  const workspace = await startClinicalWorkspace();
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const workspacePage = await browser.newPage({ viewport: { width: 1480, height: 1040 } });
    const labPage = await browser.newPage({ viewport: { width: 1480, height: 1040 } });
    const externalRequests = new Set<string>();
    trackExternalRequests(workspacePage, workspace.baseUrl, externalRequests);

    await openWorkspaceRoute(
      workspacePage,
      `${workspace.baseUrl}/workspace/consequences?state=live`,
      "WorkspaceConsequencesRoute",
    );
    const detail = workspacePage.locator("[data-testid='SelfCareAdminDetailSurface']");

    await openBoundaryReopenScenario(labPage, lab.atlasUrl, "self_care_live");
    await selectConsequenceRow(workspacePage, "task-311");
    assertCondition(
      (await detail.getAttribute("data-boundary-mode")) === "self_care",
      "task-311 should remain in self-care mode",
    );
    assertCondition(
      (await detail.getAttribute("data-boundary-tuple")) === "boundary_tuple::task-311::self-care-v4",
      "task-311 should publish its current boundary tuple",
    );
    assertCondition(
      (await labPage.locator("[data-testid='ParityAcrossPatientStaffSupport']").getAttribute("data-boundary-tuple")) ===
        "boundary_tuple::task-311::self-care-v4",
      "self-care lab scenario should stay tuple-aligned",
    );
    assertCondition(
      (await readText(labPage.locator("[data-testid='ParityAcrossPatientStaffSupport']"))).includes(
        "We are sharing guidance, not opening an admin follow-up case.",
      ),
      "patient and support parity card should keep the self-care summary honest",
    );
    assertCondition(
      (await workspacePage.getByText("The patient sees a waiting update, not a completion message.").count()) === 0,
      "self-care route should not relabel itself as admin waiting",
    );

    await openBoundaryReopenScenario(labPage, lab.atlasUrl, "admin_waiting_dependency");
    await selectConsequenceRow(workspacePage, "task-507");
    assertCondition(
      (await detail.getAttribute("data-boundary-mode")) === "admin_resolution",
      "task-507 should remain bounded admin",
    );
    assertCondition(
      (await detail.getAttribute("data-admin-dependency-state")) === "blocked_pending_external_confirmation",
      "task-507 should expose the dominant dependency blocker",
    );
    assertCondition(
      (await readText(labPage.locator("[data-testid='ParityAcrossPatientStaffSupport']"))).includes(
        "The patient sees a waiting update, not a completion message.",
      ),
      "waiting parity should keep the patient view in waiting posture",
    );
    assertCondition(
      (await readText(labPage.locator("[data-testid='ParityAcrossPatientStaffSupport']"))).includes(
        "Support may escalate the blocker but may not calm the case early.",
      ),
      "support parity should stay blocker-bound",
    );

    await openBoundaryReopenScenario(labPage, lab.atlasUrl, "admin_completed_artifact");
    await selectConsequenceRow(workspacePage, "task-208");
    assertCondition(
      (await detail.getAttribute("data-admin-settlement")) === "completed",
      "task-208 should publish completed admin settlement",
    );
    assertCondition(
      (await workspacePage.getByText("The patient sees a completion update tied to the issued document.").count()) === 1,
      "completed admin route should keep the patient expectation aligned",
    );
    assertCondition(
      (await readText(labPage.locator("[data-testid='CompletionArtifactInspector']"))).includes("Document issued"),
      "completion artifact inspector should keep the typed artifact visible",
    );
    assertCondition(
      (await readText(labPage.locator("[data-testid='ParityAcrossPatientStaffSupport']"))).includes(
        "Completed bounded admin follow-up",
      ),
      "parity board should keep the completed admin meaning visible across actors",
    );

    await openBoundaryReopenScenario(labPage, lab.atlasUrl, "reopened_boundary");
    await selectConsequenceRow(workspacePage, "task-118");
    assertCondition(
      (await detail.getAttribute("data-boundary-mode")) === "clinician_review_required",
      "task-118 should require clinician re-entry",
    );
    assertCondition(
      (await workspacePage.locator("[data-testid='BoundaryDriftRecovery']").getAttribute("data-recovery-state")) ===
        "reopen_required",
      "reopened boundary should surface same-shell recovery",
    );
    assertCondition(
      (await readText(labPage.locator("[data-testid='ParityAcrossPatientStaffSupport']"))).includes(
        "Support sees the prior artifact as provenance only and may not mark the case calm-success.",
      ),
      "support parity should keep reopened provenance visible without calming the case",
    );
    assertCondition(
      (await readText(labPage.locator("[data-testid='ReopenTriggerLedger']"))).includes(
        "new symptom report",
      ) &&
        (await readText(labPage.locator("[data-testid='ReopenTriggerLedger']"))).includes(
          "material patient evidence",
        ),
      "reopen ledger should keep the reopen trigger chain visible",
    );

    assertCondition(
      externalRequests.size === 0,
      `unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await browser.close();
    await stopBoundaryReopenLabServer(lab.server);
    await stopClinicalWorkspace(workspace.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
