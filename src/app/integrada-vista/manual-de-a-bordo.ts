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
