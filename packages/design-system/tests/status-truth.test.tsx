import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CasePulse,
  SharedStatusStrip,
  composeStatusSentence,
  statusTruthSpecimens,
  validateStatusTruthInput,
} from "../src/index.tsx";

describe("status truth grammar", () => {
  it("keeps local acknowledgement distinct from external confirmation", () => {
    const patientSentence = composeStatusSentence(statusTruthSpecimens[0].statusInput);
    const workspaceSentence = composeStatusSentence(statusTruthSpecimens[1].statusInput);

    expect(patientSentence.stateSummary).toContain("waiting for confirmation");
    expect(patientSentence.ribbonLabel).toContain("Pending");
    expect(workspaceSentence.stateSummary).toContain("review required");
    expect(workspaceSentence.stateSummary).not.toContain("saved");
  });

  it("flags contradictory fresh truth and frozen actionability tuples", () => {
    const contradictoryInput = {
      ...statusTruthSpecimens[0].statusInput,
      freshnessEnvelope: {
        ...statusTruthSpecimens[0].freshnessEnvelope,
        projectionFreshnessState: "fresh" as const,
        actionabilityState: "frozen" as const,
      },
    };

    const issues = validateStatusTruthInput(contradictoryInput);
    expect(issues.map((issue) => issue.code)).toContain(
      "STATUS_FRESHNESS_ACTIONABILITY_CONFLICT",
    );
  });

  it("renders a patient-safe live region without overclaiming settlement", () => {
    const html = renderToStaticMarkup(
      <SharedStatusStrip input={statusTruthSpecimens[0].statusInput} />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-dominant-action="Review appointment options"');
    expect(html).not.toContain("Confirmed and safe to view");
  });

  it("renders the shared strip with stable shell-truth markers", () => {
    const html = renderToStaticMarkup(
      <SharedStatusStrip input={statusTruthSpecimens[3].statusInput} />,
    );

    expect(html).toContain('data-testid="shared-status-strip"');
    expect(html).toContain('data-render-mode="promoted_banner"');
    expect(html).toContain('data-freshness-state="blocked_recovery"');
    expect(html).toContain('data-recovery-posture="blocked"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
  });

  it("renders CasePulse as one stable identity band with macrostate and axes", () => {
    const html = renderToStaticMarkup(<CasePulse pulse={statusTruthSpecimens[2].pulse} />);

    expect(html).toContain('data-testid="case-pulse"');
    expect(html).toContain('data-audience-profile="hub"');
    expect(html).toContain('data-macro-state="awaiting_external"');
    expect(html).toContain("Cross-site coordination case");
    expect(html).toContain('data-axis-key="lifecycle"');
    expect(html).toContain('data-axis-key="trust"');
  });
});
