import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PAGINA_DEL_MANUAL } from './pagina-del-manual';

/**
 * Una página del manual de a bordo, siempre en el mismo orden de lectura: la ley, qué hacer, la demo
 * y el desafío. La escena de la nave va al costado, a la altura de la ley, y reacciona a lo que se
 * toca en la demo: así se lee qué le pasa a la nave sin otra frase.
 */
@Component({
  selector: 'app-pagina-del-manual',
  templateUrl: './pagina-del-manual.component.html',
  styleUrl: './pagina-del-manual.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaDelManualComponent {
  protected readonly datos = inject(PAGINA_DEL_MANUAL, { optional: true });
}
