import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';

import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { HistoryElement } from '../../../../components/component.interface';
import { DependenciesStatusComponent } from '../../../../components/dependencies-status/dependencies-status.component';
import { EventHistoryComponent } from '../../../../components/event-history/event-history.component';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { CircuitoComponent } from '../../../../components-draw/circuito/circuito.component';
import { EnlaceCircuito, NodoCircuito } from '../../../../components-draw/circuito/circuito.modelo';
import { COMPUTED_DYNAMIC_DEPS_SYSTEM } from '../../computed-systems';

/** Tope de cada historial: en la vista integrada la card no debe crecer sin fin bajo el fold con
 *  el uso. Mostramos la actividad reciente, que es lo que importa para leer las recomputaciones. */
const MAX_HISTORY = 2;

@Component({
  selector: 'app-computed-signal-dynamic-dependencies',
  templateUrl: './computed-signal-dynamic-dependencies.component.html',
  styleUrl: './computed-signal-dynamic-dependencies.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ManipulableSystemComponent,
    CircuitoComponent,
    EventHistoryComponent,
    DependenciesStatusComponent,
    CodeComponent,
    ConceptCardComponent,
  ],
})
export class ComputedSignalDynamicDependenciesComponent {
  readonly closingSystem = COMPUTED_DYNAMIC_DEPS_SYSTEM;
  readonly showCount = signal(false);
  readonly count = signal(0);
  readonly conditionalCount = computed(() => {
    if (this.showCount()) {
      return `The count is ${this.count()}.`;
    } else {
      return 'Nothing to see here!';
    }
  });
  readonly conditionalCountHistory = signal<HistoryElement[]>([]);
  readonly appEventHistory = signal<HistoryElement[]>([]);
  readonly dependencies = computed<string[]>(() => {
    return this.showCount() ? ['showCount', 'count'] : ['showCount'];
  });
  readonly signalsInside = signal(['showCount', 'count']);

  /** El cable de `count` existe solo mientras esta corrida lo lee: si no, cuelga y no lleva nada. */
  readonly enlaces = computed<EnlaceCircuito[]>(() => [
    { de: 'showCount', a: 'conditionalCount' },
    { de: 'count', a: 'conditionalCount', vivo: this.showCount() },
  ]);
  readonly nodos = computed<NodoCircuito[]>(() => [
    {
      id: 'showCount',
      nombre: 'showCount',
      valor: this.showCount().toString(),
      tono: 'fuente',
      col: 1,
      fila: 1,
      accion: 'Cambiar showCount',
    },
    {
      id: 'count',
      nombre: 'count',
      valor: this.count().toString(),
      tono: 'fuente',
      col: 1,
      fila: 2,
      accion: 'Incrementar count',
    },
    {
      id: 'conditionalCount',
      nombre: 'conditionalCount',
      valor: this.conditionalCount(),
      tono: 'derivado',
      col: 2,
      fila: 1,
      alto: 2,
      cerrado: true,
    },
  ]);

  alTocar(id: string) {
    if (id === 'showCount') this.onShowCountChange();
    else this.upCount();
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'const showCount = signal(false);', active: false },
    { line: 'const count = signal(0);', active: false },
    { line: 'const conditionalCount = computed(() => {', active: false },
    { line: '  if (showCount()) {', active: true },
    {
      line: '    return `The count is ${count()}.`;',
      active: this.showCount(),
    },
    { line: '  } else {', active: false },
    { line: "    return 'Nothing to see here!';", active: !this.showCount() },
    { line: '  }', active: false },
    { line: '});', active: false },
  ]);
  upCount() {
    this.count.update((currentCount: number) => currentCount + 1);
    if (this.showCount()) {
      this.addConditionalCountRecomputation('count', this.conditionalCount(), false);
    }
    this.addCountRecomputation('count', this.count());
  }
  onShowCountChange() {
    this.showCount.set(!this.showCount());
    this.addConditionalCountRecomputation('showCount', this.conditionalCount(), false);
  }

  addConditionalCountRecomputation(
    trigger: string,
    newState: number | string,
    isCountIncrement: boolean,
  ) {
    this.conditionalCountHistory.update((prevHistory) => {
      const newHistory = prevHistory.length ? [...prevHistory] : [];
      newHistory.push({
        date: new Date(),
        trigger,
        newState,
        isCountIncrement,
      });
      return newHistory.length > MAX_HISTORY ? newHistory.slice(-MAX_HISTORY) : newHistory;
    });
  }

  addCountRecomputation(trigger: string, newState: number | string) {
    this.appEventHistory.update((prevHistory) => {
      const newHistory = prevHistory.length ? [...prevHistory] : [];
      newHistory.push({
        date: new Date(),
        trigger,
        newState,
        isCountIncrement: true,
      });
      return newHistory.length > MAX_HISTORY ? newHistory.slice(-MAX_HISTORY) : newHistory;
    });
  }
}
