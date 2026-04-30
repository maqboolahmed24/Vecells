import { useEffect, useState } from "react";
import { VecellLogoLockup } from "@vecells/design-system";

import { notificationStudioPack } from "./generated/notificationStudioPack";

type Pack = typeof notificationStudioPack;
type TemplateRow = Pack["template_registry"][number];
type SenderRow = Pack["sender_and_domain_rows"][number];
type RoutingPlanRow = Pack["routing_plans"][number];
type MessageRow = Pack["seeded_messages"][number];
type ScenarioRow = Pack["delivery_scenarios"][number];
type GateRow = Pack["live_gate_pack"]["live_gates"][number];
type Page =
  | "Project_and_Environment_Setup"
  | "Template_Gallery"
  | "Routing_Plan_Studio"
  | "Delivery_Truth_Inspector"
  | "Live_Gates_and_Sender_Readiness";
type Mode = "mock" | "actual";

type AppState = {
  mode: Mode;
  page: Page;
  selectedTemplateId: string;
  selectedMessageId: string;
  selectedScenarioId: string;
  serviceBaseUrl: string;
  actualInputs: {
    vendorId: string;
    projectScope: string;
    senderRef: string;
    domainRef: string;
    callbackBaseUrl: string;
    webhookSecretRef: string;
    targetEnvironment: string;
    namedApprover: string;
    allowMutation: string;
    allowSpend: string;
  };
  reducedMotion: boolean;
};

const STORAGE_KEY = "quiet-send-studio-state";
const PAGE_ORDER: readonly Page[] = [
  "Project_and_Environment_Setup",
  "Template_Gallery",
  "Routing_Plan_Studio",
  "Delivery_Truth_Inspector",
  "Live_Gates_and_Sender_Readiness",
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function templateById(id: string): TemplateRow {
  return (
    notificationStudioPack.template_registry.find((row) => row.template_id === id) ??
    notificationStudioPack.template_registry[0]
  );
}

function routingPlanById(id: string): RoutingPlanRow {
  return (
    notificationStudioPack.routing_plans.find((row) => row.routing_plan_ref === id) ??
    notificationStudioPack.routing_plans[0]
  );
}

function scenarioById(id: string): ScenarioRow {
  return (
    notificationStudioPack.delivery_scenarios.find((row) => row.scenario_id === id) ??
    notificationStudioPack.delivery_scenarios[0]
  );
}

function materializeTimeline(
  messageId: string,
  templates: readonly { state: string; label: string; tone: string; detail: string; offset_minutes: number }[],
  baseAt: Date,
  startingIndex = 0,
) {
  return templates.map((event, index) => ({
    event_id: `${messageId}-E${startingIndex + index + 1}`,
    state: event.state,
    label: event.label,
    tone: event.tone,
    detail: event.detail,
    at: new Date(baseAt.getTime() + event.offset_minutes * 60_000).toISOString(),
  }));
}

function nextMessageId(messages: readonly MessageRow[]): string {
  const highest =
    messages
      .map((row) => Number(row.message_id.split("-").pop()))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)[0] ?? 1000;
  return `MSG-LAB-${highest + 1}`;
}

function buildLocalMessage(messageId: string, scenario: ScenarioRow, template: TemplateRow): MessageRow {
  const createdAt = new Date();
  return {
    message_id: messageId,
    scenario_id: scenario.scenario_id,
    template_id: template.template_id,
    template_family_ref: template.template_family_ref,
    template_version_label: template.version_label,
    channel: template.channel,
    message_intent: template.message_intent,
    routing_plan_ref: template.routing_plan_ref,
    sender_identity_ref: template.sender_identity_ref,
    environment_profile: scenario.environment_profile,
    recipient_ref: `synthetic:runtime:${messageId.toLowerCase()}`,
    created_at: createdAt.toISOString(),
    transport_state: scenario.transport_state,
    delivery_evidence_state: scenario.delivery_evidence_state,
    delivery_risk_state: scenario.delivery_risk_state,
    authoritative_outcome_state: scenario.authoritative_outcome_state,
    repair_state: scenario.repair_state,
    webhook_signature_state: scenario.webhook_signature_state,
    dispute_state: scenario.dispute_state,
    summary: scenario.summary,
    timeline_events: materializeTimeline(messageId, scenario.timeline_templates, createdAt),
    can_retry_webhook: scenario.can_retry_webhook,
    can_repair: scenario.can_repair,
    can_settle: scenario.can_settle,
  };
}

