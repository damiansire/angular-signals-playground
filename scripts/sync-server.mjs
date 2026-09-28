#!/usr/bin/env node
/**
 * Servidor local de sincronización en caliente para el Estudio de Cinemáticas / Animaciones.
 * Escucha peticiones de la UI (localhost:4200) y actualiza directamente en disco `src/app/integrada-vista/prologo-guion.ts`.
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { empalmarGuion } from '../src/app/studio/services/guion-serializer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const GUION_FILE = path.join(ROOT_DIR, 'src', 'app', 'integrada-vista', 'prologo-guion.ts');

export const PORT = Number(process.env['STUDIO_SYNC_PORT']) || 4201;

/** Solo loopback: desde otra máquina de la red no se llega a un servidor que escribe a disco. */
export const HOST = '127.0.0.1';

/**
 * Este servidor escribe código fuente a disco: con CORS abierto, cualquier página abierta en el
 * mismo navegador podría reescribir el guion mientras corre. Solo el dev server del Estudio.
 */
export const ORIGENES_PERMITIDOS = new Set(['http://localhost:4200', 'http://127.0.0.1:4200']);

/**
 * Empalma sobre lo que el archivo tiene HOY: el resto de prologo-guion.ts no es del Estudio.
 * Si el empalme tira, no se llega a escribir.
 */
export async function guardarGuion(filePath, guion) {
  const actual = await fs.readFile(filePath, 'utf-8');
  await fs.writeFile(filePath, empalmarGuion(actual, guion), 'utf-8');
}

function responder(res, status, cuerpo) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(cuerpo));
}

/**
 * Crea la aplicación HTTP del servidor de sincronización.
 */
export function createSyncServer(filePath = GUION_FILE) {
  return http.createServer(async (req, res) => {
    const origen = req.headers.origin;
    const permitido = origen !== undefined && ORIGENES_PERMITIDOS.has(origen);
    res.setHeader('Vary', 'Origin');
    if (permitido) {
      res.setHeader('Access-Control-Allow-Origin', origen);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(permitido ? 204 : 403);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${HOST}`);

    if (url.pathname === '/api/health') {
      responder(res, 200, { ok: true, server: 'signals-studio-sync' });
      return;
    }

    if (url.pathname === '/api/save-guion' && req.method === 'POST') {
      // Un POST sin Origin tampoco pasa: los navegadores lo mandan siempre, así que solo lo omite
      // un cliente que no es el Estudio.
      if (!permitido) {
        responder(res, 403, {
          ok: false,
          error: `Origen no permitido: ${origen ?? '(sin Origin)'}`,
        });
        return;
      }

      let guion;
      try {
        let body = '';
        for await (const chunk of req) body += chunk;
        guion = JSON.parse(body).guion;
      } catch {
        responder(res, 400, { ok: false, error: 'El cuerpo no es JSON válido' });
        return;
      }
      if (!Array.isArray(guion)) {
        responder(res, 400, {
          ok: false,
          error: 'Formato inválido: se esperaba un array en `guion`',
        });
        return;
      }

      try {
        await guardarGuion(filePath, guion);
        responder(res, 200, { ok: true, lineas: guion.length, timestamp: Date.now() });
      } catch (err) {
        responder(res, 500, { ok: false, error: err.message });
      }
      return;
    }

    responder(res, 404, { error: 'Endpoint no encontrado' });
  });
}

// Iniciar servidor si se corre directamente
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const server = createSyncServer();
  server.listen(PORT, HOST, () => {
    console.log(`[Studio Sync] Servidor de guardado automático activo en http://${HOST}:${PORT}`);
  });
}
