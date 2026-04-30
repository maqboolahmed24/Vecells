import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("patient app routing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the canonical patient home as the default patient surface", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('data-testid="Patient_Home_Requests_Detail_Route"');
    expect(html).toContain('data-visual-mode="Quiet_Casework_Premium"');
    expect(html).not.toContain("Patient_Shell_Gallery");
    expect(html).not.toContain("patient-shell-seed");
  });

  it("aliases the old portal home route to the canonical patient home UI", () => {
    vi.stubGlobal("window", {
      location: { pathname: "/portal/home", search: "" },
      sessionStorage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      },
    });

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('data-testid="Patient_Home_Requests_Detail_Route"');
    expect(html).not.toContain('data-testid="Authenticated_Patient_Home_Status_Tracker_Route"');
  });
});
