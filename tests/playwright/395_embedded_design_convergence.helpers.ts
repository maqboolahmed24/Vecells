import {
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  openEmbeddedA11yRoute,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
} from "./394_embedded_accessibility.helpers.ts";
import {
  EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE,
  embeddedDesignRouteFamilies,
  resolveEmbeddedDesignRouteProfile,
  type EmbeddedDesignRouteFamily,
} from "../../apps/patient-web/src/embedded-design-convergence.model.ts";

export {
  assertCondition,
  importPlaywright,
  outputPath,
  startPatientWeb,
  stopPatientWeb,
  writeAriaSnapshot,
};

export const embeddedConvergenceRouteFamilies = embeddedDesignRouteFamilies;

export async function openEmbeddedDesignRoute(
  page: any,
  baseUrl: string,
  routeFamily: EmbeddedDesignRouteFamily,
): Promise<void> {
  await openEmbeddedA11yRoute(page, baseUrl, routeFamily);
  const url = new URL(page.url());
  url.searchParams.set("diagnostics", "embedded-design");
  await page.goto(url.toString(), { waitUntil: "load" });
  const profile = resolveEmbeddedDesignRouteProfile(routeFamily);
  await page.getByTestId("EmbeddedDesignBundleProvider").waitFor();
  await page.waitForFunction(
    ({ expectedRouteFamily, visualMode, rootTestId }) => {
      const provider = document.querySelector("[data-testid='EmbeddedDesignBundleProvider']");
      return (
        provider?.getAttribute("data-route-family") === expectedRouteFamily &&
        provider?.getAttribute("data-root-testid") === rootTestId &&
        provider?.getAttribute("data-visual-mode") === visualMode
      );
    },
    {
      expectedRouteFamily: routeFamily,
      rootTestId: profile.rootTestId,
      visualMode: EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE,
    },
  );
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-testid='EmbeddedDesignConvergenceLinter']")
        ?.getAttribute("data-linter-state") === "pass",
  );
}

export async function runEmbeddedDesignConvergenceAssertions(page: any, label: string): Promise<void> {
  const provider = page.getByTestId("EmbeddedDesignBundleProvider");
  assertCondition((await provider.count()) === 1, `${label} missing design provider`);
  assertCondition(
    (await provider.getAttribute("data-visual-mode")) === EMBEDDED_DESIGN_CONVERGENCE_VISUAL_MODE,
    `${label} design visual mode missing`,
  );
  const routeFamily = (await provider.getAttribute("data-route-family")) as EmbeddedDesignRouteFamily;
  const profile = resolveEmbeddedDesignRouteProfile(routeFamily);
  assertCondition((await page.locator("main").count()) === 1, `${label} should keep one route-owned main`);
  assertCondition(
    (await page.getByTestId("EmbeddedDesignConvergenceLinter").getAttribute("data-linter-state")) === "pass",
    `${label} design linter failed`,
  );
  assertCondition(
    (await page.getByTestId("EmbeddedBundleAuditPanel").getAttribute("data-design-contract-state")) === "published",
    `${label} audit panel not published`,
  );
  assertCondition(
    (await page.getByTestId("EmbeddedStateCopyRegistry").getAttribute("data-primary-state-label")) ===
      profile.primaryStateLabel,
    `${label} state label drift`,
  );
  assertCondition(
    (await page.getByTestId("EmbeddedAutomationAnchorRegistry").getAttribute("data-root-testid")) ===
      profile.rootTestId,
    `${label} automation root drift`,
  );
  assertCondition(
    (await page.getByTestId("EmbeddedSemanticGrammarRegistry").getAttribute("data-archetype")) ===
      profile.archetype,
    `${label} semantic archetype drift`,
  );
  assertCondition(
    (await page.getByTestId("EmbeddedVisualizationFallbackAdapter").getAttribute("data-fallback-count")) ===
      String(profile.visualizationFallbacks.length),
    `${label} fallback count drift`,
  );
  assertCondition(
    (await page.getByTestId("EmbeddedVisualizationTableSurface").count()) === profile.visualizationFallbacks.length,
    `${label} fallback tables missing`,
  );

  const tokenValues = await provider.evaluate((node: HTMLElement) => {
    const style = window.getComputedStyle(node);
    return {
      canvas: style.getPropertyValue("--embedded-design-canvas").trim(),
      panel: style.getPropertyValue("--embedded-design-panel").trim(),
      accent: style.getPropertyValue("--embedded-design-accent").trim(),
      body: style.getPropertyValue("--embedded-design-body-size").trim(),
    };
  });
  assertCondition(tokenValues.canvas === "#f6f8fb", `${label} canvas token drift`);
  assertCondition(tokenValues.panel === "#ffffff", `${label} panel token drift`);
  assertCondition(tokenValues.accent === "#2457ff", `${label} accent token drift`);
  assertCondition(tokenValues.body === "14px", `${label} body token drift`);

  const forbiddenCopy = await page.evaluate(() => {
    const text = document.body.innerText.toLowerCase();
    return ["click here", "read more", "generic browser error", "compliance badge"].filter((phrase) =>
      text.includes(phrase),
    );
  });
  assertCondition(forbiddenCopy.length === 0, `${label} forbidden copy drift: ${forbiddenCopy.join(", ")}`);
  await assertNoHorizontalOverflow(page, label);
}

export async function assertVisualizationFallbackParity(page: any, label: string): Promise<void> {
  const provider = page.getByTestId("EmbeddedDesignBundleProvider");
  const routeFamily = (await provider.getAttribute("data-route-family")) as EmbeddedDesignRouteFamily;
  const profile = resolveEmbeddedDesignRouteProfile(routeFamily);
  const rows = await page.getByTestId("EmbeddedVisualizationTableSurface").evaluateAll((nodes: HTMLElement[]) =>
    nodes.map((node) => ({
      surface: node.getAttribute("data-visual-surface-id"),
      rows: Number(node.getAttribute("data-row-count") ?? "0"),
      hasCaption: Boolean(node.querySelector("caption")?.textContent?.trim()),
      rowHeaders: node.querySelectorAll("tbody th[scope='row']").length,
    })),
  );
  assertCondition(rows.length === profile.visualizationFallbacks.length, `${label} fallback table count mismatch`);
  for (const row of rows) {
    assertCondition(row.rows >= 3, `${label} ${row.surface} has too few fallback rows`);
    assertCondition(row.hasCaption, `${label} ${row.surface} missing table caption`);
    assertCondition(row.rowHeaders === row.rows, `${label} ${row.surface} missing row headers`);
  }
}
