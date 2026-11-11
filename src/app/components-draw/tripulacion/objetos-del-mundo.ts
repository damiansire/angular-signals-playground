import { gsap } from 'gsap';
import { sinMovimiento } from '../../libs/muelle';
import { TINTA, el } from './nave-del-prologo';

/**
 * El objeto de mundo de cada etapa del viaje, el mismo que nombra la etapa: la caja que avisa, la
 * molécula punteada, la baliza… Se dibuja centrado en el (0, 0) del grupo que le dan, en unas
 * 220 × 200 unidades, y reacciona cuando la tripulación resuelve algo. Es lo que dice dónde están sin
 * leer el título (la regla de las aperturas, M1 en `docs/historia/pendientes.md`).
 */
export interface ObjetoDelMundo {
  /** Algo pasó en la etapa: el objeto lo cuenta a su manera. */
  reaccionar(fuerza?: number): void;
  apagar(): void;
}

const PAPEL = '#fbf8ef';
const SOMBRA = 'rgba(25,8,40,.16)';

interface Lienzo {
  readonly g: SVGGElement;
  readonly defs: SVGDefsElement;
  readonly id: string;
  readonly acento: string;
}

type Dibujo = (l: Lienzo) => (fuerza: number) => void;

/** Un rebote con aplaste, desde la base: el gesto común de todo objeto que se entera. */
function rebote(g: Element, fuerza: number, base = '0 60'): void {
  gsap
    .timeline()
    .to(g, {
      scaleY: 1 - 0.12 * fuerza,
      scaleX: 1 + 0.08 * fuerza,
      svgOrigin: base,
      duration: 0.08,
    })
    .to(g, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1.1, 0.4)' });
}

/** Anillos que se abren desde un punto y se apagan. */
function anillos(g: SVGGElement, x: number, y: number, color: string, n = 2): void {
  for (let k = 0; k < n; k++) {
    const c = el(g, 'circle', {
      cx: x,
      cy: y,
      r: 10,
      fill: 'none',
      stroke: color,
      'stroke-width': 4,
      'pointer-events': 'none',
    });
    gsap.to(c, {
      attr: { r: 70 + k * 18 },
      opacity: 0,
      'stroke-width': 1,
      duration: 0.8,
      delay: k * 0.14,
      ease: 'power2.out',
      onComplete: () => c.remove(),
    });
  }
}

function sombra(g: SVGGElement, y: number, rx = 70): void {
  el(g, 'ellipse', { cx: 0, cy: y, rx, ry: 9, fill: SOMBRA });
}

