import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  afterNextRender,
  createComponent,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { OscilloscopeComponent } from '../lab/instruments/oscilloscope/oscilloscope.component';
import { ReactiveCellsComponent } from '../lab/instruments/reactive-cells/reactive-cells.component';
import { initMolecule, type MountLab } from './molecule-engine';

/**
 * Vista integrada: el recorrido de los 12 conceptos como una MOLÉCULA reactiva.
 * Cada concepto nace como átomo del anterior; al scrollear, la cámara bucea a su
 * contenido y sus sub-niveles orbitan la card acoplándose por fuera.
 *
 * La animación es imperativa (SVG/canvas/cámara/wheel-stepping) y vive en
 * `molecule-engine`; se arranca en `afterNextRender` (solo browser) y el cleanup
 * corta rAF, timers y listeners. El "adentro" de Computed y Effects embebe los
 * instrumentos REALES del Lab (`mountLab`).
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

  constructor() {
    afterNextRender(() => {
      // Nombre del atributo de encapsulación (p.ej. `_ngcontent-ng-c12345`) que Angular pone
      // a los elementos del template; el motor lo estampa en lo que crea a mano para que el
      // CSS scopeado del componente les aplique.
      const enc =
        this.host.querySelector('#stage')?.getAttributeNames().find((a) => a.startsWith('_ngcontent')) ??
        null;
      const dispose = initMolecule(this.host, this.mountLab, enc);
      this.destroyRef.onDestroy(dispose);
    });
  }

  /** Monta el instrumento real del Lab dentro del slot de la card y lo integra a la CD. */
  private readonly mountLab: MountLab = (host, kind) => {
    const ref =
      kind === 'computed'
        ? createComponent(ReactiveCellsComponent, { environmentInjector: this.env, hostElement: host })
        : createComponent(OscilloscopeComponent, { environmentInjector: this.env, hostElement: host });
    this.appRef.attachView(ref.hostView);
    return () => {
      this.appRef.detachView(ref.hostView);
      ref.destroy();
    };
  };
}
