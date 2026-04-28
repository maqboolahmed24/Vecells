import {
  resolvePatientNetworkManagePath330,
  resolvePatientNetworkManageProjection330,
  resolvePatientNetworkManageScenarioId330,
  type ContactRouteRepairInlineJourneyProjection330,
  type HubManageSettlementPanelProjection330,
  type MessageTimelineClusterProjection330,
  type NetworkManageActionPanelProjection330,
  type NetworkManageActionProjection330,
  type NetworkManageCapabilityPanelProjection330,
  type NetworkManageReadOnlyStateProjection330,
  type NetworkManageScenarioId330,
  type PatientNetworkManageProjection330,
  type ReminderDeliveryStateCardProjection330,
  type ReminderTimelineNoticeProjection330,
} from "../../../packages/domain-kernel/src/phase5-network-manage-preview";

export const PATIENT_NETWORK_MANAGE_TASK_ID =
  "par_330_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_network_reminders_manage_flows_and_message_timeline_views";
export const PATIENT_NETWORK_MANAGE_VISUAL_MODE =
  "Network_Appointment_Timeline_Workspace";

export type {
  ContactRouteRepairInlineJourneyProjection330,
  HubManageSettlementPanelProjection330,
  MessageTimelineClusterProjection330,
  NetworkManageActionPanelProjection330,
  NetworkManageActionProjection330,
  NetworkManageCapabilityPanelProjection330,
  NetworkManageReadOnlyStateProjection330,
  NetworkManageScenarioId330,
  PatientNetworkManageProjection330,
  ReminderDeliveryStateCardProjection330,
  ReminderTimelineNoticeProjection330,
};

export function isPatientNetworkManagePath(pathname: string): boolean {
  return resolvePatientNetworkManageScenarioId330(pathname) !== null;
}

export function resolvePatientNetworkManageScenarioId(
  pathname: string,
): NetworkManageScenarioId330 | null {
  return resolvePatientNetworkManageScenarioId330(pathname);
}

export function resolvePatientNetworkManageProjectionByScenarioId(
  scenarioId: NetworkManageScenarioId330,
): PatientNetworkManageProjection330 {
  return resolvePatientNetworkManageProjection330(scenarioId);
}

export function resolvePatientNetworkManagePath(
  scenarioId: NetworkManageScenarioId330,
): string {
  return resolvePatientNetworkManagePath330(scenarioId);
}
