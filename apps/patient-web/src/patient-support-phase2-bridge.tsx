import { useEffect, useState } from "react";
import type { PortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";

const DISMISS_ANIMATION_MS = 180;

function patientStatusBody(context: PortalSupportPhase2Context): string {
  switch (context.causeClass) {
    case "session_recovery_required":
      return "Sign in again to continue where you left off.";
    case "identity_hold":
      return "We need to confirm your identity before showing more of this request.";
    case "wrong_patient_freeze":
      return "We need to confirm this request belongs to this account before anything else is shown.";
    case "repair_required":
      return "Check your contact details so updates can reach you safely.";
    case "step_up_required":
      return "Complete the extra check to see the full request details.";
    case "read_only_recovery":
      return "You can still view the latest update while we protect the rest of the request.";
    default:
      return context.canonicalStatusLabel === "Reply needed"
        ? "We need a little more information from you before this request can move on."
        : "Your request information is up to date.";
  }
}

function accountItemFor(context: PortalSupportPhase2Context): { label: string; body: string } {
  switch (context.identityState) {
    case "signed_out":
      return {
        label: "Sign in needed",
        body: "Sign in again before we show more of this request.",
      };
    case "identity_hold":
    case "wrong_patient_hold":
      return {
        label: "Identity check",
        body: "We are checking this request belongs to this account.",
      };
    case "capability_limited":
      return {
        label: "Extra check",
        body: "Some details stay hidden until the check is complete.",
      };
    default:
      return {
        label: "Signed in",
        body: "You are viewing this with your NHS login.",
      };
  }
}

export function PatientSupportPhase2Bridge({
  context,
  collapsible = false,
  defaultCollapsed = false,
  dismissible = false,
  onDismiss,
}: {
  context: PortalSupportPhase2Context;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const detailsId = "patient-phase2-bridge-details";
  const detailsVisible = !collapsible || !collapsed;

  useEffect(() => {
    if (!dismissing) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setDismissed(true);
      onDismiss?.();
    }, DISMISS_ANIMATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [dismissing, onDismiss]);

  if (dismissed) {
    return null;
  }

  function dismissPanel(): void {
    if (dismissing) {
      return;
    }

    setDismissing(true);
  }

  return (
    <section
      className="patient-phase2-bridge"
      data-testid="PatientRequestStatusSummary"
      data-collapsible={collapsible ? "true" : "false"}
      data-collapsed={collapsible && collapsed ? "true" : "false"}
      data-dismissible={dismissible ? "true" : "false"}
      data-dismissing={dismissing ? "true" : "false"}
      aria-label="Request status update"
    >
      {dismissible ? (
        <button
          type="button"
          className="patient-phase2-bridge__dismiss"
          aria-label="Close request update"
          data-testid="patient-request-status-dismiss"
          disabled={dismissing}
          onClick={dismissPanel}
        >
          <span aria-hidden />
        </button>
      ) : null}

      {collapsible ? (
        <div className="patient-phase2-bridge__compact">
          <div>
            <p className="patient-phase2-bridge__eyebrow">Request update</p>
            <strong>{context.canonicalStatusLabel}</strong>
            <span>{context.patientActionLabel}</span>
          </div>
          <button
            type="button"
            className="patient-phase2-bridge__toggle"
            aria-controls={detailsId}
            aria-expanded={detailsVisible}
            data-testid="patient-request-status-toggle"
            onClick={() => setCollapsed((current) => !current)}
          >
            {detailsVisible ? "Hide update" : "Show details"}
          </button>
        </div>
      ) : null}

      {detailsVisible ? (
        <div id={detailsId} className="patient-phase2-bridge__details">
          <div className="patient-phase2-bridge__header">
            <div>
              {!collapsible ? <p className="patient-phase2-bridge__eyebrow">Request update</p> : null}
              <h2>{context.canonicalStatusLabel}</h2>
              <p>{patientStatusBody(context)}</p>
            </div>
            <div className="patient-phase2-bridge__action">
              <span>Next step</span>
              <strong>{context.patientActionLabel}</strong>
              <small>Your request stays with this account.</small>
            </div>
          </div>

          <dl
            className="patient-phase2-bridge__domains"
            data-testid="PatientRequestStatusDetails"
          >
            {[
              accountItemFor(context),
              {
                label: "Contact preference",
                body: "We use secure messages first and another contact method only if needed.",
              },
              {
                label: "Privacy",
                body: "Only the information needed for this request is shown here.",
              },
            ].map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
