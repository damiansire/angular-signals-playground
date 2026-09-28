import {
  act,
  healthOf,
  ManipulableChallenge,
  solutionFor,
  startOf,
  SystemState,
  turn,
} from './manipulable-challenge';
import * as nivel0 from '../signals/level-0-introduction/introduction-systems';
import * as nivel1 from '../signals/level-1-interaction-with-signals/signals-systems';
import * as nivel2 from '../signals/level-2-computed-signals/computed-systems';
import * as nivel3 from '../signals/level-3-effect/effect-systems';
import * as nivel4 from '../signals/level-4-signal-equality-functions/equality-systems';
import * as nivel5 from '../signals/level-5-linked-signal/linked-systems';
import * as nivel6 from '../signals/level-6-resource/resource-systems';
import * as nivel7 from '../signals/level-7-signal-io/io-systems';
import * as nivel8 from '../signals/level-8-queries-interop/queries-systems';
import * as nivel9 from '../signals/level-9-after-render-effect/after-render-systems';
import * as nivel10 from '../signals/level-10-debounced/debounce-systems';
import * as nivel11 from '../signals/level-11-zoneless/zoneless-systems';

/**
 * Barrido de los 37 cierres contra la regla de la corrida: mover la perilla es cambiar el código, y
 * eso arranca una corrida nueva. El bug que esto cuida no rompía nada a la vista: accionabas con el
 * código roto, girabas al sano, y las lecturas pasaban a sanas como si las acciones viejas hubieran
 * corrido con el código nuevo. Los 37 lo tenían, porque cada settle se escribe a mano y ninguno
 * sabía que el giro lo iba a re-correr con las acciones de antes.
 */

// Por módulo y con el archivo en el nombre: esparcir todo en un solo objeto pisaba en silencio a
// dos sistemas que se exportaran con el mismo nombre desde niveles distintos.
const MODULOS: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  'nivel 0': nivel0,
  'nivel 1': nivel1,
  'nivel 2': nivel2,
  'nivel 3': nivel3,
  'nivel 4': nivel4,
  'nivel 5': nivel5,
  'nivel 6': nivel6,
  'nivel 7': nivel7,
  'nivel 8': nivel8,
  'nivel 9': nivel9,
  'nivel 10': nivel10,
  'nivel 11': nivel11,
};

const SISTEMAS: readonly (readonly [string, ManipulableChallenge])[] = Object.entries(
  MODULOS,
).flatMap(([nivel, modulo]) =>
  Object.entries(modulo).map(
    ([nombre, sistema]) => [`${nivel} ${nombre}`, sistema as ManipulableChallenge] as const,
  ),
);

/** El umbral más alto que pide un desafío hoy es 3 acciones seguidas; 5 deja margen sin tapar nada. */
const MAX_ACCIONES = 5;

function accionar(sistema: ManipulableChallenge, desde: SystemState, veces: number): SystemState {
  let state = desde;
  for (let i = 0; i < veces; i++) state = act(sistema, state);
  return state;
}

/** Gira hasta `posicion` y devuelve cada estado por el que pasó, no solo el último. */
function girarHasta(
  sistema: ManipulableChallenge,
  desde: SystemState,
  posicion: number,
): readonly SystemState[] {
  const id = sistema.knobs[0].id;
  const recorrido: SystemState[] = [];
  let state = desde;
  do {
    state = turn(sistema, state, id);
    recorrido.push(state);
  } while (state.knobs[id] !== posicion);
  return recorrido;
}

/** Cuántas acciones de una corrida pide para quedar sana, o `null` si con ese código no llega. */
function accionesHastaSano(sistema: ManipulableChallenge, corrida: SystemState): number | null {
  let state = corrida;
  for (let n = 1; n <= MAX_ACCIONES; n++) {
    state = act(sistema, state);
    if (healthOf(sistema, state) === 'healthy') return n;
  }
  return null;
}

