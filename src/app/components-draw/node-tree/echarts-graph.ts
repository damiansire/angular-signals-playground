/**
 * Build modular de ECharts con SOLO lo que el árbol de nodos usa: la serie `graph`, el tooltip y el
 * renderer de canvas.
 *
 * Existe como módulo aparte a propósito. `import('echarts')` trae los ~40 tipos de gráfico para
 * dibujar un único grafo, y hacer los `import('echarts/charts')` directamente dentro de la función
 * dinámica no arregla nada: importar el barrel en runtime trae el barrel entero, porque el bundler
 * no puede tree-shakear un namespace que se destructura recién al ejecutarse. Con los imports
 * ESTÁTICOS acá adentro sí puede, y este módulo entero se sigue cargando en diferido.
 *
 * `export *` reexporta la superficie de `echarts/core` (`init`, `use`, …), que es lo que ngx-echarts
 * espera recibir; el `use()` de acá arriba corre como efecto al evaluarse el módulo.
 */
import * as echarts from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([GraphChart, TooltipComponent, CanvasRenderer]);

export * from 'echarts/core';
