import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  viewChild,
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
} from '../../libs/muelle';
import { chispas, palabra } from '../../libs/rastros';

/** Tamaño del dibujo: `viewBox` del SVG, y el punto de los pies, de donde se aplasta y estira. */
const LADO = 1080;
const PIES_X = 560;
const PIES_Y = 920;

/** Cuánto hay que arrastrar (en px de pantalla) para que deje de ser un toque y pase a ser agarre. */
const UMBRAL_AGARRE = 6;

const GRAVEDAD = 5200;

/** Lo que dice según dónde la tocan. Un toque en la lamparita no es lo mismo que uno en la panza. */
const PALABRAS = {
  arriba: ['¡ay!', '¡la frente!', '¡ey!'],
  foco: ['¡idea!', '¡clic!', '¡zzt!'],
  panza: ['¡jaja!', '¡cosquillas!', '¡boing!'],
  pies: ['¡mis pies!', '¡hop!', '¡ojo!'],
  harta: ['¡basta!', '¡ya va!', '¡uf!'],
  mareada: ['me mareo…', 'uuuh…'],
};

let instancias = 0;

/**
 * La mascota de Angular, dibujada en línea para poder moverle cada parte. Cada parte es un muelle:
 * un toque suma velocidad según dónde cayó, agarrarla la estira, soltarla la hace caer, y cualquier
 * golpe de la pantalla (`impacto-vivo`) la sacude según la distancia.
 *
 * Es decoración viva, no contenido: el SVG va `aria-hidden` y quien la usa decide si la envuelve en
 * un botón. Por eso `tocada` sale también al activarla sin puntero: basta con llamar a `saludar`.
 */
