import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as prettier from 'prettier';
import { createSyncServer } from './sync-server.mjs';
import {
  MARCADOR_GUION,
  empalmarGuion,
  serializarGuion,
} from '../src/app/studio/services/guion-serializer.ts';
import { GUION } from '../src/app/integrada-vista/prologo-guion.ts';

const ARCHIVO_REAL = new URL('../src/app/integrada-vista/prologo-guion.ts', import.meta.url);
const ORIGEN_ESTUDIO = 'http://localhost:4200';

/** Un prologo-guion.ts en miniatura: lo que rodea al literal es justo lo que no se puede perder. */
const ANTES = `/**
 * Comentario de diseño que el Estudio no conoce.
 */

export type Hablante = 'cap' | 'naveA';

`;
const DESPUES = `

/** Una función que evolucionó después de que el Estudio existiera. */
export function anclajesDe(): number {
  return 42;
}
`;
const FIXTURE = `${ANTES}${MARCADOR_GUION}
  { id: 'vieja', quien: 'cap', txt: 'Texto viejo.' },
];${DESPUES}`;

test('empalmarGuion sobre el archivo real preserva byte a byte todo lo que no es el literal', async () => {
  const real = await fs.readFile(ARCHIVO_REAL, 'utf-8');
  const guion = [...GUION, { id: 'nueva', quien: 'cap', txt: 'Una línea agregada.' }];

  const empalmado = empalmarGuion(real, guion);

  const inicio = real.indexOf(MARCADOR_GUION);
  const fin = real.indexOf('\n];', inicio) + '\n];'.length;
  assert.equal(empalmado.slice(0, inicio), real.slice(0, inicio));
  assert.ok(empalmado.endsWith(real.slice(fin)));
  assert.ok(empalmado.includes("{ id: 'nueva', quien: 'cap', txt: 'Una línea agregada.' },"));
});

test('guardar el guion real sin cambios deja el archivo idéntico, comentarios de diseño incluidos', async () => {
  const real = await fs.readFile(ARCHIVO_REAL, 'utf-8');

  assert.ok(real.includes('  // ACTO 0 '), 'el guion real perdió sus comentarios de diseño');
  assert.equal(empalmarGuion(real, GUION), real);
});

test('serializarGuion escribe lo mismo que prettier: guardar no ensucia format:check', async () => {
  const guion = [
    ...GUION,
    { id: 'comillas', quien: 'cap', txt: "It's the pilot's call" },
    {
      id: 'larga',
      quien: 'naveB',
      txt: 'Una línea sin cortes que se pasa del ancho de cien columnas.',
    },
    { id: 'todo', hueco: 300, pisa: 200, junto: true, dur: 900, quien: 'todos', txt: '¡Ya!' },
  ];
  const codigo = `${serializarGuion(guion)}\n`;
  const opciones = await prettier.resolveConfig(ARCHIVO_REAL);

  assert.equal(await prettier.format(codigo, { ...opciones, parser: 'typescript' }), codigo);
});

test('empalmarGuion tira si el marcador no aparece exactamente una vez', () => {
  const sinMarcador = FIXTURE.replace(MARCADOR_GUION, 'export const OTRO = [');
  const duplicado = `${FIXTURE}\n${MARCADOR_GUION}\n];\n`;

  assert.throws(() => empalmarGuion(sinMarcador, GUION), /aparece 0 veces/);
  assert.throws(() => empalmarGuion(duplicado, GUION), /aparece 2 veces/);
});

/** Levanta el servidor sobre un archivo temporal con `contenido` y lo apaga al terminar. */
async function conServidor(contenido, prueba) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-server-'));
  const archivo = path.join(dir, 'prologo-guion.ts');
  if (contenido !== null) await fs.writeFile(archivo, contenido, 'utf-8');
  const server = createSyncServer(archivo);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await prueba({ base, archivo });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(dir, { recursive: true, force: true });
  }
}

function guardar(base, guion, origen = ORIGEN_ESTUDIO) {
  const headers = { 'Content-Type': 'application/json' };
  if (origen) headers.Origin = origen;
  return fetch(`${base}/api/save-guion`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ guion }),
  });
}

test('/api/health responde y /api/save-guion empalma sin tocar el resto del archivo', async () => {
  await conServidor(FIXTURE, async ({ base, archivo }) => {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).ok, true);

    const res = await guardar(base, [{ id: 'test-1', quien: 'cap', txt: 'Test sync' }]);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGEN_ESTUDIO);
    assert.deepEqual(await res.json().then(({ ok, lineas }) => ({ ok, lineas })), {
      ok: true,
      lineas: 1,
    });

    const escrito = await fs.readFile(archivo, 'utf-8');
    assert.equal(
      escrito,
      `${ANTES}${MARCADOR_GUION}\n  { id: 'test-1', quien: 'cap', txt: 'Test sync' },\n];${DESPUES}`,
    );
  });
});

test('/api/save-guion rechaza con 400 un guion que no es array', async () => {
  await conServidor(FIXTURE, async ({ base, archivo }) => {
    const res = await guardar(base, 'invalido');
    assert.equal(res.status, 400);
    assert.equal(await fs.readFile(archivo, 'utf-8'), FIXTURE);
  });
});

test('/api/save-guion no escribe nada si el archivo no tiene el marcador', async () => {
  const sinMarcador = FIXTURE.replace(MARCADOR_GUION, 'export const OTRO = [');
  await conServidor(sinMarcador, async ({ base, archivo }) => {
    const res = await guardar(base, [{ id: 'test-1', quien: 'cap', txt: 'Test sync' }]);
    assert.equal(res.status, 500);
    assert.match((await res.json()).error, /aparece 0 veces/);
    assert.equal(await fs.readFile(archivo, 'utf-8'), sinMarcador);
  });
});

test('/api/save-guion no crea el archivo si no existe', async () => {
  await conServidor(null, async ({ base, archivo }) => {
    const res = await guardar(base, [{ id: 'test-1', quien: 'cap', txt: 'Test sync' }]);
    assert.equal(res.status, 500);
    await assert.rejects(fs.access(archivo));
  });
});

test('solo el dev server del Estudio puede escribir: otro origen o ninguno da 403', async () => {
  await conServidor(FIXTURE, async ({ base, archivo }) => {
    const guion = [{ id: 'intrusa', quien: 'cap', txt: 'No debería llegar al disco' }];

    const ajeno = await guardar(base, guion, 'https://pagina-cualquiera.example');
    assert.equal(ajeno.status, 403);
    assert.equal(ajeno.headers.get('access-control-allow-origin'), null);

    const sinOrigen = await guardar(base, guion, null);
    assert.equal(sinOrigen.status, 403);

    const preflight = await fetch(`${base}/api/save-guion`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://pagina-cualquiera.example' },
    });
    assert.equal(preflight.status, 403);

    assert.equal(await fs.readFile(archivo, 'utf-8'), FIXTURE);
  });
});

test('el preflight del Estudio pasa desde localhost y desde 127.0.0.1', async () => {
  await conServidor(FIXTURE, async ({ base }) => {
    for (const origen of ['http://localhost:4200', 'http://127.0.0.1:4200']) {
      const res = await fetch(`${base}/api/save-guion`, {
        method: 'OPTIONS',
        headers: { Origin: origen, 'Access-Control-Request-Method': 'POST' },
      });
      assert.equal(res.status, 204);
      assert.equal(res.headers.get('access-control-allow-origin'), origen);
    }
  });
});
