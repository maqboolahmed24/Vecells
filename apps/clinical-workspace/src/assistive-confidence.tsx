import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import type { StaffRouteKind, StaffShellLedger } from "./workspace-shell.data";

export const ASSISTIVE_CONFIDENCE_VISUAL_MODE = "Assistive_Confidence_Provenance_Prism";

export type AssistiveConfidenceDisplayBand =
  | "suppressed"
  | "insufficient"
  | "guarded"
  | "supported"
  | "strong";

export type AssistiveConfidenceBandTone = "informative" | "caution" | "suppressed" | "abstention";

export type AssistiveEvidenceCoverageState = "covered" | "partial" | "missing" | "masked";

export type AssistiveConfidencePresentationDepth =
  | "summary_only"
  | "bounded_explainer"
  | "provenance_detail"
  | "placeholder_only";

export type AssistiveConfidenceFactorKind =
  | "evidence_coverage"
  | "expected_harm"
  | "uncertainty"
  | "abstention"
  | "trust"
  | "freshness";

export type AssistiveConfidenceFactor = {
  id: string;
  kind: AssistiveConfidenceFactorKind;
  label: string;
  valueLabel: string;
  detail: string;
};

export type AssistiveEvidenceCoverageSegment = {
  id: string;
  label: string;
  state: AssistiveEvidenceCoverageState;
  detail: string;
};

export type AssistiveFreshnessState = {
  state: "current" | "aging" | "stale" | "invalidated";
  label: string;
  generatedAtLabel: string;
  checkedAgainst: string;
};

export type AssistiveProvenanceEnvelopeSummary = {
  provenanceEnvelopeId: string;
  artifactRef: string;
  capabilityCode: string;
  inputEvidenceSnapshotRef: string;
  inputCaptureBundleRef: string;
  evidenceMapSetRef: string;
  modelVersionRef: string;
  promptSurfaceRef: string;
  outputSchemaVersionRef: string;
  calibrationBundleRef: string;
  policyBundleRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  maskingPolicyRef: string;
  disclosureLevel: "footer" | "footer_plus_popover" | "footer_plus_side_sheet";
};

export type AssistiveConfidenceSuppressionReason = {
  code:
    | "trust_degraded"
    | "publication_not_current"
    | "continuity_not_current"
    | "calibration_missing"
    | "presentation_contract_limited";
  label: string;
  detail: string;
};

export type AssistiveConfidenceState = {
  fixture: string;
  visualMode: typeof ASSISTIVE_CONFIDENCE_VISUAL_MODE;
  routeKind: StaffRouteKind;
  taskRef: string;
  selectedAnchorRef: string;
  confidenceDigestId: string;
  sourceDisplayBand: AssistiveConfidenceDisplayBand;
  displayBand: AssistiveConfidenceDisplayBand;
  bandTone: AssistiveConfidenceBandTone;
  primaryLabel: string;
  secondaryPostureLabel?: string;
  trustState: "trusted" | "degraded" | "quarantined" | "shadow_only" | "frozen" | "unknown";
  presentationContractDepth: AssistiveConfidencePresentationDepth;
  rationaleDigest: string;
  rationaleExplainerHeading: string;
  rationalePolicyNote: string;
  initialRationaleOpen?: boolean;
  initialProvenanceOpen?: boolean;
  factors: AssistiveConfidenceFactor[];
  evidenceCoverage: AssistiveEvidenceCoverageSegment[];
  freshness: AssistiveFreshnessState;
  provenance: AssistiveProvenanceEnvelopeSummary;
  suppressionReason?: AssistiveConfidenceSuppressionReason;
};

export type AssistiveConfidenceStateAdapterInput = {
  runtimeScenario: StaffShellLedger["runtimeScenario"];
  selectedAnchorRef: string;
  taskRef: string;
  routeKind: StaffRouteKind;
};

type DisclosureKeyboardControllerProps = {
  rootRef: RefObject<HTMLElement | null>;
  rationaleOpen: boolean;
  provenanceOpen: boolean;
  onClose: () => void;
  focusFallbackRef: RefObject<HTMLButtonElement | null>;
};

