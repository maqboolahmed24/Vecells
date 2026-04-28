import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  EMBEDDED_DESIGN_CONVERGENCE_CONTRACT_REF,
  EMBEDDED_DESIGN_CONVERGENCE_TASK_ID,
  EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE,
  EMBEDDED_DESIGN_PUBLICATION_BUNDLE_REF,
  EMBEDDED_VISUALIZATION_PARITY_REF,
  createEmbeddedAutomationAnchorRows,
  resolveEmbeddedDesignRouteProfile,
  type EmbeddedDesignRouteFamily,
  type EmbeddedDesignRouteProfile,
  type EmbeddedVisualizationFallbackProfile,
} from "./embedded-design-convergence.model";

interface EmbeddedDesignBundleProviderProps {
  readonly routeFamily: EmbeddedDesignRouteFamily;
  readonly children: ReactNode;
}

function contractList(profile: EmbeddedDesignRouteProfile): string {
  return [
    "DesignContractPublicationBundle",
    "VisualizationFallbackContract",
    "VisualizationTableContract",
    "VisualizationParityProjection",
    "StateCopyRegistry",
    "AutomationAnchorRegistry",
    "SemanticGrammarRegistry",
    profile.archetype,
  ].join(" ");
}

export function EmbeddedStateCopyRegistry({
  profile,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
}) {
  return (
    <section
      className="embedded-design__registry"
      aria-label={`${profile.label} state copy registry`}
      data-testid="EmbeddedStateCopyRegistry"
      data-route-family={profile.routeFamily}
      data-primary-state-label={profile.primaryStateLabel}
      data-recovery-state-label={profile.recoveryStateLabel}
      data-primary-cta-verb={profile.primaryCtaVerb}
      data-copy-tone={profile.copyTone}
    >
      <h2>{profile.label} state copy registry</h2>
      <dl>
        <div>
          <dt>Primary state</dt>
          <dd>{profile.primaryStateLabel}</dd>
        </div>
        <div>
          <dt>Recovery state</dt>
          <dd>{profile.recoveryStateLabel}</dd>
        </div>
        <div>
          <dt>CTA grammar</dt>
          <dd>{profile.primaryCtaVerb}</dd>
        </div>
      </dl>
    </section>
  );
}

