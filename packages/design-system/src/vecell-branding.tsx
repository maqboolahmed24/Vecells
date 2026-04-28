import type { ComponentPropsWithoutRef } from "react";

const VECELL_LOGO_PATH_D =
  "M 301 115 L 347 233 L 374 234 L 422 115 L 395 116 L 372 179 L 361 203 L 328 116 Z M 746 113 L 723 120 L 715 125 L 702 139 L 693 162 L 693 188 L 700 207 L 713 223 L 735 234 L 762 236 L 775 233 L 789 226 L 801 214 L 808 200 L 782 200 L 777 207 L 767 213 L 748 215 L 732 209 L 724 201 L 720 193 L 719 185 L 811 184 L 811 158 L 804 140 L 787 122 L 768 114 Z M 719 161 L 723 150 L 732 140 L 746 134 L 759 134 L 772 139 L 780 147 L 784 155 L 785 163 L 720 164 Z M 620 113 L 596 121 L 578 137 L 568 160 L 567 183 L 571 199 L 576 209 L 591 225 L 604 232 L 618 236 L 639 236 L 653 232 L 667 224 L 676 214 L 680 205 L 658 195 L 649 207 L 636 213 L 622 213 L 611 209 L 600 199 L 595 188 L 594 165 L 596 158 L 606 144 L 619 137 L 634 136 L 644 139 L 657 153 L 678 143 L 679 140 L 666 124 L 656 118 L 639 113 Z M 477 114 L 454 124 L 444 133 L 437 143 L 431 157 L 429 168 L 430 189 L 435 204 L 442 215 L 457 228 L 480 236 L 506 235 L 530 223 L 541 210 L 545 200 L 519 200 L 513 208 L 504 213 L 483 215 L 472 211 L 462 202 L 458 195 L 456 185 L 549 184 L 548 157 L 538 135 L 524 122 L 505 114 Z M 456 161 L 461 148 L 469 140 L 484 134 L 495 134 L 509 139 L 517 146 L 522 157 L 521 164 L 457 164 Z M 899 66 L 898 233 L 924 233 L 924 67 Z M 838 66 L 837 233 L 862 233 L 862 67 Z M 37 49 L 35 86 L 41 113 L 49 130 L 58 143 L 67 152 L 81 161 L 60 162 L 54 156 L 46 156 L 40 163 L 41 171 L 48 176 L 55 175 L 60 169 L 80 170 L 69 177 L 57 189 L 43 213 L 35 248 L 35 266 L 38 281 L 76 279 L 97 273 L 116 264 L 138 245 L 150 223 L 151 248 L 146 252 L 144 260 L 148 267 L 153 269 L 159 268 L 164 262 L 164 255 L 157 248 L 158 221 L 164 235 L 173 248 L 196 266 L 228 278 L 246 281 L 271 281 L 273 246 L 267 218 L 252 190 L 244 181 L 228 170 L 249 169 L 252 174 L 262 176 L 269 169 L 267 159 L 262 156 L 255 156 L 249 162 L 228 161 L 240 153 L 252 141 L 266 116 L 273 85 L 271 49 L 251 49 L 230 52 L 197 64 L 183 73 L 170 86 L 158 109 L 157 83 L 164 76 L 164 69 L 159 63 L 152 62 L 148 64 L 144 70 L 146 79 L 151 83 L 150 108 L 143 93 L 134 81 L 113 65 L 78 52 L 59 49 Z M 153 254 L 159 257 L 156 263 L 150 261 L 150 257 Z M 228 228 L 236 232 L 236 238 L 232 242 L 227 242 L 223 238 L 223 233 Z M 78 228 L 84 230 L 86 233 L 86 238 L 82 242 L 76 242 L 72 237 L 72 233 Z M 176 176 L 186 178 L 198 184 L 210 195 L 219 208 L 225 207 L 227 201 L 222 191 L 207 176 L 208 175 L 224 181 L 242 197 L 253 216 L 259 235 L 261 250 L 259 269 L 235 267 L 212 260 L 191 248 L 179 236 L 171 221 L 169 201 L 177 215 L 190 229 L 206 238 L 214 240 L 218 246 L 224 250 L 231 251 L 237 249 L 243 243 L 245 235 L 241 225 L 232 220 L 224 221 L 216 228 L 198 220 L 184 204 L 177 187 Z M 132 176 L 133 181 L 128 197 L 113 218 L 95 228 L 85 221 L 77 220 L 70 223 L 64 232 L 65 242 L 70 248 L 78 251 L 87 249 L 94 240 L 105 237 L 121 227 L 131 216 L 139 202 L 140 209 L 133 231 L 127 239 L 116 249 L 94 261 L 73 267 L 50 269 L 48 267 L 50 231 L 55 216 L 67 196 L 83 182 L 102 174 L 103 175 L 91 185 L 82 199 L 83 207 L 90 208 L 97 197 L 109 185 L 123 178 Z M 257 161 L 262 162 L 264 165 L 259 171 L 254 167 Z M 48 161 L 52 161 L 55 164 L 55 167 L 51 171 L 45 166 Z M 154 130 L 162 155 L 162 175 L 154 201 L 147 177 L 147 154 Z M 226 89 L 230 88 L 236 92 L 234 101 L 226 102 L 223 99 L 223 92 Z M 78 88 L 86 93 L 86 98 L 80 103 L 72 98 L 72 93 Z M 154 67 L 159 70 L 159 74 L 156 77 L 150 74 L 150 70 Z M 259 62 L 261 74 L 259 96 L 254 113 L 241 135 L 226 148 L 209 155 L 208 154 L 219 144 L 226 133 L 227 126 L 220 122 L 203 143 L 192 150 L 176 155 L 177 144 L 184 127 L 199 110 L 216 103 L 220 108 L 232 111 L 243 103 L 245 96 L 240 84 L 231 80 L 220 83 L 214 91 L 205 93 L 191 101 L 179 113 L 169 129 L 168 124 L 171 110 L 184 89 L 201 76 L 224 66 L 244 62 Z M 49 61 L 70 63 L 95 70 L 114 80 L 129 94 L 138 112 L 140 121 L 139 129 L 131 115 L 120 103 L 106 94 L 94 91 L 85 81 L 77 80 L 70 83 L 65 89 L 64 99 L 66 104 L 76 111 L 85 110 L 93 103 L 111 111 L 124 126 L 131 141 L 134 152 L 133 155 L 110 146 L 98 135 L 92 124 L 88 122 L 83 124 L 82 131 L 91 145 L 102 154 L 102 156 L 87 151 L 67 135 L 55 115 L 49 96 L 47 82 Z";

