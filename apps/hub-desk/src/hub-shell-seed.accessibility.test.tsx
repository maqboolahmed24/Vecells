import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HubShellSeedDocument } from "./hub-shell-seed";
import { createInitialHubShellState } from "./hub-shell-seed.model";

function render(pathname: string, viewportWidth: number) {
  const state = createInitialHubShellState(pathname);
  return renderToStaticMarkup(
    <HubShellSeedDocument
      state={state}
      viewportWidth={viewportWidth}
      onNavigate={() => undefined}
      onSelectCase={() => undefined}
      onSelectOption={() => undefined}
      onSetExceptionFilter={() => undefined}
      onReturn={() => undefined}
    />,
  );
}

describe("hub shell accessibility surface", () => {
  it("renders landmarks and the queue-first option truth surface", () => {
    const html = render("/hub/queue", 1440);

    expect(html).toContain('role="banner"');
    expect(html).toContain('role="main"');
    expect(html).toContain('aria-label="Hub shell routes"');
    expect(html).toContain("CasePulse");
    expect(html).toContain('data-testid="hub-shell-root"');
  });

  it("keeps exception handling explicit as a table-first same-shell posture", () => {
    const html = render("/hub/exceptions", 1440);

    expect(html).toContain('data-view-mode="exceptions"');
    expect(html).toContain('data-artifact-mode="table_only"');
    expect(html).toContain("Confirmation, acknowledgement, and fallback blockers");
  });

  it("folds to mission_stack on narrow layouts without losing the shell root", () => {
    const html = render("/hub/audit/hub-case-066", 720);

    expect(html).toContain('data-layout-mode="mission_stack"');
    expect(html).toContain('data-testid="hub-shell-root"');
  });
});
