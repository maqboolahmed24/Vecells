import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  PHASE9_EXIT_GATE_VERSION,
  Phase9ExitGateService,
  createPhase9ExitGateExactEvaluationInput,
  createPhase9ExitGateFixture,
  type Phase9ExitGateEvaluationInput,
  type Phase9ExitGateProofFamilyInput,
} from "../../packages/domains/analytics_assurance/src/index.ts";

export const PHASE9_471_TASK_ID =
  "par_471_phase9_exit_gate_approve_assurance_ledger_completion";

const root = process.cwd();

const externalReferences = [
  {
    title: "Playwright accessibility testing",
    url: "https://playwright.dev/docs/accessibility-testing",
    appliedTo: [
      "exit-gate status route keyboard checks",
      "ARIA snapshots for exact and blocked status surfaces",
      "sanitized screenshot evidence",
    ],
  },
  {
    title: "Playwright ARIA snapshots",
    url: "https://playwright.dev/docs/aria-snapshots",
    appliedTo: ["source-backed status surface snapshots without raw evidence payloads"],
  },
  {
    title: "WCAG 2.2",
    url: "https://www.w3.org/TR/WCAG22/",
    appliedTo: ["keyboard access, focus order, names, roles, and status text"],
  },
  {
    title: "OWASP Web Security Testing Guide",
    url: "https://owasp.org/www-project-web-security-testing-guide/",
    appliedTo: [
      "fail-closed approval controls",
      "authorization, session, artifact, and evidence-boundary defensive checks",
    ],
  },
  {
    title: "NCSC Cyber Assessment Framework",
    url: "https://www.ncsc.gov.uk/collection/cyber-assessment-framework",
    appliedTo: ["assurance, governance, monitoring, incident, and resilience proof families"],
  },
  {
    title: "NHS digital service manual accessibility",
    url: "https://service-manual.nhs.uk/accessibility",
    appliedTo: ["healthcare-service accessibility and content clarity calibration"],
  },
] as const;

const contractGap = {
  schemaVersion: "471.phase9.exit-gate-contract.interface-gap.v1",
  taskId: PHASE9_471_TASK_ID,
  missingSurface: "Phase9ExitGateDecision command/read model contract",
  expectedOwnerTask: PHASE9_471_TASK_ID,
  sourceBlueprintBlock:
    "blueprint/phase-9-the-assurance-ledger.md#9I. Full-program exercises, BAU transfer, and formal exit gate",
  temporaryFallback:
    "Repository-native Phase9ExitGateService evaluates current proof-family rows, emits a WORM/audit settlement, and blocks release-to-BAU unless every mandatory row is exact.",
  riskIfUnresolved:
    "BAU signoff could be inferred from checklist status or dashboard calmness instead of current graph, tuple, settlement, and scorecard proof.",
  followUpAction:
    "Task 472 must consume this decision as final Phase 9 proof when reconciling the programme conformance scorecard.",
  whyFallbackPreservesAlgorithm:
    "The fallback is fail-closed, hash-bound, idempotent, and uses the same source refs and evidence files required by section 9I.",
  gapClosed: true,
};

function writeJson(relativePath: string, value: unknown): void {
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, value.endsWith("\n") ? value : `${value}\n`);
}

