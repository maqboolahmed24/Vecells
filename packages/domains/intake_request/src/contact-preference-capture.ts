import { createHash } from "node:crypto";
import {
  createDeterministicBackboneIdGenerator,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
} from "../../../domain-kernel/src/index";
import {
  emitIntakeContactPreferencesCaptured,
  emitIntakeContactPreferencesFrozen,
  type SubmissionLineageEventEnvelope,
} from "../../../event-contracts/src/index";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function stableDigest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort(compareStrings);
}

function saveVersionedRow<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const existing = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      existing?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${existing?.version ?? "missing"}.`,
    );
  } else if (existing) {
    invariant(
      existing.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
}

function nextContactPreferenceId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function normalizeLanguageCode(value: string | null | undefined): string | null {
  const trimmed = optionalRef(value);
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.toLowerCase();
  invariant(
    /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(normalized),
    "CONTACT_LANGUAGE_INVALID",
    "languagePreference must be a short BCP-47 style language code.",
  );
  return normalized;
}

function normalizeAccessibilityFlags(
  values: readonly ContactAccessibilityNeed[] | undefined,
): readonly ContactAccessibilityNeed[] {
  return [...new Set(values ?? [])].sort() as readonly ContactAccessibilityNeed[];
}

function ensureLocalTime(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    /^([01]\d|2[0-3]):[0-5]\d$/.test(normalized),
    `INVALID_${field.toUpperCase()}`,
    `${field} must use HH:MM 24-hour local time.`,
  );
  return normalized;
}

function normalizeEmailAddress(value: string): string {
  const normalized = requireRef(value, "emailDestination").toLowerCase();
  invariant(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized),
    "CONTACT_EMAIL_INVALID",
    "email destination must be a valid email address.",
  );
  return normalized;
}

function normalizePhoneLike(value: string, field: string): string {
  const trimmed = requireRef(value, field);
  const digits = trimmed.replace(/[^\d+]/g, "");
  const plusNormalized = digits.startsWith("00") ? `+${digits.slice(2)}` : digits;
  const normalized = plusNormalized.startsWith("+")
    ? `+${plusNormalized.slice(1).replace(/\D/g, "")}`
    : plusNormalized.replace(/\D/g, "");
  const digitCount = normalized.replace(/\D/g, "").length;
  invariant(
    digitCount >= 8,
    `CONTACT_${field.toUpperCase()}_INVALID`,
    `${field} must contain at least 8 digits.`,
  );
  return normalized;
}

function maskPhoneLike(value: string): string {
  const normalized = value.replace(/\s+/g, "");
  const digits = normalized.replace(/\D/g, "");
  const visibleTail = digits.slice(-4);
  const prefix = normalized.startsWith("+") ? `+${digits.slice(0, Math.max(0, digits.length - 7))}` : "";
  return `${prefix}${prefix ? " " : ""}${"•".repeat(Math.max(4, digits.length - visibleTail.length))}${visibleTail}`;
}

function maskEmailAddress(value: string): string {
  const [localPart = "", domainPart = ""] = value.split("@");
  const [domainLabel = "", ...restLabels] = domainPart.split(".");
  const maskedLocal =
    localPart.length <= 1
      ? `${localPart[0] ?? "•"}••`
      : `${localPart[0]}${"•".repeat(Math.max(2, localPart.length - 1))}`;
  const maskedDomain =
    domainLabel.length <= 1
      ? `${domainLabel[0] ?? "•"}••`
      : `${domainLabel[0]}${"•".repeat(Math.max(2, domainLabel.length - 1))}`;
  return `${maskedLocal}@${maskedDomain}${restLabels.length > 0 ? `.${restLabels.join(".")}` : ""}`;
}

export type ContactChannel = "sms" | "phone" | "email";

export type ContactWindow = "weekday_daytime" | "weekday_evening" | "anytime";

export type ContactAccessibilityNeed =
  | "large_text"
  | "screen_reader_support"
  | "relay_or_textphone"
  | "british_sign_language"
  | "easy_read";

export type ContactPreferenceSourceAuthorityClass =
  | "self_service_browser_entry"
  | "self_service_embedded_entry"
  | "authenticated_uplift_pending"
  | "support_captured";

export type ContactRouteSnapshotSeedSourceAuthorityClass =
  | "patient_confirmed"
  | "support_captured"
  | "imported"
  | "derived";

export type ContactPreferenceCompletenessState = "complete" | "incomplete" | "blocked";

export type ContactPreferenceSemanticMaterialityClass =
  | "operationally_material_nonclinical"
  | "contact_safety_relevant";

export interface QuietHoursWindow {
  startLocalTime: string;
  endLocalTime: string;
  timezone: string;
}

export interface ProtectedContactDestination {
  channel: ContactChannel;
  rawValue: string;
  normalizedValue: string;
  maskedValue: string;
}

export interface MaskedContactDestinationSummary {
  channel: ContactChannel;
  maskedValue: string;
  destinationState: "present_masked" | "missing";
}

export interface ContactPreferenceCapture {
  captureSchemaVersion: "PHASE1_CONTACT_PREFERENCE_CAPTURE_V1";
  contactPreferenceCaptureId: string;
  contactPreferencesRef: string;
  envelopeRef: string;
  draftPublicId: string;
  captureVersion: number;
  preferredChannel: ContactChannel;
  contactWindow: ContactWindow;
  voicemailAllowed: boolean;
  followUpPermission: boolean | null;
  smsDestination: ProtectedContactDestination | null;
  phoneDestination: ProtectedContactDestination | null;
  emailDestination: ProtectedContactDestination | null;
  quietHours: QuietHoursWindow | null;
  languagePreference: string | null;
  translationRequired: boolean;
  accessibilityNeeds: readonly ContactAccessibilityNeed[];
  sourceAuthorityClass: ContactPreferenceSourceAuthorityClass;
  sourceEvidenceRef: string;
  semanticMaterialityClass: ContactPreferenceSemanticMaterialityClass;
  reasonCodes: readonly string[];
  payloadHash: string;
  supersedesContactPreferenceCaptureRef: string | null;
  clientCommandId: string;
  idempotencyKey: string;
  recordedAt: string;
  version: number;
}

export interface PersistedContactPreferenceCaptureRow extends ContactPreferenceCapture {
  aggregateType: "Phase1ContactPreferenceCapture";
  persistenceSchemaVersion: 1;
}

export class ContactPreferenceCaptureDocument {
  private readonly snapshot: ContactPreferenceCapture;

  private constructor(snapshot: ContactPreferenceCapture) {
    this.snapshot = ContactPreferenceCaptureDocument.normalize(snapshot);
  }

  static create(
    input: Omit<ContactPreferenceCapture, "version">,
  ): ContactPreferenceCaptureDocument {
    return new ContactPreferenceCaptureDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: ContactPreferenceCapture): ContactPreferenceCaptureDocument {
    return new ContactPreferenceCaptureDocument(snapshot);
  }

  private static normalize(snapshot: ContactPreferenceCapture): ContactPreferenceCapture {
    invariant(
      snapshot.captureVersion >= 1,
      "CONTACT_PREFERENCE_CAPTURE_VERSION_INVALID",
      "contact preference capture version must be >= 1.",
    );
    const recordedAt = ensureIsoTimestamp(snapshot.recordedAt, "recordedAt");
    const quietHours =
      snapshot.quietHours === null
        ? null
        : {
            startLocalTime: ensureLocalTime(
              snapshot.quietHours.startLocalTime,
              "quietHours.startLocalTime",
            ),
            endLocalTime: ensureLocalTime(
              snapshot.quietHours.endLocalTime,
              "quietHours.endLocalTime",
            ),
            timezone: requireRef(snapshot.quietHours.timezone, "quietHours.timezone"),
          };

    return {
      ...snapshot,
      contactPreferenceCaptureId: requireRef(
        snapshot.contactPreferenceCaptureId,
        "contactPreferenceCaptureId",
      ),
      contactPreferencesRef: requireRef(snapshot.contactPreferencesRef, "contactPreferencesRef"),
      envelopeRef: requireRef(snapshot.envelopeRef, "envelopeRef"),
      draftPublicId: requireRef(snapshot.draftPublicId, "draftPublicId"),
      quietHours,
      languagePreference: normalizeLanguageCode(snapshot.languagePreference),
      accessibilityNeeds: normalizeAccessibilityFlags(snapshot.accessibilityNeeds),
      reasonCodes: uniqueSorted(snapshot.reasonCodes),
      sourceEvidenceRef: requireRef(snapshot.sourceEvidenceRef, "sourceEvidenceRef"),
      clientCommandId: requireRef(snapshot.clientCommandId, "clientCommandId"),
      idempotencyKey: requireRef(snapshot.idempotencyKey, "idempotencyKey"),
      supersedesContactPreferenceCaptureRef: optionalRef(
        snapshot.supersedesContactPreferenceCaptureRef,
      ),
      recordedAt,
    };
  }

  get contactPreferenceCaptureId(): string {
    return this.snapshot.contactPreferenceCaptureId;
  }

  get draftPublicId(): string {
    return this.snapshot.draftPublicId;
  }

  get envelopeRef(): string {
    return this.snapshot.envelopeRef;
  }

  get contactPreferencesRef(): string {
    return this.snapshot.contactPreferencesRef;
  }

  get captureVersion(): number {
    return this.snapshot.captureVersion;
  }

  get payloadHash(): string {
    return this.snapshot.payloadHash;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ContactPreferenceCapture {
    return {
      ...this.snapshot,
      accessibilityNeeds: [...this.snapshot.accessibilityNeeds],
      reasonCodes: [...this.snapshot.reasonCodes],
      quietHours: this.snapshot.quietHours ? { ...this.snapshot.quietHours } : null,
      smsDestination: this.snapshot.smsDestination ? { ...this.snapshot.smsDestination } : null,
      phoneDestination: this.snapshot.phoneDestination
        ? { ...this.snapshot.phoneDestination }
        : null,
      emailDestination: this.snapshot.emailDestination
        ? { ...this.snapshot.emailDestination }
        : null,
    };
  }
}

export interface ContactPreferenceMaskedView {
  maskedViewSchemaVersion: "PHASE1_CONTACT_PREFERENCE_MASKED_VIEW_V1";
  maskedViewId: string;
  contactPreferenceCaptureRef: string;
  contactPreferencesRef: string;
  envelopeRef: string;
  draftPublicId: string;
  preferredChannel: ContactChannel;
  preferredDestinationMasked: string | null;
  destinations: readonly MaskedContactDestinationSummary[];
  followUpPermissionState: "granted" | "declined" | "not_set";
  contactWindow: ContactWindow;
  voicemailAllowed: boolean;
  quietHoursSummary: string | null;
  languagePreference: string | null;
  translationRequired: boolean;
  accessibilityNeeds: readonly ContactAccessibilityNeed[];
  sourceAuthorityClass: ContactPreferenceSourceAuthorityClass;
  completenessState: ContactPreferenceCompletenessState;
  reasonCodes: readonly string[];
  recordedAt: string;
  version: number;
}

export interface PersistedContactPreferenceMaskedViewRow extends ContactPreferenceMaskedView {
  aggregateType: "Phase1ContactPreferenceMaskedView";
  persistenceSchemaVersion: 1;
}

export class ContactPreferenceMaskedViewDocument {
  private readonly snapshot: ContactPreferenceMaskedView;

  private constructor(snapshot: ContactPreferenceMaskedView) {
    this.snapshot = ContactPreferenceMaskedViewDocument.normalize(snapshot);
  }

  static create(
    input: Omit<ContactPreferenceMaskedView, "version">,
  ): ContactPreferenceMaskedViewDocument {
    return new ContactPreferenceMaskedViewDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: ContactPreferenceMaskedView): ContactPreferenceMaskedViewDocument {
    return new ContactPreferenceMaskedViewDocument(snapshot);
  }

  private static normalize(snapshot: ContactPreferenceMaskedView): ContactPreferenceMaskedView {
    return {
      ...snapshot,
      maskedViewId: requireRef(snapshot.maskedViewId, "maskedViewId"),
      contactPreferenceCaptureRef: requireRef(
        snapshot.contactPreferenceCaptureRef,
        "contactPreferenceCaptureRef",
      ),
      contactPreferencesRef: requireRef(snapshot.contactPreferencesRef, "contactPreferencesRef"),
      envelopeRef: requireRef(snapshot.envelopeRef, "envelopeRef"),
      draftPublicId: requireRef(snapshot.draftPublicId, "draftPublicId"),
      preferredDestinationMasked: optionalRef(snapshot.preferredDestinationMasked),
      quietHoursSummary: optionalRef(snapshot.quietHoursSummary),
      languagePreference: normalizeLanguageCode(snapshot.languagePreference),
      accessibilityNeeds: normalizeAccessibilityFlags(snapshot.accessibilityNeeds),
      reasonCodes: uniqueSorted(snapshot.reasonCodes),
      destinations: [...snapshot.destinations].sort((left, right) =>
        compareStrings(left.channel, right.channel),
      ),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    };
  }

  get maskedViewId(): string {
    return this.snapshot.maskedViewId;
  }

  get draftPublicId(): string {
    return this.snapshot.draftPublicId;
  }

  get contactPreferenceCaptureRef(): string {
    return this.snapshot.contactPreferenceCaptureRef;
  }

  get completenessState(): ContactPreferenceCompletenessState {
    return this.snapshot.completenessState;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ContactPreferenceMaskedView {
    return {
      ...this.snapshot,
      destinations: this.snapshot.destinations.map((destination) => ({ ...destination })),
      accessibilityNeeds: [...this.snapshot.accessibilityNeeds],
      reasonCodes: [...this.snapshot.reasonCodes],
    };
  }
}

export interface ContactRouteSnapshotSeed {
  routeSnapshotSeedSchemaVersion: "PHASE1_CONTACT_ROUTE_SNAPSHOT_SEED_V1";
  routeSnapshotSeedId: string;
  contactPreferenceCaptureRef: string;
  contactPreferencesRef: string;
  envelopeRef: string;
  draftPublicId: string;
  preferredChannel: ContactChannel;
  routeKind: "sms" | "voice" | "email";
  routeRef: string;
  routeVersionRef: string;
  normalizedAddressRef: string;
  maskedDestination: string;
  verificationState: "unverified";
  demographicFreshnessState: "current";
  preferenceFreshnessState: "current";
  sourceAuthorityClass: ContactRouteSnapshotSeedSourceAuthorityClass;
  recordedAt: string;
  version: number;
}

export interface PersistedContactRouteSnapshotSeedRow extends ContactRouteSnapshotSeed {
  aggregateType: "Phase1ContactRouteSnapshotSeed";
  persistenceSchemaVersion: 1;
}

export class ContactRouteSnapshotSeedDocument {
  private readonly snapshot: ContactRouteSnapshotSeed;

  private constructor(snapshot: ContactRouteSnapshotSeed) {
    this.snapshot = ContactRouteSnapshotSeedDocument.normalize(snapshot);
  }

  static create(
    input: Omit<ContactRouteSnapshotSeed, "version">,
  ): ContactRouteSnapshotSeedDocument {
    return new ContactRouteSnapshotSeedDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: ContactRouteSnapshotSeed): ContactRouteSnapshotSeedDocument {
    return new ContactRouteSnapshotSeedDocument(snapshot);
  }

  private static normalize(snapshot: ContactRouteSnapshotSeed): ContactRouteSnapshotSeed {
    return {
      ...snapshot,
      routeSnapshotSeedId: requireRef(snapshot.routeSnapshotSeedId, "routeSnapshotSeedId"),
      contactPreferenceCaptureRef: requireRef(
        snapshot.contactPreferenceCaptureRef,
        "contactPreferenceCaptureRef",
      ),
      contactPreferencesRef: requireRef(snapshot.contactPreferencesRef, "contactPreferencesRef"),
      envelopeRef: requireRef(snapshot.envelopeRef, "envelopeRef"),
      draftPublicId: requireRef(snapshot.draftPublicId, "draftPublicId"),
      routeRef: requireRef(snapshot.routeRef, "routeRef"),
      routeVersionRef: requireRef(snapshot.routeVersionRef, "routeVersionRef"),
      normalizedAddressRef: requireRef(snapshot.normalizedAddressRef, "normalizedAddressRef"),
      maskedDestination: requireRef(snapshot.maskedDestination, "maskedDestination"),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
    };
  }

  get routeSnapshotSeedId(): string {
    return this.snapshot.routeSnapshotSeedId;
  }

  get draftPublicId(): string {
    return this.snapshot.draftPublicId;
  }

  get contactPreferenceCaptureRef(): string {
    return this.snapshot.contactPreferenceCaptureRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ContactRouteSnapshotSeed {
    return { ...this.snapshot };
  }
}

export interface ContactPreferenceSubmitFreeze {
  submitFreezeSchemaVersion: "PHASE1_CONTACT_PREFERENCE_SUBMIT_FREEZE_V1";
  contactPreferenceSubmitFreezeId: string;
  envelopeRef: string;
  draftPublicId: string;
  contactPreferenceCaptureRef: string;
  contactPreferencesRef: string;
  maskedViewRef: string;
  routeSnapshotSeedRef: string | null;
  frozenAt: string;
  version: number;
}

export interface PersistedContactPreferenceSubmitFreezeRow extends ContactPreferenceSubmitFreeze {
  aggregateType: "Phase1ContactPreferenceSubmitFreeze";
  persistenceSchemaVersion: 1;
}

export class ContactPreferenceSubmitFreezeDocument {
  private readonly snapshot: ContactPreferenceSubmitFreeze;

  private constructor(snapshot: ContactPreferenceSubmitFreeze) {
    this.snapshot = ContactPreferenceSubmitFreezeDocument.normalize(snapshot);
  }

  static create(
    input: Omit<ContactPreferenceSubmitFreeze, "version">,
  ): ContactPreferenceSubmitFreezeDocument {
    return new ContactPreferenceSubmitFreezeDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: ContactPreferenceSubmitFreeze): ContactPreferenceSubmitFreezeDocument {
    return new ContactPreferenceSubmitFreezeDocument(snapshot);
  }

  private static normalize(snapshot: ContactPreferenceSubmitFreeze): ContactPreferenceSubmitFreeze {
    return {
      ...snapshot,
      contactPreferenceSubmitFreezeId: requireRef(
        snapshot.contactPreferenceSubmitFreezeId,
        "contactPreferenceSubmitFreezeId",
      ),
      envelopeRef: requireRef(snapshot.envelopeRef, "envelopeRef"),
      draftPublicId: requireRef(snapshot.draftPublicId, "draftPublicId"),
      contactPreferenceCaptureRef: requireRef(
        snapshot.contactPreferenceCaptureRef,
        "contactPreferenceCaptureRef",
      ),
      contactPreferencesRef: requireRef(snapshot.contactPreferencesRef, "contactPreferencesRef"),
      maskedViewRef: requireRef(snapshot.maskedViewRef, "maskedViewRef"),
      routeSnapshotSeedRef: optionalRef(snapshot.routeSnapshotSeedRef),
      frozenAt: ensureIsoTimestamp(snapshot.frozenAt, "frozenAt"),
    };
  }

  get envelopeRef(): string {
    return this.snapshot.envelopeRef;
  }

  get contactPreferencesRef(): string {
    return this.snapshot.contactPreferencesRef;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ContactPreferenceSubmitFreeze {
    return { ...this.snapshot };
  }
}

export interface ContactPreferenceValidationSummary {
  validationSummarySchemaVersion: "PHASE1_CONTACT_PREFERENCE_VALIDATION_SUMMARY_V1";
  draftPublicId: string;
  envelopeRef: string;
  contactPreferenceCaptureRef: string | null;
  contactPreferencesRef: string | null;
  maskedViewRef: string | null;
  routeSnapshotSeedRef: string | null;
  preferredChannel: ContactChannel | null;
  preferredDestinationMasked: string | null;
  completenessState: ContactPreferenceCompletenessState;
  reasonCodes: readonly string[];
  sourceAuthorityClass: ContactPreferenceSourceAuthorityClass | "contact_capture_missing";
}

export interface CaptureContactPreferencesInput {
  envelopeRef: string;
  draftPublicId: string;
  preferredChannel: ContactChannel;
  destinations?: Partial<Record<ContactChannel, string | null | undefined>>;
  contactWindow: ContactWindow;
  voicemailAllowed: boolean;
  followUpPermission?: boolean | null;
  quietHours?: QuietHoursWindow | null;
  languagePreference?: string | null;
  translationRequired?: boolean;
  accessibilityNeeds?: readonly ContactAccessibilityNeed[];
  sourceAuthorityClass: ContactPreferenceSourceAuthorityClass;
  sourceEvidenceRef: string;
  clientCommandId: string;
  idempotencyKey: string;
  recordedAt: string;
}

export interface CaptureContactPreferencesResult {
  replayed: boolean;
  capture: ContactPreferenceCaptureDocument;
  maskedView: ContactPreferenceMaskedViewDocument;
  routeSnapshotSeed: ContactRouteSnapshotSeedDocument | null;
  validationSummary: ContactPreferenceValidationSummary;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface FreezeContactPreferencesForSubmitInput {
  envelopeRef: string;
  draftPublicId: string;
  frozenAt: string;
}

export interface FreezeContactPreferencesForSubmitResult {
  replayed: boolean;
  submitFreeze: ContactPreferenceSubmitFreezeDocument;
  capture: ContactPreferenceCaptureDocument;
  maskedView: ContactPreferenceMaskedViewDocument;
  routeSnapshotSeed: ContactRouteSnapshotSeedDocument | null;
  validationSummary: ContactPreferenceValidationSummary;
  events: readonly SubmissionLineageEventEnvelope<unknown>[];
}

export interface ContactPreferenceReasonCodeRow {
  reasonCode: string;
  materialityClass: ContactPreferenceSemanticMaterialityClass | "validation";
  description: string;
}

export const phase1ContactPreferenceReasonCodes = [
  {
    reasonCode: "GAP_RESOLVED_CONTACT_PREFERENCE_MINIMUM_PHASE1_SELF_SERVICE_V1",
    materialityClass: "validation",
    description:
      "Resolved the minimum Phase 1 contact-preference contract beyond the earlier minimal draft projection tuple.",
  },
  {
    reasonCode: "CONTACT_PREF_INITIAL_CAPTURE",
    materialityClass: "operationally_material_nonclinical",
    description: "First append-only contact preference capture for the draft lineage.",
  },
  {
    reasonCode: "CONTACT_PREF_PRIMARY_CHANNEL_CHANGED",
    materialityClass: "operationally_material_nonclinical",
    description: "Preferred contact channel changed from the prior capture.",
  },
  {
    reasonCode: "CONTACT_PREF_DESTINATION_CHANGED",
    materialityClass: "operationally_material_nonclinical",
    description:
      "One or more contact destinations changed. Later active reachability dependencies must treat this as potentially contact-safety relevant.",
  },
  {
    reasonCode: "CONTACT_PREF_FOLLOW_UP_PERMISSION_CHANGED",
    materialityClass: "operationally_material_nonclinical",
    description: "Permission for follow-up notifications changed.",
  },
  {
    reasonCode: "CONTACT_PREF_CONTACT_WINDOW_CHANGED",
    materialityClass: "operationally_material_nonclinical",
    description: "Contact timing preference changed.",
  },
  {
    reasonCode: "CONTACT_PREF_LANGUAGE_OR_ACCESSIBILITY_CHANGED",
    materialityClass: "operationally_material_nonclinical",
    description: "Language, translation, or accessibility preference changed.",
  },
  {
    reasonCode: "CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT",
    materialityClass: "contact_safety_relevant",
    description:
      "The contact route changed and must be treated as potentially contact-safety relevant if an active dependency later binds to it.",
  },
  {
    reasonCode: "CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL",
    materialityClass: "validation",
    description: "The preferred channel is missing its required destination.",
  },
  {
    reasonCode: "CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED",
    materialityClass: "validation",
    description: "Follow-up notification permission is not yet captured.",
  },
  {
    reasonCode: "CONTACT_PREF_CAPTURE_MISSING",
    materialityClass: "validation",
    description: "No backend contact-preference capture exists for this draft yet.",
  },
] as const satisfies readonly ContactPreferenceReasonCodeRow[];

export interface ContactPreferenceCaptureRepository {
  getContactPreferenceCapture(
    contactPreferenceCaptureId: string,
  ): Promise<ContactPreferenceCaptureDocument | undefined>;
  saveContactPreferenceCapture(
    capture: ContactPreferenceCaptureDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listContactPreferenceCaptures(): Promise<readonly ContactPreferenceCaptureDocument[]>;
  findLatestContactPreferenceCaptureForDraft(
    draftPublicId: string,
  ): Promise<ContactPreferenceCaptureDocument | undefined>;
  findContactPreferenceCaptureByIdempotency(
    draftPublicId: string,
    idempotencyKey: string,
  ): Promise<ContactPreferenceCaptureDocument | undefined>;
  findContactPreferenceCaptureByPayloadHash(
    draftPublicId: string,
    payloadHash: string,
  ): Promise<ContactPreferenceCaptureDocument | undefined>;
}

export interface ContactPreferenceMaskedViewRepository {
  getContactPreferenceMaskedView(
    maskedViewId: string,
  ): Promise<ContactPreferenceMaskedViewDocument | undefined>;
  saveContactPreferenceMaskedView(
    maskedView: ContactPreferenceMaskedViewDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findLatestContactPreferenceMaskedViewForDraft(
    draftPublicId: string,
  ): Promise<ContactPreferenceMaskedViewDocument | undefined>;
  findContactPreferenceMaskedViewByCapture(
    contactPreferenceCaptureRef: string,
  ): Promise<ContactPreferenceMaskedViewDocument | undefined>;
}

export interface ContactRouteSnapshotSeedRepository {
  getContactRouteSnapshotSeed(
    routeSnapshotSeedId: string,
  ): Promise<ContactRouteSnapshotSeedDocument | undefined>;
  saveContactRouteSnapshotSeed(
    seed: ContactRouteSnapshotSeedDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findLatestContactRouteSnapshotSeedForDraft(
    draftPublicId: string,
  ): Promise<ContactRouteSnapshotSeedDocument | undefined>;
  findContactRouteSnapshotSeedByCapture(
    contactPreferenceCaptureRef: string,
  ): Promise<ContactRouteSnapshotSeedDocument | undefined>;
}

export interface ContactPreferenceSubmitFreezeRepository {
  getContactPreferenceSubmitFreeze(
    contactPreferenceSubmitFreezeId: string,
  ): Promise<ContactPreferenceSubmitFreezeDocument | undefined>;
  saveContactPreferenceSubmitFreeze(
    submitFreeze: ContactPreferenceSubmitFreezeDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  findContactPreferenceSubmitFreezeByEnvelope(
    envelopeRef: string,
  ): Promise<ContactPreferenceSubmitFreezeDocument | undefined>;
}

export interface Phase1ContactPreferenceRepositories
  extends ContactPreferenceCaptureRepository,
    ContactPreferenceMaskedViewRepository,
    ContactRouteSnapshotSeedRepository,
    ContactPreferenceSubmitFreezeRepository {}

export class InMemoryPhase1ContactPreferenceStore
  implements Phase1ContactPreferenceRepositories
{
  private readonly captures = new Map<string, PersistedContactPreferenceCaptureRow>();
  private readonly captureByDraft = new Map<string, string>();
  private readonly captureByDraftIdempotency = new Map<string, string>();
  private readonly captureByDraftPayloadHash = new Map<string, string>();
  private readonly maskedViews = new Map<string, PersistedContactPreferenceMaskedViewRow>();
  private readonly maskedViewByCapture = new Map<string, string>();
  private readonly maskedViewByDraft = new Map<string, string>();
  private readonly seeds = new Map<string, PersistedContactRouteSnapshotSeedRow>();
  private readonly seedByCapture = new Map<string, string>();
  private readonly seedByDraft = new Map<string, string>();
  private readonly freezes = new Map<string, PersistedContactPreferenceSubmitFreezeRow>();
  private readonly freezeByEnvelope = new Map<string, string>();

  async getContactPreferenceCapture(contactPreferenceCaptureId: string) {
    const row = this.captures.get(contactPreferenceCaptureId);
    return row ? ContactPreferenceCaptureDocument.hydrate(row) : undefined;
  }

  async saveContactPreferenceCapture(
    capture: ContactPreferenceCaptureDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    const snapshot = capture.toSnapshot();
    const idempotencyKey = `${snapshot.draftPublicId}::${snapshot.idempotencyKey}`;
    const payloadHashKey = `${snapshot.draftPublicId}::${snapshot.payloadHash}`;
    const existingIdempotency = this.captureByDraftIdempotency.get(idempotencyKey);
    const existingPayloadHash = this.captureByDraftPayloadHash.get(payloadHashKey);
    invariant(
      existingIdempotency === undefined || existingIdempotency === snapshot.contactPreferenceCaptureId,
      "CONTACT_PREFERENCE_IDEMPOTENCY_COLLISION",
      "idempotencyKey is already bound to another contact preference capture.",
    );
    invariant(
      existingPayloadHash === undefined || existingPayloadHash === snapshot.contactPreferenceCaptureId,
      "CONTACT_PREFERENCE_PAYLOAD_HASH_COLLISION",
      "payload hash is already bound to another contact preference capture.",
    );
    saveVersionedRow(
      this.captures,
      snapshot.contactPreferenceCaptureId,
      {
        ...snapshot,
        aggregateType: "Phase1ContactPreferenceCapture",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.captureByDraft.set(snapshot.draftPublicId, snapshot.contactPreferenceCaptureId);
    this.captureByDraftIdempotency.set(idempotencyKey, snapshot.contactPreferenceCaptureId);
    this.captureByDraftPayloadHash.set(payloadHashKey, snapshot.contactPreferenceCaptureId);
  }

  async listContactPreferenceCaptures() {
    return [...this.captures.values()].map((row) => ContactPreferenceCaptureDocument.hydrate(row));
  }

  async findLatestContactPreferenceCaptureForDraft(draftPublicId: string) {
    const id = this.captureByDraft.get(draftPublicId);
    return id ? this.getContactPreferenceCapture(id) : undefined;
  }

  async findContactPreferenceCaptureByIdempotency(draftPublicId: string, idempotencyKey: string) {
    const id = this.captureByDraftIdempotency.get(`${draftPublicId}::${idempotencyKey}`);
    return id ? this.getContactPreferenceCapture(id) : undefined;
  }

  async findContactPreferenceCaptureByPayloadHash(draftPublicId: string, payloadHash: string) {
    const id = this.captureByDraftPayloadHash.get(`${draftPublicId}::${payloadHash}`);
    return id ? this.getContactPreferenceCapture(id) : undefined;
  }

  async getContactPreferenceMaskedView(maskedViewId: string) {
    const row = this.maskedViews.get(maskedViewId);
    return row ? ContactPreferenceMaskedViewDocument.hydrate(row) : undefined;
  }

  async saveContactPreferenceMaskedView(
    maskedView: ContactPreferenceMaskedViewDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    const snapshot = maskedView.toSnapshot();
    saveVersionedRow(
      this.maskedViews,
      snapshot.maskedViewId,
      {
        ...snapshot,
        aggregateType: "Phase1ContactPreferenceMaskedView",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.maskedViewByCapture.set(snapshot.contactPreferenceCaptureRef, snapshot.maskedViewId);
    this.maskedViewByDraft.set(snapshot.draftPublicId, snapshot.maskedViewId);
  }

  async findLatestContactPreferenceMaskedViewForDraft(draftPublicId: string) {
    const id = this.maskedViewByDraft.get(draftPublicId);
    return id ? this.getContactPreferenceMaskedView(id) : undefined;
  }

  async findContactPreferenceMaskedViewByCapture(contactPreferenceCaptureRef: string) {
    const id = this.maskedViewByCapture.get(contactPreferenceCaptureRef);
    return id ? this.getContactPreferenceMaskedView(id) : undefined;
  }

  async getContactRouteSnapshotSeed(routeSnapshotSeedId: string) {
    const row = this.seeds.get(routeSnapshotSeedId);
    return row ? ContactRouteSnapshotSeedDocument.hydrate(row) : undefined;
  }

  async saveContactRouteSnapshotSeed(
    seed: ContactRouteSnapshotSeedDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    const snapshot = seed.toSnapshot();
    saveVersionedRow(
      this.seeds,
      snapshot.routeSnapshotSeedId,
      {
        ...snapshot,
        aggregateType: "Phase1ContactRouteSnapshotSeed",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.seedByCapture.set(snapshot.contactPreferenceCaptureRef, snapshot.routeSnapshotSeedId);
    this.seedByDraft.set(snapshot.draftPublicId, snapshot.routeSnapshotSeedId);
  }

  async findLatestContactRouteSnapshotSeedForDraft(draftPublicId: string) {
    const id = this.seedByDraft.get(draftPublicId);
    return id ? this.getContactRouteSnapshotSeed(id) : undefined;
  }

  async findContactRouteSnapshotSeedByCapture(contactPreferenceCaptureRef: string) {
    const id = this.seedByCapture.get(contactPreferenceCaptureRef);
    return id ? this.getContactRouteSnapshotSeed(id) : undefined;
  }

  async getContactPreferenceSubmitFreeze(contactPreferenceSubmitFreezeId: string) {
    const row = this.freezes.get(contactPreferenceSubmitFreezeId);
    return row ? ContactPreferenceSubmitFreezeDocument.hydrate(row) : undefined;
  }

  async saveContactPreferenceSubmitFreeze(
    submitFreeze: ContactPreferenceSubmitFreezeDocument,
    options?: CompareAndSetWriteOptions,
  ) {
    const snapshot = submitFreeze.toSnapshot();
    const existingEnvelope = this.freezeByEnvelope.get(snapshot.envelopeRef);
    invariant(
      existingEnvelope === undefined ||
        existingEnvelope === snapshot.contactPreferenceSubmitFreezeId,
      "CONTACT_PREFERENCE_FREEZE_ENVELOPE_ALREADY_BOUND",
      "A submit freeze already exists for this envelope.",
    );
    saveVersionedRow(
      this.freezes,
      snapshot.contactPreferenceSubmitFreezeId,
      {
        ...snapshot,
        aggregateType: "Phase1ContactPreferenceSubmitFreeze",
        persistenceSchemaVersion: 1,
      },
      options,
    );
    this.freezeByEnvelope.set(snapshot.envelopeRef, snapshot.contactPreferenceSubmitFreezeId);
  }

  async findContactPreferenceSubmitFreezeByEnvelope(envelopeRef: string) {
    const id = this.freezeByEnvelope.get(envelopeRef);
    return id ? this.getContactPreferenceSubmitFreeze(id) : undefined;
  }
}

export function createPhase1ContactPreferenceStore(): Phase1ContactPreferenceRepositories {
  return new InMemoryPhase1ContactPreferenceStore();
}

function normalizeQuietHours(
  quietHours: QuietHoursWindow | null | undefined,
): QuietHoursWindow | null {
  if (quietHours === null || quietHours === undefined) {
    return null;
  }
  return {
    startLocalTime: ensureLocalTime(quietHours.startLocalTime, "quietHours.startLocalTime"),
    endLocalTime: ensureLocalTime(quietHours.endLocalTime, "quietHours.endLocalTime"),
    timezone: requireRef(quietHours.timezone, "quietHours.timezone"),
  };
}

function normalizeDestinationValue(
  channel: ContactChannel,
  rawValue: string | null | undefined,
): ProtectedContactDestination | null {
  const trimmed = optionalRef(rawValue);
  if (!trimmed) {
    return null;
  }
  if (channel === "email") {
    const normalizedValue = normalizeEmailAddress(trimmed);
    return {
      channel,
      rawValue: trimmed,
      normalizedValue,
      maskedValue: maskEmailAddress(normalizedValue),
    };
  }
  const normalizedValue = normalizePhoneLike(
    trimmed,
    channel === "sms" ? "smsDestination" : "phoneDestination",
  );
  return {
    channel,
    rawValue: trimmed,
    normalizedValue,
    maskedValue: maskPhoneLike(normalizedValue),
  };
}

function buildCompletenessReasonCodes(input: {
  preferredChannel: ContactChannel;
  followUpPermission: boolean | null;
  smsDestination: ProtectedContactDestination | null;
  phoneDestination: ProtectedContactDestination | null;
  emailDestination: ProtectedContactDestination | null;
}): readonly string[] {
  const codes: string[] = [];
  const preferredDestination =
    input.preferredChannel === "sms"
      ? input.smsDestination
      : input.preferredChannel === "phone"
        ? input.phoneDestination
        : input.emailDestination;
  if (!preferredDestination) {
    codes.push("CONTACT_PREF_DESTINATION_REQUIRED_FOR_PREFERRED_CHANNEL");
  }
  if (input.followUpPermission === null) {
    codes.push("CONTACT_PREF_FOLLOW_UP_PERMISSION_REQUIRED");
  }
  return uniqueSorted(codes);
}

function buildSemanticReasonCodes(input: {
  previousCapture: ContactPreferenceCaptureDocument | null;
  preferredChannel: ContactChannel;
  smsDestination: ProtectedContactDestination | null;
  phoneDestination: ProtectedContactDestination | null;
  emailDestination: ProtectedContactDestination | null;
  followUpPermission: boolean | null;
  contactWindow: ContactWindow;
  quietHours: QuietHoursWindow | null;
  languagePreference: string | null;
  translationRequired: boolean;
  accessibilityNeeds: readonly ContactAccessibilityNeed[];
}): readonly string[] {
  const previous = input.previousCapture?.toSnapshot() ?? null;
  if (!previous) {
    return uniqueSorted([
      "GAP_RESOLVED_CONTACT_PREFERENCE_MINIMUM_PHASE1_SELF_SERVICE_V1",
      "CONTACT_PREF_INITIAL_CAPTURE",
    ]);
  }
  const reasonCodes = new Set<string>([
    "GAP_RESOLVED_CONTACT_PREFERENCE_MINIMUM_PHASE1_SELF_SERVICE_V1",
  ]);
  if (previous.preferredChannel !== input.preferredChannel) {
    reasonCodes.add("CONTACT_PREF_PRIMARY_CHANNEL_CHANGED");
    reasonCodes.add("CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT");
  }
  if (
    previous.smsDestination?.normalizedValue !== input.smsDestination?.normalizedValue ||
    previous.phoneDestination?.normalizedValue !== input.phoneDestination?.normalizedValue ||
    previous.emailDestination?.normalizedValue !== input.emailDestination?.normalizedValue
  ) {
    reasonCodes.add("CONTACT_PREF_DESTINATION_CHANGED");
    reasonCodes.add("CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT");
  }
  if (previous.followUpPermission !== input.followUpPermission) {
    reasonCodes.add("CONTACT_PREF_FOLLOW_UP_PERMISSION_CHANGED");
  }
  if (
    previous.contactWindow !== input.contactWindow ||
    stableStringify(previous.quietHours) !== stableStringify(input.quietHours)
  ) {
    reasonCodes.add("CONTACT_PREF_CONTACT_WINDOW_CHANGED");
  }
  if (
    previous.languagePreference !== input.languagePreference ||
    previous.translationRequired !== input.translationRequired ||
    stableStringify(previous.accessibilityNeeds) !== stableStringify(input.accessibilityNeeds)
  ) {
    reasonCodes.add("CONTACT_PREF_LANGUAGE_OR_ACCESSIBILITY_CHANGED");
  }
  return uniqueSorted([...reasonCodes]);
}

function determineMaterialityClass(reasonCodes: readonly string[]): ContactPreferenceSemanticMaterialityClass {
  return reasonCodes.includes("CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT")
    ? "contact_safety_relevant"
    : "operationally_material_nonclinical";
}

function quietHoursSummary(quietHours: QuietHoursWindow | null): string | null {
  if (!quietHours) {
    return null;
  }
  return `${quietHours.startLocalTime}-${quietHours.endLocalTime} ${quietHours.timezone}`;
}

function buildMaskedView(
  capture: ContactPreferenceCaptureDocument,
  completenessState: ContactPreferenceCompletenessState,
  completenessReasonCodes: readonly string[],
  idGenerator: BackboneIdGenerator,
): ContactPreferenceMaskedViewDocument {
  const snapshot = capture.toSnapshot();
  const destinations: MaskedContactDestinationSummary[] = [
      snapshot.smsDestination
        ? {
            channel: "sms",
            maskedValue: snapshot.smsDestination.maskedValue,
            destinationState: "present_masked",
          }
        : {
            channel: "sms",
            maskedValue: "Not provided",
            destinationState: "missing",
          },
      snapshot.phoneDestination
        ? {
            channel: "phone",
            maskedValue: snapshot.phoneDestination.maskedValue,
            destinationState: "present_masked",
          }
        : {
            channel: "phone",
            maskedValue: "Not provided",
            destinationState: "missing",
          },
      snapshot.emailDestination
        ? {
            channel: "email",
            maskedValue: snapshot.emailDestination.maskedValue,
            destinationState: "present_masked",
          }
        : {
            channel: "email",
            maskedValue: "Not provided",
            destinationState: "missing",
          },
  ];
  destinations.sort((left, right) => compareStrings(left.channel, right.channel));
  const preferredMasked =
    snapshot.preferredChannel === "sms"
      ? snapshot.smsDestination?.maskedValue ?? null
      : snapshot.preferredChannel === "phone"
        ? snapshot.phoneDestination?.maskedValue ?? null
        : snapshot.emailDestination?.maskedValue ?? null;

  return ContactPreferenceMaskedViewDocument.create({
    maskedViewSchemaVersion: "PHASE1_CONTACT_PREFERENCE_MASKED_VIEW_V1",
    maskedViewId: nextContactPreferenceId(idGenerator, "contactPreferenceMaskedView"),
    contactPreferenceCaptureRef: snapshot.contactPreferenceCaptureId,
    contactPreferencesRef: snapshot.contactPreferencesRef,
    envelopeRef: snapshot.envelopeRef,
    draftPublicId: snapshot.draftPublicId,
    preferredChannel: snapshot.preferredChannel,
    preferredDestinationMasked: preferredMasked,
    destinations,
    followUpPermissionState:
      snapshot.followUpPermission === null
        ? "not_set"
        : snapshot.followUpPermission
          ? "granted"
          : "declined",
    contactWindow: snapshot.contactWindow,
    voicemailAllowed: snapshot.voicemailAllowed,
    quietHoursSummary: quietHoursSummary(snapshot.quietHours),
    languagePreference: snapshot.languagePreference,
    translationRequired: snapshot.translationRequired,
    accessibilityNeeds: snapshot.accessibilityNeeds,
    sourceAuthorityClass: snapshot.sourceAuthorityClass,
    completenessState,
    reasonCodes: uniqueSorted([...snapshot.reasonCodes, ...completenessReasonCodes]),
    recordedAt: snapshot.recordedAt,
  });
}

function toRouteSeedSourceAuthorityClass(
  sourceAuthorityClass: ContactPreferenceSourceAuthorityClass,
): ContactRouteSnapshotSeedSourceAuthorityClass {
  switch (sourceAuthorityClass) {
    case "support_captured":
      return "support_captured";
    case "self_service_browser_entry":
    case "self_service_embedded_entry":
    case "authenticated_uplift_pending":
      return "patient_confirmed";
  }
}

function buildRouteSnapshotSeed(
  capture: ContactPreferenceCaptureDocument,
  idGenerator: BackboneIdGenerator,
): ContactRouteSnapshotSeedDocument | null {
  const snapshot = capture.toSnapshot();
  const preferredDestination =
    snapshot.preferredChannel === "sms"
      ? snapshot.smsDestination
      : snapshot.preferredChannel === "phone"
        ? snapshot.phoneDestination
        : snapshot.emailDestination;
  if (!preferredDestination) {
    return null;
  }
  const routeKind = snapshot.preferredChannel === "phone" ? "voice" : snapshot.preferredChannel;
  return ContactRouteSnapshotSeedDocument.create({
    routeSnapshotSeedSchemaVersion: "PHASE1_CONTACT_ROUTE_SNAPSHOT_SEED_V1",
    routeSnapshotSeedId: nextContactPreferenceId(idGenerator, "contactRouteSnapshotSeed"),
    contactPreferenceCaptureRef: snapshot.contactPreferenceCaptureId,
    contactPreferencesRef: snapshot.contactPreferencesRef,
    envelopeRef: snapshot.envelopeRef,
    draftPublicId: snapshot.draftPublicId,
    preferredChannel: snapshot.preferredChannel,
    routeKind,
    routeRef: `contact_route::${snapshot.draftPublicId}::${snapshot.preferredChannel}`,
    routeVersionRef: `contact_route_version::${snapshot.contactPreferenceCaptureId}::${snapshot.preferredChannel}`,
    normalizedAddressRef: `contact_normalized_address::${stableDigest(preferredDestination.normalizedValue).slice(0, 24)}`,
    maskedDestination: preferredDestination.maskedValue,
    verificationState: "unverified",
    demographicFreshnessState: "current",
    preferenceFreshnessState: "current",
    sourceAuthorityClass: toRouteSeedSourceAuthorityClass(snapshot.sourceAuthorityClass),
    recordedAt: snapshot.recordedAt,
  });
}

function buildValidationSummaryFromState(input: {
  draftPublicId: string;
  envelopeRef: string;
  capture: ContactPreferenceCaptureDocument | null;
  maskedView: ContactPreferenceMaskedViewDocument | null;
  routeSnapshotSeed: ContactRouteSnapshotSeedDocument | null;
  completenessState: ContactPreferenceCompletenessState;
  completenessReasonCodes: readonly string[];
}): ContactPreferenceValidationSummary {
  if (!input.capture || !input.maskedView) {
    return {
      validationSummarySchemaVersion: "PHASE1_CONTACT_PREFERENCE_VALIDATION_SUMMARY_V1",
      draftPublicId: input.draftPublicId,
      envelopeRef: input.envelopeRef,
      contactPreferenceCaptureRef: null,
      contactPreferencesRef: null,
      maskedViewRef: null,
      routeSnapshotSeedRef: null,
      preferredChannel: null,
      preferredDestinationMasked: null,
      completenessState: "incomplete",
      reasonCodes: ["CONTACT_PREF_CAPTURE_MISSING"],
      sourceAuthorityClass: "contact_capture_missing",
    };
  }
  const captureSnapshot = input.capture.toSnapshot();
  const maskedSnapshot = input.maskedView.toSnapshot();
  return {
    validationSummarySchemaVersion: "PHASE1_CONTACT_PREFERENCE_VALIDATION_SUMMARY_V1",
    draftPublicId: input.draftPublicId,
    envelopeRef: input.envelopeRef,
    contactPreferenceCaptureRef: captureSnapshot.contactPreferenceCaptureId,
    contactPreferencesRef: captureSnapshot.contactPreferencesRef,
    maskedViewRef: maskedSnapshot.maskedViewId,
    routeSnapshotSeedRef: input.routeSnapshotSeed?.toSnapshot().routeSnapshotSeedId ?? null,
    preferredChannel: captureSnapshot.preferredChannel,
    preferredDestinationMasked: maskedSnapshot.preferredDestinationMasked,
    completenessState: input.completenessState,
    reasonCodes: uniqueSorted([...captureSnapshot.reasonCodes, ...input.completenessReasonCodes]),
    sourceAuthorityClass: captureSnapshot.sourceAuthorityClass,
  };
}

export class Phase1ContactPreferenceService {
  private readonly repositories: Phase1ContactPreferenceRepositories;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(
    repositories: Phase1ContactPreferenceRepositories,
    idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
      "phase1_contact_preferences",
    ),
  ) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
  }

  async getLatestCaptureForDraft(draftPublicId: string) {
    return this.repositories.findLatestContactPreferenceCaptureForDraft(draftPublicId);
  }

  async getLatestMaskedViewForDraft(draftPublicId: string) {
    return this.repositories.findLatestContactPreferenceMaskedViewForDraft(draftPublicId);
  }

  async getLatestRouteSnapshotSeedForDraft(draftPublicId: string) {
    return this.repositories.findLatestContactRouteSnapshotSeedForDraft(draftPublicId);
  }

  async buildValidationSummaryForDraft(
    draftPublicId: string,
    envelopeRef: string,
  ): Promise<ContactPreferenceValidationSummary> {
    const capture = await this.repositories.findLatestContactPreferenceCaptureForDraft(draftPublicId);
    const maskedView = await this.repositories.findLatestContactPreferenceMaskedViewForDraft(
      draftPublicId,
    );
    const seed = await this.repositories.findLatestContactRouteSnapshotSeedForDraft(draftPublicId);
    const captureSnapshot = capture?.toSnapshot() ?? null;
    const completenessReasonCodes = captureSnapshot
      ? buildCompletenessReasonCodes({
          preferredChannel: captureSnapshot.preferredChannel,
          followUpPermission: captureSnapshot.followUpPermission,
          smsDestination: captureSnapshot.smsDestination,
          phoneDestination: captureSnapshot.phoneDestination,
          emailDestination: captureSnapshot.emailDestination,
        })
      : ["CONTACT_PREF_CAPTURE_MISSING"];
    const completenessState: ContactPreferenceCompletenessState =
      completenessReasonCodes.length === 0 ? "complete" : "incomplete";
    return buildValidationSummaryFromState({
      draftPublicId,
      envelopeRef,
      capture: capture ?? null,
      maskedView: maskedView ?? null,
      routeSnapshotSeed: seed ?? null,
      completenessState,
      completenessReasonCodes,
    });
  }

  async captureContactPreferences(
    input: CaptureContactPreferencesInput,
  ): Promise<CaptureContactPreferencesResult> {
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const idempotencyKey = requireRef(input.idempotencyKey, "idempotencyKey");
    const clientCommandId = requireRef(input.clientCommandId, "clientCommandId");
    const existingByIdempotency = await this.repositories.findContactPreferenceCaptureByIdempotency(
      input.draftPublicId,
      idempotencyKey,
    );
    const smsDestination = normalizeDestinationValue("sms", input.destinations?.sms);
    const phoneDestination = normalizeDestinationValue("phone", input.destinations?.phone);
    const emailDestination = normalizeDestinationValue("email", input.destinations?.email);
    const quietHours = normalizeQuietHours(input.quietHours);
    const languagePreference = normalizeLanguageCode(input.languagePreference);
    const accessibilityNeeds = normalizeAccessibilityFlags(input.accessibilityNeeds);
    const payloadMaterial = {
      preferredChannel: input.preferredChannel,
      contactWindow: input.contactWindow,
      voicemailAllowed: input.voicemailAllowed,
      followUpPermission: input.followUpPermission ?? null,
      destinations: {
        sms: smsDestination?.normalizedValue ?? null,
        phone: phoneDestination?.normalizedValue ?? null,
        email: emailDestination?.normalizedValue ?? null,
      },
      quietHours,
      languagePreference,
      translationRequired: input.translationRequired ?? false,
      accessibilityNeeds,
      sourceAuthorityClass: input.sourceAuthorityClass,
    };
    const payloadHash = stableDigest(stableStringify(payloadMaterial));
    if (existingByIdempotency) {
      invariant(
        existingByIdempotency.payloadHash === payloadHash,
        "CONTACT_PREFERENCE_IDEMPOTENCY_PAYLOAD_MISMATCH",
        "The same idempotencyKey cannot be reused for a different contact-preference payload.",
      );
      const maskedView =
        await this.repositories.findContactPreferenceMaskedViewByCapture(
          existingByIdempotency.contactPreferenceCaptureId,
        );
      invariant(
        maskedView,
        "CONTACT_PREFERENCE_MASKED_VIEW_MISSING",
        "Masked view missing for the replayed contact preference capture.",
      );
      const routeSnapshotSeed = await this.repositories.findContactRouteSnapshotSeedByCapture(
        existingByIdempotency.contactPreferenceCaptureId,
      );
      const validationSummary = await this.buildValidationSummaryForDraft(
        input.draftPublicId,
        input.envelopeRef,
      );
      return {
        replayed: true,
        capture: existingByIdempotency,
        maskedView,
        routeSnapshotSeed: routeSnapshotSeed ?? null,
        validationSummary,
        events: [
          emitIntakeContactPreferencesCaptured({
            draftPublicId: input.draftPublicId,
            envelopeRef: input.envelopeRef,
            contactPreferenceCaptureRef: existingByIdempotency.contactPreferenceCaptureId,
            contactPreferencesRef: existingByIdempotency.contactPreferencesRef,
            maskedViewRef: maskedView.maskedViewId,
            routeSnapshotSeedRef: routeSnapshotSeed?.routeSnapshotSeedId ?? null,
            replayClass: "idempotent_replay",
            completenessState: validationSummary.completenessState,
          }),
        ],
      };
    }

    const existingByPayloadHash =
      await this.repositories.findContactPreferenceCaptureByPayloadHash(
        input.draftPublicId,
        payloadHash,
      );
    if (existingByPayloadHash) {
      const maskedView =
        await this.repositories.findContactPreferenceMaskedViewByCapture(
          existingByPayloadHash.contactPreferenceCaptureId,
        );
      invariant(
        maskedView,
        "CONTACT_PREFERENCE_MASKED_VIEW_MISSING",
        "Masked view missing for the replayed semantic contact preference capture.",
      );
      const routeSnapshotSeed = await this.repositories.findContactRouteSnapshotSeedByCapture(
        existingByPayloadHash.contactPreferenceCaptureId,
      );
      const validationSummary = await this.buildValidationSummaryForDraft(
        input.draftPublicId,
        input.envelopeRef,
      );
      return {
        replayed: true,
        capture: existingByPayloadHash,
        maskedView,
        routeSnapshotSeed: routeSnapshotSeed ?? null,
        validationSummary,
        events: [
          emitIntakeContactPreferencesCaptured({
            draftPublicId: input.draftPublicId,
            envelopeRef: input.envelopeRef,
            contactPreferenceCaptureRef: existingByPayloadHash.contactPreferenceCaptureId,
            contactPreferencesRef: existingByPayloadHash.contactPreferencesRef,
            maskedViewRef: maskedView.maskedViewId,
            routeSnapshotSeedRef: routeSnapshotSeed?.routeSnapshotSeedId ?? null,
            replayClass: "idempotent_replay",
            completenessState: validationSummary.completenessState,
          }),
        ],
      };
    }

    const previousCapture = await this.repositories.findLatestContactPreferenceCaptureForDraft(
      input.draftPublicId,
    );
    const reasonCodes = buildSemanticReasonCodes({
      previousCapture: previousCapture ?? null,
      preferredChannel: input.preferredChannel,
      smsDestination,
      phoneDestination,
      emailDestination,
      followUpPermission: input.followUpPermission ?? null,
      contactWindow: input.contactWindow,
      quietHours,
      languagePreference,
      translationRequired: input.translationRequired ?? false,
      accessibilityNeeds,
    });
    const contactPreferencesRef = `cpref_${payloadHash.slice(0, 24)}`;
    const capture = ContactPreferenceCaptureDocument.create({
      captureSchemaVersion: "PHASE1_CONTACT_PREFERENCE_CAPTURE_V1",
      contactPreferenceCaptureId: nextContactPreferenceId(
        this.idGenerator,
        "contactPreferenceCapture",
      ),
      contactPreferencesRef,
      envelopeRef: requireRef(input.envelopeRef, "envelopeRef"),
      draftPublicId: requireRef(input.draftPublicId, "draftPublicId"),
      captureVersion: (previousCapture?.captureVersion ?? 0) + 1,
      preferredChannel: input.preferredChannel,
      contactWindow: input.contactWindow,
      voicemailAllowed: input.voicemailAllowed,
      followUpPermission: input.followUpPermission ?? null,
      smsDestination,
      phoneDestination,
      emailDestination,
      quietHours,
      languagePreference,
      translationRequired: input.translationRequired ?? false,
      accessibilityNeeds,
      sourceAuthorityClass: input.sourceAuthorityClass,
      sourceEvidenceRef: input.sourceEvidenceRef,
      semanticMaterialityClass: determineMaterialityClass(reasonCodes),
      reasonCodes,
      payloadHash,
      supersedesContactPreferenceCaptureRef:
        previousCapture?.contactPreferenceCaptureId ?? null,
      clientCommandId,
      idempotencyKey,
      recordedAt,
    });
    const completenessReasonCodes = buildCompletenessReasonCodes({
      preferredChannel: capture.toSnapshot().preferredChannel,
      followUpPermission: capture.toSnapshot().followUpPermission,
      smsDestination: capture.toSnapshot().smsDestination,
      phoneDestination: capture.toSnapshot().phoneDestination,
      emailDestination: capture.toSnapshot().emailDestination,
    });
    const completenessState: ContactPreferenceCompletenessState =
      completenessReasonCodes.length === 0 ? "complete" : "incomplete";
    const maskedView = buildMaskedView(
      capture,
      completenessState,
      completenessReasonCodes,
      this.idGenerator,
    );
    const routeSnapshotSeed =
      completenessState === "complete" ? buildRouteSnapshotSeed(capture, this.idGenerator) : null;
    await this.repositories.saveContactPreferenceCapture(capture);
    await this.repositories.saveContactPreferenceMaskedView(maskedView);
    if (routeSnapshotSeed) {
      await this.repositories.saveContactRouteSnapshotSeed(routeSnapshotSeed);
    }
    const validationSummary = buildValidationSummaryFromState({
      draftPublicId: input.draftPublicId,
      envelopeRef: input.envelopeRef,
      capture,
      maskedView,
      routeSnapshotSeed,
      completenessState,
      completenessReasonCodes,
    });
    return {
      replayed: false,
      capture,
      maskedView,
      routeSnapshotSeed,
      validationSummary,
      events: [
        emitIntakeContactPreferencesCaptured({
          draftPublicId: input.draftPublicId,
          envelopeRef: input.envelopeRef,
          contactPreferenceCaptureRef: capture.contactPreferenceCaptureId,
          contactPreferencesRef,
          maskedViewRef: maskedView.maskedViewId,
          routeSnapshotSeedRef: routeSnapshotSeed?.routeSnapshotSeedId ?? null,
          replayClass: "new_capture",
          completenessState,
        }),
      ],
    };
  }

  async freezeContactPreferencesForSubmit(
    input: FreezeContactPreferencesForSubmitInput,
  ): Promise<FreezeContactPreferencesForSubmitResult> {
    const existing = await this.repositories.findContactPreferenceSubmitFreezeByEnvelope(
      input.envelopeRef,
    );
    if (existing) {
      const capture = await this.repositories.getContactPreferenceCapture(
        existing.toSnapshot().contactPreferenceCaptureRef,
      );
      invariant(
        capture,
        "CONTACT_PREFERENCE_CAPTURE_MISSING",
        "Submit freeze references a missing contact preference capture.",
      );
      const maskedView = await this.repositories.getContactPreferenceMaskedView(
        existing.toSnapshot().maskedViewRef,
      );
      invariant(
        maskedView,
        "CONTACT_PREFERENCE_MASKED_VIEW_MISSING",
        "Submit freeze references a missing masked contact preference view.",
      );
      const routeSnapshotSeedRef = existing.toSnapshot().routeSnapshotSeedRef;
      const routeSnapshotSeed = routeSnapshotSeedRef
        ? await this.repositories.getContactRouteSnapshotSeed(routeSnapshotSeedRef)
        : undefined;
      return {
        replayed: true,
        submitFreeze: existing,
        capture,
        maskedView,
        routeSnapshotSeed: routeSnapshotSeed ?? null,
        validationSummary: await this.buildValidationSummaryForDraft(
          input.draftPublicId,
          input.envelopeRef,
        ),
        events: [],
      };
    }

    const capture = await this.repositories.findLatestContactPreferenceCaptureForDraft(
      input.draftPublicId,
    );
    invariant(
      capture,
      "CONTACT_PREFERENCE_CAPTURE_REQUIRED",
      "A contact preference capture must exist before submit freeze.",
    );
    const maskedView =
      await this.repositories.findContactPreferenceMaskedViewByCapture(
        capture.contactPreferenceCaptureId,
      );
    invariant(
      maskedView,
      "CONTACT_PREFERENCE_MASKED_VIEW_MISSING",
      "Masked contact preference view missing before submit freeze.",
    );
    const validationSummary = await this.buildValidationSummaryForDraft(
      input.draftPublicId,
      input.envelopeRef,
    );
    invariant(
      validationSummary.completenessState === "complete",
      "CONTACT_PREFERENCE_FREEZE_INCOMPLETE",
      "Incomplete contact preference captures may not freeze for submit.",
    );
    const routeSnapshotSeed =
      (await this.repositories.findContactRouteSnapshotSeedByCapture(
        capture.contactPreferenceCaptureId,
      )) ?? buildRouteSnapshotSeed(capture, this.idGenerator);
    if (
      routeSnapshotSeed &&
      !(await this.repositories.findContactRouteSnapshotSeedByCapture(capture.contactPreferenceCaptureId))
    ) {
      await this.repositories.saveContactRouteSnapshotSeed(routeSnapshotSeed);
    }
    const submitFreeze = ContactPreferenceSubmitFreezeDocument.create({
      submitFreezeSchemaVersion: "PHASE1_CONTACT_PREFERENCE_SUBMIT_FREEZE_V1",
      contactPreferenceSubmitFreezeId: nextContactPreferenceId(
        this.idGenerator,
        "contactPreferenceSubmitFreeze",
      ),
      envelopeRef: requireRef(input.envelopeRef, "envelopeRef"),
      draftPublicId: requireRef(input.draftPublicId, "draftPublicId"),
      contactPreferenceCaptureRef: capture.contactPreferenceCaptureId,
      contactPreferencesRef: capture.contactPreferencesRef,
      maskedViewRef: maskedView.maskedViewId,
      routeSnapshotSeedRef: routeSnapshotSeed?.routeSnapshotSeedId ?? null,
      frozenAt: ensureIsoTimestamp(input.frozenAt, "frozenAt"),
    });
    await this.repositories.saveContactPreferenceSubmitFreeze(submitFreeze);
    return {
      replayed: false,
      submitFreeze,
      capture,
      maskedView,
      routeSnapshotSeed: routeSnapshotSeed ?? null,
      validationSummary,
      events: [
        emitIntakeContactPreferencesFrozen({
          draftPublicId: input.draftPublicId,
          envelopeRef: input.envelopeRef,
          contactPreferenceFreezeRef: submitFreeze.toSnapshot().contactPreferenceSubmitFreezeId,
          contactPreferenceCaptureRef: capture.contactPreferenceCaptureId,
          contactPreferencesRef: capture.contactPreferencesRef,
          routeSnapshotSeedRef: routeSnapshotSeed?.routeSnapshotSeedId ?? null,
        }),
      ],
    };
  }
}

export function createPhase1ContactPreferenceService(options?: {
  repositories?: Phase1ContactPreferenceRepositories;
  idGenerator?: BackboneIdGenerator;
}): Phase1ContactPreferenceService {
  return new Phase1ContactPreferenceService(
    options?.repositories ?? createPhase1ContactPreferenceStore(),
    options?.idGenerator,
  );
}
