import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  untracked,
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
import { posturaDePaso, type PosturaDePaso } from './caminar';
import { movidaDelTiempo } from './escuchar';
import { elegirOcurrencia, esperaHastaLaProxima, type Ocurrencia } from './ocurrencias';

/** Tamaño del dibujo: `viewBox` del SVG, y el punto de los pies, de donde se aplasta y estira. */
const LADO = 1080;
const PIES_X = 560;
const PIES_Y = 920;

/** Cuánto hay que arrastrar (en px de pantalla) para que deje de ser un toque y pase a ser agarre. */
const UMBRAL_AGARRE = 6;

const GRAVEDAD = 5200;

/** La primera ocurrencia llega enseguida: es el saludo a quien acaba de llegar a la pantalla. */
const PRIMERA_OCURRENCIA_MS = 900;
/** Si la acaban de tocar, espera: un gesto suyo encima del rebote se lee como un tic. */
const RESPIRO_TRAS_TOQUE_MS = 2500;

/** Lo que dice según dónde la tocan. Un toque en la lamparita no es lo mismo que uno en la panza. */
const PALABRAS = {
  arriba: ['¡ay!', '¡la frente!', '¡ey!'],
  foco: ['¡idea!', '¡clic!', '¡zzt!'],
  panza: ['¡jaja!', '¡cosquillas!', '¡boing!'],
  pies: ['¡mis pies!', '¡hop!', '¡ojo!'],
  harta: ['¡basta!', '¡ya va!', '¡uf!'],
  mareada: ['me mareo…', 'uuuh…'],
};

/**
 * Sentada, girada hacia la derecha: otro cuerpo (`mv__perfil`), la gema del modelo 3D oficial vista
 * a 45°, con la cara 2D proyectada punto a punto sobre el visor curvo, apoyada en el pasto y con las
 * piernas estiradas ladera abajo. Una sola afín para toda la cara la deformaba: el visor es curvo y,
 * más girada, el ojo de atrás cae donde el visor ya da la espalda.
 */
const SENTADA_BAJA = 80;
/** Cuánto gira cada pierna hacia adelante; la de atrás un poco menos, para que no se tapen. */
const SENTADA_ESTIRA_L = 74;
const SENTADA_ESTIRA_R = 84;
/**
 * Las caderas van al borde de abajo de la gema de perfil: de ahí salen las piernas, una detrás de la
 * otra. Más adentro, la gema las tapaba enteras.
 */
const CADERA_L = { x: 55, y: 20 };
const CADERA_R = { x: -150, y: 15 };
/** El hombro del brazo cercano va al hueco del costado de la gema, no al del escudo de frente. */
const HOMBRO_DE_PERFIL = 'translate(54 58)';
/**
 * Sentada de frente, en el borde de la loma: la gema apoya en el filo y las piernas cuelgan ladera
 * abajo, balanceándose. Con los ojos en el cielo se lee pensativa; girada de perfil, la cara quedaba
 * lejos de quien la mira. La mano en el mentón le tapaba la cara: los brazos quedan al costado.
 */
const SENTADA_DE_FRENTE = true;
/** Pensativa mira al sol, el cielo de donde van a llegar; si no, mira su lamparita. */
const MIRA_AL_SOL = true;
/**
 * Cuánto bajan los párpados con la pena: en reposo la línea del párpado queda arriba del ojo y no
 * recorta nada.
 */
const PARPADO_ALTO = 70;
/**
 * De frente se sienta en el borde de la piedra del paisaje (y = 790 del dibujo, la altura de sus
 * caderas): queda casi a la altura de parada, y lo que cambia es que los pies ya no tocan el piso.
 * Más arriba, las piernas asomaban enteras sobre la piedra y se leía parada encima de ella.
 */
const SENTADA_EN_LA_PIEDRA = -6;
/** La sombra de contacto sube del pasto a la piedra, debajo de ella. */
const SOMBRA_EN_LA_PIEDRA = -140;
/**
 * Desde el borde de la piedra se ven las pantorrillas, no la pierna entera: un poco más cortas, y
 * entre los pies y el pasto queda piedra a la vista. Enteras, los pies llegaban al piso y se leía
 * parada delante de la piedra.
 */
const COLGADA_ALARGA = -0.22;

type Postura = 'parada' | 'caminando' | 'sentada';

