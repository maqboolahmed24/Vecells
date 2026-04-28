import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  bootstrapMeshMailboxes,
  buildMeshConfigurationContract,
  buildMeshPortalAutomationGap,
  buildMeshRouteManifest,
  buildMeshSetupGapRegister,
  materializeMeshTrackedArtifacts,
  resetMeshMailboxes,
  renderMeshEnvironmentMatrixCsv,
  renderMeshMailboxRegistryYaml,
  renderMeshRouteManifestYaml,
  seedNonProdRouteChecks,
  verifyMeshRoutes,
} from "../../scripts/messaging/335_mesh_mailbox_lib.ts";
import {
  atMinute,
  buildAcknowledgementInput,
  buildEnqueuePracticeContinuityInput,
  buildReceiptInput,
  setupPracticeContinuityHarness,
} from "../../tests/integration/322_practice_continuity.helpers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const CHECKLIST = path.join(ROOT, "prompt", "checklist.md");

const REQUIRED_FILES = [
  "ops/messaging/335_mesh_mailbox_registry.yaml",
  "ops/messaging/335_mesh_route_manifest.yaml",
  "ops/messaging/335_mesh_environment_matrix.csv",
  "docs/ops/335_mesh_mailbox_and_route_runbook.md",
  "docs/security/335_mesh_secret_and_certificate_handling.md",
  "data/contracts/335_mesh_route_contract.json",
  "data/analysis/335_algorithm_alignment_notes.md",
  "data/analysis/335_external_reference_notes.md",
  "data/analysis/335_mesh_setup_gap_register.json",
  "data/analysis/PHASE5_BATCH_332_339_INTERFACE_GAP_MESH_PORTAL_AUTOMATION.json",
  "scripts/messaging/335_mesh_mailbox_lib.ts",
  "scripts/messaging/335_bootstrap_mesh_mailboxes.ts",
  "scripts/messaging/335_verify_mesh_routes.ts",
  "scripts/messaging/335_seed_nonprod_route_checks.ts",
  "tests/playwright/335_mesh_portal.helpers.ts",
  "tests/playwright/335_mesh_admin_portal_setup.spec.ts",
  "tests/playwright/335_mesh_route_verification.spec.ts",
  "tests/integration/335_mesh_roundtrip_and_dedupe.spec.ts",
  "output/playwright/335-mesh-admin-portal-setup.png",
  "output/playwright/335-mesh-admin-portal-setup-trace.zip",
  "output/playwright/335-mesh-route-verification.png",
  "output/playwright/335-mesh-route-verification-trace.zip",
] as const;

const REQUIRED_SCRIPT =
  '"validate:335-mesh-configuration": "pnpm exec tsx ./tools/analysis/validate_335_mesh_configuration.ts"';

const FORBIDDEN_TRACKED_TOKENS = [
  "BEGIN PRIVATE KEY",
  "BEGIN CERTIFICATE",
  "plainpassword",
  "client_secret=",
  "bearer ey",
  "password=",
] as const;

const FORBIDDEN_OUTPUT_TOKENS = ["secret://", "vault://", "certfp://", "BEGIN CERTIFICATE"] as const;

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath: string): string {
  requireCondition(fs.existsSync(filePath), `MISSING_REQUIRED_FILE:${path.relative(ROOT, filePath)}`);
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath: string): any {
  return JSON.parse(read(filePath));
}

