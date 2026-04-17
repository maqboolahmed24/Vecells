import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ACCESSIBILITY_HARNESS_TASK_ID,
  ACCESSIBILITY_HARNESS_VISUAL_MODE,
  ARTIFACT_SHELL_TASK_ID,
  ARTIFACT_SHELL_VISUAL_MODE,
  STATUS_TRUTH_TASK_ID,
  STATUS_TRUTH_VISUAL_MODE,
  accessibilityHarnessCatalog,
  accessibilityHarnessPublication,
  assistiveAnnouncementExampleArtifact,
  artifactShellSpecimens,
  bootstrapSharedPackage,
  canonicalDesignTokenExportArtifact,
  componentPrimitiveCatalog,
  componentPrimitivePublication,
  componentPrimitiveSchemas,
  composeStatusSentence,
  designContractPublicationCatalog,
  designContractPublicationSchemas,
  designTokenFoundationCatalog,
  designTokenFoundationSchemas,
  ownedContractFamilies,
  ownedObjectFamilies,
  packageContract,
  profileSelectionResolutions,
  tokenKernelLayeringPolicy,
  uiContractKernelCatalog,
  uiContractKernelPublication,
  uiContractKernelSchemas,
  statusTruthSpecimens,
} from "../src/index.tsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

describe("public package surface", () => {
  it("boots through documented public contracts", () => {
    expect(packageContract.packageName).toBe("@vecells/design-system");
    expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
    expect(Array.isArray(ownedObjectFamilies)).toBe(true);
    expect(Array.isArray(ownedContractFamilies)).toBe(true);
  });

  it("publishes the seq_052 design contract schema surface", () => {
    expect(designContractPublicationCatalog.taskId).toBe("seq_052");
    expect(designContractPublicationCatalog.bundleCount).toBe(9);
    expect(designContractPublicationCatalog.vocabularyTupleCount).toBe(19);
    expect(designContractPublicationSchemas).toHaveLength(1);

    const schemaPath = path.join(ROOT, designContractPublicationSchemas[0].artifactPath);
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it("publishes the par_103 token foundation schema and canonical export", () => {
    expect(designTokenFoundationCatalog.taskId).toBe("par_103");
    expect(designTokenFoundationCatalog.profileSelectionResolutionCount).toBe(8);
    expect(designTokenFoundationCatalog.supportedModeTupleCount).toBe(36);
    expect(designTokenFoundationSchemas).toHaveLength(1);
    expect(canonicalDesignTokenExportArtifact.designTokenExportArtifactId).toBe(
      "DTEA_SIGNAL_ATLAS_LIVE_CANONICAL_V1",
    );
    expect(tokenKernelLayeringPolicy.tokenKernelLayeringPolicyId).toBe("TKLP_SIGNAL_ATLAS_LIVE_V1");
    expect(profileSelectionResolutions).toHaveLength(8);

    const schemaPath = path.join(ROOT, designTokenFoundationSchemas[0].artifactPath);
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it("publishes the par_104 UI contract kernel schema and generated bundle surface", () => {
    expect(uiContractKernelCatalog.taskId).toBe("par_104");
    expect(uiContractKernelCatalog.bundleCount).toBe(9);
    expect(uiContractKernelCatalog.routeFamilyCount).toBe(19);
    expect(uiContractKernelCatalog.exactBindingCount).toBe(14);
    expect(uiContractKernelCatalog.blockedBindingCount).toBe(4);
    expect(uiContractKernelCatalog.lintPassCount).toBe(5);
    expect(uiContractKernelSchemas).toHaveLength(1);
    expect(uiContractKernelPublication.summary.stale_binding_count).toBe(1);
    expect(uiContractKernelPublication.summary.lint_blocked_count).toBe(4);

    const schemaPath = path.join(ROOT, uiContractKernelSchemas[0].artifactPath);
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it("publishes the par_105 component primitive schema and generated atlas surface", () => {
    expect(componentPrimitiveCatalog.taskId).toBe("par_105");
    expect(componentPrimitiveCatalog.componentCount).toBe(38);
    expect(componentPrimitiveCatalog.specimenCount).toBe(4);
    expect(componentPrimitiveCatalog.surfaceRoleCount).toBe(14);
    expect(componentPrimitiveCatalog.shellProfileCount).toBe(8);
    expect(componentPrimitiveCatalog.blockedRouteBindingCount).toBe(2);
    expect(componentPrimitiveSchemas).toHaveLength(1);
    expect(componentPrimitivePublication.summary.gap_resolution_count).toBe(3);
    expect(componentPrimitivePublication.summary.follow_on_dependency_count).toBe(3);

    const schemaPath = path.join(ROOT, componentPrimitiveSchemas[0].artifactPath);
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  it("publishes the par_107 status truth surface for shared shell status components", () => {
    expect(STATUS_TRUTH_TASK_ID).toBe("par_107");
    expect(STATUS_TRUTH_VISUAL_MODE).toBe("Status_Truth_Lab");
    expect(statusTruthSpecimens).toHaveLength(6);
    expect(composeStatusSentence(statusTruthSpecimens[0].statusInput).stateSummary).toContain(
      "waiting",
    );
  });

  it("publishes the par_109 artifact shell surface for governed artifact presentation", () => {
    expect(ARTIFACT_SHELL_TASK_ID).toBe("par_109");
    expect(ARTIFACT_SHELL_VISUAL_MODE).toBe("Artifact_Studio");
    expect(artifactShellSpecimens).toHaveLength(6);
    expect(artifactShellSpecimens[0].binding.routeFamilyRef).toBe("rf_patient_appointment_receipt");
    expect(artifactShellSpecimens[3].context.artifactModeRequest).toBe("external_handoff");
  });

  it("publishes the par_111 accessibility harness surface for shared semantic coverage", () => {
    expect(ACCESSIBILITY_HARNESS_TASK_ID).toBe("par_111");
    expect(ACCESSIBILITY_HARNESS_VISUAL_MODE).toBe("Accessibility_Control_Deck");
    expect(accessibilityHarnessCatalog.routeProfileCount).toBe(19);
    expect(accessibilityHarnessCatalog.scenarioCount).toBe(6);
    expect(accessibilityHarnessCatalog.focusTransitionContractCount).toBe(133);
    expect(accessibilityHarnessCatalog.keyboardInteractionContractCount).toBe(19);
    expect(accessibilityHarnessPublication.summary.complete_count).toBe(15);
    expect(accessibilityHarnessPublication.harness_summary.blocked_keyboard_contract_count).toBe(1);
    expect(assistiveAnnouncementExampleArtifact.summary.current_count).toBe(6);
  });
});