function readRequestedConfidenceFixture(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return new URLSearchParams(window.location.search).get("assistiveConfidence");
}

function normalizeConfidenceFixture(value: string | null): string | null {
  switch (value) {
    case "healthy":
    case "visible-provenance":
      return "healthy";
    case "suppressed":
    case "suppressed-degraded":
    case "degraded-trust":
      return "suppressed-degraded";
    case "abstention":
    case "low-confidence":
      return "abstention";
    case "rationale-open":
      return "rationale-open";
    case "provenance-open":
      return "provenance-open";
    case "narrow-folded":
      return "narrow-folded";
    default:
      return null;
  }
}

function routeRationale(routeKind: StaffRouteKind): string {
  switch (routeKind) {
    case "decision":
      return "Draft reasoning is present because the current decision note slot has mapped evidence, no red-flag conflict, and an active human review task.";
    case "more-info":
      return "Question support is present because the request has unresolved information needs tied to the selected anchor.";
    default:
      return "Draft awareness is present because the task snapshot has mapped evidence and a current staff workspace binding.";
  }
}

function buildBaseFactors(): AssistiveConfidenceFactor[] {
  return [
    {
      id: "factor-evidence-coverage",
      kind: "evidence_coverage",
      label: "Evidence coverage",
      valueLabel: "Mapped to current snapshot",
      detail: "History, request text, and medication context are covered by refs in the current evidence map.",
    },
    {
      id: "factor-expected-harm",
      kind: "expected_harm",
      label: "Expected harm",
      valueLabel: "Guarded",
      detail: "The draft remains advisory and avoids completion-adjacent language.",
    },
    {
      id: "factor-uncertainty",
      kind: "uncertainty",
      label: "Uncertainty",
      valueLabel: "Residual",
      detail: "The surface stays limited to rationale and history rather than the final clinical record.",
    },
  ];
}

function buildBaseCoverage(): AssistiveEvidenceCoverageSegment[] {
  return [
    {
      id: "coverage-request",
      label: "Request",
      state: "covered",
      detail: "Request text has a current evidence snapshot reference.",
    },
    {
      id: "coverage-record",
      label: "Record",
      state: "covered",
      detail: "Medication and recent encounter refs are available.",
    },
    {
      id: "coverage-safety",
      label: "Safety",
      state: "partial",
      detail: "Red-flag checks are present but remain human-reviewed.",
    },
    {
      id: "coverage-external",
      label: "External",
      state: "masked",
      detail: "External artifact detail is masked in this rail view.",
    },
  ];
}

function makeProvenance(taskRef: string, selectedAnchorRef: string): AssistiveProvenanceEnvelopeSummary {
  return {
    provenanceEnvelopeId: `assistive_provenance.420.${taskRef}.${selectedAnchorRef}`,
    artifactRef: `draft_note_artifact.408.${taskRef}.clinician_note.v1`,
    capabilityCode: "assistive_documentation_shadow",
    inputEvidenceSnapshotRef: `evidence_snapshot.${taskRef}.${selectedAnchorRef}.summary`,
    inputCaptureBundleRef: `capture_bundle.407.${taskRef}.request_audio_text`,
    evidenceMapSetRef: `evidence_map_set.408.${taskRef}.documentation`,
    modelVersionRef: "model_version.nonprod.documentation_composer.v1",
    promptSurfaceRef: "prompt_surface.414.documentation_summary.v1",
    outputSchemaVersionRef: "output_schema.408.documentation_section.v1",
    calibrationBundleRef: "calibration_bundle.415.visible_shadow.v1",
    policyBundleRef: "policy_bundle.phase8.assistive_visibility.v1",
    surfacePublicationRef: "surface_publication.phase8.assistive_staff_workspace.v1",
    runtimePublicationBundleRef: "runtime_bundle.phase8.assistive_shadow.v1",
    maskingPolicyRef: "masking_policy.staff_phi_minimum_necessary.v1",
    disclosureLevel: "footer_plus_popover",
  };
}

