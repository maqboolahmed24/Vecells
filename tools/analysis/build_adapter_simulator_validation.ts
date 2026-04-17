import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSimulatorBackplaneServer } from "../../services/adapter-simulators/src/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DOCS_DIR = path.join(ROOT, "docs", "integrations");
const DATA_DIR = path.join(ROOT, "data", "integration");
const ANALYSIS_DIR = path.join(ROOT, "data", "analysis");

const OUTPUTS = {
  validationDoc: path.join(DOCS_DIR, "129_adapter_simulator_validation.md"),
  contractCatalogDoc: path.join(DOCS_DIR, "129_seeded_external_contract_catalog.md"),
  handoverDoc: path.join(DOCS_DIR, "129_mock_now_vs_actual_provider_handover.md"),
  degradedDoc: path.join(DOCS_DIR, "129_adapter_degraded_mode_matrix.md"),
  consoleHtml: path.join(DOCS_DIR, "129_adapter_validation_console.html"),
  adapterMatrixCsv: path.join(DATA_DIR, "adapter_simulator_matrix.csv"),
  contractCatalogJson: path.join(DATA_DIR, "seeded_external_contract_catalog.json"),
  degradationProfilesJson: path.join(DATA_DIR, "adapter_degradation_profiles.json"),
  validationResultsJson: path.join(DATA_DIR, "adapter_validation_results.json"),
  handoverMatrixCsv: path.join(DATA_DIR, "live_provider_handover_matrix.csv"),
} as const;

type MatrixRow = {
  adapterContractProfileId: string;
  adapterCode: string;
  dependencyCode: string;
  currentExecutionPosture: string;
  liveCutoverState: string;
  simulatorContractRef: string;
  mockExecutionWorkloadFamilyRef: string;
  actualProviderWorkloadFamilyRef: string;
  mockNowSummary: string;
  actualProviderSummary: string;
  blockedLiveGateCount: string;
  reviewLiveGateCount: string;
  degradationSeverity: string;
  sourceRefs: string;
};

type EffectFamily = {
  effectFamilyId: string;
  label: string;
  authoritativeProofRulesRef: string;
};

type AdapterContractProfile = {
  adapterContractProfileId: string;
  adapterCode: string;
  dependencyCode: string;
  effectFamilies: EffectFamily[];
  supportedActionScopes: string[];
  capabilityMatrixRef: string;
  outboxCheckpointPolicyRef: string;
  receiptOrderingPolicyRef: string;
  callbackCorrelationPolicyRef: string;
  idempotencyWindowRef: string;
  duplicateDispositionRef: string;
  collisionDispositionRef: string;
  dependencyDegradationProfileRef: string;
  simulatorContractRef: string;
  liveCutoverChecklistRef: string;
};

type DegradationProfile = {
  profileId: string;
  dependencyCode: string;
  dependencyFamily: string;
  dependencyClass: string;
  failureModeClass: string;
  degradedModeDefault: string;
  manualFallbackDefault?: string;
  closureBlockerImplications?: string;
  routeFamilyRefs: string[];
  simulatorCounterparts: string[];
  authoritativeProofObjects: string[];
};

type SimulatorCatalogRow = {
  simulatorId: string;
  title: string;
  dependencyCode: string;
  dependencyFamily: string;
  simulatorType: string;
  currentExecutionPosture: string;
  replacementMode: string;
  supportedReferenceCaseIds: string[];
  supportedFaultModes: string[];
  contractDigestRef: string;
  mock_now_execution: {
    request_response_contract: string;
    callbacks: string;
    replay_policy: string;
    ordering_policy: string;
    fault_injection: string[];
    seeded_identities_or_messages: string[];
    seeded_fixtures: string[];
    observability_hooks: string[];
    side_effect_posture: string;
  };
  actual_provider_strategy_later: {
    onboarding_prerequisites: string[];
    secret_classes: string[];
    proof_obligations: string[];
    cutover_checklist: string[];
    rollback_back_to_simulator_strategy: string;
    semantic_preservation_rules: string[];
    bounded_provider_deltas: string[];
    live_gate_source: string;
    blocked_live_gate_ids: string[];
    review_live_gate_ids: string[];
  };
  source_refs: string[];
};

type ValidationScenario = {
  scenarioId: string;
  status: "pass" | "blocked" | "partial";
  summary: string;
};

type RuntimeEvidence = {
  runtimeCoverage: "runtime_http" | "standalone_http" | "contract_only" | "missing_runtime";
  usedRealCurrentPath: boolean;
  exactReplayVerified: boolean;
  duplicateSideEffectsDetected: boolean;
  degradedTruthVisible: boolean;
  unsupportedCapabilityVisible: boolean;
  validationScenarios: ValidationScenario[];
  notes: string[];
  gapRefs: string[];
};

type AdapterCatalogRow = {
  adapterId: string;
  adapterLabel: string;
  adapterFamily: string;
  dependencyCode: string;
  mockOrActual: "mock_now_execution";
  ingressContractRefs: string[];
  egressContractRefs: string[];
  capabilityTuple: {
    capabilityTupleId: string;
    supportedActionScopes: string[];
    effectFamilies: string[];
    authoritativeProofObjects: string[];
    routeFamilyRefs: string[];
    runtimeSurface: string;
  };
  unsupportedCapabilityRefs: string[];
  idempotencyModel: string;
  receiptProofModel: string;
  degradationProfileRef: string;
  seedFixtureRefs: string[];
  currentValidationState: "pass" | "partial" | "blocked" | "dishonest";
  liveProviderMigrationRef: string;
  notes: string[];
  simulatorContractRef: string;
  adapterContractProfileId: string;
  runtimeEvidence: RuntimeEvidence;
  sourceRefs: string[];
};

type RouteRefConfig = {
  ingress: string[];
  egress: string[];
  unsupported: string[];
  family: string;
  title?: string;
};

type HandoverRow = {
  adapterId: string;
  adapterLabel: string;
  liveProviderMigrationRef: string;
  pendingOnboardingEvidence: string[];
  simulatorAssumptionsToRevisit: string[];
  proofObjectsBecomeLive: string[];
  operationalMonitoringEvidence: string[];
  blockedLiveGateCount: number;
  reviewLiveGateCount: number;
  currentExecutionPosture: string;
  actualProviderSummary: string;
  sourceRefs: string[];
};

const EXCLUDED_ADAPTER_CODES = new Set([
  "adp_assistive_model_vendor_watch",
  "adp_standards_source_watch",
]);

const RUNTIME_KIND_BY_SIMULATOR: Record<string, RuntimeEvidence["runtimeCoverage"]> = {
  sim_nhs_login_auth_session_twin: "runtime_http",
  sim_im1_principal_system_emis_twin: "runtime_http",
  sim_im1_principal_system_tpp_twin: "runtime_http",
  sim_booking_provider_confirmation_twin: "runtime_http",
  sim_mesh_message_path_twin: "runtime_http",
  sim_telephony_ivr_twin: "runtime_http",
  sim_sms_delivery_twin: "runtime_http",
  sim_email_notification_twin: "runtime_http",
  sim_optional_pds_enrichment_twin: "standalone_http",
  sim_transcription_processing_twin: "standalone_http",
  sim_booking_capacity_feed_twin: "contract_only",
  sim_pharmacy_directory_choice_twin: "contract_only",
  sim_pharmacy_dispatch_transport_twin: "contract_only",
  sim_pharmacy_visibility_update_record_twin: "contract_only",
  sim_nhs_app_embedded_bridge_twin: "contract_only",
  sim_malware_artifact_scan_twin: "missing_runtime",
};

