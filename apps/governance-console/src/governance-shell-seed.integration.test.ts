import { describe, expect, it } from "vitest";
import {
  acknowledgeGovernanceReview,
  createInitialGovernanceShellState,
  navigateGovernanceShell,
  resolveGovernanceShellSnapshot,
  returnFromGovernanceReview,
} from "./governance-shell-seed.model";

describe("governance shell continuity integration", () => {
  it("preserves the same continuity frame across config diff and promotion review", () => {
    const bundles = createInitialGovernanceShellState("/ops/config/bundles");
    const promotions = navigateGovernanceShell(bundles, "/ops/config/promotions");

    expect(bundles.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe(
      "governance.review",
    );
    expect(promotions.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe(
      "governance.review",
    );
    expect(promotions.continuitySnapshot.currentStub?.replacementAnchorRef).toContain(
      "governance-approval",
    );
  });

  it("returns through the same-shell return intent without losing the selected package", () => {
    const bundles = createInitialGovernanceShellState("/ops/config/bundles");
    const promotions = navigateGovernanceShell(bundles, "/ops/config/promotions");
    const returned = returnFromGovernanceReview(promotions);

    expect(promotions.returnIntent?.originPath).toBe("/ops/config/bundles");
    expect(returned.location.pathname).toBe("/ops/config/bundles");
    expect(returned.selectedObjectId).toBe("bundle-routing-core-v7");
  });

  it("requires acknowledgement before the approval anchor becomes dominant", () => {
    const promotions = navigateGovernanceShell(
      createInitialGovernanceShellState("/ops/access/roles"),
      "/ops/access/reviews",
    );
    const acknowledged = acknowledgeGovernanceReview(promotions);
    const snapshot = resolveGovernanceShellSnapshot(acknowledged, 1440);

    expect(promotions.continuitySnapshot.currentStub?.replacementAnchorRef).toContain(
      "governance-approval",
    );
    expect(acknowledged.continuitySnapshot.currentStub).toBeNull();
    expect(snapshot.hasPendingReplacement).toBe(false);
  });
});
