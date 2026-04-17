import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "secret_class_manifest.json"), "utf8"),
);
const keyManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "key_hierarchy_manifest.json"), "utf8"),
);
const rotationRows = parseCsv(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "rotation_policy_matrix.csv"), "utf8"),
);

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
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
  return body.map((values) =>
    Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""])),
  );
}

function deriveBytes(masterKey, label, length) {
  return crypto.createHmac("sha256", masterKey).update(label).digest().subarray(0, length);
}

function encryptBytes(key, nonce, payload, aad) {
  const cipher = crypto.createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(payload), cipher.final()]);
  return { ciphertext, authTag: cipher.getAuthTag() };
}

function createSyntheticPlaintext(masterKey, environmentRing, secretClassRef, versionRef) {
  return crypto
    .createHmac("sha256", masterKey)
    .update(`synthetic:${environmentRing}:${secretClassRef}:${versionRef}`)
    .digest("base64url");
}

function encryptRecord(masterKey, secretClassRef, keyBranchRef, versionRef, plaintext) {
  const dek = deriveBytes(masterKey, `dek:${secretClassRef}:${versionRef}`, 32);
  const wrapKey = deriveBytes(masterKey, `kek:${keyBranchRef}`, 32);
  const wrapNonce = deriveBytes(masterKey, `wrap:${secretClassRef}:${versionRef}`, 12);
  const wrappedDek = encryptBytes(wrapKey, wrapNonce, dek, `${secretClassRef}:${versionRef}:dek`);
  const nonce = deriveBytes(masterKey, `nonce:${secretClassRef}:${versionRef}`, 12);
  const payload = encryptBytes(
    dek,
    nonce,
    Buffer.from(plaintext, "utf8"),
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

function addDays(timestamp, days) {
  const value = new Date(timestamp);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}

function stableDigest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1] ?? "true");
}

const environmentRing = args.get("--environment") ?? "local";
const stateDir = args.get("--state-dir") ?? path.join(ROOT, ".tmp", "secret-kms", environmentRing);
const dryRun = args.has("--dry-run");
const backend = manifest.environment_backends.find((row) => row.environment_ring === environmentRing);
const keyEnvironment = keyManifest.environments.find((row) => row.environment_ring === environmentRing);
if (!backend || !keyEnvironment) {
  throw new Error(`Unsupported environment ring ${environmentRing}`);
}

const recordDefs = manifest.secret_classes.filter((row) =>
  row.allowed_environment_rings.includes(environmentRing),
);
const plan = {
  taskId: "par_089",
  environmentRing,
  namespaceId: backend.namespace_id,
  backendRef: backend.backend_ref,
  rootKeyRef: keyEnvironment.kms_root_key_ref,
  recordCount: recordDefs.length,
  stateDir,
};

if (args.has("--emit-plan")) {
  fs.mkdirSync(path.dirname(args.get("--emit-plan")), { recursive: true });
  fs.writeFileSync(args.get("--emit-plan"), `${JSON.stringify(plan, null, 2)}\n`, "utf8");
}

if (dryRun) {
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  process.exit(0);
}

fs.rmSync(stateDir, { recursive: true, force: true });
fs.mkdirSync(stateDir, { recursive: true });
const masterKey = process.env.VECELLS_KMS_MASTER_KEY_BASE64
  ? Buffer.from(process.env.VECELLS_KMS_MASTER_KEY_BASE64, "base64")
  : crypto.randomBytes(32);
fs.writeFileSync(
  path.join(stateDir, "master-key.json"),
  `${JSON.stringify(
    {
      environment_ring: environmentRing,
      root_key_ref: keyEnvironment.kms_root_key_ref,
      master_key_b64: masterKey.toString("base64"),
    },
    null,
    2,
  )}\n`,
  "utf8",
);
const generatedAt = new Date().toISOString();
const records = recordDefs.map((row) => {
  const policy = rotationRows.find((candidate) => candidate.secret_class_ref === row.secret_class_ref);
  const versionRef = `${row.secret_class_ref}_v01`;
  const plaintext = createSyntheticPlaintext(masterKey, environmentRing, row.secret_class_ref, versionRef);
  return {
    secret_class_ref: row.secret_class_ref,
    version_ref: versionRef,
    environment_ring: environmentRing,
    key_branch_ref: row.key_branch_ref,
    access_state: "active",
    rotate_after: addDays(generatedAt, Number(policy.rotation_window_days)),
    expires_after: addDays(generatedAt, Number(policy.maximum_ttl_days)),
    updated_at: generatedAt,
    supersedes_version_ref: null,
    fingerprint: stableDigest(plaintext).slice(0, 16),
    ...encryptRecord(masterKey, row.secret_class_ref, row.key_branch_ref, versionRef, plaintext),
  };
});

fs.writeFileSync(
  path.join(stateDir, "secret-store.json"),
  `${JSON.stringify(
    {
      task_id: manifest.task_id,
      generated_at: generatedAt,
      environment_ring: environmentRing,
      namespace_id: backend.namespace_id,
      backend_ref: backend.backend_ref,
      records,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
fs.writeFileSync(path.join(stateDir, "access-audit.jsonl"), "", "utf8");
process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
