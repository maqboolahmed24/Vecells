import { useEffect, useState } from "react";

import { meshExecutionPack } from "./generated/meshExecutionPack";

type Pack = typeof meshExecutionPack;
type Mailbox = Pack["mailboxes"][number];
type WorkflowRow = Pack["workflow_rows"][number];
type RouteRow = Pack["route_rows"][number];
type FieldRow = Pack["field_map"]["fields"][number];
type LiveGateRow = Pack["live_gate_pack"]["live_gates"][number];
type RiskRow = Pack["selected_risks"][number];
type TouchpointRow = Pack["selected_touchpoints"][number];

type Mode = "mock" | "actual";
type Page =
  | "Mailroom_Overview"
  | "Workflow_Registry"
  | "Message_Envelope_Timeline"
  | "Proof_and_Replay_Inspector"
  | "Mailbox_Application_Pack";

type ValidationState = {
  ok: boolean;
  reason: string;
};

type MessageRecord = {
  message_id: string;
  message_ref: string;
  workflow_id: string;
  from_mailbox_key: string;
  to_mailbox_key: string;
  scenario_id: string;
  status: string;
  authoritative_truth_state: string;
  proof_state: string;
  attachment_state: string;
  created_at: string;
  summary: string;
  can_advance: boolean;
  can_replay: boolean;
  events: Array<{
    event_id: string;
    state: string;
    label: string;
    tone: string;
    detail: string;
    at: string;
  }>;
};

type AppState = {
  mode: Mode;
  page: Page;
  selectedMailboxKey: string;
  selectedWorkflowId: string;
  selectedScenarioId: string;
  selectedDestinationKey: string;
  selectedMessageId: string;
  serviceBaseUrl: string;
  actualInputs: {
    namedApprover: string;
    environmentTarget: string;
    ownerOds: string;
    managerMode: string;
    workflowContact: string;
    allowMutation: string;
    allowSpend: string;
  };
  reducedMotion: boolean;
};

const STORAGE_KEY = "signal-post-room-state";
const PAGE_ORDER: readonly Page[] = [
  "Mailroom_Overview",
  "Workflow_Registry",
  "Message_Envelope_Timeline",
  "Proof_and_Replay_Inspector",
  "Mailbox_Application_Pack",
];

function seedStatesForScenario(scenarioId: string): string[] {
  const mapping: Record<string, string[]> = {
    happy_path: ["compose", "submit", "accepted", "picked_up", "proof_pending", "settled_or_recovered"],
    delayed_ack: ["compose", "submit", "accepted", "picked_up", "proof_pending"],
    duplicate_delivery: [
      "compose",
      "submit",
      "accepted",
      "picked_up",
      "proof_pending",
      "duplicate_delivery",
      "recovery_required",
    ],
    expired_pickup: ["compose", "submit", "accepted", "expired"],
    quarantine_attachment: ["compose", "submit", "accepted", "picked_up", "proof_pending", "quarantined"],
    replay_guard: ["compose", "submit", "accepted", "picked_up", "proof_pending", "replay_blocked"],
  };
  return mapping[scenarioId] ?? mapping.happy_path;
}

function buildSeedEvents(message: any) {
  return seedStatesForScenario(message.scenario_id).map((state, index) => ({
    event_id: `${message.message_id}-${index + 1}`,
    state,
    label: state.replace(/_/g, " "),
    tone:
      state === "settled_or_recovered"
        ? "success"
        : state === "accepted" || state === "picked_up"
          ? "delivery"
          : state === "proof_pending"
            ? "review"
            : state === "quarantined" || state === "expired" || state === "replay_blocked"
              ? "blocked"
              : state === "duplicate_delivery" || state === "recovery_required"
                ? "caution"
                : "muted",
    detail: message.summary,
    at: message.created_at,
  }));
}

function normalizeMessage(message: any): MessageRecord {
  return {
    ...message,
    can_advance: message.can_advance ?? false,
    can_replay: message.can_replay ?? true,
    events: Array.isArray(message.events) ? message.events : buildSeedEvents(message),
  };
}

const seededMessages = meshExecutionPack.mock_service.seeded_messages.map(normalizeMessage);

function mailboxByKey(mailboxKey: string): Mailbox {
  return meshExecutionPack.mailboxes.find((row) => row.mailbox_key === mailboxKey)!;
}

