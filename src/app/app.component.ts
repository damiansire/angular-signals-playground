import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { SidebarMenuComponent } from './components/sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterModule, SidebarMenuComponent],
})
export class AppComponent {
  title = 'angular-examples';
  private readonly router = inject(Router);

  /**
   * Las pantallas full-bleed (la vista integrada `/` y las de práctica) ocultan
   * el sidebar del banco: competiría con la bienvenida. En los niveles y el Lab,
   * el chrome vuelve.
   */
  protected readonly fullBleed = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => isFullBleed(e.urlAfterRedirects || e.url)),
    ),
    { initialValue: isFullBleed(this.router.url || '/') },
  );
}

/** Rutas sin chrome del banco (viaje/bienvenida). */
function isFullBleed(url: string): boolean {
  const path = url.split('?')[0].split('#')[0];
  return path === '/' || path === '/integrada-vista' || path.startsWith('/practica');
}
