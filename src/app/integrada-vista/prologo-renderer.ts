import { bisectAngle } from './tusi-math';
import { PRESUPUESTO, type Anclajes, type Hablante, type LineaEnReloj } from './prologo-guion';

/**
 * Motor gráfico y de dibujo del Prólogo ("La Anomalía").
 * Diseñado como renderizador determinista sobre Canvas 2D en función del tiempo `t` y del estado del guion.
 * Puede ser invocado cuadro a cuadro por el bucle rAF de producción o por el scrubber/timeline del Studio.
 */

export interface PuntoParticula {
  x: number;
  y: number;
  r: number;
}

export interface EstiloHablante {
  y: number;
  x: number;
  tam: number;
  color: string;
  fuente: 'mono' | 'serif';
}

export interface FusionEstado {
  p: number;
  vivo: number;
  acerca: number;
  a: { x: number; y: number };
  b: { x: number; y: number };
}

export const ESTILO_HABLANTE: Record<Hablante, EstiloHablante> = {
  cap: { y: 0.78, x: 0.5, tam: 26, color: '#eef1f4', fuente: 'mono' },
  naveA: { y: 0.85, x: 0.28, tam: 23, color: '#c4cddb', fuente: 'mono' },
  naveB: { y: 0.85, x: 0.72, tam: 23, color: '#c4cddb', fuente: 'mono' },
  nave4: { y: 0.2, x: 0.62, tam: 25, color: '#7fd6bd', fuente: 'mono' },
  todos: { y: 0.5, x: 0.5, tam: 44, color: '#f6d9c0', fuente: 'mono' },
  voz: { y: 0.19, x: 0.5, tam: 34, color: '#f0b458', fuente: 'serif' },
  mascota: { y: 0.825, x: 0.5, tam: 28, color: '#f4ece0', fuente: 'serif' },
};

export const TOTAL_CUERDAS = 12;
export const CUERDAS_ANGULOS = Array.from({ length: TOTAL_CUERDAS }, (_, k) => bisectAngle(k));

export const DESFASE_CUERDAS = [
  0, 2.31, 4.87, 1.06, 5.42, 3.19, 0.74, 2.95, 4.13, 1.72, 3.86, 5.09,
];
export const VELOCIDAD_CUERDAS = [
  1, 1.47, 0.72, 1.83, 0.61, 1.29, 1.68, 0.86, 1.12, 1.05, 0.79, 1.55,
];

export const ESTRELLAS_FONDO = Array.from({ length: 150 }, (_, i) => ({
  x: ((i * 97) % 1000) / 1000,
  y: ((i * 61) % 562) / 562,
  z: 0.3 + ((i * 37) % 100) / 140,
  f: ((i * 173) % 628) / 100,
}));

export const FORMACION_NAVES = [
  { dx: 0, dy: 0, bob: 0 },
  { dx: -46, dy: -30, bob: 1.9 },
  { dx: -46, dy: 30, bob: 3.7 },
];

export const OPERADORES_RXJS = [
  { nave: 0, txt: 'switchMap', d: 0, lado: -1 },
  { nave: 1, txt: 'retry', d: 760, lado: 1 },
  { nave: 2, txt: 'mergeMap', d: 1520, lado: -1 },
  { nave: 0, txt: 'catchError', d: 2280, lado: 1 },
  { nave: 1, txt: 'concatMap', d: 3040, lado: -1 },
  { nave: 2, txt: 'takeUntil', d: 3800, lado: 1 },
  { nave: 0, txt: 'debounceTime', d: 4560, lado: -1 },
];

export const PIPES_RXJS = [
  { nave: 1, txt: 'pipe', d: 0, lado: 1 },
  { nave: 2, txt: 'pipe', d: 620, lado: -1 },
  { nave: 0, txt: 'pipe', d: 1240, lado: 1 },
  { nave: 1, txt: 'pipe', d: 1860, lado: -1 },
  { nave: 2, txt: 'pipe', d: 2480, lado: 1 },
];

export const VUELO_OPERADOR_MS = 1400;

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function ease(v: number): number {
  return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
}

