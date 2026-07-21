import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import {
  DomMutation,
  DomNodeState,
  INITIAL_DOM,
  MUTATIONS,
  applyMutation,
} from './dom-is-alive.data';

@Component({
  selector: 'app-dom-is-alive',
  templateUrl: './dom-is-alive.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dom-is-alive.component.css',
})
export class DomIsAliveComponent {
  protected readonly mutations: readonly DomMutation[] = MUTATIONS;
  protected readonly dom = signal<DomNodeState[]>(INITIAL_DOM.map((node) => ({ ...node })));
  protected readonly lastTouched = signal<string | null>(null);
  // Se incrementa en cada corrida para re-disparar el "ping" del nodo aunque toques el mismo.
  protected readonly runId = signal(0);

  protected run(mutation: DomMutation): void {
    this.dom.set(applyMutation(this.dom(), mutation));
    this.lastTouched.set(mutation.targetId);
    this.runId.update((n) => n + 1);
  }

  protected reset(): void {
    this.dom.set(INITIAL_DOM.map((node) => ({ ...node })));
    this.lastTouched.set(null);
  }

  protected isTouched(id: string): boolean {
    return this.lastTouched() === id;
  }
}
