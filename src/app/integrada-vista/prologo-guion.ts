/**
 * El guion del prólogo y su reloj. Es la parte del prólogo que no dibuja nada, y por eso vive
 * separada del motor: acá se puede testear como función pura, sin canvas ni navegador.
 *
 * La regla que ordena todo el archivo: **una línea NO declara cuándo aparece, declara cuánto texto
 * tiene**. El reloj se calcula. Escrito al revés (tiempos absolutos a mano) agregar una línea
 * obligaba a mover a mano las veinte de abajo, y cualquier referencia por segundo quedaba vieja al
 * turno siguiente.
 */

export type Hablante = 'cap' | 'naveA' | 'naveB' | 'nave4' | 'todos' | 'voz' | 'mascota';

export interface LineaGuion {
  /** Referencia ESTABLE. Los segundos se mueven en cada cambio; el id no. */
  readonly id: string;
  readonly quien: Hablante;
  /** `\n` es un corte de renglón decidido a mano: dónde parte la frase es puesta en pantalla. */
  readonly txt: string;
  /**
   * PISO de duración, para las pocas líneas que duran por drama y no por lectura (un grito, la
   * pausa después de la revelación). Nunca acorta por debajo de lo que cuesta seguir la línea.
   */
  readonly dur?: number;
  /** Silencio antes de esta línea. */
  readonly hueco?: number;
  /** Arranca esta cantidad de ms ANTES de que termine la anterior: una interrupción. */
  readonly pisa?: number;
  /** Arranca en el MISMO instante que la anterior: dos que gritan a la vez, no por turnos. */
  readonly junto?: boolean;
}

export interface LineaEnReloj extends LineaGuion {
  readonly t0: number;
  readonly t1: number;
}

/**
 * Presupuesto para seguir una línea. `entra` y `sale` (el fundido) van SUMADOS y no descontados:
 * durante el fundido no se lee, así que si salen del mismo presupuesto se lo comen entero en las
 * líneas cortas.
 */
export const PRESUPUESTO = {
  /** Caracteres por segundo leyendo. Por debajo del techo cómodo de subtitulado, que es 17. */
  cps: 16,
  /**
   * Ritmo del modo voz, que hoy solo ofrece el Estudio como ensayo. El prólogo del juego ya NO lo
   * usa: desde que los personajes hablan con los blips del director de sonido (`libs/sonido.ts`),
   * que se reparten en la ventana que les toque, corre siempre a ritmo de lectura y dura lo mismo
   * en cualquier máquina. Nació midiendo la voz del sistema, que hablaba más lento que la lectura.
   */
  cpsVoz: 8.8,
  /** Una línea de dos palabras igual necesita registrarse antes de irse. */
  minimo: 950,
  entra: 280,
  sale: 250,
  /** Aire entre turnos: pegadas suenan a lista leída, no a gente hablando. */
  respiro: 220,
} as const;

/** Cuándo entra la primera línea. Un respiro antes de que alguien hable. */
const ARRANQUE = 800;

/** Renglones declarados como máximo por línea: más que eso deja de leerse de un vistazo. */
const MAX_RENGLONES = 3;

