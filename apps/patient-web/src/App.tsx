import "@vecells/design-system/foundation.css";
import "@vecells/design-system/pharmacy-accessibility-micro-interactions.css";
import "@vecells/design-system/pharmacy-dispatch-surfaces.css";
import "@vecells/design-system/pharmacy-patient-status-surfaces.css";
import "@vecells/design-system/pharmacy-eligibility-surfaces.css";
import "@vecells/persistent-shell/persistent-shell.css";
import "@vecells/surface-postures/surface-postures.css";
import "./patient-shell-seed.css";
import "./patient-intake-mission-frame.css";
import "./auth-callback-recovery.css";
import "./authenticated-home-status-tracker.css";
import "./claim-resume-identity-hold.css";
import "./mobile-sms-continuation.css";
import "./signed-in-request-start-restore.css";
import "./contact-truth-preference-ui.css";
import "./cross-channel-receipt-status-parity.css";
import "./patient-home-requests-detail-routes.css";
import "./patient-booking-workspace.css";
import "./patient-booking-entry.css";
import "./patient-pharmacy-shell.css";
import "./patient-conversation-surface.css";
import "./patient-more-info-callback-contact-repair.css";
import "./patient-records-communications.css";
import "./patient-support-phase2-bridge.css";
import "./embedded-shell-split.css";
import "./embedded-entry-corridor.css";
import "./embedded-start-request.css";
import "./embedded-request-status.css";
import "./embedded-booking.css";
import "./embedded-pharmacy.css";
import "./embedded-recovery-artifact.css";
import "./embedded-accessibility-responsive.css";
import "./embedded-design-convergence.css";
import "./nhs-app-embedded-channel-486.css";
import type { ReactNode } from "react";
import PatientShellSeedApp from "./patient-shell-seed";
import PatientIntakeMissionFrameApp, {
  isPatientIntakeMissionFramePath,
} from "./patient-intake-mission-frame";
import AuthCallbackRecoveryApp from "./auth-callback-recovery";
import { isAuthCallbackRecoveryPath } from "./auth-callback-recovery.model";
import AuthenticatedHomeStatusTrackerApp, {
  isAuthenticatedHomeStatusTrackerPath,
} from "./authenticated-home-status-tracker";
import ClaimResumeIdentityHoldApp, {
  isClaimResumeIdentityHoldPath,
} from "./claim-resume-identity-hold";
import MobileSmsContinuationApp, { isMobileSmsContinuationPath } from "./mobile-sms-continuation";
import SignedInRequestStartRestoreApp, {
  isSignedInRequestStartPath,
} from "./signed-in-request-start-restore";
import ContactTruthPreferenceApp, {
  isContactTruthPreferencePath,
} from "./contact-truth-preference-ui";
import CrossChannelReceiptStatusParityApp, {
  isCrossChannelReceiptStatusParityPath,
} from "./cross-channel-receipt-status-parity";
import PatientHomeRequestsDetailRoutesApp, {
  isPatientHomeRequestsDetailPath,
} from "./patient-home-requests-detail-routes";
import PatientBookingWorkspaceApp, {
  isPatientBookingWorkspacePath,
} from "./patient-booking-workspace";
import PatientNetworkAlternativeChoiceApp, {
  isPatientNetworkAlternativeChoicePath,
} from "./patient-network-alternative-choice";
import PatientNetworkConfirmationView, {
  isPatientNetworkConfirmationPath,
} from "./patient-network-confirmation";
import PatientNetworkManageView, { isPatientNetworkManagePath } from "./patient-network-manage";
import PatientBookingEntryApp, { isPatientBookingEntryPath } from "./patient-booking-entry";
import PharmacyPatientShell, { isPatientPharmacyShellPath } from "./patient-pharmacy-shell";
import PatientConversationSurfaceApp, {
  isPatientConversationPath,
} from "./patient-conversation-surface";
import MoreInfoCallbackContactRepairApp, {
  isMoreInfoCallbackContactRepairPath,
} from "./patient-more-info-callback-contact-repair";
import PatientRecordsCommunicationsApp, {
  isRecordsCommunicationsPath,
} from "./patient-records-communications";
import EmbeddedEntryCorridorApp, { isEmbeddedEntryCorridorPath } from "./embedded-entry-corridor";
import EmbeddedStartRequestApp, { isEmbeddedStartRequestPath } from "./embedded-start-request";
import EmbeddedRequestStatusApp, { isEmbeddedRequestStatusPath } from "./embedded-request-status";
import EmbeddedBookingApp, { isEmbeddedBookingPath } from "./embedded-booking";
import EmbeddedPharmacyApp, { isEmbeddedPharmacyPath } from "./embedded-pharmacy";
import EmbeddedRecoveryArtifactApp, {
  isEmbeddedRecoveryArtifactPath,
} from "./embedded-recovery-artifact";
import EmbeddedPatientShellApp, { isEmbeddedShellSplitPath } from "./embedded-shell-split";
import NHSAppEmbeddedChannel486, {
  isNHSAppEmbeddedChannel486Path,
} from "./nhs-app-embedded-channel-486";
import type { EmbeddedAccessibilityRouteFamily } from "./embedded-accessibility-responsive.model";
import EmbeddedAccessibilityResponsiveLayer from "./embedded-accessibility-responsive";
import EmbeddedDesignBundleProvider from "./embedded-design-convergence";

