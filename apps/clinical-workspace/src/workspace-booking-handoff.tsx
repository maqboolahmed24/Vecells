import { useEffect, useMemo, useState } from "react";
import type { RuntimeScenario } from "@vecells/persistent-shell";
import {
  BufferedQueueChangeTray,
  CompletionContinuityStage,
  NextTaskPostureCard,
  ProtectedCompositionRecovery,
  WorkspaceProtectionStrip,
} from "./workspace-focus-continuity";
import type { WorkspaceFocusContinuityProjection } from "./workspace-focus-continuity.data";
import {
  resolveStaffBookingHandoffProjectionByCaseId,
  type AssistedBookingCaseSummaryProjection,
  type AssistedBookingRecoveryPanelProjection,
  type AssistedSlotCompareStageProjection,
  type StaffAssistableSlotProjection,
  type StaffBookingHandoffProjection,
  type StaffBookingQueueRowProjection,
  type TaskSettlementAndReacquireStripProjection,
} from "./workspace-booking-handoff.model";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function labelFromToken(value: string) {
  return value.replaceAll("_", " ");
}

function SummaryRows({
  rows,
  className,
}: {
  rows: readonly { label: string; value: string }[];
  className?: string;
}) {
  return (
    <dl className={className ?? "staff-shell__booking-summary-list"}>
      {rows.map((row) => (
        <div key={`${row.label}:${row.value}`}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function BookingExceptionQueuePanel({
  rows,
  activeBookingCaseId,
  onOpenCase,
}: {
  rows: readonly StaffBookingQueueRowProjection[];
  activeBookingCaseId: string;
  onOpenCase: (bookingCaseId: string) => void;
}) {
  return (
    <section
      className="staff-shell__booking-queue"
      data-testid="BookingExceptionQueuePanel"
      aria-labelledby="booking-exception-queue-heading"
    >
      <header className="staff-shell__booking-section-head">
        <div>
          <span className="staff-shell__eyebrow">BookingExceptionQueuePanel</span>
          <h3 id="booking-exception-queue-heading">Booking exception queue</h3>
          <p>Machine-readable reason classes, age, and settlement status stay visible beside the active case.</p>
        </div>
        <span className="staff-shell__booking-queue-count">{rows.length}</span>
      </header>
      <div className="staff-shell__booking-queue-list" role="list">
        {rows.map((row) => (
          <article
            key={row.bookingCaseId}
            className="staff-shell__booking-queue-row"
            data-testid="BookingExceptionQueueRow"
            data-booking-case={row.bookingCaseId}
            data-exception-class={row.reasonClass}
            data-task-settlement={row.settlementState}
            data-review-lease-state={row.reviewLeaseState}
            data-selected={row.bookingCaseId === activeBookingCaseId ? "true" : "false"}
            role="listitem"
          >
            <button
              type="button"
              className="staff-shell__booking-queue-button"
              onClick={() => onOpenCase(row.bookingCaseId)}
            >
              <div className="staff-shell__booking-queue-head">
                <div>
                  <strong>{row.routeLabel}</strong>
                  <span>{row.patientLabel}</span>
                </div>
                <span className="staff-shell__booking-state-chip" data-tone={row.severity}>
                  {row.ageLabel}
                </span>
              </div>
              <p>{row.summary}</p>
              <div className="staff-shell__booking-queue-meta">
                <span>{row.reasonClass}</span>
                <span>{labelFromToken(row.settlementState)}</span>
                <span>{labelFromToken(row.reviewLeaseState)}</span>
              </div>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AssistedBookingCaseSummary({
  projection,
}: {
  projection: AssistedBookingCaseSummaryProjection;
}) {
  return (
    <section
      className="staff-shell__booking-case"
      data-testid="AssistedBookingCaseSummary"
      aria-labelledby="assisted-booking-case-heading"
    >
      <header className="staff-shell__booking-section-head">
        <div>
          <span className="staff-shell__eyebrow">AssistedBookingCaseSummary</span>
          <h3 id="assisted-booking-case-heading">{projection.caseTitle}</h3>
          <p>{projection.triageNeed}</p>
        </div>
        <div className="staff-shell__booking-signal-cluster">
          <span>{projection.patientLabel}</span>
          <span>{projection.patientRef}</span>
        </div>
      </header>

      <div className="staff-shell__booking-banner">
        <div>
          <strong>{projection.blockerHeadline}</strong>
          <p>{projection.blockerBody}</p>
        </div>
        <div className="staff-shell__booking-signal-cluster">
          <span>{projection.selfServiceCapabilityLabel}</span>
          <span>{projection.staffCapabilityLabel}</span>
        </div>
      </div>

      <div className="staff-shell__booking-case-grid">
        <section className="staff-shell__booking-card">
          <header className="staff-shell__task-stack-header">
            <span className="staff-shell__eyebrow">Patient preference summary</span>
            <h4>What still matters to the booking</h4>
          </header>
          <SummaryRows rows={projection.preferenceRows} />
        </section>
        <section className="staff-shell__booking-card">
          <header className="staff-shell__task-stack-header">
            <span className="staff-shell__eyebrow">Case state</span>
            <h4>Current lawful status</h4>
          </header>
          <SummaryRows rows={projection.stateRows} />
        </section>
      </div>

      <footer className="staff-shell__booking-dominant-action">
        <div>
          <strong>{projection.dominantActionLabel}</strong>
          <p>{projection.dominantActionDetail}</p>
        </div>
      </footer>
    </section>
  );
}

function SlotCard({
  slotProjection,
  expanded,
  selectionWritable,
  onSelect,
  onCompare,
  onToggleExpanded,
}: {
  slotProjection: StaffAssistableSlotProjection;
  expanded: boolean;
  selectionWritable: boolean;
  onSelect: () => void;
  onCompare: () => void;
  onToggleExpanded: () => void;
}) {
  const detailId = `booking-slot-details-${slotProjection.slotId}`;
  const selectLabel =
    slotProjection.actionState === "selected" || slotProjection.actionState === "confirmed" || slotProjection.actionState === "pending"
      ? "Selected slot pinned"
      : "Select slot";
  const compareLabel = slotProjection.compareTarget ? "Compare anchor pinned" : "Use as compare anchor";

  return (
    <article
      className="staff-shell__booking-slot"
      data-testid="BookingAssistableSlotCard"
      data-slot-id={slotProjection.slotId}
      data-supply-mode={slotProjection.supplyMode}
      data-reservation-truth={slotProjection.reservationTruth}
      data-slot-state={slotProjection.actionState}
    >
      <header className="staff-shell__booking-slot-head">
        <div>
          <strong>
            {slotProjection.dayLabel} {slotProjection.startLabel} - {slotProjection.endLabel}
          </strong>
          <p>
            {slotProjection.siteLabel} · {slotProjection.clinicianLabel}
          </p>
        </div>
        <div className="staff-shell__booking-signal-cluster">
          <span className="staff-shell__booking-state-chip" data-tone={slotProjection.supplyMode === "staff_assist_only" ? "caution" : "info"}>
            {slotProjection.supplyModeLabel}
          </span>
          <span className="staff-shell__booking-state-chip" data-tone={slotProjection.reservationTruth === "confirmed" ? "safe" : slotProjection.reservationTruth === "exclusive_held" ? "accent" : slotProjection.reservationTruth === "pending_confirmation" ? "caution" : slotProjection.reservationTruth === "revalidation_required" || slotProjection.reservationTruth === "expired" ? "critical" : "info"}>
            {slotProjection.reservationTruthLabel}
          </span>
        </div>
      </header>

      <div className="staff-shell__booking-slot-meta">
        <span>{slotProjection.deliveryModeLabel}</span>
        <span>{slotProjection.accessLabel}</span>
        <span>{slotProjection.travelCue}</span>
      </div>

      <p className="staff-shell__booking-slot-copy">{slotProjection.rankingCue}</p>
      <p className="staff-shell__booking-slot-note">{slotProjection.patientFacingAvailability}</p>
      <div className="staff-shell__booking-slot-cue" role="status" aria-atomic="true">
        {slotProjection.dominantCue}
      </div>

      <div className="staff-shell__booking-slot-actions">
        <button
          type="button"
          className="staff-shell__inline-action"
          data-testid={`booking-select-slot-${slotProjection.slotId}`}
          disabled={!selectionWritable || slotProjection.actionState === "pending" || slotProjection.actionState === "confirmed"}
          onClick={onSelect}
        >
          {selectLabel}
        </button>
        <button
          type="button"
          className="staff-shell__utility-button"
          data-testid={`booking-compare-slot-${slotProjection.slotId}`}
          disabled={!selectionWritable || slotProjection.actionState === "pending" || slotProjection.actionState === "confirmed"}
          onClick={onCompare}
        >
          {compareLabel}
        </button>
        <button
          type="button"
          className="staff-shell__utility-button"
          aria-expanded={expanded}
          aria-controls={detailId}
          onClick={onToggleExpanded}
        >
          {expanded ? "Hide slot detail" : "Show slot detail"}
        </button>
      </div>

      {expanded && (
        <div id={detailId} className="staff-shell__booking-slot-detail">
          <SummaryRows rows={slotProjection.detailRows} className="staff-shell__booking-slot-summary-list" />
        </div>
      )}
    </article>
  );
}

export function StaffAssistableSlotList({
  slots,
  selectedSlotId,
  compareSlotId,
  expandedSlotId,
  selectionWritable,
  onSelectSlot,
  onCompareSlot,
  onExpandedSlotChange,
}: {
  slots: readonly StaffAssistableSlotProjection[];
  selectedSlotId: string | null;
  compareSlotId: string | null;
  expandedSlotId: string | null;
  selectionWritable: boolean;
  onSelectSlot: (slotId: string) => void;
  onCompareSlot: (slotId: string) => void;
  onExpandedSlotChange: (slotId: string | null) => void;
}) {
  return (
    <section
      className="staff-shell__booking-slots"
      data-testid="StaffAssistableSlotList"
      aria-labelledby="staff-assistable-slot-list-heading"
    >
      <header className="staff-shell__booking-section-head">
        <div>
          <span className="staff-shell__eyebrow">StaffAssistableSlotList</span>
          <h3 id="staff-assistable-slot-list-heading">Assistable slot list</h3>
          <p>Uses the same slot ranking and reservation status wording as the patient flow, but with staff-only supply tagged explicitly.</p>
        </div>
        <div className="staff-shell__booking-signal-cluster">
          <span>Selected: {selectedSlotId ?? "none"}</span>
          <span>Compare: {compareSlotId ?? "none"}</span>
        </div>
      </header>

      <div className="staff-shell__booking-slot-list">
        {slots.map((slotProjection) => (
          <SlotCard
            key={slotProjection.slotId}
            slotProjection={{
              ...slotProjection,
              actionState:
                slotProjection.slotId === selectedSlotId
                  ? slotProjection.reservationTruth === "confirmed"
                    ? "confirmed"
                    : slotProjection.reservationTruth === "pending_confirmation"
                      ? "pending"
                      : "selected"
                  : slotProjection.slotId === compareSlotId
                    ? "compare_target"
                    : slotProjection.actionState,
            }}
            expanded={expandedSlotId === slotProjection.slotId}
            selectionWritable={selectionWritable}
            onSelect={() => onSelectSlot(slotProjection.slotId)}
            onCompare={() => onCompareSlot(slotProjection.slotId)}
            onToggleExpanded={() =>
              onExpandedSlotChange(expandedSlotId === slotProjection.slotId ? null : slotProjection.slotId)
            }
          />
        ))}
      </div>
    </section>
  );
}

function CompareSlotCard({
  title,
  slot,
}: {
  title: string;
  slot: StaffAssistableSlotProjection | null;
}) {
  return (
    <article className="staff-shell__booking-compare-card" data-empty={slot ? "false" : "true"}>
      <span className="staff-shell__eyebrow">{title}</span>
      {slot ? (
        <>
          <strong>
            {slot.dayLabel} {slot.startLabel} - {slot.endLabel}
          </strong>
          <p>
            {slot.siteLabel} · {slot.clinicianLabel}
          </p>
          <div className="staff-shell__booking-signal-cluster">
            <span>{slot.supplyModeLabel}</span>
            <span>{slot.reservationTruthLabel}</span>
          </div>
          <SummaryRows rows={slot.detailRows.slice(0, 3)} className="staff-shell__booking-compare-summary" />
        </>
      ) : (
        <>
          <strong>No compare target pinned</strong>
          <p>Select a compare anchor to keep a limited side-by-side review inside the same shell.</p>
        </>
      )}
    </article>
  );
}

export function AssistedSlotCompareStage({
  projection,
  selectedSlot,
  compareSlot,
}: {
  projection: AssistedSlotCompareStageProjection;
  selectedSlot: StaffAssistableSlotProjection | null;
  compareSlot: StaffAssistableSlotProjection | null;
}) {
  return (
    <section
      className="staff-shell__booking-compare"
      data-testid="AssistedSlotCompareStage"
      data-focus-lease-state={projection.focusLeaseState}
      data-focus-mode={projection.focusMode}
      aria-labelledby="assisted-slot-compare-heading"
    >
      <header className="staff-shell__booking-section-head">
        <div>
          <span className="staff-shell__eyebrow">AssistedSlotCompareStage</span>
          <h3 id="assisted-slot-compare-heading">{projection.heading}</h3>
          <p>{projection.body}</p>
        </div>
        <div className="staff-shell__booking-signal-cluster">
          <span>{projection.selectedAnchorRef}</span>
          <span>{projection.quietReturnTargetRef}</span>
        </div>
      </header>

      <div className="staff-shell__booking-compare-grid">
        <CompareSlotCard title="Selected anchor" slot={selectedSlot} />
        <CompareSlotCard title="Compare anchor" slot={compareSlot} />
      </div>

      <footer className="staff-shell__booking-compare-footer">
        <span>{projection.compareAnchorRefs.length ? projection.compareAnchorRefs.join(" · ") : "No compare anchors yet"}</span>
        <span>{projection.bufferedQueueChangeCount} buffered queue changes waiting</span>
      </footer>
    </section>
  );
}

export function AssistedBookingRecoveryPanel({
  projection,
  runtimeScenario,
  actionEnabled,
}: {
  projection: AssistedBookingRecoveryPanelProjection;
  runtimeScenario: RuntimeScenario;
  actionEnabled: boolean;
}) {
  return (
    <section
      className="staff-shell__booking-recovery"
      data-testid="AssistedBookingRecoveryPanel"
      data-recovery-mode={projection.mode}
      data-mutation-state={runtimeScenario === "live" ? "live" : "frozen"}
      aria-labelledby="assisted-booking-recovery-heading"
    >
      <header className="staff-shell__booking-section-head">
        <div>
          <span className="staff-shell__eyebrow">AssistedBookingRecoveryPanel</span>
          <h3 id="assisted-booking-recovery-heading">{projection.heading}</h3>
          <p>{projection.body}</p>
        </div>
      </header>
      <SummaryRows rows={projection.blockerRows} />
      <p className="staff-shell__booking-muted-note">{projection.subduedNote}</p>
      <div className="staff-shell__booking-recovery-actions">
        <button type="button" className="staff-shell__inline-action" disabled={!actionEnabled}>
          {projection.actionLabel}
        </button>
        {projection.secondaryLabel && (
          <button type="button" className="staff-shell__utility-button" disabled={!actionEnabled}>
            {projection.secondaryLabel}
          </button>
        )}
      </div>
    </section>
  );
}

export function TaskSettlementAndReacquireStrip({
  projection,
  actionEnabled,
}: {
  projection: TaskSettlementAndReacquireStripProjection;
  actionEnabled: boolean;
}) {
  return (
    <section
      className="staff-shell__booking-settlement"
      data-testid="TaskSettlementAndReacquireStrip"
      data-task-settlement={projection.settlementState}
      aria-labelledby="task-settlement-strip-heading"
    >
      <header className="staff-shell__booking-section-head">
        <div>
          <span className="staff-shell__eyebrow">TaskSettlementAndReacquireStrip</span>
          <h3 id="task-settlement-strip-heading">{projection.heading}</h3>
          <p>{projection.body}</p>
        </div>
        <span className="staff-shell__booking-state-chip" data-tone={projection.settlementState === "authoritative" ? "safe" : projection.settlementState === "reacquire_required" ? "critical" : projection.settlementState === "pending_settlement" ? "caution" : "info"}>
          {labelFromToken(projection.settlementState)}
        </span>
      </header>
      <SummaryRows rows={projection.gatingRows} />
      <div className="staff-shell__booking-recovery-actions">
        <button type="button" className="staff-shell__inline-action" disabled={!actionEnabled}>
          {projection.primaryActionLabel}
        </button>
        {projection.secondaryActionLabel && (
          <button type="button" className="staff-shell__utility-button" disabled={!actionEnabled}>
            {projection.secondaryActionLabel}
          </button>
        )}
      </div>
      <footer className="staff-shell__booking-muted-note">{projection.envelopeRef}</footer>
    </section>
  );
}

export function StaffBookingHandoffPanel({
  bookingCaseId,
  runtimeScenario,
  focusContinuity,
  onOpenCase,
  onBufferedQueueApply,
  onBufferedQueueToggleReview,
  onBufferedQueueDefer,
  onLaunchNext,
}: {
  bookingCaseId: string | null | undefined;
  runtimeScenario: RuntimeScenario;
  focusContinuity: WorkspaceFocusContinuityProjection;
  onOpenCase: (bookingCaseId: string) => void;
  onBufferedQueueApply: () => void;
  onBufferedQueueToggleReview: () => void;
  onBufferedQueueDefer: () => void;
  onLaunchNext: () => void;
}) {
  const projection = useMemo(
    () => resolveStaffBookingHandoffProjectionByCaseId(bookingCaseId),
    [bookingCaseId],
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(projection.compareStage.selectedSlotId);
  const [compareSlotId, setCompareSlotId] = useState<string | null>(projection.compareStage.compareSlotIds[0] ?? null);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(projection.compareStage.selectedSlotId);

  useEffect(() => {
    setSelectedSlotId(projection.compareStage.selectedSlotId);
    setCompareSlotId(projection.compareStage.compareSlotIds[0] ?? null);
    setExpandedSlotId(projection.compareStage.selectedSlotId);
  }, [projection.bookingCaseId, projection.compareStage.compareSlotIds, projection.compareStage.selectedSlotId]);

  const slotsById = useMemo(
    () => Object.fromEntries(projection.slots.map((slot) => [slot.slotId, slot])),
    [projection.slots],
  );
  const selectedSlot = selectedSlotId ? (slotsById[selectedSlotId] ?? null) : null;
  const compareSlot = compareSlotId ? (slotsById[compareSlotId] ?? null) : null;

  const selectionWritable =
    runtimeScenario === "live" &&
    projection.reviewLeaseState === "live" &&
    projection.confirmationTruth === "pre_commit_review" &&
    projection.focusLeaseState !== "invalidated";
  const actionEnabled = runtimeScenario === "live" && projection.reviewLeaseState !== "observe_only";

  return (
    <section
      className="staff-shell__peer-route staff-shell__booking-control"
      data-testid="WorkspaceBookingsRoute"
      data-shell="staff-booking"
      data-booking-case={projection.bookingCaseId}
      data-exception-class={projection.exceptionClass}
      data-review-lease-state={projection.reviewLeaseState}
      data-focus-protected={
        projection.focusProtected ? (projection.focusLeaseState === "invalidated" ? "stale" : "true") : "false"
      }
      data-confirmation-truth={projection.confirmationTruth}
      data-task-settlement={projection.settlementState}
      data-visual-mode={projection.visualMode}
    >
      <div className="staff-shell__booking-live-region" role="status" aria-atomic="true">
        {projection.liveAnnouncement}
      </div>

      <header className="staff-shell__booking-route-head">
        <div>
          <span className="staff-shell__eyebrow">StaffBookingHandoffPanel</span>
          <h2>Staff booking handoff and assisted booking</h2>
          <p>
            One workspace shell keeps exception queue state, booking-core truth, compare anchors, recovery, and settlement posture together.
          </p>
        </div>
        <div className="staff-shell__booking-signal-cluster">
          <span>{projection.caseSummary.patientLabel}</span>
          <span>{labelFromToken(projection.exceptionClass)}</span>
          <span>{labelFromToken(projection.confirmationTruth)}</span>
        </div>
      </header>

      {focusContinuity.protectionStrip.visible && (
        <WorkspaceProtectionStrip
          projection={focusContinuity.protectionStrip}
          onToggleTray={onBufferedQueueToggleReview}
        />
      )}

      {focusContinuity.bufferedQueueTray && (
        <BufferedQueueChangeTray
          projection={focusContinuity.bufferedQueueTray}
          onApply={onBufferedQueueApply}
          onToggleReview={onBufferedQueueToggleReview}
          onDefer={onBufferedQueueDefer}
        />
      )}

      <div className="staff-shell__booking-layout">
        <BookingExceptionQueuePanel
          rows={projection.queueRows}
          activeBookingCaseId={projection.bookingCaseId}
          onOpenCase={onOpenCase}
        />

        <div className="staff-shell__booking-main">
          <AssistedBookingCaseSummary projection={projection.caseSummary} />
          <StaffAssistableSlotList
            slots={projection.slots}
            selectedSlotId={selectedSlotId}
            compareSlotId={compareSlotId}
            expandedSlotId={expandedSlotId}
            selectionWritable={selectionWritable}
            onSelectSlot={(slotId) => {
              setSelectedSlotId(slotId);
              setExpandedSlotId(slotId);
            }}
            onCompareSlot={(slotId) => {
              setCompareSlotId(slotId === compareSlotId ? null : slotId);
              setExpandedSlotId(slotId);
            }}
            onExpandedSlotChange={setExpandedSlotId}
          />
          <AssistedSlotCompareStage
            projection={projection.compareStage}
            selectedSlot={selectedSlot}
            compareSlot={compareSlot}
          />
        </div>

        <aside className="staff-shell__booking-side">
          <AssistedBookingRecoveryPanel
            projection={projection.recoveryPanel}
            runtimeScenario={runtimeScenario}
            actionEnabled={actionEnabled}
          />
          {focusContinuity.recovery && <ProtectedCompositionRecovery projection={focusContinuity.recovery} />}
          <TaskSettlementAndReacquireStrip
            projection={projection.settlementStrip}
            actionEnabled={actionEnabled}
          />
          <CompletionContinuityStage projection={focusContinuity.completionContinuityStage} />
          <NextTaskPostureCard
            projection={focusContinuity.nextTaskPostureCard}
            noAutoAdvancePolicy={focusContinuity.noAutoAdvancePolicy}
            onLaunchNext={onLaunchNext}
          />
        </aside>
      </div>
    </section>
  );
}
