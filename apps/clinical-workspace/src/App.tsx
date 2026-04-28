import "@vecells/design-system/foundation.css";
import "@vecells/surface-postures/surface-postures.css";
import { useEffect, useState } from "react";
import "./staff-entry-surfaces.css";
import "./assistive-rail.css";
import "./assistive-draft.css";
import "./assistive-confidence.css";
import "./assistive-override.css";
import "./assistive-trust-posture.css";
import "./assistive-stale-recovery.css";
import "./assistive-workspace-stage.css";
import "./assistive-visible-mode-485.css";
import "./assistive-queue-assurance-merge.css";
import "./support-workspace-shell.css";
import "./workspace-booking-handoff.css";
import "./workspace-shell.css";
import { StaffEntrySurfaceApp } from "./staff-entry-surfaces";
import { AssistiveVisibleMode485Workspace } from "./assistive-visible-mode-485";
import { SupportWorkspaceApp, isSupportWorkspacePath } from "./support-workspace-shell";
import { WorkspaceRouteFamilyController, isWorkspaceShellPath } from "./workspace-shell";

function readPathname() {
  return typeof window === "undefined" ? "/workspace" : window.location.pathname;
}

export default function App() {
  const [pathname, setPathname] = useState(readPathname);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handleRouteChange = () => setPathname(readPathname());
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("vecells-route-change", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("vecells-route-change", handleRouteChange);
    };
  }, []);

  if (isSupportWorkspacePath(pathname)) {
    return <SupportWorkspaceApp />;
  }
  if (pathname.startsWith("/workspace/assistive-visible-modes")) {
    return <AssistiveVisibleMode485Workspace />;
  }
  if (isWorkspaceShellPath(pathname)) {
    return <WorkspaceRouteFamilyController />;
  }
  return <StaffEntrySurfaceApp />;
}
