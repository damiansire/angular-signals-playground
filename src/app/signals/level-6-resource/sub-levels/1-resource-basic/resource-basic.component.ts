import { Component, ChangeDetectionStrategy, computed, resource, signal } from '@angular/core';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { DemoUser, lookupUser } from '../../users.data';

@Component({
  selector: 'app-resource-basic',
  templateUrl: './resource-basic.component.html',
  styleUrl: './resource-basic.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class ResourceBasicComponent {
  // id seleccionable (el #4 no existe → demuestra el estado de error).
  readonly userId = signal(1);
  readonly candidateIds = [1, 2, 3, 4];

  readonly userResource = resource<DemoUser, number>({
    params: () => this.userId(),
    loader: ({ params }) =>
      new Promise<DemoUser>((resolve, reject) => {
        setTimeout(() => {
          try {
            resolve(lookupUser(params));
          } catch (error) {
            reject(error);
          }
        }, 800);
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
