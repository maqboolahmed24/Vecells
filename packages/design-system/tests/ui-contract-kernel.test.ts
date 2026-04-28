import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  resolveStatePrecedence,
  uiContractAccessibilityArtifact,
  uiContractAutomationAnchorArtifact,
  uiContractKernelPublication,
  uiContractLintVerdictArtifact,
  uiContractSurfaceStateKernelBindingRows,
} from "../src/index.tsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

type SchemaDef = {
  required?: string[];
  properties?: Record<
    string,
    {
      type?: string;
      enum?: readonly string[];
      items?: { type?: string; enum?: readonly string[] };
    }
  >;
};

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;
}

function validateAgainstSchemaDef(def: SchemaDef, value: Record<string, unknown>): void {
  for (const requiredKey of def.required ?? []) {
    expect(value).toHaveProperty(requiredKey);
  }

  for (const [key, propertySchema] of Object.entries(def.properties ?? {})) {
    if (!(key in value)) {
      continue;
    }
    const propertyValue = value[key];
    if (propertySchema.type === "string") {
      expect(typeof propertyValue).toBe("string");
    }
    if (propertySchema.type === "number") {
      expect(typeof propertyValue).toBe("number");
    }
    if (propertySchema.type === "array") {
      expect(Array.isArray(propertyValue)).toBe(true);
      if (propertySchema.items?.type === "string") {
        for (const entry of propertyValue as string[]) {
          expect(typeof entry).toBe("string");
          if (propertySchema.items.enum) {
            expect(propertySchema.items.enum).toContain(entry);
          }
        }
      }
    }
    if (propertySchema.enum) {
      expect(propertySchema.enum).toContain(propertyValue as string);
    }
  }
}

