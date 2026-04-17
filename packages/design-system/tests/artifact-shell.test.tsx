import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ArtifactSurfaceFrame,
  artifactShellSpecimens,
  resolveArtifactModeTruth,
  validateArtifactTruthTuple,
} from "../src/index.tsx";

describe("artifact shell truth", () => {
  it("keeps governed preview available when verified parity and browser posture agree", () => {
    const projection = resolveArtifactModeTruth(artifactShellSpecimens[0]);

    expect(projection.currentMode).toBe("governed_preview");
    expect(projection.canPreview).toBe(true);
    expect(projection.canPrint).toBe(true);
    expect(projection.canHandoff).toBe(true);
    expect(projection.returnTruthState).toBe("return_safe");
  });

  it("surfaces provisional parity before the preview can be treated as authoritative", () => {
    const projection = resolveArtifactModeTruth(artifactShellSpecimens[1]);

    expect(projection.tone).toBe("caution");
    expect(projection.parityLabel).toBe("Parity stale");
    expect(projection.sourceAuthorityLabel).toBe("Provisional summary");
    expect(projection.reasonTrail.join(" ")).toContain("provisional");
  });

  it("fails closed to same-shell summary when the channel is embedded", () => {
    const projection = resolveArtifactModeTruth(artifactShellSpecimens[2]);

    expect(projection.currentMode).toBe("structured_summary");
    expect(projection.canPreview).toBe(false);
    expect(projection.canPrint).toBe(false);
    expect(projection.fallbackKind).toBe("summary_only");
    expect(projection.fallbackTrigger).toBe("embedded_limit");
  });

  it("degrades print posture in place when the grant expires", () => {
    const projection = resolveArtifactModeTruth(artifactShellSpecimens[4]);

    expect(projection.currentMode).toBe("recovery_only");
    expect(projection.canPrint).toBe(false);
    expect(projection.transferPosture).toBe("recovery_only");
    expect(projection.returnTruthState).toBe("return_blocked");
  });

  it("flags scope drift on active grants", () => {
    const issues = validateArtifactTruthTuple({
      ...artifactShellSpecimens[0],
      grant: {
        ...artifactShellSpecimens[0].grant,
        routeFamilyRef: "rf_other_surface",
      },
    });

    expect(issues.map((issue) => issue.code)).toContain("ARTIFACT_GRANT_SCOPE_MISMATCH");
  });

  it("renders stable DOM markers for artifact mode, parity, handoff, and recovery posture", () => {
    const html = renderToStaticMarkup(
      <ArtifactSurfaceFrame specimen={artifactShellSpecimens[3]} />,
    );

    expect(html).toContain('data-dom-marker="continuity-key"');
    expect(html).toContain('data-dom-marker="selected-anchor"');
    expect(html).toContain('data-dom-marker="artifact-mode"');
    expect(html).toContain('data-dom-marker="parity-digest"');
    expect(html).toContain('data-dom-marker="handoff-posture"');
    expect(html).toContain('data-handoff-posture="armed"');
    expect(html).toContain('data-return-truth-state="return_safe"');
  });
});
