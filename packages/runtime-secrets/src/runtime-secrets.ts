import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type EnvironmentRing = "local" | "ci-preview" | "integration" | "preprod" | "production";
export type ServiceEnvironmentName = "local" | "test" | "ci" | "staging" | "production";
export type ServiceName =
  | "api-gateway"
  | "command-api"
  | "projection-worker"
  | "notification-worker"
  | "adapter-simulators";

export interface SecretClassRecord {
  secret_class_ref: string;
  display_name: string;
  purpose: string;
  owning_workload_family_ref: string;
  service_identity_ref: string;
  sensitivity_class: string;
  record_class: string;
  allowed_environment_rings: readonly EnvironmentRing[];
  rotation_policy_ref: string;
  key_branch_ref: string;
  access_policy_ref: string;
  access_state: string;
  break_glass_ready: boolean;
  retrieval_path_template: string;
  browser_exposure: string;
  build_exposure: string;
  log_redaction_policy: string;
  notes: string;
  source_refs: readonly string[];
}

export interface ServiceSecretBinding {
  service_name: ServiceName;
  runtime_workload_family_ref: string;
  service_identity_ref: string;
  access_policy_ref: string;
  reload_mode: "sighup" | "restart";
  secret_refs: readonly string[];
}

export interface CiJobSecretBinding {
  job_ref: string;
  display_name: string;
  owning_workload_family_ref: string;
  access_policy_ref: string;
  secret_refs: readonly string[];
}

export interface SecretClassManifest {
  task_id: string;
  generated_at: string;
  captured_on: string;
  visual_mode: string;
  mission: string;
  summary: Record<string, number | string>;
  source_precedence: readonly string[];
  runtime_topology_manifest_ref: string;
  secret_ownership_map_ref: string;
  secret_classification_matrix_ref: string;
  environment_backends: readonly {
    environment_ring: EnvironmentRing;
    backend_ref: string;
    namespace_id: string;
    kms_root_key_ref: string;
    retrieval_contract_ref: string;
    break_glass_policy_ref: string;
  }[];
  access_policies: readonly {
    access_policy_ref: string;
    actor_ref: string;
    scope_class: string;
    audit_stream_ref: string;
    break_glass_mode: string;
    notes: string;
  }[];
  secret_classes: readonly SecretClassRecord[];
  service_secret_bindings: readonly ServiceSecretBinding[];
  ci_job_bindings: readonly CiJobSecretBinding[];
  assumptions: readonly { assumption_ref: string; value: string; reason: string }[];
  follow_on_dependencies: readonly {
    dependency_ref: string;
    owning_task_ref: string;
    scope: string;
  }[];
}

export interface KeyHierarchyEnvironment {
  environment_ring: EnvironmentRing;
  namespace_id: string;
  kms_root_key_ref: string;
  master_key_state_file_ref: string;
  custody_mode: string;
}

export interface KeyHierarchyBranch {
  key_ref: string;
  parent_key_ref: string;
  environment_scope: string;
  purpose: string;
  custody_mode: string;
  blast_radius_scope: string;
  rotation_policy: string;
  wrap_targets: readonly string[];
}

export interface KeyHierarchyManifest {
  task_id: string;
  generated_at: string;
  captured_on: string;
  visual_mode: string;
  mission: string;
  summary: Record<string, number | string>;
  source_precedence: readonly string[];
  environments: readonly KeyHierarchyEnvironment[];
  root_keys: readonly {
    key_ref: string;
    environment_ring: EnvironmentRing;
    trust_zone_ref: string;
    custody_mode: string;
    source_refs: readonly string[];
  }[];
  branch_keys: readonly KeyHierarchyBranch[];
}

export interface RotationPolicyRow {
  secret_class_ref: string;
  display_name: string;
  environment_scope: string;
  owning_service: string;
  purpose: string;
  rotation_window_days: string;
  maximum_ttl_days: string;
  reload_mode: string;
  stale_action: string;
  revoked_action: string;
  supersession_mode: string;
  access_state: string;
  break_glass_required: string;
}

