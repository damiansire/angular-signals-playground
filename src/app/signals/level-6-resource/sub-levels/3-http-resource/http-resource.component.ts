import {
  ChangeDetectionStrategy,
  Component,
  EnvironmentProviders,
  Provider,
  inject,
  signal,
} from '@angular/core';
import { httpResource, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { HTTP_RESOURCE_SYSTEM } from '../../resource-systems';
import { aTripulante } from './tripulacion';
import { anotarEnLaRed, demorarLaRed, RedDeLaDemo } from './red-de-la-demo';

/**
 * HttpClient llega con este sub-nivel y no con la app: en `app.config.ts` lo pagaría el bundle
 * inicial de todos los que nunca pasan por acá. El recorrido lo monta en un injector propio.
 */
export const PROVEEDORES: (Provider | EnvironmentProviders)[] = [
  provideHttpClient(withFetch(), withInterceptors([anotarEnLaRed, demorarLaRed])),
  RedDeLaDemo,
];

@Component({
  selector: 'app-http-resource',
  templateUrl: './http-resource.component.html',
  styleUrl: './http-resource.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent],
})
export class HttpResourceComponent {
  readonly closingSystem = HTTP_RESOURCE_SYSTEM;
  // La tripulación del Apolo 11 es de tres: el #4 no existe y el servidor contesta 404.
  readonly candidateIds = [1, 2, 3, 4];
  readonly id = signal(1);
  readonly pedidos = inject(RedDeLaDemo).pedidos;

  // Relativa, sin barra inicial: en Pages la app vive bajo /angular-signals-playground/ y una URL
  // absoluta pediría a la raíz del dominio.
  readonly tripulante = httpResource(() => `datos/tripulacion/${this.id()}.json`, {
    parse: aTripulante,
  });

  elegir(id: number) {
    this.id.set(id);
  }

  readonly lines: CodeLine[] = [
    { line: 'id = signal(1);', active: false },
    { line: '', active: false },
    { line: 'tripulante = httpResource(', active: true },
    { line: '  () => `datos/tripulacion/${this.id()}.json`,', active: true },
    { line: '  { parse: aTripulante },', active: true },
    { line: ');', active: true },
    { line: '', active: false },
    { line: '// value() · hasValue() · status() · statusCode()', active: false },
  ];
}
