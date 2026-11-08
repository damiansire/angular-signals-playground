import type { SubNivelDiferido } from '../interfaces/route-item.interface';

/**
 * Una página del manual de a bordo: el libro de la nave en el espacio Zone.js, que el capitán abre
 * cuando la anomalía los arrastra ("¡Rápido, el manual de a bordo!"). Cada página es una pantalla
 * entera de la Introducción, la misma que antes vivía en la molécula como 0/1 a 0/5.
 */
export interface PaginaDelManual {
  /** El nombre de la pantalla de hoy, para leer el manual contra el recorrido. */
  readonly id: string;
  /** La ley de la página: es el título que la pantalla trae adentro. */
  readonly ley: string;
  /** Qué le dice esa ley a la tripulación, en su nave y en su apuro. Sigue las reglas del guion. */
  readonly enLaNave: string;
  /** La pantalla llega diferida: nadie la necesita antes de que el capitán abra el manual. */
  readonly cargar: () => Promise<SubNivelDiferido>;
}

export const PAGINAS_DEL_MANUAL: readonly PaginaDelManual[] = [
  {
    id: 'html-to-tree',
    ley: 'El HTML es un árbol de nodos.',
    enLaNave: 'La pantalla de la nave es un árbol.',
    cargar: () =>
      import('../signals/level-0-introduction/sub-levels/html-to-tree/html-to-tree.component').then(
        (m) => ({ component: m.HtmlToTreeComponent }),
      ),
  },
  {
    id: 'dom-is-alive',
    ley: 'El DOM está vivo.',
    enLaNave: 'Cambiar un nodo cambia la pantalla.',
    cargar: () =>
      import('../signals/level-0-introduction/sub-levels/dom-is-alive/dom-is-alive.component').then(
        (m) => ({ component: m.DomIsAliveComponent }),
      ),
  },
  {
    id: 'dom-to-pixel',
    ley: 'No todo cambio cuesta lo mismo.',
    enLaNave: 'Algunos cambios frenan la pantalla.',
    cargar: () =>
      import('../signals/level-0-introduction/sub-levels/dom-to-pixel/dom-to-pixel.component').then(
        (m) => ({ component: m.DomToPixelComponent }),
      ),
  },
  {
    id: 'manual-sync-pain',
    ley: 'A mano, te olvidás un lugar.',
    enLaNave: 'Por eso el panel marca la velocidad vieja.',
    cargar: () =>
      import('../signals/level-0-introduction/sub-levels/manual-sync-pain/manual-sync-pain.component').then(
        (m) => ({ component: m.ManualSyncPainComponent }),
      ),
  },
  {
    // Desemboca en "Debería ser imposible…": la anomalía es justo lo que Zone.js no parchea.
    id: 'old-change-detection',
    ley: 'Zone.js revisa todo el árbol.',
    enLaNave: 'Zone.js solo ve lo que parchea.',
    cargar: () =>
      import('../signals/level-0-introduction/sub-levels/old-change-detection/old-change-detection.component').then(
        (m) => ({ component: m.OldChangeDetectionComponent }),
      ),
  },
];

/** Lo que importa de una tecla para saber cuánto mueve al manual. */
export interface TeclaEnElManual {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly target: EventTarget | null;
}

/**
 * Cuánto mueve cada tecla a la hoja del manual, como en una página; `null` si esa tecla no
 * desplaza ahí. El manual scrollea a mano porque el recorrido de atrás también escucha estas teclas,
 * y para apartarlo hay que frenarlas con `preventDefault`, que también frena el scroll nativo.
 */
export function pasoEnElManual(tecla: TeclaEnElManual, alto: number, total: number): number | null {
  const objetivo = tecla.target instanceof HTMLElement ? tecla.target : null;
  if (objetivo?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(objetivo?.tagName ?? '')) {
    return null;
  }
  const pagina = alto * 0.85;
  switch (tecla.key) {
    case 'ArrowDown':
      return 48;
    case 'ArrowUp':
      return -48;
    case 'PageDown':
      return pagina;
    case 'PageUp':
      return -pagina;
    case 'Home':
      return -total;
    case 'End':
      return total;
    case ' ':
      // Sobre un botón, el espacio lo aprieta.
      if (objetivo?.closest('button, a, [role="button"]')) return null;
      return tecla.shiftKey ? -pagina : pagina;
    default:
      return null;
  }
}
