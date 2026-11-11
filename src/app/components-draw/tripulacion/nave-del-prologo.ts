/**
 * Las cuatro naves de la tripulación, como se dibujan en el prólogo: el capitán, la Nave A, la Nave B
 * y la exploradora. Las usa el prólogo y las usa el viaje, así es la misma tripulación en toda la
 * historia. Solo dibuja: quién las mueve (el guion del prólogo, los muelles del viaje) es de cada uno.
 */

const NS = 'http://www.w3.org/2000/svg';
type Atributos = Readonly<Record<string, string | number>>;

export function el<K extends keyof SVGElementTagNameMap>(
  padre: Element,
  tag: K,
  attrs: Atributos = {},
): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  padre.appendChild(n);
  return n;
}

export interface Paleta {
  readonly claro: string;
  readonly medio: string;
  readonly oscuro: string;
  readonly acento: string;
  readonly luz: string;
}

/**
 * Una paleta por nave. Sin negro: la tinta es oscura con tono, igual que las sombras. La
 * exploradora lleva los colores de Angie porque es ella (ver docs/historia).
 */
export const PALETAS: readonly Paleta[] = [
  { claro: '#f6f1e8', medio: '#cfc5cf', oscuro: '#6f6280', acento: '#eb9b3c', luz: '#ffd27a' },
  { claro: '#e4d8ff', medio: '#ab95e2', oscuro: '#56448a', acento: '#ff7a9c', luz: '#ffb8cc' },
  { claro: '#ffdcc8', medio: '#efa088', oscuro: '#97524f', acento: '#6b3a2a', luz: '#ff5d6c' },
  { claro: '#f637e3', medio: '#e90465', oscuro: '#ba005e', acento: '#ffc65c', luz: '#ff8ac9' },
];

/**
 * El color del nombre de cada nave en la caja de diálogo: el tono de su casco, aclarado para leerse
 * sobre la barra oscura. Antes el nombre usaba la luz de la antena, y Nave A, violeta, hablaba en
 * rosa: el retrato decía una nave y el nombre otra. Las cinemáticas repiten estos valores en CSS.
 */
export const VOZ_DE_NAVE = ['#f2c27a', '#c9b6ea', '#f2a58e', '#ff8ac9'] as const;

export const TINTA = '#2b1b33';

/** Las partes de una nave dibujada que se animan por separado. */
export interface NaveDibujada {
  readonly pose: SVGGElement;
  readonly rig: SVGGElement;
  readonly llama: SVGGElement;
  readonly ojos: SVGGElement;
  readonly pupilas: readonly SVGGElement[];
  readonly cejas: readonly SVGPathElement[];
  /** Dónde va cada ceja en reposo: el ánimo se suma encima. */
  readonly cejasBase: readonly string[];
  readonly antena: SVGGElement;
  readonly bandera: SVGPathElement | null;
  readonly luz: SVGCircleElement;
  readonly ondas: SVGGElement;
}

/**
 * Los degradados que comparten las cuatro naves (la llama, su halo y los dos vidrios), con el
 * prefijo de quien las dibuja: los `id` son del documento, y dos escenas a la vez no se pisan.
 */
