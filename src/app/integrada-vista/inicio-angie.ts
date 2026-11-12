import { emitirImpacto, sinMovimiento } from '../libs/muelle';
import { chispas, onda } from '../libs/rastros';
import { sonido, type Voz } from '../libs/sonido';
import { LO_QUE_DICE_EL_SOL, LO_QUE_RESPONDE_ANGIE } from './intercambio-del-sol';
import { LO_QUE_DECIDE, LO_QUE_PRESIENTE } from './pensamientos-de-la-colina';
import {
  HASTA_LA_NOCHE,
  SOSTENIDO,
  planDeFase,
  planDelFondo,
  tocarPresentimiento,
  type FaseDelPresentimiento,
  type Musica,
} from './musica-del-presentimiento';
import { tocarColina } from './musica-de-la-colina';
import { VOCES_GRABADAS, type VozGrabada } from './voces-grabadas';
import { planDeLaRadio, sonidoDeOnda, tocarOnda, tocarRadio } from './ruido-de-radio';
import { queHaceElToque } from './toque-de-dialogo';

/**
 * Pantalla de inicio: una mañana en la colina. Angie está sentada en la piedra del centro, mirando
 * a lo lejos, y espera ahí. Al entrar se desarma en sus
 * piezas, cada pieza se vuelve una estela de luz que sube, y el cielo se apaga en el universo donde
 * empieza el prólogo. Es la costura entre la landing clara y el prólogo oscuro: sin ella, el corte
 * de día a noche era un fundido sin motivo.
 *
 * El paisaje (colina, pasto, juncos, estrellas) sale de funciones con semilla: la escena se ve igual
 * en cada visita y el template la pinta con `@for`, sin `Math.random`.
 */

/** El dibujo del paisaje mide esto (`viewBox`), anclado abajo: el piso nunca se recorta. */
export const ANCHO = 1920;
export const ALTO = 1080;
/** Dónde pisa Angie: el centro de la colina. El CSS usa el mismo número para pararla ahí. */
export const CIMA_Y = 790;

export interface Punto {
  readonly x: number;
  readonly y: number;
}

/** Pseudoazar con semilla (mulberry32): mismo número, misma escena. */
export function azar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** El borde de la colina del medio: una loma ancha con la cima plana justo donde va Angie. */
export function alturaDeColina(x: number): number {
  const d = (x - ANCHO / 2) / 820;
  // Meseta en el centro (d⁴ casi no sube cerca de 0) y caída suave hacia los costados.
  return CIMA_Y + 210 * Math.min(d * d * d * d * 3 + d * d * 0.5, 1.4) + 14 * Math.sin(x / 140);
}

/** El contorno de la colina como `path`, de borde a borde y cerrado por abajo. */
export function caminoDeColina(alto = alturaDeColina, paso = 40): string {
  const puntos: string[] = [];
  for (let x = -40; x <= ANCHO + 40; x += paso) puntos.push(`${x} ${alto(x).toFixed(1)}`);
  return `M${puntos.join(' L')} L${ANCHO + 40} ${ALTO} L-40 ${ALTO} Z`;
}

export interface Mata {
  /** El `d` de la mata, ya ubicado sobre la colina. */
  readonly d: string;
  readonly tono: string;
}

/**
 * Matas de pasto sobre el borde de la colina: tres o cuatro hojas curvas que nacen del piso. Se
 * saltean el centro, porque ahí pisa Angie y el pasto le taparía los pies.
 */
export function matasDePasto(semilla: number, cantidad: number, alto = alturaDeColina): Mata[] {
  const r = azar(semilla);
  const tonos = ['#3f8f74', '#4f9f80', '#5aab89', '#2f7d64'];
  const matas: Mata[] = [];
  while (matas.length < cantidad) {
    const x = r() * ANCHO;
    if (Math.abs(x - ANCHO / 2) < 150) continue;
    const y = alto(x) + 6;
    const hojas = 3 + Math.floor(r() * 2);
    let d = '';
    for (let h = 0; h < hojas; h++) {
      const largo = 26 + r() * 30;
      const inclina = (h - (hojas - 1) / 2) * 9 + (r() - 0.5) * 8;
      const px = x + (h - (hojas - 1) / 2) * 4;
      d +=
        `M${n(px - 3)} ${n(y)} Q${n(px + inclina * 0.4)} ${n(y - largo * 0.6)} ` +
        `${n(px + inclina)} ${n(y - largo)} Q${n(px + inclina * 0.3 + 3)} ${n(y - largo * 0.5)} ` +
        `${n(px + 3)} ${n(y)} Z `;
    }
    matas.push({ d: d.trim(), tono: tonos[Math.floor(r() * tonos.length)] });
  }
  return matas;
}

export interface Flor {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly color: string;
}

/** Flores sueltas en la ladera, por debajo del borde: el pasto lejano no es una franja lisa. */
export function floresDeLadera(semilla: number, cantidad: number, alto = alturaDeColina): Flor[] {
  const r = azar(semilla);
  const colores = ['#ffffff', '#ffd27a', '#ff8fb8', '#f6f0ff'];
  return Array.from({ length: cantidad }, () => {
    const x = 60 + r() * (ANCHO - 120);
    return {
      x: Math.round(x),
      y: Math.round(alto(x) + 30 + r() * 120),
      r: Math.round((3 + r() * 4) * 10) / 10,
      color: colores[Math.floor(r() * colores.length)],
    };
  });
}