function confidenceStateForScenario(
  runtimeScenario: StaffShellLedger["runtimeScenario"],
): Pick<AssistiveConfidenceState, "trustState" | "displayBand" | "bandTone" | "primaryLabel"> & {
  suppressionReason?: AssistiveConfidenceSuppressionReason;
} {
  switch (runtimeScenario) {
    case "read_only":
    case "recovery_only":
    case "stale_review":
      return {
        trustState: "degraded",
        displayBand: "suppressed",
        bandTone: "suppressed",
        primaryLabel: "Confidence suppressed",
        suppressionReason: {
          code: "continuity_not_current",
          label: "Continuity not current",
          detail: "The workspace scenario is not live, so visible confidence narrows to read-only history.",
        },
      };
    case "blocked":
      return {
        trustState: "frozen",
        displayBand: "suppressed",
        bandTone: "suppressed",
        primaryLabel: "Confidence suppressed",
        suppressionReason: {
          code: "trust_degraded",
          label: "Trust envelope blocks confidence",
          detail: "The current assistive trust envelope is frozen and cannot show confidence-bearing chrome.",
        },
      };
    case "live":
    default:
      return {
        trustState: "trusted",
        displayBand: "supported",
        bandTone: "informative",
        primaryLabel: "Supported draft aid",
      };
  }
}

export function AssistiveConfidenceStateAdapter({
  runtimeScenario,
  selectedAnchorRef,
  taskRef,
  routeKind,
}: AssistiveConfidenceStateAdapterInput): AssistiveConfidenceState | null {
  // Primary staff chrome is derived from AssistiveConfidenceDigest.displayBand, not raw model math.
  const fixture = normalizeConfidenceFixture(readRequestedConfidenceFixture());
  if (!fixture) {
    return null;
  }

  const scenario = confidenceStateForScenario(runtimeScenario);
  const baseState: AssistiveConfidenceState = {
    fixture,
    visualMode: ASSISTIVE_CONFIDENCE_VISUAL_MODE,
    routeKind,
    taskRef,
    selectedAnchorRef,
    confidenceDigestId: `assistive_confidence_digest.420.${taskRef}.${selectedAnchorRef}`,
    sourceDisplayBand: "supported",
    displayBand: scenario.displayBand,
    bandTone: scenario.bandTone,
    primaryLabel: scenario.primaryLabel,
    secondaryPostureLabel: "Shadow output only",
    trustState: scenario.trustState,
    presentationContractDepth:
      scenario.displayBand === "suppressed" ? "summary_only" : "bounded_explainer",
    rationaleDigest: routeRationale(routeKind),
    rationaleExplainerHeading: "Why this draft aid appears",
    rationalePolicyNote:
      "This explainer is limited by the artifact presentation rules and does not expose raw model math.",
    factors: buildBaseFactors(),
    evidenceCoverage: buildBaseCoverage(),
    freshness: {
      state: scenario.displayBand === "suppressed" ? "aging" : "current",
      label: scenario.displayBand === "suppressed" ? "Freshness needs review" : "Fresh for this review",
      generatedAtLabel: "Generated against review snapshot rv.311.19",
      checkedAgainst: "Publication and runtime bundle phase8.assistive_staff_workspace.v1",
    },
    provenance: makeProvenance(taskRef, selectedAnchorRef),
    suppressionReason: scenario.suppressionReason,
  };

  if (fixture === "suppressed-degraded") {
    return {
      ...baseState,
      sourceDisplayBand: "supported",
      displayBand: "suppressed",
      bandTone: "suppressed",
      primaryLabel: "Confidence suppressed",
      secondaryPostureLabel: "Degraded trust",
      trustState: "degraded",
      presentationContractDepth: "summary_only",
      freshness: {
        state: "aging",
        label: "Freshness visible, confidence held back",
        generatedAtLabel: "Generated against review snapshot rv.311.19",
        checkedAgainst: "Trust projection degraded by current watch tuple",
      },
      suppressionReason: {
        code: "trust_degraded",
        label: "Trust status degraded",
        detail:
          "The trust projection permits history and rationale summary only, so visible confidence is suppressed.",
      },
      factors: [
        ...buildBaseFactors(),
        {
          id: "factor-trust",
          kind: "trust",
          label: "Trust status",
          valueLabel: "Degraded",
          detail: "The trust envelope allows read-only awareness and source history, not confidence-bearing action.",
        },
      ],
    };
  }

  if (fixture === "abstention") {
    return {
      ...baseState,
      sourceDisplayBand: "insufficient",
      displayBand: "insufficient",
      bandTone: "abstention",
      primaryLabel: "Insufficient support",
      secondaryPostureLabel: "Abstention advised",
      presentationContractDepth: "bounded_explainer",
      rationaleDigest:
        "The evidence map is incomplete for a confident draft aid, so the surface shows why it abstains and keeps history visible.",
      factors: [
        {
          id: "factor-abstention",
          kind: "abstention",
          label: "Abstention status",
          valueLabel: "Review only",
          detail: "Missing external context prevents stronger summary support.",
        },
        {
          id: "factor-evidence-gap",
          kind: "evidence_coverage",
          label: "Evidence gap",
          valueLabel: "External detail masked",
          detail: "External artifact detail is not available in this rail, so no higher band is shown.",
        },
        {
          id: "factor-uncertainty",
          kind: "uncertainty",
          label: "Uncertainty",
          valueLabel: "High",
          detail: "The UI keeps the result as a rationale prompt rather than a draft recommendation.",
        },
      ],
      evidenceCoverage: buildBaseCoverage().map((segment) =>
        segment.id === "coverage-external" ? { ...segment, state: "missing" } : segment,
      ),
    };
  }

  if (fixture === "rationale-open") {
    return {
      ...baseState,
      initialRationaleOpen: true,
    };
  }

  if (fixture === "provenance-open") {
    return {
      ...baseState,
      presentationContractDepth: "provenance_detail",
      initialProvenanceOpen: true,
    };
  }

  if (fixture === "narrow-folded") {
    return {
      ...baseState,
      secondaryPostureLabel: "Folded summary",
      rationaleDigest:
        "Compact folded state keeps confidence, freshness, and source history in one scan path.",
    };
  }

  return baseState;
}

