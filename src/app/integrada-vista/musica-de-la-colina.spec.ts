import { VUELTA, planDeLaColina } from './musica-de-la-colina';

describe('la música de la colina', () => {
  const plan = planDeLaColina();

  it('nada suena después de terminar la vuelta, salvo la cola de la cajita', () => {
    for (const n of plan) {
      expect(n.t).toBeLessThan(VUELTA);
      if (n.voz !== 'caja') expect(n.t + n.dura).toBeLessThanOrEqual(VUELTA);
    }
  });

  it('el grave y el acorde se relevan sin hueco: cada uno empieza cuando termina el anterior', () => {
    const graves = plan.filter((n) => n.voz === 'fondo');
    expect(graves[0].t).toBe(0);
    for (let i = 1; i < graves.length; i++) {
      expect(graves[i].t).toBe(graves[i - 1].t + graves[i - 1].dura);
    }
    expect(graves.at(-1)!.t + graves.at(-1)!.dura).toBe(VUELTA);
  });

  it('arranca en re menor y el último acorde no tiene tercera: no resuelve, y vuelve a empezar', () => {
    const primerAcorde = plan.filter((n) => n.voz === 'acorde' && n.t === 0).map((n) => n.hz);
    expect(primerAcorde).toContain(146.83);
    const ultimo = plan.filter((n) => n.voz === 'acorde' && n.t === (VUELTA * 3) / 4);
    expect(ultimo.length).toBe(4);
    const doSostenido = [138.59, 277.18, 554.37];
    for (const n of ultimo) expect(doSostenido).not.toContain(n.hz);
  });

  it('la cajita baja dentro de cada acorde', () => {
    const cajas = plan.filter((n) => n.voz === 'caja');
    for (let compas = 0; compas < 4; compas++) {
      const desde = (compas * VUELTA) / 4;
      const hz = cajas.filter((n) => n.t >= desde && n.t < desde + VUELTA / 4).map((n) => n.hz);
      for (let i = 1; i < hz.length; i++) expect(hz[i]).toBeLessThan(hz[i - 1]);
    }
  });

  it('va más bajo que la despedida: es fondo de una pantalla que espera', () => {
    for (const n of plan) expect(n.volumen).toBeLessThanOrEqual(0.045);
  });
});