export const GUION: readonly LineaGuion[] = [
  { id: 'casa-volver', quien: 'cap', txt: 'Al fin es hora de volver a casa.' },
  { id: 'casa-familia', quien: 'naveA', txt: 'Extraño a mi familia.' },
  { id: 'casa-helado', quien: 'naveB', txt: 'Yo quiero comer helado de chocolate.' },
  { id: 'casa-unas', quien: 'naveA', txt: 'Y yo quiero unas…' },
  {
    id: 'casa-apuren',
    pisa: 500,
    quien: 'nave4',
    txt: '¡Oigan! Dejen de desear y apúrense,\nvan muy lento.',
  },
  { id: 'linea-msxheigk', quien: 'naveA', txt: 'Siempre tan aguafiestas.' },
  {
    id: 'anom-que-pasa',
    hueco: 300,
    quien: 'cap',
    txt: 'Esperen… ¿qué está sucediendo?',
  },
  { id: 'anom-sin-control', quien: 'naveA', txt: 'No tengo control de los sistemas.' },
  { id: 'anom-atraidos', quien: 'naveB', txt: 'Estamos siendo atraídos.' },
  {
    id: 'anom-rxjs',
    dur: 6200,
    quien: 'cap',
    txt: '¡Activen todos los operadores\nde RxJS, rápido!',
  },
  {
    id: 'anom-pipes',
    dur: 4600,
    quien: 'naveA',
    txt: 'Los pipes están recargando energía.',
  },
  { id: 'anom-lento', quien: 'naveB', txt: 'No funcionará, es demasiado lento.' },
  { id: 'anom-fuerza', quien: 'cap', txt: '¿Qué es esta fuerza…?' },
  { id: 'anom-velocidad', quien: 'cap', txt: 'Esta velocidad…' },
  {
    id: 'anom-leyes',
    quien: 'cap',
    txt: 'Debería ser imposible.\nEsto contradice todas las leyes\ndel espacio Zone.js.',
  },
  { id: 'expl-que-pasa', quien: 'nave4', txt: '¿Qué les pasa?' },
  { id: 'expl-no-responden', quien: 'nave4', txt: '¿Por qué no responden?' },
  { id: 'expl-hacia-ahi', quien: 'nave4', txt: '¿Por qué van hacia ahí?' },
  {
    id: 'expl-vuelvan',
    quien: 'nave4',
    txt: '¡No! Vuelvan al espacio de Zone.js,\nestán yendo a un espacio desconocido.',
  },
  {
    id: 'anom-perdiendo',
    quien: 'cap',
    txt: 'Los sistemas no responden a tiempo.\nEstamos perdiendo el control.',
  },
  {
    id: 'anom-grito',
    dur: 1800,
    quien: 'todos',
    txt: '¡Ahhhh!',
  },
  {
    id: 'dentro-vivos',
    hueco: 1000,
    quien: 'naveA',
    txt: 'Estamos vivos…',
  },
  { id: 'dentro-cuidado', quien: 'naveB', txt: '¡Cuidado!' },
  {
    id: 'dentro-esquiva-ya',
    junto: true,
    quien: 'naveA',
    txt: '¡Esquivá, rápido!',
  },
  { id: 'dentro-que-es', quien: 'naveB', txt: '¿Qué es esto?' },
  {
    id: 'dentro-nunca-visto',
    quien: 'naveA',
    txt: 'No lo sé, nunca había visto\nnada como esto.',
  },
  {
    id: 'dentro-escapemos',
    quien: 'cap',
    txt: 'Sea lo que sea, debemos escapar.\nRápido.',
  },
  {
    id: 'dentro-esquivar',
    quien: 'naveA',
    txt: 'Apenas puedo esquivar las partículas.\nNo me pidas escapar.',
  },
  {
    id: 'dentro-switchmap',
    quien: 'naveB',
    txt: 'switchMap no funciona,\ntampoco puedo usar los pipes.',
  },
  {
    id: 'dentro-azar',
    quien: 'cap',
    txt: 'Ningún operador de RxJS\nsirve a este nivel.',
  },
  {
    id: 'dentro-rendicion',
    quien: 'cap',
    txt: 'Aunque intentemos escapar,\ncon tantas moléculas será imposible.',
  },
  { id: 'dentro-caotico', quien: 'cap', txt: 'Esto es demasiado caótico.' },
  {
    id: 'voz-asi-que',
    dur: 3200,
    quien: 'voz',
    txt: 'Así que caótico…',
  },
  {
    id: 'react-escucharon',
    dur: 2400,
    quien: 'naveA',
    txt: '¿Escucharon eso?',
  },
  {
    id: 'react-quien',
    dur: 2600,
    quien: 'naveB',
    txt: '¿Quién ha hablado?',
  },
  {
    id: 'voz-perspectiva',
    quien: 'voz',
    txt: 'Supongo que desde su perspectiva,\nse puede interpretar como caos…',
  },
  {
    id: 'voz-armonia',
    quien: 'voz',
    txt: 'Pero desde la mía…\ntodo está en armonía.',
  },
  {
    id: 'voz-circulos',
    quien: 'voz',
    txt: 'Dos hermosos círculos de movimiento uniforme,\ny una melodía espléndida.',
  },
  { id: 'reclamo-melodia', quien: 'naveA', txt: '¿Melodía?' },
  {
    id: 'reclamo-circulos',
    junto: true,
    quien: 'naveB',
    txt: '¿Círculos?',
  },
  { id: 'reclamo-loco', quien: 'cap', txt: '¿Estás loco?' },
  { id: 'reclamo-quien-eres', quien: 'cap', txt: '¿Quién eres?' },
  { id: 'reclamo-casi-matan', quien: 'naveA', txt: 'Esas moléculas casi nos matan.' },
  {
    id: 'reclamo-armonioso',
    quien: 'cap',
    txt: 'Es lo más caótico que vivimos en nuestras vidas,\ny tú, tan tranquilo, lo llamas armonioso.',
  },
  { id: 'orden-caos-es-orden', quien: 'mascota', txt: 'El caos es orden.' },
  { id: 'orden-no-comprenden', quien: 'mascota', txt: 'Un orden que no comprenden…' },
  {
    id: 'orden-malinterpretado',
    quien: 'mascota',
    txt: 'Lo que ustedes ven como caos\nes un orden malinterpretado.',
  },
  { id: 'leccion-entiendes', quien: 'cap', txt: '¿Tú entiendes este mundo?' },
  { id: 'leccion-sacanos', quien: 'naveB', txt: 'Sácanos de aquí.' },
  { id: 'leccion-no-intervengo', quien: 'mascota', txt: 'No puedo intervenir con ustedes.' },
  { id: 'leccion-curso', quien: 'mascota', txt: 'Ustedes deben seguir su curso natural.' },
  { id: 'leccion-tirados', quien: 'naveA', txt: '¿Y nos dejarás aquí tirados?' },
  { id: 'leccion-comprender', quien: 'mascota', txt: 'No… Los ayudaré a comprender el mundo.' },
  {
    id: 'leccion-depende',
    quien: 'mascota',
    txt: 'Pero si saldrán de aquí o no,\ndependerá de ustedes…',
  },
  {
    id: 'leccion-dejar-atras',
    quien: 'mascota',
    txt: 'Y de si tienen la capacidad de dejar atrás\nlo que conocen y creen correcto.',
  },
  { id: 'leccion-listos', quien: 'cap', txt: 'Estamos listos para lo que sea.' },
  { id: 'leccion-que-hacer', quien: 'naveB', txt: '¿Qué debemos hacer?' },
  {
    id: 'leccion-reglas',
    quien: 'mascota',
    txt: 'Lo más importante es entender\nque este mundo sigue reglas.',
  },
  {
    id: 'leccion-armonia',
    quien: 'mascota',
    txt: 'Eso que ustedes llaman caos\nno era más que armonía:\npartículas siguiendo las reglas.',
  },
  {
    id: 'frase-angulo',
    hueco: 800,
    quien: 'mascota',
    txt: 'Hasta lo que parece más complejo e inalcanzable\nse vuelve fácil y predecible\nsi lo miras desde el ángulo correcto.',
  },
];