export function gradientesDeNaves(defs: SVGDefsElement, prefijo: string): void {
  const lineal = (id: string, paradas: readonly [number, string, number?][], a: Atributos = {}) => {
    const g = el(defs, 'linearGradient', { id: `${prefijo}-${id}`, ...a });
    for (const [o, c, op] of paradas)
      el(g, 'stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 });
  };
  lineal(
    'vidrio',
    [
      [0, '#d9f0ff'],
      [0.5, '#7aa3d6'],
      [1, '#3b4f8a'],
    ],
    { x1: 0, y1: 0, x2: 0, y2: 1 },
  );
  // La cabina de la exploradora tiene el tono de la cara de Angie: es la cara que va a tener.
  lineal(
    'vidrio-exploradora',
    [
      [0, '#eadbe7'],
      [0.5, '#e3d1e0'],
      [1, '#d8c0d6'],
    ],
    { x1: 0, y1: 0, x2: 0, y2: 1 },
  );
  lineal(
    'llama',
    [
      [0, '#ff9a3c', 0],
      [0.45, '#ff9a3c', 0.9],
      [1, '#ffe7a8', 1],
    ],
    { gradientUnits: 'userSpaceOnUse', x1: -140, y1: 0, x2: -66, y2: 0 },
  );
  const halo = el(defs, 'radialGradient', { id: `${prefijo}-halo-llama` });
  el(halo, 'stop', { offset: 0, 'stop-color': '#ff9a3c', 'stop-opacity': 0.32 });
  el(halo, 'stop', { offset: 1, 'stop-color': '#ff9a3c', 'stop-opacity': 0 });
}

/**
 * Una nave vista de costado, con la nariz hacia +x. Grupos separados para que cada capa tenga su
 * dueño: `pose` la ubica quien la mueve, `rig` lo mueven los muelles, y adentro cada parte (llama,
 * ojos, pupilas, cejas, antena) se anima sola. Los degradados salen de `gradientesDeNaves` con el
 * mismo prefijo.
 */
export function dibujarNave(
  padre: SVGGElement,
  i: number,
  defs: SVGDefsElement,
  prefijo: string,
): NaveDibujada {
  const p = PALETAS[i];
  const exploradora = i === 3;
  const casco = el(defs, 'linearGradient', {
    id: `${prefijo}-casco-${i}`,
    gradientUnits: 'userSpaceOnUse',
    x1: 0,
    y1: -34,
    x2: 0,
    y2: 30,
  });
  el(casco, 'stop', { offset: 0, 'stop-color': p.claro });
  el(casco, 'stop', { offset: 0.55, 'stop-color': p.medio });
  el(casco, 'stop', { offset: 1, 'stop-color': p.oscuro });

  const pose = el(padre, 'g', { 'data-nave': i, style: 'cursor:pointer' });
  const rig = el(pose, 'g');
  // El halo de la llama va debajo de todo: es luz que la nave tira sobre el espacio de atrás.
  el(rig, 'ellipse', { cx: -92, cy: 0, rx: 70, ry: 26, fill: `url(#${prefijo}-halo-llama)` });
  const llama = el(rig, 'g');
  el(llama, 'path', {
    d: 'M-66 -11C-90 -15-120 -6-140 0C-120 6-90 15-66 11Z',
    fill: `url(#${prefijo}-llama)`,
  });
  el(llama, 'path', { d: 'M-66 -6C-80 -7-96 -3-106 0C-96 3-80 7-66 6Z', fill: '#fff6dc' });

  const aleta = (d: string, fill: string): void => {
    el(rig, 'path', { d, fill, stroke: TINTA, 'stroke-opacity': 0.35, 'stroke-width': 1.5 });
  };
  aleta('M-26 24C-36 40-50 50-66 52C-60 40-56 30-48 20Z', p.oscuro);
  el(rig, 'path', { d: 'M-58 -13L-70 -16L-70 16L-58 13Z', fill: '#4a3d58' });

  const forma = exploradora
    ? 'M86 2C72 -16 30 -26 -14 -24C-40 -23-56 -14-58 0C-56 14-40 21-14 21C30 23 74 14 86 2Z'
    : 'M66 4C60 -22 22 -34 -18 -32C-44 -31-58 -20-58 0C-58 18-46 28-22 28C18 30 60 24 66 4Z';
  el(rig, 'path', {
    d: forma,
    fill: `url(#${prefijo}-casco-${i})`,
    stroke: TINTA,
    'stroke-opacity': 0.5,
    'stroke-width': 2,
  });
  // La panza, más oscura: sin esta capa el casco se lee como una lámina plana.
  el(rig, 'path', {
    d: exploradora
      ? 'M86 2C72 16 30 22 -14 21C-40 21-56 14-58 0C-48 10-28 13 -4 13C34 13 64 9 86 2Z'
      : 'M66 4C60 24 18 30 -22 28C-46 28-58 18-58 0C-50 14-30 18 -6 18C26 18 52 14 66 4Z',
    fill: 'rgba(25,8,40,.28)',
  });
  el(rig, 'path', {
    d: exploradora
      ? 'M-54 -2C-20 -6 30 -6 80 0L80 4C30 0-20 0-55 3Z'
      : 'M-56 -4C-20 -9 24 -9 64 -1L65 5C24 -2-20 -1-57 4Z',
    fill: p.acento,
    'fill-opacity': 0.9,
  });
  // El borde de luz arriba: la luz de la escena viene de adelante y de arriba.
  el(rig, 'path', {
    d: exploradora ? 'M60 -12C34 -22 0 -24 -36 -18' : 'M44 -20C22 -30 -10 -32 -38 -25',
    fill: 'none',
    stroke: '#fff',
    'stroke-opacity': 0.55,
    'stroke-width': 3,
    'stroke-linecap': 'round',
  });
  for (const x of [-34, -18]) {
    el(rig, 'circle', {
      cx: x,
      cy: 10,
      r: 4.4,
      fill: '#ffd68a',
      stroke: TINTA,
      'stroke-width': 1.4,
    });
  }
  const calco = el(rig, 'g', { transform: 'translate(2 10)' });
  if (i === 0) {
    el(calco, 'path', {
      d: 'M0 -7L2 -2 7 -2 3 1 4.6 6.4 0 3.4-4.6 6.4-3 1-7 -2-2 -2Z',
      fill: p.acento,
      stroke: TINTA,
      'stroke-width': 1,
    });
  } else if (i === 1) {
    el(calco, 'path', {
      d: 'M0 5C-9 -1-9 -8-3.4 -8C-1 -8 0 -6 0 -5C0 -6 1 -8 3.4 -8C9 -8 9 -1 0 5Z',
      fill: p.acento,
      stroke: TINTA,
      'stroke-width': 1,
    });
  } else if (i === 2) {
    el(calco, 'path', { d: 'M-4 -1L4 -1 0 9Z', fill: '#e2a65a', stroke: TINTA, 'stroke-width': 1 });
    el(calco, 'circle', {
      cx: 0,
      cy: -3.6,
      r: 4.6,
      fill: p.acento,
      stroke: TINTA,
      'stroke-width': 1,
    });
    el(calco, 'circle', { cx: 0.6, cy: -9.4, r: 1.8, fill: '#ff4d5e' });
  }
  aleta('M-26 -28C-34 -44-48 -56-64 -58C-60 -44-56 -32-48 -22Z', p.medio);

  // Antena: sigue al cuerpo con retraso. Su luz titila cuando esa nave habla por radio.
  const antena = el(rig, 'g', { transform: 'translate(-6 -30)' });
  const alto = exploradora ? -46 : -32;
  el(antena, 'path', {
    d: `M0 0Q-3 ${alto / 2} -2 ${alto}`,
    fill: 'none',
    stroke: TINTA,
    'stroke-width': 2.4,
    'stroke-linecap': 'round',
  });
  let bandera: SVGPathElement | null = null;
  if (i === 0) {
    bandera = el(antena, 'path', {
      d: `M-2 ${alto}L20 ${alto + 5}L-2 ${alto + 11}Z`,
      fill: p.acento,
      stroke: TINTA,
      'stroke-width': 1.2,
      'stroke-linejoin': 'round',
    });
  }
  const luz = el(antena, 'circle', {
    cx: -2,
    cy: alto - 2,
    r: 4.8,
    fill: p.luz,
    stroke: TINTA,
    'stroke-width': 1.2,
  });
  const ondas = el(antena, 'g', { opacity: 0, transform: `translate(-2 ${alto - 2})` });
  for (const r of [9, 15, 21]) {
    el(ondas, 'path', {
      d: `M${r * 0.6} ${-r * 0.8}A${r} ${r} 0 0 1 ${r * 0.6} ${r * 0.8}`,
      fill: 'none',
      stroke: p.luz,
      'stroke-width': 2.2,
      'stroke-linecap': 'round',
    });
  }

  // La cabina con el piloto: ojos en tres cuartos (el lejano más chico) que miran lo que pasa.
  const cab = exploradora
    ? { cx: 30, cy: -14, rx: 28, ry: 13 }
    : { cx: 24, cy: -17, rx: 26, ry: 18 };
  const vidrio = exploradora ? `url(#${prefijo}-vidrio-exploradora)` : `url(#${prefijo}-vidrio)`;
  el(rig, 'ellipse', { ...cab, fill: vidrio, stroke: TINTA, 'stroke-width': 2 });
  const ojos = el(rig, 'g');
  const cerca = { x: cab.cx + 10, y: cab.cy - 1, r: exploradora ? 5.6 : 7 };
  const lejos = { x: cab.cx - 5, y: cab.cy - 2, r: exploradora ? 4.4 : 5.4 };
  const pupilas: SVGGElement[] = [];
  for (const o of [lejos, cerca]) {
    const ojo = el(ojos, 'g', { transform: `translate(${o.x} ${o.y})` });
    el(ojo, 'ellipse', {
      rx: o.r * 0.92,
      ry: o.r,
      fill: '#fffaf2',
      stroke: TINTA,
      'stroke-width': 1,
    });
    const pupila = el(ojo, 'g');
    el(pupila, 'circle', { r: o.r * 0.52, fill: TINTA });
    el(pupila, 'circle', { cx: -o.r * 0.18, cy: -o.r * 0.2, r: o.r * 0.17, fill: '#fff' });
    pupilas.push(pupila);
  }
  const cejasBase = [lejos, cerca].map((o) => `translate(${o.x} ${o.y - o.r - 3})`);
  const cejas = [lejos, cerca].map((o, k) =>
    el(rig, 'path', {
      d: `M${-o.r * 0.8} 0Q0 ${-o.r * 0.3} ${o.r * 0.8} 0`,
      fill: 'none',
      stroke: TINTA,
      'stroke-width': 2.2,
      'stroke-linecap': 'round',
      transform: cejasBase[k],
    }),
  );
  el(rig, 'path', {
    d: `M${cab.cx - cab.rx * 0.7} ${cab.cy - cab.ry * 0.5}C${cab.cx - cab.rx * 0.3} ${cab.cy - cab.ry * 1.05} ${cab.cx + cab.rx * 0.4} ${cab.cy - cab.ry * 1.05} ${cab.cx + cab.rx * 0.78} ${cab.cy - cab.ry * 0.55}`,
    fill: 'none',
    stroke: '#fff',
    'stroke-opacity': 0.6,
    'stroke-width': 3,
    'stroke-linecap': 'round',
  });

  return {
    pose,
    rig,
    llama,
    ojos,
    pupilas,
    cejas,
    cejasBase,
    antena,
    bandera,
    luz,
    ondas,
  };
}