function workflowById(workflowId: string): WorkflowRow {
  return meshExecutionPack.workflow_rows.find((row) => row.workflow_id === workflowId)!;
}

function routeForWorkflow(workflowId: string): RouteRow | null {
  return meshExecutionPack.route_rows.find((row) => row.preferred_workflow_id === workflowId) ?? null;
}

function workflowKeys(mailbox: Mailbox): string[] {
  return mailbox.workflow_keys
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function relevantRoutes(mailboxKey: string): readonly RouteRow[] {
  return meshExecutionPack.route_rows.filter((row) => row.mailbox_keys.includes(mailboxKey));
}

function defaultDestination(mailboxKey: string): string {
  const route = relevantRoutes(mailboxKey)[0];
  if (route) {
    const right = route.mailbox_keys.split("->")[1]?.trim();
    const duplex = route.mailbox_keys.split("<->")[1]?.trim();
    const match = right || duplex;
    if (match) {
      return meshExecutionPack.mailboxes.find((row) => row.mailbox_key === match)?.mailbox_key ?? mailboxKey;
    }
  }
  return meshExecutionPack.mailboxes.find((row) => row.mailbox_key !== mailboxKey)?.mailbox_key ?? mailboxKey;
}

function validationForSelection(mailboxKey: string, workflowId: string): ValidationState {
  const mailbox = mailboxByKey(mailboxKey);
  const allowed = workflowKeys(mailbox);
  const workflow = workflowById(workflowId);
  if (!allowed.includes(workflowId)) {
    return {
      ok: false,
      reason: `${workflowId} is not assigned to ${mailbox.display_name}. Workflow IDs are first-class registry objects, not free-text send values.`,
    };
  }
  return {
    ok: true,
    reason: `${workflowId} is assigned to ${mailbox.display_name}. Transport acceptance remains weaker than ${workflow.proof_required_after_send}.`,
  };
}

function defaultState(): AppState {
  const firstMailbox = meshExecutionPack.mailboxes[0];
  const firstWorkflowId = meshExecutionPack.workflow_rows[0].workflow_id;
  return {
    mode: new URLSearchParams(window.location.search).get("mode") === "actual" ? "actual" : "mock",
    page:
      (new URLSearchParams(window.location.search).get("page") as Page | null) ??
      "Mailroom_Overview",
    selectedMailboxKey: firstMailbox.mailbox_key,
    selectedWorkflowId: firstWorkflowId,
    selectedScenarioId: "delayed_ack",
    selectedDestinationKey: defaultDestination(firstMailbox.mailbox_key),
    selectedMessageId: seededMessages[0].message_id,
    serviceBaseUrl:
      new URLSearchParams(window.location.search).get("meshBaseUrl") ??
      meshExecutionPack.mock_service.base_url_default,
    actualInputs: {
      namedApprover: "",
      environmentTarget: "",
      ownerOds: firstMailbox.owner_ods,
      managerMode: firstMailbox.manager_mode,
      workflowContact: "",
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
      mode: base.mode,
      page: base.page,
      actualInputs: { ...base.actualInputs, ...(parsed.actualInputs ?? {}) },
    };
  } catch {
    return base;
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }
  return payload as T;
}

function gateTone(status: LiveGateRow["status"]): string {
  if (status === "pass") {
    return "success";
  }
  if (status === "review_required") {
    return "review";
  }
  return "blocked";
}

function eventTone(state: string): string {
  if (state === "settled_or_recovered") {
    return "success";
  }
  if (state === "accepted" || state === "picked_up") {
    return "delivery";
  }
  if (state === "proof_pending") {
    return "review";
  }
  if (state === "quarantined" || state === "expired" || state === "replay_blocked") {
    return "blocked";
  }
  if (state === "duplicate_delivery" || state === "recovery_required") {
    return "caution";
  }
  return "muted";
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [messages, setMessages] = useState<MessageRecord[]>(seededMessages);
  const [serviceHealthy, setServiceHealthy] = useState(true);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [healthSummary, setHealthSummary] = useState<{
    message_count: number;
    degraded_message_count: number;
    workflow_count: number;
  }>({
    message_count: seededMessages.length,
    degraded_message_count: seededMessages.filter((row) =>
      ["proof_pending", "expired", "quarantined", "replay_blocked", "recovery_required"].includes(
        row.status,
      ),
    ).length,
    workflow_count: meshExecutionPack.workflow_rows.length,
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setState((current) => ({ ...current, reducedMotion: media.matches }));
    };
    update();
    media.addEventListener?.("change", update);
    return () => {
      media.removeEventListener?.("change", update);
    };
  }, []);

  useEffect(() => {
    refreshHealth();
    refreshMessages();
  }, [state.serviceBaseUrl]);

  async function refreshHealth() {
    try {
      const payload = await fetchJson<{
        message_count: number;
        degraded_message_count: number;
        workflow_count: number;
      }>(`${state.serviceBaseUrl}/api/health`);
      setServiceHealthy(true);
      setHealthSummary(payload);
    } catch {
      setServiceHealthy(false);
    }
  }

  async function refreshMessages() {
    try {
      const payload = await fetchJson<{ messages: MessageRecord[] }>(
        `${state.serviceBaseUrl}/api/messages`,
      );
      setMessages(payload.messages.map(normalizeMessage));
      setServiceHealthy(true);
      if (!payload.messages.find((row) => row.message_id === state.selectedMessageId)) {
        setState((current) => ({
          ...current,
          selectedMessageId: payload.messages[0]?.message_id ?? current.selectedMessageId,
        }));
      }
    } catch {
      setMessages(seededMessages);
      setServiceHealthy(false);
    }
  }

  const selectedMailbox = mailboxByKey(state.selectedMailboxKey);
  const selectedWorkflow = workflowById(state.selectedWorkflowId);
  const validation = validationForSelection(state.selectedMailboxKey, state.selectedWorkflowId);
  const selectedMessage =
    messages.find((row) => row.message_id === state.selectedMessageId) ?? messages[0] ?? null;
  const selectedRoute = routeForWorkflow(selectedMessage?.workflow_id ?? state.selectedWorkflowId);
  const selectedRisks = meshExecutionPack.selected_risks as readonly RiskRow[];
  const selectedTouchpoints = meshExecutionPack.selected_touchpoints as readonly TouchpointRow[];
  const liveGates = meshExecutionPack.live_gate_pack.live_gates as readonly LiveGateRow[];
  const fieldSections = meshExecutionPack.field_map.sections;
  const submitDisabled =
    meshExecutionPack.live_gate_pack.summary.current_submission_posture === "blocked" ||
    state.actualInputs.allowMutation !== "true" ||
    state.actualInputs.allowSpend !== "true";

  function setMailbox(mailboxKey: string) {
    const nextDestination = defaultDestination(mailboxKey);
    const nextWorkflow = workflowKeys(mailboxByKey(mailboxKey))[0] ?? meshExecutionPack.workflow_rows[0].workflow_id;
    setState((current) => ({
      ...current,
      selectedMailboxKey: mailboxKey,
      selectedDestinationKey: nextDestination,
      selectedWorkflowId: nextWorkflow,
      actualInputs: {
        ...current.actualInputs,
        ownerOds: mailboxByKey(mailboxKey).owner_ods,
        managerMode: mailboxByKey(mailboxKey).manager_mode,
      },
    }));
  }

  async function sendMessage() {
    setApiNotice(null);
    try {
      const result = await fetchJson<{ payload: MessageRecord }>(`${state.serviceBaseUrl}/api/dispatch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          from_mailbox_key: state.selectedMailboxKey,
          to_mailbox_key: state.selectedDestinationKey,
          workflow_id: state.selectedWorkflowId,
          scenario_id: state.selectedScenarioId,
          mode: state.mode,
          summary: selectedWorkflow.business_flow_summary,
        }),
      });
      setState((current) => ({
        ...current,
        selectedMessageId: result.payload.message_id,
        page: "Message_Envelope_Timeline",
      }));
      await refreshMessages();
      await refreshHealth();
    } catch (error) {
      setApiNotice(error instanceof Error ? error.message : "Dispatch failed.");
    }
  }

  async function advanceSelectedMessage() {
    if (!selectedMessage) {
      return;
    }
    setApiNotice(null);
    try {
      const result = await fetchJson<{ payload: MessageRecord }>(
        `${state.serviceBaseUrl}/api/messages/${selectedMessage.message_id}/advance`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        },
      );
      setState((current) => ({ ...current, selectedMessageId: result.payload.message_id }));
      await refreshMessages();
      await refreshHealth();
    } catch (error) {
      setApiNotice(error instanceof Error ? error.message : "Advance failed.");
    }
  }

  async function applyReplayGuard() {
    if (!selectedMessage) {
      return;
    }
    setApiNotice(null);
    try {
      const result = await fetchJson<{ payload: MessageRecord }>(
        `${state.serviceBaseUrl}/api/messages/${selectedMessage.message_id}/replay`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        },
      );
      setState((current) => ({
        ...current,
        selectedMessageId: result.payload.message_id,
        page: "Proof_and_Replay_Inspector",
      }));
      await refreshMessages();
      await refreshHealth();
    } catch (error) {
      setApiNotice(error instanceof Error ? error.message : "Replay guard failed.");
    }
  }

  function renderOverview() {
    return (
      <div className="panel-stack">
        <section className="panel surface-panel">
          <div className="panel-header">
            <div>
              <h2>Mailroom overview</h2>
              <p>Transport acceptance is visible immediately, but authoritative downstream proof is a separate contract.</p>
            </div>
            <div className="chip-row">
              <span className={`status-chip ${validation.ok ? "success" : "blocked"}`}>
                {validation.ok ? "Workflow valid" : "Workflow invalid"}
              </span>
              <span className={`status-chip ${serviceHealthy ? "success" : "review"}`}>
                {serviceHealthy ? "Service live" : "Seeded fallback"}
              </span>
            </div>
          </div>

          <div className="metric-grid">
            <article className="metric-card">
              <span className="eyebrow">Mailboxes</span>
              <strong>{meshExecutionPack.summary.mailbox_count}</strong>
              <p>Owner ODS and manager posture stay explicit.</p>
            </article>
            <article className="metric-card">
              <span className="eyebrow">Messages</span>
              <strong>{healthSummary.message_count}</strong>
              <p>Seeded and live-run messages share the same proof law.</p>
            </article>
            <article className="metric-card">
              <span className="eyebrow">Degraded alerts</span>
              <strong>{healthSummary.degraded_message_count}</strong>
              <p>Duplicate, replay, expiry, and quarantine never collapse into one error.</p>
            </article>
            <article className="metric-card">
              <span className="eyebrow">Workflow health</span>
              <strong>{healthSummary.workflow_count}</strong>
              <p>Every workflow row is traceable to a bounded-context need.</p>
            </article>
          </div>
        </section>
        {renderComposePanel()}
        {renderMessageList()}
      </div>
    );
  }

  function renderWorkflowRegistry() {
    return (
      <div className="panel-stack">
        <section className="panel surface-panel">
          <div className="panel-header">
            <div>
              <h2>Workflow registry</h2>
              <p>Candidate workflow IDs are requestable control-plane objects, not side labels.</p>
            </div>
            <div className="chip-row">
              <span className="mono-chip">{selectedWorkflow.workflow_id}</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="registry-table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Role</th>
                  <th>Direction</th>
                  <th>Proof after send</th>
                  <th>Approval posture</th>
                </tr>
              </thead>
              <tbody>
                {meshExecutionPack.workflow_rows.map((row) => (
                  <tr
                    key={row.workflow_id}
                    data-testid={`workflow-row-${row.workflow_id}`}
                    className={row.workflow_id === state.selectedWorkflowId ? "selected-row" : ""}
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        selectedWorkflowId: row.workflow_id,
                        page: "Workflow_Registry",
                      }))
                    }
                    tabIndex={0}
                  >
                    <td>
                      <strong>{row.workflow_id}</strong>
                      <div className="muted-copy">{row.message_family}</div>
                    </td>
                    <td>{row.workflow_role}</td>
                    <td>{row.mailbox_direction}</td>
                    <td>{row.proof_required_after_send}</td>
                    <td>{row.approval_posture}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel detail-panel">
          <h3>Registry detail</h3>
          <p>{selectedWorkflow.business_flow_summary}</p>
          <div className="fact-list">
            <div>
              <span className="eyebrow">Acceptance vs truth</span>
              <p>{selectedWorkflow.acceptance_vs_authoritative_truth_note}</p>
            </div>
            <div>
              <span className="eyebrow">Fallback</span>
              <p>{selectedWorkflow.fallback_if_missing}</p>
            </div>
            <div>
              <span className="eyebrow">Validation</span>
              <p data-testid="workflow-validation-message">{validation.reason}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  function renderTimelinePage() {
    return (
      <div className="panel-stack">
        {renderComposePanel()}
        <section className="panel surface-panel" data-testid="timeline-workbench">
          <div className="panel-header">
            <div>
              <h2>Message envelope timeline</h2>
              <p>The selected message timeline keeps transport, proof, and recovery states separate.</p>
            </div>
            <div className="button-row">
              <button
                className="ghost-button"
                onClick={advanceSelectedMessage}
                disabled={!selectedMessage?.can_advance}
                data-testid="advance-lifecycle-button"
              >
                Advance lifecycle
              </button>
              <button className="ghost-button" onClick={applyReplayGuard} disabled={!selectedMessage}>
                Apply replay guard
              </button>
            </div>
          </div>
          {renderSelectedTimeline()}
        </section>
      </div>
    );
  }

  function renderProofPage() {
    return (
      <div className="panel-stack">
        <section className="panel surface-panel">
          <div className="panel-header">
            <div>
              <h2>Proof and replay inspector</h2>
              <p>Replay resistance, quarantine, and proof debt remain explicit operational states.</p>
            </div>
            <span className={`status-chip ${eventTone(selectedMessage?.status ?? "proof_pending")}`}>
              {selectedMessage?.status ?? "No selection"}
            </span>
          </div>
          <div className="inspector-grid">
            <article className="metric-card">
              <span className="eyebrow">Authoritative truth state</span>
              <strong>{selectedMessage?.authoritative_truth_state ?? "n/a"}</strong>
            </article>
            <article className="metric-card">
              <span className="eyebrow">Proof state</span>
              <strong>{selectedMessage?.proof_state ?? "n/a"}</strong>
            </article>
            <article className="metric-card">
              <span className="eyebrow">Attachment state</span>
              <strong>{selectedMessage?.attachment_state ?? "n/a"}</strong>
            </article>
          </div>
          {renderSelectedTimeline()}
        </section>
        <section className="panel detail-panel">
          <h3>Touchpoints and risk debt</h3>
          <div className="fact-list">
            {selectedTouchpoints.map((row) => (
              <article key={row.touchpoint_id} className="fact-card">
                <span className="eyebrow">{row.touchpoint_id}</span>
                <strong>{row.dependency_name}</strong>
                <p>{row.ambiguity_mode}</p>
              </article>
            ))}
          </div>
          <div className="fact-list">
            {selectedRisks.map((row) => (
              <article key={row.risk_id} className="fact-card">
                <span className="eyebrow">{row.risk_id}</span>
                <strong>{row.risk_title}</strong>
                <p>{row.problem_statement}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderApplicationPack() {
    return (
      <div className="panel-stack">
        <section className="panel surface-panel">
          <div className="panel-header">
            <div>
              <h2>Mailbox application pack</h2>
              <p>The real mailbox and workflow-request path is prepared here, but it stays fail-closed.</p>
            </div>
            <span className="mono-chip">Submission posture: {meshExecutionPack.live_gate_pack.summary.current_submission_posture}</span>
          </div>
          <div className="application-grid">
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
                  {liveGates.map((row) => (
                    <tr key={row.gate_id} data-testid={`live-gate-row-${row.gate_id}`}>
                      <td>{row.title}</td>
                      <td>
                        <span className={`status-chip ${gateTone(row.status)}`}>{row.status}</span>
                      </td>
                      <td>{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-stack">
              <div className="field-grid">
                <label className="field">
                  <span>Named approver</span>
                  <input
                    value={state.actualInputs.namedApprover}
                    data-testid="actual-field-named-approver"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        actualInputs: { ...current.actualInputs, namedApprover: event.target.value },
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Environment target</span>
                  <input
                    value={state.actualInputs.environmentTarget}
                    data-testid="actual-field-environment-target"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        actualInputs: { ...current.actualInputs, environmentTarget: event.target.value },
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Mailbox owner ODS</span>
                  <input
                    value={state.actualInputs.ownerOds}
                    data-testid="actual-field-owner-ods"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        actualInputs: { ...current.actualInputs, ownerOds: event.target.value },
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Manager mode</span>
                  <select
                    value={state.actualInputs.managerMode}
                    data-testid="actual-field-manager-mode"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        actualInputs: { ...current.actualInputs, managerMode: event.target.value },
                      }))
                    }
                  >
                    <option value="self_managed">self_managed</option>
                    <option value="third_party_managed">third_party_managed</option>
                  </select>
                </label>
                <label className="field">
                  <span>Workflow team contact</span>
                  <input
                    value={state.actualInputs.workflowContact}
                    data-testid="actual-field-workflow-contact"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        actualInputs: { ...current.actualInputs, workflowContact: event.target.value },
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>ALLOW_REAL_PROVIDER_MUTATION</span>
                  <select
                    value={state.actualInputs.allowMutation}
                    data-testid="actual-field-allow-mutation"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        actualInputs: { ...current.actualInputs, allowMutation: event.target.value },
                      }))
                    }
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                </label>
                <label className="field">
                  <span>ALLOW_SPEND</span>
                  <select
                    value={state.actualInputs.allowSpend}
                    data-testid="actual-field-allow-spend"
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        actualInputs: { ...current.actualInputs, allowSpend: event.target.value },
                      }))
                    }
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                </label>
              </div>
              <button
                className="primary-button"
                data-testid="actual-submit-button"
                disabled={submitDisabled}
                onClick={(event) => event.preventDefault()}
              >
                Prepare real mailbox submission
              </button>
              <p className="muted-copy">
                Submission remains disabled because the current live gate posture is blocked even if the form fields are populated.
              </p>
            </div>
          </div>
        </section>
        <section className="panel detail-panel">
          <h3>Field sections</h3>
          <div className="fact-list">
            {fieldSections.map((section) => {
              const fields = meshExecutionPack.field_map.fields.filter((row) =>
                (section.field_ids as readonly string[]).includes(row.field_id),
              ) as readonly FieldRow[];
              return (
                <article key={section.section_id} className="fact-card">
                  <strong>{section.label}</strong>
                  <p>{fields.length} fields</p>
                  <ul className="field-list">
                    {fields.slice(0, 6).map((row) => (
                      <li key={row.field_id}>
                        <span className="mono-inline">{row.field_id}</span> {row.label}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  function renderComposePanel() {
    return (
      <section className="panel surface-panel">
        <div className="panel-header">
          <div>
            <h2>Envelope workbench</h2>
            <p>Compose against the registry, validate against the selected mailbox, then send through the local MESH twin.</p>
          </div>
          <div className="button-row">
            <button className="ghost-button" onClick={sendMessage} data-testid="send-message-button">
              Dispatch selected scenario
            </button>
            <button className="ghost-button" onClick={advanceSelectedMessage} disabled={!selectedMessage?.can_advance}>
              Advance selected
            </button>
          </div>
        </div>
        <div className="compose-grid">
          <label className="field">
            <span>Source mailbox</span>
            <select value={state.selectedMailboxKey} onChange={(event) => setMailbox(event.target.value)}>
              {meshExecutionPack.mailboxes.map((row) => (
                <option value={row.mailbox_key} key={row.mailbox_key}>
                  {row.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Destination mailbox</span>
            <select
              value={state.selectedDestinationKey}
              onChange={(event) =>
                setState((current) => ({ ...current, selectedDestinationKey: event.target.value }))
              }
            >
              {meshExecutionPack.mailboxes
                .filter((row) => row.mailbox_key !== state.selectedMailboxKey)
                .map((row) => (
                  <option value={row.mailbox_key} key={row.mailbox_key}>
                    {row.display_name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            <span>Workflow ID</span>
            <select
              value={state.selectedWorkflowId}
              onChange={(event) =>
                setState((current) => ({ ...current, selectedWorkflowId: event.target.value }))
              }
              data-testid="workflow-select"
            >
              {meshExecutionPack.workflow_rows.map((row) => (
                <option value={row.workflow_id} key={row.workflow_id}>
                  {row.workflow_id}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Scenario</span>
            <select
              value={state.selectedScenarioId}
              onChange={(event) =>
                setState((current) => ({ ...current, selectedScenarioId: event.target.value }))
              }
              data-testid="scenario-select"
            >
              {meshExecutionPack.mock_service.scenarios.map((row) => (
                <option value={row.scenario_id} key={row.scenario_id}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="validation-banner" data-testid="workflow-validation-banner">
          <span className={`status-chip ${validation.ok ? "success" : "blocked"}`}>
            {validation.ok ? "Allowed on mailbox" : "Rejected by mailbox"}
          </span>
          <p>{validation.reason}</p>
        </div>
        {apiNotice ? <p className="error-copy">{apiNotice}</p> : null}
      </section>
    );
  }

  function renderMessageList() {
    return (
      <section className="panel surface-panel">
        <div className="panel-header">
          <div>
            <h2>Message timeline queue</h2>
            <p>Switch messages to inspect proof, replay, and degraded modes.</p>
          </div>
          <span className="mono-chip">{messages.length} messages</span>
        </div>
        <div className="message-list" data-testid="message-list">
          {messages.map((row) => (
            <button
              key={row.message_id}
              className={`message-card ${row.message_id === state.selectedMessageId ? "selected" : ""}`}
              data-testid={`message-card-${row.message_id}`}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  selectedMessageId: row.message_id,
                  page: "Message_Envelope_Timeline",
                }))
              }
            >
              <div className="message-card-header">
                <strong>{row.message_id}</strong>
                <span className={`status-chip ${eventTone(row.status)}`}>{row.status}</span>
              </div>
              <p>{row.summary}</p>
              <div className="chip-row">
                <span className="mono-chip">{row.workflow_id}</span>
                <span className="mono-chip">{row.proof_state}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  function renderSelectedTimeline() {
    if (!selectedMessage) {
      return <p>No message selected.</p>;
    }
    return (
      <div className="timeline-stack">
        <div className="chip-row">
          <span className="mono-chip">{selectedMessage.message_id}</span>
          <span className="mono-chip">{selectedMessage.workflow_id}</span>
          <span className={`status-chip ${eventTone(selectedMessage.status)}`}>{selectedMessage.status}</span>
        </div>
        <div className="event-list" data-testid="event-list">
          {selectedMessage.events.map((event) => (
            <article key={event.event_id} className={`event-card tone-${event.tone}`}>
              <div className="message-card-header">
                <strong>{event.label}</strong>
                <span className="mono-inline">{event.at}</span>
              </div>
              <p>{event.detail}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  function renderInspector() {
    return (
      <aside className="panel inspector-panel" data-testid="proof-inspector">
        <div className="panel-header">
          <div>
            <h2>Proof inspector</h2>
            <p>Selected workflow and message debt.</p>
          </div>
          <span className="mono-chip">{selectedWorkflow.workflow_id}</span>
        </div>
        <div className="fact-list">
          <article className="fact-card">
            <span className="eyebrow">Acceptance versus truth</span>
            <p>{selectedWorkflow.acceptance_vs_authoritative_truth_note}</p>
          </article>
          <article className="fact-card">
            <span className="eyebrow">Required proof after send</span>
            <p>{selectedWorkflow.proof_required_after_send}</p>
          </article>
          <article className="fact-card">
            <span className="eyebrow">Selected route</span>
            <p>{selectedRoute?.canonical_truth_guardrail ?? "Select a message or workflow to inspect route guardrails."}</p>
          </article>
          <article className="fact-card">
            <span className="eyebrow">Selected message state</span>
            <p>{selectedMessage?.status ?? "No message selected."}</p>
          </article>
        </div>
      </aside>
    );
  }

  function renderLineageStrip() {
    const states = meshExecutionPack.timeline_template;
    const activeStates = new Set(selectedMessage?.events.map((row) => row.state) ?? []);
    return (
      <section className="lineage-strip panel" data-testid="lineage-strip">
        {states.map((item, index) => (
          <div className="lineage-step" key={item}>
            <span className={`lineage-node ${activeStates.has(item) ? "active" : ""}`}>{index + 1}</span>
            <div>
              <strong>{item}</strong>
              <p>{item === "accepted" ? "Transport only" : item === "proof_pending" ? "Business proof debt" : "Governed state"}</p>
            </div>
          </div>
        ))}
      </section>
    );
  }

  function renderPage() {
    if (state.page === "Mailroom_Overview") {
      return renderOverview();
    }
    if (state.page === "Workflow_Registry") {
      return renderWorkflowRegistry();
    }
    if (state.page === "Message_Envelope_Timeline") {
      return renderTimelinePage();
    }
    if (state.page === "Proof_and_Replay_Inspector") {
      return renderProofPage();
    }
    return renderApplicationPack();
  }

  return (
    <main className="mesh-shell" data-testid="mesh-shell">
      <header className="posture-banner">
        <section className="panel brand-panel">
          <div className="brand-row">
            <svg className="wordmark" viewBox="0 0 72 72" aria-hidden="true">
              <defs>
                <linearGradient id="meshWordmark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#155EEF" />
                  <stop offset="100%" stopColor="#7A5AF8" />
                </linearGradient>
              </defs>
              <rect x="8" y="8" width="56" height="56" rx="18" fill="url(#meshWordmark)" />
              <path d="M23 44V28h6l7 9 7-9h6v16h-5V35l-8 10-8-10v9z" fill="white" />
            </svg>
            <div className="brand-copy">
              <div className="ribbon-row">
                <span className="mock-ribbon">MOCK_MESH_MAILROOM</span>
                <span className="mono-chip">{meshExecutionPack.visual_mode}</span>
                <span className="mono-chip">Signal_Post_Room</span>
              </div>
              <h1>Signal post room</h1>
              <p>Industrial-precise transport control without flattening proof into business truth.</p>
            </div>
          </div>
          <div className="chip-row">
            <span className={`status-chip ${serviceHealthy ? "success" : "review"}`}>
              {serviceHealthy ? "mock service connected" : "seeded fallback active"}
            </span>
            <span className="status-chip caution">{healthSummary.degraded_message_count} degraded alerts</span>
            {state.reducedMotion ? (
              <span className="status-chip review" data-testid="reduced-motion-indicator">
                reduced motion
              </span>
            ) : null}
          </div>
        </section>
        <section className="panel status-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Operations</span>
              <h2>Mailroom posture</h2>
            </div>
            <div className="mode-toggle">
              <button
                className={`mode-button ${state.mode === "mock" ? "active" : ""}`}
                data-testid="mode-toggle-mock"
                onClick={() => setState((current) => ({ ...current, mode: "mock" }))}
              >
                mock
              </button>
              <button
                className={`mode-button ${state.mode === "actual" ? "active" : ""}`}
                data-testid="mode-toggle-actual"
                onClick={() => setState((current) => ({ ...current, mode: "actual", page: "Mailbox_Application_Pack" }))}
              >
                actual
              </button>
            </div>
          </div>
          <div className="summary-row">
            <article className="metric-card compact">
              <span className="eyebrow">Environment</span>
              <strong>{state.mode === "mock" ? "local_sandbox" : "actual_provider_strategy_later"}</strong>
            </article>
            <article className="metric-card compact">
              <span className="eyebrow">Mailbox count</span>
              <strong>{meshExecutionPack.summary.mailbox_count}</strong>
            </article>
            <article className="metric-card compact">
              <span className="eyebrow">Workflow health</span>
              <strong>{meshExecutionPack.summary.workflow_row_count}</strong>
            </article>
          </div>
        </section>
      </header>

      <section className="workspace-grid">
        <nav className="panel rail-panel" data-testid="mailbox-rail">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Mailbox rail</span>
              <h2>Owned and managed mailboxes</h2>
            </div>
          </div>
          <div className="page-tabs">
            {PAGE_ORDER.map((page) => (
              <button
                key={page}
                data-testid={`page-tab-${page}`}
                className={`page-tab ${state.page === page ? "active" : ""}`}
                onClick={() => setState((current) => ({ ...current, page }))}
              >
                {page}
              </button>
            ))}
          </div>
          <div className="mailbox-list">
            {meshExecutionPack.mailboxes.map((row) => (
              <button
                key={row.mailbox_key}
                data-testid={`mailbox-button-${row.mailbox_key}`}
                className={`mailbox-button ${state.selectedMailboxKey === row.mailbox_key ? "active" : ""}`}
                onClick={() => setMailbox(row.mailbox_key)}
              >
                <strong>{row.display_name}</strong>
                <span className="mono-inline">{row.mailbox_id}</span>
                <span>{row.owner_ods}</span>
                <span className="muted-copy">{row.manager_mode}</span>
              </button>
            ))}
          </div>
        </nav>

        <section className="center-column" data-testid="timeline-workbench">
          {renderPage()}
        </section>

        {renderInspector()}
      </section>

      {renderLineageStrip()}
    </main>
  );
}
