import { useEffect, useMemo, useState } from "react";
import { VecellLogoLockup } from "@vecells/design-system";
import { nhsLoginPack } from "./generated/nhsLoginPack";

type Mode = "mock" | "actual";

type Stage = (typeof nhsLoginPack.stages)[number];
type Field = (typeof nhsLoginPack.fields)[number];
type Artifact = (typeof nhsLoginPack.artifacts)[number];
type Checkpoint = (typeof nhsLoginPack.manual_checkpoints)[number];

type DraftState = {
  mode: Mode;
  stageId: string;
  selectedArtifactId: string;
  values: Record<string, string>;
  artifacts: Record<string, boolean>;
  checkpoints: Record<string, boolean>;
  lastSavedAt: string | null;
};

const STORAGE_KEY = "vecells-nhs-login-onboarding-react";

function initialMode(): Mode {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "actual" ? "actual" : "mock";
}

function stageById(stageId: string): Stage {
  return nhsLoginPack.stages.find((stage) => stage.stage_id === stageId)!;
}

function fieldById(fieldId: string): Field {
  return nhsLoginPack.fields.find((field) => field.field_id === fieldId)!;
}

function artifactById(artifactId: string): Artifact {
  return nhsLoginPack.artifacts.find((artifact) => artifact.artifact_id === artifactId)!;
}

function checkpointById(checkpointId: string): Checkpoint {
  return nhsLoginPack.manual_checkpoints.find((checkpoint) => checkpoint.checkpoint_id === checkpointId)!;
}

function humanizeToken(value: string): string {
  return value.split("_").join(" ");
}

function blockersForStage(stage: Stage, draft: DraftState): string[] {
  const blockers: string[] = [];

  for (const fieldId of stage.required_field_ids) {
    const value = (draft.values[fieldId] ?? "").trim();
    if (!value) {
      blockers.push(`Missing field: ${fieldById(fieldId).label}`);
    }
  }
  for (const artifactId of stage.required_artifact_ids) {
    if (!draft.artifacts[artifactId]) {
      blockers.push(`Missing evidence: ${artifactById(artifactId).name}`);
    }
  }
  for (const checkpointId of stage.required_checkpoint_ids) {
    if (!draft.checkpoints[checkpointId]) {
      blockers.push(`Manual review unresolved: ${checkpointById(checkpointId).label}`);
    }
  }
  for (const blocker of stage.hard_blockers) {
    blockers.push(humanizeToken(blocker));
  }
  if (draft.mode === "actual" && stage.stage_id === "ready_for_real_submission") {
    for (const gate of nhsLoginPack.live_gates) {
      if (gate.status !== "pass") {
        blockers.push(`${gate.label}: ${gate.summary}`);
      }
    }
  }
  return blockers;
}

function freshnessText(draft: DraftState): string {
  const attached = Object.values(draft.artifacts).filter(Boolean).length;
  return `${attached}/${nhsLoginPack.artifacts.length} attached`;
}

function toLocalTime(timestamp: string | null): string {
  return timestamp ? new Date(timestamp).toLocaleTimeString() : "not yet";
}

function loadInitialDraft(): DraftState {
  const base: DraftState = {
    mode: initialMode(),
    stageId: nhsLoginPack.stage_order[0],
    selectedArtifactId: nhsLoginPack.artifacts[0].artifact_id,
    values: { ...nhsLoginPack.draft_values },
    artifacts: { ...nhsLoginPack.artifact_defaults },
    checkpoints: { ...nhsLoginPack.checkpoint_defaults },
    lastSavedAt: null,
  };

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return base;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<DraftState>;
    return {
      ...base,
      ...parsed,
      mode: initialMode(),
      values: { ...base.values, ...(parsed.values ?? {}) },
      artifacts: { ...base.artifacts, ...(parsed.artifacts ?? {}) },
      checkpoints: { ...base.checkpoints, ...(parsed.checkpoints ?? {}) },
      stageId: parsed.stageId ?? base.stageId,
      selectedArtifactId: parsed.selectedArtifactId ?? base.selectedArtifactId,
    };
  } catch {
    return base;
  }
}

