import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import {
  APIS,
  ZONA_INICIAL,
  type ApiAsync,
  type EstadoDeLaZona,
  correr,
  quedoVieja,
  siguienteApi,
} from './old-change-detection.data';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaZonaComponent, type Llamada } from '../../manual/escena-zona.component';
import { conCortes } from '../../../../libs/cortes-de-codigo';

// La sangría va con espacios duros (U+00A0): con espacios comunes, al envolver en angosto el
// renglón se cortaba justo después de ellos y quedaba uno vacío arriba del código.
const SANGRIA = '  ';

/**
 * La ley 5 en una sola pieza: la cerca de Zone.js, la nave y el árbol de su pantalla son la demo, y
 * la consola tiene el código que cambia el valor, con la API como hueco. Probar es correrlo con la
 * que Zone.js no parchea: el valor cambia, pero nadie revisa y la pantalla queda vieja. Arreglar es
 * cambiar la API por una parcheada y volver a correr: el barrido revisa el árbol entero.
 */
@Component({
  selector: 'app-old-change-detection',
  templateUrl: './old-change-detection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaginaDelManualComponent, EscenaZonaComponent],
  styleUrls: ['./old-change-detection.component.css', '../../manual/portada.css'],
})
export class OldChangeDetectionComponent {
  /** El dibujo de la portada: el árbol, revisado entero, nodo por nodo desde la raíz. */
  protected readonly nodosDePortada = [
    { x: 170, y: 38, i: 2 },
    { x: 130, y: 70, i: 3 },
    { x: 210, y: 70, i: 3 },
    { x: 110, y: 100, i: 4 },
    { x: 150, y: 100, i: 4 },
    { x: 190, y: 100, i: 5 },
    { x: 230, y: 100, i: 5 },
  ];

  protected readonly api = signal<ApiAsync>(APIS[0]);
  protected readonly zona = signal<EstadoDeLaZona>(ZONA_INICIAL);
  /** Ya se vio la pantalla vieja: el paso de arreglar se prende. */
  private readonly vioElBug = signal(false);
  /** La última llamada, para la lámina; `n` sube con cada corrida. */
  protected readonly llamada = signal<Llamada | null>(null);

  protected readonly cuerpo = [conCortes(SANGRIA + 'this.total++;'), conCortes('});')];
  protected readonly renglonDeLaApi = computed(() => conCortes(this.api().renglon));

  protected readonly vieja = computed(() => quedoVieja(this.zona()));
  /** La última corrida fue con una API parcheada y la pantalla quedó al día. */
  protected readonly sano = computed(
    () => this.llamada()?.parcheada === true && this.api().parcheada && !this.vieja(),
  );
  protected readonly paso = computed<1 | 2>(() => (this.vioElBug() ? 2 : 1));

  /**
   * La mano dice lo mismo que los pasos: correr, el hueco mientras la API no esté parcheada, y
   * correr otra vez. El botón lleva las corridas, así cada una es un toque distinto.
   */
  protected readonly guia = computed(() => {
    if (this.sano()) return null;
    if (this.vioElBug() && !this.api().parcheada) return '[data-guia="api"]';
    return `.ocd-correr[data-cuenta="${this.zona().total}"]`;
  });

  protected correrCodigo(): void {
    const api = this.api();
    this.zona.update((z) => correr(z, api));
    if (this.vieja()) this.vioElBug.set(true);
    this.llamada.update((antes) => ({
      n: (antes?.n ?? 0) + 1,
      api: api.nombre,
      parcheada: api.parcheada,
    }));
  }

  /** El hueco rota a la API siguiente. */
  protected cambiarApi(): void {
    this.api.update(siguienteApi);
  }
}