function localRetryWebhook(message: MessageRow, scenario: ScenarioRow): MessageRow {
  const appended = materializeTimeline(
    message.message_id,
    scenario.settle_timeline_templates,
    new Date(),
    message.timeline_events.length,
  );
  return {
    ...message,
    webhook_signature_state: "validated",
    delivery_evidence_state: "delivered",
    delivery_risk_state: "on_track",
    can_retry_webhook: false,
    can_settle: true,
    timeline_events: message.timeline_events.concat(appended),
  };
}

function localRepairMessage(message: MessageRow, scenario: ScenarioRow): MessageRow {
  const appended = materializeTimeline(
    message.message_id,
    scenario.repair_timeline_templates,
    new Date(),
    message.timeline_events.length,
  );
  return {
    ...message,
    delivery_evidence_state: "delivered",
    delivery_risk_state: "on_track",
    authoritative_outcome_state: "recovery_required",
    repair_state: "repaired",
    can_repair: false,
    can_settle: true,
    timeline_events: message.timeline_events.concat(appended),
  };
}

function localSettleMessage(message: MessageRow, scenario: ScenarioRow): MessageRow {
  const appended = materializeTimeline(
    message.message_id,
    scenario.settle_timeline_templates,
    new Date(),
    message.timeline_events.length,
  );
  return {
    ...message,
    authoritative_outcome_state:
      message.delivery_evidence_state === "suppressed" ? "suppressed" : "settled",
    can_settle: false,
    timeline_events: message.timeline_events.concat(appended),
  };
}

