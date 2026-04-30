import "@vecells/design-system/foundation.css";
import "@vecells/persistent-shell/persistent-shell.css";
import { useEffect } from "react";
import "./continuous-improvement-489.css";
import "./evidence-vault-488.css";
import {
  ContinuousImprovement489Board,
  isContinuousImprovement489Path,
} from "./continuous-improvement-489";
import { EvidenceVault488, isEvidenceVault488Path } from "./evidence-vault-488";

const GOVERNANCE_CANONICAL_NEW_PATH = "/ops/governance/evidence-vault";

function CanonicalGovernanceConsoleSurface() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.location.pathname !== GOVERNANCE_CANONICAL_NEW_PATH) {
      window.history.replaceState({}, "", GOVERNANCE_CANONICAL_NEW_PATH);
    }
  }, []);

  return <EvidenceVault488 />;
}

export default function App() {
  if (typeof window !== "undefined" && isContinuousImprovement489Path(window.location.pathname)) {
    return <ContinuousImprovement489Board />;
  }

  if (typeof window !== "undefined" && isEvidenceVault488Path(window.location.pathname)) {
    return <EvidenceVault488 />;
  }

  return <CanonicalGovernanceConsoleSurface />;
}
