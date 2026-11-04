import { Component, ChangeDetectionStrategy, computed, signal, viewChild } from '@angular/core';
import { ComputedTrackerComponent } from '../../../../components/computed-tracker/computed-tracker.component';
import { ClickInButton } from '../../../../components/component.interface';
import { BasicFormComponent } from '../../../../components/basic-form/basic-form.component';
import { ClickHistoryComponent } from '../../../../components/click-history/click-history.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { CircuitoComponent } from '../../../../components-draw/circuito/circuito.component';
import { EnlaceCircuito, NodoCircuito } from '../../../../components-draw/circuito/circuito.modelo';
import { COMPUTED_MEMO_SYSTEM } from '../../computed-systems';

/** Tope de cada panel: sin límite las listas crecerían sin fin y estirarían la card bajo el fold
 *  en la vista integrada. Con los últimos eventos alcanza para leer qué recomputó y qué no. */
const MAX_HISTORY = 3;

@Component({
  selector: 'app-computed-signals-lazily-evaluated-memoized',
  templateUrl: './computed-signals-lazily-evaluated-memoized.component.html',
  styleUrl: './computed-signals-lazily-evaluated-memoized.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ManipulableSystemComponent,
    ComputedTrackerComponent,
    BasicFormComponent,
    ClickHistoryComponent,
    ConceptCardComponent,
    CircuitoComponent,
  ],
})
export class ComputedSignalsLazilyEvaluatedMemoizedComponent {
  readonly closingSystem = COMPUTED_MEMO_SYSTEM;
  // El estado que alimenta los paneles vive en signals y se actualiza con una NUEVA referencia
  // (no `push` sobre el mismo array): bajo OnPush + zoneless, mutar el array in situ no dispara
  // detección de cambios y los hijos (que reciben la lista por `input()`) nunca se refrescarían.
  // Es justo el patrón que esta lección enseña; el componente lo modela en su propio estado.
  readonly computedTracker = signal<ClickInButton[]>([]);
  readonly clickHistory = signal<ClickInButton[]>([]);

  private readonly circuito = viewChild<CircuitoComponent>('circuito');

  // Un computed real con su cuenta de corridas por fuera: adentro no se puede escribir un signal, así
  // que el contador es un número común y la pantalla lo toma recién al leer. Si lo leyera siempre, el
  // computed dejaría de ser perezoso y el demo se desmentiría solo.
  readonly nombre = signal('Ada');
  private corridasReales = 0;
  private readonly saludo = computed(() => {
    this.corridasReales++;
    return `Hola, ${this.nombre()}`;
  });
  readonly corridas = signal(0);
  private readonly ultimaLectura = signal('sin correr');

  readonly enlaces: EnlaceCircuito[] = [{ de: 'nombre', a: 'saludo' }];
  readonly nodos = computed<NodoCircuito[]>(() => [
    { id: 'nombre', nombre: 'nombre', valor: this.nombre(), tono: 'fuente', col: 1, fila: 1 },
    {
      id: 'saludo',
      nombre: 'saludo',
      valor: this.ultimaLectura(),
      tono: 'derivado',
      col: 2,
      fila: 1,
      cerrado: true,
    },
  ]);

  leer() {
    this.ultimaLectura.set(this.saludo());
    // Los dos paneles cuentan la diferencia: un click por cada lectura, una corrida solo si hizo falta.
    if (this.corridasReales !== this.corridas()) this.addComputedSignal(this.registro());
    this.addClickToHistory(this.registro());
    this.corridas.set(this.corridasReales);
    this.circuito()?.reaccionar('saludo');
  }

  cambiarNombre() {
    this.nombre.update((nombre) => (nombre === 'Ada' ? 'Grace' : 'Ada'));
    this.addClickToHistory(this.registro());
  }

  /** Mismo valor: el signal lo compara, no invalida a nadie y por el cable no sale ningún pulso. */
  repetirNombre() {
    this.nombre.set(this.nombre());
    this.addClickToHistory(this.registro());
    this.circuito()?.reaccionar('nombre');
  }

  private registro(): ClickInButton {
    return { date: new Date(), firstName: this.nombre(), surname: '—' };
  }

  addComputedSignal(data: ClickInButton) {
    this.computedTracker.update((prev) => [...prev, data].slice(-MAX_HISTORY));
  }

  addClickToHistory(event: ClickInButton) {
    this.clickHistory.update((prev) => [...prev, event].slice(-MAX_HISTORY));
  }
}
