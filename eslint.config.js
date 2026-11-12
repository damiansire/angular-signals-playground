// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

/**
 * De qué áreas de `src/app/` puede importar cada una. La dirección es una sola, de la base hacia
 * la historia: quien queda más abajo no conoce a quien lo usa. Sumar una flecha acá es una
 * decisión de arquitectura, no un arreglo de lint.
 */
const PUEDE_IMPORTAR = {
  libs: [],
  interfaces: [],
  "components-draw": ["libs"],
  "components-atom": ["libs", "interfaces", "components-draw"],
  components: ["libs", "interfaces", "components-draw", "components-atom"],
  layouts: ["libs", "interfaces", "components-atom"],
  signals: ["libs", "interfaces", "components-draw", "components-atom", "components", "layouts"],
  practice: ["libs", "interfaces", "components-draw", "components-atom", "components", "layouts"],
  "integrada-vista": [
    "libs",
    "interfaces",
    "components-draw",
    "components-atom",
    "components",
    "layouts",
    "signals",
  ],
};

const fronterasEntreAreas = Object.entries(PUEDE_IMPORTAR).map(([area, permitidas]) => {
  const vedadas = Object.keys(PUEDE_IMPORTAR).filter((a) => a !== area && !permitidas.includes(a));
  const patterns = [
    {
      regex: `^(\\.\\./)+(${vedadas.join("|")})/`,
      message: `${area}/ solo importa de: ${permitidas.join(", ") || "nadie"} (PUEDE_IMPORTAR en eslint.config.js).`,
    },
    {
      // Importar la raíz desde un área arma un ciclo: la raíz ya importa a las áreas.
      regex: "^(\\.\\./)+app\\.(routes|config|component)$",
      message: "Un área no importa el arranque de la app: lo que comparten vive en un área.",
    },
  ];
  if (area === "libs") {
    patterns.push({
      regex: "^(@angular/|rxjs|gsap)",
      message: "libs/ es agnóstico del framework: funciones puras que se prueban sin TestBed.",
    });
  }
  return {
    files: [`src/app/${area}/**/*.ts`],
    // Los desafíos de libs/ se prueban contra los sistemas reales de signals/: son sus fixtures.
    ignores: area === "libs" ? ["**/*.spec.ts"] : [],
    rules: { "no-restricted-imports": ["error", { patterns }] },
  };
});

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
  ...fronterasEntreAreas,
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