/**
 * Adónde vuelve cada parte cuando no hace nada. Parada, de frente. Caminando, mira hacia donde va
 * (de costado y mirando al público se leía como un cangrejo). Sentada mira a lo lejos, un poco hacia
 * arriba y echada apenas hacia atrás: es lo que la hace pensativa sin
 * que tenga que hacer nada. La cara es melancólica, ni preocupada ni triste: párpados apenas
 * caídos y una sonrisa chica cerrada. La ceja levantada y la boca en "o" se leían como susto, y
 * las cejas muy inclinadas, como pena.
 */
const REPOSO: Record<Postura, Readonly<Record<string, number>>> = {
  parada: {},
  caminando: { cara: 12, mirarX: 12, mirarY: 1 },
  sentada: SENTADA_DE_FRENTE
    ? MIRA_AL_SOL
      ? { mirarX: 13, mirarY: -10, cara: 10, giro: 3, pena: 1 }
      : { mirarX: -12, mirarY: -10, cara: -8, giro: 3, pena: 1 }
    : { mirarX: -4, mirarY: -2, giro: -6, cejas: -4, boca: -0.3 },
};

/** Lo del reposo caminando que apunta hacia donde va: hacia la izquierda va en espejo. */
const LADEADOS = new Set(['cara', 'mirarX']);

const QUIETA: PosturaDePaso = {
  piernaL: 0,
  piernaR: 0,
  alzar: 0,
  giro: 0,
  brazoL: 0,
  brazoR: 0,
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
  host: { '[class.mv--viva]': 'vidaPropia()' },
})
export class MascotaVivaComponent {
  /**
   * Que se mueva sola: se balancea, mira alrededor, se acuerda de su idea, saluda. Es para cuando
   * ella es la escena (la pantalla de inicio); en una card o en el mapa competiría con el contenido.
   */
  readonly vidaPropia = input(false);
  /** Un toque sin arrastre: quien la envuelve puede responder (abrir la pista, por ejemplo). */
  readonly tocada = output<void>();
  /** Cayó después de un agarre, con la fuerza del golpe. */
  readonly aterrizo = output<number>();

  protected readonly uid = `mv${++instancias}-`;
  /** Ancha y con las comisuras arriba: la boca abierta y la lengua se recortan con la misma forma. */
  protected readonly sonrisa = 'M490 650Q527 668 564 650C562 674 548 690 527 690S492 674 490 650Z';

  private readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly lienzo = viewChild.required<ElementRef<SVGSVGElement>>('lienzo');
  private readonly elCuerpo = viewChild.required<ElementRef<SVGGElement>>('cuerpo');
  private readonly elSombra = viewChild.required<ElementRef<SVGEllipseElement>>('sombra');
  private readonly elBrazoL = viewChild.required<ElementRef<SVGGElement>>('brazoL');
  private readonly elBrazoR = viewChild.required<ElementRef<SVGGElement>>('brazoR');
  private readonly elFoco = viewChild.required<ElementRef<SVGGElement>>('foco');
  private readonly elCara = viewChild.required<ElementRef<SVGGElement>>('cara');
  private readonly elRostro = viewChild.required<ElementRef<SVGGElement>>('rostro');
  private readonly elRostroPerfil = viewChild.required<ElementRef<SVGGElement>>('rostroPerfil');
  private readonly elOjos = viewChild.required<ElementRef<SVGGElement>>('ojos');
  private readonly elCejaL = viewChild.required<ElementRef<SVGGElement>>('cejaL');
  private readonly elCejaR = viewChild.required<ElementRef<SVGGElement>>('cejaR');
  private readonly elBoca = viewChild.required<ElementRef<SVGGElement>>('boca');
  private readonly elParpados = viewChild.required<ElementRef<SVGPathElement>>('parpados');
  private readonly elPiernaL = viewChild.required<ElementRef<SVGGElement>>('piernaL');
  private readonly elPiernaR = viewChild.required<ElementRef<SVGGElement>>('piernaR');

