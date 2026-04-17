import js from "@eslint/js";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const browserNodeGlobals = {
  ...globals.browser,
  ...globals.node,
};

const deepImportPatterns = [
  {
    group: [
      "@vecells/*/src/*",
      "@vecells/*/internal/*",
      "@vecells/*/workers/*",
      "@vecells/*/repositories/*",
    ],
    message: "Import only published workspace entrypoints.",
  },
];

const servicePackages = [
  "@vecells/api-gateway",
  "@vecells/command-api",
  "@vecells/projection-worker",
  "@vecells/notification-worker",
  "@vecells/adapter-simulators",
];

const appRestrictedPatterns = [
  ...deepImportPatterns,
  {
    group: ["@vecells/domain-*"],
    message: "Apps consume published contracts and shared packages, not domain packages.",
  },
  {
    group: servicePackages,
    message: "Apps do not import service implementations directly.",
  },
];

const domainRestrictedPatterns = [
  ...deepImportPatterns,
  {
    group: ["@vecells/domain-*", "!@vecells/domain-kernel"],
    message: "Domain packages may not import sibling domain packages.",
  },
  {
    group: ["@vecells/design-system", ...servicePackages],
    message: "Domain packages stay runtime-agnostic and UI-agnostic.",
  },
];

const gatewayRestrictedPatterns = [
  ...deepImportPatterns,
  {
    group: ["@vecells/domain-*"],
    message:
      "The gateway publishes contracts and policy; it does not import domain packages directly.",
  },
];

export default [
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.playwright/**",
      "**/.playwright-cli/**",
    ],
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js,mjs,cjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: browserNodeGlobals,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-restricted-imports": ["error", { patterns: deepImportPatterns }],
    },
  },
  {
    files: ["apps/**/*.{ts,tsx,js,mjs,cjs}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: appRestrictedPatterns }],
    },
  },
  {
    files: ["services/api-gateway/**/*.{ts,tsx,js,mjs,cjs}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: gatewayRestrictedPatterns }],
    },
  },
  {
    files: ["packages/domains/**/*.{ts,tsx,js,mjs,cjs}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: domainRestrictedPatterns }],
    },
  },
];
