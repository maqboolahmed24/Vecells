import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PharmacyShellSeedDocument } from "./pharmacy-shell-seed";
import { createInitialPharmacyShellState } from "./pharmacy-shell-seed.model";

function render(pathname: string, viewportWidth: number) {
  const state = createInitialPharmacyShellState(pathname);
  return renderToStaticMarkup(
    <PharmacyShellSeedDocument
      state={state}
      viewportWidth={viewportWidth}
      onNavigate={() => undefined}
      onOpenCase={() => undefined}
      onSelectCheckpoint={() => undefined}
      onSelectLineItem={() => undefined}
      onOpenChildRoute={() => undefined}
      onReturn={() => undefined}
    />,
  );
}

describe("pharmacy shell accessibility surface", () => {
  it("renders the expected landmarks and keeps diagnostic matrices out of the default shell", () => {
    const html = render("/workspace/pharmacy", 1440);

    expect(html).toContain('role="banner"');
    expect(html).toContain('role="main"');
    expect(html).toContain('data-testid="pharmacy-shell-root"');
    expect(html).toContain('data-testid="shared-status-strip"');
    expect(html).toContain('data-testid="case-pulse"');
    expect(html).toContain("Checkpoint rail");
    expect(html).not.toContain("Checkpoint and proof matrix");
    expect(html).not.toContain('data-testid="pharmacy-telemetry-log"');
  });

  it("keeps table-only inventory review explicit inside the same shell", () => {
    const html = render("/workspace/pharmacy/PHC-2124/inventory", 1440);

    expect(html).toContain('data-visualization-mode="table_only"');
    expect(html).toContain('data-testid="pharmacy-inventory-route"');
    expect(html).toContain('data-promoted-support-region="inventory_comparison"');
    expect(html).toContain('data-testid="InventoryTruthPanel"');
    expect(html).toContain('data-testid="InventoryComparisonWorkspace"');
    expect(html).toContain("comparison workspace");
  });

  it("folds to mission_stack and recovery-only posture for urgent return", () => {
    const html = render("/workspace/pharmacy/PHC-2103/assurance", 820);

    expect(html).toContain('data-layout-mode="mission_stack"');
    expect(html).toContain('data-recovery-posture="recovery_only"');
    expect(html).toContain('data-testid="pharmacy-assurance-route"');
  });
});
