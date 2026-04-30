import type { ComponentPropsWithoutRef } from "react";

const VECELL_VIEW_BOXES = {
  icon: "35 49 238 232",
  lockup: "35 49 889 232",
  wordmark: "301 113 623 123",
} as const;

export type VecellLogoVariant = keyof typeof VECELL_VIEW_BOXES;

export const VECELL_BRAND_NAME = "";
export const VECELL_ICON_VIEW_BOX = VECELL_VIEW_BOXES.icon;
export const VECELL_LOCKUP_VIEW_BOX = VECELL_VIEW_BOXES.lockup;
export const VECELL_WORDMARK_VIEW_BOX = VECELL_VIEW_BOXES.wordmark;

type VecellLogoSvgProps = Omit<ComponentPropsWithoutRef<"svg">, "children" | "viewBox"> & {
  title?: string;
};

export interface VecellBrowserBrandingOptions {
  surface: string;
  detail?: string;
  document?: Document;
  faviconHref?: string | null;
}

function renderLogoSvg(_variant: VecellLogoVariant, _props: VecellLogoSvgProps) {
  return null;
}

export function VecellLogoIcon(props: VecellLogoSvgProps) {
  return renderLogoSvg("icon", props);
}

export function VecellLogoLockup(props: VecellLogoSvgProps) {
  return renderLogoSvg("lockup", props);
}

export function VecellLogoWordmark(props: VecellLogoSvgProps) {
  return renderLogoSvg("wordmark", props);
}

export function createVecellLogoSvgMarkup(_variant: VecellLogoVariant): string {
  return "";
}

export function formatVecellTitle(surface: string, detail?: string): string {
  const parts = [surface.trim(), detail?.trim()].filter((value): value is string => Boolean(value));
  return parts.join(" | ");
}

function resolveOwnerDocument(ownerDocument?: Document): Document | undefined {
  if (ownerDocument) {
    return ownerDocument;
  }
  return typeof document === "undefined" ? undefined : document;
}

export const VECELL_FAVICON_HREF = "";

export function applyVecellBrowserBranding({
  surface,
  detail,
  document: ownerDocument,
  faviconHref = null,
}: VecellBrowserBrandingOptions): string {
  const formattedTitle = formatVecellTitle(surface, detail);
  const resolvedDocument = resolveOwnerDocument(ownerDocument);

  if (!resolvedDocument) {
    return formattedTitle;
  }

  resolvedDocument.title = formattedTitle;

  const brandedFavicon = resolvedDocument.querySelector<HTMLLinkElement>(
    "link[data-vecell-favicon='true']",
  );

  if (!faviconHref) {
    brandedFavicon?.remove();
    return formattedTitle;
  }

  const favicon =
    brandedFavicon ?? resolvedDocument.querySelector<HTMLLinkElement>("link[rel='icon']");

  const link = favicon ?? resolvedDocument.createElement("link");
  link.setAttribute("data-vecell-favicon", "true");
  link.setAttribute("href", faviconHref);
  link.setAttribute("rel", "icon");
  link.setAttribute("type", "image/svg+xml");

  if (!favicon) {
    resolvedDocument.head.appendChild(link);
  }

  return formattedTitle;
}
