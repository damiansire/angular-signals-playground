import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  IMPACTO,
  alcanceDelGolpe,
  asentar,
  avanzarMuelle,
  crearMuelle,
  emitirImpacto,
  enReposo,
  limitar,
  motorDeMuelles,
  sinMovimiento,
  tironElastico,
  type DetalleDeImpacto,
  type Muelle,
} from '../../libs/muelle';
import { despedir, palabra } from '../../libs/rastros';
import {
  claveDeEnlace,
  puntoDelCable,
  origenesDelCambio,
  type EnlaceCircuito,
  type NodoCircuito,
} from './circuito.modelo';

const UMBRAL_AGARRE = 6;
const DURACION_PULSO_S = 0.34;
/** Lo que un nodo arrastra a sus vecinos: están unidos por un enlace, no flotando sueltos. */
const ARRASTRE_DEL_VECINO = 0.16;
/** Más que esto ya no es redondo: una órbita girando se saldría del nodo y pisaría a los vecinos. */
const LARGO_DE_UN_NODO_REDONDO = 7;

interface Cuerpo {
  el: HTMLElement;
  /** Centro en reposo, relativo al circuito (`offset*`: el warp del sub-nivel no lo distorsiona). */
  cx: number;
  cy: number;
  x: Muelle;
  y: Muelle;
  aplastar: Muelle;
  giro: Muelle;
}

interface Cable {
  el: SVGPathElement;
  enlace: EnlaceCircuito;
  /** 1 conectado, 0 suelto. Es un muelle: reconectarse se ve como un latigazo, no como un corte. */
  union: Muelle;
  temblor: Muelle;
}

interface Pulso {
  cable: Cable;
  t: number;
  el: SVGCircleElement;
}

/**
 * Un grafo de signals que se puede tocar. Los valores son los de signals REALES del demo que lo usa:
 * cuando uno cambia, el circuito lo ve, lo sacude y manda un pulso por sus enlaces vivos hasta cada
 * consumidor. Un enlace suelto no lleva nada, y eso es justamente lo que se ve.
 *
 * Los nodos con `accion` son botones de verdad. Agarrar cualquier nodo lo estira y sus vecinos lo
 * acompañan; soltarlo lo devuelve con rebote. Con todo quieto no queda ningún cuadro agendado.
 */
