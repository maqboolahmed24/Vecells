import React, { useEffect, useMemo, useState } from "react";

import {
  NHS_APP_CHANNEL_CASES,
  NHS_APP_CHANNEL_WORKBENCH_VISUAL_MODE,
  buildNHSAppWorkbenchUrl,
  defaultNHSAppWorkbenchUrlState,
  parseNHSAppWorkbenchUrl,
  selectNHSAppChannelCase,
  selectedNHSAppChannelEvent,
  summarizeNHSAppChannelCases,
  updateNHSAppWorkbenchState,
  type NHSAppChannelCase,
  type NHSAppChannelTimelineEvent,
  type NHSAppFreezePosture,
  type NHSAppSSOOutcome,
  type NHSAppWorkbenchTab,
  type NHSAppWorkbenchUrlState,
} from "./nhs-app-channel-workbench.model";

function titleCase(value: string): string {
  return value
    .split(/[_:.-]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function initialState(): NHSAppWorkbenchUrlState {
  if (typeof window === "undefined") {
    return defaultNHSAppWorkbenchUrlState;
  }
  return parseNHSAppWorkbenchUrl(window.location.pathname, window.location.search);
}

function ssoTone(outcome: NHSAppSSOOutcome): string {
  switch (outcome) {
    case "silent_success":
      return "success";
    case "silent_failed":
    case "safe_reentry_required":
      return "warning";
    case "consent_denied":
      return "blocked";
  }
}

function freezeTone(posture: NHSAppFreezePosture): string {
  switch (posture) {
    case "none":
      return "success";
    case "read_only":
    case "placeholder_only":
    case "redirect_to_safe_route":
      return "warning";
    case "kill_switch_active":
      return "blocked";
  }
}

function tabLabel(tab: NHSAppWorkbenchTab): string {
  switch (tab) {
    case "context":
      return "Context";
    case "freeze":
      return "Freeze";
    case "patient":
      return "Patient";
    case "audit":
      return "Audit";
  }
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function useUrlBackedState(): [
  NHSAppWorkbenchUrlState,
  (patch: Partial<NHSAppWorkbenchUrlState>) => void,
] {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const nextUrl = buildNHSAppWorkbenchUrl(state);
    if (
      typeof window !== "undefined" &&
      `${window.location.pathname}${window.location.search}` !== nextUrl
    ) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [state]);

  return [state, (patch) => setState((current) => updateNHSAppWorkbenchState(current, patch))];
}

export function NHSAppJumpOffRouteChip(props: { readonly selectedCase: NHSAppChannelCase }) {
  return (
    <span
      className="nhs-channel-chip"
      data-testid="NHSAppJumpOffRouteChip"
      data-jump-off-route={props.selectedCase.jumpOffRoute}
      data-resume-path={props.selectedCase.resumePath}
    >
      <strong>{props.selectedCase.jumpOffRoute}</strong>
      <span>Resume {props.selectedCase.resumePath}</span>
    </span>
  );
}

export function EmbeddedSSOOutcomePill(props: { readonly outcome: NHSAppSSOOutcome }) {
  return (
    <span
      className="nhs-channel-pill"
      data-tone={ssoTone(props.outcome)}
      data-testid="EmbeddedSSOOutcomePill"
      data-sso-outcome={props.outcome}
    >
      {titleCase(props.outcome)}
    </span>
  );
}

export function NHSAppChannelContextRibbon(props: { readonly selectedCase: NHSAppChannelCase }) {
  const { selectedCase } = props;
  return (
    <section
      className="nhs-channel-ribbon"
      aria-label="NHS App channel context"
      data-testid="NHSAppChannelContextRibbon"
      data-route-family={selectedCase.routeFamily}
      data-channel-type={selectedCase.channelType}
      data-freeze-posture={selectedCase.freezePosture}
      data-cohort-ref={selectedCase.cohortRef}
    >
      <div>
        <span>Route family</span>
        <strong>{titleCase(selectedCase.routeFamily)}</strong>
        <small>{selectedCase.journeyPathId}</small>
      </div>
      <div>
        <span>Channel</span>
        <strong>{titleCase(selectedCase.channelType)}</strong>
        <small>{selectedCase.bridgeCapabilityFloor}</small>
      </div>
      <div>
        <span>SSO outcome</span>
        <EmbeddedSSOOutcomePill outcome={selectedCase.ssoOutcome} />
        <small>{selectedCase.supportCaseRef}</small>
      </div>
      <div>
        <span>Cohort</span>
        <strong>{selectedCase.cohortRef}</strong>
        <small>{selectedCase.releaseEvidenceRef}</small>
      </div>
      <div>
        <span>Freeze posture</span>
        <strong data-tone={freezeTone(selectedCase.freezePosture)}>
          {titleCase(selectedCase.freezePosture)}
        </strong>
        <small>{selectedCase.routeFreezeDispositionRef}</small>
      </div>
    </section>
  );
}

export function NHSAppChannelEventTimeline(props: {
  readonly selectedCase: NHSAppChannelCase;
  readonly selectedEventId: string;
  readonly onSelectEvent: (eventId: string) => void;
}) {
  return (
    <section
      className="nhs-channel-panel nhs-channel-timeline"
      aria-label="NHS App channel event timeline"
      data-testid="NHSAppChannelEventTimeline"
    >
      <header>
        <div>
          <span>Event lineage</span>
          <h2>Patient-visible channel trace</h2>
        </div>
        <NHSAppJumpOffRouteChip selectedCase={props.selectedCase} />
      </header>
      <ol>
        {props.selectedCase.timeline.map((eventEntry) => (
          <li key={eventEntry.eventId}>
            <button
              type="button"
              className="nhs-channel-event"
              aria-pressed={props.selectedEventId === eventEntry.eventId}
              data-testid={`ChannelTimelineEvent-${eventEntry.eventId}`}
              data-event-kind={eventEntry.kind}
              data-selected={props.selectedEventId === eventEntry.eventId}
              onClick={() => props.onSelectEvent(eventEntry.eventId)}
            >
              <span className="nhs-channel-event__time">{formatTime(eventEntry.occurredAt)}</span>
              <span className="nhs-channel-event__body">
                <strong>{eventEntry.heading}</strong>
                <small>{eventEntry.summary}</small>
              </span>
              <span className="nhs-channel-event__kind">{titleCase(eventEntry.kind)}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WhatPatientSawPanel(props: {
  readonly selectedCase: NHSAppChannelCase;
  readonly selectedEvent: NHSAppChannelTimelineEvent;
}) {
  return (
    <section
      className="nhs-channel-panel nhs-channel-patient"
      aria-label="What the patient saw"
      data-testid="WhatPatientSawPanel"
      data-patient-visible-recovery-summary={props.selectedCase.recoverySummary}
    >
      <header>
        <span>Patient state</span>
        <h2>What the patient saw</h2>
      </header>
      <div className="nhs-channel-patient__screen">
        <div className="nhs-channel-patient__bar" />
        <strong>{props.selectedEvent.heading}</strong>
        <p>{props.selectedEvent.patientVisibleSummary}</p>
        <p>{props.selectedCase.patientVisibleSummary}</p>
        <span data-tone={freezeTone(props.selectedCase.freezePosture)}>
          {titleCase(props.selectedCase.freezePosture)}
        </span>
      </div>
    </section>
  );
}

export function NHSAppRouteFreezeInspector(props: { readonly selectedCase: NHSAppChannelCase }) {
  return (
    <section
      className="nhs-channel-panel nhs-channel-inspector"
      aria-label="Route freeze inspector"
      data-testid="NHSAppRouteFreezeInspector"
      data-freeze-posture={props.selectedCase.freezePosture}
      data-freeze-record={props.selectedCase.routeFreezeRecordRef ?? "none"}
    >
      <header>
        <span>Release posture</span>
        <h2>Route freeze inspector</h2>
      </header>
      <dl>
        <div>
          <dt>Freeze record</dt>
          <dd>{props.selectedCase.routeFreezeRecordRef ?? "No active freeze"}</dd>
        </div>
        <div>
          <dt>Disposition</dt>
          <dd>{props.selectedCase.routeFreezeDispositionRef}</dd>
        </div>
        <div>
          <dt>Recovery path</dt>
          <dd>{props.selectedCase.recoveryPath}</dd>
        </div>
        <div>
          <dt>Policy boundary</dt>
          <dd>{props.selectedCase.releaseSummary}</dd>
        </div>
      </dl>
    </section>
  );
}

export function NHSAppArtifactPostureCard(props: { readonly selectedCase: NHSAppChannelCase }) {
  return (
    <section
      className="nhs-channel-panel nhs-channel-artifact"
      aria-label="NHS App artifact posture"
      data-testid="NHSAppArtifactPostureCard"
      data-artifact-posture={props.selectedCase.artifactPosture}
    >
      <span>Artifact posture</span>
      <strong>{titleCase(props.selectedCase.artifactPosture)}</strong>
      <p>
        {props.selectedCase.artifactPosture === "download_blocked"
          ? "Download bridge disabled; safe route only."
          : "Disclosure-safe refs only."}
      </p>
    </section>
  );
}

export function NHSAppAuditDeepLinkStrip(props: { readonly selectedCase: NHSAppChannelCase }) {
  return (
    <nav
      className="nhs-channel-deeplinks"
      aria-label="NHS App channel deep links"
      data-testid="NHSAppAuditDeepLinkStrip"
      data-audit-event-ref={props.selectedCase.auditEventRef}
    >
      <a href={`/ops/support/cases/${props.selectedCase.caseId}/channel`}>Support case</a>
      <a href={`/ops/release/nhs-app/cases/${props.selectedCase.journeyPathId}`}>Release row</a>
      <a
        href={`/ops/audit/channel/nhs-app/${props.selectedCase.timeline[0]?.eventId ?? props.selectedCase.auditEventRef}`}
      >
        Audit event
      </a>
      <a href={props.selectedCase.recoveryPath}>Recovery path</a>
    </nav>
  );
}

export function NHSAppSupportRecoveryActionBar(props: {
  readonly selectedCase: NHSAppChannelCase;
}) {
  const summary = `${props.selectedCase.caseId} ${props.selectedCase.routeFamily} ${props.selectedCase.ssoOutcome} ${props.selectedCase.freezePosture} ${props.selectedCase.recoverySummary}`;
  return (
    <section
      className="nhs-channel-actionbar"
      aria-label="Support recovery actions"
      data-testid="NHSAppSupportRecoveryActionBar"
      data-recovery-kind={props.selectedCase.recoveryKind}
    >
      <div>
        <span>Bounded recovery</span>
        <strong>{props.selectedCase.recoverySummary}</strong>
      </div>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(summary);
        }}
      >
        Copy channel summary
      </button>
      <a href={props.selectedCase.recoveryPath}>Open governed recovery</a>
    </section>
  );
}

export function NHSAppChannelStatePreviewCard(props: { readonly selectedCase: NHSAppChannelCase }) {
  return (
    <section
      className="nhs-channel-panel nhs-channel-state"
      aria-label="NHS App channel state preview"
      data-testid="NHSAppChannelStatePreviewCard"
      data-channel-state-preview={props.selectedCase.caseId}
    >
      <span>Current state</span>
      <p>{props.selectedCase.operatorSummary}</p>
      <p>{props.selectedCase.releaseSummary}</p>
    </section>
  );
}

function CaseRail(props: {
  readonly selectedCaseId: string;
  readonly onSelectCase: (caseId: string) => void;
}) {
  return (
    <aside className="nhs-channel-rail" aria-label="NHS App channel cases">
      <header>
        <span>Channel cases</span>
        <strong>{NHS_APP_CHANNEL_CASES.length}</strong>
      </header>
      {NHS_APP_CHANNEL_CASES.map((entry) => (
        <button
          type="button"
          key={entry.caseId}
          className="nhs-channel-case"
          data-testid={`ChannelCaseRow-${entry.caseId}`}
          data-selected={entry.caseId === props.selectedCaseId}
          data-route-family={entry.routeFamily}
          data-sso-outcome={entry.ssoOutcome}
          data-freeze-posture={entry.freezePosture}
          onClick={() => props.onSelectCase(entry.caseId)}
        >
          <span>{entry.caseId}</span>
          <strong>{titleCase(entry.routeFamily)}</strong>
          <small>{entry.patientVisibleSummary}</small>
        </button>
      ))}
    </aside>
  );
}

function SummaryStrip(props: { readonly selectedCase: NHSAppChannelCase }) {
  return (
    <section className="nhs-channel-summary" aria-label="Channel truth summary">
      <p>
        <span>Patient</span>
        {props.selectedCase.patientVisibleSummary}
      </p>
      <p>
        <span>Operator</span>
        {props.selectedCase.operatorSummary}
      </p>
      <p>
        <span>Release</span>
        {props.selectedCase.releaseSummary}
      </p>
    </section>
  );
}

function AuditTable(props: { readonly selectedCase: NHSAppChannelCase }) {
  return (
    <section
      className="nhs-channel-panel nhs-channel-audit"
      aria-label="Disclosure-safe audit table"
    >
      <header>
        <span>Audit and telemetry</span>
        <h2>Disclosure-safe fields</h2>
      </header>
      <table>
        <thead>
          <tr>
            <th scope="col">Field</th>
            <th scope="col">Value</th>
            <th scope="col">Deep link</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Audit event", props.selectedCase.auditEventRef, "Audit"],
            ["Telemetry", props.selectedCase.telemetryRef, "Telemetry"],
            ["Evidence", props.selectedCase.releaseEvidenceRef, "Evidence"],
            ["Disposition", props.selectedCase.routeFreezeDispositionRef, "Release"],
          ].map(([label, value, link]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value}</td>
              <td>
                <a
                  href={`/ops/audit/channel/nhs-app/${props.selectedCase.timeline[0]?.eventId ?? ""}`}
                >
                  {link}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TabBar(props: {
  readonly selectedTab: NHSAppWorkbenchTab;
  readonly onSelectTab: (tab: NHSAppWorkbenchTab) => void;
}) {
  const tabs: readonly NHSAppWorkbenchTab[] = ["context", "freeze", "patient", "audit"];
  return (
    <div className="nhs-channel-tabs" role="tablist" aria-label="Channel inspector sections">
      {tabs.map((tab) => (
        <button
          type="button"
          role="tab"
          key={tab}
          aria-selected={props.selectedTab === tab}
          aria-controls={`nhs-channel-section-${tab}`}
          data-testid={`ChannelWorkbenchTab-${tab}`}
          onClick={() => props.onSelectTab(tab)}
        >
          {tabLabel(tab)}
        </button>
      ))}
    </div>
  );
}

export function NHSAppChannelControlWorkbench() {
  const [state, updateState] = useUrlBackedState();
  const selectedCase = selectNHSAppChannelCase(state.selectedCaseId);
  const selectedEvent = selectedNHSAppChannelEvent(selectedCase, state.selectedEventId);
  const summary = useMemo(() => summarizeNHSAppChannelCases(), []);

  return (
    <div
      className="nhs-channel-workbench"
      data-testid="NHSAppChannelControlWorkbench"
      data-visual-mode={NHS_APP_CHANNEL_WORKBENCH_VISUAL_MODE}
      data-selected-case={selectedCase.caseId}
      data-selected-channel={selectedCase.channelType}
      data-selected-route-family={selectedCase.routeFamily}
      data-sso-outcome={selectedCase.ssoOutcome}
      data-freeze-posture={selectedCase.freezePosture}
      data-patient-visible-recovery-summary={selectedCase.recoverySummary}
    >
      <a className="nhs-channel-skip" href="#nhs-channel-main">
        Skip to channel workbench
      </a>
      <header className="nhs-channel-masthead">
        <div>
          <span>Phase 7 channel control</span>
          <h1>NHS App support and governance workbench</h1>
          <p>
            Reconstruct entry, SSO, route, freeze, artifact, and recovery truth from the same
            governed channel record.
          </p>
        </div>
        <div className="nhs-channel-metrics" aria-label="Channel case summary">
          <span>
            <strong>{summary.totalCases}</strong>
            Cases
          </span>
          <span>
            <strong>{summary.embeddedCases}</strong>
            Embedded
          </span>
          <span>
            <strong>{summary.frozenCases}</strong>
            Frozen
          </span>
          <span>
            <strong>{summary.safeReentryCases}</strong>
            Re-entry
          </span>
        </div>
      </header>
      <main className="nhs-channel-layout" id="nhs-channel-main">
        <CaseRail
          selectedCaseId={selectedCase.caseId}
          onSelectCase={(caseId) => updateState({ selectedCaseId: caseId })}
        />
        <div className="nhs-channel-canvas">
          <NHSAppChannelContextRibbon selectedCase={selectedCase} />
          <SummaryStrip selectedCase={selectedCase} />
          <TabBar
            selectedTab={state.selectedTab}
            onSelectTab={(tab) => updateState({ selectedTab: tab })}
          />
          <div
            id={`nhs-channel-section-${state.selectedTab}`}
            role="tabpanel"
            aria-label={`${tabLabel(state.selectedTab)} channel section`}
          >
            <NHSAppChannelEventTimeline
              selectedCase={selectedCase}
              selectedEventId={state.selectedEventId}
              onSelectEvent={(eventId) => updateState({ selectedEventId: eventId })}
            />
            <AuditTable selectedCase={selectedCase} />
          </div>
        </div>
        <aside
          className="nhs-channel-side"
          aria-label="Channel inspector and patient preview"
          data-docked={state.inspectorDocked}
        >
          <button
            type="button"
            className="nhs-channel-dock"
            data-testid="ChannelInspectorDockToggle"
            onClick={() => updateState({ inspectorDocked: !state.inspectorDocked })}
          >
            {state.inspectorDocked ? "Docked" : "Stacked"}
          </button>
          <WhatPatientSawPanel selectedCase={selectedCase} selectedEvent={selectedEvent} />
          <NHSAppRouteFreezeInspector selectedCase={selectedCase} />
          <NHSAppArtifactPostureCard selectedCase={selectedCase} />
          <NHSAppChannelStatePreviewCard selectedCase={selectedCase} />
          <NHSAppAuditDeepLinkStrip selectedCase={selectedCase} />
          <NHSAppSupportRecoveryActionBar selectedCase={selectedCase} />
        </aside>
      </main>
    </div>
  );
}
