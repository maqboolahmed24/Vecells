import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("patient app routing", () => {
  it("uses the canonical patient home as the default patient surface", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('data-testid="Patient_Home_Requests_Detail_Route"');
    expect(html).toContain('data-visual-mode="Quiet_Casework_Premium"');
    expect(html).not.toContain("Patient_Shell_Gallery");
    expect(html).not.toContain("patient-shell-seed");
  });
});
