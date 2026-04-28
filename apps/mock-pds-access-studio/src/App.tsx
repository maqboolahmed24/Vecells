import { useEffect, useState } from "react";
import { VecellLogoLockup } from "@vecells/design-system";

import { pdsAccessPack } from "./generated/pdsAccessPack";

type Pack = typeof pdsAccessPack;
type AccessRow = Pack["access_rows"][number];
type ArtifactRow = Pack["hazard_artifacts"][number];
type GateRow = Pack["live_gate_pack"]["live_gates"][number];
type FeatureFlagRow = Pack["feature_flags"][number];
type FieldRow = Pack["onboarding_fields"][number];

type Mode = "mock" | "actual";
type GateStatus = "pass" | "blocked" | "review_required";
type ArtifactFreshness = "draft" | "current" | "stale";

const PAGE_ORDER = [
  "PDS_Flag_Overview",
  "Access_Mode_Lattice",
  "Use_Case_and_Legal_Basis",
  "Risk_Log_and_Hazard_Map",
  "Rollback_and_Kill_Switches",
] as const;

type Page = (typeof PAGE_ORDER)[number];

type AppState = {
  mode: Mode;
  page: Page;
  selectedRouteId: string;
  selectedUseCaseId: string;
  selectedScenarioId: string;
  selectedAccessMode: string;
  selectedFlagState: string;
  sandboxQuery: string;
  sandboxBaseUrl: string;
  legalBasisDraft: string;
  artifactFreshness: Record<string, ArtifactFreshness>;
  actualInputs: {
    namedApprover: string;
    environmentTarget: string;
    orgOds: string;
    useCaseOwner: string;
    allowMutation: string;
  };
  lastSavedAt: string | null;
};

type TraceState = {
  status: number | null;
  payload: unknown;
  bundle: any | null;
  traceClass: string | null;
  loading: boolean;
  error: string | null;
};

type RouteOption = {
  routeFamilyRef: string;
  routeFamilyName: string;
  shellId: string;
  useCaseCount: number;
};

const STORAGE_KEY = "identity-trace-studio";

const ROUTES: RouteOption[] = Array.from(
  pdsAccessPack.access_rows.reduce((map, row) => {
    const existing = map.get(row.route_family_ref);
    if (existing) {
      existing.useCaseCount += 1;
      return map;
    }
    map.set(row.route_family_ref, {
      routeFamilyRef: row.route_family_ref,
      routeFamilyName: row.route_family_name,
      shellId: row.shell_id,
      useCaseCount: 1,
    });
    return map;
  }, new Map<string, RouteOption>()),
).map(([, value]) => value);

function routeUseCases(routeId: string): readonly AccessRow[] {
  return pdsAccessPack.access_rows.filter((row) => row.route_family_ref === routeId);
}

function accessRowById(useCaseId: string): AccessRow {
  return pdsAccessPack.access_rows.find((row) => row.pds_use_case_id === useCaseId)!;
}

function featureFlagByUseCase(useCaseId: string): FeatureFlagRow {
  return pdsAccessPack.feature_flags.find((row) => row.pds_use_case_id === useCaseId)!;
}

function onboardingFieldsForUseCase(): readonly FieldRow[] {
  return pdsAccessPack.onboarding_fields;
}

function artifactById(artifactId: string): ArtifactRow {
  return pdsAccessPack.hazard_artifacts.find((row) => row.artifact_id === artifactId)!;
}

function defaultArtifactFreshness(): Record<string, ArtifactFreshness> {
  const freshness: Record<string, ArtifactFreshness> = {};
  for (const artifact of pdsAccessPack.hazard_artifacts) {
    const currentSet = new Set([
      "ART_PDS_ROUTE_FLAG_APPROVAL",
      "ART_PDS_LEGAL_BASIS_DOSSIER",
      "ART_PDS_SECRET_CAPTURE_PLAN",
      "ART_PDS_DATA_HANDLING_NOTE",
    ]);
    freshness[artifact.artifact_id] = currentSet.has(artifact.artifact_id) ? "current" : "stale";
  }
  return freshness;
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
  return "PDS_Flag_Overview";
}

