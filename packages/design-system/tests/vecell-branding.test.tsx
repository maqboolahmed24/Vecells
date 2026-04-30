import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
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
  it("formats browser titles without a brand segment", () => {
    expect(formatVecellTitle("Patient Web")).toBe("Patient Web");
    expect(formatVecellTitle("Support Workspace", "TCK-204")).toBe("Support Workspace | TCK-204");
  });

  it("updates the document title without injecting a branded favicon by default", () => {
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
        if (selector === "link[data-vecell-favicon='true']" || selector === "link[rel='icon']") {
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

    expect(initialTitle).toBe("Patient Web");
    expect(updatedTitle).toBe("Hub Desk | Queue");
    expect(mockDocument.title).toBe("Hub Desk | Queue");
    expect(appendCount).toBe(0);
    expect(faviconLink).toBeNull();
  });

  it("suppresses logo markup for icon, wordmark, and lockup slots", () => {
    expect(renderToStaticMarkup(<VecellLogoIcon aria-hidden />)).toBe("");
    expect(renderToStaticMarkup(<VecellLogoWordmark aria-hidden />)).toBe("");
    expect(renderToStaticMarkup(<VecellLogoLockup aria-hidden />)).toBe("");
    expect(createVecellLogoSvgMarkup("icon")).toBe("");
    expect(createVecellLogoSvgMarkup("wordmark")).toBe("");
    expect(createVecellLogoSvgMarkup("lockup")).toBe("");
  });
});
