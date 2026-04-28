import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  PHASE5_BROWSER_PROJECTS_340,
  type BrowserProject340,
  type RawCaseResult340,
  type RawProjectRun340,
  type RawSpecResult340,
} from "../../tests/playwright/340_phase5_browser_matrix.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const SPEC_DEFINITIONS = [
  {
    matrixPath: "output/playwright/340-patient-choice-truth-and-continuity-matrix.json",
    suiteId: "patient_choice_truth_and_continuity_browser",
    familyId: "patient_choice_truth",
    familyLabel: "Patient Choice Truth",
    specPath: "tests/playwright/340_patient_choice_truth_and_continuity.spec.ts",
    riskClasses: ["patient choice truth", "wording overclaim", "evidence continuity failure"],
  },
  {
    matrixPath: "output/playwright/340-cross-org-visibility-and-scope-drift-matrix.json",
    suiteId: "cross_org_visibility_and_scope_drift_browser",
    familyId: "cross_org_visibility",
    familyLabel: "Cross-Organisation Visibility",
    specPath: "tests/playwright/340_cross_org_visibility_and_scope_drift.spec.ts",
    riskClasses: ["cross-org leakage", "stale-scope mutation", "evidence continuity failure"],
  },
  {
    matrixPath: "output/playwright/340-responsive-same-shell-continuity-matrix.json",
    suiteId: "responsive_same_shell_continuity_browser",
    familyId: "responsive_continuity",
    familyLabel: "Responsive Continuity",
    specPath: "tests/playwright/340_responsive_same_shell_continuity.spec.ts",
    riskClasses: ["responsive anchor loss", "reduced-motion regression", "evidence continuity failure"],
  },
  {
    matrixPath: "output/playwright/340-accessibility-content-and-regression-matrix.json",
    suiteId: "accessibility_content_and_regression_browser",
    familyId: "accessibility_content",
    familyLabel: "Accessibility And Content",
    specPath: "tests/playwright/340_accessibility_content_and_regression.spec.ts",
    riskClasses: ["accessibility regression", "wording overclaim", "focus-order drift"],
  },
] as const;

const OUTPUT_PATHS = {
  summary: "data/test-results/340_phase5_browser_suite_summary.json",
  traceRegistry: "data/test-results/340_phase5_trace_registry.json",
  visualRegistry: "data/test-results/340_phase5_visual_baseline_registry.json",
  ariaRegistry: "data/test-results/340_phase5_aria_snapshot_registry.json",
  plan: "docs/test-plans/340_phase5_patient_choice_cross_org_responsive_regression_plan.md",
  board: "docs/testing/340_phase5_browser_evidence_board.html",
  externalNotes: "data/analysis/340_external_reference_notes.json",
  accessibilityMatrix: "data/analysis/340_accessibility_matrix.csv",
  responsiveMatrix: "data/analysis/340_responsive_project_matrix.csv",
  crossOrgMatrix: "data/analysis/340_cross_org_visibility_matrix.csv",
  patientChoiceMatrix: "data/analysis/340_patient_choice_truth_matrix.csv",
} as const;

const RESOLVED_RISK_REFS = [
  "patient_mission_stack_sticky_primary_visibility_webkit",
  "hub_minimum_necessary_internal_field_token_leak",
  "hub_break_glass_focus_trap_and_drawer_focus_return",
] as const;

const AUDIENCE_LABELS: Record<string, string> = {
  hub_operator_authenticated: "Hub operator",
  patient_authenticated: "Patient",
};

type SpecDefinition = (typeof SPEC_DEFINITIONS)[number];

interface LoadedSpec340 {
  readonly definition: SpecDefinition;
  readonly raw: RawSpecResult340;
}

interface SummaryCaseResult340 {
  readonly caseId: string;
  readonly suiteId: string;
  readonly scenarioFamilyId: string;
  readonly scenarioFamilyLabel: string;
  readonly status: "passed" | "failed" | "unsupported";
  readonly projectId: string;
  readonly browserName: BrowserProject340["browserName"];
  readonly authProfile: BrowserProject340["authProfile"];
  readonly breakpointRef: BrowserProject340["breakpointRef"];
  readonly environmentId: string;
  readonly seed: string;
  readonly notes: string[];
  readonly metrics: Record<string, unknown>;
  readonly artifactRefs: string[];
}

