import {
  assertCondition,
  assertNoHorizontalOverflow as assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openWorkspaceRoute,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
} from "./255_workspace_shell_helpers";
import {
  assertNoHorizontalOverflow as assertPatientNoHorizontalOverflow,
  openPatientRoute,
  startPatientWeb,
  stopPatientWeb,
} from "./266_patient_conversation_surface.helpers";

export {
  assertCondition,
  assertPatientNoHorizontalOverflow,
  assertWorkspaceNoHorizontalOverflow,
  importPlaywright,
  openPatientRoute,
  openWorkspaceRoute,
  outputPath,
};

export interface PatientWorkspacePair {
  patientBaseUrl: string;
  workspaceBaseUrl: string;
  patientChild: any;
  workspaceChild: any;
}

export async function startPatientWorkspacePair(): Promise<PatientWorkspacePair> {
  const [patient, workspace] = await Promise.all([startPatientWeb(), startClinicalWorkspace()]);
  return {
    patientBaseUrl: patient.baseUrl,
    workspaceBaseUrl: workspace.baseUrl,
    patientChild: patient.child,
    workspaceChild: workspace.child,
  };
}

export async function stopPatientWorkspacePair(pair: PatientWorkspacePair): Promise<void> {
  await Promise.all([stopPatientWeb(pair.patientChild), stopClinicalWorkspace(pair.workspaceChild)]);
}

export async function openPatientConversationRoute(
  page: any,
  baseUrl: string,
  requestRef: string,
  routeKey:
    | "conversation_overview"
    | "conversation_more_info"
    | "conversation_callback"
    | "conversation_messages"
    | "conversation_repair",
  search = "",
): Promise<void> {
  const suffix =
    routeKey === "conversation_overview"
      ? ""
      : routeKey === "conversation_more_info"
        ? "/more-info"
        : routeKey === "conversation_callback"
          ? "/callback"
          : routeKey === "conversation_messages"
            ? "/messages"
            : "/repair";
  const query = search ? `?${search}` : "";
  await openPatientRoute(page, `${baseUrl}/requests/${requestRef}/conversation${suffix}${query}`);
}

export async function openStaffTaskRoute(
  page: any,
  baseUrl: string,
  taskId: string,
  state = "live",
): Promise<void> {
  await openWorkspaceRoute(page, `${baseUrl}/workspace/task/${taskId}?state=${state}`, "WorkspaceTaskRoute");
}

export async function openStaffMoreInfoRoute(
  page: any,
  baseUrl: string,
  taskId: string,
  state = "live",
): Promise<void> {
  await openWorkspaceRoute(
    page,
    `${baseUrl}/workspace/task/${taskId}/more-info?state=${state}`,
    "WorkspaceMoreInfoChildRoute",
  );
}

export async function openStaffCallbacksRoute(
  page: any,
  baseUrl: string,
  state = "live",
): Promise<void> {
  await openWorkspaceRoute(page, `${baseUrl}/workspace/callbacks?state=${state}`, "WorkspaceCallbacksRoute");
}

export async function selectCallbackRow(page: any, taskId: string): Promise<void> {
  await page
    .locator(`[data-testid='CallbackWorklistRow'][data-task-id='${taskId}'] .staff-shell__callback-row-main`)
    .click();
  await page.waitForFunction(
    (selectedTaskId) =>
      document
        .querySelector(`[data-testid='CallbackWorklistRow'][data-task-id='${selectedTaskId}']`)
        ?.getAttribute("data-selected") === "true",
    taskId,
  );
}

export async function readAttributes(
  locator: any,
  attributes: readonly string[],
): Promise<Record<string, string | null>> {
  const values: Record<string, string | null> = {};
  for (const attribute of attributes) {
    values[attribute] = await locator.getAttribute(attribute);
  }
  return values;
}