export interface SecretStoreRecord {
  secret_class_ref: string;
  version_ref: string;
  environment_ring: EnvironmentRing;
  key_branch_ref: string;
  access_state: "active" | "superseded" | "revoked";
  rotate_after: string;
  expires_after: string;
  updated_at: string;
  supersedes_version_ref: string | null;
  nonce_b64: string;
  auth_tag_b64: string;
  ciphertext_b64: string;
  wrapped_dek_nonce_b64: string;
  wrapped_dek_auth_tag_b64: string;
  wrapped_dek_b64: string;
  fingerprint: string;
}

export interface SecretAccessAuditEntry {
  recorded_at: string;
  environment_ring: EnvironmentRing;
  actor_ref: string;
  secret_class_ref: string;
  version_ref: string;
  access_mode: "service_load" | "refresh" | "break_glass" | "rotation" | "revocation";
  break_glass: boolean;
  fingerprint: string;
}

export interface SecretStoreState {
  task_id: string;
  generated_at: string;
  environment_ring: EnvironmentRing;
  namespace_id: string;
  backend_ref: string;
  records: SecretStoreRecord[];
}

export interface LoadedSecret {
  secretClassRef: string;
  versionRef: string;
  value: string;
  fingerprint: string;
  rotateAfter: string;
  expiresAfter: string;
}

export interface BootstrapSecretStoreOptions {
  environmentRing: EnvironmentRing;
  stateDir: string;
  rootDir?: string;
  masterKeyBase64?: string;
  now?: () => Date;
}

export interface BootstrapSecretStoreResult {
  environmentRing: EnvironmentRing;
  stateDir: string;
  namespaceId: string;
  backendRef: string;
  recordCount: number;
  rootKeyRef: string;
  masterKeyPath: string;
}

export interface ServiceSecretBootstrap {
  readonly serviceName: ServiceName;
  readonly environmentRing: EnvironmentRing;
  readonly binding: ServiceSecretBinding;
  assertReady(): readonly LoadedSecret[];
  refresh(): { changedSecretRefs: readonly string[]; versionRefs: readonly string[] };
  redactSummary(): Record<string, unknown>;
}

interface SecretBackendPaths {
  stateDir: string;
  stateFilePath: string;
  auditFilePath: string;
  masterKeyPath: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, "..", "..", "..");
const _SECRET_CLASS_MANIFEST_PATH = path.join(
  DEFAULT_ROOT,
  "data",
  "analysis",
  "secret_class_manifest.json",
);
const _KEY_HIERARCHY_PATH = path.join(
  DEFAULT_ROOT,
  "data",
  "analysis",
  "key_hierarchy_manifest.json",
);
const _ROTATION_MATRIX_PATH = path.join(
  DEFAULT_ROOT,
  "data",
  "analysis",
  "rotation_policy_matrix.csv",
);

function resolveRepoRoot(rootDir?: string): string {
  return rootDir ?? DEFAULT_ROOT;
}

