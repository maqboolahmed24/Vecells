import { useEffect, useMemo, useState } from "react";
import { VecellLogoWordmark } from "@vecells/design-system";

import { siteLinkPack } from "./generated/siteLinkPack";

type Pack = typeof siteLinkPack;
type Mode = "mock" | "actual";
type Platform = "android" | "ios";
type Page =
  | "Route_Path_Allowlist"
  | "Android_Assetlinks_Generator"
  | "iOS_AASA_Generator"
  | "Local_Hosting_Validator"
  | "Real_Registration_Gates";
type RouteRow = Pack["route_allowlist"][number];
type EnvironmentProfile = Pack["environment_profiles"][number];
type LiveGate = Pack["live_gate_pack"]["live_gates"][number];
type HostingStatus = "loading" | "pass" | "warn" | "fail";

type HostingCheck = {
  status: HostingStatus;
  detail: string;
  contentType: string;
  payload: string;
};

type HostingChecks = {
  assetlinks: HostingCheck;
  aasa: HostingCheck;
};

type AppState = {
  mode: Mode;
  page: Page;
  envId: EnvironmentProfile["env_id"];
  platform: Platform;
  filter: string;
  selectedPathId: string;
  includedPathIds: string[];
  hostDrafts: Record<string, string>;
  namedApprover: string;
  environmentTarget: string;
  allowRealMutation: "false" | "true";
};

const STORAGE_KEY = "vecells-site-link-studio";
const PAGE_ORDER: readonly Page[] = [
  "Route_Path_Allowlist",
  "Android_Assetlinks_Generator",
  "iOS_AASA_Generator",
  "Local_Hosting_Validator",
  "Real_Registration_Gates",
];

function readModeFromUrl(): Mode {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "actual" ? "actual" : "mock";
}

function readPageFromUrl(): Page {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");
  return PAGE_ORDER.includes(page as Page) ? (page as Page) : "Route_Path_Allowlist";
}

function baseState(): AppState {
  const includedPathIds = siteLinkPack.route_allowlist
    .filter((row) => row.include_by_default)
    .map((row) => row.path_id);
  return {
    mode: readModeFromUrl(),
    page: readPageFromUrl(),
    envId: "local_mock",
    platform: "android",
    filter: "",
    selectedPathId: siteLinkPack.route_allowlist[0].path_id,
    includedPathIds,
    hostDrafts: Object.fromEntries(
      siteLinkPack.environment_profiles.map((env) => [env.env_id, env.domain_placeholder]),
    ),
    namedApprover: "",
    environmentTarget: "",
    allowRealMutation: "false",
  };
}

function initialState(): AppState {
  const base = baseState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return base;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...base,
      ...parsed,
      mode: readModeFromUrl(),
      page: readPageFromUrl(),
      includedPathIds: parsed.includedPathIds ?? base.includedPathIds,
      hostDrafts: { ...base.hostDrafts, ...(parsed.hostDrafts ?? {}) },
    };
  } catch {
    return base;
  }
}

function routeById(pathId: string): RouteRow {
  return siteLinkPack.route_allowlist.find((row) => row.path_id === pathId)!;
}

function envById(envId: string): EnvironmentProfile {
  return siteLinkPack.environment_profiles.find((row) => row.env_id === envId)!;
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}