function AssistiveConfidenceDisclosureKeyboardController({
  rootRef,
  rationaleOpen,
  provenanceOpen,
  onClose,
  focusFallbackRef,
}: DisclosureKeyboardControllerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || (!rationaleOpen && !provenanceOpen)) {
        return;
      }

      const root = rootRef.current;
      if (!root || !root.contains(document.activeElement)) {
        return;
      }

      event.preventDefault();
      onClose();
      focusFallbackRef.current?.focus();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusFallbackRef, onClose, provenanceOpen, rationaleOpen, rootRef]);

  return null;
}

export function AssistiveConfidenceBand({ state }: { state: AssistiveConfidenceState }) {
  return (
    <span
      className="assistive-confidence__band"
      data-testid="AssistiveConfidenceBand"
      data-display-band={state.displayBand}
      data-source-display-band={state.sourceDisplayBand}
      data-band-tone={state.bandTone}
    >
      {state.primaryLabel}
    </span>
  );
}

export function AssistiveConfidenceSuppressionState({
  reason,
}: {
  reason: AssistiveConfidenceSuppressionReason;
}) {
  return (
    <div
      className="assistive-confidence__suppression"
      data-testid="AssistiveConfidenceSuppressionState"
      role="note"
      aria-label="Confidence suppression reason"
    >
      <strong>{reason.label}</strong>
      <span>{reason.detail}</span>
    </div>
  );
}

export function AssistiveRationaleDigest({
  state,
  expanded,
  controlsId,
  buttonRef,
  onToggle,
}: {
  state: AssistiveConfidenceState;
  expanded: boolean;
  controlsId: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
}) {
  return (
    <div className="assistive-confidence__rationale" data-testid="AssistiveRationaleDigest">
      <p>{state.rationaleDigest}</p>
      <button
        ref={buttonRef}
        type="button"
        className="assistive-confidence__text-button"
        aria-expanded={expanded}
        aria-controls={controlsId}
        onClick={onToggle}
      >
        {expanded ? "Hide rationale factors" : "Why this appears"}
      </button>
    </div>
  );
}

