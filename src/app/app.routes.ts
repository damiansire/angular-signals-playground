import { Routes } from '@angular/router';
import { RouteItem } from './interfaces/route-item.interface';
import { EffectComponent } from './signals/level-3-effect/sub-levels/1-effect/effect.component';
import { DestroyEffectComponent } from './signals/level-3-effect/sub-levels/2-interval-when-is-destroy/destroy-effect.component';
import { EffectDestroyComponent } from './signals/level-3-effect/sub-levels/5-effect-destroy/effect-destroy.component';
import { ReferenceEqualityComponent } from './signals/level-4-signal-equality-functions/sub-levels/1-reference-equality/reference-equality.component';
import { CustomEqualComponent } from './signals/level-4-signal-equality-functions/sub-levels/2-custom-equal/custom-equal.component';
import { BasicLinkedSignalComponent } from './signals/level-5-linked-signal/sub-levels/1-basic-linked-signal/basic-linked-signal.component';
import { LinkedSignalWithSourceComponent } from './signals/level-5-linked-signal/sub-levels/2-linked-signal-with-source/linked-signal-with-source.component';
import { ResourceBasicComponent } from './signals/level-6-resource/sub-levels/1-resource-basic/resource-basic.component';
import { RxResourceComponent } from './signals/level-6-resource/sub-levels/2-rx-resource/rx-resource.component';
import { InputOutputComponent } from './signals/level-7-signal-io/sub-levels/1-input-output/input-output.component';
import { ModelTwoWayComponent } from './signals/level-7-signal-io/sub-levels/2-model/model-two-way.component';
import { InputRequiredComponent } from './signals/level-7-signal-io/sub-levels/3-input-required/input-required.component';
import { ViewChildComponent } from './signals/level-8-queries-interop/sub-levels/1-view-child/view-child.component';
import { RxjsInteropComponent } from './signals/level-8-queries-interop/sub-levels/2-rxjs-interop/rxjs-interop.component';
import { ViewChildrenComponent } from './signals/level-8-queries-interop/sub-levels/3-view-children/view-children.component';
import { ContentQueriesComponent } from './signals/level-8-queries-interop/sub-levels/4-content-queries/content-queries.component';
import { AfterRenderEffectComponent } from './signals/level-9-after-render-effect/sub-levels/1-after-render-effect/after-render-effect.component';
import { OnCleanupComponent } from './signals/level-9-after-render-effect/sub-levels/2-on-cleanup/on-cleanup.component';
import { DebouncedRxjsComponent } from './signals/level-10-debounced/sub-levels/1-debounced-rxjs/debounced-rxjs.component';
import { DebouncedManualComponent } from './signals/level-10-debounced/sub-levels/2-debounced-manual/debounced-manual.component';
import { ZonelessComponent } from './signals/level-11-zoneless/sub-levels/1-zoneless/zoneless.component';
import { IntegradaVistaComponent } from './integrada-vista/integrada-vista.component';

/**
 * Árbol de los conceptos y sus sub-niveles. NO genera rutas: es la fuente de datos que la
 * vista integrada (`/`) consume para embeber el componente real de cada sub-nivel. Los niveles
 * no llevan componente propio: el nivel es una etapa del viaje, y sus páginas son los sub-niveles.
 */
