/**
 * Dominio puro del carrito reactivo (sin Angular): la matemática que el
 * componente envuelve en signals/computed. Se testea como funciones puras
 * sobre fixtures, sin TestBed. Los precios son enteros (pesos) para que los
 * totales sean exactos; el único redondeo es el del descuento porcentual.
 */
export interface Product {
  id: string;
  name: string;
  /** Precio unitario en pesos (entero). */
  price: number;
}

export type Quantities = Record<string, number>;

export function lineTotal(price: number, qty: number): number {
  return price * Math.max(0, qty);
}

export function subtotal(catalog: readonly Product[], qty: Quantities): number {
  return catalog.reduce((sum, p) => sum + lineTotal(p.price, qty[p.id] ?? 0), 0);
}

export function itemCount(qty: Quantities): number {
  return Object.values(qty).reduce((sum, q) => sum + Math.max(0, q), 0);
}

/** Descuento del cupón: `rate` del subtotal, redondeado, o 0 si no está aplicado. */
export function discountAmount(sub: number, couponApplied: boolean, rate = 0.1): number {
  return couponApplied ? Math.round(sub * rate) : 0;
}

export function total(sub: number, discount: number): number {
  return Math.max(0, sub - discount);
}

export function qualifiesFreeShipping(sub: number, threshold: number): boolean {
  return sub >= threshold;
}

/** Progreso hacia el envío gratis, 0..1 (para una barra). */
export function shippingProgress(sub: number, threshold: number): number {
  if (threshold <= 0) return 1;
  return Math.min(1, Math.max(0, sub / threshold));
}