function parseJson<TValue>(filePath: string): TValue {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as TValue;
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (character === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      continue;
    }
    field += character;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  const headers = header ?? [];
  return body.map((values) =>
    Object.fromEntries(headers.map((column, index) => [column, values[index] ?? ""])),
  );
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureDirectory(targetPath: string): void {
  fs.mkdirSync(targetPath, { recursive: true });
}

function isoNow(now: () => Date): string {
  return now().toISOString();
}

function addDays(timestamp: string, days: number): string {
  const value = new Date(timestamp);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}

function stableDigest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function deriveBytes(masterKey: Buffer, label: string, length: number): Buffer {
  return createHmac("sha256", masterKey).update(label).digest().subarray(0, length);
}

function encryptBytes(
  key: Buffer,
  nonce: Buffer,
  payload: Buffer,
  aad: string,
): { ciphertext: Buffer; authTag: Buffer } {
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  return { ciphertext, authTag: cipher.getAuthTag() };
}

function decryptBytes(
  key: Buffer,
  nonce: Buffer,
  ciphertext: Buffer,
  authTag: Buffer,
  aad: string,
): Buffer {
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function encryptRecordWithMasterKey(
  masterKey: Buffer,
  secretClassRef: string,
  keyBranchRef: string,
  versionRef: string,
  value: string,
): {
  nonce_b64: string;
  auth_tag_b64: string;
  ciphertext_b64: string;
  wrapped_dek_nonce_b64: string;
  wrapped_dek_auth_tag_b64: string;
  wrapped_dek_b64: string;
} {
  const dek = deriveBytes(masterKey, `dek:${secretClassRef}:${versionRef}`, 32);
  const wrapKey = deriveBytes(masterKey, `kek:${keyBranchRef}`, 32);
  const wrapNonce = deriveBytes(masterKey, `wrap:${secretClassRef}:${versionRef}`, 12);
  const wrappedDek = encryptBytes(wrapKey, wrapNonce, dek, `${secretClassRef}:${versionRef}:dek`);
  const nonce = deriveBytes(masterKey, `nonce:${secretClassRef}:${versionRef}`, 12);
  const payload = encryptBytes(
    dek,
    nonce,
    Buffer.from(value, "utf8"),
    `${secretClassRef}:${versionRef}`,
  );
  return {
    nonce_b64: nonce.toString("base64"),
    auth_tag_b64: payload.authTag.toString("base64"),
    ciphertext_b64: payload.ciphertext.toString("base64"),
    wrapped_dek_nonce_b64: wrapNonce.toString("base64"),
    wrapped_dek_auth_tag_b64: wrappedDek.authTag.toString("base64"),
    wrapped_dek_b64: wrappedDek.ciphertext.toString("base64"),
  };
}

function secretStorePaths(
  environmentRing: EnvironmentRing,
  env: Record<string, string | undefined>,
  rootDir: string,
): SecretBackendPaths {
  const defaultStateDir = path.join(rootDir, ".tmp", "secret-kms", environmentRing);
  const stateDir = env.VECELLS_SECRET_STATE_DIR ?? defaultStateDir;
  const stateFilePath = path.join(stateDir, "secret-store.json");
  const auditFilePath = path.join(stateDir, "access-audit.jsonl");
  const masterKeyPath = env.VECELLS_KMS_MASTER_KEY_PATH ?? path.join(stateDir, "master-key.json");
  return { stateDir, stateFilePath, auditFilePath, masterKeyPath };
}

function readMasterKey(
  environmentRing: EnvironmentRing,
  env: Record<string, string | undefined>,
  rootDir: string,
): { key: Buffer; filePath: string } {
  const paths = secretStorePaths(environmentRing, env, rootDir);
  if (env.VECELLS_KMS_MASTER_KEY_BASE64) {
    return {
      key: Buffer.from(env.VECELLS_KMS_MASTER_KEY_BASE64, "base64"),
      filePath: paths.masterKeyPath,
    };
  }
  if (!fs.existsSync(paths.masterKeyPath)) {
    throw new SecretAccessError(
      "SECRET_MASTER_KEY_MISSING",
      `Missing master key material at ${paths.masterKeyPath}. Bootstrap the local secret store first.`,
    );
  }
  const payload = parseJson<{ master_key_b64: string }>(paths.masterKeyPath);
  return { key: Buffer.from(payload.master_key_b64, "base64"), filePath: paths.masterKeyPath };
}

function rotationPolicyByRef(rootDir: string): Map<string, RotationPolicyRow> {
  return new Map(loadRotationPolicyRows(rootDir).map((row) => [row.secret_class_ref, row]));
}

function nextVersionRef(existing: readonly SecretStoreRecord[], secretClassRef: string): string {
  const versions = existing
    .filter((row) => row.secret_class_ref === secretClassRef)
    .map((row) => Number(row.version_ref.split("_v").at(-1) ?? "0"))
    .filter((value) => Number.isFinite(value));
  return `${secretClassRef}_v${String(Math.max(0, ...versions) + 1).padStart(2, "0")}`;
}

function createSyntheticPlaintext(
  masterKey: Buffer,
  environmentRing: EnvironmentRing,
  secretClassRef: string,
  versionRef: string,
): string {
  return createHmac("sha256", masterKey)
    .update(`synthetic:${environmentRing}:${secretClassRef}:${versionRef}`)
    .digest("base64url");
}

function newestRecord(
  records: readonly SecretStoreRecord[],
  secretClassRef: string,
): SecretStoreRecord | undefined {
  return [...records]
    .filter((row) => row.secret_class_ref === secretClassRef)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0];
}

export class SecretAccessError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.code = code;
  }
}

export function loadSecretClassManifest(rootDir?: string): SecretClassManifest {
  return parseJson<SecretClassManifest>(
    path.join(resolveRepoRoot(rootDir), "data", "analysis", "secret_class_manifest.json"),
  );
}

