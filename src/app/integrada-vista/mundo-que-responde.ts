import {
  IMPACTO,
  alcanceDelGolpe,
  asentar,
  avanzarMuelle,
  crearMuelle,
  emitirImpacto,
  enReposo,
  motorDeMuelles,
  sinMovimiento,
  type DetalleDeImpacto,
} from '../libs/muelle';
import { chispas, onda } from '../libs/rastros';

/**
 * Lo que ya tiene su propia respuesta al click: el fondo no se la pisa. `tabindex="-1"` no cuenta:
 * lo lleva `#main-content` para el salto de teclado, y es ancestro de toda la página.
 */
const INTERACTIVO =
  'a, button, input, select, textarea, label, [role="button"], [tabindex]:not([tabindex="-1"]), ' +
  '.ms, app-code, ' +
  '.ci__nodo, .rail, .topbar, .intro';

/**
 * Tocar alrededor también cuenta: un click en el fondo deja una onda donde cayó y le pega a lo que
 * haya cerca. Todo golpe (el del fondo, el aterrizaje de la mascota, un valor que llega a un átomo)
 * pasa por el mismo evento, así que la molécula se sacude con cualquiera de ellos.
 *
 * La sacudida es un grupo propio alrededor de `#scene`: la cámara del motor sigue siendo la única
 * dueña del `transform` de la escena. Con todo quieto, el motor de muelles se duerme.
 */
export function initMundoQueResponde(host: HTMLElement): () => void {
  const stage = host.querySelector<HTMLElement>('#stage');
  const holder = host.querySelector<HTMLElement>('.holder');
  const sacudida = host.querySelector<SVGGElement>('#sacudida');
  const estrellas = host.querySelector<SVGGElement>('#stars');
  const intro = host.querySelector<HTMLElement>('#intro');
  if (!stage || !holder || !sacudida) return () => undefined;

  const x = crearMuelle(0, 120, 7);
  const y = crearMuelle(0, 120, 7);
  const giro = crearMuelle(0, 90, 6);
  // El núcleo del átomo actual es lo único blando de la escena: el golpe lo aplasta y lo deja oscilar.
  const aplastar = crearMuelle(0, 240, 8);
  let nucleo: SVGElement | null = null;
  const muelles = [x, y, giro, aplastar];

  const cuadro = (dt: number): boolean => {
    let sigue = false;
    for (const m of muelles) {
      avanzarMuelle(m, dt);
      if (enReposo(m)) asentar(m);
      else sigue = true;
    }
    sacudida.setAttribute(
      'transform',
      `translate(${x.x.toFixed(2)} ${y.x.toFixed(2)}) rotate(${giro.x.toFixed(3)} 410 300)`,
    );
    const actual = host.querySelector<SVGElement>('#atoms .atom.current .nucleus');
    if (actual !== nucleo) {
      nucleo?.style.removeProperty('transform');
      nucleo = actual;
    }
    if (nucleo) {
      nucleo.style.transform = aplastar.x
        ? `scale(${(1 + aplastar.x * 0.82).toFixed(4)},${(1 - aplastar.x).toFixed(4)})`
        : '';
    }
    // Las estrellas están más lejos: se mueven menos, y esa diferencia es la que da profundidad.
    estrellas?.setAttribute(
      'transform',
      `translate(${(x.x * 0.3).toFixed(2)} ${(y.x * 0.3).toFixed(2)})`,
    );
    return sigue;
  };

  const alImpacto = (e: Event): void => {
    if (sinMovimiento()) return;
    const { x: px, y: py, fuerza } = (e as CustomEvent<DetalleDeImpacto>).detail;
    const r = holder.getBoundingClientRect();
    const dx = r.left + r.width / 2 - px;
    const dy = r.top + r.height / 2 - py;
    const d = Math.hypot(dx, dy) || 1;
    // Se aleja del golpe, como algo blando que recibe un empujón.
    x.v += (dx / d) * fuerza * 130;
    y.v += (dy / d) * fuerza * 130;
    giro.v += (dx >= 0 ? 1 : -1) * fuerza * 9;
    const centro = host.querySelector('#atoms .atom.current .nucleus')?.getBoundingClientRect();
    if (centro) {
      const lejos = Math.hypot(
        centro.left + centro.width / 2 - px,
        centro.top + centro.height / 2 - py,
      );
      aplastar.v = Math.min(aplastar.v + fuerza * alcanceDelGolpe(lejos, 620) * 4.4, 5);
    }
    motorDeMuelles().despertar();
  };

  const alClick = (e: MouseEvent): void => {
    if (!(e.target instanceof Element) || e.target.closest(INTERACTIVO)) return;
    if (intro && Number(getComputedStyle(intro).opacity) > 0.05) return;
    const r = holder.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    // El color del concepto vive en una variable del escenario; sin él, la tinta del recorrido.
    const color =
      getComputedStyle(host.querySelector('.dive-aura') ?? holder).getPropertyValue('--glow') ||
      '#8a7f68';
    onda(holder, px, py, color.trim() || '#8a7f68', 240);
    onda(holder, px, py, 'rgba(120, 110, 90, .35)', 130);
    chispas(holder, px, py, color.trim() || '#8a7f68', 5);
    emitirImpacto(stage, { x: e.clientX, y: e.clientY, fuerza: 0.7 });
  };

  const sacar = motorDeMuelles().agregar(cuadro);
  window.addEventListener(IMPACTO, alImpacto);
  stage.addEventListener('click', alClick);
  return () => {
    sacar();
    window.removeEventListener(IMPACTO, alImpacto);
    stage.removeEventListener('click', alClick);
  };
}
