import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { StudioStateService } from '../../services/studio-state.service';
import { StudioAudioService } from '../../services/studio-audio.service';
import {
  renderPrologoFrame,
  type PrologoFrameContext,
} from '../../../integrada-vista/prologo-renderer';
import { LineaEnReloj } from '../../../integrada-vista/prologo-guion';

@Component({
  selector: 'app-studio-viewport',
  template: `
    <div class="viewport-container">
      <div
        class="viewport-stage"
        #stageRef
        tabindex="0"
        role="region"
        aria-label="Escenario de previsualización del prólogo"
        (keydown.space)="$event.preventDefault(); togglePlay()"
      >
        <canvas class="viewport-canvas" #canvasRef width="1000" height="562"></canvas>
        <img
          class="viewport-mascot"
          #mascotRef
          src="angular-mascot-idea.svg"
          alt=""
          width="240"
          height="300"
          aria-hidden="true"
        />

        <!-- Botón invisible que cubre el escenario para click accesible -->
        <button
          class="viewport-click-backdrop"
          type="button"
          (click)="togglePlay()"
          [title]="state.isPlaying() ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'"
          aria-label="Reproducir o pausar prólogo"
        ></button>

        <!-- Overlay de Play / Pausa interactivo -->
        @if (!state.isPlaying()) {
          <div class="viewport-play-overlay">
            <button
              class="play-overlay-btn"
              type="button"
              (click)="playConAudio()"
              title="Reproducir prólogo (Espacio)"
            >
              ▶
            </button>
            <span class="play-overlay-hint">
              {{
                state.tActual() === 0
                  ? 'Click para reproducir el prólogo'
                  : 'Pausado · Click o Espacio para continuar'
              }}
            </span>
          </div>
        }

        <!-- Info en vivo: Tiempo y Diálogo activo -->
        <div class="viewport-top-hud">
          <div class="hud-pill">
            <span class="hud-time">{{ formatoTiempo(state.tActual()) }}</span>
            @if (lineaActiva(); as l) {
              <span class="hud-who hud-who--{{ l.quien }}">{{ l.quien }}</span>
            }
          </div>
          @if (!state.isPlaying()) {
            <div class="hud-badge">PAUSA</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .viewport-container {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #07080c;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        position: relative;
        overflow: hidden;
        user-select: none;
      }
      .viewport-stage {
        position: relative;
        height: 100%;
        max-height: 100%;
        max-width: 100%;
        width: auto;
        aspect-ratio: 1000 / 562;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        overflow: hidden;
        background: #07080c;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }
      .viewport-canvas {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .viewport-mascot {
        position: absolute;
        top: 0;
        left: 0;
        width: 18%;
        height: auto;
        pointer-events: none;
        opacity: 0;
        transform-origin: center center;
        transition: opacity 0.2s ease;
        will-change: transform, opacity;
      }
      .viewport-click-backdrop {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        padding: 0;
        cursor: pointer;
        z-index: 1;
      }
      .viewport-play-overlay {
        position: absolute;
        inset: 0;
        background: rgba(7, 8, 12, 0.45);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        backdrop-filter: blur(2px);
        transition: background 0.15s ease;
        z-index: 2;
      }
      .viewport-play-overlay:hover {
        background: rgba(7, 8, 12, 0.3);
      }
      .play-overlay-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #2563eb;
        color: #ffffff;
        border: 2px solid #60a5fa;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(37, 99, 235, 0.5);
        transition:
          transform 0.15s ease,
          background 0.15s ease;
      }
      .play-overlay-btn:hover {
        transform: scale(1.1);
        background: #1d4ed8;
      }
      .play-overlay-hint {
        font-size: 13px;
        color: #e2e8f0;
        background: rgba(0, 0, 0, 0.6);
        padding: 4px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-weight: 500;
        letter-spacing: 0.02em;
      }
      .viewport-top-hud {
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        pointer-events: none;
        z-index: 3;
      }
      .hud-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(9, 12, 16, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 3px 8px;
        border-radius: 4px;
        backdrop-filter: blur(4px);
      }
      .hud-time {
        font-family: 'JetBrains Mono', Consolas, monospace;
        font-size: 11px;
        color: #38bdf8;
        font-weight: 600;
      }
      .hud-who {
        font-size: 10px;
        font-weight: 600;
        padding: 1px 4px;
        border-radius: 2px;
        text-transform: uppercase;
      }
      .hud-who--cap {
        background: rgba(238, 241, 244, 0.2);
        color: #eef1f4;
      }
      .hud-who--naveA,
      .hud-who--naveB {
        background: rgba(196, 205, 219, 0.2);
        color: #c4cddb;
      }
      .hud-who--nave4 {
        background: rgba(127, 214, 189, 0.2);
        color: #7fd6bd;
      }
      .hud-who--voz {
        background: rgba(240, 180, 88, 0.2);
        color: #f0b458;
      }
      .hud-who--mascota {
        background: rgba(244, 236, 224, 0.2);
        color: #f4ece0;
      }
      .hud-who--todos {
        background: rgba(246, 217, 192, 0.2);
        color: #f6d9c0;
      }
      .hud-badge {
        padding: 3px 8px;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        color: #94a3b8;
        font-size: 11px;
        font-family: 'JetBrains Mono', Consolas, monospace;
        font-weight: 600;
        letter-spacing: 0.05em;
        backdrop-filter: blur(4px);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioViewportComponent {
  readonly state = inject(StudioStateService);
  readonly audio = inject(StudioAudioService);
  private readonly destroyRef = inject(DestroyRef);

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvasRef');
  readonly stageRef = viewChild.required<ElementRef<HTMLElement>>('stageRef');
  readonly mascotRef = viewChild.required<ElementRef<HTMLElement>>('mascotRef');

  readonly lineaActiva = computed<LineaEnReloj | null>(() => {
    const t = this.state.tActual();
    return this.state.reloj().find((l) => t >= l.t0 && t < l.t1) ?? null;
  });

  private ctx: CanvasRenderingContext2D | null = null;
  private rafId = 0;
  private lastTimestamp: number | null = null;

  constructor() {
    afterNextRender(() => {
      const canvas = this.canvasRef().nativeElement;
      this.ctx = canvas.getContext('2d');
      this.dibujarActual();
      this.iniciarLoop();
    });

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.rafId);
      this.audio.destruir();
    });

    // Reaccionar inmediatamente cuando cambia el tiempo o el guion mientras está pausado
    effect(() => {
      const t = this.state.tActual();
      this.state.guion();
      this.state.conVoz();
      if (!this.state.isPlaying()) {
        this.audio.resetDichas(t);
        this.dibujarActual();
      }
    });

    // Control de reproducción play/pause
    effect(() => {
      const playing = this.state.isPlaying();
      if (playing) {
        this.lastTimestamp = null;
        this.audio.asegurarAudio();
      } else {
        this.audio.pausar();
      }
    });
  }

  playConAudio(): void {
    this.audio.asegurarAudio();
    this.state.play();
  }

  togglePlay(): void {
    if (!this.state.isPlaying()) {
      this.audio.asegurarAudio();
    }
    this.state.togglePlay();
  }

  formatoTiempo(ms: number): string {
    const totalSeg = Math.floor(ms / 1000);
    const minutos = Math.floor(totalSeg / 60);
    const segundos = totalSeg % 60;
    const miliseg = Math.floor((ms % 1000) / 10);
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}.${miliseg.toString().padStart(2, '0')}`;
  }

  private dibujarActual(): void {
    if (!this.ctx) return;
    const canvas = this.canvasRef().nativeElement;
    const stage = this.stageRef().nativeElement;
    const mascot = this.mascotRef().nativeElement;

    const frameCtx: PrologoFrameContext = {
      g: this.ctx,
      W: canvas.width,
      H: canvas.height,
      CX: canvas.width / 2,
      CY: canvas.height / 2,
      t: this.state.tActual(),
      reloj: this.state.reloj(),
      anclajes: this.state.anclajes(),
      mascotaEl: mascot,
      stageWidth: stage.clientWidth,
    };

    renderPrologoFrame(frameCtx);
  }

  private iniciarLoop(): void {
    const loop = (ts: number) => {
      if (this.state.isPlaying()) {
        const dt = this.lastTimestamp === null ? 0 : Math.min(80, ts - this.lastTimestamp);
        this.lastTimestamp = ts;

        const vel = this.state.velocidad();
        const nuevoT = this.state.tActual() + dt * vel;
        const maxT = this.state.duracionTotal();

        if (nuevoT >= maxT) {
          this.state.seek(maxT);
          this.state.pause();
        } else {
          this.state.seek(nuevoT);
          this.audio.actualizarCuadro(nuevoT, this.state.anclajes(), this.state.reloj());
        }
        this.dibujarActual();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }
}