describe("ui contract kernel", () => {
  it("matches the committed par_104 artifacts and csv", () => {
    const publication = readJson<typeof uiContractKernelPublication>(
      "data/analysis/design_contract_publication_bundle.json",
    );
    const lint = readJson<typeof uiContractLintVerdictArtifact>(
      "data/analysis/design_contract_lint_verdicts.json",
    );
    const automation = readJson<typeof uiContractAutomationAnchorArtifact>(
      "data/analysis/automation_anchor_maps.json",
    );
    const accessibility = readJson<typeof uiContractAccessibilityArtifact>(
      "data/analysis/accessibility_semantic_coverage_profiles.json",
    );
    const csv = fs.readFileSync(
      path.join(ROOT, "data", "analysis", "surface_state_kernel_bindings.csv"),
      "utf8",
    );

    expect(publication.summary).toEqual(uiContractKernelPublication.summary);
    expect(publication.designContractPublicationBundles).toEqual(
      uiContractKernelPublication.designContractPublicationBundles,
    );
    expect(lint.designContractLintVerdicts).toEqual(
      uiContractLintVerdictArtifact.designContractLintVerdicts,
    );
    expect(automation.automationAnchorMaps).toEqual(
      uiContractAutomationAnchorArtifact.automationAnchorMaps,
    );
    expect(accessibility.accessibilitySemanticCoverageProfiles).toEqual(
      uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles,
    );
    expect(csv).toContain(
      "surface_state_kernel_binding_id,route_family_ref,audience_surface,shell_type,binding_state",
    );
    expect(csv.trim().split("\n")).toHaveLength(uiContractSurfaceStateKernelBindingRows.length + 1);
  });

  it("validates every published contract family against the composite schema defs", () => {
    const schema = readJson<{
      $defs: Record<string, SchemaDef>;
    }>("packages/design-system/contracts/ui-contract-kernel.schema.json");

    const families: Array<[string, readonly Record<string, unknown>[]]> = [
      ["VisualTokenProfile", uiContractKernelPublication.visualTokenProfiles as Record<string, unknown>[]],
      [
        "SurfaceStateSemanticsProfile",
        uiContractKernelPublication.surfaceStateSemanticsProfiles as Record<string, unknown>[],
      ],
      [
        "SurfaceStateKernelBinding",
        uiContractKernelPublication.surfaceStateKernelBindings as Record<string, unknown>[],
      ],
      ["AutomationAnchorMap", uiContractAutomationAnchorArtifact.automationAnchorMaps as Record<string, unknown>[]],
      [
        "TelemetryBindingProfile",
        uiContractKernelPublication.telemetryBindingProfiles as Record<string, unknown>[],
      ],
      [
        "ArtifactModePresentationProfile",
        uiContractKernelPublication.artifactModePresentationProfiles as Record<string, unknown>[],
      ],
      [
        "DesignContractVocabularyTuple",
        uiContractKernelPublication.designContractVocabularyTuples as Record<string, unknown>[],
      ],
      [
        "DesignContractPublicationBundle",
        uiContractKernelPublication.designContractPublicationBundles as Record<string, unknown>[],
      ],
      [
        "DesignContractLintVerdict",
        uiContractLintVerdictArtifact.designContractLintVerdicts as Record<string, unknown>[],
      ],
      [
        "AccessibilitySemanticCoverageProfile",
        uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles as Record<string, unknown>[],
      ],
    ];

    for (const [defName, rows] of families) {
      const def = schema.$defs[defName];
      expect(def).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        validateAgainstSchemaDef(def, row);
      }
    }
  });

  it("resolves precedence with the canonical blocked, stale, and read-only rules", () => {
    const blocked = resolveStatePrecedence({
      postureState: "blocked_recovery",
      stateClass: "blocked",
      freshnessState: "stale",
      trustState: "degraded",
      settlementState: "review_required",
      writableState: "blocked",
      artifactModeState: "blocked",
      accentTone: "accent_active",
    });
    expect(blocked.effectiveDisplayState).toBe("blocked");
    expect(blocked.effectiveSeverity).toBe(5);
    expect(blocked.ariaLiveMode).toBe("assertive");
    expect(blocked.motionIntentRef).toBe("motion.escalate");

    const stale = resolveStatePrecedence({
      postureState: "stale_review",
      stateClass: "stale",
      freshnessState: "aging",
      trustState: "partial",
      settlementState: "review_required",
      writableState: "read_only",
      artifactModeState: "preview_verified",
      accentTone: "accent_success",
    });
    expect(stale.effectiveDisplayState).toBe("stale");
    expect(stale.effectiveTone).toBe("accent_review");
    expect(stale.ariaLiveMode).toBe("assertive");

    const readOnly = resolveStatePrecedence({
      postureState: "read_only",
      stateClass: "settled",
      freshnessState: "fresh",
      trustState: "trusted",
      settlementState: "settled",
      writableState: "read_only",
      artifactModeState: "preview_verified",
      accentTone: "accent_success",
    });
    expect(readOnly.effectiveDisplayState).toBe("read_only");
    expect(readOnly.effectiveTone).toBe("neutral");
    expect(readOnly.motionIntentRef).toBe("motion.degrade");
  });

  it("keeps lint verdicts and kernel bindings aligned with the published summary counts", () => {
    const exact = uiContractKernelPublication.surfaceStateKernelBindings.filter(
      (row) => row.bindingState === "exact",
    );
    const stale = uiContractKernelPublication.surfaceStateKernelBindings.filter(
      (row) => row.bindingState === "stale",
    );
    const blocked = uiContractKernelPublication.surfaceStateKernelBindings.filter(
      (row) => row.bindingState === "blocked",
    );
    const lintPass = uiContractLintVerdictArtifact.designContractLintVerdicts.filter(
      (row) => row.result === "pass",
    );

    expect(exact).toHaveLength(uiContractKernelPublication.summary.exact_binding_count);
    expect(stale).toHaveLength(uiContractKernelPublication.summary.stale_binding_count);
    expect(blocked).toHaveLength(uiContractKernelPublication.summary.blocked_binding_count);
    expect(lintPass).toHaveLength(uiContractKernelPublication.summary.lint_pass_count);
    expect(
      uiContractAccessibilityArtifact.accessibilitySemanticCoverageProfiles.filter(
        (row) => row.coverageState === "complete",
      ),
    ).toHaveLength(uiContractKernelPublication.summary.accessibility_complete_count);
  });
});
