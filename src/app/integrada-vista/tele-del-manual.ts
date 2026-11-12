import { sinMovimiento } from '../libs/muelle';

/**
 * El manual de a bordo es la pantalla de la nave, y se entra y se sale como de una tele vieja: la
 * cámara se acerca y todo queda negro; la pantalla se prende en un punto de luz que se abre en una
 * raya y después en la imagen, con un fogonazo; al final se apaga al revés, y el negro se va con
 * la historia detrás. Así el libro es parte del mundo y no un cartel encima.
 */
export const ACERCARSE_MS = 480;
export const PRENDERSE_MS = 620;
export const APAGARSE_MS = 440;
export const VOLVER_MS = 320;

/**
 * La luz es la imagen sobreexpuesta: con `brightness(60)` hasta el cielo oscuro queda blanco, y al
 * bajar a 1 pasa por una imagen quemada que se asienta, como el fogonazo de un tubo. Pasando a
 * blanco con `invert`, el medio del camino era un velo gris.
 */
const luz = (b: number) => `brightness(${b})`;
const BLANCO = 60;

/**
 * Lo que se ve de la pantalla, recortado y no achicado: con `scale`, las escenas que miden su
 * dibujo al nacer (la nave que mira a su pantalla) encontraban una matriz sin inversa.
 */
const ventana = (alto: number, ancho: number) =>
  `inset(${((100 - alto) / 2).toFixed(2)}% ${((100 - ancho) / 2).toFixed(2)}%)`;
const RAYA = 0.4;
const NADA = ventana(0, 0);
const PUNTO = ventana(RAYA, 3);
const LINEA = ventana(RAYA, 100);
const TODO = ventana(100, 100);

export const SE_PRENDE: readonly Keyframe[] = [
  { offset: 0, clipPath: NADA, filter: luz(BLANCO) },
  { offset: 0.08, clipPath: PUNTO, filter: luz(BLANCO) },
  { offset: 0.36, clipPath: LINEA, filter: luz(BLANCO), easing: 'ease-out' },
  { offset: 0.58, clipPath: TODO, filter: luz(3), easing: 'ease-out' },
  { offset: 1, clipPath: TODO, filter: luz(1) },
];

export const SE_APAGA: readonly Keyframe[] = [
  { offset: 0, clipPath: TODO, filter: luz(1), easing: 'ease-in' },
  { offset: 0.25, clipPath: TODO, filter: luz(3), easing: 'ease-in' },
  { offset: 0.55, clipPath: LINEA, filter: luz(BLANCO) },
  { offset: 0.85, clipPath: PUNTO, filter: luz(BLANCO) },
  { offset: 1, clipPath: NADA, filter: luz(BLANCO) },
];

const tele = (hoja: HTMLElement) =>
  hoja.parentElement?.querySelector<HTMLElement>(':scope > .prologo__tele') ?? null;

/** Si la página no llega (red caída), la pantalla se prende igual: negro para siempre sería peor. */
const PRENDER_SIN_ESPERAR_MS = 4000;

/**
 * Se acerca y deja todo negro, con la pantalla apagada; devuelve con qué prenderla, que va cuando
 * la página ya está montada. Prendida antes, el fogonazo pasaba mientras la página cargaba y se
 * trababa un segundo. `escena`, si hay, es el prólogo detrás: la cámara se le acerca rápido y
 * después se frena, mientras el negro sube. Sin ella (el manual suelto), solo se oscurece.
 * `alQuedarNegro` avisa cuando el negro ya tapa todo: desde ahí lo de atrás no se ve.
 */
export function encenderLaTele(
  hoja: HTMLElement,
  escena: HTMLElement | null,
  alQuedarNegro?: () => void,
): () => void {
  if (sinMovimiento()) {
    // Sin movimiento el negro no sube: está desde el primer cuadro.
    if (tele(hoja)) alQuedarNegro?.();
    return () => undefined;
  }
  const desde = performance.now();
  hoja.style.clipPath = NADA;
  tele(hoja)
    ?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: ACERCARSE_MS,
      easing: 'ease-in',
      fill: 'backwards',
    })
    // Cancelada (la hoja se fue antes), el negro no llegó a tapar nada.
    .finished.then(alQuedarNegro, () => undefined);
  escena?.animate([{ scale: '1' }, { scale: '1.7' }], {
    duration: ACERCARSE_MS,
    easing: 'ease-out',
  });
  let prendida = false;
  const prender = () => {
    if (prendida) return;
    prendida = true;
    clearTimeout(porLasDudas);
    const falta = Math.max(0, ACERCARSE_MS - (performance.now() - desde));
    // Dos cuadros: el primero pinta la página recién montada, el segundo ya la tiene asentada.
    setTimeout(
      () =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            hoja.style.clipPath = '';
            hoja.animate([...SE_PRENDE], { duration: PRENDERSE_MS });
          }),
        ),
      falta,
    );
  };
  const porLasDudas = setTimeout(prender, PRENDER_SIN_ESPERAR_MS);
  return prender;
}

/**
 * Apaga la pantalla y deja ver lo de atrás; resuelve cuando ya no queda nada del manual.
 * `alVolver` avisa justo antes de que el negro empiece a irse: lo de atrás vuelve a verse.
 */
export async function apagarLaTele(hoja: HTMLElement, alVolver?: () => void): Promise<void> {
  if (sinMovimiento()) return;
  await hoja.animate([...SE_APAGA], { duration: APAGARSE_MS, fill: 'forwards' }).finished;
  alVolver?.();
  await tele(hoja)?.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: VOLVER_MS,
    easing: 'ease-out',
    fill: 'forwards',
  }).finished;
}
