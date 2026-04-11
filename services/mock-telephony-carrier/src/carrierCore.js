import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "32_telephony_lab_pack.json"), "utf8"),
);

const numberMap = new Map(PACK.number_inventory.map((row) => [row.number_id, row]));
const scenarioMap = new Map(PACK.call_scenarios.map((row) => [row.scenario_id, row]));

let numbers = PACK.number_inventory.map((row, index) => ({
  ...row,
  assignment_state: index < 4 ? "assigned" : "available",
  assigned_to: index < 4 ? "voice_lab" : "",
}));
let calls = PACK.seeded_calls.map((row) => JSON.parse(JSON.stringify(row)));
let nextCallOrdinal = 5000;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function eventTone(state) {
  if (["closed", "submitted", "evidence_ready"].includes(state)) {
    return "success";
  }
  if (["urgent_live_only", "manual_audio_review_required", "recording_missing"].includes(state)) {
    return "blocked";
  }
  if (["webhook_signature_failed", "webhook_retry_pending", "provider_error"].includes(state)) {
    return "caution";
  }
  if (["continuation_eligible", "continuation_sent", "evidence_pending"].includes(state)) {
    return "review";
  }
  return "default";
}

function scenarioById(id) {
  return scenarioMap.get(id);
}

function numberById(id) {
  return numberMap.get(id);
}

function localEventsForScenario(callId, scenario) {
  return scenario.state_path.map((state, index) => ({
    event_id: `${callId}-${index + 1}`,
    state,
    label: state.replace(/_/g, " "),
    tone: eventTone(state),
    detail: scenario.summary,
    at: new Date(Date.now() + index * 120000).toISOString(),
  }));
}

function buildCall(callId, scenario, numberId) {
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

function listNumbers() {
  return clone(numbers);
}

function listCalls() {
  return clone(calls).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function getCall(callId) {
  const call = calls.find((row) => row.call_id === callId);
  return call ? clone(call) : null;
}

function health() {
  return {
    status: "healthy",
    active_calls: calls.filter((row) => row.status !== "closed").length,
    assigned_numbers: numbers.filter((row) => row.assignment_state === "assigned").length,
    webhook_alerts: calls.filter((row) =>
      ["signature_failed", "fallback_recovered"].includes(row.webhook_state),
    ).length,
  };
}

function registry() {
  return {
    task_id: PACK.task_id,
    visual_mode: PACK.visual_mode,
    number_inventory: listNumbers(),
    call_scenarios: PACK.call_scenarios,
    live_gate_pack: PACK.live_gate_pack,
    official_vendor_guidance: PACK.official_vendor_guidance,
  };
}

function assignNumber(payload) {
  const number = numbers.find((row) => row.number_id === payload.number_id);
  if (!number) {
    return { ok: false, status: 422, error: "Unknown number." };
  }
  number.assignment_state = "assigned";
  number.assigned_to = payload.assigned_to || "voice_lab";
  return { ok: true, status: 200, numbers: listNumbers() };
}

function releaseNumber(payload) {
  const number = numbers.find((row) => row.number_id === payload.number_id);
  if (!number) {
    return { ok: false, status: 422, error: "Unknown number." };
  }
  const activeCall = calls.find(
    (row) => row.number_id === number.number_id && !["closed"].includes(row.status),
  );
  if (activeCall) {
    return {
      ok: false,
      status: 422,
      error: "Cannot release a number with an active call scenario still open.",
    };
  }
  number.assignment_state = "available";
  number.assigned_to = "";
  return { ok: true, status: 200, numbers: listNumbers() };
}

function simulateCall(payload) {
  const scenario = scenarioById(payload.scenario_id);
  const number = numbers.find((row) => row.number_id === payload.number_id);
  if (!scenario) {
    return { ok: false, status: 422, error: "Unknown scenario." };
  }
  if (!number) {
    return { ok: false, status: 422, error: "Unknown number." };
  }
  if (number.voice_enabled !== "yes") {
    return { ok: false, status: 422, error: "Selected number is not voice enabled." };
  }
  nextCallOrdinal += 1;
  const callId = `CALL-LAB-${nextCallOrdinal}`;
  const call = buildCall(callId, scenario, number.number_id);
  calls.unshift(call);
  return { ok: true, status: 201, call: clone(call), calls: listCalls() };
}

function advanceCall(callId) {
  const call = calls.find((row) => row.call_id === callId);
  if (!call) {
    return { ok: false, status: 404, error: "Call not found." };
  }
  if (!call.can_advance) {
    return { ok: false, status: 422, error: "Call cannot advance further." };
  }
  call.can_advance = false;
  call.status = call.status === "evidence_pending" ? "submitted" : call.status;
  call.events.push({
    event_id: `${call.call_id}-${call.events.length + 1}`,
    state: call.status === "submitted" ? "submitted" : "closed",
    label: call.status === "submitted" ? "submitted" : "closed",
    tone: "success",
    detail:
      call.status === "submitted"
        ? "Call evidence is ready to feed the canonical intake convergence path."
        : "The scenario reached its terminal mock posture.",
    at: new Date().toISOString(),
  });
  return { ok: true, status: 200, call: clone(call), calls: listCalls() };
}

function retryWebhook(callId) {
  const call = calls.find((row) => row.call_id === callId);
  if (!call) {
    return { ok: false, status: 404, error: "Call not found." };
  }
  if (!call.can_retry_webhook) {
    return { ok: false, status: 422, error: "Call has no retryable webhook fault." };
  }
  call.can_retry_webhook = false;
  call.webhook_state = "recovered";
  call.events.push(
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
      detail: "Recovered callback remains transport evidence only until Vecells settlement runs.",
      at: new Date(Date.now() + 60000).toISOString(),
    },
  );
  return { ok: true, status: 200, call: clone(call), calls: listCalls() };
}

export {
  PACK,
  advanceCall,
  assignNumber,
  getCall,
  health,
  listCalls,
  listNumbers,
  registry,
  releaseNumber,
  retryWebhook,
  simulateCall,
};