/** Las posiciones de la perilla con las que una corrida limpia llega a quedar sana. */
function posicionesSanas(sistema: ManipulableChallenge): readonly number[] {
  const inicio = startOf(sistema);
  return Array.from({ length: sistema.knobs[0].positions }, (_, p) => p).filter((p) => {
    const corrida = p === 0 ? inicio : girarHasta(sistema, inicio, p).at(-1)!;
    return accionesHastaSano(sistema, corrida) !== null;
  });
}

/** Todo estado al que se llega con hasta `pasos` gestos, sin repetidos. */
function alcanzables(sistema: ManipulableChallenge, pasos: number): readonly SystemState[] {
  const clave = (s: SystemState) => JSON.stringify([s.knobs, s.actions, s.values]);
  const inicio = startOf(sistema);
  const vistos = new Map<string, SystemState>([[clave(inicio), inicio]]);
  let frontera: readonly SystemState[] = [inicio];
  for (let paso = 0; paso < pasos; paso++) {
    const siguiente: SystemState[] = [];
    for (const s of frontera) {
      for (const candidato of [
        act(sistema, s),
        ...sistema.knobs.map((k) => turn(sistema, s, k.id)),
      ]) {
        if (vistos.has(clave(candidato))) continue;
        vistos.set(clave(candidato), candidato);
        siguiente.push(candidato);
      }
    }
    frontera = siguiente;
  }
  return [...vistos.values()];
}

describe('barrido de los 37 sistemas: cambiar el código arranca otra corrida', () => {
  // Contar lo barrido: un módulo que deja de exportar, o un sistema que cambia de forma, no puede
  // achicar el barrido sin que nadie se entere.
  it('barre los 37, sin perder ninguno en el camino', () => {
    expect(SISTEMAS.length).toBe(37);
  });

  SISTEMAS.forEach(([nombre, sistema]) => {
    describe(nombre, () => {
      it('sigue siendo resoluble', () => {
        expect(solutionFor(sistema)).not.toBeNull();
      });

      it('girar nunca lo deja sano: después de cada giro hay que volver a accionar', () => {
        const colados = alcanzables(sistema, 6).flatMap((s) =>
          sistema.knobs
            .map((k) => turn(sistema, s, k.id))
            .filter((girado) => healthOf(sistema, girado) !== 'idle'),
        );
        expect(colados).toEqual([]);
      });

      // El caso que se vio en vivo (6/1, 2/3): accionar con el código roto y girar al sano.
      it('lo accionado con el código roto no se cura al girar al sano', () => {
        const sanas = posicionesSanas(sistema);
        expect(sanas.length).withContext('ninguna posición llega a sano').toBeGreaterThan(0);

        for (const veces of [1, 2, 3]) {
          const roto = accionar(sistema, startOf(sistema), veces);
          expect(healthOf(sistema, roto)).withContext(`roto tras ${veces}`).toBe('broken');

          for (const posicion of sanas) {
            const contexto = `${veces} acciones rotas y giro a ${posicion}`;
            const recorrido = girarHasta(sistema, roto, posicion);
            const girado = recorrido.at(-1)!;
            const limpio = girarHasta(sistema, startOf(sistema), posicion).at(-1)!;

            expect(recorrido.map((s) => healthOf(sistema, s)))
              .withContext(contexto)
              .toEqual(recorrido.map(() => 'idle'));
            // Que la corrida nueva sea idéntica a una que nunca pasó por el código roto es lo que
            // prueba que el daño viejo no se filtró a las lecturas, ni para curar ni para empeorar.
            expect(girado.values).withContext(contexto).toEqual(limpio.values);
            expect(accionesHastaSano(sistema, girado)).withContext(contexto).not.toBeNull();
          }
        }
      });

      // Volver al código de arranque es volver a arrancar: si no, la primera corrida y una corrida
      // del mismo código mostrarían números distintos.
      it('un ciclo completo de la perilla vuelve exacto al arranque', () => {
        const inicio = startOf(sistema);
        expect(girarHasta(sistema, inicio, 0).at(-1)).toEqual(inicio);
      });
    });
  });
});
