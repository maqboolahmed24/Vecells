import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  HomeSpotlightCard,
  QuietHomePanel,
} from "./patient-home-requests-detail-routes";
import {
  normalizePatientHomeRequestsDetailPath,
  resolvePatientHomeRequestsDetailEntry,
} from "./patient-home-requests-detail-routes.model";

describe("patient home requests detail routes", () => {
  it("renders start-new-request entry on the attention home surface", () => {
    const entry = resolvePatientHomeRequestsDetailEntry({ pathname: "/home" });
    const html = renderToStaticMarkup(
      <HomeSpotlightCard home={entry.home} onNavigate={() => {}} />,
    );

    expect(html).toContain('data-testid="home-start-new-request"');
    expect(html).toContain("Start new request");
    expect(html).toContain('data-testid="home-spotlight-primary-action"');
  });

  it("renders start-new-request entry on the quiet home surface", () => {
    const entry = resolvePatientHomeRequestsDetailEntry({ pathname: "/home/quiet" });
    const html = renderToStaticMarkup(<QuietHomePanel home={entry.home} onNavigate={() => {}} />);

    expect(html).toContain('data-testid="quiet-home-start-new-request"');
    expect(html).toContain("Start new request");
    expect(html).toContain('data-testid="quiet-home-review-requests"');
  });

  it("normalizes retired patient shell paths back to the canonical patient home", () => {
    expect(normalizePatientHomeRequestsDetailPath("/home/embedded")).toBe("/home");
    expect(normalizePatientHomeRequestsDetailPath("/records/REC-HEM-8/follow-up")).toBe("/home");
    expect(resolvePatientHomeRequestsDetailEntry({ pathname: "/home/embedded" }).routeKey).toBe(
      "home",
    );
  });
});
