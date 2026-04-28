import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { IdentityEvidenceVaultPort } from "./auth-bridge";

export const identityEvidenceVaultPersistenceTables = [
  "identity_evidence_envelopes",
  "identity_evidence_ciphertexts",
  "identity_evidence_lookup_tokens",
  "identity_evidence_access_audit",
  "identity_evidence_key_versions",
] as const;

export const identityEvidenceVaultMigrationPlanRefs = [
  "services/command-api/migrations/092_phase2_identity_evidence_vault.sql",
] as const;

export const identityEvidenceVaultParallelInterfaceGaps = [
  "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_ENCRYPTED_APPEND_ONLY_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_MASKING_HELPERS_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_ACCESS_AUDIT_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_TELEPHONY_NAMESPACE_V1",
  "PARALLEL_INTERFACE_GAP_PHASE2_EVIDENCE_LOOKUP_TOKENIZATION_V1",
] as const;

export const IDENTITY_EVIDENCE_SCHEMA_VERSION = "170.phase2.trust.v1";
export const IDENTITY_EVIDENCE_POLICY_VERSION = "phase2-trust-v1";
export const IDENTITY_EVIDENCE_ENCRYPTION_ALGORITHM = "AES-256-GCM";

export type IdentityEvidenceNamespace =
  | "auth_claim"
  | "userinfo_claim"
  | "phone_number"
  | "caller_identifier"
  | "handset_proof"
  | "match_evidence"
  | "telephony_capture"
  | "repair_signal";
export type IdentityEvidenceKind =
  | "nhs_login_claim_digest"
  | "sms_seed_digest"
  | "secure_link_digest"
  | "telephony_capture_digest"
  | "staff_assertion_digest"
  | "system_repair_signal";
export type IdentityEvidenceSourceChannel =
  | "web"
  | "nhs_login"
  | "sms"
  | "secure_link"
  | "ivr"
  | "staff"
  | "system";
export type IdentityEvidenceDisclosureClass =
  | "vault_internal"
  | "masked_operational"
  | "support_redacted"
  | "audit_only";
export type IdentityEvidenceRetentionClass =
  | "identity_binding_evidence"
  | "continuation_seed"
  | "repair_signal"
  | "audit_worm";
export type IdentityEvidenceConfidenceHint =
  | "none"
  | "seeded"
  | "asserted"
  | "verified"
  | "manual_review";
export type IdentityEvidenceAuditAccessType =
  | "write"
  | "read_raw"
  | "read_masked"
  | "lookup"
  | "deny";
export type IdentityEvidenceAuditDecision = "allow" | "deny";

export interface IdentityEvidenceMaskedDisplay {
  readonly label: string;
  readonly maskedContact: string;
  readonly confidenceHint: IdentityEvidenceConfidenceHint;
}

export interface IdentityEvidenceEnvelope {
  readonly identityEvidenceEnvelopeId: string;
  readonly schemaVersion: typeof IDENTITY_EVIDENCE_SCHEMA_VERSION;
  readonly policyVersion: typeof IDENTITY_EVIDENCE_POLICY_VERSION;
  readonly vaultRef: string;
  readonly evidenceNamespace: IdentityEvidenceNamespace;
  readonly evidenceKind: IdentityEvidenceKind;
  readonly sourceChannel: IdentityEvidenceSourceChannel;
  readonly subjectRef: string;
  readonly claimDigest: string;
  readonly maskedDisplay: IdentityEvidenceMaskedDisplay;
  readonly keyVersionRef: string;
  readonly appendOnlySequence: number;
  readonly previousEnvelopeRef: string | null;
  readonly disclosureClass: IdentityEvidenceDisclosureClass;
  readonly retentionClass: IdentityEvidenceRetentionClass;
  readonly destructionEligibleAt: string | null;
  readonly provenanceRef: string;
  readonly createdAt: string;
  readonly createdByAuthority: "IdentityEvidenceVault";
}

export interface IdentityEvidenceCiphertext {
  readonly vaultRef: string;
  readonly envelopeRef: string;
  readonly algorithm: typeof IDENTITY_EVIDENCE_ENCRYPTION_ALGORITHM;
  readonly keyVersionRef: string;
  readonly encryptedDataKey: string;
  readonly dataKeyIv: string;
  readonly dataKeyAuthTag: string;
  readonly payloadIv: string;
  readonly payloadAuthTag: string;
  readonly ciphertext: string;
  readonly aadDigest: string;
  readonly createdAt: string;
}

export interface IdentityEvidenceLookupToken {
  readonly lookupTokenId: string;
  readonly evidenceNamespace: IdentityEvidenceNamespace;
  readonly tokenHash: string;
  readonly envelopeRef: string;
  readonly createdAt: string;
}

export interface IdentityEvidenceAccessAuditRecord {
  readonly accessAuditId: string;
  readonly envelopeRef: string | null;
  readonly actorRef: string;
  readonly purpose: string;
  readonly accessType: IdentityEvidenceAuditAccessType;
  readonly decision: IdentityEvidenceAuditDecision;
  readonly reasonCodes: readonly string[];
  readonly recordedAt: string;
}

export interface IdentityEvidenceLocator {
  readonly evidenceEnvelopeRef: string;
  readonly vaultRef: string;
  readonly claimDigest: string;
  readonly keyVersionRef: string;
  readonly evidenceNamespace: IdentityEvidenceNamespace;
  readonly retentionClass: IdentityEvidenceRetentionClass;
  readonly disclosureClass: IdentityEvidenceDisclosureClass;
  readonly maskedDisplay: IdentityEvidenceMaskedDisplay;
}

