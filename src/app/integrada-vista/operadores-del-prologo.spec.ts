import {
  act,
  healthOf,
  malformed,
  solutionFor,
  startOf,
  turn,
  type ManipulableChallenge,
  type SystemState,
} from '../libs/manipulable-challenge';
import { HUECOS_DEL_PROLOGO } from './operadores-del-prologo';

/** La corrida limpia con la perilla en `posicion`, accionada `veces`. */
function corrida(sistema: ManipulableChallenge, posicion: number, veces: number): SystemState {
  const id = sistema.knobs[0].id;
  let s = startOf(sistema);
  for (let i = 0; i < posicion; i++) s = turn(sistema, s, id);
  for (let i = 0; i < veces; i++) s = act(sistema, s);
  return s;
}

/** Las posiciones con las que alguna corrida corta queda sana. */
function sanas(sistema: ManipulableChallenge): number[] {
  return [0, 1, 2].filter((p) =>
    [1, 2, 3, 4].some((n) => healthOf(sistema, corrida(sistema, p, n)) === 'healthy'),
  );
}

describe('los huecos del minijuego de operadores', () => {
  it('son tres, uno por nave, en el orden de la flota', () => {
    expect(HUECOS_DEL_PROLOGO.map((h) => h.nave)).toEqual([0, 1, 2]);
  });

  HUECOS_DEL_PROLOGO.forEach(({ titulo, operador, sistema }) => {
    describe(titulo, () => {
      it('cumple la forma de los demás desafíos', () => {
        expect(malformed(sistema)).toEqual([]);
      });

      it('se puede resolver', () => {
        expect(solutionFor(sistema)).not.toBeNull();
      });

      it('se elige entre tres operadores, y la primera opción es una de las rotas', () => {
        expect(sistema.knobs[0].positions).toBe(3);
        expect(sanas(sistema)).not.toContain(0);
      });

      it('lo arregla un solo operador, y es el que dispara la nave', () => {
        const [sana] = sanas(sistema);
        expect(sanas(sistema).length).toBe(1);
        const renglon = sistema
          .code({ [sistema.knobs[0].id]: sana })
          .find((l) => l.knob)!
          .text.trim();
        expect(renglon.startsWith(`${operador}(`)).toBeTrue();
      });

      it('el hueco cambia de operador y el resto del renglón queda igual', () => {
        const resto = [0, 1, 2].map((p) =>
          sistema
            .code({ [sistema.knobs[0].id]: p })
            .find((l) => l.knob)!
            .text.replace(/^\s*\w+/, ''),
        );
        expect(new Set(resto).size).toBe(1);
      });

      it('girar después de accionar no deja sano: el código nuevo vuelve a correr', () => {
        const id = sistema.knobs[0].id;
        let s = corrida(sistema, 0, 3);
        for (let p = 1; p < 3; p++) {
          s = turn(sistema, s, id);
          expect(healthOf(sistema, s)).not.toBe('healthy');
        }
      });
    });
  });

  it('map con el índice no se confunde con acumular: dos encendidos ya lo delatan', () => {
    const empuje = HUECOS_DEL_PROLOGO[1].sistema;
    expect(healthOf(empuje, corrida(empuje, 1, 1))).toBe('idle');
    expect(healthOf(empuje, corrida(empuje, 1, 2))).toBe('broken');
    expect(healthOf(empuje, corrida(empuje, 2, 2))).toBe('healthy');
  });
});
