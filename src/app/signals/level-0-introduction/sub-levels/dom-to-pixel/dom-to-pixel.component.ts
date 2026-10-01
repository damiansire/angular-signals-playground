import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import {
  MutationKind,
  RenderStage,
  RenderCost,
  stagesTriggered,
  renderCost,
  saltoDelFlujo,
} from '../../../../libs/render-pipeline';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { DOM_PIXEL_SYSTEM } from '../../introduction-systems';

interface MutationDemo {
  kind: MutationKind;
  label: string;
  code: string;
}

interface Station {
  id: 'DOM' | RenderStage;
  x: number;
}

/** Camino que el "flujo" recorre según el costo: cuánto de la línea salta. */
const FLOW_PATHS: Record<RenderCost, string> = {
  // recta completa: no salta nada.
  caro: 'M60,150 L940,150',
  // hop chico sobre `layout` (style -> paint).
  medio: 'M60,150 L280,150 C 385,55 595,55 700,150 L940,150',
  // arco grande sobre la zona cara entera (style -> composite): pasa por `style`, que un cambio de
  // transform/opacity sí dispara, y se saltea layout y paint, que es lo que dice el texto de abajo.
  barato: 'M60,150 L280,150 C 480,20 740,20 940,150',
};

/** Duraciones del dibujo del flujo vertical (s): las de `dtp-vtramo` y `dtp-vsalto` en el CSS. */
const DIBUJO_TRAMO = 0.14;
const DIBUJO_ARCO = 0.4;

/** Pintan el flujo y la palabra del costo, que tiene que llegar a 3:1 (texto grande) aun sobre la
 *  parte más oscura de la escena, el centro del átomo, donde cae en angosto: #15905a, #b5730f y
 *  #d92626 quedaban a 2.5-2.9:1. */
const COST_COLOR: Record<RenderCost, string> = {
  barato: '#0b6a40',
  medio: '#7a4a0a',
  caro: '#b91c1c',
};

@Component({
  selector: 'app-dom-to-pixel',
  templateUrl: './dom-to-pixel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent],
  styleUrl: './dom-to-pixel.component.css',
})
export class DomToPixelComponent {
  readonly closingSystem = DOM_PIXEL_SYSTEM;
  protected readonly stations: readonly Station[] = [
    { id: 'DOM', x: 60 },
    { id: 'style', x: 280 },
    { id: 'layout', x: 490 },
    { id: 'paint', x: 700 },
    { id: 'composite', x: 940 },
  ];
  protected readonly demos: readonly MutationDemo[] = [
    {
      kind: 'transform',
      label: 'Mover con transform',
      code: "el.style.transform = 'translateX(20px)'",
    },
    { kind: 'color', label: 'Cambiar color', code: "el.style.color = 'crimson'" },
    { kind: 'textContent', label: 'Cambiar el texto', code: "el.textContent = '1'" },
    { kind: 'geometry', label: 'Cambiar el ancho', code: "el.style.width = '200px'" },
  ];

  // Arranca en "cambiar el texto": el caso caro, la línea completa como baseline.
  protected readonly selected = signal<MutationDemo>(this.demos[2]);
  protected readonly triggered = computed(
    () => new Set<RenderStage>(stagesTriggered(this.selected().kind)),
  );
  protected readonly cost = computed<RenderCost>(() => renderCost(this.selected().kind));
  protected readonly flowPath = computed(() => FLOW_PATHS[this.cost()]);
  protected readonly pulsePath = computed(() => `path("${this.flowPath()}")`);
  protected readonly costColor = computed(() => COST_COLOR[this.cost()]);
  /** En el pipeline vertical, las filas que abarca el arco del salto (`grid-row`), o `null`. */
  protected readonly filasDelSalto = computed(() => {
    const salto = saltoDelFlujo(this.selected().kind);
    if (!salto) return null;
    const fila = (id: Station['id']): number => this.stations.findIndex((s) => s.id === id) + 1;
    return `${fila(salto.desde)} / ${fila(salto.hasta) + 1}`;
  });

  protected pick(demo: MutationDemo): void {
    this.selected.set(demo);
  }

  protected stageOn(id: Station['id']): boolean {
    return id !== 'DOM' && this.triggered().has(id);
  }

  /** El tramo de la estación `i` a la siguiente lo recorre el flujo (no queda bajo el salto). */
  protected tramoDirecto(i: number): boolean {
    const siguiente = this.stations[i + 1];
    if (!siguiente) return false;
    return (i === 0 || this.stageOn(this.stations[i].id)) && this.stageOn(siguiente.id);
  }

  /**
   * Cuándo arranca cada pieza del flujo vertical (en segundos): se dibuja como el SVG, de arriba
   * hacia abajo, una pieza detrás de otra, y el arco del salto ocupa su turno entre los tramos.
   */
  protected readonly retrasos = computed(() => {
    const salto = saltoDelFlujo(this.selected().kind);
    const tramos: (number | null)[] = [];
    let arco: number | null = null;
    let t = 0;
    for (let i = 0; i < this.stations.length - 1; i++) {
      if (this.tramoDirecto(i)) {
        tramos.push(t);
        t += DIBUJO_TRAMO;
      } else {
        tramos.push(null);
        if (salto && arco === null && this.stations[i].id === salto.desde) {
          arco = t;
          t += DIBUJO_ARCO;
        }
      }
    }
    return { tramos, arco };
  });
}
