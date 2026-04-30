import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Clinical Workspace app routing", () => {
  it("defaults retired staff workspace routes to the newer support workspace surface", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('data-testid="SupportTicketRoute"');
    expect(html).not.toContain('data-testid="staff-shell-root"');
    expect(html).not.toContain('data-testid="WorkspaceShellRouteFamily"');
  });
});
