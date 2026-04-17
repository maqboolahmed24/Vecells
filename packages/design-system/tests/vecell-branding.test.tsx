import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  VECELL_FAVICON_HREF,
  VecellLogoIcon,
  VecellLogoLockup,
  VecellLogoWordmark,
  applyVecellBrowserBranding,
  createVecellLogoSvgMarkup,
  formatVecellTitle,
} from "../src/index.tsx";

class MockLinkElement {
  private readonly attributes = new Map<string, string>();

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

describe("vecell branding", () => {
  it("formats browser titles with optional detail segments", () => {
    expect(formatVecellTitle("Patient Web")).toBe("vecell | Patient Web");
    expect(formatVecellTitle("Support Workspace", "TCK-204")).toBe(
      "vecell | Support Workspace | TCK-204",
    );
  });

  it("creates and updates a single favicon link when browser branding is applied", () => {
    let faviconLink: MockLinkElement | null = null;
    let appendCount = 0;

    const mockDocument = {
      title: "",
      head: {
        appendChild: (element: MockLinkElement) => {
          faviconLink = element;
          appendCount += 1;
          return element;
        },
      },
      querySelector: (selector: string) => {
        if (
          selector === "link[data-vecell-favicon='true']" ||
          selector === "link[rel='icon']"
        ) {
          return faviconLink;
        }
        return null;
      },
      createElement: () => new MockLinkElement(),
    } as unknown as Document;

    const initialTitle = applyVecellBrowserBranding({
      document: mockDocument,
      surface: "Patient Web",
    });
    const updatedTitle = applyVecellBrowserBranding({
      document: mockDocument,
      detail: "Queue",
      surface: "Hub Desk",
    });

    expect(initialTitle).toBe("vecell | Patient Web");
    expect(updatedTitle).toBe("vecell | Hub Desk | Queue");
    expect(mockDocument.title).toBe("vecell | Hub Desk | Queue");
    expect(appendCount).toBe(1);
    expect(faviconLink?.getAttribute("data-vecell-favicon")).toBe("true");
    expect(faviconLink?.getAttribute("href")).toBe(VECELL_FAVICON_HREF);
    expect(faviconLink?.getAttribute("rel")).toBe("icon");
    expect(faviconLink?.getAttribute("type")).toBe("image/svg+xml");
  });

  it("renders icon, wordmark, and lockup from the same source geometry", () => {
    expect(renderToStaticMarkup(<VecellLogoIcon aria-hidden />)).toContain(
      'viewBox="35 49 238 232"',
    );
    expect(renderToStaticMarkup(<VecellLogoWordmark aria-hidden />)).toContain(
      'viewBox="301 113 623 123"',
    );
    expect(renderToStaticMarkup(<VecellLogoLockup aria-hidden />)).toContain(
      'viewBox="35 49 889 232"',
    );
    expect(createVecellLogoSvgMarkup("icon")).toContain("<path");
    expect(createVecellLogoSvgMarkup("wordmark")).toContain("<path");
    expect(createVecellLogoSvgMarkup("lockup")).toContain("<path");
  });
});
