import { describe, expect, it } from "vitest";
import {
  SURFACE_POSTURES_TASK_ID,
  SURFACE_POSTURES_VISUAL_MODE,
  bootstrapSharedPackage,
  packageContract,
  surfacePostureAliasMappings,
  surfacePostureCatalog,
  surfacePostureContractFamilies,
  surfacePostureGapResolutions,
  surfacePostureObjectFamilies,
  surfacePostureSpecimens,
} from "../src/index";

describe("public package surface", () => {
  it("boots through documented public contracts", () => {
    expect(packageContract.packageName).toBe("@vecells/surface-postures");
    expect(bootstrapSharedPackage().contractFamilies).toBe(surfacePostureContractFamilies.length);
    expect(bootstrapSharedPackage().objectFamilies).toBe(surfacePostureObjectFamilies.length);
  });

  it("publishes the par_110 catalog summary", () => {
    expect(SURFACE_POSTURES_TASK_ID).toBe("par_110");
    expect(SURFACE_POSTURES_VISUAL_MODE).toBe("Posture_Gallery");
    expect(surfacePostureCatalog.postureCount).toBe(10);
    expect(surfacePostureCatalog.specimenCount).toBe(10);
    expect(surfacePostureCatalog.audienceCount).toBe(6);
    expect(surfacePostureGapResolutions).toHaveLength(2);
    expect(surfacePostureAliasMappings).toHaveLength(5);
    expect(surfacePostureSpecimens[0]?.postureClass).toBe("loading_summary");
  });
});
