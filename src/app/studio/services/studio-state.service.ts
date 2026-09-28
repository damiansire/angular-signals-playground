import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { sonido } from '../../libs/sonido';
import {
  GUION,
  anclajesDe,
  armarReloj,
  malformado,
  renglonesLargos,
  type Anclajes,
  type Hablante,
  type LineaEnReloj,
  type LineaGuion,
} from '../../integrada-vista/prologo-guion';

const MAX_HISTORY_STEPS = 50;

/**
 * Estado reactivo centralizado para el Estudio de Cinemáticas y Diálogos.
 * Administra el guion, el reloj derivado, la reproducción, la línea seleccionada
 * y la pila de historial inmutable de Deshacer / Rehacer (Undo / Redo).
 */
@Injectable({
  providedIn: 'root',
})
export class StudioStateService {
  // Pila de historial para Undo / Redo
  private pastStates: (readonly LineaGuion[])[] = [];
  private futureStates: (readonly LineaGuion[])[] = [];

  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  // Estado del Guion
  readonly guion = signal<readonly LineaGuion[]>(GUION);
  /** Solo prende o apaga las voces (blips) de la previsualización: ya no cambia el ritmo. */
  readonly conVoz = signal<boolean>(true);
  /** El sonido es la preferencia GLOBAL: silenciar acá silencia el juego, y al revés. */
  readonly conSonido = signal<boolean>(sonido().activo());

  // Reloj y Anclajes derivados automáticamente
  readonly reloj = computed<readonly LineaEnReloj[]>(() => {
    try {
      // A ritmo de lectura, igual que el prólogo en el juego: si el Estudio midiera otro reloj,
      // lo que se ajusta acá no sería lo que después se ve.
      return armarReloj(this.guion());
    } catch {
      return armarReloj(GUION);
    }
  });

  readonly anclajes = computed<Anclajes>(() => {
    try {
      return anclajesDe(this.reloj());
    } catch {
      return anclajesDe(armarReloj(GUION));
    }
  });

  // Diagnóstico de legibilidad y formato en vivo
  readonly diagnostico = computed(() => ({
    malformado: malformado(this.guion()),
    renglonesLargos: renglonesLargos(this.guion()),
  }));

  // Reproducción y tiempo
  readonly tActual = signal<number>(0);
  readonly isPlaying = signal<boolean>(false);
  readonly velocidad = signal<number>(1);

  // Línea seleccionada
  readonly selectedLineId = signal<string | null>(null);

  readonly selectedLine = computed<LineaEnReloj | null>(() => {
    const id = this.selectedLineId();
    if (!id) return null;
    return this.reloj().find((l) => l.id === id) ?? null;
  });

  /** Tiempo total derivado de los anclajes */
  readonly duracionTotal = computed(() => this.anclajes().fin);

  constructor() {
    this.cargarDeLocalStorage();
    const soltar = sonido().alCambiar((activo) => this.conSonido.set(activo));
    inject(DestroyRef).onDestroy(soltar);
  }

  /* ── Control de Reproducción ────────────────────────────────────────────── */

  play(): void {
    this.isPlaying.set(true);
  }

  pause(): void {
    this.isPlaying.set(false);
  }

  togglePlay(): void {
    this.isPlaying.update((p) => !p);
  }

  seek(ms: number): void {
    const total = this.duracionTotal();
    const clamped = Math.max(0, Math.min(total, ms));
    this.tActual.set(clamped);
  }

  stepFrame(deltaMs: number): void {
    this.seek(this.tActual() + deltaMs);
  }

  setVelocidad(v: number): void {
    this.velocidad.set(v);
  }

  setConVoz(v: boolean): void {
    this.conVoz.set(v);
  }

  setConSonido(v: boolean): void {
    this.conSonido.set(sonido().alternar(v));
  }

  selectLine(id: string | null): void {
    this.selectedLineId.set(id);
    if (id) {
      const line = this.reloj().find((l) => l.id === id);
      if (line) {
        this.seek(line.t0);
      }
    }
  }

  /* ── Sistema de Historial (Undo / Redo) ─────────────────────────────────── */

