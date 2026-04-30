import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Governance Console app routing", () => {
  it("defaults retired shell routes to the newer evidence vault surface", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('data-testid="evidence-vault-488"');
    expect(html).not.toContain('data-testid="governance-shell-root"');
  });
});