function checklistState(taskPrefix: string): string {
  const pattern = new RegExp(`^- \\[([ Xx-])\\] ${taskPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m");
  const match = read(CHECKLIST).match(pattern);
  requireCondition(match, `CHECKLIST_ROW_MISSING:${taskPrefix}`);
  return match[1]!.toUpperCase();
}

function validateChecklist(): void {
  requireCondition(
    checklistState(
      "par_334_phase5_track_Playwright_or_other_appropriate_tooling_frontend_build_cross_org_accessibility_content_and_artifact_handoff_refinements",
    ) === "X",
    "DEPENDENCY_INCOMPLETE:par_334",
  );
  const taskState = checklistState(
    "seq_335_phase5_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_mesh_mailboxes_and_cross_org_message_routes",
  );
  requireCondition(["-", "X"].includes(taskState), "TASK_NOT_CLAIMED:seq_335");
}

function validateRequiredFiles(): void {
  for (const relativePath of REQUIRED_FILES) {
    requireCondition(
      fs.existsSync(path.join(ROOT, relativePath)),
      `MISSING_REQUIRED_FILE:${relativePath}`,
    );
  }
}

async function validateGeneratedArtifacts(): Promise<void> {
  requireCondition(
    read(path.join(ROOT, "ops/messaging/335_mesh_mailbox_registry.yaml")) ===
      (await renderMeshMailboxRegistryYaml()),
    "REGISTRY_YAML_DRIFT",
  );
  requireCondition(
    read(path.join(ROOT, "ops/messaging/335_mesh_route_manifest.yaml")) ===
      (await renderMeshRouteManifestYaml()),
    "ROUTE_MANIFEST_YAML_DRIFT",
  );
  requireCondition(
    read(path.join(ROOT, "ops/messaging/335_mesh_environment_matrix.csv")) ===
      (await renderMeshEnvironmentMatrixCsv()),
    "ENVIRONMENT_MATRIX_CSV_DRIFT",
  );
  requireCondition(
    JSON.stringify(readJson(path.join(ROOT, "data/contracts/335_mesh_route_contract.json"))) ===
      JSON.stringify(await buildMeshConfigurationContract()),
    "ROUTE_CONTRACT_DRIFT",
  );
  requireCondition(
    JSON.stringify(readJson(path.join(ROOT, "data/analysis/335_mesh_setup_gap_register.json"))) ===
      JSON.stringify(await buildMeshSetupGapRegister()),
    "GAP_REGISTER_DRIFT",
  );
  requireCondition(
    JSON.stringify(
      readJson(
        path.join(
          ROOT,
          "data/analysis/PHASE5_BATCH_332_339_INTERFACE_GAP_MESH_PORTAL_AUTOMATION.json",
        ),
      ),
    ) === JSON.stringify(await buildMeshPortalAutomationGap()),
    "INTERFACE_GAP_DRIFT",
  );
}

function validatePackageScript(): void {
  requireCondition(
    read(path.join(ROOT, "package.json")).includes(REQUIRED_SCRIPT),
    "PACKAGE_SCRIPT_MISSING:validate:335-mesh-configuration",
  );
}

function validateDocsAndNotes(): void {
  const runbook = read(path.join(ROOT, "docs/ops/335_mesh_mailbox_and_route_runbook.md"));
  const security = read(path.join(ROOT, "docs/security/335_mesh_secret_and_certificate_handling.md"));
  const alignment = read(path.join(ROOT, "data/analysis/335_algorithm_alignment_notes.md"));
  const external = read(path.join(ROOT, "data/analysis/335_external_reference_notes.md"));
  const adminSpec = read(path.join(ROOT, "tests/playwright/335_mesh_admin_portal_setup.spec.ts"));
  const routeSpec = read(path.join(ROOT, "tests/playwright/335_mesh_route_verification.spec.ts"));
  const integration = read(path.join(ROOT, "tests/integration/335_mesh_roundtrip_and_dedupe.spec.ts"));

  for (const token of [
    "manual bridge",
    "Path to Live deployment",
    "335_bootstrap_mesh_mailboxes.ts",
    "335_verify_mesh_routes.ts",
    "335_seed_nonprod_route_checks.ts",
  ]) {
    requireCondition(runbook.includes(token), `RUNBOOK_TOKEN_MISSING:${token}`);
  }
  for (const token of ["certfp://", "playwright/.auth", "smartcard", "HSCN", "CSR"]) {
    requireCondition(security.includes(token), `SECURITY_TOKEN_MISSING:${token}`);
  }
  for (const token of [
    "PracticeContinuityMessage",
    "PracticeAcknowledgementRecord",
    "NetworkReminderPlan",
    "transport_only_not_acknowledged",
    "path_to_live_integration",
  ]) {
    requireCondition(alignment.includes(token), `ALIGNMENT_TOKEN_MISSING:${token}`);
  }
  for (const token of [
    "Apply for a MESH mailbox",
    "Workflow Groups and Workflow IDs",
    "endpoint lookup service",
    "Authentication",
    "Isolation",
  ]) {
    requireCondition(external.includes(token), `EXTERNAL_NOTE_TOKEN_MISSING:${token}`);
  }
  for (const token of ["manual_bridge_required", "sha256:", "mailbox_335_vecells_hub_path_to_live_deployment"]) {
    requireCondition(adminSpec.includes(token), `ADMIN_SPEC_TOKEN_MISSING:${token}`);
  }
  for (const token of [
    "transport_only_not_acknowledged",
    "business_ack_generation_bound",
    "transport_only_not_recovery_settled",
  ]) {
    requireCondition(routeSpec.includes(token), `ROUTE_SPEC_TOKEN_MISSING:${token}`);
  }
  for (const token of ["VEC_HUB_BOOKING_NOTICE", "VEC_HUB_BOOKING_ACK", "replayed"]) {
    requireCondition(integration.includes(token), `INTEGRATION_TOKEN_MISSING:${token}`);
  }
}

function scanTrackedFiles(): void {
  for (const relativePath of [
    "ops/messaging/335_mesh_mailbox_registry.yaml",
    "ops/messaging/335_mesh_route_manifest.yaml",
    "docs/security/335_mesh_secret_and_certificate_handling.md",
    "data/contracts/335_mesh_route_contract.json",
    "data/analysis/335_mesh_setup_gap_register.json",
    "tests/playwright/335_mesh_portal.helpers.ts",
  ]) {
    const contents = read(path.join(ROOT, relativePath)).toLowerCase();
    for (const forbidden of FORBIDDEN_TRACKED_TOKENS) {
      requireCondition(
        !contents.includes(forbidden.toLowerCase()),
        `TRACKED_SECRET_LEAK:${relativePath}:${forbidden}`,
      );
    }
  }
}

function scanOutputArtifacts(): void {
  for (const relativePath of [
    "output/playwright/335-mesh-admin-portal-setup.png",
    "output/playwright/335-mesh-admin-portal-setup-trace.zip",
    "output/playwright/335-mesh-route-verification.png",
    "output/playwright/335-mesh-route-verification-trace.zip",
  ]) {
    const bytes = fs.readFileSync(path.join(ROOT, relativePath));
    const text = bytes.toString("utf8").toLowerCase();
    for (const forbidden of FORBIDDEN_OUTPUT_TOKENS) {
      requireCondition(
        !text.includes(forbidden.toLowerCase()),
        `OUTPUT_SECRET_LEAK:${relativePath}:${forbidden}`,
      );
    }
  }
}

async function withFixedNow<T>(isoTimestamp: string, work: () => Promise<T>): Promise<T> {
  const RealDate = Date;
  const fixedTime = new RealDate(isoTimestamp).valueOf();
  class FixedDate extends RealDate {
    constructor(value?: ConstructorParameters<typeof Date>[0]) {
      super(value ?? fixedTime);
    }
    static now(): number {
      return fixedTime;
    }
    static parse(value: string): number {
      return RealDate.parse(value);
    }
    static UTC(...args: Parameters<typeof Date.UTC>): number {
      return RealDate.UTC(...args);
    }
  }
  // Use a scoped Date override because the offer engine checks the current wall clock.
  globalThis.Date = FixedDate as DateConstructor;
  try {
    return await work();
  } finally {
    globalThis.Date = RealDate;
  }
}

async function validateRuntimeProof(): Promise<void> {
  const outputDir = path.join(ROOT, ".artifacts", "messaging", "335-validator");
  await materializeMeshTrackedArtifacts(ROOT);
  await resetMeshMailboxes({ outputDir });
  const bootstrap = await bootstrapMeshMailboxes({ outputDir });
  const configuredCount = bootstrap.actions.filter((action) => action.action === "configured").length;
  requireCondition(configuredCount === 3, "BOOTSTRAP_CONFIGURED_COUNT_INVALID");

  const seedResult = await seedNonProdRouteChecks(outputDir);
  requireCondition(seedResult.seedCount === 5, "ROUTE_SEED_COUNT_INVALID");

  const verification = await verifyMeshRoutes({ outputDir });
  requireCondition(
    verification.routeChecks.filter((check) => check.state === "verified").length === 5,
    "LOCAL_ROUTE_VERIFICATION_COUNT_INVALID",
  );
  requireCondition(
    verification.routeChecks.filter((check) => check.state === "manual_bridge_required").length === 4,
    "MANUAL_BRIDGE_ROUTE_COUNT_INVALID",
  );

  const manifest = await buildMeshRouteManifest();
  const noticeRoute = manifest.routes.find((route) => route.routeId === "route_335_hub_notice_local");
  const ackRoute = manifest.routes.find((route) => route.routeId === "route_335_practice_ack_local");
  requireCondition(noticeRoute, "NOTICE_ROUTE_MISSING");
  requireCondition(ackRoute, "ACK_ROUTE_MISSING");

  await withFixedNow("2026-04-23T10:05:00.000Z", async () => {
    const harness = await setupPracticeContinuityHarness("335_validator");
    const enqueued = await harness.continuityService.enqueuePracticeContinuityMessage(
      buildEnqueuePracticeContinuityInput(harness, {
        dispatchWorkflowId: noticeRoute.workflowId,
        routeIntentBindingRef: noticeRoute.routeId,
        sourceRefs: ["tools/analysis/validate_335_mesh_configuration.ts"],
      }),
    );
    requireCondition(
      enqueued.message?.dispatchWorkflowId === "VEC_HUB_BOOKING_NOTICE",
      "VALIDATOR_WORKFLOW_INVALID",
    );

    const dispatched = await harness.continuityService.dispatchPracticeContinuityMessage({
      practiceContinuityMessageId: enqueued.message!.practiceContinuityMessageId,
      attemptedAt: atMinute(16),
      sourceRefs: ["tools/analysis/validate_335_mesh_configuration.ts"],
    });
    requireCondition(
      dispatched.truthProjection.practiceVisibilityState === "continuity_pending",
      "VALIDATOR_TRANSPORT_GUARDRAIL_INVALID",
    );

    const delivered = await harness.continuityService.recordReceiptCheckpoint(
      buildReceiptInput(enqueued.message!.practiceContinuityMessageId, "delivery_downloaded", {
        recordedAt: atMinute(17),
        sourceRefs: ["tools/analysis/validate_335_mesh_configuration.ts"],
      }),
    );
    requireCondition(
      delivered.truthProjection.practiceVisibilityState === "ack_pending",
      "VALIDATOR_DELIVERY_STATE_INVALID",
    );

    const acknowledged = await harness.continuityService.capturePracticeAcknowledgement(
      await buildAcknowledgementInput(harness, enqueued.message!.practiceContinuityMessageId, {
        recordedAt: atMinute(18),
        routeIntentBindingRef: ackRoute.routeId,
        sourceRefs: ["tools/analysis/validate_335_mesh_configuration.ts"],
      }),
    );
    requireCondition(
      acknowledged.truthProjection.practiceVisibilityState === "acknowledged",
      "VALIDATOR_ACK_STATE_INVALID",
    );
  });
}

async function main(): Promise<void> {
  validateChecklist();
  validateRequiredFiles();
  await validateGeneratedArtifacts();
  validatePackageScript();
  validateDocsAndNotes();
  scanTrackedFiles();
  scanOutputArtifacts();
  await validateRuntimeProof();
  console.log("335 mesh configuration validation passed");
}

await main();
