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
   * Con voz manda el habla, que es más lenta. `HABLA_CPS` es lo que dice el motor a velocidad 1;
   * acá va menos a propósito, y ese ~15% de diferencia es MARGEN: clavado en el número medido, una
   * voz apenas más lenta no termina la frase antes de que entre la siguiente y se come la última
   * palabra.
   */
  cpsVoz: 8.8,
  /** Una línea de dos palabras igual necesita registrarse antes de irse. */
  minimo: 950,
  entra: 280,
  sale: 250,
  /** Aire entre turnos: pegadas suenan a lista leída, no a gente hablando. */
  respiro: 220,
} as const;

/** Caracteres por segundo que dice `speechSynthesis` a velocidad 1. Cronometrado, no supuesto. */
export const HABLA_CPS = 10.1;

/** Cuándo entra la primera línea. Un respiro antes de que alguien hable. */
const ARRANQUE = 800;

/** Renglones declarados como máximo por línea: más que eso deja de leerse de un vistazo. */
const MAX_RENGLONES = 3;

export const GUION: readonly LineaGuion[] = [
  // ACTO 0 · vuelven a casa. Charla de nada, a propósito: sin esto no hay a quién perder después.
  { id: 'casa-volver', quien: 'cap', txt: 'Al fin es hora de volver a casa.' },
  { id: 'casa-familia', quien: 'naveA', txt: 'Extraño a mi familia.' },
  { id: 'casa-helado', quien: 'naveB', txt: 'Yo quiero comer helado de chocolate.' },
  // Estas dos se PISAN, y es la única superposición del guion: la exploradora entra mientras el
  // otro todavía está hablando, que es lo que hace que se lea como una interrupción y no un turno.
  { id: 'casa-unas', quien: 'naveA', txt: 'Y yo quiero unas…' },
  {
    id: 'casa-apuren',
    quien: 'nave4',
    pisa: 500,
    txt: '¡Oigan! Dejen de desear y apúrense,\nvan muy lento.',
  },

  // ACTO 1 · la anomalía. Lo que falla son los operadores: perseguir el cambio no alcanza cuando el
  // cambio es más rápido que vos. Es el argumento del nivel 0 contado como accidente.
  { id: 'anom-que-pasa', hueco: 300, quien: 'cap', txt: 'Esperen… ¿qué está sucediendo?' },
  { id: 'anom-sin-control', quien: 'naveA', txt: 'No tengo control de los sistemas.' },
  { id: 'anom-atraidos', quien: 'naveB', txt: 'Estamos siendo atraídos.' },
  // `dur` acá no es drama: es que la orden tiene que seguir en pantalla mientras las naves
  // todavía están disparando operadores. Apagarla antes deja el gesto contado por la mitad.
  {
    id: 'anom-rxjs',
    dur: 6200,
    quien: 'cap',
    txt: '¡Activen todos los operadores\nde RxJS, rápido!',
  },
  { id: 'anom-pipes', dur: 4600, quien: 'naveA', txt: 'Los pipes están recargando energía.' },
  { id: 'anom-lento', quien: 'naveB', txt: 'No funcionará, es demasiado lento.' },

  // El capitán deja de dar órdenes y empieza a describir: tres tirones, cada uno más largo, hasta
  // nombrar lo que se rompe. Ahí el problema deja de ser operativo y pasa a ser de física.
  { id: 'anom-fuerza', quien: 'cap', txt: '¿Qué es esta fuerza…?' },
  { id: 'anom-velocidad', quien: 'cap', txt: 'Esta velocidad…' },
  {
    id: 'anom-leyes',
    quien: 'cap',
    txt: 'Debería ser imposible.\nEsto contradice todas las leyes\ndel espacio Zone.js.',
  },

  // La exploradora quedó AFUERA y ve cómo se los llevan. Sus cuatro líneas son el último intento de
  // que el sistema conocido alcance: volver a donde las herramientas funcionan.
  { id: 'expl-que-pasa', quien: 'nave4', txt: '¿Qué les pasa?' },
  { id: 'expl-no-responden', quien: 'nave4', txt: '¿Por qué no responden?' },
  { id: 'expl-hacia-ahi', quien: 'nave4', txt: '¿Por qué van hacia ahí?' },
  {
    id: 'expl-vuelvan',
    quien: 'nave4',
    // El ESPACIO es Zone.js; RxJS son las herramientas que ahí adentro funcionan. Nombrarlos igual
    // hacía que se leyeran como dos lugares distintos.
    txt: '¡No! Vuelvan al espacio de Zone.js,\nestán yendo a un espacio desconocido.',
  },
  {
    id: 'anom-perdiendo',
    quien: 'cap',
    txt: 'Los sistemas no responden a tiempo.\nEstamos perdiendo el control.',
  },
  { id: 'anom-grito', dur: 1800, quien: 'todos', txt: '¡Ahhhh!' },

  // ACTO 2 · del otro lado. La orden de escapar choca contra que acá esquivar YA es todo lo que se
  // puede hacer: el sistema está saturado sosteniendo el presente.
  { id: 'dentro-vivos', hueco: 1000, quien: 'naveA', txt: 'Estamos vivos…' },
  // Las dos gritan A LA VEZ, cada una desde su costado: no se turnan para avisar de algo que les
  // está cayendo encima. La bola que dispara el grito es la misma que después esquivan.
  { id: 'dentro-cuidado', quien: 'naveB', txt: '¡Cuidado!' },
  { id: 'dentro-esquiva-ya', junto: true, quien: 'naveA', txt: '¡Esquivá, rápido!' },
  { id: 'dentro-que-es', quien: 'naveB', txt: '¿Qué es esto?' },
  {
    id: 'dentro-nunca-visto',
    quien: 'naveA',
    txt: 'No lo sé, nunca había visto\nnada como esto.',
  },
  // Acá se lanzan hacia adelante y frenan de golpe sobre la línea de abajo: el intento de escapar y
  // el "apenas puedo esquivar" son el mismo gesto visto de afuera y de adentro.
  { id: 'dentro-escapemos', quien: 'cap', txt: 'Sea lo que sea, debemos escapar.\nRápido.' },
  {
    id: 'dentro-esquivar',
    quien: 'naveA',
    txt: 'Apenas puedo esquivar las partículas.\nNo me pidas escapar.',
  },
  // El diagnóstico va de lo concreto a lo general: primero la herramienta que no responde, después
  // la categoría entera.
  {
    id: 'dentro-switchmap',
    quien: 'naveB',
    txt: 'switchMap no funciona,\ntampoco puedo usar los pipes.',
  },
  { id: 'dentro-azar', quien: 'cap', txt: 'Ningún operador de RxJS\nsirve a este nivel.' },
  {
    id: 'dentro-rendicion',
    quien: 'cap',
    txt: 'Aunque intentemos escapar,\ncon tantas moléculas será imposible.',
  },
  // Cierra con la palabra que ella va a repetir: el corte deja de ser un corte porque lo escuchó.
  { id: 'dentro-caotico', quien: 'cap', txt: 'Esto es demasiado caótico.' },

  // ACTO 3 · la voz. Todavía no tiene cuerpo, y por eso "¿quién ha hablado?" se entiende solo.
  { id: 'voz-asi-que', dur: 3200, quien: 'voz', txt: 'Así que caótico…' },
  { id: 'react-escucharon', dur: 2400, quien: 'naveA', txt: '¿Escucharon eso?' },
  { id: 'react-quien', dur: 2600, quien: 'naveB', txt: '¿Quién ha hablado?' },
  {
    id: 'voz-perspectiva',
    quien: 'voz',
    txt: 'Supongo que desde su perspectiva,\nse puede interpretar como caos…',
  },
  // "Armonía" no es una metáfora: los puntos hacen movimiento armónico simple, y así está escrito
  // en `tusi-math`. La frase describe literalmente lo que la pantalla va a hacer.
  { id: 'voz-armonia', quien: 'voz', txt: 'Pero desde la mía…\ntodo está en armonía.' },
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
  { id: 'reclamo-circulos', junto: true, quien: 'naveB', txt: '¿Círculos?' },
  { id: 'reclamo-loco', quien: 'cap', txt: '¿Estás loco?' },
  // La pregunta que el CHOQUE contesta: la mascota nace acá, ni un segundo antes. Apareciendo sin
  // que nadie la llame es un efecto; apareciendo acá, es una respuesta.
  { id: 'reclamo-quien-eres', quien: 'cap', txt: '¿Quién eres?' },
  { id: 'reclamo-casi-matan', quien: 'naveA', txt: 'Esas moléculas casi nos matan.' },
  {
    id: 'reclamo-armonioso',
    quien: 'cap',
    txt: 'Es lo más caótico que vivimos en nuestras vidas,\ny tú, tan tranquilo, lo llamas armonioso.',
  },

  // ACTO 5 · la tesis, en tres golpes cada vez más largos. Ya tiene cuerpo: deja de ser "la voz".
  { id: 'orden-caos-es-orden', quien: 'mascota', txt: 'El caos es orden.' },
  { id: 'orden-no-comprenden', quien: 'mascota', txt: 'Un orden que no comprenden…' },
  {
    id: 'orden-malinterpretado',
    quien: 'mascota',
    txt: 'Lo que ustedes ven como caos\nes un orden malinterpretado.',
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
  // Cierra el arco de la palabra: "caos" entró como queja en `dentro-caotico` y sale acá como
  // diagnóstico equivocado.
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
 * Cuánto tiene que estar en pantalla una línea para poder seguirse sin apuro. Con voz manda el
 * habla, que es más lenta que la lectura, así que la misma escena dura distinto según el modo.
 */
export function ventanaDe(linea: LineaGuion, conVoz: boolean): number {
  const cps = conVoz ? PRESUPUESTO.cpsVoz : PRESUPUESTO.cps;
  const seguir = Math.max(PRESUPUESTO.minimo, Math.round((largoDe(linea) / cps) * 1000));
  return Math.max(linea.dur ?? 0, seguir + PRESUPUESTO.entra + PRESUPUESTO.sale);
}

/** Encadena el guion en una sola pasada y devuelve cada línea con su ventana ya resuelta. */
export function armarReloj(
  guion: readonly LineaGuion[] = GUION,
  conVoz = false,
): readonly LineaEnReloj[] {
  const reloj: LineaEnReloj[] = [];
  let cursor = ARRANQUE;
  guion.forEach((linea, i) => {
    const previa = reloj[i - 1];
    // El respiro va entre TURNOS. No después de una que arranca junto con la anterior ni antes de
    // una que la pisa a propósito: ahí el encimado es el efecto.
    if (previa && !linea.junto && !linea.pisa) cursor += PRESUPUESTO.respiro;
    cursor += linea.hueco ?? 0;
    const t0 = linea.junto && previa ? previa.t0 : cursor - (linea.pisa ?? 0);
    const t1 = t0 + ventanaDe(linea, conVoz);
    reloj.push({ ...linea, t0, t1 });
    cursor = Math.max(cursor, t1);
  });
  return reloj;
}

/**
 * Los momentos que la animación tiene que acompañar, DERIVADOS del guion en vez de escritos aparte.
 * Cada uno dice a qué línea pertenece, así que si una frase crece la escena la sigue sola. Escritos
 * como números sueltos, bastaba alargar una línea para que el zoom cayera sobre otra.
 */
export interface Anclajes {
  /** El temblor arranca antes de la primera línea de alarma: primero se siente, después preguntan. */
  readonly temblor: number;
  /** La anomalía empieza a tirar de ellos. */
  readonly anomalia: number;
  /** Entran en la bola de luz. El salto ocurre acá, no por reloj. */
  readonly zoom: number;
  /** Reaparecen del otro lado, adentro de la maraña. */
  readonly caos: number;
  /** La voz contesta, y ahí mismo empiezan a nuclearse las moléculas: es la cama del diálogo. */
  readonly fusion: number;
  /** Las dos moléculas chocan y de ahí sale la mascota, sobre "¿quién eres?". */
  readonly choque: number;
  /** La frase que cierra. */
  readonly frase: number;
  /** Se alejan, y el patrón se rehace por bisección: recién desde lejos aparece el orden. */
  readonly orden: number;
  readonly fin: number;
}

/** Cuánto queda en pantalla el patrón ya ordenado, después de la última línea. */
const COLA = 8000;

export function anclajesDe(reloj: readonly LineaEnReloj[]): Anclajes {
  const en = (id: string): LineaEnReloj => {
    const linea = reloj.find((l) => l.id === id);
    if (!linea) throw new Error(`prologo: el anclaje apunta a "${id}", que no está en el guion`);
    return linea;
  };
  const orden = en('frase-angulo').t1 - 1400;
  return {
    temblor: en('anom-que-pasa').t0 - 3200,
    anomalia: en('casa-apuren').t1,
    zoom: en('anom-grito').t1,
    caos: en('dentro-vivos').t0,
    fusion: en('voz-asi-que').t0,
    // 250 ms después de que entre la pregunta: el impacto contesta, no la anticipa.
    choque: en('reclamo-quien-eres').t0 + 250,
    frase: en('frase-angulo').t0,
    orden,
    fin: orden + COLA,
  };
}

/**
 * Un guion mal armado no se ve roto: se ve como una escena que va demasiado rápido, o como una
 * línea que nadie llega a leer. Estas son las condiciones que tiene que cumplir para shippear, y
 * las verifica un test porque ninguna se nota mirando el archivo.
 */
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

  // Deliberadamente NO se chequea acá si cada línea respeta el presupuesto de lectura: la ventana
  // se DERIVA del presupuesto, así que preguntárselo sería tautológico y el chequeo nunca fallaría.
  // Que ninguna línea vaya demasiado rápido es una propiedad de la estructura, no algo que auditar.
  // Lo que sí puede romperse son las constantes, y eso lo cubre el spec.
  return problemas;
}

/**
 * El renglón declarado a mano tiene un techo grosero de caracteres. El corte REAL lo decide el motor
 * midiendo píxeles con la fuente puesta, que es lo único correcto (los mismos caracteres no miden lo
 * mismo en monoespaciada de 23 que en serif de 34). Esto es una baranda para avisar temprano que un
 * renglón se va a partir solo y va a dejar una palabra huérfana, no un reemplazo de esa medición.
 */
const MAX_COLUMNAS = 52;

export function renglonesLargos(guion: readonly LineaGuion[] = GUION): readonly string[] {
  return guion.flatMap((linea) =>
    linea.txt
      .split('\n')
      .filter((renglon) => renglon.length > MAX_COLUMNAS)
      .map((renglon) => `"${linea.id}": ${renglon.length} columnas en "${renglon.slice(0, 24)}…"`),
  );
}
