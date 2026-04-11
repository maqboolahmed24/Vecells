import { useEffect, useState } from "react";

import { evidenceGateLabPack } from "./generated/evidenceGateLabPack";

type Pack = typeof evidenceGateLabPack;
type JobProfile = Pack["job_profiles"][number];
type TranscriptScenario = Pack["transcript_scenarios"][number];
type ScanScenario = Pack["scan_scenarios"][number];
type TranscriptJob = Pack["seeded_transcript_jobs"][number];
type ScanJob = Pack["seeded_scan_jobs"][number];
type LiveGate = Pack["live_gate_pack"]["live_gates"][number];
type RegionPolicy = Pack["region_policies"][number];
type RetentionPolicy = Pack["retention_policies"][number];
type QuarantinePolicy = Pack["quarantine_policies"][number];
type Page =
  | "Project_and_Environment_Setup"
  | "Transcript_Job_Profiles"
  | "Scan_and_Quarantine_Policies"
  | "Evidence_Event_Inspector"
  | "Live_Gates_and_Retention_Posture";
type Mode = "mock" | "actual";

type AppState = {
  mode: Mode;
  page: Page;
  selectedProfileId: string;
  selectedTranscriptScenarioId: string;
  selectedScanScenarioId: string;
  selectedTranscriptJobId: string;
  selectedScanJobId: string;
  transcriptionBaseUrl: string;
  scanBaseUrl: string;
  actualInputs: {
    vendorId: string;
    projectScope: string;
    regionPolicyRef: string;
    retentionPolicyRef: string;
    callbackBaseUrl: string;
    secretRef: string;
    bucketRef: string;
    scanPolicyRef: string;
    targetEnvironment: string;
    namedApprover: string;
    allowMutation: string;
    allowSpend: string;
  };
  reducedMotion: boolean;
};

type ServiceHealth = {
  status: string;
  job_count?: number;
  active_job_count?: number;
  partial_count?: number;
  callback_alert_count?: number;
  scan_count?: number;
  quarantine_count?: number;
  unreadable_count?: number;
};

