import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GovernanceShellSeedDocument } from "./governance-shell-seed";
import { createInitialGovernanceShellState } from "./governance-shell-seed.model";

function render(pathname: string, viewportWidth: number) {
  const state = createInitialGovernanceShellState(pathname);
  return renderToStaticMarkup(
    <GovernanceShellSeedDocument
      state={state}
      viewportWidth={viewportWidth}
      onNavigate={() => undefined}
      onSelectObject={() => undefined}
      onSetDisposition={() => undefined}
      onSetSupportRegion={() => undefined}
      onReturn={() => undefined}
      onAcknowledge={() => undefined}
    />,
  );
}

describe("governance shell accessibility surface", () => {
  it("renders banner, main, scope ribbon, and approval reading order markers", () => {
    const html = render("/ops/config/promotions", 1440);

    expect(html).toContain('role="banner"');
    expect(html).toContain('role="main"');
    expect(html).toContain('data-testid="governance-scope-ribbon"');
    expect(html).toContain('data-testid="governance-approval-stepper"');
    expect(html).toContain("Promotion review");
  });

  it("keeps the same shell root and mission_stack posture on narrow layouts", () => {
    const html = render("/ops/governance/compliance", 720);

    expect(html).toContain('data-layout-mode="mission_stack"');
    expect(html).toContain('data-testid="governance-shell-root"');
    expect(html).toContain('data-testid="governance-evidence-panel"');
  });

  it("keeps blocked posture explicit inside the same shell", () => {
    const state = createInitialGovernanceShellState("/ops/access/reviews", {
      freezeDisposition: "scope_drift",
    });
    const html = renderToStaticMarkup(
      <GovernanceShellSeedDocument
        state={state}
        viewportWidth={1440}
        onNavigate={() => undefined}
        onSelectObject={() => undefined}
        onSetDisposition={() => undefined}
        onSetSupportRegion={() => undefined}
        onReturn={() => undefined}
        onAcknowledge={() => undefined}
      />,
    );

    expect(html).toContain('data-freeze-disposition="scope_drift"');
    expect(html).toContain("Scope revalidation required");
    expect(html).toContain('data-recovery-posture="blocked"');
  });
});
