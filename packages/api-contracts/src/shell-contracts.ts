export const shellSurfaceContracts = {
  "patient-web": {
    shellSlug: "patient-web",
    artifactId: "app_patient_web",
    ownerContext: "patient_experience",
    routeFamilyIds: [
      "rf_intake_self_service",
      "rf_intake_telephony_capture",
      "rf_patient_secure_link_recovery",
      "rf_patient_home",
      "rf_patient_requests",
      "rf_patient_appointments",
      "rf_patient_health_record",
      "rf_patient_messages",
      "rf_patient_embedded_channel",
    ],
    gatewaySurfaceIds: [
      "gws_patient_appointments",
      "gws_patient_embedded_shell",
      "gws_patient_health_record",
      "gws_patient_home",
      "gws_patient_intake_phone",
      "gws_patient_intake_web",
      "gws_patient_messages",
      "gws_patient_requests",
      "gws_patient_secure_link_recovery",
    ],
    routeCount: 9,
    gatewayCount: 9,
    automationMarkers: ["patient-web-shell-root", "patient-web::visual", "patient-web::parity"],
  },
  "clinical-workspace": {
    shellSlug: "clinical-workspace",
    artifactId: "app_clinical_workspace",
    ownerContext: "triage_workspace",
    routeFamilyIds: ["rf_staff_workspace", "rf_staff_workspace_child"],
    gatewaySurfaceIds: [
      "gws_assistive_sidecar",
      "gws_clinician_workspace",
      "gws_clinician_workspace_child",
      "gws_practice_ops_workspace",
    ],
    routeCount: 2,
    gatewayCount: 4,
    automationMarkers: [
      "clinical-workspace-shell-root",
      "clinical-workspace::visual",
      "clinical-workspace::parity",
    ],
  },
  "hub-desk": {
    shellSlug: "hub-desk",
    artifactId: "app_hub_desk",
    ownerContext: "hub_coordination",
    routeFamilyIds: ["rf_hub_queue", "rf_hub_case_management"],
    gatewaySurfaceIds: ["gws_hub_case_management", "gws_hub_queue"],
    routeCount: 2,
    gatewayCount: 2,
    automationMarkers: ["hub-desk-shell-root", "hub-desk::visual", "hub-desk::parity"],
  },
  "pharmacy-console": {
    shellSlug: "pharmacy-console",
    artifactId: "app_pharmacy_console",
    ownerContext: "pharmacy",
    routeFamilyIds: ["rf_pharmacy_console"],
    gatewaySurfaceIds: ["gws_pharmacy_console"],
    routeCount: 1,
    gatewayCount: 1,
    automationMarkers: [
      "pharmacy-console-shell-root",
      "pharmacy-console::visual",
      "pharmacy-console::parity",
    ],
  },
  "support-workspace": {
    shellSlug: "support-workspace",
    artifactId: "app_support_workspace",
    ownerContext: "support",
    routeFamilyIds: ["rf_support_ticket_workspace", "rf_support_replay_observe"],
    gatewaySurfaceIds: [
      "gws_support_assisted_capture",
      "gws_support_replay_observe",
      "gws_support_ticket_workspace",
    ],
    routeCount: 2,
    gatewayCount: 3,
    automationMarkers: [
      "support-workspace-shell-root",
      "support-workspace::visual",
      "support-workspace::parity",
    ],
  },
  "ops-console": {
    shellSlug: "ops-console",
    artifactId: "app_ops_console",
    ownerContext: "operations",
    routeFamilyIds: ["rf_operations_board", "rf_operations_drilldown"],
    gatewaySurfaceIds: ["gws_operations_board", "gws_operations_drilldown"],
    routeCount: 2,
    gatewayCount: 2,
    automationMarkers: ["ops-console-shell-root", "ops-console::visual", "ops-console::parity"],
  },
  "governance-console": {
    shellSlug: "governance-console",
    artifactId: "app_governance_console",
    ownerContext: "governance_admin",
    routeFamilyIds: ["rf_governance_shell"],
    gatewaySurfaceIds: ["gws_governance_shell"],
    routeCount: 1,
    gatewayCount: 1,
    automationMarkers: [
      "governance-console-shell-root",
      "governance-console::visual",
      "governance-console::parity",
    ],
  },
} as const;

export type ShellSlug = keyof typeof shellSurfaceContracts;
export type ShellSurfaceContract = (typeof shellSurfaceContracts)[ShellSlug];

export function getShellContract(shellSlug: ShellSlug): ShellSurfaceContract {
  return shellSurfaceContracts[shellSlug];
}