@Component({
  selector: 'app-circuito',
  imports: [NgTemplateOutlet],
  templateUrl: './circuito.component.html',
  styleUrl: './circuito.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CircuitoComponent {
  readonly nodos = input.required<readonly NodoCircuito[]>();
  readonly enlaces = input<readonly EnlaceCircuito[]>([]);
  /** Se activó el nodo con `accion` de ese id. */
  readonly tocado = output<string>();

  protected readonly columnas = computed(() => Math.max(...this.nodos().map((n) => n.col)));
  protected readonly claveDeEnlace = claveDeEnlace;
  protected readonly aviso = signal('');

  private readonly raiz: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  private readonly cuerpos = new Map<string, Cuerpo>();
  private readonly cables = new Map<string, Cable>();
  private readonly pulsos = new Set<Pulso>();
  private valoresPrevios: ReadonlyMap<string, string> | null = null;

  private agarre: {
    id: number;
    cuerpo: Cuerpo;
    x0: number;
    y0: number;
    arrastro: boolean;
  } | null = null;
  private huboArrastre = false;
  private avisos = 0;

  constructor() {
    afterRenderEffect(() => {
      const nodos = this.nodos();
      const enlaces = this.enlaces();
      untracked(() => this.sincronizar(nodos, enlaces));
    });
    afterNextRender(() => this.arrancar());
  }

  private arrancar(): void {
    const sacar = motorDeMuelles().agregar((dt) => this.cuadro(dt));
    const alImpacto = (e: Event): void =>
      this.alImpacto((e as CustomEvent<DetalleDeImpacto>).detail);
    const alClick = (e: MouseEvent): void => {
      if (!this.huboArrastre) return;
      this.huboArrastre = false;
      e.stopPropagation();
      e.preventDefault();
    };
    const observador = new ResizeObserver(() => {
      this.medir();
      this.pintar();
    });
    observador.observe(this.raiz);
    window.addEventListener(IMPACTO, alImpacto);
    this.raiz.addEventListener('click', alClick, { capture: true });
    this.destroyRef.onDestroy(() => {
      sacar();
      observador.disconnect();
      window.removeEventListener(IMPACTO, alImpacto);
      this.pulsos.forEach((p) => p.el.remove());
      this.pulsos.clear();
    });
  }

  // ─── Lo que le pide el demo ──────────────────────────────────────────────────────────────────

  /** El valor de ese nodo cambió: reacciona y avisa a quienes lo leen. */
  disparar(id: string): void {
    this.golpear(id, 1);
    this.lanzarPulsos(id);
  }

  /** Lo miraron sin cambiarlo: reacciona, pero no le avisa a nadie. */
  reaccionar(id: string): void {
    this.golpear(id, 0.7);
  }

  /** Una escritura que no entra: el nodo la rechaza, y el rechazo se ve y se siente. */
  rebotar(id: string, texto: string): void {
    const c = this.cuerpos.get(id);
    if (!c) return;
    palabra(this.raiz, c.cx, c.cy - c.el.offsetHeight / 2, texto, '#8f2b1c');
    // El mismo rebote dos veces no cambiaría el texto, y un lector de pantalla no lo volvería a decir.
    this.aviso.set(`${id}: ${texto}${++this.avisos % 2 ? '' : '\u00a0'}`);
    if (sinMovimiento()) return;
    c.x.v += 520;
    c.giro.v += 70;
    c.aplastar.v -= 3;
    motorDeMuelles().despertar();
    const r = c.el.getBoundingClientRect();
    emitirImpacto(this.raiz, { x: r.left + r.width / 2, y: r.top + r.height / 2, fuerza: 0.45 });
  }

  /** Lo que un `set()` acaba de reemplazar sale despedido. */
  despedirValor(id: string, texto: string, lado: 1 | -1 = 1): void {
    const c = this.cuerpos.get(id);
    if (c) despedir(this.raiz, c.cx, c.cy - c.el.offsetHeight / 3, texto, lado);
  }

  protected esLargo(nodo: NodoCircuito): boolean {
    return (
      (nodo.valor?.length ?? 0) > LARGO_DE_UN_NODO_REDONDO ||
      nodo.nombre.length > LARGO_DE_UN_NODO_REDONDO
    );
  }

  // ─── Estado ──────────────────────────────────────────────────────────────────────────────────

  private sincronizar(nodos: readonly NodoCircuito[], enlaces: readonly EnlaceCircuito[]): void {
    const vivos = new Set<string>();
    for (const el of this.raiz.querySelectorAll<HTMLElement>('[data-nodo]')) {
      const id = el.dataset['nodo'] ?? '';
      vivos.add(id);
      const c = this.cuerpos.get(id);
      if (c) {
        c.el = el;
        continue;
      }
      this.cuerpos.set(id, {
        el,
        cx: 0,
        cy: 0,
        x: crearMuelle(0, 170, 11),
        y: crearMuelle(0, 170, 11),
        aplastar: crearMuelle(0, 260, 10),
        giro: crearMuelle(0, 130, 9),
      });
    }
    for (const id of [...this.cuerpos.keys()]) if (!vivos.has(id)) this.cuerpos.delete(id);

    const claves = new Set<string>();
    for (const enlace of enlaces) {
      const clave = claveDeEnlace(enlace);
      claves.add(clave);
      const el = this.raiz.querySelector<SVGPathElement>(`[data-enlace="${clave}"]`);
      if (!el) continue;
      const conectado = enlace.vivo !== false;
      const cable = this.cables.get(clave);
      if (!cable) {
        const union = crearMuelle(conectado ? 1 : 0, 150, 11);
        this.cables.set(clave, { el, enlace, union, temblor: crearMuelle(0, 140, 7) });
        continue;
      }
      cable.el = el;
      cable.enlace = enlace;
      cable.union.destino = conectado ? 1 : 0;
      if (sinMovimiento()) asentar(cable.union);
      else if (cable.union.x !== cable.union.destino) cable.temblor.v += conectado ? 240 : -240;
    }
    for (const clave of [...this.cables.keys()]) if (!claves.has(clave)) this.cables.delete(clave);

    this.medir();

    // La primera pasada solo toma nota: montar la pantalla no es un cambio.
    const valores = new Map(nodos.map((n) => [n.id, n.valor ?? '']));
    if (this.valoresPrevios) {
      for (const id of origenesDelCambio(this.valoresPrevios, valores, enlaces)) this.disparar(id);
    }
    this.valoresPrevios = valores;

    this.pintar();
    motorDeMuelles().despertar();
  }

  private medir(): void {
    for (const c of this.cuerpos.values()) {
      const celda = c.el.parentElement;
      if (!celda) continue;
      c.cx = celda.offsetLeft + celda.offsetWidth / 2;
      c.cy = celda.offsetTop + celda.offsetHeight / 2;
    }
  }

  // ─── Toque ───────────────────────────────────────────────────────────────────────────────────

  protected alApretar(e: PointerEvent): void {
    if (e.button !== 0 || !(e.target instanceof Element)) return;
    const el = e.target.closest<HTMLElement>('[data-nodo]');
    const cuerpo = el && this.cuerpos.get(el.dataset['nodo'] ?? '');
    if (!el || !cuerpo) return;
    el.setPointerCapture(e.pointerId);
    this.huboArrastre = false;
    this.agarre = { id: e.pointerId, cuerpo, x0: e.clientX, y0: e.clientY, arrastro: false };
  }

  protected alMover(e: PointerEvent): void {
    const a = this.agarre;
    if (!a || a.id !== e.pointerId) return;
    const dx = e.clientX - a.x0;
    const dy = e.clientY - a.y0;
    if (!a.arrastro) {
      if (Math.hypot(dx, dy) < UMBRAL_AGARRE) return;
      a.arrastro = true;
      this.huboArrastre = true;
    }
    if (sinMovimiento()) return;
    a.cuerpo.x.destino = tironElastico(dx, 110);
    a.cuerpo.y.destino = tironElastico(dy, 110);
    a.cuerpo.giro.destino = limitar(dx * 0.1, -14, 14);
    a.cuerpo.aplastar.destino = limitar(-Math.abs(dy) / 500, -0.16, 0);
    for (const v of this.vecinos(a.cuerpo)) {
      v.x.destino = a.cuerpo.x.destino * ARRASTRE_DEL_VECINO;
      v.y.destino = a.cuerpo.y.destino * ARRASTRE_DEL_VECINO;
    }
    motorDeMuelles().despertar();
  }

  protected alSoltar(e: PointerEvent): void {
    const a = this.agarre;
    if (!a || a.id !== e.pointerId) return;
    this.agarre = null;
    if (!a.arrastro) {
      this.pinchar(a.cuerpo, e);
      return;
    }
    for (const c of [a.cuerpo, ...this.vecinos(a.cuerpo)]) {
      c.x.destino = 0;
      c.y.destino = 0;
      c.giro.destino = 0;
      c.aplastar.destino = 0;
    }
    if (sinMovimiento()) {
      for (const c of [a.cuerpo, ...this.vecinos(a.cuerpo)]) {
        [c.x, c.y, c.giro, c.aplastar].forEach(asentar);
      }
      this.pintar();
    }
    motorDeMuelles().despertar();
  }

  private pinchar(c: Cuerpo, e: PointerEvent): void {
    if (sinMovimiento()) return;
    const r = c.el.getBoundingClientRect();
    const lado = limitar((e.clientX - (r.left + r.width / 2)) / (r.width / 2 || 1), -1, 1);
    c.giro.v += lado * 130;
    c.aplastar.v = Math.min(c.aplastar.v + 4.5, 6);
    emitirImpacto(this.raiz, { x: e.clientX, y: e.clientY, fuerza: 0.2 });
    motorDeMuelles().despertar();
  }

  private vecinos(c: Cuerpo): Cuerpo[] {
    const id = [...this.cuerpos].find(([, otro]) => otro === c)?.[0];
    const salida: Cuerpo[] = [];
    for (const { enlace, union } of this.cables.values()) {
      if (union.destino !== 1) continue;
      const otro = enlace.de === id ? enlace.a : enlace.a === id ? enlace.de : null;
      const v = otro ? this.cuerpos.get(otro) : undefined;
      if (v) salida.push(v);
    }
    return salida;
  }

  /** Cualquier golpe de la pantalla llega hasta acá, más fuerte cuanto más cerca. */
  private alImpacto(d: DetalleDeImpacto): void {
    if (sinMovimiento() || this.raiz.closest('[inert]')) return;
    for (const c of this.cuerpos.values()) {
      const r = c.el.getBoundingClientRect();
      if (r.width === 0) continue;
      const dx = r.left + r.width / 2 - d.x;
      const dy = r.top + r.height / 2 - d.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) continue;
      const f = d.fuerza * alcanceDelGolpe(dist, 620);
      c.x.v += (dx / dist) * f * 150;
      c.y.v += (dy / dist) * f * 150;
      c.giro.v += (dx >= 0 ? 1 : -1) * f * 34;
      c.aplastar.v = Math.min(c.aplastar.v + f * 1.5, 6);
    }
    for (const cable of this.cables.values()) cable.temblor.v += d.fuerza * 60;
    motorDeMuelles().despertar();
  }

  private golpear(id: string, f: number): void {
    const c = this.cuerpos.get(id);
    if (!c) return;
    this.brillar(c);
    if (sinMovimiento()) return;
    c.aplastar.v = Math.min(c.aplastar.v + 5.5 * f, 6);
    c.giro.v += ((c.cx * 7 + c.giro.x * 31) % 2 > 1 ? 1 : -1) * 46 * f;
    motorDeMuelles().despertar();
  }

  private brillar(c: Cuerpo): void {
    if (sinMovimiento()) return;
    c.el
      .querySelector('.ci__brillo')
      ?.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 520, easing: 'ease-out' });
  }

  private lanzarPulsos(id: string): void {
    if (sinMovimiento()) return;
    const svg = this.raiz.querySelector('.ci__cables');
    if (!svg) return;
    for (const cable of this.cables.values()) {
      if (cable.enlace.de !== id || cable.union.destino !== 1) continue;
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      el.setAttribute('r', '6');
      el.setAttribute('fill', 'var(--ci-pulso)');
      el.setAttribute('stroke', '#fffdf7');
      el.setAttribute('stroke-width', '2');
      svg.appendChild(el);
      this.pulsos.add({ cable, t: 0, el });
      cable.temblor.v += 90;
    }
    motorDeMuelles().despertar();
  }

  // ─── Cuadro ──────────────────────────────────────────────────────────────────────────────────

  private cuadro(dt: number): boolean {
    let sigue = this.agarre?.arrastro ?? false;
    for (const c of this.cuerpos.values()) {
      for (const m of [c.x, c.y, c.aplastar, c.giro]) {
        avanzarMuelle(m, dt);
        if (enReposo(m)) asentar(m);
        else sigue = true;
      }
    }
    for (const cable of this.cables.values()) {
      for (const m of [cable.union, cable.temblor]) {
        avanzarMuelle(m, dt);
        if (enReposo(m)) asentar(m);
        else sigue = true;
      }
    }
    for (const p of this.pulsos) {
      p.t += Math.min(dt, 0.034) / DURACION_PULSO_S;
      sigue = true;
      if (p.t < 1) continue;
      p.el.remove();
      this.pulsos.delete(p);
      // Llega y recién ahí el consumidor reacciona, y a su vez avisa a los suyos.
      this.disparar(p.cable.enlace.a);
    }
    this.pintar();
    return sigue;
  }

  private pintar(): void {
    for (const c of this.cuerpos.values()) {
      const a = limitar(c.aplastar.x, -0.3, 0.3);
      c.el.style.transform =
        `translate(${c.x.x.toFixed(2)}px,${c.y.x.toFixed(2)}px) rotate(${c.giro.x.toFixed(2)}deg) ` +
        `scale(${(1 + a * 0.82).toFixed(4)},${(1 - a).toFixed(4)})`;
    }
    for (const cable of this.cables.values()) {
      const de = this.cuerpos.get(cable.enlace.de);
      const a = this.cuerpos.get(cable.enlace.a);
      if (!de || !a) continue;
      const curva = this.curvaDe(cable, de, a);
      cable.el.setAttribute(
        'd',
        `M${curva.x0.toFixed(1)} ${curva.y0.toFixed(1)}Q${curva.cx.toFixed(1)} ${curva.cy.toFixed(1)} ` +
          `${curva.x1.toFixed(1)} ${curva.y1.toFixed(1)}`,
      );
      cable.el.classList.toggle('ci__cable--suelto', cable.union.destino !== 1);
    }
    for (const p of this.pulsos) {
      const de = this.cuerpos.get(p.cable.enlace.de);
      const a = this.cuerpos.get(p.cable.enlace.a);
      if (!de || !a) continue;
      const q = puntoDelCable(this.curvaDe(p.cable, de, a), p.t);
      p.el.setAttribute('cx', q.x.toFixed(1));
      p.el.setAttribute('cy', q.y.toFixed(1));
    }
  }

  /**
   * El cable se tiende entre los dos centros (los nodos son opacos y lo tapan). Suelto, cuelga desde
   * la fuente y no llega: la punta cae a mitad de camino.
   */
  private curvaDe(cable: Cable, de: Cuerpo, a: Cuerpo) {
    const x0 = de.cx + de.x.x;
    const y0 = de.cy + de.y.x;
    const xa = a.cx + a.x.x;
    const ya = a.cy + a.y.x;
    const u = limitar(cable.union.x, -0.1, 1.1);
    const xSuelta = x0 + (xa - x0) * 0.58;
    const ySuelta = y0 + (ya - y0) * 0.58 + 44;
    const x1 = xSuelta + (xa - xSuelta) * u;
    const y1 = ySuelta + (ya - ySuelta) * u;
    const largo = Math.hypot(x1 - x0, y1 - y0) || 1;
    const combado = cable.temblor.x * 0.22 + (1 - u) * 26;
    return {
      x0,
      y0,
      x1,
      y1,
      cx: (x0 + x1) / 2 + (-(y1 - y0) / largo) * combado,
      cy: (y0 + y1) / 2 + ((x1 - x0) / largo) * combado + (1 - u) * 18,
    };
  }
}