/** Caracteres visibles de una línea, sin contar los cortes de renglón. */
export function largoDe(linea: LineaGuion): number {
  return linea.txt.replace(/\n/g, ' ').length;
}

/**
 * Cuánto tiene que estar en pantalla una línea para poder seguirse sin apuro. `conVoz` es el modo
 * de ensayo del Estudio (ver `PRESUPUESTO.cpsVoz`); en el juego la voz ya no cambia el ritmo.
 */
export function ventanaDe(linea: LineaGuion, conVoz: boolean): number {
  const cps = conVoz ? PRESUPUESTO.cpsVoz : PRESUPUESTO.cps;
  const seguir = Math.max(PRESUPUESTO.minimo, Math.round((largoDe(linea) / cps) * 1000));
  return Math.max(linea.dur ?? 0, seguir + PRESUPUESTO.entra + PRESUPUESTO.sale);
}

/**
 * Encadena el guion en una sola pasada y devuelve cada línea con su ventana ya resuelta. Sin
 * `conVoz` va a ritmo de lectura, que es el único que usa el juego.
 */
export function armarReloj(
  guion: readonly LineaGuion[] = GUION,
  conVoz = false,
): readonly LineaEnReloj[] {
  const reloj: LineaEnReloj[] = [];
  let cursor = ARRANQUE;
  guion.forEach((linea, i) => {
    const previa = reloj[i - 1];
    if (previa && !linea.junto && !linea.pisa) cursor += PRESUPUESTO.respiro;
    cursor += linea.hueco ?? 0;
    const t0 = linea.junto && previa ? previa.t0 : cursor - (linea.pisa ?? 0);
    const t1 = t0 + ventanaDe(linea, conVoz);
    reloj.push({ ...linea, t0, t1 });
    cursor = Math.max(cursor, t1);
  });
  return reloj;
}

