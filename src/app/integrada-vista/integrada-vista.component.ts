import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Vista integrada: la primera versión del recorrido, revivida. Los 12 niveles
 * como estaciones sobre una columna vertical; cada una aparece con un rebote
 * (spring) a medida que entra al viewport al scrollear. Sin estado dinámico:
 * es un mapa; la reactividad vive adentro de cada nivel.
 *
 * El reveal va por scroll listener + getBoundingClientRect (no IntersectionObserver
 * ni animation-timeline: view(), que dieron timing/scrubbing poco fiables acá).
 * El rAF dentro de afterNextRender garantiza que el @for ya esté maquetado.
 */
type Accent = 'source' | 'derived' | 'effect' | 'ink' | 'capstone';

interface Stop {
  id: string;
  name: string;
  concept: string;
  accent: Accent;
}

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

  /** Ruta al primer sub-nivel de cada nivel. */
  levelLink(id: string): string {
    return `/signals/level/${id}/sub-level/1`;
  }

  readonly stops: readonly Stop[] = [
    { id: '0', name: 'Introducción', concept: 'detección de cambios', accent: 'ink' },
    { id: '1', name: 'Interactuar', concept: 'signal()', accent: 'source' },
    { id: '2', name: 'Derivar', concept: 'computed()', accent: 'derived' },
    { id: '3', name: 'Efectos', concept: 'effect()', accent: 'effect' },
    { id: '4', name: 'Igualdad', concept: 'equality', accent: 'source' },
    { id: '5', name: 'Enlazar', concept: 'linkedSignal()', accent: 'derived' },
    { id: '6', name: 'Asíncrono', concept: 'resource()', accent: 'derived' },
    { id: '7', name: 'Entradas y salidas', concept: 'input · model · output', accent: 'source' },
    { id: '8', name: 'Consultas e interop', concept: 'viewChild · toSignal', accent: 'ink' },
    { id: '9', name: 'Tras el render', concept: 'afterRenderEffect()', accent: 'effect' },
    { id: '10', name: 'Con retardo', concept: 'debounce', accent: 'effect' },
    { id: '11', name: 'Zoneless', concept: 'provideZonelessChangeDetection()', accent: 'capstone' },
  ];

  constructor() {
    if (typeof window === 'undefined') return;
    const reduceMotion =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Se re-consultan las `.stop` en cada llamada: así no importa si el @for aún
    // no estaba estampado cuando arrancó el componente.
    const reveal = () => {
      const stops = this.host.querySelectorAll<HTMLElement>('.stop');
      const limit = reduceMotion ? Infinity : this.host.clientHeight * 0.85;
      stops.forEach((s) => {
        if (!s.classList.contains('in') && s.getBoundingClientRect().top < limit) {
          s.classList.add('in');
        }
      });
    };

    // Pases iniciales: revelan las estaciones ya visibles al cargar (la transición
    // full-bleed arranca con el host en 0, por eso varios tiempos hasta que asienta).
    const timers = [0, 100, 300, 600].map((t) => setTimeout(reveal, t));
    // Y el scroll revela el resto a medida que bajás.
    this.host.addEventListener('scroll', reveal, { passive: true });
    this.destroyRef.onDestroy(() => {
      timers.forEach(clearTimeout);
      this.host.removeEventListener('scroll', reveal);
    });
  }
}
