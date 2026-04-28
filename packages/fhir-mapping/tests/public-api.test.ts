import { describe, expect, it } from "vitest";
import {
  blockedFhirLifecycleOwners,
  bootstrapSharedPackage,
  fhirExchangeBundlePolicies,
  fhirRepresentationContracts,
  foundationFhirMappings,
  packageContract,
} from "../src/index.ts";
import { foundationKernelFamilies } from "@vecells/domain-kernel";
import { publishedEventFamilies } from "@vecells/event-contracts";

describe("FHIR mapping public package surface", () => {
  it("publishes the seq_049 FHIR authority through documented exports", () => {
    expect(packageContract.packageName).toBe("@vecells/fhir-mapping");
    expect(bootstrapSharedPackage().representationContracts).toBe(
      fhirRepresentationContracts.length,
    );
    expect(fhirRepresentationContracts.length).toBeGreaterThanOrEqual(10);
    expect(fhirExchangeBundlePolicies.length).toBeGreaterThanOrEqual(6);
    expect(blockedFhirLifecycleOwners.length).toBeGreaterThanOrEqual(8);
    expect(foundationFhirMappings.request_task).toBe("Task");
    expect(Array.isArray(foundationKernelFamilies)).toBe(true);
    expect(Array.isArray(publishedEventFamilies)).toBe(true);
  });
});
