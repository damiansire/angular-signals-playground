import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import {
  INITIAL_DOM,
  SELECTORES_DEL_TITULO,
  type DomNodeState,
  type SelectorDelTitulo,
  codigoDe,
  correr,
  encontrar,
  lineas,
  siguienteSelector,
} from './dom-is-alive.data';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaVivoComponent, type CorridaVivo } from '../../manual/escena-vivo.component';
import { conCortes } from '../../../../libs/cortes-de-codigo';

/**
 * La ley 2 en una sola pieza: la pantalla de la nave muestra los nodos, rotulados con su selector, y
 * la consola tiene las tres líneas que los cambian. Probar es correrlas: la del título busca un
 * selector que no está, recibe `null` y no cambia nada. Arreglar es cambiar ese selector por el del
 * nodo y volver a correr.
 */
@Component({
  selector: 'app-dom-is-alive',
  templateUrl: './dom-is-alive.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaginaDelManualComponent, EscenaVivoComponent],
  styleUrl: './dom-is-alive.component.css',
})
export class DomIsAliveComponent {
  protected readonly selector = signal<SelectorDelTitulo>(SELECTORES_DEL_TITULO[0]);
  protected readonly dom = signal<readonly DomNodeState[]>(INITIAL_DOM);
  protected readonly corrida = signal<CorridaVivo | null>(null);
  /** Ya se vio una línea que no encontró nada: el paso de arreglar se prende. */
  private readonly vioElBug = signal(false);
  /** El último selector que dio `null`: el paso de arreglar lo nombra. */
  protected readonly fallido = signal<string>(SELECTORES_DEL_TITULO[0]);

  // Las dos que andan no cambian; la del título va partida para que el hueco sea su selector.
  protected readonly fijas = lineas('')
    .slice(0, 2)
    .map((m) => conCortes(codigoDe(m)));
  protected readonly antesDelSelector = conCortes('querySelector(');
  protected readonly despuesDelSelector = conCortes(").textContent = 'Listo'");

  /** El selector del hueco encuentra un nodo. */
  protected readonly encuentra = computed(() => encontrar(INITIAL_DOM, this.selector()) !== null);
  /** La última corrida de la línea del título, con el selector de ahora, dio `null`. */
  protected readonly dioNull = computed(() => {
    const titulo = this.corrida()?.envios.at(-1);
    return titulo?.destino === null && titulo.selector === this.selector();
  });
  protected readonly sano = computed(() => {
    const envios = this.corrida()?.envios ?? [];
    return envios.length > 0 && envios.every((e) => e.destino !== null) && this.encuentra();
  });
  protected readonly paso = computed<1 | 2>(() => (this.vioElBug() ? 2 : 1));
  protected readonly cuenta = computed(() => this.corrida()?.n ?? 0);

  /**
   * La mano dice lo mismo que los pasos: correr, el hueco mientras su selector no encuentre nada, y
   * correr otra vez. El botón lleva las corridas, así cada una es un toque distinto.
   */
  protected readonly guia = computed(() => {
    if (this.sano()) return null;
    if (this.vioElBug() && !this.encuentra()) return '[data-guia="selector"]';
    return `.dia-correr[data-cuenta="${this.cuenta()}"]`;
  });

  protected correrCodigo(): void {
    const { dom, envios } = correr(this.dom(), lineas(this.selector()));
    this.dom.set(dom);
    const perdido = envios.find((e) => e.destino === null);
    if (perdido) {
      this.vioElBug.set(true);
      this.fallido.set(perdido.selector);
    }
    this.corrida.update((antes) => ({ n: (antes?.n ?? 0) + 1, envios }));
  }

  /** El hueco rota al selector siguiente. */
  protected cambiarSelector(): void {
    this.selector.update(siguienteSelector);
  }
}