export function loadKeyHierarchyManifest(rootDir?: string): KeyHierarchyManifest {
  return parseJson<KeyHierarchyManifest>(
    path.join(resolveRepoRoot(rootDir), "data", "analysis", "key_hierarchy_manifest.json"),
  );
}

export function loadRotationPolicyRows(rootDir?: string): RotationPolicyRow[] {
  return parseCsv(
    fs.readFileSync(
      path.join(resolveRepoRoot(rootDir), "data", "analysis", "rotation_policy_matrix.csv"),
      "utf8",
    ),
  ).map((row) => ({
    secret_class_ref: row.secret_class_ref ?? "",
    display_name: row.display_name ?? "",
    environment_scope: row.environment_scope ?? "",
    owning_service: row.owning_service ?? "",
    purpose: row.purpose ?? "",
    rotation_window_days: row.rotation_window_days ?? "",
    maximum_ttl_days: row.maximum_ttl_days ?? "",
    reload_mode: row.reload_mode ?? "",
    stale_action: row.stale_action ?? "",
    revoked_action: row.revoked_action ?? "",
    supersession_mode: row.supersession_mode ?? "",
    access_state: row.access_state ?? "",
    break_glass_required: row.break_glass_required ?? "",
  }));
}

export function getServiceSecretBinding(
  serviceName: ServiceName,
  rootDir?: string,
): ServiceSecretBinding {
  const binding = loadSecretClassManifest(rootDir).service_secret_bindings.find(
    (row) => row.service_name === serviceName,
  );
  if (!binding) {
    throw new SecretAccessError(
      "SERVICE_SECRET_BINDING_MISSING",
      `Missing secret binding for ${serviceName}.`,
    );
  }
  return binding;
}

export function getCiJobSecretBinding(jobRef: string, rootDir?: string): CiJobSecretBinding {
  const binding = loadSecretClassManifest(rootDir).ci_job_bindings.find(
    (row) => row.job_ref === jobRef,
  );
  if (!binding) {
    throw new SecretAccessError(
      "CI_SECRET_BINDING_MISSING",
      `Missing CI job secret binding for ${jobRef}.`,
    );
  }
  return binding;
}

export function getServiceSecretRefs(
  serviceName: ServiceName,
  rootDir?: string,
): readonly string[] {
  return getServiceSecretBinding(serviceName, rootDir).secret_refs;
}

export function mapServiceEnvironmentToRing(environment: ServiceEnvironmentName): EnvironmentRing {
  switch (environment) {
    case "local":
    case "test":
      return "local";
    case "ci":
      return "ci-preview";
    case "staging":
      return "preprod";
    case "production":
      return "production";
    default:
      return "local";
  }
}

export function readSecretStoreState(
  environmentRing: EnvironmentRing,
  env: Record<string, string | undefined> = process.env,
  rootDir?: string,
): SecretStoreState {
  const repoRoot = resolveRepoRoot(rootDir);
  const paths = secretStorePaths(environmentRing, env, repoRoot);
  if (!fs.existsSync(paths.stateFilePath)) {
    throw new SecretAccessError(
      "SECRET_STORE_STATE_MISSING",
      `Missing secret store state at ${paths.stateFilePath}. Bootstrap the local secret backend first.`,
    );
  }
  return parseJson<SecretStoreState>(paths.stateFilePath);
}

export class FileSecretStoreBackend {
  readonly environmentRing: EnvironmentRing;
  readonly rootDir: string;
  readonly env: Record<string, string | undefined>;
  readonly now: () => Date;

  constructor(options: {
    environmentRing: EnvironmentRing;
    env?: Record<string, string | undefined>;
    rootDir?: string;
    now?: () => Date;
  }) {
    this.environmentRing = options.environmentRing;
    this.rootDir = resolveRepoRoot(options.rootDir);
    this.env = options.env ?? process.env;
    this.now = options.now ?? (() => new Date());
  }

  private paths(): SecretBackendPaths {
    return secretStorePaths(this.environmentRing, this.env, this.rootDir);
  }

  private masterKey(): { key: Buffer; filePath: string } {
    return readMasterKey(this.environmentRing, this.env, this.rootDir);
  }

