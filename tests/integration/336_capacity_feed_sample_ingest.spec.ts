import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  bootstrapPartnerFeeds,
  buildPartnerCredentialManifest,
  buildPartnerFeedRegistry,
  buildPartnerSiteServiceMap,
  buildSmokeScenario,
} from "../../scripts/capacity/336_partner_feed_lib.ts";
import {
  buildSnapshotCommand,
  setupNetworkCapacityHarness,
} from "./318_network_capacity.helpers.ts";

describe("336 partner feed configuration", () => {
  it("keeps every feed row bound to credentials and site or service mappings", async () => {
    const registry = await buildPartnerFeedRegistry();
    const credentials = await buildPartnerCredentialManifest();
    const siteServiceMap = await buildPartnerSiteServiceMap();

    expect(registry.feeds.length).toBeGreaterThanOrEqual(9);
    for (const feed of registry.feeds) {
      expect(credentials.credentials.some((entry) => entry.feedId === feed.feedId)).toBe(true);
      expect(siteServiceMap.some((entry) => entry.feedId === feed.feedId)).toBe(true);
      expect(feed.adapterIdentity).toContain("phase5.capacity");
      expect(feed.endpointIdentity.length).toBeGreaterThan(8);
      expect(feed.odsCode).toBe("A83002");
      expect(feed.siteRef.length).toBeGreaterThan(4);
      expect(feed.serviceRef.length).toBeGreaterThan(4);
    }
  });

  it("rebuilds the 318 candidate snapshot from manifest-driven partner bindings", async () => {
    const harness = await setupNetworkCapacityHarness("336_integration");
    const smoke = await buildSmokeScenario();
    const result = await harness.service.buildCandidateSnapshotForCase({
      ...buildSnapshotCommand("336_integration"),
      hubCoordinationCaseId: harness.claimed.hubCase.hubCoordinationCaseId,
      adapterBindings: smoke.bindings,
      deliveredMinutes: 120,
      cancelledMinutes: 0,
      replacementMinutes: 0,
    });

    const admissionBySource = new Map(
      result.sourceAdmissions.map((admission) => [admission.sourceRef, admission.admissionDisposition]),
    );

    expect(admissionBySource.get("feed_336_gp_connect_local_twin")).toBe("trusted_admitted");
    expect(admissionBySource.get("feed_336_optum_local_twin")).toBe("trusted_admitted");
    expect(admissionBySource.get("feed_336_manual_board_local_twin")).toBe("trusted_admitted");
    expect(admissionBySource.get("feed_336_tpp_local_twin")?.startsWith("degraded_")).toBe(true);
    expect(admissionBySource.get("feed_336_batch_import_local_twin")).toBe("quarantined_excluded");
    expect(
      result.supplyExceptions.some((exception) => exception.exceptionCode === "CAPACITY_QUARANTINED"),
    ).toBe(true);
    expect(
      smoke.bindings.every((binding) =>
        ["adapter:", "ods:", "site:", "service:"].every((prefix) =>
          binding.sourceRefs.some((entry) => entry.startsWith(prefix)),
        ),
      ),
    ).toBe(true);
  });

  it("keeps bootstrap idempotent and convergent", async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-336-"));
    const first = await bootstrapPartnerFeeds({ outputDir });
    const second = await bootstrapPartnerFeeds({ outputDir });

    expect(first.actions.some((entry) => entry.action === "configured")).toBe(true);
    expect(second.actions.some((entry) => entry.action === "already_current")).toBe(true);

    const state = JSON.parse(
      fs.readFileSync(path.join(outputDir, "336_partner_feed_runtime_state.json"), "utf8"),
    ) as { feeds: { feedId: string }[] };
    expect(new Set(state.feeds.map((entry) => entry.feedId)).size).toBe(state.feeds.length);
  });
});
