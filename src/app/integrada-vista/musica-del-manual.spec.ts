import { planDeLaColina } from './musica-de-la-colina';
import { PASOS_DEL_MANUAL, VUELTA_DEL_MANUAL, planDelManual } from './musica-del-manual';

describe('la música del manual', () => {
  const vueltas = Array.from({ length: 12 }, (_, n) => planDelManual(n));
  const sueltas = (plan: ReturnType<typeof planDelManual>) => plan.filter((n) => n.voz === 'caja');

  it('la misma vuelta suena siempre igual', () => {
    expect(planDelManual(3)).toEqual(planDelManual(3));
  });

  it('las notas sueltas cambian de una vuelta a la otra: la repetición no se nota', () => {
    const distintas = new Set(vueltas.map((v) => JSON.stringify(sueltas(v))));
    expect(distintas.size).toBeGreaterThan(8);
  });

  it('nada suena después de la vuelta, salvo la cola de las notas sueltas', () => {
    for (const plan of vueltas) {
      for (const n of plan) {
        expect(n.t).toBeLessThan(VUELTA_DEL_MANUAL);
        if (n.voz !== 'caja') expect(n.t + n.dura).toBeLessThanOrEqual(VUELTA_DEL_MANUAL);
      }
    }
  });

  it('el bajo se releva sin hueco y cierra justo en la vuelta', () => {
    const graves = planDelManual().filter((n) => n.voz === 'fondo');
    expect(graves[0].t).toBe(0);
    for (let i = 1; i < graves.length; i++) {
      expect(graves[i].t).toBe(graves[i - 1].t + graves[i - 1].dura);
    }
    expect(graves.at(-1)!.t + graves.at(-1)!.dura).toBe(VUELTA_DEL_MANUAL);
  });

  it('cada nota suelta es de su acorde, como mucho dos por acorde y nunca la misma seguida', () => {
    const compas = VUELTA_DEL_MANUAL / PASOS_DEL_MANUAL.length;
    for (const plan of vueltas) {
      const cajas = sueltas(plan);
      PASOS_DEL_MANUAL.forEach((p, i) => {
        const delAcorde = cajas.filter((n) => n.t >= i * compas && n.t < (i + 1) * compas);
        expect(delAcorde.length).toBeLessThanOrEqual(2);
        for (const n of delAcorde) expect(p.sueltas).toContain(n.hz);
      });
      for (let i = 1; i < cajas.length; i++) expect(cajas[i].hz).not.toBe(cajas[i - 1].hz);
    }
  });

  it('arranca en fa mayor, no en el re menor del zumbido y la colina', () => {
    const primero = planDelManual().filter((n) => n.voz === 'acorde' && n.t === 0);
    expect(primero.map((n) => n.hz)).toEqual([174.61, 220, 261.63, 329.63]);
  });

  it('va más baja que la colina en cada voz: es fondo para leer', () => {
    const colina = planDeLaColina();
    for (const voz of ['fondo', 'acorde', 'caja'] as const) {
      const tope = Math.max(...colina.filter((n) => n.voz === voz).map((n) => n.volumen));
      for (const plan of vueltas) {
        for (const n of plan.filter((m) => m.voz === voz)) expect(n.volumen).toBeLessThan(tope);
      }
    }
  });
});
