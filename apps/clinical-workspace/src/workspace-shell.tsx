export {
  ActiveTaskShell,
  CasePulseBand,
  ConsequenceStack,
  DecisionDock,
  DeltaStack,
  EvidenceStack,
  PromotedSupportRegion,
  ReferenceStack,
  SummaryStack,
  TaskCanvas,
  TaskStatusStrip,
} from "./workspace-active-task-shell";
export {
  StaffShellSeedApp,
  WorkspaceHeaderBand,
  WorkspaceHome,
  WorkspaceNavRail,
  WorkspaceRouteFamilyController,
  WorkspaceShell,
  WorkspaceStatusStrip,
} from "./staff-shell-seed";
export {
  QueueAnchorStub,
  QueueChangeBatchBanner,
  QueuePreviewPocket,
  QueueRow,
  QueueScanManager,
  QueueToolbar,
  QueueWorkboardFrame,
} from "./workspace-queue-workboard";
export {
  BufferedQueueChangeTray,
  CompletionContinuityStage,
  DepartureReturnStub,
  NextTaskPostureCard,
  ProtectedCompositionRecovery,
  WorkspaceProtectionStrip,
} from "./workspace-focus-continuity";
export {
  CallbackAttemptTimeline,
  CallbackDetailSurface,
  CallbackExpectationCard,
  CallbackOutcomeCapture,
  CallbackRouteRepairPrompt,
  CallbackWorklistRoute,
} from "./workspace-callback-workbench";

export function isWorkspaceShellPath(pathname: string): boolean {
  return pathname === "/workspace" || pathname.startsWith("/workspace/");
}
