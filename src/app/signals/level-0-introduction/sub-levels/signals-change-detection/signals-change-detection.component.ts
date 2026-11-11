import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import {
  ARBOL_INICIAL,
  DECLARACIONES,
  type Declaracion,
  type EstadoDelArbol,
  barrioTodo,
  correr,
  siguienteDeclaracion,
} from './signals-change-detection.data';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaSignalComponent, type Aviso } from '../../manual/escena-signal.component';
import { conCortes } from '../../../../libs/cortes-de-codigo';

/**
 * La ley 6 en una sola pieza: la nave, el árbol de su pantalla y la caja del valor son la demo, y
 * la consola tiene el código que lo cambia, con la declaración como hueco. Probar es correrlo con
 * una variable común: nadie sabe quién la lee y se barre el árbol entero, como en casa. Arreglar es
 * declararla como signal y volver a correr: se enteran solo los dos nodos que la leen.
 */
@Component({
  selector: 'app-signals-change-detection',
  templateUrl: './signals-change-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaginaDelManualComponent, EscenaSignalComponent],
  styleUrls: ['./signals-change-detection.component.css', '../../manual/portada.css'],
})
export class SignalsChangeDetectionComponent {
  /** El árbol de la portada: los dos `<p>` (verdes) son los que leen el valor de la caja. */
  protected readonly nodosDePortada = [
    { x: 150, y: 22, i: 1, lee: false },
    { x: 110, y: 52, i: 2, lee: false },
    { x: 190, y: 52, i: 2, lee: false },
    { x: 90, y: 80, i: 3, lee: false },
    { x: 130, y: 80, i: 3, lee: true },
    { x: 170, y: 80, i: 3, lee: false },
    { x: 210, y: 80, i: 3, lee: true },
  ];

  protected readonly declaracion = signal<Declaracion>(DECLARACIONES[0]);
  protected readonly arbol = signal<EstadoDelArbol>(ARBOL_INICIAL);
  /** Ya se vio el barrido entero: el paso de arreglar se prende. */
  private readonly vioElBarrido = signal(false);
  /** El último cambio de valor, para la lámina; `n` sube con cada corrida. */
  protected readonly aviso = signal<Aviso | null>(null);

  protected readonly renglonDeLaDeclaracion = computed(() => conCortes(this.declaracion().renglon));
  protected readonly escritura = computed(() => conCortes(this.declaracion().escritura));

  /** La última corrida fue con el signal, y el hueco sigue en el signal. */
  protected readonly sano = computed(
    () => this.aviso()?.signal === true && this.declaracion().esSignal,
  );
  protected readonly paso = computed<1 | 2>(() => (this.vioElBarrido() ? 2 : 1));

  /**
   * La mano dice lo mismo que los pasos: correr, el hueco mientras no sea un signal, y correr otra
   * vez. El botón lleva las corridas, así cada una es un toque distinto.
   */
  protected readonly guia = computed(() => {
    if (this.sano()) return null;
    if (this.vioElBarrido() && !this.declaracion().esSignal) return '[data-guia="declaracion"]';
    return `.scd-correr[data-cuenta="${this.arbol().total}"]`;
  });

  protected correrCodigo(): void {
    const declaracion = this.declaracion();
    this.arbol.update((a) => correr(a, declaracion));
    if (barrioTodo(this.arbol())) this.vioElBarrido.set(true);
    this.aviso.update((antes) => ({ n: (antes?.n ?? 0) + 1, signal: declaracion.esSignal }));
  }

  /** El hueco alterna entre la variable común y el signal. */
  protected cambiarDeclaracion(): void {
    this.declaracion.update(siguienteDeclaracion);
  }
}
