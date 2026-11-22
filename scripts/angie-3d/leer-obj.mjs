// Parses the official OBJ once into binary vertices and triangles (tmp/angie-3d/oficial.*.bin):
// the 100 MB text takes a minute to read, the binary a fraction of a second.
// usage: node scripts/angie-3d/leer-obj.mjs <default_01_waterTight.obj>
import fs from 'node:fs';
import readline from 'node:readline';
import { MALLA } from './comun.mjs';

const [, , obj] = process.argv;
if (!obj) throw new Error('uso: node scripts/angie-3d/leer-obj.mjs <ruta al .obj>');
const verts = [];
const tris = [];
const lineas = readline.createInterface({ input: fs.createReadStream(obj), crlfDelay: Infinity });
for await (const linea of lineas) {
  if (linea.startsWith('v ')) {
    const p = linea.split(/\s+/);
    verts.push(+p[1], +p[2], +p[3]);
  } else if (linea.startsWith('f ')) {
    const p = linea
      .trim()
      .split(/\s+/)
      .slice(1)
      .map((t) => parseInt(t, 10) - 1);
    for (let i = 1; i + 1 < p.length; i++) tris.push(p[0], p[i], p[i + 1]);
  }
}
fs.writeFileSync(MALLA + '.v.bin', Buffer.from(new Float32Array(verts).buffer));
fs.writeFileSync(MALLA + '.t.bin', Buffer.from(new Uint32Array(tris).buffer));
console.log('vértices', verts.length / 3, 'triángulos', tris.length / 3);
