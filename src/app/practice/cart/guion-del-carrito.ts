import type { LineaDelViaje } from '../../components-draw/tripulacion/tripulacion.component';

/** Lo que importa del carrito para la charla: lo que se ve cambiar, no cómo se calculó. */
export interface FotoDelCarrito {
  readonly unidades: number;
  readonly cupon: boolean;
  readonly envioGratis: boolean;
}

/** Los momentos del carrito que la tripulación comenta. */
export type MomentoDelCarrito = 'llegada' | 'cantidad' | 'cupon' | 'envio' | 'sinEnvio' | 'vacio';

/**
 * Lo que dice la tripulación en la práctica. Cada línea nombra lo que se derivó solo, porque eso es
 * lo que la práctica viene a mostrar: vos tocás cantidades y el resto se entera.
 */
export const GUION_DEL_CARRITO: Readonly<Record<MomentoDelCarrito, LineaDelViaje>> = {
  llegada: { quien: 'cap', txt: 'Cargamos la bodega.\nVos tocás las cantidades.' },
  cantidad: { quien: 'naveA', txt: 'Cambió una cantidad.\nEl total se rehízo solo.' },
  cupon: { quien: 'naveB', txt: 'El cupón cambia el total,\nno el carrito.' },
  envio: { quien: 'cap', txt: '¡Envío gratis!\nY nadie lo escribió.' },
  sinEnvio: { quien: 'naveB', txt: 'Bajó el subtotal.\nEl envío se recalculó.' },
  vacio: { quien: 'naveA', txt: 'Vacía,\ny se guardó sola.' },
};

/**
 * Qué momento fue el último cambio, o `null` si no cambió nada que se vea. Gana lo que más se nota:
 * el envío gratis antes que la cantidad que lo provocó, y vaciar antes que perder el envío.
 */
export function momentoDelCarrito(
  antes: FotoDelCarrito,
  ahora: FotoDelCarrito,
): MomentoDelCarrito | null {
  if (!antes.envioGratis && ahora.envioGratis) return 'envio';
  if (antes.unidades > 0 && ahora.unidades === 0) return 'vacio';
  if (antes.envioGratis && !ahora.envioGratis) return 'sinEnvio';
  if (antes.cupon !== ahora.cupon) return 'cupon';
  if (antes.unidades !== ahora.unidades) return 'cantidad';
  return null;
}