function degradado(l: Lienzo, nombre: string, claro: string, oscuro: string): string {
  const id = `${l.id}-${nombre}`;
  const d = el(l.defs, 'linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
  el(d, 'stop', { offset: 0, 'stop-color': claro });
  el(d, 'stop', { offset: 1, 'stop-color': oscuro });
  return `url(#${id})`;
}

const trazo = { stroke: TINTA, 'stroke-width': 3, 'stroke-linejoin': 'round' } as const;

/** 1 · La caja que avisa: la caja naranja con su campanita, que suena cuando cambia. */
const caja: Dibujo = (l) => {
  sombra(l.g, 66, 64);
  const cuerpo = el(l.g, 'g');
  el(cuerpo, 'rect', {
    x: -58,
    y: -50,
    width: 116,
    height: 112,
    rx: 24,
    fill: degradado(l, 'caja', '#ffd58c', '#e98f2c'),
    ...trazo,
  });
  el(cuerpo, 'path', {
    d: 'M-40 -36C-20 -44 18 -44 38 -36',
    fill: 'none',
    stroke: '#fff',
    'stroke-opacity': 0.6,
    'stroke-width': 5,
    'stroke-linecap': 'round',
  });
  const numero = el(cuerpo, 'text', {
    x: 0,
    y: 26,
    'text-anchor': 'middle',
    'font-family': 'ui-monospace, Menlo, Consolas, monospace',
    'font-weight': 700,
    'font-size': 56,
    fill: TINTA,
  });
  numero.textContent = '0';
  const campana = el(cuerpo, 'g', { transform: 'translate(0 -52)' });
  el(campana, 'path', { d: 'M0 0V-10', stroke: TINTA, 'stroke-width': 3 });
  el(campana, 'path', {
    d: 'M-14 -10C-14 -30 14 -30 14 -10L18 -6H-18Z',
    fill: '#ffe08a',
    ...trazo,
  });
  el(campana, 'circle', { cx: 0, cy: -2, r: 3.6, fill: TINTA });
  let n = 0;
  return (f) => {
    numero.textContent = String(++n % 10);
    rebote(cuerpo, f, '0 62');
    gsap.fromTo(
      campana,
      { rotation: -22, svgOrigin: '0 -40' },
      { rotation: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.25)' },
    );
    anillos(l.g, 0, -80, l.acento);
  };
};

/** 2 · La molécula punteada: tres átomos y la suma en el medio, unidos por puntos que viajan. */
const molecula: Dibujo = (l) => {
  sombra(l.g, 80, 80);
  const enlaces = el(l.g, 'g');
  const puntos = [
    { x: -72, y: -40 },
    { x: -60, y: 50 },
    { x: 70, y: 6 },
  ];
  const lineas = puntos.slice(0, 2).map((p) =>
    el(enlaces, 'path', {
      d: `M${p.x} ${p.y}L${puntos[2].x} ${puntos[2].y}`,
      stroke: TINTA,
      'stroke-width': 3,
      'stroke-dasharray': '2 11',
      'stroke-linecap': 'round',
    }),
  );
  const atomo = (x: number, y: number, r: number, relleno: string): SVGGElement => {
    const a = el(l.g, 'g', { transform: `translate(${x} ${y})` });
    el(a, 'circle', { r, fill: relleno, ...trazo });
    el(a, 'circle', { cx: -r * 0.35, cy: -r * 0.35, r: r * 0.25, fill: '#fff', opacity: 0.6 });
    return a;
  };
  const fuentes = puntos.slice(0, 2).map((p) => atomo(p.x, p.y, 22, '#ffc56e'));
  const suma = atomo(puntos[2].x, puntos[2].y, 34, degradado(l, 'suma', '#a7ead9', '#4fb39b'));
  const signo = el(suma, 'text', {
    y: 9,
    'text-anchor': 'middle',
    'font-family': 'ui-monospace, Menlo, Consolas, monospace',
    'font-weight': 700,
    'font-size': 28,
    fill: TINTA,
  });
  signo.textContent = '+';
  return (f) => {
    gsap.fromTo(lineas, { strokeDashoffset: 0 }, { strokeDashoffset: -39, duration: 0.6 });
    for (const [k, a] of fuentes.entries())
      rebote(a, f * 0.8, `${puntos[k].x} ${puntos[k].y + 20}`);
    gsap
      .timeline({ delay: 0.45 })
      .to(suma, { scale: 1.18, svgOrigin: `${puntos[2].x} ${puntos[2].y}`, duration: 0.12 })
      .to(suma, { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.35)' });
  };
};

/** 3 · La baliza: un poste con su lámpara, que gira y destella cuando algo cambia. */
const baliza: Dibujo = (l) => {
  sombra(l.g, 84, 56);
  el(l.g, 'path', { d: 'M-46 84L-30 44H30L46 84Z', fill: '#d8cfbd', ...trazo });
  el(l.g, 'rect', { x: -9, y: -30, width: 18, height: 76, fill: '#efe7d4', ...trazo });
  for (const y of [-14, 8, 30]) {
    el(l.g, 'path', { d: `M-9 ${y}L9 ${y - 10}`, stroke: '#ff5a4a', 'stroke-width': 5 });
  }
  const rayos = el(l.g, 'g', { opacity: 0.0 });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    el(rayos, 'path', {
      d: `M${Math.cos(a) * 34} ${-58 + Math.sin(a) * 34}L${Math.cos(a) * 56} ${-58 + Math.sin(a) * 56}`,
      stroke: '#ff8a5c',
      'stroke-width': 5,
      'stroke-linecap': 'round',
    });
  }
  el(l.g, 'path', {
    d: 'M-24 -36H24',
    stroke: TINTA,
    'stroke-width': 5,
    'stroke-linecap': 'round',
  });
  const lampara = el(l.g, 'circle', {
    cx: 0,
    cy: -58,
    r: 22,
    fill: degradado(l, 'lampara', '#ffb39a', '#ff5a4a'),
    ...trazo,
  });
  el(l.g, 'circle', { cx: -7, cy: -65, r: 6, fill: '#fff', opacity: 0.7 });
  return () => {
    gsap
      .timeline()
      .set(rayos, { opacity: 1, rotation: 0, svgOrigin: '0 -58' })
      .to(rayos, { rotation: 90, opacity: 0, duration: 0.7, ease: 'power2.out' });
    gsap.fromTo(
      lampara,
      { attr: { r: 28 } },
      { attr: { r: 22 }, duration: 0.4, ease: 'back.out(3)' },
    );
    anillos(l.g, 0, -58, '#ff5a4a', 1);
  };
};

/** 4 · Las coordenadas gemelas: dos tarjetas iguales y una balanza que no sabe si lo son. */
const gemelas: Dibujo = (l) => {
  sombra(l.g, 80, 90);
  const brazo = el(l.g, 'g');
  el(l.g, 'path', { d: 'M0 76V-40', stroke: TINTA, 'stroke-width': 5 });
  el(l.g, 'path', { d: 'M-26 80H26', stroke: TINTA, 'stroke-width': 6, 'stroke-linecap': 'round' });
  el(brazo, 'path', {
    d: 'M-80 -40H80',
    stroke: TINTA,
    'stroke-width': 5,
    'stroke-linecap': 'round',
  });
  for (const lado of [-1, 1]) {
    const x = lado * 72;
    el(brazo, 'path', { d: `M${x} -40V-16`, stroke: TINTA, 'stroke-width': 2.5 });
    el(brazo, 'rect', { x: x - 34, y: -16, width: 68, height: 44, rx: 8, fill: PAPEL, ...trazo });
    const t = el(brazo, 'text', {
      x,
      y: 12,
      'text-anchor': 'middle',
      'font-family': 'ui-monospace, Menlo, Consolas, monospace',
      'font-weight': 700,
      'font-size': 16,
      fill: TINTA,
    });
    t.textContent = '{3, 4}';
  }
  el(l.g, 'circle', { cx: 0, cy: -40, r: 8, fill: l.acento, ...trazo });
  return () => {
    gsap
      .timeline()
      .to(brazo, { rotation: 9, svgOrigin: '0 -40', duration: 0.18, ease: 'power2.out' })
      .to(brazo, { rotation: -6, duration: 0.24, ease: 'power2.inOut' })
      .to(brazo, { rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
  };
};

/** 5 · El mapa de rutas: un mapa plegado con la ruta propuesta, que se vuelve a trazar. */
const mapa: Dibujo = (l) => {
  sombra(l.g, 76, 96);
  const paneles = [
    'M-96 -54L-32 -66V62L-96 74Z',
    'M-32 -66L32 -54V74L-32 62Z',
    'M32 -54L96 -66V62L32 74Z',
  ];
  const tonos = ['#f3ead6', '#e8dcc1', '#f3ead6'];
  paneles.forEach((d, k) => el(l.g, 'path', { d, fill: tonos[k], ...trazo }));
  const ruta = el(l.g, 'path', {
    d: 'M-78 50C-60 0-20 30 0 -6S50 -40 70 -36',
    fill: 'none',
    stroke: l.acento,
    'stroke-width': 5,
    'stroke-linecap': 'round',
    'stroke-dasharray': '1 0',
    pathLength: 1,
  });
  el(l.g, 'path', {
    d: 'M62 -44L78 -28M78 -44L62 -28',
    stroke: '#ff5a4a',
    'stroke-width': 5,
    'stroke-linecap': 'round',
  });
  el(l.g, 'circle', { cx: -78, cy: 50, r: 7, fill: TINTA });
  return () => {
    gsap.fromTo(
      ruta,
      { attr: { 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 } },
      { attr: { 'stroke-dashoffset': 0 }, duration: 0.8, ease: 'power2.inOut' },
    );
  };
};

/** 6 · La transmisión: una parábola que apunta arriba y suelta ondas. */
const transmision: Dibujo = (l) => {
  sombra(l.g, 80, 58);
  el(l.g, 'path', { d: 'M-34 80L0 20L34 80', fill: 'none', ...trazo, 'stroke-width': 5 });
  const plato = el(l.g, 'g');
  el(plato, 'path', {
    d: 'M-64 -6C-60 40 30 52 58 10Z',
    fill: degradado(l, 'plato', '#ffffff', '#cfe3df'),
    ...trazo,
  });
  el(plato, 'path', { d: 'M-4 18L26 -34', stroke: TINTA, 'stroke-width': 3 });
  el(plato, 'circle', { cx: 28, cy: -38, r: 7, fill: l.acento, ...trazo });
  gsap.set(plato, { rotation: -14, svgOrigin: '0 20' });
  const ondas = [0, 1, 2].map((k) =>
    el(l.g, 'path', {
      d: `M${40 + k * 16} ${-62 - k * 14}A${30 + k * 18} ${30 + k * 18} 0 0 1 ${70 + k * 22} ${-30 - k * 6}`,
      fill: 'none',
      stroke: l.acento,
      'stroke-width': 4,
      'stroke-linecap': 'round',
      opacity: 0.25,
    }),
  );
  return () => {
    gsap.fromTo(ondas, { opacity: 1 }, { opacity: 0.25, duration: 0.5, stagger: 0.12 });
    gsap
      .timeline()
      .to(plato, { rotation: -22, duration: 0.12 })
      .to(plato, { rotation: -14, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
  };
};

/** 7 · El repetidor: un mástil con dos platos, uno escucha y el otro repite. */
const repetidor: Dibujo = (l) => {
  sombra(l.g, 84, 50);
  el(l.g, 'path', {
    d: 'M-22 84L0 -50L22 84M-14 30H14M-8 -10H8',
    fill: 'none',
    ...trazo,
    'stroke-width': 4,
  });
  const plato = (lado: number): SVGGElement => {
    const p = el(l.g, 'g', { transform: `translate(${lado * 30} -30)` });
    el(p, 'path', { d: `M0 -26C${lado * 26} -14 ${lado * 26} 14 0 26Z`, fill: PAPEL, ...trazo });
    return p;
  };
  plato(-1);
  plato(1);
  const flechas = [-1, 1].map((lado) =>
    el(l.g, 'path', {
      d: lado < 0 ? 'M-100 -30H-62M-74 -40L-62 -30L-74 -20' : 'M62 -30H100M88 -40L100 -30L88 -20',
      fill: 'none',
      stroke: l.acento,
      'stroke-width': 5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
  );
  el(l.g, 'circle', { cx: 0, cy: -56, r: 8, fill: l.acento, ...trazo });
  return () => {
    gsap
      .timeline()
      .fromTo(flechas[0], { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.28 })
      .fromTo(flechas[1], { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.28 });
    anillos(l.g, 0, -56, l.acento, 1);
  };
};

/** 8 · Los pipes se traducen: un caño viejo que entra con gotas y sale en una caja. */
const pipes: Dibujo = (l) => {
  sombra(l.g, 70, 96);
  el(l.g, 'path', { d: 'M-104 -10H-14V22H-104Z', fill: '#cfc5cf', ...trazo });
  el(l.g, 'rect', { x: -22, y: -20, width: 18, height: 52, rx: 4, fill: '#a99bb4', ...trazo });
  el(l.g, 'text', {
    x: -60,
    y: 12,
    'text-anchor': 'middle',
    'font-family': 'ui-monospace, Menlo, Consolas, monospace',
    'font-weight': 700,
    'font-size': 18,
    fill: TINTA,
  }).textContent = 'pipe';
  const caja = el(l.g, 'rect', {
    x: 18,
    y: -36,
    width: 76,
    height: 72,
    rx: 16,
    fill: degradado(l, 'pipes', '#ffd58c', '#e98f2c'),
    ...trazo,
  });
  el(l.g, 'path', { d: 'M-4 6H18', stroke: TINTA, 'stroke-width': 3, 'stroke-dasharray': '3 5' });
  const gotas = [0, 1, 2].map((k) =>
    el(l.g, 'circle', { cx: -96 + k * 26, cy: 6, r: 5, fill: '#7aa3d6' }),
  );
  return () => {
    gsap.fromTo(
      gotas,
      { x: 0, opacity: 1 },
      { x: 110, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power1.in' },
    );
    gsap
      .timeline({ delay: 0.5 })
      .to(caja, { scale: 1.12, svgOrigin: '56 0', duration: 0.1 })
      .to(caja, { scale: 1, duration: 0.45, ease: 'elastic.out(1.2, 0.35)' });
  };
};

/** 9 · La antena: una torre alta con su luz en la punta, que mide antes de hablar. */
const antena: Dibujo = (l) => {
  sombra(l.g, 86, 44);
  el(l.g, 'path', { d: 'M-30 86L0 -70L30 86', fill: 'none', ...trazo, 'stroke-width': 4 });
  for (let k = 0; k < 5; k++) {
    const y = 70 - k * 30;
    const w = 26 - k * 5;
    el(l.g, 'path', {
      d: `M${-w} ${y}L${w - 5} ${y - 26}M${w} ${y}L${-w + 5} ${y - 26}`,
      stroke: TINTA,
      'stroke-width': 2,
    });
  }
  const luz = el(l.g, 'circle', { cx: 0, cy: -76, r: 9, fill: '#ff5a4a', ...trazo });
  const regla = el(l.g, 'g', { opacity: 0 });
  el(regla, 'path', { d: 'M48 86V-76M42 86H54M42 -76H54', stroke: l.acento, 'stroke-width': 3 });
  return () => {
    anillos(l.g, 0, -76, '#ff5a4a', 2);
    gsap.fromTo(luz, { attr: { r: 14 } }, { attr: { r: 9 }, duration: 0.4, ease: 'back.out(3)' });
    gsap.fromTo(regla, { opacity: 1 }, { opacity: 0, duration: 0.9, delay: 0.3 });
  };
};

/** 10 · La tormenta: una nube cargada que tira un rayo y unas gotas. */
const tormenta: Dibujo = (l) => {
  const nube = el(l.g, 'g');
  el(nube, 'path', {
    d: 'M-80 10C-104 10-104 -30-78 -32C-76 -64-34 -72-18 -48C-4 -76 50 -70 52 -36C86 -40 96 10 64 10Z',
    fill: degradado(l, 'nube', '#efe9f4', '#b7aec8'),
    ...trazo,
  });
  const rayo = el(l.g, 'path', {
    d: 'M-6 12L-24 52H-4L-16 88L22 38H2L14 12Z',
    fill: '#ffd27a',
    ...trazo,
    opacity: 0.25,
  });
  const gotas = [-60, -40, 36, 56].map((x, k) =>
    el(l.g, 'path', {
      d: `M${x} ${24 + k * 6}l-4 12`,
      stroke: '#7aa3d6',
      'stroke-width': 3,
      'stroke-linecap': 'round',
    }),
  );
  return () => {
    gsap.fromTo(rayo, { opacity: 1 }, { opacity: 0.25, duration: 0.5, ease: 'steps(3)' });
    gsap.fromTo(gotas, { y: 0, opacity: 1 }, { y: 30, opacity: 0, duration: 0.5, stagger: 0.06 });
    gsap.timeline().to(nube, { x: 5, duration: 0.05, yoyo: true, repeat: 3 }).set(nube, { x: 0 });
  };
};

/** 11 · Quien lee, avisa: la pantalla que mira y su campanita, que suena sola. */
const quienLee: Dibujo = (l) => {
  sombra(l.g, 80, 70);
  el(l.g, 'path', { d: 'M-16 58L-24 80H24L16 58Z', fill: '#d8cfbd', ...trazo });
  el(l.g, 'rect', { x: -86, y: -60, width: 172, height: 120, rx: 14, fill: '#2b2433', ...trazo });
  el(l.g, 'rect', {
    x: -74,
    y: -48,
    width: 148,
    height: 96,
    rx: 8,
    fill: degradado(l, 'pantalla', '#3b3247', '#1f1a26'),
  });
  const ojo = el(l.g, 'g');
  el(ojo, 'ellipse', { cx: -10, cy: 0, rx: 34, ry: 22, fill: PAPEL, ...trazo });
  el(ojo, 'circle', { cx: -4, cy: 2, r: 11, fill: TINTA });
  el(ojo, 'circle', { cx: -8, cy: -3, r: 3.5, fill: '#fff' });
  const campana = el(l.g, 'g', { transform: 'translate(52 -18)' });
  el(campana, 'path', { d: 'M-12 8C-12 -14 12 -14 12 8L16 12H-16Z', fill: l.acento, ...trazo });
  el(campana, 'circle', { cx: 0, cy: 16, r: 3.4, fill: '#ffd27a' });
  return () => {
    gsap.fromTo(
      ojo,
      { scaleY: 0.1, svgOrigin: '-10 0' },
      { scaleY: 1, duration: 0.24, ease: 'back.out(2)' },
    );
    gsap.fromTo(
      campana,
      { rotation: -26, svgOrigin: '52 -30' },
      { rotation: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.25)' },
    );
    anillos(l.g, 52, -18, l.acento, 1);
  };
};

/**
 * La práctica · el carrito: la bodega flotante de la tripulación, con la carga apilada. Cada cambio
 * de cantidad la sacude y la caja de arriba salta, como la caja que avisa del capítulo 1.
 */
const bodega: Dibujo = (l) => {
  // Con el asa es más ancha que los otros objetos: un poco más chica, para que ocupe lo mismo.
  const g = el(l.g, 'g', { transform: 'scale(0.86)' });
  sombra(g, 70, 84);
  const cuerpo = el(g, 'g');
  // La carga va detrás del frente de la bodega, asomando: así se lee como algo que se llenó.
  const cajas = [
    { x: -42, y: -40, w: 44, h: 40, a: '#ffd58c', b: '#e98f2c' },
    { x: 4, y: -34, w: 40, h: 34, a: '#c8f0e3', b: '#4fb39b' },
    { x: -22, y: -74, w: 38, h: 34, a: '#f1ebff', b: '#b9a6ea' },
  ].map((c, k) => {
    const g = el(cuerpo, 'g');
    el(g, 'rect', {
      x: c.x,
      y: c.y,
      width: c.w,
      height: c.h,
      rx: 8,
      fill: degradado(l, `carga-${k}`, c.a, c.b),
      ...trazo,
    });
    el(g, 'path', {
      d: `M${c.x + 8} ${c.y + 9}H${c.x + c.w - 8}`,
      stroke: '#fff',
      'stroke-opacity': 0.6,
      'stroke-width': 4,
      'stroke-linecap': 'round',
    });
    return g;
  });
  el(cuerpo, 'path', {
    d: 'M-74 -8H74L62 52Q60 60 52 60H-52Q-60 60 -62 52Z',
    fill: degradado(l, 'bodega', '#fffdf7', '#e6dcc4'),
    ...trazo,
  });
  for (const x of [-34, 0, 34]) {
    el(cuerpo, 'path', { d: `M${x} 4V48`, stroke: '#c9bfa9', 'stroke-width': 3 });
  }
  // El asa por donde la empujan, y el propulsor de abajo en vez de ruedas: estamos en el espacio.
  el(cuerpo, 'path', {
    d: 'M74 -8L92 -34H106',
    fill: 'none',
    stroke: TINTA,
    'stroke-width': 5,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
  el(cuerpo, 'path', { d: 'M-30 60Q0 76 30 60', fill: l.acento, ...trazo });
  return (f) => {
    rebote(cuerpo, f, '0 60');
    gsap.fromTo(
      cajas[2],
      { y: -18 * f, rotation: -8 * f, svgOrigin: '-3 -40' },
      { y: 0, rotation: 0, duration: 0.6, ease: 'bounce.out' },
    );
    anillos(g, 0, -90, l.acento, 1);
  };
};

/** Dónde pasa una escena con tripulación: un capítulo del viaje, o la práctica del carrito. */
export type EtapaDelMundo = number | 'carrito';

const DIBUJOS: Record<EtapaDelMundo, Dibujo> = {
  carrito: bodega,
  1: caja,
  2: molecula,
  3: baliza,
  4: gemelas,
  5: mapa,
  6: transmision,
  7: repetidor,
  8: pipes,
  9: antena,
  10: tormenta,
  11: quienLee,
};

export function dibujarObjeto(
  capitulo: EtapaDelMundo,
  g: SVGGElement,
  defs: SVGDefsElement,
  id: string,
  acento: string,
): ObjetoDelMundo {
  const dibujo = DIBUJOS[capitulo] ?? caja;
  const cuerpo = el(g, 'g');
  const reaccion = dibujo({ g: cuerpo, defs, id, acento });
  // Flota apenas, como todo en el mundo: quieto se ve pegado al papel.
  const flote = sinMovimiento()
    ? null
    : gsap.to(cuerpo, { y: -4, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  return {
    reaccionar: (fuerza = 1) => {
      if (!sinMovimiento()) reaccion(fuerza);
    },
    apagar: () => {
      flote?.kill();
      gsap.killTweensOf(cuerpo.querySelectorAll('*'));
      g.replaceChildren();
    },
  };
}