export interface Junco {
  readonly d: string;
  readonly ancho: number;
}

/** Juncos del primer plano, en un costado: enmarcan la escena y son lo que mueve el viento. */
export function juncos(semilla: number, cantidad: number, lado: 1 | -1): Junco[] {
  const r = azar(semilla);
  const borde = lado === -1 ? 0 : ANCHO;
  return Array.from({ length: cantidad }, () => {
    const x = borde - lado * (r() * 300);
    const alto = 180 + r() * 260;
    const curva = -lado * (40 + r() * 70);
    return {
      d: `M${n(x)} ${ALTO + 10} Q${n(x + curva * 0.3)} ${n(ALTO - alto * 0.6)} ${n(x + curva)} ${n(ALTO - alto)}`,
      ancho: Math.round((5 + r() * 7) * 10) / 10,
    };
  });
}

/** Cuánto baja el piso a `dx` del centro: lo que hay que bajarla para que siga pisando la colina. */
export function caidaDeLaColina(dx: number, alto = alturaDeColina): number {
  return alto(ANCHO / 2 + dx) - alto(ANCHO / 2);
}

/** La pendiente del piso a `dx` del centro, en grados (positivo: baja hacia la derecha). */
export function pendienteDeLaColina(dx: number, alto = alturaDeColina): number {
  const x = ANCHO / 2 + dx;
  return (Math.atan((alto(x + 4) - alto(x - 4)) / 8) * 180) / Math.PI;
}

export interface Estrella {
  /** Posición en % del ancho y del alto: la noche cubre la pantalla entera, sin recorte. */
  readonly x: number;
  readonly y: number;
  readonly tam: number;
  /** Retraso del titileo, para que no prendan todas a la vez. */
  readonly retraso: number;
}

export function estrellas(semilla: number, cantidad: number): Estrella[] {
  const r = azar(semilla);
  return Array.from({ length: cantidad }, () => ({
    x: Math.round(r() * 1000) / 10,
    y: Math.round(r() * 780) / 10,
    tam: Math.round((1 + r() * 2.2) * 10) / 10,
    retraso: Math.round(r() * 2400),
  }));
}

/** Una letra del título, con su lugar en todo el título: entran de a una, de punta a punta. */
export interface LetraDelTitulo {
  readonly c: string;
  readonly i: number;
}

export interface PalabraDelTitulo {
  readonly texto: string;
  readonly letras: readonly LetraDelTitulo[];
  /** La palabra que va en el color de Angie. */
  readonly acento: boolean;
}

/**
 * Los renglones del título en palabras y letras. La cuenta sigue de un renglón al otro: el segundo
 * empieza a entrar cuando termina el primero, no a la vez. Las palabras no se parten al bajar.
 */
export function letrasDelTitulo(
  renglones: readonly string[],
  acentos: ReadonlySet<string> = new Set(),
): PalabraDelTitulo[][] {
  let i = 0;
  return renglones.map((renglon) =>
    renglon
      .split(' ')
      .filter(Boolean)
      .map((palabra) => ({
        texto: palabra,
        letras: [...palabra].map((c) => ({ c, i: i++ })),
        acento: acentos.has(palabra),
      })),
  );
}

/**
 * Lo que tarda cada letra de un globo en aparecer, en ms: los globos se escriben de a una letra,
 * como los diálogos de un RPG. El CSS lo toma de acá (`--tecla`) y la espera de cada globo también.
 */
export const TECLA_MS = 38;

/** Un globo escrito de a una letra: sus renglones en palabras y letras, y cuántas letras tiene. */
export interface Dicho {
  readonly renglones: PalabraDelTitulo[][];
  readonly letras: number;
}

/** `\n` corta el renglón. La cuenta de letras sigue de un renglón al otro, como en el título. */
export function letrasDelDicho(texto: string): Dicho {
  const renglones = letrasDelTitulo(texto.split('\n'));
  const letras = renglones.flat().reduce((n, p) => n + p.letras.length, 0);
  return { renglones, letras };
}

/**
 * Lo mínimo que un globo se queda antes de aceptar el toque: lo que tarda en escribirse y un respiro
 * para leer el final. Nunca menos que `piso`, el mínimo de antes, pensado para un globo corto.
 */
export function loQueTardaEnEscribirse(texto: string, piso: number): number {
  return Math.max(piso, letrasDelDicho(texto).letras * TECLA_MS + 500);
}

/**
 * La charla del sol es la del prólogo, palabra por palabra (`intercambio-del-sol.ts`): suena con
 * las mismas voces grabadas de las dos líneas del prólogo que la dicen. Los pensamientos tienen las
 * suyas, del grupo `colina`.
 */
const VOZ_DE_LA_COLINA: Readonly<Record<string, string>> = {
  [LO_QUE_DICE_EL_SOL]: 'dentro-caotico',
  [LO_QUE_RESPONDE_ANGIE]: 'voz-supongo',
  [LO_QUE_PRESIENTE]: 'colina-presiente',
  [LO_QUE_DECIDE]: 'colina-decide',
};

