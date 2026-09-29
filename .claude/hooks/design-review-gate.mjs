// Gate de revision de diseno (defensa en profundidad, ver AGENTS.md).
// PostToolUse sobre Write|Edit: si el cambio toca el motor visual
// (integrada-vista/ o molecule-engine), recuerda que el cambio no se cierra
// sin captura real y una pasada completa contra DESIGN-CHECKLIST.md.
// Existe porque la regla escrita sola no alcanzaba: el recordatorio tiene que
// llegar en el momento del cambio, no quedar en un documento.
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
const esVisual = /src\/app\/integrada-vista\//.test(fp) || /molecule-engine/.test(fp);
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
  "[gate de diseno] Tocaste el motor visual (integrada-vista/molecule-engine). " +
  "Este cambio NO se declara bueno sin: (1) una captura real MIRADA, con la " +
  "pestana visible (oculta, el navegador pausa el rAF y la captura se cuelga), " +
  "y (2) una pasada contra DESIGN-CHECKLIST.md verificando TODOS los items, no " +
  "solo el sintoma nuevo. Mediciones de DOM solas no cierran un cambio visual.";

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: msg,
    },
  }),
);
