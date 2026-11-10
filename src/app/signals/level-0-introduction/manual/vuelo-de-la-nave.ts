import { Injectable } from '@angular/core';

/** Cuánto espera la página siguiente a la nave: si tarda más en montarse, la nave ya está ahí. */
export const VIGENCIA_DEL_VUELO_MS = 4000;

/**
 * El viaje de la nave de una página del libro a la siguiente. La escena con la nave a la vista se
 * anota para despegar; la página que pasa de hoja la hace despegar y espera a que salga por la
 * derecha; y la escena de la página nueva pregunta si la nave llega volando, para traerla desde la
 * izquierda. Así pasar de página se siente como seguir viaje, no como cambiar de pantalla.
 */
@Injectable({ providedIn: 'root' })
export class VueloDeLaNave {
  private despegue: (() => Promise<void>) | null = null;
  private partio = Number.NEGATIVE_INFINITY;

  /** La escena se anota con su despegue; devuelve con qué soltarlo al desmontarse. */
  alDespegar(despegue: () => Promise<void>): () => void {
    this.despegue = despegue;
    return () => {
      if (this.despegue === despegue) this.despegue = null;
    };
  }

  /** La nave se va volando; resuelve cuando ya salió. Sin nave a la vista, enseguida. */
  async despegar(): Promise<void> {
    this.partio = Date.now();
    await this.despegue?.();
  }

  /** Para la escena que se monta: ¿la nave viene volando de la página anterior? Una vez por viaje. */
  llegaVolando(): boolean {
    const llega = Date.now() - this.partio < VIGENCIA_DEL_VUELO_MS;
    this.partio = Number.NEGATIVE_INFINITY;
    return llega;
  }
}
