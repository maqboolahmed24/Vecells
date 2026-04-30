import { useId, useState } from "react";

export const PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE = "Pharmacy_Eligibility_Clarity";

export type PharmacyEligibilityPublicationState = "current" | "superseded" | "stale";
export type PharmacyEligibilityGateState = "pass" | "fail" | "review" | "bypassed";
export type PharmacyEligibilityFinalDisposition =
  | "eligible_choice_pending"
  | "minor_illness_fallback"
  | "ineligible_returned";

export interface PharmacyEligibilityGateViewModel {
  gateId: string;
  label: string;
  state: PharmacyEligibilityGateState;
  summary: string;
  detail: string;
  evidenceLabel: string;
}

export interface PharmacyEligibilityEvidenceSummaryRow {
  label: string;
  value: string;
  detail: string;
  patientSafe: boolean;
}

export interface PharmacyEligibilityPolicyPackMeta {
  rulePackId: string;
  versionLabel: string;
  effectiveFrom: string;
  revisionLabel: string;
  scopeLabel: string;
}

export interface PharmacyEligibilitySupersessionNoticeModel {
  state: Exclude<PharmacyEligibilityPublicationState, "current">;
  title: string;
  summary: string;
  actionLabel: string;
}

export interface PharmacyEligibilityNextStepPanelModel {
  title: string;
  summary: string;
  primaryActionLabel: string;
  returnPathLabel: string;
  routeLabel: string;
}

export interface PharmacyEligibilitySurfaceModel {
  pharmacyCaseId: string;
  visualMode?: string;
  finalDisposition: PharmacyEligibilityFinalDisposition;
  publicationState: PharmacyEligibilityPublicationState;
  decisionTupleHash: string;
  sharedEvidenceHash: string;
  summaryTitle: string;
  summary: string;
  patientSummaryTitle: string;
  patientSummary: string;
  patientNextStep: string;
  staffSummary: string;
  policyPack: PharmacyEligibilityPolicyPackMeta;
  gateLadder: readonly PharmacyEligibilityGateViewModel[];
  evidenceSummary: readonly PharmacyEligibilityEvidenceSummaryRow[];
  nextStepPanel: PharmacyEligibilityNextStepPanelModel;
  supersessionNotice?: PharmacyEligibilitySupersessionNoticeModel | null;
}

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function dispositionLabel(value: PharmacyEligibilityFinalDisposition): string {
  switch (value) {
    case "eligible_choice_pending":
      return "Pharmacy route open";
    case "minor_illness_fallback":
      return "Fallback route";
    case "ineligible_returned":
      return "Return to practice";
  }
}

function publicationStateLabel(value: PharmacyEligibilityPublicationState): string {
  return value.replaceAll("_", " ");
}

function gateStateLabel(value: PharmacyEligibilityGateState): string {
  return value.replaceAll("_", " ");
}

function defaultGateId(gates: readonly PharmacyEligibilityGateViewModel[]): string | null {
  return (
    gates.find((gate) => gate.state === "fail" || gate.state === "review")?.gateId ??
    gates[0]?.gateId ??
    null
  );
}

