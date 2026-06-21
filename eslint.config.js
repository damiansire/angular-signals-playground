// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      // Gate: nada de console.* fuera de warn/error en producción
      "no-console": ["error", { allow: ["warn", "error"] }],
      // Gate: el repo predica OnPush al 100% — fallar si se reintroduce Default CD
      "@angular-eslint/prefer-on-push-component-change-detection": "error",
    },
  },
  {
    // Los specs pueden usar console para diagnóstico puntual
    files: ["**/*.spec.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      // Gate: navegación operable por teclado (keyboard-nav a11y)
      "@angular-eslint/template/click-events-have-key-events": "error",
      "@angular-eslint/template/interactive-supports-focus": "error",
      "@angular-eslint/template/mouse-events-have-key-events": "error",
    },
  }
]);
