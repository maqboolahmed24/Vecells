import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PatientShellSeedApp } from "./patient-shell-seed";

describe("patient shell seed app", () => {
  it("renders the authenticated shell scaffold with nav, status, and decision dock", () => {
    const html = renderToStaticMarkup(<PatientShellSeedApp initialPathname="/home" />);

    expect(html).toContain('data-testid="patient-shell-root"');
    expect(html).toContain('data-testid="patient-primary-nav"');
    expect(html).toContain('data-testid="patient-decision-dock"');
    expect(html).toContain("patient-shell-seed__brand-lockup");
    expect(html).toContain('viewBox="35 49 889 232"');
    expect(html).toContain("Samira");
  });

  it("renders quiet home as a true calm state rather than dashboard filler", () => {
    const html = renderToStaticMarkup(
      <PatientShellSeedApp initialPathname="/home" initialMemory={{ homeMode: "quiet" }} />,
    );

    expect(html).toContain("Nothing urgent is waiting for you right now");
    expect(html).toContain('data-testid="quiet-home-next-step"');
    expect(html).not.toContain("KPI");
  });

  it("renders record trend and table parity on the records route", () => {
    const html = renderToStaticMarkup(<PatientShellSeedApp initialPathname="/records" />);

    expect(html).toContain('data-testid="patient-record-trend"');
    expect(html).toContain('data-testid="patient-record-table"');
    expect(html).toContain("<table");
    expect(html).toContain("Ferritin result");
  });

  it("renders read-only appointments and bounded recovery inside the same shell", () => {
    const appointmentHtml = renderToStaticMarkup(
      <PatientShellSeedApp initialPathname="/appointments" />,
    );
    const recoveryHtml = renderToStaticMarkup(
      <PatientShellSeedApp initialPathname="/recovery/secure-link" />,
    );

    expect(appointmentHtml).toContain('data-browser-posture="read_only"');
    expect(appointmentHtml).toContain('data-testid="patient-inline-guard"');
    expect(recoveryHtml).toContain('data-browser-posture="recovery_only"');
    expect(recoveryHtml).toContain('data-testid="patient-recovery-stage"');
  });

  it("renders message-thread continuity and blocked-contact posture without chat-app framing", () => {
    const html = renderToStaticMarkup(
      <PatientShellSeedApp initialPathname="/messages/thread/THR-399" />,
    );

    expect(html).toContain('data-testid="patient-message-thread"');
    expect(html).toContain("reply posture is bounded");
    expect(html).not.toContain("typing");
  });
});