export default function App() {
  const [draft, setDraft] = useState<DraftState>(() => loadInitialDraft());
  const currentStage = stageById(draft.stageId);
  const blockers = useMemo(() => blockersForStage(currentStage, draft), [currentStage, draft]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = { ...draft, lastSavedAt: new Date().toISOString() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setDraft((previous) => {
        if (previous.lastSavedAt === next.lastSavedAt) {
          return previous;
        }
        return next;
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [
    draft.mode,
    draft.stageId,
    draft.selectedArtifactId,
    draft.values,
    draft.artifacts,
    draft.checkpoints,
  ]);

  const relevantFields = useMemo(
    () => currentStage.required_field_ids.map((fieldId) => fieldById(fieldId)),
    [currentStage],
  );

  const relevantArtifacts = useMemo(
    () =>
      nhsLoginPack.artifacts.filter(
        (artifact) =>
          artifact.stage_id === currentStage.stage_id ||
          (currentStage.required_artifact_ids as readonly string[]).includes(artifact.artifact_id),
      ),
    [currentStage],
  );

  const relevantCheckpoints = useMemo(
    () => currentStage.required_checkpoint_ids.map((checkpointId) => checkpointById(checkpointId)),
    [currentStage],
  );

  const selectedArtifact = artifactById(draft.selectedArtifactId);
  const stageIndex = (nhsLoginPack.stage_order as readonly string[]).indexOf(draft.stageId);

  function updateField(fieldId: string, value: string) {
    setDraft((previous) => ({
      ...previous,
      values: { ...previous.values, [fieldId]: value },
    }));
  }

  function toggleArtifact(artifactId: string) {
    setDraft((previous) => ({
      ...previous,
      selectedArtifactId: artifactId,
      artifacts: {
        ...previous.artifacts,
        [artifactId]: !previous.artifacts[artifactId],
      },
    }));
  }

  function toggleCheckpoint(checkpointId: string) {
    setDraft((previous) => ({
      ...previous,
      checkpoints: {
        ...previous.checkpoints,
        [checkpointId]: !previous.checkpoints[checkpointId],
      },
    }));
  }

  function moveStage(delta: number) {
    const nextIndex = Math.max(0, Math.min(nhsLoginPack.stage_order.length - 1, stageIndex + delta));
    setDraft((previous) => ({
      ...previous,
      stageId: nhsLoginPack.stage_order[nextIndex],
    }));
  }

  return (
    <main className="app-shell" data-testid="atelier-shell">
      <header className="topbar">
        <section className="readiness-banner" data-testid="readiness-banner">
          <Metric label="Current stage" value={currentStage.label} />
          <Metric label="Blocker count" value={String(blockers.length)} />
          <Metric label="Evidence freshness" value={freshnessText(draft)} />
          <Metric label="Autosave" value={toLocalTime(draft.lastSavedAt)} />
        </section>

        <section className="mode-card">
          <div>
            <div className="mock-ribbon">Mock_Onboarding</div>
            <p className="muted-copy">
              Internal rehearsal surface. Real provider progression remains fail-closed until sponsor,
              assurance, approver, and environment gates are true.
            </p>
          </div>
          <div className="mode-toggle" data-testid="mode-toggle">
            <button
              data-testid="mode-toggle-mock"
              aria-pressed={draft.mode === "mock"}
              className={draft.mode === "mock" ? "active" : ""}
              onClick={() => setDraft((previous) => ({ ...previous, mode: "mock" }))}
              type="button"
            >
              Mock now
            </button>
            <button
              data-testid="mode-toggle-actual"
              aria-pressed={draft.mode === "actual"}
              className={draft.mode === "actual" ? "active" : ""}
              onClick={() => setDraft((previous) => ({ ...previous, mode: "actual" }))}
              type="button"
            >
              Actual later
            </button>
          </div>
        </section>
      </header>

      <div className="layout">
        <aside className="stage-rail" data-testid="stage-rail">
          {nhsLoginPack.stages.map((stage) => {
            const stageBlockers = blockersForStage(stage, draft);
            return (
              <button
                key={stage.stage_id}
                className={[
                  "stage-card",
                  draft.stageId === stage.stage_id ? "active" : "",
                  stageBlockers.length ? "blocked" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-testid={`stage-card-${stage.stage_id}`}
                id={`stage-card-${stage.stage_id}`}
                onClick={() => setDraft((previous) => ({ ...previous, stageId: stage.stage_id }))}
                type="button"
              >
                <span className="mono-chip">{stage.stage_id}</span>
                <strong>{stage.label}</strong>
                <p>{stage.summary}</p>
                <span className="status-chip">{stageBlockers.length ? `${stageBlockers.length} blockers` : "clear"}</span>
              </button>
            );
          })}
        </aside>

        <section className="workspace">
          <section className="panel" data-testid="form-sections">
            <div className="title-row">
              <div>
                <div className="wordmark-row">
                  <VecellLogoLockup aria-hidden="true" className="wordmark-lockup" />
                  <div>
                    <div className="mono-meta">Partner_Access_Atelier</div>
                    <h1>{currentStage.label}</h1>
                  </div>
                </div>
                <p className="muted-copy">{currentStage.summary}</p>
              </div>
              <span className="status-chip" data-testid="autosave-banner">
                Autosave armed
              </span>
            </div>

            <div className="field-grid">
              {relevantFields.map((field) => {
                const textField = field.field_type === "text";
                return (
                  <article className="field-card" key={field.field_id} data-testid={`field-section-${field.field_id}`}>
                    <label htmlFor={field.field_id}>{field.label}</label>
                    {textField ? (
                      <input
                        data-testid={`field-${field.field_id}`}
                        id={field.field_id}
                        type="text"
                        value={draft.values[field.field_id] ?? ""}
                        placeholder={draft.mode === "mock" ? field.mock_value : field.actual_placeholder}
                        onChange={(event) => updateField(field.field_id, event.target.value)}
                      />
                    ) : (
                      <textarea
                        data-testid={`field-${field.field_id}`}
                        id={field.field_id}
                        value={draft.values[field.field_id] ?? ""}
                        placeholder={draft.mode === "mock" ? field.mock_value : field.actual_placeholder}
                        onChange={(event) => updateField(field.field_id, event.target.value)}
                      />
                    )}
                    <p className="help-copy">
                      {draft.mode === "mock" ? "Synthetic rehearsal value" : field.actual_placeholder}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel" data-testid="artifact-panel">
            <div className="title-row">
              <h2>Evidence checklist</h2>
              <span className="status-chip">Synthetic attachments only</span>
            </div>
            <div className="artifact-list">
              {relevantArtifacts.map((artifact) => (
                <div className="artifact-card" data-testid={`artifact-chip-${artifact.artifact_id}`} key={artifact.artifact_id}>
                  <div className="artifact-copy">
                    <strong>{artifact.name}</strong>
                    <p>{humanizeToken(artifact.actual_status)}</p>
                    <span className="mono-meta">Owner: {artifact.owner_role}</span>
                  </div>
                  <button
                    className={draft.artifacts[artifact.artifact_id] ? "attached" : ""}
                    data-testid={`artifact-toggle-${artifact.artifact_id}`}
                    id={`artifact-toggle-${artifact.artifact_id}`}
                    type="button"
                    onClick={() => toggleArtifact(artifact.artifact_id)}
                  >
                    {draft.artifacts[artifact.artifact_id] ? "Attached" : "Attach synthetic evidence"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel" data-testid="checkpoint-panel">
            <div className="title-row">
              <h2>Manual checkpoints</h2>
              <span className="status-chip">Explicit review only</span>
            </div>
            <div className="checkpoint-list">
              {relevantCheckpoints.length ? (
                relevantCheckpoints.map((checkpoint) => (
                  <article className="checkpoint-card" key={checkpoint.checkpoint_id}>
                    <div>
                      <strong>{checkpoint.label}</strong>
                      <p>{humanizeToken(checkpoint.automation_posture)}</p>
                      <p className="muted-copy">{checkpoint.rejection_reasons[0]}</p>
                    </div>
                    <button
                      type="button"
                      data-testid={`checkpoint-toggle-${checkpoint.checkpoint_id}`}
                      className={draft.checkpoints[checkpoint.checkpoint_id] ? "attached" : ""}
                      onClick={() => toggleCheckpoint(checkpoint.checkpoint_id)}
                    >
                      {draft.checkpoints[checkpoint.checkpoint_id] ? "Reviewed" : "Mark reviewed"}
                    </button>
                  </article>
                ))
              ) : (
                <p className="muted-copy">No manual checkpoint is required on the selected stage.</p>
              )}
            </div>
          </section>

          <section className="panel process-panel">
            <div className="title-row">
              <h2>Onboarding funnel</h2>
              <span className="status-chip mono" data-testid="process-diagram">
                application → demo → sandpit → integration → assurance → agreement → service desk
              </span>
            </div>
            <div className="process-grid">
              {([
                ["application_draft", "product_fit_review"],
                ["demo_prep", "sandpit_request_ready"],
                ["sandpit_requested", "product_demo_pending"],
                ["integration_request_blocked_until_demo", "integration_request_ready"],
                ["assurance_bundle_in_progress", "connection_agreement_pending"],
                ["service_desk_registration_pending", "ready_for_real_submission"],
              ] as Array<[string, string]>).map(([fromId, toId]) => {
                const from = stageById(fromId);
                const to = stageById(toId);
                return (
                  <div className="process-node" key={`${fromId}-${toId}`}>
                    <strong>{from.label}</strong>
                    <span>{to.label}</span>
                    <span className="mono-meta">{from.stage_id}</span>
                  </div>
                );
              })}
            </div>
            <table data-testid="process-parity-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Dependencies</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {nhsLoginPack.stages.map((stage) => (
                  <tr key={stage.stage_id}>
                    <td>
                      <span className="mono-meta">{stage.stage_id}</span>
                      <br />
                      {stage.label}
                    </td>
                    <td>{stage.required_field_ids.length + stage.required_artifact_ids.length} structured dependencies</td>
                    <td>{stage.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </section>

        <aside className="inspector">
          <section className="panel" data-testid="evidence-drawer">
            <div className="title-row">
              <h2>Evidence drawer</h2>
              <span className="status-chip mono">{selectedArtifact.artifact_id}</span>
            </div>
            <p>{selectedArtifact.name}</p>
            <p className="muted-copy">{humanizeToken(selectedArtifact.actual_status)}</p>
            <p className="mono-meta">Owner: {selectedArtifact.owner_role}</p>
            <p className="mono-meta">Freshness target: {selectedArtifact.freshness_days} days</p>
            <p className="muted-copy">Source refs: {selectedArtifact.source_refs.join(" | ")}</p>
            <p className="muted-copy">
              Attachment state: {draft.artifacts[selectedArtifact.artifact_id] ? "synthetic evidence attached" : "missing, stage remains blocked"}
            </p>
          </section>

          <section className="panel" data-testid="actual-submission-notice">
            <div className="title-row">
              <h2>Actual submission gates</h2>
              <span className="status-chip">{draft.mode === "actual" ? "active" : "preview"}</span>
            </div>
            <div className="gate-list">
              {nhsLoginPack.live_gates.map((gate) => (
                <div className={gate.status === "pass" ? "gate-chip pass" : "gate-chip blocked"} key={gate.gate_id}>
                  <strong>{gate.label}</strong>
                  <p>{gate.status}</p>
                  <p>{gate.summary}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="title-row">
              <h2>Stage blockers</h2>
              <span className="status-chip">{blockers.length ? "blocked" : "clear"}</span>
            </div>
            <div className="chip-list">
              {blockers.length ? (
                blockers.map((blocker, index) => (
                  <span className="blocker-chip" data-testid={`blocker-chip-${index}`} key={blocker}>
                    {blocker}
                  </span>
                ))
              ) : (
                <span className="status-chip">No blockers on selected stage</span>
              )}
            </div>
            <div className="nav-actions">
              <button data-testid="previous-stage-button" type="button" onClick={() => moveStage(-1)}>
                Previous
              </button>
              <button className="primary" data-testid="next-stage-button" type="button" onClick={() => moveStage(1)}>
                Next
              </button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <label>{label}</label>
      <strong>{value}</strong>
    </div>
  );
}
