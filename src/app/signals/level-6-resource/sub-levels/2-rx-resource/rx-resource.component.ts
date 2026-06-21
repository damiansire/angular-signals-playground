import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, timer } from 'rxjs';
import { CodeLine } from '../../../../components-atom/component-atom.interface';
import { ColumnAndCodeLayoutComponent } from '../../../../layouts/column-and-code-layout/column-and-code-layout.component';
import { DemoUser, lookupUser } from '../../users.data';

@Component({
  selector: 'app-rx-resource',
  templateUrl: './rx-resource.component.html',
  styleUrl: './rx-resource.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ColumnAndCodeLayoutComponent],
})
export class RxResourceComponent {
  readonly userId = signal(1);
  readonly candidateIds = [1, 2, 3, 4];

  // Igual que resource(), pero el loader es un Observable de RxJS.
  readonly userResource = rxResource<DemoUser, number>({
    params: () => this.userId(),
    stream: ({ params }) => timer(800).pipe(map(() => lookupUser(params))),
  });

  setUser(id: number) {
    this.userId.set(id);
  }

  reload() {
    this.userResource.reload();
  }

  readonly lines = computed<CodeLine[]>(() => [
    { line: "import { rxResource } from '@angular/core/rxjs-interop';", active: false },
    { line: '', active: false },
    { line: 'userResource = rxResource({', active: true },
    { line: '  params: () => this.userId(),', active: true },
    { line: '  stream: ({ params }) =>', active: true },
    { line: '    timer(800).pipe(map(() => fetchUser(params))),', active: true },
    { line: '});', active: true },
  ]);
}
