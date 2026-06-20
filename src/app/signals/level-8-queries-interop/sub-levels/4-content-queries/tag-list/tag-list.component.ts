import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  computed,
  contentChild,
  contentChildren,
} from '@angular/core';

@Component({
  selector: 'app-tag-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg border border-gray-200 p-4">
      <p class="text-xs text-gray-500 mb-3">
        Proyectados: <strong class="text-fuchsia-700">{{ count() }}</strong>
        · primero: <strong class="text-fuchsia-700">{{ firstText() }}</strong>
      </p>
      <div class="flex flex-wrap gap-2">
        <ng-content />
      </div>
    </div>
  `,
})
export class TagListComponent {
  // contentChildren(): todos los elementos proyectados que matchean.
  private readonly tags = contentChildren<ElementRef<HTMLElement>>('tag');
  readonly count = computed(() => this.tags().length);

  // contentChild(): el primero (o undefined).
  private readonly firstTag = contentChild<ElementRef<HTMLElement>>('tag');
  readonly firstText = computed(
    () => this.firstTag()?.nativeElement.textContent?.trim() ?? '—'
  );
}
