import "@vecells/design-system/foundation.css";
import "@vecells/surface-postures/surface-postures.css";
import { useEffect, useState } from "react";
import "./staff-entry-surfaces.css";
import "./support-workspace-shell.css";
import "./workspace-shell.css";
import { StaffEntrySurfaceApp } from "./staff-entry-surfaces";
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
  if (isWorkspaceShellPath(pathname)) {
    return <WorkspaceRouteFamilyController />;
  }
  return <StaffEntrySurfaceApp />;
}