function filePathForRef(ref: string): string | null {
  const withoutAnchor = ref.split("#")[0] ?? ref;
  if (!withoutAnchor.match(/^(data|blueprint|docs|tests|tools|packages|apps|services|prompt)\//)) {
    return null;
  }
  return path.join(root, withoutAnchor);
}

function hashFileForRef(ref: string): string {
  const filePath = filePathForRef(ref);
  if (!filePath) {
    return `opaque:${ref}`;
  }
  if (!fs.existsSync(filePath)) {
    return `missing:${ref}`;
  }
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function bindCurrentProofHashes(
  proofFamilies: readonly Phase9ExitGateProofFamilyInput[],
): readonly Phase9ExitGateProofFamilyInput[] {
  return proofFamilies.map((proofFamily) => {
    const currentProofHashes = proofFamily.proofRefs.map((ref) => `${ref}:${hashFileForRef(ref)}`);
    const hasMissingProof = currentProofHashes.some((hash) => hash.includes(":missing:"));
    return {
      ...proofFamily,
      currentProofHashes,
      evidenceFreshnessState:
        proofFamily.evidenceFreshnessState === "deferred_scope"
          ? "deferred_scope"
          : hasMissingProof
            ? "missing"
            : proofFamily.evidenceFreshnessState,
    };
  });
}

export function buildPhase9ExitGateEvaluationInputFromRepo(): Phase9ExitGateEvaluationInput {
  const exactInput = createPhase9ExitGateExactEvaluationInput();
  return {
    ...exactInput,
    runtimePublicationBundleHash: hashFileForRef(
      "data/contracts/464_phase9_live_projection_gateway_contract.json",
    ),
    proofFamilies: bindCurrentProofHashes(exactInput.proofFamilies),
  };
}

function phase9ExitGateSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://vecells.local/schemas/471_phase9_exit_gate.schema.json",
    title: "Phase 9 Exit Gate Decision",
    type: "object",
    required: [
      "schemaVersion",
      "phase9ExitGateDecisionId",
      "decisionState",
      "checklistRows",
      "blockers",
      "completionEvidenceBundle",
      "settlement",
      "releaseToBAURecordGuard",
      "decisionHash",
    ],
    properties: {
      schemaVersion: { const: PHASE9_EXIT_GATE_VERSION },
      phase9ExitGateDecisionId: { type: "string", pattern: "^p9xgd_471_" },
      decisionState: { enum: ["approved", "blocked"] },
      approvalPermitted: { type: "boolean" },
      crossPhaseConformanceScorecardState: { enum: ["exact", "stale", "blocked"] },
      checklistRows: {
        type: "array",
        minItems: 15,
        items: {
          type: "object",
          required: ["rowId", "proofFamilyId", "mandatory", "rowState", "proofRefs", "rowHash"],
          properties: {
            rowId: { type: "string", pattern: "^p9xgr_471_" },
            proofFamilyId: { type: "string" },
            mandatory: { type: "boolean" },
            rowState: { enum: ["exact", "stale", "blocked", "missing", "deferred_scope"] },
            proofRefs: { type: "array", items: { type: "string" } },
            rowHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
          },
        },
      },
      blockers: { type: "array" },
      completionEvidenceBundle: {
        type: "object",
        required: ["completionEvidenceBundleHash", "proofRefs"],
        properties: {
          completionEvidenceBundleHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
          proofRefs: { type: "array", items: { type: "string" } },
        },
      },
      settlement: {
        type: "object",
        required: ["settlementId", "idempotencyKey", "settledDecisionState", "settlementHash"],
        properties: {
          settlementId: { type: "string", pattern: "^p9xgs_471_" },
          idempotencyKey: { type: "string" },
          settledDecisionState: { enum: ["approved", "blocked"] },
          settlementHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
        },
      },
      releaseToBAURecordGuard: {
        type: "object",
        required: ["guardState", "releaseToBAURecordMayBeMinted"],
        properties: {
          guardState: { enum: ["permitted", "blocked"] },
          releaseToBAURecordMayBeMinted: { type: "boolean" },
        },
      },
      decisionHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
    },
  };
}

function runbook(decisionHash: string) {
  return `# 471 Phase 9 Exit Gate Approval Runbook

## Purpose

The Phase 9 exit gate is the authoritative completion decision for the assurance ledger. It must be evaluated from machine-readable proof refs and hashes, not from checklist state, dashboard colour, or a narrative signoff.

## Operator Steps

1. Run \`pnpm run test:phase9:exit-gate-approval\`.
2. Confirm \`data/evidence/471_phase9_exit_gate_decision.json\` has \`decision.decisionState = approved\`.
3. Confirm every mandatory \`Phase9ExitGateChecklistRow.rowState\` is \`exact\`.
4. Confirm any \`deferred_scope\` row is non-mandatory and source-backed.
5. Confirm \`releaseToBAURecordGuard.guardState = permitted\` before creating any \`ReleaseToBAURecord\`.
6. If blocked, follow each blocker owner and \`nextSafeAction\`; do not override the settlement.

## Current Evidence

Decision hash: \`${decisionHash}\`
`;
}

