import { describe, expect, it } from "vitest";
import {
  createPhase9TenantConfigGovernanceFixture,
  Phase9TenantConfigGovernanceService,
} from "../../packages/domains/analytics_assurance/src/index.ts";

describe("448 Phase 9 tenant config governance", () => {
  it("config immutability and parent chain hashing", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();
    const service = new Phase9TenantConfigGovernanceService();

    expect(fixture.rootConfigVersion.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.childConfigVersion.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.childConfigVersion.chainHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fixture.childConfigVersion.parentVersionRef).toBe(
      fixture.rootConfigVersion.configVersionId,
    );
    expect(fixture.childConfigVersion.compilationRecordRef).toBe("compilation:448:current");
    expect(fixture.childConfigVersion.simulationEnvelopeRef).toBe("simulation:448:current");
    expect(
      service.listConfigHistory({
        tenantId: "tenant:demo-gp",
        versions: [fixture.childConfigVersion, fixture.rootConfigVersion],
      }),
    ).toEqual([fixture.rootConfigVersion, fixture.childConfigVersion]);
  });

  it("tenant drift detection", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.liveBaseline.tenantId).toBe(fixture.candidateBaseline.tenantId);
    expect(fixture.tenantDiffRows.map((row) => row.fieldName)).toEqual(
      expect.arrayContaining([
        "enabledCapabilities",
        "integrationRefs",
        "policyPackRefs",
        "standardsVersionRefs",
        "approvalState",
      ]),
    );
    expect(
      fixture.tenantDiffRows.find((row) => row.fieldName === "standardsVersionRefs")
        ?.candidateValueRefs,
    ).toEqual(expect.arrayContaining(["DTAC:2026-03", "DSPT:2026"]));
  });

  it("policy-pack compatibility", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();
    const service = new Phase9TenantConfigGovernanceService();

    expect(fixture.policyPackVersions).toHaveLength(14);
    expect(fixture.policyPackVersions.map((pack) => pack.packType)).toEqual(
      expect.arrayContaining([
        "routing",
        "sla_eta",
        "identity_grants",
        "duplicate_policy",
        "provider_overrides",
        "waitlist_booking",
        "hub_coordination",
        "callback_messaging",
        "pharmacy",
        "communications",
        "access",
        "visibility",
        "provider_capability_matrix",
        "tenant_overrides",
      ]),
    );
    expect(fixture.validBundle.compatibilityState).toBe("valid");
    expect(fixture.validCompileVerdict.compileGateState).toBe("pass");
    expect(
      service.listPolicyPackHistory({
        tenantId: "tenant:demo-gp",
        packs: fixture.policyPackVersions,
        packType: "pharmacy",
      }),
    ).toHaveLength(1);
  });

  it("visibility/minimum-necessary compile blocking", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.visibilityBlockedVerdict.compileGateState).toBe("blocked");
    expect(fixture.visibilityBlockedVerdict.blockerRefs).toEqual(
      expect.arrayContaining([
        "visibility:phi-exposure-grant:public",
        "visibility:minimum-necessary-coverage-blocked",
      ]),
    );
  });

  it("stale provider choice and expired consent rejection", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.staleProviderConsentVerdict.compileGateState).toBe("blocked");
    expect(fixture.staleProviderConsentVerdict.blockerRefs).toEqual(
      expect.arrayContaining([
        "pharmacy:stale-provider-choice",
        "pharmacy:expired-consent-scope",
        "pharmacy:dispatch-correlation-mismatch",
      ]),
    );
  });

  it("stale assistive session invalidation", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.staleAssistiveVerdict.compileGateState).toBe("blocked");
    expect(fixture.staleAssistiveVerdict.blockerRefs).toEqual(
      expect.arrayContaining([
        "assistive:session-invalidated",
        "assistive:review-version-drift",
        "assistive:policy-bundle-changed-after-suggestion",
      ]),
    );
  });

  it("legacy reference scanner detection and resolution", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.legacyReferenceFindings.map((finding) => finding.referenceClass)).toEqual(
      expect.arrayContaining(["retired_documentation_endpoint", "stale_route_contract"]),
    );
    const retiredEndpointFinding = fixture.legacyReferenceFindings.find(
      (finding) => finding.referenceClass === "retired_documentation_endpoint",
    );
    expect(retiredEndpointFinding?.ownerRef).toBe("owner:integration-platform");
    expect(retiredEndpointFinding?.replacementRef).toContain("replacement:");
    expect(retiredEndpointFinding?.remediationDueAt).toBe("2026-05-31T17:00:00.000Z");
    expect(fixture.resolvedLegacyFinding.findingState).toBe("resolved");
  });

  it("standards change impact workflow", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.standardsChangeNotice.frameworkCode).toBe("DTAC");
    expect(fixture.standardsChangeNotice.currentVersionRef).toBe("DTAC:2025-03");
    expect(fixture.standardsChangeNotice.newVersionRef).toBe("DTAC:2026-03");
    expect(fixture.standardsBaselineMap.blockingDeltaRefs).toContain(
      fixture.standardsChangeNotice.noticeId,
    );
    expect(fixture.standardsBaselineMap.affectedTenantScopeRefs).toContain("tenant:demo-gp");
  });

  it("standards watchlist hash parity", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.blockedWatchlist.watchlistHash).toBe(
      fixture.repeatedBlockedWatchlist.watchlistHash,
    );
    expect(fixture.blockedWatchlist.standardsBaselineMapRef).toBe(
      fixture.standardsBaselineMap.baselineMapId,
    );
    expect(fixture.blockedWatchlist.dependencyLifecycleRecordRefs).toEqual(
      expect.arrayContaining(
        fixture.dependencyLifecycleRecords.map((record) => record.dependencyLifecycleRecordId),
      ),
    );
    expect(fixture.blockedWatchlist.compileGateState).toBe("blocked");
    expect(fixture.blockedWatchlist.promotionGateState).toBe("blocked");
  });

  it("exception expiry reopening findings", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.expiredException.exceptionState).toBe("approved");
    expect(fixture.reopenedFindingRefs).toEqual(
      expect.arrayContaining(fixture.expiredException.requiredReopenFindingRefs),
    );
    expect(fixture.blockedWatchlist.blockingFindingRefs).toEqual(
      expect.arrayContaining(fixture.reopenedFindingRefs),
    );
  });

  it("approval-gate bypass prevention", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.promotionReadyAssessment.state).toBe("pass");
    expect(fixture.approvalBypassAssessment.state).toBe("invalidated");
    expect(fixture.approvalBypassAssessment.blockerRefs).toEqual(
      expect.arrayContaining(["approval:bundle-hash-mismatch", "approval:audit-missing"]),
    );
  });

  it("promotion invalidation on watchlist or migration tuple drift", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.promotionDriftAssessment.state).toBe("invalidated");
    expect(fixture.promotionDriftAssessment.blockerRefs).toEqual(
      expect.arrayContaining([
        "standards-watchlist:blocked",
        "standards-watchlist:promotion-blocked",
        "standards-watchlist:approval-hash-drift",
        "migration:execution-tuple-drift",
      ]),
    );
  });

  it("tenant isolation and authorization", () => {
    const fixture = createPhase9TenantConfigGovernanceFixture();

    expect(fixture.tenantDeniedErrorCode).toBe("TENANT_CONFIG_SCOPE_DENIED");
    expect(fixture.authorizationDeniedErrorCode).toBe("TENANT_CONFIG_ROLE_DENIED");
  });
});
