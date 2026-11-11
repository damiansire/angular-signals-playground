import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { dibujarNave, el, gradientesDeNaves } from './nave-del-prologo';

let instancias = 0;

/**
 * La cara de quien habla en la caja de diálogo: la misma nave del cielo, de frente a la charla. Sin
 * animación propia: la que se mueve es la del cielo, y el retrato solo dice quién es.
 */
@Component({
  selector: 'app-retrato-de-nave',
  template: `<svg #lienzo viewBox="-78 -64 166 116" aria-hidden="true" focusable="false"></svg>`,
  styles: `
    :host {
      display: block;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetratoDeNaveComponent {
  readonly indice = input.required<number>();
  private readonly lienzo = viewChild.required<ElementRef<SVGSVGElement>>('lienzo');
  private readonly id = `rn${++instancias}`;

  constructor() {
    effect(() => {
      const svg = this.lienzo().nativeElement;
      svg.replaceChildren();
      const defs = el(svg, 'defs');
      gradientesDeNaves(defs, this.id);
      dibujarNave(el(svg, 'g'), this.indice(), defs, this.id).pose.style.cursor = '';
    });
  }
}
