import {
  resolvePatientNetworkConfirmationProjection329,
  resolvePatientNetworkConfirmationScenarioId329,
  type NetworkConfirmationScenarioId329,
  type PatientNetworkConfirmationProjection329,
} from "../../../packages/domain-kernel/src/phase5-cross-org-confirmation-preview";

export const PATIENT_NETWORK_CONFIRMATION_TASK_ID =
  "par_329_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_commit_confirmation_and_practice_visibility_surfaces";
export const PATIENT_NETWORK_CONFIRMATION_VISUAL_MODE = "Cross_Org_Confirmation_Ledger";

export type { NetworkConfirmationScenarioId329, PatientNetworkConfirmationProjection329 };

export function isPatientNetworkConfirmationPath(pathname: string): boolean {
  return resolvePatientNetworkConfirmationScenarioId329(pathname) !== null;
}

export function resolvePatientNetworkConfirmationScenarioId(
  pathname: string,
): NetworkConfirmationScenarioId329 | null {
  return resolvePatientNetworkConfirmationScenarioId329(pathname);
}

export function resolvePatientNetworkConfirmationProjectionByScenarioId(
  scenarioId: NetworkConfirmationScenarioId329,
): PatientNetworkConfirmationProjection329 {
  return resolvePatientNetworkConfirmationProjection329(scenarioId);
}
