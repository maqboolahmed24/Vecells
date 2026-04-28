import directoryFixtures from "../../data/fixtures/348_directory_source_examples.json";
import {
  createPhase6PharmacyDirectoryChoiceEngineService,
  createPhase6PharmacyDirectoryChoiceStore,
  createStaticPharmacyDiscoveryAdapter,
  type Phase6PharmacyDirectoryChoiceEngineService,
  type Phase6PharmacyDirectoryChoiceStore,
  type PharmacyChoiceAudience,
  type PharmacyDiscoveryAdapterProviderCandidate,
  type PharmacyLocationInput,
} from "../../packages/domains/pharmacy/src/index.ts";
import {
  create347EligibilityService,
  evaluateSeededCase,
  positivePathwayEvidence,
  seed347Fixtures,
} from "./347_rule_pack.helpers.ts";

type ScenarioKey = "baseScenario" | "providerDriftScenario";

interface AdapterFixture {
  version: string;
  sourceLabel: string;
  sourceTrustClass:
    | "authoritative"
    | "strategic"
    | "legacy"
    | "manual_override";
  capturedAt: string;
  providers: PharmacyDiscoveryAdapterProviderCandidate[];
}

type DirectoryFixtureShape = {
  generatedAt: string;
  baseLocation: PharmacyLocationInput;
  baseScenario: Record<string, AdapterFixture>;
  providerDriftScenario: Record<string, AdapterFixture>;
};

const fixtures = directoryFixtures as DirectoryFixtureShape;

export function build348Adapters(scenario: ScenarioKey) {
  return Object.entries(fixtures[scenario]).map(([mode, fixture]) =>
    createStaticPharmacyDiscoveryAdapter({
      mode: mode as
        | "dohs_service_search"
        | "eps_dos_legacy"
        | "local_registry_override"
        | "manual_directory_snapshot",
      version: fixture.version,
      sourceLabel: fixture.sourceLabel,
      sourceTrustClass: fixture.sourceTrustClass,
      capturedAt: fixture.capturedAt,
      providers: fixture.providers,
    }),
  );
}

export function create348DirectoryHarness(scenario: ScenarioKey = "baseScenario") {
  const {
    service: eligibilityService,
    repositories: eligibilityRepositories,
    caseKernelService,
    caseRepositories,
  } = create347EligibilityService();
  const repositories = createPhase6PharmacyDirectoryChoiceStore();
  const directoryService = createPhase6PharmacyDirectoryChoiceEngineService({
    repositories,
    caseKernelService,
    eligibilityRepositories,
    adapters: build348Adapters(scenario),
  });
  return {
    eligibilityService,
    eligibilityRepositories,
    caseKernelService,
    caseRepositories,
    repositories,
    directoryService,
    location: fixtures.baseLocation,
  };
}

export function reconfigure348DirectoryService(input: {
  directoryService: Phase6PharmacyDirectoryChoiceEngineService;
  scenario: ScenarioKey;
}): Phase6PharmacyDirectoryChoiceEngineService {
  const mutableAdapters = input.directoryService.adapters as Map<
    "dohs_service_search" | "eps_dos_legacy" | "local_registry_override" | "manual_directory_snapshot",
    ReturnType<typeof build348Adapters>[number]
  >;
  mutableAdapters.clear();
  for (const adapter of build348Adapters(input.scenario)) {
    mutableAdapters.set(adapter.mode, adapter);
  }
  return input.directoryService;
}

export async function seed348EligibleCase(
  harness: ReturnType<typeof create348DirectoryHarness>,
  seed = "348",
) {
  const rulePackId = await seed347Fixtures(harness.eligibilityService);
  const evaluated = await evaluateSeededCase(harness.eligibilityService, {
    seed,
    rulePackId,
    evidence: positivePathwayEvidence("acute_sore_throat_5_plus"),
  });
  return {
    rulePackId,
    evaluated,
  };
}

export async function discover348ChoiceBundle(input: {
  harness: ReturnType<typeof create348DirectoryHarness>;
  pharmacyCaseId: string;
  audience?: PharmacyChoiceAudience;
  evaluatedAt?: string;
  refreshMode?: "if_current" | "if_stale" | "force_refresh";
}) {
  return input.harness.directoryService.discoverProvidersForCase({
    pharmacyCaseId: input.pharmacyCaseId,
    location: fixtures.baseLocation,
    audience: input.audience ?? "patient",
    refreshMode: input.refreshMode ?? "force_refresh",
    evaluatedAt: input.evaluatedAt ?? fixtures.generatedAt,
  });
}
