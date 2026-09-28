import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudioStateService } from '../../services/studio-state.service';
import { StudioSyncService } from '../../services/studio-sync.service';

@Component({
  selector: 'app-studio-toolbar',
  imports: [RouterLink],
  template: `
    <header class="toolbar">
      <div class="toolbar__left">
        <a routerLink="/" class="toolbar__back" title="Volver al recorrido principal">
          ← Recorrido
        </a>
        <div class="toolbar__divider"></div>
        <h1 class="toolbar__title">Estudio de Cinemática</h1>

        <!-- Estado de Guardado en Disco -->
        <div class="save-badge" [attr.data-status]="sync.saveStatus()">
          @switch (sync.saveStatus()) {
            @case ('guardando') {
              <span class="save-dot save-dot--saving"></span>
              <span class="save-label">Guardando en disco...</span>
            }
            @case ('guardado') {
              <span class="save-dot save-dot--saved"></span>
              <span class="save-label">Guardado en disco ✓</span>
            }
            @case ('local') {
              <span class="save-dot save-dot--local"></span>
              <span class="save-label">Guardado en navegador</span>
              <button
                class="save-badge__link-btn"
                type="button"
                (click)="sync.vincularArchivoDirecto()"
                title="Vincular archivo prologo-guion.ts para escribir directo en tu disco"
              >
                Vincular archivo
              </button>
            }
            @case ('error') {
              <span class="save-dot save-dot--error"></span>
              <span class="save-label" [attr.title]="sync.errorMessage()">Error al guardar</span>
            }
          }
        </div>
      </div>

      <div class="toolbar__center">
        <!-- Deshacer / Rehacer -->
        <div class="toolbar__group">
          <button
            class="tb-btn tb-btn--icon"
            type="button"
            [disabled]="!state.canUndo()"
            (click)="state.undo()"
            title="Deshacer (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            class="tb-btn tb-btn--icon"
            type="button"
            [disabled]="!state.canRedo()"
            (click)="state.redo()"
            title="Rehacer (Ctrl+Y)"
          >
            ↷
          </button>
        </div>

        <div class="toolbar__divider"></div>

        <!-- Controles de Transporte -->
        <div class="toolbar__group">
          <button
            class="tb-btn tb-btn--icon"
            type="button"
            (click)="state.stepFrame(-1000)"
            title="Retroceder 1s (Flecha Izquierda)"
          >
            ⏮ -1s
          </button>
          <button
            class="tb-btn tb-btn--play"
            type="button"
            (click)="state.togglePlay()"
            [title]="state.isPlaying() ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'"
          >
            @if (state.isPlaying()) {
              ⏸ Pausa
            } @else {
              ▶ Play
            }
          </button>
          <button
            class="tb-btn tb-btn--icon"
            type="button"
            (click)="state.stepFrame(1000)"
            title="Avanzar 1s (Flecha Derecha)"
          >
            +1s ⏭
          </button>
        </div>

        <!-- Reloj Digital -->
        <div class="digital-clock" title="Tiempo actual / Duración total">
          <span class="digital-clock__current">{{ formatoTiempo(state.tActual()) }}</span>
          <span class="digital-clock__sep">/</span>
          <span class="digital-clock__total">{{ formatoTiempo(state.duracionTotal()) }}</span>
        </div>
      </div>

      <div class="toolbar__right">
        <!-- Selector de Velocidad -->
        <div class="toolbar__group">
          <span class="tb-label">Velocidad:</span>
          @for (v of velocidades; track v) {
            <button
              class="tb-btn tb-btn--toggle"
              [class.tb-btn--active]="state.velocidad() === v"
              type="button"
              (click)="state.setVelocidad(v)"
            >
              ×{{ v }}
            </button>
          }
        </div>

        <div class="toolbar__divider"></div>

        <!-- Toggles de Audio y Voz -->
        <button
          class="tb-btn tb-btn--toggle"
          [class.tb-btn--active]="state.conVoz()"
          type="button"
          (click)="state.setConVoz(!state.conVoz())"
          title="Activar/desactivar síntesis de voz en el navegador"
        >
          🗣 Voz: {{ state.conVoz() ? 'Sí' : 'No' }}
        </button>

        <button
          class="tb-btn tb-btn--toggle"
          [class.tb-btn--active]="state.conSonido()"
          type="button"
          (click)="state.setConSonido(!state.conSonido())"
          title="Activar/desactivar efectos de audio sintetizados"
        >
          🔊 Sonido: {{ state.conSonido() ? 'Sí' : 'No' }}
        </button>

        <button
          class="tb-btn tb-btn--danger"
          type="button"
          (click)="confirmarRestauracion()"
          title="Restaurar el guion original por defecto"
        >
          ↻ Reset
        </button>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 16px;
        background: #0f1319;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
        font-family:
          system-ui,
          -apple-system,
          sans-serif;
        user-select: none;
        height: 52px;
        box-sizing: border-box;
      }
      .toolbar__left,
      .toolbar__center,
      .toolbar__right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .toolbar__back {
        color: #94a3b8;
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        padding: 5px 8px;
        border-radius: 4px;
        transition:
          background 0.15s,
          color 0.15s;
      }
      .toolbar__back:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #f1f5f9;
      }
      .toolbar__title {
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        color: #f8fafc;
        letter-spacing: -0.01em;
      }
      .toolbar__divider {
        width: 1px;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 4px;
      }
      .toolbar__group {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .tb-label {
        font-size: 12px;
        color: #64748b;
      }
      .tb-btn {
        background: rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        padding: 5px 10px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.12s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .tb-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.2);
      }
      .tb-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .tb-btn--icon {
        font-size: 14px;
        padding: 4px 8px;
        min-width: 32px;
      }
      .tb-btn--play {
        background: #2563eb;
        color: #ffffff;
        border-color: #3b82f6;
        font-weight: 600;
        padding: 6px 14px;
      }
      .tb-btn--play:hover {
        background: #1d4ed8;
      }
      .tb-btn--toggle {
        font-size: 11px;
      }
      .tb-btn--active {
        background: rgba(47, 154, 128, 0.25);
        color: #5eead4;
        border-color: rgba(47, 154, 128, 0.5);
      }
      .tb-btn--danger {
        color: #f87171;
        border-color: rgba(239, 68, 68, 0.2);
      }
      .tb-btn--danger:hover {
        background: rgba(239, 68, 68, 0.15);
      }
      .digital-clock {
        font-family: 'JetBrains Mono', Consolas, monospace;
        font-size: 13px;
        background: #090c10;
        padding: 5px 10px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .digital-clock__current {
        color: #38bdf8;
        font-weight: 600;
      }
      .digital-clock__sep {
        color: #475569;
        margin: 0 4px;
      }
      .digital-clock__total {
        color: #94a3b8;
      }
      .save-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 8px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 11px;
      }
      .save-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
      }
      .save-dot--saved {
        background: #22c55e;
        box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
      }
      .save-dot--saving {
        background: #eab308;
        animation: pulse 1s infinite alternate;
      }
      .save-dot--local {
        background: #38bdf8;
      }
      .save-dot--error {
        background: #ef4444;
      }
      .save-label {
        color: #94a3b8;
      }
      .save-badge__link-btn {
        background: transparent;
        border: none;
        color: #38bdf8;
        font-size: 11px;
        text-decoration: underline;
        cursor: pointer;
        padding: 0;
      }
      @keyframes pulse {
        from {
          opacity: 0.4;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioToolbarComponent {
  readonly state = inject(StudioStateService);
  readonly sync = inject(StudioSyncService);

  readonly velocidades = [0.25, 0.5, 1, 1.5, 2];

  formatoTiempo(ms: number): string {
    const totalSeg = Math.floor(ms / 1000);
    const minutos = Math.floor(totalSeg / 60);
    const segundos = totalSeg % 60;
    const miliseg = Math.floor((ms % 1000) / 10);
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}.${miliseg.toString().padStart(2, '0')}`;
  }

  confirmarRestauracion(): void {
    if (
      confirm(
        '¿Restaurar el guion original por defecto? Se perderán las modificaciones locales no guardadas.',
      )
    ) {
      this.state.restaurarPorDefecto();
    }
  }
}