export interface WriteIdentityEvidenceInput {
  readonly evidenceNamespace: IdentityEvidenceNamespace;
  readonly sourceChannel: IdentityEvidenceSourceChannel;
  readonly subjectRef: string;
  readonly rawEvidence: unknown;
  readonly actorRef: string;
  readonly purpose: string;
  readonly provenanceRef: string;
  readonly label?: string;
  readonly disclosureClass?: IdentityEvidenceDisclosureClass;
  readonly retentionClass?: IdentityEvidenceRetentionClass;
  readonly lookupValues?: readonly string[];
  readonly previousEnvelopeRef?: string | null;
  readonly createdAt?: string;
  readonly destructionEligibleAt?: string | null;
}

export interface WriteIdentityEvidenceResult {
  readonly envelope: IdentityEvidenceEnvelope;
  readonly locator: IdentityEvidenceLocator;
  readonly lookupTokens: readonly IdentityEvidenceLookupToken[];
  readonly audit: IdentityEvidenceAccessAuditRecord;
}

export interface ReadIdentityEvidenceInput {
  readonly evidenceEnvelopeRef: string;
  readonly actorRef: string;
  readonly purpose: string;
  readonly requestedView: "masked" | "raw";
  readonly privileged?: boolean;
  readonly observedAt?: string;
}

export interface ReadIdentityEvidenceResult {
  readonly decision: IdentityEvidenceAuditDecision;
  readonly envelope: IdentityEvidenceEnvelope | null;
  readonly maskedDisplay: IdentityEvidenceMaskedDisplay | null;
  readonly rawEvidence: unknown;
  readonly audit: IdentityEvidenceAccessAuditRecord;
  readonly reasonCodes: readonly string[];
}

export interface LookupIdentityEvidenceInput {
  readonly evidenceNamespace: IdentityEvidenceNamespace;
  readonly rawLookupValue: string;
  readonly actorRef: string;
  readonly purpose: string;
  readonly observedAt?: string;
}

export interface LookupIdentityEvidenceResult {
  readonly lookupTokenHash: string;
  readonly locators: readonly IdentityEvidenceLocator[];
  readonly audit: IdentityEvidenceAccessAuditRecord;
}

export interface IdentityEvidenceVaultRepository {
  nextAppendOnlySequence(): Promise<number>;
  saveEnvelope(envelope: IdentityEvidenceEnvelope): Promise<void>;
  saveCiphertext(ciphertext: IdentityEvidenceCiphertext): Promise<void>;
  getEnvelope(envelopeRef: string): Promise<IdentityEvidenceEnvelope | undefined>;
  getCiphertext(vaultRef: string): Promise<IdentityEvidenceCiphertext | undefined>;
  saveLookupToken(token: IdentityEvidenceLookupToken): Promise<void>;
  findLookupTokens(
    evidenceNamespace: IdentityEvidenceNamespace,
    tokenHash: string,
  ): Promise<readonly IdentityEvidenceLookupToken[]>;
  appendAudit(record: IdentityEvidenceAccessAuditRecord): Promise<void>;
  saveKeyVersion(record: IdentityEvidenceKeyVersionRecord): Promise<void>;
}

export interface IdentityEvidenceKeyVersionRecord {
  readonly keyVersionRef: string;
  readonly algorithm: typeof IDENTITY_EVIDENCE_ENCRYPTION_ALGORITHM;
  readonly keyPurpose: "identity_evidence_kek";
  readonly state: "active" | "retired";
  readonly createdAt: string;
  readonly retiredAt: string | null;
}

export interface WrappedEvidenceDataKey {
  readonly keyVersionRef: string;
  readonly encryptedDataKey: string;
  readonly dataKeyIv: string;
  readonly dataKeyAuthTag: string;
}

export interface IdentityEvidenceKeyManager {
  getActiveKeyVersion(): Promise<IdentityEvidenceKeyVersionRecord>;
  wrapDataKey(dataKey: Buffer, aad: Buffer, createdAt: string): Promise<WrappedEvidenceDataKey>;
  unwrapDataKey(wrapped: WrappedEvidenceDataKey, aad: Buffer): Promise<Buffer>;
  rotateActiveKey?(rotatedAt?: string): Promise<IdentityEvidenceKeyVersionRecord>;
}

export interface EncryptedPayload {
  readonly keyVersionRef: string;
  readonly encryptedDataKey: string;
  readonly dataKeyIv: string;
  readonly dataKeyAuthTag: string;
  readonly payloadIv: string;
  readonly payloadAuthTag: string;
  readonly ciphertext: string;
}

export interface IdentityEvidenceVaultService {
  writeEvidence(input: WriteIdentityEvidenceInput): Promise<WriteIdentityEvidenceResult>;
  readEvidence(input: ReadIdentityEvidenceInput): Promise<ReadIdentityEvidenceResult>;
  lookupEvidence(input: LookupIdentityEvidenceInput): Promise<LookupIdentityEvidenceResult>;
  redactEvidenceForTelemetry(value: unknown): unknown;
  detectEvidenceLeak(value: unknown): boolean;
}

