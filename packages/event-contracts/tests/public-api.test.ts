import { describe, expect, it } from "vitest";
import {
  bootstrapSharedPackage,
  canonicalEventContracts,
  canonicalEventNamespaces,
  packageContract,
  schemaArtifactCatalog,
} from "../src/index.ts";
import { foundationKernelFamilies } from "@vecells/domain-kernel";

describe("event-contracts public package surface", () => {
  it("publishes the seq_048 event registry through documented public exports", () => {
    expect(packageContract.packageName).toBe("@vecells/event-contracts");
    expect(bootstrapSharedPackage().eventFamilies).toBe(canonicalEventContracts.length);
    expect(canonicalEventContracts.length).toBeGreaterThan(100);
    expect(canonicalEventNamespaces.length).toBe(22);
    expect(schemaArtifactCatalog.activeSchemaArtifactCount).toBe(canonicalEventContracts.length);
    expect(Array.isArray(foundationKernelFamilies)).toBe(true);
  });
});
