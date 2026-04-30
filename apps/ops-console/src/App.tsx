import "@vecells/design-system/foundation.css";
import "@vecells/persistent-shell/persistent-shell.css";
import { useEffect } from "react";
import "./nhs-app-channel-workbench.css";
import "./nhs-app-readiness-cockpit.css";
import "./go-live-smoke-board-481.css";
import "./canary-rollout-console-484.css";
import "./assistive-visible-ops-485.css";
import "./nhs-app-channel-activation-486.css";
import "./bau-handover-board-487.css";
import "./wave-observation-tower-483.css";
import "./wave1-promotion-console-482.css";
import { CanaryRolloutConsole484 } from "./canary-rollout-console-484";
import { AssistiveVisibleOps485 } from "./assistive-visible-ops-485";
import { BAUHandoverBoard487, isBAUHandover487Path } from "./bau-handover-board-487";
import { GoLiveSmokeBoard481 } from "./go-live-smoke-board-481";
import { NHSAppChannelControlWorkbench } from "./nhs-app-channel-workbench";
import {
  isNHSAppActivation486Path,
  NHSAppChannelActivation486,
} from "./nhs-app-channel-activation-486";
import { NHSAppReadinessCockpit } from "./nhs-app-readiness-cockpit";
import { WaveObservationTower483 } from "./wave-observation-tower-483";
import { Wave1PromotionConsole482 } from "./wave1-promotion-console-482";

const OPS_CANONICAL_NEW_PATH = "/ops/release/nhs-app";

function CanonicalOpsConsoleSurface() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.location.pathname !== OPS_CANONICAL_NEW_PATH) {
      window.history.replaceState({}, "", OPS_CANONICAL_NEW_PATH);
    }
  }, []);

  return <NHSAppReadinessCockpit />;
}

export default function App() {
  if (
    typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/ops/support/channels/nhs-app") ||
      window.location.pathname.startsWith("/ops/support/cases/") ||
      window.location.pathname.startsWith("/ops/release/nhs-app/cases/") ||
      window.location.pathname.startsWith("/ops/audit/channel/nhs-app"))
  ) {
    return <NHSAppChannelControlWorkbench />;
  }

  if (typeof window !== "undefined" && isNHSAppActivation486Path(window.location.pathname)) {
    return <NHSAppChannelActivation486 />;
  }

  if (typeof window !== "undefined" && isBAUHandover487Path(window.location.pathname)) {
    return <BAUHandoverBoard487 />;
  }

  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/ops/release/nhs-app")
  ) {
    return <NHSAppReadinessCockpit />;
  }

  if (typeof window !== "undefined" && window.location.pathname.startsWith("/ops/go-live-smoke")) {
    return <GoLiveSmokeBoard481 />;
  }

  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/ops/release/wave1-promotion")
  ) {
    return <Wave1PromotionConsole482 />;
  }

  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/ops/release/wave1-observation")
  ) {
    return <WaveObservationTower483 />;
  }

  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/ops/release/canary-rollout")
  ) {
    return <CanaryRolloutConsole484 />;
  }

  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/ops/assistive/visible-modes")
  ) {
    return <AssistiveVisibleOps485 />;
  }

  return <CanonicalOpsConsoleSurface />;
}
