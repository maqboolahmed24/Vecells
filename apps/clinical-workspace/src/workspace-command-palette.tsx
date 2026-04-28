import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildStaffPath,
  parseStaffPath,
  staffQueues,
  type StaffRouteKind,
  type StaffShellRoute,
} from "./workspace-shell.data";

export interface WorkspaceCommandPaletteEntry {
  id: string;
  label: string;
  summary: string;
  route: StaffShellRoute;
}

function baseEntries(activeQueueKey: string, activeTaskId: string): readonly WorkspaceCommandPaletteEntry[] {
  return [
    {
      id: "command-home",
      label: "Open home",
      summary: "Return to the workspace home and interruption digest.",
      route: parseStaffPath("/workspace"),
    },
    {
      id: "command-queue",
      label: "Open current queue",
      summary: `Return to ${activeQueueKey} without losing the current shell.`,
      route: parseStaffPath(buildStaffPath({ kind: "queue", queueKey: activeQueueKey })),
    },
    {
      id: "command-task",
      label: "Open current task",
      summary: `Jump back into ${activeTaskId} inside the same shell.`,
      route: parseStaffPath(buildStaffPath({ kind: "task", taskId: activeTaskId })),
    },
    {
      id: "command-more-info",
      label: "Open more-info child route",
      summary: "Resume the same task in the bounded more-info stage.",
      route: parseStaffPath(buildStaffPath({ kind: "more-info", taskId: activeTaskId })),
    },
    {
      id: "command-decision",
      label: "Open decision child route",
      summary: "Resume the same task in the endpoint reasoning stage.",
      route: parseStaffPath(buildStaffPath({ kind: "decision", taskId: activeTaskId })),
    },
    {
      id: "command-approvals",
      label: "Open approvals",
      summary: "Open the governed approval workbench.",
      route: parseStaffPath("/workspace/approvals"),
    },
    {
      id: "command-escalations",
      label: "Open escalations",
      summary: "Open the urgent escalation workbench.",
      route: parseStaffPath("/workspace/escalations"),
    },
    {
      id: "command-callbacks",
      label: "Open callbacks",
      summary: "Open the callback operations deck.",
      route: parseStaffPath("/workspace/callbacks"),
    },
    {
      id: "command-messages",
      label: "Open messages",
      summary: "Open the clinician-message repair surface.",
      route: parseStaffPath("/workspace/messages"),
    },
    {
      id: "command-consequences",
      label: "Open consequences",
      summary: "Open the self-care and bounded admin consequence studio.",
      route: parseStaffPath("/workspace/consequences"),
    },
    {
      id: "command-changed",
      label: "Open changed review",
      summary: "Open changed-since-seen resume work.",
      route: parseStaffPath("/workspace/changed"),
    },
    {
      id: "command-validation",
      label: "Open validation board",
      summary: "Open the workspace validation board.",
      route: parseStaffPath("/workspace/validation"),
    },
    {
      id: "command-bookings",
      label: "Open bookings",
      summary: "Open the staff-assisted booking control panel.",
      route: parseStaffPath("/workspace/bookings"),
    },
    {
      id: "command-search",
      label: "Open search",
      summary: "Open the same-shell search route.",
      route: parseStaffPath("/workspace/search"),
    },
    ...staffQueues.map((queue) => ({
      id: `command-queue-${queue.key}`,
      label: `Queue: ${queue.label}`,
      summary: queue.description,
      route: parseStaffPath(buildStaffPath({ kind: "queue", queueKey: queue.key })),
    })),
  ];
}

export function WorkspaceCommandPalette({
  open,
  activeQueueKey,
  activeTaskId,
  currentRouteKind,
  onClose,
  onSelectRoute,
}: {
  open: boolean;
  activeQueueKey: string;
  activeTaskId: string;
  currentRouteKind: StaffRouteKind;
  onClose: () => void;
  onSelectRoute: (route: StaffShellRoute) => void;
}) {
  const [query, setQuery] = useState("");
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const entries = useMemo(
    () => baseEntries(activeQueueKey, activeTaskId),
    [activeQueueKey, activeTaskId],
  );
  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return entries;
    }
    return entries.filter((entry) =>
      [entry.label, entry.summary, entry.route.kind, entry.route.path].join(" ").toLowerCase().includes(normalized),
    );
  }, [entries, query]);

  useEffect(() => {
    if (!open) {
      const restoreTarget = restoreFocusRef.current;
      restoreFocusRef.current = null;
      setQuery("");
      window.requestAnimationFrame(() => restoreTarget?.focus());
      return;
    }
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      const input = document.getElementById("workspace-command-palette-input") as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="staff-shell__command-palette-backdrop"
      data-testid="WorkspaceCommandPalette"
      data-route-kind={currentRouteKind}
      role="presentation"
      onClick={onClose}
    >
      <section
        className="staff-shell__command-palette"
        data-testid="WorkspaceCommandPaletteDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-command-palette-title"
        aria-describedby="workspace-command-palette-summary"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="staff-shell__command-palette-head">
          <div>
            <span className="staff-shell__eyebrow">WorkspaceCommandPalette</span>
            <h2 id="workspace-command-palette-title">Jump without replacing the shell</h2>
            <p id="workspace-command-palette-summary">
              Search route-family jumps and same-task child states. Open and close stay fixed-position so the shell layout does not shift.
            </p>
          </div>
          <button
            type="button"
            className="staff-shell__command-palette-close"
            onClick={onClose}
            aria-label="Close command palette"
          >
            Close
          </button>
        </header>

        <label className="staff-shell__command-palette-search">
          <span className="sr-only">Search workspace jumps</span>
          <input
            id="workspace-command-palette-input"
            aria-label="Search workspace jumps"
            placeholder="Search queues, routes, and task jumps"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </label>

        <div
          className="staff-shell__command-palette-results"
          data-testid="WorkspaceCommandPaletteResults"
          role="listbox"
          aria-label="Workspace command palette results"
        >
          {filteredEntries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="staff-shell__command-palette-entry"
              data-command-route-kind={entry.route.kind}
              onClick={() => {
                onSelectRoute(entry.route);
                onClose();
              }}
            >
              <strong>{entry.label}</strong>
              <span>{entry.summary}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
