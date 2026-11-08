import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * La lámina de una página del manual de a bordo: la ley dibujada y en movimiento, al lado de la
 * pantalla que la demuestra. Lo que se mueve es lo que la ley dice (el árbol que se arma, el nodo
 * que cambia la pantalla, el cambio que frena), así se entiende antes de tocar la demo.
 * Va diferida: los cinco dibujos solo pesan cuando el capitán abre el manual.
 */
@Component({
  selector: 'app-lamina-del-manual',
  templateUrl: './lamina-del-manual.component.html',
  styleUrl: './lamina-del-manual.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-pagina]': 'pagina()' },
})
export class LaminaDelManualComponent {
  /** El id de la página, el mismo de `PAGINAS_DEL_MANUAL`. */
  readonly pagina = input.required<string>();
}
