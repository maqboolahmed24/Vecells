import "@vecells/design-system/foundation.css";
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
import "./patient-more-info-callback-contact-repair.css";
import "./patient-records-communications.css";
import "./patient-support-phase2-bridge.css";
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
import MoreInfoCallbackContactRepairApp, {
  isMoreInfoCallbackContactRepairPath,
} from "./patient-more-info-callback-contact-repair";
import PatientRecordsCommunicationsApp, {
  isRecordsCommunicationsPath,
} from "./patient-records-communications";

export default function App() {
  const pathname = typeof window === "undefined" ? "/home" : window.location.pathname;
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
  if (isMoreInfoCallbackContactRepairPath(pathname)) {
    return <MoreInfoCallbackContactRepairApp />;
  }
  if (isRecordsCommunicationsPath(pathname)) {
    return <PatientRecordsCommunicationsApp />;
  }
  if (isPatientHomeRequestsDetailPath(pathname)) {
    return <PatientHomeRequestsDetailRoutesApp />;
  }
  return <PatientShellSeedApp />;
}