export function vozDeLaColina(texto: string): VozGrabada | undefined {
  const id = VOZ_DE_LA_COLINA[texto];
  return id ? VOCES_GRABADAS[id] : undefined;
}

/** Un globo hablado espera también a que termine su voz, si es más larga que lo que se escribe. */
export function loQueDuraDicho(texto: string, piso: number): number {
  return Math.max(loQueTardaEnEscribirse(texto, piso), (vozDeLaColina(texto)?.ms ?? 0) + 400);
}

export interface RayoDelSol {
  /** En grados, desde arriba y en el sentido del reloj. */
  readonly angulo: number;
  /** Uno largo y uno corto: todos iguales se leían como un engranaje. */
  readonly corto: boolean;
}

/** Los rayos del sol, parejos alrededor, alternando largos y cortos. */
export function rayosDelSol(cantidad = 12): RayoDelSol[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    angulo: (360 / cantidad) * i,
    corto: i % 2 === 1,
  }));
}

export interface Dispersion {
  readonly dx: number;
  readonly dy: number;
  readonly giro: number;
}

/**
 * Para dónde sale despedida cada pieza al desarmarse: lejos del centro de Angie, un poco hacia arriba
 * (el viaje sigue hacia el cielo) y con un giro. En píxeles de pantalla, a escala del `alcance` (el
 * ancho de Angie): en un celular ocupa casi todo el ancho y un salto fijo la sacaba de la pantalla.
 */
export function dispersion(
  centro: Punto,
  pieza: Punto,
  indice: number,
  alcance: number,
): Dispersion {
  const r = azar(indice * 977 + 13);
  let ax = pieza.x - centro.x;
  let ay = pieza.y - centro.y;
  const largo = Math.hypot(ax, ay);
  // Una pieza justo en el centro no tiene "afuera": se le inventa uno, siempre hacia arriba.
  if (largo < 1) {
    ax = r() - 0.5;
    ay = -1;
  }
  const d = Math.hypot(ax, ay);
  // Bien lejos: el desarme es el momento de la transición y con saltos cortos las piezas quedaban
  // pegadas, se leía como Angie rota y no como Angie abriéndose.
  const fuerza = alcance * (0.3 + r() * 0.2);
  return {
    dx: Math.round((ax / d) * fuerza),
    dy: Math.round((ay / d) * fuerza - alcance * (0.08 + r() * 0.08)),
    giro: Math.round((r() - 0.5) * 160),
  };
}

export interface Estela {
  /** Hacia dónde apunta la estela, en grados (0 = hacia arriba). */
  readonly angulo: number;
  readonly largo: number;
}

/** La estela de luz de cada pieza: mira hacia el punto del cielo donde convergen todas. */
export function estela(desde: Punto, hasta: Punto): Estela {
  const dx = hasta.x - desde.x;
  const dy = hasta.y - desde.y;
  return {
    angulo: Math.round((Math.atan2(dx, -dy) * 180) / Math.PI),
    largo: Math.round(Math.hypot(dx, dy)),
  };
}

