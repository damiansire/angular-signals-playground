import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  Type,
  afterNextRender,
  createComponent,
  inject,
} from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

import { signalsRoutesTree } from '../app.routes';
import { initMolecule, type MountSub } from './molecule-engine';

/**
 * Vista integrada: el recorrido de los 12 conceptos como una MOLÉCULA reactiva.
 * Cada concepto es un átomo; al scrollear, la cámara bucea a su contenido y sus
 * sub-niveles orbitan la card. Cada sub-nivel EMBEBE el componente REAL de
 * `/signals/level/X/sub-level/Z` (sacado de `signalsRoutesTree`), así toda la app
 * de niveles vive dentro de esta única vista.
 *
 * La animación es imperativa (SVG/cámara/scroll-snap) y vive en `molecule-engine`;
 * se arranca en `afterNextRender` (solo browser) y el cleanup corta rAF y listeners.
 */
@Component({
  selector: 'app-integrada-vista',
  imports: [RouterLink],
  templateUrl: './integrada-vista.component.html',
  styleUrl: './integrada-vista.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegradaVistaComponent {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly env = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);
  private readonly location = inject(Location);

  /** Componentes reales de cada sub-nivel, por concepto (del árbol de rutas de /signals). */
  private readonly subComponents: Type<unknown>[][] = signalsRoutesTree.map((lvl) =>
    (lvl.subLevels ?? []).map((sl) => sl.component),
  );

  constructor() {
    afterNextRender(() => {
      // Nombre del atributo de encapsulación que Angular pone a los elementos del template;
      // el motor lo estampa en lo que crea a mano para que el CSS scopeado les aplique.
      const enc =
        this.host.querySelector('#stage')?.getAttributeNames().find((a) => a.startsWith('_ngcontent')) ??
        null;
      const subCounts = this.subComponents.map((subs) => subs.length);
      const dispose = initMolecule(this.host, this.mountSub, subCounts, enc, this.onWhere, this.initialFromUrl());
      this.destroyRef.onDestroy(dispose);
    });
  }

  /** Deep-link: lee ?nivel=X&sub-nivel=Z de la URL para abrir el recorrido en ese sub-nivel. */
  private initialFromUrl(): { concept: number; sub: number } | null {
    const params = new URLSearchParams(window.location.search);
    const nivel = Number(params.get('nivel'));
    const sub = Number(params.get('sub-nivel'));
    if (!Number.isInteger(nivel) || nivel < 0 || !Number.isInteger(sub) || sub < 1) return null;
    return { concept: nivel, sub };
  }

  /**
   * Refleja el nivel/sub-nivel actual del recorrido en la URL sin navegar ni recargar.
   * `replaceState` reescribe la barra (respetando el base href) sin pasar por el Router,
   * así el componente no se desmonta ni se pierde el scroll. `subIdx` -1 = vista molécula.
   */
  private readonly onWhere = (conceptIdx: number, subIdx: number): void => {
    const query =
      subIdx >= 0 ? `nivel=${conceptIdx}&sub-nivel=${subIdx + 1}` : `nivel=${conceptIdx}`;
    this.location.replaceState('/integrada-vista', query);
  };

  /** Monta el componente REAL del sub-nivel (concepto ci, sub si) y lo integra a la CD. */
  private readonly mountSub: MountSub = (host, ci, si) => {
    const type = this.subComponents[ci]?.[si];
    if (!type) return { dispose: () => undefined, reveal: null };
    // No pasamos `hostElement: host`: al destruir, `ref.destroy()` borraría ESE nodo, y `host`
    // es la `.subhost` persistente de la card. Creamos el componente en su propio nodo y lo
    // appendeamos adentro; así `destroy()` solo se lleva el nodo del componente, no la `.subhost`.
    const ref = createComponent(type, { environmentInjector: this.env });
    host.appendChild(ref.location.nativeElement);
    this.appRef.attachView(ref.hostView);
    // La app es zoneless: montar desde el listener nativo de scroll no agenda ningún tick,
    // así que la vista recién adjuntada nunca correría su primera CD y quedaría en blanco.
    // Forzamos la detección inicial acá; las interacciones posteriores ya agendan su propio tick.
    ref.changeDetectorRef.detectChanges();
    // Reveal opcional: si el sub-nivel expone revealTo/revealStepCount (hoy html-to-tree), el motor
    // usa esta API para gatear el scroll. `to()` fuerza CD porque muta signals fuera del ciclo.
    const inst = ref.instance as {
      revealTo?: (n: number) => void;
      revealStepCount?: () => number;
    };
    const reveal =
      typeof inst.revealTo === 'function' && typeof inst.revealStepCount === 'function'
        ? {
            get steps(): number {
              return inst.revealStepCount!();
            },
            to: (n: number): void => {
              inst.revealTo!(n);
              ref.changeDetectorRef.detectChanges();
            },
          }
        : null;
    return {
      dispose: () => {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
      },
      reveal,
    };
  };
}
