import { useEffect, useState } from "react";
import { im1PairingPack } from "./generated/im1PairingPack";

type Pack = typeof im1PairingPack;
type Mode = "mock" | "actual";

const PAGE_ORDER = [
  "IM1_Readiness_Overview",
  "Prerequisites_Dossier",
  "SCAL_Artifact_Map",
  "Provider_Compatibility_Matrix",
  "Licence_and_RFC_Watch",
] as const;

type Page = (typeof PAGE_ORDER)[number];
type StageRow = Pack["stage_rows"][number];
type Artifact = Pack["artifacts"][number];
type FieldRow = Pack["fields"][number];
type ProviderRow = Pack["provider_register"]["route_family_matrix"][number];
type LiveGate = Pack["live_gate_pack"]["live_gates"][number];
type LicenceRow = Pack["provider_register"]["licence_register"][number];
type RfcWatchRow = Pack["rfc_watch"][number];

type AppState = {
  mode: Mode;
  page: Page;
  selectedStageId: string;
  selectedArtifactId: string;
  selectedProviderRowId: string;
  completedStageIds: string[];
  fieldValues: Record<string, string>;
  liveInputs: {
    mvpEvidenceUrl: string;
    sponsorName: string;
    commercialOwner: string;
    namedApprover: string;
    environmentTarget: string;
    allowMutation: string;
  };
  rosterRefreshedAt: string | null;
};

type LiveGateStatus = "pass" | "blocked" | "review_required";

const STORAGE_KEY = "interface-proof-atelier";
const STAGE_GROUP_ORDER = [
  "initiation",
  "unsupported_test",
  "supported_test",
  "assurance",
  "live",
  "rfc_watch",
] as const;

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function initialMode(): Mode {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "actual" ? "actual" : "mock";
}

function initialPage(): Page {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");
  if (page && PAGE_ORDER.includes(page as Page)) {
    return page as Page;
  }
  return "IM1_Readiness_Overview";
}

function makeFieldValues(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of im1PairingPack.fields) {
    values[field.field_id] = field.mock_value;
  }
  return values;
}

function initialState(): AppState {
  const base: AppState = {
    mode: initialMode(),
    page: initialPage(),
    selectedStageId: im1PairingPack.stage_rows[0].stage_id,
    selectedArtifactId: im1PairingPack.artifacts[0].artifact_id,
    selectedProviderRowId: im1PairingPack.provider_register.route_family_matrix[0].compatibility_row_id,
    completedStageIds: [],
    fieldValues: makeFieldValues(),
    liveInputs: {
      mvpEvidenceUrl: "",
      sponsorName: "",
      commercialOwner: "",
      namedApprover: "",
      environmentTarget: "",
      allowMutation: "false",
    },
    rosterRefreshedAt: null,
  };

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return base;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<AppState>;
    return {
      ...base,
      ...parsed,
      mode: initialMode(),
      page: initialPage(),
      fieldValues: { ...base.fieldValues, ...(parsed.fieldValues ?? {}) },
      liveInputs: { ...base.liveInputs, ...(parsed.liveInputs ?? {}) },
      completedStageIds: parsed.completedStageIds ?? [],
      rosterRefreshedAt: parsed.rosterRefreshedAt ?? null,
    };
  } catch {
    return base;
  }
}

function fieldById(fieldId: string): FieldRow {
  return im1PairingPack.fields.find((field) => field.field_id === fieldId)!;
}

function stageById(stageId: string): StageRow {
  return im1PairingPack.stage_rows.find((stage) => stage.stage_id === stageId)!;
}

function artifactById(artifactId: string): Artifact {
  return im1PairingPack.artifacts.find((artifact) => artifact.artifact_id === artifactId)!;
}

function providerRowById(rowId: string): ProviderRow {
  return im1PairingPack.provider_register.route_family_matrix.find(
    (row) => row.compatibility_row_id === rowId,
  )!;
}

function providerLabel(providerId: string): string {
  return im1PairingPack.provider_register.providers.find(
    (provider) => provider.provider_supplier_id === providerId,
  )!.provider_supplier_name;
}

