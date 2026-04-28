import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OperationsShellSeedDocument } from "./operations-shell-seed";
import { createInitialOpsShellState } from "./operations-shell-seed.model";

function render(pathname: string, viewportWidth: number) {
  const state = createInitialOpsShellState(pathname);
  return renderToStaticMarkup(
    <OperationsShellSeedDocument
      state={state}
      viewportWidth={viewportWidth}
      onNavigate={() => undefined}
      onSelectAnomaly={() => undefined}
      onSetDeltaGate={() => undefined}
      onReturn={() => undefined}
      onOpenGovernance={() => undefined}
      onCloseGovernance={() => undefined}
    />,
  );
}

describe("operations shell accessibility surface", () => {
  it("renders the expected landmarks and table fallbacks", () => {
    const html = render("/ops/overview", 1440);
    expect(html).toContain('role="banner"');
    expect(html).toContain('role="main"');
    expect(html).toContain('aria-label="Operations lenses"');
    expect(html).toContain("Promoted anomaly ranking fallback");
    expect(html).toContain("Service health fallback");
  });

  it("keeps table-only posture explicit inside the same shell", () => {
    const state = createInitialOpsShellState("/ops/dependencies", {
      deltaGateState: "table_only",
      selectedAnomalyId: "ops-route-04",
    });
    const html = renderToStaticMarkup(
      <OperationsShellSeedDocument
        state={state}
        viewportWidth={1440}
        onNavigate={() => undefined}
        onSelectAnomaly={() => undefined}
        onSetDeltaGate={() => undefined}
        onReturn={() => undefined}
        onOpenGovernance={() => undefined}
        onCloseGovernance={() => undefined}
      />,
    );

    expect(html).toContain('data-parity-mode="table_only"');
    expect(html).toContain("Telemetry log");
  });

  it("folds to mission_stack on narrow layouts without losing the same shell root", () => {
    const html = render("/ops/resilience/health/ops-route-18", 720);
    expect(html).toContain('data-layout-mode="mission_stack"');
    expect(html).toContain('data-testid="ops-shell-root"');
  });
});
