import { describe, expect, it } from "vitest";
import {
  bootstrapSharedPackage,
  ownedContractFamilies,
  ownedObjectFamilies,
  packageContract,
} from "../src/index.ts";

describe("public package surface", () => {
  it("boots through documented public contracts", () => {
    expect(packageContract.packageName).toBe("@vecells/domain-kernel");
    expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
    expect(Array.isArray(ownedObjectFamilies)).toBe(true);
    expect(Array.isArray(ownedContractFamilies)).toBe(true);
  });
});
