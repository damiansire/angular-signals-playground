import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Hub del "banco de laboratorio": landing que reúne los cuatro instrumentos.
 * No es un hero genérico de 3 tarjetas: es un RACK de placas de instrumento,
 * cada una con su acento semántico y su concepto en mono, sobre el mismo banco
 * grafito. La unidad la dan el panel, los tornillos y el código de color.
 */
type Accent = 'source' | 'derived' | 'effect' | 'manual';

interface Instrument {
  no: string;
  name: string;
  concept: string;
  accent: Accent;
  blurb: string;
  link: string;
}

@Component({
    selector: 'app-lab-hub',
    imports: [RouterLink],
    templateUrl: './lab-hub.component.html',
    styleUrl: './lab-hub.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabHubComponent {
  readonly instruments: readonly Instrument[] = [
    {
      no: '01',
      name: 'Patchbay',
      concept: 'signal()',
      accent: 'source',
      blurb: 'Una fuente editable = una perilla física. El cable transporta el valor.',
      link: '/lab/signal',
    },
    {
      no: '02',
      name: 'Oscilloscope',
      concept: 'effect()',
      accent: 'effect',
      blurb: 'Un efecto imperativo que se dispara y se mide en cada cambio. La traza salta.',
      link: '/lab/effect',
    },
    {
      no: '03',
      name: 'Cells',
      concept: 'computed()',
      accent: 'derived',
      blurb: 'Celdas con fórmula que recalculan solas, en cascada, al cambiar la fuente.',
      link: '/lab/computed',
    },
    {
      no: '04',
      name: 'Manual',
      concept: 'the graph',
      accent: 'manual',
      blurb: 'Teoría y gotchas: el diamante de dependencias y la garantía glitch-free.',
      link: '/lab/manual',
    },
  ];
}
