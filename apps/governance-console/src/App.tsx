import "@vecells/design-system/foundation.css";
import "@vecells/persistent-shell/persistent-shell.css";
import "./continuous-improvement-489.css";
import "./evidence-vault-488.css";
import "./governance-shell-seed.css";
import {
  ContinuousImprovement489Board,
  isContinuousImprovement489Path,
} from "./continuous-improvement-489";
import { EvidenceVault488, isEvidenceVault488Path } from "./evidence-vault-488";
import { GovernanceShellSeedApp } from "./governance-shell-seed";

export default function App() {
  if (typeof window !== "undefined" && isContinuousImprovement489Path(window.location.pathname)) {
    return <ContinuousImprovement489Board />;
  }

  if (typeof window !== "undefined" && isEvidenceVault488Path(window.location.pathname)) {
    return <EvidenceVault488 />;
  }

  return <GovernanceShellSeedApp />;
}
