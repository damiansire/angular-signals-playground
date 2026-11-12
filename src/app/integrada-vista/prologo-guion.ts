/**
 * El guion del prólogo y su reloj. Es la parte del prólogo que no dibuja nada, y por eso vive
 * separada del motor: acá se puede testear como función pura, sin canvas ni navegador.
 *
 * La regla que ordena todo el archivo: **una línea NO declara cuándo aparece, declara cuánto texto
 * tiene**. El reloj se calcula. Escrito al revés (tiempos absolutos a mano) agregar una línea
 * obligaba a mover a mano las veinte de abajo, y cualquier referencia por segundo quedaba vieja al
 * turno siguiente.
 */

import { LO_QUE_DICE_EL_SOL, LO_QUE_RESPONDE_ANGIE } from './intercambio-del-sol';
import { VOCES_DEL_PROLOGO } from './voces-del-prologo';

export type Hablante = 'cap' | 'naveA' | 'naveB' | 'nave4' | 'todos' | 'voz' | 'mascota';

export interface LineaGuion {
  /** Referencia ESTABLE. Los segundos se mueven en cada cambio; el id no. */
  readonly id: string;
  readonly quien: Hablante;
  /**
   * En la caja de diálogo la frase corta sola, por el ancho de la caja: un `\n` a mano más el corte
   * automático dejaba renglones de una palabra. Solo lo que va arriba sin caja (la voz, el grito)
   * declara sus cortes con `\n`. El código va entre comillas invertidas (`switchMap`) y se ve como
   * código.
   */
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

/** Los que hablan sin caja, arriba de la escena. Son los únicos que cortan sus renglones a mano. */
const SIN_CAJA: ReadonlySet<Hablante> = new Set(['voz', 'todos']);

/** Lo que se lee de una línea: sin las comillas invertidas que marcan el código. */
export function textoVisible(linea: LineaGuion): string {
  return linea.txt.replace(/`/g, '');
}

export const GUION: readonly LineaGuion[] = [
  // ACTO 0 · vuelven a casa. Charla de nada, a propósito: sin esto no hay a quién perder después.
  { id: 'casa-volver', quien: 'cap', txt: 'Al fin es hora de volver a casa.' },
  { id: 'casa-familia', quien: 'naveA', txt: 'Extraño a mi familia.' },
  { id: 'casa-helado', quien: 'naveB', txt: 'Yo quiero comer helado de chocolate.' },
  // Estas dos se PISAN, y es la única superposición del guion: la exploradora entra mientras el
  // otro todavía está hablando, que es lo que hace que se lea como una interrupción y no un turno.
  { id: 'casa-unas', quien: 'naveA', txt: 'Y yo quiero unas papas fritas…' },
  {
    id: 'casa-apuren',
    pisa: 500,
    quien: 'nave4',
    txt: '¡Oigan! Dejen de desear y apúrense, van muy lento.',
  },
  { id: 'linea-msxheigk', quien: 'naveA', txt: 'Siempre tan aguafiestas.' },

  // ACTO 1 · la anomalía. Lo que falla son los operadores: perseguir el cambio no alcanza cuando el
  // cambio es más rápido que vos. Es el argumento del nivel 0 contado como accidente.
  {
    id: 'anom-que-pasa',
    hueco: 300,
    quien: 'cap',
    txt: 'Esperen… ¿qué está sucediendo?',
  },
  { id: 'anom-sin-control', quien: 'naveA', txt: 'No tengo control de los sistemas.' },
  { id: 'anom-atraidos', quien: 'naveB', txt: 'Estamos siendo atraídos.' },
  // `dur` acá no es drama: es que la orden tiene que seguir en pantalla mientras las naves
  // todavía están disparando operadores. Apagarla antes deja el gesto contado por la mitad.
  {
    id: 'anom-rxjs',
    dur: 6200,
    quien: 'cap',
    txt: '¡Activen todos los operadores de RxJS, rápido!',
  },
  {
    id: 'anom-pipes',
    dur: 4600,
    quien: 'naveA',
    txt: 'Los pipes están recargando energía.',
  },
  { id: 'anom-lento', quien: 'naveB', txt: 'No funcionará, es demasiado lento.' },

  // El capitán deja de dar órdenes y empieza a describir: tres tirones, cada uno más largo, hasta
  // nombrar lo que se rompe. Ahí el problema deja de ser operativo y pasa a ser de física.
  { id: 'anom-fuerza', quien: 'cap', txt: '¿Qué es esta fuerza…?' },
  { id: 'anom-velocidad', quien: 'cap', txt: 'Esta velocidad…' },
  // Antes de rendirse a la física nueva, el capitán busca en el libro de la física vieja. El manual
  // explica cómo funciona la pantalla en casa, y su última página es la que la anomalía contradice.
  { id: 'anom-manual', quien: 'cap', txt: '¡Rápido, el manual de a bordo!' },
  {
    id: 'anom-leyes',
    quien: 'cap',
    txt: 'Debería ser imposible. Esto contradice todas las leyes del espacio Zone.js.',
  },

  // La exploradora quedó AFUERA y ve cómo se los llevan. Sus cuatro líneas son el último intento de
  // que el sistema conocido alcance: volver a donde las herramientas funcionan.
  { id: 'expl-que-pasa', quien: 'nave4', txt: '¿Qué les pasa?' },
  { id: 'expl-no-responden', quien: 'nave4', txt: '¿Por qué no responden?' },
  { id: 'expl-hacia-ahi', quien: 'nave4', txt: '¿Por qué van hacia ahí?' },
  // El ESPACIO es Zone.js; RxJS son las herramientas que ahí adentro funcionan. Nombrarlos igual
  // hacía que se leyeran como dos lugares distintos.
  {
    id: 'expl-vuelvan',
    quien: 'nave4',
    txt: '¡No! Vuelvan al espacio de Zone.js, están yendo a un espacio desconocido.',
  },
  {
    id: 'anom-perdiendo',
    quien: 'cap',
    txt: 'Los sistemas no responden a tiempo. Estamos perdiendo el control.',
  },
  {
    id: 'anom-grito',
    dur: 1800,
    quien: 'todos',
    txt: '¡Ahhhh!',
  },

  // ACTO 2 · del otro lado. La orden de escapar choca contra que acá esquivar YA es todo lo que se
  // puede hacer: el sistema está saturado sosteniendo el presente.
  {
    id: 'dentro-vivos',
    hueco: 1000,
    quien: 'naveA',
    txt: 'Estamos vivos…',
  },
  // Las dos gritan A LA VEZ, cada una desde su costado: no se turnan para avisar de algo que les
  // está cayendo encima. La bola que dispara el grito es la misma que después esquivan.
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
    txt: 'No lo sé, nunca había visto nada como esto.',
  },
  // Acá se lanzan hacia adelante y frenan de golpe sobre la línea de abajo: el intento de escapar y
  // el "apenas puedo esquivar" son el mismo gesto visto de afuera y de adentro.
  {
    id: 'dentro-escapemos',
    quien: 'cap',
    txt: 'Sea lo que sea, debemos escapar. Rápido.',
  },
  {
    id: 'dentro-esquivar',
    quien: 'naveA',
    txt: 'Apenas puedo esquivar las partículas. No me pidas escapar.',
  },
  // El diagnóstico va de lo concreto a lo general: primero la herramienta que no responde, después
  // la categoría entera.
  {
    id: 'dentro-switchmap',
    quien: 'naveB',
    txt: '`switchMap` no funciona, tampoco puedo usar los pipes.',
  },
  {
    id: 'dentro-azar',
    quien: 'cap',
    txt: 'Ningún operador de RxJS sirve a este nivel.',
  },
  {
    id: 'dentro-rendicion',
    quien: 'cap',
    txt: 'Aunque intentemos escapar, con tantas moléculas será imposible.',
  },
  // Cierra con la palabra que ella va a repetir: el corte deja de ser un corte porque lo escuchó.
  { id: 'dentro-caotico', quien: 'cap', txt: LO_QUE_DICE_EL_SOL },

  // ACTO 3 · la voz. Todavía no tiene cuerpo, y por eso "¿quién ha hablado?" se entiende solo.
  // La misma respuesta que Angie le dio al sol en la colina: es esa charla, oída desde este lado.
  { id: 'voz-supongo', quien: 'voz', txt: LO_QUE_RESPONDE_ANGIE },
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
  // "Armonía" no es una metáfora: los puntos hacen movimiento armónico simple, y así está escrito
  // en `tusi-math`. La frase describe literalmente lo que la pantalla va a hacer.
  {
    id: 'voz-armonia',
    quien: 'voz',
    txt: 'Pero desde la mía…\ntodo está en armonía.',
  },
  // Describe lo que ve, y lo que ve ES el final de la intro que sigue: dos círculos, movimiento
  // uniforme. Nadie más puede verlo todavía, y esa distancia es lo que el reclamo pone en palabras.
  {
    id: 'voz-circulos',
    quien: 'voz',
    txt: 'Dos hermosos círculos de movimiento uniforme,\ny una melodía espléndida.',
  },

  // ACTO 4 · el reclamo. Primera vez que le CONTESTAN: hasta acá solo preguntaban al aire. Es lo
  // que vuelve creíble al personaje, porque alguien dice en voz alta lo que el público piensa.
  { id: 'reclamo-melodia', quien: 'naveA', txt: '¿Melodía?' },
  {
    id: 'reclamo-circulos',
    junto: true,
    quien: 'naveB',
    txt: '¿Círculos?',
  },
  { id: 'reclamo-loco', quien: 'cap', txt: '¿Estás loco?' },
  // La pregunta que el CHOQUE contesta: la mascota nace acá, ni un segundo antes. Apareciendo sin
  // que nadie la llame es un efecto; apareciendo acá, es una respuesta.
  { id: 'reclamo-quien-eres', quien: 'cap', txt: '¿Quién eres?' },
  { id: 'reclamo-casi-matan', quien: 'naveA', txt: 'Esas moléculas casi nos matan.' },
  // Una frase por caja y en un renglón: la queja larga se parte donde se toma aire.
  {
    id: 'reclamo-armonioso',
    quien: 'cap',
    txt: 'Es lo más caótico que vivimos en nuestras vidas…',
  },
  { id: 'reclamo-tranquilo', quien: 'cap', txt: '…y tú, tan tranquilo, lo llamas armonioso.' },

  // ACTO 5 · la tesis, en tres golpes cada vez más largos. Ya tiene cuerpo: deja de ser "la voz".
  { id: 'orden-caos-es-orden', quien: 'mascota', txt: 'El caos es orden.' },
  { id: 'orden-no-comprenden', quien: 'mascota', txt: 'Un orden que no comprenden…' },
  {
    id: 'orden-malinterpretado',
    quien: 'mascota',
    txt: 'Lo que ustedes ven como caos es un orden malinterpretado.',
  },

  // ACTO 6 · el pacto, que es el puente al recorrido. Lo que lo hace un pacto y no un favor es que
  // él se NIEGA primero: no los saca, los enseña. Salir queda del lado de ellos, que es exactamente
  // el trato que la app le propone a quien la abre.
  { id: 'leccion-entiendes', quien: 'cap', txt: '¿Tú entiendes este mundo?' },
  { id: 'leccion-sacanos', quien: 'naveB', txt: 'Sácanos de aquí.' },
  { id: 'leccion-no-intervengo', quien: 'mascota', txt: 'No puedo intervenir con ustedes.' },
  { id: 'leccion-curso', quien: 'mascota', txt: 'Ustedes deben seguir su curso natural.' },
  { id: 'leccion-tirados', quien: 'naveA', txt: '¿Y nos dejarás aquí tirados?' },
  { id: 'leccion-comprender', quien: 'mascota', txt: 'No… Los ayudaré a comprender el mundo.' },
  {
    id: 'leccion-depende',
    quien: 'mascota',
    txt: 'Pero si saldrán de aquí o no, dependerá de ustedes…',
  },
  {
    id: 'leccion-dejar-atras',
    quien: 'mascota',
    txt: 'Y de si tienen la capacidad de dejar atrás lo que conocen y creen correcto.',
  },
  { id: 'leccion-listos', quien: 'cap', txt: 'Estamos listos para lo que sea.' },
  { id: 'leccion-que-hacer', quien: 'naveB', txt: '¿Qué debemos hacer?' },
  {
    id: 'leccion-reglas',
    quien: 'mascota',
    txt: 'Lo más importante es entender que este mundo sigue reglas.',
  },
  // Cierra el arco de la palabra: "caos" entró como queja en `dentro-caotico` y sale acá como
  // diagnóstico equivocado.
  {
    id: 'leccion-armonia',
    quien: 'mascota',
    txt: 'Eso que ustedes llaman caos no era más que armonía…',
  },
  { id: 'leccion-particulas', quien: 'mascota', txt: '…partículas siguiendo las reglas.' },
  // ACTO 7 · Signal Space. La pregunta del viaje nace acá, con la pantalla que vienen arrastrando
  // desde la anomalía; Angie no la contesta con palabras: muestra el árbol (el 6 de la Introducción
  // de antes) y la deja abierta, como hilo hasta la penúltima etapa.
  {
    id: 'leccion-pantalla',
    quien: 'cap',
    txt: 'Nuestra pantalla sigue marcando la velocidad vieja.',
  },
  { id: 'leccion-pregunta', quien: 'naveB', txt: '¿Y quién le avisó a la pantalla?' },
  { id: 'leccion-arbol', quien: 'mascota', txt: 'Aquí nadie revisa todo. Miren el árbol.' },
  {
    id: 'leccion-guarden',
    quien: 'mascota',
    txt: 'Guarden esa pregunta. Los acompaña todo el viaje.',
  },
  // La frase del final, partida en dos cajas sin cambiarle una palabra: `frase` arranca con la
  // primera y `orden` se ancla al final de la segunda.
  {
    id: 'frase-complejo',
    hueco: 800,
    quien: 'mascota',
    txt: 'Hasta lo que parece más complejo e inalcanzable…',
  },
  {
    id: 'frase-angulo',
    quien: 'mascota',
    txt: '…se vuelve fácil y predecible si lo miras desde el ángulo correcto.',
  },
];

/** Caracteres visibles de una línea, sin contar los cortes de renglón ni las marcas de código. */
export function largoDe(linea: LineaGuion): number {
  return textoVisible(linea).replace(/\n/g, ' ').length;
}

/**
 * Cuánto tiene que estar en pantalla una línea para poder seguirse sin apuro: a ritmo de lectura,
 * o lo que dura su voz grabada si dura más (docs/voces.md). La duración de la grabación sale del
 * índice y no del navegador, así que el prólogo dura lo mismo con sonido o sin él, en cualquier
 * máquina; los blips se reparten en la ventana que les toque.
 */
export function ventanaDe(linea: LineaGuion): number {
  const seguir = Math.max(
    PRESUPUESTO.minimo,
    Math.round((largoDe(linea) / PRESUPUESTO.cps) * 1000),
    VOCES_DEL_PROLOGO[linea.id]?.ms ?? 0,
  );
  return Math.max(linea.dur ?? 0, seguir + PRESUPUESTO.entra + PRESUPUESTO.sale);
}

/** Encadena el guion en una sola pasada y devuelve cada línea con su ventana ya resuelta. */
export function armarReloj(guion: readonly LineaGuion[] = GUION): readonly LineaEnReloj[] {
  const reloj: LineaEnReloj[] = [];
  let cursor = ARRANQUE;
  guion.forEach((linea, i) => {
    const previa = reloj[i - 1];
    if (previa && !linea.junto && !linea.pisa) cursor += PRESUPUESTO.respiro;
    cursor += linea.hueco ?? 0;
    const t0 = linea.junto && previa ? previa.t0 : cursor - (linea.pisa ?? 0);
    const t1 = t0 + ventanaDe(linea);
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
    fusion: en('voz-supongo').t0,
    choque: en('reclamo-quien-eres').t0 + 250,
    frase: en('frase-complejo').t0,
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
    if (!SIN_CAJA.has(linea.quien) && linea.txt.includes('\n')) {
      problemas.push(`"${linea.id}" corta a mano adentro de la caja: la caja corta sola`);
    }
    if (linea.junto && linea.pisa) {
      problemas.push(`"${linea.id}" pisa y arranca junta a la vez: son dos cosas distintas`);
    }
    if (linea.junto && i === 0) problemas.push(`"${linea.id}" arranca junta a nada: es la primera`);
  });

  return problemas;
}

const MAX_COLUMNAS = 52;

/**
 * Lo que entra en un renglón de la caja, que es tan ancha como la escena. Medido con la fuente real
 * en la ventana donde la letra es más grande respecto del ancho (2000×840): 75 columnas de Fraunces
 * ocupan el 98%. Una frase en dos renglones se lee como un párrafo, no como alguien que habla.
 */
const MAX_COLUMNAS_CAJA = 75;

/**
 * Sin caja, cada renglón declarado entra en el techo de columnas. En la caja, la frase entera entra
 * en un renglón: si no, se parte en dos líneas del guion, cada una con su caja.
 */
export function renglonesLargos(guion: readonly LineaGuion[] = GUION): readonly string[] {
  return guion.flatMap((linea) => {
    const texto = textoVisible(linea);
    if (!SIN_CAJA.has(linea.quien)) {
      return texto.length > MAX_COLUMNAS_CAJA
        ? [
            `"${linea.id}": ${texto.length} caracteres, en la caja entran ${MAX_COLUMNAS_CAJA} en un renglón`,
          ]
        : [];
    }
    return texto
      .split('\n')
      .filter((renglon) => renglon.length > MAX_COLUMNAS)
      .map((renglon) => `"${linea.id}": ${renglon.length} columnas en "${renglon.slice(0, 24)}…"`);
  });
}