function defaultState(): AppState {
  const firstRoute = ROUTES[0];
  const firstUseCase = routeUseCases(firstRoute.routeFamilyRef)[0];
  const firstFlag = featureFlagByUseCase(firstUseCase.pds_use_case_id);
  const baseUrl =
    new URLSearchParams(window.location.search).get("sandboxBaseUrl") ??
    pdsAccessPack.mock_service.base_url_default;

  return {
    mode: initialMode(),
    page: initialPage(),
    selectedRouteId: firstRoute.routeFamilyRef,
    selectedUseCaseId: firstUseCase.pds_use_case_id,
    selectedScenarioId: "matched",
    selectedAccessMode: firstUseCase.access_mode,
    selectedFlagState: firstFlag.default_state,
    sandboxQuery: "meridian",
    sandboxBaseUrl: baseUrl,
    legalBasisDraft: firstUseCase.legal_basis_summary,
    artifactFreshness: defaultArtifactFreshness(),
    actualInputs: {
      namedApprover: "",
      environmentTarget: "",
      orgOds: "",
      useCaseOwner: "",
      allowMutation: "false",
    },
    lastSavedAt: null,
  };
}

function initialState(): AppState {
  const base = defaultState();
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
      artifactFreshness: { ...base.artifactFreshness, ...(parsed.artifactFreshness ?? {}) },
      actualInputs: { ...base.actualInputs, ...(parsed.actualInputs ?? {}) },
      sandboxBaseUrl: base.sandboxBaseUrl,
    };
  } catch {
    return base;
  }
}

function syncForUseCase(state: AppState, useCaseId: string): AppState {
  const row = accessRowById(useCaseId);
  const flag = featureFlagByUseCase(useCaseId);
  return {
    ...state,
    selectedRouteId: row.route_family_ref,
    selectedUseCaseId: useCaseId,
    selectedAccessMode: row.access_mode,
    selectedFlagState: flag.default_state,
    legalBasisDraft: row.legal_basis_summary,
    sandboxQuery: row.pds_use_case_id.includes("PHARMACY") ? "harbour" : "meridian",
  };
}

function statusTone(status: GateStatus): string {
  if (status === "pass") {
    return "success";
  }
  if (status === "review_required") {
    return "review";
  }
  return "blocked";
}

function traceClassFromPayload(payload: any): string | null {
  if (payload?.resourceType === "Bundle") {
    const extension = payload.extension?.find?.((row: { url?: string }) =>
      String(row.url ?? "").includes("result-class"),
    );
    return extension?.valueCode ?? null;
  }
  if (payload?.meta?.tag?.length) {
    const tag = payload.meta.tag.find((row: { system?: string }) =>
      String(row.system ?? "").includes("scenario"),
    );
    return tag?.code ?? null;
  }
  if (payload?.issue?.length) {
    return payload.issue[0].code ?? null;
  }
  return null;
}

