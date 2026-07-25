import {
  Component,
  computed,
  effect,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { VariableBoxComponent } from '../../../../components-atom/variable-box/variable-box.component';
import { HistoryElement } from '../../../../components/component.interface';
import { DependenciesStatusComponent } from '../../../../components/dependencies-status/dependencies-status.component';
import { EventHistoryComponent } from '../../../../components/event-history/event-history.component';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { EFFECT_READS_SYSTEM } from '../../effect-systems';

/** Tope del historial de eventos: Count1 late por un intervalo, así que sin límite la lista (y la
 *  altura de la card en la vista integrada) crecería sin fin. Mostramos la actividad reciente. */
const MAX_HISTORY = 4;

@Component({
  selector: 'app-effect',
  templateUrl: './effect.component.html',
  styleUrl: './effect.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VariableBoxComponent,
    EventHistoryComponent,
    DependenciesStatusComponent,
    CodeComponent,
    ConceptCardComponent,
    ManipulableSystemComponent,
  ],
})
export class EffectComponent {
  readonly closingSystem = EFFECT_READS_SYSTEM;
  count = signal(0);
  count2 = signal(0);
  dependencies = computed<string[]>(() => {
    return ['count'];
  });
  dependencies2 = computed<string[]>(() => {
    return ['count2'];
  });
  appEventHistory = signal<HistoryElement[]>([]);
  constructor() {
    effect(() => {
      const trigger = this.count() === 0 ? 'effect(1) inicial' : 'effect(1) corrió';
      this.addConditionalCountRecomputation(trigger, this.count(), false);
      // eslint-disable-next-line no-console -- demo didactica: refleja el console.log mostrado en pantalla
      console.log(`The current count is: ${this.count()}`);
    });
    effect(() => {
      const trigger = this.count2() === 0 ? 'effect(2) inicial' : 'effect(2) corrió';
      this.addConditionalCountRecomputation(trigger, this.count2(), false);
      // eslint-disable-next-line no-console -- demo didactica: refleja el console.log mostrado en pantalla
      console.log(`The current count is: ${this.count2()}`);
    });

    // Vida autónoma: Count1 late solo (una fuente que cambia sin que el usuario toque nada), así se
    // ve a effect(1) reaccionar por su cuenta en vez de quedar el demo congelado esperando input.
    // Count2 queda manual como contraste ("este cambia solo, ese solo si vos lo tocás"). El intervalo
    // se limpia al destruir el componente y se pausa con prefers-reduced-motion (la vida se atenúa,
    // el demo sigue andando con clicks).
    //
    // El latido SOLO corre con el capítulo activo. La vista integrada pre-monta las 12 cards y nunca
    // las destruye: marca `inert` la que no se está viendo (ver molecule-engine, `card.inert = !live`).
    // Sin este guard el intervalo late desde que carga la página, aunque estés en otro nivel, y sus
    // effects ensucian la consola con "The current count is: N" a lo largo de todo el recorrido.
    const host = inject(ElementRef).nativeElement as HTMLElement;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      const beatId = setInterval(() => {
        if (host.closest('[inert]')) return;
        this.count.update((c) => c + 1);
      }, 1300);
      inject(DestroyRef).onDestroy(() => clearInterval(beatId));
    }
  }
  lines = computed<CodeLine[]>(() => [
    { line: 'count = signal(0);', active: false },
    { line: 'count2 = signal(0);', active: false },
    { line: 'effect(() => {', active: false },
    {
      line: '  console.log(`The current count is: ${count()}`);',
      active: true,
    },
    { line: '});', active: false },
    { line: 'effect(() => {', active: false },
    {
      line: '  console.log(`The current count is: ${count2()}`);',
      active: true,
    },
    { line: '});', active: false },
  ]);
  upCount() {
    this.count.update((currentCount: number) => currentCount + 1);
  }
  upCount2() {
    this.count2.update((currentCount: number) => currentCount + 1);
  }
  addConditionalCountRecomputation(
    trigger: string,
    newState: number | string,
    isCountIncrement: boolean,
  ) {
    this.appEventHistory.update((prevHistory) => {
      const newHistory = prevHistory.length ? [...prevHistory] : [];
      newHistory.push({
        date: new Date(),
        trigger,
        newState,
        isCountIncrement,
      });
      // Count1 late solo por un intervalo, así que el historial CRECERÍA sin tope y la card se
      // estiraría infinito (bajo el fold). Nos quedamos con los últimos eventos: en un demo "vivo"
      // lo que importa es la actividad reciente, no una lista infinita.
      return newHistory.length > MAX_HISTORY ? newHistory.slice(-MAX_HISTORY) : newHistory;
    });
  }
}
