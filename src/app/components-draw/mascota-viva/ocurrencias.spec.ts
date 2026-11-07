import {
  ESPERA_MAX_MS,
  ESPERA_MIN_MS,
  OCURRENCIAS,
  elegirOcurrencia,
  esperaHastaLaProxima,
  type Ocurrencia,
} from './ocurrencias';

describe('ocurrencias de la mascota', () => {
  const tiradas = Array.from({ length: 200 }, (_, i) => i / 200);

  it('nunca repite la anterior', () => {
    for (const anterior of OCURRENCIAS) {
      for (const t of tiradas) expect(elegirOcurrencia(anterior, t)).not.toBe(anterior);
    }
  });

  it('nunca repite la anterior, tampoco sentada', () => {
    for (const anterior of OCURRENCIAS) {
      for (const t of tiradas) expect(elegirOcurrencia(anterior, t, true)).not.toBe(anterior);
    }
  });

  it('parada aparecen todas las suyas, y ninguna de sentada', () => {
    const vistas = new Set<Ocurrencia>(tiradas.map((t) => elegirOcurrencia(null, t)));
    expect([...vistas].sort()).toEqual(
      (
        [
          'cambiarPeso',
          'estirarse',
          'mirarAlrededor',
          'mirarIdea',
          'saludo',
          'saltito',
        ] as Ocurrencia[]
      ).sort(),
    );
  });

  it('sentada, pensativa, solo hace lo tranquilo: nada que la levante', () => {
    const vistas = new Set<Ocurrencia>(tiradas.map((t) => elegirOcurrencia(null, t, true)));
    expect([...vistas].sort()).toEqual(
      (['balancearPies', 'mirarAlrededor', 'mirarIdea', 'mirarLejos'] as Ocurrencia[]).sort(),
    );
  });

  it('lo chico pasa más seguido que saludar', () => {
    const cuenta = (o: Ocurrencia) => tiradas.filter((t) => elegirOcurrencia(null, t) === o).length;
    expect(cuenta('mirarIdea')).toBeGreaterThan(cuenta('saludo'));
  });

  it('una tirada fuera de rango no rompe la elección', () => {
    expect(OCURRENCIAS).toContain(elegirOcurrencia('saludo', 1));
    expect(OCURRENCIAS).toContain(elegirOcurrencia('saludo', -3));
  });

  it('la espera queda entre el mínimo y el máximo', () => {
    for (const t of [0, 0.25, 0.5, 0.999]) {
      const ms = esperaHastaLaProxima(t);
      expect(ms).toBeGreaterThanOrEqual(ESPERA_MIN_MS);
      expect(ms).toBeLessThanOrEqual(ESPERA_MAX_MS);
    }
  });
});
