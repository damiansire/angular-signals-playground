import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * El recorrido: los 12 niveles como estaciones de un viaje que se baja
 * scrolleando (neal.fun). Cada estación es una moneda-nodo coloreada por el
 * acento semántico de su tema, y entra al nivel. Sin estado dinámico: es un
 * mapa; la reactividad vive adentro de cada nivel.
 */
type Accent = 'source' | 'derived' | 'effect' | 'ink' | 'capstone';

interface Stop {
  id: string;
  name: string;
  concept: string;
  accent: Accent;
}

@Component({
  selector: 'app-journey',
  imports: [RouterLink],
  templateUrl: './journey.component.html',
  styleUrl: './journey.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JourneyComponent {
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
}
