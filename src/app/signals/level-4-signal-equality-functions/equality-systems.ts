import { ManipulableChallenge, SystemState } from '../../libs/manipulable-challenge';

/**
 * Sistemas manipulables de `equality`. El nivel entero contesta la misma pregunta desde dos lados:
 * cuándo un signal considera que algo CAMBIÓ. Primero al no avisar de más (mutar en el lugar),
 * después al no avisar de menos (dos valores distintos que significan lo mismo).
 */

const ESCRITURA = 'escritura';
const COMPARACION = 'comparacion';

/**
 * 4/1 · un signal compara por referencia.
 *
 * Mutás el objeto adentro del update y lo devolvés: es el MISMO objeto, así que para el signal no
 * cambió nada y la vista no se entera. Hacer uno nuevo sí avisa. El contador de avisos clavado en
 * cero mientras los cambios suben es todo el argumento.
 */
export const REFERENCE_EQUALITY_SYSTEM: ManipulableChallenge = {
  knobs: [{ id: ESCRITURA, positions: 2, label: 'mutar el objeto o crear uno nuevo' }],
  gauges: [
    { id: 'cambios', label: 'cambios' },
    { id: 'avisos', label: 'avisos a la vista' },
  ],
  action: 'renombrar',
  start: { cambios: 0, avisos: 0 },

  code: (knobs) => {
    const nuevo = knobs[ESCRITURA] === 1;
    return [
      { text: 'user.update((u) => {' },
      nuevo
        ? { text: '  return { ...u, name: nextName() };', knob: ESCRITURA }
        : { text: '  u.name = nextName();', knob: ESCRITURA },
      // La versión que muta necesita devolver el mismo objeto aparte; la que crea uno nuevo ya
      // devolvió en la línea de arriba, así que el renglón no existe (no es código apagado).
      ...(nuevo ? [] : [{ text: '  return u;' }]),
      { text: '});' },
    ];
  },

  settle: (state: SystemState) => ({
    cambios: state.actions,
    // Mismo objeto = misma referencia = para el signal no pasó nada.
    avisos: state.knobs[ESCRITURA] === 1 ? state.actions : 0,
  }),

  healthy: (state: SystemState) =>
    state.actions > 0 && state.values['avisos'] === state.values['cambios'],

  establishes: 'Un signal compara por referencia: mutar en el lugar no avisa a nadie.',
};

/**
 * 4/2 · con `equal` propio, dos valores equivalentes no cuentan como cambio.
 *
 * El problema de espejo del anterior: acá el signal avisa DE MÁS. Cada carga trae una lista nueva
 * con el mismo contenido, y por referencia todas son distintas, así que todo lo que depende se
 * recalcula al pedo. Darle un criterio de igualdad propio lo corta.
 */
export const CUSTOM_EQUAL_SYSTEM: ManipulableChallenge = {
  knobs: [{ id: COMPARACION, positions: 2, label: 'cambiar con qué criterio compara el signal' }],
  gauges: [
    { id: 'cargas', label: 'cargas' },
    { id: 'recalculos', label: 'recálculos' },
  ],
  action: 'volver a cargar lo mismo',
  start: { cargas: 0, recalculos: 0 },

  code: (knobs) => {
    const propio = knobs[COMPARACION] === 1;
    return [
      propio
        ? { text: 'const items = signal(cargar(), {', knob: COMPARACION }
        : { text: 'const items = signal(cargar());', knob: COMPARACION },
      // Sin criterio propio esos dos renglones no existen, no es que estén apagados.
      ...(propio ? [{ text: '  equal: mismoContenido,' }, { text: '});' }] : []),
      { text: '' },
      { text: 'const total = computed(() => items().length);' },
    ];
  },

  settle: (state: SystemState) => ({
    cargas: state.actions,
    // Con criterio propio solo cuenta la primera: las siguientes traen lo mismo.
    recalculos: state.knobs[COMPARACION] === 1 ? Math.min(state.actions, 1) : state.actions,
  }),

  // Con una sola carga no hay nada que notar: el desperdicio aparece recién al repetir.
  healthy: (state: SystemState) => state.actions >= 2 && state.values['recalculos'] === 1,

  establishes: 'Con un equal propio, dos valores equivalentes dejan de contar como cambio.',
};
