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
  PACK.job_profiles.filter((row) => row.provider_family === "transcription").map((row) => [row.job_profile_id, row]),
);
const scenarioMap = new Map(PACK.transcript_scenarios.map((row) => [row.scenario_id, row]));

let jobs = PACK.seeded_transcript_jobs.map((row) => JSON.parse(JSON.stringify(row)));
let nextOrdinal = 5000;

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

function listJobs() {
  return clone(jobs).sort((a, b) => b.job_id.localeCompare(a.job_id));
}

function health() {
  return {
    status: "healthy",
    job_count: jobs.length,
    active_job_count: jobs.filter((row) => row.readiness_state !== "settled").length,
    partial_count: jobs.filter((row) => row.transcript_state === "partial").length,
    callback_alert_count: jobs.filter((row) => row.webhook_signature_state === "signature_failed").length,
  };
}

function registry() {
  return {
    task_id: PACK.task_id,
    visual_mode: PACK.visual_mode,
    profiles: Array.from(profileMap.values()),
    scenarios: PACK.transcript_scenarios,
  };
}

function buildJob(jobId, profile, scenario) {
  const createdAt = new Date();
  return {
    job_id: jobId,
    job_profile_id: profile.job_profile_id,
    scenario_id: scenario.scenario_id,
    source_asset_ref: `runtime://transcript/${jobId.toLowerCase()}`,
    environment: profile.environment,
    vendor_mode: "mock_now",
    transcript_state: scenario.transcript_state,
    readiness_state: scenario.readiness_state,
    fallback_review_state: scenario.fallback_review_state,
    webhook_signature_state: scenario.webhook_signature_state,
    quality_band: scenario.quality_band,
    coverage_class: scenario.coverage_class,
    superseded_by_ref: "",
    summary: scenario.summary,
    timeline_events: materializeTimeline(jobId, scenario.timeline_templates, createdAt),
    can_retry_webhook: scenario.can_retry_webhook,
    can_supersede: scenario.can_supersede,
  };
}

function simulateJob(payload) {
  const profile = profileMap.get(payload.job_profile_id);
  const scenario = scenarioMap.get(payload.scenario_id);
  if (!profile) {
    return { ok: false, status: 422, error: "Unknown transcript job profile." };
  }
  if (!scenario) {
    return { ok: false, status: 422, error: "Unknown transcript scenario." };
  }
  nextOrdinal += 1;
  const jobId = `TRJ-${nextOrdinal}`;
  const job = buildJob(jobId, profile, scenario);
  jobs.unshift(job);
  return { ok: true, status: 201, job: clone(job), jobs: listJobs() };
}

function retryWebhook(jobId) {
  const job = jobs.find((row) => row.job_id === jobId);
  if (!job) {
    return { ok: false, status: 404, error: "Transcript job not found." };
  }
  if (!job.can_retry_webhook) {
    return { ok: false, status: 422, error: "Transcript job has no retryable webhook fault." };
  }
  const scenario = scenarioMap.get(job.scenario_id);
  const appended = materializeTimeline(job.job_id, scenario.retry_timeline_templates, new Date(), job.timeline_events.length);
  job.webhook_signature_state = "validated";
  job.readiness_state = "review_gate_open";
  job.can_retry_webhook = false;
  job.timeline_events.push(...appended);
  return { ok: true, status: 200, job: clone(job), jobs: listJobs() };
}

function supersedeJob(jobId) {
  const job = jobs.find((row) => row.job_id === jobId);
  if (!job) {
    return { ok: false, status: 404, error: "Transcript job not found." };
  }
  if (!job.can_supersede) {
    return { ok: false, status: 422, error: "Transcript job cannot be superseded right now." };
  }
  const scenario = scenarioMap.get(job.scenario_id);
  const replacementId = `${job.job_id}-R1`;
  const appended = materializeTimeline(
    job.job_id,
    scenario.supersede_timeline_templates,
    new Date(),
    job.timeline_events.length,
  );
  job.transcript_state = "superseded";
  job.readiness_state = "superseded";
  job.fallback_review_state = "replacement_binding_required";
  job.superseded_by_ref = replacementId;
  job.can_supersede = false;
  job.timeline_events.push(...appended);
  return { ok: true, status: 200, job: clone(job), jobs: listJobs() };
}

export {
  PACK,
  health,
  listJobs,
  registry,
  retryWebhook,
  simulateJob,
  supersedeJob,
};
