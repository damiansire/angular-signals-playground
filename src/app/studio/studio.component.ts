import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { StudioToolbarComponent } from './components/studio-toolbar/studio-toolbar.component';
import { StudioViewportComponent } from './components/studio-viewport/studio-viewport.component';
import { StudioInspectorComponent } from './components/studio-inspector/studio-inspector.component';
import { StudioTimelineComponent } from './components/studio-timeline/studio-timeline.component';
import { StudioStateService } from './services/studio-state.service';
import { StudioSyncService } from './services/studio-sync.service';

@Component({
  selector: 'app-studio',
  imports: [
    StudioToolbarComponent,
    StudioViewportComponent,
    StudioInspectorComponent,
    StudioTimelineComponent,
  ],
  template: `
    <div class="studio-layout">
      <!-- Barra superior de transporte y guardado -->
      <app-studio-toolbar class="studio-layout__toolbar" />

      <!-- Cuerpo principal: Viewport (Canvas) + Inspector lateral -->
      <main class="studio-layout__main">
        <section class="studio-layout__viewport-area">
          <app-studio-viewport />
        </section>
        <section class="studio-layout__inspector-area">
          <app-studio-inspector />
        </section>
      </main>

      <!-- Línea de tiempo inferior multitrack -->
      <footer class="studio-layout__timeline-area">
        <app-studio-timeline />
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background: #07080c;
        color: #f1f5f9;
        z-index: 100;
      }
      .studio-layout {
        display: grid;
        grid-template-rows: 52px 1fr 210px;
        width: 100vw;
        height: 100vh;
        max-width: 100vw;
        max-height: 100vh;
        overflow: hidden;
        box-sizing: border-box;
      }
      .studio-layout__toolbar {
        height: 52px;
        flex-shrink: 0;
      }
      .studio-layout__main {
        display: grid;
        grid-template-columns: 1fr 360px;
        overflow: hidden;
        min-height: 0;
        min-width: 0;
        height: 100%;
        background: #07080c;
      }
      .studio-layout__viewport-area {
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        min-height: 0;
        min-width: 0;
        height: 100%;
        box-sizing: border-box;
      }
      .studio-layout__inspector-area {
        overflow: hidden;
        height: 100%;
        min-height: 0;
        min-width: 0;
      }
      .studio-layout__timeline-area {
        height: 210px;
        width: 100%;
        flex-shrink: 0;
        overflow: hidden;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudioComponent {
  readonly state = inject(StudioStateService);
  readonly sync = inject(StudioSyncService);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(e: KeyboardEvent): void {
    const target = (e.composedPath?.()[0] ?? e.target) as HTMLElement | null;
    const active = document.activeElement as HTMLElement | null;
    const isInput =
      target?.tagName === 'INPUT' ||
      target?.tagName === 'TEXTAREA' ||
      target?.tagName === 'SELECT' ||
      target?.isContentEditable ||
      active?.tagName === 'INPUT' ||
      active?.tagName === 'TEXTAREA' ||
      active?.tagName === 'SELECT' ||
      active?.isContentEditable;

    // Si el usuario está escribiendo o editando texto en un campo, no interceptar ninguna tecla
    if (isInput) return;

    // Deshacer: Ctrl+Z / Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.state.undo();
      return;
    }

    // Rehacer: Ctrl+Y o Ctrl+Shift+Z / Cmd+Shift+Z
    if (
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
    ) {
      e.preventDefault();
      this.state.redo();
      return;
    }

    // Play / Pausa con barra espaciadora
    if (e.code === 'Space') {
      e.preventDefault();
      this.state.togglePlay();
      return;
    }

    // Navegación en el timeline con flechas
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.state.stepFrame(e.shiftKey ? -5000 : -1000);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.state.stepFrame(e.shiftKey ? 5000 : 1000);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.state.seek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.state.seek(this.state.duracionTotal());
    }
  }
}