export function AssistiveFactorRowList({ factors }: { factors: AssistiveConfidenceFactor[] }) {
  return (
    <dl className="assistive-confidence__factor-list" data-testid="AssistiveFactorRowList">
      {factors.map((factor) => (
        <div key={factor.id} data-factor-kind={factor.kind}>
          <dt>
            <span>{factor.label}</span>
            <small>{factor.valueLabel}</small>
          </dt>
          <dd>{factor.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AssistiveEvidenceCoverageMiniMap({
  segments,
}: {
  segments: AssistiveEvidenceCoverageSegment[];
}) {
  return (
    <div
      className="assistive-confidence__coverage"
      data-testid="AssistiveEvidenceCoverageMiniMap"
      aria-label="Evidence coverage summary"
    >
      <span className="assistive-confidence__mini-heading">Evidence coverage</span>
      <ul role="list">
        {segments.map((segment) => (
          <li key={segment.id} data-coverage-state={segment.state}>
            <span aria-hidden="true" className="assistive-confidence__coverage-mark" />
            <span>{segment.label}</span>
            <small>{segment.detail}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AssistiveRationaleExplainer({
  state,
  expanded,
  id,
}: {
  state: AssistiveConfidenceState;
  expanded: boolean;
  id: string;
}) {
  const headingId = useId();

  return (
    <section
      id={id}
      className="assistive-confidence__explainer"
      data-testid="AssistiveRationaleExplainer"
      data-expanded={expanded ? "true" : "false"}
      aria-labelledby={headingId}
      hidden={!expanded}
    >
      <h4 id={headingId}>{state.rationaleExplainerHeading}</h4>
      <p>{state.rationalePolicyNote}</p>
      <AssistiveFactorRowList factors={state.factors} />
      <AssistiveEvidenceCoverageMiniMap segments={state.evidenceCoverage} />
    </section>
  );
}

export function AssistiveFreshnessLine({ state }: { state: AssistiveFreshnessState }) {
  return (
    <p
      className="assistive-confidence__freshness"
      data-testid="AssistiveFreshnessLine"
      data-freshness-state={state.state}
    >
      <span>{state.label}</span>
      <small>
        {state.generatedAtLabel}; {state.checkedAgainst}
      </small>
    </p>
  );
}

export function AssistiveProvenanceFooter({
  state,
  expanded,
  controlsId,
  buttonRef,
  onToggle,
}: {
  state: AssistiveConfidenceState;
  expanded: boolean;
  controlsId: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
}) {
  return (
    <footer
      className="assistive-confidence__provenance-footer"
      data-testid="AssistiveProvenanceFooter"
      aria-label="Assistive history footer"
    >
      <dl>
        <div>
          <dt>Freshness</dt>
          <dd>{state.freshness.state}</dd>
        </div>
        <div>
          <dt>Trust</dt>
          <dd>{state.trustState.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{state.provenance.inputEvidenceSnapshotRef}</dd>
        </div>
      </dl>
      <button
        ref={buttonRef}
        type="button"
        className="assistive-confidence__text-button"
        aria-expanded={expanded}
        aria-controls={controlsId}
        onClick={onToggle}
      >
        {expanded ? "Hide source history" : "Show source history"}
      </button>
    </footer>
  );
}

export function AssistiveProvenanceDrawer({
  state,
  expanded,
  id,
  onClose,
}: {
  state: AssistiveConfidenceState;
  expanded: boolean;
  id: string;
  onClose: () => void;
}) {
  const headingId = useId();
  const rows = [
    ["History summary", "Checked"],
    ["Artifact", "Available"],
    ["Capability", "Documentation support"],
    ["Capture", "Complete"],
    ["Evidence map", "Checked"],
    ["Model version", "Current"],
    ["Prompt surface", "Checked"],
    ["Schema", "Current"],
    ["Calibration", "Checked"],
    ["Policy", "Applied"],
    ["Publication", "Current"],
    ["Runtime", "Current"],
    ["Masking", "Applied"],
  ] as const;

  return (
    <section
      id={id}
      className="assistive-confidence__drawer"
      data-testid="AssistiveProvenanceDrawer"
      data-expanded={expanded ? "true" : "false"}
      aria-labelledby={headingId}
      hidden={!expanded}
    >
      <header>
        <h4 id={headingId}>Source history</h4>
        <button type="button" className="assistive-confidence__icon-button" onClick={onClose}>
          Close
        </button>
      </header>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd
              data-provenance-envelope-id={label === "History summary" ? state.provenance.provenanceEnvelopeId : undefined}
              data-artifact-ref={label === "Artifact" ? state.provenance.artifactRef : undefined}
              data-surface-publication-ref={label === "Publication" ? state.provenance.surfacePublicationRef : undefined}
              data-runtime-publication-bundle-ref={label === "Runtime" ? state.provenance.runtimePublicationBundleRef : undefined}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function AssistiveConfidenceBandCluster({
  state,
  placement = "rail_card",
}: {
  state: AssistiveConfidenceState;
  placement?: "compact_summary" | "rail_card" | "stage_card";
}) {
  const headingId = useId();
  const rationaleId = useId();
  const provenanceId = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const rationaleButtonRef = useRef<HTMLButtonElement | null>(null);
  const provenanceButtonRef = useRef<HTMLButtonElement | null>(null);
  const [rationaleOpen, setRationaleOpen] = useState(Boolean(state.initialRationaleOpen));
  const [provenanceOpen, setProvenanceOpen] = useState(Boolean(state.initialProvenanceOpen));

  useEffect(() => {
    setRationaleOpen(Boolean(state.initialRationaleOpen));
    setProvenanceOpen(Boolean(state.initialProvenanceOpen));
  }, [state.fixture, state.initialProvenanceOpen, state.initialRationaleOpen]);

  const closeDisclosures = () => {
    setRationaleOpen(false);
    setProvenanceOpen(false);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || (!rationaleOpen && !provenanceOpen)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    closeDisclosures();
    if (rationaleOpen) {
      rationaleButtonRef.current?.focus();
      return;
    }
    provenanceButtonRef.current?.focus();
  };

  return (
    <section
      ref={rootRef}
      className="assistive-confidence"
      onKeyDown={handleKeyDown}
      data-testid="AssistiveConfidenceBandCluster"
      data-visual-mode={ASSISTIVE_CONFIDENCE_VISUAL_MODE}
      data-placement={placement}
      data-fixture={state.fixture}
      data-display-band={state.displayBand}
      data-trust-state={state.trustState}
      data-presentation-depth={state.presentationContractDepth}
      aria-labelledby={headingId}
    >
      <AssistiveConfidenceDisclosureKeyboardController
        rootRef={rootRef}
        rationaleOpen={rationaleOpen}
        provenanceOpen={provenanceOpen}
        onClose={closeDisclosures}
        focusFallbackRef={rationaleOpen ? rationaleButtonRef : provenanceButtonRef}
      />
      <header className="assistive-confidence__header">
        <div>
          <span className="assistive-confidence__eyebrow">Confidence and history</span>
          <h3 id={headingId}>Limited assistive confidence</h3>
        </div>
        <div className="assistive-confidence__chip-cluster">
          <AssistiveConfidenceBand state={state} />
          {state.secondaryPostureLabel && (
            <span className="assistive-confidence__secondary-chip">
              {state.secondaryPostureLabel}
            </span>
          )}
        </div>
      </header>
      {state.suppressionReason && (
        <AssistiveConfidenceSuppressionState reason={state.suppressionReason} />
      )}
      <AssistiveRationaleDigest
        state={state}
        expanded={rationaleOpen}
        controlsId={rationaleId}
        buttonRef={rationaleButtonRef}
        onToggle={() => setRationaleOpen((current) => !current)}
      />
      <AssistiveRationaleExplainer state={state} expanded={rationaleOpen} id={rationaleId} />
      <AssistiveFreshnessLine state={state.freshness} />
      <AssistiveProvenanceFooter
        state={state}
        expanded={provenanceOpen}
        controlsId={provenanceId}
        buttonRef={provenanceButtonRef}
        onToggle={() => setProvenanceOpen((current) => !current)}
      />
      <AssistiveProvenanceDrawer
        state={state}
        expanded={provenanceOpen}
        id={provenanceId}
        onClose={() => {
          setProvenanceOpen(false);
          provenanceButtonRef.current?.focus();
        }}
      />
    </section>
  );
}
