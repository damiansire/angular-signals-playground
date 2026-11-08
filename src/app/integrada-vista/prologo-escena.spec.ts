import { GUION, anclajesDe, armarReloj } from './prologo-guion';
import {
  CX,
  CY,
  FORMACION,
  OPERADORES,
  PIPES,
  RADIO,
  bala,
  bolas,
  circulos,
  crecimiento,
  esquive,
  exploradora,
  formacionAfuera,
  fusionEn,
  mascota,
  momentosDe,
  naveAdentro,
  proyectiles,
  sincronia,
  zoom,
} from './prologo-escena';
import { emergentCircleCenter } from './tusi-math';

const reloj = armarReloj(GUION);
const T = anclajesDe(reloj);
const M = momentosDe(reloj);
const distancia = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

/** Muestras cada 50 ms de un tramo, para afirmar sobre toda la curva y no sobre un punto. */
const muestras = (t0: number, t1: number, paso = 50): number[] =>
  Array.from({ length: Math.floor((t1 - t0) / paso) + 1 }, (_, i) => t0 + i * paso);

describe('prologo-escena', () => {
  describe('afuera', () => {
    it('el arrastre arranca donde terminó el crucero: la formación no salta', () => {
      const antes = formacionAfuera(T.anomalia - 1, T);
      const despues = formacionAfuera(T.anomalia + 1, T);
      expect(distancia(antes, despues)).toBeLessThan(2);
    });

    it('al salto la formación ya entró en la luz: chica, apagada y en el centro', () => {
      const f = formacionAfuera(T.zoom, T);
      expect(f.s).toBeLessThan(0.15);
      expect(f.a).toBe(0);
      expect(distancia(f, { x: CX, y: CY })).toBeLessThan(5);
    });

    it('el temblor se siente antes de que alguien pregunte qué pasa', () => {
      const pregunta = reloj.find((l) => l.id === 'anom-que-pasa')!.t0;
      expect(formacionAfuera(pregunta, T).sacude).toBeGreaterThan(2);
    });

    it('a la exploradora la anomalía nunca la agarra', () => {
      for (const t of muestras(0, T.zoom)) {
        expect(distancia(exploradora(t, T, M), { x: CX, y: CY }))
          .withContext(`t=${t}`)
          .toBeGreaterThan(150);
      }
    });

    it('cuando dice "apúrense" vuelve a buscarlos y pasa cerca de ellos', () => {
      const medio = (M.vuelta.t0 + M.vuelta.t1) / 2;
      const ella = exploradora(medio, T, M);
      const lider = formacionAfuera(medio, T);
      const antes = exploradora(M.vuelta.t0 - 1, T, M);
      expect(distancia(ella, lider)).toBeLessThan(distancia(antes, lider));
      expect(distancia(exploradora(M.vuelta.t1 + 1, T, M), exploradora(M.vuelta.t1 - 1, T, M)))
        .withContext('al terminar la vuelta retoma su camino sin salto')
        .toBeLessThan(4);
    });

    it('la anomalía crece hasta tapar la pantalla en el salto', () => {
      expect(crecimiento(0, T)).toBeLessThan(0.3);
      expect(crecimiento(T.zoom + 400, T)).toBeGreaterThan(4);
    });

    it('los operadores salen de su nave y se apagan sin tocar la anomalía', () => {
      for (const [tanda, desde] of [
        [OPERADORES, M.rxjs],
        [PIPES, M.pipes],
      ] as const) {
        const fin = desde + tanda[tanda.length - 1].d + 1400;
        for (const t of muestras(desde, fin, 40)) {
          for (const p of proyectiles(t, tanda, desde, T)) {
            expect(distancia(p, { x: CX, y: CY })).toBeGreaterThan(80);
            if (p.p > 0.98) expect(p.vida).toBeLessThan(0.06);
          }
        }
      }
    });

    it('nunca hay más de dos nombres de operador legibles a la vez', () => {
      const fin = M.rxjs + OPERADORES[OPERADORES.length - 1].d + 1400;
      for (const t of muestras(M.rxjs, fin, 40)) {
        const legibles = proyectiles(t, OPERADORES, M.rxjs, T).filter((p) => p.vida > 0.3);
        expect(legibles.length).withContext(`t=${t}`).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('adentro', () => {
    it('la bola del grito pasa por donde derivan las naves', () => {
      let mas = Infinity;
      for (const t of muestras(M.bala.t0, M.bala.t1, 10)) {
        const b = bala(t, M);
        const n = naveAdentro(0, t, T, M);
        if (b && n) mas = Math.min(mas, distancia(b, n));
      }
      expect(mas).toBeLessThan(150);
    });

    it('esquivar empuja lejos de la bola, no hacia ella', () => {
      const e = esquive({ x: 100, y: 100 }, [{ x: 140, y: 100 }]);
      expect(e.x).toBeLessThan(0);
      expect(Math.abs(e.y)).toBeLessThan(1e-9);
      expect(esquive({ x: 0, y: 0 }, [{ x: 900, y: 0 }]).x).toBe(0);
    });

    it('al choque los dos núcleos se encuentran en el centro', () => {
      const f = fusionEn(T.choque, T)!;
      expect(distancia(f.a, f.b)).toBeLessThan(1);
      expect(distancia(f.a, { x: CX, y: CY })).toBeLessThan(1);
    });

    it('la mascota nace en el choque, ni un cuadro antes', () => {
      expect(mascota(T.choque - 1, T)).toBeNull();
      const m = mascota(T.choque, T)!;
      expect(distancia(m, { x: CX, y: CY })).toBeLessThan(1);
    });

    it('después del choque rodean a la mascota mirándola', () => {
      const t = T.choque + 4000;
      const m = mascota(t, T)!;
      for (const i of FORMACION.keys()) {
        const n = naveAdentro(i, t, T, M)!;
        expect(Math.sign(m.x - n.x))
          .withContext(`nave ${i}`)
          .toBe(n.mira);
        expect(n.suelta).toBe(0);
      }
    });

    it('al final salen todas de cuadro', () => {
      for (const i of FORMACION.keys()) {
        const n = naveAdentro(i, T.orden + 3300, T, M)!;
        expect(n.a).toBe(0);
      }
    });
  });

  describe('el final', () => {
    it('sincronizadas, las bolas caen exactamente sobre el par de Tusi', () => {
      const t = T.orden + 5000;
      expect(sincronia(t, T)).toBe(1);
      const radio = RADIO * zoom(t, T);
      const ph = t * 0.0011;
      for (const b of bolas(t, radio, 1, null)) {
        const centro = emergentCircleCenter(radio, ph, CX, CY, b.signo);
        expect(distancia(b, centro)).toBeCloseTo(radio / 2, 6);
      }
    });

    it('los círculos aparecen recién después de la sincronía', () => {
      expect(circulos(T.orden + 2600, T)).toBe(0);
      expect(sincronia(T.orden + 2600, T)).toBeGreaterThan(0.5);
      expect(circulos(T.fin, T)).toBe(1);
    });

    it('la cámara se aleja hasta ver la figura entera', () => {
      expect(zoom(T.orden, T)).toBeGreaterThan(2);
      expect(zoom(T.fin, T)).toBeCloseTo(0.88, 5);
    });
  });
});
