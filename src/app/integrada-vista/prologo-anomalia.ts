import { avanzarMuelle, crearMuelle, limitar, type Muelle } from '../libs/muelle';
import {
  PALETAS,
  TINTA,
  dibujarNave,
  gradientesDeNaves,
  type NaveDibujada,
} from '../components-draw/tripulacion/nave-del-prologo';
import { chispas, palabra } from '../libs/rastros';
import { sonido } from '../libs/sonido';
import { HUECOS_DEL_PROLOGO, type HuecoDelPrologo } from './operadores-del-prologo';
import { PAGINAS_DEL_MANUAL, type PaginaDelManual } from './manual-de-a-bordo';
import { ARBOL_DE_SIGNAL_SPACE } from './arbol-de-signal-space';
import { PUNTOS_DEL_PROLOGO } from './puntos-del-prologo';
import { VOCES_GRABADAS } from './voces-grabadas';
import {
  GUION,
  PRESUPUESTO,
  anclajesDe,
  armarReloj,
  type Anclajes,
  type Hablante,
  type LineaEnReloj,
  textoVisible,
} from './prologo-guion';
import { tramosDeFrase } from '../libs/tramos-de-frase';
import { azar } from '../libs/azar';
import { el, type Atributos } from '../libs/svg';
import {
  ALTO,
  ANCHO,
  ANGULOS,
  CUERDAS,
  CX,
  CY,
  FORMACION,
  OPERADORES,
  PIPES,
  RADIO,
  adentro,
  bala,
  bolas,
  circulos,
  clamp01,
  claridad,
  conRebote,
  crecimiento,
  cuerdasVisibles,
  encuadreVertical,
  esquive,
  exploradora,
  formacionAfuera,
  fusionEn,
  letraConPiso,
  mascota,
  momentosDe,
  naveAdentro,
  opacidadDelRotulo,
  proyectiles,
  saltoQuieto,
  sincronia,
  suave,
  temblor,
  warp,
  zoom,
  type Momentos,
  type Punto,
} from './prologo-escena';

/**
 * Prólogo de la intro: "la anomalía". Cuatro naves vuelven a casa, una anomalía se traga a tres, y
 * del otro lado lo que parecía caos resulta ser el par de Tusi visto de cerca. Termina con Angie
 * (que se había desarmado en luces en la colina) armándose del choque de dos moléculas y
 * ofreciéndose a enseñarles las reglas del lugar: el trato que la app le propone a quien la abre.
 *
 * Es una ilustración en SVG por planos (cielo, nebulosas, estrellas, la casa, rocas, la anomalía,
 * las naves, un primer plano que enmarca y la viñeta), y las naves son personajes: piloto con ojos
 * que miran lo que pasa, cejas, antena que sigue con retraso, llama que tose. Cada parte que
 * responde es un muelle (`libs/muelle.ts`): un golpe suma velocidad, no fija una pose.
 *
 * El reparto: **el guion y el reloj viven en `prologo-guion.ts`, y dónde está cada cosa en cada
 * instante en `prologo-escena.ts`**, los dos puros y con tests; acá solo se copian esos números al
 * SVG, se resuelven los muelles y se suena. Todo momento cuelga de una línea del guion, así que
 * alargar una frase mueve la escena con ella.
 */

export interface PrologoOpciones {
  /** Corre cuando el prólogo termina o se saltea: es el empalme con la construcción de Tusi. */
  readonly alTerminar: () => void;
  /**
   * @deprecated Ya no se usa. El sonido es una preferencia global del director (`libs/sonido.ts`);
   * queda para no romper a quien todavía la pasa.
   */
  readonly conSonido?: boolean;
  /**
   * Angie nace del choque y se va con el prólogo: quien la monta le prende y apaga la vida propia,
   * así no se balancea ni saluda mientras nadie la ve.
   */
  readonly alCambiarMascota?: (viva: boolean) => void;
  /**
   * El id de la línea donde arrancar: el punto donde quedó la partida, o en desarrollo
   * `?prologo=<id>` para revisar una escena sin mirar los minutos de antes. Lo decide quien monta:
   * este módulo carga diferido, y para entonces la sincronía con la URL ya borró el parámetro.
   */
  readonly desde?: string | null | undefined;
  /**
   * Avisa cada vez que la historia pasa por uno de `PUNTOS_DEL_PROLOGO`, para guardar desde dónde
   * se retoma al recargar. Los puntos anteriores al arranque no se avisan.
   */
  readonly alPasarPunto?: ((linea: string) => void) | undefined;
  /**
   * El minijuego de "¡Activen todos los operadores!". La historia se frena en la orden y espera a
   * que se resuelva o se saltee; la escena sigue viva mientras tanto. Cada hueco que queda sano se
   * avisa con `alArreglar`, y la nave de ese hueco dispara su operador. Sin esto, el prólogo corre
   * de corrido.
   */
  readonly operadores?: (
    huecos: readonly HuecoDelPrologo[],
    alArreglar: (nave: number, operador: string) => void,
  ) => Promise<void>;
  /**
   * El manual de a bordo de "¡Rápido, el manual de a bordo!". La historia se frena con la orden ya
   * leída y espera a que el manual se cierre. El manual es la pantalla de la nave y tapa la escena
   * entera: con `alTapar` avisa cuándo ya no se ve nada de ella y cuándo está por volver a verse, y
   * entre un aviso y el otro la escena no se dibuja. Sin avisos sigue viva, como antes. Sin esto, el
   * prólogo corre de corrido.
   */
  readonly manual?: (
    paginas: readonly PaginaDelManual[],
    alTapar: (tapada: boolean) => void,
  ) => Promise<void>;
  /**
   * El árbol de Signal Space de "Miren el árbol.". Como el manual: la historia se frena con la línea
   * ya leída y espera a que se cierre, y `alTapar` avisa lo mismo. Sin esto, el prólogo corre de
   * corrido.
   */
  readonly arbol?: (pagina: PaginaDelManual, alTapar: (tapada: boolean) => void) => Promise<void>;
}

const fijar = (n: Element, attrs: Atributos): void => {
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
};

/** Números cortos en los atributos: con 15 decimales el `transform` de cada cuadro pesa el triple. */
const r2 = (v: number): string => (Math.round(v * 100) / 100).toString();

/** Una forma orgánica cerrada alrededor de un centro: rocas y nubes, cada una con su semilla. */
function mancha(cx: number, cy: number, radio: number, semilla: number, irregular = 0.28): string {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = radio * (1 - irregular / 2 + azar(semilla * 31 + i) * irregular);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.82 };
  });
  const medio = (a: Punto, b: Punto): Punto => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const m0 = medio(pts[n - 1], pts[0]);
  let d = `M${r2(m0.x)} ${r2(m0.y)}`;
  for (let i = 0; i < n; i++) {
    const m = medio(pts[i], pts[(i + 1) % n]);
    d += `Q${r2(pts[i].x)} ${r2(pts[i].y)} ${r2(m.x)} ${r2(m.y)}`;
  }
  return d + 'Z';
}

/* ── reparto ──────────────────────────────────────────────────────────────────────────────────── */

const NOMBRES: Record<Hablante, string> = {
  cap: 'Capitán',
  naveA: 'Nave A',
  naveB: 'Nave B',
  nave4: 'Exploradora',
  todos: '',
  voz: '',
  mascota: 'Angie',
};

/**
 * La frase en la caja, con el código (`switchMap`) en su propio elemento: un operador nombrado en
 * medio de la charla tiene que leerse como código, no como una palabra más.
 */
function escribirFrase(destino: HTMLElement, txt: string): void {
  // Creado a mano no lleva el atributo de encapsulación, y sin él el CSS de la vista no lo alcanza.
  const enc = destino.getAttributeNames().find((a) => a.startsWith('_ngcontent'));
  destino.replaceChildren(
    ...tramosDeFrase(txt).map((tramo) => {
      if (!tramo.codigo) return document.createTextNode(tramo.texto);
      const codigo = document.createElement('code');
      codigo.className = 'prologo__codigo';
      if (enc) codigo.setAttribute(enc, '');
      codigo.textContent = tramo.texto;
      return codigo;
    }),
  );
}

/** Qué nave es cada voz, para que la que habla se note en la escena y no solo en la caja. */
const NAVE_DE: Partial<Record<Hablante, number>> = { cap: 0, naveA: 1, naveB: 2, nave4: 3 };

/**
 * Los rótulos de operador dibujados en la escena, en unidades del viewBox, y lo mínimo que miden en
 * pantalla: el del disparo de la ráfaga y el del acierto del minijuego, que es el premio y va más
 * grande. En escritorio el piso no alcanza; en un celular vertical los agranda hasta leerse.
 */
const ROTULO_DISPARO = 19;
const PISO_DISPARO_PX = 12;
const ROTULO_ACIERTO = 30;
const PISO_ACIERTO_PX = 15;

/** Cuánto de lo que rodea a la anomalía guarda la cámara en vertical, en unidades del `viewBox`. */
const ALREDEDOR_DEL_CENTRO = 200;

/** Lo que dice una nave cuando la tocan. Insistir le gasta la paciencia. */
const QUEJAS = ['¡ey!', '¡piloto a bordo!', '¡la pintura!', '¡estoy manejando!'];
const HARTA = ['¡basta!', '¡ya va!', '¡uf!'];

interface Nave extends NaveDibujada {
  /** Muelles: lo que responde a golpes y toques. `mira` es hacia dónde apunta la nariz (±1). */
  readonly m: {
    dx: Muelle;
    dy: Muelle;
    rot: Muelle;
    sq: Muelle;
    antena: Muelle;
    mira: Muelle;
  };
  /** Dónde quedó el último cuadro, en el viewBox: lo usan los toques, los golpes y los globos. */
  pos: Punto;
  escala: number;
  angulo: number;
  paciencia: number;
  /** Adónde mira por un toque cercano, y hasta cuándo. */
  curiosidad: { p: Punto; hasta: number } | null;
}

/** Una nave del prólogo: la dibujada (`dibujarNave`) más lo que la mueve en el guion. */
function construirNave(padre: SVGGElement, i: number, defs: SVGDefsElement): Nave {
  return {
    ...dibujarNave(padre, i, defs, 'pa'),
    m: {
      dx: crearMuelle(0, 90, 9),
      dy: crearMuelle(0, 90, 9),
      rot: crearMuelle(0, 130, 9),
      sq: crearMuelle(0, 260, 11),
      antena: crearMuelle(0, 70, 5),
      mira: crearMuelle(1, 120, 14),
    },
    pos: { x: -999, y: -999 },
    escala: 1,
    angulo: 0,
    paciencia: 0,
    curiosidad: null,
  };
}

/** Qué cara pone cada nave: cejas (grados hacia adentro, + es preocupación) y el tamaño de los ojos. */
interface Animo {
  readonly cejas: number;
  readonly ojos: number;
  readonly altura: number;
}
const ANIMOS = {
  tranquila: { cejas: 0, ojos: 1, altura: 0 },
  harta: { cejas: -16, ojos: 0.9, altura: 1.5 },
  asustada: { cejas: 18, ojos: 1.22, altura: -2.5 },
  sorprendida: { cejas: 6, ojos: 1.28, altura: -4 },
  enojada: { cejas: -20, ojos: 1, altura: 1.5 },
  triste: { cejas: 22, ojos: 0.92, altura: 1 },
  decidida: { cejas: -10, ojos: 1.05, altura: 0 },
} as const satisfies Record<string, Animo>;
type NombreAnimo = keyof typeof ANIMOS;

/** Los botones de la barra son íconos: su nombre (y el globito al apuntarlos) cambia con el estado. */
function nombrar(boton: HTMLButtonElement, nombre: string): void {
  boton.setAttribute('aria-label', nombre);
  boton.title = nombre;
}

