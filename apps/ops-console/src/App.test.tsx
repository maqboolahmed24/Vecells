import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Ops Console app routing", () => {
  it("defaults retired shell routes to the newer NHS app readiness surface", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('data-testid="NHSAppReadinessCockpit"');
    expect(html).not.toContain('data-testid="ops-shell-root"');
  });
});
