import React from "react";
import ReactDOM from "react-dom/client";
import { applyVecellBrowserBranding } from "@vecells/design-system";
import App from "./App";
import "./styles.css";

applyVecellBrowserBranding({ surface: "IM1 Pairing Studio" });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
