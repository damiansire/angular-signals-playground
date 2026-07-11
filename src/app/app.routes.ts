import { Routes } from '@angular/router';
import { Type } from '@angular/core';
import { WritableSignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/1-writable-signals/writable-signals.component';
import { UpdateSignalComponent } from './signals/level-1-interaction-with-signals/sub-levels/2-update-signal/update-signal.component';
import { RouteItem } from './components/component.interface';
import { InteractionWithSignalsComponent } from './signals/level-1-interaction-with-signals/interaction-with-signals.component';
import { ComputedSignalsLevelComponent } from './signals/level-2-computed-signals/computed-signals.component';
import { ComputedSignalDynamicDependenciesComponent } from './signals/level-2-computed-signals/sub-levels/2-computed-signal-dynamic-dependencies/computed-signal-dynamic-dependencies.component';
import { ComputedSignalsLazilyEvaluatedMemoizedComponent } from './signals/level-2-computed-signals/sub-levels/3-computed-signals-lazily-evaluated-memoized/computed-signals-lazily-evaluated-memoized.component';
import { ComputedSignalsComponent } from './signals/level-2-computed-signals/sub-levels/1-computed-signals/computed-signals.component';
import { EffectComponent } from './signals/level-3-effect/sub-levels/1-effect/effect.component';
import { DestroyEffectComponent } from './signals/level-3-effect/sub-levels/2-interval-when-is-destroy/destroy-effect.component';
import { EffectDestroyComponent } from './signals/level-3-effect/sub-levels/5-effect-destroy/effect-destroy.component';
import { SignalEqualityLevelComponent } from './signals/level-4-signal-equality-functions/signal-equality-level.component';
import { ReferenceEqualityComponent } from './signals/level-4-signal-equality-functions/sub-levels/1-reference-equality/reference-equality.component';
import { CustomEqualComponent } from './signals/level-4-signal-equality-functions/sub-levels/2-custom-equal/custom-equal.component';
import { EffectLevelComponent } from './signals/level-3-effect/effect-level.component';
import { WhatIsSignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/what-is-signals/what-is-signals.component';
import { CreateNewSignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/create-new-signals/create-new-signals.component';
import { TypesOfSignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/types-of-signals/types-of-signals.component';
import { ReadOnlySignalsComponent } from './signals/level-1-interaction-with-signals/sub-levels/read-only-signals/read-only-signals.component';
import { IntroductionComponent } from './signals/level-0-introduction/introduction.component';
import { HtmlToTreeComponent } from './signals/level-0-introduction/sub-levels/html-to-tree/html-to-tree.component';
import { OldChangeDetectionComponent } from './signals/level-0-introduction/sub-levels/old-change-detection/old-change-detection.component';
import { SignalsChangeDetectionComponent } from './signals/level-0-introduction/sub-levels/signals-change-detection/signals-change-detection.component';
import { VariableRefreshAndTreeComponent } from './signals/level-0-introduction/sub-levels/variable-refresh-and-tree/variable-refresh-and-tree.component';
import { VariablesComponent } from './signals/level-1-interaction-with-signals/sub-levels/variables/variables.component';
import { LinkedSignalLevelComponent } from './signals/level-5-linked-signal/linked-signal-level.component';
import { BasicLinkedSignalComponent } from './signals/level-5-linked-signal/sub-levels/1-basic-linked-signal/basic-linked-signal.component';
import { LinkedSignalWithSourceComponent } from './signals/level-5-linked-signal/sub-levels/2-linked-signal-with-source/linked-signal-with-source.component';
import { ResourceLevelComponent } from './signals/level-6-resource/resource-level.component';
import { ResourceBasicComponent } from './signals/level-6-resource/sub-levels/1-resource-basic/resource-basic.component';
import { RxResourceComponent } from './signals/level-6-resource/sub-levels/2-rx-resource/rx-resource.component';
import { SignalIoLevelComponent } from './signals/level-7-signal-io/signal-io-level.component';
import { InputOutputComponent } from './signals/level-7-signal-io/sub-levels/1-input-output/input-output.component';
import { ModelTwoWayComponent } from './signals/level-7-signal-io/sub-levels/2-model/model-two-way.component';
import { InputRequiredComponent } from './signals/level-7-signal-io/sub-levels/3-input-required/input-required.component';
import { QueriesInteropLevelComponent } from './signals/level-8-queries-interop/queries-interop-level.component';
import { ViewChildComponent } from './signals/level-8-queries-interop/sub-levels/1-view-child/view-child.component';
import { RxjsInteropComponent } from './signals/level-8-queries-interop/sub-levels/2-rxjs-interop/rxjs-interop.component';
import { ViewChildrenComponent } from './signals/level-8-queries-interop/sub-levels/3-view-children/view-children.component';
import { ContentQueriesComponent } from './signals/level-8-queries-interop/sub-levels/4-content-queries/content-queries.component';
import { AfterRenderLevelComponent } from './signals/level-9-after-render-effect/after-render-level.component';
import { AfterRenderEffectComponent } from './signals/level-9-after-render-effect/sub-levels/1-after-render-effect/after-render-effect.component';
import { OnCleanupComponent } from './signals/level-9-after-render-effect/sub-levels/2-on-cleanup/on-cleanup.component';
import { DebouncedLevelComponent } from './signals/level-10-debounced/debounced-level.component';
import { DebouncedRxjsComponent } from './signals/level-10-debounced/sub-levels/1-debounced-rxjs/debounced-rxjs.component';
import { DebouncedManualComponent } from './signals/level-10-debounced/sub-levels/2-debounced-manual/debounced-manual.component';
import { ZonelessLevelComponent } from './signals/level-11-zoneless/zoneless-level.component';
import { ZonelessComponent } from './signals/level-11-zoneless/sub-levels/1-zoneless/zoneless.component';
import { SignalFlowComponent } from './lab/instruments/signal-flow/signal-flow.component';
import { OscilloscopeComponent } from './lab/instruments/oscilloscope/oscilloscope.component';
import { ReactiveCellsComponent } from './lab/instruments/reactive-cells/reactive-cells.component';
import { ManualComponent } from './lab/instruments/manual/manual.component';
import { LabHubComponent } from './lab/lab-hub/lab-hub.component';
import { LandingComponent } from './landing/landing.component';
import { JourneyComponent } from './journey/journey.component';
import { CartExampleComponent } from './practice/cart/cart-example.component';

const signalsRoutesTree: RouteItem[] = [
  {
    path: '0',
    component: IntroductionComponent,
    subLevels: [
      { path: '1', component: HtmlToTreeComponent },
      { path: '2', component: VariableRefreshAndTreeComponent },
      { path: '3', component: OldChangeDetectionComponent },
      { path: '4', component: SignalsChangeDetectionComponent },
    ],
  },
  {
    path: '1',
    component: InteractionWithSignalsComponent,
    subLevels: [
      { path: '1', component: VariablesComponent },
      { path: '2', component: WhatIsSignalsComponent },
      { path: '3', component: TypesOfSignalsComponent },
      { path: '4', component: CreateNewSignalsComponent },
      { path: '5', component: WritableSignalsComponent },
      { path: '6', component: UpdateSignalComponent },
      { path: '7', component: ReadOnlySignalsComponent },
    ],
  },
  {
    path: '2',
    component: ComputedSignalsLevelComponent,
    subLevels: [
      { path: '1', component: ComputedSignalsComponent },
      { path: '2', component: ComputedSignalDynamicDependenciesComponent },
      { path: '3', component: ComputedSignalsLazilyEvaluatedMemoizedComponent },
    ],
  },
  {
    path: '3',
    component: EffectLevelComponent,
    subLevels: [
      { path: '1', component: EffectComponent },
      { path: '2', component: DestroyEffectComponent },
      { path: '3', component: EffectDestroyComponent },
    ],
  },
  {
    path: '4',
    component: SignalEqualityLevelComponent,
    subLevels: [
      { path: '1', component: ReferenceEqualityComponent },
      { path: '2', component: CustomEqualComponent },
    ],
  },
  {
    path: '5',
    component: LinkedSignalLevelComponent,
    subLevels: [
      { path: '1', component: BasicLinkedSignalComponent },
      { path: '2', component: LinkedSignalWithSourceComponent },
    ],
  },
  {
    path: '6',
    component: ResourceLevelComponent,
    subLevels: [
      { path: '1', component: ResourceBasicComponent },
      { path: '2', component: RxResourceComponent },
    ],
  },
  {
    path: '7',
    component: SignalIoLevelComponent,
    subLevels: [
      { path: '1', component: InputOutputComponent },
      { path: '2', component: ModelTwoWayComponent },
      { path: '3', component: InputRequiredComponent },
    ],
  },
  {
    path: '8',
    component: QueriesInteropLevelComponent,
    subLevels: [
      { path: '1', component: ViewChildComponent },
      { path: '2', component: RxjsInteropComponent },
      { path: '3', component: ViewChildrenComponent },
      { path: '4', component: ContentQueriesComponent },
    ],
  },
  {
    path: '9',
    component: AfterRenderLevelComponent,
    subLevels: [
      { path: '1', component: AfterRenderEffectComponent },
      { path: '2', component: OnCleanupComponent },
    ],
  },
  {
    path: '10',
    component: DebouncedLevelComponent,
    subLevels: [
      { path: '1', component: DebouncedRxjsComponent },
      { path: '2', component: DebouncedManualComponent },
    ],
  },
  {
    path: '11',
    component: ZonelessLevelComponent,
    subLevels: [{ path: '1', component: ZonelessComponent }],
  },
];

export interface CustomRoute {
  path: string;
  component?: Type<unknown>;
  id: string;
  subLevels: CustomRoute[];
}

function generateRoutes(routesTree: RouteItem[]) {
  let allRoutes: CustomRoute[] = [];
  const baseRoutes = [];
  for (const route of routesTree) {
    let relativeRoute = `signals/level/${route.path}`;
    const element: CustomRoute = {
      path: relativeRoute,
      component: route.component,
      id: route.path,
      subLevels: [],
    };
    relativeRoute = `${relativeRoute}/sub-level`;
    const subLevels =
      route.subLevels?.map((subLevel) => {
        return {
          path: `${relativeRoute}/${subLevel.path}`,
          component: subLevel.component,
          id: subLevel.path,
          subLevels: [],
        };
      }) || [];
    element.subLevels = subLevels;
    baseRoutes.push(element);
    allRoutes = [...allRoutes, element, ...subLevels];
  }
  return { allRoutes, baseRoutes };
}

const { allRoutes, baseRoutes } = generateRoutes(signalsRoutesTree);
export const routes: Routes = [
  ...allRoutes,
  // Lab multi-estética (instrumentos sobre el mismo banco)
  { path: 'lab', component: LabHubComponent },
  { path: 'lab/signal', component: SignalFlowComponent },
  { path: 'lab/effect', component: OscilloscopeComponent },
  { path: 'lab/computed', component: ReactiveCellsComponent },
  { path: 'lab/manual', component: ManualComponent },
  { path: 'recorrido', component: JourneyComponent },
  { path: 'practica/carrito', component: CartExampleComponent },
  { path: '', component: LandingComponent, pathMatch: 'full' },
];
export const menuItems = baseRoutes;
