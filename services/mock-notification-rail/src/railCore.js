import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "33_notification_studio_pack.json"), "utf8"),
);

const scenarioMap = new Map(PACK.delivery_scenarios.map((row) => [row.scenario_id, row]));
const templateMap = new Map(PACK.template_registry.map((row) => [row.template_id, row]));

let messages = PACK.seeded_messages.map((row) => JSON.parse(JSON.stringify(row)));
let nextMessageOrdinal = 4000;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function materializeTimeline(messageId, templates, baseAt, startingIndex = 0) {
  return templates.map((event, index) => ({
    event_id: `${messageId}-E${startingIndex + index + 1}`,
    state: event.state,
    label: event.label,
    tone: event.tone,
    detail: event.detail,
    at: new Date(baseAt.getTime() + event.offset_minutes * 60_000).toISOString(),
  }));
}

function buildMessage(messageId, scenario, template) {
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

function listMessages() {
  return clone(messages).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function health() {
  return {
    status: "healthy",
    message_count: messages.length,
    repair_open_count: messages.filter((row) => row.can_repair).length,
    webhook_alert_count: messages.filter((row) => row.webhook_signature_state === "signature_failed").length,
  };
}

function registry() {
  return {
    task_id: PACK.task_id,
    visual_mode: PACK.visual_mode,
    template_registry: PACK.template_registry,
    routing_plans: PACK.routing_plans,
    sender_and_domain_rows: PACK.sender_and_domain_rows,
    delivery_scenarios: PACK.delivery_scenarios,
    live_gate_pack: PACK.live_gate_pack,
  };
}

function simulateMessage(payload) {
  const scenario = scenarioMap.get(payload.scenario_id);
  const template = templateMap.get(payload.template_id);
  if (!scenario) {
    return { ok: false, status: 422, error: "Unknown scenario." };
  }
  if (!template) {
    return { ok: false, status: 422, error: "Unknown template." };
  }
  if (template.channel !== "dual_if_supported" && template.channel !== scenario.channel) {
    return { ok: false, status: 422, error: "Template channel is incompatible with the chosen scenario." };
  }
  nextMessageOrdinal += 1;
  const messageId = `MSG-LAB-${nextMessageOrdinal}`;
  const message = buildMessage(messageId, scenario, template);
  messages.unshift(message);
  return { ok: true, status: 201, message: clone(message), messages: listMessages() };
}

function retryWebhook(messageId) {
  const message = messages.find((row) => row.message_id === messageId);
  if (!message) {
    return { ok: false, status: 404, error: "Message not found." };
  }
  if (!message.can_retry_webhook) {
    return { ok: false, status: 422, error: "Message has no retryable webhook fault." };
  }
  const scenario = scenarioMap.get(message.scenario_id);
  const appended = materializeTimeline(
    message.message_id,
    scenario.settle_timeline_templates,
    new Date(),
    message.timeline_events.length,
  );
  message.webhook_signature_state = "validated";
  message.delivery_evidence_state = "delivered";
  message.delivery_risk_state = "on_track";
  message.can_retry_webhook = false;
  message.can_settle = true;
  message.timeline_events.push(...appended);
  return { ok: true, status: 200, message: clone(message), messages: listMessages() };
}

function repairMessage(messageId) {
  const message = messages.find((row) => row.message_id === messageId);
  if (!message) {
    return { ok: false, status: 404, error: "Message not found." };
  }
  if (!message.can_repair) {
    return { ok: false, status: 422, error: "Message is not currently repairable." };
  }
  const scenario = scenarioMap.get(message.scenario_id);
  const appended = materializeTimeline(
    message.message_id,
    scenario.repair_timeline_templates,
    new Date(),
    message.timeline_events.length,
  );
  message.delivery_evidence_state = "delivered";
  message.delivery_risk_state = "on_track";
  message.authoritative_outcome_state = "recovery_required";
  message.repair_state = "repaired";
  message.can_repair = false;
  message.can_settle = true;
  message.timeline_events.push(...appended);
  return { ok: true, status: 200, message: clone(message), messages: listMessages() };
}

function settleMessage(messageId) {
  const message = messages.find((row) => row.message_id === messageId);
  if (!message) {
    return { ok: false, status: 404, error: "Message not found." };
  }
  if (!message.can_settle) {
    return { ok: false, status: 422, error: "Message is not ready for settlement." };
  }
  const scenario = scenarioMap.get(message.scenario_id);
  const appended = materializeTimeline(
    message.message_id,
    scenario.settle_timeline_templates,
    new Date(),
    message.timeline_events.length,
  );
  message.authoritative_outcome_state =
    message.delivery_evidence_state === "suppressed" ? "suppressed" : "settled";
  message.can_settle = false;
  message.timeline_events.push(...appended);
  return { ok: true, status: 200, message: clone(message), messages: listMessages() };
}

export {
  PACK,
  health,
  listMessages,
  registry,
  repairMessage,
  retryWebhook,
  settleMessage,
  simulateMessage,
};
