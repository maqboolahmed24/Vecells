import { describe, expect, it } from "vitest";

import {
  EXPECTED_VISIBLE_FIELDS_338,
  SECRET_VISIBILITY_FIELDS_338,
  materializeVisibilityProjection338,
} from "../integration/338_scope_capacity.helpers.ts";
import {
  buildNoTrustedSupplyBindings,
  createHubQueueCase,
  publishQueue,
  setupHubQueueHarness,
} from "../integration/319_hub_queue.helpers.ts";

function permutations<T>(values: readonly T[]): T[][] {
  if (values.length <= 1) {
    return [values.slice() as T[]];
  }
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += 1) {
    const rest = values.slice(0, index).concat(values.slice(index + 1));
    for (const permutation of permutations(rest)) {
      output.push([values[index]!, ...permutation]);
    }
  }
  return output;
}

describe("338 ranking and visibility properties", () => {
  it("keeps each audience tier on its exact visible-field contract across repeated seeds", async () => {
    const tierConfigs = [
      ["hub_desk_visibility", "338_property_hub_a", "338_property_hub_b"],
      ["origin_practice_visibility", "338_property_origin_a", "338_property_origin_b"],
      ["servicing_site_visibility", "338_property_site_a", "338_property_site_b"],
    ] as const;

    for (const [tierId, firstSeed, secondSeed] of tierConfigs) {
      const first = await materializeVisibilityProjection338(tierId, firstSeed);
      const second = await materializeVisibilityProjection338(tierId, secondSeed);
      const firstKeys = Object.keys(first.projection.visibleFields).sort();
      const secondKeys = Object.keys(second.projection.visibleFields).sort();

      expect(firstKeys).toEqual([...EXPECTED_VISIBLE_FIELDS_338[tierId]].sort());
      expect(secondKeys).toEqual(firstKeys);
      expect(Object.values(first.projection.visibleFields)).not.toContain("secret");
      expect(Object.values(second.projection.visibleFields)).not.toContain("secret");
      for (const secretField of SECRET_VISIBILITY_FIELDS_338) {
        expect(firstKeys).not.toContain(secretField);
        expect(secondKeys).not.toContain(secretField);
      }
    }
  });

  it("keeps queue order stable across publication permutations for the same pre-commit fact cut", async () => {
    const baselineHarness = await setupHubQueueHarness("338_property_baseline");
    const urgent = await createHubQueueCase(baselineHarness, {
      name: "urgent",
      priorityBand: "urgent",
      dueMinute: 18,
      latestSafeOfferMinute: 11,
      originPracticeOds: "PRA_338_PROP_URGENT",
      state: "coordinator_selecting",
    });
    const noTrusted = await createHubQueueCase(baselineHarness, {
      name: "no_trusted",
      dueMinute: 70,
      originPracticeOds: "PRA_338_PROP_NO_TRUST",
      state: "candidates_ready",
      snapshotBindings: buildNoTrustedSupplyBindings("338_property_no_trusted"),
    });
    const selecting = await createHubQueueCase(baselineHarness, {
      name: "selecting",
      dueMinute: 55,
      originPracticeOds: "PRA_338_PROP_SELECTING",
      state: "coordinator_selecting",
    });

    const baseline = await publishQueue(baselineHarness, [selecting, urgent, noTrusted], {
      selectedAnchorRef: urgent.current.hubCase.hubCoordinationCaseId,
    });
    const baselineById = new Map([
      [urgent.current.hubCase.hubCoordinationCaseId, "urgent"],
      [noTrusted.current.hubCase.hubCoordinationCaseId, "no_trusted"],
      [selecting.current.hubCase.hubCoordinationCaseId, "selecting"],
    ]);
    const expectedOrder = baseline.rankEntries.map((entry) => baselineById.get(entry.taskRef));

    for (const [index, order] of permutations(["selecting", "urgent", "no_trusted"] as const).entries()) {
      const harness = await setupHubQueueHarness(`338_property_${index}`);
      const cases = {
        urgent: await createHubQueueCase(harness, {
          name: "urgent",
          priorityBand: "urgent",
          dueMinute: 18,
          latestSafeOfferMinute: 11,
          originPracticeOds: "PRA_338_PROP_URGENT",
          state: "coordinator_selecting",
        }),
        no_trusted: await createHubQueueCase(harness, {
          name: "no_trusted",
          dueMinute: 70,
          originPracticeOds: "PRA_338_PROP_NO_TRUST",
          state: "candidates_ready",
          snapshotBindings: buildNoTrustedSupplyBindings(`338_property_${index}_no_trusted`),
        }),
        selecting: await createHubQueueCase(harness, {
          name: "selecting",
          dueMinute: 55,
          originPracticeOds: "PRA_338_PROP_SELECTING",
          state: "coordinator_selecting",
        }),
      };
      const result = await publishQueue(
        harness,
        order.map((key) => cases[key]),
        {
          selectedAnchorRef: cases.urgent.current.hubCase.hubCoordinationCaseId,
        },
      );
      const byId = new Map([
        [cases.urgent.current.hubCase.hubCoordinationCaseId, "urgent"],
        [cases.no_trusted.current.hubCase.hubCoordinationCaseId, "no_trusted"],
        [cases.selecting.current.hubCase.hubCoordinationCaseId, "selecting"],
      ]);
      expect(result.rankEntries.map((entry) => byId.get(entry.taskRef))).toEqual(expectedOrder);
      expect(result.workbenchProjection.visibleRowRefs.map((entry) => byId.get(entry))).toEqual(
        expectedOrder,
      );
    }
  });
});

