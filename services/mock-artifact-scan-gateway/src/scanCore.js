import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "35_evidence_processing_lab_pack.json"), "utf8"),
);

const profileMap = new Map(
  PACK.job_profiles.filter((row) => row.provider_family === "artifact_scanning").map((row) => [row.job_profile_id, row]),
);
const scenarioMap = new Map(PACK.scan_scenarios.map((row) => [row.scenario_id, row]));

let scans = PACK.seeded_scan_jobs.map((row) => JSON.parse(JSON.stringify(row)));
let nextOrdinal = 7000;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function materializeTimeline(itemId, templates, baseAt, startingIndex = 0) {
  return templates.map((event, index) => ({
    event_id: `${itemId}-E${startingIndex + index + 1}`,
    state: event.state,
    label: event.label,
    tone: event.tone,
    detail: event.detail,
    at: new Date(baseAt.getTime() + event.offset_minutes * 60_000).toISOString(),
  }));
}

function listScans() {
  return clone(scans).sort((a, b) => b.scan_job_id.localeCompare(a.scan_job_id));
}

function health() {
  return {
    status: "healthy",
    scan_count: scans.length,
    quarantine_count: scans.filter((row) => row.quarantine_state.includes("quarantine")).length,
    unreadable_count: scans.filter((row) => row.scan_state === "unreadable").length,
    callback_alert_count: scans.filter((row) => row.webhook_signature_state === "signature_failed").length,
  };
}

function registry() {
  return {
    task_id: PACK.task_id,
    visual_mode: PACK.visual_mode,
    profiles: Array.from(profileMap.values()),
    scenarios: PACK.scan_scenarios,
  };
}

function buildScan(scanJobId, profile, scenario) {
  const createdAt = new Date();
  return {
    scan_job_id: scanJobId,
    job_profile_id: profile.job_profile_id,
    scenario_id: scenario.scenario_id,
    object_ref: `runtime://scan/${scanJobId.toLowerCase()}`,
    environment: profile.environment,
    scan_state: scenario.scan_state,
    quarantine_state: scenario.quarantine_state,
    fallback_review_state: scenario.fallback_review_state,
    webhook_signature_state: scenario.webhook_signature_state,
    confidence_band: scenario.confidence_band,
    release_decision_state: scenario.release_decision_state,
    summary: scenario.summary,
    timeline_events: materializeTimeline(scanJobId, scenario.timeline_templates, createdAt),
    can_retry_webhook: scenario.can_retry_webhook,
    can_review: scenario.can_review,
  };
}

function simulateScan(payload) {
  const profile = profileMap.get(payload.job_profile_id);
  const scenario = scenarioMap.get(payload.scenario_id);
  if (!profile) {
    return { ok: false, status: 422, error: "Unknown scan job profile." };
  }
  if (!scenario) {
    return { ok: false, status: 422, error: "Unknown scan scenario." };
  }
  nextOrdinal += 1;
  const scanJobId = `SCN-${nextOrdinal}`;
  const scan = buildScan(scanJobId, profile, scenario);
  scans.unshift(scan);
  return { ok: true, status: 201, scan: clone(scan), scans: listScans() };
}

function retryWebhook(scanJobId) {
  const scan = scans.find((row) => row.scan_job_id === scanJobId);
  if (!scan) {
    return { ok: false, status: 404, error: "Scan job not found." };
  }
  if (!scan.can_retry_webhook) {
    return { ok: false, status: 422, error: "Scan job has no retryable callback fault." };
  }
  const scenario = scenarioMap.get(scan.scenario_id);
  const appended = materializeTimeline(
    scan.scan_job_id,
    scenario.retry_timeline_templates,
    new Date(),
    scan.timeline_events.length,
  );
  scan.webhook_signature_state = "validated";
  scan.quarantine_state = "held_pending_release";
  scan.can_retry_webhook = false;
  scan.timeline_events.push(...appended);
  return { ok: true, status: 200, scan: clone(scan), scans: listScans() };
}

function reviewScan(scanJobId) {
  const scan = scans.find((row) => row.scan_job_id === scanJobId);
  if (!scan) {
    return { ok: false, status: 404, error: "Scan job not found." };
  }
  if (!scan.can_review) {
    return { ok: false, status: 422, error: "Scan job is not reviewable right now." };
  }
  const scenario = scenarioMap.get(scan.scenario_id);
  const appended = materializeTimeline(
    scan.scan_job_id,
    scenario.review_timeline_templates,
    new Date(),
    scan.timeline_events.length,
  );
  if (scan.scan_state === "clean") {
    scan.release_decision_state = "released";
    scan.quarantine_state = "released";
  } else if (scan.scan_state === "unreadable") {
    scan.release_decision_state = "reacquire_requested";
    scan.fallback_review_state = "reacquire_requested";
  } else {
    scan.release_decision_state = "manual_review_complete";
  }
  scan.can_review = false;
  scan.timeline_events.push(...appended);
  return { ok: true, status: 200, scan: clone(scan), scans: listScans() };
}

export {
  PACK,
  health,
  listScans,
  registry,
  reviewScan,
  retryWebhook,
  simulateScan,
};