  // Poca amortiguación en el cuerpo: que oscile varias veces antes de quedarse es la gelatina.
  // Sentarse no es gelatina: baja y rebota una sola vez, como quien se deja caer despacio.
  private readonly m = {
    sentar: crearMuelle(0, 90, 11),
    vaiven: crearMuelle(0, 60, 6),
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
    /** Las cejas suben apenas por el lado de adentro y los párpados bajan: la nostalgia. */
    pena: crearMuelle(0, 60, 12),
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
  private ocurrencia: Ocurrencia | null = null;
  private ladoDelPeso: 1 | -1 = 1;
  /** Los pasos del gesto en curso: dejar de tener vida propia los corta sin tocar los del toque. */
  private pasosDelGesto = new Set<ReturnType<typeof setTimeout>>();
  private postura: Postura = 'parada';
  /** El paso no es un muelle: lo dicta quien la mueve, cuadro a cuadro, según lo que avanzó. */
  private pisada: PosturaDePaso = QUIETA;
  /** Hacia dónde camina: la cara y los ojos van para ese lado. */
  private rumbo: 1 | -1 = 1;

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => this.arrancar());
    effect(() => {
      const viva = this.vidaPropia();
      untracked(() => (viva ? this.programarOcurrencia(PRIMERA_OCURRENCIA_MS) : this.aquietarse()));
    });
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
      this.pasosDelGesto.forEach(clearTimeout);
      this.pasosDelGesto.clear();
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

  /** Se vuelca hacia un lado, como quien oye algo que suena de ese lado. */
  inclinarse(lado: 1 | -1): void {
    if (sinMovimiento() || this.cayendo || this.agarre) return;
    this.m.giro.v += lado * 150;
    this.m.cara.v += lado * 240;
    this.m.cejas.v -= 180;
    this.m.aplastar.v = Math.min(this.m.aplastar.v + 2, 6.5);
    this.despertar();
  }

  /** Un suspiro: se desinfla, abre la boca para soltar el aire y se le aflojan las cejas. */
  suspirar(): void {
    if (sinMovimiento() || this.cayendo || this.agarre) return;
    this.m.aplastar.v = Math.min(this.m.aplastar.v + 2.4, 6.5);
    this.m.boca.v += 18;
    this.m.cejas.v -= 120;
    this.despertar();
  }

  /**
   * Sonríe aunque esté pensativa: la sonrisa le gana a la boca chica y a la "o". Es la cara de quien
   * ya decidió. `false` la devuelve a la boca de su postura.
   */
  sonreir(si = true): void {
    this.host.classList.toggle('mv--sonrie', si);
    if (!si || sinMovimiento() || this.agarre) return;
    this.m.boca.v += 10;
    this.m.cejas.v -= 140;
    this.despertar();
  }

  /**
   * Un tiempo de la música que oye en los auriculares (`tiempo` cuenta desde que empezó). Quien
   * tiene la música lleva el pulso; ella solo lo sigue, con sus muelles.
   */
  escuchar(tiempo: number): void {
    if (sinMovimiento() || this.cayendo || this.agarre) return;
    const { destinos, impulsos } = movidaDelTiempo(tiempo);
    for (const [parte, destino] of Object.entries(destinos)) {
      this.m[parte as keyof typeof destinos].destino = destino;
    }
    for (const [parte, impulso] of Object.entries(impulsos)) {
      this.m[parte as keyof typeof impulsos].v += impulso;
    }
    this.m.aplastar.v = Math.min(this.m.aplastar.v, 6.5);
    this.despertar();
  }

  /** Se le cortó la música: vuelve a su reposo. */
  dejarDeEscuchar(): void {
    this.calmar();
    this.despertar();
  }

  // ─── Caminar y sentarse ──────────────────────────────────────────────────────────────────────

  /**
   * Da el paso que corresponde a `fase` (en pasos desde que arrancó). Quien la lleva por la pantalla
   * calcula la fase con lo que avanzó: así el pie apoyado no patina.
   */
  caminar(fase: number, apertura?: number, rumbo: 1 | -1 = 1): void {
    if (this.postura !== 'caminando' || this.rumbo !== rumbo) {
      this.rumbo = rumbo;
      this.cambiarPostura('caminando');
    }
    this.pisada = posturaDePaso(fase, apertura, rumbo);
    this.pintar();
  }

  /**
   * Se sienta donde está y se queda mirando a lo lejos. `deUna`: ya estaba sentada cuando se la ve,
   * sin la bajada.
   */
  sentarse(deUna = false): void {
    this.cambiarPostura('sentada', deUna);
  }

  /** Se queda parada con las piernas juntas: termina el paso o se levanta. */
  pararse(): void {
    this.cambiarPostura('parada');
  }