const STORAGE_KEY = "evidence-gate-lab-state";
const PAGE_ORDER: readonly Page[] = [
  "Project_and_Environment_Setup",
  "Transcript_Job_Profiles",
  "Scan_and_Quarantine_Policies",
  "Evidence_Event_Inspector",
  "Live_Gates_and_Retention_Posture",
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function jobProfileById(id: string): JobProfile {
  return evidenceGateLabPack.job_profiles.find((row) => row.job_profile_id === id) ?? evidenceGateLabPack.job_profiles[0];
}

function transcriptScenarioById(id: string): TranscriptScenario {
  return (
    evidenceGateLabPack.transcript_scenarios.find((row) => row.scenario_id === id) ??
    evidenceGateLabPack.transcript_scenarios[0]
  );
}

function scanScenarioById(id: string): ScanScenario {
  return evidenceGateLabPack.scan_scenarios.find((row) => row.scenario_id === id) ?? evidenceGateLabPack.scan_scenarios[0];
}

function regionPolicyById(id: string): RegionPolicy | undefined {
  return evidenceGateLabPack.region_policies.find((row) => row.region_policy_ref === id);
}

function retentionPolicyById(id: string): RetentionPolicy | undefined {
  return evidenceGateLabPack.retention_policies.find((row) => row.retention_policy_ref === id);
}

function quarantinePolicyById(id: string): QuarantinePolicy | undefined {
  return evidenceGateLabPack.quarantine_policies.find((row) => row.quarantine_policy_ref === id);
}

function initialState(): AppState {
  const params = new URLSearchParams(window.location.search);
  const base: AppState = {
    mode: params.get("mode") === "actual" ? "actual" : "mock",
    page: ((params.get("page") as Page | null) ?? "Project_and_Environment_Setup"),
    selectedProfileId: evidenceGateLabPack.job_profiles[0].job_profile_id,
    selectedTranscriptScenarioId: evidenceGateLabPack.transcript_scenarios[0].scenario_id,
    selectedScanScenarioId: evidenceGateLabPack.scan_scenarios[0].scenario_id,
    selectedTranscriptJobId: evidenceGateLabPack.seeded_transcript_jobs[0].job_id,
    selectedScanJobId: evidenceGateLabPack.seeded_scan_jobs[0].scan_job_id,
    transcriptionBaseUrl:
      params.get("transcriptionBaseUrl") ??
      evidenceGateLabPack.mock_service.base_url_default.transcription_engine,
    scanBaseUrl:
      params.get("scanBaseUrl") ?? evidenceGateLabPack.mock_service.base_url_default.artifact_scan_gateway,
    actualInputs: {
      vendorId: evidenceGateLabPack.live_gate_pack.allowed_vendor_ids[0],
      projectScope: evidenceGateLabPack.project_scopes[0].project_scope,
      regionPolicyRef: evidenceGateLabPack.region_policies[1].region_policy_ref,
      retentionPolicyRef: evidenceGateLabPack.retention_policies[0].retention_policy_ref,
      callbackBaseUrl: "https://example.invalid/evidence-gate",
      secretRef: "vault://evidence/provider/webhook",
      bucketRef: "s3://vecells-evidence-nonprod",
      scanPolicyRef: evidenceGateLabPack.scan_and_quarantine_policy_rows[0].scan_policy_ref,
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

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }
  return payload;
}

function HealthChip({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <span className={`status-chip ${tone ?? ""}`.trim()}>
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

function App() {
  const [appState, setAppState] = useState<AppState>(initialState);
  const [transcriptJobs, setTranscriptJobs] = useState<TranscriptJob[]>(
    evidenceGateLabPack.seeded_transcript_jobs.map((row) => clone(row)),
  );
  const [scanJobs, setScanJobs] = useState<ScanJob[]>(
    evidenceGateLabPack.seeded_scan_jobs.map((row) => clone(row)),
  );
  const [transcriptionHealth, setTranscriptionHealth] = useState<ServiceHealth>({ status: "checking" });
  const [scanHealth, setScanHealth] = useState<ServiceHealth>({ status: "checking" });
  const [serviceStatus, setServiceStatus] = useState("checking");
  const [error, setError] = useState<string | null>(null);

  const selectedProfile = jobProfileById(appState.selectedProfileId);
  const selectedTranscriptScenario = transcriptScenarioById(appState.selectedTranscriptScenarioId);
  const selectedScanScenario = scanScenarioById(appState.selectedScanScenarioId);
  const selectedTranscriptJob =
    transcriptJobs.find((row) => row.job_id === appState.selectedTranscriptJobId) ?? transcriptJobs[0];
  const selectedScanJob = scanJobs.find((row) => row.scan_job_id === appState.selectedScanJobId) ?? scanJobs[0];
  const currentRegionPolicy = regionPolicyById(selectedProfile.region_policy_ref);
  const currentRetentionPolicy = retentionPolicyById(selectedProfile.retention_policy_ref);
  const currentQuarantinePolicy = quarantinePolicyById(selectedProfile.quarantine_policy_ref);

  const actualSubmitDisabled =
    evidenceGateLabPack.phase0_verdict === "withheld" ||
    !appState.actualInputs.namedApprover.trim() ||
    appState.actualInputs.allowMutation !== "true" ||
    appState.actualInputs.allowSpend !== "true";

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
        setServiceStatus("syncing");
        const [transcriptionRegistry, transcriptionJobsPayload, scanRegistry, scanJobsPayload] = await Promise.all([
          fetchJson<{ health: ServiceHealth }>(`${appState.transcriptionBaseUrl}/api/health`),
          fetchJson<{ jobs: TranscriptJob[] }>(`${appState.transcriptionBaseUrl}/api/jobs`),
          fetchJson<{ health: ServiceHealth }>(`${appState.scanBaseUrl}/api/health`),
          fetchJson<{ scans: ScanJob[] }>(`${appState.scanBaseUrl}/api/scans`),
        ]);
        if (cancelled) {
          return;
        }
        setTranscriptionHealth(transcriptionRegistry.health);
        setTranscriptJobs(transcriptionJobsPayload.jobs);
        setScanHealth(scanRegistry.health);
        setScanJobs(scanJobsPayload.scans);
        setServiceStatus("live");
        setError(null);
      } catch (reason) {
        if (!cancelled) {
          setServiceStatus("degraded");
          setError(reason instanceof Error ? reason.message : "Service sync failed.");
        }
      }
    }
    void syncRemote();
    return () => {
      cancelled = true;
    };
  }, [appState.transcriptionBaseUrl, appState.scanBaseUrl]);

  function updateState(update: Partial<AppState>) {
    setAppState((current) => ({ ...current, ...update }));
  }

  function updateActualField<K extends keyof AppState["actualInputs"]>(key: K, value: AppState["actualInputs"][K]) {
    setAppState((current) => ({
      ...current,
      actualInputs: {
        ...current.actualInputs,
        [key]: value,
      },
    }));
  }

  async function refreshTranscripts() {
    const [healthPayload, jobsPayload] = await Promise.all([
      fetchJson<{ health: ServiceHealth }>(`${appState.transcriptionBaseUrl}/api/health`),
      fetchJson<{ jobs: TranscriptJob[] }>(`${appState.transcriptionBaseUrl}/api/jobs`),
    ]);
    setTranscriptionHealth(healthPayload.health);
    setTranscriptJobs(jobsPayload.jobs);
  }

  async function refreshScans() {
    const [healthPayload, scansPayload] = await Promise.all([
      fetchJson<{ health: ServiceHealth }>(`${appState.scanBaseUrl}/api/health`),
      fetchJson<{ scans: ScanJob[] }>(`${appState.scanBaseUrl}/api/scans`),
    ]);
    setScanHealth(healthPayload.health);
    setScanJobs(scansPayload.scans);
  }

  async function simulateTranscript() {
    const payload = await fetchJson<{ job: TranscriptJob; jobs: TranscriptJob[] }>(
      `${appState.transcriptionBaseUrl}/api/jobs/simulate`,
      {
        method: "POST",
        body: JSON.stringify({
          job_profile_id: selectedProfile.provider_family === "transcription"
            ? selectedProfile.job_profile_id
            : evidenceGateLabPack.job_profiles.find((row) => row.provider_family === "transcription")?.job_profile_id,
          scenario_id: appState.selectedTranscriptScenarioId,
        }),
      },
    );
    setTranscriptJobs(payload.jobs);
    updateState({
      page: "Transcript_Job_Profiles",
      selectedTranscriptJobId: payload.job.job_id,
    });
    await refreshTranscripts();
  }

  async function retryTranscriptWebhook() {
    if (!selectedTranscriptJob) {
      return;
    }
    const payload = await fetchJson<{ job: TranscriptJob; jobs: TranscriptJob[] }>(
      `${appState.transcriptionBaseUrl}/api/jobs/${selectedTranscriptJob.job_id}/retry-webhook`,
      { method: "POST", body: JSON.stringify({}) },
    );
    setTranscriptJobs(payload.jobs);
    updateState({ selectedTranscriptJobId: payload.job.job_id });
    await refreshTranscripts();
  }

  async function supersedeTranscript() {
    if (!selectedTranscriptJob) {
      return;
    }
    const payload = await fetchJson<{ job: TranscriptJob; jobs: TranscriptJob[] }>(
      `${appState.transcriptionBaseUrl}/api/jobs/${selectedTranscriptJob.job_id}/supersede`,
      { method: "POST", body: JSON.stringify({}) },
    );
    setTranscriptJobs(payload.jobs);
    updateState({ selectedTranscriptJobId: payload.job.job_id });
    await refreshTranscripts();
  }

  async function simulateScan() {
    const payload = await fetchJson<{ scan: ScanJob; scans: ScanJob[] }>(
      `${appState.scanBaseUrl}/api/scans/simulate`,
      {
        method: "POST",
        body: JSON.stringify({
          job_profile_id: selectedProfile.provider_family === "artifact_scanning"
            ? selectedProfile.job_profile_id
            : evidenceGateLabPack.job_profiles.find((row) => row.provider_family === "artifact_scanning")?.job_profile_id,
          scenario_id: appState.selectedScanScenarioId,
        }),
      },
    );
    setScanJobs(payload.scans);
    updateState({
      page: "Scan_and_Quarantine_Policies",
      selectedScanJobId: payload.scan.scan_job_id,
    });
    await refreshScans();
  }

  async function retryScanWebhook() {
    if (!selectedScanJob) {
      return;
    }
    const payload = await fetchJson<{ scan: ScanJob; scans: ScanJob[] }>(
      `${appState.scanBaseUrl}/api/scans/${selectedScanJob.scan_job_id}/retry-webhook`,
      { method: "POST", body: JSON.stringify({}) },
    );
    setScanJobs(payload.scans);
    updateState({ selectedScanJobId: payload.scan.scan_job_id });
    await refreshScans();
  }

  async function reviewScan() {
    if (!selectedScanJob) {
      return;
    }
    const payload = await fetchJson<{ scan: ScanJob; scans: ScanJob[] }>(
      `${appState.scanBaseUrl}/api/scans/${selectedScanJob.scan_job_id}/review`,
      { method: "POST", body: JSON.stringify({}) },
    );
    setScanJobs(payload.scans);
    updateState({ selectedScanJobId: payload.scan.scan_job_id });
    await refreshScans();
  }

  const transcriptProfiles = evidenceGateLabPack.job_profiles.filter((row) => row.provider_family === "transcription");
  const scanProfiles = evidenceGateLabPack.job_profiles.filter((row) => row.provider_family === "artifact_scanning");
  const guidanceMatches = evidenceGateLabPack.official_vendor_guidance.filter((row) =>
    selectedProfile.provider_family === row.provider_family,
  );

  return (
    <main className="evidence-shell" data-testid="evidence-gate-lab-shell">
      <header className="top-banner">
        <div className="brand-group">
          <div className="mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
              <path d="M14 18h10l8 22 8-22h10L36 48h-8L14 18Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="ribbon">MOCK_EVIDENCE_GATE_LAB</div>
            <h1>Evidence Gate Lab</h1>
            <p>Transcript readiness and quarantine law stay visible all the way to the live gates.</p>
          </div>
        </div>
        <div className="banner-status">
          <HealthChip label="active jobs" value={transcriptJobs.length + scanJobs.length} tone="primary" />
          <HealthChip label="quarantine count" value={scanHealth.quarantine_count ?? 0} tone="quarantine" />
          <HealthChip
            label="webhook health"
            value={(transcriptionHealth.callback_alert_count ?? 0) + (scanHealth.callback_alert_count ?? 0)}
            tone="secondary"
          />
          <HealthChip
            label="motion"
            value={appState.reducedMotion ? "reduced" : "standard"}
            tone="muted"
          />
        </div>
        <div className="mode-toggle" data-testid="mode-toggle">
          <button
            type="button"
            data-testid="mode-toggle-mock"
            className={appState.mode === "mock" ? "active" : ""}
            onClick={() => updateState({ mode: "mock" })}
          >
            Mock now
          </button>
          <button
            type="button"
            data-testid="mode-toggle-actual"
            className={appState.mode === "actual" ? "active" : ""}
            onClick={() => updateState({ mode: "actual", page: "Live_Gates_and_Retention_Posture" })}
          >
            Actual later
          </button>
        </div>
      </header>

      <nav className="page-tabs" aria-label="Evidence gate pages">
        {PAGE_ORDER.map((page) => (
          <button
            key={page}
            type="button"
            data-testid={`page-tab-${page}`}
            className={appState.page === page ? "active" : ""}
            onClick={() => updateState({ page })}
          >
            {page.split("_").join(" ")}
          </button>
        ))}
      </nav>

      <div className="main-layout">
        <aside className="job-rail" data-testid="job-rail">
          <section className="rail-section">
            <h2>Transcript profiles</h2>
            {transcriptProfiles.map((profile) => (
              <button
                key={profile.job_profile_id}
                type="button"
                className={`profile-button ${appState.selectedProfileId === profile.job_profile_id ? "active" : ""}`}
                data-testid={`job-profile-${profile.job_profile_id}`}
                onClick={() => updateState({ selectedProfileId: profile.job_profile_id })}
              >
                <span>{profile.profile_label}</span>
                <small>{profile.environment}</small>
              </button>
            ))}
          </section>
          <section className="rail-section">
            <h2>Scan profiles</h2>
            {scanProfiles.map((profile) => (
              <button
                key={profile.job_profile_id}
                type="button"
                className={`profile-button ${appState.selectedProfileId === profile.job_profile_id ? "active" : ""}`}
                data-testid={`job-profile-${profile.job_profile_id}`}
                onClick={() => updateState({ selectedProfileId: profile.job_profile_id })}
              >
                <span>{profile.profile_label}</span>
                <small>{profile.environment}</small>
              </button>
            ))}
          </section>
        </aside>

        <section className="workspace" data-testid="workspace">
          {appState.page === "Project_and_Environment_Setup" && (
            <>
              <section className="surface cluster">
                <div>
                  <h2>Project and environment setup</h2>
                  <p>
                    Mock services are live at <code>{appState.transcriptionBaseUrl}</code> and{" "}
                    <code>{appState.scanBaseUrl}</code>. The lab keeps those endpoints local while the real-later
                    project model stays blocked.
                  </p>
                </div>
                <div className="cluster cluster-end">
                  <HealthChip label="service state" value={serviceStatus} tone={serviceStatus === "live" ? "good" : "warn"} />
                  <span className="support-note" data-testid="reduced-motion-indicator">
                    {appState.reducedMotion ? "reduced motion enabled" : "standard motion active"}
                  </span>
                </div>
              </section>

              <section className="surface metrics-strip">
                {evidenceGateLabPack.environment_profiles.map((profile) => (
                  <article key={profile.environment_profile} className="metric-article">
                    <span className="eyebrow">{profile.environment_profile}</span>
                    <strong>{profile.label}</strong>
                    <p>{profile.description}</p>
                  </article>
                ))}
              </section>

              <section className="surface">
                <h3>Shortlisted later providers</h3>
                <div className="provider-grid">
                  {evidenceGateLabPack.shortlisted_vendors.map((vendor) => (
                    <article key={vendor.vendor_id} className="provider-card">
                      <span className={`provider-tone ${vendor.provider_family}`}>{vendor.provider_family}</span>
                      <strong>{vendor.vendor_name}</strong>
                      <p>{vendor.notes}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="surface split-surface">
                <article>
                  <h3>Project scopes</h3>
                  <ul className="plain-list">
                    {evidenceGateLabPack.project_scopes.map((scope) => (
                      <li key={scope.project_scope}>
                        <strong>{scope.project_scope}</strong>
                        <p>{scope.summary}</p>
                      </li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h3>Selected access rows</h3>
                  <ul className="plain-list">
                    {evidenceGateLabPack.selected_access_rows.map((row) => (
                      <li key={row.account_or_secret_id}>
                        <strong>{row.account_or_secret_id}</strong>
                        <p>
                          {row.record_class} · {row.environment} · {row.owner_role}
                        </p>
                      </li>
                    ))}
                  </ul>
                </article>
              </section>
            </>
          )}

          {appState.page === "Transcript_Job_Profiles" && (
            <>
              <section className="surface">
                <div className="section-head">
                  <div>
                    <h2>Transcript job profiles</h2>
                    <p>Keep partial, ready, failed, and superseded states distinct from evidence admissibility.</p>
                  </div>
                  <div className="control-row">
                    <select
                      value={appState.selectedTranscriptScenarioId}
                      onChange={(event) => updateState({ selectedTranscriptScenarioId: event.target.value })}
                      data-testid="transcript-scenario-select"
                    >
                      {evidenceGateLabPack.transcript_scenarios.map((row) => (
                        <option key={row.scenario_id} value={row.scenario_id}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" data-testid="simulate-transcript-button" onClick={() => void simulateTranscript()}>
                      Simulate transcript
                    </button>
                  </div>
                </div>

                <div className="state-preview-grid">
                  <article className="state-preview transcript">
                    <span className="eyebrow">Selected scenario</span>
                    <strong>{selectedTranscriptScenario.label}</strong>
                    <p>{selectedTranscriptScenario.summary}</p>
                    <div className="tag-row">
                      <span className="tag transcript">{selectedTranscriptScenario.transcript_state}</span>
                      <span className="tag">{selectedTranscriptScenario.readiness_state}</span>
                      <span className="tag">{selectedTranscriptScenario.webhook_signature_state}</span>
                    </div>
                  </article>
                  <article className="state-preview">
                    <span className="eyebrow">Selected job</span>
                    <strong>{selectedTranscriptJob?.job_id ?? "no job"}</strong>
                    <p>{selectedTranscriptJob?.summary ?? "Select or simulate a transcript job."}</p>
                    <div className="action-row">
                      <button
                        type="button"
                        data-testid="transcript-retry-button"
                        disabled={!selectedTranscriptJob?.can_retry_webhook}
                        onClick={() => void retryTranscriptWebhook()}
                      >
                        Retry webhook
                      </button>
                      <button
                        type="button"
                        data-testid="transcript-supersede-button"
                        disabled={!selectedTranscriptJob?.can_supersede}
                        onClick={() => void supersedeTranscript()}
                      >
                        Supersede
                      </button>
                    </div>
                  </article>
                </div>
              </section>

              <section className="surface">
                <h3>Transcript jobs</h3>
                <div className="job-list">
                  {transcriptJobs.map((job) => (
                    <button
                      type="button"
                      key={job.job_id}
                      className={`job-card ${job.job_id === selectedTranscriptJob?.job_id ? "active" : ""}`}
                      onClick={() => updateState({ selectedTranscriptJobId: job.job_id, page: "Evidence_Event_Inspector" })}
                    >
                      <span className="mono">{job.job_id}</span>
                      <strong>{job.transcript_state}</strong>
                      <p>{job.summary}</p>
                      <small>{job.readiness_state}</small>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {appState.page === "Scan_and_Quarantine_Policies" && (
            <>
              <section className="surface">
                <div className="section-head">
                  <div>
                    <h2>Scan and quarantine policies</h2>
                    <p>Clean, suspicious, quarantined, unreadable, and failed stay separate all the way to release.</p>
                  </div>
                  <div className="control-row">
                    <select
                      value={appState.selectedScanScenarioId}
                      onChange={(event) => updateState({ selectedScanScenarioId: event.target.value })}
                      data-testid="scan-scenario-select"
                    >
                      {evidenceGateLabPack.scan_scenarios.map((row) => (
                        <option key={row.scenario_id} value={row.scenario_id}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" data-testid="simulate-scan-button" onClick={() => void simulateScan()}>
                      Simulate scan
                    </button>
                  </div>
                </div>

                <div className="state-preview-grid">
                  <article className="state-preview scan">
                    <span className="eyebrow">Selected scenario</span>
                    <strong>{selectedScanScenario.label}</strong>
                    <p>{selectedScanScenario.summary}</p>
                    <div className="tag-row">
                      <span className="tag scan">{selectedScanScenario.scan_state}</span>
                      <span className="tag quarantine">{selectedScanScenario.quarantine_state}</span>
                      <span className="tag">{selectedScanScenario.webhook_signature_state}</span>
                    </div>
                  </article>
                  <article className="state-preview">
                    <span className="eyebrow">Selected scan job</span>
                    <strong>{selectedScanJob?.scan_job_id ?? "no job"}</strong>
                    <p>{selectedScanJob?.summary ?? "Select or simulate a scan job."}</p>
                    <div className="action-row">
                      <button
                        type="button"
                        data-testid="scan-retry-button"
                        disabled={!selectedScanJob?.can_retry_webhook}
                        onClick={() => void retryScanWebhook()}
                      >
                        Retry callback
                      </button>
                      <button
                        type="button"
                        data-testid="scan-review-button"
                        disabled={!selectedScanJob?.can_review}
                        onClick={() => void reviewScan()}
                      >
                        Review hold
                      </button>
                    </div>
                  </article>
                </div>
              </section>

              <section className="surface">
                <h3>Policy matrix</h3>
                <div className="policy-table-wrap">
                  <table className="policy-table">
                    <thead>
                      <tr>
                        <th>Policy</th>
                        <th>Environment</th>
                        <th>Verdict</th>
                        <th>Quarantine</th>
                        <th>Fallback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceGateLabPack.scan_and_quarantine_policy_rows.map((row) => (
                        <tr key={row.policy_row_id}>
                          <td>{row.scan_policy_ref}</td>
                          <td>{row.environment}</td>
                          <td>{row.verdict_state}</td>
                          <td>{row.quarantine_action}</td>
                          <td>{row.fallback_review_action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="surface">
                <h3>Scan jobs</h3>
                <div className="job-list">
                  {scanJobs.map((job) => (
                    <button
                      type="button"
                      key={job.scan_job_id}
                      className={`job-card ${job.scan_job_id === selectedScanJob?.scan_job_id ? "active" : ""}`}
                      onClick={() => updateState({ selectedScanJobId: job.scan_job_id, page: "Evidence_Event_Inspector" })}
                    >
                      <span className="mono">{job.scan_job_id}</span>
                      <strong>{job.scan_state}</strong>
                      <p>{job.summary}</p>
                      <small>{job.quarantine_state}</small>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {appState.page === "Evidence_Event_Inspector" && (
            <section className="surface event-inspector" data-testid="event-inspector">
              <div className="section-head">
                <div>
                  <h2>Evidence event inspector</h2>
                  <p>Inspect transcript and scan timelines together so completion never outruns quarantine or fallback law.</p>
                </div>
              </div>
              <div className="timeline-grid">
                <article>
                  <h3>{selectedTranscriptJob?.job_id ?? "Transcript"}</h3>
                  <div className="timeline-list">
                    {selectedTranscriptJob?.timeline_events.map((event) => (
                      <div key={event.event_id} className="timeline-item">
                        <span className={`tone-${event.tone}`}>{event.label}</span>
                        <strong>{event.state}</strong>
                        <p>{event.detail}</p>
                      </div>
                    ))}
                  </div>
                </article>
                <article>
                  <h3>{selectedScanJob?.scan_job_id ?? "Scan"}</h3>
                  <div className="timeline-list">
                    {selectedScanJob?.timeline_events.map((event) => (
                      <div key={event.event_id} className="timeline-item">
                        <span className={`tone-${event.tone}`}>{event.label}</span>
                        <strong>{event.state}</strong>
                        <p>{event.detail}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
              <div className="json-grid">
                <pre>{JSON.stringify(selectedTranscriptJob, null, 2)}</pre>
                <pre>{JSON.stringify(selectedScanJob, null, 2)}</pre>
              </div>
            </section>
          )}

          {appState.page === "Live_Gates_and_Retention_Posture" && (
            <section className="surface">
              <div className="section-head">
                <div>
                  <h2>Live gates and retention posture</h2>
                  <p>All fields stay visible now, but real project creation remains blocked while Phase 0 is withheld.</p>
                </div>
                <div className="gate-summary">
                  <HealthChip label="blocked" value={evidenceGateLabPack.summary.blocking_live_gate_count} tone="quarantine" />
                  <HealthChip label="review" value={evidenceGateLabPack.summary.review_live_gate_count} tone="secondary" />
                  <HealthChip label="pass" value={evidenceGateLabPack.summary.pass_live_gate_count} tone="good" />
                </div>
              </div>

              <div className="gate-grid">
                <div className="policy-table-wrap">
                  <table className="policy-table">
                    <thead>
                      <tr>
                        <th>Gate</th>
                        <th>Status</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceGateLabPack.live_gate_pack.live_gates.map((gate: LiveGate) => (
                        <tr key={gate.gate_id}>
                          <td>
                            <strong>{gate.title}</strong>
                            <p>{gate.reason}</p>
                          </td>
                          <td>{gate.status}</td>
                          <td>{gate.severity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <form className="actual-form" onSubmit={(event) => event.preventDefault()}>
                  <label>
                    Provider
                    <select
                      value={appState.actualInputs.vendorId}
                      data-testid="actual-field-vendor-id"
                      onChange={(event) => updateActualField("vendorId", event.target.value)}
                    >
                      {evidenceGateLabPack.live_gate_pack.allowed_vendor_ids.map((vendorId) => (
                        <option key={vendorId} value={vendorId}>
                          {vendorId}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Project scope
                    <select
                      value={appState.actualInputs.projectScope}
                      data-testid="actual-field-project-scope"
                      onChange={(event) => updateActualField("projectScope", event.target.value)}
                    >
                      {evidenceGateLabPack.project_scopes.map((scope) => (
                        <option key={scope.project_scope} value={scope.project_scope}>
                          {scope.project_scope}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Region policy
                    <select
                      value={appState.actualInputs.regionPolicyRef}
                      data-testid="actual-field-region-policy"
                      onChange={(event) => updateActualField("regionPolicyRef", event.target.value)}
                    >
                      {evidenceGateLabPack.region_policies.map((policy) => (
                        <option key={policy.region_policy_ref} value={policy.region_policy_ref}>
                          {policy.region_policy_ref}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Retention policy
                    <select
                      value={appState.actualInputs.retentionPolicyRef}
                      data-testid="actual-field-retention-policy"
                      onChange={(event) => updateActualField("retentionPolicyRef", event.target.value)}
                    >
                      {evidenceGateLabPack.retention_policies.map((policy) => (
                        <option key={policy.retention_policy_ref} value={policy.retention_policy_ref}>
                          {policy.retention_policy_ref}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Callback base URL
                    <input
                      type="text"
                      value={appState.actualInputs.callbackBaseUrl}
                      data-testid="actual-field-callback-base"
                      onChange={(event) => updateActualField("callbackBaseUrl", event.target.value)}
                    />
                  </label>
                  <label>
                    Secret ref
                    <input
                      type="text"
                      value={appState.actualInputs.secretRef}
                      data-testid="actual-field-secret-ref"
                      onChange={(event) => updateActualField("secretRef", event.target.value)}
                    />
                  </label>
                  <label>
                    Bucket or storage ref
                    <input
                      type="text"
                      value={appState.actualInputs.bucketRef}
                      data-testid="actual-field-bucket-ref"
                      onChange={(event) => updateActualField("bucketRef", event.target.value)}
                    />
                  </label>
                  <label>
                    Scan policy
                    <select
                      value={appState.actualInputs.scanPolicyRef}
                      data-testid="actual-field-scan-policy"
                      onChange={(event) => updateActualField("scanPolicyRef", event.target.value)}
                    >
                      {evidenceGateLabPack.scan_and_quarantine_policy_rows.map((row) => (
                        <option key={row.scan_policy_ref} value={row.scan_policy_ref}>
                          {row.scan_policy_ref}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Target environment
                    <select
                      value={appState.actualInputs.targetEnvironment}
                      data-testid="actual-field-target-environment"
                      onChange={(event) => updateActualField("targetEnvironment", event.target.value)}
                    >
                      {evidenceGateLabPack.environment_profiles.map((profile) => (
                        <option key={profile.environment_profile} value={profile.environment_profile}>
                          {profile.environment_profile}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Named approver
                    <input
                      type="text"
                      value={appState.actualInputs.namedApprover}
                      data-testid="actual-field-named-approver"
                      onChange={(event) => updateActualField("namedApprover", event.target.value)}
                    />
                  </label>
                  <label>
                    Allow mutation
                    <select
                      value={appState.actualInputs.allowMutation}
                      data-testid="actual-field-allow-mutation"
                      onChange={(event) => updateActualField("allowMutation", event.target.value)}
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                  <label>
                    Allow spend
                    <select
                      value={appState.actualInputs.allowSpend}
                      data-testid="actual-field-allow-spend"
                      onChange={(event) => updateActualField("allowSpend", event.target.value)}
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                  <button type="submit" data-testid="actual-submit-button" disabled={actualSubmitDisabled}>
                    Real project mutation blocked
                  </button>
                </form>
              </div>
            </section>
          )}
        </section>

        <aside className="policy-drawer" data-testid="policy-drawer">
          <section className="surface inspector-card">
            <h2>Policy inspector</h2>
            <p>{selectedProfile.notes}</p>
            <div className="inspector-stack">
              <article>
                <span className="eyebrow">mock now</span>
                <p>{selectedProfile.mock_now_use}</p>
              </article>
              <article>
                <span className="eyebrow">actual later</span>
                <p>{selectedProfile.actual_later_use}</p>
              </article>
            </div>
          </section>

          <section className="surface inspector-card">
            <h3>Region</h3>
            <strong>{currentRegionPolicy?.region_policy_ref}</strong>
            <p>{currentRegionPolicy?.operator_rule}</p>
          </section>

          <section className="surface inspector-card">
            <h3>Retention</h3>
            <strong>{currentRetentionPolicy?.retention_policy_ref}</strong>
            <p>{currentRetentionPolicy?.notes}</p>
          </section>

          <section className="surface inspector-card">
            <h3>Quarantine</h3>
            <strong>{currentQuarantinePolicy?.quarantine_policy_ref}</strong>
            <p>{currentQuarantinePolicy?.release_rule}</p>
          </section>

          <section className="surface inspector-card">
            <h3>Official guidance</h3>
            <ul className="plain-list compact">
              {guidanceMatches.slice(0, 4).map((entry) => (
                <li key={entry.source_id}>
                  <strong>{entry.title}</strong>
                  <p>{entry.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="pipeline-surface" data-testid="lower-diagram">
        <div className="pipeline-node">ingest</div>
        <div className="pipeline-arrow" />
        <div className="pipeline-node scan">scan</div>
        <div className="pipeline-arrow" />
        <div className="pipeline-node quarantine">quarantine or pass</div>
        <div className="pipeline-arrow" />
        <div className="pipeline-node transcript">transcript</div>
        <div className="pipeline-arrow" />
        <div className="pipeline-node">readiness</div>
        <div className="pipeline-arrow" />
        <div className="pipeline-node">fallback or continue</div>
      </section>

      {error ? <div className="floating-error">{error}</div> : null}
    </main>
  );
}

export default App;