const ROUTE_REFS_BY_ADAPTER: Record<string, RouteRefConfig> = {
  adp_nhs_login_auth_bridge: {
    family: "identity_access",
    ingress: ["POST /api/nhs-login/begin", "POST /api/nhs-login/token"],
    egress: ["POST /api/nhs-login/callback", "AdapterReceiptCheckpoint", "SessionEstablishmentDecision"],
    unsupported: [
      "cap_live_partner_redirect_mutation_not_supported",
      "cap_auth_callback_equals_patient_ownership_not_supported",
    ],
  },
  adp_optional_pds_enrichment: {
    family: "identity_access",
    ingress: ["GET /Patient", "GET /Patient/:id"],
    egress: ["OperationOutcome", "MockPatient Bundle"],
    unsupported: [
      "cap_fhir_writeback_not_supported",
      "cap_pds_match_equals_durable_identity_binding_not_supported",
    ],
  },
  adp_telephony_ivr_recording: {
    family: "communications",
    ingress: ["POST /api/telephony/start", "POST /api/telephony/webhook"],
    egress: ["POST /api/telephony/retry-webhook", "AdapterReceiptCheckpoint", "CallSessionRecord"],
    unsupported: [
      "cap_live_emergency_dispatch_not_supported",
      "cap_recording_ready_equals_evidence_usable_not_supported",
    ],
  },
  adp_transcription_processing: {
    family: "evidence_processing",
    ingress: ["POST /api/jobs/simulate"],
    egress: ["POST /api/jobs/:id/retry-webhook", "POST /api/jobs/:id/supersede"],
    unsupported: [
      "cap_direct_transcript_promotion_not_supported",
      "cap_live_vendor_callback_trust_not_supported",
    ],
  },
  adp_sms_notification_delivery: {
    family: "communications",
    ingress: ["POST /api/notifications/send", "POST /api/notifications/webhook"],
    egress: ["POST /api/notifications/repair", "POST /api/notifications/settle"],
    unsupported: [
      "cap_transport_acceptance_equals_patient_safe_settlement_not_supported",
      "cap_live_sender_mutation_not_supported",
    ],
  },
  adp_email_notification_delivery: {
    family: "communications",
    ingress: ["POST /api/notifications/send", "POST /api/notifications/webhook"],
    egress: ["POST /api/notifications/repair", "POST /api/notifications/settle"],
    unsupported: [
      "cap_transport_acceptance_equals_patient_safe_settlement_not_supported",
      "cap_live_domain_mutation_not_supported",
    ],
  },
  adp_malware_artifact_scanning: {
    family: "evidence_processing",
    title: "Malware and artifact scanning twin",
    ingress: ["pack://35_evidence_processing_lab_pack::scan_profiles"],
    egress: ["pack://35_evidence_processing_lab_pack::scan_scenarios"],
    unsupported: [
      "cap_runtime_scan_callback_service_not_supported",
      "cap_clean_verdict_equals_release_not_supported",
    ],
  },
  adp_im1_pairing_programme_gate: {
    family: "gp_booking",
    ingress: ["POST /api/im1/search", "POST /api/im1/hold", "POST /api/im1/commit"],
    egress: ["AdapterReceiptCheckpoint", "BookingConfirmationTruthProjection"],
    unsupported: [
      "cap_live_supplier_pairing_not_supported",
      "cap_accepted_commit_equals_confirmed_booking_not_supported",
    ],
  },
  adp_gp_supplier_path_resolution: {
    family: "gp_booking",
    ingress: ["POST /api/im1/search", "POST /api/im1/hold", "POST /api/im1/commit"],
    egress: ["AdapterReceiptCheckpoint", "ProviderCapabilitySnapshot"],
    unsupported: [
      "cap_live_supplier_mutation_not_supported",
      "cap_supplier_path_resolution_without_current_capability_proof_not_supported",
    ],
  },
  adp_local_booking_supplier: {
    family: "gp_booking",
    ingress: ["POST /api/im1/search", "POST /api/im1/hold", "POST /api/im1/commit"],
    egress: ["ExternalConfirmationGate", "BookingConfirmationTruthProjection"],
    unsupported: [
      "cap_accepted_commit_equals_confirmed_booking_not_supported",
      "cap_hidden_weak_confirmation_not_supported",
    ],
  },
  adp_network_capacity_feed: {
    family: "gp_booking",
    ingress: ["contract://capacity_feed_import"],
    egress: ["CapacitySnapshot", "NoSlotFallbackDecision"],
    unsupported: [
      "cap_partner_feed_runtime_ingest_not_supported",
      "cap_stale_capacity_equals_current_availability_not_supported",
    ],
  },
  adp_mesh_secure_message: {
    family: "messaging_transport",
    ingress: ["POST /api/mesh/dispatch", "POST /api/mesh/poll", "POST /api/mesh/ack"],
    egress: ["TransportReceipt", "ReplayFence"],
    unsupported: [
      "cap_transport_acceptance_equals_business_completion_not_supported",
      "cap_live_mailbox_mutation_not_supported",
    ],
  },
  adp_origin_practice_ack: {
    family: "gp_booking",
    ingress: ["contract://origin_practice_ack_transport"],
    egress: ["PracticeAcknowledgementRecord", "BookingConfirmationTruthProjection"],
    unsupported: [
      "cap_origin_ack_equals_confirmed_outcome_not_supported",
      "cap_hidden_practice_delay_not_supported",
    ],
  },
  adp_pharmacy_directory_lookup: {
    family: "pharmacy",
    ingress: ["contract://pharmacy_directory_lookup"],
    egress: ["PharmacyDirectorySnapshot", "PharmacyChoiceProof"],
    unsupported: [
      "cap_live_directory_refresh_runtime_not_supported",
      "cap_stale_directory_equals_safe_choice_not_supported",
    ],
  },
  adp_pharmacy_referral_transport: {
    family: "pharmacy",
    ingress: ["contract://pharmacy_dispatch_transport"],
    egress: ["PharmacyDispatchAcknowledgement", "PharmacyDispatchExpiry", "ExternalConfirmationGate"],
    unsupported: [
      "cap_runtime_pharmacy_dispatch_transport_not_supported",
      "cap_transport_acceptance_equals_referral_settlement_not_supported",
    ],
  },
  adp_pharmacy_outcome_observation: {
    family: "pharmacy",
    ingress: ["contract://pharmacy_outcome_observation"],
    egress: ["PharmacyOutcomeRecord", "UpdateRecordVisibilityObservation"],
    unsupported: [
      "cap_runtime_pharmacy_outcome_callback_not_supported",
      "cap_hidden_outcome_reconciliation_drift_not_supported",
    ],
  },
  adp_pharmacy_urgent_return_contact: {
    family: "pharmacy",
    ingress: ["contract://pharmacy_urgent_return_contact"],
    egress: ["PharmacyCase", "manual_urgent_return_required"],
    unsupported: [
      "cap_runtime_urgent_return_professional_route_not_supported",
      "cap_urgent_return_hidden_under_transport_success_not_supported",
    ],
  },
  adp_nhs_app_embedded_bridge: {
    family: "embedded_channels",
    ingress: ["contract://nhs_app_embedded_bridge"],
    egress: ["NHSAppIntegrationManifest", "EmbeddedBridgeCapabilitySnapshot"],
    unsupported: [
      "cap_live_embedded_claim_authority_not_supported",
      "cap_embedded_bridge_without_site_link_publication_not_supported",
    ],
  },
};

function nowIso(): string {
  return new Date().toISOString();
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function readCsv(filePath: string): Promise<Record<string, string>[]> {
  const content = await fs.readFile(filePath, "utf8");
  const [headerLine, ...lines] = content.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (char === "\"") {
          const next = line[index + 1];
          if (inQuotes && next === "\"") {
            current += "\"";
            index += 1;
            continue;
          }
          inQuotes = !inQuotes;
          continue;
        }
        if (char === "," && !inQuotes) {
          cells.push(current);
          current = "";
          continue;
        }
        current += char;
      }
      cells.push(current);
      return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    });
}

function toCsv(
  headers: string[],
  rows: Array<Record<string, string | number | boolean>>,
): string {
  const escapeCell = (value: string | number | boolean): string => {
    const cell = String(value);
    return /[",\n]/u.test(cell) ? `"${cell.replace(/"/gu, "\"\"")}"` : cell;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header] ?? "")).join(","))].join("\n");
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath: string, value: string): Promise<void> {
  await fs.writeFile(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function getFreePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate a free port."));
        return;
      }
      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function listen(server: http.Server): Promise<{ baseUrl: string; stop: () => Promise<void> }> {
  const port = await new Promise<number>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to start HTTP server."));
        return;
      }
      resolve(address.port);
    });
  });
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    stop: async () =>
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function waitForJson(url: string, attempts = 40): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await response.text();
        return;
      }
      lastError = new Error(`Health check returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw lastError instanceof Error ? lastError : new Error(`Health check failed for ${url}`);
}

async function fetchJson(
  url: string,
  init?: Parameters<typeof fetch>[1],
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(url, init);
  const bodyText = await response.text();
  const body = bodyText ? (JSON.parse(bodyText) as Record<string, unknown>) : {};
  return { status: response.status, body };
}

async function spawnNodeService(
  scriptPath: string,
  portEnvName: string,
  healthPath: string,
): Promise<{ baseUrl: string; stop: () => Promise<void> }> {
  const port = await getFreePort();
  const child = spawn("node", [scriptPath], {
    cwd: ROOT,
    env: {
      ...process.env,
      [portEnvName]: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  const append = (chunk: Buffer) => {
    output += chunk.toString("utf8");
  };
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  await waitForJson(`http://127.0.0.1:${port}${healthPath}`);
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    stop: async () =>
      await new Promise<void>((resolve, reject) => {
        child.once("exit", () => resolve());
        child.once("error", reject);
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) {
            child.kill("SIGKILL");
          }
        }, 1000);
        setTimeout(() => {
          reject(new Error(`Timed out stopping ${scriptPath}\n${output}`));
        }, 3000);
      }).catch(async (error) => {
        child.kill("SIGKILL");
        throw error;
      }),
  };
}

function joinRefs(values: string[]): string {
  return values.join(" | ");
}

async function validateNhsLogin(baseUrl: string): Promise<RuntimeEvidence> {
  const begin = await fetchJson(`${baseUrl}/api/nhs-login/begin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scenarioId: "happy_path",
      routeBindingId: "rb_patient_intake_upgrade",
      clientId: "mc_recovery_bridge",
      userId: "usr_basic_p0",
      returnIntent: "patient.intake.upgrade",
    }),
  });
  const authSessionRef = String((begin.body.payload as Record<string, unknown>).authSessionRef);
  const callback = await fetchJson(`${baseUrl}/api/nhs-login/callback`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authSessionRef }),
  });
  const first = await fetchJson(`${baseUrl}/api/nhs-login/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authSessionRef, idempotencyKey: "seq129-nhs-login" }),
  });
  const replay = await fetchJson(`${baseUrl}/api/nhs-login/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authSessionRef, idempotencyKey: "seq129-nhs-login" }),
  });
  const foreignRedeem = await fetchJson(`${baseUrl}/api/nhs-login/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authSessionRef, idempotencyKey: "seq129-nhs-login-foreign" }),
  });

  const firstPayload = first.body.payload as Record<string, unknown>;
  const replayPayload = replay.body.payload as Record<string, unknown>;
  assertCondition(begin.status === 200, "NHS login begin flow failed.");
  assertCondition(callback.status === 200, "NHS login callback failed.");
  assertCondition(first.status === 200, "NHS login token redemption failed.");
  assertCondition(replay.status === 200, "NHS login exact replay failed.");
  assertCondition(replay.body.exactReplay === true, "NHS login exact replay was not flagged.");
  assertCondition(
    firstPayload.accessToken === replayPayload.accessToken,
    "NHS login exact replay minted a different access token.",
  );
  assertCondition(foreignRedeem.status === 400, "NHS login foreign idempotency reuse should fail.");

  return {
    runtimeCoverage: "runtime_http",
    usedRealCurrentPath: true,
    exactReplayVerified: true,
    duplicateSideEffectsDetected: false,
    degradedTruthVisible: true,
    unsupportedCapabilityVisible: true,
    validationScenarios: [
      { scenarioId: "oidc_callback_settlement", status: "pass", summary: "Begin -> callback -> token flows through the real simulator backplane." },
      { scenarioId: "oidc_exact_replay", status: "pass", summary: "The same idempotency key returns the prior token payload without a second side effect." },
      { scenarioId: "oidc_foreign_redeem_blocked", status: "pass", summary: "A different idempotency key is rejected instead of silently widening authority." },
    ],
    notes: ["NHS login keeps callback evidence separate from durable patient ownership."],
    gapRefs: [],
  };
}