function liveGateStatusMap(state: AppState): Record<string, LiveGateStatus> {
  const statusMap: Record<string, LiveGateStatus> = {};

  for (const gate of im1PairingPack.live_gate_pack.live_gates) {
    let status = gate.status as LiveGateStatus;

    if (gate.gate_id === "LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE") {
      status =
        state.liveInputs.mvpEvidenceUrl.trim() &&
        state.completedStageIds.includes("product_profile_defined")
          ? "pass"
          : "blocked";
    } else if (gate.gate_id === "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN") {
      status =
        state.completedStageIds.includes("provider_supplier_targeting_ready") &&
        state.completedStageIds.includes("compatibility_claim_ready")
          ? "pass"
          : "review_required";
    } else if (gate.gate_id === "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT") {
      status =
        state.completedStageIds.includes("prerequisites_drafted") &&
        state.completedStageIds.includes("stage_one_scal_stub_ready") &&
        state.completedStageIds.includes("assurance_pack_in_progress")
          ? "pass"
          : "review_required";
    } else if (gate.gate_id === "LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER") {
      status =
        state.liveInputs.sponsorName.trim() && state.liveInputs.commercialOwner.trim()
          ? "pass"
          : "blocked";
    } else if (gate.gate_id === "LIVE_GATE_NAMED_APPROVER_PRESENT") {
      status = state.liveInputs.namedApprover.trim() ? "pass" : "blocked";
    } else if (gate.gate_id === "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT") {
      status = state.liveInputs.environmentTarget.trim() ? "pass" : "blocked";
    } else if (gate.gate_id === "LIVE_GATE_PROVIDER_ROSTER_REFRESH_REQUIRED") {
      status = state.rosterRefreshedAt ? "pass" : "blocked";
    } else if (gate.gate_id === "LIVE_GATE_MUTATION_FLAG_ENABLED") {
      status = state.liveInputs.allowMutation === "true" ? "pass" : "blocked";
    }

    statusMap[gate.gate_id] = status;
  }

  return statusMap;
}

function stageBlockers(
  stage: StageRow,
  state: AppState,
  gateStatuses: Record<string, LiveGateStatus>,
): string[] {
  const blockers: string[] = [];

  for (const prerequisiteId of stage.prerequisite_stage_ids) {
    if (!state.completedStageIds.includes(prerequisiteId)) {
      blockers.push(`BLOCKER_STAGE_PREREQ_${prerequisiteId.toUpperCase()}`);
    }
  }

  for (const gateId of stage.live_gate_refs) {
    if (gateStatuses[gateId] !== "pass") {
      blockers.push(gateId);
    }
  }

  if (
    state.mode === "mock" &&
    (stage.stage_class === "official_process" ||
      stage.stage_class === "provider_supplier_specific")
  ) {
    blockers.push("BLOCKER_MOCK_ONLY_VIEW");
  }

  return blockers;
}

function stageTone(
  stage: StageRow,
  state: AppState,
  gateStatuses: Record<string, LiveGateStatus>,
): "complete" | "ready" | "blocked" {
  if (state.completedStageIds.includes(stage.stage_id)) {
    return "complete";
  }
  return stageBlockers(stage, state, gateStatuses).length === 0 ? "ready" : "blocked";
}

function artifactFreshnessLabel(): "fresh" | "attention" | "blocked" {
  const assuranceArtifacts = im1PairingPack.artifacts.filter(
    (artifact) => artifact.artifact_group === "assurance",
  );
  const freshnessStates = assuranceArtifacts.map(
    (artifact) => artifact.freshness_posture as string,
  );
  if (freshnessStates.includes("blocked")) {
    return "blocked";
  }
  if (freshnessStates.includes("attention")) {
    return "attention";
  }
  return "fresh";
}

function groupStages(stageRows: readonly StageRow[]): Record<string, StageRow[]> {
  return stageRows.reduce<Record<string, StageRow[]>>((groups, stage) => {
    const group = groups[stage.stage_group] ?? [];
    groups[stage.stage_group] = [...group, stage];
    return groups;
  }, {});
}

function pageTitle(page: Page): string {
  return page.replace(/_/g, " ");
}

function prettyStatus(status: LiveGateStatus): string {
  if (status === "review_required") {
    return "review required";
  }
  return status;
}