  private readState(): SecretStoreState {
    return readSecretStoreState(this.environmentRing, this.env, this.rootDir);
  }

  private writeState(state: SecretStoreState): void {
    writeJson(this.paths().stateFilePath, state);
  }

  private writeAudit(entry: SecretAccessAuditEntry): void {
    const paths = this.paths();
    ensureDirectory(paths.stateDir);
    fs.appendFileSync(paths.auditFilePath, `${JSON.stringify(entry)}\n`, "utf8");
  }

  private encryptRecord(
    secretClassRef: string,
    keyBranchRef: string,
    versionRef: string,
    value: string,
  ) {
    const { key: masterKey } = this.masterKey();
    return encryptRecordWithMasterKey(masterKey, secretClassRef, keyBranchRef, versionRef, value);
  }

  private decryptRecord(record: SecretStoreRecord): string {
    const { key: masterKey } = this.masterKey();
    const wrapKey = deriveBytes(masterKey, `kek:${record.key_branch_ref}`, 32);
    const dek = decryptBytes(
      wrapKey,
      Buffer.from(record.wrapped_dek_nonce_b64, "base64"),
      Buffer.from(record.wrapped_dek_b64, "base64"),
      Buffer.from(record.wrapped_dek_auth_tag_b64, "base64"),
      `${record.secret_class_ref}:${record.version_ref}:dek`,
    );
    const plain = decryptBytes(
      dek,
      Buffer.from(record.nonce_b64, "base64"),
      Buffer.from(record.ciphertext_b64, "base64"),
      Buffer.from(record.auth_tag_b64, "base64"),
      `${record.secret_class_ref}:${record.version_ref}`,
    );
    return plain.toString("utf8");
  }

  loadSecret(input: {
    secretClassRef: string;
    actorRef: string;
    accessMode?: SecretAccessAuditEntry["access_mode"];
    breakGlassReason?: string;
  }): LoadedSecret {
    const state = this.readState();
    const record = newestRecord(state.records, input.secretClassRef);
    if (!record) {
      throw new SecretAccessError(
        "SECRET_RECORD_MISSING",
        `Missing secret material for ${input.secretClassRef}.`,
      );
    }
    if (record.access_state === "revoked") {
      throw new SecretAccessError(
        "SECRET_REVOKED",
        `Secret ${input.secretClassRef} is revoked and cannot be loaded.`,
      );
    }
    const now = isoNow(this.now);
    if (now > record.rotate_after) {
      throw new SecretAccessError(
        "SECRET_ROTATION_OVERDUE",
        `Secret ${input.secretClassRef} is overdue for rotation and fails closed.`,
      );
    }
    if (now > record.expires_after) {
      throw new SecretAccessError(
        "SECRET_EXPIRED",
        `Secret ${input.secretClassRef} expired and fails closed.`,
      );
    }
    const value = this.decryptRecord(record);
    this.writeAudit({
      recorded_at: now,
      environment_ring: this.environmentRing,
      actor_ref: input.actorRef,
      secret_class_ref: input.secretClassRef,
      version_ref: record.version_ref,
      access_mode: input.breakGlassReason ? "break_glass" : (input.accessMode ?? "service_load"),
      break_glass: Boolean(input.breakGlassReason),
      fingerprint: record.fingerprint,
    });
    return {
      secretClassRef: record.secret_class_ref,
      versionRef: record.version_ref,
      value,
      fingerprint: record.fingerprint,
      rotateAfter: record.rotate_after,
      expiresAfter: record.expires_after,
    };
  }

