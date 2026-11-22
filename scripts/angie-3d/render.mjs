// The official model, shaded gray, at several angles side by side: what ours is compared with.
// usage: node scripts/angie-3d/render.mjs <salida.png> [lado] [yaw1,yaw2,...] [pitch]
import fs from 'node:fs';
import { cargarOficial, png, proyectarMalla, rasterizar, sombra } from './comun.mjs';

const [, , salida, ladoArg = '400', yawsArg = '0,25,45,90', pitch = '0'] = process.argv;
if (!salida) throw new Error('uso: node scripts/angie-3d/render.mjs <salida.png> [lado] [yaws]');
const lado = +ladoArg;
const yaws = yawsArg.split(',').map(Number);
const { V, T } = cargarOficial();
const ancho = lado * yaws.length;
const rgb = Buffer.alloc(ancho * lado * 3, 255);
yaws.forEach((yaw, k) => {
  const P = proyectarMalla(V, yaw, +pitch, lado);
  rasterizar(P, T, lado, (px, t) => {
    const o = (Math.floor(px / lado) * ancho + k * lado + (px % lado)) * 3;
    rgb[o] = rgb[o + 1] = rgb[o + 2] = sombra(P, T, t);
  });
});
fs.writeFileSync(salida, png(ancho, lado, rgb));
console.log('ok', salida);