export function EligibilityVersionChip(props: {
  version: PharmacyEligibilityPolicyPackMeta;
  publicationState: PharmacyEligibilityPublicationState;
  decisionTupleHash: string;
  compact?: boolean;
}) {
  return (
    <section
      className={joinClasses(
        "pharmacy-eligibility-version-chip",
        props.compact && "pharmacy-eligibility-version-chip--compact",
      )}
      data-testid="EligibilityVersionChip"
      data-publication-state={props.publicationState}
      data-decision-tuple-hash={props.decisionTupleHash}
    >
      <div>
        <p className="pharmacy-eligibility-kicker">Eligibility version</p>
        <strong>{props.version.versionLabel}</strong>
      </div>
      <dl className="pharmacy-eligibility-inline-meta">
        <div>
          <dt>Effective</dt>
          <dd>{props.version.effectiveFrom}</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>{props.version.scopeLabel}</dd>
        </div>
        <div>
          <dt>Revision</dt>
          <dd>{props.version.revisionLabel}</dd>
        </div>
        <div>
          <dt>State</dt>
          <dd>{publicationStateLabel(props.publicationState)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function EligibilitySupersessionNotice(props: {
  notice: PharmacyEligibilitySupersessionNoticeModel;
}) {
  return (
    <section
      className="pharmacy-eligibility-notice"
      data-testid="EligibilitySupersessionNotice"
      data-notice-state={props.notice.state}
      role="status"
      aria-live="polite"
    >
      <div>
        <p className="pharmacy-eligibility-kicker">Explanation status</p>
        <h3>{props.notice.title}</h3>
        <p>{props.notice.summary}</p>
      </div>
      <span className="pharmacy-eligibility-pill">{props.notice.actionLabel}</span>
    </section>
  );
}

export function EligibilityGateLadder(props: {
  gates: readonly PharmacyEligibilityGateViewModel[];
  testId?: string;
}) {
  const [expandedGateId, setExpandedGateId] = useState<string | null>(() =>
    defaultGateId(props.gates),
  );
  const scopeId = useId();

  return (
    <section
      className="pharmacy-eligibility-ladder"
      data-testid={props.testId ?? "EligibilityGateLadder"}
      aria-label="Eligibility gate ladder"
    >
      <header className="pharmacy-eligibility-section-head">
        <div>
          <p className="pharmacy-eligibility-kicker">Gate ladder</p>
          <h3>Why this route stayed open, fell back, or returned</h3>
        </div>
      </header>
      <ol className="pharmacy-eligibility-ladder__list">
        {props.gates.map((gate, index) => {
          const panelId = `${scopeId}-${gate.gateId}`;
          const expanded = expandedGateId === gate.gateId;
          return (
            <li
              key={gate.gateId}
              className="pharmacy-eligibility-ladder__row"
              data-gate-state={gate.state}
              data-gate-id={gate.gateId}
            >
              <h4 className="pharmacy-eligibility-ladder__heading">
                <button
                  type="button"
                  className="pharmacy-eligibility-ladder__button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() =>
                    setExpandedGateId((current) =>
                      current === gate.gateId ? null : gate.gateId,
                    )
                  }
                >
                  <span className="pharmacy-eligibility-ladder__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="pharmacy-eligibility-ladder__copy">
                    <strong>{gate.label}</strong>
                    <span>{gate.summary}</span>
                  </span>
                  <span className="pharmacy-eligibility-pill">
                    {gateStateLabel(gate.state)}
                  </span>
                </button>
              </h4>
              <div
                className="pharmacy-eligibility-ladder__detail"
                id={panelId}
                hidden={!expanded}
              >
                <p>{gate.detail}</p>
                <dl className="pharmacy-eligibility-inline-meta">
                  <div>
                    <dt>Evidence</dt>
                    <dd>{gate.evidenceLabel}</dd>
                  </div>
                  <div>
                    <dt>Gate state</dt>
                    <dd>{gateStateLabel(gate.state)}</dd>
                  </div>
                </dl>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function EligibilityEvidenceDrawer(props: {
  preview: PharmacyEligibilitySurfaceModel;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(Boolean(props.defaultExpanded));
  const panelId = useId();

  return (
    <section
      className="pharmacy-eligibility-evidence"
      data-testid="EligibilityEvidenceDrawer"
      data-expanded={expanded}
      data-decision-tuple-hash={props.preview.decisionTupleHash}
    >
      <header className="pharmacy-eligibility-section-head">
        <div>
          <p className="pharmacy-eligibility-kicker">Evidence summary</p>
          <h3>Inspect the tuple without leaving the shell</h3>
          <p>{props.preview.staffSummary}</p>
        </div>
        <button
          type="button"
          className="pharmacy-eligibility-secondary-action"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Hide evidence detail" : "Show evidence detail"}
        </button>
      </header>
      <div className="pharmacy-eligibility-evidence__summary">
        {props.preview.evidenceSummary.slice(0, 2).map((row) => (
          <article key={row.label} className="pharmacy-eligibility-fact-card">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            <p>{row.detail}</p>
          </article>
        ))}
      </div>
      <div id={panelId} hidden={!expanded}>
        <dl className="pharmacy-eligibility-evidence__grid">
          {props.preview.evidenceSummary.map((row) => (
            <div key={row.label} data-patient-safe={row.patientSafe}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
              <p>{row.detail}</p>
            </div>
          ))}
        </dl>
        <div className="pharmacy-eligibility-meta-pair">
          <article className="pharmacy-eligibility-fact-card">
            <span>Decision status</span>
            <strong>Checked</strong>
            <p>Stable selector for patient and staff parity checks.</p>
          </article>
          <article className="pharmacy-eligibility-fact-card">
            <span>Evidence check</span>
            <strong>Checked</strong>
            <p>Frozen evidence anchor for replay and audit.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function PharmacyEligibilityRuleExplainer(props: {
  preview: PharmacyEligibilitySurfaceModel;
}) {
  return (
    <section
      className="pharmacy-eligibility-surface"
      data-testid="PharmacyEligibilityRuleExplainer"
      data-visual-mode={
        props.preview.visualMode ?? PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE
      }
      data-decision-tuple-hash={props.preview.decisionTupleHash}
      data-final-disposition={props.preview.finalDisposition}
      data-publication-state={props.preview.publicationState}
    >
      {props.preview.supersessionNotice ? (
        <EligibilitySupersessionNotice notice={props.preview.supersessionNotice} />
      ) : null}
      <section className="pharmacy-eligibility-summary-strip" aria-label="Decision summary strip">
        <div>
          <p className="pharmacy-eligibility-kicker">Decision summary</p>
          <h2>{props.preview.summaryTitle}</h2>
          <p>{props.preview.summary}</p>
        </div>
        <div className="pharmacy-eligibility-summary-strip__facts">
          <span className="pharmacy-eligibility-pill">
            {dispositionLabel(props.preview.finalDisposition)}
          </span>
          <span className="pharmacy-eligibility-pill">
            {publicationStateLabel(props.preview.publicationState)}
          </span>
        </div>
      </section>
      <section className="pharmacy-eligibility-surface__meta-row">
        <EligibilityVersionChip
          version={props.preview.policyPack}
          publicationState={props.preview.publicationState}
          decisionTupleHash={props.preview.decisionTupleHash}
        />
        <article className="pharmacy-eligibility-fact-card">
          <span>Staff-safe explanation</span>
          <strong>{props.preview.staffSummary}</strong>
          <p>
            The patient surface can redact rule mechanics, but it must stay aligned to
            this same tuple.
          </p>
        </article>
      </section>
      <EligibilityGateLadder gates={props.preview.gateLadder} />
    </section>
  );
}

export function PatientUnsuitableReturnState(props: {
  preview: PharmacyEligibilitySurfaceModel;
}) {
  return (
    <section
      className="pharmacy-eligibility-patient-state"
      data-testid="PatientUnsuitableReturnState"
      data-visual-mode={
        props.preview.visualMode ?? PHARMACY_ELIGIBILITY_CLARITY_VISUAL_MODE
      }
      data-decision-tuple-hash={props.preview.decisionTupleHash}
      data-final-disposition={props.preview.finalDisposition}
      role="status"
      aria-live="polite"
    >
      {props.preview.supersessionNotice ? (
        <EligibilitySupersessionNotice notice={props.preview.supersessionNotice} />
      ) : null}
      <section className="pharmacy-eligibility-summary-strip pharmacy-eligibility-summary-strip--patient">
        <div>
          <p className="pharmacy-eligibility-kicker">Return state</p>
          <h2>{props.preview.patientSummaryTitle}</h2>
          <p>{props.preview.patientSummary}</p>
        </div>
        <div className="pharmacy-eligibility-summary-strip__facts">
          <span className="pharmacy-eligibility-pill">
            {dispositionLabel(props.preview.finalDisposition)}
          </span>
        </div>
      </section>
      <section className="pharmacy-eligibility-patient-state__grid">
        <article className="pharmacy-eligibility-fact-card">
          <span>What happens next</span>
          <strong>{props.preview.patientNextStep}</strong>
          <p>The wording stays short and actionable and does not expose internal rule IDs.</p>
        </article>
        <EligibilityVersionChip
          version={props.preview.policyPack}
          publicationState={props.preview.publicationState}
          decisionTupleHash={props.preview.decisionTupleHash}
          compact
        />
      </section>
    </section>
  );
}

export function PatientAlternativeRouteNextStepPanel(props: {
  preview: PharmacyEligibilitySurfaceModel;
  onPrimaryAction?: () => void;
  primaryDisabled?: boolean;
}) {
  return (
    <section
      className="pharmacy-eligibility-next-step"
      data-testid="PatientAlternativeRouteNextStepPanel"
      data-route-label={props.preview.nextStepPanel.routeLabel}
      data-decision-tuple-hash={props.preview.decisionTupleHash}
    >
      <header className="pharmacy-eligibility-section-head">
        <div>
          <p className="pharmacy-eligibility-kicker">Next safe step</p>
          <h3>{props.preview.nextStepPanel.title}</h3>
          <p>{props.preview.nextStepPanel.summary}</p>
        </div>
      </header>
      <div className="pharmacy-eligibility-meta-pair">
        <article className="pharmacy-eligibility-fact-card">
          <span>Route</span>
          <strong>{props.preview.nextStepPanel.routeLabel}</strong>
          <p>{props.preview.nextStepPanel.returnPathLabel}</p>
        </article>
        <article className="pharmacy-eligibility-fact-card">
          <span>Decision tuple</span>
          <strong>{props.preview.decisionTupleHash}</strong>
          <p>The same tuple anchors the staff explainer for this case.</p>
        </article>
      </div>
      <button
        type="button"
        className="pharmacy-eligibility-primary-action"
        onClick={props.onPrimaryAction}
        disabled={props.primaryDisabled}
      >
        {props.preview.nextStepPanel.primaryActionLabel}
      </button>
    </section>
  );
}
