import { aperturaPara, zancada } from '../components-draw/mascota-viva/caminar';
import { emitirImpacto, limitar, motorDeMuelles, sinMovimiento } from '../libs/muelle';
import { chispas, onda } from '../libs/rastros';

/**
 * Pantalla de inicio: una mañana en la colina. Angie camina hasta el borde y se sienta a mirar a lo
 * lejos, y espera ahí. Al entrar se desarma en sus
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

/**
 * Dónde se sienta Angie, en unidades del dibujo a la derecha del centro: el borde de la meseta,
 * justo donde la colina empieza a caer. Más afuera la ladera pasa de 20° y sentada se resbalaría.
 */
export const ASIENTO = 380;

/**
 * Adónde llega de verdad. `libre` es lo que deja el borde de la pantalla: en una angosta, donde ella
 * ocupa casi todo el ancho, se sienta casi donde está.
 */
export function asientoEnLaColina(libre: number): number {
  return limitar(libre, 0, ASIENTO);
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

/** Fracción del paseo que se va en arrancar, y otra igual en frenar. */
const RAMPA = 0.2;

/**
 * Cuánto del camino lleva hecho en la fracción `p` del tiempo: acelera, va parejo y frena. Con
 * velocidad pareja de punta a punta arrancaba y frenaba en seco, como un muñeco sobre un riel.
 */
export function avanceDelPaseo(p: number): number {
  const t = limitar(p, 0, 1);
  const escala = 1 - RAMPA;
  if (t < RAMPA) return (0.5 * t * t) / RAMPA / escala;
  if (t > 1 - RAMPA) return 1 - (0.5 * (1 - t) * (1 - t)) / RAMPA / escala;
  return (t - RAMPA / 2) / escala;
}

/**
 * Cuántos pasos da para recorrer `distancia` con una zancada de `largo` (las dos en la misma unidad).
 * Siempre un número entero: arranca y termina con las piernas juntas, nunca a mitad de un paso.
 */
export function pasosDelPaseo(distancia: number, largo: number): number {
  return Math.max(1, Math.round(distancia / Math.max(largo, 1e-6)));
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
  antesDeMirar: 700,
  antesDeCaminar: 1200,
  antesDeSentarse: 380,
  idea: 240,
  pensar: 1900,
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

/** Pasos por segundo a velocidad de crucero: un paseo, no un trámite. */
const CADENCIA = 1.6;
/** Cuánto de la pendiente acompaña su cuerpo: caminando apenas, sentada se acomoda a la ladera. */
const INCLINA_CAMINANDO = 0.25;
const INCLINA_SENTADA = 0.45;

const COLORES_DE_LUZ = ['#ff5fa8', '#ffc65c', '#ffffff', '#ff8ac9'];

export interface InicioAngie {
  /** Angie se desarma en luz y el cielo se hace noche. Resuelve cuando se puede pasar al prólogo. */
  despedir(): Promise<void>;
  dispose(): void;
}

/** Lo que la escena le pide al cuerpo de Angie. La escena la lleva; el paso y la pose son de ella. */
export interface AngieDeLaColina {
  caminar(fase: number, apertura?: number): void;
  sentarse(): void;
  pararse(): void;
}

/**
 * Le da vida a la escena ya pintada: Angie camina hasta el borde y se sienta, tocar el cielo o la
 * colina deja su rastro y la sacude (vía `emitirImpacto`, el mismo golpe que usa todo el recorrido),
 * y `despedir` corre la salida.
 */
export function initInicioAngie(host: HTMLElement, cuerpo?: AngieDeLaColina): InicioAngie {
  const encontrada = host.querySelector<HTMLElement>('.tusi__overlay');
  // Igual que la landing: sin escena, que se note acá y no como un Entrar que no hace nada.
  if (!encontrada) throw new Error('inicio-angie: falta .tusi__overlay en el host');
  const escena: HTMLElement = encontrada;
  const angie = escena.querySelector<HTMLElement>('.ini__angie');
  const luces = escena.querySelector<HTMLElement>('.ini__luces');
  const animaciones = new Set<Animation>();
  let cerrado = false;
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
    if (e.button !== 0 || escena.classList.contains('ini--saliendo')) return;
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

  // Al llegar, Angie mira hacia el borde y camina despacio hasta sentarse donde la colina empieza a
  // caer. Va con `translate`/`rotate` sueltos porque la despedida anima el `transform` de este mismo
  // elemento.
  const motor = motorDeMuelles();
  const temporizadores = new Set<ReturnType<typeof setTimeout>>();
  const luego = (ms: number, fn: () => void): void => {
    const id = setTimeout(() => {
      temporizadores.delete(id);
      fn();
    }, ms);
    temporizadores.add(id);
  };
  const unidad = (): number =>
    Math.max(escena.clientWidth / ANCHO, escena.clientHeight / ALTO) || 1;
  /** Una unidad del dibujo de Angie (1080 de lado), en unidades del paisaje. */
  const deAngie = (): number => (angie ? angie.offsetWidth / 1080 / unidad() : 1);
  const asiento = (): number =>
    angie ? asientoEnLaColina(((escena.clientWidth - angie.offsetWidth) / 2 - 24) / unidad()) : 0;
  const ubicar = (x: number, inclinar: number): void => {
    if (!angie) return;
    const u = unidad();
    angie.style.translate = `${(x * u).toFixed(1)}px ${(caidaDeLaColina(x) * u).toFixed(1)}px`;
    const inclina = `${(pendienteDeLaColina(x) * inclinar).toFixed(2)}deg`;
    angie.style.rotate = inclina;
    // La nube del pensamiento la desinclina: un texto torcido se leía como un error.
    angie.style.setProperty('--inclina', inclina);
  };

  let paseo: { t: number; dura: number; hasta: number; pasos: number; apertura: number } | null =
    null;
  let sentada = false;
  const sentarse = (x: number): void => {
    paseo = null;
    sentada = true;
    ubicar(x, INCLINA_SENTADA);
    escena.classList.add('ini--sentada');
    cuerpo?.sentarse();
  };
  const pasear = (dt: number): boolean => {
    if (!paseo) return false;
    // Con la pausa de la vida de fondo, lo que tiene fin salta a su final.
    if (escena.closest('.fondo-en-pausa')) {
      sentarse(paseo.hasta);
      return false;
    }
    // Una pestaña que vuelve trae un cuadro de segundos: el paseo no puede saltar de golpe.
    paseo.t += Math.min(dt, 0.05);
    const p = paseo.t / paseo.dura;
    const x = paseo.hasta * avanceDelPaseo(p);
    ubicar(x, INCLINA_CAMINANDO);
    cuerpo?.caminar(0.5 + paseo.pasos * (x / paseo.hasta), paseo.apertura);
    if (p < 1) return true;
    // Llega con las piernas juntas, se queda un instante y recién ahí se sienta.
    const hasta = paseo.hasta;
    paseo = null;
    luego(T.antesDeSentarse, () => sentarse(hasta));
    return false;
  };
  const sacarPaseo = motor.agregar(pasear);
  const arrancar = (): void => {
    if (!angie || cerrado || escena.classList.contains('ini--saliendo')) return;
    const hasta = asiento();
    // La zancada del dibujo, pasada al paisaje: el pie apoyado barre justo lo que avanza el cuerpo.
    const largo = zancada() * deAngie();
    // Sin movimiento, en pausa, sin la landing a la vista o sin lugar para un paso: ya sentada.
    const quieta =
      sinMovimiento() ||
      escena.closest('.fondo-en-pausa') !== null ||
      escena.classList.contains('gone') ||
      hasta < largo;
    if (quieta) {
      sentarse(hasta);
      return;
    }
    const pasos = pasosDelPaseo(hasta, largo);
    paseo = {
      t: 0,
      dura: pasos / CADENCIA / (1 - RAMPA),
      hasta,
      pasos,
      apertura: aperturaPara(hasta / pasos / deAngie()),
    };
    motor.despertar();
  };
  // Primero gira la cabeza hacia el borde y después arranca: decide adónde va antes de ir.
  luego(T.antesDeMirar, () => {
    if (!cerrado && !escena.classList.contains('ini--saliendo')) cuerpo?.caminar(0.5);
  });
  luego(T.antesDeCaminar, arrancar);
  // Al cambiar el tamaño, el asiento en píxeles ya no corresponde: queda sentada en el nuevo.
  const alRedimensionar = (): void => {
    if (escena.classList.contains('ini--saliendo') || (!paseo && !sentada)) return;
    sentarse(asiento());
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

  async function despedir(): Promise<void> {
    escena.classList.add('ini--saliendo');
    // Si la tocan en camino, se queda donde está, parada: la idea le llega ahí.
    temporizadores.forEach(clearTimeout);
    temporizadores.clear();
    if (!sentada) {
      paseo = null;
      cuerpo?.pararse();
    }
    if (sinMovimiento() || !angie || !luces) return;

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
    // La luz se vuelve dorada antes de que caiga la noche: un día que se apaga de golpe no es un
    // atardecer, es un corte. Arranca con el pensamiento: "es la hora" es la de este atardecer.
    escena.classList.add('ini--atardecer', 'ini--piensa');
    await esperar(T.pensar);
    if (cerrado) return;
    escena.classList.remove('ini--piensa');
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

    const piezas = [...angie.querySelectorAll<SVGGraphicsElement>('[data-pieza]')];
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
  function subirLuz(desde: Punto, hasta: Punto, color: string, retraso: number): Promise<void> {
    const luz = crear('ini__luz');
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
    despedir,
    dispose(): void {
      cerrado = true;
      escena.removeEventListener('pointerdown', alTocar);
      escena.removeEventListener('click', alClic);
      window.removeEventListener('resize', alRedimensionar);
      temporizadores.forEach(clearTimeout);
      temporizadores.clear();
      sacarPaseo();
      animaciones.forEach((a) => a.cancel());
      animaciones.clear();
      luces?.replaceChildren();
    },
  };
}