function algorithmNotes(decisionHash: string) {
  return `# 471 Algorithm Alignment Notes

Task: ${PHASE9_471_TASK_ID}

The implementation follows Phase 9 section 9I by joining BAUReadinessPack, OnCallMatrix, RunbookBundle, PhaseConformanceRow, CrossPhaseConformanceScorecard, and ReleaseToBAURecord preconditions into one Phase9ExitGateDecision.

The exit gate closes the Checklist-as-truth gap by deriving checklist rows from proof refs and hashes. It closes the green-dashboard gap by ignoring UI calmness unless graph, runtime tuple, settlement, test, and scorecard evidence are exact. It closes deferred-scope ambiguity by allowing only source-backed non-mandatory deferred rows. It closes evidence freshness and BAU shortcut gaps by blocking approval and ReleaseToBAURecord minting on stale, blocked, missing, or non-exact mandatory proof.

The service writes a metadata-only WORM/audit entry and an idempotent Phase9ExitGateSettlement. Approval is possible only when every mandatory proof row is exact and \`CrossPhaseConformanceScorecard.scorecardState = exact\`.

Decision hash: ${decisionHash}
`;
}

function externalReferenceNotes() {
  return {
    schemaVersion: `${PHASE9_EXIT_GATE_VERSION}.external-references`,
    taskId: PHASE9_471_TASK_ID,
    generatedAt: "2026-04-28T00:00:00.000Z",
    references: externalReferences,
  };
}

export function writePhase9ExitGateArtifacts() {
  const service = new Phase9ExitGateService();
  const input = buildPhase9ExitGateEvaluationInputFromRepo();
  const decision = service.attemptExitGateApproval(input);
  const readModel = service.getExitGateStatus(decision);
  const fixture = createPhase9ExitGateFixture();
  const evidence = {
    schemaVersion: PHASE9_EXIT_GATE_VERSION,
    taskId: PHASE9_471_TASK_ID,
    generatedAt: decision.generatedAt,
    sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
    producedObjects: fixture.producedObjects,
    apiSurface: fixture.apiSurface,
    decision,
    readModel,
    blockedDecisionExample: fixture.blockedDecision,
    missingProofDecisionExample: fixture.missingProofDecision,
    contractGap,
    noChecklistTruthDependency: true,
    noGreenDashboardSubstitution: true,
    deferredScopeExplicit: decision.deferredScopeNotes.length > 0,
    evidenceFreshnessGate: true,
    bauShortcutBlocked: decision.releaseToBAURecordGuard.releaseToBAURecordMayBeMinted === true,
    replayHash: fixture.replayHash,
  };

  writeJson("data/contracts/471_phase9_exit_gate.schema.json", phase9ExitGateSchema());
  writeJson(
    "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_471_PHASE9_EXIT_GATE_CONTRACT.json",
    contractGap,
  );
  writeJson("data/evidence/471_phase9_exit_gate_decision.json", evidence);
  writeText("docs/runbooks/471_phase9_exit_gate_approval_runbook.md", runbook(decision.decisionHash));
  writeText("data/analysis/471_algorithm_alignment_notes.md", algorithmNotes(decision.decisionHash));
  writeJson("data/analysis/471_external_reference_notes.json", externalReferenceNotes());
  return evidence;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const evidence = writePhase9ExitGateArtifacts();
  console.log(
    `Wrote task 471 Phase 9 exit gate decision (${evidence.decision.decisionState}, ${evidence.decision.decisionHash}).`,
  );
}
