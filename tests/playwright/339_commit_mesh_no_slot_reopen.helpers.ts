import {
  resolveCrossOrgCommitScenario,
  type CrossOrgCommitPosture,
  type NetworkConfirmationScenarioId329,
} from "../../packages/domain-kernel/src/phase5-cross-org-confirmation-preview.ts";
import {
  resolveNetworkManageScenarioFromConfirmation330,
  type NetworkManageScenarioId330,
} from "../../packages/domain-kernel/src/phase5-network-manage-preview.ts";
import { resolvePatientNetworkConfirmationProjectionByScenarioId } from "../../apps/patient-web/src/patient-network-confirmation.model.ts";
import { resolvePatientNetworkManageProjectionByScenarioId } from "../../apps/patient-web/src/patient-network-manage.model.ts";
import {
  buildExpectedHubScenario,
  captureAria,
  readRootAttributes338,
  startTrace,
  stopTrace,
  stopTraceOnError,
  writeJsonArtifact,
} from "./338_scope_capacity.helpers.ts";
import {
  assertCondition,
  importPlaywright,
  networkConfirmationUrl,
  openHubRoute,
  openNetworkConfirmationRoute,
  outputPath,
  readHubCommitMarkers,
  readPatientConfirmationMarkers,
  startHubDesk,
  startPatientWeb,
  stopHubDesk,
  stopPatientWeb,
  trackExternalRequests,
  waitForHubCommitPosture,
  waitForHubRootState,
  waitForPatientConfirmationState,
} from "./329_commit_confirmation.helpers.ts";
import {
  networkManageUrl,
  openNetworkManageRoute,
  readNetworkManageMarkers,
  waitForNetworkManageState,
} from "./330_network_manage.helpers.ts";

export {
  assertCondition,
  buildExpectedHubScenario,
  captureAria,
  importPlaywright,
  networkConfirmationUrl,
  networkManageUrl,
  openHubRoute,
  openNetworkConfirmationRoute,
  openNetworkManageRoute,
  outputPath,
  readHubCommitMarkers,
  readNetworkManageMarkers,
  readPatientConfirmationMarkers,
  readRootAttributes338,
  startHubDesk,
  startPatientWeb,
  startTrace,
  stopHubDesk,
  stopPatientWeb,
  stopTrace,
  stopTraceOnError,
  trackExternalRequests,
  waitForHubCommitPosture,
  waitForHubRootState,
  waitForNetworkManageState,
  waitForPatientConfirmationState,
  writeJsonArtifact,
};

export function expectedCommitProjection(posture: CrossOrgCommitPosture) {
  const caseId =
    posture === "disputed"
      ? "hub-case-087"
      : posture === "supplier_drift"
        ? "hub-case-041"
        : posture === "booked_pending_practice_ack"
          ? "hub-case-066"
          : "hub-case-104";
  const projection = resolveCrossOrgCommitScenario(caseId, posture);
  assertCondition(projection, `missing commit projection for posture ${posture}`);
  return projection;
}

export function expectedPatientConfirmationProjection(
  scenarioId: NetworkConfirmationScenarioId329,
) {
  return resolvePatientNetworkConfirmationProjectionByScenarioId(scenarioId);
}

export function expectedManageProjection(
  scenarioId: NetworkManageScenarioId330,
) {
  return resolvePatientNetworkManageProjectionByScenarioId(scenarioId);
}

export function expectedManageProjectionForConfirmation(
  scenarioId: NetworkConfirmationScenarioId329,
) {
  const manageScenarioId = resolveNetworkManageScenarioFromConfirmation330(scenarioId);
  return {
    manageScenarioId,
    projection: resolvePatientNetworkManageProjectionByScenarioId(manageScenarioId),
  };
}

export async function assertHubCommitProjection(
  page: any,
  posture: CrossOrgCommitPosture,
): Promise<void> {
  const projection = expectedCommitProjection(posture);
  const pane = page.getByTestId("HubCommitConfirmationPane");
  await pane.waitFor();
  const markers = await readHubCommitMarkers(page);
  const paneText = (await pane.textContent()) ?? "";
  const practiceText = (await page.getByTestId("PracticeVisibilityPanel").textContent()) ?? "";

  assertCondition(
    markers.posture === projection.posture,
    `expected hub posture ${projection.posture}, received ${String(markers.posture)}`,
  );
  assertCondition(
    markers.managePosture === projection.managePosture,
    `expected manage posture ${projection.managePosture}, received ${String(markers.managePosture)}`,
  );
  assertCondition(
    markers.acknowledgementState === projection.practiceView.acknowledgementState,
    `expected acknowledgement state ${projection.practiceView.acknowledgementState}, received ${String(markers.acknowledgementState)}`,
  );
  assertCondition(
    paneText.includes(projection.truthLabel),
    `hub commit pane is missing truth label ${projection.truthLabel}`,
  );
  assertCondition(
    practiceText.includes(projection.practiceView.acknowledgementLabel),
    `practice panel is missing acknowledgement label ${projection.practiceView.acknowledgementLabel}`,
  );
}

