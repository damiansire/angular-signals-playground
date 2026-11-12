import { Component, computed, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { TitleComponent } from '../../../../components-atom/title/title.component';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { CircuitoComponent } from '../../../../components-draw/circuito/circuito.component';
import { EnlaceCircuito, NodoCircuito } from '../../../../components-draw/circuito/circuito.modelo';
import { READ_SIGNAL_SYSTEM } from '../../signals-systems';

@Component({
  selector: 'app-create-new-signals',
  imports: [
    ManipulableSystemComponent,
    TitleComponent,
    CodeComponent,
    ConceptCardComponent,
    CircuitoComponent,
  ],
  templateUrl: './create-new-signals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './create-new-signals.component.css',
})
export class CreateNewSignalsComponent {
  readonly closingSystem = READ_SIGNAL_SYSTEM;
  private readonly circuito = viewChild<CircuitoComponent>('circuito');

  readonly count = signal(0);
  /** Qué devolvió la última lectura. Sale del signal real: sin paréntesis, `typeof` da `function`. */
  readonly lectura = signal({ expresion: 'count()', resultado: '0' });

  readonly enlaces: EnlaceCircuito[] = [{ de: 'count', a: 'template' }];
  readonly nodos = computed<NodoCircuito[]>(() => [
    { id: 'count', nombre: 'count', valor: String(this.count()), tono: 'fuente', col: 1, fila: 1 },
    {
      id: 'template',
      nombre: 'template',
      valor: String(this.count()),
      tono: 'consumidor',
      col: 2,
      fila: 1,
    },
  ]);

  leerSinLlamar() {
    this.lectura.set({ expresion: 'count', resultado: typeof this.count });
    this.circuito()?.rebotar('count', 'ƒ');
  }

  /** Leer no avisa a nadie: el nodo se entera de que lo miraron, pero no sale ningún pulso. */
  leer() {
    this.lectura.set({ expresion: 'count()', resultado: String(this.count()) });
    this.circuito()?.reaccionar('count');
  }

  sumar() {
    this.count.update((n) => n + 1);
    this.lectura.set({ expresion: 'count()', resultado: String(this.count()) });
  }

  readonly lines = computed<CodeLine[]>(() => [{ line: 'count = signal(0);', active: true }]);
  readonly htmlLines = computed<CodeLine[]>(() => [
    { line: '<div>', active: false },
    { line: '     <span>', active: false },
    { line: '            count()', active: true },
    { line: '     </span>', active: false },
    { line: '</div>', active: false },
  ]);
}