function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [autosaveStamp, setAutosaveStamp] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  const selectedStage = stageById(state.selectedStageId);
  const selectedArtifact = artifactById(state.selectedArtifactId);
  const selectedProviderRow = providerRowById(state.selectedProviderRowId);
  const gateStatuses = liveGateStatusMap(state);
  const stageGroups = groupStages(im1PairingPack.stage_rows);
  const blockedGateCount = Object.values(gateStatuses).filter(
    (status) => status !== "pass",
  ).length;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("mode", state.mode);
    params.set("page", state.page);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [state.mode, state.page]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setAutosaveStamp(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, [state]);

  const activeBlockers = stageBlockers(selectedStage, state, gateStatuses);

  function setPage(page: Page) {
    setState((current) => ({ ...current, page }));
  }

  function setMode(mode: Mode) {
    setState((current) => ({ ...current, mode }));
  }

  function selectStage(stageId: string) {
    const stage = stageById(stageId);
    const firstArtifact = stage.required_artifacts[0] ?? state.selectedArtifactId;
    setState((current) => ({
      ...current,
      selectedStageId: stageId,
      selectedArtifactId: firstArtifact,
    }));
  }

  function completeSelectedStage() {
    if (stageTone(selectedStage, state, gateStatuses) !== "ready") {
      return;
    }
    setState((current) => ({
      ...current,
      completedStageIds: current.completedStageIds.includes(current.selectedStageId)
        ? current.completedStageIds
        : [...current.completedStageIds, current.selectedStageId],
    }));
  }

  function updateFieldValue(fieldId: string, value: string) {
    setState((current) => ({
      ...current,
      fieldValues: { ...current.fieldValues, [fieldId]: value },
    }));
  }

  function updateLiveInput(
    key: keyof AppState["liveInputs"],
    value: string,
  ) {
    setState((current) => ({
      ...current,
      liveInputs: { ...current.liveInputs, [key]: value },
    }));
  }

  function refreshRoster() {
    setState((current) => ({
      ...current,
      rosterRefreshedAt: new Date().toISOString(),
    }));
  }

  function renderFieldControl(field: FieldRow) {
    const value = state.fieldValues[field.field_id] ?? "";
    const isTextarea = field.field_type === "textarea";
    const isYesNo = field.field_type === "yes_no";

    if (isYesNo) {
      return (
        <select
          value={value}
          onChange={(event) => updateFieldValue(field.field_id, event.target.value)}
          data-testid={`field-${field.field_id}`}
        >
          <option value="yes">yes</option>
          <option value="no">no</option>
        </select>
      );
    }

    if (isTextarea) {
      return (
        <textarea
          value={value}
          onChange={(event) => updateFieldValue(field.field_id, event.target.value)}
          rows={4}
          data-testid={`field-${field.field_id}`}
        />
      );
    }

    return (
      <input
        value={value}
        type={field.field_type === "email" ? "email" : "text"}
        onChange={(event) => updateFieldValue(field.field_id, event.target.value)}
        data-testid={`field-${field.field_id}`}
      />
    );
  }

  function renderOverviewPage() {
    const stageArtifacts = selectedStage.required_artifacts.map((artifactId) =>
      artifactById(artifactId),
    );
    return (
      <div className="content-stack">
        <article className="panel dossier-card" data-testid="dossier-card-stage-summary">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Selected stage</p>
              <h2>{selectedStage.stage_name}</h2>
            </div>
            <span className={`status-chip ${stageTone(selectedStage, state, gateStatuses)}`}>
              {stageTone(selectedStage, state, gateStatuses)}
            </span>
          </div>
          <p className="muted">{selectedStage.notes}</p>
          <div className="info-grid">
            <div>
              <span>Entry conditions</span>
              <ul className="list">
                {selectedStage.entry_conditions.map((condition) => (
                  <li key={condition}>{condition}</li>
                ))}
              </ul>
            </div>
            <div>
              <span>Outputs</span>
              <ul className="list">
                {selectedStage.outputs.map((output) => (
                  <li key={output}>{output}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <article className="panel dossier-card" data-testid="dossier-card-gate-summary">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Live-gate digest</p>
              <h2>Current actual-provider posture</h2>
            </div>
            <span className="status-chip blocked">{blockedGateCount} blockers</span>
          </div>
          <div className="chip-row">
            {im1PairingPack.live_gate_pack.live_gates.map((gate) => (
              <span
                key={gate.gate_id}
                className={`status-chip ${gateStatuses[gate.gate_id]}`}
                data-testid={`gate-chip-${gate.gate_id}`}
              >
                {gate.gate_id}
              </span>
            ))}
          </div>
        </article>

        <article className="panel dossier-card" data-testid="dossier-card-required-artifacts">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Stage artifacts</p>
              <h2>Evidence linked to this stage</h2>
            </div>
          </div>
          <div className="artifact-grid">
            {stageArtifacts.map((artifact) => (
              <button
                type="button"
                key={artifact.artifact_id}
                className={`artifact-card ${
                  state.selectedArtifactId === artifact.artifact_id ? "selected" : ""
                }`}
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    selectedArtifactId: artifact.artifact_id,
                  }))
                }
                data-testid={`artifact-card-${artifact.artifact_id}`}
              >
                <strong>{artifact.artifact_name}</strong>
                <span className={`status-chip ${artifact.freshness_posture}`}>
                  {artifact.freshness_posture}
                </span>
                <p>{artifact.notes}</p>
              </button>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderDossierPage() {
    const sections = Array.from(
      new Set(im1PairingPack.fields.map((field) => field.section)),
    );
    return (
      <div className="content-stack">
        {sections.map((section) => {
          const sectionFields = im1PairingPack.fields.filter(
            (field) => field.section === section,
          );
          return (
            <article
              key={section}
              className="panel dossier-card"
              data-testid={`dossier-card-${section.replace(/ /g, "_")}`}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{sectionFields[0].origin_class}</p>
                  <h2>{section}</h2>
                </div>
                <span className="mono-tag">{sectionFields.length} fields</span>
              </div>
              <div className="field-grid">
                {sectionFields.map((field) => (
                  <label key={field.field_id} className="field-card">
                    <span className="field-label">{field.label}</span>
                    <span className="field-hint">{field.actual_placeholder}</span>
                    {renderFieldControl(field)}
                    <span className="field-meta">{field.required_for.join(", ")}</span>
                  </label>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  function renderScalPage() {
    return (
      <div className="content-stack">
        <article className="panel dossier-card" data-testid="dossier-card-scal-map">
          <div className="panel-header">
            <div>
              <p className="eyebrow">SCAL artifact map</p>
              <h2>Evidence, freshness, and ownership</h2>
            </div>
            <span className={`status-chip ${artifactFreshnessLabel()}`}>
              {artifactFreshnessLabel()}
            </span>
          </div>
          <div className="artifact-grid">
            {im1PairingPack.artifacts.map((artifact) => (
              <button
                type="button"
                key={artifact.artifact_id}
                className={`artifact-card ${
                  state.selectedArtifactId === artifact.artifact_id ? "selected" : ""
                }`}
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    selectedArtifactId: artifact.artifact_id,
                  }))
                }
                data-testid={`artifact-card-${artifact.artifact_id}`}
              >
                <div className="panel-header compact">
                  <strong>{artifact.artifact_name}</strong>
                  <span className={`status-chip ${artifact.mock_status}`}>
                    {artifact.mock_status}
                  </span>
                </div>
                <p>{artifact.notes}</p>
                <span className="field-meta">
                  {artifact.required_for_stage_ids.join(", ")}
                </span>
              </button>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderProviderPage() {
    return (
      <div className="content-stack">
        <article
          className="panel dossier-card"
          data-testid="dossier-card-provider-compatibility"
        >
          <div className="panel-header">
            <div>
              <p className="eyebrow">Provider compatibility</p>
              <h2>Selected provider row</h2>
            </div>
            <span className="mono-tag">{selectedProviderRow.im1_role}</span>
          </div>
          <div className="info-grid">
            <div>
              <span>Provider supplier</span>
              <p>{providerLabel(selectedProviderRow.provider_supplier_id)}</p>
            </div>
            <div>
              <span>Route family</span>
              <p>{selectedProviderRow.route_family_name}</p>
            </div>
            <div>
              <span>Current mock posture</span>
              <p>{selectedProviderRow.current_mock_position}</p>
            </div>
            <div>
              <span>Actual-provider posture</span>
              <p>{selectedProviderRow.actual_later_position}</p>
            </div>
          </div>
          <div className="callout">
            <strong>Truth guardrail</strong>
            <p>{selectedProviderRow.truth_guardrail}</p>
          </div>
        </article>
      </div>
    );
  }

  function renderLicencePage() {
    return (
      <div className="content-stack">
        <article className="panel dossier-card" data-testid="dossier-card-live-gates">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Actual-provider gate pack</p>
              <h2>Blocked by design</h2>
            </div>
            <span className="status-chip blocked">{blockedGateCount} open gates</span>
          </div>
          <p className="muted" data-testid="redaction-notice">
            Actual-provider mode stays dry-run-first. No real legal names, secrets, or signatory
            details belong in this studio.
          </p>
          <div className="live-input-grid">
            <label className="field-card">
              <span className="field-label">MVP or demo evidence URL</span>
              <input
                value={state.liveInputs.mvpEvidenceUrl}
                onChange={(event) => updateLiveInput("mvpEvidenceUrl", event.target.value)}
                data-testid="actual-field-mvp-evidence-url"
              />
            </label>
            <label className="field-card">
              <span className="field-label">Sponsor name</span>
              <input
                value={state.liveInputs.sponsorName}
                onChange={(event) => updateLiveInput("sponsorName", event.target.value)}
                data-testid="actual-field-sponsor-name"
              />
            </label>
            <label className="field-card">
              <span className="field-label">Commercial owner</span>
              <input
                value={state.liveInputs.commercialOwner}
                onChange={(event) => updateLiveInput("commercialOwner", event.target.value)}
                data-testid="actual-field-commercial-owner"
              />
            </label>
            <label className="field-card">
              <span className="field-label">Named approver</span>
              <input
                value={state.liveInputs.namedApprover}
                onChange={(event) => updateLiveInput("namedApprover", event.target.value)}
                data-testid="actual-field-named-approver"
              />
            </label>
            <label className="field-card">
              <span className="field-label">Environment target</span>
              <input
                value={state.liveInputs.environmentTarget}
                onChange={(event) => updateLiveInput("environmentTarget", event.target.value)}
                data-testid="actual-field-environment-target"
              />
            </label>
            <label className="field-card">
              <span className="field-label">ALLOW_REAL_PROVIDER_MUTATION</span>
              <select
                value={state.liveInputs.allowMutation}
                onChange={(event) => updateLiveInput("allowMutation", event.target.value)}
                data-testid="actual-field-allow-mutation"
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            </label>
          </div>
          <div className="button-row">
            <button
              type="button"
              className="secondary-button"
              onClick={refreshRoster}
              data-testid="refresh-provider-roster"
            >
              Refresh provider roster snapshot
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={blockedGateCount > 0}
              data-testid="dry-run-submit"
            >
              Prepare dry run
            </button>
          </div>
          <div className="gate-list">
            {im1PairingPack.live_gate_pack.live_gates.map((gate) => (
              <div
                key={gate.gate_id}
                className={`gate-row ${gateStatuses[gate.gate_id]}`}
                data-testid={`gate-row-${gate.gate_id}`}
              >
                <div>
                  <strong>{gate.gate_title}</strong>
                  <p>{gate.reason}</p>
                </div>
                <span className={`status-chip ${gateStatuses[gate.gate_id]}`}>
                  {prettyStatus(gateStatuses[gate.gate_id])}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel dossier-card" data-testid="dossier-card-licence-watch">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Licence and RFC watch</p>
              <h2>Placeholder-only legal posture</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>State</th>
                  <th>Consumer signatory</th>
                  <th>Approver</th>
                </tr>
              </thead>
              <tbody>
                {im1PairingPack.provider_register.licence_register.map((row: LicenceRow) => (
                  <tr key={row.licence_row_id}>
                    <td>{providerLabel(row.provider_supplier_id)}</td>
                    <td>{row.licence_state}</td>
                    <td>{row.consumer_signatory_role}</td>
                    <td>{row.approver_role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rfc-grid">
            {im1PairingPack.rfc_watch.map((row: RfcWatchRow) => (
              <article key={row.watch_id} className="rfc-card">
                <div className="panel-header compact">
                  <strong>{row.watch_id}</strong>
                  <span className={`status-chip ${row.rfc_required ? "blocked" : "ready"}`}>
                    {row.rfc_required ? "RFC required" : "watch only"}
                  </span>
                </div>
                <p>{row.change_class}</p>
                <span className="field-meta">{row.required_delta}</span>
              </article>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderPage() {
    switch (state.page) {
      case "Prerequisites_Dossier":
        return renderDossierPage();
      case "SCAL_Artifact_Map":
        return renderScalPage();
      case "Provider_Compatibility_Matrix":
        return renderProviderPage();
      case "Licence_and_RFC_Watch":
        return renderLicencePage();
      default:
        return renderOverviewPage();
    }
  }

  return (
    <div className="atelier-shell" data-testid="im1-shell">
      <header className="readiness-header" data-testid="readiness-header">
        <div className="brand-panel">
          <div className="brand-row">
            <svg className="wordmark" viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="18" fill="#EEF2F6" />
              <path d="M18 18h12l8 13 8-13h12L40 46h-8L18 18Z" fill="#2457F5" />
              <path
                d="M24 46h16"
                stroke="#0E9384"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <div>
              <div className="ribbon-row">
                <span className="mock-ribbon" data-testid="mock-ribbon">
                  MOCK_IM1_PAIRING
                </span>
                <span className="mono-tag">Interface_Proof_Atelier</span>
              </div>
              <h1>IM1 pairing control tower</h1>
              <p className="muted">
                Premium internal rehearsal only. This studio does not imitate or replace the real
                IM1 portal.
              </p>
            </div>
          </div>
          <div className="status-line">
            <span data-testid="autosave-status">
              Autosave {autosaveStamp ? `captured at ${autosaveStamp}` : "pending"}
            </span>
            <span
              className={`status-chip ${reducedMotion ? "ready" : "review_required"}`}
              data-testid="reduced-motion-indicator"
            >
              {reducedMotion ? "reduced motion" : "motion standard"}
            </span>
          </div>
        </div>

        <div className="header-grid" data-testid="header-metrics">
          <div className="metric-card">
            <span>Selected stage</span>
            <strong>{selectedStage.stage_name}</strong>
          </div>
          <div className="metric-card">
            <span>Open blockers</span>
            <strong>{activeBlockers.length + blockedGateCount}</strong>
          </div>
          <div className="metric-card">
            <span>Assurance freshness</span>
            <strong>{artifactFreshnessLabel()}</strong>
          </div>
          <div className="metric-card">
            <span>Mode</span>
            <div className="mode-toggle" data-testid="mode-toggle">
              <button
                type="button"
                className={`toggle-button ${state.mode === "mock" ? "active" : ""}`}
                onClick={() => setMode("mock")}
                data-testid="mode-toggle-mock"
              >
                mock
              </button>
              <button
                type="button"
                className={`toggle-button ${state.mode === "actual" ? "active" : ""}`}
                onClick={() => setMode("actual")}
                data-testid="mode-toggle-actual"
              >
                actual
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="page-tabs" role="tablist" aria-label="Control tower pages">
        {PAGE_ORDER.map((page) => (
          <button
            type="button"
            key={page}
            className={`page-tab ${state.page === page ? "active" : ""}`}
            onClick={() => setPage(page)}
            data-testid={`page-tab-${page}`}
          >
            {pageTitle(page)}
          </button>
        ))}
      </div>

      <main className="shell-grid">
        <aside className="stage-rail panel" data-testid="stage-rail">
          {STAGE_GROUP_ORDER.map((group) => (
            <section key={group} className="stage-group">
              <div className="group-header">
                <span>{group.replace("_", " ")}</span>
              </div>
              <div className="stage-stack">
                {(stageGroups[group] ?? []).map((stage) => {
                  const tone = stageTone(stage, state, gateStatuses);
                  return (
                    <button
                      type="button"
                      key={stage.stage_id}
                      className={`stage-button ${tone} ${
                        state.selectedStageId === stage.stage_id ? "selected" : ""
                      }`}
                      onClick={() => selectStage(stage.stage_id)}
                      data-testid={`stage-button-${stage.stage_id}`}
                    >
                      <span className="stage-name">{stage.stage_name}</span>
                      <span className={`status-chip ${tone}`}>{tone}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </aside>

        <section className="workspace">{renderPage()}</section>

        <aside className="inspector panel" data-testid="evidence-drawer">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Evidence inspector</p>
              <h2>{selectedArtifact.artifact_name}</h2>
            </div>
            <span className={`status-chip ${selectedArtifact.freshness_posture}`}>
              {selectedArtifact.freshness_posture}
            </span>
          </div>

          <div className="inspector-block">
            <span>Selected stage</span>
            <p>{selectedStage.stage_name}</p>
            <div className="chip-row">
              {activeBlockers.length === 0 ? (
                <span className="status-chip ready">no stage blockers</span>
              ) : (
                activeBlockers.map((blocker) => (
                  <span
                    key={blocker}
                    className="status-chip blocked"
                    data-testid={`blocker-chip-${blocker}`}
                  >
                    {blocker}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="inspector-block">
            <span>Artifact notes</span>
            <p>{selectedArtifact.notes}</p>
            <p className="field-meta">
              stages: {selectedArtifact.required_for_stage_ids.join(", ")}
            </p>
          </div>

          <div className="inspector-block">
            <span>Selected provider row</span>
            <p>
              {providerLabel(selectedProviderRow.provider_supplier_id)} /{" "}
              {selectedProviderRow.route_family_name}
            </p>
            <p>{selectedProviderRow.truth_guardrail}</p>
          </div>

          <div className="button-row stacked">
            <button
              type="button"
              className="primary-button"
              onClick={completeSelectedStage}
              disabled={stageTone(selectedStage, state, gateStatuses) !== "ready"}
              data-testid="stage-complete-button"
            >
              Mark stage rehearsed
            </button>
          </div>
        </aside>
      </main>

      <section className="lower-grid">
        <article className="panel lower-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Provider compatibility matrix</p>
              <h2>Route family to provider supplier posture</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table data-testid="provider-matrix">
              <thead>
                <tr>
                  <th>Provider supplier</th>
                  <th>Route family</th>
                  <th>IM1 role</th>
                  <th>Mock posture</th>
                </tr>
              </thead>
              <tbody>
                {im1PairingPack.provider_register.route_family_matrix.map((row: ProviderRow) => (
                  <tr
                    key={row.compatibility_row_id}
                    className={
                      state.selectedProviderRowId === row.compatibility_row_id ? "selected-row" : ""
                    }
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        selectedProviderRowId: row.compatibility_row_id,
                      }))
                    }
                    data-testid={`provider-matrix-row-${row.compatibility_row_id}`}
                  >
                    <td>{providerLabel(row.provider_supplier_id)}</td>
                    <td>{row.route_family_name}</td>
                    <td>{row.im1_role}</td>
                    <td>{row.current_mock_position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel lower-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Flow parity</p>
              <h2>Process line diagram</h2>
            </div>
          </div>
          <div className="line-diagram" data-testid="flow-diagram">
            {[
              "prerequisites",
              "stage_one_scal",
              "licence",
              "provider_mock_api",
              "supported_test",
              "assurance",
              "live",
            ].map((node, index, nodes) => (
              <div key={node} className="diagram-node">
                <span>{node.replace(/_/g, " ")}</span>
                {index < nodes.length - 1 ? <div className="diagram-link" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
          <div className="table-wrap compact">
            <table data-testid="flow-parity-table">
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>prerequisites</td>
                  <td>Exact public form plus internal evidence mapping.</td>
                </tr>
                <tr>
                  <td>stage_one_scal</td>
                  <td>Document stub and supplier/product/service dossier.</td>
                </tr>
                <tr>
                  <td>licence</td>
                  <td>Placeholder-only until named signatories exist.</td>
                </tr>
                <tr>
                  <td>provider_mock_api</td>
                  <td>Unsupported-test rehearsal only, never live truth.</td>
                </tr>
                <tr>
                  <td>supported_test</td>
                  <td>Blocked until full SCAL and later live gates pass.</td>
                </tr>
                <tr>
                  <td>assurance</td>
                  <td>Evidence freshness and external approval cadence.</td>
                </tr>
                <tr>
                  <td>live</td>
                  <td>Later-only rollout after RTC and PTC.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}

export default App;
