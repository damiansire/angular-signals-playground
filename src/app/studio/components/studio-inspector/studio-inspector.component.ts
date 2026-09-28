import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../services/studio-state.service';
import { Hablante, LineaEnReloj } from '../../../integrada-vista/prologo-guion';

interface PersonajeOpcion {
  id: Hablante;
  nombre: string;
  color: string;
}

@Component({
  selector: 'app-studio-inspector',
  imports: [FormsModule],
  template: `
    <aside class="inspector">
      <!-- Encabezado con selector de pestañas -->
      <div class="inspector__header">
        <div class="inspector__tabs">
          <button
            type="button"
            class="tab-btn"
            [class.tab-btn--active]="tabActiva() === 'editor'"
            (click)="tabActiva.set('editor')"
          >
            ✍️ Línea
            @if (state.selectedLine(); as l) {
              <span class="tab-badge">#{{ l.id }}</span>
            }
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.tab-btn--active]="tabActiva() === 'guion'"
            (click)="tabActiva.set('guion')"
          >
            📜 Guion Completo
            <span class="tab-badge">{{ state.reloj().length }}</span>
          </button>
        </div>
      </div>

      <!-- Contenido de la pestaña EDITOR -->
      @if (tabActiva() === 'editor') {
        <div class="inspector__content">
          @if (state.selectedLine(); as line) {
            <!-- Barra de navegación rápida entre líneas consecutivas -->
            <div class="line-nav-bar">
              <button
                type="button"
                class="btn-nav"
                [disabled]="indiceLineaActual() <= 0"
                (click)="navegarLinea(-1)"
                title="Línea anterior"
              >
                ◀ Ant
              </button>
              <span class="line-nav-pos">
                Línea {{ indiceLineaActual() + 1 }} de {{ state.reloj().length }}
              </span>
              <button
                type="button"
                class="btn-nav"
                [disabled]="indiceLineaActual() >= state.reloj().length - 1"
                (click)="navegarLinea(1)"
                title="Línea siguiente"
              >
                Sig ▶
              </button>
            </div>

            <!-- Selector de Personaje -->
            <div class="field-group">
              <span class="field-label">Personaje / Hablante</span>
              <div class="hablante-selector">
                @for (p of personajes; track p.id) {
                  <button
                    type="button"
                    class="hablante-chip"
                    [class.hablante-chip--active]="line.quien === p.id"
                    [style.--chip-color]="p.color"
                    (click)="actualizarCampo('quien', p.id)"
                  >
                    <span class="hablante-dot"></span>
                    {{ p.nombre }}
                  </button>
                }
              </div>
            </div>

            <!-- Texto del Diálogo -->
            <div class="field-group">
              <div class="field-label-row">
                <label class="field-label" for="dialogoTexto">Texto del diálogo</label>
                <button
                  class="btn-action btn-action--voice"
                  type="button"
                  (click)="probarVoz(line)"
                  title="Escuchar con síntesis de voz"
                >
                  🔊 Probar voz
                </button>
              </div>
              <textarea
                id="dialogoTexto"
                class="field-textarea"
                rows="3"
                [ngModel]="line.txt"
                (ngModelChange)="actualizarCampo('txt', $event)"
                placeholder="Texto de la frase..."
              ></textarea>
              <span class="field-hint">
                {{ line.txt.length }} caracteres · Saltos de línea separan renglones.
              </span>
            </div>

            <!-- Modificadores de Timing -->
            <div class="timing-grid">
              <div class="field-group">
                <label class="field-label" for="huecoInput">Pausa previa (hueco ms)</label>
                <input
                  id="huecoInput"
                  type="number"
                  class="field-input"
                  step="50"
                  min="0"
                  max="5000"
                  [ngModel]="line.hueco ?? 0"
                  (ngModelChange)="actualizarNumero('hueco', $event)"
                />
              </div>

              <div class="field-group">
                <label class="field-label" for="pisaInput">Interrupción (pisa ms)</label>
                <input
                  id="pisaInput"
                  type="number"
                  class="field-input"
                  step="50"
                  min="0"
                  max="3000"
                  [ngModel]="line.pisa ?? 0"
                  (ngModelChange)="actualizarNumero('pisa', $event)"
                />
              </div>

              <div class="field-group">
                <label class="field-label" for="durInput">Piso de duración (dur ms)</label>
                <input
                  id="durInput"
                  type="number"
                  class="field-input"
                  step="100"
                  min="0"
                  max="15000"
                  [ngModel]="line.dur ?? 0"
                  (ngModelChange)="actualizarNumero('dur', $event)"
                />
              </div>

              <div class="field-group field-group--checkbox">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    class="field-checkbox"
                    [ngModel]="line.junto ?? false"
                    (ngModelChange)="actualizarCampo('junto', $event)"
                  />
                  <span>Arranca simultánea con la anterior (junto)</span>
                </label>
              </div>
            </div>

            <!-- Métricas de la línea -->
            <div class="metrics-card">
              <div class="metrics-row">
                <span class="metrics-label">Ventana en tiempo:</span>
                <span class="metrics-val">
                  {{ ((line.t1 - line.t0) / 1000).toFixed(2) }}s ({{ (line.t0 / 1000).toFixed(1) }}s
                  → {{ (line.t1 / 1000).toFixed(1) }}s)
                </span>
              </div>
            </div>

            <!-- Acciones de estructura -->
            <div class="actions-row">
              <button
                class="btn-action"
                type="button"
                (click)="state.agregarLinea(line.id)"
                title="Insertar una nueva línea después de esta"
              >
                + Insertar línea
              </button>
              <button
                class="btn-action btn-action--danger"
                type="button"
                (click)="state.eliminarLinea(line.id)"
                title="Eliminar esta línea del guion"
              >
                🗑 Eliminar
              </button>
            </div>
          } @else {
            <!-- Estado vacío con invitación a elegir -->
            <div class="inspector__empty">
              <div class="empty-icon">🎯</div>
              <p class="empty-title">Ninguna línea seleccionada</p>
              <p class="empty-desc">
                Seleccioná una línea en el timeline inferior o elegí una del guion para editarla.
              </p>
              <button type="button" class="btn-action" (click)="seleccionarPrimeraLinea()">
                Editar primera línea (#1)
              </button>
            </div>
          }
        </div>
      }

      <!-- Contenido de la pestaña GUION COMPLETO (Flex-1 a pantalla completa) -->
      @if (tabActiva() === 'guion') {
        <div class="guion-section">
          <!-- Barra de búsqueda y filtros -->
          <div class="guion-filters">
            <input
              type="search"
              class="guion-search-input"
              placeholder="🔍 Filtrar diálogo o personaje..."
              [ngModel]="filtroTexto()"
              (ngModelChange)="filtroTexto.set($event)"
            />
            <div class="personajes-filter-row">
              <button
                type="button"
                class="filter-chip"
                [class.filter-chip--active]="filtroPersonaje() === null"
                (click)="filtroPersonaje.set(null)"
              >
                Todos ({{ state.reloj().length }})
              </button>
              @for (p of personajes; track p.id) {
                <button
                  type="button"
                  class="filter-chip"
                  [class.filter-chip--active]="filtroPersonaje() === p.id"
                  [style.--chip-c]="p.color"
                  (click)="filtroPersonaje.set(p.id)"
                >
                  {{ p.nombre }}
                </button>
              }
            </div>
          </div>

          <!-- Lista que ocupa el 100% del espacio vertical -->
          <div class="guion-scroll-list">
            @for (l of lineasFiltradas(); track l.id; let idx = $index) {
              <button
                type="button"
                class="guion-card"
                [class.guion-card--selected]="state.selectedLineId() === l.id"
                (click)="seleccionarYVer(l)"
              >
                <div class="guion-card__top">
                  <span class="guion-card__num">#{{ l.id }}</span>
                  <span class="guion-card__who guion-card__who--{{ l.quien }}">{{ l.quien }}</span>
                  <span class="guion-card__time">{{ (l.t0 / 1000).toFixed(1) }}s</span>
                  <span class="guion-card__dur">{{ ((l.t1 - l.t0) / 1000).toFixed(1) }}s</span>
                </div>
                <p class="guion-card__txt">{{ l.txt }}</p>
              </button>
            } @empty {
              <div class="guion-empty">
                No hay diálogos que coincidan con "{{ filtroTexto() }}".
              </div>
            }
          </div>
        </div>
      }
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }
      .inspector {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 360px;
        background: #0f1319;
        border-left: 1px solid rgba(255, 255, 255, 0.08);
        height: 100%;
        overflow: hidden;
        font-family:
          system-ui,
          -apple-system,
          sans-serif;
        color: #e2e8f0;
        box-sizing: border-box;
      }
      .inspector__header {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: #0d1117;
        flex-shrink: 0;
      }
      .inspector__tabs {
        display: flex;
        gap: 6px;
        width: 100%;
      }
      .tab-btn {
        flex: 1;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 4px;
        color: #94a3b8;
        padding: 5px 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: all 0.12s;
      }
      .tab-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #e2e8f0;
      }
      .tab-btn--active {
        background: rgba(56, 189, 248, 0.12);
        color: #38bdf8;
        border-color: rgba(56, 189, 248, 0.3);
      }
      .tab-badge {
        font-size: 10px;
        background: rgba(255, 255, 255, 0.1);
        padding: 1px 5px;
        border-radius: 10px;
        font-family: monospace;
      }
      .tab-btn--active .tab-badge {
        background: rgba(56, 189, 248, 0.25);
        color: #38bdf8;
      }

      /* Inspector Content / Form */
      .inspector__content {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      }
      .inspector__content::-webkit-scrollbar {
        width: 6px;
      }
      .inspector__content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      .line-nav-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 4px;
        padding: 4px 8px;
      }
      .btn-nav {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        color: #cbd5e1;
        padding: 2px 8px;
        font-size: 11px;
        cursor: pointer;
      }
      .btn-nav:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
      }
      .btn-nav:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .line-nav-pos {
        font-size: 11px;
        color: #94a3b8;
        font-weight: 500;
      }

      .field-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .field-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .field-label {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .field-hint {
        font-size: 10px;
        color: #64748b;
      }
      .field-textarea {
        background: #090c10;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 4px;
        color: #f1f5f9;
        padding: 8px;
        font-size: 13px;
        line-height: 1.4;
        font-family: inherit;
        resize: vertical;
        outline: none;
      }
      .field-textarea:focus {
        border-color: #38bdf8;
      }
      .field-input {
        background: #090c10;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 4px;
        color: #f1f5f9;
        padding: 5px 8px;
        font-size: 12px;
        font-family: 'JetBrains Mono', Consolas, monospace;
        outline: none;
      }
      .field-input:focus {
        border-color: #38bdf8;
      }

      .hablante-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .hablante-chip {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: #cbd5e1;
        padding: 3px 6px;
        font-size: 10px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.12s;
      }
      .hablante-chip:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      .hablante-chip--active {
        background: rgba(255, 255, 255, 0.12);
        border-color: var(--chip-color, #38bdf8);
        color: #ffffff;
      }
      .hablante-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--chip-color, #94a3b8);
      }

      .timing-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        background: rgba(255, 255, 255, 0.02);
        padding: 10px;
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .field-group--checkbox {
        grid-column: span 2;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: #cbd5e1;
        cursor: pointer;
      }

      .metrics-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 4px;
        padding: 8px 10px;
      }
      .metrics-row {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
      }
      .metrics-label {
        color: #64748b;
      }
      .metrics-val {
        color: #38bdf8;
        font-family: monospace;
        font-weight: 500;
      }

      .actions-row {
        display: flex;
        gap: 8px;
      }
      .btn-action {
        flex: 1;
        background: rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 4px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.12s;
        text-align: center;
      }
      .btn-action:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }
      .btn-action--voice {
        flex: initial;
        padding: 2px 7px;
        font-size: 10px;
      }
      .btn-action--danger {
        color: #f87171;
        border-color: rgba(239, 68, 68, 0.25);
      }
      .btn-action--danger:hover {
        background: rgba(239, 68, 68, 0.15);
      }

      .inspector__empty {
        padding: 30px 16px;
        text-align: center;
        border: 1px dashed rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .empty-icon {
        font-size: 24px;
      }
      .empty-title {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0;
      }
      .empty-desc {
        font-size: 11px;
        color: #64748b;
        margin: 0 0 8px 0;
      }

      /* GUION SECTION (Full Height) */
      .guion-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
      }
      .guion-filters {
        padding: 8px 10px;
        background: #0d1117;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex-shrink: 0;
      }
      .guion-search-input {
        background: #090c10;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: #f1f5f9;
        padding: 5px 8px;
        font-size: 11px;
        outline: none;
      }
      .guion-search-input:focus {
        border-color: #38bdf8;
      }
      .personajes-filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .filter-chip {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 3px;
        color: #94a3b8;
        padding: 2px 5px;
        font-size: 9px;
        cursor: pointer;
        transition: all 0.12s;
      }
      .filter-chip:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #f1f5f9;
      }
      .filter-chip--active {
        background: rgba(56, 189, 248, 0.15);
        border-color: #38bdf8;
        color: #38bdf8;
        font-weight: 600;
      }

      .guion-scroll-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      }
      .guion-scroll-list::-webkit-scrollbar {
        width: 6px;
      }
      .guion-scroll-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      .guion-card {
        padding: 7px 9px;
        background: #090c10;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.12s;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .guion-card:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.12);
      }
      .guion-card--selected {
        background: rgba(56, 189, 248, 0.12);
        border-color: #38bdf8;
        box-shadow: 0 0 8px rgba(56, 189, 248, 0.2);
      }
      .guion-card__top {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .guion-card__num {
        font-size: 10px;
        color: #475569;
        font-family: monospace;
      }
      .guion-card__who {
        font-size: 9px;
        font-weight: 700;
        padding: 1px 4px;
        border-radius: 2px;
        text-transform: uppercase;
      }
      .guion-card__who--cap {
        background: rgba(238, 241, 244, 0.15);
        color: #eef1f4;
      }
      .guion-card__who--naveA,
      .guion-card__who--naveB {
        background: rgba(196, 205, 219, 0.15);
        color: #c4cddb;
      }
      .guion-card__who--nave4 {
        background: rgba(127, 214, 189, 0.15);
        color: #7fd6bd;
      }
      .guion-card__who--voz {
        background: rgba(240, 180, 88, 0.15);
        color: #f0b458;
      }
      .guion-card__who--mascota {
        background: rgba(244, 236, 224, 0.15);
        color: #f4ece0;
      }
      .guion-card__who--todos {
        background: rgba(246, 217, 192, 0.15);
        color: #f6d9c0;
      }
      .guion-card__time {
        margin-left: auto;
        font-size: 10px;
        color: #38bdf8;
        font-family: monospace;
      }
      .guion-card__dur {
        font-size: 9px;
        color: #64748b;
        font-family: monospace;
      }
      .guion-card__txt {
        margin: 0;
        font-size: 11px;
        color: #cbd5e1;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .guion-empty {
        padding: 24px 12px;
        text-align: center;
        color: #64748b;
        font-size: 11px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioInspectorComponent {
  readonly state = inject(StudioStateService);

  readonly tabActiva = signal<'editor' | 'guion'>('editor');
  readonly filtroTexto = signal<string>('');
  readonly filtroPersonaje = signal<Hablante | null>(null);

  readonly personajes: PersonajeOpcion[] = [
    { id: 'cap', nombre: 'Capitán', color: '#eef1f4' },
    { id: 'naveA', nombre: 'Nave A', color: '#c4cddb' },
    { id: 'naveB', nombre: 'Nave B', color: '#c4cddb' },
    { id: 'nave4', nombre: 'Exploradora', color: '#7fd6bd' },
    { id: 'todos', nombre: 'Todos', color: '#f6d9c0' },
    { id: 'voz', nombre: 'La Voz', color: '#f0b458' },
    { id: 'mascota', nombre: 'Mascota', color: '#f4ece0' },
  ];

  readonly indiceLineaActual = computed(() => {
    const selId = this.state.selectedLineId();
    if (!selId) return -1;
    return this.state.reloj().findIndex((l) => l.id === selId);
  });

  readonly lineasFiltradas = computed(() => {
    let list = this.state.reloj();
    const fPers = this.filtroPersonaje();
    if (fPers) {
      list = list.filter((l) => l.quien === fPers);
    }
    const txt = this.filtroTexto().trim().toLowerCase();
    if (txt) {
      list = list.filter(
        (l) => l.txt.toLowerCase().includes(txt) || l.quien.toLowerCase().includes(txt),
      );
    }
    return list;
  });

  seleccionarPrimeraLinea(): void {
    const reloj = this.state.reloj();
    if (reloj.length > 0) {
      this.state.selectLine(reloj[0].id);
      this.state.seek(reloj[0].t0);
    }
  }

  seleccionarYVer(l: LineaEnReloj): void {
    this.state.selectLine(l.id);
    this.state.seek(l.t0);
    this.tabActiva.set('editor');
  }

  navegarLinea(delta: number): void {
    const reloj = this.state.reloj();
    const idx = this.indiceLineaActual();
    if (idx === -1) {
      if (reloj.length > 0) this.state.selectLine(reloj[0].id);
      return;
    }
    const nuevoIdx = Math.max(0, Math.min(reloj.length - 1, idx + delta));
    const target = reloj[nuevoIdx];
    this.state.selectLine(target.id);
    this.state.seek(target.t0);
  }

  actualizarCampo(campo: string, valor: unknown): void {
    const line = this.state.selectedLine();
    if (!line) return;
    this.state.actualizarLinea(line.id, { [campo]: valor });
  }

  actualizarNumero(campo: string, valor: number | string): void {
    const line = this.state.selectedLine();
    if (!line) return;
    const num = Number(valor);
    this.state.actualizarLinea(line.id, { [campo]: isNaN(num) || num === 0 ? undefined : num });
  }

  probarVoz(line: LineaEnReloj): void {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(line.txt.replace(/\n/g, ' '));
    u.lang = 'es-ES';
    if (line.quien === 'cap') u.pitch = 0.85;
    else if (line.quien === 'nave4') u.pitch = 1.25;
    else if (line.quien === 'mascota') u.pitch = 1.15;
    speechSynthesis.speak(u);
  }
}