export function initPrologoAnomalia(host: HTMLElement, opts: PrologoOpciones): () => void {
  const contenedor = host.querySelector<HTMLElement>('.prologo');
  const lienzo = contenedor?.querySelector<SVGSVGElement>('.prologo__escena');
  const saltar = contenedor?.querySelector<HTMLButtonElement>('.prologo__skip');
  const pausa = contenedor?.querySelector<HTMLButtonElement>('.prologo__pause');
  const suena = contenedor?.querySelector<HTMLButtonElement>('.prologo__sound');
  const pantalla = contenedor?.querySelector<HTMLButtonElement>('.prologo__full');
  const veloz = contenedor?.querySelector<HTMLButtonElement>('.prologo__speed');
  if (!contenedor || !lienzo || !pausa || !suena || !pantalla) {
    // Sin prólogo hay que seguir igual: `alTerminar` es el empalme que arranca la construcción de
    // Tusi. Devolver un no-op sin llamarlo dejaba la landing congelada para siempre.
    opts.alTerminar();
    return () => undefined;
  }

  const raiz = contenedor;
  const svg = lienzo;
  const btnPausa = pausa;
  const btnSonido = suena;
  const btnPantalla = pantalla;
  // Opcionales: sin ellos el prólogo corre igual, solo sin decir esa parte. La barra del juego ya
  // no ofrece saltar ni cambiar la velocidad (el prólogo es el comienzo de la historia, no una
  // intro); los conservan los tests, que necesitan terminar y acelerar.
  const btnVelocidad = veloz;
  const skipEl = saltar;
  const mascotaEl = raiz.querySelector<HTMLElement>('.prologo__mascot');
  const globos = [...raiz.querySelectorAll<HTMLElement>('.prologo__globo')];
  const vozEl = raiz.querySelector<HTMLElement>('.prologo__voz');
  const tituloEl = raiz.querySelector<HTMLElement>('.prologo__titulo');

  const reloj: readonly LineaEnReloj[] = armarReloj(GUION);
  // Las voces se piden ya: la primera línea entra en menos de un segundo y llegaría en blips.
  sonido().precargar(
    Object.values(VOCES_GRABADAS)
      .map((v) => v.archivo)
      .filter((a) => a.startsWith('voces/prologo/')),
  );
  const T: Anclajes = anclajesDe(reloj);
  const M: Momentos = momentosDe(reloj);
  const linea = (id: string): LineaEnReloj => {
    const l = reloj.find((x) => x.id === id);
    if (!l) throw new Error(`prologo: falta la línea "${id}"`);
    return l;
  };

  /* ── la ilustración ─────────────────────────────────────────────────────────────────────────── */

  svg.replaceChildren();
  fijar(svg, { viewBox: `0 0 ${ANCHO} ${ALTO}`, preserveAspectRatio: 'xMidYMid meet' });
  const defs = el(svg, 'defs');
  const lineal = (id: string, paradas: readonly [number, string, number?][], a: Atributos = {}) => {
    const g = el(defs, 'linearGradient', { id, ...a });
    for (const [o, c, op] of paradas)
      el(g, 'stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 });
    return g;
  };
  const radial = (id: string, paradas: readonly [number, string, number?][], a: Atributos = {}) => {
    const g = el(defs, 'radialGradient', { id, ...a });
    for (const [o, c, op] of paradas)
      el(g, 'stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 });
    return g;
  };
  const vertical = { gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: ALTO };
  lineal(
    'pa-cielo',
    [
      [0, '#07080c'],
      [0.42, '#0c0f2a'],
      [0.78, '#1a1440'],
      [1, '#2a1846'],
    ],
    vertical,
  );
  radial('pa-nebulosa-v', [
    [0, '#8a5ad0', 0.42],
    [1, '#8a5ad0', 0],
  ]);
  radial('pa-nebulosa-t', [
    [0, '#2f9a80', 0.3],
    [1, '#2f9a80', 0],
  ]);
  radial(
    'pa-planeta',
    [
      [0, '#ffe7bd'],
      [0.45, '#f0a05e'],
      [1, '#7c3a52'],
    ],
    { cx: 0.35, cy: 0.3, r: 0.8 },
  );
  radial(
    'pa-noche-planeta',
    [
      [0.45, '#1a1030', 0],
      [1, '#1a1030', 0.85],
    ],
    { cx: 0.28, cy: 0.22, r: 0.9 },
  );
  radial('pa-atmosfera', [
    [0.6, '#ffb877', 0.4],
    [1, '#ffb877', 0],
  ]);
  lineal('pa-roca', [
    [0, '#4e4466'],
    [1, '#191329'],
  ]);
  radial('pa-halo', [
    [0, '#fff4de', 1],
    [0.18, '#f6b562', 0.55],
    [0.5, '#8a5ad0', 0.16],
    [1, '#8a5ad0', 0],
  ]);
  radial('pa-nucleo', [
    [0, '#ffffff'],
    [0.6, '#fff1cf'],
    [1, '#f6b562'],
  ]);
  lineal(
    'pa-dentro',
    [
      [0, '#150a1f'],
      [0.55, '#2a1330'],
      [1, '#3a1a2a'],
    ],
    vertical,
  );
  radial('pa-luz-dentro', [
    [0, '#ffb86a', 0.42],
    [0.5, '#c0603a', 0.12],
    [1, '#c0603a', 0],
  ]);
  // En unidades del viewBox: sobre el rect gigante de fondo, un degradado relativo a su caja quedaba
  // entero fuera de cuadro y la viñeta no oscurecía nada.
  const centrado = { gradientUnits: 'userSpaceOnUse', cx: CX, cy: CY, r: 980 };
  radial(
    'pa-claro',
    [
      [0, '#fbf9f2'],
      [1, '#e9e2cf'],
    ],
    centrado,
  );
  radial(
    'pa-vineta',
    [
      [0.55, '#140820', 0],
      [1, '#140820', 0.78],
    ],
    centrado,
  );
  radial(
    'pa-bola-a',
    [
      [0, '#ffe6bd'],
      [0.45, '#eb9b3c'],
      [1, '#9a4f18'],
    ],
    { cx: 0.36, cy: 0.32, r: 0.75 },
  );
  radial(
    'pa-bola-b',
    [
      [0, '#c4f4e3'],
      [0.48, '#2f9a80'],
      [1, '#135246'],
    ],
    { cx: 0.36, cy: 0.32, r: 0.75 },
  );
  radial('pa-bokeh-a', [
    [0, '#eb9b3c', 0.5],
    [0.7, '#eb9b3c', 0.18],
    [1, '#eb9b3c', 0],
  ]);
  radial('pa-bokeh-b', [
    [0, '#2f9a80', 0.45],
    [0.7, '#2f9a80', 0.15],
    [1, '#2f9a80', 0],
  ]);
  gradientesDeNaves(defs, 'pa');
  radial('pa-proyectil', [
    [0, '#ffffff', 1],
    [0.3, '#9ff0d8', 0.9],
    [1, '#2f9a80', 0],
  ]);
  radial('pa-destello', [
    [0, '#ffffff', 1],
    [0.35, '#ffe2b0', 0.75],
    [1, '#eb9b3c', 0],
  ]);
  const estelaBala = lineal(
    'pa-estela',
    [
      [0, '#eb9b3c', 0],
      [1, '#ffcf8a', 0.7],
    ],
    { gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1, y2: 0 },
  );

  // Lo que va afuera del viewBox también se pinta: con `meet` en una pantalla que no es 16:9 el
  // sobrante se ve, y así se ve cielo y no una franja.
  const TODO = { x: -1600, y: -900, width: ANCHO * 3, height: ALTO * 3 };

  // ── plano 1 · el espacio de afuera ──
  const espacio = el(svg, 'g');
  el(espacio, 'rect', { ...TODO, fill: 'url(#pa-cielo)' });
  el(espacio, 'ellipse', { cx: 360, cy: 620, rx: 620, ry: 300, fill: 'url(#pa-nebulosa-v)' });
  el(espacio, 'ellipse', { cx: 1260, cy: 240, rx: 520, ry: 260, fill: 'url(#pa-nebulosa-t)' });
  el(espacio, 'ellipse', { cx: 820, cy: 820, rx: 760, ry: 200, fill: 'url(#pa-nebulosa-v)' });
  const cielo = el(espacio, 'g');
  const titilan = [0, 1, 2].map(() => el(cielo, 'g'));
  for (let i = 0; i < 260; i++) {
    const g = titilan[i % 3];
    el(g, 'circle', {
      cx: r2(-700 + azar(i) * 3000),
      cy: r2(-300 + azar(i + 900) * 1500),
      r: r2(0.6 + azar(i + 1800) * 1.4),
      fill: azar(i + 2700) > 0.8 ? '#ffe2b8' : '#d6dcf4',
      opacity: r2(0.35 + azar(i + 3600) * 0.6),
    });
  }
  // Unas pocas estrellas grandes en cruz: con todas iguales el cielo se lee como ruido.
  const cercanas = el(espacio, 'g');
  for (let i = 0; i < 16; i++) {
    const x = -300 + azar(i + 50) * 2200,
      y = -100 + azar(i + 70) * 1000,
      r = 5 + azar(i + 90) * 6;
    el(cercanas, 'path', {
      d: `M${r2(x)} ${r2(y - r)}Q${r2(x)} ${r2(y)} ${r2(x + r)} ${r2(y)}Q${r2(x)} ${r2(y)} ${r2(x)} ${r2(y + r)}Q${r2(x)} ${r2(y)} ${r2(x - r)} ${r2(y)}Q${r2(x)} ${r2(y)} ${r2(x)} ${r2(y - r)}Z`,
      fill: '#f4f0ff',
      opacity: 0.85,
    });
  }
  // La casa: el planeta al que vuelven, del otro lado de la anomalía. No llegan nunca.
  const casa = el(espacio, 'g', { transform: 'translate(1460 430)' });
  el(casa, 'circle', { r: 104, fill: 'url(#pa-atmosfera)' });
  el(casa, 'ellipse', {
    rx: 132,
    ry: 26,
    transform: 'rotate(-16)',
    fill: 'none',
    stroke: '#f4c48c',
    'stroke-opacity': 0.5,
    'stroke-width': 7,
  });
  el(casa, 'circle', { r: 74, fill: 'url(#pa-planeta)' });
  el(casa, 'circle', { r: 74, fill: 'url(#pa-noche-planeta)' });
  for (let k = 0; k < 9; k++) {
    el(casa, 'circle', {
      cx: r2(-46 + azar(k + 300) * 40),
      cy: r2(18 + azar(k + 320) * 34),
      r: 1.6,
      fill: '#ffe08a',
    });
  }
  // La mitad de adelante del anillo, encima del planeta: así se lee que lo rodea.
  el(casa, 'path', {
    d: 'M-132 0A132 26 0 0 0 132 0',
    transform: 'rotate(-16)',
    fill: 'none',
    stroke: '#ffd9a6',
    'stroke-opacity': 0.75,
    'stroke-width': 7,
  });
  // Rocas a media distancia: pasan más rápido que las estrellas, y eso es la profundidad.
  const rocas = el(espacio, 'g');
  const piedras = Array.from({ length: 8 }, (_, k) => {
    const x = 200 + k * 380 + azar(k + 400) * 160;
    const y = k % 2 ? 760 + azar(k + 410) * 90 : 110 + azar(k + 420) * 70;
    const r = 16 + azar(k + 430) * 26;
    const g = el(rocas, 'g', { transform: `translate(${r2(x)} ${r2(y)})` });
    el(g, 'path', {
      d: mancha(0, 0, r, k + 7),
      fill: 'url(#pa-roca)',
      stroke: TINTA,
      'stroke-width': 1.5,
    });
    el(g, 'path', {
      d: mancha(r * 0.2, -r * 0.25, r * 0.45, k + 19, 0.4),
      fill: '#8a7ab0',
      opacity: 0.35,
    });
    return { g, x, y, giro: (azar(k + 440) - 0.5) * 0.02 };
  });
  const estelas = el(espacio, 'g', { opacity: 0 });
  const rayos = Array.from({ length: 72 }, (_, k) => ({
    el: el(estelas, 'line', {
      stroke: k % 5 === 0 ? '#ffd9a6' : '#e6ecff',
      'stroke-width': r2(1 + azar(k + 600) * 2.2),
      'stroke-linecap': 'round',
    }),
    a: azar(k + 610) * Math.PI * 2,
    r0: 60 + azar(k + 620) * 900,
    z: 0.3 + azar(k + 630),
  }));
  // La anomalía: un halo, un disco que gira y un núcleo que late. Está desde el primer cuadro como
  // un punto entre las estrellas: no aparece, se revela.
  const anomalia = el(espacio, 'g');
  el(anomalia, 'circle', { r: 320, fill: 'url(#pa-halo)' });
  const disco = el(anomalia, 'g');
  const brazos = [0, 1, 2].map((k) =>
    el(disco, 'path', {
      d: 'M0 0C60 -30 150 -10 190 50C210 90 180 140 120 150',
      fill: 'none',
      stroke: k === 1 ? '#7fd6bd' : '#f6b562',
      'stroke-opacity': 0.6,
      'stroke-width': 10 - k * 2,
      'stroke-linecap': 'round',
      transform: `rotate(${k * 120})`,
    }),
  );
  const anillos = [0, 1].map((k) =>
    el(anomalia, 'ellipse', {
      rx: 180 + k * 60,
      ry: 44 + k * 14,
      fill: 'none',
      stroke: k ? '#8a5ad0' : '#ffd9a6',
      'stroke-opacity': 0.55,
      'stroke-width': 4,
      'stroke-dasharray': '40 26 10 26',
      transform: `rotate(${-14 + k * 8})`,
    }),
  );
  const nucleo = el(anomalia, 'circle', { r: 34, fill: 'url(#pa-nucleo)' });

  // ── plano 2 · adentro ──
  const dentro = el(svg, 'g', { opacity: 0 });
  el(dentro, 'rect', { ...TODO, fill: 'url(#pa-dentro)' });
  el(dentro, 'circle', { cx: CX, cy: CY, r: 760, fill: 'url(#pa-luz-dentro)' });
  const polvo = el(dentro, 'g');
  for (let i = 0; i < 140; i++) {
    el(polvo, 'circle', {
      cx: r2(-400 + azar(i + 5000) * 2400),
      cy: r2(-200 + azar(i + 5200) * 1300),
      r: r2(0.8 + azar(i + 5400) * 2),
      fill: i % 2 ? '#f6b562' : '#7fd6bd',
      opacity: r2(0.2 + azar(i + 5600) * 0.4),
    });
  }

  // ── plano 3 · el papel del final ──
  const papel = el(svg, 'g', { opacity: 0 });
  el(papel, 'rect', { ...TODO, fill: 'url(#pa-claro)' });

  // ── el patrón: cuerdas, bolas, los dos círculos que revela el final ──
  const patron = el(svg, 'g');
  const cuerdasG = el(patron, 'g', { 'stroke-linecap': 'round' });
  const cuerdas = ANGULOS.map(() => el(cuerdasG, 'line', { pathLength: 1, 'stroke-dasharray': 1 }));
  const circulosG = [1, -1].map((s) =>
    el(patron, 'circle', {
      fill: 'none',
      stroke: s > 0 ? '#d9852a' : '#2a8a72',
      'stroke-width': 3.2,
      pathLength: 1,
      'stroke-dasharray': 1,
      'stroke-dashoffset': 1,
    }),
  );
  const bolasG = Array.from({ length: CUERDAS * 2 }, (_, k) => {
    const g = el(patron, 'g');
    el(g, 'circle', { r: 10, fill: k % 2 ? 'url(#pa-bola-b)' : 'url(#pa-bola-a)' });
    el(g, 'circle', { cx: -3.2, cy: -3.6, r: 2.6, fill: '#fff', opacity: 0.7 });
    return g;
  });
  const atomos = [1, -1].map((s) => {
    const g = el(svg, 'g', { opacity: 0 });
    const color = s > 0 ? '#f6b562' : '#7fd6bd';
    for (const rot of [0, 60, -60]) {
      el(g, 'ellipse', {
        rx: 52,
        ry: 20,
        fill: 'none',
        stroke: color,
        'stroke-width': 2.6,
        transform: `rotate(${rot})`,
      });
    }
    el(g, 'circle', { r: 15, fill: s > 0 ? 'url(#pa-bola-a)' : 'url(#pa-bola-b)' });
    return g;
  });

  // ── los personajes ──
  const efectos = el(svg, 'g');
  const navesG = el(svg, 'g');
  const naves = [3, 0, 1, 2].map((i) => ({ i, n: construirNave(navesG, i, defs) }));
  naves.sort((a, b) => a.i - b.i);
  const flota: Nave[] = naves.map((x) => x.n);

  // El globo del helado: el sueño de la nave B, que la vuelta de la exploradora revienta.
  const globoHelado = el(efectos, 'g', { opacity: 0 });
  for (const [x, y, r] of [
    [-8, 30, 5],
    [-2, 18, 8],
  ] as const) {
    el(globoHelado, 'circle', {
      cx: x,
      cy: y,
      r,
      fill: '#fffaf2',
      stroke: TINTA,
      'stroke-width': 2,
    });
  }
  const nubeHelado = el(globoHelado, 'g');
  el(nubeHelado, 'path', {
    d: mancha(14, -34, 46, 3, 0.18),
    fill: '#fffaf2',
    stroke: TINTA,
    'stroke-width': 2.4,
  });
  el(nubeHelado, 'path', {
    d: 'M4 -26L24 -26 14 2Z',
    fill: '#e2a65a',
    stroke: TINTA,
    'stroke-width': 2,
  });
  el(nubeHelado, 'path', {
    d: 'M8 -22L20 -22M10 -16L18 -16',
    stroke: '#b47a38',
    'stroke-width': 1.6,
  });
  el(nubeHelado, 'path', {
    d: mancha(14, -36, 14, 11, 0.2),
    fill: '#6b3a2a',
    stroke: TINTA,
    'stroke-width': 2,
  });
  el(nubeHelado, 'path', {
    d: mancha(14, -52, 11, 13, 0.2),
    fill: '#7d4632',
    stroke: TINTA,
    'stroke-width': 2,
  });
  el(nubeHelado, 'circle', {
    cx: 16,
    cy: -66,
    r: 4.4,
    fill: '#ff4d5e',
    stroke: TINTA,
    'stroke-width': 1.6,
  });
  el(nubeHelado, 'circle', { cx: 9, cy: -54, r: 2.6, fill: '#fff', opacity: 0.5 });
  // "Y yo quiero unas papas fritas…": el antojo de la nave A, en su globo como el helado de la B. La
  // exploradora entra hablando encima y el globo se aplasta antes de terminar de flotar.
  const globoPapas = el(efectos, 'g', { opacity: 0 });
  for (const [x, y, r] of [
    [-8, 30, 5],
    [-2, 18, 8],
  ] as const) {
    el(globoPapas, 'circle', {
      cx: x,
      cy: y,
      r,
      fill: '#fffaf2',
      stroke: TINTA,
      'stroke-width': 2,
    });
  }
  const nubePapas = el(globoPapas, 'g');
  el(nubePapas, 'path', {
    d: mancha(14, -34, 46, 3, 0.18),
    fill: '#fffaf2',
    stroke: TINTA,
    'stroke-width': 2.4,
  });
  // Los bastones asoman del cucurucho en abanico; el cucurucho va encima y los tapa abajo.
  for (const [x, alto, giro] of [
    [5, 30, -14],
    [10, 34, -6],
    [15, 36, 2],
    [20, 33, 9],
    [24, 29, 16],
  ] as const) {
    el(nubePapas, 'rect', {
      x: x - 2.6,
      y: -24 - alto,
      width: 5.2,
      height: alto,
      rx: 1.6,
      fill: '#ffd25e',
      stroke: TINTA,
      'stroke-width': 1.6,
      transform: `rotate(${giro} ${x} -24)`,
    });
  }
  el(nubePapas, 'path', {
    d: 'M0 -30L28 -30 24 0 4 0Z',
    fill: '#e8414f',
    stroke: TINTA,
    'stroke-width': 2,
  });
  el(nubePapas, 'path', {
    d: mancha(14, -15, 6, 5, 0.1),
    fill: '#fffaf2',
    opacity: 0.85,
  });
  const corazon = el(efectos, 'path', {
    d: 'M0 9C-16 -2-16 -15-6 -15C-2 -15 0 -11 0 -9C0 -11 2 -15 6 -15C16 -15 16 -2 0 9Z',
    fill: '#ff7a9c',
    stroke: TINTA,
    'stroke-width': 2,
    opacity: 0,
  });
  const humos = Array.from({ length: 5 }, () =>
    el(efectos, 'circle', { r: 10, fill: '#a99bb8', opacity: 0 }),
  );
  /** Cuánto crecen los rótulos de los disparos sobre sus 19 unidades: lo fija `medir()`. */
  let escalaRotulo = 1;
  const disparos = Array.from({ length: 6 }, () => {
    const g = el(efectos, 'g', { opacity: 0 });
    el(g, 'circle', { r: 22, fill: 'url(#pa-proyectil)' });
    el(g, 'circle', { r: 6, fill: '#e9fff8' });
    const pff = el(g, 'circle', { r: 10, fill: 'none', stroke: '#9ff0d8', 'stroke-width': 2 });
    const rotulo = el(g, 'text', {
      'font-family': '"JetBrains Mono","Cascadia Mono",Consolas,monospace',
      'font-size': ROTULO_DISPARO,
      'font-weight': 600,
      fill: '#d8fff2',
      stroke: '#0b1630',
      'stroke-width': 4,
      'paint-order': 'stroke',
    });
    return { g, pff, rotulo };
  });

  const balaG = el(svg, 'g', { opacity: 0 });
  const estela = el(balaG, 'line', {
    stroke: 'url(#pa-estela)',
    'stroke-width': 26,
    'stroke-linecap': 'round',
  });
  const balaBola = el(balaG, 'g');
  el(balaBola, 'circle', { r: 24, fill: 'url(#pa-bola-a)', stroke: TINTA, 'stroke-width': 2 });
  el(balaBola, 'circle', { cx: -8, cy: -9, r: 6, fill: '#fff', opacity: 0.7 });

  const destello = el(svg, 'circle', {
    cx: CX,
    cy: CY,
    r: 1300,
    fill: 'url(#pa-destello)',
    opacity: 0,
    // Tapa la escena entera y casi siempre es invisible: sin esto se quedaba con todos los toques, y
    // tocar una nave caía en el cielo.
    'pointer-events': 'none',
  });
  const ondaChoque = el(svg, 'circle', {
    cx: CX,
    cy: CY,
    fill: 'none',
    stroke: '#ffe2b0',
    opacity: 0,
  });

  // ── primer plano: lo que enmarca y pasa más rápido que todo ──
  const frente = el(svg, 'g');
  const frenteAfuera = el(frente, 'g');
  const siluetas = [
    { x: 120, y: 980, r: 230, s: 21 },
    { x: 1480, y: -90, r: 200, s: 23 },
    { x: 2300, y: 990, r: 260, s: 29 },
  ].map((p) => {
    const g = el(frenteAfuera, 'g', { transform: `translate(${p.x} ${p.y})` });
    el(g, 'path', { d: mancha(0, 0, p.r, p.s, 0.3), fill: '#0b0817' });
    el(g, 'path', {
      d: mancha(0, 0, p.r, p.s, 0.3),
      fill: 'none',
      stroke: '#8a5ad0',
      'stroke-opacity': 0.4,
      'stroke-width': 5,
      'stroke-dasharray': `${p.r * 1.2} ${p.r * 9}`,
    });
    return { g, ...p };
  });
  const frenteDentro = el(frente, 'g', { opacity: 0 });
  const bokeh = [
    { x: 160, y: 760, r: 170, c: 'a' },
    { x: 1460, y: 140, r: 140, c: 'b' },
    { x: 1380, y: 820, r: 110, c: 'a' },
    { x: 60, y: 120, r: 90, c: 'b' },
  ].map((b) => ({
    el: el(frenteDentro, 'circle', { cx: b.x, cy: b.y, r: b.r, fill: `url(#pa-bokeh-${b.c})` }),
    ...b,
  }));
  const vineta = el(svg, 'rect', { ...TODO, fill: 'url(#pa-vineta)', 'pointer-events': 'none' });

  /* ── encuadre: del viewBox a la pantalla ────────────────────────────────────────────────────── */

  let encuadre = { k: 1, ox: 0, oy: 0, x0: 0, y0: 0 };
  /** El SVG y el prólogo en pantalla: se miden al cambiar de tamaño, no en cada cuadro. */
  let caja = { ancho: 0, alto: 0, dx: 0, dy: 0, x0: 0, y0: 0 };
  /** La franja de la escena que se ve (`encuadreVertical`). Apaisada, la escena entera. */
  const camara = { x: 0, ancho: ANCHO };
  /** Al medir, la cámara va directo a su lugar: deslizarse desde el tamaño viejo sería un mareo. */
  let camaraAsentada = false;
  function medir(): void {
    const r = raiz.getBoundingClientRect();
    const rs = svg.getBoundingClientRect();
    caja = {
      ancho: rs.width,
      alto: rs.height,
      dx: rs.left - r.left,
      dy: rs.top - r.top,
      x0: r.left,
      y0: r.top,
    };
    camaraAsentada = false;
    encuadrar();
  }
  function encuadrar(): void {
    const { x, ancho } = camara;
    fijar(svg, { viewBox: `${r2(x)} 0 ${r2(ancho)} ${ALTO}` });
    const k = Math.min(caja.ancho / ancho, caja.alto / ALTO) || 1;
    const cambiaLaLetra = Math.abs(k - encuadre.k) > 0.002;
    encuadre = {
      k,
      ox: caja.dx + (caja.ancho - ancho * k) / 2 - x * k,
      oy: caja.dy + (caja.alto - ALTO * k) / 2,
      x0: caja.x0,
      y0: caja.y0,
    };
    if (!cambiaLaLetra) return;
    if (mascotaEl) mascotaEl.style.width = `${Math.round(300 * k)}px`;
    escalaRotulo = letraConPiso(ROTULO_DISPARO, PISO_DISPARO_PX, k) / ROTULO_DISPARO;
    for (const d of disparos) {
      fijar(d.rotulo, {
        'font-size': r2(ROTULO_DISPARO * escalaRotulo),
        'stroke-width': r2(4 * escalaRotulo),
      });
    }
  }
  /**
   * La cámara sigue a las naves en pantalla y a la anomalía, que es de lo que se trata: el centro y
   * lo que lo rodea, porque con solo el punto quedaba pegado al borde y las bolas salían por la
   * mitad. Se desliza despacio: un corte cada vez que una nave se mueve marearía.
   */
  function moverCamara(dtS: number): void {
    const actores = [
      { x: CX - ALREDEDOR_DEL_CENTRO, y: CY },
      { x: CX + ALREDEDOR_DEL_CENTRO, y: CY },
      // Solo las que están en el cuadro: la que se va no arrastra a la cámara con ella.
      ...flota.map((n) => n.pos).filter((p) => p.x > 0 && p.x < ANCHO),
    ];
    const meta = encuadreVertical(actores, caja.alto > 0 ? caja.ancho / caja.alto : 1);
    const f = camaraAsentada && dtS > 0 ? 1 - Math.exp(-dtS * 1.6) : 1;
    camaraAsentada = true;
    const x = camara.x + (meta.x - camara.x) * f;
    const ancho = camara.ancho + (meta.ancho - camara.ancho) * f;
    if (Math.abs(x - camara.x) < 0.3 && Math.abs(ancho - camara.ancho) < 0.3) return;
    camara.x = x;
    camara.ancho = ancho;
    encuadrar();
  }
  const aPantalla = (p: Punto): Punto => ({
    x: encuadre.ox + p.x * encuadre.k,
    y: encuadre.oy + p.y * encuadre.k,
  });
  const aEscena = (cx: number, cy: number): Punto => ({
    x: (cx - encuadre.x0 - encuadre.ox) / encuadre.k,
    y: (cy - encuadre.y0 - encuadre.oy) / encuadre.k,
  });
  const observador = typeof ResizeObserver === 'function' ? new ResizeObserver(medir) : null;
  observador?.observe(raiz);

  /* ── sonido ─────────────────────────────────────────────────────────────────────────────────
     Sintetizado, sin archivos, sobre la salida común del director (`libs/sonido.ts`): un solo
     contexto para toda la app y un solo interruptor. Sin salida el prólogo corre igual, mudo. */

  interface RedDeAudio {
    readonly master: GainNode;
    readonly zumbido: OscillatorNode;
    readonly zumbidoGain: GainNode;
    readonly filtro: BiquadFilterNode;
  }
  let red: RedDeAudio | null = null;
  /** Lo que ya sonó o se dijo una sola vez, por id de línea o por hito. */
  let dichas = new Set<string>();
  let terminado = false;

  function abrirAudio(): RedDeAudio | null {
    if (terminado) return null;
    const salida = sonido().salida();
    if (!salida) return null;
    if (red) return red;
    const ac = salida.ctx;
    const master = ac.createGain();
    master.gain.value = 0.5;
    master.connect(salida.salida);
    const zumbido = ac.createOscillator();
    zumbido.type = 'sawtooth';
    zumbido.frequency.value = 46;
    const filtro = ac.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 120;
    const zumbidoGain = ac.createGain();
    zumbidoGain.gain.value = 0;
    zumbido.connect(filtro).connect(zumbidoGain).connect(master);
    zumbido.start();
    red = { master, zumbido, zumbidoGain, filtro };
    return red;
  }

  /** El contexto es de toda la app y NO se cierra: se corta el zumbido y se suelta la red. */
  function soltarAudio(): void {
    if (!red) return;
    red.zumbido.stop();
    red.zumbido.disconnect();
    red.master.disconnect();
    red = null;
  }

  function pip(freq: number, dur: number, tipo: OscillatorType, vol: number, hasta?: number): void {
    const r = abrirAudio();
    if (!r) return;
    const ac = r.master.context;
    const o = ac.createOscillator();
    const gg = ac.createGain();
    o.type = tipo;
    o.frequency.value = freq;
    const n = ac.currentTime;
    if (hasta) {
      o.frequency.setValueAtTime(freq, n);
      o.frequency.exponentialRampToValueAtTime(hasta, n + dur);
    }
    gg.gain.setValueAtTime(0, n);
    gg.gain.linearRampToValueAtTime(vol, n + 0.012);
    gg.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    o.connect(gg).connect(r.master);
    o.start(n);
    o.stop(n + dur + 0.05);
  }

  /** Ráfaga de ruido filtrado: el salto, el viento de una pasada, el choque. */
  function ruido(dur: number, desde: number, hasta: number, vol: number): void {
    const r = abrirAudio();
    if (!r) return;
    const ac = r.master.context;
    const largo = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, largo, ac.sampleRate);
    const dat = buf.getChannelData(0);
    for (let i = 0; i < largo; i++) dat[i] = (Math.random() * 2 - 1) * (1 - i / largo);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    const n = ac.currentTime;
    bp.frequency.setValueAtTime(desde, n);
    bp.frequency.exponentialRampToValueAtTime(hasta, n + dur);
    const gg = ac.createGain();
    gg.gain.value = vol;
    src.connect(bp).connect(gg).connect(r.master);
    src.start(n);
  }

  /** Una sola vez por hito: prender el sonido tarde no puede disparar un salto que ya pasó. */
  const unaVez = (clave: string, fn: () => void): void => {
    if (dichas.has(clave)) return;
    dichas.add(clave);
    fn();
  };

  /* ── física ────────────────────────────────────────────────────────────────────────────────── */

  /**
   * Todo golpe pasa por acá, venga de una pasada, un disparo, el choque o un dedo: sacude a cada
   * nave según la distancia y la empuja alejándola del punto.
   */
  function impacto(x: number, y: number, fuerza: number, radio = 700, soloA?: number): void {
    flota.forEach((n, i) => {
      if (soloA !== undefined && soloA !== i) return;
      if (n.pos.x < -500) return;
      const dx = n.pos.x - x,
        dy = n.pos.y - y;
      const d = Math.hypot(dx, dy) || 1;
      const cerca = limitar(1 - d / radio, 0, 1);
      if (cerca <= 0) return;
      n.m.dx.v += (dx / d) * fuerza * cerca * 520;
      n.m.dy.v += (dy / d) * fuerza * cerca * 520;
      n.m.rot.v += (dx >= 0 ? 1 : -1) * fuerza * cerca * 160;
      n.m.sq.v = Math.min(n.m.sq.v + fuerza * cerca * 4, 6.5);
    });
  }

  /** Un saltito al tomar la palabra: es como se nota en la escena quién está hablando. */
  function tomaLaPalabra(i: number): void {
    const n = flota[i];
    n.m.dy.v -= 120;
    n.m.sq.v = Math.min(n.m.sq.v + 2.2, 6.5);
    n.m.antena.v += 140;
  }

  /* ── el cuadro ─────────────────────────────────────────────────────────────────────────────── */

  /** Parpadeo a intervalos irregulares: a ritmo fijo se ve mecánico. */
  function parpadeo(t: number, i: number): number {
    const CICLO = 2900;
    const c = Math.floor((t + i * 1100) / CICLO);
    const en = (t + i * 1100) % CICLO;
    const cuando = 300 + azar(c * 13 + i) * 2200;
    const q = (en - cuando) / 160;
    if (q < 0 || q > 1) return 1;
    return q < 0.4 ? 1 - q / 0.4 : (q - 0.4) / 0.6;
  }

  /** La cara que pone cada nave en cada momento: lo que la línea de diálogo cuenta, en las cejas. */
  function animoDe(i: number, t: number): NombreAnimo {
    const en = (id: string, extra = 900): boolean => {
      const l = linea(id);
      return t >= l.t0 && t < l.t1 + extra;
    };
    if (i === 1 && en('linea-msxheigk')) return 'harta';
    if (i === 1 && en('leccion-tirados', 1400)) return 'triste';
    if (i === 0 && (en('reclamo-loco') || en('reclamo-armonioso') || en('reclamo-tranquilo')))
      return 'enojada';
    if (i === 0 && en('leccion-listos', 1400)) return 'decidida';
    if (i === 3 && t < T.temblor) return 'decidida';
    if (t >= T.fusion && t < T.choque + 1600) return 'sorprendida';
    if (t >= T.temblor && t < T.choque) return 'asustada';
    if (t >= T.orden) return 'tranquila';
    return 'tranquila';
  }

  /** Qué mira cada piloto: lo que está pasando, no a la cámara. */
  function miradaDe(
    i: number,
    t: number,
    quienHabla: readonly number[],
    bolaCerca: Punto | null,
  ): Punto {
    const n = flota[i];
    if (n.curiosidad && t < n.curiosidad.hasta) return n.curiosidad.p;
    const b = bala(t, M);
    if (b) return b;
    if (t >= T.choque) {
      const m = mascota(t, T);
      if (m) return m;
    }
    if (t >= T.fusion) {
      // Buscan de dónde salió la voz: la mirada va de un lado al otro.
      return { x: CX + Math.sin(t * 0.0017 + i) * 700, y: CY - 200 };
    }
    if (t >= T.zoom && bolaCerca) return bolaCerca;
    if (t >= T.temblor) {
      if (i === 3) {
        const lider = flota[0];
        return lider.pos;
      }
      return { x: CX, y: CY };
    }
    if (i === 2 && t >= M.helado.t0 && t < M.vuelta.t0 + (M.vuelta.t1 - M.vuelta.t0) / 2) {
      return { x: n.pos.x + 30, y: n.pos.y - 140 };
    }
    const otro = quienHabla.find((q) => q !== i);
    if (otro !== undefined) return flota[otro].pos;
    return { x: n.pos.x + 300, y: n.pos.y - 20 };
  }

  /**
   * Copia una nave al SVG. `base` es la pose del guion; los muelles se suman encima. La nariz apunta
   * hacia donde se mueve: de costado, darse vuelta es un espejo, no un giro de media vuelta.
   */
  function pintarNave(
    i: number,
    t: number,
    base: Punto & { s: number; a: number },
    rumbo: Punto,
    extra: { estira: number; llama: number; mira?: 1 | -1 | undefined },
    quienHabla: readonly number[],
    bolaCerca: Punto | null,
  ): void {
    const n = flota[i];
    if (base.a <= 0.01 || base.s <= 0.03) {
      fijar(n.pose, { opacity: 0 });
      n.pos = { x: -999, y: -999 };
      return;
    }
    const vx = rumbo.x,
      vy = rumbo.y;
    if (extra.mira) n.m.mira.destino = extra.mira;
    else if (Math.abs(vx) > 0.04) n.m.mira.destino = vx > 0 ? 1 : -1;
    const mira = limitar(n.m.mira.x, -1, 1);
    const inclina = limitar(Math.atan2(vy, Math.abs(vx) + 0.0001), -0.6, 0.6);
    n.angulo = n.angulo + (inclina - n.angulo) * 0.12;
    const bob = Math.sin(t * 0.0021 + i * 1.7) * 5;
    const x = base.x + n.m.dx.x;
    const y = base.y + n.m.dy.x + bob * base.s;
    n.pos = { x, y };
    n.escala = base.s;
    const sq = limitar(n.m.sq.x, -0.3, 0.3);
    const sx =
      (1 + sq * 0.8 + extra.estira) * (Math.abs(mira) < 0.15 ? 0.15 * Math.sign(mira || 1) : mira);
    const sy = 1 - sq - extra.estira * 0.45;
    fijar(n.pose, {
      opacity: r2(base.a),
      transform: `translate(${r2(x)} ${r2(y)}) rotate(${r2(((n.angulo * 180) / Math.PI) * Math.sign(mira || 1))}) scale(${r2(base.s * 0.86)})`,
    });
    fijar(n.rig, { transform: `rotate(${r2(n.m.rot.x)}) scale(${r2(sx)} ${r2(sy)})` });
    const fuego =
      extra.llama * (0.82 + Math.sin(t * 0.05 + i) * 0.16 + Math.sin(t * 0.13 + i * 2) * 0.08);
    fijar(n.llama, {
      transform: `translate(-66 0) scale(${r2(Math.max(0, fuego))} ${r2(0.8 + fuego * 0.2)}) translate(66 0)`,
    });

    // La cara.
    const an = ANIMOS[animoDe(i, t)];
    const ojo = parpadeo(t, i) * an.ojos;
    fijar(n.ojos, {
      transform: `translate(0 -18) scale(${r2(an.ojos)} ${r2(Math.max(0.06, ojo))}) translate(0 18)`,
    });
    const objetivo = miradaDe(i, t, quienHabla, bolaCerca);
    let lx = objetivo.x - x,
      ly = objetivo.y - y;
    const ang = -n.angulo * Math.sign(mira || 1);
    const rx = lx * Math.cos(ang) - ly * Math.sin(ang);
    ly = lx * Math.sin(ang) + ly * Math.cos(ang);
    lx = rx * Math.sign(mira || 1);
    const d = Math.hypot(lx, ly) || 1;
    for (const p of n.pupilas) {
      fijar(p, { transform: `translate(${r2((lx / d) * 2.6)} ${r2((ly / d) * 2.4)})` });
    }
    n.cejas.forEach((c, k) => {
      const giro = k === 1 ? an.cejas : -an.cejas;
      fijar(c, { transform: `${n.cejasBase[k]} translate(0 ${an.altura}) rotate(${giro})` });
    });

    // La antena sigue al cuerpo con retraso; la luz titila si habla.
    n.m.antena.destino = limitar(-n.m.rot.v * 0.1 - n.m.dy.v * 0.04, -40, 40);
    fijar(n.antena, { transform: `translate(-6 -30) rotate(${r2(n.m.antena.x)})` });
    if (n.bandera) {
      const flamea = Math.sin(t * 0.012) * 0.18 - n.m.antena.v * 0.002;
      fijar(n.bandera, { transform: `skewY(${r2(limitar(flamea, -0.5, 0.5) * 30)})` });
    }
    const habla = quienHabla.includes(i);
    fijar(n.ondas, { opacity: habla ? r2(0.4 + 0.6 * ((Math.sin(t * 0.012) + 1) / 2)) : 0 });
    fijar(n.luz, { opacity: habla ? r2(0.6 + 0.4 * Math.sin(t * 0.02)) : 0.85 });
  }

  /** Los globos de pensamiento y el humo: siguen a la nave que los tiene. */
  function pintarGags(t: number): void {
    const a = flota[1],
      b = flota[2];
    // El corazón de la nave A sube cuando extraña a su familia.
    const qc = clamp01((t - M.familia.t0 - 200) / 2200);
    if (qc > 0 && qc < 1 && a.pos.x > -500) {
      const e = conRebote(clamp01(qc / 0.15));
      fijar(corazon, {
        opacity: r2(clamp01((1 - qc) / 0.3)),
        transform: `translate(${r2(a.pos.x - 10)} ${r2(a.pos.y - 70 * a.escala - qc * 90)}) scale(${r2(e * 1.3)})`,
      });
    } else fijar(corazon, { opacity: 0 });

    // El helado: entra con rebote y revienta con el viento de la vuelta.
    const revienta = (M.vuelta.t0 + M.vuelta.t1) / 2;
    const entra = clamp01((t - M.helado.t0 - 250) / 320);
    const pop = clamp01((t - revienta) / 220);
    if (entra > 0 && pop < 1 && b.pos.x > -500) {
      const flota0 = Math.sin(t * 0.003) * 4;
      const s = conRebote(entra, 2.2) * (1 + pop * 0.35) * (1 - pop);
      fijar(globoHelado, {
        opacity: r2(1 - pop),
        transform: `translate(${r2(b.pos.x + 26)} ${r2(b.pos.y - 74 + flota0)}) scale(${r2(Math.max(0.01, s))})`,
      });
      fijar(nubeHelado, { transform: `rotate(${r2(Math.sin(t * 0.002) * 3)})` });
    } else fijar(globoHelado, { opacity: 0 });
    if (t >= revienta) {
      unaVez('helado-pop', () => {
        pip(980, 0.09, 'triangle', 0.08);
        if (b.pos.x > -500) {
          const p = aPantalla({ x: b.pos.x + 30, y: b.pos.y - 110 });
          chispas(raiz, p.x, p.y, '#fffaf2', 9);
          palabra(raiz, p.x, p.y, '¡pop!');
        }
      });
    }

    // Las papas fritas: entran con rebote como el helado y se aplastan con el mismo viento.
    const qu = clamp01((t - M.unas.t0 - 250) / 320);
    const corta = clamp01((t - revienta) / 200);
    if (qu > 0 && corta < 1 && a.pos.x > -500) {
      const flotaA = Math.sin(t * 0.003 + 1) * 4;
      const s = conRebote(qu, 2.2);
      fijar(globoPapas, {
        opacity: r2(1 - corta),
        transform: `translate(${r2(a.pos.x + 30)} ${r2(a.pos.y - 74 + flotaA)}) scale(${r2(s * (1 - corta * 0.6))} ${r2(s * (1 + corta * 0.5))})`,
      });
      fijar(nubePapas, { transform: `rotate(${r2(Math.sin(t * 0.002 + 1) * 3)})` });
    } else fijar(globoPapas, { opacity: 0 });

    // "No tengo control de los sistemas": la llama de la nave A tose humo.
    humos.forEach((h, k) => {
      const nace = M.sinControl.t0 + 200 + k * 420;
      const q = (t - nace) / 1300;
      if (q <= 0 || q >= 1 || a.pos.x < -500) {
        fijar(h, { opacity: 0 });
        return;
      }
      const atras = { x: a.pos.x - 60 * a.escala, y: a.pos.y };
      fijar(h, {
        opacity: r2(0.55 * (1 - q)),
        cx: r2(atras.x - q * 60),
        cy: r2(atras.y - q * 50 - k * 4),
        r: r2((8 + q * 22) * Math.max(0.4, a.escala)),
      });
    });
  }

  function pintarDisparos(t: number): void {
    const vivos = [...proyectiles(t, OPERADORES, M.rxjs, T), ...proyectiles(t, PIPES, M.pipes, T)];
    disparos.forEach((d, k) => {
      const p = vivos[k];
      if (!p) {
        fijar(d.g, { opacity: 0 });
        return;
      }
      const pff = clamp01((p.p - 0.55) / 0.45);
      fijar(d.g, {
        opacity: r2(Math.max(p.vida, pff > 0 ? 0.6 * (1 - pff) : 0)),
        transform: `translate(${r2(p.x)} ${r2(p.y)}) scale(${r2(1 - p.p * 0.45)})`,
      });
      fijar(d.pff, { r: r2(8 + pff * 40), opacity: r2(pff > 0 ? 1 - pff : 0) });
      if (d.rotulo.textContent !== p.txt) d.rotulo.textContent = p.txt;
      fijar(d.rotulo, {
        x: r2(18 * escalaRotulo),
        y: r2((p.lado < 0 ? -14 : 30) * escalaRotulo),
        opacity: r2(opacidadDelRotulo(p, escalaRotulo > 1)),
      });
    });
    // El retroceso de cada disparo: causa y reacción, la nave que dispara se sacude.
    for (const [tanda, desde, clave] of [
      [OPERADORES, M.rxjs, 'op'],
      [PIPES, M.pipes, 'pipe'],
    ] as const) {
      tanda.forEach((op, k) => {
        if (t >= desde + op.d) {
          unaVez(`${clave}-${k}`, () => {
            const n = flota[op.nave];
            n.m.dx.v -= 260;
            n.m.sq.v = Math.min(n.m.sq.v + 2.5, 6.5);
            pip(640 + k * 40, 0.12, 'square', 0.035, 320);
          });
        }
        if (t >= desde + op.d + 900)
          unaVez(`${clave}-pff-${k}`, () => ruido(0.25, 3200, 900, 0.05));
      });
    }
  }

  /**
   * Cuánto deja sonar el zumbido, de 0 a 1. Con el manual abierto baja a cero: ahí suena la música
   * para estudiar, y la tensión de la anomalía, sostenida mientras se lee, cansaba (`docs/sonido.md`).
   */
  let zumbidoLibre = 1;
  let zumbidoEn: number | null = null;
  /** Lo que tarda el zumbido en irse o volver, en segundos: un corte seco chasquea. */
  const FUNDIDO_DEL_ZUMBIDO = 1.2;
  const metaDelZumbido = (): number => (manual === 'leyendo' ? 0 : 1);

  /** Lo que el reloj dice que suena, cuándo: dialogo, zumbido, salto, choque y el acorde final. */
  function pintarAudio(t: number, claro: number): void {
    const audio = abrirAudio();
    if (audio) {
      const ahora = audio.master.context.currentTime;
      const paso = zumbidoEn === null ? 1 : (ahora - zumbidoEn) / FUNDIDO_DEL_ZUMBIDO;
      zumbidoEn = ahora;
      const meta = metaDelZumbido();
      zumbidoLibre +=
        Math.sign(meta - zumbidoLibre) * Math.min(Math.abs(meta - zumbidoLibre), paso);
      const cerca = clamp01((t - T.temblor) / (T.zoom - T.temblor));
      const dentro0 = t > T.zoom && t < T.orden ? 0.5 : 0;
      audio.zumbidoGain.gain.value =
        zumbidoLibre * (t < T.zoom ? cerca * 0.16 : dentro0 * 0.1 * (1 - claro));
      audio.filtro.frequency.value = 110 + cerca * 700;
    }
    if (t >= M.vuelta.t0 + 300) unaVez('vuelta', () => ruido(0.7, 400, 2600, 0.12));
    M.tirones.forEach((tt, k) => {
      if (t >= tt) unaVez(`tiron-${k}`, () => pip(52 - k * 6, 0.8, 'sine', 0.18 + k * 0.04));
    });
    if (t >= T.zoom) {
      unaVez('salto', () => {
        ruido(1.1, 220, 4200, 0.28);
        pip(70, 1.4, 'sine', 0.2);
      });
    }
    if (t >= M.bala.t0 + 200) unaVez('bala', () => ruido(0.9, 300, 3000, 0.14));
    if (t >= T.choque) {
      unaVez('choque', () => {
        ruido(0.5, 1800, 160, 0.22);
        pip(58, 0.9, 'sine', 0.26);
      });
    }
    if (t >= T.orden + 2600) {
      unaVez('final', () =>
        [220, 277, 330, 440].forEach((f, i) => luego(() => pip(f, 2.2, 'sine', 0.07), i * 160)),
      );
    }
  }

  /* ── el diálogo, en HTML: accesible y nítido en cualquier tamaño ───────────────────────────── */

  const ocupado: (string | null)[] = globos.map(() => null);
  let vozActual: string | null = null;

  function pintarDialogo(t: number): number[] {
    const activas = reloj.filter((d) => t >= d.t0 && t < d.t1);
    const enGlobo = activas.filter((d) => d.quien !== 'voz' && d.quien !== 'todos');
    const enVoz = activas.find((d) => d.quien === 'voz' || d.quien === 'todos') ?? null;
    const hablan: number[] = [];

    for (const d of activas) {
      if (dichas.has(d.id)) continue;
      dichas.add(d.id);
      sonido().hablar(
        d.quien,
        textoVisible(d),
        (d.t1 - d.t0) / velocidad,
        VOCES_GRABADAS[d.id]?.archivo,
      );
      const nave = NAVE_DE[d.quien];
      if (nave !== undefined) tomaLaPalabra(nave);
      if (d.quien === 'mascota') angieHabla.v -= 3.2;
    }
    for (const d of activas) {
      const nave = NAVE_DE[d.quien];
      if (nave !== undefined) hablan.push(nave);
      if (d.quien === 'todos') hablan.push(0, 1, 2);
    }

    globos.forEach((g, k) => {
      const d = enGlobo[k];
      const quien = g.querySelector<HTMLElement>('.prologo__quien');
      const frase = g.querySelector<HTMLElement>('.prologo__frase');
      if (!d) {
        if (ocupado[k] !== null) {
          ocupado[k] = null;
          g.style.opacity = '0';
          g.dataset['quien'] = '';
          quien?.classList.remove('prologo__quien--visible');
        }
        return;
      }
      if (ocupado[k] !== d.id) {
        ocupado[k] = d.id;
        g.dataset['quien'] = d.quien;
        if (frase) escribirFrase(frase, d.txt);
        if (quien) {
          quien.textContent = NOMBRES[d.quien];
          quien.classList.toggle('prologo__quien--visible', NOMBRES[d.quien] !== '');
        }
      }
      const e = conRebote(clamp01((t - d.t0) / PRESUPUESTO.entra), 2.2);
      const a =
        clamp01((t - d.t0) / (PRESUPUESTO.entra * 0.6)) * clamp01((d.t1 - t) / PRESUPUESTO.sale);
      g.style.opacity = r2(a);
      g.style.transform = `translateY(${r2((1 - e) * 26)}px) scale(${r2(0.86 + 0.14 * e)})`;
    });

    if (vozEl) {
      if (!enVoz) {
        if (vozActual !== null) {
          vozActual = null;
          vozEl.style.opacity = '0';
        }
      } else {
        if (vozActual !== enVoz.id) {
          vozActual = enVoz.id;
          vozEl.textContent = enVoz.txt;
          vozEl.dataset['quien'] = enVoz.quien;
        }
        const a =
          clamp01((t - enVoz.t0) / (enVoz.quien === 'voz' ? 700 : 160)) *
          clamp01((enVoz.t1 - t) / PRESUPUESTO.sale);
        vozEl.style.opacity = r2(a);
        const tiembla = enVoz.quien === 'todos' ? temblor(t, 5) : { x: 0, y: 0 };
        const e = enVoz.quien === 'todos' ? conRebote(clamp01((t - enVoz.t0) / 260), 2.4) : 1;
        vozEl.style.transform = `translate(${r2(tiembla.x)}px, ${r2(tiembla.y)}px) scale(${r2(0.6 + 0.4 * e)})`;
      }
    }
    return hablan;
  }

  /* ── Angie: la misma de la colina, armada del choque ───────────────────────────────────────── */

  const angieEscala = crearMuelle(0, 170, 10);
  const angieHabla = crearMuelle(0, 220, 12);
  let angieViva = false;
  function pintarAngie(t: number): void {
    if (!mascotaEl) return;
    const m = mascota(t, T);
    const viva = !!m && !pausado;
    if (viva !== angieViva) {
      angieViva = viva;
      opts.alCambiarMascota?.(viva);
    }
    if (!m) {
      mascotaEl.style.opacity = '0';
      mascotaEl.style.visibility = 'hidden';
      angieEscala.x = 0.2;
      angieEscala.v = 0;
      return;
    }
    if (!dichas.has('angie-nace')) {
      dichas.add('angie-nace');
      angieEscala.x = 0.2;
      angieEscala.v = 6;
    }
    angieEscala.destino = m.escala;
    const p = aPantalla(m);
    const ancho = 300 * encuadre.k;
    mascotaEl.style.visibility = 'visible';
    mascotaEl.style.opacity = r2(m.a);
    mascotaEl.style.transform = `translate(${r2(p.x - ancho / 2)}px, ${r2(p.y - ancho * 0.56 + angieHabla.x * 6)}px) scale(${r2(Math.max(0.05, angieEscala.x))}, ${r2(Math.max(0.05, angieEscala.x * (1 + angieHabla.x * 0.02)))})`;
  }

  /* ── un cuadro de la escena ────────────────────────────────────────────────────────────────── */

  let anterior0: Punto[] = flota.map(() => ({ x: 0, y: 0 }));

  function dibujar(t: number, dtS: number): void {
    const claro = claridad(t, T);
    const den = adentro(t, T);
    const w = warp(t, T);
    const crece = crecimiento(t, T);

    // Los planos de fondo.
    fijar(espacio, { opacity: r2(1 - den) });
    fijar(dentro, { opacity: r2(den * (1 - claro)) });
    fijar(papel, { opacity: r2(claro) });
    fijar(vineta, { opacity: r2(1 - claro * 0.85) });

    if (den < 1) {
      // Las estrellas derivan (las naves avanzan) y, con el arrastre, se curvan hacia el centro.
      const arr = clamp01((t - T.anomalia) / (T.zoom - T.anomalia));
      fijar(cielo, {
        transform: `translate(${CX} ${CY}) rotate(${r2(arr * arr * 9)}) scale(${r2(1 - arr * 0.06)}) translate(${r2(-CX - t * 0.004)} ${-CY})`,
      });
      titilan.forEach((g, k) =>
        fijar(g, { opacity: r2(0.62 + 0.38 * Math.sin(t * 0.0019 + k * 2.1)) }),
      );
      fijar(cercanas, { transform: `translate(${r2(-t * 0.007)} 0)` });
      fijar(casa, { transform: `translate(${r2(1460 - t * 0.002)} 430)` });
      for (const p of piedras) {
        fijar(p.g, {
          transform: `translate(${r2(p.x - t * 0.014)} ${r2(p.y)}) rotate(${r2(t * p.giro)})`,
        });
      }
      for (const s of siluetas) {
        fijar(s.g, { transform: `translate(${r2(s.x - t * 0.03)} ${r2(s.y)})` });
      }
      // La anomalía: crece con el arrastre, y cada tirón del capitán la hace latir.
      const tiron = M.tirones.reduce(
        (acc, tt) => acc + clamp01(1 - Math.abs(t - tt - 120) / 420),
        0,
      );
      fijar(anomalia, {
        transform: `translate(${CX} ${CY}) scale(${r2(crece * (1 + tiron * 0.14))})`,
        opacity: r2(clamp01(0.55 + crece)),
      });
      // Al tragarlas la anomalía crece nueve veces: el disco y los anillos escalados así eran
      // rayas sueltas volando por la pantalla. Se apagan y queda solo la luz, que es el salto.
      const disuelve = clamp01(1 - (crece - 1) / 1.2);
      fijar(disco, {
        transform: `rotate(${r2(t * (0.02 + clamp01((t - T.anomalia) / 20000) * 0.06))})`,
        opacity: r2(disuelve),
      });
      brazos.forEach((b, k) =>
        fijar(b, { 'stroke-opacity': r2(0.35 + 0.25 * Math.sin(t * 0.003 + k)) }),
      );
      anillos.forEach((a, k) =>
        fijar(a, {
          'stroke-dashoffset': r2((t * (0.05 + k * 0.03)) % 204),
          opacity: r2(disuelve),
        }),
      );
      fijar(nucleo, { r: r2(30 + Math.sin(t * 0.004) * 4 + tiron * 10) });
      fijar(estelas, { opacity: r2(w) });
      if (w > 0.01) {
        for (const r of rayos) {
          const r0 = r.r0 * (1 + w * 0.6);
          const largo = w * (60 + r.z * 420);
          const c = Math.cos(r.a),
            s = Math.sin(r.a);
          fijar(r.el, {
            x1: r2(CX + c * r0),
            y1: r2(CY + s * r0),
            x2: r2(CX + c * (r0 + largo)),
            y2: r2(CY + s * (r0 + largo)),
          });
        }
      }
    }
    fijar(frenteAfuera, { opacity: r2(1 - den) });
    fijar(frenteDentro, { opacity: r2(den * (1 - claro)) });
    if (den > 0) {
      fijar(polvo, {
        transform: `translate(${r2(Math.sin(t * 0.0003) * 30)} ${r2(Math.cos(t * 0.0004) * 20)})`,
      });
      bokeh.forEach((b, k) => {
        fijar(b.el, {
          cx: r2(b.x + Math.sin(t * 0.0004 + k * 2) * 60),
          cy: r2(b.y + Math.cos(t * 0.0005 + k) * 40),
        });
      });
    }

    // El patrón.
    const z = zoom(t, T);
    const radio = RADIO * z;
    const sync = sincronia(t, T);
    const fusion = fusionEn(t, T);
    const cuantas = cuerdasVisibles(t, T);
    const alfa =
      0.05 +
      clamp01((t - T.anomalia) / (T.zoom - T.anomalia)) * 0.35 +
      clamp01((t - T.zoom + 400) / 1800) * 0.6;
    fijar(patron, { opacity: r2(clamp01(alfa) * (t < T.zoom ? 0.6 : 1)) });
    fijar(cuerdasG, {
      stroke: claro > 0.5 ? '#6e6352' : '#d8c6e6',
      'stroke-opacity': r2((claro > 0.5 ? 0.5 : 0.26) * (fusion ? 1 - fusion.p : 1)),
      'stroke-width': r2(claro > 0.5 ? 1.6 : 1.4),
    });
    cuerdas.forEach((c, i) => {
      const th = ANGULOS[i];
      const dib = t >= T.orden ? clamp01(cuantas - i) : 1;
      fijar(c, {
        x1: r2(CX + Math.cos(th) * radio),
        y1: r2(CY + Math.sin(th) * radio),
        x2: r2(CX - Math.cos(th) * radio),
        y2: r2(CY - Math.sin(th) * radio),
        'stroke-dashoffset': r2(1 - dib),
      });
    });
    const todas = bolas(t, radio, sync, fusion);
    const rb = 9 * Math.min(z, 2.4);
    todas.forEach((b, k) => {
      const nace = t >= T.orden ? clamp01((cuantas - b.cuerda) * 0.9) : 1;
      const vivo = fusion ? fusion.vivo : 1;
      const s = (rb / 10) * suave(nace);
      fijar(bolasG[k], {
        transform: `translate(${r2(b.x)} ${r2(b.y)}) scale(${r2(Math.max(0.001, s))})`,
        opacity: r2(vivo * (nace > 0 ? 1 : 0)),
      });
    });
    const ph = t * 0.0011;
    const circ = circulos(t, T);
    circulosG.forEach((c, k) => {
      const s = k === 0 ? 1 : -1;
      fijar(c, {
        cx: r2(CX + (s * radio * Math.cos(ph)) / 2),
        cy: r2(CY + (s * radio * Math.sin(ph)) / 2),
        r: r2(radio / 2),
        'stroke-dashoffset': r2(1 - suave(circ)),
        opacity: circ > 0 ? 1 : 0,
      });
    });
    atomos.forEach((g, k) => {
      if (!fusion) {
        fijar(g, { opacity: 0 });
        return;
      }
      const n = k === 0 ? fusion.a : fusion.b;
      const a = clamp01((fusion.p - 0.3) / 0.35) * fusion.vivo;
      fijar(g, {
        opacity: r2(a),
        transform: `translate(${r2(n.x)} ${r2(n.y)}) rotate(${r2(t * 0.11 * (k ? -1 : 1))}) scale(${r2(0.8 + a * 0.4)})`,
      });
    });

    // El destello del salto y el del choque, y la onda que empuja a las naves.
    const nacimiento = clamp01(1 - Math.abs(t - T.choque) / 320);
    fijar(destello, { opacity: r2(Math.max(w * 0.85, nacimiento * 0.9)) });
    const qo = clamp01((t - T.choque) / 900);
    fijar(ondaChoque, {
      r: r2(40 + suave(qo) * 900),
      opacity: r2(qo > 0 && qo < 1 ? 1 - qo : 0),
      'stroke-width': r2(2 + 34 * (1 - qo)),
    });
    if (t >= T.choque) {
      unaVez('onda', () => impacto(CX, CY, 1.3, 1200));
    }

    // Las naves.
    const hablan = pintarDialogo(t);
    const b = bala(t, M);
    const cercanasA = b ? [...todas, b] : todas;
    pintarGags(t);
    pintarDisparos(t);

    const fueraHasta = T.zoom + 900;
    flota.forEach((n) => {
      // Los muelles avanzan con el reloj de la escena: en pausa no se mueve nada.
      for (const m of Object.values(n.m)) avanzarMuelle(m, dtS);
      n.paciencia = Math.max(0, n.paciencia - dtS * 0.45);
    });

    const masCercana = (p: Punto): Punto | null => {
      let mejor: Punto | null = null,
        dm = 260;
      for (const q of cercanasA) {
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < dm) {
          dm = d;
          mejor = q;
        }
      }
      return mejor;
    };

    for (let i = 0; i < 3; i++) {
      const n = flota[i];
      const prev = anterior0[i];
      if (t < fueraHasta) {
        const f = formacionAfuera(t, T);
        const fo = FORMACION[i];
        const sac = temblor(t, f.sacude, i * 1.7);
        const pos = { x: f.x + fo.dx * f.s + sac.x, y: f.y + fo.dy * f.s + sac.y };
        // Al tirón, todas se inclinan hacia el centro; con el grito, giran.
        const grito = clamp01((t - linea('anom-grito').t0) / 900);
        const ftras = formacionAfuera(t - 80, T);
        const rumbo = { x: f.x - ftras.x + 0.3, y: f.y - ftras.y };
        const estira = f.arrastre * 0.45 + grito * 0.8;
        if (grito > 0) n.m.rot.destino = grito * 360 * (i % 2 ? -1 : 1);
        const sinControl = i === 1 && t >= M.sinControl.t0 && t < M.sinControl.t1 + 1200;
        const tose = sinControl ? (Math.sin(t * 0.03) > 0.2 ? 0.2 : 1) : 1;
        pintarNave(
          i,
          t,
          { ...pos, s: f.s, a: f.a },
          rumbo,
          { estira, llama: (1 + f.arrastre * 0.8) * tose },
          hablan,
          null,
        );
      } else {
        n.m.rot.destino = 0;
        const d = naveAdentro(i, t, T, M);
        if (!d) {
          pintarNave(
            i,
            t,
            { x: 0, y: 0, s: 0, a: 0 },
            { x: 1, y: 0 },
            { estira: 0, llama: 1 },
            hablan,
            null,
          );
          continue;
        }
        const e = esquive(d, cercanasA);
        const pos = { x: d.x + e.x * d.suelta, y: d.y + e.y * d.suelta };
        // El rumbo sale de la pose del guion, no de la pintada: con el balanceo y los muelles
        // adentro, una nave quieta en la ronda se inclinaba 30° por respirar.
        anterior0[i] = pos;
        const rumbo = { x: pos.x - prev.x + (d.mira > 0 ? 0.5 : -0.5), y: (pos.y - prev.y) * 0.6 };
        pintarNave(
          i,
          t,
          { ...pos, s: d.s, a: d.a },
          rumbo,
          { estira: 0, llama: 0.7 + d.suelta * 0.3, mira: d.mira },
          hablan,
          masCercana(pos),
        );
        // La bola que pasa rozando es un golpe: el grito tiene causa.
        if (b && Math.hypot(b.x - pos.x, b.y - pos.y) < 170) {
          unaVez(`roce-${i}`, () => impacto(b.x, b.y, 1, 400, i));
        }
        if (t >= M.frena) unaVez(`frena-${i}`, () => (n.m.sq.v = Math.min(n.m.sq.v + 4, 6.5)));
      }
    }
    const ex = exploradora(t, T, M);
    const extras = exploradora(t - 60, T, M);
    pintarNave(
      3,
      t,
      { x: ex.x, y: ex.y, s: 0.9, a: ex.a },
      { x: ex.x - ex.vaiven - (extras.x - extras.vaiven), y: ex.y - extras.y },
      { estira: 0, llama: 1.2 },
      hablan,
      null,
    );
    // El viento de la vuelta de la exploradora sacude a las demás.
    if (t >= (M.vuelta.t0 + M.vuelta.t1) / 2) unaVez('rafaga', () => impacto(ex.x, ex.y, 0.9, 520));
    M.tirones.forEach((tt, k) => {
      if (t >= tt) {
        unaVez(`tiron-naves-${k}`, () =>
          flota.slice(0, 3).forEach((n) => {
            const dx = CX - n.pos.x,
              dy = CY - n.pos.y,
              d = Math.hypot(dx, dy) || 1;
            n.m.dx.v += (dx / d) * (240 + k * 120);
            n.m.dy.v += (dy / d) * (240 + k * 120);
            n.m.sq.v = Math.min(n.m.sq.v - 2, 6.5);
          }),
        );
      }
    });

    // La bola del grito, con su estela: sin estela se lee grande, no rápida.
    if (b) {
      const q = (t - M.bala.t0) / (M.bala.t1 - M.bala.t0);
      const atras = bala(Math.max(M.bala.t0, t - 160), M) ?? b;
      fijar(balaG, { opacity: r2(clamp01(q / 0.08) * clamp01((1 - q) / 0.1)) });
      fijar(estela, { x1: r2(atras.x), y1: r2(atras.y), x2: r2(b.x), y2: r2(b.y) });
      fijar(estelaBala, { x1: r2(atras.x), y1: r2(atras.y), x2: r2(b.x), y2: r2(b.y) });
      fijar(balaBola, { transform: `translate(${r2(b.x)} ${r2(b.y)}) rotate(${r2(t * 0.4)})` });
    } else fijar(balaG, { opacity: 0 });

    moverCamara(dtS);
    for (const m of [angieEscala, angieHabla]) avanzarMuelle(m, dtS);
    pintarAngie(t);
    pintarAudio(t, claro);

    if (tituloEl) tituloEl.style.opacity = r2(clamp01((t - (T.fin - 2600)) / 1400));
    raiz.classList.toggle('prologo--claro', claro > 0.55);
    raiz.classList.toggle('prologo--saliendo', t >= T.fin - 200);
  }

  /* ── tocar la escena ──────────────────────────────────────────────────────────────────────── */

  const alTocar = (e: PointerEvent): void => {
    if (terminado || pausado || raiz.hidden) return;
    const p = aEscena(e.clientX, e.clientY);
    const enPantalla = { x: e.clientX - encuadre.x0, y: e.clientY - encuadre.y0 };
    const blanco = (e.target as Element | null)?.closest?.('[data-nave]');
    if (blanco) {
      const i = Number(blanco.getAttribute('data-nave'));
      const n = flota[i];
      const lado = p.x >= n.pos.x ? 1 : -1;
      // Arriba golpea más que abajo; el lado decide hacia dónde se tuerce.
      const arriba = p.y < n.pos.y ? 1.3 : 0.8;
      n.m.rot.v -= lado * 220 * arriba;
      n.m.dy.v += p.y < n.pos.y ? 160 : -160;
      n.m.sq.v = Math.min(n.m.sq.v + 5 * arriba, 6.5);
      n.m.antena.v += lado * 260;
      n.paciencia += 1;
      const dice =
        n.paciencia > 4
          ? HARTA[Math.floor(n.paciencia) % HARTA.length]
          : QUEJAS[(Math.floor(n.paciencia * 7) + i) % QUEJAS.length];
      palabra(raiz, enPantalla.x, enPantalla.y - 10, dice);
      chispas(raiz, enPantalla.x, enPantalla.y, PALETAS[i].luz, 6);
      pip(520 + i * 70, 0.18, 'triangle', 0.06, 880 + i * 60);
      return;
    }
    // El cielo también responde: chispas del color de lo que hay, y las naves cerca miran ahí.
    const t = tAhora;
    const color = claridad(t, T) > 0.5 ? '#d9852a' : adentro(t, T) > 0.5 ? '#f6b562' : '#e6ecff';
    chispas(raiz, enPantalla.x, enPantalla.y, color, 8);
    pip(1200 + Math.random() * 400, 0.14, 'sine', 0.03);
    impacto(p.x, p.y, 0.35, 420);
    flota.forEach((n) => {
      if (Math.hypot(n.pos.x - p.x, n.pos.y - p.y) < 700) n.curiosidad = { p, hasta: t + 900 };
    });
  };

  /* ── reloj de reproducción ────────────────────────────────────────────────────────────────── */

  /** Timers del acorde final y de soltar la red de audio: el único async del motor. */
  const timers = new Set<number>();
  const luego = (fn: () => void, ms: number): void => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  let anterior: number | null = null;
  /** Generación del loop: con dos loops vivos el delta de cada uno daba casi cero. */
  let generacion = 0;
  const VELOCIDADES = [1, 1.5, 2, 3];
  let velocidad = 1;
  let raf = 0;
  let tAhora = 0;

  /** Los puntos de retomar con su instante, y el próximo que todavía no se avisó. */
  const puntos = PUNTOS_DEL_PROLOGO.flatMap((id) => {
    const linea = reloj.find((l) => l.id === id);
    return linea ? [{ id, t0: linea.t0 }] : [];
  });
  let siguientePunto = 0;
  let pausado = false;

  /** Dónde espera la historia al minijuego: con la orden ya leída y antes de la ráfaga. */
  const ESPERA_OPERADORES = M.rxjs - 100;
  let operadores: 'antes' | 'jugando' | 'despues' = opts.operadores ? 'antes' : 'despues';

  /** Dónde espera la historia al manual: al final de la orden, antes del tercer tirón. */
  const ESPERA_MANUAL = M.manual - 150;
  let manual: 'antes' | 'leyendo' | 'despues' = opts.manual ? 'antes' : 'despues';

  /** Dónde espera la historia al árbol: con "Miren el árbol." ya leída. */
  const ESPERA_ARBOL = M.arbol - 150;
  let arbol: 'antes' | 'mirando' | 'despues' = opts.arbol ? 'antes' : 'despues';

  /**
   * Con movimiento reducido la cinemática no corre, pero lo que se juega en ella sí: terminarla
   * salteaba el minijuego, el manual y el árbol, que son la Introducción. El reloj salta de parada
   * en parada (`saltoQuieto`) con la escena quieta y, cerrada la última, el prólogo termina.
   */
  let quieto = false;
  const paradasPendientes = (): number[] => [
    ...(operadores === 'despues' ? [] : [ESPERA_OPERADORES]),
    ...(manual === 'despues' ? [] : [ESPERA_MANUAL]),
    ...(arbol === 'despues' ? [] : [ESPERA_ARBOL]),
  ];

  /**
   * El manual y el árbol son la pantalla de la nave y tapan la escena entera. Dibujarla igual, cuadro
   * a cuadro, era trabajo que nadie veía durante todo lo que se tarda en leer. Un aviso que llega
   * tarde, con la pantalla ya cerrada, no tapa nada.
   */
  let tapada = false;
  function tapar(tapa: boolean): void {
    const ahora = tapa && (manual === 'leyendo' || arbol === 'mirando');
    if (ahora === tapada) return;
    tapada = ahora;
    if (!tapada && !terminado && !pausado) retomar();
  }
  /**
   * El zumbido se va de a poco con el manual abierto (`pintarAudio`): frenar antes lo dejaba sonando.
   * Con el árbol no se va, pero con la historia quieta tampoco cambia, y sigue sonando sin cuadros.
   */
  const enReposo = (): boolean => tapada && (!red || zumbidoLibre === metaDelZumbido());

  function pedirArbol(): void {
    arbol = 'mirando';
    void opts.arbol?.(ARBOL_DE_SIGNAL_SPACE, tapar).then(() => {
      arbol = 'despues';
      tapar(false);
    });
  }

  function pedirManual(): void {
    manual = 'leyendo';
    void opts.manual?.(PAGINAS_DEL_MANUAL, tapar).then(() => {
      manual = 'despues';
      tapar(false);
    });
  }

  function pedirOperadores(): void {
    operadores = 'jugando';
    void opts.operadores?.(HUECOS_DEL_PROLOGO, arreglado).then(() => {
      operadores = 'despues';
    });
  }

  /**
   * Un hueco sano se ve en la nave: dispara su operador como los de la ráfaga, con el mismo
   * retroceso, y el disparo se apaga antes de llegar. El tirón contesta enseguida con un golpe:
   * anda, pero la anomalía es más rápida. Va con su propio reloj porque la historia está quieta.
   */
  function arreglado(i: number, operador: string): void {
    const n = flota[i];
    if (!n || terminado) return;
    const base = el(efectos, 'g', { transform: `translate(${r2(n.pos.x)} ${r2(n.pos.y)})` });
    const bala = el(base, 'g');
    el(bala, 'circle', { r: 26, fill: 'url(#pa-proyectil)' });
    el(bala, 'circle', { r: 7, fill: '#ffffff' });
    const escala = letraConPiso(ROTULO_ACIERTO, PISO_ACIERTO_PX, encuadre.k) / ROTULO_ACIERTO;
    const rotulo = el(bala, 'text', {
      x: r2(22 * escala),
      y: r2(-20 * escala),
      'font-family': '"JetBrains Mono","Cascadia Mono",Consolas,monospace',
      'font-size': r2(ROTULO_ACIERTO * escala),
      'font-weight': 700,
      fill: PALETAS[i].luz,
      stroke: '#0b1630',
      'stroke-width': r2(5 * escala),
      'paint-order': 'stroke',
    });
    rotulo.textContent = operador;
    const quitar = (): void => base.remove();
    if (quieto) {
      // El nombre aparece y se apaga al lado de la nave, sin viajar ni sacudir a nadie.
      fijar(bala, { transform: 'translate(150 -6)' });
      bala
        .animate(
          [
            { opacity: 0 },
            { opacity: 1, offset: 0.15 },
            { opacity: 1, offset: 0.8 },
            { opacity: 0 },
          ],
          {
            duration: 1500,
          },
        )
        .finished.then(quitar, quitar);
      return;
    }
    bala
      .animate(
        [
          { transform: 'translate(70px, 0) scale(0.6)', opacity: 0 },
          { transform: 'translate(150px, -6px) scale(1)', opacity: 1, offset: 0.18 },
          { transform: 'translate(330px, -14px) scale(1)', opacity: 1, offset: 0.7 },
          { transform: 'translate(400px, -18px) scale(0.5)', opacity: 0 },
        ],
        { duration: 1500, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' },
      )
      .finished.then(quitar, quitar);
    const p = aPantalla(n.pos);
    chispas(raiz, p.x, p.y, PALETAS[i].luz, 10);
    n.m.dx.v -= 260;
    n.m.sq.v = Math.min(n.m.sq.v + 2.5, 6.5);
    // Sin sonido de disparo: solo sonaría al acertar, y acertar es en silencio (ADR 0002).
    luego(() => impacto(n.pos.x, n.pos.y, 0.6, 700), 420);
  }

  function frame(ts: number, gen: number): void {
    if (gen !== generacion) return;
    // Tope de 80 ms: si la pestaña estuvo oculta, rAF vuelve con un salto enorme.
    const dt = anterior === null ? 0 : Math.min(80, ts - anterior);
    anterior = ts;
    let t = quieto
      ? saltoQuieto(tAhora, paradasPendientes(), T.fin)
      : Math.min(tAhora + dt * velocidad, T.fin);
    // Mientras se juega, la historia no avanza pero los muelles sí: las naves tiemblan y responden.
    if (operadores !== 'despues' && t >= ESPERA_OPERADORES) {
      t = ESPERA_OPERADORES;
      if (operadores === 'antes') pedirOperadores();
    }
    if (manual !== 'despues' && t >= ESPERA_MANUAL) {
      t = ESPERA_MANUAL;
      if (manual === 'antes') pedirManual();
    }
    if (arbol !== 'despues' && t >= ESPERA_ARBOL) {
      t = ESPERA_ARBOL;
      if (arbol === 'antes') pedirArbol();
    }
    tAhora = t;
    // El índice avanza afuera de la llamada: con `?.` y sin quien escuche, el argumento no se
    // evalúa, el índice no se mueve y el bucle no termina nunca.
    while (siguientePunto < puntos.length && puntos[siguientePunto].t0 <= tAhora) {
      const punto = puntos[siguientePunto];
      siguientePunto += 1;
      opts.alPasarPunto?.(punto.id);
    }
    // Quieto, los muelles no avanzan: una nave que toma la palabra no se sacude.
    dibujar(tAhora, quieto ? 0 : (dt * velocidad) / 1000);
    if (tAhora >= T.fin) terminar();
    // Tapada no se pide otro cuadro, y Angie tampoco se mueve sola: el cuadro que retoma la despierta.
    else if (enReposo()) dormirAngie();
    else raf = requestAnimationFrame((t) => frame(t, gen));
  }

  function dormirAngie(): void {
    if (!angieViva) return;
    angieViva = false;
    opts.alCambiarMascota?.(false);
  }

  function retomar(): void {
    cancelAnimationFrame(raf);
    anterior = null;
    // El fundido del zumbido mide el tiempo entre cuadros: la espera contaba entera, y volvía de golpe.
    zumbidoEn = red?.master.context.currentTime ?? null;
    const gen = ++generacion;
    raf = requestAnimationFrame((ts) => frame(ts, gen));
  }

  const reducido = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function arrancar(desde: number): void {
    cancelAnimationFrame(raf);
    // Va ANTES de destapar: destapar y terminar en el mismo turno dejaba el velo puesto sobre una
    // escena terminada, con los botones muertos y la app bloqueada.
    quieto = reducido();
    if (terminado || (quieto && saltoQuieto(desde, paradasPendientes(), T.fin) === T.fin)) {
      terminar();
      return;
    }
    mostrar();
    medir();
    dichas = new Set();
    anterior0 = flota.map(() => ({ x: 0, y: 0 }));
    tAhora = desde;
    // Quien arranca más adelante no tiene que pasar por el minijuego. Un punto guardado arranca
    // antes de su espera, así que el minijuego, el manual o el árbol sin terminar se vuelven a abrir.
    if (desde > ESPERA_OPERADORES) operadores = 'despues';
    if (desde > ESPERA_MANUAL) manual = 'despues';
    if (desde > ESPERA_ARBOL) arbol = 'despues';
    siguientePunto = puntos.findIndex((p) => p.t0 > desde);
    if (siguientePunto < 0) siguientePunto = puntos.length;
    despausar();
    if (sonido().activo()) sonido().desbloquear();
    anterior = null;
    const gen = ++generacion;
    raf = requestAnimationFrame((ts) => frame(ts, gen));
  }

  /** Hermanos del prólogo: el recorrido que quedó debajo del velo. */
  const detras = (): HTMLElement[] =>
    [...(raiz.parentElement?.children ?? [])].filter(
      (x): x is HTMLElement => x instanceof HTMLElement && !x.contains(raiz),
    );

  function mostrar(): void {
    raiz.hidden = false;
    detras().forEach((x) => (x.inert = true));
  }

  function ocultar(): void {
    raiz.hidden = true;
    detras().forEach((x) => (x.inert = false));
  }

  const CIERRE_AUDIO_MS = 2500;
  function terminar(): void {
    if (terminado) return;
    terminado = true;
    cancelAnimationFrame(raf);
    dormirAngie();
    sonido().callar();
    if (red) red.zumbidoGain.gain.value = 0;
    luego(soltarAudio, CIERRE_AUDIO_MS);
    ocultar();
    opts.alTerminar();
  }

  /* ── controles: saltar, pausar, un solo interruptor de sonido, velocidad y pantalla ───────── */

  function despausar(): void {
    pausado = false;
    nombrar(btnPausa, 'Pausa');
    btnPausa.setAttribute('aria-pressed', 'false');
  }

  function alternarPausa(): void {
    if (terminado) return;
    if (pausado) {
      despausar();
      retomar();
      return;
    }
    pausado = true;
    nombrar(btnPausa, 'Continuar');
    btnPausa.setAttribute('aria-pressed', 'true');
    cancelAnimationFrame(raf);
    // En pausa Angie tampoco se mueve sola: la escena entera se congela.
    dormirAngie();
    sonido().callar();
    if (red) red.zumbidoGain.gain.value = 0;
  }

  const TECLAS_DE_DESPLAZAMIENTO = new Set([
    'ArrowUp',
    'ArrowDown',
    'PageUp',
    'PageDown',
    'Home',
    'End',
  ]);

  /** El manual de a bordo scrollea por dentro: ahí las teclas, la rueda y el dedo lo mueven a él. */
  const manualDe = (t: EventTarget | null): HTMLElement | null =>
    t instanceof Element ? t.closest<HTMLElement>('.prologo__manual') : null;

  const alTeclado = (e: KeyboardEvent): void => {
    // En `document`: colgado del contenedor no se dispara nunca, el foco jamás está ahí.
    if (terminado || raiz.hidden) return;
    // Las teclas del manual las atiende la vista, que lo muestra (`pasoEnElManual`). Un botón que se
    // rehace al tocarlo deja el foco en el `body`: con el manual abierto, sigue siendo del manual.
    // Leyendo el manual el espacio no pausa: la historia ya está esperando.
    if (
      manualDe(e.target) ??
      (e.target === document.body && raiz.querySelector('.prologo__manual'))
    ) {
      return;
    }
    // El recorrido de atrás escucha las flechas en `window` y el `inert` no alcanza a su scroller.
    if (TECLAS_DE_DESPLAZAMIENTO.has(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.code !== 'Space' || (e.target as HTMLElement | null)?.closest('button')) return;
    e.preventDefault();
    alternarPausa();
  };

  /**
   * Lo que scrollea por dentro del prólogo: el manual y la hoja del minijuego, que en un celular no
   * entra. Con la hoja afuera de la lista, ni el dedo ni la rueda la bajaban y el botón de probar
   * quedaba fuera de la vista: solo se podía saltar.
   */
  const scrollerDe = (t: EventTarget | null): HTMLElement | null =>
    t instanceof Element ? t.closest<HTMLElement>('.prologo__manual, .prologo__operadores') : null;

  const alDesplazar = (e: Event): void => {
    if (terminado || raiz.hidden) return;
    // Adentro la rueda y el dedo scrollean esa hoja, y no siguen hasta lo que hay detrás.
    if (scrollerDe(e.target)) e.stopPropagation();
    else e.preventDefault();
  };

  /** Con la pestaña oculta el rAF se frena, pero el zumbido y la voz no: se pausa como un botón. */
  let pausaDelSistema = false;
  const alCambiarVisibilidad = (): void => {
    if (terminado || raiz.hidden) return;
    if (document.hidden && !pausado) {
      pausaDelSistema = true;
      alternarPausa();
    } else if (!document.hidden && pausaDelSistema) {
      pausaDelSistema = false;
      if (pausado) alternarPausa();
    }
  };

  const alSaltar = (): void => terminar();
  const alPausar = (): void => alternarPausa();
  const pintarVelocidad = (): void => {
    if (btnVelocidad) btnVelocidad.textContent = `Velocidad ×${velocidad}`;
  };
  const alCambiarVelocidad = (): void => {
    velocidad = VELOCIDADES[(VELOCIDADES.indexOf(velocidad) + 1) % VELOCIDADES.length];
    pintarVelocidad();
    // La línea que suena se agendó para la ventana a la velocidad vieja.
    sonido().callar();
  };

  const pintarPantalla = (): void => {
    const activa = document.fullscreenElement === raiz;
    nombrar(btnPantalla, activa ? 'Salir de pantalla completa' : 'Pantalla completa');
    btnPantalla.setAttribute('aria-pressed', String(activa));
  };
  /** Rechazar la pantalla completa (iframe, política) no es motivo para romper la reproducción. */
  const alCambiarPantalla = (): void => {
    if (document.fullscreenElement === raiz) void document.exitFullscreen().catch(() => undefined);
    else void raiz.requestFullscreen().catch(() => undefined);
  };

  /**
   * El único interruptor: la preferencia GLOBAL del director. Apagado calla todo, voces incluidas,
   * y vale también para la intro y las cinemáticas.
   */
  const pintarSonido = (): void => {
    const activo = sonido().activo();
    nombrar(btnSonido, activo ? 'Sonido: sí' : 'Sonido: no');
    btnSonido.setAttribute('aria-pressed', String(activo));
  };
  const alCambiarSonido = (): void => {
    if (sonido().alternar()) sonido().desbloquear();
    else sonido().callar();
  };
  const dejarDeOirSonido = sonido().alCambiar(() => {
    pintarSonido();
    // Tapada no hay cuadros, y el zumbido se arma en un cuadro: prender el sonido pide uno.
    if (tapada && !pausado && !terminado) retomar();
  });

  skipEl?.addEventListener('click', alSaltar);
  btnPausa.addEventListener('click', alPausar);
  btnSonido.addEventListener('click', alCambiarSonido);
  btnPantalla.addEventListener('click', alCambiarPantalla);
  btnVelocidad?.addEventListener('click', alCambiarVelocidad);
  svg.addEventListener('pointerdown', alTocar);
  document.addEventListener('fullscreenchange', pintarPantalla);
  document.addEventListener('keydown', alTeclado);
  document.addEventListener('visibilitychange', alCambiarVisibilidad);
  const mqlReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const alReducirMovimiento = (e: MediaQueryListEvent): void => {
    quieto = e.matches;
  };
  mqlReduce.addEventListener('change', alReducirMovimiento);
  raiz.addEventListener('wheel', alDesplazar, { passive: false });
  raiz.addEventListener('touchmove', alDesplazar, { passive: false });

  pintarSonido();
  pintarPantalla();
  pintarVelocidad();
  const desde = opts.desde ? reloj.find((l) => l.id === opts.desde)?.t0 : undefined;
  arrancar(desde === undefined ? 0 : Math.max(0, desde - 300));

  return () => {
    cancelAnimationFrame(raf);
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    // Terminado ya se calló: callar de nuevo cortaría las voces de lo que venga después.
    if (!terminado) sonido().callar();
    if (angieViva) opts.alCambiarMascota?.(false);
    soltarAudio();
    dejarDeOirSonido();
    observador?.disconnect();
    skipEl?.removeEventListener('click', alSaltar);
    btnPausa.removeEventListener('click', alPausar);
    btnSonido.removeEventListener('click', alCambiarSonido);
    btnPantalla.removeEventListener('click', alCambiarPantalla);
    btnVelocidad?.removeEventListener('click', alCambiarVelocidad);
    svg.removeEventListener('pointerdown', alTocar);
    document.removeEventListener('fullscreenchange', pintarPantalla);
    if (document.fullscreenElement === raiz) void document.exitFullscreen().catch(() => undefined);
    document.removeEventListener('keydown', alTeclado);
    document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    mqlReduce.removeEventListener('change', alReducirMovimiento);
    raiz.removeEventListener('wheel', alDesplazar);
    raiz.removeEventListener('touchmove', alDesplazar);
  };
}
