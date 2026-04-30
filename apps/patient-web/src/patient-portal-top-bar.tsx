import { VecellLogoWordmark } from "@vecells/design-system";
import type { MouseEvent, ReactNode } from "react";

export type PatientPortalTopBarItemId =
  | "home"
  | "requests"
  | "appointments"
  | "records"
  | "messages"
  | "account";

export interface PatientPortalTopBarItem {
  readonly id: PatientPortalTopBarItemId;
  readonly label: string;
  readonly href: string;
  readonly badgeLabel?: string | null;
  readonly currentBadgeLabel?: string | null;
}

export const PATIENT_PORTAL_TOP_BAR_ITEMS: readonly PatientPortalTopBarItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/home",
    currentBadgeLabel: "Current",
  },
  {
    id: "requests",
    label: "Requests",
    href: "/requests",
    badgeLabel: "4",
  },
  {
    id: "appointments",
    label: "Appointments",
    href: "/appointments",
  },
  {
    id: "records",
    label: "Records",
    href: "/records",
  },
  {
    id: "messages",
    label: "Messages",
    href: "/messages",
  },
  {
    id: "account",
    label: "Account",
    href: "/portal/account",
  },
];

export interface PatientPortalTopBarProps {
  readonly current?: PatientPortalTopBarItemId | null;
  readonly patientRef?: string;
  readonly navItems?: readonly PatientPortalTopBarItem[];
  readonly testId?: string;
  readonly navTestIdPrefix?: string;
  readonly ariaLabel?: string;
  readonly onNavigate?: (href: string) => void;
  readonly actions?: ReactNode;
}

export function PatientPortalTopBar({
  current = null,
  patientRef = "NHS 943 *** 7812",
  navItems = PATIENT_PORTAL_TOP_BAR_ITEMS,
  testId = "patient-portal-topbar",
  navTestIdPrefix = "patient-shell-nav",
  ariaLabel = "Patient portal",
  onNavigate,
  actions,
}: PatientPortalTopBarProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>, href: string): void {
    if (
      !onNavigate ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate(href);
  }

  return (
    <header className="patient-portal-topbar" data-testid={testId}>
      <a
        className="patient-portal-topbar__brand"
        href="/home"
        onClick={(event) => handleClick(event, "/home")}
      >
        <span>
          <VecellLogoWordmark aria-hidden="true" className="patient-portal-topbar__wordmark" />
          <small>{patientRef}</small>
        </span>
      </a>
      <nav className="patient-portal-topbar__nav" aria-label={ariaLabel}>
        {navItems.map((item) => {
          const active = item.id === current;
          const badgeLabel = active
            ? (item.currentBadgeLabel ?? item.badgeLabel ?? null)
            : (item.badgeLabel ?? null);
          return (
            <a
              key={item.id}
              className="patient-portal-topbar__nav-link"
              href={item.href}
              aria-current={active ? "page" : undefined}
              data-testid={`${navTestIdPrefix}-${item.id}`}
              onClick={(event) => handleClick(event, item.href)}
            >
              <span>{item.label}</span>
              {badgeLabel ? <em>{badgeLabel}</em> : null}
            </a>
          );
        })}
      </nav>
      {actions ? <div className="patient-portal-topbar__actions">{actions}</div> : null}
    </header>
  );
}
