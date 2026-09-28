import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ComponentDestroyComponent } from './component-destroy/component-destroy.component';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { EventHistoryComponent } from '../../../../components/event-history/event-history.component';
import { CodeComponent } from '../../../../components-atom/code/code.component';
import { ConceptCardComponent } from '../../../../components-atom/concept-card/concept-card.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { EFFECT_CLEANUP_SYSTEM } from '../../effect-systems';
import { RelojesDelHijo } from '../../relojes-del-hijo';

/**
 * El mismo padre que 3/2, a propósito: destroy() solo saca al hijo. Si además apagara autoRefresh a
 * mano, los latidos se frenarían por eso y no por el onCleanup, y el contraste con 3/2 mentiría.
 */
@Component({
  selector: 'app-effect-destroy',
  templateUrl: './effect-destroy.component.html',
  styleUrl: './effect-destroy.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ComponentDestroyComponent,
    EventHistoryComponent,
    CodeComponent,
    ConceptCardComponent,
    ManipulableSystemComponent,
  ],
})
export class EffectDestroyComponent {
  readonly closingSystem = EFFECT_CLEANUP_SYSTEM;
  /** Igual que en 3/2: los latidos del hijo se cuentan en el padre, que vive lo que dura la lección. */
  readonly relojes = new RelojesDelHijo(inject(DestroyRef));
  /** Espejo del estado del hijo: solo resalta qué parte del código está corriendo. */
  autoRefresh = signal(false);
  readonly showComponent = signal(true);
  lines = computed<CodeLine[]>(() => [
    { line: '// en el hijo', active: false },
    { line: 'effect((onCleanup) => {', active: false },
    { line: '  if (this.autoRefresh()) {', active: this.autoRefresh() },
    { line: '    this.intervalSave = setInterval(tick, 1000);', active: this.autoRefresh() },
    { line: '    // corre al apagar Y al destruir el hijo', active: true },
    {
      line: '    onCleanup(() => clearInterval(this.intervalSave));',
      active: this.autoRefresh(),
    },
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
