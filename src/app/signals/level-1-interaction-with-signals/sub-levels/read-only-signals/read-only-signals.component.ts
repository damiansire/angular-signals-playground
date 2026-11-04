import { Component, ChangeDetectionStrategy, computed, signal, viewChild } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { CircuitoComponent } from '../../../../components-draw/circuito/circuito.component';
import { EnlaceCircuito, NodoCircuito } from '../../../../components-draw/circuito/circuito.modelo';
import { READONLY_SIGNAL_SYSTEM } from '../../signals-systems';

@Component({
  selector: 'app-read-only-signals',
  templateUrl: './read-only-signals.component.html',
  styleUrl: './read-only-signals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, CircuitoComponent],
})
export class ReadOnlySignalsComponent {
  readonly closingSystem = READONLY_SIGNAL_SYSTEM;
  // Solo el componente puede escribir este signal (es privado).
  private readonly _count = signal(0);

  // Lo que se expone afuera es de SOLO LECTURA: se puede leer pero no .set()/.update().
  readonly count = this._count.asReadonly();

  private readonly circuito = viewChild<CircuitoComponent>('circuito');

  readonly enlaces: EnlaceCircuito[] = [
    { de: '_count', a: 'count' },
    { de: 'count', a: 'vista' },
  ];
  readonly nodos = computed<NodoCircuito[]>(() => {
    const valor = String(this.count());
    return [
      { id: '_count', nombre: 'private _count', valor, tono: 'fuente', col: 1, fila: 1 },
      { id: 'count', nombre: 'count', valor, tono: 'fuente', col: 2, fila: 1, cerrado: true },
      { id: 'vista', nombre: 'count()', valor, tono: 'consumidor', col: 3, fila: 1 },
    ];
  });

  /** No hay escritura que intentar: `Signal<T>` no tiene `set`. Lo único que puede pasar es rebotar. */
  escribirDesdeAfuera() {
    this.circuito()?.rebotar('count', 'no compila');
  }

  increment() {
    this._count.update((value) => value + 1);
  }

  reset() {
    this._count.set(0);
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'private _count = signal(0);', active: false },
    { line: '', active: false },
    { line: '// asReadonly(): solo lectura hacia afuera', active: true },
    { line: 'count = this._count.asReadonly();', active: true },
    { line: '', active: false },
    { line: 'this._count.set(5);   // ✅ adentro', active: false },
    { line: 'this.count.set(5);    // ❌ error de compilación', active: false },
  ]);
}
