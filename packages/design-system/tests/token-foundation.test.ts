import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildDesignTokenFoundationArtifact,
  buildFoundationStylesheet,
  buildProfileSelectionResolutionPayload,
  buildSignalAtlasLiveMarkSvg,
  buildTokenContrastMatrixRows,
  buildTokenModeCoverageRows,
  canonicalDesignTokenExportArtifact,
  contrastRatio,
  profileSelectionResolutions,
  resolveModeTokens,
  tokenKernelLayeringPolicy,
} from "../src/token-foundation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");

describe("token foundation", () => {
  it("publishes one canonical export artifact with stable coverage counts", () => {
    const artifact = buildDesignTokenFoundationArtifact();

    expect(artifact.task_id).toBe("par_103");
    expect(artifact.designTokenFoundation.designTokenFoundationRef).toBe(
      "DTF_SIGNAL_ATLAS_LIVE_QUIET_CLARITY_V1",
    );
    expect(canonicalDesignTokenExportArtifact.designTokenExportArtifactId).toBe(
      "DTEA_SIGNAL_ATLAS_LIVE_CANONICAL_V1",
    );
    expect(tokenKernelLayeringPolicy.requiredAliasOrder).toBe("ref_to_sys_to_comp_to_profile");
    expect(artifact.summary.supported_mode_tuple_count).toBe(36);
    expect(artifact.summary.profile_selection_resolution_count).toBe(8);
    expect(profileSelectionResolutions).toHaveLength(8);
  });

  it("keeps density and motion resolution on the same graph", () => {
    const relaxed = resolveModeTokens({
      theme: "light",
      contrast: "standard",
      density: "relaxed",
      motion: "full",
    });
    const compact = resolveModeTokens({
      theme: "light",
      contrast: "standard",
      density: "compact",
      motion: "essential_only",
    });

    expect(relaxed.density.controlHeightPublic).toBe("52px");
    expect(compact.density.controlHeightPublic).toBe("44px");
    expect(relaxed.motion.translateDistance).toBe("8px");
    expect(compact.motion.translateDistance).toBe("0px");
  });

  it("meets the published contrast floors", () => {
    const rows = buildTokenContrastMatrixRows();
    expect(rows.length).toBeGreaterThanOrEqual(60);
    expect(rows.every((row) => row.status === "pass")).toBe(true);
    expect(contrastRatio("#0F1720", "#FFFFFF")).toBeGreaterThan(15);
  });

  it("exposes a full mode matrix without gaps", () => {
    const rows = buildTokenModeCoverageRows();
    const uniqueIds = new Set(rows.map((row) => row.mode_tuple_id));
    expect(rows).toHaveLength(36);
    expect(uniqueIds.size).toBe(36);
    expect(rows.every((row) => row.status === "supported")).toBe(true);
  });

  it("matches the committed artifact, stylesheet, and mark surfaces", () => {
    const artifactPath = path.join(ROOT, "data", "analysis", "design_token_export_artifact.json");
    const resolutionPath = path.join(ROOT, "data", "analysis", "profile_selection_resolutions.json");
    const contrastPath = path.join(ROOT, "data", "analysis", "token_contrast_matrix.csv");
    const modePath = path.join(ROOT, "data", "analysis", "token_mode_coverage_matrix.csv");
    const stylesheetPath = path.join(ROOT, "packages", "design-system", "src", "foundation.css");
    const brandPath = path.join(ROOT, "assets", "brand", "signal-atlas-live-mark.svg");

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const resolutionPayload = JSON.parse(fs.readFileSync(resolutionPath, "utf8"));
    const contrastCsv = fs.readFileSync(contrastPath, "utf8");
    const modeCsv = fs.readFileSync(modePath, "utf8");
    const stylesheet = fs.readFileSync(stylesheetPath, "utf8");
    const brandMark = fs.readFileSync(brandPath, "utf8");

    expect(artifact.designTokenExportArtifact.designTokenExportArtifactId).toBe(
      canonicalDesignTokenExportArtifact.designTokenExportArtifactId,
    );
    expect(artifact.designTokenExportArtifact.tokenValueDigestRef).toBe(
      canonicalDesignTokenExportArtifact.tokenValueDigestRef,
    );
    expect(resolutionPayload.profileSelectionResolutions).toHaveLength(8);
    expect(contrastCsv).toContain("contrast_matrix_id,theme,contrast,semantic_role");
    expect(modeCsv).toContain("mode_tuple_id,theme,contrast,density,motion");
    expect(stylesheet).toContain("--sys-surface-canvas");
    expect(stylesheet).toContain('body[data-motion="essential_only"]');
    expect(brandMark.trim()).toBe(buildSignalAtlasLiveMarkSvg().trim());
  });

  it("publishes a deterministic profile resolution payload digest", () => {
    const payload = buildProfileSelectionResolutionPayload();
    expect(payload.summary.shell_profile_count).toBe(8);
    expect(payload.summary.profile_digest_ref).toHaveLength(16);
  });

  it("keeps the generated stylesheet markers stable", () => {
    const stylesheet = buildFoundationStylesheet();
    expect(stylesheet).toContain(".specimen-page");
    expect(stylesheet).toContain(".semantic-state-wall");
    expect(stylesheet).toContain(".motion-grid");
    expect(stylesheet).toContain(".responsive-frame-grid");
  });
});