function liveGateStatusMap(state: AppState, row: AccessRow): Record<string, GateStatus> {
  const statuses: Record<string, GateStatus> = {};
  const riskCurrent = row.required_risk_log_refs.every(
    (artifactId) => state.artifactFreshness[artifactId] === "current",
  );

  for (const gate of pdsAccessPack.live_gate_pack.live_gates) {
    let status = gate.status as GateStatus;

    if (gate.gate_id === "LIVE_GATE_PDS_LEGAL_BASIS_APPROVED") {
      status = state.legalBasisDraft.trim().length > 32 ? "pass" : "blocked";
    } else if (gate.gate_id === "PDS_LIVE_GATE_USE_CASE_TRACEABLE") {
      status = "pass";
    } else if (gate.gate_id === "PDS_LIVE_GATE_ROUTE_FLAG_DEFAULT_OFF") {
      status = ["off", "internal_only"].includes(state.selectedFlagState) ? "pass" : "review_required";
    } else if (gate.gate_id === "PDS_LIVE_GATE_ACCESS_MODE_SELECTED") {
      status = state.selectedAccessMode === row.access_mode ? "pass" : "review_required";
    } else if (gate.gate_id === "PDS_LIVE_GATE_HAZARD_LOG_CURRENT") {
      status = state.artifactFreshness.ART_PDS_HAZARD_LOG === "current" ? "pass" : "review_required";
    } else if (gate.gate_id === "PDS_LIVE_GATE_RISK_LOGS_CURRENT") {
      status = riskCurrent ? "pass" : "review_required";
    } else if (gate.gate_id === "PDS_LIVE_GATE_WRONG_PATIENT_PLAN_CURRENT") {
      status =
        state.artifactFreshness.ART_PDS_WRONG_PATIENT_MITIGATION_PLAN === "current"
          ? "pass"
          : "review_required";
    } else if (gate.gate_id === "PDS_LIVE_GATE_SECURE_NETWORK_PATH_PLANNED") {
      status =
        row.access_mode === "application_restricted" || row.access_mode === "patient_access"
          ? "pass"
          : state.artifactFreshness.ART_PDS_SECURE_NETWORK_PLAN === "current"
            ? "pass"
            : "review_required";
    } else if (gate.gate_id === "PDS_LIVE_GATE_NAMED_APPROVER_PRESENT") {
      status = state.actualInputs.namedApprover.trim() ? "pass" : "blocked";
    } else if (gate.gate_id === "PDS_LIVE_GATE_ENVIRONMENT_TARGET_PRESENT") {
      status = state.actualInputs.environmentTarget.trim() ? "pass" : "blocked";
    } else if (gate.gate_id === "PDS_LIVE_GATE_ROLLBACK_REHEARSED") {
      status = state.artifactFreshness.ART_PDS_ROLLBACK_REHEARSAL === "current" ? "pass" : "review_required";
    } else if (gate.gate_id === "PDS_LIVE_GATE_ALLOW_REAL_PROVIDER_MUTATION") {
      status = state.actualInputs.allowMutation === "true" ? "pass" : "blocked";
    }

    statuses[gate.gate_id] = status;
  }

  return statuses;
}

