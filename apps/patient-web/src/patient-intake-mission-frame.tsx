import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  resolvePersistentShellProfile,
  writePersistedContinuitySnapshot,
  type BreakpointClass,
} from "@vecells/persistent-shell";
import {
  createInitialMissionFrameSnapshot,
  defaultIntakeMissionFrameMemory,
  formatPatientIntakeMissionPath,
  isPatientIntakeMissionFramePath,
  missionFrameLayoutContract,
  normalizeMissionFrameMemory,
  parsePatientIntakeMissionLocation,
  PATIENT_INTAKE_CONTRACT_ENTRY,
  PATIENT_INTAKE_ENTRY_ALIAS,
  PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY,
  PATIENT_INTAKE_MISSION_FRAME_TASK_ID,
  PATIENT_INTAKE_MISSION_FRAME_VISUAL_MODE,
  requestPublicIdForDraft,
  resolveMissionFrameView,
  routeStepDescriptors,
  synchronizeMissionFrameSnapshot,
  type IntakeMissionFrameLocation,
  type IntakeMissionFrameMemory,
  type IntakeMissionFrameRouteKey,
  type IntakeRequestTypeCard,
} from "./patient-intake-mission-frame.model";
import {
  answerProgressiveQuestion,
  buildProgressiveFlowView,
  cancelRequestTypeChange,
  confirmRequestTypeChange,
  ensureProgressiveState,
  hasBoundedUrgentDiversionSignal,
  isSafetyReviewPending,
  moveDetailsBackward,
  moveDetailsForward,
  projectActiveQuestionSummary,
  projectNarrativeAnswer,
  selectRequestType,
  toggleHelperForQuestion,
} from "./patient-intake-progressive-flow";
import {
  BundleCompatibilitySheet,
  ContextChipRow,
  QuestionFieldRenderer,
  QuestionStemBlock,
  RequestTypeSignalGrid,
  RevealPatchRegion,
  ReviewDeltaNotice,
} from "./patient-intake-question-primitives";
import {
  ContinueYourRequestCard,
  MergeReviewSheet,
  RecoveryBridgePanel,
} from "./patient-intake-status-components";
import {
  AccessPostureCanvas,
  AccessPostureStrip,
} from "./patient-intake-access-posture-components";
import { PatientPortalTopBar } from "./patient-portal-top-bar";
import {
  ChannelPreferenceStack,
  CommunicationNeedsPanel,
  ConfirmationCopyPreview,
  RouteEntryPanel,
  RouteMaskedSummaryCard,
  TrustBoundaryNote,
} from "./patient-intake-contact-preference-components";
import {
  FailedSafeSafetyRecoveryCard,
  UrgentPathwayFrame,
} from "./patient-intake-urgent-outcome-components";
import { ReceiptOutcomeCanvas } from "./patient-intake-receipt-components";
import { RequestStatusCanvas } from "./patient-intake-request-status-components";
import {
  AttachmentLaneAnnouncementRegion,
  EvidenceCardStack,
  EvidenceLaneDropzone,
  GovernedPreviewPanel,
} from "./patient-intake-attachment-components";
import {
  buildContactSummaryView,
  primaryContactValidationMessage,
  type DraftContactPreferencesView,
} from "./patient-intake-contact-preferences";
import { issueUrgentOutcome } from "./patient-intake-urgent-outcome";
import { applyInlineReceiptPatch } from "./patient-intake-receipt-surface";
import { applyRequestStatusRefreshPatch } from "./patient-intake-request-status-surface";
import {
  AUTOSAVE_INDEX_KEY,
  AUTOSAVE_RECORD_PREFIX,
  readDraftSaveTruthBootstrap,
  syncMemoryPresentation,
} from "./patient-intake-save-truth";
import { useDraftSaveTruth } from "./use-draft-save-truth";
import { usePatientIntakeAttachments } from "./use-patient-intake-attachments";
import {
  applyIntegratedSubmitResult,
  patchIntegratedDraft,
  startIntegratedDraft,
  submitIntegratedJourney,
} from "./phase1-integrated-intake-client";
import {
  createDefaultPatientAccessSimulation,
  transitionPatientAccessScenario,
  type PatientAccessAction,
} from "./patient-intake-access-postures";

const MEMORY_PREFIX = "patient-intake-mission-frame::";

function safeWindow(): Window | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function breakpointClassFromWidth(width: number): BreakpointClass {
  if (width < 480) {
    return "compact";
  }
  if (width < 768) {
    return "narrow";
  }
  if (width < 1024) {
    return "medium";
  }
  if (width < 1440) {
    return "expanded";
  }
  return "wide";
}

function useBreakpointClass(): BreakpointClass {
  const ownerWindow = safeWindow();
  const [breakpointClass, setBreakpointClass] = useState<BreakpointClass>(
    ownerWindow ? breakpointClassFromWidth(ownerWindow.innerWidth) : "wide",
  );

  useEffect(() => {
    if (!ownerWindow) {
      return;
    }
    const update = () => setBreakpointClass(breakpointClassFromWidth(ownerWindow.innerWidth));
    update();
    ownerWindow.addEventListener("resize", update);
    return () => ownerWindow.removeEventListener("resize", update);
  }, [ownerWindow]);

  return breakpointClass;
}

function useReducedMotionPreference(): boolean {
  const ownerWindow = safeWindow();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    ownerWindow?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  useEffect(() => {
    if (!ownerWindow) {
      return;
    }
    const media = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [ownerWindow]);

  return prefersReducedMotion;
}

function storageKeyForDraft(draftPublicId: string): string {
  return `${MEMORY_PREFIX}${draftPublicId}`;
}

function readMissionFrameMemory(draftPublicId: string): IntakeMissionFrameMemory {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return defaultIntakeMissionFrameMemory(draftPublicId);
  }
  const payload = ownerWindow.localStorage.getItem(storageKeyForDraft(draftPublicId));
  if (!payload) {
    return defaultIntakeMissionFrameMemory(draftPublicId);
  }
  try {
    return normalizeMissionFrameMemory(
      draftPublicId,
      JSON.parse(payload) as Partial<IntakeMissionFrameMemory>,
    );
  } catch {
    return defaultIntakeMissionFrameMemory(draftPublicId);
  }
}

function writeMissionFrameMemory(memory: IntakeMissionFrameMemory): void {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return;
  }
  ownerWindow.localStorage.setItem(
    storageKeyForDraft(memory.draftPublicId),
    JSON.stringify(memory),
  );
}

function initialLocation(pathname?: string): IntakeMissionFrameLocation {
  return parsePatientIntakeMissionLocation(
    pathname ?? safeWindow()?.location.pathname ?? PATIENT_INTAKE_ENTRY_ALIAS,
  );
}

function routeFocusTarget(routeKey: IntakeMissionFrameRouteKey): string {
  switch (routeKey) {
    case "request_type":
      return "request-type-heading";
    case "details":
      return "details-heading";
    case "supporting_files":
      return "files-heading";
    case "contact_preferences":
      return "contact-heading";
    case "review_submit":
      return "review-heading";
    case "resume_recovery":
      return "recovery-heading";
    case "urgent_outcome":
      return "urgent-heading";
    case "receipt_outcome":
      return "receipt-heading";
    case "request_status":
      return "status-heading";
    default:
      return "landing-heading";
  }
}

function summaryModeForBreakpoint(breakpointClass: BreakpointClass): "panel" | "drawer" | "sheet" {
  if (breakpointClass === "wide" || breakpointClass === "expanded") {
    return "panel";
  }
  if (breakpointClass === "medium") {
    return "drawer";
  }
  return "sheet";
}

