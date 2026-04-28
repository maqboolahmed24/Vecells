import archiveManifestArtifact from "../../../data/archive/488_launch_evidence_archive_manifest.json";
import retentionMatrixArtifact from "../../../data/archive/488_retention_and_legal_hold_matrix.json";
import lessonsArtifact from "../../../data/archive/488_lessons_learned_register.json";
import capaArtifact from "../../../data/archive/488_capa_and_continuous_improvement_actions.json";
import exportPostureArtifact from "../../../data/archive/488_evidence_export_posture.json";

export const EVIDENCE_VAULT_488_PATH = "/ops/governance/evidence-vault";
export const EVIDENCE_VAULT_488_TASK_ID = "seq_488";
export const EVIDENCE_VAULT_488_VISUAL_MODE = "Evidence_Vault_488";

export type EvidenceVault488ScenarioState =
  | "sealed"
  | "sealed_with_exceptions"
  | "blocked"
  | "quarantined";
export type EvidenceVault488Role = "governance_admin" | "records_manager" | "viewer";

export interface EvidenceVault488Card {
  readonly itemId: string;
  readonly family: string;
  readonly title: string;
  readonly sourceTuple: string;
  readonly retentionClass: string;
  readonly sealState: "sealed" | "blocked" | "quarantined";
  readonly confidentiality: string;
  readonly exportEligibility: string;
  readonly evidenceHashPrefix: string;
  readonly blockerRefs: readonly string[];
}

export interface EvidenceVault488Shelf {
  readonly family: string;
  readonly cards: readonly EvidenceVault488Card[];
}

export interface EvidenceVault488Projection {
  readonly taskId: typeof EVIDENCE_VAULT_488_TASK_ID;
  readonly visualMode: typeof EVIDENCE_VAULT_488_VISUAL_MODE;
  readonly scenarioState: EvidenceVault488ScenarioState;
  readonly role: EvidenceVault488Role;
  readonly archiveVerdict: "sealed" | "sealed_with_exceptions" | "blocked";
  readonly wormSealDigest: string;
  readonly retentionPolicyVersion: string;
  readonly legalHoldCount: number;
  readonly exportPosture: "permitted" | "permitted_with_redaction" | "blocked" | "quarantined";
  readonly exportActionState: "enabled" | "disabled_role" | "disabled_posture";
  readonly shelves: readonly EvidenceVault488Shelf[];
  readonly cards: readonly EvidenceVault488Card[];
  readonly selectedCard: EvidenceVault488Card;
  readonly retentionRows: readonly {
    readonly itemRef: string;
    readonly retentionClass: string;
    readonly legalHoldState: string;
    readonly deletionPermitted: boolean;
    readonly protectionState: string;
  }[];
  readonly capaRows: readonly {
    readonly capaActionId: string;
    readonly owner: string;
    readonly dueDate: string;
    readonly severity: string;
    readonly state: string;
  }[];
  readonly rightRail: {
    readonly lessons: readonly string[];
    readonly legalHolds: readonly string[];
    readonly quarantinedArtifacts: readonly string[];
    readonly accessGrantState: string;
  };
}

type ManifestEnvelope = {
  readonly activeManifest: {
    readonly archiveVerdict: "sealed" | "sealed_with_exceptions" | "blocked";
    readonly wormSealDigest: string;
    readonly retentionPolicyVersion: string;
    readonly legalHoldCount: number;
    readonly quarantinedArtifactRefs: readonly string[];
  };
  readonly archivedEvidenceItems: readonly {
    readonly archivedEvidenceItemId: string;
    readonly family: string;
    readonly title: string;
    readonly sourceTupleRef: string | null;
    readonly retentionClass: string;
    readonly sealState: "sealed" | "blocked" | "quarantined";
    readonly confidentialityClass: string;
    readonly exportEligibility: string;
    readonly evidenceHash: string;
    readonly blockerRefs: readonly string[];
  }[];
};

const manifestEnvelope = archiveManifestArtifact as unknown as ManifestEnvelope;
const retentionMatrix = retentionMatrixArtifact as any;
const lessons = lessonsArtifact as any;
const capa = capaArtifact as any;
const exportPosture = exportPostureArtifact as any;

export function isEvidenceVault488Path(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === EVIDENCE_VAULT_488_PATH;
}

export function normalizeEvidenceVault488ScenarioState(
  value: string | null | undefined,
): EvidenceVault488ScenarioState {
  if (
    value === "sealed" ||
    value === "sealed_with_exceptions" ||
    value === "blocked" ||
    value === "quarantined"
  ) {
    return value;
  }
  return "sealed_with_exceptions";
}

export function normalizeEvidenceVault488Role(value: string | null | undefined): EvidenceVault488Role {
  if (value === "governance_admin" || value === "records_manager" || value === "viewer") {
    return value;
  }
  return "governance_admin";
}

