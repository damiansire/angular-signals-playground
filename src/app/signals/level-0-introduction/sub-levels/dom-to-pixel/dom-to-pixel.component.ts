import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import {
  CAMBIOS,
  type Cambio,
  esBarato,
  queSigue,
  quedoFluida,
  siguienteCambio,
} from './dom-to-pixel.data';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaCostoComponent, type CorridaDelCuadro } from '../../manual/escena-costo.component';
import { conCortes } from '../../../../libs/cortes-de-codigo';
import { ESTACIONES } from '../../../../libs/render-pipeline';

// La sangría va con espacios duros (U+00A0): con espacios comunes, al envolver en angosto el
// renglón se cortaba justo después de ellos y quedaba uno vacío arriba del código.
const SANGRIA = '  ';

/**
 * La ley 3 en una sola pieza: la nave vuela y su pantalla tiene el pipeline de render y, al lado,
 * el cuadro que corre una y otra vez, con la propiedad como hueco. Probar es correrlo con
 * `left`: el flujo pasa por layout y paint y la nave se traba. Arreglar es rotar la propiedad y
 * correr con cada una, hasta `transform`, que salta las capas caras y deja volar fluido.
 */
@Component({
  selector: 'app-dom-to-pixel',
  templateUrl: './dom-to-pixel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaginaDelManualComponent, EscenaCostoComponent],
  styleUrls: ['./dom-to-pixel.component.css', '../../manual/portada.css'],
})
export class DomToPixelComponent {
  /**
   * El dibujo de la portada: el pipeline en fila, con el cambio barato (`transform`) encendido. Las
   * capas caras quedan salteadas, punteadas, como en la pantalla.
   */
  protected readonly estacionesDePortada = ESTACIONES.map((nombre, i) => {
    const salteada = i === 2 || i === 3;
    return {
      nombre,
      i: i === 4 ? 4 : i,
      x: 30 + i * 60,
      salteada,
      relleno: i === 0 ? '#26346e' : salteada ? '#1c1434' : '#5fd39a',
      borde: i === 0 ? '#8fb3ff' : salteada ? '#6c5ca8' : '#2b1b33',
    };
  });
  protected readonly cambio = signal<Cambio>(CAMBIOS[0]);
  /** Con qué propiedad corrió el último cuadro: el arreglo vale cuando ya corrió. */
  private readonly corrido = signal<Cambio | null>(null);
  /** Ya se vio un cuadro que se traba: el paso de arreglar se prende. */
  private readonly vioElCosto = signal(false);
  protected readonly corrida = signal<CorridaDelCuadro | null>(null);

  protected readonly arranque = conCortes('function cuadro(t) {');
  protected readonly cierre = [
    conCortes(SANGRIA + 'requestAnimationFrame(cuadro);'),
    conCortes('}'),
  ];
  protected readonly renglonDelCambio = computed(() => conCortes(this.cambio().renglon));
  protected readonly barato = computed(() => esBarato(this.cambio()));

  protected readonly sano = computed(() => quedoFluida(this.cambio(), this.corrido()));
  protected readonly paso = computed<1 | 2>(() => (this.vioElCosto() ? 2 : 1));

  /**
   * La mano dice lo mismo que los pasos: correr, y después el hueco y correr con cada propiedad,
   * hasta que corre `transform`. El botón lleva las corridas, así cada una es un toque distinto.
   */
  protected readonly guia = computed(() => {
    const sigue = queSigue(this.cambio(), this.corrido());
    if (sigue === null) return null;
    if (sigue === 'propiedad') return '[data-guia="propiedad"]';
    return `.dtp-correr[data-cuenta="${this.corrida()?.n ?? 0}"]`;
  });

  protected correr(): void {
    const cambio = this.cambio();
    this.corrido.set(cambio);
    if (!esBarato(cambio)) this.vioElCosto.set(true);
    this.corrida.update((antes) => ({
      n: (antes?.n ?? 0) + 1,
      kind: cambio.kind,
      propiedad: cambio.propiedad,
    }));
  }

  /** El hueco rota a la propiedad siguiente. */
  protected cambiarPropiedad(): void {
    this.cambio.update(siguienteCambio);
  }
}