function formatStepCount(currentIndex: number, total: number): string {
  return `${String(currentIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

function shellPostureLabel(routeKey: IntakeMissionFrameRouteKey): string {
  switch (routeKey) {
    case "resume_recovery":
      return "recovery only";
    case "urgent_outcome":
      return "urgent outcome";
    case "receipt_outcome":
      return "receipt outcome";
    case "request_status":
      return "status outcome";
    default:
      return "live";
  }
}

function withCompletedStep(
  memory: IntakeMissionFrameMemory,
  routeKey: IntakeMissionFrameRouteKey,
): IntakeMissionFrameMemory {
  const stepKey = routeStepDescriptors.find((step) => step.routeKey === routeKey)?.stepKey;
  if (!stepKey || stepKey === "landing" || memory.completedStepKeys.includes(stepKey)) {
    return memory;
  }
  return {
    ...memory,
    completedStepKeys: [...memory.completedStepKeys, stepKey],
  };
}

interface PatientIntakeMissionFrameAppProps {
  initialPathname?: string;
  initialMemoryOverride?: Partial<IntakeMissionFrameMemory>;
}

function useMissionFrameController(props: PatientIntakeMissionFrameAppProps = {}) {
  const initialLocationRef = useRef<IntakeMissionFrameLocation>(
    initialLocation(props.initialPathname),
  );
  const initialDraftId =
    initialLocationRef.current.draftPublicId ?? defaultIntakeMissionFrameMemory().draftPublicId;
  const bootstrapRef = useRef(
    readDraftSaveTruthBootstrap(
      initialDraftId,
      ensureProgressiveState(readMissionFrameMemory(initialDraftId)),
    ),
  );
  const seededMemoryRef = useRef(
    ensureProgressiveState(
      props.initialMemoryOverride
        ? normalizeMissionFrameMemory(initialDraftId, {
            ...bootstrapRef.current.initialMemory,
            ...props.initialMemoryOverride,
          })
        : bootstrapRef.current.initialMemory,
    ),
  );
  const [location, setLocation] = useState(initialLocationRef.current);
  const [memory, setMemory] = useState<IntakeMissionFrameMemory>(() => seededMemoryRef.current);
  const [validationIssue, setValidationIssue] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState(() =>
    createInitialMissionFrameSnapshot(initialLocationRef.current),
  );

  const view = useMemo(() => resolveMissionFrameView({ location, memory }), [location, memory]);
  const flow = useMemo(() => buildProgressiveFlowView(memory), [memory]);
  const deferredView = useDeferredValue(view);

  const syncProgressiveFields = (
    nextMemory: IntakeMissionFrameMemory,
  ): IntakeMissionFrameMemory => {
    const ensured = ensureProgressiveState(nextMemory);
    return {
      ...ensured,
      detailNarrative: projectNarrativeAnswer(ensured) || ensured.detailNarrative,
      supportingFocus: projectActiveQuestionSummary(ensured) || ensured.supportingFocus,
    };
  };

  const updateSnapshot = useEffectEvent((nextLocation: IntakeMissionFrameLocation) => {
    setSnapshot((current) => synchronizeMissionFrameSnapshot(current, nextLocation));
  });

  const commitLocation = useEffectEvent(
    (
      nextLocation: IntakeMissionFrameLocation,
      nextMemory: IntakeMissionFrameMemory = memory,
      historyMode: "push" | "replace" = "push",
    ) => {
      const owner = safeWindow();
      if (owner) {
        const nextPath = formatPatientIntakeMissionPath(nextLocation);
        if (historyMode === "replace") {
          owner.history.replaceState({}, "", nextPath);
        } else if (owner.location.pathname !== nextPath) {
          owner.history.pushState({}, "", nextPath);
        }
      }
      startTransition(() => {
        setLocation(nextLocation);
        setMemory(nextMemory);
        updateSnapshot(nextLocation);
      });
    },
  );

  const draftSave = useDraftSaveTruth({
    bootstrap: bootstrapRef.current,
    location,
    memory,
  });

  const commitLocalMemory = useEffectEvent(
    (nextMemory: IntakeMissionFrameMemory, intent: "immediate" | "debounced" | "none") => {
      const synced = syncProgressiveFields(nextMemory);
      setMemory(synced);
      if (intent === "none") {
        draftSave.applyLocalOnlyMemory(synced);
        return;
      }
      draftSave.applyLocalChange({
        nextMemory: syncMemoryPresentation(synced, "saving"),
        intent,
      });
      if (synced.phase1Integration?.enabled) {
        void patchIntegratedDraft(synced, location)
          .then((phase1Integration) => {
            if (!phase1Integration) {
              return;
            }
            setMemory((current) =>
              current.draftPublicId === phase1Integration.draftPublicId
                ? {
                    ...current,
                    phase1Integration,
                    draftVersion: phase1Integration.draftVersion,
                  }
                : current,
            );
          })
          .catch(() => {
            setMemory((current) => ({
              ...current,
              phase1Integration: current.phase1Integration
                ? {
                    ...current.phase1Integration,
                    latestDecisionClass: "integration_patch_recovery",
                  }
                : current.phase1Integration,
            }));
          });
      }
    },
  );

  const attachmentLane = usePatientIntakeAttachments({
    memory,
    commitMemory: commitLocalMemory,
  });

  const beginDraft = useEffectEvent(async () => {
    const integratedMemory = await startIntegratedDraft(memory).catch(() => null);
    const nextMemory = integratedMemory ?? memory;
    const draftPublicId = nextMemory.draftPublicId;
    const nextLocation = parsePatientIntakeMissionLocation(
      `/start-request/${draftPublicId}/request-type`,
    );
    commitLocation(nextLocation, {
      ...syncProgressiveFields(nextMemory),
      savePresentation: integratedMemory ? "saved_authoritative" : "draft_not_started",
    });
  });

  const openStep = useEffectEvent((routeKey: IntakeMissionFrameRouteKey) => {
    const targetPath =
      routeKey === "landing"
        ? PATIENT_INTAKE_ENTRY_ALIAS
        : `/start-request/${memory.draftPublicId}/${
            routeStepDescriptors
              .find((step) => step.routeKey === routeKey)
              ?.implementedPathPattern.split("/")
              .pop() ?? "request-type"
          }`;
    commitLocation(parsePatientIntakeMissionLocation(targetPath));
  });

  const goBack = useEffectEvent(() => {
    switch (location.routeKey) {
      case "request_type":
        commitLocation(parsePatientIntakeMissionLocation(PATIENT_INTAKE_ENTRY_ALIAS));
        return;
      case "details": {
        const currentIndex = flow.activeQuestionFrame.currentIndex;
        if (currentIndex > 0) {
          setValidationIssue(null);
          commitLocation(location, moveDetailsBackward(memory), "replace");
          return;
        }
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/request-type`),
        );
        return;
      }
      case "supporting_files":
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/details`),
        );
        return;
      case "contact_preferences":
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/files`),
        );
        return;
      case "review_submit":
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/contact`),
        );
        return;
      case "resume_recovery":
      case "urgent_outcome":
      case "receipt_outcome":
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/review`),
        );
        return;
      case "request_status":
        commitLocation(
          parsePatientIntakeMissionLocation(
            location.aliasSource === "seq_139_contract"
              ? `/intake/requests/${requestPublicIdForDraft(memory.draftPublicId)}/receipt`
              : `/start-request/${memory.draftPublicId}/receipt`,
          ),
        );
        return;
      default:
        return;
    }
  });

  const continueForward = useEffectEvent(async () => {
    if (location.routeKey === "landing") {
      if (draftSave.continueEntry) {
        const nextBootstrap = readDraftSaveTruthBootstrap(
          draftSave.continueEntry.draftPublicId,
          defaultIntakeMissionFrameMemory(draftSave.continueEntry.draftPublicId),
        );
        commitLocation(
          parsePatientIntakeMissionLocation(draftSave.continueEntry.targetPathname),
          ensureProgressiveState(nextBootstrap.initialMemory),
          "replace",
        );
        return;
      }
      beginDraft();
      return;
    }
    if (location.routeKey === "request_type" && memory.pendingRequestTypeChange) {
      setValidationIssue("Confirm or cancel the request-type change before continuing.");
      return;
    }
    setValidationIssue(null);
    switch (location.routeKey) {
      case "request_type":
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/details`),
          withCompletedStep(memory, "request_type"),
        );
        return;
      case "details": {
        const result = moveDetailsForward(memory);
        if (result.validationIssues.length > 0) {
          setValidationIssue(
            result.validationIssues[0]?.message ?? "Answer the current question to continue.",
          );
          return;
        }
        if (!result.complete) {
          commitLocation(location, result.nextMemory, "replace");
          draftSave.applyLocalOnlyMemory(result.nextMemory);
          return;
        }
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/files`),
          withCompletedStep(result.nextMemory, "details"),
        );
        return;
      }
      case "supporting_files":
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/contact`),
          withCompletedStep(memory, "supporting_files"),
        );
        return;
      case "contact_preferences": {
        const contactSummaryView = buildContactSummaryView({
          preferences: memory.contactPreferences,
          baselinePreferences: memory.contactPreferencesBaseline,
        });
        const validationMessage = primaryContactValidationMessage(contactSummaryView);
        if (validationMessage) {
          setValidationIssue(validationMessage);
          return;
        }
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/review`),
          withCompletedStep(memory, "contact_preferences"),
        );
        return;
      }
      case "review_submit":
        if (isSafetyReviewPending(memory)) {
          const nextMemory = {
            ...memory,
            reviewAffirmed: true,
            deltaNotice: null,
          };
          commitLocation(location, nextMemory, "replace");
          draftSave.applyLocalOnlyMemory(nextMemory);
          return;
        }
        if (memory.phase1Integration?.enabled) {
          const settled = await submitIntegratedJourney(memory, location).catch(() => null);
          if (settled) {
            const nextMemory = withCompletedStep(
              applyIntegratedSubmitResult(memory, settled),
              "review_submit",
            );
            const requestPublicId =
              settled.requestPublicId ?? nextMemory.phase1Integration?.requestPublicId;
            commitLocation(
              parsePatientIntakeMissionLocation(
                settled.outcomeTuple?.outcomeResult === "urgent_diversion"
                  ? `/intake/requests/${requestPublicId ?? requestPublicIdForDraft(nextMemory.draftPublicId)}/urgent-guidance`
                  : `/intake/requests/${requestPublicId ?? requestPublicIdForDraft(nextMemory.draftPublicId)}/receipt`,
              ),
              nextMemory,
              "replace",
            );
            draftSave.applyLocalOnlyMemory(nextMemory);
            return;
          }
        }
        commitLocation(
          parsePatientIntakeMissionLocation(
            hasBoundedUrgentDiversionSignal(memory)
              ? `/start-request/${memory.draftPublicId}/urgent-guidance`
              : `/start-request/${memory.draftPublicId}/receipt`,
          ),
          withCompletedStep(memory, "review_submit"),
        );
        return;
      case "resume_recovery":
        if (memory.bundleCompatibilityMode === "blocked") {
          setValidationIssue("This draft needs approved recovery before it can resume.");
          return;
        }
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/review`),
        );
        return;
      case "receipt_outcome":
        commitLocation(
          parsePatientIntakeMissionLocation(`/start-request/${memory.draftPublicId}/status`),
        );
        return;
      default:
        return;
    }
  });

  const updateRequestType = useEffectEvent((requestType: IntakeRequestTypeCard["requestType"]) => {
    setValidationIssue(null);
    commitLocalMemory(
      selectRequestType(memory, requestType) as IntakeMissionFrameMemory,
      "immediate",
    );
  });

  const updateProgressiveQuestion = useEffectEvent(
    (questionKey: string, value: unknown, intent: "immediate" | "debounced") => {
      setValidationIssue(null);
      commitLocalMemory(
        answerProgressiveQuestion(memory, questionKey, value) as IntakeMissionFrameMemory,
        intent,
      );
    },
  );

  const flushProgressiveQuestion = useEffectEvent(() => {
    setValidationIssue(null);
    draftSave.flushPendingSave();
  });

  const updateContactPreferences = useEffectEvent(
    (nextContactPreferences: DraftContactPreferencesView) => {
      setValidationIssue(null);
      commitLocalMemory(
        {
          ...memory,
          contactPreferences: nextContactPreferences,
        },
        "immediate",
      );
    },
  );

  const setOutcomeSimulation = useEffectEvent(
    (nextOutcomeSimulation: IntakeMissionFrameMemory["outcomeSimulation"]) => {
      const nextMemory = {
        ...memory,
        outcomeSimulation: nextOutcomeSimulation,
      };
      setMemory(nextMemory);
      draftSave.applyLocalOnlyMemory(nextMemory);
    },
  );

  const issueUrgentGuidance = useEffectEvent(() => {
    setOutcomeSimulation(issueUrgentOutcome(memory.outcomeSimulation));
  });

  const setReceiptSimulation = useEffectEvent(
    (nextReceiptSimulation: IntakeMissionFrameMemory["receiptSimulation"]) => {
      const nextMemory = {
        ...memory,
        receiptSimulation: nextReceiptSimulation,
      };
      setMemory(nextMemory);
      draftSave.applyLocalOnlyMemory(nextMemory);
    },
  );

  const advanceReceiptPatch = useEffectEvent(() => {
    setReceiptSimulation(applyInlineReceiptPatch(memory.receiptSimulation));
  });

  const refreshRequestStatus = useEffectEvent(() => {
    const nextState = applyRequestStatusRefreshPatch({
      receiptSimulation: memory.receiptSimulation,
      statusSimulation: memory.requestStatusSimulation,
    });
    const nextMemory = {
      ...memory,
      receiptSimulation: nextState.receiptSimulation,
      requestStatusSimulation: nextState.statusSimulation,
    };
    setMemory(nextMemory);
    draftSave.applyLocalOnlyMemory(nextMemory);
  });

  const openTrackRequest = useEffectEvent(() => {
    commitLocation(
      parsePatientIntakeMissionLocation(
        `/intake/requests/${requestPublicIdForDraft(memory.draftPublicId)}/status`,
      ),
    );
  });

  const openUrgentHelp = useEffectEvent(() => {
    const urgentPath =
      location.aliasSource === "seq_139_contract" && location.requestPublicId
        ? `/intake/requests/${location.requestPublicId}/urgent-guidance`
        : `/start-request/${memory.draftPublicId}/urgent-guidance`;
    commitLocation(parsePatientIntakeMissionLocation(urgentPath));
  });

  const openStatusPath = useEffectEvent((targetPathname: string) => {
    if (!targetPathname) {
      return;
    }
    commitLocation(parsePatientIntakeMissionLocation(targetPathname));
  });

  const registerFocusedField = useEffectEvent((fieldKey: string | null) => {
    draftSave.registerFocusedField(fieldKey);
  });

  const toggleSummaryPeek = useEffectEvent(() => {
    const nextMemory = {
      ...memory,
      summaryPeekOpen: !memory.summaryPeekOpen,
    };
    setMemory(nextMemory);
    draftSave.applyLocalOnlyMemory(nextMemory);
  });

  const toggleQuestionHelp = useEffectEvent((questionKey: string) => {
    const nextMemory = toggleHelperForQuestion(memory, questionKey) as IntakeMissionFrameMemory;
    setMemory(nextMemory);
    draftSave.applyLocalOnlyMemory(nextMemory);
  });

  const setAccessSimulation = useEffectEvent(
    (
      scenarioId: IntakeMissionFrameMemory["accessSimulation"]["scenarioId"],
      historyMode: "push" | "replace" = "replace",
      pathname: string | null = null,
    ) => {
      const nextMemory = {
        ...memory,
        accessSimulation:
          scenarioId === "none" ? createDefaultPatientAccessSimulation() : { scenarioId },
      };
      if (pathname) {
        commitLocation(parsePatientIntakeMissionLocation(pathname), nextMemory, historyMode);
        return;
      }
      setMemory(nextMemory);
      draftSave.applyLocalOnlyMemory(nextMemory);
    },
  );

  const applyAccessAction = useEffectEvent((action: PatientAccessAction | null) => {
    if (!action || !view.accessPosture) {
      return;
    }
    const nextScenarioId =
      action.nextScenarioId ??
      transitionPatientAccessScenario(memory.accessSimulation.scenarioId, action.actionId);
    setAccessSimulation(nextScenarioId, "replace", action.targetPathname);
  });

  const focusAccessPostureSurface = useEffectEvent(() => {
    const owner = safeWindow();
    if (!owner) {
      return;
    }
    const target = owner.document.querySelector<HTMLElement>(
      "[data-testid='patient-intake-access-posture-card']",
    );
    if (!target) {
      return;
    }
    const focusTarget = () => {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "center", inline: "nearest" });
    };
    focusTarget();
    owner.requestAnimationFrame(() => {
      focusTarget();
    });
  });

  const confirmPendingRequestTypeChange = useEffectEvent(() => {
    setValidationIssue(null);
    commitLocalMemory(confirmRequestTypeChange(memory) as IntakeMissionFrameMemory, "immediate");
  });

  const cancelPendingRequestTypeChange = useEffectEvent(() => {
    setValidationIssue(null);
    commitLocalMemory(cancelRequestTypeChange(memory) as IntakeMissionFrameMemory, "immediate");
  });

  const confirmMergeResolution = useEffectEvent(() => {
    const resolution = draftSave.confirmMergeResolution();
    if (!resolution) {
      return;
    }
    const nextLocation = parsePatientIntakeMissionLocation(resolution.pathname);
    if (nextLocation.pathname !== location.pathname) {
      commitLocation(nextLocation, ensureProgressiveState(resolution.memory), "replace");
      return;
    }
    setMemory(ensureProgressiveState(resolution.memory));
  });

  const resolveRecoveryBridge = useEffectEvent(() => {
    const resolution = draftSave.resolveRecoveryBridge();
    if (!resolution) {
      return;
    }
    const nextLocation = parsePatientIntakeMissionLocation(resolution.pathname);
    if (nextLocation.pathname !== location.pathname) {
      commitLocation(nextLocation, ensureProgressiveState(resolution.memory), "replace");
      return;
    }
    setMemory(ensureProgressiveState(resolution.memory));
  });

  const startAgainFromLanding = useEffectEvent(() => {
    const entry = draftSave.continueEntry;
    const owner = safeWindow();
    if (!owner || !entry) {
      beginDraft();
      return;
    }
    owner.localStorage.removeItem(`${AUTOSAVE_RECORD_PREFIX}${entry.draftPublicId}`);
    const index = JSON.parse(owner.localStorage.getItem(AUTOSAVE_INDEX_KEY) ?? "[]") as string[];
    owner.localStorage.setItem(
      AUTOSAVE_INDEX_KEY,
      JSON.stringify(index.filter((draftPublicId) => draftPublicId !== entry.draftPublicId)),
    );
    draftSave.clearSessionState();
    const nextMemory = defaultIntakeMissionFrameMemory();
    commitLocation(
      parsePatientIntakeMissionLocation(PATIENT_INTAKE_ENTRY_ALIAS),
      nextMemory,
      "replace",
    );
  });

  useEffect(() => {
    if (!view.accessPosture?.autoMapTargetPathname) {
      return;
    }
    if (view.accessPosture.autoMapTargetPathname === location.pathname) {
      return;
    }
    const nextMemory = {
      ...memory,
      accessSimulation: { scenarioId: "stale_draft_promoted" as const },
    };
    commitLocation(
      parsePatientIntakeMissionLocation(view.accessPosture.autoMapTargetPathname),
      nextMemory,
      "replace",
    );
  }, [commitLocation, location.pathname, memory, view.accessPosture]);

  useEffect(() => {
    const owner = safeWindow();
    if (!owner) {
      return;
    }
    if (
      owner.location.pathname === "/" ||
      (!isPatientIntakeMissionFramePath(owner.location.pathname) &&
        owner.location.pathname === PATIENT_INTAKE_CONTRACT_ENTRY)
    ) {
      owner.history.replaceState({}, "", PATIENT_INTAKE_ENTRY_ALIAS);
    }
  }, []);

  const handlePopState = useEffectEvent(() => {
    const nextLocation = parsePatientIntakeMissionLocation(
      safeWindow()?.location.pathname ?? PATIENT_INTAKE_ENTRY_ALIAS,
    );
    const nextDraftId = nextLocation.draftPublicId ?? memory.draftPublicId;
    const nextBootstrap = readDraftSaveTruthBootstrap(
      nextDraftId,
      ensureProgressiveState(readMissionFrameMemory(nextDraftId)),
    );
    startTransition(() => {
      setLocation(nextLocation);
      setMemory(ensureProgressiveState(nextBootstrap.initialMemory));
      updateSnapshot(nextLocation);
    });
  });

  useEffect(() => {
    const owner = safeWindow();
    if (!owner) {
      return;
    }
    owner.addEventListener("popstate", handlePopState);
    return () => owner.removeEventListener("popstate", handlePopState);
  }, [handlePopState]);

  useEffect(() => {
    writeMissionFrameMemory(memory);
  }, [memory]);

  useEffect(() => {
    writePersistedContinuitySnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    const owner = safeWindow();
    if (!owner) {
      return;
    }
    owner.document.body.dataset.theme = "light";
    owner.document.body.dataset.motion = "full";
  }, []);

  return {
    draftSave,
    deferredView,
    flow,
    location,
    memory,
    snapshot,
    validationIssue,
    beginDraft,
    goBack,
    continueForward,
    updateRequestType,
    updateProgressiveQuestion,
    flushProgressiveQuestion,
    updateContactPreferences,
    attachmentLane,
    issueUrgentGuidance,
    advanceReceiptPatch,
    refreshRequestStatus,
    openTrackRequest,
    openUrgentHelp,
    openStatusPath,
    registerFocusedField,
    toggleQuestionHelp,
    toggleSummaryPeek,
    confirmPendingRequestTypeChange,
    cancelPendingRequestTypeChange,
    openStep,
    confirmMergeResolution,
    resolveRecoveryBridge,
    startAgainFromLanding,
    applyAccessAction,
    focusAccessPostureSurface,
  };
}

function ProgressStepGlyph({ routeKey }: { routeKey: IntakeMissionFrameRouteKey }) {
  if (routeKey === "landing") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <path d="M22 50V14" />
        <path d="M22 14h24l-5 9 5 9H22" />
      </svg>
    );
  }
  if (routeKey === "request_type") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <circle cx="18" cy="20" r="5" />
        <circle cx="46" cy="18" r="5" />
        <circle cx="46" cy="46" r="5" />
        <path d="M23 20h9c8 0 9-2 14-2" />
        <path d="M23 20h7c9 0 10 26 16 26" />
      </svg>
    );
  }
  if (routeKey === "details") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <path d="m18 46 4-13 23-23 9 9-23 23-13 4Z" />
        <path d="m39 16 9 9" />
      </svg>
    );
  }
  if (routeKey === "supporting_files") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <path d="M20 12h17l9 9v31H20Z" />
        <path d="M37 12v10h9" />
        <path d="M27 34h18" />
        <path d="M27 43h12" />
      </svg>
    );
  }
  if (routeKey === "contact_preferences") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <path d="M16 18h32a6 6 0 0 1 6 6v15a6 6 0 0 1-6 6H29l-12 8v-8h-1a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6Z" />
        <path d="M24 30h16" />
        <path d="M24 38h10" />
      </svg>
    );
  }
  if (routeKey === "review_submit") {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <path d="M24 14h16l3 6h5v34H16V20h5Z" />
        <path d="M25 38l6 6 12-16" />
      </svg>
    );
  }
  return null;
}

function OrbitalNode({
  active,
  complete,
  routeKey,
}: {
  active: boolean;
  complete: boolean;
  routeKey: IntakeMissionFrameRouteKey;
}) {
  return (
    <span
      className="patient-intake-mission-frame__orbital-node"
      data-active={active ? "true" : "false"}
      data-complete={complete ? "true" : "false"}
      aria-hidden="true"
    >
      <ProgressStepGlyph routeKey={routeKey} />
    </span>
  );
}

function ProgressConstellationRail({
  activeRouteKey,
  completedStepKeys,
  onSelectStep,
}: {
  activeRouteKey: IntakeMissionFrameRouteKey;
  completedStepKeys: readonly string[];
  onSelectStep: (routeKey: IntakeMissionFrameRouteKey) => void;
}) {
  const journeySteps = routeStepDescriptors.slice(0, 6);
  const activeIndex = journeySteps.findIndex((step) => step.routeKey === activeRouteKey);
  return (
    <aside
      className="patient-intake-mission-frame__progress-rail"
      aria-label="Request progress"
      data-testid="patient-intake-progress-rail"
    >
      <div className="patient-intake-mission-frame__rail-heading">
        <span>Progress</span>
        <strong>
          {activeIndex >= 0 ? formatStepCount(activeIndex, journeySteps.length) : "Outcome"}
        </strong>
      </div>
      <ol className="patient-intake-mission-frame__rail-list">
        {journeySteps.map((step) => {
          const complete = completedStepKeys.includes(step.stepKey);
          const active = step.routeKey === activeRouteKey;
          const reachable = complete || active || step.routeKey === "request_type";
          return (
            <li key={step.routeKey}>
              <button
                type="button"
                className="patient-intake-mission-frame__rail-button"
                data-active={active ? "true" : "false"}
                disabled={!reachable}
                onClick={() => onSelectStep(step.routeKey)}
                data-testid={`progress-node-${step.routeKey}`}
              >
                <OrbitalNode active={active} complete={complete} routeKey={step.routeKey} />
                <span>{step.railLabel}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function AnchorChipStrip({ chips }: { chips: readonly { label: string; value: string }[] }) {
  return (
    <div
      className="patient-intake-mission-frame__anchor-chip-strip"
      data-testid="patient-intake-anchor-chip-strip"
    >
      {chips.map((chip) => (
        <span key={`${chip.label}:${chip.value}`} className="patient-intake-mission-frame__chip">
          <strong>{chip.label}</strong>
          <span>{chip.value}</span>
        </span>
      ))}
    </div>
  );
}

function SummaryPeekPanel({
  chips,
  provenanceNote,
  visible,
  summaryMode,
  onDismiss,
}: {
  chips: readonly { label: string; value: string }[];
  provenanceNote: string;
  visible: boolean;
  summaryMode: "panel" | "drawer" | "sheet";
  onDismiss: () => void;
}) {
  return (
    <aside
      id="patient-intake-summary-panel"
      className="patient-intake-mission-frame__summary-panel"
      data-summary-mode={summaryMode}
      data-open={visible ? "true" : "false"}
      data-testid="patient-intake-summary-panel"
      aria-label="Request summary"
      tabIndex={-1}
    >
      <div className="patient-intake-mission-frame__summary-head">
        <div>
          <span>Request summary</span>
          <h3>What you have told us</h3>
        </div>
        {summaryMode === "panel" ? null : (
          <button
            type="button"
            className="patient-intake-mission-frame__summary-close"
            onClick={onDismiss}
          >
            Close
          </button>
        )}
      </div>
      <div className="patient-intake-mission-frame__summary-card">
        {chips.map((chip) => (
          <div
            key={`${chip.label}:${chip.value}`}
            className="patient-intake-mission-frame__summary-row"
          >
            <span>{chip.label}</span>
            <strong>{chip.value}</strong>
          </div>
        ))}
      </div>
      <div className="patient-intake-mission-frame__provenance-note">
        <span>History</span>
        <p>{provenanceNote}</p>
      </div>
    </aside>
  );
}

function FooterActionTray({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: {
  primaryLabel: string;
  secondaryLabel: string | null;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <footer
      className="patient-intake-mission-frame__action-tray"
      data-testid="patient-intake-action-tray"
    >
      {secondaryLabel ? (
        <button
          type="button"
          className="patient-intake-mission-frame__secondary-button"
          onClick={onSecondary}
        >
          {secondaryLabel}
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        className="patient-intake-mission-frame__primary-button"
        onClick={onPrimary}
        data-testid="patient-intake-primary-action"
      >
        {primaryLabel}
      </button>
    </footer>
  );
}

function StepCanvas({
  view,
  flow,
  memory,
  validationIssue,
  continueEntry,
  mergePlan,
  recoveryRecord,
  accessPosture,
  onSelectRequestType,
  onConfirmRequestTypeChange,
  onCancelRequestTypeChange,
  onAnswerQuestion,
  onFlushQuestion,
  onFocusField,
  onToggleQuestionHelp,
  onContactPreferencesChange,
  attachmentLane,
  onResolveMergeChoice,
  onConfirmMerge,
  onResolveRecovery,
  onContinueEntry,
  onStartAgain,
  onIssueUrgentGuidance,
  onAdvanceReceiptPatch,
  onOpenTrackRequest,
  onRefreshRequestStatus,
  onOpenStatusPath,
  onReturnToReview,
  onAccessPrimaryAction,
  onAccessSecondaryAction,
}: {
  view: ReturnType<typeof resolveMissionFrameView>;
  flow: ReturnType<typeof buildProgressiveFlowView>;
  memory: IntakeMissionFrameMemory;
  validationIssue: string | null;
  continueEntry: ReturnType<typeof useDraftSaveTruth>["continueEntry"];
  mergePlan: ReturnType<typeof useDraftSaveTruth>["mergePlan"];
  recoveryRecord: ReturnType<typeof useDraftSaveTruth>["recoveryRecord"];
  accessPosture: ReturnType<typeof resolveMissionFrameView>["accessPosture"];
  onSelectRequestType: (requestType: IntakeRequestTypeCard["requestType"]) => void;
  onConfirmRequestTypeChange: () => void;
  onCancelRequestTypeChange: () => void;
  onAnswerQuestion: (
    questionKey: string,
    value: unknown,
    intent: "immediate" | "debounced",
  ) => void;
  onFlushQuestion: () => void;
  onFocusField: (fieldKey: string | null) => void;
  onToggleQuestionHelp: (questionKey: string) => void;
  onContactPreferencesChange: (nextValue: DraftContactPreferencesView) => void;
  attachmentLane: ReturnType<typeof usePatientIntakeAttachments>;
  onResolveMergeChoice: (groupId: string, resolution: "keep_local" | "use_server") => void;
  onConfirmMerge: () => void;
  onResolveRecovery: () => void;
  onContinueEntry: () => void;
  onStartAgain: () => void;
  onIssueUrgentGuidance: () => void;
  onAdvanceReceiptPatch: () => void;
  onOpenTrackRequest: () => void;
  onRefreshRequestStatus: () => void;
  onOpenStatusPath: (targetPathname: string) => void;
  onReturnToReview: () => void;
  onAccessPrimaryAction: () => void;
  onAccessSecondaryAction: (() => void) | null;
}) {
  const rootField = flow.activeQuestionFrame.fields[0];
  const revealFields = flow.activeQuestionFrame.fields.slice(1);
  const accessCard = accessPosture ? (
    <AccessPostureCanvas
      posture={accessPosture}
      onPrimaryAction={onAccessPrimaryAction}
      onSecondaryAction={onAccessSecondaryAction}
    />
  ) : null;
  const accessOnly = Boolean(accessPosture) && !accessPosture?.allowUnderlyingSurface;

  return (
    <section
      className="patient-intake-mission-frame__question-canvas"
      data-testid="patient-intake-question-canvas"
    >
      {view.location.routeKey === "landing" ? (
        <>
          <div className="patient-intake-mission-frame__canvas-head">
            <span>{view.routeStep.eyebrow}</span>
            <h2 data-focus-target={routeFocusTarget(view.location.routeKey)} tabIndex={-1}>
              {view.routeStep.title}
            </h2>
            <p>{view.routeStep.helper}</p>
          </div>
          <div
            className="patient-intake-mission-frame__landing"
            data-testid="patient-intake-landing"
          >
            <p className="patient-intake-mission-frame__hero-line">
              One calm thread for your question, your evidence, and the outcome you can safely act
              on.
            </p>
            <ul className="patient-intake-mission-frame__expectation-list">
              <li>One question at a time with a quiet status strip.</li>
              <li>Your answers stay together through urgent advice, receipt, and resume.</li>
              <li>One clear action per step so the next move is easy to find.</li>
            </ul>
          </div>
          {continueEntry ? (
            <ContinueYourRequestCard
              entry={continueEntry}
              onContinue={onContinueEntry}
              onStartAgain={onStartAgain}
            />
          ) : null}
        </>
      ) : null}

      {mergePlan ? (
        <MergeReviewSheet
          mergePlan={mergePlan}
          onChoose={onResolveMergeChoice}
          onConfirm={onConfirmMerge}
        />
      ) : null}

      {accessOnly ? accessCard : null}

      {recoveryRecord && !accessPosture ? (
        <RecoveryBridgePanel recovery={recoveryRecord} onResume={onResolveRecovery} />
      ) : null}

      {!accessOnly && view.location.routeKey === "request_type" ? (
        <>
          <QuestionStemBlock
            eyebrow={view.routeStep.eyebrow}
            title={view.routeStep.title}
            helper={view.routeStep.helper}
            progressLabel="Choose one request type"
            focusTarget="request-type-heading"
          />
          <RequestTypeSignalGrid
            cards={flow.requestTypeCards}
            activeRequestType={memory.requestType}
            pendingChange={memory.pendingRequestTypeChange}
            onSelect={onSelectRequestType}
          />
          <ReviewDeltaNotice
            pendingRequestTypeChange={memory.pendingRequestTypeChange}
            deltaNotice={null}
            onConfirmChange={onConfirmRequestTypeChange}
            onCancelChange={onCancelRequestTypeChange}
          />
          {validationIssue ? (
            <p
              className="patient-intake-mission-frame__validation-note"
              data-testid="patient-intake-request-type-validation"
              role="alert"
              aria-live="polite"
            >
              {validationIssue}
            </p>
          ) : null}
        </>
      ) : null}

      {!accessOnly && view.location.routeKey === "details" && rootField ? (
        <div
          className="patient-intake-mission-frame__details-step"
          data-testid="patient-intake-details-step"
        >
          <QuestionStemBlock
            eyebrow={view.routeStep.eyebrow}
            title={flow.activeQuestionFrame.title}
            helper={flow.activeQuestionFrame.helper}
            progressLabel={formatStepCount(
              flow.activeQuestionFrame.currentIndex,
              flow.activeQuestionFrame.totalGroups,
            )}
            focusTarget="details-heading"
          />
          <ContextChipRow chips={flow.activeQuestionFrame.contextChips} />
          <QuestionFieldRenderer
            field={rootField}
            helperExpanded={memory.helperQuestionKey === rootField.questionKey}
            onToggleHelp={onToggleQuestionHelp}
            onChange={onAnswerQuestion}
            onFocusField={onFocusField}
            onBlurField={onFlushQuestion}
          />
          <RevealPatchRegion
            fields={revealFields}
            helperQuestionKey={memory.helperQuestionKey}
            onToggleHelp={onToggleQuestionHelp}
            onChange={onAnswerQuestion}
            onFocusField={onFocusField}
            onBlurField={onFlushQuestion}
          />
          <ReviewDeltaNotice
            pendingRequestTypeChange={null}
            deltaNotice={flow.deltaNotice}
            onConfirmChange={onConfirmRequestTypeChange}
            onCancelChange={onCancelRequestTypeChange}
          />
          {validationIssue ? (
            <p
              className="patient-intake-mission-frame__validation-note"
              data-testid="patient-intake-local-validation"
              role="alert"
              aria-live="polite"
            >
              {validationIssue}
            </p>
          ) : null}
        </div>
      ) : null}

      {!accessOnly && view.location.routeKey === "supporting_files" ? (
        <div
          className="patient-intake-mission-frame__files-step"
          data-testid="patient-intake-files-step"
        >
          <div className="patient-intake-mission-frame__canvas-head">
            <span>{view.routeStep.eyebrow}</span>
            <h2 data-focus-target={routeFocusTarget(view.location.routeKey)} tabIndex={-1}>
              {view.routeStep.title}
            </h2>
            <p>{view.routeStep.helper}</p>
          </div>
          <AttachmentLaneAnnouncementRegion announcement={attachmentLane.announcement} />
          <EvidenceLaneDropzone
            dragActive={attachmentLane.dragActive}
            supportsCapture={attachmentLane.supportsCapture}
            dropzoneFocusVersion={attachmentLane.dropzoneFocusVersion}
            onFilesSelected={attachmentLane.addFiles}
            onDragActiveChange={attachmentLane.setDragActive}
          />
          <EvidenceCardStack
            attachments={attachmentLane.attachments}
            highlightedAttachmentRef={attachmentLane.highlightedAttachmentRef}
            onClearHighlight={attachmentLane.clearHighlight}
            onRetry={attachmentLane.retryAttachment}
            onRemove={attachmentLane.removeAttachment}
            onReplaceFiles={attachmentLane.replaceFiles}
            onOpenPreview={attachmentLane.openPreview}
          />
          {attachmentLane.previewAttachment ? (
            <GovernedPreviewPanel
              attachment={attachmentLane.previewAttachment}
              onClose={attachmentLane.closePreview}
            />
          ) : null}
        </div>
      ) : null}

      {!accessOnly && view.location.routeKey === "contact_preferences" ? (
        <div
          className="patient-intake-mission-frame__contact-step"
          data-testid="patient-intake-contact-step"
        >
          <div className="patient-intake-mission-frame__canvas-head">
            <span>{view.routeStep.eyebrow}</span>
            <h2 data-focus-target={routeFocusTarget(view.location.routeKey)} tabIndex={-1}>
              {view.routeStep.title}
            </h2>
            <p>{view.routeStep.helper}</p>
          </div>
          <div className="patient-intake-mission-frame__contact-layout">
            <div className="patient-intake-mission-frame__contact-main">
              <ChannelPreferenceStack
                value={memory.contactPreferences}
                onChange={onContactPreferencesChange}
              />
              <RouteEntryPanel
                value={memory.contactPreferences}
                summaryView={view.contactSummaryView}
                validationActive={Boolean(validationIssue)}
                onChange={onContactPreferencesChange}
                onFocusField={onFocusField}
                onBlurField={onFlushQuestion}
              />
              <CommunicationNeedsPanel
                value={memory.contactPreferences}
                summaryView={view.contactSummaryView}
                validationActive={Boolean(validationIssue)}
                onChange={onContactPreferencesChange}
                onFocusField={onFocusField}
                onBlurField={onFlushQuestion}
              />
            </div>
            <div className="patient-intake-mission-frame__contact-side">
              <RouteMaskedSummaryCard summaryView={view.contactSummaryView} />
              <ConfirmationCopyPreview preview={view.contactConfirmationPreview} />
              <TrustBoundaryNote
                summaryView={view.contactSummaryView}
                preview={view.contactConfirmationPreview}
              />
            </div>
          </div>
          {validationIssue ? (
            <p
              className="patient-intake-mission-frame__validation-note"
              data-testid="patient-intake-contact-validation"
              role="alert"
              aria-live="polite"
            >
              {validationIssue}
            </p>
          ) : null}
        </div>
      ) : null}

      {!accessOnly && view.location.routeKey === "review_submit" ? (
        <div
          className="patient-intake-mission-frame__review-step"
          data-testid="patient-intake-review-step"
        >
          <div className="patient-intake-mission-frame__canvas-head">
            <span>{view.routeStep.eyebrow}</span>
            <h2 data-focus-target={routeFocusTarget(view.location.routeKey)} tabIndex={-1}>
              {view.routeStep.title}
            </h2>
            <p>{view.routeStep.helper}</p>
          </div>
          <AnchorChipStrip chips={flow.activeSummaryChips} />
          {!memory.reviewAffirmed ? (
            <ReviewDeltaNotice
              pendingRequestTypeChange={null}
              deltaNotice={memory.deltaNotice}
              onConfirmChange={onConfirmRequestTypeChange}
              onCancelChange={onCancelRequestTypeChange}
            />
          ) : null}
          <div className="patient-intake-mission-frame__review-grid">
            <section className="patient-intake-mission-frame__review-card">
              <strong>What will travel with this request</strong>
              <p>
                {memory.detailNarrative ||
                  "Summary is driven from the active structured answers in this branch."}
              </p>
            </section>
            <section className="patient-intake-mission-frame__review-card patient-intake-mission-frame__review-card--consequence">
              <strong>Submission consequence</strong>
              <p>
                {memory.requestType === "Symptoms"
                  ? "If your answers suggest urgent help, we will show urgent guidance before sending a routine request."
                  : "After you send this request, you will see a receipt and a tracking link."}
              </p>
            </section>
            <section className="patient-intake-mission-frame__review-card">
              <strong>Contact recap</strong>
              <p>
                Preferred contact: {view.contactSummaryView.preferredRouteLabel} at{" "}
                {view.contactSummaryView.preferredDestinationMasked}. This remains a masked
                preference summary, not delivery confirmation.
              </p>
              {view.contactSummaryView.reviewCue ? (
                <p
                  className="patient-intake-mission-frame__contact-review-cue"
                  data-tone={view.contactSummaryView.reviewCueTone}
                >
                  {view.contactSummaryView.reviewCue}
                </p>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}

      {!accessOnly && view.location.routeKey === "resume_recovery" ? (
        <div
          className="patient-intake-mission-frame__outcome-frame"
          data-testid="patient-intake-recovery-step"
        >
          <div className="patient-intake-mission-frame__canvas-head">
            <span>{view.routeStep.eyebrow}</span>
            <h2 data-focus-target={routeFocusTarget(view.location.routeKey)} tabIndex={-1}>
              {view.routeStep.title}
            </h2>
            <p>{view.routeStep.helper}</p>
          </div>
          {view.urgentSurface?.variant === "failed_safe_recovery" ? (
            <FailedSafeSafetyRecoveryCard
              outcome={view.urgentSurface}
              onReturnToReview={onReturnToReview}
            />
          ) : (
            <>
              <BundleCompatibilitySheet sheet={flow.bundleCompatibilitySheet} />
              {recoveryRecord ? null : (
                <div className="patient-intake-mission-frame__helper-card">
                  <strong>Resume details</strong>
                  <p>{view.routeResolution?.targetIntent.replaceAll("_", " ")}</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}

      {!accessOnly && view.location.routeKey === "urgent_outcome" ? (
        <div
          className="patient-intake-mission-frame__outcome-frame patient-intake-mission-frame__outcome-frame--urgent"
          data-testid="patient-intake-urgent-step"
        >
          <div className="patient-intake-mission-frame__canvas-head">
            <span>{view.routeStep.eyebrow}</span>
            <h2 data-focus-target={routeFocusTarget(view.location.routeKey)} tabIndex={-1}>
              {view.routeStep.title}
            </h2>
            <p>{view.routeStep.helper}</p>
          </div>
          {view.urgentSurface ? (
            <UrgentPathwayFrame
              outcome={view.urgentSurface}
              onIssueUrgentOutcome={onIssueUrgentGuidance}
            />
          ) : null}
        </div>
      ) : null}

      {view.location.routeKey === "receipt_outcome" ? (
        <div
          className="patient-intake-mission-frame__outcome-frame patient-intake-mission-frame__outcome-frame--receipt"
          data-testid="patient-intake-receipt-step"
        >
          <div className="patient-intake-mission-frame__canvas-head">
            <span>{view.routeStep.eyebrow}</span>
            <h2 data-focus-target={routeFocusTarget(view.location.routeKey)} tabIndex={-1}>
              {view.routeStep.title}
            </h2>
            <p>{view.routeStep.helper}</p>
          </div>
          {accessPosture?.allowUnderlyingSurface ? accessCard : null}
          {view.receiptSurface ? (
            <ReceiptOutcomeCanvas
              receipt={view.receiptSurface}
              onPatchState={onAdvanceReceiptPatch}
              onOpenTrackRequest={onOpenTrackRequest}
            />
          ) : null}
        </div>
      ) : null}

      {view.location.routeKey === "request_status" ? (
        <div
          className="patient-intake-mission-frame__outcome-frame patient-intake-mission-frame__outcome-frame--status"
          data-testid="patient-intake-status-step"
        >
          <div className="patient-intake-mission-frame__canvas-head">
            <span>{view.routeStep.eyebrow}</span>
            <h2 data-focus-target={routeFocusTarget(view.location.routeKey)} tabIndex={-1}>
              {view.routeStep.title}
            </h2>
            <p>{view.routeStep.helper}</p>
          </div>
          {accessPosture?.allowUnderlyingSurface ? accessCard : null}
          {view.requestStatusSurface ? (
            <RequestStatusCanvas
              status={view.requestStatusSurface}
              onRefreshStatus={onRefreshRequestStatus}
              onOpenPath={onOpenStatusPath}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function PatientIntakeMissionFrameApp(props: PatientIntakeMissionFrameAppProps = {}) {
  const breakpointClass = useBreakpointClass();
  const prefersReducedMotion = useReducedMotionPreference();
  const controller = useMissionFrameController(props);
  const view = controller.deferredView;
  const flow = controller.flow;
  const saveTruth = controller.draftSave.truth;
  const profile = resolvePersistentShellProfile("patient-web", {
    breakpointClass,
    routeFamilyRef: view.location.routeFamilyRef,
  });
  const summaryMode = summaryModeForBreakpoint(breakpointClass);
  const summaryVisible =
    view.accessPosture?.summaryVisibility === "hidden"
      ? false
      : summaryMode === "panel"
        ? true
        : controller.memory.summaryPeekOpen;
  const summaryChips = view.accessPosture?.summaryVisibility === "hidden" ? [] : view.summaryChips;
  const journeyStepCount = 6;
  const currentStepIndex = routeStepDescriptors
    .slice(0, journeyStepCount)
    .findIndex((step) => step.routeKey === view.location.routeKey);
  const footerPrimaryLabel =
    view.location.routeKey === "review_submit" && !controller.memory.reviewAffirmed
      ? "Acknowledge changes"
      : view.location.routeKey === "resume_recovery"
        ? flow.bundleCompatibilitySheet.dominantActionLabel
        : view.routeStep.dominantActionLabel;
  const footerSecondaryLabel =
    view.location.routeKey === "resume_recovery"
      ? flow.bundleCompatibilitySheet.secondaryActionLabel
      : view.routeStep.secondaryActionLabel;
  const suppressFooterTray =
    view.urgentSurface?.variant === "urgent_required_pending" ||
    view.urgentSurface?.variant === "urgent_issued" ||
    view.urgentSurface?.variant === "failed_safe_recovery" ||
    Boolean(view.receiptSurface) ||
    Boolean(view.requestStatusSurface) ||
    Boolean(view.accessPosture?.suppressFooterTray);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    ownerWindow.document.body.dataset.theme = "light";
    ownerWindow.document.body.dataset.reducedMotion = prefersReducedMotion ? "true" : "false";
    ownerWindow.document.body.dataset.motion = prefersReducedMotion ? "reduced" : "full";
  }, [prefersReducedMotion]);

  const restoredPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    if (
      restoredPathnameRef.current !== view.location.pathname &&
      controller.draftSave.savedScrollTop > 0
    ) {
      restoredPathnameRef.current = view.location.pathname;
      ownerWindow.requestAnimationFrame(() => {
        ownerWindow.scrollTo({ top: controller.draftSave.savedScrollTop, behavior: "auto" });
      });
    }
  }, [controller.draftSave.savedScrollTop, view.location.pathname]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const fieldKey = controller.draftSave.focusedFieldKey;
    if (fieldKey) {
      const fieldInput = ownerWindow.document.querySelector<HTMLElement>(
        `[data-focus-field="${fieldKey}"] input, [data-focus-field="${fieldKey}"] textarea, [data-focus-field="${fieldKey}"] button`,
      );
      if (fieldInput) {
        fieldInput.focus({ preventScroll: true });
        return;
      }
    }
    const outcomeFocus = ownerWindow.document.querySelector<HTMLElement>(
      "[data-outcome-autofocus='true']",
    );
    if (outcomeFocus) {
      outcomeFocus.focus({ preventScroll: true });
      return;
    }
    const accessPostureFocus = ownerWindow.document.querySelector<HTMLElement>(
      "[data-access-posture-autofocus='true']",
    );
    if (accessPostureFocus) {
      accessPostureFocus.focus({ preventScroll: true });
      return;
    }
    const focusTarget = routeFocusTarget(view.location.routeKey);
    const element = ownerWindow.document.querySelector<HTMLElement>(
      `[data-focus-target="${focusTarget}"]`,
    );
    element?.focus({ preventScroll: true });
  }, [
    controller.draftSave.focusedFieldKey,
    view.location.routeKey,
    flow.activeQuestionFrame.rootQuestionKey,
    view.urgentSurface?.variant,
  ]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const onFocus = (event: FocusEvent) => {
      if (summaryMode === "panel") {
        return;
      }
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (!target.closest("[data-testid='patient-intake-question-canvas']")) {
        return;
      }
      const focusField =
        target.closest<HTMLElement>("[data-focus-field]")?.dataset.focusField ?? null;
      if (!focusField) {
        return;
      }
      controller.registerFocusedField(focusField);
      ownerWindow.requestAnimationFrame(() => {
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    };
    ownerWindow.document.addEventListener("focusin", onFocus);
    return () => ownerWindow.document.removeEventListener("focusin", onFocus);
  }, [controller, summaryMode]);

  useEffect(() => {
    const ownerWindow = safeWindow();
    if (!ownerWindow) {
      return;
    }
    const onScroll = () => {
      controller.draftSave.registerScrollTop(ownerWindow.scrollY);
    };
    ownerWindow.addEventListener("scroll", onScroll, { passive: true });
    return () => ownerWindow.removeEventListener("scroll", onScroll);
  }, [controller.draftSave]);

  return (
    <main
      className="token-foundation patient-intake-mission-frame"
      data-testid="patient-intake-mission-frame-root"
      data-task-id={PATIENT_INTAKE_MISSION_FRAME_TASK_ID}
      data-visual-mode={PATIENT_INTAKE_MISSION_FRAME_VISUAL_MODE}
      data-route-key={view.location.routeKey}
      data-step-key={view.routeStep.stepKey}
      data-route-family={view.location.routeFamilyRef}
      data-shell-continuity-key={PATIENT_INTAKE_MISSION_FRAME_CONTINUITY_KEY}
      data-selected-anchor={controller.snapshot.selectedAnchor.anchorKey}
      data-shell-posture={shellPostureLabel(view.location.routeKey)}
      data-current-question-key={flow.activeQuestionFrame.rootQuestionKey}
      data-bundle-compatibility-mode={controller.memory.bundleCompatibilityMode}
      data-layout-topology={profile.topology}
      data-breakpoint-class={breakpointClass}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
      data-save-state={saveTruth.state}
      data-phase1-integration={
        controller.memory.phase1Integration?.enabled ? "authoritative" : "local-fallback"
      }
      data-phase1-settlement={controller.memory.phase1Integration?.latestSettlementRef ?? ""}
      data-phase1-notification-posture={
        controller.memory.phase1Integration?.latestNotificationPosture ?? ""
      }
      data-hard-exit-warning={saveTruth.shouldWarnOnHardExit ? "true" : "false"}
      data-suppress-saved-reason={saveTruth.suppressSavedReason ?? ""}
      data-access-posture={view.accessPosture?.postureKind ?? "none"}
      data-access-tone={view.accessPosture?.tone ?? ""}
      style={
        {
          "--mission-frame-max-width": `${missionFrameLayoutContract.canvasMaxWidthPx}px`,
          "--mission-frame-summary-width": `${missionFrameLayoutContract.summaryPanelWidthPx}px`,
          "--mission-frame-rail-width": `${missionFrameLayoutContract.progressRailWidthPx}px`,
          "--mission-frame-tray-height": `${missionFrameLayoutContract.mobileStickyTrayHeightPx}px`,
        } as CSSProperties
      }
    >
      <PatientPortalTopBar current="requests" testId="patient-intake-top-band" />
      <header
        className="patient-intake-mission-frame__masthead"
        data-testid="patient-intake-masthead"
      >
        <div
          className="patient-intake-mission-frame__emergency-copy"
          data-testid="patient-intake-emergency-notice"
        >
          <span>If this is an emergency</span>
          <strong>Call 999 now</strong>
          <p>Use 999 for immediate danger, severe chest pain, or breathing problems.</p>
        </div>
        <button
          type="button"
          className="patient-intake-mission-frame__masthead-control patient-intake-mission-frame__urgent-escape"
          onClick={controller.openUrgentHelp}
          data-testid="patient-intake-urgent-escape"
        >
          {view.urgentEscapeLabel}
        </button>
      </header>

      {view.accessPosture ? (
        // Runtime marker contract: data-testid="access-posture-strip" is owned here via AccessPostureStrip.
        <AccessPostureStrip
          posture={view.accessPosture}
          onAction={controller.focusAccessPostureSurface}
        />
      ) : null}

      <section className="patient-intake-mission-frame__body" data-testid="patient-intake-body">
        <ProgressConstellationRail
          activeRouteKey={view.location.routeKey}
          completedStepKeys={controller.memory.completedStepKeys}
          onSelectStep={controller.openStep}
        />

        <section className="patient-intake-mission-frame__center-column">
          <div
            className="patient-intake-mission-frame__center-meta"
            data-testid="patient-intake-step-header"
          >
            <div className="patient-intake-mission-frame__step-copy">
              <span className="patient-intake-mission-frame__step-eyebrow">Patient request</span>
              <h1
                data-focus-target="landing-heading"
                tabIndex={view.location.routeKey === "landing" ? -1 : undefined}
              >
                Start a request
              </h1>
              <p>Answer a few questions, add files if useful, then review before sending.</p>
            </div>
            <div className="patient-intake-mission-frame__step-status" aria-label="Request status">
              <span className="patient-intake-mission-frame__step-count">
                <span>
                  {currentStepIndex >= 0
                    ? formatStepCount(currentStepIndex, journeyStepCount)
                    : "Outcome"}
                </span>
                <strong>{view.routeStep.railLabel}</strong>
              </span>
              <span
                className="patient-intake-mission-frame__masthead-chip"
                data-tone={saveTruth.stateMarkTone}
              >
                {saveTruth.label}
              </span>
              {summaryMode === "drawer" ? (
                <button
                  type="button"
                  className="patient-intake-mission-frame__masthead-control patient-intake-mission-frame__summary-toggle"
                  onClick={controller.toggleSummaryPeek}
                  aria-controls="patient-intake-summary-panel"
                  aria-expanded={summaryVisible}
                  data-testid="patient-intake-summary-toggle"
                >
                  Request summary
                </button>
              ) : null}
            </div>
          </div>
          <StepCanvas
            view={view}
            flow={flow}
            memory={controller.memory}
            validationIssue={controller.validationIssue}
            continueEntry={controller.draftSave.continueEntry}
            mergePlan={controller.draftSave.mergePlan}
            recoveryRecord={controller.draftSave.recoveryRecord}
            accessPosture={view.accessPosture}
            onSelectRequestType={controller.updateRequestType}
            onConfirmRequestTypeChange={controller.confirmPendingRequestTypeChange}
            onCancelRequestTypeChange={controller.cancelPendingRequestTypeChange}
            onAnswerQuestion={controller.updateProgressiveQuestion}
            onFlushQuestion={controller.flushProgressiveQuestion}
            onFocusField={controller.registerFocusedField}
            onToggleQuestionHelp={controller.toggleQuestionHelp}
            onContactPreferencesChange={controller.updateContactPreferences}
            attachmentLane={controller.attachmentLane}
            onResolveMergeChoice={controller.draftSave.resolveMergeChoice}
            onConfirmMerge={controller.confirmMergeResolution}
            onResolveRecovery={controller.resolveRecoveryBridge}
            onContinueEntry={controller.continueForward}
            onStartAgain={controller.startAgainFromLanding}
            onIssueUrgentGuidance={controller.issueUrgentGuidance}
            onAdvanceReceiptPatch={controller.advanceReceiptPatch}
            onOpenTrackRequest={controller.openTrackRequest}
            onRefreshRequestStatus={controller.refreshRequestStatus}
            onOpenStatusPath={controller.openStatusPath}
            onReturnToReview={controller.goBack}
            onAccessPrimaryAction={() =>
              controller.applyAccessAction(view.accessPosture?.primaryAction ?? null)
            }
            onAccessSecondaryAction={
              view.accessPosture?.secondaryAction
                ? () => controller.applyAccessAction(view.accessPosture?.secondaryAction ?? null)
                : null
            }
          />
        </section>

        <SummaryPeekPanel
          chips={summaryChips}
          provenanceNote={
            view.accessPosture
              ? `${view.provenanceNote} ${view.accessPosture.maskedSummaryLabel}`
              : view.provenanceNote
          }
          visible={summaryVisible}
          summaryMode={summaryMode}
          onDismiss={controller.toggleSummaryPeek}
        />
      </section>

      {suppressFooterTray ? null : (
        <FooterActionTray
          primaryLabel={footerPrimaryLabel}
          secondaryLabel={footerSecondaryLabel}
          onPrimary={controller.continueForward}
          onSecondary={
            view.location.routeKey === "landing" ? controller.openUrgentHelp : controller.goBack
          }
        />
      )}
    </main>
  );
}

export default PatientIntakeMissionFrameApp;

export {
  isPatientIntakeMissionFramePath,
  PATIENT_INTAKE_ENTRY_ALIAS,
  PATIENT_INTAKE_CONTRACT_ENTRY,
};
