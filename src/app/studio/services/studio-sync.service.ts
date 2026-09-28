import { Injectable, effect, inject, isDevMode, signal } from '@angular/core';
import { StudioStateService } from './studio-state.service';
import { empalmarGuion } from './guion-serializer';
import { type LineaGuion } from '../../integrada-vista/prologo-guion';

export type EstadoGuardado = 'guardado' | 'guardando' | 'error' | 'sin-conexion' | 'local';

/** El servidor escucha solo en loopback (scripts/sync-server.mjs). */
const SYNC_API = 'http://127.0.0.1:4201/api';

@Injectable({
  providedIn: 'root',
})
export class StudioSyncService {
  private readonly state = inject(StudioStateService);

  readonly saveStatus = signal<EstadoGuardado>('guardado');
  readonly lastSavedAt = signal<Date | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // File Handle opcional para File System Access API nativa del navegador
  private fileHandle: FileSystemFileHandle | null = null;
  private debounceTimer: number | null = null;
  private isFirstRun = true;

  constructor() {
    // Auto-save reactivo cuando cambia el guion
    effect(() => {
      const guionActual = this.state.guion();
      if (this.isFirstRun) {
        this.isFirstRun = false;
        return;
      }
      this.programarAutoSave(guionActual);
    });

    // El servidor de sync existe solo en la máquina del autor: en el sitio publicado el fetch
    // fallaría siempre y dejaría un ERR_CONNECTION_REFUSED en la consola de cada visitante.
    if (isDevMode()) {
      void this.verificarConexionServidor();
    } else {
      this.saveStatus.set('local');
    }
  }

  private async verificarConexionServidor(): Promise<void> {
    try {
      const res = await fetch(`${SYNC_API}/health`, { method: 'GET' });
      if (res.ok) {
        this.saveStatus.set('guardado');
      } else {
        this.saveStatus.set('local');
      }
    } catch {
      this.saveStatus.set('local');
    }
  }

  private programarAutoSave(guion: readonly LineaGuion[]): void {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }
    this.saveStatus.set('guardando');
    this.debounceTimer = window.setTimeout(() => {
      void this.guardarEnDisco(guion);
    }, 400);
  }

  async guardarEnDisco(guion: readonly LineaGuion[] = this.state.guion()): Promise<boolean> {
    this.saveStatus.set('guardando');
    this.errorMessage.set(null);

    // 1. Intentar con Native File System Handle si fue configurado
    if (this.fileHandle) {
      try {
        // Se empalma sobre el texto que el archivo tiene HOY, no sobre una copia vieja: el resto
        // de prologo-guion.ts no es del Estudio. Si el empalme tira, no se llega a escribir.
        const actual = await (await this.fileHandle.getFile()).text();
        const codigoTS = empalmarGuion(actual, guion);
        const writable = await this.fileHandle.createWritable();
        await writable.write(codigoTS);
        await writable.close();
        this.saveStatus.set('guardado');
        this.lastSavedAt.set(new Date());
        return true;
      } catch (err) {
        // Sin caer al servidor: quien vinculó un archivo espera verlo escrito, y un guardado que
        // termina en otro lado esconde que el vinculado está mal.
        this.saveStatus.set('error');
        this.errorMessage.set(err instanceof Error ? err.message : String(err));
        return false;
      }
    }

    // Mismo motivo que en el constructor: afuera de dev no hay servidor al que llamar, y el guion
    // ya quedó en localStorage.
    if (!isDevMode()) {
      this.saveStatus.set('local');
      this.lastSavedAt.set(new Date());
      return false;
    }

    // 2. Intentar con el Sync Server local en Node.js
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${SYNC_API}/save-guion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guion }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.saveStatus.set('guardado');
        this.lastSavedAt.set(new Date());
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        this.saveStatus.set('error');
        this.errorMessage.set(errData.error || 'Error en el servidor de sync');
        return false;
      }
    } catch {
      // El servidor de sync no está corriendo: queda guardado en LocalStorage
      this.saveStatus.set('local');
      this.lastSavedAt.set(new Date());
      return false;
    }
  }

  /**
   * Permite al usuario seleccionar el archivo `prologo-guion.ts` en disco
   * mediante la API moderna de File System del navegador (Chrome / Edge / Opera).
   */
  async vincularArchivoDirecto(): Promise<boolean> {
    if (!('showOpenFilePicker' in window)) {
      alert(
        'Tu navegador no soporta File System Access API. Usá el servidor local `npm run sync:server`.',
      );
      return false;
    }

    try {
      const [handle] = await (
        window as unknown as {
          showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]>;
        }
      ).showOpenFilePicker({
        types: [
          {
            description: 'TypeScript Files',
            accept: { 'text/typescript': ['.ts'] },
          },
        ],
        multiple: false,
      });

      if (handle) {
        this.fileHandle = handle;
        const guardado = await this.guardarEnDisco();
        // Un archivo que no es el guion no queda vinculado: cada guardado siguiente fallaría igual.
        if (!guardado) this.fileHandle = null;
        return guardado;
      }
      return false;
    } catch {
      return false;
    }
  }
}
