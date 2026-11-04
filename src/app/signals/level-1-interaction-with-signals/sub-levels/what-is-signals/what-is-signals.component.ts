import { Component, computed, signal, Signal, ChangeDetectionStrategy } from '@angular/core';
import { TitleComponent } from '../../../../components-atom/title/title.component';
import { TextDescriptionComponent } from '../../../../components-atom/text-description/text-description.component';
import { CircuitoComponent } from '../../../../components-draw/circuito/circuito.component';
import { EnlaceCircuito, NodoCircuito } from '../../../../components-draw/circuito/circuito.modelo';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { WHAT_IS_SIGNAL_SYSTEM } from '../../signals-systems';

/** Valores de muestra de cada tipo: tocar un signal lo hace pasar al siguiente. */
const MUESTRAS: Record<string, readonly string[]> = {
  Number: ['1', '6', '56'],
  String: ['"A"', '"Hola"'],
  Boolean: ['true', 'false'],
  Object: ['{}', '{a: 1}'],
  Array: ['[]', '[1, 2]'],
};

/** Una estrella alrededor del consumidor: cada tipo tiene su propio cable hasta él. */
const LUGARES: Record<string, { col: number; fila: number }> = {
  Number: { col: 1, fila: 1 },
  String: { col: 2, fila: 1 },
  Boolean: { col: 3, fila: 1 },
  Object: { col: 1, fila: 2 },
  Array: { col: 3, fila: 2 },
};

@Component({
  selector: 'app-what-is-signals',
  imports: [
    ManipulableSystemComponent,
    TitleComponent,
    TextDescriptionComponent,
    CircuitoComponent,
    CodeComponent,
    ConceptCardComponent,
  ],
  templateUrl: './what-is-signals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './what-is-signals.component.css',
})
export class WhatIsSignalsComponent {
  readonly closingSystem = WHAT_IS_SIGNAL_SYSTEM;
  title = '¿Qué es un signal?';
  readonly clickCount = signal(0);
  readonly dataTypes = signal([
    { text: 'Number', isContainer: false, muestra: 0 },
    { text: 'String', isContainer: false, muestra: 0 },
    { text: 'Boolean', isContainer: false, muestra: 0 },
    { text: 'Object', isContainer: false, muestra: 0 },
    { text: 'Array', isContainer: false, muestra: 0 },
  ]);
  /** Lo último que le llegó al consumidor: solo se entera de lo que está envuelto. */
  private readonly ultimo = signal('…');

  readonly nodos = computed<NodoCircuito[]>(() => [
    ...this.dataTypes().map((type) => ({
      id: type.text,
      nombre: type.text,
      valor: MUESTRAS[type.text][type.muestra],
      tono: type.isContainer ? ('fuente' as const) : ('caja' as const),
      ...LUGARES[type.text],
      accion: type.isContainer
        ? `Cambiar el valor del signal ${type.text}`
        : `Envolver ${type.text} en un signal`,
    })),
    {
      id: 'pantalla',
      nombre: 'consumidor',
      valor: this.ultimo(),
      tono: 'consumidor',
      col: 2,
      fila: 2,
    },
  ]);

  /** El cable nace con el envoltorio: una caja suelta no tiene a quién avisarle. */
  readonly enlaces = computed<EnlaceCircuito[]>(() =>
    this.dataTypes().map((type) => ({ de: type.text, a: 'pantalla', vivo: type.isContainer })),
  );

  alTocar(id: string) {
    const tipo = this.dataTypes().find((type) => type.text === id);
    if (!tipo) return;
    if (!tipo.isContainer) {
      this.convertToContainer({ name: id, value: '' });
      return;
    }
    const muestra = (tipo.muestra + 1) % MUESTRAS[id].length;
    this.dataTypes.update((types) =>
      types.map((type) => (type.text === id ? { ...type, muestra } : type)),
    );
    this.ultimo.set(MUESTRAS[id][muestra]);
  }

  convertToContainer($event: { name: string; value: string }) {
    const id = $event.name;
    if (!this.dataTypes().some((type) => type.text === id)) return;
    this.dataTypes.update((types) =>
      types.map((type) => (type.text === id ? { ...type, isContainer: true } : type)),
    );
    this.clickCount.update((n) => n + 1);
  }

  signalWrapperLines: Signal<CodeLine[]> = computed<CodeLine[]>(() => [
    {
      line: 'export class SignalWrapper<T> {',
      active: false,
      id: 'signal-wrapper-class',
    },
    {
      line: '  private _signal: Signal<T>;',
      active: false,
      id: 'private-signal',
    },
    {
      line: '  constructor(initialValue: T) {',
      active: false,
      id: 'constructor',
    },
    {
      line: '    this._signal = signal(initialValue);',
      active: false,
      id: 'signal-initialization',
    },
    { line: '  }', active: false, id: 'constructor-end' }, // Closing curly brace for constructor
    { line: '}', active: false, id: 'signal-wrapper-class-end' }, // Closing curly brace for class
  ]);
}