export interface Anclajes {
  readonly temblor: number;
  readonly anomalia: number;
  readonly zoom: number;
  readonly caos: number;
  readonly fusion: number;
  readonly choque: number;
  readonly frase: number;
  readonly orden: number;
  readonly fin: number;
}

const COLA = 8000;

export function anclajesDe(reloj: readonly LineaEnReloj[]): Anclajes {
  const en = (id: string): LineaEnReloj => {
    const linea = reloj.find((l) => l.id === id);
    if (!linea) throw new Error(`prologo: el anclaje apunta a "${id}", que no está en el guion`);
    return linea;
  };
  const previaDe = (id: string): LineaEnReloj => {
    const idx = reloj.findIndex((l) => l.id === id);
    if (idx > 0) return reloj[idx - 1];
    return en(id);
  };
  const anomQuePasa = en('anom-que-pasa');
  const anomalia = previaDe('anom-que-pasa').t1;
  const temblor = Math.min(anomQuePasa.t0 - 3200, anomalia - 2000);
  const orden = en('frase-angulo').t1 - 1400;
  return {
    temblor: Math.max(0, temblor),
    anomalia,
    zoom: en('anom-grito').t1,
    caos: en('dentro-vivos').t0,
    fusion: en('voz-asi-que').t0,
    choque: en('reclamo-quien-eres').t0 + 250,
    frase: en('frase-angulo').t0,
    orden,
    fin: orden + COLA,
  };
}

export function malformado(guion: readonly LineaGuion[] = GUION): readonly string[] {
  const problemas: string[] = [];
  const vistos = new Set<string>();

  guion.forEach((linea, i) => {
    if (!linea.id.trim()) problemas.push(`la línea ${i} no tiene id`);
    if (vistos.has(linea.id)) problemas.push(`el id "${linea.id}" está repetido`);
    vistos.add(linea.id);
    if (!linea.txt.trim()) problemas.push(`"${linea.id}" no tiene texto`);
    if (linea.txt.split('\n').length > MAX_RENGLONES) {
      problemas.push(`"${linea.id}" declara más de ${MAX_RENGLONES} renglones`);
    }
    if (linea.junto && linea.pisa) {
      problemas.push(`"${linea.id}" pisa y arranca junta a la vez: son dos cosas distintas`);
    }
    if (linea.junto && i === 0) problemas.push(`"${linea.id}" arranca junta a nada: es la primera`);
  });

  return problemas;
}

const MAX_COLUMNAS = 52;

export function renglonesLargos(guion: readonly LineaGuion[] = GUION): readonly string[] {
  return guion.flatMap((linea) =>
    linea.txt
      .split('\n')
      .filter((renglon) => renglon.length > MAX_COLUMNAS)
      .map((renglon) => `"${linea.id}": ${renglon.length} columnas en "${renglon.slice(0, 24)}…"`),
  );
}
