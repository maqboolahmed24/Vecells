import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  SurfaceStateFrame,
  resolveSurfacePostureClass,
  surfacePostureSpecimens,
  validateSurfacePostureContract,
} from "../src/index";

describe("surface posture precedence", () => {
  it("lets blocked recovery outrank stale or placeholder signals", () => {
    const resolution = resolveSurfacePostureClass({
      postureClass: "blocked_recovery",
      visibilityState: "placeholder_only",
      freshnessState: "blocked_recovery",
      actionabilityState: "blocked",
      contentDensity: "known_structure",
      degradedMode: "bounded_recovery",
      recoveryActions: surfacePostureSpecimens[5]?.recoveryActions ?? [],
    });

    expect(resolution.resolvedPostureClass).toBe("blocked_recovery");
  });

  it("keeps bounded recovery distinct from blocked recovery", () => {
    const resolution = resolveSurfacePostureClass({
      postureClass: "bounded_recovery",
      visibilityState: "full",
      freshnessState: "stale_review",
      actionabilityState: "recovery_only",
      contentDensity: "populated",
      degradedMode: "bounded_recovery",
      recoveryActions: surfacePostureSpecimens[9]?.recoveryActions ?? [],
    });

    expect(resolution.resolvedPostureClass).toBe("bounded_recovery");
  });

  it("flags contract tuples that try to bypass the shared taxonomy", () => {
    const issues = validateSurfacePostureContract({
      ...surfacePostureSpecimens[0]!,
      postureClass: "empty",
    });

    expect(issues.map((issue) => issue.code)).toContain("POSTURE_CLASS_MISMATCH");
  });
});

describe("surface posture rendering", () => {
  it("renders every posture class with stable DOM markers", () => {
    for (const specimen of surfacePostureSpecimens) {
      const html = renderToStaticMarkup(<SurfaceStateFrame contract={specimen} />);

      expect(html).toContain('data-testid="surface-posture-frame"');
      expect(html).toContain(`data-posture-class="${specimen.postureClass}"`);
      expect(html).toContain(`data-state-owner="${specimen.stateOwner}"`);
      expect(html).toContain("data-preserved-anchor=");
      expect(html).toContain("data-dominant-recovery-action=");
      expect(html).toContain('data-testid="recovery-action-cluster"');
      expect(html).toContain('data-testid="degraded-mode-notice-strip"');
      expect(html).toContain('data-testid="shared-status-strip"');
      expect(html).toContain('data-testid="case-pulse"');
    }
  });

  it("keeps the preserved anchor visible inside blocked recovery posture", () => {
    const specimen = surfacePostureSpecimens.find(
      (candidate) => candidate.postureClass === "blocked_recovery",
    );
    const html = renderToStaticMarkup(<SurfaceStateFrame contract={specimen!} />);

    expect(html).toContain('data-testid="preserved-anchor"');
    expect(html).toContain('data-posture-class="blocked_recovery"');
    expect(html).toContain("Dispense line 14");
    expect(html).toContain("Reconcile the blocked line");
  });

  it("keeps live announcements and recovery semantics accessible", () => {
    const blocked = surfacePostureSpecimens.find(
      (candidate) => candidate.postureClass === "blocked_recovery",
    )!;
    const loading = surfacePostureSpecimens.find(
      (candidate) => candidate.postureClass === "loading_summary",
    )!;

    const blockedHtml = renderToStaticMarkup(<SurfaceStateFrame contract={blocked} />);
    const loadingHtml = renderToStaticMarkup(<SurfaceStateFrame contract={loading} />);

    expect(blockedHtml).toContain('aria-live="assertive"');
    expect(blockedHtml).toContain('role="alert"');
    expect(loadingHtml).toContain('aria-live="polite"');
    expect(loadingHtml).toContain("Keep reviewing the current summary");
  });
});
