import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { CircuitoComponent } from '../../../../components-draw/circuito/circuito.component';
import { EnlaceCircuito, NodoCircuito } from '../../../../components-draw/circuito/circuito.modelo';
import { UPDATE_SIGNAL_SYSTEM } from '../../signals-systems';

/** Los últimos eslabones alcanzan para ver la cadena, y el alto de la card no crece con el uso. */
const ESLABONES = 5;

@Component({
  selector: 'app-update-signal',
  templateUrl: './update-signal.component.html',
  styleUrl: './update-signal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent, CircuitoComponent],
})
export class UpdateSignalComponent {
  readonly closingSystem = UPDATE_SIGNAL_SYSTEM;
  count = signal(0);

  readonly enlaces: EnlaceCircuito[] = [{ de: 'count', a: 'vista' }];
  readonly nodos = computed<NodoCircuito[]>(() => [
    { id: 'count', nombre: 'count', valor: String(this.count()), tono: 'fuente', col: 1, fila: 1 },
    {
      id: 'vista',
      nombre: 'count()',
      valor: String(this.count()),
      tono: 'consumidor',
      col: 2,
      fila: 1,
    },
  ]);
  readonly cadena = computed(() => {
    const hasta = this.count();
    const desde = Math.max(1, hasta - ESLABONES + 1);
    return Array.from({ length: Math.max(0, hasta - desde + 1) }, (_, i) => desde + i);
  });

  update() {
    this.count.update((value) => value + 1);
    // eslint-disable-next-line no-console -- demo didactica: refleja el console.log mostrado en pantalla
    console.log(this.count());
  }

  lines = computed<CodeLine[]>(() => [
    { line: 'count = signal(0);', active: false },
    { line: 'update() {', active: false },
    { line: '  this.count.update((value) => value + 1);', active: true },
    { line: '  console.log(this.count());', active: false },
    { line: '}', active: false },
  ]);
}
