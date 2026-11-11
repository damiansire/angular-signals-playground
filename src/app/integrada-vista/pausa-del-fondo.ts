/**
 * La pausa de la vida de fondo (WCAG 2.2.2): los loops de la colina, de las naves y de los demos se
 * mueven sin fin al lado del contenido, y la preferencia del sistema no puede ser el único freno.
 * La elige el jugador con el botón de la colina y se recuerda por visitante.
 */

export const CLAVE_PAUSA_FONDO = 'signals-pausa';

/** Lo que el jugador abrió encima: la pausa de la vida de fondo no lo toca. */
const PRIMER_PLANO = '.prologo, app-cinematica';

export function leerPausaFondo(almacen: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return almacen?.getItem(CLAVE_PAUSA_FONDO) === '1';
  } catch {
    return false;
  }
}

export function guardarPausaFondo(
  almacen: Pick<Storage, 'setItem' | 'removeItem'> | null,
  pausa: boolean,
): void {
  try {
    if (pausa) almacen?.setItem(CLAVE_PAUSA_FONDO, '1');
    else almacen?.removeItem(CLAVE_PAUSA_FONDO);
  } catch {
    // Sin storage (modo privado, bloqueado) la pausa dura la visita: no es motivo para romper.
  }
}

export interface PausaDelFondo {
  aplicar: (pausa: boolean) => void;
  dispose: () => void;
}

/**
 * Frena la vida de fondo de `raiz` y la congela con la pestaña oculta.
 *
 * No reusa el congelado de la pestaña oculta: `animation-play-state` deja cada animación en el
 * cuadro en que está, y una entrada que todavía no arrancó queda en su primer cuadro, invisible. Acá
 * los loops se detienen y lo que tiene fin salta a su estado final, también lo que arranca con la
 * pausa puesta.
 *
 * Los loops se frenan con velocidad 0 y no con pause()/play(): esos le sacan al CSS el control de
 * `animation-play-state` para siempre (la pestaña oculta dejaba de congelarlos), y play() revive como
 * animación suelta un loop que el CSS ya canceló. A un loop cancelado, devolverle la velocidad no lo
 * arranca.
 */
export function initPausaDelFondo(raiz: HTMLElement): PausaDelFondo {
  let pausa = false;
  const frenadas = new Set<Animation>();

  const aquietar = (a: Animation): void => {
    const efecto = a.effect;
    if (!(a instanceof CSSAnimation) || !(efecto instanceof KeyframeEffect)) return;
    if (efecto.target?.closest(PRIMER_PLANO)) return;
    // Lo que sigue al scroll (el aviso de "más abajo" de la hoja) no es vida de fondo: no se mueve
    // solo. Terminarlo lo dejaría apagado aunque falte contenido por ver.
    if (!(a.timeline instanceof DocumentTimeline)) return;
    if (efecto.getComputedTiming().iterations === Infinity) {
      a.playbackRate = 0;
      frenadas.add(a);
    } else {
      a.finish();
    }
  };

  const aplicar = (ahora: boolean): void => {
    pausa = ahora;
    // La clase va primero: lo que la mira (las naves, Angie, los demos) decide con ella.
    raiz.classList.toggle('fondo-en-pausa', pausa);
    if (pausa) {
      raiz.getAnimations({ subtree: true }).forEach(aquietar);
    } else {
      for (const a of frenadas) a.playbackRate = 1;
      frenadas.clear();
    }
  };

  const alArrancar = (e: AnimationEvent): void => {
    if (!pausa || !(e.target instanceof Element)) return;
    // Lo que el CSS canceló durante la pausa no se retiene hasta reanudar.
    for (const a of frenadas) if (a.playState === 'idle') frenadas.delete(a);
    e.target.getAnimations({ subtree: true }).forEach(aquietar);
  };

  // El navegador frena el rAF de una pestaña oculta, pero no las animaciones CSS: sin esto seguían
  // quemando ciclos (y el ventilador) con la vista en otra pestaña. Ver `.anims-frozen` en styles.css.
  const alCambiarVisibilidad = (): void => {
    raiz.classList.toggle('anims-frozen', document.hidden);
  };

  raiz.addEventListener('animationstart', alArrancar);
  document.addEventListener('visibilitychange', alCambiarVisibilidad);
  alCambiarVisibilidad();

  return {
    aplicar,
    dispose: () => {
      raiz.removeEventListener('animationstart', alArrancar);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      frenadas.clear();
    },
  };
}