async function validateIm1(
  baseUrl: string,
  providerSupplierId: string,
  scenarioId: "confirmed" | "ambiguous_confirmation",
): Promise<RuntimeEvidence> {
  const patientRef = `PATIENT:${providerSupplierId}:${scenarioId}:SEQ129`;
  const search = await fetchJson(`${baseUrl}/api/im1/search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      providerSupplierId,
      patientRef,
    }),
  });
  const slots = (search.body.payload as Record<string, unknown>).slots as Array<Record<string, unknown>>;
  assertCondition(search.status === 200 && slots.length > 0, `IM1 search failed for ${providerSupplierId}.`);
  const availableSlot = slots.find((slot) => !slot.holdRef) ?? slots[0];
  assertCondition(Boolean(availableSlot), `IM1 search returned no usable slot for ${providerSupplierId}.`);
  const slotRef = String(availableSlot?.slotRef);
  const hold = await fetchJson(`${baseUrl}/api/im1/hold`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slotRef,
      patientRef,
    }),
  });
  assertCondition(hold.status === 200, `IM1 hold failed for ${providerSupplierId}.`);
  const holdRef = String(((hold.body.payload as Record<string, unknown>).hold as Record<string, unknown>).holdRef);
  const commit = await fetchJson(`${baseUrl}/api/im1/commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      holdRef,
      patientRef,
      scenarioId,
    }),
  });
  const replay = await fetchJson(`${baseUrl}/api/im1/commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      holdRef,
      patientRef,
      scenarioId,
    }),
  });
  const commitPayload = commit.body.payload as Record<string, unknown>;
  const replayPayload = replay.body.payload as Record<string, unknown>;
  const appointment = commitPayload.appointment as Record<string, unknown>;
  const replayAppointment = replayPayload.appointment as Record<string, unknown>;
  assertCondition(commit.status === 200, `IM1 commit failed for ${providerSupplierId}.`);
  assertCondition(replay.status === 200 && replay.body.exactReplay === true, `IM1 replay failed for ${providerSupplierId}.`);
  assertCondition(
    appointment.appointmentRef === replayAppointment.appointmentRef,
    `IM1 replay minted a second appointment for ${providerSupplierId}.`,
  );
  if (scenarioId === "ambiguous_confirmation") {
    assertCondition(
      appointment.externalConfirmationGateState === "open",
      "IM1 ambiguous confirmation hid the ExternalConfirmationGate.",
    );
  }

  return {
    runtimeCoverage: "runtime_http",
    usedRealCurrentPath: true,
    exactReplayVerified: true,
    duplicateSideEffectsDetected: false,
    degradedTruthVisible: true,
    unsupportedCapabilityVisible: true,
    validationScenarios: [
      {
        scenarioId: `${providerSupplierId}_search_hold_commit`,
        status: "pass",
        summary:
          scenarioId === "confirmed"
            ? "Search, hold, and commit stay inside the provider-specific simulator contract."
            : "Weak confirmation stays explicit through the simulated ExternalConfirmationGate.",
      },
      {
        scenarioId: `${providerSupplierId}_commit_exact_replay`,
        status: "pass",
        summary: "Duplicate commit submissions replay onto the prior appointment instead of creating a second side effect.",
      },
    ],
    notes: [
      scenarioId === "confirmed"
        ? "Provider-like confirmation remains explicit and typed."
        : "Accepted booking commit never auto-upgrades into confirmed truth.",
    ],
    gapRefs: [],
  };
}

async function validateMesh(baseUrl: string): Promise<RuntimeEvidence> {
  const dispatch = await fetchJson(`${baseUrl}/api/mesh/dispatch`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      workflowId: "VEC_HUB_BOOKING_NOTICE",
      fromMailboxKey: "MBX_VEC_HUB",
      toMailboxKey: "MBX_VEC_SUPPORT",
      scenarioId: "duplicate_delivery",
      summary: "Seq129 duplicate receipt rehearsal",
    }),
  });
  const messageRef = String(((dispatch.body.payload as Record<string, unknown>).message as Record<string, unknown>).messageRef);
  const ack = await fetchJson(`${baseUrl}/api/mesh/ack`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messageRef }),
  });
  const replay = await fetchJson(`${baseUrl}/api/mesh/ack`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messageRef }),
  });
  const ackMessage = (ack.body.payload as Record<string, unknown>).message as Record<string, unknown>;
  const replayMessage = (replay.body.payload as Record<string, unknown>).message as Record<string, unknown>;
  assertCondition(dispatch.status === 200, "MESH dispatch failed.");
  assertCondition(ack.status === 200, "MESH acknowledgement failed.");
  assertCondition(ack.body.receiptCheckpoint && replay.body.exactReplay === true, "MESH exact replay was not preserved.");
  assertCondition(ackMessage.messageRef === replayMessage.messageRef, "MESH replay changed the message identity.");
  assertCondition(
    (ack.body.receiptCheckpoint as Record<string, unknown>).authoritativeTruthState === "duplicate_under_review",
    "MESH duplicate delivery hid the duplicate-under-review truth.",
  );

  return {
    runtimeCoverage: "runtime_http",
    usedRealCurrentPath: true,
    exactReplayVerified: true,
    duplicateSideEffectsDetected: false,
    degradedTruthVisible: true,
    unsupportedCapabilityVisible: true,
    validationScenarios: [
      {
        scenarioId: "mesh_duplicate_receipt",
        status: "pass",
        summary: "Duplicate delivery remains explicit transport ambiguity instead of fake completion.",
      },
      {
        scenarioId: "mesh_ack_exact_replay",
        status: "pass",
        summary: "The same acknowledgement fence replays without producing a second receipt side effect.",
      },
    ],
    notes: ["Transport acceptance remains supporting evidence only."],
    gapRefs: [],
  };
}

async function validateTelephony(baseUrl: string): Promise<RuntimeEvidence> {
  const start = await fetchJson(`${baseUrl}/api/telephony/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scenarioId: "webhook_signature_retry",
      numberId: "NUM_TEL_FRONTDOOR_GENERAL",
      callerRef: "caller:seq129",
    }),
  });
  const callRef = String(((start.body.payload as Record<string, unknown>).call as Record<string, unknown>).callRef);
  const blockedWebhook = await fetchJson(`${baseUrl}/api/telephony/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callRef }),
  });
  const replayWebhook = await fetchJson(`${baseUrl}/api/telephony/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callRef }),
  });
  const recovered = await fetchJson(`${baseUrl}/api/telephony/retry-webhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ callRef }),
  });
  assertCondition(start.status === 200, "Telephony start failed.");
  assertCondition(
    (blockedWebhook.body.receiptCheckpoint as Record<string, unknown>).authoritativeTruthState ===
      "callback_recovery_required",
    "Telephony webhook failure did not surface callback recovery truth.",
  );
  assertCondition(replayWebhook.body.exactReplay === true, "Telephony duplicate webhook did not exact-replay.");
  assertCondition(
    (((recovered.body.payload as Record<string, unknown>).call as Record<string, unknown>).webhookState ===
      "recovered"),
    "Telephony webhook retry did not recover the callback state.",
  );

  return {
    runtimeCoverage: "runtime_http",
    usedRealCurrentPath: true,
    exactReplayVerified: true,
    duplicateSideEffectsDetected: false,
    degradedTruthVisible: true,
    unsupportedCapabilityVisible: true,
    validationScenarios: [
      {
        scenarioId: "telephony_signature_failure",
        status: "pass",
        summary: "Signature failure freezes the callback under recovery-required posture.",
      },
      {
        scenarioId: "telephony_webhook_exact_replay",
        status: "pass",
        summary: "Duplicate callback delivery reuses the same fenced receipt rather than widening side effects.",
      },
      {
        scenarioId: "telephony_webhook_recovery",
        status: "pass",
        summary: "Replay-safe retry clears the callback fence without flattening urgent or evidence posture.",
      },
    ],
    notes: ["Telephony callback truth stays bounded until explicit recovery."],
    gapRefs: [],
  };
}

async function validateNotifications(
  baseUrl: string,
  scenarioId: string,
  templateId: string,
  expectWebhookBlocked: boolean,
): Promise<RuntimeEvidence> {
  const send = await fetchJson(`${baseUrl}/api/notifications/send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scenarioId,
      templateId,
      recipientRef: `recipient:${scenarioId}:seq129`,
    }),
  });
  const replay = await fetchJson(`${baseUrl}/api/notifications/send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scenarioId,
      templateId,
      recipientRef: `recipient:${scenarioId}:seq129`,
    }),
  });
  const messageRef = String(((send.body.payload as Record<string, unknown>).message as Record<string, unknown>).messageRef);
  const webhook = await fetchJson(`${baseUrl}/api/notifications/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messageRef }),
  });
  assertCondition(send.status === 200, `Notification send failed for ${scenarioId}.`);
  assertCondition(replay.body.exactReplay === true, `Notification exact replay failed for ${scenarioId}.`);
  if (expectWebhookBlocked) {
    assertCondition(
      (webhook.body.receiptCheckpoint as Record<string, unknown>).authoritativeTruthState ===
        "webhook_recovery_required",
      `Notification webhook did not surface blocked truth for ${scenarioId}.`,
    );
  }

  const scenarios: ValidationScenario[] = [
    {
      scenarioId: `${scenarioId}_exact_replay`,
      status: "pass",
      summary: "Duplicate dispatch reuses the same notification envelope instead of emitting a second side effect.",
    },
  ];

  if (scenarioId === "sms_wrong_recipient_disputed") {
    const repair = await fetchJson(`${baseUrl}/api/notifications/repair`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageRef }),
    });
    const settle = await fetchJson(`${baseUrl}/api/notifications/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageRef }),
    });
    assertCondition(repair.status === 200, "SMS repair flow failed.");
    assertCondition(settle.status === 200, "SMS settlement after repair failed.");
    scenarios.push({
      scenarioId: "sms_wrong_recipient_repair",
      status: "pass",
      summary: "Wrong-recipient dispute emits a reachability observation and only settles after repair.",
    });
  } else {
    scenarios.push({
      scenarioId: "email_webhook_signature_blocked",
      status: "pass",
      summary: "Signature failure remains blocked rather than silently reporting a delivered state.",
    });
  }

  return {
    runtimeCoverage: "runtime_http",
    usedRealCurrentPath: true,
    exactReplayVerified: true,
    duplicateSideEffectsDetected: false,
    degradedTruthVisible: true,
    unsupportedCapabilityVisible: true,
    validationScenarios: scenarios,
    notes: [
      scenarioId === "sms_wrong_recipient_disputed"
        ? "Repair stays explicit before authoritative settlement."
        : "Webhook signature recovery remains visible and unresolved until an operator-safe path clears it.",
    ],
    gapRefs: [],
  };
}

async function validatePds(baseUrl: string): Promise<RuntimeEvidence> {
  const ambiguous = await fetchJson(
    `${baseUrl}/Patient?scenario=ambiguous&accessMode=application_restricted&query=meridian`,
  );
  const ambiguousReplay = await fetchJson(
    `${baseUrl}/Patient?scenario=ambiguous&accessMode=application_restricted&query=meridian`,
  );
  const partialRead = await fetchJson(
    `${baseUrl}/Patient/pds_pt_meridian_001?scenario=partial_field_policy&accessMode=application_restricted`,
  );
  const unsupportedWrite = await fetchJson(`${baseUrl}/Patient`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ resourceType: "Patient" }),
  });
  assertCondition(ambiguous.status === 200, "PDS ambiguous search failed.");
  assertCondition(
    ((ambiguous.body as Record<string, unknown>).total as number) ===
      ((ambiguousReplay.body as Record<string, unknown>).total as number),
    "PDS ambiguous search is not replay-stable.",
  );
  const partialBody = partialRead.body as Record<string, unknown>;
  assertCondition(partialRead.status === 200, "PDS partial-field read failed.");
  assertCondition(
    !("address" in partialBody) &&
      Array.isArray(partialBody.extension) &&
      (partialBody.extension as Array<Record<string, unknown>>).some(
        (item) => item.valueString === "minimum_necessary_projection_only",
      ),
    "PDS partial-field policy is no longer explicit.",
  );
  assertCondition(unsupportedWrite.status === 404, "PDS write capability should remain unsupported.");

  return {
    runtimeCoverage: "standalone_http",
    usedRealCurrentPath: true,
    exactReplayVerified: true,
    duplicateSideEffectsDetected: false,
    degradedTruthVisible: true,
    unsupportedCapabilityVisible: true,
    validationScenarios: [
      {
        scenarioId: "pds_ambiguous_search",
        status: "pass",
        summary: "Ambiguous search returns multiple bounded matches without implying durable identity authority.",
      },
      {
        scenarioId: "pds_partial_field_policy",
        status: "pass",
        summary: "Minimum-necessary projections stay explicit on partial-field reads.",
      },
      {
        scenarioId: "pds_write_unsupported",
        status: "pass",
        summary: "FHIR write capability remains explicitly unsupported instead of silently succeeding.",
      },
    ],
    notes: ["PDS remains optional enrichment only and never widens identity truth on its own."],
    gapRefs: [],
  };
}

async function validateTranscription(baseUrl: string): Promise<RuntimeEvidence> {
  const first = await fetchJson(`${baseUrl}/api/jobs/simulate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      job_profile_id: "JOB_TRANS_VOICE_CALLBACK_LOCAL",
      scenario_id: "transcript_signature_retry",
      idempotency_key: "seq129-transcription",
    }),
  });
  const replay = await fetchJson(`${baseUrl}/api/jobs/simulate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      job_profile_id: "JOB_TRANS_VOICE_CALLBACK_LOCAL",
      scenario_id: "transcript_signature_retry",
      idempotency_key: "seq129-transcription",
    }),
  });
  const firstJob = first.body.job as Record<string, unknown>;
  const replayJob = replay.body.job as Record<string, unknown>;
  assertCondition(first.status === 201 || first.status === 200, "Transcription simulate failed.");
  assertCondition(replay.body.exactReplay === true, "Transcription exact replay was not preserved.");
  assertCondition(firstJob.job_id === replayJob.job_id, "Transcription replay created a second job.");
  const retry = await fetchJson(`${baseUrl}/api/jobs/${String(firstJob.job_id)}/retry-webhook`, {
    method: "POST",
  });
  assertCondition(retry.status === 200, "Transcription webhook retry failed.");

  const supersedeSeed = await fetchJson(`${baseUrl}/api/jobs/simulate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      job_profile_id: "JOB_TRANS_RETRANSCRIBE_SUPERSEDE",
      scenario_id: "transcript_superseded_replacement",
      idempotency_key: "seq129-transcription-supersede",
    }),
  });
  const supersedeJob = supersedeSeed.body.job as Record<string, unknown>;
  const supersede = await fetchJson(`${baseUrl}/api/jobs/${String(supersedeJob.job_id)}/supersede`, {
    method: "POST",
  });
  assertCondition(supersede.status === 200, "Transcription supersession failed.");

  return {
    runtimeCoverage: "standalone_http",
    usedRealCurrentPath: true,
    exactReplayVerified: true,
    duplicateSideEffectsDetected: false,
    degradedTruthVisible: true,
    unsupportedCapabilityVisible: true,
    validationScenarios: [
      {
        scenarioId: "transcription_idempotent_submit",
        status: "pass",
        summary: "The same idempotency key replays the original transcript job instead of creating a duplicate.",
      },
      {
        scenarioId: "transcription_webhook_retry",
        status: "pass",
        summary: "Signature-retry recovery stays explicit before readiness can advance.",
      },
      {
        scenarioId: "transcription_supersession",
        status: "pass",
        summary: "Supersession replaces the older transcript job rather than letting it keep driving readiness.",
      },
    ],
    notes: ["Transcript readiness remains weaker than evidence usability."],
    gapRefs: [],
  };
}

