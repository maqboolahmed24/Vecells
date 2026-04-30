import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  HomeSpotlightCard,
  PatientShellFrame,
  QuietHomePanel,
  RequestIndexRail,
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

  it("keeps the account route in the canonical patient shell", () => {
    const entry = resolvePatientHomeRequestsDetailEntry({ pathname: "/portal/account" });

    expect(normalizePatientHomeRequestsDetailPath("/portal/account")).toBe("/portal/account");
    expect(entry.routeKey).toBe("account");
    expect(entry.home.portalNavigation.items.find((item) => item.id === "account")).toMatchObject({
      path: "/portal/account",
      ariaCurrent: true,
      placeholder: false,
    });
  });

  it("keeps request bucket counts while hiding inactive filtered buckets", () => {
    const entry = resolvePatientHomeRequestsDetailEntry({
      pathname: "/requests",
      selectedFilterRef: "needs_attention",
    });
    const html = renderToStaticMarkup(
      <RequestIndexRail
        index={entry.requestsIndex}
        selectedFilterRef="needs_attention"
        onFilter={() => {}}
        onOpen={() => {}}
      />,
    );

    expect(entry.requestsIndex.groups.map((group) => group.requests.length)).toEqual([1, 2, 1]);
    expect(html).toContain("Needs attention");
    expect(html).toContain("Dermatology request");
    expect(html).not.toContain("Requests the practice is still working on.");
    expect(html).not.toContain("Pharmacy referral");
  });

  it("does not visually select a stale detail row on the requests index", () => {
    const restoredBundle = resolvePatientHomeRequestsDetailEntry({
      pathname: "/requests/request_211_b",
      selectedFilterRef: "in_progress",
    }).returnBundle;
    const entry = resolvePatientHomeRequestsDetailEntry({
      pathname: "/requests",
      restoredBundle,
    });
    const html = renderToStaticMarkup(
      <RequestIndexRail
        index={entry.requestsIndex}
        selectedFilterRef={entry.requestsIndex.activeFilterSetRef}
        onFilter={() => {}}
        onOpen={() => {}}
      />,
    );

    expect(entry.requestsIndex.selectedAnchorRef).toBeNull();
    expect(html).not.toContain('data-selected="true"');
  });

  it("renders the shared request update before the request workspace", () => {
    const entry = resolvePatientHomeRequestsDetailEntry({ pathname: "/requests" });
    const html = renderToStaticMarkup(
      <PatientShellFrame
        entry={entry}
        announcement="Requests loaded."
        mainHeadingRef={{ current: null }}
        onNavigate={() => {}}
      >
        <div data-testid="request-workspace-marker">Request workspace</div>
      </PatientShellFrame>,
    );

    expect(html.indexOf('data-testid="PatientRequestStatusSummary"')).toBeLessThan(
      html.indexOf('data-testid="request-workspace-marker"'),
    );
  });
});
