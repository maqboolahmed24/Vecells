import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  FileSecretStoreBackend,
  SecretAccessError,
  bootstrapSecretStore,
  createServiceSecretBootstrap,
  detectSecretLeakRefs,
  getCiJobSecretBinding,
  getServiceSecretBinding,
  getServiceSecretRefs,
  mapServiceEnvironmentToRing,
} from "../src/runtime-secrets";

describe("runtime secrets", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  function makeStateDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-runtime-secrets-"));
    tempDirs.push(dir);
    return dir;
  }

  it("derives service and CI bindings from the manifest", () => {
    expect(getServiceSecretRefs("api-gateway")).toEqual([
      "AUTH_EDGE_SESSION_SECRET_REF",
      "AUTH_EDGE_SIGNING_KEY_REF",
    ]);
    expect(getServiceSecretBinding("notification-worker").secret_refs.length).toBe(3);
    expect(getCiJobSecretBinding("ci_release_attestation").secret_refs).toContain(
      "RELEASE_PROVENANCE_SIGNING_KEY_REF",
    );
  });

  it("bootstraps and loads required service secrets without leaking values", () => {
    const stateDir = makeStateDir();
    bootstrapSecretStore({
      environmentRing: "local",
      stateDir,
      masterKeyBase64: Buffer.alloc(32, 7).toString("base64"),
    });
    const bootstrap = createServiceSecretBootstrap({
      serviceName: "api-gateway",
      serviceEnvironment: "test",
      env: {
        VECELLS_SECRET_STATE_DIR: stateDir,
        VECELLS_KMS_MASTER_KEY_PATH: path.join(stateDir, "master-key.json"),
      },
    });

    const secrets = bootstrap.assertReady();
    expect(secrets).toHaveLength(2);
    expect(secrets[0]?.value.length).toBeGreaterThan(16);
    expect(detectSecretLeakRefs(JSON.stringify(bootstrap.redactSummary()), secrets)).toEqual([]);

    const auditLog = fs.readFileSync(path.join(stateDir, "access-audit.jsonl"), "utf8");
    expect(detectSecretLeakRefs(auditLog, secrets)).toEqual([]);
  });

  it("rotates and refreshes secrets without code changes", () => {
    const stateDir = makeStateDir();
    bootstrapSecretStore({
      environmentRing: "local",
      stateDir,
      masterKeyBase64: Buffer.alloc(32, 5).toString("base64"),
    });
    const env = {
      VECELLS_SECRET_STATE_DIR: stateDir,
      VECELLS_KMS_MASTER_KEY_PATH: path.join(stateDir, "master-key.json"),
    };
    const bootstrap = createServiceSecretBootstrap({
      serviceName: "notification-worker",
      serviceEnvironment: "local",
      env,
    });
    const initial = bootstrap.assertReady();
    const backend = new FileSecretStoreBackend({
      environmentRing: "local",
      env,
    });
    backend.rotateSecret({
      secretClassRef: "NOTIFICATION_WEBHOOK_SECRET_REF",
      actorRef: "sid_assurance_control",
      plaintext: "rotated-webhook-secret",
    });
    const refreshed = bootstrap.refresh();
    expect(refreshed.changedSecretRefs).toContain("NOTIFICATION_WEBHOOK_SECRET_REF");
    expect(refreshed.versionRefs).not.toContain(initial[1]?.versionRef);
  });

  it("fails closed on revoked or overdue secret material", () => {
    const stateDir = makeStateDir();
    bootstrapSecretStore({
      environmentRing: "local",
      stateDir,
      masterKeyBase64: Buffer.alloc(32, 9).toString("base64"),
      now: () => new Date("2026-04-12T00:00:00.000Z"),
    });
    const env = {
      VECELLS_SECRET_STATE_DIR: stateDir,
      VECELLS_KMS_MASTER_KEY_PATH: path.join(stateDir, "master-key.json"),
    };
    const backend = new FileSecretStoreBackend({
      environmentRing: "local",
      env,
      now: () => new Date("2027-04-12T00:00:00.000Z"),
    });
    expect(() =>
      backend.loadSecret({
        secretClassRef: "AUTH_EDGE_SESSION_SECRET_REF",
        actorRef: "sid_published_gateway",
      }),
    ).toThrow(SecretAccessError);

    const stableBackend = new FileSecretStoreBackend({
      environmentRing: "local",
      env,
      now: () => new Date("2026-04-12T00:00:00.000Z"),
    });
    stableBackend.revokeSecret({
      secretClassRef: "AUTH_EDGE_SIGNING_KEY_REF",
      actorRef: "sid_assurance_control",
    });
    expect(() =>
      stableBackend.loadSecret({
        secretClassRef: "AUTH_EDGE_SIGNING_KEY_REF",
        actorRef: "sid_published_gateway",
      }),
    ).toThrow(/revoked/i);
  });

  it("maps service environments onto runtime rings deterministically", () => {
    expect(mapServiceEnvironmentToRing("test")).toBe("local");
    expect(mapServiceEnvironmentToRing("ci")).toBe("ci-preview");
    expect(mapServiceEnvironmentToRing("staging")).toBe("preprod");
    expect(mapServiceEnvironmentToRing("production")).toBe("production");
  });
});
