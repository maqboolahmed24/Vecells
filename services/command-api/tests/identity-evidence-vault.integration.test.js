import { describe, expect, it } from "vitest";
import {
  IDENTITY_EVIDENCE_ENCRYPTION_ALGORITHM,
  createAuthBridgeEvidenceVaultPort,
  createIdentityEvidenceVaultApplication,
  createInMemoryIdentityEvidenceVaultRepository,
  createSimulatorIdentityEvidenceKeyManager,
  identityEvidenceVaultMigrationPlanRefs,
  identityEvidenceVaultParallelInterfaceGaps,
  identityEvidenceVaultPersistenceTables,
} from "../src/identity-evidence-vault.ts";

function createHarness() {
  const repository = createInMemoryIdentityEvidenceVaultRepository();
  const keyManager = createSimulatorIdentityEvidenceKeyManager({
    initialKeyVersionRef: "identity_evidence_kek_test_v1",
    createdAt: "2026-04-15T11:00:00Z",
  });
  const application = createIdentityEvidenceVaultApplication({ repository, keyManager });
  return { application, repository, keyManager };
}

describe("identity evidence vault", () => {
  it("writes raw NHS login claims as encrypted append-only evidence and emits only a masked locator", async () => {
    const { application, repository } = createHarness();

    const written = await application.evidenceVault.writeEvidence({
      evidenceNamespace: "auth_claim",
      sourceChannel: "nhs_login",
      subjectRef: "nhs_login_subject_177",
      rawEvidence: {
        sub: "nhs_login_subject_177",
        email: "patient@example.test",
        nhsNumber: "9434765919",
        identity_proofing_level: "P9",
      },
      actorRef: "auth_bridge",
      purpose: "identity_binding_authority",
      provenanceRef: "auth_txn_177",
      lookupValues: ["nhs_login_subject_177", "patient@example.test"],
      createdAt: "2026-04-15T11:00:00Z",
    });
    const snapshots = repository.snapshots();
    const serializedCiphertext = JSON.stringify(snapshots.ciphertexts);

    expect(application.migrationPlanRef).toBe(
      "services/command-api/migrations/092_phase2_identity_evidence_vault.sql",
    );
    expect(application.migrationPlanRefs).toEqual(identityEvidenceVaultMigrationPlanRefs);
    expect(application.persistenceTables).toEqual(identityEvidenceVaultPersistenceTables);
    expect(application.parallelInterfaceGaps).toEqual(identityEvidenceVaultParallelInterfaceGaps);
    expect(written.envelope.schemaVersion).toBe("170.phase2.trust.v1");
    expect(written.envelope.evidenceKind).toBe("nhs_login_claim_digest");
    expect(written.envelope.retentionClass).toBe("identity_binding_evidence");
    expect(written.envelope.keyVersionRef).toBe("identity_evidence_kek_test_v1");
    expect(written.envelope.claimDigest).toMatch(/^sha256:/);
    expect(written.locator.maskedDisplay.maskedContact).not.toContain("patient@example.test");
    expect(written.lookupTokens).toHaveLength(2);
    expect(snapshots.envelopes).toHaveLength(1);
    expect(snapshots.ciphertexts[0]?.algorithm).toBe(IDENTITY_EVIDENCE_ENCRYPTION_ALGORITHM);
    expect(serializedCiphertext).not.toContain("9434765919");
    expect(serializedCiphertext).not.toContain("patient@example.test");
    expect(snapshots.accessAudit[0]?.accessType).toBe("write");
  });

  it("denies ordinary raw reads while allowing audited privileged reads", async () => {
    const { application, repository } = createHarness();
    const written = await application.evidenceVault.writeEvidence({
      evidenceNamespace: "userinfo_claim",
      sourceChannel: "nhs_login",
      subjectRef: "nhs_login_subject_177",
      rawEvidence: { email: "patient@example.test", phoneNumber: "+447700900177" },
      actorRef: "auth_bridge",
      purpose: "identity_binding_authority",
      provenanceRef: "userinfo_177",
      createdAt: "2026-04-15T11:00:00Z",
    });

    const denied = await application.evidenceVault.readEvidence({
      evidenceEnvelopeRef: written.locator.evidenceEnvelopeRef,
      actorRef: "support_view",
      purpose: "support_case_summary",
      requestedView: "raw",
      privileged: false,
      observedAt: "2026-04-15T11:01:00Z",
    });
    const masked = await application.evidenceVault.readEvidence({
      evidenceEnvelopeRef: written.locator.evidenceEnvelopeRef,
      actorRef: "support_view",
      purpose: "support_case_summary",
      requestedView: "masked",
      observedAt: "2026-04-15T11:02:00Z",
    });
    const allowed = await application.evidenceVault.readEvidence({
      evidenceEnvelopeRef: written.locator.evidenceEnvelopeRef,
      actorRef: "patient_linker",
      purpose: "patient_linker",
      requestedView: "raw",
      privileged: true,
      observedAt: "2026-04-15T11:03:00Z",
    });

    expect(denied.decision).toBe("deny");
    expect(denied.rawEvidence).toBeUndefined();
    expect(denied.reasonCodes).toContain("EVIDENCE_177_RAW_READ_DENIED");
    expect(masked.decision).toBe("allow");
    expect(masked.rawEvidence).toBeUndefined();
    expect(masked.maskedDisplay?.maskedContact).toContain("****");
    expect(allowed.decision).toBe("allow");
    expect(allowed.rawEvidence).toEqual({
      email: "patient@example.test",
      phoneNumber: "+447700900177",
    });
    expect(repository.snapshots().accessAudit.map((record) => record.accessType)).toEqual([
      "write",
      "deny",
      "read_masked",
      "read_raw",
    ]);
  });

  it("tokenizes phone and caller-id lookups without storing raw lookup values", async () => {
    const { application, repository } = createHarness();
    const phone = "+447700900177";
    await application.evidenceVault.writeEvidence({
      evidenceNamespace: "phone_number",
      sourceChannel: "sms",
      subjectRef: "draft_subject_177",
      rawEvidence: { phoneNumber: phone, source: "sms_seed" },
      actorRef: "telephony_edge",
      purpose: "telephony_readiness",
      provenanceRef: "sms_seed_177",
      lookupValues: [phone],
      createdAt: "2026-04-15T11:00:00Z",
    });

    const lookup = await application.evidenceVault.lookupEvidence({
      evidenceNamespace: "phone_number",
      rawLookupValue: phone,
      actorRef: "patient_linker",
      purpose: "patient_linker",
      observedAt: "2026-04-15T11:05:00Z",
    });
    const snapshots = repository.snapshots();

    expect(lookup.lookupTokenHash).toMatch(/^sha256:/);
    expect(lookup.locators).toHaveLength(1);
    expect(lookup.locators[0]?.maskedDisplay.maskedContact).toBe("+44******0177");
    expect(JSON.stringify(snapshots.lookupTokens)).not.toContain(phone);
    expect(snapshots.lookupTokens[0]?.tokenHash).toBe(lookup.lookupTokenHash);
    expect(snapshots.accessAudit.at(-1)?.reasonCodes).toContain(
      "EVIDENCE_177_LOOKUP_RAW_VALUE_NOT_STORED",
    );
  });

  it("rotates key versions while preserving old evidence readability", async () => {
    const { application, keyManager } = createHarness();
    const first = await application.evidenceVault.writeEvidence({
      evidenceNamespace: "handset_proof",
      sourceChannel: "secure_link",
      subjectRef: "subject_177",
      rawEvidence: { handsetProof: "device-proof-177", nonce: "nonce-177" },
      actorRef: "secure_link_adapter",
      purpose: "telephony_readiness",
      provenanceRef: "handset_177_v1",
      createdAt: "2026-04-15T11:00:00Z",
    });

    await keyManager.rotateActiveKey?.("2026-04-15T11:10:00Z");
    const second = await application.evidenceVault.writeEvidence({
      evidenceNamespace: "handset_proof",
      sourceChannel: "secure_link",
      subjectRef: "subject_177",
      rawEvidence: { handsetProof: "device-proof-178", nonce: "nonce-178" },
      actorRef: "secure_link_adapter",
      purpose: "telephony_readiness",
      provenanceRef: "handset_177_v2",
      previousEnvelopeRef: first.locator.evidenceEnvelopeRef,
      createdAt: "2026-04-15T11:11:00Z",
    });
    const firstRead = await application.evidenceVault.readEvidence({
      evidenceEnvelopeRef: first.locator.evidenceEnvelopeRef,
      actorRef: "security_audit",
      purpose: "security_audit",
      requestedView: "raw",
      privileged: true,
      observedAt: "2026-04-15T11:12:00Z",
    });

    expect(first.envelope.keyVersionRef).toBe("identity_evidence_kek_test_v1");
    expect(second.envelope.keyVersionRef).not.toBe(first.envelope.keyVersionRef);
    expect(second.envelope.previousEnvelopeRef).toBe(first.locator.evidenceEnvelopeRef);
    expect(firstRead.rawEvidence).toEqual({ handsetProof: "device-proof-177", nonce: "nonce-177" });
  });

  it("redacts observability payloads and supplies an auth-bridge evidence port adapter", async () => {
    const { application } = createHarness();
    const redacted = application.evidenceVault.redactEvidenceForTelemetry({
      route: "auth_callback",
      rawClaims: { email: "patient@example.test" },
      callerIdentifier: "+447700900177",
      safeRef: "iev_safe_ref",
    });
    const port = createAuthBridgeEvidenceVaultPort(application.evidenceVault);
    const portResult = await port.writeAuthClaimSnapshot({
      transactionId: "auth_txn_177_port",
      providerMode: "nhs_login_simulator",
      issuer: "https://auth.login.nhs.uk",
      subjectRef: "nhs_login_subject_port",
      rawClaims: { sub: "nhs_login_subject_port", email: "patient@example.test" },
      rawTokenEnvelope: {
        header: { alg: "RS256", kid: "kid", typ: "JWT" },
        claims: { sub: "nhs_login_subject_port" },
        signature: "signature",
      },
      storageRule: "vault_reference_only",
      recordedAt: "2026-04-15T11:20:00Z",
    });

    expect(JSON.stringify(redacted)).not.toContain("patient@example.test");
    expect(JSON.stringify(redacted)).not.toContain("+447700900177");
    expect(application.evidenceVault.detectEvidenceLeak(redacted)).toBe(false);
    expect(portResult.evidenceRef).toMatch(/^iev_/);
  });
});
