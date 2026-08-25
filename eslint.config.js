import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "build/**",
      "node_modules/**",
      "public/**",
      "playwright-report/**",
      "test-artifacts/**",
      "src/__create/**",
      "__create/**",
      "e2e/**",
      "scripts/**",
      "shims/**",
      "**/*.{ts,tsx}",
      "fix-imports.js",
      "qa.js",
      "tailwind.config.js",
    ],
  },
  {
    files: ["src/**/*.{js,jsx}"],
    ...js.configs.recommended,
  },
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-useless-assignment": "warn",
      "no-useless-escape": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
