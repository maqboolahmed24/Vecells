import { describe, expect, it } from "vitest";
import {
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
  createDefaultPhase7NhsAppManifestApplication,
  type NhsAppIntegrationManifest,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

function buildSupersedingManifest(): NhsAppIntegrationManifest {
  const application = createDefaultPhase7NhsAppManifestApplication();
  const current = application.repository.getManifestByVersion(PHASE7_MANIFEST_VERSION);
  expect(current).not.toBeNull();
  return {
    ...current!,
    manifestId: "nhs-app-integration-manifest-377-superseding",
    manifestVersion: "nhsapp-manifest-v0.1.1-test-supersession-377",
    configFingerprint: "sha256:377-test-superseding-manifest",
    supersedesManifestId: current!.manifestId,
    changeNoticeRef: "ChangeNotice:CN-P7-377-SUPERSESSION-TEST",
  };
}

describe("377 immutable NHS App manifest repository", () => {
  it("returns cloned immutable manifest data from the repository", () => {
    const application = createDefaultPhase7NhsAppManifestApplication();

    const firstRead = application.repository.getManifestByVersion(PHASE7_MANIFEST_VERSION);
    expect(firstRead?.allowedJourneyPaths).toContain("jp_pharmacy_status");
    firstRead?.allowedJourneyPaths.push("jp_shadow_route");

    const secondRead = application.repository.getManifestByVersion(PHASE7_MANIFEST_VERSION);
    expect(secondRead?.allowedJourneyPaths).not.toContain("jp_shadow_route");
  });

  it("records explicit supersession without mutating the previous manifest", () => {
    const application = createDefaultPhase7NhsAppManifestApplication();
    const superseding = buildSupersedingManifest();

    const saved = application.saveSupersedingManifest(superseding);

    expect(saved.supersedesManifestId).toBe("nhs-app-integration-manifest-374-freeze");
    expect(
      application.repository.getManifestByVersion(PHASE7_MANIFEST_VERSION)?.supersedesManifestId,
    ).toBeNull();
    expect(
      application.repository.getManifestByVersion("nhsapp-manifest-v0.1.1-test-supersession-377")
        ?.configFingerprint,
    ).toBe("sha256:377-test-superseding-manifest");
  });

  it("rejects duplicate manifest versions and mismatched environment pins", () => {
    const application = createDefaultPhase7NhsAppManifestApplication();
    const duplicate = application.repository.getManifestByVersion(PHASE7_MANIFEST_VERSION);
    expect(duplicate).not.toBeNull();

    expect(() =>
      application.saveSupersedingManifest({
        ...duplicate!,
        supersedesManifestId: duplicate!.manifestId,
      }),
    ).toThrow(/DUPLICATE_MANIFEST_VERSION/);

    expect(() =>
      application.pinEnvironment({
        environment: "sandpit",
        manifestVersion: PHASE7_MANIFEST_VERSION,
        configFingerprint: "sha256:wrong",
        releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
      }),
    ).toThrow(/CONFIG_FINGERPRINT_MISMATCH/);
  });

  it("pins environments only when the manifest tuple matches exactly", () => {
    const application = createDefaultPhase7NhsAppManifestApplication();

    const pin = application.pinEnvironment({
      environment: "sandpit",
      manifestVersion: PHASE7_MANIFEST_VERSION,
      configFingerprint: PHASE7_CONFIG_FINGERPRINT,
      releaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    });

    expect(pin.manifestVersion).toBe(PHASE7_MANIFEST_VERSION);
    expect(pin.configFingerprint).toBe(PHASE7_CONFIG_FINGERPRINT);
  });
});
