import { Routes } from '@angular/router';
import { RouteItem } from './interfaces/route-item.interface';
import { WritableSignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/1-writable-signals/writable-signals.component';
import { UpdateSignalComponent } from './signals/level-1-interaction-with-signals/sub-levels/2-update-signal/update-signal.component';
import { ComputedSignalDynamicDependenciesComponent } from './signals/level-2-computed-signals/sub-levels/2-computed-signal-dynamic-dependencies/computed-signal-dynamic-dependencies.component';
import { ComputedSignalsLazilyEvaluatedMemoizedComponent } from './signals/level-2-computed-signals/sub-levels/3-computed-signals-lazily-evaluated-memoized/computed-signals-lazily-evaluated-memoized.component';
import { ComputedSignalsComponent } from './signals/level-2-computed-signals/sub-levels/1-computed-signals/computed-signals.component';
import { EffectComponent } from './signals/level-3-effect/sub-levels/1-effect/effect.component';
import { DestroyEffectComponent } from './signals/level-3-effect/sub-levels/2-interval-when-is-destroy/destroy-effect.component';
import { EffectDestroyComponent } from './signals/level-3-effect/sub-levels/5-effect-destroy/effect-destroy.component';
import { ReferenceEqualityComponent } from './signals/level-4-signal-equality-functions/sub-levels/1-reference-equality/reference-equality.component';
import { CustomEqualComponent } from './signals/level-4-signal-equality-functions/sub-levels/2-custom-equal/custom-equal.component';
import { WhatIsSignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/what-is-signals/what-is-signals.component';
import { CreateNewSignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/create-new-signals/create-new-signals.component';
import { TypesOfSignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/types-of-signals/types-of-signals.component';
import { ReadOnlySignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/read-only-signals/read-only-signals.component';
import { HtmlToTreeComponent } from './signals/level-0-introduction/sub-levels/html-to-tree/html-to-tree.component';
import { OldChangeDetectionComponent } from './signals/level-0-introduction/sub-levels/old-change-detection/old-change-detection.component';
import { SignalsChangeDetectionComponent } from './signals/level-0-introduction/sub-levels/signals-change-detection/signals-change-detection.component';
import { ManualSyncPainComponent } from './signals/level-0-introduction/sub-levels/manual-sync-pain/manual-sync-pain.component';
import { DomToPixelComponent } from './signals/level-0-introduction/sub-levels/dom-to-pixel/dom-to-pixel.component';
import { DomIsAliveComponent } from './signals/level-0-introduction/sub-levels/dom-is-alive/dom-is-alive.component';
import { VariablesComponent } from './signals/level-1-interaction-with-signals/sub-levels/variables/variables.component';
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
import { CartExampleComponent } from './practice/cart/cart-example.component';
import { IntegradaVistaComponent } from './integrada-vista/integrada-vista.component';

/**
 * Árbol de los 12 conceptos y sus sub-niveles. NO genera rutas: es la fuente de datos que la
 * vista integrada (`/`) consume para embeber el componente real de cada sub-nivel. Los niveles
 * no llevan componente propio: en la molécula el nivel es un átomo, no una página aparte.
 */
export const signalsRoutesTree: RouteItem[] = [
  {
    path: '0',
    subLevels: [
      { path: '1', title: 'El HTML es un árbol de nodos.', component: HtmlToTreeComponent },
      { path: '2', title: 'El DOM está vivo.', component: DomIsAliveComponent },
      { path: '3', title: 'No todo cambio cuesta lo mismo.', component: DomToPixelComponent },
      { path: '4', title: 'A mano, te olvidás un lugar.', component: ManualSyncPainComponent },
      { path: '5', title: 'Zone.js revisa todo el árbol.', component: OldChangeDetectionComponent },
      {
        path: '6',
        title: 'El signal avisa quién lo lee.',
        component: SignalsChangeDetectionComponent,
      },
    ],
  },
  {
    path: '1',
    subLevels: [
      { path: '1', title: 'Variables (repaso pre-signals)', component: VariablesComponent },
      { path: '2', title: 'Qué es un signal', component: WhatIsSignalsComponent },
      { path: '3', title: 'Tipos de signal', component: TypesOfSignalsComponent },
      { path: '4', title: 'Leer un signal: el getter ()', component: CreateNewSignalsComponent },
      { path: '5', title: 'Writable Signal', component: WritableSignalsComponent },
      { path: '6', title: 'Update Signal', component: UpdateSignalComponent },
      {
        path: '7',
        title: 'Read-only signals: asReadonly()',
        component: ReadOnlySignalsComponent,
      },
    ],
  },
  {
    path: '2',
    subLevels: [
      { path: '1', title: 'Computed signals', component: ComputedSignalsComponent },
      {
        path: '2',
        title: 'conditionalCount Recomputations',
        component: ComputedSignalDynamicDependenciesComponent,
      },
      {
        path: '3',
        title: 'Perezoso y memoizado',
        component: ComputedSignalsLazilyEvaluatedMemoizedComponent,
      },
    ],
  },
  {
    path: '3',
    subLevels: [
      { path: '1', title: 'Effect Execution', component: EffectComponent },
      { path: '2', title: 'Interval Evaluation', component: DestroyEffectComponent },
      { path: '3', title: 'Effect Evaluation', component: EffectDestroyComponent },
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
    ],
  },
  {
    path: '11',
    subLevels: [{ path: '1', title: 'Change detection sin Zone.js', component: ZonelessComponent }],
  },
];

export const routes: Routes = [
  { path: 'practica/carrito', component: CartExampleComponent },
  // La vista integrada (recorrido molécula) ES la raíz `/`: es la entrada.
  { path: '', component: IntegradaVistaComponent },
  // Cualquier URL desconocida (incluidos bookmarks viejos como /signals/level/..., /lab o /poc)
  // rebota a la raíz.
  { path: '**', redirectTo: '' },
];
