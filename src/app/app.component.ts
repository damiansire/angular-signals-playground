import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
})
export class AppComponent {
  /**
   * Con `<base href>`, `#main-content` apunta a la raíz del sitio y no a esta página: seguir el
   * enlace sacaba del carrito y recargaba la app entera. El salto se hace a mano.
   */
  protected saltarAlContenido(e: Event, contenido: HTMLElement): void {
    e.preventDefault();
    contenido.focus();
  }
}
