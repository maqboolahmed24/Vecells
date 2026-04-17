import type { PortalSupportPhase2Context } from "../../../packages/domain-kernel/src/patient-support-phase2-integration";

export function PatientSupportPhase2Bridge({
  context,
}: {
  context: PortalSupportPhase2Context;
}) {
  return (
    <section
      className="patient-phase2-bridge"
      data-testid="PatientSupportPhase2Bridge"
      data-truth-kernel={context.truthKernel}
      data-route-family={context.surface.routeFamily}
      data-cause-class={context.causeClass}
      data-recovery-class={context.recoveryClass}
    >
      <div className="patient-phase2-bridge__header">
        <div>
          <p className="patient-phase2-bridge__eyebrow">Phase 2 truth</p>
          <h2>{context.canonicalStatusLabel}</h2>
          <p>{context.communicationStateLabel}</p>
        </div>
        <div className="patient-phase2-bridge__status">
          <span>{context.surface.routeFamily}</span>
          <strong>{context.fixture.requestLineageRef}</strong>
          <small>{context.recoveryClass.replaceAll("_", " ")}</small>
        </div>
      </div>

      <div className="patient-phase2-bridge__grid">
        <article className="patient-phase2-bridge__card">
          <span>Patient next action</span>
          <strong>{context.patientActionLabel}</strong>
          <small>Support route: {context.fixture.supportTicketId}</small>
        </article>
        <article className="patient-phase2-bridge__card">
          <span>Support next action</span>
          <strong>{context.supportActionLabel}</strong>
          <small>Cause class: {context.causeClass.replaceAll("_", " ")}</small>
        </article>
      </div>

      <dl
        className="patient-phase2-bridge__domains"
        data-testid="PatientSupportContactDomains"
      >
        <div>
          <dt>Auth claim</dt>
          <dd>{context.contactDomains.authClaim}</dd>
        </div>
        <div>
          <dt>Identity evidence</dt>
          <dd>{context.contactDomains.identityEvidence}</dd>
        </div>
        <div>
          <dt>Demographic evidence</dt>
          <dd>{context.contactDomains.demographicEvidence}</dd>
        </div>
        <div>
          <dt>Patient preference</dt>
          <dd>{context.contactDomains.communicationPreference}</dd>
        </div>
        <div>
          <dt>Support reachability</dt>
          <dd>{context.contactDomains.supportReachability}</dd>
        </div>
      </dl>
    </section>
  );
}