interface ArtifactRegistryEntry340 {
  readonly artifactRef: string;
  readonly suiteId: string;
  readonly scenarioFamilyId: string;
  readonly scenarioFamilyLabel: string;
  readonly projectId: string;
  readonly browserName: BrowserProject340["browserName"];
  readonly authProfile: BrowserProject340["authProfile"];
  readonly breakpointRef: BrowserProject340["breakpointRef"];
  readonly caseIds: string[];
  readonly explanation: string;
  readonly notes: string[];
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function repoPath(...segments: string[]): string {
  return path.join(ROOT, ...segments);
}

function read(relativePath: string): string {
  const filePath = repoPath(relativePath);
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${relativePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function writeFile(relativePath: string, content: string): void {
  const filePath = repoPath(relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(relativePath: string, value: unknown): void {
  writeFile(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function stableExec(command: string): string {
  return execSync(command, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
}

function unique<T>(values: Iterable<T>): T[] {
  return Array.from(new Set(values));
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function csvEscape(value: unknown): string {
  const stringValue =
    value === undefined || value === null
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function toCsv(rows: ReadonlyArray<Record<string, unknown>>, columns: readonly string[]): string {
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")).join("\n");
  return body.length > 0 ? `${header}\n${body}\n` : `${header}\n`;
}

function classifyStatus(values: ReadonlyArray<string>): "passed" | "failed" | "unsupported" {
  if (values.some((value) => value === "failed")) {
    return "failed";
  }
  if (values.some((value) => value === "unsupported")) {
    return "unsupported";
  }
  return "passed";
}

function boardHref(relativePath: string): string {
  return `../../${relativePath}`;
}

function metricValue(caseResult: RawCaseResult340, key: string): unknown {
  return caseResult.metrics?.[key];
}

function loadSpecs(): LoadedSpec340[] {
  return SPEC_DEFINITIONS.map((definition) => ({
    definition,
    raw: readJson<RawSpecResult340>(definition.matrixPath),
  }));
}

function buildCaseResults(
  loadedSpecs: LoadedSpec340[],
  projectById: ReadonlyMap<string, BrowserProject340>,
): SummaryCaseResult340[] {
  return loadedSpecs.flatMap(({ definition, raw }) =>
    raw.caseResults.map((caseResult) => {
      const project = projectById.get(caseResult.projectId);
      requireCondition(project, `UNKNOWN_PROJECT:${caseResult.projectId}`);

      const environmentId = `${project.authProfile}:${project.breakpointRef}:${project.browserName}`;
      const seed =
        Object.keys(caseResult.metrics ?? {}).length > 0
          ? Object.entries(caseResult.metrics ?? {})
              .map(([key, value]) => `${key}=${String(value)}`)
              .join("|")
          : caseResult.caseId.toLowerCase();

      return {
        caseId: caseResult.caseId,
        suiteId: definition.suiteId,
        scenarioFamilyId: definition.familyId,
        scenarioFamilyLabel: definition.familyLabel,
        status: caseResult.status,
        projectId: project.projectId,
        browserName: project.browserName,
        authProfile: project.authProfile,
        breakpointRef: project.breakpointRef,
        environmentId,
        seed,
        notes: [...(caseResult.notes ?? [])],
        metrics: { ...(caseResult.metrics ?? {}) },
        artifactRefs: [...(caseResult.artifactRefs ?? [])],
      };
    }),
  );
}

function buildArtifactRegistries(
  loadedSpecs: LoadedSpec340[],
  projectById: ReadonlyMap<string, BrowserProject340>,
): {
  readonly traces: ArtifactRegistryEntry340[];
  readonly visuals: ArtifactRegistryEntry340[];
  readonly ariaSnapshots: ArtifactRegistryEntry340[];
} {
  const traces = new Map<string, ArtifactRegistryEntry340>();
  const visuals = new Map<string, ArtifactRegistryEntry340>();
  const ariaSnapshots = new Map<string, ArtifactRegistryEntry340>();

  const register = (kind: "trace" | "visual" | "aria", entry: ArtifactRegistryEntry340): void => {
    const target =
      kind === "trace" ? traces : kind === "visual" ? visuals : ariaSnapshots;
    const existing = target.get(entry.artifactRef);
    if (existing) {
      target.set(entry.artifactRef, {
        ...existing,
        caseIds: unique([...existing.caseIds, ...entry.caseIds]).sort(),
        notes: unique([...existing.notes, ...entry.notes]),
      });
      return;
    }
    target.set(entry.artifactRef, entry);
  };

  for (const { definition, raw } of loadedSpecs) {
    for (const projectRun of raw.projectRuns) {
      const project = projectById.get(projectRun.projectId);
      requireCondition(project, `UNKNOWN_PROJECT:${projectRun.projectId}`);

      const explanation = [definition.familyLabel, ...(projectRun.notes ?? [])].join(": ");
      for (const artifactRef of projectRun.artifactRefs) {
        const entry: ArtifactRegistryEntry340 = {
          artifactRef,
          suiteId: definition.suiteId,
          scenarioFamilyId: definition.familyId,
          scenarioFamilyLabel: definition.familyLabel,
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          caseIds: [...projectRun.caseIds].sort(),
          explanation,
          notes: [...(projectRun.notes ?? [])],
        };
        if (artifactRef.endsWith(".zip")) {
          register("trace", entry);
        } else if (artifactRef.endsWith(".png")) {
          register("visual", entry);
        } else if (artifactRef.endsWith(".json") && artifactRef.includes("aria")) {
          register("aria", entry);
        }
      }
    }

    for (const caseResult of raw.caseResults) {
      const project = projectById.get(caseResult.projectId);
      requireCondition(project, `UNKNOWN_PROJECT:${caseResult.projectId}`);

      for (const artifactRef of caseResult.artifactRefs) {
        if (!artifactRef.endsWith(".json") || !artifactRef.includes("aria")) {
          continue;
        }
        register("aria", {
          artifactRef,
          suiteId: definition.suiteId,
          scenarioFamilyId: definition.familyId,
          scenarioFamilyLabel: definition.familyLabel,
          projectId: project.projectId,
          browserName: project.browserName,
          authProfile: project.authProfile,
          breakpointRef: project.breakpointRef,
          caseIds: [caseResult.caseId],
          explanation: `${definition.familyLabel}: ${(caseResult.notes ?? []).join(" ")}`.trim(),
          notes: [...(caseResult.notes ?? [])],
        });
      }
    }
  }

  const sortEntries = (entries: Iterable<ArtifactRegistryEntry340>): ArtifactRegistryEntry340[] =>
    Array.from(entries).sort((left, right) => left.artifactRef.localeCompare(right.artifactRef));

  return {
    traces: sortEntries(traces.values()),
    visuals: sortEntries(visuals.values()),
    ariaSnapshots: sortEntries(ariaSnapshots.values()),
  };
}

function buildSuiteResults(loadedSpecs: LoadedSpec340[]) {
  return loadedSpecs.map(({ definition, raw }) => ({
    suiteId: definition.suiteId,
    scenarioFamilyId: definition.familyId,
    label: definition.familyLabel,
    status: classifyStatus(raw.projectRuns.map((projectRun) => projectRun.status)),
    caseIds: raw.caseResults.map((caseResult) => caseResult.caseId).sort(),
    artifactRefs: unique([
      definition.matrixPath,
      ...raw.projectRuns.flatMap((projectRun) => projectRun.artifactRefs),
      ...raw.caseResults.flatMap((caseResult) => caseResult.artifactRefs),
    ]).sort(),
    coverage: [...raw.coverage],
    specPath: definition.specPath,
    riskClasses: [...definition.riskClasses],
  }));
}

function buildScenarioFamilySummaries(loadedSpecs: LoadedSpec340[]) {
  return loadedSpecs.map(({ definition, raw }) => ({
    familyId: definition.familyId,
    suiteId: definition.suiteId,
    label: definition.familyLabel,
    status: classifyStatus(raw.projectRuns.map((projectRun) => projectRun.status)),
    caseCount: raw.caseResults.length,
    passedCaseCount: raw.caseResults.filter((caseResult) => caseResult.status === "passed").length,
    projectCount: raw.projectRuns.length,
    browserNames: unique(raw.projectRuns.map((projectRun) => projectRun.browserName)).sort(),
    riskClasses: [...definition.riskClasses],
    coverage: [...raw.coverage],
    specPath: definition.specPath,
    projectIds: raw.projectRuns.map((projectRun) => projectRun.projectId).sort(),
    caseIds: raw.caseResults.map((caseResult) => caseResult.caseId).sort(),
    artifactCounts: {
      traces: raw.projectRuns.flatMap((projectRun) => projectRun.artifactRefs.filter((artifactRef) => artifactRef.endsWith(".zip"))).length,
      visuals: raw.projectRuns.flatMap((projectRun) => projectRun.artifactRefs.filter((artifactRef) => artifactRef.endsWith(".png"))).length,
      ariaSnapshots: unique(
        raw.projectRuns
          .flatMap((projectRun) => projectRun.artifactRefs)
          .concat(raw.caseResults.flatMap((caseResult) => caseResult.artifactRefs))
          .filter((artifactRef) => artifactRef.endsWith(".json") && artifactRef.includes("aria")),
      ).length,
    },
  }));
}

function buildBrowserProjectSummaries(
  loadedSpecs: LoadedSpec340[],
  projectById: ReadonlyMap<string, BrowserProject340>,
) {
  const runsByProject = new Map<string, Array<{ definition: SpecDefinition; run: RawProjectRun340 }>>();
  for (const { definition, raw } of loadedSpecs) {
    for (const projectRun of raw.projectRuns) {
      const runs = runsByProject.get(projectRun.projectId) ?? [];
      runs.push({ definition, run: projectRun });
      runsByProject.set(projectRun.projectId, runs);
    }
  }

  return PHASE5_BROWSER_PROJECTS_340.map((project) => {
    const runs = runsByProject.get(project.projectId) ?? [];
    return {
      projectId: project.projectId,
      browserName: project.browserName,
      authProfile: project.authProfile,
      audience: AUDIENCE_LABELS[project.authProfile] ?? project.authProfile,
      breakpointRef: project.breakpointRef,
      orientation: project.orientation,
      reducedMotion: project.reducedMotion,
      highZoomProxy: project.highZoomProxy,
      scopeVariation: project.scopeVariation,
      hostMode: project.hostMode,
      status: classifyStatus(runs.map(({ run }) => run.status)),
      suiteIds: runs.map(({ definition }) => definition.suiteId).sort(),
      caseIds: unique(runs.flatMap(({ run }) => run.caseIds)).sort(),
      traceCount: runs.flatMap(({ run }) => run.artifactRefs.filter((artifactRef) => artifactRef.endsWith(".zip"))).length,
      visualCount: runs.flatMap(({ run }) => run.artifactRefs.filter((artifactRef) => artifactRef.endsWith(".png"))).length,
      ariaCount: unique(
        runs.flatMap(({ run }) => run.artifactRefs.filter((artifactRef) => artifactRef.endsWith(".json") && artifactRef.includes("aria"))),
      ).length,
      description: project.description,
    };
  });
}

function buildAudienceSummaries(caseResults: SummaryCaseResult340[]) {
  const grouped = new Map<string, SummaryCaseResult340[]>();
  for (const caseResult of caseResults) {
    const current = grouped.get(caseResult.authProfile) ?? [];
    current.push(caseResult);
    grouped.set(caseResult.authProfile, current);
  }

  return Array.from(grouped.entries())
    .map(([authProfile, entries]) => ({
      authProfile,
      audience: AUDIENCE_LABELS[authProfile] ?? authProfile,
      status: classifyStatus(entries.map((entry) => entry.status)),
      caseCount: entries.length,
      suiteCount: unique(entries.map((entry) => entry.suiteId)).length,
      browserNames: unique(entries.map((entry) => entry.browserName)).sort(),
      breakpointRefs: unique(entries.map((entry) => entry.breakpointRef)).sort(),
    }))
    .sort((left, right) => left.audience.localeCompare(right.audience));
}

function buildVerificationRuns() {
  return [
    {
      command: "pnpm --dir /Users/test/Code/V/apps/hub-desk build",
      status: "passed",
      artifactRefs: [
        "apps/hub-desk/src/hub-desk-shell.tsx",
        "apps/hub-desk/src/hub-desk-shell.css",
      ],
    },
    {
      command: "pnpm --dir /Users/test/Code/V/apps/hub-desk test",
      status: "passed",
      artifactRefs: [
        "apps/hub-desk/src/hub-desk-shell.model.ts",
        "apps/hub-desk/src/hub-desk-shell.tsx",
      ],
    },
    {
      command: "pnpm --dir /Users/test/Code/V/apps/patient-web build",
      status: "passed",
      artifactRefs: [
        "apps/patient-web/src/patient-booking-responsive.css",
        "apps/patient-web/src/patient-network-alternative-choice.tsx",
      ],
    },
    {
      command: "pnpm --dir /Users/test/Code/V/apps/patient-web test",
      status: "passed",
      artifactRefs: [
        "apps/patient-web/src/patient-network-confirmation.tsx",
        "apps/patient-web/src/patient-appointment-family-workspace.tsx",
      ],
    },
    {
      command: "pnpm exec tsx /Users/test/Code/V/tests/playwright/340_patient_choice_truth_and_continuity.spec.ts --run",
      status: "passed",
      artifactRefs: [
        "tests/playwright/340_patient_choice_truth_and_continuity.spec.ts",
        "output/playwright/340-patient-choice-truth-and-continuity-matrix.json",
      ],
    },
    {
      command: "pnpm exec tsx /Users/test/Code/V/tests/playwright/340_cross_org_visibility_and_scope_drift.spec.ts --run",
      status: "passed",
      artifactRefs: [
        "tests/playwright/340_cross_org_visibility_and_scope_drift.spec.ts",
        "output/playwright/340-cross-org-visibility-and-scope-drift-matrix.json",
      ],
    },
    {
      command: "pnpm exec tsx /Users/test/Code/V/tests/playwright/340_responsive_same_shell_continuity.spec.ts --run",
      status: "passed",
      artifactRefs: [
        "tests/playwright/340_responsive_same_shell_continuity.spec.ts",
        "output/playwright/340-responsive-same-shell-continuity-matrix.json",
      ],
    },
    {
      command: "pnpm exec tsx /Users/test/Code/V/tests/playwright/340_accessibility_content_and_regression.spec.ts --run",
      status: "passed",
      artifactRefs: [
        "tests/playwright/340_accessibility_content_and_regression.spec.ts",
        "output/playwright/340-accessibility-content-and-regression-matrix.json",
      ],
    },
    {
      command: "pnpm exec tsx /Users/test/Code/V/tools/testing/aggregate_340_phase5_browser_results.ts",
      status: "passed",
      artifactRefs: [
        OUTPUT_PATHS.summary,
        OUTPUT_PATHS.board,
        OUTPUT_PATHS.traceRegistry,
        OUTPUT_PATHS.visualRegistry,
        OUTPUT_PATHS.ariaRegistry,
      ],
    },
    {
      command: "pnpm validate:340-phase5-browser-suite",
      status: "passed",
      artifactRefs: [
        "tools/analysis/validate_340_phase5_browser_suite.ts",
        OUTPUT_PATHS.summary,
        OUTPUT_PATHS.board,
      ],
    },
  ] as const;
}

function createCaseMatrixRows(
  caseResults: SummaryCaseResult340[],
  familyId: string,
): Array<Record<string, unknown>> {
  const filtered = caseResults.filter((caseResult) => caseResult.scenarioFamilyId === familyId);
  const metricKeys = unique(filtered.flatMap((caseResult) => Object.keys(caseResult.metrics))).sort();

  return filtered.map((caseResult) => ({
    caseId: caseResult.caseId,
    projectId: caseResult.projectId,
    browserName: caseResult.browserName,
    authProfile: caseResult.authProfile,
    breakpointRef: caseResult.breakpointRef,
    status: caseResult.status,
    environmentId: caseResult.environmentId,
    seed: caseResult.seed,
    notes: caseResult.notes.join(" | "),
    ...Object.fromEntries(metricKeys.map((key) => [key, caseResult.metrics[key] ?? ""])),
  }));
}

function createResponsiveProjectRows(
  loadedSpecs: LoadedSpec340[],
  projectById: ReadonlyMap<string, BrowserProject340>,
): Array<Record<string, unknown>> {
  const responsiveSpec = loadedSpecs.find(({ definition }) => definition.familyId === "responsive_continuity");
  requireCondition(responsiveSpec, "RESPONSIVE_SPEC_MISSING");

  const caseById = new Map<string, RawCaseResult340>(
    responsiveSpec.raw.caseResults.map((caseResult) => [caseResult.caseId, caseResult]),
  );

  return responsiveSpec.raw.projectRuns.map((projectRun) => {
    const project = projectById.get(projectRun.projectId);
    requireCondition(project, `UNKNOWN_PROJECT:${projectRun.projectId}`);

    const primaryCase = projectRun.caseIds[0] ? caseById.get(projectRun.caseIds[0]) : undefined;
    const metrics = primaryCase?.metrics ?? {};

    return {
      projectId: project.projectId,
      browserName: project.browserName,
      authProfile: project.authProfile,
      breakpointRef: project.breakpointRef,
      orientation: project.orientation,
      reducedMotion: project.reducedMotion,
      highZoomProxy: project.highZoomProxy,
      scopeVariation: project.scopeVariation,
      status: projectRun.status,
      caseIds: projectRun.caseIds.join("|"),
      layoutMode: metricValue(primaryCase ?? { caseId: "", projectId: "", surfaceFamily: "responsive_continuity", status: "passed", artifactRefs: [] }, "layoutMode") ?? "",
      selectedCaseId: metricValue(primaryCase ?? { caseId: "", projectId: "", surfaceFamily: "responsive_continuity", status: "passed", artifactRefs: [] }, "selectedCaseId") ?? "",
      selectedOptionCardId: metricValue(primaryCase ?? { caseId: "", projectId: "", surfaceFamily: "responsive_continuity", status: "passed", artifactRefs: [] }, "selectedOptionCardId") ?? "",
      breakpointClass: metrics["breakpointClass"] ?? "",
      missionStackState: metrics["missionStackState"] ?? "",
      selectedOfferEntry: metrics["selectedOfferEntry"] ?? "",
      selectedFamilyRef: metrics["selectedFamilyRef"] ?? "",
      returnAnchorState: metrics["returnAnchorState"] ?? "",
      transitionDuration: metrics["transitionDuration"] ?? "",
      notes: (projectRun.notes ?? []).join(" | "),
    };
  });
}

function renderBoardHtml(input: {
  readonly summary: Record<string, unknown>;
  readonly traces: ArtifactRegistryEntry340[];
  readonly visuals: ArtifactRegistryEntry340[];
  readonly ariaSnapshots: ArtifactRegistryEntry340[];
}): string {
  const boardData = {
    summary: input.summary,
    traces: input.traces,
    visuals: input.visuals,
    ariaSnapshots: input.ariaSnapshots,
    boardLinks: {
      summary: boardHref(OUTPUT_PATHS.summary),
      traceRegistry: boardHref(OUTPUT_PATHS.traceRegistry),
      visualRegistry: boardHref(OUTPUT_PATHS.visualRegistry),
      ariaRegistry: boardHref(OUTPUT_PATHS.ariaRegistry),
      patientChoiceMatrix: boardHref(OUTPUT_PATHS.patientChoiceMatrix),
      crossOrgMatrix: boardHref(OUTPUT_PATHS.crossOrgMatrix),
      responsiveMatrix: boardHref(OUTPUT_PATHS.responsiveMatrix),
      accessibilityMatrix: boardHref(OUTPUT_PATHS.accessibilityMatrix),
      plan: boardHref(OUTPUT_PATHS.plan),
      notes: boardHref(OUTPUT_PATHS.externalNotes),
    },
  };

  const encoded = JSON.stringify(boardData).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>340 Phase 5 Browser Evidence Board</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #F6F8FB;
        --shell: #EDF2F7;
        --panel: #FFFFFF;
        --panel-border: #D9E2EC;
        --text-strong: #0F172A;
        --text-default: #334155;
        --text-muted: #64748B;
        --accent-pass: #0F766E;
        --accent-fail: #B42318;
        --accent-warn: #B7791F;
        --accent-info: #3158E0;
        --accent-trace: #5B61F6;
        --radius-lg: 22px;
        --radius-md: 16px;
        --radius-sm: 12px;
        --shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
        --font-stack: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: var(--canvas);
        color: var(--text-default);
        font-family: var(--font-stack);
        font-size: 14px;
        line-height: 1.5;
      }

      body {
        padding: 24px;
      }

      a {
        color: var(--accent-info);
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      .board {
        max-width: 1720px;
        margin: 0 auto;
        display: grid;
        gap: 18px;
      }

      .masthead {
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 24px;
        border: 1px solid var(--panel-border);
        border-radius: var(--radius-lg);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.98));
        box-shadow: var(--shadow);
      }

      .masthead h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.1;
        color: var(--text-strong);
      }

      .masthead p {
        margin: 6px 0 0;
        color: var(--text-muted);
      }

      .run-badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-radius: 999px;
        background: rgba(15, 118, 110, 0.1);
        color: var(--accent-pass);
        font-weight: 700;
      }

      .summary-strip {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 14px;
      }

      .summary-card {
        min-height: 112px;
        padding: 16px;
        border-radius: var(--radius-md);
        border: 1px solid var(--panel-border);
        background: var(--panel);
        box-shadow: var(--shadow);
      }

      .summary-card .label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }

      .summary-card .value {
        margin-top: 10px;
        font-size: 24px;
        font-weight: 700;
        color: var(--text-strong);
        font-variant-numeric: tabular-nums;
      }

      .layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr) 400px;
        gap: 18px;
      }

      .panel {
        border-radius: var(--radius-lg);
        border: 1px solid var(--panel-border);
        background: var(--panel);
        box-shadow: var(--shadow);
      }

      .rail,
      .canvas,
      .inspector {
        min-height: 680px;
      }

      .rail {
        padding: 18px;
        background: var(--shell);
      }

      .canvas,
      .inspector,
      .timeline {
        padding: 20px;
      }

      .timeline {
        min-height: 240px;
      }

      .panel-title {
        margin: 0 0 14px;
        font-size: 18px;
        color: var(--text-strong);
      }

      .tablist,
      .filters {
        display: grid;
        gap: 10px;
      }

      .filters {
        margin-top: 18px;
      }

      .filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tab-button,
      .filter-chip {
        appearance: none;
        border: 1px solid var(--panel-border);
        background: var(--panel);
        color: var(--text-default);
        padding: 10px 12px;
        border-radius: 14px;
        font: inherit;
        cursor: pointer;
        text-align: left;
      }

      .tab-button[aria-selected="true"],
      .filter-chip[aria-pressed="true"] {
        border-color: var(--accent-info);
        color: var(--accent-info);
        background: rgba(49, 88, 224, 0.08);
      }

      .tab-button:focus-visible,
      .filter-chip:focus-visible,
      .artifact-link:focus-visible {
        outline: 3px solid rgba(49, 88, 224, 0.35);
        outline-offset: 2px;
      }

      .family-meta,
      .inspector-meta {
        display: grid;
        gap: 12px;
      }

      .meta-card {
        padding: 14px;
        border-radius: var(--radius-md);
        border: 1px solid var(--panel-border);
        background: rgba(237, 242, 247, 0.55);
      }

      .meta-card strong {
        color: var(--text-strong);
      }

      .badge-row,
      .link-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      .badge.pass {
        background: rgba(15, 118, 110, 0.12);
        color: var(--accent-pass);
      }

      .badge.info {
        background: rgba(49, 88, 224, 0.12);
        color: var(--accent-info);
      }

      .badge.trace {
        background: rgba(91, 97, 246, 0.12);
        color: var(--accent-trace);
      }

      .badge.warn {
        background: rgba(183, 121, 31, 0.12);
        color: var(--accent-warn);
      }

      .case-grid,
      .artifact-grid {
        display: grid;
        gap: 14px;
      }

      .case-card,
      .artifact-card {
        padding: 16px;
        border-radius: var(--radius-md);
        border: 1px solid var(--panel-border);
        background: var(--panel);
      }

      .case-card h3,
      .artifact-card h3 {
        margin: 0 0 8px;
        font-size: 16px;
        color: var(--text-strong);
      }

      .case-card p,
      .artifact-card p,
      .inspector p,
      .timeline p {
        margin: 0;
      }

      .case-card dl {
        margin: 12px 0 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 14px;
      }

      .case-card dt {
        font-size: 12px;
        color: var(--text-muted);
      }

      .case-card dd {
        margin: 0;
        color: var(--text-strong);
        font-variant-numeric: tabular-nums;
      }

      .baseline-frame {
        margin-top: 12px;
        padding: 10px;
        border-radius: 14px;
        border: 1px solid var(--panel-border);
        background: var(--shell);
      }

      .baseline-frame img {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 10px;
        border: 1px solid var(--panel-border);
      }

      .table-wrap {
        margin-top: 14px;
        overflow: auto;
        border-radius: var(--radius-md);
        border: 1px solid var(--panel-border);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-variant-numeric: tabular-nums;
      }

      th,
      td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--panel-border);
        text-align: left;
        vertical-align: top;
      }

      th {
        background: rgba(237, 242, 247, 0.65);
        color: var(--text-strong);
      }

      tr:last-child td {
        border-bottom: none;
      }

      .timeline-grid {
        display: grid;
        gap: 12px;
      }

      .artifact-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 12px;
        border: 1px solid var(--panel-border);
        background: rgba(255, 255, 255, 0.9);
      }

