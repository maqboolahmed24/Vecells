import { describe, expect, it } from "vitest";
import {
  createInitialPharmacyShellState,
  openPharmacyChildRoute,
  parsePharmacyPath,
  resolvePharmacyShellSnapshot,
  returnFromPharmacyChildRoute,
  selectPharmacyCheckpoint,
  selectPharmacyLineItem,
} from "./pharmacy-shell-seed.model";

describe("pharmacy shell seed model", () => {
  it("parses queue, case, and child routes into the canonical pharmacy route family", () => {
    expect(parsePharmacyPath("/workspace/pharmacy")).toMatchObject({
      routeKey: "lane",
      routeFamilyRef: "rf_pharmacy_console",
      pharmacyCaseId: null,
      childRouteKey: null,
    });

    expect(parsePharmacyPath("/workspace/pharmacy/PHC-2072/handoff")).toMatchObject({
      routeKey: "handoff",
      routeFamilyRef: "rf_pharmacy_console",
      pharmacyCaseId: "PHC-2072",
      childRouteKey: "handoff",
    });
  });

  it("returns from child routes through the pharmacy return token while preserving case context", () => {
    const board = createInitialPharmacyShellState("/workspace/pharmacy/PHC-2081", {
      activeCheckpointId: "inventory",
      activeLineItemId: "PHC-2081-L2",
    });
    const withCheckpoint = selectPharmacyCheckpoint(board, "inventory");
    const withLineItem = selectPharmacyLineItem(withCheckpoint, "PHC-2081-L2");
    const child = openPharmacyChildRoute(withLineItem, "inventory");
    const returned = returnFromPharmacyChildRoute(child);

    expect(child.location.routeKey).toBe("inventory");
    expect(returned.location.pathname).toBe("/workspace/pharmacy/PHC-2081");
    expect(returned.activeCheckpointId).toBe("inventory");
    expect(returned.activeLineItemId).toBe("PHC-2081-L2");
  });

  it("keeps weak-match review table-first and urgent return recovery-only", () => {
    const weakMatch = createInitialPharmacyShellState("/workspace/pharmacy/PHC-2124/resolve");
    const urgentReturn = createInitialPharmacyShellState("/workspace/pharmacy/PHC-2103/assurance");

    expect(resolvePharmacyShellSnapshot(weakMatch, 1440)).toMatchObject({
      visualizationMode: "table_only",
      recoveryPosture: "read_only",
    });
    expect(resolvePharmacyShellSnapshot(urgentReturn, 1440)).toMatchObject({
      visualizationMode: "summary_only",
      recoveryPosture: "recovery_only",
    });
  });
});