export function mezclarColores(a: string, b: string, p: number): string {
  const n = (h: string): number[] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = n(a),
    [r2, g2, b2] = n(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * p)},${Math.round(g1 + (g2 - g1) * p)},${Math.round(b1 + (b2 - b1) * p)})`;
}

export interface PrologoFrameContext {
  readonly g: CanvasRenderingContext2D;
  readonly W: number;
  readonly H: number;
  readonly CX: number;
  readonly CY: number;
  readonly t: number;
  readonly reloj: readonly LineaEnReloj[];
  readonly anclajes: Anclajes;
  readonly mascotaEl?: HTMLElement | null;
  readonly stageWidth?: number;
  readonly showGuides?: boolean;
}

/** Dibuja el fondo espacial estrellado. */
export function dibujarEstrellas(ctx: PrologoFrameContext, alfa: number, warp: number): void {
  const { g, W, H, CX, CY, t } = ctx;
  if (alfa <= 0.01) return;
  for (const s of ESTRELLAS_FONDO) {
    const x = ((s.x * W + t * 0.012 * s.z) % (W + 40)) - 20;
    const y = s.y * H;
    const titila = 0.72 + 0.28 * Math.sin(t * 0.0021 + s.f);
    g.globalAlpha = alfa * (0.18 + s.z * 0.5) * titila;
    if (warp > 0.01) {
      const dx = x - CX,
        dy = y - CY;
      const d = Math.hypot(dx, dy) || 1;
      const largo = warp * (50 + s.z * 260);
      g.strokeStyle = '#dfe7f2';
      g.lineWidth = 1.1 * s.z;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (dx / d) * largo, y + (dy / d) * largo);
      g.stroke();
    } else {
      g.fillStyle = '#cfd6e0';
      g.fillRect(x, y, 1.6 * s.z, 1.6 * s.z);
    }
  }
  g.globalAlpha = 1;
}

/** Dibuja el faro/anomalía gravitatoria en el centro. */
export function dibujarFaro(ctx: PrologoFrameContext, alfa: number): void {
  const { g, CX, CY, t } = ctx;
  if (alfa <= 0.01) return;
  const r = (24 + Math.sin(t * 0.0012) * 5) * alfa;
  const rg = g.createRadialGradient(CX, CY, 0, CX, CY, r * 3.2);
  rg.addColorStop(0, `rgba(255,244,222,${0.95 * alfa})`);
  rg.addColorStop(0.3, `rgba(235,155,60,${0.32 * alfa})`);
  rg.addColorStop(1, 'rgba(47,154,128,0)');
  g.save();
  g.fillStyle = rg;
  g.fillRect(CX - r * 3.2, CY - r * 3.2, r * 6.4, r * 6.4);
  g.restore();
}

/** Dibuja la nave exploradora (Nave 4). */
export function dibujarExploradora(ctx: PrologoFrameContext): void {
  const { g, W, H, t, anclajes: T } = ctx;
  if (t > T.zoom + 400) return;
  const p = clamp01(t / T.anomalia);
  const escapa = clamp01((t - T.anomalia) / 9000);
  const x = W * (0.34 + p * 0.24 + escapa * 0.22);
  const y = H * (0.3 - p * 0.05 - escapa * 0.14);
  const tiron = Math.sin(t * 0.0016) * 14;
  const a = 1 - clamp01((t - T.zoom) / 400);

  g.save();
  g.globalAlpha = a;
  g.translate(x + tiron, y);
  g.scale(0.85, 0.85);
  g.strokeStyle = '#62c4ad';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(19, 0);
  g.lineTo(-9, -4);
  g.lineTo(-4, 0);
  g.lineTo(-9, 4);
  g.closePath();
  g.stroke();
  g.beginPath();
  g.moveTo(-4, -3);
  g.lineTo(-14, -10);
  g.moveTo(-4, 3);
  g.lineTo(-14, 10);
  g.stroke();
  g.fillStyle = 'rgba(98,196,173,0.95)';
  g.beginPath();
  g.arc(-11, 0, 2.4, 0, 7);
  g.fill();
  g.restore();
}

/** Posición pura de la formación antes del salto. */
export function posicionAntesDelSalto(
  t: number,
  W: number,
  H: number,
  CX: number,
  CY: number,
  T: Anclajes,
): { x: number; y: number; s: number; a: number } {
  const ENTRADA = T.zoom;
  let x: number,
    y: number,
    s: number,
    arrastre = 0;
  if (t < T.anomalia) {
    const p = t / T.anomalia;
    x = W * (0.12 + p * 0.16);
    y = H * (0.42 - p * 0.04);
    s = 1;
  } else {
    const p = Math.pow(clamp01((t - T.anomalia) / (ENTRADA - T.anomalia)), 1.9);
    const x0 = W * 0.28,
      y0 = H * 0.38;
    x = x0 + (CX - x0) * p;
    y = y0 + (CY - y0) * p;
    s = 1 - p * 0.86;
    arrastre = p;
  }
  const tiembla = clamp01((t - T.temblor) / 1800);
  const sacude = tiembla * 3.5 + arrastre * 16;
  x += Math.sin(t * 0.021) * sacude + Math.sin(t * 0.047) * sacude * 0.4;
  y += Math.cos(t * 0.017) * sacude + Math.cos(t * 0.039) * sacude * 0.4;
  return { x, y, s, a: 1 - clamp01((t - (ENTRADA - 500)) / 500) };
}

/** Dibuja los disparos de operadores RxJS y pipes. */
export function dibujarOperadores(ctx: PrologoFrameContext): void {
  const { g, W, H, CX, CY, t, reloj, anclajes: T } = ctx;
  const lineaRxjs = reloj.find((l) => l.id === 'anom-rxjs');
  const lineaPipes = reloj.find((l) => l.id === 'anom-pipes');
  const desdeRxjs = (lineaRxjs?.t0 ?? 0) + 400;
  const desdePipes = (lineaPipes?.t0 ?? 0) + 300;

  const descarga = (
    tanda: readonly { nave: number; txt: string; d: number; lado: number }[],
    desde: number,
  ) => {
    const ultima = tanda[tanda.length - 1].d;
    if (t < desde || t > desde + ultima + VUELO_OPERADOR_MS) return;
    g.save();
    g.font = '11px "JetBrains Mono","Cascadia Mono",Consolas,ui-monospace,monospace';
    g.textAlign = 'left';
    for (const op of tanda) {
      const p = clamp01((t - (desde + op.d)) / VUELO_OPERADOR_MS);
      if (p <= 0 || p >= 1) continue;
      const cuna = posicionAntesDelSalto(desde + op.d, W, H, CX, CY, T);
      const f = FORMACION_NAVES[op.nave];
      const ox = cuna.x + f.dx * cuna.s,
        oy = cuna.y + f.dy * cuna.s;
      const avance = ease(p) * 0.6;
      let x = ox + (CX - ox) * avance,
        y = oy + (CY - oy) * avance;
      const dx = CX - ox,
        dy = CY - oy,
        d = Math.hypot(dx, dy) || 1;
      x += (-dy / d) * op.lado * 40 * p;
      y += (dx / d) * op.lado * 40 * p;
      const vida = clamp01(p / 0.12) * clamp01((1 - p) / 0.4);
      g.globalAlpha = vida;
      g.fillStyle = '#7fd6bd';
      g.beginPath();
      g.arc(x, y, 4.4 - p * 1.8, 0, 7);
      g.fill();
      g.globalAlpha = vida * 0.7;
      g.fillStyle = 'rgba(190,232,220,0.9)';
      g.fillText(op.txt, x + 8, y + (op.lado < 0 ? -6 : 13));
    }
    g.restore();
  };

  descarga(OPERADORES_RXJS, desdeRxjs);
  descarga(PIPES_RXJS, desdePipes);
}

/** Dibuja la formación de las tres naves principales. */
export function dibujarNaves(ctx: PrologoFrameContext, puntos: readonly PuntoParticula[]): void {
  const { g, W, H, CX, CY, t, reloj, anclajes: T } = ctx;
  const REAPARECE = T.zoom + 900;
  const salida = clamp01((t - T.orden) / 3200);
  let x = 0,
    y = 0,
    s = 1,
    a = 1;

  const lineaEscapemos = reloj.find((l) => l.id === 'dentro-escapemos');
  const lineaEsquivar = reloj.find((l) => l.id === 'dentro-esquivar');
  const tLanza = lineaEscapemos?.t0 ?? 0;
  const tFrena = lineaEsquivar?.t0 ?? 0;

  if (t < REAPARECE) {
    const b = posicionAntesDelSalto(t, W, H, CX, CY, T);
    x = b.x;
    y = b.y;
    s = b.s;
    a = b.a;
  } else if (salida <= 0) {
    const e = clamp01((t - REAPARECE) / 700);
    x = W * 0.24 + Math.sin(t * 0.0007) * 18;
    y = H * 0.24 + Math.sin(t * 0.0011 + 1.3) * 11;
    const esq = clamp01((t - (T.zoom - 1300)) / 900) * clamp01((T.fusion + 1400 - t) / 1000);
    x += (Math.sin(t * 0.009) * 26 + Math.sin(t * 0.021) * 12) * esq;
    y += (Math.cos(t * 0.011) * 18 + Math.cos(t * 0.019) * 9) * esq;

    const lanza = ease(clamp01((t - tLanza) / 1100));
    const frena = ease(clamp01((t - tFrena) / 500));
    x += (lanza - frena) * W * 0.19;
    y -= (lanza - frena) * H * 0.05;
    s = 0.6 * e;
    a = e;
  } else {
    x = W * 0.24 + salida * W * 0.48;
    y = H * 0.24 - salida * H * 0.08;
    s = 0.6 - salida * 0.52;
  }

  if (s <= 0.04 || a <= 0.02) return;
  g.save();
  g.globalAlpha = a;
  const suelta = t > REAPARECE && salida <= 0 ? 1 : 0;

  FORMACION_NAVES.forEach((f, i) => {
    const abre = 1 + suelta * 2.2;
    let px = x + f.dx * s * abre + Math.sin(t * 0.0013 + f.bob) * (5 + suelta * 22) * s;
    let py = y + f.dy * s * abre + Math.cos(t * 0.0016 + f.bob) * (4 + suelta * 18) * s;

    let ex = 0,
      ey = 0;
    if (suelta) {
      const RADIO = 95;
      for (const p of puntos) {
        const dx = px - p.x,
          dy = py - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < RADIO * RADIO && d2 > 4) {
          const d = Math.sqrt(d2);
          const fuerza = 1 - d / RADIO;
          ex += (dx / d) * fuerza;
          ey += (dy / d) * fuerza;
        }
      }
      px += ex * 46;
      py += ey * 46;
    }

    g.save();
    g.translate(px, py);
    if (suelta) g.rotate(Math.max(-0.5, Math.min(0.5, ey * 0.55)));
    g.scale(s, s);
    g.strokeStyle = i === 0 ? '#e7ecf3' : 'rgba(231,236,243,0.72)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(14, 0);
    g.lineTo(-10, -7);
    g.lineTo(-5, 0);
    g.lineTo(-10, 7);
    g.closePath();
    g.stroke();
    g.fillStyle = 'rgba(235,155,60,0.9)';
    g.beginPath();
    g.arc(-11, 0, 2.6, 0, 7);
    g.fill();
    g.restore();
  });
  g.restore();
}

/** Dibuja la partícula rápida que cruza cerca de las naves. */
export function dibujarBala(ctx: PrologoFrameContext, puntosAcc: PuntoParticula[]): void {
  const { g, W, H, t, reloj } = ctx;
  const lineaCuidado = reloj.find((l) => l.id === 'dentro-cuidado');
  const t0 = (lineaCuidado?.t0 ?? 0) - 300;
  const t1 = (lineaCuidado?.t0 ?? 0) + 1300;
  if (t < t0 || t > t1) return;
  const p = clamp01((t - t0) / (t1 - t0));
  const en = (q: number): { x: number; y: number } => ({
    x: W * (1.06 - q * 1.28),
    y: H * (0.64 - q * 0.62),
  });
  const ahora = en(p),
    antes = en(Math.max(0, p - 0.1));
  puntosAcc.push({ x: ahora.x, y: ahora.y, r: 15 });

  g.save();
  const estela = g.createLinearGradient(antes.x, antes.y, ahora.x, ahora.y);
  estela.addColorStop(0, 'rgba(235,155,60,0)');
  estela.addColorStop(1, 'rgba(235,155,60,0.5)');
  g.strokeStyle = estela;
  g.lineWidth = 10;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(antes.x, antes.y);
  g.lineTo(ahora.x, ahora.y);
  g.stroke();
  g.fillStyle = '#f2b96b';
  g.beginPath();
  g.arc(ahora.x, ahora.y, 12, 0, 7);
  g.fill();
  g.restore();
}

/** Dibuja el patrón de partículas armónicas / caóticas (Par de Tusi). */
export function dibujarPatron(
  ctx: PrologoFrameContext,
  zoom: number,
  alfa: number,
  cuantas: number,
  sync: number,
  oscuro: boolean,
  circulo: number,
  fusion: FusionEstado | null,
  puntosAcc: PuntoParticula[],
): void {
  const { g, CX, CY, t } = ctx;
  if (alfa <= 0.01) return;
  const R = 210 * zoom;
  const rp = 4.2 * Math.min(zoom, 2.4);
  const base = t * 0.0011;

  g.save();
  g.globalAlpha = alfa;
  for (let i = 0; i < Math.min(TOTAL_CUERDAS, cuantas); i++) {
    const th = CUERDAS_ANGULOS[i];
    const nace = sync < 0.02 ? 1 : clamp01((cuantas - i) * 0.9);
    const r = R * ease(Math.min(1, nace));
    g.globalAlpha = alfa * (fusion ? 1 - fusion.p : 1);
    g.strokeStyle = oscuro ? 'rgba(180,186,178,0.42)' : 'rgba(120,116,104,0.34)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(CX + Math.cos(th) * r, CY + Math.sin(th) * r);
    g.lineTo(CX - Math.cos(th) * r, CY - Math.sin(th) * r);
    g.stroke();
    g.globalAlpha = alfa * (fusion ? fusion.vivo : 1);

    const suelto =
      base * VELOCIDAD_CUERDAS[i] + DESFASE_CUERDAS[i] + Math.sin(t * 0.0021 + i * 2.7) * 0.45;
    const ph = suelto + (base - suelto) * ease(sync);

    for (const signo of [1, -1]) {
      const s = Math.cos(ph - th) * r * signo;
      let px = CX + Math.cos(th) * s;
      let py = CY + Math.sin(th) * s;

      if (fusion) {
        const nucleo = signo > 0 ? fusion.a : fusion.b;
        const giro = t * 0.004 * signo + i * 0.8;
        const radio = 26 + (i % 3) * 10;
        const tx = nucleo.x + Math.cos(giro) * radio;
        const ty = nucleo.y + Math.sin(giro) * radio * 0.4;
        px += (tx - px) * fusion.p;
        py += (ty - py) * fusion.p;
      }

      g.fillStyle = signo > 0 ? '#eb9b3c' : '#2f9a80';
      g.beginPath();
      g.arc(px, py, rp, 0, 7);
      g.fill();
      puntosAcc.push({ x: px, y: py, r: rp });
    }
  }
  g.globalAlpha = alfa;
  const ph = base;

  if (circulo > 0.01) {
    g.globalAlpha = alfa * circulo;
    for (const signo of [1, -1]) {
      g.strokeStyle = signo > 0 ? '#eb9b3c' : '#2f9a80';
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(CX + (signo * R * Math.cos(ph)) / 2, CY + (signo * R * Math.sin(ph)) / 2, R / 2, 0, 7);
      g.stroke();
    }
  }
  g.restore();
}

/** Dibuja una molécula/átomo orbital condensado. */
export function dibujarAtomo(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  alfa: number,
  giro: number,
  color: string,
): void {
  if (alfa <= 0.01) return;
  g.save();
  g.globalAlpha = alfa;
  g.translate(x, y);
  g.rotate(giro);
  g.strokeStyle = color;
  g.lineWidth = 1.4;
  for (const rot of [0, Math.PI / 3, -Math.PI / 3]) {
    g.save();
    g.rotate(rot);
    g.beginPath();
    g.ellipse(0, 0, r, r * 0.4, 0, 0, 7);
    g.stroke();
    g.restore();
  }
  g.fillStyle = color;
  g.beginPath();
  g.arc(0, 0, r * 0.28, 0, 7);
  g.fill();
  g.restore();
}

/** Dibuja texto formateado de diálogos. */
export function dibujarTexto(
  ctx: PrologoFrameContext,
  str: string,
  y: number,
  alfa: number,
  tam: number,
  color?: string,
  xf?: number,
  fuente?: 'mono' | 'serif',
): void {
  const { g, W } = ctx;
  if (alfa <= 0.01) return;
  g.save();
  g.globalAlpha = alfa;
  g.fillStyle = color || '#eef1f4';
  const x = W * (xf === undefined ? 0.5 : xf);
  g.font =
    fuente === 'mono'
      ? `${tam}px "JetBrains Mono","Cascadia Mono",Consolas,ui-monospace,monospace`
      : `${tam}px "Fraunces","Palatino Linotype",Georgia,serif`;
  g.textAlign = 'center';
  const maxAncho = W * 0.86;
  const lineas: string[] = [];
  for (const parrafo of str.split('\n')) {
    let linea = '';
    for (const p of parrafo.split(' ')) {
      const prueba = (linea + ' ' + p).trim();
      if (linea && g.measureText(prueba).width > maxAncho) {
        lineas.push(linea);
        linea = p;
      } else linea = prueba;
    }
    lineas.push(linea);
  }
  const alto = (lineas.length - 1) * (tam * 1.35);
  lineas.forEach((l, i) => g.fillText(l, x, y - alto / 2 + i * (tam * 1.35)));
  g.restore();
}

/** Dibuja la luz cálida de la lamparita de la mascota. */
export function dibujarLamparita(
  ctx: PrologoFrameContext,
  x: number,
  y: number,
  nacida: number,
): void {
  const { g, W, H, t, anclajes: T } = ctx;
  if (nacida < 0.6) return;
  const pulso = 0.5 + 0.5 * Math.sin((t - T.choque) * 0.0016);
  const r = W * 0.042 * (0.86 + pulso * 0.24);
  const lx = x - W * 0.066;
  const ly = y - H * 0.077;
  const halo = g.createRadialGradient(lx, ly, 0, lx, ly, r);
  halo.addColorStop(0, `rgba(255,214,120,${(0.2 + pulso * 0.16) * nacida})`);
  halo.addColorStop(0.45, `rgba(255,190,90,${(0.08 + pulso * 0.07) * nacida})`);
  halo.addColorStop(1, 'rgba(255,190,90,0)');
  g.save();
  g.fillStyle = halo;
  g.beginPath();
  g.arc(lx, ly, r, 0, 7);
  g.fill();
  g.restore();
}

/** Posiciona el elemento HTML <img> de la mascota sobre el escenario. */
export function actualizarPosicionMascota(
  ctx: PrologoFrameContext,
  x: number,
  y: number,
  escala: number,
  alfa: number,
): void {
  const { mascotaEl, stageWidth, W } = ctx;
  if (!mascotaEl) return;
  const sW = stageWidth || mascotaEl.parentElement?.clientWidth || W;
  const k = sW / W;
  const ancho = mascotaEl.clientWidth || sW * 0.18;
  mascotaEl.style.opacity = String(alfa);
  mascotaEl.style.transform = `translate(${x * k - ancho / 2}px, ${y * k - ancho / 2}px) scale(${escala})`;
}

/**
 * Función central de renderizado: dibuja un frame completo del prólogo para cualquier tiempo `t`.
 */
export function renderPrologoFrame(ctx: PrologoFrameContext): PuntoParticula[] {
  const { g, W, H, CX, CY, t, reloj, anclajes: T, mascotaEl } = ctx;
  const puntos: PuntoParticula[] = [];

  const fondo = clamp01((t - T.orden) / 3400);
  g.fillStyle = fondo > 0 ? mezclarColores('#07080c', '#f4f2ea', ease(fondo)) : '#07080c';
  g.fillRect(0, 0, W, H);

  const CERCA = 2.8;
  const zoom =
    t < T.zoom
      ? 0.05 + clamp01((t - T.anomalia) / (T.zoom - T.anomalia)) * 0.13
      : t < T.orden
        ? 0.16 + ease(clamp01((t - T.zoom) / 2200)) * (CERCA - 0.16)
        : CERCA - ease(clamp01((t - T.orden) / 3200)) * (CERCA - 0.88);

  const patronAlfa =
    0.05 +
    clamp01((t - T.anomalia) / (T.zoom - T.anomalia)) * 0.35 +
    clamp01((t - T.zoom + 400) / 1800) * 0.6;

  const warp = clamp01(1 - Math.abs(t - (T.zoom + 250)) / 850);
  dibujarEstrellas(ctx, clamp01(1 - fondo * 1.2), warp);

  const crece = 0.25 + clamp01((t - T.anomalia) / (T.zoom - T.anomalia)) * 0.75;
  dibujarFaro(ctx, crece * clamp01(1 - (t - T.zoom - 400) / 1400) * (1 + warp * 1.4));

  if (warp > 0.01) {
    g.save();
    g.globalAlpha = warp * 0.5;
    const fl = g.createRadialGradient(CX, CY, 0, CX, CY, W * 0.6);
    fl.addColorStop(0, 'rgba(255,246,228,0.9)');
    fl.addColorStop(0.5, 'rgba(235,155,60,0.18)');
    fl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fl;
    g.fillRect(0, 0, W, H);
    g.restore();
  }

  const enOrden = t >= T.orden;
  const cuantas = enOrden
    ? clamp01((t - T.orden - 300) / 3600) * TOTAL_CUERDAS + 0.6
    : TOTAL_CUERDAS;
  const sync = clamp01((t - T.orden - 600) / 3000);
  const circulo = clamp01((t - T.orden - 2600) / 2000);

  let aCaos = 0;
  for (const d of reloj) {
    if (t >= d.t0 && t < d.t1) {
      aCaos = Math.max(aCaos, clamp01((t - d.t0) / 500) * clamp01((d.t1 - t) / 450));
    }
  }

  const ACERCA = 1400,
    CHOQUE = T.choque;
  const REUNION = Math.min(15000, Math.max(2000, CHOQUE - ACERCA - T.fusion));
  let fusion: FusionEstado | null = null;
  if (t >= T.fusion && t < T.orden) {
    const p = Math.pow(clamp01((t - T.fusion) / REUNION), 0.62);
    const acerca = ease(clamp01((t - (CHOQUE - ACERCA)) / ACERCA));
    const sep = 150 * (1 - acerca);
    const vivo = 1 - clamp01((t - CHOQUE) / 260);
    fusion = { p, vivo, acerca, a: { x: CX - sep, y: CY }, b: { x: CX + sep, y: CY } };
  }

  dibujarPatron(
    ctx,
    zoom,
    patronAlfa * (1 - aCaos * 0.62),
    Math.ceil(cuantas),
    sync,
    fondo < 0.5,
    circulo,
    fusion,
    puntos,
  );

  g.save();
  g.globalAlpha = 1 - aCaos * 0.4;
  dibujarBala(ctx, puntos);
  dibujarNaves(ctx, puntos);
  dibujarOperadores(ctx);
  dibujarExploradora(ctx);
  g.restore();

  if (fusion) {
    const a = clamp01((fusion.p - 0.3) / 0.35) * fusion.vivo * (1 - aCaos * 0.45);
    dibujarAtomo(g, fusion.a.x, fusion.a.y, 30, a, t * 0.002, '#eb9b3c');
    dibujarAtomo(g, fusion.b.x, fusion.b.y, 30, a, -t * 0.002, '#2f9a80');

    const destello = clamp01(1 - Math.abs(t - CHOQUE) / 320);
    if (destello > 0.01) {
      g.save();
      g.globalAlpha = destello * 0.85;
      const rg = g.createRadialGradient(CX, CY, 0, CX, CY, 190 * destello + 40);
      rg.addColorStop(0, 'rgba(255,255,255,0.95)');
      rg.addColorStop(0.4, 'rgba(235,155,60,0.5)');
      rg.addColorStop(1, 'rgba(47,154,128,0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
  }

  for (const d of reloj) {
    if (t < d.t0 || t >= d.t1) continue;
    const a = clamp01((t - d.t0) / PRESUPUESTO.entra) * clamp01((d.t1 - t) / PRESUPUESTO.sale);
    const e = ESTILO_HABLANTE[d.quien];
    dibujarTexto(ctx, d.txt, H * e.y, a, e.tam, e.color, e.x, e.fuente);
  }

  if (t >= CHOQUE && t < T.orden) {
    const n = clamp01((t - CHOQUE) / 520);
    const flota = ease(clamp01((t - CHOQUE - 400) / 1400)) * H * 0.075;
    const respira =
      Math.sin((t - CHOQUE) * 0.00105) * H * 0.011 * ease(clamp01((t - CHOQUE) / 1200));
    const late = 1 + Math.sin((t - CHOQUE) * 0.0009 + 1.1) * 0.018;
    const alto = CY - flota + respira;
    dibujarLamparita(ctx, CX, alto, n);
    actualizarPosicionMascota(ctx, CX, alto, (0.25 + ease(n) * 0.85) * late, n);
  } else if (t >= T.orden) {
    const q = ease(clamp01((t - T.orden) / 2600));
    actualizarPosicionMascota(
      ctx,
      CX - q * (W * 0.34),
      CY - H * 0.075 + q * (H * 0.375),
      1.1 - q * 0.35,
      1,
    );
  } else if (mascotaEl) {
    mascotaEl.style.opacity = '0';
  }

  if (t > T.fin - 2600) {
    dibujarTexto(
      ctx,
      'Angular Signals',
      H * 0.93,
      clamp01((t - (T.fin - 2600)) / 1400),
      44,
      '#201d16',
    );
  }

  return puntos;
}
