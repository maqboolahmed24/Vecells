import { useEffect, useMemo, useState } from "react";
import { VecellLogoLockup } from "@vecells/design-system";

import { telephonyLabPack } from "./generated/telephonyLabPack";

type Pack = typeof telephonyLabPack;
type NumberRow = Pack["number_inventory"][number];
type CallRow = Pack["seeded_calls"][number];
type ScenarioRow = Pack["call_scenarios"][number];
type GateRow = Pack["live_gate_pack"]["live_gates"][number];
type Page =
  | "Number_Inventory"
  | "IVR_Flow_Studio"
  | "Webhook_and_Signature_Map"
  | "Recording_and_Continuation"
  | "Live_Gates_and_Spend_Controls";
type Mode = "mock" | "actual";

type AppState = {
  mode: Mode;
  page: Page;
  selectedNumberId: string;
  selectedScenarioId: string;
  selectedCallId: string;
  serviceBaseUrl: string;
  actualInputs: {
    telephonyVendorId: string;
    namedApprover: string;
    targetEnvironment: string;
    callbackBaseUrl: string;
    recordingPolicyRef: string;
    numberProfileRef: string;
    spendCapGbp: string;
    webhookSecretRef: string;
    allowMutation: string;
    allowSpend: string;
  };
  reducedMotion: boolean;
};

type LiveNumber = NumberRow & {
  assignment_state: "available" | "assigned";
  assigned_to: string;
};

type LiveCall = CallRow;

const STORAGE_KEY = "voice-fabric-lab-state";
const PAGE_ORDER: readonly Page[] = [
  "Number_Inventory",
  "IVR_Flow_Studio",
  "Webhook_and_Signature_Map",
  "Recording_and_Continuation",
  "Live_Gates_and_Spend_Controls",
];

function publicRefLabel(value: string): string {
  return value
    .replace(/^MOCK:/i, "test ")
    .replace(/^NUM_TEL_/i, "")
    .replace(/^(rec|wh|ivr)_/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function publicCopy(value: string | undefined): string {
  return (value ?? "")
    .replace(/\bVoice_Fabric_Lab\b/g, "Voice Fabric Lab")
    .replace(/\bMOCK_TELEPHONY_LAB\b/g, "Telephony Lab")
    .replace(/\bposture\b/gi, "status")
    .replace(/\bcontract\b/gi, "rules")
    .replace(/\blineage\b/gi, "history")
    .replace(/\btruth\b/gi, "status")
    .replace(/\bbounded\b/gi, "limited")
    .replace(/\bAccessGrant\b/g, "access approval");
}

function recordingPolicyLabel(ref: string): string {
  return (
    telephonyLabPack.recording_policies.find((row) => row.recording_policy_ref === ref)?.label ??
    publicRefLabel(ref)
  );
}

function numberProfileLabel(row: NumberRow): string {
  return publicRefLabel(row.number_id);
}

function scenarioById(id: string): ScenarioRow {
  return telephonyLabPack.call_scenarios.find((row) => row.scenario_id === id)!;
}

function numberById(id: string): NumberRow {
  return telephonyLabPack.number_inventory.find((row) => row.number_id === id)!;
}

function initialNumbers(): LiveNumber[] {
  return telephonyLabPack.number_inventory.map((row, index) => ({
    ...row,
    assignment_state: index < 4 ? "assigned" : "available",
    assigned_to: index < 4 ? "voice_lab" : "",
  }));
}

function seededCalls(): LiveCall[] {
  return telephonyLabPack.seeded_calls.map((row) => ({ ...row }));
}

function defaultState(): AppState {
  const params = new URLSearchParams(window.location.search);
  const firstNumber = telephonyLabPack.number_inventory[0];
  const firstScenario = telephonyLabPack.call_scenarios[0];
  const firstCall = telephonyLabPack.seeded_calls[0];
  return {
    mode: params.get("mode") === "actual" ? "actual" : "mock",
    page:
      (params.get("page") as Page | null) ??
      "Number_Inventory",
    selectedNumberId: firstNumber.number_id,
    selectedScenarioId: firstScenario.scenario_id,
    selectedCallId: firstCall.call_id,
    serviceBaseUrl:
      params.get("telephonyBaseUrl") ?? telephonyLabPack.mock_service.base_url_default,
    actualInputs: {
      telephonyVendorId: "twilio_telephony_ivr",
      namedApprover: "",
      targetEnvironment: "provider_like_preprod",
      callbackBaseUrl: "https://example.invalid/telephony",
      recordingPolicyRef: firstNumber.recording_policy_ref,
      numberProfileRef: firstNumber.number_id,
      spendCapGbp: "0",
      webhookSecretRef: "vault://telephony/webhook",
      allowMutation: "false",
      allowSpend: "false",
    },
    reducedMotion: false,
  };
}

function initialState(): AppState {
  const base = defaultState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return base;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...base,
      ...parsed,
      actualInputs: {
        ...base.actualInputs,
        ...(parsed.actualInputs ?? {}),
      },
    };
  } catch {
    return base;
  }
}

