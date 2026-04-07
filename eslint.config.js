import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

const eslintConfig = [
  // Global ignores
  {
    ignores: ["node_modules/", ".next/", "prisma/"],
  },

  // Next.js core-web-vitals (recommended + core-web-vitals rules)
  nextPlugin.configs["core-web-vitals"],

  // React recommended (flat config)
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],

  // React Hooks
  reactHooksPlugin.configs.flat["recommended-latest"],

  // JSX accessibility
  jsxA11yPlugin.flatConfigs.recommended,

  // TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: "module",
      },
    },
  },

  // Custom rule overrides (matching eslint-config-next defaults)
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "import/no-anonymous-default-export": "off",
      "react/no-unknown-property": "off",
      "react/prop-types": "off",
      "react/jsx-no-target-blank": "off",

      // jsx-a11y: match eslint-config-next (warn-level, not error)
      "jsx-a11y/alt-text": [
        "warn",
        {
          elements: ["img"],
          img: ["Image"],
        },
      ],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      // Disable stricter a11y rules not in original eslint-config-next
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/label-has-associated-control": "warn",

      // react-hooks v7 added many new rules; keep only the classic two as errors
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Disable rules not present in eslint-plugin-react-hooks v5
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/void-use-memo": "off",
      "react-hooks/component-hook-factories": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/immutability": "off",
      "react-hooks/globals": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/config": "off",
      "react-hooks/gating": "off",
      "react-hooks/purity": "off",
      "react-hooks/error-boundaries": "off",
    },
  },
];

export default eslintConfig;