export const signalsRoutesTree: RouteItem[] = [
  // La Introducción (el `path` 0) pasó entera a la historia: sus cinco primeras pantallas son las
  // páginas del manual de a bordo, y la sexta es el árbol de Signal Space, las dos en el prólogo
  // (`integrada-vista/manual-de-a-bordo.ts` y `arbol-de-signal-space.ts`). El `path` de cada
  // concepto es su número de capítulo: no se renumera.
  // Capítulos 1 y 2 diferidos: el circuito que comparten solo lo paga quien llega a verlos.
  {
    path: '1',
    subLevels: [
      {
        path: '1',
        title: 'Variables (repaso pre-signals)',
        loadComponent: () =>
          import('./signals/level-1-interaction-with-signals/sub-levels/variables/variables.component').then(
            (m) => ({ component: m.VariablesComponent }),
          ),
      },
      {
        path: '2',
        title: 'Qué es un signal',
        loadComponent: () =>
          import('./signals/level-1-interaction-with-signals/sub-levels/what-is-signals/what-is-signals.component').then(
            (m) => ({ component: m.WhatIsSignalsComponent }),
          ),
      },
      {
        path: '3',
        title: 'Tipos de signal',
        loadComponent: () =>
          import('./signals/level-1-interaction-with-signals/sub-levels/types-of-signals/types-of-signals.component').then(
            (m) => ({ component: m.TypesOfSignalsComponent }),
          ),
      },
      {
        path: '4',
        title: 'Leer un signal: el getter ()',
        loadComponent: () =>
          import('./signals/level-1-interaction-with-signals/sub-levels/create-new-signals/create-new-signals.component').then(
            (m) => ({ component: m.CreateNewSignalsComponent }),
          ),
      },
      {
        path: '5',
        title: 'Writable Signal',
        loadComponent: () =>
          import('./signals/level-1-interaction-with-signals/sub-levels/1-writable-signals/writable-signals.component').then(
            (m) => ({ component: m.WritableSignalsComponent }),
          ),
      },
      {
        path: '6',
        title: 'Update Signal',
        loadComponent: () =>
          import('./signals/level-1-interaction-with-signals/sub-levels/2-update-signal/update-signal.component').then(
            (m) => ({ component: m.UpdateSignalComponent }),
          ),
      },
      {
        path: '7',
        title: 'Read-only signals: asReadonly()',
        loadComponent: () =>
          import('./signals/level-1-interaction-with-signals/sub-levels/read-only-signals/read-only-signals.component').then(
            (m) => ({ component: m.ReadOnlySignalsComponent }),
          ),
      },
    ],
  },
  {
    path: '2',
    subLevels: [
      {
        path: '1',
        title: 'Computed signals',
        loadComponent: () =>
          import('./signals/level-2-computed-signals/sub-levels/1-computed-signals/computed-signals.component').then(
            (m) => ({ component: m.ComputedSignalsComponent }),
          ),
      },
      {
        path: '2',
        title: 'Dependencias dinámicas',
        loadComponent: () =>
          import('./signals/level-2-computed-signals/sub-levels/2-computed-signal-dynamic-dependencies/computed-signal-dynamic-dependencies.component').then(
            (m) => ({ component: m.ComputedSignalDynamicDependenciesComponent }),
          ),
      },
      {
        path: '3',
        title: 'Perezoso y memoizado',
        loadComponent: () =>
          import('./signals/level-2-computed-signals/sub-levels/3-computed-signals-lazily-evaluated-memoized/computed-signals-lazily-evaluated-memoized.component').then(
            (m) => ({ component: m.ComputedSignalsLazilyEvaluatedMemoizedComponent }),
          ),
      },
    ],
  },
  {
    path: '3',
    subLevels: [
      { path: '1', title: 'Dependencias del effect', component: EffectComponent },
      { path: '2', title: 'Intervalo filtrado', component: DestroyEffectComponent },
      { path: '3', title: 'Limpieza con onCleanup', component: EffectDestroyComponent },
    ],
  },
  {
    path: '4',
    subLevels: [
      {
        path: '1',
        title: 'Igualdad por defecto (Object.is)',
        component: ReferenceEqualityComponent,
      },
      { path: '2', title: 'Función equal custom', component: CustomEqualComponent },
    ],
  },
  {
    path: '5',
    subLevels: [
      {
        path: '1',
        title: 'linkedSignal: reinicio con la fuente',
        component: BasicLinkedSignalComponent,
      },
      {
        path: '2',
        title: 'linkedSignal: preservar si sigue válida',
        component: LinkedSignalWithSourceComponent,
      },
    ],
  },
  {
    path: '6',
    subLevels: [
      { path: '1', title: 'resource(): loader con Promise', component: ResourceBasicComponent },
      { path: '2', title: 'rxResource(): stream de RxJS', component: RxResourceComponent },
      {
        path: '3',
        title: 'httpResource(): pedir por URL',
        // Diferido con sus proveedores: HttpClient solo lo paga quien llega a este sub-nivel.
        loadComponent: () =>
          import('./signals/level-6-resource/sub-levels/3-http-resource/http-resource.component').then(
            (m) => ({ component: m.HttpResourceComponent, providers: m.PROVEEDORES }),
          ),
      },
    ],
  },
  {
    path: '7',
    subLevels: [
      {
        path: '1',
        title: 'input() y output() basados en signals',
        component: InputOutputComponent,
      },
      {
        path: '2',
        title: 'model(): binding two-way con [(value)]',
        component: ModelTwoWayComponent,
      },
      { path: '3', title: 'input.required() y transform', component: InputRequiredComponent },
      {
        path: '4',
        title: 'Formularios con signals',
        // Diferido: @angular/forms/signals pesa, y solo lo paga quien llega a este sub-nivel.
        loadComponent: () =>
          import('./signals/level-7-signal-io/sub-levels/4-signal-forms/signal-forms.component').then(
            (m) => ({ component: m.SignalFormsComponent }),
          ),
      },
    ],
  },
  {
    path: '8',
    subLevels: [
      { path: '1', title: 'viewChild() como signal', component: ViewChildComponent },
      {
        path: '2',
        title: 'toSignal() · toObservable() · untracked()',
        component: RxjsInteropComponent,
      },
      { path: '3', title: 'viewChildren() como signal', component: ViewChildrenComponent },
      {
        path: '4',
        title: 'contentChild() y contentChildren()',
        component: ContentQueriesComponent,
      },
    ],
  },
  {
    path: '9',
    subLevels: [
      {
        path: '1',
        title: 'afterRenderEffect(): medir el DOM',
        component: AfterRenderEffectComponent,
      },
      { path: '2', title: 'effect((onCleanup) => …)', component: OnCleanupComponent },
    ],
  },
  {
    path: '10',
    subLevels: [
      { path: '1', title: 'Debounce con RxJS', component: DebouncedRxjsComponent },
      {
        path: '2',
        title: 'Debounce a mano (effect + onCleanup)',
        component: DebouncedManualComponent,
      },
      {
        path: '3',
        title: 'debounced() nativo',
        loadComponent: () =>
          import('./signals/level-10-debounced/sub-levels/3-debounced-nativo/debounced-nativo.component').then(
            (m) => ({ component: m.DebouncedNativoComponent }),
          ),
      },
    ],
  },
  {
    path: '11',
    subLevels: [{ path: '1', title: 'Change detection sin Zone.js', component: ZonelessComponent }],
  },
];

export const routes: Routes = [
  {
    // Diferida: es otra página y se abre desde la hoja de una etapa. Eager sumaba ~20 kB al bundle inicial, que
    // se pasaba del presupuesto de 700 kB.
    path: 'practica/carrito',
    loadComponent: () =>
      import('./practice/cart/cart-example.component').then((m) => m.CartExampleComponent),
  },
  {
    path: 'cine/:capitulo',
    loadComponent: () =>
      import('./integrada-vista/cinematicas/cine-preview.component').then(
        (m) => m.CinePreviewComponent,
      ),
    title: 'Sala de proyección · Angular Signals',
  },
  // La vista integrada ES la raíz `/`: es la entrada.
  { path: '', component: IntegradaVistaComponent },
  // Cualquier URL desconocida (incluidos bookmarks viejos como /signals/level/..., /lab o /poc)
  // rebota a la raíz.
  { path: '**', redirectTo: '' },
];
