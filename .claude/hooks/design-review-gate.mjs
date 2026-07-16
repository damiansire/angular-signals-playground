// Gate de design-review (defensa en profundidad, ver AGENTS.md).
// PostToolUse sobre Write|Edit: si el cambio toca el motor visual
// (journey/ o molecule-engine), recuerda que el cambio no se cierra
// sin pasada de design-reviewer contra DESIGN-CHECKLIST.md.
// Origen: autopsia 2026-07-16 (la regla escrita del CLAUDE.md global
// no se invoco en la sesion que peor termino).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let data;
try {
  data = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const fp = String(data?.tool_input?.file_path ?? "").replace(/\\/g, "/");
const esVisual = /src\/app\/journey\//.test(fp) || /molecule-engine/.test(fp);
if (!esVisual) process.exit(0);

// No repetir el recordatorio en cada edicion: 1 vez cada 10 toques por sesion.
const marker = join(tmpdir(), `design-gate-${data.session_id ?? "na"}.txt`);
let n = 0;
try {
  if (existsSync(marker)) n = parseInt(readFileSync(marker, "utf8"), 10) || 0;
} catch {}
try {
  writeFileSync(marker, String(n + 1));
} catch {}
if (n % 10 !== 0) process.exit(0);

const msg =
  "[gate design-review] Tocaste el motor visual (journey/molecule-engine). " +
  "Este cambio NO se declara bueno sin: (1) captura real MIRADA via " +
  "chrome-devtools o claude-in-chrome (el Browser pane cuelga con esta app, " +
  "no lo uses) y (2) pasada de design-reviewer contra DESIGN-CHECKLIST.md " +
  "verificando TODOS los items, no solo el sintoma nuevo. Mediciones de DOM " +
  "solas no cierran un cambio visual.";

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: msg,
    },
  }),
);
