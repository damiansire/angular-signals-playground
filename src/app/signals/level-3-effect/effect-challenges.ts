import { RepairChallenge } from '../../libs/repair-challenge';

/**
 * Los desafíos de cierre de los tres sub-niveles de `effect`. Van DESPUÉS de la explicación: cada
 * uno empuja un paso más allá de lo que el sub-nivel ya mostró, en vez de tomarle lección de lo
 * mismo. Los distractores son errores reales (leer el signal afuera, devolver la limpieza al estilo
 * React, confiar en DestroyRef para algo que corre en cada re-ejecución), no opciones de relleno.
 */

/** 3/1 · un effect solo reacciona a lo que LEE adentro de su función. */
export const EFFECT_READS_CHALLENGE: RepairChallenge = {
  symptom: 'Count1 sigue latiendo, pero el log quedó clavado en el primer valor.',
  brokenReadout: 'count 7 · último log 0',
  healthyReadout: 'count 7 · último log 7',
  pieces: [
    {
      code: 'const c = count();\neffect(() => {\n  console.log(c);\n});',
      why: 'Leer el signal ANTES del effect guarda un número, no una dependencia. Adentro no se lee nada reactivo, así que el effect corre una sola vez y se queda ahí.',
    },
    {
      code: 'effect(() => {\n  console.log(count());\n});',
      why: 'El effect se suscribe a lo que lee mientras corre. La lectura tiene que pasar adentro de su función: eso es lo que lo ata al signal.',
      repairs: true,
    },
    {
      code: 'effect(() => {\n  console.log(untracked(count));\n});',
      why: 'untracked lee el valor a propósito SIN registrar la dependencia. Sirve cuando querés mirar sin suscribirte, y acá es justo lo que corta la reacción.',
    },
  ],
};

/** 3/2 · el effect muere con el componente, el setInterval no. */
export const EFFECT_LEAK_CHALLENGE: RepairChallenge = {
  symptom: 'Destruiste el componente y el contador de evaluaciones sigue subiendo.',
  brokenReadout: 'componente destruido · intervalo vivo',
  healthyReadout: 'componente destruido · intervalo detenido',
  pieces: [
    {
      code: 'effect(() => {\n  const id = setInterval(tick, 1000);\n});',
      why: 'Ese es el estado actual. El effect arranca el intervalo y nadie lo apaga: al destruirse el componente el effect muere, pero el intervalo sigue latiendo solo.',
    },
    {
      code: 'effect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n});',
      why: 'Eso es useEffect de React. El effect de Angular ignora lo que devuelvas, así que el clearInterval nunca llega a correr.',
    },
    {
      code: 'effect((onCleanup) => {\n  const id = setInterval(tick, 1000);\n  onCleanup(() => clearInterval(id));\n});',
      why: 'onCleanup es el argumento que el propio effect te pasa para registrar su limpieza. Corre al destruirse el effect, que muere junto al componente.',
      repairs: true,
    },
  ],
};

/** 3/3 · onCleanup no corre solo al final: corre antes de CADA re-ejecución. */
export const EFFECT_CLEANUP_CHALLENGE: RepairChallenge = {
  symptom: 'Prendés y apagás Auto Refresh tres veces y quedan tres relojes latiendo a la vez.',
  brokenReadout: '3 intervalos vivos · 1 esperado',
  healthyReadout: '1 intervalo vivo · 1 esperado',
  pieces: [
    {
      code: 'const id = setInterval(tick, 1000);\ninject(DestroyRef).onDestroy(\n  () => clearInterval(id),\n);',
      why: 'DestroyRef limpia una sola vez, cuando muere el componente. Entre re-ejecuciones del effect no corre, así que los intervalos se siguen acumulando.',
    },
    {
      code: 'effect((onCleanup) => {\n  const id = setInterval(tick, 1000);\n  onCleanup(() => clearInterval(id));\n});',
      why: 'onCleanup corre antes de CADA re-ejecución del effect, no solo al final. Por eso el intervalo viejo se apaga antes de que nazca el nuevo.',
      repairs: true,
    },
    {
      code: 'effect(() => {\n  this.id = setInterval(tick, 1000);\n});\n\nngOnDestroy() {\n  clearInterval(this.id);\n}',
      why: 'ngOnDestroy corre al destruir el componente y para entonces `this.id` solo guarda el ÚLTIMO intervalo. Los anteriores quedaron sin referencia, latiendo para siempre.',
    },
  ],
};
