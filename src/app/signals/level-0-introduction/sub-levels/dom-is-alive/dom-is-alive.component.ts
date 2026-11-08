import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import {
  DomMutation,
  DomNodeState,
  INITIAL_DOM,
  MUTATIONS,
  applyMutation,
} from './dom-is-alive.data';
import { ManipulableSystemComponent } from '../../../../components-atom/manipulable-system/manipulable-system.component';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaVivoComponent } from '../../manual/escena-vivo.component';
import { DOM_ALIVE_SYSTEM } from '../../introduction-systems';
import { conCortes } from '../../../../libs/cortes-de-codigo';
import { siguienteSinTocar } from '../../manual/guia.logica';

@Component({
  selector: 'app-dom-is-alive',
  templateUrl: './dom-is-alive.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ManipulableSystemComponent, PaginaDelManualComponent, EscenaVivoComponent],
  styleUrl: './dom-is-alive.component.css',
})
export class DomIsAliveComponent {
  /** El desafío quedó sano: la lámina festeja. */
  protected readonly sano = signal(false);
  readonly closingSystem = DOM_ALIVE_SYSTEM;
  protected readonly mutations: readonly DomMutation[] = MUTATIONS;
  // El código del botón con puntos de corte: angosto se parte en "." y "(", no a mitad de un nombre.
  protected readonly cortes = conCortes;
  protected readonly dom = signal<DomNodeState[]>(INITIAL_DOM.map((node) => ({ ...node })));
  protected readonly lastTouched = signal<string | null>(null);
  // Se incrementa en cada corrida para re-disparar el "ping" del nodo aunque toques el mismo.
  protected readonly runId = signal(0);
  private readonly corridas = signal<readonly string[]>([]);
  /** La mano lleva por las tres líneas, de arriba hacia abajo. */
  protected readonly guia = computed(() => {
    const id = siguienteSinTocar(
      this.mutations.map((m) => m.id),
      this.corridas(),
    );
    return id === null ? null : `[data-guia="${id}"]`;
  });

  protected run(mutation: DomMutation): void {
    this.dom.set(applyMutation(this.dom(), mutation));
    this.lastTouched.set(mutation.targetId);
    this.runId.update((n) => n + 1);
    this.corridas.update((ids) => [...ids, mutation.id]);
  }

  protected reset(): void {
    this.dom.set(INITIAL_DOM.map((node) => ({ ...node })));
    this.lastTouched.set(null);
  }

  protected isTouched(id: string): boolean {
    return this.lastTouched() === id;
  }
}
