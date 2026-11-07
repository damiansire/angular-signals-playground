import { emitirImpacto, sinMovimiento } from '../libs/muelle';
import { chispas, onda } from '../libs/rastros';

/**
 * Pantalla de inicio: una mañana en la colina, con Angie esperando. Al entrar se desarma en sus
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
  idea: 240,
  anticipar: 380,
  dispersar: 900,
  flotar: 650,
  aLuz: 320,
  escalon: 95,
  subir: 1500,
  absorber: 280,
  destello: 800,
};

const COLORES_DE_LUZ = ['#ff5fa8', '#ffc65c', '#ffffff', '#ff8ac9'];

export interface InicioAngie {
  /** Angie se desarma en luz y el cielo se hace noche. Resuelve cuando se puede pasar al prólogo. */
  despedir(): Promise<void>;
  dispose(): void;
}

/**
 * Le da vida a la escena ya pintada: tocar el cielo o la colina deja su rastro y sacude a Angie
 * (vía `emitirImpacto`, el mismo golpe que usa todo el recorrido), y `despedir` corre la salida.
 */
export function initInicioAngie(host: HTMLElement): InicioAngie {
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
      animar(p, [{ opacity: 1 }, { opacity: 0, scale: '0.4' }], {
        duration: T.aLuz,
        delay: retraso,
        easing: 'ease-in',
      });
      const color = COLORES_DE_LUZ[i % COLORES_DE_LUZ.length];
      return subirLuz(desde, destino, color, retraso).then(() => {
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

  /** Una pieza hecha luz: una cabeza brillante con su estela, que arranca lenta y se mete en el sol. */
  function subirLuz(desde: Punto, hasta: Punto, color: string, retraso: number): Promise<void> {
    const luz = crear('ini__luz');
    luz.style.setProperty('--luz', color);
    const e = estela(desde, hasta);
    luz.style.left = `${desde.x}px`;
    luz.style.top = `${desde.y}px`;
    luces!.appendChild(luz);
    const giro = `rotate(${e.angulo}deg)`;
    return animar(
      luz,
      [
        { opacity: 0, transform: `${giro} translateY(0) scaleY(0.2)` },
        { opacity: 1, transform: `${giro} translateY(-10px) scaleY(0.5)`, offset: 0.18 },
        {
          opacity: 1,
          transform: `${giro} translateY(${-e.largo * 0.92}px) scaleY(1.3)`,
          offset: 0.9,
        },
        { opacity: 0, transform: `${giro} translateY(${-e.largo}px) scaleY(0.3)` },
      ],
      { duration: T.subir, delay: retraso, easing: 'cubic-bezier(0.5, 0, 0.7, 0.4)' },
    );
  }

  return {
    despedir,
    dispose(): void {
      cerrado = true;
      escena.removeEventListener('pointerdown', alTocar);
      escena.removeEventListener('click', alClic);
      animaciones.forEach((a) => a.cancel());
      animaciones.clear();
      luces?.replaceChildren();
    },
  };
}
