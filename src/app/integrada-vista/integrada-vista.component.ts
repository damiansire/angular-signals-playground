import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  ErrorHandler,
  Type,
  afterNextRender,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

import { signalsRoutesTree } from '../app.routes';
import { initMolecule, type MountSub } from './molecule-engine';
import { initIntroTusi } from './intro-tusi';
import { initPrologoAnomalia } from './prologo-anomalia';
import { buildWhereQuery, parseWhereQuery } from './url-sync';

/**
 * Vista integrada: el recorrido de los 12 conceptos como una MOLÉCULA reactiva.
 * Cada concepto es un átomo; al scrollear, la cámara bucea a su contenido y sus
 * sub-niveles orbitan la card. Cada sub-nivel EMBEBE el componente REAL de
 * `/signals/level/X/sub-level/Z` (sacado de `signalsRoutesTree`), así toda la app
 * de niveles vive dentro de esta única vista.
 *
 * La animación es imperativa (SVG/cámara/scroll-snap) y vive en `molecule-engine`;
 * se arranca en `afterNextRender` (solo browser) y el cleanup corta rAF y listeners.
 */
@Component({
  selector: 'app-integrada-vista',
  imports: [RouterLink],
  templateUrl: './integrada-vista.component.html',
  styleUrls: [
    './integrada-vista.component.css',
    './intro-tusi.css',
    './prologo-anomalia.css',
    './boot-fallo.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegradaVistaComponent {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly env = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);
  private readonly location = inject(Location);
  private readonly errorHandler = inject(ErrorHandler);

  /** Componentes reales de cada sub-nivel, por concepto (del árbol de conceptos). Un sub-nivel
   *  siempre trae componente; el tipo admite `undefined` porque `RouteItem.component` es opcional
   *  (los niveles no lo llevan) y `mountSub` ya cubre el caso faltante. */
  private readonly subComponents: (Type<unknown> | undefined)[][] = signalsRoutesTree.map((lvl) =>
    (lvl.subLevels ?? []).map((sl) => sl.component),
  );

  /** Nombre de cada sub-nivel, en el mismo orden que `subComponents`: es lo que muestra el topbar. */
  private readonly subTitles: (string | undefined)[][] = signalsRoutesTree.map((lvl) =>
    (lvl.subLevels ?? []).map((sl) => sl.title),
  );

  /**
   * El boot falló y no hay recorrido que mostrar. La vista es 100% imperativa: sin esto, cualquier
   * excepción en el arranque deja al usuario mirando una pantalla muerta, sin mensaje y sin forma
   * de saber que hay algo roto. Angular no puede renderizar un fallback que nadie declaró.
   */
  readonly bootFallo = signal(false);

  constructor() {
    afterNextRender(() => {
      try {
        this.arrancar();
      } catch (error) {
        // El diagnóstico va igual al ErrorHandler de la app (no se traga), pero la pantalla deja
        // de estar muda: el usuario ve qué pasó y puede recargar.
        this.bootFallo.set(true);
        this.errorHandler.handleError(error);
      }
    });
  }

  /** El boot es de una sola pasada: para reintentarlo hay que volver a montar todo. */
  protected recargar(): void {
    window.location.reload();
  }

  private arrancar(): void {
    // Nombre del atributo de encapsulación que Angular pone a los elementos del template;
    // el motor lo estampa en lo que crea a mano para que el CSS scopeado les aplique.
    const enc =
      this.host
        .querySelector('#stage')
        ?.getAttributeNames()
        .find((a) => a.startsWith('_ngcontent')) ?? null;
    const subCounts = this.subComponents.map((subs) => subs.length);
    const dispose = initMolecule(
      this.host,
      this.mountSub,
      subCounts,
      enc,
      this.onWhere,
      this.initialFromUrl(),
    );
    this.destroyRef.onDestroy(dispose);

    // Landing "par de Tusi" (canvas + audio + overlay Dark/Light). El motor ya fadea el `.intro`.
    //
    // Entre el clima y la construcción va el PRÓLOGO. El orden importa y no es arbitrario: elegir
    // clima es el gesto que el navegador exige para dejar sonar, así que el prólogo arranca con
    // audio ya desbloqueado y sin pedirle nada más a nadie. Y la construcción de Tusi espera de
    // verdad: si corriera detrás durante esos minutos, llegaría terminada y se comería su propio
    // premio, que es ver aparecer el círculo.
    this.destroyRef.onDestroy(
      initIntroTusi(this.host, {
        onThemePicked: (startBuild) => {
          const cerrarPrologo = initPrologoAnomalia(this.host, { alTerminar: startBuild });
          this.destroyRef.onDestroy(cerrarPrologo);
        },
      }),
    );
  }

  /**
   * Deep-link: lee `?nivel=X(&sub-nivel=Z)` de la URL para abrir el recorrido donde quedó.
   * `?nivel=X` solo (sin sub-nivel, la vista molécula) también es válido: encuadra el átomo.
   */
  private initialFromUrl(): { concept: number; sub: number } | null {
    return parseWhereQuery(window.location.search);
  }

  /**
   * Refleja el nivel/sub-nivel actual del recorrido en la URL sin navegar ni recargar.
   * `replaceState` reescribe la barra (respetando el base href) sin pasar por el Router,
   * así el componente no se desmonta ni se pierde el scroll. `subIdx` -1 = vista molécula.
   */
  private readonly onWhere = (conceptIdx: number, subIdx: number): void => {
    this.location.replaceState('/', buildWhereQuery(conceptIdx, subIdx));
  };

  /** Monta el componente REAL del sub-nivel (concepto ci, sub si) y lo integra a la CD. */
  private readonly mountSub: MountSub = (host, ci, si) => {
    const type = this.subComponents[ci]?.[si];
    if (!type) return { dispose: () => undefined };
    // No pasamos `hostElement: host`: al destruir, `ref.destroy()` borraría ESE nodo, y `host`
    // es la `.subhost` persistente de la card. Creamos el componente en su propio nodo y lo
    // appendeamos adentro; así `destroy()` solo se lleva el nodo del componente, no la `.subhost`.
    const ref = createComponent(type, { environmentInjector: this.env });
    host.appendChild(ref.location.nativeElement);
    this.appRef.attachView(ref.hostView);
    // La app es zoneless: montar desde el listener nativo de scroll no agenda ningún tick,
    // así que la vista recién adjuntada nunca correría su primera CD y quedaría en blanco.
    // Forzamos la detección inicial acá; las interacciones posteriores ya agendan su propio tick.
    ref.changeDetectorRef.detectChanges();
    return {
      title: this.subTitles[ci]?.[si],
      dispose: () => {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
      },
    };
  };
}
