import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Vista integrada: el sistema reactivo se arma como una MOLÉCULA que crece. Al
 * scrollear, cada escena suma un átomo (círculo-concepto) que se queda y se
 * engancha a los anteriores; una órbita punteada crece alrededor del cluster.
 * Escena 1 → aparece signal; escena 2 → aparece computed pero signal se mantiene;
 * y así hasta zoneless.
 *
 * Todo se maneja con signals + bindings (no animation-timeline ni IO): el estado
 * cae del `scroll` por CD, fiable aun con el pane oculto (la CD no se congela).
 */
type Accent = 'source' | 'derived' | 'effect' | 'ink' | 'capstone';

interface Concept {
  id: string;
  name: string;
  concept: string;
  accent: Accent;
  /** Punteado = derivado/ghost (computed, linkedSignal, resource). */
  dotted: boolean;
}

interface Atom extends Concept {
  x: number;
  y: number;
}

const CENTER_X = 400;
const CENTER_Y = 300;
const SPACING = 54;
const GOLDEN = 2.399963229728653; // ángulo áureo en radianes

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

  private readonly concepts: readonly Concept[] = [
    {
      id: '0',
      name: 'Introducción',
      concept: 'detección de cambios',
      accent: 'ink',
      dotted: false,
    },
    { id: '1', name: 'Interactuar', concept: 'signal()', accent: 'source', dotted: false },
    { id: '2', name: 'Derivar', concept: 'computed()', accent: 'derived', dotted: true },
    { id: '3', name: 'Efectos', concept: 'effect()', accent: 'effect', dotted: false },
    { id: '4', name: 'Igualdad', concept: 'equality', accent: 'source', dotted: false },
    { id: '5', name: 'Enlazar', concept: 'linkedSignal()', accent: 'derived', dotted: true },
    { id: '6', name: 'Asíncrono', concept: 'resource()', accent: 'derived', dotted: true },
    {
      id: '7',
      name: 'Entradas y salidas',
      concept: 'input · model · output',
      accent: 'source',
      dotted: false,
    },
    {
      id: '8',
      name: 'Consultas e interop',
      concept: 'viewChild · toSignal',
      accent: 'ink',
      dotted: true,
    },
    {
      id: '9',
      name: 'Tras el render',
      concept: 'afterRenderEffect()',
      accent: 'effect',
      dotted: false,
    },
    { id: '10', name: 'Con retardo', concept: 'debounce', accent: 'effect', dotted: true },
    {
      id: '11',
      name: 'Zoneless',
      concept: 'provideZonelessChangeDetection()',
      accent: 'capstone',
      dotted: false,
    },
  ];

  /** Posiciones en espiral áurea: el cluster crece orgánico, como una molécula. */
  readonly atoms: readonly Atom[] = this.concepts.map((c, i) => {
    const r = SPACING * Math.sqrt(i);
    const a = i * GOLDEN;
    return { ...c, x: CENTER_X + r * Math.cos(a), y: CENTER_Y + r * Math.sin(a) };
  });

  /** Enlaces: cada átomo se engancha al anterior (cadena que serpentea el cluster). */
  readonly bonds = this.atoms.slice(1).map((atom, i) => ({
    x1: this.atoms[i].x,
    y1: this.atoms[i].y,
    x2: atom.x,
    y2: atom.y,
    at: i + 1,
  }));

  private readonly scroll = signal(0);
  private readonly viewport = signal(typeof window !== 'undefined' ? window.innerHeight : 800);

  /** Alto total: una pantalla de scroll por escena. */
  readonly trackHeight = computed(() => this.atoms.length * this.viewport());
  /** Cuántos átomos ya aparecieron (1..N), según el scroll. */
  readonly revealed = computed(() => {
    const seg = this.viewport();
    const n = seg ? Math.floor(this.scroll() / seg) + 1 : 1;
    return Math.max(1, Math.min(this.atoms.length, n));
  });
  /** El átomo recién sumado (para el cartel y el enlace al nivel). */
  readonly current = computed(() => this.atoms[this.revealed() - 1]);
  /** Radio de la órbita punteada, que crece con el cluster. */
  readonly orbitR = computed(() => SPACING * Math.sqrt(Math.max(0, this.revealed() - 1)) + 74);

  constructor() {
    if (typeof window === 'undefined') return;
    // set directo (sin rAF): la CD corre aun con el pane oculto.
    const onScroll = () => this.scroll.set(this.host.scrollTop);
    const onResize = () => this.viewport.set(this.host.clientHeight || window.innerHeight);
    this.host.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const t = setTimeout(onResize, 0);
    this.destroyRef.onDestroy(() => {
      clearTimeout(t);
      this.host.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    });
  }

  levelLink(id: string): string {
    return `/signals/level/${id}/sub-level/1`;
  }

  isShown(i: number): boolean {
    return i < this.revealed();
  }
}
