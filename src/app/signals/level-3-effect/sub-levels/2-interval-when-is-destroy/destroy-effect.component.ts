import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DestroyBoxComponent } from './destroy-box/destroy-box.component';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { EventHistoryComponent } from '../../../../components/event-history/event-history.component';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { EFFECT_LEAK_SYSTEM } from '../../effect-systems';
import { RelojesDelHijo } from '../../relojes-del-hijo';

/**
 * 3/2 y 3/3 son el mismo padre a propósito: mismo destroy(), mismo registro de relojes, mismas
 * lecturas. La única diferencia entre las dos pantallas es el onCleanup del hijo, así que lo que
 * cambia en los latidos después de destruirlo solo puede venir de ahí.
 */
@Component({
  selector: 'app-destroy-effect',
  templateUrl: './destroy-effect.component.html',
  styleUrl: './destroy-effect.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DestroyBoxComponent,
    EventHistoryComponent,
    CodeComponent,
    ConceptCardComponent,
    ManipulableSystemComponent,
  ],
})
export class DestroyEffectComponent {
  readonly closingSystem = EFFECT_LEAK_SYSTEM;
  /**
   * Los latidos del hijo se cuentan en el padre porque lo que se quiere ver es justo lo que
   * sobrevive al hijo. Atado al DestroyRef del padre: el leak se muestra mientras dura la pantalla
   * y se apaga cuando el usuario se va, en vez de acumular un reloj por visita.
   */
  readonly relojes = new RelojesDelHijo(inject(DestroyRef));
  /** Espejo del estado del hijo: solo resalta qué rama del código está corriendo. */
  autoRefresh = signal(false);
  readonly showComponent = signal(true);
  lines = computed<CodeLine[]>(() => [
    { line: '// en el hijo', active: false },
    { line: 'effect(() => {', active: false },
    { line: '  if (this.autoRefresh()) {', active: this.autoRefresh() },
    { line: '    this.intervalSave = setInterval(tick, 1000);', active: this.autoRefresh() },
    { line: '  } else {', active: !this.autoRefresh() },
    { line: '    // al destruir el hijo nunca llega acá (leak)', active: true },
    { line: '    clearInterval(this.intervalSave);', active: !this.autoRefresh() },
    { line: '  }', active: false },
    { line: '});', active: false },
    { line: '', active: false },
    { line: '// en el padre', active: false },
    { line: 'destroy() {', active: false },
    { line: '  this.showComponent.set(false);', active: false },
    { line: '}', active: false },
  ]);

  destroy() {
    this.showComponent.set(false);
  }
  setAutoRefresh(event: boolean) {
    this.autoRefresh.set(event);
  }
}
