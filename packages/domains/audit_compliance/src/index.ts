export interface OwnedObjectFamily {
  canonicalName: string;
  objectKind: string;
  boundedContext: string;
  authoritativeOwner: string;
  sourceRef: string;
}

export interface PackageContract {
  artifactId: string;
  packageName: string;
  packageRole: string;
  ownerContextCode: string;
  ownerContextLabel: string;
  purpose: string;
  versioningPosture: string;
  allowedDependencies: readonly string[];
  forbiddenDependencies: readonly string[];
  dependencyContractRefs: readonly string[];
  objectFamilyCount: number;
  contractFamilyCount: number;
  sourceContexts: readonly string[];
}

export const packageContract = {
  artifactId: "package_domains_audit_compliance",
  packageName: "@vecells/domain-audit-compliance",
  packageRole: "domain",
  ownerContextCode: "audit_compliance",
  ownerContextLabel: "Audit Compliance",
  purpose: "Canonical package home for the Audit Compliance bounded context.",
  versioningPosture:
    "Workspace-private domain boundary. Public exports are explicit and additive-first.",
  allowedDependencies: [
    "packages/domain-kernel",
    "packages/event-contracts",
    "packages/authz-policy",
    "packages/observability",
  ],
  forbiddenDependencies: [
    "packages/domains/* sibling internals",
    "apps/*",
    "services/*",
    "packages/design-system",
  ],
  dependencyContractRefs: [
    "CBC_041_DOMAIN_PACKAGES_TO_DOMAIN_KERNEL",
    "CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS",
    "CBC_041_DOMAIN_PACKAGES_TO_POLICY_AND_OBSERVABILITY",
  ],
  objectFamilyCount: 6,
  contractFamilyCount: 0,
  sourceContexts: ["assurance_and_governance"],
} as const satisfies PackageContract;

export const domainModule = {
  artifactId: packageContract.artifactId,
  packageName: packageContract.packageName,
  ownerContext: packageContract.ownerContextCode,
  posture: "baseline_required",
  note: packageContract.purpose,
} as const;

export const ownedObjectFamilies = [
  {
    canonicalName: "AccessEventIndex",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / AccessEventIndex",
  },
  {
    canonicalName: "ArchiveManifest",
    objectKind: "manifest",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9E. Records lifecycle, retention, legal hold, and deletion engine / Backend work / ArchiveManifest",
  },
  {
    canonicalName: "AttestationRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts / Backend work / AttestationRecord",
  },
  {
    canonicalName: "AuditQuerySession",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / AuditQuerySession",
  },
  {
    canonicalName: "BreachRiskRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9B. Live operational projections, service levels, and breach-risk engine / Backend work / BreachRiskRecord",
  },
  {
    canonicalName: "BreakGlassReviewRecord",
    objectKind: "record",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / BreakGlassReviewRecord",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const aggregateFamilies = [
  {
    canonicalName: "AuditQuerySession",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / AuditQuerySession",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const domainServiceFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const eventFamilies = [
  {
    canonicalName: "AccessEventIndex",
    objectKind: "other",
    boundedContext: "assurance_and_governance",
    authoritativeOwner: "Assurance and governance spine",
    sourceRef:
      "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay / Backend work / AccessEventIndex",
  },
] as const satisfies readonly OwnedObjectFamily[];

export const policyFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export const projectionFamilies = [] as const satisfies readonly OwnedObjectFamily[];

export function bootstrapDomainModule() {
  return {
    packageName: packageContract.packageName,
    objectFamilies: ownedObjectFamilies.length,
    aggregateFamilies: aggregateFamilies.length,
    domainServiceFamilies: domainServiceFamilies.length,
    eventFamilies: eventFamilies.length,
    policyFamilies: policyFamilies.length,
    projectionFamilies: projectionFamilies.length,
  };
}