  rotateSecret(input: {
    secretClassRef: string;
    actorRef: string;
    plaintext?: string;
  }): SecretStoreRecord {
    const manifest = loadSecretClassManifest(this.rootDir);
    const recordDef = manifest.secret_classes.find(
      (row) => row.secret_class_ref === input.secretClassRef,
    );
    if (!recordDef) {
      throw new SecretAccessError(
        "SECRET_CLASS_UNKNOWN",
        `Unknown secret class ${input.secretClassRef}.`,
      );
    }
    const policies = rotationPolicyByRef(this.rootDir);
    const policy = policies.get(input.secretClassRef);
    if (!policy) {
      throw new SecretAccessError(
        "ROTATION_POLICY_MISSING",
        `Missing rotation policy for ${input.secretClassRef}.`,
      );
    }
    const state = this.readState();
    const previous = newestRecord(state.records, input.secretClassRef);
    if (previous && previous.access_state === "active") {
      previous.access_state = "superseded";
    }
    const versionRef = nextVersionRef(state.records, input.secretClassRef);
    const updatedAt = isoNow(this.now);
    const { key: masterKey } = this.masterKey();
    const plaintext =
      input.plaintext ??
      createSyntheticPlaintext(masterKey, this.environmentRing, input.secretClassRef, versionRef);
    const encrypted = this.encryptRecord(
      input.secretClassRef,
      recordDef.key_branch_ref,
      versionRef,
      plaintext,
    );
    const nextRecord: SecretStoreRecord = {
      secret_class_ref: input.secretClassRef,
      version_ref: versionRef,
      environment_ring: this.environmentRing,
      key_branch_ref: recordDef.key_branch_ref,
      access_state: "active",
      rotate_after: addDays(updatedAt, Number(policy.rotation_window_days)),
      expires_after: addDays(updatedAt, Number(policy.maximum_ttl_days)),
      updated_at: updatedAt,
      supersedes_version_ref: previous?.version_ref ?? null,
      fingerprint: stableDigest(plaintext).slice(0, 16),
      ...encrypted,
    };
    state.records.push(nextRecord);
    state.generated_at = updatedAt;
    this.writeState(state);
    this.writeAudit({
      recorded_at: updatedAt,
      environment_ring: this.environmentRing,
      actor_ref: input.actorRef,
      secret_class_ref: input.secretClassRef,
      version_ref: versionRef,
      access_mode: "rotation",
      break_glass: false,
      fingerprint: nextRecord.fingerprint,
    });
    return nextRecord;
  }

  revokeSecret(input: { secretClassRef: string; actorRef: string }): SecretStoreRecord {
    const state = this.readState();
    const record = newestRecord(state.records, input.secretClassRef);
    if (!record) {
      throw new SecretAccessError(
        "SECRET_RECORD_MISSING",
        `Missing secret material for ${input.secretClassRef}.`,
      );
    }
    record.access_state = "revoked";
    state.generated_at = isoNow(this.now);
    this.writeState(state);
    this.writeAudit({
      recorded_at: state.generated_at,
      environment_ring: this.environmentRing,
      actor_ref: input.actorRef,
      secret_class_ref: input.secretClassRef,
      version_ref: record.version_ref,
      access_mode: "revocation",
      break_glass: false,
      fingerprint: record.fingerprint,
    });
    return record;
  }
}

