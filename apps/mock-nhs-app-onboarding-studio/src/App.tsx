import { useEffect, useMemo, useState } from "react";
import { VecellLogoWordmark } from "@vecells/design-system";

import { nhsAppPack } from "./generated/nhsAppPack";

type Pack = typeof nhsAppPack;
type Mode = "mock" | "actual";
type Page =
  | "Eligibility_and_EOI"
  | "Product_Review_and_Demo"
  | "Embedded_Readiness_Preview"
  | "Sandpit_to_AOS_Ladder"
  | "SCAL_and_Release_Gates";
type PreviewMode = "standalone" | "embedded";

type Category = Pack["stage_categories"][number];
type Stage = Pack["stages"][number];
type Field = Pack["fields"][number];
type Artifact = Pack["assurance_artifacts"][number];
type EligibilityRow = Pack["eligibility_matrix"][number];
type PreviewRoute = Pack["preview_routes"][number];
type RouteRow = Pack["selected_route_refs"][number];
type LiveGate = Pack["live_gate_pack"]["live_gates"][number];
type RiskRow = Pack["selected_risks"][number];

type AppState = {
  mode: Mode;
  page: Page;
  activeCategoryId: string;
  selectedStageId: string;
  selectedArtifactId: string;
  selectedPreviewId: string;
  previewMode: PreviewMode;
  values: Record<string, string>;
  artifacts: Record<string, boolean>;
};

const STORAGE_KEY = "vecells-nhs-app-onboarding-studio";
const PAGE_ORDER: readonly Page[] = [
  "Eligibility_and_EOI",
  "Product_Review_and_Demo",
  "Embedded_Readiness_Preview",
  "Sandpit_to_AOS_Ladder",
  "SCAL_and_Release_Gates",
];

function readModeFromUrl(): Mode {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "actual" ? "actual" : "mock";
}

function readPageFromUrl(): Page {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");
  if (PAGE_ORDER.includes(page as Page)) {
    return page as Page;
  }
  return "Eligibility_and_EOI";
}

function categoryById(categoryId: string): Category {
  return nhsAppPack.stage_categories.find((row) => row.category_id === categoryId)!;
}

function stageById(stageId: string): Stage {
  return nhsAppPack.stages.find((row) => row.nhs_app_stage_id === stageId)!;
}

function fieldById(fieldId: string): Field {
  return nhsAppPack.fields.find((row) => row.field_id === fieldId)!;
}

function artifactById(artifactId: string): Artifact {
  return nhsAppPack.assurance_artifacts.find((row) => row.artifact_id === artifactId)!;
}

function previewById(previewId: string): PreviewRoute {
  return nhsAppPack.preview_routes.find((row) => row.preview_id === previewId)!;
}

function routeById(routeId: string): RouteRow {
  return nhsAppPack.selected_route_refs.find((row) => row.route_family_id === routeId)!;
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function boolLabel(value: string): string {
  return value === "true" ? "true" : "false";
}

function baseState(): AppState {
  const firstCategory = nhsAppPack.stage_categories[0];
  const firstStage = firstCategory.stage_ids[0];
  return {
    mode: readModeFromUrl(),
    page: readPageFromUrl(),
    activeCategoryId: firstCategory.category_id,
    selectedStageId: firstStage,
    selectedArtifactId: nhsAppPack.assurance_artifacts[0].artifact_id,
    selectedPreviewId: nhsAppPack.preview_routes[0].preview_id,
    previewMode: "embedded",
    values: { ...nhsAppPack.draft_values },
    artifacts: { ...nhsAppPack.artifact_defaults },
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
      values: { ...base.values, ...(parsed.values ?? {}) },
      artifacts: { ...base.artifacts, ...(parsed.artifacts ?? {}) },
    };
  } catch {
    return base;
  }
}

function stageBlockers(stage: Stage, state: AppState): string[] {
  const blockers: string[] = [];
  for (const fieldId of stage.required_field_ids) {
    const value = (state.values[fieldId] ?? "").trim();
    if (!value) {
      blockers.push(`Missing field: ${fieldById(fieldId).label}`);
    }
  }
  for (const artifactId of stage.required_artifact_ids) {
    if (!state.artifacts[artifactId]) {
      blockers.push(`Missing evidence: ${artifactById(artifactId).artifact_name}`);
    }
  }
  if (state.mode === "actual") {
    for (const gate of nhsAppPack.live_gate_pack.live_gates) {
      if (gate.status === "blocked" || gate.status === "review_required") {
        blockers.push(`${gate.label}: ${gate.summary}`);
      }
    }
  }
  for (const dependency of stage.blocking_dependencies) {
    if (dependency.startsWith("LIVE_GATE_")) {
      continue;
    }
    blockers.push(`Tracked dependency: ${dependency}`);
  }
  return blockers;
}

