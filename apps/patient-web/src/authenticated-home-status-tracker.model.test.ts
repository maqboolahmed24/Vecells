import { describe, expect, it } from "vitest";
import { resolveAuthenticatedPortalEntry } from "./authenticated-home-status-tracker.model";

describe("authenticated portal route aliases", () => {
  it("keeps messages inside the authenticated portal shell with the correct nav item current", () => {
    const entry = resolveAuthenticatedPortalEntry("/portal/messages");

    expect(entry.routeKey).toBe("messages");
    expect(entry.home.navigation.items.find((item) => item.id === "messages")?.ariaCurrent).toBe(
      true,
    );
    expect(entry.home.navigation.items.find((item) => item.id === "home")?.ariaCurrent).toBe(
      false,
    );
  });

  it("keeps account inside the authenticated portal shell with the correct nav item current", () => {
    const entry = resolveAuthenticatedPortalEntry("/portal/account");

    expect(entry.routeKey).toBe("account");
    expect(entry.home.navigation.items.find((item) => item.id === "account")?.ariaCurrent).toBe(
      true,
    );
    expect(entry.home.navigation.items.find((item) => item.id === "home")?.ariaCurrent).toBe(
      false,
    );
  });
});