function renderEmbeddedRoute(routeFamily: EmbeddedAccessibilityRouteFamily, children: ReactNode) {
  return (
    <EmbeddedDesignBundleProvider routeFamily={routeFamily}>
      <EmbeddedAccessibilityResponsiveLayer routeFamily={routeFamily}>
        {children}
      </EmbeddedAccessibilityResponsiveLayer>
    </EmbeddedDesignBundleProvider>
  );
}

function shouldUsePatientShellSeedHarness(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem("patient-shell-seed-routes") === "true";
}

export default function App() {
  const pathname = typeof window === "undefined" ? "/home" : window.location.pathname;
  const search = typeof window === "undefined" ? "" : window.location.search;
  if (shouldUsePatientShellSeedHarness()) {
    return <PatientShellSeedApp />;
  }
  const isEmbeddedShellRouteRequest =
    new URLSearchParams(search).get("phase7") === "embedded_shell";
  if (isEmbeddedEntryCorridorPath(pathname)) {
    return renderEmbeddedRoute("entry_corridor", <EmbeddedEntryCorridorApp />);
  }
  if (isEmbeddedStartRequestPath(pathname)) {
    return renderEmbeddedRoute("start_request", <EmbeddedStartRequestApp />);
  }
  if (isEmbeddedRequestStatusPath(pathname) && !isEmbeddedShellRouteRequest) {
    return renderEmbeddedRoute("request_status", <EmbeddedRequestStatusApp />);
  }
  if (isEmbeddedBookingPath(pathname)) {
    return renderEmbeddedRoute("booking", <EmbeddedBookingApp />);
  }
  if (isEmbeddedPharmacyPath(pathname)) {
    return renderEmbeddedRoute("pharmacy", <EmbeddedPharmacyApp />);
  }
  if (isEmbeddedRecoveryArtifactPath(pathname)) {
    return renderEmbeddedRoute("recovery_artifact", <EmbeddedRecoveryArtifactApp />);
  }
  if (isNHSAppEmbeddedChannel486Path(pathname)) {
    return renderEmbeddedRoute("embedded_shell", <NHSAppEmbeddedChannel486 />);
  }
  if (isEmbeddedShellSplitPath(pathname, search)) {
    return renderEmbeddedRoute("embedded_shell", <EmbeddedPatientShellApp />);
  }
  if (isPatientIntakeMissionFramePath(pathname)) {
    return <PatientIntakeMissionFrameApp />;
  }
  if (isAuthCallbackRecoveryPath(pathname)) {
    return <AuthCallbackRecoveryApp />;
  }
  if (isClaimResumeIdentityHoldPath(pathname)) {
    return <ClaimResumeIdentityHoldApp />;
  }
  if (isMobileSmsContinuationPath(pathname)) {
    return <MobileSmsContinuationApp />;
  }
  if (isSignedInRequestStartPath(pathname)) {
    return <SignedInRequestStartRestoreApp />;
  }
  if (isCrossChannelReceiptStatusParityPath(pathname)) {
    return <CrossChannelReceiptStatusParityApp />;
  }
  if (isContactTruthPreferencePath(pathname)) {
    return <ContactTruthPreferenceApp />;
  }
  if (isAuthenticatedHomeStatusTrackerPath(pathname)) {
    return <AuthenticatedHomeStatusTrackerApp />;
  }
  if (isPatientConversationPath(pathname)) {
    return <PatientConversationSurfaceApp />;
  }
  if (isMoreInfoCallbackContactRepairPath(pathname)) {
    return <MoreInfoCallbackContactRepairApp />;
  }
  if (isRecordsCommunicationsPath(pathname)) {
    return <PatientRecordsCommunicationsApp />;
  }
  if (isPatientHomeRequestsDetailPath(pathname)) {
    return <PatientHomeRequestsDetailRoutesApp />;
  }
  if (isPatientBookingEntryPath(pathname)) {
    return <PatientBookingEntryApp />;
  }
  if (isPatientPharmacyShellPath(pathname)) {
    return <PharmacyPatientShell />;
  }
  if (isPatientNetworkAlternativeChoicePath(pathname)) {
    return <PatientNetworkAlternativeChoiceApp />;
  }
  if (isPatientNetworkConfirmationPath(pathname)) {
    return <PatientNetworkConfirmationView />;
  }
  if (isPatientNetworkManagePath(pathname)) {
    return <PatientNetworkManageView />;
  }
  if (isPatientBookingWorkspacePath(pathname)) {
    return <PatientBookingWorkspaceApp />;
  }
  return <PatientShellSeedApp />;
}
