import { describe, expect, it } from "vitest";
import {
  createDefaultPhase7ExternalEntryApplication,
  PHASE7_EXTERNAL_ENTRY_SCHEMA_VERSION,
} from "../../services/command-api/src/phase7-external-entry-service.ts";
import {
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

describe("380 site-link manifest and external-entry grant issuance", () => {
  it("exports environment-specific Android and iOS association artifacts from manifest truth", () => {
    const application = createDefaultPhase7ExternalEntryApplication();

    const manifest = application.getSiteLinkManifest({ environment: "sandpit" });
    const android = application.exportAndroidAssetLinks({ environment: "sandpit" });
    const ios = application.exportIosAssociation({ environment: "sandpit" });

    expect(manifest.manifestVersionRef).toBe(PHASE7_MANIFEST_VERSION);
    expect(manifest.canonicalGrantServiceRef).toBe("AccessGrantService");
    expect(manifest.routeIntentBindingRequired).toBe(true);
    expect(manifest.allowedPathPatterns).toContain("/requests/*");
    expect(manifest.routes.map((route) => route.routeFamilyRef)).toContain("pharmacy_status");
    expect(android.wellKnownPath).toBe("/.well-known/assetlinks.json");
    expect(android.body[0].target.package_name).toBe("uk.nhs.nhsapp.sandpit");
    expect(android.body[0].target.sha256_cert_fingerprints[0]).toMatch(
      /^([A-F0-9]{2}:){31}[A-F0-9]{2}$/,
    );
    expect(ios.wellKnownPath).toBe("/.well-known/apple-app-site-association");
    expect(ios.body.applinks.details[0].appID).toBe("ABCDE12345.uk.nhs.nhsapp.sandpit");
    expect(ios.body.applinks.details[0].paths).toContain("/requests/*");
  });

  it("issues external-entry grants only through AccessGrantService scope envelopes", async () => {
    const application = createDefaultPhase7ExternalEntryApplication();
    const issuance = await application.issueExternalEntryGrant({
      environment: "sandpit",
      entryMode: "nhs_app_site_link",
      journeyPathId: "jp_pharmacy_status",
      incomingPath: "/requests/REQ-380/pharmacy/status?from=nhsApp&token=raw-token",
      governingObjectRef: "Request:REQ-380",
      governingObjectVersionRef: "RequestVersion:REQ-380:v1",
      sessionEpochRef: "SessionEpoch:380",
      subjectBindingVersionRef: "SubjectBindingVersion:380",
      lineageFenceRef: "LineageFence:REQ-380",
      subjectRef: "Subject:patient-380",
      issueIdempotencyKey: "issue-380-unit-site-link",
      opaqueToken: "external-entry-token-380-unit",
    });

    expect(issuance.grant.createdByAuthority).toBe("AccessGrantService");
    expect(issuance.scopeEnvelope.createdByAuthority).toBe("AccessGrantService");
    expect(issuance.scopeEnvelope.routeFamily).toBe("pharmacy_status");
    expect(issuance.scopeEnvelope.routeIntentBindingRef).toMatch(/^RouteIntentBinding:380:/);
    expect(issuance.scopeEnvelope.manifestVersionRef).toBe(PHASE7_MANIFEST_VERSION);
    expect(issuance.scopeEnvelope.releaseApprovalFreezeRef).toBe(
      PHASE7_RELEASE_APPROVAL_FREEZE_REF,
    );
    expect(issuance.scopeEnvelope.phiExposureClass).toBe("minimal");
    expect(issuance.materializedToken).toBe("external-entry-token-380-unit");
    expect(issuance.audit.schemaVersion).toBe(PHASE7_EXTERNAL_ENTRY_SCHEMA_VERSION);
    expect(JSON.stringify(application.listAuditRecords())).not.toContain(
      "external-entry-token-380-unit",
    );
  });
});
