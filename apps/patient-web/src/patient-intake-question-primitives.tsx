import { useRef, type KeyboardEvent } from "react";
import {
  buildAnswerOptions,
  type PendingRequestTypeChange,
  type ProgressiveBundleCompatibilitySheet,
  type ProgressiveDeltaNoticeMemory,
  type ProgressiveQuestionFieldView,
  type ProgressiveQuestionUiProfile,
  type ProgressiveSummaryChip,
} from "./patient-intake-progressive-flow";

function glyphAccent(requestType: ProgressiveQuestionUiProfile["requestType"]): string {
  switch (requestType) {
    case "Symptoms":
      return "#2F6FED";
    case "Meds":
      return "#117A55";
    case "Admin":
      return "#B7791F";
    case "Results":
      return "#5B61F6";
    default:
      return "#2F6FED";
  }
}

function SignalGlyph({ requestType }: { requestType: ProgressiveQuestionUiProfile["requestType"] }) {
  const style = { color: glyphAccent(requestType) };
  if (requestType === "Symptoms") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" style={style}>
        <path d="M10 34h9l5-14 12 26 6-12h12" />
        <circle cx="32" cy="32" r="22" />
      </svg>
    );
  }
  if (requestType === "Meds") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" style={style}>
        <rect x="13" y="24" width="38" height="18" rx="9" transform="rotate(-35 32 33)" />
        <path d="M31 21 41 36" />
        <path d="M18 48h28" />
      </svg>
    );
  }
  if (requestType === "Admin") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" style={style}>
        <path d="M18 10h22l8 8v36H18Z" />
        <path d="M40 10v10h8" />
        <path d="M25 34h16" />
        <path d="M25 43h10" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" style={style}>
      <path d="M16 12h32v40H16Z" />
      <path d="M24 39 31 31l6 5 9-13" />
      <path d="M24 46h20" />
    </svg>
  );
}

