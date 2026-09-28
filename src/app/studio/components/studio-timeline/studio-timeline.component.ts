import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { StudioStateService } from '../../services/studio-state.service';
import { Hablante, LineaEnReloj } from '../../../integrada-vista/prologo-guion';

interface PistaDef {
  id: Hablante;
  label: string;
  color: string;
}

interface MarcadorEscena {
  id: string;
  nombre: string;
  tiempo: number;
  color: string;
}

@Component({
  selector: 'app-studio-timeline',
  template: `
    <div class="timeline" #timelineRoot>
      <!-- Cabecera del timeline: Título, Zoom y Controles -->
      <div class="timeline__topbar">
        <div class="timeline__title-wrap">
          <span class="timeline__title">Línea de Tiempo Multitrack</span>
          <span class="timeline__hint"
            >Arrastrá el cabezal rojo o clickeá cualquier bloque para situar la escena</span
          >
        </div>

        <div class="timeline__zoom-controls">
          <button class="zoom-btn" type="button" (click)="cambiarZoom(-0.25)" title="Reducir zoom">
            −
          </button>
          <span class="zoom-val">{{ (zoom() * 100).toFixed(0) }}%</span>
          <button class="zoom-btn" type="button" (click)="cambiarZoom(0.25)" title="Aumentar zoom">
            +
          </button>
          <button
            class="zoom-btn zoom-btn--reset"
            type="button"
            (click)="zoom.set(1)"
            title="Restaurar zoom 1:1"
          >
            1:1
          </button>
        </div>
      </div>

      <!-- Cuerpo del Timeline: Columna Fija de Pistas (Izquierda) + Área Scrolleable (Derecha) -->
      <div class="timeline__body">
        <!-- Columna Fija de Cabeceras de Pista (Izquierda) -->
        <div class="timeline__headers-col">
          <div class="header-cell header-cell--markers">🚩 Hitos</div>
          <div class="header-cell header-cell--ruler">⏱️ Tiempo</div>
          <div class="headers-tracks-list">
            @for (pista of pistas; track pista.id) {
              <div class="header-track-row" [style.--track-c]="pista.color">
                <span class="track-dot"></span>
                <span class="track-name">{{ pista.label }}</span>
                <span class="track-count">{{ lineasDePista(pista.id).length }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Área Scrolleable de Pistas (Derecha) -->
        <div class="timeline__scroll-area" #scrollContainer (mousedown)="iniciarScrubbing($event)">
          <div class="timeline__tracks-wrapper" [style.width.px]="anchoTotalPistas()">
            <!-- Pista de Marcadores de Escena / Hitos -->
            <div class="timeline__markers-row">
              @for (m of marcadores(); track m.id) {
                <button
                  class="marker-flag"
                  type="button"
                  [style.left.px]="tiempoAPixeles(m.tiempo)"
                  [style.--marker-c]="m.color"
                  (click)="saltarAMarcador(m.tiempo, $event)"
                  [title]="m.nombre + ' (' + (m.tiempo / 1000).toFixed(1) + 's)'"
                >
                  <span class="marker-flag__icon">◆</span>
                  <span class="marker-flag__label">{{ m.nombre }}</span>
                </button>
              }
            </div>

            <!-- Regla de tiempo (Ruler) -->
            <div class="timeline__ruler">
              @for (seg of marcasSegundos(); track seg) {
                <div class="ruler-tick" [style.left.px]="tiempoAPixeles(seg * 1000)">
                  <span class="ruler-tick__line"></span>
                  @if (seg % 5 === 0) {
                    <span class="ruler-tick__text">{{ seg }}s</span>
                  }
                </div>
              }
            </div>

            <!-- Playhead / Cursor de tiempo interactivo -->
            <div
              class="playhead"
              [style.left.px]="tiempoAPixeles(state.tActual())"
              aria-hidden="true"
            >
              <div class="playhead__handle"></div>
              <div class="playhead__line"></div>
            </div>

            <!-- Filas de Pistas por Personaje -->
            <div class="tracks-list">
              @for (pista of pistas; track pista.id) {
                <div class="track-row" [style.--track-c]="pista.color">
                  <!-- Bloques de Diálogo en esta pista -->
                  @for (bloque of lineasDePista(pista.id); track bloque.id) {
                    <button
                      type="button"
                      class="dialogue-block"
                      [class.dialogue-block--selected]="state.selectedLineId() === bloque.id"
                      [style.left.px]="tiempoAPixeles(bloque.t0)"
                      [style.width.px]="duracionAPixeles(bloque.t1 - bloque.t0)"
                      (click)="seleccionarBloque(bloque, $event)"
                      [title]="
                        bloque.txt + ' [' + ((bloque.t1 - bloque.t0) / 1000).toFixed(2) + 's]'
                      "
                    >
                      <span class="dialogue-block__title">{{ bloque.txt }}</span>
                      @if (bloque.pisa) {
                        <span class="dialogue-block__pisa-tag">⚡ pisa</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .timeline {
        display: flex;
        flex-direction: column;
        background: #090c10;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        height: 100%;
        max-height: 100%;
        user-select: none;
        font-family:
          system-ui,
          -apple-system,
          sans-serif;
        color: #e2e8f0;
        overflow: hidden;
        box-sizing: border-box;
      }
      .timeline__topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 14px;
        background: #0d1117;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        height: 32px;
        flex-shrink: 0;
        box-sizing: border-box;
      }
      .timeline__title-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .timeline__title {
        font-size: 11px;
        font-weight: 600;
        color: #f1f5f9;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .timeline__hint {
        font-size: 11px;
        color: #64748b;
      }
      .timeline__zoom-controls {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .zoom-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: #cbd5e1;
        padding: 2px 7px;
        font-size: 11px;
        cursor: pointer;
        transition: background 0.12s;
      }
      .zoom-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }
      .zoom-val {
        font-size: 11px;
        color: #94a3b8;
        font-family: monospace;
        min-width: 32px;
        text-align: center;
      }
      .timeline__body {
        display: flex;
        flex: 1;
        overflow: hidden;
        position: relative;
        min-height: 0;
      }
      .timeline__headers-col {
        width: 120px;
        min-width: 120px;
        max-width: 120px;
        background: #0d1117;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        z-index: 10;
        user-select: none;
      }
      .header-cell {
        display: flex;
        align-items: center;
        padding: 0 8px;
        font-size: 10px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        box-sizing: border-box;
      }
      .header-cell--markers {
        height: 22px;
        background: #090c10;
      }
      .header-cell--ruler {
        height: 20px;
        background: #07090d;
        color: #475569;
      }
      .headers-tracks-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 3px 6px;
        flex: 1;
      }
      .header-track-row {
        height: 18px;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 0 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.02);
      }
      .track-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--track-c, #38bdf8);
        flex-shrink: 0;
      }
      .track-name {
        font-size: 9px;
        font-weight: 700;
        color: var(--track-c, #cbd5e1);
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
      .track-count {
        font-size: 8px;
        color: #475569;
        font-family: monospace;
      }
      .timeline__scroll-area {
        flex: 1;
        overflow-x: auto;
        overflow-y: hidden;
        position: relative;
        background: #07090d;
        cursor: crosshair;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      }
      .timeline__tracks-wrapper {
        position: relative;
        height: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
      }
      .timeline__markers-row {
        height: 22px;
        position: relative;
        background: #090c10;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        flex-shrink: 0;
      }
      .marker-flag {
        position: absolute;
        top: 2px;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid var(--marker-c, #38bdf8);
        border-radius: 3px;
        padding: 1px 5px;
        font-size: 9px;
        color: #f1f5f9;
        display: flex;
        align-items: center;
        gap: 3px;
        cursor: pointer;
        white-space: nowrap;
        z-index: 5;
        transition: all 0.12s;
      }
      .marker-flag:hover {
        background: var(--marker-c, #38bdf8);
        color: #000000;
        font-weight: 600;
      }
      .marker-flag__icon {
        color: var(--marker-c, #38bdf8);
        font-size: 8px;
      }
      .timeline__ruler {
        height: 20px;
        background: #07090d;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        position: relative;
        flex-shrink: 0;
      }
      .ruler-tick {
        position: absolute;
        top: 0;
        bottom: 0;
      }
      .ruler-tick__line {
        position: absolute;
        top: 8px;
        bottom: 0;
        width: 1px;
        background: rgba(255, 255, 255, 0.15);
      }
      .ruler-tick__text {
        position: absolute;
        top: 1px;
        left: 3px;
        font-size: 9px;
        color: #64748b;
        font-family: monospace;
      }
      .playhead {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        pointer-events: none;
        z-index: 25;
        transform: translateX(-1px);
      }
      .playhead__handle {
        position: absolute;
        top: 0;
        left: -6px;
        width: 14px;
        height: 14px;
        background: #ef4444;
        clip-path: polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%);
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
      }
      .playhead__line {
        position: absolute;
        top: 14px;
        bottom: 0;
        left: 0;
        width: 2px;
        background: #ef4444;
        box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
      }
      .tracks-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 3px 0;
        flex: 1;
        position: relative;
      }
      .track-row {
        height: 18px;
        position: relative;
        background: rgba(255, 255, 255, 0.015);
        border-radius: 2px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.02);
      }
      .dialogue-block {
        position: absolute;
        top: 1px;
        bottom: 1px;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid var(--track-c, #38bdf8);
        border-left-width: 3px;
        border-radius: 3px;
        padding: 1px 5px;
        display: flex;
        align-items: center;
        gap: 4px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.12s;
        box-sizing: border-box;
      }
      .dialogue-block:hover {
        background: rgba(255, 255, 255, 0.18);
        filter: brightness(1.2);
        z-index: 10;
      }
      .dialogue-block--selected {
        background: rgba(56, 189, 248, 0.25);
        border-color: #38bdf8;
        box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
        z-index: 10;
      }
      .dialogue-block__title {
        font-size: 10px;
        color: #f1f5f9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
      }
      .dialogue-block__pisa-tag {
        font-size: 8px;
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.2);
        padding: 0 2px;
        border-radius: 2px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioTimelineComponent {
  readonly state = inject(StudioStateService);

  readonly scrollContainer = viewChild.required<ElementRef<HTMLElement>>('scrollContainer');

  readonly zoom = signal<number>(1);
  readonly pxPorSegundo = computed(() => 45 * this.zoom());

  readonly pistas: PistaDef[] = [
    { id: 'cap', label: 'Capitán', color: '#eef1f4' },
    { id: 'naveA', label: 'Nave A', color: '#93c5fd' },
    { id: 'naveB', label: 'Nave B', color: '#60a5fa' },
    { id: 'nave4', label: 'Exploradora', color: '#6ee7b7' },
    { id: 'todos', label: 'Todos', color: '#fdba74' },
    { id: 'voz', label: 'La Voz', color: '#fcd34d' },
    { id: 'mascota', label: 'Mascota', color: '#fed7aa' },
  ];

  readonly anchoTotalPistas = computed(() => {
    const totalSegundos = (this.state.duracionTotal() || 90000) / 1000;
    return Math.max(1200, totalSegundos * this.pxPorSegundo() + 200);
  });

  readonly marcasSegundos = computed(() => {
    const totalSeg = Math.ceil((this.state.duracionTotal() || 90000) / 1000);
    return Array.from({ length: totalSeg + 1 }, (_, i) => i);
  });

  readonly marcadores = computed<MarcadorEscena[]>(() => {
    const T = this.state.anclajes();
    return [
      { id: 'temblor', nombre: 'Temblor', tiempo: T.temblor, color: '#f59e0b' },
      { id: 'anomalia', nombre: 'Anomalía', tiempo: T.anomalia, color: '#ec4899' },
      { id: 'zoom', nombre: 'Warp / Luz', tiempo: T.zoom, color: '#38bdf8' },
      { id: 'caos', nombre: 'Caos', tiempo: T.caos, color: '#ef4444' },
      { id: 'fusion', nombre: 'Fusión', tiempo: T.fusion, color: '#8b5cf6' },
      { id: 'choque', nombre: 'Choque Mascota', tiempo: T.choque, color: '#eab308' },
      { id: 'orden', nombre: 'Orden Tusi', tiempo: T.orden, color: '#10b981' },
      { id: 'fin', nombre: 'Fin', tiempo: T.fin, color: '#64748b' },
    ];
  });

  constructor() {
    // Auto-seguimiento suave del timeline durante la reproducción
    effect(() => {
      const t = this.state.tActual();
      const isPlaying = this.state.isPlaying();
      const container = this.scrollContainer()?.nativeElement;
      if (container && isPlaying) {
        const x = this.tiempoAPixeles(t);
        const visibleW = container.clientWidth;
        const targetScroll = Math.max(0, x - visibleW * 0.35);
        if (Math.abs(container.scrollLeft - targetScroll) > 15) {
          container.scrollLeft = targetScroll;
        }
      }
    });
  }

  tiempoAPixeles(ms: number): number {
    return (ms / 1000) * this.pxPorSegundo();
  }

  duracionAPixeles(ms: number): number {
    return Math.max(20, (ms / 1000) * this.pxPorSegundo());
  }

  lineasDePista(quien: Hablante): LineaEnReloj[] {
    return this.state.reloj().filter((l) => l.quien === quien);
  }

  cambiarZoom(delta: number): void {
    const nuevo = Math.max(0.5, Math.min(3, this.zoom() + delta));
    this.zoom.set(nuevo);
  }

  saltarAMarcador(ms: number, event: MouseEvent): void {
    event.stopPropagation();
    this.state.seek(ms);
    this.centrarEnTiempo(ms);
  }

  seleccionarBloque(bloque: LineaEnReloj, event: MouseEvent): void {
    event.stopPropagation();
    this.state.selectLine(bloque.id);
    this.centrarEnTiempo(bloque.t0);
  }

  private centrarEnTiempo(ms: number): void {
    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;
    const x = this.tiempoAPixeles(ms);
    const visibleW = container.clientWidth;
    container.scrollTo({
      left: Math.max(0, x - visibleW * 0.35),
      behavior: 'smooth',
    });
  }

  iniciarScrubbing(event: MouseEvent): void {
    // Si se hizo click en un botón interactivo dentro del timeline, no iniciar drag
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;

    const contenedor = this.scrollContainer().nativeElement;
    const rect = contenedor.getBoundingClientRect();

    const actualizar = (e: MouseEvent) => {
      const scrollLeft = contenedor.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft;
      const ms = Math.max(0, (x / this.pxPorSegundo()) * 1000);
      this.state.seek(ms);
    };

    actualizar(event);

    const onMouseMove = (e: MouseEvent) => actualizar(e);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
}