export interface IdentityEvidenceVaultApplication {
  readonly evidenceVault: IdentityEvidenceVaultService;
  readonly repositories: IdentityEvidenceVaultRepository;
  readonly keyManager: IdentityEvidenceKeyManager;
  readonly migrationPlanRef: (typeof identityEvidenceVaultMigrationPlanRefs)[number];
  readonly migrationPlanRefs: typeof identityEvidenceVaultMigrationPlanRefs;
  readonly persistenceTables: typeof identityEvidenceVaultPersistenceTables;
  readonly parallelInterfaceGaps: typeof identityEvidenceVaultParallelInterfaceGaps;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addYears(isoTimestamp: string, years: number): string {
  const date = new Date(isoTimestamp);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString();
}

function toBase64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, stableValue(record[key])]),
    );
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function digestRawEvidence(rawEvidence: unknown): string {
  return `sha256:${sha256(`identity-evidence:${stableJson(rawEvidence)}`)}`;
}

function lookupHash(namespace: IdentityEvidenceNamespace, rawLookupValue: string): string {
  return `sha256:${sha256(`${namespace}:${rawLookupValue.trim().toLowerCase()}`)}`;
}

function deterministicId(prefix: string, value: string): string {
  return `${prefix}_${sha256(`${prefix}:${value}`).slice(0, 24)}`;
}

function evidenceKindForNamespace(namespace: IdentityEvidenceNamespace): IdentityEvidenceKind {
  const map: Record<IdentityEvidenceNamespace, IdentityEvidenceKind> = {
    auth_claim: "nhs_login_claim_digest",
    userinfo_claim: "nhs_login_claim_digest",
    phone_number: "sms_seed_digest",
    caller_identifier: "telephony_capture_digest",
    handset_proof: "secure_link_digest",
    match_evidence: "staff_assertion_digest",
    telephony_capture: "telephony_capture_digest",
    repair_signal: "system_repair_signal",
  };
  return map[namespace];
}

function defaultRetentionForNamespace(
  namespace: IdentityEvidenceNamespace,
): IdentityEvidenceRetentionClass {
  if (
    namespace === "phone_number" ||
    namespace === "caller_identifier" ||
    namespace === "handset_proof"
  ) {
    return "continuation_seed";
  }
  if (namespace === "repair_signal") {
    return "repair_signal";
  }
  if (namespace === "telephony_capture") {
    return "audit_worm";
  }
  return "identity_binding_evidence";
}

function defaultDisclosureForNamespace(
  namespace: IdentityEvidenceNamespace,
): IdentityEvidenceDisclosureClass {
  if (namespace === "telephony_capture" || namespace === "match_evidence") {
    return "audit_only";
  }
  return "masked_operational";
}

function confidenceForNamespace(
  namespace: IdentityEvidenceNamespace,
): IdentityEvidenceConfidenceHint {
  if (namespace === "auth_claim" || namespace === "userinfo_claim") {
    return "verified";
  }
  if (namespace === "phone_number" || namespace === "caller_identifier") {
    return "seeded";
  }
  if (namespace === "handset_proof") {
    return "asserted";
  }
  if (namespace === "match_evidence" || namespace === "telephony_capture") {
    return "manual_review";
  }
  return "none";
}

