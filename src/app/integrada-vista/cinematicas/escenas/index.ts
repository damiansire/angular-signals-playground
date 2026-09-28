import { type Type } from '@angular/core';

/**
 * La escena de cada capítulo (12 es el final), cargada recién cuando hace falta: son trece
 * escenas con su dibujo y su CSS, y en el bundle inicial pagarían todas por una que se ve. Un
 * capítulo sin escena propia se juega con la base (su átomo, la tripulación y la mascota): nunca
 * queda un capítulo sin cinemática por falta de dibujo.
 */
const ESCENAS: Readonly<Record<number, () => Promise<Type<unknown>>>> = {
  0: () => import('./escena-00.component').then((m) => m.Escena00Component),
  1: () => import('./escena-01.component').then((m) => m.Escena01Component),
  2: () => import('./escena-02.component').then((m) => m.Escena02Component),
  3: () => import('./escena-03.component').then((m) => m.Escena03Component),
};

export function cargarEscena(capitulo: number): Promise<Type<unknown>> {
  const cargar =
    ESCENAS[capitulo] ??
    (() => import('./escena-base.component').then((m) => m.EscenaBaseComponent));
  return cargar();
}
