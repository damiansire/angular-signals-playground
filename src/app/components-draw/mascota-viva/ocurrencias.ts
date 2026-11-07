/**
 * Lo que la mascota hace sola cuando nadie la toca. Respirar y parpadear no alcanzan: quieta entre
 * dos parpadeos se lee como un dibujo, no como alguien esperando. Cada tanto se le ocurre algo.
 */
export const OCURRENCIAS = [
  'mirarIdea',
  'mirarAlrededor',
  'cambiarPeso',
  'saltito',
  'estirarse',
  'saludo',
] as const;

export type Ocurrencia = (typeof OCURRENCIAS)[number];

/**
 * En el orden de `OCURRENCIAS`. Lo chico pasa seguido; estirarse o saludar, de vez en cuando:
 * repetidos pierden la gracia. Un arreglo y no un objeto por nombre: esto viaja en el bundle inicial.
 */
const PESOS = [3, 3, 3, 2, 1, 1];
const peso = (o: Ocurrencia): number => PESOS[OCURRENCIAS.indexOf(o)];

/**
 * Elige la próxima con una `tirada` en [0, 1). Nunca repite la anterior: dos veces seguidas lo
 * mismo es un loop, y un loop es justo lo que esto viene a romper.
 */
export function elegirOcurrencia(anterior: Ocurrencia | null, tirada: number): Ocurrencia {
  const posibles = OCURRENCIAS.filter((o) => o !== anterior);
  const total = posibles.reduce((suma, o) => suma + peso(o), 0);
  // Fuera de [0, 1) no hace falta recortar: abajo sale la primera y arriba, la última.
  let resto = tirada * total;
  for (const o of posibles) {
    resto -= peso(o);
    if (resto < 0) return o;
  }
  return posibles[posibles.length - 1];
}

/** Entre una y otra, un rato irregular: a intervalo fijo parecería un reloj, no un bicho. */
export const ESPERA_MIN_MS = 1600;
export const ESPERA_MAX_MS = 4200;

/** Con una `tirada` en [0, 1), como la de `Math.random()`. */
export function esperaHastaLaProxima(tirada: number): number {
  return Math.round(ESPERA_MIN_MS + tirada * (ESPERA_MAX_MS - ESPERA_MIN_MS));
}
