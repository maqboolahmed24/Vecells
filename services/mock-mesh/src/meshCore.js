import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "mesh_execution_pack.json"), "utf8"),
);

const workflowMap = new Map(PACK.workflow_rows.map((row) => [row.workflow_id, row]));
const mailboxMap = new Map(PACK.mailboxes.map((row) => [row.mailbox_key, row]));
const scenarioMap = new Map(PACK.mock_service.scenarios.map((row) => [row.scenario_id, row]));
const seededMessages = PACK.mock_service.seeded_messages.map((row) => seedMessage(row));

let messages = [...seededMessages];
let nextMessageOrdinal = 7000;

function isoWithOffset(baseIso, minuteOffset) {
  const base = new Date(baseIso);
  base.setUTCMinutes(base.getUTCMinutes() + minuteOffset);
  return base.toISOString();
}

function workflowKeys(mailbox) {
  return String(mailbox.workflow_keys)
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function titleForState(state) {
  return {
    compose: "Compose envelope",
    submit: "Submit to transport",
    accepted: "Transport accepted",
    picked_up: "Mailbox pickup confirmed",
    proof_pending: "Proof still pending",
    settled_or_recovered: "Settled or recovered",
    duplicate_delivery: "Duplicate delivery observed",
    recovery_required: "Recovery review opened",
    expired: "Pickup expired",
    quarantined: "Attachment quarantined",
    replay_blocked: "Replay blocked",
  }[state] ?? state;
}

function toneForState(state) {
  if (state === "settled_or_recovered") {
    return "success";
  }
  if (state === "accepted" || state === "picked_up") {
    return "delivery";
  }
  if (state === "proof_pending") {
    return "review";
  }
  if (state === "duplicate_delivery" || state === "recovery_required") {
    return "caution";
  }
  if (state === "expired" || state === "quarantined" || state === "replay_blocked") {
    return "blocked";
  }
  return "default";
}

function detailForState(message, state) {
  const workflow = workflowMap.get(message.workflow_id);
  const base = {
    compose: `Envelope prepared for ${workflow.message_family}.`,
    submit: "Local outbox hands the message to the transport seam.",
    accepted: "The transport accepted the submission. This is not downstream truth.",
    picked_up: "The recipient mailbox reports pickup or download completion.",
    proof_pending: "Business acknowledgement or authoritative downstream proof is still pending.",
    settled_or_recovered: "The transport branch has either settled cleanly or reached a governed recovery disposition.",
    duplicate_delivery: "A duplicate event landed on the same canonical dispatch key.",
    recovery_required: "Operator review is required before any resend or calmness claim.",
    expired: "The pickup window expired and a non-delivery posture is now explicit.",
    quarantined: "The attachment or payload entered quarantine and requires support handling.",
    replay_blocked: "Replay or resend was fenced by the replay-safety contract.",
  };
  return base[state] ?? "";
}

function buildEvents(message, states, createdAt) {
  return states.map((state, index) => ({
    event_id: `${message.message_id}-${index + 1}`,
    state,
    label: titleForState(state),
    tone: toneForState(state),
    detail: detailForState(message, state),
    at: isoWithOffset(createdAt, index * 2),
  }));
}

function finalStatesForScenario(scenarioId) {
  const mapping = {
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

function seedMessage(seed) {
  const mailboxFrom = mailboxMap.get(seed.from_mailbox_key);
  const mailboxTo = mailboxMap.get(seed.to_mailbox_key);
  const message = {
    ...seed,
    mailbox_from: mailboxFrom,
    mailbox_to: mailboxTo,
    scenario: scenarioMap.get(seed.scenario_id),
    can_advance: false,
    can_replay: seed.status !== "replay_blocked",
  };
  return {
    ...message,
    events: buildEvents(message, finalStatesForScenario(seed.scenario_id), seed.created_at),
  };
}

function cloneMessage(message) {
  return JSON.parse(JSON.stringify(message));
}

function listMessages(filterMailboxKey = "") {
  return messages
    .filter((row) => {
      if (!filterMailboxKey) {
        return true;
      }
      return row.from_mailbox_key === filterMailboxKey || row.to_mailbox_key === filterMailboxKey;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(cloneMessage);
}

function getMessage(messageId) {
  const message = messages.find((row) => row.message_id === messageId);
  return message ? cloneMessage(message) : null;
}

function validateWorkflowChoice(mailboxKey, workflowId) {
  const mailbox = mailboxMap.get(mailboxKey);
  const workflow = workflowMap.get(workflowId);
  if (!mailbox) {
    return { ok: false, reason: `Unknown mailbox ${mailboxKey}` };
  }
  if (!workflow) {
    return { ok: false, reason: `Unknown workflow ${workflowId}` };
  }
  const assigned = workflowKeys(mailbox);
  if (!assigned.includes(workflowId)) {
    return {
      ok: false,
      reason: `${workflowId} is not assigned to ${mailbox.display_name}. Workflow IDs are first-class registry objects, not free-text send values.`,
    };
  }
  return {
    ok: true,
    reason: `${workflowId} is assigned to ${mailbox.display_name}. Transport acceptance will still be weaker than ${workflow.proof_required_after_send}.`,
  };
}

function dispatchMessage(payload) {
  const fromMailbox = mailboxMap.get(payload.from_mailbox_key);
  const toMailbox = mailboxMap.get(payload.to_mailbox_key);
  const workflow = workflowMap.get(payload.workflow_id);
  const scenario = scenarioMap.get(payload.scenario_id) ?? scenarioMap.get("happy_path");

  if (!fromMailbox) {
    return { ok: false, status: 422, error: "Unknown source mailbox." };
  }
  if (!toMailbox) {
    return { ok: false, status: 422, error: "Unknown destination mailbox." };
  }
  if (!workflow) {
    return { ok: false, status: 422, error: "Unknown workflow ID." };
  }
  if (fromMailbox.mailbox_key === toMailbox.mailbox_key) {
    return { ok: false, status: 422, error: "Source and destination mailboxes must differ." };
  }

  const validation = validateWorkflowChoice(payload.from_mailbox_key, payload.workflow_id);
  if (!validation.ok) {
    return { ok: false, status: 422, error: validation.reason };
  }

  const createdAt = new Date().toISOString();
  nextMessageOrdinal += 1;
  const status = payload.scenario_id === "expired_pickup" ? "accepted" : "accepted";
  const message = {
    message_id: `MSG-LIVE-${nextMessageOrdinal}`,
    message_ref: `${payload.workflow_id.toLowerCase()}-${nextMessageOrdinal}`,
    workflow_id: payload.workflow_id,
    from_mailbox_key: fromMailbox.mailbox_key,
    to_mailbox_key: toMailbox.mailbox_key,
    scenario_id: scenario.scenario_id,
    status,
    authoritative_truth_state: "transport_only",
    proof_state: "transport_accepted_only",
    attachment_state: payload.attachment_mode === "quarantined" ? "quarantined" : "none",
    created_at: createdAt,
    summary: payload.summary || scenario.description,
    mailbox_from: fromMailbox,
    mailbox_to: toMailbox,
    scenario,
    mode: payload.mode ?? "mock",
    can_advance: true,
    can_replay: true,
    events: buildEvents(
      {
        message_id: `MSG-LIVE-${nextMessageOrdinal}`,
        workflow_id: payload.workflow_id,
      },
      ["compose", "submit", "accepted"],
      createdAt,
    ),
  };

  messages.unshift(message);
  return { ok: true, status: 201, payload: cloneMessage(message) };
}

function appendScenarioRemainder(message) {
  const finalStates = finalStatesForScenario(message.scenario_id);
  const currentStates = new Set(message.events.map((row) => row.state));
  const missingStates = finalStates.filter((state) => !currentStates.has(state));
  const nextEvents = buildEvents(message, missingStates, isoWithOffset(message.created_at, message.events.length * 2));
  const eventOffset = message.events.length;
  const normalized = nextEvents.map((row, index) => ({
    ...row,
    event_id: `${message.message_id}-${eventOffset + index + 1}`,
  }));
  message.events.push(...normalized);
  message.can_advance = false;

  if (message.scenario_id === "happy_path") {
    message.status = "settled_or_recovered";
    message.authoritative_truth_state = "proof_current";
    message.proof_state = "authoritative_downstream_proof_seen";
  } else if (message.scenario_id === "delayed_ack") {
    message.status = "proof_pending";
    message.authoritative_truth_state = "proof_pending";
    message.proof_state = "business_ack_pending";
  } else if (message.scenario_id === "duplicate_delivery") {
    message.status = "recovery_required";
    message.authoritative_truth_state = "duplicate_under_review";
    message.proof_state = "duplicate_receipt_seen";
  } else if (message.scenario_id === "expired_pickup") {
    message.status = "expired";
    message.authoritative_truth_state = "outcome_missing";
    message.proof_state = "non_delivery_reported";
  } else if (message.scenario_id === "quarantine_attachment") {
    message.status = "quarantined";
    message.authoritative_truth_state = "artifact_blocked";
    message.proof_state = "quarantine_manifest_current";
    message.attachment_state = "quarantined";
  } else if (message.scenario_id === "replay_guard") {
    message.status = "replay_blocked";
    message.authoritative_truth_state = "replay_review_open";
    message.proof_state = "collision_detected";
  }
}

function advanceMessage(messageId) {
  const message = messages.find((row) => row.message_id === messageId);
  if (!message) {
    return { ok: false, status: 404, error: "Message not found." };
  }
  if (!message.can_advance) {
    return { ok: true, status: 200, payload: cloneMessage(message) };
  }
  appendScenarioRemainder(message);
  return { ok: true, status: 200, payload: cloneMessage(message) };
}

function replayMessage(messageId) {
  const message = messages.find((row) => row.message_id === messageId);
  if (!message) {
    return { ok: false, status: 404, error: "Message not found." };
  }
  if (message.events.some((row) => row.state === "replay_blocked")) {
    return { ok: true, status: 200, payload: cloneMessage(message) };
  }
  const event = {
    event_id: `${message.message_id}-${message.events.length + 1}`,
    state: "replay_blocked",
    label: titleForState("replay_blocked"),
    tone: toneForState("replay_blocked"),
    detail: detailForState(message, "replay_blocked"),
    at: new Date().toISOString(),
  };
  message.events.push(event);
  message.status = "replay_blocked";
  message.authoritative_truth_state = "replay_review_open";
  message.proof_state = "collision_detected";
  message.can_advance = false;
  message.can_replay = false;
  return { ok: true, status: 200, payload: cloneMessage(message) };
}

function registry() {
  return {
    task_id: PACK.task_id,
    visual_mode: PACK.visual_mode,
    mailboxes: PACK.mailboxes,
    workflow_rows: PACK.workflow_rows,
    route_rows: PACK.route_rows,
    live_gate_pack: PACK.live_gate_pack,
    field_map: PACK.field_map,
    summary: PACK.summary,
  };
}

function health() {
  const liveCount = messages.filter((row) => row.message_id.startsWith("MSG-LIVE-")).length;
  const degradedCount = messages.filter((row) =>
    ["proof_pending", "expired", "quarantined", "replay_blocked", "recovery_required"].includes(
      row.status,
    ),
  ).length;
  return {
    service: "mock-mesh",
    status: "ok",
    visual_mode: PACK.visual_mode,
    mailbox_count: PACK.mailboxes.length,
    workflow_count: PACK.workflow_rows.length,
    message_count: messages.length,
    live_message_count: liveCount,
    degraded_message_count: degradedCount,
  };
}

export {
  PACK,
  registry,
  health,
  listMessages,
  getMessage,
  validateWorkflowChoice,
  dispatchMessage,
  advanceMessage,
  replayMessage,
};