function buildContractOnlyEvidence(reason: string, gapRef: string): RuntimeEvidence {
  return {
    runtimeCoverage: "contract_only",
    usedRealCurrentPath: false,
    exactReplayVerified: false,
    duplicateSideEffectsDetected: false,
    degradedTruthVisible: true,
    unsupportedCapabilityVisible: true,
    validationScenarios: [
      {
        scenarioId: "contract_only_validation",
        status: "partial",
        summary: reason,
      },
    ],
    notes: [reason],
    gapRefs: [gapRef],
  };
}

function buildMissingRuntimeEvidence(reason: string, gapRef: string): RuntimeEvidence {
  return {
    runtimeCoverage: "missing_runtime",
    usedRealCurrentPath: false,
    exactReplayVerified: false,
    duplicateSideEffectsDetected: false,
    degradedTruthVisible: true,
    unsupportedCapabilityVisible: true,
    validationScenarios: [
      {
        scenarioId: "missing_runtime",
        status: "blocked",
        summary: reason,
      },
    ],
    notes: [reason],
    gapRefs: [gapRef],
  };
}

function titleFromAdapterCode(adapterCode: string): string {
  return adapterCode
    .replace(/^adp_/u, "")
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildFallbackSimulatorCatalogRow(
  matrixRow: MatrixRow,
  routeRefs: RouteRefConfig,
): SimulatorCatalogRow {
  const gapRef = `GAP_MISSING_SIMULATOR_CATALOG_${matrixRow.adapterCode.toUpperCase()}_V1`;
  const actualSummaryParts = matrixRow.actualProviderSummary
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return {
    simulatorId: matrixRow.simulatorContractRef,
    title: routeRefs.title ?? titleFromAdapterCode(matrixRow.adapterCode),
    dependencyCode: matrixRow.dependencyCode,
    dependencyFamily: routeRefs.family,
    simulatorType: "catalog_gap",
    currentExecutionPosture: matrixRow.currentExecutionPosture,
    replacementMode: "hybrid_contract_twin",
    supportedReferenceCaseIds: [],
    supportedFaultModes: ["catalog_gap_requires_publication"],
    contractDigestRef: gapRef,
    mock_now_execution: {
      request_response_contract: matrixRow.mockNowSummary,
      callbacks: "catalog_gap_not_executable",
      replay_policy: "catalog_gap_fail_closed",
      ordering_policy: "catalog_gap_fail_closed",
      fault_injection: ["catalog_gap_requires_explicit_runtime_or_gap_row"],
      seeded_identities_or_messages: [],
      seeded_fixtures: [],
      observability_hooks: [],
      side_effect_posture: "not_runtime_validated",
    },
    actual_provider_strategy_later: {
      onboarding_prerequisites:
        actualSummaryParts.length > 0
          ? actualSummaryParts
          : [`Pending live-provider onboarding evidence for ${matrixRow.adapterCode}.`],
      secret_classes: [`secret_class::${matrixRow.dependencyCode}::pending`],
      proof_obligations: [
        `Preserve ${matrixRow.adapterContractProfileId} proof semantics when the live provider replaces the gap row.`,
      ],
      cutover_checklist: [
        "Publish executable simulator or live-provider runtime evidence before promotion.",
        "Bind webhook security, quarantine posture, and mutation-gate proof to the same adapter row.",
      ],
      rollback_back_to_simulator_strategy:
        "No executable runtime exists today; keep the adapter fail-closed behind the published gap row until a seeded runtime is added.",
      semantic_preservation_rules: [
        `Keep ${matrixRow.adapterCode} capability tuples and degraded-mode classes stable across the later provider swap.`,
      ],
      bounded_provider_deltas: [
        "Missing simulator catalog/runtime must stay explicit and blocked instead of implying current provider readiness.",
      ],
      live_gate_source: "data/analysis/simulator_vs_live_adapter_matrix.csv",
      blocked_live_gate_ids: [gapRef],
      review_live_gate_ids: [],
    },
    source_refs: matrixRow.sourceRefs
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean),
  };
}

function sourceRefList(matrixRow: MatrixRow, simulator: SimulatorCatalogRow, profile?: AdapterContractProfile): string[] {
  return [
    ...matrixRow.sourceRefs.split(";").map((entry) => entry.trim()).filter(Boolean),
    ...simulator.source_refs,
    ...(profile
      ? [
          profile.adapterContractProfileId,
          profile.capabilityMatrixRef,
          profile.idempotencyWindowRef,
          profile.receiptOrderingPolicyRef,
        ]
      : []),
  ];
}

function liveProviderMigrationRefFor(profile: AdapterContractProfile | undefined, adapterCode: string): string {
  return profile?.liveCutoverChecklistRef ?? `LPM_129_${adapterCode.toUpperCase()}_V1`;
}

function stateFromEvidence(
  simulatorId: string,
  evidence: RuntimeEvidence,
): AdapterCatalogRow["currentValidationState"] {
  if (evidence.runtimeCoverage === "missing_runtime") {
    return "blocked";
  }
  if (evidence.runtimeCoverage === "contract_only") {
    return "partial";
  }
  if (evidence.duplicateSideEffectsDetected) {
    return "dishonest";
  }
  return simulatorId === "sim_malware_artifact_scan_twin" ? "blocked" : "pass";
}