const VECELL_VIEW_BOXES = {
  icon: "35 49 238 232",
  lockup: "35 49 889 232",
  wordmark: "301 113 623 123",
} as const;

export type VecellLogoVariant = keyof typeof VECELL_VIEW_BOXES;

export const VECELL_BRAND_NAME = "vecell";
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
  faviconHref?: string;
}

function resolveAriaLabel(
  ariaHidden: boolean | undefined,
  ariaLabel: string | undefined,
  title: string | undefined,
): string | undefined {
  if (ariaHidden) {
    return undefined;
  }
  return ariaLabel ?? title ?? VECELL_BRAND_NAME;
}

function renderLogoSvg(
  variant: VecellLogoVariant,
  { title, ...svgProps }: VecellLogoSvgProps,
) {
  const ariaHidden =
    svgProps["aria-hidden"] === true || svgProps["aria-hidden"] === "true";
  const ariaLabel = resolveAriaLabel(ariaHidden, svgProps["aria-label"], title);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      preserveAspectRatio={variant === "icon" ? "xMidYMid meet" : "xMinYMid meet"}
      role={ariaHidden ? undefined : "img"}
      viewBox={VECELL_VIEW_BOXES[variant]}
      {...svgProps}
      aria-label={ariaLabel}
    >
      {title && !ariaHidden ? <title>{title}</title> : null}
      <path d={VECELL_LOGO_PATH_D} fill="currentColor" />
    </svg>
  );
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

export function createVecellLogoSvgMarkup(variant: VecellLogoVariant): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VECELL_VIEW_BOXES[variant]}" fill="none">`,
    `  <path d="${VECELL_LOGO_PATH_D}" fill="#000" />`,
    "</svg>",
  ].join("\n");
}

export function formatVecellTitle(surface: string, detail?: string): string {
  const parts = [VECELL_BRAND_NAME, surface.trim(), detail?.trim()].filter(
    (value): value is string => Boolean(value),
  );
  return parts.join(" | ");
}

function resolveOwnerDocument(ownerDocument?: Document): Document | undefined {
  if (ownerDocument) {
    return ownerDocument;
  }
  return typeof document === "undefined" ? undefined : document;
}

export const VECELL_FAVICON_HREF = `data:image/svg+xml,${encodeURIComponent(
  createVecellLogoSvgMarkup("icon"),
)}`;

export function applyVecellBrowserBranding({
  surface,
  detail,
  document: ownerDocument,
  faviconHref = VECELL_FAVICON_HREF,
}: VecellBrowserBrandingOptions): string {
  const formattedTitle = formatVecellTitle(surface, detail);
  const resolvedDocument = resolveOwnerDocument(ownerDocument);

  if (!resolvedDocument) {
    return formattedTitle;
  }

  resolvedDocument.title = formattedTitle;

  const favicon =
    resolvedDocument.querySelector<HTMLLinkElement>("link[data-vecell-favicon='true']") ??
    resolvedDocument.querySelector<HTMLLinkElement>("link[rel='icon']");

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