function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [traceState, setTraceState] = useState<TraceState>({
    status: null,
    payload: null,
    bundle: null,
    traceClass: null,
    loading: false,
    error: null,
  });
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const selectedRow = accessRowById(state.selectedUseCaseId);
  const selectedFlag = featureFlagByUseCase(state.selectedUseCaseId);
  const useCases = routeUseCases(state.selectedRouteId);
  const gateStatuses = liveGateStatusMap(state, selectedRow);
  const gateSummary = Object.values(gateStatuses).reduce(
    (acc, status) => {
      acc[status] += 1;
      return acc;
    },
    { pass: 0, blocked: 0, review_required: 0 },
  );

  const submissionEnabled = pdsAccessPack.live_gate_pack.live_gates.every((gate) => {
    if (gate.gate_id === "GATE_EXTERNAL_TO_FOUNDATION") {
      return false;
    }
    return gateStatuses[gate.gate_id] === "pass";
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        lastSavedAt: new Date().toISOString(),
      }),
    );
  }, [state]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("mode", state.mode);
    params.set("page", state.page);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [state.mode, state.page]);

  async function runSearch() {
    setTraceState((current) => ({ ...current, loading: true, error: null }));
    try {
      const base = state.sandboxBaseUrl.replace(/\/$/, "");
      const response = await fetch(
        `${base}/Patient?${new URLSearchParams({
          accessMode: state.selectedAccessMode,
          scenario: state.selectedScenarioId,
          query: state.sandboxQuery,
        }).toString()}`,
      );
      const payload = await response.json();
      setTraceState({
        status: response.status,
        payload,
        bundle: payload?.resourceType === "Bundle" ? payload : null,
        traceClass: traceClassFromPayload(payload),
        loading: false,
        error: null,
      });
    } catch (error) {
      setTraceState({
        status: null,
        payload: null,
        bundle: null,
        traceClass: null,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown sandbox error",
      });
    }
  }

  async function runRead(patientId: string) {
    setTraceState((current) => ({ ...current, loading: true, error: null }));
    try {
      const base = state.sandboxBaseUrl.replace(/\/$/, "");
      const response = await fetch(
        `${base}/Patient/${patientId}?${new URLSearchParams({
          accessMode: state.selectedAccessMode,
          scenario: state.selectedScenarioId,
        }).toString()}`,
      );
      const payload = await response.json();
      setTraceState((current) => ({
        status: response.status,
        payload,
        bundle: current.bundle,
        traceClass: traceClassFromPayload(payload) ?? current.traceClass,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setTraceState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown sandbox error",
      }));
    }
  }

  function renderOverview() {
    const entries = traceState.bundle?.entry ?? [];

    return (
      <div className="workbench-grid">
        <section className="panel workbench-card">
          <div className="panel-header">
            <div>
              <h2>Feature Flag Workbench</h2>
              <p>Exercise optional-not-required posture, route binding, and sandbox trace behavior from the same control surface.</p>
            </div>
            <div className="mono-tag" data-testid="trace-proof-note">
              no direct Request.patientRef writes
            </div>
          </div>

          <div className="control-grid">
            <label className="field">
              <span>Feature flag state</span>
              <select
                data-testid="feature-flag-select"
                value={state.selectedFlagState}
                onChange={(event) =>
                  setState((current) => ({ ...current, selectedFlagState: event.target.value }))
                }
              >
                {selectedFlag.rollout_states.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Access mode</span>
              <select
                data-testid="access-mode-select"
                value={state.selectedAccessMode}
                onChange={(event) =>
                  setState((current) => ({ ...current, selectedAccessMode: event.target.value }))
                }
              >
                {Object.keys(pdsAccessPack.access_mode_alias_map).map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Sandbox scenario</span>
              <select
                data-testid="scenario-select"
                value={state.selectedScenarioId}
                onChange={(event) =>
                  setState((current) => ({ ...current, selectedScenarioId: event.target.value }))
                }
              >
                {pdsAccessPack.mock_service.scenarios.map((scenario) => (
                  <option key={scenario.scenario_id} value={scenario.scenario_id}>
                    {scenario.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-wide">
              <span>Sandbox base URL</span>
              <input
                value={state.sandboxBaseUrl}
                onChange={(event) =>
                  setState((current) => ({ ...current, sandboxBaseUrl: event.target.value }))
                }
              />
            </label>

            <label className="field field-wide">
              <span>Query</span>
              <input
                data-testid="trace-query-input"
                value={state.sandboxQuery}
                onChange={(event) =>
                  setState((current) => ({ ...current, sandboxQuery: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="button-row">
            <button data-testid="run-trace-button" className="primary-button" onClick={runSearch} type="button">
              Run mock trace
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                const firstId = traceState.bundle?.entry?.[0]?.resource?.id;
                if (firstId) {
                  void runRead(firstId);
                } else {
                  void runSearch();
                }
              }}
            >
              Read first result
            </button>
          </div>

          <div className="summary-row">
            <div className="metric-card">
              <span>Selected flag</span>
              <strong>{selectedFlag.flag_name}</strong>
              <p>{selectedFlag.why_optional_not_required}</p>
            </div>
            <div className="metric-card">
              <span>Required risk logs</span>
              <strong>{selectedRow.required_risk_log_refs.length}</strong>
              <p>{selectedRow.required_risk_log_refs.join(", ")}</p>
            </div>
            <div className="metric-card">
              <span>Fallback</span>
              <strong>safe without PDS</strong>
              <p>{selectedRow.fallback_if_unavailable}</p>
            </div>
          </div>
        </section>

        <section className="panel workbench-card" data-testid="trace-status-card">
          <div className="panel-header">
            <div>
              <h2>Sandbox Trace</h2>
              <p>Search and read the local mock sandbox using the same access-mode posture the route would later declare.</p>
            </div>
            <div className={`status-chip ${traceState.loading ? "review" : "neutral"}`}>
              {traceState.loading ? "loading" : `HTTP ${traceState.status ?? "idle"}`}
            </div>
          </div>

          <div className="chip-row">
            {traceState.traceClass ? (
              <span
                className={`status-chip ${statusTone(
                  traceState.status && traceState.status >= 500
                    ? "blocked"
                    : traceState.status && traceState.status >= 400
                      ? "review_required"
                      : "pass",
                )}`}
                data-testid={`trace-class-${traceState.traceClass}`}
              >
                {traceState.traceClass}
              </span>
            ) : null}
            <span className="status-chip neutral">
              durable binding stays downstream of identity review
            </span>
          </div>

          {traceState.error ? <p className="error-banner">{traceState.error}</p> : null}

          <div className="trace-results">
            <div className="trace-list">
              {(entries as any[]).length ? (
                (entries as any[]).map((entry) => (
                  <button
                    key={entry.resource.id}
                    type="button"
                    className="trace-row"
                    data-testid={`trace-result-${entry.resource.id}`}
                    onClick={() => void runRead(entry.resource.id)}
                  >
                    <strong>{entry.resource.name?.[0]?.text ?? entry.resource.id}</strong>
                    <span className="mono-tag">{entry.resource.id}</span>
                    <span>score {String(entry.search?.score ?? "n/a")}</span>
                  </button>
                ))
              ) : (
                <div className="trace-empty">No bundle entries loaded yet.</div>
              )}
            </div>

            <pre className="json-panel" data-testid="trace-json">
              {JSON.stringify(traceState.payload ?? { message: "run a trace" }, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    );
  }

  function renderLattice() {
    return (
      <section className="panel workbench-card">
        <div className="panel-header">
          <div>
            <h2>Access Mode Lattice</h2>
            <p>Route families, access modes, and fallback law stay coupled so no one can select a PDS mode ad hoc.</p>
          </div>
          <div className="mono-tag">9 route-bound rows</div>
        </div>
        <table data-testid="access-mode-lattice-table">
          <thead>
            <tr>
              <th>Use case</th>
              <th>Mode</th>
              <th>Default</th>
              <th>Required risk logs</th>
              <th>Fallback</th>
            </tr>
          </thead>
          <tbody>
            {useCases.map((row) => (
              <tr
                key={row.pds_use_case_id}
                className={row.pds_use_case_id === selectedRow.pds_use_case_id ? "selected-row" : ""}
                onClick={() => setState((current) => syncForUseCase(current, row.pds_use_case_id))}
              >
                <td>
                  <strong>{row.pds_use_case_id}</strong>
                  <div>{row.why_pds_is_needed}</div>
                </td>
                <td className="mono-cell">{row.access_mode}</td>
                <td>{row.default_state}</td>
                <td>{row.required_risk_log_refs.join(", ")}</td>
                <td>{row.fallback_if_unavailable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }

  function renderUseCasePage() {
    return (
      <div className="workbench-grid">
        <section className="panel workbench-card">
          <div className="panel-header">
            <div>
              <h2>Use Case And Legal Basis</h2>
              <p>Turn the official PDS onboarding mechanics into structured, route-bound dossier fields.</p>
            </div>
            <div className="status-chip neutral">{selectedRow.pds_use_case_id}</div>
          </div>

          <label className="field">
            <span>Legal basis narrative</span>
            <textarea
              data-testid="legal-basis-textarea"
              rows={4}
              value={state.legalBasisDraft}
              onChange={(event) =>
                setState((current) => ({ ...current, legalBasisDraft: event.target.value }))
              }
            />
          </label>

          <div className="field-card-grid">
            {onboardingFieldsForUseCase().map((field) => (
              <article key={field.field_id} className="field-card">
                <header>
                  <span className="mono-tag">{field.field_id}</span>
                  <span className="status-chip neutral">{field.origin_class}</span>
                </header>
                <strong>{field.label}</strong>
                <p>{field.expected_value}</p>
                <small>{field.official_basis}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel workbench-card">
          <div className="panel-header">
            <div>
              <h2>Authority Separation</h2>
              <p>The route can gather supporting demographics, but durable binding remains a separate governed act.</p>
            </div>
          </div>
          <div className="authority-stack">
            <article className="authority-card">
              <span className="status-chip success">allowed</span>
              <strong>search and read supporting demographics</strong>
              <p>Bound to the exact route family, access mode, and legal basis.</p>
            </article>
            <article className="authority-card">
              <span className="status-chip blocked">forbidden</span>
              <strong>write Request.patientRef from PDS success</strong>
              <p>PDS success must route back through identity review and IdentityBindingAuthority.</p>
            </article>
          </div>
        </section>
      </div>
    );
  }

  function renderRiskPage() {
    return (
      <div className="workbench-grid">
        <section className="panel workbench-card">
          <div className="panel-header">
            <div>
              <h2>Risk Log And Hazard Map</h2>
              <p>Hazard and risk-log work is part of engineering readiness now, not postponed compliance paperwork.</p>
            </div>
            <div className="status-chip review">
              {selectedRow.required_hazard_log_refs[0]} + {selectedRow.required_risk_log_refs.length} risk logs
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Artifact</th>
                <th>Type</th>
                <th>Freshness</th>
                <th>Gate</th>
              </tr>
            </thead>
            <tbody>
              {pdsAccessPack.hazard_artifacts.map((artifact) => (
                <tr key={artifact.artifact_id} data-testid={`artifact-row-${artifact.artifact_id}`}>
                  <td>
                    <strong>{artifact.artifact_id}</strong>
                    <div>{artifact.notes}</div>
                  </td>
                  <td>{artifact.artifact_type}</td>
                  <td>
                    <select
                      data-testid={`artifact-freshness-${artifact.artifact_id}`}
                      value={state.artifactFreshness[artifact.artifact_id]}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          artifactFreshness: {
                            ...current.artifactFreshness,
                            [artifact.artifact_id]: event.target.value as ArtifactFreshness,
                          },
                        }))
                      }
                    >
                      <option value="draft">draft</option>
                      <option value="current">current</option>
                      <option value="stale">stale</option>
                    </select>
                  </td>
                  <td>{artifact.gate_refs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel workbench-card">
          <div className="panel-header">
            <div>
              <h2>Safety Focus</h2>
              <p>Wrong-patient and nullable-binding law remain active even when the sandbox returns a clean match.</p>
            </div>
          </div>
          <div className="authority-stack" data-testid="hazard-drawer">
            <article className="authority-card">
              <span className="status-chip blocked">hazard</span>
              <strong>{pdsAccessPack.risk_bindings[1].risk_id}</strong>
              <p>{pdsAccessPack.risk_bindings[1].problem_statement}</p>
            </article>
            <article className="authority-card" data-testid="risk-drawer">
              <span className="status-chip review">risk</span>
              <strong>{pdsAccessPack.risk_bindings[0].risk_id}</strong>
              <p>{pdsAccessPack.risk_bindings[0].problem_statement}</p>
            </article>
          </div>
        </section>
      </div>
    );
  }

  function renderRollbackPage() {
    return (
      <div className="workbench-grid">
        <section className="panel workbench-card">
          <div className="panel-header">
            <div>
              <h2>Rollback And Kill Switches</h2>
              <p>Real onboarding remains blocked, but the studio exposes the exact gate posture and rollback triggers now.</p>
            </div>
            <div className={`status-chip ${submissionEnabled ? "success" : "blocked"}`}>
              submit {submissionEnabled ? "enabled" : "blocked"}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Gate</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {pdsAccessPack.live_gate_pack.live_gates.map((gate) => (
                <tr key={gate.gate_id} data-testid={`live-gate-row-${gate.gate_id}`}>
                  <td className="mono-cell">{gate.gate_id}</td>
                  <td>
                    <span className={`status-chip ${statusTone(gateStatuses[gate.gate_id])}`}>
                      {gateStatuses[gate.gate_id]}
                    </span>
                  </td>
                  <td>{gate.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel workbench-card">
          <div className="panel-header">
            <div>
              <h2>Actual-Mode Dry Run</h2>
              <p>These inputs exist for dry-run preparation only. Real mutation still fails closed while the external-readiness gate is blocked.</p>
            </div>
          </div>

          <div className="control-grid">
            <label className="field">
              <span>Named approver</span>
              <input
                data-testid="actual-field-named-approver"
                value={state.actualInputs.namedApprover}
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
                data-testid="actual-field-environment-target"
                value={state.actualInputs.environmentTarget}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    actualInputs: { ...current.actualInputs, environmentTarget: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Organisation ODS</span>
              <input
                data-testid="actual-field-org-ods"
                value={state.actualInputs.orgOds}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    actualInputs: { ...current.actualInputs, orgOds: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Use-case owner</span>
              <input
                data-testid="actual-field-use-case-owner"
                value={state.actualInputs.useCaseOwner}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    actualInputs: { ...current.actualInputs, useCaseOwner: event.target.value },
                  }))
                }
              />
            </label>
            <label className="field field-wide">
              <span>Allow real mutation</span>
              <select
                data-testid="actual-field-allow-mutation"
                value={state.actualInputs.allowMutation}
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
          </div>

          <div className="rollback-grid">
            {pdsAccessPack.rollback_signals.map((signal) => (
              <article key={signal.signal_id} className="metric-card">
                <span>{signal.signal}</span>
                <strong>{signal.signal_id}</strong>
                <p>{signal.threshold}</p>
              </article>
            ))}
          </div>

          <button
            type="button"
            data-testid="actual-submit-button"
            className="primary-button"
            disabled={!submissionEnabled}
          >
            Dry-run submit
          </button>
        </section>
      </div>
    );
  }

  return (
    <main className="trace-shell" data-testid="pds-shell">
      <header className="posture-banner panel" data-testid="posture-banner">
        <div className="brand-panel">
          <div className="brand-row">
            <VecellLogoLockup aria-hidden="true" className="wordmark" />
            <div>
              <div className="ribbon-row">
                <span className="mock-ribbon">MOCK_PDS_SANDBOX</span>
                <span className="mono-tag">{pdsAccessPack.visual_mode}</span>
              </div>
              <h1>Identity Trace Studio</h1>
              <p>
                Optional PDS enrichment stays bounded, default-off, and reversible. Durable identity
                remains downstream of review and authority settlement.
              </p>
            </div>
          </div>
          <div className="chip-row">
            <span className={`status-chip ${statusTone(gateSummary.blocked ? "blocked" : "pass")}`}>
              blocked {gateSummary.blocked}
            </span>
            <span className={`status-chip ${statusTone("review_required")}`}>
              review {gateSummary.review_required}
            </span>
            <span className={`status-chip ${statusTone("pass")}`}>pass {gateSummary.pass}</span>
            <span className="status-chip neutral">flag {state.selectedFlagState}</span>
            <span className="status-chip neutral">mode {state.selectedAccessMode}</span>
          </div>
        </div>

        <div className="banner-aside">
          <div className="mode-toggle" data-testid="mode-toggle">
            <button
              type="button"
              data-testid="mode-toggle-mock"
              className={state.mode === "mock" ? "toggle-button active" : "toggle-button"}
              onClick={() => setState((current) => ({ ...current, mode: "mock" }))}
            >
              mock
            </button>
            <button
              type="button"
              data-testid="mode-toggle-actual"
              className={state.mode === "actual" ? "toggle-button active" : "toggle-button"}
              onClick={() => setState((current) => ({ ...current, mode: "actual" }))}
            >
              actual
            </button>
          </div>
          <div className="banner-facts">
            <div className="metric-card compact">
              <span>Legal basis completeness</span>
              <strong>{state.legalBasisDraft.trim().length > 32 ? "structured" : "needs detail"}</strong>
            </div>
            <div className="metric-card compact">
              <span>Wrong-patient posture</span>
              <strong>repair obligations remain active</strong>
            </div>
            <div className="metric-card compact" data-testid="reduced-motion-indicator">
              <span>Motion</span>
              <strong>{reducedMotion ? "reduced" : "standard"}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="studio-grid">
        <aside className="panel route-rail" data-testid="route-rail">
          <div className="panel-header">
            <div>
              <h2>Route Families</h2>
              <p>Every use case stays tied to an exact route family and shell.</p>
            </div>
          </div>
          <div className="route-list">
            {ROUTES.map((route) => (
              <button
                key={route.routeFamilyRef}
                type="button"
                data-testid={`route-button-${route.routeFamilyRef}`}
                className={route.routeFamilyRef === state.selectedRouteId ? "route-button active" : "route-button"}
                onClick={() =>
                  setState((current) =>
                    syncForUseCase(current, routeUseCases(route.routeFamilyRef)[0].pds_use_case_id),
                  )
                }
              >
                <strong>{route.routeFamilyRef}</strong>
                <span>{route.routeFamilyName || route.routeFamilyRef}</span>
                <small>{route.useCaseCount} use case(s) | {route.shellId || "shell pending"}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="workbench">
          <nav className="page-tabs">
            {PAGE_ORDER.map((page) => (
              <button
                key={page}
                type="button"
                data-testid={`page-tab-${page}`}
                className={page === state.page ? "page-tab active" : "page-tab"}
                onClick={() => setState((current) => ({ ...current, page }))}
              >
                {page}
              </button>
            ))}
          </nav>

          <div className="usecase-strip">
            {useCases.map((row) => (
              <button
                key={row.pds_use_case_id}
                type="button"
                className={row.pds_use_case_id === state.selectedUseCaseId ? "usecase-card active" : "usecase-card"}
                onClick={() => setState((current) => syncForUseCase(current, row.pds_use_case_id))}
              >
                <strong>{row.pds_use_case_id}</strong>
                <span>{row.access_mode}</span>
                <small>{row.default_state}</small>
              </button>
            ))}
          </div>

          {state.page === "PDS_Flag_Overview" ? renderOverview() : null}
          {state.page === "Access_Mode_Lattice" ? renderLattice() : null}
          {state.page === "Use_Case_and_Legal_Basis" ? renderUseCasePage() : null}
          {state.page === "Risk_Log_and_Hazard_Map" ? renderRiskPage() : null}
          {state.page === "Rollback_and_Kill_Switches" ? renderRollbackPage() : null}

          <section className="panel lineage-strip" data-testid="lineage-strip">
            <h2>Lineage Strip</h2>
            <div className="lineage-flow">
              <div className="lineage-node">local_match</div>
              <div className="lineage-arrow" />
              <div className="lineage-node accent">optional_pds_enrichment</div>
              <div className="lineage-arrow" />
              <div className="lineage-node review">identity_binding_review</div>
              <div className="lineage-arrow" />
              <div className="lineage-node success">durable_binding</div>
            </div>
          </section>
        </section>

        <aside className="panel inspector" data-testid="identity-inspector">
          <div className="panel-header">
            <div>
              <h2>Identity-Risk Inspector</h2>
              <p>Selected use case details, controls, and required artifact drawers.</p>
            </div>
            <div className="mono-tag">{selectedRow.route_family_ref}</div>
          </div>

          <div className="inspector-stack">
            <article className="inspector-card">
              <span className="status-chip neutral">Why PDS is needed</span>
              <strong>{selectedRow.pds_use_case_id}</strong>
              <p>{selectedRow.why_pds_is_needed}</p>
            </article>

            <article className="inspector-card">
              <span className="status-chip review">Why local matching is not enough</span>
              <p>{selectedRow.why_local_matching_alone_is_not_sufficient}</p>
            </article>

            <article className="inspector-card">
              <span className="status-chip blocked">Identity-binding impact</span>
              <p>{selectedRow.identity_binding_impact}</p>
            </article>

            <section className="inspector-card" data-testid="hazard-drawer">
              <h3>Hazard drawer</h3>
              {selectedRow.required_hazard_log_refs.map((artifactId) => (
                <div key={artifactId} className="drawer-row">
                  <strong>{artifactId}</strong>
                  <span className={`status-chip ${statusTone(gateStatuses.PDS_LIVE_GATE_HAZARD_LOG_CURRENT)}`}>
                    {state.artifactFreshness[artifactId]}
                  </span>
                </div>
              ))}
            </section>

            <section className="inspector-card" data-testid="risk-drawer">
              <h3>Risk drawer</h3>
              {selectedRow.required_risk_log_refs.map((artifactId) => (
                <div key={artifactId} className="drawer-row">
                  <strong>{artifactId}</strong>
                  <span className={`status-chip ${statusTone(gateStatuses.PDS_LIVE_GATE_RISK_LOGS_CURRENT)}`}>
                    {state.artifactFreshness[artifactId]}
                  </span>
                </div>
              ))}
            </section>

            <section className="inspector-card">
              <h3>Wrong-patient controls</h3>
              <ul>
                {selectedRow.wrong_patient_risk_controls.map((control) => (
                  <li key={control}>{control}</li>
                ))}
              </ul>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default App;