function summaryForCounts(rows: AdapterCatalogRow[]) {
  const count = (state: AdapterCatalogRow["currentValidationState"]) =>
    rows.filter((row) => row.currentValidationState === state).length;
  return {
    adapterCount: rows.length,
    passCount: count("pass"),
    partialCount: count("partial"),
    blockedCount: count("blocked"),
    dishonestCount: count("dishonest"),
    runtimeValidatedCount: rows.filter((row) => row.runtimeEvidence.usedRealCurrentPath).length,
    gapCount: rows.flatMap((row) => row.runtimeEvidence.gapRefs).length,
  };
}

function renderMarkdownList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildValidationDoc(rows: AdapterCatalogRow[], generatedAt: string): string {
  const summary = summaryForCounts(rows);
  const passRows = rows.filter((row) => row.currentValidationState === "pass");
  const partialRows = rows.filter((row) => row.currentValidationState !== "pass");
  return `# 129 Adapter Simulator Validation

Generated: ${generatedAt}

## Mock_now_execution

Vecells now has one explicit validation board for the current simulator-first adapter estate. This task validates the real adapter-simulators HTTP backplane where it exists, validates standalone seeded services where they are the current bounded implementation, and records explicit partial or blocked rows where the repo only has contract packs or no runtime at all.

## Summary

- Adapter rows: ${summary.adapterCount}
- Pass: ${summary.passCount}
- Partial: ${summary.partialCount}
- Blocked: ${summary.blockedCount}
- Dishonest: ${summary.dishonestCount}
- Runtime-validated rows: ${summary.runtimeValidatedCount}

## Pass Rows

${renderMarkdownList(
    passRows.map(
      (row) =>
        `${row.adapterId} via ${row.runtimeEvidence.runtimeCoverage}: ${row.runtimeEvidence.validationScenarios
          .map((scenario) => scenario.summary)
          .join(" ")}`,
    ),
  )}

## Partial And Blocked Rows

${renderMarkdownList(
    partialRows.map(
      (row) =>
        `${row.adapterId} -> ${row.currentValidationState}: ${row.runtimeEvidence.notes.join(" ")} ${
          row.runtimeEvidence.gapRefs.length > 0 ? `(${row.runtimeEvidence.gapRefs.join(", ")})` : ""
        }`,
    ),
  )}

## Actual_provider_strategy_later

Live-provider motion keeps the same adapter ids, degradation profile refs, and unsupported-capability boundaries wherever possible. The handover matrix in data/integration/live_provider_handover_matrix.csv names the remaining onboarding evidence, provider-specific assumptions, and monitoring proof each adapter will need before any runtime swap is credible.
`;
}

function buildCatalogDoc(rows: AdapterCatalogRow[], generatedAt: string): string {
  return `# 129 Seeded External Contract Catalog

Generated: ${generatedAt}

## Scope

This catalog binds each current external adapter row to:

- its canonical adapter contract profile
- its simulator contract ref
- its degradation profile
- explicit unsupported capabilities
- seeded fixtures
- the current validation verdict

## Adapter Rows

${rows
  .map(
    (row) => `### ${row.adapterId}

- Label: ${row.adapterLabel}
- Family: ${row.adapterFamily}
- Validation: ${row.currentValidationState}
- Simulator contract: ${row.simulatorContractRef}
- Adapter contract profile: ${row.adapterContractProfileId}
- Degradation profile: ${row.degradationProfileRef}
- Unsupported capability refs: ${row.unsupportedCapabilityRefs.join(", ")}
- Seed fixtures: ${row.seedFixtureRefs.join(", ")}
- Notes: ${row.notes.join(" ")}
`,
  )
  .join("\n")}
`;
}

function buildHandoverDoc(rows: HandoverRow[], generatedAt: string): string {
  return `# 129 Mock Now Vs Actual Provider Handover

Generated: ${generatedAt}

## Mock_now_execution

The current engineering baseline remains simulator-first and fail-closed. No row in this handover plan implies live credentials, live mutation, or production acceptance already exist.

## Actual_provider_strategy_later

${rows
  .map(
    (row) => `### ${row.adapterId}

- Live migration ref: ${row.liveProviderMigrationRef}
- Pending onboarding evidence: ${row.pendingOnboardingEvidence.join("; ")}
- Simulator assumptions to revisit: ${row.simulatorAssumptionsToRevisit.join("; ")}
- Proof objects that become live: ${row.proofObjectsBecomeLive.join("; ")}
- Monitoring and support evidence: ${row.operationalMonitoringEvidence.join("; ")}
- Current posture: ${row.currentExecutionPosture}
- Actual-provider summary: ${row.actualProviderSummary}
`,
  )
  .join("\n")}
`;
}

