import { Component, ChangeDetectionStrategy, computed, resource, signal } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { DemoUser, lookupUser } from '../../users.data';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { RESOURCE_BASIC_SYSTEM } from '../../resource-systems';

@Component({
  selector: 'app-resource-basic',
  templateUrl: './resource-basic.component.html',
  styleUrl: './resource-basic.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, ColumnAndCodeLayoutComponent],
})
export class ResourceBasicComponent {
  readonly closingSystem = RESOURCE_BASIC_SYSTEM;
  // id seleccionable (el #4 no existe → demuestra el estado de error).
  readonly userId = signal(1);
  readonly candidateIds = [1, 2, 3, 4];

  readonly userResource = resource<DemoUser, number>({
    params: () => this.userId(),
    // El abortSignal es parte de la lección: `resource` lo dispara cuando cambian los params o
    // cuando se destruye el componente. Ignorarlo dejaba el timer de 800 ms vivo, resolviendo
    // contra un pedido que ya nadie espera. Un ejemplo de `resource` que no cancela enseña la
    // mitad de la API.
    loader: ({ params, abortSignal }) =>
      new Promise<DemoUser>((resolve, reject) => {
        const timer = setTimeout(() => {
          try {
            resolve(lookupUser(params));
          } catch (error) {
            reject(error);
          }
        }, 800);
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('Pedido cancelado', 'AbortError'));
        });
      }),
  });

  setUser(id: number) {
    this.userId.set(id);
  }

  reload() {
    this.userResource.reload();
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: 'userId = signal(1);', active: false },
    { line: '', active: false },
    { line: 'userResource = resource({', active: true },
    { line: '  params: () => this.userId(),', active: true },
    { line: '  loader: ({ params }) => fetchUser(params),', active: true },
    { line: '});', active: true },
    { line: '', active: false },
    {
      line: '// status(): idle | loading | reloading | resolved | error | local',
      active: false,
    },
  ]);
}