function maskEmail(value: string): string {
  const [local, domain] = value.split("@");
  if (!local || !domain) {
    return "[masked-email]";
  }
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(3, local.length - 1))}@${domain}`;
}

function maskDigits(value: string): string {
  const digits = value.replace(/\D/gu, "");
  if (digits.length <= 4) {
    return "****";
  }
  const prefix = value.trim().startsWith("+") ? `+${digits.slice(0, 2)}` : "";
  const last = digits.slice(-4);
  const hiddenLength = Math.max(4, digits.length - (prefix ? 2 : 0) - 4);
  return `${prefix}${"*".repeat(hiddenLength)}${last}`;
}

function extractStringValue(rawEvidence: unknown, keys: readonly string[]): string | null {
  if (typeof rawEvidence === "string") {
    return rawEvidence;
  }
  if (!rawEvidence || typeof rawEvidence !== "object") {
    return null;
  }
  const record = rawEvidence as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

function maskedDisplayForEvidence(input: {
  readonly namespace: IdentityEvidenceNamespace;
  readonly rawEvidence: unknown;
  readonly label?: string;
}): IdentityEvidenceMaskedDisplay {
  const namespace = input.namespace;
  const label =
    input.label ??
    (
      {
        auth_claim: "NHS login claim",
        userinfo_claim: "NHS login userinfo",
        phone_number: "Phone number",
        caller_identifier: "Caller identifier",
        handset_proof: "Handset proof",
        match_evidence: "Match evidence",
        telephony_capture: "Telephony capture",
        repair_signal: "Repair signal",
      } satisfies Record<IdentityEvidenceNamespace, string>
    )[namespace];
  const candidate = extractStringValue(input.rawEvidence, [
    "phoneNumber",
    "callerId",
    "email",
    "nhsNumber",
    "sub",
    "subjectRef",
    "handsetProof",
    "value",
  ]);
  let maskedContact = "[vault-ref-only]";
  if (candidate) {
    if (candidate.includes("@")) {
      maskedContact = maskEmail(candidate);
    } else if (/\d{4,}/u.test(candidate)) {
      maskedContact = maskDigits(candidate);
    } else {
      maskedContact = `${candidate.slice(0, 4)}...${candidate.slice(-2)}`;
    }
  }
  return Object.freeze({
    label,
    maskedContact,
    confidenceHint: confidenceForNamespace(namespace),
  });
}

function createEnvelope(input: {
  readonly sequence: number;
  readonly vaultRef: string;
  readonly namespace: IdentityEvidenceNamespace;
  readonly sourceChannel: IdentityEvidenceSourceChannel;
  readonly subjectRef: string;
  readonly claimDigest: string;
  readonly maskedDisplay: IdentityEvidenceMaskedDisplay;
  readonly keyVersionRef: string;
  readonly previousEnvelopeRef: string | null;
  readonly disclosureClass: IdentityEvidenceDisclosureClass;
  readonly retentionClass: IdentityEvidenceRetentionClass;
  readonly destructionEligibleAt: string | null;
  readonly provenanceRef: string;
  readonly createdAt: string;
}): IdentityEvidenceEnvelope {
  return Object.freeze({
    identityEvidenceEnvelopeId: deterministicId(
      "iev",
      `${input.subjectRef}:${input.claimDigest}:${input.sequence}`,
    ),
    schemaVersion: IDENTITY_EVIDENCE_SCHEMA_VERSION,
    policyVersion: IDENTITY_EVIDENCE_POLICY_VERSION,
    vaultRef: input.vaultRef,
    evidenceNamespace: input.namespace,
    evidenceKind: evidenceKindForNamespace(input.namespace),
    sourceChannel: input.sourceChannel,
    subjectRef: input.subjectRef,
    claimDigest: input.claimDigest,
    maskedDisplay: input.maskedDisplay,
    keyVersionRef: input.keyVersionRef,
    appendOnlySequence: input.sequence,
    previousEnvelopeRef: input.previousEnvelopeRef,
    disclosureClass: input.disclosureClass,
    retentionClass: input.retentionClass,
    destructionEligibleAt: input.destructionEligibleAt,
    provenanceRef: input.provenanceRef,
    createdAt: input.createdAt,
    createdByAuthority: "IdentityEvidenceVault",
  });
}

function createAudit(input: {
  readonly envelopeRef: string | null;
  readonly actorRef: string;
  readonly purpose: string;
  readonly accessType: IdentityEvidenceAuditAccessType;
  readonly decision: IdentityEvidenceAuditDecision;
  readonly reasonCodes: readonly string[];
  readonly recordedAt: string;
}): IdentityEvidenceAccessAuditRecord {
  return Object.freeze({
    accessAuditId: deterministicId(
      "iea",
      `${input.envelopeRef ?? "none"}:${input.actorRef}:${input.accessType}:${input.recordedAt}:${input.reasonCodes.join("|")}`,
    ),
    envelopeRef: input.envelopeRef,
    actorRef: input.actorRef,
    purpose: input.purpose,
    accessType: input.accessType,
    decision: input.decision,
    reasonCodes: Object.freeze([...input.reasonCodes]),
    recordedAt: input.recordedAt,
  });
}

function locatorFromEnvelope(envelope: IdentityEvidenceEnvelope): IdentityEvidenceLocator {
  return Object.freeze({
    evidenceEnvelopeRef: envelope.identityEvidenceEnvelopeId,
    vaultRef: envelope.vaultRef,
    claimDigest: envelope.claimDigest,
    keyVersionRef: envelope.keyVersionRef,
    evidenceNamespace: envelope.evidenceNamespace,
    retentionClass: envelope.retentionClass,
    disclosureClass: envelope.disclosureClass,
    maskedDisplay: envelope.maskedDisplay,
  });
}

function cloneEnvelope(envelope: IdentityEvidenceEnvelope): IdentityEvidenceEnvelope {
  return Object.freeze({
    ...envelope,
    maskedDisplay: Object.freeze({ ...envelope.maskedDisplay }),
  });
}

function cloneCiphertext(ciphertext: IdentityEvidenceCiphertext): IdentityEvidenceCiphertext {
  return Object.freeze({ ...ciphertext });
}

function cloneLookupToken(token: IdentityEvidenceLookupToken): IdentityEvidenceLookupToken {
  return Object.freeze({ ...token });
}

function cloneAudit(record: IdentityEvidenceAccessAuditRecord): IdentityEvidenceAccessAuditRecord {
  return Object.freeze({
    ...record,
    reasonCodes: Object.freeze([...record.reasonCodes]),
  });
}

function cloneKeyVersion(
  record: IdentityEvidenceKeyVersionRecord,
): IdentityEvidenceKeyVersionRecord {
  return Object.freeze({ ...record });
}

function privilegedRawReadAllowed(purpose: string, privileged: boolean | undefined): boolean {
  if (!privileged) {
    return false;
  }
  return new Set([
    "identity_binding_authority",
    "patient_linker",
    "telephony_readiness",
    "security_audit",
    "break_glass_audit",
  ]).has(purpose);
}

function isSensitiveKey(key: string): boolean {
  return /(raw|claim|token|phone|caller|identifier|nhs|number|email|secret|proof|cookie|csrf)/iu.test(
    key,
  );
}

function redactEvidenceForTelemetryValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactEvidenceForTelemetryValue);
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      output[key] = isSensitiveKey(key)
        ? "[IDENTITY_EVIDENCE_REDACTED]"
        : redactEvidenceForTelemetryValue(nested);
    }
    return Object.freeze(output);
  }
  if (typeof value === "string") {
    if (/\+?\d[\d\s().-]{7,}\d/u.test(value) || /[^\s@]+@[^\s@]+\.[^\s@]+/u.test(value)) {
      return "[IDENTITY_EVIDENCE_REDACTED]";
    }
  }
  return value;
}

function detectEvidenceLeakValue(value: unknown): boolean {
  const serialized = stableJson(value);
  return /\+?\d[\d\s().-]{7,}\d/u.test(serialized) || /[^\s@]+@[^\s@]+\.[^\s@]+/u.test(serialized);
}

export function createSimulatorIdentityEvidenceKeyManager(options?: {
  readonly initialKeyVersionRef?: string;
  readonly createdAt?: string;
}): IdentityEvidenceKeyManager & {
  readonly snapshots: () => {
    readonly keyVersions: readonly IdentityEvidenceKeyVersionRecord[];
  };
} {
  const createdAt = options?.createdAt ?? nowIso();
  const initialKeyVersionRef =
    options?.initialKeyVersionRef ?? "identity_evidence_kek_simulator_v1";
  const keyMaterial = new Map<string, Buffer>([[initialKeyVersionRef, randomBytes(32)]]);
  const keyVersions = new Map<string, IdentityEvidenceKeyVersionRecord>([
    [
      initialKeyVersionRef,
      {
        keyVersionRef: initialKeyVersionRef,
        algorithm: IDENTITY_EVIDENCE_ENCRYPTION_ALGORITHM,
        keyPurpose: "identity_evidence_kek",
        state: "active",
        createdAt,
        retiredAt: null,
      },
    ],
  ]);
  let activeKeyVersionRef = initialKeyVersionRef;

  return {
    async getActiveKeyVersion() {
      const record = keyVersions.get(activeKeyVersionRef);
      if (!record) {
        throw new Error("IDENTITY_EVIDENCE_ACTIVE_KEY_MISSING");
      }
      return cloneKeyVersion(record);
    },
    async wrapDataKey(dataKey, aad, _createdAtForWrap) {
      const key = keyMaterial.get(activeKeyVersionRef);
      if (!key) {
        throw new Error("IDENTITY_EVIDENCE_ACTIVE_KEY_MATERIAL_MISSING");
      }
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      cipher.setAAD(aad);
      const encrypted = Buffer.concat([cipher.update(dataKey), cipher.final()]);
      return Object.freeze({
        keyVersionRef: activeKeyVersionRef,
        encryptedDataKey: toBase64Url(encrypted),
        dataKeyIv: toBase64Url(iv),
        dataKeyAuthTag: toBase64Url(cipher.getAuthTag()),
      });
    },
    async unwrapDataKey(wrapped, aad) {
      const key = keyMaterial.get(wrapped.keyVersionRef);
      if (!key) {
        throw new Error("IDENTITY_EVIDENCE_KEY_MATERIAL_MISSING");
      }
      const decipher = createDecipheriv("aes-256-gcm", key, fromBase64Url(wrapped.dataKeyIv));
      decipher.setAAD(aad);
      decipher.setAuthTag(fromBase64Url(wrapped.dataKeyAuthTag));
      return Buffer.concat([
        decipher.update(fromBase64Url(wrapped.encryptedDataKey)),
        decipher.final(),
      ]);
    },
    async rotateActiveKey(rotatedAt = nowIso()) {
      const existing = keyVersions.get(activeKeyVersionRef);
      if (existing) {
        keyVersions.set(activeKeyVersionRef, {
          ...existing,
          state: "retired",
          retiredAt: rotatedAt,
        });
      }
      activeKeyVersionRef = `identity_evidence_kek_simulator_${keyVersions.size + 1}`;
      keyMaterial.set(activeKeyVersionRef, randomBytes(32));
      const next: IdentityEvidenceKeyVersionRecord = {
        keyVersionRef: activeKeyVersionRef,
        algorithm: IDENTITY_EVIDENCE_ENCRYPTION_ALGORITHM,
        keyPurpose: "identity_evidence_kek",
        state: "active",
        createdAt: rotatedAt,
        retiredAt: null,
      };
      keyVersions.set(activeKeyVersionRef, next);
      return cloneKeyVersion(next);
    },
    snapshots() {
      return Object.freeze({
        keyVersions: Object.freeze([...keyVersions.values()].map(cloneKeyVersion)),
      });
    },
  };
}

async function encryptEvidencePayload(input: {
  readonly keyManager: IdentityEvidenceKeyManager;
  readonly plaintext: string;
  readonly aad: Buffer;
  readonly createdAt: string;
}): Promise<EncryptedPayload> {
  const dataKey = randomBytes(32);
  const payloadIv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", dataKey, payloadIv);
  cipher.setAAD(input.aad);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(input.plaintext, "utf8")),
    cipher.final(),
  ]);
  const wrapped = await input.keyManager.wrapDataKey(dataKey, input.aad, input.createdAt);
  dataKey.fill(0);
  return Object.freeze({
    keyVersionRef: wrapped.keyVersionRef,
    encryptedDataKey: wrapped.encryptedDataKey,
    dataKeyIv: wrapped.dataKeyIv,
    dataKeyAuthTag: wrapped.dataKeyAuthTag,
    payloadIv: toBase64Url(payloadIv),
    payloadAuthTag: toBase64Url(cipher.getAuthTag()),
    ciphertext: toBase64Url(ciphertext),
  });
}

async function decryptEvidencePayload(input: {
  readonly keyManager: IdentityEvidenceKeyManager;
  readonly ciphertext: IdentityEvidenceCiphertext;
  readonly aad: Buffer;
}): Promise<unknown> {
  const dataKey = await input.keyManager.unwrapDataKey(
    {
      keyVersionRef: input.ciphertext.keyVersionRef,
      encryptedDataKey: input.ciphertext.encryptedDataKey,
      dataKeyIv: input.ciphertext.dataKeyIv,
      dataKeyAuthTag: input.ciphertext.dataKeyAuthTag,
    },
    input.aad,
  );
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      dataKey,
      fromBase64Url(input.ciphertext.payloadIv),
    );
    decipher.setAAD(input.aad);
    decipher.setAuthTag(fromBase64Url(input.ciphertext.payloadAuthTag));
    const plaintext = Buffer.concat([
      decipher.update(fromBase64Url(input.ciphertext.ciphertext)),
      decipher.final(),
    ]).toString("utf8");
    return JSON.parse(plaintext) as unknown;
  } finally {
    dataKey.fill(0);
  }
}

export function createInMemoryIdentityEvidenceVaultRepository(): IdentityEvidenceVaultRepository & {
  readonly snapshots: () => {
    readonly envelopes: readonly IdentityEvidenceEnvelope[];
    readonly ciphertexts: readonly IdentityEvidenceCiphertext[];
    readonly lookupTokens: readonly IdentityEvidenceLookupToken[];
    readonly accessAudit: readonly IdentityEvidenceAccessAuditRecord[];
    readonly keyVersions: readonly IdentityEvidenceKeyVersionRecord[];
  };
} {
  let sequence = 0;
  const envelopes = new Map<string, IdentityEvidenceEnvelope>();
  const ciphertexts = new Map<string, IdentityEvidenceCiphertext>();
  const lookupTokens = new Map<string, IdentityEvidenceLookupToken[]>();
  const accessAudit: IdentityEvidenceAccessAuditRecord[] = [];
  const keyVersions = new Map<string, IdentityEvidenceKeyVersionRecord>();

  return {
    async nextAppendOnlySequence() {
      sequence += 1;
      return sequence;
    },
    async saveEnvelope(envelope) {
      if (envelopes.has(envelope.identityEvidenceEnvelopeId)) {
        throw new Error("IDENTITY_EVIDENCE_APPEND_ONLY_VIOLATION");
      }
      envelopes.set(envelope.identityEvidenceEnvelopeId, cloneEnvelope(envelope));
    },
    async saveCiphertext(ciphertext) {
      if (ciphertexts.has(ciphertext.vaultRef)) {
        throw new Error("IDENTITY_EVIDENCE_CIPHERTEXT_APPEND_ONLY_VIOLATION");
      }
      ciphertexts.set(ciphertext.vaultRef, cloneCiphertext(ciphertext));
    },
    async getEnvelope(envelopeRef) {
      const envelope = envelopes.get(envelopeRef);
      return envelope ? cloneEnvelope(envelope) : undefined;
    },
    async getCiphertext(vaultRef) {
      const ciphertext = ciphertexts.get(vaultRef);
      return ciphertext ? cloneCiphertext(ciphertext) : undefined;
    },
    async saveLookupToken(token) {
      const key = `${token.evidenceNamespace}:${token.tokenHash}`;
      const current = lookupTokens.get(key) ?? [];
      lookupTokens.set(key, [...current, cloneLookupToken(token)]);
    },
    async findLookupTokens(evidenceNamespace, tokenHash) {
      return Object.freeze(
        (lookupTokens.get(`${evidenceNamespace}:${tokenHash}`) ?? []).map(cloneLookupToken),
      );
    },
    async appendAudit(record) {
      accessAudit.push(cloneAudit(record));
    },
    async saveKeyVersion(record) {
      keyVersions.set(record.keyVersionRef, cloneKeyVersion(record));
    },
    snapshots() {
      return Object.freeze({
        envelopes: Object.freeze([...envelopes.values()].map(cloneEnvelope)),
        ciphertexts: Object.freeze([...ciphertexts.values()].map(cloneCiphertext)),
        lookupTokens: Object.freeze([...lookupTokens.values()].flat().map(cloneLookupToken)),
        accessAudit: Object.freeze(accessAudit.map(cloneAudit)),
        keyVersions: Object.freeze([...keyVersions.values()].map(cloneKeyVersion)),
      });
    },
  };
}

export function createIdentityEvidenceVaultService(options: {
  readonly repository: IdentityEvidenceVaultRepository;
  readonly keyManager: IdentityEvidenceKeyManager;
}): IdentityEvidenceVaultService {
  const repository = options.repository;
  const keyManager = options.keyManager;

  async function appendAudit(
    record: IdentityEvidenceAccessAuditRecord,
  ): Promise<IdentityEvidenceAccessAuditRecord> {
    await repository.appendAudit(record);
    return record;
  }

  return {
    async writeEvidence(input) {
      const createdAt = input.createdAt ?? nowIso();
      const activeKey = await keyManager.getActiveKeyVersion();
      await repository.saveKeyVersion(activeKey);
      const sequence = await repository.nextAppendOnlySequence();
      const claimDigest = digestRawEvidence(input.rawEvidence);
      const vaultRef = `vault_identity_evidence_${randomUUID().replace(/-/g, "")}`;
      const aad = Buffer.from(
        stableJson({
          vaultRef,
          namespace: input.evidenceNamespace,
          subjectRef: input.subjectRef,
          claimDigest,
          policyVersion: IDENTITY_EVIDENCE_POLICY_VERSION,
        }),
      );
      const encrypted = await encryptEvidencePayload({
        keyManager,
        plaintext: stableJson(input.rawEvidence),
        aad,
        createdAt,
      });
      if (encrypted.keyVersionRef !== activeKey.keyVersionRef) {
        throw new Error("IDENTITY_EVIDENCE_KEY_VERSION_DRIFT");
      }
      const maskedDisplay = maskedDisplayForEvidence({
        namespace: input.evidenceNamespace,
        rawEvidence: input.rawEvidence,
        label: input.label,
      });
      const retentionClass =
        input.retentionClass ?? defaultRetentionForNamespace(input.evidenceNamespace);
      const envelope = createEnvelope({
        sequence,
        vaultRef,
        namespace: input.evidenceNamespace,
        sourceChannel: input.sourceChannel,
        subjectRef: input.subjectRef,
        claimDigest,
        maskedDisplay,
        keyVersionRef: encrypted.keyVersionRef,
        previousEnvelopeRef: input.previousEnvelopeRef ?? null,
        disclosureClass:
          input.disclosureClass ?? defaultDisclosureForNamespace(input.evidenceNamespace),
        retentionClass,
        destructionEligibleAt: input.destructionEligibleAt ?? addYears(createdAt, 8),
        provenanceRef: input.provenanceRef,
        createdAt,
      });
      const ciphertext: IdentityEvidenceCiphertext = Object.freeze({
        vaultRef,
        envelopeRef: envelope.identityEvidenceEnvelopeId,
        algorithm: IDENTITY_EVIDENCE_ENCRYPTION_ALGORITHM,
        keyVersionRef: encrypted.keyVersionRef,
        encryptedDataKey: encrypted.encryptedDataKey,
        dataKeyIv: encrypted.dataKeyIv,
        dataKeyAuthTag: encrypted.dataKeyAuthTag,
        payloadIv: encrypted.payloadIv,
        payloadAuthTag: encrypted.payloadAuthTag,
        ciphertext: encrypted.ciphertext,
        aadDigest: `sha256:${sha256(aad)}`,
        createdAt,
      });
      await repository.saveEnvelope(envelope);
      await repository.saveCiphertext(ciphertext);
      const lookupValues = input.lookupValues ?? [];
      const lookupTokens: IdentityEvidenceLookupToken[] = [];
      for (const rawLookupValue of lookupValues) {
        const tokenHash = lookupHash(input.evidenceNamespace, rawLookupValue);
        const token = Object.freeze({
          lookupTokenId: deterministicId(
            "iel",
            `${input.evidenceNamespace}:${tokenHash}:${envelope.identityEvidenceEnvelopeId}`,
          ),
          evidenceNamespace: input.evidenceNamespace,
          tokenHash,
          envelopeRef: envelope.identityEvidenceEnvelopeId,
          createdAt,
        });
        lookupTokens.push(token);
        await repository.saveLookupToken(token);
      }
      const audit = await appendAudit(
        createAudit({
          envelopeRef: envelope.identityEvidenceEnvelopeId,
          actorRef: input.actorRef,
          purpose: input.purpose,
          accessType: "write",
          decision: "allow",
          reasonCodes: [
            "EVIDENCE_177_WRITE_APPEND_ONLY",
            "EVIDENCE_177_ENVELOPE_ENCRYPTED",
            "EVIDENCE_177_MASKED_LOCATOR_ONLY",
          ],
          recordedAt: createdAt,
        }),
      );
      return Object.freeze({
        envelope,
        locator: locatorFromEnvelope(envelope),
        lookupTokens: Object.freeze(lookupTokens.map(cloneLookupToken)),
        audit,
      });
    },
    async readEvidence(input) {
      const observedAt = input.observedAt ?? nowIso();
      const envelope = await repository.getEnvelope(input.evidenceEnvelopeRef);
      if (!envelope) {
        const audit = await appendAudit(
          createAudit({
            envelopeRef: input.evidenceEnvelopeRef,
            actorRef: input.actorRef,
            purpose: input.purpose,
            accessType: "deny",
            decision: "deny",
            reasonCodes: ["EVIDENCE_177_ENVELOPE_NOT_FOUND"],
            recordedAt: observedAt,
          }),
        );
        return {
          decision: "deny",
          envelope: null,
          maskedDisplay: null,
          rawEvidence: undefined,
          audit,
          reasonCodes: audit.reasonCodes,
        };
      }
      if (input.requestedView === "masked") {
        const audit = await appendAudit(
          createAudit({
            envelopeRef: envelope.identityEvidenceEnvelopeId,
            actorRef: input.actorRef,
            purpose: input.purpose,
            accessType: "read_masked",
            decision: "allow",
            reasonCodes: ["EVIDENCE_177_MASKED_READ_ALLOWED"],
            recordedAt: observedAt,
          }),
        );
        return {
          decision: "allow",
          envelope,
          maskedDisplay: envelope.maskedDisplay,
          rawEvidence: undefined,
          audit,
          reasonCodes: audit.reasonCodes,
        };
      }
      if (!privilegedRawReadAllowed(input.purpose, input.privileged)) {
        const audit = await appendAudit(
          createAudit({
            envelopeRef: envelope.identityEvidenceEnvelopeId,
            actorRef: input.actorRef,
            purpose: input.purpose,
            accessType: "deny",
            decision: "deny",
            reasonCodes: [
              "EVIDENCE_177_RAW_READ_DENIED",
              "EVIDENCE_177_PRIVILEGED_PURPOSE_REQUIRED",
            ],
            recordedAt: observedAt,
          }),
        );
        return {
          decision: "deny",
          envelope,
          maskedDisplay: envelope.maskedDisplay,
          rawEvidence: undefined,
          audit,
          reasonCodes: audit.reasonCodes,
        };
      }
      const ciphertext = await repository.getCiphertext(envelope.vaultRef);
      if (!ciphertext) {
        const audit = await appendAudit(
          createAudit({
            envelopeRef: envelope.identityEvidenceEnvelopeId,
            actorRef: input.actorRef,
            purpose: input.purpose,
            accessType: "deny",
            decision: "deny",
            reasonCodes: ["EVIDENCE_177_CIPHERTEXT_NOT_FOUND"],
            recordedAt: observedAt,
          }),
        );
        return {
          decision: "deny",
          envelope,
          maskedDisplay: envelope.maskedDisplay,
          rawEvidence: undefined,
          audit,
          reasonCodes: audit.reasonCodes,
        };
      }
      const aad = Buffer.from(
        stableJson({
          vaultRef: envelope.vaultRef,
          namespace: envelope.evidenceNamespace,
          subjectRef: envelope.subjectRef,
          claimDigest: envelope.claimDigest,
          policyVersion: envelope.policyVersion,
        }),
      );
      const expectedAadDigest = `sha256:${sha256(aad)}`;
      const actualAadDigest = Buffer.from(ciphertext.aadDigest);
      const expectedAadDigestBuffer = Buffer.from(expectedAadDigest);
      if (
        actualAadDigest.length !== expectedAadDigestBuffer.length ||
        !timingSafeEqual(actualAadDigest, expectedAadDigestBuffer)
      ) {
        throw new Error("IDENTITY_EVIDENCE_AAD_DIGEST_MISMATCH");
      }
      const rawEvidence = await decryptEvidencePayload({ keyManager, ciphertext, aad });
      const audit = await appendAudit(
        createAudit({
          envelopeRef: envelope.identityEvidenceEnvelopeId,
          actorRef: input.actorRef,
          purpose: input.purpose,
          accessType: "read_raw",
          decision: "allow",
          reasonCodes: ["EVIDENCE_177_RAW_READ_ALLOWED", "EVIDENCE_177_ACCESS_AUDITED"],
          recordedAt: observedAt,
        }),
      );
      return {
        decision: "allow",
        envelope,
        maskedDisplay: envelope.maskedDisplay,
        rawEvidence,
        audit,
        reasonCodes: audit.reasonCodes,
      };
    },
    async lookupEvidence(input) {
      const observedAt = input.observedAt ?? nowIso();
      const tokenHash = lookupHash(input.evidenceNamespace, input.rawLookupValue);
      const tokens = await repository.findLookupTokens(input.evidenceNamespace, tokenHash);
      const locators: IdentityEvidenceLocator[] = [];
      for (const token of tokens) {
        const envelope = await repository.getEnvelope(token.envelopeRef);
        if (envelope) {
          locators.push(locatorFromEnvelope(envelope));
        }
      }
      const audit = await appendAudit(
        createAudit({
          envelopeRef: null,
          actorRef: input.actorRef,
          purpose: input.purpose,
          accessType: "lookup",
          decision: "allow",
          reasonCodes: [
            "EVIDENCE_177_LOOKUP_TOKENIZED",
            "EVIDENCE_177_LOOKUP_RAW_VALUE_NOT_STORED",
          ],
          recordedAt: observedAt,
        }),
      );
      return Object.freeze({
        lookupTokenHash: tokenHash,
        locators: Object.freeze(locators),
        audit,
      });
    },
    redactEvidenceForTelemetry(value) {
      return redactEvidenceForTelemetryValue(value);
    },
    detectEvidenceLeak(value) {
      return detectEvidenceLeakValue(value);
    },
  };
}

export function createAuthBridgeEvidenceVaultPort(
  evidenceVault: IdentityEvidenceVaultService,
): IdentityEvidenceVaultPort {
  return {
    async writeAuthClaimSnapshot(input) {
      if (input.storageRule !== "vault_reference_only") {
        throw new Error("IDENTITY_EVIDENCE_STORAGE_RULE_VIOLATION");
      }
      const result = await evidenceVault.writeEvidence({
        evidenceNamespace: "auth_claim",
        sourceChannel: "nhs_login",
        subjectRef: input.subjectRef,
        rawEvidence: {
          claims: input.rawClaims,
          tokenEnvelope: input.rawTokenEnvelope,
          issuer: input.issuer,
          providerMode: input.providerMode,
        },
        actorRef: "auth_bridge",
        purpose: "identity_binding_authority",
        provenanceRef: input.transactionId,
        retentionClass: "identity_binding_evidence",
        disclosureClass: "vault_internal",
        lookupValues: [input.subjectRef],
        createdAt: input.recordedAt,
      });
      return { evidenceRef: result.locator.evidenceEnvelopeRef };
    },
  };
}

export function createIdentityEvidenceVaultApplication(options?: {
  readonly repository?: IdentityEvidenceVaultRepository;
  readonly keyManager?: IdentityEvidenceKeyManager;
}): IdentityEvidenceVaultApplication {
  const repository = options?.repository ?? createInMemoryIdentityEvidenceVaultRepository();
  const keyManager = options?.keyManager ?? createSimulatorIdentityEvidenceKeyManager();
  return Object.freeze({
    evidenceVault: createIdentityEvidenceVaultService({ repository, keyManager }),
    repositories: repository,
    keyManager,
    migrationPlanRef: identityEvidenceVaultMigrationPlanRefs[0],
    migrationPlanRefs: identityEvidenceVaultMigrationPlanRefs,
    persistenceTables: identityEvidenceVaultPersistenceTables,
    parallelInterfaceGaps: identityEvidenceVaultParallelInterfaceGaps,
  });
}