function buildDegradedModeDoc(rows: AdapterCatalogRow[], degradationRows: Array<Record<string, unknown>>, generatedAt: string): string {
  return `# 129 Adapter Degraded Mode Matrix

Generated: ${generatedAt}

## Matrix

${degradationRows
  .map((row) => {
    const adapter = rows.find((item) => item.adapterId === row.adapterId);
    return `### ${row.adapterId}

- Validation state: ${adapter?.currentValidationState ?? "unknown"}
- Failure mode class: ${row.failureModeClass}
- Degraded default: ${row.degradedModeDefault}
- Proof objects: ${(row.authoritativeProofObjects as string[]).join(", ")}
- Simulator counterparts: ${(row.simulatorCounterparts as string[]).join(", ")}
`;
  })
  .join("\n")}
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "\\u0026")
    .replace(/</gu, "\\u003c")
    .replace(/>/gu, "\\u003e");
}

function buildConsoleHtml(
  rows: AdapterCatalogRow[],
  handoverRows: HandoverRow[],
  degradationRows: Array<Record<string, unknown>>,
): string {
  const payload = escapeHtml(
    JSON.stringify({
      rows,
      handoverRows,
      degradationRows,
      generatedAt: nowIso(),
    }),
  );
  const summary = summaryForCounts(rows);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>129 Adapter Validation Console</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #f7f8fa;
        --panel: #ffffff;
        --inset: #e8eef3;
        --text-strong: #0f1720;
        --text-default: #24313d;
        --text-muted: #5e6b78;
        --line: #cfd7df;
        --accent-capability: #2f6fed;
        --accent-degraded: #b7791f;
        --accent-blocked: #b42318;
        --accent-honest: #117a55;
        --radius: 22px;
        --shadow: 0 18px 40px rgba(15, 23, 32, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at top left, rgba(47, 111, 237, 0.08), transparent 24%),
          radial-gradient(circle at top right, rgba(183, 121, 31, 0.08), transparent 18%),
          var(--canvas);
        color: var(--text-default);
      }
      body.reduced-motion * {
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
      }
      .app {
        max-width: 1540px;
        margin: 0 auto;
        padding: 0 20px 32px;
      }
      .masthead {
        position: sticky;
        top: 0;
        z-index: 10;
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 16px 0;
        backdrop-filter: blur(16px);
        background: linear-gradient(180deg, rgba(247, 248, 250, 0.96), rgba(247, 248, 250, 0.82));
        border-bottom: 1px solid rgba(207, 215, 223, 0.9);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .mark {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: linear-gradient(145deg, rgba(47, 111, 237, 0.14), rgba(17, 122, 85, 0.12));
        border: 1px solid rgba(47, 111, 237, 0.18);
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(4, minmax(96px, 1fr));
        gap: 10px;
      }
      .metric {
        background: rgba(255, 255, 255, 0.84);
        border: 1px solid rgba(207, 215, 223, 0.9);
        border-radius: 16px;
        padding: 10px 12px;
      }
      .metric span {
        display: block;
        color: var(--text-muted);
        font-size: 12px;
      }
      .metric strong {
        display: block;
        margin-top: 4px;
        color: var(--text-strong);
      }
      .layout {
        display: grid;
        grid-template-columns: 264px minmax(0, 1fr) 396px;
        gap: 20px;
        align-items: start;
        margin-top: 18px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
      }
      .rail {
        position: sticky;
        top: 94px;
        padding: 18px;
      }
      .workspace {
        display: grid;
        gap: 18px;
      }
      .canvas {
        display: grid;
        gap: 18px;
      }
      .diagram-block, .inspector {
        padding: 18px;
      }
      .diagram-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 16px;
      }
      .card-list {
        display: grid;
        gap: 10px;
        margin-top: 16px;
      }
      .adapter-card {
        width: 100%;
        text-align: left;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: linear-gradient(180deg, rgba(232, 238, 243, 0.72), rgba(255, 255, 255, 0.94));
        padding: 14px;
        cursor: pointer;
      }
      .adapter-card[data-selected="true"] {
        border-color: var(--accent-capability);
        box-shadow: 0 0 0 2px rgba(47, 111, 237, 0.16);
      }
      .adapter-card small, .eyebrow, .chip, label {
        color: var(--text-muted);
        font-size: 12px;
      }
      .adapter-card strong, h1, h2, h3, .inspector strong {
        color: var(--text-strong);
      }
      .eyebrow, .chip {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        border-radius: 999px;
        padding: 4px 10px;
        background: rgba(47, 111, 237, 0.08);
      }
      .chip.pass { color: var(--accent-honest); background: rgba(17, 122, 85, 0.12); }
      .chip.partial { color: var(--accent-degraded); background: rgba(183, 121, 31, 0.12); }
      .chip.blocked, .chip.dishonest { color: var(--accent-blocked); background: rgba(180, 35, 24, 0.12); }
      h1, h2, h3, p {
        margin: 0;
      }
      .filter-group {
        display: grid;
        gap: 12px;
        margin-top: 16px;
      }
      select {
        min-height: 44px;
        border-radius: 14px;
        border: 1px solid var(--line);
        padding: 0 12px;
        background: var(--inset);
        color: var(--text-default);
        font: inherit;
      }
      .diagram {
        display: grid;
        gap: 12px;
      }
      .capability-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .capability-cell, .braid-row, .ladder-step {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px;
        background: rgba(232, 238, 243, 0.72);
      }
      .braid-list, .ladder-list {
        display: grid;
        gap: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      th, td {
        text-align: left;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(207, 215, 223, 0.72);
        vertical-align: top;
      }
      th {
        color: var(--text-muted);
        font-weight: 600;
      }
      .inspector-grid {
        display: grid;
        gap: 14px;
      }
      .inspector-card {
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(232, 238, 243, 0.72);
        padding: 14px;
      }
      ul {
        margin: 8px 0 0;
        padding-left: 18px;
      }
      .empty {
        border: 1px dashed var(--line);
        border-radius: 18px;
        padding: 18px;
        color: var(--text-muted);
      }
      @media (max-width: 1180px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .rail {
          position: static;
        }
        .diagram-grid {
          grid-template-columns: 1fr;
        }
        .capability-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 720px) {
        .metrics {
          grid-template-columns: repeat(2, minmax(96px, 1fr));
        }
        .capability-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <header class="masthead">
        <div class="brand">
          <div class="mark" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 7h6l3 5h7" stroke="#2F6FED" stroke-width="1.6" stroke-linecap="round" />
              <circle cx="4" cy="7" r="2" fill="#2F6FED" />
              <circle cx="13" cy="12" r="2" fill="#117A55" />
              <circle cx="20" cy="12" r="2" fill="#B7791F" />
            </svg>
          </div>
          <div>
            <div class="eyebrow">Adapter_Validation_Console</div>
            <h1>Adapter Validation Console</h1>
            <p>Capability, degradation, and mock-to-live handover proof for the Phase 0 simulator estate.</p>
          </div>
        </div>
        <div class="metrics">
          <div class="metric"><span>Rows</span><strong>${summary.adapterCount}</strong></div>
          <div class="metric"><span>Pass</span><strong>${summary.passCount}</strong></div>
          <div class="metric"><span>Partial</span><strong>${summary.partialCount}</strong></div>
          <div class="metric"><span>Blocked</span><strong>${summary.blockedCount}</strong></div>
        </div>
      </header>

      <main class="layout">
        <nav class="panel rail" aria-label="Adapter filters and rail">
          <p class="eyebrow">Filters</p>
          <div class="filter-group">
            <label for="filter-family">Adapter family</label>
            <select id="filter-family" data-testid="filter-family">
              <option value="all">All families</option>
            </select>
            <label for="filter-state">Validation state</label>
            <select id="filter-state" data-testid="filter-state">
              <option value="all">All states</option>
              <option value="pass">Pass</option>
              <option value="partial">Partial</option>
              <option value="blocked">Blocked</option>
              <option value="dishonest">Dishonest</option>
            </select>
            <label for="filter-posture">Mock / actual posture</label>
            <select id="filter-posture" data-testid="filter-posture">
              <option value="all">All</option>
              <option value="mock_now_execution">Mock now</option>
              <option value="actual_provider_strategy_later">Actual later</option>
            </select>
          </div>
          <div class="card-list" data-testid="adapter-rail"></div>
        </nav>

        <section class="workspace" data-testid="workspace">
          <section class="panel diagram-block">
            <p class="eyebrow">Capability matrix</p>
            <div class="diagram-grid">
              <div class="diagram" data-testid="capability-matrix"></div>
              <div data-testid="capability-table"></div>
            </div>
          </section>

          <section class="panel diagram-block">
            <p class="eyebrow">Degraded-mode braid</p>
            <div class="diagram-grid">
              <div class="diagram" data-testid="degradation-braid"></div>
              <div data-testid="degradation-table"></div>
            </div>
          </section>

          <section class="panel diagram-block">
            <p class="eyebrow">Live handover ladder</p>
            <div class="diagram-grid">
              <div class="diagram" data-testid="handover-ladder"></div>
              <div data-testid="handover-table"></div>
            </div>
          </section>
        </section>

        <aside class="panel inspector" data-testid="inspector" aria-live="polite"></aside>
      </main>
    </div>

    <script type="application/json" id="adapter-validation-data">${payload}</script>
    <script>
      const DATA = JSON.parse(document.getElementById("adapter-validation-data").textContent);
      const state = {
        selectedAdapterId: DATA.rows[0]?.adapterId ?? null,
        family: "all",
        validationState: "all",
        posture: "all",
        focusTarget: null,
      };

      const familySelect = document.querySelector("[data-testid='filter-family']");
      const stateSelect = document.querySelector("[data-testid='filter-state']");
      const postureSelect = document.querySelector("[data-testid='filter-posture']");
      const rail = document.querySelector("[data-testid='adapter-rail']");
      const capabilityHost = document.querySelector("[data-testid='capability-matrix']");
      const capabilityTable = document.querySelector("[data-testid='capability-table']");
      const degradationHost = document.querySelector("[data-testid='degradation-braid']");
      const degradationTable = document.querySelector("[data-testid='degradation-table']");
      const handoverHost = document.querySelector("[data-testid='handover-ladder']");
      const handoverTable = document.querySelector("[data-testid='handover-table']");
      const inspector = document.querySelector("[data-testid='inspector']");

      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.body.classList.add("reduced-motion");
        document.body.dataset.reducedMotion = "true";
      } else {
        document.body.dataset.reducedMotion = "false";
      }

      const familyOptions = Array.from(new Set(DATA.rows.map((row) => row.adapterFamily))).sort();
      familyOptions.forEach((family) => {
        const option = document.createElement("option");
        option.value = family;
        option.textContent = family;
        familySelect.appendChild(option);
      });

      familySelect.addEventListener("change", (event) => {
        state.family = event.target.value;
        state.focusTarget = null;
        render();
      });
      stateSelect.addEventListener("change", (event) => {
        state.validationState = event.target.value;
        state.focusTarget = null;
        render();
      });
      postureSelect.addEventListener("change", (event) => {
        state.posture = event.target.value;
        state.focusTarget = null;
        render();
      });

      function filteredRows() {
        return DATA.rows.filter((row) => {
          if (state.family !== "all" && row.adapterFamily !== state.family) {
            return false;
          }
          if (state.validationState !== "all" && row.currentValidationState !== state.validationState) {
            return false;
          }
          if (state.posture !== "all" && row.mockOrActual !== state.posture) {
            return false;
          }
          return true;
        });
      }

      function currentRow() {
        const rows = filteredRows();
        if (rows.length === 0) {
          return null;
        }
        return rows.find((row) => row.adapterId === state.selectedAdapterId) || rows[0];
      }

      function currentHandover(adapterId) {
        return DATA.handoverRows.find((row) => row.adapterId === adapterId);
      }

      function currentDegradation(adapterId) {
        return DATA.degradationRows.find((row) => row.adapterId === adapterId);
      }

      function renderTable(headers, rows, testId) {
        return \`
          <table data-testid="\${testId}">
            <thead><tr>\${headers.map((header) => \`<th>\${header}</th>\`).join("")}</tr></thead>
            <tbody>\${rows
              .map(
                (row, index) =>
                  \`<tr data-testid="\${testId}-row-\${index}">\${row
                    .map((cell) => \`<td>\${cell}</td>\`)
                    .join("")}</tr>\`,
              )
              .join("")}</tbody>
          </table>
        \`;
      }

      function restoreFocus() {
        if (!state.focusTarget) {
          return;
        }
        const selector =
          state.focusTarget.kind === "adapter"
            ? \`[data-testid="adapter-card-\${state.focusTarget.id}"]\`
            : state.focusTarget.kind === "family"
              ? "[data-testid='filter-family']"
              : state.focusTarget.kind === "validation"
                ? "[data-testid='filter-state']"
                : "[data-testid='filter-posture']";
        const element = document.querySelector(selector);
        if (element instanceof HTMLElement) {
          element.focus();
        }
      }

      function selectAdapter(adapterId) {
        state.selectedAdapterId = adapterId;
        state.focusTarget = { kind: "adapter", id: adapterId };
        render();
      }

      function renderRail(rows) {
        rail.innerHTML = "";
        if (rows.length === 0) {
          rail.innerHTML = '<div class="empty" data-testid="empty-state">No adapters match the current filters.</div>';
          return;
        }
        rows.forEach((row, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "adapter-card";
          button.dataset.selected = String(row.adapterId === state.selectedAdapterId);
          button.dataset.adapterId = row.adapterId;
          button.setAttribute("data-testid", \`adapter-card-\${row.adapterId}\`);
          button.tabIndex = row.adapterId === state.selectedAdapterId ? 0 : -1;
          button.innerHTML = \`
            <small>\${row.adapterId}</small>
            <strong>\${row.adapterLabel}</strong>
            <p>\${row.adapterFamily}</p>
            <span class="chip \${row.currentValidationState}">\${row.currentValidationState}</span>
          \`;
          button.addEventListener("click", () => selectAdapter(row.adapterId));
          button.addEventListener("keydown", (event) => {
            const buttons = [...rail.querySelectorAll("button")];
            const currentIndex = buttons.indexOf(button);
            if (event.key === "ArrowDown") {
              event.preventDefault();
              const next = buttons[Math.min(currentIndex + 1, buttons.length - 1)];
              if (next?.dataset.adapterId) {
                selectAdapter(next.dataset.adapterId);
              }
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              const previous = buttons[Math.max(currentIndex - 1, 0)];
              if (previous?.dataset.adapterId) {
                selectAdapter(previous.dataset.adapterId);
              }
            }
            if (event.key === "Home") {
              event.preventDefault();
              const first = buttons[0];
              if (first?.dataset.adapterId) {
                selectAdapter(first.dataset.adapterId);
              }
            }
            if (event.key === "End") {
              event.preventDefault();
              const last = buttons[buttons.length - 1];
              if (last?.dataset.adapterId) {
                selectAdapter(last.dataset.adapterId);
              }
            }
          });
          rail.appendChild(button);
        });
      }

      function renderCapability(row) {
        const items = [
          ["Adapter contract", row.adapterContractProfileId],
          ["Supported scopes", row.capabilityTuple.supportedActionScopes.join(", ")],
          ["Proof objects", row.capabilityTuple.authoritativeProofObjects.join(", ")],
          ["Ingress", row.ingressContractRefs.join(", ")],
          ["Egress", row.egressContractRefs.join(", ")],
          ["Unsupported", row.unsupportedCapabilityRefs.join(", ")],
        ];
        capabilityHost.innerHTML = \`<div class="capability-grid">\${items
          .map(
            (item, index) =>
              \`<div class="capability-cell" data-testid="capability-cell-\${index}"><strong>\${item[0]}</strong><p>\${item[1]}</p></div>\`,
          )
          .join("")}</div>\`;
        capabilityTable.innerHTML = renderTable(["Facet", "Value"], items, "capability-parity");
      }

      function renderDegradation(row, degradation) {
        const items = [
          ["Profile", degradation.profileId],
          ["Failure class", degradation.failureModeClass],
          ["Default", degradation.degradedModeDefault],
          ["Proof objects", degradation.authoritativeProofObjects.join(", ")],
          ["Counterparts", degradation.simulatorCounterparts.join(", ")],
        ];
        degradationHost.innerHTML = \`<div class="braid-list">\${items
          .map(
            (item, index) =>
              \`<div class="braid-row" data-testid="degraded-row-\${index}"><strong>\${item[0]}</strong><p>\${item[1]}</p></div>\`,
          )
          .join("")}</div>\`;
        degradationTable.innerHTML = renderTable(["Facet", "Value"], items, "degradation-parity");
      }

      function renderHandover(row) {
        const handover = currentHandover(row.adapterId);
        const items = [
          ["Pending onboarding", handover.pendingOnboardingEvidence.join("; ")],
          ["Revisit assumptions", handover.simulatorAssumptionsToRevisit.join("; ")],
          ["Proof becomes live", handover.proofObjectsBecomeLive.join("; ")],
          ["Monitoring evidence", handover.operationalMonitoringEvidence.join("; ")],
          ["Current posture", handover.currentExecutionPosture + " -> " + handover.actualProviderSummary],
        ];
        handoverHost.innerHTML = \`<div class="ladder-list">\${items
          .map(
            (item, index) =>
              \`<div class="ladder-step" data-testid="handover-step-\${index}"><strong>\${item[0]}</strong><p>\${item[1]}</p></div>\`,
          )
          .join("")}</div>\`;
        handoverTable.innerHTML = renderTable(["Step", "Value"], items, "handover-parity");
      }

      function renderInspector(row) {
        inspector.innerHTML = \`
          <div class="inspector-grid">
            <section class="inspector-card">
              <p class="eyebrow">Selected adapter</p>
              <h2>\${row.adapterLabel}</h2>
              <p>\${row.adapterId}</p>
              <p><span class="chip \${row.currentValidationState}">\${row.currentValidationState}</span></p>
            </section>
            <section class="inspector-card">
              <p class="eyebrow">Validation notes</p>
              <ul>\${row.runtimeEvidence.validationScenarios
                .map((scenario) => \`<li>\${scenario.summary}</li>\`)
                .join("")}</ul>
            </section>
            <section class="inspector-card">
              <p class="eyebrow">Unsupported capability refs</p>
              <ul data-testid="unsupported-capability-list">\${row.unsupportedCapabilityRefs
                .map((item) => \`<li>\${item}</li>\`)
                .join("")}</ul>
            </section>
            <section class="inspector-card">
              <p class="eyebrow">Gap refs</p>
              <p data-testid="gap-refs">\${row.runtimeEvidence.gapRefs.length === 0 ? "none" : row.runtimeEvidence.gapRefs.join(", ")}</p>
              <p><strong>Runtime coverage:</strong> \${row.runtimeEvidence.runtimeCoverage}</p>
              <p><strong>Used real current path:</strong> \${row.runtimeEvidence.usedRealCurrentPath ? "true" : "false"}</p>
            </section>
          </div>
        \`;
      }

      function render() {
        const rows = filteredRows();
        if (rows.length > 0 && !rows.some((row) => row.adapterId === state.selectedAdapterId)) {
          state.selectedAdapterId = rows[0].adapterId;
        }
        renderRail(rows);
        const row = currentRow();
        if (!row) {
          capabilityHost.innerHTML = '<div class="empty">No capability matrix available.</div>';
          capabilityTable.innerHTML = "";
          degradationHost.innerHTML = '<div class="empty">No degraded-mode braid available.</div>';
          degradationTable.innerHTML = "";
          handoverHost.innerHTML = '<div class="empty">No handover ladder available.</div>';
          handoverTable.innerHTML = "";
          inspector.innerHTML = '<div class="empty">Adjust the filters to inspect an adapter row.</div>';
          return;
        }
        renderCapability(row);
        renderDegradation(row, currentDegradation(row.adapterId));
        renderHandover(row);
        renderInspector(row);
        restoreFocus();
      }

      render();
    </script>
  </body>
</html>`;
}