function nextCallId(currentCalls: readonly LiveCall[]): string {
  const nextOrdinal =
    currentCalls
      .map((row) => Number(row.call_id.split("-").pop()))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)[0] + 1;
  return `CALL-LAB-${String(nextOrdinal || 5000)}`;
}

function eventLabel(state: string): string {
  return state.replace(/_/g, " ");
}

function eventTone(state: string): string {
  if (["closed", "submitted", "evidence_ready"].includes(state)) {
    return "tone-success";
  }
  if (["urgent_live_only", "manual_audio_review_required", "recording_missing"].includes(state)) {
    return "tone-blocked";
  }
  if (["webhook_signature_failed", "webhook_retry_pending", "provider_error"].includes(state)) {
    return "tone-caution";
  }
  if (["continuation_eligible", "continuation_sent", "evidence_pending"].includes(state)) {
    return "tone-review";
  }
  return "";
}

function localEventsForScenario(callId: string, scenario: ScenarioRow): LiveCall["events"] {
  return scenario.state_path.map((state, index) => ({
    event_id: `${callId}-${index + 1}`,
    state,
    label: eventLabel(state),
    tone:
      state === "closed" || state === "submitted" || state === "evidence_ready"
        ? "success"
        : state === "urgent_live_only" || state === "manual_audio_review_required" || state === "recording_missing"
          ? "blocked"
          : state === "webhook_signature_failed" || state === "webhook_retry_pending" || state === "provider_error"
            ? "caution"
            : state === "continuation_eligible" || state === "continuation_sent" || state === "evidence_pending"
              ? "review"
              : "default",
    detail: scenario.summary,
    at: new Date(Date.now() + index * 120000).toISOString(),
  }));
}

function buildLocalCall(callId: string, scenario: ScenarioRow, numberId: string): LiveCall {
  const numberRow = numberById(numberId);
  return {
    call_id: callId,
    scenario_id: scenario.scenario_id,
    number_id: numberId,
    direction: scenario.direction,
    caller_ref: "synthetic-live-run",
    created_at: new Date().toISOString(),
    status: scenario.terminal_state,
    summary: scenario.summary,
    ivr_profile_ref: numberRow.ivr_profile_ref,
    recording_policy_ref: numberRow.recording_policy_ref,
    webhook_profile_ref: numberRow.webhook_profile_ref,
    urgent_state: scenario.urgent_state,
    recording_state: scenario.recording_state,
    transcript_state: scenario.transcript_state,
    continuation_state: scenario.continuation_state,
    webhook_state: scenario.webhook_state,
    events: localEventsForScenario(callId, scenario),
    can_advance: !["closed", "manual_audio_review_required", "continuation_sent"].includes(
      scenario.terminal_state,
    ),
    can_retry_webhook: scenario.webhook_state === "signature_failed",
  };
}

function nextAdvanceState(call: LiveCall): LiveCall {
  if (!call.can_advance) {
    return call;
  }
  return {
    ...call,
    can_advance: false,
    status: call.status === "evidence_pending" ? "submitted" : call.status,
    events: call.events.concat({
      event_id: `${call.call_id}-${call.events.length + 1}`,
      state: call.status === "evidence_pending" ? "submitted" : "closed",
      label: call.status === "evidence_pending" ? "submitted" : "closed",
      tone: call.status === "evidence_pending" ? "success" : "success",
      detail: call.status === "evidence_pending"
        ? "The call is now ready to feed the canonical intake convergence path."
        : "The scenario reached its terminal mock status.",
      at: new Date().toISOString(),
    }),
  };
}