export function bootstrapSecretStore(
  options: BootstrapSecretStoreOptions,
): BootstrapSecretStoreResult {
  const rootDir = resolveRepoRoot(options.rootDir);
  const manifest = loadSecretClassManifest(rootDir);
  const keys = loadKeyHierarchyManifest(rootDir);
  const policies = rotationPolicyByRef(rootDir);
  const now = options.now ?? (() => new Date());
  ensureDirectory(options.stateDir);

  const environment = manifest.environment_backends.find(
    (row) => row.environment_ring === options.environmentRing,
  );
  const keyEnvironment = keys.environments.find(
    (row) => row.environment_ring === options.environmentRing,
  );
  if (!environment || !keyEnvironment) {
    throw new SecretAccessError(
      "SECRET_ENVIRONMENT_UNSUPPORTED",
      `Missing secret backend or key environment for ${options.environmentRing}.`,
    );
  }

  const masterKey = options.masterKeyBase64
    ? Buffer.from(options.masterKeyBase64, "base64")
    : randomBytes(32);
  const masterKeyPath = path.join(options.stateDir, "master-key.json");
  writeJson(masterKeyPath, {
    environment_ring: options.environmentRing,
    root_key_ref: keyEnvironment.kms_root_key_ref,
    master_key_b64: masterKey.toString("base64"),
  });

  const generatedAt = isoNow(now);
  const records = manifest.secret_classes
    .filter((row) => row.allowed_environment_rings.includes(options.environmentRing))
    .map((row): SecretStoreRecord => {
      const versionRef = `${row.secret_class_ref}_v01`;
      const plaintext = createSyntheticPlaintext(
        masterKey,
        options.environmentRing,
        row.secret_class_ref,
        versionRef,
      );
      const encrypted = encryptRecordWithMasterKey(
        masterKey,
        row.secret_class_ref,
        row.key_branch_ref,
        versionRef,
        plaintext,
      );
      const policy = policies.get(row.secret_class_ref);
      if (!policy) {
        throw new SecretAccessError(
          "ROTATION_POLICY_MISSING",
          `Missing rotation policy for ${row.secret_class_ref}.`,
        );
      }
      return {
        secret_class_ref: row.secret_class_ref,
        version_ref: versionRef,
        environment_ring: options.environmentRing,
        key_branch_ref: row.key_branch_ref,
        access_state: "active",
        rotate_after: addDays(generatedAt, Number(policy.rotation_window_days)),
        expires_after: addDays(generatedAt, Number(policy.maximum_ttl_days)),
        updated_at: generatedAt,
        supersedes_version_ref: null,
        fingerprint: stableDigest(plaintext).slice(0, 16),
        ...encrypted,
      };
    });

  const state: SecretStoreState = {
    task_id: manifest.task_id,
    generated_at: generatedAt,
    environment_ring: options.environmentRing,
    namespace_id: environment.namespace_id,
    backend_ref: environment.backend_ref,
    records,
  };
  writeJson(path.join(options.stateDir, "secret-store.json"), state);
  fs.writeFileSync(path.join(options.stateDir, "access-audit.jsonl"), "", "utf8");

  return {
    environmentRing: options.environmentRing,
    stateDir: options.stateDir,
    namespaceId: environment.namespace_id,
    backendRef: environment.backend_ref,
    recordCount: records.length,
    rootKeyRef: environment.kms_root_key_ref,
    masterKeyPath,
  };
}

export function createServiceSecretBootstrap(options: {
  serviceName: ServiceName;
  serviceEnvironment: ServiceEnvironmentName;
  env?: Record<string, string | undefined>;
  rootDir?: string;
  now?: () => Date;
}): ServiceSecretBootstrap {
  const rootDir = resolveRepoRoot(options.rootDir);
  const binding = getServiceSecretBinding(options.serviceName, rootDir);
  const environmentRing = mapServiceEnvironmentToRing(options.serviceEnvironment);
  const backend = new FileSecretStoreBackend({
    environmentRing,
    env: options.env,
    rootDir,
    now: options.now,
  });
  let loaded = new Map<string, LoadedSecret>();
  return {
    serviceName: options.serviceName,
    environmentRing,
    binding,
    assertReady() {
      loaded = new Map(
        binding.secret_refs.map((secretClassRef) => {
          const secret = backend.loadSecret({
            secretClassRef,
            actorRef: binding.service_identity_ref,
            accessMode: "service_load",
          });
          return [secretClassRef, secret];
        }),
      );
      return [...loaded.values()];
    },
    refresh() {
      const fresh = new Map(
        binding.secret_refs.map((secretClassRef) => {
          const secret = backend.loadSecret({
            secretClassRef,
            actorRef: binding.service_identity_ref,
            accessMode: "refresh",
          });
          return [secretClassRef, secret];
        }),
      );
      const changedSecretRefs = [...fresh.entries()]
        .filter(
          ([secretClassRef, secret]) =>
            loaded.get(secretClassRef)?.versionRef !== secret.versionRef,
        )
        .map(([secretClassRef]) => secretClassRef);
      loaded = fresh;
      return {
        changedSecretRefs,
        versionRefs: [...fresh.values()].map((secret) => secret.versionRef),
      };
    },
    redactSummary() {
      return {
        serviceName: options.serviceName,
        environmentRing,
        accessPolicyRef: binding.access_policy_ref,
        reloadMode: binding.reload_mode,
        secretRefs: [...binding.secret_refs],
        loadedVersionRefs: [...loaded.values()].map((secret) => secret.versionRef),
        loadedFingerprints: [...loaded.values()].map((secret) => secret.fingerprint),
      };
    },
  };
}

export function detectSecretLeakRefs(
  text: string,
  loadedSecrets: readonly LoadedSecret[],
): readonly string[] {
  return loadedSecrets
    .filter((secret) => text.includes(secret.value))
    .map((secret) => secret.secretClassRef);
}
