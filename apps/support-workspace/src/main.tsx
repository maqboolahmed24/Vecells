import React from "react";
import ReactDOM from "react-dom/client";
import { applyVecellBrowserBranding } from "@vecells/design-system";
import App from "./App";

applyVecellBrowserBranding({ surface: "Support Workspace" });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
