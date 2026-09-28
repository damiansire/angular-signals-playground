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
  4: () => import('./escena-04.component').then((m) => m.Escena04Component),
  5: () => import('./escena-05.component').then((m) => m.Escena05Component),
  6: () => import('./escena-06.component').then((m) => m.Escena06Component),
  7: () => import('./escena-07.component').then((m) => m.Escena07Component),
  8: () => import('./escena-08.component').then((m) => m.Escena08Component),
  9: () => import('./escena-09.component').then((m) => m.Escena09Component),
  10: () => import('./escena-10.component').then((m) => m.Escena10Component),
  11: () => import('./escena-11.component').then((m) => m.Escena11Component),
  12: () => import('./escena-12.component').then((m) => m.Escena12Component),
};

export function cargarEscena(capitulo: number): Promise<Type<unknown>> {
  const cargar =
    ESCENAS[capitulo] ??
    (() => import('./escena-base.component').then((m) => m.EscenaBaseComponent));
  return cargar();
}