function entre(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

function n(valor: number): string {
  return valor.toFixed(1);
}

// ─── En pantalla ───────────────────────────────────────────────────────────────────────────────

/**
 * Tiempos de la despedida, en ms. El golpe que la abre es rápido; lo que sigue (quedar suspendida,
 * volverse luz, que caiga la noche) es lento a propósito: es la transición y tiene que verse.
 */
const T = {
  idea: 240,
  /** La radio sola, antes del primer pensamiento: el toque prende una radio, no un diálogo. */
  sintonizar: 1100,
  /**
   * Lo mínimo de cada globo (la voz del sol, la respuesta de Angie y sus dos pensamientos): lo que
   * tarda en entrar y leerse. Después espera el toque de quien mira.
   */
  oir: 1100,
  responder: 1500,
  /** El globo de la respuesta condensándose en la luz que sube al sol. */
  hacerseLuz: 380,
  presentir: 1200,
  pensar: 1000,
  decidir: 220,
  anticipar: 380,
  dispersar: 900,
  flotar: 650,
  cargar: 260,
  condensar: 200,
  nacer: 340,
  escalon: 95,
  subir: 1500,
  absorber: 280,
  destello: 800,
};

/** Cuánto de la pendiente acompaña su cuerpo: sentada se acomoda a la ladera. */
const INCLINA_SENTADA = 0.45;

const COLORES_DE_LUZ = ['#ff5fa8', '#ffc65c', '#ffffff', '#ff8ac9'];

export interface InicioAngie {
  /**
   * La colina aparece (el aviso se fue): entra el título de a poco y suena su música, que sigue
   * hasta que se toca para entrar.
   */
  revelar(): void;
  /** Angie se desarma en luz y el cielo se hace noche. Resuelve cuando se puede pasar al prólogo. */
  despedir(): Promise<void>;
  dispose(): void;
}

/** Lo que la escena le pide al cuerpo de Angie. La escena la lleva; el paso y la pose son de ella. */
export interface AngieDeLaColina {
  /** `deUna`: ya sentada, sin la bajada. */
  sentarse(deUna?: boolean): void;
  /** Sonríe: la cara de quien ya decidió. */
  sonreir?(): void;
}

/**
 * Le da vida a la escena ya pintada: Angie sentada en la piedra del centro, tocar el
 * cielo o la colina deja su rastro y la sacude (vía `emitirImpacto`, el mismo golpe que usa todo el
 * recorrido), y `despedir` corre la salida.
 */
export function initInicioAngie(host: HTMLElement, cuerpo?: AngieDeLaColina): InicioAngie {
  const encontrada = host.querySelector<HTMLElement>('.tusi__overlay');
  // Igual que la landing: sin escena, que se note acá y no como un Entrar que no hace nada.
  if (!encontrada) throw new Error('inicio-angie: falta .tusi__overlay en el host');
  const escena: HTMLElement = encontrada;
  const angie = escena.querySelector<HTMLElement>('.ini__angie');
  const piedra = escena.querySelector<HTMLElement>('.ini__piedra');
  const luces = escena.querySelector<HTMLElement>('.ini__luces');
  const dicho = escena.querySelector<HTMLElement>('.ini__dicho');
  const animaciones = new Set<Animation>();
  let cerrado = false;
  /** Ya tocaron para entrar: la escena deja de responder a los toques de entrar. */
  let yendose = false;
  let musica: Musica | null = null;
  let colina: Musica | null = null;
  let radio: Musica | null = null;
  // Lo que se crea a mano no lleva el atributo de encapsulación de Angular: sin él, el CSS del
  // componente no lo alcanza y la luz quedaba como un span sin estilo.
  const enc = escena.getAttributeNames().find((a) => a.startsWith('_ngcontent'));
  const crear = (clase: string): HTMLSpanElement => {
    const el = document.createElement('span');
    el.className = clase;
    if (enc) el.setAttribute(enc, '');
    return el;
  };

  /** Dónde arrancó el último toque: un arrastre de Angie que termina en otro lado no es entrar. */
  let desde: Punto | null = null;
  const alTocar = (e: PointerEvent): void => {
    if (e.button !== 0 || yendose) return;
    desde = { x: e.clientX, y: e.clientY };
    const material = (e.target as Element | null)?.closest<SVGElement>('[data-material]')?.dataset[
      'material'
    ];
    if (!material) return;
    const r = escena.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (material === 'pasto') {
      onda(escena, x, y, 'rgba(47, 125, 100, 0.55)', 120);
      chispas(escena, x, y, '#5aab89', 6);
    } else {
      chispas(escena, x, y, '#ffc65c', 7);
    }
    emitirImpacto(escena, { x: e.clientX, y: e.clientY, fuerza: material === 'pasto' ? 0.5 : 0.3 });
  };
  escena.addEventListener('pointerdown', alTocar);

  // Se entra tocando en cualquier lugar: buscar un botón chico en la escena era tarea. El toque pasa
  // por la lamparita (la entrada con nombre, a la que llega Tab), así hay un solo camino para entrar.
  const entrada = escena.querySelector<HTMLElement>('[data-role="entrar"]');
  const alClic = (e: MouseEvent): void => {
    const tocado = e.target as Element | null;
    if (!entrada || !desde || tocado?.closest('button, a, label, input')) return;
    const arrastre = Math.hypot(e.clientX - desde.x, e.clientY - desde.y) > 8;
    desde = null;
    if (!arrastre) entrada.click();
  };
  escena.addEventListener('click', alClic);

  // Mientras la bajada y el llamado van entrando no se puede entrar: un toque a mitad cortaba la
  // portada antes de terminar de leerla. Se frena en captura, antes del listener de la lamparita.
  let listo = false;
  const alLlegar = (e: AnimationEvent): void => {
    if ((e.target as Element | null)?.classList?.contains('ini__llamado')) listo = true;
  };
  const frenarEntrada = (e: MouseEvent): void => {
    if (listo || !(e.target as Element | null)?.closest('[data-role="entrar"], .ini__llamado')) {
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  // Suena con el anillo y no con un reloj aparte: así va pegado al dibujo aunque la pestaña se pause.
  const alSalirUnaOnda = (e: AnimationEvent): void => {
    if (e.animationName.includes('interferencia')) return;
    if (!(e.target as Element | null)?.parentElement?.classList.contains('ini__radio')) return;
    const limpia = escena.classList.contains('ini--oye');
    if (!limpia && !escena.classList.contains('ini--radio')) return;
    const salida = sonido().salida();
    if (salida) tocarOnda(salida, sonidoDeOnda(limpia));
  };
  escena.addEventListener('animationend', alLlegar);
  escena.addEventListener('animationstart', alSalirUnaOnda);
  escena.addEventListener('animationiteration', alSalirUnaOnda);
  escena.addEventListener('click', frenarEntrada, true);

  // Angie ya está sentada en la piedra del centro cuando se la ve: el aviso de auriculares se aleja
  // y la escena aparece con ella ahí. Va con `translate`/`rotate` sueltos porque la despedida anima
  // el `transform` de este mismo elemento.
  const unidad = (): number =>
    Math.max(escena.clientWidth / ANCHO, escena.clientHeight / ALTO) || 1;
  const ubicarEn = (el: HTMLElement, x: number, inclinar: number): string => {
    const u = unidad();
    const grados = pendienteDeLaColina(x) * inclinar;
    el.style.translate = `${(x * u).toFixed(1)}px ${(caidaDeLaColina(x) * u).toFixed(1)}px`;
    const inclina = `${grados.toFixed(2)}deg`;
    el.style.rotate = inclina;
    return inclina;
  };
  const ubicar = (): void => {
    if (piedra) ubicarEn(piedra, 0, INCLINA_SENTADA);
    if (!angie) return;
    // La nube del pensamiento la desinclina: un texto torcido se leía como un error.
    angie.style.setProperty('--inclina', ubicarEn(angie, 0, INCLINA_SENTADA));
  };
  ubicar();
  escena.classList.add('ini--sentada');
  cuerpo?.sentarse(true);
  // Un cambio de tamaño cambia cuánto mide la colina en píxeles: se reacomoda en la piedra.
  const alRedimensionar = (): void => {
    if (!escena.classList.contains('ini--saliendo')) ubicar();
  };
  window.addEventListener('resize', alRedimensionar);

  const animar = (
    el: Element,
    cuadros: Keyframe[],
    opciones: KeyframeAnimationOptions,
  ): Promise<void> => {
    const a = el.animate(cuadros, { fill: 'forwards', ...opciones });
    animaciones.add(a);
    return a.finished.then(
      () => undefined,
      () => undefined,
    );
  };
  const esperar = (ms: number): Promise<void> => new Promise((ok) => setTimeout(ok, ms));

  /**
   * Un globo que se escribe y espera que lo pasen: los pensamientos los pasa la persona, no un
   * reloj. A medio escribir, el toque lo termina de escribir (`ini--escrito`); escrito, lo pasa
   * (`queHaceElToque`). `ms` es lo que tarda en escribirse solo. El teclado va en `document`: el
   * foco nunca está en la escena.
   */
  let soltarToque: (() => void) | null = null;
  const pensamiento = (ms: number): Promise<void> =>
    new Promise((ok) => {
      const empezo = performance.now();
      let completadoEn: number | null = null;
      const listo = (): void => {
        escena.removeEventListener('click', alClicDeAvance);
        document.removeEventListener('keydown', alTecla);
        soltarToque = null;
        // En el mismo cuadro que el globo que se va: sus letras vuelven a esperar a que se encoja.
        escena.classList.remove('ini--escrito');
        ok();
      };
      const tocar = (): void => {
        const ahora = performance.now() - empezo;
        const hace = queHaceElToque(ahora, ms, completadoEn);
        if (hace === 'pasar') listo();
        if (hace !== 'completar') return;
        completadoEn = ahora;
        escena.classList.add('ini--escrito');
        // Los blips duraban lo que tardaba en escribirse: seguían hablando sobre el globo ya escrito.
        sonido().callar();
      };
      // Sonido y pausa hacen lo suyo: no pasan el pensamiento.
      const alClicDeAvance = (e: MouseEvent): void => {
        if (!(e.target as Element | null)?.closest('.ini__ajustes')) tocar();
      };
      const alTecla = (e: KeyboardEvent): void => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        tocar();
      };
      escena.addEventListener('click', alClicDeAvance);
      document.addEventListener('keydown', alTecla);
      soltarToque = listo;
    });

  /** Cada globo se le dice también a quien escucha la pantalla: el dibujo está oculto. */
  const contar = (texto: string): void => {
    if (dicho) dicho.textContent = texto.replace(/\n/g, ' ');
  };
  /**
   * Un globo hablado: lo cuenta y suena con los blips de quien lo dice, como en el prólogo. Los
   * blips duran lo que tarda en escribirse: suena mientras aparece.
   */
  const decir = (quien: Voz, texto: string): void => {
    contar(texto);
    const voz = vozDeLaColina(texto);
    const escribir = letrasDelDicho(texto).letras * TECLA_MS;
    sonido().hablar(
      quien,
      texto.replace(/\n/g, ' '),
      Math.max(escribir, voz?.ms ?? 0),
      voz?.archivo,
    );
  };

  /**
   * Un pensamiento suena solo con su voz grabada: sin ella queda callado, como antes. Unos blips
   * dirían que habla en voz alta.
   */
  const pensar = (texto: string): void => {
    contar(`${texto}…`);
    sonido().decirGrabada(vozDeLaColina(texto)?.archivo ?? null);
  };

  /**
   * La respuesta no se apaga donde la dijo: se vuelve luz y sube al sol, que es de donde vino la
   * voz. Así se lee como un mensaje que se manda. El globo entero volando se veía raro: un cartel
   * que cruza el cielo. Hecho luz es el mismo idioma de la despedida, que todavía no llegó.
   */
  const enviarAlSol = async (): Promise<void> => {
    const globo = escena.querySelector<HTMLElement>('.ini__dice');
    const sol = escena.querySelector<HTMLElement>('.ini__sol');
    if (!globo || !sol || !luces || sinMovimiento()) return;
    const g = globo.getBoundingClientRect();
    const s = sol.getBoundingClientRect();
    const o = escena.getBoundingClientRect();
    const desde = { x: g.left + g.width / 2 - o.left, y: g.top + g.height / 2 - o.top };
    const hasta = { x: s.left + s.width / 2 - o.left, y: s.top + s.height / 2 - o.top };
    // El globo se condensa en su centro mientras se carga de luz; del punto nace la luz.
    animar(
      globo,
      [
        { transformOrigin: '50% 50%', transform: 'scale(1)', filter: 'brightness(1)', opacity: 1 },
        {
          transformOrigin: '50% 50%',
          transform: 'scale(0.04)',
          filter: 'brightness(2.2) drop-shadow(0 0 18px #ff8ac9)',
          opacity: 0,
        },
      ],
      { duration: T.hacerseLuz, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
    );
    await subirLuz(desde, hasta, '#ff8ac9', T.hacerseLuz * 0.55, 'ini__luz--mensaje');
    if (cerrado) return;
    // El sol la recibe: late, y queda una onda donde llegó.
    animar(sol, [{ scale: '1' }, { scale: '1.18' }, { scale: '1' }], {
      duration: T.absorber * 1.4,
      easing: 'ease-out',
      fill: 'none',
    });
    onda(escena, hasta.x, hasta.y, 'rgba(255, 210, 110, 0.75)', s.width * 1.6);
    chispas(escena, hasta.x, hasta.y, '#ffc65c', 8);
  };

  /** Lo que suena: el fondo sigue, y cada momento trae su fase y apaga la anterior. */
  let fase: Musica | null = null;
  const sonar = (cual: FaseDelPresentimiento): void => {
    const salida = sonido().salida();
    fase?.apagar();
    fase = salida ? tocarPresentimiento(salida, planDeFase(cual)) : null;
    if (cual === 'luz') musica?.apagar(HASTA_LA_NOCHE);
  };

  async function despedir(): Promise<void> {
    if (yendose) return;
    yendose = true;
    escena.classList.add('ini--saliendo');
    // La de la colina se va mientras entra la de la despedida: las dos en re, se funden.
    colina?.apagar(2.4);
    colina = null;
    if (sinMovimiento() || !angie || !luces) return;
    // El toque abrió el audio: la música acompaña desde los pensamientos hasta que cae la noche.
    const salida = sonido().salida();
    if (salida) musica = tocarPresentimiento(salida, planDelFondo(SOSTENIDO));

    // Primero se ve la idea prenderse (el CSS la enciende con `ini--saliendo`): es la causa, toque
    // donde toque.
    const foco = escena.querySelector<HTMLElement>('.ini__foco');
    if (foco) {
      const r = escena.getBoundingClientRect();
      const b = foco.getBoundingClientRect();
      const x = b.left + b.width / 2 - r.left;
      const y = b.top + b.height * 0.42 - r.top;
      onda(escena, x, y, 'rgba(255, 200, 90, 0.7)', b.width * 2.4);
      chispas(escena, x, y, '#ffc65c', 12);
    }
    await esperar(T.idea);
    if (cerrado) return;
    // Primero se cruza una radio: estática y ondas que salen del sol, una señal que todavía no se
    // entiende. Ella la oye antes que nadie y lo presiente.
    escena.classList.add('ini--radio');
    // Las voces de la colina se bajan mientras suena la radio: llegan a tiempo.
    sonido().precargar(
      [LO_QUE_PRESIENTE, LO_QUE_DICE_EL_SOL, LO_QUE_RESPONDE_ANGIE, LO_QUE_DECIDE].flatMap(
        (t) => vozDeLaColina(t)?.archivo ?? [],
      ),
    );
    const salidaDeRadio = sonido().salida();
    radio = salidaDeRadio ? tocarRadio(salidaDeRadio, planDeLaRadio()) : null;
    await esperar(T.sintonizar);
    if (cerrado) return;
    escena.classList.add('ini--piensa');
    sonar('presiente');
    pensar(LO_QUE_PRESIENTE);
    await pensamiento(loQueDuraDicho(LO_QUE_PRESIENTE, T.presentir));
    if (cerrado) return;
    // La señal entra: la estática se va y la voz del sol llega limpia. Es la charla que la
    // tripulación tiene en la cabina, oída del otro lado: suena con la voz del capitán.
    escena.classList.remove('ini--piensa');
    escena.classList.replace('ini--radio', 'ini--oye');
    radio?.apagar(0.5);
    radio = null;
    decir('cap', LO_QUE_DICE_EL_SOL);
    await pensamiento(loQueDuraDicho(LO_QUE_DICE_EL_SOL, T.oir));
    if (cerrado) return;
    escena.classList.replace('ini--oye', 'ini--responde');
    decir('mascota', LO_QUE_RESPONDE_ANGIE);
    await pensamiento(loQueDuraDicho(LO_QUE_RESPONDE_ANGIE, T.responder));
    if (cerrado) return;
    await enviarAlSol();
    if (cerrado) return;
    escena.classList.remove('ini--responde');
    // La luz se vuelve dorada antes de que caiga la noche: un día que se apaga de golpe no es un
    // atardecer, es un corte. Arranca con la decisión: "la hora" que llegó es la de este atardecer,
    // y la dice sonriendo.
    escena.classList.add('ini--atardecer', 'ini--piensa', 'ini--piensa-2');
    cuerpo?.sonreir?.();
    sonar('decide');
    pensar(LO_QUE_DECIDE);
    await pensamiento(loQueDuraDicho(LO_QUE_DECIDE, T.pensar));
    if (cerrado) return;
    escena.classList.remove('ini--piensa', 'ini--piensa-2');
    sonar('luz');
    await esperar(T.decidir);
    if (cerrado) return;
    // Anticipación: se agacha y se estira, como quien toma impulso.
    await animar(
      angie,
      [
        { transform: 'scale(1, 1)' },
        { transform: 'scale(1.08, 0.86)', offset: 0.45 },
        { transform: 'scale(0.94, 1.1)' },
      ],
      { duration: T.anticipar, easing: 'ease-out' },
    );
    if (cerrado) return;

    // Solo las del dibujo que se ve: sentada, el cuerpo de frente está apagado y sus piezas medirían
    // cero, así que su luz nacería en la esquina de la pantalla.
    const piezas = [...angie.querySelectorAll<SVGGraphicsElement>('[data-pieza]')].filter(
      (p) => p.getBoundingClientRect().width > 0,
    );
    const caja = angie.getBoundingClientRect();
    const origen = escena.getBoundingClientRect();
    const centro = { x: caja.left + caja.width / 2, y: caja.top + caja.height * 0.55 };
    // El estallido marca el corte: sin él, separarse parecía un desarmado tranquilo.
    const cx = centro.x - origen.left;
    const cy = centro.y - origen.top;
    onda(escena, cx, cy, 'rgba(255, 255, 255, 0.8)', caja.width * 1.6);
    chispas(escena, cx, cy, '#ffffff', 12);
    // La sombra de contacto no es una pieza: sin apagarla, quedaba en el pasto como una mancha
    // cuando ella ya era luz.
    const sombra = angie.querySelector('.mv__sombra');
    if (sombra)
      animar(sombra, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' });
    // Cada pieza se mueve en las unidades de su dibujo (1080 de lado), no en píxeles de pantalla.
    const escala = 1080 / Math.max(caja.width, 1);
    const margen = 24;
    piezas.forEach((p, i) => {
      const b = p.getBoundingClientRect();
      const desde = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      const d = dispersion(centro, desde, i, caja.width);
      // En un celular Angie ocupa casi todo el ancho: el salto se recorta contra el borde.
      const dx = entre(desde.x + d.dx, origen.left + margen, origen.right - margen) - desde.x;
      const dy = entre(desde.y + d.dy, origen.top + margen, origen.bottom - margen) - desde.y;
      const t = (x: number, y: number): string => `${x * escala}px ${y * escala}px`;
      // Sale disparada, frena y queda suspendida a la deriva: ese momento quieto es donde se mira.
      animar(
        p,
        [
          { translate: '0 0', rotate: '0deg', easing: 'cubic-bezier(0.15, 0.9, 0.3, 1)' },
          {
            translate: t(dx, dy),
            rotate: `${d.giro}deg`,
            offset: T.dispersar / (T.dispersar + T.flotar),
            easing: 'ease-in-out',
          },
          { translate: t(dx * 1.08, dy * 1.08 - 10), rotate: `${d.giro * 1.15}deg` },
        ],
        { duration: T.dispersar + T.flotar },
      );
    });
    animar(angie, [{ transform: 'scale(0.94, 1.1)' }, { transform: 'scale(1, 1)' }], {
      duration: T.dispersar,
      easing: 'ease-out',
    });
    await esperar(T.dispersar);
    if (cerrado) return;
    // La noche empieza a caer mientras las piezas flotan y sigue bajando mientras suben las luces.
    escena.classList.add('ini--noche');
    await esperar(T.flotar);
    if (cerrado) return;

    // Las luces van al sol: la luz de la escena sale de ahí y vuelve ahí.
    const sol = escena.querySelector<HTMLElement>('.ini__sol');
    const cajaSol = sol?.getBoundingClientRect();
    const destino = cajaSol
      ? {
          x: cajaSol.left + cajaSol.width / 2 - origen.left,
          y: cajaSol.top + cajaSol.height / 2 - origen.top,
        }
      : { x: escena.clientWidth / 2, y: -escena.clientHeight * 0.08 };
    const subidas = piezas.map((p, i) => {
      const b = p.getBoundingClientRect();
      const desde = { x: b.left + b.width / 2 - origen.left, y: b.top + b.height / 2 - origen.top };
      const retraso = i * T.escalon;
      const color = COLORES_DE_LUZ[i % COLORES_DE_LUZ.length];
      // La pieza se carga de luz y se condensa en un punto, y de ese punto nace la luz. Antes se
      // apagaba y al lado aparecía una estela ya hecha: se leían como dos cosas distintas.
      const brillo = `brightness(1.9) drop-shadow(0 0 30px ${color})`;
      animar(
        p,
        [
          { opacity: 1, scale: '1', filter: 'brightness(1)', easing: 'ease-out' },
          {
            opacity: 1,
            scale: '1.12',
            filter: brillo,
            offset: T.cargar / (T.cargar + T.condensar),
            easing: 'ease-in',
          },
          { opacity: 0, scale: '0.08', filter: brillo },
        ],
        { duration: T.cargar + T.condensar, delay: retraso, fill: 'both' },
      );
      return subirLuz(desde, destino, color, retraso + T.cargar).then(() => {
        // Cada luz que llega lo hace latir: se ve que la recibe.
        if (sol && !cerrado)
          animar(sol, [{ scale: '1' }, { scale: '1.14' }, { scale: '1' }], {
            duration: T.absorber,
            easing: 'ease-out',
            fill: 'none',
          });
      });
    });
    await Promise.all(subidas);
    if (cerrado) return;

    // El negro final del prólogo entra detrás del destello: así no se ve un fundido, se ve la luz.
    escena.classList.add('ini--oscuro');
    const destello = crear('ini__destello');
    destello.style.left = `${destino.x}px`;
    destello.style.top = `${destino.y}px`;
    luces.appendChild(destello);
    if (sol) animar(sol, [{ opacity: 1 }, { opacity: 0 }], { duration: T.destello });
    await animar(
      destello,
      [
        { opacity: 0, transform: 'translate(-50%, -50%) scale(0.2)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.3 },
        { opacity: 0, transform: 'translate(-50%, -50%) scale(1.6)' },
      ],
      { duration: T.destello, easing: 'ease-out' },
    );
  }

  /**
   * Una pieza hecha luz. Nace como un núcleo que se enciende donde se condensó la pieza, respira un
   * instante y recién ahí arranca: la estela crece con la velocidad, así que no existe antes del
   * viaje. Núcleo y estela van separados para que estirar la estela no aplaste el núcleo.
   */
  function subirLuz(
    desde: Punto,
    hasta: Punto,
    color: string,
    retraso: number,
    clase = '',
  ): Promise<void> {
    const luz = crear(`ini__luz ${clase}`.trim());
    const cola = crear('ini__cola');
    const nucleo = crear('ini__nucleo');
    luz.append(cola, nucleo);
    luz.style.setProperty('--luz', color);
    const e = estela(desde, hasta);
    luz.style.left = `${desde.x}px`;
    luz.style.top = `${desde.y}px`;
    luces!.appendChild(luz);
    const giro = `rotate(${e.angulo}deg)`;
    const total = T.nacer + T.subir;
    const nace = T.nacer / total;
    const acelera = 'cubic-bezier(0.5, 0, 0.7, 0.4)';
    // `both`: mientras espera su turno ya está en el primer cuadro (apagada). Con `forwards` se veía
    // entera, sin girar, como una raya colgando de la pieza antes de que la pieza se convirtiera.
    const tiempo: KeyframeAnimationOptions = { duration: total, delay: retraso, fill: 'both' };
    animar(
      nucleo,
      [
        { scale: '0', easing: 'ease-out' },
        { scale: '1.7', offset: nace * 0.45, easing: 'ease-in-out' },
        { scale: '1', offset: nace },
        { scale: '1' },
      ],
      tiempo,
    );
    animar(
      cola,
      [
        { scale: '1 0' },
        { scale: '1 0', offset: nace, easing: acelera },
        { scale: '1 1.3', offset: 0.92 },
        { scale: '1 0.3' },
      ],
      tiempo,
    );
    return animar(
      luz,
      [
        { opacity: 0, transform: `${giro} translateY(0)`, easing: 'ease-out' },
        { opacity: 1, transform: `${giro} translateY(0)`, offset: nace * 0.3 },
        { opacity: 1, transform: `${giro} translateY(-6px)`, offset: nace, easing: acelera },
        { opacity: 1, transform: `${giro} translateY(${-e.largo * 0.92}px)`, offset: 0.92 },
        { opacity: 0, transform: `${giro} translateY(${-e.largo}px)` },
      ],
      tiempo,
    );
  }

  return {
    revelar(): void {
      if (cerrado || yendose || colina) return;
      escena.classList.add('ini--revelada');
      // Sin movimiento el llamado ya está a la vista: no hay animación que esperar.
      if (sinMovimiento()) listo = true;
      colina = tocarColina(() => sonido().salida());
    },
    despedir,
    dispose(): void {
      cerrado = true;
      colina?.apagar();
      musica?.apagar();
      fase?.apagar();
      radio?.apagar(0.2);
      soltarToque?.();
      escena.removeEventListener('pointerdown', alTocar);
      escena.removeEventListener('click', alClic);
      escena.removeEventListener('animationend', alLlegar);
      escena.removeEventListener('animationstart', alSalirUnaOnda);
      escena.removeEventListener('animationiteration', alSalirUnaOnda);
      escena.removeEventListener('click', frenarEntrada, true);
      window.removeEventListener('resize', alRedimensionar);
      animaciones.forEach((a) => a.cancel());
      animaciones.clear();
      luces?.replaceChildren();
    },
  };
}
