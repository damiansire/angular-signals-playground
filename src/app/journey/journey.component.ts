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
 * El recorrido como viaje con zoom-dive: cada concepto aparece pequeño, al
 * scrollear te metés adentro (crece hasta ser el mundo), lo recorrés y al seguir
 * lo atravesás mientras el siguiente emerge. Un solo lienzo continuo, no una
 * lista. La barra lateral marca dónde estás en el viaje de 0 a 11.
 *
 * El scroll maneja todo: `scroll` (posición) alimenta el estilo de cada escena
 * (opacidad + escala) y el punto de la barra. Con `prefers-reduced-motion` el
 * CSS apila las escenas como lista legible y el zoom se apaga.
 */
type Accent = 'source' | 'derived' | 'effect' | 'ink' | 'capstone';

interface Stop {
  id: string;
  name: string;
  concept: string;
  blurb: string;
  accent: Accent;
}

interface SceneStyle {
  opacity: string;
  transform: string;
  zIndex: string;
  'pointer-events': string;
}

@Component({
  selector: 'app-journey',
  imports: [RouterLink],
  templateUrl: './journey.component.html',
  styleUrl: './journey.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JourneyComponent {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);

  readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Posición de scroll (px) y alto del viewport, ambos reactivos. */
  private readonly scroll = signal(0);
  private readonly viewport = signal(typeof window !== 'undefined' ? window.innerHeight : 800);

  readonly stops: readonly Stop[] = [
    {
      id: '0',
      name: 'Introducción',
      concept: 'detección de cambios',
      blurb: 'Cómo Angular decide qué volver a dibujar.',
      accent: 'ink',
    },
    {
      id: '1',
      name: 'Interactuar',
      concept: 'signal()',
      blurb: 'Un valor que avisa cuando cambia.',
      accent: 'source',
    },
    {
      id: '2',
      name: 'Derivar',
      concept: 'computed()',
      blurb: 'Estado que se calcula solo desde otro.',
      accent: 'derived',
    },
    {
      id: '3',
      name: 'Efectos',
      concept: 'effect()',
      blurb: 'Correr algo cada vez que algo cambia.',
      accent: 'effect',
    },
    {
      id: '4',
      name: 'Igualdad',
      concept: 'equality',
      blurb: 'Cuándo un signal NO avisa a sus consumidores.',
      accent: 'source',
    },
    {
      id: '5',
      name: 'Enlazar',
      concept: 'linkedSignal()',
      blurb: 'Estado escribible que nace de una fuente.',
      accent: 'derived',
    },
    {
      id: '6',
      name: 'Asíncrono',
      concept: 'resource()',
      blurb: 'Datos que llegan: value, status, error.',
      accent: 'derived',
    },
    {
      id: '7',
      name: 'Entradas y salidas',
      concept: 'input · model · output',
      blurb: 'El API de un componente, en signals.',
      accent: 'source',
    },
    {
      id: '8',
      name: 'Consultas e interop',
      concept: 'viewChild · toSignal',
      blurb: 'Ver el DOM y convivir con RxJS.',
      accent: 'ink',
    },
    {
      id: '9',
      name: 'Tras el render',
      concept: 'afterRenderEffect()',
      blurb: 'Medir el DOM justo después de dibujar.',
      accent: 'effect',
    },
    {
      id: '10',
      name: 'Con retardo',
      concept: 'debounce',
      blurb: 'Un valor que espera antes de propagarse.',
      accent: 'effect',
    },
    {
      id: '11',
      name: 'Zoneless',
      concept: 'provideZonelessChangeDetection()',
      blurb: 'Los signals dejan tirar Zone.js.',
      accent: 'capstone',
    },
  ];

  /** Alto total del recorrido: una pantalla de scroll por concepto. */
  readonly trackHeight = computed(() => this.stops.length * this.viewport());
  /** Progreso 0..1 para la barra lateral. */
  readonly progress = computed(() => {
    const max = (this.stops.length - 1) * this.viewport();
    return max > 0 ? Math.min(1, this.scroll() / max) : 0;
  });
  /** Índice del concepto en foco (el más cercano al centro). */
  readonly activeIndex = computed(() => {
    const seg = this.viewport();
    return seg ? Math.round(this.scroll() / seg) : 0;
  });

  private raf = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const onScroll = () => {
        if (this.raf) return;
        this.raf = requestAnimationFrame(() => {
          this.raf = 0;
          this.scroll.set(this.host.scrollTop);
        });
      };
      const onResize = () => this.viewport.set(this.host.clientHeight || window.innerHeight);
      this.host.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      // Alto real del contenedor una vez montado.
      queueMicrotask(onResize);
      this.destroyRef.onDestroy(() => {
        this.host.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(this.raf);
      });
    }
  }

  levelLink(id: string): string {
    return `/signals/level/${id}/sub-level/1`;
  }

  isActive(i: number): boolean {
    return this.activeIndex() === i;
  }

  /** Escala + opacidad de una escena según su distancia al centro del scroll. */
  styleFor(i: number): SceneStyle {
    const seg = this.viewport();
    const d = seg ? (this.scroll() - i * seg) / seg : 0;
    const clamped = Math.max(-1, Math.min(1, d));
    const opacity = Math.max(0, Math.min(1, 1 - Math.abs(d) * 1.25));
    // 0.7 lejos-antes → ~1.1 en foco → 1.5 lejos-después: se entra y se atraviesa.
    const scale = 0.7 + (clamped + 1) * 0.4;
    const ty = d * -18;
    return {
      opacity: opacity.toFixed(3),
      transform: `translateY(${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`,
      zIndex: String(Math.round(opacity * 100)),
      'pointer-events': opacity > 0.6 ? 'auto' : 'none',
    };
  }

  /** Escenas fuera de foco quedan fuera del tab order (solo con animación). */
  inertFor(i: number): '' | null {
    return !this.reduceMotion && !this.isActive(i) ? '' : null;
  }
}
