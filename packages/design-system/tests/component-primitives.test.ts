import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildComponentPrimitiveArtifacts,
  componentPrimitiveContracts,
  renderAtlasSupplementalShelf,
  renderSpecimenComposition,
  resolvePrimitiveRouteBinding,
} from "../src/component-primitives.tsx";
import {
  componentPrimitiveAccessibilityCoverageRows,
  componentPrimitiveAutomationAnchorArtifact,
  componentPrimitiveBindingMatrixRows,
  componentPrimitivePublication,
} from "../src/component-primitives.generated.ts";
import {
  componentAliases,
  compositeTokens,
  primitiveTokenGroups,
} from "../src/token-foundation.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function readCsv(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("component primitives", () => {
  it("matches the committed par_105 publication and matrix artifacts", () => {
    const publication = readJson<typeof componentPrimitivePublication>(
      "data/analysis/component_primitive_publication.json",
    );
    const automation = readJson<typeof componentPrimitiveAutomationAnchorArtifact>(
      "data/analysis/component_automation_anchor_matrix.json",
    );
    const bindingCsv = readCsv("data/analysis/component_binding_matrix.csv");
    const accessibilityCsv = readCsv(
      "data/analysis/component_accessibility_coverage_matrix.csv",
    );

    expect(publication.summary).toEqual(componentPrimitivePublication.summary);
    expect(publication.componentContracts).toEqual(
      componentPrimitivePublication.componentContracts,
    );
    expect(automation.summary).toEqual(
      componentPrimitiveAutomationAnchorArtifact.summary,
    );
    expect(automation.componentAutomationAnchors).toEqual(
      componentPrimitiveAutomationAnchorArtifact.componentAutomationAnchors,
    );
    expect(bindingCsv.trim().split("\n")).toHaveLength(
      componentPrimitiveBindingMatrixRows.length + 1,
    );
    expect(accessibilityCsv.trim().split("\n")).toHaveLength(
      componentPrimitiveAccessibilityCoverageRows.length + 1,
    );
  });

  it("keeps every published token binding inside the par_103 token lattice", () => {
    const tokenRefs = new Set([
      ...primitiveTokenGroups.flatMap((group) => group.tokens.map((token) => token.tokenId)),
      ...componentAliases.map((token) => token.tokenId),
      ...compositeTokens.map((token) => token.tokenId),
    ]);

    for (const component of componentPrimitiveContracts) {
      for (const binding of component.tokenBindings) {
        expect(tokenRefs.has(binding.tokenRef)).toBe(true);
      }
    }
  });

  it("resolves specimen route bindings against the committed par_104 publication", () => {
    const patient = resolvePrimitiveRouteBinding("rf_patient_home");
    const operations = resolvePrimitiveRouteBinding("rf_operations_board");
    const governance = resolvePrimitiveRouteBinding("rf_governance_shell");

    expect(patient.scenario.bindingState).toBe("exact");
    expect(patient.accessibility.coverageState).toBe("complete");
    expect(operations.scenario.bindingState).toBe("blocked");
    expect(operations.accessibility.coverageState).toBe("degraded");
    expect(governance.bundle.designContractPublicationBundleId).toBe(
      "dcpb::governance_admin::planned",
    );
  });

  it("keeps visualization primitives on summary-and-table parity", () => {
    const visualizationComponents = componentPrimitiveContracts.filter(
      (component) => component.visualizationParity === "summary_and_table_fallback",
    );
    expect(visualizationComponents.map((component) => component.componentId)).toEqual([
      "ComparisonLedger",
      "BoundedVisualizationPanel",
    ]);

    for (const component of visualizationComponents) {
      for (const routeCoverage of component.accessibility.routeCoverage) {
        expect(routeCoverage.visualizationFallbackContractRefs.length).toBeGreaterThan(0);
        expect(routeCoverage.visualizationTableContractRefs.length).toBeGreaterThan(0);
      }
    }
  });

  it("renders specimens and the atlas shelf with required DOM markers and fallback content", () => {
    const operationsMarkup = renderToStaticMarkup(
      renderSpecimenComposition("Operations_Control_Room_Preview"),
    );
    const governanceMarkup = renderToStaticMarkup(
      renderSpecimenComposition("Governance_Approval_Frame"),
    );
    const shelfMarkup = renderToStaticMarkup(renderAtlasSupplementalShelf());

    expect(operationsMarkup).toContain('data-dom-marker="dominant-action"');
    expect(operationsMarkup).toContain('data-testid="operations-visualization"');
    expect(operationsMarkup).toContain('data-testid="visualization-summary"');
    expect(operationsMarkup).toContain('data-testid="visualization-table"');
    expect(governanceMarkup).toContain("Review approval summary");
    expect(governanceMarkup).toContain('data-dom-marker="selected-anchor"');
    expect(shelfMarkup).toContain("Control shelf");
    expect(shelfMarkup).toContain("Calm state transitions");
  });

  it("builds the par_105 summary counts without drift", () => {
    const artifacts = buildComponentPrimitiveArtifacts();

    expect(artifacts.publication.summary).toEqual({
      component_count: 38,
      specimen_count: 4,
      surface_role_count: 14,
      shell_profile_count: 8,
      route_binding_count: 4,
      exact_route_binding_count: 2,
      blocked_route_binding_count: 2,
      degraded_accessibility_route_count: 2,
      gap_resolution_count: 3,
      follow_on_dependency_count: 3,
    });
    expect(artifacts.bindingRows).toHaveLength(38);
    expect(artifacts.automationArtifact.summary.route_family_count).toBe(9);
    expect(artifacts.accessibilityRows).toHaveLength(38);
  });
});