function fieldGroups(fields: Field[]): Array<{ label: string; items: Field[] }> {
  const order = [
    "contact_information",
    "product_functionality",
    "technical",
    "design_delivery",
    "messaging",
    "internal_design",
    "internal_delivery",
    "live_controls",
  ];
  return order
    .map((section) => ({
      label: humanize(section),
      items: fields.filter((field) => field.section === section),
    }))
    .filter((group) => group.items.length > 0);
}

export default function App() {
  const [state, setState] = useState<AppState>(() => initialState());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

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

  const currentCategory = categoryById(state.activeCategoryId);
  const currentStage = stageById(state.selectedStageId);
  const selectedArtifact = artifactById(state.selectedArtifactId);
  const currentPreview = previewById(state.selectedPreviewId);
  const currentRoute = routeById(currentPreview.route_family_ref);
  const blockers = useMemo(() => stageBlockers(currentStage, state), [currentStage, state]);

  const categoryStages = useMemo(
    () => currentCategory.stage_ids.map((stageId) => stageById(stageId)),
    [currentCategory],
  );

  const selectedStageFields = useMemo(
    () => currentStage.required_field_ids.map((fieldId) => fieldById(fieldId)),
    [currentStage],
  );

  const releaseFields = useMemo(
    () => ["int12_named_approver", "int13_environment_target", "int14_allow_real_provider_mutation"].map(fieldById),
    [],
  );

  const activeArtifacts = useMemo(
    () =>
      nhsAppPack.assurance_artifacts.filter(
        (artifact) =>
          artifact.required_stage_ids.includes(currentStage.nhs_app_stage_id) ||
          (currentStage.required_artifact_ids as readonly string[]).includes(artifact.artifact_id),
      ),
    [currentStage],
  );

  const liveGateRows = nhsAppPack.live_gate_pack.live_gates;
  const blockedGateCount = liveGateRows.filter((row) => row.status === "blocked").length;
  const designReadinessScore = Math.max(
    18,
    Math.round(
      (nhsAppPack.eligibility_matrix.filter((row) => row.mock_now_status === "evidenced").length /
        nhsAppPack.eligibility_matrix.length) *
        100,
    ),
  );

  const eligibilityStatus = blockedGateCount > 0 ? "Deferred / gated" : "Ready";

  const pageSpecificFields = useMemo(() => {
    if (state.page === "Eligibility_and_EOI") {
      return nhsAppPack.fields.filter((field) =>
        [
          "contact_information",
          "product_functionality",
          "technical",
          "design_delivery",
          "messaging",
        ].includes(field.section),
      );
    }
    if (state.page === "Product_Review_and_Demo") {
      return currentStage.required_field_ids.map((fieldId) => fieldById(fieldId));
    }
    if (state.page === "SCAL_and_Release_Gates") {
      return releaseFields;
    }
    return selectedStageFields;
  }, [currentStage, releaseFields, selectedStageFields, state.page]);

  function updateValue(fieldId: string, value: string) {
    setState((previous) => ({
      ...previous,
      values: { ...previous.values, [fieldId]: value },
    }));
  }

  function toggleArtifact(artifactId: string) {
    setState((previous) => ({
      ...previous,
      selectedArtifactId: artifactId,
      artifacts: {
        ...previous.artifacts,
        [artifactId]: !previous.artifacts[artifactId],
      },
    }));
  }

  function selectCategory(categoryId: string) {
    const category = categoryById(categoryId);
    setState((previous) => ({
      ...previous,
      activeCategoryId: categoryId,
      selectedStageId: category.stage_ids[0],
    }));
  }

  function selectPage(page: Page) {
    setState((previous) => ({ ...previous, page }));
  }

  function setMode(mode: Mode) {
    setState((previous) => ({ ...previous, mode }));
  }

  function actualSubmitDisabled(): boolean {
    return liveGateRows.some((gate) => gate.status === "blocked" || gate.status === "review_required");
  }

  return (
    <main className="app-shell" data-testid="atelier-shell">
      <div className="phase7-banner" data-testid="phase7-deferred-banner">
        <VecellLogoWordmark aria-hidden="true" className="vecells-mark" />
        <strong>nhs app onboarding test mode</strong>
        <span>Current programme remains deferred. This studio rehearses readiness; it does not open current-baseline delivery.</span>
      </div>

      <header className="topbar">
        <section className="readiness-banner" data-testid="readiness-banner">
          <Metric label="Eligibility state" value={eligibilityStatus} tone="primary" />
          <Metric label="Environment stage" value={currentStage.nhs_app_stage_name} tone="embedded" />
          <Metric label="Design readiness" value={`${designReadinessScore}%`} tone="success" />
          <Metric label="Autosave" value={lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : "not yet"} tone="muted" />
        </section>

        <section className="mode-card">
          <div>
            <div className="mock-ribbon">Embedded_Channel_Atelier</div>
            <h1>Deferred channel onboarding, embedded-shell preview, and live-gate rehearsal</h1>
            <p className="muted-copy">
              One portal, one backend truth, same route families. Embedded posture narrows chrome and
              capability; it does not fork the product.
            </p>
          </div>

          <div className="mode-toggle" data-testid="mode-toggle">
            <button
              type="button"
              className={state.mode === "mock" ? "active" : ""}
              onClick={() => setMode("mock")}
              data-testid="mode-toggle-mock"
            >
              Mock now
            </button>
            <button
              type="button"
              className={state.mode === "actual" ? "active" : ""}
              onClick={() => setMode("actual")}
              data-testid="mode-toggle-actual"
            >
              Actual later
            </button>
          </div>
        </section>
      </header>

      <div className="layout">
        <aside className="stage-rail" data-testid="stage-rail" aria-label="Stage rail">
          {nhsAppPack.stage_categories.map((category) => (
            <button
              type="button"
              key={category.category_id}
              className={`stage-button ${state.activeCategoryId === category.category_id ? "active" : ""}`}
              onClick={() => selectCategory(category.category_id)}
              data-testid={`stage-button-${category.category_id}`}
            >
              <div className="stage-button-header">
                <strong>{category.label}</strong>
                <span className="mono-chip">{category.stage_count}</span>
              </div>
              <p>{category.blocked_message}</p>
            </button>
          ))}
        </aside>

        <section className="workspace">
          <nav className="page-tabs" aria-label="Studio pages">
            {PAGE_ORDER.map((page) => (
              <button
                key={page}
                type="button"
                className={`page-tab ${state.page === page ? "active" : ""}`}
                onClick={() => selectPage(page)}
                data-testid={`page-tab-${page}`}
              >
                {humanize(page)}
              </button>
            ))}
          </nav>

          <section className="stage-strip">
            {categoryStages.map((stage) => (
              <button
                key={stage.nhs_app_stage_id}
                type="button"
                className={`stage-card ${state.selectedStageId === stage.nhs_app_stage_id ? "active" : ""}`}
                onClick={() =>
                  setState((previous) => ({
                    ...previous,
                    selectedStageId: stage.nhs_app_stage_id,
                  }))
                }
                data-testid={`stage-card-${stage.nhs_app_stage_id}`}
              >
                <div className="stage-card-top">
                  <strong>{stage.nhs_app_stage_name}</strong>
                  <span className="status-chip">{stage.browser_automation_possible}</span>
                </div>
                <p>{stage.notes}</p>
              </button>
            ))}
          </section>

          <section className="panel hero-panel">
            <div className="title-row">
              <div>
                <h2>{currentStage.nhs_app_stage_name}</h2>
                <p className="muted-copy">{currentStage.notes}</p>
              </div>
              <div className="chip-row">
                <span className="mono-chip">{currentStage.nhs_app_stage_id}</span>
                <span className="status-chip">{currentStage.browser_automation_possible}</span>
              </div>
            </div>

            <div className="blocker-banner" data-testid="blocked-stage-message">
              <strong>{currentCategory.blocked_message}</strong>
              <span>{blockers.length} blockers or tracked dependencies in the current posture.</span>
            </div>
          </section>

          {state.page === "Eligibility_and_EOI" && (
            <>
              <section className="panel">
                <div className="title-row">
                  <div>
                    <h2>Eligibility gap chips</h2>
                    <p className="muted-copy">
                      Current official NHS App eligibility is modelled as explicit rows, not a narrative guess.
                    </p>
                  </div>
                </div>
                <div className="chip-grid">
                  {nhsAppPack.eligibility_matrix.map((row) => (
                    <button
                      key={row.criterion_id}
                      type="button"
                      className={`eligibility-chip ${row.actual_later_status.includes("blocked") ? "blocked" : row.mock_now_status === "evidenced" ? "ready" : "pending"}`}
                      onClick={() => setState((previous) => ({ ...previous, selectedArtifactId: "art_eoi_dossier" }))}
                      data-testid={`eligibility-chip-${row.criterion_id}`}
                    >
                      <strong>{row.criterion_label}</strong>
                      <span>{row.actual_later_status}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="title-row">
                  <div>
                    <h2>EOI field rehearsal</h2>
                    <p className="muted-copy">
                      The official question set is preserved here so the later EOI does not need to be re-derived.
                    </p>
                  </div>
                </div>
                {fieldGroups(pageSpecificFields).map((group) => (
                  <FieldGroup key={group.label} title={group.label}>
                    {group.items.map((field) => (
                      <FieldInput
                        key={field.field_id}
                        field={field}
                        value={state.values[field.field_id] ?? ""}
                        onChange={updateValue}
                      />
                    ))}
                  </FieldGroup>
                ))}
              </section>
            </>
          )}

          {state.page === "Product_Review_and_Demo" && (
            <>
              <section className="panel">
                <div className="title-row">
                  <div>
                    <h2>Product review and demo readiness</h2>
                    <p className="muted-copy">
                      The review call and prioritisation remain real NHS App team checkpoints. The studio only rehearses the evidence narrative.
                    </p>
                  </div>
                </div>
                <div className="two-column-list">
                  <InfoCard title="Demo expectations" items={currentStage.demo_expectations} />
                  <InfoCard title="Design expectations" items={currentStage.design_expectations} />
                </div>
              </section>

              <section className="panel">
                <div className="title-row">
                  <div>
                    <h2>Dossier cards</h2>
                    <p className="muted-copy">
                      Toggle whether a rehearsal artifact is ready. This does not mark the real NHS App process as complete.
                    </p>
                  </div>
                </div>
                <div className="artifact-grid">
                  {activeArtifacts.map((artifact) => (
                    <button
                      type="button"
                      key={artifact.artifact_id}
                      className={`artifact-card ${state.artifacts[artifact.artifact_id] ? "active" : ""}`}
                      onClick={() => toggleArtifact(artifact.artifact_id)}
                      data-testid={`artifact-toggle-${artifact.artifact_id}`}
                    >
                      <div className="artifact-card-top">
                        <strong>{artifact.artifact_name}</strong>
                        <span className="mono-chip">{artifact.mock_now_status}</span>
                      </div>
                      <p>{artifact.notes}</p>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {state.page === "Embedded_Readiness_Preview" && (
            <>
              <section className="panel">
                <div className="title-row">
                  <div>
                    <h2>Embedded preview tabs</h2>
                    <p className="muted-copy">
                      The same route families remain visible. Only shell chrome, bridge actions, and governed delivery posture change.
                    </p>
                  </div>
                  <div className="chip-row">
                    <button
                      type="button"
                      className={`preview-mode ${state.previewMode === "standalone" ? "active" : ""}`}
                      onClick={() => setState((previous) => ({ ...previous, previewMode: "standalone" }))}
                      data-testid="preview-mode-standalone"
                    >
                      Standalone shell
                    </button>
                    <button
                      type="button"
                      className={`preview-mode ${state.previewMode === "embedded" ? "active" : ""}`}
                      onClick={() => setState((previous) => ({ ...previous, previewMode: "embedded" }))}
                      data-testid="preview-mode-embedded"
                    >
                      Embedded shell
                    </button>
                  </div>
                </div>

                <div className="preview-route-tabs">
                  {nhsAppPack.preview_routes.map((preview) => (
                    <button
                      key={preview.preview_id}
                      type="button"
                      className={`preview-route-tab ${state.selectedPreviewId === preview.preview_id ? "active" : ""}`}
                      onClick={() => setState((previous) => ({ ...previous, selectedPreviewId: preview.preview_id }))}
                      data-testid={preview.testid}
                    >
                      {preview.title}
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel preview-shell-panel" data-testid="preview-shell">
                <div className={`preview-shell ${state.previewMode}`}>
                  <div className="preview-shell-top">
                    <div>
                      <div className="mock-ribbon">{state.previewMode === "embedded" ? "embedded" : "standalone"}</div>
                      <h2>{currentPreview.title}</h2>
                    </div>
                    <div className="chip-row">
                      <span className="mono-chip">{currentPreview.entry_path}</span>
                      <span className="status-chip">{currentRoute.route_family}</span>
                    </div>
                  </div>

                  {state.previewMode === "standalone" ? (
                    <div className="shell-chrome">
                      <div className="shell-header">Patient portal header</div>
                      <div className="shell-body">
                        <PreviewFact label="Shell status" value={currentPreview.standalone_state} />
                        <PreviewFact label="Continuity" value={currentPreview.continuity_rule} />
                        <PreviewFact label="Selected anchor" value={currentPreview.selected_anchor} mono />
                      </div>
                      <div className="shell-footer">Footer and browser-safe help links</div>
                    </div>
                  ) : (
                    <div className="shell-chrome embedded">
                      <div className="embedded-header">Native NHS App chrome owns header. Supplier header hidden.</div>
                      <div className="shell-body">
                        <PreviewFact label="Embedded state" value={currentPreview.embedded_state} />
                        <PreviewFact label="Safe navigation" value={currentPreview.safe_navigation} />
                        <PreviewFact label="Artifact rule" value={currentPreview.artifact_rule} />
                        <PreviewFact label="Degraded mode" value={currentPreview.degraded_mode} />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {state.page === "Sandpit_to_AOS_Ladder" && (
            <>
              <section className="panel">
                <div className="title-row">
                  <div>
                    <h2>Sandpit to AOS ladder</h2>
                    <p className="muted-copy">
                      Sandpit and AOS are discrete gates with repeated deployment, testing, demo, and sign-off discipline.
                    </p>
                  </div>
                </div>
                <div className="ladder-cards">
                  {nhsAppPack.stages.map((stage) => (
                    <button
                      type="button"
                      key={stage.nhs_app_stage_id}
                      className={`ladder-card ${state.selectedStageId === stage.nhs_app_stage_id ? "active" : ""}`}
                      onClick={() =>
                        setState((previous) => ({
                          ...previous,
                          activeCategoryId: stage.category_id,
                          selectedStageId: stage.nhs_app_stage_id,
                        }))
                      }
                      data-testid={`ladder-stage-${stage.nhs_app_stage_id}`}
                    >
                      <strong>{stage.nhs_app_stage_name}</strong>
                      <span>{stage.category_id}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="two-column-list">
                  <InfoCard title="Technical expectations" items={currentStage.technical_expectations} />
                  <InfoCard title="Entry requirements" items={currentStage.entry_requirements} />
                </div>
              </section>
            </>
          )}

          {state.page === "SCAL_and_Release_Gates" && (
            <>
              <section className="panel">
                <div className="title-row">
                  <div>
                    <h2>SCAL and release gates</h2>
                    <p className="muted-copy">
                      Actual mode is a gated dossier review only. No real mutation or submission happens from this UI.
                    </p>
                  </div>
                </div>
                <div className="actual-notice" data-testid="actual-submission-notice">
                  <strong>Actual provider strategy stays fail-closed.</strong>
                  <span>Current programme remains deferred, the external-readiness gate is withheld, and live-provider mutation requires explicit flags and named ownership.</span>
                </div>

                <FieldGroup title="Live-control fields">
                  {releaseFields.map((field) => (
                    <FieldInput
                      key={field.field_id}
                      field={field}
                      value={state.values[field.field_id] ?? ""}
                      onChange={updateValue}
                      testIdOverride={
                        field.field_id === "int12_named_approver"
                          ? "actual-field-named-approver"
                          : field.field_id === "int13_environment_target"
                            ? "actual-field-environment-target"
                            : "actual-field-allow-mutation"
                      }
                    />
                  ))}
                </FieldGroup>

                <div className="submit-row">
                  <button type="button" disabled={actualSubmitDisabled()} data-testid="actual-submit-button">
                    Real submission blocked
                  </button>
                </div>
              </section>

              <section className="panel live-gate-panel" data-testid="live-gate-board">
                <div className="title-row">
                  <div>
                    <h2>Live gate checklist</h2>
                    <p className="muted-copy">
                      Every real-later mutation gate remains visible and non-silent.
                    </p>
                  </div>
                </div>
                <div className="gate-list">
                  {liveGateRows.map((gate) => (
                    <div key={gate.gate_id} className={`gate-chip ${gate.status}`}>
                      <div className="gate-head">
                        <strong>{gate.label}</strong>
                        <span className="mono-chip">{gate.status}</span>
                      </div>
                      <p>{gate.summary}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="panel ladder-panel" data-testid="environment-ladder">
            <div className="title-row">
              <div>
                <h2>Environment ladder</h2>
                <p className="muted-copy">
                  EOI to post-live assurance remains one continuous accountability chain.
                </p>
              </div>
              {reducedMotion && (
                <span className="status-chip" data-testid="reduced-motion-indicator">
                  reduced motion
                </span>
              )}
            </div>
            <div className="environment-ladder">
              {nhsAppPack.ladder_nodes.map((node) => (
                <div key={node.node_id} className="environment-step">
                  <strong>{node.label}</strong>
                  <span>{node.description}</span>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="evidence-drawer panel" data-testid="evidence-drawer">
          <div className="title-row">
            <div>
              <h2>Evidence drawer</h2>
              <p className="muted-copy">
                Current artifact, route, blockers, and risks for the selected stage.
              </p>
            </div>
          </div>

          <section className="drawer-section">
            <h3>{selectedArtifact.artifact_name}</h3>
            <p>{selectedArtifact.notes}</p>
            <ul className="detail-list">
              <li><strong>Family:</strong> {selectedArtifact.artifact_family}</li>
              <li><strong>Mock now:</strong> {selectedArtifact.mock_now_status}</li>
              <li><strong>Actual later:</strong> {selectedArtifact.actual_later_status}</li>
            </ul>
          </section>

          <section className="drawer-section">
            <h3>{currentRoute.route_family}</h3>
            <p>{currentRoute.continuity_expectations}</p>
            <ul className="detail-list">
              <li><strong>Journey group:</strong> <span className="mono-meta">{currentRoute.route_family_id}</span></li>
              <li><strong>Channel profile:</strong> {currentRoute.channel_profiles}</li>
              <li><strong>Allowed mutations:</strong> {currentRoute.allowed_mutations}</li>
              <li><strong>Degraded recovery:</strong> {currentRoute.degraded_recovery_states}</li>
            </ul>
          </section>

          <section className="drawer-section">
            <h3>Blocker notes</h3>
            <ul className="detail-list">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </section>

          <section className="drawer-section">
            <h3>Selected risks</h3>
            <div className="risk-stack">
              {nhsAppPack.selected_risks.map((risk: RiskRow) => (
                <div key={risk.risk_id} className="risk-card">
                  <div className="risk-top">
                    <strong>{risk.risk_title}</strong>
                    <span className="mono-chip">{risk.status}</span>
                  </div>
                  <p>{risk.problem_statement}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Metric(props: { label: string; value: string; tone: "primary" | "embedded" | "success" | "muted" }) {
  return (
    <div className={`metric ${props.tone}`}>
      <label>{props.label}</label>
      <strong>{props.value}</strong>
    </div>
  );
}

function FieldGroup(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="field-group">
      <div className="field-group-header">
        <h3>{props.title}</h3>
      </div>
      <div className="field-grid">{props.children}</div>
    </section>
  );
}

function FieldInput(props: {
  field: Field;
  value: string;
  onChange: (fieldId: string, value: string) => void;
  testIdOverride?: string;
}) {
  const testId = props.testIdOverride ?? `field-${props.field.field_id}`;
  return (
    <label className="field">
      <span>
        {props.field.label}
        {props.field.required ? " *" : ""}
      </span>
      {props.field.kind === "textarea" ? (
        <textarea
          rows={4}
          value={props.value}
          onChange={(event) => props.onChange(props.field.field_id, event.target.value)}
          placeholder={props.field.placeholder}
          data-testid={testId}
        />
      ) : props.field.kind === "select" ? (
        <select
          value={props.value}
          onChange={(event) => props.onChange(props.field.field_id, event.target.value)}
          data-testid={testId}
        >
          <option value="">Select</option>
          {props.field.options.map((option) => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={props.value}
          onChange={(event) => props.onChange(props.field.field_id, event.target.value)}
          placeholder={props.field.placeholder}
          data-testid={testId}
        />
      )}
      <small>{props.field.notes}</small>
    </label>
  );
}

function InfoCard(props: { title: string; items: readonly string[] }) {
  return (
    <section className="info-card">
      <h3>{props.title}</h3>
      <ul className="detail-list">
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function PreviewFact(props: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="preview-fact">
      <label>{props.label}</label>
      <strong className={props.mono ? "mono-meta" : ""}>{props.value}</strong>
    </div>
  );
}
