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
   * La landing (`/`) es full-bleed: sin ella el sidebar del banco compite con la
   * bienvenida. En los niveles y el Lab, el chrome vuelve.
   */
  protected readonly onLanding = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => (e.urlAfterRedirects || e.url) === '/'),
    ),
    { initialValue: (this.router.url || '/') === '/' },
  );
}