function cardFromItem(
  item: ManifestEnvelope["archivedEvidenceItems"][number],
  scenarioState: EvidenceVault488ScenarioState,
): EvidenceVault488Card {
  const blocked = scenarioState === "blocked" && ["Signoff", "Waves"].includes(item.family);
  const quarantined = scenarioState === "quarantined" && item.family === "Tests";
  return {
    itemId: item.archivedEvidenceItemId,
    family: item.family,
    title: item.title,
    sourceTuple: blocked ? "Missing source tuple" : item.sourceTupleRef ?? "Missing source tuple",
    retentionClass: item.retentionClass,
    sealState: blocked ? "blocked" : quarantined ? "quarantined" : item.sealState,
    confidentiality: item.confidentialityClass,
    exportEligibility: blocked ? "blocked" : quarantined ? "quarantined" : item.exportEligibility,
    evidenceHashPrefix: item.evidenceHash.slice(0, 12),
    blockerRefs: blocked
      ? ["blocker:488:evidence-source-tuple-missing"]
      : quarantined
        ? ["exception:488:trace-artifact-quarantined-for-redaction"]
        : item.blockerRefs,
  };
}

function shelvesFromCards(cards: readonly EvidenceVault488Card[]): readonly EvidenceVault488Shelf[] {
  const families = [...new Set(cards.map((card) => card.family))];
  return families.map((family) => ({
    family,
    cards: cards.filter((card) => card.family === family),
  }));
}

function scenarioVerdict(
  scenarioState: EvidenceVault488ScenarioState,
): EvidenceVault488Projection["archiveVerdict"] {
  if (scenarioState === "blocked") return "blocked";
  if (scenarioState === "sealed") return "sealed";
  return "sealed_with_exceptions";
}

function scenarioExportPosture(
  scenarioState: EvidenceVault488ScenarioState,
): EvidenceVault488Projection["exportPosture"] {
  if (scenarioState === "blocked") return "blocked";
  if (scenarioState === "quarantined") return "quarantined";
  return exportPosture.evidenceExportPosture.exportState;
}

function exportActionState(
  role: EvidenceVault488Role,
  posture: EvidenceVault488Projection["exportPosture"],
): EvidenceVault488Projection["exportActionState"] {
  if (role === "viewer") return "disabled_role";
  if (posture === "blocked" || posture === "quarantined") return "disabled_posture";
  return "enabled";
}

export function createEvidenceVault488Projection(
  scenarioState = normalizeEvidenceVault488ScenarioState(
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("vaultState"),
  ),
  role = normalizeEvidenceVault488Role(
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("vaultRole"),
  ),
): EvidenceVault488Projection {
  const cards = manifestEnvelope.archivedEvidenceItems.map((item) => cardFromItem(item, scenarioState));
  const posture = scenarioExportPosture(scenarioState);
  const selectedCard = cards[0] ?? {
    itemId: "evidence-vault-488-empty",
    family: "Archive",
    title: "No archive item available",
    sourceTuple: "missing-source-tuple",
    retentionClass: "launch_assurance_8y",
    sealState: "blocked" as const,
    confidentiality: "internal",
    exportEligibility: "blocked",
    evidenceHashPrefix: "unavailable",
    blockerRefs: ["blocker:488:no-archived-evidence-items"],
  };
  return {
    taskId: EVIDENCE_VAULT_488_TASK_ID,
    visualMode: EVIDENCE_VAULT_488_VISUAL_MODE,
    scenarioState,
    role,
    archiveVerdict: scenarioVerdict(scenarioState),
    wormSealDigest: manifestEnvelope.activeManifest.wormSealDigest,
    retentionPolicyVersion: manifestEnvelope.activeManifest.retentionPolicyVersion,
    legalHoldCount:
      scenarioState === "blocked"
        ? manifestEnvelope.activeManifest.legalHoldCount + 1
        : manifestEnvelope.activeManifest.legalHoldCount,
    exportPosture: posture,
    exportActionState: exportActionState(role, posture),
    shelves: shelvesFromCards(cards),
    cards,
    selectedCard,
    retentionRows: retentionMatrix.legalHoldBindings.map((binding: any) => {
      const deletion = retentionMatrix.deletionProtectionVerdicts.find(
        (verdict: any) => verdict.archivedEvidenceItemRef === binding.archivedEvidenceItemRef,
      );
      const classification = retentionMatrix.retentionClassifications.find(
        (row: any) => row.archivedEvidenceItemRef === binding.archivedEvidenceItemRef,
      );
      return {
        itemRef: binding.archivedEvidenceItemRef,
        retentionClass: classification?.retentionClass ?? "launch_assurance_8y",
        legalHoldState: scenarioState === "blocked" && binding.legalHoldState !== "none" ? "conflict" : binding.legalHoldState,
        deletionPermitted: false,
        protectionState: deletion?.verdictState ?? "protected",
      };
    }),
    capaRows: capa.capaActions,
    rightRail: {
      lessons: lessons.lessonsLearnedRegister.lessons.map((lesson: any) => lesson.title),
      legalHolds: retentionMatrix.legalHoldBindings
        .filter((binding: any) => binding.legalHoldState !== "none")
        .map((binding: any) => binding.legalHoldBindingId),
      quarantinedArtifacts:
        scenarioState === "quarantined"
          ? cards.filter((card) => card.exportEligibility === "quarantined").map((card) => card.title)
          : manifestEnvelope.activeManifest.quarantinedArtifactRefs,
      accessGrantState: role === "viewer" ? "denied" : exportPosture.archiveAccessGrant.grantState,
    },
  };
}
