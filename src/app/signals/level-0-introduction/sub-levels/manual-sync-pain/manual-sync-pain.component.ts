import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import {
  PANEL_INICIAL,
  SPOTS,
  type PanelAMano,
  type SpotId,
  increment,
  staleSpots,
} from './manual-sync-pain.data';
import { PaginaDelManualComponent } from '../../manual/pagina-del-manual.component';
import { EscenaAManoComponent, type LugarDelPanel } from '../../manual/escena-a-mano.component';
import { conCortes } from '../../../../libs/cortes-de-codigo';

const TODOS = new Set<SpotId>(['value', 'mult2', 'mult3']);
const SOLO_EL_VALOR = new Set<SpotId>(['value']);

// La sangría va con espacios duros (U+00A0): con espacios comunes, al envolver en angosto el
// renglón se cortaba justo después de ellos y quedaba uno vacío arriba del código.
const SANGRIA = '  ';
const renglon = (texto: string) => conCortes(SANGRIA + texto);

/**
 * La ley 4 en una sola pieza: el panel de la nave es la demo, y la consola tiene el handler con el
 * hueco que se olvida. Probar es sumar y ver qué lugar queda viejo; arreglar es completar el handler
 * en el mismo código y volver a sumar. El panel no se arregla solo al completar: se arregla en la
 * próxima corrida, como en el DOM.
 */
@Component({
  selector: 'app-manual-sync-pain',
  templateUrl: './manual-sync-pain.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaginaDelManualComponent, EscenaAManoComponent],
  styleUrl: './manual-sync-pain.component.css',
})
export class ManualSyncPainComponent {
  protected readonly panel = signal<PanelAMano>(PANEL_INICIAL);
  protected readonly completo = signal(false);
  /** Con qué handler corrió el último `increment()`: el arreglo vale cuando ya corrió. */
  private readonly corrioCompleto = signal(false);
  /** Ya se vio un lugar viejo: el paso de arreglar se prende. */
  private readonly vioElBug = signal(false);

  protected readonly antes = [
    conCortes('function increment() {'),
    renglon('count++'),
    renglon("querySelector('#count').textContent = count"),
  ];
  // Las del hueco van sin sangría de texto: la pone el botón, así el subrayado no la toma.
  protected readonly faltan = conCortes('// falta #mult2 y #mult3');
  protected readonly agregadas = [
    conCortes("querySelector('#mult2').textContent = count % 2 ? 'No' : 'Sí'"),
    conCortes("querySelector('#mult3').textContent = count % 3 ? 'No' : 'Sí'"),
  ];

  private readonly viejos = computed(() => new Set(staleSpots(this.panel())));
  protected readonly sano = computed(() => this.completo() && this.corrioCompleto());
  protected readonly paso = computed<1 | 2>(() => (this.vioElBug() || this.completo() ? 2 : 1));

  /** Los tres lugares como los ve el panel de la nave. */
  protected readonly lugaresDelPanel = computed<LugarDelPanel[]>(() =>
    SPOTS.map((spot) => ({
      id: spot.id,
      rotulo: spot.selector,
      valor: this.panel().shown[spot.id],
      viejo: this.viejos().has(spot.id),
      sincronizado: this.completo() || spot.id === 'value',
    })),
  );

  /**
   * La mano dice lo mismo que los pasos: suma hasta que un lugar queda viejo, después el hueco, y una
   * suma más con el handler completo. El botón lleva la cuenta, así cada suma es un toque distinto.
   */
  protected readonly guia = computed(() => {
    if (this.sano()) return null;
    if (this.vioElBug() && !this.completo()) return '[data-guia="completo"]';
    return `.msp-inc[data-cuenta="${this.panel().count}"]`;
  });

  protected sumar(): void {
    const completo = this.completo();
    this.panel.update((p) => increment(p, completo ? TODOS : SOLO_EL_VALOR));
    this.corrioCompleto.set(completo);
    if (this.viejos().size > 0) this.vioElBug.set(true);
  }

  /** Tocar el hueco escribe las dos líneas que faltaban; tocarlas otra vez las borra. */
  protected alternarHandler(): void {
    const completo = !this.completo();
    this.completo.set(completo);
    if (!completo) this.corrioCompleto.set(false);
  }
}