@Component({
  selector: 'app-mascota-viva',
  templateUrl: './mascota-viva.component.html',
  styleUrl: './mascota-viva.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MascotaVivaComponent {
  /** Un toque sin arrastre: quien la envuelve puede responder (abrir la pista, por ejemplo). */
  readonly tocada = output<void>();
  /** Cayó después de un agarre, con la fuerza del golpe. */
  readonly aterrizo = output<number>();

  protected readonly uid = `mv${++instancias}-`;

  private readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly lienzo = viewChild.required<ElementRef<SVGSVGElement>>('lienzo');
  private readonly elCuerpo = viewChild.required<ElementRef<SVGGElement>>('cuerpo');
  private readonly elSombra = viewChild.required<ElementRef<SVGEllipseElement>>('sombra');
  private readonly elBrazoL = viewChild.required<ElementRef<SVGGElement>>('brazoL');
  private readonly elBrazoR = viewChild.required<ElementRef<SVGGElement>>('brazoR');
  private readonly elFoco = viewChild.required<ElementRef<SVGGElement>>('foco');
  private readonly elCara = viewChild.required<ElementRef<SVGGElement>>('cara');
  private readonly elRostro = viewChild.required<ElementRef<SVGGElement>>('rostro');
  private readonly elOjos = viewChild.required<ElementRef<SVGGElement>>('ojos');
  private readonly elCejaL = viewChild.required<ElementRef<SVGGElement>>('cejaL');
  private readonly elCejaR = viewChild.required<ElementRef<SVGGElement>>('cejaR');
  private readonly elBoca = viewChild.required<ElementRef<SVGGElement>>('boca');
  private readonly elPiernaL = viewChild.required<ElementRef<SVGGElement>>('piernaL');
  private readonly elPiernaR = viewChild.required<ElementRef<SVGGElement>>('piernaR');

  // Poca amortiguación en el cuerpo: que oscile varias veces antes de quedarse es la gelatina.
  private readonly m = {
    aplastar: crearMuelle(0, 260, 11),
    giro: crearMuelle(0, 130, 10),
    torcer: crearMuelle(0, 200, 10),
    cara: crearMuelle(0, 170, 9),
    brazoL: crearMuelle(0, 170, 12),
    brazoR: crearMuelle(0, 170, 12),
    foco: crearMuelle(0, 70, 6),
    piernas: crearMuelle(0, 120, 9),
    x: crearMuelle(0, 90, 13),
    y: crearMuelle(0, 90, 13),
    mirarX: crearMuelle(0, 120, 16),
    mirarY: crearMuelle(0, 120, 16),
    cejas: crearMuelle(0, 160, 14),
    boca: crearMuelle(0, 220, 14),
  };
  private readonly muelles = Object.values(this.m);

  private agarre: {
    id: number;
    x0: number;
    y0: number;
    arrastro: boolean;
    escala: number;
  } | null = null;
  /** Solo se pisa `true` si el último gesto fue un arrastre: ese click no es un toque. */
  private huboArrastre = false;
  private cayendo = false;
  private paciencia = 0;
  private ultimoToque = 0;
  private temporizadores = new Set<ReturnType<typeof setTimeout>>();

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.arrancar());
  }

  private arrancar(): void {
    const motor = motorDeMuelles();
    const sacar = motor.agregar((dt) => this.cuadro(dt));
    const alImpacto = (e: Event): void =>
      this.alImpacto((e as CustomEvent<DetalleDeImpacto>).detail);
    const alMover = (e: PointerEvent): void => this.seguirConLaMirada(e);
    const alSoltar = (e: PointerEvent): void => this.alSoltar(e);
    const alArrastrar = (e: PointerEvent): void => this.alArrastrar(e);
    // El click que cierra un arrastre tiene que morir acá: si la envuelve un botón, se dispararía.
    const alClick = (e: MouseEvent): void => {
      if (!this.huboArrastre) return;
      this.huboArrastre = false;
      e.stopPropagation();
      e.preventDefault();
    };
    window.addEventListener(IMPACTO, alImpacto);
    window.addEventListener('pointermove', alMover, { passive: true });
    this.host.addEventListener('pointermove', alArrastrar);
    this.host.addEventListener('pointerup', alSoltar);
    this.host.addEventListener('pointercancel', alSoltar);
    this.host.addEventListener('click', alClick, { capture: true });
    this.destroyRef.onDestroy(() => {
      sacar();
      window.removeEventListener(IMPACTO, alImpacto);
      window.removeEventListener('pointermove', alMover);
      this.temporizadores.forEach(clearTimeout);
      this.temporizadores.clear();
    });
    this.pintar();
  }

  /** Reacción sin puntero: para el teclado, y para quien la quiere saludando al cambiar de capítulo. */
  saludar(): void {
    if (sinMovimiento() || this.cayendo || this.agarre) return;
    this.m.brazoR.v -= 420;
    this.m.aplastar.v = Math.min(this.m.aplastar.v + 3, 6.5);
    this.m.cejas.v -= 200;
    this.despertar();
  }

  /** Un saltito: el aviso de que pasó algo que vale la pena mirar. */
  saltar(fuerza = 1): void {
    if (sinMovimiento() || this.cayendo || this.agarre) return;
    this.m.aplastar.v = Math.min(this.m.aplastar.v + 3.2 * fuerza, 6.5);
    this.m.y.v -= 900 * fuerza;
    this.cayendo = true;
    this.despertar();
  }

  /** Dónde está en la pantalla ahora. Si no se ve, no reacciona: puede ser una card pre-montada. */
  private rectVisible(): DOMRect | null {
    if (this.host.closest('[inert]')) return null;
    const r = this.host.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight ? r : null;
  }

  private despertar(): void {
    motorDeMuelles().despertar();
  }

  // ─── Toque y agarre ──────────────────────────────────────────────────────────────────────────

  protected alApretar(e: PointerEvent): void {
    if (e.button !== 0) return;
    const r = this.host.getBoundingClientRect();
    // Un `<button>` que la envuelva igual recibe el click: la captura no lo impide.
    this.lienzo().nativeElement.setPointerCapture(e.pointerId);
    this.huboArrastre = false;
    this.agarre = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      arrastro: false,
      escala: LADO / Math.max(r.width, 1),
    };
  }

  private alArrastrar(e: PointerEvent): void {
    const a = this.agarre;
    if (!a || a.id !== e.pointerId) return;
    const dx = e.clientX - a.x0;
    const dy = e.clientY - a.y0;
    if (!a.arrastro) {
      if (Math.hypot(dx, dy) < UMBRAL_AGARRE) return;
      a.arrastro = true;
      this.huboArrastre = true;
      this.cayendo = false;
      this.host.classList.add('mv--agarrada');
    }
    if (sinMovimiento()) return;
    // El tirón cuesta cada vez más: se persigue el puntero sin soltarse nunca de su lugar.
    const x = tironElastico(dx, 150) * a.escala;
    const y = tironElastico(dy, 150) * a.escala;
    this.m.x.destino = x;
    this.m.y.destino = Math.min(y, 40);
    this.m.giro.destino = limitar(x * 0.035, -28, 28);
    // Hacia arriba se estira; hacia abajo se aplasta contra el piso.
    this.m.aplastar.destino = limitar(y / 1400, -0.3, 0.2);
    this.m.brazoL.destino = limitar(-y * 0.1 - x * 0.05, -70, 70);
    this.m.brazoR.destino = limitar(y * 0.1 - x * 0.05, -70, 70);
    this.m.piernas.destino = limitar(-x * 0.03, -22, 22);
    this.m.boca.destino = 0.8;
    this.m.cejas.destino = -14;
    this.despertar();
  }

  private alSoltar(e: PointerEvent): void {
    const a = this.agarre;
    if (!a || a.id !== e.pointerId) return;
    this.agarre = null;
    this.host.classList.remove('mv--agarrada');
    if (a.arrastro) {
      for (const k of [
        this.m.x,
        this.m.giro,
        this.m.aplastar,
        this.m.brazoL,
        this.m.brazoR,
        this.m.piernas,
        this.m.boca,
        this.m.cejas,
      ]) {
        k.destino = 0;
      }
      if (sinMovimiento()) {
        this.muelles.forEach(asentar);
        this.pintar();
        return;
      }
      // El alto no vuelve con muelle: cae. El muelle queda para lo horizontal.
      this.m.y.destino = 0;
      this.cayendo = true;
      this.despertar();
      return;
    }
    this.tocar(e);
    this.tocada.emit();
  }

  private tocar(e: PointerEvent): void {
    const r = this.host.getBoundingClientRect();
    const lx = ((e.clientX - r.left) / Math.max(r.width, 1)) * LADO - PIES_X;
    const ly = ((e.clientY - r.top) / Math.max(r.height, 1)) * LADO - PIES_Y;
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const ahora = performance.now();
    // Se le pasa sola: el contador baja con el tiempo.
    this.paciencia = Math.max(0, this.paciencia - (ahora - this.ultimoToque) / 900) + 1;
    this.ultimoToque = ahora;

    const zona =
      lx < -220 && ly < -420 ? 'foco' : ly < -500 ? 'arriba' : ly > -150 ? 'pies' : 'panza';
    const lista =
      this.paciencia > 8 ? PALABRAS.mareada : this.paciencia > 5 ? PALABRAS.harta : PALABRAS[zona];
    palabra(this.host, px, py - 8, lista[Math.floor(ahora) % lista.length], '#7a0a4e');
    chispas(this.host, px, py, zona === 'foco' ? '#ffb900' : '#e90464', 6);

    if (sinMovimiento()) return;
    const lado = limitar(lx / 300, -1, 1);
    this.m.giro.v += lado * 170 + (ahora % 60) - 30;
    this.m.torcer.v += lado * -70;
    this.m.aplastar.v = Math.min(this.m.aplastar.v + (zona === 'arriba' ? 7 : 5), 6.5);
    this.m.cara.v += lado * 260;
    this.m.brazoL.v += 280 + lado * 120;
    this.m.brazoR.v += -280 + lado * 120;
    this.m.foco.v += lado * 240 + (zona === 'foco' ? 300 : 0);
    this.m.piernas.v += lado * -120;
    this.m.boca.v += 14;
    this.m.cejas.v += this.paciencia > 3 ? 120 : -160;
    this.m.cejas.destino = this.paciencia > 3 ? 12 : 0;
    this.host.classList.toggle('mv--mareada', this.paciencia > 8);
    if (this.paciencia > 8) this.m.giro.v += 240;
    this.despues(() => {
      this.m.cejas.destino = 0;
      this.host.classList.remove('mv--mareada');
      this.despertar();
    }, 1500);
    emitirImpacto(this.host, { x: e.clientX, y: e.clientY, fuerza: 0.35 });
    this.despertar();
  }

  private despues(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      this.temporizadores.delete(id);
      fn();
    }, ms);
    this.temporizadores.add(id);
  }

  // ─── El mundo le pega ────────────────────────────────────────────────────────────────────────

  private alImpacto(d: DetalleDeImpacto): void {
    const r = this.rectVisible();
    if (!r || sinMovimiento() || this.agarre) return;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    // Su propio toque también pasa por acá: no se sacude dos veces con el mismo golpe.
    if (d.x > r.left && d.x < r.right && d.y > r.top && d.y < r.bottom) return;
    const dx = cx - d.x;
    const dy = cy - d.y;
    const cerca = alcanceDelGolpe(Math.hypot(dx, dy));
    const s = dx >= 0 ? 1 : -1;
    const f = d.fuerza * cerca;
    this.m.giro.v += s * f * 150;
    this.m.torcer.v += -s * f * 50;
    this.m.aplastar.v = Math.min(this.m.aplastar.v + f * 3.5, 6.5);
    this.m.cara.v += s * f * 120;
    this.m.foco.v += s * f * 180;
    this.m.brazoL.v += f * 100;
    this.m.brazoR.v -= f * 100;
    this.mirarHacia(d.x, d.y, r);
    this.m.cejas.v -= f * 120;
    this.m.boca.v += f * 8;
    this.despues(() => {
      this.m.mirarX.destino = 0;
      this.m.mirarY.destino = 0;
      this.despertar();
    }, 900);
    this.despertar();
  }

  private seguirConLaMirada(e: PointerEvent): void {
    if (e.pointerType !== 'mouse' || this.agarre || sinMovimiento()) return;
    const r = this.rectVisible();
    if (!r) return;
    this.mirarHacia(e.clientX, e.clientY, r);
    this.despertar();
  }

  /** Con límite: los ojos miran hacia ahí sin salirse de la cara. */
  private mirarHacia(x: number, y: number, r: DOMRect): void {
    const dx = x - (r.left + r.width / 2);
    const dy = y - (r.top + r.height * 0.56);
    const d = Math.hypot(dx, dy) || 1;
    const alcance = Math.min(d / 90, 1);
    this.m.mirarX.destino = (dx / d) * 14 * alcance;
    this.m.mirarY.destino = (dy / d) * 11 * alcance;
  }

  // ─── Cuadro ──────────────────────────────────────────────────────────────────────────────────

  private cuadro(dt: number): boolean {
    let sigue = false;
    for (const k of this.muelles) {
      if (k === this.m.y && this.cayendo) continue;
      avanzarMuelle(k, dt);
      if (enReposo(k)) asentar(k);
      else sigue = true;
    }
    if (this.cayendo) {
      this.caer(Math.min(dt, 0.034));
      sigue = true;
    }
    if (this.agarre?.arrastro) sigue = true;
    this.pintar();
    return sigue;
  }

  private caer(dt: number): void {
    const y = this.m.y;
    y.v += GRAVEDAD * dt;
    y.x += y.v * dt;
    if (y.x < 0) return;
    y.x = 0;
    const golpe = y.v;
    if (golpe < 240) {
      y.v = 0;
      this.cayendo = false;
      return;
    }
    y.v = -golpe * 0.42;
    const f = limitar(golpe / 2600, 0.1, 1);
    this.m.aplastar.v = Math.min(this.m.aplastar.v + 6 * f, 6.5);
    this.m.foco.v += 120 * f;
    this.m.piernas.v += f * 60;
    this.m.boca.v += 12 * f;
    if (f < 0.25) return;
    const r = this.host.getBoundingClientRect();
    const piesY = (PIES_Y / LADO) * r.height;
    chispas(this.host, r.width * 0.5, piesY, 'rgba(140,110,90,.75)', 8);
    emitirImpacto(this.host, { x: r.left + r.width / 2, y: r.top + piesY, fuerza: f });
    this.aterrizo.emit(f);
  }

  private pintar(): void {
    const m = this.m;
    const aplastar = limitar(m.aplastar.x, -0.4, 0.4);
    set(
      this.elCuerpo(),
      `translate(${n(m.x.x)} ${n(m.y.x)}) translate(${PIES_X} ${PIES_Y}) rotate(${n(m.giro.x)}) ` +
        `skewX(${n(m.torcer.x)}) scale(${n(1 + aplastar * 0.82)} ${n(1 - aplastar)}) ` +
        `translate(${-PIES_X} ${-PIES_Y})`,
    );
    // La sombra se achica cuando se despega del piso.
    const altura = limitar(-m.y.x / 900, 0, 0.7);
    set(
      this.elSombra(),
      `translate(${PIES_X + m.x.x} 930) scale(${n(1 - altura + aplastar * 0.5)} ${n(1 - altura * 0.6)}) translate(${-PIES_X} -930)`,
    );
    this.elSombra().nativeElement.style.opacity = n(1 - altura * 0.7);
    set(this.elBrazoL(), `rotate(${n(m.brazoL.x)} 286.7 557.42)`);
    set(this.elBrazoR(), `rotate(${n(m.brazoR.x)} 828.71 623.84)`);
    set(this.elFoco(), `rotate(${n(m.foco.x)} 184 470)`);
    set(this.elCara(), `translate(${n(m.cara.x * 0.5)} 0)`);
    set(this.elRostro(), `translate(${n(m.cara.x)} ${n(m.aplastar.x * 18)})`);
    set(this.elOjos(), `translate(${n(m.mirarX.x)} ${n(m.mirarY.x)})`);
    set(this.elCejaL(), `translate(0 ${n(m.cejas.x)}) rotate(${n(m.cejas.x * 0.5)} 463 547)`);
    set(this.elCejaR(), `translate(0 ${n(m.cejas.x)}) rotate(${n(-m.cejas.x * 0.5)} 612 563)`);
    const boca = limitar(1 + m.boca.x, 0.5, 2.2);
    set(
      this.elBoca(),
      `translate(526.58 650) scale(${n(1 + m.boca.x * 0.2)} ${n(boca)}) translate(-526.58 -650)`,
    );
    set(this.elPiernaL(), `rotate(${n(m.piernas.x)} 465 770)`);
    set(this.elPiernaR(), `rotate(${n(m.piernas.x)} 650 790)`);
  }
}

function set(el: ElementRef<SVGElement>, transform: string): void {
  el.nativeElement.setAttribute('transform', transform);
}

function n(valor: number): string {
  return Number.isFinite(valor) ? valor.toFixed(2) : '0';
}