export async function assertPatientConfirmationProjection(
  page: any,
  scenarioId: NetworkConfirmationScenarioId329,
  expectedEmbeddedMode?: "browser" | "nhs_app",
): Promise<void> {
  const projection = expectedPatientConfirmationProjection(scenarioId);
  const markers = await readPatientConfirmationMarkers(page);
  const rootText =
    (await page.getByTestId("PatientNetworkConfirmationView").textContent()) ?? "";

  assertCondition(
    markers.scenarioId === projection.scenarioId,
    `expected confirmation scenario ${projection.scenarioId}, received ${String(markers.scenarioId)}`,
  );
  assertCondition(
    markers.truthState === projection.state,
    `expected confirmation truth ${projection.state}, received ${String(markers.truthState)}`,
  );
  assertCondition(
    markers.practiceInformed === projection.disclosureRows[1]?.value,
    `expected practice informed ${projection.disclosureRows[1]?.value}, received ${String(markers.practiceInformed)}`,
  );
  assertCondition(
    markers.practiceAcknowledged === projection.disclosureRows[2]?.value,
    `expected practice acknowledged ${projection.disclosureRows[2]?.value}, received ${String(markers.practiceAcknowledged)}`,
  );
  if (expectedEmbeddedMode) {
    assertCondition(
      markers.embeddedMode === expectedEmbeddedMode,
      `expected embedded mode ${expectedEmbeddedMode}, received ${String(markers.embeddedMode)}`,
    );
  }
  assertCondition(
    rootText.includes(projection.patientFacingReference),
    `confirmation route is missing patient-facing reference ${projection.patientFacingReference}`,
  );
}

export async function assertNetworkManageProjection(
  page: any,
  scenarioId: NetworkManageScenarioId330,
  expectedEmbeddedMode?: "browser" | "nhs_app",
): Promise<void> {
  const projection = expectedManageProjection(scenarioId);
  const markers = await readNetworkManageMarkers(page);
  const rootText =
    (await page.getByTestId("Patient_Network_Manage_Route").textContent()) ?? "";

  assertCondition(
    markers.scenarioId === projection.scenarioId,
    `expected manage scenario ${projection.scenarioId}, received ${String(markers.scenarioId)}`,
  );
  assertCondition(
    markers.capabilityState === projection.capabilityPanel.capabilityState,
    `expected capability state ${projection.capabilityPanel.capabilityState}, received ${String(markers.capabilityState)}`,
  );
  assertCondition(
    markers.readOnlyMode === projection.capabilityPanel.readOnlyMode,
    `expected read-only mode ${projection.capabilityPanel.readOnlyMode}, received ${String(markers.readOnlyMode)}`,
  );
  assertCondition(
    markers.selectedTimelineRow === projection.focusedTimelineRowId,
    `expected focused timeline row ${projection.focusedTimelineRowId}, received ${String(markers.selectedTimelineRow)}`,
  );
  assertCondition(
    markers.settlement === (projection.settlementPanel?.settlementResult ?? "none"),
    `expected settlement ${(projection.settlementPanel?.settlementResult ?? "none")}, received ${String(markers.settlement)}`,
  );
  assertCondition(
    markers.repairState === (projection.contactRepairJourney?.repairState ?? "hidden"),
    `expected repair state ${(projection.contactRepairJourney?.repairState ?? "hidden")}, received ${String(markers.repairState)}`,
  );
  if (expectedEmbeddedMode) {
    assertCondition(
      markers.embeddedMode === expectedEmbeddedMode,
      `expected embedded mode ${expectedEmbeddedMode}, received ${String(markers.embeddedMode)}`,
    );
  }
  assertCondition(
    rootText.includes(projection.patientFacingReference),
    `manage route is missing patient-facing reference ${projection.patientFacingReference}`,
  );
}

export async function readPracticeVisibilityDetails(page: any) {
  const panel = page.getByTestId("PracticeVisibilityPanel");
  const indicator = page.getByTestId("PracticeAcknowledgementIndicator");
  await panel.waitFor();
  return {
    text: (await panel.textContent()) ?? "",
    acknowledgementState: await indicator.getAttribute("data-acknowledgement-state"),
  };
}

export async function readRecoveryRoot(page: any) {
  return readRootAttributes338(page, [
    "data-current-path",
    "data-view-mode",
    "data-selected-case-id",
    "data-selected-exception-id",
  ]);
}