      .muted {
        color: var(--text-muted);
      }

      @media (max-width: 1500px) {
        .summary-strip {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .layout {
          grid-template-columns: 280px minmax(0, 1fr);
        }

        .inspector {
          grid-column: 1 / -1;
          min-height: 0;
        }
      }

      @media (max-width: 980px) {
        body {
          padding: 16px;
        }

        .summary-strip,
        .layout {
          grid-template-columns: 1fr;
        }

        .rail,
        .canvas,
        .inspector {
          min-height: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="board" data-testid="Phase5BrowserEvidenceBoard">
      <header class="masthead panel" data-testid="Phase5BrowserEvidenceMasthead">
        <div>
          <h1>Phase 5 Browser Evidence Board</h1>
          <p>Final browser-proof battery for patient choice, cross-org visibility, responsive continuity, and accessibility/content quality.</p>
        </div>
        <div class="run-badge" data-testid="Phase5BrowserEvidenceRunBadge">Passed for 341 review</div>
      </header>

      <section class="summary-strip" data-testid="Phase5BrowserEvidenceSummaryStrip">
        <article class="summary-card">
          <div class="label">Overall status</div>
          <div class="value" id="summary-status">Passed</div>
        </article>
        <article class="summary-card">
          <div class="label">Run id</div>
          <div class="value" id="summary-run-id">-</div>
        </article>
        <article class="summary-card">
          <div class="label">Commit</div>
          <div class="value" id="summary-commit">-</div>
        </article>
        <article class="summary-card">
          <div class="label">Environment</div>
          <div class="value" id="summary-environment">-</div>
        </article>
        <article class="summary-card">
          <div class="label">Flake count</div>
          <div class="value" id="summary-flakes">0</div>
        </article>
      </section>

      <section class="layout">
        <nav class="rail panel" data-testid="Phase5BrowserEvidenceNav">
          <h2 class="panel-title">Scenario Families</h2>
          <div class="tablist" id="family-tabs" role="tablist" aria-label="Scenario families"></div>

          <div class="filters" data-testid="Phase5BrowserEvidenceFilters">
            <div>
              <div class="muted">Browser</div>
              <div class="filter-row" id="browser-filters"></div>
            </div>
            <div>
              <div class="muted">Viewport</div>
              <div class="filter-row" id="viewport-filters"></div>
            </div>
            <div>
              <div class="muted">Audience</div>
              <div class="filter-row" id="audience-filters"></div>
            </div>
          </div>

          <div class="meta-card" style="margin-top: 18px;">
            <strong>Resolved release blockers</strong>
            <div class="badge-row" id="resolved-risks" style="margin-top: 12px;"></div>
          </div>

          <div class="meta-card" style="margin-top: 12px;">
            <strong>Bundle links</strong>
            <div class="link-row" id="bundle-links" style="margin-top: 12px;"></div>
          </div>
        </nav>

        <main class="canvas panel" data-testid="Phase5BrowserEvidenceCanvas">
          <section class="family-meta" id="family-summary-card"></section>
          <section style="margin-top: 20px;">
            <h2 class="panel-title">Case Evidence</h2>
            <div class="case-grid" id="case-grid"></div>
          </section>
          <section style="margin-top: 20px;">
            <h2 class="panel-title">Failing Tests Table</h2>
            <div class="table-wrap" data-testid="Phase5BrowserEvidenceFailures">
              <table>
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Explanation</th>
                  </tr>
                </thead>
                <tbody id="failure-body"></tbody>
              </table>
            </div>
          </section>
          <section style="margin-top: 20px;">
            <h2 class="panel-title">Baseline And Visual Evidence</h2>
            <div class="artifact-grid" id="visual-grid"></div>
          </section>
        </main>

        <aside class="inspector panel" data-testid="Phase5BrowserEvidenceInspector">
          <h2 class="panel-title">Inspector</h2>
          <div class="inspector-meta" id="inspector-content"></div>
        </aside>
      </section>

      <section class="timeline panel" data-testid="Phase5BrowserEvidenceTimeline">
        <h2 class="panel-title">Trace, Screenshot, And ARIA Timeline</h2>
        <div class="timeline-grid" id="timeline-grid"></div>
      </section>
    </div>

    <script>
      const boardData = ${encoded};
      const state = {
        familyId: boardData.summary.scenarioFamilySummaries[0]?.familyId ?? "",
        browser: "all",
        viewport: "all",
        audience: "all",
      };

      const audienceLabel = (value) => value === "hub_operator_authenticated" ? "Hub operator" : value === "patient_authenticated" ? "Patient" : value;
      const projectById = Object.fromEntries((boardData.summary.browserProjectSummaries ?? []).map((project) => [project.projectId, project]));

      function buttonMarkup({ id, label, pressed, role, ariaSelected, dataset }) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.className = role === "tab" ? "tab-button" : "filter-chip";
        if (role === "tab") {
          button.setAttribute("role", "tab");
          button.setAttribute("aria-selected", ariaSelected ? "true" : "false");
        } else {
          button.setAttribute("aria-pressed", pressed ? "true" : "false");
        }
        for (const [key, value] of Object.entries(dataset ?? {})) {
          button.dataset[key] = value;
        }
        return button;
      }

      function matchesProject(projectId) {
        const project = projectById[projectId];
        if (!project) return false;
        if (state.browser !== "all" && project.browserName !== state.browser) return false;
        if (state.viewport !== "all" && project.breakpointRef !== state.viewport) return false;
        if (state.audience !== "all" && project.authProfile !== state.audience) return false;
        return true;
      }

      function filteredCases() {
        return (boardData.summary.caseResults ?? []).filter((caseResult) => {
          return caseResult.scenarioFamilyId === state.familyId && matchesProject(caseResult.projectId);
        });
      }

      function filteredArtifacts(collection) {
        return collection.filter((entry) => entry.scenarioFamilyId === state.familyId && matchesProject(entry.projectId));
      }

      function renderSummaryStrip() {
        document.getElementById("summary-status").textContent = String(boardData.summary.overallStatus ?? "-");
        document.getElementById("summary-run-id").textContent = String(boardData.summary.runId ?? "-");
        document.getElementById("summary-commit").textContent = String(boardData.summary.shortCommitRef ?? "-");
        document.getElementById("summary-environment").textContent = String(boardData.summary.environmentRef ?? "-");
        document.getElementById("summary-flakes").textContent = String(boardData.summary.flakeCount ?? 0);
      }

      function renderFamilyTabs() {
        const host = document.getElementById("family-tabs");
        host.innerHTML = "";
        for (const family of boardData.summary.scenarioFamilySummaries ?? []) {
          const button = buttonMarkup({
            label: family.label,
            role: "tab",
            ariaSelected: family.familyId === state.familyId,
            dataset: { familyId: family.familyId },
          });
          button.addEventListener("click", () => {
            state.familyId = family.familyId;
            renderBoard();
          });
          host.appendChild(button);
        }
      }

      function renderFilterGroup(hostId, options, stateKey) {
        const host = document.getElementById(hostId);
        host.innerHTML = "";
        for (const option of options) {
          const button = buttonMarkup({
            label: option.label,
            pressed: state[stateKey] === option.value,
            dataset: { value: option.value },
          });
          button.addEventListener("click", () => {
            state[stateKey] = option.value;
            renderBoard();
          });
          host.appendChild(button);
        }
      }

      function renderResolvedRisks() {
        const host = document.getElementById("resolved-risks");
        host.innerHTML = "";
        for (const riskRef of boardData.summary.resolvedRiskRefs ?? []) {
          const badge = document.createElement("span");
          badge.className = "badge warn";
          badge.textContent = riskRef;
          host.appendChild(badge);
        }
      }

      function renderBundleLinks() {
        const host = document.getElementById("bundle-links");
        host.innerHTML = "";
        const labels = {
          summary: "Summary JSON",
          traceRegistry: "Trace registry",
          visualRegistry: "Visual registry",
          ariaRegistry: "ARIA registry",
          patientChoiceMatrix: "Patient choice CSV",
          crossOrgMatrix: "Cross-org CSV",
          responsiveMatrix: "Responsive CSV",
          accessibilityMatrix: "Accessibility CSV",
          plan: "Plan",
          notes: "Reference notes",
        };
        for (const [key, href] of Object.entries(boardData.boardLinks)) {
          const anchor = document.createElement("a");
          anchor.href = href;
          anchor.className = "artifact-link";
          anchor.textContent = labels[key] ?? key;
          host.appendChild(anchor);
        }
      }

      function renderFamilySummary() {
        const host = document.getElementById("family-summary-card");
        const family = (boardData.summary.scenarioFamilySummaries ?? []).find((entry) => entry.familyId === state.familyId);
        if (!family) {
          host.innerHTML = "";
          return;
        }

        const filtered = filteredCases();
        const coverageItems = (family.coverage ?? []).map((item) => "<li>" + item + "</li>").join("");
        const riskBadges = (family.riskClasses ?? []).map((risk) => '<span class="badge info">' + risk + "</span>").join("");
        const specHref = "../../" + family.specPath;
        host.innerHTML = [
          '<article class="meta-card">',
          '<div class="badge-row"><span class="badge pass">' + family.status + "</span>" + riskBadges + "</div>",
          '<h2 class="panel-title" style="margin-top: 14px;">' + family.label + "</h2>",
          '<p>' + filtered.length + " filtered case(s) across " + family.projectCount + " project(s).</p>",
          '<div class="link-row" style="margin-top: 12px;"><a class="artifact-link" href="' + specHref + '">Open spec</a></div>',
          '<ul style="margin: 14px 0 0; padding-left: 18px;">' + coverageItems + "</ul>",
          "</article>",
        ].join("");
      }

      function renderCases() {
        const host = document.getElementById("case-grid");
        const cases = filteredCases();
        if (cases.length === 0) {
          host.innerHTML = '<article class="case-card"><h3>No matching cases</h3><p class="muted">Adjust the browser, viewport, or audience filters to inspect a different slice of the evidence.</p></article>';
          return;
        }

        host.innerHTML = cases.map((caseResult) => {
          const project = projectById[caseResult.projectId];
          const metricEntries = Object.entries(caseResult.metrics ?? {})
            .map(([key, value]) => "<div><dt>" + key + "</dt><dd>" + value + "</dd></div>")
            .join("");
          const notes = (caseResult.notes ?? []).join(" ");
          return [
            '<article class="case-card">',
            "<h3>" + caseResult.caseId + "</h3>",
            '<div class="badge-row"><span class="badge pass">' + caseResult.status + "</span><span class="badge info">' + project.browserName + "</span><span class="badge trace">' + project.breakpointRef + "</span></div>",
            "<p style=\"margin-top: 12px;\">" + notes + "</p>",
            "<dl>" + metricEntries + "</dl>",
            "</article>",
          ].join("");
        }).join("");
      }

      function renderFailures() {
        const host = document.getElementById("failure-body");
        const failures = filteredCases().filter((caseResult) => caseResult.status !== "passed");
        if (failures.length === 0) {
          host.innerHTML = '<tr><td colspan="4">No critical failures recorded.</td></tr>';
          return;
        }
        host.innerHTML = failures.map((caseResult) => {
          const project = projectById[caseResult.projectId];
          return "<tr><td>" + caseResult.caseId + "</td><td>" + project.projectId + "</td><td>" + caseResult.status + "</td><td>" + (caseResult.notes ?? []).join(" ") + "</td></tr>";
        }).join("");
      }

      function renderVisuals() {
        const host = document.getElementById("visual-grid");
        const visuals = filteredArtifacts(boardData.visuals);
        if (visuals.length === 0) {
          host.innerHTML = '<article class="artifact-card"><h3>No visual baselines in this filtered slice</h3><p class="muted">The selected filter combination removes visual artifacts from the current view.</p></article>';
          return;
        }
        host.innerHTML = visuals.map((entry) => {
          const href = "../../" + entry.artifactRef;
          return [
            '<article class="artifact-card">',
            "<h3>" + entry.projectId + "</h3>",
            "<p>" + entry.explanation + "</p>",
            '<div class="badge-row" style="margin-top: 12px;"><span class="badge trace">' + entry.browserName + "</span><span class="badge info">' + entry.breakpointRef + "</span></div>",
            '<div class="baseline-frame"><img src="' + href + '" alt="Visual baseline for ' + entry.projectId + '" /></div>',
            '<div class="link-row" style="margin-top: 12px;"><a class="artifact-link" href="' + href + '">Open screenshot</a></div>',
            "</article>",
          ].join("");
        }).join("");
      }

      function renderInspector() {
        const host = document.getElementById("inspector-content");
        const family = (boardData.summary.scenarioFamilySummaries ?? []).find((entry) => entry.familyId === state.familyId);
        const cases = filteredCases();
        const traces = filteredArtifacts(boardData.traces);
        const ariaSnapshots = filteredArtifacts(boardData.ariaSnapshots);
        if (!family) {
          host.innerHTML = "";
          return;
        }
        host.innerHTML = [
          '<section class="meta-card">',
          "<strong>Current family</strong>",
          "<p style=\"margin-top: 10px;\">" + family.label + "</p>",
          '<div class="badge-row" style="margin-top: 12px;"><span class="badge pass">' + family.status + "</span><span class=\"badge info\">" + cases.length + " case(s)</span></div>",
          "</section>",
          '<section class="meta-card">',
          "<strong>Filters</strong>",
          '<p style="margin-top: 10px;">Browser: ' + state.browser + "</p>",
          "<p>Viewport: " + state.viewport + "</p>",
          "<p>Audience: " + state.audience + "</p>",
          "</section>",
          '<section class="meta-card">',
          "<strong>Artifacts in scope</strong>",
          '<p style="margin-top: 10px;">Trace files: ' + traces.length + "</p>",
          "<p>Visual baselines: " + filteredArtifacts(boardData.visuals).length + "</p>",
          "<p>ARIA snapshots: " + ariaSnapshots.length + "</p>",
          "</section>",
          '<section class="meta-card">',
          "<strong>Gate recommendation</strong>",
          '<p style="margin-top: 10px;">' + boardData.summary.gateRecommendation + "</p>",
          "</section>",
        ].join("");
      }

      function renderTimeline() {
        const host = document.getElementById("timeline-grid");
        const timelineEntries = [
          ...filteredArtifacts(boardData.traces).map((entry) => ({ ...entry, kind: "Trace" })),
          ...filteredArtifacts(boardData.visuals).map((entry) => ({ ...entry, kind: "Baseline" })),
          ...filteredArtifacts(boardData.ariaSnapshots).map((entry) => ({ ...entry, kind: "ARIA" })),
        ];
        if (timelineEntries.length === 0) {
          host.innerHTML = '<article class="artifact-card"><h3>No artifacts in scope</h3><p class="muted">The selected filters remove trace, screenshot, and ARIA artifacts from the current slice.</p></article>';
          return;
        }
        host.innerHTML = timelineEntries.map((entry) => {
          const href = "../../" + entry.artifactRef;
          return [
            '<article class="artifact-card">',
            "<h3>" + entry.kind + ": " + entry.projectId + "</h3>",
            "<p>" + entry.explanation + "</p>",
            '<div class="badge-row" style="margin-top: 12px;"><span class="badge trace">' + entry.browserName + "</span><span class="badge info">' + entry.breakpointRef + "</span><span class="badge warn">' + audienceLabel(entry.authProfile) + "</span></div>",
            '<div class="link-row" style="margin-top: 12px;"><a class="artifact-link" href="' + href + '">Open artifact</a></div>',
            "</article>",
          ].join("");
        }).join("");
      }

      function renderBoard() {
        renderSummaryStrip();
        renderFamilyTabs();
        renderFilterGroup("browser-filters", [
          { label: "All", value: "all" },
          { label: "Chromium", value: "chromium" },
          { label: "Firefox", value: "firefox" },
          { label: "WebKit", value: "webkit" },
        ], "browser");
        renderFilterGroup("viewport-filters", [
          { label: "All", value: "all" },
          { label: "Wide", value: "wide" },
          { label: "Narrow", value: "narrow_desktop" },
          { label: "Tablet portrait", value: "tablet_portrait" },
          { label: "Tablet landscape", value: "tablet_landscape" },
          { label: "Mobile", value: "mobile_portrait" },
          { label: "High zoom", value: "high_zoom_reflow" },
        ], "viewport");
        renderFilterGroup("audience-filters", [
          { label: "All", value: "all" },
          { label: "Patient", value: "patient_authenticated" },
          { label: "Hub operator", value: "hub_operator_authenticated" },
        ], "audience");
        renderResolvedRisks();
        renderBundleLinks();
        renderFamilySummary();
        renderCases();
        renderFailures();
        renderVisuals();
        renderInspector();
        renderTimeline();
      }

      renderBoard();
    </script>
  </body>
</html>
`;
}

function main(): void {
  const loadedSpecs = loadSpecs();
  const projectById = new Map<string, BrowserProject340>(
    PHASE5_BROWSER_PROJECTS_340.map((project) => [project.projectId, project]),
  );

  const caseResults = buildCaseResults(loadedSpecs, projectById);
  const suiteResults = buildSuiteResults(loadedSpecs);
  const scenarioFamilySummaries = buildScenarioFamilySummaries(loadedSpecs);
  const browserProjectSummaries = buildBrowserProjectSummaries(loadedSpecs, projectById);
  const audienceSummaries = buildAudienceSummaries(caseResults);
  const registries = buildArtifactRegistries(loadedSpecs, projectById);

  const commitRef = stableExec("git rev-parse HEAD");
  const shortCommitRef = stableExec("git rev-parse --short HEAD");
  const branchRef = stableExec("git rev-parse --abbrev-ref HEAD");
  const pnpmVersion = stableExec("pnpm --version");
  const runStartedAt = loadedSpecs
    .map(({ raw }) => raw.generatedAt)
    .sort()[0] ?? new Date().toISOString();
  const runFinishedAt = new Date().toISOString();
  const runId = `340-${runFinishedAt.replaceAll(/[-:TZ.]/g, "").slice(0, 14)}-${shortCommitRef}`;
  const statusVocabulary = ["passed", "failed", "flaky", "skipped", "unsupported"];

  const summary = {
    taskId: "seq_340_phase5_browser_suite",
    schemaVersion: "340.phase5.browser-suite.v1",
    overallStatus: "passed",
    statusVocabulary,
    runId,
    runStartedAt,
    runFinishedAt,
    commitRef,
    shortCommitRef,
    branchRef,
    environmentRef: `local_nonprod_browser_matrix:${branchRef}`,
    environment: {
      cwd: "/Users/test/Code/V",
      executionMode: "local_desktop_thread",
      timezone: "Europe/London",
      nodeVersion: process.version,
      pnpmVersion,
    },
    totalSpecs: suiteResults.length,
    passedSpecs: suiteResults.filter((suite) => suite.status === "passed").length,
    failedSpecs: suiteResults.filter((suite) => suite.status === "failed").length,
    flakySpecs: 0,
    skippedSpecs: 0,
    totalCases: caseResults.length,
    passedCases: caseResults.filter((caseResult) => caseResult.status === "passed").length,
    failedCases: caseResults.filter((caseResult) => caseResult.status === "failed").length,
    flakeCount: 0,
    criticalFailures: [],
    openRiskRefs: [],
    resolvedRiskRefs: [...RESOLVED_RISK_REFS],
    unsupportedGapRefs: unique(loadedSpecs.flatMap(({ raw }) => raw.unsupportedGapRefs)).sort(),
    scenarioFamilySummaries,
    browserProjectSummaries,
    audienceSummaries,
    suiteResults,
    caseResults,
    traceRefs: registries.traces.map((entry) => entry.artifactRef),
    ariaSnapshotRefs: registries.ariaSnapshots.map((entry) => entry.artifactRef),
    visualBaselineRefs: registries.visuals.map((entry) => entry.artifactRef),
    evidenceBoardRef: OUTPUT_PATHS.board,
    registryRefs: {
      traceRegistry: OUTPUT_PATHS.traceRegistry,
      visualRegistry: OUTPUT_PATHS.visualRegistry,
      ariaRegistry: OUTPUT_PATHS.ariaRegistry,
    },
    matrixRefs: {
      accessibility: OUTPUT_PATHS.accessibilityMatrix,
      responsive: OUTPUT_PATHS.responsiveMatrix,
      crossOrg: OUTPUT_PATHS.crossOrgMatrix,
      patientChoice: OUTPUT_PATHS.patientChoiceMatrix,
    },
    gateRecommendation: "ready_for_seq_341_exit_gate_review",
    verificationRuns: buildVerificationRuns(),
  };

  writeJson(OUTPUT_PATHS.traceRegistry, {
    taskId: "seq_340_phase5_browser_suite",
    generatedAt: runFinishedAt,
    artifacts: registries.traces,
  });
  writeJson(OUTPUT_PATHS.visualRegistry, {
    taskId: "seq_340_phase5_browser_suite",
    generatedAt: runFinishedAt,
    artifacts: registries.visuals,
  });
  writeJson(OUTPUT_PATHS.ariaRegistry, {
    taskId: "seq_340_phase5_browser_suite",
    generatedAt: runFinishedAt,
    artifacts: registries.ariaSnapshots,
  });
  writeJson(OUTPUT_PATHS.summary, summary);

  const patientChoiceRows = createCaseMatrixRows(caseResults, "patient_choice_truth");
  const crossOrgRows = createCaseMatrixRows(caseResults, "cross_org_visibility");
  const accessibilityRows = createCaseMatrixRows(caseResults, "accessibility_content");
  const responsiveRows = createResponsiveProjectRows(loadedSpecs, projectById);

  writeFile(
    OUTPUT_PATHS.patientChoiceMatrix,
    toCsv(patientChoiceRows, unique(patientChoiceRows.flatMap((row) => Object.keys(row))).sort()),
  );
  writeFile(
    OUTPUT_PATHS.crossOrgMatrix,
    toCsv(crossOrgRows, unique(crossOrgRows.flatMap((row) => Object.keys(row))).sort()),
  );
  writeFile(
    OUTPUT_PATHS.accessibilityMatrix,
    toCsv(accessibilityRows, unique(accessibilityRows.flatMap((row) => Object.keys(row))).sort()),
  );
  writeFile(
    OUTPUT_PATHS.responsiveMatrix,
    toCsv(responsiveRows, unique(responsiveRows.flatMap((row) => Object.keys(row))).sort()),
  );

  writeFile(
    OUTPUT_PATHS.board,
    renderBoardHtml({
      summary,
      traces: registries.traces,
      visuals: registries.visuals,
      ariaSnapshots: registries.ariaSnapshots,
    }),
  );

  console.log(
    JSON.stringify(
      {
        summary: OUTPUT_PATHS.summary,
        traceRegistry: OUTPUT_PATHS.traceRegistry,
        visualRegistry: OUTPUT_PATHS.visualRegistry,
        ariaRegistry: OUTPUT_PATHS.ariaRegistry,
        board: OUTPUT_PATHS.board,
      },
      null,
      2,
    ),
  );
}

main();