export function EmbeddedAutomationAnchorRegistry({
  profile,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
}) {
  return (
    <section
      className="embedded-design__registry"
      aria-label={`${profile.label} automation anchor registry`}
      data-testid="EmbeddedAutomationAnchorRegistry"
      data-route-family={profile.routeFamily}
      data-root-testid={profile.rootTestId}
      data-action-testid={profile.actionTestId}
      data-automation-prefix={profile.automationPrefix}
    >
      <h2>{profile.label} automation anchors</h2>
      <table>
        <caption>Automation anchors for embedded route families</caption>
        <tbody>
          {createEmbeddedAutomationAnchorRows().map((row) => (
            <tr key={row.routeFamily} data-route-family={row.routeFamily}>
              <th scope="row">{row.routeFamily}</th>
              <td>{row.rootTestId}</td>
              <td>{row.actionTestId}</td>
              <td>{row.automationPrefix}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function EmbeddedSemanticGrammarRegistry({
  profile,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
}) {
  return (
    <section
      className="embedded-design__registry"
      aria-label={`${profile.label} semantic grammar registry`}
      data-testid="EmbeddedSemanticGrammarRegistry"
      data-route-family={profile.routeFamily}
      data-semantic-label={profile.semanticLabel}
      data-archetype={profile.archetype}
    >
      <h2>{profile.semanticLabel}</h2>
      <p>{profile.archetype.replaceAll("_", " ")}</p>
    </section>
  );
}

export function EmbeddedIconographyRuleset({
  profile,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
}) {
  return (
    <section
      className="embedded-design__registry"
      aria-label={`${profile.label} iconography ruleset`}
      data-testid="EmbeddedIconographyRuleset"
      data-route-family={profile.routeFamily}
      data-icon-policy="status_text_first"
      data-decorative-icon-policy="avoid"
      data-action-icon-policy="label_required"
    >
      <h2>Iconography rules</h2>
      <p>Status text stays primary; icons may support scanning only when the label remains visible.</p>
    </section>
  );
}

export function EmbeddedVisualizationParityBanner({
  profile,
  fallback,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
  readonly fallback: EmbeddedVisualizationFallbackProfile;
}) {
  return (
    <section
      className="embedded-design__registry embedded-design__parity-banner"
      aria-label={`${fallback.visualSurfaceLabel} parity summary`}
      data-testid="EmbeddedVisualizationParityBanner"
      data-route-family={profile.routeFamily}
      data-visual-surface-id={fallback.visualSurfaceId}
      data-fallback-contract-ref={fallback.fallbackContractRef}
      data-parity-ref={EMBEDDED_VISUALIZATION_PARITY_REF}
    >
      <h2>{fallback.visualSurfaceLabel}</h2>
      <p>{fallback.summary}</p>
    </section>
  );
}

export function EmbeddedVisualizationTableSurface({
  profile,
  fallback,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
  readonly fallback: EmbeddedVisualizationFallbackProfile;
}) {
  return (
    <section
      className="embedded-design__registry"
      aria-label={`${fallback.visualSurfaceLabel} fallback table`}
      data-testid="EmbeddedVisualizationTableSurface"
      data-route-family={profile.routeFamily}
      data-visual-surface-id={fallback.visualSurfaceId}
      data-visual-kind={fallback.visualKind}
      data-table-contract-ref={fallback.tableContractRef}
      data-row-count={fallback.rows.length}
    >
      <h2>{fallback.visualSurfaceLabel} fallback table</h2>
      <table>
        <caption>{fallback.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">Meaning</th>
            <th scope="col">Text fallback</th>
            <th scope="col">Parity reference</th>
          </tr>
        </thead>
        <tbody>
          {fallback.rows.map((row) => (
            <tr key={row.parityRef}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
              <td>{row.parityRef}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function EmbeddedVisualizationFallbackAdapter({
  profile,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
}) {
  return (
    <section
      className="embedded-design__registry"
      aria-label={`${profile.label} visualization fallback adapter`}
      data-testid="EmbeddedVisualizationFallbackAdapter"
      data-route-family={profile.routeFamily}
      data-fallback-count={profile.visualizationFallbacks.length}
      data-parity-ref={EMBEDDED_VISUALIZATION_PARITY_REF}
    >
      <h2>{profile.label} visualization fallbacks</h2>
      {profile.visualizationFallbacks.map((fallback) => (
        <div key={fallback.visualSurfaceId}>
          <EmbeddedVisualizationParityBanner profile={profile} fallback={fallback} />
          <EmbeddedVisualizationTableSurface profile={profile} fallback={fallback} />
        </div>
      ))}
    </section>
  );
}

export function EmbeddedBundleAuditPanel({
  profile,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
}) {
  return (
    <section
      className="embedded-design__registry"
      aria-label={`${profile.label} bundle audit panel`}
      data-testid="EmbeddedBundleAuditPanel"
      data-route-family={profile.routeFamily}
      data-design-contract-state="published"
      data-publication-bundle-ref={EMBEDDED_DESIGN_PUBLICATION_BUNDLE_REF}
      data-contract-ref={EMBEDDED_DESIGN_CONVERGENCE_CONTRACT_REF}
      data-covered-contracts={contractList(profile)}
      data-archetype={profile.archetype}
    >
      <h2>{profile.label} bundle audit</h2>
      <p>{contractList(profile)}</p>
    </section>
  );
}

export function EmbeddedDesignConvergenceLinter({
  profile,
  providerRef,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
  readonly providerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [state, setState] = useState({ status: "pending", violations: 0 });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const root = providerRef.current;
      const violations = [
        root?.querySelector(`[data-testid="${profile.rootTestId}"]`) ? null : "missing-route-root",
        root?.querySelector(`[data-testid="${profile.actionTestId}"]`) ? null : "missing-action-anchor",
        root?.querySelector("[data-testid='EmbeddedVisualizationTableSurface']") ? null : "missing-fallback-table",
        root?.getAttribute("data-visual-mode") === EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE
          ? null
          : "missing-design-mode",
      ].filter(Boolean);
      setState({ status: violations.length === 0 ? "pass" : "fail", violations: violations.length });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [profile.actionTestId, profile.rootTestId, providerRef]);

  return (
    <span
      className="embedded-design__instrument"
      data-testid="EmbeddedDesignConvergenceLinter"
      data-route-family={profile.routeFamily}
      data-linter-state={state.status}
      data-violation-count={state.violations}
    >
      Design convergence linter {state.status}
    </span>
  );
}

export function EmbeddedMicrocopyNormalizer({
  profile,
}: {
  readonly profile: EmbeddedDesignRouteProfile;
}) {
  return (
    <section
      className="embedded-design__registry"
      aria-label={`${profile.label} microcopy normalizer`}
      data-testid="EmbeddedMicrocopyNormalizer"
      data-route-family={profile.routeFamily}
      data-microcopy-profile="plain_english_single_dominant_action"
      data-primary-cta-verb={profile.primaryCtaVerb}
      data-state-label={profile.primaryStateLabel}
    >
      <h2>Microcopy normalizer</h2>
      <p>
        {profile.primaryStateLabel}. Primary actions use {profile.primaryCtaVerb.toLowerCase()} grammar and
        recovery copy stays same-shell.
      </p>
    </section>
  );
}

export function EmbeddedDesignBundleProvider({
  routeFamily,
  children,
}: EmbeddedDesignBundleProviderProps) {
  const providerRef = useRef<HTMLDivElement | null>(null);
  const profile = useMemo(() => resolveEmbeddedDesignRouteProfile(routeFamily), [routeFamily]);

  return (
    <div
      ref={providerRef}
      className="embedded-design-bundle"
      data-testid="EmbeddedDesignBundleProvider"
      data-task-id={EMBEDDED_DESIGN_CONVERGENCE_TASK_ID}
      data-visual-mode={EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE}
      data-contract-ref={EMBEDDED_DESIGN_CONVERGENCE_CONTRACT_REF}
      data-publication-bundle-ref={EMBEDDED_DESIGN_PUBLICATION_BUNDLE_REF}
      data-route-family={profile.routeFamily}
      data-route-archetype={profile.archetype}
      data-root-testid={profile.rootTestId}
      data-action-testid={profile.actionTestId}
      data-semantic-label={profile.semanticLabel}
      data-fallback-count={profile.visualizationFallbacks.length}
    >
      <EmbeddedStateCopyRegistry profile={profile} />
      <EmbeddedAutomationAnchorRegistry profile={profile} />
      <EmbeddedSemanticGrammarRegistry profile={profile} />
      <EmbeddedIconographyRuleset profile={profile} />
      <EmbeddedVisualizationFallbackAdapter profile={profile} />
      <EmbeddedMicrocopyNormalizer profile={profile} />
      {children}
      <EmbeddedBundleAuditPanel profile={profile} />
      <EmbeddedDesignConvergenceLinter profile={profile} providerRef={providerRef} />
    </div>
  );
}

export default EmbeddedDesignBundleProvider;

