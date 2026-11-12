import { Routes } from '@angular/router';
import { IntegradaVistaComponent } from './integrada-vista/integrada-vista.component';

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
