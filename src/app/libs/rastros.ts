/**
 * Lo que deja un golpe en el punto donde cayó: una onda, unas chispas, una palabra que sube. Son
 * nodos de vida corta creados a mano, así que llevan el estilo en línea (no reciben el atributo de
 * encapsulación del componente) y se animan con la Web Animations API: al terminar se borran solos
 * y no queda ningún loop. Con movimiento reducido no se dibujan: la información está en el estado,
 * no en el rastro. La excepción es la palabra: un rebote no cambia ningún estado, así que aparece y
 * se apaga sin moverse.
 */
import { sinMovimiento } from './muelle';

function pieza(contenedor: HTMLElement, x: number, y: number, css: string): HTMLElement {
  const el = document.createElement('span');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = `position:absolute;left:${x}px;top:${y}px;pointer-events:none;z-index:30;${css}`;
  contenedor.appendChild(el);
  return el;
}

function alTerminar(animacion: Animation, el: HTMLElement): void {
  animacion.onfinish = () => el.remove();
  animacion.oncancel = () => el.remove();
}

/** Un anillo que se abre desde el punto y se apaga. */
export function onda(
  contenedor: HTMLElement,
  x: number,
  y: number,
  color: string,
  tam = 180,
): void {
  if (sinMovimiento()) return;
  const el = pieza(
    contenedor,
    x,
    y,
    `width:${tam}px;height:${tam}px;margin:${-tam / 2}px 0 0 ${-tam / 2}px;border-radius:50%;` +
      `border:2px solid ${color};box-sizing:border-box;`,
  );
  alTerminar(
    el.animate(
      [
        { transform: 'scale(.12)', opacity: 0.85 },
        { transform: 'scale(1)', opacity: 0 },
      ],
      { duration: 620, easing: 'cubic-bezier(.2,.7,.3,1)' },
    ),
    el,
  );
}

/** Pseudoazar con semilla: el mismo golpe siempre salpica igual, y un test puede contar con eso. */
function azarDe(semilla: number): () => number {
  let s = semilla;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s % 1000) / 1000;
  };
}

let semillaDeChispas = 7;

/** Unas partículas que salen del punto, caen un poco y se apagan. */
export function chispas(
  contenedor: HTMLElement,
  x: number,
  y: number,
  color: string,
  cantidad = 7,
): void {
  if (sinMovimiento()) return;
  const azar = azarDe((semillaDeChispas += 13));
  for (let i = 0; i < cantidad; i++) {
    const tam = 4 + azar() * 5;
    const el = pieza(
      contenedor,
      x,
      y,
      `width:${tam}px;height:${tam}px;margin:${-tam / 2}px 0 0 ${-tam / 2}px;` +
        `border-radius:50%;background:${color};`,
    );
    const angulo = (i / cantidad) * Math.PI * 2 + azar();
    const lejos = 26 + azar() * 40;
    const dx = Math.cos(angulo) * lejos;
    const dy = Math.sin(angulo) * lejos;
    alTerminar(
      el.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 0.9, offset: 0.55 },
          { transform: `translate(${dx * 1.15}px,${dy + 22}px) scale(.2)`, opacity: 0 },
        ],
        { duration: 460 + azar() * 180, easing: 'cubic-bezier(.15,.7,.4,1)' },
      ),
      el,
    );
  }
}

/** La onomatopeya: entra con rebote, sube y se va. */
export function palabra(
  contenedor: HTMLElement,
  x: number,
  y: number,
  texto: string,
  color = '#2b1b33',
): void {
  const el = pieza(
    contenedor,
    x,
    y,
    `translate:-50% -50%;white-space:nowrap;font-family:var(--font-display,system-ui);` +
      `font-weight:900;font-size:1.05rem;color:${color};` +
      `text-shadow:0 2px 0 rgba(255,253,247,.95),0 0 10px rgba(255,253,247,.9);`,
  );
  el.textContent = texto;
  if (sinMovimiento()) {
    alTerminar(
      el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1600 }),
      el,
    );
    return;
  }
  const giro = (semillaDeChispas += 3) % 2 ? 7 : -7;
  alTerminar(
    el.animate(
      [
        { transform: `translateY(6px) scale(.5) rotate(${-giro}deg)`, opacity: 0 },
        { transform: `translateY(-14px) scale(1.14) rotate(${giro}deg)`, opacity: 1, offset: 0.22 },
        {
          transform: `translateY(-24px) scale(1) rotate(${giro * 0.6}deg)`,
          opacity: 1,
          offset: 0.6,
        },
        { transform: 'translateY(-48px) scale(.92) rotate(0deg)', opacity: 0 },
      ],
      { duration: 820, easing: 'ease-out' },
    ),
    el,
  );
}

/** Un valor que sale despedido y cae: lo que un `set()` acaba de reemplazar. */
export function despedir(
  contenedor: HTMLElement,
  x: number,
  y: number,
  texto: string,
  lado: 1 | -1 = 1,
): void {
  if (sinMovimiento()) return;
  const el = pieza(
    contenedor,
    x,
    y,
    `translate:-50% -50%;white-space:nowrap;font-family:var(--font-mono,monospace);` +
      `font-weight:700;font-size:1rem;color:#4a4436;`,
  );
  el.textContent = texto;
  alTerminar(
    el.animate(
      [
        {
          transform: 'translate(0,0) rotate(0deg)',
          opacity: 1,
          easing: 'cubic-bezier(.2,.7,.4,1)',
        },
        {
          transform: `translate(${lado * 46}px,-42px) rotate(${lado * 16}deg)`,
          opacity: 1,
          offset: 0.36,
          easing: 'cubic-bezier(.6,0,.9,.4)',
        },
        { transform: `translate(${lado * 88}px,96px) rotate(${lado * 48}deg)`, opacity: 0 },
      ],
      { duration: 780 },
    ),
    el,
  );
}
