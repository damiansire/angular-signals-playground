import {
  ApplicationConfig,
  DOCUMENT,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { filter } from 'rxjs';

import { routes } from './app.routes';
import { rutaContable, urlDeConteo } from './libs/visitas';

/**
 * Una visita por ruta del router. La vista integrada mueve el capítulo con `replaceState`, por
 * fuera del router, así que recorrer los capítulos no suma vistas: la entrada a `/` cuenta una.
 */
function contarVisitas(): void {
  const doc = inject(DOCUMENT);
  let anterior: string | null = null;
  inject(Router)
    .events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
    .subscribe((e) => {
      const ruta = rutaContable(e.urlAfterRedirects);
      if (ruta === anterior) return;
      const pixel = urlDeConteo({
        host: doc.location.hostname,
        url: ruta,
        referente: anterior === null ? doc.referrer : '',
        automatizado: doc.defaultView?.navigator.webdriver ?? false,
      });
      anterior = ruta;
      if (pixel) new Image().src = pixel;
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAppInitializer(contarVisitas),
  ],
};
