import { describe, expect, it } from "vitest";
import {
  bootstrapSharedPackage,
  ownedContractFamilies,
  ownedObjectFamilies,
  packageContract,
} from "../src/index.ts";
import { foundationKernelFamilies } from "@vecells/domain-kernel";

describe("public package surface", () => {
  it("boots through documented public contracts", () => {
    expect(packageContract.packageName).toBe("@vecells/observability");
    expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
    expect(Array.isArray(ownedObjectFamilies)).toBe(true);
    expect(Array.isArray(ownedContractFamilies)).toBe(true);
    expect(Array.isArray(foundationKernelFamilies)).toBe(true);
  });
});