function initialState(): AppState {
  const params = new URLSearchParams(window.location.search);
  const base: AppState = {
    mode: params.get("mode") === "actual" ? "actual" : "mock",
    page:
      (params.get("page") as Page | null) ??
      "Project_and_Environment_Setup",
    selectedTemplateId: notificationStudioPack.template_registry[0].template_id,
    selectedMessageId: notificationStudioPack.seeded_messages[0].message_id,
    selectedScenarioId: notificationStudioPack.delivery_scenarios[0].scenario_id,
    serviceBaseUrl:
      params.get("notificationBaseUrl") ??
      notificationStudioPack.mock_service.base_url_default,
    actualInputs: {
      vendorId: notificationStudioPack.live_gate_pack.allowed_vendor_ids[0] ?? "mailgun_email",
      projectScope: notificationStudioPack.project_scopes[0].project_scope,
      senderRef: notificationStudioPack.sender_and_domain_rows[0].identity_ref,
      domainRef: "summary.service.example",
      callbackBaseUrl: "https://example.invalid/notification",
      webhookSecretRef: "vault://notifications/webhook",
      targetEnvironment: "provider_like_preprod",
      namedApprover: "",
      allowMutation: "false",
      allowSpend: "false",
    },
    reducedMotion: false,
  };
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

function App() {
  const [appState, setAppState] = useState<AppState>(initialState);
  const [messages, setMessages] = useState<MessageRow[]>(clone(notificationStudioPack.seeded_messages));
  const [serviceStatus, setServiceStatus] = useState("checking");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () =>
      setAppState((current) => ({
        ...current,
        reducedMotion: media.matches,
      }));
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function syncRemote() {
      try {
        const [healthResponse, messagesResponse] = await Promise.all([
          fetch(`${appState.serviceBaseUrl}/api/health`, { cache: "no-store" }),
          fetch(`${appState.serviceBaseUrl}/api/messages`, { cache: "no-store" }),
        ]);
        if (!healthResponse.ok || !messagesResponse.ok) {
          throw new Error("Service unavailable");
        }
        const health = await healthResponse.json();
        const messagePayload = await messagesResponse.json();
        if (!cancelled) {
          setServiceStatus(health.status);
          setMessages(messagePayload.messages);
        }
      } catch {
        if (!cancelled) {
          setServiceStatus("offline");
        }
      }
    }
    syncRemote();
    return () => {
      cancelled = true;
    };
  }, [appState.serviceBaseUrl]);

  const selectedTemplate = templateById(appState.selectedTemplateId);
  const selectedScenario = scenarioById(appState.selectedScenarioId);
  const selectedMessage =
    messages.find((row) => row.message_id === appState.selectedMessageId) ?? messages[0];
  const selectedRoutingPlan = routingPlanById(selectedTemplate.routing_plan_ref);
  const versionRows = notificationStudioPack.template_registry.filter(
    (row) => row.template_family_ref === selectedTemplate.template_family_ref,
  );
  const familyRows = notificationStudioPack.template_registry.filter(
    (row, index, all) =>
      all.findIndex((candidate) => candidate.template_family_ref === row.template_family_ref) === index,
  );
  const senderRows = notificationStudioPack.sender_and_domain_rows.filter(
    (row) =>
      row.identity_ref === selectedTemplate.sender_identity_ref ||
      row.provider_scope === selectedRoutingPlan.primary_channel ||
      row.provider_scope === "shared",
  );
  const blockedGates = notificationStudioPack.live_gate_pack.live_gates.filter(
    (row) => row.status === "blocked",
  );
  const readinessCount = notificationStudioPack.sender_and_domain_rows.filter(
    (row) => row.routing_eligible === "yes",
  ).length;
  const webhookIssues = messages.filter((row) => row.webhook_signature_state === "signature_failed").length;

  async function simulateScenario() {
    const template = templateById(appState.selectedTemplateId);
    if (
      template.channel !== "dual_if_supported" &&
      template.channel !== selectedScenario.channel
    ) {
      return;
    }
    try {
      const response = await fetch(`${appState.serviceBaseUrl}/api/messages/simulate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scenario_id: selectedScenario.scenario_id,
          template_id: template.template_id,
        }),
      });
      if (!response.ok) {
        throw new Error("Remote simulate failed");
      }
      const payload = await response.json();
      setMessages(payload.messages);
      setAppState((current) => ({ ...current, selectedMessageId: payload.message.message_id }));
      setServiceStatus("healthy");
    } catch {
      const messageId = nextMessageId(messages);
      const message = buildLocalMessage(messageId, selectedScenario, template);
      setMessages((current) => [message, ...current]);
      setAppState((current) => ({ ...current, selectedMessageId: messageId }));
    }
  }

  async function retryWebhook() {
    if (!selectedMessage) {
      return;
    }
    try {
      const response = await fetch(
        `${appState.serviceBaseUrl}/api/messages/${selectedMessage.message_id}/retry-webhook`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        throw new Error("Remote retry failed");
      }
      const payload = await response.json();
      setMessages(payload.messages);
    } catch {
      const scenario = scenarioById(selectedMessage.scenario_id);
      setMessages((current) =>
        current.map((row) =>
          row.message_id === selectedMessage.message_id ? localRetryWebhook(row, scenario) : row,
        ),
      );
    }
  }

  async function repairMessage() {
    if (!selectedMessage) {
      return;
    }
    try {
      const response = await fetch(
        `${appState.serviceBaseUrl}/api/messages/${selectedMessage.message_id}/repair`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        throw new Error("Remote repair failed");
      }
      const payload = await response.json();
      setMessages(payload.messages);
    } catch {
      const scenario = scenarioById(selectedMessage.scenario_id);
      setMessages((current) =>
        current.map((row) =>
          row.message_id === selectedMessage.message_id ? localRepairMessage(row, scenario) : row,
        ),
      );
    }
  }

  async function settleMessage() {
    if (!selectedMessage) {
      return;
    }
    try {
      const response = await fetch(
        `${appState.serviceBaseUrl}/api/messages/${selectedMessage.message_id}/settle`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        throw new Error("Remote settle failed");
      }
      const payload = await response.json();
      setMessages(payload.messages);
    } catch {
      const scenario = scenarioById(selectedMessage.scenario_id);
      setMessages((current) =>
        current.map((row) =>
          row.message_id === selectedMessage.message_id ? localSettleMessage(row, scenario) : row,
        ),
      );
    }
  }

  function updateActualInput<K extends keyof AppState["actualInputs"]>(
    key: K,
    value: AppState["actualInputs"][K],
  ) {
    setAppState((current) => ({
      ...current,
      actualInputs: {
        ...current.actualInputs,
        [key]: value,
      },
    }));
  }

  const actualSubmitEnabled =
    notificationStudioPack.phase0_verdict !== "withheld" &&
    blockedGates.length === 0 &&
    appState.actualInputs.allowMutation === "true" &&
    appState.actualInputs.allowSpend === "true" &&
    appState.actualInputs.namedApprover.trim().length > 0;

  return (
    <main className="studio-shell" data-testid="notification-studio-shell">
      <header className="top-banner">
        <section className="brand-row">
          <div className="brand-row">
            <VecellLogoLockup aria-hidden="true" className="wordmark" />
            <div className="brand-copy">
              <div className="ribbon-row">
                <span className="mock-ribbon">notification studio test mode</span>
                <span className="mono-chip">{notificationStudioPack.visual_mode}</span>
                <span className="status-chip">{serviceStatus === "healthy" ? "rail connected" : "local only"}</span>
              </div>
              <div>
                <h1>Quiet Send Studio</h1>
                <p>Calm, exact notification design work that keeps project setup downstream of delivery records.</p>
              </div>
            </div>
          </div>
          <div className="mode-toggle" data-testid="mode-toggle">
            <button
              type="button"
              className={`mode-button ${appState.mode === "mock" ? "active" : ""}`}
              onClick={() => setAppState((current) => ({ ...current, mode: "mock" }))}
            >
              Mock
            </button>
            <button
              type="button"
              data-testid="mode-toggle-actual"
              className={`mode-button ${appState.mode === "actual" ? "active" : ""}`}
              onClick={() => setAppState((current) => ({ ...current, mode: "actual", page: "Live_Gates_and_Sender_Readiness" }))}
            >
              Actual later
            </button>
          </div>
        </section>
        <section className="metric-grid">
          <article className="metric-card">
            <span className="caption">Active templates</span>
            <strong>{notificationStudioPack.summary.template_count}</strong>
            <p>Canonical registry rows with sender and route bindings.</p>
          </article>
          <article className="metric-card">
            <span className="caption">Sender readiness</span>
            <strong>{readinessCount}/{notificationStudioPack.summary.sender_row_count}</strong>
            <p>Rows already usable in mock or preview status.</p>
          </article>
          <article className="metric-card">
            <span className="caption">Webhook health</span>
            <strong>{webhookIssues === 0 ? "clean" : `${webhookIssues} review`}</strong>
            <p>Signed callback issues stay explicit and block quiet success.</p>
          </article>
          <article className="metric-card">
            <span className="caption">Live status</span>
            <strong>{notificationStudioPack.phase0_verdict}</strong>
            <p>Real project or sender mutation stays fail-closed.</p>
          </article>
        </section>
      </header>

      <section className="workspace-grid">
        <aside className="left-column panel" data-testid="template-rail">
          <div className="panel-stack">
            <div className="header-row">
              <div>
                <h2>Template rail</h2>
                <p>Select the canonical family, then switch versions in the workspace.</p>
              </div>
            </div>
            <div className="page-tabs" aria-label="Studio pages">
              {PAGE_ORDER.map((page) => (
                <button
                  key={page}
                  type="button"
                  role="tab"
                  data-testid={`page-tab-${page}`}
                  className={`page-tab ${appState.page === page ? "active" : ""}`}
                  onClick={() => setAppState((current) => ({ ...current, page }))}
                >
                  {page.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <div className="template-list">
              {familyRows.map((row) => (
                <button
                  key={row.template_family_ref}
                  type="button"
                  data-testid={`template-button-${row.template_family_ref}`}
                  className={`template-button ${
                    selectedTemplate.template_family_ref === row.template_family_ref ? "active" : ""
                  }`}
                  onClick={() =>
                    setAppState((current) => ({
                      ...current,
                      selectedTemplateId: row.template_id,
                    }))
                  }
                >
                  <strong>{row.template_family_ref.replace(/^TF_/, "").replace(/_/g, " ")}</strong>
                  <span className={`tone-chip ${row.channel === "sms" ? "tone-sms" : row.channel === "email" ? "tone-email" : "tone-review"}`}>
                    {row.channel}
                  </span>
                  <span>{row.notes}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="center-column" data-testid="workspace">
          <article className="panel">
            <div className="header-row">
              <div>
                <h2>{appState.page.replace(/_/g, " ")}</h2>
                <p>{selectedTemplate.notes}</p>
              </div>
              <div className="version-row">
                {versionRows.map((row) => (
                  <button
                    key={row.template_id}
                    type="button"
                    className={`version-chip ${row.template_id === selectedTemplate.template_id ? "active" : ""}`}
                    onClick={() =>
                      setAppState((current) => ({ ...current, selectedTemplateId: row.template_id }))
                    }
                  >
                    {row.version_label}
                  </button>
                ))}
              </div>
            </div>

            {appState.page === "Project_and_Environment_Setup" && (
              <div className="panel-stack">
                <div className="detail-list">
                  {notificationStudioPack.environment_profiles.map((row) => (
                    <article key={row.environment_profile} className="detail-card">
                      <span className="mono-chip">{row.environment_profile}</span>
                      <h3>{row.label}</h3>
                      <p>{row.notes}</p>
                      <div className="panel-stack">
                        <span className="caption">Sender posture: {row.sender_posture}</span>
                        <span className="caption">Webhook posture: {row.webhook_posture}</span>
                        <span className="caption">Spend posture: {row.spend_posture}</span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="table-pane">
                  <h3>Selected project scopes</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Scope</th>
                        <th>Title</th>
                        <th>Channel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notificationStudioPack.project_scopes.map((scope) => (
                        <tr key={scope.project_scope}>
                          <td className="mono">{scope.project_scope}</td>
                          <td>{scope.title}</td>
                          <td>{scope.channel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {appState.page === "Template_Gallery" && (
              <div className="panel-stack">
                <div className="preview-pane">
                  <div className="header-row">
                    <div>
                      <h3>{selectedTemplate.template_id}</h3>
                      <p>{selectedTemplate.message_intent.replace(/_/g, " ")}</p>
                    </div>
                    <div className="chip-row">
                      <span className="mono-chip">{selectedTemplate.channel}</span>
                      <span className="status-chip">{selectedTemplate.routing_plan_ref}</span>
                    </div>
                  </div>
                  <div className="preview-body">
                    {selectedTemplate.preview_subject ? `${selectedTemplate.preview_subject}\n\n` : ""}
                    {selectedTemplate.preview_body}
                  </div>
                </div>
                <div className="detail-list">
                  <article className="detail-card">
                    <h3>Personalisation fields</h3>
                    <p>{selectedTemplate.personalisation_fields.join(", ")}</p>
                  </article>
                  <article className="detail-card">
                    <h3>Copy rules</h3>
                    <p>{selectedTemplate.supports_markdown_or_rich_copy_rules}</p>
                  </article>
                  <article className="detail-card">
                    <h3>Mock use</h3>
                    <p>{selectedTemplate.mock_now_use}</p>
                  </article>
                  <article className="detail-card">
                    <h3>Actual later</h3>
                    <p>{selectedTemplate.actual_later_use}</p>
                  </article>
                </div>
              </div>
            )}

            {appState.page === "Routing_Plan_Studio" && (
              <div className="panel-stack">
                <div className="detail-list">
                  <article className="detail-card">
                    <h3>Primary channel</h3>
                    <p>{selectedRoutingPlan.primary_channel}</p>
                  </article>
                  <article className="detail-card">
                    <h3>Fallback channel</h3>
                    <p>{selectedRoutingPlan.fallback_channel}</p>
                  </article>
                  <article className="detail-card">
                    <h3>Sender binding</h3>
                    <p className="mono">{selectedRoutingPlan.sender_identity_ref}</p>
                  </article>
                  <article className="detail-card">
                    <h3>Repair rule</h3>
                    <p>{selectedRoutingPlan.repair_entry_rule.replace(/_/g, " ")}</p>
                  </article>
                </div>
                <div className="table-pane">
                  <h3>Validation checks</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Check</th>
                        <th>Status</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRoutingPlan.validation_checks.map((check) => (
                        <tr key={check.title}>
                          <td>{check.title}</td>
                          <td>{check.status}</td>
                          <td>{check.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {appState.page === "Delivery_Truth_Inspector" && (
              <div className="panel-stack">
                <div className="header-row">
                  <div>
                    <h3>Scenario simulation</h3>
                    <p>Simulate transport, evidence, dispute, repair, and settlement without live providers.</p>
                  </div>
                  <div className="button-row">
                    <select
                      data-testid="scenario-select"
                      value={appState.selectedScenarioId}
                      onChange={(event) =>
                        setAppState((current) => ({ ...current, selectedScenarioId: event.target.value }))
                      }
                    >
                      {notificationStudioPack.delivery_scenarios.map((row) => (
                        <option key={row.scenario_id} value={row.scenario_id}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="action-button primary"
                      data-testid="simulate-message-button"
                      onClick={simulateScenario}
                    >
                      Simulate message
                    </button>
                  </div>
                </div>
                <div className="message-list">
                  {messages.map((row) => (
                    <button
                      key={row.message_id}
                      type="button"
                      className={`message-button ${selectedMessage?.message_id === row.message_id ? "active" : ""}`}
                      onClick={() =>
                        setAppState((current) => ({ ...current, selectedMessageId: row.message_id }))
                      }
                    >
                      <strong>{row.message_id}</strong>
                      <span>{row.summary}</span>
                      <span className="mono-chip">{row.delivery_evidence_state}</span>
                    </button>
                  ))}
                </div>
                <div className="timeline-pane" data-testid="delivery-timeline">
                  {selectedMessage ? (
                    <>
                      <div className="header-row">
                        <div>
                          <h3>{selectedMessage.message_id}</h3>
                          <p>{selectedMessage.summary}</p>
                        </div>
                        <div className="button-row">
                          <button
                            type="button"
                            className="action-button ghost"
                            data-testid="retry-webhook-button"
                            onClick={retryWebhook}
                            disabled={!selectedMessage.can_retry_webhook}
                          >
                            Retry webhook
                          </button>
                          <button
                            type="button"
                            className="action-button secondary"
                            data-testid="repair-message-button"
                            onClick={repairMessage}
                            disabled={!selectedMessage.can_repair}
                          >
                            Authorize repair
                          </button>
                          <button
                            type="button"
                            className="action-button primary"
                            data-testid="settle-message-button"
                            onClick={settleMessage}
                            disabled={!selectedMessage.can_settle}
                          >
                            Settle chain
                          </button>
                        </div>
                      </div>
                      <div className="detail-list" style={{ marginBottom: "16px" }}>
                        <article className="detail-card">
                          <h3>Transport</h3>
                          <p>{selectedMessage.transport_state}</p>
                        </article>
                        <article className="detail-card">
                          <h3>Delivery evidence</h3>
                          <p>{selectedMessage.delivery_evidence_state}</p>
                        </article>
                        <article className="detail-card">
                          <h3>Risk</h3>
                          <p>{selectedMessage.delivery_risk_state}</p>
                        </article>
                        <article className="detail-card">
                          <h3>Authoritative outcome</h3>
                          <p>{selectedMessage.authoritative_outcome_state}</p>
                        </article>
                      </div>
                      <div className="event-list">
                        {selectedMessage.timeline_events.map((event) => (
                          <article key={event.event_id} className="event-card">
                            <div className="header-row">
                              <strong>{event.label}</strong>
                              <span className={`tone-chip tone-${event.tone}`}>{event.state}</span>
                            </div>
                            <p>{event.detail}</p>
                            <p className="caption mono">{event.at}</p>
                          </article>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="empty-state">No message selected.</div>
                  )}
                </div>
              </div>
            )}

            {appState.page === "Live_Gates_and_Sender_Readiness" && (
              <div className="panel-stack">
                <div className="form-grid">
                  <label className="field">
                    <span>Vendor</span>
                    <select
                      data-testid="actual-field-vendor-id"
                      value={appState.actualInputs.vendorId}
                      onChange={(event) => updateActualInput("vendorId", event.target.value)}
                    >
                      {notificationStudioPack.live_gate_pack.allowed_vendor_ids.map((vendorId) => (
                        <option key={vendorId} value={vendorId}>
                          {vendorId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Project scope</span>
                    <select
                      data-testid="actual-field-project-scope"
                      value={appState.actualInputs.projectScope}
                      onChange={(event) => updateActualInput("projectScope", event.target.value)}
                    >
                      {notificationStudioPack.project_scopes.map((scope) => (
                        <option key={scope.project_scope} value={scope.project_scope}>
                          {scope.project_scope}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Sender ref</span>
                    <select
                      data-testid="actual-field-sender-ref"
                      value={appState.actualInputs.senderRef}
                      onChange={(event) => updateActualInput("senderRef", event.target.value)}
                    >
                      {notificationStudioPack.sender_and_domain_rows.map((row) => (
                        <option key={row.identity_ref} value={row.identity_ref}>
                          {row.identity_ref}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Domain ref</span>
                    <input
                      data-testid="actual-field-domain-ref"
                      value={appState.actualInputs.domainRef}
                      onChange={(event) => updateActualInput("domainRef", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Callback base URL</span>
                    <input
                      data-testid="actual-field-callback-base"
                      value={appState.actualInputs.callbackBaseUrl}
                      onChange={(event) => updateActualInput("callbackBaseUrl", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Webhook secret ref</span>
                    <input
                      data-testid="actual-field-webhook-secret"
                      value={appState.actualInputs.webhookSecretRef}
                      onChange={(event) => updateActualInput("webhookSecretRef", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Target environment</span>
                    <select
                      data-testid="actual-field-environment"
                      value={appState.actualInputs.targetEnvironment}
                      onChange={(event) => updateActualInput("targetEnvironment", event.target.value)}
                    >
                      {notificationStudioPack.environment_profiles.map((row) => (
                        <option key={row.environment_profile} value={row.environment_profile}>
                          {row.environment_profile}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Named approver</span>
                    <input
                      data-testid="actual-field-named-approver"
                      value={appState.actualInputs.namedApprover}
                      onChange={(event) => updateActualInput("namedApprover", event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>ALLOW_REAL_PROVIDER_MUTATION</span>
                    <select
                      data-testid="actual-field-allow-mutation"
                      value={appState.actualInputs.allowMutation}
                      onChange={(event) => updateActualInput("allowMutation", event.target.value)}
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>ALLOW_SPEND</span>
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
                <div className="button-row">
                  <button
                    type="button"
                    className="action-button primary"
                    data-testid="actual-submit-button"
                    disabled={!actualSubmitEnabled}
                  >
                    Real project or sender mutation blocked
                  </button>
                </div>
                <div className="table-pane">
                  <h3>Live gates</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Gate</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notificationStudioPack.live_gate_pack.live_gates.map((gate) => (
                        <tr key={gate.gate_id}>
                          <td className="mono">{gate.gate_id}</td>
                          <td>{gate.status}</td>
                          <td>{gate.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </article>

          <article className="flow-card" data-testid="lower-diagram">
            <div className="header-row">
              <div>
                <h2>Compose to settle</h2>
                <p>The studio keeps one restrained flow diagram with adjacent table and timeline parity.</p>
              </div>
              {appState.reducedMotion && (
                <span data-testid="reduced-motion-indicator" className="status-chip">
                  reduced motion
                </span>
              )}
            </div>
            <div className="flow-strip">
              <div className="flow-node">compose</div>
              <div className="flow-arrow">→</div>
              <div className="flow-node">route</div>
              <div className="flow-arrow">→</div>
              <div className="flow-node">accepted</div>
              <div className="flow-arrow">→</div>
              <div className="flow-node">delivered or bounced</div>
              <div className="flow-arrow">→</div>
              <div className="flow-node">repair or settle</div>
            </div>
          </article>
        </section>

        <aside className="right-column panel" data-testid="inspector-panel">
          <div className="panel-stack">
            <div className="header-row">
              <div>
                <h2>Inspector</h2>
                <p>Sender, domain, route, and verified details settings for the current selection.</p>
              </div>
              <span className="mono-chip">{selectedTemplate.template_id}</span>
            </div>
            <div className="inspector-pane">
              <div className="inspector-row">
                <span className="caption">Routing plan</span>
                <strong>{selectedRoutingPlan.title}</strong>
                <p>{selectedRoutingPlan.notes}</p>
              </div>
              <div className="inspector-row">
                <span className="caption">Sender ref</span>
                <strong className="mono">{selectedTemplate.sender_identity_ref}</strong>
              </div>
              <div className="inspector-row">
                <span className="caption">Current message verified details</span>
                <p>
                  {selectedMessage
                    ? `${selectedMessage.transport_state} / ${selectedMessage.delivery_evidence_state} / ${selectedMessage.authoritative_outcome_state}`
                    : "No message selected"}
                </p>
              </div>
              <div className="inspector-list">
                {senderRows.slice(0, 6).map((row: SenderRow) => (
                  <div key={row.identity_ref} className="detail-card">
                    <span className="mono-chip">{row.identity_ref}</span>
                    <h3>{row.verification_posture.replace(/_/g, " ")}</h3>
                    <p>{row.notes}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="table-pane">
              <h3>Gate snapshot</h3>
              <table>
                <thead>
                  <tr>
                    <th>Gate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notificationStudioPack.live_gate_pack.live_gates.slice(0, 6).map((gate: GateRow) => (
                    <tr key={gate.gate_id}>
                      <td className="mono">{gate.gate_id}</td>
                      <td>{gate.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;