  /** `deUna`: llega a la pose sin viaje, y sin despertar el reloj para nada. */
  private cambiarPostura(postura: Postura, deUna = false): void {
    this.postura = postura;
    this.pisada = QUIETA;
    this.m.sentar.destino = postura === 'sentada' ? 1 : 0;
    this.calmar();
    if (deUna || sinMovimiento()) {
      this.muelles.forEach(asentar);
      this.pintar();
      return;
    }
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
    // Caminando mira hacia donde va: seguir el mouse la hacía ir de costado.
    if (e.pointerType !== 'mouse' || this.agarre || sinMovimiento()) return;
    if (this.postura === 'caminando') return;
    const r = this.rectVisible();
    if (!r) return;
    this.mirarHacia(e.clientX, e.clientY, r);
    // Con vida propia no gira solo los ojos: la cara y el cuerpo se vuelven hacia quien la mira.
    if (this.vidaPropia()) {
      const lado = limitar((e.clientX - (r.left + r.width / 2)) / (r.width * 1.5), -1, 1);
      this.m.cara.destino = lado * 14;
      this.m.giro.destino = lado * 2;
    }
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

  // ─── Vida propia ─────────────────────────────────────────────────────────────────────────────

  /** No borra los pasos pendientes: son los del gesto que la agenda, y sin ellos queda a medias. */
  private programarOcurrencia(ms: number): void {
    this.paso(ms, () => this.ocurrirse(), true);
  }

  /** Un paso de un gesto. Si la agarraron en el medio, el paso se saltea: la mano manda. */
  private paso(ms: number, fn: () => void, siempre = false): void {
    const id = setTimeout(() => {
      this.pasosDelGesto.delete(id);
      if (siempre || !this.agarre) fn();
      this.despertar();
    }, ms);
    this.pasosDelGesto.add(id);
  }

  /** Si nadie la ve o pidieron quietud, no hace nada: vuelve a fijarse en un rato. */
  private puedeOcurrirse(): boolean {
    return (
      !sinMovimiento() &&
      !document.hidden &&
      !this.agarre &&
      !this.cayendo &&
      performance.now() - this.ultimoToque > RESPIRO_TRAS_TOQUE_MS &&
      // La pausa de la vida de fondo (WCAG 2.2.2) y la pestaña oculta las marca el recorrido.
      !this.host.closest('.fondo-en-pausa, .anims-frozen') &&
      this.rectVisible() !== null
    );
  }

  private ocurrirse(): void {
    if (!this.vidaPropia()) return;
    if (!this.puedeOcurrirse() || this.postura === 'caminando') {
      this.programarOcurrencia(1500);
      return;
    }
    const sentada = this.postura === 'sentada';
    // Parada, la primera es siempre el saludo: acaba de llegar alguien. Sentada está en lo suyo.
    const o =
      this.ocurrencia === null && !sentada
        ? 'saludo'
        : elegirOcurrencia(this.ocurrencia, Math.random(), sentada);
    this.ocurrencia = o;
    const dura = this.gestos[o]();
    this.programarOcurrencia(dura + esperaHastaLaProxima(Math.random()));
  }

  /** Cada gesto mueve destinos de muelles (no poses) y devuelve cuánto dura, en ms. */
  private readonly gestos: Record<Ocurrencia, () => number> = {
    saludo: () => {
      const m = this.m;
      // La mano al costado de la cabeza y no encima: arriba quedaba rosa sobre rosa, contra el cuerpo.
      m.brazoR.destino = -112;
      m.cejas.destino = -12;
      m.boca.destino = 0.5;
      m.cara.destino = 6;
      m.aplastar.v += 2;
      for (let i = 0; i < 5; i++) {
        this.paso(260 + i * 170, () => (m.brazoR.destino = i % 2 ? -130 : -95));
      }
      this.paso(1150, () => this.calmar(), true);
      return 1300;
    },
    // Se acuerda de su idea: la mira, se le levantan las cejas y la sacude un poco.
    mirarIdea: () => {
      const m = this.m;
      m.mirarX.destino = -14;
      m.mirarY.destino = -11;
      m.cara.destino = -10;
      m.cejas.destino = -10;
      this.paso(650, () => {
        m.cejas.destino = -20;
        m.boca.destino = 0.7;
        m.foco.v += 200;
        m.aplastar.v += 2.5;
      });
      this.paso(1500, () => this.calmar(), true);
      return 1700;
    },
    // Mira a un lado y después al sol: la cabeza acompaña a los ojos, y eso es lo que da el giro.
    mirarAlrededor: () => {
      const m = this.m;
      m.mirarX.destino = -14;
      m.mirarY.destino = 3;
      m.cara.destino = -14;
      this.paso(850, () => {
        m.mirarX.destino = 14;
        m.mirarY.destino = -9;
        m.cara.destino = 14;
        m.cejas.destino = -6;
      });
      this.paso(1800, () => this.calmar(), true);
      return 2000;
    },
    cambiarPeso: () => {
      const m = this.m;
      const s = (this.ladoDelPeso = this.ladoDelPeso === 1 ? -1 : 1);
      m.giro.destino = 3.5 * s;
      m.torcer.destino = -2 * s;
      m.piernas.destino = -6 * s;
      m.x.destino = 12 * s;
      m.cara.destino = 7 * s;
      m.brazoL.v += 60 * s;
      m.brazoR.v += 60 * s;
      this.paso(1700, () => this.calmar(), true);
      return 1900;
    },
    saltito: () => {
      this.saltar(0.5);
      this.m.cejas.v -= 160;
      this.m.boca.v += 10;
      return 900;
    },
    // Se estira con los brazos arriba y bosteza; al soltar, se aplasta y rebota.
    estirarse: () => {
      const m = this.m;
      m.aplastar.destino = -0.14;
      m.brazoR.destino = -70;
      m.brazoL.destino = 12;
      m.boca.destino = 1.1;
      m.cejas.destino = 8;
      m.mirarY.destino = -6;
      this.paso(1150, () => {
        this.calmar();
        m.aplastar.v += 3;
      });
      return 1600;
    },
    // Sentada: mira más lejos todavía, como si algo allá le llamara la atención, y vuelve.
    mirarLejos: () => {
      const m = this.m;
      m.mirarX.destino = 14;
      m.mirarY.destino = -11;
      m.cara.destino = 16;
      m.cejas.destino = -8;
      this.paso(1500, () => (m.cejas.destino = 1));
      this.paso(2600, () => this.calmar(), true);
      return 2800;
    },
    // Sentada en el borde, los pies van y vienen a destiempo.
    balancearPies: () => {
      const m = this.m;
      for (let i = 0; i < 6; i++) {
        this.paso(i * 430, () => (m.vaiven.destino = i % 2 ? -9 : 9));
      }
      this.paso(2600, () => this.calmar(), true);
      return 2800;
    },
  };

  /**
   * Vuelve todo al reposo de su postura, menos el alto (lo resuelve la caída) y el sentarse (lo
   * decide la postura, no un gesto).
   */
  private calmar(): void {
    const reposo = REPOSO[this.postura];
    const caminando = this.postura === 'caminando';
    for (const [nombre, k] of Object.entries(this.m)) {
      if (k === this.m.y || k === this.m.sentar) continue;
      const lado = caminando && LADEADOS.has(nombre) ? this.rumbo : 1;
      k.destino = (reposo[nombre] ?? 0) * lado;
    }
  }

  private aquietarse(): void {
    this.pasosDelGesto.forEach(clearTimeout);
    this.pasosDelGesto.clear();
    if (this.agarre) return;
    this.calmar();
    // Ya quieta (al nacer sin vida propia, por ejemplo) no hay viaje: no hace falta pedir cuadros.
    if (!this.cayendo && this.muelles.every(enReposo)) return;
    this.despertar();
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
    const p = this.pisada;
    const sentada = m.sentar.x;
    const aplastar = limitar(m.aplastar.x, -0.4, 0.4);
    const bajar =
      m.y.x + sentada * (SENTADA_DE_FRENTE ? SENTADA_EN_LA_PIEDRA : SENTADA_BAJA) + p.alzar;
    const ancho = 1 + aplastar * 0.82;
    // Se da vuelta a mitad de sentarse, de un cuadro al otro: así giran los dibujos animados.
    const perfil = !SENTADA_DE_FRENTE && sentada > 0.5;
    const pensativa = SENTADA_DE_FRENTE && sentada > 0.5;
    this.host.classList.toggle('mv--perfil', perfil);
    this.host.classList.toggle('mv--pensativa', pensativa);
    set(
      this.elCuerpo(),
      `translate(${n(m.x.x)} ${n(bajar)}) translate(${PIES_X} ${PIES_Y}) rotate(${n(m.giro.x + p.giro)}) ` +
        `skewX(${n(m.torcer.x)}) scale(${n(ancho)} ${n(1 - aplastar)}) ` +
        `translate(${-PIES_X} ${-PIES_Y})`,
    );
    // La sombra se achica cuando se despega del piso.
    const altura = limitar(-m.y.x / 900, 0, 0.7);
    set(
      this.elSombra(),
      `translate(${n(PIES_X + m.x.x + sentada * (SENTADA_DE_FRENTE ? 0 : 90))} ${n(930 + (SENTADA_DE_FRENTE ? SOMBRA_EN_LA_PIEDRA * sentada : 0))}) ` +
        `scale(${n((1 - altura + aplastar * 0.5) * (SENTADA_DE_FRENTE ? 1 - 0.3 * sentada : 1))} ${n(1 - altura * 0.6)}) translate(${-PIES_X} -930)`,
    );
    this.elSombra().nativeElement.style.opacity = n(1 - altura * 0.7);
    const hombro = perfil ? `${HOMBRO_DE_PERFIL} ` : '';
    set(this.elBrazoL(), `${hombro}rotate(${n(m.brazoL.x + p.brazoL)} 286.7 557.42)`);
    set(this.elBrazoR(), `rotate(${n(m.brazoR.x + p.brazoR)} 828.71 623.84)`);
    set(this.elFoco(), `rotate(${n(m.foco.x)} 184 470)`);
    const cara = m.cara.x;
    set(this.elCara(), `translate(${n(cara * 0.5)} 0)`);
    set(this.elRostro(), `translate(${n(cara)} ${n(m.aplastar.x * 18)})`);
    // De perfil la cara ya viene proyectada sobre el visor: solo se asoma un poco hacia la mirada.
    set(
      this.elRostroPerfil(),
      `translate(${n(cara * 0.3 + m.mirarX.x * 0.4)} ${n(m.mirarY.x * 0.5)})`,
    );
    set(this.elOjos(), `translate(${n(m.mirarX.x)} ${n(m.mirarY.x)})`);
    set(
      this.elCejaL(),
      `translate(0 ${n(m.cejas.x + m.pena.x)}) rotate(${n(m.cejas.x * 0.5 - m.pena.x * 7)} 463 547)`,
    );
    set(
      this.elCejaR(),
      `translate(0 ${n(m.cejas.x + m.pena.x)}) rotate(${n(-m.cejas.x * 0.5 + m.pena.x * 6)} 612 563)`,
    );
    set(this.elParpados(), `translate(0 ${n(-PARPADO_ALTO * (1 - limitar(m.pena.x, 0, 1)))})`);
    const boca = limitar(1 + m.boca.x, 0.5, 2.2);
    set(
      this.elBoca(),
      `translate(526.58 650) scale(${n(1 + m.boca.x * 0.2)} ${n(boca)}) translate(-526.58 -650)`,
    );
    // Cada pierna por su lado: caminando se cruzan, y sentada se estiran hacia adelante, ladera abajo.
    // De frente las piernas cuelgan derechas del borde: ni caderas corridas ni estiradas.
    const estira = SENTADA_DE_FRENTE ? 0 : sentada;
    const cadera = (c: { x: number; y: number }): string =>
      `translate(${n(c.x * estira)} ${n(c.y * estira)})`;
    const largo = SENTADA_DE_FRENTE ? 1 + COLGADA_ALARGA * sentada : 1;
    const colgar = (x: number, y: number): string =>
      `translate(${x} ${y}) scale(1 ${n(largo)}) translate(${-x} ${-y})`;
    set(
      this.elPiernaL(),
      `${cadera(CADERA_L)} ${colgar(465, 770)} rotate(${n(m.piernas.x + p.piernaL + m.vaiven.x - SENTADA_ESTIRA_L * estira)} 465 770)`,
    );
    set(
      this.elPiernaR(),
      `${cadera(CADERA_R)} ${colgar(650, 790)} rotate(${n(m.piernas.x + p.piernaR - m.vaiven.x - SENTADA_ESTIRA_R * estira)} 650 790)`,
    );
  }
}

function set(el: ElementRef<SVGElement>, transform: string): void {
  el.nativeElement.setAttribute('transform', transform);
}

function n(valor: number): string {
  return Number.isFinite(valor) ? valor.toFixed(2) : '0';
}
