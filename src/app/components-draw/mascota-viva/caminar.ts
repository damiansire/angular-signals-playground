/**
 * El paso de la mascota, como función pura de la fase. Quien la mueve por la pantalla decide la fase
 * a partir de lo que avanzó: así el pie apoyado barre justo lo que avanzó el cuerpo y no patina.
 * Las medidas van en unidades del dibujo (1080 de lado).
 */

/**
 * De la cadera al piso (y = 920). Las piernas giran desde la cadera, y no son iguales: la izquierda
 * nace en y = 770 y la derecha en 790. Con la misma apertura la derecha barría menos y patinaba.
 */
export const LARGO_DE_PIERNA = 150;
export const LARGO_DE_PIERNA_R = 130;
/** Lo que se abre cada pierna en un paso, en grados. Más abierta parecía un compás. */
export const APERTURA = 18;

/** Lo que avanza el cuerpo en un paso con esta apertura: la cuerda del arco del pie apoyado. */
export function zancada(apertura = APERTURA): number {
  return 2 * LARGO_DE_PIERNA * Math.sin((apertura * Math.PI) / 180);
}

/** La apertura que da esa zancada. Sirve para que el último paso termine justo donde tiene que. */
export function aperturaPara(largo: number): number {
  const seno = Math.min(Math.max(largo / (2 * LARGO_DE_PIERNA), 0), 0.6);
  return (Math.asin(seno) * 180) / Math.PI;
}

export interface PosturaDePaso {
  /** Giro de cada pierna desde la cadera, en grados (positivo: el pie va hacia atrás). */
  readonly piernaL: number;
  readonly piernaR: number;
  /** Cuánto sube el cuerpo (negativo es arriba). */
  readonly alzar: number;
  /** Inclinación del cuerpo hacia donde va. */
  readonly giro: number;
  readonly brazoL: number;
  readonly brazoR: number;
}

/**
 * La postura a `fase` pasos de haber arrancado. En cada paso el pie apoyado va de adelante hacia
 * atrás a ritmo parejo (si el ritmo se curvara, el pie patinaría a mitad del paso) y el otro lo cruza
 * en el aire; en cada paso entero se cambian. Con las piernas juntas (media fase) el cuerpo queda
 * arriba, y con las piernas abiertas, abajo: ese rebote es lo que hace que se lea como un paso.
 */
export function posturaDePaso(fase: number, apertura = APERTURA): PosturaDePaso {
  const paso = Math.floor(fase);
  const u = fase - paso;
  const lado = paso % 2 === 0 ? 1 : -1;
  // Lo parejo es el recorrido del pie, no el ángulo: el seno de la apertura avanza en línea recta.
  const seno = Math.sin((apertura * Math.PI) / 180) * (2 * u - 1);
  const grados = (s: number): number => (Math.asin(limitarSeno(s)) * 180) / Math.PI;
  const barrido = grados(seno);
  const barridoR = grados((seno * LARGO_DE_PIERNA) / LARGO_DE_PIERNA_R);
  const arco = Math.sin(u * Math.PI);
  return {
    piernaL: lado * barrido,
    piernaR: -lado * barridoR,
    alzar: -10 * arco,
    giro: 2 + 1.2 * lado * (u - 0.5),
    // Cada brazo va a contratiempo de la pierna de su lado, y más corto: es lo que suelta el cuerpo.
    brazoL: -lado * barrido * 0.45,
    brazoR: lado * barrido * 0.45,
  };
}

function limitarSeno(s: number): number {
  return Math.min(Math.max(s, -1), 1);
}