function nextRetryState(call: LiveCall): LiveCall {
  if (!call.can_retry_webhook) {
    return call;
  }
  return {
    ...call,
    can_retry_webhook: false,
    webhook_state: "recovered",
    events: call.events.concat(
      {
        event_id: `${call.call_id}-${call.events.length + 1}`,
        state: "webhook_signature_validated",
        label: "webhook signature validated",
        tone: "success",
        detail: "Replay-safe retry succeeded after callback signature validation.",
        at: new Date().toISOString(),
      },
      {
        event_id: `${call.call_id}-${call.events.length + 2}`,
        state: "webhook_dispatch_recovered",
        label: "webhook dispatch recovered",
        tone: "success",
        detail: "Recovered callback remains transport evidence only until local settlement runs.",
        at: new Date(Date.now() + 60000).toISOString(),
      },
    ),
  };
}

function App() {
  const [appState, setAppState] = useState<AppState>(initialState);
  const [numbers, setNumbers] = useState<LiveNumber[]>(initialNumbers);
  const [calls, setCalls] = useState<LiveCall[]>(seededCalls);
  const [serviceStatus, setServiceStatus] = useState("checking");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setAppState((current) => ({ ...current, reducedMotion: media.matches }));
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    const params = new URLSearchParams(window.location.search);
    params.set("mode", appState.mode);
    params.set("page", appState.page);
    params.set("telephonyBaseUrl", appState.serviceBaseUrl);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
  }, [appState]);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const [health, numberRows, callRows] = await Promise.all([
          fetch(`${appState.serviceBaseUrl}/api/health`).then((response) => response.json()),
          fetch(`${appState.serviceBaseUrl}/api/numbers`).then((response) => response.json()),
          fetch(`${appState.serviceBaseUrl}/api/calls`).then((response) => response.json()),
        ]);
        if (!active) {
          return;
        }
        if (Array.isArray(numberRows.numbers)) {
          setNumbers(numberRows.numbers);
        }
        if (Array.isArray(callRows.calls)) {
          setCalls(callRows.calls);
        }
        setServiceStatus(health.status ?? "healthy");
      } catch {
        if (active) {
          setServiceStatus("offline-fallback");
        }
      }
    }
    refresh();
    return () => {
      active = false;
    };
  }, [appState.serviceBaseUrl]);

  const selectedNumber = useMemo(
    () => numbers.find((row) => row.number_id === appState.selectedNumberId) ?? numbers[0],
    [numbers, appState.selectedNumberId],
  );
  const selectedCall = useMemo(
    () => calls.find((row) => row.call_id === appState.selectedCallId) ?? calls[0],
    [calls, appState.selectedCallId],
  );
  const selectedScenario = scenarioById(appState.selectedScenarioId);
  const selectedRecordingPolicy = telephonyLabPack.recording_policies.find(
    (row) => row.recording_policy_ref === selectedNumber.recording_policy_ref,
  );

  async function tryCarrierMutation(path: string, body: object): Promise<any | null> {
    try {
      const response = await fetch(`${appState.serviceBaseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Request failed");
      }
      return payload;
    } catch {
      return null;
    }
  }

  async function assignNumber() {
    const remote = await tryCarrierMutation("/api/numbers/assign", {
      number_id: selectedNumber.number_id,
      assigned_to: "voice_lab",
    });
    if (remote?.numbers) {
      setNumbers(remote.numbers);
      return;
    }
    setNumbers((current) =>
      current.map((row) =>
        row.number_id === selectedNumber.number_id
          ? { ...row, assignment_state: "assigned", assigned_to: "voice_lab" }
          : row,
      ),
    );
  }

  async function releaseNumber() {
    const remote = await tryCarrierMutation("/api/numbers/release", {
      number_id: selectedNumber.number_id,
    });
    if (remote?.numbers) {
      setNumbers(remote.numbers);
      return;
    }
    setNumbers((current) =>
      current.map((row) =>
        row.number_id === selectedNumber.number_id
          ? { ...row, assignment_state: "available", assigned_to: "" }
          : row,
      ),
    );
  }

  async function simulateCall() {
    const remote = await tryCarrierMutation("/api/calls/simulate", {
      number_id: selectedNumber.number_id,
      scenario_id: selectedScenario.scenario_id,
      direction: selectedScenario.direction,
    });
    if (remote?.call) {
      setCalls((current) => [remote.call, ...current]);
      setAppState((current) => ({ ...current, selectedCallId: remote.call.call_id }));
      return;
    }
    const call = buildLocalCall(nextCallId(calls), selectedScenario, selectedNumber.number_id);
    setCalls((current) => [call, ...current]);
    setAppState((current) => ({ ...current, selectedCallId: call.call_id }));
  }

  async function advanceCall() {
    if (!selectedCall) {
      return;
    }
    const remote = await tryCarrierMutation(`/api/calls/${selectedCall.call_id}/advance`, {});
    if (remote?.call) {
      setCalls((current) =>
        current.map((row) => (row.call_id === remote.call.call_id ? remote.call : row)),
      );
      return;
    }
    const next = nextAdvanceState(selectedCall);
    setCalls((current) => current.map((row) => (row.call_id === next.call_id ? next : row)));
  }

  async function retryWebhook() {
    if (!selectedCall) {
      return;
    }
    const remote = await tryCarrierMutation(`/api/calls/${selectedCall.call_id}/retry-webhook`, {});
    if (remote?.call) {
      setCalls((current) =>
        current.map((row) => (row.call_id === remote.call.call_id ? remote.call : row)),
      );
      return;
    }
    const next = nextRetryState(selectedCall);
    setCalls((current) => current.map((row) => (row.call_id === next.call_id ? next : row)));
  }

  function updateActualInput(
    key: keyof AppState["actualInputs"],
    value: string,
  ) {
    setAppState((current) => ({
      ...current,
      actualInputs: {
        ...current.actualInputs,
        [key]: value,
      },
    }));
  }

  const actualSubmitDisabled =
    telephonyLabPack.phase0_verdict === "withheld" ||
    appState.actualInputs.allowMutation !== "true" ||
    appState.actualInputs.allowSpend !== "true" ||
    !appState.actualInputs.namedApprover.trim() ||
    !appState.actualInputs.callbackBaseUrl.trim() ||
    !appState.actualInputs.spendCapGbp.trim();

  const activeCalls = calls.filter((row) => !["closed"].includes(row.status)).length;
  const assignedNumbers = numbers.filter((row) => row.assignment_state === "assigned").length;
  const webhookAlerts = calls.filter((row) =>
    ["signature_failed", "fallback_recovered"].includes(row.webhook_state),
  ).length;
  const reducedMotionLabel = appState.reducedMotion ? "Reduced motion on" : "Reduced motion off";

  return (
    <main className="voice-shell" data-testid="telephony-shell">
      <header className="posture-banner">
        <section className="panel brand-panel">
          <div className="brand-row">
            <VecellLogoLockup aria-hidden="true" className="wordmark" />
            <div className="brand-copy">
              <div className="ribbon-row">
                <span className="mock-ribbon">telephony lab test mode</span>
                <span className="mono-chip">{publicCopy(telephonyLabPack.visual_mode)}</span>
              </div>
              <div>
                <h1>Voice Fabric Lab</h1>
                <p className="subhead">
                  High-fidelity telephony rehearsal for IVR, recording, urgent-live preemption, and SMS continuation.
                </p>
              </div>
            </div>
          </div>
          <div className="metric-grid">
            <article className="metric-card">
              <strong>{activeCalls}</strong>
              <span>Active calls</span>
            </article>
            <article className="metric-card">
              <strong>{assignedNumbers}</strong>
              <span>Assigned numbers</span>
            </article>
            <article className="metric-card">
              <strong>{webhookAlerts}</strong>
              <span>Webhook alerts</span>
            </article>
            <article className="metric-card">
              <strong>{serviceStatus}</strong>
              <span>Carrier status</span>
            </article>
          </div>
        </section>

        <aside className="panel guard-panel">
          <div className="panel-header">
            <div>
              <h2>Mode and status</h2>
              <p className="subhead">Current real-provider status stays blocked while the foundation gate is withheld.</p>
            </div>
            <span className="status-chip" data-testid="reduced-motion-indicator">{reducedMotionLabel}</span>
          </div>
          <div className="mode-toggle" role="tablist" aria-label="mode switch">
            <button
              className={`page-tab ${appState.mode === "mock" ? "active" : ""}`}
              data-testid="mode-toggle-mock"
              onClick={() => setAppState((current) => ({ ...current, mode: "mock" }))}
              type="button"
            >
              Mock mode
            </button>
            <button
              className={`page-tab ${appState.mode === "actual" ? "active" : ""}`}
              data-testid="mode-toggle-actual"
              onClick={() => setAppState((current) => ({ ...current, mode: "actual", page: "Live_Gates_and_Spend_Controls" }))}
              type="button"
            >
              Actual-later
            </button>
          </div>
          <div className="legend-row">
            <span className="tone-chip tone-success">call settled</span>
            <span className="tone-chip tone-review">continuation or review</span>
            <span className="tone-chip tone-caution">retry or disorder</span>
            <span className="tone-chip tone-blocked">blocked</span>
          </div>
        </aside>
      </header>

      <section className="workspace-grid">
        <aside className="panel panel-stack" data-testid="number-rail">
          <div className="panel-header">
            <div>
              <h2>Number inventory</h2>
              <p className="subhead">Voice and SMS capabilities stay explicit per number.</p>
            </div>
            <span className="mono-chip">{numbers.length} rows</span>
          </div>
          <div className="number-list">
            {numbers.map((row) => (
              <button
                key={row.number_id}
                className={`number-button ${row.number_id === selectedNumber.number_id ? "active" : ""}`}
                data-testid={`number-button-${row.number_id}`}
                onClick={() => setAppState((current) => ({ ...current, selectedNumberId: row.number_id }))}
                type="button"
              >
                <strong>{numberProfileLabel(row)}</strong>
                <small className="number-meta">{publicRefLabel(row.e164_or_placeholder)}</small>
                <div className="number-capability-row">
                  <span className="mono-chip">{publicRefLabel(row.environment)}</span>
                  <span className="mono-chip">{publicRefLabel(row.direction)}</span>
                  <span className={`tone-chip ${row.voice_enabled === "yes" ? "tone-success" : "tone-blocked"}`}>
                    voice {row.voice_enabled === "yes" ? "enabled" : "off"}
                  </span>
                  <span className={`tone-chip ${row.sms_enabled === "yes" ? "tone-review" : "tone-blocked"}`}>
                    sms {row.sms_enabled === "yes" ? "enabled" : "off"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="center-column">
          <nav className="page-tabs">
            {PAGE_ORDER.map((page) => (
              <button
                key={page}
                className={`page-tab ${appState.page === page ? "active" : ""}`}
                data-testid={`page-tab-${page}`}
                onClick={() => setAppState((current) => ({ ...current, page }))}
                role="tab"
                type="button"
              >
                {page.replace(/_/g, " ")}
              </button>
            ))}
          </nav>

          <section className="panel panel-stack" data-testid="flow-editor">
            <div className="panel-header">
              <div>
              <h2>{appState.page.replace(/_/g, " ")}</h2>
                <p className="subhead">{publicCopy(selectedNumber.notes)}</p>
              </div>
                  <span className="mono-chip">{publicRefLabel(selectedNumber.webhook_profile_ref)}</span>
            </div>

            {appState.page === "Number_Inventory" && (
              <>
                <div className="button-row">
                  <button className="secondary-button" data-testid="assign-number-button" onClick={assignNumber} type="button">
                    Assign number
                  </button>
                  <button className="ghost-button" data-testid="release-number-button" onClick={releaseNumber} type="button">
                    Release number
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Profile</th>
                        <th>Value</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>IVR</td>
                        <td>{publicRefLabel(selectedNumber.ivr_profile_ref)}</td>
                        <td>Menu and DTMF choreography stay bound to the number profile.</td>
                      </tr>
                      <tr>
                        <td>Recording</td>
                        <td>{recordingPolicyLabel(selectedNumber.recording_policy_ref)}</td>
                        <td>Recording remains weaker than evidence readiness.</td>
                      </tr>
                      <tr>
                        <td>Webhook</td>
                        <td>{publicRefLabel(selectedNumber.webhook_profile_ref)}</td>
                        <td>Transport callbacks always land on internal endpoints first.</td>
                      </tr>
                      <tr>
                        <td>Urgent preemption</td>
                        <td>{publicRefLabel(selectedNumber.urgent_preemption_mode)}</td>
                        <td>The number carries the urgent-live rules, not just routing metadata.</td>
                      </tr>
                      <tr>
                        <td>Assignment</td>
                        <td>{publicRefLabel(selectedNumber.assignment_state)}</td>
                        <td>{selectedNumber.assigned_to ? publicRefLabel(selectedNumber.assigned_to) : "Unassigned in the local lab."}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {appState.page === "IVR_Flow_Studio" && (
              <>
                <div className="inline-grid">
                  <label>
                    Scenario
                    <select
                      data-testid="scenario-select"
                      value={appState.selectedScenarioId}
                      onChange={(event) =>
                        setAppState((current) => ({ ...current, selectedScenarioId: event.target.value }))
                      }
                    >
                      {telephonyLabPack.call_scenarios.map((row) => (
                        <option key={row.scenario_id} value={row.scenario_id}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Carrier base URL
                    <input
                      data-testid="carrier-base-url"
                      value={appState.serviceBaseUrl}
                      onChange={(event) =>
                        setAppState((current) => ({ ...current, serviceBaseUrl: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <div className="button-row">
                  <button className="primary-button" data-testid="simulate-call-button" onClick={simulateCall} type="button">
                    Simulate call
                  </button>
                  <button className="secondary-button" data-testid="advance-call-button" onClick={advanceCall} disabled={!selectedCall?.can_advance} type="button">
                    Advance lifecycle
                  </button>
                  <button className="ghost-button" data-testid="retry-webhook-button" onClick={retryWebhook} disabled={!selectedCall?.can_retry_webhook} type="button">
                    Retry webhook
                  </button>
                </div>
                <article className="flow-card">
                  <div className="panel-header">
                    <div>
                      <h3>{selectedScenario.label}</h3>
                      <p className="subhead">{publicCopy(selectedScenario.summary)}</p>
                    </div>
                    <span className={`tone-chip ${eventTone(selectedScenario.terminal_state)}`}>
                      {publicRefLabel(selectedScenario.terminal_state)}
                    </span>
                  </div>
                  <div className="flow-track" style={{ marginTop: 16 }}>
                    {selectedScenario.state_path.map((state, index) => (
                      <div key={state} className="flow-track">
                        <span className={`flow-node ${eventTone(state)}`}>{publicRefLabel(state)}</span>
                        {index < selectedScenario.state_path.length - 1 ? (
                          <span className="flow-arrow">-&gt;</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              </>
            )}

            {appState.page === "Webhook_and_Signature_Map" && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Webhook</th>
                      <th>Vendor</th>
                      <th>Signature</th>
                      <th>Replay guard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telephonyLabPack.webhook_matrix.map((row) => (
                      <tr key={row.webhook_row_id}>
                        <td>{publicRefLabel(row.endpoint_kind)}</td>
                        <td>{row.provider_vendor}</td>
                        <td>{publicRefLabel(row.signature_scheme)}</td>
                        <td>{publicRefLabel(row.replay_guard)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {appState.page === "Recording_and_Continuation" && (
              <div className="flow-grid">
                <article className="fact-card">
                  <strong>Recording state</strong>
                  <p>{selectedCall ? publicRefLabel(selectedCall.recording_state) : "n/a"}</p>
                  <small>Recording availability must never be mistaken for evidence readiness.</small>
                </article>
                <article className="fact-card">
                  <strong>Transcript state</strong>
                  <p>{selectedCall ? publicRefLabel(selectedCall.transcript_state) : "n/a"}</p>
                  <small>Transcript remains supporting context, not the source record.</small>
                </article>
                <article className="fact-card">
                  <strong>Continuation state</strong>
                  <p>{selectedCall ? publicRefLabel(selectedCall.continuation_state) : "n/a"}</p>
                  <small>Continuation may be eligible or sent without routine submit being safe.</small>
                </article>
                <article className="fact-card">
                  <strong>Urgent state</strong>
                  <p>{selectedCall ? publicRefLabel(selectedCall.urgent_state) : "n/a"}</p>
                  <small>Urgent-live status stays independent from routine promotion readiness.</small>
                </article>
              </div>
            )}

            {appState.page === "Live_Gates_and_Spend_Controls" && (
              <div className="form-stack">
                <div className="inline-grid">
                  <label>
                    Approved vendor
                    <select
                      data-testid="actual-field-telephony-vendor-id"
                      value={appState.actualInputs.telephonyVendorId}
                      onChange={(event) => updateActualInput("telephonyVendorId", event.target.value)}
                    >
                      {telephonyLabPack.shortlisted_vendors.map((row) => (
                        <option key={row.vendor_id} value={row.vendor_id}>
                          {row.vendor_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Named approver
                    <input
                      data-testid="actual-field-named-approver"
                      value={appState.actualInputs.namedApprover}
                      onChange={(event) => updateActualInput("namedApprover", event.target.value)}
                    />
                  </label>
                  <label>
                    Target environment
                    <select
                      data-testid="actual-field-target-environment"
                      value={appState.actualInputs.targetEnvironment}
                      onChange={(event) => updateActualInput("targetEnvironment", event.target.value)}
                    >
                      <option value="provider_like_preprod">provider-like pre-production</option>
                      <option value="production">production</option>
                    </select>
                  </label>
                  <label>
                    Callback base URL
                    <input
                      data-testid="actual-field-callback-base-url"
                      value={appState.actualInputs.callbackBaseUrl}
                      onChange={(event) => updateActualInput("callbackBaseUrl", event.target.value)}
                    />
                  </label>
                  <label>
                    Recording policy
                    <select
                      data-testid="actual-field-recording-policy-ref"
                      value={appState.actualInputs.recordingPolicyRef}
                      onChange={(event) => updateActualInput("recordingPolicyRef", event.target.value)}
                    >
                      {telephonyLabPack.recording_policies.map((row) => (
                        <option key={row.recording_policy_ref} value={row.recording_policy_ref}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Number profile
                    <select
                      data-testid="actual-field-number-profile-ref"
                      value={appState.actualInputs.numberProfileRef}
                      onChange={(event) => updateActualInput("numberProfileRef", event.target.value)}
                    >
                      {telephonyLabPack.number_inventory.map((row) => (
                        <option key={row.number_id} value={row.number_id}>
                          {numberProfileLabel(row)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Spend cap GBP
                    <input
                      data-testid="actual-field-spend-cap-gbp"
                      value={appState.actualInputs.spendCapGbp}
                      onChange={(event) => updateActualInput("spendCapGbp", event.target.value)}
                    />
                  </label>
                  <label>
                    Webhook secret handle
                    <input
                      data-testid="actual-field-webhook-secret-ref"
                      value={appState.actualInputs.webhookSecretRef}
                      onChange={(event) => updateActualInput("webhookSecretRef", event.target.value)}
                    />
                  </label>
                  <label>
                    Allow real mutation
                    <select
                      data-testid="actual-field-allow-mutation"
                      value={appState.actualInputs.allowMutation}
                      onChange={(event) => updateActualInput("allowMutation", event.target.value)}
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                  <label>
                    Allow spend
                    <select
                      data-testid="actual-field-allow-spend"
                      value={appState.actualInputs.allowSpend}
                      onChange={(event) => updateActualInput("allowSpend", event.target.value)}
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                </div>
                <button className="primary-button" data-testid="actual-submit-button" disabled={actualSubmitDisabled} type="button">
                  Real account or number creation blocked
                </button>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Gate</th>
                        <th>Status</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telephonyLabPack.live_gate_pack.live_gates.map((row) => (
                        <tr key={row.gate_id}>
                          <td>{publicRefLabel(row.gate_id)}</td>
                          <td>{publicRefLabel(row.status)}</td>
                          <td>{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="panel panel-stack" data-testid="event-stream">
            <div className="panel-header">
              <div>
                <h2>Event stream</h2>
                <p className="subhead">One canonical call timeline, even when provider callbacks arrive out of order.</p>
              </div>
              <span className="mono-chip">{selectedCall ? publicRefLabel(selectedCall.call_id) : "No call"}</span>
            </div>
            <div className="call-list">
              {calls.map((row) => (
                <button
                  key={row.call_id}
                  className={`number-button ${selectedCall?.call_id === row.call_id ? "active" : ""}`}
                  data-testid={`call-card-${row.call_id}`}
                  onClick={() => setAppState((current) => ({ ...current, selectedCallId: row.call_id }))}
                  type="button"
                >
                  <strong>{publicRefLabel(row.call_id)}</strong>
                  <small>{publicCopy(row.summary)}</small>
                  <div className="number-capability-row">
                    <span className="mono-chip">{publicRefLabel(row.status)}</span>
                    <span className={`tone-chip ${eventTone(row.webhook_state)}`}>{publicRefLabel(row.webhook_state)}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="event-list">
              {(selectedCall?.events ?? []).map((event) => (
                <article key={event.event_id} className="event-card">
                  <div className="call-card-header">
                    <strong>{event.label}</strong>
                    <span className={`tone-chip ${eventTone(event.state)}`}>{publicRefLabel(event.state)}</span>
                  </div>
                  <p>{publicCopy(event.detail)}</p>
                  <small className="muted">{event.at}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel diagram-strip">
            <div className="panel-header">
              <div>
                <h2>Continuity line</h2>
                <p className="subhead">The lower strip keeps the same request-history verified details visible.</p>
              </div>
            </div>
            <div className="diagram-line" data-testid="lower-diagram">
              {["inbound_call", "ivr", "verification", "recording", "transcript_hook", "continuation_or_triage"].map((label, index, array) => (
                <div key={label} className="flow-track">
                  <span className="diagram-node">{publicRefLabel(label)}</span>
                  {index < array.length - 1 ? <span className="flow-arrow">-&gt;</span> : null}
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="panel panel-stack" data-testid="inspector-panel">
          <div className="panel-header">
            <div>
              <h2>Inspector</h2>
              <p className="subhead">Recording, continuation, and security status for the current selection.</p>
            </div>
            <span className="mono-chip">{numberProfileLabel(selectedNumber)}</span>
          </div>
          <article className="fact-card">
            <strong>Webhook profile</strong>
            <p>{publicRefLabel(selectedNumber.webhook_profile_ref)}</p>
            <small>{publicCopy(selectedNumber.notes)}</small>
          </article>
          <article className="fact-card">
            <strong>Recording policy</strong>
            <p>{recordingPolicyLabel(selectedNumber.recording_policy_ref)}</p>
            <small>{publicCopy(selectedRecordingPolicy?.notes)}</small>
          </article>
          <article className="fact-card">
            <strong>Continuation and urgent status</strong>
            <p>{publicRefLabel(selectedNumber.urgent_preemption_mode)}</p>
            <small>Continuation remains limited and separate from routine submission.</small>
          </article>
          <article className="fact-card">
            <strong>Current call states</strong>
            <p>recording {selectedCall ? publicRefLabel(selectedCall.recording_state) : "n/a"}</p>
            <p>transcript {selectedCall ? publicRefLabel(selectedCall.transcript_state) : "n/a"}</p>
            <p>continuation {selectedCall ? publicRefLabel(selectedCall.continuation_state) : "n/a"}</p>
            <p>webhook {selectedCall ? publicRefLabel(selectedCall.webhook_state) : "n/a"}</p>
          </article>
          <article className="fact-card">
            <strong>Selected risks</strong>
            <div className="fact-list">
              {telephonyLabPack.selected_risks.map((row) => (
                <div key={row.risk_id}>
                  <div className="call-card-header">
                    <span className="mono-chip">{publicRefLabel(row.risk_id)}</span>
                    <span className={`tone-chip ${row.severity === "high" ? "tone-blocked" : "tone-caution"}`}>{publicRefLabel(row.severity)}</span>
                  </div>
                  <small>{row.trigger_summary}</small>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}

export default App;