export function RequestTypeSignalGrid({
  cards,
  activeRequestType,
  pendingChange,
  onSelect,
}: {
  cards: readonly ProgressiveQuestionUiProfile[];
  activeRequestType: ProgressiveQuestionUiProfile["requestType"];
  pendingChange: PendingRequestTypeChange | null;
  onSelect: (requestType: ProgressiveQuestionUiProfile["requestType"]) => void;
}) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const focusCard = (requestType: ProgressiveQuestionUiProfile["requestType"]) => {
    const target = buttonRefs.current[requestType];
    if (target) {
      target.focus();
      return;
    }
    window.requestAnimationFrame(() => {
      buttonRefs.current[requestType]?.focus();
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "Home") {
      event.preventDefault();
      const nextCard = cards[0];
      if (!nextCard) {
        return;
      }
      onSelect(nextCard.requestType);
      focusCard(nextCard.requestType);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      const nextCard = cards.at(-1);
      if (!nextCard) {
        return;
      }
      onSelect(nextCard.requestType);
      focusCard(nextCard.requestType);
      return;
    }
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextCard = cards[(index + delta + cards.length) % cards.length] ?? cards[0];
    if (!nextCard) {
      return;
    }
    onSelect(nextCard.requestType);
    focusCard(nextCard.requestType);
  };

  return (
    <div
      className="patient-intake-mission-frame__type-grid"
      role="radiogroup"
      aria-label="Request type"
      data-testid="patient-intake-request-type-grid"
    >
      {cards.map((card, index) => {
        const active = activeRequestType === card.requestType;
        const pending = pendingChange?.nextRequestType === card.requestType;
        return (
          <button
            key={card.requestType}
            ref={(node) => {
              buttonRefs.current[card.requestType] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            className="patient-intake-mission-frame__type-card"
            data-active={active ? "true" : "false"}
            data-pending={pending ? "true" : "false"}
            data-testid={`request-type-card-${card.requestType}`}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={() => onSelect(card.requestType)}
          >
            <SignalGlyph requestType={card.requestType} />
            <div className="patient-intake-mission-frame__type-card-copy">
              <div className="patient-intake-mission-frame__type-card-head">
                <strong>{card.title}</strong>
                {card.microTag ? <span>{card.microTag}</span> : null}
              </div>
              <span>{card.bestFor}</span>
              <p>{card.description}</p>
              <small>{card.cue}</small>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ContextChipRow({ chips }: { chips: readonly ProgressiveSummaryChip[] }) {
  if (chips.length === 0) {
    return null;
  }
  return (
    <div className="patient-intake-mission-frame__context-chip-row" data-testid="patient-intake-context-chip-row">
      {chips.map((chip) => (
        <span key={chip.questionKey} className="patient-intake-mission-frame__context-chip">
          <strong>{chip.label}</strong>
          <span>{chip.value}</span>
        </span>
      ))}
    </div>
  );
}

export function QuestionStemBlock({
  eyebrow,
  title,
  helper,
  progressLabel,
  focusTarget,
}: {
  eyebrow: string;
  title: string;
  helper: string;
  progressLabel: string;
  focusTarget: string;
}) {
  return (
    <div className="patient-intake-mission-frame__question-stem" data-testid="patient-intake-question-stem">
      <div className="patient-intake-mission-frame__question-meta">
        <span>{eyebrow}</span>
        <strong>{progressLabel}</strong>
      </div>
      <h2 data-focus-target={focusTarget} tabIndex={-1}>
        {title}
      </h2>
      <p>{helper}</p>
    </div>
  );
}

function renderBooleanLabel(value: boolean) {
  return value ? "Yes" : "No";
}

export function QuestionFieldRenderer({
  field,
  helperExpanded,
  onToggleHelp,
  onChange,
  onFocusField,
  onBlurField,
}: {
  field: ProgressiveQuestionFieldView;
  helperExpanded: boolean;
  onToggleHelp: (questionKey: string) => void;
  onChange: (questionKey: string, value: unknown, intent: "immediate" | "debounced") => void;
  onFocusField: (questionKey: string) => void;
  onBlurField: (questionKey: string) => void;
}) {
  const options = buildAnswerOptions(field.questionKey);
  const value = field.value;

  if (field.answerType === "single_select") {
    return (
      <div
        className="patient-intake-mission-frame__field-block"
        data-testid={`question-field-${field.questionKey}`}
        data-focus-field={field.questionKey}
      >
        <label className="patient-intake-mission-frame__field-label">
          <span>{field.promptLabel}</span>
        </label>
        <div className="patient-intake-mission-frame__answer-list" role="radiogroup" aria-label={field.promptLabel}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={value === option.value}
              className="patient-intake-mission-frame__answer-pill"
              data-active={value === option.value ? "true" : "false"}
              onFocus={() => onFocusField(field.questionKey)}
              onBlur={() => onBlurField(field.questionKey)}
              onClick={() => onChange(field.questionKey, option.value, "immediate")}
              data-testid={`answer-${field.questionKey}-${option.value}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {field.whyWeAsk ? (
          <details
            className="patient-intake-mission-frame__helper-region"
            open={helperExpanded}
            data-testid="patient-intake-helper-region"
          >
            <summary onClick={(event) => {
              event.preventDefault();
              onToggleHelp(field.questionKey);
            }}>
              Why we ask this
            </summary>
            <p>{field.whyWeAsk}</p>
          </details>
        ) : null}
      </div>
    );
  }

  if (field.answerType === "multi_select") {
    const selectedValues = Array.isArray(value) ? value : [];
    return (
      <div
        className="patient-intake-mission-frame__field-block"
        data-testid={`question-field-${field.questionKey}`}
        data-focus-field={field.questionKey}
      >
        <label className="patient-intake-mission-frame__field-label">
          <span>{field.promptLabel}</span>
        </label>
        <div className="patient-intake-mission-frame__answer-list" role="group" aria-label={field.promptLabel}>
          {options.map((option) => {
            const active = selectedValues.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                className="patient-intake-mission-frame__answer-pill"
                data-active={active ? "true" : "false"}
                onFocus={() => onFocusField(field.questionKey)}
                onBlur={() => onBlurField(field.questionKey)}
                onClick={() =>
                  onChange(
                    field.questionKey,
                    active
                      ? selectedValues.filter((entry) => entry !== option.value)
                      : [...selectedValues, option.value],
                    "immediate",
                  )
                }
                data-testid={`answer-${field.questionKey}-${option.value}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {field.whyWeAsk ? (
          <details
            className="patient-intake-mission-frame__helper-region"
            open={helperExpanded}
            data-testid="patient-intake-helper-region"
          >
            <summary onClick={(event) => {
              event.preventDefault();
              onToggleHelp(field.questionKey);
            }}>
              Why we ask this
            </summary>
            <p>{field.whyWeAsk}</p>
          </details>
        ) : null}
      </div>
    );
  }

  if (field.answerType === "boolean") {
    return (
      <div
        className="patient-intake-mission-frame__field-block"
        data-testid={`question-field-${field.questionKey}`}
        data-focus-field={field.questionKey}
      >
        <label className="patient-intake-mission-frame__field-label">
          <span>{field.promptLabel}</span>
        </label>
        <div className="patient-intake-mission-frame__answer-list" role="radiogroup" aria-label={field.promptLabel}>
          {[true, false].map((entry) => (
            <button
              key={String(entry)}
              type="button"
              role="radio"
              aria-checked={value === entry}
              className="patient-intake-mission-frame__answer-pill"
              data-active={value === entry ? "true" : "false"}
              onFocus={() => onFocusField(field.questionKey)}
              onBlur={() => onBlurField(field.questionKey)}
              onClick={() => onChange(field.questionKey, entry, "immediate")}
              data-testid={`answer-${field.questionKey}-${String(entry)}`}
            >
              {renderBooleanLabel(entry)}
            </button>
          ))}
        </div>
        {field.whyWeAsk ? (
          <details
            className="patient-intake-mission-frame__helper-region"
            open={helperExpanded}
            data-testid="patient-intake-helper-region"
          >
            <summary onClick={(event) => {
              event.preventDefault();
              onToggleHelp(field.questionKey);
            }}>
              Why we ask this
            </summary>
            <p>{field.whyWeAsk}</p>
          </details>
        ) : null}
      </div>
    );
  }

  if (field.answerType === "date" || field.answerType === "partial_date") {
    return (
      <div
        className="patient-intake-mission-frame__field-block"
        data-testid={`question-field-${field.questionKey}`}
        data-focus-field={field.questionKey}
      >
        <label className="patient-intake-mission-frame__field">
          <span>{field.promptLabel}</span>
          <input
            type={field.answerType === "partial_date" ? "month" : "date"}
            value={typeof value === "string" ? value : ""}
            onFocus={() => onFocusField(field.questionKey)}
            onBlur={() => onBlurField(field.questionKey)}
            onChange={(event) => onChange(field.questionKey, event.target.value, "debounced")}
            data-testid={`input-${field.questionKey}`}
          />
        </label>
        {field.whyWeAsk ? (
          <details
            className="patient-intake-mission-frame__helper-region"
            open={helperExpanded}
            data-testid="patient-intake-helper-region"
          >
            <summary onClick={(event) => {
              event.preventDefault();
              onToggleHelp(field.questionKey);
            }}>
              Why we ask this
            </summary>
            <p>{field.whyWeAsk}</p>
          </details>
        ) : null}
      </div>
    );
  }

  const multiline = field.answerType === "long_text";
  return (
    <div
      className="patient-intake-mission-frame__field-block"
      data-testid={`question-field-${field.questionKey}`}
      data-focus-field={field.questionKey}
    >
      <label className="patient-intake-mission-frame__field">
        <span>{field.promptLabel}</span>
        {multiline ? (
          <textarea
            value={typeof value === "string" ? value : ""}
            onFocus={() => onFocusField(field.questionKey)}
            onBlur={() => onBlurField(field.questionKey)}
            onChange={(event) => onChange(field.questionKey, event.target.value, "debounced")}
            data-testid={`input-${field.questionKey}`}
          />
        ) : (
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            onFocus={() => onFocusField(field.questionKey)}
            onBlur={() => onBlurField(field.questionKey)}
            onChange={(event) => onChange(field.questionKey, event.target.value, "debounced")}
            data-testid={`input-${field.questionKey}`}
          />
        )}
      </label>
      {field.whyWeAsk ? (
        <details
          className="patient-intake-mission-frame__helper-region"
          open={helperExpanded}
          data-testid="patient-intake-helper-region"
        >
          <summary onClick={(event) => {
            event.preventDefault();
            onToggleHelp(field.questionKey);
          }}>
            Why we ask this
          </summary>
          <p>{field.whyWeAsk}</p>
        </details>
      ) : null}
    </div>
  );
}

export function RevealPatchRegion({
  fields,
  helperQuestionKey,
  onToggleHelp,
  onChange,
  onFocusField,
  onBlurField,
}: {
  fields: readonly ProgressiveQuestionFieldView[];
  helperQuestionKey: string | null;
  onToggleHelp: (questionKey: string) => void;
  onChange: (questionKey: string, value: unknown, intent: "immediate" | "debounced") => void;
  onFocusField: (questionKey: string) => void;
  onBlurField: (questionKey: string) => void;
}) {
  if (fields.length === 0) {
    return null;
  }
  return (
    <div className="patient-intake-mission-frame__reveal-patch-region" data-testid="patient-intake-reveal-patch-region">
      {fields.map((field) => (
        <QuestionFieldRenderer
          key={field.questionKey}
          field={field}
          helperExpanded={helperQuestionKey === field.questionKey}
          onToggleHelp={onToggleHelp}
          onChange={onChange}
          onFocusField={onFocusField}
          onBlurField={onBlurField}
        />
      ))}
    </div>
  );
}

export function ReviewDeltaNotice({
  pendingRequestTypeChange,
  deltaNotice,
  onConfirmChange,
  onCancelChange,
}: {
  pendingRequestTypeChange: PendingRequestTypeChange | null;
  deltaNotice: ProgressiveDeltaNoticeMemory | null;
  onConfirmChange: () => void;
  onCancelChange: () => void;
}) {
  if (!pendingRequestTypeChange && !deltaNotice) {
    return null;
  }
  if (pendingRequestTypeChange) {
    return (
      <div className="patient-intake-mission-frame__review-delta-notice" data-testid="patient-intake-review-delta-notice">
        <strong>Confirm request-type change</strong>
        <p>
          Changing from {pendingRequestTypeChange.currentRequestType} to {pendingRequestTypeChange.nextRequestType} will
          supersede the current branch answers and start the new schema cleanly.
        </p>
        <ul>
          {pendingRequestTypeChange.impactedQuestionKeys.map((questionKey) => (
            <li key={questionKey}>{questionKey}</li>
          ))}
        </ul>
        <div className="patient-intake-mission-frame__notice-actions">
          <button type="button" onClick={onCancelChange} data-testid="request-type-change-cancel">
            Keep current request type
          </button>
          <button type="button" onClick={onConfirmChange} data-testid="request-type-change-confirm">
            Confirm change
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="patient-intake-mission-frame__review-delta-notice" data-testid="patient-intake-review-delta-notice">
      <strong>{deltaNotice?.title}</strong>
      <p>{deltaNotice?.body}</p>
      {deltaNotice?.impactedQuestionKeys.length ? (
        <ul>
          {deltaNotice.impactedQuestionKeys.map((questionKey) => (
            <li key={questionKey}>{questionKey}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function BundleCompatibilitySheet({
  sheet,
}: {
  sheet: ProgressiveBundleCompatibilitySheet;
}) {
  return (
    <div className="patient-intake-mission-frame__bundle-compatibility-sheet" data-testid="patient-intake-bundle-compatibility-sheet">
      <span>{sheet.compatibilityMode.replaceAll("_", " ")}</span>
      <strong>{sheet.title}</strong>
      <p>{sheet.body}</p>
      <div className="patient-intake-mission-frame__sheet-actions">
        <span>{sheet.dominantActionLabel}</span>
        <span>{sheet.secondaryActionLabel}</span>
      </div>
    </div>
  );
}
