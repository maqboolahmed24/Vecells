import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HubShellSeedDocument } from "./hub-shell-seed";
import { createInitialHubShellState } from "./hub-shell-seed.model";
import { createInitialHubCommitUiState } from "./hub-commit-confirmation-pane";

function render(pathname: string, viewportWidth: number) {
  const state = createInitialHubShellState(pathname);
  return renderToStaticMarkup(
    <HubShellSeedDocument
      state={state}
      commitUiState={createInitialHubCommitUiState()}
      viewportWidth={viewportWidth}
      reducedMotion="respect"
      drawerOpen={false}
      breakGlassModalOpen={false}
      selectedBreakGlassReasonId="urgent_clinical_safety"
      onNavigate={() => undefined}
      onOpenScopeDrawer={() => undefined}
      onCloseScopeDrawer={() => undefined}
      onSelectSavedView={() => undefined}
      onSelectFilter={() => undefined}
      onSelectCase={() => undefined}
      onSelectException={() => undefined}
      onSelectOrganisation={() => undefined}
      onSelectSite={() => undefined}
      onSelectPurpose={() => undefined}
      onOpenBreakGlass={() => undefined}
      onCloseBreakGlass={() => undefined}
      onSelectBreakGlassReason={() => undefined}
      onConfirmBreakGlass={() => undefined}
      onRevokeBreakGlass={() => undefined}
      onOpenCase={() => undefined}
      onSelectOption={() => undefined}
      onBufferQueueDelta={() => undefined}
      onApplyQueueDelta={() => undefined}
      onReturn={() => undefined}
      onBeginNativeBooking={() => undefined}
      onAttachManualProof={() => undefined}
      onCancelManualProof={() => undefined}
      onRecordSupplierConfirmation={() => undefined}
      onAcknowledgePractice={() => undefined}
      onToggleImportedReview={() => undefined}
      onToggleContinuityDrawer={() => undefined}
    />,
  );
}

describe("hub shell accessibility surface", () => {
  it("renders landmarks and a single dominant start-of-day region", () => {
    const html = render("/hub/queue", 1440);

    expect(html).toContain('role="banner"');
    expect(html).toContain('role="main"');
    expect(html).toContain('aria-label="Hub shell navigation"');
    expect(html).toContain('data-dominant-region="true"');
    expect(html).toContain('data-hub-start-of-day="true"');
    expect(html).toContain('data-testid="hub-shell-root"');
    expect(html).toContain('data-testid="HubActingContextChip"');
    expect(html).toContain('data-testid="HubScopeSummaryStrip"');
  });

  it("keeps exception handling explicit as a table-first same-shell posture", () => {
    const html = render("/hub/exceptions", 1440);

    expect(html).toContain('data-view-mode="exceptions"');
    expect(html).toContain('data-artifact-mode="table_only"');
    expect(html).toContain('data-testid="HubExceptionQueueView"');
    expect(html).toContain('data-selected-exception-id="exc-callback-052"');
  });

  it("renders recovery-specific markers for callback and urgent return cases", () => {
    const callbackHtml = render("/hub/case/hub-case-052", 1440);
    const urgentHtml = render("/hub/case/hub-case-031", 1440);

    expect(callbackHtml).toContain('data-testid="HubNoSlotResolutionPanel"');
    expect(callbackHtml).toContain('data-callback-transfer="pending"');
    expect(urgentHtml).toContain('data-testid="HubReturnToPracticeReceipt"');
    expect(urgentHtml).toContain('data-supervisor-escalation="true"');
  });

  it("folds to mission_stack on narrow layouts without losing the shell root", () => {
    const html = render("/hub/audit/hub-case-066", 720);

    expect(html).toContain('data-layout-mode="mission_stack"');
    expect(html).toContain('data-testid="hub-shell-root"');
    expect(html).toContain('data-shell-status="shell_read_only"');
  });

  it("renders current acting scope metadata on the shell root", () => {
    const html = render("/hub/case/hub-case-104", 1440);

    expect(html).toContain('data-acting-organisation="north_shore_hub"');
    expect(html).toContain('data-acting-site="north_shore_coordination_desk"');
    expect(html).toContain('data-purpose-of-use="direct_care_coordination"');
    expect(html).toContain('data-break-glass-state="inactive"');
  });
});
