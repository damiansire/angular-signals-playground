import type { PaginaDelManual } from './manual-de-a-bordo';

/**
 * El árbol que Angie les muestra al llegar a Signal Space ("Miren el árbol."): la pantalla que
 * antes era el 6 de la Introducción, ahora adentro de la historia. Es el mismo árbol de la última
 * página del manual, y por eso usa su misma hoja: allá Zone.js revisaba los siete nodos, acá se
 * enteran solo los dos que leen el valor.
 */
export const ARBOL_DE_SIGNAL_SPACE: PaginaDelManual = {
  id: 'signals-change-detection',
  ley: 'El signal avisa quién lo lee.',
  enLaNave: 'Aquí solo se entera quien lee.',
  cargar: () =>
    import('../signals/level-0-introduction/sub-levels/signals-change-detection/signals-change-detection.component').then(
      (m) => ({ component: m.SignalsChangeDetectionComponent }),
    ),
};
