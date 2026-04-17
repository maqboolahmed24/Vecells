import { describe, expect, it } from "vitest";
import {
  createInitialPharmacyShellState,
  openPharmacyCase,
  openPharmacyChildRoute,
  resolvePharmacyShellSnapshot,
  returnFromPharmacyChildRoute,
  selectPharmacyCheckpoint,
  selectPharmacyLineItem,
} from "./pharmacy-shell-seed.model";

describe("pharmacy shell continuity integration", () => {
  it("preserves the same continuity frame from queue root to child-route review", () => {
    const root = createInitialPharmacyShellState("/workspace/pharmacy");
    const opened = openPharmacyCase(root, "PHC-2057");
    const child = openPharmacyChildRoute(opened, "handoff");

    expect(root.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("pharmacy.console");
    expect(opened.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("pharmacy.console");
    expect(child.continuitySnapshot.selectedAnchor.continuityFrameRef).toBe("pharmacy.console");
    expect(child.location.routeKey).toBe("handoff");
  });

  it("reopens the exact checkpoint and line item after return-safe review", () => {
    const board = createInitialPharmacyShellState("/workspace/pharmacy/PHC-2090");
    const selectedCheckpoint = selectPharmacyCheckpoint(board, "consent");
    const selectedLineItem = selectPharmacyLineItem(selectedCheckpoint, "PHC-2090-L1");
    const child = openPharmacyChildRoute(selectedLineItem, "validate");
    const returned = returnFromPharmacyChildRoute(child);

    expect(returned.activeCheckpointId).toBe("consent");
    expect(returned.activeLineItemId).toBe("PHC-2090-L1");
    expect(returned.location.routeKey).toBe("case");
  });

  it("drops to mission_stack on narrow viewports without changing shell ownership", () => {
    const state = createInitialPharmacyShellState("/workspace/pharmacy/PHC-2103/assurance");
    const snapshot = resolvePharmacyShellSnapshot(state, 820);

    expect(snapshot.layoutMode).toBe("mission_stack");
    expect(snapshot.routeShellPosture).toBe("shell_recovery");
    expect(snapshot.location.routeFamilyRef).toBe("rf_pharmacy_console");
  });
});
