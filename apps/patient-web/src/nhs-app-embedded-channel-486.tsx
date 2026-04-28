import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildNHSAppEmbedded486Path,
  isNHSAppEmbeddedChannel486Path,
  resolveNHSAppEmbedded486Context,
  type NHSAppEmbedded486Context,
  type NHSAppEmbedded486Flow,
  type NHSAppEmbedded486State,
} from "./nhs-app-embedded-channel-486.model";

export { isNHSAppEmbeddedChannel486Path };

const flowOptions: readonly { readonly flow: NHSAppEmbedded486Flow; readonly label: string }[] = [
  { flow: "start", label: "Request" },
  { flow: "status", label: "Status" },
  { flow: "booking", label: "Booking" },
  { flow: "pharmacy", label: "Pharmacy" },
  { flow: "secure-link", label: "Secure link" },
  { flow: "artifact", label: "Letter" },
];

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function resolveInitial(): NHSAppEmbedded486Context {
  const ownerWindow = safeWindow();
  return resolveNHSAppEmbedded486Context({
    pathname: ownerWindow?.location.pathname ?? "/nhs-app/embedded",
    search: ownerWindow?.location.search ?? "",
  });
}

function useEmbeddedChannelController() {
  const [context, setContext] = useState<NHSAppEmbedded486Context>(() => resolveInitial());
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [announcement, setAnnouncement] = useState(context.statusStrip);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) return;
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.contrast = "standard";
    ownerWindow.document.body.dataset.density = "balanced";
    ownerWindow.document.body.dataset.motion = ownerWindow.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? "reduced"
      : "full";
  }, []);

  const navigate = useCallback(
    (state: NHSAppEmbedded486State, flow: NHSAppEmbedded486Flow, replace = false) => {
      const ownerWindow = safeWindow();
      const nextPath = buildNHSAppEmbedded486Path(state, flow);
      if (ownerWindow) {
        if (replace) ownerWindow.history.replaceState({ state, flow }, "", nextPath);
        else ownerWindow.history.pushState({ state, flow }, "", nextPath);
      }
      const next = resolveNHSAppEmbedded486Context({
        pathname: "/nhs-app/embedded",
        search: nextPath.split("?")[1] ? `?${nextPath.split("?")[1]}` : "",
      });
      setContext(next);
      setAnnouncement(next.statusStrip);
      window.setTimeout(() => titleRef.current?.focus({ preventScroll: false }), 0);
    },
    [],
  );

  const safeReturn = useCallback(() => {
    navigate("approved", "status", false);
  }, [navigate]);

  return { context, titleRef, announcement, navigate, safeReturn };
}

function FlowSwitch(props: {
  readonly context: NHSAppEmbedded486Context;
  readonly onNavigate: (state: NHSAppEmbedded486State, flow: NHSAppEmbedded486Flow) => void;
}) {
  return (
    <nav className="nhs-app-486__flow-switch" aria-label="Embedded journey">
      {flowOptions.map((option) => (
        <button
          key={option.flow}
          type="button"
          data-testid={`nhs-app-486-flow-${option.flow}`}
          data-active={props.context.flow === option.flow}
          onClick={() => props.onNavigate(props.context.state, option.flow)}
        >
          {option.label}
        </button>
      ))}
    </nav>
  );
}

function StatusStrip({ context }: { readonly context: NHSAppEmbedded486Context }) {
  return (
    <section
      className="nhs-app-486__status-strip"
      aria-label="Current journey status"
      data-testid="nhs-app-486-status-strip"
      data-channel-exposure={context.channelExposureState}
      data-route-posture={context.routePosture}
    >
      <span>{context.statusStrip}</span>
      <span>{context.provenance}</span>
    </section>
  );
}

function UnsupportedFallback({
  context,
  onSafeReturn,
}: {
  readonly context: NHSAppEmbedded486Context;
  readonly onSafeReturn: () => void;
}) {
  return (
    <section
      className="nhs-app-486__fallback"
      aria-labelledby="nhs-app-486-fallback-title"
      data-testid="nhs-app-486-unsupported-fallback"
      data-unsupported-bridge-state={context.unsupportedBridgeState}
    >
      <p className="nhs-app-486__eyebrow">Safe alternative</p>
      <h2 id="nhs-app-486-fallback-title">Read the summary here</h2>
      <p>
        This page cannot use that file action in the NHS App. The important details stay here, and
        the practice can send the full letter another safe way.
      </p>
      <button type="button" data-testid="nhs-app-486-safe-return" onClick={onSafeReturn}>
        {context.safeReturnLabel}
      </button>
    </section>
  );
}

export default function NHSAppEmbeddedChannel486() {
  const { context, titleRef, announcement, navigate, safeReturn } = useEmbeddedChannelController();
  const routeRows = useMemo(
    () => [
      ["Selected item", context.content.selectedContext],
      ["Route", context.content.title],
      ["Continuity", context.selectedAnchorRef],
    ],
    [context.content.selectedContext, context.content.title, context.selectedAnchorRef],
  );

  return (
    <main
      className="nhs-app-486 token-foundation"
      data-testid="nhs-app-486-embedded"
      data-state={context.state}
      data-flow={context.flow}
      data-channel-exposure={context.channelExposureState}
      data-route-posture={context.routePosture}
      data-primary-action-visible={String(context.primaryActionVisible)}
      data-download-exposed={String(context.downloadActionExposed)}
      data-print-exposed={String(context.printActionExposed)}
      data-browser-handoff-exposed={String(context.browserHandoffActionExposed)}
    >
      <div className="nhs-app-486__shell">
        <header className="nhs-app-486__masthead">
          <p className="nhs-app-486__eyebrow">NHS App</p>
          <h1 ref={titleRef} tabIndex={-1}>
            {context.content.title}
          </h1>
        </header>

        <StatusStrip context={context} />
        <FlowSwitch context={context} onNavigate={navigate} />

        <section
          className="nhs-app-486__route"
          aria-labelledby="nhs-app-486-route-title"
          data-testid="nhs-app-486-route-content"
          data-testid-state={`nhs-app-486-state-${context.state}`}
        >
          <p className="nhs-app-486__eyebrow">Your next step</p>
          <h2 id="nhs-app-486-route-title">{context.content.selectedContext}</h2>
          <p>{context.content.summary}</p>

          <dl className="nhs-app-486__summary-list" aria-label="Current route details">
            {routeRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {context.primaryActionVisible ? (
            <button
              type="button"
              className="nhs-app-486__primary"
              data-testid="nhs-app-486-primary-action"
            >
              {context.content.primaryAction}
            </button>
          ) : null}

          {context.fallbackVisible && context.state !== "unsupported" ? (
            <section
              className="nhs-app-486__bounded"
              aria-label="Safe recovery"
              data-testid={`nhs-app-486-state-${context.state}`}
            >
              <p>{context.statusStrip}</p>
              <button type="button" data-testid="nhs-app-486-safe-return" onClick={safeReturn}>
                {context.safeReturnLabel}
              </button>
            </section>
          ) : null}
        </section>

        {context.state === "unsupported" ? (
          <UnsupportedFallback context={context} onSafeReturn={safeReturn} />
        ) : null}

        <p className="nhs-app-486__live" aria-live="polite" data-testid="nhs-app-486-announcement">
          {announcement}
        </p>
      </div>
    </main>
  );
}