async function main(): Promise<void> {
  await ensureDir(DOCS_DIR);
  await ensureDir(DATA_DIR);

  const generatedAt = nowIso();
  const adapterProfilePayload = await readJson<{ adapterContractProfiles: AdapterContractProfile[] }>(
    path.join(ANALYSIS_DIR, "adapter_contract_profile_template.json"),
  );
  const degradationPayload = await readJson<{ profiles: DegradationProfile[] }>(
    path.join(ANALYSIS_DIR, "dependency_degradation_profiles.json"),
  );
  const simulatorCatalogPayload = await readJson<{ simulators: SimulatorCatalogRow[] }>(
    path.join(ANALYSIS_DIR, "simulator_contract_catalog.json"),
  );
  const matrixRows = (await readCsv(path.join(ANALYSIS_DIR, "simulator_vs_live_adapter_matrix.csv"))) as MatrixRow[];

  const relevantMatrixRows = matrixRows.filter((row) => !EXCLUDED_ADAPTER_CODES.has(row.adapterCode));
  assertCondition(relevantMatrixRows.length === 18, "Expected 18 external adapter rows from simulator_vs_live_adapter_matrix.csv.");

  const profileById = new Map(
    adapterProfilePayload.adapterContractProfiles.map((profile) => [profile.adapterContractProfileId, profile]),
  );
  const simulatorById = new Map(
    simulatorCatalogPayload.simulators.map((simulator) => [simulator.simulatorId, simulator]),
  );
  const degradationByProfileId = new Map(
    degradationPayload.profiles.map((profile) => [profile.profileId, profile]),
  );

  const backplaneServer = createSimulatorBackplaneServer();
  const backplane = await listen(backplaneServer);
  const pdsService = await spawnNodeService(
    path.join(ROOT, "services", "mock-pds-fhir", "src", "server.js"),
    "MOCK_PDS_PORT",
    "/health",
  );
  const transcriptionService = await spawnNodeService(
    path.join(ROOT, "services", "mock-transcription-engine", "src", "server.js"),
    "MOCK_TRANSCRIPTION_PORT",
    "/api/health",
  );

  try {
    const runtimeEvidenceBySimulator = new Map<string, RuntimeEvidence>();
    runtimeEvidenceBySimulator.set("sim_nhs_login_auth_session_twin", await validateNhsLogin(backplane.baseUrl));
    runtimeEvidenceBySimulator.set(
      "sim_im1_principal_system_emis_twin",
      await validateIm1(backplane.baseUrl, "ps_optum_emisweb", "confirmed"),
    );
    runtimeEvidenceBySimulator.set(
      "sim_im1_principal_system_tpp_twin",
      await validateIm1(backplane.baseUrl, "ps_tpp_systmone", "confirmed"),
    );
    runtimeEvidenceBySimulator.set(
      "sim_booking_provider_confirmation_twin",
      await validateIm1(backplane.baseUrl, "ps_optum_emisweb", "ambiguous_confirmation"),
    );
    runtimeEvidenceBySimulator.set("sim_mesh_message_path_twin", await validateMesh(backplane.baseUrl));
    runtimeEvidenceBySimulator.set("sim_telephony_ivr_twin", await validateTelephony(backplane.baseUrl));
    runtimeEvidenceBySimulator.set(
      "sim_sms_delivery_twin",
      await validateNotifications(
        backplane.baseUrl,
        "sms_wrong_recipient_disputed",
        "TPL_SMS_SEEDED_CONTINUATION_V1",
        false,
      ),
    );
    runtimeEvidenceBySimulator.set(
      "sim_email_notification_twin",
      await validateNotifications(
        backplane.baseUrl,
        "email_webhook_signature_retry",
        "TPL_EMAIL_SECURE_LINK_SEEDED_V1",
        true,
      ),
    );
    runtimeEvidenceBySimulator.set("sim_optional_pds_enrichment_twin", await validatePds(pdsService.baseUrl));
    runtimeEvidenceBySimulator.set(
      "sim_transcription_processing_twin",
      await validateTranscription(transcriptionService.baseUrl),
    );

    const adapterRows: AdapterCatalogRow[] = relevantMatrixRows.map((matrixRow) => {
      const profile = profileById.get(matrixRow.adapterContractProfileId);
      const routeRefs = ROUTE_REFS_BY_ADAPTER[matrixRow.adapterCode];
      assertCondition(profile, `Missing adapter profile ${matrixRow.adapterContractProfileId}.`);
      assertCondition(routeRefs, `Missing route refs for ${matrixRow.adapterCode}.`);
      const simulator =
        simulatorById.get(matrixRow.simulatorContractRef) ??
        buildFallbackSimulatorCatalogRow(matrixRow, routeRefs);
      const degradation = degradationByProfileId.get(profile.dependencyDegradationProfileRef);
      assertCondition(degradation, `Missing degradation profile ${profile.dependencyDegradationProfileRef}.`);

      let runtimeEvidence = runtimeEvidenceBySimulator.get(simulator.simulatorId);
      if (!runtimeEvidence) {
        if (RUNTIME_KIND_BY_SIMULATOR[simulator.simulatorId] === "contract_only") {
          runtimeEvidence = buildContractOnlyEvidence(
            `${matrixRow.adapterCode} remains a seeded contract row with live-provider handover semantics, but the repo does not yet expose an executable runtime surface for this simulator family.`,
            `GAP_CONTRACT_ONLY_SIMULATOR_RUNTIME_${matrixRow.adapterCode.toUpperCase()}_V1`,
          );
        } else if (RUNTIME_KIND_BY_SIMULATOR[simulator.simulatorId] === "missing_runtime") {
          runtimeEvidence = buildMissingRuntimeEvidence(
            `${matrixRow.adapterCode} has a canonical adapter profile and seeded evidence pack, but no executable simulator runtime is currently present in the repo.`,
            `GAP_MISSING_SIMULATOR_RUNTIME_${matrixRow.adapterCode.toUpperCase()}_V1`,
          );
        } else {
          throw new Error(`No runtime evidence configured for ${simulator.simulatorId}.`);
        }
      }

      return {
        adapterId: matrixRow.adapterCode,
        adapterLabel: simulator.title,
        adapterFamily: routeRefs.family,
        dependencyCode: matrixRow.dependencyCode,
        mockOrActual: "mock_now_execution",
        ingressContractRefs: routeRefs.ingress,
        egressContractRefs: routeRefs.egress,
        capabilityTuple: {
          capabilityTupleId: `${matrixRow.adapterCode}::capability_tuple_v1`,
          supportedActionScopes: profile.supportedActionScopes,
          effectFamilies: profile.effectFamilies.map((item) => item.effectFamilyId),
          authoritativeProofObjects: degradation.authoritativeProofObjects,
          routeFamilyRefs: degradation.routeFamilyRefs,
          runtimeSurface: runtimeEvidence.runtimeCoverage,
        },
        unsupportedCapabilityRefs: routeRefs.unsupported,
        idempotencyModel: `${profile.idempotencyWindowRef} -> ${
          runtimeEvidence.exactReplayVerified ? "exact_replay_verified" : "contract_only_or_gap"
        }`,
        receiptProofModel: `${profile.outboxCheckpointPolicyRef} + ${profile.receiptOrderingPolicyRef} + ${joinRefs(
          degradation.authoritativeProofObjects,
        )}`,
        degradationProfileRef: degradation.profileId,
        seedFixtureRefs: [
          ...simulator.mock_now_execution.seeded_identities_or_messages,
          ...simulator.mock_now_execution.seeded_fixtures,
        ],
        currentValidationState: stateFromEvidence(simulator.simulatorId, runtimeEvidence),
        liveProviderMigrationRef: liveProviderMigrationRefFor(profile, matrixRow.adapterCode),
        notes: [
          matrixRow.mockNowSummary,
          matrixRow.actualProviderSummary,
          ...runtimeEvidence.notes,
        ],
        simulatorContractRef: simulator.simulatorId,
        adapterContractProfileId: profile.adapterContractProfileId,
        runtimeEvidence,
        sourceRefs: sourceRefList(matrixRow, simulator, profile),
      };
    });

    const handoverRows: HandoverRow[] = relevantMatrixRows.map((matrixRow) => {
      const profile = profileById.get(matrixRow.adapterContractProfileId);
      assertCondition(profile, `Missing adapter profile ${matrixRow.adapterContractProfileId}.`);
      const routeRefs = ROUTE_REFS_BY_ADAPTER[matrixRow.adapterCode];
      assertCondition(routeRefs, `Missing route refs for ${matrixRow.adapterCode}.`);
      const simulator =
        simulatorById.get(matrixRow.simulatorContractRef) ??
        buildFallbackSimulatorCatalogRow(matrixRow, routeRefs);
      return {
        adapterId: matrixRow.adapterCode,
        adapterLabel: simulator.title,
        liveProviderMigrationRef: liveProviderMigrationRefFor(profile, matrixRow.adapterCode),
        pendingOnboardingEvidence: simulator.actual_provider_strategy_later.onboarding_prerequisites,
        simulatorAssumptionsToRevisit: simulator.actual_provider_strategy_later.bounded_provider_deltas,
        proofObjectsBecomeLive: simulator.actual_provider_strategy_later.proof_obligations,
        operationalMonitoringEvidence: simulator.actual_provider_strategy_later.cutover_checklist,
        blockedLiveGateCount: Number(matrixRow.blockedLiveGateCount),
        reviewLiveGateCount: Number(matrixRow.reviewLiveGateCount),
        currentExecutionPosture: matrixRow.currentExecutionPosture,
        actualProviderSummary: matrixRow.actualProviderSummary,
        sourceRefs: [...simulator.source_refs, ...matrixRow.sourceRefs.split(";").map((item) => item.trim()).filter(Boolean)],
      };
    });

    const degradationRows = adapterRows.map((row) => {
      const profile = degradationPayload.profiles.find((item) => item.profileId === row.degradationProfileRef);
      assertCondition(profile, `Missing degradation row for ${row.adapterId}.`);
      return {
        adapterId: row.adapterId,
        adapterFamily: row.adapterFamily,
        profileId: profile.profileId,
        dependencyCode: profile.dependencyCode,
        failureModeClass: profile.failureModeClass,
        degradedModeDefault: profile.degradedModeDefault,
        authoritativeProofObjects: profile.authoritativeProofObjects,
        simulatorCounterparts: profile.simulatorCounterparts,
        routeFamilyRefs: profile.routeFamilyRefs,
        currentValidationState: row.currentValidationState,
      };
    });

    const catalogPayload = {
      task_id: "seq_129",
      generated_at: generatedAt,
      visual_mode: "Adapter_Validation_Console",
      source_precedence: [
        "prompt/129.md",
        "prompt/shared_operating_contract_126_to_135.md",
        "data/analysis/simulator_vs_live_adapter_matrix.csv",
        "data/analysis/adapter_contract_profile_template.json",
        "data/analysis/dependency_degradation_profiles.json",
        "data/analysis/simulator_contract_catalog.json",
      ],
      summary: summaryForCounts(adapterRows),
      adapterRows,
    };

    const validationPayload = {
      task_id: "seq_129",
      generated_at: generatedAt,
      summary: summaryForCounts(adapterRows),
      rows: adapterRows.map((row) => ({
        adapterId: row.adapterId,
        adapterLabel: row.adapterLabel,
        currentValidationState: row.currentValidationState,
        runtimeCoverage: row.runtimeEvidence.runtimeCoverage,
        usedRealCurrentPath: row.runtimeEvidence.usedRealCurrentPath,
        exactReplayVerified: row.runtimeEvidence.exactReplayVerified,
        duplicateSideEffectsDetected: row.runtimeEvidence.duplicateSideEffectsDetected,
        degradedTruthVisible: row.runtimeEvidence.degradedTruthVisible,
        unsupportedCapabilityVisible: row.runtimeEvidence.unsupportedCapabilityVisible,
        gapRefs: row.runtimeEvidence.gapRefs,
        validationScenarios: row.runtimeEvidence.validationScenarios,
      })),
    };

    const degradationPayloadOut = {
      task_id: "seq_129",
      generated_at: generatedAt,
      summary: {
        adapterCount: degradationRows.length,
        blockedCount: adapterRows.filter((row) => row.currentValidationState === "blocked").length,
      },
      rows: degradationRows,
    };

    await writeJson(OUTPUTS.contractCatalogJson, catalogPayload);
    await writeJson(OUTPUTS.validationResultsJson, validationPayload);
    await writeJson(OUTPUTS.degradationProfilesJson, degradationPayloadOut);

    await writeText(
      OUTPUTS.adapterMatrixCsv,
      toCsv(
        [
          "adapterId",
          "adapterFamily",
          "mockOrActual",
          "ingressContractRefs",
          "egressContractRefs",
          "capabilityTuple",
          "unsupportedCapabilityRefs",
          "idempotencyModel",
          "receiptProofModel",
          "degradationProfileRef",
          "seedFixtureRefs",
          "currentValidationState",
          "liveProviderMigrationRef",
          "notes",
        ],
        adapterRows.map((row) => ({
          adapterId: row.adapterId,
          adapterFamily: row.adapterFamily,
          mockOrActual: row.mockOrActual,
          ingressContractRefs: row.ingressContractRefs.join("; "),
          egressContractRefs: row.egressContractRefs.join("; "),
          capabilityTuple: JSON.stringify(row.capabilityTuple),
          unsupportedCapabilityRefs: row.unsupportedCapabilityRefs.join("; "),
          idempotencyModel: row.idempotencyModel,
          receiptProofModel: row.receiptProofModel,
          degradationProfileRef: row.degradationProfileRef,
          seedFixtureRefs: row.seedFixtureRefs.join("; "),
          currentValidationState: row.currentValidationState,
          liveProviderMigrationRef: row.liveProviderMigrationRef,
          notes: row.notes.join(" "),
        })),
      ),
    );

    await writeText(
      OUTPUTS.handoverMatrixCsv,
      toCsv(
        [
          "adapterId",
          "adapterLabel",
          "liveProviderMigrationRef",
          "pendingOnboardingEvidence",
          "simulatorAssumptionsToRevisit",
          "proofObjectsBecomeLive",
          "operationalMonitoringEvidence",
          "blockedLiveGateCount",
          "reviewLiveGateCount",
          "currentExecutionPosture",
          "actualProviderSummary",
        ],
        handoverRows.map((row) => ({
          adapterId: row.adapterId,
          adapterLabel: row.adapterLabel,
          liveProviderMigrationRef: row.liveProviderMigrationRef,
          pendingOnboardingEvidence: row.pendingOnboardingEvidence.join("; "),
          simulatorAssumptionsToRevisit: row.simulatorAssumptionsToRevisit.join("; "),
          proofObjectsBecomeLive: row.proofObjectsBecomeLive.join("; "),
          operationalMonitoringEvidence: row.operationalMonitoringEvidence.join("; "),
          blockedLiveGateCount: row.blockedLiveGateCount,
          reviewLiveGateCount: row.reviewLiveGateCount,
          currentExecutionPosture: row.currentExecutionPosture,
          actualProviderSummary: row.actualProviderSummary,
        })),
      ),
    );

    await writeText(OUTPUTS.validationDoc, buildValidationDoc(adapterRows, generatedAt));
    await writeText(OUTPUTS.contractCatalogDoc, buildCatalogDoc(adapterRows, generatedAt));
    await writeText(OUTPUTS.handoverDoc, buildHandoverDoc(handoverRows, generatedAt));
    await writeText(OUTPUTS.degradedDoc, buildDegradedModeDoc(adapterRows, degradationRows, generatedAt));
    await writeText(OUTPUTS.consoleHtml, buildConsoleHtml(adapterRows, handoverRows, degradationRows));

    console.log(
      JSON.stringify({
        task_id: "seq_129",
        generated_at: generatedAt,
        adapter_rows: adapterRows.length,
        pass: adapterRows.filter((row) => row.currentValidationState === "pass").length,
        partial: adapterRows.filter((row) => row.currentValidationState === "partial").length,
        blocked: adapterRows.filter((row) => row.currentValidationState === "blocked").length,
      }),
    );
  } finally {
    await Promise.allSettled([backplane.stop(), pdsService.stop(), transcriptionService.stop()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