  private pushState(nuevoGuion: readonly LineaGuion[]): void {
    const actual = this.guion();
    this.pastStates.push(actual);
    if (this.pastStates.length > MAX_HISTORY_STEPS) {
      this.pastStates.shift();
    }
    this.futureStates = [];
    this.canUndo.set(true);
    this.canRedo.set(false);
    this.guion.set(nuevoGuion);
    this.guardarEnLocalStorage(nuevoGuion);
  }

  undo(): void {
    if (this.pastStates.length === 0) return;
    const anterior = this.pastStates.pop()!;
    const actual = this.guion();
    this.futureStates.push(actual);

    this.guion.set(anterior);
    this.canUndo.set(this.pastStates.length > 0);
    this.canRedo.set(true);
    this.guardarEnLocalStorage(anterior);
  }

  redo(): void {
    if (this.futureStates.length === 0) return;
    const siguiente = this.futureStates.pop()!;
    const actual = this.guion();
    this.pastStates.push(actual);

    this.guion.set(siguiente);
    this.canUndo.set(true);
    this.canRedo.set(this.futureStates.length > 0);
    this.guardarEnLocalStorage(siguiente);
  }

  /* ── Mutaciones del Guion ────────────────────────────────────────────────── */

  actualizarLinea(id: string, parcial: Partial<LineaGuion>): void {
    const actual = this.guion();
    const index = actual.findIndex((l) => l.id === id);
    if (index === -1) return;

    const actualizada: LineaGuion = {
      ...actual[index],
      ...parcial,
    };

    const nuevo = [...actual];
    nuevo[index] = actualizada;
    this.pushState(nuevo);
  }

  agregarLinea(despuesDeId?: string): void {
    const actual = this.guion();
    let index = actual.length - 1;
    let quien: Hablante = 'cap';

    if (despuesDeId) {
      const idx = actual.findIndex((l) => l.id === despuesDeId);
      if (idx !== -1) {
        index = idx;
        quien = actual[idx].quien;
      }
    }

    const nuevoId = `linea-${Date.now().toString(36)}`;
    const nueva: LineaGuion = {
      id: nuevoId,
      quien,
      txt: 'Nueva línea de diálogo',
    };

    const nuevo = [...actual];
    nuevo.splice(index + 1, 0, nueva);
    this.pushState(nuevo);
    this.selectLine(nuevoId);
  }

  eliminarLinea(id: string): void {
    const actual = this.guion();
    if (actual.length <= 1) return; // Mínimo 1 línea
    const index = actual.findIndex((l) => l.id === id);
    if (index === -1) return;

    const nuevo = actual.filter((l) => l.id !== id);
    this.pushState(nuevo);

    if (this.selectedLineId() === id) {
      const proxima = nuevo[Math.min(index, nuevo.length - 1)];
      this.selectLine(proxima?.id ?? null);
    }
  }

  moverLinea(desdeIdx: number, haciaIdx: number): void {
    const actual = this.guion();
    if (
      desdeIdx < 0 ||
      desdeIdx >= actual.length ||
      haciaIdx < 0 ||
      haciaIdx >= actual.length ||
      desdeIdx === haciaIdx
    ) {
      return;
    }

    const nuevo = [...actual];
    const [item] = nuevo.splice(desdeIdx, 1);
    nuevo.splice(haciaIdx, 0, item);
    this.pushState(nuevo);
  }

  restaurarPorDefecto(): void {
    this.pushState(GUION);
  }

  /* ── Persistencia LocalStorage (Fallback instantáneo) ──────────────────── */

  private guardarEnLocalStorage(guion: readonly LineaGuion[]): void {
    try {
      localStorage.setItem('angular-signals:studio:guion', JSON.stringify(guion));
    } catch {
      // Ignorar quota exceeded
    }
  }

  private cargarDeLocalStorage(): void {
    try {
      const raw = localStorage.getItem('angular-signals:studio:guion');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.guion.set(parsed);
        }
      }
    } catch {
      // Fallback a GUION por defecto
    }
  }
}