function includesText(row: RouteRow, query: string): boolean {
  const haystack = [
    row.path_pattern,
    row.route_family_ref,
    row.route_family_label,
    row.patient_visible_purpose,
    row.notes,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function iosPaths(rows: RouteRow[]): string[] {
  return dedupe(
    rows
      .filter((row) => row.ios_path_pattern && row.placeholder_in_mock === "yes")
      .map((row) => row.ios_path_pattern),
  ).sort();
}

function buildAndroidPreview(environment: EnvironmentProfile) {
  return [
    {
      relation: [environment.android_relation],
      target: {
        namespace: "android_app",
        package_name: environment.android_package_name,
        sha256_cert_fingerprints: environment.android_cert_fingerprints,
      },
    },
  ];
}

function buildIosPreview(environment: EnvironmentProfile, rows: RouteRow[]) {
  return {
    applinks: {
      apps: [],
      details: [
        {
          appID: environment.ios_app_id,
          paths: iosPaths(rows),
        },
      ],
    },
  };
}

function emptyHostingCheck(detail: string): HostingCheck {
  return {
    status: "loading",
    detail,
    contentType: "",
    payload: "",
  };
}

function decisionClass(decision: string): string {
  if (decision === "rejected") {
    return "blocked";
  }
  if (decision === "conditional") {
    return "caution";
  }
  return "approved";
}

function boolChip(value: string): string {
  return value === "yes" ? "Yes" : "No";
}

export default function App() {
  const [state, setState] = useState<AppState>(() => initialState());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [hostingChecks, setHostingChecks] = useState<HostingChecks>({
    assetlinks: emptyHostingCheck("Waiting for local .well-known fetch."),
    aasa: emptyHostingCheck("Waiting for local .well-known fetch."),
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setLastSavedAt(new Date().toISOString());
    }, 180);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", state.page);
    if (state.mode === "actual") {
      params.set("mode", "actual");
    } else {
      params.delete("mode");
    }
    const next = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", next);
  }, [state.page, state.mode]);

  const filteredRows = useMemo(() => {
    if (!state.filter.trim()) {
      return siteLinkPack.route_allowlist;
    }
    return siteLinkPack.route_allowlist.filter((row) => includesText(row, state.filter.trim()));
  }, [state.filter]);

  useEffect(() => {
    if (!filteredRows.length) {
      return;
    }
    const selectedStillVisible = filteredRows.some((row) => row.path_id === state.selectedPathId);
    if (!selectedStillVisible) {
      setState((current) => ({ ...current, selectedPathId: filteredRows[0].path_id }));
    }
  }, [filteredRows, state.selectedPathId]);

  const selectedRow = routeById(state.selectedPathId);
  const currentEnvironment = envById(state.envId);
  const includedRows = useMemo(
    () =>
      siteLinkPack.route_allowlist.filter(
        (row) => state.includedPathIds.includes(row.path_id) && row.placeholder_in_mock === "yes",
      ),
    [state.includedPathIds],
  );
  const androidPreview = useMemo(() => buildAndroidPreview(currentEnvironment), [currentEnvironment]);
  const iosPreview = useMemo(
    () => buildIosPreview(currentEnvironment, includedRows),
    [currentEnvironment, includedRows],
  );
  const groupedRows = useMemo(() => {
    const groups = new Map<string, RouteRow[]>();
    for (const row of filteredRows) {
      const current = groups.get(row.route_family_label) ?? [];
      current.push(row);
      groups.set(row.route_family_label, current);
    }
    return Array.from(groups.entries());
  }, [filteredRows]);

  const liveGateRows = siteLinkPack.live_gate_pack.live_gates;
  const blockedGateCount = liveGateRows.filter((row) => row.status === "blocked").length;
  const reviewGateCount = liveGateRows.filter((row) => row.status === "review_required").length;
  const realRegistrationBlocked = blockedGateCount > 0 || reviewGateCount > 0;
  const selectedGateRefs = new Set<string>(selectedRow.real_registration_gate_refs);
  const selectedGateRows = liveGateRows.filter((gate) => selectedGateRefs.has(gate.gate_id));
  const selectedWarnings = [
    selectedRow.allowlist_decision === "rejected"
      ? "This path is explicitly rejected because it would widen the site-link surface beyond the governed route contract."
      : "",
    selectedRow.embedded_safe === "conditional"
      ? "This route is conditional in embedded mode. Publication, continuity, and session proof must stay current."
      : "",
    selectedRow.requires_outbound_navigation_grant === "yes"
      ? "This route can render safely, but later overlay, browser, calendar, or artifact exits still need a short-lived OutboundNavigationGrant."
      : "",
    selectedRow.allows_from_nhs_app_query_marker === "yes"
      ? "`from=nhsApp` remains a recognition hint only. It cannot upgrade trust or bypass route gates."
      : "",
  ].filter(Boolean);

  useEffect(() => {
    let active = true;

    async function runHostingValidation() {
      const expectations = siteLinkPack.local_hosting_profile;

      async function fetchHosted(path: string) {
        const response = await fetch(path, { cache: "no-store" });
        const contentType = response.headers.get("content-type") ?? "";
        const payload = await response.json();
        return { ok: response.ok, contentType, payload };
      }

      try {
        const [assetlinks, aasa] = await Promise.all([
          fetchHosted(expectations.assetlinks_path),
          fetchHosted(expectations.aasa_path),
        ]);

        if (!active) {
          return;
        }

        const assetlinksMatches =
          JSON.stringify(assetlinks.payload) === JSON.stringify(expectations.generated_assetlinks);
        const aasaMatches = JSON.stringify(aasa.payload) === JSON.stringify(expectations.generated_aasa);
        const envWarning =
          state.envId === expectations.hosted_environment_id
            ? ""
            : ` Hosted files remain bound to ${humanize(expectations.hosted_environment_id)}.`;

        setHostingChecks({
          assetlinks: {
            status: assetlinks.ok && assetlinksMatches ? "pass" : assetlinks.ok ? "warn" : "fail",
            detail: assetlinks.ok
              ? `Fetched local assetlinks.json and compared it with the generator baseline.${envWarning}`
              : "Local assetlinks.json was not reachable.",
            contentType: assetlinks.contentType,
            payload: JSON.stringify(assetlinks.payload, null, 2),
          },
          aasa: {
            status: aasa.ok && aasaMatches ? "pass" : aasa.ok ? "warn" : "fail",
            detail: aasa.ok
              ? `Fetched local apple-app-site-association and compared it with the generator baseline.${envWarning}`
              : "Local apple-app-site-association was not reachable.",
            contentType: aasa.contentType,
            payload: JSON.stringify(aasa.payload, null, 2),
          },
        });
      } catch (error) {
        if (!active) {
          return;
        }
        const detail = error instanceof Error ? error.message : "Unknown local hosting validation failure.";
        setHostingChecks({
          assetlinks: { status: "fail", detail, contentType: "", payload: "" },
          aasa: { status: "fail", detail, contentType: "", payload: "" },
        });
      }
    }

    void runHostingValidation();
    return () => {
      active = false;
    };
  }, [state.envId]);

  function setMode(mode: Mode) {
    setState((current) => ({ ...current, mode }));
  }

  function setPage(page: Page) {
    setState((current) => ({ ...current, page }));
  }

  function setEnvironment(envId: EnvironmentProfile["env_id"]) {
    setState((current) => ({ ...current, envId }));
  }

  function setPlatform(platform: Platform) {
    setState((current) => ({ ...current, platform }));
  }

  function togglePath(pathId: string) {
    const row = routeById(pathId);
    if (row.placeholder_in_mock !== "yes") {
      return;
    }
    setState((current) => {
      const included = current.includedPathIds.includes(pathId)
        ? current.includedPathIds.filter((id) => id !== pathId)
        : [...current.includedPathIds, pathId];
      return {
        ...current,
        includedPathIds: included.length ? included : current.includedPathIds,
      };
    });
  }

  async function copyPreview(label: string, payload: unknown) {
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`${label} copied`);
    } catch {
      setCopyMessage(`${label} preview available below`);
    }
  }

  function renderPreviewCard(title: string, testId: string, payload: unknown, helper: string, onCopy: () => void) {
    return (
      <section className="panel preview-panel">
        <div className="section-heading">
          <div>
            <h2>{title}</h2>
            <p>{helper}</p>
          </div>
          <button className="soft-button" onClick={onCopy} data-testid={`copy-${testId}`}>
            Copy JSON
          </button>
        </div>
        <pre className="json-preview" data-testid={testId}>
          {JSON.stringify(payload, null, 2)}
        </pre>
      </section>
    );
  }

  function renderAllowlistPage() {
    return (
      <div className="page-stack">
        <section className="panel content-panel">
          <div className="section-heading">
            <div>
              <h2>Route path allowlist</h2>
              <p>Selected paths stay tied to route families, selected anchors, and safe return.</p>
            </div>
            <div className="chip-row">
              <span className="status-chip approved">Approved {siteLinkPack.summary.approved_count}</span>
              <span className="status-chip caution">Conditional {siteLinkPack.summary.conditional_count}</span>
              <span className="status-chip blocked">Rejected {siteLinkPack.summary.rejected_count}</span>
            </div>
          </div>
          <div className="allowlist-card">
            <div className="allowlist-meta">
              <span className={`status-chip ${decisionClass(selectedRow.allowlist_decision)}`}>
                {selectedRow.allowlist_decision}
              </span>
              <span className="mono-chip">{selectedRow.path_pattern}</span>
            </div>
            <h3>{selectedRow.route_family_label}</h3>
            <p>{selectedRow.patient_visible_purpose}</p>
            <div className="chip-row compact">
              <span className="status-chip subtle">Embedded safe: {selectedRow.embedded_safe}</span>
              <span className="status-chip subtle">
                Requires auth: {boolChip(selectedRow.requires_authenticated_session)}
              </span>
              <span className="status-chip subtle">
                Query marker hint: {boolChip(selectedRow.allows_from_nhs_app_query_marker)}
              </span>
            </div>
          </div>
          <div className="rule-grid">
            <article className="info-card">
              <h3>Return-safe rule</h3>
              <p>{selectedRow.return_contract_ref}</p>
            </article>
            <article className="info-card">
              <h3>Selected anchor</h3>
              <p className="mono-meta">{selectedRow.selected_anchor_ref}</p>
            </article>
            <article className="info-card">
              <h3>Mock inclusion</h3>
              <p>{selectedRow.placeholder_in_mock === "yes" ? "Included in rehearsal files" : "Never emitted in rehearsal files"}</p>
            </article>
          </div>
        </section>
        <section className="panel content-panel">
          <div className="section-heading">
            <div>
              <h2>Included iOS paths</h2>
              <p>The iOS preview expands from the currently included approved and conditional rows.</p>
            </div>
          </div>
          <div className="path-chip-grid">
            {iosPaths(includedRows).map((pathPattern) => (
              <span key={pathPattern} className="path-chip">
                {pathPattern}
              </span>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderAndroidPage() {
    return (
      <div className="page-stack">
        {renderPreviewCard(
          "Android assetlinks preview",
          "json-preview-android",
          androidPreview,
          "Android App Links remain domain-level in the hosted file. Vecells keeps the path allowlist as a separate first-class contract.",
          () => void copyPreview("Android preview", androidPreview),
        )}
        <section className="panel content-panel">
          <div className="section-heading">
            <div>
              <h2>Route coverage companion</h2>
              <p>These route patterns stay approved separately because Android does not carry path lists in the hosted JSON.</p>
            </div>
          </div>
          <div className="path-chip-grid">
            {includedRows.map((row) => (
              <span key={row.path_id} className="path-chip">
                {row.path_pattern}
              </span>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderIosPage() {
    return (
      <div className="page-stack">
        {renderPreviewCard(
          "iOS AASA preview",
          "json-preview-ios",
          iosPreview,
          "The AASA preview expands the explicit path allowlist for the selected environment and current mock inclusion set.",
          () => void copyPreview("iOS preview", iosPreview),
        )}
        <section className="panel content-panel">
          <div className="section-heading">
            <div>
              <h2>Expanded path list</h2>
              <p>Only approved and conditional rehearsal paths become iOS entries.</p>
            </div>
          </div>
          <div className="path-chip-grid">
            {iosPaths(includedRows).map((pathPattern) => (
              <span key={pathPattern} className="path-chip">
                {pathPattern}
              </span>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderHostingCard(title: string, testId: string, check: HostingCheck) {
    return (
      <article className="hosting-card" data-testid={testId}>
        <div className="hosting-meta">
          <span className={`status-chip ${check.status === "pass" ? "approved" : check.status === "warn" ? "caution" : check.status === "loading" ? "subtle" : "blocked"}`}>
            {check.status}
          </span>
          <span className="mono-chip">{check.contentType || "no content-type yet"}</span>
        </div>
        <h3>{title}</h3>
        <p>{check.detail}</p>
        <pre className="json-preview small">{check.payload || "Waiting for fetch..."}</pre>
      </article>
    );
  }

  function renderHostingPage() {
    return (
      <section className="panel content-panel" data-testid="local-hosting-panel">
        <div className="section-heading">
          <div>
            <h2>Local hosting validator</h2>
            <p>
              The hosted `.well-known` files are tied to the local mock baseline, not to every experimental
              path toggle in the workbench.
            </p>
          </div>
          <span className="mono-chip">{siteLinkPack.local_hosting_profile.hosted_environment_id}</span>
        </div>
        <div className="hosting-grid">
          {renderHostingCard("Hosted assetlinks.json", "hosting-check-assetlinks", hostingChecks.assetlinks)}
          {renderHostingCard("Hosted apple-app-site-association", "hosting-check-aasa", hostingChecks.aasa)}
        </div>
      </section>
    );
  }

  function renderGatesPage() {
    return (
      <div className="page-stack">
        <section className="panel content-panel">
          <div className="section-heading">
            <div>
              <h2>Real registration gates</h2>
              <p>Actual registration remains blocked until official environment values and approvals exist.</p>
            </div>
          </div>
          <div className="notice-block" data-testid="actual-submission-notice">
            <strong>Actual provider strategy stays fail-closed.</strong>
            <span>
              This UI can rehearse the field map, but it cannot register anything with the NHS App team while
              Phase 7 is deferred and official mobile values are still placeholders.
            </span>
          </div>
          <div className="field-grid">
            <label className="field-card">
              <span>Named approver</span>
              <input
                data-testid="actual-field-named-approver"
                value={state.namedApprover}
                onChange={(event) =>
                  setState((current) => ({ ...current, namedApprover: event.target.value }))
                }
                placeholder="Named approver required for live mutation"
              />
            </label>
            <label className="field-card">
              <span>Environment target</span>
              <select
                data-testid="actual-field-environment-target"
                value={state.environmentTarget}
                onChange={(event) =>
                  setState((current) => ({ ...current, environmentTarget: event.target.value }))
                }
              >
                <option value="">Select</option>
                {siteLinkPack.environment_profiles
                  .filter((env) => env.env_id !== "local_mock")
                  .map((env) => (
                    <option key={env.env_id} value={env.env_id}>
                      {env.label}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field-card">
              <span>ALLOW_REAL_PROVIDER_MUTATION</span>
              <select
                data-testid="actual-field-allow-mutation"
                value={state.allowRealMutation}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    allowRealMutation: event.target.value as "false" | "true",
                  }))
                }
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            </label>
          </div>
          <div className="submit-row">
            <button data-testid="actual-submit-button" disabled={realRegistrationBlocked}>
              Real registration blocked
            </button>
          </div>
        </section>
        <section className="panel content-panel" data-testid="live-gate-board">
          <div className="section-heading">
            <div>
              <h2>Gate board</h2>
              <p>Every unmet condition remains visible and non-silent.</p>
            </div>
          </div>
          <div className="gate-grid">
            {liveGateRows.map((gate) => (
              <article key={gate.gate_id} className="gate-card">
                <div className="hosting-meta">
                  <strong>{gate.label}</strong>
                  <span className={`status-chip ${gate.status === "blocked" ? "blocked" : gate.status === "review_required" ? "caution" : "approved"}`}>
                    {gate.status}
                  </span>
                </div>
                <p>{gate.summary}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderPageContent() {
    switch (state.page) {
      case "Android_Assetlinks_Generator":
        return renderAndroidPage();
      case "iOS_AASA_Generator":
        return renderIosPage();
      case "Local_Hosting_Validator":
        return renderHostingPage();
      case "Real_Registration_Gates":
        return renderGatesPage();
      case "Route_Path_Allowlist":
      default:
        return renderAllowlistPage();
    }
  }

  return (
    <div className="app-shell">
      <div className="top-banner">
        <VecellLogoWordmark aria-hidden="true" className="vecells-mark" />
        <span className="mock-ribbon">MOCK_SITE_LINKS</span>
        <span className="quiet-note">
          Site-link rehearsal only. Real Android/iOS values stay placeholder-only until the NHS App team issues them.
        </span>
      </div>

      <header className="sticky-header">
        <div className="hero-panel">
          <div>
            <div className="mode-label">{siteLinkPack.visual_mode}</div>
            <h1>Route-bound site-link metadata with safe return, not ad hoc URLs</h1>
            <p>{siteLinkPack.mission}</p>
          </div>
          <div className="control-cluster">
            <div className="mode-toggle">
              <button
                className={state.mode === "mock" ? "active" : ""}
                data-testid="mode-toggle-mock"
                onClick={() => setMode("mock")}
              >
                Mock now
              </button>
              <button
                className={state.mode === "actual" ? "active" : ""}
                data-testid="mode-toggle-actual"
                onClick={() => setMode("actual")}
              >
                Actual later
              </button>
            </div>
            <div className="copy-state">{copyMessage || "Copy-safe previews ready"}</div>
          </div>
        </div>

        <div className="header-grid">
          <section className="summary-panel" data-testid="environment-switcher">
            <div className="section-heading compact">
              <div>
                <h2>Environment</h2>
                <p>{currentEnvironment.notes}</p>
              </div>
            </div>
            <div className="tab-row">
              {siteLinkPack.environment_profiles.map((env) => (
                <button
                  key={env.env_id}
                  className={state.envId === env.env_id ? "active" : ""}
                  data-testid={`env-tab-${env.env_id}`}
                  onClick={() => setEnvironment(env.env_id)}
                >
                  {env.label}
                </button>
              ))}
            </div>
          </section>

          <section className="summary-panel" data-testid="platform-switcher">
            <div className="section-heading compact">
              <div>
                <h2>Platform</h2>
                <p>Switch JSON preview focus without changing the underlying route contract.</p>
              </div>
            </div>
            <div className="tab-row">
              <button
                className={state.platform === "android" ? "active" : ""}
                data-testid="platform-tab-android"
                onClick={() => setPlatform("android")}
              >
                Android
              </button>
              <button
                className={state.platform === "ios" ? "active" : ""}
                data-testid="platform-tab-ios"
                onClick={() => setPlatform("ios")}
              >
                iOS
              </button>
            </div>
          </section>

          <section className="summary-panel metrics-panel">
            <div className="metric">
              <label>Host status</label>
              <strong>{humanize(currentEnvironment.host_status)}</strong>
            </div>
            <div className="metric">
              <label>Included rehearsal rows</label>
              <strong>{includedRows.length}</strong>
            </div>
            <div className="metric">
              <label>Blocked gates</label>
              <strong>{blockedGateCount}</strong>
            </div>
            <div className="metric">
              <label>Review gates</label>
              <strong>{reviewGateCount}</strong>
            </div>
          </section>
        </div>
      </header>

      <nav className="page-tabs" aria-label="Studio pages">
        {PAGE_ORDER.map((page) => (
          <button
            key={page}
            className={state.page === page ? "active" : ""}
            data-testid={`page-tab-${page}`}
            onClick={() => setPage(page)}
          >
            {humanize(page)}
          </button>
        ))}
      </nav>

      <main className="workspace-grid" data-testid="workspace-grid">
        <aside className="panel route-rail" data-testid="route-tree">
          <div className="section-heading compact">
            <div>
              <h2>Route tree</h2>
              <p>Filter, inspect, and decide which rehearsal paths stay in the metadata previews.</p>
            </div>
          </div>
          <label className="field-card slim">
            <span>Filter routes</span>
            <input
              data-testid="route-filter"
              value={state.filter}
              onChange={(event) =>
                setState((current) => ({ ...current, filter: event.target.value }))
              }
              placeholder="Search path, route family, or note"
            />
          </label>
          <div className="tree-groups">
            {groupedRows.map(([groupLabel, rows]) => (
              <section key={groupLabel} className="tree-group">
                <h3>{groupLabel}</h3>
                <div className="tree-list">
                  {rows.map((row) => {
                    const included = state.includedPathIds.includes(row.path_id);
                    const togglable = row.placeholder_in_mock === "yes";
                    return (
                      <button
                        key={row.path_id}
                        className={`tree-row ${row.path_id === selectedRow.path_id ? "selected" : ""}`}
                        data-testid={`route-row-${row.path_id}`}
                        onClick={() => setState((current) => ({ ...current, selectedPathId: row.path_id }))}
                      >
                        <div className="tree-row-top">
                          <span className={`status-chip ${decisionClass(row.allowlist_decision)}`}>
                            {row.allowlist_decision}
                          </span>
                          <span className="mono-chip">{row.path_pattern}</span>
                        </div>
                        <span className="tree-purpose">{row.patient_visible_purpose}</span>
                        <label className={`toggle-line ${togglable ? "" : "disabled"}`}>
                          <input
                            type="checkbox"
                            checked={included}
                            disabled={!togglable}
                            onChange={(event) => {
                              event.stopPropagation();
                              togglePath(row.path_id);
                            }}
                          />
                          <span>{togglable ? "Include in rehearsal previews" : "Not emitted in rehearsal previews"}</span>
                        </label>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <section className="workbench-column">{renderPageContent()}</section>

        <aside className="panel inspector" data-testid="path-policy-inspector">
          <div className="section-heading">
            <div>
              <h2>Path policy inspector</h2>
              <p>Selected route safety, host placeholder management, and later gate bindings.</p>
            </div>
          </div>
          <div className="inspector-stack">
            <div className="inspector-block">
              <div className="hosting-meta">
                <span className={`status-chip ${decisionClass(selectedRow.allowlist_decision)}`}>
                  {selectedRow.allowlist_decision}
                </span>
                <span className="mono-chip">{selectedRow.path_pattern}</span>
              </div>
              <h3>{selectedRow.route_family_ref}</h3>
              <p>{selectedRow.notes}</p>
            </div>

            <label className="field-card">
              <span>Host placeholder</span>
              <input
                value={state.hostDrafts[state.envId] ?? currentEnvironment.domain_placeholder}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    hostDrafts: { ...current.hostDrafts, [state.envId]: event.target.value },
                  }))
                }
                placeholder={currentEnvironment.domain_placeholder}
              />
            </label>

            <div className="rule-grid single">
              <article className="info-card">
                <h3>Selected anchor</h3>
                <p className="mono-meta">{selectedRow.selected_anchor_ref}</p>
              </article>
              <article className="info-card">
                <h3>Return contract</h3>
                <p>{selectedRow.return_contract_ref}</p>
              </article>
            </div>

            <div className="warning-stack">
              {selectedWarnings.length ? (
                selectedWarnings.map((warning, index) => (
                  <article key={warning} className="warning-card" data-testid={index === 0 ? "unsafe-path-warning" : undefined}>
                    {warning}
                  </article>
                ))
              ) : (
                <article className="info-card">
                  <h3>Current posture</h3>
                  <p>This selected route is rehearsal-safe with the current placeholder constraints.</p>
                </article>
              )}
            </div>

            <div className="inspector-block">
              <h3>Gate refs</h3>
              <div className="gate-list compact">
                {selectedGateRows.map((gate) => (
                  <div key={gate.gate_id} className="gate-line">
                    <span className={`status-chip ${gate.status === "blocked" ? "blocked" : "caution"}`}>
                      {gate.status}
                    </span>
                    <span>{gate.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="inspector-block">
              <h3>Source refs</h3>
              <ul className="source-list">
                {selectedRow.source_refs.map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </main>

      <section className="panel route-diagram-panel" data-testid="route-diagram">
        <div className="section-heading">
          <div>
            <h2>Jump-off flow</h2>
            <p>Every site link lands through the same shell law: jump-off, site link, embedded route, safe return.</p>
          </div>
          <div className="hosting-meta">
            <span className="mono-chip">{state.hostDrafts[state.envId]}</span>
            <span className="status-chip subtle">{state.platform}</span>
          </div>
        </div>
        <div className="diagram-row">
          <div className="diagram-node">
            <strong>jump_off</strong>
            <span>NHS App or governed notification entry</span>
          </div>
          <div className="diagram-arrow">→</div>
          <div className="diagram-node">
            <strong>site_link</strong>
            <span className="mono-meta">{selectedRow.path_pattern}</span>
          </div>
          <div className="diagram-arrow">→</div>
          <div className="diagram-node">
            <strong>embedded_route</strong>
            <span>{selectedRow.route_family_label}</span>
          </div>
          <div className="diagram-arrow">→</div>
          <div className="diagram-node">
            <strong>safe_return</strong>
            <span>{selectedRow.return_contract_ref}</span>
          </div>
        </div>
      </section>

      <footer className="footer-bar">
        <span className="mono-chip">{siteLinkPack.task_id}</span>
        <span className="quiet-note">{lastSavedAt ? `Autosaved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Autosave armed"}</span>
        {reducedMotion ? (
          <span className="status-chip subtle" data-testid="reduced-motion-indicator">
            Reduced motion active
          </span>
        ) : null}
      </footer>
    </div>
  );
}
